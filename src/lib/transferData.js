// Localizações pré-definidas com coordenadas
export const COMMON_LOCATIONS = [
  // Aeroportos
  { id: 'fao', name: 'Aeroporto de Faro (FAO)', coords: { lat: 37.0144, lng: -7.9699 }, type: 'airport' },
  { id: 'lis', name: 'Aeroporto de Lisboa (Humberto Delgado)', coords: { lat: 38.6747, lng: -9.1283 }, type: 'airport' },
  { id: 'svq', name: 'Aeroporto de Sevilha (SVQ)', coords: { lat: 37.4174, lng: -5.8892 }, type: 'airport' },
  
  // Algarve - Cidades
  { id: 'faro_center', name: 'Centro de Faro', coords: { lat: 37.0194, lng: -7.9322 }, type: 'city' },
  { id: 'vilamoura', name: 'Vilamoura', coords: { lat: 37.0662, lng: -8.1212 }, type: 'city' },
  { id: 'albufeira', name: 'Albufeira', coords: { lat: 37.0901, lng: -8.2506 }, type: 'city' },
  { id: 'armacao', name: 'Armação de Pêra', coords: { lat: 37.0845, lng: -8.3642 }, type: 'city' },
  { id: 'carmo', name: 'Carmo (Faro)', coords: { lat: 37.0139, lng: -7.9275 }, type: 'city' },
  { id: 'lagos', name: 'Lagos', coords: { lat: 37.1063, lng: -8.6705 }, type: 'city' },
  { id: 'portimao', name: 'Portimão', coords: { lat: 37.1412, lng: -8.5292 }, type: 'city' },
  { id: 'silves', name: 'Silves', coords: { lat: 37.2425, lng: -8.4384 }, type: 'city' },
  { id: 'tavira', name: 'Tavira', coords: { lat: 36.9625, lng: -7.6533 }, type: 'city' },
  
  // Lisboa
  { id: 'lis_center', name: 'Centro de Lisboa', coords: { lat: 38.7223, lng: -9.1393 }, type: 'city' },
  { id: 'chiado', name: 'Chiado, Lisboa', coords: { lat: 38.7111, lng: -9.1415 }, type: 'city' },
  { id: 'belem', name: 'Belém, Lisboa', coords: { lat: 38.7175, lng: -9.2033 }, type: 'city' },
  
  // Sevilha
  { id: 'seville_center', name: 'Centro de Sevilha', coords: { lat: 37.3860, lng: -5.9844 }, type: 'city' },
];

// Legacy: locations array para compatibilidade
export const locations = COMMON_LOCATIONS;

// Define allowed regions
const REGIONS = {
  FARO_MUNICIPALITY: { name: 'Faro (Município)', bounds: { lat: [36.94, 37.06], lng: [-8.63, -7.99] } },
  ALGARVE: { name: 'Algarve', bounds: { lat: [36.8, 37.3], lng: [-8.7, -7.8] } },
  PORTUGAL: { name: 'Portugal', bounds: { lat: [36.8, 42.2], lng: [-9.6, -6.1] } },
  SEVILLE: { name: 'Sevilha', bounds: { lat: [37.2, 37.5], lng: [-6.1, -5.8] } },
  SPAIN: { name: 'Espanha', bounds: { lat: [35.9, 43.8], lng: [-9.4, 4.4] } },
};

// Check if coordinates are in a region
function getRegionFromCoords(lat, lng) {
  // Verifica Algarve primeiro (mais específico dentro de Portugal)
  if (lat >= REGIONS.ALGARVE.bounds.lat[0] && lat <= REGIONS.ALGARVE.bounds.lat[1] &&
      lng >= REGIONS.ALGARVE.bounds.lng[0] && lng <= REGIONS.ALGARVE.bounds.lng[1]) {
    return 'ALGARVE';
  }
  
  // Verifica Sevilha (mais específico dentro de Espanha)
  if (lat >= REGIONS.SEVILLE.bounds.lat[0] && lat <= REGIONS.SEVILLE.bounds.lat[1] &&
      lng >= REGIONS.SEVILLE.bounds.lng[0] && lng <= REGIONS.SEVILLE.bounds.lng[1]) {
    return 'SEVILLE';
  }

  // Verifica Portugal continental
  if (lat >= REGIONS.PORTUGAL.bounds.lat[0] && lat <= REGIONS.PORTUGAL.bounds.lat[1] &&
      lng >= REGIONS.PORTUGAL.bounds.lng[0] && lng <= REGIONS.PORTUGAL.bounds.lng[1]) {
    return 'PORTUGAL';
  }

  // Verifica Espanha
  if (lat >= REGIONS.SPAIN.bounds.lat[0] && lat <= REGIONS.SPAIN.bounds.lat[1] &&
      lng >= REGIONS.SPAIN.bounds.lng[0] && lng <= REGIONS.SPAIN.bounds.lng[1]) {
    return 'SPAIN';
  }
  
  return null;
}

// Validate if route is allowed
export function isRouteAllowed(originCoords, destCoords) {
  if (!originCoords || !destCoords) return false;
  
  const originRegion = getRegionFromCoords(originCoords.lat, originCoords.lng);
  const destRegion = getRegionFromCoords(destCoords.lat, destCoords.lng);
  
  if (!originRegion || !destRegion) return false;
  
  // Bloqueia rota dentro do Algarve para o mesmo ponto (origem = destino exato)
  if (originCoords.lat === destCoords.lat && originCoords.lng === destCoords.lng) return false;

  // Permite qualquer rota cujo destino OU origem seja o Algarve
  const originInAlgarve = originRegion === 'ALGARVE';
  const destInAlgarve = destRegion === 'ALGARVE';
  if (originInAlgarve || destInAlgarve) return true;

  // Permite rotas dentro do Algarve (ambos no Algarve mas locais diferentes)
  if (originInAlgarve && destInAlgarve) return true;

  // Permite Lisboa ↔ Sevilha
  const originInPortugal = originRegion === 'PORTUGAL';
  const destInPortugal = destRegion === 'PORTUGAL';
  const originInSeville = originRegion === 'SEVILLE';
  const destInSeville = destRegion === 'SEVILLE';
  if ((originInPortugal && destInSeville) || (originInSeville && destInPortugal)) return true;

  return false;
}

// Get region name from coordinates
export function getRegionName(lat, lng) {
  const region = getRegionFromCoords(lat, lng);
  return region ? REGIONS[region].name : null;
}

// Route distances calculated from coordinates via Google Maps API
// Distance calculation is now dynamic based on coordinates
export const routeDistances = {};

// No pre-defined blocked routes
const BLOCKED_ROUTES = new Set([]);

// Distance is now calculated from coordinates only
export function getDistance() {
  return null; // Use coordinates-based calculation instead
}

// Pricing tiers per km
const PRICE_PER_KM_STANDARD = { sedan: 1.00, minivan: 1.20, minibus: 1.40 };
const PRICE_PER_KM_MID      = { sedan: 0.75, minivan: 0.80, minibus: 0.85 };
const PRICE_PER_KM_SPAIN    = { sedan: 0.95, minivan: 1.10, minibus: 1.20 };

// Calculate price
// Tiers: < 30 km → standard | 30–150 km → mid-range | > 150 km → standard | Spain → Spain rate
export function calculatePrice(distanceKm, vehicleTypeId, priceConfigs = [], durationMinutes = 0, isSpainRoute = false) {
  const vehicle = vehicleTypes.find(v => v.id === vehicleTypeId);
  if (!vehicle) return 0;
  if (!distanceKm) return 0;

  const vehicleConfig = priceConfigs.find(c => c.config_type === 'vehicle' && c.key === `vehicle_${vehicleTypeId}`);
  const standardPricePerKm = vehicleConfig ? vehicleConfig.value : PRICE_PER_KM_STANDARD[vehicleTypeId] ?? vehicle.pricePerKm;

  let pricePerKm;
  if (isSpainRoute) {
    pricePerKm = PRICE_PER_KM_SPAIN[vehicleTypeId] ?? standardPricePerKm;
  } else if (distanceKm < 30 || distanceKm > 150) {
    pricePerKm = standardPricePerKm;
  } else {
    pricePerKm = PRICE_PER_KM_MID[vehicleTypeId] ?? standardPricePerKm;
  }

  const calculatedPrice = Math.round(distanceKm * pricePerKm * 100) / 100;
  const minimumFares = { sedan: 15, minivan: 20, minibus: 25 };
  return Math.max(calculatedPrice, minimumFares[vehicleTypeId] || 0);
}

// Distance is calculated from coordinates using Haversine formula
export function getEffectiveDistance(originCoords, destinationCoords) {
  if (!originCoords || !destinationCoords) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (destinationCoords.lat - originCoords.lat) * Math.PI / 180;
  const dLng = (destinationCoords.lng - originCoords.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(originCoords.lat * Math.PI / 180) * Math.cos(destinationCoords.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 1.3 * 100) / 100; // +30% for road network
}

// Generate booking reference
export function generateBookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'TRF-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// Booking extras
export const BOOKING_EXTRAS = [
  {
    id: 'baby_seat',
    labelKey: 'extra_baby_seat',
    descriptionKey: 'extra_baby_seat_desc',
    price: 0,
    icon: 'Baby',
  },
  {
    id: 'meet_greet',
    labelKey: 'extra_meet_greet',
    descriptionKey: 'extra_meet_greet_desc',
    price: 0,
    icon: 'ShoppingBag',
  },
];

// Calculate extras total
export function calculateExtrasTotal(selectedExtras = []) {
  return BOOKING_EXTRAS
    .filter(e => selectedExtras.includes(e.id))
    .reduce((sum, e) => sum + e.price, 0);
}

// Vehicle types with pricing
export const vehicleTypes = [
  {
    id: "sedan",
    nameKey: "veh_sedan",
    seats: 4,
    luggage: 3,
    pricePerKm: 1.00,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/2f3fbb999_Kia_Ceed_SW.png",
    featureKeys: ["feat_ac", "feat_wifi", "feat_baby"],
  },
  {
    id: "minivan",
    nameKey: "veh_minivan",
    seats: 6,
    luggage: 5,
    pricePerKm: 1.20,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/6db18abaf_VK_Caddy_Maxi.jpg",
    featureKeys: ["feat_ac", "feat_wifi", "feat_luggage", "feat_baby"],
  },
  {
    id: "minibus",
    nameKey: "veh_minibus",
    seats: 8,
    luggage: 8,
    pricePerKm: 1.40,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/5e228dd60_Mercedes_vito.jpg",
    featureKeys: ["feat_ac", "feat_wifi", "feat_space", "feat_group", "feat_baby"],
  },
];