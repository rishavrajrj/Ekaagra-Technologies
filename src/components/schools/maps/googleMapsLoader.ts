'use client';

import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { MapStatus, MapErrorState } from './mapTypes';

let hasConfiguredLoader = false;
let loadPromise: Promise<GoogleMapsLibraries> | null = null;
let globalAuthFailure = false;
const authListeners = new Set<(err: MapErrorState) => void>();

export interface GoogleMapsLibraries {
  maps: google.maps.MapsLibrary;
  places: google.maps.PlacesLibrary;
  geocoding: google.maps.GeocodingLibrary;
  marker?: google.maps.MarkerLibrary;
}

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}

export function subscribeGoogleMapsAuthError(listener: (err: MapErrorState) => void) {
  authListeners.add(listener);
  if (globalAuthFailure) {
    listener({
      type: 'auth_error',
      message: 'Google Maps authorization failed (invalid API key or domain restriction).',
    });
  }
  return () => {
    authListeners.delete(listener);
  };
}

function notifyAuthFailure(state: MapErrorState) {
  globalAuthFailure = true;
  authListeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      // ignore listener error
    }
  });
}

// Attach gm_authFailure handler on window in browser
if (typeof window !== 'undefined') {
  const existingHandler = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    if (typeof existingHandler === 'function') {
      try {
        existingHandler();
      } catch {
        // ignore
      }
    }
    notifyAuthFailure({
      type: 'auth_error',
      message:
        'Google Maps authorization error. Check API key permissions, billing, or referrer restrictions.',
    });
  };
}

/**
 * Loads all required Google Maps libraries using modern non-deprecated @googlemaps/js-api-loader.
 * Returns null if API key is missing, or rejects with a typed error.
 */
export async function loadGoogleMaps(): Promise<{
  libraries: GoogleMapsLibraries | null;
  status: MapStatus;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { libraries: null, status: 'unavailable', error: 'Window is not defined' };
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return {
      libraries: null,
      status: 'missing_key',
      error: 'Google Maps API key is not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).',
    };
  }

  if (globalAuthFailure) {
    return {
      libraries: null,
      status: 'auth_error',
      error: 'Google Maps authorization failed.',
    };
  }

  try {
    if (!hasConfiguredLoader) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      hasConfiguredLoader = true;
    }

    if (!loadPromise) {
      loadPromise = (async () => {
        const [maps, places, geocoding, marker] = await Promise.all([
          importLibrary('maps'),
          importLibrary('places'),
          importLibrary('geocoding'),
          importLibrary('marker').catch(() => undefined),
        ]);
        return { maps, places, geocoding, marker };
      })();
    }

    const libs = await loadPromise;
    return { libraries: libs, status: 'ready' };
  } catch (err: unknown) {
    loadPromise = null; // allow retry
    const errMsg = err instanceof Error ? err.message : String(err);

    if (
      errMsg.includes('Quota') ||
      errMsg.includes('OverQuota') ||
      errMsg.includes('limit')
    ) {
      return {
        libraries: null,
        status: 'quota_exceeded',
        error: 'Google Maps quota limit reached.',
      };
    }

    if (
      errMsg.includes('Key') ||
      errMsg.includes('Referer') ||
      errMsg.includes('Billing') ||
      errMsg.includes('Unauthorized') ||
      errMsg.includes('ApiNotActivated')
    ) {
      return {
        libraries: null,
        status: 'auth_error',
        error: 'Google Maps API key unauthorized or billing not active.',
      };
    }

    return {
      libraries: null,
      status: 'network_error',
      error: errMsg || 'Failed to connect to Google Maps service.',
    };
  }
}

let geocodingPromise: Promise<google.maps.GeocodingLibrary> | null = null;

/**
 * Lightweight loader that only imports Google Maps Geocoding Library without loading
 * interactive map canvas, map tiles, controls, or places libraries.
 */
export async function loadGoogleMapsGeocoding(): Promise<{
  geocoding: google.maps.GeocodingLibrary | null;
  status: MapStatus;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { geocoding: null, status: 'unavailable', error: 'Window is not defined' };
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return {
      geocoding: null,
      status: 'missing_key',
      error: 'Google Maps API key is not configured (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).',
    };
  }

  if (globalAuthFailure) {
    return {
      geocoding: null,
      status: 'auth_error',
      error: 'Google Maps authorization failed.',
    };
  }

  try {
    if (!hasConfiguredLoader) {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });
      hasConfiguredLoader = true;
    }

    if (!geocodingPromise) {
      geocodingPromise = importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>;
    }

    const geocodingLib = await geocodingPromise;
    return { geocoding: geocodingLib, status: 'ready' };
  } catch (err: unknown) {
    geocodingPromise = null;
    const errMsg = err instanceof Error ? err.message : String(err);

    if (
      errMsg.includes('Quota') ||
      errMsg.includes('OverQuota') ||
      errMsg.includes('limit')
    ) {
      return {
        geocoding: null,
        status: 'quota_exceeded',
        error: 'Google Maps quota limit reached.',
      };
    }

    if (
      errMsg.includes('Key') ||
      errMsg.includes('Referer') ||
      errMsg.includes('Billing') ||
      errMsg.includes('Unauthorized') ||
      errMsg.includes('ApiNotActivated')
    ) {
      return {
        geocoding: null,
        status: 'auth_error',
        error: 'Google Maps API key unauthorized or billing not active.',
      };
    }

    return {
      geocoding: null,
      status: 'network_error',
      error: errMsg || 'Failed to connect to Google Maps geocoding service.',
    };
  }
}

