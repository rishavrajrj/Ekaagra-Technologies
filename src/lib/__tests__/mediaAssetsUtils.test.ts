import assert from 'node:assert';
import {
  MEDIA_ASSET_CATEGORIES,
  READINESS_STATUS_OPTIONS,
  OWNERSHIP_STATUS_OPTIONS,
  DEFAULT_MEDIA_ASSETS,
  resolveMediaAssetsApplicability,
  normalizeMediaAssetsData,
  validateMediaAssetsData,
  generateMediaAssetsSummary,
  getMediaAssetsBaselineRecommendations,
} from '../mediaAssetsUtils';
import { calculateIntakeCompleteness, createInitialIntakeData } from '../schoolIntake';
import type { UniversalIntakeData, MediaAssetsData } from '../types';

console.log('===========================================================');
console.log('TEST SUITE: Section 28 - Media Assets & Content Kit');
console.log('===========================================================\n');

// -----------------------------------------------------------------------------
// 1. Catalogs & Constants Verification
// -----------------------------------------------------------------------------
console.log('1. Verifying Media Asset Catalogs & Reference Constants...');
assert.strictEqual(MEDIA_ASSET_CATEGORIES.length, 6, 'Must have exactly 6 asset categories');
const expectedCategories = [
  'branding',
  'campus_facilities',
  'people_community',
  'academic_promotional',
  'digital_channels',
  'legal_governance',
];
expectedCategories.forEach((cat) => {
  assert.ok(MEDIA_ASSET_CATEGORIES.some((c) => c.id === cat), `Category ${cat} must exist`);
});

assert.strictEqual(READINESS_STATUS_OPTIONS.length, 6, 'Must provide 6 readiness statuses');
assert.ok(READINESS_STATUS_OPTIONS.some((r) => r.id === 'not_started'));
assert.ok(READINESS_STATUS_OPTIONS.some((r) => r.id === 'ready'));
assert.ok(READINESS_STATUS_OPTIONS.some((r) => r.id === 'provided'));
assert.ok(READINESS_STATUS_OPTIONS.some((r) => r.id === 'not_applicable'));

assert.strictEqual(OWNERSHIP_STATUS_OPTIONS.length, 5, 'Must provide 5 ownership categories');
assert.ok(DEFAULT_MEDIA_ASSETS.length >= 25, 'Catalog must define comprehensive asset inventory');

console.log('✓ All 6 categories, 6 readiness statuses, ownership options, and default catalog verified.');

// -----------------------------------------------------------------------------
// 2. Cross-Section Applicability Resolution
// -----------------------------------------------------------------------------
console.log('\n2. Testing Cross-Section Applicability Resolution...');

// Day school scenario
const daySchoolIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    residentialStatus: 'day_school',
  } as any,
  hostelConfig: {
    enabled: false,
  } as any,
  transportConfig: {
    enabled: false,
  } as any,
  libraryConfig: {
    enabled: false,
  } as any,
  mobileAppConfig: {
    enabled: false,
  } as any,
};

const daySchoolApplicability = resolveMediaAssetsApplicability(daySchoolIntake);
assert.strictEqual(daySchoolApplicability.isHostelApplicable, false, 'Hostel media must be not applicable for day school');
assert.ok(daySchoolApplicability.hostelReason?.includes('Day School'), 'Reason must mention day school');
assert.strictEqual(daySchoolApplicability.isTransportApplicable, false, 'Transport media must be not applicable when transport is disabled');
assert.strictEqual(daySchoolApplicability.isLibraryApplicable, false, 'Library media must be not applicable when library is disabled');

// Boarding school with facilities enabled
const boardingSchoolIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    residentialStatus: 'boarding',
  } as any,
  hostelConfig: {
    enabled: true,
  } as any,
  transportConfig: {
    enabled: true,
  } as any,
  libraryConfig: {
    enabled: true,
  } as any,
  mobileAppConfig: {
    enabled: true,
    platforms: { android: true, ios: true, pwa: true },
  } as any,
};

const boardingApplicability = resolveMediaAssetsApplicability(boardingSchoolIntake);
assert.strictEqual(boardingApplicability.isHostelApplicable, true, 'Hostel must be applicable for boarding school');
assert.strictEqual(boardingApplicability.isTransportApplicable, true, 'Transport must be applicable when enabled');
assert.strictEqual(boardingApplicability.isLibraryApplicable, true, 'Library must be applicable when enabled');

console.log('✓ Cross-section applicability resolution accurately reflects Day School, Transport, Library & Mobile App states.');

// -----------------------------------------------------------------------------
// 3. Normalization & Backward Compatibility
// -----------------------------------------------------------------------------
console.log('\n3. Testing Normalization and Intelligent Prepopulation...');

const rawWithUpstream: Partial<UniversalIntakeData> = {
  ...daySchoolIntake,
  brandingDesign: {
    logoUrl: 'https://cdn.school.edu/logo.png',
    primaryColor: '#003366',
    secondaryColor: '#FFCC00',
  } as any,
  schoolContent: {
    aboutSchool: 'Founded in 1985 with a commitment to excellence.',
    mission: 'To nurture global leaders with strong ethics.',
  } as any,
};

const normalized = normalizeMediaAssetsData(null, rawWithUpstream);
assert.ok(normalized.assets, 'Assets record must be populated');
assert.strictEqual(normalized.assets['primary_logo'].referenceLocation, 'https://cdn.school.edu/logo.png', 'Logo reference pre-populated from Section 4');
assert.strictEqual(normalized.assets['primary_logo'].readinessStatus, 'ready', 'Logo status set to ready when logoUrl exists');
assert.ok(normalized.assets['brand_colors'].referenceLocation?.includes('#003366'), 'Brand colors pre-populated from Section 4');
assert.ok(normalized.assets['school_overview_text'].referenceLocation?.includes('Section 6'), 'Overview text pre-populated from Section 6');
assert.strictEqual(normalized.assets['hostel_facilities'].readinessStatus, 'not_applicable', 'Hostel facilities must be not_applicable for day school');
assert.strictEqual(normalized.assets['hostel_facilities'].isApplicable, false);

console.log('✓ Normalization pre-populates upstream branding and marks non-applicable facilities cleanly.');

// -----------------------------------------------------------------------------
// 4. Validation & Dynamic Completion Calculation
// -----------------------------------------------------------------------------
console.log('\n4. Testing Validation and Dynamic Scoring...');

// 4a. Completely empty data scores 0%
const emptyValidation = validateMediaAssetsData({}, daySchoolIntake);
assert.strictEqual(emptyValidation.isValid, false, 'Empty data should be invalid');
assert.strictEqual(emptyValidation.score.filled, 0, 'Empty data score filled must be 0');
assert.strictEqual(emptyValidation.sectionPercentage, 0, 'Empty data percentage must be 0%');
assert.ok(emptyValidation.missingFields.length >= 6, 'Must list missing fields for empty data');

// 4b. Partially filled data
const partialConfig: MediaAssetsData = {
  ...normalized,
  assets: {
    ...normalized.assets,
    primary_logo: { ...normalized.assets['primary_logo'], readinessStatus: 'ready' },
    campus_facade: { ...normalized.assets['campus_facade'], readinessStatus: 'ready' },
    favicon_app_icon: { ...normalized.assets['favicon_app_icon'], readinessStatus: 'ready' },
  },
  governance: {
    ...normalized.governance,
    schoolOwnershipConfirmed: true,
    studentPhotoConsentPolicyConfirmed: false, // missing!
  },
};

const partialValidation = validateMediaAssetsData(partialConfig, daySchoolIntake);
assert.strictEqual(partialValidation.isValid, false, 'Partial config should not be valid');
assert.ok(partialValidation.sectionPercentage > 0 && partialValidation.sectionPercentage < 100, `Should have partial percentage (got ${partialValidation.sectionPercentage}%)`);
assert.ok(partialValidation.missingFields.some((f) => f.includes('Student Photo Consent Policy')), 'Should detect missing student photo consent policy');

// 4c. Fully filled data: all applicable mandatory assets marked ready/provided
const fullAssets = { ...normalized.assets };
Object.keys(fullAssets).forEach((key) => {
  if (fullAssets[key].requirementLevel === 'mandatory' && fullAssets[key].isApplicable) {
    fullAssets[key] = {
      ...fullAssets[key],
      readinessStatus: 'ready',
    };
  }
});

const fullConfig: MediaAssetsData = {
  ...normalized,
  assets: fullAssets,
  governance: {
    ...normalized.governance,
    schoolOwnershipConfirmed: true,
    studentPhotoConsentPolicyConfirmed: true,
  },
};

const fullValidation = validateMediaAssetsData(fullConfig, daySchoolIntake);
assert.strictEqual(fullValidation.isValid, true, 'Complete config should be valid');
assert.strictEqual(fullValidation.sectionPercentage, 100, 'Complete config must reach 100%');
assert.strictEqual(fullValidation.missingFields.length, 0, 'Should have 0 missing fields');
assert.ok(!fullValidation.missingFields.some((f) => f.toLowerCase().includes('hostel')), 'Hostel must not be flagged for day school');

console.log(`✓ Dynamic scoring works: Empty = ${emptyValidation.sectionPercentage}%, Partial = ${partialValidation.sectionPercentage}%, Full = ${fullValidation.sectionPercentage}%.`);

// -----------------------------------------------------------------------------
// 5. Dynamic Configuration Summary & Baseline Recommendations
// -----------------------------------------------------------------------------
console.log('\n5. Testing Configuration Summary & Baseline Audit...');

const summary = generateMediaAssetsSummary(fullConfig);
assert.ok(Array.isArray(summary), 'Summary must be an array');
assert.ok(summary.some((s) => s.includes('applicable media items ready')), 'Summary must indicate ready items');
assert.ok(summary.some((s) => s.includes('copyright & ownership verified')), 'Summary must indicate ownership confirmation');

const baselineRecs = getMediaAssetsBaselineRecommendations(partialConfig);
assert.ok(Array.isArray(baselineRecs), 'Baseline recommendations must be an array');
assert.ok(baselineRecs.length > 0, 'Incomplete config should produce baseline advice');

console.log('✓ Summary statistics and baseline recommendations generated accurately.');

// -----------------------------------------------------------------------------
// 6. Integration with calculateIntakeCompleteness in schoolIntake.ts
// -----------------------------------------------------------------------------
console.log('\n6. Testing Integration with calculateIntakeCompleteness...');

const initialIntake = createInitialIntakeData({ schoolName: 'St. Xavier International School' });
assert.ok(initialIntake.mediaAssets, 'Initial intake data must contain mediaAssets');
assert.ok(initialIntake.mediaAssets.assets, 'Initial intake mediaAssets must have assets map');

const completeness = calculateIntakeCompleteness('school-erp', initialIntake);
assert.ok(
  typeof completeness.sectionPercentages.mediaAssets === 'number',
  'Completeness must evaluate mediaAssets section'
);

// Intentionally break mediaAssets in intakeData
const brokenIntake: UniversalIntakeData = {
  ...initialIntake,
  mediaAssets: {
    assets: {},
    governance: { schoolOwnershipConfirmed: false, studentPhotoConsentPolicyConfirmed: false } as any,
  },
};

const brokenCompleteness = calculateIntakeCompleteness('school-erp', brokenIntake);
assert.strictEqual(brokenCompleteness.sectionPercentages.mediaAssets, 0, 'Broken mediaAssets must score 0%');
assert.ok(
  brokenCompleteness.missingFields.some((f) => f.startsWith('Media Assets:')),
  'calculateIntakeCompleteness must register missing fields prefixed with Media Assets:'
);

console.log('✓ UniversalIntakeData and calculateIntakeCompleteness integration confirmed.');

console.log('\n===========================================================');
console.log('ALL SECTION 28 UNIT TESTS PASSED SUCCESSFULLY! (6/6 SUITES)');
console.log('===========================================================');
