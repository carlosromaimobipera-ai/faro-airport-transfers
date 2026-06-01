import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const statusLabel = {
  pending: 'Pendente', confirmed: 'Confirmada',
  in_progress: 'Em curso', completed: 'Concluída', cancelled: 'Cancelada',
};
const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus', premium: 'Premium' };
const paymentLabel = { unpaid: 'Dinheiro', paid: 'PayPal', refunded: 'Reembolso' };

function buildDailyPdf(date, bookings) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const margin = 12;
  let y = 0;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(200, 169, 81);
  doc.rect(0, 28, W, 2.5, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TRANSFERS ALGARVESTAR', margin, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text('NIF: 514346744  |  RNAVT: 6855  |  +351 913 956 971  |  info@transfers-algarvestar.com', margin, 20);

  // Date badge
  doc.setFillColor(200, 169, 81);
  doc.roundedRect(W - margin - 60, 6, 60, 16, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const [y2, m2, d2] = date.split('-');
  doc.text(`${d2}/${m2}/${y2}`, W - margin - 30, 16, { align: 'center' });

  y = 42;

  // Title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`SERVIÇOS DO DIA — ${date}`, margin, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Total: ${bookings.length} serviço(s)  |  Gerado em: ${new Date().toLocaleString('pt-PT')}`, margin, y + 6);
  y += 14;

  // Summary stats
  const revenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0);
  const toBeColl = bookings.filter(b => b.payment_status !== 'paid' && b.status !== 'cancelled').reduce((s, b) => s + (b.price || 0), 0);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, 'F');
  const sW = (W - margin * 2) / 5;
  const stats = [
    ['Total', bookings.length],
    ['Confirmadas', bookings.filter(b => b.status === 'confirmed').length],
    ['Em curso', bookings.filter(b => b.status === 'in_progress').length],
    ['Receita paga', `€${revenue.toFixed(2)}`],
    ['A cobrar', `€${toBeColl.toFixed(2)}`],
  ];
  stats.forEach(([lbl, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, margin + i * sW + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), margin + i * sW + 3, y + 10);
  });
  y += 18;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, W - margin * 2, 7, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  const cols = [
    { label: 'Hora',       x: margin + 2,   w: 14 },
    { label: 'Ref',        x: margin + 16,  w: 22 },
    { label: 'Cliente',    x: margin + 38,  w: 36 },
    { label: 'Telefone',   x: margin + 74,  w: 28 },
    { label: 'Recolha',    x: margin + 102, w: 46 },
    { label: 'Entrega',    x: margin + 148, w: 46 },
    { label: 'Pax',        x: margin + 194, w: 10 },
    { label: 'Veículo',    x: margin + 204, w: 22 },
    { label: 'Motorista',  x: margin + 226, w: 28 },
    { label: 'Pagamento',  x: margin + 254, w: 20 },
    { label: 'Total',      x: margin + 274, w: 10 },
  ];
  cols.forEach(c => doc.text(c.label, c.x, y + 5));
  y += 9;

  // Sort by time
  const sorted = [...bookings].sort((a, b) => (a.transfer_time || '') < (b.transfer_time || '') ? -1 : 1);

  sorted.forEach((b, i) => {
    if (y > 185) {
      doc.addPage();
      y = 14;
    }
    const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, W - margin * 2, 8.5, 'F');

    // Left border color by status
    const statusColors = {
      confirmed: [59, 130, 246],
      in_progress: [249, 115, 22],
      completed: [34, 197, 94],
      cancelled: [239, 68, 68],
      pending: [234, 179, 8],
    };
    const bc = statusColors[b.status] || [148, 163, 184];
    doc.setFillColor(...bc);
    doc.rect(margin, y, 2, 8.5, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(b.transfer_time || '—', cols[0].x, y + 5.5);

    doc.setTextColor(3, 105, 161);
    doc.text(b.booking_ref || '—', cols[1].x, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const clientName = doc.splitTextToSize(b.customer_name || '—', cols[2].w - 2);
    doc.text(clientName[0], cols[2].x, y + 5.5);

    doc.text(b.customer_phone || '—', cols[3].x, y + 5.5);

    const orig = doc.splitTextToSize(b.origin || '—', cols[4].w - 2);
    doc.text(orig[0], cols[4].x, y + 5.5);

    const dest = doc.splitTextToSize(b.destination || '—', cols[5].w - 2);
    doc.text(dest[0], cols[5].x, y + 5.5);

    doc.text(String(b.passengers || 1), cols[6].x, y + 5.5);

    doc.text(vehicleLabel[b.vehicle_type] || b.vehicle_type || '—', cols[7].x, y + 5.5);

    const driverName = doc.splitTextToSize(b.driver_name || '—', cols[8].w - 2);
    doc.text(driverName[0], cols[8].x, y + 5.5);

    doc.text(paymentLabel[b.payment_status] || '—', cols[9].x, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text(`€${(b.price || 0).toFixed(0)}`, cols[10].x, y + 5.5);

    // Flight number (small, below)
    if (b.flight_number) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`✈ ${b.flight_number}`, cols[3].x, y + 8.5);
    }

    y += 8.5;
  });

  if (bookings.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Sem serviços para este dia.', W / 2, y + 20, { align: 'center' });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 169, 81);
    doc.setLineWidth(0.4);
    doc.line(margin, 198, W - margin, 198);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Serviços do dia ${date} · Página ${i} de ${pageCount}`, W / 2, 203, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { date } = body;
    if (!date) return Response.json({ error: 'date required (YYYY-MM-DD)' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter(
      { transfer_date: date },
      'transfer_time',
      200
    );

    const pdfBytes = buildDailyPdf(date, bookings);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=servicos-${date}.pdf`,
      },
    });
  } catch (error) {
    console.error('exportDailySchedule error:', error?.message);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});