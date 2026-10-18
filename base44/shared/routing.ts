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

// Estimativa em linha reta: usada apenas quando NENHUM serviço de rotas responde.
// Fica marcada como aproximada para nunca ser apresentada como distância exata.
export function haversineFallback(oLat: number, oLng: number, dLat: number, dLng: number) {
  const straight = haversineKm(oLat, oLng, dLat, dLng);
  const distance_km = Math.round(straight * 1.35 * 100) / 100;
  const duration_minutes = Math.ceil((distance_km / 80) * 60);
  return { distance_km, duration_minutes, source: "approximate", approximate: true };
}

export async function fetchRealRoute(
  oLat: number, oLng: number, dLat: number, dLng: number
): Promise<{ distance_km: number; duration_minutes: number; source: string } | null> {
  // Primary: servidores OSRM públicos (roteamento real por estrada, sem chave).
  // O servidor de demonstração falha com frequência (devolve uma página de erro em vez
  // de JSON), por isso há um segundo servidor OSRM antes de passar para o Google.
  const osrmServers = [
    `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`,
  ];

  for (const osrmUrl of osrmServers) {
    try {
      const osrmRes = await fetch(osrmUrl, {
        headers: {
          Accept: "application/json",
          // Servidores OSRM públicos recusam pedidos sem identificação
          "User-Agent": "TransfersAlgarvestar/1.0 (+https://lisbonsevillefaroriders.com)",
        },
        signal: AbortSignal.timeout(12000),
      });
      const raw = await osrmRes.text();
      let osrmData: any;
      try {
        osrmData = JSON.parse(raw);
      } catch {
        console.log("OSRM resposta inválida:", osrmUrl, osrmRes.status, raw.slice(0, 140));
        continue;
      }
      if (osrmData.code === "Ok" && osrmData.routes?.length > 0) {
        const route = osrmData.routes[0];
        const distance_km = Math.round((route.distance / 1000) * 100) / 100;
        const duration_minutes = Math.ceil(route.duration / 60);
        return { distance_km, duration_minutes, source: "osrm" };
      }
      console.log("OSRM sem rota:", osrmUrl, osrmData.code || osrmRes.status);
    } catch (e) {
      console.log("OSRM error:", osrmUrl, e.message);
    }
  }

  // Secondary: Google Directions API — usa as chaves Google Maps já configuradas
  const mapsKeys = [secrets.get("GOOGLE_PLACES_API_KEY"), secrets.get("GOOGLE_MAPS_SERVER_KEY")].filter(Boolean) as string[];

  for (const mapsKey of mapsKeys) {
    try {
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=driving&key=${mapsKey}`;
      const directionsRes = await fetch(directionsUrl, { signal: AbortSignal.timeout(12000) });
      const directionsData = await directionsRes.json();
      const leg = directionsData.routes?.[0]?.legs?.[0];
      if (directionsData.status === "OK" && leg?.distance?.value) {
        return {
          distance_km: Math.round(leg.distance.value / 100) / 10,
          duration_minutes: Math.ceil(leg.duration.value / 60),
          source: "google",
        };
      }
      console.log("Directions API sem rota:", directionsData.status, directionsData.error_message || "");
    } catch (e) {
      console.log("Directions API error:", e.message);
    }
  }

  // Tertiary: Google Routes API (chaves com a API Routes ativa)
  for (const mapsKey of mapsKeys) {
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
      console.log("Routes API sem rota:", JSON.stringify(routesData).slice(0, 200));
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