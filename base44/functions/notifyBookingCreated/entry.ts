import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const payload = await req.json();
  const { data: booking } = payload;

  if (!booking || !booking.customer_email) {
    return Response.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'VW Caddy Maxi', minibus: 'Mercedes Vito' };
  const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;

  const paymentInfo = booking.payment_status === 'paid'
    ? '✅ <strong>Pago online via PayPal</strong>'
    : '💵 <strong>Pagamento em dinheiro ao motorista</strong>';

  const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:580px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7); padding:32px 32px 24px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:22px; letter-spacing:-0.3px;">✈️ Transfers Algarvestar</h1>
      <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Reserva Confirmada!</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 20px;">Olá <strong>${booking.customer_name}</strong>,</p>
      <p style="color:#475569; font-size:14px; line-height:1.7; margin:0 0 24px;">
        A sua reserva foi recebida com sucesso. Aqui estão os detalhes da sua viagem:
      </p>

      <!-- Ref -->
      <div style="background:#f0f9ff; border:1.5px solid #bae6fd; border-radius:10px; padding:16px; text-align:center; margin-bottom:24px;">
        <p style="color:#0369a1; font-size:12px; margin:0 0 4px; text-transform:uppercase; letter-spacing:1px;">Referência da Reserva</p>
        <p style="color:#0369a1; font-size:28px; font-weight:700; font-family:monospace; margin:0; letter-spacing:3px;">${booking.booking_ref}</p>
      </div>

      <!-- Details -->
      <table style="width:100%; border-collapse:collapse; margin-bottom:24px;">
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px; width:40%;">🗺️ Origem</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.origin}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">📍 Destino</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.destination}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">📅 Data</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.transfer_date} às ${booking.transfer_time}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">🚗 Veículo</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${vehicleLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">👥 Passageiros</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.passengers} passageiro(s), ${booking.luggage} mala(s)</td>
        </tr>
        ${booking.flight_number ? `
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#64748b; font-size:14px;">✈️ Voo</td>
          <td style="padding:10px 0; border-bottom:1px solid #f1f5f9; color:#1e293b; font-size:14px; font-weight:500;">${booking.flight_number}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:10px 0; color:#64748b; font-size:14px;">💳 Pagamento</td>
          <td style="padding:10px 0; color:#1e293b; font-size:14px;">${paymentInfo}</td>
        </tr>
      </table>

      <!-- Price -->
      <div style="background:#f8fafc; border-radius:10px; padding:16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
        <span style="color:#475569; font-size:14px;">Valor total</span>
        <span style="color:#0369a1; font-size:26px; font-weight:700;">€${Number(booking.price).toFixed(2)}</span>
      </div>

      <!-- Notes -->
      ${booking.notes ? `
      <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; margin-bottom:24px;">
        <p style="color:#92400e; font-size:13px; margin:0;"><strong>Notas:</strong> ${booking.notes}</p>
      </div>` : ''}

      <!-- Contact -->
      <div style="background:#f8fafc; border-radius:10px; padding:16px; text-align:center;">
        <p style="color:#475569; font-size:13px; margin:0 0 8px; font-weight:600;">Precisa de ajuda?</p>
        <p style="color:#64748b; font-size:13px; margin:0;">📞 +351 913 956 971 &nbsp;|&nbsp; 📧 info@transfers-algarvestar.com</p>
        <p style="margin:6px 0 0;"><a href="https://wa.me/351913956971" style="color:#16a34a; font-size:13px; text-decoration:none;">💬 WhatsApp</a></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">© ${new Date().getFullYear()} Transfers Algarvestar. Algarve, Portugal.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await base44.integrations.Core.SendEmail({
    to: booking.customer_email,
    subject: `✅ Reserva Confirmada — ${booking.booking_ref} | Transfers Algarvestar`,
    body,
  });

  return Response.json({ ok: true });
});