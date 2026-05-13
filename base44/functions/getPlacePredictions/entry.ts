Deno.serve(async (req) => {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== 'string' || input.trim().length < 1) {
      return Response.json({ suggestions: [] });
    }

    const trimmedInput = input.trim().slice(0, 200);
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      console.log('No GOOGLE_PLACES_API_KEY found, using Nominatim fallback');
    } else {
      // Try Places API New (v1) — autocomplete + details in parallel
      try {
        const acRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
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
                low: { latitude: 35.0, longitude: -10.0 },
                high: { latitude: 44.0, longitude: 5.0 }
              }
            }
          })
        });

        const acData = await acRes.json();
        console.log('Places autocomplete status:', acRes.status, 'error:', acData.error?.message, 'suggestions count:', acData.suggestions?.length);

        if (acData.suggestions && acData.suggestions.length > 0) {
          const top5 = acData.suggestions.slice(0, 5);
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
              .catch(e => { console.log('Detail fetch error:', e.message); return null; });
          });

          const results = (await Promise.all(detailRequests)).filter(Boolean);
          if (results.length > 0) {
            console.log('Returning', results.length, 'results from Places API v1');
            return Response.json({ suggestions: results });
          }
        }
      } catch (e) {
        console.log('Places API v1 error:', e.message);
      }

      // Fallback: legacy Places API
      try {
        const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        legacyUrl.searchParams.set('input', trimmedInput);
        legacyUrl.searchParams.set('key', apiKey);
        legacyUrl.searchParams.set('language', 'pt');
        legacyUrl.searchParams.set('components', 'country:pt|country:es');

        const legacyRes = await fetch(legacyUrl.toString());
        const legacyData = await legacyRes.json();
        console.log('Legacy Places status:', legacyData.status, 'error:', legacyData.error_message);

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
              .catch(e => { console.log('Legacy detail error:', e.message); return null; });
          });
          const results = (await Promise.all(detailRequests)).filter(Boolean);
          if (results.length > 0) {
            console.log('Returning', results.length, 'results from legacy Places API');
            return Response.json({ suggestions: results });
          }
        }
      } catch (e) {
        console.log('Legacy Places API error:', e.message);
      }
    }

    // Final fallback: Nominatim (OpenStreetMap)
    console.log('Using Nominatim fallback');
    try {
      const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
      nomUrl.searchParams.set('q', trimmedInput);
      nomUrl.searchParams.set('format', 'json');
      nomUrl.searchParams.set('limit', '5');
      nomUrl.searchParams.set('countrycodes', 'pt,es');
      nomUrl.searchParams.set('addressdetails', '1');

      const nomRes = await fetch(nomUrl.toString(), { headers: { 'User-Agent': 'TransfersAlgarve/1.0' } });
      const nomData = await nomRes.json();
      console.log('Nominatim results:', nomData.length);

      return Response.json({
        suggestions: nomData.map(r => ({
          address: r.display_name,
          coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
        }))
      });
    } catch (e) {
      console.log('Nominatim error:', e.message);
      return Response.json({ suggestions: [] });
    }

  } catch (error) {
    console.log('Top-level error:', error.message);
    return Response.json({ suggestions: [] });
  }
});