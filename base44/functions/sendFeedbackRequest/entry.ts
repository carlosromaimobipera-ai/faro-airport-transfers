import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const langTexts = {
  pt: { subject: 'Sua avaliação importa — Transfers AlgarveStar', title: 'Avalie sua experiência', message: 'Obrigado por confiar em nós! Gostaríamos de saber como correu sua viagem.' },
  en: { subject: 'Your feedback matters — Transfers AlgarveStar', title: 'Rate your experience', message: 'Thank you for trusting us! We\'d like to know how your trip went.' },
  es: { subject: 'Su opinión es importante — Transfers AlgarveStar', title: 'Califique su experiencia', message: '¡Gracias por confiar en nosotros! Nos gustaría saber cómo fue su viaje.' },
  fr: { subject: 'Votre avis nous importe — Transfers AlgarveStar', title: 'Évaluez votre expérience', message: 'Merci de nous faire confiance ! Nous aimerions savoir comment s\'est passé votre voyage.' },
  de: { subject: 'Ihre Meinung ist uns wichtig — Transfers AlgarveStar', title: 'Bewerten Sie Ihre Erfahrung', message: 'Danke, dass Sie uns vertrauen! Wir möchten gerne wissen, wie Ihre Fahrt war.' },
  nl: { subject: 'Uw feedback is belangrijk — Transfers AlgarveStar', title: 'Beoordeel uw ervaring', message: 'Bedankt dat u ons vertrouwt! We zouden graag weten hoe uw reis ging.' }
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get all bookings from the last 2 days
  const today = new Date();
  const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
  const formattedDate = twoDaysAgo.toISOString().split('T')[0];

  const bookings = await base44.asServiceRole.entities.Booking.list('-transfer_date', 1000);
  
  // Filter bookings that:
  // - Were completed
  // - Had transfer date 24-48 hours ago
  // - Customer has email
  const now = Date.now();
  const feedbackSent = [];

  for (const booking of bookings) {
    if (!booking.transfer_date || !booking.customer_email) continue;
    if (booking.status !== 'completed') continue;

    // Check if booking already has a review
    const existingReviews = await base44.asServiceRole.entities.Review.filter({ booking_id: booking.id });
    if (existingReviews.length > 0) continue;

    // Calculate time since transfer date
    const transferTime = new Date(booking.transfer_date + 'T23:59:59').getTime();
    const hoursSince = (now - transferTime) / (1000 * 60 * 60);

    // Send feedback request if 24+ hours have passed since transfer date
    if (hoursSince >= 24 && hoursSince < 48) {
      const lang = booking.language || 'pt';
      const langText = langTexts[lang] || langTexts['pt'];
      const reviewLink = `${Deno.env.get('APP_URL') || 'https://transfers-algarvestar.com'}/review?booking_id=${booking.id}&ref=${booking.booking_ref}`;

      const body = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:20px;">⭐ ${langText.title}</h1>
      <p style="color:rgba(255,255,255,0.75); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 16px;">${langText.message}</p>
      
      <div style="background:#f0f9ff; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:16px; margin:20px 0; line-height:1.6;">
        <p style="color:#0369a1; font-size:14px; margin:0 0 8px;"><strong>${lang === 'pt' ? 'Detalhes da viagem' : lang === 'en' ? 'Trip details' : lang === 'es' ? 'Detalles del viaje' : lang === 'fr' ? 'Détails du voyage' : lang === 'de' ? 'Fahrtdetails' : 'Reisgegevens'}</strong></p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">📍 ${booking.origin} → ${booking.destination}</p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">📅 ${booking.transfer_date} | 🕐 ${booking.transfer_time}</p>
        <p style="color:#0369a1; font-size:13px; margin:4px 0;">🚗 Ref: ${booking.booking_ref}</p>
      </div>

      <p style="color:#475569; font-size:14px; margin:20px 0;">${lang === 'pt' ? 'Sua opinião nos ajuda a melhorar e oferece informações valiosas para futuros clientes.' : lang === 'en' ? 'Your feedback helps us improve and provides valuable information for future customers.' : lang === 'es' ? 'Su opinión nos ayuda a mejorar y proporciona información valiosa para futuros clientes.' : lang === 'fr' ? 'Vos commentaires nous aident à nous améliorer et fournissent des informations précieuses aux futurs clients.' : lang === 'de' ? 'Ihr Feedback hilft uns, besser zu werden und bietet wertvollen Input für zukünftige Kunden.' : 'Uw feedback helpt ons beter te worden en biedt waardevolle informatie voor toekomstige klanten.'}</p>

      <a href="${reviewLink}" style="display:inline-block; background:#c8a951; color:#fff; text-decoration:none; padding:12px 32px; border-radius:6px; font-weight:bold; margin:24px 0; font-size:14px;">
        ${lang === 'pt' ? 'Avalie Agora' : lang === 'en' ? 'Rate Now' : lang === 'es' ? 'Calificar Ahora' : lang === 'fr' ? 'Évaluer Maintenant' : lang === 'de' ? 'Jetzt Bewerten' : 'Beoordeel Nu'}
      </a>

      <p style="color:#64748b; font-size:12px; margin:24px 0 0;">${lang === 'pt' ? 'Obrigado por sua avaliação!' : lang === 'en' ? 'Thank you for your review!' : lang === 'es' ? '¡Gracias por tu reseña!' : lang === 'fr' ? 'Merci pour votre avis !' : lang === 'de' ? 'Danke für Ihre Bewertung!' : 'Bedankt voor uw review!'}</p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar | 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>
      `.trim();

      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        from_name: 'Transfers Algarvestar <info@transfers-algarvestar.com>',
        subject: langText.subject,
        body,
      });

      feedbackSent.push({
        booking_ref: booking.booking_ref,
        customer_email: booking.customer_email,
      });
    }
  }

  return Response.json({
    ok: true,
    sent: feedbackSent.length,
    details: feedbackSent,
  });
});