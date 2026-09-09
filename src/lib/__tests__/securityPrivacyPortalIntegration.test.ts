import assert from 'node:assert';
import {
  createDefaultSecurityPrivacyData,
  normalizeSecurityPrivacyData,
  validateSecurityPrivacyData,
  calculateSecuritySectionScore,
  getSecurityBaselineRecommendations,
} from '../securityPrivacyUtils';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
  INTAKE_SECTIONS,
} from '../schoolIntake';
import type { UniversalIntakeData, SecurityAccessData } from '../types';

console.log('=== RUNNING SECTION 21 PORTAL INTEGRATION & END-TO-END AUDIT ===\n');

// 1. Initial Intake Creation & Section 21 Placement
console.log('1. Verifying Section 21 in Master Intake Data...');
const initialIntake = createInitialIntakeData({
  schoolName: 'St. Xavier International School',
  contactName: 'Fr. Thomas Joseph',
  contactEmail: 'admin@stxavier.edu.in',
  contactPhone: '9876543210',
  product_id: 'school-complete',
});

assert.ok(initialIntake.securityPrivacy, 'securityPrivacy must be populated on initial intake');
assert.strictEqual(initialIntake.securityPrivacy.administratorCount, 3);
assert.strictEqual(initialIntake.securityPrivacy.accessModel, 'Role-based Access Control (RBAC)');

const secSectionDef = INTAKE_SECTIONS.find((s) => s.key === 'securityPrivacy');
assert.ok(secSectionDef, 'Section 21 definition must exist in INTAKE_SECTIONS');
assert.strictEqual(secSectionDef.shortTitle, 'Security');
assert.strictEqual(secSectionDef.isMandatory, true);
console.log('✓ Section 21 properly initialized in canonical intake state.');

// 2. Cross-Product Tier Applicability
console.log('\n2. Verifying Applicability Across Product Tiers...');
const products = ['school-website', 'school-website-cms', 'school-erp', 'school-complete'] as const;
const applicability = products.map((prod) => ({
  prod,
  applicable: secSectionDef.applicableProducts.includes(prod),
}));

assert.strictEqual(applicability.find((p) => p.prod === 'school-website')?.applicable, false);
assert.strictEqual(applicability.find((p) => p.prod === 'school-website-cms')?.applicable, true);
assert.strictEqual(applicability.find((p) => p.prod === 'school-erp')?.applicable, true);
assert.strictEqual(applicability.find((p) => p.prod === 'school-complete')?.applicable, true);
console.log('✓ Section 21 applicability confirmed (website-cms, erp, complete).');

// 3. Dynamic Completeness Calculation & Score Reactivity
console.log('\n3. Testing Dynamic Score Reactivity upon Field Changes...');
const intakeFull = { ...initialIntake };
const compFull = calculateIntakeCompleteness('school-complete', intakeFull);
assert.strictEqual(compFull.sectionPercentages['securityPrivacy'], 100);

// User clears administrator count
const intakeNoCount: UniversalIntakeData = {
  ...initialIntake,
  securityPrivacy: {
    ...initialIntake.securityPrivacy,
    administratorCount: undefined,
    administratorsCount: undefined,
  },
};
const compNoCount = calculateIntakeCompleteness('school-complete', intakeNoCount);
assert.ok((compNoCount.sectionPercentages['securityPrivacy'] ?? 0) < 100);
assert.ok(compNoCount.missingFields.some((f) => f.includes('Administrator headcount')));

// User selects Custom Role without specifying role name
const intakeEmptyCustom: UniversalIntakeData = {
  ...initialIntake,
  securityPrivacy: {
    ...initialIntake.securityPrivacy,
    administratorRoles: ['Super Administrator', 'Custom Role'],
    customRoles: [],
  },
};
const compEmptyCustom = calculateIntakeCompleteness('school-complete', intakeEmptyCustom);
assert.ok((compEmptyCustom.sectionPercentages['securityPrivacy'] ?? 0) < 100);
assert.ok(compEmptyCustom.missingFields.some((f) => f.includes('Valid custom role names')));

console.log('✓ Completion score decreases and increases deterministically.');

// 4. Persistence Simulation: Navigation Away & Return
console.log('\n4. Simulating Section Navigation & State Preservation...');
// Simulate user customizing Section 21
let workingIntake: UniversalIntakeData = { ...initialIntake };
const customConfig: SecurityAccessData = {
  ...workingIntake.securityPrivacy!,
  administratorCount: 6,
  customRoles: ['Dean of Student Welfare', 'Head of Examination'],
  administratorRoles: ['Super Administrator', 'Principal / Head', 'Custom Role'],
  loginSecurity: {
    ...workingIntake.securityPrivacy!.loginSecurity,
    maxFailedAttempts: 3,
    minimumPasswordLength: 16,
  },
  sessionSecurity: {
    ...workingIntake.securityPrivacy!.sessionSecurity,
    sessionTimeout: '15 minutes',
    idleTimeoutEnabled: true,
    idleTimeout: '5 minutes',
  },
};

// Update section
workingIntake = {
  ...workingIntake,
  securityPrivacy: customConfig,
};

// Simulate navigating to Section 5, then Section 12, then returning to Section 21
const serializedDraft = JSON.stringify(workingIntake);
const restoredIntake: UniversalIntakeData = JSON.parse(serializedDraft);
const normalizedRestored = normalizeSecurityPrivacyData(restoredIntake.securityPrivacy);

assert.strictEqual(normalizedRestored.administratorCount, 6);
assert.deepStrictEqual(normalizedRestored.customRoles, ['Dean of Student Welfare', 'Head of Examination']);
assert.strictEqual(normalizedRestored.loginSecurity?.minimumPasswordLength, 16);
assert.strictEqual(normalizedRestored.sessionSecurity?.sessionTimeout, '15 minutes');
assert.strictEqual(normalizedRestored.sessionSecurity?.idleTimeout, '5 minutes');
console.log('✓ State fully preserved across serialization, reload, and navigation.');

// 5. Navigation Blocking Simulation
console.log('\n5. Simulating Navigation Blocking on Invalid Form State...');
// Invalid case: 0 administrators
const invalidSectionData: Partial<SecurityAccessData> = {
  ...workingIntake.securityPrivacy,
  administratorCount: 0,
};
const validationResult = validateSecurityPrivacyData(invalidSectionData);
assert.strictEqual(validationResult.isValid, false);
assert.ok(validationResult.errors.administratorCount);

// Simulated navigation guard
function canNavigateForward(sectionData: Partial<SecurityAccessData>): boolean {
  const v = validateSecurityPrivacyData(sectionData);
  return v.isValid;
}
assert.strictEqual(canNavigateForward(invalidSectionData), false);
assert.strictEqual(canNavigateForward(customConfig), true);
console.log('✓ Forward navigation guard prevents progression on invalid state and allows on valid state.');

// 6. Zero Operational Secrets / Non-Credential Policy Verification
console.log('\n6. Verifying Zero Operational Secrets in Data Structures...');
const forbiddenKeys = [
  'userPassword',
  'adminPassword',
  'totpSecret',
  'recoveryCode',
  'apiKey',
  'dbPassword',
  'authToken',
];

function scanForForbiddenKeys(obj: any, path = ''): string[] {
  const violations: string[] = [];
  if (!obj || typeof obj !== 'object') return violations;
  for (const [k, v] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${k}` : k;
    if (forbiddenKeys.some((fk) => k.toLowerCase() === fk.toLowerCase())) {
      violations.push(currentPath);
    }
    if (typeof v === 'object' && v !== null) {
      violations.push(...scanForForbiddenKeys(v, currentPath));
    }
  }
  return violations;
}

const detectedViolations = scanForForbiddenKeys(initialIntake.securityPrivacy);
assert.strictEqual(detectedViolations.length, 0, `No secrets or credentials permitted, but found: ${detectedViolations.join(', ')}`);
console.log('✓ Zero operational credentials or secrets verified across data structures.');

console.log('\nALL 6 INTEGRATION AUDIT TESTS PASSED SUCCESSFULLY! ✓✓✓');
