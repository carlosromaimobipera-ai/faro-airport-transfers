import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const INTERNAL_SECRET = secrets.get("INTERNAL_AUTOMATION_SECRET");

    // Auth: internal secret header or admin user
    const authHeader = req.headers.get("x-internal-secret");
    const authed = INTERNAL_SECRET && authHeader === INTERNAL_SECRET;
    if (!authed) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    // Fetch recent completed bookings (service role bypasses RLS)
    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { status: "completed" },
      "-transfer_date",
      200
    );

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const booking of bookings) {
      // Skip if already requested
      if (booking.review_requested === true) { skipped++; continue; }

      // Need transfer_date + transfer_time to compute the 2h mark
      if (!booking.transfer_date || !booking.transfer_time || !booking.customer_email) {
        skipped++;
        continue;
      }

      const transferDateTime = new Date(`${booking.transfer_date}T${booking.transfer_time}`);
      if (isNaN(transferDateTime.getTime())) { skipped++; continue; }

      const twoHoursAfter = new Date(transferDateTime.getTime() + TWO_HOURS_MS);
      if (twoHoursAfter > now) { skipped++; continue; }

      // Send review request via existing function
      try {
        const res = await base44.asServiceRole.functions.invoke("sendReviewRequest", {
          data: booking,
          internal_secret: INTERNAL_SECRET,
        });
        if (res.data?.ok) {
          await base44.asServiceRole.entities.Booking.update(booking.id, { review_requested: true });
          sent++;
        } else {
          failed++;
        }
      } catch (e) {
        console.log("Review request failed for booking", booking.id, e.message);
        failed++;
      }
    }

    return Response.json({ sent, skipped, failed, checked: bookings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}