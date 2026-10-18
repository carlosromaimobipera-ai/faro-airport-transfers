import React, { useRef, useState } from 'react';
import { TileLayer } from 'react-leaflet';

// Servidores de tiles gratuitos e sem chave de API.
// O primeiro é o principal; se os pedidos falharem, o mapa passa
// automaticamente para o seguinte (com a atribuição correspondente).
const PROVIDERS = [
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; Esri',
  },
  {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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