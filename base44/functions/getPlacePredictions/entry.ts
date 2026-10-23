// Public endpoint — no authentication required
// Sugestões de locais: Google Places Autocomplete e, se este não responder,
// pesquisa OpenStreetMap (Nominatim) — para que uma morada escrita continue a
// resolver para coordenadas reais (e não para uma estimativa).
async function nominatimSuggestions(input: string) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', input);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '5');
  url.searchParams.set('countrycodes', 'pt,es');
  url.searchParams.set('accept-language', 'pt');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'TransfersAlgarvestar' },
  });
  const results = await res.json();
  if (!Array.isArray(results)) return [];

  return results
    .filter((r: any) => r?.lat && r?.lon)
    .map((r: any) => ({
      address: String(r.display_name || '').split(',').slice(0, 4).join(',').trim(),
      coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) },
    }));
}

Deno.serve(async (req) => {
  console.log('Function called, method:', req.method);
  try {
    const body = await req.json();
    console.log('Body received:', JSON.stringify(body));
    const { input } = body;

    if (!input || typeof input !== 'string' || input.trim().length < 1) {
      return Response.json({ suggestions: [] });
    }

    const trimmedInput = input.trim().slice(0, 200);

    // Try both keys — GOOGLE_PLACES_API_KEY first (has Places API enabled), then server key
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('GOOGLE_MAPS_SERVER_KEY');

    if (!apiKey) {
      console.log('No API key found');
      return Response.json({ suggestions: await nominatimSuggestions(trimmedInput) });
    }

    // Step 1: Get predictions from Places Autocomplete
    const acUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedInput)}&key=${apiKey}&language=pt&components=country:pt|country:es|country:es&types=geocode|establishment`;
    const acRes = await fetch(acUrl);
    const acData = await acRes.json();

    console.log('Autocomplete status:', acData.status, '| count:', acData.predictions?.length ?? 0, '| error:', acData.error_message || 'none');

    if (acData.status !== 'OK' || !acData.predictions?.length) {
      console.log('Full response:', JSON.stringify(acData).slice(0, 300));
      const fallback = await nominatimSuggestions(trimmedInput);
      console.log('Nominatim fallback results:', fallback.length);
      return Response.json({ suggestions: fallback });
    }

    const top5 = acData.predictions.slice(0, 5);

    // Step 2: Get place details (coords) for each prediction
    const detailRequests = top5.map(async (pred) => {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${pred.place_id}&key=${apiKey}&fields=name,formatted_address,geometry&language=pt`;
        const detailRes = await fetch(detailUrl);
        const detailData = await detailRes.json();

        const result = detailData.result;
        if (!result?.geometry?.location) return null;

        const name = result.name;
        const addr = result.formatted_address;
        const displayName = name && addr && !addr.startsWith(name)
          ? `${name}, ${addr}`
          : addr || name;

        return {
          address: displayName,
          coords: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          }
        };
      } catch (e) {
        console.log('Detail fetch error:', e.message);
        return null;
      }
    });

    const results = (await Promise.all(detailRequests)).filter(Boolean);
    console.log('Returning', results.length, 'suggestions');
    return Response.json({ suggestions: results });

  } catch (error) {
    console.log('Error:', error.message);
    return Response.json({ suggestions: [] });
  }
});