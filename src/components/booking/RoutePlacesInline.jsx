import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Compass, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { t } from '@/lib/i18n';
import RoutePlacesSearch from './RoutePlacesSearch';
import RoutePlaceCard from './RoutePlaceCard';
import PopularPlaces from './PopularPlaces';
import {
  fetchRouteGeometry,
  fetchRouteThroughPoints,
  rankPlacesAlongRoute,
  alongKmForPlace,
  orderStopsAlongRoute,
} from '@/lib/routePlaces';

const RoutePlacesMap = lazy(() => import('@/components/maps/RoutePlacesMap'));

const shortName = (address) => (address || '').split(',')[0];

// Lugares para visitar na rota (transfer + day trip), dentro do próprio formulário de reserva.
export default function RoutePlacesInline({ originPlace, destinationPlace, selection, onChange, lang }) {
  const origin = originPlace?.coords;
  const destination = destinationPlace?.coords;
  const hasCoords = !!origin && !!destination;

  const [route, setRoute] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    if (!hasCoords) {
      setRoute(null);
      return;
    }
    let active = true;
    setIsLoadingRoute(true);
    fetchRouteGeometry(origin, destination)
      .then(result => { if (active) setRoute(result); })
      .finally(() => { if (active) setIsLoadingRoute(false); });
    return () => { active = false; };
  }, [hasCoords, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const places = useMemo(() => (route ? rankPlacesAlongRoute(route.geometry) : []), [route]);

  const loadPopular = () => base44.entities.PopularPlace
    .filter({}, { sort: '-search_count', limit: 6 })
    .then(res => setPopular(res.items || []))
    .catch(() => {});

  useEffect(() => { loadPopular(); }, []);

  const selectedNames = selection.map(p => p.name);
  const popularPlaces = popular.map(p => ({
    name: p.name,
    cat: p.category || 'historic',
    lat: p.lat,
    lng: p.lng,
    search_count: p.search_count || 0,
  }));

  // Km reais origem → paragens → destino, devolvidos ao formulário para o preço da rota
  const orderedStops = useMemo(() => orderStopsAlongRoute(selection), [selection]);
  const stopsKey = orderedStops.map(p => p.name).join('|');

  useEffect(() => {
    if (!stopsKey || !hasCoords) return;
    let active = true;
    const timer = setTimeout(async () => {
      const { distanceKm } = await fetchRouteThroughPoints([origin, ...orderedStops, destination]);
      if (active && distanceKm) onChange(orderedStops, distanceKm);
    }, 700);
    return () => { active = false; clearTimeout(timer); };
  }, [stopsKey, hasCoords, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  const togglePlace = (place) => {
    if (selectedNames.includes(place.name)) {
      onChange(selection.filter(p => p.name !== place.name), null);
      return;
    }

    onChange([
      ...selection,
      {
        name: place.name,
        hours: 1,
        lat: place.lat,
        lng: place.lng,
        alongKm: place.alongKm ?? alongKmForPlace(place, route?.geometry),
      },
    ], null);

    base44.functions.invoke('recordPlaceSearch', {
      name: place.name,
      category: place.cat,
      lat: place.lat,
      lng: place.lng,
    }).then(loadPopular).catch(() => {});
  };

  if (!hasCoords) return null;

  const description = t(lang, 'places_prompt_desc')
    .replace('{origin}', shortName(originPlace.address))
    .replace('{destination}', shortName(destinationPlace.address));

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">{t(lang, 'places_prompt_title')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      {selection.some(place => place.name) && (
        <div className="flex flex-wrap gap-2">
          {selection.filter(place => place.name).map(place => (
            <span key={place.name} className="text-xs font-medium bg-secondary/15 text-secondary rounded-full px-2.5 py-1">
              {place.name}
            </span>
          ))}
        </div>
      )}

      {isLoadingRoute ? (
        <div className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{t(lang, 'rp_searching')}</span>
        </div>
      ) : (
        <>
          {route?.geometry?.length > 1 && (
            <Suspense fallback={<div className="w-full h-80 md:h-96 rounded-xl bg-muted animate-pulse" />}>
              <RoutePlacesMap geometry={route.geometry} places={places} origin={origin} destination={destination} />
            </Suspense>
          )}

          <RoutePlacesSearch lang={lang} selectedNames={selectedNames} onToggle={togglePlace} />
          <PopularPlaces places={popularPlaces} lang={lang} selectedNames={selectedNames} onToggle={togglePlace} />

          {places.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">{t(lang, 'rp_empty')}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {places.map(place => (
                <RoutePlaceCard
                  key={place.name}
                  place={place}
                  lang={lang}
                  isAdded={selectedNames.includes(place.name)}
                  onToggle={() => togglePlace(place)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}