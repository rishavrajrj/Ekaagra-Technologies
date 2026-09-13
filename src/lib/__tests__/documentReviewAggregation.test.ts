import test from 'node:test';
import assert from 'node:assert';
import {
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  calculateUniversalReadiness,
} from '../universalVerificationEngine';
import { evaluateSchoolReviewState } from '../schoolReviewEngine';
import type { UniversalIntakeData } from '../types';

test('AUDIT: aggregateUniversalAssets aggregates both images and document files (PDFs)', () => {
  const intake: Partial<UniversalIntakeData> = {
    brandingDesign: {
      logoUrl: 'https://cdn.school.edu/logo.png',
      crestUrl: 'https://cdn.school.edu/crest.png',
    },
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Certificate',
          category: 'certificates',
          type: 'document',
          requirement: 'statutory',
          status: 'provided',
          fileUrl: 'https://cdn.school.edu/affiliation.pdf',
          fileName: 'Affiliation_2025_2028.pdf',
          fileType: 'application/pdf',
          fileSize: 1048576,
        },
        {
          id: 'adm-fee-circular',
          title: 'Official Fee Schedule / Circular (PDF)',
          category: 'admissions',
          type: 'document',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.school.edu/fee-structure.pdf',
          fileName: 'Fee_Circular_2026.pdf',
          fileType: 'application/pdf',
          fileSize: 524288,
        },
        {
          id: 'photo-campus-main',
          title: 'Main Campus Building',
          category: 'campus_photos',
          type: 'image',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://cdn.school.edu/campus-front.webp',
          fileName: 'campus-front.webp',
          fileType: 'image/webp',
          fileSize: 840000,
        },
      ] as any,
    },
    legalPolicies: {
      policies: {
        'fee-refund': {
          title: 'Fee Refund Policy',
          status: 'document_uploaded',
          officialDocumentUrl: 'https://cdn.school.edu/fee-refund-policy.pdf',
          officialDocumentFileName: 'Fee_Refund_Policy_2026.pdf',
          officialDocumentFileSize: 320000,
        },
      } as any,
    } as any,
  };

  const assets = aggregateUniversalAssets(intake);

  // 1. Verify images are present
  const logo = assets.find((a) => a.id === 'asset-brand-logo');
  assert.ok(logo, 'Official School Logo is present');
  assert.strictEqual(Boolean(logo?.isDocument), false);

  const campusPhoto = assets.find((a) => a.id === 'photo-campus-main');
  assert.ok(campusPhoto, 'Main Campus Building photo is present');
  assert.strictEqual(Boolean(campusPhoto?.isDocument), false);

  // 2. Verify statutory documents are present and flagged as isDocument
  const affiliationDoc = assets.find((a) => a.id === 'cert-affiliation');
  assert.ok(affiliationDoc, 'Affiliation Certificate is aggregated into assets');
  assert.strictEqual(affiliationDoc?.isDocument, true, 'Affiliation Certificate is flagged as document');
  assert.strictEqual(affiliationDoc?.fileType, 'application/pdf');
  assert.strictEqual(affiliationDoc?.fileName, 'Affiliation_2025_2028.pdf');
  assert.strictEqual(affiliationDoc?.fileSize, 1048576);

  // 3. Verify admissions PDF circular is present and flagged as isDocument
  const feeCircular = assets.find((a) => a.id === 'adm-fee-circular');
  assert.ok(feeCircular, 'Fee Circular PDF is aggregated into assets');
  assert.strictEqual(feeCircular?.isDocument, true, 'Fee Circular PDF is flagged as document');
  assert.strictEqual(feeCircular?.fileName, 'Fee_Circular_2026.pdf');

  // 4. Verify policy document upload is present and flagged as isDocument
  const refundPolicyDoc = assets.find((a) => a.id === 'policy-doc-fee-refund');
  assert.ok(refundPolicyDoc, 'Fee Refund Policy uploaded PDF is aggregated into assets');
  assert.strictEqual(refundPolicyDoc?.isDocument, true, 'Fee Refund Policy PDF is flagged as document');
  assert.strictEqual(refundPolicyDoc?.url, 'https://cdn.school.edu/fee-refund-policy.pdf');

  // 5. Verify non-duplicating blocker behavior: documents do NOT duplicate blockers in Assets pillar
  const documents = aggregateUniversalDocuments(intake);
  const readiness = calculateUniversalReadiness(intake, assets, documents, []);

  const assetBlockers = readiness.publicationBlockers.filter((b) => b.id.startsWith('blocker-asset-cert-'));
  assert.strictEqual(assetBlockers.length, 0, 'Statutory documents do not duplicate blockers under Asset pillar');
});

test('AUDIT: evaluateSchoolReviewState accurately tracks review status for both images and documents', () => {
  const payload: UniversalIntakeData = {
    schoolProfile: {
      schoolName: 'St. Xavier Global Academy',
      officialPhone: '+91 9876543210',
      officialEmail: 'info@stxavier.edu.in',
      address: '123 Campus Road',
    } as any,
    campuses: [
      {
        id: 'main',
        name: 'Main Campus',
        address: '123 Campus Road',
        images: [{ url: 'https://cdn.school.edu/main.webp' }],
      } as any,
    ],
    brandingDesign: {
      logoUrl: 'https://cdn.school.edu/logo.png',
    },
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Certificate',
          category: 'certificates',
          type: 'document',
          requirement: 'statutory',
          status: 'provided',
          fileUrl: 'https://cdn.school.edu/affiliation.pdf',
          fileName: 'Affiliation.pdf',
          fileType: 'application/pdf',
        },
      ] as any,
    },
  } as any;

  const project: any = {
    id: 'proj-101',
    project_number: 'SCH-101',
    status: 'submitted',
    metadata: {
      fieldReviews: {},
      mediaReviews: {
        'asset-brand-logo': { status: 'approved' },
        'cert-affiliation': { status: 'approved' },
      },
    },
  };

  const submission: any = {
    id: 'sub-101',
    intake_payload: payload,
    version_number: 1,
    is_current: true,
    completeness_percentage: 100,
  };

  const reviewEval = evaluateSchoolReviewState(project, submission, []);

  // Both the logo image and the affiliation document should be evaluated
  const aggregatedAffiliation = reviewEval.aggregatedAssets.find((a) => a.id === 'cert-affiliation');
  assert.ok(aggregatedAffiliation, 'Affiliation document is present in reviewEval.aggregatedAssets');
  assert.strictEqual(aggregatedAffiliation?.isDocument, true);

  // Verify approval was recorded
  assert.strictEqual(project.metadata.mediaReviews['cert-affiliation']?.status, 'approved');
});
