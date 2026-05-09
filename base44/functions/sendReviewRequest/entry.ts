import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const payload = await req.json();
  const { data: booking } = payload;

  if (!booking?.customer_email || !booking?.id) {
    return Response.json({ skipped: 'invalid payload' });
  }

  // Only send for completed bookings
  if (booking.status !== 'completed') {
    return Response.json({ skipped: 'booking not completed' });
  }

  const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';
  const reviewUrl = `${appUrl}/review?booking_id=${booking.id}&ref=${booking.booking_ref}`;

  const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f7fb;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0369a1,#0284c7);padding:32px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">⭐</div>
      <h1 style="color:#fff;margin:0;font-size:20px;">Como foi a sua viagem?</h1>
      <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:32px;">
      <p style="color:#334155;font-size:16px;margin:0 0 12px;">Olá <strong>${booking.customer_name}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Esperamos que a sua viagem de <strong>${booking.origin}</strong> para <strong>${booking.destination}</strong> tenha corrido bem!<br>
        A sua opinião é muito importante para nós. Demore apenas 1 minuto a partilhar a sua experiência.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${reviewUrl}" style="background:linear-gradient(135deg,#0369a1,#0284c7);color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:16px;font-weight:600;display:inline-block;box-shadow:0 4px 14px rgba(3,105,161,0.35);">
          ⭐ Classificar a minha viagem
        </a>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
        Reserva: <strong>${booking.booking_ref}</strong> · ${booking.transfer_date}
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Transfers Algarvestar — info@transfers-algarvestar.com</p>
    </div>
  </div>
</body>
</html>`.trim();

  await base44.integrations.Core.SendEmail({
    to: booking.customer_email,
    from_name: 'Transfers Algarvestar',
    subject: `⭐ Como foi a sua viagem? — ${booking.booking_ref}`,
    body,
  });

  return Response.json({ ok: true });
});