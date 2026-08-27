import React from 'react';
import { Shield, Clock, CreditCard, Headphones, Car, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function FeaturesSection() {
  const { lang } = useLang();

  const features = [
    { icon: Shield,      titleKey: 'feat_safe_title',    descKey: 'feat_safe_desc' },
    { icon: Clock,       titleKey: 'feat_time_title',    descKey: 'feat_time_desc' },
    { icon: CreditCard,  titleKey: 'feat_price_title',   descKey: 'feat_price_desc' },
    { icon: Headphones,  titleKey: 'feat_support_title', descKey: 'feat_support_desc' },
    { icon: Car,         titleKey: 'feat_fleet_title',   descKey: 'feat_fleet_desc' },
    { icon: Globe,       titleKey: 'feat_lang_title',    descKey: 'feat_lang_desc' },
  ];

  return (
    <section className="py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-3 tracking-tight">{t(lang, 'feat_title')}</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">{t(lang, 'feat_sub')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both">
          {features.map((feature, i) => (
            <div
              key={feature.titleKey}
              style={{ animationDelay: `${i * 100}ms` }}
              className="p-6 rounded-2xl bg-background border border-border/40 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:fill-mode-both"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-base sm:text-lg mb-2 text-foreground">{t(lang, feature.titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(lang, feature.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}