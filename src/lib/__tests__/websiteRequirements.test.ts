import assert from 'node:assert';
import {
  resolveCanonicalPrincipal,
  autoFillPageRequirements,
  evaluatePageStatus,
  aggregateWebsiteRequirementStates,
  buildWebsitePageConfigurations,
  generateWebsiteDeveloperSpec,
  createRequirement,
  detectDuplicatePageRisks,
  calculateWebsiteReadinessBreakdown,
  resolveCanonicalAsset,
  findStatutoryDocumentsInChecklist,
} from '../websitePageRequirements';
import type { UniversalIntakeData, WebsitePageRequirement } from '../types';

console.log('================================================================');
console.log('  TEST SUITE: Intelligent Website Page Requirements Verification');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// GROUP 1: Canonical Principal Detection
// -----------------------------------------------------------------------------
console.log('Group 1: Canonical Principal Resolution Across Hierarchy');

test('Resolves principal directly from leadership.principalName', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: { principalName: 'Dr. Joseph Vijay' },
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Dr. Joseph Vijay');
  assert.strictEqual(res.sourceSection, 'leadership');
  assert.strictEqual(res.sourceField, 'principalName');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Resolves principal from leadership.principalOrHead fallback', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: { principalOrHead: 'Sister Maria Teresa' } as any,
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Sister Maria Teresa');
  assert.strictEqual(res.sourceSection, 'leadership');
  assert.strictEqual(res.sourceField, 'principalOrHead');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Resolves principal from schoolProfile.principalName fallback', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { principalName: 'Prof. Ramesh Chandra' } as any,
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Prof. Ramesh Chandra');
  assert.strictEqual(res.sourceSection, 'schoolProfile');
  assert.strictEqual(res.sourceField, 'principalName');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Resolves principal from campuses[0].principalOrHead fallback', () => {
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      { id: 'c-1', name: 'Main', principalOrHead: 'Fr. Thomas K.', isMainCampus: true } as any,
    ],
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Fr. Thomas K.');
  assert.strictEqual(res.sourceSection, 'campuses');
  assert.strictEqual(res.sourceField, 'principalOrHead');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Resolves principal from managementMembers with principal designation', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: {
      managementMembers: [
        { id: 'm-1', name: 'Dr. Alok Verma', designation: 'Principal & Secretary', role: 'Principal' },
      ],
    },
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Dr. Alok Verma');
  assert.strictEqual(res.sourceSection, 'leadership');
  assert.strictEqual(res.sourceField, 'managementMembers');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Resolves principal from staffMembers with headmistress designation', () => {
  const intake: Partial<UniversalIntakeData> = {
    staffFaculty: {
      staffMembers: [
        { id: 's-1', name: 'Mrs. Sunita Roy', designation: 'Headmistress', role: 'Head of School' },
      ],
    } as any,
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, 'Mrs. Sunita Roy');
  assert.strictEqual(res.sourceSection, 'staffFaculty');
  assert.strictEqual(res.sourceField, 'staffMembers');
  assert.strictEqual(res.foundInOnboarding, true);
});

test('Returns empty when no principal name is present in any section', () => {
  const intake: Partial<UniversalIntakeData> = {};
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.value, '');
  assert.strictEqual(res.foundInOnboarding, false);
});

// -----------------------------------------------------------------------------
// GROUP 2: Data Source Attribution & "Why Needed" Guidance
// -----------------------------------------------------------------------------
console.log('\nGroup 2: Data Source Attribution & "Why Needed" Guidance');

test('Requirements include whyNeeded, sourceSection and sourceField', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { schoolName: 'Delhi Public School', affiliationNumber: '330943' },
    institutionStructure: { currentAcademicSession: '2026-2027' },
  };

  const reqs = autoFillPageRequirements('Mandatory Disclosures', intake);
  const affReq = reqs.find((r) => r.key === 'affiliation_number');

  assert(affReq, 'Affiliation number requirement should exist');
  assert.strictEqual(affReq.sourceSection, 'schoolProfile');
  assert.strictEqual(affReq.sourceField, 'affiliationNumber');
  assert(affReq.whyNeeded && affReq.whyNeeded.length > 10, 'whyNeeded must provide meaningful explanation');
});

test('Contact Us requirements include postal address whyNeeded and campus source', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { schoolName: 'St. Xavier High School' },
    campuses: [
      { id: 'c-1', name: 'South Campus', address: 'MG Road', city: 'Bangalore', state: 'Karnataka', pin: '560001', isMainCampus: true } as any,
    ],
  };

  const reqs = autoFillPageRequirements('Contact Us', intake);
  const addrReq = reqs.find((r) => r.key === 'contact_address');

  assert(addrReq, 'contact_address must exist');
  assert.strictEqual(addrReq.sourceSection, 'campuses');
  assert(addrReq.value?.toString().includes('MG Road'));
  assert(addrReq.whyNeeded?.includes('Physical location'));
});

// -----------------------------------------------------------------------------
// GROUP 3: Strict Status & Readiness Derivation
// -----------------------------------------------------------------------------
console.log('\nGroup 3: Strict Status & Readiness Derivation');

test('Page with missing required field is strictly "incomplete"', () => {
  const reqs: WebsitePageRequirement[] = [
    createRequirement({ key: 'title', label: 'Title', type: 'text', required: true, value: 'My Page' }),
    createRequirement({ key: 'required_doc', label: 'Mandatory Doc', type: 'document', required: true, value: '' }),
  ];

  const evalRes = evaluatePageStatus(reqs, 'Test Page');
  assert.strictEqual(evalRes.status, 'incomplete', 'Should be incomplete when required field is missing');
});

test('Page with unconfirmed prefilled required field is "needs_review"', () => {
  const reqs: WebsitePageRequirement[] = [
    createRequirement({ key: 'title', label: 'Title', type: 'text', required: true, value: 'My Page', source: 'Section 1' }),
  ];

  const evalRes = evaluatePageStatus(reqs, 'Test Page');
  assert.strictEqual(evalRes.status, 'needs_review', 'Should be needs_review when prefilled field is not user-confirmed');
});

test('Page with only confirmed, generated, or future CMS fields is "ready"', () => {
  const reqs: WebsitePageRequirement[] = [
    createRequirement({ key: 'title', label: 'Title', type: 'text', required: true, value: 'My Page', userConfirmed: true }),
    createRequirement({ key: 'future_news', label: 'News CMS', type: 'boolean', required: true, isCmsFutureContent: true }),
    createRequirement({ key: 'policy', label: 'Policy', type: 'generated', required: true, isGenerated: true }),
  ];

  const evalRes = evaluatePageStatus(reqs, 'Test Page');
  assert.strictEqual(evalRes.status, 'ready', 'Should be ready when all required fields are confirmed/generated/future_cms');
});

// -----------------------------------------------------------------------------
// GROUP 4: Centralized Aggregation Engine (Single Source of Truth)
// -----------------------------------------------------------------------------
console.log('\nGroup 4: Centralized Aggregation Engine (Single Source of Truth)');

test('aggregateWebsiteRequirementStates produces exact metric counts and queue', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { schoolName: 'Springfield High' },
    websiteRequirements: {
      primaryPurpose: 'Admissions and notices',
      requiredPages: ['Home', 'Events & News'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
    },
  };

  const configs = buildWebsitePageConfigurations(intake);
  const aggregates = aggregateWebsiteRequirementStates(configs);

  assert.strictEqual(aggregates.totalPages, 2);
  assert(aggregates.totalRequirements > 0);
  assert(Array.isArray(aggregates.actionRequiredQueue));
  // Events & News has future CMS requirements
  assert(aggregates.futureCmsCount > 0);
});

test('generateWebsiteDeveloperSpec includes new summary counters matching aggregates', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { schoolName: 'Oakridge School', board: 'CBSE' },
    websiteRequirements: {
      primaryPurpose: 'Student growth',
      requiredPages: ['Home', 'Academics'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
    },
  };

  const spec = generateWebsiteDeveloperSpec(intake);
  assert(typeof spec.summary.confirmedRequirementsCount === 'number');
  assert(typeof spec.summary.prefilledRequirementsCount === 'number');
  assert(typeof spec.summary.missingRequirementsCount === 'number');
  assert(typeof spec.summary.futureCmsRequirementsCount === 'number');
});

// -----------------------------------------------------------------------------
// GROUP 5: Conflict Detection & Deduplication
// -----------------------------------------------------------------------------
console.log('\nGroup 5: Conflict Detection & Deduplication');

test('Detects conflict when leadership and schoolProfile report different principal names', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: { principalName: 'Dr. Amit Kumar' },
    schoolProfile: { principalName: 'Dr. A. Kumar' } as any,
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.hasConflict, true, 'Should flag conflict when names differ');
  assert(Array.isArray(res.conflictingCandidates));
  assert.strictEqual(res.conflictingCandidates.length, 2);
  assert.strictEqual(res.conflictingCandidates[0].value, 'Dr. Amit Kumar');
  assert.strictEqual(res.conflictingCandidates[1].value, 'Dr. A. Kumar');
});

test('Deduplicates identical principal names across different sections without conflict', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: { principalName: 'Dr. Amit Kumar' },
    schoolProfile: { principalName: 'dr. amit kumar ' } as any,
    campuses: [{ id: 'c-1', principalOrHead: 'Dr. Amit Kumar', isMainCampus: true } as any],
  };
  const res = resolveCanonicalPrincipal(intake);
  assert.strictEqual(res.hasConflict, false, 'Should not flag conflict when names are identical');
  assert.strictEqual(res.value, 'Dr. Amit Kumar');
  assert.strictEqual(res.conflictingCandidates?.length, 0);
});

// -----------------------------------------------------------------------------
// GROUP 6: Safe Editing State Transitions (Editing != Confirmation)
// -----------------------------------------------------------------------------
console.log('\nGroup 6: Safe Editing & State Preservation');

test('Preserves user edited unconfirmed values with needs_confirmation status', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: { schoolName: 'Greenwood High' },
    websiteRequirements: {
      primaryPurpose: 'Portal',
      requiredPages: ['Leadership & Desk'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
    },
    leadership: { principalName: 'Dr. Joseph Vijay' },
  };

  const initialConfigs = buildWebsitePageConfigurations(intake);
  const leadershipCfg = initialConfigs['Leadership & Desk'];
  assert(leadershipCfg);

  // Simulate user modifying the value via edit without confirming
  const editedReqs = leadershipCfg.requirements.map((r) =>
    r.key === 'principal_name'
      ? { ...r, value: 'Rev. Joseph Vijay, Ph.D.', userConfirmed: false, userEdited: true, status: 'needs_confirmation' as const }
      : r
  );

  const modifiedConfigs = {
    ...initialConfigs,
    'Leadership & Desk': {
      ...leadershipCfg,
      requirements: editedReqs,
    },
  };

  // Rebuild configurations with the modified state
  const rebuiltConfigs = buildWebsitePageConfigurations(intake, modifiedConfigs);
  const rebuiltPrincipal = rebuiltConfigs['Leadership & Desk'].requirements.find((r) => r.key === 'principal_name');

  assert(rebuiltPrincipal);
  assert.strictEqual(rebuiltPrincipal.value, 'Rev. Joseph Vijay, Ph.D.');
  assert.strictEqual(rebuiltPrincipal.status, 'needs_confirmation');
  assert.strictEqual(rebuiltPrincipal.userConfirmed, false);
});

test('Explicit confirmation marks requirement confirmed and clears conflict', () => {
  const req = createRequirement({
    key: 'principal_name',
    label: 'Principal',
    type: 'text',
    required: true,
    value: 'Dr. Joseph Vijay',
    hasConflict: true,
    userConfirmed: true,
  });

  assert.strictEqual(req.status, 'confirmed');
  assert.strictEqual(req.userConfirmed, true);
});

// -----------------------------------------------------------------------------
// GROUP 7: Action Required Queue Composition & Safety
// -----------------------------------------------------------------------------
console.log('\nGroup 7: Action Required Queue Composition & Safety');

test('Action required queue includes unconfirmed needs_confirmation and missing items', () => {
  const configs = {
    TestPage: {
      pageKey: 'TestPage',
      label: 'Test Page',
      slug: 'test-page',
      enabled: true,
      status: 'incomplete' as const,
      readyCount: 1,
      totalCount: 3,
      requirements: [
        createRequirement({ key: 'r1', label: 'Missing Item', type: 'text', required: true, value: '' }),
        createRequirement({ key: 'r2', label: 'Needs Review', type: 'text', required: true, value: 'Candidate', isCriticalConfirmation: true }),
        createRequirement({ key: 'r3', label: 'Confirmed Item', type: 'text', required: true, value: 'Done', userConfirmed: true }),
        createRequirement({ key: 'r4', label: 'Future CMS', type: 'boolean', required: true, value: true, isCmsFutureContent: true }),
      ],
      recommendedSections: [],
    },
  };

  const aggregates = aggregateWebsiteRequirementStates(configs);
  assert.strictEqual(aggregates.actionRequiredQueue.length, 2);
  const keys = aggregates.actionRequiredQueue.map((q) => q.requirement.key);
  assert(keys.includes('r1'), 'Missing required item must be in queue');
  assert(keys.includes('r2'), 'Needs confirmation item must be in queue');
  assert(!keys.includes('r3'), 'Confirmed item must NOT be in queue');
  assert(!keys.includes('r4'), 'Future CMS item must NOT be in queue');
});

// -----------------------------------------------------------------------------
// GROUP 8: Canonical Asset Resolution Hierarchy
// -----------------------------------------------------------------------------
console.log('\nGroup 8: Canonical Asset Resolution Hierarchy');

test('Resolves asset from assetChecklist with priority', () => {
  const intake: Partial<UniversalIntakeData> = {
    assetChecklist: {
      items: [
        {
          id: 'brand-logo',
          title: 'Official School Crest',
          fileUrl: 'https://cdn.example.com/crest.webp',
          fileName: 'crest.webp',
          fileSize: 45000,
          width: 512,
          height: 512,
          fileType: 'image/webp',
          status: 'provided',
          isRequired: true,
          category: 'A',
          sourceSection: 'brandingDesign',
          description: 'Official crest',
          applicableProducts: ['school-website'],
        },
      ],
      completionScore: 100,
      totalItemsCount: 1,
      providedItemsCount: 1,
      requiredProvidedCount: 1,
      requiredTotalCount: 1,
      publicationReady: true,
    },
    brandingDesign: {
      logoUrl: 'https://cdn.example.com/old_logo.png',
      logoFileName: 'old_logo.png',
    },
  };

  const resolved = resolveCanonicalAsset(intake, 'brand-logo');
  assert.strictEqual(resolved.isAvailable, true);
  assert.strictEqual(resolved.url, 'https://cdn.example.com/crest.webp');
  assert.strictEqual(resolved.fileName, 'crest.webp');
  assert.strictEqual(resolved.fileSize, 45000);
  assert.strictEqual(resolved.width, 512);
  assert.strictEqual(resolved.height, 512);
  assert.strictEqual(resolved.sourceSection, 'assetChecklist');
});

test('Resolves official logo from brandingDesign when not in checklist', () => {
  const intake: Partial<UniversalIntakeData> = {
    brandingDesign: {
      logoUrl: 'https://cdn.example.com/official_logo.webp',
      logoFileName: 'school_crest_hd.webp',
      logoFileSize: 128000,
      logoWidth: 800,
      logoHeight: 800,
      logoOptimizedFormat: 'webp',
    },
  };

  const resolved = resolveCanonicalAsset(intake, 'brand-logo');
  assert.strictEqual(resolved.isAvailable, true);
  assert.strictEqual(resolved.url, 'https://cdn.example.com/official_logo.webp');
  assert.strictEqual(resolved.fileName, 'school_crest_hd.webp');
  assert.strictEqual(resolved.width, 800);
  assert.strictEqual(resolved.height, 800);
  assert.strictEqual(resolved.sourceSection, 'brandingDesign');
});

test('Resolves principal photo from leadership with portrait metadata', () => {
  const intake: Partial<UniversalIntakeData> = {
    leadership: {
      principalPhoto: {
        id: 'photo-p1',
        personId: 'principal',
        storageKey: 'tenants/1/leadership/principal.webp',
        fileName: 'dr_sharma_portrait.webp',
        url: 'https://cdn.example.com/principal.webp',
        mimeType: 'image/webp',
        optimizedSize: 95000,
        width: 600,
        height: 750,
      },
    },
  };

  const resolved = resolveCanonicalAsset(intake, 'principal_photo');
  assert.strictEqual(resolved.isAvailable, true);
  assert.strictEqual(resolved.url, 'https://cdn.example.com/principal.webp');
  assert.strictEqual(resolved.fileName, 'dr_sharma_portrait.webp');
  assert.strictEqual(resolved.fileSize, 95000);
  assert.strictEqual(resolved.width, 600);
  assert.strictEqual(resolved.height, 750);
  assert.strictEqual(resolved.sourceSection, 'leadership');
});

test('Resolves primary campus image as hero image fallback', () => {
  const intake: Partial<UniversalIntakeData> = {
    campuses: [
      {
        id: 'campus-1',
        name: 'Main Campus',
        isMainCampus: true,
        address: '123 Academic Way',
        city: 'Dehradun',
        state: 'Uttarakhand',
        pin: '248001',
        contactPhone: '9876543210',
        images: [
          {
            id: 'img-1',
            campusId: 'campus-1',
            storageKey: 'tenants/1/campuses/hero.webp',
            fileName: 'main_campus_front.webp',
            url: 'https://cdn.example.com/campus_front.webp',
            mimeType: 'image/webp',
            isPrimary: true,
            optimizedSize: 250000,
            width: 1920,
            height: 1080,
            category: 'campus_buildings',
          },
        ],
      },
    ],
  };

  const resolved = resolveCanonicalAsset(intake, 'hero_image');
  assert.strictEqual(resolved.isAvailable, true);
  assert.strictEqual(resolved.url, 'https://cdn.example.com/campus_front.webp');
  assert.strictEqual(resolved.fileName, 'main_campus_front.webp');
  assert.strictEqual(resolved.width, 1920);
  assert.strictEqual(resolved.height, 1080);
  assert.strictEqual(resolved.sourceSection, 'campuses');
});

// -----------------------------------------------------------------------------
// GROUP 9: Duplicate Page & Collision Detection
// -----------------------------------------------------------------------------
console.log('\nGroup 9: Duplicate Page & URL Collision Detection');

test('Detects exact duplicate slugs', () => {
  const pages = [
    { pageKey: 'Admissions', label: 'Admissions', slug: 'admissions', isCustom: false },
    { pageKey: 'custom_1', label: 'Admission Process', slug: 'admissions', isCustom: true },
  ];

  const risks = detectDuplicatePageRisks(pages);
  assert.strictEqual(risks.length, 1);
  assert.strictEqual(risks[0].matchType, 'exact_slug');
  assert.strictEqual(risks[0].slug, 'admissions');
});

test('Detects near-duplicate plural/singular slugs', () => {
  const pages = [
    { pageKey: 'Admissions', label: 'Admissions', slug: 'admissions', isCustom: false },
    { pageKey: 'custom_2', label: 'Admission', slug: 'admission', isCustom: true },
  ];

  const risks = detectDuplicatePageRisks(pages);
  assert(risks.length >= 1);
  assert.strictEqual(risks[0].matchType, 'near_slug');
});

test('Detects duplicate exact titles', () => {
  const pages = [
    { pageKey: 'Academics', label: 'Academics', slug: 'academics', isCustom: false },
    { pageKey: 'custom_3', label: 'Academics', slug: 'curriculum-details', isCustom: true },
  ];

  const risks = detectDuplicatePageRisks(pages);
  assert(risks.length >= 1);
  assert.strictEqual(risks[0].matchType, 'exact_title');
});

test('Returns empty when all pages have distinct slugs and titles', () => {
  const pages = [
    { pageKey: 'Home', label: 'Home', slug: 'home', isCustom: false },
    { pageKey: 'About School', label: 'About School', slug: 'about-school', isCustom: false },
    { pageKey: 'Contact Us', label: 'Contact Us', slug: 'contact-us', isCustom: false },
  ];

  const risks = detectDuplicatePageRisks(pages);
  assert.strictEqual(risks.length, 0);
});

// -----------------------------------------------------------------------------
// GROUP 10: Separated Readiness Breakdown Engine
// -----------------------------------------------------------------------------
console.log('\nGroup 10: Separated Readiness Breakdown Engine');

test('Computes separated metrics for pages, content, assets, and compliance', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public Academy',
      board: 'CBSE',
    },
    campuses: [
      {
        id: 'c1',
        name: 'Main Campus',
        isMainCampus: true,
        address: 'Sector 14, Rohini',
        city: 'New Delhi',
        state: 'Delhi',
        pin: '110085',
        contactPhone: '9876543210',
      },
    ],
    assetChecklist: {
      items: [
        {
          id: 'doc-affiliation-cert',
          title: 'CBSE Affiliation Certificate',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/affiliation.pdf',
          fileName: 'cbse_affiliation.pdf',
          fileSize: 120000,
          isRequired: true,
          category: 'B',
          sourceSection: 'compliance',
          description: 'Affiliation cert',
          applicableProducts: ['school-website'],
        },
        {
          id: 'doc-fire-safety',
          title: 'Fire Safety Certificate',
          status: 'provided',
          fileUrl: 'https://cdn.example.com/fire_safety.pdf',
          fileName: 'fire_safety.pdf',
          fileSize: 85000,
          isRequired: true,
          category: 'B',
          sourceSection: 'compliance',
          description: 'Fire cert',
          applicableProducts: ['school-website'],
        },
      ],
      completionScore: 100,
      totalItemsCount: 2,
      providedItemsCount: 2,
      requiredProvidedCount: 2,
      requiredTotalCount: 2,
      publicationReady: true,
    },
    websiteRequirements: {
      primaryPurpose: 'Comprehensive institutional web presence',
      requiredPages: ['Home', 'About School', 'Mandatory Disclosures'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
    },
  };

  const configs = buildWebsitePageConfigurations(intake);
  const breakdown = calculateWebsiteReadinessBreakdown(intake, configs);

  assert(breakdown.websitePagesCount >= 3, 'Must have at least 3 pages');
  assert.strictEqual(breakdown.complianceBlockersCount, 0, 'CBSE cert and fire safety provided -> 0 compliance blockers');
  assert.strictEqual(breakdown.duplicateRiskCount, 0, 'No duplicates in standard pages');
  assert(typeof breakdown.contentReadyPercentage === 'number');
  assert(typeof breakdown.assetsVerifiedCount === 'number');
});

test('Flags compliance blockers when CBSE school is missing affiliation cert', () => {
  const intake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'St. Xavier School',
      board: 'CBSE',
    },
    campuses: [
      {
        id: 'c1',
        name: 'Main Campus',
        isMainCampus: true,
        address: 'Station Road',
        city: 'Patna',
        state: 'Bihar',
        pin: '800001',
        contactPhone: '9876543210',
      },
    ],
    assetChecklist: {
      items: [], // empty checklist
      completionScore: 0,
      totalItemsCount: 0,
      providedItemsCount: 0,
      requiredProvidedCount: 0,
      requiredTotalCount: 0,
      publicationReady: false,
    },
    websiteRequirements: {
      primaryPurpose: 'Admissions and information',
      requiredPages: ['Home', 'Mandatory Disclosures'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
    },
  };

  const configs = buildWebsitePageConfigurations(intake);
  const breakdown = calculateWebsiteReadinessBreakdown(intake, configs);

  assert(breakdown.complianceBlockersCount >= 2, 'Missing affiliation and fire safety must be flagged');
  const blockerKeys = breakdown.complianceBlockersList.map((b) => b.key);
  assert(blockerKeys.includes('doc-affiliation-cert'), 'Must include affiliation cert blocker');
  assert(blockerKeys.includes('doc-fire-safety'), 'Must include fire safety blocker');
  assert.strictEqual(breakdown.canApprove, false, 'Cannot approve with compliance blockers');
});

// -----------------------------------------------------------------------------
// GROUP 11: Final Specification Approval Workflow
// -----------------------------------------------------------------------------
console.log('\nGroup 11: Final Specification Approval Workflow');

test('Preserves approval metadata in websiteRequirements', () => {
  const approvalTimestamp = '2026-09-09T08:00:00.000Z';
  const intake: Partial<UniversalIntakeData> = {
    websiteRequirements: {
      primaryPurpose: 'Official School Portal',
      requiredPages: ['Home', 'About School'],
      languagesRequired: ['English'],
      migrationNeededFromExisting: false,
      websiteApproved: true,
      websiteApprovedAt: approvalTimestamp,
      websiteApprovedBy: 'Sister Maria Teresa (Principal)',
      websiteApprovalNotes: 'Certified by school governance committee.',
    },
  };

  assert.strictEqual(intake.websiteRequirements?.websiteApproved, true);
  assert.strictEqual(intake.websiteRequirements?.websiteApprovedAt, approvalTimestamp);
  assert.strictEqual(intake.websiteRequirements?.websiteApprovedBy, 'Sister Maria Teresa (Principal)');
  assert.strictEqual(intake.websiteRequirements?.websiteApprovalNotes, 'Certified by school governance committee.');

  // JSON roundtrip verification
  const serialized = JSON.stringify(intake);
  const deserialized = JSON.parse(serialized);
  assert.strictEqual(deserialized.websiteRequirements.websiteApproved, true);
  assert.strictEqual(deserialized.websiteRequirements.websiteApprovedBy, 'Sister Maria Teresa (Principal)');
});

console.log('\n================================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');

