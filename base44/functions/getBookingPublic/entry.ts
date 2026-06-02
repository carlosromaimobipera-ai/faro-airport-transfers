import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Public endpoint — returns booking by ID without requiring auth.
// Used on the /confirmacao page for guest users who just completed a booking.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    return Response.json({ booking });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});