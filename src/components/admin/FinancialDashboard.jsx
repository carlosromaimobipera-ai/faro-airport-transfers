import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Euro, TrendingUp, Car, CheckCircle2, Clock, XCircle, BarChart2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const STATUS_COLORS = {
  pending:     '#f59e0b',
  confirmed:   '#3b82f6',
  in_progress: '#f97316',
  completed:   '#22c55e',
  cancelled:   '#ef4444',
};

const STATUS_LABELS = {
  pending:     'Pendente',
  confirmed:   'Confirmada',
  in_progress: 'Em curso',
  completed:   'Concluída',
  cancelled:   'Cancelada',
};

const MONTH_COUNT = 6;

export default function FinancialDashboard() {
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings-financial'],
    queryFn: () => base44.entities.Booking.list('-transfer_date', 1000),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-financial'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  // ── KPIs ─────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const paid       = bookings.filter(b => b.payment_status === 'paid');
    const unpaid     = bookings.filter(b => b.payment_status === 'unpaid' && b.status !== 'cancelled');
    const completed  = bookings.filter(b => b.status === 'completed');
    const cancelled  = bookings.filter(b => b.status === 'cancelled');
    const pending    = bookings.filter(b => b.status === 'pending');
    const total_rev  = paid.reduce((s, b) => s + (b.price || 0), 0);
    const pending_rev= unpaid.reduce((s, b) => s + (b.price || 0), 0);
    return { total_rev, pending_rev, completed: completed.length, cancelled: cancelled.length, pending: pending.length, total: bookings.length };
  }, [bookings]);

  // ── Status distribution (pie) ─────────────────────────────────────────
  const statusDist = useMemo(() => {
    const counts = {};
    bookings.forEach(b => { counts[b.status] = (counts[b.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [bookings]);

  // ── Monthly revenue (last 6 months) ──────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    const months = Array.from({ length: MONTH_COUNT }, (_, i) => {
      const d = subMonths(new Date(), MONTH_COUNT - 1 - i);
      return {
        key: format(d, 'yyyy-MM'),
        label: format(d, 'MMM', { locale: pt }),
        revenue: 0,
        count: 0,
      };
    });
    bookings.forEach(b => {
      if (!b.transfer_date || b.status === 'cancelled') return;
      const key = b.transfer_date.slice(0, 7);
      const slot = months.find(m => m.key === key);
      if (slot) {
        slot.revenue += b.price || 0;
        slot.count += 1;
      }
    });
    return months;
  }, [bookings]);

  // ── Driver performance by month (year filter) ─────────────────────────
  const driverPerf = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const label = format(new Date(Number(year), i, 1), 'MMM', { locale: pt });
      const entry = { month: label };
      drivers.forEach(d => { entry[d.name] = 0; });
      return entry;
    });

    bookings.forEach(b => {
      if (!b.transfer_date || !b.driver_name) return;
      if (b.status !== 'completed') return;
      const [y, m] = b.transfer_date.split('-');
      if (y !== year) return;
      const idx = parseInt(m, 10) - 1;
      if (months[idx] && b.driver_name in months[idx]) {
        months[idx][b.driver_name] += 1;
      }
    });
    return months;
  }, [bookings, drivers, year]);

  const driverColors = ['#0ea5e9', '#f59e0b', '#22c55e', '#a855f7', '#ef4444', '#f97316', '#14b8a6', '#ec4899'];
  const activeDrivers = drivers.filter(d => driverPerf.some(m => m[d.name] > 0));

  const years = useMemo(() => {
    const ys = new Set(bookings.map(b => b.transfer_date?.slice(0, 4)).filter(Boolean));
    return Array.from(ys).sort().reverse();
  }, [bookings]);

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Faturado (pago)',     value: `€${kpis.total_rev.toFixed(0)}`,     icon: Euro,         color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'A receber',           value: `€${kpis.pending_rev.toFixed(0)}`,   icon: TrendingUp,   color: 'text-blue-600',   bg: 'bg-blue-50' },
          { label: 'Concluídas',          value: kpis.completed,                      icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Pendentes',           value: kpis.pending,                        icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Canceladas',          value: kpis.cancelled,                      icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
                <p className="text-xl font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row 1: Revenue + Status Pie ── */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Monthly Revenue */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              Receita & reservas — últimos 6 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyRevenue} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="rev" orientation="left" tick={{ fontSize: 11 }} tickFormatter={v => `€${v}`} />
                <YAxis yAxisId="cnt" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => name === 'Receita' ? [`€${value.toFixed(0)}`, name] : [value, name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar yAxisId="rev" dataKey="revenue" name="Receita" fill="hsl(199,89%,32%)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="cnt" dataKey="count"   name="Reservas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reservas por estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {statusDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {statusDist.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                  </div>
                  <span className="font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Driver performance ── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="w-4 h-4 text-primary" />
              Viagens concluídas por motorista
            </CardTitle>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(years.length ? years : [String(new Date().getFullYear())]).map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {activeDrivers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Sem dados de motoristas para {year}</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={driverPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {activeDrivers.map((d, i) => (
                  <Line
                    key={d.id}
                    type="monotone"
                    dataKey={d.name}
                    stroke={driverColors[i % driverColors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

    </div>
  );
}