const PAYPAL_BASE = 'https://api-m.paypal.com';

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
    const { amount, currency = 'EUR', description } = await req.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: parseFloat(amount).toFixed(2),
          },
          description: description || 'Transfer Algarvestar',
        }],
      }),
    });

    const order = await orderRes.json();

    if (!orderRes.ok) {
      return Response.json({ error: order.message || 'Failed to create order' }, { status: 400 });
    }

    return Response.json({ orderId: order.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});