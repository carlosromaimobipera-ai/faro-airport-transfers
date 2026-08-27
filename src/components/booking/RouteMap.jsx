import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Inline SVG marker icons — no external network requests
const pinSvg = (color) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
  <circle cx="12.5" cy="12.5" r="5" fill="white"/>
</svg>
`);

const originIcon = L.divIcon({
  html: `<img src="data:image/svg+xml;charset=utf-8,${pinSvg('#16a34a')}" width="25" height="41" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"/>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: '',
});

const destIcon = L.divIcon({
  html: `<img src="data:image/svg+xml;charset=utf-8,${pinSvg('#dc2626')}" width="25" height="41" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"/>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: '',
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

export default function RouteMap({ originCoords, destinationCoords }) {
  const origin = originCoords ? { coords: originCoords } : null;
  const destination = destinationCoords ? { coords: destinationCoords } : null;
  
  const center = origin 
    ? [origin.coords.lat, origin.coords.lng] 
    : [37.0194, -7.9322]; // Default: Faro

  return (
    <div className="w-full h-72 md:h-96 rounded-xl overflow-hidden border border-border shadow-lg bg-muted">
      <MapContainer
        center={center}
        zoom={10}
        className="w-full h-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
            weight={4}
            dashArray="5, 5"
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}