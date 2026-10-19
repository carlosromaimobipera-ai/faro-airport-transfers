import React from 'react';
import { ArrowRight, Timer, MapPin } from 'lucide-react';
import { t } from '@/lib/i18n';

const options = [
  { id: 'transfer', icon: ArrowRight, labelKey: 'service_transfer', descKey: 'service_transfer_desc' },
  { id: 'hourly', icon: Timer, labelKey: 'service_hourly', descKey: 'service_hourly_desc' },
  { id: 'daytrip', icon: MapPin, labelKey: 'service_daytrip', descKey: 'service_daytrip_desc' },
];

export default function ServiceTypeSelector({ value, onChange, lang }) {
  return (
    <div>
      <p className="text-sm font-medium mb-2">{t(lang, 'service_type_title')}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              value === opt.id
                ? 'border-secondary bg-secondary/20 shadow-md shadow-secondary/20'
                : 'border-secondary/50 bg-secondary/5 hover:border-secondary hover:bg-secondary/10'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mb-2">
              <opt.icon className="w-5 h-5 text-secondary-foreground" />
            </div>
            <p className="font-semibold text-sm">{t(lang, opt.labelKey)}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">{t(lang, opt.descKey)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}