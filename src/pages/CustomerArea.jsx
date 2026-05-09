import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Calendar, CheckCircle2,
  Clock, TrendingUp, Search, LogOut
} from 'lucide-react';
import BookingHistoryCard from '@/components/customer/BookingHistoryCard';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function CustomerArea() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | upcoming | past

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        loadBookings(me.email);
      }
      setAuthLoading(false);
    });
  }, []);

  const loadBookings = async (email) => {
    setBookingsLoading(true);
    // Fetch all bookings where customer_email matches
    const all = await base44.entities.Booking.filter({ customer_email: email }, '-transfer_date', 200);
    setBookings(all);
    setBookingsLoading(false);
  };

  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  const handleLogout = () => {
    base44.auth.logout('/area-cliente');
  };

  // Subscribe to real-time booking changes
  useEffect(() => {
    if (!user) return;
    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      if (event.data?.customer_email?.toLowerCase() !== user.email?.toLowerCase()) return;
      if (event.type === 'create') {
        setBookings(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setBookings(prev => prev.map(b => b.id === event.id ? event.data : b));
      } else if (event.type === 'delete') {
        setBookings(prev => prev.filter(b => b.id !== event.id));
      }
    });
    return unsubscribe;
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = bookings.filter(b => {
    if (filter === 'upcoming') return b.transfer_date >= today && b.status !== 'cancelled' && b.status !== 'completed';
    if (filter === 'past') return b.transfer_date < today || b.status === 'completed';
    return true;
  }).filter(b => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.booking_ref?.toLowerCase().includes(q) ||
      b.origin?.toLowerCase().includes(q) ||
      b.destination?.toLowerCase().includes(q);
  });

  const upcoming = bookings.filter(b => b.transfer_date >= today && b.status !== 'cancelled' && b.status !== 'completed');
  const completed = bookings.filter(b => b.status === 'completed');
  const totalSpent = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0);

  // ── Loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 pt-10 pb-14">
          <div className="max-w-lg mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Voltar ao início
            </Link>
            <h1 className="text-2xl font-bold font-display">Área do Cliente</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">Gerencie as suas reservas e descarregue faturas</p>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-8 pb-12 w-full">
          <Card className="shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Bem-vindo</h2>
                <p className="text-muted-foreground text-sm">
                  Inicie sessão para aceder ao histórico das suas reservas, acompanhar viagens em tempo real e descarregar faturas.
                </p>
              </div>

              <Button onClick={handleLogin} className="w-full h-12 text-base font-semibold gap-2">
                <User className="w-5 h-5" />
                Iniciar Sessão com Email
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ao iniciar sessão, as suas reservas são carregadas automaticamente com base no email usado durante a reserva.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Logged in
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-10 pb-16">
        <div className="max-w-2xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar ao início
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-primary-foreground/60 text-xs uppercase tracking-wide mb-1">Área do Cliente</p>
              <h1 className="text-xl font-bold">{user.full_name || user.email}</h1>
              <p className="text-primary-foreground/70 text-sm">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 gap-1.5 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-12 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Reservas', value: bookings.length, icon: Calendar, color: 'text-primary' },
            { label: 'Próximas', value: upcoming.length, icon: Clock, color: 'text-blue-600' },
            { label: 'Concluídas', value: completed.length, icon: CheckCircle2, color: 'text-green-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-3 text-center">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* In-progress alert */}
        {bookings.some(b => b.status === 'in_progress') && (
          <div className="bg-orange-50 border border-orange-300 rounded-xl p-4 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <div>
              <p className="font-semibold text-orange-800 text-sm">Viagem em curso agora</p>
              <p className="text-orange-700 text-xs">O seu motorista está a caminho ou já iniciou a viagem.</p>
            </div>
          </div>
        )}

        {/* Filter tabs + search */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'upcoming', label: 'Próximas' },
                { value: 'past', label: 'Anteriores' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    filter === f.value
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por ref., origem ou destino..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bookings list */}
        {bookingsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="font-medium text-muted-foreground">
              {bookings.length === 0 ? 'Ainda não tem reservas' : 'Nenhuma reserva encontrada'}
            </p>
            {bookings.length === 0 && (
              <Link to="/">
                <Button variant="outline" className="mt-2">Fazer uma reserva</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <BookingHistoryCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}