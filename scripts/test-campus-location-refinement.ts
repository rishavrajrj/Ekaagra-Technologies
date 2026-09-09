import { readFileSync } from 'fs';
import { CampusBranchData, UniversalIntakeData } from '../src/lib/types';
import { calculateIntakeCompleteness, isValidGoogleMapsUrl } from '../src/lib/schoolIntake';

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${description}`);
  }
}

console.log('================================================================');
console.log('  CAMPUS LOCATION REFINEMENT TEST SUITE (TESTS A - J)');
console.log('================================================================\n');

function createBaseCampus(id: string, name: string): CampusBranchData {
  return {
    id,
    name,
    isMainCampus: true,
    address: 'Station Road, Ward No. 4',
    landmark: 'Near Gandhi Chowk',
    city: 'Motihari',
    district: 'East Champaran',
    state: 'Bihar',
    country: 'India',
    countryName: '',
    pin: '845401',
    contactPhone: '9876543210',
    contactEmail: 'contact@school.edu',
    operatingHours: '08:00 AM - 03:00 PM',
    facilities: ['Smart Classrooms', 'Science Lab', 'Library'],
    googleMapsUrl: '',
    googleMapsLink: '',
  };
}

function createIntakeDataWithCampus(campus: CampusBranchData): UniversalIntakeData {
  return {
    schoolProfile: {
      schoolName: 'Ekaagra Model Academy',
      udiseCode: '10010100101',
      schoolCode: '100101',
      affiliationNumber: '1030001',
      schoolType: 'Co-Educational',
      board: 'CBSE',
      officialEmail: 'info@school.edu',
      officialPhone: '9876543210',
      address: campus.address,
      city: campus.city,
      state: campus.state,
      pin: campus.pin,
      country: campus.country,
    },
    campuses: [campus],
    leadership: {
      principalName: 'Dr. Ramesh Kumar',
      principalDesignation: 'Principal',
      principalMessage: 'Welcome to our institution, fostering holistic excellence and 21st-century values.',
    },
    brandingDesign: {
      taglineOrMotto: 'Excellence in Education',
    },
    websiteRequirements: {
      primaryPurpose: 'Admissions and academic transparency',
      requiredPages: ['Home', 'About Us', 'Academics', 'Contact Us'],
    },
    schoolContent: {
      aboutSchool: 'Founded in 1998, our institution provides holistic education combining academic rigor with character building.',
      philosophy: 'Holistic growth through experiential learning',
    },
    institutionStructure: {
      currentAcademicSession: '2026-2027',
      classes: ['Class 1', 'Class 2', 'Class 3'],
    },
    staffFaculty: {
      teachingStaffCount: 25,
      studentTeacherRatio: '20:1',
    },
    admissionsFees: {
      admissionProcessType: 'online_and_offline',
    },
    academicExams: {
      assessmentPattern: 'CBSE Continuous Assessment',
    },
    campusFacilities: {
      smartClassrooms: true,
      library: true,
      scienceLabs: true,
    },
    transportHostel: {
      transportOffered: true,
      hostelOffered: false,
    },
    techIntegrations: {
      schoolManagementSoftwareExperience: 'none',
    },
    statutoryCompliance: {
      cbseMandatoryPublicDisclosureReady: true,
    },
  } as unknown as UniversalIntakeData;
}

// -----------------------------------------------------------------------------
// TEST A: Empty Google Maps field -> section remains valid
// -----------------------------------------------------------------------------
console.log('--- TEST A: Empty Google Maps field -> section remains valid ---');
const campusA = createBaseCampus('c-1', 'Main Campus');
assert(campusA.googleMapsLink === '', 'Campus initialized with empty Google Maps link');
assert(isValidGoogleMapsUrl('') === true, 'Empty string is valid Google Maps URL');
assert(isValidGoogleMapsUrl('   ') === true, 'Whitespace string is valid Google Maps URL');
assert(isValidGoogleMapsUrl(undefined) === true, 'Undefined is valid Google Maps URL');
assert(isValidGoogleMapsUrl(null) === true, 'Null is valid Google Maps URL');

const intakeA = createIntakeDataWithCampus(campusA);
const compA = calculateIntakeCompleteness('school-website', intakeA);
assert(compA.sectionPercentages['campuses'] === 100, 'Test A: Campuses section percentage is 100% with empty Google Maps field');
assert(!compA.missingFields.some((f) => typeof f === 'string' && f.includes('Google Maps')), 'Test A: No missing field warning for empty Google Maps link');

// -----------------------------------------------------------------------------
// TEST B: Valid maps.google.com URL -> saved correctly
// -----------------------------------------------------------------------------
console.log('\n--- TEST B: Valid maps.google.com URL -> saved correctly ---');
const validGoogleUrl = 'https://maps.google.com/?q=26.65,84.9';
assert(isValidGoogleMapsUrl(validGoogleUrl) === true, 'Test B: maps.google.com URL is recognized as valid');
assert(isValidGoogleMapsUrl('https://www.google.com/maps/place/School/@26.65,84.9,17z') === true, 'Test B: www.google.com/maps URL is recognized as valid');
assert(isValidGoogleMapsUrl('https://google.com/maps/search/?api=1&query=School') === true, 'Test B: google.com/maps URL is recognized as valid');
assert(isValidGoogleMapsUrl('https://maps.google.co.in/maps?q=School') === true, 'Test B: regional maps.google.co.in URL is recognized as valid');

const campusB: CampusBranchData = {
  ...campusA,
  googleMapsLink: validGoogleUrl,
  googleMapsUrl: validGoogleUrl,
};
const compB = calculateIntakeCompleteness('school-website', createIntakeDataWithCampus(campusB));
assert(compB.sectionPercentages['campuses'] === 100, 'Test B: Section completion is 100% with valid maps.google.com URL');
assert(!compB.missingFields.some((f) => typeof f === 'string' && f.includes('Google Maps')), 'Test B: No missing field error for valid URL');

// -----------------------------------------------------------------------------
// TEST C: Valid maps.app.goo.gl URL -> saved correctly
// -----------------------------------------------------------------------------
console.log('\n--- TEST C: Valid maps.app.goo.gl URL -> saved correctly ---');
const validAppShortUrl = 'https://maps.app.goo.gl/9ZxKj2b8wL7p';
assert(isValidGoogleMapsUrl(validAppShortUrl) === true, 'Test C: maps.app.goo.gl URL is recognized as valid');
assert(isValidGoogleMapsUrl('http://maps.app.goo.gl/9ZxKj2b8wL7p') === true, 'Test C: http maps.app.goo.gl URL is recognized as valid');
assert(isValidGoogleMapsUrl('maps.app.goo.gl/9ZxKj2b8wL7p') === true, 'Test C: protocol-less maps.app.goo.gl URL is recognized as valid');
assert(isValidGoogleMapsUrl('https://goo.gl/maps/k3n8zL') === true, 'Test C: goo.gl/maps short link is recognized as valid');

const campusC: CampusBranchData = {
  ...campusA,
  googleMapsLink: validAppShortUrl,
  googleMapsUrl: validAppShortUrl,
};
const compC = calculateIntakeCompleteness('school-website', createIntakeDataWithCampus(campusC));
assert(compC.sectionPercentages['campuses'] === 100, 'Test C: Section completion is 100% with valid maps.app.goo.gl URL');

// -----------------------------------------------------------------------------
// TEST D: Invalid URL -> inline validation
// -----------------------------------------------------------------------------
console.log('\n--- TEST D: Invalid URL -> inline validation ---');
assert(isValidGoogleMapsUrl('not-a-valid-url') === false, 'Test D: Arbitrary string fails validation');
assert(isValidGoogleMapsUrl('https://facebook.com/schoolpage') === false, 'Test D: Non-Google Maps URL (Facebook) fails validation');
assert(isValidGoogleMapsUrl('https://twitter.com/school') === false, 'Test D: Non-Google Maps URL (Twitter) fails validation');
assert(isValidGoogleMapsUrl('https://google.com/search?q=myschool') === false, 'Test D: Google Web Search URL fails maps validation');

const campusD: CampusBranchData = {
  ...campusA,
  googleMapsLink: 'https://example.com/not-a-map',
  googleMapsUrl: 'https://example.com/not-a-map',
};
const compD = calculateIntakeCompleteness('school-website', createIntakeDataWithCampus(campusD));
assert(compD.sectionPercentages['campuses'] === 100, 'Test D: Google Maps Location Link NEVER affects the campus section completion percentage');
assert(compD.missingFields.some((f) => typeof f === 'string' && f.includes('valid Google Maps link')), 'Test D: Invalid URL generates validation warning message');
assert(compD.isSubmissionReady === false, 'Test D: Submission blocked until invalid URL is fixed or cleared');

// -----------------------------------------------------------------------------
// TEST E & F: Save Draft & Reload -> URL persists
// -----------------------------------------------------------------------------
console.log('\n--- TEST E & F: Save Draft & Reload -> URL persists ---');
const intakeWithMaps = createIntakeDataWithCampus(campusC);
const serializedDraft = JSON.stringify(intakeWithMaps);
assert(serializedDraft.includes('maps.app.goo.gl/9ZxKj2b8wL7p'), 'Test E: Saved draft JSON contains Google Maps link');

const reloadedDraft: UniversalIntakeData = JSON.parse(serializedDraft);
const reloadedCampus = reloadedDraft.campuses?.[0];
assert(reloadedCampus?.googleMapsLink === validAppShortUrl, 'Test F: Reloaded campus restores googleMapsLink exactly');
assert(reloadedCampus?.googleMapsUrl === validAppShortUrl, 'Test F: Reloaded campus restores googleMapsUrl exactly');

// -----------------------------------------------------------------------------
// TEST G: Public website with URL -> map/directions action appears
// -----------------------------------------------------------------------------
console.log('\n--- TEST G: Public website with URL -> map/directions action appears ---');
const pageCode = readFileSync('src/app/schools/[slug]/page.tsx', 'utf8');
assert(pageCode.includes('View on Google Maps'), 'Test G: Website includes "View on Google Maps" action');
assert(pageCode.includes('View on Google Maps / Get Directions'), 'Test G: Website includes "Get Directions" action in Campuses card');
assert(pageCode.includes('ExternalLink'), 'Test G: Website renders external link indicator icon');
assert(pageCode.includes('target="_blank"'), 'Test G: External link opens in a new tab');
assert(pageCode.includes('rel="noopener noreferrer"'), 'Test G: External link has safe security rel attributes');

// -----------------------------------------------------------------------------
// TEST H: Public website without URL -> no map/directions action appears
// -----------------------------------------------------------------------------
console.log('\n--- TEST H: Public website without URL -> no map/directions action appears ---');
assert(!pageCode.includes('<iframe'), 'Test H: Zero iframe embedding that could produce broken or empty maps');
assert(pageCode.includes('{mainMapsLink && ('), 'Test H: Hero map link is strictly conditional on URL presence');
assert(pageCode.includes('{cMapsLink && ('), 'Test H: Campus card map link is strictly conditional on URL presence');

// -----------------------------------------------------------------------------
// TEST I: Removing URL -> map/directions action disappears
// -----------------------------------------------------------------------------
console.log('\n--- TEST I: Removing URL -> map/directions action disappears ---');
const campusCleared: CampusBranchData = {
  ...campusC,
  googleMapsLink: '',
  googleMapsUrl: '',
};
const compCleared = calculateIntakeCompleteness('school-website', createIntakeDataWithCampus(campusCleared));
assert(compCleared.sectionPercentages['campuses'] === 100, 'Test I: Campus remains 100% complete after removing URL');
assert(!compCleared.missingFields.some((f) => typeof f === 'string' && f.includes('Google Maps')), 'Test I: No errors after clearing URL');

// -----------------------------------------------------------------------------
// TEST J: Existing campus address remains unchanged in every case
// -----------------------------------------------------------------------------
console.log('\n--- TEST J: Existing campus address remains unchanged in every case ---');
const originalAddress = campusA.address;
const originalCity = campusA.city;
const originalDistrict = campusA.district;
const originalState = campusA.state;
const originalPin = campusA.pin;
const originalCountry = campusA.country;

assert(campusB.address === originalAddress, 'Test J: Address untouched when setting maps.google.com URL');
assert(campusC.address === originalAddress, 'Test J: Address untouched when setting maps.app.goo.gl URL');
assert(campusD.address === originalAddress, 'Test J: Address untouched when entering invalid URL');
assert(campusCleared.address === originalAddress, 'Test J: Address untouched when clearing URL');
assert(campusCleared.city === originalCity && campusCleared.district === originalDistrict, 'Test J: City and District untouched');
assert(campusCleared.state === originalState && campusCleared.pin === originalPin && campusCleared.country === originalCountry, 'Test J: State, PIN, Country untouched');

// -----------------------------------------------------------------------------
// UI & ACCESSIBILITY AUDIT IN SchoolOnboardingPortal.tsx
// -----------------------------------------------------------------------------
console.log('\n--- UI & ACCESSIBILITY AUDIT IN SchoolOnboardingPortal.tsx ---');
const portalCode = readFileSync('src/components/schools/SchoolOnboardingPortal.tsx', 'utf8');

// Section title
assert(portalCode.includes('Campus Location'), 'Portal UI: Section title "Campus Location" is present');

// Field & Optional label
assert(portalCode.includes('Google Maps Location Link'), 'Portal UI: Field label "Google Maps Location Link" is present');
assert(portalCode.includes('Optional'), 'Portal UI: "Optional" label is present');

// Helper text exact match
assert(
  portalCode.includes("If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school&apos;s website.") ||
  portalCode.includes("If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school's website."),
  'Portal UI: Helper text matches product specification exactly'
);

// Input placeholder
assert(portalCode.includes('placeholder="https://maps.app.goo.gl/..."'), 'Portal UI: Input placeholder is "https://maps.app.goo.gl/..."');

// No Detect Location button
assert(!portalCode.includes('Detect Location'), 'Portal UI: No "Detect Location" button is present');
assert(!portalCode.includes('reverseGeocode'), 'Portal UI: No reverse geocoding present');
assert(!portalCode.includes('CampusMapPinPicker'), 'Portal UI: CampusMapPinPicker is not mounted in portal');

// Inline validation error
assert(portalCode.includes('Please enter a valid Google Maps link.'), 'Portal UI: Inline validation message is present');
assert(portalCode.includes('role="alert"'), 'Portal UI: Accessibility alert role is present on error message');

// Accessibility
assert(portalCode.includes('htmlFor={`campus-${camp.id || idx}-google-maps-link`}'), 'Portal UI: Proper label associated with input via htmlFor');
assert(portalCode.includes('id={`campus-${camp.id || idx}-google-maps-link`}'), 'Portal UI: Accessible id attribute on input element');

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passed + failed}`);
console.log(`PASSED:       ${passed}`);
console.log(`FAILED:       ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n[PASS] ALL CAMPUS LOCATION REFINEMENT TESTS PASSED (100% SUCCESS)');
}
