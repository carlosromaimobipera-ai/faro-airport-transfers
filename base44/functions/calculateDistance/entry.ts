import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { waitUntil } from "base44:runtime";
import {
  buildLookupKey,
  fetchRealRoute,
  haversineFallback,
  haversineFallbackPath,
  isPlausibleRouteDistance,
  roundCoord,
} from "../../shared/routing.ts";

type Point = { lat: number; lng: number };

// Aceita 0 como coordenada válida (só rejeita valores ausentes ou não numéricos)
function toPoint(lat: any, lng: any): Point | null {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return null;
  if (lat === "" || lng === "") return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return null;
  return { lat: la, lng: ln };
}

function respond(distance_km: number, duration_minutes: number, source: string, approximate: boolean) {
  return Response.json({
    distance_km,
    duration_minutes,
    distance_text: `${distance_km} km`,
    duration_text: `${duration_minutes} min`,
    source,
    approximate,
  });
}

export default async function(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));

    // Duas formas de pedir: origem + destino, ou uma lista de pontos (rota com paragens)
    let points: Point[] = [];
    if (Array.isArray(body?.points) && body.points.length >= 2) {
      points = body.points
        .map((p: any) => toPoint(p?.lat, p?.lng))
        .filter((p: Point | null): p is Point => !!p);
    } else {
      const origin = toPoint(body?.origin_lat, body?.origin_lng);
      const destination = toPoint(body?.destination_lat, body?.destination_lng);
      if (origin && destination) points = [origin, destination];
    }

    if (points.length < 2) {
      return Response.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const origin = points[0];
    const destination = points[points.length - 1];
    const waypoints = points.slice(1, -1);

    const base44 = createClientFromRequest(req);
    const lookup_key = buildLookupKey(origin.lat, origin.lng, destination.lat, destination.lng);

    // 1) Cache — só para rotas diretas e apenas se o valor bater com esta rota
    if (waypoints.length === 0) {
      try {
        const cached = await base44.asServiceRole.entities.RouteDistance.filter({ lookup_key }, undefined, 1);
        const entry = cached && cached.length > 0 ? cached[0] : null;
        // Só valores do Google Maps: entradas antigas de outros serviços podem estar erradas
        if (entry && entry.source === "google" && isPlausibleRouteDistance(entry.distance_km, points)) {
          return respond(entry.distance_km, entry.duration_minutes, "cache", false);
        }
      } catch (e) {
        console.log("Cache lookup error:", e.message);
      }
    }

    // 2) Rotas reais — OSRM e, em alternativa, Google
    const real = await fetchRealRoute(origin.lat, origin.lng, destination.lat, destination.lng, waypoints);
    if (real && isPlausibleRouteDistance(real.distance_km, points)) {
      if (waypoints.length === 0) {
        waitUntil(
          base44.asServiceRole.entities.RouteDistance.create({
            lookup_key,
            origin_lat: roundCoord(origin.lat),
            origin_lng: roundCoord(origin.lng),
            destination_lat: roundCoord(destination.lat),
            destination_lng: roundCoord(destination.lng),
            distance_km: real.distance_km,
            duration_minutes: real.duration_minutes,
            source: real.source,
          }).catch((e) => console.log("Cache store error:", e.message))
        );
      }
      return respond(real.distance_km, real.duration_minutes, real.source, false);
    }

    // 3) Estimativa em linha reta (ao longo da rota) — marcada como aproximada, nunca em cache
    const fallback = waypoints.length > 0
      ? haversineFallbackPath(points)
      : haversineFallback(origin.lat, origin.lng, destination.lat, destination.lng);
    return respond(fallback.distance_km, fallback.duration_minutes, fallback.source, true);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}