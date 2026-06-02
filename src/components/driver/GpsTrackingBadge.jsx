import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Visual badge showing live GPS tracking status.
 */
export default function GpsTrackingBadge({ isTracking, activeBooking }) {
  if (isTracking && activeBooking) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        GPS ativo · {activeBooking.booking_ref}
      </div>
    );
  }

  if (isTracking) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        GPS a registar
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
      <MapPin className="w-3.5 h-3.5 shrink-0" />
      GPS em standby
    </div>
  );
}