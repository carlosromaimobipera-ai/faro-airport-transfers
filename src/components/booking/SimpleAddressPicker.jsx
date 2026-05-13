import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, X, Search } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const COMMON_LOCATIONS_BASE = [
  { nameKey: 'common_location_airport',        icon: '✈️', coords: { lat: 37.0144, lng: -7.9699 } },
  { nameKey: 'common_location_lisbon_airport',  icon: '✈️', coords: { lat: 38.6747, lng: -9.1283 } },
  { nameKey: 'common_location_seville_airport', icon: '✈️', coords: { lat: 37.4174, lng: -5.8892 } },
  { nameKey: 'common_location_albufeira',       icon: '📍', coords: { lat: 37.0901, lng: -8.2506 } },
  { nameKey: 'common_location_vilamoura',       icon: '📍', coords: { lat: 37.0662, lng: -8.1212 } },
  { nameKey: 'common_location_lagos',           icon: '📍', coords: { lat: 37.1063, lng: -8.6705 } },
  { nameKey: 'common_location_portimao',        icon: '📍', coords: { lat: 37.1412, lng: -8.5292 } },
  { nameKey: 'common_location_armacao',         icon: '📍', coords: { lat: 37.0845, lng: -8.3642 } },
  { nameKey: 'common_location_tavira',          icon: '📍', coords: { lat: 36.9625, lng: -7.6533 } },
  { nameKey: 'common_location_center',          icon: '📍', coords: { lat: 37.0194, lng: -7.9322 } },
  { nameKey: 'common_location_silves',          icon: '📍', coords: { lat: 37.2425, lng: -8.4384 } },
  { nameKey: 'common_location_lisbon',          icon: '📍', coords: { lat: 38.7223, lng: -9.1393 } },
  { nameKey: 'common_location_seville',         icon: '📍', coords: { lat: 37.3860, lng: -5.9844 } },
];

// Load Google Maps Places library once
let googleMapsReady = null;
async function getGoogleMapsPlaces() {
  if (googleMapsReady) return googleMapsReady;
  if (!window.google?.maps?.importLibrary) return null;
  try {
    googleMapsReady = await window.google.maps.importLibrary('places');
    return googleMapsReady;
  } catch {
    return null;
  }
}

export default function SimpleAddressPicker({ label, value, onChange, placeholder }) {
  const { lang } = useLang();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const placesDiv = useRef(null);

  const COMMON_LOCATIONS = COMMON_LOCATIONS_BASE.map(loc => ({
    ...loc,
    name: `${loc.icon} ${t(lang, loc.nameKey)}`,
  }));

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync inputValue when parent passes a value
  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value?.address]);

  // Init Google Places services
  useEffect(() => {
    getGoogleMapsPlaces().then(lib => {
      if (!lib) return;
      if (lib.AutocompleteService) {
        autocompleteService.current = new lib.AutocompleteService();
      }
      if (lib.PlacesService) {
        if (!placesDiv.current) {
          placesDiv.current = document.createElement('div');
        }
        placesService.current = new lib.PlacesService(placesDiv.current);
      }
    });
  }, []);

  // Get coordinates from a placeId
  const getPlaceDetails = useCallback((placeId) => {
    return new Promise((resolve) => {
      if (!placesService.current) { resolve(null); return; }
      placesService.current.getDetails(
        { placeId, fields: ['name', 'formatted_address', 'geometry'] },
        (result, status) => {
          if (status !== 'OK' || !result?.geometry) { resolve(null); return; }
          const name = result.name;
          const addr = result.formatted_address;
          const displayName = name && addr && !addr.startsWith(name)
            ? `${name}, ${addr}`
            : addr || name;
          resolve({
            address: displayName,
            coords: {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            }
          });
        }
      );
    });
  }, []);

  // Fetch predictions via Google Places Autocomplete (browser-side)
  const fetchPredictions = useCallback(async (input) => {
    if (!input || input.length < 1) { setPredictions([]); setLoading(false); return; }

    if (!autocompleteService.current) {
      // Google not ready yet — skip
      setPredictions([]);
      setLoading(false);
      return;
    }

    autocompleteService.current.getPlacePredictions(
      {
        input,
        language: 'pt',
        componentRestrictions: { country: ['pt', 'es'] },
        types: ['establishment', 'geocode'],
      },
      async (results, status) => {
        if (status !== 'OK' || !results?.length) {
          setPredictions([]);
          setLoading(false);
          return;
        }

        const top5 = results.slice(0, 5);
        const detailed = await Promise.all(
          top5.map(r => getPlaceDetails(r.place_id).catch(() => null))
        );
        setPredictions(detailed.filter(Boolean));
        setLoading(false);
      }
    );
  }, [getPlaceDetails]);

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
    setInputValue(prediction.address);
    onChange({ address: prediction.address, coords: prediction.coords });
    setPredictions([]);
    setShowDropdown(false);
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
  const resolvedPlaceholder = placeholder || t(lang, 'select_place');

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
            {/* Google Places predictions */}
            {predictions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  {t(lang, 'search_results')}
                </div>
                {predictions.map((pred, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSelectPrediction(pred)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-start gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{pred.address}</span>
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