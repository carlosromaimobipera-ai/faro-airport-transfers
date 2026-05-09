import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, MapPin, CircleDot, Calendar, User, Gift } from 'lucide-react';
import ExtrasSelector from './ExtrasSelector';
import LocationSelector from './LocationSelector';
import AddressPickerWithMap from './AddressPickerWithMap';
import VehicleCard from './VehicleCard';
import RouteMap from './RouteMap';
import RouteInfoBadge from './RouteInfoBadge';
import { locations, vehicleTypes, getDistance, calculatePrice, generateBookingRef, getAllowedDestinations, getEffectiveDistance, BOOKING_EXTRAS, calculateExtrasTotal } from '@/lib/transferData';
import { useQuery } from '@tanstack/react-query';

const HAS_PLACES_KEY = !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PayPalButton from './PayPalButton';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function BookingForm() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'paypal' | 'cash'

  const { data: priceConfigs = [] } = useQuery({
    queryKey: ['price-configs'],
    queryFn: () => base44.entities.PriceConfig.list('key', 500),
  });

  const [form, setForm] = useState({
    origin: '', destination: '', vehicle_type: '',
    origin_place: null, destination_place: null,
    transfer_date: '', transfer_time: '', flight_number: '',
    passengers: 1, luggage: 1,
    customer_name: '', customer_email: '', customer_phone: '', notes: '',
    extras: [],
  });

  const [distanceData, setDistanceData] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  // Fetch distance matrix when coordinates change
  useEffect(() => {
    const fetchDistanceMatrix = async () => {
      if (!form.origin_place?.coords || !form.destination_place?.coords) {
        setDistanceData(null);
        return;
      }

      setIsLoadingDistance(true);
      try {
        const res = await base44.functions.invoke('calculateDistance', {
          origin_lat: form.origin_place.coords.lat,
          origin_lng: form.origin_place.coords.lng,
          destination_lat: form.destination_place.coords.lat,
          destination_lng: form.destination_place.coords.lng,
        });
        setDistanceData(res.data);
      } catch (err) {
        console.error('Distance calculation error:', err);
        setDistanceData(null);
      } finally {
        setIsLoadingDistance(false);
      }
    };

    fetchDistanceMatrix();
  }, [form.origin_place?.coords, form.destination_place?.coords]);

  const distance = distanceData?.distance_km || (HAS_PLACES_KEY && form.origin_place && form.destination_place 
    ? getEffectiveDistance(form.origin_place.coords, form.destination_place.coords)
    : null);
  const basePrice = useMemo(() => calculatePrice(distance, form.vehicle_type, priceConfigs), [distance, form.vehicle_type, priceConfigs]);
  const extrasTotal = useMemo(() => calculateExtrasTotal(form.extras), [form.extras]);
  const price = useMemo(() => Math.round((basePrice + extrasTotal) * 100) / 100, [basePrice, extrasTotal]);
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.origin_place && form.destination_place && distance;
      case 2: return form.vehicle_type;
      case 3: return true; // extras are optional
      case 4: {
        if (!form.transfer_date || !form.transfer_time) return false;
        const bookingDateTime = new Date(`${form.transfer_date}T${form.transfer_time}`);
        const minAllowed = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return bookingDateTime >= minAllowed;
      }
      case 5: return form.customer_name && form.customer_email && form.customer_phone;
      default: return false;
    }
  };

  const handleCashBooking = async () => {
    setIsSubmitting(true);
    setPaymentError('');
    const originName = form.origin_place?.address;
    const destName = form.destination_place?.address;
    const originCoords = form.origin_place?.coords;
    const destCoords = form.destination_place?.coords;
    const bookingRef = generateBookingRef();
    const booking = await base44.entities.Booking.create({
      booking_ref: bookingRef,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      origin: originName,
      destination: destName,
      origin_coords: originCoords,
      destination_coords: destCoords,
      vehicle_type: form.vehicle_type,
      distance_km: distance,
      price: price,
      extras: form.extras,
      extras_price: extrasTotal,
      transfer_date: form.transfer_date,
      transfer_time: form.transfer_time,
      flight_number: form.flight_number,
      passengers: form.passengers,
      luggage: form.luggage,
      notes: form.notes,
      status: 'pending',
      payment_status: 'unpaid',
    });
    navigate(`/confirmacao?id=${booking.id}`);
  };

  const handlePaymentSuccess = async () => {
    setIsSubmitting(true);
    setPaymentError('');
    const originName = form.origin_place?.address;
    const destName = form.destination_place?.address;
    const originCoords = form.origin_place?.coords;
    const destCoords = form.destination_place?.coords;
    const bookingRef = generateBookingRef();
    const booking = await base44.entities.Booking.create({
      booking_ref: bookingRef,
      customer_name: form.customer_name,
      customer_email: form.customer_email,
      customer_phone: form.customer_phone,
      origin: originName,
      destination: destName,
      origin_coords: originCoords,
      destination_coords: destCoords,
      vehicle_type: form.vehicle_type,
      distance_km: distance,
      price: price,
      extras: form.extras,
      extras_price: extrasTotal,
      transfer_date: form.transfer_date,
      transfer_time: form.transfer_time,
      flight_number: form.flight_number,
      passengers: form.passengers,
      luggage: form.luggage,
      notes: form.notes,
      status: 'pending',
      payment_status: 'paid',
    });
    navigate(`/confirmacao?id=${booking.id}`);
  };

  const steps = [
    { id: 1, label: 'Rota',      icon: MapPin },
    { id: 2, label: 'Veículo',   icon: CircleDot },
    { id: 3, label: 'Extras',    icon: Gift },
    { id: 4, label: 'Detalhes',  icon: Calendar },
    { id: 5, label: 'Dados',     icon: User },
  ];

  return (
    <section id="booking" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-20">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                step === s.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : step > s.id
                  ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-xl shadow-black/5 border-border/40">
        <CardContent className="p-6 md:p-8">
          <AnimatePresence mode="wait">

            {/* Step 1: Route */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-1">{t(lang, 'step1_title')}</h2>
                  <p className="text-muted-foreground text-sm">{t(lang, 'step1_sub')}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <AddressPickerWithMap
                    label={t(lang, 'origin')}
                    value={form.origin_place}
                    onChange={(place) => setForm(prev => ({ ...prev, origin_place: place, destination_place: null }))}
                    placeholder="Procurar morada, hotel ou clicar no mapa..."
                  />
                  <AddressPickerWithMap
                    label={t(lang, 'destination')}
                    value={form.destination_place}
                    onChange={(place) => setForm(prev => ({ ...prev, destination_place: place }))}
                    placeholder="Procurar morada, hotel ou clicar no mapa..."
                  />
                </div>
                {distance && (
                  <>
                    <RouteInfoBadge 
                      origin={form.origin_place?.address}
                      destination={form.destination_place?.address}
                      distance={distance}
                      price={basePrice}
                      duration_minutes={distanceData?.duration_minutes}
                      isLoading={isLoadingDistance}
                    />
                    <RouteMap 
                      originCoords={form.origin_place?.coords}
                      destinationCoords={form.destination_place?.coords}
                    />
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Vehicle */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-1">{t(lang, 'step2_title')}</h2>
                  <p className="text-muted-foreground text-sm">{t(lang, 'step2_sub')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {vehicleTypes.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      selected={form.vehicle_type === vehicle.id}
                      onSelect={(id) => updateForm('vehicle_type', id)}
                      price={calculatePrice(distance, vehicle.id, priceConfigs)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Extras */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-1">Extras opcionais</h2>
                  <p className="text-muted-foreground text-sm">Selecione serviços adicionais para a sua viagem (opcional)</p>
                </div>
                <ExtrasSelector
                  selected={form.extras}
                  onChange={(extras) => updateForm('extras', extras)}
                />
                {form.extras.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-green-700">{form.extras.length} extra(s) selecionado(s)</span>
                    <span className="font-bold text-green-600">Grátis</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Details */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-1">{t(lang, 'step3_title')}</h2>
                  <p className="text-muted-foreground text-sm">{t(lang, 'step3_sub')}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {t(lang, 'advance_notice')}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {t(lang, 'date')}</Label>
                    <Input
                      type="date"
                      value={form.transfer_date}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(e) => updateForm('transfer_date', e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {t(lang, 'time')}</Label>
                    <Input type="time" value={form.transfer_time} onChange={(e) => updateForm('transfer_time', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(lang, 'flight_no')}</Label>
                    <Input placeholder={t(lang, 'flight_ph')} value={form.flight_number} onChange={(e) => updateForm('flight_number', e.target.value)} className="h-12" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t(lang, 'passengers')}</Label>
                      <Input type="number" min={1} max={8} value={form.passengers} onChange={(e) => updateForm('passengers', parseInt(e.target.value) || 1)} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(lang, 'luggage')}</Label>
                      <Input type="number" min={0} max={15} value={form.luggage} onChange={(e) => updateForm('luggage', parseInt(e.target.value) || 0)} className="h-12" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t(lang, 'notes')}</Label>
                  <Textarea placeholder={t(lang, 'notes_ph')} value={form.notes} onChange={(e) => updateForm('notes', e.target.value)} />
                </div>
              </motion.div>
            )}

            {/* Step 5: Customer Info */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold mb-1">{t(lang, 'step4_title')}</h2>
                  <p className="text-muted-foreground text-sm">{t(lang, 'step4_sub')}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t(lang, 'full_name')}</Label>
                    <Input placeholder={t(lang, 'name_ph')} value={form.customer_name} onChange={(e) => updateForm('customer_name', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(lang, 'email')}</Label>
                    <Input type="email" placeholder="email@example.com" value={form.customer_email} onChange={(e) => updateForm('customer_email', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(lang, 'phone')}</Label>
                    <Input type="tel" placeholder={t(lang, 'phone_ph')} value={form.customer_phone} onChange={(e) => updateForm('customer_phone', e.target.value)} className="h-12" />
                  </div>
                </div>

                <Separator />

                {/* Summary */}
                <div className="bg-muted/50 rounded-xl p-5 space-y-3">
                  <h3 className="font-bold text-lg">{t(lang, 'summary')}</h3>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">{t(lang, 'route')}:</span>
                    <span className="font-medium">{form.origin_place?.address} → {form.destination_place?.address}</span>
                    <span className="text-muted-foreground">{t(lang, 'distance')}:</span>
                    <span className="font-medium">{distance} km</span>
                    <span className="text-muted-foreground">{t(lang, 'vehicle')}:</span>
                    <span className="font-medium">{t(lang, vehicleTypes.find(v => v.id === form.vehicle_type)?.nameKey)}</span>
                    <span className="text-muted-foreground">{t(lang, 'date')}:</span>
                    <span className="font-medium">{form.transfer_date} {form.transfer_time}</span>
                    <span className="text-muted-foreground">{t(lang, 'passengers')}:</span>
                    <span className="font-medium">{form.passengers}</span>
                    {form.extras.length > 0 && (
                      <>
                        <span className="text-muted-foreground">Extras:</span>
                        <span className="font-medium">
                          {BOOKING_EXTRAS.filter(e => form.extras.includes(e.id)).map(e => e.label).join(', ')} <span className="text-green-600 text-xs">(grátis)</span>
                        </span>
                      </>
                    )}
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{t(lang, 'total')}</span>
                    <span className="text-3xl font-bold text-primary">€{price.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 pt-6 border-t space-y-4">
            {step === 5 && canProceed() && (
              <>
                {/* Payment method selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-6 object-contain" />
                    <span className="text-xs font-medium text-foreground">Pagar com PayPal</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <span className="text-2xl">💵</span>
                    <span className="text-xs font-medium text-foreground">Pagar em dinheiro ao motorista</span>
                  </button>
                </div>

                {paymentError && (
                  <p className="text-sm text-destructive text-center">{paymentError}</p>
                )}

                {paymentMethod === 'paypal' && (
                  <PayPalButton
                    amount={price}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setPaymentError(msg)}
                  />
                )}

                {paymentMethod === 'cash' && (
                  <Button
                    onClick={handleCashBooking}
                    disabled={isSubmitting}
                    className="w-full gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold h-12"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                    ) : (
                      <>Confirmar reserva — €{price.toFixed(2)} em dinheiro</>
                    )}
                  </Button>
                )}
              </>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> {t(lang, 'btn_back')}
              </Button>
              {step < 5 && (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="gap-2 bg-primary hover:bg-primary/90">
                  {t(lang, 'btn_next')} <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}