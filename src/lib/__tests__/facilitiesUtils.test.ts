/**
 * ==============================================================================
 * CAMPUS FACILITIES & WEBSITE INTAKE REDESIGN UNIT TEST SUITE
 * File: src/lib/__tests__/facilitiesUtils.test.ts
 * ==============================================================================
 */

import {
  FACILITY_DEFINITIONS,
  getFacilityDefinition,
  normalizeFacilitiesData,
  getFacilitiesSectionScore,
  SPORTS_CHECKLIST,
  SCIENCE_LAB_TYPES,
  type FacilityDefinition,
} from '../facilitiesUtils';
import {
  getApplicableSections,
  isSectionApplicable,
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../schoolIntake';
import type { FacilitiesData, SchoolIntakeData, WebsiteFacilityConfig } from '../types';

function runFacilitiesTestSuite() {
  console.log('🧪 Starting Campus Facilities & Website Intake Redesign Unit Tests...\n');

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

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: CANONICAL FACILITY DEFINITIONS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Canonical Facility Definitions ---');

  assert(
    FACILITY_DEFINITIONS.length === 11,
    'Exactly 11 canonical facilities defined in FACILITY_DEFINITIONS'
  );

  const expectedIds = [
    'smart_classrooms',
    'computer_lab',
    'science_lab',
    'library',
    'sports',
    'auditorium',
    'medical_room',
    'cafeteria',
    'cctv_security',
    'hostel',
    'other',
  ];

  expectedIds.forEach((id) => {
    const def = getFacilityDefinition(id);
    assert(
      Boolean(def && def.id === id),
      `Facility "${id}" resolved by getFacilityDefinition`
    );
    assert(
      Boolean(def && def.title && def.description && def.iconName),
      `Facility "${id}" has title, description, and iconName`
    );
    assert(
      Array.isArray(def?.featureOptions),
      `Facility "${id}" defines featureOptions array`
    );
    assert(
      typeof def?.validate === 'function',
      `Facility "${id}" provides validate function`
    );
    assert(
      typeof def?.generateWebsiteSummary === 'function',
      `Facility "${id}" provides generateWebsiteSummary function`
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: AVAILABILITY TOGGLES & VALIDATION RULES
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Availability Toggles & Field Validation ---');

  // Test 2.1: Available = false immediately passes validation with 0 missing fields
  {
    const smartDef = getFacilityDefinition('smart_classrooms')!;
    const disabledConfig: WebsiteFacilityConfig = {
      id: 'smart_classrooms',
      available: false,
    };
    const validation = smartDef.validate(disabledConfig);
    assert(
      validation.isValid === true,
      'Disabled facility (available: false) passes validation immediately'
    );
    assert(
      validation.missingRequired.length === 0,
      'Disabled facility has zero missingRequired fields'
    );
  }

  // Test 2.2: Available = true with missing required fields fails validation
  {
    const smartDef = getFacilityDefinition('smart_classrooms')!;
    const incompleteConfig: WebsiteFacilityConfig = {
      id: 'smart_classrooms',
      available: true,
      count: 0,
    };
    const validation = smartDef.validate(incompleteConfig);
    assert(
      validation.isValid === false,
      'Active facility missing count fails validation'
    );
    assert(
      validation.missingRequired.length > 0,
      'Active facility reports missingRequired fields'
    );
  }

  // Test 2.3: Active Smart Classrooms with count passes
  {
    const smartDef = getFacilityDefinition('smart_classrooms')!;
    const validConfig: WebsiteFacilityConfig = {
      id: 'smart_classrooms',
      available: true,
      count: 12,
      features: ['interactive_board', 'air_conditioned'],
    };
    const validation = smartDef.validate(validConfig);
    assert(
      validation.isValid === true,
      'Complete Smart Classrooms facility passes validation'
    );
    assert(
      validation.missingRequired.length === 0,
      'Complete Smart Classrooms has zero missing fields'
    );
  }

  // Test 2.4: Active Computer Lab requires count and computersCount
  {
    const compDef = getFacilityDefinition('computer_lab')!;
    const incompleteLab: WebsiteFacilityConfig = {
      id: 'computer_lab',
      available: true,
      count: 1,
      // computersCount missing
    };
    assert(
      compDef.validate(incompleteLab).isValid === false,
      'Computer lab missing computersCount fails validation'
    );

    const validLab: WebsiteFacilityConfig = {
      id: 'computer_lab',
      available: true,
      count: 2,
      computersCount: 45,
      features: ['internet', 'air_conditioned'],
    };
    assert(
      compDef.validate(validLab).isValid === true,
      'Complete Computer Lab passes validation'
    );
  }

  // Test 2.5: Active Science Lab requires types and count
  {
    const sciDef = getFacilityDefinition('science_lab')!;
    const emptyLab: WebsiteFacilityConfig = {
      id: 'science_lab',
      available: true,
      types: [],
      count: 0,
    };
    assert(
      sciDef.validate(emptyLab).isValid === false,
      'Science lab with empty types fails validation'
    );

    const filledLab: WebsiteFacilityConfig = {
      id: 'science_lab',
      available: true,
      types: ['physics', 'chemistry', 'biology'],
      count: 3,
    };
    assert(
      sciDef.validate(filledLab).isValid === true,
      'Science lab with types and count passes validation'
    );
  }

  // Test 2.6: Active School Library validation
  {
    const libDef = getFacilityDefinition('library')!;
    const libConfig: WebsiteFacilityConfig = {
      id: 'library',
      available: true,
      bookCount: 6500,
      capacity: 80,
      digitalLibrary: true,
    };
    assert(
      libDef.validate(libConfig).isValid === true,
      'Library with books and seating capacity passes validation'
    );
  }

  // Test 2.7: Active Hostel requires hostelType and capacity
  {
    const hostelDef = getFacilityDefinition('hostel')!;
    const incompleteHostel: WebsiteFacilityConfig = {
      id: 'hostel',
      available: true,
      hostelType: undefined,
      capacity: 0,
    };
    assert(
      hostelDef.validate(incompleteHostel).isValid === false,
      'Hostel missing type and capacity fails validation'
    );

    const completeHostel: WebsiteFacilityConfig = {
      id: 'hostel',
      available: true,
      hostelType: 'both',
      boysCapacity: 100,
      girlsCapacity: 80,
      features: ['warden', 'cctv', 'study_room'],
    };
    assert(
      hostelDef.validate(completeHostel).isValid === true,
      'Hostel with valid type and capacities passes validation'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: NORMALIZATION & BIDIRECTIONAL LEGACY SYNC
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Normalization & Legacy Synchronization ---');

  // Test 3.1: Empty data normalizes all 11 facilities
  {
    const { facilities, normalized } = normalizeFacilitiesData({});
    assert(
      Object.keys(facilities).length === 11,
      'Normalized empty data contains all 11 canonical facilities'
    );
    assert(
      facilities['smart_classrooms'] !== undefined,
      'Normalized data contains smart_classrooms'
    );
    assert(
      Boolean(normalized.facilities),
      'Normalized FacilitiesData has facilities record'
    );
  }

  // Test 3.2: Legacy boolean fields map to new facilities
  {
    const legacyData: FacilitiesData = {
      smartClassrooms: true,
      computerLab: true,
      scienceLab: false,
      library: true,
      playground: true,
      auditorium: false,
      medicalRoom: true,
      cafeteria: false,
      cctvInstalled: true,
    };

    const { facilities } = normalizeFacilitiesData(legacyData);
    assert(
      facilities['smart_classrooms']?.available === true,
      'Legacy smartClassrooms: true mapped to smart_classrooms.available: true'
    );
    assert(
      facilities['computer_lab']?.available === true,
      'Legacy computerLab: true mapped to computer_lab.available: true'
    );
    assert(
      facilities['science_lab']?.available === false,
      'Legacy scienceLab: false mapped to science_lab.available: false'
    );
    assert(
      facilities['sports']?.available === true,
      'Legacy playground: true mapped to sports.available: true'
    );
  }

  // Test 3.3: Modern facilities object syncs back to legacy boolean flags
  {
    const modernData: FacilitiesData = {
      facilities: {
        smart_classrooms: { id: 'smart_classrooms', available: true, count: 10 },
        computer_lab: { id: 'computer_lab', available: false },
        science_lab: { id: 'science_lab', available: true, count: 2, types: ['physics'] },
        library: { id: 'library', available: true, bookCount: 3000, capacity: 50 },
        sports: { id: 'sports', available: true, sports: ['cricket'] },
        auditorium: { id: 'auditorium', available: false },
        medical_room: { id: 'medical_room', available: true },
        cafeteria: { id: 'cafeteria', available: false },
        cctv_security: { id: 'cctv_security', available: true },
        hostel: { id: 'hostel', available: false },
        other: { id: 'other', available: false },
      },
    };

    const { normalized } = normalizeFacilitiesData(modernData);
    assert(
      normalized.smartClassrooms === true,
      'Syncs smartClassrooms boolean back to root'
    );
    assert(
      normalized.computerLab === false,
      'Syncs computerLab boolean back to root'
    );
    assert(
      normalized.cctvInstalled === true,
      'Syncs cctvInstalled boolean back to root'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: SECTION COMPLETENESS & SCORING (getFacilitiesSectionScore)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Facilities Section Completeness & Scoring ---');

  // Test 4.1: All facilities marked No (available: false) gives 100% complete
  {
    const allNo: FacilitiesData = {
      facilities: {
        smart_classrooms: { id: 'smart_classrooms', available: false },
        computer_lab: { id: 'computer_lab', available: false },
        science_lab: { id: 'science_lab', available: false },
        library: { id: 'library', available: false },
        sports: { id: 'sports', available: false },
        auditorium: { id: 'auditorium', available: false },
        medical_room: { id: 'medical_room', available: false },
        cafeteria: { id: 'cafeteria', available: false },
        cctv_security: { id: 'cctv_security', available: false },
        hostel: { id: 'hostel', available: false },
        other: { id: 'other', available: false },
      },
    };
    const score = getFacilitiesSectionScore(allNo);
    assert(
      score.percentage === 100,
      'Facilities section score is 100% when all facilities are answered No'
    );
    assert(
      score.isComplete === true,
      'Section isComplete is true when all answered No'
    );
    assert(
      score.missingFields.length === 0,
      'Zero missing fields when all answered No'
    );
  }

  // Test 4.2: 1 facility Yes but incomplete drops percentage and isComplete
  {
    const partial: FacilitiesData = {
      facilities: {
        smart_classrooms: { id: 'smart_classrooms', available: true, count: 0 }, // invalid count
        computer_lab: { id: 'computer_lab', available: false },
        science_lab: { id: 'science_lab', available: false },
        library: { id: 'library', available: false },
        sports: { id: 'sports', available: false },
        auditorium: { id: 'auditorium', available: false },
        medical_room: { id: 'medical_room', available: false },
        cafeteria: { id: 'cafeteria', available: false },
        cctv_security: { id: 'cctv_security', available: false },
        hostel: { id: 'hostel', available: false },
        other: { id: 'other', available: false },
      },
    };
    const score = getFacilitiesSectionScore(partial);
    assert(
      score.percentage < 100,
      'Percentage is < 100% when facility is incomplete'
    );
    assert(
      score.isComplete === false,
      'isComplete is false when facility is incomplete'
    );
    assert(
      score.missingFields.length > 0,
      'Missing fields list includes incomplete facility'
    );
  }

  // Test 4.3: 1 facility Yes and complete gives 100%
  {
    const completeOne: FacilitiesData = {
      facilities: {
        smart_classrooms: {
          id: 'smart_classrooms',
          available: true,
          count: 15,
        },
        computer_lab: { id: 'computer_lab', available: false },
        science_lab: { id: 'science_lab', available: false },
        library: { id: 'library', available: false },
        sports: { id: 'sports', available: false },
        auditorium: { id: 'auditorium', available: false },
        medical_room: { id: 'medical_room', available: false },
        cafeteria: { id: 'cafeteria', available: false },
        cctv_security: { id: 'cctv_security', available: false },
        hostel: { id: 'hostel', available: false },
        other: { id: 'other', available: false },
      },
    };
    const score = getFacilitiesSectionScore(completeOne);
    assert(
      score.percentage === 100,
      'Percentage is 100% when active facility is complete'
    );
    assert(
      score.isComplete === true,
      'isComplete is true'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: WEBSITE PREVIEW GENERATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Website Preview Generation ---');

  {
    const smartDef = getFacilityDefinition('smart_classrooms')!;
    const smartConfig: WebsiteFacilityConfig = {
      id: 'smart_classrooms',
      available: true,
      count: 20,
      features: ['interactive_board'],
    };
    const summary = smartDef.generateWebsiteSummary(smartConfig);
    assert(
      summary.includes('20 technology-enabled smart classroom') || summary.includes('20'),
      'Smart classrooms preview includes count'
    );
  }

  {
    const libDef = getFacilityDefinition('library')!;
    const libConfig: WebsiteFacilityConfig = {
      id: 'library',
      available: true,
      bookCount: 8000,
      capacity: 100,
      digitalLibrary: true,
    };
    const summary = libDef.generateWebsiteSummary(libConfig);
    assert(
      summary.includes('8,000') || summary.includes('8000'),
      'Library preview includes book count'
    );
    assert(
      summary.includes('100 students') || summary.includes('100'),
      'Library preview includes seating capacity'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: DYNAMIC NAVIGATION & SECTION APPLICABILITY (getApplicableSections)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Dynamic Navigation & getApplicableSections ---');

  // Test 6.1: Website flow omits standalone libraryConfig and hostelConfig
  {
    const websiteSections = getApplicableSections('school-website');
    const hasLibrary = websiteSections.some((s) => s.key === 'libraryConfig');
    const hasHostel = websiteSections.some((s) => s.key === 'hostelConfig');

    assert(
      !hasLibrary,
      'Website product ("school-website") omits standalone libraryConfig'
    );
    assert(
      !hasHostel,
      'Website product ("school-website") omits standalone hostelConfig'
    );
    assert(
      websiteSections.some((s) => s.key === 'facilitiesConfig'),
      'Website product includes consolidated facilitiesConfig'
    );
  }

  // Test 6.2: Website CMS flow also omits standalone libraryConfig and hostelConfig
  {
    const cmsSections = getApplicableSections('school-website-cms');
    assert(
      !cmsSections.some((s) => s.key === 'libraryConfig'),
      'Website CMS product omits standalone libraryConfig'
    );
    assert(
      !cmsSections.some((s) => s.key === 'hostelConfig'),
      'Website CMS product omits standalone hostelConfig'
    );
  }

  // Test 6.3: ERP flow includes standalone libraryConfig and hostelConfig
  {
    const erpSections = getApplicableSections('school-erp');
    assert(
      erpSections.some((s) => s.key === 'libraryConfig'),
      'ERP product ("school-erp") includes standalone libraryConfig'
    );
    assert(
      erpSections.some((s) => s.key === 'hostelConfig'),
      'ERP product ("school-erp") includes standalone hostelConfig'
    );
  }

  // Test 6.4: Transport section dynamically excluded when status === 'no'
  {
    const dataNoTransport: Partial<SchoolIntakeData> = {
      transportConfig: {
        status: 'no',
      } as any,
    };
    const sections = getApplicableSections('school-website', dataNoTransport);
    assert(
      !sections.some((s) => s.key === 'transportConfig'),
      'Transport section is omitted when transportConfig.status === "no"'
    );
  }

  // Test 6.5: Transport section dynamically included when status === 'yes'
  {
    const dataWithTransport: Partial<SchoolIntakeData> = {
      transportConfig: {
        status: 'yes',
      } as any,
    };
    const sections = getApplicableSections('school-website', dataWithTransport);
    assert(
      sections.some((s) => s.key === 'transportConfig'),
      'Transport section is included when transportConfig.status === "yes"'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 7: OVERALL INTAKE COMPLETENESS CALCULATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing Overall Intake Completeness Calculation ---');

  // Test 7.1: calculateIntakeCompleteness scores facilitiesConfig using getFacilitiesSectionScore
  {
    const testData: SchoolIntakeData = {
      ...createInitialIntakeData('Test School', 'cbse'),
      facilitiesConfig: {
        facilities: {
          smart_classrooms: { id: 'smart_classrooms', available: false },
          computer_lab: { id: 'computer_lab', available: false },
          science_lab: { id: 'science_lab', available: false },
          library: { id: 'library', available: false },
          sports: { id: 'sports', available: false },
          auditorium: { id: 'auditorium', available: false },
          medical_room: { id: 'medical_room', available: false },
          cafeteria: { id: 'cafeteria', available: false },
          cctv_security: { id: 'cctv_security', available: false },
          hostel: { id: 'hostel', available: false },
          other: { id: 'other', available: false },
        },
      } as any,
      transportConfig: { status: 'no' } as any, // transport not applicable
    };

    const completeness = calculateIntakeCompleteness('school-website', testData);

    assert(
      completeness.sectionStatuses.facilitiesConfig === 'complete',
      'facilitiesConfig is marked "complete" when all facilities are answered No'
    );
    assert(
      completeness.sectionPercentages.facilitiesConfig === 100,
      'facilitiesConfig percentage is 100%'
    );
    assert(
      completeness.sectionStatuses.libraryConfig === 'not_applicable',
      'libraryConfig is marked "not_applicable" for website product'
    );
    assert(
      completeness.sectionStatuses.hostelConfig === 'not_applicable',
      'hostelConfig is marked "not_applicable" for website product'
    );
    assert(
      completeness.sectionStatuses.transportConfig === 'not_applicable',
      'transportConfig is marked "not_applicable" when status is "no"'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n===========================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFacilitiesTestSuite();