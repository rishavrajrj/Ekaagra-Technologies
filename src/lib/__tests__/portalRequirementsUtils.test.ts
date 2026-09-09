import assert from 'node:assert';
import {
  PORTAL_GROUPS,
  LOGIN_METHODS,
  PARENT_FEATURES,
  STUDENT_FEATURES,
  TEACHER_FEATURES,
  ADMINISTRATOR_FEATURES,
  MANAGEMENT_FEATURES,
  FINANCE_FEATURES,
  TRANSPORT_FEATURES,
  HOSTEL_FEATURES,
  LIBRARY_FEATURES,
  DASHBOARD_WIDGETS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_CATEGORIES_TREE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_RECIPIENTS,
  EMERGENCY_EVENTS,
  EMERGENCY_CHANNELS,
  ANNOUNCEMENT_PUBLISHERS,
  ANNOUNCEMENT_APPROVAL_POLICIES,
  ANNOUNCEMENT_AUDIENCES,
  PORTAL_LANGUAGES,
  ACCESS_CHANNELS,
  resolvePortalApplicability,
  normalizePortalRequirementsData,
  validatePortalRequirementsData,
  generatePortalSummary,
  getPortalBaselineRecommendations,
} from '../portalRequirementsUtils';
import { calculateIntakeCompleteness, createInitialIntakeData } from '../schoolIntake';
import type { UniversalIntakeData, PortalRequirementsData } from '../types';

console.log('===========================================================');
console.log('TEST SUITE: Section 27 - Portal Requirements & Notifications');
console.log('===========================================================\n');

// -----------------------------------------------------------------------------
// 1. Catalogs Verification
// -----------------------------------------------------------------------------
console.log('1. Verifying Catalogs & Reference Constants...');
assert.strictEqual(PORTAL_GROUPS.length, 9, 'Must have exactly 9 portal user groups');
const expectedPortalKeys = [
  'parent', 'student', 'teacher', 'administrator',
  'management', 'finance', 'transport', 'hostel', 'library'
];
expectedPortalKeys.forEach(key => {
  assert.ok(PORTAL_GROUPS.some(g => g.id === key), `Portal group ${key} must exist`);
});

assert.strictEqual(LOGIN_METHODS.length, 6, 'Must provide 6 login methods');
assert.ok(LOGIN_METHODS.some(m => m.id === 'mobile_otp'), 'Mobile OTP must be supported');
assert.ok(LOGIN_METHODS.some(m => m.id === 'sso'), 'SSO must be supported');

assert.ok(PARENT_FEATURES.length >= 8, 'Parent features catalog must have >= 8 items');
assert.ok(STUDENT_FEATURES.length >= 7, 'Student features catalog must have >= 7 items');
assert.ok(TEACHER_FEATURES.length >= 8, 'Teacher features catalog must have >= 8 items');
assert.ok(ADMINISTRATOR_FEATURES.length >= 8, 'Administrator features catalog must have >= 8 items');
assert.ok(MANAGEMENT_FEATURES.length >= 8, 'Management features catalog must have >= 8 items');
assert.ok(FINANCE_FEATURES.length >= 7, 'Finance features catalog must have >= 7 items');
assert.ok(TRANSPORT_FEATURES.length >= 7, 'Transport features catalog must have >= 7 items');
assert.ok(HOSTEL_FEATURES.length >= 7, 'Hostel features catalog must have >= 7 items');
assert.ok(LIBRARY_FEATURES.length >= 7, 'Library features catalog must have >= 7 items');

assert.strictEqual(DASHBOARD_WIDGETS.length, 16, 'Dashboard widget matrix must have 16 widgets');
assert.strictEqual(NOTIFICATION_PRIORITIES.length, 5, 'Must have 5 notification priority levels (P1 to P5)');
assert.ok(Object.keys(NOTIFICATION_CATEGORIES_TREE).length >= 6, 'Must have >= 6 notification categories');
assert.strictEqual(NOTIFICATION_CHANNELS.length, 5, 'Must provide 5 notification channels');
assert.strictEqual(NOTIFICATION_RECIPIENTS.length, 9, 'Must provide 9 notification recipient groups');
assert.ok(EMERGENCY_EVENTS.length >= 8, 'Must provide emergency events list');
assert.strictEqual(EMERGENCY_CHANNELS.length, 5, 'Must provide emergency override channels');
assert.strictEqual(ANNOUNCEMENT_PUBLISHERS.length, 6, 'Must provide announcement publishers');
assert.strictEqual(ANNOUNCEMENT_APPROVAL_POLICIES.length, 4, 'Must provide announcement approval policies');
assert.strictEqual(ANNOUNCEMENT_AUDIENCES.length, 9, 'Must provide announcement audiences');
assert.strictEqual(PORTAL_LANGUAGES.length, 4, 'Must provide localization options');
assert.strictEqual(ACCESS_CHANNELS.length, 4, 'Must provide access channels');

console.log('✓ All 9 portal groups, 16 widgets, 5 priorities, categories, and catalogs verified.');

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
};

const daySchoolApplicability = resolvePortalApplicability(daySchoolIntake);
assert.strictEqual(daySchoolApplicability.isHostelApplicable, false, 'Hostel must be not applicable for day school');
assert.ok(daySchoolApplicability.hostelReason?.includes('Day School'), 'Reason must mention day school');
assert.strictEqual(daySchoolApplicability.isTransportApplicable, false, 'Transport must be not applicable when transport is disabled');
assert.strictEqual(daySchoolApplicability.isLibraryApplicable, false, 'Library must be not applicable when library is disabled');

// Boarding school with transport & library enabled
const boardingSchoolIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    residentialStatus: 'day_boarding',
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
};

const boardingApplicability = resolvePortalApplicability(boardingSchoolIntake);
assert.strictEqual(boardingApplicability.isHostelApplicable, true, 'Hostel must be applicable for boarding school with hostel enabled');
assert.strictEqual(boardingApplicability.isTransportApplicable, true, 'Transport must be applicable when enabled');
assert.strictEqual(boardingApplicability.isLibraryApplicable, true, 'Library must be applicable when enabled');

console.log('✓ Cross-section applicability resolution handles day school, transport, and library conditions cleanly.');

// -----------------------------------------------------------------------------
// 3. Normalization & Self-Healing Defaults
// -----------------------------------------------------------------------------
console.log('\n3. Testing Normalization and Backward Compatibility...');

// Legacy minimal input
const legacyInput: Partial<PortalRequirementsData> = {
  portals: {
    parent: 'enabled',
    student: 'disabled' as any,
    teacher: 'enabled',
    administrator: 'enabled',
    management: 'enabled',
    finance: 'enabled',
    transport: 'enabled',
    hostel: 'enabled',
    library: 'enabled',
  },
  notifications: {
    email: true,
    sms: true,
    push: false,
    whatsapp: true,
    inApp: true,
  },
};

const normalizedDaySchool = normalizePortalRequirementsData(legacyInput, daySchoolIntake);
assert.strictEqual(normalizedDaySchool.portals.parent, 'enabled', 'Parent portal should be enabled');
assert.strictEqual(normalizedDaySchool.portals.hostel, 'not_applicable', 'Hostel portal should default to not_applicable for day school');
assert.strictEqual(normalizedDaySchool.portals.transport, 'not_required', 'Transport portal should default to not_required when transport disabled');
assert.strictEqual(normalizedDaySchool.notifications?.email, true, 'Email channel preserved');
assert.strictEqual(normalizedDaySchool.notifications?.whatsapp, true, 'WhatsApp channel preserved');
assert.strictEqual(normalizedDaySchool.notifications?.push, false, 'Push notification channel preserved');

// Verify legacy sync flags are updated
assert.strictEqual(normalizedDaySchool.parentPortalEnabled, true);
assert.strictEqual(normalizedDaySchool.staffPortalEnabled, true);

// Verify defaults for missing structured fields
assert.strictEqual(normalizedDaySchool.authentication?.preferredLoginMethod, 'mobile_otp', 'Should have default login method');
assert.ok((normalizedDaySchool.parentFeatures || []).length >= 8, 'Should pre-populate parent features');
assert.strictEqual(normalizedDaySchool.emergencyNotifications?.enabled, true, 'Emergency notifications on by default');
assert.strictEqual(normalizedDaySchool.localization?.defaultLanguage, 'english', 'Primary language default');
assert.strictEqual(normalizedDaySchool.accessChannels?.web, true, 'Web access channel enabled by default');

console.log('✓ Normalization self-heals incomplete state and synchronizes legacy fields.');

// -----------------------------------------------------------------------------
// 4. Validation & Dynamic Completion Calculation
// -----------------------------------------------------------------------------
console.log('\n4. Testing Validation and Dynamic Scoring...');

// Validation on normalized day school default config
const daySchoolValidation = validatePortalRequirementsData(normalizedDaySchool, daySchoolIntake);
assert.strictEqual(daySchoolValidation.missingFields.length, 0, 'Default normalized config should have 0 missing fields');
assert.strictEqual(daySchoolValidation.isValid, true, 'Default normalized config should be valid');
assert.strictEqual(daySchoolValidation.sectionPercentage, 100, 'Complete day school config should receive 100% completion');

// Verify that day school NOT having hostel or transport enabled does not penalize score
assert.ok(!daySchoolValidation.missingFields.some(f => f.toLowerCase().includes('hostel')), 'Hostel must not produce missing fields for day school');
assert.ok(!daySchoolValidation.missingFields.some(f => f.toLowerCase().includes('transport')), 'Transport must not produce missing fields when disabled');

// Incomplete configuration: missing login method, channels, and zero features for enabled portal
const incompleteConfig: PortalRequirementsData = {
  ...normalizedDaySchool,
  authentication: {
    preferredLoginMethod: '' as any,
  },
  portals: {
    ...normalizedDaySchool.portals,
    parent: 'enabled',
  },
  parentFeatures: [], // empty!
  notifications: {
    inApp: false,
    push: false,
    email: false,
    sms: false,
    whatsapp: false,
  },
  localization: {
    defaultLanguage: '' as any,
  },
};

const incompleteValidation = validatePortalRequirementsData(incompleteConfig, daySchoolIntake);
assert.strictEqual(incompleteValidation.isValid, false, 'Incomplete config should be invalid');
assert.ok(incompleteValidation.missingFields.length >= 3, 'Must detect multiple missing fields');
assert.ok(incompleteValidation.sectionPercentage < 75, `Completion score should be reduced (got ${incompleteValidation.sectionPercentage})`);
assert.ok(incompleteValidation.missingFields.some(f => f.includes('Preferred login method')), 'Should detect missing login method');
assert.ok(incompleteValidation.missingFields.some(f => f.includes('Parent Portal')), 'Should detect empty parent portal features');
assert.ok(incompleteValidation.missingFields.some(f => f.includes('notification channel')), 'Should detect missing active notification channels');

// Test completely empty / uninitialized data (0% score)
const emptyValidation = validatePortalRequirementsData({} as any, daySchoolIntake);
assert.strictEqual(emptyValidation.isValid, false, 'Empty data should be invalid');
assert.strictEqual(emptyValidation.score.filled, 0, 'Empty data filled score should be 0');
assert.strictEqual(emptyValidation.sectionPercentage, 0, 'Empty data sectionPercentage should be 0');
assert.strictEqual(emptyValidation.missingFields.length, 7, 'Empty data should yield all 7 missing fields');

console.log(`✓ Dynamic scoring works: Full = ${daySchoolValidation.sectionPercentage}%, Incomplete = ${incompleteValidation.sectionPercentage}%, Empty = ${emptyValidation.sectionPercentage}%.`);

// -----------------------------------------------------------------------------
// 5. Dynamic Configuration Summary & Baseline Recommendations
// -----------------------------------------------------------------------------
console.log('\n5. Testing Configuration Summary & Baseline Audit...');

// Test planned portals summary
const plannedConfig: PortalRequirementsData = {
  ...normalizedDaySchool,
  portals: {
    ...normalizedDaySchool.portals,
    transport: 'planned',
  },
};
const plannedSummary = generatePortalSummary(plannedConfig);
assert.ok(plannedSummary.some(s => s.includes('Phase 2 Planned: Transport')), 'Summary must list Phase 2 Planned portals');

const summary = generatePortalSummary(normalizedDaySchool);
assert.ok(Array.isArray(summary), 'Summary must be an array of strings');
assert.ok(summary.some(s => s.includes('Parent / Guardian Portal')), 'Summary should list Parent Portal');
assert.ok(summary.some(s => s.includes('Authentication: Mobile Number + OTP')), 'Summary should list authentication');
assert.ok(summary.some(s => s.includes('Emergency alerts enabled')), 'Emergency alerts should be reflected');
assert.ok(summary.some(s => s.includes('Primary language: English')), 'Primary language label should be present');

const baselineRecommendations = getPortalBaselineRecommendations(incompleteConfig);
assert.ok(Array.isArray(baselineRecommendations), 'Baseline recommendations must be an array');
assert.ok(baselineRecommendations.length > 0, 'Incomplete config should trigger baseline recommendations');

console.log('✓ Summary statistics and baseline recommendations generated accurately.');

// -----------------------------------------------------------------------------
// 6. Integration with calculateIntakeCompleteness in schoolIntake.ts
// -----------------------------------------------------------------------------
console.log('\n6. Testing Integration with calculateIntakeCompleteness...');

const initialIntake = createInitialIntakeData({ schoolName: 'Greenwood High School' });
assert.ok(initialIntake.portalRequirements, 'Initial intake data must contain portalRequirements');
assert.strictEqual(initialIntake.portalRequirements.portals?.parent, 'enabled');

const completeness = calculateIntakeCompleteness('school-erp', initialIntake);
assert.strictEqual(completeness.sectionPercentages.portalRequirements, 100, 'Initial intake data should have 100% portalRequirements completeness');

// Intentionally break portalRequirements in intakeData
const brokenIntake: UniversalIntakeData = {
  ...initialIntake,
  portalRequirements: incompleteConfig,
};
const brokenCompleteness = calculateIntakeCompleteness('school-erp', brokenIntake);
assert.ok(brokenCompleteness.sectionPercentages.portalRequirements < 75, `Broken portal completeness should be < 75% (was ${brokenCompleteness.sectionPercentages.portalRequirements}%)`);
assert.ok(
  brokenCompleteness.missingFields.some(f => f.includes('Portal Requirements')),
  'calculateIntakeCompleteness must register missing fields for portalRequirements'
);

console.log('✓ UniversalIntakeData and calculateIntakeCompleteness integration confirmed.');

console.log('\n===========================================================');
console.log('ALL SECTION 27 UNIT TESTS PASSED SUCCESSFULLY! (6/6 SUITES)');
console.log('===========================================================');
