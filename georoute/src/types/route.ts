import GeoJSON, { LineString } from 'geojson';

export type TravelMode = 'car' | 'motorcycle' | 'pedestrian';

export interface RouteSummary {
  lengthInMeters: number;
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
  departureTime?: string;
  arrivalTime?: string;
}

export interface RouteInstruction {
  id: string;
  message: string;
  maneuver: string;
  distanceInMeters: number;
  travelTimeInSeconds?: number;
  street?: string;
  coordinates: [number, number];
}

export interface RouteOption {
  id: string;
  index: number;
  summary: RouteSummary;
  geojson: GeoJSON.FeatureCollection<LineString>;
  midpoint: [number, number];
  instructions: RouteInstruction[];
}

export interface RouteCalculationResult {
  routes: RouteOption[];
  selectedRouteIndex: number;
}
