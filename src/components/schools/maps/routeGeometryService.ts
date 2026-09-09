'use client';

/**
 * Route Geometry Service & Directions Adapter
 * File: src/components/schools/maps/routeGeometryService.ts
 *
 * Provider-abstracted road-following geometry engine powered by OSRM.
 * 100% Google Maps Free.
 */

export {
  fetchRouteGeometry,
  fetchOSRMRoute,
  createDirectFallbackGeometry,
  clearRouteGeometryCache,
} from '@/lib/services/routeGeometryService';
