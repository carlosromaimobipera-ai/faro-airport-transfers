import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, User, Phone, Mail, Plane, Package, Users,
  CheckCircle2, ChevronDown, ChevronUp, ArrowRight,
  Navigation, PlayCircle, Map
} from 'lucide-react';
import RouteMapEmbed from './RouteMapEmbed';

const statusConfig = {
  pending:     { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed:   { label: 'Confirmada',  color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'Em curso',    color: 'bg-orange-100 text-orange-800 border-orange-200' },
  completed:   { label: 'Concluída',   color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:   { label: 'Cancelada',   color: 'bg-red-100 text-red-800 border-red-200' },
};

function mapsUrl(address, coords) {
  if (coords?.lat && coords?.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default function BookingCard({ booking, onUpdateStatus, showDate = false }) {
  const [expanded, setExpanded] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isCompleted = booking.status === 'completed';
  const isCancelled = booking.status === 'cancelled';
  const isInProgress = booking.status === 'in_progress';

  const borderColor = isCompleted
    ? 'border-l-green-500'
    : isInProgress
    ? 'border-l-orange-500'
    : isCancelled
    ? 'border-l-red-400'
    : 'border-l-primary';

  return (
    <Card className={`border-l-4 transition-all ${borderColor} ${(isCompleted || isCancelled) ? 'opacity-70' : ''}`}>
      <CardContent className="p-0">

        {/* Summary row */}
        <button className="w-full text-left p-4" onClick={() => setExpanded(e => !e)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-lg font-bold text-primary">{booking.transfer_time}</span>
                {showDate && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                    {booking.transfer_date}
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-mono">{booking.booking_ref}</span>
                <Badge variant="outline" className={`text-xs ${statusConfig[booking.status]?.color}`}>
                  {statusConfig[booking.status]?.label}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <span className="truncate max-w-[120px]">{booking.origin}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate max-w-[120px]">{booking.destination}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.passengers} pax</span>
                <span className="flex items-center gap-1"><Package className="w-3 h-3" />{booking.luggage} malas</span>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-base font-bold text-primary">€{booking.price?.toFixed(0)}</span>
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <>
            <Separator />
            <div className="p-4 space-y-4">

              {/* Passenger */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passageiro</p>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold">{booking.customer_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary shrink-0" />
                  <a href={`tel:${booking.customer_phone}`} className="text-primary font-medium underline underline-offset-2">
                    {booking.customer_phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>{booking.customer_email}</span>
                </div>
                {booking.flight_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Plane className="w-4 h-4 text-primary shrink-0" />
                    <span>Voo: <strong>{booking.flight_number}</strong></span>
                  </div>
                )}
              </div>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rota</p>
                  <button
                    onClick={() => setShowMap(m => !m)}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <Map className="w-3.5 h-3.5" />
                    {showMap ? 'Ocultar mapa' : 'Ver mapa'}
                  </button>
                </div>

                {showMap && (
                  <RouteMapEmbed
                    origin={booking.origin}
                    destination={booking.destination}
                    originCoords={booking.origin_coords}
                    destinationCoords={booking.destination_coords}
                  />
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2 text-sm min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Recolha</p>
                        <p className="font-medium text-sm leading-tight">{booking.origin}</p>
                      </div>
                    </div>
                    <a
                      href={mapsUrl(booking.origin, booking.origin_coords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Maps
                    </a>
                  </div>

                  <div className="w-0.5 h-3 bg-border" style={{ marginLeft: '14px' }} />

                  <div className="flex items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-start gap-2 text-sm min-w-0">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Entrega</p>
                        <p className="font-medium text-sm leading-tight">{booking.destination}</p>
                      </div>
                    </div>
                    <a
                      href={mapsUrl(booking.destination, booking.destination_coords)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="shrink-0 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Maps
                    </a>
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
                <Badge variant="outline" className={booking.payment_status === 'paid'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-orange-100 text-orange-700 border-orange-200'
                }>
                  {booking.payment_status === 'paid' ? '✓ Pago (PayPal)' : `💵 A cobrar €${booking.price?.toFixed(2)}`}
                </Badge>
              </div>

              {/* Full route navigation button */}
              {booking.origin_coords && booking.destination_coords && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${booking.origin_coords.lat},${booking.origin_coords.lng}&destination=${booking.destination_coords.lat},${booking.destination_coords.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-4 py-3 rounded-xl transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Navegar rota completa no Google Maps
                </a>
              )}

              {/* Action buttons */}
              {!isCompleted && !isCancelled && (
                <div className="flex gap-2 pt-1">
                  {!isInProgress && (
                    <Button
                      onClick={() => onUpdateStatus(booking.id, 'in_progress')}
                      variant="outline"
                      className="flex-1 gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Em curso
                    </Button>
                  )}
                  <Button
                    onClick={() => onUpdateStatus(booking.id, 'completed')}
                    className={`gap-2 bg-green-600 hover:bg-green-700 text-white ${!isInProgress ? 'flex-1' : 'w-full'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Concluída
                  </Button>
                </div>
              )}

              {isCompleted && (
                <div className="flex items-center justify-center gap-2 py-1.5 text-green-600 text-sm font-semibold">
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