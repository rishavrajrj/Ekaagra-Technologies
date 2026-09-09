/**
 * Live Bus Location Service
 * File: src/lib/services/liveLocationService.ts
 *
 * Coordinates live driver phone GPS broadcasting via navigator.geolocation
 * and real-time parent tracking via Supabase Realtime channels.
 *
 * Hard Requirements:
 * - Real GPS truth from driver device; never simulated; never snapped to stops.
 * - Throttled updates to optimize battery and avoid redundant database writes.
 * - Proper error handling (permission denied, GPS unavailable, timeout, non-HTTPS).
 * - Stale location detection (5-minute threshold) with zero stale-as-live deceit.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSchoolsServerClient } from '@/lib/schoolsDb';

export interface LiveBusLocation {
  id?: string;
  routeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  status: 'active' | 'idle' | 'completed' | 'stale';
  recordedAt: string;
}

export interface DriverTrackingState {
  isActive: boolean;
  routeId: string | null;
  lastLocation: LiveBusLocation | null;
  error: string | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unavailable';
}

const STALE_LOCATION_THRESHOLD_SECONDS = 300; // 5 minutes

// Active watch ID in browser memory
let activeWatchId: number | null = null;
let lastPostedTimestamp = 0;
let lastPostedLat: number | null = null;
let lastPostedLng: number | null = null;

// Throttling configuration: at most once every 4 seconds, or when moved > 10m
const MIN_UPDATE_INTERVAL_MS = 4000;
const MIN_DISTANCE_THRESHOLD_METERS = 10;

let browserClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client suitable for Realtime subscriptions and location updates.
 */
export function getLiveLocationClient(): SupabaseClient | null {
  if (browserClient) return browserClient;

  const url =
    process.env.NEXT_PUBLIC_SCHOOLS_SUPABASE_URL ||
    process.env.SCHOOLS_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;

  const key =
    process.env.NEXT_PUBLIC_SCHOOLS_SUPABASE_ANON_KEY ||
    process.env.SCHOOLS_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  try {
    browserClient = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return browserClient;
  } catch (err) {
    console.warn('[LiveLocationService] Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Calculates geodesic distance between two points in meters (Haversine).
 */
function getMetersBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Determines whether a location timestamp is older than the stale threshold.
 */
export function isLocationStale(
  recordedAt: string | Date | null | undefined,
  thresholdSeconds: number = STALE_LOCATION_THRESHOLD_SECONDS
): boolean {
  if (!recordedAt) return true;
  const recordedTime = new Date(recordedAt).getTime();
  if (Number.isNaN(recordedTime)) return true;
  const now = Date.now();
  const diffSeconds = (now - recordedTime) / 1000;
  return diffSeconds > thresholdSeconds;
}

/**
 * Posts a GPS location update to Supabase.
 * Tries server endpoint first, then falls back to direct client insertion.
 */
export async function postLiveLocation(location: Omit<LiveBusLocation, 'id'>): Promise<boolean> {
  try {
    const payload = {
      route_id: location.routeId,
      latitude: Number(location.latitude.toFixed(7)),
      longitude: Number(location.longitude.toFixed(7)),
      accuracy: location.accuracy ? Number(location.accuracy.toFixed(2)) : null,
      heading: location.heading ? Number(location.heading.toFixed(2)) : null,
      speed: location.speed ? Number(location.speed.toFixed(2)) : null,
      status: location.status,
      recorded_at: location.recordedAt,
    };

    // 1. Try posting via API route
    if (typeof window !== 'undefined') {
      try {
        const apiRes = await fetch('/api/transport/live-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (apiRes.ok) return true;
      } catch {
        // Fallback to direct client
      }
    }

    // 2. Direct Supabase client insertion fallback
    const client = getLiveLocationClient() || getSchoolsServerClient();
    if (!client) {
      console.warn('[LiveLocationService] Supabase client unavailable for location write.');
      return false;
    }

    const { error } = await client.from('school_transport_live_locations').insert([payload]);
    if (error) {
      console.warn('[LiveLocationService] Failed to insert location update:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[LiveLocationService] Error posting location update:', err);
    return false;
  }
}

/**
 * Initiates live driver GPS tracking using the browser Geolocation API.
 */
export function startDriverLocationSharing(
  routeId: string,
  onLocationUpdate?: (loc: LiveBusLocation) => void,
  onError?: (err: string) => void
): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    const msg = 'Geolocation is not supported by your browser.';
    onError?.(msg);
    return () => {};
  }

  // Stop any prior active watch
  stopDriverLocationSharing();

  activeWatchId = navigator.geolocation.watchPosition(
    async (position) => {
      const now = Date.now();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const heading = position.coords.heading ?? undefined;
      const speed = position.coords.speed ?? undefined;

      // Check throttle threshold
      const timeSinceLast = now - lastPostedTimestamp;
      const distanceSinceLast =
        lastPostedLat !== null && lastPostedLng !== null
          ? getMetersBetween(lastPostedLat, lastPostedLng, lat, lng)
          : Infinity;

      if (timeSinceLast < MIN_UPDATE_INTERVAL_MS && distanceSinceLast < MIN_DISTANCE_THRESHOLD_METERS) {
        return;
      }

      lastPostedTimestamp = now;
      lastPostedLat = lat;
      lastPostedLng = lng;

      const loc: LiveBusLocation = {
        routeId,
        latitude: lat,
        longitude: lng,
        accuracy,
        heading: heading || undefined,
        speed: speed || undefined,
        status: 'active',
        recordedAt: new Date(now).toISOString(),
      };

      onLocationUpdate?.(loc);
      await postLiveLocation(loc);
    },
    (err) => {
      let message = 'Unable to retrieve location.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Location permission denied. Please enable GPS permissions in your browser settings.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'GPS position unavailable. Please ensure location services are enabled on your device.';
          break;
        case err.TIMEOUT:
          message = 'GPS request timed out. Retrying...';
          break;
      }
      onError?.(message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000,
    }
  );

  return stopDriverLocationSharing;
}

/**
 * Stops active driver GPS tracking.
 */
export function stopDriverLocationSharing(): void {
  if (activeWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
    lastPostedTimestamp = 0;
    lastPostedLat = null;
    lastPostedLng = null;
  }
}

/**
 * Fetches the latest recorded GPS location for a specific route.
 */
export async function getLatestBusLocation(routeId: string): Promise<LiveBusLocation | null> {
  try {
    const client = getLiveLocationClient() || getSchoolsServerClient();
    if (!client) return null;

    const { data, error } = await client
      .from('school_transport_live_locations')
      .select('*')
      .eq('route_id', routeId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      routeId: data.route_id,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      accuracy: data.accuracy ? Number(data.accuracy) : undefined,
      heading: data.heading ? Number(data.heading) : undefined,
      speed: data.speed ? Number(data.speed) : undefined,
      status: data.status,
      recordedAt: data.recorded_at,
    };
  } catch (err) {
    console.warn('[LiveLocationService] Error fetching latest bus location:', err);
    return null;
  }
}

/**
 * Subscribes to realtime GPS updates for a specific route via Supabase Realtime channel.
 * Returns an unsubscribe teardown function.
 */
export function subscribeToBusLocation(
  routeId: string,
  onLocationUpdate: (loc: LiveBusLocation) => void
): () => void {
  const client = getLiveLocationClient();
  if (!client || !routeId) {
    return () => {};
  }

  try {
    const channel = client
      .channel(`live-bus-${routeId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'school_transport_live_locations',
          filter: `route_id=eq.${routeId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          const loc: LiveBusLocation = {
            id: row.id,
            routeId: row.route_id,
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            accuracy: row.accuracy ? Number(row.accuracy) : undefined,
            heading: row.heading ? Number(row.heading) : undefined,
            speed: row.speed ? Number(row.speed) : undefined,
            status: row.status,
            recordedAt: row.recorded_at,
          };

          onLocationUpdate(loc);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('[LiveLocationService] Subscription setup error:', err);
    return () => {};
  }
}
