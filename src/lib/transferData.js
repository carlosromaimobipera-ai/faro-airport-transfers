// Location types:
// "faro_district" = distrito de Faro (aeroporto + cidades algarve) → pode ir para qualquer lado
// "lisboa_district" = distrito de Lisboa → só pode ir para distrito de Faro
// "spain" = Espanha → só pode ir para distrito de Faro

// Locations are now free-form via Google Places Autocomplete
export const locations = [];

// Define allowed regions
const REGIONS = {
  FARO_MUNICIPALITY: { name: 'Faro (Município)', bounds: { lat: [36.94, 37.06], lng: [-8.63, -7.99] } },
  FARO_DISTRICT: { name: 'Faro (Distrito)', bounds: { lat: [36.8, 37.3], lng: [-8.7, -7.8] } },
  LISBON: { name: 'Lisboa', bounds: { lat: [38.6, 38.9], lng: [-9.3, -8.9] } },
  SEVILLE: { name: 'Sevilha', bounds: { lat: [37.2, 37.5], lng: [-6.1, -5.8] } },
};

// Check if coordinates are in a region
function getRegionFromCoords(lat, lng) {
  // Verifica município de Faro primeiro (mais específico)
  if (lat >= REGIONS.FARO_MUNICIPALITY.bounds.lat[0] && lat <= REGIONS.FARO_MUNICIPALITY.bounds.lat[1] &&
      lng >= REGIONS.FARO_MUNICIPALITY.bounds.lng[0] && lng <= REGIONS.FARO_MUNICIPALITY.bounds.lng[1]) {
    return 'FARO_MUNICIPALITY';
  }
  
  // Depois verifica distrito de Faro
  if (lat >= REGIONS.FARO_DISTRICT.bounds.lat[0] && lat <= REGIONS.FARO_DISTRICT.bounds.lat[1] &&
      lng >= REGIONS.FARO_DISTRICT.bounds.lng[0] && lng <= REGIONS.FARO_DISTRICT.bounds.lng[1]) {
    return 'FARO_DISTRICT';
  }
  
  // Verifica Lisboa
  if (lat >= REGIONS.LISBON.bounds.lat[0] && lat <= REGIONS.LISBON.bounds.lat[1] &&
      lng >= REGIONS.LISBON.bounds.lng[0] && lng <= REGIONS.LISBON.bounds.lng[1]) {
    return 'LISBON';
  }
  
  // Verifica Sevilha
  if (lat >= REGIONS.SEVILLE.bounds.lat[0] && lat <= REGIONS.SEVILLE.bounds.lat[1] &&
      lng >= REGIONS.SEVILLE.bounds.lng[0] && lng <= REGIONS.SEVILLE.bounds.lng[1]) {
    return 'SEVILLE';
  }
  
  return null;
}

// Validate if route is allowed
export function isRouteAllowed(originCoords, destCoords) {
  if (!originCoords || !destCoords) return false;
  
  const originRegion = getRegionFromCoords(originCoords.lat, originCoords.lng);
  const destRegion = getRegionFromCoords(destCoords.lat, destCoords.lng);
  
  if (!originRegion || !destRegion) return false;
  
  // Block only rotas within Faro municipality
  if (originRegion === 'FARO_MUNICIPALITY' && destRegion === 'FARO_MUNICIPALITY') return false;
  
  // Allow rotas within Faro district (Faro ↔ Albufeira, Faro ↔ Lagos, etc)
  const faroDistrictRoute = (originRegion === 'FARO_MUNICIPALITY' || originRegion === 'FARO_DISTRICT') &&
                            (destRegion === 'FARO_MUNICIPALITY' || destRegion === 'FARO_DISTRICT');
  if (faroDistrictRoute) return true;
  
  // Allow Faro ↔ Lisboa or Faro ↔ Sevilha
  const isFaroToOther = ((originRegion === 'FARO_MUNICIPALITY' || originRegion === 'FARO_DISTRICT') && 
                         (destRegion === 'LISBON' || destRegion === 'SEVILLE')) ||
                        ((destRegion === 'FARO_MUNICIPALITY' || destRegion === 'FARO_DISTRICT') && 
                         (originRegion === 'LISBON' || originRegion === 'SEVILLE'));
  
  return isFaroToOther;
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

// Calculate price — accepts optional priceConfigs array from DB to override defaults
export function calculatePrice(distanceKm, vehicleTypeId, priceConfigs = []) {
  const vehicle = vehicleTypes.find(v => v.id === vehicleTypeId);
  if (!vehicle || !distanceKm) return 0;
  const override = priceConfigs.find(c => c.key === `vehicle_${vehicleTypeId}`);
  const pricePerKm = override ? override.value : vehicle.pricePerKm;
  return Math.round(distanceKm * pricePerKm * 100) / 100;
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
    label: 'Cadeira de bebé',
    description: 'Cadeira homologada para crianças até 18 kg',
    price: 0,
    icon: 'Baby',
  },
  {
    id: 'meet_greet',
    label: 'Meet & Greet',
    description: 'Motorista à chegada com placa com o seu nome',
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