import React, { useEffect, useRef, useState } from 'react';
import { Label } from "@/components/ui/label";
import { MapPin } from 'lucide-react';

// Loads Google Maps script once
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

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

export default function PlacesAutocomplete({ label, value, onChange, icon: Icon = MapPin, placeholder = "Escreva a morada..." }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!API_KEY) return;
    loadGoogleMaps(API_KEY).then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !inputRef.current) return;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['pt', 'es'] },
      fields: ['formatted_address', 'geometry', 'name'],
    });
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;
      const result = {
        address: place.formatted_address || place.name,
        coords: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
      };
      setInputValue(result.address);
      onChange(result);
    });
  }, [ready]);

  // Sync external value changes
  useEffect(() => {
    if (value?.address !== inputValue) {
      setInputValue(value?.address || '');
    }
  }, [value]);

  if (!API_KEY) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {label}
        </Label>
        <div className="h-12 px-4 flex items-center border border-amber-300 bg-amber-50 rounded-md text-xs text-amber-700">
          Configure VITE_GOOGLE_PLACES_API_KEY para ativar autocomplete
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </Label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-md border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}