/**
 * CENTRALIZED SCHOOL CONTENT GENERATOR & FACT SYNTHESIS ENGINE
 * 
 * Production-hardened generator for Section 6: School Story, Mission & Educational Philosophy.
 * 
 * Principles:
 * 1. 100% Deterministic & Reliable: Operates offline without external AI API dependencies.
 * 2. Absolute Factual Integrity: Never invents establishment years, affiliations, accreditations,
 *    unverified facilities, or fake rankings.
 * 3. Tone & Brand Adaptation: Dynamically aligns language with the school's selected communication style.
 * 4. Campus Cardinality Awareness: Distinguishes between single-campus and multi-branch institutions.
 * 5. Upstream Data Change Detection: Calculates deterministic digest to alert when source facts change.
 */

import type {
  UniversalIntakeData,
  SchoolContentData,
  GeneratedContentBlock,
  SchoolHighlightsData,
} from './types';
import {
  resolveContentBlockText,
  resolveContentBlockStatus,
  createContentBlock,
} from './types';
import { getSchoolTypeConfig, deriveSchoolAcademicSummary } from './academicStructureUtils';

// ==============================================================================
// 1. UNIVERSAL CORE VALUES DEFINITION
// ==============================================================================

export const UNIVERSAL_CORE_VALUES: string[] = [
  'Academic Excellence',
  'Integrity',
  'Respect',
  'Discipline',
  'Responsibility',
  'Compassion',
  'Leadership',
  'Creativity',
  'Curiosity',
  'Collaboration',
  'Inclusivity',
  'Character',
  'Innovation',
  'Service',
  'Resilience',
];

// Tone-guided recommended value presets
export const TONE_CORE_VALUE_PRESETS: Record<string, string[]> = {
  'Traditional & Prestigious': [
    'Academic Excellence',
    'Integrity',
    'Discipline',
    'Respect',
    'Character',
    'Service',
  ],
  'Modern & Progressive': [
    'Creativity',
    'Innovation',
    'Curiosity',
    'Collaboration',
    'Leadership',
    'Inclusivity',
  ],
  'Academic & Scholarly': [
    'Academic Excellence',
    'Curiosity',
    'Integrity',
    'Discipline',
    'Innovation',
    'Leadership',
  ],
  'Warm & Community-focused': [
    'Compassion',
    'Respect',
    'Inclusivity',
    'Collaboration',
    'Integrity',
    'Responsibility',
  ],
  'Minimal & Professional': [
    'Academic Excellence',
    'Integrity',
    'Responsibility',
    'Leadership',
    'Collaboration',
    'Resilience',
  ],
};

// ==============================================================================
// 2. CANONICAL SOURCE EXTRACTION & DIGEST
// ==============================================================================

export interface ExtractedSchoolFacts {
  name: string;
  legalName?: string;
  establishedYear?: string;
  city: string;
  state: string;
  country: string;
  locationString: string;
  board?: string;
  affiliationNumber?: string;
  schoolType: string;
  genderCategory?: string;
  isResidential: boolean;
  mediums: string[];
  campusCount: number;
  isMultiCampus: boolean;
  campusNames: string[];
  principalName?: string;
  principalDesignation?: string;
  brandTone: string;
  taglineOrMotto?: string;
  classesOffered?: string;
  facilities: string[];
  sports: string[];
  hasComputerLab: boolean;
  hasScienceLab: boolean;
  hasLibrary: boolean;
  hasSmartClassrooms: boolean;
  hasPlayground: boolean;
  hasTransport: boolean;
  hasHostel: boolean;
}

/**
 * Extracts normalized, truthful facts from intake data without inventing missing fields.
 */
export function extractSchoolFacts(intake: Partial<UniversalIntakeData>): ExtractedSchoolFacts {
  const profile = intake.schoolProfile;
  const branding = intake.brandingDesign;
  const leadership = intake.leadership;
  const campuses = intake.campuses || [];
  const facilitiesConfig = intake.facilitiesConfig;
  const structure = intake.institutionStructure;

  const name = (profile?.schoolName || '').trim() || 'Our School';
  const legalName = profile?.legalInstitutionName?.trim();
  const rawYear = (profile?.yearOfEstablishment || profile?.establishmentYear || '').trim();
  const establishedYear = rawYear.length === 4 && !isNaN(Number(rawYear)) ? rawYear : undefined;

  const city = (profile?.city || campuses[0]?.city || '').trim();
  const state = (profile?.state || campuses[0]?.state || '').trim();
  const country = (profile?.country || campuses[0]?.country || 'India').trim();

  const locationParts = [city, state].filter(Boolean);
  const locationString = locationParts.join(', ') || (country ? country : '');

  const rawBoard = (profile?.board || '').trim();
  const board = rawBoard && rawBoard.toLowerCase() !== 'other' ? rawBoard : undefined;
  const affiliationNumber = profile?.affiliationNumber?.trim() || undefined;

  const schoolType = profile?.schoolType?.trim() || 'K-12 School (Kindergarten to 12th)';
  const schoolTypeConfig = getSchoolTypeConfig(schoolType);
  const genderCategory = profile?.genderCategory || profile?.coEdStatus;
  const isResidential = profile?.residentialStatus === 'residential' || profile?.residentialStatus === 'both_day_and_residential';
  const mediums = Array.isArray(profile?.mediumOfInstruction) ? profile.mediumOfInstruction.filter(Boolean) : [];

  const campusCount = Math.max(campuses.length, 1);
  const isMultiCampus = campuses.length > 1;
  const campusNames = campuses.map((c) => c.name?.trim()).filter(Boolean);

  const principalName = leadership?.principalName?.trim() || undefined;
  const principalDesignation = leadership?.principalDesignation?.trim() || 'Principal';

  const brandTone = branding?.brandTone?.trim() || 'Modern & Progressive';
  const taglineOrMotto = (branding?.taglineOrMotto || branding?.motto || '').trim() || undefined;

  // Derive class range & academic scope via authoritative campus-aware aggregator
  const academicSummary = deriveSchoolAcademicSummary(campuses, structure, profile);
  let classesOffered: string | undefined;
  if (academicSummary.isConsolidated && academicSummary.consolidatedClassRange) {
    classesOffered = academicSummary.consolidatedClassRange;
  } else if (academicSummary.isMultiCampus && academicSummary.campusBreakdowns.length > 0) {
    const campusSnippets = academicSummary.campusBreakdowns
      .filter((b) => b.classRange && b.classRange !== 'Not configured')
      .map((b) => `${b.campusName}: ${b.classRange}`);
    if (campusSnippets.length > 0) {
      classesOffered = campusSnippets.join(' · ');
    } else {
      classesOffered = `${academicSummary.headlineSummary} across ${campuses.length} campuses`;
    }
  } else if (structure?.classesOfferedFrom && structure?.classesOfferedTo) {
    classesOffered = `${structure.classesOfferedFrom} to ${structure.classesOfferedTo}`;
  } else if (Array.isArray(structure?.classes) && structure.classes.length > 0) {
    // If not explicitly confirmed, but matches custom non-default structure
    const firstClass = structure.classes[0]?.name;
    const lastClass = structure.classes[structure.classes.length - 1]?.name;
    classesOffered = firstClass && lastClass ? `${firstClass} to ${lastClass}` : schoolTypeConfig.classRange;
  } else {
    classesOffered = schoolTypeConfig.classRange;
  }

  // Derive verified facilities
  const facilitiesSet = new Set<string>();
  campuses.forEach((c) => {
    (c.facilities || []).forEach((f) => {
      if (typeof f === 'string' && f.trim().length > 0) facilitiesSet.add(f.trim());
    });
  });

  if (facilitiesConfig?.computerLab) facilitiesSet.add('Computer Laboratory');
  if (facilitiesConfig?.scienceLab) facilitiesSet.add('Science Laboratories');
  if (facilitiesConfig?.library) facilitiesSet.add('Library & Resource Centre');
  if (facilitiesConfig?.auditorium) facilitiesSet.add('Auditorium');
  if (facilitiesConfig?.playground) facilitiesSet.add('Sports Playground');
  if (facilitiesConfig?.smartClassrooms) facilitiesSet.add('Interactive Smart Classrooms');
  if (facilitiesConfig?.cctvInstalled) facilitiesSet.add('CCTV Surveillance');
  if (intake.transportConfig?.enabled) facilitiesSet.add('School Bus Transportation');
  if (intake.hostelConfig?.enabled || isResidential) facilitiesSet.add('Boarding & Hostel Facilities');

  const sportsList: string[] = [];
  if (Array.isArray(facilitiesConfig?.sportsFacilities)) {
    facilitiesConfig.sportsFacilities.forEach((s) => {
      if (typeof s === 'string' && s.trim().length > 0) sportsList.push(s.trim());
    });
  }

  return {
    name,
    legalName,
    establishedYear,
    city,
    state,
    country,
    locationString,
    board,
    affiliationNumber,
    schoolType,
    genderCategory,
    isResidential,
    mediums,
    campusCount,
    isMultiCampus,
    campusNames,
    principalName,
    principalDesignation,
    brandTone,
    taglineOrMotto,
    classesOffered,
    facilities: Array.from(facilitiesSet),
    sports: sportsList,
    hasComputerLab: Boolean(facilitiesConfig?.computerLab || facilitiesSet.has('Computer Laboratory')),
    hasScienceLab: Boolean(facilitiesConfig?.scienceLab || facilitiesSet.has('Science Laboratories')),
    hasLibrary: Boolean(facilitiesConfig?.library || facilitiesSet.has('Library & Resource Centre')),
    hasSmartClassrooms: Boolean(facilitiesConfig?.smartClassrooms || facilitiesSet.has('Interactive Smart Classrooms')),
    hasPlayground: Boolean(facilitiesConfig?.playground || facilitiesSet.has('Sports Playground')),
    hasTransport: Boolean(intake.transportConfig?.enabled || facilitiesSet.has('School Bus Transportation')),
    hasHostel: Boolean(isResidential || intake.hostelConfig?.enabled),
  };
}

/**
 * Builds a deterministic fingerprint string of the source intake data.
 * Incorporates school type and per-campus records to detect upstream modifications reliably.
 */
export function buildSourceDataDigest(intake: Partial<UniversalIntakeData>): string {
  const f = extractSchoolFacts(intake);
  const campusesFingerprint = (intake.campuses || [])
    .map((c) => `${c.id || ''}:${c.name || ''}:${c.city || ''}:${c.state || ''}:${c.district || ''}:${c.pin || ''}:${c.isMainCampus ? 'main' : 'branch'}`)
    .join(';');
  const parts = [
    f.name,
    f.establishedYear || 'no-year',
    f.locationString,
    f.board || 'no-board',
    f.affiliationNumber || 'no-aff',
    f.schoolType,
    f.brandTone,
    f.campusCount.toString(),
    campusesFingerprint,
    f.facilities.sort().join(','),
    f.classesOffered || 'no-classes',
  ];
  return parts.join('||');
}

/**
 * Extracts derived School Highlights from canonical intake state.
 */
export function extractCanonicalSchoolHighlights(intake: Partial<UniversalIntakeData>): SchoolHighlightsData {
  const f = extractSchoolFacts(intake);
  const typeConfig = getSchoolTypeConfig(f.schoolType);
  const campuses = intake.campuses || [];
  const structure = intake.institutionStructure;
  const profile = intake.schoolProfile;
  const academicSummary = deriveSchoolAcademicSummary(campuses, structure, profile);

  const campusBreakdowns = academicSummary.isMultiCampus && !academicSummary.isConsolidated
    ? academicSummary.campusBreakdowns
        .filter((b) => b.classRange && b.classRange !== 'Not configured')
        .map((b) => ({
          campusId: b.campusId,
          campusName: b.campusName,
          isMainCampus: b.isMainCampus,
          classRange: b.classRange,
          levelSummary: b.levelSummary,
        }))
    : undefined;

  const hasExplicitSchoolType = Boolean(profile?.schoolType?.trim());
  const hasExplicitStructure = Boolean(
    (structure?.classes && structure.classes.length > 0) ||
    (structure?.classesOfferedFrom && structure?.classesOfferedTo) ||
    (campuses.some((c) => (c.academicLevels && c.academicLevels.length > 0) || (c.classesOffered && c.classesOffered.length > 0)))
  );
  const classes = (hasExplicitStructure || hasExplicitSchoolType) ? (f.classesOffered || typeConfig.classRange) : undefined;

  return {
    establishedYear: f.establishedYear,
    location: f.locationString || undefined,
    board: f.board ? `${f.board}${f.affiliationNumber ? ` (Affiliation No: ${f.affiliationNumber})` : ''}` : undefined,
    classes,
    campusBreakdowns: campusBreakdowns && campusBreakdowns.length > 0 ? campusBreakdowns : undefined,
    campusesCount: f.campusCount,
    facilities: f.facilities.length > 0 ? f.facilities : undefined,
    activities: f.sports.length > 0 ? f.sports : undefined,
  };
}

// ==============================================================================
// 3. DETERMINISTIC NARRATIVE GENERATORS (TRUTHFUL & TONE-ADAPTED)
// ==============================================================================

/**
 * Generates About Our School story based on verified facts and communication style.
 */
export function generateAboutSchool(intake: Partial<UniversalIntakeData>): string {
  const f = extractSchoolFacts(intake);

  // Opening establishment clause
  const establishedClause = f.establishedYear ? `Established in ${f.establishedYear}, ` : '';
  const locationClause = f.locationString ? ` in ${f.locationString}` : '';
  const boardClause = f.board ? ` affiliated with ${f.board}` : '';
  const campusRef = f.isMultiCampus
    ? `operating across ${f.campusCount} campuses`
    : 'serving students on our dedicated campus';

  // Tone-specific narrative variations
  if (f.brandTone === 'Traditional & Prestigious') {
    const mottoSentence = f.taglineOrMotto ? ` Guided by our enduring motto, “${f.taglineOrMotto},” our institution upholds the highest traditions of scholarship.` : '';
    return (
      `${establishedClause}${f.name} stands as an esteemed educational institution${locationClause}${boardClause}, ` +
      `dedicated to academic rigor, integrity, and foundational character building. ${campusRef}, the school provides ` +
      `a structured, values-led learning environment that fosters moral fortitude, intellectual discipline, and civic responsibility in every student.${mottoSentence}`
    );
  }

  if (f.brandTone === 'Modern & Progressive') {
    const mottoSentence = f.taglineOrMotto ? ` Inspired by our motto, “${f.taglineOrMotto},” we empower young minds to embrace modern challenges.` : '';
    return (
      `${f.name} is a dynamic, forward-looking learning community${locationClause}${boardClause}. ` +
      `${establishedClause ? `Since ${f.establishedYear}, ` : ''}${campusRef}, we combine contemporary pedagogy ` +
      `with holistic development, preparing curious, adaptable, and self-directed learners equipped for tomorrow's world.${mottoSentence}`
    );
  }

  if (f.brandTone === 'Academic & Scholarly') {
    return (
      `${establishedClause}${f.name} is an academic institution${locationClause}${boardClause}, committed to ` +
      `intellectual depth, analytical inquiry, and foundational scholarship. ${campusRef}, our curriculum ` +
      `and faculty emphasize conceptual mastery, disciplined study habits, and continuous academic achievement.`
    );
  }

  if (f.brandTone === 'Warm & Community-focused') {
    return (
      `${f.name} is a welcoming and nurturing educational home for students and families${locationClause}. ` +
      `${establishedClause ? `Founded in ${f.establishedYear}, ` : ''}${campusRef}, we emphasize personal care, ` +
      `compassion, and collaborative learning where each child is recognized, valued, and encouraged to realize their unique potential.`
    );
  }

  // Minimal & Professional (Default fallback)
  return (
    `${establishedClause}${f.name} is an educational institution${locationClause}${boardClause}, dedicated to ` +
    `providing quality schooling and balanced student development. ${campusRef}, the school offers a safe, structured, ` +
    `and supportive environment for academic progress and co-curricular growth.`
  );
}

/**
 * Generates an institutional Mission Statement strictly without unsupported claims.
 */
export function generateMissionStatement(intake: Partial<UniversalIntakeData>): string {
  const f = extractSchoolFacts(intake);

  if (f.brandTone === 'Traditional & Prestigious') {
    return (
      `To impart a rigorous and disciplined education rooted in ethical values, nurturing responsible citizens ` +
      `who lead with integrity, scholarship, and exemplary character.`
    );
  }

  if (f.brandTone === 'Modern & Progressive') {
    return (
      `To empower every student through inquiry-driven learning, creative exploration, and critical thinking, ` +
      `fostering adaptability and lifelong passion for knowledge in an evolving world.`
    );
  }

  if (f.brandTone === 'Academic & Scholarly') {
    return (
      `To cultivate intellectual curiosity, analytical capability, and academic excellence through structured curriculum, ` +
      `high teaching standards, and systematic scholarship.`
    );
  }

  if (f.brandTone === 'Warm & Community-focused') {
    return (
      `To provide a supportive, inclusive, and nurturing learning community where every student thrives academically, ` +
      `emotionally, and socially in close partnership with parents.`
    );
  }

  // Minimal & Professional
  return (
    `To deliver accessible, well-structured education that supports academic achievement, character development, ` +
    `and responsible citizenship for all students.`
  );
}

/**
 * Generates a forward-looking Vision Statement.
 */
export function generateVisionStatement(intake: Partial<UniversalIntakeData>): string {
  const f = extractSchoolFacts(intake);

  if (f.brandTone === 'Traditional & Prestigious') {
    return (
      `To be recognized as an enduring benchmark of academic distinction and moral integrity, graduating ` +
      `principled leaders who make meaningful contributions to society.`
    );
  }

  if (f.brandTone === 'Modern & Progressive') {
    return (
      `To be an inspiring hub of future-ready education, cultivating innovative thinkers, compassionate collaborators, ` +
      `and confident leaders prepared to shape a better tomorrow.`
    );
  }

  if (f.brandTone === 'Academic & Scholarly') {
    return (
      `To inspire a generation of rigorous scholars and critical thinkers who pursue knowledge with purpose, ` +
      `diligence, and intellectual honor.`
    );
  }

  if (f.brandTone === 'Warm & Community-focused') {
    return (
      `To cultivate a joyful and compassionate community of learners who grow in self-confidence, empathy, and ` +
      `community responsibility.`
    );
  }

  // Minimal & Professional
  return (
    `To be a trusted institution of educational excellence, guiding students toward successful futures through ` +
    `holistic development and lifelong learning values.`
  );
}

/**
 * Generates Educational Philosophy & Teaching Approach using only verified intake context.
 */
export function generateEducationalPhilosophy(intake: Partial<UniversalIntakeData>): string {
  const f = extractSchoolFacts(intake);

  // Build verified elements list
  const verifiedThemes: string[] = [];
  if (f.hasSmartClassrooms) verifiedThemes.push('interactive digital classrooms');
  if (f.hasScienceLab) verifiedThemes.push('practical laboratory experimentation');
  if (f.hasComputerLab) verifiedThemes.push('digital and computational literacy');
  if (f.hasLibrary) verifiedThemes.push('structured reading and library research');
  if (f.hasPlayground || f.sports.length > 0) verifiedThemes.push('physical education and team athletics');

  const facilityContext = verifiedThemes.length > 0
    ? ` Our classrooms and infrastructure support ${verifiedThemes.slice(0, 3).join(', ')}.`
    : '';

  const campusPhrase = f.isMultiCampus ? 'across all campus locations' : 'in our classrooms';

  if (f.brandTone === 'Traditional & Prestigious') {
    return (
      `Our educational philosophy balances foundational academic rigor with regular character formation. ` +
      `Teaching ${campusPhrase} is teacher-guided and structured, emphasizing foundational mastery, disciplined study habits, ` +
      `and continuous formative assessment.${facilityContext} We believe true education harmonizes academic scholarship with ethical responsibility.`
    );
  }

  if (f.brandTone === 'Modern & Progressive') {
    return (
      `We embrace an active, student-centric pedagogical model where curiosity and hands-on discovery lead the learning journey. ` +
      `Instruction ${campusPhrase} focuses on conceptual understanding, problem-solving, and collaborative projects rather than rote memorization.${facilityContext} ` +
      `Teachers act as facilitators, guiding each student to think critically and apply knowledge meaningfully.`
    );
  }

  if (f.brandTone === 'Academic & Scholarly') {
    return (
      `Our teaching approach centers on disciplined academic inquiry, conceptual precision, and intellectual curiosity. ` +
      `Faculty members structure learning ${campusPhrase} around foundational core subjects, analytical reasoning, and rigorous formative feedback.${facilityContext} ` +
      `We prepare students to articulate arguments clearly and engage deeply with learning materials.`
    );
  }

  if (f.brandTone === 'Warm & Community-focused') {
    return (
      `We believe children learn best in an atmosphere of mutual trust, encouragement, and emotional security. ` +
      `Our teachers take personal care to understand each student's learning style, offering individualized mentorship and positive reinforcement ${campusPhrase}.${facilityContext} ` +
      `Education is viewed as a partnership uniting school, student, and family.`
    );
  }

  // Minimal & Professional
  return (
    `Our school follows a balanced, curriculum-aligned teaching framework designed to promote steady academic advancement ` +
    `and personal growth. Classroom practice ${campusPhrase} integrates clear conceptual instruction with practical exercises and regular evaluation.${facilityContext} ` +
    `The goal is to provide every learner with strong foundational competencies and confidence.`
  );
}

/**
 * Selects recommended core values tailored to the school's communication style.
 */
export function getRecommendedCoreValues(intake: Partial<UniversalIntakeData>): string[] {
  const tone = intake.brandingDesign?.brandTone?.trim() || 'Modern & Progressive';
  const preset = TONE_CORE_VALUE_PRESETS[tone];
  if (preset && preset.length > 0) {
    return [...preset];
  }
  return [
    'Academic Excellence',
    'Integrity',
    'Respect',
    'Discipline',
    'Responsibility',
    'Leadership',
  ];
}

// ==============================================================================
// 4. FULL SECTION 6 SYNTHESIS & NON-DESTRUCTIVE HYDRATION
// ==============================================================================

/**
 * Synthesizes or updates full Section 6 content data while safely protecting customized user work.
 */
export function generateFullSchoolContent(
  intake: Partial<UniversalIntakeData>,
  existingContent?: Partial<SchoolContentData>,
  forceRegenerate = false
): SchoolContentData {
  const currentDigest = buildSourceDataDigest(intake);
  const highlights = extractCanonicalSchoolHighlights(intake);
  const recommendedValues = getRecommendedCoreValues(intake);

  // 1. About School
  let aboutSchool: string | GeneratedContentBlock;
  const existingAboutText = resolveContentBlockText(existingContent?.aboutSchool);
  const existingAboutStatus = resolveContentBlockStatus(existingContent?.aboutSchool);

  if (!forceRegenerate && existingAboutStatus === 'customized' && existingAboutText.trim().length > 0) {
    aboutSchool = typeof existingContent?.aboutSchool === 'object'
      ? { ...existingContent.aboutSchool, text: existingAboutText, status: 'customized' }
      : createContentBlock(existingAboutText, 'customized', currentDigest);
  } else if (!forceRegenerate && existingAboutStatus === 'approved' && existingAboutText.trim().length > 0) {
    aboutSchool = typeof existingContent?.aboutSchool === 'object'
      ? { ...existingContent.aboutSchool, text: existingAboutText, status: 'approved' }
      : createContentBlock(existingAboutText, 'approved', currentDigest);
  } else {
    aboutSchool = createContentBlock(generateAboutSchool(intake), 'generated', currentDigest);
  }

  // 2. Mission
  let mission: GeneratedContentBlock;
  const existingMissionText = resolveContentBlockText(
    existingContent?.mission || intake.brandingDesign?.missionStatement || intake.leadership?.missionStatement
  );
  const existingMissionStatus = resolveContentBlockStatus(existingContent?.mission);

  if (!forceRegenerate && existingMissionStatus === 'customized' && existingMissionText.trim().length > 0) {
    mission = createContentBlock(existingMissionText, 'customized', currentDigest);
  } else if (!forceRegenerate && existingMissionStatus === 'approved' && existingMissionText.trim().length > 0) {
    mission = createContentBlock(existingMissionText, 'approved', currentDigest);
  } else if (!forceRegenerate && existingMissionText.trim().length > 0) {
    mission = createContentBlock(existingMissionText, 'generated', currentDigest);
  } else {
    mission = createContentBlock(generateMissionStatement(intake), 'generated', currentDigest);
  }

  // 3. Vision
  let vision: GeneratedContentBlock;
  const existingVisionText = resolveContentBlockText(
    existingContent?.vision || intake.brandingDesign?.visionStatement || intake.leadership?.visionStatement
  );
  const existingVisionStatus = resolveContentBlockStatus(existingContent?.vision);

  if (!forceRegenerate && existingVisionStatus === 'customized' && existingVisionText.trim().length > 0) {
    vision = createContentBlock(existingVisionText, 'customized', currentDigest);
  } else if (!forceRegenerate && existingVisionStatus === 'approved' && existingVisionText.trim().length > 0) {
    vision = createContentBlock(existingVisionText, 'approved', currentDigest);
  } else if (!forceRegenerate && existingVisionText.trim().length > 0) {
    vision = createContentBlock(existingVisionText, 'generated', currentDigest);
  } else {
    vision = createContentBlock(generateVisionStatement(intake), 'generated', currentDigest);
  }

  // 4. Educational Philosophy
  let educationalPhilosophy: GeneratedContentBlock;
  const existingPhilosophyText = resolveContentBlockText(
    existingContent?.educationalPhilosophy || existingContent?.teachingMethodology || existingContent?.philosophy
  );
  const existingPhilosophyStatus = resolveContentBlockStatus(existingContent?.educationalPhilosophy);

  if (!forceRegenerate && existingPhilosophyStatus === 'customized' && existingPhilosophyText.trim().length > 0) {
    educationalPhilosophy = createContentBlock(existingPhilosophyText, 'customized', currentDigest);
  } else if (!forceRegenerate && existingPhilosophyStatus === 'approved' && existingPhilosophyText.trim().length > 0) {
    educationalPhilosophy = createContentBlock(existingPhilosophyText, 'approved', currentDigest);
  } else if (!forceRegenerate && existingPhilosophyText.trim().length > 0) {
    educationalPhilosophy = createContentBlock(existingPhilosophyText, 'generated', currentDigest);
  } else {
    educationalPhilosophy = createContentBlock(generateEducationalPhilosophy(intake), 'generated', currentDigest);
  }

  // 5. Core Values
  let availableCoreValues: string[] = Array.isArray(existingContent?.availableCoreValues)
    ? [...existingContent.availableCoreValues]
    : [];
  let coreValues: string[];

  if (Array.isArray(existingContent?.coreValues) && existingContent.coreValues.length > 0) {
    if (existingContent.coreValues.length > 8) {
      // Non-destructive: preserve all existing values in availableCoreValues without loss
      availableCoreValues = Array.from(new Set([...availableCoreValues, ...existingContent.coreValues]));
      // Guide active public selection to 6-8 recommended/prioritized values
      const recommendedSet = new Set(recommendedValues);
      const matching = existingContent.coreValues.filter((v) => recommendedSet.has(v));
      if (matching.length >= 6 && matching.length <= 8) {
        coreValues = matching;
      } else {
        coreValues = recommendedValues.slice(0, 8);
      }
    } else {
      coreValues = [...existingContent.coreValues];
    }
  } else if (Array.isArray(intake.brandingDesign?.coreValues) && intake.brandingDesign.coreValues.length > 0) {
    if (intake.brandingDesign.coreValues.length > 8) {
      availableCoreValues = Array.from(new Set([...availableCoreValues, ...intake.brandingDesign.coreValues]));
      coreValues = recommendedValues.slice(0, 8);
    } else if (intake.brandingDesign.coreValues.length < 6) {
      // Supplement with tone-recommended values to reach the 6-8 range
      availableCoreValues = Array.from(new Set([...availableCoreValues, ...intake.brandingDesign.coreValues, ...recommendedValues]));
      coreValues = Array.from(new Set([...intake.brandingDesign.coreValues, ...recommendedValues])).slice(0, 6);
    } else {
      coreValues = [...intake.brandingDesign.coreValues];
    }
  } else {
    coreValues = recommendedValues;
  }

  if (availableCoreValues.length === 0) {
    availableCoreValues = Array.from(new Set([...UNIVERSAL_CORE_VALUES, ...coreValues]));
  }

  // 6. Approval & Metadata
  const isApproved = existingContent?.isApproved ?? existingContent?.approved ?? false;

  return {
    ...existingContent,
    aboutSchool,
    mission,
    vision,
    educationalPhilosophy,
    coreValues,
    availableCoreValues,
    highlights,
    isApproved,
    approved: isApproved,
    approvedAt: existingContent?.approvedAt,
    approvedBy: existingContent?.approvedBy,
    sourceDataDigest: currentDigest,
    // Preserve legacy fields
    philosophy: resolveContentBlockText(educationalPhilosophy),
    teachingMethodology: resolveContentBlockText(educationalPhilosophy),
  };
}

// ==============================================================================
// 5. SECTION 6 STATUS & READINESS CALCULATOR
// ==============================================================================

export interface Section6StatusSummary {
  readyCount: number;
  totalCount: number;
  reviewedCount: number;
  isApproved: boolean;
  statusText: string;
  canApprove: boolean;
  reasons: string[];
}

/**
 * Computes live, calculated Section 6 readiness and approval status.
 * Never hard-codes status numbers.
 */
export function getSection6StatusSummary(
  intake: Partial<UniversalIntakeData>,
  contentOverride?: Partial<SchoolContentData>
): Section6StatusSummary {
  const content = contentOverride || intake.schoolContent || ({} as SchoolContentData);
  const aboutText = resolveContentBlockText(content.aboutSchool).trim();
  const missionText = (
    resolveContentBlockText(content.mission) ||
    intake.brandingDesign?.missionStatement ||
    intake.leadership?.missionStatement ||
    ''
  ).trim();
  const visionText = (
    resolveContentBlockText(content.vision) ||
    intake.brandingDesign?.visionStatement ||
    intake.leadership?.visionStatement ||
    ''
  ).trim();
  const philosophyText = (
    resolveContentBlockText(content.educationalPhilosophy) ||
    content.teachingMethodology ||
    content.philosophy ||
    ''
  ).trim();

  const coreValues = Array.isArray(content.coreValues) ? content.coreValues : [];

  const isAboutReady = aboutText.length >= 20;
  const isMissionReady = missionText.length >= 10;
  const isVisionReady = visionText.length >= 10;
  const isPhilosophyReady = philosophyText.length >= 20;
  const isCoreValuesReady = coreValues.length >= 6 && coreValues.length <= 8;

  const readyItems = [isAboutReady, isMissionReady, isVisionReady, isPhilosophyReady, isCoreValuesReady];
  const readyCount = readyItems.filter(Boolean).length;
  const totalCount = 5;

  const aboutStatus = resolveContentBlockStatus(content.aboutSchool);
  const missionStatus = resolveContentBlockStatus(content.mission);
  const visionStatus = resolveContentBlockStatus(content.vision);
  const philosophyStatus = resolveContentBlockStatus(content.educationalPhilosophy);

  const reviewedCount = [aboutStatus, missionStatus, visionStatus, philosophyStatus].filter(
    (s) => s === 'customized'
  ).length;

  const isApproved = Boolean(content.isApproved || content.approved);
  const canApprove = isAboutReady && isMissionReady && isVisionReady && isPhilosophyReady && isCoreValuesReady;

  const reasons: string[] = [];
  if (!isAboutReady) reasons.push('About School requires at least 20 characters');
  if (!isMissionReady) reasons.push('Mission Statement requires at least 10 characters');
  if (!isVisionReady) reasons.push('Vision Statement requires at least 10 characters');
  if (!isPhilosophyReady) reasons.push('Educational Philosophy requires at least 20 characters');
  if (!isCoreValuesReady) {
    if (coreValues.length < 6) reasons.push(`Select at least 6 core values (currently ${coreValues.length} selected)`);
    else reasons.push(`Select no more than 8 core values (currently ${coreValues.length} selected)`);
  }

  let statusText = '';
  if (isApproved) {
    statusText = 'Approved';
  } else if (canApprove) {
    if (reviewedCount > 0) {
      statusText = `${reviewedCount}/${totalCount} reviewed · Approval pending`;
    } else {
      statusText = '5/5 drafts prepared · Approval pending';
    }
  } else {
    if (reviewedCount > 0) {
      statusText = `${reviewedCount}/${totalCount} reviewed · Approval pending`;
    } else {
      statusText = `${readyCount}/${totalCount} drafts prepared · Approval pending`;
    }
  }

  return {
    readyCount,
    totalCount,
    reviewedCount,
    isApproved,
    statusText,
    canApprove,
    reasons,
  };
}

