import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle2, MapPin, Gauge } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function HistoryTab({ driver }) {
  const { data: completedBookings = [], isLoading } = useQuery({
    queryKey: ['driver-history', driver?.id],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id, status: 'completed' }, '-transfer_date', 200),
    enabled: !!driver?.id,
  });

  const stats = useMemo(() => {
    const totalKm = completedBookings.reduce((sum, b) => sum + (b.distance_km || 0), 0);
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
    return { totalKm: Math.round(totalKm), totalTrips: completedBookings.length, totalEarnings };
  }, [completedBookings]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (completedBookings.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto" />
        <p className="font-medium text-muted-foreground">Sem transferências concluídas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-card border rounded-xl p-3">
          <p className="text-xl font-bold text-green-600">{stats.totalTrips}</p>
          <p className="text-xs text-muted-foreground leading-tight">Viagens</p>
        </div>
        <div className="bg-card border rounded-xl p-3">
          <p className="text-xl font-bold text-primary">{stats.totalKm.toLocaleString('pt-PT')}</p>
          <p className="text-xs text-muted-foreground leading-tight">Km Totais</p>
        </div>
        <div className="bg-card border rounded-xl p-3">
          <p className="text-xl font-bold text-secondary">€{stats.totalEarnings.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground leading-tight">Faturado</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {completedBookings.map(b => (
          <Card key={b.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">{b.booking_ref}</span>
                <span className="text-xs text-muted-foreground">
                  {b.transfer_date ? format(new Date(b.transfer_date + 'T00:00:00'), "d MMM yyyy", { locale: pt }) : '—'}
                  {b.transfer_time && <span> · {b.transfer_time}</span>}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-sm">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-foreground leading-tight">
                  <span className="font-medium">{b.origin}</span>
                  <span className="text-muted-foreground"> → </span>
                  <span className="font-medium">{b.destination}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {b.distance_km && (
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    {b.distance_km} km
                  </span>
                )}
                {b.passengers && (
                  <span>👥 {b.passengers} pax</span>
                )}
                {b.price && (
                  <span className="ml-auto font-semibold text-foreground">€{Number(b.price).toFixed(2)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}