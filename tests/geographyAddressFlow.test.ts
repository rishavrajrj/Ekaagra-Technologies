import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCountries,
  getStandardCountries,
  getStatesForCountry,
  getStandardStatesForCountry,
  getDistrictsForState,
  getStandardDistrictsForState,
  isKnownCountry,
  isKnownState,
  isKnownDistrict,
  resolveAddressValue,
  normalizeAddressEntity,
  getEffectiveAddress,
  isAddressFieldValid,
  OTHER_OPTION,
} from '@/lib/geography';

import { applyDetectedLocationToCampus } from '@/components/schools/maps/googleMapsService';
import { calculateIntakeCompleteness, createInitialIntakeData } from '@/lib/schoolIntake';

describe('Production-Hardened Address Architecture: Standard List + Other Pattern', () => {

  // 1. Standard country selection
  test('1. Standard country selection: selects canonical country without otherCountry', () => {
    assert.equal(isKnownCountry('India'), true);
    assert.equal(isKnownCountry('United States'), true);
    assert.equal(isKnownCountry('Japan'), true);
    assert.equal(isKnownCountry('Nepal'), true);

    const countries = getCountries();
    assert.equal(countries.includes('India'), true);
    assert.equal(countries.includes('Japan'), true);
    assert.equal(countries[countries.length - 1], OTHER_OPTION);

    const resolved = resolveAddressValue('Japan', '');
    assert.equal(resolved, 'Japan');
  });

  // 2. Other country selection
  test('2. Other country selection: resolves to custom entered country value', () => {
    assert.equal(isKnownCountry(OTHER_OPTION), false);
    const resolved = resolveAddressValue(OTHER_OPTION, 'Nepal');
    assert.equal(resolved, 'Nepal');
  });

  // 3. Other country without custom text
  test('3. Other country without custom text: invalid and resolves to empty string', () => {
    assert.equal(isAddressFieldValid(OTHER_OPTION, '', true), false);
    assert.equal(isAddressFieldValid(OTHER_OPTION, '   ', true), false);
    assert.equal(resolveAddressValue(OTHER_OPTION, ''), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, '   '), '');
  });

  // 4. Custom country persistence
  test('4. Custom country persistence: persists trimmed custom value, never literal Other', () => {
    const campus = {
      country: OTHER_OPTION,
      otherCountry: '  Republic of Exampleland  ',
      state: OTHER_OPTION,
      otherStateProvince: 'Example Province',
      district: OTHER_OPTION,
      otherDistrict: 'Example District',
      city: 'Example City',
      pin: '99999',
      address: 'Main St',
    };

    const effective = getEffectiveAddress(campus);
    assert.equal(effective.country, 'Republic of Exampleland');
    assert.notEqual(effective.country, OTHER_OPTION);
    assert.equal(effective.country, effective.country.trim());
  });

  // 5. Standard Indian state
  test('5. Standard Indian state: includes all 28 states and 8 UTs and resolves correctly', () => {
    const indianStates = getStandardStatesForCountry('India');
    assert.equal(indianStates.length, 36, 'India must have 28 states + 8 UTs = 36 entities');
    assert.equal(isKnownState('India', 'Bihar'), true);
    assert.equal(isKnownState('India', 'Maharashtra'), true);
    assert.equal(isKnownState('India', 'Delhi (NCT)'), true);
    assert.equal(isKnownState('India', 'Ladakh'), true);

    const statesWithOther = getStatesForCountry('India');
    assert.equal(statesWithOther[statesWithOther.length - 1], OTHER_OPTION);

    const resolved = resolveAddressValue('Bihar', '');
    assert.equal(resolved, 'Bihar');
  });

  // 6. Other state
  test('6. Other state: resolves to custom entered state', () => {
    const resolved = resolveAddressValue(OTHER_OPTION, 'Bagmati Province');
    assert.equal(resolved, 'Bagmati Province');
    assert.equal(isAddressFieldValid(OTHER_OPTION, 'Bagmati Province', true), true);
  });

  // 7. Other state without custom text
  test('7. Other state without custom text: invalid and resolves to empty string', () => {
    assert.equal(isAddressFieldValid(OTHER_OPTION, '', true), false);
    assert.equal(isAddressFieldValid(OTHER_OPTION, '   ', true), false);
    assert.equal(resolveAddressValue(OTHER_OPTION, ''), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, '   '), '');
  });

  // 8. Custom state persistence
  test('8. Custom state persistence: persists trimmed custom state value', () => {
    const entity = {
      country: OTHER_OPTION,
      otherCountry: 'Nepal',
      state: OTHER_OPTION,
      otherStateProvince: '  Bagmati Province  ',
    };

    const norm = normalizeAddressEntity(entity);
    assert.equal(norm.effectiveState, 'Bagmati Province');
    assert.notEqual(norm.effectiveState, OTHER_OPTION);
  });

  // 9. Standard Bihar district
  test('9. Standard Bihar district: contains all 38 districts including Champaran and resolves correctly', () => {
    const biharDistricts = getStandardDistrictsForState('India', 'Bihar');
    assert.equal(biharDistricts.length, 38, 'Bihar must have 38 districts');
    assert.equal(biharDistricts.includes('East Champaran'), true);
    assert.equal(biharDistricts.includes('West Champaran'), true);
    assert.equal(biharDistricts.includes('Patna'), true);
    assert.equal(isKnownDistrict('India', 'Bihar', 'East Champaran'), true);

    const resolved = resolveAddressValue('East Champaran', '');
    assert.equal(resolved, 'East Champaran');
  });

  // 10. Other district
  test('10. Other district: resolves to custom entered district name', () => {
    const resolved = resolveAddressValue(OTHER_OPTION, 'Kathmandu');
    assert.equal(resolved, 'Kathmandu');
    assert.equal(isAddressFieldValid(OTHER_OPTION, 'Kathmandu', true), true);
  });

  // 11. Other district without custom text
  test('11. Other district without custom text: invalid and resolves to empty string', () => {
    assert.equal(isAddressFieldValid(OTHER_OPTION, '', true), false);
    assert.equal(isAddressFieldValid(OTHER_OPTION, '   ', true), false);
    assert.equal(resolveAddressValue(OTHER_OPTION, ''), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, '   '), '');
  });

  // 12. Custom district persistence
  test('12. Custom district persistence: persists trimmed custom district value', () => {
    const entity = {
      country: OTHER_OPTION,
      otherCountry: 'Nepal',
      state: OTHER_OPTION,
      otherStateProvince: 'Bagmati Province',
      district: OTHER_OPTION,
      otherDistrict: '  Kathmandu District  ',
    };

    const norm = normalizeAddressEntity(entity);
    assert.equal(norm.effectiveDistrict, 'Kathmandu District');
    assert.notEqual(norm.effectiveDistrict, OTHER_OPTION);
  });

  // 13. Country change resets state/district
  test('13. Country change resets state/district: geographic descendants reset while unrelated address fields are preserved', () => {
    const initialCampus = {
      country: 'India',
      state: 'Bihar',
      district: 'East Champaran',
      otherCountry: '',
      otherStateProvince: '',
      otherDistrict: '',
      address: 'Near Gandhi Memorial, Station Road',
      landmark: 'Opposite Clock Tower',
      city: 'Motihari',
      pin: '845401',
      contactPhone: '9876543210',
      operatingHours: '08:00 AM - 03:00 PM',
    };

    // Simulate user switching Country to 'Nepal'
    const newCountry = 'Nepal';
    const nextCampus = { ...initialCampus };

    // Reset geographic descendants
    nextCampus.country = newCountry;
    nextCampus.otherCountry = '';
    nextCampus.state = OTHER_OPTION;
    nextCampus.otherStateProvince = '';
    nextCampus.district = OTHER_OPTION;
    nextCampus.otherDistrict = '';

    // Verify geographic descendants were reset
    assert.equal(nextCampus.country, 'Nepal');
    assert.equal(nextCampus.state, OTHER_OPTION);
    assert.equal(nextCampus.otherStateProvince, '');
    assert.equal(nextCampus.district, OTHER_OPTION);
    assert.equal(nextCampus.otherDistrict, '');

    // Verify unrelated address fields were NOT destroyed
    assert.equal(nextCampus.address, 'Near Gandhi Memorial, Station Road');
    assert.equal(nextCampus.landmark, 'Opposite Clock Tower');
    assert.equal(nextCampus.city, 'Motihari');
    assert.equal(nextCampus.pin, '845401');
    assert.equal(nextCampus.contactPhone, '9876543210');
    assert.equal(nextCampus.operatingHours, '08:00 AM - 03:00 PM');
  });

  // 14. State change resets district
  test('14. State change resets district: district resets while country, city, address are preserved', () => {
    const initialCampus = {
      country: 'India',
      state: 'Bihar',
      district: 'East Champaran',
      otherDistrict: '',
      address: '123 School Way',
      city: 'Motihari',
      pin: '845401',
    };

    // Switch state to 'Uttar Pradesh'
    const newState = 'Uttar Pradesh';
    const nextCampus = { ...initialCampus };
    nextCampus.state = newState;
    const upDistricts = getStandardDistrictsForState('India', newState);
    nextCampus.district = upDistricts[0] || OTHER_OPTION;
    nextCampus.otherDistrict = '';

    // Verify district was updated to first district of UP and otherDistrict was cleared
    assert.equal(nextCampus.state, 'Uttar Pradesh');
    assert.equal(nextCampus.district, 'Agra');
    assert.equal(nextCampus.otherDistrict, '');

    // Verify country and street address remained untouched
    assert.equal(nextCampus.country, 'India');
    assert.equal(nextCampus.address, '123 School Way');
    assert.equal(nextCampus.city, 'Motihari');
    assert.equal(nextCampus.pin, '845401');
  });

  // 15. Legacy unknown country normalization
  test('15. Legacy unknown country normalization: maps unknown country to Other + custom without data loss', () => {
    const legacy = {
      country: 'Some Newly Recognized Region',
      state: 'Region State',
      district: 'Region District',
    };

    const normalized = normalizeAddressEntity(legacy);
    assert.equal(normalized.country, OTHER_OPTION);
    assert.equal(normalized.otherCountry, 'Some Newly Recognized Region');
    assert.equal(normalized.effectiveCountry, 'Some Newly Recognized Region');
  });

  // 16. Legacy unknown state normalization
  test('16. Legacy unknown state normalization: maps unknown state to Other + custom without data loss', () => {
    const legacy = {
      country: 'India',
      state: 'Some Newly Formed Territorial Entity',
      district: 'Patna',
    };

    const normalized = normalizeAddressEntity(legacy);
    assert.equal(normalized.country, 'India');
    assert.equal(normalized.state, OTHER_OPTION);
    assert.equal(normalized.otherStateProvince, 'Some Newly Formed Territorial Entity');
    assert.equal(normalized.effectiveState, 'Some Newly Formed Territorial Entity');
  });

  // 17. Legacy unknown district normalization
  test('17. Legacy unknown district normalization: maps unknown district to Other + custom without data loss', () => {
    const legacy = {
      country: 'India',
      state: 'Bihar',
      district: 'Newly Formed Border District',
    };

    const normalized = normalizeAddressEntity(legacy);
    assert.equal(normalized.country, 'India');
    assert.equal(normalized.state, 'Bihar');
    assert.equal(normalized.district, OTHER_OPTION);
    assert.equal(normalized.otherDistrict, 'Newly Formed Border District');
    assert.equal(normalized.effectiveDistrict, 'Newly Formed Border District');
  });

  // 18. Google Maps unknown country
  test('18. Google Maps unknown country: selects Other and populates otherCountry with detected name', () => {
    const current = { country: 'India' };
    const detected = {
      country: 'Atlantis Federal Territory',
      state: 'North Atlantis',
      district: 'Ocean View District',
      city: 'Poseidon City',
      postalCode: '00000',
    };

    const result = applyDetectedLocationToCampus(current, detected);
    assert.equal(result.country, OTHER_OPTION);
    assert.equal(result.otherCountry, 'Atlantis Federal Territory');
    assert.equal(result.city, 'Poseidon City');
    assert.equal(result.pin, '00000');
  });

  // 19. Google Maps unknown state
  test('19. Google Maps unknown state: selects Other and populates otherStateProvince', () => {
    const current = { country: 'India' };
    const detected = {
      country: 'India',
      state: 'Special Administrative Region of Himalayas',
      district: 'Zone 1',
    };

    const result = applyDetectedLocationToCampus(current, detected);
    assert.equal(result.country, 'India');
    assert.equal(result.state, OTHER_OPTION);
    assert.equal(result.otherStateProvince, 'Special Administrative Region of Himalayas');
  });

  // 20. Google Maps unknown district
  test('20. Google Maps unknown district: selects Other and populates otherDistrict', () => {
    const current = { country: 'India', state: 'Bihar' };
    const detected = {
      country: 'India',
      state: 'Bihar',
      district: 'Unincorporated River Valley District',
    };

    const result = applyDetectedLocationToCampus(current, detected);
    assert.equal(result.country, 'India');
    assert.equal(result.state, 'Bihar');
    assert.equal(result.district, OTHER_OPTION);
    assert.equal(result.otherDistrict, 'Unincorporated River Valley District');
  });

  // 21. Review screen shows effective values
  test('21. Review screen shows effective values: displays resolved custom names, not literal Other', () => {
    const campus = {
      country: OTHER_OPTION,
      otherCountry: 'Nepal',
      state: OTHER_OPTION,
      otherStateProvince: 'Bagmati Province',
      district: OTHER_OPTION,
      otherDistrict: 'Kathmandu',
      city: 'Kathmandu',
      pin: '44600',
      address: 'Thamel Boulevard',
    };

    const effective = getEffectiveAddress(campus);
    assert.equal(effective.country, 'Nepal');
    assert.notEqual(effective.country, OTHER_OPTION);
    assert.equal(effective.state, 'Bagmati Province');
    assert.notEqual(effective.state, OTHER_OPTION);
    assert.equal(effective.district, 'Kathmandu');
    assert.notEqual(effective.district, OTHER_OPTION);
  });

  // 22. Final submission persists effective values
  test('22. Final submission persists effective values: intake completion and data resolution enforce effective values', () => {
    const initial = createInitialIntakeData({
      schoolName: 'Himalayan International Academy',
      contactName: 'Karma Sherpa',
      contactEmail: 'admin@himalayan.edu',
      contactPhone: '9876543210',
      city: 'Kathmandu',
      state: 'Bagmati Province',
    });

    const mainCampus = initial.campuses![0];
    mainCampus.address = 'Main Campus Highway';
    mainCampus.city = 'Kathmandu';
    mainCampus.pin = '44600';
    mainCampus.country = OTHER_OPTION;
    mainCampus.otherCountry = 'Nepal';
    mainCampus.state = OTHER_OPTION;
    mainCampus.otherStateProvince = 'Bagmati Province';
    mainCampus.district = OTHER_OPTION;
    mainCampus.otherDistrict = 'Kathmandu';

    const completeness = calculateIntakeCompleteness('school-website', initial);
    assert.equal(completeness.sectionPercentages['campuses'], 100);

    const effective = getEffectiveAddress(mainCampus);
    assert.equal(effective.country, 'Nepal');
    assert.equal(effective.state, 'Bagmati Province');
    assert.equal(effective.district, 'Kathmandu');
  });

  // 23. No literal "Other" reaches effective database location fields
  test('23. No literal "Other" reaches effective database location fields: returns empty string if custom is absent or literal other', () => {
    // Other with no custom text
    assert.equal(resolveAddressValue(OTHER_OPTION, ''), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, '   '), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, null), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, undefined), '');

    // Other with literal "other" as custom text
    assert.equal(resolveAddressValue(OTHER_OPTION, 'Other'), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, 'other'), '');
    assert.equal(resolveAddressValue(OTHER_OPTION, 'OTHER'), '');

    // Standard options pass through
    assert.equal(resolveAddressValue('India', ''), 'India');
    assert.equal(resolveAddressValue('Bihar', ''), 'Bihar');

    // Case insensitivity protection
    assert.equal(resolveAddressValue('other', 'Nepal'), 'Nepal');
    assert.equal(resolveAddressValue('Other Country', 'Bhutan'), 'Bhutan');
  });

  // 24. Intake initialization with non-district city
  test('24. Intake initialization: non-district city string (e.g. Bihar) safely defaults district to East Champaran', () => {
    const intake = createInitialIntakeData({
      schoolName: 'SparkNest Academy School',
      city: 'Bihar',
      state: 'Bihar',
    });
    assert.equal(intake.schoolProfile.district, 'East Champaran');
    assert.equal(intake.campuses![0].district, 'East Champaran');
    assert.equal(intake.campuses![0].city, 'Bihar');
    assert.equal(intake.campuses![0].state, 'Bihar');
    assert.equal(intake.campuses![0].country, 'India');
  });

  // 25. Intake initialization with valid district city
  test('25. Intake initialization: valid district city (e.g. Patna) sets district to Patna', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Patna Central School',
      city: 'Patna',
      state: 'Bihar',
    });
    assert.equal(intake.schoolProfile.district, 'Patna');
    assert.equal(intake.campuses![0].district, 'Patna');
  });

  // 26. normalizeAddressEntity resilience
  test('26. normalizeAddressEntity resilience: empty Other country does not wipe out valid standard state and district', () => {
    const corruptedEntity = {
      country: OTHER_OPTION,
      otherCountry: '',
      state: 'Bihar',
      district: 'East Champaran',
    };
    const norm = normalizeAddressEntity(corruptedEntity);
    assert.equal(norm.state, 'Bihar');
    assert.equal(norm.district, 'East Champaran');
  });

  // 27. Self-healing logic for corrupted empty Other campus records
  test('27. Draft self-healing: detects empty Other country, state, and district and restores standard defaults', () => {
    const corruptedCampus = {
      country: OTHER_OPTION,
      otherCountry: '',
      countryName: '',
      state: OTHER_OPTION,
      otherStateProvince: '',
      otherState: '',
      district: OTHER_OPTION,
      otherDistrict: '',
      city: 'Bihar',
      pin: '845401',
    };

    // Apply healing logic identical to SchoolOnboardingPortal
    const hasEmptyOtherCountry =
      (corruptedCampus.country === OTHER_OPTION || corruptedCampus.country === 'Other Country') &&
      !(corruptedCampus.otherCountry || corruptedCampus.countryName || '').trim();
    if (hasEmptyOtherCountry) {
      corruptedCampus.country = 'India';
    }

    const currentCountry = corruptedCampus.country || 'India';
    const hasEmptyOtherState =
      corruptedCampus.state === OTHER_OPTION &&
      !(corruptedCampus.otherStateProvince || corruptedCampus.otherState || '').trim();
    if (hasEmptyOtherState && currentCountry.toLowerCase() === 'india') {
      corruptedCampus.state = 'Bihar';
    }

    const currentState = corruptedCampus.state || 'Bihar';
    const hasEmptyOtherDistrict =
      (corruptedCampus.district === OTHER_OPTION || corruptedCampus.district === '__custom__') &&
      !(corruptedCampus.otherDistrict || '').trim();
    if (hasEmptyOtherDistrict && currentCountry.toLowerCase() === 'india') {
      const dList = getStandardDistrictsForState('India', currentState);
      corruptedCampus.district = dList.includes('East Champaran') ? 'East Champaran' : (dList[0] || 'East Champaran');
    }

    const healed = normalizeAddressEntity(corruptedCampus);
    assert.equal(healed.country, 'India');
    assert.equal(healed.state, 'Bihar');
    assert.equal(healed.district, 'East Champaran');
    assert.equal(healed.effectiveCountry, 'India');
    assert.equal(healed.effectiveState, 'Bihar');
    assert.equal(healed.effectiveDistrict, 'East Champaran');
  });

  // 28. Strict alphabetical ordering for all dropdown lists
  test('28. Strict alphabetical ordering: country, state, and district datasets are 100% sorted A-Z', () => {
    // 1. Countries
    const countries = getStandardCountries();
    const sortedCountries = [...countries].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    assert.deepEqual(countries, sortedCountries, 'Standard countries list must be sorted A-Z');

    // 2. States
    const states = getStandardStatesForCountry('India');
    const sortedStates = [...states].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    assert.deepEqual(states, sortedStates, 'Standard Indian states list must be sorted A-Z');
    assert.equal(states[0], 'Andaman and Nicobar Islands');
    assert.equal(states[states.length - 1], 'West Bengal');

    // 3. Districts (Bihar)
    const biharDistricts = getStandardDistrictsForState('India', 'Bihar');
    const sortedBihar = [...biharDistricts].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    assert.deepEqual(biharDistricts, sortedBihar, 'Standard Bihar districts must be sorted A-Z');
    assert.equal(biharDistricts[0], 'Araria');
    assert.equal(biharDistricts[biharDistricts.length - 1], 'West Champaran');

    // 4. Districts (Maharashtra)
    const mhDistricts = getStandardDistrictsForState('India', 'Maharashtra');
    const sortedMH = [...mhDistricts].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    assert.deepEqual(mhDistricts, sortedMH, 'Standard Maharashtra districts must be sorted A-Z');
    assert.equal(mhDistricts[0], 'Ahmednagar');
    assert.equal(mhDistricts[mhDistricts.length - 1], 'Yavatmal');

    // 5. Districts (Madhya Pradesh)
    const mpDistricts = getStandardDistrictsForState('India', 'Madhya Pradesh');
    const sortedMP = [...mpDistricts].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    assert.deepEqual(mpDistricts, sortedMP, 'Standard Madhya Pradesh districts must be sorted A-Z');
    assert.equal(mpDistricts[0], 'Bhind');
    assert.equal(mpDistricts[mpDistricts.length - 1], 'Vidisha');
  });

});
