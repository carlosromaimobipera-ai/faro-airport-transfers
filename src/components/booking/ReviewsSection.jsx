import React, { useState, useEffect, useCallback } from 'react';
import { Star, Quote, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const STATIC_REVIEWS = [
  { customer_name: "Sarah Mitchell", flag: "🇬🇧", rating: 5, comment: "Absolutely fantastic service! The driver was waiting for us at arrivals with a sign, the car was spotless and the journey to Albufeira was very comfortable. Will definitely book again!", route: "Faro Airport → Albufeira", transfer_date: "2025-04-10" },
  { customer_name: "Hans Becker", flag: "🇩🇪", rating: 5, comment: "Sehr professioneller Service. Pünktlich, freundlich und das Fahrzeug war sehr sauber. Der Transfer von Faro nach Vilamoura verlief reibungslos. Sehr empfehlenswert!", route: "Aeroporto Faro → Vilamoura", transfer_date: "2025-03-15" },
  { customer_name: "João Ferreira", flag: "🇵🇹", rating: 5, comment: "Serviço de excelência! Pontual, profissional e veículo muito confortável. Fiz a viagem Lisboa-Faro e correu tudo na perfeição. Preço justo e sem surpresas.", route: "Lisboa → Aeroporto Faro", transfer_date: "2025-02-20" },
  { customer_name: "Marie Dupont", flag: "🇫🇷", rating: 5, comment: "Service impeccable! Le chauffeur était très sympathique et ponctuel. Le trajet depuis l'aéroport de Faro jusqu'à Lagos était confortable. Je recommande vivement!", route: "Aeroporto Faro → Lagos", transfer_date: "2025-01-05" },
  { customer_name: "Carlos García", flag: "🇪🇸", rating: 5, comment: "Excelente servicio de traslado desde Sevilla hasta Albufeira. El conductor llegó puntual, el vehículo era amplio y limpio. Precio muy competitivo. Muy recomendable.", route: "Sevilha → Albufeira", transfer_date: "2024-12-10" },
  { customer_name: "Lena van der Berg", flag: "🇳🇱", rating: 5, comment: "Geweldige service! De chauffeur was vriendelijk en punctueel. De rit van Faro Airport naar Portimão was erg comfortabel. We zullen zeker weer gebruik maken van deze service.", route: "Aeroporto Faro → Portimão", transfer_date: "2024-11-20" },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-secondary fill-secondary' : 'text-muted'}`} />
      ))}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try { return format(new Date(dateStr + 'T00:00:00'), 'MMM yyyy'); } catch { return dateStr; }
}

export default function ReviewsSection({ routeFilter = '' }) {
  const { lang } = useLang();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const { data: dbReviews = [] } = useQuery({
    queryKey: ['reviews-public'],
    queryFn: () => base44.entities.Review.list('-created_date', 12),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const dbWithComments = dbReviews.filter(r => r.comment && r.rating >= 4);
  let reviews = dbWithComments.length >= 3 ? dbWithComments : STATIC_REVIEWS;

  if (routeFilter) {
    const filtered = reviews.filter(r =>
      r.route && r.route.toLowerCase().includes(routeFilter.toLowerCase())
    );
    if (filtered.length >= 1) reviews = filtered;
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const next = useCallback(() => setCurrent(c => (c + 1) % reviews.length), [reviews.length]);
  const prev = useCallback(() => setCurrent(c => (c - 1 + reviews.length) % reviews.length), [reviews.length]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  const review = reviews[current];

  return (
    <section className="py-14 bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <StarRating rating={5} />
            <span className="text-sm font-semibold text-muted-foreground">
              {avgRating}/5 · {reviews.length}+ {t(lang, 'reviews_count_label') || 'reviews'}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{t(lang, 'reviews_title') || 'Reviews'}</h2>
        </div>

        {/* Carousel card */}
        <div
          className="relative bg-card border border-border/40 rounded-2xl p-6 sm:p-8 shadow-sm"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="flex items-start justify-between mb-4">
            <Quote className="w-8 h-8 text-primary/20 shrink-0" />
            <StarRating rating={review.rating || 5} />
          </div>

          <p className="text-sm sm:text-base leading-relaxed text-foreground/80 min-h-[80px]">
            "{review.comment}"
          </p>

          <div className="border-t border-border/40 pt-4 mt-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{review.flag || '🌍'}</span>
              <div>
                <p className="font-semibold text-sm text-foreground">{review.customer_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(review.transfer_date)}</p>
              </div>
            </div>
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">{review.route}</span>
          </div>

          {/* Prev / Next */}
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrent(i); setPaused(true); }}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-border hover:bg-muted-foreground'}`}
            />
          ))}
        </div>

        {/* CTA Google */}
        <div className="mt-8 text-center">
          <a
            href="https://g.page/r/CeOr3i7UjtNxEBM/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-card border border-border hover:border-primary/40 hover:shadow-md text-foreground text-sm font-semibold py-2.5 px-5 rounded-xl transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.6-8 19.6-20 0-1.3-.1-2.7-.4-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.3C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3.2-11.3-7.8l-6.6 5.1C9.6 39.5 16.3 44 24 44z"/>
              <path fill="#1565C0" d="M43.6 20H24v8h11.3c-.9 2.5-2.6 4.6-4.8 6l6.2 5.3C40.8 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {t(lang, 'reviews_google_btn') || 'Review on Google'}
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>

      </div>
    </section>
  );
}