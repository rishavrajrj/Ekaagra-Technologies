/**
 * ==============================================================================
 * PUBLICATION BLOCKER ENGINE & UNIVERSAL VERIFICATION UNIT TEST SUITE
 * File: src/lib/__tests__/publicationBlockerEngine.test.ts
 * ==============================================================================
 */

import {
  PUBLICATION_REQUIREMENT_KEYS,
  normalizeLeadershipData,
  validatePrincipalName,
  validatePrincipalPortrait,
  isValidUploadedDocument,
  validateAffiliationCertificate,
  validateRecognitionNoc,
  validateFireSafetyCertificate,
  validateMandatoryDisclosure,
  validateRequirement,
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  calculateUniversalReadiness,
} from '../universalVerificationEngine';
import { getEffectiveMediaRegistry } from '../mediaRegistryUtils';
import type { UniversalIntakeData, PersonImageData, SharedMediaAsset } from '../types';

function runBlockerTestSuite() {
  console.log('🧪 Starting Publication Blocker Engine & Universal Verification Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // 1. PRINCIPAL NAME VALIDATION TESTS
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Principal Name Validation & Placeholder Guardrails ---');

  const validNameResult = validatePrincipalName({
    leadership: { principalName: 'Mrs. Mala Sinha' } as any,
  });
  assert(
    validNameResult.isSatisfied && validNameResult.key === PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME,
    'Valid principal name "Mrs. Mala Sinha" is satisfied'
  );
  assert(
    validNameResult.debug?.valuePresent === true && validNameResult.debug?.satisfied === true,
    'Debug metadata exposes source-of-truth details for valid name'
  );

  const whitespaceNameResult = validatePrincipalName({
    leadership: { principalName: '   Mrs. Mala Sinha   ' } as any,
  });
  assert(
    whitespaceNameResult.isSatisfied,
    'Whitespace padded principal name is trimmed and considered satisfied'
  );

  const emptyNameResult = validatePrincipalName({
    leadership: { principalName: '' } as any,
  });
  assert(
    !emptyNameResult.isSatisfied,
    'Empty principal name remains a publication blocker'
  );

  const nullNameResult = validatePrincipalName({
    leadership: { principalName: null as any } as any,
  });
  assert(
    !nullNameResult.isSatisfied,
    'Null principal name remains a publication blocker'
  );

  const missingLeadResult = validatePrincipalName({});
  assert(
    !missingLeadResult.isSatisfied,
    'Undefined leadership data remains a publication blocker'
  );

  // Reject placeholder values
  const placeholders = [
    'N/A',
    'n/a',
    'NA',
    'Enter principal name',
    'Principal Name',
    'Unknown',
    'Dr. / Mr. / Mrs.',
    'TBD',
    'To be decided',
    '-',
    '--',
  ];
  placeholders.forEach((ph) => {
    const phResult = validatePrincipalName({
      leadership: { principalName: ph } as any,
    });
    assert(
      !phResult.isSatisfied,
      `Placeholder "${ph}" is strictly rejected as an invalid principal name`
    );
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. PRINCIPAL PORTRAIT VALIDATION TESTS
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Principal Portrait Validation, Deletion & Replacement ---');

  const mockPortraitAsset: PersonImageData = {
    id: 'img-person-principal-1',
    personId: 'principal-main',
    personRole: 'principal',
    storageKey: 'schools/dpa/principal-mala-sinha.webp',
    fileName: 'principal.webp',
    url: 'https://assets.ekaagra.site/schools/dpa/principal-mala-sinha.webp',
    mimeType: 'image/webp',
    width: 1402,
    height: 1122,
    originalSize: 120000,
    optimizedSize: 69836,
    optimizedFormat: 'webp',
    imageType: 'Principal / Head of Institution',
    caption: 'Official portrait of Mrs. Mala Sinha',
  };

  const portraitResult = validatePrincipalPortrait({
    leadership: { principalPhoto: mockPortraitAsset } as any,
  });
  assert(
    portraitResult.isSatisfied && portraitResult.key === PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
    'Canonical PersonImageData object satisfies Principal Portrait requirement'
  );
  assert(
    portraitResult.debug?.mediaId === mockPortraitAsset.id && portraitResult.debug?.source === 'leadership.principalPhoto',
    'Debug metadata exposes canonical photo ID and source field'
  );

  const photoUrlResult = validatePrincipalPortrait({
    leadership: { principalPhotoUrl: 'https://assets.ekaagra.site/principal.webp' } as any,
  });
  assert(
    photoUrlResult.isSatisfied,
    'Direct principalPhotoUrl string satisfies Principal Portrait requirement'
  );

  const missingPhotoResult = validatePrincipalPortrait({
    leadership: { principalPhoto: null, principalPhotoUrl: '' } as any,
  });
  assert(
    !missingPhotoResult.isSatisfied,
    'Missing principal photo is flagged as an active publication blocker'
  );

  // Delete portrait scenario
  const deletedPhotoIntake: Partial<UniversalIntakeData> = {
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalPhoto: null,
      principalPhotoUrl: '',
    } as any,
  };
  const deletedResult = validatePrincipalPortrait(deletedPhotoIntake);
  assert(
    !deletedResult.isSatisfied,
    'Deleting principal portrait immediately returns the publication blocker'
  );

  // Replace portrait scenario
  const replacementPortrait: PersonImageData = {
    id: 'img-person-replacement',
    personId: 'principal-main',
    personRole: 'principal',
    storageKey: 'schools/dpa/principal-replacement.webp',
    fileName: 'principal-replacement.webp',
    url: 'https://assets.ekaagra.site/principal-replacement.webp',
    mimeType: 'image/webp',
    width: 1600,
    height: 1200,
    imageType: 'Principal / Head of Institution',
  };
  const replacedPhotoIntake: Partial<UniversalIntakeData> = {
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalPhoto: replacementPortrait,
      principalPhotoUrl: replacementPortrait.url,
    } as any,
  };
  const replaceResult = validatePrincipalPortrait(replacedPhotoIntake);
  assert(
    replaceResult.isSatisfied && replaceResult.debug?.mediaId === replacementPortrait.id,
    'Replacing principal portrait recognizes new asset ID and satisfies requirement'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 3. MEDIA REGISTRY REUSE & SYNCHRONIZATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Centralized Media Registry Synchronization & Asset Reuse ---');

  const intakeForRegistry: Partial<UniversalIntakeData> = {
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalPhoto: mockPortraitAsset,
    } as any,
  };
  const effectiveRegistry = getEffectiveMediaRegistry(intakeForRegistry);
  const foundInRegistry = effectiveRegistry.find((a) => a.id === mockPortraitAsset.id || a.url === mockPortraitAsset.url);
  assert(
    Boolean(foundInRegistry),
    'getEffectiveMediaRegistry() automatically scans and registers leadership principalPhoto'
  );
  assert(
    Boolean(foundInRegistry?.usedIn.includes('leadership')) && Boolean(foundInRegistry?.categories.includes('principal')),
    'Registered principal photo has usedIn: leadership and category: principal'
  );

  // Validate that an asset already in mediaRegistry can satisfy Principal Portrait without re-upload
  const sharedAssetFromLibrary: SharedMediaAsset = {
    id: 'media-shared-principal-01',
    url: 'https://assets.ekaagra.site/library/principal-reused.webp',
    fileName: 'principal.webp',
    mimeType: 'image/webp',
    size: 69836,
    categories: ['principal', 'leadership'],
    source: 'leadership',
    usedIn: ['leadership'],
    caption: 'Principal / Head of Institution',
  };
  const intakeWithOnlyRegistry: Partial<UniversalIntakeData> = {
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalPhoto: null,
      principalPhotoUrl: '',
    } as any,
    mediaRegistry: [sharedAssetFromLibrary],
  };
  const registrySatisfied = validatePrincipalPortrait(intakeWithOnlyRegistry, [sharedAssetFromLibrary]);
  assert(
    registrySatisfied.isSatisfied,
    'Existing photo in Centralized Media Registry satisfies Principal Portrait without duplicate upload'
  );
  assert(
    registrySatisfied.debug?.source === 'mediaRegistry',
    'Debug metadata traces source to mediaRegistry'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 4. LEGACY DATA COMPATIBILITY & NORMALIZATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Legacy Data Normalization & Schema Aliases ---');

  const legacyLead1 = normalizeLeadershipData({
    principalFullName: 'Dr. Anita Roy',
    principal: { photoUrl: 'https://old.school.com/photo.jpg' },
  });
  assert(
    legacyLead1.principalName === 'Dr. Anita Roy',
    'Legacy principalFullName normalizes to canonical principalName'
  );
  assert(
    legacyLead1.principalPhotoUrl === 'https://old.school.com/photo.jpg',
    'Legacy principal.photoUrl normalizes to canonical principalPhotoUrl'
  );

  const legacyLead2 = normalizeLeadershipData({
    headOfInstitution: 'Fr. George Matthew',
    principal: { name: 'Fr. George Matthew', designation: 'Director & Head' },
  });
  assert(
    legacyLead2.principalName === 'Fr. George Matthew',
    'Legacy headOfInstitution normalizes to canonical principalName'
  );
  assert(
    legacyLead2.principalDesignation === 'Director & Head',
    'Legacy principal.designation normalizes to canonical principalDesignation'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 5. STATUTORY COMPLIANCE DOCUMENTS GUARDRAILS
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Statutory Compliance Documents & AI-Guardrails ---');

  const missingDocsIntake: Partial<UniversalIntakeData> = {
    assetChecklist: { items: [] },
  };

  const affMissing = validateAffiliationCertificate(missingDocsIntake);
  assert(
    !affMissing.isSatisfied && affMissing.key === PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE,
    'Missing affiliation certificate is an active blocker'
  );

  const nocMissing = validateRecognitionNoc(missingDocsIntake);
  assert(
    !nocMissing.isSatisfied && nocMissing.key === PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC,
    'Missing State NOC is an active blocker'
  );

  const fireMissing = validateFireSafetyCertificate(missingDocsIntake);
  assert(
    !fireMissing.isSatisfied && fireMissing.key === PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE,
    'Missing fire safety certificate is an active blocker'
  );

  const disclosureMissing = validateMandatoryDisclosure(missingDocsIntake);
  assert(
    !disclosureMissing.isSatisfied && disclosureMissing.key === PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE,
    'Missing Appendix IX disclosure is an active blocker'
  );

  // Guardrail: AI generated text, placeholders, or promises must NOT satisfy document requirements
  const aiFakeIntake: Partial<UniversalIntakeData> = {
    assetChecklist: {
      items: [
        { id: 'cert-affiliation', fileUrl: 'ai_generated_placeholder.txt', status: 'provided' } as any,
        { id: 'cert-recognition', fileUrl: 'will provide later', status: 'provided' } as any,
        { id: 'cert-fire-safety', fileUrl: 'N/A', status: 'provided' } as any,
        { id: 'cert-mandatory-disclosure', fileUrl: 'placeholder', status: 'provided' } as any,
      ],
    },
  };
  assert(
    !validateAffiliationCertificate(aiFakeIntake).isSatisfied,
    'GUARDRAIL: ai_generated_placeholder does not satisfy affiliation certificate'
  );
  assert(
    !validateRecognitionNoc(aiFakeIntake).isSatisfied,
    'GUARDRAIL: "will provide later" does not satisfy recognition NOC'
  );
  assert(
    !validateFireSafetyCertificate(aiFakeIntake).isSatisfied,
    'GUARDRAIL: "N/A" does not satisfy fire safety certificate'
  );
  assert(
    !validateMandatoryDisclosure(aiFakeIntake).isSatisfied,
    'GUARDRAIL: "placeholder" does not satisfy mandatory disclosure'
  );

  // Genuine uploaded documents
  const genuineDocsIntake: Partial<UniversalIntakeData> = {
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Grant Letter',
          fileUrl: 'https://docs.ekaagra.site/cbse-affiliation-2026.pdf',
          fileName: 'cbse-affiliation-2026.pdf',
          status: 'provided',
          requirement: 'statutory',
        } as any,
        {
          id: 'cert-recognition',
          title: 'State Education Dept NOC',
          fileUrl: 'https://docs.ekaagra.site/state-noc-order.pdf',
          fileName: 'state-noc-order.pdf',
          status: 'provided',
          requirement: 'statutory',
        } as any,
        {
          id: 'cert-fire-safety',
          title: 'Fire Safety NOC',
          fileUrl: 'https://docs.ekaagra.site/fire-safety-cert.pdf',
          fileName: 'fire-safety-cert.pdf',
          status: 'provided',
          requirement: 'statutory',
        } as any,
        {
          id: 'cert-mandatory-disclosure',
          title: 'Mandatory Public Disclosure Appendix IX',
          fileUrl: 'https://docs.ekaagra.site/appendix-ix-disclosures.pdf',
          fileName: 'appendix-ix-disclosures.pdf',
          status: 'provided',
          requirement: 'statutory',
        } as any,
      ],
    },
  };
  assert(
    validateAffiliationCertificate(genuineDocsIntake).isSatisfied,
    'Genuine uploaded affiliation PDF satisfies requirement'
  );
  assert(
    validateRecognitionNoc(genuineDocsIntake).isSatisfied,
    'Genuine uploaded State NOC PDF satisfies requirement'
  );
  assert(
    validateFireSafetyCertificate(genuineDocsIntake).isSatisfied,
    'Genuine uploaded Fire Safety PDF satisfies requirement'
  );
  assert(
    validateMandatoryDisclosure(genuineDocsIntake).isSatisfied,
    'Genuine uploaded Mandatory Disclosure PDF satisfies requirement'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 6. EXACT USER SCENARIO (MALA SINHA + PRINCIPAL.WEBP)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Exact User Scenario (Mala Sinha + principal.webp) ---');

  const userScenarioIntake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public International School',
      address: 'Sector 4, Main Campus',
      officialPhone: '+91 9876543210',
      officialEmail: 'info@dpis.edu.in',
      board: 'CBSE',
    } as any,
    campuses: [
      {
        id: 'campus-1',
        name: 'Main Campus',
        address: 'Sector 4, Main Campus',
        images: [
          {
            id: 'campus-hero',
            url: 'https://assets.ekaagra.site/campus-hero.webp',
            category: 'campus_buildings',
            fileName: 'campus-hero.webp',
            isHero: true,
          } as any,
        ],
      } as any,
    ],
    brandingDesign: {
      hasHighResLogo: true,
      logoUrl: 'https://assets.ekaagra.site/logo.png',
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#10B981',
    } as any,
    schoolContent: {
      aboutSchool: 'A premier educational institution dedicated to holistic child development with decades of excellence.',
      vision: 'To nurture compassionate, visionary global leaders through innovative education.',
      mission: 'Empowering every student with critical thinking, ethical integrity, and world-class academic skills.',
    } as any,
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalDesignation: 'Principal',
      principalQualification: 'B.Ed. (English), M.A. English',
      principalPhoto: mockPortraitAsset,
      principalPhotoUrl: mockPortraitAsset.url,
      principalMessage: 'Welcome to our institution where we strive for academic rigor and values.',
    } as any,
    usersAccess: {
      superAdminFullName: 'Mrs. Mala Sinha',
      superAdminEmail: 'principal@dpis.edu.in',
      superAdminPhone: '+91 9876543210',
    } as any,
    clientConfirmation: {
      isConfirmed: true,
      confirmedByName: 'Mrs. Mala Sinha',
    } as any,
    assetChecklist: {
      items: [], // Statutory documents not uploaded yet
    },
  };

  const assets = aggregateUniversalAssets(userScenarioIntake);
  const documents = aggregateUniversalDocuments(userScenarioIntake);
  const facilities = [];
  const readiness = calculateUniversalReadiness(userScenarioIntake, assets, documents, facilities);

  // Asset validation
  const principalAsset = assets.find((a) => a.id === 'asset-principal-photo');
  assert(
    principalAsset?.status === 'verified',
    'Universal Assets aggregator marks Principal Portrait as verified'
  );
  assert(
    principalAsset?.url === mockPortraitAsset.url,
    'Universal Assets aggregator links exact principal.webp URL'
  );

  // Blocker check
  const principalNameBlocker = readiness.publicationBlockers.find(
    (b) => b.key === PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME || b.id === 'blocker-principal-name'
  );
  assert(
    !principalNameBlocker,
    'SUCCESS: Head of Institution / Principal Name is NOT a blocker'
  );

  const principalPortraitBlocker = readiness.publicationBlockers.find(
    (b) => b.key === PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT || b.id.includes('principal')
  );
  assert(
    !principalPortraitBlocker,
    'SUCCESS: Principal Portrait is NOT a blocker'
  );

  // Check remaining blockers count: exactly 4 statutory documents remain
  assert(
    readiness.publicationBlockers.length === 4,
    `SUCCESS: Exactly 4 blockers remain (the 4 statutory documents). Actual count: ${readiness.publicationBlockers.length}`
  );

  const remainingKeys = readiness.publicationBlockers.map((b) => b.key);
  assert(
    remainingKeys.includes(PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE),
    'Remaining blocker: CBSE Affiliation Certificate'
  );
  assert(
    remainingKeys.includes(PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC),
    'Remaining blocker: State Government NOC'
  );
  assert(
    remainingKeys.includes(PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE),
    'Remaining blocker: Fire Safety Certificate'
  );
  assert(
    remainingKeys.includes(PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE),
    'Remaining blocker: Mandatory Public Disclosure'
  );

  // Check scores
  assert(
    readiness.categoryScores.content === 100,
    `Content pillar is 100% filled (Actual: ${readiness.categoryScores.content}%)`
  );
  assert(
    readiness.categoryScores.assets === 100,
    `Assets pillar is 100% verified (Actual: ${readiness.categoryScores.assets}%)`
  );

  console.log(`\n===========================================================`);
  console.log(`PUBLICATION BLOCKER ENGINE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBlockerTestSuite();
