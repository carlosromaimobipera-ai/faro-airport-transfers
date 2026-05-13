import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, ChevronUp, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const statusConfig = {
  pending:     { label: "Pendente",   color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed:   { label: "Confirmada", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Em curso",   color: "bg-orange-100 text-orange-800 border-orange-200" },
  completed:   { label: "Concluída",  color: "bg-green-100 text-green-800 border-green-200" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-800 border-red-200" },
};

function DriverBookings({ driver }) {
  const [expanded, setExpanded] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['driver-assigned-bookings', driver.id],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id }, 'transfer_date', 200),
    enabled: expanded,
  });

  const upcoming = bookings.filter(b =>
    b.status !== 'cancelled' && b.transfer_date >= today
  );
  const past = bookings.filter(b =>
    b.status !== 'cancelled' && b.transfer_date < today
  );

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-bold text-sm">{driver.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{driver.name}</p>
            <p className="text-xs text-muted-foreground">
              {driver.vehicle_model || driver.vehicle_type}
              {driver.vehicle_plate ? ` · ${driver.vehicle_plate}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={driver.active ? 'text-green-700 border-green-200 bg-green-50' : 'text-gray-500 border-gray-200'}>
            {driver.active ? 'Ativo' : 'Inativo'}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t bg-muted/10 px-4 pb-4 pt-3 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Upcoming */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Próximas / Hoje · {upcoming.length}
                </p>
                {upcoming.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sem viagens futuras atribuídas</p>
                ) : (
                  <div className="space-y-2">
                    {upcoming.map(b => (
                      <div key={b.id} className="bg-card border rounded-lg px-3 py-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-primary">{b.booking_ref}</span>
                          <Badge variant="outline" className={`text-xs ${statusConfig[b.status]?.color}`}>
                            {statusConfig[b.status]?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {b.transfer_date && format(new Date(b.transfer_date + 'T00:00:00'), "d MMM yyyy", { locale: pt })}
                            {b.transfer_time ? ` às ${b.transfer_time}` : ''}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 text-xs">
                          <MapPin className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                          <span className="text-foreground">{b.origin} → {b.destination}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{b.customer_name}</span>
                          <span className="font-semibold text-primary">€{b.price?.toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past */}
              {past.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Anteriores · {past.length}
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {past.slice(0, 20).map(b => (
                      <div key={b.id} className="flex items-center justify-between px-3 py-2 bg-card border rounded-lg opacity-60">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-primary">{b.booking_ref}</span>
                          <span className="text-muted-foreground">{b.transfer_date}</span>
                          <span className="truncate max-w-[120px]">{b.origin} → {b.destination}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusConfig[b.status]?.color}`}>
                          {statusConfig[b.status]?.label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookings.filter(b => b.status !== 'cancelled').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 italic">Sem viagens atribuídas</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function DriverBookingsList() {
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  const activeDrivers = drivers.filter(d => d.active);
  const inactiveDrivers = drivers.filter(d => !d.active);

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Viagens por Motorista
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {drivers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum motorista registado.</p>
        ) : (
          <>
            {activeDrivers.map(d => <DriverBookings key={d.id} driver={d} />)}
            {inactiveDrivers.map(d => <DriverBookings key={d.id} driver={d} />)}
          </>
        )}
      </CardContent>
    </Card>
  );
}