import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { createClientFromRequest } = await import('npm:@base44/sdk@0.8.25');
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { origin_lat, origin_lng, destination_lat, destination_lng } = await req.json();

    if (!origin_lat || !origin_lng || !destination_lat || !destination_lng) {
      return Response.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const googleApiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
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