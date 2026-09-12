/**
 * ==============================================================================
 * DYNAMIC SCOPE-AWARE REQUIREMENT SYSTEM - AUTOMATED AUDIT & VERIFICATION
 * File: src/lib/__tests__/fieldScopeRegistry.test.ts
 * ==============================================================================
 *
 * Validates:
 * 1. Section applicability across all 4 products:
 *    - school-website (Website Only)
 *    - school-website-cms (Website + CMS)
 *    - school-erp (School ERP Only)
 *    - school-complete (Website + CMS + ERP)
 * 2. Field scope registry coverage and rules.
 * 3. Scope-aware scoring and conditional validation for:
 *    - Security & Privacy (CMS vs ERP)
 *    - Library Management (Website vs ERP)
 *    - Hostel / Residential (Website vs ERP)
 *    - Transport & Fleet (Website vs ERP)
 *    - Staff & Faculty (Website vs ERP)
 * 4. calculateIntakeCompleteness consistency across product types.
 */

import {
  isFieldApplicable,
  getFieldDefinitions,
  getApplicableFieldNames,
  ALL_PRODUCTS,
  ERP_PRODUCTS,
  CMS_AND_ERP_PRODUCTS,
  FIELD_SCOPE_REGISTRY,
} from '../fieldScopeRegistry';
import { isSectionApplicable, calculateIntakeCompleteness } from '../schoolIntake';
import {
  validateSecurityPrivacyData,
  calculateSecuritySectionScore,
  createDefaultSecurityPrivacyData,
} from '../securityPrivacyUtils';
import {
  validateLibraryData,
  getLibrarySectionScore,
} from '../libraryUtils';
import {
  validateHostelData,
  getHostelSectionScore,
} from '../hostelUtils';
import {
  validateTransportData,
  getTransportSectionScore,
} from '../transportUtils';
import type { UniversalIntakeData } from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n================================================================');
console.log('  DYNAMIC SCOPE-AWARE REQUIREMENT SYSTEM - AUTOMATED AUDIT');
console.log('================================================================\n');

// ─── 1. SECTION APPLICABILITY MATRIX ──────────────────────────────────────────
console.log('--- 1. Testing 29-Section Product Applicability Matrix ---');

// Website Only: must exclude ERP-only sections
assert(isSectionApplicable('schoolProfile', 'school-website'), 'schoolProfile applicable to school-website');
assert(isSectionApplicable('brandingDesign', 'school-website'), 'brandingDesign applicable to school-website');
assert(isSectionApplicable('campuses', 'school-website'), 'campuses applicable to school-website');
assert(isSectionApplicable('leadership', 'school-website'), 'leadership applicable to school-website');
assert(isSectionApplicable('admissions', 'school-website'), 'admissions applicable to school-website');
assert(!isSectionApplicable('attendanceConfig', 'school-website'), 'attendanceConfig NOT applicable to school-website');
assert(!isSectionApplicable('examinationConfig', 'school-website'), 'examinationConfig NOT applicable to school-website');
assert(isSectionApplicable('feesConfiguration', 'school-website'), 'feesConfiguration applicable to school-website');
assert(!isSectionApplicable('cmsRequirements', 'school-website'), 'cmsRequirements NOT applicable to school-website');
assert(!isSectionApplicable('securityPrivacy', 'school-website'), 'securityPrivacy NOT applicable to school-website');

// Website + CMS: includes CMS and basic security, but excludes ERP modules
assert(isSectionApplicable('cmsRequirements', 'school-website-cms'), 'cmsRequirements applicable to school-website-cms');
assert(isSectionApplicable('securityPrivacy', 'school-website-cms'), 'securityPrivacy applicable to school-website-cms');
assert(!isSectionApplicable('attendanceConfig', 'school-website-cms'), 'attendanceConfig NOT applicable to school-website-cms');
assert(isSectionApplicable('feesConfiguration', 'school-website-cms'), 'feesConfiguration applicable to school-website-cms');
assert(!isSectionApplicable('examinationConfig', 'school-website-cms'), 'examinationConfig NOT applicable to school-website-cms');

// School ERP: includes ERP modules, excludes website-only marketing sections
assert(isSectionApplicable('institutionStructure', 'school-erp'), 'institutionStructure applicable to school-erp');
assert(isSectionApplicable('studentConfig', 'school-erp'), 'studentConfig applicable to school-erp');
assert(isSectionApplicable('feesConfiguration', 'school-erp'), 'feesConfiguration applicable to school-erp');
assert(isSectionApplicable('attendanceConfig', 'school-erp'), 'attendanceConfig applicable to school-erp');
assert(isSectionApplicable('examinationConfig', 'school-erp'), 'examinationConfig applicable to school-erp');
assert(isSectionApplicable('securityPrivacy', 'school-erp'), 'securityPrivacy applicable to school-erp');
assert(!isSectionApplicable('cmsRequirements', 'school-erp'), 'cmsRequirements NOT applicable to school-erp');
assert(!isSectionApplicable('websiteRequirements', 'school-erp'), 'websiteRequirements NOT applicable to school-erp');
assert(!isSectionApplicable('domainPresence', 'school-erp'), 'domainPresence NOT applicable to school-erp');

// Complete: includes all 29 sections
assert(isSectionApplicable('websiteRequirements', 'school-complete'), 'websiteRequirements applicable to school-complete');
assert(isSectionApplicable('cmsRequirements', 'school-complete'), 'cmsRequirements applicable to school-complete');
assert(isSectionApplicable('feesConfiguration', 'school-complete'), 'feesConfiguration applicable to school-complete');
assert(isSectionApplicable('attendanceConfig', 'school-complete'), 'attendanceConfig applicable to school-complete');
assert(isSectionApplicable('securityPrivacy', 'school-complete'), 'securityPrivacy applicable to school-complete');

// ─── 2. FIELD-LEVEL SCOPING REGISTRY ──────────────────────────────────────────
console.log('\n--- 2. Testing Field-Level Scoping & Filtering ---');

// SecurityPrivacy fields
const secFields = FIELD_SCOPE_REGISTRY['securityPrivacy'] || [];
assert(secFields.length > 0, 'securityPrivacy fields are registered');
assert(isFieldApplicable('securityPrivacy', 'twoFactor', 'school-website-cms'), 'twoFactor applicable to CMS');
assert(isFieldApplicable('securityPrivacy', 'loginSecurity', 'school-website-cms'), 'loginSecurity applicable to CMS');
assert(isFieldApplicable('securityPrivacy', 'sessionSecurity', 'school-website-cms'), 'sessionSecurity applicable to CMS');
assert(!isFieldApplicable('securityPrivacy', 'accessModel', 'school-website-cms'), 'accessModel NOT applicable to CMS (ERP only)');
assert(!isFieldApplicable('securityPrivacy', 'permissions', 'school-website-cms'), 'permissions NOT applicable to CMS (ERP only)');
assert(!isFieldApplicable('securityPrivacy', 'auditLogging', 'school-website-cms'), 'auditLogging NOT applicable to CMS (ERP only)');
assert(isFieldApplicable('securityPrivacy', 'accessModel', 'school-erp'), 'accessModel IS applicable to ERP');
assert(isFieldApplicable('securityPrivacy', 'auditLogging', 'school-erp'), 'auditLogging IS applicable to ERP');

// Staff fields
assert(isFieldApplicable('staffFaculty', 'staffMembers', 'school-website'), 'staffMembers directory applicable to website');
assert(isFieldApplicable('staffFaculty', 'departments', 'school-website'), 'departments applicable to website');
assert(!isFieldApplicable('staffFaculty', 'staffIdFormat', 'school-website'), 'staffIdFormat NOT applicable to website');
assert(!isFieldApplicable('staffFaculty', 'customFields', 'school-website'), 'customFields NOT applicable to website');
assert(isFieldApplicable('staffFaculty', 'staffIdFormat', 'school-erp'), 'staffIdFormat IS applicable to ERP');

// ─── 3. SECURITY & PRIVACY VALIDATION & SCORING SCOPING ──────────────────────
console.log('\n--- 3. Testing Security & Privacy Product-Aware Scoping ---');

const cmsSecData = createDefaultSecurityPrivacyData();
// For CMS, basic login security + MFA passes validation without filling ERP access model
const cmsSecValidation = validateSecurityPrivacyData(cmsSecData, 'school-website-cms');
assert(cmsSecValidation.isValid, 'Default security data is valid for school-website-cms');

const cmsSecScore = calculateSecuritySectionScore(cmsSecData, 'school-website-cms');
assert(cmsSecScore.total === 7, `CMS security score total is 7 (was ${cmsSecScore.total})`);
assert(cmsSecScore.percentage === 100, 'CMS security score is 100% complete for default settings');

// For ERP, total includes operational access governance
const erpSecScore = calculateSecuritySectionScore(cmsSecData, 'school-erp');
assert(erpSecScore.total === 13, `ERP security score total is 13 (was ${erpSecScore.total})`);

// ─── 4. LIBRARY MANAGEMENT SCOPING ───────────────────────────────────────────
console.log('\n--- 4. Testing Library Scoping (Website vs ERP) ---');

const testLibData = {
  status: 'yes_physical' as const,
  enabled: true,
  physical: {
    estimatedPhysicalBookCount: 5000,
  },
};

// Website validation: only checks status & book count
const webLibVal = validateLibraryData(testLibData, 'school-website');
assert(webLibVal.isValid, 'Library data valid for website without RFID/circulation settings');

const webLibScore = getLibrarySectionScore(testLibData, 'school-website');
assert(webLibScore.total === 2, `Website library score total is 2 (was ${webLibScore.total})`);
assert(webLibScore.percentage === 100, 'Website library configuration is 100% complete');

// ERP validation requires operational circulation & barcode settings
const erpLibScore = getLibrarySectionScore(testLibData, 'school-erp');
assert(erpLibScore.total >= 4, `ERP library score total is at least 4 (was ${erpLibScore.total})`);

// ─── 5. HOSTEL / RESIDENTIAL SCOPING ──────────────────────────────────────────
console.log('\n--- 5. Testing Hostel Scoping (Website vs ERP) ---');

const testHostelData = {
  status: 'yes_operational' as const,
  residentialModel: 'co_ed_separate_blocks' as const,
  genderAccommodation: 'both' as const,
};

const webHostelVal = validateHostelData(testHostelData, 'school-website');
assert(webHostelVal.isValid, 'Hostel valid for website without room inventory');

const webHostelScore = getHostelSectionScore(testHostelData, true, 'school-website');
assert(webHostelScore.total === 2, `Website hostel total is 2 (was ${webHostelScore.total})`);
assert(webHostelScore.isComplete, 'Website hostel is complete with residential model & gender');

const erpHostelScore = getHostelSectionScore(testHostelData, true, 'school-erp');
assert(erpHostelScore.total === 4, `ERP hostel total is 4 (was ${erpHostelScore.total})`);

// ─── 6. TRANSPORT SCOPING ────────────────────────────────────────────────────
console.log('\n--- 6. Testing Transport Scoping (Website vs ERP) ---');

const testTransportData = {
  status: 'yes' as const,
  serviceModel: 'school_owned' as const,
  fleet: {
    totalVehicles: 4,
    approximateStudentCapacity: 160,
  },
};

const webTransportVal = validateTransportData(testTransportData, 'school-website');
assert(webTransportVal.isValid, 'Transport valid for website without individual GPS/driver registry');

const webTransportScore = getTransportSectionScore(testTransportData, 'school-website');
assert(webTransportScore.total === 2, `Website transport total is 2 (was ${webTransportScore.total})`);
assert(webTransportScore.isComplete, 'Website transport is 100% complete');

const erpTransportScore = getTransportSectionScore(testTransportData, 'school-erp');
assert(erpTransportScore.total === 5, `ERP transport total is 5 (was ${erpTransportScore.total})`);

// ─── 7. INTAKE COMPLETENESS CALCULATION ───────────────────────────────────────
console.log('\n--- 7. Testing calculateIntakeCompleteness Integration ---');

const sampleIntake: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'Delhi Public School',
    officialEmail: 'info@dpsmotihari.com',
    officialPhone: '+91 9876543210',
    schoolType: 'k12',
    boardAffiliation: ['cbse'],
    hasHostelResidential: false,
  } as any,
  brandIdentity: {
    primaryColor: '#1E3A8A',
  } as any,
  campuses: [
    {
      id: 'c1',
      name: 'Main Campus',
      isMainCampus: true,
      address: 'Main Road',
      city: 'Motihari',
      state: 'Bihar',
      country: 'India',
      pinCode: '845401',
      ownership: 'owned',
    } as any,
  ],
  leadership: {
    principalName: 'Dr. Anand Prakash',
  } as any,
  admissions: {
    status: 'open',
    applicationMethod: 'online',
    callToAction: 'Apply Now',
  } as any,
};

const websiteCompleteness = calculateIntakeCompleteness('school-website', sampleIntake as UniversalIntakeData);
assert(typeof websiteCompleteness.percentage === 'number', 'Overall percentage is computed for school-website');
assert(websiteCompleteness.sectionPercentages['feesConfiguration'] !== undefined, 'feesConfiguration IS scored for school-website');
assert(websiteCompleteness.sectionPercentages['attendanceConfig'] === undefined, 'attendanceConfig is NOT scored for school-website');

const erpCompleteness = calculateIntakeCompleteness('school-erp', sampleIntake as UniversalIntakeData);
assert(erpCompleteness.sectionPercentages['websiteRequirements'] === undefined, 'websiteRequirements is NOT scored for school-erp');
assert(erpCompleteness.sectionPercentages['domainPresence'] === undefined, 'domainPresence is NOT scored for school-erp');

// ─── FINAL RESULTS ───────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log(`TOTAL AUDIT TESTS: ${passed + failed}`);
console.log(`PASSED:             ${passed}`);
console.log(`FAILED:             ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
}
