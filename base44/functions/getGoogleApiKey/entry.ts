import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// This endpoint is deprecated — API key is now exposed via VITE_ env variable directly in the frontend.
// Kept as a stub to avoid broken references.
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  const apiKey = Deno.env.get('VITE_GOOGLE_PLACES_API_KEY');
  return Response.json({ apiKey: apiKey || null });
});