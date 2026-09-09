/**
 * Public School Transport Data Transformation & Sanitization Layer
 * File: src/lib/publicTransportUtils.ts
 *
 * Transforms internal ERP transport structures into a clean, sanitized public model
 * suitable for public website visitors. Ensures no sensitive or private data
 * (students, attendance, driver personal phone numbers, vehicle compliance docs)
 * is ever transmitted to the public UI.
 */

import type { Coordinates } from '@/components/schools/maps/mapTypes';
import type {
  TransportData,
  TransportRoute,
  TransportRouteStop,
  TransportVehicle,
} from './types';

// ─── PUBLIC DATA TYPES ────────────────────────────────────────────────────────

export interface PublicSchoolLocation {
  name: string;
  coordinates: Coordinates | null;
  address?: string;
  landmark?: string;
}

export interface PublicRouteStop {
  id: string;
  stopName: string;
  sequenceOrder: number;
  pickupTime?: string;
  dropTime?: string;
  coordinates: Coordinates | null;
  landmarkAddress?: string;
  hasValidCoordinates: boolean;
}

export interface PublicRouteGeometry {
  path: Coordinates[];
  isRoadFollowing: boolean;
  provider?: 'directions_service' | 'stored' | 'direct';
}

export interface PublicTransportRoute {
  id: string;
  routeCode: string;
  routeName: string;
  routeType: string;
  morningTripEnabled: boolean;
  afternoonTripEnabled: boolean;
  stops: PublicRouteStop[];
  stopCount: number;
  stopsWithCoordinatesCount: number;
  geometry?: PublicRouteGeometry;
  color: string;
  isActive: boolean;
  approximateDistanceKm?: number;
  estimatedDurationMinutes?: number;
}

export interface PublicTransportMapModel {
  isEnabled: boolean;
  isConfigured: boolean;
  statusMessage?: string;
  school: PublicSchoolLocation;
  routes: PublicTransportRoute[];
  totalActiveRoutes: number;
  totalStops: number;
  areasServed: string[];
}

// ─── DETERMINISTIC COLOR PALETTE ──────────────────────────────────────────────

export const ROUTE_COLOR_PALETTE: readonly string[] = [
  '#E53935', // Route 01 — Red
  '#1976D2', // Route 02 — Blue
  '#2EAD4B', // Route 03 — Green
  '#F57C00', // Route 04 — Orange
  '#7B3FE4', // Route 05 — Purple
  '#E83E8C', // Route 06 — Pink
  '#0FA3B1', // Route 07 — Cyan/Teal
  '#F4B400', // Route 08 — Amber
  '#4F46E5', // Route 09 — Indigo
  '#0D9488', // Route 10 — Teal
  '#DB2777', // Route 11 — Rose
  '#475569', // Route 12 — Slate-Gray
] as const;

const ROUTE_PALETTE_LENGTH = ROUTE_COLOR_PALETTE.length;

/**
 * Deterministically assigns a color from the palette based on route index and/or route code hash.
 * Route 01 -> Red (#E53935), Route 02 -> Blue (#1976D2), etc.
 * Ensures colors never change randomly across re-renders and match across Onboarding and Public pages.
 */
export function getDeterministicRouteColor(routeCodeOrId: string, index: number = 0): string {
  if (typeof index === 'number' && index >= 0) {
    return ROUTE_COLOR_PALETTE[index % ROUTE_PALETTE_LENGTH];
  }

  if (!routeCodeOrId) {
    return ROUTE_COLOR_PALETTE[0];
  }

  let hash = 0;
  for (let i = 0; i < routeCodeOrId.length; i++) {
    hash = (hash << 5) - hash + routeCodeOrId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const positiveHash = Math.abs(hash);
  return ROUTE_COLOR_PALETTE[positiveHash % ROUTE_PALETTE_LENGTH];
}

// ─── COORDINATE VALIDATION HELPER ────────────────────────────────────────────

export function isValidCoordinatePair(lat?: number | null, lng?: number | null): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  // Latitude: [-90, 90], Longitude: [-180, 180]
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Exclude exact (0, 0) default origin
  if (lat === 0 && lng === 0) return false;
  return true;
}

/**
 * Extracts coordinates from map URLs (Google Maps, OpenStreetMap, geo links, etc.)
 */
export function extractCoordinatesFromUrl(url?: string | null): Coordinates | null {
  if (!url || typeof url !== 'string') return null;
  const decoded = decodeURIComponent(url);

  // 1. Check for /@lat,lng format: e.g. /@26.6538,84.9031
  const atMatch = decoded.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidCoordinatePair(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 2. Check for query parameters: ?q=lat,lng or ?ll=lat,lng or ?query=lat,lng
  const qMatch = decoded.match(/[?&](?:q|ll|query)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    const lat = parseFloat(qMatch[1]);
    const lng = parseFloat(qMatch[2]);
    if (isValidCoordinatePair(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 3. Check for !3dlat!4dlng (Google Maps protobuf data URL format)
  const dataMatch = decoded.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lng = parseFloat(dataMatch[2]);
    if (isValidCoordinatePair(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  // 4. Check for direct "lat,lng" string format
  const directMatch = decoded.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
  if (directMatch) {
    const lat = parseFloat(directMatch[1]);
    const lng = parseFloat(directMatch[2]);
    if (isValidCoordinatePair(lat, lng)) {
      return { latitude: Number(lat.toFixed(6)), longitude: Number(lng.toFixed(6)) };
    }
  }

  return null;
}

// ─── SANITIZATION ADAPTER ─────────────────────────────────────────────────────

export interface RawTransportInput {
  transportConfig?: Partial<TransportData> | null;
  schoolName?: string;
  schoolCoordinates?: Coordinates | null;
  schoolAddress?: string;
  // Or direct database entities
  routes?: any[];
  vehicles?: any[];
  stops?: any[];
  settings?: any;
}

/**
 * Transforms raw ERP transport configuration into a sanitized PublicTransportMapModel.
 *
 * Strict public filtering guarantees:
 * - Driver names, employee codes, personal contact numbers are STRIPPED.
 * - Conductor information is STRIPPED.
 * - Student assignments and attendance logs are STRIPPED.
 * - Vehicle compliance documents (insurance, PUC, fitness certs) are STRIPPED.
 * - Inactive, archived, or cancelled routes are EXCLUDED.
 * - Missing coordinates do NOT crash the model.
 */
export function sanitizePublicTransportData(input: RawTransportInput): PublicTransportMapModel {
  const config = input.transportConfig || {};
  const isEnabled = config.enabled ?? (config.status === 'yes');

  const schoolLocation: PublicSchoolLocation = {
    name: input.schoolName || 'School Campus',
    coordinates: isValidCoordinatePair(input.schoolCoordinates?.latitude, input.schoolCoordinates?.longitude)
      ? {
          latitude: Number(input.schoolCoordinates!.latitude.toFixed(6)),
          longitude: Number(input.schoolCoordinates!.longitude.toFixed(6)),
        }
      : null,
    address: input.schoolAddress || '',
  };

  // If transport is disabled or not offered
  if (!isEnabled) {
    return {
      isEnabled: false,
      isConfigured: false,
      statusMessage: 'School transport service is not currently available.',
      school: schoolLocation,
      routes: [],
      totalActiveRoutes: 0,
      totalStops: 0,
      areasServed: [],
    };
  }

  // Extract raw routes and vehicles
  const rawRoutes: any[] = Array.isArray(config.routesList) && config.routesList.length > 0
    ? config.routesList
    : Array.isArray(config.routes) && config.routes.length > 0
    ? config.routes
    : Array.isArray(input.routes)
    ? input.routes
    : [];

  // Filter and transform routes (100% vehicle-independent public model)
  const activeRoutes: PublicTransportRoute[] = [];
  const areasSet = new Set<string>();
  let totalStopsCount = 0;

  for (let idx = 0; idx < rawRoutes.length; idx++) {
    const r = rawRoutes[idx];
    if (!r) continue;

    // Check status: only include active routes
    const rStatus = (r.status || 'active').toLowerCase();
    if (rStatus !== 'active' || r.isActive === false) {
      continue;
    }

    const routeId = String(r.id || `route-${idx}`);
    const routeCode = String(r.routeCode || r.route_code || `RT-${idx + 1}`).trim();
    const routeName = String(r.routeName || r.route_name || `Route ${idx + 1}`).trim();

    // Process ordered stops
    const rawStops: any[] = Array.isArray(r.stops)
      ? r.stops
      : Array.isArray(input.stops)
      ? input.stops.filter((s) => s.route_id === routeId || s.routeId === routeId)
      : [];

    const publicStops: PublicRouteStop[] = [];
    let stopsWithCoordsCount = 0;

    // Sort stops by sequence order
    const sortedStops = [...rawStops].sort((a, b) => {
      const seqA = a.sequenceOrder ?? a.sequence_order ?? 0;
      const seqB = b.sequenceOrder ?? b.sequence_order ?? 0;
      return seqA - seqB;
    });

    for (let sIdx = 0; sIdx < sortedStops.length; sIdx++) {
      const st = sortedStops[sIdx];
      if (!st) continue;

      const stopStatus = (st.status || 'active').toLowerCase();
      if (stopStatus !== 'active') {
        continue;
      }

      const stopId = String(st.id || `${routeId}-stop-${sIdx}`);
      const stopName = String(st.stopName || st.stop_name || `Stop ${sIdx + 1}`).trim();

      const lat = typeof st.latitude === 'number' ? st.latitude : parseFloat(st.latitude);
      const lng = typeof st.longitude === 'number' ? st.longitude : parseFloat(st.longitude);
      const hasCoords = isValidCoordinatePair(lat, lng);

      if (hasCoords) {
        stopsWithCoordsCount++;
      }

      // Collect area name for summary
      if (st.landmarkAddress || st.landmark_address) {
        areasSet.add(st.landmarkAddress || st.landmark_address);
      } else if (stopName.length > 2) {
        areasSet.add(stopName);
      }

      // Format pickup and drop timing (gracefully omit if missing/invalid)
      const pickupTime = (st.pickupTime || st.pickup_time || '').trim() || undefined;
      const dropTime = (st.dropTime || st.drop_time || '').trim() || undefined;
      const landmarkAddress = (st.landmarkAddress || st.landmark_address || '').trim() || undefined;

      publicStops.push({
        id: stopId,
        stopName,
        sequenceOrder: st.sequenceOrder ?? st.sequence_order ?? sIdx + 1,
        pickupTime,
        dropTime,
        coordinates: hasCoords ? { latitude: lat, longitude: lng } : null,
        landmarkAddress,
        hasValidCoordinates: hasCoords,
      });
    }

    totalStopsCount += publicStops.length;

    // Deterministic color assignment
    const color = getDeterministicRouteColor(routeCode || routeId, idx);

    activeRoutes.push({
      id: routeId,
      routeCode,
      routeName,
      routeType: r.routeType || r.route_type || 'both',
      morningTripEnabled: r.morningTripEnabled ?? r.morning_trip_enabled ?? true,
      afternoonTripEnabled: r.afternoonTripEnabled ?? r.afternoon_trip_enabled ?? true,
      stops: publicStops,
      stopCount: publicStops.length,
      stopsWithCoordinatesCount: stopsWithCoordsCount,
      color,
      isActive: true,
      approximateDistanceKm: r.approximateDistanceKm || r.approximate_distance_km,
      estimatedDurationMinutes: r.estimatedDurationMinutes || r.estimated_duration_minutes,
    });
  }

  // Format areas served list (limit to top 10 unique landmarks)
  const areasServed = Array.from(areasSet).slice(0, 10);

  const isConfigured = activeRoutes.length > 0;

  return {
    isEnabled: true,
    isConfigured,
    statusMessage: isConfigured
      ? undefined
      : 'Transport routes are currently being configured.',
    school: schoolLocation,
    routes: activeRoutes,
    totalActiveRoutes: activeRoutes.length,
    totalStops: totalStopsCount,
    areasServed,
  };
}

/**
 * Calculates geographical bounds containing the school, all visible route stops,
 * and the complete road geometry paths if available.
 */
export function calculateVisibleBounds(
  schoolCoords: Coordinates | null,
  routes: PublicTransportRoute[],
  visibleRouteIds: Set<string>,
  geometries?: Record<string, PublicRouteGeometry>
): {
  north: number;
  south: number;
  east: number;
  west: number;
  center: Coordinates;
} | null {
  const points: Coordinates[] = [];

  if (schoolCoords && isValidCoordinatePair(schoolCoords.latitude, schoolCoords.longitude)) {
    points.push(schoolCoords);
  }

  for (const r of routes) {
    if (!visibleRouteIds.has(r.id)) continue;
    for (const s of r.stops) {
      if (s.coordinates && isValidCoordinatePair(s.coordinates.latitude, s.coordinates.longitude)) {
        points.push(s.coordinates);
      }
    }

    // Include road path vertices if geometries are provided
    if (geometries && geometries[r.id]?.path) {
      for (const p of geometries[r.id].path) {
        if (isValidCoordinatePair(p.latitude, p.longitude)) {
          points.push(p);
        }
      }
    }
  }

  if (points.length === 0) return null;

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLng) minLng = p.longitude;
    if (p.longitude > maxLng) maxLng = p.longitude;
  }

  return {
    north: maxLat,
    south: minLat,
    east: maxLng,
    west: minLng,
    center: {
      latitude: Number(((minLat + maxLat) / 2).toFixed(6)),
      longitude: Number(((minLng + maxLng) / 2).toFixed(6)),
    },
  };
}

// ─── SPATIAL DISTANCE & PARENT AREA SEARCH ────────────────────────────────────

/**
 * Calculates geodesic distance between two points using the Haversine formula in meters.
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats a distance in meters to a human-friendly string (e.g. "800 m", "2.4 km").
 */
export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

export interface ParentAreaSearchResult {
  isCovered: boolean;
  matchedRoute: PublicTransportRoute | null;
  matchedStop: PublicRouteStop | null;
  distanceMeters: number | null;
  formattedDistance: string | null;
  statusMessage: string;
  nearestAlternativeRoute: PublicTransportRoute | null;
  nearestAlternativeStop: PublicRouteStop | null;
  nearestAlternativeDistanceMeters: number | null;
  nearestAlternativeFormattedDistance: string | null;
}

/**
 * Searches the school's transport network for parent area queries.
 * Supports:
 * 1. Text match on stop name, landmark, address, or route name.
 * 2. Proximity search if user coordinates are provided or if an exact stop coordinates exist.
 *
 * Maximum coverage threshold for proximity: 2,500 meters (2.5 km).
 */
export function findMatchingRoutesForParent(
  query: string,
  routes: PublicTransportRoute[],
  userCoords?: Coordinates | null
): ParentAreaSearchResult {
  const cleanQuery = (query || '').trim().toLowerCase();

  // If no routes are active
  if (!routes || routes.length === 0) {
    return {
      isCovered: false,
      matchedRoute: null,
      matchedStop: null,
      distanceMeters: null,
      formattedDistance: null,
      statusMessage: 'Transport may not currently cover your area.',
      nearestAlternativeRoute: null,
      nearestAlternativeStop: null,
      nearestAlternativeDistanceMeters: null,
      nearestAlternativeFormattedDistance: null,
    };
  }

  // 1. Text-based direct match on stopName, landmarkAddress, or routeName
  if (cleanQuery.length >= 2) {
    for (const route of routes) {
      for (const stop of route.stops) {
        const stopNameMatch = stop.stopName.toLowerCase().includes(cleanQuery);
        const landmarkMatch = stop.landmarkAddress && stop.landmarkAddress.toLowerCase().includes(cleanQuery);
        const routeNameMatch = route.routeName.toLowerCase().includes(cleanQuery);

        if (stopNameMatch || landmarkMatch || routeNameMatch) {
          let distMeters: number | null = null;
          if (userCoords && stop.coordinates && isValidCoordinatePair(stop.coordinates.latitude, stop.coordinates.longitude)) {
            distMeters = calculateDistanceMeters(userCoords, stop.coordinates);
          }

          return {
            isCovered: true,
            matchedRoute: route,
            matchedStop: stop,
            distanceMeters: distMeters,
            formattedDistance: distMeters !== null ? formatDistanceMeters(distMeters) : null,
            statusMessage: 'Transport available in your area',
            nearestAlternativeRoute: null,
            nearestAlternativeStop: null,
            nearestAlternativeDistanceMeters: null,
            nearestAlternativeFormattedDistance: null,
          };
        }
      }
    }
  }

  // 2. Coordinate proximity search if userCoords are available
  if (userCoords && isValidCoordinatePair(userCoords.latitude, userCoords.longitude)) {
    let bestDist = Infinity;
    let bestRoute: PublicTransportRoute | null = null;
    let bestStop: PublicRouteStop | null = null;

    for (const route of routes) {
      for (const stop of route.stops) {
        if (stop.coordinates && isValidCoordinatePair(stop.coordinates.latitude, stop.coordinates.longitude)) {
          const dist = calculateDistanceMeters(userCoords, stop.coordinates);
          if (dist < bestDist) {
            bestDist = dist;
            bestRoute = route;
            bestStop = stop;
          }
        }
      }
    }

    // Proximity threshold for active coverage: 2.5 km (2500 m)
    if (bestStop && bestRoute && bestDist <= 2500) {
      return {
        isCovered: true,
        matchedRoute: bestRoute,
        matchedStop: bestStop,
        distanceMeters: bestDist,
        formattedDistance: formatDistanceMeters(bestDist),
        statusMessage: 'Transport available in your area',
        nearestAlternativeRoute: null,
        nearestAlternativeStop: null,
        nearestAlternativeDistanceMeters: null,
        nearestAlternativeFormattedDistance: null,
      };
    } else if (bestStop && bestRoute) {
      return {
        isCovered: false,
        matchedRoute: null,
        matchedStop: null,
        distanceMeters: null,
        formattedDistance: null,
        statusMessage: 'Transport may not currently cover your area.',
        nearestAlternativeRoute: bestRoute,
        nearestAlternativeStop: bestStop,
        nearestAlternativeDistanceMeters: bestDist,
        nearestAlternativeFormattedDistance: formatDistanceMeters(bestDist),
      };
    }
  }

  // 3. Fallback: query does not match any stop or landmark
  // Provide the first route's first stop as a nearest reference if available
  const firstRoute = routes[0] || null;
  const firstStop = firstRoute?.stops[0] || null;

  return {
    isCovered: false,
    matchedRoute: null,
    matchedStop: null,
    distanceMeters: null,
    formattedDistance: null,
    statusMessage: 'Transport may not currently cover your area.',
    nearestAlternativeRoute: firstRoute,
    nearestAlternativeStop: firstStop,
    nearestAlternativeDistanceMeters: null,
    nearestAlternativeFormattedDistance: null,
  };
}

// ─── ROUTE PUBLISHABILITY VALIDATION ──────────────────────────────────────────

export interface RouteValidationIssue {
  type: 'error' | 'warning';
  message: string;
}

export interface RoutePublishabilityResult {
  isPublishable: boolean;
  issues: RouteValidationIssue[];
}

/**
 * Validates whether a route has all necessary information to be safely published
 * on the public school website according to Requirement 14.
 */
export function validateRoutePublishability(
  route: Partial<TransportRoute> | null | undefined,
  campusCoordinates?: Coordinates | null
): RoutePublishabilityResult {
  const issues: RouteValidationIssue[] = [];

  if (!route) {
    return {
      isPublishable: false,
      issues: [{ type: 'error', message: 'Route data is missing.' }],
    };
  }

  // 1. Route status
  if (route.status === 'inactive') {
    issues.push({
      type: 'warning',
      message: 'Route is currently marked inactive and will not appear on the website.',
    });
  }

  // 2. Route Name
  if (!route.routeName || !route.routeName.trim()) {
    issues.push({
      type: 'error',
      message: 'Route Name is required.',
    });
  }

  // 3. Campus Coordinates
  if (!campusCoordinates || !isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude)) {
    issues.push({
      type: 'warning',
      message: 'Campus location is required to display transport routes.',
    });
  }

  // 5. Active Stops check
  const activeStops = (route.stops || []).filter((s) => s.status !== 'inactive');
  if (activeStops.length === 0) {
    issues.push({
      type: 'error',
      message: 'At least one active stop must exist before this route can appear on the website.',
    });
  }

  // 6. Stop Locations and Names check
  const seenSequences = new Set<number>();
  for (const stop of activeStops) {
    const stopLabel = stop.stopName ? `"${stop.stopName}"` : `Stop #${stop.sequenceOrder}`;

    if (!stop.stopName || !stop.stopName.trim()) {
      issues.push({
        type: 'error',
        message: `Stop #${stop.sequenceOrder} is missing a stop name.`,
      });
    }

    if (!isValidCoordinatePair(stop.latitude, stop.longitude)) {
      issues.push({
        type: 'error',
        message: `Add a location for ${stopLabel} before this route can appear on the website.`,
      });
    }

    if (seenSequences.has(stop.sequenceOrder)) {
      issues.push({
        type: 'error',
        message: `Duplicate stop sequence order ${stop.sequenceOrder} detected at ${stopLabel}.`,
      });
    }
    seenSequences.add(stop.sequenceOrder);
  }

  const hasErrors = issues.some((i) => i.type === 'error');
  const isPublishable = !hasErrors && (route.status !== 'inactive');

  return {
    isPublishable,
    issues,
  };
}

