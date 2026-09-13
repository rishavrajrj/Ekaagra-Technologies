import assert from 'node:assert';
import {
  lookupCanonicalField,
  normalizePageKey,
  getPendingChangeCounts,
  getPagePendingChangeRequests,
  getFieldChangeRequest,
  isRequestActivePending,
  isRequestAwaitingAdminReview,
} from '../canonicalFieldRegistry';
import type { SchoolIntakeChangeRequest } from '../types';

console.log('=== RUNNING CANONICAL CHANGE REQUEST WORKFLOW TEST SUITE ===\n');

// ─── 1. Canonical Field Lookup & Aliasing ─────────────────────────────────────
console.log('1. Testing Canonical Field Lookup & Aliases...');
{
  const def1 = lookupCanonicalField('identity.year_established');
  assert.strictEqual(def1.canonicalKey, 'identity.year_established');
  assert.strictEqual(def1.pageKey, 'identity');
  assert.strictEqual(def1.intakeSectionKey, 'schoolProfile');
  assert.strictEqual(def1.fieldLabel, 'Year of Establishment');
  assert.strictEqual(def1.domAnchor, 'field-container-yearOfEstablishment');

  // Alias lookup
  const def2 = lookupCanonicalField('schoolProfile.yearOfEstablishment');
  assert.strictEqual(def2.canonicalKey, 'identity.year_established');

  const def3 = lookupCanonicalField('yearOfEstablishment');
  assert.strictEqual(def3.canonicalKey, 'identity.year_established');

  // Affiliation number lookup
  const affDef = lookupCanonicalField('affiliation.cbse_affiliation_number');
  assert.strictEqual(affDef.canonicalKey, 'affiliation.cbse_affiliation_number');
  assert.strictEqual(affDef.fieldLabel, 'Affiliation / Registration Number');

  const affAlias = lookupCanonicalField('affiliationNumber', 'schoolProfile');
  assert.strictEqual(affAlias.canonicalKey, 'affiliation.cbse_affiliation_number');

  // Principal head
  const leadDef = lookupCanonicalField('leadership.principal_name');
  assert.strictEqual(leadDef.canonicalKey, 'leadership.principal_name');
  assert.strictEqual(leadDef.pageKey, 'leadership');

  console.log('✓ Canonical keys and aliases resolve accurately to the canonical registry.');
}

// ─── 2. Schema Drift Fault Tolerance (Requirement 30) ─────────────────────────
console.log('\n2. Testing Schema Drift & Stale Field Fallback...');
{
  const staleDef = lookupCanonicalField('legacy_custom_attribute_from_2022', 'unknownSection');
  assert.strictEqual(staleDef.isStale, true);
  assert.strictEqual(staleDef.fieldKey, 'legacy_custom_attribute_from_2022');
  assert.ok(staleDef.fieldLabel.length > 0);
  assert.strictEqual(staleDef.pageKey, 'unknownSection');

  console.log('✓ Non-existent or deprecated fields cleanly return fallback definitions with isStale: true without crashing.');
}

// ─── 3. Status Predicates: isRequestActivePending vs isRequestAwaitingAdminReview ───
console.log('\n3. Testing Status Predicates...');
{
  const activeStatuses = ['pending', 'changes_requested', 'needs_revision', 'open', 'waiting_for_school'];
  for (const status of activeStatuses) {
    const cr: Partial<SchoolIntakeChangeRequest> = { status: status as any };
    assert.strictEqual(isRequestActivePending(cr as SchoolIntakeChangeRequest), true, `Expected ${status} to be active pending`);
    assert.strictEqual(isRequestAwaitingAdminReview(cr as SchoolIntakeChangeRequest), false, `Expected ${status} not to be awaiting admin review`);
  }

  const reviewStatuses = ['school_updated', 'ready_for_review'];
  for (const status of reviewStatuses) {
    const cr: Partial<SchoolIntakeChangeRequest> = { status: status as any };
    assert.strictEqual(isRequestActivePending(cr as SchoolIntakeChangeRequest), false, `Expected ${status} NOT to be active pending for school`);
    assert.strictEqual(isRequestAwaitingAdminReview(cr as SchoolIntakeChangeRequest), true, `Expected ${status} to be awaiting admin review`);
  }

  const resolvedStatuses = ['approved', 'resolved', 'cancelled', 'rejected', 'waived'];
  for (const status of resolvedStatuses) {
    const cr: Partial<SchoolIntakeChangeRequest> = { status: status as any };
    assert.strictEqual(isRequestActivePending(cr as SchoolIntakeChangeRequest), false, `Expected ${status} not to be active pending`);
    assert.strictEqual(isRequestAwaitingAdminReview(cr as SchoolIntakeChangeRequest), false, `Expected ${status} not to be awaiting admin review`);
  }

  console.log('✓ Status predicates cleanly distinguish school-pending vs admin-awaiting vs resolved states.');
}

// ─── 4. getPendingChangeCounts Calculation & Percentage Isolation ─────────────
console.log('\n4. Testing getPendingChangeCounts per-page counting...');
{
  const mockCRs: SchoolIntakeChangeRequest[] = [
    {
      id: 'cr-1',
      school_project_id: 'proj-1',
      section_key: 'schoolProfile',
      field_key: 'yearOfEstablishment',
      request_comment: 'Please enter official founding year',
      status: 'waiting_for_school',
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cr-2',
      school_project_id: 'proj-1',
      section_key: 'schoolProfile',
      field_key: 'affiliationNumber',
      request_comment: 'CBSE affiliation number has a typo',
      status: 'changes_requested',
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cr-3',
      school_project_id: 'proj-1',
      section_key: 'leadership',
      field_key: 'principal_name',
      request_comment: 'Verify Dr. prefix in principal name',
      status: 'ready_for_review', // School has already updated this!
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cr-4',
      school_project_id: 'proj-1',
      section_key: 'campuses',
      field_key: 'main_campus.address',
      request_comment: 'Resolved previously',
      status: 'approved', // Resolved
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
  ];

  const counts = getPendingChangeCounts('proj-1', mockCRs);

  // Both canonical page key and intake section key receive the count
  assert.strictEqual(counts['identity'], 2, 'Identity page must have 2 active pending changes');
  assert.strictEqual(counts['schoolProfile'], 2, 'SchoolProfile intake section must have 2 active pending changes');

  // cr-3 is in ready_for_review, so it must NOT count as pending for the school sidebar
  assert.strictEqual(counts['leadership'], 0, 'Leadership page must have 0 active pending changes (cr-3 is awaiting admin review)');

  // cr-4 is approved, so campuses count must be 0
  assert.strictEqual(counts['campuses'], 0, 'Campuses page must have 0 active pending changes');

  console.log('✓ getPendingChangeCounts accurately sums only active pending changes and isolates resolved/updated requests.');
}

// ─── 5. getPagePendingChangeRequests & Field Matching ─────────────────────────
console.log('\n5. Testing getPagePendingChangeRequests & getFieldChangeRequest...');
{
  const mockCRs: SchoolIntakeChangeRequest[] = [
    {
      id: 'cr-101',
      school_project_id: 'proj-1',
      section_key: 'schoolProfile',
      field_key: 'schoolProfile.yearOfEstablishment',
      request_comment: 'Enter founding year',
      status: 'open',
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cr-102',
      school_project_id: 'proj-1',
      section_key: 'leadership',
      field_key: 'principal_name',
      request_comment: 'Update qualification',
      status: 'open',
      requested_by: 'Admin',
      created_at: new Date().toISOString(),
    },
  ];

  const identityCRs = getPagePendingChangeRequests('identity', mockCRs);
  assert.strictEqual(identityCRs.length, 1);
  assert.strictEqual(identityCRs[0].id, 'cr-101');

  const schoolProfileCRs = getPagePendingChangeRequests('schoolProfile', mockCRs);
  assert.strictEqual(schoolProfileCRs.length, 1);
  assert.strictEqual(schoolProfileCRs[0].id, 'cr-101');

  // getFieldChangeRequest test
  const foundByCanonical = getFieldChangeRequest('identity.year_established', mockCRs);
  assert.ok(foundByCanonical);
  assert.strictEqual(foundByCanonical?.id, 'cr-101');

  const foundByAlias = getFieldChangeRequest('yearOfEstablishment', mockCRs);
  assert.ok(foundByAlias);
  assert.strictEqual(foundByAlias?.id, 'cr-101');

  console.log('✓ getPagePendingChangeRequests and getFieldChangeRequest resolve seamlessly across tabs and canonical keys.');
}

// ─── 6. Page Key Normalization ───────────────────────────────────────────────
console.log('\n6. Testing normalizePageKey mapping...');
{
  const norm1 = normalizePageKey('schoolProfile');
  assert.strictEqual(norm1.canonicalPageKey, 'identity');
  assert.strictEqual(norm1.intakeSectionKey, 'schoolProfile');

  const norm2 = normalizePageKey('identity');
  assert.strictEqual(norm2.canonicalPageKey, 'identity');
  assert.strictEqual(norm2.intakeSectionKey, 'schoolProfile');

  const norm3 = normalizePageKey('brandingDesign');
  assert.strictEqual(norm3.canonicalPageKey, 'brand_identity');
  assert.strictEqual(norm3.intakeSectionKey, 'brandingDesign');

  console.log('✓ normalizePageKey bidirectionally links canonical page keys and intake section keys.');
}

console.log('\n======================================================');
console.log('ALL CANONICAL CHANGE REQUEST WORKFLOW TESTS PASSED!');
console.log('======================================================');
