// Location types:
// "faro_district" = distrito de Faro (aeroporto + cidades algarve) → pode ir para qualquer lado
// "lisboa_district" = distrito de Lisboa → só pode ir para distrito de Faro
// "spain" = Espanha → só pode ir para distrito de Faro

export const locations = [
  // Faro District - Airport
  { id: "faro_airport", name: "Aeroporto de Faro (FAO)", coords: { lat: 37.0144, lng: -7.9659 }, district: "faro" },

  // Faro District - Algarve Cities
  { id: "faro_city",        name: "Faro (Centro)",              coords: { lat: 37.0194, lng: -7.9322 }, district: "faro" },
  { id: "albufeira",        name: "Albufeira",                  coords: { lat: 37.0882, lng: -8.2503 }, district: "faro" },
  { id: "vilamoura",        name: "Vilamoura",                  coords: { lat: 37.0769, lng: -8.1137 }, district: "faro" },
  { id: "quarteira",        name: "Quarteira",                  coords: { lat: 37.0686, lng: -8.1006 }, district: "faro" },
  { id: "loule",            name: "Loulé",                      coords: { lat: 37.1389, lng: -8.0200 }, district: "faro" },
  { id: "olhao",            name: "Olhão",                      coords: { lat: 37.0257, lng: -7.8411 }, district: "faro" },
  { id: "tavira",           name: "Tavira",                     coords: { lat: 37.1275, lng: -7.6506 }, district: "faro" },
  { id: "vrsa",             name: "Vila Real de Santo António", coords: { lat: 37.1947, lng: -7.4178 }, district: "faro" },
  { id: "lagos",            name: "Lagos",                      coords: { lat: 37.1028, lng: -8.6731 }, district: "faro" },
  { id: "portimao",         name: "Portimão",                   coords: { lat: 37.1386, lng: -8.5378 }, district: "faro" },
  { id: "silves",           name: "Silves",                     coords: { lat: 37.1892, lng: -8.4392 }, district: "faro" },
  { id: "lagoa",            name: "Lagoa",                      coords: { lat: 37.1350, lng: -8.4533 }, district: "faro" },
  { id: "carvoeiro",        name: "Carvoeiro",                  coords: { lat: 37.0944, lng: -8.4722 }, district: "faro" },
  { id: "sagres",           name: "Sagres",                     coords: { lat: 37.0089, lng: -8.9403 }, district: "faro" },
  { id: "monte_gordo",      name: "Monte Gordo",                coords: { lat: 37.1831, lng: -7.4497 }, district: "faro" },
  { id: "cabanas_tavira",   name: "Cabanas de Tavira",          coords: { lat: 37.1300, lng: -7.6000 }, district: "faro" },

  // Lisboa District
  { id: "lisboa",           name: "Lisboa",                     coords: { lat: 38.7223, lng: -9.1393 }, district: "lisboa" },
  { id: "sintra",           name: "Sintra",                     coords: { lat: 38.7979, lng: -9.3917 }, district: "lisboa" },
  { id: "cascais",          name: "Cascais",                    coords: { lat: 38.6979, lng: -9.4213 }, district: "lisboa" },
  { id: "setubal",          name: "Setúbal",                    coords: { lat: 38.5244, lng: -8.8882 }, district: "lisboa" },

  // Spain
  { id: "sevilha",          name: "Sevilha (Espanha)",          coords: { lat: 37.3891, lng: -5.9845 }, district: "spain" },
  { id: "huelva",           name: "Huelva (Espanha)",           coords: { lat: 37.2601, lng: -6.9498 }, district: "spain" },
];

// Returns allowed destination IDs given a pickup ID
export function getAllowedDestinations(originId) {
  const origin = locations.find(l => l.id === originId);
  if (!origin) return locations.map(l => l.id);

  if (origin.district === "faro") {
    // Can go anywhere
    return locations.filter(l => l.id !== originId).map(l => l.id);
  }

  if (origin.district === "lisboa" || origin.district === "spain") {
    // Can only go to Faro district
    return locations.filter(l => l.district === "faro").map(l => l.id);
  }

  return locations.filter(l => l.id !== originId).map(l => l.id);
}

// Pre-calculated road distances (km)
export const routeDistances = {
  // From Faro Airport
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
  "faro_airport-sintra": 295,
  "faro_airport-cascais": 290,
  "faro_airport-setubal": 250,
  "faro_airport-sevilha": 200,
  "faro_airport-huelva": 130,

  // Between Algarve cities (selected)
  "faro_city-albufeira": 40,
  "faro_city-vilamoura": 20,
  "faro_city-quarteira": 18,
  "faro_city-loule": 14,
  "faro_city-olhao": 9,
  "faro_city-tavira": 32,
  "faro_city-vrsa": 52,
  "faro_city-lagos": 85,
  "faro_city-portimao": 65,
  "faro_city-silves": 52,
  "faro_city-lagoa": 57,
  "faro_city-carvoeiro": 59,
  "faro_city-sagres": 112,
  "faro_city-monte_gordo": 50,
  "faro_city-cabanas_tavira": 30,
  "faro_city-lisboa": 275,
  "faro_city-sintra": 292,
  "faro_city-cascais": 287,
  "faro_city-setubal": 247,
  "faro_city-sevilha": 196,
  "faro_city-huelva": 126,

  "albufeira-vilamoura": 18,
  "albufeira-quarteira": 20,
  "albufeira-loule": 30,
  "albufeira-lagos": 50,
  "albufeira-portimao": 30,
  "albufeira-silves": 22,
  "albufeira-lagoa": 20,
  "albufeira-carvoeiro": 22,
  "albufeira-sagres": 78,
  "albufeira-tavira": 72,
  "albufeira-vrsa": 90,
  "albufeira-olhao": 50,
  "albufeira-monte_gordo": 88,
  "albufeira-cabanas_tavira": 70,
  "albufeira-lisboa": 240,
  "albufeira-sintra": 257,
  "albufeira-cascais": 252,
  "albufeira-setubal": 210,
  "albufeira-sevilha": 165,
  "albufeira-huelva": 95,

  "lagos-portimao": 20,
  "lagos-silves": 40,
  "lagos-sagres": 35,
  "lagos-lagoa": 28,
  "lagos-carvoeiro": 20,
  "lagos-vilamoura": 65,
  "lagos-albufeira": 50,
  "lagos-faro_airport": 88,
  "lagos-lisboa": 270,
  "lagos-sintra": 287,
  "lagos-cascais": 282,
  "lagos-sevilha": 220,
  "lagos-huelva": 160,

  "portimao-silves": 20,
  "portimao-lagoa": 10,
  "portimao-carvoeiro": 12,
  "portimao-sagres": 55,
  "portimao-vilamoura": 45,
  "portimao-tavira": 100,
  "portimao-vrsa": 118,
  "portimao-olhao": 75,
  "portimao-monte_gordo": 115,
  "portimao-cabanas_tavira": 98,
  "portimao-lisboa": 250,
  "portimao-sintra": 267,
  "portimao-cascais": 262,
  "portimao-sevilha": 205,
  "portimao-huelva": 140,

  "tavira-vrsa": 25,
  "tavira-olhao": 28,
  "tavira-monte_gordo": 22,
  "tavira-cabanas_tavira": 5,
  "tavira-sevilha": 175,
  "tavira-huelva": 105,

  "vrsa-monte_gordo": 5,
  "vrsa-sevilha": 165,
  "vrsa-huelva": 95,

  // From Lisboa district to Faro district (same as faro_airport → lisboa but reversed)
  "lisboa-faro_airport": 278,
  "lisboa-faro_city": 275,
  "lisboa-albufeira": 240,
  "lisboa-vilamoura": 258,
  "lisboa-lagos": 270,
  "lisboa-portimao": 250,
  "sintra-faro_airport": 295,
  "sintra-faro_city": 292,
  "sintra-albufeira": 257,
  "cascais-faro_airport": 290,
  "cascais-faro_city": 287,
  "cascais-albufeira": 252,
  "setubal-faro_airport": 250,
  "setubal-faro_city": 247,

  // From Spain to Faro district
  "sevilha-faro_airport": 200,
  "sevilha-faro_city": 196,
  "sevilha-albufeira": 165,
  "sevilha-vilamoura": 180,
  "sevilha-lagos": 220,
  "sevilha-portimao": 205,
  "sevilha-tavira": 175,
  "sevilha-vrsa": 165,
  "huelva-faro_airport": 130,
  "huelva-faro_city": 126,
  "huelva-albufeira": 95,
  "huelva-vilamoura": 110,
  "huelva-vrsa": 65,
  "huelva-tavira": 100,
};

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

// Vehicle types with pricing
export const vehicleTypes = [
  {
    id: "sedan",
    nameKey: "veh_sedan",
    seats: 4,
    luggage: 3,
    pricePerKm: 0.80,
    image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&h=250&fit=crop",
    featureKeys: ["feat_ac", "feat_wifi", "feat_water", "feat_baby"],
  },
  {
    id: "minivan",
    nameKey: "veh_minivan",
    seats: 6,
    luggage: 5,
    pricePerKm: 1.00,
    image: "https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400&h=250&fit=crop",
    featureKeys: ["feat_ac", "feat_wifi", "feat_water", "feat_luggage", "feat_baby"],
  },
  {
    id: "minibus",
    nameKey: "veh_minibus",
    seats: 8,
    luggage: 8,
    pricePerKm: 1.50,
    image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400&h=250&fit=crop",
    featureKeys: ["feat_ac", "feat_wifi", "feat_water", "feat_space", "feat_group", "feat_baby"],
  },
];