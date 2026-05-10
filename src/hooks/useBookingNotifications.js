import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook que subscreve reservas em tempo real e envia notificação push no browser
 * quando uma nova reserva é criada. Só funciona para utilizadores admin.
 */
export function useBookingNotifications(enabled = true) {
  const notifiedIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (!('Notification' in window)) return;

    // Pede permissão ao utilizador
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      if (event.type !== 'create') return;
      // Ignora o primeiro carregamento (já existentes)
      if (isFirstLoad.current) return;
      if (notifiedIds.current.has(event.id)) return;

      notifiedIds.current.add(event.id);

      if (Notification.permission !== 'granted') return;

      const booking = event.data;
      const title = `🚗 Nova Reserva — ${booking?.booking_ref || ''}`;
      const body = booking
        ? `${booking.customer_name} · ${booking.origin} → ${booking.destination} · €${Number(booking.price || 0).toFixed(0)}`
        : 'Nova reserva recebida';

      const notif = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: event.id,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    });

    // Após 2 segundos considera que o estado inicial foi carregado
    const timer = setTimeout(() => {
      isFirstLoad.current = false;
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [enabled]);
}