import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = 'Transfers Algarvestar <info@transfers-algarvestar.com>';

async function sendEmail({ to, subject, body }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html: body }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + 75 * 60 * 1000);

  const bookings = await base44.asServiceRole.entities.Booking.filter({ transfer_date: todayStr });

  const eligible = bookings.filter(b => {
    if (!b.transfer_time || !b.driver_id) return false;
    if (b.status === 'cancelled' || b.status === 'completed') return false;
    const [h, m] = b.transfer_time.split(':').map(Number);
    const bookingTime = new Date(now);
    bookingTime.setHours(h, m, 0, 0);
    return bookingTime >= windowStart && bookingTime <= windowEnd;
  });

  if (eligible.length === 0) return Response.json({ ok: true, checked: bookings.length, reminders: 0 });

  const sentinels = await base44.asServiceRole.entities.DriverLocation.filter({ heading: 999 });
  const alreadySent = new Set(sentinels.map(s => s.booking_id));

  const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'VW Caddy Maxi', minibus: 'Mercedes Vito' };
  let remindersSent = 0;

  for (const booking of eligible) {
    if (alreadySent.has(booking.id)) continue;

    const drivers = await base44.asServiceRole.entities.Driver.filter({ id: booking.driver_id });
    const driver = drivers[0];
    if (!driver?.email) continue;

    const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;
    const mapsOriginUrl = booking.origin_coords?.lat
      ? `https://www.google.com/maps/dir/?api=1&destination=${booking.origin_coords.lat},${booking.origin_coords.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.origin)}`;

    const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#c2410c,#ea580c); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:22px;">⏰ Lembrete — 1 hora para a recolha</h1>
      <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 12px;">Olá <strong>${driver.name}</strong>,</p>
      <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 24px;">A sua próxima recolha começa <strong style="color:#c2410c;">em aproximadamente 1 hora</strong>. Confirme todos os detalhes abaixo.</p>
      <div style="background:#fff7ed; border-left:4px solid #c2410c; border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:24px;">
        <p style="color:#9a3412; font-size:11px; margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Referência</p>
        <p style="color:#c2410c; font-size:22px; font-weight:700; font-family:monospace; margin:0; letter-spacing:2px;">${booking.booking_ref}</p>
      </div>
      <div style="background:#fef3c7; border:1px solid #fbbf24; border-radius:12px; padding:18px; margin-bottom:24px; text-align:center;">
        <p style="color:#92400e; font-size:13px; margin:0 0 4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Hora de recolha</p>
        <p style="color:#78350f; font-size:36px; font-weight:800; margin:0; font-family:monospace;">${booking.transfer_time}</p>
        <p style="color:#92400e; font-size:13px; margin:6px 0 0;">${booking.transfer_date}</p>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; width:40%;">🟢 Origem</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:600;">${booking.origin}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🔴 Destino</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.destination}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">👥 Passageiros</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.passengers} pax · ${booking.luggage} mala(s)</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🚗 Veículo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${vehicleLabel}</td></tr>
        ${booking.flight_number ? `<tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">✈️ Voo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.flight_number}</td></tr>` : ''}
      </table>
      <div style="background:#f8fafc; border-radius:10px; padding:16px; margin-bottom:24px;">
        <p style="color:#475569; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 10px; font-weight:600;">Cliente</p>
        <p style="color:#1e293b; font-size:15px; font-weight:700; margin:0 0 6px;">${booking.customer_name}</p>
        <a href="tel:${booking.customer_phone}" style="display:inline-block; background:#16a34a; color:#fff; padding:8px 16px; border-radius:8px; font-size:14px; font-weight:600; text-decoration:none;">📞 ${booking.customer_phone}</a>
      </div>
      ${booking.notes ? `<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:20px;"><p style="color:#92400e; font-size:13px; margin:0;"><strong>Notas:</strong> ${booking.notes}</p></div>` : ''}
      <div style="background:${booking.payment_status === 'paid' ? '#f0fdf4' : '#fff7ed'}; border:1px solid ${booking.payment_status === 'paid' ? '#86efac' : '#fed7aa'}; border-radius:10px; padding:14px; margin-bottom:24px;">
        <span style="color:#475569; font-size:14px;">
          ${booking.payment_status === 'paid' ? '✅ Já pago via PayPal — não cobrar' : `💵 Cobrar em dinheiro: <strong style="color:#c2410c; font-size:18px;">€${Number(booking.price).toFixed(2)}</strong>`}
        </span>
      </div>
      <a href="${mapsOriginUrl}" target="_blank" style="display:block; background:#1d4ed8; color:#fff; text-align:center; padding:14px; border-radius:12px; font-size:15px; font-weight:700; text-decoration:none;">
        🗺️ Navegar para o local de recolha
      </a>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Dúvidas? Contacte a equipa: 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>`.trim();

    await sendEmail({
      to: driver.email,
      subject: `⏰ Lembrete — ${booking.transfer_time} | ${booking.booking_ref} | ${booking.origin}`,
      body,
    });

    await base44.asServiceRole.entities.DriverLocation.create({
      driver_id: booking.driver_id,
      driver_name: driver.name,
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      lat: 0, lng: 0,
      heading: 999,
      recorded_at: now.toISOString(),
    });

    remindersSent++;
  }

  return Response.json({ ok: true, checked: bookings.length, eligible: eligible.length, reminders: remindersSent });
});