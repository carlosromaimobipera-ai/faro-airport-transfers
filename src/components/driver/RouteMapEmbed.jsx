import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

export default function RouteMapEmbed({ origin, destination, originCoords, destinationCoords }) {
  const [loaded, setLoaded] = useState(false);

  // Build Google Maps embed URL with directions
  const buildUrl = () => {
    if (originCoords?.lat && destinationCoords?.lat) {
      return `https://www.google.com/maps/embed/v1/directions?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&origin=${originCoords.lat},${originCoords.lng}&destination=${destinationCoords.lat},${destinationCoords.lng}&mode=driving&language=pt`;
    }
    // Fallback to text addresses
    return `https://www.google.com/maps/embed/v1/directions?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&language=pt`;
  };

  // If no API key, show a static link
  if (!import.meta.env.VITE_GOOGLE_PLACES_API_KEY) {
    const mapsUrl = originCoords?.lat && destinationCoords?.lat
      ? `https://www.google.com/maps/dir/${originCoords.lat},${originCoords.lng}/${destinationCoords.lat},${destinationCoords.lng}`
      : `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`;

    return (
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full h-32 bg-muted rounded-xl border text-sm font-medium text-primary hover:bg-muted/80 transition-colors"
      >
        <MapPin className="w-4 h-4" />
        Ver rota no Google Maps
      </a>
    );
  }

  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden border">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}
      <iframe
        title="Rota"
        src={buildUrl()}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
      />
    </div>
  );
}