Deno.serve(async (req) => {
  try {
    const { input } = await req.json();
    
    if (!input || input.trim().length === 0) {
      return Response.json({ suggestions: [] });
    }

    const apiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.warn('Google API key not configured, falling back to Nominatim');
      return Response.json({ suggestions: [] });
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('components', 'country:pt|country:es');
    url.searchParams.set('language', 'pt');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return Response.json({ suggestions: [] });
    }

    // Para cada prediction, usar Geocoding para obter coordenadas
    const suggestionsWithCoords = [];
    for (const pred of (data.predictions || [])) {
      try {
        const geoUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        geoUrl.searchParams.set('place_id', pred.place_id);
        geoUrl.searchParams.set('key', apiKey);
        
        const geoResponse = await fetch(geoUrl.toString());
        const geoData = await geoResponse.json();
        
        if (geoData.status === 'OK' && geoData.results[0]) {
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
        console.error('Geocoding error for prediction:', e);
      }
    }

    return Response.json({ suggestions: suggestionsWithCoords });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ suggestions: [] });
  }
});