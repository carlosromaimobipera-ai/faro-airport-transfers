import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) return Promise.resolve();
  if (window._googleMapsLoading) return window._googleMapsLoading;
  window._googleMapsLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
  return window._googleMapsLoading;
}

export default function SimpleAddressPicker({ label, value, onChange, placeholder = "Procurar morada ou selecionar..." }) {
  const { lang } = useLang();
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [ready, setReady] = useState(false);

  const COMMON_LOCATIONS = [
    { name: t(lang, 'common_location_airport'), coords: { lat: 37.0144, lng: -7.9699 } },
    { name: t(lang, 'common_location_center'), coords: { lat: 37.0194, lng: -7.9322 } },
    { name: t(lang, 'common_location_vilamoura'), coords: { lat: 37.0662, lng: -8.1212 } },
    { name: t(lang, 'common_location_albufeira'), coords: { lat: 37.0901, lng: -8.2506 } },
    { name: t(lang, 'common_location_armacao'), coords: { lat: 37.0845, lng: -8.3642 } },
    { name: t(lang, 'common_location_carmo'), coords: { lat: 37.0139, lng: -7.9275 } },
  ];

  // Load API key and Google Maps
  useEffect(() => {
    base44.functions.invoke('getGoogleApiKey', {}).then(res => {
      if (res.data?.apiKey) {
        setApiKey(res.data.apiKey);
        loadGoogleMaps(res.data.apiKey).then(() => setReady(true)).catch(err => {
          console.error('Erro ao carregar Google Maps:', err);
          setReady(false);
        });
      }
    }).catch(err => console.error('Erro ao obter chave API:', err));
  }, []);

  // Initialize autocomplete
  useEffect(() => {
    if (!ready || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.AutocompleteService();
  }, [ready]);

  const handleInputChange = async (text) => {
    setInputValue(text);
    
    if (!text.trim() || !ready || !autocompleteRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await autocompleteRef.current.getPlacePredictions({
        input: text,
        componentRestrictions: { country: ['pt', 'es'] },
        types: ['geocode', 'establishment'],
      });

      setSuggestions(response.predictions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Erro ao buscar sugestões:', err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (prediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setLoading(true);

    try {
      // Fetch place details to get coordinates
      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      placesService.getDetails(
        { placeId: prediction.place_id, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            onChange({
              address: place.formatted_address || prediction.description,
              coords: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
            });
          } else {
            // Fallback: use description without coords (indicates unverified location)
            onChange({ address: prediction.description, coords: null });
          }
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('Erro ao obter detalhes do local:', err);
      setLoading(false);
    }
  };

  const handleSelect = (location) => {
    setInputValue(location.name);
    onChange({ address: location.name, coords: location.coords });
    setShowSuggestions(false);
  };

  if (!ready) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {label}
        </Label>
        <div className="h-12 px-4 flex items-center border border-amber-300 bg-amber-50 rounded-lg text-xs text-amber-700">
          ⏳ A carregar...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-primary" />
        {label}
      </Label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => inputValue.length > 0 && (suggestions.length > 0 || COMMON_LOCATIONS.some(l => l.name.toLowerCase().includes(inputValue.toLowerCase()))) && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-lg border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground transition-all"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        {value?.coords && !loading && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
        )}

        {/* Sugestões: Google Places + Locais Comuns */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-input rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
            {/* Google Places suggestions */}
            {suggestions.map((pred) => (
              <button
                key={pred.place_id}
                onClick={() => handleSelectSuggestion(pred)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 border-b border-border last:border-0"
              >
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pred.main_text}</p>
                  <p className="text-xs text-muted-foreground truncate">{pred.secondary_text}</p>
                </div>
              </button>
            ))}
            
            {/* Locais comuns se nenhuma sugestão do Google Places */}
            {suggestions.length === 0 && (
              <>
                {COMMON_LOCATIONS.filter(loc =>
                  loc.name.toLowerCase().includes(inputValue.toLowerCase())
                ).map((location) => (
                  <button
                    key={location.name}
                    onClick={() => handleSelect(location)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 border-b border-border last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {location.name}
                  </button>
                ))}
              </>
            )}
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