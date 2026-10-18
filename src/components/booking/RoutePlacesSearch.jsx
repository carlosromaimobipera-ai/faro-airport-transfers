import React, { useMemo, useState } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { CATEGORIES, searchRoutePlaces } from '@/lib/routePlaces';

// Pesquisa livre no catálogo de locais de interesse (praias, miradouros, castelos,
// adegas e mercados) para o cliente escolher paragens que não estão na rota.
export default function RoutePlacesSearch({ lang, selectedNames, onToggle }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchRoutePlaces(query), [query]);

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
            className="h-11 pl-9"
          />
        </div>

        {query.trim() && (
          results.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{t(lang, 'rp_search_none')}</p>
          ) : (
            <div className="space-y-2">
              {results.map(place => {
                const isAdded = selectedNames.includes(place.name);
                const category = CATEGORIES[place.cat] || CATEGORIES.historic;
                const Icon = category.icon;
                return (
                  <div key={place.name} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${category.chip}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{place.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t(lang, category.key)}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAdded ? 'default' : 'outline'}
                      className="gap-1.5 h-8 shrink-0"
                      onClick={() => onToggle(place)}
                    >
                      {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {isAdded ? t(lang, 'rp_added') : t(lang, 'rp_add')}
                    </Button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}