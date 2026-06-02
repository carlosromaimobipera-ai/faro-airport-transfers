import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev';
const FROM = FROM_EMAIL.includes('<') ? FROM_EMAIL : `Transfers AlgarveStar <${FROM_EMAIL}>`;
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') || 'info@transfers-algarvestar.com';

async function sendEmail({ to, subject, body, attachments }) {
  const payload = { from: FROM, to, subject, html: body };
  if (attachments) payload.attachments = attachments;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return res.json();
}

const langTexts = {
  pt: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', status: 'CONFIRMADO / Confirmed / Confirmé', paymentOnline: 'Online — PayPal', paymentCash: 'MO - MONETÁRIO / Cash / Espèces' },
  en: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', status: 'CONFIRMED / Confirmed / Confirmé', paymentOnline: 'Online — PayPal', paymentCash: 'CASH / Cash / Espèces' },
  es: { subject: 'Comprobante {ref} — Transfers AlgarveStar | {date} {time}', status: 'CONFIRMADO / Confirmed / Confirmé', paymentOnline: 'Online — PayPal', paymentCash: 'EFECTIVO / Cash / Espèces' },
  fr: { subject: 'Bon {ref} — Transfers AlgarveStar | {date} {time}', status: 'CONFIRMÉ / Confirmed / Confirmé', paymentOnline: 'En ligne — PayPal', paymentCash: 'ESPÈCES / Cash / Espèces' },
  de: { subject: 'Gutschein {ref} — Transfers AlgarveStar | {date} {time}', status: 'BESTÄTIGT / Confirmed / Confirmé', paymentOnline: 'Online — PayPal', paymentCash: 'BARZAHLUNG / Cash / Espèces' },
  nl: { subject: 'Voucher {ref} — Transfers AlgarveStar | {date} {time}', status: 'BEVESTIGD / Confirmed / Confirmé', paymentOnline: 'Online — PayPal', paymentCash: 'CONTANT / Cash / Espèces' }
};

const INTERNAL_SECRET = Deno.env.get('INTERNAL_AUTOMATION_SECRET');

function buildVoucherPdfBase64(booking) {
  const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };
  const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type || '—';
  const paymentLabel = booking.payment_status === 'paid' ? 'Pago — PayPal' : 'A cobrar em dinheiro';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 16;
  let y = 0;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSFERS ALGARVESTAR', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text('NIF: 514346744  |  RNAVT: 6855  |  +351 913 956 971  |  info@transfers-algarvestar.com', margin, 21);
  doc.text('Urbanizacao Quinta Da Torre, Lote 22, R/C A, Algarve, Portugal', margin, 27);
  doc.setFillColor(200, 169, 81);
  doc.rect(0, 36, W, 4, 'F');

  y = 50;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VOUCHER / COMPROVATIVO DE RESERVA', margin, y);
  doc.setFillColor(224, 242, 254);
  doc.roundedRect(W - margin - 52, y - 8, 52, 12, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setTextColor(3, 105, 161);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.booking_ref || '—', W - margin - 26, y - 1, { align: 'center' });

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  const sectionTitle = (title) => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, W - margin * 2, 7, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(title.toUpperCase(), margin + 3, y + 5);
    y += 10;
  };

  const row = (label, value, isLast = false) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin + 2, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value || '—'), margin + 60, y);
    y += 6;
    if (!isLast) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, W - margin, y - 1);
    }
  };

  sectionTitle('Dados do Cliente / Customer Details');
  row('Nome / Name', booking.customer_name);
  row('Email', booking.customer_email);
  row('Telefone / Phone', booking.customer_phone);
  row('Passageiros / Passengers', `${booking.passengers || 1} pax · ${booking.luggage || 0} mala(s)`, true);
  y += 4;

  sectionTitle('Detalhes da Viagem / Trip Details');
  row('Data / Date', booking.transfer_date);
  row('Hora / Pickup time', booking.transfer_time);
  row('Recolha / Pickup', booking.origin);
  row('Entrega / Dropoff', booking.destination);
  row('Tipo / Type', booking.trip_type === 'round_trip' ? 'Ida e volta / Round trip' : 'Simples / One way');
  if (booking.return_date) row('Regresso / Return', `${booking.return_date} ${booking.return_time || ''}`);
  row('Veiculo / Vehicle', vehicleLabel);
  if (booking.distance_km) row('Distancia / Distance', `${booking.distance_km} km`);
  if (booking.flight_number) row('No Voo / Flight No', booking.flight_number);
  if (booking.return_flight_number) row('Voo Regresso / Return Flight', booking.return_flight_number);
  if (booking.notes) row('Observacoes / Notes', booking.notes, true);
  y += 4;

  sectionTitle('Pagamento / Payment');
  row('Metodo / Method', paymentLabel, true);
  y += 2;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, W - margin * 2, 14, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text('TOTAL', margin + 6, y + 9);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 169, 81);
  doc.text(`EUR ${Number(booking.price || 0).toFixed(2)}`, W - margin - 6, y + 9, { align: 'right' });
  y += 22;

  // Recommendations section
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, W - margin * 2, 7, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('RECOMENDACOES / RECOMMENDATIONS', margin + 3, y + 5);
  y += 11;

  const recommendations = [
    'When you land at Faro airport, please switch on your phone to receive messages or calls from the driver, who will be waiting for you in the arrivals hall, holding a sign or phone with your name on it. He will assist you with your luggage and guide you to the vehicle reserved for you outside the terminal.',
    'If you are travelling with extra luggage (large suitcases, golf bags, etc.) please inform us when booking so that the vehicle is suitable.',
    'If you have children under the age of 12 or under 1.35 metres tall, please inform us so that suitable seating can be provided at no extra cost.',
  ];

  const textWidth = W - margin * 2 - 8;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  recommendations.forEach((rec, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, textWidth);
    lines.forEach(line => {
      doc.text(line, margin + 4, y);
      y += 4.5;
    });
    y += 2;
  });

  y += 4;

  doc.setDrawColor(200, 169, 81);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Obrigado pela sua preferencia. Este documento serve como comprovativo da sua reserva.', W / 2, y, { align: 'center' });
  doc.text('https://transfers-algarvestar.com', W / 2, y + 5, { align: 'center' });

  return doc.output('datauristring').split(',')[1]; // base64
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('x-internal-secret');
    const base44 = createClientFromRequest(req);
    if (!INTERNAL_SECRET || authHeader !== INTERNAL_SECRET) {
      const user = await base44.auth.me().catch(() => null);
      if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const payload = await req.json();
    const { data: booking } = payload;

    if (!booking || !booking.customer_email) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const lang = booking.language || 'pt';
    const langText = langTexts[lang] || langTexts['pt'];

    const vehicleLabels = { sedan: 'Sedan', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };
    const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;
    const paymentMethod = booking.payment_status === 'paid' ? langText.paymentOnline : langText.paymentCash;
    const paymentAmount = `€${Number(booking.price || 0).toFixed(2)}`;

    const row = (label, value) => `
    <tr>
      <td style="padding:7px 10px; border:1px solid #ccc; background:#f9f9f9; color:#333; font-size:12px; white-space:nowrap;">${label}</td>
      <td style="padding:7px 10px; border:1px solid #ccc; color:#111; font-size:12px;">${value || '—'}</td>
    </tr>`;

    const headerRow = (label) => `
    <tr>
      <td colspan="2" style="padding:6px 10px; background:#c8a951; color:#fff; font-size:12px; font-weight:bold; border:1px solid #b8962f; letter-spacing:0.5px;">${label}</td>
    </tr>`;

    const customerBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Voucher — ${booking.booking_ref}</title>
</head>
<body style="font-family: Arial, sans-serif; background:#ececec; margin:0; padding:20px;">
  <div style="max-width:620px; margin:0 auto; background:#fff; border:1px solid #ccc;">
    <table style="width:100%; border-collapse:collapse; padding:0; background:#fff;">
      <tr>
        <td style="padding:16px 20px; vertical-align:middle;">
          <img src="https://media.base44.com/images/public/69f9fe03f147edc32575e815/logo_tas.png" alt="Transfers AlgarveStar" style="height:60px; object-fit:contain;" onerror="this.style.display='none'" />
          <div style="font-size:20px; font-weight:bold; color:#1a3a5c; margin-top:4px;">TRANSFERS<br/><span style="color:#c8a951;">ALGARVESTAR</span></div>
        </td>
        <td style="padding:16px 20px; text-align:right; vertical-align:top; font-size:12px; color:#444; line-height:1.8;">
          <strong>+351 913956971</strong><br/>
          Urbanização Quinta Da Torre, Lote 22, R/C A<br/>
          <a href="mailto:info@transfers-algarvestar.com" style="color:#1a3a5c;">info@transfers-algarvestar.com</a>
        </td>
      </tr>
    </table>
    <hr style="border:none; border-top:2px solid #c8a951; margin:0;" />
    <table style="width:100%; border-collapse:collapse; border:1px solid #ccc; margin-top:0;">
      <tr style="background:#e8f0e0;">
        <td style="padding:8px 12px; font-size:12px; color:#2d6a2d; font-weight:bold; border-right:1px solid #ccc;">
          Estado / Status / État : &nbsp;<strong>${langText.status}</strong>
        </td>
        <td style="padding:8px 12px; font-size:12px; color:#333; border-right:1px solid #ccc; white-space:nowrap;">
          📅 ${booking.transfer_date || '—'} &nbsp; 🕐 ${booking.transfer_time || '—'}
        </td>
        <td style="padding:8px 12px; font-size:12px; color:#333; border-right:1px solid #ccc; white-space:nowrap;">
          ${booking.distance_km ? `🚗 ${booking.distance_km} Km` : ''}
        </td>
        <td style="padding:8px 12px; font-size:12px; font-weight:bold; color:#1a3a5c; text-align:right;">
          Voucher: <span style="font-family:monospace; font-size:14px; color:#c8a951;">${booking.booking_ref}</span>
        </td>
      </tr>
    </table>
    <div style="padding:16px 20px;">
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        ${headerRow('Cliente / Client')}
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333; width:30%;">Nome / Name / Nom</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111; width:35%;"><strong>${booking.customer_name || '—'}</strong></td>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333; width:15%;">Email</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.customer_email || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Telefone / Phone</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.customer_phone || '—'}</td>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Passageiros / Passengers</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.passengers || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Bagagem / Luggage</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.luggage || 0}</td>
          ${booking.flight_number ? `
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Nº Voo / Flight Nº</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.flight_number}</td>
          ` : `<td colspan="2" style="border:1px solid #ccc;"></td>`}
        </tr>
      </table>
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        ${headerRow('Serviço / Service')}
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333; width:30%;">Recolha / Pickup</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.origin || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Entrega / Dropoff</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.destination || '—'}</td>
        </tr>
        ${booking.notes ? `<tr><td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Observações / Comments</td><td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">${booking.notes}</td></tr>` : ''}
      </table>
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333; width:30%;">Proveniência / Provenance</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">WEBSITE</td>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Pagamento / Payment</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:13px; font-weight:bold; color:#1a3a5c;">${paymentAmount}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Método Pagamento / Payment Method</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;" colspan="3">${paymentMethod}</td>
        </tr>
        <tr>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Categoria / Category</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111;">AIRPORT TRANSFER</td>
          <td style="padding:6px 10px; border:1px solid #ccc; background:#f9f9f9; font-size:12px; color:#333;">Grupo</td>
          <td style="padding:6px 10px; border:1px solid #ccc; font-size:12px; color:#111; text-transform:uppercase;">${vehicleLabel}</td>
        </tr>
      </table>
      <table style="width:100%; border-collapse:collapse; margin-bottom:10px;">
        ${headerRow('Recomendações')}
        <tr>
          <td style="padding:10px 12px; border:1px solid #ccc; font-size:12px; color:#333; line-height:1.7;">
            <ul style="margin:0; padding-left:18px;">
              <li>When you land at Faro airport, please switch on your phone to receive messages or calls from the driver, who will be waiting for you in the arrivals hall, holding a sign or phone with your name on it. He will assist you with your luggage and guide you to the vehicle reserved for you outside the terminal.</li>
              <li style="margin-top:8px;">If you are travelling with extra luggage (large suitcases, golf bags, etc.) please inform us when booking so that the vehicle is suitable.</li>
              <li style="margin-top:8px;">If you have children under the age of 12 or under 1.35 metres tall, you must inform us so that suitable seating can be provided at no extra cost.</li>
            </ul>
          </td>
        </tr>
      </table>
    </div>
    <hr style="border:none; border-top:1px solid #ccc; margin:0;" />
    <div style="padding:10px 20px; text-align:center; font-size:11px; color:#555;">
      <strong>Transfers AlgarveStar</strong> | NIF: 514346744 | RNAVT: 6855 | Tel: +351 913956971 | 
      <a href="https://transfers-algarvestar.com" style="color:#1a3a5c;">https://transfers-algarvestar.com</a>
    </div>
  </div>
</body>
</html>`.trim();

    // Generate PDF voucher
    let pdfBase64 = null;
    try {
      pdfBase64 = buildVoucherPdfBase64(booking);
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr?.message);
    }

    // Email ao cliente
    await sendEmail({
      to: booking.customer_email,
      subject: langText.subject.replace('{ref}', booking.booking_ref).replace('{date}', booking.transfer_date).replace('{time}', booking.transfer_time),
      body: customerBody,
      attachments: pdfBase64 ? [{
        filename: `voucher-${booking.booking_ref}.pdf`,
        content: pdfBase64,
      }] : undefined,
    });

    // Email ao admin
    const adminBody = `<p>Nova reserva recebida: <strong>${booking.booking_ref}</strong></p>
<p>Cliente: ${booking.customer_name} (${booking.customer_email})<br/>
Rota: ${booking.origin} → ${booking.destination}<br/>
Data: ${booking.transfer_date} ${booking.transfer_time}<br/>
Veículo: ${booking.vehicle_type} | €${Number(booking.price||0).toFixed(2)} | ${booking.payment_status === 'paid' ? 'Pago (PayPal)' : 'A pagar (Cash)'}</p>
<p><a href="https://lisbonsevillefaroriders.com/admin">Ver no painel de administração →</a></p>`;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚗 Nova Reserva: ${booking.booking_ref} | ${booking.transfer_date} ${booking.transfer_time}`,
      body: adminBody,
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error('notifyBookingCreated error:', err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});