import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  MapPin, Calendar, User, Phone, Mail,
  Plane, Package, Users, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, ArrowRight, Car,
  Navigation, PlayCircle
} from 'lucide-react';

const statusConfig = {
  pending:     { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed:   { label: 'Confirmada',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'Em curso',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  completed:   { label: 'Concluída',   color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:   { label: 'Cancelada',   color: 'bg-red-100 text-red-800 border-red-200' },
};

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };

function mapsUrl(address, coords) {
  if (coords?.lat && coords?.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function BookingCard({ booking, onUpdateStatus }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const isInProgress = booking.status === 'in_progress';

  const borderColor = isCompleted
    ? 'border-l-green-500'
    : isInProgress
    ? 'border-l-orange-500'
    : isCancelled
    ? 'border-l-red-400'
    : 'border-l-primary';

  return (
    <Card className={`border-l-4 transition-all ${borderColor} ${(isCompleted || isCancelled) ? 'opacity-70' : ''}`}>
      <CardContent className="p-0">

        {/* Summary row — always visible */}
        <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-lg font-bold text-primary">{booking.transfer_time}</span>
                <span className="text-xs text-muted-foreground font-mono">{booking.booking_ref}</span>
                <Badge variant="outline" className={`text-xs ${statusConfig[booking.status]?.color}`}>
                  {statusConfig[booking.status]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="truncate max-w-[120px]">{booking.origin}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[120px]">{booking.destination}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.passengers} pax</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{booking.luggage} malas</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-base font-bold text-primary">€{booking.price?.toFixed(0)}</span>
              {expanded
                ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />
              }
            </div>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 space-y-4">

              {/* Passenger */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passageiro</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold">{booking.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${booking.customer_phone}`} className="text-primary font-medium underline underline-offset-2">
                    {booking.customer_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{booking.customer_email}</span>
                </div>
                {booking.flight_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="w-4 h-4 text-primary shrink-0" />
                    <span>Voo: <strong>{booking.flight_number}</strong></span>
                  </div>
                )}
              </div>

              {/* Route + Google Maps buttons */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rota</p>
                <div className="flex flex-col gap-2">
                  {/* Origin */}
                  <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2 text-sm min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Recolha</p>
                        <p className="font-medium text-sm leading-tight">{booking.origin}</p>
                      </div>
                    </div>
                    <a
                      href={mapsUrl(booking.origin, booking.origin_coords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Maps
                    </a>
                  </div>

                  <div className="ml-4 w-0.5 h-3 bg-border mx-auto" style={{ marginLeft: '14px' }} />

                  {/* Destination */}
                  <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2 text-sm min-w-0">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Entrega</p>
                        <p className="font-medium text-sm leading-tight">{booking.destination}</p>
                      </div>
                    </div>
                    <a
                      href={mapsUrl(booking.destination, booking.destination_coords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Maps
                    </a>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {booking.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                  <p className="font-semibold text-xs mb-1">Observações</p>
                  {booking.notes}
                </div>
              )}

              {/* Payment */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pagamento</span>
                <Badge variant="outline" className={booking.payment_status === 'paid'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-orange-100 text-orange-700 border-orange-200'
                }>
                  {booking.payment_status === 'paid'
                    ? '✓ Pago (PayPal)'
                    : `💵 A cobrar €${booking.price?.toFixed(2)}`
                  }
                </Badge>
              </div>

              {/* Action buttons */}
              {!isCompleted && !isCancelled && (
                <div className="flex gap-2 pt-1">
                  {!isInProgress && (
                    <Button
                      onClick={() => onUpdateStatus(booking.id, 'in_progress')}
                      variant="outline"
                      className="flex-1 gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Em curso
                    </Button>
                  )}
                  <Button
                    onClick={() => onUpdateStatus(booking.id, 'completed')}
                    className={`gap-2 bg-green-600 hover:bg-green-700 text-white ${!isInProgress ? 'flex-1' : 'w-full'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Concluída
                  </Button>
                </div>
              )}

              {isCompleted && (
                <div className="flex items-center justify-center gap-2 py-1.5 text-green-600 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Viagem concluída
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Driver() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { navigate('/'); return; }
      setUser(u);
      const drivers = await base44.entities.Driver.list('name', 100);
      const matched = drivers.find(d => d.email?.toLowerCase() === u.email?.toLowerCase());
      setDriver(matched || null);
      setAuthLoading(false);
    }).catch(() => { navigate('/'); });
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['driver-bookings', driver?.id, selectedDate],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id, transfer_date: selectedDate }, 'transfer_time', 100),
    enabled: !!driver?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-bookings'] }),
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const active = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const completed = bookings.filter(b => b.status === 'completed');
  const inProgress = bookings.filter(b => b.status === 'in_progress');

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Car className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">Perfil de motorista não encontrado</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          O seu email (<strong>{user?.email}</strong>) não está associado a nenhum motorista.
          Contacte o administrador.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-10">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-primary-foreground/60 uppercase tracking-wide">Painel do Motorista</p>
              <h1 className="text-xl font-bold leading-tight">{driver.name}</h1>
              <p className="text-sm text-primary-foreground/70">
                {vehicleLabel[driver.vehicle_type] || driver.vehicle_type}
                {driver.vehicle_plate && <span> · {driver.vehicle_plate}</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-3 pb-12 space-y-4">

        {/* Date selector */}
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="flex gap-2">
              {[{ label: 'Hoje', value: today }, { label: 'Amanhã', value: tomorrow }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDate(opt.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === opt.value
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="flex-1 rounded-lg border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {format(new Date(selectedDate + 'T00:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        {!isLoading && bookings.length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Total',      value: bookings.length,   color: 'text-foreground' },
              { label: 'Pendentes',  value: active.length - inProgress.length, color: 'text-yellow-600' },
              { label: 'Em curso',   value: inProgress.length, color: 'text-orange-600' },
              { label: 'Concluídas', value: completed.length,  color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="bg-card border rounded-xl p-2.5">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bookings list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-medium text-muted-foreground">Sem viagens para este dia</p>
          </div>
        ) : (
          <div className="space-y-5">
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  A realizar · {active.length}
                </p>
                {active.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                  />
                ))}
              </div>
            )}
            {completed.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  Concluídas · {completed.length}
                </p>
                {completed.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}