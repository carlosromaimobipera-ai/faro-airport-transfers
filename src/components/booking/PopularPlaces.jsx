import React from 'react';
import { Plus, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/lib/i18n';

// Locais mais escolhidos por outros clientes, guardados a cada reserva de day trip.
export default function PopularPlaces({ places, lang, selectedNames, onToggle }) {
  if (!places.length) return null;

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-display font-bold">{t(lang, 'rp_popular')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t(lang, 'rp_popular_sub')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {places.map(place => {
            const isAdded = selectedNames.includes(place.name);
            return (
              <button
                key={place.name}
                type="button"
                onClick={() => onToggle(place)}
                className={`flex items-center gap-2 text-sm rounded-full border px-3 py-1.5 transition-colors ${
                  isAdded ? 'border-secondary/50 bg-secondary/10 text-secondary' : 'border-border hover:border-primary/40'
                }`}
              >
                {isAdded ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Plus className="w-3.5 h-3.5 shrink-0" />}
                <span className="font-medium">{place.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {t(lang, 'rp_chosen').replace('{count}', place.search_count)}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}