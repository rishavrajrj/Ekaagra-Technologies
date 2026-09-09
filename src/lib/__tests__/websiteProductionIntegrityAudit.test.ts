/**
 * ==============================================================================
 * TEST SUITE: Website Specification Production Integrity, Concurrency & Publication
 * File: src/lib/__tests__/websiteProductionIntegrityAudit.test.ts
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert';
import type { UniversalIntakeData, WebsiteApprovalRecord, WebsitePageConfiguration } from '../types';
import {
  generateWebsiteSpecificationSnapshot,
  computeSpecificationHash,
  approveWebsiteSpecification,
  detectSpecificationInvalidation,
  generateWebsitePublicationPayload,
  deepFreeze,
  deepClone,
} from '../websiteSpecificationContract';
import { buildWebsitePageConfigurations } from '../websitePageRequirements';

function createValidBaseIntake(): Partial<UniversalIntakeData> {
  const baseData: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public Academy',
      board: 'CBSE',
      affiliationNumber: 'CBSE-AFF-998811',
      officialEmail: 'info@dpa.edu.in',
      phone: '+91 9876543210',
    },
    leadership: {
      principalName: 'Dr. Sunita Sharma',
    },
    schoolContent: {
      aboutSchool: 'A premier educational institution fostering excellence and integrity.',
      mission: 'To empower young minds with knowledge and moral values.',
      vision: 'To be a globally benchmarked school known for holistic education.',
    },
    campuses: [
      {
        id: 'camp_main',
        name: 'Main Campus',
        isMainCampus: true,
        address: '123 Knowledge Park, Phase 2, New Delhi 110001',
        city: 'New Delhi',
        state: 'Delhi',
        phone: '+91 9876543210',
        images: [
          {
            id: 'img_hero_1',
            category: 'campus_exterior',
            fileUrl: 'https://cdn.example.com/campus-front.webp',
            caption: 'Front View of Main Campus',
          },
        ],
      },
    ],
    assetChecklist: {
      items: [
        {
          id: 'school_logo',
          title: 'Official School Crest / Logo',
          category: 'branding',
          requirement: 'mandatory',
          type: 'image',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/logo-high-res.png',
          fileName: 'school-crest.png',
          fileSize: 450000,
          width: 800,
          height: 800,
          storageKey: 'schools/dpa/logo.webp',
        },
        {
          id: 'principal_photo',
          title: 'Principal Portrait',
          category: 'leadership',
          requirement: 'mandatory',
          type: 'image',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/principal-dr-sharma.jpg',
          fileName: 'principal.jpg',
          fileSize: 320000,
          width: 600,
          height: 800,
          storageKey: 'schools/dpa/principal.webp',
        },
        {
          id: 'doc-affiliation-cert',
          title: 'CBSE Affiliation Grant Letter',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/cbse-grant.pdf',
          fileName: 'cbse-grant.pdf',
          fileSize: 1200000,
          storageKey: 'schools/dpa/docs/cbse-grant.pdf',
        },
        {
          id: 'doc-fire-safety',
          title: 'Building & Fire Safety Certificate',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/fire-safety.pdf',
          fileName: 'fire-safety.pdf',
          fileSize: 850000,
          storageKey: 'schools/dpa/docs/fire-safety.pdf',
        },
      ],
    },
    legalPolicies: {
      mandatoryPublicDisclosures: [{ title: 'CBSE Mandatory Disclosure Form', documentUrl: 'https://cdn.example.com/cbse-grant.pdf' }],
      affiliationCertificateProvided: true,
      societyRegistrationProvided: true,
    },
  };

  const rawPages = buildWebsitePageConfigurations(baseData);
  const readyPages: Record<string, WebsitePageConfiguration> = {};

  for (const [pKey, pConfig] of Object.entries(rawPages)) {
    const confirmedReqs = pConfig.requirements.map((r) => ({
      ...r,
      status: 'confirmed' as const,
      userConfirmed: true,
      value: r.value || (r.type === 'image' ? 'https://images.unsplash.com/sample.jpg' : 'Verified Value'),
    }));
    readyPages[pKey] = {
      ...pConfig,
      status: 'ready' as const,
      readyCount: confirmedReqs.length,
      totalCount: confirmedReqs.length,
      requirements: confirmedReqs,
    };
  }

  return {
    ...baseData,
    websiteRequirements: {
      websiteGoal: 'complete_platform',
      pageConfigurations: readyPages,
      requiredPages: Object.keys(readyPages),
    },
  };
}

const approver = {
  name: 'Rajesh Malhotra',
  email: 'r.malhotra@dpa.edu.in',
  role: 'Governing Council Chairman',
};

// ============================================================================
// 1. APPROVAL PERSISTENCE & RELOAD HYDRATION
// ============================================================================

test('Audit 1: Approval survives serialization and reload with identical hash, approver, and snapshot', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver, 'Board approved specification.');
  assert.strictEqual(res.success, true, res.message);
  assert(res.approvalRecord);

  const approvalRecord = res.approvalRecord;

  intake.websiteRequirements!.currentApproval = approvalRecord;
  intake.websiteRequirements!.approvalHistory = [
    {
      ...approvalRecord,
      status: 'superseded',
      specificationVersion: 0,
      id: 'appr_seed_0',
    },
  ];

  // Simulate JSON serialization and deserialization (Database / Network Hydration)
  const serialized = JSON.stringify(intake);
  const rehydrated: UniversalIntakeData = JSON.parse(serialized);

  const loadedApproval = rehydrated.websiteRequirements?.currentApproval;
  assert(loadedApproval, 'Approval record must survive rehydration');
  assert.strictEqual(loadedApproval.status, 'approved');
  assert.strictEqual(loadedApproval.specificationVersion, 1);
  assert.strictEqual(loadedApproval.specificationHash, approvalRecord.specificationHash);
  assert.strictEqual(loadedApproval.approvedBy.email, 'r.malhotra@dpa.edu.in');
  assert.strictEqual(loadedApproval.approvedAt, approvalRecord.approvedAt);

  const recomputedHash = computeSpecificationHash(loadedApproval.approvedSpecification);
  assert.strictEqual(recomputedHash, loadedApproval.specificationHash);

  assert.strictEqual(rehydrated.websiteRequirements?.approvalHistory?.length, 1);
  assert.strictEqual(rehydrated.websiteRequirements?.approvalHistory?.[0].status, 'superseded');
});

// ============================================================================
// 2. CONCURRENT APPROVAL HARDENING
// ============================================================================

test('Audit 2 (Scenario A): Simultaneous identical approval requests resolve to the exact same version and hash', () => {
  const intake1 = createValidBaseIntake();
  const intake2 = createValidBaseIntake();

  const res1 = approveWebsiteSpecification(intake1, approver);
  assert.strictEqual(res1.success, true, res1.message);
  assert.strictEqual(res1.isNewVersion, true);

  intake2.websiteRequirements!.currentApproval = res1.approvalRecord;
  const res2 = approveWebsiteSpecification(intake2, approver);

  assert.strictEqual(res2.success, true, res2.message);
  assert.strictEqual(res2.isNewVersion, false, 'Second identical request must NOT create a new version');
  assert.strictEqual(res2.approvalRecord?.specificationVersion, res1.approvalRecord?.specificationVersion);
  assert.strictEqual(res2.approvalRecord?.specificationHash, res1.approvalRecord?.specificationHash);
});

test('Audit 2 (Scenario B): Different sequential snapshots increment versions cleanly and maintain history', () => {
  const intake = createValidBaseIntake();

  const res1 = approveWebsiteSpecification(intake, approver, 'V1 Sign-off');
  assert.strictEqual(res1.success, true, res1.message);
  assert.strictEqual(res1.approvalRecord?.specificationVersion, 1);

  intake.websiteRequirements!.currentApproval = res1.approvalRecord;
  intake.websiteRequirements!.approvalHistory = [];
  intake.schoolContent!.mission = 'Empowering youth with cutting-edge STEM and ethical leadership.';

  const res2 = approveWebsiteSpecification(intake, approver, 'V2 Sign-off with updated mission');
  assert.strictEqual(res2.success, true, res2.message);
  assert.strictEqual(res2.isNewVersion, true);
  assert.strictEqual(res2.approvalRecord?.specificationVersion, 2);
  assert.notStrictEqual(res2.approvalRecord?.specificationHash, res1.approvalRecord?.specificationHash);

  assert.strictEqual(res1.approvalRecord?.specificationVersion, 1);
});

// ============================================================================
// 3. IMMUTABILITY OF APPROVED SNAPSHOTS
// ============================================================================

test('Audit 3: Approved specification snapshot is deeply frozen and impervious to downstream mutation', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approvalRecord = res.approvalRecord!;
  const originalHash = approvalRecord.specificationHash;

  assert.strictEqual(Object.isFrozen(approvalRecord), true, 'Approval record must be frozen');
  assert.strictEqual(Object.isFrozen(approvalRecord.approvedSpecification), true, 'Snapshot must be frozen');

  intake.schoolProfile!.schoolName = 'Completely Changed Name';
  intake.campuses![0].address = '999 Altered Address Blvd';
  intake.leadership!.principalName = 'Dr. Interceptor';
  intake.schoolContent!.mission = 'Altered Mission Post-Approval';

  assert.strictEqual(
    approvalRecord.approvedSpecification.contentSnapshot.schoolHighlights.schoolName,
    'Delhi Public Academy',
    'Frozen snapshot school name must remain intact'
  );
  assert.strictEqual(
    approvalRecord.approvedSpecification.contentSnapshot.principalName,
    'Dr. Sunita Sharma',
    'Frozen snapshot principal name must remain intact'
  );

  const recomputed = computeSpecificationHash(approvalRecord.approvedSpecification);
  assert.strictEqual(recomputed, originalHash);
});

// ============================================================================
// 4. POST-APPROVAL INVALIDATION CHECKS
// ============================================================================

test('Audit 4: Invalidation correctly identifies School Logo replacement and affects header/footer/home', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approval = res.approvalRecord!;

  intake.assetChecklist!.items = intake.assetChecklist!.items.map((item) => {
    if (item.id === 'school_logo') {
      return { ...item, fileUrl: 'https://cdn.example.com/new-brand-logo-2027.png', fileSize: 999999 };
    }
    return item;
  });

  const invalidation = detectSpecificationInvalidation(approval, intake);
  assert.strictEqual(invalidation.isInvalidated, true);
  assert(invalidation.invalidatedFields.some((f) => f.includes('school_logo')));
  assert(invalidation.affectedPages.includes('Global Header'));
  assert(invalidation.affectedPages.includes('Global Footer'));
  assert(invalidation.affectedPages.includes('Home'));
});

test('Audit 4: Invalidation correctly identifies Official Contact Email & Phone changes', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approval = res.approvalRecord!;

  intake.schoolProfile!.officialEmail = 'director@dpa-new.edu.in';
  intake.schoolProfile!.phone = '+91 11 22334455';

  const invalidation = detectSpecificationInvalidation(approval, intake);
  assert.strictEqual(invalidation.isInvalidated, true);
  assert(invalidation.invalidatedFields.some((f) => f.includes('Official Contact Email')));
  assert(invalidation.invalidatedFields.some((f) => f.includes('Official Contact Phone')));
  assert(invalidation.affectedPages.includes('Contact Us'));
  assert(invalidation.affectedPages.includes('Global Footer'));
});

test('Audit 4: Invalidation correctly identifies Page Route / Slug alterations', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approval = res.approvalRecord!;

  const pages = { ...intake.websiteRequirements!.pageConfigurations! };
  const firstKey = Object.keys(pages)[0];
  pages[firstKey] = {
    ...pages[firstKey],
    slug: 'new-custom-route-slug',
  };

  const invalidation = detectSpecificationInvalidation(approval, intake, pages);
  assert.strictEqual(invalidation.isInvalidated, true);
  assert(invalidation.invalidatedFields.some((f) => f.includes('URL route changed')));
});

test('Audit 4: Invalidation correctly identifies Page enabled/disabled toggling', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approval = res.approvalRecord!;

  const pages = { ...intake.websiteRequirements!.pageConfigurations! };
  const targetKey = Object.keys(pages).find((k) => k !== 'Home') || Object.keys(pages)[1];
  pages[targetKey] = {
    ...pages[targetKey],
    enabled: !pages[targetKey].enabled,
  };

  const invalidation = detectSpecificationInvalidation(approval, intake, pages);
  assert.strictEqual(invalidation.isInvalidated, true);
  assert(invalidation.invalidatedFields.some((f) => f.includes('visibility changed')));
});

// ============================================================================
// 5. PUBLICATION BOUNDARY TESTS
// ============================================================================

test('Audit 5 (Test A): Pending status cannot be published', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const pendingRecord: WebsiteApprovalRecord = {
    ...res.approvalRecord!,
    status: 'pending',
  };

  assert.throws(
    () => generateWebsitePublicationPayload(pendingRecord),
    /Cannot publish specification with status "pending"/
  );
});

test('Audit 5 (Test B): Requires reverification status cannot be published', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const invalidatedRecord: WebsiteApprovalRecord = {
    ...res.approvalRecord!,
    status: 'requires_reverification',
  };

  assert.throws(
    () => generateWebsitePublicationPayload(invalidatedRecord),
    /Cannot publish specification with status "requires_reverification"/
  );
});

test('Audit 5 (Test C): Superseded status cannot be published', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const supersededRecord: WebsiteApprovalRecord = {
    ...res.approvalRecord!,
    status: 'superseded',
  };

  assert.throws(
    () => generateWebsitePublicationPayload(supersededRecord),
    /Cannot publish specification with status "superseded"/
  );
});

test('Audit 5 (Test D): Draft changed after approval rejects publication when draft is checked', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approvedRecord = res.approvalRecord!;

  intake.schoolProfile!.schoolName = 'Altered Unapproved Name';

  assert.throws(
    () => generateWebsitePublicationPayload(approvedRecord, 'school_dpa_01', intake),
    /Cannot publish website: Canonical onboarding data was modified after approval/
  );
});

test('Audit 5 (Test E): Tampered snapshot hash is detected and publication fails', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);

  const tamperedRecord = JSON.parse(JSON.stringify(res.approvalRecord!));
  tamperedRecord.specificationHash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  assert.throws(
    () => generateWebsitePublicationPayload(tamperedRecord),
    /Tampered approval record detected: specification hash mismatch/
  );
});

test('Audit 5 (Test F): Tampered snapshot content with spoofed hash is rejected', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);

  const tamperedRecord = JSON.parse(JSON.stringify(res.approvalRecord!));
  tamperedRecord.approvedSpecification.contentSnapshot.aboutSchool = 'Malicious injected content';

  assert.throws(
    () => generateWebsitePublicationPayload(tamperedRecord),
    /Tampered approval record detected: specification hash mismatch/
  );
});

// ============================================================================
// 6. EXACT PUBLICATION FIDELITY
// ============================================================================

test('Audit 6: Publication payload exactly mirrors approved snapshot and fingerprint', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approvedRecord = res.approvalRecord!;

  const payload = generateWebsitePublicationPayload(approvedRecord, 'school_dpa_01');

  assert.strictEqual(payload.specificationHash, approvedRecord.specificationHash);
  assert.strictEqual(payload.specificationVersion, approvedRecord.specificationVersion);
  assert.strictEqual(payload.approvedAt, approvedRecord.approvedAt);
  assert.strictEqual(payload.approvedBy.email, approvedRecord.approvedBy.email);

  assert.deepStrictEqual(payload.pages, approvedRecord.approvedSpecification.pages);
  assert.deepStrictEqual(payload.resolvedAssets, approvedRecord.approvedSpecification.resolvedAssets);
  assert.deepStrictEqual(payload.content, approvedRecord.approvedSpecification.contentSnapshot);
  assert.deepStrictEqual(payload.compliance, approvedRecord.approvedSpecification.complianceSnapshot);

  assert.strictEqual(Object.isFrozen(payload), true);
});

// ============================================================================
// 7. ASSET SEMANTICS & METADATA SENSITIVITY
// ============================================================================

test('Audit 7: Modifying asset storageKey or fileSize triggers specification invalidation', () => {
  const intake = createValidBaseIntake();
  const res = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res.success, true, res.message);
  const approval = res.approvalRecord!;

  intake.assetChecklist!.items = intake.assetChecklist!.items.map((item) => {
    if (item.id === 'school_logo') {
      return { ...item, storageKey: 'schools/dpa/new-logo-v2.webp' };
    }
    return item;
  });

  const invalidation = detectSpecificationInvalidation(approval, intake);
  assert.strictEqual(invalidation.isInvalidated, true);
  assert(invalidation.invalidatedFields.some((f) => f.includes('school_logo')));
});

// ============================================================================
// 8. FULL VERSION LIFECYCLE (v1 -> Mutation -> Invalidation -> v2 -> Idempotent)
// ============================================================================

test('Audit 8: Complete lifecycle: v1 approval -> invalidation -> v2 approval -> idempotent re-approval', () => {
  const intake = createValidBaseIntake();

  const resV1 = approveWebsiteSpecification(intake, approver, 'V1 Sign-off');
  assert.strictEqual(resV1.success, true, resV1.message);
  assert.strictEqual(resV1.approvalRecord?.specificationVersion, 1);
  const hashV1 = resV1.approvalRecord!.specificationHash;

  intake.websiteRequirements!.currentApproval = resV1.approvalRecord;

  intake.schoolContent!.aboutSchool = 'Updated About School text reflecting new accreditation.';
  const inv = detectSpecificationInvalidation(resV1.approvalRecord, intake);
  assert.strictEqual(inv.isInvalidated, true);

  const resV2 = approveWebsiteSpecification(intake, approver, 'V2 Sign-off');
  assert.strictEqual(resV2.success, true, resV2.message);
  assert.strictEqual(resV2.isNewVersion, true);
  assert.strictEqual(resV2.approvalRecord?.specificationVersion, 2);
  const hashV2 = resV2.approvalRecord!.specificationHash;
  assert.notStrictEqual(hashV1, hashV2);

  intake.websiteRequirements!.currentApproval = resV2.approvalRecord;
  const resV2Reapprove = approveWebsiteSpecification(intake, approver, 'Attempt duplicate sign-off');
  assert.strictEqual(resV2Reapprove.success, true, resV2Reapprove.message);
  assert.strictEqual(resV2Reapprove.isNewVersion, false, 'Re-approving unchanged V2 must be idempotent');
  assert.strictEqual(resV2Reapprove.approvalRecord?.specificationVersion, 2);
  assert.strictEqual(resV2Reapprove.approvalRecord?.specificationHash, hashV2);
});
