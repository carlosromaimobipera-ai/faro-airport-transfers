import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { buildLookupKey, fetchRealRoute, roundCoord, COMMON_LOCATIONS } from "../../shared/routing.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const results = { total: 0, cached: 0, computed: 0, failed: 0 };

    // All ordered pairs (airports ↔ cities, both directions)
    const pairs: Array<{ o: any; d: any }> = [];
    for (const o of COMMON_LOCATIONS) {
      for (const d of COMMON_LOCATIONS) {
        if (o.id === d.id) continue;
        // Only pairs involving at least one airport
        if (o.type !== "airport" && d.type !== "airport") continue;
        pairs.push({ o, d });
      }
    }
    results.total = pairs.length;

    for (const { o, d } of pairs) {
      const lookup_key = buildLookupKey(o.coords.lat, o.coords.lng, d.coords.lat, d.coords.lng);

      // Skip if already cached
      try {
        const existing = await base44.asServiceRole.entities.RouteDistance.filter({ lookup_key }, undefined, 1);
        if (existing && existing.length > 0) {
          results.cached++;
          continue;
        }
      } catch (e) {
        // ignore lookup error, recompute
      }

      // Compute real route
      const real = await fetchRealRoute(o.coords.lat, o.coords.lng, d.coords.lat, d.coords.lng);
      if (real) {
        try {
          await base44.asServiceRole.entities.RouteDistance.create({
            lookup_key,
            origin_lat: roundCoord(o.coords.lat),
            origin_lng: roundCoord(o.coords.lng),
            destination_lat: roundCoord(d.coords.lat),
            destination_lng: roundCoord(d.coords.lng),
            distance_km: real.distance_km,
            duration_minutes: real.duration_minutes,
            source: real.source,
          });
          results.computed++;
        } catch (e) {
          results.failed++;
        }
      } else {
        results.failed++;
      }

      // Small delay to avoid hammering OSRM
      await new Promise((r) => setTimeout(r, 150));
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}