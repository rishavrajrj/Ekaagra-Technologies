/**
 * Route Geometry Service & OSRM Engine
 * File: src/lib/services/routeGeometryService.ts
 *
 * Obtains road-following route polylines connecting the school campus origin and ordered stops
 * using an OSRM-compatible routing engine.
 *
 * Hard Requirement:
 * - 100% Google-Free. Zero Google Directions API or Google Cloud billing dependency.
 * - Graceful fallback: If routing engine is offline or throttled, falls back to direct
 *   geodesic lines without breaking stop management or crashing UI.
 */

import type { Coordinates } from '@/components/schools/maps/mapTypes';
import type { PublicRouteStop, PublicRouteGeometry, PublicTransportRoute } from '@/lib/publicTransportUtils';
import { isValidCoordinatePair } from '@/lib/publicTransportUtils';

const OSRM_ROUTER_URL =
  process.env.NEXT_PUBLIC_ROUTING_URL || 'https://router.project-osrm.org';

// In-memory geometry cache
const geometryCache = new Map<string, PublicRouteGeometry>();
const inFlightRequests = new Map<string, Promise<PublicRouteGeometry>>();

/**
 * Generates a stable cache key based on route ID and coordinates sequence.
 */
function getRouteCacheKey(
  routeId: string,
  schoolCoords: Coordinates | null,
  stops: PublicRouteStop[]
): string {
  const parts: string[] = [routeId];
  if (schoolCoords) {
    parts.push(`s:${schoolCoords.latitude.toFixed(4)},${schoolCoords.longitude.toFixed(4)}`);
  }
  for (const st of stops) {
    if (st.coordinates && isValidCoordinatePair(st.coordinates.latitude, st.coordinates.longitude)) {
      parts.push(`${st.id}:${st.coordinates.latitude.toFixed(4)},${st.coordinates.longitude.toFixed(4)}`);
    }
  }
  return parts.join('|');
}

/**
 * Formats a sequence of coordinates as an OSRM semicolon-delimited string (lng,lat;lng,lat).
 */
export function formatOSRMCoordinates(points: Coordinates[]): string {
  return points.map((p) => `${p.longitude},${p.latitude}`).join(';');
}

/**
 * Combines campus origin/destination with ordered stops to produce the complete waypoint sequence.
 * Defaults to 'campus_to_stops' for backward compatibility with existing tests,
 * and supports 'stops_to_campus' where the last stop/pickup stops direct toward the school campus.
 */
export function getRouteWaypoints(
  schoolCoords: Coordinates | null,
  stops: Coordinates[],
  direction: 'campus_to_stops' | 'stops_to_campus' = 'campus_to_stops'
): Coordinates[] {
  const validStops = stops.filter((st) => isValidCoordinatePair(st.latitude, st.longitude));
  const validCampus =
    schoolCoords && isValidCoordinatePair(schoolCoords.latitude, schoolCoords.longitude)
      ? schoolCoords
      : null;

  if (direction === 'stops_to_campus') {
    const waypoints: Coordinates[] = [...validStops];
    if (validCampus) {
      waypoints.push(validCampus);
    }
    return waypoints;
  }

  // Default 'campus_to_stops'
  const waypoints: Coordinates[] = [];
  if (validCampus) {
    waypoints.push(validCampus);
  }
  waypoints.push(...validStops);
  return waypoints;
}

/**
 * Generates a direct straight-line coordinate path connecting school and stops as a graceful fallback.
 */
export function createDirectFallbackGeometry(
  schoolCoords: Coordinates | null,
  stopsWithCoords: Coordinates[],
  direction: 'campus_to_stops' | 'stops_to_campus' = 'stops_to_campus'
): PublicRouteGeometry {
  const waypoints = getRouteWaypoints(schoolCoords, stopsWithCoords, direction);
  return {
    path: waypoints,
    isRoadFollowing: false,
    provider: 'direct',
  };
}

/**
 * Computes road-following polyline geometry using OSRM for a sequence of points.
 */
export async function fetchOSRMRoute(
  points: Coordinates[]
): Promise<{ path: Coordinates[]; isRoadFollowing: boolean; distanceMeters?: number; durationSeconds?: number }> {
  const validPoints = points.filter((p) => isValidCoordinatePair(p.latitude, p.longitude));

  if (validPoints.length < 2) {
    return { path: validPoints, isRoadFollowing: false };
  }

  try {
    // OSRM expects coordinates in "longitude,latitude" order separated by semicolons
    const coordsString = validPoints.map((p) => `${p.longitude},${p.latitude}`).join(';');
    const url = `${OSRM_ROUTER_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[RouteGeometryService] OSRM returned HTTP ${res.status}`);
      return { path: validPoints, isRoadFollowing: false };
    }

    const data = await res.json();
    if (!data || data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
      console.warn('[RouteGeometryService] OSRM route calculation failed:', data?.code);
      return { path: validPoints, isRoadFollowing: false };
    }

    const primaryRoute = data.routes[0];
    const geoJsonCoords: [number, number][] = primaryRoute.geometry?.coordinates || [];

    // Convert GeoJSON [lng, lat] to Coordinates { latitude: lat, longitude: lng }
    const path: Coordinates[] = geoJsonCoords.map(([lng, lat]) => ({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lng.toFixed(6)),
    }));

    return {
      path,
      isRoadFollowing: true,
      distanceMeters: Math.round(primaryRoute.distance || 0),
      durationSeconds: Math.round(primaryRoute.duration || 0),
    };
  } catch (err) {
    console.warn('[RouteGeometryService] OSRM fetch error, falling back to direct line:', err);
    return { path: validPoints, isRoadFollowing: false };
  }
}

/**
 * Obtains road-following polyline coordinates for a single route connecting campus and ordered stops.
 */
export async function fetchRouteGeometry(
  route: PublicTransportRoute,
  schoolCoords: Coordinates | null,
  direction: 'campus_to_stops' | 'stops_to_campus' = 'stops_to_campus'
): Promise<PublicRouteGeometry> {
  const activeStops = (route.stops || []).filter((s) => s.hasValidCoordinates && s.coordinates);
  const stopsCoords = activeStops.map((s) => s.coordinates!);

  if (stopsCoords.length === 0) {
    return { path: [], isRoadFollowing: false, provider: 'direct' };
  }

  const cacheKey = `${getRouteCacheKey(route.id, schoolCoords, route.stops)}:${direction}`;

  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey)!;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const requestPromise = (async (): Promise<PublicRouteGeometry> => {
    // Build waypoints according to transit direction
    // For school morning transit, the last stop is the source and directs toward the school campus hub
    const waypoints = getRouteWaypoints(schoolCoords, stopsCoords, direction);

    if (waypoints.length < 2) {
      const fallback = createDirectFallbackGeometry(schoolCoords, stopsCoords, direction);
      geometryCache.set(cacheKey, fallback);
      return fallback;
    }

    const osrmResult = await fetchOSRMRoute(waypoints);

    const result: PublicRouteGeometry = {
      path: osrmResult.path.length > 0 ? osrmResult.path : waypoints,
      isRoadFollowing: osrmResult.isRoadFollowing,
      provider: osrmResult.isRoadFollowing ? 'directions_service' : 'direct',
    };

    geometryCache.set(cacheKey, result);
    return result;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

/**
 * Clears the in-memory route geometry cache.
 */
export function clearRouteGeometryCache(): void {
  geometryCache.clear();
}
