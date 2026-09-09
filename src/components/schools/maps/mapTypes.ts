/**
 * Provider-Neutral Map & Geolocation Abstraction Types
 * Prepares the codebase for Google Maps integration while decoupling
 * the onboarding forms from any specific map vendor.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationAddress {
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  countryName?: string;
  pin?: string;
  pinCode?: string;
  postalCode?: string;
  landmark?: string;
  formattedAddress?: string;
}

export type LocationChangeSource =
  | 'pin_drag'
  | 'map_click'
  | 'search_selection'
  | 'gps'
  | 'share_url'
  | 'manual_input'
  | 'initial';

export interface LocationChangeEvent {
  coordinates: Coordinates | null;
  source: LocationChangeSource;
  resolvedAddress?: LocationAddress;
  placeName?: string;
}

export interface LocationSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  coordinates: Coordinates;
  address?: LocationAddress;
  placeId?: string;
}

export interface ReverseGeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  addressComponents: LocationAddress;
}

export interface DeviceLocationResult {
  coordinates: Coordinates;
  accuracyMeters: number;
  timestamp: number;
}

export interface ShareUrlResolutionResult {
  originalUrl: string;
  expandedUrl?: string;
  coordinates?: Coordinates | null;
  placeName?: string | null;
  error?: string;
}

export type MapProviderType = 'google_maps' | 'placeholder';

export type MapStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'missing_key'
  | 'quota_exceeded'
  | 'auth_error'
  | 'network_error'
  | 'unavailable';

export interface MapErrorState {
  type: MapStatus;
  message: string;
}

export interface SchoolLocationMapProps {
  coordinates?: Coordinates | null;
  initialCenter?: Coordinates;
  zoom?: number;
  addressContext?: LocationAddress;
  searchQuery?: string;
  readOnly?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  heightClassName?: string;
  onLocationChange?: (event: LocationChangeEvent) => void;
  onAddressResolve?: (address: LocationAddress) => void;
  onSearchSelect?: (result: LocationSearchResult) => void;
  onError?: (error: MapErrorState) => void;
  onFocusShareUrl?: () => void;
  onFocusCoordinates?: () => void;
}

