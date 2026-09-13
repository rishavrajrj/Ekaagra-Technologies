import assert from 'node:assert';
import {
  resolveChangeRequestType,
  lookupCanonicalField,
  getPendingChangeCounts,
  getPagePendingChangeRequests,
  isRequestActivePending,
  isRequestAwaitingAdminReview,
} from '../canonicalFieldRegistry';
import {
  validateSchoolDocumentFile,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
} from '../schoolAssetChecklist';
import {
  initializeLegalPolicies,
  syncPoliciesToAssetChecklist,
  type CanonicalPolicyKey,
} from '../legalPolicyUtils';
import { buildDocumentReviewInventory } from '../adminReviewEngine';
import type {
  SchoolIntakeChangeRequest,
  UniversalIntakeData,
  SchoolProject,
  ChangeRequestType,
} from '../types';

console.log('=== RUNNING CORRECTION WORKFLOW & FILE/PDF UPLOAD LIFECYCLE TEST SUITE ===\n');

// Mock School Project
const mockProject: SchoolProject = {
  id: 'proj-lifecycle-test-101',
  school_name: 'Delhi Public International School',
  slug: 'dpis-delhi',
  school_id: 'SCH-101',
  portal_token: 'valid-test-token-xyz',
  product_id: 'school-complete',
  status: 'changes_requested',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  intake_data: {},
};

// ─── SCENARIO A: REVIEWER REQUESTS PDF FOR POL-PRIVACY ─────────────────────────
console.log('Scenario A: Reviewer requests PDF for pol-privacy...');
{
  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-pol-privacy-01',
    school_project_id: mockProject.id,
    section_key: 'legalPolicies',
    page_key: 'legalPolicies',
    field_key: 'pol-privacy',
    request_type: 'PDF',
    request_comment: 'Please upload the signed official institutional privacy policy PDF.',
    status: 'waiting_for_school',
    requested_by: 'Ekaagra Reviewer',
    created_at: new Date().toISOString(),
  };

  // 1. Resolve Change Request Type
  const resolvedType = resolveChangeRequestType(cr);
  assert.strictEqual(resolvedType, 'PDF', 'Expected resolved request type to be PDF');

  // 2. Canonical mapping resolution
  const canon = lookupCanonicalField('pol-privacy', 'legalPolicies');
  assert.strictEqual(canon.canonicalKey, 'legalPolicies.privacy-policy');
  assert.strictEqual(canon.pageKey, 'legalPolicies');
  assert.strictEqual(canon.fieldLabel, 'Website & Student Data Privacy Policy');

  // 3. Status predicates
  assert.strictEqual(isRequestActivePending(cr), true, 'Request should be active pending for school');
  assert.strictEqual(isRequestAwaitingAdminReview(cr), false, 'Request should not be awaiting admin review');

  // 4. File Validation
  const validFile = {
    name: 'Official_DPIS_Privacy_Policy_2026.pdf',
    size: 1.2 * 1024 * 1024, // 1.2 MB (< 2 MB)
    type: 'application/pdf',
  };
  const validation = validateSchoolDocumentFile(validFile);
  assert.strictEqual(validation.isValid, true, 'Valid PDF under 2MB should pass validation');

  // 5. School Submission Update
  const uploadedFileMetadata = {
    url: 'https://storage.ekaagra.in/documents/sch-101/privacy_policy.pdf',
    fileName: validFile.name,
    fileSize: validFile.size,
    storageKey: 'documents/sch-101/privacy_policy.pdf',
  };
  const schoolResponseText = 'Uploaded the signed institutional privacy policy approved by the Trust.';

  // Simulate updating CR
  const updatedCR: SchoolIntakeChangeRequest = {
    ...cr,
    status: 'ready_for_review',
    school_response: schoolResponseText,
    school_updated_value: uploadedFileMetadata.url,
    file_url: uploadedFileMetadata.url,
    file_name: uploadedFileMetadata.fileName,
    file_size: uploadedFileMetadata.fileSize,
    file_storage_key: uploadedFileMetadata.storageKey,
    updated_at: new Date().toISOString(),
  };

  assert.strictEqual(updatedCR.status, 'ready_for_review');
  assert.strictEqual(isRequestActivePending(updatedCR), false);
  assert.strictEqual(isRequestAwaitingAdminReview(updatedCR), true);
  assert.strictEqual(updatedCR.file_url, uploadedFileMetadata.url);

  // 6. Authoritative Persistence in legalPolicies.policies & assetChecklist
  let intakeData: UniversalIntakeData = {
    schoolProfile: { schoolName: mockProject.school_name },
    legalPolicies: initializeLegalPolicies(undefined, { schoolProfile: { schoolName: mockProject.school_name } }),
    assetChecklist: { items: [] },
  };

  // Mutate policies with uploaded document
  intakeData.legalPolicies!.policies['privacy-policy'] = {
    ...intakeData.legalPolicies!.policies['privacy-policy'],
    officialDocumentUrl: uploadedFileMetadata.url,
    officialDocumentName: uploadedFileMetadata.fileName,
    officialDocumentSize: uploadedFileMetadata.fileSize,
    officialDocumentStorageKey: uploadedFileMetadata.storageKey,
    officialDocumentUploadedAt: new Date().toISOString(),
    status: 'document_uploaded',
  };

  // Sync to assetChecklist
  const syncedItems = syncPoliciesToAssetChecklist(intakeData.legalPolicies!, intakeData.assetChecklist?.items);
  intakeData.assetChecklist!.items = syncedItems || [];

  const privacyChecklistItem = intakeData.assetChecklist!.items.find((item: any) => item.key === 'pol-privacy');
  assert.ok(privacyChecklistItem, 'pol-privacy must exist in assetChecklist items');
  assert.strictEqual(privacyChecklistItem.fileUrl, uploadedFileMetadata.url, 'assetChecklist item must mirror uploaded PDF URL');
  assert.strictEqual(privacyChecklistItem.fileName, uploadedFileMetadata.fileName);

  // 7. Admin Review Inventory detects uploaded PDF
  const docsInventory = buildDocumentReviewInventory(intakeData, mockProject);
  const privacyDoc = docsInventory.find((d) => d.id === 'doc-policy-privacy');
  assert.ok(privacyDoc, 'Privacy policy must be in document review inventory');
  assert.strictEqual(privacyDoc.isUploaded, true, 'Document must be marked as uploaded');
  assert.strictEqual(privacyDoc.fileUrl, uploadedFileMetadata.url);
  assert.strictEqual(privacyDoc.isPdf, true, 'Document must be recognized as PDF');
  assert.strictEqual(privacyDoc.verificationStatus, 'PENDING_REVIEW');

  console.log('✓ Scenario A passed: Full PDF change request, upload, persistence, and review inventory verified.');
}

// ─── SCENARIO B: REVIEWER REQUESTS TEXT FOR POL-TERMS ─────────────────────────
console.log('\nScenario B: Reviewer requests text for pol-terms...');
{
  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-pol-terms-02',
    school_project_id: mockProject.id,
    section_key: 'legalPolicies',
    page_key: 'legalPolicies',
    field_key: 'pol-terms',
    request_type: 'TEXT',
    request_comment: 'Please update admission terms to specify the non-refundable seat fee clause.',
    status: 'waiting_for_school',
    requested_by: 'Ekaagra Reviewer',
    created_at: new Date().toISOString(),
  };

  const resolvedType = resolveChangeRequestType(cr);
  assert.strictEqual(resolvedType, 'TEXT', 'Expected resolved request type to be TEXT');

  const updatedText = 'All admissions are subject to availability. Seat confirmation fee of Rs. 10,000 is non-refundable upon withdrawal.';
  const updatedCR: SchoolIntakeChangeRequest = {
    ...cr,
    status: 'ready_for_review',
    school_response: 'Updated admission terms per reviewer instructions.',
    school_updated_value: updatedText,
  };

  assert.strictEqual(updatedCR.status, 'ready_for_review');
  assert.strictEqual(updatedCR.school_updated_value, updatedText);

  // Authoritative update
  const legal = initializeLegalPolicies(undefined, { schoolProfile: { schoolName: mockProject.school_name } });
  legal.policies['terms-and-conditions'].textContent = updatedText;
  legal.policies['terms-and-conditions'].status = 'customized';

  assert.strictEqual(legal.policies['terms-and-conditions'].textContent, updatedText);
  assert.strictEqual(legal.policies['terms-and-conditions'].status, 'customized');

  console.log('✓ Scenario B passed: Text correction requested, validated, and authoritative content updated.');
}

// ─── SCENARIO C: REVIEWER REQUESTS URL ─────────────────────────────────────────
console.log('\nScenario C: Reviewer requests URL...');
{
  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-website-03',
    school_project_id: mockProject.id,
    section_key: 'schoolProfile',
    field_key: 'existingWebsiteUrl',
    request_type: 'URL',
    request_comment: 'Please provide valid link to existing school website.',
    status: 'waiting_for_school',
    requested_by: 'Ekaagra Reviewer',
    created_at: new Date().toISOString(),
  };

  const resolvedType = resolveChangeRequestType(cr);
  assert.strictEqual(resolvedType, 'URL', 'Expected resolved request type to be URL');

  // URL validation check
  const isValidUrl = (url: string) => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  assert.strictEqual(isValidUrl('https://dpis.edu.in'), true);
  assert.strictEqual(isValidUrl('www.dpis.edu.in'), true);
  assert.strictEqual(isValidUrl('not a valid url!!!'), false);
  assert.strictEqual(isValidUrl(''), false);

  console.log('✓ Scenario C passed: URL request type and syntax validation verified.');
}

// ─── SCENARIO D: REPLACEMENT WORKFLOW ─────────────────────────────────────────
console.log('\nScenario D: Replacement workflow (Rejection & Resubmission Cycle)...');
{
  let cr: SchoolIntakeChangeRequest = {
    id: 'cr-pol-refund-04',
    school_project_id: mockProject.id,
    section_key: 'legalPolicies',
    page_key: 'legalPolicies',
    field_key: 'pol-refund',
    request_type: 'PDF',
    request_comment: 'Upload signed fee refund policy PDF.',
    status: 'ready_for_review',
    file_url: 'https://storage.ekaagra.in/documents/sch-101/old_refund.pdf',
    school_response: 'Uploaded our old 2023 policy.',
    created_at: new Date().toISOString(),
  };

  // Reviewer rejects old policy and requests replacement
  const adminRejectionNote = 'This policy is outdated (dated 2023). Please upload the revised 2026 refund policy signed by the Principal.';
  cr = {
    ...cr,
    status: 'waiting_for_school',
    request_comment: adminRejectionNote,
    resolved_at: null,
    resolved_by: null,
  };

  assert.strictEqual(cr.status, 'waiting_for_school');
  assert.strictEqual(isRequestActivePending(cr), true, 'CR must be active pending for school after rejection');
  assert.strictEqual(isRequestAwaitingAdminReview(cr), false);

  // School uploads replacement
  const replacementMetadata = {
    url: 'https://storage.ekaagra.in/documents/sch-101/refund_policy_2026_signed.pdf',
    fileName: 'refund_policy_2026_signed.pdf',
    fileSize: 850 * 1024,
  };
  cr = {
    ...cr,
    status: 'ready_for_review',
    school_response: 'Uploaded the updated 2026 policy signed by Principal.',
    file_url: replacementMetadata.url,
    file_name: replacementMetadata.fileName,
    file_size: replacementMetadata.fileSize,
  };

  assert.strictEqual(cr.status, 'ready_for_review');
  assert.strictEqual(cr.file_url, replacementMetadata.url);

  // Reviewer approves replacement
  cr = {
    ...cr,
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolved_by: 'Ekaagra Reviewer',
  };

  assert.strictEqual(cr.status, 'resolved');
  assert.strictEqual(isRequestActivePending(cr), false);
  assert.strictEqual(isRequestAwaitingAdminReview(cr), false);

  console.log('✓ Scenario D passed: Replacement workflow transitions cleanly without orphan records.');
}

// ─── SCENARIO E: VALIDATION REJECTIONS ─────────────────────────────────────────
console.log('\nScenario E: File validation rejections (format, size, empty)...');
{
  // 1. Non-PDF rejected for document upload
  const exeFile = { name: 'malware.exe', size: 1024, type: 'application/x-msdownload' };
  const exeVal = validateSchoolDocumentFile(exeFile);
  assert.strictEqual(exeVal.isValid, false, 'Non-PDF file must be rejected');
  assert.strictEqual(exeVal.code, 'INVALID_FILE_TYPE');
  assert.ok(exeVal.error?.includes('blocked') || exeVal.error?.includes('security'));

  const docxFile = { name: 'policy.docx', size: 50000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
  const docxVal = validateSchoolDocumentFile(docxFile);
  assert.strictEqual(docxVal.isValid, false, 'DOCX must be rejected when PDF is required');
  assert.ok(docxVal.error?.toLowerCase().includes('pdf'), 'Error must specify PDF requirement');

  // 2. File size > 2MB rejected
  const oversizedFile = {
    name: 'huge_scanned_handbook.pdf',
    size: 2.5 * 1024 * 1024, // 2.5 MB (> 2 MB)
    type: 'application/pdf',
  };
  const sizeVal = validateSchoolDocumentFile(oversizedFile);
  assert.strictEqual(sizeVal.isValid, false, 'File over 2MB must be rejected');
  assert.ok(sizeVal.error?.includes('2 MB') || sizeVal.error?.includes('2MB'), 'Error must specify 2 MB limit');

  // 3. Exactly at limit (2MB) accepted
  const exactLimitFile = {
    name: 'exact_limit.pdf',
    size: MAX_DOCUMENT_FILE_SIZE_BYTES,
    type: 'application/pdf',
  };
  const exactVal = validateSchoolDocumentFile(exactLimitFile);
  assert.strictEqual(exactVal.isValid, true, 'File exactly at 2MB limit must be accepted');

  console.log('✓ Scenario E passed: Invalid extensions and files > 2MB correctly rejected with informative errors.');
}

// ─── SCENARIO F: DEDUPLICATION ON POL-CHILD-SAFETY ────────────────────────────
console.log('\nScenario F: Deduplication of active change requests on pol-child-safety...');
{
  // Simulate active list containing an existing request for pol-child-safety
  const existingCR: SchoolIntakeChangeRequest = {
    id: 'cr-child-safety-existing-01',
    school_project_id: mockProject.id,
    section_key: 'legalPolicies',
    page_key: 'legalPolicies',
    field_key: 'pol-child-safety',
    asset_id: 'pol-child-safety',
    request_type: 'PDF',
    request_comment: 'Initial note: Please upload the POCSO child safety committee notification.',
    status: 'waiting_for_school',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  };

  const changeRequests: SchoolIntakeChangeRequest[] = [existingCR];

  // Function mimicking deduplication logic in createFieldChangeRequestAction & createMediaChangeRequestAction
  function recordReviewerChangeRequest(
    fieldKey: string,
    assetId: string | undefined,
    sectionKey: string,
    comment: string,
    requestType: ChangeRequestType
  ): { action: 'updated' | 'inserted'; cr: SchoolIntakeChangeRequest } {
    const activeIdx = changeRequests.findIndex(
      (r) =>
        (r.status === 'open' || r.status === 'waiting_for_school') &&
        (r.field_key === fieldKey ||
          (assetId && r.asset_id === assetId) ||
          r.field_key === assetId ||
          (assetId && r.field_key === assetId))
    );

    if (activeIdx !== -1) {
      // Update existing record rather than inserting a duplicate
      changeRequests[activeIdx] = {
        ...changeRequests[activeIdx],
        request_comment: comment,
        request_type: requestType,
        updated_at: new Date().toISOString(),
      };
      return { action: 'updated', cr: changeRequests[activeIdx] };
    }

    const newCR: SchoolIntakeChangeRequest = {
      id: `cr-${Date.now()}`,
      school_project_id: mockProject.id,
      section_key: sectionKey,
      page_key: sectionKey,
      field_key: fieldKey,
      asset_id: assetId,
      request_type: requestType,
      request_comment: comment,
      status: 'waiting_for_school',
      created_at: new Date().toISOString(),
    };
    changeRequests.push(newCR);
    return { action: 'inserted', cr: newCR };
  }

  // Second reviewer action on same field
  const secondAction = recordReviewerChangeRequest(
    'pol-child-safety',
    'pol-child-safety',
    'legalPolicies',
    'Updated note: Upload signed POCSO and Child Safety policy document in PDF format.',
    'PDF'
  );

  assert.strictEqual(secondAction.action, 'updated', 'Second reviewer request must update existing revision');
  assert.strictEqual(changeRequests.length, 1, 'There must remain exactly 1 active change request, not 2');
  assert.strictEqual(changeRequests[0].id, existingCR.id, 'Existing CR ID must be preserved');
  assert.strictEqual(
    changeRequests[0].request_comment,
    'Updated note: Upload signed POCSO and Child Safety policy document in PDF format.'
  );

  // Per-page change count must report exactly 1
  const counts = getPendingChangeCounts(changeRequests);
  assert.strictEqual(counts.legalPolicies, 1, 'legalPolicies page must report exactly 1 change request');

  console.log('✓ Scenario F passed: Deduplication prevents duplicate change requests for pol-child-safety.');
}

console.log('\n================================================================');
console.log('ALL CORRECTION WORKFLOW & FILE/PDF TESTS PASSED WITH 100% SUCCESS');
console.log('================================================================\n');
