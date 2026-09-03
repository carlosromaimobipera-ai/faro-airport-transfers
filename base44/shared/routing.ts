import { secrets } from "base44:runtime";

export function roundCoord(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function buildLookupKey(oLat: number, oLng: number, dLat: number, dLng: number): string {
  return `${roundCoord(oLat)},${roundCoord(oLng)}|${roundCoord(dLat)},${roundCoord(dLng)}`;
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function haversineFallback(oLat: number, oLng: number, dLat: number, dLng: number) {
  const straight = haversineKm(oLat, oLng, dLat, dLng);
  const distance_km = Math.round(straight * 1.35 * 100) / 100;
  const duration_minutes = Math.ceil((distance_km / 80) * 60);
  return { distance_km, duration_minutes, source: "haversine" };
}

export async function fetchRealRoute(
  oLat: number, oLng: number, dLat: number, dLng: number
): Promise<{ distance_km: number; duration_minutes: number; source: string } | null> {
  // Primary: OSRM (free, no key, real road routing)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`;
    const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
    const osrmData = await osrmRes.json();
    if (osrmData.code === "Ok" && osrmData.routes?.length > 0) {
      const route = osrmData.routes[0];
      const distance_km = Math.round((route.distance / 1000) * 100) / 100;
      const duration_minutes = Math.ceil(route.duration / 60);
      return { distance_km, duration_minutes, source: "osrm" };
    }
  } catch (e) {
    console.log("OSRM error:", e.message);
  }

  // Secondary: Google Routes API
  const mapsKey = secrets.get("GOOGLE_MAPS_SERVER_KEY");
  if (mapsKey) {
    try {
      const routesRes = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": mapsKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: oLat, longitude: oLng } } },
          destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_UNAWARE",
        }),
        signal: AbortSignal.timeout(8000),
      });
      const routesData = await routesRes.json();
      if (routesData.routes?.length > 0) {
        const route = routesData.routes[0];
        const distance_km = Math.round((route.distanceMeters / 1000) * 100) / 100;
        const duration_minutes = Math.ceil(parseInt(route.duration) / 60);
        return { distance_km, duration_minutes, source: "google" };
      }
    } catch (e) {
      console.log("Routes API error:", e.message);
    }
  }

  return null;
}

// Localizações pré-definidas para pré-cálculo (espelha src/lib/transferData.js)
export const COMMON_LOCATIONS = [
  { id: "fao", name: "Aeroporto de Faro (FAO)", coords: { lat: 37.0144, lng: -7.9699 }, type: "airport" },
  { id: "lis", name: "Aeroporto de Lisboa", coords: { lat: 38.6747, lng: -9.1283 }, type: "airport" },
  { id: "svq", name: "Aeroporto de Sevilha (SVQ)", coords: { lat: 37.4174, lng: -5.8892 }, type: "airport" },
  { id: "faro_center", name: "Centro de Faro", coords: { lat: 37.0194, lng: -7.9322 }, type: "city" },
  { id: "vilamoura", name: "Vilamoura", coords: { lat: 37.0662, lng: -8.1212 }, type: "city" },
  { id: "albufeira", name: "Albufeira", coords: { lat: 37.0901, lng: -8.2506 }, type: "city" },
  { id: "armacao", name: "Armação de Pêra", coords: { lat: 37.0845, lng: -8.3642 }, type: "city" },
  { id: "lagos", name: "Lagos", coords: { lat: 37.1063, lng: -8.6705 }, type: "city" },
  { id: "portimao", name: "Portimão", coords: { lat: 37.1412, lng: -8.5292 }, type: "city" },
  { id: "silves", name: "Silves", coords: { lat: 37.2425, lng: -8.4384 }, type: "city" },
  { id: "tavira", name: "Tavira", coords: { lat: 36.9625, lng: -7.6533 }, type: "city" },
  { id: "lis_center", name: "Centro de Lisboa", coords: { lat: 38.7223, lng: -9.1393 }, type: "city" },
  { id: "seville_center", name: "Centro de Sevilha", coords: { lat: 37.386, lng: -5.9844 }, type: "city" },
];