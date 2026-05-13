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

    // Primary: OSRM (free, no key, real road routing)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${origin_lng},${origin_lat};${destination_lng},${destination_lat}?overview=false`;
      const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(8000) });
      const osrmData = await osrmRes.json();

      if (osrmData.code === 'Ok' && osrmData.routes?.length > 0) {
        const route = osrmData.routes[0];
        const distance_km = Math.round((route.distance / 1000) * 100) / 100;
        const duration_minutes = Math.ceil(route.duration / 60);
        console.log('OSRM success, distance:', distance_km, 'km');
        return Response.json({
          distance_km,
          duration_minutes,
          distance_text: `${distance_km} km`,
          duration_text: `${duration_minutes} min`,
          source: 'osrm',
        });
      }
    } catch (e) {
      console.log('OSRM error:', e.message);
    }

    // Secondary: Google Routes API (needs Routes API enabled)
    const mapsKey = Deno.env.get('GOOGLE_MAPS_SERVER_KEY');
    if (mapsKey) {
      try {
        const routesRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsKey,
            'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: origin_lat, longitude: origin_lng } } },
            destination: { location: { latLng: { latitude: destination_lat, longitude: destination_lng } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_UNAWARE',
          }),
          signal: AbortSignal.timeout(8000),
        });
        const routesData = await routesRes.json();
        console.log('Routes API status:', routesRes.status, 'error:', routesData.error?.message);

        if (routesData.routes?.length > 0) {
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

    // Final fallback: Haversine (straight line * 1.35)
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