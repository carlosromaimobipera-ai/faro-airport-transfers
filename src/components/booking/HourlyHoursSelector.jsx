import React from 'react';
import { Timer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';
import { hourlyPrice, HOURLY_RATE } from '@/lib/extraServices';
import { useCurrency } from '@/lib/CurrencyContext';

const QUICK_HOURS = [1, 2, 3, 4, 6, 8];

export default function HourlyHoursSelector({ value, onChange, lang }) {
  const { formatPrice } = useCurrency();
  const hours = parseFloat(value) || 0;

  return (
    <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-4 space-y-3">
      <Label className="flex items-center gap-2 font-bold">
        <Timer className="w-4 h-4 text-secondary" />
        {t(lang, 'hours_label')}
      </Label>

      <div className="flex flex-wrap gap-2">
        {QUICK_HOURS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={`px-4 py-2 rounded-lg border-2 text-sm font-bold tracking-wide transition-all ${
              hours === h
                ? 'border-secondary bg-secondary text-secondary-foreground'
                : 'border-secondary/60 bg-background hover:bg-secondary/20'
            }`}
          >
            {h}h
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Input
          type="number"
          min={1}
          step={0.5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => { if (!e.target.value || parseFloat(e.target.value) < 1) onChange(1); }}
          className="h-12 w-28 text-center text-lg font-bold"
        />
        <span className="text-sm font-medium text-muted-foreground">
          {HOURLY_RATE} € / {t(lang, 'hours_label').toLowerCase()}
        </span>
      </div>

      <p className="text-sm font-bold text-foreground">
        {hours}h × {HOURLY_RATE} € = {formatPrice(hourlyPrice(hours))}
      </p>
    </div>
  );
}