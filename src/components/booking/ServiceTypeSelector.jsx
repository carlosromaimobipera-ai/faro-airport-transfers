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
        {options.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-secondary bg-secondary text-secondary-foreground shadow-lg shadow-secondary/40'
                  : 'border-secondary bg-secondary/20 hover:bg-secondary/30 hover:shadow-md hover:shadow-secondary/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${isActive ? 'bg-secondary-foreground/15' : 'bg-secondary'}`}>
                <opt.icon className="w-5 h-5 text-secondary-foreground" />
              </div>
              <p className="font-bold text-sm tracking-wide">{t(lang, opt.labelKey)}</p>
              <p className={`text-xs mt-2 leading-relaxed tracking-wide ${isActive ? 'text-secondary-foreground/80' : 'text-muted-foreground'}`}>
                {t(lang, opt.descKey)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}