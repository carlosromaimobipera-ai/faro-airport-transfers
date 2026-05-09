import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Gauge } from 'lucide-react';
import { format, parseISO, subHours } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function DriverLocationMap() {
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['driver-locations-recent'],
    queryFn: () => base44.entities.DriverLocation.list('-recorded_at', 500),
    refetchInterval: 30_000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-loc'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  // Get latest location per driver (within last 2h)
  const latestPerDriver = useMemo(() => {
    const cutoff = subHours(new Date(), 2);
    const seen = new Map();
    for (const loc of locations) {
      if (!loc.recorded_at) continue;
      const ts = parseISO(loc.recorded_at);
      if (ts < cutoff) continue;
      if (!seen.has(loc.driver_id) || ts > parseISO(seen.get(loc.driver_id).recorded_at)) {
        seen.set(loc.driver_id, loc);
      }
    }
    return Array.from(seen.values());
  }, [locations]);

  // Group history by booking for the last 6h
  const recentHistory = useMemo(() => {
    const cutoff = subHours(new Date(), 6);
    return locations.filter(l => l.recorded_at && parseISO(l.recorded_at) > cutoff);
  }, [locations]);

  if (isLoading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Active drivers */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {latestPerDriver.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhum motorista com localização nas últimas 2 horas</p>
          </div>
        ) : latestPerDriver.map(loc => {
          const driver = drivers.find(d => d.id === loc.driver_id);
          const mapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
          const recordedAt = loc.recorded_at ? parseISO(loc.recorded_at) : null;

          return (
            <Card key={loc.driver_id} className="border-l-4 border-l-primary">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{loc.driver_name || driver?.name}</p>
                    {loc.booking_ref && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 mt-1">
                        {loc.booking_ref}
                      </Badge>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Ativo
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {recordedAt && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{format(recordedAt, "HH:mm:ss", { locale: pt })}</span>
                    </div>
                  )}
                  {loc.speed !== null && loc.speed !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{loc.speed} km/h</span>
                    </div>
                  )}
                  {loc.accuracy && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Precisão: ~{loc.accuracy}m</span>
                    </div>
                  )}
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Ver no Google Maps
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent history table */}
      {recentHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Histórico de posições (últimas 6h) · {recentHistory.length} registos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Hora</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Motorista</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Reserva</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Lat / Lng</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Vel.</th>
                  </tr>
                </thead>
                <tbody>
                  {recentHistory.slice(0, 50).map(loc => (
                    <tr key={loc.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono">
                        {loc.recorded_at ? format(parseISO(loc.recorded_at), 'HH:mm:ss') : '—'}
                      </td>
                      <td className="px-4 py-2">{loc.driver_name || '—'}</td>
                      <td className="px-4 py-2 font-mono text-primary">{loc.booking_ref || '—'}</td>
                      <td className="px-4 py-2 font-mono">
                        <a
                          href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {loc.lat?.toFixed(5)}, {loc.lng?.toFixed(5)}
                        </a>
                      </td>
                      <td className="px-4 py-2">{loc.speed != null ? `${loc.speed} km/h` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}