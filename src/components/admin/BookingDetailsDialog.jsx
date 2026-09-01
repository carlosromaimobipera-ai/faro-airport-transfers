import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, MapPin, Calendar, Clock, Car, Euro, Users, Luggage, Phone, Mail, User, Plane, StickyNote, FileText, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
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

const vehicleLabel = { sedan: 'Sedan', premium: 'Premium', minivan: 'Minivan', minibus: 'Minibus' };

function Field({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value}</p>
      </div>
    </div>
  );
}

export default function BookingDetailsDialog({ booking, open, onOpenChange, onPaymentChange }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleDownloadVoucher = async () => {
    setDownloading(true);
    setError('');
    try {
      const { appId, token } = appParams;
      const res = await fetch(
        `${window.location.origin}/api/apps/${appId}/functions/generateInvoicePdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ booking_id: booking.id }),
        }
      );
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${booking.booking_ref}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || 'Erro ao gerar voucher');
    } finally {
      setDownloading(false);
    }
  };

  const isCancelled = booking.status === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>Reserva {booking.booking_ref}</span>
            <Badge variant="outline" className={statusConfig[booking.status]?.color}>
              {statusConfig[booking.status]?.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer */}
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field icon={User} label="Nome" value={booking.customer_name} />
              <Field icon={Mail} label="Email" value={booking.customer_email} />
              <Field icon={Phone} label="Telefone" value={booking.customer_phone} />
              <Field icon={Users} label="Passageiros" value={booking.passengers ? `${booking.passengers} pax` : null} />
              <Field icon={Luggage} label="Bagagem" value={booking.luggage ? `${booking.luggage} mala(s)` : null} />
            </div>
          </div>

          <Separator />

          {/* Trip */}
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Viagem
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Field icon={Calendar} label="Data" value={booking.transfer_date && format(new Date(booking.transfer_date + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: pt })} />
              <Field icon={Clock} label="Hora de recolha" value={booking.transfer_time} />
              <Field icon={MapPin} label="Recolha" value={booking.origin} />
              <Field icon={MapPin} label="Entrega" value={booking.destination} />
              <Field icon={Car} label="Veículo" value={vehicleLabel[booking.vehicle_type] || booking.vehicle_type} />
              <Field icon={MapPin} label="Distância" value={booking.distance_km ? `${booking.distance_km} km` : null} />
              <Field icon={Plane} label="Voo" value={booking.flight_number} />
              {booking.trip_type === 'round_trip' && (
                <>
                  <Field icon={Calendar} label="Data de regresso" value={booking.return_date && format(new Date(booking.return_date + 'T00:00:00'), "d 'de' MMMM", { locale: pt })} />
                  <Field icon={Clock} label="Hora de regresso" value={booking.return_time} />
                  <Field icon={Plane} label="Voo de regresso" value={booking.return_flight_number} />
                </>
              )}
              <Field icon={Car} label="Tipo de viagem" value={booking.trip_type === 'round_trip' ? 'Ida e volta' : 'Só ida'} />
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5" /> Pagamento
            </h4>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Field icon={Euro} label="Total" value={`€${(booking.price || 0).toFixed(2)}`} />
                {booking.extras_price > 0 && (
                  <Field icon={FileText} label="Extras" value={`€${booking.extras_price.toFixed(2)}`} />
                )}
              </div>
              {onPaymentChange ? (
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="outline" className={paymentConfig[booking.payment_status]?.color}>
                    {paymentConfig[booking.payment_status]?.label}
                  </Badge>
                  <Select
                    value={booking.payment_status}
                    onValueChange={onPaymentChange}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Não pago</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <Badge variant="outline" className={paymentConfig[booking.payment_status]?.color}>
                  {paymentConfig[booking.payment_status]?.label}
                </Badge>
              )}
            </div>
          </div>

          {/* Driver */}
          {booking.driver_name && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Motorista
                </h4>
                <Field icon={User} label="Atribuído" value={booking.driver_name} />
              </div>
            </>
          )}

          {/* Notes */}
          {booking.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                  <StickyNote className="w-3.5 h-3.5" /> Notas do cliente
                </h4>
                <p className="text-sm bg-muted/40 rounded-lg p-3">{booking.notes}</p>
              </div>
            </>
          )}

          {/* Admin notes */}
          {booking.admin_notes && (
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" /> Notas internas
              </h4>
              <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">{booking.admin_notes}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <XCircle className="w-4 h-4" /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleDownloadVoucher}
              disabled={downloading}
              className="gap-2 bg-primary hover:bg-primary/90 flex-1"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> A gerar voucher...</>
              ) : (
                <><Download className="w-4 h-4" /> Descarregar Voucher PDF</>
              )}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="sm:w-auto">
              Fechar
            </Button>
          </div>
          {isCancelled && (
            <p className="text-xs text-muted-foreground text-center">
              Esta reserva está cancelada. O voucher ainda pode ser gerado para registo.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}