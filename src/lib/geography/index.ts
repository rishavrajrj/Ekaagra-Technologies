// Centralized Geographic Layer for School Onboarding & Institutional Addresses

export {
  CANONICAL_COUNTRIES,
  OTHER_OPTION,
  getStandardCountries,
  getCountriesWithOther,
  isKnownCountry,
  findCanonicalCountry,
  type CountryItem,
} from './countries';

export {
  INDIAN_STATES,
  getStandardStatesForCountry,
  getStatesForCountryWithOther,
  isKnownState,
  findCanonicalState,
} from './subdivisions';

export {
  DISTRICTS_BY_STATE,
  getStandardDistrictsForState,
  getDistrictsForStateWithOther,
  isKnownDistrict,
  findCanonicalDistrict,
} from './districts';

import {
  getCountriesWithOther,
  findCanonicalCountry,
  OTHER_OPTION,
} from './countries';

import {
  getStatesForCountryWithOther,
  findCanonicalState,
} from './subdivisions';

import {
  getDistrictsForStateWithOther,
  findCanonicalDistrict,
} from './districts';

/**
 * Standard country options with "Other" as final choice
 */
export function getCountries(): string[] {
  return getCountriesWithOther();
}

/**
 * Standard state options for country with "Other" as final choice
 */
export function getStatesForCountry(country: string = 'India'): string[] {
  return getStatesForCountryWithOther(country);
}

/**
 * Standard district options for state with "Other" as final choice
 */
export function getDistrictsForState(country: string = 'India', state: string = 'Bihar'): string[] {
  return getDistrictsForStateWithOther(country, state);
}

/**
 * Resolves the effective human-readable address value.
 * Behavior:
 * - Standard value -> returns standard value.
 * - Other + valid custom value -> returns trimmed custom value.
 * - Other + empty/whitespace/literal Other custom value -> returns empty string (incomplete/null).
 * - Never returns literal "Other" as an effective persisted geographic value.
 */
export function resolveAddressValue(selectedValue?: string | null, customValue?: string | null): string {
  const normSelected = (selectedValue || '').trim();
  const normCustom = (customValue || '').trim();

  const lowerSelected = normSelected.toLowerCase();
  if (lowerSelected === 'other' || lowerSelected === 'other country' || lowerSelected === '__custom__') {
    if (!normCustom || normCustom.toLowerCase() === 'other') {
      return '';
    }
    return normCustom;
  }

  if (normSelected) {
    return normSelected;
  }

  if (normCustom && normCustom.toLowerCase() !== 'other') {
    return normCustom;
  }

  return '';
}

export interface AddressEntityLike {
  country?: string;
  otherCountry?: string;
  countryName?: string;
  state?: string;
  otherState?: string;
  otherStateProvince?: string;
  district?: string;
  otherDistrict?: string;
  city?: string;
  otherCity?: string;
  pin?: string;
  address?: string;
  addressLine2?: string;
  landmark?: string;
}

export interface NormalizedAddressEntity {
  country: string;
  otherCountry: string;
  countryName: string;
  state: string;
  otherStateProvince: string;
  district: string;
  otherDistrict: string;
  effectiveCountry: string;
  effectiveState: string;
  effectiveDistrict: string;
}

/**
 * Normalizes legacy or external (e.g. Google Maps) address data into
 * the standardized "Standard List + Other" format safely.
 *
 * Rules:
 * 1. If value is a recognized standard option, use standard and clear custom.
 * 2. If value is "Other" or "Other Country" or "__custom__", preserve/assign custom value.
 * 3. If value is an unknown/custom string (e.g. from legacy data), automatically represent as:
 *    Dropdown = "Other"
 *    Custom Input = that value.
 * 4. Never discard user data.
 */
export function normalizeAddressEntity(entity: AddressEntityLike): NormalizedAddressEntity {
  // 1. Country resolution
  const rawCountry = entity.country?.trim() || '';
  const rawOtherCountry = (entity.otherCountry || entity.countryName || '').trim();

  let country = 'India';
  let otherCountry = '';

  if (rawCountry === 'Other' || rawCountry === 'Other Country') {
    country = 'Other';
    otherCountry = rawOtherCountry;
  } else if (rawCountry) {
    const canonicalMatch = findCanonicalCountry(rawCountry);
    if (canonicalMatch) {
      country = canonicalMatch;
      otherCountry = '';
    } else {
      // Legacy custom country value not in canonical list
      country = 'Other';
      otherCountry = rawCountry;
    }
  } else if (rawOtherCountry) {
    const canonicalMatch = findCanonicalCountry(rawOtherCountry);
    if (canonicalMatch) {
      country = canonicalMatch;
      otherCountry = '';
    } else {
      country = 'Other';
      otherCountry = rawOtherCountry;
    }
  }

  const effectiveCountry = resolveAddressValue(country, otherCountry);
  const countryForLookup = effectiveCountry || 'India';

  // 2. State / Province resolution
  const rawState = entity.state?.trim() || '';
  const rawOtherState = (entity.otherStateProvince || entity.otherState || '').trim();

  let state = '';
  let otherStateProvince = '';

  if (rawState === 'Other') {
    state = 'Other';
    otherStateProvince = rawOtherState;
  } else if (rawState) {
    const canonicalState = findCanonicalState(countryForLookup, rawState);
    if (canonicalState) {
      state = canonicalState;
      otherStateProvince = '';
    } else {
      // Legacy custom state or state not in current country's standard list
      state = 'Other';
      otherStateProvince = rawState;
    }
  } else if (rawOtherState) {
    const canonicalState = findCanonicalState(countryForLookup, rawOtherState);
    if (canonicalState) {
      state = canonicalState;
      otherStateProvince = '';
    } else {
      state = 'Other';
      otherStateProvince = rawOtherState;
    }
  } else if (countryForLookup.toLowerCase() === 'india') {
    state = 'Bihar';
    otherStateProvince = '';
  }

  const effectiveState = resolveAddressValue(state, otherStateProvince);
  const stateForLookup = effectiveState || (countryForLookup.toLowerCase() === 'india' ? 'Bihar' : '');

  // 3. District resolution
  const rawDistrict = entity.district?.trim() || '';
  const rawOtherDistrict = (entity.otherDistrict || '').trim();

  let district = '';
  let otherDistrict = '';

  if (rawDistrict === 'Other' || rawDistrict === '__custom__') {
    district = 'Other';
    otherDistrict = rawOtherDistrict;
  } else if (rawDistrict) {
    const canonicalDistrict = findCanonicalDistrict(countryForLookup, stateForLookup, rawDistrict);
    if (canonicalDistrict) {
      district = canonicalDistrict;
      otherDistrict = '';
    } else {
      district = 'Other';
      otherDistrict = rawDistrict;
    }
  } else if (rawOtherDistrict) {
    const canonicalDistrict = findCanonicalDistrict(countryForLookup, stateForLookup, rawOtherDistrict);
    if (canonicalDistrict) {
      district = canonicalDistrict;
      otherDistrict = '';
    } else {
      district = 'Other';
      otherDistrict = rawOtherDistrict;
    }
  } else if (countryForLookup.toLowerCase() === 'india' && stateForLookup.toLowerCase() === 'bihar') {
    district = 'East Champaran';
    otherDistrict = '';
  }

  const effectiveDistrict = resolveAddressValue(district, otherDistrict);

  return {
    country,
    otherCountry,
    countryName: otherCountry,
    state,
    otherStateProvince,
    district,
    otherDistrict,
    effectiveCountry,
    effectiveState,
    effectiveDistrict,
  };
}

/**
 * Returns effective human-readable address object from a campus or school profile
 */
export function getEffectiveAddress(entity: AddressEntityLike) {
  const norm = normalizeAddressEntity(entity);
  return {
    country: norm.effectiveCountry,
    state: norm.effectiveState,
    district: norm.effectiveDistrict,
    city: (entity.city || '').trim(),
    pin: (entity.pin || '').trim(),
    address: (entity.address || '').trim(),
    addressLine2: (entity.addressLine2 || '').trim(),
    landmark: (entity.landmark || '').trim(),
  };
}

/**
 * Validates a single address dropdown selection and its corresponding custom input.
 * For a required field:
 * - valid if a standard option is selected (and not 'Other')
 * - OR 'Other' is selected AND customValue is non-empty
 * For an optional field:
 * - valid if empty
 * - OR standard option selected
 * - OR 'Other' is selected AND customValue is non-empty
 */
export function isAddressFieldValid(
  selectedValue?: string | null,
  customValue?: string | null,
  isRequired: boolean = true
): boolean {
  const normSelected = (selectedValue || '').trim();
  const normCustom = (customValue || '').trim();

  if (!normSelected) {
    return !isRequired;
  }

  const lowerSelected = normSelected.toLowerCase();
  if (lowerSelected === 'other' || lowerSelected === 'other country' || lowerSelected === '__custom__') {
    return normCustom.length > 0 && normCustom.toLowerCase() !== 'other';
  }

  return true;
}

