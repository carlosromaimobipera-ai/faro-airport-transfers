import React from 'react';
import { FileText } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const sections = [
  { titleKey: 'terms_s1_title', contentKey: 'terms_s1' },
  { titleKey: 'terms_s2_title', contentKey: 'terms_s2' },
  { titleKey: 'terms_s3_title', contentKey: 'terms_s3' },
  { titleKey: 'terms_s4_title', contentKey: 'terms_s4' },
  { titleKey: 'terms_s5_title', contentKey: 'terms_s5' },
  { titleKey: 'terms_s6_title', contentKey: 'terms_s6' },
  { titleKey: 'terms_s7_title', contentKey: 'terms_s7' },
  { titleKey: 'terms_s8_title', contentKey: 'terms_s8' },
];

export default function TermsOfService() {
  const { lang } = useLang();

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-foreground text-background py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold text-background mb-4">{t(lang, 'terms_title')}</h1>
          <p className="text-background/70 text-lg max-w-2xl mx-auto">{t(lang, 'terms_subtitle')}</p>
          <p className="text-background/40 text-sm mt-3">{t(lang, 'terms_updated')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {sections.map(({ titleKey, contentKey }) => (
            <div key={titleKey} className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">{t(lang, titleKey)}</h2>
              <p className="text-muted-foreground leading-relaxed">{t(lang, contentKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}