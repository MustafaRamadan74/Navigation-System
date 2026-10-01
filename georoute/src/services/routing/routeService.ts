import ttServices from '@tomtom-international/web-sdk-services';
import GeoJSON, { LineString } from 'geojson';
import { TOMTOM_API_KEY } from '../tomtom/config';
import { RouteOption, RouteInstruction, TravelMode } from '../../types/route';

interface RawInstruction {
  message?: string;
  maneuver?: string;
  routeOffsetInMeters?: number;
  travelTimeInSeconds?: number;
  street?: string;
  point?: { latitude: number; longitude: number };
}

export async function calculateRoute(
  locations: [number, number][],
  traffic: boolean = true,
  isArabic: boolean = true,
  travelMode: TravelMode = 'car'
): Promise<RouteOption[]> {
  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key is not configured.');
  }

  if (locations.length < 2) {
    throw new Error('At least start and destination are required.');
  }

  try {
    const isPedestrian = travelMode === 'pedestrian';
    // TomTom supports up to 2 alternative routes when maxAlternatives is set
    const response = await ttServices.services.calculateRoute({
      key: TOMTOM_API_KEY,
      locations: locations,
      travelMode: travelMode,
      traffic: isPedestrian ? false : traffic,
      computeTravelTimeFor: 'all',
      instructionsType: 'text',
      language: isArabic ? 'ar' : 'en-GB',
      maxAlternatives: locations.length === 2 && !isPedestrian ? 2 : 0,
    });

    if (!response || !response.routes || response.routes.length === 0) {
      throw new Error('No route found between the selected locations.');
    }

    const routeOptions: RouteOption[] = response.routes.map((route, routeIndex) => {
      // Gather all coordinates from all legs of this route
      const allCoords: [number, number][] = [];
      route.legs.forEach((leg) => {
        leg.points.forEach((pt) => {
          const ptObj = pt as { lat?: number; latitude?: number; lng?: number; longitude?: number };
          const lng = ptObj.lng ?? ptObj.longitude;
          const lat = ptObj.lat ?? ptObj.latitude;
          if (typeof lng === 'number' && typeof lat === 'number') {
            allCoords.push([lng, lat]);
          }
        });
      });

      // Ensure the start and end of the route polyline connect seamlessly to the user's pins
      const startLoc = locations[0];
      const destLoc = locations[locations.length - 1];

      if (allCoords.length > 0 && startLoc) {
        const first = allCoords[0];
        if (Math.abs(first[0] - startLoc[0]) > 0.00005 || Math.abs(first[1] - startLoc[1]) > 0.00005) {
          allCoords.unshift([startLoc[0], startLoc[1]]);
        }
      }

      if (allCoords.length > 0 && destLoc) {
        const last = allCoords[allCoords.length - 1];
        if (Math.abs(last[0] - destLoc[0]) > 0.00005 || Math.abs(last[1] - destLoc[1]) > 0.00005) {
          allCoords.push([destLoc[0], destLoc[1]]);
        }
      }

      // Find midpoint coordinate for placing duration badge on map
      const midIdx = Math.floor(allCoords.length / 2);
      const midpoint: [number, number] = allCoords[midIdx] || allCoords[0] || [0, 0];

      // Build GeoJSON FeatureCollection for this individual route
      const geojson: GeoJSON.FeatureCollection<LineString> = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              routeIndex,
              lengthInMeters: route.summary.lengthInMeters,
              travelTimeInSeconds: route.summary.travelTimeInSeconds,
              trafficDelayInSeconds: route.summary.trafficDelayInSeconds || 0,
            },
            geometry: {
              type: 'LineString',
              coordinates: allCoords,
            },
          },
        ],
      };

      // Parse guidance instructions
      const rawInstructions: RawInstruction[] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (route.guidance as any)?.instructions || [];

      const instructions: RouteInstruction[] = rawInstructions.map((inst, instIdx) => {
        const nextInst = rawInstructions[instIdx + 1];
        const stepDist =
          nextInst?.routeOffsetInMeters !== undefined && inst.routeOffsetInMeters !== undefined
            ? Math.max(0, nextInst.routeOffsetInMeters - inst.routeOffsetInMeters)
            : 0;

        return {
          id: `inst-${routeIndex}-${instIdx}`,
          message: inst.message || 'Continue',
          maneuver: inst.maneuver || 'STRAIGHT',
          distanceInMeters: stepDist,
          travelTimeInSeconds: inst.travelTimeInSeconds,
          street: inst.street,
          coordinates: [inst.point?.longitude || 0, inst.point?.latitude || 0],
        };
      });

      return {
        id: `route-${routeIndex}`,
        index: routeIndex,
        summary: {
          lengthInMeters: route.summary.lengthInMeters,
          travelTimeInSeconds: route.summary.travelTimeInSeconds,
          trafficDelayInSeconds: traffic ? route.summary.trafficDelayInSeconds || 0 : 0,
          departureTime: route.summary.departureTime,
          arrivalTime: route.summary.arrivalTime,
        },
        geojson,
        midpoint,
        instructions,
      };
    });

    return routeOptions;
  } catch (error: unknown) {
    let message = 'Routing calculation failed.';
    if (error instanceof Error) {
      message = error.message;
      if (message.includes('400') || message.includes('Engine error')) {
        message = 'Could not find a driveable route between these locations.';
      }
    }
    console.error('TomTom calculateRoute error:', error);
    throw new Error(message);
  }
}
