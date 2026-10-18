import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Timer, Loader2, CheckCircle2, XCircle, MapPin } from 'lucide-react';
import SimpleAddressPicker from '@/components/booking/SimpleAddressPicker';
import VehicleSelect from '@/components/driver/VehicleSelect';
import ServiceCustomerFields from '@/components/driver/ServiceCustomerFields';
import { generateBookingRef } from '@/lib/transferData';
import { HOURLY_RATE, HOURLY_INCLUDED_KM, hourlyPrice } from '@/lib/extraServices';
import { useRouteDistance } from '@/hooks/useRouteDistance';

const emptyForm = {
  transfer_date: '',
  transfer_time: '',
  hours: 2,
  origin_place: null,
  destination_place: null,
  vehicle_type: 'sedan',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  notes: '',
};

export default function HourlyChauffeurTab({ driver }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const hours = parseFloat(form.hours) || 0;
  const price = hourlyPrice(hours);
  const includedKm = Math.round(hours * HOURLY_INCLUDED_KM);
  const { distance, isLoadingDistance } = useRouteDistance(form.origin_place?.coords, form.destination_place?.coords);
  const exceedsIncluded = !!distance && hours > 0 && distance > includedKm;

  const canSubmit = !!form.transfer_date && !!form.transfer_time && hours > 0 &&
    !!form.origin_place?.coords && !!form.customer_name && !!form.customer_email;

  const handleSubmit = async () => {
    setError('');
    setSaving(true);
    try {
      const booking = await base44.entities.Booking.create({
        booking_ref: generateBookingRef(),
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        origin: form.origin_place.address,
        destination: form.destination_place?.address || `Chauffeur à disposição — ${hours}h`,
        origin_coords: form.origin_place.coords,
        destination_coords: form.destination_place?.coords || form.origin_place.coords,
        vehicle_type: form.vehicle_type,
        distance_km: distance || 0,
        trip_type: 'one_way',
        transfer_date: form.transfer_date,
        transfer_time: form.transfer_time,
        passengers: 1,
        luggage: 1,
        price,
        extras: [],
        extras_price: 0,
        status: 'confirmed',
        payment_status: 'unpaid',
        driver_id: driver.id,
        driver_name: driver.name,
        driver_email: driver.email,
        language: 'pt',
        notes: [
          `Chauffeur por hora — ${hours}h × ${HOURLY_RATE}€/hora (até ${HOURLY_INCLUDED_KM} km por hora incluídos)`,
          form.notes,
        ].filter(Boolean).join(' · '),
      });
      setCreated({ ref: booking.booking_ref, price });
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
            <Timer className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Chauffeur por hora</p>
            <p className="text-xs text-muted-foreground">
              {HOURLY_RATE} €/hora · até {HOURLY_INCLUDED_KM} km por hora incluídos
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
            <div className="space-y-1.5">
              <Label className="text-xs">Horas *</Label>
              <Input type="number" min="1" step="0.5" value={form.hours} onChange={e => update('hours', e.target.value)} />
            </div>
            <div className="space-y-1.5">
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
            label="Destino final (opcional)"
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
              <MapPin className="w-3.5 h-3.5" /> {distance} km · incluídos {includedKm} km
            </p>
          )}
          {exceedsIncluded && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
              A rota excede os {includedKm} km incluídos ({HOURLY_INCLUDED_KM} km por hora). Ajuste as horas ou combine o valor extra com o cliente.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ServiceCustomerFields form={form} update={update} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notas</Label>
            <Textarea rows={2} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Pedidos do cliente, paragens combinadas..." />
          </div>

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs text-muted-foreground">{hours}h × {HOURLY_RATE}€</span>
            <span className="text-2xl font-bold text-primary">{price} €</span>
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit || saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Timer className="w-4 h-4" />}
            Criar reserva
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}