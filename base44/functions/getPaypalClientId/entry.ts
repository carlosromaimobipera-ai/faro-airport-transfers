Deno.serve(async (req) => {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID') || Deno.env.get('VITE_PAYPAL_CLIENT_ID');
  if (!clientId) return Response.json({ error: 'PayPal client ID not configured' }, { status: 500 });
  return Response.json({ clientId });
});