import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { input } = await req.json();

    // Basic validation to prevent abuse
    if (!input || typeof input !== 'string' || input.trim().length < 2 || input.trim().length > 200) {
      return Response.json({ suggestions: [] });
    }

    const trimmedInput = input.trim();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (apiKey) {
      // Step 1: Get autocomplete predictions
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', trimmedInput);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('language', 'pt');
      url.searchParams.set('components', 'country:pt|country:es');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        // Step 2: Get Place Details for top 5 predictions IN PARALLEL
        const top5 = data.predictions.slice(0, 5);
        const detailRequests = top5.map(pred => {
          const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailUrl.searchParams.set('place_id', pred.place_id);
          detailUrl.searchParams.set('key', apiKey);
          detailUrl.searchParams.set('fields', 'name,formatted_address,geometry');
          detailUrl.searchParams.set('language', 'pt');
          return fetch(detailUrl.toString())
            .then(r => r.json())
            .then(detailData => {
              const result = detailData.result;
              if (!result || !result.geometry) return null;
              // Use name + formatted_address so hotel/villa name is preserved
              const displayName = result.name && result.formatted_address && !result.formatted_address.startsWith(result.name)
                ? `${result.name}, ${result.formatted_address}`
                : result.formatted_address || result.name;
              return {
                address: displayName,
                coords: {
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng
                }
              };
            })
            .catch(() => null);
        });

        const results = (await Promise.all(detailRequests)).filter(Boolean);
        if (results.length > 0) {
          return Response.json({ suggestions: results });
        }
      }
    }

    // Fallback: Nominatim (Portugal + Spain)
    const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
    nomUrl.searchParams.set('q', trimmedInput);
    nomUrl.searchParams.set('format', 'json');
    nomUrl.searchParams.set('limit', '5');
    nomUrl.searchParams.set('viewbox', '-10.0,36.0,3.3,43.8');
    nomUrl.searchParams.set('bounded', '1');

    const nomResponse = await fetch(nomUrl.toString(), {
      headers: { 'User-Agent': 'TransfersAlgarvestar/1.0' }
    });
    const nomData = await nomResponse.json();

    const suggestions = nomData.map(r => ({
      address: r.display_name,
      coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    }));

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ suggestions: [] });
  }
});