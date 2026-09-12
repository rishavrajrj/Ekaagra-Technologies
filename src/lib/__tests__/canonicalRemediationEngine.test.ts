/**
 * ==============================================================================
 * CANONICAL DOCUMENTS & GUIDED REMEDIATION NAVIGATION TEST SUITE
 * File: src/lib/__tests__/canonicalRemediationEngine.test.ts
 * ==============================================================================
 */

import {
  CANONICAL_DOCUMENT_IDS,
  CANONICAL_STATUTORY_REQUIREMENTS,
  resolveCanonicalDocuments,
} from '../canonicalDocuments';
import {
  REMEDIATION_REGISTRY,
  resolveRemediationDestination,
  PUBLICATION_REQUIREMENT_KEYS,
} from '../remediationRegistry';
import {
  aggregateUniversalDocuments,
  calculateUniversalReadiness,
  validateRequirement,
} from '../universalVerificationEngine';
import type { UniversalIntakeData } from '../types';

function runCanonicalRemediationTestSuite() {
  console.log('🧪 Starting Canonical Documents & Guided Remediation Unit Tests...\n');

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
  // 1. CANONICAL DOCUMENT REGISTRY DEFINITION & PARITY
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Canonical Document Registry Definition & Group F Parity ---');

  assert(
    CANONICAL_STATUTORY_REQUIREMENTS.length === 5,
    'Canonical statutory requirements list defines exactly 5 authoritative documents'
  );

  const canonicalIds = CANONICAL_STATUTORY_REQUIREMENTS.map((d) => d.id);
  assert(
    canonicalIds.includes(CANONICAL_DOCUMENT_IDS.AFFILIATION_CERTIFICATE) &&
      canonicalIds.includes(CANONICAL_DOCUMENT_IDS.RECOGNITION_NOC) &&
      canonicalIds.includes(CANONICAL_DOCUMENT_IDS.SOCIETY_REGISTRATION) &&
      canonicalIds.includes(CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY) &&
      canonicalIds.includes(CANONICAL_DOCUMENT_IDS.MANDATORY_DISCLOSURE),
    'All 5 canonical IDs match Group F exactly (including combined Building Safety & Fire Safety Certificate)'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 2. COMBINED BUILDING & FIRE SAFETY CERTIFICATE UPLOAD RESOLUTION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Combined Building Safety & Fire Safety Certificate Resolution ---');

  const userWithCombinedCert: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public International School',
      officialPhone: '+91 9876543210',
      officialEmail: 'info@dpis.edu.in',
      board: 'CBSE',
    } as any,
    campuses: [
      { id: 'campus-1', name: 'Main Campus', address: 'NH-28, Motihari', isMainCampus: true },
    ] as any,
    leadership: {
      principalName: 'Mrs. Mala Sinha',
      principalPhotoUrl: 'https://example.com/principal.webp',
    } as any,
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'Board Affiliation Certificate',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://storage.example.com/affiliation.pdf',
          fileName: 'cbse-affiliation-2026.pdf',
          fileSize: 450000,
        },
        {
          id: 'cert-noc',
          title: 'School Recognition Certificate / Government NOC',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://storage.example.com/noc.pdf',
          fileName: 'govt-noc-bihar.pdf',
          fileSize: 320000,
        },
        {
          id: 'cert-society',
          title: 'Society / Trust Registration Certificate',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://storage.example.com/society.pdf',
          fileName: 'rewt-society-registration.pdf',
          fileSize: 512000,
        },
        {
          // User uploads the combined Building & Fire Safety Certificate
          id: 'cert-safety',
          title: 'Building Safety & Fire Safety Certificate',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://storage.example.com/safety.pdf',
          fileName: 'structural-and-fire-safety-cert.pdf',
          fileSize: 780000,
        },
        {
          id: 'cert-mandatory-disclosure',
          title: 'Mandatory Public Disclosure Document',
          category: 'certificates',
          requirement: 'required',
          status: 'provided',
          fileUrl: 'https://storage.example.com/disclosure.pdf',
          fileName: 'cbse-appendix-ix-disclosure.pdf',
          fileSize: 610000,
        },
      ] as any,
    },
  };

  const resolvedDocs = resolveCanonicalDocuments(userWithCombinedCert);

  assert(
    resolvedDocs.length === 5,
    `Exact document count: 5 documents returned (Actual: ${resolvedDocs.length}). NO phantom 6th document!`
  );

  const safetyDoc = resolvedDocs.find((d) => d.checklistId === 'cert-safety');
  assert(
    Boolean(safetyDoc && safetyDoc.status === 'VALID' && safetyDoc.isVerified),
    'Building & Fire Safety certificate is marked VALID and verified when cert-safety is provided'
  );

  const aggregatedDocs = aggregateUniversalDocuments(userWithCombinedCert);
  assert(
    aggregatedDocs.length === 5,
    `aggregateUniversalDocuments returns 5 documents (Actual: ${aggregatedDocs.length})`
  );

  const aggSafety = aggregatedDocs.find((d) => d.type === 'cert-safety');
  assert(
    Boolean(aggSafety && aggSafety.status === 'verified'),
    'Aggregated safety document status is "verified"'
  );

  const fireSafetyVal = validateRequirement(PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE, userWithCombinedCert);
  assert(
    fireSafetyVal.isSatisfied,
    'validateRequirement for FIRE_SAFETY_CERTIFICATE is satisfied by cert-safety'
  );

  // Check readiness with all 5 documents provided
  const readiness = calculateUniversalReadiness(userWithCombinedCert, [], aggregatedDocs, []);
  assert(
    readiness.publicationBlockers.length === 0,
    `Zero publication blockers when all 5 statutory documents are uploaded (Actual blockers: ${readiness.publicationBlockers.length})`
  );
  assert(
    readiness.categoryScores.compliance === 100,
    `Compliance pillar score is 100% (Actual: ${readiness.categoryScores.compliance}%)`
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 3. CONDITIONAL / NOT APPLICABLE HANDLING (SOCIETY REGISTRATION)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Conditional / Not Applicable Handling ---');

  const intakeWithNASociety: Partial<UniversalIntakeData> = {
    ...userWithCombinedCert,
    assetChecklist: {
      items: [
        ...(userWithCombinedCert.assetChecklist?.items || []).map((item) => {
          if (item.id === 'cert-society' || item.id === 'cert-registration') {
            return {
              ...item,
              status: 'not_applicable',
              fileUrl: undefined,
            };
          }
          return item;
        }),
      ] as any,
    },
  };

  const resolvedNADocs = resolveCanonicalDocuments(intakeWithNASociety);
  const societyDoc = resolvedNADocs.find((d) => d.checklistId === 'cert-registration');
  assert(
    societyDoc?.status === 'NOT_APPLICABLE' && societyDoc?.isNotApplicable === true,
    'Society registration is marked NOT_APPLICABLE when user flagged as not applicable'
  );

  const aggNADocs = aggregateUniversalDocuments(intakeWithNASociety);
  const aggSociety = aggNADocs.find((d) => d.type === 'cert-registration');
  assert(
    Boolean(aggSociety && aggSociety.isNotApplicable),
    'Aggregated document preserves isNotApplicable flag'
  );

  const naReadiness = calculateUniversalReadiness(intakeWithNASociety, [], aggNADocs, []);
  assert(
    naReadiness.publicationBlockers.length === 0,
    'Not applicable society registration does NOT block publication'
  );
  assert(
    naReadiness.categoryScores.compliance === 100,
    'Compliance score remains 100% when non-applicable items are excluded'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 4. GUIDED REMEDIATION REGISTRY & DESTINATION RESOLUTION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Guided Remediation Registry & Destination Resolution ---');

  const docDest = resolveRemediationDestination(CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY);
  assert(
    docDest.step === 'assetChecklist' && docDest.subsection === 'certificates',
    'Safety certificate resolves to step "assetChecklist" and subsection "certificates"'
  );
  assert(
    docDest.anchor === 'asset-row-cert-safety',
    'Safety certificate resolves to DOM anchor "asset-row-cert-safety"'
  );

  const nameDest = resolveRemediationDestination(PUBLICATION_REQUIREMENT_KEYS.SCHOOL_NAME);
  assert(
    nameDest.step === 'schoolProfile' && nameDest.anchor === 'field-school-name',
    'School name resolves to step "schoolProfile" and DOM anchor "field-school-name"'
  );

  const addressDest = resolveRemediationDestination(PUBLICATION_REQUIREMENT_KEYS.SCHOOL_ADDRESS);
  assert(
    addressDest.step === 'campuses' && addressDest.anchor === 'field-campus-address',
    'School address resolves to step "campuses" and DOM anchor "field-campus-address"'
  );

  const principalNameDest = resolveRemediationDestination(PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME);
  assert(
    principalNameDest.step === 'leadership' && principalNameDest.anchor === 'field-principal-name',
    'Principal name resolves to step "leadership" and DOM anchor "field-principal-name"'
  );

  const principalPortraitDest = resolveRemediationDestination(PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT);
  assert(
    principalPortraitDest.step === 'leadership' && principalPortraitDest.anchor === 'field-principal-portrait',
    'Principal portrait resolves to step "leadership" and DOM anchor "field-principal-portrait"'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // 5. BLOCKER PAYLOADS INCLUDE REMEDIATION ANCHORS & DESTINATIONS
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Blocker Payloads Remediation Attachment ---');

  const emptyIntake: Partial<UniversalIntakeData> = {
    schoolProfile: {} as any,
    campuses: [] as any,
    leadership: {} as any,
  };
  const emptyDocs = aggregateUniversalDocuments(emptyIntake);
  const emptyReadiness = calculateUniversalReadiness(emptyIntake, [], emptyDocs, []);

  assert(
    emptyReadiness.publicationBlockers.length > 0,
    `Empty intake produces publication blockers (Count: ${emptyReadiness.publicationBlockers.length})`
  );

  const allHaveRemediation = emptyReadiness.publicationBlockers.every(
    (b) => Boolean(b.remediationAnchor) && Boolean(b.destination)
  );
  assert(
    allHaveRemediation,
    'Every publication blocker includes remediationAnchor and destination payload for guided 1-click navigation'
  );

  console.log(`\n===========================================================`);
  console.log(`CANONICAL & REMEDIATION TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCanonicalRemediationTestSuite();
