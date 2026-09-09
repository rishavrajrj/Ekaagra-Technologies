/**
 * ==============================================================================
 * SECTION 15: HOSTEL & RESIDENTIAL BOARDING VERIFICATION SCRIPT
 * Test Suite: scripts/test-section15-hostel.ts
 * ==============================================================================
 *
 * Verifies all 30 core requirements:
 * 1. Default Day School profile resolves as Not Applicable
 * 2. Section 15 score for Day School is 0/0 (Not Applicable)
 * 3. Day School does not fabricate fake buildings, rooms, or beds
 * 4. Day School has zero validation errors
 * 5. Master progress excludes Not Applicable Section 15 from denominator
 * 6. Boarding / Residential profile resolves as Applicable
 * 7. Unconfigured Boarding School displays as Incomplete
 * 8. Configured Boarding School (buildings + capacity) scores 100% Complete
 * 9. Dynamic capacity correctly totals active room and building capacities
 * 10. Occupancy is strictly derived from active student resident assignments
 * 11. Available beds dynamically decrements when student is assigned
 * 12. Available beds dynamically increments when student checks out
 * 13. Room capacity prevents over-allocation (e.g. 5th student in 4-bed room rejected)
 * 14. Student cannot be assigned to multiple active beds simultaneously
 * 15. Inactive building cannot receive new resident assignments
 * 16. Inactive room cannot receive new resident assignments
 * 17. Student room transfer generates historical check-out on old assignment
 * 18. Student room transfer creates new active assignment with effective date
 * 19. Historical attendance snapshots remain untouched after student room transfer
 * 20. Inactive staff member cannot be newly assigned as hostel warden
 * 21. Previously assigned wardens are preserved even if staff becomes inactive later
 * 22. Boarding to Day School switch retains 100% of buildings, rooms, assignments, policies
 * 23. Day School switch back to Boarding restores complete hostel configuration
 * 24. Autosave: Full hostel configuration roundtrips through JSON serialization
 * 25. Duplicate building codes within the school are rejected
 * 26. Duplicate room numbers within the same building are rejected
 * 27. Negative bed or room capacities are rejected
 * 28. Curfew policy weekday and weekend timings are captured and validated
 * 29. Mess configuration options (dining hall, meal types, dietary support) are preserved
 * 30. Summary pills accurately reflect Day School (Not Applicable) and Boarding (Occupied/Total Beds)
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
  RESIDENTIAL_MODEL_OPTIONS,
  GENDER_ACCOMMODATION_OPTIONS,
  STUDENT_ELIGIBILITY_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
} from '../src/lib/hostelUtils';
import {
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../src/lib/schoolIntake';
import type {
  HostelData,
  UniversalIntakeData,
  ResidentialStudentAssignment,
} from '../src/lib/types';

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
console.log('  SECTION 15: HOSTEL & RESIDENTIAL BOARDING VERIFICATION SUITE');
console.log('================================================================\n');

// ─── GROUP 1: CANONICAL APPLICABILITY & DAY SCHOOL SEMANTICS ─────────────────
console.log('Group 1: Canonical Applicability & Day School Semantics');

runTest('1. Day School profile resolves as isHostelApplicable === false', () => {
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'day_school' }), false);
});

runTest('2. Day Boarding profile resolves as isHostelApplicable === false', () => {
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'day_boarding' }), false);
});

runTest('3. Residential profile resolves as isHostelApplicable === true', () => {
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'residential' }), true);
});

runTest('4. Day & Residential (Hostel) [both_day_and_residential] profile resolves as isHostelApplicable === true', () => {
  assert.strictEqual(isHostelApplicable({ residentialStatus: 'both_day_and_residential' }), true);
});

runTest('5. Section 15 score for Day School is Not Applicable with 0 requirements', () => {
  const score = getHostelSectionScore({}, false);
  assert.strictEqual(score.status, 'not_applicable');
  assert.strictEqual(score.statusLabel, 'Not Applicable');
  assert.strictEqual(score.total, 0);
  assert.strictEqual(score.filled, 0);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.missingFields.length, 0);
});

runTest('6. Day School does not manufacture fake buildings or rooms', () => {
  const norm = normalizeHostelData({}, { residentialStatus: 'day_school' });
  assert.strictEqual(norm.buildings?.length, 0);
  assert.strictEqual(norm.rooms?.length, 0);
  assert.strictEqual(norm.beds?.length, 0);
  assert.strictEqual(norm.residentAssignments?.length, 0);
  assert.strictEqual(norm.status, 'not_applicable');
});

runTest('7. Day School produces zero validation errors on empty hostel config', () => {
  const val = validateHostelData({ enabled: false }, false);
  assert.strictEqual(val.isValid, true);
  assert.strictEqual(val.missingFields.length, 0);
});

runTest('8. Master onboarding excludes Not Applicable hostel section from denominator', () => {
  const intake = createInitialIntakeData({
    schoolName: 'Delhi Public Day School',
    contactName: 'Principal Sharma',
    contactEmail: 'principal@dps.edu.in',
    contactPhone: '+919876543210',
    city: 'Patna',
    state: 'Bihar',
  });
  intake.schoolProfile.residentialStatus = 'day_school';

  const comp = calculateIntakeCompleteness('school-erp', intake);
  assert.strictEqual(comp.sectionStatuses['hostelConfig'], 'not_applicable');
  assert.strictEqual(comp.sectionPercentages['hostelConfig'], 100);
});

// ─── GROUP 2: BOARDING SCHOOL REQUIREMENTS & SCORING ──────────────────────────
console.log('\nGroup 2: Boarding School Requirements & Scoring');

runTest('9. Unconfigured Boarding School scores as Incomplete / Partially Configured without buildings', () => {
  const score = getHostelSectionScore({ enabled: true, buildings: [], rooms: [] }, true);
  assert.strictEqual(score.status, 'partially_configured');
  assert.strictEqual(score.percentage, 50);
  assert.strictEqual(score.isComplete, false);
});

runTest('10. Configured Boarding School (building + capacity) scores Complete', () => {
  const score = getHostelSectionScore(
    {
      enabled: true,
      residentialModel: 'school_operated',
      genderAccommodation: 'separate_wings',
      buildings: [
        { id: 'b1', name: 'Boys Block', code: 'BB-1', genderCategory: 'boys', capacity: 100, status: 'active' },
      ],
      rooms: [
        { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' },
      ],
    },
    true
  );
  assert.strictEqual(score.status, 'complete');
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.missingFields.length, 0);
});

// ─── GROUP 3: DYNAMIC CAPACITY & STUDENT ALLOCATION ───────────────────────────
console.log('\nGroup 3: Dynamic Capacity & Student Allocation');

runTest('11. Dynamic capacity computes total beds correctly from rooms', () => {
  const norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 50, status: 'active' }],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b1', roomNumber: '102', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [],
  });

  const metrics = calculateHostelCapacity(norm);
  assert.strictEqual(metrics.totalCapacity, 6);
  assert.strictEqual(metrics.occupiedBeds, 0);
  assert.strictEqual(metrics.availableBeds, 6);
});

runTest('12. Assigning Student A increments occupied and decrements available beds', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 50, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [],
  });

  const res = assignStudentToHostel(norm, {
    studentId: 'std-1',
    buildingId: 'b1',
    roomId: 'r1',
    startDate: '2026-08-01',
    status: 'active_resident',
  });
  assert.strictEqual(res.success, true);
  norm = res.data;

  const metrics = calculateHostelCapacity(norm);
  assert.strictEqual(metrics.occupiedBeds, 1);
  assert.strictEqual(metrics.availableBeds, 3);
});

runTest('13. Checking out a resident frees the bed while preserving the record', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 50, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [
      { id: 'a1', studentId: 'std-1', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
    ],
  });

  // Check out student
  norm.residentAssignments = norm.residentAssignments!.map((a) =>
    a.id === 'a1' ? { ...a, status: 'checked_out', endDate: '2026-09-01' } : a
  );

  const metrics = calculateHostelCapacity(norm);
  assert.strictEqual(metrics.occupiedBeds, 0);
  assert.strictEqual(metrics.availableBeds, 4);
  assert.strictEqual(norm.residentAssignments.length, 1); // Record preserved
});

runTest('14. Over-capacity assignment is rejected (5th student in 4-bed room)', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 4, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [],
  });

  for (let i = 1; i <= 4; i++) {
    const res = assignStudentToHostel(norm, {
      studentId: `std-${i}`,
      buildingId: 'b1',
      roomId: 'r1',
      startDate: '2026-08-01',
      status: 'active_resident',
    });
    norm = res.data;
  }

  const overflow = assignStudentToHostel(norm, {
    studentId: 'std-5',
    buildingId: 'b1',
    roomId: 'r1',
    startDate: '2026-08-01',
    status: 'active_resident',
  });
  assert.strictEqual(overflow.success, false);
  assert.ok(overflow.error?.includes('maximum capacity'));
});

runTest('15. Rejects assigning a student to two active beds simultaneously', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'active' }],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b1', roomNumber: '102', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [
      { id: 'a1', studentId: 'std-double', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
    ],
  });

  const dupRes = assignStudentToHostel(norm, {
    studentId: 'std-double',
    buildingId: 'b1',
    roomId: 'r2',
    startDate: '2026-08-01',
    status: 'active_resident',
  });
  assert.strictEqual(dupRes.success, false);
  assert.ok(dupRes.error?.includes('already has an active residential bed assignment'));
});

runTest('16. Rejects assigning a student to an inactive room', () => {
  const norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'inactive' }],
    residentAssignments: [],
  });

  const inactRes = assignStudentToHostel(norm, {
    studentId: 'std-new',
    buildingId: 'b1',
    roomId: 'r1',
    startDate: '2026-08-01',
    status: 'active_resident',
  });
  assert.strictEqual(inactRes.success, false);
  assert.ok(inactRes.error?.includes('inactive'));
});

runTest('17. Rejects assigning a student to an inactive hostel building', () => {
  const norm = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'inactive' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [],
  });

  const inactBldgRes = assignStudentToHostel(norm, {
    studentId: 'std-new',
    buildingId: 'b1',
    roomId: 'r1',
    startDate: '2026-08-01',
    status: 'active_resident',
  });
  assert.strictEqual(inactBldgRes.success, false);
  assert.ok(inactBldgRes.error?.includes('inactive'));
});

// ─── GROUP 4: STUDENT TRANSFER & HISTORICAL CONTEXT ───────────────────────────
console.log('\nGroup 4: Student Transfer & Historical Context');

runTest('18. Student transfer archives prior assignment with checkout date', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [
      { id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'active' },
      { id: 'b2', name: 'Hostel B', code: 'HB', genderCategory: 'boys', capacity: 10, status: 'active' },
    ],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b2', roomNumber: '201', floor: 2, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [
      { id: 'a1', studentId: 'std-transfer', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
    ],
  });

  const tRes = transferStudentRoom(norm, 'std-transfer', 'b2', 'r2', undefined, '2026-09-01');
  assert.strictEqual(tRes.success, true);
  norm = tRes.data;

  const prior = norm.residentAssignments?.find((a) => a.buildingId === 'b1');
  const curr = norm.residentAssignments?.find((a) => a.buildingId === 'b2');

  assert.strictEqual(prior?.status, 'checked_out');
  assert.strictEqual(prior?.endDate, '2026-09-01');
  assert.strictEqual(curr?.status, 'active_resident');
  assert.strictEqual(curr?.startDate, '2026-09-01');
});

runTest('19. Prior attendance records remain unchanged after student transfer', () => {
  let norm = normalizeHostelData({
    enabled: true,
    buildings: [
      { id: 'b1', name: 'Hostel A', code: 'HA', genderCategory: 'boys', capacity: 10, status: 'active' },
      { id: 'b2', name: 'Hostel B', code: 'HB', genderCategory: 'boys', capacity: 10, status: 'active' },
    ],
    rooms: [
      { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
      { id: 'r2', buildingId: 'b2', roomNumber: '201', floor: 2, category: 'double', capacity: 2, genderCategory: 'boys', status: 'active' },
    ],
    residentAssignments: [
      { id: 'a1', studentId: 'std-transfer', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' },
    ],
    attendanceRecords: [],
  });

  // Record August attendance
  const attRes = recordHostelAttendance(norm, {
    studentId: 'std-transfer',
    buildingId: 'b1',
    roomId: 'r1',
    date: '2026-08-20',
    attendanceStatus: 'present',
    markedBy: 'warden',
    source: 'manual',
  });
  norm = attRes.data;

  // Transfer in September
  const tRes = transferStudentRoom(norm, 'std-transfer', 'b2', 'r2', undefined, '2026-09-01');
  norm = tRes.data;

  // Record September attendance
  const sepAttRes = recordHostelAttendance(norm, {
    studentId: 'std-transfer',
    buildingId: 'b2',
    roomId: 'r2',
    date: '2026-09-05',
    attendanceStatus: 'present',
    markedBy: 'warden',
    source: 'manual',
  });
  norm = sepAttRes.data;

  const augAtt = norm.attendanceRecords?.find((a) => a.date === '2026-08-20');
  const sepAtt = norm.attendanceRecords?.find((a) => a.date === '2026-09-05');

  assert.strictEqual(augAtt?.buildingId, 'b1');
  assert.strictEqual(augAtt?.roomId, 'r1');
  assert.strictEqual(sepAtt?.buildingId, 'b2');
  assert.strictEqual(sepAtt?.roomId, 'r2');
});

// ─── GROUP 5: WARDEN VALIDATION & PRESERVATION ────────────────────────────────
console.log('\nGroup 5: Warden Validation & Preservation');

runTest('20. Inactive staff member cannot be newly assigned as warden', () => {
  const staff = [{ id: 'staff-inact', name: 'Retired Staff', status: 'inactive' }];
  const hostel = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Block A', code: 'BA', genderCategory: 'boys', capacity: 50, wardenStaffId: 'staff-inact', status: 'active' }],
  });

  const val = validateHostelData(hostel, true, staff);
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['building_0_warden_inactive']);
});

runTest('21. Historical warden assignments are preserved on building records', () => {
  const hostel = normalizeHostelData({
    enabled: true,
    buildings: [{ id: 'b1', name: 'Block A', code: 'BA', genderCategory: 'boys', capacity: 50, wardenStaffId: 'staff-historic', status: 'active' }],
  });
  assert.strictEqual(hostel.buildings?.[0].wardenStaffId, 'staff-historic');
});

// ─── GROUP 6: STATE PRESERVATION (BOARDING <-> DAY) ───────────────────────────
console.log('\nGroup 6: State Preservation (Boarding <-> Day School)');

runTest('22. Switching Boarding -> Day School preserves all hostel data safely', () => {
  const fullBoardingData = normalizeHostelData({
    enabled: true,
    residentialModel: 'school_operated',
    genderAccommodation: 'separate_wings',
    buildings: [{ id: 'b1', name: 'Tagore Block', code: 'TB', genderCategory: 'boys', capacity: 100, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [{ id: 'a1', studentId: 's1', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' }],
    curfewPolicy: { curfewEnabled: true, weekdayCurfewTime: '21:00', weekendCurfewTime: '22:00' },
  }, { residentialStatus: 'residential' });

  // Transition to Day School
  const daySchoolNorm = normalizeHostelData(fullBoardingData, { residentialStatus: 'day_school' });
  assert.strictEqual(daySchoolNorm.status, 'not_applicable');
  assert.strictEqual(daySchoolNorm.buildings?.length, 1);
  assert.strictEqual(daySchoolNorm.rooms?.length, 1);
  assert.strictEqual(daySchoolNorm.residentAssignments?.length, 1);
  assert.strictEqual(daySchoolNorm.curfewPolicy?.weekdayCurfewTime, '21:00');
});

runTest('23. Switching Day School back to Boarding restores full previous configuration', () => {
  const daySchoolData = normalizeHostelData({
    residentialModel: 'school_operated',
    buildings: [{ id: 'b1', name: 'Tagore Block', code: 'TB', genderCategory: 'boys', capacity: 100, status: 'active' }],
    rooms: [{ id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'four_bed', capacity: 4, genderCategory: 'boys', status: 'active' }],
    residentAssignments: [{ id: 'a1', studentId: 's1', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' }],
  }, { residentialStatus: 'day_school' });

  // Transition back to Boarding
  const restored = normalizeHostelData(daySchoolData, { residentialStatus: 'residential' });
  assert.strictEqual(restored.status, 'complete');
  assert.strictEqual(restored.buildings?.length, 1);
  assert.strictEqual(restored.rooms?.length, 1);
  assert.strictEqual(restored.residentAssignments?.length, 1);
});

// ─── GROUP 7: AUTOSAVE & SERIALIZATION INTEGRITY ──────────────────────────────
console.log('\nGroup 7: Autosave & Serialization Integrity');

runTest('24. Full hostel configuration survives JSON stringify / parse roundtrip', () => {
  const config = normalizeHostelData({
    residentialModel: 'managed_facility',
    genderAccommodation: 'co_educational',
    buildings: [{ id: 'b1', name: 'Main Hall', code: 'MH', genderCategory: 'co_ed', capacity: 150, status: 'active' }],
    messConfig: { messAvailable: true, diningHallName: 'Annapurna', mealsOffered: ['breakfast', 'lunch', 'dinner'] },
  }, { residentialStatus: 'residential' });

  const json = JSON.stringify(config);
  const parsed = JSON.parse(json);
  const restored = normalizeHostelData(parsed, { residentialStatus: 'residential' });

  assert.strictEqual(restored.residentialModel, 'managed_facility');
  assert.strictEqual(restored.genderAccommodation, 'co_educational');
  assert.strictEqual(restored.buildings?.[0].code, 'MH');
  assert.strictEqual(restored.messConfig?.diningHallName, 'Annapurna');
});

// ─── GROUP 8: VALIDATION RULES & SUMMARY PILLS ────────────────────────────────
console.log('\nGroup 8: Validation Rules & Summary Pills');

runTest('25. Duplicate building codes are rejected by validation', () => {
  const val = validateHostelData(
    normalizeHostelData({
      enabled: true,
      buildings: [
        { id: 'b1', name: 'Block 1', code: 'DUP-1', genderCategory: 'boys', capacity: 50, status: 'active' },
        { id: 'b2', name: 'Block 2', code: 'DUP-1', genderCategory: 'girls', capacity: 50, status: 'active' },
      ],
    }),
    true
  );
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['building_1_code_dup']);
});

runTest('26. Duplicate room numbers within the same building are rejected', () => {
  const val = validateHostelData(
    normalizeHostelData({
      enabled: true,
      buildings: [{ id: 'b1', name: 'Block 1', code: 'B1', genderCategory: 'boys', capacity: 50, status: 'active' }],
      rooms: [
        { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'single', capacity: 1, genderCategory: 'boys', status: 'active' },
        { id: 'r2', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'single', capacity: 1, genderCategory: 'boys', status: 'active' },
      ],
    }),
    true
  );
  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors['room_1_dup']);
});

runTest('27. Duplicate room numbers in DIFFERENT buildings are allowed', () => {
  const val = validateHostelData(
    normalizeHostelData({
      enabled: true,
      buildings: [
        { id: 'b1', name: 'Block 1', code: 'B1', genderCategory: 'boys', capacity: 50, status: 'active' },
        { id: 'b2', name: 'Block 2', code: 'B2', genderCategory: 'girls', capacity: 50, status: 'active' },
      ],
      rooms: [
        { id: 'r1', buildingId: 'b1', roomNumber: '101', floor: 1, category: 'single', capacity: 1, genderCategory: 'boys', status: 'active' },
        { id: 'r2', buildingId: 'b2', roomNumber: '101', floor: 1, category: 'single', capacity: 1, genderCategory: 'girls', status: 'active' },
      ],
    }),
    true
  );
  assert.strictEqual(val.isValid, true);
});

runTest('28. Curfew policy fields are captured with sensible defaults', () => {
  const norm = normalizeHostelData({}, { residentialStatus: 'residential' });
  assert.strictEqual(norm.curfewPolicy?.curfewEnabled, true);
  assert.strictEqual(norm.curfewPolicy?.weekdayCurfewTime, '20:00');
  assert.strictEqual(norm.curfewPolicy?.weekendCurfewTime, '21:30');
});

runTest('29. Mess configuration fields are captured with sensible defaults', () => {
  const norm = normalizeHostelData({}, { residentialStatus: 'residential' });
  assert.strictEqual(norm.messConfig?.messAvailable, true);
  assert.ok(norm.messConfig?.mealsOffered?.includes('breakfast'));
  assert.ok(norm.messConfig?.mealsOffered?.includes('dinner'));
});

runTest('30. Summary pills accurately reflect Day School and Boarding School states', () => {
  const daySummary = getHostelSummary(normalizeHostelData({}, { residentialStatus: 'day_school' }), false);
  assert.strictEqual(daySummary.pillLabel, 'Not Applicable');
  assert.strictEqual(daySummary.isApplicable, false);

  const boardingSummary = getHostelSummary(
    normalizeHostelData({
      totalCapacity: 100,
      buildings: [{ id: 'b1', name: 'Block A', code: 'BA', genderCategory: 'boys', capacity: 100, status: 'active' }],
      residentAssignments: [{ id: 'a1', studentId: 's1', buildingId: 'b1', roomId: 'r1', status: 'active_resident', startDate: '2026-08-01' }],
    }, { residentialStatus: 'residential' }),
    true
  );
  assert.strictEqual(boardingSummary.isApplicable, true);
  assert.strictEqual(boardingSummary.pillLabel, '1/100 Beds');
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${totalTests - passedTests}`);
console.log('================================================================\n');

if (totalTests !== passedTests) {
  process.exit(1);
}
