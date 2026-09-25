import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Download, Loader2, MapPin, Calendar, Clock, Car, Euro, Users, Luggage, Phone, Mail, User, Plane, StickyNote, FileText, CheckCircle2, XCircle, CreditCard, Pencil, Save, X, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import SimpleAddressPicker from '@/components/booking/SimpleAddressPicker';
import { vehicleTypes } from '@/lib/transferData';

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

export default function BookingDetailsDialog({ booking, open, onOpenChange, onPaymentChange, onUpdate }) {
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize edit form when booking changes
  useEffect(() => {
    if (booking) {
      setEditForm({
        customer_name: booking.customer_name || '',
        customer_email: booking.customer_email || '',
        customer_phone: booking.customer_phone || '',
        origin_place: booking.origin_coords ? { address: booking.origin, coords: booking.origin_coords } : null,
        destination_place: booking.destination_coords ? { address: booking.destination, coords: booking.destination_coords } : null,
        transfer_date: booking.transfer_date || '',
        transfer_time: booking.transfer_time || '',
        return_date: booking.return_date || '',
        return_time: booking.return_time || '',
        vehicle_type: booking.vehicle_type || 'sedan',
        passengers: booking.passengers || 1,
        luggage: booking.luggage || 0,
        flight_number: booking.flight_number || '',
        return_flight_number: booking.return_flight_number || '',
        notes: booking.notes || '',
        admin_notes: booking.admin_notes || '',
        price: booking.price || 0,
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'unpaid',
      });
      setEditMode(false);
      setError('');
    }
  }, [booking?.id]);

  if (!booking) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data = {
        customer_name: editForm.customer_name,
        customer_email: editForm.customer_email,
        customer_phone: editForm.customer_phone,
        origin: editForm.origin_place?.address || booking.origin,
        destination: editForm.destination_place?.address || booking.destination,
        origin_coords: editForm.origin_place?.coords || booking.origin_coords,
        destination_coords: editForm.destination_place?.coords || booking.destination_coords,
        transfer_date: editForm.transfer_date,
        transfer_time: editForm.transfer_time,
        return_date: editForm.return_date || null,
        return_time: editForm.return_time || null,
        vehicle_type: editForm.vehicle_type,
        passengers: parseInt(editForm.passengers) || 1,
        luggage: parseInt(editForm.luggage) || 0,
        flight_number: editForm.flight_number,
        return_flight_number: editForm.return_flight_number,
        notes: editForm.notes,
        admin_notes: editForm.admin_notes,
        price: parseFloat(editForm.price) || 0,
        status: editForm.status,
        payment_status: editForm.payment_status,
      };
      if (onUpdate) {
        await onUpdate(data);
      }
      setEditMode(false);
    } catch (err) {
      setError(err?.message || 'Erro ao guardar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => setEditForm(f => ({ ...f, [field]: value }));

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

  const handleSendVoucher = async () => {
    setSending(true);
    setSendSuccess(false);
    setError('');
    try {
      const { appId, token } = appParams;
      const res = await fetch(
        `${window.location.origin}/api/apps/${appId}/functions/sendVoucherToClient`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ booking_id: booking.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    } catch (err) {
      setError(err?.message || 'Erro ao enviar voucher');
    } finally {
      setSending(false);
    }
  };

  const isCancelled = booking.status === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>Reserva {booking.booking_ref}</span>
            <div className="flex items-center gap-2">
              {!editMode && onUpdate && (
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setEditMode(true)}>
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </Button>
              )}
              <Badge variant="outline" className={statusConfig[booking.status]?.color}>
                {statusConfig[booking.status]?.label}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        {editMode ? (
          <div className="space-y-4">
            {/* Editable Customer */}
            <div>
              <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={editForm.customer_name} onChange={e => updateField('customer_name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editForm.customer_email} onChange={e => updateField('customer_email', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={editForm.customer_phone} onChange={e => updateField('customer_phone', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Passageiros</Label>
                  <Input type="number" min="1" value={editForm.passengers} onChange={e => updateField('passengers', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bagagem</Label>
                  <Input type="number" min="0" value={editForm.luggage} onChange={e => updateField('luggage', e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Editable Trip */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Viagem
              </h4>
              <SimpleAddressPicker
                label="Recolha"
                value={editForm.origin_place}
                onChange={val => updateField('origin_place', val)}
              />
              <SimpleAddressPicker
                label="Entrega"
                value={editForm.destination_place}
                onChange={val => updateField('destination_place', val)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={editForm.transfer_date} onChange={e => updateField('transfer_date', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hora de recolha</Label>
                  <Input type="time" value={editForm.transfer_time} onChange={e => updateField('transfer_time', e.target.value)} />
                </div>
                {booking.trip_type === 'round_trip' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Data de regresso</Label>
                      <Input type="date" value={editForm.return_date} onChange={e => updateField('return_date', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hora de regresso</Label>
                      <Input type="time" value={editForm.return_time} onChange={e => updateField('return_time', e.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Veículo</Label>
                  <Select value={editForm.vehicle_type} onValueChange={val => updateField('vehicle_type', val)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map(v => (
                        <SelectItem key={v.id} value={v.id}>{vehicleLabel[v.id] || v.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Voo</Label>
                  <Input value={editForm.flight_number} onChange={e => updateField('flight_number', e.target.value)} />
                </div>
                {booking.trip_type === 'round_trip' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Voo de regresso</Label>
                    <Input value={editForm.return_flight_number} onChange={e => updateField('return_flight_number', e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Editable Price & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1"><Euro className="w-3 h-3" /> Preço (€)</Label>
                <Input type="number" step="0.01" value={editForm.price} onChange={e => updateField('price', e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={editForm.status} onValueChange={val => updateField('status', val)}>
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
              <div className="space-y-1">
                <Label className="text-xs">Pagamento</Label>
                <Select value={editForm.payment_status} onValueChange={val => updateField('payment_status', val)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Não pago</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Editable Notes */}
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notas do cliente</Label>
              <Textarea value={editForm.notes} onChange={e => updateField('notes', e.target.value)} rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notas internas (admin)</Label>
              <Textarea value={editForm.admin_notes} onChange={e => updateField('admin_notes', e.target.value)} rows={2} />
            </div>

            {error && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> {error}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> A guardar...</> : <><Save className="w-4 h-4" /> Guardar</>}
              </Button>
              <Button variant="outline" onClick={() => { setEditMode(false); setError(''); }} disabled={saving} className="gap-2">
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </div>
        ) : (
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
              disabled={downloading || sending}
              className="gap-2 bg-primary hover:bg-primary/90 flex-1"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> A gerar voucher...</>
              ) : (
                <><Download className="w-4 h-4" /> Descarregar Voucher PDF</>
              )}
            </Button>
            <Button
              onClick={handleSendVoucher}
              disabled={downloading || sending || !booking.customer_email}
              variant="outline"
              className="gap-2 flex-1 border-primary/30 text-primary hover:bg-primary/10"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> A enviar...</>
              ) : sendSuccess ? (
                <><CheckCircle2 className="w-4 h-4 text-green-600" /> Voucher enviado!</>
              ) : (
                <><Send className="w-4 h-4" /> Enviar Voucher ao Cliente</>
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
        )}
      </DialogContent>
    </Dialog>
  );
}