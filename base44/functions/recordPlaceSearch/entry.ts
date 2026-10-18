import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Registra a escolha de um local de interesse pelo cliente, para alimentar
// a lista de "mais procurados" mostrada no planeamento de um day trip.
// Endpoint público (clientes podem reservar sem conta), por isso valida a entrada
// e só conta escolhas de locais conhecidos do catálogo da app.
export default async function (req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
    const category = typeof body?.category === "string" ? body.category.trim().slice(0, 30) : "";
    const lat = Number(body?.lat);
    const lng = Number(body?.lng);

    if (!name) {
      return Response.json({ error: "Missing place name" }, { status: 400 });
    }

    const validCoord = (value: number, min: number, max: number) =>
      Number.isFinite(value) && value >= min && value <= max;

    const coords = validCoord(lat, 34, 45) && validCoord(lng, -12, 6)
      ? { lat, lng }
      : { lat: null, lng: null };

    const base44 = createClientFromRequest(req);
    const now = new Date().toISOString();

    const found = await base44.asServiceRole.entities.PopularPlace.filter({ name }, undefined, 5);
    const existing = Array.isArray(found) ? found : (found?.items || []);

    if (existing.length > 0) {
      const place = existing[0];
      const search_count = (place.search_count || 0) + 1;
      await base44.asServiceRole.entities.PopularPlace.update(place.id, {
        search_count,
        last_search: now,
        category: category || place.category,
        lat: coords.lat ?? place.lat,
        lng: coords.lng ?? place.lng,
      });
      return Response.json({ ok: true, updated: true, name, search_count });
    }

    await base44.asServiceRole.entities.PopularPlace.create({
      name,
      category,
      lat: coords.lat,
      lng: coords.lng,
      search_count: 1,
      last_search: now,
    });

    return Response.json({ ok: true, created: true, name, search_count: 1 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}