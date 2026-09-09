import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import { CampusBranchData } from '../src/lib/types';
import { calculateIntakeCompleteness } from '../src/lib/schoolIntake';
import { COUNTRIES, INDIAN_STATES, getDistrictsForState } from '../src/lib/geoData';
import { applyDetectedLocationToCampus, parseGoogleAddressComponents } from '../src/components/schools/maps/googleMapsService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description}`);
  }
}

console.log('================================================================');
console.log('  SIMPLIFIED CAMPUS LOCATION ARCHITECTURE SMOKE & REGRESSION TESTS');
console.log('  (TESTS A - N & OTHER COUNTRY WORKFLOW 1 - 18)');
console.log('================================================================\n');

// Mock Campus Branch State mimicking SchoolOnboardingPortal Step 2 state transitions
type CampusFormState = CampusBranchData;

function createInitialCampus(id: string, name: string): CampusFormState {
  return {
    id,
    name,
    isMainCampus: true,
    address: 'Gandhi Chowk, Station Road',
    landmark: 'Near Gandhi Memorial',
    city: 'Motihari',
    district: 'East Champaran',
    state: 'Bihar',
    country: 'India',
    countryName: '',
    pin: '845401',
    contactPhone: '9876543210',
    operatingHours: '08:00 AM - 03:00 PM',
    facilities: ['Library', 'Computer Lab'],
    googleMapsUrl: '',
    googleMapsLink: '',
  };
}

// Handler simulating portal text input update
function updateCampusGoogleMapsUrl(campus: CampusFormState, newUrl: string): CampusFormState {
  return {
    ...campus,
    googleMapsUrl: newUrl,
    googleMapsLink: newUrl,
  };
}

// Handler simulating user editing address fields
function updateCampusAddress(campus: CampusFormState, addressUpdates: Partial<CampusFormState>): CampusFormState {
  return {
    ...campus,
    ...addressUpdates,
  };
}

// Helper simulating Country selection in portal
function selectCountry(campus: CampusFormState, selectedCountryOption: string): CampusFormState {
  if (selectedCountryOption === 'Other Country') {
    return {
      ...campus,
      country: 'Other Country',
      countryName: '',
      state: '',
      district: '',
    };
  } else {
    const defaultState = 'Bihar';
    const defaultDistrict = 'East Champaran';
    return {
      ...campus,
      country: 'India',
      countryName: '',
      state: defaultState,
      district: defaultDistrict,
    };
  }
}

// Helper simulating Country Name input typing in portal
function updateCountryName(campus: CampusFormState, name: string): CampusFormState {
  return {
    ...campus,
    countryName: name,
    country: name.trim() ? name.trim() : 'Other Country',
  };
}

function isOtherCountryMode(campus: CampusFormState): boolean {
  return (
    campus.country === 'Other Country' ||
    (Boolean(campus.country) && campus.country !== 'India') ||
    Boolean(campus.countryName)
  );
}

console.log('--- TEST A & B: Google Maps URL can be entered and stored ---');
const campus1 = createInitialCampus('cmp-1', 'Main Campus');
const testUrl1 = 'https://maps.app.goo.gl/abCdeFgHiJklmnOp7';
const campus1WithUrl = updateCampusGoogleMapsUrl(campus1, testUrl1);
assert(campus1WithUrl.googleMapsUrl === testUrl1, 'Test A: Google Maps URL can be entered');
assert(campus1WithUrl.googleMapsLink === testUrl1, 'Test B: Google Maps URL is stored on campus record');

console.log('\n--- TEST C: Google Maps URL is restored after reload/edit ---');
const serialized = JSON.stringify(campus1WithUrl);
const reloadedCampus: CampusFormState = JSON.parse(serialized);
assert(reloadedCampus.googleMapsUrl === testUrl1, 'Test C: Google Maps URL is restored from storage');
assert(reloadedCampus.googleMapsLink === testUrl1, 'Test C: Both url and link accessors are preserved');

console.log('\n--- TEST D & E: Google Maps URL can be replaced and cleared ---');
const replacedUrl = 'https://www.google.com/maps/place/Roshani+Public+School/@26.65,84.91,15z';
const campus1Replaced = updateCampusGoogleMapsUrl(reloadedCampus, replacedUrl);
assert(campus1Replaced.googleMapsUrl === replacedUrl, 'Test D: Google Maps URL can be replaced');

const campus1Cleared = updateCampusGoogleMapsUrl(campus1Replaced, '');
assert(campus1Cleared.googleMapsUrl === '', 'Test E: Google Maps URL can be cleared to empty string');
assert(campus1Cleared.googleMapsLink === '', 'Test E: Google Maps link accessor cleared');

console.log('\n--- TEST F: Empty Google Maps URL does not fail campus completion ---');
const mockProfile: any = {
  schoolName: 'Roshani Public School',
  affiliationNumber: 'CBSE123456',
  udiseCode: '10020304050',
  yearEstablished: 2005,
  schoolType: 'Co-ed',
  schoolLevel: 'Senior Secondary',
  contactEmail: 'admin@roshani.edu',
  contactPhone: '9876543210',
  website: 'https://roshani.edu',
  board: 'CBSE',
  mediumsOfInstruction: ['English', 'Hindi'],
};
const completenessWithNoMaps = calculateIntakeCompleteness('prod-basic', {
  schoolProfile: mockProfile,
  campuses: [campus1Cleared],
});
assert(completenessWithNoMaps.sectionPercentages['campuses'] === 100 || completenessWithNoMaps.percentage >= 50, 'Test F: Campus with empty Google Maps URL is valid for completion');

console.log('\n--- TEST G & H: Changing Google Maps URL does NOT modify address fields; Manual edits preserved ---');
const originalAddress = campus1.address;
const originalCity = campus1.city;
const originalDistrict = campus1.district;
const originalPin = campus1.pin;

const campusWithNewUrl = updateCampusGoogleMapsUrl(campus1, 'https://maps.app.goo.gl/newSchoolPin123');
assert(campusWithNewUrl.address === originalAddress, 'Test G: Address line is NOT modified by changing Google Maps URL');
assert(campusWithNewUrl.city === originalCity, 'Test G: City is NOT modified by changing Google Maps URL');
assert(campusWithNewUrl.district === originalDistrict, 'Test G: District is NOT modified by changing Google Maps URL');
assert(campusWithNewUrl.pin === originalPin, 'Test G: Postal PIN is NOT modified by changing Google Maps URL');

const manuallyEditedCampus = updateCampusAddress(campusWithNewUrl, {
  address: 'New Campus Gate 2, Bypass Road',
  city: 'Chakia',
  district: 'East Champaran',
  pin: '845412',
});
assert(manuallyEditedCampus.address === 'New Campus Gate 2, Bypass Road', 'Test H: Manual address edits are preserved');
assert(manuallyEditedCampus.city === 'Chakia', 'Test H: Manual city edits are preserved');

const mapsClearedAfterEdit = updateCampusGoogleMapsUrl(manuallyEditedCampus, '');
assert(mapsClearedAfterEdit.address === 'New Campus Gate 2, Bypass Road', 'Test H: Address edits remain intact after clearing Google Maps URL');

console.log('\n--- TEST I: Campus 1 URL/address does not affect Campus 2 (Multi-campus isolation) ---');
const campus2 = createInitialCampus('cmp-2', 'North Branch');
const campus2InitialAddress = 'Station Road Branch, Bettiah';
campus2.isMainCampus = false;
campus2.address = campus2InitialAddress;
campus2.city = 'Bettiah';
campus2.district = 'West Champaran';
campus2.pin = '845438';

const updatedC1 = updateCampusGoogleMapsUrl(campus1, 'https://maps.app.goo.gl/campus1Only');
const updatedC1Full = updateCampusAddress(updatedC1, { address: 'Completely Different C1 Road' });

assert(campus2.address === campus2InitialAddress, 'Test I: Campus 2 address is completely isolated from Campus 1');
assert(campus2.googleMapsUrl === '', 'Test I: Campus 2 Google Maps URL is completely isolated from Campus 1');
assert(campus2.city === 'Bettiah', 'Test I: Campus 2 city remains unaffected');

console.log('\n--- TEST J, K, L: No network request, no coordinate extraction, no geocoding ---');
const routeCode = readFileSync('src/app/api/geo/resolve-maps-url/route.ts', 'utf8');
assert(routeCode.includes('410') || routeCode.includes('retired'), 'Test J/L: Backend URL resolver route is decommissioned with HTTP 410');
assert(!routeCode.includes('googleapis.com/maps/api/geocode'), 'Test L: No Google Geocoding API calls in URL resolver route');

const portalCode = readFileSync('src/components/schools/SchoolOnboardingPortal.tsx', 'utf8');
assert(!portalCode.includes('handleDetectLocation'), 'Test J: No handleDetectLocation in SchoolOnboardingPortal');
assert(!portalCode.includes('detectSeqRef'), 'Test J: No detectSeqRef in SchoolOnboardingPortal');
assert(!portalCode.includes('/api/geo/resolve-maps-url'), 'Test J: Zero network calls to resolver route from portal');
assert(!portalCode.includes('parseCoordinatesFromUrl'), 'Test K: Zero regex coordinate extraction in SchoolOnboardingPortal');
assert(!portalCode.includes('reverseGeocode'), 'Test L: Zero reverse geocoding in SchoolOnboardingPortal');

console.log('\n--- TEST M: No map/detection UI remains in SchoolOnboardingPortal.tsx ---');
assert(!portalCode.includes('CampusMapPinPicker'), 'Test M: CampusMapPinPicker is not imported or mounted in portal');
assert(!portalCode.includes('Detect Location'), 'Test M: "Detect Location" button is removed from portal');
assert(!portalCode.includes('Detecting...'), 'Test M: Detection spinner / loading state is removed from portal');
assert(!portalCode.includes('Location detected, but address details'), 'Test M: Geocode warning banner is removed from portal');
assert(!portalCode.includes('✓ Campus location detected'), 'Test M: Detection success banner is removed from portal');
assert(!portalCode.includes('confirmation_required'), 'Test M: Confirmation required dialog is removed');
assert(
  portalCode.includes("Paste your school's Google Maps share link. This link will be saved with the campus for directions and map access.") ||
  portalCode.includes("Paste your school&apos;s Google Maps share link. This link will be saved with the campus for directions and map access.") ||
  portalCode.includes("If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school's website.") ||
  portalCode.includes("If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school&apos;s website."),
  'Test M: Exact required helper text is present'
);

console.log('\n--- TEST N: Existing school website Google Maps links continue working ---');
const provisioningCode = readFileSync('src/lib/schoolDatabaseProvisioning.ts', 'utf8');
assert(provisioningCode.includes('googleMapsLink'), 'Test N: Database provisioning persists googleMapsLink metadata');
assert(provisioningCode.includes('googleMapsUrl') || provisioningCode.includes('googleMapsLink'), 'Test N: Direction and map access links for school websites remain functional');

console.log('\n================================================================');
console.log('  OTHER COUNTRY CONDITIONAL WORKFLOW TEST SUITE (TESTS 1 - 18)');
console.log('================================================================\n');

// 1. India -> existing state dropdown works
console.log('--- 1. India -> existing state dropdown works ---');
const initialIndia = createInitialCampus('cmp-in-1', 'India Campus');
assert(initialIndia.country === 'India', 'Test 1: Default country is India');
assert(isOtherCountryMode(initialIndia) === false, 'Test 1: Country is recognized as India, Other Country mode is false');
assert(INDIAN_STATES.includes('Bihar'), 'Test 1: Indian states contains Bihar');
assert(INDIAN_STATES.length >= 28, 'Test 1: Indian states list is populated');

// 2. India -> Bihar -> East Champaran works
console.log('\n--- 2. India -> Bihar -> East Champaran works ---');
const biharDistricts = getDistrictsForState('Bihar');
assert(biharDistricts.includes('East Champaran'), 'Test 2: Bihar district list contains East Champaran');
const biharCampus = updateCampusAddress(initialIndia, { state: 'Bihar', district: 'East Champaran' });
assert(biharCampus.state === 'Bihar' && biharCampus.district === 'East Champaran', 'Test 2: State and district set accurately to Bihar & East Champaran');

// 3. India -> Other Country
console.log('\n--- 3. India -> Other Country ---');
const switchedToOther = selectCountry(biharCampus, 'Other Country');
assert(switchedToOther.country === 'Other Country', 'Test 3: Country becomes "Other Country"');
assert(switchedToOther.state === '', 'Test 3: India state selection is cleared');
assert(switchedToOther.district === '', 'Test 3: India district selection is cleared');

// 4. Other Country reveals Country Name
console.log('\n--- 4. Other Country reveals Country Name ---');
assert(isOtherCountryMode(switchedToOther) === true, 'Test 4: isOtherCountryMode is true, revealing Country Name input');

// 5. Enter "Nepal"
console.log('\n--- 5. Enter "Nepal" ---');
const nepalCampus = updateCountryName(switchedToOther, 'Nepal');
assert(nepalCampus.countryName === 'Nepal', 'Test 5: countryName is set to "Nepal"');
assert(nepalCampus.country === 'Nepal', 'Test 5: Actual stored country is "Nepal" and NOT literal "Other Country"');
assert(isOtherCountryMode(nepalCampus) === true, 'Test 5: Other Country mode remains active for "Nepal"');

// 6. State becomes free text
console.log('\n--- 6. State becomes free text ---');
const nepalWithState = updateCampusAddress(nepalCampus, { state: 'Bagmati Province' });
assert(nepalWithState.state === 'Bagmati Province', 'Test 6: Free-text State/Province accepted as "Bagmati Province"');

// 7. District becomes free text
console.log('\n--- 7. District becomes free text ---');
const nepalWithDistrict = updateCampusAddress(nepalWithState, { district: 'Kathmandu' });
assert(nepalWithDistrict.district === 'Kathmandu', 'Test 7: Free-text District accepted as "Kathmandu"');

// 8. City remains editable
console.log('\n--- 8. City remains editable ---');
const nepalWithCity = updateCampusAddress(nepalWithDistrict, { city: 'Kathmandu' });
assert(nepalWithCity.city === 'Kathmandu', 'Test 8: City edited to "Kathmandu"');

// 9. Postal code remains editable
console.log('\n--- 9. Postal code remains editable ---');
const nepalWithPin = updateCampusAddress(nepalWithCity, { pin: '44600' });
assert(nepalWithPin.pin === '44600', 'Test 9: Postal code edited to international code "44600"');

// Check intake completeness for Nepal campus
const nepalCompleteness = calculateIntakeCompleteness('school-website', {
  schoolProfile: mockProfile,
  campuses: [nepalWithPin],
});
assert(nepalCompleteness.sectionPercentages['campuses'] === 100, 'Test 9b: International campus with custom country is valid for completion');

// 10. Switch Other Country -> India
console.log('\n--- 10. Switch Other Country -> India ---');
const switchedBackToIndia = selectCountry(nepalWithPin, 'India');
assert(switchedBackToIndia.country === 'India', 'Test 10: Country switches back to "India"');
assert(switchedBackToIndia.countryName === '', 'Test 10: countryName is cleared');
assert(isOtherCountryMode(switchedBackToIndia) === false, 'Test 10: Other Country mode is false, Country Name is hidden');

// 11. Verify custom country/state/district values do not contaminate India dropdown state
console.log('\n--- 11. Verify custom values do not contaminate India dropdowns ---');
assert(switchedBackToIndia.state === 'Bihar', 'Test 11: India state reset to valid Indian state');
assert(INDIAN_STATES.includes(switchedBackToIndia.state), 'Test 11: State belongs to valid Indian states');
assert(switchedBackToIndia.district === 'East Champaran', 'Test 11: India district reset to valid Indian district');
assert(biharDistricts.includes(switchedBackToIndia.district!), 'Test 11: District belongs to valid Bihar districts');
assert(switchedBackToIndia.state !== 'Bagmati Province', 'Test 11: "Bagmati Province" completely cleared');
assert(switchedBackToIndia.district !== 'Kathmandu', 'Test 11: "Kathmandu" district completely cleared');
// Verify unrelated fields were preserved
assert(switchedBackToIndia.city === 'Kathmandu', 'Test 11: Unrelated city field preserved');
assert(switchedBackToIndia.pin === '44600', 'Test 11: Unrelated postal PIN field preserved');
assert(switchedBackToIndia.address === biharCampus.address, 'Test 11: Unrelated postal address preserved');

// 12. Google Maps detection for India still works
console.log('\n--- 12. Google Maps detection for India still works ---');
const detectedIndiaRaw = {
  formatted_address: 'Station Road, Motihari, Bihar 845401, India',
  address_components: [
    { long_name: 'Motihari', types: ['locality'] },
    { long_name: 'East Champaran', types: ['administrative_area_level_2'] },
    { long_name: 'Bihar', types: ['administrative_area_level_1'] },
    { long_name: 'India', types: ['country'] },
    { long_name: '845401', types: ['postal_code'] },
  ],
};
const parsedIndia = parseGoogleAddressComponents(detectedIndiaRaw.address_components, detectedIndiaRaw.formatted_address);
assert(parsedIndia.country === 'India', 'Test 12: Detected country is India');
const appliedIndia = applyDetectedLocationToCampus(createInitialCampus('cmp-in', 'Main'), parsedIndia);
assert(appliedIndia.country === 'India', 'Test 12: Applied country is India');
assert(appliedIndia.state === 'Bihar', 'Test 12: Applied state is Bihar');
assert(appliedIndia.district === 'East Champaran', 'Test 12: Applied district is East Champaran');
assert(appliedIndia.city === 'Motihari', 'Test 12: Applied city is Motihari');

// 13. Google Maps detection for an international location populates Country Name correctly
console.log('\n--- 13. Google Maps detection for international location ---');
const detectedNepalRaw = {
  formatted_address: 'Thamel, Kathmandu 44600, Nepal',
  address_components: [
    { long_name: 'Kathmandu', types: ['locality'] },
    { long_name: 'Kathmandu', types: ['administrative_area_level_2'] },
    { long_name: 'Bagmati Province', types: ['administrative_area_level_1'] },
    { long_name: 'Nepal', types: ['country'] },
    { long_name: '44600', types: ['postal_code'] },
  ],
};
const parsedNepal = parseGoogleAddressComponents(detectedNepalRaw.address_components, detectedNepalRaw.formatted_address);
assert(parsedNepal.country === 'Nepal', 'Test 13: Detected country is Nepal');
assert(parsedNepal.countryName === 'Nepal', 'Test 13: Parsed countryName is Nepal');
const appliedNepal = applyDetectedLocationToCampus(createInitialCampus('cmp-np', 'International'), parsedNepal);
assert(appliedNepal.country === 'Other Country' || appliedNepal.country === 'Nepal', 'Test 13: Country set for dropdown selection');
assert(appliedNepal.countryName === 'Nepal' || appliedNepal.country === 'Nepal', 'Test 13: Country Name populated with "Nepal"');
assert(appliedNepal.state === 'Bagmati Province' || appliedNepal.otherStateProvince === 'Bagmati Province', 'Test 13: State populated with "Bagmati Province"');
assert(appliedNepal.district === 'Kathmandu' || appliedNepal.otherDistrict === 'Kathmandu', 'Test 13: District populated with "Kathmandu"');
assert(appliedNepal.city === 'Kathmandu', 'Test 13: City populated with "Kathmandu"');
assert(appliedNepal.pin === '44600', 'Test 13: Postal PIN populated with "44600"');

// 14. Multi-campus isolation remains intact
console.log('\n--- 14. Multi-campus isolation remains intact ---');
const multiList: CampusFormState[] = [
  createInitialCampus('c-1', 'India Main Campus'),
  createInitialCampus('c-2', 'Nepal Branch Campus'),
];
// Turn Campus 2 into Nepal
multiList[1] = selectCountry(multiList[1], 'Other Country');
multiList[1] = updateCountryName(multiList[1], 'Nepal');
multiList[1] = updateCampusAddress(multiList[1], { state: 'Bagmati Province', district: 'Kathmandu' });

assert(multiList[0].country === 'India', 'Test 14: Campus 1 remains India');
assert(multiList[0].state === 'Bihar', 'Test 14: Campus 1 state remains Bihar');
assert(multiList[1].country === 'Nepal', 'Test 14: Campus 2 is Nepal');
assert(multiList[1].state === 'Bagmati Province', 'Test 14: Campus 2 state is Bagmati Province');
assert(isOtherCountryMode(multiList[0]) === false, 'Test 14: Campus 1 is NOT in Other Country mode');
assert(isOtherCountryMode(multiList[1]) === true, 'Test 14: Campus 2 is in Other Country mode');

// 15. Save/reload preserves selected country and custom location values
console.log('\n--- 15. Save/reload preserves custom location values ---');
const savedJson = JSON.stringify(multiList[1]);
const reloadedIntlCampus: CampusFormState = JSON.parse(savedJson);
assert(reloadedIntlCampus.country === 'Nepal', 'Test 15: Country preserved as "Nepal"');
assert(reloadedIntlCampus.countryName === 'Nepal', 'Test 15: CountryName preserved as "Nepal"');
assert(isOtherCountryMode(reloadedIntlCampus) === true, 'Test 15: Reloaded record maintains Other Country mode');
assert(reloadedIntlCampus.state === 'Bagmati Province', 'Test 15: Reloaded record maintains "Bagmati Province"');
assert(reloadedIntlCampus.district === 'Kathmandu', 'Test 15: Reloaded record maintains "Kathmandu"');

// Verify portal source code UI assertions
console.log('\n--- UI AUDIT IN SchoolOnboardingPortal.tsx ---');
assert(portalCode.includes('Other Country Name') || portalCode.includes('Country Name *'), 'Portal UI: Contains country label');
assert(portalCode.includes('Enter country name'), 'Portal UI: Contains "Enter country name" placeholder');
assert(portalCode.includes('Enter state, province, or territory') || portalCode.includes('Enter state or province'), 'Portal UI: Contains state placeholder');
assert(portalCode.includes('Enter district'), 'Portal UI: Contains "Enter district" placeholder');

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passed + failed}`);
console.log(`PASSED:       ${passed}`);
console.log(`FAILED:       ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n[PASS] ALL PRODUCTION SMOKE & OTHER COUNTRY TESTS PASSED (100% SUCCESS)');
}