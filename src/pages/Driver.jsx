import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  MapPin, Calendar, Clock, User, Phone, Mail,
  Plane, Package, Users, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, ArrowRight, Car
} from 'lucide-react';

const statusConfig = {
  pending:   { label: 'Pendente',   color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  completed: { label: 'Concluída',  color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelada',  color: 'bg-red-100 text-red-800 border-red-200' },
};

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };

function BookingCard({ booking, onComplete }) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';

  return (
    <Card className={`border-l-4 transition-all ${isCompleted ? 'border-l-green-500 opacity-75' : isCancelled ? 'border-l-red-400 opacity-60' : 'border-l-primary'}`}>
      <CardContent className="p-0">
        {/* Summary row */}
        <button
          className="w-full text-left p-4 md:p-5"
          onClick={() => setExpanded(e => !e)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Time & route */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-lg font-bold text-primary">{booking.transfer_time}</span>
                <span className="text-sm text-muted-foreground font-mono">{booking.booking_ref}</span>
                <Badge variant="outline" className={statusConfig[booking.status]?.color}>
                  {statusConfig[booking.status]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{booking.origin}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{booking.destination}</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.passengers} pax</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{booking.luggage} malas</span>
                <span className="flex items-center gap-1"><Car className="w-3 h-3" />{vehicleLabel[booking.vehicle_type] || booking.vehicle_type}</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-2">
              <span className="text-lg font-bold text-primary">€{booking.price?.toFixed(0)}</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 md:p-5 space-y-4">

              {/* Passenger info */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Passageiro</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold">{booking.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${booking.customer_phone}`} className="text-primary underline">
                    {booking.customer_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">{booking.customer_email}</span>
                </div>
                {booking.flight_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="w-4 h-4 text-primary shrink-0" />
                    <span>Voo: <strong>{booking.flight_number}</strong></span>
                  </div>
                )}
              </div>

              {/* Route info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rota</p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Recolha</p>
                      <p className="font-medium">{booking.origin}</p>
                    </div>
                  </div>
                  <div className="ml-2.5 w-0.5 h-4 bg-border" />
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Entrega</p>
                      <p className="font-medium">{booking.destination}</p>
                    </div>
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
                <Badge variant="outline" className={booking.payment_status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}>
                  {booking.payment_status === 'paid' ? '✓ Pago (PayPal)' : '💵 A pagar em dinheiro — €' + booking.price?.toFixed(2)}
                </Badge>
              </div>

              {/* Complete button */}
              {!isCompleted && !isCancelled && (
                <Button
                  onClick={() => onComplete(booking.id)}
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Marcar como concluída
                </Button>
              )}

              {isCompleted && (
                <div className="flex items-center justify-center gap-2 py-2 text-green-600 text-sm font-semibold">
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
      // Find driver by email
      const drivers = await base44.entities.Driver.list('name', 100);
      const matched = drivers.find(d => d.email?.toLowerCase() === u.email?.toLowerCase());
      setDriver(matched || null);
      setAuthLoading(false);
    }).catch(() => { navigate('/'); });
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['driver-bookings', driver?.id, selectedDate],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id, transfer_date: selectedDate }, '-transfer_time', 100),
    enabled: !!driver?.id,
  });

  const completeMutation = useMutation({
    mutationFn: (id) => base44.entities.Booking.update(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-bookings'] }),
  });

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  const pending = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const completed = bookings.filter(b => b.status === 'completed');

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
          O seu email (<strong>{user?.email}</strong>) não está associado a nenhum motorista.<br />
          Contacte o administrador.
        </p>
        <Button variant="outline" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/70">Motorista</p>
              <h1 className="text-xl font-bold">{driver.name}</h1>
            </div>
          </div>
          <p className="text-sm text-primary-foreground/70">
            {vehicleLabel[driver.vehicle_type] || driver.vehicle_type}
            {driver.vehicle_plate && <span> · {driver.vehicle_plate}</span>}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-4 pb-12 space-y-4">

        {/* Date selector */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              {[
                { label: 'Hoje', value: today },
                { label: 'Amanhã', value: tomorrow },
              ].map(opt => (
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
            <p className="text-xs text-muted-foreground text-center mt-2">
              {format(new Date(selectedDate + 'T00:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
            </p>
          </CardContent>
        </Card>

        {/* Stats bar */}
        {!isLoading && bookings.length > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-card border rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{bookings.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border rounded-xl p-3">
              <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="bg-card border rounded-xl p-3">
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </div>
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
          <div className="space-y-3">
            {/* Pending first */}
            {pending.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  A realizar ({pending.length})
                </p>
                {pending.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onComplete={(id) => completeMutation.mutate(id)}
                  />
                ))}
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  Concluídas ({completed.length})
                </p>
                {completed.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    onComplete={(id) => completeMutation.mutate(id)}
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