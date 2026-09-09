import assert from 'node:assert';
import {
  createDefaultSecurityPrivacyData,
  normalizeSecurityPrivacyData,
  validateSecurityPrivacyData,
  calculateSecuritySectionScore,
  generateSecurityPolicySummary,
  getSecurityBaselineRecommendations,
  ADMINISTRATIVE_ACCESS_MODELS,
  ADMINISTRATOR_ROLE_CATALOG,
  PERMISSION_CATEGORIES,
  TWO_FACTOR_POLICIES,
  AUTHENTICATION_METHODS,
  LOCKOUT_DURATIONS,
  SESSION_TIMEOUTS,
  AUDIT_EVENTS_CATALOG,
  AUDIT_RETENTION_PERIODS,
  SENSITIVE_DATA_CATEGORIES,
  EXPORT_FORMATS,
  NOTIFICATION_CHANNELS,
  HIGH_RISK_ACTIONS,
  DATA_ACCESS_PRINCIPLES,
  DATA_DELETION_POLICIES,
} from '../securityPrivacyUtils';
import { calculateIntakeCompleteness } from '../schoolIntake';
import type { UniversalIntakeData } from '../types';

console.log('=== RUNNING SECURITY & PRIVACY TEST SUITE ===\n');

// 1. Constants and Catalogs Test
console.log('1. Testing constants and catalogs...');
assert.strictEqual(ADMINISTRATIVE_ACCESS_MODELS.length, 4);
assert.strictEqual(ADMINISTRATOR_ROLE_CATALOG.length, 13);
assert.strictEqual(PERMISSION_CATEGORIES.length, 17);
assert.strictEqual(TWO_FACTOR_POLICIES.length, 4);
assert.strictEqual(AUTHENTICATION_METHODS.length, 5);
assert.strictEqual(LOCKOUT_DURATIONS.length, 5);
assert.strictEqual(SESSION_TIMEOUTS.length, 7);
assert.strictEqual(AUDIT_EVENTS_CATALOG.length, 18);
assert.strictEqual(AUDIT_RETENTION_PERIODS.length, 8);
assert.strictEqual(SENSITIVE_DATA_CATEGORIES.length, 9);
assert.strictEqual(EXPORT_FORMATS.length, 4);
assert.strictEqual(NOTIFICATION_CHANNELS.length, 4);
assert.strictEqual(HIGH_RISK_ACTIONS.length, 8);
assert.strictEqual(DATA_ACCESS_PRINCIPLES.length, 3);
assert.strictEqual(DATA_DELETION_POLICIES.length, 3);
console.log('✓ All catalog dimensions verified.');

// 2. Default Configuration Test
console.log('\n2. Testing default configuration initialization...');
const defaultData = createDefaultSecurityPrivacyData();
assert.strictEqual(defaultData.administratorCount, 3);
assert.strictEqual(defaultData.accessModel, 'Role-based Access Control (RBAC)');
assert.strictEqual(defaultData.twoFactor?.required, 'Required for all administrators');
assert.strictEqual(defaultData.loginSecurity?.maxFailedAttempts, 5);
assert.strictEqual(defaultData.loginSecurity?.lockoutDuration, '15 minutes');
assert.strictEqual(defaultData.loginSecurity?.minimumPasswordLength, 12);
assert.strictEqual(defaultData.sessionSecurity?.sessionTimeout, '30 minutes');
assert.strictEqual(defaultData.sessionSecurity?.concurrentSessionPolicy, 'Limit to 3 devices');
assert.strictEqual(defaultData.auditLogging?.enabled, 'Enabled and required');
assert.strictEqual(defaultData.auditLogging?.retentionPeriod, '1 year');
assert.strictEqual(defaultData.auditLogging?.events?.length, 18);
assert.strictEqual(defaultData.dataExport?.permissionModel, 'Administrators with explicit export permission');
assert.strictEqual(defaultData.dataExport?.approvalRequired, true);
assert.strictEqual(defaultData.dataExport?.maxRecordsPerExport, 10000);
assert.strictEqual(defaultData.dataExport?.formats?.length, 4);
assert.strictEqual(defaultData.privacy?.accessPrinciple, 'Strict least-privilege access');
assert.strictEqual(defaultData.privacy?.deletionPolicy, 'Manual approval required');
assert.strictEqual(defaultData.privacy?.anonymization, true);
assert.strictEqual(defaultData.privacy?.incidentNotification, true);
console.log('✓ Default security settings properly match production requirements.');

// 3. Validation Tests
console.log('\n3. Testing validation logic...');
const defaultVal = validateSecurityPrivacyData(defaultData);
assert.strictEqual(defaultVal.isValid, true);
assert.strictEqual(Object.keys(defaultVal.errors).length, 0);

// Invalid cases
const invalidVal1 = validateSecurityPrivacyData({
  ...defaultData,
  administratorCount: 0,
});
assert.strictEqual(invalidVal1.isValid, false);
assert.ok(invalidVal1.errors.administratorCount);

const invalidVal2 = validateSecurityPrivacyData({
  ...defaultData,
  loginSecurity: {
    ...defaultData.loginSecurity,
    maxFailedAttempts: 2, // Less than minimum 3
  },
});
assert.strictEqual(invalidVal2.isValid, false);
assert.ok(invalidVal2.errors.maxFailedAttempts);

const invalidVal3 = validateSecurityPrivacyData({
  ...defaultData,
  loginSecurity: {
    ...defaultData.loginSecurity,
    minimumPasswordLength: 6, // Less than minimum 8
  },
});
assert.strictEqual(invalidVal3.isValid, false);
assert.ok(invalidVal3.errors.minimumPasswordLength);

// Custom Roles Validation
const invalidCustomRole = validateSecurityPrivacyData({
  ...defaultData,
  administratorRoles: ['Super Administrator', 'Custom Role'],
  customRoles: ['Discipline Head', 'discipline head'], // Duplicate case-insensitive
});
assert.strictEqual(invalidCustomRole.isValid, false);
assert.ok(invalidCustomRole.errors.customRoles);

const validCustomRole = validateSecurityPrivacyData({
  ...defaultData,
  administratorRoles: ['Super Administrator', 'Custom Role'],
  customRoles: ['Discipline Head', 'Alumni Officer'],
});
assert.strictEqual(validCustomRole.isValid, true);
console.log('✓ Validation rules (required, bounds, custom role uniqueness) passed.');

// 4. Score & Completion Calculation Tests
console.log('\n4. Testing section score & completion calculation...');
const scoreDefault = calculateSecuritySectionScore(defaultData);
assert.strictEqual(scoreDefault.filled, scoreDefault.total);
assert.strictEqual(scoreDefault.percentage, 100);
assert.strictEqual(scoreDefault.missingFields.length, 0);

const scoreEmpty = calculateSecuritySectionScore({});
assert.strictEqual(scoreEmpty.filled, 0);
assert.strictEqual(scoreEmpty.percentage, 0);
assert.ok(scoreEmpty.missingFields.length > 0);

const scorePartial = calculateSecuritySectionScore({
  administratorCount: 4,
  accessModel: 'Role-based Access Control (RBAC)',
});
assert.ok(scorePartial.filled > 0);
assert.ok(scorePartial.percentage < 100);
console.log('✓ Dynamic score and completion percentage calculation passed.');

// 5. Dynamic Summary Generation Tests
console.log('\n5. Testing dynamic summary generation...');
const summary = generateSecurityPolicySummary(defaultData);
assert.ok(summary.length >= 7);
assert.ok(summary.some((s) => s.includes('3 administrator accounts planned')));
assert.ok(summary.some((s) => s.includes('Role-based Access Control (RBAC) enabled')));
assert.ok(summary.some((s) => s.includes('2FA required')));
assert.ok(summary.some((s) => s.includes('30 minutes session timeout')));
assert.ok(summary.some((s) => s.includes('1 year audit log retention')));
assert.ok(summary.some((s) => s.includes('Export approval required')));
assert.ok(summary.some((s) => s.includes('Strict least-privilege access')));
console.log('✓ Dynamic security policy summary verified.');

// 6. Baseline Recommendation Tests
console.log('\n6. Testing baseline security recommendations...');
const baselineCompliant = getSecurityBaselineRecommendations(defaultData);
assert.strictEqual(baselineCompliant.length, 7);
assert.ok(baselineCompliant.every((b) => b.isCompliant));

const deviantData = {
  ...defaultData,
  twoFactor: {
    required: 'Not required' as const,
    methods: ['SMS OTP'],
  },
};
const baselineDeviant = getSecurityBaselineRecommendations(deviantData);
const twoFaRec = baselineDeviant.find((b) => b.id === 'rec-2fa');
assert.strictEqual(twoFaRec?.isCompliant, false);
console.log('✓ Security baseline recommendations and deviation detection passed.');

// 7. Intake Completeness Integration Test
console.log('\n7. Testing calculateIntakeCompleteness integration...');
const sampleIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Delhi Public School',
    udiseCode: '10010100101',
    address: 'Circular Road',
    city: 'Motihari',
    district: 'East Champaran',
    state: 'Bihar',
    pin: '845401',
    phone: '9876543210',
    email: 'info@dps.edu.in',
  } as any,
  securityPrivacy: defaultData,
};
const comp = calculateIntakeCompleteness('school-complete', sampleIntake);
assert.strictEqual(comp.sectionPercentages['securityPrivacy'], 100);

const incompleteIntake: Partial<UniversalIntakeData> = {
  ...sampleIntake,
  securityPrivacy: {
    administratorCount: 2,
    // missing other required fields
  },
};
const compIncomplete = calculateIntakeCompleteness('school-complete', incompleteIntake);
assert.ok((compIncomplete.sectionPercentages['securityPrivacy'] ?? 0) < 100);
console.log('✓ School Intake completeness integration verified.');

// 8. Legacy Data Normalization Tests
console.log('\n8. Testing legacy data normalization...');
const rawLegacyPayload = {
  administratorsCount: 8,
  roles: ['Super Administrator', 'Principal / Head'],
  require2FAForAdmin: true,
  loginMethods: ['SMS OTP', 'Email OTP'],
  auditLogsRetentionMonths: 24,
  sessionTimeoutMinutes: 60,
  parentStudentRoleSeparation: true,
  dataExportPermissions: ['Super Administrator'],
};
const normalized = normalizeSecurityPrivacyData(rawLegacyPayload as any);

assert.strictEqual(normalized.administratorCount, 8);
assert.strictEqual(normalized.administratorsCount, 8);
assert.deepStrictEqual(normalized.administratorRoles, ['Super Administrator', 'Principal / Head']);
assert.deepStrictEqual(normalized.roles, ['Super Administrator', 'Principal / Head']);
assert.strictEqual(normalized.twoFactor?.required, 'Required for all administrators');
assert.strictEqual(normalized.require2FAForAdmin, true);
assert.deepStrictEqual(normalized.twoFactor?.methods, ['SMS OTP', 'Email OTP']);
assert.deepStrictEqual(normalized.loginMethods, ['SMS OTP', 'Email OTP']);
assert.strictEqual(normalized.sessionSecurity?.sessionTimeout, '1 hour');
assert.strictEqual(normalized.sessionTimeoutMinutes, 60);
assert.strictEqual(normalized.auditLogging?.retentionPeriod, '2 years');
assert.strictEqual(normalized.auditLogsRetentionMonths, 24);
assert.strictEqual(normalized.dataExport?.permissionModel, 'Administrators with explicit export permission');
assert.strictEqual(normalized.privacy?.accessPrinciple, 'Strict least-privilege access');

// Test fallback for null/undefined/empty
const normalizedNull = normalizeSecurityPrivacyData(null);
assert.strictEqual(normalizedNull.administratorCount, 3);
const normalizedEmpty = normalizeSecurityPrivacyData({});
assert.strictEqual(normalizedEmpty.administratorCount, 3);
console.log('✓ Legacy data normalization successfully inflates legacy keys and maintains bidirectional compatibility.');

// 9. Boundary & Edge Case Validation Tests
console.log('\n9. Testing boundary and edge case validation...');

// Headcount boundaries: 1 to 100
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, administratorCount: 1 }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, administratorCount: 100 }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, administratorCount: 0 }).isValid, false);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, administratorCount: 101 }).isValid, false);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, administratorCount: undefined, administratorsCount: undefined }).isValid, false);

// Failed attempts boundaries: 3 to 20
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, maxFailedAttempts: 3 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, maxFailedAttempts: 20 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, maxFailedAttempts: 2 } }).isValid, false);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, maxFailedAttempts: 21 } }).isValid, false);

// Password length boundaries: 8 to 64
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, minimumPasswordLength: 8 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, minimumPasswordLength: 64 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, minimumPasswordLength: 7 } }).isValid, false);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, loginSecurity: { ...defaultData.loginSecurity, minimumPasswordLength: 65 } }).isValid, false);

// Max export records boundaries: 100 to 1,000,000
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, dataExport: { ...defaultData.dataExport, maxRecordsPerExport: 100 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, dataExport: { ...defaultData.dataExport, maxRecordsPerExport: 1000000 } }).isValid, true);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, dataExport: { ...defaultData.dataExport, maxRecordsPerExport: 99 } }).isValid, false);
assert.strictEqual(validateSecurityPrivacyData({ ...defaultData, dataExport: { ...defaultData.dataExport, maxRecordsPerExport: 1000001 } }).isValid, false);

// 2FA requirement without methods
const noMethods2FA = validateSecurityPrivacyData({
  ...defaultData,
  twoFactor: { required: 'Required for all administrators', methods: [] },
  loginMethods: [],
});
assert.strictEqual(noMethods2FA.isValid, false);
assert.ok(noMethods2FA.errors.twoFactorMethods);

// Idle timeout conditional check
const invalidIdle = validateSecurityPrivacyData({
  ...defaultData,
  sessionSecurity: {
    ...defaultData.sessionSecurity,
    idleTimeoutEnabled: true,
    idleTimeout: '' as any,
  },
});
assert.strictEqual(invalidIdle.isValid, false);
assert.ok(invalidIdle.errors.idleTimeout);

// Custom permission matrix conditional check
const invalidCustomPerms = validateSecurityPrivacyData({
  ...defaultData,
  permissionModel: 'Custom permission matrix',
  permissions: {},
});
assert.strictEqual(invalidCustomPerms.isValid, false);
assert.ok(invalidCustomPerms.errors.permissions);

console.log('✓ All boundary and conditional edge cases verified.');

// 10. Array Deduplication & Unknown Enum Fallbacks
console.log('\n10. Testing array deduplication and safe unknown enum fallbacks...');
const dirtyPayload = {
  accessModel: 'CorruptUnknownModel' as any,
  administratorRoles: ['Super Administrator', 'Super Administrator', 'Principal / Head', ''],
  customRoles: ['Discipline Head', 'Discipline Head'],
  twoFactor: {
    required: 'Unknown2FAPolicy' as any,
    methods: ['SMS OTP', 'SMS OTP', 'Email OTP'],
  },
  auditLogging: {
    enabled: 'NonExistentPolicy' as any,
    events: ['Login', 'Login', 'Logout'],
  },
  dataExport: {
    permissionModel: 'InvalidExportModel' as any,
    formats: ['CSV', 'CSV', 'PDF'],
    sensitiveDataCategories: ['Staff information', 'Staff information'],
  },
  notifications: {
    channels: ['Email', 'Email', 'WhatsApp'],
  },
  highRiskApproval: {
    policy: 'UnknownHighRiskPolicy' as any,
    actions: ['Bulk student deletion', 'Bulk student deletion'],
  },
};

const sanitized = normalizeSecurityPrivacyData(dirtyPayload as any);
assert.strictEqual(sanitized.accessModel, defaultData.accessModel);
assert.deepStrictEqual(sanitized.administratorRoles, ['Super Administrator', 'Principal / Head']);
assert.deepStrictEqual(sanitized.customRoles, ['Discipline Head']);
assert.strictEqual(sanitized.twoFactor?.required, defaultData.twoFactor?.required);
assert.deepStrictEqual(sanitized.twoFactor?.methods, ['SMS OTP', 'Email OTP']);
assert.strictEqual(sanitized.auditLogging?.enabled, defaultData.auditLogging?.enabled);
assert.deepStrictEqual(sanitized.auditLogging?.events, ['Login', 'Logout']);
assert.strictEqual(sanitized.dataExport?.permissionModel, defaultData.dataExport?.permissionModel);
assert.deepStrictEqual(sanitized.dataExport?.formats, ['CSV', 'PDF']);
assert.deepStrictEqual(sanitized.dataExport?.sensitiveDataCategories, ['Staff information']);
assert.deepStrictEqual(sanitized.notifications?.channels, ['Email', 'WhatsApp']);
assert.strictEqual(sanitized.highRiskApproval?.policy, defaultData.highRiskApproval?.policy);
assert.deepStrictEqual(sanitized.highRiskApproval?.actions, ['Bulk student deletion']);
console.log('✓ Array deduplication and unknown enum fallbacks verified.');

// 11. Empty Selection Validation for Enabled Features
console.log('\n11. Testing empty selection validation for enabled security features...');

// 11a. Empty administrator roles
const emptyRoles = validateSecurityPrivacyData({ ...defaultData, administratorRoles: [], roles: [] });
assert.strictEqual(emptyRoles.isValid, false);
assert.ok(emptyRoles.errors.administratorRoles);

// 11b. Empty audit events when enabled
const emptyAuditEvents = validateSecurityPrivacyData({
  ...defaultData,
  auditLogging: { enabled: 'Enabled and required', events: [] },
});
assert.strictEqual(emptyAuditEvents.isValid, false);
assert.ok(emptyAuditEvents.errors.auditEvents);

// 11c. Empty export formats when export is permitted
const emptyExportFormats = validateSecurityPrivacyData({
  ...defaultData,
  dataExport: { permissionModel: 'Super Administrators only', formats: [] },
});
assert.strictEqual(emptyExportFormats.isValid, false);
assert.ok(emptyExportFormats.errors.exportFormats);

// 11d. Empty notification channels when notifications are active
const emptyChannels = validateSecurityPrivacyData({
  ...defaultData,
  notifications: {
    failedLogin: true,
    channels: [],
  },
});
assert.strictEqual(emptyChannels.isValid, false);
assert.ok(emptyChannels.errors.notificationChannels);

// 11e. Empty high-risk actions when policy is Required
const emptyHighRiskActions = validateSecurityPrivacyData({
  ...defaultData,
  highRiskApproval: {
    policy: 'Required',
    actions: [],
  },
});
assert.strictEqual(emptyHighRiskActions.isValid, false);
assert.ok(emptyHighRiskActions.errors.highRiskActions);

console.log('✓ Empty selection conditional checks for active security controls verified.');

console.log('\nALL 11 TESTS PASSED SUCCESSFULLY! ✓✓✓');
