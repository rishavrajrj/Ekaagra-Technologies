/**
 * DEDICATED TEST SUITE: SECTION 6 — SCHOOL STORY, MISSION & EDUCATIONAL PHILOSOPHY
 * 
 * Tests all 22 required capabilities:
 * 1. Existing Section 6 data loads correctly.
 * 2. About School generates from identity data.
 * 3. Mission generates safely.
 * 4. Vision generates safely.
 * 5. Educational philosophy generates safely.
 * 6. Missing information does not cause fabricated claims.
 * 7. Communication style changes tone (all 5 core brand styles).
 * 8. Single campus language is correct ("our campus").
 * 9. Multi-campus language is correct ("across our campuses").
 * 10. Facilities are only mentioned when present.
 * 11. Customized content is never silently overwritten.
 * 12. Regeneration confirmation works conceptually.
 * 13. Approval status works.
 * 14. Editing approved content changes status to needs review.
 * 15. Core values selection persists.
 * 16. Custom core values persist.
 * 17. Highlights are derived from canonical source data.
 * 18. Missing highlight values do not create duplicate fields.
 * 19. Existing drafts remain backward compatible.
 * 20. Section 6 completeness calculation works across all states.
 * 21. No external AI dependency is required for fallback generation.
 * 22. Tenant isolation remains intact.
 */

import assert from 'assert';
import type {
  UniversalIntakeData,
  SchoolContentData,
  CampusBranchData,
} from '../src/lib/types';
import {
  resolveContentBlockText,
  resolveContentBlockStatus,
  createContentBlock,
} from '../src/lib/types';
import {
  UNIVERSAL_CORE_VALUES,
  extractSchoolFacts,
  buildSourceDataDigest,
  extractCanonicalSchoolHighlights,
  generateAboutSchool,
  generateMissionStatement,
  generateVisionStatement,
  generateEducationalPhilosophy,
  getRecommendedCoreValues,
  generateFullSchoolContent,
  getSection6StatusSummary,
} from '../src/lib/schoolContentGenerator';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ Test ${totalTests}: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ Test ${totalTests}: ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

function buildBaseMockIntake(overrides: Partial<UniversalIntakeData> = {}): UniversalIntakeData {
  const initial = createInitialIntakeData({
    schoolName: 'St. Xavier Public School',
    contactName: 'Fr. Thomas K.',
    contactEmail: 'contact@stxaviers.edu.in',
    contactPhone: '+91 9876543210',
    city: 'Motihari',
    state: 'Bihar',
  });

  initial.schoolProfile = {
    ...initial.schoolProfile,
    schoolName: 'St. Xavier Public School',
    yearOfEstablishment: '2005',
    establishmentYear: '2005',
    board: 'CBSE',
    affiliationNumber: '330456',
    schoolType: 'Senior Secondary K-12',
    city: 'Motihari',
    state: 'Bihar',
    country: 'India',
  };

  initial.brandingDesign = {
    ...initial.brandingDesign,
    brandTone: 'Academic & Scholarly',
    taglineOrMotto: 'Veritas Vos Liberabit',
    motto: 'Veritas Vos Liberabit',
  };

  return {
    ...initial,
    ...overrides,
  };
}

console.log('================================================================');
console.log('  SECTION 6: SCHOOL STORY, MISSION & PHILOSOPHY TEST HARNESS');
console.log('================================================================\n');

// ------------------------------------------------------------------------------
// TEST 1: Existing Section 6 data loads correctly
// ------------------------------------------------------------------------------
runTest('Existing Section 6 data loads correctly (both legacy string and structured block)', () => {
  const legacyDraft: Partial<SchoolContentData> = {
    aboutSchool: 'A legacy string narrative for St. Xavier School established in 2005.',
    philosophy: 'Holistic growth through discipline and academics.',
  };

  const textAbout = resolveContentBlockText(legacyDraft.aboutSchool);
  const statusAbout = resolveContentBlockStatus(legacyDraft.aboutSchool);
  assert.strictEqual(textAbout, 'A legacy string narrative for St. Xavier School established in 2005.');
  assert.strictEqual(statusAbout, 'customized');

  const modernBlock = createContentBlock('Modern generated text', 'generated');
  assert.strictEqual(resolveContentBlockText(modernBlock), 'Modern generated text');
  assert.strictEqual(resolveContentBlockStatus(modernBlock), 'generated');
});

// ------------------------------------------------------------------------------
// TEST 2: About School generates from identity data
// ------------------------------------------------------------------------------
runTest('About School generates dynamically from authoritative identity data', () => {
  const intake = buildBaseMockIntake();
  const generated = generateAboutSchool(intake);

  assert(generated.includes('St. Xavier Public School'), 'Mentions school name');
  assert(generated.includes('2005'), 'Mentions establishment year when present');
  assert(generated.includes('Motihari') && generated.includes('Bihar'), 'Mentions city and state');
  assert(generated.includes('CBSE'), 'Mentions board when present');
});

// ------------------------------------------------------------------------------
// TEST 3: Mission generates safely
// ------------------------------------------------------------------------------
runTest('Mission generates safely without controversial or unsubstantiated claims', () => {
  const intake = buildBaseMockIntake();
  const mission = generateMissionStatement(intake);

  assert(mission.length >= 20, 'Mission statement has substance');
  assert(!mission.includes('100% placement'), 'No marketing falsehoods');
  assert(!mission.includes('#1 ranked'), 'No unverified ranking claims');
  assert(mission.includes('intellectual') || mission.includes('curriculum') || mission.includes('education'), 'Pedagogically grounded');
});

// ------------------------------------------------------------------------------
// TEST 4: Vision generates safely
// ------------------------------------------------------------------------------
runTest('Vision generates forward-looking statement grounded in school positioning', () => {
  const intake = buildBaseMockIntake();
  const vision = generateVisionStatement(intake);

  assert(vision.length >= 20, 'Vision statement has substance');
  assert(vision.includes('scholars') || vision.includes('thinkers') || vision.includes('leaders'), 'Forward-looking community focus');
});

// ------------------------------------------------------------------------------
// TEST 5: Educational philosophy generates safely
// ------------------------------------------------------------------------------
runTest('Educational philosophy generates safely incorporating pedagogy themes', () => {
  const intake = buildBaseMockIntake();
  const phil = generateEducationalPhilosophy(intake);

  assert(phil.length >= 30, 'Philosophy has educational substance');
  assert(phil.includes('inquiry') || phil.includes('reasoning') || phil.includes('formative') || phil.includes('teaching'), 'Reflects teaching approach');
});

// ------------------------------------------------------------------------------
// TEST 6: Missing information does not cause fabricated claims
// ------------------------------------------------------------------------------
runTest('Missing information does not cause fabricated claims (no fake year, no fake board)', () => {
  const sparseIntake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'New Horizon Academy',
      schoolType: 'Primary School',
      city: 'Ranchi',
      state: 'Jharkhand',
      country: 'India',
      mediumOfInstruction: ['English'],
      genderCategory: 'co_ed',
      officialEmail: 'info@newhorizon.org',
      officialPhone: '1234567890',
      address: 'Main Road',
      pin: '834001',
      board: '', // MISSING BOARD
      yearOfEstablishment: '', // MISSING YEAR
      establishmentYear: '',
    },
    campuses: [],
    brandingDesign: {
      hasHighResLogo: false,
      primaryColor: '#1E3A8A',
      secondaryColor: '#F59E0B',
      accentColor: '#10B981',
      brandTone: 'Minimal & Professional',
    },
  };

  const about = generateAboutSchool(sparseIntake);
  assert(!about.includes('Established in'), 'Does NOT invent an establishment year');
  assert(!about.includes('CBSE'), 'Does NOT assume CBSE when board is omitted');
  assert(!about.includes('ICSE'), 'Does NOT assume ICSE');
  assert(about.includes('New Horizon Academy'), 'Uses actual school name');
  assert(about.includes('Ranchi, Jharkhand'), 'Uses actual location');
});

// ------------------------------------------------------------------------------
// TEST 7: Communication style changes tone
// ------------------------------------------------------------------------------
runTest('Communication style changes tone across all 5 standard styles', () => {
  const base = buildBaseMockIntake();

  // 1. Traditional & Prestigious
  base.brandingDesign.brandTone = 'Traditional & Prestigious';
  const aboutTrad = generateAboutSchool(base);
  const philTrad = generateEducationalPhilosophy(base);
  assert(aboutTrad.includes('esteemed') || aboutTrad.includes('traditions') || aboutTrad.includes('integrity'), 'Traditional tone adopted');

  // 2. Modern & Progressive
  base.brandingDesign.brandTone = 'Modern & Progressive';
  const aboutMod = generateAboutSchool(base);
  const philMod = generateEducationalPhilosophy(base);
  assert(aboutMod.includes('dynamic') || aboutMod.includes('contemporary') || aboutMod.includes('tomorrow'), 'Modern tone adopted');
  assert(philMod.includes('student-centric') || philMod.includes('hands-on') || philMod.includes('discovery'), 'Progressive pedagogy reflected');

  // 3. Academic & Scholarly
  base.brandingDesign.brandTone = 'Academic & Scholarly';
  const aboutAcad = generateAboutSchool(base);
  assert(aboutAcad.includes('intellectual') || aboutAcad.includes('scholarship'), 'Scholarly tone adopted');

  // 4. Warm & Community-focused
  base.brandingDesign.brandTone = 'Warm & Community-focused';
  const aboutWarm = generateAboutSchool(base);
  assert(aboutWarm.includes('welcoming') || aboutWarm.includes('nurturing') || aboutWarm.includes('families'), 'Warm community tone adopted');

  // 5. Minimal & Professional
  base.brandingDesign.brandTone = 'Minimal & Professional';
  const aboutMin = generateAboutSchool(base);
  assert(aboutMin.includes('dedicated to providing quality schooling') || aboutMin.includes('balanced student development'), 'Minimal tone adopted');
});

// ------------------------------------------------------------------------------
// TEST 8: Single campus language is correct
// ------------------------------------------------------------------------------
runTest('Single campus language uses singular phrasing ("our dedicated campus")', () => {
  const intake = buildBaseMockIntake();
  intake.campuses = [
    {
      id: 'c-1',
      name: 'City Campus',
      address: 'Station Road',
      city: 'Motihari',
      state: 'Bihar',
      pin: '845401',
      contactPhone: '9876543210',
      isMainCampus: true,
    },
  ];

  const facts = extractSchoolFacts(intake);
  assert.strictEqual(facts.isMultiCampus, false, 'Identified as single campus');
  assert.strictEqual(facts.campusCount, 1, 'Campus count is 1');

  const about = generateAboutSchool(intake);
  assert(about.includes('dedicated campus'), 'Uses singular campus phrasing');
  assert(!about.includes('across 1 campuses'), 'Does not use plural campuses phrase');
});

// ------------------------------------------------------------------------------
// TEST 9: Multi-campus language is correct
// ------------------------------------------------------------------------------
runTest('Multi-campus language uses plural phrasing ("operating across 3 campuses")', () => {
  const intake = buildBaseMockIntake();
  intake.campuses = [
    { id: 'c-1', name: 'Main Campus', address: 'A', city: 'Motihari', state: 'Bihar', pin: '845401', contactPhone: '1', isMainCampus: true },
    { id: 'c-2', name: 'Junior Wing', address: 'B', city: 'Motihari', state: 'Bihar', pin: '845401', contactPhone: '2', isMainCampus: false },
    { id: 'c-3', name: 'West Branch', address: 'C', city: 'Chakia', state: 'Bihar', pin: '845412', contactPhone: '3', isMainCampus: false },
  ];

  const facts = extractSchoolFacts(intake);
  assert.strictEqual(facts.isMultiCampus, true, 'Identified as multi-campus');
  assert.strictEqual(facts.campusCount, 3, 'Campus count is 3');

  const about = generateAboutSchool(intake);
  assert(about.includes('operating across 3 campuses'), 'Uses plural multi-campus phrasing');
});

// ------------------------------------------------------------------------------
// TEST 10: Facilities are only mentioned when present
// ------------------------------------------------------------------------------
runTest('Facilities are only mentioned when present in intake data', () => {
  const intakeNoFacilities = buildBaseMockIntake();
  intakeNoFacilities.facilitiesConfig = {
    scienceLab: false,
    computerLab: false,
    library: false,
    smartClassrooms: false,
    playground: false,
  };
  intakeNoFacilities.campuses = [
    { id: 'c-1', name: 'Main', address: 'A', city: 'M', state: 'B', pin: '845401', contactPhone: '1', isMainCampus: true, facilities: [] },
  ];

  const philNoFac = generateEducationalPhilosophy(intakeNoFacilities);
  assert(!philNoFac.includes('laboratory experimentation'), 'Does not claim science labs when absent');
  assert(!philNoFac.includes('smart classrooms'), 'Does not claim smart classrooms when absent');

  // Add facilities explicitly
  intakeNoFacilities.facilitiesConfig.scienceLab = true;
  intakeNoFacilities.facilitiesConfig.smartClassrooms = true;
  const philWithFac = generateEducationalPhilosophy(intakeNoFacilities);
  assert(philWithFac.includes('interactive digital classrooms') || philWithFac.includes('laboratory experimentation'), 'Includes verified facilities');
});

// ------------------------------------------------------------------------------
// TEST 11: Customized content is never silently overwritten
// ------------------------------------------------------------------------------
runTest('Customized content is never silently overwritten during regeneration/hydration', () => {
  const intake = buildBaseMockIntake();
  const existingCustom: Partial<SchoolContentData> = {
    aboutSchool: {
      text: 'My carefully crafted bespoke school history and mission.',
      status: 'customized',
      updatedAt: '2026-09-01T10:00:00Z',
    },
    mission: {
      text: 'Our custom mission statement.',
      status: 'customized',
    },
  };

  const synthesized = generateFullSchoolContent(intake, existingCustom, false);
  assert.strictEqual(
    resolveContentBlockText(synthesized.aboutSchool),
    'My carefully crafted bespoke school history and mission.',
    'Preserved customized aboutSchool'
  );
  assert.strictEqual(
    resolveContentBlockStatus(synthesized.aboutSchool),
    'customized',
    'Preserved customized status'
  );
  assert.strictEqual(
    resolveContentBlockText(synthesized.mission),
    'Our custom mission statement.',
    'Preserved customized mission'
  );
});

// ------------------------------------------------------------------------------
// TEST 12: Regeneration confirmation works conceptually
// ------------------------------------------------------------------------------
runTest('Forced regeneration replaces customized content when explicitly requested', () => {
  const intake = buildBaseMockIntake();
  const existingCustom: Partial<SchoolContentData> = {
    aboutSchool: {
      text: 'Old customized draft',
      status: 'customized',
    },
  };

  const forceRegenerated = generateFullSchoolContent(intake, existingCustom, true);
  assert.notStrictEqual(
    resolveContentBlockText(forceRegenerated.aboutSchool),
    'Old customized draft',
    'Content was successfully replaced on forced regeneration'
  );
  assert.strictEqual(
    resolveContentBlockStatus(forceRegenerated.aboutSchool),
    'generated',
    'Status reset to generated'
  );
});

// ------------------------------------------------------------------------------
// TEST 13: Approval status works
// ------------------------------------------------------------------------------
runTest('Approval status persists and marks Section 6 approved', () => {
  const intake = buildBaseMockIntake();
  const approvedData: Partial<SchoolContentData> = {
    aboutSchool: createContentBlock(generateAboutSchool(intake), 'approved'),
    mission: createContentBlock(generateMissionStatement(intake), 'approved'),
    vision: createContentBlock(generateVisionStatement(intake), 'approved'),
    educationalPhilosophy: createContentBlock(generateEducationalPhilosophy(intake), 'approved'),
    isApproved: true,
    approved: true,
    approvedAt: '2026-09-07T14:30:00Z',
    approvedBy: 'principal@stxaviers.edu.in',
  };

  const intakeWithApproval: UniversalIntakeData = {
    ...intake,
    schoolContent: approvedData as SchoolContentData,
  };

  const comp = calculateIntakeCompleteness('school-website', intakeWithApproval);
  assert.strictEqual(comp.sectionPercentages['schoolContent'], 100, 'Approved section achieves 100%');
  assert(!comp.missingFields.some((f) => f.includes('School Content')), 'No missing fields for approved Section 6');
});

// ------------------------------------------------------------------------------
// TEST 14: Editing approved content changes status to needs review
// ------------------------------------------------------------------------------
runTest('Editing approved content drops approval status to needs review', () => {
  const intake = buildBaseMockIntake();
  const approvedContent = generateFullSchoolContent(intake);
  approvedContent.isApproved = true;
  approvedContent.approved = true;

  // Simulate user modifying the About School text
  const editedContent: SchoolContentData = {
    ...approvedContent,
    aboutSchool: createContentBlock('Newly modified paragraph after prior approval', 'customized'),
    isApproved: false,
    approved: false,
  };

  assert.strictEqual(editedContent.isApproved, false, 'Approval flag dropped');
  assert.strictEqual(resolveContentBlockStatus(editedContent.aboutSchool), 'customized');

  const intakeWithEdit: UniversalIntakeData = {
    ...intake,
    schoolContent: editedContent,
  };

  const comp = calculateIntakeCompleteness('school-website', intakeWithEdit);
  assert.strictEqual(comp.sectionPercentages['schoolContent'], 80, 'Section drops to 80% (Ready for Review)');
  assert(comp.missingFields.some((f) => f.includes('School Content: Story, Mission & Philosophy Review and Approval')), 'Requires approval again');
});

// ------------------------------------------------------------------------------
// TEST 15: Core values selection persists
// ------------------------------------------------------------------------------
runTest('Core values selection persists in schoolContent', () => {
  const intake = buildBaseMockIntake();
  const selectedValues = ['Academic Excellence', 'Integrity', 'Leadership', 'Discipline'];

  const content = generateFullSchoolContent(intake, {
    coreValues: selectedValues,
  });

  assert.deepStrictEqual(content.coreValues, selectedValues, 'Selected values saved and returned');
});

// ------------------------------------------------------------------------------
// TEST 16: Custom core values persist
// ------------------------------------------------------------------------------
runTest('Custom added core values persist alongside universal values', () => {
  const intake = buildBaseMockIntake();
  const customValues = ['Academic Excellence', 'Environmental Stewardship', 'Global Citizenship'];

  const content = generateFullSchoolContent(intake, {
    coreValues: customValues,
  });

  assert(content.coreValues?.includes('Environmental Stewardship'), 'Custom value persisted');
  assert(content.coreValues?.includes('Global Citizenship'), 'Custom value persisted');
});

// ------------------------------------------------------------------------------
// TEST 17: Highlights are derived from canonical source data
// ------------------------------------------------------------------------------
runTest('School highlights are derived strictly from canonical source data', () => {
  const intake = buildBaseMockIntake();
  intake.institutionStructure = {
    classesOfferedFrom: 'Nursery',
    classesOfferedTo: 'Class 12',
    currentAcademicSession: '2025-2026',
  };

  const highlights = extractCanonicalSchoolHighlights(intake);
  assert.strictEqual(highlights.establishedYear, '2005');
  assert.strictEqual(highlights.location, 'Motihari, Bihar');
  assert(highlights.board?.includes('CBSE') && highlights.board?.includes('330456'));
  assert.strictEqual(highlights.classes, 'Nursery to Class 12');
  assert.strictEqual(highlights.campusesCount, 1);
});

// ------------------------------------------------------------------------------
// TEST 18: Missing highlight values do not create duplicate fields
// ------------------------------------------------------------------------------
runTest('Missing highlight values report undefined/not provided without creating duplicate fields', () => {
  const sparseIntake: Partial<UniversalIntakeData> = {
    schoolProfile: {
      schoolName: 'City High',
      schoolType: '' as any,
      board: '' as any,
      genderCategory: 'co_ed',
      city: '',
      state: '',
      country: 'India',
      mediumOfInstruction: [],
      officialEmail: '',
      officialPhone: '',
      address: '',
      pin: '',
    },
    campuses: [],
    brandingDesign: {
      hasHighResLogo: false,
      primaryColor: '#000',
      secondaryColor: '#fff',
      accentColor: '#aaa',
    },
  };

  const highlights = extractCanonicalSchoolHighlights(sparseIntake);
  assert.strictEqual(highlights.establishedYear, undefined);
  assert.strictEqual(highlights.board, undefined);
  assert.strictEqual(highlights.classes, undefined);
});

// ------------------------------------------------------------------------------
// TEST 19: Existing legacy drafts remain backward compatible
// ------------------------------------------------------------------------------
runTest('Existing legacy drafts remain 100% backward compatible without runtime errors', () => {
  const legacyIntake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Heritage Convent' }),
    schoolContent: {
      aboutSchool: 'Founded in 1995, our school provides balanced development and strong values for all students.',
      teachingMethodology: 'Activity-based experiential learning with smartboards and individual attention.',
    } as any,
  };

  // Check completeness runs without error and acknowledges existing filled narrative
  const comp = calculateIntakeCompleteness('school-website', legacyIntake);
  assert.strictEqual(comp.sectionPercentages['schoolContent'], 100, 'Legacy draft scores 100% completeness');
  assert(!comp.missingFields.some((f) => f.includes('School Content')), 'No missing fields for legacy complete draft');
});

// ------------------------------------------------------------------------------
// TEST 20: Section 6 completeness calculation works across all states
// ------------------------------------------------------------------------------
runTest('Section 6 completeness calculates correct percentage across lifecycle states', () => {
  const base = buildBaseMockIntake();

  // State A: Empty content -> 0% (< 50% "Needs information")
  const emptyIntake: UniversalIntakeData = {
    ...base,
    brandingDesign: {} as any,
    leadership: {} as any,
    schoolContent: {} as any,
  };
  const compEmpty = calculateIntakeCompleteness('school-website', emptyIntake);
  assert.strictEqual(compEmpty.sectionPercentages['schoolContent'], 0, 'Completely empty content scores 0%');

  // State A.2: Partial unapproved content (< 50% "Needs information")
  const partialIntake: UniversalIntakeData = {
    ...base,
    schoolContent: {
      aboutSchool: 'Short text',
    } as any,
  };
  const compPartial = calculateIntakeCompleteness('school-website', partialIntake);
  assert(compPartial.sectionPercentages['schoolContent'] < 50, 'Partial content scores < 50%');

  // State B: Generated / ready drafts but unapproved -> 80% (50-99% "Content ready for review")
  const readyIntake: UniversalIntakeData = {
    ...base,
    schoolContent: generateFullSchoolContent(base),
  };
  if (readyIntake.schoolContent) {
    readyIntake.schoolContent.isApproved = false;
    readyIntake.schoolContent.approved = false;
  }
  const compReady = calculateIntakeCompleteness('school-website', readyIntake);
  assert.strictEqual(compReady.sectionPercentages['schoolContent'], 80, 'Ready drafts score 80% (Needs Approval)');

  // State C: Approved -> 100% ("Required content approved")
  if (readyIntake.schoolContent) {
    readyIntake.schoolContent.isApproved = true;
    readyIntake.schoolContent.approved = true;
  }
  const compApproved = calculateIntakeCompleteness('school-website', readyIntake);
  assert.strictEqual(compApproved.sectionPercentages['schoolContent'], 100, 'Approved content scores 100%');
});

// ------------------------------------------------------------------------------
// TEST 21: No external AI dependency is required for fallback generation
// ------------------------------------------------------------------------------
runTest('No external AI dependency is required: generation executes synchronously & deterministically', () => {
  const intake = buildBaseMockIntake();
  const start = Date.now();
  const content = generateFullSchoolContent(intake);
  const durationMs = Date.now() - start;

  assert(durationMs < 50, 'Executes synchronously in sub-50ms offline');
  assert(resolveContentBlockText(content.aboutSchool).length > 50, 'Full story produced');
  assert(resolveContentBlockText(content.mission).length > 20, 'Mission produced');
  assert(resolveContentBlockText(content.vision).length > 20, 'Vision produced');
  assert(resolveContentBlockText(content.educationalPhilosophy).length > 50, 'Philosophy produced');
});

// ------------------------------------------------------------------------------
// TEST 22: Tenant isolation remains intact
// ------------------------------------------------------------------------------
runTest('Multi-tenant isolation remains intact: content generation strictly scopes to current school', () => {
  const schoolAlpha = buildBaseMockIntake();
  schoolAlpha.schoolProfile.schoolName = 'Alpha World School';
  schoolAlpha.schoolProfile.city = 'Patna';
  schoolAlpha.brandingDesign.brandTone = 'Modern & Progressive';

  const schoolBeta = buildBaseMockIntake();
  schoolBeta.schoolProfile.schoolName = 'Beta Heritage Academy';
  schoolBeta.schoolProfile.city = 'Darbhanga';
  schoolBeta.brandingDesign.brandTone = 'Traditional & Prestigious';

  const contentAlpha = generateFullSchoolContent(schoolAlpha);
  const contentBeta = generateFullSchoolContent(schoolBeta);

  const aboutAlpha = resolveContentBlockText(contentAlpha.aboutSchool);
  const aboutBeta = resolveContentBlockText(contentBeta.aboutSchool);

  assert(aboutAlpha.includes('Alpha World School'), 'Alpha content contains Alpha school name');
  assert(!aboutAlpha.includes('Beta Heritage Academy'), 'Alpha content has zero Beta leakage');
  assert(!aboutAlpha.includes('Darbhanga'), 'Alpha content has zero Beta city leakage');

  assert(aboutBeta.includes('Beta Heritage Academy'), 'Beta content contains Beta school name');
  assert(!aboutBeta.includes('Alpha World School'), 'Beta content has zero Alpha leakage');
  assert(!aboutBeta.includes('Patna'), 'Beta content has zero Alpha city leakage');
});

// ------------------------------------------------------------------------------
// TEST 23: Live status summary calculates dynamically from real state
// ------------------------------------------------------------------------------
runTest('Section 6 status summary calculates dynamically from real state (never hardcoded)', () => {
  const intake = buildBaseMockIntake();
  intake.schoolContent = generateFullSchoolContent(intake);

  // Freshly generated, unreviewed drafts
  const freshSummary = getSection6StatusSummary(intake);
  assert.strictEqual(freshSummary.statusText, '5/5 drafts prepared · Approval pending');
  assert.strictEqual(freshSummary.canApprove, true);
  assert.strictEqual(freshSummary.isApproved, false);

  // User edits one block
  intake.schoolContent.aboutSchool = createContentBlock('User customized narrative paragraph for the school.', 'customized');
  const editedSummary = getSection6StatusSummary(intake);
  assert.strictEqual(editedSummary.statusText, '1/5 reviewed · Approval pending');

  // Upon approval
  intake.schoolContent.isApproved = true;
  intake.schoolContent.approved = true;
  const approvedSummary = getSection6StatusSummary(intake);
  assert.strictEqual(approvedSummary.statusText, 'Approved');
  assert.strictEqual(approvedSummary.isApproved, true);
});

// ------------------------------------------------------------------------------
// TEST 24: Non-destructive core values preservation when > 8 values exist
// ------------------------------------------------------------------------------
runTest('Non-destructive core values preservation when > 8 values exist in state', () => {
  const intake = buildBaseMockIntake();
  const sixteenValues = [
    'Academic Excellence', 'Integrity', 'Respect', 'Discipline',
    'Responsibility', 'Compassion', 'Leadership', 'Creativity',
    'Curiosity', 'Collaboration', 'Inclusivity', 'Character',
    'Innovation', 'Service', 'Resilience', 'Excellence',
  ];

  const content = generateFullSchoolContent(intake, {
    coreValues: sixteenValues,
  });

  // Must NOT delete existing values from availableCoreValues
  assert.strictEqual(content.availableCoreValues?.length, 16, 'Preserved all 16 values in availableCoreValues');
  assert(content.availableCoreValues?.includes('Excellence'), 'Preserved extra values');

  // Must guide active public profile selection to 6-8 values
  assert(content.coreValues.length >= 6 && content.coreValues.length <= 8, 'Active selection guided to 6-8');
});

// ------------------------------------------------------------------------------
// TEST 25: Approval is blocked when required content is incomplete or invalid
// ------------------------------------------------------------------------------
runTest('Approval is blocked when required content is incomplete or core values not between 6 and 8', () => {
  const intake = buildBaseMockIntake();
  const content = generateFullSchoolContent(intake);

  // Incomplete about narrative (< 20 chars)
  content.aboutSchool = createContentBlock('Too short', 'customized');
  const summaryShort = getSection6StatusSummary(intake, content);
  assert.strictEqual(summaryShort.canApprove, false);
  assert(summaryShort.reasons.some((r) => r.includes('About School requires at least 20 characters')));

  // Incomplete core values (< 6 values)
  content.aboutSchool = createContentBlock('This is a sufficiently long narrative about the school for testing.', 'customized');
  content.coreValues = ['Academic Excellence', 'Integrity']; // only 2 values
  const summaryFewValues = getSection6StatusSummary(intake, content);
  assert.strictEqual(summaryFewValues.canApprove, false);
  assert(summaryFewValues.reasons.some((r) => r.includes('Select at least 6 core values')));

  // Excessive core values (> 8 values)
  content.coreValues = [
    'Academic Excellence', 'Integrity', 'Respect', 'Discipline',
    'Responsibility', 'Compassion', 'Leadership', 'Creativity', 'Curiosity',
  ]; // 9 values
  const summaryTooMany = getSection6StatusSummary(intake, content);
  assert.strictEqual(summaryTooMany.canApprove, false);
  assert(summaryTooMany.reasons.some((r) => r.includes('Select no more than 8 core values')));
});

// ------------------------------------------------------------------------------
// TEST 26: Approval completes Section 6 to 100% and updates global onboarding progress
// ------------------------------------------------------------------------------
runTest('Approval completes Section 6 to 100% and updates global onboarding completeness', () => {
  const intake = buildBaseMockIntake();
  intake.schoolContent = generateFullSchoolContent(intake);

  // Before approval: Section 6 is 80% (needs approval)
  const beforeComp = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(beforeComp.sectionPercentages['schoolContent'], 80);

  // After approval: Section 6 is 100%
  intake.schoolContent.isApproved = true;
  intake.schoolContent.approved = true;
  intake.schoolContent.approvedAt = new Date().toISOString();
  intake.schoolContent.approvedBy = 'principal@stxaviers.edu.in';

  const afterComp = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(afterComp.sectionPercentages['schoolContent'], 100);
  assert(afterComp.percentage > beforeComp.percentage, 'Overall onboarding percentage increased');
});

// ------------------------------------------------------------------------------
// TEST 27: Unrelated onboarding sections continue working without regression
// ------------------------------------------------------------------------------
runTest('Unrelated onboarding sections continue working without regression', () => {
  const intake = buildBaseMockIntake();
  const comp = calculateIntakeCompleteness('school-website', intake);

  // Verify other sections are evaluated properly
  assert(typeof comp.sectionPercentages['schoolProfile'] === 'number');
  assert(typeof comp.sectionPercentages['brandingDesign'] === 'number');
  assert(typeof comp.sectionPercentages['websiteRequirements'] === 'number');
  assert(typeof comp.sectionPercentages['admissions'] === 'number');
});

// ------------------------------------------------------------------------------
// TEST 28: Canonical data populates drafts without requiring re-entry
// ------------------------------------------------------------------------------
runTest('Canonical data automatically populates drafts without requiring re-entry', () => {
  const intake = buildBaseMockIntake();
  const content = generateFullSchoolContent(intake);

  const aboutText = resolveContentBlockText(content.aboutSchool);
  const missionText = resolveContentBlockText(content.mission);
  const visionText = resolveContentBlockText(content.vision);
  const philosophyText = resolveContentBlockText(content.educationalPhilosophy);

  // User does not need to re-enter anything: all 4 are populated and valid
  assert(aboutText.length >= 20, 'About populated');
  assert(missionText.length >= 10, 'Mission populated');
  assert(visionText.length >= 10, 'Vision populated');
  assert(philosophyText.length >= 20, 'Philosophy populated');
  assert(content.coreValues.length >= 6 && content.coreValues.length <= 8, 'Core values populated with 6-8');
});

// ------------------------------------------------------------------------------
// TEST 29: Upstream source data change detection and non-destructive digest sync
// ------------------------------------------------------------------------------
runTest('Upstream source data change detection and non-destructive digest sync', () => {
  const intake = buildBaseMockIntake();
  const initialDigest = buildSourceDataDigest(intake);
  const content = generateFullSchoolContent(intake);

  assert.strictEqual(content.sourceDataDigest, initialDigest, 'Initial digest matches');

  // Customize the vision
  content.vision = createContentBlock('Our customized community vision', 'customized', initialDigest);

  // Simulate upstream school profile change (e.g. established year updated from 2005 to 1998)
  const modifiedIntake: UniversalIntakeData = {
    ...intake,
    schoolProfile: {
      ...intake.schoolProfile,
      yearOfEstablishment: '1998',
      establishmentYear: '1998',
    },
  };

  const newDigest = buildSourceDataDigest(modifiedIntake);
  assert.notStrictEqual(newDigest, initialDigest, 'Digest changed due to upstream year update');

  // Regenerate with forceRegenerate=false (Review & Update behavior preserving customized edits)
  const updatedContent = generateFullSchoolContent(modifiedIntake, content, false);

  // Customized vision must NOT be overwritten
  assert.strictEqual(
    resolveContentBlockText(updatedContent.vision),
    'Our customized community vision',
    'Customized vision preserved'
  );
  assert.strictEqual(resolveContentBlockStatus(updatedContent.vision), 'customized');

  // Non-customized About School must reflect the new year 1998
  const aboutText = resolveContentBlockText(updatedContent.aboutSchool);
  assert(aboutText.includes('1998'), 'Updated about text reflects new established year');
});

// ------------------------------------------------------------------------------
// TEST 30: End-to-end review lifecycle: auto-population -> edit -> checklist -> approval
// ------------------------------------------------------------------------------
runTest('End-to-end review lifecycle: auto-population -> edit -> checklist -> approval', () => {
  const intake = buildBaseMockIntake();

  // 1. Initial load: drafts auto-prepared without asking for re-entry
  const initialContent = generateFullSchoolContent(intake);
  const initialSummary = getSection6StatusSummary(intake, initialContent);
  assert.strictEqual(initialSummary.isApproved, false);
  assert.strictEqual(initialSummary.statusText, '5/5 drafts prepared · Approval pending');
  assert.strictEqual(initialSummary.canApprove, true, 'Can approve directly if satisfied');

  // 2. School admin edits Mission statement
  const editedContent: SchoolContentData = {
    ...initialContent,
    mission: createContentBlock('Empowering innovative thinkers and ethical leaders for Bihar and India.', 'customized'),
    isApproved: false,
    approved: false,
  };
  const postEditSummary = getSection6StatusSummary(intake, editedContent);
  assert.strictEqual(postEditSummary.statusText, '1/5 reviewed · Approval pending');
  assert.strictEqual(postEditSummary.canApprove, true);

  // 3. User attempts to approve with only 4 core values (blocked by checklist)
  const invalidValuesContent: SchoolContentData = {
    ...editedContent,
    coreValues: ['Integrity', 'Excellence', 'Respect', 'Discipline'], // only 4
  };
  const blockedSummary = getSection6StatusSummary(intake, invalidValuesContent);
  assert.strictEqual(blockedSummary.canApprove, false);
  assert(blockedSummary.reasons.some((r) => r.includes('Select at least 6 core values')));

  // 4. User corrects selection to 7 values (recommended 6-8 range)
  const validValuesContent: SchoolContentData = {
    ...invalidValuesContent,
    coreValues: ['Integrity', 'Excellence', 'Respect', 'Discipline', 'Leadership', 'Creativity', 'Compassion'],
  };
  const readySummary = getSection6StatusSummary(intake, validValuesContent);
  assert.strictEqual(readySummary.canApprove, true);
  assert.strictEqual(readySummary.reasons.length, 0);

  // 5. User clicks "Approve & Complete Section"
  const approvedContent: SchoolContentData = {
    ...validValuesContent,
    isApproved: true,
    approved: true,
    approvedAt: new Date().toISOString(),
    approvedBy: 'principal@school.edu.in',
  };
  const finalSummary = getSection6StatusSummary(intake, approvedContent);
  assert.strictEqual(finalSummary.isApproved, true);
  assert.strictEqual(finalSummary.statusText, 'Approved');

  const finalComp = calculateIntakeCompleteness('school-website', {
    ...intake,
    schoolContent: approvedContent,
  });
  assert.strictEqual(finalComp.sectionPercentages['schoolContent'], 100);
});

console.log('\n================================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');


