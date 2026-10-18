import React from 'react';
import { Compass, ExternalLink } from 'lucide-react';
import { t } from '@/lib/i18n';

const shortName = (address) => (address || '').split(',')[0];

export default function RoutePlacesPrompt({ originPlace, destinationPlace, distanceKm, vehicleType, isSpainRoute, lang }) {
  const origin = originPlace?.coords;
  const destination = destinationPlace?.coords;
  if (!origin || !destination) return null;

  const params = new URLSearchParams({
    oLat: origin.lat,
    oLng: origin.lng,
    dLat: destination.lat,
    dLng: destination.lng,
    o: originPlace.address || '',
    d: destinationPlace.address || '',
    km: distanceKm ? String(distanceKm) : '',
    veh: vehicleType || '',
    es: isSpainRoute ? '1' : '',
  });

  const description = t(lang, 'places_prompt_desc')
    .replace('{origin}', shortName(originPlace.address))
    .replace('{destination}', shortName(destinationPlace.address));

  return (
    <div className="bg-secondary/5 border border-secondary/25 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">{t(lang, 'places_prompt_title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <a
        href={`/lugares-na-rota?${params.toString()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {t(lang, 'places_prompt_btn')} <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}