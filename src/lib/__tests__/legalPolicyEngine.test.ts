import assert from 'node:assert/strict';
import {
  initializeLegalPolicies,
  syncPoliciesToAssetChecklist,
  calculateLegalPoliciesCompleteness,
  CANONICAL_POLICY_METADATA,
  type CanonicalPolicyKey,
} from '../legalPolicyUtils';
import { validateSchoolDocumentFile } from '../schoolAssetChecklist';
import type { LegalPolicyData, AssetChecklistItem } from '../types';

console.log('\n--- STARTING LEGAL POLICY ENGINE TEST SUITE ---\n');

// TEST 1: Policy Initialization
console.log('Test 1: initializeLegalPolicies populates default canonical templates');
const initialized = initializeLegalPolicies(undefined, {
  schoolProfile: { schoolName: 'Delhi Public Academy' } as any,
});
assert.ok(initialized.policies, 'Policies object must exist');
const policyKeys: CanonicalPolicyKey[] = [
  'privacy-policy',
  'terms-and-conditions',
  'fee-refund',
  'child-safety',
];

for (const key of policyKeys) {
  const policy = initialized.policies[key];
  assert.ok(policy, `Policy ${key} must be initialized`);
  assert.equal(policy.id, key);
  assert.equal(policy.status, 'template');
  assert.ok(
    policy.textContent && policy.textContent.includes('Delhi Public Academy'),
    `Policy ${key} template must mention school name`
  );
}
console.log('  ✓ All 4 canonical policies initialized with school customized templates');

// TEST 2: Completeness calculation
console.log('\nTest 2: calculateLegalPoliciesCompleteness accurately computes filled count and percentage');
const completeness0 = calculateLegalPoliciesCompleteness(initialized);
assert.equal(completeness0.total, 4);
assert.equal(completeness0.readyCount, 0);
assert.equal(completeness0.percentage, 0);
assert.equal(completeness0.isComplete, false);

// Approve one template policy
initialized.policies['privacy-policy'].status = 'approved';
initialized.policies['privacy-policy'].approvedAt = new Date().toISOString();
initialized.policies['privacy-policy'].approvedBy = 'Principal';
const completeness1 = calculateLegalPoliciesCompleteness(initialized);
assert.equal(completeness1.readyCount, 1);
assert.equal(completeness1.percentage, 25);
assert.equal(completeness1.policyStates['privacy-policy'].ready, true);

// Mode 2: Upload official PDF for Fee Refund
initialized.policies['fee-refund'].status = 'document_uploaded';
initialized.policies['fee-refund'].officialDocumentUrl = 'https://example.com/refund-policy.pdf';
initialized.policies['fee-refund'].officialDocumentName = 'fee-refund-2026.pdf';
const completeness2 = calculateLegalPoliciesCompleteness(initialized);
assert.equal(completeness2.readyCount, 2);
assert.equal(completeness2.percentage, 50);

// Approve remaining two policies
initialized.policies['terms-and-conditions'].status = 'approved';
initialized.policies['child-safety'].status = 'approved';
const completenessFull = calculateLegalPoliciesCompleteness(initialized);
assert.equal(completenessFull.readyCount, 4);
assert.equal(completenessFull.percentage, 100);
assert.equal(completenessFull.isComplete, true);
console.log('  ✓ Completeness calculations reflect Mode 1 approvals and Mode 2 document uploads');

// TEST 3: Bidirectional sync with Asset Checklist
console.log('\nTest 3: syncPoliciesToAssetChecklist propagates policy approvals and uploads to checklist items');
const existingChecklist: AssetChecklistItem[] = [
  { id: 'pol-privacy', title: 'Privacy Policy', category: 'policies', status: 'pending', isRequired: true },
  { id: 'pol-refund', title: 'Refund Policy', category: 'policies', status: 'pending', isRequired: true },
  { id: 'pol-terms', title: 'Terms', category: 'policies', status: 'pending', isRequired: true },
  { id: 'pol-child-safety', title: 'Child Safety', category: 'policies', status: 'pending', isRequired: true },
];

const syncedChecklist = syncPoliciesToAssetChecklist(initialized, existingChecklist);
assert.ok(syncedChecklist, 'Synced checklist must be returned');
assert.equal(syncedChecklist.length, 4);

const privacyAsset = syncedChecklist.find((a) => a.id === 'pol-privacy');
assert.ok(privacyAsset, 'pol-privacy asset checklist item must exist');
assert.equal(privacyAsset.status, 'provided');
assert.ok(privacyAsset.textContent && privacyAsset.textContent.includes('Delhi Public Academy'));

const refundAsset = syncedChecklist.find((a) => a.id === 'pol-refund');
assert.ok(refundAsset, 'pol-refund asset checklist item must exist');
assert.equal(refundAsset.status, 'provided');
assert.equal(refundAsset.fileUrl, 'https://example.com/refund-policy.pdf');
assert.equal(refundAsset.fileName, 'fee-refund-2026.pdf');
console.log('  ✓ Synced asset checklist entries contain appropriate file URLs and template notes');

// TEST 4: Strict 2 MB document upload limit
console.log('\nTest 4: validateSchoolDocumentFile enforces 2 MB limit for PDF policies');
const validPdf = { name: 'safe-policy.pdf', size: 1.5 * 1024 * 1024, type: 'application/pdf' };
const validRes = validateSchoolDocumentFile(validPdf as any);
assert.equal(validRes.isValid, true);

const oversizedPdf = { name: 'huge-policy.pdf', size: 2.5 * 1024 * 1024, type: 'application/pdf' };
const oversizedRes = validateSchoolDocumentFile(oversizedPdf as any);
assert.equal(oversizedRes.isValid, false);
assert.ok(oversizedRes.error && oversizedRes.error.includes('2 MB'), 'Must reject files over 2 MB');

const invalidType = { name: 'policy.exe', size: 500 * 1024, type: 'application/x-msdownload' };
const invalidTypeRes = validateSchoolDocumentFile(invalidType as any);
assert.equal(invalidTypeRes.isValid, false);
console.log('  ✓ 2 MB limit and PDF/document MIME validation correctly enforced');

console.log('\n===========================================================');
console.log('ALL LEGAL POLICY ENGINE TESTS PASSED SUCCESSFULLY (4/4)');
console.log('===========================================================\n');
