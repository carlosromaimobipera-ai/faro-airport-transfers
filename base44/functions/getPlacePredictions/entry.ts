Deno.serve(async (req) => {
  try {
    const { input } = await req.json();
    
    if (!input || input.trim().length === 0) {
      return Response.json({ suggestions: [] });
    }

    // Use Nominatim (OpenStreetMap) for searching
    const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
    nomUrl.searchParams.set('q', input);
    nomUrl.searchParams.set('format', 'json');
    nomUrl.searchParams.set('limit', '8');
    nomUrl.searchParams.set('addressdetails', '1');
    
    const nomResponse = await fetch(nomUrl.toString(), {
      headers: { 'User-Agent': 'TransfersApp/1.0' }
    });
    
    if (!nomResponse.ok) {
      return Response.json({ suggestions: [] });
    }
    
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