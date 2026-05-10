import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = 'Transfers Algarvestar <onboarding@resend.dev>';

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
  pt: { subject: 'Sua avaliação importa — Transfers AlgarveStar', title: 'Avalie sua experiência', message: 'Obrigado por confiar em nós! Gostaríamos de saber como correu sua viagem.' },
  en: { subject: 'Your feedback matters — Transfers AlgarveStar', title: 'Rate your experience', message: "Thank you for trusting us! We'd like to know how your trip went." },
  es: { subject: 'Su opinión es importante — Transfers AlgarveStar', title: 'Califique su experiencia', message: '¡Gracias por confiar en nosotros! Nos gustaría saber cómo fue su viaje.' },
  fr: { subject: 'Votre avis nous importe — Transfers AlgarveStar', title: 'Évaluez votre expérience', message: "Merci de nous faire confiance ! Nous aimerions savoir comment s'est passé votre voyage." },
  de: { subject: 'Ihre Meinung ist uns wichtig — Transfers AlgarveStar', title: 'Bewerten Sie Ihre Erfahrung', message: 'Danke, dass Sie uns vertrauen! Wir möchten gerne wissen, wie Ihre Fahrt war.' },
  nl: { subject: 'Uw feedback is belangrijk — Transfers AlgarveStar', title: 'Beoordeel uw ervaring', message: 'Bedankt dat u ons vertrouwt! We zouden graag weten hoe uw reis ging.' }
};

const rateLabels = { pt: 'Avalie Agora', en: 'Rate Now', es: 'Calificar Ahora', fr: 'Évaluer Maintenant', de: 'Jetzt Bewerten', nl: 'Beoordeel Nu' };
const tripLabels = { pt: 'Detalhes da viagem', en: 'Trip details', es: 'Detalles del viaje', fr: 'Détails du voyage', de: 'Fahrtdetails', nl: 'Reisgegevens' };
const helpLabels = { pt: 'Sua opinião nos ajuda a melhorar.', en: 'Your feedback helps us improve.', es: 'Su opinión nos ayuda a mejorar.', fr: 'Vos commentaires nous aident à nous améliorer.', de: 'Ihr Feedback hilft uns, besser zu werden.', nl: 'Uw feedback helpt ons beter te worden.' };
const thanksLabels = { pt: 'Obrigado por sua avaliação!', en: 'Thank you for your review!', es: '¡Gracias por tu reseña!', fr: 'Merci pour votre avis !', de: 'Danke für Ihre Bewertung!', nl: 'Bedankt voor uw review!' };

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const bookings = await base44.asServiceRole.entities.Booking.list('-transfer_date', 1000);
  const now = Date.now();
  const feedbackSent = [];

  for (const booking of bookings) {
    if (!booking.transfer_date || !booking.customer_email) continue;
    if (booking.status !== 'completed') continue;

    const existingReviews = await base44.asServiceRole.entities.Review.filter({ booking_id: booking.id });
    if (existingReviews.length > 0) continue;

    const transferTime = new Date(booking.transfer_date + 'T23:59:59').getTime();
    const hoursSince = (now - transferTime) / (1000 * 60 * 60);

    if (hoursSince >= 24 && hoursSince < 48) {
      const lang = booking.language || 'pt';
      const langText = langTexts[lang] || langTexts['pt'];
      const reviewLink = `https://g.page/r/CeOr3i7UjtNxEBM/review`;

      const body = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:20px;">⭐ ${langText.title}</h1>
      <p style="color:rgba(255,255,255,0.75); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 16px;">${langText.message}</p>
      <div style="background:#f0f9ff; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:16px; margin:20px 0; line-height:1.6;">
        <p style="color:#0369a1; font-size:14px; margin:0 0 8px;"><strong>${tripLabels[lang] || tripLabels['pt']}</strong></p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">📍 ${booking.origin} → ${booking.destination}</p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">📅 ${booking.transfer_date} | 🕐 ${booking.transfer_time}</p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">🚗 Ref: ${booking.booking_ref}</p>
      </div>
      <p style="color:#475569; font-size:14px; margin:20px 0;">${helpLabels[lang] || helpLabels['pt']}</p>
      <a href="${reviewLink}" style="display:inline-block; background:#c8a951; color:#fff; text-decoration:none; padding:12px 32px; border-radius:6px; font-weight:bold; margin:24px 0; font-size:14px;">
        ${rateLabels[lang] || rateLabels['pt']}
      </a>
      <p style="color:#64748b; font-size:12px; margin:24px 0 0;">${thanksLabels[lang] || thanksLabels['pt']}</p>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar | 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>`.trim();

      await sendEmail({ to: booking.customer_email, subject: langText.subject, body });
      feedbackSent.push({ booking_ref: booking.booking_ref, customer_email: booking.customer_email });
    }
  }

  return Response.json({ ok: true, sent: feedbackSent.length, details: feedbackSent });
});