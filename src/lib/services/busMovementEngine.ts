/**
 * School Bus Live Movement & Spatial Geometry Engine
 * File: src/lib/services/busMovementEngine.ts
 *
 * Provides:
 * 1. Strict coordinate conversions between Leaflet [lat, lng] and GeoJSON [lng, lat].
 * 2. GPS validation, accuracy thresholding, and noise/teleportation filtering.
 * 3. Route polyline snapping: Projects GPS coordinates to the nearest road geometry segment.
 * 4. Smooth shortest-turn heading/bearing calculation (prevents 360° spins).
 * 5. Time-based position and heading interpolation controllers for smooth animation.
 */

import type { Coordinates } from '@/components/schools/maps/mapTypes';
import { isValidCoordinatePair } from '@/lib/publicTransportUtils';

// ─── 1. COORDINATE CONVERSION UTILITIES ──────────────────────────────────────

/**
 * Converts GeoJSON [longitude, latitude] to Leaflet [latitude, longitude].
 */
export function geoJsonToLeaflet(coords: [number, number]): [number, number] {
  return [coords[1], coords[0]];
}

/**
 * Converts Leaflet [latitude, longitude] to GeoJSON [longitude, latitude].
 */
export function leafletToGeoJson(latLng: [number, number]): [number, number] {
  return [latLng[1], latLng[0]];
}

/**
 * Converts domain Coordinates { latitude, longitude } to Leaflet [latitude, longitude].
 */
export function coordsToLeaflet(coords: Coordinates): [number, number] {
  return [coords.latitude, coords.longitude];
}

/**
 * Converts Leaflet [latitude, longitude] to domain Coordinates { latitude, longitude }.
 */
export function leafletToCoords(latLng: [number, number]): Coordinates {
  return {
    latitude: Number(latLng[0].toFixed(6)),
    longitude: Number(latLng[1].toFixed(6)),
  };
}

// ─── 2. GEODESIC DISTANCE & BEARING HELPERS ──────────────────────────────────

const EARTH_RADIUS_METERS = 6371e3;

/**
 * Calculates accurate geodesic distance between two points in meters (Haversine).
 */
export function calculateMetersBetween(
  p1: { latitude: number; longitude: number },
  p2: { latitude: number; longitude: number }
): number {
  const lat1Rad = (p1.latitude * Math.PI) / 180;
  const lat2Rad = (p2.latitude * Math.PI) / 180;
  const dLatRad = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLngRad = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLngRad / 2) * Math.sin(dLngRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Computes forward compass bearing in degrees [0, 360) from point A to point B.
 */
export function calculateBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const initialBearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (initialBearing + 360) % 360;
}

/**
 * Interpolates smoothly between two angles in degrees using the shortest circular path.
 * Properly handles transitions across 359° <-> 0°/1° without spinning 358°.
 */
export function interpolateHeading(fromHeading: number, toHeading: number, factor: number): number {
  // Normalize both angles to [0, 360)
  const normFrom = ((fromHeading % 360) + 360) % 360;
  const normTo = ((toHeading % 360) + 360) % 360;

  // Shortest angular difference: in range [-180, 180]
  let diff = normTo - normFrom;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  const result = normFrom + diff * Math.max(0, Math.min(1, factor));
  return ((result % 360) + 360) % 360;
}

// ─── 3. ROUTE POLYLINE SNAPPING ──────────────────────────────────────────────

export interface SnappedRouteResult {
  position: Coordinates;
  isSnapped: boolean;
  distanceToRouteMeters: number;
  segmentBearing: number;
  segmentIndex: number;
}

/**
 * Projects a point onto a 2D line segment AB (flat projection approximation using meter scaling).
 * Returns the projected coordinate clamped to segment endpoints [0, 1].
 */
function projectPointToSegment(
  p: Coordinates,
  a: Coordinates,
  b: Coordinates
): { projected: Coordinates; t: number; distanceMeters: number } {
  // Mean latitude for longitude scaling
  const midLat = ((a.latitude + b.latitude) / 2) * (Math.PI / 180);
  const metersPerDegLat = 111132.92;
  const metersPerDegLng = 111412.84 * Math.cos(midLat);

  // Convert to local meter coordinates relative to point A
  const bx = (b.longitude - a.longitude) * metersPerDegLng;
  const by = (b.latitude - a.latitude) * metersPerDegLat;

  const px = (p.longitude - a.longitude) * metersPerDegLng;
  const py = (p.latitude - a.latitude) * metersPerDegLat;

  const segmentLengthSquared = bx * bx + by * by;

  if (segmentLengthSquared <= 1e-6) {
    // Segment A and B are essentially the same point
    return {
      projected: a,
      t: 0,
      distanceMeters: calculateMetersBetween(p, a),
    };
  }

  // Parameter t of projection onto line segment AB: clamp to [0, 1]
  const t = Math.max(0, Math.min(1, (px * bx + py * by) / segmentLengthSquared));

  const projLat = a.latitude + (b.latitude - a.latitude) * t;
  const projLng = a.longitude + (b.longitude - a.longitude) * t;

  const projected: Coordinates = {
    latitude: Number(projLat.toFixed(6)),
    longitude: Number(projLng.toFixed(6)),
  };

  const distanceMeters = calculateMetersBetween(p, projected);

  return { projected, t, distanceMeters };
}

/**
 * Snaps a GPS coordinate to the nearest point on a road route polyline.
 *
 * @param gpsPoint Raw/validated GPS coordinate
 * @param routePath Array of ordered route path vertices
 * @param maxSnapDistanceMeters Threshold distance (default 75m). If the bus is further than this,
 *                              it is likely on an off-route detour and won't be artificially distorted.
 */
export function snapToRoutePolyline(
  gpsPoint: Coordinates,
  routePath: Coordinates[],
  maxSnapDistanceMeters: number = 75
): SnappedRouteResult {
  if (!routePath || routePath.length === 0 || !isValidCoordinatePair(gpsPoint.latitude, gpsPoint.longitude)) {
    return {
      position: gpsPoint,
      isSnapped: false,
      distanceToRouteMeters: Infinity,
      segmentBearing: 0,
      segmentIndex: -1,
    };
  }

  if (routePath.length === 1) {
    const dist = calculateMetersBetween(gpsPoint, routePath[0]);
    return {
      position: routePath[0],
      isSnapped: dist <= maxSnapDistanceMeters,
      distanceToRouteMeters: dist,
      segmentBearing: 0,
      segmentIndex: 0,
    };
  }

  let minDistance = Infinity;
  let bestProjected: Coordinates = gpsPoint;
  let bestBearing = 0;
  let bestIndex = 0;

  for (let i = 0; i < routePath.length - 1; i++) {
    const a = routePath[i];
    const b = routePath[i + 1];

    if (!isValidCoordinatePair(a.latitude, a.longitude) || !isValidCoordinatePair(b.latitude, b.longitude)) {
      continue;
    }

    const { projected, distanceMeters } = projectPointToSegment(gpsPoint, a, b);

    if (distanceMeters < minDistance) {
      minDistance = distanceMeters;
      bestProjected = projected;
      bestBearing = calculateBearing(a, b);
      bestIndex = i;
    }
  }

  const isSnapped = minDistance <= maxSnapDistanceMeters;

  return {
    position: isSnapped ? bestProjected : gpsPoint,
    isSnapped,
    distanceToRouteMeters: Math.round(minDistance * 10) / 10,
    segmentBearing: Math.round(bestBearing),
    segmentIndex: bestIndex,
  };
}

// ─── 4. GPS VALIDATION & TELEPORTATION SANITY FILTER ─────────────────────────

export interface GpsValidationOptions {
  maxAllowedSpeedKmh?: number; // Reject movements implying speed > this (e.g. 120 km/h)
  maxAcceptableAccuracyMeters?: number; // Flag readings with accuracy > 60m
  minMovementThresholdMeters?: number; // Consider stationary if < 3m
}

export interface GpsValidationResult {
  isValid: boolean;
  isTeleportation: boolean;
  isStationary: boolean;
  hasPoorAccuracy: boolean;
  distanceMovedMeters: number;
  calculatedSpeedKmh: number;
  reason?: string;
}

/**
 * Validates whether an incoming GPS location reading is physically plausible compared to
 * the previous confirmed location.
 */
export function validateGpsReading(
  previousLocation: { latitude: number; longitude: number; recordedAt?: string | number } | null,
  newLocation: { latitude: number; longitude: number; accuracy?: number; recordedAt?: string | number },
  options: GpsValidationOptions = {}
): GpsValidationResult {
  const {
    maxAllowedSpeedKmh = 120,
    maxAcceptableAccuracyMeters = 60,
    minMovementThresholdMeters = 3.0,
  } = options;

  if (!isValidCoordinatePair(newLocation.latitude, newLocation.longitude)) {
    return {
      isValid: false,
      isTeleportation: false,
      isStationary: true,
      hasPoorAccuracy: true,
      distanceMovedMeters: 0,
      calculatedSpeedKmh: 0,
      reason: 'Invalid coordinates.',
    };
  }

  const hasPoorAccuracy =
    typeof newLocation.accuracy === 'number' && newLocation.accuracy > maxAcceptableAccuracyMeters;

  if (!previousLocation || !isValidCoordinatePair(previousLocation.latitude, previousLocation.longitude)) {
    // First reading is accepted
    return {
      isValid: true,
      isTeleportation: false,
      isStationary: false,
      hasPoorAccuracy,
      distanceMovedMeters: 0,
      calculatedSpeedKmh: 0,
    };
  }

  const distanceMovedMeters = calculateMetersBetween(previousLocation, newLocation);

  // Micro-fluctuation / stationary filter
  if (distanceMovedMeters < minMovementThresholdMeters) {
    return {
      isValid: true,
      isTeleportation: false,
      isStationary: true,
      hasPoorAccuracy,
      distanceMovedMeters,
      calculatedSpeedKmh: 0,
    };
  }

  // Calculate speed if timestamps are available
  let calculatedSpeedKmh = 0;
  let isTeleportation = false;

  const prevTime = previousLocation.recordedAt
    ? new Date(previousLocation.recordedAt).getTime()
    : 0;
  const newTime = newLocation.recordedAt
    ? new Date(newLocation.recordedAt).getTime()
    : 0;

  if (prevTime > 0 && newTime > prevTime) {
    const elapsedSeconds = (newTime - prevTime) / 1000;
    if (elapsedSeconds > 0) {
      const speedMps = distanceMovedMeters / elapsedSeconds;
      calculatedSpeedKmh = speedMps * 3.6;

      // Teleportation sanity check: vehicle exceeding plausible school bus speed
      if (calculatedSpeedKmh > maxAllowedSpeedKmh && distanceMovedMeters > 150) {
        isTeleportation = true;
      }
    }
  } else if (distanceMovedMeters > 500) {
    // Without valid timestamps, a single jump > 500m is deemed suspicious
    isTeleportation = true;
  }

  return {
    isValid: !isTeleportation,
    isTeleportation,
    isStationary: false,
    hasPoorAccuracy,
    distanceMovedMeters: Math.round(distanceMovedMeters * 10) / 10,
    calculatedSpeedKmh: Math.round(calculatedSpeedKmh * 10) / 10,
    reason: isTeleportation ? `Movement rate exceeds physical sanity check (${Math.round(calculatedSpeedKmh)} km/h)` : undefined,
  };
}

// ─── 5. NATURAL ANIMATION DURATION CALCULATOR ────────────────────────────────

/**
 * Computes a realistic animation duration (in milliseconds) based on geodesic distance
 * between previous and target positions, clamped between minDurationMs and maxDurationMs.
 */
export function calculateNaturalAnimationDuration(
  distanceMeters: number,
  expectedSpeedKmh: number = 35,
  minDurationMs: number = 800,
  maxDurationMs: number = 4000
): number {
  if (distanceMeters <= 0) return minDurationMs;

  const speedMps = (Math.max(15, expectedSpeedKmh) * 1000) / 3600;
  const durationMs = (distanceMeters / speedMps) * 1000;

  return Math.min(maxDurationMs, Math.max(minDurationMs, Math.round(durationMs)));
}
