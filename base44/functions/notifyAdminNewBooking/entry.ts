import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
const FROM = FROM_EMAIL.includes('<') ? FROM_EMAIL : `Transfers AlgarveStar <${FROM_EMAIL}>`;
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'info@transfers-algarvestar.com';

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

const INTERNAL_SECRET = Deno.env.get('INTERNAL_AUTOMATION_SECRET') ;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    const base44 = createClientFromRequest(req);
    if (authHeader !== INTERNAL_SECRET) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const payload = await req.json();
    const { data: booking } = payload;

    if (!booking) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus' }[booking.vehicle_type] || booking.vehicle_type;
    const paymentStatus = booking.payment_status === 'paid' ? 'PayPal' : 'Cash';

    const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:700px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:28px 32px;">
      <h1 style="color:#fff; margin:0; font-size:22px;">🚗 Nova Reserva Recebida</h1>
      <p style="color:rgba(255,255,255,0.75); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <div style="background:#e0f2fe; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:24px;">
        <p style="color:#0369a1; font-size:11px; margin:0 0 2px; text-transform:uppercase; letter-spacing:1px;">Referência da Reserva</p>
        <p style="color:#0369a1; font-size:24px; font-weight:700; font-family:monospace; margin:0; letter-spacing:2px;">${booking.booking_ref}</p>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; width:40%; font-weight:600;">Cliente</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;"><strong>${booking.customer_name}</strong></td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">Email</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.customer_email}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">Telefone</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.customer_phone}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">📅 Data/Hora</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;"><strong>${booking.transfer_date}</strong> às <strong>${booking.transfer_time}</strong></td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">🟢 Origem</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.origin}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">🔴 Destino</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.destination}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">🚗 Veículo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${vehicleLabel}</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">📏 Distância</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.distance_km} km</td></tr>
        <tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">👥 Passageiros</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.passengers} pax, ${booking.luggage} mala(s)</td></tr>
        ${booking.flight_number ? `<tr><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; font-weight:600;">✈️ Voo</td><td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px;">${booking.flight_number}</td></tr>` : ''}
      </table>
      <div style="background:#f8fafc; border-radius:10px; padding:16px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="color:#475569; font-size:14px; font-weight:600;">Valor Total</span>
          <span style="font-size:22px; font-weight:700; color:#0369a1;">€${Number(booking.price || 0).toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="color:#475569; font-size:12px;">Pagamento</span>
          <span style="color:#1e293b; font-size:13px; font-weight:600;">${paymentStatus}</span>
        </div>
      </div>
      ${booking.notes ? `<div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:20px;"><p style="color:#92400e; font-size:13px; margin:0;"><strong>Notas:</strong> ${booking.notes}</p></div>` : ''}
      <div style="text-align:center; padding-top:16px;">
        <a href="https://transfers-algarvestar.com/admin" style="display:inline-block; background:#c8a951; color:#fff; text-decoration:none; padding:12px 32px; border-radius:6px; font-weight:bold; font-size:14px;">Ver no Painel</a>
      </div>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar | 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>`.trim();

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚗 Nova Reserva: ${booking.booking_ref} | ${booking.transfer_date} ${booking.transfer_time}`,
      body,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('notifyAdminNewBooking error:', error?.message || error);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});