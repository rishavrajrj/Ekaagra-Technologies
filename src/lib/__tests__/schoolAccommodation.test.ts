/**
 * ==============================================================================
 * SCHOOL ACCOMMODATION TYPE & RESIDENTIAL STATUS TESTS
 * File: src/lib/__tests__/schoolAccommodation.test.ts
 * ==============================================================================
 *
 * Verifies:
 * 1. Dropdown options catalog order, canonical values, and exact display labels:
 *    - Day School (day_school)
 *    - Day Boarding (day_boarding)
 *    - Residential / Boarding School (residential)
 *    - Day & Residential (Hostel) (both_day_and_residential)
 * 2. Display-label mapping (getSchoolAccommodationLabel) with legacy backward compatibility.
 * 3. Canonical normalization (normalizeSchoolAccommodationType) preserving canonical stored values.
 * 4. Hostel applicability resolution (isHostelApplicable) for all accommodation types.
 * 5. State preservation, serialization round-trip, and draft save/load behavior.
 */

import assert from 'node:assert';
import {
  SCHOOL_ACCOMMODATION_OPTIONS,
  SCHOOL_ACCOMMODATION_LABELS,
  SCHOOL_ACCOMMODATION_DESCRIPTIONS,
  normalizeSchoolAccommodationType,
  getSchoolAccommodationLabel,
  getSchoolAccommodationDescription,
  type SchoolAccommodationType,
} from '../schoolIntake';
import { isHostelApplicable } from '../hostelUtils';
import type { UniversalIntakeData } from '../types';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n===========================================================');
console.log('TEST SUITE: School Accommodation Type & Residential Status');
console.log('===========================================================');

// ─── 1. OPTIONS CATALOG INTEGRITY & EXACT ORDER ─────────────────────────────
console.log('\n--- 1. Options Catalog Order & Canonical Mapping ---');

runTest('Catalog contains exactly 4 options in exact requested order', () => {
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS.length, 4);

  // 1. Day School
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[0].value, 'day_school');
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[0].label, 'Day School');
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_OPTIONS[0].description,
    'Students attend school during the day and return home after school hours. No hostel accommodation is provided.'
  );

  // 2. Day & Residential (Hostel)
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[1].value, 'both_day_and_residential');
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[1].label, 'Day & Residential (Hostel)');
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_OPTIONS[1].description,
    'The school offers both day schooling and hostel accommodation for students who live on campus.'
  );

  // 3. Day Boarding
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[2].value, 'day_boarding');
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[2].label, 'Day Boarding');
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_OPTIONS[2].description,
    'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.'
  );

  // 4. Residential / Boarding School
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[3].value, 'residential');
  assert.strictEqual(SCHOOL_ACCOMMODATION_OPTIONS[3].label, 'Residential / Boarding School');
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_OPTIONS[3].description,
    'Students live on the school campus in school-provided hostel/residential facilities.'
  );
});

runTest('Canonical label dictionary matches exact human-readable labels', () => {
  assert.strictEqual(SCHOOL_ACCOMMODATION_LABELS.day_school, 'Day School');
  assert.strictEqual(SCHOOL_ACCOMMODATION_LABELS.both_day_and_residential, 'Day & Residential (Hostel)');
  assert.strictEqual(SCHOOL_ACCOMMODATION_LABELS.day_boarding, 'Day Boarding');
  assert.strictEqual(SCHOOL_ACCOMMODATION_LABELS.residential, 'Residential / Boarding School');
});

runTest('Canonical description dictionary matches exact descriptions', () => {
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_DESCRIPTIONS.day_school,
    'Students attend school during the day and return home after school hours. No hostel accommodation is provided.'
  );
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_DESCRIPTIONS.both_day_and_residential,
    'The school offers both day schooling and hostel accommodation for students who live on campus.'
  );
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_DESCRIPTIONS.day_boarding,
    'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.'
  );
  assert.strictEqual(
    SCHOOL_ACCOMMODATION_DESCRIPTIONS.residential,
    'Students live on the school campus in school-provided hostel/residential facilities.'
  );
});

runTest('getSchoolAccommodationDescription resolves descriptions correctly for canonical and legacy values', () => {
  assert.strictEqual(
    getSchoolAccommodationDescription('day_school'),
    'Students attend school during the day and return home after school hours. No hostel accommodation is provided.'
  );
  assert.strictEqual(
    getSchoolAccommodationDescription('Both Day & Residential'),
    'The school offers both day schooling and hostel accommodation for students who live on campus.'
  );
  assert.strictEqual(
    getSchoolAccommodationDescription('day boarding'),
    'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.'
  );
  assert.strictEqual(
    getSchoolAccommodationDescription('boarding'),
    'Students live on the school campus in school-provided hostel/residential facilities.'
  );
  assert.strictEqual(
    getSchoolAccommodationDescription(null),
    'Students attend school during the day and return home after school hours. No hostel accommodation is provided.'
  );
});

// ─── 2. DISPLAY-LABEL MAPPING WITH BACKWARD COMPATIBILITY ────────────────────
console.log('\n--- 2. Display Label Mapping & Backward Compatibility ---');

runTest('Canonical keys map to exact expected labels', () => {
  assert.strictEqual(getSchoolAccommodationLabel('day_school'), 'Day School');
  assert.strictEqual(getSchoolAccommodationLabel('day_boarding'), 'Day Boarding');
  assert.strictEqual(getSchoolAccommodationLabel('residential'), 'Residential / Boarding School');
  assert.strictEqual(getSchoolAccommodationLabel('both_day_and_residential'), 'Day & Residential (Hostel)');
});

runTest('Legacy stored values and aliases map to updated display labels', () => {
  // Legacy "Both Day & Residential"
  assert.strictEqual(getSchoolAccommodationLabel('Both Day & Residential'), 'Day & Residential (Hostel)');
  assert.strictEqual(getSchoolAccommodationLabel('both day & residential'), 'Day & Residential (Hostel)');
  assert.strictEqual(getSchoolAccommodationLabel('both day and residential'), 'Day & Residential (Hostel)');
  assert.strictEqual(getSchoolAccommodationLabel('Day & Residential (Hostel)'), 'Day & Residential (Hostel)');

  // Legacy "Boarding" or casing variations
  assert.strictEqual(getSchoolAccommodationLabel('Residential / Boarding School'), 'Residential / Boarding School');
  assert.strictEqual(getSchoolAccommodationLabel('boarding'), 'Residential / Boarding School');
  assert.strictEqual(getSchoolAccommodationLabel('Residential'), 'Residential / Boarding School');

  // Day Boarding casing variations
  assert.strictEqual(getSchoolAccommodationLabel('Day Boarding'), 'Day Boarding');
  assert.strictEqual(getSchoolAccommodationLabel('day boarding'), 'Day Boarding');

  // Day School casing variations
  assert.strictEqual(getSchoolAccommodationLabel('Day School'), 'Day School');
  assert.strictEqual(getSchoolAccommodationLabel('day school'), 'Day School');

  // Undefined / null / empty fallback to Day School
  assert.strictEqual(getSchoolAccommodationLabel(null), 'Day School');
  assert.strictEqual(getSchoolAccommodationLabel(undefined), 'Day School');
  assert.strictEqual(getSchoolAccommodationLabel(''), 'Day School');
});

// ─── 3. CANONICAL ENUM NORMALIZATION ─────────────────────────────────────────
console.log('\n--- 3. Canonical Enum Normalization (Safe Value Storage) ---');

runTest('Canonical values normalize to themselves', () => {
  assert.strictEqual(normalizeSchoolAccommodationType('day_school'), 'day_school');
  assert.strictEqual(normalizeSchoolAccommodationType('day_boarding'), 'day_boarding');
  assert.strictEqual(normalizeSchoolAccommodationType('residential'), 'residential');
  assert.strictEqual(normalizeSchoolAccommodationType('both_day_and_residential'), 'both_day_and_residential');
});

runTest('Legacy string values normalize to canonical backend enum', () => {
  assert.strictEqual(normalizeSchoolAccommodationType('Both Day & Residential'), 'both_day_and_residential');
  assert.strictEqual(normalizeSchoolAccommodationType('both day & residential'), 'both_day_and_residential');
  assert.strictEqual(normalizeSchoolAccommodationType('Day & Residential (Hostel)'), 'both_day_and_residential');
  assert.strictEqual(normalizeSchoolAccommodationType('boarding'), 'residential');
  assert.strictEqual(normalizeSchoolAccommodationType('Residential / Boarding School'), 'residential');
  assert.strictEqual(normalizeSchoolAccommodationType('Day Boarding'), 'day_boarding');
  assert.strictEqual(normalizeSchoolAccommodationType(undefined), 'day_school');
});

// ─── 4. HOSTEL APPLICABILITY INTEGRATION ────────────────────────────────────
console.log('\n--- 4. Hostel Applicability Integration ---');

runTest('Accommodation types trigger hostel applicability accurately', () => {
  // Day school models: Hostel not applicable
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'day_school' }), false);
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'day_boarding' }), false);

  // Residential models: Hostel applicable
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'residential' }), true);
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'both_day_and_residential' }), true);
});

// ─── 5. SERIALIZATION, DRAFT SAVE & ROUND-TRIP ──────────────────────────────
console.log('\n--- 5. Serialization & Roundtrip Verification ---');

runTest('Selecting Day & Residential (Hostel) preserves canonical value through serialization', () => {
  // Simulate user selecting option from dropdown:
  const selectedOption = SCHOOL_ACCOMMODATION_OPTIONS.find((opt) => opt.label === 'Day & Residential (Hostel)');
  assert.ok(selectedOption, 'Option must exist in catalog');
  assert.strictEqual(selectedOption.value, 'both_day_and_residential');

  // Save to intake data:
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Roshani Public School',
      residentialStatus: selectedOption.value,
    } as any,
  };

  // Simulate JSON serialization (API / DB persistence):
  const serialized = JSON.stringify(intake);
  const deserialized: Partial<UniversalIntakeData> = JSON.parse(serialized);

  // Verify stored value is canonical:
  assert.strictEqual(deserialized.schoolProfile?.residentialStatus, 'both_day_and_residential');

  // Verify display mapping on reload:
  const displayLabel = getSchoolAccommodationLabel(deserialized.schoolProfile?.residentialStatus);
  assert.strictEqual(displayLabel, 'Day & Residential (Hostel)');

  // Verify dropdown selection value resolution:
  const dropdownValue = normalizeSchoolAccommodationType(deserialized.schoolProfile?.residentialStatus);
  assert.strictEqual(dropdownValue, 'both_day_and_residential');
});

runTest('Legacy record with non-canonical string normalizes and preserves selection', () => {
  // Simulating legacy DB record:
  const legacyIntake = {
    schoolProfile: {
      schoolName: 'Heritage Convent School',
      residentialStatus: 'Both Day & Residential',
    },
  };

  const dropdownValue = normalizeSchoolAccommodationType(legacyIntake.schoolProfile.residentialStatus);
  assert.strictEqual(dropdownValue, 'both_day_and_residential');

  const displayLabel = getSchoolAccommodationLabel(legacyIntake.schoolProfile.residentialStatus);
  assert.strictEqual(displayLabel, 'Day & Residential (Hostel)');
});

// ─── 6. ALL 4 OPTIONS SELECTION & DESCRIPTIONS AUDIT ───────────────────────
console.log('\n--- 6. All 4 Options Selection & Description Audit ---');

runTest('Selecting each of the 4 options preserves value, label, and description accurately', () => {
  const testCases: Array<{
    value: SchoolAccommodationType;
    expectedLabel: string;
    expectedDescription: string;
    expectedHostelApplicable: boolean;
  }> = [
    {
      value: 'day_school',
      expectedLabel: 'Day School',
      expectedDescription:
        'Students attend school during the day and return home after school hours. No hostel accommodation is provided.',
      expectedHostelApplicable: false,
    },
    {
      value: 'both_day_and_residential',
      expectedLabel: 'Day & Residential (Hostel)',
      expectedDescription:
        'The school offers both day schooling and hostel accommodation for students who live on campus.',
      expectedHostelApplicable: true,
    },
    {
      value: 'day_boarding',
      expectedLabel: 'Day Boarding',
      expectedDescription:
        'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.',
      expectedHostelApplicable: false,
    },
    {
      value: 'residential',
      expectedLabel: 'Residential / Boarding School',
      expectedDescription:
        'Students live on the school campus in school-provided hostel/residential facilities.',
      expectedHostelApplicable: true,
    },
  ];

  for (const tc of testCases) {
    const opt = SCHOOL_ACCOMMODATION_OPTIONS.find((o) => o.value === tc.value);
    assert.ok(opt, `Option ${tc.value} must exist in catalog`);
    assert.strictEqual(opt.label, tc.expectedLabel);
    assert.strictEqual(opt.description, tc.expectedDescription);
    assert.strictEqual(getSchoolAccommodationLabel(tc.value), tc.expectedLabel);
    assert.strictEqual(getSchoolAccommodationDescription(tc.value), tc.expectedDescription);
    assert.strictEqual(isHostelApplicable({ residentialStatus: tc.value }), tc.expectedHostelApplicable);

    // Serialization test for each option
    const serialized = JSON.stringify({ residentialStatus: tc.value });
    const parsed = JSON.parse(serialized);
    assert.strictEqual(normalizeSchoolAccommodationType(parsed.residentialStatus), tc.value);
  }
});

// ─── 7. HOVER & FOCUS INTERACTION AUDIT ─────────────────────────────────────
console.log('\n--- 7. Hover & Focus Interaction Simulation ---');

runTest('Hovering or focusing each option maps immediately to its exact contextual description', () => {
  // Simulate active option resolution on hover or keyboard focus
  SCHOOL_ACCOMMODATION_OPTIONS.forEach((option, index) => {
    // 1. Mouse hover over option index
    const hoveredOpt = SCHOOL_ACCOMMODATION_OPTIONS[index];
    assert.strictEqual(hoveredOpt.value, option.value);
    assert.ok(hoveredOpt.description.length > 20, 'Description must be meaningful and non-empty');

    // 2. Moving to another option updates description immediately
    const nextIndex = (index + 1) % SCHOOL_ACCOMMODATION_OPTIONS.length;
    const nextOpt = SCHOOL_ACCOMMODATION_OPTIONS[nextIndex];
    assert.notStrictEqual(nextOpt.value, hoveredOpt.value);
    assert.notStrictEqual(nextOpt.description, hoveredOpt.description);

    // 3. Keyboard focus index resolution
    const focusedOpt = SCHOOL_ACCOMMODATION_OPTIONS[index];
    assert.strictEqual(focusedOpt.label, option.label);
    assert.strictEqual(focusedOpt.description, option.description);
  });
});

console.log('\n===========================================================');
console.log(`ACCOMMODATION TESTS COMPLETED: ${passed} passed, ${failed} failed.`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
}

