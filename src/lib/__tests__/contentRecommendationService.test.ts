/**
 * ==============================================================================
 * CONTENT RECOMMENDATION SERVICE UNIT TEST SUITE
 * File: src/lib/__tests__/contentRecommendationService.test.ts
 * ==============================================================================
 */

import {
  CONTENT_RECOMMENDATION_CONFIGS,
  isRecommendationEligible,
  getContentRecommendationConfig,
  generateContentRecommendation,
  calculateContentSourceFingerprint,
} from '../contentRecommendationService';
import type { SchoolIntakeData } from '../types';

function runRecommendationTestSuite() {
  console.log('🧪 Starting AI Content Recommendation Service Unit Tests...\n');

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

  // Sample Baseline School Intake Data
  const mockSchoolIntake: Partial<SchoolIntakeData> = {
    schoolProfile: {
      schoolName: 'Delhi Public Academy',
      shortName: 'DPA',
      affiliationNumber: 'CBSE/AFF/2026/9981',
      boardAffiliation: 'CBSE',
      yearEstablished: 2004,
      schoolType: 'Day School',
      city: 'Jaipur',
      state: 'Rajasthan',
      country: 'India',
      officialPhone: '+91 141 2233445',
      officialEmail: 'info@dpa-jaipur.edu.in',
      preferredPublicUrl: 'https://dpa-jaipur.edu.in',
    } as any,
    campuses: [
      {
        id: 'campus-main',
        name: 'Main Heritage Campus',
        address: 'Plot 12, Vidhyadhar Nagar',
        city: 'Jaipur',
        state: 'Rajasthan',
        pin: '302039',
        contactPhone: '+91 141 2233445',
        facilities: [
          'smart_classrooms',
          'computer_lab',
          'science_lab',
          'library',
          'sports',
          'auditorium',
          'medical_room',
          'cafeteria',
          'cctv_security',
        ],
        isMainCampus: true,
      },
    ] as any,
    facilitiesConfig: {
      hasSmartClassrooms: true,
      smartClassroomCount: 24,
      hasComputerLab: true,
      computerLabCount: 2,
      totalComputers: 60,
      hasScienceLabs: true,
      scienceLabs: ['Physics', 'Chemistry', 'Biology'],
      hasLibrary: true,
      libraryBookCount: 12500,
      hasAuditorium: true,
      auditoriumSeatingCapacity: 650,
      hasCafeteria: true,
      sportsFacilities: ['Cricket', 'Basketball', 'Football', 'Badminton'],
    } as any,
    brandingDesign: {
      brandTone: 'Modern & Inspiring',
      taglineOrMotto: 'Empowering Minds, Inspiring Character',
      coreValues: ['Integrity', 'Excellence', 'Innovation', 'Empathy'],
    } as any,
    schoolContent: {
      aboutSchool: 'A leading progressive institution founded in 2004 dedicated to holistic excellence.',
      vision: 'To foster visionary leaders grounded in human values and scientific rigor.',
      mission: 'Nurturing curiosity, ethical leadership, and academic rigor in a modern environment.',
      coreValues: ['Integrity', 'Excellence', 'Innovation', 'Empathy'],
      educationalPhilosophy: 'Experiential and student-centered learning with global perspective.',
      teachingMethodology: 'Inquiry-based learning combined with project-driven exploration.',
      awardsAndAchievements: ['Best Green Campus 2024', 'State STEM Excellence Award 2025'],
    } as any,
    leadership: {
      principalName: 'Dr. Sunita Sharma',
      principalDesignation: 'Principal & Director Academics',
      principalQualification: 'Ph.D. in Educational Leadership, M.Sc., B.Ed.',
      principalMessage: '',
      managementMembers: [
        { name: 'Shri R. K. Agarwal', designation: 'Chairman' },
        { name: 'Dr. Anita Mehra', designation: 'Trustee Secretary' },
      ],
    } as any,
    facultyStaff: {
      totalTeachingStaff: 58,
      totalNonTeachingStaff: 22,
      studentTeacherRatio: '18:1',
      averageTeachingExperienceYears: 9,
      postGraduateFacultyCount: 42,
    } as any,
    admissions: {
      academicYear: '2026-2027',
      admissionStatus: 'Open',
      startDate: '2026-10-01',
      endDate: '2027-02-28',
      eligibilitySummary: 'Nursery: 3+ years as on March 31. Grade 1: 6+ years as on March 31.',
      selectionProcess: 'Merit-based interaction and holistic assessment.',
      requiredDocuments: ['Birth Certificate', 'Transfer Certificate', 'Previous Marksheet', 'Aadhaar Card'],
    } as any,
  };

  // ───────────────────────────────────────────────────────────────────────────
  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 1: CONFIGURATION & ELIGIBILITY AUDIT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Field Configuration & Eligibility Registry ---');

  assert(
    Object.keys(CONTENT_RECOMMENDATION_CONFIGS).length >= 14,
    'Configured at least 14 distinct recommendation-eligible checklist fields'
  );

  assert(
    isRecommendationEligible('acad-facilities-desc'),
    'acad-facilities-desc is marked recommendation eligible'
  );
  assert(
    isRecommendationEligible('lead-faculty-highlights'),
    'lead-faculty-highlights is marked recommendation eligible'
  );
  assert(
    isRecommendationEligible('pol-terms'),
    'pol-terms is marked recommendation eligible (policy template)'
  );

  // Statutory Non-Replacement Guardrail
  assert(
    !isRecommendationEligible('cert-affiliation'),
    'GUARDRAIL: Statutory cert-affiliation is NOT recommendation eligible (Upload only)'
  );
  assert(
    !isRecommendationEligible('cert-safety'),
    'GUARDRAIL: Statutory cert-safety is NOT recommendation eligible (Upload only)'
  );
  assert(
    !isRecommendationEligible('adm-fee-circular'),
    'GUARDRAIL: Statutory adm-fee-circular is NOT recommendation eligible (Upload only)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: ZERO-FABRICATION FACTUAL SYNTHESIS (FACILITIES COPY)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Zero-Fabrication Facilities Copy Synthesis ---');

  const facilitiesRec = generateContentRecommendation({
    fieldKey: 'acad-facilities-desc',
    intakeData: mockSchoolIntake,
  });

  assert(
    Boolean(facilitiesRec.generatedText) && !facilitiesRec.isInsufficientData,
    'Facilities recommendation generates text when intake data contains campus & facilities'
  );
  assert(
    facilitiesRec.generatedText.includes('Delhi Public Academy') || facilitiesRec.generatedText.includes('Main Heritage Campus'),
    'Facilities recommendation accurately references school and campus name'
  );
  assert(
    facilitiesRec.generatedText.includes('24') && facilitiesRec.generatedText.includes('smart classroom'),
    'Facilities recommendation includes exact smart classroom count without hallucination'
  );
  assert(
    facilitiesRec.generatedText.includes('12,500') || facilitiesRec.generatedText.includes('12500'),
    'Facilities recommendation includes exact verified library collection count'
  );
  assert(
    facilitiesRec.generatedText.includes('Physics') && facilitiesRec.generatedText.includes('Chemistry'),
    'Facilities recommendation includes configured specialized science labs'
  );
  assert(
    facilitiesRec.sourceLabels.length >= 2,
    'Facilities recommendation provides explicit source citations (Campuses, Facilities Config)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: ADMISSIONS & ELIGIBILITY SYNTHESIS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Admissions & Eligibility Criteria Synthesis ---');

  const admRec = generateContentRecommendation({
    fieldKey: 'adm-process',
    intakeData: mockSchoolIntake,
  });

  assert(
    Boolean(admRec.generatedText) && !admRec.isInsufficientData,
    'Admissions process recommendation generates text'
  );
  assert(
    admRec.generatedText.includes('2026-2027') || admRec.generatedText.includes('Delhi Public Academy'),
    'Admissions recommendation includes academic session or institution name'
  );
  assert(
    admRec.generatedText.includes('Birth Certificate') || admRec.generatedText.includes('Nursery') || admRec.generatedText.includes('Admission'),
    'Admissions recommendation integrates actual admissions details'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: FACULTY & ACADEMIC HIGHLIGHTS SYNTHESIS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Faculty & Academic Highlights Synthesis ---');

  const facultyRec = generateContentRecommendation({
    fieldKey: 'lead-faculty-highlights',
    intakeData: mockSchoolIntake,
  });

  assert(
    Boolean(facultyRec.generatedText) && !facultyRec.isInsufficientData,
    'Faculty highlights recommendation is generated'
  );
  assert(
    facultyRec.generatedText.includes('58') && facultyRec.generatedText.includes('18:1'),
    'Faculty recommendation incorporates exact faculty count (58) and student-teacher ratio (18:1)'
  );
  assert(
    facultyRec.generatedText.includes('9') && facultyRec.generatedText.includes('years'),
    'Faculty recommendation includes exact average teaching experience'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: LEADERSHIP & PRINCIPAL'S DESK
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Leadership / Principal Desk Recommendation ---');

  const principalRec = generateContentRecommendation({
    fieldKey: 'lead-principal-msg',
    intakeData: mockSchoolIntake,
  });

  assert(
    Boolean(principalRec.generatedText) && !principalRec.isInsufficientData,
    'Principal desk recommendation is generated'
  );
  assert(
    principalRec.generatedText.includes('Dr. Sunita Sharma'),
    'Principal recommendation uses designated Principal name'
  );
  assert(
    principalRec.generatedText.includes('Delhi Public Academy') || principalRec.generatedText.includes('Ph.D.'),
    'Principal recommendation cites school name or qualifications'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: POLICY TEMPLATES & SAFEGUARD LABELS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Policy Templates & Review Safeguards ---');

  const policyTermsRec = generateContentRecommendation({
    fieldKey: 'pol-terms',
    intakeData: mockSchoolIntake,
  });

  assert(
    Boolean(policyTermsRec.generatedText) && !policyTermsRec.isInsufficientData,
    'Terms of service template is generated'
  );
  assert(
    policyTermsRec.requiresReview === true,
    'Terms policy is strictly flagged requiresReview = true'
  );
  assert(
    policyTermsRec.isTemplate === true,
    'Policy template is explicitly marked isTemplate = true'
  );

  const childSafetyRec = generateContentRecommendation({
    fieldKey: 'pol-child-safety',
    intakeData: mockSchoolIntake,
  });
  assert(
    childSafetyRec.requiresReview === true,
    'Child safety policy strictly requires manual school review before launch'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 7: TONE & LENGTH ADAPTATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing Tone & Length Adaptation ---');

  const professionalDraft = generateContentRecommendation({
    fieldKey: 'acad-facilities-desc',
    intakeData: mockSchoolIntake,
    tone: 'Professional',
    length: 'standard',
  });
  const warmDraft = generateContentRecommendation({
    fieldKey: 'acad-facilities-desc',
    intakeData: mockSchoolIntake,
    tone: 'Warm & Parent-Friendly',
    length: 'standard',
  });
  const conciseDraft = generateContentRecommendation({
    fieldKey: 'acad-facilities-desc',
    intakeData: mockSchoolIntake,
    tone: 'Concise',
    length: 'short',
  });

  assert(
    professionalDraft.generatedText !== warmDraft.generatedText,
    'Warm tone generates distinct, personalized phrasing from Professional tone'
  );
  assert(
    conciseDraft.generatedText.length < professionalDraft.generatedText.length,
    'Concise / Short length is significantly more compact than standard professional draft'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 8: SOURCE FINGERPRINTING & CHANGE DETECTION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Testing Source Fingerprinting & Outdated Detection ---');

  const initialFingerprint = calculateContentSourceFingerprint('acad-facilities-desc', mockSchoolIntake);

  assert(
    Boolean(initialFingerprint) && initialFingerprint.length > 5,
    'Source fingerprint is deterministically generated'
  );

  // Same intake produces identical fingerprint
  const repeatFingerprint = calculateContentSourceFingerprint('acad-facilities-desc', mockSchoolIntake);
  assert(
    initialFingerprint === repeatFingerprint,
    'Deterministic fingerprinting is stable across identical intake states'
  );

  // Modifying upstream facility data alters the fingerprint
  const modifiedIntake: Partial<SchoolIntakeData> = {
    ...mockSchoolIntake,
    facilitiesConfig: {
      ...mockSchoolIntake.facilitiesConfig,
      smartClassroomCount: 30, // Changed from 24 to 30
    } as any,
  };

  const modifiedFingerprint = calculateContentSourceFingerprint('acad-facilities-desc', modifiedIntake);
  assert(
    initialFingerprint !== modifiedFingerprint,
    'Fingerprint changes when upstream source facts (smartClassroomCount) are modified'
  );

  // Modifying unrelated fields (e.g. principal qualification) does NOT affect facilities fingerprint
  const unrelatedIntake: Partial<SchoolIntakeData> = {
    ...mockSchoolIntake,
    leadership: {
      ...mockSchoolIntake.leadership,
      principalQualification: 'Ph.D., D.Litt.',
    } as any,
  };
  const unaffectedFingerprint = calculateContentSourceFingerprint('acad-facilities-desc', unrelatedIntake);
  assert(
    initialFingerprint === unaffectedFingerprint,
    'Facilities fingerprint ignores changes to unrelated upstream domains (Rule 26 data minimization)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 9: INSUFFICIENT DATA HANDLING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Testing Insufficient Data Handling ---');

  const emptyIntake: Partial<SchoolIntakeData> = {
    schoolProfile: { schoolName: 'New Horizon' } as any,
    campuses: [],
    facilitiesConfig: {} as any,
  };

  const insufficientRec = generateContentRecommendation({
    fieldKey: 'acad-facilities-desc',
    intakeData: emptyIntake,
  });

  assert(
    insufficientRec.isInsufficientData === true || (Array.isArray(insufficientRec.missingInputs) && insufficientRec.missingInputs.length > 0),
    'Returns isInsufficientData = true or provides missingInputs when critical upstream data is missing'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log(`\n===========================================================`);
  console.log(`RECOMMENDATION SERVICE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRecommendationTestSuite();
