import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COMMON_LOCATIONS = [
  { name: '✈️ Aeroporto de Faro (FAO)', coords: { lat: 37.0144, lng: -7.9699 } },
  { name: '✈️ Aeroporto de Lisboa (Humberto Delgado)', coords: { lat: 38.6747, lng: -9.1283 } },
  { name: '✈️ Aeroporto de Sevilha (SVQ)', coords: { lat: 37.4174, lng: -5.8892 } },
  { name: '📍 Albufeira', coords: { lat: 37.0901, lng: -8.2506 } },
  { name: '📍 Vilamoura', coords: { lat: 37.0662, lng: -8.1212 } },
  { name: '📍 Lagos', coords: { lat: 37.1063, lng: -8.6705 } },
  { name: '📍 Portimão', coords: { lat: 37.1412, lng: -8.5292 } },
  { name: '📍 Armação de Pêra', coords: { lat: 37.0845, lng: -8.3642 } },
  { name: '📍 Tavira', coords: { lat: 36.9625, lng: -7.6533 } },
  { name: '📍 Centro de Faro', coords: { lat: 37.0194, lng: -7.9322 } },
  { name: '📍 Silves', coords: { lat: 37.2425, lng: -8.4384 } },
  { name: '📍 Centro de Lisboa', coords: { lat: 38.7223, lng: -9.1393 } },
  { name: '📍 Centro de Sevilha', coords: { lat: 37.3860, lng: -5.9844 } },
];

export default function SimpleAddressPicker({ label, value, onChange, placeholder = "Procurar morada ou selecionar..." }) {
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch Google Places suggestions with debounce
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    const trimmed = inputValue.trim();
    if (!trimmed) {
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
  }, [inputValue]);

  const handleSelect = (location) => {
    const address = location.address || location.name?.replace(/^[^\w]+/, '').trim();
    setInputValue(address);
    onChange({ address, coords: location.coords });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setSuggestions([]);
  };

  const filteredCommon = COMMON_LOCATIONS.filter(loc =>
    !inputValue.trim() || loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showDropdown = showSuggestions && (loading || suggestions.length > 0 || filteredCommon.length > 0);

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(null); // reset selection when typing
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
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

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
            {/* API results */}
            {suggestions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  Resultados
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

            {/* Common locations */}
            {filteredCommon.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 border-b border-border">
                  Locais populares
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
                Nenhuma localização encontrada
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