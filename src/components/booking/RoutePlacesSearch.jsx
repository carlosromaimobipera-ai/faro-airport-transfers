import React, { useMemo, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { CATEGORIES, searchRoutePlaces } from '@/lib/routePlaces';
import usePlacePredictions from '@/hooks/usePlacePredictions';
import RoutePlaceResultRow from './RoutePlaceResultRow';

// Pesquisa livre de locais de interesse: primeiro no catálogo da app (com categorias),
// depois no Google Places, para poder escolher qualquer outro local como paragem.
export default function RoutePlacesSearch({ lang, selectedNames, onToggle }) {
  const [query, setQuery] = useState('');
  const catalogResults = useMemo(() => searchRoutePlaces(query), [query]);
  const { predictions, loading } = usePlacePredictions(query);

  const catalogNames = catalogResults.map(place => place.name.toLowerCase());
  const otherPlaces = predictions.filter(place => !catalogNames.includes(place.name.toLowerCase()));
  const trimmed = query.trim();
  const isEmpty = !!trimmed && !loading && catalogResults.length === 0 && otherPlaces.length === 0;

  return (
    <Card className="border-border/60">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="font-display font-bold">{t(lang, 'rp_search_title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t(lang, 'rp_search_sub')}</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'rp_search_ph')}
            className="h-11 pl-9 pr-9"
          />
          {loading && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {trimmed && (
          <div className="space-y-2">
            {catalogResults.map(place => {
              const category = CATEGORIES[place.cat] || CATEGORIES.historic;
              return (
                <RoutePlaceResultRow
                  key={place.name}
                  name={place.name}
                  subtitle={t(lang, category.key)}
                  category={place.cat}
                  isAdded={selectedNames.includes(place.name)}
                  onToggle={() => onToggle(place)}
                  lang={lang}
                />
              );
            })}

            {otherPlaces.map(place => (
              <RoutePlaceResultRow
                key={place.address}
                name={place.name}
                subtitle={place.address}
                isAdded={selectedNames.includes(place.name)}
                onToggle={() => onToggle(place)}
                lang={lang}
              />
            ))}

            {isEmpty && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{t(lang, 'rp_search_none')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}