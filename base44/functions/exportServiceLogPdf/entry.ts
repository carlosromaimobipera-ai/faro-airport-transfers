import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

const TZ = 'Europe/Lisbon';
const dateFmt = new Intl.DateTimeFormat('pt-PT', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('pt-PT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

function dayKey(iso) {
  return keyFmt.format(new Date(iso));
}

function logMinutes(log, now) {
  const start = new Date(log.start_time).getTime();
  const end = log.end_time ? new Date(log.end_time).getTime() : now;
  return Math.max(0, (end - start) / 60000);
}

function duration(minutes) {
  const total = Math.max(0, Math.round(minutes || 0));
  return `${Math.floor(total / 60)}h${String(total % 60).padStart(2, '0')}`;
}

function buildServiceLogPdf(driver, logs, periodLabel) {
  const now = Date.now();
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
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('REGISTO DE HORAS DE SERVICO', margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${driver.name.toUpperCase()}${driver.vehicle_plate ? '  |  Matricula: ' + driver.vehicle_plate : ''}`, margin, y);
  y += 4.5;
  doc.text(`${periodLabel}  |  Emitido em: ${dateFmt.format(new Date())} as ${timeFmt.format(new Date())}`, margin, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // Summary
  const totalMinutes = logs.reduce((sum, l) => sum + logMinutes(l, now), 0);
  const dayCount = new Set(logs.map(l => dayKey(l.start_time))).size;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F');
  const colW = (W - margin * 2) / 3;
  const summary = [
    ['Total de horas', duration(totalMinutes)],
    ['Dias de servico', String(dayCount)],
    ['Periodos registados', String(logs.length)],
  ];
  summary.forEach(([lbl, val], i) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(lbl, margin + i * colW + 4, y + 5.5);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(val, margin + i * colW + 4, y + 11.5);
  });
  y += 22;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, W - margin * 2, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const cols = [
    { label: 'Data', x: margin + 3 },
    { label: 'Inicio', x: margin + 38 },
    { label: 'Fim', x: margin + 63 },
    { label: 'Total', x: margin + 95 },
    { label: 'Matricula', x: margin + 122 },
    { label: 'Assinatura', x: margin + 152 },
  ];
  cols.forEach(c => doc.text(c.label, c.x, y + 5));
  y += 9;

  const sorted = [...logs].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  sorted.forEach((log, i) => {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...rowBg);
    doc.rect(margin, y, W - margin * 2, 9, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 9, W - margin, y + 9);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(dateFmt.format(new Date(log.start_time)), cols[0].x, y + 6);
    doc.text(timeFmt.format(new Date(log.start_time)), cols[1].x, y + 6);
    doc.text(log.end_time ? timeFmt.format(new Date(log.end_time)) : 'em curso', cols[2].x, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(duration(logMinutes(log, now)), cols[3].x, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(log.vehicle_plate || driver.vehicle_plate || '-', cols[4].x, y + 6);
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(cols[5].x, y + 6.5, cols[5].x + 34, y + 6.5);

    y += 9;
  });

  if (sorted.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(148, 163, 184);
    doc.text('Sem registos de horas de servico neste periodo.', W / 2, y + 12, { align: 'center' });
    y += 20;
  }

  // Total row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, W - margin * 2, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL DO PERIODO', margin + 3, y + 5.5);
  doc.text(duration(totalMinutes), cols[3].x, y + 5.5);
  y += 16;

  // Declaration + signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const declaration = 'O(a) motorista identificado(a) declara que os registos acima correspondem aos periodos de atividade efetivamente exercidos, nos termos da legislacao aplicavel ao transporte de passageiros.';
  doc.splitTextToSize(declaration, W - margin * 2).forEach((line) => {
    doc.text(line, margin, y);
    y += 4;
  });

  y += 16;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + 70, y);
  doc.line(W - margin - 70, y, W - margin, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('O Motorista', margin, y);
  doc.text('A Empresa', W - margin - 70, y);

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
    doc.text(`Registo de Horas de Servico · ${driver.name} · Pagina ${i} de ${pageCount}`, W / 2, 292, { align: 'center' });
  }

  return doc.output('arraybuffer');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { driver_id, date_from, date_to } = body || {};
    if (!driver_id) return Response.json({ error: 'driver_id required' }, { status: 400 });

    const drivers = await base44.asServiceRole.entities.Driver.filter({ id: driver_id }, 'name', 1);
    const driver = drivers[0];
    if (!driver) return Response.json({ error: 'Driver not found' }, { status: 404 });
    if (user.role !== 'admin' && driver.email !== user.email) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allLogs = await base44.asServiceRole.entities.ServiceLog.filter({ driver_id }, '-start_time', 500);

    let logs = allLogs;
    let periodLabel = 'Todos os registos';
    if (date_from) logs = logs.filter(l => dayKey(l.start_time) >= date_from);
    if (date_to) logs = logs.filter(l => dayKey(l.start_time) <= date_to);
    if (date_from && date_to) periodLabel = `Periodo: ${date_from} a ${date_to}`;
    else if (date_from) periodLabel = `A partir de ${date_from}`;
    else if (date_to) periodLabel = `Ate ${date_to}`;

    const pdfBytes = buildServiceLogPdf(driver, logs, periodLabel);

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=registo-horas-${driver.name.replace(/\s+/g, '-')}.pdf`,
      },
    });
  } catch (error) {
    console.error('exportServiceLogPdf error:', error?.message);
    return Response.json({ error: error?.message }, { status: 500 });
  }
});