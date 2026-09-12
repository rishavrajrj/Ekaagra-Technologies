/**
 * Multi-School Website Engine & Single Source of Truth Test Suite
 * 
 * Verifies:
 * 1. Single engine rendering School A (Boarding, multi-campus, transport, hostel) vs School B (Day school, single campus, no hostel, no transport)
 * 2. Strict conditional section visibility (N/A features hidden from website & navigation without penalty)
 * 3. Publication blocker detection with direct section & anchor redirection
 * 4. Cross-section consistency engine (detecting and resolving contradictory school facts)
 * 5. Zero fabrication & zero mock-data guarantees
 * 6. Database record hydration via buildSchoolWebsiteDataFromDb
 */

import {
  buildSchoolWebsiteDataFromIntake,
  buildSchoolWebsiteDataFromDb,
  SchoolWebsiteData
} from '../schoolWebsiteContract';
import {
  evaluateWebsiteReadiness,
  WEBSITE_REQUIREMENTS_REGISTRY,
  isSectionApplicableToSchool
} from '../websiteDataStatus';
import {
  validateCrossSectionConsistency
} from '../dataConsistencyEngine';
import { UniversalIntakeData, SchoolTenant } from '../types';

let totalPassed = 0;
let totalFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    totalPassed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    totalFailed++;
  }
}

console.log('===========================================================');
console.log('🧪 Starting Multi-School Website Engine Unit Tests...');
console.log('===========================================================\n');

// -------------------------------------------------------------
// TEST CASE 1: School A (Boarding School, Multi-Campus, Transport & Hostel Active)
// -------------------------------------------------------------
console.log('--- 1. Testing School A (Boarding, Multi-Campus, Transport, Hostel) ---');

const schoolAIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Himalayan Residential Academy',
    displayName: 'Himalayan Residential Academy',
    schoolType: 'boarding',
    board: 'CBSE',
    affiliationNumber: '2130888',
    udiseCode: '05010100101',
    officialEmail: 'info@himalayanacademy.org',
    officialPhone: '+91 98765 43210',
    address: 'Mall Road, Mussoorie',
    city: 'Mussoorie',
    state: 'Uttarakhand',
    slug: 'himalayan-academy',
    isMultiCampus: true,
  },
  brandingDesign: {
    primaryColor: '#0F766E',
    secondaryColor: '#134E4A',
    logo: 'https://cdn.example.com/himalayan/logo.png',
    taglineOrMotto: 'Ascend to Excellence',
  },
  schoolContent: {
    aboutSchool: 'Premier residential school in the Himalayas offering comprehensive CBSE education.',
    vision: 'To nurture global leaders rooted in traditional values.',
    mission: 'Empowering students through academic rigor and holistic development.',
    coreValues: ['Integrity', 'Excellence', 'Empathy', 'Resilience'],
  },
  campuses: [
    {
      id: 'campus-senior',
      name: 'Senior Campus',
      isMainCampus: true,
      address: 'Mall Road',
      city: 'Mussoorie',
      state: 'Uttarakhand',
      pin: '248179',
      facilities: ['Science Lab', 'Olympic Pool', 'Auditorium'],
      academicLevels: ['secondary', 'senior_secondary'],
      classRange: 'Class 9 to Class 12',
    },
    {
      id: 'campus-junior',
      name: 'Junior Campus',
      isMainCampus: false,
      address: 'Happy Valley',
      city: 'Mussoorie',
      state: 'Uttarakhand',
      pin: '248179',
      facilities: ['Smart Classrooms', 'Playground'],
      academicLevels: ['primary', 'middle'],
      classRange: 'Class 1 to Class 8',
    },
  ],
  institutionStructure: {
    academicSession: '2026-2027',
    classes: ['Class 1', 'Class 5', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
    streams: ['Science', 'Commerce', 'Humanities'],
  },
  facilitiesConfig: {
    items: [
      { id: 'pool-1', name: 'Olympic Swimming Pool', category: 'Sports', isApplicable: true, isAvailable: true },
      { id: 'aud-1', name: '700-Seat Auditorium', category: 'Arts', isApplicable: true, isAvailable: true },
    ],
  },
  transportConfig: {
    status: 'yes',
    enabled: true,
    hasGpsTracking: true,
    fleet: [{ id: 'bus-1', number: 'UK-07-PA-1001' }, { id: 'bus-2', number: 'UK-07-PA-1002' }],
    routes: [
      { name: 'Dehradun Shuttle', vehicleNumber: 'UK-07-PA-1001', stops: ['Clock Tower', 'Rajpur Road', 'Mussoorie Toll'] },
    ],
  },
  hostelConfig: {
    status: 'yes',
    isApplicable: true,
    accommodationType: 'co_ed',
    totalCapacity: 350,
    wardenName: 'Capt. R. K. Joshi',
    amenities: ['24/7 Medical Care', 'Solar Water Heating', 'Study Halls', 'Nutritious Dining'],
    buildings: [{ name: 'Tagore House', capacity: 180 }, { name: 'Raman House', capacity: 170 }],
  },
  admissions: {
    isEnrolling: true,
    sessionName: '2026-2027',
    guidelines: 'Entrance examination and personal interview required.',
  },
  feesConfiguration: {
    hasFeeStructure: true,
    items: [
      { category: 'Tuition & Boarding Fee', frequency: 'Annual', amountINR: 280000 },
    ],
  },
  assetChecklist: {
    items: [
      { id: 'cert-affiliation', title: 'CBSE Affiliation Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/himalayan/affiliation.pdf' },
      { id: 'cert-safety', title: 'Building Safety Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/himalayan/building_safety.pdf' },
      { id: 'cert-fire', title: 'Fire Safety Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/himalayan/fire_safety.pdf' },
    ],
  },
};

const schoolAWebsite = buildSchoolWebsiteDataFromIntake(schoolAIntake);

assert(schoolAWebsite.school.name === 'Himalayan Residential Academy', 'School A identity name matches intake');
assert(schoolAWebsite.campuses.length === 2, 'School A has 2 campuses normalized');
assert(schoolAWebsite.campuses[0].isMainCampus === true, 'School A first campus is main campus');
assert(schoolAWebsite.hostel.isAvailable === true, 'School A hostel isAvailable is true');
assert(schoolAWebsite.config.showHostel === true, 'School A config.showHostel is true (visible in navigation)');
assert(schoolAWebsite.transport.isOperated === true, 'School A transport.isOperated is true');
assert(schoolAWebsite.config.showTransport === true, 'School A config.showTransport is true (visible in navigation)');
assert(schoolAWebsite.facilities.length === 2, 'School A facilities normalized accurately');
assert(schoolAWebsite.branding.primaryColor === '#0F766E', 'School A custom theme color preserved');

// Verify readiness
const readinessA = evaluateWebsiteReadiness(schoolAIntake);
assert(readinessA.isReadyForSubmission === true, 'School A is marked ready for submission');
assert(readinessA.blockers.length === 0, 'School A has zero publication blockers');
assert(readinessA.overallReadinessScore === 100, `School A achieves 100% readiness score (got ${readinessA.overallReadinessScore}%)`);

// -------------------------------------------------------------
// TEST CASE 2: School B (Day School, Single Campus, No Hostel, No Transport)
// -------------------------------------------------------------
console.log('\n--- 2. Testing School B (Day School, Single Campus, No Hostel, No Transport) ---');

const schoolBIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Vidya Vihar Public School',
    displayName: 'Vidya Vihar Public School',
    schoolType: 'day_school',
    board: 'ICSE',
    affiliationNumber: 'KA045',
    udiseCode: '29280601001',
    officialEmail: 'contact@vidyavihar.edu.in',
    officialPhone: '+91 80 2345 6789',
    address: '14th Cross, Jayanagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    slug: 'vidya-vihar-bengaluru',
    isMultiCampus: false,
  },
  brandingDesign: {
    primaryColor: '#2563EB',
    secondaryColor: '#1E40AF',
    logo: 'https://cdn.example.com/vidya/logo.png',
  },
  schoolContent: {
    aboutSchool: 'A premier day school in Bengaluru committed to holistic education.',
    vision: 'Fostering curious minds and responsible citizens.',
    mission: 'Providing exceptional ICSE education with state-of-the-art facilities.',
  },
  campuses: [
    {
      id: 'main-campus',
      name: 'Main Campus',
      isMainCampus: true,
      address: '14th Cross, Jayanagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pin: '560011',
      facilities: ['Computer Lab', 'Library', 'Indoor Badminton Court'],
      academicLevels: ['primary', 'middle', 'secondary'],
      classRange: 'Class 1 to Class 10',
    },
  ],
  institutionStructure: {
    academicSession: '2026-2027',
    classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  },
  facilitiesConfig: {
    items: [
      { id: 'lib-1', name: 'Central Library', category: 'Academics', isApplicable: true, isAvailable: true },
    ],
  },
  // Explicitly disabled transport & hostel
  transportConfig: {
    status: 'no',
    enabled: false,
    fleet: [],
    routes: [],
  },
  hostelConfig: {
    status: 'no',
    isApplicable: false,
    buildings: [],
  },
  admissions: {
    isEnrolling: true,
    sessionName: '2026-2027',
  },
  feesConfiguration: {
    hasFeeStructure: true,
    items: [
      { category: 'Tuition Fee', frequency: 'Quarterly', amountINR: 18000 },
    ],
  },
  assetChecklist: {
    items: [
      { id: 'cert-affiliation', title: 'ICSE Affiliation Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/vidya/affiliation.pdf' },
      { id: 'cert-safety', title: 'Building Safety Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/vidya/building_safety.pdf' },
      { id: 'cert-fire', title: 'Fire Safety Certificate', category: 'compliance', status: 'provided', fileUrl: 'https://cdn.example.com/vidya/fire_safety.pdf' },
    ],
  },
};

const schoolBWebsite = buildSchoolWebsiteDataFromIntake(schoolBIntake);

assert(schoolBWebsite.school.name === 'Vidya Vihar Public School', 'School B identity name matches intake');
assert(schoolBWebsite.campuses.length === 1, 'School B has exactly 1 campus');
assert(schoolBWebsite.hostel.isAvailable === false, 'School B hostel isAvailable is strictly FALSE');
assert(schoolBWebsite.config.showHostel === false, 'School B config.showHostel is FALSE (hidden from navigation)');
assert(schoolBWebsite.transport.isOperated === false, 'School B transport.isOperated is strictly FALSE');
assert(schoolBWebsite.config.showTransport === false, 'School B config.showTransport is FALSE (hidden from navigation)');

// Verify section applicability helper
assert(isSectionApplicableToSchool(9, schoolBIntake) === false, 'Section 9 (Hostel) is NOT applicable for day school');
assert(isSectionApplicableToSchool(8, schoolBIntake) === false, 'Section 8 (Transport) is NOT applicable when transport is disabled');

// Verify readiness for School B
const readinessB = evaluateWebsiteReadiness(schoolBIntake);
assert(readinessB.isReadyForSubmission === true, 'School B is ready for submission despite missing hostel/transport');
assert(readinessB.blockers.length === 0, 'School B has zero blockers (no penalty for N/A features)');
assert(readinessB.overallReadinessScore === 100, `School B achieves 100% readiness score without hostel/transport (got ${readinessB.overallReadinessScore}%)`);

// -------------------------------------------------------------
// TEST CASE 3: Publication Blocker Engine & Direct Fix Redirection
// -------------------------------------------------------------
console.log('\n--- 3. Testing Publication Blocker Engine & Direct Anchor Redirection ---');

const incompleteIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: '', // Blocker 1: Missing school name
    schoolType: 'day_school',
    board: 'CBSE',
    officialEmail: 'info@school.org',
    city: 'New Delhi',
    state: 'Delhi',
  },
  assetChecklist: {
    items: [
      // Blocker 2: Missing affiliation certificate
      { id: 'cert-affiliation', title: 'CBSE Affiliation Certificate', category: 'compliance', status: 'missing' },
    ],
  },
};

const incompleteReadiness = evaluateWebsiteReadiness(incompleteIntake);

assert(incompleteReadiness.isReadyForSubmission === false, 'Incomplete intake is strictly NOT ready for submission');
assert(incompleteReadiness.blockers.length >= 2, `Detected publication blockers (found ${incompleteReadiness.blockers.length})`);

const nameBlocker = incompleteReadiness.blockers.find((b) => b.fieldKey === 'schoolProfile.schoolName');
assert(Boolean(nameBlocker), 'Identified missing school name blocker');
assert(nameBlocker?.targetSection === 1, `Name blocker points to Section 1 (got ${nameBlocker?.targetSection})`);
assert(nameBlocker?.targetAnchor === 'school-name', `Name blocker has targetAnchor 'school-name' (got ${nameBlocker?.targetAnchor})`);

const affiliationBlocker = incompleteReadiness.blockers.find((b) => b.fieldKey === 'compliance.cert-affiliation');
assert(Boolean(affiliationBlocker), 'Identified missing affiliation certificate blocker');
assert(affiliationBlocker?.targetSection === 17, `Affiliation blocker points to Section 17 (got ${affiliationBlocker?.targetSection})`);
assert(affiliationBlocker?.targetAnchor === 'cert-affiliation', `Affiliation blocker has targetAnchor 'cert-affiliation' (got ${affiliationBlocker?.targetAnchor})`);

// -------------------------------------------------------------
// TEST CASE 4: Cross-Section Consistency Engine & Contradiction Detection
// -------------------------------------------------------------
console.log('\n--- 4. Testing Cross-Section Consistency Engine ---');

const contradictoryIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'St. Mary High School',
    schoolType: 'day_school', // Day school implies no hostel
    isMultiCampus: false,     // Single campus claimed
  },
  campuses: [
    { id: 'c1', name: 'North Campus', isMainCampus: true },
    { id: 'c2', name: 'South Campus', isMainCampus: false }, // Contradiction 1: 2 campuses defined but isMultiCampus = false
  ],
  transportConfig: {
    status: 'no', // Contradiction 2: Transport disabled but 3 routes defined
    enabled: false,
    routes: [
      { name: 'Route 1' },
      { name: 'Route 2' },
      { name: 'Route 3' },
    ],
  },
  hostelConfig: {
    status: 'no', // Contradiction 3: Day school with hostel buildings configured
    isApplicable: false,
    buildings: [
      { name: 'Dormitory Alpha' },
    ],
  },
  students: [
    { id: 's1', name: 'Student 1' } as any,
    { id: 's2', name: 'Student 2' } as any,
  ],
  statistics: {
    totalStudents: 1500, // Contradiction 4: Enrolled roster has 2 students, campus stats claims 1500 without pre-digital note
  } as any,
};

const consistencyResult = validateCrossSectionConsistency(contradictoryIntake);

assert(consistencyResult.isConsistent === false, 'Contradictory intake detected as inconsistent');
assert(consistencyResult.conflicts.length >= 3, `Identified at least 3 cross-section conflicts (got ${consistencyResult.conflicts.length})`);

const campusConflict = consistencyResult.conflicts.find((c) => c.code === 'CAMPUS_COUNT_CONFLICT');
assert(Boolean(campusConflict), 'Detected CAMPUS_COUNT_CONFLICT');
assert(campusConflict?.targetSection === 1, 'Campus conflict targets Section 1');
assert(campusConflict?.severity === 'CRITICAL', 'Campus conflict has CRITICAL severity');

const transportConflict = consistencyResult.conflicts.find((c) => c.code === 'TRANSPORT_ROUTE_CONTRADICTION');
assert(Boolean(transportConflict), 'Detected TRANSPORT_ROUTE_CONTRADICTION');
assert(transportConflict?.targetSection === 8, 'Transport conflict targets Section 8');

const hostelConflict = consistencyResult.conflicts.find((c) => c.code === 'HOSTEL_DAY_SCHOOL_CONTRADICTION');
assert(Boolean(hostelConflict), 'Detected HOSTEL_DAY_SCHOOL_CONTRADICTION');
assert(hostelConflict?.targetSection === 9, 'Hostel conflict targets Section 9');

// -------------------------------------------------------------
// TEST CASE 5: Zero Fabrication Guarantee
// -------------------------------------------------------------
console.log('\n--- 5. Testing Zero Fabrication & Single Source of Truth Guarantee ---');

const minimalIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Delhi Public Academy',
    board: 'CBSE',
    officialEmail: 'info@dpa.edu',
    city: 'Delhi',
    state: 'Delhi',
    slug: 'dpa-delhi',
  },
};

const minimalWebsite = buildSchoolWebsiteDataFromIntake(minimalIntake);

// Assert NO SparkNest Academy
const websiteJson = JSON.stringify(minimalWebsite);
assert(!websiteJson.includes('SparkNest'), 'Output website data contains zero occurrences of "SparkNest"');
assert(!websiteJson.includes('SparkNest Academy'), 'Output website data does not fall back to "SparkNest Academy"');

// Assert NO invented stats or fake classrooms
assert(minimalWebsite.facilities.length === 0, 'No fake facilities are fabricated when none are provided');
assert(minimalWebsite.transport.routes.length === 0, 'No fake transport routes are fabricated');
assert(minimalWebsite.gallery.length === 0, 'No fake gallery images are fabricated');
assert(minimalWebsite.hero.headline === 'Delhi Public Academy', 'Headline uses actual school name');

// -------------------------------------------------------------
// TEST CASE 6: Database Hydration (buildSchoolWebsiteDataFromDb)
// -------------------------------------------------------------
console.log('\n--- 6. Testing Database Hydration via buildSchoolWebsiteDataFromDb ---');

const mockTenant: SchoolTenant = {
  id: 'tenant-12345',
  slug: 'emerald-valley',
  name: 'Emerald Valley School',
  display_name: 'Emerald Valley International School',
  legal_name: 'Emerald Valley Educational Trust',
  school_id: '08123456789',
  affiliation_number: 'CBSE-998877',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockProfile = {
  primary_email: 'office@emeraldvalley.org',
  primary_phone: '+91 11 4455 6677',
  accreditation_body: 'CBSE',
  affiliation_number: 'CBSE-998877',
  udise_code: '08123456789',
};

const mockBranding = {
  primary_color: '#047857',
  secondary_color: '#064E3B',
  font_family: 'Plus Jakarta Sans, sans-serif',
  logo_storage_path: 'https://cdn.example.com/emerald/logo.svg',
  tagline: 'Inspiring curious minds, empowering future leaders',
  vision: 'To be a beacon of academic excellence and integrity.',
  mission: 'Delivering holistic development in an inclusive setting.',
};

const mockCampuses = [
  {
    id: 'c-main',
    name: 'Main Campus',
    is_main_campus: true,
    address_line1: 'Sector 45, Expressway',
    city: 'Gurugram',
    state_province: 'Haryana',
    postal_code: '122003',
  },
];

const dbWebsite = buildSchoolWebsiteDataFromDb(
  mockTenant,
  mockProfile,
  mockBranding,
  mockCampuses,
  false // transport disabled
);

assert(dbWebsite.school.name === 'Emerald Valley International School', 'Database school name mapped faithfully');
assert(dbWebsite.school.affiliationNumber === 'CBSE-998877', 'Affiliation number mapped from tenant/profile');
assert(dbWebsite.branding.primaryColor === '#047857', 'Primary color mapped from database branding');
assert(dbWebsite.campuses.length === 1, 'Campus mapped faithfully from database');
assert(dbWebsite.campuses[0].city === 'Gurugram', 'Campus city mapped accurately');
assert(dbWebsite.transport.isOperated === false, 'Transport disabled based on database flag');
assert(dbWebsite.config.showTransport === false, 'Transport hidden from config');
assert(dbWebsite.readinessSummary.isWebsiteReady === true, 'Database record marked website ready');

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n===========================================================');
console.log(`MULTI-SCHOOL WEBSITE ENGINE TEST RESULTS: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log('===========================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
