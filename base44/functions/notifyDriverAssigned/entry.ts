import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = 'Transfers Algarvestar <carlosroma.imobipera@gmail.com>';

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

const langTexts = {
  pt: { subject: '🚗 Nova viagem — {ref} | {date} {time}', newAssignment: '🚗 Nova Viagem Atribuída', message: 'Foi-lhe atribuída uma nova reserva. Por favor, confirme a sua disponibilidade e esteja pronto a horas.' },
  en: { subject: '🚗 New Trip — {ref} | {date} {time}', newAssignment: '🚗 New Trip Assigned', message: 'You have been assigned a new booking. Please confirm your availability and be ready on time.' },
  es: { subject: '🚗 Nuevo Viaje — {ref} | {date} {time}', newAssignment: '🚗 Nuevo Viaje Asignado', message: 'Se le ha asignado una nueva reserva. Por favor, confirme su disponibilidad y esté listo a tiempo.' },
  fr: { subject: '🚗 Nouveau Trajet — {ref} | {date} {time}', newAssignment: '🚗 Nouveau Trajet Attribué', message: "Un nouveau trajet vous a été attribué. Veuillez confirmer votre disponibilité et être prêt à l'heure." },
  de: { subject: '🚗 Neue Fahrt — {ref} | {date} {time}', newAssignment: '🚗 Neue Fahrt Zugewiesen', message: 'Ihnen wurde eine neue Buchung zugewiesen. Bitte bestätigen Sie Ihre Verfügbarkeit und seien Sie pünktlich bereit.' },
  nl: { subject: '🚗 Nieuwe Rit — {ref} | {date} {time}', newAssignment: '🚗 Nieuwe Rit Toegewezen', message: 'U bent een nieuwe boeking toegewezen. Bevestig alstublieft uw beschikbaarheid en wees op tijd klaar.' }
};

const INTERNAL_SECRET = Deno.env.get('INTERNAL_AUTOMATION_SECRET');

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    const base44 = createClientFromRequest(req);
    if (!INTERNAL_SECRET || authHeader !== INTERNAL_SECRET) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const payload = await req.json();
    const { data: booking, old_data } = payload;

    if (!booking?.driver_id) return Response.json({ skipped: 'no driver assigned' });
    if (old_data?.driver_id === booking.driver_id) return Response.json({ skipped: 'same driver, no change' });

    const drivers = await base44.asServiceRole.entities.Driver.filter({ id: booking.driver_id });
    const driver = drivers[0];
    if (!driver || !driver.email) return Response.json({ skipped: 'driver has no email' });

    const lang = booking.language || 'pt';
    const langText = langTexts[lang] || langTexts['pt'];
    const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'VW Caddy Maxi', minibus: 'Mercedes Vito' };
    const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;
    const greeting = { en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', nl: 'Hallo', pt: 'Olá' }[lang] || 'Olá';

    const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:20px;">${langText.newAssignment}</h1>
      <p style="color:rgba(255,255,255,0.75); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 16px;">${greeting} <strong>${driver.name}</strong>,</p>
      <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 24px;">${langText.message}</p>
      <div style="background:#e0f2fe; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:24px;">
        <p style="color:#0369a1; font-size:11px; margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Referência</p>
        <p style="color:#0369a1; font-size:22px; font-weight:700; font-family:monospace; margin:0; letter-spacing:2px;">${booking.booking_ref}</p>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; width:40%;">📅 Data/Hora</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:15px; font-weight:700;">${booking.transfer_date} às ${booking.transfer_time}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🟢 Origem</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.origin}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🔴 Destino</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.destination}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🚗 Veículo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${vehicleLabel}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">📏 Distância</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.distance_km} km</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">👥 Passageiros</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.passengers} pax, ${booking.luggage} mala(s)</td></tr>
        ${booking.flight_number ? `<tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">✈️ Voo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.flight_number}</td></tr>` : ''}
      </table>
      <div style="background:#f8fafc; border-radius:10px; padding:16px; margin-bottom:24px;">
        <p style="color:#475569; font-size:12px; text-transform:uppercase; letter-spacing:1px; margin:0 0 10px; font-weight:600;">Dados do Cliente</p>
        <p style="color:#1e293b; font-size:14px; margin:0 0 4px;"><strong>${booking.customer_name}</strong></p>
        <p style="color:#475569; font-size:13px; margin:0 0 4px;">📞 ${booking.customer_phone}</p>
        <p style="color:#475569; font-size:13px; margin:0;">📧 ${booking.customer_email}</p>
      </div>
      ${booking.notes ? `<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:20px;"><p style="color:#92400e; font-size:13px; margin:0;"><strong>Notas do cliente:</strong> ${booking.notes}</p></div>` : ''}
      <div style="background:${booking.payment_status === 'paid' ? '#f0fdf4' : '#fff7ed'}; border:1px solid ${booking.payment_status === 'paid' ? '#86efac' : '#fed7aa'}; border-radius:10px; padding:14px;">
        <span style="color:#475569; font-size:14px;">
          ${booking.payment_status === 'paid' ? '✅ Já pago via PayPal' : `💵 Cobrar em dinheiro: <strong style="color:#c2410c;">€${Number(booking.price).toFixed(2)}</strong>`}
        </span>
      </div>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Dúvidas? Contacte a equipa: 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>`.trim();

    await sendEmail({
      to: driver.email,
      subject: langText.subject.replace('{ref}', booking.booking_ref).replace('{date}', booking.transfer_date).replace('{time}', booking.transfer_time),
      body,
    });

    return Response.json({ ok: true, driver: driver.name });
  } catch (error) {
    console.error('notifyDriverAssigned error:', error?.message || error);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});