import assert from 'assert';
import {
  INTEGRATION_REQUIREMENT_STATUSES,
  PAYMENT_GATEWAY_PROVIDERS,
  SMS_GATEWAY_PROVIDERS,
  WHATSAPP_PROVIDERS,
  BIOMETRIC_STATUSES,
  BIOMETRIC_DEVICE_TYPES,
  DIGILOCKER_STATUSES,
  PRESET_ADDITIONAL_INTEGRATIONS,
  detectSecretPattern,
  syncIntegrationsLegacyMirrors,
  createDefaultIntegrationsConfig,
  normalizeIntegrationsData,
  validateIntegrationsData,
  getIntegrationsSectionScore,
  getIntegrationsSummary,
} from '../integrationsUtils';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../schoolIntake';
import type { IntegrationsData } from '../types';

console.log('================================================================');
console.log('  SECTION 19: THIRD-PARTY INTEGRATION SELECTIONS UNIT TESTS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(err);
    failCount++;
  }
}

// ─── 1. CATALOGS & REGISTRIES ─────────────────────────────────────────────────
console.log('--- 1. Testing Option Catalogs & Registry Integrity ---');

runTest('Core option catalogs are populated with valid entries', () => {
  assert(INTEGRATION_REQUIREMENT_STATUSES.length >= 5, 'At least 5 integration requirement statuses registered');
  assert(INTEGRATION_REQUIREMENT_STATUSES.some((s) => s.value === 'required'));
  assert(INTEGRATION_REQUIREMENT_STATUSES.some((s) => s.value === 'not_required'));
  assert(INTEGRATION_REQUIREMENT_STATUSES.some((s) => s.value === 'future'));
  assert(INTEGRATION_REQUIREMENT_STATUSES.some((s) => s.value === 'not_decided'));

  assert(PAYMENT_GATEWAY_PROVIDERS.length >= 5, 'At least 5 payment gateway options registered');
  assert(PAYMENT_GATEWAY_PROVIDERS.some((p) => p.value === 'razorpay'));
  assert(PAYMENT_GATEWAY_PROVIDERS.some((p) => p.value === 'phonepe'));
  assert(PAYMENT_GATEWAY_PROVIDERS.some((p) => p.value === 'other'));

  assert(SMS_GATEWAY_PROVIDERS.length >= 5, 'At least 5 SMS gateway options registered');
  assert(SMS_GATEWAY_PROVIDERS.some((s) => s.value === 'msg91'));
  assert(SMS_GATEWAY_PROVIDERS.some((s) => s.value === 'fast2sms'));

  assert(WHATSAPP_PROVIDERS.length >= 4, 'At least 4 WhatsApp options registered');
  assert(WHATSAPP_PROVIDERS.some((w) => w.value === 'meta_cloud_api'));

  assert(BIOMETRIC_STATUSES.length >= 5, 'At least 5 biometric statuses registered');
  assert(BIOMETRIC_STATUSES.some((b) => b.value === 'required'));
  assert(BIOMETRIC_STATUSES.some((b) => b.value === 'existing'));

  assert(BIOMETRIC_DEVICE_TYPES.length >= 4, 'At least 4 biometric device types registered');
  assert(BIOMETRIC_DEVICE_TYPES.some((d) => d.value === 'fingerprint'));
  assert(BIOMETRIC_DEVICE_TYPES.some((d) => d.value === 'face_recognition'));

  assert(DIGILOCKER_STATUSES.length >= 4, 'At least 4 DigiLocker statuses registered');
  assert(PRESET_ADDITIONAL_INTEGRATIONS.length >= 5, 'Preset additional integrations registered');
});

// ─── 2. NORMALIZATION & LEGACY MIGRATION ──────────────────────────────────────
console.log('\n--- 2. Testing Normalization & Safe Legacy Migration ---');

runTest('Default configuration initializes cleanly with 5 core categories', () => {
  const config = createDefaultIntegrationsConfig();
  assert(config.payment !== undefined, 'Payment sub-object initialized');
  assert.strictEqual(config.payment?.status, 'required');
  assert.strictEqual(config.payment?.provider, 'razorpay');
  assert.strictEqual(config.payment?.environment, 'test_sandbox');

  assert(config.sms !== undefined, 'SMS sub-object initialized');
  assert.strictEqual(config.sms?.status, 'required');
  assert.strictEqual(config.sms?.provider, 'msg91');

  assert(config.whatsapp !== undefined, 'WhatsApp sub-object initialized');
  assert.strictEqual(config.whatsapp?.status, 'required');
  assert.strictEqual(config.whatsapp?.provider, 'meta_cloud_api');

  assert(config.biometrics !== undefined, 'Biometrics sub-object initialized');
  assert.strictEqual(config.biometrics?.status, 'required');
  assert.strictEqual(config.biometrics?.deviceType, 'fingerprint');

  assert(config.digilocker !== undefined, 'DigiLocker sub-object initialized');
  assert(Array.isArray(config.additionalIntegrations), 'Additional integrations array initialized');
});

runTest('Legacy raw intake data migrates cleanly into modern structure', () => {
  const legacyData: Partial<IntegrationsData> = {
    paymentGateway: 'razorpay',
    smsGateway: 'msg91',
    whatsappProvider: 'meta_cloud_api',
    biometricAttendanceSync: true,
    accountingSoftware: 'tally',
    selectedIntegrations: {
      razorpay: true,
      sms: true,
      whatsapp: true,
      biometric: true,
      rfid: false,
      digilocker: false,
      googleWorkspace: true,
      googleMaps: true,
    },
  };

  const normalized = normalizeIntegrationsData(legacyData);
  assert.strictEqual(normalized.payment?.status, 'required');
  assert.strictEqual(normalized.payment?.provider, 'razorpay');
  assert.strictEqual(normalized.sms?.status, 'required');
  assert.strictEqual(normalized.sms?.provider, 'msg91');
  assert.strictEqual(normalized.whatsapp?.status, 'required');
  assert.strictEqual(normalized.whatsapp?.provider, 'meta_cloud_api');
  assert.strictEqual(normalized.biometrics?.status, 'required');
  assert.strictEqual(normalized.biometrics?.deviceType, 'fingerprint');
  assert.strictEqual(normalized.digilocker?.status, 'future');
});

// ─── 3. BIDIRECTIONAL LEGACY MIRROR SYNCHRONIZATION ────────────────────────────
console.log('\n--- 3. Testing Bidirectional Legacy Mirror Synchronization ---');

runTest('Modern configuration synchronizes downstream legacy mirrors', () => {
  const config = createDefaultIntegrationsConfig();

  // Test Razorpay synchronization
  config.payment = {
    status: 'required',
    provider: 'razorpay',
    environment: 'production',
    intendedUses: ['online_fees'],
  };
  const synced = syncIntegrationsLegacyMirrors(config);
  assert.strictEqual(synced.paymentGateway, 'razorpay');
  assert.strictEqual(synced.selectedIntegrations?.razorpay, true);

  // Test No Payment Gateway synchronization
  config.payment = {
    status: 'not_required',
    provider: 'none',
    environment: 'not_decided',
    intendedUses: [],
  };
  const syncedNone = syncIntegrationsLegacyMirrors(config);
  assert.strictEqual(syncedNone.paymentGateway, 'none');
  assert.strictEqual(syncedNone.selectedIntegrations?.razorpay, false);

  // Test SMS synchronization
  config.sms = {
    status: 'required',
    provider: 'fast2sms',
    intendedUses: ['otp'],
  };
  const syncedSms = syncIntegrationsLegacyMirrors(config);
  assert.strictEqual(syncedSms.smsGateway, 'fast2sms');
  assert.strictEqual(syncedSms.selectedIntegrations?.sms, true);

  // Test WhatsApp synchronization
  config.whatsapp = {
    status: 'not_required',
    provider: 'none',
    businessAccountStatus: 'not_sure',
    phoneNumberStatus: 'not_sure',
    intendedUses: [],
  };
  const syncedWa = syncIntegrationsLegacyMirrors(config);
  assert.strictEqual(syncedWa.whatsappProvider, 'none');
  assert.strictEqual(syncedWa.selectedIntegrations?.whatsapp, false);

  // Test Biometrics & RFID synchronization
  config.biometrics = {
    status: 'required',
    deviceType: 'rfid',
    deviceCount: 4,
    apiAvailability: 'yes',
  };
  const syncedBio = syncIntegrationsLegacyMirrors(config);
  assert.strictEqual(syncedBio.biometricAttendanceSync, true);
  assert.strictEqual(syncedBio.selectedIntegrations?.biometric, true);
  assert.strictEqual(syncedBio.selectedIntegrations?.rfid, true);
});

// ─── 4. VALIDATION & SECURITY (NO SECRETS) ────────────────────────────────────
console.log('\n--- 4. Testing Validation & Security Checks ---');

runTest('Valid configuration passes validation with zero errors', () => {
  const config = createDefaultIntegrationsConfig();
  const res = validateIntegrationsData(config);
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(Object.keys(res.errors).length, 0);
  assert.strictEqual(res.missingFields.length, 0);
});

runTest('Missing provider name when "Other" is selected is flagged', () => {
  const config = createDefaultIntegrationsConfig();
  config.payment = {
    status: 'required',
    provider: 'other',
    environment: 'test_sandbox',
    intendedUses: ['online_fees'],
    otherProvider: '', // Blank name
  };

  const res = validateIntegrationsData(config);
  assert.strictEqual(res.isValid, false);
  assert(res.errors['payment.otherProvider'] !== undefined, 'Error on payment.otherProvider');
  assert(res.missingFields.some((mf) => mf.includes('Payment Gateway: Other Provider Name')));

  // Adding name fixes error
  config.payment.otherProvider = 'HDFC SmartHub';
  const fixedRes = validateIntegrationsData(config);
  assert.strictEqual(fixedRes.isValid, true);
});

runTest('Invalid negative biometric device count is rejected', () => {
  const config = createDefaultIntegrationsConfig();
  config.biometrics = {
    status: 'required',
    deviceType: 'fingerprint',
    deviceCount: -2,
    apiAvailability: 'yes',
  };

  const res = validateIntegrationsData(config);
  assert.strictEqual(res.isValid, false);
  assert(res.errors['biometrics.deviceCount'] !== undefined);
  assert(res.missingFields.some((mf) => mf.includes('Valid Device Count')));
});

runTest('Secret detector identifies and blocks accidental credential entry', () => {
  assert.strictEqual(detectSecretPattern('rzp_live_123456789012345678'), true, 'Detects Razorpay live key');
  assert.strictEqual(detectSecretPattern('sk_live_999999999999999999'), true, 'Detects Stripe secret key');
  assert.strictEqual(detectSecretPattern('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), true, 'Detects Bearer JWT token');
  assert.strictEqual(detectSecretPattern('HDFC SmartHub Payment Gateway'), false, 'Accepts normal provider name');
  assert.strictEqual(detectSecretPattern('eSSL K90 Pro Biometric Attendance Machine'), false, 'Accepts hardware model name');

  const config = createDefaultIntegrationsConfig();
  config.payment = {
    status: 'required',
    provider: 'other',
    environment: 'test_sandbox',
    intendedUses: ['online_fees'],
    otherProvider: 'rzp_live_abcdef1234567890',
  };

  const res = validateIntegrationsData(config);
  assert.strictEqual(res.isValid, false);
  assert(res.errors['payment.otherProvider']?.includes('Security warning'));
});

// ─── 5. COMPLETION SCORING ─────────────────────────────────────────────────────
console.log('\n--- 5. Testing Completion Scoring ---');

runTest('Empty configuration scores 0% with all 5 missing categories', () => {
  const score = getIntegrationsSectionScore({});
  assert.strictEqual(score.total, 5);
  assert.strictEqual(score.filled, 0);
  assert.strictEqual(score.percentage, 0);
  assert.strictEqual(score.isComplete, false);
  assert.strictEqual(score.missingFields.length, 5);
});

runTest('Complete default configuration scores 100%', () => {
  const config = createDefaultIntegrationsConfig();
  const score = getIntegrationsSectionScore(config);
  assert.strictEqual(score.total, 5);
  assert.strictEqual(score.filled, 5);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.isComplete, true);
  assert.strictEqual(score.missingFields.length, 0);
});

runTest('Partial configuration scores proportionally (e.g. 4/5 = 80%)', () => {
  const config = createDefaultIntegrationsConfig();
  // Clear SMS status
  config.sms = undefined;

  const score = getIntegrationsSectionScore(config);
  assert.strictEqual(score.total, 5);
  assert.strictEqual(score.filled, 4);
  assert.strictEqual(score.percentage, 80);
  assert.strictEqual(score.isComplete, false);
  assert(score.missingFields.some((mf) => mf.includes('SMS Gateway')));
});

// ─── 6. INTEGRATION WITH INTAKE COMPLETENESS ──────────────────────────────────
console.log('\n--- 6. Testing Integration with calculateIntakeCompleteness ---');

runTest('calculateIntakeCompleteness accurately reflects Section 19 completion', () => {
  const intakeData = createInitialIntakeData({ schoolName: 'Test Academy' });
  const completeness = calculateIntakeCompleteness('school-erp', intakeData);

  assert.strictEqual(completeness.sectionPercentages['integrationsConfig'], 100);
  assert.strictEqual(completeness.sectionStatuses['integrationsConfig'], 'complete');

  // Incomplete integrationsConfig drops percentage dynamically
  intakeData.integrationsConfig = {
    payment: {
      status: 'required',
      provider: 'razorpay',
      environment: 'test_sandbox',
      intendedUses: ['online_fees'],
    },
    // Missing other 4 categories
  };

  const droppedCompleteness = calculateIntakeCompleteness('school-erp', intakeData);
  assert.strictEqual(droppedCompleteness.sectionPercentages['integrationsConfig'], 20);
  assert.strictEqual(droppedCompleteness.sectionStatuses['integrationsConfig'], 'partially_configured');
});

// ─── 7. DYNAMIC CONFIGURATION SUMMARY ──────────────────────────────────────────
console.log('\n--- 7. Testing Dynamic Configuration Summary Generation ---');

runTest('Summary generator produces 5 readable integration summary cards', () => {
  const config = createDefaultIntegrationsConfig();
  const summary = getIntegrationsSummary(config);

  assert.strictEqual(summary.length, 5);
  assert(summary.some((s) => s.category === 'Payment Gateway' && s.provider === 'Razorpay'));
  assert(summary.some((s) => s.category === 'SMS & OTP' && s.provider === 'MSG91'));
  assert(summary.some((s) => s.category === 'WhatsApp Business' && s.provider === 'Meta WhatsApp Cloud API'));
  assert(summary.some((s) => s.category === 'Biometric Attendance'));
  assert(summary.some((s) => s.category === 'DigiLocker Repository'));
});

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED:      ${passCount}`);
console.log(`FAILED:      ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
