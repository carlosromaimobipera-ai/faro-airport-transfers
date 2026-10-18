import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, ArrowRight, Loader2 } from 'lucide-react';
import Navbar from '@/components/booking/Navbar';
import Footer from '@/components/booking/Footer';
import RoutePlacesMap from '@/components/maps/RoutePlacesMap';
import RoutePlaceCard from '@/components/booking/RoutePlaceCard';
import RouteVisitPlanner from '@/components/booking/RouteVisitPlanner';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { fetchRouteGeometry, geometryLengthKm, rankPlacesAlongRoute } from '@/lib/routePlaces';

function RoutePlacesEmpty({ lang, message }) {
  return (
    <div className="bg-muted/50 border border-border/60 rounded-xl p-6 text-center space-y-3">
      <MapPin className="w-6 h-6 text-muted-foreground mx-auto" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <a href="/" className="text-sm font-semibold text-primary hover:underline">
        {t(lang, 'rp_back')}
      </a>
    </div>
  );
}

export default function RoutePlaces() {
  const { lang } = useLang();
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [route, setRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selection, setSelection] = useState([]);
  const routeKmParam = parseFloat(params.get('km')) || null;
  const vehicleParam = params.get('veh') || '';
  const isSpainRoute = params.get('es') === '1';

  const origin = useMemo(() => ({
    lat: parseFloat(params.get('oLat')),
    lng: parseFloat(params.get('oLng')),
    name: params.get('o') || '',
  }), [params]);
  const destination = useMemo(() => ({
    lat: parseFloat(params.get('dLat')),
    lng: parseFloat(params.get('dLng')),
    name: params.get('d') || '',
  }), [params]);

  const hasCoords = [origin.lat, origin.lng, destination.lat, destination.lng].every(Number.isFinite);

  useEffect(() => {
    if (!hasCoords) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchRouteGeometry(origin, destination)
      .then(result => { if (active) setRoute(result); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [hasCoords, origin.lat, origin.lng, destination.lat, destination.lng]);

  const places = useMemo(() => (route ? rankPlacesAlongRoute(route.geometry) : []), [route]);
  const routeKm = routeKmParam ?? (route ? (route.distanceKm ?? geometryLengthKm(route.geometry)) : null);

  const togglePlace = (place) => setSelection(prev => (
    prev.some(p => p.name === place.name)
      ? prev.filter(p => p.name !== place.name)
      : [...prev, { name: place.name, hours: 1, lat: place.lat, lng: place.lng, alongKm: place.alongKm }]
  ));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{t(lang, 'rp_title')}</h1>
          <p className="text-muted-foreground text-sm mt-2">{t(lang, 'rp_sub')}</p>
        </div>

        {!hasCoords ? (
          <RoutePlacesEmpty lang={lang} message={t(lang, 'rp_no_route')} />
        ) : (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex flex-wrap items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium">{origin.name.split(',')[0]}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{destination.name.split(',')[0]}</span>
              {routeKm && <span className="text-muted-foreground">· {t(lang, 'rp_route').replace('{km}', routeKm)}</span>}
            </div>

            {route && route.geometry.length > 1 && (
              <RoutePlacesMap geometry={route.geometry} places={places} origin={origin} destination={destination} />
            )}

            <div className="grid lg:grid-cols-3 gap-6 items-start">
              <div className="lg:order-2 lg:sticky lg:top-24">
                <RouteVisitPlanner
                  selection={selection}
                  onChange={setSelection}
                  routeKm={routeKm}
                  origin={origin}
                  destination={destination}
                  initialVehicle={vehicleParam}
                  isSpainRoute={isSpainRoute}
                  lang={lang}
                />
              </div>

              <div className="lg:order-1 lg:col-span-2 space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t(lang, 'rp_searching')}</span>
                  </div>
                ) : places.length === 0 ? (
                  <RoutePlacesEmpty lang={lang} message={t(lang, 'rp_empty')} />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {places.map(place => (
                      <RoutePlaceCard
                        key={place.name}
                        place={place}
                        lang={lang}
                        isAdded={selection.some(p => p.name === place.name)}
                        onToggle={() => togglePlace(place)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>
      <Footer />
    </div>
  );
}