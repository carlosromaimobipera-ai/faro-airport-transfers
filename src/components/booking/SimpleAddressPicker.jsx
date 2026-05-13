import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, X, Search } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

// Load Google Maps script once globally
function loadGoogleMaps() {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window._googleMapsPromise) return window._googleMapsPromise;

  if (!GOOGLE_API_KEY) {
    console.error('[SimpleAddressPicker] VITE_GOOGLE_PLACES_API_KEY não está definida!');
    return Promise.reject(new Error('Missing VITE_GOOGLE_PLACES_API_KEY'));
  }

  console.log('[SimpleAddressPicker] A carregar Google Maps com chave:', GOOGLE_API_KEY.slice(0, 8) + '...');

  window._googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&language=pt`;
    script.async = true;
    script.onload = () => {
      console.log('[SimpleAddressPicker] Google Maps carregado com sucesso!');
      resolve();
    };
    script.onerror = (err) => {
      console.error('[SimpleAddressPicker] Erro ao carregar Google Maps:', err);
      window._googleMapsPromise = null; // reset para permitir retry
      reject(err);
    };
    document.head.appendChild(script);
  });
  return window._googleMapsPromise;
}

const COMMON_LOCATIONS_BASE = [
  { nameKey: 'common_location_airport',       icon: '✈️', coords: { lat: 37.0144, lng: -7.9699 } },
  { nameKey: 'common_location_lisbon_airport', icon: '✈️', coords: { lat: 38.6747, lng: -9.1283 } },
  { nameKey: 'common_location_seville_airport',icon: '✈️', coords: { lat: 37.4174, lng: -5.8892 } },
  { nameKey: 'common_location_albufeira',      icon: '📍', coords: { lat: 37.0901, lng: -8.2506 } },
  { nameKey: 'common_location_vilamoura',      icon: '📍', coords: { lat: 37.0662, lng: -8.1212 } },
  { nameKey: 'common_location_lagos',          icon: '📍', coords: { lat: 37.1063, lng: -8.6705 } },
  { nameKey: 'common_location_portimao',       icon: '📍', coords: { lat: 37.1412, lng: -8.5292 } },
  { nameKey: 'common_location_armacao',        icon: '📍', coords: { lat: 37.0845, lng: -8.3642 } },
  { nameKey: 'common_location_tavira',         icon: '📍', coords: { lat: 36.9625, lng: -7.6533 } },
  { nameKey: 'common_location_center',         icon: '📍', coords: { lat: 37.0194, lng: -7.9322 } },
  { nameKey: 'common_location_silves',         icon: '📍', coords: { lat: 37.2425, lng: -8.4384 } },
  { nameKey: 'common_location_lisbon',         icon: '📍', coords: { lat: 38.7223, lng: -9.1393 } },
  { nameKey: 'common_location_seville',        icon: '📍', coords: { lat: 37.3860, lng: -5.9844 } },
];

export default function SimpleAddressPicker({ label, value, onChange, placeholder }) {
  const { lang } = useLang();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);

  const COMMON_LOCATIONS = COMMON_LOCATIONS_BASE.map(loc => ({
    ...loc,
    name: `${loc.icon} ${t(lang, loc.nameKey)}`,
  }));

  const resolvedPlaceholder = placeholder || t(lang, 'select_place');

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const debounceTimer = useRef(null);

  // Load Google Maps and init services
  useEffect(() => {
    if (!GOOGLE_API_KEY) {
      console.warn('[SimpleAddressPicker] Chave API em falta — só locais populares disponíveis.');
      return;
    }
    loadGoogleMaps()
      .then(() => {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
        setGoogleReady(true);
        console.log('[SimpleAddressPicker] Serviços Google Places inicializados com sucesso.');
      })
      .catch((err) => {
        console.error('[SimpleAddressPicker] Falha ao inicializar Google Places:', err);
      });
  }, []);

  // Sync inputValue when parent passes a value
  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value?.address]);

  // Fetch predictions from Google Places API directly in frontend
  const fetchPredictions = useCallback((input) => {
    if (!googleReady || !autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }
    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input,
        sessionToken: sessionToken.current,
        componentRestrictions: { country: ['pt', 'es'] },
        types: ['geocode', 'establishment'],
      },
      (results, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results.slice(0, 5));
        } else {
          setPredictions([]);
        }
      }
    );
  }, [googleReady]);

  // Debounce input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const trimmed = inputValue.trim();

    if (!trimmed || value?.coords) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(trimmed);
    }, 200);

    return () => clearTimeout(debounceTimer.current);
  }, [inputValue, value?.coords, fetchPredictions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectPrediction = (prediction) => {
    setLoading(true);
    // New session token after selection
    sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name'],
        sessionToken: sessionToken.current,
      },
      (place, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry) {
          const address = place.formatted_address || place.name;
          setInputValue(address);
          onChange({ address, coords: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } });
        }
        setPredictions([]);
        setShowDropdown(false);
      }
    );
  };

  const handleSelectCommon = (location) => {
    const address = location.name.replace(/^[\s✈️📍]+/, '').trim();
    setInputValue(address);
    onChange({ address, coords: location.coords });
    setPredictions([]);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setPredictions([]);
    setShowDropdown(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const filteredCommon = COMMON_LOCATIONS.filter(loc =>
    !inputValue.trim() || loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const isDropdownVisible = showDropdown && !value?.coords;
  const hasContent = loading || predictions.length > 0 || filteredCommon.length > 0;

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(null);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={resolvedPlaceholder}
          autoComplete="off"
          className="w-full h-14 pl-9 pr-10 rounded-xl border border-input bg-gray-50 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-gray-100 placeholder:text-muted-foreground transition-all cursor-text"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : value?.coords ? (
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {isDropdownVisible && hasContent && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
            {/* Google predictions */}
            {predictions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  {t(lang, 'search_results')}
                </div>
                {predictions.map((pred) => (
                  <button
                    key={pred.place_id}
                    onMouseDown={() => handleSelectPrediction(pred)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-foreground">{pred.structured_formatting?.main_text}</span>
                      {pred.structured_formatting?.secondary_text && (
                        <span className="block text-xs text-muted-foreground">{pred.structured_formatting.secondary_text}</span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Popular locations */}
            {filteredCommon.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  {t(lang, 'popular_locations')}
                </div>
                {filteredCommon.map((location) => (
                  <button
                    key={location.nameKey}
                    onMouseDown={() => handleSelectCommon(location)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center gap-2"
                  >
                    <span className="truncate">{location.name}</span>
                  </button>
                ))}
              </>
            )}

            {!loading && predictions.length === 0 && filteredCommon.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                {t(lang, 'no_location_found')}
              </div>
            )}
          </div>
        )}
      </div>

      {value?.coords && (
        <p className="text-xs text-green-700 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {value.address}
        </p>
      )}
    </div>
  );
}