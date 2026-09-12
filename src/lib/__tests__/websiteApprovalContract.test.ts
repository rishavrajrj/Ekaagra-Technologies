/**
 * ==============================================================================
 * TEST SUITE: Website Specification Approval Contract & Publication Integrity
 * File: src/lib/__tests__/websiteApprovalContract.test.ts
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert';
import type { UniversalIntakeData, WebsitePageConfiguration } from '../types';
import {
  generateWebsiteSpecificationSnapshot,
  computeSpecificationHash,
  deterministicSerialize,
  validateServerApprovalPreconditions,
  approveWebsiteSpecification,
  detectSpecificationInvalidation,
  generateWebsitePublicationPayload,
} from '../websiteSpecificationContract';
import { buildWebsitePageConfigurations } from '../websitePageRequirements';

function createValidBaseIntake(): Partial<UniversalIntakeData> {
  const baseData: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public Academy',
      board: 'CBSE',
      affiliationNumber: 'CBSE-AFF-998811',
      officialEmail: 'info@dpa.edu.in',
      officialPhone: '+91 9876543210',
      phone: '+91 9876543210',
      schoolType: 'Day School',
    },
    branding: {
      logoUrl: 'https://cdn.example.com/logo-high-res.png',
    },
    brandingDesign: {
      logoUrl: 'https://cdn.example.com/logo-high-res.png',
      logo: 'https://cdn.example.com/logo-high-res.png',
    },
    leadership: {
      principalName: 'Dr. Sunita Sharma',
      principalPhotoUrl: 'https://cdn.example.com/principal-dr-sharma.jpg',
      principalPhoto: {
        id: 'principal_photo',
        url: 'https://cdn.example.com/principal-dr-sharma.jpg',
        name: 'principal.jpg',
        status: 'verified',
      } as any,
    },
    transportConfig: { status: 'no', enabled: false },
    hostelConfig: { status: 'no', isApplicable: false },
    statutoryCompliance: {
      affiliationCertificate: { fileUrl: 'https://cdn.example.com/cbse-grant.pdf', fileName: 'cbse-grant.pdf' },
      recognitionNoc: { fileUrl: 'https://cdn.example.com/state-noc.pdf', fileName: 'state-noc.pdf' },
      fireSafetyCertificate: { fileUrl: 'https://cdn.example.com/fire-safety.pdf', fileName: 'fire-safety.pdf' },
      mandatoryDisclosure: { fileUrl: 'https://cdn.example.com/appendix-ix.pdf', fileName: 'appendix-ix.pdf' },
    },
    clientConfirmation: {
      isConfirmed: true,
      confirmedByName: 'Dr. Sunita Sharma',
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
            category: 'campus_buildings',
            url: 'https://images.unsplash.com/photo-campus-front.jpg',
            fileUrl: 'https://images.unsplash.com/photo-campus-front.jpg',
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
          status: 'verified',
          fileUrl: 'https://cdn.example.com/logo-high-res.png',
          fileName: 'school-crest.png',
          fileSize: 450000,
          width: 800,
          height: 800,
        },
        {
          id: 'principal_photo',
          title: 'Principal Portrait',
          category: 'leadership',
          requirement: 'mandatory',
          type: 'image',
          status: 'verified',
          fileUrl: 'https://cdn.example.com/principal-dr-sharma.jpg',
          fileName: 'principal.jpg',
          fileSize: 320000,
          width: 600,
          height: 800,
        },
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Grant Letter',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://cdn.example.com/cbse-grant.pdf',
          fileName: 'cbse-grant.pdf',
          fileSize: 1200000,
        },
        {
          id: 'cert-recognition',
          title: 'State Government NOC / Recognition',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://cdn.example.com/state-noc.pdf',
          fileName: 'state-noc.pdf',
          fileSize: 850000,
        },
        {
          id: 'cert-safety',
          title: 'Building & Fire Safety Certificate',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://cdn.example.com/fire-safety.pdf',
          fileName: 'fire-safety.pdf',
          fileSize: 950000,
        },
        {
          id: 'cert-mandatory-disclosure',
          title: 'Mandatory Public Disclosure (Appendix IX)',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://cdn.example.com/appendix-ix.pdf',
          fileName: 'appendix-ix.pdf',
          fileSize: 750000,
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
      pageConfigurations: readyPages,
      requiredPages: Object.keys(readyPages),
    },
    usersAccess: {
      superAdminFullName: 'Rajesh Verma',
      superAdminEmail: 'rverma@dpa.edu.in',
      superAdminPhone: '+91 9876543210',
    },
  };
}

console.log('================================================================');
console.log('  TEST SUITE: Website Specification Approval Contract & Publication');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. DETERMINISTIC SNAPSHOT & HASHING
// ─────────────────────────────────────────────────────────────────────────────
test('Deterministic serialization produces identical output regardless of key order', () => {
  const obj1 = { z: 1, a: 2, m: { y: 'bar', x: 'foo' } };
  const obj2 = { a: 2, m: { x: 'foo', y: 'bar' }, z: 1 };

  const s1 = deterministicSerialize(obj1);
  const s2 = deterministicSerialize(obj2);

  assert.strictEqual(s1, s2, 'Deterministic serializer output must match exactly');
  assert.strictEqual(s1, '{"a":2,"m":{"x":"foo","y":"bar"},"z":1}');
});

test('Snapshot hash is deterministic and changes when content changes', () => {
  const intake = createValidBaseIntake();
  const snap1 = generateWebsiteSpecificationSnapshot(intake);
  const hash1 = computeSpecificationHash(snap1);

  assert.ok(hash1 && hash1.length === 64, 'Must be a 64-char hex SHA-256 string');

  // Second run with same intake must produce identical hash
  const snap2 = generateWebsiteSpecificationSnapshot(intake);
  const hash2 = computeSpecificationHash(snap2);
  assert.strictEqual(hash1, hash2, 'Hash must be strictly deterministic');

  // Modifying principal name must alter the hash
  const modifiedIntake = {
    ...intake,
    leadership: { ...intake.leadership, principalName: 'Dr. Anand Mahindra' },
  };
  const snap3 = generateWebsiteSpecificationSnapshot(modifiedIntake);
  const hash3 = computeSpecificationHash(snap3);
  assert.notStrictEqual(hash1, hash3, 'Hash must change when canonical data changes');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SERVER-SIDE PRECONDITIONS & BLOCKER ENFORCEMENT
// ─────────────────────────────────────────────────────────────────────────────
test('Server validation permits approval when all canonical requirements are met', () => {
  const intake = createValidBaseIntake();
  const result = validateServerApprovalPreconditions(intake);

  assert.strictEqual(result.canApprove, true, 'Valid intake must be approved');
  assert.strictEqual(result.blockers.length, 0, 'No blockers should exist');
});

test('Server validation rejects approval when school logo is missing', () => {
  const intake = createValidBaseIntake();
  // Remove logo from asset checklist and branding
  intake.branding = { logoUrl: '' } as any;
  intake.brandingDesign = { logoUrl: '', logo: '' } as any;
  intake.assetChecklist = {
    items: (intake.assetChecklist?.items || []).filter((item) => item.id !== 'school_logo'),
  };

  const result = validateServerApprovalPreconditions(intake);
  assert.strictEqual(result.canApprove, false, 'Must reject approval when logo is missing');
  assert.ok(
    result.blockers.some((b) => b.key === 'asset_school_logo' || b.key?.includes('logo') || b.label?.toLowerCase().includes('logo')),
    'Must include asset_school_logo blocker'
  );
});

test('Server validation rejects approval on exact duplicate URL slug collision', () => {
  const intake = createValidBaseIntake();
  const pages = { ...intake.websiteRequirements?.pageConfigurations };

  // Introduce route conflict: two pages with the same slug '/admissions'
  if (pages['Admissions']) {
    pages['CustomAdmissions'] = {
      pageKey: 'CustomAdmissions',
      label: 'Special Admissions',
      slug: pages['Admissions'].slug, // Route collision!
      enabled: true,
      status: 'ready',
      readyCount: 1,
      totalCount: 1,
      requirements: [],
      recommendedSections: [],
    };
  }

  const result = validateServerApprovalPreconditions(intake, pages);
  assert.strictEqual(result.canApprove, false, 'Must reject approval on route collision');
  assert.ok(
    result.blockers.some((b) => b.key.startsWith('duplicate_')),
    'Must flag route collision blocker'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. IDEMPOTENT APPROVAL SUBMISSIONS & VERSIONING
// ─────────────────────────────────────────────────────────────────────────────
test('Approving specification creates version 1 record with hash and immutable snapshot', () => {
  const intake = createValidBaseIntake();
  const approver = {
    name: 'Rajesh Verma',
    email: 'rverma@dpa.edu.in',
    role: 'Super Administrator',
  };

  const res = approveWebsiteSpecification(intake, approver, 'Final verification passed.');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.isNewVersion, true);
  assert.ok(res.approvalRecord);
  assert.strictEqual(res.approvalRecord.specificationVersion, 1);
  assert.strictEqual(res.approvalRecord.status, 'approved');
  assert.strictEqual(res.approvalRecord.approvedBy.name, 'Rajesh Verma');
  assert.ok(res.approvalRecord.specificationHash.length === 64);
  assert.strictEqual(res.approvalRecord.notes, 'Final verification passed.');
});

test('Re-approving unchanged specification is idempotent and returns existing record', () => {
  const intake = createValidBaseIntake();
  const approver = {
    name: 'Rajesh Verma',
    email: 'rverma@dpa.edu.in',
  };

  const res1 = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res1.success, true);
  assert.strictEqual(res1.isNewVersion, true);

  // Attach approval to intake
  intake.websiteRequirements = {
    ...intake.websiteRequirements,
    currentApproval: res1.approvalRecord,
  };

  // Re-approve identical intake
  const res2 = approveWebsiteSpecification(intake, approver);
  assert.strictEqual(res2.success, true);
  assert.strictEqual(res2.isNewVersion, false, 'Should be idempotent, not a new version');
  assert.strictEqual(
    res2.approvalRecord?.specificationHash,
    res1.approvalRecord?.specificationHash,
    'Hash should be identical'
  );
  assert.strictEqual(res2.approvalRecord?.specificationVersion, 1, 'Version should remain 1');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. APPROVAL INVALIDATION & TARGETED CHANGE TRACKING
// ─────────────────────────────────────────────────────────────────────────────
test('Detects invalidation when Principal photo is updated post-approval', () => {
  const intake = createValidBaseIntake();
  const approver = { name: 'Rajesh Verma', email: 'rverma@dpa.edu.in' };
  const res = approveWebsiteSpecification(intake, approver);
  assert.ok(res.approvalRecord);

  // Before edit: no invalidation
  const checkBefore = detectSpecificationInvalidation(res.approvalRecord, intake);
  assert.strictEqual(checkBefore.isInvalidated, false);

  // Modify Principal photo in asset checklist
  const modifiedIntake = {
    ...intake,
    assetChecklist: {
      items: (intake.assetChecklist?.items || []).map((item) =>
        item.id === 'principal_photo'
          ? { ...item, fileUrl: 'https://cdn.example.com/new-principal-2026.jpg' }
          : item
      ),
    },
  };

  const checkAfter = detectSpecificationInvalidation(res.approvalRecord, modifiedIntake);
  assert.strictEqual(checkAfter.isInvalidated, true, 'Must detect invalidation');
  assert.ok(
    checkAfter.invalidatedFields.some((f) => f.includes('principal_photo') || f.includes('Principal Portrait')),
    'Must identify principal photo as invalidated'
  );
  assert.ok(checkAfter.affectedPages.includes('About Us'), 'Must flag About Us as affected');
  assert.ok(checkAfter.affectedPages.includes('Leadership'), 'Must flag Leadership as affected');
});

test('Detects invalidation when Campus address is modified post-approval', () => {
  const intake = createValidBaseIntake();
  const approver = { name: 'Rajesh Verma', email: 'rverma@dpa.edu.in' };
  const res = approveWebsiteSpecification(intake, approver);
  assert.ok(res.approvalRecord);

  const modifiedIntake = {
    ...intake,
    campuses: [
      {
        ...intake.campuses![0],
        address: '999 New Campus Boulevard, Sector 45, Gurugram 122003',
      },
    ],
  };

  const check = detectSpecificationInvalidation(res.approvalRecord, modifiedIntake);
  assert.strictEqual(check.isInvalidated, true);
  assert.ok(
    check.invalidatedFields.some((f) => f.includes('Physical Address')),
    'Must specify campus physical address'
  );
  assert.ok(check.affectedPages.includes('Contact Us'), 'Must flag Contact Us');
  assert.ok(check.affectedPages.includes('Global Footer'), 'Must flag Global Footer');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. PUBLICATION CONTRACT & BUILD PIPELINE INTEGRITY
// ─────────────────────────────────────────────────────────────────────────────
test('Publication payload strictly matches approved specification hash and structure', () => {
  const intake = createValidBaseIntake();
  const approver = { name: 'Rajesh Verma', email: 'rverma@dpa.edu.in' };
  const res = approveWebsiteSpecification(intake, approver);
  assert.ok(res.approvalRecord);

  const publication = generateWebsitePublicationPayload(res.approvalRecord, 'school_dpa_001');

  assert.strictEqual(publication.schoolId, 'school_dpa_001');
  assert.strictEqual(publication.specificationVersion, 1);
  assert.strictEqual(publication.specificationHash, res.approvalRecord.specificationHash);
  assert.strictEqual(publication.approvedBy.name, 'Rajesh Verma');
  assert.ok(publication.publishedAt);
  assert.deepStrictEqual(publication.pages, res.approvalRecord.approvedSpecification.pages);
  assert.deepStrictEqual(publication.resolvedAssets, res.approvalRecord.approvedSpecification.resolvedAssets);
});

test('Publication payload throws if approval status is not approved', () => {
  const intake = createValidBaseIntake();
  const approver = { name: 'Rajesh Verma', email: 'rverma@dpa.edu.in' };
  const res = approveWebsiteSpecification(intake, approver);
  assert.ok(res.approvalRecord);

  const supersededRecord = {
    ...res.approvalRecord,
    status: 'superseded' as const,
  };

  assert.throws(
    () => generateWebsitePublicationPayload(supersededRecord),
    /Cannot publish specification with status "superseded"/
  );
});
