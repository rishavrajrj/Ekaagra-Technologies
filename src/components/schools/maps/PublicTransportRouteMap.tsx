'use client';

/**
 * Public School Transport Route Map & Live Bus Tracking
 * File: src/components/schools/maps/PublicTransportRouteMap.tsx
 *
 * 100% Free, Google-Free interactive map visualizing all active school bus routes
 * with parent area search and live driver GPS tracking.
 *
 * Powered by:
 * - Leaflet & OpenStreetMap tiles (Zero API key, zero billing)
 * - OSRM road-following route polylines with graceful direct-line fallback
 * - Nominatim place search for parent locality queries
 * - Supabase Realtime for live bus GPS tracking from driver devices
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type L from 'leaflet';
import {
  Bus,
  School,
  Clock,
  RotateCcw,
  Check,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Search,
  X,
  Locate,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
  Send,
  Radio,
} from 'lucide-react';
import type { Coordinates } from './mapTypes';
import type {
  PublicTransportMapModel,
  PublicTransportRoute,
  PublicRouteStop,
  PublicRouteGeometry,
  ParentAreaSearchResult,
} from '@/lib/publicTransportUtils';
import {
  calculateVisibleBounds,
  isValidCoordinatePair,
  findMatchingRoutesForParent,
  calculateDistanceMeters,
  formatDistanceMeters,
} from '@/lib/publicTransportUtils';
import {
  DEFAULT_TILE_URL,
  MAP_ATTRIBUTION,
  DEFAULT_MAP_CENTER,
  createCampusIcon,
  createStopIcon,
  createBusIcon,
} from '@/lib/services/mapService';
import { fetchRouteGeometry } from '@/lib/services/routeGeometryService';
import {
  subscribeToBusLocation,
  getLatestBusLocation,
  isLocationStale,
  type LiveBusLocation,
} from '@/lib/services/liveLocationService';
import {
  snapToRoutePolyline,
  validateGpsReading,
  interpolateHeading,
  calculateBearing,
  calculateMetersBetween,
  calculateNaturalAnimationDuration,
  coordsToLeaflet,
} from '@/lib/services/busMovementEngine';

interface PublicTransportRouteMapProps {
  model: PublicTransportMapModel;
  className?: string;
  schoolBrandingColor?: string;
}

export default function PublicTransportRouteMap({
  model,
  className = '',
  schoolBrandingColor = '#4338CA',
}: PublicTransportRouteMapProps) {
  const { school, routes, isEnabled, isConfigured, totalActiveRoutes, totalStops, areasServed } = model;

  // Active visibility states
  const [visibleRouteIds, setVisibleRouteIds] = useState<Set<string>>(() => {
    return new Set(routes.map((r) => r.id));
  });

  // Selected route for highlighting (null = all visible routes shown equally)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Selected stop for mobile or detail popup
  const [activeStop, setActiveStop] = useState<{
    stop: PublicRouteStop;
    route: PublicTransportRoute;
  } | null>(null);

  // Parent area search state
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(null);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [searchResult, setSearchResult] = useState<ParentAreaSearchResult | null>(null);

  // "Request a Pickup Point" Modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    parentName: '',
    studentName: '',
    phone: '',
    areaName: '',
    grade: '',
    notes: '',
  });
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Geometries cache state
  const [geometries, setGeometries] = useState<Record<string, PublicRouteGeometry>>({});

  // Live Bus Locations state: routeId -> LiveBusLocation
  const [liveLocations, setLiveLocations] = useState<Record<string, LiveBusLocation>>({});

  // Leaflet client state
  const [LInstance, setLInstance] = useState<typeof L | null>(null);
  const [mobileTab, setMobileTab] = useState<'search' | 'map' | 'details'>('map');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // DOM Refs
  const containerWrapperRef = useRef<HTMLDivElement>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polylinesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const busLayerRef = useRef<L.LayerGroup | null>(null);
  const busMarkersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const campusMarkerRef = useRef<L.Marker | null>(null);
  const currentZoomRef = useRef<number>(12);
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(true);
  const animFrameRef = useRef<number | null>(null);

  interface LiveBusTracker {
    marker: L.Marker;
    routeId: string;
    rawGps: Coordinates;
    validatedGps: Coordinates;
    snappedPosition: Coordinates;
    startPosition: Coordinates;
    targetPosition: Coordinates;
    currentPosition: Coordinates;
    startHeading: number;
    targetHeading: number;
    currentHeading: number;
    startTime: number;
    durationMs: number;
    isLive: boolean;
    speed?: number;
    lastRecordedAt: string;
  }

  const liveBusTrackersRef = useRef<Map<string, LiveBusTracker>>(new Map());
  const animatedBusesMapRef = useRef<
    Map<string, { marker: L.Marker; stepIndex: number; progress: number; pauseCounter: number }>
  >(new Map());

  // Active route reference
  const selectedRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || null;
  }, [routes, selectedRouteId]);

  const isAllChecked = useMemo(() => {
    return routes.length > 0 && routes.every((r) => visibleRouteIds.has(r.id));
  }, [routes, visibleRouteIds]);

  const toggleAllRoutes = useCallback(() => {
    if (isAllChecked) {
      setVisibleRouteIds(new Set());
      setSelectedRouteId(null);
    } else {
      setVisibleRouteIds(new Set(routes.map((r) => r.id)));
    }
  }, [isAllChecked, routes]);

  const toggleRouteVisibility = useCallback((routeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setVisibleRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) {
        next.delete(routeId);
        if (selectedRouteId === routeId) {
          setSelectedRouteId(null);
        }
      } else {
        next.add(routeId);
      }
      return next;
    });
  }, [selectedRouteId]);

  const handleSelectRoute = useCallback((routeId: string) => {
    if (selectedRouteId === routeId) {
      setSelectedRouteId(null);
    } else {
      setSelectedRouteId(routeId);
      setVisibleRouteIds((prev) => new Set([...Array.from(prev), routeId]));
      setMobileTab('map');
    }
  }, [selectedRouteId]);

  // ─── 1. LOAD LEAFLET CLIENT-SIDE ───────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    import('leaflet').then((leafletModule) => {
      if (isMounted) {
        setLInstance(leafletModule.default || leafletModule);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── 2. INITIALIZE LEAFLET MAP ─────────────────────────────────────────────
  useEffect(() => {
    if (!LInstance || !mapDivRef.current || mapRef.current) return;

    const initialCenter: [number, number] = school.coordinates && isValidCoordinatePair(school.coordinates.latitude, school.coordinates.longitude)
      ? coordsToLeaflet(school.coordinates)
      : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

    const map = LInstance.map(mapDivRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: true,
    });

    LInstance.tileLayer(DEFAULT_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    // Layer groups for clean hierarchical rendering
    const polylinesLayer = LInstance.layerGroup().addTo(map);
    const markersLayer = LInstance.layerGroup().addTo(map);
    const busLayer = LInstance.layerGroup().addTo(map);

    polylinesLayerRef.current = polylinesLayer;
    markersLayerRef.current = markersLayer;
    busLayerRef.current = busLayer;
    mapRef.current = map;

    // Zoom listener: updates campus marker representation across High/Medium/Low tiers
    // without changing the underlying geographic coordinates.
    const handleZoomChange = () => {
      if (!map || !campusMarkerRef.current || !LInstance) return;
      const currentZoom = map.getZoom();
      currentZoomRef.current = currentZoom;
      campusMarkerRef.current.setIcon(
        createCampusIcon(LInstance, school.name, { zoomLevel: currentZoom })
      );
    };

    map.on('zoomend', handleZoomChange);

    return () => {
      map.remove();
      mapRef.current = null;
      campusMarkerRef.current = null;
      polylinesLayerRef.current = null;
      markersLayerRef.current = null;
      busLayerRef.current = null;
      liveBusTrackersRef.current.clear();
      animatedBusesMapRef.current.clear();
    };
  }, [LInstance, school.coordinates, school.name]);

  // ─── 3. FETCH OSRM ROAD GEOMETRIES FOR VISIBLE ROUTES ─────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadGeometries() {
      const neededRoutes = routes.filter(
        (r) => visibleRouteIds.has(r.id) && !geometries[r.id]
      );

      if (neededRoutes.length === 0) return;

      for (const r of neededRoutes) {
        try {
          const geom = await fetchRouteGeometry(r, school.coordinates, 'stops_to_campus');
          if (isMounted) {
            setGeometries((prev) => ({ ...prev, [r.id]: geom }));
          }
        } catch (err) {
          console.warn(`[PublicTransportRouteMap] Failed to load geometry for route ${r.id}:`, err);
        }
      }
    }

    loadGeometries();

    return () => {
      isMounted = false;
    };
  }, [geometries, routes, school.coordinates, visibleRouteIds]);

  // ─── 4. LIVE BUS GPS SUBSCRIPTION ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Fetch initial latest locations for all active routes
    routes.forEach((r) => {
      getLatestBusLocation(r.id).then((loc) => {
        if (loc) {
          setLiveLocations((prev) => ({ ...prev, [r.id]: loc }));
        }
      });

      // Subscribe to Realtime broadcasts for this route
      const unsub = subscribeToBusLocation(r.id, (loc) => {
        setLiveLocations((prev) => ({ ...prev, [r.id]: loc }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [routes]);

  // ─── 5. RENDER STATIC MAP LAYERS (CAMPUS, STOPS, POLYLINES) ────────────────
  useEffect(() => {
    if (!LInstance || !mapRef.current || !markersLayerRef.current || !polylinesLayerRef.current) {
      return;
    }

    const markersGroup = markersLayerRef.current;
    const polyGroup = polylinesLayerRef.current;

    markersGroup.clearLayers();
    polyGroup.clearLayers();
    campusMarkerRef.current = null;

    // 1. Campus Marker (Strictly anchored to saved geographic coordinates)
    if (school.coordinates && isValidCoordinatePair(school.coordinates.latitude, school.coordinates.longitude)) {
      const campusLatLng: [number, number] = coordsToLeaflet(school.coordinates);
      const currentZoom = mapRef.current.getZoom();

      const campusMarker = LInstance.marker(campusLatLng, {
        icon: createCampusIcon(LInstance, school.name, { zoomLevel: currentZoom }),
        zIndexOffset: 1000,
      });

      campusMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px 6px;">
          <div style="font-size: 10px; font-weight: 800; color: #1E1B4B; text-transform: uppercase;">School Campus Hub</div>
          <div style="font-size: 14px; font-weight: 800; color: #131B2E; margin-top: 2px;">${school.name}</div>
          ${school.address ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${school.address}</div>` : ''}
          <div style="font-size: 11px; color: #4338CA; font-weight: 700; margin-top: 4px;">Fixed Origin for All Transit Routes</div>
        </div>
      `);

      markersGroup.addLayer(campusMarker);
      campusMarkerRef.current = campusMarker;
    }

    // 2. Visible Routes Polylines & Stops
    routes.forEach((route) => {
      if (!visibleRouteIds.has(route.id)) return;

      const isSelected = selectedRouteId === route.id;
      const isDimmed = selectedRouteId !== null && !isSelected;

      // Draw Polyline
      const geom = geometries[route.id];
      if (geom && geom.path.length >= 2) {
        const polyPoints: [number, number][] = geom.path.map((p) => [p.latitude, p.longitude]);

        const poly = LInstance.polyline(polyPoints, {
          color: route.color,
          weight: isSelected ? 6 : isDimmed ? 3 : 4.5,
          opacity: isSelected ? 1.0 : isDimmed ? 0.35 : 0.85,
          dashArray: geom.isRoadFollowing ? undefined : '8, 6',
          lineJoin: 'round',
        });

        poly.on('click', () => handleSelectRoute(route.id));
        polyGroup.addLayer(poly);
      }

      // Draw Stop Markers
      route.stops.forEach((stop) => {
        if (!stop.hasValidCoordinates || !stop.coordinates) return;

        const stopLatLng: [number, number] = [stop.coordinates.latitude, stop.coordinates.longitude];

        const stopMarker = LInstance.marker(stopLatLng, {
          icon: createStopIcon(LInstance, stop.sequenceOrder, route.color),
          opacity: isDimmed ? 0.45 : 1.0,
          zIndexOffset: isSelected ? 800 : 400,
        });

        const timingHtml =
          stop.pickupTime || stop.dropTime
            ? `<div style="font-size: 11px; margin-top: 5px; padding: 4px 6px; background: #F8FAFC; border-radius: 6px; border: 1px solid #E2E8F0;">
                ${stop.pickupTime ? `<div>Morning Pickup: <b>${stop.pickupTime}</b></div>` : ''}
                ${stop.dropTime ? `<div>Afternoon Drop: <b>${stop.dropTime}</b></div>` : ''}
              </div>`
            : '';

        stopMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 6px; min-width: 170px;">
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${route.color};"></span>
              <span style="font-size: 10px; font-weight: 800; color: #64748B;">${route.routeName} • STOP #${stop.sequenceOrder}</span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #131B2E; margin-top: 3px;">${stop.stopName}</div>
            ${stop.landmarkAddress ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${stop.landmarkAddress}</div>` : ''}
            ${timingHtml}
          </div>
        `);

        stopMarker.on('click', () => {
          setActiveStop({ stop, route });
        });

        markersGroup.addLayer(stopMarker);
      });
    });
  }, [LInstance, geometries, handleSelectRoute, routes, school.address, school.coordinates, school.name, selectedRouteId, visibleRouteIds]);

  // ─── 5b. LIVE BUS GPS PROCESSOR (VALIDATE, SNAP, & TARGET UPDATE) ─────────
  useEffect(() => {
    if (!LInstance || !busLayerRef.current) return;
    const busGroup = busLayerRef.current;

    // Prune buses for hidden or removed routes
    for (const [routeId, tracker] of liveBusTrackersRef.current.entries()) {
      if (!visibleRouteIds.has(routeId)) {
        busGroup.removeLayer(tracker.marker);
        liveBusTrackersRef.current.delete(routeId);
      }
    }

    routes.forEach((route) => {
      if (!visibleRouteIds.has(route.id)) return;

      const loc = liveLocations[route.id];
      if (!loc || !isValidCoordinatePair(loc.latitude, loc.longitude)) return;
      if (isLocationStale(loc.recordedAt)) return;

      const existingTracker = liveBusTrackersRef.current.get(route.id);

      // Validate GPS Reading against previous
      const validation = validateGpsReading(
        existingTracker ? existingTracker.rawGps : null,
        {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          recordedAt: loc.recordedAt,
        }
      );

      // If obvious GPS jump / teleportation, discard this anomaly
      if (validation.isTeleportation) {
        console.warn(`[PublicTransportRouteMap] Ignored GPS teleport jump for route ${route.id}:`, validation.reason);
        return;
      }

      const rawGps: Coordinates = { latitude: loc.latitude, longitude: loc.longitude };
      const validatedGps: Coordinates = rawGps;

      // Snap to road route geometry if available
      const geom = geometries[route.id];
      let targetPosition: Coordinates = validatedGps;
      let targetHeading: number = typeof loc.heading === 'number' && loc.heading >= 0 ? loc.heading : 0;

      if (geom && geom.path.length >= 2) {
        const snapResult = snapToRoutePolyline(validatedGps, geom.path, 80);
        targetPosition = snapResult.position;
        if (typeof loc.heading !== 'number' || loc.heading < 0) {
          targetHeading = snapResult.segmentBearing;
        }
      } else if (existingTracker && (typeof loc.heading !== 'number' || loc.heading < 0)) {
        targetHeading = calculateBearing(existingTracker.currentPosition, targetPosition);
      }

      // If stationary, preserve previous heading
      if (validation.isStationary && existingTracker) {
        targetHeading = existingTracker.currentHeading;
      }

      const distanceMeters = existingTracker
        ? calculateMetersBetween(existingTracker.currentPosition, targetPosition)
        : 0;

      const durationMs = calculateNaturalAnimationDuration(
        distanceMeters,
        typeof loc.speed === 'number' ? loc.speed * 3.6 : 35
      );

      const now = performance.now();

      if (existingTracker) {
        // Update interpolation target
        existingTracker.rawGps = rawGps;
        existingTracker.validatedGps = validatedGps;
        existingTracker.snappedPosition = targetPosition;
        existingTracker.startPosition = { ...existingTracker.currentPosition };
        existingTracker.targetPosition = targetPosition;
        existingTracker.startHeading = existingTracker.currentHeading;
        existingTracker.targetHeading = targetHeading;
        existingTracker.startTime = now;
        existingTracker.durationMs = durationMs;
        existingTracker.speed = loc.speed;
        existingTracker.lastRecordedAt = loc.recordedAt;
        existingTracker.isLive = true;
      } else {
        // Create new live bus marker
        const busMarker = LInstance.marker([targetPosition.latitude, targetPosition.longitude], {
          icon: createBusIcon(LInstance, {
            color: route.color,
            heading: targetHeading,
            isLive: true,
            routeCode: route.routeCode || route.routeName,
          }),
          zIndexOffset: 1500,
        });

        busMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 6px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: #10B981; width: 8px; height: 8px; border-radius: 50%;"></span>
              <span style="font-size: 10px; font-weight: 800; color: #10B981; text-transform: uppercase;">Live Bus GPS</span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: #131B2E; margin-top: 2px;">${route.routeName}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 3px;">
              Status: <b>Active on Transit</b>
            </div>
            ${typeof loc.speed === 'number' ? `<div style="font-size: 11px; color: #64748B;">Speed: <b>${Math.round(loc.speed * 3.6)} km/h</b></div>` : ''}
            <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">
              Updated: ${new Date(loc.recordedAt).toLocaleTimeString()}
            </div>
          </div>
        `);

        busGroup.addLayer(busMarker);

        liveBusTrackersRef.current.set(route.id, {
          marker: busMarker,
          routeId: route.id,
          rawGps,
          validatedGps,
          snappedPosition: targetPosition,
          currentPosition: targetPosition,
          startPosition: targetPosition,
          targetPosition,
          currentHeading: targetHeading,
          startHeading: targetHeading,
          targetHeading,
          startTime: now,
          durationMs: 0,
          isLive: true,
          speed: loc.speed,
          lastRecordedAt: loc.recordedAt,
        });
      }
    });
  }, [LInstance, geometries, liveLocations, routes, visibleRouteIds]);

  // ─── 5c. BUS INTERPOLATION ANIMATION LOOP (requestAnimationFrame) ─────────
  useEffect(() => {
    if (!LInstance || !mapRef.current || !busLayerRef.current || !isAnimationPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const busGroup = busLayerRef.current;
    const demoSpeed = 0.035;

    // Prune removed demo buses
    for (const [routeId, demoBus] of animatedBusesMapRef.current.entries()) {
      const isVisible = visibleRouteIds.has(routeId);
      const hasLiveGps = liveBusTrackersRef.current.has(routeId);
      const geom = geometries[routeId];
      const hasGeom = !!geom && geom.path.length >= 2;
      if (!isVisible || hasLiveGps || !hasGeom) {
        busGroup.removeLayer(demoBus.marker);
        animatedBusesMapRef.current.delete(routeId);
      }
    }

    // Initialize demo buses for visible routes without active live GPS
    routes.forEach((route) => {
      if (!visibleRouteIds.has(route.id)) return;
      if (liveBusTrackersRef.current.has(route.id)) return;
      const geom = geometries[route.id];
      if (!geom || geom.path.length < 2) return;

      if (!animatedBusesMapRef.current.has(route.id)) {
        const startPoint = geom.path[0];
        const marker = LInstance.marker([startPoint.latitude, startPoint.longitude], {
          icon: createBusIcon(LInstance, {
            color: route.color,
            heading: 0,
            isLive: false,
            routeCode: route.routeCode || route.routeName,
          }),
          zIndexOffset: 1200,
        });

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 4px 6px; min-width: 160px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="background: ${route.color}; width: 8px; height: 8px; border-radius: 50%;"></span>
              <span style="font-size: 10px; font-weight: 800; color: #4338CA; text-transform: uppercase;">School Bus En Route</span>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #131B2E; margin-top: 3px;">${route.routeName}</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Direction: ➔ School Campus Hub</div>
          </div>
        `);

        busGroup.addLayer(marker);
        animatedBusesMapRef.current.set(route.id, {
          marker,
          stepIndex: 0,
          progress: 0,
          pauseCounter: 0,
        });
      }
    });

    const renderLoop = () => {
      const now = performance.now();

      // 1. Animate Live Buses (Interpolate to snapped GPS)
      liveBusTrackersRef.current.forEach((tracker, routeId) => {
        const route = routes.find((r) => r.id === routeId);
        if (!route) return;

        const elapsed = now - tracker.startTime;
        const progress = tracker.durationMs > 0 ? Math.min(1, elapsed / tracker.durationMs) : 1;

        // Linear spatial interpolation
        const currentLat =
          tracker.startPosition.latitude +
          (tracker.targetPosition.latitude - tracker.startPosition.latitude) * progress;
        const currentLng =
          tracker.startPosition.longitude +
          (tracker.targetPosition.longitude - tracker.startPosition.longitude) * progress;

        tracker.currentPosition = {
          latitude: currentLat,
          longitude: currentLng,
        };

        // Smooth shortest-turn heading interpolation
        const currentHeading = interpolateHeading(
          tracker.startHeading,
          tracker.targetHeading,
          progress
        );
        tracker.currentHeading = currentHeading;

        tracker.marker.setLatLng([currentLat, currentLng]);
        tracker.marker.setIcon(
          createBusIcon(LInstance, {
            color: route.color,
            heading: Math.round(currentHeading),
            isLive: true,
            routeCode: route.routeCode || route.routeName,
          })
        );
      });

      // 2. Animate Demo Buses along road geometry (when no live GPS is present)
      animatedBusesMapRef.current.forEach((bus, routeId) => {
        const geom = geometries[routeId];
        const route = routes.find((r) => r.id === routeId);
        if (!geom || geom.path.length < 2 || !route) return;

        if (bus.pauseCounter > 0) {
          bus.pauseCounter--;
          return;
        }

        bus.progress += demoSpeed;
        if (bus.progress >= 1) {
          bus.progress = 0;
          bus.stepIndex++;

          if (bus.stepIndex >= geom.path.length - 1) {
            bus.stepIndex = 0;
            bus.pauseCounter = 60; // 1s pause at campus
          }
        }

        const p1 = geom.path[bus.stepIndex];
        const p2 = geom.path[bus.stepIndex + 1] || p1;

        const lat = p1.latitude + (p2.latitude - p1.latitude) * bus.progress;
        const lng = p1.longitude + (p2.longitude - p1.longitude) * bus.progress;

        const dLat = p2.latitude - p1.latitude;
        const dLng = p2.longitude - p1.longitude;
        const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

        bus.marker.setLatLng([lat, lng]);
        bus.marker.setIcon(
          createBusIcon(LInstance, {
            color: route.color,
            heading,
            isLive: false,
            routeCode: route.routeCode || route.routeName,
          })
        );
      });

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [LInstance, isAnimationPlaying, visibleRouteIds, geometries, routes]);

  // ─── 6. FIT ALL ROUTES BOUNDS ──────────────────────────────────────────────
  const handleFitAllRoutes = useCallback(() => {
    if (!LInstance || !mapRef.current) return;

    const bounds = calculateVisibleBounds(school.coordinates, routes, visibleRouteIds, geometries);
    if (bounds) {
      mapRef.current.fitBounds(
        [
          [bounds.south, bounds.west],
          [bounds.north, bounds.east],
        ],
        { padding: [50, 50], maxZoom: 15 }
      );
    }
  }, [LInstance, geometries, routes, school.coordinates, visibleRouteIds]);

  // ─── 7. PARENT AREA SEARCH ─────────────────────────────────────────────────
  const handleExecuteSearch = useCallback(
    (queryStr: string) => {
      const result = findMatchingRoutesForParent(queryStr, routes, userCoordinates);
      setSearchResult(result);

      if (result.matchedRoute) {
        setSelectedRouteId(result.matchedRoute.id);
        setVisibleRouteIds((prev) => new Set([...Array.from(prev), result.matchedRoute!.id]));

        if (
          result.matchedStop?.coordinates &&
          isValidCoordinatePair(result.matchedStop.coordinates.latitude, result.matchedStop.coordinates.longitude) &&
          mapRef.current
        ) {
          mapRef.current.setView(
            [result.matchedStop.coordinates.latitude, result.matchedStop.coordinates.longitude],
            14
          );
        }
      }
    },
    [routes, userCoordinates]
  );

  // ─── 8. GEOLOCATION ("USE MY LOCATION") ─────────────────────────────────────
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserCoordinates(coords);

        if (mapRef.current) {
          mapRef.current.setView([coords.latitude, coords.longitude], 14);
        }

        const res = findMatchingRoutesForParent('', routes, coords);
        setSearchResult(res);
      },
      (err) => {
        setIsLocatingUser(false);
        alert('Could not retrieve your location. Please check your browser permissions.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      ref={containerWrapperRef}
      className={`relative w-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* ─── MOBILE TAB BAR (SMALL SCREENS) ──────────────────────────────────── */}
      <div className="lg:hidden flex items-center justify-between border-b border-slate-200 bg-slate-50 p-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileTab === 'map' ? 'bg-white shadow-2xs text-[#4338CA]' : 'text-slate-600'
          }`}
        >
          Map View
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('search')}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileTab === 'search' ? 'bg-white shadow-2xs text-[#4338CA]' : 'text-slate-600'
          }`}
        >
          Find Your Area
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2 rounded-xl text-center transition ${
            mobileTab === 'details' ? 'bg-white shadow-2xs text-[#4338CA]' : 'text-slate-600'
          }`}
        >
          Routes ({routes.length})
        </button>
      </div>

      {/* ─── MAIN 3-COLUMN LAYOUT (DESKTOP) ──────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[640px] relative">
        {/* ─── COLUMN 1: PARENT SEARCH & ROUTE SELECTOR (COL-SPAN-4) ─────────── */}
        <div
          className={`lg:col-span-4 border-r border-slate-200 flex flex-col bg-[#FAF7F2]/50 ${
            mobileTab === 'search' || mobileTab === 'details' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Parent Search Box */}
          <div className="p-4 border-b border-slate-200 bg-white space-y-2.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Find Your Area
            </span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteSearch(searchQuery)}
                placeholder="Search your locality, chowk, or village..."
                className="w-full pl-9 pr-16 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-hidden font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => handleExecuteSearch(searchQuery)}
                className="absolute right-1.5 top-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 cursor-pointer transition"
              >
                Search
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleLocateUser}
                disabled={isLocatingUser}
                className="text-indigo-600 hover:text-indigo-800 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Locate className="w-3.5 h-3.5" />
                <span>{isLocatingUser ? 'Detecting Location...' : 'Use My Location'}</span>
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResult(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Route Selector List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-extrabold text-[#131B2E] uppercase tracking-wider">
                All Bus Routes ({routes.length})
              </span>
              <button
                type="button"
                onClick={toggleAllRoutes}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {isAllChecked ? 'Hide All' : 'Show All'}
              </button>
            </div>

            {routes.map((r) => {
              const isVisible = visibleRouteIds.has(r.id);
              const isSelected = selectedRouteId === r.id;
              const liveLoc = liveLocations[r.id];
              const hasActiveGps = liveLoc && !isLocationStale(liveLoc.recordedAt);

              return (
                <div
                  key={r.id}
                  onClick={() => handleSelectRoute(r.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 shadow-md'
                      : isVisible
                      ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Visibility checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleRouteVisibility(r.id, e)}
                        className={`w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition ${
                          isVisible
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'bg-white border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: r.color }}
                          />
                          <div>
                            {r.routeCode && (
                              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-500 block w-fit">
                                {r.routeCode}
                              </span>
                            )}
                            <h4 className="font-extrabold text-xs text-[#131B2E] truncate">
                              {r.routeName}
                            </h4>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {r.stopCount} {r.stopCount === 1 ? 'Pickup Point' : 'Pickup Points'}
                          </span>
                          {r.morningTripEnabled && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              AM
                            </span>
                          )}
                          {r.afternoonTripEnabled && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              PM
                            </span>
                          )}
                          {hasActiveGps && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Live Bus
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── COLUMN 2: DOMINANT INTERACTIVE LEAFLET MAP (COL-SPAN-8) ───────── */}
        <div
          className={`lg:col-span-8 relative flex flex-col ${
            mobileTab === 'map' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Leaflet Map Canvas */}
          <div ref={mapDivRef} className="w-full h-full min-h-[580px] z-0" />

          {/* Top Controls Overlay: Fit All & Active Route Filter */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleFitAllRoutes}
                className="px-3 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-white flex items-center gap-1.5 cursor-pointer transition"
                title="Fit All Routes in Viewport"
              >
                <Locate className="w-3.5 h-3.5" />
                <span>Fit All Routes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnimationPlaying((prev) => !prev)}
                className={`px-3 py-1.5 backdrop-blur-xs border rounded-xl shadow-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                  isAnimationPlaying
                    ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200'
                    : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-white'
                }`}
                title="Toggle animated school buses moving towards school campus"
              >
                <Bus className={`w-3.5 h-3.5 ${isAnimationPlaying ? 'animate-bounce' : ''}`} />
                <span>{isAnimationPlaying ? 'Bus Moving ➔ School' : 'Play Bus Sim'}</span>
              </button>

              {selectedRoute && (
                <button
                  type="button"
                  onClick={() => setSelectedRouteId(null)}
                  className="px-2.5 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-indigo-700 hover:bg-white flex items-center gap-1 cursor-pointer"
                >
                  <span>Showing: {selectedRoute.routeName}</span>
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Live Transit Badge */}
            <div className="pointer-events-auto px-3 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-sm text-[11px] font-bold text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Open Transit Network</span>
            </div>
          </div>

          {/* Bottom Right: Map Legend */}
          <div className="absolute bottom-3 right-3 z-10 p-3 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl shadow-sm text-[11px] font-bold text-slate-700 space-y-1.5 pointer-events-auto">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Map Legend</span>
            <div className="flex items-center gap-2">
              <span>🏫</span>
              <span>School Campus Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Pickup Stop</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 rounded-full bg-indigo-600"></span>
              <span>Road Transit Path</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🚌</span>
              <span>Live School Bus</span>
            </div>
          </div>

          {/* Search Result Overlay Banner (When parent searches) */}
          {searchResult && (
            <div className="absolute bottom-3 left-3 max-w-md z-10 p-4 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-2xl shadow-xl space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    searchResult.isCovered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {searchResult.isCovered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {searchResult.isCovered ? '✓ Transport Available' : 'No Direct Coverage'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchResult(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {searchResult.isCovered && searchResult.matchedRoute && searchResult.matchedStop ? (
                <div className="space-y-1 text-xs">
                  <div className="font-extrabold text-sm text-[#131B2E]">
                    {searchResult.matchedRoute.routeName}
                  </div>
                  <div className="text-slate-600">
                    Nearest Pickup Point: <b>{searchResult.matchedStop.stopName}</b>
                    {searchResult.formattedDistance && ` (~${searchResult.formattedDistance})`}
                  </div>
                  {searchResult.matchedStop.landmarkAddress && (
                    <div className="text-[11px] text-slate-500">
                      Landmark: {searchResult.matchedStop.landmarkAddress}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    Transport is not currently available in this area. Would you like to request a new pickup point?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRequestForm((prev) => ({ ...prev, areaName: searchQuery }));
                      setIsRequestModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Request a Pickup Point
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── "REQUEST A PICKUP POINT" MODAL ──────────────────────────────────── */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  Route Coverage Request
                </span>
                <h4 className="font-extrabold text-base text-[#131B2E]">Request a Pickup Point</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {requestSubmitted ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h5 className="font-bold text-sm text-[#131B2E]">Request Received!</h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Thank you. The transport administration has received your coverage request and will evaluate it for upcoming route expansions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRequestModalOpen(false);
                    setRequestSubmitted(false);
                  }}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Parent / Guardian Name *</label>
                  <input
                    type="text"
                    value={requestForm.parentName}
                    onChange={(e) => setRequestForm({ ...requestForm, parentName: e.target.value })}
                    placeholder="Your Full Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
                  <input
                    type="tel"
                    value={requestForm.phone}
                    onChange={(e) => setRequestForm({ ...requestForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Requested Area / Locality *</label>
                  <input
                    type="text"
                    value={requestForm.areaName}
                    onChange={(e) => setRequestForm({ ...requestForm, areaName: e.target.value })}
                    placeholder="e.g. Belbanwa Chowk"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRequestModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!requestForm.parentName || !requestForm.phone || !requestForm.areaName) {
                        alert('Please fill all required fields.');
                        return;
                      }
                      setRequestSubmitted(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
