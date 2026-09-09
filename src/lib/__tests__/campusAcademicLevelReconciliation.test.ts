/**
 * AUTOMATED TEST SUITE: CAMPUS ACADEMIC LEVEL → CLASSES RECONCILIATION
 *
 * Verifies:
 * TEST 1:  First click on Pre-Primary immediately produces 4 classes.
 * TEST 2:  Deselect Pre-Primary removes all Pre-Primary classes.
 * TEST 3:  Multi-select Pre-Primary + Primary produces union of both (9 classes).
 * TEST 4:  Union — classes merged in canonical order.
 * TEST 5:  Deduplication — no duplicate class names.
 * TEST 6:  Partial deselect — remove Pre-Primary, keep Primary.
 * TEST 7:  Shared class preservation — class contributed by 2+ levels remains.
 * TEST 8:  Custom class preservation — manually added classes survive toggles.
 * TEST 9:  Campus isolation (pure function) — two calls are independent.
 * TEST 10: Existing persisted data hydration.
 * TEST 11: Class range derivation.
 * TEST 12: No selected levels → empty result.
 */

import {
  reconcileClassesForAcademicLevels,
  DEFAULT_LEVEL_CLASS_PRESETS,
} from '../academicStructureUtils';

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

function assertArrayEquals(actual: string[], expected: string[], message: string) {
  const ok = actual.length === expected.length && actual.every((v, i) => v === expected[i]);
  if (ok) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    console.error(`    Expected: [${expected.join(', ')}]`);
    console.error(`    Actual:   [${actual.join(', ')}]`);
    failed++;
  }
}

console.log('===========================================================');
console.log('TEST SUITE: Campus Academic Level → Classes Reconciliation');
console.log('===========================================================\n');

// ─── TEST 1: First Click ─────────────────────────────────────────────────────
console.log('--- TEST 1: First Click on Pre-Primary ---');
{
  const result = reconcileClassesForAcademicLevels(['Pre-Primary'], []);
  assertArrayEquals(
    result.classes,
    ['Playgroup', 'Nursery', 'LKG', 'UKG'],
    'First click on Pre-Primary produces [Playgroup, Nursery, LKG, UKG]'
  );
  assert(result.classes.length === 4, `Exactly 4 classes (got ${result.classes.length})`);
}

// ─── TEST 2: Deselect ────────────────────────────────────────────────────────
console.log('\n--- TEST 2: Deselect Pre-Primary ---');
{
  const result = reconcileClassesForAcademicLevels([], ['Playgroup', 'Nursery', 'LKG', 'UKG']);
  assert(result.classes.length === 0, `All Pre-Primary classes removed (got ${result.classes.length})`);
  assert(result.classRange === '', `Class range is empty (got "${result.classRange}")`);
}

// ─── TEST 3: Multi-select Pre-Primary + Primary ──────────────────────────────
console.log('\n--- TEST 3: Multi-Select Pre-Primary + Primary ---');
{
  const result = reconcileClassesForAcademicLevels(
    ['Pre-Primary', 'Primary'],
    ['Playgroup', 'Nursery', 'LKG', 'UKG']
  );
  assert(result.classes.length === 9, `Union produces 9 classes (got ${result.classes.length})`);
  assert(result.classes.includes('Playgroup'), 'Contains Playgroup');
  assert(result.classes.includes('UKG'), 'Contains UKG');
  assert(result.classes.includes('Class 1'), 'Contains Class 1');
  assert(result.classes.includes('Class 5'), 'Contains Class 5');
}

// ─── TEST 4: Union Ordering ──────────────────────────────────────────────────
console.log('\n--- TEST 4: Union — Canonical Ordering ---');
{
  // Even if Primary is selected first, output should be Pre-Primary then Primary
  const result = reconcileClassesForAcademicLevels(['Primary', 'Pre-Primary'], []);
  assertArrayEquals(
    result.classes,
    ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    'Union respects canonical level ordering (Pre-Primary before Primary)'
  );
}

// ─── TEST 5: Deduplication ───────────────────────────────────────────────────
console.log('\n--- TEST 5: Deduplication ---');
{
  // If existing classes already contain some canonical classes, no duplicates
  const result = reconcileClassesForAcademicLevels(
    ['Pre-Primary'],
    ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Playgroup']
  );
  const playCount = result.classes.filter(c => c === 'Playgroup').length;
  assert(playCount === 1, `Playgroup appears exactly once (got ${playCount})`);
  assert(result.classes.length === 4, `Exactly 4 unique classes (got ${result.classes.length})`);
}

// ─── TEST 6: Partial Deselect ────────────────────────────────────────────────
console.log('\n--- TEST 6: Partial Deselect (Remove Pre-Primary, Keep Primary) ---');
{
  const allNine = ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
  const result = reconcileClassesForAcademicLevels(['Primary'], allNine);
  assertArrayEquals(
    result.classes,
    ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    'After removing Pre-Primary, only Primary classes remain'
  );
  assert(!result.classes.includes('Playgroup'), 'Playgroup removed');
  assert(!result.classes.includes('UKG'), 'UKG removed');
}

// ─── TEST 7: Shared Class Preservation ───────────────────────────────────────
console.log('\n--- TEST 7: Shared Class Preservation ---');
{
  // Currently no two levels share a class in DEFAULT_LEVEL_CLASS_PRESETS,
  // but we can verify the logic: canonical classes from a deselected level disappear,
  // while those from a still-selected level remain.
  const result = reconcileClassesForAcademicLevels(
    ['Pre-Primary'],
    ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2']
  );
  assert(!result.classes.includes('Class 1'), 'Class 1 removed when Primary is deselected');
  assert(!result.classes.includes('Class 2'), 'Class 2 removed when Primary is deselected');
  assert(result.classes.includes('Playgroup'), 'Playgroup remains (Pre-Primary still selected)');
  assert(result.classes.length === 4, `Only Pre-Primary classes remain (got ${result.classes.length})`);
}

// ─── TEST 8: Custom Class Preservation ───────────────────────────────────────
console.log('\n--- TEST 8: Custom Class Preservation ---');
{
  const result = reconcileClassesForAcademicLevels(
    ['Pre-Primary'],
    ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Robotics Lab', 'Vedic Maths']
  );
  assert(result.classes.includes('Robotics Lab'), 'Custom class "Robotics Lab" preserved');
  assert(result.classes.includes('Vedic Maths'), 'Custom class "Vedic Maths" preserved');
  assert(result.classes.length === 6, `4 canonical + 2 custom = 6 (got ${result.classes.length})`);

  // Deselect Pre-Primary → custom classes still remain
  const resultEmpty = reconcileClassesForAcademicLevels(
    [],
    ['Playgroup', 'Nursery', 'LKG', 'UKG', 'Robotics Lab', 'Vedic Maths']
  );
  assert(resultEmpty.classes.includes('Robotics Lab'), 'Custom class survives level deselection');
  assert(resultEmpty.classes.includes('Vedic Maths'), 'Custom class survives level deselection');
  assert(resultEmpty.classes.length === 2, `Only 2 custom classes remain (got ${resultEmpty.classes.length})`);
}

// ─── TEST 9: Campus Isolation (Pure Function) ────────────────────────────────
console.log('\n--- TEST 9: Campus Isolation (Pure Function) ---');
{
  const campus1 = reconcileClassesForAcademicLevels(['Pre-Primary'], []);
  const campus2 = reconcileClassesForAcademicLevels(['Secondary'], []);
  
  assert(campus1.classes.length === 4, `Campus 1 has 4 Pre-Primary classes`);
  assert(campus2.classes.length === 2, `Campus 2 has 2 Secondary classes`);
  assert(campus1.classes.includes('Playgroup'), 'Campus 1 includes Playgroup');
  assert(!campus1.classes.includes('Class 9'), 'Campus 1 does NOT include Class 9');
  assert(campus2.classes.includes('Class 9'), 'Campus 2 includes Class 9');
  assert(!campus2.classes.includes('Playgroup'), 'Campus 2 does NOT include Playgroup');
}

// ─── TEST 10: Existing Persisted Data Hydration ──────────────────────────────
console.log('\n--- TEST 10: Existing Persisted Data Hydration ---');
{
  // If a campus already has Primary classes from a saved record, reconciliation preserves them
  const result = reconcileClassesForAcademicLevels(
    ['Primary'],
    ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5']
  );
  assertArrayEquals(
    result.classes,
    ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
    'Persisted Primary classes preserved on hydration'
  );
}

// ─── TEST 11: Class Range Derivation ─────────────────────────────────────────
console.log('\n--- TEST 11: Class Range Derivation ---');
{
  const prePrimary = reconcileClassesForAcademicLevels(['Pre-Primary'], []);
  assert(prePrimary.classRange === 'Playgroup to UKG', `Pre-Primary range: "${prePrimary.classRange}"`);

  const primary = reconcileClassesForAcademicLevels(['Primary'], []);
  assert(primary.classRange === 'Class 1 to Class 5', `Primary range: "${primary.classRange}"`);

  const combined = reconcileClassesForAcademicLevels(['Pre-Primary', 'Primary'], []);
  assert(combined.classRange === 'Playgroup to Class 5', `Combined range: "${combined.classRange}"`);

  const all = reconcileClassesForAcademicLevels(
    ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'],
    []
  );
  assert(all.classRange === 'Playgroup to Class 12', `Full range: "${all.classRange}"`);
  assert(all.classes.length === 16, `All 16 canonical classes (got ${all.classes.length})`);
}

// ─── TEST 12: No Selected Levels ─────────────────────────────────────────────
console.log('\n--- TEST 12: No Selected Levels → Empty ---');
{
  const result = reconcileClassesForAcademicLevels([], []);
  assert(result.classes.length === 0, `Empty levels → 0 classes (got ${result.classes.length})`);
  assert(result.classRange === '', `Empty levels → empty range (got "${result.classRange}")`);
}

console.log('\n===========================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
}
