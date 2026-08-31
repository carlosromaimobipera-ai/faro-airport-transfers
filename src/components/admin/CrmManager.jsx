import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, RefreshCw, ArrowLeft, Mail, Phone, Calendar, Euro, TrendingUp, Loader2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

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

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus', premium: 'Premium' };

export default function CrmManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['crm-clients'],
    queryFn: () => base44.entities.Client.list('-last_booking_date', 500),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings-crm'],
    queryFn: () => base44.entities.Booking.list('-transfer_date', 1000),
  });

  const clientBookings = useMemo(() => {
    if (!selectedClient) return [];
    return bookings.filter(b => b.customer_email?.toLowerCase() === selectedClient.email?.toLowerCase());
  }, [selectedClient, bookings]);

  const clientStats = useMemo(() => {
    if (!selectedClient) return null;
    const today = format(new Date(), 'yyyy-MM-dd');
    const past = clientBookings.filter(b => b.transfer_date < today);
    const future = clientBookings.filter(b => b.transfer_date >= today);
    const totalSpent = clientBookings
      .filter(b => b.payment_status === 'paid' && b.status !== 'cancelled')
      .reduce((s, b) => s + (b.price || 0), 0);
    return {
      total: clientBookings.length,
      past: past.length,
      future: future.length,
      totalSpent,
      lastDate: clientBookings[0]?.transfer_date,
    };
  }, [selectedClient, clientBookings]);

  const filteredClients = useMemo(() => {
    if (!search) return clients;
    const q = search.toLowerCase();
    return clients.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const syncMutation = useMutation({
    mutationFn: async () => {
      setSyncing(true);
      // Group bookings by email
      const byEmail = {};
      for (const b of bookings) {
        if (!b.customer_email) continue;
        const key = b.customer_email.toLowerCase();
        if (!byEmail[key]) {
          byEmail[key] = { email: b.customer_email, name: b.customer_name, phone: b.customer_phone, bookings: [] };
        }
        byEmail[key].bookings.push(b);
        // Keep most recent non-empty name/phone
        if (!byEmail[key].name && b.customer_name) byEmail[key].name = b.customer_name;
        if (!byEmail[key].phone && b.customer_phone) byEmail[key].phone = b.customer_phone;
      }

      // For each email, create or update client
      const existingByEmail = {};
      for (const c of clients) {
        if (c.email) existingByEmail[c.email.toLowerCase()] = c;
      }

      const toCreate = [];
      const toUpdate = [];
      for (const [emailKey, data] of Object.entries(byEmail)) {
        const total = data.bookings.length;
        const totalSpent = data.bookings
          .filter(b => b.payment_status === 'paid' && b.status !== 'cancelled')
          .reduce((s, b) => s + (b.price || 0), 0);
        const dates = data.bookings.map(b => b.transfer_date).filter(Boolean).sort();
        const lastDate = dates[dates.length - 1] || null;

        if (existingByEmail[emailKey]) {
          toUpdate.push({
            id: existingByEmail[emailKey].id,
            data: {
              name: data.name || existingByEmail[emailKey].name,
              phone: data.phone || existingByEmail[emailKey].phone,
              total_bookings: total,
              total_spent: Math.round(totalSpent * 100) / 100,
              last_booking_date: lastDate,
            },
          });
        } else {
          toCreate.push({
            name: data.name || 'Sem nome',
            email: data.email,
            phone: data.phone || '',
            total_bookings: total,
            total_spent: Math.round(totalSpent * 100) / 100,
            last_booking_date: lastDate,
          });
        }
      }

      // Bulk operations
      if (toCreate.length > 0) await base44.entities.Client.bulkCreate(toCreate);
      if (toUpdate.length > 0) await base44.entities.Client.bulkUpdate(toUpdate);
      return { created: toCreate.length, updated: toUpdate.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-clients'] });
      setSyncing(false);
    },
    onError: () => setSyncing(false),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }) => base44.entities.Client.update(id, { notes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-clients'] }),
  });

  const openClient = (client) => {
    setSelectedClient(client);
    setEditNotes(client.notes || '');
  };

  const saveNotes = () => {
    if (!selectedClient) return;
    updateNotesMutation.mutate({ id: selectedClient.id, notes: editNotes });
    setSelectedClient({ ...selectedClient, notes: editNotes });
  };

  // ── Client Detail View ──
  if (selectedClient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedClient(null)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar à lista
        </Button>

        {/* Client header + stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1 space-y-3">
                <h2 className="font-display text-2xl font-bold">{selectedClient.name}</h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-4 h-4" /> {selectedClient.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-4 h-4" /> {selectedClient.phone || '—'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:w-auto">
                <StatBox icon={Calendar} label="Total reservas" value={clientStats?.total ?? 0} color="text-primary" />
                <StatBox icon={TrendingUp} label="Concluídas" value={clientStats?.past ?? 0} color="text-green-600" />
                <StatBox icon={Calendar} label="Futuras" value={clientStats?.future ?? 0} color="text-blue-600" />
                <StatBox icon={Euro} label="Total gasto" value={`€${(clientStats?.totalSpent ?? 0).toFixed(0)}`} color="text-green-600" />
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6 space-y-2">
              <Label className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> Notas internas</Label>
              <Textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Adicionar notas sobre este cliente..."
                rows={3}
              />
              <Button size="sm" onClick={saveNotes} disabled={updateNotesMutation.isPending} className="gap-1.5">
                {updateNotesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Guardar notas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* All bookings for this client */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold text-lg mb-4">Histórico de reservas ({clientBookings.length})</h3>
            {clientBookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma reserva encontrada para este cliente.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref.</TableHead>
                      <TableHead>Rota</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientBookings.map(b => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs font-bold text-primary">{b.booking_ref}</TableCell>
                        <TableCell className="text-xs max-w-[180px]">
                          <span className="leading-tight">{b.origin} → {b.destination}</span>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {b.transfer_date && format(new Date(b.transfer_date + 'T00:00:00'), "d MMM yyyy", { locale: pt })}
                          <br /><span className="text-muted-foreground text-xs">{b.transfer_time}</span>
                        </TableCell>
                        <TableCell className="text-xs">{vehicleLabel[b.vehicle_type] || b.vehicle_type}</TableCell>
                        <TableCell className="font-bold text-primary">€{b.price?.toFixed(0)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConfig[b.status]?.color}>
                            {statusConfig[b.status]?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={paymentConfig[b.payment_status]?.color}>
                            {paymentConfig[b.payment_status]?.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Client List View ──
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cliente por nome, email ou telefone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncing || bookings.length === 0}
              className="gap-2"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar reservas
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filteredClients.length} cliente(s) na base de dados · Clique em "Sincronizar" para criar/atualizar clientes a partir das reservas.
          </p>
        </CardContent>
      </Card>

      {loadingClients ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum cliente encontrado. Clique em "Sincronizar reservas" para importar.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-center">Reservas</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                  <TableHead>Última reserva</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(c => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openClient(c)}
                  >
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.phone || '—'}</TableCell>
                    <TableCell className="text-center font-bold">{c.total_bookings ?? 0}</TableCell>
                    <TableCell className="text-right font-bold text-primary">€{(c.total_spent ?? 0).toFixed(0)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {c.last_booking_date ? format(new Date(c.last_booking_date + 'T00:00:00'), "d MMM yyyy", { locale: pt }) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        Ver perfil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 text-center min-w-[100px]">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}