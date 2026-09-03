import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { waitUntil } from "base44:runtime";
import { buildLookupKey, fetchRealRoute, haversineFallback, roundCoord } from "../../shared/routing.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = await req.json();

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return Response.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const lookup_key = buildLookupKey(origin_lat, origin_lng, destination_lat, destination_lng);

    // 1) Cache lookup — instant if found
    try {
      const cached = await base44.asServiceRole.entities.RouteDistance.filter({ lookup_key }, undefined, 1);
      if (cached && cached.length > 0) {
        const c = cached[0];
        return Response.json({
          distance_km: c.distance_km,
          duration_minutes: c.duration_minutes,
          distance_text: `${c.distance_km} km`,
          duration_text: `${c.duration_minutes} min`,
          source: "cache",
        });
      }
    } catch (e) {
      console.log("Cache lookup error:", e.message);
    }

    // 2) Real routing — OSRM then Google
    const real = await fetchRealRoute(origin_lat, origin_lng, destination_lat, destination_lng);
    if (real) {
      // Store in cache for future calls (fire-and-forget)
      waitUntil(
        base44.asServiceRole.entities.RouteDistance.create({
          lookup_key,
          origin_lat: roundCoord(origin_lat),
          origin_lng: roundCoord(origin_lng),
          destination_lat: roundCoord(destination_lat),
          destination_lng: roundCoord(destination_lng),
          distance_km: real.distance_km,
          duration_minutes: real.duration_minutes,
          source: real.source,
        }).catch((e) => console.log("Cache store error:", e.message))
      );
      return Response.json({
        distance_km: real.distance_km,
        duration_minutes: real.duration_minutes,
        distance_text: `${real.distance_km} km`,
        duration_text: `${real.duration_minutes} min`,
        source: real.source,
      });
    }

    // 3) Haversine fallback — not cached (approximate)
    const fallback = haversineFallback(origin_lat, origin_lng, destination_lat, destination_lng);
    return Response.json({
      distance_km: fallback.distance_km,
      duration_minutes: fallback.duration_minutes,
      distance_text: `${fallback.distance_km} km`,
      duration_text: `${fallback.duration_minutes} min`,
      source: "haversine",
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}