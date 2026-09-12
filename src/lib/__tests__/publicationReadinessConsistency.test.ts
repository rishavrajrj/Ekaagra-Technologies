/**
 * ==============================================================================
 * PUBLICATION READINESS & SUBMIT/LOCK CONSISTENCY TEST SUITE
 * File: src/lib/__tests__/publicationReadinessConsistency.test.ts
 *
 * Verifies that the UI (evaluateWebsitePublicationReadiness) and the Server
 * Submit & Lock action (validateServerApprovalPreconditions) consume ONE
 * authoritative validation result, eliminating the "0 Blockers vs 3 Unresolved
 * Blockers" discrepancy while strictly safeguarding publication rules.
 * ==============================================================================
 */

import {
  evaluateWebsitePublicationReadiness,
} from '../websiteDataStatus';
import {
  validateServerApprovalPreconditions,
  generateWebsiteSpecificationSnapshot,
} from '../websiteSpecificationContract';
import type { UniversalIntakeData } from '../types';

function runReadinessConsistencyTestSuite() {
  console.log('🧪 Starting Publication Readiness & Submit/Lock Consistency Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log('PASS: ' + testName);
      passed++;
    } else {
      console.error('FAIL: ' + testName, details || '');
      failed++;
    }
  }

// Sample fully satisfied intake data
  const baseFullIntake: UniversalIntakeData = {
    schoolProfile: {
      schoolName: 'Delhi Public International School',
      shortName: 'DPIS',
      affiliationNumber: 'CBSE/AFF/2024/999123',
      schoolCode: '99123',
      board: 'CBSE',
      foundedYear: '2005',
      managementType: 'Trust',
      schoolType: 'Day School',
      campusCount: 1,
      officialEmail: 'contact@dpis-school.edu.in',
      schoolEmail: 'contact@dpis-school.edu.in',
      officialPhone: '+91 9876543210',
      schoolPhone: '+91 9876543210',
      campusPostalAddress: '123 Knowledge Park, Phase 1',
      campusCity: 'New Delhi',
      campusState: 'Delhi',
      campusPincode: '110001',
      udiseCode: '07010100101',
    } as any,
    branding: {
      logoUrl: 'https://storage.googleapis.com/test-bucket/branding/dpis_logo.png',
      mascotName: 'Eagle',
      primaryColor: '#003366',
      secondaryColor: '#FFCC00',
    } as any,
    brandingDesign: {
      logoUrl: 'https://storage.googleapis.com/test-bucket/branding/dpis_logo.png',
      logo: 'https://storage.googleapis.com/test-bucket/branding/dpis_logo.png',
      hasHighResLogo: true,
      primaryColor: '#003366',
      secondaryColor: '#FFCC00',
    } as any,
    schoolContent: {
      aboutSchool: 'A premier educational institution dedicated to holistic child development with decades of excellence.',
      vision: 'To nurture compassionate, visionary global leaders through innovative education.',
      mission: 'Empowering every student with critical thinking, ethical integrity, and world-class academic skills.',
    } as any,
    leadership: {
      principalName: 'Dr. Anita Sharma',
      principalDesignation: 'Principal',
      principalPhotoUrl: 'https://storage.googleapis.com/test-bucket/leadership/principal.webp',
      principalPhoto: {
        id: 'asset-principal-photo',
        url: 'https://storage.googleapis.com/test-bucket/leadership/principal.webp',
        name: 'principal.webp',
        status: 'verified',
      } as any,
      principalDeskMessage: 'Welcome to Delhi Public International School. We foster holistic learning.',
      principalMessage: 'Welcome to Delhi Public International School.',
      trusteeName: 'Shri R. K. Sharma',
    } as any,
    campuses: [
      {
        id: 'main-campus',
        name: 'Main Campus',
        isMain: true,
        isMainCampus: true,
        address: '123 Knowledge Park, Phase 1',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        contactPhone: '+91 9876543210',
        contactEmail: 'contact@dpis-school.edu.in',
        images: [
          {
            id: 'hero-1',
            category: 'campus_buildings',
            url: 'https://storage.googleapis.com/test-bucket/campuses/main_hero.jpg',
            fileUrl: 'https://storage.googleapis.com/test-bucket/campuses/main_hero.jpg',
            caption: 'Main Campus Building',
          },
        ],
      },
    ] as any,
    facilities: [
      { key: 'physics_lab', name: 'Physics Laboratory', isAvailable: true, description: 'State of the art lab' },
      { key: 'library', name: 'Central Library', isAvailable: true, description: 'Over 15,000 books and journals' },
      { key: 'sports_ground', name: 'Athletic Ground', isAvailable: true, description: 'Multi-sport complex' },
    ] as any,
    institutionStructure: {
      classes: ['Grade 1', 'Grade 2', 'Grade 3'],
    } as any,
    transportConfig: { status: 'no', enabled: false },
    hostelConfig: { status: 'no', isApplicable: false },
    transport: {
      isOperated: false,
    } as any,
    hostel: {
      isAvailable: false,
    } as any,
    usersAccess: {
      superAdminFullName: 'Dr. Anita Sharma',
      superAdminEmail: 'contact@dpis-school.edu.in',
      superAdminPhone: '+91 9876543210',
    } as any,
    clientConfirmation: {
      isConfirmed: true,
      confirmedByName: 'Dr. Anita Sharma',
    } as any,
    assetChecklist: {
      items: [
        {
          id: 'school_logo',
          title: 'Official School Crest / Logo',
          category: 'branding',
          requirement: 'mandatory',
          type: 'image',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/branding/dpis_logo.png',
          fileName: 'dpis_logo.png',
        },
        {
          id: 'principal_photo',
          title: 'Principal Portrait',
          category: 'leadership',
          requirement: 'mandatory',
          type: 'image',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/leadership/principal.webp',
          fileName: 'principal.webp',
        },
        {
          id: 'cert-affiliation',
          title: 'CBSE Affiliation Certificate',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/cbse_affiliation.pdf',
          fileName: 'cbse_affiliation.pdf',
        },
        {
          id: 'cert-recognition',
          title: 'State Government NOC',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/state_noc.pdf',
          fileName: 'state_noc.pdf',
        },
        {
          id: 'cert-safety',
          title: 'Fire Safety Certificate',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/fire_safety.pdf',
          fileName: 'fire_safety.pdf',
        },
        {
          id: 'cert-mandatory-disclosure',
          title: 'Mandatory Public Disclosure (Appendix IX)',
          category: 'compliance',
          requirement: 'mandatory',
          type: 'document',
          status: 'verified',
          fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/appendix_ix.pdf',
          fileName: 'appendix_ix.pdf',
        },
      ],
    } as any,
    statutoryCompliance: {
      affiliationCertificate: {
        fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/cbse_affiliation.pdf',
        fileName: 'cbse_affiliation.pdf',
      },
      recognitionNoc: {
        fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/state_noc.pdf',
        fileName: 'state_noc.pdf',
      },
      fireSafetyCertificate: {
        fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/fire_safety.pdf',
        fileName: 'fire_safety.pdf',
      },
      mandatoryDisclosure: {
        fileUrl: 'https://storage.googleapis.com/test-bucket/compliance/appendix_ix.pdf',
        fileName: 'appendix_ix.pdf',
      },
    } as any,
    finalReview: {
      signoffConfirmed: true,
      approverName: 'Dr. Anita Sharma',
      approverDesignation: 'Principal & Authorized Signatory',
      approvedAt: '2026-09-11T00:00:00.000Z',
    } as any,
  };

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 1: ZERO BLOCKER CONSISTENCY ON FULLY SATISFIED INTAKE
  // ────────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Fully Satisfied Intake: UI vs Submit & Lock Consistency ---');

  const uiResult = evaluateWebsitePublicationReadiness(baseFullIntake);
  const serverResult = validateServerApprovalPreconditions(baseFullIntake);

  assert(uiResult.blockers.length === 0, 'UI reports exactly 0 blockers (got ' + uiResult.blockers.length + ')');
  assert(uiResult.isReady === true, 'UI reports isReady = true');
  assert(uiResult.isReadyForSubmission === true, 'UI reports isReadyForSubmission = true');
  assert(uiResult.websiteReady.length > 0, 'UI reports populated websiteReady components');
  assert(uiResult.readinessScore === 100, 'UI reports 100% readiness score (got ' + uiResult.readinessScore + '%)');

  assert(serverResult.canApprove === true, 'Server Submit & Lock reports canApprove = true');
  assert(serverResult.blockers.length === 0, 'Server reports exactly 0 blockers (got ' + serverResult.blockers.length + ')');
  assert(
    uiResult.blockers.length === serverResult.blockers.length,
    'UI blocker count and Server blocker count are 100% identical (0 === 0)'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 2: MISSING LOGO PROPAGATION TO BOTH UI AND SERVER
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Missing Logo: Strict Detection in Both UI and Server ---');

  const intakeWithoutLogo: UniversalIntakeData = {
    ...baseFullIntake,
    branding: {
      ...baseFullIntake.branding,
      logoUrl: '',
    } as any,
    brandingDesign: {
      ...baseFullIntake.brandingDesign,
      logoUrl: '',
      logo: '',
    } as any,
    assetChecklist: {
      items: (baseFullIntake.assetChecklist?.items || []).filter(
        (item: any) => item.id !== 'school_logo' && !item.category?.includes('branding')
      ),
    } as any,
  };

  const uiResultNoLogo = evaluateWebsitePublicationReadiness(intakeWithoutLogo);
  const serverResultNoLogo = validateServerApprovalPreconditions(intakeWithoutLogo);

  assert(uiResultNoLogo.blockers.length > 0, 'UI catches missing logo as blocker (found ' + uiResultNoLogo.blockers.length + ')');
  assert(
    uiResultNoLogo.blockers.some((b) => b.field === 'brandingDesign.logo' || b.id.includes('logo') || b.key?.includes('logo')),
    'UI has explicit logo blocker'
  );
  assert(serverResultNoLogo.canApprove === false, 'Server Submit & Lock rejects approval without logo');
  assert(
    serverResultNoLogo.blockers.some((b) => b.key.toLowerCase().includes('logo') || b.label.toLowerCase().includes('logo')),
    'Server approval errors contain logo blocker'
  );
  assert(
    uiResultNoLogo.blockers.length === serverResultNoLogo.blockers.length,
    'UI and Server have identical blocker counts for missing logo (' + uiResultNoLogo.blockers.length + ' === ' + serverResultNoLogo.blockers.length + ')'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 3: MISSING STATUTORY DOCUMENTS PROPAGATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Missing Statutory Documents: Strict Alignment ---');

  const intakeMissingDocs: UniversalIntakeData = {
    ...baseFullIntake,
    assetChecklist: {
      items: (baseFullIntake.assetChecklist?.items || []).filter(
        (item: any) => item.id !== 'cert-affiliation' && item.id !== 'cert-safety'
      ),
    } as any,
    statutoryCompliance: {
      ...baseFullIntake.statutoryCompliance,
      affiliationCertificate: null,
      fireSafetyCertificate: null,
    } as any,
  };

  const uiResultMissingDocs = evaluateWebsitePublicationReadiness(intakeMissingDocs);
  const serverResultMissingDocs = validateServerApprovalPreconditions(intakeMissingDocs);

  assert(
    uiResultMissingDocs.blockers.length === 2,
    'UI identifies exactly 2 missing document blockers (got ' + uiResultMissingDocs.blockers.length + ')'
  );
  assert(
    serverResultMissingDocs.blockers.length === 2,
    'Server identifies exactly 2 missing document blockers (got ' + serverResultMissingDocs.blockers.length + ')'
  );
  assert(
    uiResultMissingDocs.blockers.length === serverResultMissingDocs.blockers.length,
    'UI and Server blocker counts match exactly for missing compliance documents'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 4: CONDITIONAL MODULES (TRANSPORT & HOSTEL DISABLED)
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Conditional Modules: Disabled Transport & Hostel Produce 0 Blockers ---');

  const daySchoolWithoutTransport: UniversalIntakeData = {
    ...baseFullIntake,
    transportConfig: { status: 'no', enabled: false },
    hostelConfig: { status: 'no', isApplicable: false },
    transport: {
      isOperated: false,
      routes: [],
      vehicles: [],
      inchargeName: '',
    } as any,
    hostel: {
      isAvailable: false,
      wardenName: '',
      roomCount: 0,
      messDetails: '',
    } as any,
  };

  const daySchoolReadiness = evaluateWebsitePublicationReadiness(daySchoolWithoutTransport);
  const daySchoolApproval = validateServerApprovalPreconditions(daySchoolWithoutTransport);

  assert(daySchoolReadiness.blockers.length === 0, 'Disabled transport and hostel produce 0 blockers in UI');
  assert(daySchoolApproval.canApprove === true, 'Server allows approval when transport and hostel are disabled');
  assert(daySchoolApproval.blockers.length === 0, 'Server produces 0 blockers for disabled optional modules');
  assert(
    daySchoolReadiness.notApplicable.some((na) => na.id?.includes('transport') || na.label?.toLowerCase().includes('transport') || na.section?.includes('transport')),
    'Transport is listed under notApplicable'
  );
  assert(
    daySchoolReadiness.notApplicable.some((na) => na.id?.includes('hostel') || na.label?.toLowerCase().includes('hostel') || na.section?.includes('hostel')),
    'Hostel is listed under notApplicable'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 5: CROSS-SECTION CONFLICT PROPAGATION
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Cross-Section Consistency: Conflicts Elevated to Blockers ---');

  const conflictingIntake: UniversalIntakeData = {
    ...baseFullIntake,
    schoolProfile: {
      ...baseFullIntake.schoolProfile,
      schoolType: 'Day School',
      campusCount: 1,
    } as any,
    campuses: [
      { id: 'c1', name: 'Campus 1', isMain: true, isMainCampus: true, address: 'A', city: 'B', images: [{ id: 'i1', url: 'https://a.com/1.jpg' }] },
      { id: 'c2', name: 'Campus 2', isMain: false, address: 'C', city: 'D', images: [{ id: 'i2', url: 'https://a.com/2.jpg' }] },
      { id: 'c3', name: 'Campus 3', isMain: false, address: 'E', city: 'F', images: [{ id: 'i3', url: 'https://a.com/3.jpg' }] },
    ] as any,
    hostel: {
      isAvailable: true,
      capacity: 250,
      wardenName: 'Mr. John',
    } as any,
  };

  const conflictReadiness = evaluateWebsitePublicationReadiness(conflictingIntake);
  const conflictApproval = validateServerApprovalPreconditions(conflictingIntake);

  assert(conflictReadiness.conflicts.length > 0, 'Conflicts detected: ' + conflictReadiness.conflicts.length);
  assert(conflictReadiness.blockers.length > 0, 'Conflicts elevated to blockers in UI: ' + conflictReadiness.blockers.length);
  assert(conflictApproval.canApprove === false, 'Server Submit & Lock correctly rejects conflicting intake data');
  assert(
    conflictReadiness.blockers.length === conflictApproval.blockers.length,
    'UI and Server have identical blocker count for cross-section conflicts (' + conflictReadiness.blockers.length + ' === ' + conflictApproval.blockers.length + ')'
  );

  // ────────────────────────────────────────────────────────────────────────────
  // TEST 6: REMEDIATION ANCHORS AND METADATA TRACEABILITY
  // ────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Remediation Anchors & Structured Diagnostics ---');

  const incompleteIntake: UniversalIntakeData = {
    ...baseFullIntake,
    leadership: {
      ...baseFullIntake.leadership,
      principalName: '',
      principalPhoto: null,
      principalPhotoUrl: '',
    } as any,
    assetChecklist: {
      items: (baseFullIntake.assetChecklist?.items || []).filter(
        (item: any) => item.id !== 'principal_photo' && !item.category?.includes('leadership')
      ),
    } as any,
  };

  const diagResult = evaluateWebsitePublicationReadiness(incompleteIntake);
  const principalNameBlocker = diagResult.blockers.find((b) => b.field === 'leadership.principalName' || b.key?.includes('principal_name') || b.id.includes('principal-name'));
  const principalPhotoBlocker = diagResult.blockers.find((b) => b.field === 'leadership.principalPhoto' || b.key?.includes('principal_portrait') || b.id.includes('principal-photo'));

  assert(!!principalNameBlocker, 'Identified principalName blocker');
  assert(principalNameBlocker?.remediationAnchor === 'field-principal-name' || principalNameBlocker?.anchor?.includes('principal'), 'principalName has valid target anchor');

  assert(!!principalPhotoBlocker, 'Identified principalPhoto blocker');
  assert(principalPhotoBlocker?.remediationAnchor === 'field-principal-photo' || principalPhotoBlocker?.anchor?.includes('principal'), 'principalPhoto has valid target anchor');

  // Summary
  console.log('\n===========================================================');
  console.log('PUBLICATION READINESS CONSISTENCY TEST RESULTS: ' + passed + ' PASSED, ' + failed + ' FAILED');
  console.log('===========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runReadinessConsistencyTestSuite();
