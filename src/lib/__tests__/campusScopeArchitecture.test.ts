import assert from 'node:assert';
import {
  SECTION_SCOPE_REGISTRY,
  getSectionScope,
  isCampusScopedSection,
  isSectionInheritanceAllowed,
  isSectionNotApplicableAllowed,
  getMainCampus,
  getCampusById,
  getCampusDisplayName,
  validateInheritanceChain,
  resolveCampusSectionData,
  setCampusSectionMode,
  updateCampusCustomData,
  handleCampusDeletion,
  handleMainCampusDesignation,
} from '../campusScopeRegistry';
import { calculateIntakeCompleteness, createInitialIntakeData, INTAKE_SECTIONS } from '../schoolIntake';
import { reconcileClassesForAcademicLevels } from '../academicStructureUtils';
import type {
  CampusBranchData,
  UniversalIntakeData,
  AcademicClassConfig,
} from '../types';

console.log('===========================================================');
console.log('TEST SUITE: Multi-Campus Scope & Inheritance Architecture');
console.log('===========================================================\n');

// Helper to create mock campus
function mockCampus(id: string, name: string, isMain = false): CampusBranchData {
  return {
    id,
    name,
    isMainCampus: isMain,
    address: `${name} Address`,
    city: 'Motihari',
    state: 'Bihar',
    country: 'India',
    pin: '845401',
  };
}

// -------------------------------------------------------------
// TEST 1: Single-Campus Backward Compatibility
// -------------------------------------------------------------
console.log('--- TEST 1: Single-Campus Backward Compatibility ---');
{
  const singleCampus = mockCampus('c1', 'St. Joseph Academy', true);
  const intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [singleCampus],
    transportConfig: {
      hasSchoolTransport: true,
      fleetCount: 5,
      routes: [{ id: 'r1', routeName: 'Route 1', stops: [] }],
    },
  };

  // Section scope check
  assert.strictEqual(getSectionScope('schoolProfile'), 'SCHOOL_LEVEL');
  assert.strictEqual(getSectionScope('transportConfig'), 'CAMPUS_LEVEL');
  assert.strictEqual(getSectionScope('admissions'), 'MIXED');

  // Single campus resolution: must return customized mode with canonical school data
  const resolved = resolveCampusSectionData(intakeData, 'transportConfig', 'c1');
  assert.strictEqual(resolved.mode, 'customized');
  assert.strictEqual(resolved.isReadOnly, false);
  assert.strictEqual(resolved.data?.fleetCount, 5);

  console.log('  ✓ Scope classification accurate (SCHOOL_LEVEL, CAMPUS_LEVEL, MIXED)');
  console.log('  ✓ Single campus resolves directly to root data without overrides');
}

// -------------------------------------------------------------
// TEST 2: Two Campuses, Default Inheritance from Main Campus
// -------------------------------------------------------------
console.log('\n--- TEST 2: Two Campuses, Default Inheritance from Main Campus ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'South City Branch', false);

  const intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    transportConfig: {
      hasSchoolTransport: true,
      fleetCount: 10,
    },
  };

  // Default resolution for non-main campus when no explicit override set
  const resolvedC2 = resolveCampusSectionData(intakeData, 'transportConfig', 'c2');
  assert.strictEqual(resolvedC2.mode, 'inherited');
  assert.strictEqual(resolvedC2.sourceCampusId, 'c1');
  assert.strictEqual(resolvedC2.sourceCampusName, 'Main Campus');
  assert.strictEqual(resolvedC2.isReadOnly, true);
  assert.strictEqual(resolvedC2.data?.fleetCount, 10);

  // When Main Campus updates, C2 dynamically reflects updated data
  const updatedIntake: UniversalIntakeData = {
    ...intakeData,
    transportConfig: {
      hasSchoolTransport: true,
      fleetCount: 15,
    },
  };
  const resolvedUpdatedC2 = resolveCampusSectionData(updatedIntake, 'transportConfig', 'c2');
  assert.strictEqual(resolvedUpdatedC2.data?.fleetCount, 15);

  console.log('  ✓ Branch campus defaults to inherited from Main Campus');
  console.log('  ✓ Data is read-only by reference and dynamically propagates Main Campus updates');
}

// -------------------------------------------------------------
// TEST 3: Two Campuses, Customization for Branch Campus
// -------------------------------------------------------------
console.log('\n--- TEST 3: Two Campuses, Customization for Branch Campus ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'South City Branch', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    feesConfiguration: {
      dueDateDay: 10,
      lateFeeType: 'fixed',
      classFeeStructures: [{ className: 'Class 1', amount: 2000, feeType: 'Tuition', frequency: 'Monthly' }],
    },
  };

  // Transition C2 to customized
  intakeData = setCampusSectionMode(intakeData, 'feesConfiguration', 'c2', 'customized');
  assert.strictEqual(intakeData.campusOverrides?.['c2']?.['feesConfiguration']?.sourceMode, 'customized');

  // Update C2 with independent fee structure
  intakeData = updateCampusCustomData(intakeData, 'feesConfiguration', 'c2', {
    dueDateDay: 15,
    lateFeeType: 'percentage',
    classFeeStructures: [{ className: 'Class 1', amount: 3500, feeType: 'Tuition', frequency: 'Monthly' }],
  });

  // Verify C1 (Main) fee structure is unchanged
  const resolvedC1 = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c1');
  assert.strictEqual(resolvedC1.data?.dueDateDay, 10);
  assert.strictEqual(resolvedC1.data?.classFeeStructures[0].amount, 2000);

  // Verify C2 has independent customized data
  const resolvedC2 = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c2');
  assert.strictEqual(resolvedC2.mode, 'customized');
  assert.strictEqual(resolvedC2.isReadOnly, false);
  assert.strictEqual(resolvedC2.data?.dueDateDay, 15);
  assert.strictEqual(resolvedC2.data?.classFeeStructures[0].amount, 3500);

  console.log('  ✓ Switching to customized creates independent override');
  console.log('  ✓ Branch mutations do not contaminate Main Campus data');
}

// -------------------------------------------------------------
// TEST 4: Three Campuses, Chained Inheritance (C -> B -> Main)
// -------------------------------------------------------------
console.log('\n--- TEST 4: Three Campuses, Chained Inheritance (C -> B -> Main) ---');
{
  const c1 = mockCampus('c1', 'Campus A (Main)', true);
  const c2 = mockCampus('c2', 'Campus B', false);
  const c3 = mockCampus('c3', 'Campus C', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2, c3],
    libraryConfig: {
      hasLibrary: true,
      totalBooks: 5000,
    },
  };

  // Campus B customizes library with 12,000 books
  intakeData = setCampusSectionMode(intakeData, 'libraryConfig', 'c2', 'customized');
  intakeData = updateCampusCustomData(intakeData, 'libraryConfig', 'c2', {
    hasLibrary: true,
    totalBooks: 12000,
  });

  // Campus C inherits from Campus B
  intakeData = setCampusSectionMode(intakeData, 'libraryConfig', 'c3', 'inherited', 'c2');

  const resolvedC3 = resolveCampusSectionData(intakeData, 'libraryConfig', 'c3');
  assert.strictEqual(resolvedC3.mode, 'inherited');
  assert.strictEqual(resolvedC3.sourceCampusId, 'c2');
  assert.strictEqual(resolvedC3.data?.totalBooks, 12000);

  // Now mutate Campus B to 14,000 books -> Campus C should immediately reflect 14,000 books!
  intakeData = updateCampusCustomData(intakeData, 'libraryConfig', 'c2', {
    hasLibrary: true,
    totalBooks: 14000,
  });

  const resolvedC3AfterBUpdate = resolveCampusSectionData(intakeData, 'libraryConfig', 'c3');
  assert.strictEqual(resolvedC3AfterBUpdate.data?.totalBooks, 14000);

  console.log('  ✓ Chained inheritance resolves recursively across 3 campuses');
  console.log('  ✓ Updates to intermediate branch propagate to dependent leaf branch');
}

// -------------------------------------------------------------
// TEST 5: Cycle Detection (A -> B -> A and A -> B -> C -> A)
// -------------------------------------------------------------
console.log('\n--- TEST 5: Cycle Detection & Loop Prevention ---');
{
  const c1 = mockCampus('c1', 'Campus A (Main)', true);
  const c2 = mockCampus('c2', 'Campus B', false);
  const c3 = mockCampus('c3', 'Campus C', false);
  const campuses = [c1, c2, c3];

  // Self inheritance blocked
  const selfCheck = validateInheritanceChain(campuses, {}, 'transportConfig', 'c2', 'c2');
  assert.strictEqual(selfCheck.valid, false);

  // Direct 2-campus cycle: If B inherits from C, C cannot inherit from B
  const overrides: any = {
    c2: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c3' } },
  };
  const directCycle = validateInheritanceChain(campuses, overrides, 'transportConfig', 'c3', 'c2');
  assert.strictEqual(directCycle.valid, false);
  assert.ok(directCycle.error?.includes('Circular inheritance detected'));

  // 3-campus cycle: C inherits from B, B inherits from A -> A cannot inherit from C
  const chainOverrides: any = {
    c3: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c2' } },
    c2: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c1' } },
  };
  const threeCampusCycle = validateInheritanceChain(campuses, chainOverrides, 'transportConfig', 'c1', 'c3');
  assert.strictEqual(threeCampusCycle.valid, false);
  assert.ok(threeCampusCycle.error?.includes('Circular inheritance detected'));

  // Safe choice: C inheriting from A (root) is valid
  const safeCheck = validateInheritanceChain(campuses, chainOverrides, 'transportConfig', 'c3', 'c1');
  assert.strictEqual(safeCheck.valid, true);

  console.log('  ✓ Direct 2-node cycle (A -> B -> A) blocked');
  console.log('  ✓ Multi-node cycle (A -> B -> C -> A) blocked');
  console.log('  ✓ Non-circular candidate passes validation');
}

// -------------------------------------------------------------
// TEST 6: Not Applicable Handling (Exempt from Progress Penalties)
// -------------------------------------------------------------
console.log('\n--- TEST 6: Not Applicable Handling & Completeness Exemption ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Day Scholar Campus', false);

  // Allowed check
  assert.strictEqual(isSectionNotApplicableAllowed('transportConfig'), true);
  assert.strictEqual(isSectionNotApplicableAllowed('hostelConfig'), true);
  assert.strictEqual(isSectionNotApplicableAllowed('libraryConfig'), true);
  assert.strictEqual(isSectionNotApplicableAllowed('schoolProfile'), false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    hostelConfig: {
      hasHostelFacility: true,
      totalCapacity: 100,
    },
  };

  // Mark Hostel as Not Applicable for C2
  intakeData = setCampusSectionMode(intakeData, 'hostelConfig', 'c2', 'not_applicable');
  const resolved = resolveCampusSectionData(intakeData, 'hostelConfig', 'c2');
  assert.strictEqual(resolved.mode, 'not_applicable');
  assert.strictEqual(resolved.data, undefined);

  // Completeness should evaluate C1 (complete) and exempt C2 without penalty
  const completeness = calculateIntakeCompleteness('school-complete', intakeData);
  assert.strictEqual(completeness.sectionPercentages['hostelConfig'], 100);

  console.log('  ✓ Not applicable permissions validated by section capability');
  console.log('  ✓ Exempted campuses do not penalize completeness score');
}

// -------------------------------------------------------------
// TEST 7: Dynamic Campus Renaming
// -------------------------------------------------------------
console.log('\n--- TEST 7: Dynamic Campus Renaming ---');
{
  const c1 = mockCampus('c1', 'Original North Campus', true);
  assert.strictEqual(getCampusDisplayName(c1), 'Original North Campus');

  // Rename
  c1.name = 'Heritage Campus & Senior Wing';
  assert.strictEqual(getCampusDisplayName(c1), 'Heritage Campus & Senior Wing');

  // Fallbacks
  const unnamedMain = mockCampus('c2', '', true);
  assert.strictEqual(getCampusDisplayName(unnamedMain), 'Main Campus');

  const unnamedBranch = mockCampus('c3', '', false);
  assert.strictEqual(getCampusDisplayName(unnamedBranch, 2), 'Campus 2');

  console.log('  ✓ Dynamic name reflection without hardcoded assumptions');
  console.log('  ✓ Graceful fallbacks for untitled campuses');
}

// -------------------------------------------------------------
// TEST 8: Safe Campus Deletion & Branch Repointing
// -------------------------------------------------------------
console.log('\n--- TEST 8: Safe Campus Deletion & Branch Repointing ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Intermediate Branch', false);
  const c3 = mockCampus('c3', 'Junior Branch', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2, c3],
    campusOverrides: {
      c2: {
        facilitiesConfig: { sourceMode: 'customized', customData: { smartClassrooms: true } },
      },
      c3: {
        facilitiesConfig: { sourceMode: 'inherited', sourceCampusId: 'c2' }, // Inherits from C2
      },
    },
  };

  // Delete C2 safely
  intakeData = handleCampusDeletion(intakeData, 'c2');

  // C2 should be removed from campuses list
  assert.strictEqual(intakeData.campuses?.length, 2);
  assert.strictEqual(intakeData.campuses?.some((c) => c.id === 'c2'), false);

  // C2 overrides should be purged
  assert.strictEqual(intakeData.campusOverrides?.['c2'], undefined);

  // C3 previously inherited from C2; must be repointed safely to Main Campus (C1)
  const repointedOverride = intakeData.campusOverrides?.['c3']?.['facilitiesConfig'];
  assert.strictEqual(repointedOverride?.sourceCampusId, 'c1');

  console.log('  ✓ Campus purged from roster and override map');
  console.log('  ✓ Dependent branches safely repointed to Main Campus preventing dangling references');
}

// -------------------------------------------------------------
// TEST 9: Main Campus Designation Change
// -------------------------------------------------------------
console.log('\n--- TEST 9: Main Campus Designation Changes Without Data Loss ---');
{
  const c1 = mockCampus('c1', 'Old Main Campus', true);
  const c2 = mockCampus('c2', 'New Main Campus', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
  };

  // Re-designate C2 as Main Campus
  intakeData = handleMainCampusDesignation(intakeData, 'c2');

  const main = getMainCampus(intakeData.campuses);
  assert.strictEqual(main?.id, 'c2');
  assert.strictEqual(main?.isMainCampus, true);

  const oldMain = getCampusById(intakeData.campuses, 'c1');
  assert.strictEqual(oldMain?.isMainCampus, false);

  console.log('  ✓ Main campus flipped dynamically');
  console.log('  ✓ Campus roster remains intact without data loss');
}

// -------------------------------------------------------------
// TEST 10: Academic Classes Isolation Between Campuses
// -------------------------------------------------------------
console.log('\n--- TEST 10: Academic Classes Isolation Between Campuses ---');
{
  // Campus A is Pre-Primary (Playgroup to UKG)
  const campus1Levels = ['Pre-Primary'];
  const campus1ClassesResult = reconcileClassesForAcademicLevels(campus1Levels, []);
  assert.strictEqual(campus1ClassesResult.classes.length, 4);
  assert.ok(campus1ClassesResult.classes.includes('Playgroup'));
  assert.ok(campus1ClassesResult.classes.includes('UKG'));
  assert.strictEqual(campus1ClassesResult.classes.includes('Class 10'), false);

  // Campus B is Secondary & Senior Secondary (Class 9 to Class 12)
  const campus2Levels = ['Secondary', 'Senior Secondary'];
  const campus2ClassesResult = reconcileClassesForAcademicLevels(campus2Levels, []);
  assert.strictEqual(campus2ClassesResult.classes.length, 4);
  assert.ok(campus2ClassesResult.classes.includes('Class 9'));
  assert.ok(campus2ClassesResult.classes.includes('Class 12'));
  assert.strictEqual(campus2ClassesResult.classes.includes('Playgroup'), false);

  // Map to AcademicClassConfig
  const c1ConfigList: AcademicClassConfig[] = campus1ClassesResult.classes.map((name, i) => ({
    name,
    campusId: 'campus-1',
    sortOrder: i + 1,
  }));

  const c2ConfigList: AcademicClassConfig[] = campus2ClassesResult.classes.map((name, i) => ({
    name,
    campusId: 'campus-2',
    sortOrder: i + 1,
  }));

  const allClasses = [...c1ConfigList, ...c2ConfigList];

  // Verify campus-level filtering
  const campus1Filtered = allClasses.filter((c) => c.campusId === 'campus-1');
  const campus2Filtered = allClasses.filter((c) => c.campusId === 'campus-2');

  assert.strictEqual(campus1Filtered.length, 4);
  assert.strictEqual(campus2Filtered.length, 4);
  assert.ok(campus1Filtered.every((c) => !campus2Filtered.some((c2) => c2.name === c.name)));

  console.log('  ✓ Campus 1 classes strictly isolated to Pre-Primary');
  console.log('  ✓ Campus 2 classes strictly isolated to Secondary/Senior Secondary');
  console.log('  ✓ Zero cross-campus class leakage');
}

// -------------------------------------------------------------
// TEST 11: Scope Registry 1:1 Parity with INTAKE_SECTIONS
// -------------------------------------------------------------
console.log('\n--- TEST 11: Scope Registry 1:1 Parity with INTAKE_SECTIONS ---');
{
  const catalogKeys = INTAKE_SECTIONS.map((s) => s.key);
  const registryKeys = Object.keys(SECTION_SCOPE_REGISTRY);

  // Every intake section must be explicitly classified in SECTION_SCOPE_REGISTRY
  catalogKeys.forEach((key) => {
    const scopeDef = SECTION_SCOPE_REGISTRY[key];
    assert.ok(scopeDef, `Section "${key}" from INTAKE_SECTIONS must exist in SECTION_SCOPE_REGISTRY`);
    assert.ok(
      scopeDef.scope === 'SCHOOL_LEVEL' || scopeDef.scope === 'CAMPUS_LEVEL' || scopeDef.scope === 'MIXED',
      `Section "${key}" has invalid scope "${scopeDef?.scope}"`
    );
    assert.ok(scopeDef.title && scopeDef.title.trim().length > 0, `Section "${key}" must have a non-empty title`);
    assert.ok(scopeDef.description && scopeDef.description.trim().length > 0, `Section "${key}" must have a description`);
  });

  console.log(`  ✓ All ${catalogKeys.length} INTAKE_SECTIONS have 100% authoritative scope definitions`);
  console.log(`  ✓ Total registry entries: ${registryKeys.length} (including legacy extensions)`);
}

// -------------------------------------------------------------
// TEST 12: Defensive Recursion Depth Limit & Circular Loop Recovery
// -------------------------------------------------------------
console.log('\n--- TEST 12: Defensive Recursion Depth Limit & Circular Loop Recovery ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Branch 2', false);
  const c3 = mockCampus('c3', 'Branch 3', false);
  const c4 = mockCampus('c4', 'Branch 4', false);

  // Intentionally inject a corrupted circular chain: c2 -> c3 -> c4 -> c2
  const corruptedIntake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2, c3, c4],
    transportConfig: {
      hasSchoolTransport: true,
      fleetCount: 22,
    },
    campusOverrides: {
      c2: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c3' } },
      c3: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c4' } },
      c4: { transportConfig: { sourceMode: 'inherited', sourceCampusId: 'c2' } }, // Closes cycle!
    },
  };

  // Calling resolveCampusSectionData MUST NOT throw a stack overflow RangeError
  let resolved: any;
  assert.doesNotThrow(() => {
    resolved = resolveCampusSectionData(corruptedIntake, 'transportConfig', 'c2');
  }, 'Circular override must not trigger maximum call stack size exceeded');

  // Should gracefully break the loop and return resolved Main Campus data
  assert.strictEqual(resolved.mode, 'inherited');
  assert.strictEqual(resolved.data?.fleetCount, 22);

  console.log('  ✓ Corrupted circular override chain (c2 -> c3 -> c4 -> c2) handled safely');
  console.log('  ✓ Zero stack overflow; gracefully falls back to Main Campus data');
}

// -------------------------------------------------------------
// TEST 13: Dangling sourceCampusId Self-Healing
// -------------------------------------------------------------
console.log('\n--- TEST 13: Dangling sourceCampusId Self-Healing ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Branch 2', false);

  // Override references a non-existent or deleted campus ID
  const danglingIntake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    libraryConfig: {
      hasLibrary: true,
      totalBooks: 8500,
    },
    campusOverrides: {
      c2: { libraryConfig: { sourceMode: 'inherited', sourceCampusId: 'non_existent_id' } },
    },
  };

  const resolved = resolveCampusSectionData(danglingIntake, 'libraryConfig', 'c2');
  assert.strictEqual(resolved.mode, 'inherited');
  assert.strictEqual(resolved.sourceCampusId, 'c1');
  assert.strictEqual(resolved.data?.totalBooks, 8500);

  console.log('  ✓ Dangling sourceCampusId safely falls back to Main Campus');
  console.log('  ✓ Prevents crashes when source campuses are externally removed');
}

// -------------------------------------------------------------
// TEST 14: Data Cleanliness across State Mode Transitions
// -------------------------------------------------------------
console.log('\n--- TEST 14: Data Cleanliness across State Mode Transitions ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Branch 2', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    feesConfiguration: {
      dueDateDay: 5,
      classFeeStructures: [{ className: 'Class 1', amount: 1000, feeType: 'Tuition', frequency: 'Monthly' }],
    },
  };

  // 1. Initially C2 is inherited
  let res = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c2');
  assert.strictEqual(res.mode, 'inherited');
  assert.strictEqual(res.data?.dueDateDay, 5);

  // 2. Switch to customized and enter custom fees
  intakeData = setCampusSectionMode(intakeData, 'feesConfiguration', 'c2', 'customized');
  intakeData = updateCampusCustomData(intakeData, 'feesConfiguration', 'c2', {
    dueDateDay: 20,
    classFeeStructures: [{ className: 'Class 1', amount: 4000, feeType: 'Tuition', frequency: 'Monthly' }],
  });
  res = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c2');
  assert.strictEqual(res.mode, 'customized');
  assert.strictEqual(res.data?.dueDateDay, 20);

  // 3. Switch back to inherited -> Main Campus dueDateDay (5) should be resolved
  intakeData = setCampusSectionMode(intakeData, 'feesConfiguration', 'c2', 'inherited');
  res = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c2');
  assert.strictEqual(res.mode, 'inherited');
  assert.strictEqual(res.data?.dueDateDay, 5);
  // Ensure customData was stripped from the override
  assert.strictEqual(intakeData.campusOverrides?.['c2']?.['feesConfiguration']?.customData, undefined);

  // 4. Main Campus updates fees to dueDateDay: 8
  intakeData = {
    ...intakeData,
    feesConfiguration: {
      dueDateDay: 8,
      classFeeStructures: [{ className: 'Class 1', amount: 1200, feeType: 'Tuition', frequency: 'Monthly' }],
    },
  };

  // 5. Switch C2 back to customized -> should freshly clone 8, NOT revive old 20!
  intakeData = setCampusSectionMode(intakeData, 'feesConfiguration', 'c2', 'customized');
  res = resolveCampusSectionData(intakeData, 'feesConfiguration', 'c2');
  assert.strictEqual(res.mode, 'customized');
  assert.strictEqual(res.data?.dueDateDay, 8); // Freshly cloned, not stale!

  console.log('  ✓ Switching to inherited purges stale customData');
  console.log('  ✓ Switching back to customized freshly clones from current source');
}

// -------------------------------------------------------------
// TEST 15: Sequential Main Campus Swapping (A -> B -> C -> A)
// -------------------------------------------------------------
console.log('\n--- TEST 15: Sequential Main Campus Swapping (A -> B -> C -> A) ---');
{
  const c1 = mockCampus('c1', 'Campus A', true);
  const c2 = mockCampus('c2', 'Campus B', false);
  const c3 = mockCampus('c3', 'Campus C', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2, c3],
    transportConfig: {
      hasSchoolTransport: true,
      fleetCount: 10,
    },
    schoolProfile: {
      ...createInitialIntakeData({ schoolName: 'Test School' }).schoolProfile,
      address: 'Address A',
      city: 'City A',
    },
  };

  // Give Campus B custom transport: 25 buses
  intakeData = setCampusSectionMode(intakeData, 'transportConfig', 'c2', 'customized');
  intakeData = updateCampusCustomData(intakeData, 'transportConfig', 'c2', {
    hasSchoolTransport: true,
    fleetCount: 25,
  });

  // Step 1: Designate B as Main Campus
  intakeData = handleMainCampusDesignation(intakeData, 'c2');
  assert.strictEqual(getMainCampus(intakeData.campuses)?.id, 'c2');
  // Campus B custom transport (25) promoted to canonical school data
  assert.strictEqual(intakeData.transportConfig?.fleetCount, 25);
  // Old main (A) has its previous 10 buses preserved in overrides
  assert.strictEqual(intakeData.campusOverrides?.['c1']?.['transportConfig']?.customData?.fleetCount, 10);
  // Campus B has no overrides (it is Main)
  assert.strictEqual(intakeData.campusOverrides?.['c2'], undefined);

  // Step 2: Designate C as Main Campus
  intakeData = handleMainCampusDesignation(intakeData, 'c3');
  assert.strictEqual(getMainCampus(intakeData.campuses)?.id, 'c3');
  // Campus C was inheriting, so it keeps 25 buses as canonical root
  assert.strictEqual(intakeData.transportConfig?.fleetCount, 25);
  assert.strictEqual(intakeData.campusOverrides?.['c3'], undefined);

  // Step 3: Designate A back as Main Campus
  intakeData = handleMainCampusDesignation(intakeData, 'c1');
  assert.strictEqual(getMainCampus(intakeData.campuses)?.id, 'c1');
  // A's preserved custom data (10 buses) is promoted back to canonical root
  assert.strictEqual(intakeData.transportConfig?.fleetCount, 10);
  assert.strictEqual(intakeData.campusOverrides?.['c1'], undefined);

  // Verify zero cycles across all remaining campus overrides
  const overrides = intakeData.campusOverrides || {};
  Object.keys(overrides).forEach((cId) => {
    const override = overrides[cId]?.['transportConfig'];
    if (override?.sourceMode === 'inherited' && override.sourceCampusId) {
      const check = validateInheritanceChain(intakeData.campuses || [], overrides, 'transportConfig', cId, override.sourceCampusId);
      assert.strictEqual(check.valid, true, `Cycle detected for campus ${cId}`);
    }
  });

  console.log('  ✓ Sequential Main Campus swap (A -> B -> C -> A) executed cleanly');
  console.log('  ✓ Data promoted and preserved without loss or circular references');
}

// -------------------------------------------------------------
// TEST 16: Deleting Main Campus with Automatic Promotion & Address Sync
// -------------------------------------------------------------
console.log('\n--- TEST 16: Deleting Main Campus with Automatic Promotion & Address Sync ---');
{
  const c1 = mockCampus('c1', 'Main Campus East', true);
  c1.address = '100 East Highway';
  c1.city = 'Patna';

  const c2 = mockCampus('c2', 'Branch West', false);
  c2.address = '500 West Avenue';
  c2.city = 'Muzaffarpur';

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    schoolProfile: {
      ...createInitialIntakeData({ schoolName: 'Test School' }).schoolProfile,
      address: c1.address,
      city: c1.city,
    },
    institutionStructure: {
      academicStructureConfirmed: true,
      classes: [
        { id: 'cls-1', name: 'Class 1', campusId: 'c1' },
        { id: 'cls-2', name: 'Class 2', campusId: 'c2' },
      ],
    },
  };

  // Delete Main Campus (C1)
  intakeData = handleCampusDeletion(intakeData, 'c1');

  // C2 should be elevated to Main Campus
  assert.strictEqual(intakeData.campuses?.length, 1);
  assert.strictEqual(intakeData.campuses?.[0].id, 'c2');
  assert.strictEqual(intakeData.campuses?.[0].isMainCampus, true);

  // Primary address in schoolProfile must be synchronized to C2!
  assert.strictEqual(intakeData.schoolProfile?.address, '500 West Avenue');
  assert.strictEqual(intakeData.schoolProfile?.city, 'Muzaffarpur');

  // Ghost class referencing deleted C1 must be purged from academic roster
  assert.strictEqual(intakeData.institutionStructure?.classes?.length, 1);
  assert.strictEqual(intakeData.institutionStructure?.classes?.[0].name, 'Class 2');

  console.log('  ✓ Deleting Main Campus elevates next campus to Main');
  console.log('  ✓ Primary address in schoolProfile updated to new Main Campus');
  console.log('  ✓ Ghost academic classes referencing deleted campus cleanly purged');
}

// -------------------------------------------------------------
// TEST 17: Draft Persistence Serialization & Round-Trip Deserialization
// -------------------------------------------------------------
console.log('\n--- TEST 17: Draft Persistence Serialization & Round-Trip Deserialization ---');
{
  const c1 = mockCampus('c1', 'Main Campus', true);
  const c2 = mockCampus('c2', 'Branch 2', false);

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Test School' }),
    campuses: [c1, c2],
    transportConfig: { hasSchoolTransport: true, fleetCount: 12 },
  };

  // Configure campus overrides for C2
  intakeData = setCampusSectionMode(intakeData, 'transportConfig', 'c2', 'customized', undefined, {
    hasSchoolTransport: true,
    fleetCount: 28,
  });
  intakeData = setCampusSectionMode(intakeData, 'hostelConfig', 'c2', 'not_applicable');

  // Simulate JSON database serialization round-trip
  const jsonString = JSON.stringify(intakeData);
  const parsedData: UniversalIntakeData = JSON.parse(jsonString);

  // Assert 100% roundtrip fidelity
  assert.strictEqual(parsedData.campuses?.length, 2);
  assert.strictEqual(parsedData.campusOverrides?.['c2']?.['transportConfig']?.sourceMode, 'customized');
  assert.strictEqual(parsedData.campusOverrides?.['c2']?.['transportConfig']?.customData?.fleetCount, 28);
  assert.strictEqual(parsedData.campusOverrides?.['c2']?.['hostelConfig']?.sourceMode, 'not_applicable');

  // Resolve from parsed data
  const resolvedTransport = resolveCampusSectionData(parsedData, 'transportConfig', 'c2');
  assert.strictEqual(resolvedTransport.mode, 'customized');
  assert.strictEqual(resolvedTransport.data?.fleetCount, 28);

  const resolvedHostel = resolveCampusSectionData(parsedData, 'hostelConfig', 'c2');
  assert.strictEqual(resolvedHostel.mode, 'not_applicable');

  console.log('  ✓ campusOverrides and sectionConfigs survive JSON serialization without degradation');
  console.log('  ✓ Deserialized data maintains 100% resolution accuracy');
}

// -------------------------------------------------------------
// TEST 18: High-Scale Campus Resolution Benchmark (20 Campuses)
// -------------------------------------------------------------
console.log('\n--- TEST 18: High-Scale Campus Resolution Benchmark (20 Campuses) ---');
{
  const numCampuses = 20;
  const campuses: CampusBranchData[] = [];
  for (let i = 1; i <= numCampuses; i++) {
    campuses.push(mockCampus(`campus-${i}`, `Campus ${i}`, i === 1));
  }

  let intakeData: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Large Multi-Campus School' }),
    campuses,
    transportConfig: { hasSchoolTransport: true, fleetCount: 50 },
  };

  // Configure half as inherited and half as customized
  for (let i = 2; i <= numCampuses; i++) {
    if (i % 2 === 0) {
      intakeData = setCampusSectionMode(intakeData, 'transportConfig', `campus-${i}`, 'inherited', 'campus-1');
    } else {
      intakeData = setCampusSectionMode(intakeData, 'transportConfig', `campus-${i}`, 'customized', undefined, {
        hasSchoolTransport: true,
        fleetCount: i * 5,
      });
    }
  }

  // Benchmark resolution time across all 20 campuses
  const startTime = Date.now();
  for (let iter = 0; iter < 100; iter++) {
    for (const c of campuses) {
      resolveCampusSectionData(intakeData, 'transportConfig', c.id);
    }
  }
  const duration = Date.now() - startTime;

  assert.ok(duration < 200, `Resolution benchmark took ${duration}ms, expected < 200ms`);

  console.log(`  ✓ Resolved 2,000 queries across 20 campuses in ${duration}ms (< 200ms)`);
  console.log('  ✓ Exceptional throughput and zero performance degradation');
}

console.log('\n===========================================================');
console.log('RESULTS: ALL 18 MULTI-CAMPUS ARCHITECTURE TESTS PASSED!');
console.log('===========================================================');

