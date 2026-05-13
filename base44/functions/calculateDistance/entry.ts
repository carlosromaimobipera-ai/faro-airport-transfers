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

    const placesKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    const mapsKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY');

    // Try Routes API (new, server-side, no referer restrictions)
    for (const apiKey of [placesKey, mapsKey].filter(Boolean)) {
      try {
        const routesRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: origin_lat, longitude: origin_lng } } },
            destination: { location: { latLng: { latitude: destination_lat, longitude: destination_lng } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE',
          })
        });

        const routesData = await routesRes.json();
        console.log('Routes API status:', routesRes.status, 'error:', routesData.error?.message);

        if (routesData.routes && routesData.routes.length > 0) {
          const route = routesData.routes[0];
          const distance_km = Math.round((route.distanceMeters / 1000) * 100) / 100;
          const duration_minutes = Math.ceil(parseInt(route.duration) / 60);
          console.log('Routes API success, distance:', distance_km, 'km');
          return Response.json({
            distance_km,
            duration_minutes,
            distance_text: `${distance_km} km`,
            duration_text: `${duration_minutes} min`,
            source: 'google',
          });
        }
      } catch (e) {
        console.log('Routes API error:', e.message);
      }
    }

    // Fallback: Distance Matrix API
    for (const apiKey of [placesKey, mapsKey].filter(Boolean)) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin_lat},${origin_lng}&destinations=${destination_lat},${destination_lng}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('Distance Matrix status:', data.status);

        if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
          const element = data.rows[0].elements[0];
          const distance_km = Math.round((element.distance.value / 1000) * 100) / 100;
          const duration_minutes = Math.ceil(element.duration.value / 60);
          console.log('Distance Matrix success, distance:', distance_km, 'km');
          return Response.json({
            distance_km,
            duration_minutes,
            distance_text: element.distance.text,
            duration_text: element.duration.text,
            source: 'google',
          });
        }
      } catch (e) {
        console.log('Distance Matrix error:', e.message);
      }
    }

    // Final fallback: Haversine
    console.log('Using Haversine fallback');
    const straight_km = haversineKm(origin_lat, origin_lng, destination_lat, destination_lng);
    const distance_km = Math.round(straight_km * 1.35 * 100) / 100;
    const duration_minutes = Math.ceil((distance_km / 80) * 60);

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