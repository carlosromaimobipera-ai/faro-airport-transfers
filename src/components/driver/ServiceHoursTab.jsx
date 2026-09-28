import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatDuration, logMinutes, logDayKey, groupByDay } from '@/lib/serviceHours';
import ServiceLogAuthorityView from '@/components/driver/ServiceLogAuthorityView';

export default function ServiceHoursTab({ driver }) {
  const queryClient = useQueryClient();
  const [showAuthorityView, setShowAuthorityView] = useState(false);
  const [now, setNow] = useState(Date.now());

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['driver-service-logs', driver?.id],
    queryFn: () => base44.entities.ServiceLog.filter({ driver_id: driver.id }, '-start_time', 200),
    enabled: !!driver?.id,
  });

  const openLog = logs.find(l => l.status === 'open') || null;

  useEffect(() => {
    if (!openLog) return;
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, [openLog?.id]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['driver-service-logs'] });

  const startShift = useMutation({
    mutationFn: () => base44.entities.ServiceLog.create({
      driver_id: driver.id,
      driver_name: driver.name,
      driver_email: driver.email,
      vehicle_plate: driver.vehicle_plate || '',
      vehicle_model: driver.vehicle_model || '',
      service_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: new Date().toISOString(),
      status: 'open',
    }),
    onSuccess: refresh,
  });

  const endShift = useMutation({
    mutationFn: (log) => base44.entities.ServiceLog.update(log.id, {
      end_time: new Date().toISOString(),
      total_minutes: Math.round(logMinutes(log)),
      status: 'closed',
    }),
    onSuccess: refresh,
  });

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const monthKey = format(new Date(), 'yyyy-MM');
  const monthLogs = useMemo(() => logs.filter(l => logDayKey(l).startsWith(monthKey)), [logs, monthKey]);
  const todayMinutes = monthLogs
    .filter(l => logDayKey(l) === todayKey)
    .reduce((sum, l) => sum + logMinutes(l, now), 0);
  const monthMinutes = monthLogs.reduce((sum, l) => sum + logMinutes(l, now), 0);
  const days = useMemo(() => groupByDay(monthLogs, now), [monthLogs, now]);

  const busy = startShift.isPending || endShift.isPending;
  const error = startShift.error || endShift.error;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift control */}
      <Card className={openLog ? 'border-green-300 bg-green-50/50' : ''}>
        <CardContent className="p-4 space-y-3">
          {openLog ? (
            <>
              <div className="flex items-center gap-2 text-green-700">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600" />
                </span>
                <p className="text-sm font-semibold">Serviço em curso</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Início</p>
                  <p className="text-sm font-medium">{format(new Date(openLog.start_time), 'HH:mm')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Duração</p>
                  <p className="text-2xl font-bold text-green-700">{formatDuration(logMinutes(openLog, now))}</p>
                </div>
              </div>
              <Button
                onClick={() => endShift.mutate(openLog)}
                disabled={busy}
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
              >
                {endShift.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                Terminar serviço
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground text-center">
                Registe o início e o fim do seu período de serviço. Estes registos ficam disponíveis para apresentar às autoridades.
              </p>
              <Button
                onClick={() => startShift.mutate()}
                disabled={busy}
                className="w-full gap-2"
              >
                {startShift.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Iniciar serviço
              </Button>
            </>
          )}
          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> {error.message || 'Erro ao registar.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-card border rounded-xl p-3">
          <p className="text-xl font-bold text-primary">{formatDuration(todayMinutes)}</p>
          <p className="text-xs text-muted-foreground leading-tight">Horas hoje</p>
        </div>
        <div className="bg-card border rounded-xl p-3">
          <p className="text-xl font-bold text-foreground">{formatDuration(monthMinutes)}</p>
          <p className="text-xs text-muted-foreground leading-tight">
            {format(new Date(), 'MMMM', { locale: pt })}
          </p>
        </div>
      </div>

      {/* Authority view */}
      <Button variant="outline" onClick={() => setShowAuthorityView(true)} className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
        <ShieldCheck className="w-4 h-4" />
        Mostrar às Autoridades
      </Button>

      {/* History */}
      {days.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-medium text-muted-foreground">Sem registos este mês</p>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map(day => (
            <Card key={day.date}>
              <CardContent className="p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">
                    {format(new Date(day.date + 'T12:00:00'), "EEE, d 'de' MMMM", { locale: pt })}
                  </p>
                  <p className="text-sm font-bold text-primary">{formatDuration(day.minutes)}</p>
                </div>
                {day.shifts.map(shift => (
                  <div key={shift.id} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {format(new Date(shift.start_time), 'HH:mm')}
                      <span>→</span>
                      {shift.end_time
                        ? format(new Date(shift.end_time), 'HH:mm')
                        : <span className="text-green-600 font-medium">em curso</span>}
                    </span>
                    <span>{formatDuration(logMinutes(shift, now))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ServiceLogAuthorityView
        open={showAuthorityView}
        onOpenChange={setShowAuthorityView}
        driver={driver}
        logs={logs}
      />
    </div>
  );
}