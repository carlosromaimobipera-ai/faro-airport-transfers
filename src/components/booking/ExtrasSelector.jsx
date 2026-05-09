import React from 'react';
import { Baby, MapPin, Luggage, Wifi, ShoppingBag } from 'lucide-react';
import { BOOKING_EXTRAS } from '@/lib/transferData';

const ICONS = {
  Baby,
  MapPin,
  Luggage,
  Wifi,
  ShoppingBag,
};

export default function ExtrasSelector({ selected, onChange }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {BOOKING_EXTRAS.map((extra) => {
        const isSelected = selected.includes(extra.id);
        const Icon = ICONS[extra.icon] || ShoppingBag;
        return (
          <button
            key={extra.id}
            type="button"
            onClick={() => toggle(extra.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 bg-card'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{extra.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{extra.description}</p>
            </div>
            <div className="text-sm font-bold text-primary shrink-0">
              +€{extra.price.toFixed(2)}
            </div>
          </button>
        );
      })}
    </div>
  );
}