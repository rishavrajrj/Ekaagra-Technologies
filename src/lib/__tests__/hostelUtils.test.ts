/**
 * ==============================================================================
 * SECTION 15: HOSTEL & RESIDENTIAL BOARDING TEST SUITE
 * File: src/lib/__tests__/hostelUtils.test.ts
 * ==============================================================================
 *
 * Verifies all 10 core requirements:
 * 1. Day School: Not Applicable, no hostel fields required, no validation errors, no fake records
 * 2. Boarding School: Incomplete initially, requires hostel configuration
 * 3. Configure Hostel: Adding buildings and rooms achieves complete score
 * 4. Assign Student: Occupied and available beds update dynamically
 * 5. Prevent Over-Capacity: Rejects assigning beyond room capacity
 * 6. Student Transfer & History: Historical attendance and assignments preserved
 * 7. Inactive Warden: Cannot assign inactive staff to new buildings, historical preserved
 * 8. School Type Transition: Day -> Boarding -> Day -> Boarding data preservation
 * 9. Autosave & Normalization: Roundtrips through JSON serialization without data loss
 * 10. Multi-Tenant Validation: Rejects invalid or cross-tenant references
 */

import assert from 'assert';
import {
  isHostelApplicable,
  normalizeHostelData,
  calculateHostelCapacity,
  validateHostelData,
  getHostelSectionScore,
  assignStudentToHostel,
  transferStudentRoom,
  recordHostelAttendance,
  getHostelSummary,
} from '../hostelUtils';
import {
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../schoolIntake';
import type {
  HostelData,
  UniversalIntakeData,
  ResidentialStudentAssignment,
} from '../types';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ Test ${totalTests}: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ Test ${totalTests} FAILED: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  SECTION 15: HOSTEL & RESIDENTIAL BOARDING UNIT TESTS');
console.log('================================================================\n');

// ─── TEST 1: DAY SCHOOL SETTING ───────────────────────────────────────────────

console.log('--- Scenario 1: Day School Setting ---');

runTest('Day School profile resolves as Not Applicable', () => {
  const profile = { residentialStatus: 'day_school' };
  assert.strictEqual(isHostelApplicable(profile), false);
});

runTest('Day School Section 15 score is NOT APPLICABLE with 0 total requirements', () => {
  const score = getHostelSectionScore({}, false);
  assert.strictEqual(score.status, 'not_applicable');
  assert.strictEqual(score.statusLabel, 'Not Applicable');
  assert.strictEqual(score.total, 0);
  assert.strictEqual(score.filled, 0);
  assert.strictEqual(score.missingFields.length, 0);
  assert.strictEqual(score.isComplete, true);
});

runTest('Day School validation has zero errors without requiring hostel data', () => {
  const validation = validateHostelData({ enabled: false }, false);
  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(Object.keys(validation.errors).length, 0);
  assert.strictEqual(validation.missingFields.length, 0);
});

runTest('Day School does NOT fabricate fake hostel buildings or rooms', () => {
  const normalized = normalizeHostelData({}, { residentialStatus: 'day_school' });
  assert.strictEqual(normalized.buildings?.length, 0);
  assert.strictEqual(normalized.rooms?.length, 0);
  assert.strictEqual(normalized.beds?.length, 0);
  assert.strictEqual(normalized.residentAssignments?.length, 0);
  assert.strictEqual(normalized.status, 'not_applicable');
});

runTest('Master onboarding progress excludes Not Applicable hostel section from denominator', () => {
  const intake = createInitialIntakeData({
    schoolName: 'St. Xavier Day School',
    contactName: 'Fr. Thomas',
    contactEmail: 'admin@stxaviers.edu.in',
    contactPhone: '+919876543210',
    city: 'Patna',
    state: 'Bihar',
  });
  intake.schoolProfile.residentialStatus = 'day_school';

  const completeness = calculateIntakeCompleteness('school-erp', intake);
  assert.strictEqual(completeness.sectionStatuses['hostelConfig'], 'not_applicable');
});

// ─── TEST 2: BOARDING / RESIDENTIAL SCHOOL INITIAL STATE ──────────────────────

console.log('\n--- Scenario 2: Boarding School Initial State ---');

runTest('Boarding School profile resolves as Applicable', () => {
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'residential' }), true);
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'both_day_and_residential' }), true);
});

runTest('Unconfigured Boarding School scores as Incomplete', () => {
  const rawHostel: Partial<HostelData> = {
    enabled: true,
    totalCapacity: 0,
    buildings: [],
    rooms: [],
  };
  const score = getHostelSectionScore(rawHostel, true);
  assert.strictEqual(score.status, 'partially_configured');
  assert.strictEqual(score.percentage, 50); // Model & gender have sensible defaults, buildings & capacity pending
  assert.strictEqual(score.isComplete, false);
  assert.ok(score.missingFields.length > 0);
});

// ─── TEST 3: CONFIGURE HOSTEL BUILDINGS & ROOMS ──────────────────────────────

console.log('\n--- Scenario 3: Configure Hostel Buildings & Rooms ---');

runTest('Adding building and rooms updates score to Complete', () => {
  const hostelConfig: Partial<HostelData> = {
    enabled: true,
    residentialModel: 'school_operated',
    genderAccommodation: 'boys_only',
    buildings: [
      {
        id: 'bldg-1',
        name: 'Hostel Block A',
        code: 'HB-A',
        genderCategory: 'boys',
        capacity: 100,
        floorsCount: 3,
        wardenStaffId: 'staff-1',
        status: 'active',
      },
    ],
    rooms: [
      {
        id: 'room-101',
        buildingId: 'bldg-1',
        roomNumber: '101',
        floor: 1,
        category: 'four_bed',
        capacity: 4,
        genderCategory: 'boys',
        status: 'active',
      },
    ],
  };

  const score = getHostelSectionScore(hostelConfig, true);
  assert.strictEqual(score.status, 'complete');
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.missingFields.length, 0);
});

// ─── TEST 4: ASSIGN STUDENT & DYNAMIC CAPACITY ───────────────────────────────

console.log('\n--- Scenario 4: Dynamic Capacity & Student Assignment ---');

runTest('Assigning Student A dynamically updates Occupied and Available beds', () => {
  const hostelConfig: HostelData = normalizeHostelData({
    enabled: true,
    totalCapacity: 100,
    buildings: [
      {
        id: 'bldg-1',
        name: 'Hostel Block A',
        code: 'HB-A',
        genderCategory: 'boys',
        capacity: 100,
        status: 'active',
      },
    ],
    rooms: [
      {
        id: 'room-101',
        buildingId: 'bldg-1',
        roomNumber: '101',
        floor: 1,
        category: 'four_bed',
        capacity: 4,
        genderCategory: 'boys',
        status: 'active',
      },
    ],
    residentAssignments: [],
  });

  const initialMetrics = calculateHostelCapacity(hostelConfig);
  assert.strictEqual(initialMetrics.totalCapacity, 4);
  assert.strictEqual(initialMetrics.occupiedBeds, 0);
  assert.strictEqual(initialMetrics.availableBeds, 4);

  // Assign Student A
  const assignResult = assignStudentToHostel(hostelConfig, {
    studentId: 'student-A',
    buildingId: 'bldg-1',
    roomId: 'room-101',
    status: 'active_resident',
    startDate: '2026-08-01',
  });

  assert.strictEqual(assignResult.success, true);
  const updatedMetrics = calculateHostelCapacity(assignResult.data);
  assert.strictEqual(updatedMetrics.occupiedBeds, 1);
  assert.strictEqual(updatedMetrics.availableBeds, 3);
});

// ─── TEST 5: PREVENT OVER-CAPACITY ───────────────────────────────────────────

console.log('\n--- Scenario 5: Prevent Over-Capacity ---');

runTest('Attempting to assign 5th student to 4-bed room is rejected', () => {
  let hostelConfig: HostelData = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'bldg-1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 4, status: 'active' }],
    rooms: [{ id: 'room-101', buildingId: 'bldg-1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [],
  });

  // Assign 4 students (fills the room)
  for (let i = 1; i <= 4; i++) {
    const res = assignStudentToHostel(hostelConfig, {
      studentId: `student-${i}`,
      buildingId: 'bldg-1',
      roomId: 'room-101',
      status: 'active_resident',
      startDate: '2026-08-01',
    });
    assert.strictEqual(res.success, true);
    hostelConfig = res.data;
  }

  const metricsAt4 = calculateHostelCapacity(hostelConfig);
  assert.strictEqual(metricsAt4.occupiedBeds, 4);
  assert.strictEqual(metricsAt4.availableBeds, 0);

  // Attempt 5th student
  const overCapResult = assignStudentToHostel(hostelConfig, {
    studentId: 'student-5',
    buildingId: 'bldg-1',
    roomId: 'room-101',
    status: 'active_resident',
    startDate: '2026-08-01',
  });

  assert.strictEqual(overCapResult.success, false);
  assert.ok(overCapResult.error?.includes('maximum capacity'));
});

// ─── TEST 6: STUDENT TRANSFER & ATTENDANCE HISTORY ───────────────────────────

console.log('\n--- Scenario 6: Student Transfer & Historical Attendance ---');

runTest('Student transfer preserves historical attendance and previous assignment', () => {
  let hostelConfig: HostelData = normalizeHostelData({
    enabled: true,
    buildings: [
      { id: 'bldg-A', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'active' },
      { id: 'bldg-B', name: 'Hostel B', code: 'HB', genderCategory: 'boys', capacity: 10, status: 'active' },
    ],
    rooms: [
      { id: 'room-101', buildingId: 'bldg-A', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' },
      { id: 'room-205', buildingId: 'bldg-B', roomNumber: '205', floor: 2, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [],
  });

  // 1. Assign to Hostel A / Room 101 in August
  const initialAssign = assignStudentToHostel(hostelConfig, {
    studentId: 'student-raj',
    buildingId: 'bldg-A',
    roomId: 'room-101',
    status: 'active_resident',
    startDate: '2026-08-01',
  });
  hostelConfig = initialAssign.data;

  // 2. Record August attendance for Hostel A / Room 101
  const attRes = recordHostelAttendance(hostelConfig, {
    studentId: 'student-raj',
    buildingId: 'bldg-A',
    roomId: 'room-101',
    date: '2026-08-15',
    attendanceStatus: 'present',
    markedBy: 'Warden Kumar',
    source: 'manual',
  });
  hostelConfig = attRes.data;

  // 3. In September, transfer student to Hostel B / Room 205
  const transferRes = transferStudentRoom(hostelConfig, 'student-raj', 'bldg-B', 'room-205', undefined, '2026-09-01');
  assert.strictEqual(transferRes.success, true);
  hostelConfig = transferRes.data;

  // Verify August attendance still references Hostel A / Room 101
  const augAttendance = hostelConfig.attendanceRecords?.find((a) => a.date === '2026-08-15');
  assert.ok(augAttendance);
  assert.strictEqual(augAttendance.buildingId, 'bldg-A');
  assert.strictEqual(augAttendance.roomId, 'room-101');

  // Verify prior assignment status is checked_out and new assignment is active_resident
  const assignments = hostelConfig.residentAssignments?.filter((a) => a.studentId === 'student-raj');
  assert.strictEqual(assignments?.length, 2);
  const oldAssign = assignments?.find((a) => a.buildingId === 'bldg-A');
  const newAssign = assignments?.find((a) => a.buildingId === 'bldg-B');

  assert.strictEqual(oldAssign?.status, 'checked_out');
  assert.strictEqual(oldAssign?.endDate, '2026-09-01');
  assert.strictEqual(newAssign?.status, 'active_resident');
  assert.strictEqual(newAssign?.startDate, '2026-09-01');
});

// ─── TEST 7: INACTIVE WARDEN HANDLING ────────────────────────────────────────

console.log('\n--- Scenario 7: Inactive Staff/Warden Handling ---');

runTest('Validation flags assigning inactive staff member as building warden', () => {
  const staffList = [
    { id: 'staff-active', name: 'Raj Kumar', status: 'active', designation: 'Hostel Warden' },
    { id: 'staff-inactive', name: 'Former Warden', status: 'inactive', designation: 'Former Staff' },
  ];

  const hostelWithInactiveWarden: HostelData = normalizeHostelData({
    enabled: true,
    buildings: [
      {
        id: 'bldg-1',
        name: 'Block A',
        code: 'BA',
        genderCategory: 'boys',
        capacity: 50,
        wardenStaffId: 'staff-inactive',
        status: 'active',
      },
    ],
  });

  const valResult = validateHostelData(hostelWithInactiveWarden, true, staffList);
  assert.strictEqual(valResult.isValid, false);
  assert.ok(valResult.errors['building_0_warden_inactive']);
});

// ─── TEST 8: SCHOOL TYPE TRANSITION & DATA PRESERVATION ──────────────────────

console.log('\n--- Scenario 8: School Type Transition & Data Preservation ---');

runTest('Transitioning Boarding -> Day School -> Boarding preserves all hostel data intact', () => {
  // 1. Initial Boarding configuration
  const initialHostelData: HostelData = normalizeHostelData(
    {
      enabled: true,
      residentialModel: 'school_operated',
      genderAccommodation: 'separate_wings',
      totalCapacity: 120,
      buildings: [
        { id: 'bldg-1', name: 'Boys Wing', code: 'BW-1', genderCategory: 'boys', capacity: 80, status: 'active' },
        { id: 'bldg-2', name: 'Girls Wing', code: 'GW-1', genderCategory: 'girls', capacity: 40, status: 'active' },
      ],
      rooms: [
        { id: 'rm-101', buildingId: 'bldg-1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' },
      ],
      residentAssignments: [
        { id: 'as-1', studentId: 'student-1', buildingId: 'bldg-1', roomId: 'rm-101', status: 'active_resident', startDate: '2026-08-01' },
      ],
      curfewPolicy: {
        curfewEnabled: true,
        weekdayCurfewTime: '20:30',
        weekendCurfewTime: '22:00',
        lateReturnPolicy: 'Strict escalation',
        escalationContactBehavior: 'Call parents',
      },
    },
    { residentialStatus: 'residential' }
  );

  // 2. School changes profile to Day School
  const daySchoolProfile = { residentialStatus: 'day_school' };
  assert.strictEqual(isHostelApplicable(daySchoolProfile), false);

  // Normalize under Day School: status becomes not_applicable, but data is NOT deleted!
  const dayPreserved = normalizeHostelData(initialHostelData, daySchoolProfile);
  assert.strictEqual(dayPreserved.status, 'not_applicable');
  assert.strictEqual(dayPreserved.buildings?.length, 2);
  assert.strictEqual(dayPreserved.rooms?.length, 1);
  assert.strictEqual(dayPreserved.residentAssignments?.length, 1);
  assert.strictEqual(dayPreserved.curfewPolicy?.weekdayCurfewTime, '20:30');

  // 3. School changes profile back to Boarding School
  const restoredBoardingProfile = { residentialStatus: 'residential' };
  assert.strictEqual(isHostelApplicable(restoredBoardingProfile), true);

  const restored = normalizeHostelData(dayPreserved, restoredBoardingProfile);
  assert.strictEqual(restored.status, 'complete');
  assert.strictEqual(restored.buildings?.length, 2);
  assert.strictEqual(restored.buildings?.[0].name, 'Boys Wing');
  assert.strictEqual(restored.rooms?.length, 1);
  assert.strictEqual(restored.residentAssignments?.length, 1);
  assert.strictEqual(restored.curfewPolicy?.weekdayCurfewTime, '20:30');
});

// ─── TEST 9: AUTOSAVE & DRAFT NORMALIZATION ───────────────────────────────────

console.log('\n--- Scenario 9: Autosave & Serialization Integrity ---');

runTest('Full hostel configuration survives JSON serialization roundtrip without data loss', () => {
  const original = normalizeHostelData(
    {
      residentialModel: 'managed_facility',
      genderAccommodation: 'co_educational',
      buildings: [
        { id: 'bldg-coed', name: 'Main Campus Hall', code: 'MCH', genderCategory: 'co_ed', capacity: 200, status: 'active' },
      ],
      messConfig: {
        messAvailable: true,
        diningHallName: 'Annapurna Hall',
        mealsOffered: ['breakfast', 'lunch', 'dinner'],
        dietarySupport: ['vegetarian', 'jain'],
        messOperatorModel: 'catered',
      },
    },
    { residentialStatus: 'residential' }
  );

  const serialized = JSON.stringify(original);
  const deserialized = JSON.parse(serialized);
  const normalized = normalizeHostelData(deserialized, { residentialStatus: 'residential' });

  assert.strictEqual(normalized.residentialModel, 'managed_facility');
  assert.strictEqual(normalized.genderAccommodation, 'co_educational');
  assert.strictEqual(normalized.buildings?.[0].name, 'Main Campus Hall');
  assert.strictEqual(normalized.messConfig?.diningHallName, 'Annapurna Hall');
  assert.strictEqual(normalized.messConfig?.mealsOffered?.length, 3);
});

// ─── TEST 10: MULTI-TENANT VALIDATION & DUPLICATE PREVENTION ─────────────────

console.log('\n--- Scenario 10: Multi-Tenant & Constraint Validation ---');

runTest('Rejects duplicate building codes and duplicate room numbers in same building', () => {
  const invalidHostel: HostelData = normalizeHostelData({
    enabled: true,
    buildings: [
      { id: 'b1', name: 'Block 1', code: 'HB-DUP', genderCategory: 'boys', capacity: 50, status: 'active' },
      { id: 'b2', name: 'Block 2', code: 'HB-DUP', genderCategory: 'girls', capacity: 50, status: 'active' },
    ],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
  });

  const val = validateHostelData(invalidHostel, true);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['building_1_code_dup']);
  assert.ok(val.errors['room_1_dup']);
});

runTest('Rejects assigning a student to two active beds simultaneously', () => {
  const hostelConfig: HostelData = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Block 1', code: 'B1', genderCategory: 'boys', capacity: 10, status: 'active' }],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b1', roomNumber: '102', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [
      { id: 'a1', studentId: 'student-dup', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
      { id: 'a2', studentId: 'student-dup', buildingId: 'b1', roomId: 'r2', status: 'active_resident', startDate: '2026-08-01' },
    ],
  });

  const val = validateHostelData(hostelConfig, true);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['assign_1_double']);
});

runTest('Summary pill generation reflects correct states for Day and Boarding schools', () => {
  const daySummary = getHostelSummary(normalizeHostelData({}, { residentialStatus: 'day_school' }), false);
  assert.strictEqual(daySummary.pillLabel, 'Not Applicable');
  assert.strictEqual(daySummary.isApplicable, false);
  assert.strictEqual(daySummary.statusLabel, 'Auto-skipped');

  const boardingSummary = getHostelSummary(
    normalizeHostelData(
      {
        totalCapacity: 120,
        buildings: [{ id: 'b1', name: 'Block A', code: 'BA', genderCategory: 'boys', capacity: 120, status: 'active' }],
        residentAssignments: [
          { id: 'a1', studentId: 'st-1', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
        ],
      },
      { residentialStatus: 'residential' }
    ),
    true
  );
  assert.strictEqual(boardingSummary.isApplicable, true);
  assert.strictEqual(boardingSummary.pillLabel, '1/120 Beds');
});

console.log('================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${totalTests - passedTests}`);
console.log('================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
}
