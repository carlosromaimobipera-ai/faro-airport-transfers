import { useEffect, useRef, useState } from 'react';

export function usePullToRefresh(onRefresh) {
  const containerRef = useRef(null);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef(0);
  const isRefreshing = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        touchStartY.current = e.touches[0].clientY;
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e) => {
      if (!isPulling || isRefreshing.current) return;
      
      const touchY = e.touches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      const touchY = e.changedTouches[0].clientY;
      const diff = touchY - touchStartY.current;
      
      if (diff > 60 && container.scrollTop === 0 && !isRefreshing.current) {
        isRefreshing.current = true;
        onRefresh?.then(() => {
          isRefreshing.current = false;
          setIsPulling(false);
        }).catch(() => {
          isRefreshing.current = false;
          setIsPulling(false);
        });
      } else {
        setIsPulling(false);
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return { containerRef, isPulling };
}