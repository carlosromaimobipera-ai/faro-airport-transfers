import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { booking_id } = await req.json();
  if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

  // Fetch booking
  const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
  const booking = bookings[0];
  if (!booking) return Response.json({ error: 'Not found' }, { status: 404 });

  // Security: only the customer or admin can download
  if (user.role !== 'admin' && booking.customer_email?.toLowerCase() !== user.email?.toLowerCase()) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vehicleLabels = { sedan: 'Sedan / Kia', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };
  const vehicleLabel = vehicleLabels[booking.vehicle_type] || booking.vehicle_type;
  const paymentLabel = booking.payment_status === 'paid' ? 'Pago — PayPal' : 'A cobrar em dinheiro';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 16;
  let y = 0;

  // ── Header band
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
  doc.text('Urbanização Quinta Da Torre, Lote 22, R/C A, Algarve, Portugal', margin, 27);

  // Gold accent bar
  doc.setFillColor(200, 169, 81);
  doc.rect(0, 36, W, 4, 'F');

  y = 50;

  // ── Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('FATURA / VOUCHER', margin, y);

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

  // ── Section helper
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
    doc.text(String(value || '—'), margin + 55, y);
    y += 6;
    if (!isLast) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y - 1, W - margin, y - 1);
    }
  };

  // ── Cliente
  sectionTitle('Dados do Cliente');
  row('Nome / Name', booking.customer_name);
  row('Email', booking.customer_email);
  row('Telefone', booking.customer_phone);
  row('Passageiros', `${booking.passengers || 1} pax · ${booking.luggage || 0} mala(s)`, true);
  y += 4;

  // ── Serviço
  sectionTitle('Detalhes da Viagem');
  row('Data', booking.transfer_date);
  row('Hora de recolha', booking.transfer_time);
  row('Recolha / Pickup', booking.origin);
  row('Entrega / Dropoff', booking.destination);
  row('Veículo', vehicleLabel);
  row('Distância', booking.distance_km ? `${booking.distance_km} km` : '—');
  if (booking.flight_number) row('Nº de Voo', booking.flight_number);
  if (booking.notes) row('Observações', booking.notes, true);
  y += 4;

  // ── Pagamento
  sectionTitle('Pagamento');
  row('Método', paymentLabel);
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
  doc.text(`€${Number(booking.price || 0).toFixed(2)}`, W - margin - 6, y + 9, { align: 'right' });
  y += 22;

  // ── Footer
  doc.setDrawColor(200, 169, 81);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Obrigado pela sua preferência. Este documento serve como comprovativo da sua reserva.', W / 2, y, { align: 'center' });
  doc.text('https://transfers-algarvestar.com', W / 2, y + 5, { align: 'center' });

  const pdfBytes = doc.output('arraybuffer');

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=fatura-${booking.booking_ref}.pdf`,
    },
  });
});