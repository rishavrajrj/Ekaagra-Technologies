import assert from 'node:assert';
import {
  normalizeMobileAppData,
  validateMobileAppSection,
  calculateIntakeCompleteness,
  createInitialIntakeData,
  MOBILE_APP_AUDIENCES,
  MOBILE_APP_PLATFORMS,
  MOBILE_APP_AUTH_METHODS,
  MOBILE_APP_NOTIFICATION_CATEGORIES,
  MOBILE_APP_DISTRIBUTION_OPTIONS,
} from '../schoolIntake';
import type { UniversalIntakeData, MobileAppData } from '../types';

console.log('======================================================');
console.log('TEST SUITE: Section 20 Mobile App Requirements Hardening');
console.log('======================================================\n');

// 1. Catalogs verification
console.log('1. Checking Mobile App Catalogs...');
assert.ok(MOBILE_APP_AUDIENCES.length >= 7, 'Must have at least 7 audience roles');
assert.ok(MOBILE_APP_PLATFORMS.length === 3, 'Must support Android, iOS, PWA');
assert.ok(MOBILE_APP_AUTH_METHODS.length >= 5, 'Must provide all 5 authentication methods');
assert.ok(MOBILE_APP_NOTIFICATION_CATEGORIES.length >= 13, 'Must have all 13 notification categories');
assert.ok(MOBILE_APP_DISTRIBUTION_OPTIONS.length >= 5, 'Must provide all 5 distribution options');
console.log('✓ All mobile app catalogs and options verified.');

// 2. Normalization Idempotency: normalize(normalize(x)) === normalize(x)
console.log('\n2. Testing Normalization Idempotency...');
const sampleConfigs: Partial<MobileAppData>[] = [
  {},
  { requiredApps: ['parent_app'], supportedPlatforms: ['android'] },
  {
    parentAppRequired: true,
    studentAppRequired: false,
    platforms: { android: true, ios: false, pwa: true },
    pushNotificationsRequired: false,
  },
  {
    requiredApps: [],
    supportedPlatforms: [],
    distribution: [],
    branding: { appDisplayName: '', iconPreference: 'school_logo', themeInherited: true },
    pushNotifications: { enabled: false, categories: [], priority: 'normal', emergencyMandatory: false },
  },
  {
    transport: { features: ['bus_tracking'], trackingMethod: 'dedicated_gps', dedicatedGpsDeviceId: 'GPS-9988' },
    feeFeatures: ['online_fee_payment'],
    preferredPaymentGateway: 'other',
    paymentGatewayOther: 'CustomPay',
    additionalRequirements: 'A'.repeat(1200),
  },
];

for (let i = 0; i < sampleConfigs.length; i++) {
  const c = sampleConfigs[i];
  const once = normalizeMobileAppData(c, 'Delhi Public School');
  const twice = normalizeMobileAppData(once, 'Delhi Public School');
  assert.deepStrictEqual(twice, once, `Normalization must be strictly idempotent for test case ${i + 1}`);
}
console.log('✓ Normalization is strictly idempotent across all edge cases: normalize(normalize(x)) === normalize(x).');

// 3. Legacy Backward Compatibility & Mixed Fields
console.log('\n3. Testing Legacy Backward Compatibility...');
const legacyMixed: Partial<MobileAppData> = {
  parentAppRequired: true,
  studentAppRequired: false,
  teacherAppRequired: true,
  adminAppRequired: false,
  platforms: { android: true, ios: true, pwa: false },
  pushNotificationsRequired: false,
};
const normalizedLegacy = normalizeMobileAppData(legacyMixed, 'St. Mary School');
assert.deepStrictEqual(normalizedLegacy.requiredApps, ['parent_app', 'teacher_app']);
assert.deepStrictEqual(normalizedLegacy.supportedPlatforms, ['android', 'ios']);
assert.strictEqual(normalizedLegacy.pushNotifications?.enabled, false);
assert.strictEqual(normalizedLegacy.parentAppRequired, true);
assert.strictEqual(normalizedLegacy.studentAppRequired, false);
assert.strictEqual(normalizedLegacy.platforms?.android, true);
assert.strictEqual(normalizedLegacy.platforms?.pwa, false);
console.log('✓ Legacy flags correctly migrated and synchronized bidirectionally.');

// 4. Dedicated GPS vs Driver Phone vs Hybrid vs Not Decided
console.log('\n4. Testing Transport Tracking Validation...');
// Base config with bus tracking
const baseTransport: Partial<MobileAppData> = {
  requiredApps: ['parent_app'],
  supportedPlatforms: ['android'],
  authentication: { authMethod: 'mobile_otp' },
  pushNotifications: { enabled: false, categories: [] },
  branding: { appDisplayName: 'Test School', iconPreference: 'school_logo', themeInherited: true },
  distribution: ['play_store'],
  transport: { features: ['bus_tracking'], trackingMethod: 'dedicated_gps', dedicatedGpsDeviceId: '' },
};

// 4a: dedicated_gps with empty ID -> invalid
const vGpsEmpty = validateMobileAppSection(baseTransport, 'Test School');
assert.strictEqual(vGpsEmpty.isValid, false);
assert.ok(vGpsEmpty.fieldErrors['dedicatedGpsDeviceId'], 'Dedicated GPS must require device ID');

// 4b: dedicated_gps with filled ID -> valid
const vGpsFilled = validateMobileAppSection({
  ...baseTransport,
  transport: { features: ['bus_tracking'], trackingMethod: 'dedicated_gps', dedicatedGpsDeviceId: 'AIS140-XYZ-01' },
}, 'Test School');
assert.strictEqual(vGpsFilled.isValid, true);
assert.strictEqual(vGpsFilled.fieldErrors['dedicatedGpsDeviceId'], undefined);

// 4c: hybrid with empty ID -> invalid
const vHybridEmpty = validateMobileAppSection({
  ...baseTransport,
  transport: { features: ['bus_tracking'], trackingMethod: 'hybrid', dedicatedGpsDeviceId: '' },
}, 'Test School');
assert.strictEqual(vHybridEmpty.isValid, false);
assert.ok(vHybridEmpty.fieldErrors['dedicatedGpsDeviceId'], 'Hybrid tracking must require device ID');

// 4d: driver_phone -> valid without device ID
const vDriverPhone = validateMobileAppSection({
  ...baseTransport,
  transport: { features: ['bus_tracking'], trackingMethod: 'driver_phone', dedicatedGpsDeviceId: '' },
}, 'Test School');
assert.strictEqual(vDriverPhone.isValid, true, 'Driver phone must NOT require device ID or personal IMEI');
assert.strictEqual(vDriverPhone.fieldErrors['dedicatedGpsDeviceId'], undefined);

// 4e: not_decided -> valid without device ID
const vNotDecided = validateMobileAppSection({
  ...baseTransport,
  transport: { features: ['bus_tracking'], trackingMethod: 'not_decided', dedicatedGpsDeviceId: '' },
}, 'Test School');
assert.strictEqual(vNotDecided.isValid, true, 'Not Decided tracking must be valid without device ID');

// 4f: bus tracking NOT selected -> valid even with no tracking method
const vNoBusTracking = validateMobileAppSection({
  ...baseTransport,
  transport: { features: ['route_information'], trackingMethod: undefined as any },
}, 'Test School');
assert.strictEqual(vNoBusTracking.isValid, true, 'If bus tracking is unselected, tracking method is optional');
console.log('✓ Transport tracking logic validated for dedicated_gps, hybrid, driver_phone, not_decided, and unselected.');

// 5. Push Notifications: Enabled vs Disabled vs Emergency Mandatory
console.log('\n5. Testing Push Notifications Validation...');
// 5a: enabled + categories -> valid
const vPushValid = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  pushNotifications: { enabled: true, categories: ['Attendance', 'Fees / Payment'] },
}, 'Test School');
assert.strictEqual(vPushValid.isValid, true);

// 5b: enabled + empty categories -> invalid
const vPushEmptyCats = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  pushNotifications: { enabled: true, categories: [] },
}, 'Test School');
assert.strictEqual(vPushEmptyCats.isValid, false);
assert.ok(vPushEmptyCats.fieldErrors['pushCategories'], 'Enabled push notifications must require at least 1 category');

// 5c: disabled + empty categories -> valid
const vPushDisabled = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  pushNotifications: { enabled: false, categories: [] },
}, 'Test School');
assert.strictEqual(vPushDisabled.isValid, true, 'Disabled push notifications do not require categories');

// 5d: emergencyMandatory flag normalization
const normEmergency = normalizeMobileAppData({
  pushNotifications: { enabled: true, emergencyMandatory: true, categories: ['Emergency Alerts'] },
});
assert.strictEqual(normEmergency.pushNotifications?.emergencyMandatory, true);
console.log('✓ Push notification rules correctly handle enabled, disabled, and category requirements.');

// 6. Fee Payment Gateway Validation
console.log('\n6. Testing Fee Payment Gateway Logic...');
// 6a: online fee payment enabled + razorpay -> valid
const vFeeRazorpay = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  feeFeatures: ['online_fee_payment'],
  preferredPaymentGateway: 'razorpay',
}, 'Test School');
assert.strictEqual(vFeeRazorpay.isValid, true);

// 6b: online fee payment enabled + other without name -> invalid
const vFeeOtherEmpty = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  feeFeatures: ['online_fee_payment'],
  preferredPaymentGateway: 'other',
  paymentGatewayOther: '   ',
}, 'Test School');
assert.strictEqual(vFeeOtherEmpty.isValid, false);
assert.ok(vFeeOtherEmpty.fieldErrors['paymentGatewayOther'], 'Other gateway requires custom gateway name');

// 6c: online fee payment enabled + other with name -> valid
const vFeeOtherFilled = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  feeFeatures: ['online_fee_payment'],
  preferredPaymentGateway: 'other',
  paymentGatewayOther: 'Axis EasyPay',
}, 'Test School');
assert.strictEqual(vFeeOtherFilled.isValid, true);

// 6d: online fee payment enabled + not_decided -> valid
const vFeeNotDecided = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  feeFeatures: ['online_fee_payment'],
  preferredPaymentGateway: 'not_decided',
}, 'Test School');
assert.strictEqual(vFeeNotDecided.isValid, true, 'Not Decided payment gateway is valid');

// 6e: online fee payment NOT selected -> valid without any gateway
const vFeeDisabled = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  feeFeatures: ['view_fee_structure'],
  preferredPaymentGateway: undefined,
}, 'Test School');
assert.strictEqual(vFeeDisabled.isValid, true, 'Payment gateway is not required if online fee payment is not selected');
console.log('✓ Fee payment gateway conditional validation verified.');

// 7. App Distribution Options
console.log('\n7. Testing Distribution Preferences...');
// 7a: valid distribution (play_store, app_store, pwa, internal, not_decided)
const vDistValid = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  distribution: ['play_store', 'app_store'],
}, 'Test School');
assert.strictEqual(vDistValid.isValid, true);

// 7b: not_decided distribution is valid
const vDistNotDecided = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  distribution: ['not_decided'],
}, 'Test School');
assert.strictEqual(vDistNotDecided.isValid, true);

// 7c: empty distribution is invalid
const vDistEmpty = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  distribution: [],
}, 'Test School');
assert.strictEqual(vDistEmpty.isValid, false);
assert.ok(vDistEmpty.fieldErrors['distribution']);
console.log('✓ Distribution options and empty-state validation verified.');

// 8. Branding & App Display Name
console.log('\n8. Testing Branding Display Name...');
// 8a: falls back to schoolName when undefined
const normBrandingDefault = normalizeMobileAppData({}, 'Oxford Grammar School');
assert.strictEqual(normBrandingDefault.branding?.appDisplayName, 'Oxford Grammar School');

// 8b: preserves custom display name
const normBrandingCustom = normalizeMobileAppData({
  branding: { appDisplayName: 'Oxford Parent Portal', iconPreference: 'school_logo', themeInherited: true },
}, 'Oxford Grammar School');
assert.strictEqual(normBrandingCustom.branding?.appDisplayName, 'Oxford Parent Portal');

// 8c: empty string display name flags validation error
const vBrandingEmpty = validateMobileAppSection({
  ...baseTransport,
  transport: { features: [] },
  branding: { appDisplayName: '   ', iconPreference: 'school_logo', themeInherited: true },
}, '');
assert.strictEqual(vBrandingEmpty.isValid, false);
assert.ok(vBrandingEmpty.fieldErrors['appDisplayName']);
console.log('✓ Branding name default, custom name, and empty validation verified.');

// 9. Offline Mode & Data Sync
console.log('\n9. Testing Offline Mode Configurations...');
const normOfflineDefault = normalizeMobileAppData({});
assert.strictEqual(normOfflineDefault.offline?.enabled, 'yes');
assert.ok(normOfflineDefault.offline?.features?.includes('cached_timetable'));

const normOfflineNo = normalizeMobileAppData({ offline: { enabled: 'no', features: [] } });
assert.strictEqual(normOfflineNo.offline?.enabled, 'no');

const normOfflineNotDecided = normalizeMobileAppData({ offline: { enabled: 'not_decided', features: [] } });
assert.strictEqual(normOfflineNotDecided.offline?.enabled, 'not_decided');
console.log('✓ Offline mode options (yes, no, not_decided) supported.');

// 10. Multilingual Support
console.log('\n10. Testing Multilingual Support...');
const normLangDefault = normalizeMobileAppData({});
assert.deepStrictEqual(normLangDefault.languages, ['English', 'Hindi']);

const normLangCustom = normalizeMobileAppData({
  languages: ['English', 'Tamil', 'Other'],
  otherLanguageText: 'Telugu',
});
assert.deepStrictEqual(normLangCustom.languages, ['English', 'Tamil', 'Other']);
assert.strictEqual(normLangCustom.otherLanguageText, 'Telugu');
console.log('✓ Multilingual languages and custom text supported.');

// 11. Special Requirements: 0 chars, 1000 chars, >1000 chars
console.log('\n11. Testing Special Requirements 1000-char capping...');
const normReqEmpty = normalizeMobileAppData({ additionalRequirements: '' });
assert.strictEqual(normReqEmpty.additionalRequirements, '');

const text1000 = 'X'.repeat(1000);
const normReq1000 = normalizeMobileAppData({ additionalRequirements: text1000 });
assert.strictEqual(normReq1000.additionalRequirements?.length, 1000);

const text1500 = 'Y'.repeat(1500);
const normReq1500 = normalizeMobileAppData({ additionalRequirements: text1500 });
assert.strictEqual(normReq1500.additionalRequirements?.length, 1000, 'Must truncate excess characters to 1000');
assert.strictEqual(normReq1500.additionalRequirements, 'Y'.repeat(1000));
console.log('✓ Special requirements character limit (0, 1000, >1000 chars) verified.');

// 12. Non-Mandatory Cards Audit (Cards E, F, I, L, M, N)
console.log('\n12. Testing Non-Mandatory Cards do NOT block section completion...');
const validMinimalConfig: MobileAppData = normalizeMobileAppData(
  {
    requiredApps: ['parent_app'],
    supportedPlatforms: ['android'],
    authentication: { authMethod: 'mobile_otp' },
    pushNotifications: { enabled: false, categories: [] },
    branding: { appDisplayName: 'Elite School' },
    distribution: ['play_store'],
    transport: { features: [] },
    feeFeatures: [],
    // Empty non-mandatory cards
    academicFeatures: [],
    communicationFeatures: [],
    documentFeatures: [],
    languages: [],
    offline: { enabled: 'no', features: [] },
    additionalRequirements: '',
  },
  'Elite School'
);

const vNonMandatory = validateMobileAppSection(validMinimalConfig, 'Elite School');
assert.strictEqual(vNonMandatory.isValid, true, 'Non-mandatory cards must never block section completion');
assert.strictEqual(vNonMandatory.missingFields.length, 0);
console.log('✓ Non-mandatory cards E, F, I, L, M, N verified to never block section completion.');

// 13. Dynamic Completion Scoring & calculateIntakeCompleteness
console.log('\n13. Testing Completion Scoring (0%, Partial, 100%)...');
// 13a: 100% complete
const intakeComplete: Partial<UniversalIntakeData> = {
  schoolProfile: { schoolName: 'Global International School' } as any,
  mobileAppConfig: validMinimalConfig,
};
const res100 = calculateIntakeCompleteness('school-erp', intakeComplete as any);
assert.strictEqual(res100.sectionPercentages['mobileAppConfig'], 100);

// 13b: 0% complete
const intakeZero: Partial<UniversalIntakeData> = {
  schoolProfile: { schoolName: '' } as any,
  mobileAppConfig: {
    requiredApps: [],
    supportedPlatforms: [],
    authentication: { authMethod: '' as any },
    pushNotifications: { enabled: undefined as any, categories: [] },
    branding: { appDisplayName: '' },
    distribution: [],
    transport: { features: [] },
    feeFeatures: [],
  },
};
const res0 = calculateIntakeCompleteness('school-erp', intakeZero as any);
assert.strictEqual(res0.sectionPercentages['mobileAppConfig'], 0);

// 13c: Partial completion (e.g., 3 filled out of 6)
const intakePartial: Partial<UniversalIntakeData> = {
  schoolProfile: { schoolName: '' } as any,
  mobileAppConfig: {
    requiredApps: ['parent_app'], // 1
    supportedPlatforms: ['android'], // 2
    authentication: { authMethod: 'mobile_otp' }, // 3
    pushNotifications: { enabled: undefined as any, categories: [] }, // 0
    branding: { appDisplayName: '' }, // 0
    distribution: [], // 0
    transport: { features: [] },
    feeFeatures: [],
  },
};
const resPartial = calculateIntakeCompleteness('school-erp', intakePartial as any);
assert.strictEqual(resPartial.sectionPercentages['mobileAppConfig'], 50); // 3 of 6 = 50%
console.log('✓ Completion scoring accurately computes 0%, 50%, and 100%.');

// 14. Navigation Guard Validation
console.log('\n14. Testing Navigation Guard Validation...');
const incompleteForNav: Partial<MobileAppData> = {
  requiredApps: [],
};
const navValidationFail = validateMobileAppSection(incompleteForNav, '');
assert.strictEqual(navValidationFail.isValid, false);

const completeForNav: Partial<MobileAppData> = validMinimalConfig;
const navValidationPass = validateMobileAppSection(completeForNav, 'Elite School');
assert.strictEqual(navValidationPass.isValid, true);
console.log('✓ Navigation guards strictly prevent proceeding when invalid and permit proceeding when valid.');

console.log('\n======================================================');
console.log('ALL 14 SECTION 20 AUDIT TESTS PASSED! (100% SUCCESS)');
console.log('======================================================\n');
