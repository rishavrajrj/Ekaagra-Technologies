import type {
  SubjectItem,
  ClassCurriculumItem,
  CurriculumData,
  AcademicClassConfig,
} from './types';

export interface BoardCurriculumPreset {
  boardKey: string;
  boardDisplayName: string;
  overview: {
    board: string;
    curriculumType: string;
    academicApproach: string;
    learningPhilosophy: string;
    teachingMethodology: string;
    assessmentApproach: string;
  };
  subjects: SubjectItem[];
}

export const BOARD_CURRICULUM_PRESETS: Record<string, BoardCurriculumPreset> = {
  CBSE: {
    boardKey: 'CBSE',
    boardDisplayName: 'CBSE (Central Board of Secondary Education)',
    overview: {
      board: 'CBSE',
      curriculumType: 'National Curriculum Framework (NCF / NEP 2020)',
      academicApproach: 'Experiential, Inquiry-Based & Multidisciplinary',
      learningPhilosophy:
        'Nurturing intellectual curiosity, ethical character, critical thinking, and 21st-century problem-solving capabilities.',
      teachingMethodology:
        'Interactive digital smart boards, hands-on composite science laboratories, project-based inquiry, and differentiated student mentoring.',
      assessmentApproach:
        'Continuous and Comprehensive Evaluation (CCE), internal unit assessments, and standardized term-end examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'English Language & Literature', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Hindi / Regional Language', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Science & Discovery', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Social Studies & Civics', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Computer Science & Coding', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Visual Arts & Craft', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical Education & Yoga', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Value Education & Life Skills', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  ICSE: {
    boardKey: 'CISCE / ICSE',
    boardDisplayName: 'CISCE / ICSE (Council for the Indian School Certificate Examinations)',
    overview: {
      board: 'CISCE / ICSE',
      curriculumType: 'Council for the Indian School Certificate Examinations (CISCE / ICSE Framework)',
      academicApproach: 'Comprehensive, Application-Oriented & Language-Rich',
      learningPhilosophy:
        'Cultivating in-depth conceptual clarity, literary appreciation, rigorous scientific inquiry, and global perspective.',
      teachingMethodology:
        'Detailed thematic instruction, laboratory experimentation, literature-driven discussions, and structured project coursework.',
      assessmentApproach:
        'Comprehensive internal assessments, laboratory practicals, project evaluations, and terminal board examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'English Language & Literature', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Second Language (Hindi / Regional)', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Science (Physics, Chemistry & Biology)', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'History, Civics & Geography', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Computer Applications', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Art Education & Craft', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical Education & SUPW', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Value Education & Environmental Studies', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  'State Board': {
    boardKey: 'State Board',
    boardDisplayName: 'State Board (BSEB / Other State Education Department)',
    overview: {
      board: 'State Board',
      curriculumType: 'State Curriculum Framework (SCERT / State Board)',
      academicApproach: 'Textbook-Centric, Foundational & Regionally Contextualized',
      learningPhilosophy:
        'Building solid foundational literacy, numeracy, regional cultural values, and accessible quality education for every child.',
      teachingMethodology:
        'Structured classroom teaching, textbook-driven exercises, bilingual explanations, and regular unit tests.',
      assessmentApproach:
        'Periodic unit assessments, half-yearly evaluations, and annual state board examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'Second Language (English)', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'First Language (Hindi / State Language)', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics (Ganit)', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'General Science (Vigyan)', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Social Science (Samajik Vigyan)', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Computer Literacy', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Visual Arts & Work Experience', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical & Health Education', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Moral Science & Life Skills', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  Cambridge: {
    boardKey: 'Cambridge',
    boardDisplayName: 'Cambridge Assessment International Education (IGCSE / A-Levels)',
    overview: {
      board: 'Cambridge',
      curriculumType: 'Cambridge International Curriculum (Cambridge Primary, Lower Secondary, IGCSE & A-Levels)',
      academicApproach: 'Learner-Centered, Analytical & Globally Benchmark-Aligned',
      learningPhilosophy:
        'Fostering intellectual curiosity, independent critical thinking, problem-solving, and international academic excellence.',
      teachingMethodology:
        'Inquiry-based learning, practical scientific investigation, analytical essay writing, and collaborative research.',
      assessmentApproach:
        'Cambridge Progression Tests, Checkpoint diagnostics, coursework portfolios, and Cambridge International examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'Cambridge English', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Second Language / Modern Foreign Language', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Cambridge Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Combined & Coordinated Sciences', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Global Perspectives & Humanities', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Computer Science & ICT', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Art & Design', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical Education & Wellbeing', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Life Skills & Digital Literacy', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  IB: {
    boardKey: 'IB',
    boardDisplayName: 'IB (International Baccalaureate)',
    overview: {
      board: 'IB',
      curriculumType: 'IB Continuum Framework (PYP, MYP & Diploma Programme)',
      academicApproach: 'Inquiry-Driven, Transdisciplinary & Concept-Based',
      learningPhilosophy:
        'Developing internationally minded, inquiring, knowledgeable, and caring young people who help create a better, more peaceful world.',
      teachingMethodology:
        'Units of Inquiry, student-led inquiry, conceptual synthesis, real-world action, and criterion-referenced tasks.',
      assessmentApproach:
        'Criterion-referenced continuous assessment, personal portfolios, internal exhibition projects, and IB examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'Language & Literature (English)', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Language Acquisition (Second Language)', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Integrated Sciences', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Individuals & Societies', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Design & Technology', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Visual & Performing Arts', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical & Health Education (PHE)', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Personal, Social & Emotional Development (PSE)', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  NIOS: {
    boardKey: 'NIOS',
    boardDisplayName: 'NIOS (National Institute of Open Schooling)',
    overview: {
      board: 'NIOS',
      curriculumType: 'National Institute of Open Schooling (Open & Flexible Learning Framework)',
      academicApproach: 'Self-Paced, Modular & Vocational-Integrated Learning',
      learningPhilosophy:
        'Empowering diverse learners with accessible, inclusive, and learner-centric academic and vocational education pathways.',
      teachingMethodology:
        'Self-instructional learning materials (SIM), audio-visual digital modules, personal contact programmes (PCP), and practical workshops.',
      assessmentApproach:
        'Tutor Marked Assignments (TMA), practical assessments, On-Demand Examinations (ODE), and public board examinations.',
    },
    subjects: [
      { id: 'sub-eng', name: 'English Language', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Hindi / Regional Language', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Science & Technology', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Social Science', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Basic Computing & IT Skills', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Painting & Crafts', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical Education & Yoga', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Vocational Skills & Life Orientation', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
  Other: {
    boardKey: 'Other',
    boardDisplayName: 'Other / Autonomous Board',
    overview: {
      board: 'Other',
      curriculumType: 'Standard Institutional Academic Framework',
      academicApproach: 'Holistic & Student-Centered Pedagogical Approach',
      learningPhilosophy:
        'Empowering students with strong intellectual foundations, creative self-expression, and sound ethical character.',
      teachingMethodology:
        'Interactive smart classrooms, laboratory demonstrations, collaborative group activities, and regular formative checks.',
      assessmentApproach:
        'Continuous formative evaluations, periodic chapter reviews, and term-end summative assessments.',
    },
    subjects: [
      { id: 'sub-eng', name: 'English Language & Literature', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-hin', name: 'Hindi / Regional Language', category: 'Language', isMandatory: true, applicableClasses: [] },
      { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sci', name: 'Science & Discovery', category: 'Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-sst', name: 'Social Studies & Civics', category: 'Social Science', isMandatory: true, applicableClasses: [] },
      { id: 'sub-cs', name: 'Computer Science & Coding', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
      { id: 'sub-art', name: 'Visual Arts & Craft', category: 'Arts', isMandatory: false, applicableClasses: [] },
      { id: 'sub-pe', name: 'Physical Education & Yoga', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
      { id: 'sub-life', name: 'Value Education & Life Skills', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
    ],
  },
};

/**
 * Normalizes a board string to a known preset key.
 */
export function normalizeBoardKey(board?: string | null): string {
  if (!board) return 'CBSE';
  const val = board.trim();
  const lower = val.toLowerCase();

  if (lower.includes('icse') || lower.includes('cisce')) return 'ICSE';
  if (lower.includes('state') || lower.includes('bseb') || lower.includes('up board')) return 'State Board';
  if (lower.includes('cambridge') || lower.includes('igcse') || lower.includes('caie')) return 'Cambridge';
  if (lower.includes('ib') || lower.includes('baccalaureate')) return 'IB';
  if (lower.includes('nios') || lower.includes('open schooling')) return 'NIOS';
  if (lower.includes('cbse')) return 'CBSE';
  if (lower === 'other' || lower.includes('non-affiliated') || lower.includes('autonomous')) return 'Other';

  return 'CBSE';
}

/**
 * Retrieve the authoritative curriculum preset for a given board.
 */
export function getCurriculumPresetForBoard(board?: string | null): BoardCurriculumPreset {
  const key = normalizeBoardKey(board);
  const preset = BOARD_CURRICULUM_PRESETS[key] || BOARD_CURRICULUM_PRESETS.CBSE;

  // If user entered a custom board name that is not a standard key, keep their custom name in overview
  if (board && !BOARD_CURRICULUM_PRESETS[board]) {
    return {
      ...preset,
      overview: {
        ...preset.overview,
        board: board.trim(),
      },
    };
  }

  return preset;
}

/**
 * Classifies a class by stage / educational level based on its level property or name.
 */
export type AcademicStage =
  | 'playgroup'
  | 'nursery'
  | 'kindergarten'
  | 'primary'
  | 'middle'
  | 'secondary'
  | 'senior_secondary';

export function getAcademicStageForClass(cls: AcademicClassConfig | string): AcademicStage {
  const name = (typeof cls === 'string' ? cls : cls.name || '').trim().toLowerCase();
  const level = (typeof cls === 'string' ? '' : cls.level || '').trim().toLowerCase();

  if (name.includes('playgroup') || name.includes('play group') || name.includes('pg') || name.includes('pre-nursery') || name.includes('creche')) {
    return 'playgroup';
  }
  if (name.includes('nursery') || name.includes('nur')) {
    return 'nursery';
  }
  if (name.includes('lkg') || name.includes('ukg') || name.includes('kg') || name.includes('kindergarten') || name.includes('prep')) {
    return 'kindergarten';
  }

  if (level.includes('pre-primary') || level.includes('foundational') || level.includes('pre_primary')) {
    return 'kindergarten';
  }

  // Check numerical grades
  const match = name.match(/(\d+)/);
  if (match) {
    const gradeNum = parseInt(match[1], 10);
    if (gradeNum >= 1 && gradeNum <= 5) return 'primary';
    if (gradeNum >= 6 && gradeNum <= 8) return 'middle';
    if (gradeNum >= 9 && gradeNum <= 10) return 'secondary';
    if (gradeNum >= 11 && gradeNum <= 12) return 'senior_secondary';
  }

  if (level.includes('primary') && !level.includes('pre-primary')) return 'primary';
  if (level.includes('middle')) return 'middle';
  if (level.includes('senior secondary') || level.includes('higher secondary')) return 'senior_secondary';
  if (level.includes('secondary')) return 'secondary';

  return 'primary';
}

/**
 * Returns default subject IDs and pedagogical description for a specific academic stage.
 */
export function getDefaultSubjectsForStage(stage: AcademicStage): {
  subjectIds: string[];
  description: string;
} {
  switch (stage) {
    case 'playgroup':
      // Exactly 5 foundational subjects matching the user's reference
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-art', 'sub-life'],
        description:
          'Foundational sensory exploration, gross and fine motor coordination, interactive storytelling, phonics, and early social-emotional development.',
      };
    case 'nursery':
      // 7 subjects: early language, math, early nature discovery, arts, physical movement & life skills
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-sci', 'sub-art', 'sub-pe', 'sub-life'],
        description:
          'Early language acquisition, foundational numeracy, discovery of nature, creative expression, and physical play.',
      };
    case 'kindergarten':
      // LKG / UKG: 8-9 foundational subjects
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-sci', 'sub-sst', 'sub-cs', 'sub-art', 'sub-pe', 'sub-life'],
        description:
          'Phonics, basic reading, number sense, environmental awareness, digital introduction, and creative arts.',
      };
    case 'primary':
      // Class 1 to 5: 9 core foundational subjects
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-sci', 'sub-sst', 'sub-cs', 'sub-art', 'sub-pe', 'sub-life'],
        description:
          'Foundational literacy and numeracy, environmental studies, scientific inquiry, computational fundamentals, and holistic co-curricular development.',
      };
    case 'middle':
      // Class 6 to 8: 9 subjects
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-sci', 'sub-sst', 'sub-cs', 'sub-art', 'sub-pe', 'sub-life'],
        description:
          'Concept-based laboratory science, analytical mathematics, bilingual proficiency, civic awareness, and digital literacy.',
      };
    case 'secondary':
      // Class 9 to 10: 7 board-focused subjects
      return {
        subjectIds: ['sub-eng', 'sub-hin', 'sub-mat', 'sub-sci', 'sub-sst', 'sub-cs', 'sub-pe'],
        description:
          'Rigorous board examination curriculum, practical laboratory science, advanced algebra and geometry, and wellness education.',
      };
    case 'senior_secondary':
      // Class 11 to 12: 5 core disciplinary subjects
      return {
        subjectIds: ['sub-eng', 'sub-mat', 'sub-sci', 'sub-cs', 'sub-pe'],
        description:
          'Advanced academic specialization, experimental investigation, analytical problem-solving, and university entrance preparation.',
      };
  }
}

/**
 * Generates comprehensive default class-wise curriculum mapping for active classes.
 */
export function generateDefaultClassCurricula(
  board: string,
  classes: AcademicClassConfig[],
  availableSubjects?: SubjectItem[]
): ClassCurriculumItem[] {
  const preset = getCurriculumPresetForBoard(board);
  const subjectsPool = availableSubjects && availableSubjects.length > 0 ? availableSubjects : preset.subjects;
  const validSubjectIds = new Set(subjectsPool.map((s) => s.id));

  return classes.map((cls) => {
    const stage = getAcademicStageForClass(cls);
    const { subjectIds, description } = getDefaultSubjectsForStage(stage);

    // Ensure subjectIds actually exist in available subjects pool
    const filteredSubjectIds = subjectIds.filter((id) => validSubjectIds.has(id));

    return {
      className: cls.name,
      classId: cls.id,
      subjects: filteredSubjectIds,
      learningAreas: [],
      learningObjectives: [],
      description,
    };
  });
}

/**
 * Returns a complete, fully initialized CurriculumData object for a given board and active classes.
 */
export function getInitialCurriculumData(
  board: string = 'CBSE',
  classes: AcademicClassConfig[] = []
): CurriculumData {
  const preset = getCurriculumPresetForBoard(board);
  const classCurricula = generateDefaultClassCurricula(board, classes, preset.subjects);

  // Mark applicableClasses on subjects based on classCurricula
  const subjectsWithApplicability: SubjectItem[] = preset.subjects.map((sub) => {
    const applicableClasses = classCurricula
      .filter((cc) => cc.subjects?.includes(sub.id))
      .map((cc) => cc.className);

    return {
      ...sub,
      applicableClasses,
    };
  });

  return {
    overview: preset.overview,
    subjects: subjectsWithApplicability,
    classCurricula,
  };
}
