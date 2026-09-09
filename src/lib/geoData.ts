// Geographic data layer - re-exported from canonical geography module for backward compatibility

export * from './geography';

import {
  CANONICAL_COUNTRIES,
  INDIAN_STATES,
  DISTRICTS_BY_STATE,
  getStatesForCountry as getStatesForCountryGeo,
  getDistrictsForState as getDistrictsForStateGeo,
  OTHER_OPTION,
} from './geography';

export interface CountryOption {
  code: string;
  name: string;
}

/**
 * Backward-compatible list of country options mapping canonical countries to { code, name }
 * with "Other" as the final option.
 */
export const COUNTRIES: CountryOption[] = [
  ...CANONICAL_COUNTRIES.map((name) => ({
    code: name.slice(0, 3).toUpperCase(),
    name,
  })),
  { code: 'OTHER', name: OTHER_OPTION },
];

export { INDIAN_STATES, DISTRICTS_BY_STATE };

export function getStatesForCountry(country: string = 'India'): string[] {
  return getStatesForCountryGeo(country);
}

export function getDistrictsForState(state: string = 'Bihar'): string[] {
  return getDistrictsForStateGeo('India', state);
}

export function isIndianState(state: string): boolean {
  return INDIAN_STATES.includes(state);
}
