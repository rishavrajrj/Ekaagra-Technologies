/**
 * ==============================================================================
 * CAMPUS ACADEMIC SCOPE CONTROL — DOMAIN TEST SUITE
 * File: src/lib/__tests__/campusAcademicScopeControl.test.ts
 * ==============================================================================
 *
 * 10 scenarios validating that campus academic scope is the canonical source of truth
 * for all class-dependent academic features:
 * TEST 1: Single campus scoping permits configured classes and rejects others.
 * TEST 2: Curriculum isolation filters class curricula to campus scope.
 * TEST 3: Admission isolation restricts to campus scope.
 * TEST 4: Multi-campus isolation ensures zero cross-campus class leakage.
 * TEST 5: Remove class preserves data but filters from active scope.
 * TEST 6: Re-adding a class restores it in scope without duplicates.
 * TEST 7: Server-side validation rejects submissions with unselected classes.
 * TEST 8: Fee inheritance resolves class override over common default.
 * TEST 9: Website publication safety: scope filters protect published data.
 * TEST 10: Backward compatibility: legacy school without explicit campus classesOffered.
 */

import {
  getCampusAcademicScope,
  validateClassInCampusScope,
  validateCampusAcademicPayload,
  filterFeesByCampusScope,
  filterCurriculumByCampusScope,
  filterAdmissionsByCampusScope,
  resolveEffectiveFeeForClass,
} from '../campusAcademicScopeService';

import type {
  UniversalIntakeData,
  CampusBranchData,
  FeesConfigurationData,
  CurriculumData,
  AdmissionsData,
} from '../types';

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

function makeCampus(overrides: Partial<CampusBranchData> = {}): CampusBranchData {
  return {
    id: 'campus-main',
    name: 'Main Campus',
    isMainCampus: true,
    classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    academicLevels: ['Primary'],
    classRange: 'Class 1 to Class 5',
    ...overrides,
  } as CampusBranchData;
}

function makeMultiCampusIntake(): Partial<UniversalIntakeData> {
  return {
    campuses: [
      makeCampus({
        id: 'campus-a',
        name: 'Junior Wing',
        isMainCampus: true,
        classesOffered: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
        academicLevels: ['Pre-Primary', 'Primary'],
        classRange: 'Nursery to Class 5',
      }),
      makeCampus({
        id: 'campus-b',
        name: 'Senior Wing',
        isMainCampus: false,
        classesOffered: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
        academicLevels: ['Middle', 'Secondary', 'Senior Secondary'],
        classRange: 'Class 6 to Class 12',
      }),
    ],
  };
}

console.log('===========================================================');
console.log('TEST SUITE: Campus Academic Scope Control');
console.log('===========================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Single Campus Scoping
// -----------------------------------------------------------------------------
console.log('TEST 1: Single campus scoping permits configured classes and rejects others');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
        academicLevels: ['Primary', 'Middle', 'Secondary'],
      }),
    ],
  };

  const scope = getCampusAcademicScope('campus-main', intake);

  assert(scope.hasClasses === true, 'Scope reports hasClasses=true');
  assert(scope.classNames.includes('Class 1'), 'Scope includes Class 1');
  assert(scope.classNames.includes('Class 10'), 'Scope includes Class 10');
  assert(!scope.classNames.includes('Class 11'), 'Scope excludes unselected Class 11');
  assert(!scope.classNames.includes('Class 12'), 'Scope excludes unselected Class 12');

  assert(validateClassInCampusScope('campus-main', 'Class 5', intake).valid === true, 'Class 5 is valid in campus scope');
  assert(validateClassInCampusScope('campus-main', 'Class 11', intake).valid === false, 'Class 11 is rejected as out of scope');
  assert(validateClassInCampusScope('campus-main', 'Class 12', intake).valid === false, 'Class 12 is rejected as out of scope');
}

// -----------------------------------------------------------------------------
// TEST 2: Curriculum Isolation
// -----------------------------------------------------------------------------
console.log('\nTEST 2: Curriculum isolation filters class curricula to campus scope');
{
  const intake = makeMultiCampusIntake();
  const scopeA = getCampusAcademicScope('campus-a', intake);

  const curriculum: CurriculumData = {
    overview: { board: 'CBSE' },
    subjects: [],
    classCurricula: [
      { className: 'LKG', subjects: [] },
      { className: 'Class 3', subjects: [] },
      { className: 'Class 8', subjects: [] },     // Not in Campus A
      { className: 'Class 12', subjects: [] },    // Not in Campus A
    ],
  };

  const filtered = filterCurriculumByCampusScope(curriculum, scopeA);

  assert(filtered.classCurricula.length === 2, 'Curriculum filtered to exactly 2 active classes');
  const classNames = filtered.classCurricula.map((c) => c.className);
  assert(classNames.includes('LKG') && classNames.includes('Class 3'), 'Retains LKG and Class 3');
  assert(!classNames.includes('Class 8'), 'Removes Class 8 from Campus A');
  assert(!classNames.includes('Class 12'), 'Removes Class 12 from Campus A');
}

// -----------------------------------------------------------------------------
// TEST 3: Admission Isolation
// -----------------------------------------------------------------------------
console.log('\nTEST 3: Admission isolation restricts to campus scope');
{
  const intake = makeMultiCampusIntake();
  const scopeB = getCampusAcademicScope('campus-b', intake);

  const admissions: AdmissionsData = {
    classesOpenForAdmission: ['Class 6', 'Class 9', 'LKG', 'Nursery'],
    classAvailability: [
      { className: 'Class 6', status: 'open', totalSeats: 40, seatsAvailable: 15 },
      { className: 'LKG', status: 'open', totalSeats: 30, seatsAvailable: 10 },
      { className: 'Class 10', status: 'open', totalSeats: 40, seatsAvailable: 20 },
    ],
  } as AdmissionsData;

  const filtered = filterAdmissionsByCampusScope(admissions, scopeB);

  assert(filtered.classesOpenForAdmission?.length === 2, 'Classes open for admission filtered to 2');
  assert(filtered.classesOpenForAdmission?.includes('Class 6') ?? false, 'Retains Class 6');
  assert(filtered.classesOpenForAdmission?.includes('Class 9') ?? false, 'Retains Class 9');
  assert(!filtered.classesOpenForAdmission?.includes('LKG'), 'Filters out LKG from senior campus');
  assert(filtered.classAvailability?.length === 2, 'Class availability filtered to 2');
  assert(!filtered.classAvailability?.some((a) => a.className === 'LKG'), 'Class availability has no LKG');
}

// -----------------------------------------------------------------------------
// TEST 4: Multi-Campus Isolation
// -----------------------------------------------------------------------------
console.log('\nTEST 4: Multi-campus isolation ensures zero cross-campus class leakage');
{
  const intake = makeMultiCampusIntake();
  const scopeA = getCampusAcademicScope('campus-a', intake);
  const scopeB = getCampusAcademicScope('campus-b', intake);

  let hasLeakage = false;
  for (const cls of scopeA.classNames) {
    if (scopeB.classNames.includes(cls)) hasLeakage = true;
  }
  assert(!hasLeakage, 'Zero classes from Campus A leak into Campus B');

  let hasReverseLeakage = false;
  for (const cls of scopeB.classNames) {
    if (scopeA.classNames.includes(cls)) hasReverseLeakage = true;
  }
  assert(!hasReverseLeakage, 'Zero classes from Campus B leak into Campus A');

  assert(validateClassInCampusScope('campus-b', 'Nursery', intake).valid === false, 'Nursery rejected at Senior Wing');
  assert(validateClassInCampusScope('campus-a', 'Class 12', intake).valid === false, 'Class 12 rejected at Junior Wing');
  assert(validateClassInCampusScope('campus-a', 'Nursery', intake).valid === true, 'Nursery allowed at Junior Wing');
  assert(validateClassInCampusScope('campus-b', 'Class 12', intake).valid === true, 'Class 12 allowed at Senior Wing');
}

// -----------------------------------------------------------------------------
// TEST 5: Remove Class Preservation
// -----------------------------------------------------------------------------
console.log('\nTEST 5: Remove class preserves data but filters from active scope');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4'], // Class 5 removed
      }),
    ],
  };

  const scope = getCampusAcademicScope('campus-main', intake);

  assert(!scope.classNames.includes('Class 5'), 'Class 5 removed from active scope');
  assert(scope.classNames.length === 4, 'Scope has exactly 4 active classes');

  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'f1', name: 'Tuition Fee', category: 'tuition', amount: 5000, frequency: 'monthly', applicableClasses: ['Class 1', 'Class 2', 'Class 5'], isRefundable: false, studentType: 'both' },
    ],
    classFeeStructures: [
      { className: 'Class 5', feeType: 'tuition', amount: 6000 },
      { className: 'Class 3', feeType: 'tuition', amount: 5500 },
    ],
    optionalServices: [],
  } as FeesConfigurationData;

  const filtered = filterFeesByCampusScope(fees, scope);

  assert(Array.isArray(filtered.commonFees[0].applicableClasses), 'Common fee applicableClasses is array');
  const appClasses = filtered.commonFees[0].applicableClasses as string[];
  assert(!appClasses.includes('Class 5'), 'Class 5 stripped from common fee applicableClasses');
  assert(filtered.classFeeStructures.length === 1, 'Class 5 override filtered out');
  assert(filtered.classFeeStructures[0].className === 'Class 3', 'Class 3 override retained');
}

// -----------------------------------------------------------------------------
// TEST 6: Re-Add Class Idempotency
// -----------------------------------------------------------------------------
console.log('\nTEST 6: Re-adding a class restores it in scope without duplicates');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 5'], // Duplicate
      }),
    ],
  };

  const scope = getCampusAcademicScope('campus-main', intake);

  assert(scope.classNames.filter((c) => c === 'Class 5').length === 1, 'Duplicates deduplicated');
  assert(scope.classNames.length === 5, 'Exact 5 unique classes');
  assert(validateClassInCampusScope('campus-main', 'Class 5', intake).valid === true, 'Class 5 valid again');
}

// -----------------------------------------------------------------------------
// TEST 7: Server-Side Scope Validation
// -----------------------------------------------------------------------------
console.log('\nTEST 7: Server-side validation rejects submissions with unselected classes');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        classesOffered: ['Class 1', 'Class 2', 'Class 3'],
      }),
    ],
    feesConfiguration: {
      commonFees: [
        { id: 'f1', name: 'Tuition', category: 'tuition', amount: 4000, frequency: 'monthly', applicableClasses: ['Class 1', 'Class 7'], isRefundable: false, studentType: 'both' },
      ],
      classFeeStructures: [
        { className: 'Class 10', feeType: 'tuition', amount: 8000 },
      ],
      optionalServices: [
        { id: 'opt1', name: 'Transport', applicableClasses: ['Class 1', 'Class 12'], isProvided: true },
      ],
    } as FeesConfigurationData,
    curriculum: {
      overview: { board: 'CBSE' },
      subjects: [],
      classCurricula: [
        { className: 'Class 9', subjects: [] },
      ],
    },
    admissions: {
      classesOpenForAdmission: ['Class 1', 'Class 11'],
      classAvailability: [
        { className: 'Class 2', status: 'open', totalSeats: 40, seatsAvailable: 15 },
        { className: 'Class 8', status: 'open', totalSeats: 40, seatsAvailable: 15 },
      ],
    } as AdmissionsData,
  };

  const result = validateCampusAcademicPayload('campus-main', intake);

  assert(result.isValid === false, 'Validator flags invalid payload');
  assert(result.errors.length >= 5, `Found ${result.errors.length} scope errors (expected >= 5)`);
  assert(result.errors.some((e) => e.includes('Class 7')), 'Detects out-of-scope Class 7 in fees');
  assert(result.errors.some((e) => e.includes('Class 10')), 'Detects out-of-scope Class 10 in fee override');
  assert(result.errors.some((e) => e.includes('Class 12')), 'Detects out-of-scope Class 12 in optional service');
  assert(result.errors.some((e) => e.includes('Class 9')), 'Detects out-of-scope Class 9 in curriculum');
  assert(result.errors.some((e) => e.includes('Class 11')), 'Detects out-of-scope Class 11 in admissions');
  assert(result.errors.some((e) => e.includes('Class 8')), 'Detects out-of-scope Class 8 in class availability');
}

// -----------------------------------------------------------------------------
// TEST 8: Fee Inheritance Engine
// -----------------------------------------------------------------------------
console.log('\nTEST 8: Fee inheritance resolves class override over common default');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        classesOffered: ['Class 1', 'Class 2', 'Class 3'],
      }),
    ],
  };

  const scope = getCampusAcademicScope('campus-main', intake);

  const fees: FeesConfigurationData = {
    commonFees: [
      {
        id: 'f1',
        name: 'Tuition Fee',
        category: 'tuition',
        amount: 4000,
        frequency: 'monthly',
        applicableClasses: ['Class 1', 'Class 2', 'Class 3'],
        isRefundable: false,
        studentType: 'both',
      },
    ],
    classFeeStructures: [
      { className: 'Class 3', feeType: 'tuition', amount: 6000 },
    ],
    optionalServices: [],
  } as FeesConfigurationData;

  const class1Fee = resolveEffectiveFeeForClass('Class 1', 'tuition', fees, scope);
  assert(class1Fee.amount === 4000, 'Class 1 amount falls back to common default 4000');
  assert(class1Fee.source === 'common_default', 'Class 1 source is common_default');
  assert(class1Fee.isConfigured === true, 'Class 1 is configured');

  const class3Fee = resolveEffectiveFeeForClass('Class 3', 'tuition', fees, scope);
  assert(class3Fee.amount === 6000, 'Class 3 amount resolves to override 6000');
  assert(class3Fee.source === 'class_override', 'Class 3 source is class_override');
  assert(class3Fee.isConfigured === true, 'Class 3 is configured');

  const class10Fee = resolveEffectiveFeeForClass('Class 10', 'tuition', fees, scope);
  assert(class10Fee.amount === 0, 'Class 10 out of scope returns 0');
  assert(class10Fee.isConfigured === false, 'Class 10 is not configured');
}

// -----------------------------------------------------------------------------
// TEST 9: Website Publication Safety
// -----------------------------------------------------------------------------
console.log('\nTEST 9: Website publication safety: scope filters protect published data');
{
  const intake = makeMultiCampusIntake();
  const scopeA = getCampusAcademicScope('campus-a', intake);
  const scopeB = getCampusAcademicScope('campus-b', intake);

  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'f1', name: 'Tuition', category: 'tuition', amount: 4000, frequency: 'monthly', applicableClasses: ['Nursery', 'LKG', 'Class 6', 'Class 12'], isRefundable: false, studentType: 'both' },
    ],
    classFeeStructures: [],
    optionalServices: [],
  } as FeesConfigurationData;

  const filteredA = filterFeesByCampusScope(fees, scopeA);
  const filteredB = filterFeesByCampusScope(fees, scopeB);

  const classesA = filteredA.commonFees[0].applicableClasses as string[];
  const classesB = filteredB.commonFees[0].applicableClasses as string[];

  assert(classesA.length === 2 && classesA.includes('Nursery') && classesA.includes('LKG'), 'Campus A publication data strictly Nursery & LKG');
  assert(classesB.length === 2 && classesB.includes('Class 6') && classesB.includes('Class 12'), 'Campus B publication data strictly Class 6 & Class 12');
  assert(!classesA.includes('Class 12'), 'No secondary classes leak into Campus A website data');
  assert(!classesB.includes('Nursery'), 'No pre-primary classes leak into Campus B website data');
}

// -----------------------------------------------------------------------------
// TEST 10: Backward Compatibility
// -----------------------------------------------------------------------------
console.log('\nTEST 10: Backward compatibility: legacy school without explicit campus classesOffered');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      {
        id: 'campus-legacy',
        name: 'Legacy Campus',
        isMainCampus: true,
      } as CampusBranchData,
    ],
    institutionStructure: {
      classes: [
        { id: 'c1', name: 'Class 1', code: 'C1', isActive: true, sortOrder: 1, level: 'Primary' },
        { id: 'c2', name: 'Class 2', code: 'C2', isActive: true, sortOrder: 2, level: 'Primary' },
        { id: 'c3', name: 'Class 3', code: 'C3', isActive: true, sortOrder: 3, level: 'Primary' },
      ],
    } as any,
  };

  const scope = getCampusAcademicScope('campus-legacy', intake);

  assert(scope.hasClasses === true, 'Legacy scope resolves hasClasses=true');
  assert(scope.classNames.length === 3, 'Legacy scope inherits 3 classes from institutionStructure');
  assert(scope.classNames.includes('Class 1'), 'Legacy scope has Class 1');
  assert(scope.classNames.includes('Class 2'), 'Legacy scope has Class 2');
  assert(scope.classNames.includes('Class 3'), 'Legacy scope has Class 3');
}

// -----------------------------------------------------------------------------
// TEST 11: Fee Structure Matrix Integration & Class Scope Protection
// -----------------------------------------------------------------------------
console.log('\nTEST 11: Fee Structure Matrix Integration & Class Scope Protection');
{
  // Scenario A: Campus with 5 classes (Class 1 to Class 5)
  const intake5Classes: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        id: 'campus-five',
        classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
        academicLevels: ['Primary'],
      }),
    ],
  };
  const scopeA = getCampusAcademicScope('campus-five', intake5Classes);
  assert(scopeA.classes.length === 5, 'Scenario A: Matrix receives exactly 5 classes');
  assert(scopeA.activeClasses.length === 5, 'Scenario A: activeClasses alias contains 5 classes');
  assert(
    JSON.stringify(scopeA.classNames) === JSON.stringify(['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']),
    'Scenario A: Matrix receives classes in exact configured order'
  );

  // Scenario B: Campus with only 2 classes (Class 1, Class 2)
  const intake2Classes: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        id: 'campus-two',
        classesOffered: ['Class 1', 'Class 2'],
        academicLevels: ['Primary'],
      }),
    ],
  };
  const scopeB = getCampusAcademicScope('campus-two', intake2Classes);
  assert(scopeB.classes.length === 2, 'Scenario B: Matrix receives strictly 2 classes');
  assert(!scopeB.classNames.includes('Class 3'), 'Scenario B: Matrix never exposes unconfigured Class 3');
  assert(!scopeB.classNames.includes('Class 12'), 'Scenario B: Matrix never exposes unconfigured Class 12');

  // Scenario C: Multi-campus isolation: Campus A (Class 1, 2, 3) vs Campus B (Class 9, 10)
  const intakeMulti = {
    campuses: [
      makeCampus({
        id: 'campus-primary',
        name: 'Primary Wing',
        isMainCampus: true,
        classesOffered: ['Class 1', 'Class 2', 'Class 3'],
        academicLevels: ['Primary'],
      }),
      makeCampus({
        id: 'campus-secondary',
        name: 'Secondary Wing',
        isMainCampus: false,
        classesOffered: ['Class 9', 'Class 10'],
        academicLevels: ['Secondary'],
      }),
    ],
  };
  const scopePrim = getCampusAcademicScope('campus-primary', intakeMulti);
  const scopeSec = getCampusAcademicScope('campus-secondary', intakeMulti);
  assert(scopePrim.classes.length === 3, 'Scenario C: Primary wing matrix has 3 classes');
  assert(scopeSec.classes.length === 2, 'Scenario C: Secondary wing matrix has 2 classes');
  assert(!scopePrim.classNames.includes('Class 9'), 'Scenario C: Secondary classes do not leak into Primary wing');
  assert(!scopeSec.classNames.includes('Class 1'), 'Scenario C: Primary classes do not leak into Secondary wing');

  // Scenario D: Empty scope (classes: [], academicLevels: []) -> empty state, NEVER fallback to Class 1
  const intakeEmptyScope: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        id: 'campus-empty',
        name: 'Unconfigured Campus',
        classesOffered: [],
        academicLevels: [],
      }),
    ],
    institutionStructure: {
      classes: [{ id: 'legacy_1', name: 'Class 1' }],
    } as any,
  };
  const scopeEmpty = getCampusAcademicScope('campus-empty', intakeEmptyScope);
  assert(scopeEmpty.classes.length === 0, 'Scenario D: Empty scope returns 0 classes');
  assert(scopeEmpty.hasClasses === false, 'Scenario D: hasClasses is false, triggering empty state banner');
  assert(!scopeEmpty.classNames.includes('Class 1'), 'Scenario D: NEVER falls back to Class 1');

  // Scenario E: Global fee inheritance & overrides
  const sampleFees: FeesConfigurationData = {
    commonFees: [
      {
        id: 'cf-tuition',
        name: 'Tuition Fee',
        category: 'Tuition',
        amount: 3200,
        frequency: 'monthly',
        applicableClasses: 'all',
        isRefundable: false,
        studentType: 'both',
      },
    ],
    classOverrides: {
      'Class 3': {
        'cf-tuition': {
          amount: 3500,
          isCustom: true,
          notes: 'Special lab fee component included',
        },
      },
    },
  };

  const filteredFees = filterFeesByCampusScope(sampleFees, scopeA);

  // All 5 classes inherit the global tuition fee unless overridden
  scopeA.classNames.forEach((className) => {
    const override = filteredFees.classOverrides?.[className]?.['cf-tuition'];
    const isCustom = Boolean(override?.isCustom);
    const amount = isCustom ? override.amount : filteredFees.commonFees[0].amount;

    if (className === 'Class 3') {
      assert(isCustom === true, 'Scenario E: Class 3 fee is recognized as CUSTOM override');
      assert(amount === 3500, 'Scenario E: Class 3 resolves to custom overridden amount 3500');
    } else {
      assert(isCustom === false, 'Scenario E: Non-overridden class inherits global common fee');
      assert(amount === 3200, 'Scenario E: Non-overridden class resolves to inherited amount 3200');
    }
  });

  // Simulating override reset on Class 3:
  const feesAfterReset: FeesConfigurationData = {
    ...filteredFees,
    classOverrides: {
      ...filteredFees.classOverrides,
      'Class 3': {},
    },
  };
  const resetOverride = feesAfterReset.classOverrides?.['Class 3']?.['cf-tuition'];
  const resetIsCustom = Boolean(resetOverride?.isCustom);
  const resetAmount = resetIsCustom ? resetOverride.amount : feesAfterReset.commonFees[0].amount;
  assert(resetIsCustom === false, 'Scenario E: Resetting override marks fee as INHERITED again');
  assert(resetAmount === 3200, 'Scenario E: Resetting override returns amount to 3200 without DB record duplication');
}

// -----------------------------------------------------------------------------
// TEST 12: Academic Level Tier Overrides in Fee Structures
// -----------------------------------------------------------------------------
console.log('\nTEST 12: Academic Level Tier Overrides in Fee Structures');
{
  // School offering all levels from Pre-Primary through Senior Secondary
  const allLevelsIntake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        id: 'campus-all',
        name: 'Comprehensive Campus',
        academicLevels: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'],
        classesOffered: [
          'Playgroup', 'Nursery', 'LKG', 'UKG',
          'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
          'Class 6', 'Class 7', 'Class 8',
          'Class 9', 'Class 10',
          'Class 11', 'Class 12',
        ],
      }),
    ],
    feesConfiguration: {
      commonFees: [
        { id: 'cf-tuition', name: 'Tuition Fee', category: 'Tuition', amount: 1000, frequency: 'monthly', applicableClasses: 'all', isRefundable: false, studentType: 'both' },
      ],
      classFeeStructures: [
        { className: 'Pre-Primary (Nursery - UKG)', feeType: 'Tuition Fee', amount: 1200, frequency: 'monthly' },
        { className: 'Primary (Class 1-5)', feeType: 'Tuition Fee', amount: 1500, frequency: 'monthly' },
        { className: 'Middle (Class 6-8)', feeType: 'Tuition Fee', amount: 1800, frequency: 'monthly' },
        { className: 'Secondary (Class 9-10)', feeType: 'Tuition Fee', amount: 2200, frequency: 'monthly' },
        { className: 'Senior Secondary (Class 11-12)', feeType: 'Tuition Fee', amount: 2800, frequency: 'monthly' },
      ],
    } as FeesConfigurationData,
  };

  const validationAll = validateCampusAcademicPayload('campus-all', allLevelsIntake);
  assert(validationAll.isValid === true, 'All 5 level tier overrides are valid when campus offers those levels');
  assert(validationAll.errors.length === 0, 'Zero errors for valid level tier overrides');

  const scopeAll = getCampusAcademicScope('campus-all', allLevelsIntake);
  const primaryFee = resolveEffectiveFeeForClass('Class 1', 'Tuition Fee', allLevelsIntake.feesConfiguration!, scopeAll);
  assert(primaryFee.amount === 1500, 'Class 1 resolves to Primary tier fee 1500');
  assert(primaryFee.source === 'class_override', 'Class 1 source is class_override from tier');

  const secondaryFee = resolveEffectiveFeeForClass('Class 10', 'Tuition Fee', allLevelsIntake.feesConfiguration!, scopeAll);
  assert(secondaryFee.amount === 2200, 'Class 10 resolves to Secondary tier fee 2200');
  assert(secondaryFee.source === 'class_override', 'Class 10 source is class_override from tier');

  // Campus offering ONLY Primary (Class 1-5)
  const primaryOnlyIntake: Partial<UniversalIntakeData> = {
    campuses: [
      makeCampus({
        id: 'campus-pri',
        name: 'Primary Only Wing',
        academicLevels: ['Primary'],
        classesOffered: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
      }),
    ],
    feesConfiguration: {
      classFeeStructures: [
        { className: 'Primary (Class 1-5)', feeType: 'Tuition Fee', amount: 1500, frequency: 'monthly' },
        { className: 'Senior Secondary (Class 11-12)', feeType: 'Tuition Fee', amount: 2800, frequency: 'monthly' }, // Out of scope
      ],
    } as FeesConfigurationData,
  };

  const validationPri = validateCampusAcademicPayload('campus-pri', primaryOnlyIntake);
  assert(validationPri.isValid === false, 'Rejects Senior Secondary tier override on Primary-only campus');
  assert(validationPri.errors.some((e) => e.includes('Senior Secondary')), 'Detects out-of-scope Senior Secondary tier override');
  assert(!validationPri.errors.some((e) => e.includes('Primary (Class 1-5)')), 'Accepts Primary tier override on Primary-only campus');
}

// -----------------------------------------------------------------------------
// Edge Cases
// -----------------------------------------------------------------------------
console.log('\nEdge Cases');
{
  const intake: Partial<UniversalIntakeData> = {
    campuses: [makeCampus()],
  };

  assert(validateClassInCampusScope('campus-main', '', intake).valid === false, 'Empty string is invalid class');
  assert(validateClassInCampusScope('campus-main', '   ', intake).valid === false, 'Whitespace-only is invalid class');

  assert(validateClassInCampusScope('campus-main', 'class 1', intake).valid === true, 'Case-insensitive: class 1 matches Class 1');
  assert(validateClassInCampusScope('campus-main', 'CLASS 1', intake).valid === true, 'Case-insensitive: CLASS 1 matches Class 1');

  const fallbackScope = getCampusAcademicScope('non-existent-campus', makeMultiCampusIntake());
  assert(fallbackScope.campusId === 'campus-a', 'Non-existent campus ID cleanly falls back to main campus');
}

console.log('\n-----------------------------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
}
