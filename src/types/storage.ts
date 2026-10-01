import { LocationPoint } from './location';

export type PlaceCategory = 'home' | 'work' | 'favorite' | 'custom';

export interface SavedPlace {
  id: string;
  label: string;
  category: PlaceCategory;
  location: LocationPoint;
  createdAt: number;
}

export interface RecentSearch {
  id: string;
  location: LocationPoint;
  timestamp: number;
}

export interface RecentRoute {
  id: string;
  start: LocationPoint;
  destination: LocationPoint;
  waypoints?: LocationPoint[];
  timestamp: number;
  travelTimeInSeconds?: number;
  lengthInMeters?: number;
}

export interface UserPreferences {
  language: 'ar' | 'en';
  distanceUnit: 'km' | 'mi';
  trafficDefault: boolean;
  theme: 'dark' | 'light';
}
