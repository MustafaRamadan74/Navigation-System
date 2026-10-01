import ttServices from '@tomtom-international/web-sdk-services';
import { TOMTOM_API_KEY, DEFAULT_MAP_CENTER } from './config';
import { LocationPoint } from '../../types/location';

/**
 * Normalizes Arabic text by removing diacritics and unifying character variants:
 * - Alef variants (أ, إ, آ, ٱ) -> ا
 * - Taa Marbuta (ة) -> ه
 * - Alef Maksura (ى) -> ي
 * - Tatweel (ـ) and Tashkeel (diacritics) removed
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '') // remove tatweel
    .trim()
    .toLowerCase();
}

function hasArabicCharacters(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Generates alternative queries for flexible Arabic matching.
 * e.g., "قسم شرطه اول" <-> "قسم اول"
 */
function getSearchVariants(rawQuery: string): string[] {
  const trimmed = rawQuery.trim();
  const variants = new Set<string>();
  variants.add(trimmed);

  if (hasArabicCharacters(trimmed)) {
    const normalized = normalizeArabic(trimmed);
    variants.add(normalized);

    // Common interchangeable police / district terms in Egyptian addresses
    if (trimmed.includes('شرطه') || trimmed.includes('شرطة')) {
      variants.add(trimmed.replace(/شرط[ةه]\s*/g, '').trim());
      variants.add(normalized.replace(/شرطه\s*/g, '').trim());
    } else if (trimmed.includes('قسم') && !trimmed.includes('شرط')) {
      variants.add(trimmed.replace('قسم', 'قسم شرطة'));
      variants.add(normalized.replace('قسم', 'قسم شرطه'));
    }
  }

  return Array.from(variants).filter((q) => q.length >= 2);
}

export async function searchLocation(
  query: string,
  centerBias?: [number, number]
): Promise<LocationPoint[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) {
    return [];
  }

  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key is not configured. Please set VITE_TOMTOM_API_KEY in .env.');
  }

  const isArabic = hasArabicCharacters(trimmed);
  const centerPoint = centerBias || DEFAULT_MAP_CENTER;
  const variants = getSearchVariants(trimmed);

  try {
    // Perform fuzzy search for query variants concurrently
    const searchPromises = variants.slice(0, 3).map((queryVariant) =>
      ttServices.services.fuzzySearch({
        key: TOMTOM_API_KEY,
        query: queryVariant,
        limit: 10,
        typeahead: true,
        center: centerPoint,
        language: isArabic ? 'ar' : 'en-GB',
        minFuzzyLevel: 1,
        maxFuzzyLevel: 4,
      })
    );

    const responses = await Promise.allSettled(searchPromises);

    const seenCoords = new Set<string>();
    const allResults: LocationPoint[] = [];

    for (const res of responses) {
      if (res.status === 'fulfilled' && res.value && res.value.results) {
        for (const item of res.value.results) {
          if (
            item.position?.lng !== undefined &&
            typeof item.position.lng === 'number' &&
            item.position?.lat !== undefined &&
            typeof item.position.lat === 'number'
          ) {
            // Deduplicate results within ~30 meters (4 decimal places)
            const coordKey = `${item.position.lng.toFixed(4)},${item.position.lat.toFixed(4)}`;
            if (seenCoords.has(coordKey)) {
              continue;
            }
            seenCoords.add(coordKey);

            const poiName = item.poi?.name;
            const freeform = item.address?.freeformAddress || '';
            const name = poiName || freeform.split(',')[0] || trimmed;
            const address = freeform || poiName || 'Unknown location';

            allResults.push({
              id: item.id || `loc-${item.position.lng}-${item.position.lat}`,
              name,
              address,
              coordinates: [item.position.lng, item.position.lat],
            });
          }
        }
      }
    }

    if (allResults.length === 0) {
      return [];
    }

    // Rank results: prioritize items matching normalized query tokens
    const normalizedTokens = normalizeArabic(trimmed).split(/\s+/).filter(Boolean);
    allResults.sort((a, b) => {
      const aNormalized = normalizeArabic(`${a.name} ${a.address}`);
      const bNormalized = normalizeArabic(`${b.name} ${b.address}`);

      const aMatches = normalizedTokens.filter((token) => aNormalized.includes(token)).length;
      const bMatches = normalizedTokens.filter((token) => bNormalized.includes(token)).length;

      return bMatches - aMatches;
    });

    return allResults.slice(0, 8);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to search locations.';
    console.error('TomTom fuzzySearch error:', error);
    throw new Error(message);
  }
}

export async function reverseGeocodeLocation(
  lng: number,
  lat: number
): Promise<LocationPoint> {
  if (!TOMTOM_API_KEY) {
    throw new Error('TomTom API key is not configured. Please set VITE_TOMTOM_API_KEY in .env.');
  }

  try {
    const response = await ttServices.services.reverseGeocode({
      key: TOMTOM_API_KEY,
      position: [lng, lat],
      language: 'ar',
    });

    const firstResult = response?.addresses?.[0];
    const freeform = firstResult?.address?.freeformAddress || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    const name = firstResult?.address?.streetName || freeform.split(',')[0] || 'Current Location';

    return {
      id: `rev-${lng}-${lat}`,
      name,
      address: freeform,
      coordinates: [lng, lat],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to resolve location address.';
    console.error('TomTom reverseGeocode error:', error);
    throw new Error(message);
  }
}
