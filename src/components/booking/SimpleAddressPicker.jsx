import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

export default function SimpleAddressPicker({ label, value, onChange, placeholder = "Procurar morada ou selecionar..." }) {
  const { lang } = useLang();
  const debounceTimer = useRef(null);

  const COMMON_LOCATIONS = [
    { name: t(lang, 'common_location_airport'), coords: { lat: 37.0144, lng: -7.9699 } },
    { name: t(lang, 'common_location_center'), coords: { lat: 37.0194, lng: -7.9322 } },
    { name: t(lang, 'common_location_vilamoura'), coords: { lat: 37.0662, lng: -8.1212 } },
    { name: t(lang, 'common_location_albufeira'), coords: { lat: 37.0901, lng: -8.2506 } },
    { name: t(lang, 'common_location_armacao'), coords: { lat: 37.0845, lng: -8.3642 } },
    { name: t(lang, 'common_location_carmo'), coords: { lat: 37.0139, lng: -7.9275 } },
  ];

  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch suggestions when user types
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await base44.functions.invoke('geocodeAddress', { address: inputValue });
        setSuggestions(res.data?.suggestions || []);
      } catch (err) {
        console.error('Erro ao buscar moradas:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [inputValue]);

  const handleSelect = (location) => {
    setInputValue(location.address);
    onChange({ address: location.address, coords: location.coords });
    setShowSuggestions(false);
  };

  const allSuggestions = suggestions.length > 0 
    ? suggestions 
    : COMMON_LOCATIONS.filter(loc =>
        loc.name.toLowerCase().includes(inputValue.toLowerCase())
      ).map(loc => ({ address: loc.name, coords: loc.coords }));

  return (
    <div className="space-y-2">
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
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        ) : value?.coords && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
        )}

        {/* Sugestões */}
        {showSuggestions && inputValue.trim().length > 0 && allSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {allSuggestions.map((location, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{location.address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value?.coords && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">{value.address}</p>
            <p className="text-xs text-green-700 mt-1">
              Coordenadas: {value.coords.lat.toFixed(4)}°, {value.coords.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      )}
    </div>
  );
}