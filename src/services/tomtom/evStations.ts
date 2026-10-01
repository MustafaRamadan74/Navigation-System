import { TOMTOM_API_KEY } from './config';

export interface EVConnectorInfo {
  type: string;
  total: number;
  available: number;
  occupied: number;
  outOfService: number;
  powerKW?: number;
}

export type EVStationStatus = 'available' | 'occupied' | 'outOfService' | 'unknown';

export interface EVStation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [lng, lat]
  chargingAvailabilityId?: string;
  status: EVStationStatus;
  connectors: EVConnectorInfo[];
  distanceToRouteKm?: number;
  isNearRoute?: boolean;
}

// Calculate distance in kilometers between two lat/lng coordinates (Haversine formula)
export function getDistanceInKm(coord1: [number, number], coord2: [number, number]): number {
  const R = 6371; // Earth radius in km
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate minimum distance from a point to a polyline route of coordinates
export function getMinDistanceToRouteKm(
  point: [number, number],
  routeCoordinates: [number, number][]
): number {
  if (!routeCoordinates || routeCoordinates.length === 0) return Infinity;

  let minDistance = Infinity;
  // Sample along route points
  const step = Math.max(1, Math.floor(routeCoordinates.length / 50));
  for (let i = 0; i < routeCoordinates.length; i += step) {
    const dist = getDistanceInKm(point, routeCoordinates[i]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  // Check start and end explicitly
  const startDist = getDistanceInKm(point, routeCoordinates[0]);
  const endDist = getDistanceInKm(point, routeCoordinates[routeCoordinates.length - 1]);
  return Math.min(minDistance, startDist, endDist);
}

let cachedEgyptEVStations: EVStation[] | null = null;

// Regional hubs across Egypt for thorough coverage
const EGYPT_EV_HUBS = [
  { name: 'Cairo Center & Giza', lat: 30.0444, lon: 31.2357, radius: 40000, limit: 100 },
  { name: 'El Obour, Shorouk & New Cairo', lat: 30.20, lon: 31.50, radius: 35000, limit: 100 },
  { name: 'New Administrative Capital & Badr', lat: 30.0131, lon: 31.75, radius: 35000, limit: 100 },
  { name: '6th of October & Sheikh Zayed', lat: 30.00, lon: 30.95, radius: 35000, limit: 100 },
  { name: 'Maadi & Helwan & Ain Sokhna Road', lat: 29.95, lon: 31.35, radius: 35000, limit: 100 },
  { name: 'Alexandria & North Coast', lat: 31.20, lon: 29.92, radius: 45000, limit: 100 },
  { name: 'Delta Region (Tanta, Mansoura, Banha)', lat: 30.85, lon: 31.15, radius: 60000, limit: 100 },
  { name: 'Suez Canal & Sokhna', lat: 29.95, lon: 32.40, radius: 60000, limit: 100 },
  { name: 'Ismailia & Port Said', lat: 30.85, lon: 32.30, radius: 60000, limit: 100 },
  { name: 'Sinai & Sharm El Sheikh', lat: 27.91, lon: 34.33, radius: 50000, limit: 50 },
  { name: 'Red Sea & Hurghada', lat: 27.25, lon: 33.81, radius: 60000, limit: 50 },
];

/**
 * Fetches all EV Charging Stations in Egypt (covering Greater Cairo, Alexandria, Delta, Canal, Sinai, Red Sea)
 * Category 7309 / ELECTRIC_VEHICLE_STATION
 */
export async function fetchAllEgyptEVStations(): Promise<EVStation[]> {
  if (cachedEgyptEVStations && cachedEgyptEVStations.length > 0) {
    return cachedEgyptEVStations;
  }

  // Check LocalStorage cache (v3 with verified TomTom coordinates)
  if (typeof window !== 'undefined') {
    try {
      // Clear obsolete caches
      localStorage.removeItem('georoute_cairo_ev_stations');
      const stored = localStorage.getItem('georoute_egypt_ev_stations_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 50) {
          cachedEgyptEVStations = parsed;
          return parsed;
        }
      }
    } catch {
      // Ignored
    }
  }

  if (!TOMTOM_API_KEY) return [];

  const stationsMap = new Map<string, EVStation>();

  // Helper to parse TomTom POI item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseStationItem = (item: any) => {
    if (!item.id || stationsMap.has(item.id)) return;
    const lng = item.position?.lon ?? item.position?.longitude;
    const lat = item.position?.lat ?? item.position?.latitude;
    if (typeof lng !== 'number' || typeof lat !== 'number') return;

    // Reject invalid coordinates outside Egypt's geographic bounding box [22..32 lat, 24..37 lon]
    if (lat < 21.5 || lat > 32.5 || lng < 24.0 || lng > 37.5) return;

    const availabilityId = item.dataSources?.chargingAvailability?.id;
    const name = item.poi?.name || 'EV Charging Station';
    const address = item.address?.freeformAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    stationsMap.set(item.id, {
      id: item.id,
      name,
      address,
      coordinates: [lng, lat],
      chargingAvailabilityId: availabilityId,
      status: 'available',
      connectors: [
        {
          type: 'Type 2 / CCS (Fast Charge)',
          total: 2,
          available: 2,
          occupied: 0,
          outOfService: 0,
          powerKW: 50,
        },
      ],
    });
  };

  try {
    // 1. Query TomTom category search across Egypt
    const catUrl = `https://api.tomtom.com/search/2/categorySearch/ELECTRIC_VEHICLE_STATION.json?key=${TOMTOM_API_KEY}&countrySet=EG&limit=100`;
    const catPromise = fetch(catUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        (data?.results || []).forEach(parseStationItem);
      })
      .catch(() => {});

    // 2. Query regional hubs across Egypt in parallel for high density
    const hubPromises = EGYPT_EV_HUBS.map(async (hub) => {
      try {
        const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${hub.lat}&lon=${hub.lon}&radius=${hub.radius}&categorySet=7309&limit=${hub.limit}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        (data.results || []).forEach(parseStationItem);
      } catch {
        // Ignored
      }
    });

    await Promise.all([catPromise, ...hubPromises]);
  } catch (e) {
    console.warn('Failed to load Egypt EV stations:', e);
  }

  const stations = Array.from(stationsMap.values());

  if (stations.length > 0) {
    cachedEgyptEVStations = stations;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('georoute_egypt_ev_stations_v3', JSON.stringify(stations));
      } catch {
        // Ignored
      }
    }
  }

  return stations;
}

// Backwards compatibility alias
export const fetchAllGreaterCairoEVStations = fetchAllEgyptEVStations;

/**
 * Filters EV stations by a geographic bounding box (map extent).
 */
export function filterEVStationsByBounds(
  stations: EVStation[],
  bounds: { north: number; south: number; east: number; west: number }
): EVStation[] {
  if (!bounds) return stations;
  return stations.filter((s) => {
    const [lng, lat] = s.coordinates;
    return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
  });
}

/**
 * Searches EV stations along a computed route within a strict 20 km buffer.
 * During a trip, ONLY charging stations within 20 km of the route line appear on the map.
 */
export async function searchEVStationsAlongRoute(
  routeCoordinates: [number, number][],
  radiusMeters: number = 20000
): Promise<EVStation[]> {
  const maxDistanceKm = radiusMeters / 1000; // 20 km buffer

  // 1. Get all verified stations across Egypt
  const allStations = await fetchAllEgyptEVStations();

  if (!routeCoordinates || routeCoordinates.length === 0) {
    return allStations.map((s) => ({ ...s, isNearRoute: false }));
  }

  // 2. Strict 20km Route Buffer: filter to keep ONLY stations within 20 km of the route line
  const stationsMap = new Map<string, EVStation>();

  allStations.forEach((station) => {
    const distKm = getMinDistanceToRouteKm(station.coordinates, routeCoordinates);
    if (distKm <= maxDistanceKm) {
      stationsMap.set(station.id, {
        ...station,
        distanceToRouteKm: Math.round(distKm * 10) / 10,
        isNearRoute: true,
      });
    }
  });

  // 3. Supplement with TomTom nearby search along route key points (start, end, and steps)
  if (TOMTOM_API_KEY) {
    const samplePoints: [number, number][] = [];
    samplePoints.push(routeCoordinates[0]); // Start point (e.g. El Obour)

    const step = Math.max(1, Math.floor(routeCoordinates.length / 8));
    for (let i = step; i < routeCoordinates.length - 1; i += step) {
      samplePoints.push(routeCoordinates[i]);
    }

    if (routeCoordinates.length > 1) {
      samplePoints.push(routeCoordinates[routeCoordinates.length - 1]); // Destination point
    }

    await Promise.all(
      samplePoints.map(async ([lng, lat]) => {
        try {
          const url = `https://api.tomtom.com/search/2/nearbySearch/.json?key=${TOMTOM_API_KEY}&lat=${lat}&lon=${lng}&radius=${radiusMeters}&categorySet=7309&limit=30`;
          const res = await fetch(url);
          if (!res.ok) return;

          const data = await res.json();
          const results = data.results || [];

          for (const item of results) {
            if (!item.id || stationsMap.has(item.id)) continue;

            const stationLng = item.position?.lon ?? item.position?.longitude;
            const stationLat = item.position?.lat ?? item.position?.latitude;
            if (typeof stationLng !== 'number' || typeof stationLat !== 'number') continue;

            const distKm = getMinDistanceToRouteKm([stationLng, stationLat], routeCoordinates);
            // Strictly inside 20 km buffer
            if (distKm <= maxDistanceKm) {
              stationsMap.set(item.id, {
                id: item.id,
                name: item.poi?.name || 'EV Charging Station',
                address: item.address?.freeformAddress || `${stationLat.toFixed(4)}, ${stationLng.toFixed(4)}`,
                coordinates: [stationLng, stationLat],
                status: 'available',
                distanceToRouteKm: Math.round(distKm * 10) / 10,
                isNearRoute: true,
                connectors: [
                  {
                    type: 'Type 2 / CCS (Fast Charge)',
                    total: 2,
                    available: 2,
                    occupied: 0,
                    outOfService: 0,
                    powerKW: 50,
                  },
                ],
              });
            }
          }
        } catch {
          // Ignored
        }
      })
    );
  }

  const bufferStations = Array.from(stationsMap.values());
  // Sort: closest to route first
  bufferStations.sort((a, b) => (a.distanceToRouteKm || 0) - (b.distanceToRouteKm || 0));

  return bufferStations;
}
