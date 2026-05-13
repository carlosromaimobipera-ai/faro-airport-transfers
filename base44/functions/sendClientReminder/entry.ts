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

const INTERNAL_SECRET = Deno.env.get('INTERNAL_AUTOMATION_SECRET');

Deno.serve(async (req) => {
  try {
  const authHeader = req.headers.get('x-internal-secret');
  const base44 = createClientFromRequest(req);
  // Allow: internal secret OR admin user
  if (!INTERNAL_SECRET || authHeader !== INTERNAL_SECRET) {
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const bookings = await base44.asServiceRole.entities.Booking.filter({ transfer_date: tomorrowStr });
  const eligible = bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed' && b.customer_email);

  if (eligible.length === 0) return Response.json({ ok: true, checked: bookings.length, reminders: 0 });

  const sentinels = await base44.asServiceRole.entities.ClientReminder.filter({ reminder_date: tomorrowStr });
  const alreadySent = new Set(sentinels.map(s => s.booking_id));

  const vehicleLabels = { sedan: 'Sedan Conforto', minivan: 'Minivan', minibus: 'Minibus Grupo' };
  let remindersSent = 0;

  for (const booking of eligible) {
    if (alreadySent.has(booking.id)) continue;

    const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;
    const lang = booking.language || 'pt';

    const subjects = {
      pt: `🚗 Lembrete da sua viagem amanhã — ${booking.booking_ref}`,
      en: `🚗 Reminder: Your transfer tomorrow — ${booking.booking_ref}`,
      es: `🚗 Recordatorio de su viaje mañana — ${booking.booking_ref}`,
      fr: `🚗 Rappel de votre transfert demain — ${booking.booking_ref}`,
      de: `🚗 Erinnerung: Ihr Transfer morgen — ${booking.booking_ref}`,
      nl: `🚗 Herinnering: Uw transfer morgen — ${booking.booking_ref}`,
    };

    const greetings = {
      pt: `Olá <strong>${booking.customer_name}</strong>! A sua viagem é <strong>amanhã</strong>. Confirme os detalhes abaixo.`,
      en: `Hello <strong>${booking.customer_name}</strong>! Your trip is <strong>tomorrow</strong>. Please confirm the details below.`,
      es: `Hola <strong>${booking.customer_name}</strong>! Su viaje es <strong>mañana</strong>. Confirme los detalles a continuación.`,
      fr: `Bonjour <strong>${booking.customer_name}</strong>! Votre trajet est <strong>demain</strong>. Veuillez confirmer les détails ci-dessous.`,
      de: `Hallo <strong>${booking.customer_name}</strong>! Ihre Fahrt ist <strong>morgen</strong>. Bitte bestätigen Sie die Details unten.`,
      nl: `Hallo <strong>${booking.customer_name}</strong>! Uw rit is <strong>morgen</strong>. Bevestig de onderstaande details.`,
    };

    const body = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0369a1,#0ea5e9); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:22px;">🚗 A sua viagem é amanhã!</h1>
      <p style="color:rgba(255,255,255,0.8); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 20px;">${greetings[lang] || greetings['pt']}</p>
      <div style="background:#eff6ff; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:24px;">
        <p style="color:#1d4ed8; font-size:11px; margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Referência</p>
        <p style="color:#0369a1; font-size:22px; font-weight:700; font-family:monospace; margin:0; letter-spacing:2px;">${booking.booking_ref}</p>
      </div>
      <div style="background:#f0f9ff; border:1px solid #7dd3fc; border-radius:12px; padding:18px; margin-bottom:24px; text-align:center;">
        <p style="color:#0369a1; font-size:13px; margin:0 0 4px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Hora de recolha</p>
        <p style="color:#0c4a6e; font-size:36px; font-weight:800; margin:0; font-family:monospace;">${booking.transfer_time}</p>
        <p style="color:#0369a1; font-size:13px; margin:6px 0 0;">${booking.transfer_date}</p>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; width:40%;">🟢 Origem</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:600;">${booking.origin}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🔴 Destino</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.destination}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">👥 Passageiros</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.passengers} pax · ${booking.luggage} mala(s)</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🚗 Veículo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${vehicleLabel}</td></tr>
        ${booking.flight_number ? `<tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">✈️ Voo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.flight_number}</td></tr>` : ''}
      </table>
      <div style="background:${booking.payment_status === 'paid' ? '#f0fdf4' : '#fff7ed'}; border:1px solid ${booking.payment_status === 'paid' ? '#86efac' : '#fed7aa'}; border-radius:10px; padding:14px; margin-bottom:24px;">
        <span style="color:#475569; font-size:14px;">
          ${booking.payment_status === 'paid' ? '✅ Pagamento já efetuado via PayPal' : `💵 Pagamento em dinheiro ao motorista: <strong style="color:#c2410c; font-size:18px;">€${Number(booking.price).toFixed(2)}</strong>`}
        </span>
      </div>
      ${booking.notes ? `<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:20px;"><p style="color:#92400e; font-size:13px; margin:0;"><strong>As suas notas:</strong> ${booking.notes}</p></div>` : ''}
      <a href="https://wa.me/351913956971?text=Olá%2C%20tenho%20a%20reserva%20${booking.booking_ref}" target="_blank"
        style="display:block; background:#25d366; color:#fff; text-align:center; padding:14px; border-radius:12px; font-size:15px; font-weight:700; text-decoration:none;">
        💬 Contactar via WhatsApp
      </a>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar · 📞 +351 913 956 971 · info@transfers-algarvestar.com</p>
    </div>
  </div>
</body>
</html>`.trim();

    await sendEmail({ to: booking.customer_email, subject: subjects[lang] || subjects['pt'], body });

    await base44.asServiceRole.entities.ClientReminder.create({
      booking_id: booking.id,
      booking_ref: booking.booking_ref,
      reminder_date: tomorrowStr,
      sent_at: now.toISOString(),
    });

    remindersSent++;
  }

  return Response.json({ ok: true, checked: bookings.length, eligible: eligible.length, reminders: remindersSent });
  } catch (err) {
    console.error('sendClientReminder error:', err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});