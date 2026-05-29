import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addDays } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar, Car, Loader2, CalendarDays, LogOut, History } from 'lucide-react';
import BookingCard from '@/components/driver/BookingCard';
import { useGpsTracking } from '@/hooks/useGpsTracking';
import GpsTrackingBadge from '@/components/driver/GpsTrackingBadge';
import HistoryTab from '@/components/driver/HistoryTab';

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan (VW Caddy Maxi)', minibus: 'Minibus (Mercedes Vito)' };

export default function Driver() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [driver, setDriver] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'upcoming' | 'history'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      if (!u) { base44.auth.redirectToLogin(window.location.href); return; }
      setUser(u);
      const drivers = await base44.entities.Driver.filter({ email: u.email }, 'name', 1);
      setDriver(drivers[0] || null);
      setAuthLoading(false);
    }).catch(() => { base44.auth.redirectToLogin(window.location.href); });
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['driver-bookings-day'] }),
      queryClient.refetchQueries({ queryKey: ['driver-bookings-upcoming'] }),
    ]);
  };

  const { containerRef, isPulling } = usePullToRefresh(handleRefresh);

  // Today / selected date bookings
  const { data: dayBookings = [], isLoading: isDayLoading } = useQuery({
    queryKey: ['driver-bookings-day', driver?.id, selectedDate],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id, transfer_date: selectedDate }, 'transfer_time', 100),
    enabled: !!driver?.id,
  });

  // Upcoming bookings (next 30 days, excluding today)
  const { data: allUpcoming = [], isLoading: isUpcomingLoading } = useQuery({
    queryKey: ['driver-bookings-upcoming', driver?.id],
    queryFn: () => base44.entities.Booking.filter({ driver_id: driver.id }, 'transfer_date', 200),
    enabled: !!driver?.id && activeTab === 'upcoming',
  });

  const upcomingBookings = allUpcoming.filter(b =>
    b.transfer_date > today &&
    b.status !== 'cancelled' &&
    b.status !== 'completed'
  );

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Booking.update(id, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['driver-bookings-day'] });
      await queryClient.cancelQueries({ queryKey: ['driver-bookings-upcoming'] });
      const prevDay = queryClient.getQueryData(['driver-bookings-day', driver?.id, selectedDate]);
      const prevUpcoming = queryClient.getQueryData(['driver-bookings-upcoming', driver?.id]);
      queryClient.setQueryData(['driver-bookings-day', driver?.id, selectedDate], (old) =>
        old?.map(b => b.id === id ? { ...b, status } : b)
      );
      queryClient.setQueryData(['driver-bookings-upcoming', driver?.id], (old) =>
        old?.map(b => b.id === id ? { ...b, status } : b)
      );
      return { prevDay, prevUpcoming };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prevDay) queryClient.setQueryData(['driver-bookings-day', driver?.id, selectedDate], ctx.prevDay);
      if (ctx?.prevUpcoming) queryClient.setQueryData(['driver-bookings-upcoming', driver?.id], ctx.prevUpcoming);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-bookings-day'] });
      queryClient.invalidateQueries({ queryKey: ['driver-bookings-upcoming'] });
    },
  });

  const active = dayBookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const completed = dayBookings.filter(b => b.status === 'completed');
  const inProgress = dayBookings.filter(b => b.status === 'in_progress');

  // All today's non-cancelled bookings (for GPS tracking)
  const todayAllBookings = dayBookings.filter(b => b.status !== 'cancelled');

  // GPS tracking — starts automatically when a booking window is reached
  useGpsTracking({ driver, activeBookings: todayAllBookings });

  // Which booking is currently being tracked (for the badge)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const trackedBooking = todayAllBookings.find(b => {
    if (b.status === 'in_progress') return true;
    if (!b.transfer_time) return false;
    const [h, m] = b.transfer_time.split(':').map(Number);
    const bt = new Date(now); bt.setHours(h, m, 0, 0);
    const diff = bt - now;
    return diff <= 15 * 60 * 1000 && diff >= -4 * 60 * 60 * 1000;
  }) || null;

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
    <div ref={containerRef} className="min-h-screen bg-background overflow-y-auto">
      {isPulling && (
        <div className="flex justify-center pt-4">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-14">
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
          <div className="mt-3 flex items-center justify-between gap-3">
            <GpsTrackingBadge activeBooking={trackedBooking} />
            <button
              onClick={() => base44.auth.logout('/')}
              className="flex items-center gap-1.5 text-xs text-primary-foreground/70 hover:text-primary-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 -mt-6 pb-12 space-y-4">

        {/* Tab switcher */}
        <Card>
          <CardContent className="p-1.5">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => setActiveTab('today')}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'today'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Por Dia</span>
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Próximas</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Histórico</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Tab: Por Dia ── */}
        {activeTab === 'today' && (
          <>
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
            {!isDayLoading && dayBookings.length > 0 && (
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Total',      value: dayBookings.length,                    color: 'text-foreground' },
                  { label: 'Pendentes',  value: active.length - inProgress.length,     color: 'text-yellow-600' },
                  { label: 'Em curso',   value: inProgress.length,                     color: 'text-orange-600' },
                  { label: 'Concluídas', value: completed.length,                      color: 'text-green-600' },
                ].map(s => (
                  <div key={s.label} className="bg-card border rounded-xl p-2.5">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings */}
            {isDayLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : dayBookings.length === 0 ? (
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
          </>
        )}

        {/* ── Tab: Histórico ── */}
        {activeTab === 'history' && <HistoryTab driver={driver} />}

        {/* ── Tab: Próximas ── */}
        {activeTab === 'upcoming' && (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Próximas reservas atribuídas
              </p>
              {!isUpcomingLoading && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                  {upcomingBookings.length}
                </span>
              )}
            </div>

            {isUpcomingLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="font-medium text-muted-foreground">Sem próximas reservas atribuídas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => (
                  <BookingCard
                    key={b.id}
                    booking={b}
                    showDate={true}
                    onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}