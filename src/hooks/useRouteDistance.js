import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { getEffectiveDistance } from '@/lib/transferData';

// Distância por estrada entre dois pontos (fallback para distância estimada)
export function useRouteDistance(originCoords, destinationCoords) {
  const [distance, setDistance] = useState(null);
  const [isLoadingDistance, setIsLoadingDistance] = useState(false);

  useEffect(() => {
    if (!originCoords || !destinationCoords) {
      setDistance(null);
      setIsLoadingDistance(false);
      return;
    }

    setIsLoadingDistance(true);
    setDistance(null);

    base44.functions.invoke('calculateDistance', {
      origin_lat: originCoords.lat,
      origin_lng: originCoords.lng,
      destination_lat: destinationCoords.lat,
      destination_lng: destinationCoords.lng,
    })
      .then(res => {
        const km = res.data?.distance_km;
        setDistance(km || getEffectiveDistance(originCoords, destinationCoords));
      })
      .catch(() => {
        setDistance(getEffectiveDistance(originCoords, destinationCoords));
      })
      .finally(() => setIsLoadingDistance(false));
  }, [originCoords?.lat, originCoords?.lng, destinationCoords?.lat, destinationCoords?.lng]);

  return { distance, isLoadingDistance };
}