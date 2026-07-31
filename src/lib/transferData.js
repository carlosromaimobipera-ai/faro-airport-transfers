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

// Tarifas por km por distância e veículo
const PRICE_PER_KM = {
  short:  { sedan: 1.05, minivan: 1.25, minibus: 1.45 }, // < 30 km
  mid:    { sedan: 0.80, minivan: 0.90, minibus: 1.00 }, // 30–150 km
  long:   { sedan: 1.10, minivan: 1.25, minibus: 1.50 }, // > 150 km
  spain:  { sedan: 1.00, minivan: 1.15, minibus: 1.25 }, // Espanha
};

// Tarifas mínimas
const MINIMUM_FARES = {
  sedan:   15,
  minivan: 20,
  minibus: 25,
};

// Apply dynamic price rules to a base price
// Rules are additive: each matching rule adds (multiplier - 1) to the combined factor
// e.g. season +20% AND weekend +10% = base * 1.30
export function applyPriceRules(basePrice, rules = [], { transferDate, vehicleTypeId, isSpainRoute = false, distanceKm = 0 } = {}) {
  if (!rules.length) return basePrice;

  const activeRules = rules.filter(r => r.active);
  if (!activeRules.length) return basePrice;

  const sorted = [...activeRules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  let combined = 1.0; // base multiplier

  for (const rule of sorted) {
    // Check vehicle filter
    if (rule.vehicle_types?.length && !rule.vehicle_types.includes(vehicleTypeId)) continue;

    // Check route region filter
    if (rule.route_region && rule.route_region !== 'all') {
      if (rule.route_region === 'spain' && !isSpainRoute) continue;
      if (rule.route_region === 'lisbon' && !(distanceKm > 200 && !isSpainRoute)) continue;
      if (rule.route_region === 'algarve_local' && distanceKm > 80) continue;
    }

    let matches = false;

    if (rule.rule_type === 'season' && transferDate && rule.date_from && rule.date_to) {
      matches = transferDate >= rule.date_from && transferDate <= rule.date_to;
    } else if (rule.rule_type === 'weekday' && transferDate && rule.weekdays?.length) {
      const dow = new Date(transferDate + 'T12:00:00').getDay();
      matches = rule.weekdays.includes(dow);
    } else if (rule.rule_type === 'vehicle') {
      // vehicle filter already applied above; if we got here, it matches
      matches = true;
    } else if (rule.rule_type === 'route_region') {
      matches = true; // region filter already applied above
    }

    if (matches) {
      combined += (parseFloat(rule.multiplier) || 1) - 1;
    }
  }

  const finalPrice = Math.round(basePrice * combined * 100) / 100;
  return Math.max(finalPrice, basePrice * 0.5); // never go below 50% of base
}

// Calcula preço: distância × tarifa/km por tier, com mínimo garantido
export function calculatePrice(distanceKm, vehicleTypeId, priceConfigs = [], durationMinutes = 0, isSpainRoute = false, priceRules = [], transferDate = null) {
  if (!vehicleTypes.find(v => v.id === vehicleTypeId)) return 0;
  if (!distanceKm) return 0;

  let tier;
  // premium uses same pricing as minivan
  const pricingId = vehicleTypeId === 'premium' ? 'minivan' : vehicleTypeId;

  if (isSpainRoute)       tier = 'spain';
  else if (distanceKm < 30)  tier = 'short';
  else if (distanceKm <= 150) tier = 'mid';
  else                    tier = 'long';

  const rate = PRICE_PER_KM[tier][pricingId];
  const calculated = Math.round(distanceKm * rate * 100) / 100;
  return Math.max(calculated, MINIMUM_FARES[vehicleTypeId] || 15);
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
    seats: 3,
    luggage: 3,
    maxPassengers: 3,
    maxLuggage: 3,
    pricePerKm: 1.05,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/2f3fbb999_Kia_Ceed_SW.png",
    featureKeys: ["feat_ac", "feat_wifi", "feat_baby"],
  },
  {
    id: "premium",
    nameKey: "veh_premium",
    seats: 3,
    luggage: 3,
    maxPassengers: 3,
    maxLuggage: 3,
    pricePerKm: 1.25,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/3e7495004_generated_image.png",
    featureKeys: ["feat_ac", "feat_wifi", "feat_baby"],
  },
  {
    id: "minivan",
    nameKey: "veh_minivan",
    seats: 5,
    luggage: 5,
    maxPassengers: 5,
    maxLuggage: 5,
    pricePerKm: 1.25,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/6db18abaf_VK_Caddy_Maxi.jpg",
    featureKeys: ["feat_ac", "feat_wifi", "feat_luggage", "feat_baby"],
  },
  {
    id: "minibus",
    nameKey: "veh_minibus",
    seats: 8,
    luggage: 8,
    maxPassengers: 8,
    maxLuggage: 8,
    pricePerKm: 1.45,
    image: "https://media.base44.com/images/public/69f9fe03f147edc32575e815/5e228dd60_Mercedes_vito.jpg",
    featureKeys: ["feat_ac", "feat_wifi", "feat_space", "feat_group", "feat_baby"],
  },
];