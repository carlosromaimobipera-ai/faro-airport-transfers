import React from 'react';
import { MapContainer, Marker, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import BasemapTiles from '@/components/maps/BasemapTiles';
import { CATEGORIES } from '@/lib/routePlaces';

const pinSvg = (color) => encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
  <circle cx="12.5" cy="12.5" r="5" fill="white"/>
</svg>
`);

const pinIcon = (color) => L.divIcon({
  html: `<img src="data:image/svg+xml;charset=utf-8,${pinSvg(color)}" width="25" height="41" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"/>`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: '',
});

function FitRoute({ geometry }) {
  const map = useMap();

  React.useEffect(() => {
    if (geometry?.length > 1) {
      map.fitBounds(L.latLngBounds(geometry.map(p => [p.lat, p.lng])), { padding: [40, 40] });
    }
  }, [geometry, map]);

  return null;
}

export default function RoutePlacesMap({ geometry, places = [], origin, destination }) {
  const center = geometry?.[0] ? [geometry[0].lat, geometry[0].lng] : [37.0194, -7.9322];

  return (
    <div className="w-full h-80 md:h-96 rounded-xl overflow-hidden border border-border shadow-lg bg-muted">
      <MapContainer center={center} zoom={9} className="w-full h-full" scrollWheelZoom={false}>
        <BasemapTiles />
        <FitRoute geometry={geometry} />

        {geometry?.length > 1 && (
          <Polyline
            positions={geometry.map(p => [p.lat, p.lng])}
            color="hsl(199, 89%, 32%)"
            weight={4}
            opacity={0.85}
          />
        )}

        {places.map(place => (
          <CircleMarker
            key={`${place.name}-${place.lat}-${place.lng}`}
            center={[place.lat, place.lng]}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: CATEGORIES[place.cat]?.dot || '#096c9a',
              fillOpacity: 1,
            }}
          >
            <Tooltip>{place.name}</Tooltip>
          </CircleMarker>
        ))}

        {origin && <Marker position={[origin.lat, origin.lng]} icon={pinIcon('#16a34a')} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={pinIcon('#dc2626')} />}
      </MapContainer>
    </div>
  );
}