import React, { useRef, useState } from 'react';
import { TileLayer } from 'react-leaflet';

// Servidores de mapas usados pelo app. Se um deles recusar os pedidos
// (como aconteceu com os servidores públicos do OpenStreetMap), o mapa
// passa automaticamente para o seguinte.
const PROVIDERS = [
  {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; Esri',
  },
];

export default function BasemapTiles() {
  const [index, setIndex] = useState(0);
  const switched = useRef(false);
  const provider = PROVIDERS[index];

  const handleTileError = () => {
    if (switched.current || index + 1 >= PROVIDERS.length) return;
    switched.current = true;
    setIndex(index + 1);
  };

  return (
    <TileLayer
      key={index}
      url={provider.url}
      attribution={provider.attribution}
      subdomains={provider.subdomains}
      maxZoom={provider.maxZoom}
      eventHandlers={{ tileerror: handleTileError }}
    />
  );
}