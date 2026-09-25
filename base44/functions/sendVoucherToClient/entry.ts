import { createClientFromRequest } from "npm:@base44/sdk@0.8.25";
import { sendEmail, buildVoucherPdfBase64, buildVoucherEmailHtml, getVoucherSubject } from "../../shared/voucher.ts";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== "admin") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { booking_id } = await req.json();
    if (!booking_id) {
      return Response.json({ error: "booking_id required" }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) {
      return Response.json({ error: "Booking not found" }, { status: 404 });
    }
    if (!booking.customer_email) {
      return Response.json({ error: "Booking has no customer email" }, { status: 400 });
    }

    // Generate PDF voucher
    let pdfBase64 = null;
    try {
      pdfBase64 = buildVoucherPdfBase64(booking);
    } catch (pdfErr) {
      console.error("PDF generation failed:", pdfErr?.message);
    }

    // Send voucher email to customer
    await sendEmail({
      to: booking.customer_email,
      subject: getVoucherSubject(booking),
      body: buildVoucherEmailHtml(booking),
      attachments: pdfBase64
        ? [{ filename: `voucher-${booking.booking_ref}.pdf`, content: pdfBase64 }]
        : undefined,
    });

    return Response.json({ ok: true, sent_to: booking.customer_email });
  } catch (err) {
    console.error("sendVoucherToClient error:", err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});