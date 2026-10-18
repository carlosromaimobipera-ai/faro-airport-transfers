// Lugares para visitar nas proximidades de uma rota (Transfer + Day Trips).
// Coordenadas aproximadas de pontos de interesse no Algarve, Lisboa, Alentejo e Andaluzia.
// Descrição curta em português e inglês (outros idiomas usam a inglesa).

import { Waves, Mountain, Landmark, Trees, Wine, Store } from 'lucide-react';

export const CATEGORIES = {
  beach: { key: 'cat_beach', icon: Waves, chip: 'bg-sky-100 text-sky-700', dot: '#0ea5e9' },
  viewpoint: { key: 'cat_viewpoint', icon: Mountain, chip: 'bg-violet-100 text-violet-700', dot: '#8b5cf6' },
  historic: { key: 'cat_historic', icon: Landmark, chip: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  nature: { key: 'cat_nature', icon: Trees, chip: 'bg-green-100 text-green-700', dot: '#16a34a' },
  wine: { key: 'cat_wine', icon: Wine, chip: 'bg-rose-100 text-rose-700', dot: '#e11d48' },
  market: { key: 'cat_market', icon: Store, chip: 'bg-cyan-100 text-cyan-700', dot: '#0891b2' },
};

export const ROUTE_PLACES = [
  // Costa ocidental e Barlavento
  { name: 'Cabo de São Vicente', lat: 37.0226, lng: -8.9964, cat: 'viewpoint', pt: 'O ponto mais a sudoeste da Europa, com falésias a pique sobre o Atlântico.', en: 'Europe\'s south-westernmost point, with cliffs dropping into the Atlantic.' },
  { name: 'Fortaleza de Sagres', lat: 37.0003, lng: -8.9480, cat: 'historic', pt: 'Fortaleza do século XV ligada aos Descobrimentos, sobre um promontório ventoso.', en: '15th-century fortress linked to the Age of Discovery, on a windswept headland.' },
  { name: 'Ponta da Piedade', lat: 37.0817, lng: -8.6688, cat: 'viewpoint', pt: 'Faróis e rochas douradas sobre o mar, junto a Lagos.', en: 'Golden rock formations and a lighthouse above the sea, next to Lagos.' },
  { name: 'Praia do Camilo', lat: 37.0877, lng: -8.6684, cat: 'beach', pt: 'Praia pequena entre falésias, com escada de madeira e água transparente.', en: 'Small beach between cliffs, reached by a wooden staircase, with clear water.' },
  { name: 'Meia Praia', lat: 37.1089, lng: -8.6557, cat: 'beach', pt: 'Areal extenso e calmo na baía de Lagos, ideal para caminhadas.', en: 'Long, calm stretch of sand in the bay of Lagos, great for walks.' },
  { name: 'Praia da Luz', lat: 37.0866, lng: -8.7297, cat: 'beach', pt: 'Vila de praia tranquila com passeio marítimo e restaurantes.', en: 'Quiet beach village with a seafront promenade and restaurants.' },
  { name: 'Castelo de Aljezur', lat: 37.3158, lng: -8.8038, cat: 'historic', pt: 'Castelo mouro no alto da vila, com vistas sobre o rio Aljezur.', en: 'Moorish castle above the town, with views over the Aljezur river.' },
  { name: 'Praia da Amoreira', lat: 37.3496, lng: -8.8503, cat: 'beach', pt: 'Onde o rio Aljezur encontra o mar, entre falésias escuras.', en: 'Where the Aljezur river meets the sea, between dark cliffs.' },
  { name: 'Odeceixe', lat: 37.4280, lng: -8.7706, cat: 'beach', pt: 'Praia de rio e mar, no limite entre o Algarve e o Alentejo.', en: 'River-and-sea beach on the border between the Algarve and the Alentejo.' },
  { name: 'Fóia, Monchique', lat: 37.3153, lng: -8.5937, cat: 'viewpoint', pt: 'O ponto mais alto do Algarve (902 m), com vista até à costa.', en: 'The highest point in the Algarve (902 m), with views down to the coast.' },
  { name: 'Caldas de Monchique', lat: 37.2865, lng: -8.5546, cat: 'nature', pt: 'Vila termal na serra, com águas medicinais e floresta de castanheiros.', en: 'Spa village in the hills, with medicinal springs and chestnut woodland.' },
  { name: 'Castelo de Silves', lat: 37.1889, lng: -8.4383, cat: 'historic', pt: 'O maior castelo mouro do Algarve, com muralhas avermelhadas.', en: 'The largest Moorish castle in the Algarve, with red sandstone walls.' },
  { name: 'Ferragudo', lat: 37.1252, lng: -8.5224, cat: 'historic', pt: 'Aldeia de pescadores com casas brancas e praça à beira-rio.', en: 'Fishing village of whitewashed houses, with a square by the river.' },
  { name: 'Praia da Rocha', lat: 37.1159, lng: -8.5390, cat: 'beach', pt: 'Praia ampla com falésias esculpidas, junto a Portimão.', en: 'Wide beach with sculpted cliffs, next to Portimão.' },
  { name: 'Algar Seco / Carvoeiro', lat: 37.0956, lng: -8.4689, cat: 'viewpoint', pt: 'Passadiços sobre falésias e grutas, com a famosa "Boneca".', en: 'Boardwalks over cliffs and caves, with the famous rock window.' },
  { name: 'Algar de Benagil', lat: 37.0868, lng: -8.4258, cat: 'nature', pt: 'Gruta com clarabóia natural, um dos ex-libris do Algarve.', en: 'Sea cave with a natural skylight, one of the Algarve\'s landmarks.' },
  { name: 'Praia da Marinha', lat: 37.0893, lng: -8.4125, cat: 'beach', pt: 'Arcos e pilares na falésia, uma das praias mais fotografadas.', en: 'Rock arches and pillars in the cliff, one of the most photographed beaches.' },
  { name: 'Lagoa dos Salgados', lat: 37.0913, lng: -8.3093, cat: 'nature', pt: 'Zona húmida com flamingos, patos e aves migratórias.', en: 'Wetland with flamingos, ducks and migratory birds.' },
  { name: 'Praia de Nossa Senhora da Rocha', lat: 37.0961, lng: -8.3936, cat: 'beach', pt: 'Capela sobre a falésia entre duas praias de areia fina.', en: 'Chapel on the cliff between two fine-sand beaches.' },
  { name: 'Albufeira, centro histórico', lat: 37.0872, lng: -8.2508, cat: 'historic', pt: 'Ruas estreitas e praças animadas sobre a praia dos Pescadores.', en: 'Narrow streets and lively squares above Fishermen\'s Beach.' },
  { name: 'Loulé, centro histórico', lat: 37.1390, lng: -8.0242, cat: 'market', pt: 'Mercado municipal árabe e ruas brancas no coração do Algarve.', en: 'Moorish-style market hall and whitewashed streets in central Algarve.' },
  { name: 'Alte', lat: 37.2366, lng: -8.1759, cat: 'historic', pt: 'Aldeia de casas caiadas, com fontes, açude e forno comunitário.', en: 'Village of whitewashed houses, with springs, a weir and a communal oven.' },
  { name: 'Quinta do Lago e Ria Formosa', lat: 37.0217, lng: -8.0176, cat: 'nature', pt: 'Ilhas-barreira e sapais da Ria Formosa, óptimos para passeios.', en: 'Barrier islands and salt marshes of the Ria Formosa, great for walks.' },
  { name: 'Faro, Cidade Velha', lat: 37.0166, lng: -7.9295, cat: 'historic', pt: 'Muralhas, Sé e arco da Vila na zona antiga de Faro.', en: 'Walls, cathedral and the old town gate in Faro\'s historic centre.' },
  { name: 'Praia de Faro', lat: 37.0085, lng: -7.9865, cat: 'beach', pt: 'Areal longo na ilha de Faro, a poucos minutos do aeroporto.', en: 'Long sandy beach on Faro island, minutes from the airport.' },
  { name: 'Olhão, mercados', lat: 37.0262, lng: -7.8416, cat: 'market', pt: 'Mercado do peixe e da fruta na frente ribeirinha, junto à ria.', en: 'Fish and produce markets on the waterfront, facing the lagoon.' },
  { name: 'Palácio de Estói', lat: 37.0943, lng: -7.8951, cat: 'historic', pt: 'Palácio rococó com jardins em socalcos e azulejos.', en: 'Rococo palace with terraced gardens and tiled interiors.' },
  { name: 'Tavira, centro histórico', lat: 37.1265, lng: -7.6494, cat: 'historic', pt: 'Ponte romana, igrejas e casas com telhados em tesoura.', en: 'Roman bridge, churches and houses with scissor roofs.' },
  { name: 'Ilha de Tavira', lat: 37.1130, lng: -7.6210, cat: 'beach', pt: 'Praia de areia branca na ilha, acedida por barco.', en: 'White-sand beach on the island, reached by ferry.' },
  { name: 'Cacela Velha', lat: 37.1560, lng: -7.5470, cat: 'viewpoint', pt: 'Miradouro sobre a ria, com igreja e fortaleza junto ao mar.', en: 'Viewpoint over the lagoon, with a church and small fort by the sea.' },
  { name: 'Castelo de Castro Marim', lat: 37.2185, lng: -7.4432, cat: 'historic', pt: 'Fortaleza medieval com vistas para o Guadiana e para Espanha.', en: 'Medieval fortress with views over the Guadiana and into Spain.' },
  { name: 'Vila Real de Santo António', lat: 37.1936, lng: -7.4158, cat: 'historic', pt: 'Vila pombalina de ruas paralelas, na foz do Guadiana.', en: 'Planned 18th-century town of parallel streets, at the mouth of the Guadiana.' },
  { name: 'Alcoutim', lat: 37.4713, lng: -7.4740, cat: 'nature', pt: 'Vila tranquila no rio Guadiana, frente a Sanlúcar de Guadiana.', en: 'Quiet village on the Guadiana river, opposite Sanlúcar de Guadiana.' },

  // Lisboa, Setúbal e Alentejo
  { name: 'Mercado do Livramento, Setúbal', lat: 38.5244, lng: -8.8949, cat: 'market', pt: 'Mercado histórico com peixe fresco e azulejos nas paredes.', en: 'Historic market with fresh fish and tiled walls.' },
  { name: 'Portinho da Arrábida', lat: 38.4774, lng: -8.9920, cat: 'nature', pt: 'Praia de água turquesa na serra da Arrábida, com convento acima.', en: 'Turquoise-water beach in the Arrábida hills, with a convent above.' },
  { name: 'Sesimbra', lat: 38.4437, lng: -9.1015, cat: 'historic', pt: 'Vila piscatória com castelo e praias na baía.', en: 'Fishing town with a castle and beaches in the bay.' },
  { name: 'Azeitão, vinhos', lat: 38.5155, lng: -9.0080, cat: 'wine', pt: 'Adegas históricas de moscatel e queijo de ovelha, perto de Setúbal.', en: 'Historic muscat wine cellars and sheep-cheese dairies near Setúbal.' },
  { name: 'Castelo de Palmela', lat: 38.5688, lng: -8.9008, cat: 'historic', pt: 'Castelo com vistas para a serra da Arrábida e o Sado.', en: 'Castle with views over the Arrábida hills and the Sado river.' },
  { name: 'Alcácer do Sal', lat: 38.3724, lng: -8.5136, cat: 'historic', pt: 'Vila ribeirinha com castelo e arrozais em volta.', en: 'Riverside town with a castle and rice fields all around.' },
  { name: 'Comporta', lat: 38.3813, lng: -8.7860, cat: 'beach', pt: 'Arrozais, dunas e praias largas de areia branca.', en: 'Rice fields, dunes and wide white-sand beaches.' },
  { name: 'Évora, Templo Romano', lat: 38.5725, lng: -7.9076, cat: 'historic', pt: 'Centro histórico muralhado, com templo romano e Sé.', en: 'Walled historic centre, with a Roman temple and cathedral.' },
  { name: 'Monsaraz', lat: 38.4434, lng: -7.3812, cat: 'historic', pt: 'Vila medieval sobre o Guadiana, com castelo e vistas longas.', en: 'Medieval hilltop village over the Guadiana, with a castle and long views.' },
  { name: 'Cristo Rei, Almada', lat: 38.6786, lng: -9.1713, cat: 'viewpoint', pt: 'Miradouro sobre Lisboa e o Tejo, com elevador até ao topo.', en: 'Viewpoint over Lisbon and the Tagus, reached by lift.' },
  { name: 'Castelo de São Jorge, Lisboa', lat: 38.7139, lng: -9.1335, cat: 'historic', pt: 'Castelo no ponto mais alto de Lisboa, com vistas sobre a cidade.', en: 'Castle on Lisbon\'s highest hill, with views over the city.' },
  { name: 'Belém, Mosteiro dos Jerónimos', lat: 38.6979, lng: -9.2067, cat: 'historic', pt: 'Mosteiro manuelino junto aos pastéis de Belém.', en: 'Manueline monastery, next door to the custard tart bakery.' },
  { name: 'Torre de Belém', lat: 38.6916, lng: -9.2160, cat: 'historic', pt: 'Torre do século XVI à beira-Tejo, símbolo de Lisboa.', en: '16th-century tower on the Tagus, the symbol of Lisbon.' },
  { name: 'Cabo da Roca', lat: 38.7805, lng: -9.4990, cat: 'viewpoint', pt: 'O ponto mais ocidental da Europa continental.', en: 'The westernmost point of mainland Europe.' },
  { name: 'Palácio da Pena, Sintra', lat: 38.7876, lng: -9.3906, cat: 'historic', pt: 'Palácio romântico colorido no alto da serra de Sintra.', en: 'Colourful romantic palace high in the Sintra hills.' },
  { name: 'Quinta da Regaleira, Sintra', lat: 38.7964, lng: -9.3960, cat: 'historic', pt: 'Jardins, grutas e o poço iniciático de Sintra.', en: 'Gardens, grottoes and the initiatic well of Sintra.' },
  { name: 'Boca do Inferno, Cascais', lat: 38.6921, lng: -9.4310, cat: 'viewpoint', pt: 'Fenda na falésia onde o mar rebenta com força.', en: 'Chasm in the cliff where the sea crashes in.' },
  { name: 'Palácio Nacional de Mafra', lat: 38.9369, lng: -9.3256, cat: 'historic', pt: 'Palácio-convento barroco com basílica e biblioteca.', en: 'Baroque palace-convent with a basilica and famous library.' },
  { name: 'Ericeira', lat: 38.9633, lng: -9.4177, cat: 'nature', pt: 'Vila de surf na reserva mundial de ondas.', en: 'Surf village inside the world surfing reserve.' },
  { name: 'Óbidos', lat: 39.3606, lng: -9.1570, cat: 'historic', pt: 'Vila medieval dentro das muralhas, com ginjinha em copos de chocolate.', en: 'Medieval village inside the walls, with cherry liqueur in chocolate cups.' },

  // Andaluzia
  { name: 'Ayamonte', lat: 37.2130, lng: -7.4060, cat: 'historic', pt: 'Vila andaluza na fronteira, frente a Vila Real de Santo António.', en: 'Andalusian border town, opposite Vila Real de Santo António.' },
  { name: 'El Rocío', lat: 37.1307, lng: -6.4847, cat: 'nature', pt: 'Aldeia de areia à beira da marisma de Doñana, com a sua ermida.', en: 'Sandy village on the edge of the Doñana marshes, with its shrine.' },
  { name: 'Huelva, Muelle del Tinto', lat: 37.2569, lng: -6.9430, cat: 'historic', pt: 'Antigo cais de ferro dos ingleses, hoje passadiço sobre o Odiel.', en: 'Former British iron pier, now a footbridge over the Odiel river.' },
  { name: 'Gruta das Maravilhas, Aracena', lat: 37.8953, lng: -6.5600, cat: 'nature', pt: 'Gruta com lagos e formações calcárias na serra de Aracena.', en: 'Cave with lakes and limestone formations in the Aracena hills.' },
  { name: 'Jerez de la Frontera', lat: 36.6863, lng: -6.1300, cat: 'wine', pt: 'Adegas de vinho de Jerez, escolas de flamenco e cavalos.', en: 'Sherry bodegas, flamenco schools and the famous horses.' },
  { name: 'Cádiz', lat: 36.5271, lng: -6.2886, cat: 'historic', pt: 'A cidade mais antiga da Europa Ocidental, aberta ao mar.', en: 'The oldest city in Western Europe, facing the open sea.' },
  { name: 'Catedral e Giralda, Sevilha', lat: 37.3860, lng: -5.9925, cat: 'historic', pt: 'A maior catedral gótica do mundo e a sua torre mourisca.', en: 'The world\'s largest Gothic cathedral and its Moorish tower.' },
  { name: 'Real Alcázar, Sevilha', lat: 37.3830, lng: -5.9900, cat: 'historic', pt: 'Palácio real com pátios mouros, jardins e azulejos.', en: 'Royal palace with Moorish courtyards, gardens and tiles.' },
  { name: 'Plaza de España, Sevilha', lat: 37.3770, lng: -5.9868, cat: 'historic', pt: 'Praça monumental com canais, pontes e azulejos de cada província.', en: 'Monumental square with canals, bridges and tiles for every province.' },
  { name: 'Itálica, Santiponce', lat: 37.4436, lng: -6.0455, cat: 'historic', pt: 'Ruínas romanas com anfiteatro e mosaicos intactos.', en: 'Roman ruins with an amphitheatre and intact mosaics.' },
  { name: 'Carmona', lat: 37.4712, lng: -5.6394, cat: 'historic', pt: 'Vila branca com alcázar, portas romanas e necrópole.', en: 'White hill town with an alcázar, Roman gates and a necropolis.' },
  { name: 'Osuna', lat: 37.2400, lng: -5.1040, cat: 'historic', pt: 'Vila de palácios, praças e conventos, cenário de séries e filmes.', en: 'Town of palaces, squares and convents, a film and series location.' },
  { name: 'Écija', lat: 37.5407, lng: -5.0825, cat: 'historic', pt: 'A "cidade do sol", com torres barrocas e pátios andaluzes.', en: 'The "city of the sun", with baroque towers and Andalusian patios.' },
  { name: 'Ronda', lat: 36.7423, lng: -5.1668, cat: 'viewpoint', pt: 'Vila suspensa sobre um desfiladeiro, com a ponte nova.', en: 'Town perched above a gorge, with the famous new bridge.' },
  { name: 'Arcos de la Frontera', lat: 36.7510, lng: -5.8120, cat: 'viewpoint', pt: 'Vila branca no topo de uma falésia sobre o rio Guadalete.', en: 'White town on top of a cliff above the Guadalete river.' },
  { name: 'Teatro Romano de Mérida', lat: 38.9163, lng: -6.3448, cat: 'historic', pt: 'Teatro romano em uso desde o século I, património da UNESCO.', en: 'Roman theatre still in use, dating from the 1st century, a UNESCO site.' },
  { name: 'Zafra', lat: 38.4260, lng: -6.4170, cat: 'historic', pt: 'Vila senhorial com alcázar, praças porticadas e conventos.', en: 'Manor town with an alcázar, arcaded squares and convents.' },
];

// Um lugar conta como "na rota" se estiver a menos de 12 km do trajecto
// e pelo menos 3 km depois do início e antes do fim.
export const MAX_DETOUR_KM = 12;
export const EDGE_MARGIN_KM = 3;
export const MAX_RESULTS = 18;

export function placeDescription(place, lang) {
  return lang === 'pt' ? place.pt : place.en;
}

const KM_PER_DEG_LAT = 110.57;

function projectPoint(p, latRef) {
  return { x: p.lng * 111.32 * Math.cos((latRef * Math.PI) / 180), y: p.lat * KM_PER_DEG_LAT };
}

function closestOnRoute(point, geometry) {
  let best = { detourKm: Infinity, alongKm: 0 };
  let along = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const a = geometry[i];
    const b = geometry[i + 1];
    const latRef = (a.lat + b.lat) / 2;
    const pa = projectPoint(a, latRef);
    const pb = projectPoint(b, latRef);
    const pp = projectPoint(point, latRef);
    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((pp.x - pa.x) * dx + (pp.y - pa.y) * dy) / len2));
    const segmentKm = Math.sqrt(len2);
    const distKm = Math.hypot(pp.x - (pa.x + t * dx), pp.y - (pa.y + t * dy));
    if (distKm < best.detourKm) best = { detourKm: distKm, alongKm: along + t * segmentKm };
    along += segmentKm;
  }
  return { ...best, totalKm: along };
}

export function geometryLengthKm(geometry) {
  let total = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const a = geometry[i];
    const b = geometry[i + 1];
    const latRef = (a.lat + b.lat) / 2;
    const pa = projectPoint(a, latRef);
    const pb = projectPoint(b, latRef);
    total += Math.hypot(pb.x - pa.x, pb.y - pa.y);
  }
  return Math.round(total);
}

export function rankPlacesAlongRoute(geometry) {
  if (!geometry || geometry.length < 2) return [];
  const ranked = [];
  for (const place of ROUTE_PLACES) {
    const { detourKm, alongKm, totalKm } = closestOnRoute(place, geometry);
    if (detourKm > MAX_DETOUR_KM) continue;
    if (alongKm < EDGE_MARGIN_KM || alongKm > totalKm - EDGE_MARGIN_KM) continue;
    ranked.push({ ...place, detourKm: Math.round(detourKm * 10) / 10, alongKm: Math.round(alongKm) });
  }
  ranked.sort((a, b) => a.alongKm - b.alongKm);
  return ranked.slice(0, MAX_RESULTS);
}

// Traçado real da estrada (OSRM). Se falhar, usa a linha directa origem-destino.
export async function fetchRouteGeometry(origin, destination) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (data?.code === 'Ok' && coords?.length > 1) {
      return {
        geometry: coords.map(([lng, lat]) => ({ lat, lng })),
        distanceKm: Math.round(data.routes[0].distance / 100) / 10,
      };
    }
  } catch (e) {
    console.warn('Não foi possível obter o traçado da rota:', e?.message);
  }
  return { geometry: [origin, destination], distanceKm: null };
}