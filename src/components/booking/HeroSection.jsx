import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Shield, Clock, Star } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function HeroSection() {
  const { lang } = useLang();

  const stats = [
    { icon: Shield, labelKey: 'hero_stat_safe', value: "100%" },
    { icon: Clock,  labelKey: 'hero_stat_punctual', value: "24/7" },
    { icon: Star,   labelKey: 'hero_stat_rating', value: "4.9★" },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-6 md:pt-32 md:pb-8">
        <div className="max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight mb-2">
              {t(lang, 'hero_title_full')}
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap gap-4 sm:gap-8 mt-8"
          >
            {stats.map((stat) => (
              <div key={stat.labelKey} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-bold">{stat.value}</p>
                  <p className="text-[11px] sm:text-xs text-primary-foreground/60">{t(lang, stat.labelKey)}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" className="w-full">
          <path d="M0 60V20C240 45 480 0 720 20C960 45 1200 0 1440 20V60H0Z" fill="hsl(var(--background))" />
        </svg>
      </div>
    </section>
  );
}