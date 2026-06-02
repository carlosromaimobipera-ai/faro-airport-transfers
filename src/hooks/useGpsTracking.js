import { useEffect, useRef, useCallback, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Interval in ms between GPS saves
const TRACKING_INTERVAL_MS = 15_000; // 15 seconds

/**
 * Tracks GPS continuously whenever the driver has ANY non-cancelled booking today.
 * Saves position every 15s. Returns { isTracking, gpsPermission }.
 */
export function useGpsTracking({ driver, activeBookings = [] }) {
  const intervalRef = useRef(null);
  const watchRef = useRef(null);
  const lastPositionRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);

  // Find the most relevant booking to tag the location with
  const getActiveBookingForTracking = useCallback(() => {
    if (!activeBookings.length) return null;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Priority 1: in_progress or driver already started steps
    const inProgress = activeBookings.find(b =>
      b.transfer_date === todayStr &&
      (b.status === 'in_progress' || ['on_the_way', 'on_site', 'on_board'].includes(b.driver_status))
    );
    if (inProgress) return inProgress;

    // Priority 2: any confirmed booking today (track all day)
    const todayBooking = activeBookings.find(b =>
      b.transfer_date === todayStr &&
      b.status !== 'cancelled' &&
      b.status !== 'completed'
    );
    return todayBooking || null;
  }, [activeBookings]);

  const hasTodayBookings = useCallback(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return activeBookings.some(b =>
      b.transfer_date === todayStr &&
      b.status !== 'cancelled' &&
      b.status !== 'completed'
    );
  }, [activeBookings]);

  const savePosition = useCallback(async (position) => {
    if (!driver?.id) return;
    const booking = getActiveBookingForTracking();
    lastPositionRef.current = position;

    await base44.entities.DriverLocation.create({
      driver_id: driver.id,
      driver_name: driver.name,
      booking_id: booking?.id || null,
      booking_ref: booking?.booking_ref || null,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null,
      speed: position.coords.speed ? Math.round(position.coords.speed * 3.6) : null,
      heading: position.coords.heading || null,
      recorded_at: new Date(position.timestamp).toISOString(),
    });
  }, [driver, getActiveBookingForTracking]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) return;

    if (watchRef.current === null) {
      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => { lastPositionRef.current = pos; },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    }

    if (intervalRef.current === null) {
      setIsTracking(true);
      intervalRef.current = setInterval(async () => {
        if (!hasTodayBookings()) return;

        if (lastPositionRef.current) {
          await savePosition(lastPositionRef.current);
        } else {
          navigator.geolocation.getCurrentPosition(
            (pos) => savePosition(pos),
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
          );
        }
      }, TRACKING_INTERVAL_MS);
    }
  }, [hasTodayBookings, savePosition]);

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
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (!driver?.id) return;

    if (hasTodayBookings()) {
      startTracking();
    } else {
      stopTracking();
    }

    const timer = setInterval(() => {
      if (hasTodayBookings()) startTracking();
      else stopTracking();
    }, 60_000);

    return () => {
      clearInterval(timer);
      stopTracking();
    };
  }, [driver, activeBookings, hasTodayBookings, startTracking, stopTracking]);

  return { isTracking };
}