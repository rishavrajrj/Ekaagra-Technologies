import {
  calculateCampusStatistics,
  syncDerivedStatisticsToFacilities,
  isTeachingRole,
  isStudentActive,
  isStaffActive,
} from '../campusStatisticsUtils';
import type { UniversalIntakeData, Student } from '../types';

function runCampusStatisticsTestSuite() {
  console.log('🧪 Starting Campus Statistics & Institutional Metrics Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  const baseData: Partial<UniversalIntakeData> = {
    institutionStructure: {
      currentAcademicSession: '2026-2027',
    } as any,
    facilitiesConfig: {
      classroomsCount: 24,
    },
    students: [],
    staffFaculty: {
      staffMembers: [],
    } as any,
  };

  // TEST 1: Empty state produces 0 for all dynamic counts
  {
    const stats = calculateCampusStatistics(baseData);
    assert(stats.totalStudents === 0, 'Empty database: Total Students is 0');
    assert(stats.activeStudents === 0, 'Empty database: Active Students is 0');
    assert(stats.totalTeachers === 0, 'Empty database: Total Teachers is 0');
    assert(stats.totalNonTeachingStaff === 0, 'Empty database: Non-Teaching Staff is 0');
  }

  // TEST 2: Add new active student in current session
  // Total Students +1, Active Students +1
  const student1: Student = {
    id: 'stud-1',
    school_id: '19123456789',
    admission_number: 'ADM-2026-001',
    first_name: 'Aarav',
    last_name: 'Sharma',
    status: 'active',
    academic_session: '2026-2027',
  };

  let testData: Partial<UniversalIntakeData> = {
    ...baseData,
    students: [student1],
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalStudents === 1, 'Add new active student: Total Students +1 (expected 1)', stats);
    assert(stats.activeStudents === 1, 'Add new active student: Active Students +1 (expected 1)', stats);
  }

  // TEST 3: Add second student
  const student2: Student = {
    id: 'stud-2',
    school_id: '19123456789',
    admission_number: 'ADM-2026-002',
    first_name: 'Diya',
    last_name: 'Patel',
    status: 'active',
    academic_session: '2026-2027',
  };

  testData = {
    ...testData,
    students: [student1, student2],
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalStudents === 2, 'Add 2nd student: Total Students = 2', stats);
    assert(stats.activeStudents === 2, 'Add 2nd student: Active Students = 2', stats);
  }

  // TEST 4: Graduate student 1
  // Total Students unchanged, Active Students -1
  const student1Graduated: Student = {
    ...student1,
    status: 'graduated',
  };

  testData = {
    ...testData,
    students: [student1Graduated, student2],
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalStudents === 2, 'Graduate student: Total Students UNCHANGED at 2', stats);
    assert(stats.activeStudents === 1, 'Graduate student: Active Students decreased to 1', stats);
    assert(stats.graduatedStudentsCount === 1, 'Graduated count is 1', stats);
  }

  // TEST 5: Withdraw student 2
  // Total Students unchanged, Active Students -1
  const student2Withdrawn: Student = {
    ...student2,
    status: 'withdrawn',
  };

  testData = {
    ...testData,
    students: [student1Graduated, student2Withdrawn],
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalStudents === 2, 'Withdraw student: Total Students UNCHANGED at 2', stats);
    assert(stats.activeStudents === 0, 'Withdraw student: Active Students decreased to 0', stats);
    assert(stats.withdrawnStudentsCount === 1, 'Withdrawn count is 1', stats);
  }

  // TEST 6: Add student for FUTURE session (2027-2028)
  // Total Students +1, Current Active Students unchanged (0)
  const studentFuture: Student = {
    id: 'stud-3',
    school_id: '19123456789',
    admission_number: 'ADM-2027-001',
    first_name: 'Rohan',
    status: 'active',
    academic_session: '2027-2028',
  };

  testData = {
    ...testData,
    students: [student1Graduated, student2Withdrawn, studentFuture],
  };

  {
    const statsCurrent = calculateCampusStatistics(testData, { selectedSession: '2026-2027' });
    assert(statsCurrent.totalStudents === 3, 'Future student: Total Students = 3', statsCurrent);
    assert(statsCurrent.activeStudents === 0, 'Future student: Current session (2026-2027) Active Students remains 0', statsCurrent);

    const statsFuture = calculateCampusStatistics(testData, { selectedSession: '2027-2028' });
    assert(statsFuture.activeStudents === 1, 'Future student: Target session (2027-2028) Active Students = 1', statsFuture);
  }

  // TEST 7: Duplicate student across multiple sessions / enrollments
  // Total Students counted once (duplicate protection), Active count based on selected session
  const studentMultiSession: Student = {
    id: 'stud-4',
    school_id: '19123456789',
    admission_number: 'ADM-2025-099',
    first_name: 'Ananya',
    status: 'active',
    enrollments: [
      { session: '2025-2026', status: 'active' },
      { session: '2026-2027', status: 'active' },
      { session: '2027-2028', status: 'active' },
    ],
  };

  // Add identical student via studentConfig.students as well to test cross-array deduplication
  testData = {
    ...testData,
    students: [student1Graduated, student2Withdrawn, studentFuture, studentMultiSession],
    studentConfig: {
      students: [{ ...studentMultiSession }], // duplicate copy
    },
  };

  {
    const stats = calculateCampusStatistics(testData, { selectedSession: '2026-2027' });
    assert(stats.totalStudents === 4, 'Duplicate protection: Student in multiple sessions & arrays counted once in Total Students', stats);
    assert(stats.activeStudents === 1, 'Multi-session student: Correctly active in 2026-2027', stats);
  }

  // TEST 8: Historical Pre-Digital Students Fallback
  // Total Students = Historical Pre-Digital + Unique Digital Students
  testData = {
    ...testData,
    facilitiesConfig: {
      ...testData.facilitiesConfig,
      historicalPreDigitalStudents: 8500,
    },
  };

  {
    const stats = calculateCampusStatistics(testData, { selectedSession: '2026-2027' });
    assert(stats.totalStudents === 8504, 'Pre-digital fallback: 8500 + 4 digital = 8504 Total Students', stats);
    assert(stats.historicalPreDigitalStudents === 8500, 'historicalPreDigitalStudents is preserved as 8500', stats);
  }

  // TEST 9: Staff & Faculty Lifecycle
  // 1. Add active teacher -> Faculty +1
  const teacher1 = {
    name: 'Suresh Verma',
    employeeCode: 'FAC-001',
    designation: 'PGT Mathematics Teacher',
    status: 'active',
    category: 'teaching',
  };

  testData = {
    ...testData,
    staffFaculty: {
      staffMembers: [teacher1],
    } as any,
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalTeachers === 1, 'Add active teacher: Total Teachers = 1', stats);
    assert(stats.totalNonTeachingStaff === 0, 'No non-teaching staff yet: Non-Teaching = 0', stats);
  }

  // 2. Deactivate teacher -> Faculty -1
  const teacher1Inactive = {
    ...teacher1,
    status: 'inactive',
  };

  testData = {
    ...testData,
    staffFaculty: {
      staffMembers: [teacher1Inactive],
    } as any,
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalTeachers === 0, 'Deactivate teacher: Total Teachers decreases to 0', stats);
  }

  // 3. Add non-teaching employee -> Non-Teaching +1
  const nonTeaching1 = {
    name: 'Ramesh Kumar',
    employeeCode: 'STF-001',
    designation: 'Senior Accountant & Administrator',
    status: 'active',
    category: 'non_teaching',
  };

  testData = {
    ...testData,
    staffFaculty: {
      staffMembers: [teacher1, nonTeaching1],
    } as any,
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalTeachers === 1, 'With active teacher & active non-teaching: Teachers = 1', stats);
    assert(stats.totalNonTeachingStaff === 1, 'Add non-teaching employee: Non-Teaching Staff = 1', stats);
  }

  // 4. Deactivate non-teaching employee -> Non-Teaching -1
  const nonTeaching1Terminated = {
    ...nonTeaching1,
    status: 'terminated',
  };

  testData = {
    ...testData,
    staffFaculty: {
      staffMembers: [teacher1, nonTeaching1Terminated],
    } as any,
  };

  {
    const stats = calculateCampusStatistics(testData);
    assert(stats.totalNonTeachingStaff === 0, 'Deactivate non-teaching employee: Non-Teaching Staff decreases to 0', stats);
  }

  // TEST 10: Infrastructure Configuration Independence
  // Changing Total Classrooms (24 -> 30) does not affect people statistics and remains manually configured
  testData = {
    ...testData,
    facilitiesConfig: {
      ...testData.facilitiesConfig,
      classroomsCount: 30,
    },
  };

  {
    const synced = syncDerivedStatisticsToFacilities(testData);
    assert(synced.facilitiesConfig?.classroomsCount === 30, 'Total Classrooms changed to 30 independently', synced.facilitiesConfig);
    assert(synced.facilitiesConfig?.totalStudents === 8504, 'facilitiesConfig mirror has updated totalStudents 8504', synced.facilitiesConfig);
    assert(synced.facilitiesConfig?.totalTeachers === 1, 'facilitiesConfig mirror has updated totalTeachers 1', synced.facilitiesConfig);
  }

  // TEST 11: Multi-Campus Filtering Isolation
  const campusAStudent: Student = {
    id: 'stud-campus-a',
    school_id: '19123456789',
    admission_number: 'ADM-A-01',
    first_name: 'Campus A Student',
    status: 'active',
    campus_id: 'campus-a',
    academic_session: '2026-2027',
  };

  const campusBStudent: Student = {
    id: 'stud-campus-b',
    school_id: '19123456789',
    admission_number: 'ADM-B-01',
    first_name: 'Campus B Student',
    status: 'active',
    campus_id: 'campus-b',
    academic_session: '2026-2027',
  };

  const multiCampusData: Partial<UniversalIntakeData> = {
    institutionStructure: { currentAcademicSession: '2026-2027' } as any,
    facilitiesConfig: { classroomsCount: 15 },
    students: [campusAStudent, campusBStudent],
  };

  {
    const statsAll = calculateCampusStatistics(multiCampusData, { selectedCampusId: 'all' });
    const statsA = calculateCampusStatistics(multiCampusData, { selectedCampusId: 'campus-a' });
    const statsB = calculateCampusStatistics(multiCampusData, { selectedCampusId: 'campus-b' });

    assert(statsAll.totalStudents === 2, 'Multi-campus all: Total Students = 2', statsAll);
    assert(statsA.totalStudents === 1, 'Multi-campus filter Campus A: Total Students = 1', statsA);
    assert(statsB.totalStudents === 1, 'Multi-campus filter Campus B: Total Students = 1', statsB);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCampusStatisticsTestSuite();
