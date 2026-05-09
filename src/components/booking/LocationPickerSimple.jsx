import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MapPin, CheckCircle2 } from 'lucide-react';
import { COMMON_LOCATIONS } from '@/lib/transferData';

export default function LocationPickerSimple({ label, value, onChange, placeholder = "Procurar localização..." }) {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredLocations = COMMON_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleSelect = (location) => {
    setInputValue(location.name);
    onChange({ name: location.name, id: location.id, coords: location.coords });
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className="h-12 px-4 rounded-lg border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
        />
        {value?.coords && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
        )}

        {/* Sugestões */}
        {showSuggestions && inputValue.trim().length > 0 && filteredLocations.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {filteredLocations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b border-border last:border-0 flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{loc.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {value?.coords && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-green-900">{value.name}</p>
            <p className="text-xs text-green-700 mt-1">
              Coordenadas: {value.coords.lat.toFixed(4)}°, {value.coords.lng.toFixed(4)}°
            </p>
          </div>
        </div>
      )}
    </div>
  );
}