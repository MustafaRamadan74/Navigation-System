import { SavedPlace, RecentSearch, RecentRoute, UserPreferences, PlaceCategory } from '../../types/storage';
import { LocationPoint } from '../../types/location';

const STORAGE_KEYS = {
  SAVED_PLACES: 'georoute_saved_places',
  RECENT_SEARCHES: 'georoute_recent_searches',
  RECENT_ROUTES: 'georoute_recent_routes',
  PREFERENCES: 'georoute_user_preferences',
} as const;

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  distanceUnit: 'km',
  trafficDefault: true,
  theme: 'dark',
};

function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

function safeSetItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error saving to localStorage key "${key}":`, err);
  }
}

// ========================
// 1. Saved Places
// ========================

export function getSavedPlaces(): SavedPlace[] {
  return safeGetItem<SavedPlace[]>(STORAGE_KEYS.SAVED_PLACES, []);
}

export function savePlace(
  place: Omit<SavedPlace, 'id' | 'createdAt'>
): SavedPlace {
  const current = getSavedPlaces();
  // If saving Home or Work, replace existing one with the same category
  const filtered = (place.category === 'home' || place.category === 'work')
    ? current.filter((p) => p.category !== place.category)
    : current;

  const newPlace: SavedPlace = {
    ...place,
    id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };

  const updated = [newPlace, ...filtered];
  safeSetItem(STORAGE_KEYS.SAVED_PLACES, updated);
  return newPlace;
}

export function updatePlace(
  id: string,
  updates: Partial<Pick<SavedPlace, 'label' | 'category' | 'location'>>
): SavedPlace | null {
  const current = getSavedPlaces();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedItem: SavedPlace = {
    ...current[index],
    ...updates,
  };

  current[index] = updatedItem;
  safeSetItem(STORAGE_KEYS.SAVED_PLACES, current);
  return updatedItem;
}

export function deletePlace(id: string): void {
  const current = getSavedPlaces();
  const updated = current.filter((p) => p.id !== id);
  safeSetItem(STORAGE_KEYS.SAVED_PLACES, updated);
}

export function getPlaceByCategory(category: PlaceCategory): SavedPlace | undefined {
  const places = getSavedPlaces();
  return places.find((p) => p.category === category);
}

// ========================
// 2. Recent Searches
// ========================

export function getRecentSearches(): RecentSearch[] {
  return safeGetItem<RecentSearch[]>(STORAGE_KEYS.RECENT_SEARCHES, []);
}

export function addRecentSearch(location: LocationPoint): void {
  if (!location || !location.name) return;
  const current = getRecentSearches();

  // Deduplicate by coordinate proximity or exact name
  const filtered = current.filter((item) => {
    const coordMatch =
      Math.abs(item.location.coordinates[0] - location.coordinates[0]) < 0.0002 &&
      Math.abs(item.location.coordinates[1] - location.coordinates[1]) < 0.0002;
    const nameMatch = item.location.name.trim().toLowerCase() === location.name.trim().toLowerCase();
    return !coordMatch && !nameMatch;
  });

  const newSearch: RecentSearch = {
    id: `search-${Date.now()}`,
    location,
    timestamp: Date.now(),
  };

  const updated = [newSearch, ...filtered].slice(0, 10);
  safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, updated);
}

export function clearRecentSearches(): void {
  safeSetItem(STORAGE_KEYS.RECENT_SEARCHES, []);
}

// ========================
// 3. Recent Routes
// ========================

export function getRecentRoutes(): RecentRoute[] {
  return safeGetItem<RecentRoute[]>(STORAGE_KEYS.RECENT_ROUTES, []);
}

export function addRecentRoute(
  start: LocationPoint,
  destination: LocationPoint,
  waypoints: LocationPoint[] = [],
  travelTimeInSeconds?: number,
  lengthInMeters?: number
): void {
  if (!start || !destination) return;
  const current = getRecentRoutes();

  // Deduplicate routes with the same start and destination names
  const filtered = current.filter((r) => {
    const isSameStart =
      Math.abs(r.start.coordinates[0] - start.coordinates[0]) < 0.001 &&
      Math.abs(r.start.coordinates[1] - start.coordinates[1]) < 0.001;
    const isSameDest =
      Math.abs(r.destination.coordinates[0] - destination.coordinates[0]) < 0.001 &&
      Math.abs(r.destination.coordinates[1] - destination.coordinates[1]) < 0.001;
    return !(isSameStart && isSameDest);
  });

  const newRoute: RecentRoute = {
    id: `route-${Date.now()}`,
    start,
    destination,
    waypoints: waypoints.filter((wp) => wp.coordinates[0] !== 0 || wp.coordinates[1] !== 0),
    timestamp: Date.now(),
    travelTimeInSeconds,
    lengthInMeters,
  };

  const updated = [newRoute, ...filtered].slice(0, 6);
  safeSetItem(STORAGE_KEYS.RECENT_ROUTES, updated);
}

export function clearRecentRoutes(): void {
  safeSetItem(STORAGE_KEYS.RECENT_ROUTES, []);
}

// ========================
// 4. User Preferences
// ========================

export function getUserPreferences(): UserPreferences {
  const saved = safeGetItem<Partial<UserPreferences>>(STORAGE_KEYS.PREFERENCES, {});
  return {
    ...DEFAULT_PREFERENCES,
    ...saved,
  };
}

export function saveUserPreferences(prefs: Partial<UserPreferences>): UserPreferences {
  const current = getUserPreferences();
  const updated: UserPreferences = {
    ...current,
    ...prefs,
  };
  safeSetItem(STORAGE_KEYS.PREFERENCES, updated);
  return updated;
}
