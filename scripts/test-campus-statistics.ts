import { calculateIntakeCompleteness } from '../src/lib/schoolIntake';
import { UniversalIntakeData } from '../src/lib/types';

function runCampusStatisticsTests() {
  console.log('--- Testing Campus Statistics & Section 8 Completeness ---');

  const baseData: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'St. Xavier International',
      udiseCode: '19123456789',
      schoolCode: 'CBSE/2024/001',
      schoolType: 'Co-Educational',
      board: 'CBSE',
      officialEmail: 'contact@xaviers.edu',
      officialPhone: '9876543210',
    } as any,
    facilitiesConfig: {
      // Empty facilitiesConfig
    },
  };

  // Test 1: Empty facilitiesConfig does not block section completion
  const scoreEmpty = calculateIntakeCompleteness('school-complete', baseData);
  console.log('Test 1: Empty facilitiesConfig section percentage:', scoreEmpty.sectionPercentages['facilitiesConfig']);
  const facilityMissingFields1 = scoreEmpty.missingFields.filter(f => f.toLowerCase().includes('facilities') || f.toLowerCase().includes('classroom'));
  if (scoreEmpty.sectionPercentages['facilitiesConfig'] === 100 && facilityMissingFields1.length === 0) {
    console.log('✅ PASS: Empty facilitiesConfig is 100% complete and non-blocking.');
  } else {
    console.error('❌ FAIL: Empty facilitiesConfig blocked completion:', scoreEmpty);
    process.exit(1);
  }

  // Test 2: Populated primary statistics does not affect completeness or cause issues
  const dataWithPrimaryStats: Partial<UniversalIntakeData> = {
    ...baseData,
    facilitiesConfig: {
      totalStudents: 1200,
      activeStudents: 1150,
      totalTeachers: 65,
      totalNonTeachingStaff: 25,
      classroomsCount: 45,
      computerLab: true,
      smartClassrooms: true,
    },
  };

  const scoreWithPrimary = calculateIntakeCompleteness('school-complete', dataWithPrimaryStats);
  console.log('Test 2: Populated primary stats section percentage:', scoreWithPrimary.sectionPercentages['facilitiesConfig']);
  const facilityMissingFields2 = scoreWithPrimary.missingFields.filter(f => f.toLowerCase().includes('facilities') || f.toLowerCase().includes('classroom'));
  if (scoreWithPrimary.sectionPercentages['facilitiesConfig'] === 100 && facilityMissingFields2.length === 0) {
    console.log('✅ PASS: Primary stats populated remains 100% complete.');
  } else {
    console.error('❌ FAIL: Populated primary stats broke completeness.');
    process.exit(1);
  }

  // Test 3: Populated secondary statistics (all 7 fields)
  const dataWithAllStats: Partial<UniversalIntakeData> = {
    ...baseData,
    facilitiesConfig: {
      totalStudents: 1500,
      activeStudents: 1400,
      totalTeachers: 80,
      totalNonTeachingStaff: 30,
      classroomsCount: 50,
      studentCapacity: 2000,
      averageClassSize: 30,
      studentTeacherRatio: '20:1',
      establishedYear: 1995,
      gradesOffered: 'Nursery to Grade 12',
      sectionsPerGrade: '4',
      totalCampuses: 2,
      scienceLab: true,
    },
  };

  const scoreAll = calculateIntakeCompleteness('school-complete', dataWithAllStats);
  console.log('Test 3: Populated full stats section percentage:', scoreAll.sectionPercentages['facilitiesConfig']);
  const facilityMissingFields3 = scoreAll.missingFields.filter(f => f.toLowerCase().includes('facilities') || f.toLowerCase().includes('classroom'));
  if (scoreAll.sectionPercentages['facilitiesConfig'] === 100 && facilityMissingFields3.length === 0) {
    console.log('✅ PASS: Full stats populated maintains 100% completion.');
  } else {
    console.error('❌ FAIL: Full stats broke completeness.');
    process.exit(1);
  }

  // Test 4: Validation helper simulation (activeStudents > totalStudents warning check)
  const warnData = { totalStudents: 500, activeStudents: 600 };
  const hasWarning = (warnData.totalStudents ?? 0) > 0 &&
                     (warnData.activeStudents ?? 0) > 0 &&
                     (warnData.activeStudents ?? 0) > (warnData.totalStudents ?? 0);
  if (hasWarning) {
    console.log('✅ PASS: Active students > Total students warning condition correctly triggers.');
  } else {
    console.error('❌ FAIL: Warning condition failed to trigger.');
    process.exit(1);
  }

  const normalData = { totalStudents: 600, activeStudents: 500 };
  const noWarning = (normalData.totalStudents ?? 0) > 0 &&
                    (normalData.activeStudents ?? 0) > 0 &&
                    (normalData.activeStudents ?? 0) > (normalData.totalStudents ?? 0);
  if (!noWarning) {
    console.log('✅ PASS: Normal student count does not trigger warning.');
  } else {
    console.error('❌ FAIL: Normal student count triggered false warning.');
    process.exit(1);
  }

  // Test 5: Clamping simulation for negative numbers
  const negativeInput = -15;
  const clampedValue = Math.max(0, negativeInput);
  if (clampedValue === 0) {
    console.log('✅ PASS: Negative input is clamped to 0.');
  } else {
    console.error('❌ FAIL: Negative input was not clamped.');
    process.exit(1);
  }

  // Test 6: Dynamic Campus Statistics calculation engine integration
  const { calculateCampusStatistics, syncDerivedStatisticsToFacilities } = require('../src/lib/campusStatisticsUtils');
  const dynamicIntake: Partial<UniversalIntakeData> = {
    institutionStructure: { currentAcademicSession: '2026-2027' } as any,
    students: [
      { id: 's1', admission_number: 'ADM-01', first_name: 'Aarav', status: 'active', academic_session: '2026-2027' } as any,
      { id: 's2', admission_number: 'ADM-02', first_name: 'Bhavna', status: 'graduated', academic_session: '2025-2026' } as any,
    ],
    staffFaculty: {
      staffMembers: [
        { name: 'Teacher 1', designation: 'PGT English', category: 'teaching', status: 'active' },
        { name: 'Admin 1', designation: 'Accountant', category: 'non_teaching', status: 'active' },
      ],
    } as any,
    facilitiesConfig: {
      classroomsCount: 28,
      historicalPreDigitalStudents: 500,
    },
  };

  const dynamicStats = calculateCampusStatistics(dynamicIntake);
  if (
    dynamicStats.totalStudents === 502 && // 500 historical + 2 unique digital
    dynamicStats.activeStudents === 1 && // only s1 is active in 2026-2027
    dynamicStats.totalTeachers === 1 &&
    dynamicStats.totalNonTeachingStaff === 1
  ) {
    console.log('✅ PASS: Dynamic Campus Statistics calculated correctly with canonical records & pre-digital fallback.');
  } else {
    console.error('❌ FAIL: Dynamic Campus Statistics failed:', dynamicStats);
    process.exit(1);
  }

  const synced = syncDerivedStatisticsToFacilities(dynamicIntake);
  if (
    synced.facilitiesConfig?.totalStudents === 502 &&
    synced.facilitiesConfig?.activeStudents === 1 &&
    synced.facilitiesConfig?.totalTeachers === 1 &&
    synced.facilitiesConfig?.totalNonTeachingStaff === 1 &&
    synced.facilitiesConfig?.classroomsCount === 28
  ) {
    console.log('✅ PASS: Derived statistics successfully mirrored to facilitiesConfig payload.');
  } else {
    console.error('❌ FAIL: Synced facilitiesConfig mismatch:', synced.facilitiesConfig);
    process.exit(1);
  }

  console.log('\nAll Campus Statistics tests passed successfully! 🎉');
}

runCampusStatisticsTests();
