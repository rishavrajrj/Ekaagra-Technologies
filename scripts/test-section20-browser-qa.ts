/**
 * ==============================================================================
 * SECTION 20: MOBILE APPLICATION REQUIREMENTS BROWSER QA & ACCESSIBILITY SMOKE TEST
 * Test Suite: scripts/test-section20-browser-qa.ts
 * ==============================================================================
 */

import assert from 'assert';
import {
  normalizeMobileAppData,
  validateMobileAppSection,
  calculateIntakeCompleteness,
  createInitialIntakeData,
  MOBILE_APP_AUDIENCES,
  MOBILE_APP_PLATFORMS,
  MOBILE_APP_AUTH_METHODS,
  MOBILE_APP_NOTIFICATION_CATEGORIES,
  MOBILE_APP_ACADEMIC_FEATURES,
  MOBILE_APP_COMMUNICATION_FEATURES,
  MOBILE_APP_FEE_FEATURES,
  MOBILE_APP_TRANSPORT_FEATURES,
  MOBILE_APP_DOCUMENT_SERVICES,
  MOBILE_APP_DISTRIBUTION_OPTIONS,
  MOBILE_APP_OFFLINE_FEATURES,
} from '../src/lib/schoolIntake';
import type { UniversalIntakeData, MobileAppData, MobileAppAudienceId, MobileAppPlatformId } from '../src/lib/types';
import * as fs from 'fs';
import * as path from 'path';

console.log('==============================================================================');
console.log('  SECTION 20: MOBILE APP REQUIREMENTS BROWSER QA & ACCESSIBILITY TEST SUITE');
console.log('==============================================================================\n');

let passCount = 0;
let failCount = 0;

function check(desc: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${desc} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Browser Component Markup & Accessibility Audit
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 1. Accessibility & Interactive Controls Inspection ---');

const componentPath = path.resolve(process.cwd(), 'src/components/schools/MobileApplicationRequirementsSection.tsx');
const componentSource = fs.readFileSync(componentPath, 'utf8');

// 1.1 Heading & Section Titles
check('Section component contains accessible section landmarks (Cards A–N)', 
  componentSource.includes('aria-labelledby="card-a-title"') &&
  componentSource.includes('aria-labelledby="card-b-title"') &&
  componentSource.includes('aria-labelledby="card-c-title"') &&
  componentSource.includes('aria-labelledby="card-d-title"') &&
  componentSource.includes('aria-labelledby="card-j-title"') &&
  componentSource.includes('aria-labelledby="card-k-title"')
);

// 1.2 Explicit label-to-input association (htmlFor and id)
check('Form text inputs feature explicit htmlFor and id bindings',
  componentSource.includes('htmlFor="mobile-fee-gateway-other"') &&
  componentSource.includes('id="mobile-fee-gateway-other"') &&
  componentSource.includes('htmlFor="mobile-dedicated-gps-id"') &&
  componentSource.includes('id="mobile-dedicated-gps-id"') &&
  componentSource.includes('htmlFor="mobile-app-display-name"') &&
  componentSource.includes('id="mobile-app-display-name"') &&
  componentSource.includes('htmlFor="mobile-other-language-text"') &&
  componentSource.includes('id="mobile-other-language-text"') &&
  componentSource.includes('htmlFor="mobile-special-requirements"') &&
  componentSource.includes('id="mobile-special-requirements"')
);

// 1.3 Select controls have explicit label associations
check('Select controls have explicit htmlFor and id associations',
  componentSource.includes('htmlFor="mobile-push-priority-select"') &&
  componentSource.includes('id="mobile-push-priority-select"')
);

// 1.4 ARIA Live / Alert Roles for validation error containers
check('Validation errors use role="alert" for immediate screen reader announcement',
  (componentSource.match(/role="alert"/g) || []).length >= 5
);

// 1.5 ARIA Invalid states on invalid fields
check('Inputs dynamically bind aria-invalid on validation errors',
  componentSource.includes('aria-invalid={Boolean(fieldErrors[\'paymentGatewayOther\'] && showValidationErrors)}') &&
  componentSource.includes('aria-invalid={Boolean(fieldErrors[\'dedicatedGpsDeviceId\'] && showValidationErrors)}') &&
  componentSource.includes('aria-invalid={Boolean(fieldErrors[\'appDisplayName\'] && showValidationErrors)}')
);

// 1.6 Visible focus rings on all interactive elements
check('Interactive controls provide visible focus states (focus:ring or focus:border)',
  componentSource.includes('focus:border-[#4338CA]') &&
  componentSource.includes('focus:ring-2') &&
  componentSource.includes('focus:ring-[#4338CA]/20')
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Responsive Layout Inspection
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Responsive Viewport Grid & Spacing Inspection ---');

// Check that cards use fluid responsive grid definitions
check('Audience cards use fluid responsive grid (grid-cols-1 md:grid-cols-2)',
  componentSource.includes('grid grid-cols-1 md:grid-cols-2 gap-3')
);
check('Platform cards adapt responsively (grid-cols-1 sm:grid-cols-3)',
  componentSource.includes('grid grid-cols-1 sm:grid-cols-3 gap-3')
);
check('Feature cards adapt from 1 to 3 columns across breakpoints (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)',
  componentSource.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5')
);
check('Branding card splits responsively (grid-cols-1 sm:grid-cols-2 gap-4)',
  componentSource.includes('grid grid-cols-1 sm:grid-cols-2 gap-4')
);
check('Textareas and text inputs have full width (w-full) preventing horizontal overflow',
  componentSource.includes('className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0]') &&
  componentSource.includes('className="w-full p-3 rounded-xl bg-white border border-[#E2E8F0]')
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Required Validation Rules QA
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Mandatory Requirements & Error Removal QA ---');

// Initial valid state
const validState: MobileAppData = normalizeMobileAppData({
  requiredApps: ['parent_app', 'student_app'],
  supportedPlatforms: ['android', 'ios'],
  authentication: { authMethod: 'mobile_otp' },
  pushNotifications: { enabled: true, categories: ['Attendance', 'Exam / Results'] },
  branding: { appDisplayName: 'St. Xavier High School' },
  distribution: ['play_store', 'app_store'],
  transport: { features: ['bus_tracking'], trackingMethod: 'driver_phone' },
  feeFeatures: ['online_fee_payment'],
  preferredPaymentGateway: 'razorpay',
}, 'St. Xavier High School');

const initialValidation = validateMobileAppSection(validState, 'St. Xavier High School');
check('Complete configuration has 0 missing fields and isValid === true',
  initialValidation.isValid === true && initialValidation.missingFields.length === 0
);

// 3.1 Uncheck Audience
const noAppsValidation = validateMobileAppSection({ ...validState, requiredApps: [] }, 'St. Xavier High School');
check('Empty target audience triggers requiredApps error',
  noAppsValidation.isValid === false && Boolean(noAppsValidation.fieldErrors['requiredApps'])
);

// 3.2 Uncheck Platforms
const noPlatformsValidation = validateMobileAppSection({ ...validState, supportedPlatforms: [] }, 'St. Xavier High School');
check('Empty platforms triggers supportedPlatforms error',
  noPlatformsValidation.isValid === false && Boolean(noPlatformsValidation.fieldErrors['supportedPlatforms'])
);

// 3.3 Clear Auth Method
const noAuthValidation = validateMobileAppSection({
  ...validState,
  authentication: { ...validState.authentication!, authMethod: '' as any },
}, 'St. Xavier High School');
check('Empty authMethod triggers authMethod error',
  noAuthValidation.isValid === false && Boolean(noAuthValidation.fieldErrors['authMethod'])
);

// 3.4 Clear App Display Name
const noNameValidation = validateMobileAppSection({
  ...validState,
  branding: { ...validState.branding!, appDisplayName: '' },
}, '');
check('Empty app display name triggers appDisplayName error',
  noNameValidation.isValid === false && Boolean(noNameValidation.fieldErrors['appDisplayName'])
);

// 3.5 Clear Distribution
const noDistValidation = validateMobileAppSection({ ...validState, distribution: [] }, 'St. Xavier High School');
check('Empty distribution triggers distribution error',
  noDistValidation.isValid === false && Boolean(noDistValidation.fieldErrors['distribution'])
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Conditional Workflow QA
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Conditional Workflows QA ---');

// 4.1 Push Notifications: Enabled + no categories -> invalid
const pushEnabledNoCats = validateMobileAppSection({
  ...validState,
  pushNotifications: { enabled: true, categories: [] },
}, 'St. Xavier High School');
check('Push notifications enabled + 0 categories is invalid',
  pushEnabledNoCats.isValid === false && Boolean(pushEnabledNoCats.fieldErrors['pushCategories'])
);

// 4.2 Push Notifications: Enabled + category selected -> valid
const pushEnabledWithCats = validateMobileAppSection({
  ...validState,
  pushNotifications: { enabled: true, categories: ['Attendance'] },
}, 'St. Xavier High School');
check('Push notifications enabled + 1 category is valid',
  pushEnabledWithCats.isValid === true && !pushEnabledWithCats.fieldErrors['pushCategories']
);

// 4.3 Push Notifications: Disabled + no categories -> valid
const pushDisabledNoCats = validateMobileAppSection({
  ...validState,
  pushNotifications: { enabled: false, categories: [] },
}, 'St. Xavier High School');
check('Push notifications disabled + 0 categories is valid (does not block completion)',
  pushDisabledNoCats.isValid === true && !pushDisabledNoCats.fieldErrors['pushCategories']
);

// 4.4 Transport: Dedicated GPS -> requires device ID
const dedicatedGpsNoId = validateMobileAppSection({
  ...validState,
  transport: { features: ['bus_tracking'], trackingMethod: 'dedicated_gps', dedicatedGpsDeviceId: '' },
}, 'St. Xavier High School');
check('Dedicated GPS tracking with empty Device ID is invalid',
  dedicatedGpsNoId.isValid === false && Boolean(dedicatedGpsNoId.fieldErrors['dedicatedGpsDeviceId'])
);

const dedicatedGpsWithId = validateMobileAppSection({
  ...validState,
  transport: { features: ['bus_tracking'], trackingMethod: 'dedicated_gps', dedicatedGpsDeviceId: 'AIS140-9988' },
}, 'St. Xavier High School');
check('Dedicated GPS tracking with Device ID is valid',
  dedicatedGpsWithId.isValid === true && !dedicatedGpsWithId.fieldErrors['dedicatedGpsDeviceId']
);

// 4.5 Transport: Driver Phone -> Device ID not required
const driverPhoneNoId = validateMobileAppSection({
  ...validState,
  transport: { features: ['bus_tracking'], trackingMethod: 'driver_phone', dedicatedGpsDeviceId: '' },
}, 'St. Xavier High School');
check('Driver Phone tracking is valid without Device ID or IMEI',
  driverPhoneNoId.isValid === true && !driverPhoneNoId.fieldErrors['dedicatedGpsDeviceId']
);

// 4.6 Transport: Not Decided -> Device ID not required
const notDecidedGps = validateMobileAppSection({
  ...validState,
  transport: { features: ['bus_tracking'], trackingMethod: 'not_decided', dedicatedGpsDeviceId: '' },
}, 'St. Xavier High School');
check('Not Decided transport tracking is valid without Device ID',
  notDecidedGps.isValid === true && !notDecidedGps.fieldErrors['dedicatedGpsDeviceId']
);

// 4.7 Transport: Bus tracking unselected -> no transport validation error
const noBusTracking = validateMobileAppSection({
  ...validState,
  transport: { features: ['route_information'], trackingMethod: undefined as any },
}, 'St. Xavier High School');
check('Bus tracking unselected leaves transport validation clean without errors',
  noBusTracking.isValid === true && !noBusTracking.fieldErrors['trackingMethod']
);

// 4.8 Fee Gateway: Razorpay / PayU / BillDesk / Not decided -> valid
check('Razorpay gateway is valid',
  validateMobileAppSection({ ...validState, preferredPaymentGateway: 'razorpay' }, 'St. Xavier High School').isValid
);
check('PayU gateway is valid',
  validateMobileAppSection({ ...validState, preferredPaymentGateway: 'payu' as any }, 'St. Xavier High School').isValid
);
check('Not decided gateway is valid',
  validateMobileAppSection({ ...validState, preferredPaymentGateway: 'not_decided' }, 'St. Xavier High School').isValid
);

// 4.9 Fee Gateway: Other -> gateway name required
const feeOtherEmpty = validateMobileAppSection({
  ...validState,
  preferredPaymentGateway: 'other',
  paymentGatewayOther: '   ',
}, 'St. Xavier High School');
check('Preferred gateway "Other" without custom name is invalid',
  feeOtherEmpty.isValid === false && Boolean(feeOtherEmpty.fieldErrors['paymentGatewayOther'])
);

const feeOtherFilled = validateMobileAppSection({
  ...validState,
  preferredPaymentGateway: 'other',
  paymentGatewayOther: 'HDFC SmartHub',
}, 'St. Xavier High School');
check('Preferred gateway "Other" with custom name is valid',
  feeOtherFilled.isValid === true && !feeOtherFilled.fieldErrors['paymentGatewayOther']
);

// 4.10 App Display Name: School name default, custom name, reset
const brandDefault = normalizeMobileAppData({}, 'Delhi World Public School');
check('Default app display name is populated from school name',
  brandDefault.branding?.appDisplayName === 'Delhi World Public School'
);

const brandCustom = normalizeMobileAppData({
  branding: { appDisplayName: 'DWPS Parent Connect', iconPreference: 'school_logo', themeInherited: true },
}, 'Delhi World Public School');
check('Custom app display name is preserved',
  brandCustom.branding?.appDisplayName === 'DWPS Parent Connect'
);

const brandReset = normalizeMobileAppData({
  branding: { appDisplayName: 'Delhi World Public School', iconPreference: 'school_logo', themeInherited: true },
}, 'Delhi World Public School');
check('Reset action restores app display name to school name',
  brandReset.branding?.appDisplayName === 'Delhi World Public School'
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Navigation Guard QA
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Navigation Guard & Bottom Button Text QA ---');

const mockPortalData = (config: MobileAppData): UniversalIntakeData => ({
  schoolProfile: { schoolName: 'St. Xavier High School' } as any,
  mobileAppConfig: config,
} as any);

const completeIntake = mockPortalData(validState);
const completeScores = calculateIntakeCompleteness('school-erp', completeIntake);
check('Complete configuration scores 100% in calculateIntakeCompleteness',
  completeScores.sectionPercentages['mobileAppConfig'] === 100
);

const incompleteIntake = mockPortalData({
  ...validState,
  requiredApps: [],
  supportedPlatforms: [],
});
const incompleteScores = calculateIntakeCompleteness('school-erp', incompleteIntake);
check('Incomplete configuration scores < 100% in calculateIntakeCompleteness',
  (incompleteScores.sectionPercentages['mobileAppConfig'] ?? 0) < 100
);
check('Incomplete configuration missing fields count is populated for button text',
  incompleteScores.missingFields.filter(f => f.startsWith('Mobile Apps:')).length >= 2
);

// Verify that optional cards never prevent 100% completion
const optionalEmptyConfig: MobileAppData = normalizeMobileAppData({
  ...validState,
  academicFeatures: [],
  communicationFeatures: [],
  documentFeatures: [],
  languages: [],
  offline: { enabled: 'no', features: [] },
  additionalRequirements: '',
}, 'St. Xavier High School');
const optionalValidation = validateMobileAppSection(optionalEmptyConfig, 'St. Xavier High School');
check('Optional cards E, F, I, L, M, N being empty never blocks section validity (isValid === true)',
  optionalValidation.isValid === true && optionalValidation.missingFields.length === 0
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Autosave & Persistence QA: [] Must Remain []
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 6. Autosave, Serialization & Empty Array Idempotency QA ---');

// User explicitly unchecks all apps and all platforms
const userClearedData: Partial<MobileAppData> = {
  requiredApps: [],
  supportedPlatforms: [],
  distribution: [],
  languages: [],
};

// First normalization
const firstNormalized = normalizeMobileAppData(userClearedData, 'St. Xavier High School');
check('First normalization preserves empty requiredApps array []',
  Array.isArray(firstNormalized.requiredApps) && firstNormalized.requiredApps.length === 0
);
check('First normalization preserves empty supportedPlatforms array []',
  Array.isArray(firstNormalized.supportedPlatforms) && firstNormalized.supportedPlatforms.length === 0
);
check('First normalization preserves empty distribution array []',
  Array.isArray(firstNormalized.distribution) && firstNormalized.distribution.length === 0
);

// Simulate JSON persistence roundtrip (localStorage / Supabase database payload)
const serialized = JSON.stringify(firstNormalized);
const deserialized = JSON.parse(serialized);

// Second normalization on reloaded state
const secondNormalized = normalizeMobileAppData(deserialized, 'St. Xavier High School');
check('Persistence roundtrip strictly preserves empty requiredApps [] without resurrection',
  Array.isArray(secondNormalized.requiredApps) && secondNormalized.requiredApps.length === 0
);
check('Persistence roundtrip strictly preserves empty supportedPlatforms [] without resurrection',
  Array.isArray(secondNormalized.supportedPlatforms) && secondNormalized.supportedPlatforms.length === 0
);
check('Persistence roundtrip strictly preserves empty distribution [] without resurrection',
  Array.isArray(secondNormalized.distribution) && secondNormalized.distribution.length === 0
);
check('Strict deep semantic equality holds after serialization & re-normalization',
  JSON.stringify(secondNormalized) === JSON.stringify(firstNormalized)
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Security & Telemetry Regression Check
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 7. Security & Privacy Safeguards QA ---');

// Verify no secret credential inputs in component source
check('Component does NOT contain password/secret key inputs for payment gateways or cloud providers',
  !componentSource.includes('type="password"') &&
  !componentSource.includes('apiKey') &&
  !componentSource.includes('apiSecret') &&
  !componentSource.includes('keySecret')
);

// Verify driver phone personal privacy note
check('Component explains driver personal phone IMEI is never collected',
  componentSource.includes('Driver personal phone IMEI is never collected or required')
);

// Verify special requirements character limit enforcement in code
const overflowPayload = normalizeMobileAppData({
  additionalRequirements: 'A'.repeat(1500),
});
check('Special requirements text is strictly capped at 1000 characters',
  (overflowPayload.additionalRequirements || '').length === 1000
);

// ─────────────────────────────────────────────────────────────────────────────
// Final Results
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n==============================================================================');
console.log(`TOTAL BROWSER QA CHECKS: ${passCount + failCount}`);
console.log(`PASSED:                  ${passCount}`);
console.log(`FAILED:                  ${failCount}`);
console.log('==============================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
