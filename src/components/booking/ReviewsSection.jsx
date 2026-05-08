import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const reviews = [
  {
    name: "Sarah Mitchell",
    flag: "🇬🇧",
    rating: 5,
    text: "Absolutely fantastic service! The driver was waiting for us at arrivals with a sign, the car was spotless and the journey to Albufeira was very comfortable. Will definitely book again!",
    route: "Faro Airport → Albufeira",
    date: "Abril 2025",
  },
  {
    name: "Hans Becker",
    flag: "🇩🇪",
    rating: 5,
    text: "Sehr professioneller Service. Pünktlich, freundlich und das Fahrzeug war sehr sauber. Der Transfer von Faro nach Vilamoura verlief reibungslos. Sehr empfehlenswert!",
    route: "Aeroporto Faro → Vilamoura",
    date: "Março 2025",
  },
  {
    name: "João Ferreira",
    flag: "🇵🇹",
    rating: 5,
    text: "Serviço de excelência! Pontual, profissional e veículo muito confortável. Fiz a viagem Lisboa-Faro e correu tudo na perfeição. Preço justo e sem surpresas.",
    route: "Lisboa → Aeroporto Faro",
    date: "Fevereiro 2025",
  },
  {
    name: "Marie Dupont",
    flag: "🇫🇷",
    rating: 5,
    text: "Service impeccable! Le chauffeur était très sympathique et ponctuel. Le trajet depuis l'aéroport de Faro jusqu'à Lagos était confortable. Je recommande vivement!",
    route: "Aeroporto Faro → Lagos",
    date: "Janeiro 2025",
  },
  {
    name: "Carlos García",
    flag: "🇪🇸",
    rating: 5,
    text: "Excelente servicio de traslado desde Sevilla hasta Albufeira. El conductor llegó puntual, el vehículo era amplio y limpio. Precio muy competitivo. Muy recomendable.",
    route: "Sevilha → Albufeira",
    date: "Dezembro 2024",
  },
  {
    name: "Lena van der Berg",
    flag: "🇳🇱",
    rating: 5,
    text: "Geweldige service! De chauffeur was vriendelijk en punctueel. De rit van Faro Airport naar Portimão was erg comfortabel. We zullen zeker weer gebruik maken van deze service.",
    route: "Aeroporto Faro → Portimão",
    date: "Novembro 2024",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-secondary fill-secondary' : 'text-muted'}`} />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  const { lang } = useLang();

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <StarRating rating={5} />
            <span className="text-sm font-semibold text-muted-foreground">4.9/5 · 200+ avaliações</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t(lang, 'reviews_title') || 'O que dizem os nossos clientes'}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t(lang, 'reviews_sub') || 'Centenas de viajantes satisfeitos em toda a Europa'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-card border border-border/40 rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <Quote className="w-8 h-8 text-primary/20" />
                <StarRating rating={review.rating} />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{review.text}"</p>
              <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{review.flag}</span>
                  <div>
                    <p className="font-semibold text-sm">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.date}</p>
                  </div>
                </div>
                <span className="text-xs text-primary bg-primary/5 px-2 py-1 rounded-full">{review.route}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}