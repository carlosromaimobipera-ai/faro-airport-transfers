// Pre-defined locations with coordinates
export const locations = [
  // Airports
  { id: "faro_airport", name: "Aeroporto de Faro (FAO)", coords: { lat: 37.0144, lng: -7.9659 }, type: "airport" },
  
  // Algarve destinations
  { id: "albufeira", name: "Albufeira", coords: { lat: 37.0882, lng: -8.2503 }, type: "city" },
  { id: "vilamoura", name: "Vilamoura", coords: { lat: 37.0769, lng: -8.1137 }, type: "city" },
  { id: "quarteira", name: "Quarteira", coords: { lat: 37.0686, lng: -8.1006 }, type: "city" },
  { id: "loule", name: "Loulé", coords: { lat: 37.1389, lng: -8.0200 }, type: "city" },
  { id: "faro_city", name: "Faro (Centro)", coords: { lat: 37.0194, lng: -7.9322 }, type: "city" },
  { id: "olhao", name: "Olhão", coords: { lat: 37.0257, lng: -7.8411 }, type: "city" },
  { id: "tavira", name: "Tavira", coords: { lat: 37.1275, lng: -7.6506 }, type: "city" },
  { id: "vrsa", name: "Vila Real de Santo António", coords: { lat: 37.1947, lng: -7.4178 }, type: "city" },
  { id: "lagos", name: "Lagos", coords: { lat: 37.1028, lng: -8.6731 }, type: "city" },
  { id: "portimao", name: "Portimão", coords: { lat: 37.1386, lng: -8.5378 }, type: "city" },
  { id: "silves", name: "Silves", coords: { lat: 37.1892, lng: -8.4392 }, type: "city" },
  { id: "lagoa", name: "Lagoa", coords: { lat: 37.1350, lng: -8.4533 }, type: "city" },
  { id: "carvoeiro", name: "Carvoeiro", coords: { lat: 37.0944, lng: -8.4722 }, type: "city" },
  { id: "sagres", name: "Sagres", coords: { lat: 37.0089, lng: -8.9403 }, type: "city" },
  { id: "monte_gordo", name: "Monte Gordo", coords: { lat: 37.1831, lng: -7.4497 }, type: "city" },
  { id: "cabanas_tavira", name: "Cabanas de Tavira", coords: { lat: 37.1300, lng: -7.6000 }, type: "city" },
  
  // Long distance
  { id: "lisboa", name: "Lisboa", coords: { lat: 38.7223, lng: -9.1393 }, type: "city" },
  { id: "sevilha", name: "Sevilha (Espanha)", coords: { lat: 37.3891, lng: -5.9845 }, type: "city" },
];

// Pre-calculated distances from Faro Airport (in km, by road)
export const routeDistances = {
  "faro_airport-albufeira": 42,
  "faro_airport-vilamoura": 25,
  "faro_airport-quarteira": 22,
  "faro_airport-loule": 18,
  "faro_airport-faro_city": 7,
  "faro_airport-olhao": 13,
  "faro_airport-tavira": 37,
  "faro_airport-vrsa": 57,
  "faro_airport-lagos": 88,
  "faro_airport-portimao": 68,
  "faro_airport-silves": 55,
  "faro_airport-lagoa": 60,
  "faro_airport-carvoeiro": 62,
  "faro_airport-sagres": 115,
  "faro_airport-monte_gordo": 55,
  "faro_airport-cabanas_tavira": 34,
  "faro_airport-lisboa": 278,
  "faro_airport-sevilha": 200,
};

// Vehicle types with pricing
export const vehicleTypes = [
  {
    id: "sedan",
    name: "Sedan Conforto",
    seats: 5,
    luggage: 3,
    pricePerKm: 0.80,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=250&fit=crop",
    features: ["Ar condicionado", "Wi-Fi", "Água mineral", "Cadeira de bebé (a pedido)"],
  },
  {
    id: "minivan",
    name: "Minivan Premium",
    seats: 7,
    luggage: 5,
    pricePerKm: 1.00,
    image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=250&fit=crop",
    features: ["Ar condicionado", "Wi-Fi", "Água mineral", "Espaço extra bagagem", "Cadeira de bebé (a pedido)"],
  },
  {
    id: "minibus",
    name: "Minibus Grupo",
    seats: 9,
    luggage: 9,
    pricePerKm: 1.50,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=250&fit=crop",
    features: ["Ar condicionado", "Wi-Fi", "Água mineral", "Máximo espaço", "Ideal para grupos", "Cadeira de bebé (a pedido)"],
  },
];

// Calculate distance between two locations
export function getDistance(originId, destinationId) {
  const key1 = `${originId}-${destinationId}`;
  const key2 = `${destinationId}-${originId}`;
  return routeDistances[key1] || routeDistances[key2] || null;
}

// Calculate price
export function calculatePrice(distanceKm, vehicleTypeId) {
  const vehicle = vehicleTypes.find(v => v.id === vehicleTypeId);
  if (!vehicle || !distanceKm) return 0;
  return Math.round(distanceKm * vehicle.pricePerKm * 100) / 100;
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