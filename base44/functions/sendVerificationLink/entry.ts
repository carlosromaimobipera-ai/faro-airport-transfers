const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = Deno.env.get('FROM_EMAIL');

const texts = {
  pt: { subject: 'Confirme a sua conta — Transfers AlgarveStar', title: 'Confirme a sua conta', message: 'Recebemos o seu registo. Clique no botão abaixo para confirmar o seu email e ativar a sua conta.', button: 'Confirmar Conta', codeLabel: 'Depois, introduza o código de verificação de 6 dígitos que enviámos para o seu email.' },
  en: { subject: 'Verify your account — Transfers AlgarveStar', title: 'Verify your account', message: 'We received your registration. Click the button below to confirm your email and activate your account.', button: 'Verify Account', codeLabel: 'Then, enter the 6-digit verification code we sent to your email.' },
  es: { subject: 'Confirme su cuenta — Transfers AlgarveStar', title: 'Confirme su cuenta', message: 'Recibimos su registro. Haga clic en el botón para confirmar su email y activar su cuenta.', button: 'Confirmar Cuenta', codeLabel: 'Luego, ingrese el código de verificación de 6 dígitos que enviamos a su email.' },
  fr: { subject: 'Confirmez votre compte — Transfers AlgarveStar', title: 'Confirmez votre compte', message: 'Nous avons reçu votre inscription. Cliquez sur le bouton ci-dessous pour confirmer votre email et activer votre compte.', button: 'Confirmer le Compte', codeLabel: 'Ensuite, saisissez le code de vérification à 6 chiffres que nous avons envoyé à votre email.' },
  de: { subject: 'Bestätigen Sie Ihr Konto — Transfers AlgarveStar', title: 'Bestätigen Sie Ihr Konto', message: 'Wir haben Ihre Registrierung erhalten. Klicken Sie auf den Button, um Ihre E-Mail zu bestätigen und Ihr Konto zu aktivieren.', button: 'Konto Bestätigen', codeLabel: 'Geben Sie dann den 6-stelligen Bestätigungscode ein, den wir per E-Mail gesendet haben.' },
  nl: { subject: 'Bevestig uw account — Transfers AlgarveStar', title: 'Bevestig uw account', message: 'We hebben uw registratie ontvangen. Klik op de knop om uw email te bevestigen en uw account te activeren.', button: 'Account Bevestigen', codeLabel: 'Voer daarna de 6-cijferige verificatiecode in die we naar uw email hebben gestuurd.' }
};

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { email, link, lang } = body;

    if (!email || !link) {
      return Response.json({ error: 'Email and link are required' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }
    if (!RESEND_API_KEY || !FROM) {
      return Response.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const t = texts[lang] || texts['en'];

    const html = `
<!DOCTYPE html>
<html lang="${lang || 'en'}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:560px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0f172a,#1e3a5f); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:20px;">✓ ${t.title}</h1>
      <p style="color:rgba(255,255,255,0.75); margin:8px 0 0; font-size:13px;">Transfers Algarvestar</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155; font-size:16px; margin:0 0 16px;">${t.message}</p>
      <a href="${link}" style="display:inline-block; background:#0369a1; color:#fff; text-decoration:none; padding:14px 36px; border-radius:8px; font-weight:bold; margin:20px 0; font-size:15px;">
        ${t.button}
      </a>
      <div style="background:#f0f9ff; border-left:4px solid #0369a1; border-radius:0 8px 8px 0; padding:16px; margin:20px 0; line-height:1.6;">
        <p style="color:#0369a1; font-size:14px; margin:0;">${t.codeLabel}</p>
      </div>
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar | 📞 +351 913 956 971</p>
    </div>
  </div>
</body>
</html>`.trim();

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: email, subject: t.subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend error: ${err}`);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('sendVerificationLink error:', err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});