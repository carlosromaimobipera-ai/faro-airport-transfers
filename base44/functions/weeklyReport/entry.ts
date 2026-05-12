import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM = 'Transfers Algarvestar <carlosroma.imobipera@gmail.com>';
const ADMIN_EMAIL = 'info@transfers-algarvestar.com';

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

Deno.serve(async (req) => {
  try {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const bookings = await base44.asServiceRole.entities.Booking.list('-transfer_date', 1000);
  const thisWeek = bookings.filter(b => b.transfer_date >= weekAgoStr && b.transfer_date <= todayStr);

  const stats = {
    total: thisWeek.length,
    confirmed: thisWeek.filter(b => b.status === 'confirmed').length,
    completed: thisWeek.filter(b => b.status === 'completed').length,
    cancelled: thisWeek.filter(b => b.status === 'cancelled').length,
    pending: thisWeek.filter(b => b.status === 'pending').length,
    paid: thisWeek.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0),
    unpaid: thisWeek.filter(b => b.payment_status === 'unpaid').reduce((s, b) => s + (b.price || 0), 0),
    total_revenue: thisWeek.reduce((s, b) => s + (b.price || 0), 0),
    sedan: thisWeek.filter(b => b.vehicle_type === 'sedan').length,
    minivan: thisWeek.filter(b => b.vehicle_type === 'minivan').length,
    minibus: thisWeek.filter(b => b.vehicle_type === 'minibus').length,
  };

  const dateRange = `${weekAgoStr} a ${todayStr}`;

  const rows = thisWeek.slice(0, 20).map(b => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:8px 12px; font-family:monospace; font-size:12px; color:#0369a1; font-weight:700;">${b.booking_ref}</td>
      <td style="padding:8px 12px; font-size:13px;">${b.customer_name}</td>
      <td style="padding:8px 12px; font-size:12px; color:#475569;">${b.transfer_date} ${b.transfer_time}</td>
      <td style="padding:8px 12px; font-size:12px;">${b.origin?.split(',')[0]} → ${b.destination?.split(',')[0]}</td>
      <td style="padding:8px 12px; font-size:13px; font-weight:700; color:#0369a1;">€${Number(b.price || 0).toFixed(0)}</td>
      <td style="padding:8px 12px;">
        <span style="background:${b.status === 'completed' ? '#dcfce7' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7'}; color:${b.status === 'completed' ? '#166534' : b.status === 'cancelled' ? '#991b1b' : '#92400e'}; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:600;">${b.status}</span>
      </td>
    </tr>
  `).join('');

  const body = `
<!DOCTYPE html>
<html lang="pt">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif; background:#f4f7fb; margin:0; padding:24px;">
  <div style="max-width:680px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#0369a1,#0ea5e9); padding:28px 32px; text-align:center;">
      <h1 style="color:#fff; margin:0; font-size:24px;">📊 Relatório Semanal</h1>
      <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:13px;">Transfers Algarvestar · ${dateRange}</p>
    </div>
    <div style="padding:28px 32px;">
      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:28px;">
        <div style="background:#eff6ff; border-radius:12px; padding:16px; text-align:center;">
          <p style="color:#0369a1; font-size:28px; font-weight:800; margin:0;">${stats.total}</p>
          <p style="color:#64748b; font-size:12px; margin:4px 0 0;">Reservas</p>
        </div>
        <div style="background:#f0fdf4; border-radius:12px; padding:16px; text-align:center;">
          <p style="color:#16a34a; font-size:28px; font-weight:800; margin:0;">€${stats.total_revenue.toFixed(0)}</p>
          <p style="color:#64748b; font-size:12px; margin:4px 0 0;">Receita total</p>
        </div>
        <div style="background:#fefce8; border-radius:12px; padding:16px; text-align:center;">
          <p style="color:#ca8a04; font-size:28px; font-weight:800; margin:0;">€${stats.unpaid.toFixed(0)}</p>
          <p style="color:#64748b; font-size:12px; margin:4px 0 0;">Por cobrar</p>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:28px; background:#f8fafc; border-radius:12px; overflow:hidden;">
        <tr><td style="padding:12px 16px; font-size:13px; color:#64748b;">✅ Concluídas</td><td style="padding:12px 16px; font-size:16px; font-weight:700; color:#166534; text-align:right;">${stats.completed}</td></tr>
        <tr style="background:#fff;"><td style="padding:12px 16px; font-size:13px; color:#64748b;">🔵 Confirmadas</td><td style="padding:12px 16px; font-size:16px; font-weight:700; color:#1d4ed8; text-align:right;">${stats.confirmed}</td></tr>
        <tr><td style="padding:12px 16px; font-size:13px; color:#64748b;">⏳ Pendentes</td><td style="padding:12px 16px; font-size:16px; font-weight:700; color:#92400e; text-align:right;">${stats.pending}</td></tr>
        <tr style="background:#fff;"><td style="padding:12px 16px; font-size:13px; color:#64748b;">❌ Canceladas</td><td style="padding:12px 16px; font-size:16px; font-weight:700; color:#dc2626; text-align:right;">${stats.cancelled}</td></tr>
      </table>
      <div style="margin-bottom:28px;">
        <p style="font-size:13px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">Por veículo</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <span style="background:#eff6ff; color:#0369a1; padding:6px 14px; border-radius:99px; font-size:13px; font-weight:600;">🚗 Sedan: ${stats.sedan}</span>
          <span style="background:#f0fdf4; color:#166534; padding:6px 14px; border-radius:99px; font-size:13px; font-weight:600;">🚐 Minivan: ${stats.minivan}</span>
          <span style="background:#fef3c7; color:#92400e; padding:6px 14px; border-radius:99px; font-size:13px; font-weight:600;">🚌 Minibus: ${stats.minibus}</span>
        </div>
      </div>
      ${thisWeek.length > 0 ? `
      <p style="font-size:13px; font-weight:600; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px;">Últimas reservas</p>
      <div style="overflow-x:auto; border-radius:12px; border:1px solid #e2e8f0;">
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">Ref.</th>
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">Cliente</th>
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">Data</th>
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">Rota</th>
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">€</th>
              <th style="padding:10px 12px; text-align:left; color:#64748b; font-size:11px; text-transform:uppercase;">Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${thisWeek.length > 20 ? `<p style="color:#94a3b8; font-size:12px; text-align:center; margin-top:8px;">+ ${thisWeek.length - 20} reservas não mostradas</p>` : ''}
      ` : '<p style="color:#94a3b8; text-align:center; padding:20px;">Sem reservas nesta semana</p>'}
    </div>
    <div style="background:#f8fafc; padding:16px 32px; text-align:center; border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8; font-size:12px; margin:0;">Transfers Algarvestar · Relatório automático semanal</p>
    </div>
  </div>
</body>
</html>`.trim();

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `📊 Relatório Semanal — ${stats.total} reservas · €${stats.total_revenue.toFixed(0)} · ${dateRange}`,
    body,
  });

  return Response.json({ ok: true, bookings: stats.total, revenue: stats.total_revenue });
  } catch (err) {
    console.error('weeklyReport error:', err?.message || err);
    return Response.json({ error: err?.message }, { status: 500 });
  }
});