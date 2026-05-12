import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { address } = await req.json();
    
    if (!address || address.trim().length === 0) {
      return Response.json({ error: 'Address required' }, { status: 400 });
    }

    const apiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Use Nominatim (OpenStreetMap) - free and no key needed
    const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
    searchUrl.searchParams.set('q', address);
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('limit', '5');
    searchUrl.searchParams.set('countrycodes', 'pt,es');

    const response = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'TransfersAlgarvestar' }
    });
    const results = await response.json();

    if (!results || results.length === 0) {
      return Response.json({ suggestions: [] });
    }

    const suggestions = results.map(r => ({
      address: r.display_name,
      coords: { lat: parseFloat(r.lat), lng: parseFloat(r.lon) }
    }));

    return Response.json({ suggestions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});