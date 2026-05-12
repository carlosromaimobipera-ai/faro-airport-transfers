import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const PAYPAL_BASE = 'https://api-m.paypal.com'; // use sandbox: https://api-m.sandbox.paypal.com

async function getAccessToken() {
  const clientId = Deno.env.get('VITE_PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuth = await base44.auth.isAuthenticated();
    if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const capture = await captureRes.json();

    if (!captureRes.ok || capture.status !== 'COMPLETED') {
      return Response.json({ error: capture.message || 'Capture failed' }, { status: 400 });
    }

    return Response.json({ success: true, status: capture.status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});