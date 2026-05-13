Deno.serve(async (req) => {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = await req.json();

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const serverKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY');
    const fallbackKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const googleApiKey = serverKey || fallbackKey;
    console.log('Using key source:', serverKey ? 'GOOGLE_MAPS_SERVER_KEY' : 'GOOGLE_PLACES_API_KEY (fallback)');
    if (!googleApiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin_lat},${origin_lng}&destinations=${destination_lat},${destination_lng}&key=${googleApiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return Response.json({ error: data.error_message || 'Distance Matrix API error' }, { status: 500 });
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      return Response.json({ error: 'Route not found' }, { status: 400 });
    }

    const distance_m = element.distance.value;
    const duration_s = element.duration.value;
    const distance_km = Math.round((distance_m / 1000) * 100) / 100;
    const duration_minutes = Math.ceil(duration_s / 60);

    return Response.json({
      distance_km,
      duration_minutes,
      distance_text: element.distance.text,
      duration_text: element.duration.text,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});