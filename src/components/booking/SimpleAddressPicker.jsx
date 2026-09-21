import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, X, Search } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { appParams } from '@/lib/app-params';

// --- LocalStorage cache for backend predictions ---
const PRED_CACHE_PREFIX = 'gmaps_pred_';
const PRED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function readCache(key, ttl) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || typeof entry !== 'object') return null;
    if (Date.now() - (entry.ts || 0) > ttl) return null;
    return entry.data;
  } catch { return null; }
}

function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch {}
}

function predCacheKey(lang, query) {
  const safe = encodeURIComponent(query.trim().toLowerCase());
  return `${PRED_CACHE_PREFIX}${lang}_${safe}`;
}

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

export default function SimpleAddressPicker({ label, value, onChange, placeholder }) {
  const { lang } = useLang();
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimer = useRef(null);

  const COMMON_LOCATIONS = COMMON_LOCATIONS_BASE.map(loc => ({
    ...loc,
    name: `${loc.icon} ${t(lang, loc.nameKey)}`,
  }));

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch predictions from backend function getPlacePredictions (server-side Google API key)
  const fetchPredictions = useCallback(async (input) => {
    if (!input || input.length < 2) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    const cached = readCache(predCacheKey(lang, input), PRED_TTL);
    if (cached) {
      setPredictions(cached);
      setLoading(false);
      return;
    }

    try {
      const { appId, token } = appParams;
      const apiBase = window.location.origin;
      const res = await fetch(
        `${apiBase}/api/apps/${appId}/functions/getPlacePredictions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ input }),
        }
      );
      const data = await res.json();
      const suggestions = (data.suggestions || []).slice(0, 5);
      if (suggestions.length) writeCache(predCacheKey(lang, input), suggestions);
      setPredictions(suggestions);
    } catch (err) {
      console.error('[SimpleAddressPicker] getPlacePredictions failed:', err);
      setError('fetch_failed');
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  // Debounce input → fetch
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = inputValue.trim();

    if (!trimmed || value?.coords) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(trimmed);
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [inputValue, value?.coords, fetchPredictions]);

  // Sync inputValue when parent clears value
  useEffect(() => {
    if (!value) setInputValue('');
  }, [value]);

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
    setPredictions([]);
    setShowDropdown(false);
    onChange({ address: prediction.address, coords: prediction.coords });
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
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const filteredCommon = COMMON_LOCATIONS.filter(loc =>
    !inputValue.trim() || loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const isDropdownVisible = showDropdown && !value?.coords;
  const hasContent = loading || predictions.length > 0 || filteredCommon.length > 0 || !!error;
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
          className="w-full h-14 pl-9 pr-10 rounded-xl border border-input bg-background text-foreground text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-muted/50 placeholder:text-muted-foreground transition-all cursor-text"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : value?.coords ? (
            <button onClick={handleClear} className="text-muted-foreground hover:text-foreground min-h-0 min-w-0">
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
                    onMouseDown={(e) => { e.preventDefault(); handleSelectPrediction(pred); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-start gap-2 min-h-0"
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
                    onMouseDown={(e) => { e.preventDefault(); handleSelectCommon(location); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border/50 last:border-0 flex items-center gap-2 min-h-0"
                  >
                    <span className="truncate">{location.name}</span>
                  </button>
                ))}
              </>
            )}

            {!loading && predictions.length === 0 && filteredCommon.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                {error === 'fetch_failed'
                  ? '⚠️ Erro ao procurar moradas. Verifica a consola do navegador.'
                  : t(lang, 'no_location_found')}
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