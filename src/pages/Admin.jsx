import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Car, MapPin, Euro, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { vehicleTypes } from '@/lib/transferData';

const statusConfig = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  confirmed: { label: "Confirmada", color: "bg-blue-100 text-blue-800 border-blue-200" },
  completed: { label: "Concluída", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled: { label: "Cancelada", color: "bg-red-100 text-red-800 border-red-200" },
};

const paymentConfig = {
  unpaid: { label: "Não pago", color: "bg-orange-100 text-orange-800 border-orange-200" },
  paid: { label: "Pago", color: "bg-green-100 text-green-800 border-green-200" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800 border-gray-200" },
};

export default function Admin() {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Booking.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const filteredBookings = filterStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    revenue: bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.price || 0), 0),
    today: bookings.filter(b => b.transfer_date === format(new Date(), 'yyyy-MM-dd')).length,
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold">Gestão de Reservas</h1>
              <p className="text-sm text-muted-foreground">Painel de administração</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Reservas", value: stats.total, icon: Calendar, color: "text-primary" },
            { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-yellow-600" },
            { label: "Hoje", value: stats.today, icon: Car, color: "text-blue-600" },
            { label: "Receita (Pago)", value: `€${stats.revenue.toFixed(0)}`, icon: Euro, color: "text-green-600" },
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

        {/* Filter */}
        <div className="flex items-center gap-4 mb-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      Nenhuma reserva encontrada
                    </TableCell>
                  </TableRow>
                ) : filteredBookings.map(booking => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs font-bold">{booking.booking_ref}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{booking.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{booking.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{booking.origin} → {booking.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {booking.transfer_date && format(new Date(booking.transfer_date), "d MMM", { locale: pt })}
                      <span className="text-muted-foreground ml-1">{booking.transfer_time}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {vehicleTypes.find(v => v.id === booking.vehicle_type)?.name}
                    </TableCell>
                    <TableCell className="font-bold">€{booking.price?.toFixed(0)}</TableCell>
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
                      <div className="flex gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateMutation.mutate({ id: booking.id, data: { status: 'confirmed' } })}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateMutation.mutate({ id: booking.id, data: { status: 'cancelled' } })}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => updateMutation.mutate({ id: booking.id, data: { status: 'completed', payment_status: 'paid' } })}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}