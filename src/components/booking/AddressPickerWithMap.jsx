import React, { useEffect, useRef, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from 'lucide-react';

function loadGoogleMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve();
  if (window._googleMapsLoading) return window._googleMapsLoading;
  window._googleMapsLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
  return window._googleMapsLoading;
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const DEFAULT_CENTER = { lat: 37.0194, lng: -7.9322 }; // Faro, PT

export default function AddressPickerWithMap({ label, value, onChange, placeholder = "Procurar morada, hotel ou clicar no mapa..." }) {
  const inputRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [inputValue, setInputValue] = useState(value?.address || '');

  // Load Google Maps
  useEffect(() => {
    if (!API_KEY) return;
    loadGoogleMaps(API_KEY).then(() => setReady(true));
  }, []);

  // Initialize autocomplete and map
  useEffect(() => {
    if (!ready || !inputRef.current) return;

    // Autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['pt', 'es'] },
      fields: ['formatted_address', 'geometry', 'name', 'opening_hours', 'photos'],
      types: ['geocode', 'establishment'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;
      
      const result = {
        address: place.formatted_address || place.name,
        coords: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        },
        name: place.name,
      };
      
      setInputValue(result.address);
      onChange(result);
      updateMap(result.coords);
    });
  }, [ready]);

  // Initialize map on first "show map" click
  useEffect(() => {
    if (!showMap || !mapRef.current || !ready) return;

    const center = value?.coords || DEFAULT_CENTER;
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center,
      mapTypeControl: true,
      streetViewControl: false,
    });

    // Add marker for current location
    if (value?.coords) {
      if (markerRef.current) markerRef.current.setMap(null);
      markerRef.current = new window.google.maps.Marker({
        map,
        position: center,
        title: value.address,
      });
    }

    // Click on map to select location
    const mapClickListener = map.addListener('click', async (e) => {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      
      // Reverse geocode to get address
      const geocoder = new window.google.maps.Geocoder();
      setSearching(true);
      geocoder.geocode({ location: coords }, (results, status) => {
        setSearching(false);
        if (status === 'OK' && results[0]) {
          const result = {
            address: results[0].formatted_address,
            coords,
            name: results[0].address_components[0]?.short_name,
          };
          setInputValue(result.address);
          onChange(result);
          updateMap(coords);
        }
      });
    });

    return () => {
      mapClickListener;
    };
  }, [showMap, ready, value]);

  const updateMap = (coords) => {
    if (!mapRef.current) return;
    const map = mapRef.current.map;
    if (!map) return;
    
    map.panTo(coords);
    if (markerRef.current) markerRef.current.setMap(null);
    markerRef.current = new window.google.maps.Marker({
      map,
      position: coords,
      title: inputValue,
    });
  };

  if (!API_KEY) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          {label}
        </Label>
        <div className="h-12 px-4 flex items-center border border-amber-300 bg-amber-50 rounded-md text-xs text-amber-700">
          Configure VITE_GOOGLE_PLACES_API_KEY para ativar mapa
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

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="w-full h-12 px-4 pl-10 rounded-md border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Map Toggle */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowMap(!showMap)}
        className="w-full gap-2"
      >
        <MapPin className="w-4 h-4" />
        {showMap ? 'Fechar Mapa' : 'Abrir Mapa Interativo'}
      </Button>

      {/* Map Container */}
      {showMap && (
        <div className="relative rounded-md overflow-hidden border border-border shadow-lg">
          <div
            ref={mapRef}
            className="w-full h-80 bg-muted"
          />
          {searching && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-lg p-2 text-xs text-muted-foreground border border-border">
            👆 Clique no mapa para selecionar o local exato
          </div>
        </div>
      )}

      {/* Selected Address Display */}
      {value?.address && (
        <div className="flex items-start gap-2 p-3 bg-primary/5 border border-primary/10 rounded-md">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">{value.address}</p>
            {value.coords && (
              <p className="text-xs text-muted-foreground">
                {value.coords.lat.toFixed(4)}, {value.coords.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}