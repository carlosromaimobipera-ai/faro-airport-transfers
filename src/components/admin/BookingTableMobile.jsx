import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Euro, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import MobileSelectDrawer from './MobileSelectDrawer';

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

export default function BookingTableMobile({ bookings, drivers, unavailabilities, onStatusChange, onAssignDriver, onViewDetails }) {
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
              <div className="flex flex-col items-end gap-1.5">
                <Badge variant="outline" className={statusConfig[booking.status]?.color}>
                  {statusConfig[booking.status]?.label}
                </Badge>
                {onViewDetails && (
                  <button
                    onClick={() => onViewDetails(booking)}
                    className="text-xs text-primary font-medium flex items-center gap-1 hover:underline min-h-0"
                  >
                    <FileText className="w-3.5 h-3.5" /> Ver detalhes
                  </button>
                )}
              </div>
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
              <MobileSelectDrawer
                value={booking.driver_id || 'none'}
                onSelect={val => onAssignDriver(booking, val === 'none' ? null : val)}
                options={[
                  { value: 'none', label: '— Sem motorista —' },
                  ...drivers
                    .filter(d => d.active)
                    .map(d => {
                      const available = isDriverAvailable(d.id, booking.transfer_date);
                      return {
                        value: d.id,
                        label: `${d.name}${!available ? ' (indisponível)' : ''}`,
                        disabled: !available,
                      };
                    }),
                ]}
                trigger={<div className="hidden" />}
              />
            </div>

            {/* Admin notes */}
            {booking.admin_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                <p className="font-semibold mb-0.5">Nota interna</p>
                {booking.admin_notes}
              </div>
            )}

            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Alterar Estado</label>
              <MobileSelectDrawer
                value={booking.status}
                onSelect={val => onStatusChange(booking.id, val)}
                options={[
                  { value: 'pending', label: 'Pendente' },
                  { value: 'confirmed', label: 'Confirmada' },
                  { value: 'in_progress', label: 'Em curso' },
                  { value: 'completed', label: 'Concluída' },
                  { value: 'cancelled', label: 'Cancelada' },
                ]}
                trigger={<div className="hidden" />}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}