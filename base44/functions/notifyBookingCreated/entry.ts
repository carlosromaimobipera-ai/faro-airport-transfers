import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { sendEmail, buildVoucherPdfBase64, buildVoucherEmailHtml, getVoucherSubject, ADMIN_EMAIL } from "../../shared/voucher.ts";

const INTERNAL_SECRET = Deno.env.get("INTERNAL_AUTOMATION_SECRET");

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("x-internal-secret");
    const base44 = createClientFromRequest(req);
    if (!INTERNAL_SECRET || authHeader !== INTERNAL_SECRET) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const payload = await req.json();
    const { data: booking } = payload;

    if (!booking || !booking.customer_email) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Marketing KPI: Reservas semanais
    try {
      await base44.analytics.track({ eventName: "booking_created" });
    } catch (trackErr) {
      console.error("analytics.track booking_created failed:", trackErr?.message || trackErr);
    }

    // Generate PDF voucher
    let pdfBase64 = null;
    try {
      pdfBase64 = buildVoucherPdfBase64(booking);
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr?.message);
    }

    // Email ao cliente
    await sendEmail({
      to: booking.customer_email,
      subject: getVoucherSubject(booking),
      body: buildVoucherEmailHtml(booking),
      attachments: pdfBase64
        ? [{ filename: `voucher-${booking.booking_ref}.pdf`, content: pdfBase64 }]
        : undefined,
    });

    // Email ao admin
    const adminBody = `<p>Nova reserva recebida: <strong>${booking.booking_ref}</strong></p>
<p>Cliente: ${booking.customer_name} (${booking.customer_email})<br/>
Rota: ${booking.origin} → ${booking.destination}<br/>
Data: ${booking.transfer_date} ${booking.transfer_time}<br/>
Veículo: ${booking.vehicle_type} | €${Number(booking.price || 0).toFixed(2)} | ${booking.payment_status === "paid" ? "Pago (PayPal)" : "A pagar (Cash)"}</p>
<p><a href="https://lisbonsevillefaroriders.com/admin">Ver no painel de administração →</a></p>`;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚗 Nova Reserva: ${booking.booking_ref} | ${booking.transfer_date} ${booking.transfer_time}`,
      body: adminBody,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("notifyBookingCreated error:", err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});