import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Allow unauthenticated calls (public booking form)

    const { input } = await req.json();
    
    if (!input || input.trim().length < 2) {
      return Response.json({ suggestions: [] });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
    
    if (apiKey) {
      // Step 1: Get autocomplete predictions
      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.set('input', input);
      url.searchParams.set('key', apiKey);
      url.searchParams.set('language', 'pt');
      url.searchParams.set('components', 'country:pt|country:es');
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.predictions && data.predictions.length > 0) {
        // Step 2: Get Place Details for top 5 predictions IN PARALLEL
        // Place Details returns the exact name (hotel, villa, etc.) + coordinates
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
              if (!result) return null;
              // Use name + formatted_address so hotel/villa name is shown
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
    nomUrl.searchParams.set('q', input);
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