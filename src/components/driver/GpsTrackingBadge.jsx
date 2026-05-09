import React, { useState, useEffect } from 'react';
import { MapPin, MapPinOff } from 'lucide-react';

/**
 * Visual badge showing GPS tracking status.
 * Polls every 30s to check if geolocation is available and if there's an active booking.
 */
export default function GpsTrackingBadge({ activeBooking }) {
  const [gpsAvailable, setGpsAvailable] = useState(null);

  useEffect(() => {
    setGpsAvailable(!!navigator.geolocation);
  }, []);

  if (gpsAvailable === null) return null;

  if (!gpsAvailable) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        <MapPinOff className="w-3.5 h-3.5" />
        GPS não disponível
      </div>
    );
  }

  if (!activeBooking) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
        <MapPin className="w-3.5 h-3.5" />
        GPS em standby
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <MapPin className="w-3.5 h-3.5" />
      GPS a registar · {activeBooking.booking_ref}
    </div>
  );
}