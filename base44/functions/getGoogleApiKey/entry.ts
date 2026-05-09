Deno.serve(async (req) => {
  const apiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
  return Response.json({ apiKey: apiKey || null });
});