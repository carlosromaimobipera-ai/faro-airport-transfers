import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle2 } from 'lucide-react';

const COMMON_LOCATIONS = [
  { name: 'Aeroporto de Faro', coords: { lat: 37.0144, lng: -7.9699 } },
  { name: 'Centro Faro', coords: { lat: 37.0194, lng: -7.9322 } },
  { name: 'Vilamoura', coords: { lat: 37.0662, lng: -8.1212 } },
  { name: 'Albufeira', coords: { lat: 37.0901, lng: -8.2506 } },
  { name: 'Armação de Pêra', coords: { lat: 37.0845, lng: -8.3642 } },
  { name: 'Carmo (Faro)', coords: { lat: 37.0139, lng: -7.9275 } },
];

export default function SimpleAddressPicker({ label, value, onChange, placeholder = "Procurar morada ou selecionar..." }) {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = COMMON_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (location) => {
    setInputValue(location.name);
    onChange({ address: location.name, coords: location.coords });
    setShowSuggestions(false);
  };

  const handleCustomInput = (text) => {
    setInputValue(text);
    if (text.trim()) {
      onChange({ address: text, coords: null });
    }
  };

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
            handleCustomInput(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
        />
        {value?.address && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
        )}

        {/* Sugestões */}
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-lg z-50">
            {filtered.map((location) => (
              <button
                key={location.name}
                onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                {location.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {value?.address && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">{value.address}</p>
            {value.coords && (
              <p className="text-xs text-green-700 mt-1">
                Coordenadas: {value.coords.lat.toFixed(4)}°, {value.coords.lng.toFixed(4)}°
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}