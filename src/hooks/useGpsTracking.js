import { useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Interval in ms between GPS saves
const TRACKING_INTERVAL_MS = 30_000; // 30 seconds

/**
 * Automatically starts GPS tracking when `activeBookings` contains
 * bookings whose transfer_time has been reached (within the last 4h).
 *
 * Stops when there are no more active bookings to track.
 */
export function useGpsTracking({ driver, activeBookings = [] }) {
  const intervalRef = useRef(null);
  const watchRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Determine which booking we are currently tracking
  // (the first in-progress one, or the first confirmed one whose time has come)
  const getActiveBookingForTracking = useCallback(() => {
    if (!activeBookings.length) return null;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Priority 1: in_progress bookings today OR bookings with driver_status started
    const inProgress = activeBookings.find(b =>
      b.transfer_date === todayStr &&
      (b.status === 'in_progress' || ['on_the_way', 'on_site', 'on_board'].includes(b.driver_status))
    );
    if (inProgress) return inProgress;

    // Priority 2: confirmed/pending bookings today whose time has come (±15 min before)
    const upcoming = activeBookings.find(b => {
      if (b.transfer_date !== todayStr) return false;
      if (!b.transfer_time) return false;
      const [h, m] = b.transfer_time.split(':').map(Number);
      const bookingTime = new Date(now);
      bookingTime.setHours(h, m, 0, 0);
      const diffMs = bookingTime - now;
      // Start tracking 15 min before and up to 4h after
      return diffMs <= 15 * 60 * 1000 && diffMs >= -4 * 60 * 60 * 1000;
    });

    return upcoming || null;
  }, [activeBookings]);

  const savePosition = useCallback(async (position, booking) => {
    if (!driver?.id) return;
    lastPositionRef.current = position;

    await base44.entities.DriverLocation.create({
      driver_id: driver.id,
      driver_name: driver.name,
      booking_id: booking?.id || null,
      booking_ref: booking?.booking_ref || null,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
      speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : null, // m/s → km/h
      heading: position.coords.heading || null,
      recorded_at: new Date(position.timestamp).toISOString(),
    });
  }, [driver]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    // Watch position for fresh coords
    if (watchRef.current === null) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => { lastPositionRef.current = pos; },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }

    // Save on interval
    if (intervalRef.current === null) {
      intervalRef.current = setInterval(async () => {
        const booking = getActiveBookingForTracking();
        if (!booking && !lastPositionRef.current) return;
        // If no active booking window, stop saving (but keep watch alive)
        if (!booking) return;

        if (lastPositionRef.current) {
          await savePosition(lastPositionRef.current, booking);
        } else {
          // Request a fresh position
          navigator.geolocation.getCurrentPosition(
            (pos) => savePosition(pos, booking),
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      }, TRACKING_INTERVAL_MS);
    }
  }, [getActiveBookingForTracking, savePosition]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    lastPositionRef.current = null;
  }, []);

  useEffect(() => {
    if (!driver?.id) return;

    const booking = getActiveBookingForTracking();

    if (booking) {
      startTracking();
    } else {
      stopTracking();
    }

    // Re-evaluate every minute
    const timer = setInterval(() => {
      const b = getActiveBookingForTracking();
      if (b) startTracking();
      else stopTracking();
    }, 60_000);

    return () => {
      clearInterval(timer);
      stopTracking();
    };
  }, [driver, activeBookings, getActiveBookingForTracking, startTracking, stopTracking]);
}