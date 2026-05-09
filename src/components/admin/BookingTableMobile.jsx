import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Euro, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const statusConfig = {
  pending:     { label: "Pendente",   color: "bg-yellow-100 text-yellow-800" },
  confirmed:   { label: "Confirmada", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "Em curso",   color: "bg-orange-100 text-orange-800" },
  completed:   { label: "Concluída",  color: "bg-green-100 text-green-800" },
  cancelled:   { label: "Cancelada",  color: "bg-red-100 text-red-800" },
};

const paymentConfig = {
  unpaid:   { label: "Não pago",    color: "bg-orange-100 text-orange-800" },
  paid:     { label: "Pago",        color: "bg-green-100 text-green-800" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
};

export default function BookingTableMobile({ bookings, drivers, unavailabilities, onStatusChange, onAssignDriver }) {
  const isDriverAvailable = (driverId, transferDate) => {
    if (!transferDate) return true;
    return !unavailabilities.some(u =>
      u.driver_id === driverId &&
      transferDate >= u.date_from &&
      transferDate <= u.date_to
    );
  };

  return (
    <div className="space-y-3">
      {bookings.map(booking => (
        <Card key={booking.id} className="overflow-hidden">
          <CardContent className="p-4 space-y-3">
            {/* Header: Ref + Status */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono text-primary font-bold">{booking.booking_ref}</p>
                <p className="text-sm font-semibold text-foreground">{booking.customer_name}</p>
                <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
              </div>
              <Badge variant="outline" className={statusConfig[booking.status]?.color}>
                {statusConfig[booking.status]?.label}
              </Badge>
            </div>

            {/* Route */}
            <div className="flex items-start gap-2 text-sm bg-muted/40 p-2 rounded-lg">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">{booking.origin} → {booking.destination}</p>
                <p className="text-muted-foreground">{booking.distance_km} km</p>
              </div>
            </div>

            {/* Date + Price */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Data</p>
                  <p className="font-semibold">
                    {booking.transfer_date && format(new Date(booking.transfer_date + 'T00:00:00'), "d MMM", { locale: pt })}
                    {booking.transfer_time && <span className="ml-1">{booking.transfer_time}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="w-3.5 h-3.5 text-primary" />
                <div>
                  <p className="text-muted-foreground">Preço</p>
                  <p className="font-bold text-primary">€{booking.price?.toFixed(0)}</p>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <Badge variant="outline" className={paymentConfig[booking.payment_status]?.color}>
              {paymentConfig[booking.payment_status]?.label}
            </Badge>

            {/* Driver Assignment */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Motorista</label>
              <Select
                value={booking.driver_id || 'none'}
                onValueChange={val => onAssignDriver(booking, val === 'none' ? null : val)}
              >
                <SelectTrigger className="h-8 text-xs">
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
            </div>

            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Alterar Estado</label>
              <Select
                value={booking.status}
                onValueChange={val => onStatusChange(booking.id, val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="in_progress">Em curso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}