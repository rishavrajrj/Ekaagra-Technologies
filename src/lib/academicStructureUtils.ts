/**
 * PRODUCTION-GRADE ACADEMIC STRUCTURE UTILITIES & CANONICAL DATA ENGINE
 *
 * Provides:
 * 1. Default suggested catalogs (Curriculum boards, naming conventions, suggested classes, streams).
 * 2. Normalization & safe legacy migration (preserves existing drafts without data loss, adds stable IDs).
 * 3. Validation & constraint checking (session dates, duplicate classes, duplicate sections, confirmation).
 * 4. Derived metadata synchronizer (classesOfferedFrom/To, totalSectionsEstimated, academicStreams).
 * 5. Downstream website representation (classes offered, streams summary).
 */

import type {
  AcademicStructureData,
  AcademicClassConfig,
  ClassSectionConfig,
  AcademicStreamConfig,
  AcademicProgramConfig,
  AcademicSubjectConfig,
  AcademicSubject,
  TeachingGroup,
  TeachingGroupStructureType,
  SubjectApplicabilityConfig,
  SubjectTeacherAssignment,
  ClassTeacherAssignment,
  StaffMember,
  CampusBranchData,
  SchoolIdentityData,
} from './types';

// ─── DEFAULT SUGGESTED CATALOGS ──────────────────────────────────────────────

export const DEFAULT_CURRICULUM_BOARDS = [
  'CBSE',
  'ICSE',
  'CISCE',
  'State Board',
  'IB',
  'Cambridge',
  'NIOS',
  'Montessori',
  'International',
  'Other',
] as const;

export type CurriculumBoardOption = (typeof DEFAULT_CURRICULUM_BOARDS)[number];

export const DEFAULT_NAMING_CONVENTIONS = [
  'Class',
  'Grade',
  'Standard',
  'Custom',
] as const;

export type NamingConventionOption = (typeof DEFAULT_NAMING_CONVENTIONS)[number];

export const DEFAULT_ACADEMIC_LEVELS = [
  'Pre-Primary',
  'Primary',
  'Middle',
  'Secondary',
  'Senior Secondary',
  'Special Program',
  'Other',
] as const;

export const DEFAULT_STREAM_SUGGESTIONS = [
  'Science',
  'Commerce',
  'Humanities',
  'Vocational',
] as const;

export const DEFAULT_PROGRAM_SUGGESTIONS = [
  'Foundation',
  'IIT Foundation',
  'NEET Foundation',
  'Vocational',
  'Montessori',
  'Integrated Program',
  'Special Batch',
] as const;

// ─── ID GENERATOR ────────────────────────────────────────────────────────────

let idCounter = 0;
export function generateAcademicId(prefix = 'id'): string {
  idCounter++;
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}_${idCounter}`;
}

// ─── DEFAULT SUGGESTED STRUCTURE ─────────────────────────────────────────────

export const DEFAULT_SUGGESTED_CLASSES: AcademicClassConfig[] = [
  {
    id: 'cls_sugg_nur',
    name: 'Nursery',
    code: 'NUR',
    level: 'Pre-Primary',
    sortOrder: 1,
    displayOrder: 1,
    isActive: true,
    sections: ['A'],
  },
  {
    id: 'cls_sugg_lkg',
    name: 'LKG',
    code: 'LKG',
    level: 'Pre-Primary',
    sortOrder: 2,
    displayOrder: 2,
    isActive: true,
    sections: ['A'],
  },
  {
    id: 'cls_sugg_ukg',
    name: 'UKG',
    code: 'UKG',
    level: 'Pre-Primary',
    sortOrder: 3,
    displayOrder: 3,
    isActive: true,
    sections: ['A'],
  },
  {
    id: 'cls_sugg_c1',
    name: 'Class 1',
    code: 'STD-1',
    level: 'Primary',
    sortOrder: 4,
    displayOrder: 4,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c2',
    name: 'Class 2',
    code: 'STD-2',
    level: 'Primary',
    sortOrder: 5,
    displayOrder: 5,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c3',
    name: 'Class 3',
    code: 'STD-3',
    level: 'Primary',
    sortOrder: 6,
    displayOrder: 6,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c4',
    name: 'Class 4',
    code: 'STD-4',
    level: 'Primary',
    sortOrder: 7,
    displayOrder: 7,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c5',
    name: 'Class 5',
    code: 'STD-5',
    level: 'Primary',
    sortOrder: 8,
    displayOrder: 8,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c6',
    name: 'Class 6',
    code: 'STD-6',
    level: 'Middle',
    sortOrder: 9,
    displayOrder: 9,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c7',
    name: 'Class 7',
    code: 'STD-7',
    level: 'Middle',
    sortOrder: 10,
    displayOrder: 10,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c8',
    name: 'Class 8',
    code: 'STD-8',
    level: 'Middle',
    sortOrder: 11,
    displayOrder: 11,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c9',
    name: 'Class 9',
    code: 'STD-9',
    level: 'Secondary',
    sortOrder: 12,
    displayOrder: 12,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c10',
    name: 'Class 10',
    code: 'STD-10',
    level: 'Secondary',
    sortOrder: 13,
    displayOrder: 13,
    isActive: true,
    sections: ['A', 'B'],
  },
  {
    id: 'cls_sugg_c11',
    name: 'Class 11',
    code: 'STD-11',
    level: 'Senior Secondary',
    sortOrder: 14,
    displayOrder: 14,
    isActive: true,
    sections: ['A'],
    streams: [
      { id: 'strm_c11_sci', name: 'Science', sections: ['A', 'B'] },
      { id: 'strm_c11_com', name: 'Commerce', sections: ['A'] },
      { id: 'strm_c11_hum', name: 'Humanities', sections: ['A'] },
    ],
  },
  {
    id: 'cls_sugg_c12',
    name: 'Class 12',
    code: 'STD-12',
    level: 'Senior Secondary',
    sortOrder: 15,
    displayOrder: 15,
    isActive: true,
    sections: ['A'],
    streams: [
      { id: 'strm_c12_sci', name: 'Science', sections: ['A', 'B'] },
      { id: 'strm_c12_com', name: 'Commerce', sections: ['A'] },
      { id: 'strm_c12_hum', name: 'Humanities', sections: ['A'] },
    ],
  },
];

// ─── CANONICAL SCHOOL TYPE CATALOG & DYNAMIC ACADEMIC RANGE ──────────────────

export interface SchoolTypeCatalogEntry {
  schoolType: string;
  displayLabel: string;
  shortLabel: string;
  classRange: string;
  classesOfferedFrom: string;
  classesOfferedTo: string;
  estimatedClassCount: number;
  description: string;
  suggestedClasses: Array<{
    name: string;
    code: string;
    level: string;
    sections: string[];
    streams?: Array<{ name: string; sections: string[] }>;
  }>;
}

export const SCHOOL_TYPE_CATALOG: Record<string, SchoolTypeCatalogEntry> = {
  'K-12 School (Kindergarten to 12th)': {
    schoolType: 'K-12 School (Kindergarten to 12th)',
    displayLabel: 'K-12 School (Complete KG / Nursery to 12th Standard)',
    shortLabel: 'K-12 School',
    classRange: 'Nursery to Class 12',
    classesOfferedFrom: 'Nursery',
    classesOfferedTo: 'Class 12',
    estimatedClassCount: 15,
    description: 'Complete schooling continuum from early childhood (Nursery/KG) through 12th Grade (Senior Secondary 10+2).',
    suggestedClasses: [
      { name: 'Nursery', code: 'NUR', level: 'Pre-Primary', sections: ['A'] },
      { name: 'LKG', code: 'LKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'UKG', code: 'UKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'Class 1', code: 'STD-1', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 2', code: 'STD-2', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 3', code: 'STD-3', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 4', code: 'STD-4', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 5', code: 'STD-5', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 6', code: 'STD-6', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 7', code: 'STD-7', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 8', code: 'STD-8', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 9', code: 'STD-9', level: 'Secondary', sections: ['A', 'B'] },
      { name: 'Class 10', code: 'STD-10', level: 'Secondary', sections: ['A', 'B'] },
      {
        name: 'Class 11',
        code: 'STD-11',
        level: 'Senior Secondary',
        sections: ['A'],
        streams: [
          { name: 'Science', sections: ['A', 'B'] },
          { name: 'Commerce', sections: ['A'] },
          { name: 'Humanities', sections: ['A'] },
        ],
      },
      {
        name: 'Class 12',
        code: 'STD-12',
        level: 'Senior Secondary',
        sections: ['A'],
        streams: [
          { name: 'Science', sections: ['A', 'B'] },
          { name: 'Commerce', sections: ['A'] },
          { name: 'Humanities', sections: ['A'] },
        ],
      },
    ],
  },
  'Senior Secondary School (10+2)': {
    schoolType: 'Senior Secondary School (10+2)',
    displayLabel: 'Senior Secondary School (Class 11 - 12 / 10+2 Intermediate)',
    shortLabel: 'Senior Secondary',
    classRange: 'Class 11 to Class 12 (10+2)',
    classesOfferedFrom: 'Class 11',
    classesOfferedTo: 'Class 12',
    estimatedClassCount: 2,
    description: 'Focused intermediate junior college curriculum specializing in Higher Secondary / 10+2 streams.',
    suggestedClasses: [
      {
        name: 'Class 11',
        code: 'STD-11',
        level: 'Senior Secondary',
        sections: ['A'],
        streams: [
          { name: 'Science', sections: ['A', 'B'] },
          { name: 'Commerce', sections: ['A'] },
          { name: 'Humanities', sections: ['A'] },
        ],
      },
      {
        name: 'Class 12',
        code: 'STD-12',
        level: 'Senior Secondary',
        sections: ['A'],
        streams: [
          { name: 'Science', sections: ['A', 'B'] },
          { name: 'Commerce', sections: ['A'] },
          { name: 'Humanities', sections: ['A'] },
        ],
      },
    ],
  },
  'Secondary School (Up to 10th)': {
    schoolType: 'Secondary School (Up to 10th)',
    displayLabel: 'Secondary / High School (Up to 10th / Matriculation)',
    shortLabel: 'Secondary School',
    classRange: 'Nursery to Class 10',
    classesOfferedFrom: 'Nursery',
    classesOfferedTo: 'Class 10',
    estimatedClassCount: 13,
    description: 'High school program concluding with Board Matriculation / 10th Standard certifications.',
    suggestedClasses: [
      { name: 'Nursery', code: 'NUR', level: 'Pre-Primary', sections: ['A'] },
      { name: 'LKG', code: 'LKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'UKG', code: 'UKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'Class 1', code: 'STD-1', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 2', code: 'STD-2', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 3', code: 'STD-3', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 4', code: 'STD-4', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 5', code: 'STD-5', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 6', code: 'STD-6', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 7', code: 'STD-7', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 8', code: 'STD-8', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 9', code: 'STD-9', level: 'Secondary', sections: ['A', 'B'] },
      { name: 'Class 10', code: 'STD-10', level: 'Secondary', sections: ['A', 'B'] },
    ],
  },
  'Middle School (Class 1 to 8)': {
    schoolType: 'Middle School (Class 1 to 8)',
    displayLabel: 'Middle / Upper Primary School (Class 1 to 8th)',
    shortLabel: 'Middle School',
    classRange: 'Class 1 to Class 8',
    classesOfferedFrom: 'Class 1',
    classesOfferedTo: 'Class 8',
    estimatedClassCount: 8,
    description: 'Primary and middle school education spanning 1st through 8th Grade under RTE guidelines.',
    suggestedClasses: [
      { name: 'Class 1', code: 'STD-1', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 2', code: 'STD-2', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 3', code: 'STD-3', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 4', code: 'STD-4', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 5', code: 'STD-5', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 6', code: 'STD-6', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 7', code: 'STD-7', level: 'Middle', sections: ['A', 'B'] },
      { name: 'Class 8', code: 'STD-8', level: 'Middle', sections: ['A', 'B'] },
    ],
  },
  'Primary School (Class 1 to 5)': {
    schoolType: 'Primary School (Class 1 to 5)',
    displayLabel: 'Primary School (Nursery / KG to Class 5th)',
    shortLabel: 'Primary School',
    classRange: 'Nursery to Class 5',
    classesOfferedFrom: 'Nursery',
    classesOfferedTo: 'Class 5',
    estimatedClassCount: 8,
    description: 'Early foundational and primary learning environment from Nursery through Grade 5.',
    suggestedClasses: [
      { name: 'Nursery', code: 'NUR', level: 'Pre-Primary', sections: ['A'] },
      { name: 'LKG', code: 'LKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'UKG', code: 'UKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'Class 1', code: 'STD-1', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 2', code: 'STD-2', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 3', code: 'STD-3', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 4', code: 'STD-4', level: 'Primary', sections: ['A', 'B'] },
      { name: 'Class 5', code: 'STD-5', level: 'Primary', sections: ['A', 'B'] },
    ],
  },
  'Play School / Pre-School': {
    schoolType: 'Play School / Pre-School',
    displayLabel: 'Play School / Pre-School (Playgroup, Nursery, LKG, UKG)',
    shortLabel: 'Play School',
    classRange: 'Playgroup to UKG (Pre-School)',
    classesOfferedFrom: 'Playgroup',
    classesOfferedTo: 'UKG',
    estimatedClassCount: 4,
    description: 'Early childhood development and activity-led kindergarten foundation for toddlers and young learners.',
    suggestedClasses: [
      { name: 'Playgroup', code: 'PG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'Nursery', code: 'NUR', level: 'Pre-Primary', sections: ['A'] },
      { name: 'LKG', code: 'LKG', level: 'Pre-Primary', sections: ['A'] },
      { name: 'UKG', code: 'UKG', level: 'Pre-Primary', sections: ['A'] },
    ],
  },
  'Coaching / Academy': {
    schoolType: 'Coaching / Academy',
    displayLabel: 'Coaching Institute / Academy / Junior College',
    shortLabel: 'Coaching / Academy',
    classRange: 'Foundation & Target Batches',
    classesOfferedFrom: 'Foundation Batch',
    classesOfferedTo: 'Target Batch',
    estimatedClassCount: 3,
    description: 'Competitive entrance preparation, Olympiads, JEE/NEET coaching, and foundational tutorial programs.',
    suggestedClasses: [
      { name: 'Foundation Batch (Class 9-10)', code: 'FND-1', level: 'Secondary', sections: ['Batch A', 'Batch B'] },
      { name: 'Target Batch (JEE / NEET)', code: 'TGT-1', level: 'Senior Secondary', sections: ['Batch A', 'Batch B'] },
      { name: 'Crash Course / Test Series', code: 'CRS-1', level: 'Special Program', sections: ['Batch 1'] },
    ],
  },
  'Other': {
    schoolType: 'Other',
    displayLabel: 'Other Institutional Setup',
    shortLabel: 'Other Setup',
    classRange: 'Custom Institutional Setup',
    classesOfferedFrom: 'Junior Division',
    classesOfferedTo: 'Senior Division',
    estimatedClassCount: 2,
    description: 'Custom academic structure tailored to specific vocational, special education, or modular programs.',
    suggestedClasses: [
      { name: 'Junior Division', code: 'JD-1', level: 'Primary', sections: ['A'] },
      { name: 'Senior Division', code: 'SD-1', level: 'Secondary', sections: ['A'] },
    ],
  },
};

/**
 * Resolves canonical SchoolTypeCatalogEntry for any user-supplied schoolType string.
 * Supports normalization across legacy values, case variations, and partial keywords.
 */
export function getSchoolTypeConfig(schoolType?: string | null): SchoolTypeCatalogEntry {
  const raw = (schoolType || '').trim();
  if (!raw) {
    return SCHOOL_TYPE_CATALOG['K-12 School (Kindergarten to 12th)'];
  }

  // Exact match
  if (SCHOOL_TYPE_CATALOG[raw]) {
    return SCHOOL_TYPE_CATALOG[raw];
  }

  const norm = raw.toLowerCase();

  // Play School / Pre-School
  if (
    norm.includes('play') ||
    norm.includes('pre-school') ||
    norm.includes('preschool') ||
    norm.includes('kindergarten') && !norm.includes('12')
  ) {
    return SCHOOL_TYPE_CATALOG['Play School / Pre-School'];
  }

  // Senior Secondary
  if (
    norm.includes('senior secondary') ||
    norm.includes('10+2') ||
    norm.includes('intermediate') ||
    norm.includes('11 - 12') ||
    norm.includes('junior college')
  ) {
    return SCHOOL_TYPE_CATALOG['Senior Secondary School (10+2)'];
  }

  // Secondary School
  if (
    norm.includes('secondary') ||
    norm.includes('up to 10th') ||
    norm.includes('high school') ||
    norm.includes('matriculation')
  ) {
    return SCHOOL_TYPE_CATALOG['Secondary School (Up to 10th)'];
  }

  // Middle School
  if (
    norm.includes('middle') ||
    norm.includes('class 1 to 8') ||
    norm.includes('upper primary')
  ) {
    return SCHOOL_TYPE_CATALOG['Middle School (Class 1 to 8)'];
  }

  // Primary School
  if (
    norm.includes('primary') ||
    norm.includes('class 1 to 5') ||
    norm.includes('lower primary')
  ) {
    return SCHOOL_TYPE_CATALOG['Primary School (Class 1 to 5)'];
  }

  // Coaching / Academy
  if (
    norm.includes('coaching') ||
    norm.includes('academy') ||
    norm.includes('institute')
  ) {
    return SCHOOL_TYPE_CATALOG['Coaching / Academy'];
  }

  // Other
  if (norm.includes('other')) {
    return SCHOOL_TYPE_CATALOG['Other'];
  }

  // Default to K-12
  return SCHOOL_TYPE_CATALOG['K-12 School (Kindergarten to 12th)'];
}

/**
 * Returns instantiated AcademicClassConfig[] for the given school type with fresh unique IDs.
 */
export function getSuggestedClassesForSchoolType(schoolType?: string | null): AcademicClassConfig[] {
  const config = getSchoolTypeConfig(schoolType);
  return config.suggestedClasses.map((item, idx) => ({
    id: generateAcademicId('cls'),
    name: item.name,
    code: item.code,
    level: item.level as any,
    sortOrder: idx + 1,
    displayOrder: idx + 1,
    isActive: true,
    sections: [...item.sections],
    streams: item.streams
      ? item.streams.map((s, sIdx) => ({
          id: generateAcademicId('strm'),
          name: s.name,
          sections: [...s.sections],
        }))
      : undefined,
  }));
}

// ─── DEFAULT REUSABLE SUBJECTS CATALOG ────────────────────────────────────────

export const DEFAULT_SUGGESTED_SUBJECTS: AcademicSubjectConfig[] = [
  { id: 'sub_sugg_eng', name: 'English', code: 'ENG', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_hin', name: 'Hindi', code: 'HIN', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_math', name: 'Mathematics', code: 'MATH', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_sci', name: 'Science', code: 'SCI', subjectType: 'combined', category: 'core', status: 'active' },
  { id: 'sub_sugg_sst', name: 'Social Science', code: 'SST', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_evs', name: 'Environmental Studies (EVS)', code: 'EVS', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_phy', name: 'Physics', code: 'PHY', subjectType: 'combined', category: 'core', status: 'active' },
  { id: 'sub_sugg_chem', name: 'Chemistry', code: 'CHEM', subjectType: 'combined', category: 'core', status: 'active' },
  { id: 'sub_sugg_bio', name: 'Biology', code: 'BIO', subjectType: 'combined', category: 'core', status: 'active' },
  { id: 'sub_sugg_acc', name: 'Accountancy', code: 'ACC', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_bst', name: 'Business Studies', code: 'BST', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_eco', name: 'Economics', code: 'ECO', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_cs', name: 'Computer Science', code: 'CS', subjectType: 'combined', category: 'elective', status: 'active' },
  { id: 'sub_sugg_it', name: 'Information Technology', code: 'IT', subjectType: 'combined', category: 'elective', status: 'active' },
  { id: 'sub_sugg_hist', name: 'History', code: 'HIST', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_pol', name: 'Political Science', code: 'POL', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_geo', name: 'Geography', code: 'GEO', subjectType: 'theory', category: 'core', status: 'active' },
  { id: 'sub_sugg_phe', name: 'Physical Education', code: 'PHE', subjectType: 'practical', category: 'optional', status: 'active' },
  { id: 'sub_sugg_art', name: 'Art & Craft', code: 'ART', subjectType: 'activity', category: 'optional', status: 'active' },
  { id: 'sub_sugg_skt', name: 'Sanskrit', code: 'SKT', subjectType: 'theory', category: 'optional', status: 'active' },
  { id: 'sub_sugg_mus', name: 'Music', code: 'MUS', subjectType: 'activity', category: 'optional', status: 'active' },
];

// ─── CURRICULUM & NAMING RESOLVERS ───────────────────────────────────────────

export function resolveEffectiveCurriculum(
  board?: string | null,
  customBoard?: string | null,
  fallbackBoard?: string | null
): string {
  if (board) {
    const trimmed = board.trim();
    if (trimmed.toLowerCase() === 'other') {
      return (customBoard || '').trim() || 'Other';
    }
    return trimmed;
  }
  if (fallbackBoard && fallbackBoard.trim()) {
    return fallbackBoard.trim();
  }
  return 'CBSE';
}

export function resolveEffectiveNamingConvention(
  convention?: string | null,
  customConvention?: string | null
): string {
  if (convention) {
    const trimmed = convention.trim();
    if (trimmed.toLowerCase() === 'custom') {
      return (customConvention || '').trim() || 'Custom';
    }
    return trimmed;
  }
  return 'Class';
}

// ─── SECTION NORMALIZATION ───────────────────────────────────────────────────

export function normalizeSections(
  rawSections?: (string | ClassSectionConfig)[] | null
): string[] {
  if (!Array.isArray(rawSections)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of rawSections) {
    let name = '';
    if (typeof item === 'string') {
      name = item.trim();
    } else if (item && typeof item === 'object' && typeof item.name === 'string') {
      name = item.name.trim();
    }
    if (name.length > 0 && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      normalized.push(name);
    }
  }

  return normalized;
}

// ─── STREAM NORMALIZATION ────────────────────────────────────────────────────

export function normalizeStreams(
  rawStreams?: AcademicStreamConfig[] | null
): AcademicStreamConfig[] {
  if (!Array.isArray(rawStreams)) return [];
  const seen = new Set<string>();
  const normalized: AcademicStreamConfig[] = [];

  for (const strm of rawStreams) {
    if (!strm || typeof strm !== 'object') continue;
    const name = (strm.name || '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    normalized.push({
      id: strm.id && strm.id.trim() ? strm.id.trim() : generateAcademicId('strm'),
      name,
      code: strm.code ? strm.code.trim() : undefined,
      sections: normalizeSections(strm.sections),
      description: strm.description ? strm.description.trim() : undefined,
    });
  }

  return normalized;
}

// ─── PROGRAM NORMALIZATION ───────────────────────────────────────────────────

export function normalizePrograms(
  rawPrograms?: AcademicProgramConfig[] | null
): AcademicProgramConfig[] {
  if (!Array.isArray(rawPrograms)) return [];
  const seen = new Set<string>();
  const normalized: AcademicProgramConfig[] = [];

  for (const prog of rawPrograms) {
    if (!prog || typeof prog !== 'object') continue;
    const name = (prog.name || '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    normalized.push({
      id: prog.id && prog.id.trim() ? prog.id.trim() : generateAcademicId('prog'),
      name,
      code: prog.code ? prog.code.trim() : undefined,
      description: prog.description ? prog.description.trim() : undefined,
    });
  }

  return normalized;
}

// ─── CLASS NORMALIZATION ─────────────────────────────────────────────────────

export function normalizeClasses(
  rawClasses?: AcademicClassConfig[] | null
): AcademicClassConfig[] {
  if (!Array.isArray(rawClasses)) return [];
  const seenNames = new Set<string>();
  const normalized: AcademicClassConfig[] = [];

  for (let i = 0; i < rawClasses.length; i++) {
    const cls = rawClasses[i];
    if (!cls || typeof cls !== 'object') continue;

    const name = (cls.name || cls.className || '').trim();
    if (!name) continue;

    // Prevent duplicate class names by keeping first
    const lookupKey = name.toLowerCase();
    if (seenNames.has(lookupKey)) {
      continue;
    }
    seenNames.add(lookupKey);

    const sortOrder = typeof cls.sortOrder === 'number' ? cls.sortOrder : i + 1;
    const displayOrder = typeof cls.displayOrder === 'number' ? cls.displayOrder : sortOrder;

    normalized.push({
      id: cls.id && cls.id.trim() ? cls.id.trim() : generateAcademicId('cls'),
      name,
      className: name,
      code: cls.code ? cls.code.trim() : undefined,
      level: cls.level ? cls.level.trim() : undefined,
      sortOrder,
      displayOrder,
      isActive: cls.isActive !== false,
      sections: normalizeSections(cls.sections),
      streams: normalizeStreams(cls.streams),
      programs: normalizePrograms(cls.programs),
    });
  }

  // Sort by displayOrder or sortOrder
  normalized.sort((a, b) => (a.displayOrder ?? a.sortOrder) - (b.displayOrder ?? b.sortOrder));

  return normalized;
}

// ─── DERIVED METADATA CALCULATOR ─────────────────────────────────────────────

export function deriveClassesOfferedSummary(classes: AcademicClassConfig[]): {
  classesOfferedFrom: string;
  classesOfferedTo: string;
  totalSectionsEstimated: number;
  academicStreams: string[];
} {
  if (!classes || classes.length === 0) {
    return {
      classesOfferedFrom: '',
      classesOfferedTo: '',
      totalSectionsEstimated: 0,
      academicStreams: [],
    };
  }

  const active = classes.filter((c) => c.isActive !== false);
  const fromClass = active[0]?.name || classes[0]?.name || '';
  const toClass = active[active.length - 1]?.name || classes[classes.length - 1]?.name || '';

  let totalSections = 0;
  const streamSet = new Set<string>();

  for (const c of classes) {
    const classSecCount = Array.isArray(c.sections) ? c.sections.length : 0;
    let streamSecCount = 0;
    if (Array.isArray(c.streams)) {
      for (const s of c.streams) {
        if (s.name) streamSet.add(s.name.trim());
        if (Array.isArray(s.sections)) streamSecCount += s.sections.length;
      }
    }
    totalSections += Math.max(classSecCount, streamSecCount, 1);
  }

  return {
    classesOfferedFrom: fromClass,
    classesOfferedTo: toClass,
    totalSectionsEstimated: totalSections,
    academicStreams: Array.from(streamSet),
  };
}

// ─── TEACHING GROUP RESOLVER ──────────────────────────────────────────────────

export function deriveTeachingGroups(classes?: AcademicClassConfig[] | null): TeachingGroup[] {
  if (!Array.isArray(classes)) return [];
  const groups: TeachingGroup[] = [];

  for (const cls of classes) {
    if (!cls || cls.isActive === false) continue;
    const clsId = cls.id || generateAcademicId('cls');
    const clsName = (cls.name || cls.className || '').trim() || 'Class';
    const hasStreams = Array.isArray(cls.streams) && cls.streams.length > 0;

    if (hasStreams) {
      for (const strm of cls.streams!) {
        const strmId = strm.id || generateAcademicId('strm');
        const strmName = (strm.name || '').trim() || 'General';
        const strmSections = normalizeSections(strm.sections);

        if (strmSections.length > 0) {
          // Structure D: Grade + Stream + Section
          for (const sec of strmSections) {
            groups.push({
              id: `tg_${clsId}_${strmId}_${sec.toLowerCase()}`,
              classId: clsId,
              className: clsName,
              streamId: strmId,
              streamName: strmName,
              sectionName: sec,
              displayName: `${clsName} → ${strmName} → Section ${sec}`,
              shortLabel: `${clsName} ${strmName}-${sec}`,
              structureType: 'grade_stream_section',
            });
          }
        } else {
          // Structure C: Grade + Stream only
          groups.push({
            id: `tg_${clsId}_${strmId}`,
            classId: clsId,
            className: clsName,
            streamId: strmId,
            streamName: strmName,
            displayName: `${clsName} → ${strmName}`,
            shortLabel: `${clsName} ${strmName}`,
            structureType: 'grade_stream',
          });
        }
      }
    } else {
      const clsSections = normalizeSections(cls.sections);
      if (clsSections.length > 0) {
        // Structure B: Grade + Section only
        for (const sec of clsSections) {
          let legacyTeacher: string | undefined;
          if (Array.isArray(cls.sections)) {
            const match = cls.sections.find(
              (s) => typeof s === 'object' && s !== null && s.name === sec
            ) as ClassSectionConfig | undefined;
            if (match?.classTeacher) legacyTeacher = match.classTeacher;
          }

          groups.push({
            id: `tg_${clsId}_sec_${sec.toLowerCase()}`,
            classId: clsId,
            className: clsName,
            sectionName: sec,
            displayName: `${clsName} → Section ${sec}`,
            shortLabel: `${clsName}-${sec}`,
            structureType: 'grade_section',
            classTeacher: legacyTeacher,
          });
        }
      } else {
        // Structure A: Grade without Sections or Streams
        groups.push({
          id: `tg_${clsId}`,
          classId: clsId,
          className: clsName,
          displayName: clsName,
          shortLabel: clsName,
          structureType: 'grade_only',
        });
      }
    }
  }

  return groups;
}

// ─── REUSABLE SUBJECTS NORMALIZATION ─────────────────────────────────────────

export function normalizeSubjects(
  rawSubjects?: AcademicSubjectConfig[] | null
): AcademicSubjectConfig[] {
  if (!Array.isArray(rawSubjects)) return [];
  const seenNames = new Set<string>();
  const normalized: AcademicSubjectConfig[] = [];

  for (const s of rawSubjects) {
    if (!s || typeof s !== 'object') continue;
    const name = (s.name || '').trim();
    if (!name) continue;

    const lower = name.toLowerCase();
    if (seenNames.has(lower)) continue;
    seenNames.add(lower);

    normalized.push({
      id: s.id && s.id.trim() ? s.id.trim() : generateAcademicId('sub'),
      name,
      code: s.code ? s.code.trim().toUpperCase() : undefined,
      subjectType: s.subjectType || 'theory',
      category: s.category || (s.isElective ? 'elective' : 'core'),
      isElective: Boolean(s.isElective ?? s.category === 'elective'),
      status: s.status || 'active',
      description: s.description ? s.description.trim() : undefined,
      className: s.className,
      stream: s.stream,
      classesTaught: Array.isArray(s.classesTaught) ? s.classesTaught : undefined,
    });
  }

  return normalized;
}

// ─── SUBJECT APPLICABILITY NORMALIZATION ─────────────────────────────────────

export function normalizeSubjectApplicability(
  raw?: SubjectApplicabilityConfig[] | null,
  subjects?: AcademicSubjectConfig[],
  classes?: AcademicClassConfig[],
  teachingGroups?: TeachingGroup[]
): SubjectApplicabilityConfig[] {
  const result: SubjectApplicabilityConfig[] = [];
  const seen = new Set<string>();

  const classMap = classes !== undefined ? new Map(classes.map((c) => [c.id, c])) : null;
  const subjectSet = subjects !== undefined ? new Set(subjects.map((s) => s.id)) : null;
  const groupSet = teachingGroups !== undefined ? new Set(teachingGroups.map((g) => g.id)) : null;

  if (Array.isArray(raw) && raw.length > 0) {
    for (const item of raw) {
      if (!item || !item.subjectId || !item.classId) continue;

      // Filter out orphaned records if parent sets are passed
      if (classMap && !classMap.has(item.classId)) continue;
      if (subjectSet && !subjectSet.has(item.subjectId)) continue;
      if (item.streamId && classMap) {
        const cls = classMap.get(item.classId);
        const hasStream = cls?.streams?.some((strm) => strm.id === item.streamId);
        if (!hasStream) continue;
      }
      if (item.teachingGroupId && groupSet) {
        if (!groupSet.has(item.teachingGroupId)) continue;
      }

      const key = `${item.subjectId}_${item.classId}_${item.streamId || ''}_${item.teachingGroupId || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push({
        id: item.id && item.id.trim() ? item.id.trim() : generateAcademicId('sub_app'),
        subjectId: item.subjectId,
        classId: item.classId,
        streamId: item.streamId || undefined,
        teachingGroupId: item.teachingGroupId || undefined,
        isElective: Boolean(item.isElective),
      });
    }
    return result;
  }

  // Safe backward compatibility migration from legacy fields:
  if (subjects && subjects.length > 0 && classes && classes.length > 0) {
    for (const sub of subjects) {
      if (!sub.id) continue;
      if (Array.isArray(sub.classesTaught) && sub.classesTaught.length > 0) {
        for (const clsRef of sub.classesTaught) {
          const matchCls = classes.find(
            (c) => c.id === clsRef || c.name.toLowerCase() === clsRef.toLowerCase()
          );
          if (matchCls && matchCls.id) {
            const key = `${sub.id}_${matchCls.id}__`;
            if (!seen.has(key)) {
              seen.add(key);
              result.push({
                id: generateAcademicId('sub_app'),
                subjectId: sub.id,
                classId: matchCls.id,
                streamId: sub.stream
                  ? matchCls.streams?.find((s) => s.name.toLowerCase() === sub.stream?.toLowerCase())?.id
                  : undefined,
                isElective: sub.isElective,
              });
            }
          }
        }
      } else if (sub.className) {
        const matchCls = classes.find(
          (c) => c.id === sub.className || c.name.toLowerCase() === sub.className?.toLowerCase()
        );
        if (matchCls && matchCls.id) {
          const key = `${sub.id}_${matchCls.id}__`;
          if (!seen.has(key)) {
            seen.add(key);
            result.push({
              id: generateAcademicId('sub_app'),
              subjectId: sub.id,
              classId: matchCls.id,
              streamId: sub.stream
                ? matchCls.streams?.find((s) => s.name.toLowerCase() === sub.stream?.toLowerCase())?.id
                : undefined,
              isElective: sub.isElective,
            });
          }
        }
      }
    }
  }

  return result;
}

export function isSubjectApplicableToGroup(
  subjectId: string,
  group: TeachingGroup,
  applicabilityList?: SubjectApplicabilityConfig[] | null
): boolean {
  if (!applicabilityList || applicabilityList.length === 0) return false;

  return applicabilityList.some((item) => {
    if (item.subjectId !== subjectId) return false;

    // 1. Explicit teaching group targeting
    if (item.teachingGroupId) {
      return item.teachingGroupId === group.id;
    }

    // 2. Stream-level targeting (for stream teaching groups)
    if (item.streamId) {
      return item.classId === group.classId && item.streamId === group.streamId;
    }

    // 3. Class-level targeting: applies to all groups of class when group has no stream
    // Or if group has streams, applies if not stream-restricted
    if (item.classId === group.classId) {
      // If group has a stream and item did not specify a stream, it applies if general
      return true;
    }

    return false;
  });
}

export function getApplicableSubjectsForGroup(
  group: TeachingGroup,
  subjects?: AcademicSubjectConfig[] | null,
  applicabilityList?: SubjectApplicabilityConfig[] | null
): AcademicSubjectConfig[] {
  if (!subjects || subjects.length === 0) return [];
  return subjects.filter((s) => s.id && isSubjectApplicableToGroup(s.id, group, applicabilityList));
}

// ─── SUBJECT TEACHER ASSIGNMENTS NORMALIZATION ───────────────────────────────

export function normalizeSubjectTeacherAssignments(
  raw?: SubjectTeacherAssignment[] | null,
  teachingGroups?: TeachingGroup[],
  subjects?: AcademicSubjectConfig[],
  staffMembers?: StaffMember[]
): SubjectTeacherAssignment[] {
  if (!Array.isArray(raw)) return [];
  const groupSet = teachingGroups !== undefined ? new Set(teachingGroups.map((g) => g.id)) : null;
  const subSet = subjects !== undefined ? new Set(subjects.map((s) => s.id)) : null;
  const staffList = Array.isArray(staffMembers) ? staffMembers : [];
  const seenKeys = new Set<string>();
  const normalized: SubjectTeacherAssignment[] = [];

  for (const item of raw) {
    if (!item || !item.teachingGroupId || !item.subjectId) continue;
    if (groupSet && !groupSet.has(item.teachingGroupId)) continue;
    if (subSet && !subSet.has(item.subjectId)) continue;

    const key = `${item.teachingGroupId}_${item.subjectId}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    // 1. Primary Teacher Resolution
    let teacherId = item.teacherId?.trim();
    let facultyId = item.facultyId?.trim();
    let teacherName = (item.teacherName || '').trim();

    if ((teacherId || facultyId) && staffList.length > 0) {
      const lookup = teacherId || facultyId;
      const matchedStaff = staffList.find(
        (s) => s.id === lookup || s.employeeCode === lookup || s.facultyId === lookup
      );
      if (matchedStaff) {
        teacherId = matchedStaff.id;
        facultyId = matchedStaff.facultyId || matchedStaff.employeeCode || matchedStaff.id;
        teacherName = matchedStaff.name;
      }
    } else if (!teacherId && !facultyId && teacherName && staffList.length > 0) {
      // Auto-link legacy teacherName if matching staff exists
      const matchedStaff = staffList.find(
        (s) => s.name.trim().toLowerCase() === teacherName.toLowerCase()
      );
      if (matchedStaff) {
        teacherId = matchedStaff.id;
        facultyId = matchedStaff.facultyId || matchedStaff.employeeCode || matchedStaff.id;
        teacherName = matchedStaff.name;
      }
    }

    // Skip unassigned dummy records without ID or name
    if (!teacherId && !facultyId && !teacherName) continue;

    // 2. Secondary / Co-Teacher Resolution
    let secondaryTeacherId = item.secondaryTeacherId?.trim();
    let secondaryFacultyId = item.secondaryFacultyId?.trim();
    let secondaryTeacherName = (item.secondaryTeacherName || '').trim();

    if ((secondaryTeacherId || secondaryFacultyId) && staffList.length > 0) {
      const lookup = secondaryTeacherId || secondaryFacultyId;
      const matchedSec = staffList.find(
        (s) => s.id === lookup || s.employeeCode === lookup || s.facultyId === lookup
      );
      if (matchedSec) {
        secondaryTeacherId = matchedSec.id;
        secondaryFacultyId = matchedSec.facultyId || matchedSec.employeeCode || matchedSec.id;
        secondaryTeacherName = matchedSec.name;
      }
    } else if (!secondaryTeacherId && !secondaryFacultyId && secondaryTeacherName && staffList.length > 0) {
      const matchedSec = staffList.find(
        (s) => s.name.trim().toLowerCase() === secondaryTeacherName.toLowerCase()
      );
      if (matchedSec) {
        secondaryTeacherId = matchedSec.id;
        secondaryFacultyId = matchedSec.facultyId || matchedSec.employeeCode || matchedSec.id;
        secondaryTeacherName = matchedSec.name;
      }
    }

    normalized.push({
      id: item.id && item.id.trim() ? item.id.trim() : generateAcademicId('sub_tch'),
      teachingGroupId: item.teachingGroupId,
      subjectId: item.subjectId,
      teacherId: teacherId || undefined,
      facultyId: facultyId || teacherId || undefined,
      teacherName,
      secondaryTeacherId: secondaryTeacherId || undefined,
      secondaryFacultyId: secondaryFacultyId || secondaryTeacherId || undefined,
      secondaryTeacherName: secondaryTeacherName || undefined,
      coTeachers: Array.isArray(item.coTeachers) ? item.coTeachers : undefined,
      notes: item.notes ? item.notes.trim() : undefined,
    });
  }

  return normalized;
}

export function getSubjectTeacherAssignment(
  teachingGroupId: string,
  subjectId: string,
  assignments?: SubjectTeacherAssignment[] | null
): SubjectTeacherAssignment | undefined {
  if (!assignments) return undefined;
  return assignments.find(
    (a) => a.teachingGroupId === teachingGroupId && a.subjectId === subjectId
  );
}

// ─── CLASS TEACHER ASSIGNMENTS NORMALIZATION ────────────────────────────────

export function normalizeClassTeacherAssignments(
  raw?: ClassTeacherAssignment[] | null,
  teachingGroups?: TeachingGroup[],
  classes?: AcademicClassConfig[],
  staffMembers?: StaffMember[]
): ClassTeacherAssignment[] {
  const groupSet = teachingGroups !== undefined ? new Set(teachingGroups.map((g) => g.id)) : null;
  const staffList = Array.isArray(staffMembers) ? staffMembers : [];
  const seenGroups = new Set<string>();
  const normalized: ClassTeacherAssignment[] = [];

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || !item.teachingGroupId) continue;
      if (groupSet && !groupSet.has(item.teachingGroupId)) continue;
      if (seenGroups.has(item.teachingGroupId)) continue;

      let teacherId = item.teacherId?.trim();
      let facultyId = item.facultyId?.trim();
      let teacherName = (item.teacherName || '').trim();

      if ((teacherId || facultyId) && staffList.length > 0) {
        const lookup = teacherId || facultyId;
        const matchedStaff = staffList.find(
          (s) => s.id === lookup || s.employeeCode === lookup || s.facultyId === lookup
        );
        if (matchedStaff) {
          teacherId = matchedStaff.id;
          facultyId = matchedStaff.facultyId || matchedStaff.employeeCode || matchedStaff.id;
          teacherName = matchedStaff.name;
        }
      } else if (!teacherId && !facultyId && teacherName && staffList.length > 0) {
        const matchedStaff = staffList.find(
          (s) => s.name.trim().toLowerCase() === teacherName.toLowerCase()
        );
        if (matchedStaff) {
          teacherId = matchedStaff.id;
          facultyId = matchedStaff.facultyId || matchedStaff.employeeCode || matchedStaff.id;
          teacherName = matchedStaff.name;
        }
      }

      if (!teacherId && !facultyId && !teacherName) continue;
      seenGroups.add(item.teachingGroupId);

      normalized.push({
        id: item.id && item.id.trim() ? item.id.trim() : generateAcademicId('cls_tch'),
        teachingGroupId: item.teachingGroupId,
        teacherId: teacherId || undefined,
        facultyId: facultyId || teacherId || undefined,
        teacherName,
        assistantTeacherId: item.assistantTeacherId ? item.assistantTeacherId.trim() : undefined,
        assistantTeacherName: item.assistantTeacherName ? item.assistantTeacherName.trim() : undefined,
        roomNumber: item.roomNumber ? item.roomNumber.trim() : undefined,
      });
    }
  }

  // Safe backward compatibility migration from legacy section.classTeacher:
  if (teachingGroups && teachingGroups.length > 0) {
    for (const tg of teachingGroups) {
      if (seenGroups.has(tg.id)) continue;
      if (tg.classTeacher && tg.classTeacher.trim()) {
        let teacherId: string | undefined;
        let facultyId: string | undefined;
        let teacherName = tg.classTeacher.trim();
        if (staffList.length > 0) {
          const matchedStaff = staffList.find(
            (s) => s.name.trim().toLowerCase() === teacherName.toLowerCase()
          );
          if (matchedStaff) {
            teacherId = matchedStaff.id;
            facultyId = matchedStaff.facultyId || matchedStaff.employeeCode || matchedStaff.id;
            teacherName = matchedStaff.name;
          }
        }
        seenGroups.add(tg.id);
        normalized.push({
          id: generateAcademicId('cls_tch'),
          teachingGroupId: tg.id,
          teacherId,
          facultyId,
          teacherName,
        });
      }
    }
  }

  return normalized;
}

export function getClassTeacherAssignment(
  teachingGroupId: string,
  assignments?: ClassTeacherAssignment[] | null
): ClassTeacherAssignment | undefined {
  if (!assignments) return undefined;
  return assignments.find((a) => a.teachingGroupId === teachingGroupId);
}

// ─── ACADEMIC PROGRESS & WARNINGS ENGINE ─────────────────────────────────────

export interface AcademicWarningItem {
  id: string;
  step: number;
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'info';
  targetStep: number;
  targetClassId?: string;
  targetGroupId?: string;
  targetSubjectId?: string;
  actionLabel?: string;
}

export interface AcademicSetupProgress {
  step1: {
    isComplete: boolean;
    sessionName: string;
    summaryText: string;
  };
  step2: {
    isComplete: boolean;
    totalClasses: number;
    summaryText: string;
  };
  step3: {
    isComplete: boolean;
    configuredCount: number;
    totalClasses: number;
    totalSections: number;
    totalStreams: number;
    summaryText: string;
  };
  step4: {
    isComplete: boolean;
    totalSubjects: number;
    summaryText: string;
  };
  step5: {
    isComplete: boolean;
    configuredGroupsCount: number;
    totalGroupsCount: number;
    totalMappingsCount: number;
    summaryText: string;
  };
  step6: {
    isComplete: boolean;
    assignedCount: number;
    totalRequired: number;
    missingCount: number;
    summaryText: string;
  };
  step7: {
    isComplete: boolean;
    assignedCount: number;
    totalGroups: number;
    missingCount: number;
    summaryText: string;
  };
  step8: {
    isComplete: boolean;
    totalWarnings: number;
    isConfirmed: boolean;
    summaryText: string;
  };
  warnings: AcademicWarningItem[];
  overallPercentage: number;
  teachingGroups: TeachingGroup[];
  isReadyForConfirmation: boolean;
}

export function getAcademicSetupProgress(
  structure: AcademicStructureData,
  staffMembers?: StaffMember[]
): AcademicSetupProgress {
  const classes = structure.classes || [];
  const teachingGroups = deriveTeachingGroups(classes);
  const subjects = structure.subjects || [];
  const applicability = structure.subjectApplicability || [];
  const subjectAssignments = structure.subjectTeacherAssignments || [];
  const classAssignments = structure.classTeacherAssignments || [];
  const isConfirmed = Boolean(structure.confirmed || structure.academicStructureConfirmed);
  const staffList = Array.isArray(staffMembers) ? staffMembers : [];

  const warnings: AcademicWarningItem[] = [];

  // Step 1: Session
  const sessionName = (structure.currentAcademicSession || '').trim();
  const hasDates = Boolean(structure.sessionStartDate && structure.sessionEndDate);
  const step1Complete = Boolean(sessionName && hasDates);

  // Step 2: Classes
  const step2Complete = classes.length > 0;
  if (!step2Complete) {
    warnings.push({
      id: 'warn_no_classes',
      step: 2,
      title: 'No Grades / Classes Configured',
      message: 'Add the academic classes or grades your school offers.',
      severity: 'error',
      targetStep: 2,
      actionLabel: 'Add Grades',
    });
  }

  // Step 3: Sections & Streams
  let totalSections = 0;
  let totalStreams = 0;
  for (const c of classes) {
    totalSections += Array.isArray(c.sections) ? c.sections.length : 0;
    if (Array.isArray(c.streams)) {
      totalStreams += c.streams.length;
      for (const s of c.streams) {
        totalSections += Array.isArray(s.sections) ? s.sections.length : 0;
      }
    }
  }
  const step3Complete = classes.length > 0; // Sections & Streams are optional

  // Step 4: Subjects
  const step4Complete = subjects.length > 0;
  if (step2Complete && !step4Complete) {
    warnings.push({
      id: 'warn_no_subjects',
      step: 4,
      title: 'No Subjects in Catalog',
      message: 'Define what subjects students learn in the reusable subject catalog.',
      severity: 'warning',
      targetStep: 4,
      actionLabel: 'Add Subjects',
    });
  }

  // Step 5: Subject Applicability
  let configuredGroupsCount = 0;
  for (const g of teachingGroups) {
    const applicable = getApplicableSubjectsForGroup(g, subjects, applicability);
    if (applicable.length > 0) {
      configuredGroupsCount++;
    } else if (step4Complete) {
      warnings.push({
        id: `warn_no_curriculum_${g.id}`,
        step: 5,
        title: 'Curriculum Missing',
        message: `${g.displayName} has no subjects assigned.`,
        severity: 'warning',
        targetStep: 5,
        targetGroupId: g.id,
        actionLabel: 'Assign Subjects',
      });
    }
  }
  const step5Complete = teachingGroups.length > 0 && configuredGroupsCount === teachingGroups.length;

  // Step 6: Subject Teachers
  let totalRequiredSubjectTeachers = 0;
  let assignedSubjectTeachersCount = 0;

  for (const g of teachingGroups) {
    const applicable = getApplicableSubjectsForGroup(g, subjects, applicability);
    totalRequiredSubjectTeachers += applicable.length;
    for (const sub of applicable) {
      if (!sub.id) continue;
      const assignment = getSubjectTeacherAssignment(g.id, sub.id, subjectAssignments);
      const teacherKey = assignment?.teacherId || assignment?.facultyId;
      const hasTeacher = Boolean(teacherKey || (assignment?.teacherName && assignment.teacherName.trim()));

      if (hasTeacher) {
        // If staff directory exists and teacherId was provided, check active status
        if (staffList.length > 0 && teacherKey) {
          const matchedStaff = staffList.find(
            (s) => s.id === teacherKey || s.employeeCode === teacherKey || s.facultyId === teacherKey
          );

          if (matchedStaff && matchedStaff.status && matchedStaff.status !== 'active') {
            warnings.push({
              id: `warn_inactive_tch_${g.id}_${sub.id}`,
              step: 6,
              title: 'Assigned Faculty Inactive',
              message: `${matchedStaff.name} is marked as ${matchedStaff.status} in the Faculty Directory. Please reassign ${sub.name} for ${g.displayName}.`,
              severity: 'warning',
              targetStep: 6,
              targetGroupId: g.id,
              targetSubjectId: sub.id,
              actionLabel: 'Reassign Teacher',
            });
          } else {
            assignedSubjectTeachersCount++;
          }
        } else {
          assignedSubjectTeachersCount++;
        }
      } else {
        warnings.push({
          id: `warn_sub_tch_${g.id}_${sub.id}`,
          step: 6,
          title: 'Subject Teacher Missing',
          message: `${sub.name} teacher missing for ${g.displayName}`,
          severity: 'warning',
          targetStep: 6,
          targetGroupId: g.id,
          targetSubjectId: sub.id,
          actionLabel: 'Assign Teacher',
        });
      }
    }
  }
  const missingSubjectTeachersCount = Math.max(
    totalRequiredSubjectTeachers - assignedSubjectTeachersCount,
    0
  );
  const step6Complete =
    totalRequiredSubjectTeachers > 0 && assignedSubjectTeachersCount >= totalRequiredSubjectTeachers;

  // Step 7: Class Teachers
  let assignedClassTeachersCount = 0;
  for (const g of teachingGroups) {
    const assignment = getClassTeacherAssignment(g.id, classAssignments);
    const teacherKey = assignment?.teacherId || assignment?.facultyId;
    const hasTeacher = Boolean(teacherKey || (assignment?.teacherName && assignment.teacherName.trim()));

    if (hasTeacher) {
      if (staffList.length > 0 && teacherKey) {
        const matchedStaff = staffList.find(
          (s) => s.id === teacherKey || s.employeeCode === teacherKey || s.facultyId === teacherKey
        );

        if (matchedStaff && matchedStaff.status && matchedStaff.status !== 'active') {
          warnings.push({
            id: `warn_inactive_cls_tch_${g.id}`,
            step: 7,
            title: 'Class Teacher Inactive',
            message: `${matchedStaff.name} is marked as ${matchedStaff.status} in the Faculty Directory. Please reassign Class Teacher for ${g.displayName}.`,
            severity: 'warning',
            targetStep: 7,
            targetGroupId: g.id,
            actionLabel: 'Reassign Class Teacher',
          });
        } else {
          assignedClassTeachersCount++;
        }
      } else {
        assignedClassTeachersCount++;
      }
    } else {
      warnings.push({
        id: `warn_cls_tch_${g.id}`,
        step: 7,
        title: 'Class Teacher Missing',
        message: `Class Teacher missing for ${g.displayName}`,
        severity: 'warning',
        targetStep: 7,
        targetGroupId: g.id,
        actionLabel: 'Assign Class Teacher',
      });
    }
  }
  const missingClassTeachersCount = Math.max(
    teachingGroups.length - assignedClassTeachersCount,
    0
  );
  const step7Complete = teachingGroups.length > 0 && assignedClassTeachersCount >= teachingGroups.length;

  // Step 8: Review & Confirmation
  const step8Complete = isConfirmed;

  // Real progress weighted calculation
  let overallPercentage = 0;
  if (classes.length > 0) {
    const p1 = step1Complete ? 15 : 5;
    const p2 = 15;
    const p3 = 10;
    const p4 = step4Complete ? 15 : 0;
    const p5 = teachingGroups.length > 0 ? (configuredGroupsCount / teachingGroups.length) * 15 : 0;
    const p6 =
      totalRequiredSubjectTeachers > 0
        ? (assignedSubjectTeachersCount / totalRequiredSubjectTeachers) * 15
        : 0;
    const p7 = teachingGroups.length > 0 ? (assignedClassTeachersCount / teachingGroups.length) * 10 : 0;
    const p8 = isConfirmed ? 5 : 0;

    overallPercentage = Math.min(Math.round(p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8), 100);
  }

  const isReadyForConfirmation =
    step1Complete && step2Complete && step4Complete && warnings.filter((w) => w.severity === 'error').length === 0;

  return {
    step1: {
      isComplete: step1Complete,
      sessionName: sessionName || 'Not configured',
      summaryText: step1Complete ? `Session ${sessionName}` : 'Session dates incomplete',
    },
    step2: {
      isComplete: step2Complete,
      totalClasses: classes.length,
      summaryText: classes.length > 0 ? `${classes.length} grades configured` : 'No grades added',
    },
    step3: {
      isComplete: step3Complete,
      configuredCount: classes.length,
      totalClasses: classes.length,
      totalSections,
      totalStreams,
      summaryText:
        totalSections > 0 || totalStreams > 0
          ? `${totalSections} sections, ${totalStreams} streams`
          : 'Optional — no sections/streams',
    },
    step4: {
      isComplete: step4Complete,
      totalSubjects: subjects.length,
      summaryText: subjects.length > 0 ? `${subjects.length} subjects in catalog` : 'No subjects defined',
    },
    step5: {
      isComplete: step5Complete,
      configuredGroupsCount,
      totalGroupsCount: teachingGroups.length,
      totalMappingsCount: applicability.length,
      summaryText:
        teachingGroups.length > 0
          ? `${configuredGroupsCount} of ${teachingGroups.length} groups mapped`
          : 'No groups to map',
    },
    step6: {
      isComplete: step6Complete,
      assignedCount: assignedSubjectTeachersCount,
      totalRequired: totalRequiredSubjectTeachers,
      missingCount: missingSubjectTeachersCount,
      summaryText:
        totalRequiredSubjectTeachers > 0
          ? `${assignedSubjectTeachersCount} of ${totalRequiredSubjectTeachers} assigned`
          : 'No assignments required',
    },
    step7: {
      isComplete: step7Complete,
      assignedCount: assignedClassTeachersCount,
      totalGroups: teachingGroups.length,
      missingCount: missingClassTeachersCount,
      summaryText:
        teachingGroups.length > 0
          ? `${assignedClassTeachersCount} of ${teachingGroups.length} assigned`
          : 'No groups to assign',
    },
    step8: {
      isComplete: step8Complete,
      totalWarnings: warnings.length,
      isConfirmed,
      summaryText: isConfirmed
        ? '✓ Academic Structure Confirmed'
        : warnings.length > 0
        ? `⚠ ${warnings.length} issues to review`
        : 'Ready for confirmation',
    },
    warnings,
    overallPercentage,
    teachingGroups,
    isReadyForConfirmation,
  };
}

// ─── MASTER NORMALIZER ───────────────────────────────────────────────────────

export function normalizeAcademicStructure(
  raw?: Partial<AcademicStructureData> | null,
  context?: {
    fallbackBoard?: string;
    fallbackSession?: string;
    staffMembers?: StaffMember[];
  }
): AcademicStructureData {
  const data = raw || {};

  // 1. Academic Session & Dates
  const currentAcademicSession = (data.currentAcademicSession || context?.fallbackSession || '2026-2027').trim();
  const sessionStartDate = data.sessionStartDate ? data.sessionStartDate.trim() : '2026-04-01';
  const sessionEndDate = data.sessionEndDate ? data.sessionEndDate.trim() : '2027-03-31';
  const futureSessionPattern = data.futureSessionPattern ? data.futureSessionPattern.trim() : 'Annual (April–March)';

  // 2. Board & Curriculum
  const board = data.board ? data.board.trim() : context?.fallbackBoard || 'CBSE';
  const customBoard = data.customBoard ? data.customBoard.trim() : '';
  const effectiveCurriculum = resolveEffectiveCurriculum(board, customBoard, context?.fallbackBoard);

  // 3. Naming Convention
  const namingConvention = data.namingConvention ? data.namingConvention.trim() : 'Class';
  const customNamingConvention = data.customNamingConvention ? data.customNamingConvention.trim() : '';

  // 4. Classes Normalization
  let classes = normalizeClasses(data.classes);
  const summary = deriveClassesOfferedSummary(classes);

  // 5. Streams aggregation
  const academicStreams =
    Array.isArray(data.academicStreams) && data.academicStreams.length > 0
      ? Array.from(new Set([...data.academicStreams, ...summary.academicStreams]))
      : summary.academicStreams;

  // 6. Teaching Groups Resolution
  const teachingGroups = deriveTeachingGroups(classes);

  // 7. Reusable Subjects Normalization
  const subjects = normalizeSubjects(data.subjects);

  // 8. Subject Applicability Normalization
  const subjectApplicability = normalizeSubjectApplicability(
    data.subjectApplicability,
    subjects,
    classes,
    teachingGroups
  );

  // 9. Subject Teacher Assignments Normalization
  const subjectTeacherAssignments = normalizeSubjectTeacherAssignments(
    data.subjectTeacherAssignments,
    teachingGroups,
    subjects,
    context?.staffMembers
  );

  // 10. Class Teacher Assignments Normalization
  const classTeacherAssignments = normalizeClassTeacherAssignments(
    data.classTeacherAssignments,
    teachingGroups,
    classes,
    context?.staffMembers
  );

  // 11. Confirmation & Lifecycle Status
  const isConfirmed = Boolean(data.confirmed ?? data.academicStructureConfirmed ?? false);

  let structureStatus: AcademicStructureData['structureStatus'] = data.structureStatus;
  if (!structureStatus) {
    if (isConfirmed) {
      structureStatus = 'confirmed';
    } else if (classes.length === 0) {
      structureStatus = 'unconfigured';
    } else {
      structureStatus = 'suggested';
    }
  } else if (isConfirmed) {
    structureStatus = 'confirmed';
  }

  return {
    ...data,
    isMultiCampus: Boolean(data.isMultiCampus),
    currentAcademicSession,
    sessionStartDate,
    sessionEndDate,
    futureSessionPattern,
    classesOfferedFrom: data.classesOfferedFrom || summary.classesOfferedFrom,
    classesOfferedTo: data.classesOfferedTo || summary.classesOfferedTo,
    totalSectionsEstimated: data.totalSectionsEstimated || summary.totalSectionsEstimated,
    studentCapacityTotal: data.studentCapacityTotal,
    teachingStaffCount: data.teachingStaffCount,
    nonTeachingStaffCount: data.nonTeachingStaffCount,
    academicStreams,
    classes,
    subjects,
    subjectApplicability,
    subjectTeacherAssignments,
    classTeacherAssignments,
    activeSetupStep: typeof data.activeSetupStep === 'number' ? data.activeSetupStep : 1,
    departments: data.departments || [],
    board,
    customBoard,
    effectiveCurriculum,
    namingConvention,
    customNamingConvention,
    confirmed: isConfirmed,
    academicStructureConfirmed: isConfirmed,
    confirmedAt: data.confirmedAt,
    confirmedByName: data.confirmedByName,
    confirmedVersion: data.confirmedVersion,
    structureStatus,
  };
}

// ─── VALIDATION ENGINE ───────────────────────────────────────────────────────

export interface AcademicStructureValidationResult {
  isValid: boolean;
  isConfirmed: boolean;
  errors: Record<string, string>;
  missingFields: string[];
  classErrors?: Record<string, string[]>;
}

export function validateAcademicStructure(
  data?: Partial<AcademicStructureData> | null
): AcademicStructureValidationResult {
  const errors: Record<string, string> = {};
  const missingFields: string[] = [];
  const classErrors: Record<string, string[]> = {};

  if (!data) {
    return {
      isValid: false,
      isConfirmed: false,
      errors: { general: 'Academic structure data is missing.' },
      missingFields: ['Academic Structure: Master Record'],
    };
  }

  // 1. Session Name
  const sessionName = (data.currentAcademicSession || '').trim();
  if (!sessionName) {
    errors.currentAcademicSession = 'Academic session name is required (e.g. 2026-2027).';
    missingFields.push('Academic Structure: Academic Session Name');
  }

  // 2. Start Date
  const startDate = (data.sessionStartDate || '').trim();
  if (!startDate) {
    errors.sessionStartDate = 'Session start date is required.';
    missingFields.push('Academic Structure: Session Start Date');
  }

  // 3. End Date
  const endDate = (data.sessionEndDate || '').trim();
  if (!endDate) {
    errors.sessionEndDate = 'Session end date is required.';
    missingFields.push('Academic Structure: Session End Date');
  }

  // 4. Date Order Validation
  if (startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end <= start) {
      errors.sessionEndDate = 'Session end date must be after session start date.';
      missingFields.push('Academic Structure: Session End Date must be after Start Date');
    }
  }

  // 5. Board Validation
  const board = (data.board || '').trim();
  if (board.toLowerCase() === 'other') {
    const customBoard = (data.customBoard || '').trim();
    if (!customBoard) {
      errors.customBoard = 'Please specify the governing curriculum / education board.';
      missingFields.push('Academic Structure: Custom Board Name');
    }
  }

  // 6. Naming Convention Validation
  const naming = (data.namingConvention || '').trim();
  if (naming.toLowerCase() === 'custom') {
    const customNaming = (data.customNamingConvention || '').trim();
    if (!customNaming) {
      errors.customNamingConvention = 'Please specify your custom naming convention.';
      missingFields.push('Academic Structure: Custom Naming Convention');
    }
  }

  // 7. Classes Roster
  const classes = Array.isArray(data.classes) ? data.classes : [];
  if (classes.length === 0) {
    errors.classes = 'At least one class or grade must be configured.';
    missingFields.push('Academic Structure: At least one class/grade is required');
  } else {
    const seenClasses = new Set<string>();
    for (let idx = 0; idx < classes.length; idx++) {
      const cls = classes[idx];
      const clsId = cls.id || `cls_${idx}`;
      const cErrors: string[] = [];

      const name = (cls.name || cls.className || '').trim();
      if (!name) {
        cErrors.push('Class name cannot be empty.');
        missingFields.push(`Academic Structure: Class #${idx + 1} Name Required`);
      } else {
        const lowerName = name.toLowerCase();
        if (seenClasses.has(lowerName)) {
          cErrors.push(`Duplicate class name "${name}" detected.`);
          missingFields.push(`Academic Structure: Duplicate Class Name "${name}"`);
        }
        seenClasses.add(lowerName);
      }

      // Check duplicate sections
      if (Array.isArray(cls.sections)) {
        const seenSecs = new Set<string>();
        for (const sec of cls.sections) {
          const secName = typeof sec === 'string' ? sec.trim() : (sec?.name || '').trim();
          if (secName) {
            if (seenSecs.has(secName.toLowerCase())) {
              cErrors.push(`Duplicate section "${secName}" in ${name || 'class'}.`);
              missingFields.push(`Academic Structure: Duplicate Section "${secName}" in ${name || 'class'}`);
            }
            seenSecs.add(secName.toLowerCase());
          }
        }
      }

      // Check duplicate streams
      if (Array.isArray(cls.streams)) {
        const seenStreams = new Set<string>();
        for (const strm of cls.streams) {
          const strmName = (strm?.name || '').trim();
          if (strmName) {
            if (seenStreams.has(strmName.toLowerCase())) {
              cErrors.push(`Duplicate stream "${strmName}" in ${name || 'class'}.`);
              missingFields.push(`Academic Structure: Duplicate Stream "${strmName}" in ${name || 'class'}`);
            }
            seenStreams.add(strmName.toLowerCase());
          }
        }
      }

      if (cErrors.length > 0) {
        classErrors[clsId] = cErrors;
      }
    }
  }

  // 8. Confirmation
  const isConfirmed = Boolean(data.confirmed ?? data.academicStructureConfirmed ?? false);
  if (!isConfirmed) {
    errors.confirmation = 'You must review and explicitly confirm your academic structure.';
    missingFields.push('Academic Structure: Explicit Confirmation Required');
  }

  const isValid = Object.keys(errors).length === 0 && Object.keys(classErrors).length === 0;

  return {
    isValid,
    isConfirmed,
    errors,
    missingFields,
    classErrors,
  };
}

// ─── DOWNSTREAM WEBSITE CONSUMER PAYLOAD ──────────────────────────────────────

export interface AcademicWebsiteOutput {
  sessionName: string;
  effectiveCurriculum: string;
  classesOffered: string[];
  seniorSecondaryStreams: string[];
  specialPrograms: string[];
  classesCount: number;
}

export function getAcademicStructureWebsiteOutput(
  data?: AcademicStructureData | null
): AcademicWebsiteOutput {
  if (!data) {
    return {
      sessionName: '',
      effectiveCurriculum: 'CBSE',
      classesOffered: [],
      seniorSecondaryStreams: [],
      specialPrograms: [],
      classesCount: 0,
    };
  }

  const classes = (data.classes || []).filter((c) => c.isActive !== false);
  const streamSet = new Set<string>();
  const progSet = new Set<string>();

  for (const c of classes) {
    if (Array.isArray(c.streams)) {
      for (const s of c.streams) {
        if (s.name && s.name.trim()) streamSet.add(s.name.trim());
      }
    }
    if (Array.isArray(c.programs)) {
      for (const p of c.programs) {
        if (p.name && p.name.trim()) progSet.add(p.name.trim());
      }
    }
  }

  return {
    sessionName: data.currentAcademicSession || '',
    effectiveCurriculum: resolveEffectiveCurriculum(data.board, data.customBoard),
    classesOffered: classes.map((c) => c.name),
    seniorSecondaryStreams: Array.from(streamSet),
    specialPrograms: Array.from(progSet),
    classesCount: classes.length,
  };
}

// ─── CAMPUS-SPECIFIC ACADEMIC SCOPE & DERIVED SUMMARY ENGINE ──────────────────

export const DEFAULT_LEVEL_CLASS_PRESETS: Record<string, string[]> = {
  'Pre-Primary': ['Playgroup', 'Nursery', 'LKG', 'UKG'],
  'Primary': ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'],
  'Middle': ['Class 6', 'Class 7', 'Class 8'],
  'Secondary': ['Class 9', 'Class 10'],
  'Senior Secondary': ['Class 11', 'Class 12'],
};

/**
 * Deterministically reconciles the classesOffered list based on
 * currently selected academic levels, preserving custom (user-added) classes.
 *
 * Algorithm:
 * 1. Compute the UNION of all canonical classes for each selected level
 *    (in canonical ordering: Pre-Primary → Primary → Middle → Secondary → Senior Secondary)
 * 2. Identify custom classes = existing classes NOT found in ANY canonical level preset
 * 3. Return canonical union + custom classes (deduped, stable ordering)
 *
 * Properties:
 * - Pure function: same inputs always produce same outputs
 * - First click works: `reconcile(['Pre-Primary'], [])` → 4 classes immediately
 * - Multi-select: union of all selected levels' classes
 * - Deselect: classes belonging exclusively to the removed level disappear
 * - Shared classes preserved: a class contributed by 2+ levels remains until ALL are removed
 * - Custom classes never deleted: classes not in any preset survive all level toggles
 */
export function reconcileClassesForAcademicLevels(
  selectedLevels: string[],
  existingClasses: string[]
): { classes: string[]; classRange: string } {
  // 1. Build canonical class set from selected levels, in canonical order
  const LEVEL_ORDER = ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'];
  const orderedLevels = LEVEL_ORDER.filter((l) =>
    selectedLevels.some((s) => s.toLowerCase() === l.toLowerCase())
  );
  // Include any non-standard levels (e.g. 'Other') at the end
  const otherLevels = selectedLevels.filter(
    (s) => !LEVEL_ORDER.some((l) => l.toLowerCase() === s.toLowerCase())
  );

  const canonicalClasses: string[] = [];
  const canonicalSet = new Set<string>();

  for (const level of [...orderedLevels, ...otherLevels]) {
    const preset = DEFAULT_LEVEL_CLASS_PRESETS[level];
    if (preset) {
      for (const cls of preset) {
        if (!canonicalSet.has(cls)) {
          canonicalSet.add(cls);
          canonicalClasses.push(cls);
        }
      }
    }
  }

  // 2. Build the full universe of ALL known canonical class names (across ALL levels)
  const allKnownCanonical = new Set<string>();
  for (const classes of Object.values(DEFAULT_LEVEL_CLASS_PRESETS)) {
    for (const cls of classes) {
      allKnownCanonical.add(cls);
    }
  }

  // 3. Custom classes = existing classes NOT found in any canonical preset
  const customClasses = existingClasses.filter((cls) => !allKnownCanonical.has(cls));

  // 4. Final result: canonical union + custom classes (deduped)
  const seenFinal = new Set<string>(canonicalSet);
  const finalClasses = [...canonicalClasses];
  for (const cls of customClasses) {
    if (!seenFinal.has(cls)) {
      seenFinal.add(cls);
      finalClasses.push(cls);
    }
  }

  // 5. Derive class range
  const classRange = deriveCampusClassRange(finalClasses);

  return { classes: finalClasses, classRange };
}

export const DEFAULT_CAMPUS_SCHOOL_TYPES = [
  'Pre-Primary / Play School Wing',
  'Primary School (Classes 1–5)',
  'Middle School (Classes 6–8)',
  'Secondary School (Classes 9–10)',
  'Senior Secondary Wing (Classes 11–12)',
  'Combined Primary & Middle (Classes 1–8)',
  'High School & Senior Secondary (Classes 9–12)',
  'K-12 Full Spectrum Campus',
  'Special Program Campus',
  'Other / Custom Wing',
] as const;

export interface CampusAcademicScope {
  academicLevels: string[];
  schoolType?: string;
  classesOffered: string[];
  classesOfferedFrom?: string;
  classesOfferedTo?: string;
  classRange: string;
  wingDescription?: string;
}

export interface CampusAcademicBreakdown {
  campusId: string;
  campusName: string;
  isMainCampus: boolean;
  academicLevels: string[];
  levelSummary: string; // e.g. "Pre-Primary"
  classRange: string; // e.g. "Playgroup to UKG"
  classes: string[];
  wingDescription?: string;
  schoolType?: string;
}

export interface SchoolAcademicSummary {
  isMultiCampus: boolean;
  totalCampuses: number;
  hasCampusSpecificData: boolean;
  isConsolidated: boolean;
  headlineSummary: string; // e.g. "Pre-Primary & Primary"
  subSummary: string; // e.g. "Across 2 campuses"
  consolidatedClassRange?: string; // Only present when all campuses share the same scope or single campus!
  campusBreakdowns: CampusAcademicBreakdown[];
  isLegacyUnspecified: boolean;
  legacySummaryText?: string;
}

/**
 * Derives a human-readable class range string from a list of classes,
 * boundary parameters, or explicit range string.
 */
export function deriveCampusClassRange(
  classes?: string[] | null,
  from?: string | null,
  to?: string | null,
  explicitRange?: string | null
): string {
  const trimmedExplicit = (explicitRange || '').trim();

  // If explicit range is already provided by user/record, respect and preserve it!
  if (trimmedExplicit) {
    return trimmedExplicit;
  }

  // If classes array is populated, derive from first to last
  if (Array.isArray(classes) && classes.length > 0) {
    const valid = classes.map((c) => c.trim()).filter(Boolean);
    if (valid.length === 1) {
      return valid[0];
    }
    if (valid.length > 1) {
      return `${valid[0]} to ${valid[valid.length - 1]}`;
    }
  }

  // Next check from/to boundaries
  const trimmedFrom = (from || '').trim();
  const trimmedTo = (to || '').trim();
  if (trimmedFrom && trimmedTo) {
    return `${trimmedFrom} to ${trimmedTo}`;
  }
  if (trimmedFrom) return trimmedFrom;
  if (trimmedTo) return trimmedTo;

  return '';
}

/**
 * Extracts normalized campus-specific academic scope from a campus record.
 */
export function deriveCampusAcademicScope(
  campus?: Partial<CampusBranchData> | null
): CampusAcademicScope {
  if (!campus) {
    return {
      academicLevels: [],
      classesOffered: [],
      classRange: '',
    };
  }

  // 1. Resolve Academic Levels
  const rawLevels: string[] = [];
  if (Array.isArray(campus.academicLevels)) {
    rawLevels.push(...campus.academicLevels);
  }
  if (campus.academicLevel && typeof campus.academicLevel === 'string') {
    rawLevels.push(campus.academicLevel);
  }
  if (Array.isArray(campus.schoolLevel)) {
    rawLevels.push(...campus.schoolLevel);
  } else if (campus.schoolLevel && typeof campus.schoolLevel === 'string') {
    rawLevels.push(campus.schoolLevel);
  }

  const seenLevels = new Set<string>();
  const academicLevels: string[] = [];
  for (const l of rawLevels) {
    const trimmed = (l || '').trim();
    if (trimmed && !seenLevels.has(trimmed.toLowerCase())) {
      seenLevels.add(trimmed.toLowerCase());
      academicLevels.push(trimmed);
    }
  }

  // 2. Resolve Classes Offered
  const classesOffered = (Array.isArray(campus.classesOffered) ? campus.classesOffered : [])
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean);

  // 3. Resolve Class Range
  const classRange = deriveCampusClassRange(
    classesOffered,
    campus.classesOfferedFrom,
    campus.classesOfferedTo,
    campus.classRange
  );

  const classesOfferedFrom =
    campus.classesOfferedFrom || (classesOffered.length > 0 ? classesOffered[0] : undefined);
  const classesOfferedTo =
    campus.classesOfferedTo || (classesOffered.length > 0 ? classesOffered[classesOffered.length - 1] : undefined);

  const wingDescription = (campus.wingDescription || campus.academicDescription || '').trim() || undefined;
  const schoolType = (campus.schoolType || '').trim() || undefined;

  return {
    academicLevels,
    schoolType,
    classesOffered,
    classesOfferedFrom,
    classesOfferedTo,
    classRange,
    wingDescription,
  };
}

/**
 * Helper to join academic level names grammatically:
 * e.g. ['Pre-Primary'] -> 'Pre-Primary'
 * e.g. ['Pre-Primary', 'Primary'] -> 'Pre-Primary & Primary'
 * e.g. ['Pre-Primary', 'Primary', 'Secondary'] -> 'Pre-Primary, Primary & Secondary'
 */
export function formatAcademicLevelHeadline(levels: string[]): string {
  const clean = Array.from(new Set(levels.map((l) => l.trim()).filter(Boolean)));
  if (clean.length === 0) return 'Academics';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} & ${clean[1]}`;
  return `${clean.slice(0, -1).join(', ')} & ${clean[clean.length - 1]}`;
}

/**
 * DERIVED SCHOOL-LEVEL ACADEMIC SUMMARY
 *
 * Authoritative aggregator across all campuses.
 * Guarantees that:
 * 1. If campuses have differing scopes, campus-specific values are surfaced and no
 *    false global class range (e.g. "Nursery to Class 5" or "Nursery to Class 12") is shown.
 * 2. If all campuses share the same academic scope, a consolidated school-level range is surfaced.
 * 3. Dynamic updates in any campus immediately recalculate the aggregate.
 * 4. Legacy multi-campus records without campus allocations are preserved as unspecified
 *    without fabricating assignments.
 */
export function deriveSchoolAcademicSummary(
  campuses?: CampusBranchData[] | null,
  fallbackStructure?: AcademicStructureData | null,
  fallbackProfile?: SchoolIdentityData | null
): SchoolAcademicSummary {
  const validCampuses = Array.isArray(campuses) ? campuses : [];
  const totalCampuses = validCampuses.length;
  const isMultiCampus = totalCampuses > 1;

  // Case A: No campuses configured at all
  if (totalCampuses === 0) {
    const legacyClasses = (fallbackStructure?.classes || [])
      .map((c) => c.name)
      .filter(Boolean);
    const legacyRange = deriveCampusClassRange(
      legacyClasses,
      fallbackStructure?.classesOfferedFrom,
      fallbackStructure?.classesOfferedTo
    );
    const legacyLevels = fallbackProfile?.schoolLevel || ['K-12'];

    return {
      isMultiCampus: false,
      totalCampuses: 0,
      hasCampusSpecificData: false,
      isConsolidated: true,
      headlineSummary: formatAcademicLevelHeadline(legacyLevels),
      subSummary: 'Single institution record',
      consolidatedClassRange: legacyRange || undefined,
      campusBreakdowns: [],
      isLegacyUnspecified: false,
      legacySummaryText: legacyRange ? `School-wide range: ${legacyRange}` : undefined,
    };
  }

  // Analyze each campus's academic scope
  const breakdowns: CampusAcademicBreakdown[] = [];
  let anyCampusHasData = false;

  for (let idx = 0; idx < validCampuses.length; idx++) {
    const camp = validCampuses[idx];
    const scope = deriveCampusAcademicScope(camp);
    const hasData = scope.academicLevels.length > 0 || scope.classesOffered.length > 0 || Boolean(scope.classRange);

    if (hasData) {
      anyCampusHasData = true;
    }

    const levelSummary = formatAcademicLevelHeadline(scope.academicLevels);
    const campusName = camp.name || (camp.isMainCampus ? 'Main Campus' : `Campus ${idx + 1}`);

    breakdowns.push({
      campusId: camp.id || `campus-${idx}`,
      campusName,
      isMainCampus: Boolean(camp.isMainCampus || idx === 0),
      academicLevels: scope.academicLevels,
      levelSummary: scope.academicLevels.length > 0 ? levelSummary : 'Scope Unspecified',
      classRange: scope.classRange || (scope.academicLevels.length > 0 ? scope.academicLevels.join(', ') : 'Not configured'),
      classes: scope.classesOffered,
      wingDescription: scope.wingDescription,
      schoolType: scope.schoolType,
    });
  }

  // Case B: Multi-campus legacy school with NO campus-specific data assigned
  if (isMultiCampus && !anyCampusHasData) {
    const legacyClasses = (fallbackStructure?.classes || [])
      .map((c) => c.name)
      .filter(Boolean);
    const legacyRange = deriveCampusClassRange(
      legacyClasses,
      fallbackStructure?.classesOfferedFrom,
      fallbackStructure?.classesOfferedTo
    );

    return {
      isMultiCampus: true,
      totalCampuses,
      hasCampusSpecificData: false,
      isConsolidated: false,
      headlineSummary: 'Academic Scope Pending Allocation',
      subSummary: `Preserved school-wide record across ${totalCampuses} campuses`,
      consolidatedClassRange: undefined, // Strictly prohibited: never fabricate a shared range!
      campusBreakdowns: breakdowns,
      isLegacyUnspecified: true,
      legacySummaryText: legacyRange
        ? `Legacy School-Wide Record (Unallocated): ${legacyRange}`
        : 'Legacy School-Wide Record: Unallocated',
    };
  }

  // Case C: Single Campus
  if (totalCampuses === 1) {
    const b = breakdowns[0];
    const singleRange = b.classRange !== 'Not configured' ? b.classRange : undefined;
    return {
      isMultiCampus: false,
      totalCampuses: 1,
      hasCampusSpecificData: anyCampusHasData,
      isConsolidated: true,
      headlineSummary: b.levelSummary !== 'Scope Unspecified' ? b.levelSummary : 'Academic Scope',
      subSummary: b.campusName || 'Main Campus',
      consolidatedClassRange: singleRange,
      campusBreakdowns: breakdowns,
      isLegacyUnspecified: false,
    };
  }

  // Case D: Multi-Campus with data
  // Check if ALL campuses share identical scope
  const first = breakdowns[0];
  const firstLevelKey = [...first.academicLevels].sort().map((l) => l.toLowerCase()).join('|');
  const normalizeRangeForCompare = (r: string) =>
    (r || '').toLowerCase().replace(/class\s*/g, '').replace(/grade\s*/g, '').replace(/\s+/g, '').replace(/–|-/g, 'to');
  const firstNormRange = normalizeRangeForCompare(first.classRange);

  const allIdentical = breakdowns.every((b) => {
    const levelKey = [...b.academicLevels].sort().map((l) => l.toLowerCase()).join('|');
    return (
      levelKey === firstLevelKey &&
      (b.classRange === first.classRange || normalizeRangeForCompare(b.classRange) === firstNormRange) &&
      b.classRange !== 'Not configured'
    );
  });

  // Collect all unique ordered levels across campuses
  const allLevelsOrdered: string[] = [];
  const seenLevels = new Set<string>();
  for (const b of breakdowns) {
    for (const l of b.academicLevels) {
      if (!seenLevels.has(l.toLowerCase())) {
        seenLevels.add(l.toLowerCase());
        allLevelsOrdered.push(l);
      }
    }
  }

  if (allIdentical) {
    return {
      isMultiCampus: true,
      totalCampuses,
      hasCampusSpecificData: true,
      isConsolidated: true,
      headlineSummary: first.levelSummary,
      subSummary: `Consolidated across all ${totalCampuses} campuses`,
      consolidatedClassRange: first.classRange,
      campusBreakdowns: breakdowns,
      isLegacyUnspecified: false,
    };
  }

  // Campuses have distinct academic scopes
  return {
    isMultiCampus: true,
    totalCampuses,
    hasCampusSpecificData: true,
    isConsolidated: false,
    headlineSummary: formatAcademicLevelHeadline(allLevelsOrdered),
    subSummary: `Across ${totalCampuses} campuses`,
    consolidatedClassRange: undefined, // NO false global class range!
    campusBreakdowns: breakdowns,
    isLegacyUnspecified: false,
  };
}

/**
 * SAFE LEGACY NORMALIZER FOR CAMPUS ACADEMIC DATA
 *
 * Implements the required pipeline:
 * Legacy school-level academic data
 *         ↓
 * Normalize into applicable campus data where appropriate
 *         ↓
 * Derived school-level aggregate
 *         ↓
 * UI
 *
 * Safety rules:
 * - If single campus: normalizes legacy school-wide classes and levels into the Main Campus.
 * - If multiple campuses: NEVER silently invents campus assignments. Leaves unallocated
 *   campuses clearly marked as unspecified so the admin can specify each campus.
 */
export function normalizeCampusAcademicData(
  campuses?: CampusBranchData[] | null,
  schoolProfile?: SchoolIdentityData | null,
  institutionStructure?: AcademicStructureData | null
): CampusBranchData[] {
  if (!campuses || campuses.length === 0) {
    const legacyClasses = (institutionStructure?.classes || []).map((c) => c.name).filter(Boolean);
    const legacyRange = deriveCampusClassRange(
      legacyClasses,
      institutionStructure?.classesOfferedFrom,
      institutionStructure?.classesOfferedTo
    );
    const legacyLevels = schoolProfile?.schoolLevel || ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'];

    return [
      {
        id: 'campus-main',
        name: 'Main Campus',
        code: 'CMP-1',
        address: schoolProfile?.address || '',
        city: schoolProfile?.city || 'Motihari',
        state: schoolProfile?.state || 'Bihar',
        country: schoolProfile?.country || 'India',
        pin: schoolProfile?.pin || '845401',
        contactPhone: schoolProfile?.officialPhone || '',
        isMainCampus: true,
        academicLevels: legacyLevels,
        schoolType: schoolProfile?.schoolType || 'K-12 School',
        classesOffered: legacyClasses,
        classRange: legacyRange,
      },
    ];
  }

  // Single-campus: safe to hydrate from legacy school-level if missing
  if (campuses.length === 1) {
    const c = { ...campuses[0] };
    const hasLevels = Array.isArray(c.academicLevels) && c.academicLevels.length > 0;
    const hasClasses = Array.isArray(c.classesOffered) && c.classesOffered.length > 0;

    if (!hasLevels && schoolProfile?.schoolLevel && schoolProfile.schoolLevel.length > 0) {
      c.academicLevels = [...schoolProfile.schoolLevel];
    }
    if (!c.schoolType && schoolProfile?.schoolType) {
      c.schoolType = schoolProfile.schoolType;
    }

    if (!hasClasses && institutionStructure?.classes && institutionStructure.classes.length > 0) {
      c.classesOffered = institutionStructure.classes.map((cls) => cls.name).filter(Boolean);
    }

    c.classRange = deriveCampusClassRange(
      c.classesOffered,
      c.classesOfferedFrom || institutionStructure?.classesOfferedFrom,
      c.classesOfferedTo || institutionStructure?.classesOfferedTo,
      c.classRange
    );

    return [c];
  }

  // Multi-campus: do NOT fabricate assignments!
  return campuses.map((camp) => {
    const c = { ...camp };
    // Ensure array fields exist
    if (!Array.isArray(c.academicLevels)) {
      if (c.academicLevel) {
        c.academicLevels = [c.academicLevel];
      } else if (Array.isArray(c.schoolLevel)) {
        c.academicLevels = [...c.schoolLevel];
      } else if (c.schoolLevel) {
        c.academicLevels = [c.schoolLevel];
      } else {
        c.academicLevels = [];
      }
    }

    if (!Array.isArray(c.classesOffered)) {
      c.classesOffered = [];
    }

    // Keep classRange in sync if classes are populated
    if (c.classesOffered.length > 0) {
      c.classRange = deriveCampusClassRange(c.classesOffered, c.classesOfferedFrom, c.classesOfferedTo, c.classRange);
      if (!c.classesOfferedFrom) c.classesOfferedFrom = c.classesOffered[0];
      if (!c.classesOfferedTo) c.classesOfferedTo = c.classesOffered[c.classesOffered.length - 1];
    }

    return c;
  });
}

