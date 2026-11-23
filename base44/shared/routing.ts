import { secrets } from "base44:runtime";

export function roundCoord(n: number): number {
  // 5 casas (~1 m): evita que dois pontos diferentes partilhem a mesma distância em cache
  return Math.round(n * 100000) / 100000;
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

// Comprimento em linha reta ao longo de todos os pontos da rota (útil com paragens)
export function straightPathKm(points: Array<{ lat: number; lng: number }>): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineKm(points[i].lat, points[i].lng, points[i + 1].lat, points[i + 1].lng);
  }
  return total;
}

// Uma distância por estrada nunca é muito menor que a linha reta nem desproporcionadamente
// maior. Serve para descartar valores em cache que não correspondem a esta rota.
export function isPlausibleRouteDistance(
  distanceKm: number, points: Array<{ lat: number; lng: number }>
): boolean {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return false;
  const straight = straightPathKm(points);
  if (straight < 0.3) return distanceKm < 5;
  const ratio = distanceKm / straight;
  return ratio >= 0.95 && ratio <= 2.5;
}

// Estimativa por linha reta ao longo da rota (inclui as paragens), marcada como aproximada
export function haversineFallbackPath(points: Array<{ lat: number; lng: number }>) {
  const distance_km = Math.round(straightPathKm(points) * 1.35 * 100) / 100;
  return {
    distance_km,
    duration_minutes: Math.ceil((distance_km / 80) * 60),
    source: "approximate",
    approximate: true,
  };
}

export async function fetchRealRoute(
  oLat: number, oLng: number, dLat: number, dLng: number,
  waypoints: Array<{ lat: number; lng: number }> = []
): Promise<{ distance_km: number; duration_minutes: number; source: string } | null> {
  // Primary: Google Maps — é a distância que o cliente vê no Google Maps.
  // Directions API primeiro e, em alternativa, a Routes API (chaves com essa API ativa).
  // As paragens (waypoints) entram na rota pela ordem indicada.
  const mapsKeys = [secrets.get("GOOGLE_MAPS_SERVER_KEY"), secrets.get("GOOGLE_PLACES_API_KEY")].filter(Boolean) as string[];

  for (const mapsKey of mapsKeys) {
    try {
      const waypointParam = waypoints.length
        ? `&waypoints=${waypoints.map((w) => `${w.lat},${w.lng}`).join("|")}`
        : "";
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${oLat},${oLng}&destination=${dLat},${dLng}&mode=driving${waypointParam}&key=${mapsKey}`;
      const directionsRes = await fetch(directionsUrl, { signal: AbortSignal.timeout(12000) });
      const directionsData = await directionsRes.json();
      const legs = directionsData.routes?.[0]?.legs;
      if (directionsData.status === "OK" && Array.isArray(legs) && legs.length > 0) {
        // Soma todas as pernas: com paragens, a primeira perna não é a rota toda
        const meters = legs.reduce((sum: number, l: any) => sum + (l?.distance?.value || 0), 0);
        const seconds = legs.reduce((sum: number, l: any) => sum + (l?.duration?.value || 0), 0);
        if (meters > 0) {
          return {
            distance_km: Math.round(meters / 100) / 10,
            duration_minutes: Math.ceil(seconds / 60),
            source: "google",
          };
        }
      }
      console.log("Directions API sem rota:", directionsData.status, directionsData.error_message || "");
    } catch (e) {
      console.log("Directions API error:", e.message);
    }
  }

  // Secondary: Google Routes API (chaves com a API Routes ativa)
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
          ...(waypoints.length
            ? { intermediates: waypoints.map((w) => ({ location: { latLng: { latitude: w.lat, longitude: w.lng } } })) }
            : {}),
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

  // Last resort: servidores OSRM públicos (roteamento real por estrada, sem chave).
  // Só entram se o Google não responder, para nunca sobrepor à distância do Google Maps.
  const path = [
    `${oLng},${oLat}`,
    ...waypoints.map((w) => `${w.lng},${w.lat}`),
    `${dLng},${dLat}`,
  ].join(";");

  const osrmServers = [
    `https://router.project-osrm.org/route/v1/driving/${path}?overview=false`,
    `https://routing.openstreetmap.de/routed-car/route/v1/driving/${path}?overview=false`,
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

  return null;
}

// Localizações pré-definidas para pré-cálculo (espelha src/lib/transferData.js)
// Coordenadas dos pontos reais (terminal do aeroporto, centro da vila), não de zonas
// próximas: um erro de poucos km aqui traduz-se em quilómetros e preços inflacionados.
export const COMMON_LOCATIONS = [
  { id: "fao", name: "Aeroporto de Faro (FAO)", coords: { lat: 37.0144, lng: -7.9659 }, type: "airport" },
  { id: "lis", name: "Aeroporto de Lisboa", coords: { lat: 38.7742, lng: -9.1342 }, type: "airport" },
  { id: "svq", name: "Aeroporto de Sevilha (SVQ)", coords: { lat: 37.4177, lng: -5.8949 }, type: "airport" },
  { id: "faro_center", name: "Centro de Faro", coords: { lat: 37.0163, lng: -7.9352 }, type: "city" },
  { id: "vilamoura", name: "Vilamoura", coords: { lat: 37.0785, lng: -8.1146 }, type: "city" },
  { id: "albufeira", name: "Albufeira", coords: { lat: 37.0917, lng: -8.2550 }, type: "city" },
  { id: "armacao", name: "Armação de Pêra", coords: { lat: 37.1019, lng: -8.3704 }, type: "city" },
  { id: "lagos", name: "Lagos", coords: { lat: 37.1028, lng: -8.6729 }, type: "city" },
  { id: "portimao", name: "Portimão", coords: { lat: 37.1376, lng: -8.5368 }, type: "city" },
  { id: "silves", name: "Silves", coords: { lat: 37.1889, lng: -8.4383 }, type: "city" },
  { id: "tavira", name: "Tavira", coords: { lat: 37.1262, lng: -7.6499 }, type: "city" },
  { id: "lis_center", name: "Centro de Lisboa", coords: { lat: 38.7223, lng: -9.1393 }, type: "city" },
  { id: "seville_center", name: "Centro de Sevilha", coords: { lat: 37.386, lng: -5.9844 }, type: "city" },
];