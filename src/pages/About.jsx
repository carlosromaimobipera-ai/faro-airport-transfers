import React from 'react';
import { Plane, Clock, Shield, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

export default function About() {
  const { lang } = useLang();

  const features = [
    { icon: Clock, titleKey: 'about_feat_punctuality', descKey: 'about_feat_punctuality_desc' },
    { icon: Shield, titleKey: 'about_feat_safety', descKey: 'about_feat_safety_desc' },
    { icon: Users, titleKey: 'about_feat_groups', descKey: 'about_feat_groups_desc' },
    { icon: Star, titleKey: 'about_feat_stars', descKey: 'about_feat_stars_desc' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground text-background py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Plane className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-background mb-4">{t(lang, 'about_title')}</h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">{t(lang, 'about_subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">{t(lang, 'about_who_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t(lang, 'about_who_p1')}</p>
            <p className="text-muted-foreground leading-relaxed mt-4">{t(lang, 'about_who_p2')}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">{t(lang, 'about_what_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t(lang, 'about_what_p1')}</p>
            <p className="text-muted-foreground leading-relaxed mt-4">{t(lang, 'about_what_p2')}</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">{t(lang, 'about_for_who_title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t(lang, 'about_for_who_p1')}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {features.map(({ icon: Icon, titleKey, descKey }) => (
              <div key={titleKey} className="bg-card border border-border rounded-xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{t(lang, titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(lang, descKey)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-8">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              {t(lang, 'about_cta')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}