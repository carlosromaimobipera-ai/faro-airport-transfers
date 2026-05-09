import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { input } = await req.json();
    
    if (!input || input.trim().length === 0) {
      return Response.json({ predictions: [] });
    }

    const apiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
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
      return Response.json({ predictions: [] });
    }

    return Response.json({ 
      predictions: (data.predictions || []).map(p => ({
        description: p.description,
        place_id: p.place_id,
        main_text: p.main_text,
        secondary_text: p.secondary_text
      }))
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});