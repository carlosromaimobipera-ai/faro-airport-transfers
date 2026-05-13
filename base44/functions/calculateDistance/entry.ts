function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

Deno.serve(async (req) => {
  try {
    const { origin_lat, origin_lng, destination_lat, destination_lng } = await req.json();

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    // Try Google Maps Distance Matrix API
    const serverKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY');
    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    for (const apiKey of [serverKey, placesKey].filter(Boolean)) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin_lat},${origin_lng}&destinations=${destination_lat},${destination_lng}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = data.rows[0].elements[0];
          const distance_km = Math.round((element.distance.value / 1000) * 100) / 100;
          const duration_minutes = Math.ceil(element.duration.value / 60);
          console.log('Google Maps API success, distance:', distance_km, 'km');
          return Response.json({
            distance_km,
            duration_minutes,
            distance_text: element.distance.text,
            duration_text: element.duration.text,
            source: 'google',
          });
        } else {
          console.log('Google Maps API error:', data.error_message || data.status);
        }
      } catch (e) {
        console.log('Google Maps API fetch failed:', e.message);
      }
    }

    // Fallback: Haversine with road factor
    console.log('Using Haversine fallback');
    const straight_km = haversineKm(origin_lat, origin_lng, destination_lat, destination_lng);
    // Apply road factor 1.35 to estimate real road distance
    const distance_km = Math.round(straight_km * 1.35 * 100) / 100;
    const duration_minutes = Math.ceil((distance_km / 80) * 60); // ~80 km/h avg

    return Response.json({
      distance_km,
      duration_minutes,
      distance_text: `${distance_km} km`,
      duration_text: `${duration_minutes} min`,
      source: 'haversine',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});