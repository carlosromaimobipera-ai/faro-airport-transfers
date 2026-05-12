import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const WEBHOOK_SECRET = Deno.env.get('INTERNAL_AUTOMATION_SECRET');
  if (!WEBHOOK_SECRET) return Response.json({ error: 'Server misconfigured' }, { status: 500 });
  const providedSecret = req.headers.get('x-webhook-secret') || new URL(req.url).searchParams.get('secret');
  if (providedSecret !== WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse JSON body
    const body = await req.json();

    // Validate required fields
    const required = ['customer_name', 'customer_email', 'customer_phone', 'origin', 'destination', 'vehicle_type', 'transfer_date', 'transfer_time'];
    const missing = required.filter(field => !body[field]);
    
    if (missing.length > 0) {
      return Response.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate vehicle type
    if (!['sedan', 'minivan', 'minibus'].includes(body.vehicle_type)) {
      return Response.json(
        { error: 'Invalid vehicle_type. Must be: sedan, minivan, or minibus' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.customer_email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate transfer_date is valid date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.transfer_date)) {
      return Response.json(
        { error: 'Invalid transfer_date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate transfer_time is valid time format (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(body.transfer_time)) {
      return Response.json(
        { error: 'Invalid transfer_time format. Use HH:MM' },
        { status: 400 }
      );
    }

    // Ensure 24h advance notice
    const bookingDateTime = new Date(`${body.transfer_date}T${body.transfer_time}`);
    const minAllowed = new Date(Date.now() + 24 * 60 * 60 * 1000);
    if (bookingDateTime < minAllowed) {
      return Response.json(
        { error: 'Bookings must be made at least 24 hours in advance' },
        { status: 400 }
      );
    }

    // Initialize Base44 SDK (no user auth needed for webhook)
    const base44 = createClientFromRequest(req);

    // Generate booking reference
    const bookingRef = `WEB${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create booking
    const booking = await base44.asServiceRole.entities.Booking.create({
      booking_ref: bookingRef,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone,
      origin: body.origin,
      destination: body.destination,
      origin_coords: body.origin_coords || null,
      destination_coords: body.destination_coords || null,
      vehicle_type: body.vehicle_type,
      distance_km: body.distance_km || 0,
      price: body.price || 0,
      extras: body.extras || [],
      extras_price: body.extras_price || 0,
      transfer_date: body.transfer_date,
      transfer_time: body.transfer_time,
      flight_number: body.flight_number || '',
      passengers: body.passengers || 1,
      luggage: body.luggage || 1,
      notes: body.notes || '',
      status: 'pending',
      payment_status: body.payment_status || 'unpaid',
    });

    return Response.json({
      success: true,
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      message: 'Booking received and stored successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json(
      { error: 'Failed to process booking: ' + error.message },
      { status: 500 }
    );
  }
});