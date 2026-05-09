Deno.serve(async (req) => {
  try {
    const { input } = await req.json();
    
    if (!input || input.trim().length === 0) {
      return Response.json({ suggestions: [] });
    }

    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY') || Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
    
    // Try Google Places API
    if (apiKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        url.searchParams.set('input', input);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('language', 'pt');
        
        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (data.predictions && data.predictions.length > 0) {
          const suggestionsWithCoords = [];
          
          for (const pred of data.predictions) {
            try {
              const geoUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
              geoUrl.searchParams.set('place_id', pred.place_id);
              geoUrl.searchParams.set('key', apiKey);
              
              const geoResponse = await fetch(geoUrl.toString());
              const geoData = await geoResponse.json();
              
              if (geoData.results && geoData.results[0]) {
                const result = geoData.results[0];
                suggestionsWithCoords.push({
                  address: result.formatted_address,
                  coords: {
                    lat: result.geometry.location.lat,
                    lng: result.geometry.location.lng
                  }
                });
              }
            } catch (e) {
              // Skip this prediction
            }
          }
          
          if (suggestionsWithCoords.length > 0) {
            return Response.json({ suggestions: suggestionsWithCoords });
          }
        }
      } catch (e) {
        // Fall through to Nominatim
      }
    }

    // Fallback to Nominatim
    const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
    nomUrl.searchParams.set('q', input);
    nomUrl.searchParams.set('format', 'json');
    nomUrl.searchParams.set('limit', '8');
    
    const nomResponse = await fetch(nomUrl.toString(), {
      headers: { 'User-Agent': 'TransfersApp/1.0' }
    });
    
    const nomData = await nomResponse.json();
    const suggestions = nomData.map(result => ({
      address: result.display_name,
      coords: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      }
    }));
    
    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ suggestions: [] });
  }
});