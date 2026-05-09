import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.list('created_date', 1000);

    if (!bookings || bookings.length === 0) {
      return new Response('booking_ref,customer_name,customer_email,customer_phone,origin,destination,distance_km,price,vehicle_type,transfer_date,transfer_time,status,payment_status\n', {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="reservas.csv"'
        }
      });
    }

    const csvHeader = 'booking_ref,customer_name,customer_email,customer_phone,origin,destination,distance_km,price,vehicle_type,transfer_date,transfer_time,status,payment_status\n';
    
    const csvRows = bookings.map(booking => {
      return [
        `"${booking.booking_ref || ''}"`,
        `"${booking.customer_name || ''}"`,
        `"${booking.customer_email || ''}"`,
        `"${booking.customer_phone || ''}"`,
        `"${booking.origin || ''}"`,
        `"${booking.destination || ''}"`,
        booking.distance_km || '',
        booking.price || '',
        booking.vehicle_type || '',
        booking.transfer_date || '',
        booking.transfer_time || '',
        booking.status || '',
        booking.payment_status || ''
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows + '\n';

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reservas.csv"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});