/**
 * Geocoding & Reverse Geocoding Service
 * File: src/lib/services/geocodingService.ts
 *
 * Provider-abstracted search and reverse geocoding powered by Nominatim / OpenStreetMap.
 * Zero dependency on Google Places or Google Geocoding API.
 */

import type { Coordinates } from '@/components/schools/maps/mapTypes';
import { isValidCoordinatePair } from '@/lib/publicTransportUtils';

export interface GeocodingResult {
  placeId: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type?: string;
  importance?: number;
}

export interface ReverseGeocodingResult {
  displayName: string;
  locality?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

const NOMINATIM_BASE_URL =
  process.env.NEXT_PUBLIC_GEOCODING_URL || 'https://nominatim.openstreetmap.org';

// In-memory cache for search and reverse geocoding lookups
const searchCache = new Map<string, GeocodingResult[]>();
const reverseCache = new Map<string, ReverseGeocodingResult>();

/**
 * Searches for a location by query string using Nominatim.
 */
export async function searchLocations(
  query: string,
  options: { limit?: number; countryCode?: string } = {}
): Promise<GeocodingResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const { limit = 5, countryCode = 'in' } = options;
  const cacheKey = `${clean.toLowerCase()}_${limit}_${countryCode}`;

  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(
      clean
    )}&addressdetails=1&limit=${limit}${countryCode ? `&countrycodes=${countryCode}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Ekaagra-School-ERP/1.0 (support@ekaagra.com)',
      },
    });

    if (!res.ok) {
      console.warn(`[GeocodingService] Search returned HTTP ${res.status}`);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: GeocodingResult[] = data.map((item: any) => ({
      placeId: String(item.place_id || item.osm_id || Math.random()),
      name: item.name || item.display_name?.split(',')[0] || clean,
      displayName: item.display_name || clean,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      type: item.type,
      importance: item.importance,
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.warn('[GeocodingService] Search request failed:', err);
    return [];
  }
}

/**
 * Reverse geocodes latitude and longitude into an address description.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodingResult | null> {
  if (!isValidCoordinatePair(latitude, longitude)) return null;

  const latFixed = latitude.toFixed(5);
  const lngFixed = longitude.toFixed(5);
  const cacheKey = `${latFixed},${lngFixed}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`;

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Ekaagra-School-ERP/1.0 (support@ekaagra.com)',
      },
    });

    if (!res.ok) {
      console.warn(`[GeocodingService] Reverse geocode returned HTTP ${res.status}`);
      // Fallback coordinate label
      return { displayName: `Location near (${latFixed}, ${lngFixed})` };
    }

    const data = await res.json();
    if (!data || !data.display_name) {
      return { displayName: `Location (${latFixed}, ${lngFixed})` };
    }

    const addr = data.address || {};
    const locality =
      addr.neighbourhood ||
      addr.suburb ||
      addr.village ||
      addr.town ||
      addr.city_district ||
      addr.city;

    const result: ReverseGeocodingResult = {
      displayName: data.display_name,
      locality,
      city: addr.city || addr.town || addr.county,
      state: addr.state,
      postcode: addr.postcode,
    };

    reverseCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('[GeocodingService] Reverse geocode request failed:', err);
    // Graceful fallback coordinate label without throwing
    return { displayName: `Location (${latFixed}, ${lngFixed})` };
  }
}

/**
 * Convenience alias for searchLocations
 */
export const searchPlaces = searchLocations;
