import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Star, ExternalLink, Plane } from 'lucide-react';

const GOOGLE_REVIEW_URL = 'https://g.page/r/transfers-algarvestar/review';

export default function Review() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get('booking_id');
  const bookingRef = urlParams.get('ref');

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [step, setStep] = useState('rate'); // 'rate' | 'submitted' | 'invalid'
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (!bookingId) { setStep('invalid'); return; }
    base44.entities.Booking.filter({ id: bookingId })
      .then(res => {
        if (res[0]) setBooking(res[0]);
        else setStep('invalid');
      })
      .catch(() => setStep('invalid'));
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!rating) return;
    setSubmitting(true);
    await base44.entities.Review.create({
      booking_id: bookingId,
      booking_ref: bookingRef,
      customer_name: booking?.customer_name || '',
      customer_email: booking?.customer_email || '',
      rating,
      comment,
      route: booking ? `${booking.origin} → ${booking.destination}` : '',
      transfer_date: booking?.transfer_date || '',
      google_redirect: false,
    });
    setStep('submitted');
    setSubmitting(false);
  };

  const handleGoogleRedirect = async () => {
    // Mark the review record as google_redirect=true if exists
    try {
      const reviews = await base44.entities.Review.filter({ booking_id: bookingId });
      if (reviews[0]) {
        await base44.entities.Review.update(reviews[0].id, { google_redirect: true });
      }
    } catch (_) {}
    window.open(GOOGLE_REVIEW_URL, '_blank');
  };

  if (step === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Link de avaliação inválido ou expirado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">Transfers Algarvestar</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'rate' && (
            <motion.div key="rate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="shadow-xl border-border/40">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center">
                    <h1 className="font-display text-2xl font-bold mb-2">Como foi a sua viagem?</h1>
                    {booking && (
                      <p className="text-sm text-muted-foreground">
                        {booking.origin} → {booking.destination}<br />
                        <span className="text-xs">{booking.transfer_date} · Ref: {bookingRef}</span>
                      </p>
                    )}
                  </div>

                  {/* Star Rating */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hovered || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-medium text-muted-foreground">
                      {['', 'Muito mau 😞', 'Mau 😕', 'Razoável 😐', 'Bom 😊', 'Excelente! 🌟'][rating]}
                    </motion.p>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Comentário (opcional)</label>
                    <Textarea
                      placeholder="Partilhe a sua experiência..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!rating || submitting}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {submitting ? 'A enviar...' : 'Enviar avaliação'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 'submitted' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Card className="shadow-xl border-border/40">
                <CardContent className="p-8 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold mb-2">Obrigado!</h2>
                    <p className="text-muted-foreground text-sm">A sua avaliação foi registada com sucesso.</p>
                  </div>

                  {rating >= 4 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                      <p className="text-sm font-medium text-foreground">
                        Ficamos muito felizes! 🌟<br />
                        <span className="text-muted-foreground font-normal">Partilhe também a sua experiência no Google para ajudar outros viajantes.</span>
                      </p>
                      <Button onClick={handleGoogleRedirect} className="w-full gap-2" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                        Deixar avaliação no Google
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}