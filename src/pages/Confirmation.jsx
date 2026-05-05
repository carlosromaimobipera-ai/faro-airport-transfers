import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, MapPin, Calendar, Car, User, ArrowRight, Home, Plane, Phone, Mail } from 'lucide-react';
import { vehicleTypes } from '@/lib/transferData';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function Confirmation() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('id');
  const { lang } = useLang();

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => base44.entities.Booking.filter({ id: bookingId }),
    enabled: !!bookingId,
    select: (data) => data[0],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Reserva não encontrada</p>
        <Link to="/"><Button>Voltar ao início</Button></Link>
      </div>
    );
  }

  const vehicle = vehicleTypes.find(v => v.id === booking.vehicle_type);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">{t(lang, 'conf_title')}</h1>
          <p className="text-muted-foreground">{t(lang, 'conf_sub')}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="shadow-xl border-border/40">
            <CardContent className="p-6 md:p-8 space-y-6">
              {/* Ref */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{t(lang, 'conf_ref')}</p>
                <p className="text-3xl font-mono font-bold text-primary tracking-wider">{booking.booking_ref}</p>
              </div>

              <Separator />

              {/* Route */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{booking.origin}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.destination}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{booking.distance_km} km</p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {booking.transfer_date && format(new Date(booking.transfer_date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                  </p>
                  <p className="text-xs text-muted-foreground">Hora: {booking.transfer_time}</p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{t(lang, vehicle?.nameKey)}</p>
                  <p className="text-xs text-muted-foreground">{booking.passengers} passageiro(s), {booking.luggage} mala(s)</p>
                </div>
              </div>

              {/* Customer */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{booking.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{booking.customer_email} · {booking.customer_phone}</p>
                </div>
              </div>

              {booking.flight_number && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Voo: {booking.flight_number}</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Price */}
              <div className="bg-primary/5 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor total</p>
                  <Badge variant="outline" className="mt-1">{t(lang, 'conf_pending_pay')}</Badge>
                </div>
                <p className="text-4xl font-bold text-primary">€{booking.price?.toFixed(2)}</p>
              </div>

              {/* Contact info */}
              <div className="bg-muted/50 rounded-xl p-4 text-center space-y-2">
                <p className="text-sm font-medium">{t(lang, 'conf_contact')}</p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> +351 289 000 000</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> info@algarvestar.pt</span>
                </div>
              </div>

              <div className="text-center">
                <Link to="/">
                  <Button variant="outline" className="gap-2">
                    <Home className="w-4 h-4" /> {t(lang, 'conf_back')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}