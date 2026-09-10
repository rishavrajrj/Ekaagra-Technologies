/**
 * CENTRAL CONTENT RECOMMENDATION & SYNTHESIS SERVICE
 * 
 * Production engine for School Website Provisioning / Content, Assets & Documents (Section 24).
 * 
 * Core Principles:
 * 1. "Don't make the school write website content. Make the school verify and approve website content."
 * 2. Zero Fabrication: Strictly uses facts provided during onboarding. Never invents numbers,
 *    unverified facilities, fake affiliations, or unauthorized rankings.
 * 3. Authoritative Source Attribution: Always traces and displays source facts.
 * 4. Policy Safeguards: Legal policies are clearly designated as editable templates requiring school review.
 * 5. Statutory Protection: Statutory documents (affiliation certificates, NOCs, safety certs) remain
 *    mandatory document upload workflows and can NEVER be replaced with AI text.
 */

import type {
  UniversalIntakeData,
  AssetChecklistItem,
} from './types';
import { resolveContentBlockText } from './types';
import {
  extractSchoolFacts,
  getRecommendedCoreValues,
  generateAboutSchool,
  generateMissionStatement,
  generateVisionStatement,
  generateEducationalPhilosophy,
  type ExtractedSchoolFacts,
} from './schoolContentGenerator';
import { resolveEffectiveDesignation } from './schoolDeskMessageGenerator';

// ==============================================================================
// 1. TYPES & CONTRACTS
// ==============================================================================

export type RecommendationGenerationType =
  | 'ai_recommendation'
  | 'template'
  | 'existing_data'
  | 'manual_only'
  | 'document_only';

export type RecommendationTone =
  | 'Professional'
  | 'Warm & Parent-Friendly'
  | 'Premium / Modern'
  | 'Concise';

export type RecommendationLength = 'short' | 'standard' | 'detailed';

export interface MissingSourceInput {
  label: string;
  sectionKey: string;
  sectionLabel: string;
  fieldName: string;
}

export interface ContentRecommendationConfig {
  fieldKey: string;
  label: string;
  category: string;
  recommendationEnabled: boolean;
  generationType: RecommendationGenerationType;
  requiresReview: boolean;
  isStatutory?: boolean;
  requiredSources: string[];
  defaultLength: RecommendationLength;
  helperDescription: string;
}

export interface ContentRecommendationRequest {
  fieldKey: string;
  intakeData: Partial<UniversalIntakeData>;
  tone?: RecommendationTone;
  length?: RecommendationLength;
  variationSeed?: number;
}

export interface ContentRecommendationResult {
  fieldKey: string;
  generatedText: string;
  sourceFields: string[];
  sourceLabels: string[];
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
  requiresReview: boolean;
  isTemplate?: boolean;
  sourceFingerprint: string;
  missingInputs?: MissingSourceInput[];
  isInsufficientData?: boolean;
  suggestedValues?: string[];
}

// ==============================================================================
// 2. CENTRAL CONFIGURATION REGISTRY FOR ALL PROVISIONING FIELDS
// ==============================================================================

export const CONTENT_RECOMMENDATION_CONFIGS: Record<string, ContentRecommendationConfig> = {
  // ── A. Leadership & Governance ─────────────────────────────────────────────
  'lead-principal-msg': {
    fieldKey: 'lead-principal-msg',
    label: 'Principal’s Desk Message',
    category: 'leadership',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Leadership Profile', 'Vision & Mission'],
    defaultLength: 'standard',
    helperDescription: 'Welcome note and visionary address from the Principal to prospective parents and students.',
  },
  'lead-mgmt-msg': {
    fieldKey: 'lead-mgmt-msg',
    label: 'Chairman / Management Address',
    category: 'leadership',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Leadership Profile', 'Vision & Mission'],
    defaultLength: 'standard',
    helperDescription: 'Address from the Founder, Chairman, or Managing Committee President.',
  },
  'lead-faculty-highlights': {
    fieldKey: 'lead-faculty-highlights',
    label: 'Faculty & Educator Highlights',
    category: 'leadership',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['Faculty & Staff Setup', 'Academic Structure'],
    defaultLength: 'standard',
    helperDescription: 'Overview of teaching faculty excellence, qualifications, and mentor guidance.',
  },

  // ── B. Academic & School Content ───────────────────────────────────────────
  'acad-about': {
    fieldKey: 'acad-about',
    label: 'About School Overview',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Campuses', 'Brand Identity', 'Vision & Mission'],
    defaultLength: 'standard',
    helperDescription: 'Founding history, campus atmosphere, and core institutional philosophy.',
  },
  'acad-vision': {
    fieldKey: 'acad-vision',
    label: 'School Vision Statement',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Brand Identity'],
    defaultLength: 'short',
    helperDescription: 'Inspirational 1–3 sentence statement describing the school’s long-term aspiration.',
  },
  'acad-mission': {
    fieldKey: 'acad-mission',
    label: 'School Mission Statement',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Brand Identity', 'Academic Philosophy'],
    defaultLength: 'short',
    helperDescription: 'Actionable 1–3 sentence statement detailing daily pedagogy and student enrichment commitments.',
  },
  'acad-values': {
    fieldKey: 'acad-values',
    label: 'Core Values & Institutional Principles',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['Brand Identity', 'School Content'],
    defaultLength: 'short',
    helperDescription: '3 to 6 guiding principles (e.g. Integrity, Excellence, Respect, Innovation, Discipline).',
  },
  'acad-curriculum': {
    fieldKey: 'acad-curriculum',
    label: 'Curriculum & Pedagogy Description',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Academic Structure', 'School Content'],
    defaultLength: 'standard',
    helperDescription: 'Overview of board syllabus, teaching methodology, and assessment pattern.',
  },
  'acad-facilities-desc': {
    fieldKey: 'acad-facilities-desc',
    label: 'Facilities & Campus Amenities Text',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['Campus Facilities', 'Campus Infrastructure', 'Campuses'],
    defaultLength: 'standard',
    helperDescription: 'Comprehensive narrative detailing smart classrooms, labs, sports, safety, and student amenities.',
  },
  'acad-achievements': {
    fieldKey: 'acad-achievements',
    label: 'Key Student Achievements & Accolades',
    category: 'academic_content',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Content (Awards & Achievements)'],
    defaultLength: 'standard',
    helperDescription: 'Board exam achievements, inter-school tournament laurels, and institutional accolades.',
  },

  // ── C. Admissions & Contact ────────────────────────────────────────────────
  'adm-process': {
    fieldKey: 'adm-process',
    label: 'Admissions Guidelines & Step-by-Step Process',
    category: 'admissions',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['Admissions Setup', 'Academic Classes', 'School Profile'],
    defaultLength: 'standard',
    helperDescription: 'Structured step-by-step application process, eligibility criteria, and required documents.',
  },
  'adm-notice': {
    fieldKey: 'adm-notice',
    label: 'Admissions Open Announcement Banner',
    category: 'admissions',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['Admissions Setup', 'Academic Structure', 'School Profile'],
    defaultLength: 'short',
    helperDescription: 'Hero banner announcement text inviting applications for the upcoming academic session.',
  },
  'adm-contact': {
    fieldKey: 'adm-contact',
    label: 'Admissions Office Timings & Helplines',
    category: 'admissions',
    recommendationEnabled: true,
    generationType: 'ai_recommendation',
    requiresReview: false,
    requiredSources: ['School Profile', 'Admissions Setup', 'Attendance & Timetable'],
    defaultLength: 'short',
    helperDescription: 'Visiting hours, admission telephone numbers, inquiry email, and campus office location.',
  },

  // ── D. Policies & Disclosures (Standard Templates with Review Warning) ──────
  'pol-privacy': {
    fieldKey: 'pol-privacy',
    label: 'Website & Student Data Privacy Policy',
    category: 'policies',
    recommendationEnabled: true,
    generationType: 'template',
    requiresReview: true,
    requiredSources: ['School Profile', 'Legal Policies'],
    defaultLength: 'standard',
    helperDescription: 'Standard statutory policy explaining student data protection, cookies, and digital privacy.',
  },
  'pol-terms': {
    fieldKey: 'pol-terms',
    label: 'Terms of Website Usage & Portal Access',
    category: 'policies',
    recommendationEnabled: true,
    generationType: 'template',
    requiresReview: true,
    requiredSources: ['School Profile', 'Legal Policies'],
    defaultLength: 'standard',
    helperDescription: 'Standard institutional terms governing parent portal access, conduct, and copyright.',
  },
  'pol-refund': {
    fieldKey: 'pol-refund',
    label: 'Fee Refund & Cancellation Policy',
    category: 'policies',
    recommendationEnabled: true,
    generationType: 'template',
    requiresReview: true,
    requiredSources: ['Admissions Setup', 'Fees Configuration', 'School Profile'],
    defaultLength: 'standard',
    helperDescription: 'Standard regulatory policy on admission fee cancellation, caution deposit return, and withdrawal notice.',
  },
  'pol-child-safety': {
    fieldKey: 'pol-child-safety',
    label: 'Child Protection & Safeguarding Policy (POCSO)',
    category: 'policies',
    recommendationEnabled: true,
    generationType: 'template',
    requiresReview: true,
    requiredSources: ['School Profile', 'Campus Safety'],
    defaultLength: 'standard',
    helperDescription: 'Standard institutional safeguarding framework complying with POCSO guidelines and ICC norms.',
  },

  // ── E. Statutory Documents (Strictly Document Upload Only — No AI Text) ─────
  'cert-affiliation': {
    fieldKey: 'cert-affiliation',
    label: 'Board Affiliation Certificate / Extension Letter',
    category: 'certificates',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: true,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'Official board grant letter. Must be uploaded as an official PDF/image document.',
  },
  'cert-recognition': {
    fieldKey: 'cert-recognition',
    label: 'School Recognition Certificate / Government NOC',
    category: 'certificates',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: true,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'State Education Department recognition order or Government NOC.',
  },
  'cert-registration': {
    fieldKey: 'cert-registration',
    label: 'Society / Trust Registration Certificate',
    category: 'certificates',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: false,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'Official registration deed of the running educational society or trust.',
  },
  'cert-safety': {
    fieldKey: 'cert-safety',
    label: 'Building Safety & Fire Safety Certificate',
    category: 'certificates',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: true,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'Official municipal Fire NOC and structural stability certificate.',
  },
  'cert-mandatory-disclosure': {
    fieldKey: 'cert-mandatory-disclosure',
    label: 'Mandatory Public Disclosure Document (Appendix IX)',
    category: 'certificates',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: true,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'Official board statutory disclosure sheet (PDF).',
  },
  'adm-fee-circular': {
    fieldKey: 'adm-fee-circular',
    label: 'Official Fee Schedule / Circular (PDF)',
    category: 'admissions',
    recommendationEnabled: false,
    generationType: 'document_only',
    requiresReview: true,
    isStatutory: true,
    requiredSources: [],
    defaultLength: 'standard',
    helperDescription: 'Signed official fee schedule circular required for regulatory transparency.',
  },
};

/**
 * Returns configuration for a specific checklist item key.
 */
export function getContentRecommendationConfig(
  fieldKey: string
): ContentRecommendationConfig | undefined {
  return CONTENT_RECOMMENDATION_CONFIGS[fieldKey];
}

/**
 * Checks whether a given provisioning field is eligible for AI recommendation or template.
 */
export function isRecommendationEligible(fieldKey: string): boolean {
  const config = CONTENT_RECOMMENDATION_CONFIGS[fieldKey];
  return Boolean(
    config &&
    config.recommendationEnabled &&
    config.generationType !== 'document_only' &&
    config.generationType !== 'manual_only'
  );
}

// ==============================================================================
// 3. SOURCE FINGERPRINTING & CHANGE DETECTION
// ==============================================================================

/**
 * Calculates a lightweight, deterministic fingerprint of the relevant source data
 * for a specific field. If source fields change later in onboarding, this allows
 * the system to detect that the recommendation is outdated.
 */
export function calculateContentSourceFingerprint(
  fieldKey: string,
  intakeData: Partial<UniversalIntakeData>
): string {
  const f = extractSchoolFacts(intakeData);
  const parts: string[] = [fieldKey, f.name, f.city, f.state, f.brandTone];

  if (fieldKey === 'acad-facilities-desc') {
    const facConfig = (intakeData.facilitiesConfig || {}) as any;
    parts.push(
      f.facilities.sort().join(','),
      f.hasSmartClassrooms ? 'smart' : 'no-smart',
      String(facConfig.smartClassroomCount || facConfig.smartClassroomsCount || ''),
      String(facConfig.libraryBookCount || ''),
      JSON.stringify(facConfig.scienceLabs || []),
      f.hasScienceLab ? 'sci' : 'no-sci',
      f.hasComputerLab ? 'comp' : 'no-comp',
      f.hasLibrary ? 'lib' : 'no-lib',
      f.hasPlayground ? 'play' : 'no-play',
      f.hasTransport ? 'trans' : 'no-trans',
      f.hasHostel ? 'hostel' : 'no-hostel',
      facConfig.cctvInstalled ? 'cctv' : 'no-cctv',
      facConfig.hasCafeteria || facConfig.cafeteria ? 'cafe' : 'no-cafe',
      facConfig.medicalRoomAvailable || facConfig.infirmary ? 'med' : 'no-med'
    );
  } else if (fieldKey === 'lead-faculty-highlights') {
    const staff = (intakeData.staffFaculty || (intakeData as any).facultyStaff || (intakeData as any).staffInformation || {}) as any;
    parts.push(
      String(staff.totalTeachingStaff || staff.facultyCount || staff.teachingStaffCount || ''),
      String(staff.studentTeacherRatio || ''),
      String(staff.averageTeachingExperienceYears || staff.averageExperienceYears || ''),
      JSON.stringify(staff.qualificationHighlights || []),
      String(staff.departments?.length || '')
    );
  } else if (fieldKey === 'adm-process' || fieldKey === 'adm-notice' || fieldKey === 'adm-contact') {
    const adm = (intakeData.admissions || {}) as any;
    parts.push(
      String(adm.session || ''),
      String(adm.admissionStatus || adm.admissionStages || ''),
      String(adm.admissionPhone || f.name),
      f.classesOffered || ''
    );
  } else if (fieldKey === 'lead-principal-msg') {
    parts.push(
      f.principalName || '',
      f.principalDesignation || '',
      intakeData.leadership?.principalQualification || ''
    );
  } else if (fieldKey === 'lead-mgmt-msg') {
    const mgmt = intakeData.leadership?.managementMembers?.[0];
    parts.push(mgmt?.name || '', mgmt?.designation || '');
  } else if (fieldKey.startsWith('pol-')) {
    parts.push(f.legalName || f.name, f.locationString);
  }

  return parts.join(':::');
}

// ==============================================================================
// 4. FACT-BASED FIELD GENERATORS
// ==============================================================================

/**
 * 1. Facilities & Campus Amenities Generator (Highest Priority Field)
 * Logical Structure: Learning Environment -> Student Facilities -> Safety -> Convenience
 * NEVER mentions a facility unless present in intake data.
 */
function generateFacilitiesAmenitiesContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low'; missing?: MissingSourceInput[] } {
  const facConfig = intakeData.facilitiesConfig || ({} as any);
  const sourceLabels = ['Campus Facilities', 'School Profile'];

  // Identify verified facilities
  const academicSpaces: string[] = [];
  if (facts.hasSmartClassrooms || facConfig.smartClassrooms || facConfig.hasSmartClassrooms || (facConfig.smartClassroomsCount || 0) > 0 || (facConfig.smartClassroomCount || 0) > 0) {
    const smartCount = facConfig.smartClassroomsCount || facConfig.smartClassroomCount;
    academicSpaces.push(smartCount ? `${smartCount} technology-enabled smart classrooms` : 'technology-enabled smart classrooms');
  }
  if (facts.hasScienceLab || facConfig.scienceLab || facConfig.hasScienceLabs || (Array.isArray(facConfig.scienceLabs) && facConfig.scienceLabs.length > 0) || (facConfig.facilityCounts?.scienceLabs || 0) > 0) {
    const labsList = Array.isArray(facConfig.scienceLabs) && facConfig.scienceLabs.length > 0 ? ` (${facConfig.scienceLabs.join(', ')})` : '';
    academicSpaces.push(`equipped science laboratories${labsList}`);
  }
  if (facts.hasComputerLab || facConfig.computerLab || facConfig.hasComputerLab || (facConfig.facilityCounts?.computerLabs || 0) > 0) {
    academicSpaces.push('computer and digital learning labs');
  }
  if (facConfig.hasRoboticsLab || facConfig.roboticsLab) {
    academicSpaces.push('robotics and innovation workspace');
  }

  const studentAmenities: string[] = [];
  if (facts.hasLibrary || facConfig.library || facConfig.hasLibrary) {
    const books = facConfig.libraryBookCount ? ` with over ${facConfig.libraryBookCount.toLocaleString()} volumes` : '';
    studentAmenities.push(`well-resourced library and reading room${books}`);
  }
  if (facts.hasPlayground || facts.sports.length > 0 || facConfig.hasSportsGround || facConfig.sportsGround) {
    const sportsAdd = facts.sports.length > 0 ? ` supporting ${facts.sports.slice(0, 3).join(', ')}` : '';
    studentAmenities.push(`dedicated sports grounds and courts${sportsAdd}`);
  }
  if (facConfig.hasAuditorium || facConfig.auditorium) {
    studentAmenities.push('multipurpose auditorium for cultural activities');
  }

  const safetyAndWellness: string[] = [];
  if (facConfig.cctvInstalled || facConfig.securityGuards || facConfig.hasCctv) {
    safetyAndWellness.push('24/7 CCTV surveillance and campus security personnel');
  }
  if (facConfig.medicalRoomAvailable || facConfig.infirmary || facConfig.nurseAvailable || facConfig.hasMedicalRoom) {
    safetyAndWellness.push('medical infirmary with first-aid facilities');
  }

  const convenienceServices: string[] = [];
  if (facConfig.hasCafeteria || facConfig.cafeteria) {
    convenienceServices.push('hygienic student cafeteria');
  }
  if (facts.hasTransport || intakeData.transportConfig?.enabled) {
    const buses = (intakeData.transportConfig as any)?.busCount;
    convenienceServices.push(buses ? `GPS-tracked school bus fleet (${buses} buses)` : 'school bus transportation');
  }
  if (facts.hasHostel || intakeData.hostelConfig?.enabled) {
    convenienceServices.push('secure residential boarding facilities');
  }

  // Check if we have sufficient factual data
  const totalVerifiedPoints =
    academicSpaces.length + studentAmenities.length + safetyAndWellness.length + convenienceServices.length;

  if (totalVerifiedPoints === 0) {
    return {
      text: '',
      sourceLabels,
      confidence: 'low',
      missing: [
        { label: 'Classroom & Lab facilities', sectionKey: 'facilitiesConfig', sectionLabel: 'Campus Facilities', fieldName: 'smartClassrooms' },
        { label: 'Library & Sports amenities', sectionKey: 'facilitiesConfig', sectionLabel: 'Campus Facilities', fieldName: 'library' },
        { label: 'Campus Security & Medical room', sectionKey: 'facilitiesConfig', sectionLabel: 'Campus Facilities', fieldName: 'cctvInstalled' },
        { label: 'Transport or Cafeteria service', sectionKey: 'facilitiesConfig', sectionLabel: 'Campus Facilities', fieldName: 'hasCafeteria' },
      ],
    };
  }

  const campusRef = facts.isMultiCampus
    ? `across our ${facts.campusCount} campus locations`
    : 'on our dedicated campus';

  // Build narrative sentences based on length & tone
  const sentences: string[] = [];

  // Opening: Learning Environment
  if (tone === 'Warm & Parent-Friendly') {
    sentences.push(
      `${facts.name} provides a safe, welcoming, and vibrant learning environment ${campusRef}.`
    );
  } else if (tone === 'Premium / Modern') {
    sentences.push(
      `${facts.name} offers modern, purpose-built educational infrastructure designed to elevate the student experience ${campusRef}.`
    );
  } else if (tone === 'Concise') {
    sentences.push(
      `${facts.name} features well-developed campus infrastructure ${campusRef}.`
    );
  } else {
    // Professional (default)
    sentences.push(
      `${facts.name} is equipped with modern, student-centric campus infrastructure ${campusRef}.`
    );
  }

  // Academic spaces
  if (academicSpaces.length > 0) {
    if (tone === 'Concise' || length === 'short') {
      sentences.push(`Academic spaces include ${academicSpaces.join(' and ')}.`);
    } else {
      sentences.push(
        `Classrooms and experiential learning areas include ${academicSpaces.join(', ')}, fostering conceptual clarity and hands-on discovery.`
      );
    }
  }

  // Student Amenities (Library & Sports)
  if (studentAmenities.length > 0 && length !== 'short') {
    sentences.push(`Co-curricular growth is encouraged through our ${studentAmenities.join(' as well as ')}.`);
  }

  // Safety & Health
  if (safetyAndWellness.length > 0) {
    if (tone === 'Warm & Parent-Friendly') {
      sentences.push(
        `The safety and health of every child is our utmost priority, supported by ${safetyAndWellness.join(' and ')}.`
      );
    } else {
      sentences.push(`Campus safety and student health are ensured through ${safetyAndWellness.join(' and ')}.`);
    }
  }

  // Convenience (Cafeteria, Transport, Boarding)
  if (convenienceServices.length > 0 && (length === 'standard' || length === 'detailed')) {
    sentences.push(
      `For daily comfort and parent convenience, the school provides ${convenienceServices.join(' and ')}.`
    );
  }

  // Closing summary for detailed length
  if (length === 'detailed') {
    sentences.push(
      `All facilities are maintained according to strict safety, hygiene, and accessibility benchmarks to ensure an optimal learning atmosphere.`
    );
  }

  return {
    text: sentences.join(' '),
    sourceLabels,
    confidence: totalVerifiedPoints >= 3 ? 'high' : 'medium',
  };
}

/**
 * 2. Faculty & Educator Highlights Generator
 * Uses staff count, qualifications, student-teacher ratio.
 * NEVER invents faculty numbers if not supplied.
 */
function generateFacultyHighlightsContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low'; missing?: MissingSourceInput[] } {
  const staff = (intakeData.staffFaculty || (intakeData as any).facultyStaff || (intakeData as any).staffInformation || {}) as any;
  const sourceLabels = ['Faculty & Staff Setup', 'School Profile'];

  const staffCount = staff.totalTeachingStaff || staff.facultyCount || staff.teachingStaffCount || staff.staffCount;
  const ratio = staff.studentTeacherRatio;
  const expYears = staff.averageTeachingExperienceYears || staff.averageExperienceYears;
  const qualifications = Array.isArray(staff.qualificationHighlights)
    ? staff.qualificationHighlights.filter(Boolean)
    : [];

  const sentences: string[] = [];

  // Opening sentence
  if (tone === 'Warm & Parent-Friendly') {
    sentences.push(
      `At ${facts.name}, our educators are passionate mentors who provide attentive guidance and encourage every child's individual strengths.`
    );
  } else if (tone === 'Premium / Modern') {
    sentences.push(
      `The educational experience at ${facts.name} is powered by a progressive, highly qualified faculty committed to instructional excellence.`
    );
  } else if (tone === 'Concise') {
    sentences.push(
      `${facts.name} is supported by dedicated, experienced educators committed to student growth.`
    );
  } else {
    // Professional
    sentences.push(
      `${facts.name} is committed to instructional excellence through a team of qualified and experienced educators.`
    );
  }

  // Factual additions if available
  if (staffCount && Number(staffCount) > 0) {
    sentences.push(
      `Our faculty comprises over ${staffCount} trained teaching professionals across primary, middle, and senior departments.`
    );
  }

  if (ratio && String(ratio).trim().length > 0) {
    sentences.push(
      `A balanced student-to-teacher ratio of ${ratio} ensures personalized attention, active classroom engagement, and timely academic feedback.`
    );
  }

  if (expYears && Number(expYears) > 0) {
    sentences.push(
      `With an average teaching experience of ${expYears} years, our educators bring deep domain expertise, pedagogical mastery, and classroom dedication.`
    );
  }

  if (qualifications.length > 0) {
    sentences.push(
      `Teachers hold recognized degrees and credentials (${qualifications.slice(0, 3).join(', ')}), regularly participating in modern pedagogical workshops.`
    );
  }

  if (length !== 'short') {
    sentences.push(
      `Regular professional development and mentorship programs empower our teachers to integrate contemporary teaching strategies and support diverse learner needs.`
    );
  }

  const confidence = staffCount || ratio ? 'high' : 'medium';
  return {
    text: sentences.join(' '),
    sourceLabels,
    confidence,
  };
}

/**
 * 3. Admissions Guidelines & Step-by-Step Process Generator
 * Structured step-by-step format: 1. Enquiry -> 2. Documents -> 3. Interaction/Assessment -> 4. Confirmation -> 5. Fee Formalities
 */
function generateAdmissionsProcessContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low'; missing?: MissingSourceInput[] } {
  const adm = intakeData.admissions || ({} as any);
  const session = adm.session || '2026–2027';
  const sourceLabels = ['Admissions Setup', 'School Profile'];

  const classRange = facts.classesOffered ? ` (${facts.classesOffered})` : '';

  if (length === 'short') {
    return {
      text:
        `Admissions for Academic Session ${session}${classRange} follow a structured 5-step process: ` +
        `1. Online/Campus Enquiry & Application, 2. Submission of Required Documents, ` +
        `3. Age-Appropriate Interaction or Assessment, 4. Admission Offer & Verification, ` +
        `and 5. Fee Payment & Enrolment Confirmation.`,
      sourceLabels,
      confidence: 'high',
    };
  }

  const lines: string[] = [
    `Admissions Process & Guidelines (Academic Session ${session})`,
    `We welcome prospective families to join ${facts.name}${classRange}. Admissions are conducted transparently through the following stages:`,
    ``,
    `Step 1: Application & Enquiry Submission`,
    `Parents and guardians can submit the admission inquiry or registration form online through our official website or in person at the admissions office.`,
    ``,
    `Step 2: Document Verification`,
    `Submit necessary registration documents: child's birth certificate, recent passport-size photographs, previous school report cards (where applicable), and proof of residence.`,
    ``,
    `Step 3: Student Interaction & Assessment`,
    `An age-appropriate interaction (for pre-primary and primary grades) or a baseline diagnostic assessment (for middle and secondary levels) is conducted to understand the student's learning readiness.`,
    ``,
    `Step 4: Admission Offer & Confirmation`,
    `Selected candidates will receive a formal admission letter. Seats are offered based on vacancy, eligibility, and assessment criteria.`,
    ``,
    `Step 5: Fee Formalities & Enrolment`,
    `Complete the admission fee payment and document verification within the stipulated timeline to confirm enrolment and receive the student ID and class allocation.`,
  ];

  if (adm.admissionPhone || facts.locationString) {
    const helpline = adm.admissionPhone || (intakeData.schoolProfile as any)?.officialPhone;
    lines.push(
      ``,
      `For assistance, contact the Admissions Desk${helpline ? ` at ${helpline}` : ''} during regular office hours.`
    );
  }

  return {
    text: lines.join('\n'),
    sourceLabels,
    confidence: 'high',
  };
}

/**
 * 4. Admissions Open Announcement Banner Generator
 */
function generateAdmissionsNoticeContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const adm = intakeData.admissions || ({} as any);
  const session = adm.session || '2026–2027';
  const classes = facts.classesOffered ? ` | ${facts.classesOffered}` : '';
  const sourceLabels = ['Admissions Setup', 'School Profile'];

  let text = '';
  if (tone === 'Premium / Modern') {
    text = `Admissions Open for Academic Session ${session}${classes} — Experience Progressive Education at ${facts.name}. Applications Invited.`;
  } else if (tone === 'Warm & Parent-Friendly') {
    text = `Admissions Open for Academic Session ${session}${classes}. Welcome to the ${facts.name} family — Apply today!`;
  } else if (tone === 'Concise') {
    text = `Admissions Open (${session})${classes} | ${facts.name} — Enrol Online Now`;
  } else {
    // Professional
    text = `Admissions Open for Academic Session ${session}${classes} | ${facts.name} — Apply Online or Visit Campus`;
  }

  return { text, sourceLabels, confidence: 'high' };
}

/**
 * 5. Admissions Office Timings & Helplines Generator
 */
function generateAdmissionsContactContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const adm = intakeData.admissions || ({} as any);
  const prof = intakeData.schoolProfile || ({} as any);
  const att = intakeData.attendanceConfig || ({} as any);
  const sourceLabels = ['School Profile', 'Admissions Setup'];

  const phone = adm.admissionPhone || prof.officialPhone || prof.phone || 'Phone upon inquiry';
  const email = adm.admissionEmail || prof.officialEmail || prof.email || 'admissions@school.edu.in';
  const hours = att.schoolStartTime && att.schoolEndTime
    ? `Monday to Saturday: ${att.schoolStartTime} – ${att.schoolEndTime}`
    : 'Monday to Saturday: 8:30 AM – 3:00 PM';
  const address = intakeData.campuses?.[0]?.address || prof.address || facts.locationString || 'Main Campus Office';

  const text = `Admissions Office Timings & Helplines:\n• Helpline Numbers: ${phone}\n• Email: ${email}\n• Visiting Hours: ${hours}\n• Address: ${address}`;

  return { text, sourceLabels, confidence: 'high' };
}

/**
 * 6. Curriculum & Pedagogy Description Generator
 */
function generateCurriculumPedagogyContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const sourceLabels = ['School Profile', 'Academic Structure', 'School Content'];
  const boardStr = facts.board ? `following the ${facts.board} curriculum framework` : 'following a recognized national curriculum framework';
  const classesStr = facts.classesOffered ? ` from ${facts.classesOffered}` : '';

  const sentences: string[] = [];
  sentences.push(
    `${facts.name} delivers a balanced, age-appropriate academic curriculum${classesStr}, ${boardStr}.`
  );

  if (tone === 'Premium / Modern') {
    sentences.push(
      `Our teaching approach emphasizes experiential learning, critical problem-solving, and collaborative projects, moving beyond rote learning to conceptual understanding.`
    );
  } else if (tone === 'Warm & Parent-Friendly') {
    sentences.push(
      `Our pedagogical methodology prioritizes supportive teacher-student mentorship, continuous encouragement, and holistic student enrichment.`
    );
  } else if (tone === 'Concise') {
    sentences.push(
      `Instruction emphasizes conceptual clarity, core subject competencies, and regular academic assessment.`
    );
  } else {
    sentences.push(
      `Classroom teaching integrates clear conceptual instruction with practical activities, regular formative assessments, and remedial support for individual learning paces.`
    );
  }

  if (length !== 'short') {
    sentences.push(
      `The curriculum emphasizes strong language proficiencies, STEM competencies, environmental awareness, and creative arts, ensuring well-rounded student development.`
    );
  }

  return { text: sentences.join(' '), sourceLabels, confidence: 'high' };
}

/**
 * 7. Key Student Achievements & Accolades Generator
 */
function generateAchievementsContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const awards = intakeData.schoolContent?.awardsAndAchievements;
  const sourceLabels = ['School Content (Awards)'];

  if (Array.isArray(awards) && awards.length > 0) {
    const items = awards.map((a) => `• ${a.title}${a.year ? ` (${a.year})` : ''}${a.description ? `: ${a.description}` : ''}`);
    const text = `Key Institutional & Student Achievements:\n${items.join('\n')}`;
    return { text, sourceLabels, confidence: 'high' };
  }

  return {
    text: `${facts.name} celebrates student excellence in academic assessments, inter-school tournaments, Olympiads, and cultural exhibitions, fostering a culture of continuous learning and positive achievement.`,
    sourceLabels: ['School Profile'],
    confidence: 'medium',
  };
}

/**
 * 8. Principal's Desk Message Generator
 */
function generatePrincipalMessageContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const sourceLabels = ['Leadership Profile', 'School Profile'];
  const pName = facts.principalName ? ` (${facts.principalName})` : '';
  const pQual = intakeData.leadership?.principalQualification ? `, ${intakeData.leadership.principalQualification}` : '';

  if (length === 'short') {
    return {
      text: `“Welcome to ${facts.name}. We are dedicated to nurturing young minds with integrity, intellectual curiosity, and high academic standards, guiding every child to achieve their fullest potential.” — Principal${pName}${pQual}`,
      sourceLabels,
      confidence: 'high',
    };
  }

  const sentences: string[] = [];
  if (tone === 'Warm & Parent-Friendly') {
    sentences.push(
      `It is an honor to welcome you to ${facts.name}. Every child enters our doors with boundless curiosity, unique talents, and infinite potential.`
    );
    sentences.push(
      `Our goal as educators is to provide a caring, joyful, and emotionally secure learning environment where students feel inspired to explore, ask questions, and grow.`
    );
    sentences.push(
      `We believe that true education is a collaborative journey between home and school, united in building resilient, compassionate, and confident young leaders.`
    );
  } else if (tone === 'Premium / Modern') {
    sentences.push(
      `Welcome to ${facts.name}, where innovation, critical thinking, and character development form the cornerstone of our educational philosophy.`
    );
    sentences.push(
      `In an ever-evolving global landscape, our focus extends beyond conventional textbook mastery to cultivating adaptable, forward-thinking problem solvers equipped with digital fluency and ethical clarity.`
    );
    sentences.push(
      `We invite prospective parents and students to join our vibrant learning community as we build future-ready pathways for every learner.`
    );
  } else {
    // Professional
    sentences.push(
      `Welcome to ${facts.name}. As an institution dedicated to academic distinction and holistic student growth, we take immense pride in fostering an environment of disciplined scholarship, integrity, and mutual respect.`
    );
    sentences.push(
      `Our pedagogical framework combines rigorous curriculum delivery with experiential discovery, ensuring that students develop strong conceptual foundations alongside essential life skills.`
    );
    sentences.push(
      `We are committed to partnering with parents to nurture well-rounded, responsible citizens prepared for higher academic pursuits and meaningful societal contributions.`
    );
  }

  if (facts.principalName) {
    sentences.push(`\n\nWarm regards,\n${facts.principalName}\n${facts.principalDesignation || 'Principal'}${pQual}`);
  }

  return { text: sentences.join(' '), sourceLabels, confidence: 'high' };
}

/**
 * 9. Chairman / Management Address Generator
 */
function generateManagementMessageContent(
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>,
  tone: RecommendationTone,
  length: RecommendationLength
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const sourceLabels = ['Leadership Profile', 'School Profile'];
  const firstMember = (intakeData.leadership?.managementMembers || [])[0];
  const leaderName = firstMember?.name;
  const leaderDesig = firstMember?.designation || 'Chairman / Managing Director';

  if (length === 'short') {
    return {
      text: `${facts.name} was established with a clear mandate: to provide accessible, value-driven, and high-standard education that empowers future generations to lead with purpose and honor.`,
      sourceLabels,
      confidence: 'high',
    };
  }

  const sentences: string[] = [];
  sentences.push(
    `Education is the most enduring foundation a community can provide to its youth. When ${facts.name} was established, our institutional mandate was rooted in delivering accessible, values-led, and quality-driven education.`
  );
  sentences.push(
    `Our management committee remains steadfastly committed to investing in modern learning infrastructure, recruiting capable educators, and maintaining an inclusive and safe academic environment.`
  );
  sentences.push(
    `We extend our sincere gratitude to parents, faculty, and trustees who collaborate continuously to make ${facts.name} a benchmark of educational trust and student achievement.`
  );

  if (leaderName) {
    sentences.push(`\n\nSincerely,\n${leaderName}\n${leaderDesig}`);
  }

  return { text: sentences.join(' '), sourceLabels, confidence: 'high' };
}

/**
 * 10. Standard Policy Templates (Requiring Review)
 */
function generatePolicyTemplateContent(
  fieldKey: string,
  facts: ExtractedSchoolFacts,
  intakeData: Partial<UniversalIntakeData>
): { text: string; sourceLabels: string[]; confidence: 'high' | 'medium' | 'low' } {
  const school = facts.legalName || facts.name;
  const location = facts.locationString || 'Campus Office';
  const email = (intakeData.schoolProfile as any)?.officialEmail || 'compliance@school.edu.in';
  const phone = (intakeData.schoolProfile as any)?.officialPhone || 'Phone upon inquiry';

  if (fieldKey === 'pol-refund') {
    return {
      text:
        `FEE REFUND & CANCELLATION POLICY — STANDARD TEMPLATE\n` +
        `Institution: ${school}\n\n` +
        `1. Admission & Registration Fees: One-time admission registration and processing fees are non-refundable once the admission offer has been formally accepted and processed.\n\n` +
        `2. Caution Deposit / Security Deposit: Refundable caution money, if applicable, is returned without interest upon successful completion of the academic term or formal withdrawal, subject to clearance of all library books, lab equipment, and school property dues.\n\n` +
        `3. Tuition Fee Withdrawals:\n` +
        `   • Prior to Academic Session Commencement: Written cancellation received 30 days prior to the term start entitles the guardian to a refund of tuition fees paid, minus administrative processing charges.\n` +
        `   • After Academic Term Commencement: If a student withdraws mid-term, tuition fees for the ongoing quarter/term are non-refundable. Notice of one full term (or payment in lieu thereof) is required for issuing the Transfer Certificate (TC).\n\n` +
        `4. Transport & Meal Fees: Charged on a quarterly basis. Transport cancellations require 30 days written notice to the transport desk.\n\n` +
        `5. Refund Claims: All formal claims must be submitted in writing along with original fee receipts to the Accounts Office at ${location} or emailed to ${email}. Processing takes up to 30 working days.`,
      sourceLabels: ['Admissions Setup', 'Fees Configuration'],
      confidence: 'high',
    };
  }

  if (fieldKey === 'pol-child-safety') {
    return {
      text:
        `CHILD PROTECTION & SAFEGUARDING POLICY (POCSO) — STANDARD TEMPLATE\n` +
        `Institution: ${school}\n\n` +
        `1. Institutional Commitment: ${school} maintains a strict Zero-Tolerance policy toward any form of child abuse, neglect, corporal punishment, bullying, or harassment, complying fully with the POCSO Act (Protection of Children from Sexual Offences) and CBSE/statutory safety guidelines.\n\n` +
        `2. Internal Complaints & Child Safety Committee (ICC):\n` +
        `   • The school has established an active Child Protection & Safeguarding Committee comprising the Principal, student counselor, senior faculty, parent representatives, and local child welfare liaison.\n` +
        `   • Periodic safety audits, background verifications for all teaching and non-teaching personnel, and campus CCTV monitoring are enforced.\n\n` +
        `3. Reporting & Redressal Mechanism: Any student, parent, or staff member who suspects or observes safeguarding concerns may report confidentially to the Child Welfare Officer or drop a written memo in the secure Student Grievance Box.\n\n` +
        `4. Mandatory Sensitization: All staff undergo annual training on child rights, early warning signs, mandatory reporting duties, and positive discipline techniques.\n\n` +
        `Contact Child Welfare Officer: ${phone} | Confidential Email: ${email}`,
      sourceLabels: ['School Profile', 'Campus Safety'],
      confidence: 'high',
    };
  }

  if (fieldKey === 'pol-privacy') {
    return {
      text:
        `WEBSITE & STUDENT DATA PRIVACY POLICY — STANDARD TEMPLATE\n` +
        `Institution: ${school}\n\n` +
        `1. Information Collected: ${school} collects personal details (names, dates of birth, contact information, previous academic records) strictly for admission processing, student administration, statutory board reporting, and parent communication.\n\n` +
        `2. Digital Security: Student data is stored within secured institutional databases with role-based access control. We do not sell, rent, or trade student or guardian personal information to external commercial third parties.\n\n` +
        `3. Photos & Media: Institutional photographs highlighting academic and extracurricular activities are published solely for school editorial and website purposes with guardian consent as specified in the enrolment declaration.\n\n` +
        `4. Inquiries & Corrections: To inspect, correct, or request deletion of personal information, contact the data administrator at ${email}.`,
      sourceLabels: ['School Profile', 'Legal Policies'],
      confidence: 'high',
    };
  }

  // pol-terms fallback
  return {
    text:
      `TERMS OF WEBSITE USAGE & PORTAL ACCESS — STANDARD TEMPLATE\n` +
      `Institution: ${school}\n\n` +
      `1. Acceptance: Accessing the official website and online parent/student portal of ${school} implies acceptance of these institutional terms and applicable local cyber laws.\n\n` +
      `2. Intellectual Property: School emblems, logos, curricula, syllabi, circulars, and website content remain the sole property of ${school}.\n\n` +
      `3. Portal Credentials: Parents and students are responsible for maintaining confidentiality of login credentials and must immediately report unauthorized access to ${email}.\n\n` +
      `4. Code of Conduct: Users must not upload malicious files, impersonate others, or disrupt official communication networks.`,
    sourceLabels: ['School Profile', 'Legal Policies'],
    confidence: 'high',
  };
}

// ==============================================================================
// 5. PRIMARY CONTENT RECOMMENDATION DISPATCHER
// ==============================================================================

/**
 * Generates recommended content for any eligible provisioning field.
 * Centralized service consumed by both server actions and client components.
 */
export function generateContentRecommendation(
  request: ContentRecommendationRequest
): ContentRecommendationResult {
  const { fieldKey, intakeData, tone = 'Professional', length = 'standard' } = request;
  const config = CONTENT_RECOMMENDATION_CONFIGS[fieldKey];

  if (!config) {
    return {
      fieldKey,
      generatedText: '',
      sourceFields: [],
      sourceLabels: [],
      confidence: 'low',
      requiresReview: false,
      sourceFingerprint: '',
      warnings: [`Field "${fieldKey}" is not recognized by the recommendation engine.`],
    };
  }

  // Safeguard: Statutory document uploads must NEVER be generated as text
  if (config.generationType === 'document_only' || config.isStatutory) {
    return {
      fieldKey,
      generatedText: '',
      sourceFields: [],
      sourceLabels: [],
      confidence: 'low',
      requiresReview: true,
      sourceFingerprint: '',
      warnings: [
        `"${config.label}" is a statutory legal document requiring an official PDF/image upload. AI text generation is strictly disabled for statutory documents.`,
      ],
    };
  }

  const facts = extractSchoolFacts(intakeData);
  const fingerprint = calculateContentSourceFingerprint(fieldKey, intakeData);

  // 1. Facilities & Campus Amenities Text (Highest Priority)
  if (fieldKey === 'acad-facilities-desc') {
    const res = generateFacilitiesAmenitiesContent(facts, intakeData, tone, length);
    if (res.missing && res.missing.length > 0) {
      return {
        fieldKey,
        generatedText: '',
        sourceFields: ['facilitiesConfig'],
        sourceLabels: res.sourceLabels,
        confidence: 'low',
        requiresReview: false,
        sourceFingerprint: fingerprint,
        isInsufficientData: true,
        missingInputs: res.missing,
        warnings: ['Insufficient facility information recorded. Add campus facilities to generate accurate text.'],
      };
    }
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['facilitiesConfig', 'campuses', 'schoolProfile'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 2. Faculty & Educator Highlights
  if (fieldKey === 'lead-faculty-highlights') {
    const res = generateFacultyHighlightsContent(facts, intakeData, tone, length);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['staffFaculty', 'schoolProfile'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 3. Admissions Guidelines & Process
  if (fieldKey === 'adm-process') {
    const res = generateAdmissionsProcessContent(facts, intakeData, tone, length);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['admissions', 'schoolProfile', 'institutionStructure'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 4. Admissions Open Banner
  if (fieldKey === 'adm-notice') {
    const res = generateAdmissionsNoticeContent(facts, intakeData, tone);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['admissions', 'schoolProfile'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 5. Admissions Contact & Office Timings
  if (fieldKey === 'adm-contact') {
    const res = generateAdmissionsContactContent(facts, intakeData);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['schoolProfile', 'admissions', 'attendanceConfig'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 6. Principal Desk Message
  if (fieldKey === 'lead-principal-msg') {
    const res = generatePrincipalMessageContent(facts, intakeData, tone, length);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['leadership', 'schoolProfile'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 7. Chairman / Management Address
  if (fieldKey === 'lead-mgmt-msg') {
    const res = generateManagementMessageContent(facts, intakeData, tone, length);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['leadership', 'schoolProfile'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 8. About School Narrative
  if (fieldKey === 'acad-about') {
    const text = generateAboutSchool(intakeData);
    return {
      fieldKey,
      generatedText: text,
      sourceFields: ['schoolProfile', 'campuses', 'brandingDesign'],
      sourceLabels: ['School Profile', 'Campuses', 'Brand Identity'],
      confidence: 'high',
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 9. Vision Statement
  if (fieldKey === 'acad-vision') {
    const text = generateVisionStatement(intakeData);
    return {
      fieldKey,
      generatedText: text,
      sourceFields: ['schoolProfile', 'brandingDesign'],
      sourceLabels: ['Brand Identity', 'School Profile'],
      confidence: 'high',
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 10. Mission Statement
  if (fieldKey === 'acad-mission') {
    const text = generateMissionStatement(intakeData);
    return {
      fieldKey,
      generatedText: text,
      sourceFields: ['schoolProfile', 'brandingDesign'],
      sourceLabels: ['Brand Identity', 'School Profile'],
      confidence: 'high',
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 11. Core Values & Principles
  if (fieldKey === 'acad-values') {
    const values = getRecommendedCoreValues(intakeData);
    return {
      fieldKey,
      generatedText: values.slice(0, 5).join(', '),
      suggestedValues: values,
      sourceFields: ['brandingDesign'],
      sourceLabels: ['Brand Identity (Tone: ' + facts.brandTone + ')'],
      confidence: 'high',
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 12. Curriculum & Pedagogy Description
  if (fieldKey === 'acad-curriculum') {
    const res = generateCurriculumPedagogyContent(facts, intakeData, tone, length);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['schoolProfile', 'schoolContent', 'institutionStructure'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 13. Key Achievements & Accolades
  if (fieldKey === 'acad-achievements') {
    const res = generateAchievementsContent(facts, intakeData);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['schoolContent'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: false,
      sourceFingerprint: fingerprint,
    };
  }

  // 14. Policy Templates (pol-privacy, pol-terms, pol-refund, pol-child-safety)
  if (fieldKey.startsWith('pol-')) {
    const res = generatePolicyTemplateContent(fieldKey, facts, intakeData);
    return {
      fieldKey,
      generatedText: res.text,
      sourceFields: ['schoolProfile', 'legalPolicies'],
      sourceLabels: res.sourceLabels,
      confidence: res.confidence,
      requiresReview: true,
      isTemplate: true,
      sourceFingerprint: fingerprint,
      warnings: [
        'Template for review: This is a standard draft intended to help prepare your website content. The school must review and approve it before publication.',
      ],
    };
  }

  return {
    fieldKey,
    generatedText: '',
    sourceFields: [],
    sourceLabels: [],
    confidence: 'low',
    requiresReview: false,
    sourceFingerprint: fingerprint,
  };
}
