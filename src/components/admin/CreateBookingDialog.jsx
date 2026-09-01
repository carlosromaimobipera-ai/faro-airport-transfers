import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Euro, Car, Users, Luggage, Plane, Calendar, Clock, User, Mail, Phone, MapPin, StickyNote } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SimpleAddressPicker from '@/components/booking/SimpleAddressPicker';
import { getEffectiveDistance, calculatePrice, generateBookingRef, vehicleTypes, isRouteAllowed } from '@/lib/transferData';

const vehicleLabel = { sedan: 'Sedan', premium: 'Premium', minivan: 'Minivan', minibus: 'Minibus' };

const emptyForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  origin_place: null,
  destination_place: null,
  trip_type: 'one_way',
  transfer_date: '',
  transfer_time: '',
  return_date: '',
  return_time: '',
  vehicle_type: 'sedan',
  passengers: 2,
  luggage: 2,
  flight_number: '',
  return_flight_number: '',
  notes: '',
  price: '',
  payment_status: 'unpaid',
  status: 'confirmed',
};

export default function CreateBookingDialog({ open, onOpenChange, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [distance, setDistance] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculate distance when both places are set
  useEffect(() => {
    if (form.origin_place?.coords && form.destination_place?.coords) {
      const d = getEffectiveDistance(form.origin_place.coords, form.destination_place.coords);
      setDistance(d);

      // Validate route
      if (!isRouteAllowed(form.origin_place.coords, form.destination_place.coords)) {
        setRouteError('Esta rota não é suportada (deve envolver o Algarve, ou Lisboa↔Sevilha).');
      } else {
        setRouteError('');
      }

      // Auto-calculate price if not manually set
      const autoPrice = calculatePrice(d, form.vehicle_type, [], 0, false, [], form.transfer_date);
      setForm(f => ({ ...f, price: f.price === '' || f.price === undefined ? autoPrice : f.price }));
    } else {
      setDistance(null);
      setRouteError('');
    }
  }, [form.origin_place, form.destination_place]);

  // Recalculate price when vehicle changes (only if price wasn't manually overridden)
  useEffect(() => {
    if (distance && form.vehicle_type) {
      const autoPrice = calculatePrice(distance, form.vehicle_type, [], 0, false, [], form.transfer_date);
      setForm(f => {
        // Only auto-update if the current price matches the previous auto-calc or is empty
        const prevAuto = calculatePrice(distance, f.vehicle_type === form.vehicle_type ? form.vehicle_type : 'sedan', [], 0, false, [], form.transfer_date);
        if (f.price === '' || f.price === prevAuto || f.price === undefined) {
          return { ...f, price: autoPrice };
        }
        return f;
      });
    }
  }, [form.vehicle_type, distance]);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      // Validation
      if (!form.customer_name || !form.customer_email) {
        setError('Nome e email do cliente são obrigatórios.');
        setSubmitting(false);
        return;
      }
      if (!form.origin_place?.coords || !form.destination_place?.coords) {
        setError('Selecione origem e destino válidos.');
        setSubmitting(false);
        return;
      }
      if (!form.transfer_date || !form.transfer_time) {
        setError('Data e hora da viagem são obrigatórios.');
        setSubmitting(false);
        return;
      }
      if (form.trip_type === 'round_trip' && (!form.return_date || !form.return_time)) {
        setError('Data e hora de regresso são obrigatórias para ida e volta.');
        setSubmitting(false);
        return;
      }
      if (routeError) {
        setError(routeError);
        setSubmitting(false);
        return;
      }

      const isRoundTrip = form.trip_type === 'round_trip';
      const outboundRef = generateBookingRef();
      const returnRef = isRoundTrip ? generateBookingRef() : null;
      const finalPrice = parseFloat(form.price) || 0;

      const commonFields = {
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        vehicle_type: form.vehicle_type,
        distance_km: distance,
        passengers: parseInt(form.passengers) || 1,
        luggage: parseInt(form.luggage) || 0,
        notes: form.notes,
        flight_number: form.flight_number || '',
        status: form.status,
        payment_status: form.payment_status,
        language: 'pt',
      };

      const outbound = await base44.entities.Booking.create({
        ...commonFields,
        booking_ref: outboundRef,
        origin: form.origin_place.address,
        destination: form.destination_place.address,
        origin_coords: form.origin_place.coords,
        destination_coords: form.destination_place.coords,
        transfer_date: form.transfer_date,
        transfer_time: form.transfer_time,
        trip_type: 'one_way',
        extras: [],
        extras_price: 0,
        price: finalPrice,
        linked_booking_ref: returnRef,
      });

      let returnBooking = null;
      if (isRoundTrip) {
        returnBooking = await base44.entities.Booking.create({
          ...commonFields,
          booking_ref: returnRef,
          origin: form.destination_place.address,
          destination: form.origin_place.address,
          origin_coords: form.destination_place.coords,
          destination_coords: form.origin_place.coords,
          transfer_date: form.return_date,
          transfer_time: form.return_time,
          flight_number: form.return_flight_number || '',
          trip_type: 'one_way',
          extras: [],
          extras_price: 0,
          price: finalPrice,
          linked_booking_ref: outboundRef,
        });
      }

      // Reset form
      setForm(emptyForm);
      setDistance(null);
      setRouteError('');
      onOpenChange(false);
      if (onCreated) onCreated(outbound, returnBooking);
    } catch (err) {
      setError(err?.message || 'Erro ao criar reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (open) => {
    if (!open) {
      setForm(emptyForm);
      setDistance(null);
      setRouteError('');
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Nova Reserva Manual
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Customer */}
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Cliente
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={form.customer_name} onChange={e => update('customer_name', e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Telefone</Label>
                <Input value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} placeholder="+351 ..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Passageiros</Label>
                <Input type="number" min="1" value={form.passengers} onChange={e => update('passengers', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Rota
            </h4>
            <SimpleAddressPicker
              label="Origem"
              value={form.origin_place}
              onChange={val => update('origin_place', val)}
            />
            <SimpleAddressPicker
              label="Destino"
              value={form.destination_place}
              onChange={val => update('destination_place', val)}
            />
            {distance && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Distância estimada: <span className="font-semibold text-foreground">{distance} km</span>
              </p>
            )}
            {routeError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {routeError}
              </p>
            )}
          </div>

          {/* Trip type */}
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de viagem</Label>
            <Select value={form.trip_type} onValueChange={val => update('trip_type', val)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one_way">Só ida</SelectItem>
                <SelectItem value="round_trip">Ida e volta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div>
            <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Data e Hora
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de ida *</Label>
                <Input type="date" value={form.transfer_date} onChange={e => update('transfer_date', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora de ida *</Label>
                <Input type="time" value={form.transfer_time} onChange={e => update('transfer_time', e.target.value)} />
              </div>
              {form.trip_type === 'round_trip' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de regresso *</Label>
                    <Input type="date" value={form.return_date} onChange={e => update('return_date', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hora de regresso *</Label>
                    <Input type="time" value={form.return_time} onChange={e => update('return_time', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vehicle & Flight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Veículo</Label>
              <Select value={form.vehicle_type} onValueChange={val => update('vehicle_type', val)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map(v => (
                    <SelectItem key={v.id} value={v.id}>{vehicleLabel[v.id] || v.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Voo (opcional)</Label>
              <Input value={form.flight_number} onChange={e => update('flight_number', e.target.value)} placeholder="Ex: TP1234" />
            </div>
            {form.trip_type === 'round_trip' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Voo de regresso (opcional)</Label>
                <Input value={form.return_flight_number} onChange={e => update('return_flight_number', e.target.value)} placeholder="Ex: TP1234" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Bagagem</Label>
              <Input type="number" min="0" value={form.luggage} onChange={e => update('luggage', e.target.value)} />
            </div>
          </div>

          {/* Price & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Euro className="w-3 h-3" /> Preço (€)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} placeholder="Auto" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={form.status} onValueChange={val => update('status', val)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="in_progress">Em curso</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Pagamento</Label>
              <Select value={form.payment_status} onValueChange={val => update('payment_status', val)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Não pago</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notas do cliente</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Pedidos especiais..." rows={2} />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> A criar...</>
            ) : (
              <><Plus className="w-4 h-4" /> Criar Reserva</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}