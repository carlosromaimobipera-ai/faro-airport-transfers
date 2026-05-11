import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';

const COMMON_LOCATIONS_BASE = [
  { nameKey: 'common_location_airport', icon: '✈️', coords: { lat: 37.0144, lng: -7.9699 } },
  { nameKey: 'common_location_lisbon_airport', icon: '✈️', coords: { lat: 38.6747, lng: -9.1283 } },
  { nameKey: 'common_location_seville_airport', icon: '✈️', coords: { lat: 37.4174, lng: -5.8892 } },
  { nameKey: 'common_location_albufeira', icon: '📍', coords: { lat: 37.0901, lng: -8.2506 } },
  { nameKey: 'common_location_vilamoura', icon: '📍', coords: { lat: 37.0662, lng: -8.1212 } },
  { nameKey: 'common_location_lagos', icon: '📍', coords: { lat: 37.1063, lng: -8.6705 } },
  { nameKey: 'common_location_portimao', icon: '📍', coords: { lat: 37.1412, lng: -8.5292 } },
  { nameKey: 'common_location_armacao', icon: '📍', coords: { lat: 37.0845, lng: -8.3642 } },
  { nameKey: 'common_location_tavira', icon: '📍', coords: { lat: 36.9625, lng: -7.6533 } },
  { nameKey: 'common_location_center', icon: '📍', coords: { lat: 37.0194, lng: -7.9322 } },
  { nameKey: 'common_location_silves', icon: '📍', coords: { lat: 37.2425, lng: -8.4384 } },
  { nameKey: 'common_location_lisbon', icon: '📍', coords: { lat: 38.7223, lng: -9.1393 } },
  { nameKey: 'common_location_seville', icon: '📍', coords: { lat: 37.3860, lng: -5.9844 } },
];

export default function SimpleAddressPicker({ label, value, onChange, placeholder }) {
  const { lang } = useLang();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const COMMON_LOCATIONS = COMMON_LOCATIONS_BASE.map(loc => ({
    ...loc,
    name: `${loc.icon} ${t(lang, loc.nameKey)}`,
  }));

  const resolvedPlaceholder = placeholder || t(lang, 'select_place');

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  // Sync inputValue when parent passes a value (e.g. user navigates back)
  useEffect(() => {
    setInputValue(value?.address || '');
  }, [value?.address]);

  // Fetch predictions from backend when user types
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    const trimmed = inputValue.trim();

    // If a location is already selected or input is empty, clear suggestions
    if (!trimmed || value?.coords) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke('getPlacePredictions', { input: trimmed });
        setSuggestions(res.data?.suggestions || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [inputValue, value?.coords]);

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

  const handleSelect = (location) => {
    const address = location.address || location.name?.replace(/^[\s✈️📍]+/, '').trim();
    setInputValue(address);
    onChange({ address, coords: location.coords });
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setSuggestions([]);
    setShowDropdown(true);
    if (inputRef.current) inputRef.current.focus();
  };

  const filteredCommon = COMMON_LOCATIONS.filter(loc =>
    !inputValue.trim() || loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const isDropdownVisible = showDropdown && !value?.coords;
  const hasContent = loading || suggestions.length > 0 || filteredCommon.length > 0;

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative">
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
          className="w-full h-12 px-4 pr-10 rounded-lg border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
            {suggestions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  {t(lang, 'search_results')}
                </div>
                {suggestions.map((loc, idx) => (
                  <button
                    key={`api-${idx}`}
                    onMouseDown={() => handleSelect(loc)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center gap-2"
                  >
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{loc.address}</span>
                  </button>
                ))}
              </>
            )}
            {filteredCommon.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  {t(lang, 'popular_locations')}
                </div>
                {filteredCommon.map((location) => (
                  <button
                    key={location.name}
                    onMouseDown={() => handleSelect(location)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center gap-2"
                  >
                    <span className="truncate">{location.name}</span>
                  </button>
                ))}
              </>
            )}
            {!loading && suggestions.length === 0 && filteredCommon.length === 0 && (
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