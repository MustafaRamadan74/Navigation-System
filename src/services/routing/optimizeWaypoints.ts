import { LocationPoint } from '../../types/location';
import { TOMTOM_API_KEY } from '../tomtom/config';
import { calculateDistanceMeters } from '../../utils/geoMath';

export interface OptimizedWaypointsResult {
  optimizedWaypoints: LocationPoint[];
  orderIndices: number[]; // relative order of waypoints
}

/**
 * Optimizes the sequence of waypoints between start and destination for shortest delivery travel time.
 * Uses TomTom Waypoint Optimization API, with fallback to nearest-neighbor TSP.
 */
export async function optimizeWaypoints(
  start: LocationPoint,
  waypoints: LocationPoint[],
  destination: LocationPoint
): Promise<OptimizedWaypointsResult> {
  if (waypoints.length <= 1) {
    return {
      optimizedWaypoints: [...waypoints],
      orderIndices: waypoints.map((_, i) => i),
    };
  }

  // 1. Try TomTom Waypoint Optimization API
  try {
    const allPoints = [
      start,
      ...waypoints,
      destination,
    ];

    const body = {
      waypoints: allPoints.map((p) => ({
        point: {
          latitude: p.coordinates[1],
          longitude: p.coordinates[0],
        },
      })),
      options: {
        travelMode: 'car',
      },
    };

    const response = await fetch(
      `https://api.tomtom.com/routing/waypointoptimization/1?key=${TOMTOM_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.optimizedOrder) && data.optimizedOrder.length > 0) {
        // optimizedOrder contains indices into allPoints.
        // We filter out 0 (start) and allPoints.length - 1 (destination)
        // and map the rest back to waypoints (offset by 1).
        const intermediateIndices = (data.optimizedOrder as number[])
          .filter((idx) => idx !== 0 && idx !== allPoints.length - 1)
          .map((idx) => idx - 1);

        const reordered = intermediateIndices
          .map((i) => waypoints[i])
          .filter(Boolean);

        if (reordered.length === waypoints.length) {
          return {
            optimizedWaypoints: reordered,
            orderIndices: intermediateIndices,
          };
        }
      }
    }
  } catch (err) {
    console.warn('TomTom Waypoint Optimization API request failed, falling back to heuristic TSP:', err);
  }

  // 2. High-precision Nearest-Neighbor TSP Heuristic fallback
  const remaining = waypoints.map((wp, originalIndex) => ({ wp, originalIndex }));
  const reordered: LocationPoint[] = [];
  const orderIndices: number[] = [];

  let currentCoord = start.coordinates;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = calculateDistanceMeters(currentCoord, remaining[i].wp.coordinates);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    const [chosen] = remaining.splice(bestIdx, 1);
    reordered.push(chosen.wp);
    orderIndices.push(chosen.originalIndex);
    currentCoord = chosen.wp.coordinates;
  }

  return {
    optimizedWaypoints: reordered,
    orderIndices,
  };
}
