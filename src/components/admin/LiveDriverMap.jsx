import React, { useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { subHours, parseISO, format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Gauge, RefreshCw } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const driverStatusConfig = {
  on_the_way: { label: 'A caminho',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  on_site:    { label: 'No local',   color: 'bg-orange-100 text-orange-700 border-orange-200' },
  on_board:   { label: 'On Board',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
  done:       { label: 'Concluída',  color: 'bg-green-100 text-green-700 border-green-200' },
};

function createDriverIcon(name, isActive) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const bg = isActive ? '#0369a1' : '#94a3b8';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <ellipse cx="20" cy="46" rx="6" ry="2" fill="rgba(0,0,0,0.2)"/>
      <path d="M20 0 C9 0 0 9 0 20 C0 34 20 48 20 48 C20 48 40 34 40 20 C40 9 31 0 20 0Z" fill="${bg}"/>
      <circle cx="20" cy="19" r="12" fill="white" opacity="0.15"/>
      <text x="20" y="24" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">${initials}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
  });
}

export default function LiveDriverMap() {
  const { data: locations = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['driver-locations-live'],
    queryFn: () => base44.entities.DriverLocation.list('-recorded_at', 500),
    refetchInterval: 20_000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => base44.entities.Driver.list('name'),
  });

  const { data: activeBookings = [] } = useQuery({
    queryKey: ['bookings-in-progress'],
    queryFn: () => base44.entities.Booking.filter({ status: 'in_progress' }, '-transfer_date', 50),
    refetchInterval: 30_000,
  });

  // Latest position per driver (last 2h)
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

  // Algarve center
  const mapCenter = [37.1, -8.0];

  const lastUpdate = dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—';

  if (isLoading) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {latestPerDriver.length} motorista(s) ativos nas últimas 2h
          </span>
          {activeBookings.length > 0 && (
            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
              {activeBookings.length} viagens em curso
            </Badge>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-muted"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizado às {lastUpdate}
        </button>
      </div>

      {/* Map */}
      <Card className="overflow-hidden">
        <div style={{ height: '480px' }}>
          <MapContainer
            center={mapCenter}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {latestPerDriver.map(loc => {
              const driver = drivers.find(d => d.id === loc.driver_id);
              const name = loc.driver_name || driver?.name || '?';
              const booking = activeBookings.find(b => b.id === loc.booking_id);
              const isActive = !!booking;
              const recordedAt = loc.recorded_at ? parseISO(loc.recorded_at) : null;

              return (
                <React.Fragment key={loc.driver_id}>
                  <Marker
                    position={[loc.lat, loc.lng]}
                    icon={createDriverIcon(name, isActive)}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-1.5 text-sm">
                        <p className="font-bold text-base">{name}</p>
                        {loc.booking_ref && (
                          <p className="text-xs font-mono text-blue-600">{loc.booking_ref}</p>
                        )}
                        {booking?.driver_status && driverStatusConfig[booking.driver_status] && (
                          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${driverStatusConfig[booking.driver_status].color}`}>
                            {driverStatusConfig[booking.driver_status].label}
                          </span>
                        )}
                        {booking && (
                          <p className="text-xs text-muted-foreground">{booking.origin} → {booking.destination}</p>
                        )}
                        {recordedAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>⏱</span> {format(recordedAt, "HH:mm:ss", { locale: pt })}
                          </p>
                        )}
                        {loc.speed != null && (
                          <p className="text-xs text-muted-foreground">🚗 {loc.speed} km/h</p>
                        )}
                        <a
                          href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-blue-600 hover:underline"
                        >
                          Ver no Google Maps ↗
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                  {loc.accuracy && loc.accuracy < 500 && (
                    <Circle
                      center={[loc.lat, loc.lng]}
                      radius={loc.accuracy}
                      pathOptions={{ color: '#0369a1', fillColor: '#0369a1', fillOpacity: 0.08, weight: 1 }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>
      </Card>

      {/* Driver cards */}
      {latestPerDriver.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {latestPerDriver.map(loc => {
            const driver = drivers.find(d => d.id === loc.driver_id);
            const name = loc.driver_name || driver?.name || '?';
            const booking = activeBookings.find(b => b.id === loc.booking_id);
            const recordedAt = loc.recorded_at ? parseISO(loc.recorded_at) : null;

            return (
              <Card key={loc.driver_id} className="border-l-4 border-l-primary">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{name}</p>
                      {loc.booking_ref && (
                        <span className="text-xs font-mono text-blue-600">{loc.booking_ref}</span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Ativo
                    </span>
                  </div>
                  {booking?.driver_status && driverStatusConfig[booking.driver_status] && (
                    <Badge variant="outline" className={`text-xs ${driverStatusConfig[booking.driver_status].color}`}>
                      {driverStatusConfig[booking.driver_status].label}
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {recordedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(recordedAt, 'HH:mm:ss')}
                      </span>
                    )}
                    {loc.speed != null && (
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {loc.speed} km/h
                      </span>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full text-xs bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-1.5 rounded-lg transition-colors"
                  >
                    <MapPin className="w-3 h-3" />
                    Ver no Maps
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {latestPerDriver.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum motorista com localização nas últimas 2 horas</p>
          <p className="text-xs mt-1">A localização é atualizada automaticamente quando o motorista está em serviço</p>
        </div>
      )}
    </div>
  );
}