import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string' || input.trim().length < 2 || input.trim().length > 200) {
      return Response.json({ suggestions: [] });
    }

    const trimmedInput = input.trim();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (apiKey) {
      // Use Places API New (v1) — single request, returns coordinates directly
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input: trimmedInput,
          languageCode: 'pt',
          includedRegionCodes: ['pt', 'es'],
          locationBias: {
            rectangle: {
              low: { latitude: 36.0, longitude: -9.6 },
              high: { latitude: 43.8, longitude: 4.4 }
            }
          }
        })
      });

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        // Fetch place details in parallel for coordinates
        const top5 = data.suggestions.slice(0, 5);
        const detailRequests = top5.map(s => {
          const placeId = s.placePrediction?.placeId;
          if (!placeId) return Promise.resolve(null);
          return fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=displayName,formattedAddress,location&languageCode=pt`, {
            headers: { 'X-Goog-Api-Key': apiKey }
          })
            .then(r => r.json())
            .then(d => {
              if (!d.location) return null;
              const name = d.displayName?.text;
              const addr = d.formattedAddress;
              const displayName = name && addr && !addr.startsWith(name)
                ? `${name}, ${addr}`
                : addr || name;
              return {
                address: displayName,
                coords: { lat: d.location.latitude, lng: d.location.longitude }
              };
            })
            .catch(() => null);
        });

        const results = (await Promise.all(detailRequests)).filter(Boolean);
        if (results.length > 0) return Response.json({ suggestions: results });
      }

      // Fallback to legacy Places API if new API returns nothing
      const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      legacyUrl.searchParams.set('input', trimmedInput);
      legacyUrl.searchParams.set('key', apiKey);
      legacyUrl.searchParams.set('language', 'pt');
      legacyUrl.searchParams.set('components', 'country:pt|country:es');

      const legacyRes = await fetch(legacyUrl.toString());
      const legacyData = await legacyRes.json();

      if (legacyData.predictions && legacyData.predictions.length > 0) {
        const top5 = legacyData.predictions.slice(0, 5);
        const detailRequests = top5.map(pred => {
          const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
          detailUrl.searchParams.set('place_id', pred.place_id);
          detailUrl.searchParams.set('key', apiKey);
          detailUrl.searchParams.set('fields', 'name,formatted_address,geometry');
          detailUrl.searchParams.set('language', 'pt');
          return fetch(detailUrl.toString())
            .then(r => r.json())
            .then(d => {
              const result = d.result;
              if (!result?.geometry) return null;
              const displayName = result.name && result.formatted_address && !result.formatted_address.startsWith(result.name)
                ? `${result.name}, ${result.formatted_address}`
                : result.formatted_address || result.name;
              return {
                address: displayName,
                coords: { lat: result.geometry.location.lat, lng: result.geometry.location.lng }
              };
            })
            .catch(() => null);
        });
        const results = (await Promise.all(detailRequests)).filter(Boolean);
        if (results.length > 0) return Response.json({ suggestions: results });
      }
    }

    // Final fallback: Nominatim
    const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
    nomUrl.searchParams.set('q', trimmedInput);
    nomUrl.searchParams.set('format', 'json');
    nomUrl.searchParams.set('limit', '5');
    nomUrl.searchParams.set('viewbox', '-10.0,36.0,3.3,43.8');
    nomUrl.searchParams.set('bounded', '1');

    const nomRes = await fetch(nomUrl.toString(), { headers: { 'User-Agent': 'TransfersAlgarvestar/1.0' } });
    const nomData = await nomRes.json();

    return Response.json({
      suggestions: nomData.map(r => ({
        address: r.display_name,
        coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
      }))
    });

  } catch (error) {
    return Response.json({ suggestions: [] });
  }
});