import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Route, Loader2, CheckCircle2, XCircle, Plus, Trash2, MapPin } from 'lucide-react';
import SimpleAddressPicker from '@/components/booking/SimpleAddressPicker';
import VehicleSelect from '@/components/driver/VehicleSelect';
import ServiceCustomerFields from '@/components/driver/ServiceCustomerFields';
import { calculatePrice, generateBookingRef } from '@/lib/transferData';
import { STOP_HOURLY_RATE, stopsPrice, dayTripPrice } from '@/lib/extraServices';
import { useRouteDistance } from '@/hooks/useRouteDistance';

const emptyForm = {
  transfer_date: '',
  transfer_time: '',
  vehicle_type: 'sedan',
  origin_place: null,
  destination_place: null,
  stops: [{ name: '', hours: 1 }],
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  notes: '',
};

export default function DayTripTab({ driver }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateStop = (index, field, value) => setForm(prev => ({
    ...prev,
    stops: prev.stops.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
  }));
  const addStop = () => setForm(prev => ({ ...prev, stops: [...prev.stops, { name: '', hours: 1 }] }));
  const removeStop = (index) => setForm(prev => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }));

  const { distance, isLoadingDistance } = useRouteDistance(form.origin_place?.coords, form.destination_place?.coords);
  const transferPrice = distance ? calculatePrice(distance, form.vehicle_type, [], 0, false) : 0;
  const stopsTotal = stopsPrice(form.stops);
  const total = dayTripPrice(transferPrice, form.stops);

  const canSubmit = !!form.transfer_date && !!form.transfer_time && !!distance &&
    !!form.origin_place?.coords && !!form.destination_place?.coords && !!form.customer_name && !!form.customer_email;

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      const stopsLabel = form.stops
        .filter(s => s.name || parseFloat(s.hours) > 0)
        .map(s => `${s.name || 'Paragem'} (${parseFloat(s.hours) || 0}h)`)
        .join(', ');

      const booking = await base44.entities.Booking.create({
        booking_ref: generateBookingRef(),
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        origin: form.origin_place.address,
        destination: form.destination_place.address,
        origin_coords: form.origin_place.coords,
        destination_coords: form.destination_place.coords,
        vehicle_type: form.vehicle_type,
        distance_km: distance || 0,
        trip_type: 'one_way',
        transfer_date: form.transfer_date,
        transfer_time: form.transfer_time,
        passengers: 1,
        luggage: 1,
        price: total,
        extras: [],
        extras_price: 0,
        status: 'confirmed',
        payment_status: 'unpaid',
        driver_id: driver.id,
        driver_name: driver.name,
        driver_email: driver.email,
        language: 'pt',
        notes: [
          `Transfer + day trip — ${distance} km`,
          stopsLabel ? `Paragens: ${stopsLabel} (${STOP_HOURLY_RATE}€/hora por paragem)` : null,
          `Transfer ${transferPrice}€ + paragens ${stopsTotal}€`,
          form.notes,
        ].filter(Boolean).join(' · '),
      });
      setCreated({ ref: booking.booking_ref, price: total });
      setForm(emptyForm);
    } catch (err) {
      setError(err?.message || 'Erro ao criar o serviço.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Route className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Transfer + day trip</p>
            <p className="text-xs text-muted-foreground">
              Tarifa de transfer (por km e veículo) + {STOP_HOURLY_RATE} €/hora por paragem
            </p>
          </div>
        </CardContent>
      </Card>

      {created && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="p-3 flex items-center gap-2 text-sm text-green-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Reserva {created.ref} criada · {created.price} €
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data *</Label>
              <Input type="date" value={form.transfer_date} onChange={e => update('transfer_date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hora de início *</Label>
              <Input type="time" value={form.transfer_time} onChange={e => update('transfer_time', e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">Veículo</Label>
              <VehicleSelect value={form.vehicle_type} onChange={v => update('vehicle_type', v)} />
            </div>
          </div>

          <SimpleAddressPicker
            label="Recolha *"
            value={form.origin_place}
            onChange={v => update('origin_place', v)}
          />
          <SimpleAddressPicker
            label="Destino final *"
            value={form.destination_place}
            onChange={v => update('destination_place', v)}
          />

          {isLoadingDistance && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> A calcular distância...
            </p>
          )}
          {distance > 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> {distance} km
            </p>
          )}

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Paragens ({STOP_HOURLY_RATE} €/hora cada)</Label>
              <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={addStop}>
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </Button>
            </div>
            {form.stops.map((stop, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={stop.name}
                  onChange={e => updateStop(i, 'name', e.target.value)}
                  placeholder={`Paragem ${i + 1}`}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={stop.hours}
                  onChange={e => updateStop(i, 'hours', e.target.value)}
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">h</span>
                {form.stops.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStop(i)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceCustomerFields form={form} update={update} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Programa do dia, preferências do cliente..." />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Transfer{distance ? ` (${distance} km)` : ''}</span>
              <span>{transferPrice} €</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Paragens</span>
              <span>{stopsTotal} €</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">{total} €</span>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />}
            Criar reserva
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}