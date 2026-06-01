import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const statusLabel = {
  pending: 'Pendente', confirmed: 'Confirmada',
  in_progress: 'Em curso', completed: 'Concluída', cancelled: 'Cancelada',
};
const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus' };

function buildDriverPdf(driver, bookings, filterLabel) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  const margin = 14;
  let y = 0;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFillColor(200, 169, 81);
  doc.rect(0, 32, W, 3, 'F');
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TRANSFERS ALGARVESTAR', margin, 13);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 220);
  doc.text('NIF: 514346744  |  RNAVT: 6855  |  +351 913 956 971  |  info@transfers-algarvestar.com', margin, 21);
  doc.text('Urbanizacao Quinta Da Torre, Lote 22, R/C A, Algarve, Portugal', margin, 27);

  y = 46;

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`VIAGENS — ${driver.name.toUpperCase()}`, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${filterLabel}  |  Gerado em: ${new Date().toLocaleDateString('pt-PT')}`, margin, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // Summary box
  const totalRevenue = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0);
  const completed = bookings.filter(b => b.status === 'completed').length;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const colW = (W - margin * 2) / 4;
  const summaryItems = [
    ['Total', bookings.length],
    ['Concluídas', completed],
    ['Canceladas', bookings.filter(b => b.status === 'cancelled').length],
    ['Receita (pago)', `€${totalRevenue.toFixed(2)}`],
  ];
  summaryItems.forEach(([lbl, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, margin + i * colW + 4, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(val), margin + i * colW + 4, y + 11);
  });
  y += 22;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, W - margin * 2, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const cols = [
    { label: 'Ref', x: margin + 2, w: 22 },
    { label: 'Data / Hora', x: margin + 24, w: 26 },
    { label: 'Recolha', x: margin + 50, w: 42 },
    { label: 'Entrega', x: margin + 92, w: 42 },
    { label: 'Pax', x: margin + 134, w: 12 },
    { label: 'Estado', x: margin + 146, w: 22 },
    { label: 'Total', x: margin + 168, w: 15 },
  ];
  cols.forEach(c => doc.text(c.label, c.x, y + 5));
  y += 9;

  // Rows
  bookings.forEach((b, i) => {
    if (y > 270) {
      doc.addPage();
      y = 14;
    }
    const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, W - margin * 2, 8, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text(b.booking_ref || '—', cols[0].x, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(`${b.transfer_date || ''} ${b.transfer_time || ''}`.trim(), cols[1].x, y + 5.5);

    const origin = doc.splitTextToSize(b.origin || '—', cols[2].w - 2);
    doc.text(origin[0], cols[2].x, y + 5.5);

    const dest = doc.splitTextToSize(b.destination || '—', cols[3].w - 2);
    doc.text(dest[0], cols[3].x, y + 5.5);

    doc.text(String(b.passengers || 1), cols[4].x, y + 5.5);

    const sLabel = statusLabel[b.status] || b.status;
    doc.text(sLabel, cols[5].x, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(3, 105, 161);
    doc.text(`€${(b.price || 0).toFixed(0)}`, cols[6].x, y + 5.5);

    y += 8;
  });

  if (bookings.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Sem viagens para este período.', W / 2, y + 10, { align: 'center' });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 169, 81);
    doc.setLineWidth(0.4);
    doc.line(margin, 287, W - margin, 287);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${driver.name} · Página ${i} de ${pageCount}`, W / 2, 292, { align: 'center' });
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
    const { driver_id, date_from, date_to } = body;

    if (!driver_id) return Response.json({ error: 'driver_id required' }, { status: 400 });

    const [driverList, allBookings] = await Promise.all([
      base44.asServiceRole.entities.Driver.filter({ id: driver_id }, 'name', 1),
      base44.asServiceRole.entities.Booking.filter({ driver_id }, 'transfer_date', 500),
    ]);

    const driver = driverList[0];
    if (!driver) return Response.json({ error: 'Driver not found' }, { status: 404 });

    let bookings = allBookings;
    let filterLabel = 'Todas as viagens';

    if (date_from) {
      bookings = bookings.filter(b => b.transfer_date >= date_from);
      filterLabel = `A partir de ${date_from}`;
    }
    if (date_to) {
      bookings = bookings.filter(b => b.transfer_date <= date_to);
      filterLabel = date_from ? `${date_from} → ${date_to}` : `Até ${date_to}`;
    }

    bookings.sort((a, b) => a.transfer_date < b.transfer_date ? -1 : 1);

    const pdfBytes = buildDriverPdf(driver, bookings, filterLabel);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=viagens-${driver.name.replace(/\s+/g, '-')}.pdf`,
      },
    });
  } catch (error) {
    console.error('exportDriverPdf error:', error?.message);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});