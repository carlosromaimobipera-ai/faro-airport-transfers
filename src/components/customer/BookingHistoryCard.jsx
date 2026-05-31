import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import {
  ArrowRight, ChevronDown, ChevronUp, Download,
  MapPin, Users, Package, Plane, Clock, Car, CreditCard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const statusConfig = {
  pending:     { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500' },
  confirmed:   { label: 'Confirmada',  color: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-500' },
  in_progress: { label: 'Em curso',    color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500 animate-pulse' },
  completed:   { label: 'Concluída',   color: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500' },
  cancelled:   { label: 'Cancelada',   color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-400' },
};

const vehicleLabel = { sedan: 'Sedan', minivan: 'Minivan', minibus: 'Minibus' };

export default function BookingHistoryCard({ booking }) {
  const [expanded, setExpanded] = useState(false);
  const st = statusConfig[booking.status] || statusConfig.pending;
  const isUpcoming = booking.transfer_date >= new Date().toISOString().slice(0, 10)
    && booking.status !== 'cancelled'
    && booking.status !== 'completed';

  return (
    <Card className={`transition-all border-l-4 ${
      booking.status === 'in_progress' ? 'border-l-orange-500 shadow-orange-100 shadow-md' :
      booking.status === 'completed'   ? 'border-l-green-500' :
      booking.status === 'cancelled'   ? 'border-l-red-400 opacity-60' :
      'border-l-primary'
    }`}>
      <CardContent className="p-0">
        <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono text-xs font-bold text-primary">{booking.booking_ref}</span>
                <Badge variant="outline" className={`text-xs ${st.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />
                  {st.label}
                </Badge>
                {isUpcoming && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    Próxima
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-1">
                <span className="truncate max-w-[140px]">{booking.origin}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[140px]">{booking.destination}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {booking.transfer_date && format(parseISO(booking.transfer_date), "d MMM yyyy", { locale: pt })}
                  {booking.transfer_time && ` · ${booking.transfer_time}`}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <span className="text-lg font-bold text-primary">€{Number(booking.price || 0).toFixed(2)}</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-3">
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Car className="w-3.5 h-3.5" />
                <span>{vehicleLabel[booking.vehicle_type] || booking.vehicle_type}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{booking.passengers} pax · {booking.luggage} mala(s)</span>
              </div>
              {booking.flight_number && (
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Voo {booking.flight_number}</span>
                </div>
              )}
              <div className="flex items-center gap-2 col-span-2">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <Badge variant="outline" className={booking.payment_status === 'paid'
                  ? 'text-xs bg-green-100 text-green-700 border-green-200'
                  : 'text-xs bg-orange-100 text-orange-700 border-orange-200'
                }>
                  {booking.payment_status === 'paid' ? '✓ Pago (PayPal)' : '💵 A pagar em dinheiro'}
                </Badge>
              </div>
              {booking.notes && (
                <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-800">
                  <strong>Nota:</strong> {booking.notes}
                </div>
              )}
            </div>

            {/* In-progress status highlight */}
            {booking.status === 'in_progress' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2 text-sm font-medium text-orange-800">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                A sua viagem está em curso neste momento
              </div>
            )}

            {/* PDF Download */}
            {booking.status !== 'cancelled' && (
              <InvoiceDownloadButton bookingId={booking.id} bookingRef={booking.booking_ref} customerEmail={booking.customer_email} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InvoiceDownloadButton({ bookingId, bookingRef, customerEmail }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const { appId, token, appBaseUrl } = appParams;
      const baseUrl = appBaseUrl || 'https://api.base44.com';

      const res = await fetch(
        `${baseUrl}/api/apps/${appId}/functions/generateInvoicePdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ booking_id: bookingId, customer_email: customerEmail }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error('PDF error:', errText);
        setError('Erro ao gerar PDF. Tente novamente.');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${bookingRef}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF download error:', e);
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? (
          <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {loading ? 'A gerar PDF...' : 'Download Voucher (PDF)'}
      </Button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}