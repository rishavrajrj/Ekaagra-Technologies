'use client';

import type { Coordinates, LocationAddress, ReverseGeocodeResult, LocationSearchResult } from './mapTypes';
import { validateCoordinates } from './coordinateValidator';
import {
  findCanonicalCountry,
  findCanonicalState,
  findCanonicalDistrict,
  OTHER_OPTION,
} from '@/lib/geography';

export interface GoogleAddressComponentLike {
  long_name: string;
  short_name?: string;
  types: string[];
}

/**
 * Parses Google Maps GeocoderAddressComponent array into our structured LocationAddress
 * adhering strictly to Google's address_components types:
 * - country: type "country"
 * - state: type "administrative_area_level_1"
 * - district: first choice = "administrative_area_level_2", fallback = "administrative_area_level_3"
 * - city: first choice = "locality", fallback = "sublocality_level_1", fallback = "sublocality"
 * - postal PIN: type "postal_code"
 * - campus postal address: Google's formatted_address where appropriate
 */
export function parseGoogleAddressComponents(
  components: GoogleAddressComponentLike[] | google.maps.GeocoderAddressComponent[],
  formattedAddress?: string
): LocationAddress {
  const result: LocationAddress = {
    formattedAddress: formattedAddress || '',
  };

  let streetNumber = '';
  let route = '';
  let sublocality2 = '';
  let sublocality1 = '';
  let sublocality = '';
  let locality = '';
  let adminArea3 = '';
  let adminArea2 = '';
  let adminArea1 = '';
  let country = '';
  let postalCode = '';
  let landmark = '';

  for (const comp of components) {
    const types = comp.types || [];

    if (types.includes('country')) {
      country = comp.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      adminArea1 = comp.long_name;
    } else if (types.includes('administrative_area_level_2')) {
      adminArea2 = comp.long_name;
    } else if (types.includes('administrative_area_level_3')) {
      adminArea3 = comp.long_name;
    } else if (types.includes('locality')) {
      locality = comp.long_name;
    } else if (types.includes('sublocality_level_1')) {
      sublocality1 = comp.long_name;
    } else if (types.includes('sublocality')) {
      sublocality = comp.long_name;
    } else if (types.includes('sublocality_level_2')) {
      sublocality2 = comp.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = comp.long_name;
    } else if (types.includes('street_number')) {
      streetNumber = comp.long_name;
    } else if (types.includes('route')) {
      route = comp.long_name;
    } else if (
      types.includes('point_of_interest') ||
      types.includes('establishment') ||
      types.includes('premise')
    ) {
      if (!landmark) landmark = comp.long_name;
    }
  }

  // 1. District: first choice = administrative_area_level_2, fallback = administrative_area_level_3
  // Never put city/locality into district
  const rawDistrict = adminArea2 || adminArea3 || '';
  let district = rawDistrict.replace(/\s+district$/i, '').trim();
  const lowerDistrict = district.toLowerCase();
  if (
    lowerDistrict.includes('purbi champaran') ||
    lowerDistrict.includes('purba champaran') ||
    lowerDistrict.includes('east champaran')
  ) {
    district = 'East Champaran';
  } else if (
    lowerDistrict.includes('pashchim champaran') ||
    lowerDistrict.includes('paschim champaran') ||
    lowerDistrict.includes('west champaran')
  ) {
    district = 'West Champaran';
  }

  // 2. City: first choice = locality, fallback = sublocality_level_1, fallback = sublocality
  // Never put district or adminArea into city
  const city = locality || sublocality1 || sublocality || '';

  // 3. Street / Postal Address construction
  const streetParts = [streetNumber, route, sublocality2, sublocality1].filter(Boolean);
  const streetLine = streetParts.join(', ');
  const campusPostalAddress = formattedAddress || streetLine || '';

  const detectedCountry = country || 'India';
  result.formattedAddress = campusPostalAddress;
  result.address = campusPostalAddress;
  result.addressLine1 = campusPostalAddress;
  result.city = city;
  result.district = district;
  result.state = adminArea1;
  result.country = detectedCountry;
  result.countryName = detectedCountry.toLowerCase() !== 'india' ? detectedCountry : undefined;
  result.pin = postalCode;
  result.pinCode = postalCode;
  result.postalCode = postalCode;
  result.landmark = landmark;

  return result;
}

/**
 * Maps a detected location address from Google Maps to campus branch state.
 * If detected country is non-India:
 * - Sets Country to "Other Country"
 * - Sets Country Name to the detected country name
 * - Sets State / Province from detected address
 * - Sets District from detected address
 * - Sets City / Town from detected address
 * - Sets Postal PIN from detected address
 */
export function applyDetectedLocationToCampus(
  currentCampus: {
    country?: string;
    countryName?: string;
    otherCountry?: string;
    state?: string;
    otherStateProvince?: string;
    otherState?: string;
    district?: string;
    otherDistrict?: string;
    city?: string;
    pin?: string;
    address?: string;
    landmark?: string;
  },
  detectedAddress: LocationAddress
): {
  country: string;
  countryName: string;
  otherCountry: string;
  state: string;
  otherStateProvince: string;
  district: string;
  otherDistrict: string;
  city: string;
  pin: string;
  address?: string;
  landmark?: string;
} {
  // 1. Country resolution
  const rawCountry = (detectedAddress.country || currentCampus.country || 'India').trim();
  const canonicalCountry = findCanonicalCountry(rawCountry);

  let country = OTHER_OPTION;
  let otherCountry = '';

  if (canonicalCountry) {
    country = canonicalCountry;
    otherCountry = '';
  } else {
    country = OTHER_OPTION;
    otherCountry = rawCountry;
  }

  const effectiveCountry = country === OTHER_OPTION ? otherCountry : country;

  // 2. State resolution
  const rawState = (detectedAddress.state || '').trim();
  let state = '';
  let otherStateProvince = '';

  if (rawState) {
    const canonicalState = findCanonicalState(effectiveCountry, rawState);
    if (canonicalState) {
      state = canonicalState;
      otherStateProvince = '';
    } else {
      state = OTHER_OPTION;
      otherStateProvince = rawState;
    }
  } else {
    const existingState = (currentCampus.state || '').trim();
    const existingOtherState = (currentCampus.otherStateProvince || currentCampus.otherState || '').trim();
    if (existingState === OTHER_OPTION) {
      state = OTHER_OPTION;
      otherStateProvince = existingOtherState;
    } else if (existingState) {
      const canonicalState = findCanonicalState(effectiveCountry, existingState);
      if (canonicalState) {
        state = canonicalState;
        otherStateProvince = '';
      } else {
        state = OTHER_OPTION;
        otherStateProvince = existingState;
      }
    } else if (effectiveCountry.toLowerCase() === 'india') {
      state = 'Bihar';
      otherStateProvince = '';
    }
  }

  const effectiveState = state === OTHER_OPTION ? otherStateProvince : state;

  // 3. District resolution
  const rawDistrict = (detectedAddress.district || '').trim();
  let district = '';
  let otherDistrict = '';

  if (rawDistrict) {
    const canonicalDistrict = findCanonicalDistrict(effectiveCountry, effectiveState, rawDistrict);
    if (canonicalDistrict) {
      district = canonicalDistrict;
      otherDistrict = '';
    } else {
      district = OTHER_OPTION;
      otherDistrict = rawDistrict;
    }
  } else {
    const existingDistrict = (currentCampus.district || '').trim();
    const existingOtherDistrict = (currentCampus.otherDistrict || '').trim();
    if (existingDistrict === OTHER_OPTION || existingDistrict === '__custom__') {
      district = OTHER_OPTION;
      otherDistrict = existingOtherDistrict;
    } else if (existingDistrict) {
      const canonicalDistrict = findCanonicalDistrict(effectiveCountry, effectiveState, existingDistrict);
      if (canonicalDistrict) {
        district = canonicalDistrict;
        otherDistrict = '';
      } else {
        district = OTHER_OPTION;
        otherDistrict = existingDistrict;
      }
    } else if (effectiveCountry.toLowerCase() === 'india' && effectiveState.toLowerCase() === 'bihar') {
      district = 'East Champaran';
      otherDistrict = '';
    }
  }

  return {
    country,
    countryName: otherCountry,
    otherCountry,
    state,
    otherStateProvince,
    district,
    otherDistrict,
    city: detectedAddress.city || currentCampus.city || '',
    pin: detectedAddress.postalCode || detectedAddress.pin || currentCampus.pin || '',
    address: detectedAddress.formattedAddress || detectedAddress.address || currentCampus.address,
    landmark: detectedAddress.landmark || currentCampus.landmark,
  };
}

// Bounded in-memory caches to prevent duplicate Google API billing requests
const reverseGeocodeCache = new Map<string, ReverseGeocodeResult>();
const autocompleteCache = new Map<string, google.maps.places.AutocompletePrediction[]>();
const placeDetailsCache = new Map<string, LocationSearchResult>();
const geocodeAddressCache = new Map<string, ReverseGeocodeResult>();

// In-flight request deduplication maps to prevent simultaneous duplicate API requests
const inFlightReverseGeocode = new Map<string, Promise<ReverseGeocodeResult | null>>();
const inFlightPlacePredictions = new Map<string, Promise<google.maps.places.AutocompletePrediction[]>>();
const inFlightPlaceDetails = new Map<string, Promise<LocationSearchResult | null>>();
const inFlightGeocodeAddress = new Map<string, Promise<ReverseGeocodeResult | null>>();

function setBoundedCache<K, V>(cache: Map<K, V>, key: K, value: V, maxSize = 60) {
  if (cache.size >= maxSize) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, value);
}

/**
 * Reverse geocodes coordinates to a structured address
 */
export async function reverseGeocode(
  geocoder: google.maps.Geocoder,
  coords: Coordinates
): Promise<ReverseGeocodeResult | null> {
  const validation = validateCoordinates(coords.latitude, coords.longitude);
  if (!validation.isValid || !validation.coordinates) {
    return null;
  }

  // Cost control: Check cache using 5-decimal precision (~1.1 meter accuracy)
  const cacheKey = `${validation.coordinates.latitude.toFixed(5)},${validation.coordinates.longitude.toFixed(5)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  // Cost control: Deduplicate in-flight simultaneous requests
  if (inFlightReverseGeocode.has(cacheKey)) {
    return inFlightReverseGeocode.get(cacheKey)!;
  }

  const promise = new Promise<ReverseGeocodeResult | null>((resolve) => {
    geocoder.geocode(
      {
        location: {
          lat: validation.coordinates!.latitude,
          lng: validation.coordinates!.longitude,
        },
      },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const bestResult = results[0];
          const parsed = parseGoogleAddressComponents(
            bestResult.address_components,
            bestResult.formatted_address
          );
          const geocodeResult: ReverseGeocodeResult = {
            coordinates: validation.coordinates!,
            formattedAddress: bestResult.formatted_address,
            addressComponents: parsed,
          };
          setBoundedCache(reverseGeocodeCache, cacheKey, geocodeResult);
          resolve(geocodeResult);
        } else {
          resolve(null);
        }
      }
    );
  }).finally(() => {
    inFlightReverseGeocode.delete(cacheKey);
  });

  inFlightReverseGeocode.set(cacheKey, promise);
  return promise;
}

/**
 * Fetches place autocomplete predictions for the search bar
 */
export async function fetchPlacePredictions(
  autocompleteService: google.maps.places.AutocompleteService,
  input: string
): Promise<google.maps.places.AutocompletePrediction[]> {
  const query = (input || '').trim().toLowerCase();
  // Cost control: Ignore queries under 3 characters
  if (query.length < 3) return [];

  // Cost control: Check autocomplete cache
  if (autocompleteCache.has(query)) {
    return autocompleteCache.get(query)!;
  }

  // Cost control: Deduplicate in-flight simultaneous requests
  if (inFlightPlacePredictions.has(query)) {
    return inFlightPlacePredictions.get(query)!;
  }

  const promise = new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
    autocompleteService.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: ['in'] },
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions &&
          predictions.length > 0
        ) {
          setBoundedCache(autocompleteCache, query, predictions);
          resolve(predictions);
        } else {
          // If no results restricted to India, try unrestricted
          autocompleteService.getPlacePredictions(
            { input: query },
            (allPredictions, allStatus) => {
              if (
                allStatus === google.maps.places.PlacesServiceStatus.OK &&
                allPredictions
              ) {
                setBoundedCache(autocompleteCache, query, allPredictions);
                resolve(allPredictions);
              } else {
                resolve([]);
              }
            }
          );
        }
      }
    );
  }).finally(() => {
    inFlightPlacePredictions.delete(query);
  });

  inFlightPlacePredictions.set(query, promise);
  return promise;
}

/**
 * Resolves full place details from a placeId
 */
export async function fetchPlaceDetails(
  placesService: google.maps.places.PlacesService,
  placeId: string
): Promise<LocationSearchResult | null> {
  // Cost control: Check place details cache
  if (placeDetailsCache.has(placeId)) {
    return placeDetailsCache.get(placeId)!;
  }

  // Cost control: Deduplicate in-flight simultaneous requests
  if (inFlightPlaceDetails.has(placeId)) {
    return inFlightPlaceDetails.get(placeId)!;
  }

  const promise = new Promise<LocationSearchResult | null>((resolve) => {
    placesService.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'geometry', 'address_components', 'place_id'],
      },
      (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const parsedAddress = place.address_components
            ? parseGoogleAddressComponents(place.address_components, place.formatted_address)
            : undefined;

          const searchResult: LocationSearchResult = {
            id: placeId,
            title: place.name || place.formatted_address || 'Selected Place',
            subtitle: place.formatted_address,
            coordinates: {
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            },
            address: parsedAddress,
            placeId,
          };
          setBoundedCache(placeDetailsCache, placeId, searchResult);
          resolve(searchResult);
        } else {
          resolve(null);
        }
      }
    );
  }).finally(() => {
    inFlightPlaceDetails.delete(placeId);
  });

  inFlightPlaceDetails.set(placeId, promise);
  return promise;
}

/**
 * Builds a search query string from structured addressContext
 */
export function buildAddressQuery(addressContext?: LocationAddress): string {
  if (!addressContext) return '';

  const parts = [
    addressContext.address || addressContext.addressLine1,
    addressContext.landmark,
    addressContext.city,
    addressContext.district,
    addressContext.state,
    addressContext.pin || addressContext.pinCode,
    addressContext.country || 'India',
  ]
    .map((p) => (p || '').trim())
    .filter((p) => Boolean(p) && p !== 'Other / Unlisted District...');

  return parts.join(', ');
}

/**
 * Geocodes an address string to coordinates and structured components
 */
export async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  addressString: string
): Promise<ReverseGeocodeResult | null> {
  const query = (addressString || '').trim().toLowerCase();
  if (!query || query.length < 3) return null;

  // Cost control: Check address geocoding cache
  if (geocodeAddressCache.has(query)) {
    return geocodeAddressCache.get(query)!;
  }

  // Cost control: Deduplicate in-flight simultaneous requests
  if (inFlightGeocodeAddress.has(query)) {
    return inFlightGeocodeAddress.get(query)!;
  }

  const promise = new Promise<ReverseGeocodeResult | null>((resolve) => {
    geocoder.geocode(
      {
        address: query,
        componentRestrictions: { country: 'in' },
      },
      (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const best = results[0];
          const lat = best.geometry.location.lat();
          const lng = best.geometry.location.lng();
          const parsed = parseGoogleAddressComponents(best.address_components, best.formatted_address);

          const geocodeRes: ReverseGeocodeResult = {
            coordinates: {
              latitude: Number(lat.toFixed(6)),
              longitude: Number(lng.toFixed(6)),
            },
            formattedAddress: best.formatted_address,
            addressComponents: parsed,
          };
          setBoundedCache(geocodeAddressCache, query, geocodeRes);
          resolve(geocodeRes);
        } else {
          // Fallback without country restriction
          geocoder.geocode({ address: query }, (fallbackResults, fallbackStatus) => {
            if (fallbackStatus === google.maps.GeocoderStatus.OK && fallbackResults && fallbackResults.length > 0) {
              const best = fallbackResults[0];
              const lat = best.geometry.location.lat();
              const lng = best.geometry.location.lng();
              const parsed = parseGoogleAddressComponents(best.address_components, best.formatted_address);

              const geocodeRes: ReverseGeocodeResult = {
                coordinates: {
                  latitude: Number(lat.toFixed(6)),
                  longitude: Number(lng.toFixed(6)),
                },
                formattedAddress: best.formatted_address,
                addressComponents: parsed,
              };
              setBoundedCache(geocodeAddressCache, query, geocodeRes);
              resolve(geocodeRes);
            } else {
              resolve(null);
            }
          });
        }
      }
    );
  }).finally(() => {
    inFlightGeocodeAddress.delete(query);
  });

  inFlightGeocodeAddress.set(query, promise);
  return promise;
}

