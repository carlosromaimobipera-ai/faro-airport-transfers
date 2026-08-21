import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ArrowLeft, MapPin, CircleDot, Calendar, User, Gift, AlertCircle, ArrowLeftRight, Plane } from 'lucide-react';
import ExtrasSelector from './ExtrasSelector';
import TimePicker from './TimePicker.jsx';
import DatePicker from './DatePicker.jsx';
import LocationSelector from './LocationSelector';
import SimpleAddressPicker from './SimpleAddressPicker';
import VehicleCard from './VehicleCard';
import RouteMap from './RouteMap';
import RouteInfoBadge from './RouteInfoBadge';
import { vehicleTypes, calculatePrice, generateBookingRef, getEffectiveDistance, BOOKING_EXTRAS, calculateExtrasTotal, isRouteAllowed, getRegionName } from '@/lib/transferData';
import { useQuery } from '@tanstack/react-query';

const HAS_PLACES_KEY = !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import PayPalButton from './PayPalButton';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useCurrency } from '@/lib/CurrencyContext';

export default function BookingForm() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const { formatPrice } = useCurrency();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); // 'paypal' | 'cash'



  const [form, setForm] = useState({
    origin: '', destination: '', vehicle_type: '',
    origin_place: null, destination_place: null,
    trip_type: 'one_way',
    transfer_date: '', transfer_time: '', flight_number: '',
    return_date: '', return_time: '', return_flight_number: '',
    passengers: 1, luggage: 1,
    customer_name: '', customer_email: '', customer_phone: '', notes: '',
    extras: [],
    language: lang,
  });

  const [distanceData, setDistanceData] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  // Haversine fallback for when Google Maps API fails
  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(km * 1.35 * 100) / 100;
  }

  // Calculate distance — Google Maps first, Haversine fallback
  useEffect(() => {
    if (!form.origin_place?.coords || !form.destination_place?.coords) {
      setDistanceData(null);
      setIsLoadingDistance(false);
      return;
    }

    setIsLoadingDistance(true);
    setDistanceData(null);

    const { lat: oLat, lng: oLng } = form.origin_place.coords;
    const { lat: dLat, lng: dLng } = form.destination_place.coords;

    base44.functions.invoke('calculateDistance', {
      origin_lat: oLat,
      origin_lng: oLng,
      destination_lat: dLat,
      destination_lng: dLng,
    }).then(res => {
      if (res.data?.distance_km) {
        setDistanceData(res.data);
      } else {
        // Fallback to Haversine
        const km = haversineKm(oLat, oLng, dLat, dLng);
        setDistanceData({ distance_km: km, duration_minutes: Math.ceil((km / 80) * 60), source: 'haversine' });
      }
    }).catch(() => {
      // Fallback to Haversine
      const km = haversineKm(oLat, oLng, dLat, dLng);
      setDistanceData({ distance_km: km, duration_minutes: Math.ceil((km / 80) * 60), source: 'haversine' });
    }).finally(() => {
      setIsLoadingDistance(false);
    });
  }, [form.origin_place?.coords?.lat, form.origin_place?.coords?.lng, form.destination_place?.coords?.lat, form.destination_place?.coords?.lng]);

  const distance = distanceData?.distance_km || null;
  const duration = distanceData?.duration_minutes || 0;

  // Detect when BOTH origin and destination are in Spain (not Portugal) — quote-only route
  const isBothInSpain = useMemo(() => {
    const oCoords = form.origin_place?.coords;
    const dCoords = form.destination_place?.coords;
    if (!oCoords || !dCoords) return false;
    const inSpain = (c) => c.lng > -7.0 && c.lat >= 36.0 && c.lat <= 43.8;
    const inPortugal = (c) => c.lng <= -7.0 && c.lng >= -9.6 && c.lat >= 36.8;
    return inSpain(oCoords) && inSpain(dCoords) && !inPortugal(oCoords) && !inPortugal(dCoords);
  }, [form.origin_place?.coords, form.destination_place?.coords]);

  // Detect Spain route: ONLY when one side is in Spain (lng > -5.0) and NOT in Portugal
  const isSpainRoute = useMemo(() => {
    const oCoords = form.origin_place?.coords;
    const dCoords = form.destination_place?.coords;
    if (!oCoords || !dCoords) return false;
    // Spain proper: longitude > -9.3 AND outside Portugal bounds (Portugal lng: -9.6 to -6.1)
    // Use strict Spain detection: lng > -7.0 to avoid confusion with Algarve/Portugal
    const inSpain = (c) => c.lng > -7.0 && c.lat >= 36.0 && c.lat <= 43.8;
    const inPortugal = (c) => c.lng <= -7.0 && c.lng >= -9.6 && c.lat >= 36.8;
    return (inPortugal(oCoords) && inSpain(dCoords)) || (inSpain(oCoords) && inPortugal(dCoords));
  }, [form.origin_place?.coords, form.destination_place?.coords]);

  const selectedVehicle = useMemo(() => vehicleTypes.find(v => v.id === form.vehicle_type), [form.vehicle_type]);
  const maxPassengers = selectedVehicle?.maxPassengers || 8;
  const maxLuggage = selectedVehicle?.maxLuggage || 8;

  // Clamp pax/luggage when vehicle changes
  useEffect(() => {
    if (form.passengers > maxPassengers) updateForm('passengers', maxPassengers);
    if (form.luggage > maxLuggage) updateForm('luggage', maxLuggage);
  }, [form.vehicle_type]);

  const basePrice = useMemo(() => calculatePrice(distance, form.vehicle_type, [], duration, isSpainRoute), [distance, form.vehicle_type, duration, isSpainRoute]);
  const extrasTotal = useMemo(() => calculateExtrasTotal(form.extras), [form.extras]);
  const tripMultiplier = form.trip_type === 'round_trip' ? 2 : 1;
  const price = useMemo(() => Math.round((basePrice * tripMultiplier + extrasTotal) * 100) / 100, [basePrice, tripMultiplier, extrasTotal]);
  const CARD_FEE = 3;
  const finalPrice = useMemo(() =>
    (paymentMethod === 'card' || paymentMethod === 'paypal')
      ? Math.round((price + CARD_FEE) * 100) / 100
      : price,
    [price, paymentMethod]
  );
  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: {
        if (!form.origin_place || !form.destination_place) return false;
        if (isLoadingDistance) return false;
        if (isBothInSpain) return false;
        if (!isRouteAllowed(form.origin_place.coords, form.destination_place.coords)) return false;
        if (!distance) return false;
        return true;
      }
      case 2: return form.vehicle_type;
      case 3: return true; // extras are optional
      case 4: {
        if (!form.transfer_date || !form.transfer_time) return false;
        const bookingDateTime = new Date(`${form.transfer_date}T${form.transfer_time}`);
        const minAllowed = new Date(Date.now() + 24 * 60 * 60 * 1000);
        if (bookingDateTime < minAllowed) return false;
        if (form.trip_type === 'round_trip' && (!form.return_date || !form.return_time)) return false;
        return true;
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
      trip_type: form.trip_type,
      return_date: form.trip_type === 'round_trip' ? form.return_date : '',
      return_time: form.trip_type === 'round_trip' ? form.return_time : '',
      flight_number: form.flight_number,
      return_flight_number: form.return_flight_number || '',
      passengers: form.passengers,
      luggage: form.luggage,
      notes: form.notes,
      status: 'pending',
      payment_status: 'unpaid',
      language: lang,
    });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-18386612747/HgooCODe0OAcEIvktb9E',
      });
    }
    navigate(`/confirmacao?id=${booking.id}&ref=${bookingRef}`);
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
      price: finalPrice,
      extras: form.extras,
      extras_price: extrasTotal,
      transfer_date: form.transfer_date,
      transfer_time: form.transfer_time,
      trip_type: form.trip_type,
      return_date: form.trip_type === 'round_trip' ? form.return_date : '',
      return_time: form.trip_type === 'round_trip' ? form.return_time : '',
      flight_number: form.flight_number,
      return_flight_number: form.return_flight_number || '',
      passengers: form.passengers,
      luggage: form.luggage,
      notes: form.notes,
      status: 'pending',
      payment_status: 'paid',
      language: lang,
    });
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-18386612747/uWpyCOri0OAcEIvktb9E',
        value: finalPrice,
        currency: 'EUR',
        transaction_id: booking.id,
      });
    }
    navigate(`/confirmacao?id=${booking.id}&ref=${bookingRef}`);
  };

  const steps = [
    { id: 1, labelKey: 'step_route',   icon: MapPin },
    { id: 2, labelKey: 'step_vehicle', icon: CircleDot },
    { id: 3, labelKey: 'extras_title', icon: Gift },
    { id: 4, labelKey: 'step_details', icon: Calendar },
    { id: 5, labelKey: 'step_data',    icon: User },
  ];

  return (
    <section id="booking" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 md:-mt-8 relative z-10 pb-20">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-1 mb-6 overflow-x-auto px-2">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => s.id < step && setStep(s.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                step === s.id
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : step > s.id
                  ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">{t(lang, s.labelKey)}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-4 sm:w-8 h-0.5 shrink-0 ${step > s.id ? 'bg-primary' : 'bg-border'}`} />
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
                  <SimpleAddressPicker
                    label={t(lang, 'origin')}
                    value={form.origin_place}
                    onChange={(place) => setForm(prev => ({ ...prev, origin_place: place, destination_place: null }))}
                    placeholder={t(lang, 'select_place')}
                  />
                  <SimpleAddressPicker
                    label={t(lang, 'destination')}
                    value={form.destination_place}
                    onChange={(place) => setForm(prev => ({ ...prev, destination_place: place }))}
                    placeholder={t(lang, 'select_place')}
                  />
                </div>
                {/* Trip type selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateForm('trip_type', 'one_way')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${form.trip_type === 'one_way' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                    {t(lang, 'trip_one_way')}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm('trip_type', 'round_trip')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium ${form.trip_type === 'round_trip' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/40 text-muted-foreground'}`}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                    {t(lang, 'trip_round_trip')}
                  </button>
                </div>

                {isLoadingDistance && form.origin_place && form.destination_place && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
                    {t(lang, 'calculating_distance')}
                  </div>
                )}

                {/* Show warning if user typed manually without selecting coords */}
                {form.origin_place && !form.origin_place.coords && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {t(lang, 'select_from_list')} ({t(lang, 'origin').toLowerCase()})
                  </div>
                )}
                {form.destination_place && !form.destination_place.coords && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {t(lang, 'select_from_list')} ({t(lang, 'destination').toLowerCase()})
                  </div>
                )}

                {isBothInSpain && (
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-sm text-green-900 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xl shrink-0">🇪🇸</span>
                      <p className="font-medium">{t(lang, 'spain_quote_title')}</p>
                    </div>
                    <p className="text-green-800 text-xs">{t(lang, 'spain_quote_desc')}</p>
                    <a
                      href={`https://wa.me/351913956971?text=${encodeURIComponent(t(lang, 'spain_quote_wa_msg'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg py-3 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      {t(lang, 'spain_quote_btn')}
                    </a>
                  </div>
                )}
                {!isBothInSpain && form.origin_place && form.destination_place && !isRouteAllowed(form.origin_place.coords, form.destination_place.coords) && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{t(lang, 'invalid_route_algarve')}</span>
                  </div>
                )}
                {/* Estimated price preview */}
                {distance && form.origin_place && form.destination_place && isRouteAllowed(form.origin_place.coords, form.destination_place.coords) && !isLoadingDistance && !isBothInSpain && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                    <p className="text-xs text-muted-foreground mb-1">
                  {t(lang, 'est_distance')}: <span className="font-semibold text-foreground">{distance} km</span>
                  {form.trip_type === 'round_trip' && <span className="ml-2 text-primary font-medium">× 2 ({t(lang, 'trip_round_trip')})</span>}
                </p>
                    <div className="flex items-center gap-3 flex-wrap">
                       <span className="text-xs text-muted-foreground">{t(lang, 'from_price')}:</span>
                       {vehicleTypes.map(v => (
                         <span key={v.id} className="text-sm font-bold text-primary">
                           {t(lang, v.nameKey)} <span className="text-secondary">{formatPrice(calculatePrice(distance, v.id, [], distanceData?.duration_minutes || 0, isSpainRoute) * tripMultiplier)}</span>
                         </span>
                       ))}
                    </div>
                  </div>
                )}
                {distance && form.origin_place && form.destination_place && isRouteAllowed(form.origin_place.coords, form.destination_place.coords) && (
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {vehicleTypes.map((vehicle) => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      selected={form.vehicle_type === vehicle.id}
                      onSelect={(id) => updateForm('vehicle_type', id)}
                      price={calculatePrice(distance, vehicle.id, [], duration, isSpainRoute)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Extras */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div>
                 <h2 className="font-display text-2xl font-bold mb-1">{t(lang, 'extras_title')}</h2>
                 <p className="text-muted-foreground text-sm">{t(lang, 'extras_sub')}</p>
               </div>
                <ExtrasSelector
                  selected={form.extras}
                  onChange={(extras) => updateForm('extras', extras)}
                  lang={lang}
                />
                {form.extras.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-green-700">{t(lang, 'extras_selected').replace('{count}', form.extras.length)}</span>
                    <span className="font-bold text-green-600">{t(lang, 'free')}</span>
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
                    <DatePicker
                      value={form.transfer_date}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      onChange={(v) => updateForm('transfer_date', v)}
                      lang={lang}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> {t(lang, 'time')}</Label>
                    <TimePicker value={form.transfer_time} onChange={(v) => updateForm('transfer_time', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(lang, 'flight_no')}</Label>
                    <Input placeholder={t(lang, 'flight_ph')} value={form.flight_number} onChange={(e) => updateForm('flight_number', e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t(lang, 'return_flight_no')}</Label>
                    <Input placeholder={t(lang, 'return_flight_ph')} value={form.return_flight_number || ''} onChange={(e) => updateForm('return_flight_number', e.target.value)} className="h-12" />
                  </div>

                  {/* Return date/time — only for round trip */}
                  {form.trip_type === 'round_trip' && (
                    <>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary" /> {t(lang, 'return_date')}</Label>
                        <DatePicker
                          value={form.return_date}
                          min={form.transfer_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                          onChange={(v) => updateForm('return_date', v)}
                          lang={lang}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4 text-primary" /> {t(lang, 'return_time')}</Label>
                        <TimePicker value={form.return_time} onChange={(v) => updateForm('return_time', v)} />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t(lang, 'passengers')} <span className="text-muted-foreground text-xs">(máx. {maxPassengers})</span></Label>
                      <Input type="number" min={1} max={maxPassengers} value={form.passengers} onChange={(e) => { const v = parseInt(e.target.value); updateForm('passengers', isNaN(v) ? '' : Math.min(v, maxPassengers)); }} onBlur={(e) => { if (!e.target.value || parseInt(e.target.value) < 1) updateForm('passengers', 1); }} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label>{t(lang, 'luggage')} <span className="text-muted-foreground text-xs">(máx. {maxLuggage})</span></Label>
                      <Input type="number" min={0} max={maxLuggage} value={form.luggage} onChange={(e) => { const v = parseInt(e.target.value); updateForm('luggage', isNaN(v) ? '' : Math.min(v, maxLuggage)); }} onBlur={(e) => { if (e.target.value === '') updateForm('luggage', 0); }} className="h-12" />
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
                    <span className="font-medium">{distance ? `${distance} km` : '—'}</span>
                    <span className="text-muted-foreground">{t(lang, 'vehicle')}:</span>
                    <span className="font-medium">{form.vehicle_type && t(lang, vehicleTypes.find(v => v.id === form.vehicle_type)?.nameKey || '')}</span>
                    <span className="text-muted-foreground">{t(lang, 'trip_type_label')}:</span>
                    <span className="font-medium">{form.trip_type === 'round_trip' ? t(lang, 'trip_round_trip') : t(lang, 'trip_one_way')}</span>
                    <span className="text-muted-foreground">{t(lang, 'date')}:</span>
                    <span className="font-medium">{form.transfer_date} {form.transfer_time}</span>
                    {form.trip_type === 'round_trip' && form.return_date && (
                      <>
                        <span className="text-muted-foreground">{t(lang, 'return_date')}:</span>
                        <span className="font-medium">{form.return_date} {form.return_time}</span>
                      </>
                    )}
                    <span className="text-muted-foreground">{t(lang, 'passengers')}:</span>
                    <span className="font-medium">{form.passengers}</span>
                    {form.extras.length > 0 && (
                      <>
                        <span className="text-muted-foreground">{t(lang, 'extras_label')}:</span>
                        <span className="font-medium">
                          {BOOKING_EXTRAS.filter(e => form.extras.includes(e.id)).map(e => t(lang, e.labelKey)).join(', ')} <span className="text-green-600 text-xs">({t(lang, 'free')})</span>
                        </span>
                      </>
                    )}
                    {form.return_flight_number && (
                      <>
                        <span className="text-muted-foreground">{t(lang, 'return_flight_label')}:</span>
                        <span className="font-medium">{form.return_flight_number}</span>
                      </>
                    )}
                  </div>
                  <Separator />
                  {(paymentMethod === 'card' || paymentMethod === 'paypal') && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(lang, 'card_fee_label') || 'Taxa cartão/PayPal'}:</span>
                      <span className="font-medium text-muted-foreground">+{formatPrice(CARD_FEE)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{t(lang, 'total')}</span>
                    <span className="text-3xl font-bold text-primary">{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 pt-6 border-t space-y-4">
            {step === 5 && canProceed() && (
              <>
                {/* Payment method selector — 3 buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <span className="text-xl">💳</span>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">{t(lang, 'pay_card')}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('paypal')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <img src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png" alt="PayPal" className="h-5 object-contain" />
                    <span className="text-xs font-medium text-foreground">{t(lang, 'pay_paypal')}</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                  >
                    <span className="text-xl">💵</span>
                    <span className="text-xs font-medium text-foreground text-center leading-tight">{t(lang, 'pay_cash_short')}</span>
                  </button>
                </div>

                {paymentError && (
                  <p className="text-sm text-destructive text-center">{paymentError}</p>
                )}

                {paymentMethod === 'card' && (
                  <PayPalButton
                    amount={finalPrice}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setPaymentError(msg)}
                    fundingSource="CARD"
                  />
                )}

                {paymentMethod === 'paypal' && (
                  <PayPalButton
                    amount={finalPrice}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setPaymentError(msg)}
                    fundingSource="PAYPAL"
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
                      <>{t(lang, 'confirm_booking')} — {formatPrice(price)}</>
                    )}
                  </Button>
                )}
              </>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1} className="gap-2 min-w-[100px]">
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