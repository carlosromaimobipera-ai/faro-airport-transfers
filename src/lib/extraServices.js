// Serviços extra realizados pelo motorista: chauffeur à hora e day trips

// Chauffeur à disposição
export const HOURLY_RATE = 35; // €/hora
export const HOURLY_INCLUDED_KM = 30; // km incluídos por cada hora

// Paragens em transfers com paragens / day trips
export const STOP_HOURLY_RATE = 30; // €/hora por paragem

export function hourlyPrice(hours) {
  return Math.round((parseFloat(hours) || 0) * HOURLY_RATE * 100) / 100;
}

// Só contam paragens com nome: linhas em branco do formulário não são visitas
export function stopsPrice(stops = []) {
  const total = stops.reduce((sum, s) => sum + (s.name ? (parseFloat(s.hours) || 0) * STOP_HOURLY_RATE : 0), 0);
  return Math.round(total * 100) / 100;
}

// Tarifa de transfer + paragens
export function dayTripPrice(transferPrice, stops = []) {
  return Math.round(((parseFloat(transferPrice) || 0) + stopsPrice(stops)) * 100) / 100;
}