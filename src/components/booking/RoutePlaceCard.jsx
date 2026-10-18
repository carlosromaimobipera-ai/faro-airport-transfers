import React, { useState } from 'react';
import { Copy, Check, ExternalLink, MapPin, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';
import { CATEGORIES, placeDescription } from '@/lib/routePlaces';

export default function RoutePlaceCard({ place, lang, isAdded, onToggle }) {
  const [copied, setCopied] = useState(false);
  const category = CATEGORIES[place.cat] || CATEGORIES.historic;
  const Icon = category.icon;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(place.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  return (
    <Card className={`transition-shadow hover:shadow-md ${isAdded ? 'border-secondary/50 ring-1 ring-secondary/20' : 'border-border/60'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${category.chip}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm sm:text-base">{place.name}</h3>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${category.chip}`}>
                {t(lang, category.key)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{placeDescription(place, lang)}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span>{t(lang, 'rp_detour').replace('{km}', place.detourKm)}</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t(lang, 'rp_along').replace('{km}', place.alongKm)}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant={isAdded ? 'default' : 'outline'}
                className="gap-1.5 h-8"
                onClick={onToggle}
              >
                {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isAdded ? t(lang, 'rp_added') : t(lang, 'rp_add')}
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" onClick={copyName}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t(lang, 'rp_copied') : t(lang, 'rp_copy')}
              </Button>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline"
              >
                {t(lang, 'rp_maps')} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}