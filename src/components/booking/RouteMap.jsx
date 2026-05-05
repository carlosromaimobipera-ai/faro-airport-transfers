import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { locations } from '@/lib/transferData';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ origin, destination }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(
        [origin.coords.lat, origin.coords.lng],
        [destination.coords.lat, destination.coords.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.setView([origin.coords.lat, origin.coords.lng], 12);
    }
  }, [origin, destination, map]);

  return null;
}

export default function RouteMap({ originId, destinationId }) {
  const origin = locations.find(l => l.id === originId);
  const destination = locations.find(l => l.id === destinationId);
  
  const center = origin 
    ? [origin.coords.lat, origin.coords.lng] 
    : [37.0194, -7.9322]; // Default: Faro

  return (
    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-border/60 shadow-sm">
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds origin={origin} destination={destination} />

        {origin && (
          <Marker position={[origin.coords.lat, origin.coords.lng]} icon={originIcon} />
        )}
        
        {destination && (
          <Marker position={[destination.coords.lat, destination.coords.lng]} icon={destIcon} />
        )}

        {origin && destination && (
          <Polyline
            positions={[
              [origin.coords.lat, origin.coords.lng],
              [destination.coords.lat, destination.coords.lng],
            ]}
            color="hsl(199, 89%, 32%)"
            weight={3}
            dashArray="10, 10"
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}