/**
 * ==============================================================================
 * TEST SUITE: Canonical Document Lifecycle & Review Engine Production Audit
 * File: src/lib/__tests__/documentLifecycleAudit.test.ts
 * ==============================================================================
 *
 * Exhaustive audit verification for:
 * 1. Document Lifecycle States (MISSING, UPLOADED, VALID, INVALID, EXPIRED, CHANGES_REQUESTED, APPROVED)
 * 2. Status Invariant Enforcement (guarding against contradictory states)
 * 3. Assistive Validation vs Human Approval Boundary
 * 4. Structured Replacement & Re-upload Lifecycle
 * 5. Full Intake Field Coverage & Section Review Integrity
 * 6. Publication Blocker Integrity & Readiness Rules
 * 7. Complete Technical ZIP Export Metadata
 */

import test from 'node:test';
import assert from 'node:assert';
import type {
  SchoolProject,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  UniversalIntakeData,
} from '../types';
import {
  evaluateSchoolReviewState,
  CANONICAL_REVIEWABLE_FIELDS,
} from '../schoolReviewEngine';
import {
  calculateDerivedDocumentValidationStatus,
  calculateDocumentCompletenessSummary,
  validateDocumentStateInvariants,
  getDocumentChangeRequestHistory,
  evaluateFieldComparison,
  STRUCTURED_REPLACEMENT_REASONS,
  getDocumentReviewDefinition,
  type ExpectedDocumentField,
} from '../canonicalDocumentReviewEngine';
import {
  isValidUploadedDocument,
} from '../canonicalDocuments';
import { exportCompleteSchoolProjectZip } from '../schoolCompleteExportEngine';

function createBaseMockProject(overrides?: Partial<SchoolProject>): SchoolProject {
  return {
    id: 'proj-audit-001',
    project_number: 'SCH-2026-AUDIT',
    domain: 'SCHOOL',
    lead_reference: 'LEAD-AUDIT-001',
    source_system: 'EKAAGRA_WEBSITE',
    school_name: 'Heritage International Academy',
    primary_contact_name: 'Dr. Alok Verma',
    primary_contact_email: 'principal@heritage.edu',
    primary_contact_phone: '+91 9876543210',
    product_id: 'school-complete',
    status: 'submitted',
    media_status: 'pending_review',
    completeness_percentage: 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createBaseMockPayload(overrides?: Partial<UniversalIntakeData>): UniversalIntakeData {
  return {
    schoolProfile: {
      schoolName: 'Heritage International Academy',
      board: 'CBSE',
      legalInstitutionName: 'Heritage Educational Trust',
      yearOfEstablishment: '2005',
      schoolType: 'Day School',
      genderType: 'Co-Educational',
      officialPhone: '+91 9876543210',
      officialEmail: 'info@heritage.edu',
      website: 'https://heritage.edu',
      addressLine1: '45 Knowledge Park, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      country: 'India',
    },
    campuses: [
      {
        id: 'main-campus',
        name: 'Heritage Main Campus',
        isMainCampus: true,
        address: '45 Knowledge Park, Sector 62',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pin: '201301',
        classesOffered: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        facilities: ['Science Lab', 'Library', 'Sports Ground'],
        images: [
          {
            id: 'campus-building-1',
            url: 'https://cdn.example.com/heritage-building.jpg',
            category: 'campus_buildings',
            caption: 'Main Academic Block',
          },
        ],
      },
    ],
    leadership: {
      principalName: 'Dr. Alok Verma',
      principalDesignation: 'Principal & Director',
      principalMessage: 'Welcome to Heritage International Academy, where leadership begins.',
      principalPhoto: {
        id: 'lead-photo-1',
        url: 'https://cdn.example.com/dr-alok-verma.jpg',
        name: 'alok-verma.jpg',
        status: 'verified',
      } as any,
    },
    brandingDesign: {
      logoUrl: 'https://cdn.example.com/heritage-logo.png',
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#10B981',
      brandTone: 'Academic & Scholarly',
      hasHighResLogo: true,
    },
    institutionStructure: {
      classesOfferedFrom: '1',
      classesOfferedTo: '10',
      classes: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      academicLevels: ['Primary', 'Middle', 'Secondary'],
    },
    admissions: {
      status: true,
      contact: {
        name: 'Mrs. Neha Sharma',
        phone: '+91 9876543211',
      },
    },
    feesConfiguration: {
      commonFees: [
        { name: 'Admission Fee', amount: 25000, frequency: 'one_time' as any },
        { name: 'Tuition Fee', amount: 12000, frequency: 'quarterly' as any },
      ],
    },
    schoolContent: {
      aboutSchool: 'A premier CBSE affiliated co-educational institution.',
      mission: 'Empowering students to excel in academics, ethics, and innovation.',
      vision: 'To be a beacon of progressive learning.',
    },
    staffFaculty: {
      teachingStaffCount: 45,
      departments: ['Science', 'Mathematics', 'Humanities', 'Languages'],
    },
    curriculum: {
      overview: {
        board: 'CBSE',
        academicApproach: 'Experiential and inquiry-based pedagogy.',
      },
    },
    transportConfig: {
      enabled: true,
      vehiclesCount: 12,
      gpsTrackingRequired: true,
    },
    hostelConfig: {
      enabled: false,
    },
    libraryConfig: {
      enabled: true,
      bookCountEstimate: 8500,
    },
    communicationConfig: {
      enabledChannels: ['whatsapp', 'email', 'sms'],
    },
    domainPresence: {
      existingDomainName: 'heritage.edu',
    },
    legalPolicies: {
      mandatoryDisclosuresProvided: true,
      policies: {
        privacy: { title: 'Privacy Policy', isCustomDocument: true } as any,
      },
    },
    projectDelivery: {
      targetLaunchDate: '2026-04-01',
    },
    usersAccess: {
      superAdminFullName: 'Dr. Alok Verma',
      superAdminEmail: 'admin@heritage.edu',
      superAdminPhone: '+91 9876543210',
    },
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Grant Letter',
          type: 'document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/cbse-affiliation.pdf',
          fileName: 'cbse-affiliation.pdf',
          fileSize: 1048576,
        },
      ],
    },
    ...overrides,
  };
}

// ─── 1. DOCUMENT LIFECYCLE & STATUS EVALUATION TESTS ────────────────────────

test('AUDIT #1: Required statutory document missing -> flags MISSING, publication blocker, readiness BLOCKED', () => {
  const payload = createBaseMockPayload({
    assetChecklist: { items: [] }, // No documents uploaded
  });
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: 'proj-audit-001',
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };
  const project = createBaseMockProject();

  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  const missingAffiliation = result.blockers.some((b) => b.id.includes('missing'));
  assert.ok(missingAffiliation, 'Missing mandatory document should trigger a review blocker');
});

test('AUDIT #2: Optional document missing -> does not create a critical publication blocker', () => {
  const comparison = evaluateFieldComparison('Optional Field', undefined);
  assert.strictEqual(comparison, 'REQUIRES_MANUAL_VERIFICATION');

  const summary = calculateDocumentCompletenessSummary([
    {
      required: false,
      isPublicationBlocker: false,
      status: 'missing',
      fileUrl: undefined,
    },
  ]);

  assert.strictEqual(summary.totalRequired, 0);
  assert.strictEqual(summary.totalPublicationBlockers, 0);
  assert.strictEqual(summary.percentage, 100);
});

test('AUDIT #3: Valid document uploaded -> derived status VALID, pending human approval', () => {
  const fields: ExpectedDocumentField[] = [
    {
      fieldId: 'school_name',
      label: 'School Name',
      enteredValue: 'Heritage International Academy',
      extractedValue: 'Heritage International Academy',
      comparisonStatus: 'MATCH',
    },
  ];

  const status = calculateDerivedDocumentValidationStatus(
    'https://cdn.example.com/doc.pdf',
    'affiliation.pdf',
    fields
  );

  assert.strictEqual(status, 'VALID');
});

test('AUDIT #4: Document uploaded with expired validity date -> flags EXPIRED', () => {
  const pastDate = '2020-01-01';
  const status = calculateDerivedDocumentValidationStatus(
    'https://cdn.example.com/doc.pdf',
    'fire-safety.pdf',
    [],
    pastDate
  );

  assert.strictEqual(status, 'EXPIRED');
});

test('AUDIT #5: Document with perpetual validity ("Permanent", "Annual Update") -> correctly parsed as VALID', () => {
  const permStatus = calculateDerivedDocumentValidationStatus(
    'https://cdn.example.com/society.pdf',
    'society.pdf',
    [],
    'Permanent'
  );
  assert.strictEqual(permStatus, 'VALID');

  const annualStatus = calculateDerivedDocumentValidationStatus(
    'https://cdn.example.com/disclosure.pdf',
    'disclosure.pdf',
    [],
    'Annual Update'
  );
  assert.strictEqual(annualStatus, 'VALID');
});

test('AUDIT #6: School name mismatch between certificate and intake -> flags INVALID', () => {
  const fields: ExpectedDocumentField[] = [
    {
      fieldId: 'school_name',
      label: 'School Name',
      enteredValue: 'Heritage International Academy',
      extractedValue: 'Different Saint Mark School',
      comparisonStatus: 'MISMATCH',
    },
  ];

  const status = calculateDerivedDocumentValidationStatus(
    'https://cdn.example.com/doc.pdf',
    'doc.pdf',
    fields
  );

  assert.strictEqual(status, 'INVALID');
});

test('AUDIT #7: School name matches with whitespace and casing differences -> normalized MATCH', () => {
  const matchResult = evaluateFieldComparison(
    '  Heritage International Academy  ',
    'heritage international academy'
  );
  assert.strictEqual(matchResult, 'MATCH');
});

test('AUDIT #8: OCR data absent -> comparison status is REQUIRES_MANUAL_VERIFICATION and does not crash', () => {
  const matchResult = evaluateFieldComparison('Heritage International Academy', undefined);
  assert.strictEqual(matchResult, 'REQUIRES_MANUAL_VERIFICATION');

  const emptyMatch = evaluateFieldComparison('', '');
  assert.strictEqual(emptyMatch, 'NOT_APPLICABLE');
});

// ─── 2. STATUS INVARIANT ENFORCEMENT TESTS ──────────────────────────────────

test('AUDIT #9: Invariant Guard: Unuploaded / MISSING document cannot be APPROVED', () => {
  const result = validateDocumentStateInvariants({
    documentId: 'doc-affiliation',
    fileUrl: undefined,
    fileName: undefined,
    adminDecision: 'approved',
    derivedStatus: 'MISSING',
  });

  assert.strictEqual(result.isValid, false);
  assert.ok(result.violations.some((v) => v.includes('MISSING and cannot be marked APPROVED')));
});

test('AUDIT #10: Invariant Guard: EXPIRED document cannot be APPROVED for publication', () => {
  const result = validateDocumentStateInvariants({
    documentId: 'doc-safety',
    fileUrl: 'https://cdn.example.com/safety.pdf',
    fileName: 'safety.pdf',
    adminDecision: 'approved',
    derivedStatus: 'EXPIRED',
    isPublicationBlocker: true,
  });

  assert.strictEqual(result.isValid, false);
  assert.ok(result.violations.some((v) => v.includes('EXPIRED and cannot be APPROVED')));
});

test('AUDIT #11: Invariant Guard: INVALID / mismatched document cannot be APPROVED', () => {
  const result = validateDocumentStateInvariants({
    documentId: 'doc-recognition',
    fileUrl: 'https://cdn.example.com/rec.pdf',
    fileName: 'rec.pdf',
    adminDecision: 'approved',
    derivedStatus: 'INVALID',
  });

  assert.strictEqual(result.isValid, false);
  assert.ok(result.violations.some((v) => v.includes('MISMATCH / INVALID')));
});

test('AUDIT #12: Invariant Guard: EXPIRED document must be marked as publication blocker', () => {
  const result = validateDocumentStateInvariants({
    documentId: 'doc-fire',
    fileUrl: 'https://cdn.example.com/fire.pdf',
    fileName: 'fire.pdf',
    adminDecision: 'changes_requested',
    derivedStatus: 'EXPIRED',
    isPublicationBlocker: false,
  });

  assert.strictEqual(result.isValid, false);
  assert.ok(result.violations.some((v) => v.includes('EXPIRED but not marked as a publication blocker')));
});

test('AUDIT #13: Assistive validation status VALID does NOT automatically approve document', () => {
  const payload = createBaseMockPayload();
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: 'proj-audit-001',
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };
  const project = createBaseMockProject({
    metadata: {
      fieldReviews: {},
      mediaReviews: {}, // Zero admin approvals recorded
    },
  });

  const result = evaluateSchoolReviewState(project, submission, []);

  // Without explicit human admin approval, media status remains unapproved
  assert.notStrictEqual(result.mediaReviewStatus, 'approved');
  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
});

// ─── 3. ADMIN ACTION & REPLACEMENT LIFECYCLE TESTS ──────────────────────────

test('AUDIT #14: Structured replacement reasons catalog is comprehensive', () => {
  assert.ok(STRUCTURED_REPLACEMENT_REASONS.length >= 10);
  const wrongDoc = STRUCTURED_REPLACEMENT_REASONS.find((r) => r.id === 'wrong_document');
  assert.ok(wrongDoc, 'Should include wrong_document reason');
  const expiredReason = STRUCTURED_REPLACEMENT_REASONS.find((r) => r.id === 'expired_validity');
  assert.ok(expiredReason, 'Should include expired_validity reason');
  const illegibleReason = STRUCTURED_REPLACEMENT_REASONS.find((r) => r.id === 'illegible_scan');
  assert.ok(illegibleReason, 'Should include illegible_scan reason');
});

test('AUDIT #15: Change request on asset updates review status to changes_requested and blocks launch', () => {
  const payload = createBaseMockPayload();
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: 'proj-audit-001',
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };

  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-asset-001',
    school_project_id: 'proj-audit-001',
    section_key: 'media',
    asset_id: 'asset-brand-logo',
    request_type: 'replacement',
    reason: 'Low resolution logo',
    request_comment: 'Please upload vector SVG or high-res PNG (min 1000px).',
    requested_by: 'Ekaagra Admin Reviewer',
    status: 'open',
    created_at: new Date().toISOString(),
  };

  const project = createBaseMockProject();
  const result = evaluateSchoolReviewState(project, submission, [cr]);

  assert.strictEqual(result.mediaReviewStatus, 'changes_requested');
  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.ok(result.blockers.some((b) => b.id.includes('asset-brand-logo')));
});

test('AUDIT #16: Resubmission transitions change request to ready_for_review', () => {
  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-asset-002',
    school_project_id: 'proj-audit-001',
    section_key: 'media',
    asset_id: 'asset-brand-logo',
    request_type: 'replacement',
    reason: 'Low resolution logo',
    request_comment: 'Please upload high-res version.',
    school_response: 'Uploaded official high-res logo with transparent background.',
    requested_by: 'Ekaagra Admin Reviewer',
    status: 'ready_for_review',
    created_at: new Date().toISOString(),
  };

  const history = getDocumentChangeRequestHistory('asset-brand-logo', [cr]);
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].status, 'ready_for_review');
  assert.strictEqual(history[0].school_response, 'Uploaded official high-res logo with transparent background.');
});

// ─── 4. COVERAGE & INTEGRATION TESTS ────────────────────────────────────────

test('AUDIT #17: CANONICAL_REVIEWABLE_FIELDS covers all 19+ intake sections', () => {
  const distinctSections = new Set(CANONICAL_REVIEWABLE_FIELDS.map((f) => f.sectionKey));
  assert.ok(distinctSections.has('schoolProfile'), 'Includes schoolProfile');
  assert.ok(distinctSections.has('campuses'), 'Includes campuses');
  assert.ok(distinctSections.has('academicScope'), 'Includes academicScope');
  assert.ok(distinctSections.has('admissions'), 'Includes admissions');
  assert.ok(distinctSections.has('fees'), 'Includes fees');
  assert.ok(distinctSections.has('facilities'), 'Includes facilities');
  assert.ok(distinctSections.has('websiteContent'), 'Includes websiteContent');
  assert.ok(distinctSections.has('leadership'), 'Includes leadership');
  assert.ok(distinctSections.has('brandingDesign'), 'Includes brandingDesign');
  assert.ok(distinctSections.has('staffFaculty'), 'Includes staffFaculty');
  assert.ok(distinctSections.has('curriculum'), 'Includes curriculum');
  assert.ok(distinctSections.has('transportConfig'), 'Includes transportConfig');
  assert.ok(distinctSections.has('hostelConfig'), 'Includes hostelConfig');
  assert.ok(distinctSections.has('libraryConfig'), 'Includes libraryConfig');
  assert.ok(distinctSections.has('communicationConfig'), 'Includes communicationConfig');
  assert.ok(distinctSections.has('domainPresence'), 'Includes domainPresence');
  assert.ok(distinctSections.has('legalPolicies'), 'Includes legalPolicies');
  assert.ok(distinctSections.has('projectDelivery'), 'Includes projectDelivery');
  assert.ok(distinctSections.has('usersAccess'), 'Includes usersAccess');
  assert.ok(distinctSections.size >= 19, `Found ${distinctSections.size} sections, expected >= 19`);
});

test('AUDIT #18: Placeholders and demo strings are rejected by isValidUploadedDocument', () => {
  assert.strictEqual(isValidUploadedDocument(''), false);
  assert.strictEqual(isValidUploadedDocument(undefined), false);
  assert.strictEqual(isValidUploadedDocument('null'), false);
  assert.strictEqual(isValidUploadedDocument('n/a'), false);
  assert.strictEqual(isValidUploadedDocument('tbd'), false);
  assert.strictEqual(isValidUploadedDocument('will_provide_later.pdf'), false);
  assert.strictEqual(isValidUploadedDocument('demo_cert.pdf'), false);
  assert.strictEqual(isValidUploadedDocument('ai_generated_noc.pdf'), false);
  assert.strictEqual(isValidUploadedDocument('https://storage.example.com/valid-cert.pdf'), true);
});

test('AUDIT #19: Canonical document definitions lookup returns accurate statutory details', () => {
  const def = getDocumentReviewDefinition('cert-affiliation');
  assert.ok(def, 'Should find affiliation document definition');
  assert.strictEqual(def?.category, 'STATUTORY');
  assert.ok(def?.verificationChecklist.length >= 4);

  const nonExistent = getDocumentReviewDefinition('unknown-random-id');
  assert.strictEqual(nonExistent, undefined);
});

test('AUDIT #20: Full verification pass unlocks READY and allows handoff', () => {
  const payload = createBaseMockPayload({
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Grant Letter',
          type: 'document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/cbse-affiliation.pdf',
          fileName: 'cbse-affiliation.pdf',
          fileSize: 1048576,
        },
        {
          id: 'cert-recognition',
          title: 'State Recognition Certificate / NOC',
          type: 'document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/noc.pdf',
          fileName: 'noc.pdf',
          fileSize: 1048576,
        },
        {
          id: 'cert-safety',
          title: 'Building Safety & Fire Safety Certificate',
          type: 'document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/safety.pdf',
          fileName: 'safety.pdf',
          fileSize: 1048576,
        },
        {
          id: 'cert-mandatory-disclosure',
          title: 'Mandatory Public Disclosure (Appendix IX)',
          type: 'document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/disclosure.pdf',
          fileName: 'disclosure.pdf',
          fileSize: 1048576,
        },
      ],
    },
  });
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: 'proj-audit-001',
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };

  const fieldReviews: Record<string, any> = {};
  CANONICAL_REVIEWABLE_FIELDS.forEach((f) => {
    fieldReviews[f.key] = {
      sectionKey: f.sectionKey,
      fieldKey: f.key,
      status: 'verified',
      updatedAt: new Date().toISOString(),
    };
  });

  const project = createBaseMockProject({
    status: 'approved',
    metadata: {
      fieldReviews,
      mediaReviews: {
        'asset-brand-logo': { assetId: 'asset-brand-logo', status: 'approved' },
        'asset-principal-photo': { assetId: 'asset-principal-photo', status: 'approved' },
        'campus-building-1': { assetId: 'campus-building-1', status: 'approved' },
        'cert-affiliation': { assetId: 'cert-affiliation', status: 'approved' },
        'cert-recognition': { assetId: 'cert-recognition', status: 'approved' },
        'cert-safety': { assetId: 'cert-safety', status: 'approved' },
        'cert-mandatory-disclosure': { assetId: 'cert-mandatory-disclosure', status: 'approved' },
      },
    },
  });

  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.websiteReadiness, 'READY');
  assert.strictEqual(result.provisioningStatus, 'READY');
  assert.strictEqual(result.blockers.length, 0);
});

test('AUDIT #21: Provisioning is LOCKED if website readiness is BLOCKED', () => {
  const payload = createBaseMockPayload();
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: 'proj-audit-001',
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };

  const project = createBaseMockProject({
    status: 'approved',
  });

  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.strictEqual(result.provisioningStatus, 'LOCKED');
});

test('AUDIT #22: Technical ZIP Export includes review-status.json and document-manifest.json', async () => {
  const payload = createBaseMockPayload();
  const project = createBaseMockProject();
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: project.id,
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: payload,
    submitted_at: new Date().toISOString(),
  };

  const exportResult = await exportCompleteSchoolProjectZip({
    project,
    submission,
    intakePayload: payload,
    assetResolver: async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
  });

  assert.ok(exportResult.manifest, 'Manifest must be generated');
  assert.ok(exportResult.manifest.files.includes('technical/review-status.json'), 'Must contain technical/review-status.json');
  assert.ok(exportResult.manifest.files.includes('technical/document-manifest.json'), 'Must contain technical/document-manifest.json');
  assert.ok(exportResult.statistics.formFields > 0);
  assert.ok(exportResult.folderName.length > 0);
});

test('AUDIT #23: Academic scope violations create critical blocker and block publication', () => {
  const invalidPayload = createBaseMockPayload({
    campuses: [
      {
        id: 'main-campus',
        name: 'Heritage Main Campus',
        isMainCampus: true,
        address: '45 Knowledge Park',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pin: '201301',
        classesOffered: ['1', '2', '3'],
        facilities: ['Science Lab'],
        images: [
          {
            id: 'campus-building-1',
            url: 'https://cdn.example.com/bldg.jpg',
            category: 'campus_buildings',
          },
        ],
      },
    ],
    feesConfiguration: {
      commonFees: [
        {
          name: 'High School Lab Fee',
          amount: 5000,
          frequency: 'annually' as any,
          applicableClasses: ['12'], // Class 12 is out of scope!
        },
      ],
    },
  });

  const project = createBaseMockProject();
  const submission: SchoolIntakeSubmission = {
    id: 'sub-001',
    school_project_id: project.id,
    submission_version: 1,
    status: 'submitted',
    completeness_percentage: 100,
    intake_payload: invalidPayload,
    submitted_at: new Date().toISOString(),
  };

  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.ok(result.blockers.some((b) => b.id === 'blocker-academic-scope'));
});
