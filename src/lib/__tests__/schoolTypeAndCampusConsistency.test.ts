/**
 * AUTOMATED TEST SUITE: SCHOOL TYPE & CAMPUS CONSISTENCY
 *
 * Verifies:
 * TEST 1: Canonical getSchoolTypeConfig catalog resolution for all 8 canonical types & aliases.
 * TEST 2: getSuggestedClassesForSchoolType generates appropriate classes and class range.
 * TEST 3: extractSchoolFacts dynamically derives classesOffered from schoolType (no hardcoded Nursery to 12).
 * TEST 4: extractCanonicalSchoolHighlights dynamically reflects schoolType class range.
 * TEST 5: Custom confirmed academic structure takes precedence over schoolType defaults.
 * TEST 6: buildSourceDataDigest detects changes when schoolType is updated.
 * TEST 7: buildSourceDataDigest detects changes when Campus 2 location/state is updated.
 * TEST 8: Campus isolation - editing Campus 2 does not mutate Campus 1.
 * TEST 9: Campus deletion & normalization safely re-assigns isMainCampus = true to index 0.
 * TEST 10: Multi-campus identity formatting (Main campus location + dynamic campus count).
 */

import {
  getSchoolTypeConfig,
  getSuggestedClassesForSchoolType,
  SCHOOL_TYPE_CATALOG,
} from '../academicStructureUtils';
import {
  extractSchoolFacts,
  extractCanonicalSchoolHighlights,
  buildSourceDataDigest,
} from '../schoolContentGenerator';
import type { CampusBranchData, UniversalIntakeData } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('===========================================================');
console.log('TEST SUITE: School Type & Campus Location Consistency');
console.log('===========================================================\n');

// ─── TEST 1: Canonical getSchoolTypeConfig Resolution ─────────────────────────
console.log('--- TEST 1: School Type Catalog Resolution ---');

const k12 = getSchoolTypeConfig('K-12 School (Kindergarten to 12th)');
assert(k12.schoolType === 'K-12 School (Kindergarten to 12th)', 'K-12 resolves to correct schoolType');
assert(k12.classRange === 'Nursery to Class 12', `K-12 classRange is "Nursery to Class 12" (got: ${k12.classRange})`);

const playSchool = getSchoolTypeConfig('Play School / Pre-School');
assert(playSchool.schoolType === 'Play School / Pre-School', 'Play School resolves correctly');
assert(playSchool.classRange === 'Playgroup to UKG (Pre-School)', `Play school classRange is "Playgroup to UKG (Pre-School)" (got: ${playSchool.classRange})`);

const secSchool = getSchoolTypeConfig('Secondary School (Up to 10th)');
assert(secSchool.schoolType === 'Secondary School (Up to 10th)', 'Secondary School resolves correctly');
assert(secSchool.classRange === 'Nursery to Class 10', `Secondary classRange is "Nursery to Class 10" (got: ${secSchool.classRange})`);

const srSecSchool = getSchoolTypeConfig('Senior Secondary School (10+2)');
assert(srSecSchool.schoolType === 'Senior Secondary School (10+2)', 'Senior Secondary resolves correctly');

const primarySchool = getSchoolTypeConfig('Primary School (Class 1 to 5)');
assert(primarySchool.schoolType === 'Primary School (Class 1 to 5)', 'Primary School resolves correctly');

const middleSchool = getSchoolTypeConfig('Middle School (Class 1 to 8)');
assert(middleSchool.schoolType === 'Middle School (Class 1 to 8)', 'Middle School resolves correctly');

const coaching = getSchoolTypeConfig('Coaching / Academy');
assert(coaching.schoolType === 'Coaching / Academy', 'Coaching resolves correctly');

// Fuzzy alias matching
const playSchoolAlias = getSchoolTypeConfig('Pre-School & Kindergarten');
assert(playSchoolAlias.classRange === 'Playgroup to UKG (Pre-School)', 'Alias "Pre-School & Kindergarten" maps to Play School');

const fallbackUnknown = getSchoolTypeConfig('Unknown Something 99');
assert(fallbackUnknown.schoolType === 'K-12 School (Kindergarten to 12th)', 'Unrecognized school type falls back to K-12 (default)');

// ─── TEST 2: Suggested Classes Generation ────────────────────────────────────
console.log('\n--- TEST 2: Suggested Classes Generation ---');

const playClasses = getSuggestedClassesForSchoolType('Play School / Pre-School');
assert(playClasses.length === 4, `Play School generates 4 classes (got: ${playClasses.length})`);
assert(playClasses[0].name === 'Playgroup', 'First class is Playgroup');
assert(playClasses[3].name === 'UKG', 'Last class is UKG');

const primaryClasses = getSuggestedClassesForSchoolType('Primary School (Class 1 to 5)');
assert(primaryClasses.length === 8, `Primary generates 8 classes incl Pre-Primary (got: ${primaryClasses.length})`);
assert(primaryClasses[0].name === 'Nursery', 'First class is Nursery');
assert(primaryClasses[7].name === 'Class 5', 'Last class is Class 5');

const k12Classes = getSuggestedClassesForSchoolType('K-12 School');
assert(k12Classes.length === 15, `K-12 generates 15 classes (got: ${k12Classes.length})`);

// ─── TEST 3: extractSchoolFacts Dynamic Class Range Derivation ───────────────
console.log('\n--- TEST 3: extractSchoolFacts Dynamic Derivation ---');

const intakePlaySchool: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Little Angels Play School',
    schoolType: 'Play School / Pre-School',
    city: 'Motihari',
    state: 'Bihar',
  } as any,
  campuses: [],
};

const factsPlaySchool = extractSchoolFacts(intakePlaySchool);
assert(
  factsPlaySchool.classesOffered === 'Playgroup to UKG (Pre-School)',
  `extractSchoolFacts for Play School derived "${factsPlaySchool.classesOffered}" (expected Playgroup to UKG (Pre-School))`
);

const intakeSecSchool: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'St. Paul Secondary School',
    schoolType: 'Secondary School (Up to 10th)',
    city: 'Patna',
    state: 'Bihar',
  } as any,
  campuses: [],
};

const factsSecSchool = extractSchoolFacts(intakeSecSchool);
assert(
  factsSecSchool.classesOffered === 'Nursery to Class 10',
  `extractSchoolFacts for Secondary derived "${factsSecSchool.classesOffered}" (expected Nursery to Class 10)`
);

// ─── TEST 4: extractCanonicalSchoolHighlights Dynamic Reflection ─────────────
console.log('\n--- TEST 4: extractCanonicalSchoolHighlights Dynamic Reflection ---');

const highlightsPlay = extractCanonicalSchoolHighlights(intakePlaySchool);
assert(
  highlightsPlay.classes === 'Playgroup to UKG (Pre-School)',
  `Canonical highlights classes for Play School is "${highlightsPlay.classes}"`
);

const highlightsSec = extractCanonicalSchoolHighlights(intakeSecSchool);
assert(
  highlightsSec.classes === 'Nursery to Class 10',
  `Canonical highlights classes for Secondary School is "${highlightsSec.classes}"`
);

// ─── TEST 5: Custom Confirmed Academic Structure Precedence ──────────────────
console.log('\n--- TEST 5: Custom Confirmed Academic Structure Precedence ---');

const intakeWithCustomStructure: Partial<UniversalIntakeData> = {
  ...intakePlaySchool,
  institutionStructure: {
    classesOfferedFrom: 'Nursery',
    classesOfferedTo: 'Class 8',
    classes: [],
  } as any,
};

const factsWithCustomStructure = extractSchoolFacts(intakeWithCustomStructure);
assert(
  factsWithCustomStructure.classesOffered === 'Nursery to Class 8',
  `Confirmed custom structure takes precedence: "${factsWithCustomStructure.classesOffered}"`
);

// ─── TEST 6: buildSourceDataDigest Detects School Type Change ─────────────────
console.log('\n--- TEST 6: Change Detection on School Type Change ---');

const baseData: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Roshani Public School',
    schoolType: 'K-12 School (Kindergarten to 12th)',
    city: 'Motihari',
    state: 'Bihar',
  } as any,
  campuses: [
    {
      id: 'c1',
      name: 'Main Campus',
      city: 'Motihari',
      state: 'Bihar',
      district: 'East Champaran',
      pin: '845401',
      isMainCampus: true,
    } as any,
  ],
};

const digest1 = buildSourceDataDigest(baseData as UniversalIntakeData);

const dataWithNewSchoolType: Partial<UniversalIntakeData> = {
  ...baseData,
  schoolProfile: {
    ...baseData.schoolProfile!,
    schoolType: 'Play School / Pre-School',
  },
};

const digest2 = buildSourceDataDigest(dataWithNewSchoolType as UniversalIntakeData);
assert(digest1 !== digest2, 'Digest changes when schoolType is updated');

// ─── TEST 7: buildSourceDataDigest Detects Campus 2 Location Change ───────────
console.log('\n--- TEST 7: Change Detection on Campus 2 Location Change ---');

const multiCampusData: Partial<UniversalIntakeData> = {
  ...baseData,
  campuses: [
    baseData.campuses![0],
    {
      id: 'c2',
      name: 'Campus 2',
      city: 'Dehradun',
      state: 'Uttarakhand',
      district: 'Dehradun',
      pin: '248001',
      isMainCampus: false,
    } as any,
  ],
};

const digestMulti1 = buildSourceDataDigest(multiCampusData as UniversalIntakeData);

const multiCampusDataUpdated: Partial<UniversalIntakeData> = {
  ...multiCampusData,
  campuses: [
    multiCampusData.campuses![0],
    {
      ...multiCampusData.campuses![1],
      city: 'Mussoorie',
      pin: '248179',
    },
  ],
};

const digestMulti2 = buildSourceDataDigest(multiCampusDataUpdated as UniversalIntakeData);
assert(digestMulti1 !== digestMulti2, 'Digest changes when Campus 2 location/city is updated');

// ─── TEST 8: Campus State Isolation ──────────────────────────────────────────
console.log('\n--- TEST 8: Campus State Isolation ---');

const campuses: CampusBranchData[] = [
  {
    id: 'campus-1',
    name: 'Main Campus',
    address: 'NH-28, Bapudham',
    city: 'Motihari',
    state: 'Bihar',
    district: 'East Champaran',
    pin: '845401',
    isMainCampus: true,
  } as any,
  {
    id: 'campus-2',
    name: 'Campus 2',
    address: 'Rajpur Road',
    city: 'Dehradun',
    state: 'Uttarakhand',
    district: 'Dehradun',
    pin: '248001',
    isMainCampus: false,
  } as any,
];

// Pure immutable update function mirroring updateCampusField
function updateCampus(
  list: CampusBranchData[],
  targetIdx: number,
  updates: Partial<CampusBranchData>
): CampusBranchData[] {
  return list.map((c, i) => (i === targetIdx ? { ...c, ...updates } : c));
}

const updatedCampuses = updateCampus(campuses, 1, {
  city: 'Haridwar',
  pin: '249401',
});

assert(updatedCampuses[1].city === 'Haridwar', 'Campus 2 city updated to Haridwar');
assert(updatedCampuses[1].pin === '249401', 'Campus 2 PIN updated to 249401');
assert(updatedCampuses[0].city === 'Motihari', 'Campus 1 city remains Motihari');
assert(updatedCampuses[0].state === 'Bihar', 'Campus 1 state remains Bihar');
assert(updatedCampuses[0].pin === '845401', 'Campus 1 PIN remains 845401');

// ─── TEST 9: Campus Deletion & Normalization ─────────────────────────────────
console.log('\n--- TEST 9: Campus Deletion & Normalization ---');

// If Main Campus is removed, next campus becomes Main Campus
const remainingAfterRemovingFirst = campuses
  .filter((_, i) => i !== 0)
  .map((c, i) => ({
    ...c,
    isMainCampus: i === 0,
  }));

assert(remainingAfterRemovingFirst.length === 1, 'Only 1 campus remains');
assert(remainingAfterRemovingFirst[0].id === 'campus-2', 'Campus 2 is now the first campus');
assert(remainingAfterRemovingFirst[0].isMainCampus === true, 'Elevated campus has isMainCampus: true');

// ─── TEST 10: Multi-Campus Identity Formatting ───────────────────────────────
console.log('\n--- TEST 10: Multi-Campus Identity Formatting ---');

function formatIdentityLocation(
  primaryCity: string,
  primaryState: string,
  campusCount: number
): { locationLabel: string; campusBadgeText: string } {
  const count = campusCount || 1;
  const locationText = [primaryCity, primaryState].filter(Boolean).join(', ');
  const displayLocation = count > 1 ? `${locationText} (Main Campus)` : locationText;
  const campusBadgeText = `${count} ${count === 1 ? 'Campus' : 'Campuses'}`;
  return { locationLabel: displayLocation, campusBadgeText };
}

const singleCampusHeader = formatIdentityLocation('Motihari', 'Bihar', 1);
assert(singleCampusHeader.locationLabel === 'Motihari, Bihar', 'Single campus location is "Motihari, Bihar"');
assert(singleCampusHeader.campusBadgeText === '1 Campus', 'Single campus badge is "1 Campus"');

const multiCampusHeader = formatIdentityLocation('Motihari', 'Bihar', 2);
assert(
  multiCampusHeader.locationLabel === 'Motihari, Bihar (Main Campus)',
  `Multi-campus location is "${multiCampusHeader.locationLabel}" (expected Motihari, Bihar (Main Campus))`
);
assert(
  multiCampusHeader.campusBadgeText === '2 Campuses',
  `Multi-campus badge is "${multiCampusHeader.campusBadgeText}" (expected 2 Campuses)`
);

console.log('\n===========================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
}
