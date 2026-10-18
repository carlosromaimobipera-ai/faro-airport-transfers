import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useCurrency } from '@/lib/CurrencyContext';
import { STOP_HOURLY_RATE, stopsPrice } from '@/lib/extraServices';

export default function StopsSelector({ stops, onChange, lang }) {
  const { formatPrice } = useCurrency();

  const updateStop = (index, field, value) => {
    onChange(stops.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const addStop = () => onChange([...stops, { name: '', hours: 1 }]);
  const removeStop = (index) => onChange(stops.filter((_, i) => i !== index));

  const totalHours = stops.reduce((sum, s) => sum + (parseFloat(s.hours) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">{t(lang, 'stops_title')}</p>
          <p className="text-xs text-muted-foreground">{t(lang, 'stops_sub')}</p>
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-1 shrink-0" onClick={addStop}>
          <Plus className="w-3.5 h-3.5" /> {t(lang, 'stops_add')}
        </Button>
      </div>

      {stops.map((stop, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={stop.name}
            onChange={(e) => updateStop(i, 'name', e.target.value)}
            placeholder={t(lang, 'stop_ph')}
            className="flex-1 h-11"
          />
          <Input
            type="number"
            min={0}
            step={0.5}
            value={stop.hours}
            onChange={(e) => updateStop(i, 'hours', e.target.value)}
            className="w-20 h-11"
          />
          <span className="text-xs text-muted-foreground">h</span>
          {stops.length > 1 && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeStop(i)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {totalHours > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between text-sm">
          <span className="text-green-700">{totalHours} h × {STOP_HOURLY_RATE} €</span>
          <span className="font-bold text-green-600">+{formatPrice(stopsPrice(stops))}</span>
        </div>
      )}
    </div>
  );
}