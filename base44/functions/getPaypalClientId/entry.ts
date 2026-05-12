import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const isAuth = await base44.auth.isAuthenticated();
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = Deno.env.get('VITE_PAYPAL_CLIENT_ID');
  if (!clientId) return Response.json({ error: 'PayPal client ID not configured' }, { status: 500 });
  return Response.json({ clientId });
});