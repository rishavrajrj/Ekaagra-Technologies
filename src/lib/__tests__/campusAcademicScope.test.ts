/**
 * AUTOMATED TEST SUITE: CAMPUS-SPECIFIC ACADEMIC SCOPE ARCHITECTURE
 *
 * Verifies:
 * TEST 1: Independent academic scopes for Campus 1 (Pre-Primary) and Campus 2 (Primary).
 *         School summary: "Pre-Primary & Primary across 2 campuses", no false global class range.
 * TEST 2: Changing Campus 1 to Primary -> Campus 2 remains Primary, aggregate updates to Primary (consolidated).
 * TEST 3: Changing Campus 2 to Secondary -> Campus 1 remains unchanged, aggregate becomes Primary & Secondary.
 * TEST 4: Three campuses (Pre-Primary, Primary, Secondary) all appear accurately in breakdown & aggregate.
 * TEST 5: Consolidated display when all campuses share the same academic scope.
 * TEST 6: Persistence & JSON serialization round-trip preservation.
 * TEST 7: Legacy school with only school-level academic data: no fabricated campus assignments,
 *         information preserved without silent assignment.
 */

import {
  deriveCampusAcademicScope,
  deriveCampusClassRange,
  deriveSchoolAcademicSummary,
  normalizeCampusAcademicData,
  formatAcademicLevelHeadline,
} from '../academicStructureUtils';
import type { CampusBranchData, SchoolIdentityData, AcademicStructureData } from '../types';

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
console.log('TEST SUITE: Campus-Specific Academic Scope & Dynamic Aggregation');
console.log('===========================================================\n');

// ─── TEST 1: Independent Campus Academic Scopes ──────────────────────────────
console.log('--- TEST 1: Independent Campus Scopes (Pre-Primary + Primary) ---');

const campus1: CampusBranchData = {
  id: 'campus-main',
  name: 'Main Campus',
  address: '10 Civil Lines',
  city: 'Motihari',
  state: 'Bihar',
  pin: '845401',
  contactPhone: '9876543210',
  isMainCampus: true,
  academicLevels: ['Pre-Primary'],
  classesOffered: ['Playgroup', 'Nursery', 'LKG', 'UKG'],
  classRange: 'Playgroup to UKG',
  schoolType: 'Pre-Primary / Play School Wing',
  wingDescription: 'Early Childhood Development Wing',
};

const campus2: CampusBranchData = {
  id: 'campus-north',
  name: 'North Campus',
  address: '45 Station Road',
  city: 'Motihari',
  state: 'Bihar',
  pin: '845401',
  contactPhone: '9876543211',
  isMainCampus: false,
  academicLevels: ['Primary'],
  classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  classRange: 'Class 1 to 5',
  schoolType: 'Primary School (Classes 1–5)',
};

const summary1 = deriveSchoolAcademicSummary([campus1, campus2]);

assert(summary1.isMultiCampus === true, 'Correctly identifies multi-campus institution');
assert(summary1.totalCampuses === 2, 'Total campuses count equals 2');
assert(summary1.isConsolidated === false, 'isConsolidated is false when campuses have distinct scopes');
assert(summary1.headlineSummary === 'Pre-Primary & Primary', `Headline summary is "Pre-Primary & Primary" (got: "${summary1.headlineSummary}")`);
assert(summary1.subSummary === 'Across 2 campuses', `Sub-summary is "Across 2 campuses" (got: "${summary1.subSummary}")`);
assert(summary1.consolidatedClassRange === undefined, 'No false global class range (consolidatedClassRange is undefined)');
assert(summary1.campusBreakdowns.length === 2, 'Contains breakdowns for both campuses');
assert(summary1.campusBreakdowns[0].levelSummary === 'Pre-Primary', 'Campus 1 breakdown shows Pre-Primary');
assert(summary1.campusBreakdowns[0].classRange === 'Playgroup to UKG', 'Campus 1 breakdown shows Playgroup to UKG');
assert(summary1.campusBreakdowns[1].levelSummary === 'Primary', 'Campus 2 breakdown shows Primary');
assert(summary1.campusBreakdowns[1].classRange === 'Class 1 to 5', 'Campus 2 breakdown shows Class 1 to 5');

// ─── TEST 2: Change Campus 1 to Primary ──────────────────────────────────────
console.log('\n--- TEST 2: Change Campus 1 to Primary (Dynamic Update) ---');

const campus1UpdatedToPrimary: CampusBranchData = {
  ...campus1,
  academicLevels: ['Primary'],
  classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  classRange: 'Class 1 to 5',
  schoolType: 'Primary School (Classes 1–5)',
};

const summary2 = deriveSchoolAcademicSummary([campus1UpdatedToPrimary, campus2]);

assert(campus2.academicLevels?.[0] === 'Primary', 'Campus 2 remains unchanged (Primary)');
assert(summary2.isConsolidated === true, 'isConsolidated becomes true because both campuses now share Primary & Class 1 to 5');
assert(summary2.headlineSummary === 'Primary', `Headline summary updates to "Primary" (got: "${summary2.headlineSummary}")`);
assert(summary2.subSummary === 'Consolidated across all 2 campuses', `Sub-summary reflects consolidation (got: "${summary2.subSummary}")`);
assert(summary2.consolidatedClassRange === 'Class 1 to 5', `Consolidated class range is "Class 1 to 5" (got: "${summary2.consolidatedClassRange}")`);

// ─── TEST 3: Change Campus 2 to Secondary ────────────────────────────────────
console.log('\n--- TEST 3: Change Campus 2 to Secondary (Campus 1 unchanged) ---');

const campus2UpdatedToSecondary: CampusBranchData = {
  ...campus2,
  academicLevels: ['Secondary'],
  classesOffered: ['Class 9', 'Class 10'],
  classRange: 'Class 9 to 10',
  schoolType: 'Secondary School (Classes 9–10)',
};

// Campus 1 is still Primary from TEST 2
const summary3 = deriveSchoolAcademicSummary([campus1UpdatedToPrimary, campus2UpdatedToSecondary]);

assert(campus1UpdatedToPrimary.academicLevels?.[0] === 'Primary', 'Campus 1 remains unchanged (Primary)');
assert(summary3.isConsolidated === false, 'isConsolidated is false (Primary vs Secondary)');
assert(summary3.headlineSummary === 'Primary & Secondary', `Headline summary is "Primary & Secondary" (got: "${summary3.headlineSummary}")`);
assert(summary3.subSummary === 'Across 2 campuses', 'Sub-summary is "Across 2 campuses"');
assert(summary3.consolidatedClassRange === undefined, 'consolidatedClassRange is undefined (no false global range)');
assert(summary3.campusBreakdowns[0].levelSummary === 'Primary', 'Campus 1 breakdown shows Primary');
assert(summary3.campusBreakdowns[1].levelSummary === 'Secondary', 'Campus 2 breakdown shows Secondary');

// ─── TEST 4: Three Campuses (Pre-Primary, Primary, Secondary) ─────────────────
console.log('\n--- TEST 4: Three Campuses (Pre-Primary, Primary, Secondary) ---');

const campus3: CampusBranchData = {
  id: 'campus-south',
  name: 'South Senior Campus',
  address: '88 Bypass Road',
  city: 'Motihari',
  state: 'Bihar',
  pin: '845401',
  contactPhone: '9876543212',
  isMainCampus: false,
  academicLevels: ['Secondary'],
  classesOffered: ['Class 9', 'Class 10'],
  classRange: 'Class 9 to 10',
  schoolType: 'Secondary School (Classes 9–10)',
};

// 3 campuses: campus1 (Pre-Primary), campus2 (Primary), campus3 (Secondary)
const summary4 = deriveSchoolAcademicSummary([campus1, campus2, campus3]);

assert(summary4.totalCampuses === 3, 'Total campuses count equals 3');
assert(summary4.isConsolidated === false, 'isConsolidated is false');
assert(summary4.headlineSummary === 'Pre-Primary, Primary & Secondary', `Headline summary is "Pre-Primary, Primary & Secondary" (got: "${summary4.headlineSummary}")`);
assert(summary4.subSummary === 'Across 3 campuses', 'Sub-summary is "Across 3 campuses"');
assert(summary4.consolidatedClassRange === undefined, 'No false global range');
assert(summary4.campusBreakdowns.length === 3, 'Contains all 3 campus breakdowns');
assert(summary4.campusBreakdowns[0].levelSummary === 'Pre-Primary', 'Campus 1 shows Pre-Primary');
assert(summary4.campusBreakdowns[1].levelSummary === 'Primary', 'Campus 2 shows Primary');
assert(summary4.campusBreakdowns[2].levelSummary === 'Secondary', 'Campus 3 shows Secondary');

// ─── TEST 5: Consolidated Display When All Campuses Share Level ──────────────
console.log('\n--- TEST 5: Consolidated Display (Identical Scopes) ---');

const campusA: CampusBranchData = {
  id: 'c-1',
  name: 'East Campus',
  address: 'Street 1',
  city: 'Motihari',
  state: 'Bihar',
  pin: '845401',
  contactPhone: '9876543210',
  isMainCampus: true,
  academicLevels: ['Pre-Primary', 'Primary'],
  classesOffered: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  classRange: 'Nursery to Class 5',
};

const campusB: CampusBranchData = {
  id: 'c-2',
  name: 'West Campus',
  address: 'Street 2',
  city: 'Motihari',
  state: 'Bihar',
  pin: '845401',
  contactPhone: '9876543211',
  isMainCampus: false,
  academicLevels: ['Pre-Primary', 'Primary'],
  classesOffered: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  classRange: 'Nursery to Class 5',
};

const summary5 = deriveSchoolAcademicSummary([campusA, campusB]);

assert(summary5.isConsolidated === true, 'isConsolidated is true for identical scopes');
assert(summary5.headlineSummary === 'Pre-Primary & Primary', `Headline summary is "Pre-Primary & Primary" (got: "${summary5.headlineSummary}")`);
assert(summary5.consolidatedClassRange === 'Nursery to Class 5', `Consolidated class range is "Nursery to Class 5" (got: "${summary5.consolidatedClassRange}")`);
assert(summary5.subSummary === 'Consolidated across all 2 campuses', 'Sub-summary confirms all campuses share this scope');

// ─── TEST 6: Persistence & JSON Serialization Roundtrip ───────────────────────
console.log('\n--- TEST 6: Persistence & JSON Serialization Roundtrip ---');

const serialized = JSON.stringify([campus1, campus2]);
const deserialized: CampusBranchData[] = JSON.parse(serialized);

assert(deserialized.length === 2, 'Deserialized array has 2 campuses');
assert(deserialized[0].academicLevels?.[0] === 'Pre-Primary', 'Campus 1 academicLevels preserved');
assert(deserialized[0].classRange === 'Playgroup to UKG', 'Campus 1 classRange preserved');
assert(deserialized[0].schoolType === 'Pre-Primary / Play School Wing', 'Campus 1 schoolType preserved');
assert(deserialized[0].wingDescription === 'Early Childhood Development Wing', 'Campus 1 wingDescription preserved');
assert(deserialized[1].academicLevels?.[0] === 'Primary', 'Campus 2 academicLevels preserved');
assert(deserialized[1].classRange === 'Class 1 to 5', 'Campus 2 classRange preserved');

const reserializedSummary = deriveSchoolAcademicSummary(deserialized);
assert(reserializedSummary.headlineSummary === 'Pre-Primary & Primary', 'Derived summary identical after deserialization');
assert(reserializedSummary.consolidatedClassRange === undefined, 'No false global range after deserialization');

// ─── TEST 7: Legacy School-Wide Data (No Fabricated Campus Assignments) ───────
console.log('\n--- TEST 7: Legacy School Compatibility (No False Allocations) ---');

const legacyMultiCampuses: CampusBranchData[] = [
  {
    id: 'c-legacy-1',
    name: 'Main Campus',
    address: 'City Center',
    city: 'Motihari',
    state: 'Bihar',
    pin: '845401',
    contactPhone: '9876543210',
    isMainCampus: true,
    // No campus-specific academic data!
  },
  {
    id: 'c-legacy-2',
    name: 'Branch Campus',
    address: 'Subdivision Road',
    city: 'Motihari',
    state: 'Bihar',
    pin: '845401',
    contactPhone: '9876543211',
    isMainCampus: false,
    // No campus-specific academic data!
  },
];

const legacyProfile: SchoolIdentityData = {
  schoolName: 'Legacy Academy',
  schoolType: 'K-12 School',
  board: 'CBSE',
  mediumOfInstruction: ['English'],
  genderCategory: 'co_ed',
  officialEmail: 'info@legacy.edu',
  officialPhone: '9876543210',
  country: 'India',
  state: 'Bihar',
  city: 'Motihari',
  address: 'City Center',
  pin: '845401',
  schoolLevel: ['Pre-Primary', 'Primary', 'Middle', 'Secondary'],
};

const legacyStructure: AcademicStructureData = {
  currentAcademicSession: '2026-2027',
  classesOfferedFrom: 'Nursery',
  classesOfferedTo: 'Class 10',
  classes: [
    { id: 'c1', name: 'Nursery', sortOrder: 1, sections: ['A'] },
    { id: 'c2', name: 'Class 10', sortOrder: 2, sections: ['A'] },
  ],
};

// 1. Normalization must NOT invent campus assignments for multi-campus legacy school!
const normalizedCampuses = normalizeCampusAcademicData(legacyMultiCampuses, legacyProfile, legacyStructure);

assert(
  normalizedCampuses[0].academicLevels?.length === 0,
  'Does NOT fabricate academicLevels for Campus 1 in multi-campus legacy school'
);
assert(
  normalizedCampuses[1].academicLevels?.length === 0,
  'Does NOT fabricate academicLevels for Campus 2 in multi-campus legacy school'
);

// 2. Summary must clearly mark legacy data as unspecified/unallocated
const legacySummary = deriveSchoolAcademicSummary(normalizedCampuses, legacyStructure, legacyProfile);

assert(legacySummary.isLegacyUnspecified === true, 'isLegacyUnspecified is true');
assert(legacySummary.consolidatedClassRange === undefined, 'Never displays a fabricated consolidated range');
assert(
  legacySummary.headlineSummary === 'Academic Scope Pending Allocation',
  `Headline reflects pending allocation (got: "${legacySummary.headlineSummary}")`
);
assert(
  Boolean(legacySummary.legacySummaryText?.includes('Nursery to Class 10')),
  `Legacy summary text preserves school-wide range (got: "${legacySummary.legacySummaryText}")`
);
assert(
  legacySummary.campusBreakdowns[0].levelSummary === 'Scope Unspecified',
  'Campus 1 breakdown marked as Scope Unspecified'
);
assert(
  legacySummary.campusBreakdowns[1].levelSummary === 'Scope Unspecified',
  'Campus 2 breakdown marked as Scope Unspecified'
);

// 3. Single campus legacy school: safe to normalize into Main Campus
const singleLegacyCampus: CampusBranchData[] = [
  {
    id: 'c-single',
    name: 'Single Main Campus',
    address: 'City Center',
    city: 'Motihari',
    state: 'Bihar',
    pin: '845401',
    contactPhone: '9876543210',
    isMainCampus: true,
  },
];

const normalizedSingle = normalizeCampusAcademicData(singleLegacyCampus, legacyProfile, legacyStructure);
assert(
  normalizedSingle[0].academicLevels?.length === 4,
  'Single-campus safely inherits legacy levels into Main Campus'
);
assert(
  normalizedSingle[0].classRange === 'Nursery to Class 10',
  'Single-campus safely inherits class range'
);

const singleSummary = deriveSchoolAcademicSummary(normalizedSingle);
assert(singleSummary.isConsolidated === true, 'Single campus is consolidated');
assert(singleSummary.consolidatedClassRange === 'Nursery to Class 10', 'Single campus shows class range');

// ─── TEST 8: Helper Function formatAcademicLevelHeadline ─────────────────────
console.log('\n--- TEST 8: formatAcademicLevelHeadline Grammar ---');

assert(formatAcademicLevelHeadline(['Pre-Primary']) === 'Pre-Primary', 'Single: "Pre-Primary"');
assert(formatAcademicLevelHeadline(['Pre-Primary', 'Primary']) === 'Pre-Primary & Primary', 'Double: "Pre-Primary & Primary"');
assert(
  formatAcademicLevelHeadline(['Pre-Primary', 'Primary', 'Secondary']) === 'Pre-Primary, Primary & Secondary',
  'Triple: "Pre-Primary, Primary & Secondary"'
);
assert(
  formatAcademicLevelHeadline(['Pre-Primary', 'Primary', 'Middle', 'Secondary']) === 'Pre-Primary, Primary, Middle & Secondary',
  'Quad: "Pre-Primary, Primary, Middle & Secondary"'
);

// ─── FINAL SUMMARY ───────────────────────────────────────────────────────────
console.log('\n===========================================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED:      ${passed}`);
console.log(`FAILED:      ${failed}`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
}
