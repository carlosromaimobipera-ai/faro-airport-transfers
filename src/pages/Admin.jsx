import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBookingNotifications } from '@/hooks/useBookingNotifications';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Car, MapPin, Euro, Clock, Loader2, Search, FilterX, UserCheck, Star, Tag, BarChart2, Navigation, Download, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import DriversManager from '@/components/admin/DriversManager';
import DriverUnavailabilityManager from '@/components/admin/DriverUnavailabilityManager';
import DriverBookingsList from '@/components/admin/DriverBookingsList';
import ReviewsStats from '@/components/admin/ReviewsStats';
import PriceManager from '@/components/admin/PriceManager';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import LiveDriverMap from '@/components/admin/LiveDriverMap';
import DailyScheduleExport from '@/components/admin/DailyScheduleExport';
import BookingTableMobile from '@/components/admin/BookingTableMobile';
import UsersManager from '@/components/admin/UsersManager';
import AdminNotesCell from '@/components/admin/AdminNotesCell';
import BookingDetailsDialog from '@/components/admin/BookingDetailsDialog';

const statusConfig = {
  pending:     { label: "Pendente",   color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed:   { label: "Confirmada", color: "bg-blue-100 text-blue-800 border-blue-200" },
  in_progress: { label: "Em curso",   color: "bg-orange-100 text-orange-800 border-orange-200" },
  completed:   { label: "Concluída",  color: "bg-green-100 text-green-800 border-green-200" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-800 border-red-200" },
};

const paymentConfig = {
  unpaid:   { label: "Não pago",    color: "bg-orange-100 text-orange-800 border-orange-200" },
  paid:     { label: "Pago",        color: "bg-green-100 text-green-800 border-green-200" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus' };

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  // Reset to bookings tab only when navigating TO /admin from another page
  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setActiveTab('bookings');
    }
  }, [location.pathname]);

  useBookingNotifications(!!user);

  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPayment,  setFilterPayment]   = useState('all');
  const [filterDateFrom, setFilterDateFrom]  = useState('');
  const [filterDateTo,   setFilterDateTo]    = useState('');
  const [search,         setSearch]          = useState('');
  const [sortOrder,      setSortOrder]       = useState('asc');
  const [detailsBooking, setDetailsBooking]  = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u) { base44.auth.redirectToLogin(window.location.href); return; }
      if (u.role !== 'admin') { navigate('/'); return; }
      setUser(u);
      setAuthLoading(false);
    }).catch(() => { base44.auth.redirectToLogin(window.location.href); });
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings-admin'],
    queryFn: () => base44.entities.Booking.list('-transfer_date', 500),
    enabled: !!user,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('name'),
    enabled: !!user,
  });

  const { data: unavailabilities = [] } = useQuery({
    queryKey: ['driver-unavailabilities'],
    queryFn: () => base44.entities.DriverUnavailability.list('-date_from', 500),
    enabled: !!user,
  });

  const isDriverAvailable = (driverId, transferDate) => {
    if (!transferDate) return true;
    return !unavailabilities.some(u =>
      u.driver_id === driverId &&
      transferDate >= u.date_from &&
      transferDate <= u.date_to
    );
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['bookings-admin'] });
      const prev = queryClient.getQueryData(['bookings-admin']);
      queryClient.setQueryData(['bookings-admin'], (old) =>
        old?.map(b => b.id === id ? { ...b, ...data } : b)
      );
      return { prev };
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['bookings-admin'], ctx.prev);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings-admin'] }),
  });

  const assignDriver = (booking, driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    updateMutation.mutate({
      id: booking.id,
      data: {
        driver_id: driverId || null,
        driver_name: driver ? driver.name : null,
        driver_email: driver ? driver.email : null,
      },
    });
  };

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const filtered = bookings.filter(b => {
    if (filterStatus  !== 'all' && b.status         !== filterStatus)  return false;
    if (filterPayment !== 'all' && b.payment_status !== filterPayment) return false;
    if (filterDateFrom && b.transfer_date < filterDateFrom) return false;
    if (filterDateTo   && b.transfer_date > filterDateTo)   return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !b.customer_name?.toLowerCase().includes(q) &&
        !b.customer_email?.toLowerCase().includes(q) &&
        !b.booking_ref?.toLowerCase().includes(q) &&
        !b.origin?.toLowerCase().includes(q) &&
        !b.destination?.toLowerCase().includes(q)
      ) return false;
    } else if (b.transfer_date && b.transfer_date < todayStr) {
      // Sem pesquisa: mostrar apenas reservas de hoje em diante
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = `${a.transfer_date || ''}T${a.transfer_time || '00:00'}`;
    const db = `${b.transfer_date || ''}T${b.transfer_time || '00:00'}`;
    return sortOrder === 'asc' ? da.localeCompare(db) : db.localeCompare(da);
  });

  const stats = {
    total:   bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    today:   bookings.filter(b => b.transfer_date === format(new Date(), 'yyyy-MM-dd')).length,
    revenue: bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + (b.price || 0), 0),
  };

  const clearFilters = () => {
    setFilterStatus('all'); setFilterPayment('all');
    setFilterDateFrom(''); setFilterDateTo(''); setSearch('');
  };
  const hasFilters = filterStatus !== 'all' || filterPayment !== 'all' || filterDateFrom || filterDateTo || search;

  const exportCSV = async () => {
    const res = await base44.functions.invoke('exportBookingsCSV', {});
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservas-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Gestão de Reservas</h1>
            <p className="text-sm text-muted-foreground">Painel de administração</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Reservas",  value: stats.total,                    icon: Calendar, color: "text-primary" },
            { label: "Pendentes",       value: stats.pending,                  icon: Clock,    color: "text-yellow-600" },
            { label: "Hoje",            value: stats.today,                    icon: Car,      color: "text-blue-600" },
            { label: "Receita (Pago)",  value: `€${stats.revenue.toFixed(0)}`, icon: Euro,     color: "text-green-600" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="financial" className="gap-1.5">
              <BarChart2 className="w-4 h-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="drivers" className="gap-1.5">
              <UserCheck className="w-4 h-4" /> Motoristas
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="w-4 h-4" /> Utilizadores
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-1.5">
              <Navigation className="w-4 h-4" /> Localização
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5">
              <Star className="w-4 h-4" /> Avaliações
            </TabsTrigger>
            <TabsTrigger value="prices" className="gap-1.5">
              <Tag className="w-4 h-4" /> Preços
            </TabsTrigger>
          </TabsList>

          {/* ── Financeiro Tab ── */}
          <TabsContent value="financial" className="mt-4">
            <FinancialDashboard />
          </TabsContent>

          {/* ── Reservas Tab ── */}
          <TabsContent value="bookings" className="space-y-4 mt-4">

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar cliente, ref, rota..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Estado reserva" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os estados</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="in_progress">Em curso</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPayment} onValueChange={setFilterPayment}>
                    <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Pagamento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os pagamentos</SelectItem>
                      <SelectItem value="unpaid">Não pago</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-9 w-36" />
                    <span className="text-muted-foreground text-sm">→</span>
                    <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-9 w-36" />
                  </div>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Data: mais próxima → mais distante</SelectItem>
                      <SelectItem value="desc">Data: mais recente → mais antiga</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1 h-9">
                    <Download className="w-4 h-4" /> Exportar CSV
                  </Button>
                  {hasFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground h-9">
                      <FilterX className="w-4 h-4" /> Limpar
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{sorted.length} reserva(s) encontrada(s)</p>
              </CardContent>
            </Card>

            {/* Table (Desktop) / Cards (Mobile) */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sorted.length === 0 ? (
              <Card>
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma reserva encontrada
                </div>
              </Card>
            ) : (
              <>
                {/* Desktop Table */}
                <Card className="hidden md:block">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ref.</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Rota</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Veículo</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Notas internas</TableHead>
                          <TableHead>Alterar estado</TableHead>
                          <TableHead>Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sorted.map(booking => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-xs font-bold text-primary">{booking.booking_ref}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{booking.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                              <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-1 text-xs max-w-[160px]">
                                <MapPin className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                <span className="leading-tight">{booking.origin} → {booking.destination}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {booking.transfer_date && format(new Date(booking.transfer_date + 'T00:00:00'), "d MMM yyyy", { locale: pt })}
                              <br /><span className="text-muted-foreground text-xs">{booking.transfer_time}</span>
                            </TableCell>
                            <TableCell className="text-xs">{vehicleLabel[booking.vehicle_type] || booking.vehicle_type}</TableCell>
                            <TableCell className="font-bold text-primary">€{booking.price?.toFixed(0)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusConfig[booking.status]?.color}>
                                {statusConfig[booking.status]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={paymentConfig[booking.payment_status]?.color}>
                                {paymentConfig[booking.payment_status]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={booking.driver_id || 'none'}
                                onValueChange={val => assignDriver(booking, val === 'none' ? null : val)}
                                disabled={updateMutation.isPending}
                              >
                                <SelectTrigger className="h-8 w-40 text-xs">
                                  <SelectValue placeholder="Sem motorista" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">— Sem motorista —</SelectItem>
                                  {drivers.filter(d => d.active).map(d => {
                                    const available = isDriverAvailable(d.id, booking.transfer_date);
                                    return (
                                      <SelectItem key={d.id} value={d.id} disabled={!available}>
                                        {d.name}{!available ? ' (indisponível)' : ''}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <AdminNotesCell booking={booking} onSave={(id, notes) => updateMutation.mutate({ id, data: { admin_notes: notes } })} />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={booking.status}
                                onValueChange={val => updateMutation.mutate({ id: booking.id, data: { status: val } })}
                                disabled={updateMutation.isPending}
                              >
                                <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="confirmed">Confirmada</SelectItem>
                                  <SelectItem value="in_progress">Em curso</SelectItem>
                                  <SelectItem value="completed">Concluída</SelectItem>
                                  <SelectItem value="cancelled">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5"
                                onClick={() => setDetailsBooking(booking)}
                              >
                                <FileText className="w-3.5 h-3.5" /> Ver
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                {/* Mobile Card List */}
                <div className="md:hidden">
                  <BookingTableMobile
                    bookings={sorted}
                    drivers={drivers}
                    unavailabilities={unavailabilities}
                    onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
                    onAssignDriver={assignDriver}
                    onViewDetails={setDetailsBooking}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* ── Avaliações Tab ── */}
          <TabsContent value="reviews" className="mt-4">
            <ReviewsStats />
          </TabsContent>

          {/* ── Preços Tab ── */}
          <TabsContent value="prices" className="mt-4">
            <PriceManager />
          </TabsContent>

          {/* ── Localização Tab ── */}
          <TabsContent value="locations" className="mt-4 space-y-4">
            <DailyScheduleExport />
            <LiveDriverMap />
          </TabsContent>

          {/* ── Motoristas Tab ── */}
          <TabsContent value="drivers" className="mt-4 space-y-4">
            <DriversManager />
            <DriverBookingsList />
            <DriverUnavailabilityManager />
          </TabsContent>

          {/* ── Utilizadores Tab ── */}
          <TabsContent value="users" className="mt-4">
            <UsersManager />
          </TabsContent>
        </Tabs>

      </div>

      {/* Booking details dialog with voucher PDF download */}
      <BookingDetailsDialog
        booking={detailsBooking}
        open={!!detailsBooking}
        onOpenChange={(open) => { if (!open) setDetailsBooking(null); }}
      />
    </div>
  );
}