'use client';

/**
 * Leaflet Visual Route Builder
 * File: src/components/schools/maps/LeafletRouteBuilder.tsx
 *
 * 100% Free, Google-Free interactive route planning component powered by Leaflet,
 * OpenStreetMap tiles, Nominatim place search, and OSRM road geometry.
 *
 * Mental Model:
 * 🏫 Campus (Fixed Anchor) ───► ① Stop 1 ───► ② Stop 2 ───► ③ Stop 3
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type L from 'leaflet';
import {
  MapPin,
  Search,
  Check,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  AlertTriangle,
  Navigation,
  Eye,
  EyeOff,
  RotateCcw,
  Loader2,
  X,
  Maximize2,
  LocateFixed,
  Bus,
} from 'lucide-react';
import type { TransportRoute, TransportRouteStop } from '@/lib/types';
import type { Coordinates } from './mapTypes';
import {
  isValidCoordinatePair,
  getDeterministicRouteColor,
  validateRoutePublishability,
  type PublicTransportRoute,
  type PublicRouteStop,
  type PublicRouteGeometry,
} from '@/lib/publicTransportUtils';
import { createDefaultRouteStop } from '@/lib/transportUtils';
import {
  DEFAULT_TILE_URL,
  MAP_ATTRIBUTION,
  DEFAULT_MAP_CENTER,
  createCampusIcon,
  createStopIcon,
  createTemporaryStopIcon,
  createBusIcon,
} from '@/lib/services/mapService';
import { searchLocations, reverseGeocode, type GeocodingResult } from '@/lib/services/geocodingService';
import { fetchRouteGeometry } from '@/lib/services/routeGeometryService';

export interface LeafletRouteBuilderProps {
  route: TransportRoute;
  campusCoordinates: Coordinates | null;
  campusName?: string;
  routeColor?: string;
  onChangeRoute: (updatedRoute: TransportRoute) => void;
  onDeleteRoute?: (routeId: string) => void;
  isWebsiteOnly?: boolean;
  onUpdateCampusCoordinates?: (coords: Coordinates) => void;
}

export default function LeafletRouteBuilder({
  route,
  campusCoordinates,
  campusName = 'Main Campus',
  routeColor: initialRouteColor,
  onChangeRoute,
  onDeleteRoute,
  isWebsiteOnly = false,
  onUpdateCampusCoordinates,
}: LeafletRouteBuilderProps) {
  // Deterministic color
  const routeColor = useMemo(() => {
    return initialRouteColor || getDeterministicRouteColor(route.routeCode || route.id, 0);
  }, [initialRouteColor, route.routeCode, route.id]);

  // Campus Pin adjustment state
  const [isAdjustingCampus, setIsAdjustingCampus] = useState(false);
  const isAdjustingCampusRef = useRef(false);
  const onUpdateCampusCoordinatesRef = useRef(onUpdateCampusCoordinates);

  useEffect(() => {
    isAdjustingCampusRef.current = isAdjustingCampus;
  }, [isAdjustingCampus]);

  useEffect(() => {
    onUpdateCampusCoordinatesRef.current = onUpdateCampusCoordinates;
  }, [onUpdateCampusCoordinates]);

  // Leaflet library instance loaded client-side
  const [LInstance, setLInstance] = useState<typeof L | null>(null);

  // Map DOM ref and Leaflet Map instance ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const campusMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Active UI states
  const [isAddingStop, setIsAddingStop] = useState(false);
  const [newStopName, setNewStopName] = useState('');
  const [newStopLandmark, setNewStopLandmark] = useState('');
  const [newStopCoords, setNewStopCoords] = useState<Coordinates | null>(null);
  const [newStopStatus, setNewStopStatus] = useState<'active' | 'inactive'>('active');

  // Nominatim Autocomplete Place Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [placePredictions, setPlacePredictions] = useState<GeocodingResult[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // Marker being adjusted on map
  const [adjustingStopId, setAdjustingStopId] = useState<string | null>(null);

  // Stop inline editing state
  const [editingStopId, setEditingStopId] = useState<string | null>(null);

  // Geometry computation state
  const [geometry, setGeometry] = useState<PublicRouteGeometry | null>(null);
  const [isCalculatingGeometry, setIsCalculatingGeometry] = useState(false);
  const [routingWarning, setRoutingWarning] = useState<string | null>(null);

  // Publishability validation
  const validationResult = useMemo(() => {
    return validateRoutePublishability(route, campusCoordinates);
  }, [route, campusCoordinates]);

  const activeStops = useMemo(() => {
    return (route.stops || [])
      .filter((s) => s.status !== 'inactive')
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [route.stops]);

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
    if (!LInstance || !mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = campusCoordinates && isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude)
      ? [campusCoordinates.latitude, campusCoordinates.longitude]
      : [DEFAULT_MAP_CENTER.latitude, DEFAULT_MAP_CENTER.longitude];

    const map = LInstance.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
    });

    LInstance.tileLayer(DEFAULT_TILE_URL, {
      attribution: MAP_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = LInstance.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapRef.current = map;

    // Handle Map Click to place temporary stop or set campus pin
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (isAdjustingCampusRef.current && onUpdateCampusCoordinatesRef.current) {
        onUpdateCampusCoordinatesRef.current({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
        });
      } else {
        handlePlacePin(lat, lng);
      }
    });

    const handleZoomChange = () => {
      if (!mapRef.current || !campusMarkerRef.current || !LInstance) return;
      const currentZoom = mapRef.current.getZoom();
      campusMarkerRef.current.setIcon(
        createCampusIcon(LInstance, campusName, {
          isAdjusting: isAdjustingCampusRef.current,
          zoomLevel: currentZoom,
        })
      );
    };

    map.on('zoomend', handleZoomChange);

    return () => {
      map.remove();
      mapRef.current = null;
      campusMarkerRef.current = null;
    };
  }, [LInstance, campusCoordinates, campusName]);

  // ─── 3. ROAD GEOMETRY RECALCULATION ───────────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    async function updateGeometry() {
      const validStops = activeStops.filter((s) => isValidCoordinatePair(s.latitude, s.longitude));

      if (validStops.length === 0) {
        setGeometry(null);
        setRoutingWarning(null);
        return;
      }

      setIsCalculatingGeometry(true);
      try {
        const publicRoute: PublicTransportRoute = {
          id: route.id,
          routeCode: route.routeCode || '',
          routeName: route.routeName || '',
          routeType: 'both',
          morningTripEnabled: true,
          afternoonTripEnabled: true,
          stops: route.stops?.map((s) => ({
            id: s.id,
            stopName: s.stopName,
            sequenceOrder: s.sequenceOrder,
            coordinates: isValidCoordinatePair(s.latitude, s.longitude)
              ? { latitude: s.latitude!, longitude: s.longitude! }
              : null,
            hasValidCoordinates: isValidCoordinatePair(s.latitude, s.longitude),
          })) || [],
          stopCount: route.stops?.length || 0,
          stopsWithCoordinatesCount: validStops.length,
          color: routeColor,
          isActive: route.status !== 'inactive',
        };

        const geom = await fetchRouteGeometry(publicRoute, campusCoordinates, 'stops_to_campus');

        if (!isCancelled) {
          setGeometry(geom);
          if (!geom.isRoadFollowing && validStops.length >= 1) {
            setRoutingWarning('Showing direct connections (road routing service temporarily unavailable).');
          } else {
            setRoutingWarning(null);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.warn('[LeafletRouteBuilder] Geometry calculation error:', err);
          setRoutingWarning('Direct line fallback active.');
        }
      } finally {
        if (!isCancelled) {
          setIsCalculatingGeometry(false);
        }
      }
    }

    updateGeometry();

    return () => {
      isCancelled = true;
    };
  }, [activeStops, campusCoordinates, route.id, route.routeCode, route.routeName, route.status, route.stops, routeColor]);

  // ─── 4. RENDER MAP MARKERS & POLYLINES ──────────────────────────────────────
  useEffect(() => {
    if (!LInstance || !mapRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    // Remove existing polyline if present
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    const boundsPoints: L.LatLngExpression[] = [];

    // 1. Campus Marker
    if (campusCoordinates && isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude)) {
      const campusLatLng: [number, number] = [campusCoordinates.latitude, campusCoordinates.longitude];
      boundsPoints.push(campusLatLng);

      const currentZoom = mapRef.current?.getZoom() || 13;
      const campusMarker = LInstance.marker(campusLatLng, {
        icon: createCampusIcon(LInstance, campusName, {
          isAdjusting: isAdjustingCampus,
          zoomLevel: currentZoom,
        }),
        draggable: isAdjustingCampus,
        zIndexOffset: isAdjustingCampus ? 1300 : 1000,
      });

      campusMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 2px;">
          <div style="font-size: 11px; font-weight: 800; color: #1E1B4B; text-transform: uppercase;">School Hub</div>
          <div style="font-size: 13px; font-weight: 700; color: #131B2E; margin-top: 2px;">${campusName}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Fixed Route Origin Anchor</div>
          ${
            isAdjustingCampus
              ? '<div style="font-size: 10px; color: #4338CA; font-weight: 700; margin-top: 4px;">● Draggable — drag pin to position campus</div>'
              : ''
          }
        </div>
      `);

      if (isAdjustingCampus && onUpdateCampusCoordinates) {
        campusMarker.on('dragend', async () => {
          const newPos = campusMarker.getLatLng();
          onUpdateCampusCoordinates({
            latitude: Number(newPos.lat.toFixed(6)),
            longitude: Number(newPos.lng.toFixed(6)),
          });
        });
      }

      layer.addLayer(campusMarker);
      campusMarkerRef.current = campusMarker;
    } else {
      campusMarkerRef.current = null;
    }

    // 2. Active Stops Markers
    activeStops.forEach((stop) => {
      if (!isValidCoordinatePair(stop.latitude, stop.longitude)) return;

      const stopLatLng: [number, number] = [stop.latitude!, stop.longitude!];
      boundsPoints.push(stopLatLng);

      const isBeingAdjusted = adjustingStopId === stop.id;
      const stopMarker = LInstance.marker(stopLatLng, {
        icon: createStopIcon(LInstance, stop.sequenceOrder, routeColor, isBeingAdjusted),
        draggable: isBeingAdjusted,
        zIndexOffset: isBeingAdjusted ? 900 : 500,
      });

      stopMarker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 2px; min-width: 140px;">
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${routeColor};"></span>
            <span style="font-size: 10px; font-weight: 800; color: #64748B;">STOP #${stop.sequenceOrder}</span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #131B2E; margin-top: 2px;">${stop.stopName}</div>
          ${stop.landmarkAddress ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">${stop.landmarkAddress}</div>` : ''}
          <div style="font-size: 10px; color: #10B981; font-weight: 700; margin-top: 4px;">✓ Location Selected</div>
        </div>
      `);

      // Handle marker drag end
      if (isBeingAdjusted) {
        stopMarker.on('dragend', async () => {
          const newPos = stopMarker.getLatLng();
          const rev = await reverseGeocode(newPos.lat, newPos.lng);

          const updatedStops = (route.stops || []).map((s) => {
            if (s.id === stop.id) {
              return {
                ...s,
                latitude: Number(newPos.lat.toFixed(6)),
                longitude: Number(newPos.lng.toFixed(6)),
                landmarkAddress: rev?.locality || rev?.displayName || s.landmarkAddress,
              };
            }
            return s;
          });

          onChangeRoute({ ...route, stops: updatedStops });
          setAdjustingStopId(null);
        });
      }

      layer.addLayer(stopMarker);
    });

    // 3. Temporary Stop Marker (When adding a stop)
    if (newStopCoords && isValidCoordinatePair(newStopCoords.latitude, newStopCoords.longitude)) {
      const tempLatLng: [number, number] = [newStopCoords.latitude, newStopCoords.longitude];
      boundsPoints.push(tempLatLng);

      const tempMarker = LInstance.marker(tempLatLng, {
        icon: createTemporaryStopIcon(LInstance, routeColor),
        draggable: true,
        zIndexOffset: 1200,
      });

      tempMarker.on('dragend', async () => {
        const pos = tempMarker.getLatLng();
        setNewStopCoords({ latitude: pos.lat, longitude: pos.lng });
        const rev = await reverseGeocode(pos.lat, pos.lng);
        if (rev) {
          if (!newStopName || newStopName.startsWith('Stop')) {
            setNewStopName(rev.locality || rev.displayName.split(',')[0] || '');
          }
          if (rev.displayName) {
            setNewStopLandmark(rev.displayName);
          }
        }
      });

      layer.addLayer(tempMarker);
      tempMarkerRef.current = tempMarker;
    }

    // 4. Draw Polyline (Road-following OSRM or straight fallback)
    if (geometry && geometry.path.length >= 2) {
      const polyPoints: [number, number][] = geometry.path.map((p) => [p.latitude, p.longitude]);

      const polyline = LInstance.polyline(polyPoints, {
        color: routeColor,
        weight: 4.5,
        opacity: 0.85,
        dashArray: geometry.isRoadFollowing ? undefined : '8, 6',
        lineJoin: 'round',
      }).addTo(mapRef.current);

      polylineRef.current = polyline;
    }
  }, [LInstance, activeStops, adjustingStopId, campusCoordinates, campusName, geometry, isAdjustingCampus, newStopCoords, newStopName, onChangeRoute, onUpdateCampusCoordinates, route, routeColor]);

  // ─── 5. FIT ROUTE BOUNDS ───────────────────────────────────────────────────
  const fitRouteBounds = useCallback(() => {
    if (!LInstance || !mapRef.current) return;

    const points: [number, number][] = [];
    if (campusCoordinates && isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude)) {
      points.push([campusCoordinates.latitude, campusCoordinates.longitude]);
    }
    activeStops.forEach((s) => {
      if (isValidCoordinatePair(s.latitude, s.longitude)) {
        points.push([s.latitude!, s.longitude!]);
      }
    });

    if (newStopCoords && isValidCoordinatePair(newStopCoords.latitude, newStopCoords.longitude)) {
      points.push([newStopCoords.latitude, newStopCoords.longitude]);
    }

    if (points.length > 0) {
      const bounds = LInstance.latLngBounds(points);
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [LInstance, activeStops, campusCoordinates, newStopCoords]);

  // ─── 5B. ANIMATED BUS MOVING TOWARD SCHOOL CAMPUS ────────────────────────
  const [isBusAnimationActive, setIsBusAnimationActive] = useState(true);

  useEffect(() => {
    if (
      !isBusAnimationActive ||
      !LInstance ||
      !mapRef.current ||
      !geometry ||
      geometry.path.length < 2
    ) {
      if (busMarkerRef.current) {
        busMarkerRef.current.remove();
        busMarkerRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const path = geometry.path;
    const totalPoints = path.length;

    // Calculate cumulative segment distances
    const dists: number[] = [0];
    let totalDist = 0;
    for (let i = 0; i < totalPoints - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const d = Math.hypot(p2.latitude - p1.latitude, p2.longitude - p1.longitude);
      totalDist += d;
      dists.push(totalDist);
    }

    if (totalDist === 0) return;

    // Helper: calculate bearing in degrees (0 = North, 90 = East, etc.)
    const getBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
      const x =
        Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
        Math.sin((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.cos(((lon2 - lon1) * Math.PI) / 180);
      return (Math.atan2(y, x) * 180) / Math.PI;
    };

    // Initial position at source pickup stop (path[0])
    const initialPos = path[0];
    const initialBearing =
      totalPoints > 1
        ? getBearing(path[0].latitude, path[0].longitude, path[1].latitude, path[1].longitude)
        : 0;

    const busMarker = LInstance.marker([initialPos.latitude, initialPos.longitude], {
      icon: createBusIcon(LInstance, {
        color: routeColor,
        heading: initialBearing,
        isLive: true,
        routeCode: route.routeCode || 'BUS',
      }),
      zIndexOffset: 1600,
    }).addTo(mapRef.current);

    busMarker.bindPopup(`
      <div style="font-family: system-ui, sans-serif; padding: 4px;">
        <div style="font-size: 10px; font-weight: 800; color: #10B981; text-transform: uppercase;">● Bus in Transit</div>
        <div style="font-size: 13px; font-weight: 800; color: #131B2E; margin-top: 2px;">Moving Toward ${campusName || 'Main Campus'}</div>
        <div style="font-size: 11px; color: #64748B; margin-top: 2px;">Morning route from pickup stops to school</div>
      </div>
    `);

    busMarkerRef.current = busMarker;

    let startTime = performance.now();
    const tripDuration = Math.max(7000, Math.min(18000, totalPoints * 1200));
    const pauseDuration = 1600; // 1.6s pause at school campus
    const cycleDuration = tripDuration + pauseDuration;

    let isCancelled = false;

    const animate = (currentTime: number) => {
      if (isCancelled || !busMarkerRef.current || !mapRef.current) return;

      const elapsed = (currentTime - startTime) % cycleDuration;

      let currentLat = initialPos.latitude;
      let currentLng = initialPos.longitude;
      let heading = initialBearing;
      let isAtCampus = false;

      if (elapsed < tripDuration) {
        const progress = elapsed / tripDuration;
        const targetDist = progress * totalDist;

        let segIdx = 0;
        for (let i = 0; i < totalPoints - 1; i++) {
          if (targetDist >= dists[i] && targetDist <= dists[i + 1]) {
            segIdx = i;
            break;
          }
        }

        const segStartDist = dists[segIdx];
        const segEndDist = dists[segIdx + 1];
        const segSpan = segEndDist - segStartDist;
        const segFraction = segSpan > 0 ? (targetDist - segStartDist) / segSpan : 0;

        const pStart = path[segIdx];
        const pEnd = path[segIdx + 1];

        currentLat = pStart.latitude + (pEnd.latitude - pStart.latitude) * segFraction;
        currentLng = pStart.longitude + (pEnd.longitude - pStart.longitude) * segFraction;
        heading = getBearing(pStart.latitude, pStart.longitude, pEnd.latitude, pEnd.longitude);
      } else {
        // Paused at destination: School Campus!
        isAtCampus = true;
        const campusPos = path[totalPoints - 1];
        currentLat = campusPos.latitude;
        currentLng = campusPos.longitude;
        if (totalPoints >= 2) {
          heading = getBearing(
            path[totalPoints - 2].latitude,
            path[totalPoints - 2].longitude,
            campusPos.latitude,
            campusPos.longitude
          );
        }
      }

      busMarker.setLatLng([currentLat, currentLng]);
      busMarker.setIcon(
        createBusIcon(LInstance, {
          color: routeColor,
          heading,
          isLive: true,
          routeCode: isAtCampus ? '🏫 ARRIVED' : route.routeCode || 'BUS',
        })
      );

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      isCancelled = true;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (busMarkerRef.current) {
        busMarkerRef.current.remove();
        busMarkerRef.current = null;
      }
    };
  }, [LInstance, campusName, geometry, isBusAnimationActive, route.routeCode, route.routeName, routeColor]);

  // ─── 6. PLACE PIN HANDLER (CLICK OR SEARCH) ───────────────────────────────
  const handlePlacePin = async (lat: number, lng: number, placeName?: string) => {
    setIsAddingStop(true);
    setNewStopCoords({ latitude: lat, longitude: lng });

    if (mapRef.current) {
      mapRef.current.panTo([lat, lng]);
    }

    const rev = await reverseGeocode(lat, lng);
    if (placeName) {
      setNewStopName(placeName);
      setNewStopLandmark(rev?.displayName || '');
    } else if (rev) {
      setNewStopName(rev.locality || rev.displayName.split(',')[0] || `Stop ${activeStops.length + 1}`);
      setNewStopLandmark(rev.displayName);
    } else {
      setNewStopName(`Stop ${activeStops.length + 1}`);
    }
  };

  // ─── 7. SEARCH LOCATIONS DEBOUNCE ──────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setPlacePredictions([]);
      setShowPredictions(false);
      return;
    }

    setIsSearchingPlaces(true);
    const timer = setTimeout(async () => {
      const results = await searchLocations(searchQuery);
      setPlacePredictions(results);
      setShowPredictions(true);
      setIsSearchingPlaces(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── 8. ADD STOP SAVE ──────────────────────────────────────────────────────
  const handleConfirmAddStop = () => {
    if (!newStopName.trim()) {
      alert('Please enter a Pickup Point Name.');
      return;
    }

    if (!newStopCoords || !isValidCoordinatePair(newStopCoords.latitude, newStopCoords.longitude)) {
      alert('Please select a location on the map for this pickup point.');
      return;
    }

    const newStop = createDefaultRouteStop(
      {
        id: `stop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        stopName: newStopName.trim(),
        sequenceOrder: (route.stops?.length || 0) + 1,
        latitude: newStopCoords.latitude,
        longitude: newStopCoords.longitude,
        landmarkAddress: newStopLandmark.trim() || undefined,
        status: newStopStatus,
      },
      (route.stops?.length || 0) + 1
    );

    const nextStops = [...(route.stops || []), newStop];
    onChangeRoute({ ...route, stops: nextStops });

    setIsAddingStop(false);
    setNewStopCoords(null);
    setSearchQuery('');
    setShowPredictions(false);
  };

  // ─── 9. SEQUENCE REORDERING ───────────────────────────────────────────────
  const handleMoveStop = (stopId: string, direction: 'up' | 'down') => {
    const current = [...(route.stops || [])];
    const index = current.findIndex((s) => s.id === stopId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const temp = current[index];
      current[index] = current[index - 1];
      current[index - 1] = temp;
    } else if (direction === 'down' && index < current.length - 1) {
      const temp = current[index];
      current[index] = current[index + 1];
      current[index + 1] = temp;
    }

    // Re-assign 1-based sequential sequenceOrder
    const resequenced = current.map((s, idx) => ({
      ...s,
      sequenceOrder: idx + 1,
    }));

    onChangeRoute({ ...route, stops: resequenced });
  };

  // ─── 10. DELETE STOP ───────────────────────────────────────────────────────
  const handleDeleteStop = (stopId: string) => {
    const nextStops = (route.stops || [])
      .filter((s) => s.id !== stopId)
      .map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));

    onChangeRoute({ ...route, stops: nextStops });
  };

  return (
    <div className="space-y-4">
      {/* ─── HEADER BAR: ROUTE NAME, VISIBILITY & ACTIONS ─────────────────────── */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
              style={{ backgroundColor: routeColor }}
              title={`Route Color: ${routeColor}`}
            />
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                value={route.routeName || ''}
                onChange={(e) => onChangeRoute({ ...route, routeName: e.target.value })}
                placeholder="Route Name (e.g. North Route)"
                className="font-extrabold text-sm sm:text-base text-[#131B2E] border border-slate-200 hover:border-indigo-300 focus:border-indigo-600 rounded-xl px-3 py-1.5 w-full outline-hidden transition"
              />
            </div>

            {route.routeCode && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {route.routeCode}
              </span>
            )}

            {/* Publishability Status */}
            {validationResult.isPublishable ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                <Check className="w-3 h-3" />
                ✓ Ready for Website
              </span>
            ) : (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 shadow-2xs">
                <AlertTriangle className="w-3 h-3" />
                ⚠ Needs Attention
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Show on Website Toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={route.status !== 'inactive'}
                onChange={(e) =>
                  onChangeRoute({ ...route, status: e.target.checked ? 'active' : 'inactive' })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Show on Website</span>
            </label>

            {onDeleteRoute && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete ${route.routeName || 'this route'}?`)) {
                    onDeleteRoute(route.id);
                  }
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                title="Delete Route"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Missing campus coordinates alert */}
        {(!campusCoordinates || !isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude)) && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Campus location is missing. Set your school location on the map to display routes and waypoints.</span>
            </div>
            {onUpdateCampusCoordinates && (
              <button
                type="button"
                onClick={() => {
                  const center = mapRef.current
                    ? mapRef.current.getCenter()
                    : { lat: DEFAULT_MAP_CENTER.latitude, lng: DEFAULT_MAP_CENTER.longitude };
                  onUpdateCampusCoordinates({
                    latitude: Number(center.lat.toFixed(6)),
                    longitude: Number(center.lng.toFixed(6)),
                  });
                  setIsAdjustingCampus(true);
                  setAdjustingStopId(null);
                  setIsAddingStop(false);
                }}
                className="px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 shrink-0 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>+ Set Campus Pin on Map</span>
              </button>
            )}
          </div>
        )}

        {/* Non-blocking OSRM routing warning */}
        {routingWarning && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>{routingWarning}</span>
          </div>
        )}
      </div>

      {/* ─── TWO-COLUMN WORKSPACE: LEFT STOPS LIST | RIGHT LEAFLET MAP ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ─── LEFT COLUMN: ROUTE STOPS TIMELINE (COL-SPAN-5) ───────────────── */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#131B2E] uppercase tracking-wider">
              Route Stops ({route.stops?.length || 0})
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Road order: Stop 1 ➔ Stop 2 ➔ Main Campus 🏫
            </span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {/* ORDERED STOPS LIST (Source / Pickup Stops leading to School Campus) */}
            {(route.stops || []).map((stop, sIdx) => {
              const isAdjusting = adjustingStopId === stop.id;
              const isEditing = editingStopId === stop.id;
              const isFirst = sIdx === 0;

              return (
                <React.Fragment key={stop.id}>
                  <div
                    className={`p-3 rounded-2xl border transition-all ${
                      stop.status === 'inactive'
                        ? 'bg-slate-50 border-slate-200 opacity-65'
                        : isAdjusting
                        ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Stop Number Circle Marker */}
                        <span
                          className="w-6 h-6 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs mt-0.5"
                          style={{ backgroundColor: routeColor }}
                        >
                          {stop.sequenceOrder}
                        </span>

                        {/* Stop Info or Edit Form */}
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={stop.stopName}
                                onChange={(e) => {
                                  const updatedStops = (route.stops || []).map((s) =>
                                    s.id === stop.id ? { ...s, stopName: e.target.value } : s
                                  );
                                  onChangeRoute({ ...route, stops: updatedStops });
                                }}
                                className="w-full px-2 py-1 text-xs border border-indigo-300 rounded-lg font-bold"
                                placeholder="Stop name (e.g. Town Hall)"
                              />
                              <input
                                type="text"
                                value={stop.landmarkAddress || ''}
                                onChange={(e) => {
                                  const updatedStops = (route.stops || []).map((s) =>
                                    s.id === stop.id ? { ...s, landmarkAddress: e.target.value } : s
                                  );
                                  onChangeRoute({ ...route, stops: updatedStops });
                                }}
                                className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded-lg text-slate-600"
                                placeholder="Landmark or locality description"
                              />
                              <button
                                type="button"
                                onClick={() => setEditingStopId(null)}
                                className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Done Editing
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h5 className="font-extrabold text-xs text-[#131B2E] truncate">
                                  {stop.stopName}
                                </h5>
                                {isFirst && (
                                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                                    Source / 1st Pickup
                                  </span>
                                )}
                              </div>
                              {stop.landmarkAddress && (
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {stop.landmarkAddress}
                                </p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  ✓ Location selected
                                </span>
                                {stop.status === 'inactive' && (
                                  <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls: Reorder, Adjust, Edit, Delete */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={sIdx === 0}
                          onClick={() => handleMoveStop(stop.id, 'up')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move earlier in route"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={sIdx === (route.stops?.length || 0) - 1}
                          onClick={() => handleMoveStop(stop.id, 'down')}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move later in route"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Adjust Pin on Map */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isAdjusting) {
                              setAdjustingStopId(null);
                            } else {
                              setAdjustingStopId(stop.id);
                              if (stop.latitude && stop.longitude && mapRef.current) {
                                mapRef.current.panTo([stop.latitude, stop.longitude]);
                              }
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                            isAdjusting
                              ? 'bg-[#4338CA] text-white border-[#4338CA]'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-indigo-50'
                          }`}
                          title="Drag pin on map to reposition"
                        >
                          {isAdjusting ? 'Done Pin' : 'Adjust Pin'}
                        </button>

                        {/* Edit Stop Text */}
                        <button
                          type="button"
                          onClick={() => setEditingStopId(isEditing ? null : stop.id)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                          title="Edit stop text"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active / Inactive */}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedStops = (route.stops || []).map((s) =>
                              s.id === stop.id
                                ? { ...s, status: (s.status === 'inactive' ? 'active' : 'inactive') as any }
                                : s
                            );
                            onChangeRoute({ ...route, stops: updatedStops });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          title={stop.status === 'inactive' ? 'Make active' : 'Mark inactive'}
                        >
                          {stop.status === 'inactive' ? (
                            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>

                        {/* Delete Stop */}
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(stop.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Remove stop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vertical Connector Arrow between stops */}
                  <div className="flex justify-center py-0.5">
                    <div className="w-0.5 h-3 bg-slate-300"></div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* 🏫 FIXED CAMPUS DESTINATION CARD (School Arrival Hub) */}
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isAdjustingCampus
                  ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-300 shadow-md'
                  : 'border-[#1E1B4B]/20 bg-[#1E1B4B]/5 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5 ${
                      isAdjustingCampus ? 'bg-[#4338CA] text-white animate-pulse' : 'bg-[#1E1B4B] text-white'
                    }`}
                  >
                    🏫
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#1E1B4B] uppercase tracking-wider block">
                        Fixed Route Destination
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        School Arrival
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-[#131B2E] truncate">{campusName}</h5>
                    {campusCoordinates && isValidCoordinatePair(campusCoordinates.latitude, campusCoordinates.longitude) ? (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          {campusCoordinates.latitude.toFixed(4)}, {campusCoordinates.longitude.toFixed(4)}
                        </span>
                        {isAdjustingCampus && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded animate-pulse">
                            Drag pin or click map to move
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Pin not placed on map
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {onUpdateCampusCoordinates && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!campusCoordinates) {
                          const center = mapRef.current
                            ? mapRef.current.getCenter()
                            : { lat: DEFAULT_MAP_CENTER.latitude, lng: DEFAULT_MAP_CENTER.longitude };
                          onUpdateCampusCoordinates({
                            latitude: Number(center.lat.toFixed(6)),
                            longitude: Number(center.lng.toFixed(6)),
                          });
                          setIsAdjustingCampus(true);
                        } else {
                          const nextState = !isAdjustingCampus;
                          setIsAdjustingCampus(nextState);
                          if (nextState && mapRef.current) {
                            mapRef.current.panTo([campusCoordinates.latitude, campusCoordinates.longitude]);
                          }
                        }
                        setAdjustingStopId(null);
                        setIsAddingStop(false);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        isAdjustingCampus
                          ? 'bg-[#4338CA] text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200'
                      }`}
                      title={isAdjustingCampus ? 'Done adjusting' : 'Adjust campus pin on map'}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{isAdjustingCampus ? 'Done' : campusCoordinates ? 'Adjust Pin' : '+ Set Pin'}</span>
                    </button>
                  )}
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Destination
                  </span>
                </div>
              </div>
            </div>

            {/* ─── INLINE ADD STOP PANEL ────────────────────────────────────── */}
            {isAddingStop ? (
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2.5 mt-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    New Pickup Stop #{(route.stops?.length || 0) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingStop(false);
                      setNewStopCoords(null);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Nominatim Place Search Autocomplete */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search locality, chowk, landmark, or PIN code..."
                      className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-hidden shadow-2xs font-medium"
                    />
                    {isSearchingPlaces && (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-2.5" />
                    )}
                  </div>

                  {/* Prediction Results Dropdown */}
                  {showPredictions && placePredictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {placePredictions.map((pred) => (
                        <div
                          key={pred.placeId}
                          onClick={() => {
                            handlePlacePin(pred.latitude, pred.longitude, pred.name);
                            setShowPredictions(false);
                            setSearchQuery(pred.name);
                          }}
                          className="px-3 py-2 text-xs hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <div className="font-bold text-slate-800">{pred.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{pred.displayName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Or click directly on the map to drop a pin.</span>
                </div>

                {/* Stop Name Input */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Pickup Point Name *</label>
                  <input
                    type="text"
                    value={newStopName}
                    onChange={(e) => setNewStopName(e.target.value)}
                    placeholder="e.g. Piprakothi Chowk"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                {/* Landmark Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Landmark / Address (Optional)</label>
                  <input
                    type="text"
                    value={newStopLandmark}
                    onChange={(e) => setNewStopLandmark(e.target.value)}
                    placeholder="e.g. Near SBI Bank"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Location indicator */}
                <div className="flex items-center justify-between text-xs pt-1">
                  {newStopCoords ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      ✓ Location pinned on map
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      ⚠ Click map or search place
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleConfirmAddStop}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition"
                  >
                    Add Stop to Route
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAddingStop(true);
                  setNewStopName(`Stop ${(route.stops?.length || 0) + 1}`);
                  setNewStopLandmark('');
                  setNewStopCoords(null);
                }}
                className="w-full py-2.5 px-3 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition mt-2 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: DOMINANT LEAFLET INTERACTIVE MAP (COL-SPAN-7) ───── */}
        <div className="lg:col-span-7 space-y-2">
          {/* Active Campus Adjusting Mode Indicator */}
          {isAdjustingCampus && (
            <div className="p-3 bg-[#4338CA] text-white rounded-2xl flex items-center justify-between gap-3 shadow-md text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  🏫
                </span>
                <div className="min-w-0">
                  <span className="font-extrabold block text-white text-xs">Adjusting School Campus Location</span>
                  <span className="text-indigo-100 text-[11px] block truncate">
                    Click anywhere on the map or drag the 🏫 pin to set the campus transit origin.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustingCampus(false)}
                className="px-3.5 py-1.5 bg-white text-[#4338CA] hover:bg-indigo-50 rounded-xl font-extrabold text-xs shadow-xs cursor-pointer shrink-0 transition flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Pin</span>
              </button>
            </div>
          )}

          <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
            {/* Map Canvas Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[540px] z-0"
              style={{ minHeight: '520px' }}
            />

            {/* Map Action Controls Overlay */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              {geometry && geometry.path.length >= 2 && (
                <button
                  type="button"
                  onClick={() => setIsBusAnimationActive((prev) => !prev)}
                  className={`px-2.5 py-1.5 backdrop-blur-xs border rounded-xl shadow-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    isBusAnimationActive
                      ? 'bg-emerald-50/95 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-white/95 border-slate-200 text-slate-700 hover:text-indigo-600'
                  }`}
                  title="Toggle bus animation moving toward school campus"
                >
                  <Bus className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isBusAnimationActive ? 'Bus Moving ➔ School' : 'Start Bus'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={fitRouteBounds}
                className="px-2.5 py-1.5 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-sm text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-white flex items-center gap-1 cursor-pointer transition"
                title="Fit Route within Viewport"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Fit Route</span>
              </button>
            </div>

            {/* Calculating Geometry Overlay */}
            {isCalculatingGeometry && (
              <div className="absolute bottom-3 left-3 z-10 px-3 py-1 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-full shadow-sm text-[11px] font-bold text-indigo-700 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Calculating road geometry...</span>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute bottom-3 right-3 z-10 px-3 py-2 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-sm text-[10px] font-bold text-slate-700 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>🏫</span>
                <span>Campus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: routeColor }}
                />
                <span>Pickup Stop</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-4 h-1 rounded-full"
                  style={{ backgroundColor: routeColor }}
                />
                <span>Road Path</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bus className="w-3 h-3 text-amber-500" />
                <span>Bus ➔ School</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
