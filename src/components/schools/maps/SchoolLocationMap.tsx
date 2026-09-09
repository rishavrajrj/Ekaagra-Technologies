'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  Maximize2,
  Minimize2,
  Layers,
  Plus,
  Minus,
  RotateCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  X,
  Target,
} from 'lucide-react';
import type {
  Coordinates,
  LocationAddress,
  LocationChangeEvent,
  LocationSearchResult,
  SchoolLocationMapProps,
  MapStatus,
  MapErrorState,
} from './mapTypes';
import { loadGoogleMaps, subscribeGoogleMapsAuthError, GoogleMapsLibraries } from './googleMapsLoader';
import {
  reverseGeocode,
  fetchPlacePredictions,
  fetchPlaceDetails,
  geocodeAddress,
  buildAddressQuery,
} from './googleMapsService';
import { validateCoordinates, isValidLatitude, isValidLongitude } from './coordinateValidator';

// Default center: Motihari, East Champaran, Bihar, India
const DEFAULT_CENTER: Coordinates = {
  latitude: 26.653841,
  longitude: 84.915234,
};
const DEFAULT_ZOOM = 13;
const PIN_ZOOM = 16;

export default function SchoolLocationMap({
  coordinates,
  initialCenter = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  addressContext,
  searchQuery = '',
  readOnly = false,
  disabled = false,
  heightClassName = 'h-72 sm:h-80 md:h-96',
  onLocationChange,
  onAddressResolve,
  onSearchSelect,
  onError,
  onFocusShareUrl,
  onFocusCoordinates,
}: SchoolLocationMapProps) {
  // Container & Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // State Management
  const [mapStatus, setMapStatus] = useState<MapStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [isLocatingAddress, setIsLocatingAddress] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite'>('roadmap');

  // Search State
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [searchPredictions, setSearchPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Sequence tracking refs to eliminate async race conditions
  const searchSequenceRef = useRef<number>(0);
  const reverseGeocodeSeqRef = useRef<number>(0);
  const predictionSeqRef = useRef<number>(0);
  const locateAddressSeqRef = useRef<number>(0);

  // Notification Banner
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotice = useCallback(
    (notice: { type: 'success' | 'error' | 'info'; text: string } | null, timeoutMs = 4000) => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      setFeedbackNotice(notice);
      if (notice) {
        noticeTimerRef.current = setTimeout(() => {
          setFeedbackNotice(null);
        }, timeoutMs);
      }
    },
    []
  );

  // Check valid coordinates
  const validCoords =
    coordinates &&
    isValidLatitude(coordinates.latitude) &&
    isValidLongitude(coordinates.longitude)
      ? coordinates
      : null;

  // Track coordinates locally for real-time display during pin drag
  const [activeCoords, setActiveCoords] = useState<Coordinates | null>(validCoords);

  useEffect(() => {
    setActiveCoords(validCoords);
  }, [validCoords]);

  // Reverse Geocoding Helper
  const reverseGeocodeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleReverseGeocode = useCallback(
    async (coords: Coordinates, source: LocationChangeEvent['source'], placeName?: string) => {
      if (!geocoderRef.current) return;

      const currentSeq = ++reverseGeocodeSeqRef.current;
      setIsResolvingAddress(true);
      try {
        const result = await reverseGeocode(geocoderRef.current, coords);
        // Discard stale out-of-order responses
        if (reverseGeocodeSeqRef.current !== currentSeq) return;

        if (result && result.addressComponents) {
          onAddressResolve?.(result.addressComponents);
          onLocationChange?.({
            coordinates: coords,
            source,
            resolvedAddress: result.addressComponents,
            placeName: placeName || result.addressComponents.landmark,
          });
        } else {
          onLocationChange?.({
            coordinates: coords,
            source,
            placeName,
          });
        }
      } catch {
        if (reverseGeocodeSeqRef.current !== currentSeq) return;
        onLocationChange?.({
          coordinates: coords,
          source,
          placeName,
        });
      } finally {
        if (reverseGeocodeSeqRef.current === currentSeq) {
          setIsResolvingAddress(false);
        }
      }
    },
    [onAddressResolve, onLocationChange]
  );

  // Debounced reverse geocoding to prevent uncontrolled API calls on rapid clicks or drags
  const triggerReverseGeocode = useCallback(
    (coords: Coordinates, source: LocationChangeEvent['source'], placeName?: string, delayMs = 350) => {
      if (reverseGeocodeDebounceTimerRef.current) {
        clearTimeout(reverseGeocodeDebounceTimerRef.current);
      }

      if (delayMs === 0) {
        handleReverseGeocode(coords, source, placeName);
        return;
      }

      reverseGeocodeDebounceTimerRef.current = setTimeout(() => {
        handleReverseGeocode(coords, source, placeName);
      }, delayMs);
    },
    [handleReverseGeocode]
  );

  // Marker Creation / Update
  const createOrUpdateMarker = useCallback(
    (latLng: google.maps.LatLngLiteral) => {
      if (!mapInstanceRef.current) return;

      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(latLng);
        markerInstanceRef.current.setVisible(true);
        return markerInstanceRef.current;
      }

      // Create high-visibility campus marker
      const marker = new google.maps.Marker({
        position: latLng,
        map: mapInstanceRef.current,
        draggable: !readOnly && !disabled,
        title: 'School Campus Location',
        animation: google.maps.Animation.DROP,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 1.8,
          anchor: new google.maps.Point(12, 22),
        },
      });

      // Drag event - update coordinates in real-time without continuous geocoding
      marker.addListener('drag', () => {
        const pos = marker.getPosition();
        if (pos) {
          setActiveCoords({
            latitude: Number(pos.lat().toFixed(6)),
            longitude: Number(pos.lng().toFixed(6)),
          });
        }
      });

      // Dragend event - reverse geocode only upon final drop with slight debounce
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) {
          const finalCoords: Coordinates = {
            latitude: Number(pos.lat().toFixed(6)),
            longitude: Number(pos.lng().toFixed(6)),
          };
          setActiveCoords(finalCoords);
          triggerReverseGeocode(finalCoords, 'pin_drag', undefined, 250);
        }
      });

      markerInstanceRef.current = marker;
      return marker;
    },
    [disabled, readOnly, triggerReverseGeocode]
  );

  // Sync external coordinates changes to marker & map center
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (!validCoords) {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setVisible(false);
      }
      return;
    }

    const latLng = { lat: validCoords.latitude, lng: validCoords.longitude };

    if (!markerInstanceRef.current) {
      createOrUpdateMarker(latLng);
    } else {
      markerInstanceRef.current.setPosition(latLng);
      markerInstanceRef.current.setVisible(true);
    }

    // If map center is far from coordinates (e.g. manual input or URL paste), pan to them
    const currentCenter = mapInstanceRef.current.getCenter();
    if (
      !currentCenter ||
      Math.abs(currentCenter.lat() - validCoords.latitude) > 0.005 ||
      Math.abs(currentCenter.lng() - validCoords.longitude) > 0.005
    ) {
      mapInstanceRef.current.panTo(latLng);
    }
  }, [createOrUpdateMarker, validCoords]);

  // Initialize Map
  const initMap = useCallback(
    (libs: GoogleMapsLibraries) => {
      if (!mapContainerRef.current) return;

      try {
        const centerPos = validCoords
          ? { lat: validCoords.latitude, lng: validCoords.longitude }
          : { lat: initialCenter.latitude, lng: initialCenter.longitude };

        const map = new libs.maps.Map(mapContainerRef.current, {
          center: centerPos,
          zoom: validCoords ? PIN_ZOOM : zoom,
          mapTypeId: 'roadmap',
          disableDefaultUI: true, // we provide clean custom controls
          gestureHandling: 'cooperative',
          clickableIcons: false,
          tilt: 0,
        });

        mapInstanceRef.current = map;
        geocoderRef.current = new libs.geocoding.Geocoder();
        autocompleteServiceRef.current = new libs.places.AutocompleteService();
        placesServiceRef.current = new libs.places.PlacesService(map);

        // Map Click: place/move pin and reverse geocode (debounced to protect against rapid clicking)
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (readOnly || disabled) return;
          if (e.latLng) {
            const clickedCoords: Coordinates = {
              latitude: Number(e.latLng.lat().toFixed(6)),
              longitude: Number(e.latLng.lng().toFixed(6)),
            };
            createOrUpdateMarker({ lat: clickedCoords.latitude, lng: clickedCoords.longitude });
            map.panTo(e.latLng);
            setActiveCoords(clickedCoords);
            triggerReverseGeocode(clickedCoords, 'map_click', undefined, 350);
          }
        });

        // If coordinates already exist, drop marker
        if (validCoords) {
          createOrUpdateMarker({ lat: validCoords.latitude, lng: validCoords.longitude });
        } else if (addressContext) {
          // Priority C: If no coordinates exist, center map on address if available
          const addrQuery = buildAddressQuery(addressContext);
          if (addrQuery && addrQuery.length > 5) {
            geocoderRef.current.geocode(
              { address: addrQuery, componentRestrictions: { country: 'in' } },
              (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                  map.panTo(results[0].geometry.location);
                  map.setZoom(14);
                }
              }
            );
          }
        }

        setMapStatus('ready');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to initialize Google Maps canvas.';
        setMapStatus('unavailable');
        setErrorMessage(msg);
        onError?.({ type: 'unavailable', message: msg });
      }
    },
    [createOrUpdateMarker, disabled, initialCenter.latitude, initialCenter.longitude, onError, readOnly, triggerReverseGeocode, validCoords, zoom]
  );

  // Load Google Maps SDK
  const loadMapSdk = useCallback(async () => {
    setMapStatus('loading');
    setErrorMessage(null);

    const result = await loadGoogleMaps();
    if (result.status === 'ready' && result.libraries) {
      initMap(result.libraries);
    } else {
      setMapStatus(result.status);
      setErrorMessage(result.error || 'Interactive map is currently unavailable.');
      onError?.({ type: result.status, message: result.error || 'Map unavailable' });
    }
  }, [initMap, onError]);

  useEffect(() => {
    loadMapSdk();

    const unsubscribe = subscribeGoogleMapsAuthError((err) => {
      setMapStatus(err.type);
      setErrorMessage(err.message);
      onError?.(err);
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowPredictions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    };
    window.addEventListener('resize', handleWindowResize);

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
      if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);
      if (reverseGeocodeDebounceTimerRef.current) clearTimeout(reverseGeocodeDebounceTimerRef.current);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
    };
  }, [loadMapSdk, onError]);

  // Search input change & autocomplete debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    setSelectedPredictionIndex(-1);

    if (searchDebounceTimerRef.current) clearTimeout(searchDebounceTimerRef.current);

    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 3) {
      searchSequenceRef.current += 1;
      setSearchPredictions([]);
      setShowPredictions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const currentSeq = ++searchSequenceRef.current;

    searchDebounceTimerRef.current = setTimeout(async () => {
      if (autocompleteServiceRef.current) {
        const predictions = await fetchPlacePredictions(autocompleteServiceRef.current, trimmed);
        if (searchSequenceRef.current === currentSeq) {
          setSearchPredictions(predictions);
          setShowPredictions(predictions.length > 0);
        }
      }
      if (searchSequenceRef.current === currentSeq) {
        setIsSearching(false);
      }
    }, 280);
  };

  // Prediction selection
  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setShowPredictions(false);
    setSearchInput(prediction.description);

    if (!placesServiceRef.current || !mapInstanceRef.current) return;

    const currentSeq = ++predictionSeqRef.current;
    setIsSearching(true);
    try {
      const details = await fetchPlaceDetails(placesServiceRef.current, prediction.place_id);
      if (predictionSeqRef.current !== currentSeq) return;

      if (details) {
        const { coordinates: placeCoords } = details;
        mapInstanceRef.current.panTo({
          lat: placeCoords.latitude,
          lng: placeCoords.longitude,
        });
        mapInstanceRef.current.setZoom(PIN_ZOOM);

        createOrUpdateMarker({
          lat: placeCoords.latitude,
          lng: placeCoords.longitude,
        });

        setActiveCoords(placeCoords);

        onSearchSelect?.(details);
        if (details.address) {
          onAddressResolve?.(details.address);
        }

        onLocationChange?.({
          coordinates: placeCoords,
          source: 'search_selection',
          resolvedAddress: details.address,
          placeName: details.title,
        });

        showNotice({
          type: 'success',
          text: `Found and pinned: ${details.title}`,
        });
      }
    } catch {
      if (predictionSeqRef.current !== currentSeq) return;
      showNotice({
        type: 'error',
        text: 'Could not load details for this place. You can drop the pin on the map directly.',
      });
    } finally {
      if (predictionSeqRef.current === currentSeq) {
        setIsSearching(false);
      }
    }
  };

  // Keyboard navigation for search dropdown
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPredictions || searchPredictions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPredictionIndex((prev) =>
        prev < searchPredictions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPredictionIndex((prev) =>
        prev > 0 ? prev - 1 : searchPredictions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedPredictionIndex >= 0 && selectedPredictionIndex < searchPredictions.length) {
        handleSelectPrediction(searchPredictions[selectedPredictionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowPredictions(false);
    }
  };

  // "Locate Address" action: Geocodes current structured address to coordinates
  const handleLocateAddress = async () => {
    if (!geocoderRef.current) return;
    const query = buildAddressQuery(addressContext);

    if (!query || query.length < 3) {
      showNotice({
        type: 'info',
        text: 'Please enter city, district, or street address before locating on map.',
      });
      return;
    }

    const currentSeq = ++locateAddressSeqRef.current;
    setIsLocatingAddress(true);
    try {
      const result = await geocodeAddress(geocoderRef.current, query);
      if (locateAddressSeqRef.current !== currentSeq) return;

      if (result && result.coordinates) {
        const { coordinates: foundCoords } = result;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({
            lat: foundCoords.latitude,
            lng: foundCoords.longitude,
          });
          mapInstanceRef.current.setZoom(PIN_ZOOM);
        }

        createOrUpdateMarker({
          lat: foundCoords.latitude,
          lng: foundCoords.longitude,
        });

        setActiveCoords(foundCoords);

        if (result.addressComponents) {
          onAddressResolve?.(result.addressComponents);
        }

        onLocationChange?.({
          coordinates: foundCoords,
          source: 'manual_input',
          resolvedAddress: result.addressComponents,
          placeName: result.formattedAddress,
        });

        showNotice({
          type: 'success',
          text: `Located: ${result.formattedAddress}`,
        });
      } else {
        showNotice({
          type: 'error',
          text: 'Address could not be located on the map. You can click on the map directly.',
        });
      }
    } catch {
      if (locateAddressSeqRef.current !== currentSeq) return;
      showNotice({
        type: 'error',
        text: 'Geocoding request failed. Please check connection or pin manually.',
      });
    } finally {
      if (locateAddressSeqRef.current === currentSeq) {
        setIsLocatingAddress(false);
      }
    }
  };

  // GPS Current Device Location
  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showNotice({
        type: 'error',
        text: 'Geolocation is not supported in this browser.',
      });
      return;
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      showNotice(
        {
          type: 'error',
          text: 'GPS location requires a secure connection (HTTPS). You can search or click anywhere on the map.',
        },
        6000
      );
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const { latitude, longitude, accuracy } = position.coords;

        const gpsCoords: Coordinates = {
          latitude: Number(latitude.toFixed(6)),
          longitude: Number(longitude.toFixed(6)),
        };

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: gpsCoords.latitude, lng: gpsCoords.longitude });
          mapInstanceRef.current.setZoom(PIN_ZOOM);
        }

        createOrUpdateMarker({ lat: gpsCoords.latitude, lng: gpsCoords.longitude });
        setActiveCoords(gpsCoords);
        triggerReverseGeocode(gpsCoords, 'gps', undefined, 0);

        showNotice({
          type: 'success',
          text: `GPS location acquired (±${Math.round(accuracy)}m accuracy).`,
        });
      },
      (error) => {
        setIsLocatingGps(false);
        let msg = 'Unable to retrieve your current location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = 'Location permission was denied in your browser. You can search your school or click anywhere on the map.';
            break;
          case error.POSITION_UNAVAILABLE:
            msg = 'Current position information is unavailable from your device.';
            break;
          case error.TIMEOUT:
            msg = 'GPS location request timed out. Please try again or drop pin manually.';
            break;
        }
        showNotice({ type: 'error', text: msg }, 6000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Map Controls: Zoom in / Zoom out / Layer switch / Fullscreen
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || DEFAULT_ZOOM;
      mapInstanceRef.current.setZoom(z + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || DEFAULT_ZOOM;
      mapInstanceRef.current.setZoom(Math.max(1, z - 1));
    }
  };

  const handleToggleMapType = () => {
    if (mapInstanceRef.current) {
      const nextType = mapTypeId === 'roadmap' ? 'satellite' : 'roadmap';
      mapInstanceRef.current.setMapTypeId(nextType);
      setMapTypeId(nextType);
    }
  };

  const handleToggleFullscreen = () => {
    if (!mapWrapperRef.current) return;

    if (!isFullscreen) {
      if (mapWrapperRef.current.requestFullscreen) {
        mapWrapperRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        google.maps.event.trigger(mapInstanceRef.current, 'resize');
        if (activeCoords) {
          mapInstanceRef.current.panTo({
            lat: activeCoords.latitude,
            lng: activeCoords.longitude,
          });
        }
      }
    }, 150);
  };

  const handleRecenterPin = () => {
    if (mapInstanceRef.current && activeCoords) {
      mapInstanceRef.current.panTo({
        lat: activeCoords.latitude,
        lng: activeCoords.longitude,
      });
      mapInstanceRef.current.setZoom(PIN_ZOOM);
    }
  };

  // Google Maps External URL
  const googleMapsUrl = activeCoords
    ? `https://www.google.com/maps?q=${activeCoords.latitude},${activeCoords.longitude}`
    : null;

  // Fallback UI Render for missing key, quota exceeded, or auth error
  if (
    mapStatus === 'missing_key' ||
    mapStatus === 'quota_exceeded' ||
    mapStatus === 'auth_error' ||
    mapStatus === 'network_error' ||
    mapStatus === 'unavailable'
  ) {
    return (
      <div
        className={`relative w-full ${heightClassName} rounded-2xl overflow-hidden border border-[#E2E8F0] bg-gradient-to-b from-[#FAF7F2] to-[#F1F5F9] shadow-2xs flex flex-col items-center justify-center p-6 text-center transition-all`}
      >
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs flex items-center justify-center text-[#4338CA] mb-3">
          {activeCoords ? (
            <MapPin className="w-6 h-6 text-[#EA4335]" />
          ) : (
            <AlertCircle className="w-6 h-6 text-[#4338CA]" />
          )}
        </div>

        <div className="relative z-10 max-w-md space-y-1.5">
          <h4 className="font-bold text-xs sm:text-sm text-[#131B2E]">
            Interactive map temporarily unavailable
          </h4>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
            School onboarding does not depend on the map. You can proceed using any of these easy alternatives:
          </p>
          <div className="text-[10.5px] text-[#475569] font-medium flex flex-col items-center gap-0.5 pt-0.5">
            <span>1. Enter campus address in the form fields</span>
            <span>2. Paste a Google Maps share link below</span>
            <span>3. Enter GPS coordinates manually</span>
          </div>
        </div>

        <div className="relative z-10 mt-4 flex items-center flex-wrap justify-center gap-2">
          {activeCoords && (
            <div className="inline-flex items-center space-x-1.5 bg-white border border-[#E2E8F0] px-3 py-1 rounded-xl shadow-2xs text-[11px] font-mono text-[#4338CA] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
              <span>
                Pinned: {activeCoords.latitude.toFixed(6)}, {activeCoords.longitude.toFixed(6)}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => loadMapSdk()}
            className="inline-flex items-center space-x-1.5 bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] px-3 py-1.5 rounded-xl shadow-2xs text-[11px] font-semibold transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#64748B]" />
            <span>Retry Map</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onFocusShareUrl) {
                onFocusShareUrl();
              } else {
                const el = document.getElementById('google-maps-share-url-input');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.focus();
                }
              }
            }}
            className="inline-flex items-center space-x-1 bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] px-3 py-1.5 rounded-xl shadow-2xs text-[11px] font-semibold transition cursor-pointer"
          >
            <MapPin className="w-3 h-3 text-[#4338CA]" />
            <span>Use Google Maps Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onFocusCoordinates) {
                onFocusCoordinates();
              } else {
                const el = document.getElementById('campus-latitude-input');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.focus();
                }
              }
            }}
            className="inline-flex items-center space-x-1 bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] px-3 py-1.5 rounded-xl shadow-2xs text-[11px] font-semibold transition cursor-pointer"
          >
            <span>Enter Coordinates</span>
          </button>

          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] text-[#4338CA] px-3 py-1.5 rounded-xl shadow-2xs text-[11px] font-semibold transition"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapWrapperRef}
      className={`relative w-full ${heightClassName} rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F8FAFC] shadow-2xs group focus-within:ring-2 focus-within:ring-[#4338CA]/20 transition-all`}
    >
      {/* Loading Skeleton Indicator */}
      {mapStatus === 'loading' && (
        <div className="absolute inset-0 z-30 bg-[#FAF7F2]/90 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <Loader2 className="w-8 h-8 text-[#4338CA] animate-spin mb-2" />
          <span className="text-xs font-semibold text-[#131B2E]">Loading Google Maps...</span>
          <span className="text-[11px] text-[#64748B] mt-0.5">Connecting satellite and places service</span>
        </div>
      )}

      {/* Floating Search Bar */}
      <div
        ref={searchContainerRef}
        className="absolute top-3 left-3 right-14 sm:right-auto sm:max-w-sm md:max-w-md z-20"
      >
        <div className="relative">
          <div className="flex items-center bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E8F0] shadow-md px-3 py-1.5 focus-within:border-[#4338CA] focus-within:ring-2 focus-within:ring-[#4338CA]/20 transition">
            <Search className="w-4 h-4 text-[#64748B] shrink-0 mr-2" />
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchInputChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchPredictions.length > 0) setShowPredictions(true);
              }}
              placeholder="Search school, address, landmark or place..."
              className="w-full text-xs text-[#131B2E] placeholder:text-[#94A3B8] bg-transparent outline-hidden font-medium"
              aria-label="Search campus location"
            />
            {isSearching && (
              <Loader2 className="w-3.5 h-3.5 text-[#4338CA] animate-spin shrink-0 ml-1" />
            )}
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearchPredictions([]);
                  setShowPredictions(false);
                }}
                className="p-1 hover:bg-[#F1F5F9] rounded-md text-[#94A3B8] hover:text-[#334155] transition ml-1 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {showPredictions && searchPredictions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#E2E8F0] shadow-xl overflow-hidden max-h-60 overflow-y-auto z-40 text-xs">
              {searchPredictions.map((pred, idx) => (
                <button
                  key={pred.place_id}
                  type="button"
                  onClick={() => handleSelectPrediction(pred)}
                  onMouseEnter={() => setSelectedPredictionIndex(idx)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-start space-x-2.5 border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#EEF2FF] transition ${
                    idx === selectedPredictionIndex ? 'bg-[#EEF2FF]' : ''
                  }`}
                >
                  <MapPin className="w-4 h-4 text-[#EA4335] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#131B2E] truncate">
                      {pred.structured_formatting?.main_text || pred.description}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">
                      {pred.structured_formatting?.secondary_text || ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Interactive Viewport */}
      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-crosshair"
        tabIndex={0}
        aria-label="Google Map campus selector. Click to place marker, or drag marker to fine-tune."
      />

      {/* Floating Map Controls (Right Side) */}
      <div className="absolute right-3 top-3 flex flex-col space-y-1.5 z-20">
        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer"
          title={isFullscreen ? 'Exit fullscreen' : 'Expand map fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand map fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Map / Satellite Toggle */}
        <button
          type="button"
          onClick={handleToggleMapType}
          className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer text-[10px] font-bold"
          title={`Switch to ${mapTypeId === 'roadmap' ? 'Satellite' : 'Map'} view`}
          aria-label={`Switch to ${mapTypeId === 'roadmap' ? 'Satellite' : 'Map'} view`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Locate Address Button */}
        <button
          type="button"
          onClick={handleLocateAddress}
          disabled={isLocatingAddress}
          className={`w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer ${
            isLocatingAddress ? 'text-[#4338CA] animate-pulse' : ''
          }`}
          title="Locate address from form fields on map"
          aria-label="Locate address from form fields on map"
        >
          {isLocatingAddress ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#4338CA]" />
          ) : (
            <Target className="w-4 h-4 text-[#4338CA]" />
          )}
        </button>

        {/* GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocatingGps}
          className={`w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer ${
            isLocatingGps ? 'text-[#4338CA] animate-pulse' : ''
          }`}
          title="Use current GPS location"
          aria-label="Use current GPS location"
        >
          {isLocatingGps ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#4338CA]" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </button>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#E2E8F0] shadow-sm flex flex-col overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center border-b border-[#F1F5F9] transition cursor-pointer"
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer"
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Recenter to Pin */}
        {activeCoords && (
          <button
            type="button"
            onClick={handleRecenterPin}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-sm hover:bg-[#FAF7F2] text-[#334155] flex items-center justify-center transition cursor-pointer"
            title="Center map on pin"
            aria-label="Center map on pin"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Status Notification */}
      {feedbackNotice && (
        <div
          className={`absolute top-16 left-3 right-3 sm:right-auto sm:max-w-md z-30 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between shadow-lg backdrop-blur-md transition-all duration-200 ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-600/90 text-white'
              : feedbackNotice.type === 'error'
              ? 'bg-rose-600/90 text-white'
              : 'bg-indigo-600/90 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="font-medium text-[11px] leading-tight">{feedbackNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-xs opacity-75 hover:opacity-100 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Coordinate Bar & Pin Guidance */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none z-20">
        {activeCoords ? (
          <div className="pointer-events-auto inline-flex items-center space-x-2 bg-white/95 backdrop-blur-md border border-[#E2E8F0] px-3 py-1 rounded-xl shadow-md text-[11px] font-mono font-semibold text-[#131B2E]">
            <span className="w-2 h-2 rounded-full bg-[#EA4335] animate-pulse" />
            <span>
              {activeCoords.latitude.toFixed(6)}, {activeCoords.longitude.toFixed(6)}
            </span>
            {isResolvingAddress && (
              <span className="inline-flex items-center space-x-1 text-[#4338CA] font-sans font-normal text-[10px] pl-1 border-l border-[#E2E8F0]">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Resolving...</span>
              </span>
            )}
          </div>
        ) : (
          <div className="pointer-events-auto inline-flex items-center space-x-1.5 bg-white/90 backdrop-blur-md border border-[#E2E8F0] px-3 py-1 rounded-xl shadow-md text-[11px] text-[#64748B]">
            <MapPin className="w-3 h-3 text-[#EA4335]" />
            <span>Click map or drag pin to position campus</span>
          </div>
        )}

        {/* Small attribution / view in Google Maps */}
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto hidden sm:inline-flex items-center space-x-1 bg-white/90 backdrop-blur-md hover:bg-white border border-[#E2E8F0] text-[#334155] px-2 py-1 rounded-xl shadow-md text-[10px] font-semibold transition"
            title="Open in Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
