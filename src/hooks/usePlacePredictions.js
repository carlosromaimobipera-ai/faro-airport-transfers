import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

// Sugestões de locais reais (Google Places) para a pesquisa de locais na rota.
// Devolve { predictions, loading }, com nome curto, morada completa e coordenadas.
export default function usePlacePredictions(query) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const input = (query || '').trim();

    if (input.length < MIN_QUERY_LENGTH) {
      setPredictions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    const timer = setTimeout(() => {
      base44.functions
        .invoke('getPlacePredictions', { input })
        .then(res => {
          if (!active) return;
          const places = (res.data?.suggestions || [])
            .filter(s => Number.isFinite(s.coords?.lat) && Number.isFinite(s.coords?.lng))
            .map(s => ({
              name: (s.address || '').split(',')[0].trim(),
              address: s.address,
              lat: s.coords.lat,
              lng: s.coords.lng,
            }));
          setPredictions(places);
        })
        .catch(() => { if (active) setPredictions([]); })
        .finally(() => { if (active) setLoading(false); });
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return { predictions, loading };
}