// Canonical state/province/territory dataset with "Other" as the final option

export const INDIAN_STATES: readonly string[] = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi (NCT)',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const OTHER_OPTION = 'Other';

/**
 * Returns list of standard states/provinces for a given country (without "Other").
 * For India, returns 28 states + 8 UTs (alphabetically sorted).
 * For other countries, returns canonical list if available or empty array.
 */
export function getStandardStatesForCountry(country: string = 'India'): string[] {
  const norm = (country || '').trim().toLowerCase();
  if (norm === 'india' || !norm) {
    return [...INDIAN_STATES].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
  return [];
}

/**
 * Returns list of states/provinces for a given country, always appending "Other".
 */
export function getStatesForCountryWithOther(country: string = 'India'): string[] {
  return [...getStandardStatesForCountry(country), OTHER_OPTION];
}

/**
 * Checks whether a state/province is a known standard subdivision for the country.
 */
export function isKnownState(country: string = 'India', state?: string | null): boolean {
  if (!state || typeof state !== 'string') return false;
  const trimmed = state.trim().toLowerCase();
  if (!trimmed || trimmed === 'other') return false;

  const validStates = getStandardStatesForCountry(country);
  return validStates.some((s) => s.toLowerCase() === trimmed);
}

/**
 * Matches a state string against canonical states for a country.
 */
export function findCanonicalState(country: string = 'India', state?: string | null): string | undefined {
  if (!state || typeof state !== 'string') return undefined;
  const trimmed = state.trim().toLowerCase();
  const validStates = getStandardStatesForCountry(country);
  return validStates.find((s) => s.toLowerCase() === trimmed);
}
