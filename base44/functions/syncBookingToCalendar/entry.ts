import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VEHICLE_LABEL = {
  sedan: 'Sedan Conforto',
  minivan: 'Minivan Premium',
  minibus: 'Minibus Grupo',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    // Called from entity automation — payload has event + data
    const booking = payload.data;
    const eventType = payload.event?.type;

    if (!booking || !booking.id) {
      return Response.json({ status: 'skipped', reason: 'no booking data' });
    }

    // Only sync if status is confirmed (or in_progress) and has a driver
    const syncableStatuses = ['confirmed', 'in_progress'];

    // If cancelled, delete the calendar event if it exists
    if (booking.status === 'cancelled') {
      if (booking.google_calendar_event_id) {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${booking.google_calendar_event_id}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
        );
        await base44.asServiceRole.entities.Booking.update(booking.id, { google_calendar_event_id: null });
      }
      return Response.json({ status: 'deleted' });
    }

    if (!syncableStatuses.includes(booking.status)) {
      return Response.json({ status: 'skipped', reason: 'status not syncable' });
    }

    if (!booking.transfer_date || !booking.transfer_time) {
      return Response.json({ status: 'skipped', reason: 'missing date/time' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Build ISO datetime strings (assume Europe/Lisbon = UTC+1 in summer)
    const startDateTime = `${booking.transfer_date}T${booking.transfer_time}:00`;
    // Estimate end time as start + 2 hours
    const [h, m] = booking.transfer_time.split(':').map(Number);
    const endH = String(h + 2).padStart(2, '0');
    const endDateTime = `${booking.transfer_date}T${endH}:${String(m).padStart(2, '0')}:00`;

    const vehicleLabel = VEHICLE_LABEL[booking.vehicle_type] || booking.vehicle_type;
    const driverInfo = booking.driver_name ? `Motorista: ${booking.driver_name}` : 'Sem motorista atribuído';
    const extrasInfo = booking.extras?.length ? `\nExtras: ${booking.extras.join(', ')}` : '';

    const eventBody = {
      summary: `🚗 Transfer ${booking.booking_ref} — ${booking.customer_name}`,
      description: [
        `Ref: ${booking.booking_ref}`,
        `Cliente: ${booking.customer_name}`,
        `Tel: ${booking.customer_phone || '—'}`,
        `Rota: ${booking.origin} → ${booking.destination}`,
        `Veículo: ${vehicleLabel}`,
        `Passageiros: ${booking.passengers || 1} | Malas: ${booking.luggage || 0}`,
        booking.flight_number ? `Voo: ${booking.flight_number}` : '',
        driverInfo,
        `Pagamento: ${booking.payment_status === 'paid' ? '✅ Pago' : '💵 A cobrar €' + (booking.price || 0).toFixed(2)}`,
        extrasInfo,
        booking.notes ? `\nNotas: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: { dateTime: startDateTime, timeZone: 'Europe/Lisbon' },
      end: { dateTime: endDateTime, timeZone: 'Europe/Lisbon' },
      location: booking.origin,
      colorId: booking.status === 'confirmed' ? '9' : '6', // 9=blueberry, 6=tangerine
    };

    let calendarEventId = booking.google_calendar_event_id;
    let response;

    if (calendarEventId) {
      // Update existing event
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${calendarEventId}`,
        { method: 'PUT', headers: authHeader, body: JSON.stringify(eventBody) }
      );
      if (response.status === 404) {
        // Event no longer exists — create a new one
        calendarEventId = null;
      }
    }

    if (!calendarEventId) {
      // Create new event
      response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        { method: 'POST', headers: authHeader, body: JSON.stringify(eventBody) }
      );
    }

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ status: 'error', details: err }, { status: 500 });
    }

    const createdEvent = await response.json();

    // Save event ID back to booking if it changed
    if (createdEvent.id && createdEvent.id !== booking.google_calendar_event_id) {
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        google_calendar_event_id: createdEvent.id,
      });
    }

    return Response.json({ status: 'ok', event_id: createdEvent.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});