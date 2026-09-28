import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { appParams } from '@/lib/app-params';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDuration, logMinutes, logDayKey, groupByDay } from '@/lib/serviceHours';

const COMPANY = {
  nif: '514346744',
  rnavt: '6855',
  phone: '+351 913 956 971',
  address: 'Urbanização Quinta Da Torre, Lote 22, R/C A, Algarve, Portugal',
};

export default function ServiceLogAuthorityView({ open, onOpenChange, driver, logs }) {
  const [now, setNow] = useState(Date.now());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [open]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const monthKey = format(new Date(), 'yyyy-MM');
  const monthLogs = useMemo(() => logs.filter(l => logDayKey(l).startsWith(monthKey)), [logs, monthKey]);
  const days = useMemo(() => groupByDay(monthLogs, now), [monthLogs, now]);
  const monthMinutes = monthLogs.reduce((sum, l) => sum + logMinutes(l, now), 0);
  const todayMinutes = monthLogs
    .filter(l => logDayKey(l) === todayKey)
    .reduce((sum, l) => sum + logMinutes(l, now), 0);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const { appId, token } = appParams;
      const res = await fetch(
        `${window.location.origin}/api/apps/${appId}/functions/exportServiceLogPdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            driver_id: driver.id,
            date_from: monthKey + '-01',
            date_to: todayKey,
          }),
        }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registo-horas-${format(new Date(), 'yyyy-MM')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Erro ao gerar o PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Registo de Horas de Serviço
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-1">
          Mostre este documento em caso de fiscalização.
        </p>

        {/* Documento oficial */}
        <div className="rounded-xl border overflow-hidden bg-white text-slate-900">
          <div className="bg-slate-900 px-4 py-3">
            <p className="text-white font-bold tracking-wide text-sm">TRANSFERS ALGARVESTAR</p>
            <p className="text-slate-300 text-[10px] mt-0.5">
              NIF: {COMPANY.nif} · RNAVT: {COMPANY.rnavt} · {COMPANY.phone} · info@transfers-algarvestar.com
            </p>
            <p className="text-slate-400 text-[10px]">{COMPANY.address}</p>
          </div>
          <div className="h-1" style={{ background: '#c8a951' }} />

          <div className="px-4 py-3 space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Motorista</p>
                <p className="text-sm font-bold">{driver.name}</p>
                <p className="text-[11px] text-slate-600">
                  {[driver.vehicle_model, driver.vehicle_plate].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Emitido em</p>
                <p className="text-[11px] font-medium">
                  {format(new Date(), "d/MM/yyyy 'às' HH:mm", { locale: pt })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-slate-100 py-2">
                <p className="text-lg font-bold">{formatDuration(todayMinutes)}</p>
                <p className="text-[10px] uppercase text-slate-500">Hoje</p>
              </div>
              <div className="rounded-lg bg-slate-100 py-2">
                <p className="text-lg font-bold">{formatDuration(monthMinutes)}</p>
                <p className="text-[10px] uppercase text-slate-500">Este mês</p>
              </div>
              <div className="rounded-lg bg-slate-100 py-2">
                <p className="text-lg font-bold">{days.length}</p>
                <p className="text-[10px] uppercase text-slate-500">Dias</p>
              </div>
            </div>

            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left px-2 py-1.5 font-semibold">Data</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Início</th>
                  <th className="text-left px-2 py-1.5 font-semibold">Fim</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Total</th>
                  <th className="text-right px-2 py-1.5 font-semibold">Matrícula</th>
                </tr>
              </thead>
              <tbody>
                {days.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-slate-400 italic">
                      Sem registos no período.
                    </td>
                  </tr>
                )}
                {days.flatMap(day =>
                  day.shifts.map((shift, idx) => (
                    <tr key={shift.id} className="border-b border-slate-200">
                      <td className="px-2 py-1.5">
                        {idx === 0 ? format(new Date(shift.start_time), 'dd/MM/yyyy') : ''}
                      </td>
                      <td className="px-2 py-1.5">{format(new Date(shift.start_time), 'HH:mm')}</td>
                      <td className="px-2 py-1.5">
                        {shift.end_time
                          ? format(new Date(shift.end_time), 'HH:mm')
                          : <span className="text-green-700 font-medium">em curso</span>}
                      </td>
                      <td className="px-2 py-1.5 text-right font-medium">
                        {formatDuration(logMinutes(shift, now))}
                      </td>
                      <td className="px-2 py-1.5 text-right text-slate-500">
                        {shift.vehicle_plate || driver.vehicle_plate || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t-2 border-slate-900 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Total do período
              </p>
              <p className="text-sm font-bold">{formatDuration(monthMinutes)}</p>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              O(a) motorista identificado(a) declara que os registos acima correspondem aos períodos de
              atividade efetivamente exercidos, nos termos da legislação aplicável ao transporte de
              passageiros.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-500">O Motorista</p>
              </div>
              <div className="border-t border-slate-400 pt-1">
                <p className="text-[10px] text-slate-500">A Empresa</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1.5">
            <XCircle className="w-4 h-4" /> {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleDownload} disabled={downloading} className="gap-2 flex-1">
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'A gerar PDF...' : 'Descarregar PDF'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}