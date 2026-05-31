import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

// Helper: generate PDF bytes from booking object
function buildVoucherPdf(booking) {
  const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };
  const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type || '—';
  const paymentLabel = booking.payment_status === 'paid' ? 'Pago — PayPal' : 'A cobrar em dinheiro';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 16;
  let y = 0;

  // Header band
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

  // Gold accent bar
  doc.setFillColor(200, 169, 81);
  doc.rect(0, 36, W, 4, 'F');

  y = 50;

  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('VOUCHER / COMPROVATIVO DE RESERVA', margin, y);

  // Ref badge
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
    const valStr = String(value || '—');
    doc.text(valStr, margin + 60, y);
    y += 6;
    if (!isLast) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, W - margin, y - 1);
    }
  };

  // Cliente
  sectionTitle('Dados do Cliente / Customer Details');
  row('Nome / Name', booking.customer_name);
  row('Email', booking.customer_email);
  row('Telefone / Phone', booking.customer_phone);
  row('Passageiros / Passengers', `${booking.passengers || 1} pax · ${booking.luggage || 0} mala(s)`, true);
  y += 4;

  // Viagem
  sectionTitle('Detalhes da Viagem / Trip Details');
  row('Data / Date', booking.transfer_date);
  row('Hora de recolha / Pickup time', booking.transfer_time);
  row('Recolha / Pickup', booking.origin);
  row('Entrega / Dropoff', booking.destination);
  if (booking.trip_type === 'round_trip') {
    row('Tipo / Type', 'Ida e volta / Round trip');
    if (booking.return_date) row('Regresso / Return date', `${booking.return_date} ${booking.return_time || ''}`);
  } else {
    row('Tipo / Type', 'Simples / One way');
  }
  row('Veiculo / Vehicle', vehicleLabel);
  if (booking.distance_km) row('Distancia / Distance', `${booking.distance_km} km`);
  if (booking.flight_number) row('No de Voo / Flight No', booking.flight_number);
  if (booking.return_flight_number) row('Voo Regresso / Return Flight', booking.return_flight_number);
  if (booking.notes) row('Observacoes / Notes', booking.notes, true);
  y += 4;

  // Pagamento
  sectionTitle('Pagamento / Payment');
  row('Metodo / Method', paymentLabel, true);
  y += 2;

  // Price highlight
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

  // Footer
  doc.setDrawColor(200, 169, 81);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Obrigado pela sua preferencia. Este documento serve como comprovativo da sua reserva.', W / 2, y, { align: 'center' });
  doc.text('https://transfers-algarvestar.com', W / 2, y + 5, { align: 'center' });

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { booking_id, customer_email } = body;

    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    // Try authenticated user first, fallback to email match for public access
    const user = await base44.auth.me().catch(() => null);

    const booking = await base44.asServiceRole.entities.Booking.get(booking_id);
    if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

    // Security: admin OR authenticated customer OR email matches booking
    const isAdmin = user?.role === 'admin';
    const isAuthCustomer = user && booking.customer_email?.toLowerCase() === user.email?.toLowerCase();
    const isEmailMatch = customer_email && booking.customer_email?.toLowerCase() === customer_email.toLowerCase();

    if (!isAdmin && !isAuthCustomer && !isEmailMatch) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pdfBytes = buildVoucherPdf(booking);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=voucher-${booking.booking_ref}.pdf`,
      },
    });
  } catch (error) {
    console.error('generateInvoicePdf error:', error?.message || error);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});