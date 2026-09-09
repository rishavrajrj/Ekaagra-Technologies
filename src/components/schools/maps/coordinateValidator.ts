import { Coordinates } from './mapTypes';

/**
 * Coordinate Validation & Normalization
 * Strictly validates latitude [-90, 90] and longitude [-180, 180],
 * rejecting NaN, Infinity, null, undefined, or empty values.
 */

export interface CoordinateValidationResult {
  isValid: boolean;
  coordinates: Coordinates | null;
  error?: string;
}

export function isValidLatitude(lat: unknown): lat is number {
  if (lat === null || lat === undefined || lat === '') return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  const num = typeof lat === 'number' ? lat : Number(String(lat).trim());
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= -90 && num <= 90;
}

export function isValidLongitude(lng: unknown): lng is number {
  if (lng === null || lng === undefined || lng === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;
  const num = typeof lng === 'number' ? lng : Number(String(lng).trim());
  return typeof num === 'number' && !isNaN(num) && isFinite(num) && num >= -180 && num <= 180;
}

export function validateCoordinates(
  lat: unknown,
  lng: unknown,
  precision = 6
): CoordinateValidationResult {
  if (lat === null || lat === undefined || lat === '' || lng === null || lng === undefined || lng === '') {
    return { isValid: false, coordinates: null, error: 'Coordinates are empty' };
  }
  if (typeof lat === 'string' && lat.trim() === '') {
    return { isValid: false, coordinates: null, error: 'Latitude is empty' };
  }
  if (typeof lng === 'string' && lng.trim() === '') {
    return { isValid: false, coordinates: null, error: 'Longitude is empty' };
  }

  const numLat = typeof lat === 'number' ? lat : Number(String(lat).trim());
  const numLng = typeof lng === 'number' ? lng : Number(String(lng).trim());

  if (isNaN(numLat) || !isFinite(numLat)) {
    return { isValid: false, coordinates: null, error: 'Latitude must be a valid finite number' };
  }

  if (isNaN(numLng) || !isFinite(numLng)) {
    return { isValid: false, coordinates: null, error: 'Longitude must be a valid finite number' };
  }

  if (numLat < -90 || numLat > 90) {
    return {
      isValid: false,
      coordinates: null,
      error: `Latitude ${numLat} is out of bounds (must be between -90 and 90)`,
    };
  }

  if (numLng < -180 || numLng > 180) {
    return {
      isValid: false,
      coordinates: null,
      error: `Longitude ${numLng} is out of bounds (must be between -180 and 180)`,
    };
  }

  return {
    isValid: true,
    coordinates: {
      latitude: Number(numLat.toFixed(precision)),
      longitude: Number(numLng.toFixed(precision)),
    },
  };
}

export function formatCoordinates(coords: Coordinates | null | undefined): string {
  if (!coords || !isValidLatitude(coords.latitude) || !isValidLongitude(coords.longitude)) {
    return '';
  }
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}

export function generateGoogleMapsUrl(coords: Coordinates | null | undefined): string {
  if (!coords || !isValidLatitude(coords.latitude) || !isValidLongitude(coords.longitude)) {
    return '';
  }
  return `https://www.google.com/maps?q=${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`;
}
