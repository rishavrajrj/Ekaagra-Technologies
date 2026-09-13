/**
 * ==============================================================================
 * EKAAGRA TECHNOLOGIES — HIERARCHICAL ONBOARDING NAVIGATION ENGINE
 * Single Source of Truth for Hierarchical Steps, Sub-Pages, and Transitions
 * File: src/lib/schoolNavigationHierarchy.ts
 * ==============================================================================
 */

import type {
  UniversalIntakeData,
  SchoolIntakeChangeRequest,
} from './types';
import type {
  IntakeSectionKey,
  IntakeChapterKey,
  SectionMetadata,
} from './schoolIntake';

/**
 * Declarative definition of a child sub-page within an onboarding section.
 */
export interface ChildStepDefinition {
  subTabKey: string;
  title: string;
  shortTitle: string;
  slug: string; // URL slug segment, e.g. 'class-wise'
  description?: string;
  isMandatory?: boolean;
  aliases?: string[];
}

/**
 * Central registry mapping sections to their child sub-pages.
 * Reusable for any section containing tabs, steps, or multi-page forms.
 */
export const SECTION_CHILDREN_REGISTRY: Partial<
  Record<
    IntakeSectionKey,
    ChildStepDefinition[] | ((intakeData?: Partial<UniversalIntakeData> | null, productId?: string | null) => ChildStepDefinition[])
  >
> = {
  // 1. Curriculum (3 sub-pages)
  curriculum: [
    {
      subTabKey: 'overview',
      title: 'Curriculum Overview & Educational Philosophy',
      shortTitle: 'Curriculum Overview',
      slug: 'overview',
      description: 'Affiliation board, curriculum framework, pedagogy, and learning philosophy.',
      isMandatory: true,
      aliases: ['curriculum-overview', 'overview', 'pedagogy', 'step-1', '1'],
    },
    {
      subTabKey: 'class_curriculum',
      title: 'Class-wise Curriculum & Subject Mapping',
      shortTitle: 'Class-wise Curriculum',
      slug: 'class-wise',
      description: 'Grade-wise subject assignments, learning objectives, and curriculum objectives.',
      isMandatory: true,
      aliases: ['class-wise', 'class-curriculum', 'class_curriculum', 'classwise', 'step-2', '2'],
    },
    {
      subTabKey: 'subjects',
      title: 'Subject Catalog & Master Offerings',
      shortTitle: 'Subject Catalog',
      slug: 'subjects',
      description: 'Master catalog of core academic and co-scholastic subjects with categories.',
      isMandatory: true,
      aliases: ['subjects', 'subject-catalog', 'catalog', 'step-3', '3'],
    },
  ],

  // 2. Fees & Finance Configuration (8 sub-pages)
  feesConfiguration: [
    {
      subTabKey: 'common_fees',
      title: 'Common Base Fees & Installments',
      shortTitle: 'Common Fees',
      slug: 'common-fees',
      description: 'Recurring academic and composite tuition fees inherited by all classes.',
      isMandatory: true,
      aliases: ['common-fees', 'common_fees', 'common', 'step-1', '1'],
    },
    {
      subTabKey: 'admission_fees',
      title: 'One-Time Admission & Registration Fees',
      shortTitle: 'Admission Fees',
      slug: 'admission-fees',
      description: 'One-time registration, caution money, and new student admission charges.',
      isMandatory: true,
      aliases: ['admission-fees', 'admission_fees', 'admission', 'step-2', '2'],
    },
    {
      subTabKey: 'optional_services',
      title: 'Optional Ancillary & Residential Services',
      shortTitle: 'Optional Services',
      slug: 'optional-services',
      description: 'Optional fees for transport, boarding hostel, cafeteria, and enrichment.',
      isMandatory: false,
      aliases: ['optional-services', 'optional_services', 'optional', 'services', 'step-3', '3'],
    },
    {
      subTabKey: 'class_matrix',
      title: 'Class-wise Fee Matrix & Overrides',
      shortTitle: 'Class-wise Matrix',
      slug: 'class-matrix',
      description: 'Class-by-class fee schedule with specific grade overrides.',
      isMandatory: true,
      aliases: ['class-matrix', 'class_matrix', 'matrix', 'class-wise', 'step-4', '4'],
    },
    {
      subTabKey: 'payment_plans',
      title: 'Payment Schedules & Installment Frequencies',
      shortTitle: 'Payment Plans',
      slug: 'payment-plans',
      description: 'Annual, quarterly, and monthly fee collection frequency options.',
      isMandatory: true,
      aliases: ['payment-plans', 'payment_plans', 'payment', 'plans', 'step-5', '5'],
    },
    {
      subTabKey: 'scholarships',
      title: 'Scholarships, Concessions & Waivers',
      shortTitle: 'Scholarships & Discounts',
      slug: 'scholarships',
      description: 'Merit waivers, sibling concessions, staff children, and defence discounts.',
      isMandatory: false,
      aliases: ['scholarships', 'discounts', 'concessions', 'step-6', '6'],
    },
    {
      subTabKey: 'inclusions_notes',
      title: 'Statutory Inclusions & Refund Policies',
      shortTitle: 'Inclusions & Policies',
      slug: 'inclusions-policies',
      description: 'Public fee inclusions sentence, due dates, late fees, and refund rules.',
      isMandatory: true,
      aliases: ['inclusions-policies', 'inclusions_notes', 'inclusions', 'policies', 'step-7', '7'],
    },
    {
      subTabKey: 'preview',
      title: 'Public Fee Schedule Live Preview',
      shortTitle: 'Live Preview',
      slug: 'preview',
      description: 'Interactive parent fee preview simulator and validation scorecard.',
      isMandatory: false,
      aliases: ['preview', 'fee-preview', 'step-8', '8'],
    },
  ],

  // 3. Campus Facilities (3 sub-stages)
  facilitiesConfig: [
    {
      subTabKey: 'availability',
      title: 'Campus Facility Availability Roster',
      shortTitle: 'Facility Availability',
      slug: 'availability',
      description: 'Identify operational laboratories, sports amenities, and campus infrastructure.',
      isMandatory: true,
      aliases: ['availability', 'select', 'facilities-availability', 'step-1', '1'],
    },
    {
      subTabKey: 'details',
      title: 'Facility Technical Specifications & Equipment',
      shortTitle: 'Facility Details',
      slug: 'details',
      description: 'Lab counts, workstation setups, equipment specifications, and safety measures.',
      isMandatory: true,
      aliases: ['details', 'configure', 'facility-details', 'step-2', '2'],
    },
    {
      subTabKey: 'preview',
      title: 'Facilities Showcase & Website Preview',
      shortTitle: 'Website Preview',
      slug: 'preview',
      description: 'Visual showcase of campus facilities for public presentation.',
      isMandatory: false,
      aliases: ['preview', 'summary', 'facilities-preview', 'step-3', '3'],
    },
  ],

  // 4. Hostel & Boarding (Dynamic: 3 sub-pages for website-only, 6 for ERP)
  hostelConfig: (_intakeData, productId) => {
    const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
    if (isWebsiteOnly) {
      return [
        {
          subTabKey: 'overview',
          title: 'Residential Boarding Models & Capacity',
          shortTitle: 'Overview & Models',
          slug: 'overview',
          description: 'Hostel types, boarding capacity, and resident supervision framework.',
          isMandatory: true,
          aliases: ['overview', 'models', 'step-1', '1'],
        },
        {
          subTabKey: 'policies',
          title: 'Mess Nutrition, Medical & Security Highlights',
          shortTitle: 'Mess & Safety Highlights',
          slug: 'policies',
          description: 'Catering menu, medical ward, night wardens, and campus safety.',
          isMandatory: true,
          aliases: ['policies', 'mess', 'safety', 'step-2', '2'],
        },
        {
          subTabKey: 'photos',
          title: 'Hostel & Residential Photography Showcase',
          shortTitle: 'Photos',
          slug: 'photos',
          description: 'High-resolution dormitory and living amenities photographs.',
          isMandatory: false,
          aliases: ['photos', 'photography', 'gallery', 'step-3', '3'],
        },
      ];
    }
    return [
      {
        subTabKey: 'overview',
        title: 'Residential Boarding Models & Capacity',
        shortTitle: 'Overview & Models',
        slug: 'overview',
        description: 'Hostel types, boarding capacity, and resident supervision framework.',
        isMandatory: true,
        aliases: ['overview', 'models', 'step-1', '1'],
      },
      {
        subTabKey: 'buildings',
        title: 'Hostel Buildings & Dormitory Blocks',
        shortTitle: 'Buildings',
        slug: 'buildings',
        description: 'Block names, wardens, floor plans, and gender segregation.',
        isMandatory: true,
        aliases: ['buildings', 'blocks', 'step-2', '2'],
      },
      {
        subTabKey: 'rooms',
        title: 'Room Management & Bed Allocations',
        shortTitle: 'Rooms',
        slug: 'rooms',
        description: 'Room inventory, bed capacities, air conditioning, and attached washrooms.',
        isMandatory: true,
        aliases: ['rooms', 'beds', 'step-3', '3'],
      },
      {
        subTabKey: 'residents',
        title: 'Residential Students & Warden Allocations',
        shortTitle: 'Residents',
        slug: 'residents',
        description: 'Student bed assignments, medical notes, and local guardians.',
        isMandatory: false,
        aliases: ['residents', 'students', 'step-4', '4'],
      },
      {
        subTabKey: 'policies',
        title: 'Curfew, Mess, Hygiene & Emergency Policies',
        shortTitle: 'Curfew, Mess & Safety',
        slug: 'policies',
        description: 'Visiting hours, dining schedule, laundry, and infirmary coverage.',
        isMandatory: true,
        aliases: ['policies', 'safety', 'step-5', '5'],
      },
      {
        subTabKey: 'photos',
        title: 'Hostel Photography Showcase',
        shortTitle: 'Photography',
        slug: 'photos',
        description: 'Photographic documentation of boarding premises.',
        isMandatory: false,
        aliases: ['photos', 'photography', 'gallery', 'step-6', '6'],
      },
    ];
  },

  // 5. Student Information System (3 stages)
  studentConfig: [
    {
      subTabKey: 'fields',
      title: 'Student Profile Information & Enabled Fields',
      shortTitle: 'Choose Information',
      slug: 'fields',
      description: 'Select biographical, statutory, transport, and guardian fields to collect.',
      isMandatory: true,
      aliases: ['fields', 'choose', 'schema', 'step-1', '1'],
    },
    {
      subTabKey: 'template',
      title: 'Import Template & Field Review',
      shortTitle: 'Review & Template',
      slug: 'template',
      description: 'Download custom spreadsheet template pre-configured for your school.',
      isMandatory: true,
      aliases: ['template', 'review-template', 'excel', 'step-2', '2'],
    },
    {
      subTabKey: 'directory',
      title: 'Student Roster & Direct Enrollment',
      shortTitle: 'Enrolled Directory',
      slug: 'directory',
      description: 'Active student roster, class lists, and bulk enrollment intake.',
      isMandatory: false,
      aliases: ['directory', 'roster', 'students', 'step-3', '3'],
    },
  ],

  // 6. Staff & Faculty Directory (Dynamic: single for website-only, 4 for ERP)
  staffFaculty: (_intakeData, productId) => {
    const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
    if (isWebsiteOnly) {
      return [];
    }
    return [
      {
        subTabKey: 'directory',
        title: 'Staff & Faculty Master Directory',
        shortTitle: 'Staff Directory',
        slug: 'directory',
        description: 'Complete institutional staff directory with website showcase toggles.',
        isMandatory: true,
        aliases: ['directory', 'staff-directory', 'roster', 'step-1', '1'],
      },
      {
        subTabKey: 'fields',
        title: 'Staff Field Configuration & Custom Attributes',
        shortTitle: 'Configure Fields',
        slug: 'fields',
        description: 'Customize institutional fields, employment metrics, and custom tags.',
        isMandatory: true,
        aliases: ['fields', 'staff-fields', 'step-2', '2'],
      },
      {
        subTabKey: 'template',
        title: 'Custom Staff Import Template',
        shortTitle: 'Download Template',
        slug: 'template',
        description: 'Export customized spreadsheet roster for offline data preparation.',
        isMandatory: false,
        aliases: ['template', 'staff-template', 'download', 'step-3', '3'],
      },
      {
        subTabKey: 'import',
        title: 'Staff Roster Bulk Import & Validation',
        shortTitle: 'Import Staff Roster',
        slug: 'import',
        description: 'Upload filled staff spreadsheet with real-time error validation.',
        isMandatory: false,
        aliases: ['import', 'staff-import', 'upload', 'step-4', '4'],
      },
    ];
  },

  // 7. Academic Structure & Organization (8 sequential steps)
  institutionStructure: [
    {
      subTabKey: 'step-1',
      title: 'Academic Session & Operating Year',
      shortTitle: 'Academic Year',
      slug: 'academic-year',
      description: 'Current active session name, start date, and end date.',
      isMandatory: true,
      aliases: ['academic-year', 'year', 'session', 'step-1', '1'],
    },
    {
      subTabKey: 'step-2',
      title: 'Grades, Classes & Academic Levels',
      shortTitle: 'Grades & Classes',
      slug: 'grades-classes',
      description: 'Active classes offered from foundational kindergarten through senior secondary.',
      isMandatory: true,
      aliases: ['grades-classes', 'grades', 'classes', 'step-2', '2'],
    },
    {
      subTabKey: 'step-3',
      title: 'Sections & Senior Academic Streams',
      shortTitle: 'Sections & Streams',
      slug: 'sections-streams',
      description: 'Section designations per class and specialized streams (Science, Commerce, Arts).',
      isMandatory: true,
      aliases: ['sections-streams', 'sections', 'streams', 'step-3', '3'],
    },
    {
      subTabKey: 'step-4',
      title: 'Institutional Subject Catalog',
      shortTitle: 'Subject Catalog',
      slug: 'subject-catalog',
      description: 'Define academic subjects, course codes, and evaluation types.',
      isMandatory: true,
      aliases: ['subject-catalog', 'subjects', 'step-4', '4'],
    },
    {
      subTabKey: 'step-5',
      title: 'Class-Subject Applicability Matrix',
      shortTitle: 'Subject Applicability',
      slug: 'subject-applicability',
      description: 'Map mandatory and elective subjects to corresponding class levels.',
      isMandatory: true,
      aliases: ['subject-applicability', 'applicability', 'step-5', '5'],
    },
    {
      subTabKey: 'step-6',
      title: 'Subject Teacher Assignments',
      shortTitle: 'Subject Teachers',
      slug: 'subject-teachers',
      description: 'Assign qualified faculty to subjects across classes and sections.',
      isMandatory: false,
      aliases: ['subject-teachers', 'teachers', 'step-6', '6'],
    },
    {
      subTabKey: 'step-7',
      title: 'Class Teacher Appointments',
      shortTitle: 'Class Teachers',
      slug: 'class-teachers',
      description: 'Assign dedicated mentors and class teachers for each classroom section.',
      isMandatory: false,
      aliases: ['class-teachers', 'mentors', 'step-7', '7'],
    },
    {
      subTabKey: 'step-8',
      title: 'Academic Structure Review & Sign-Off',
      shortTitle: 'Academic Review',
      slug: 'academic-review',
      description: 'Comprehensive review of academic structure before operational activation.',
      isMandatory: true,
      aliases: ['academic-review', 'review', 'step-8', '8'],
    },
  ],

  // 8. Transport Fleet (Dynamic: 2 tabs for ERP when operated)
  transportConfig: (intakeData, productId) => {
    const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
    const isOperated = intakeData?.transportConfig?.status === 'yes';
    if (isWebsiteOnly || !isOperated) {
      return [];
    }
    return [
      {
        subTabKey: 'config',
        title: 'Transport Fleet, Routes & Vehicle Cards',
        shortTitle: 'Operational Setup',
        slug: 'setup',
        description: 'Vehicles, drivers, routes, stop timings, and coverage boundaries.',
        isMandatory: true,
        aliases: ['setup', 'config', 'fleet', 'routes', 'step-1', '1'],
      },
      {
        subTabKey: 'attendance',
        title: 'Daily Transit Tablet Live Console',
        shortTitle: 'Tablet Live Console',
        slug: 'attendance',
        description: 'Real-time passenger roster and conductor tablet verification terminal.',
        isMandatory: false,
        aliases: ['attendance', 'tablet', 'transit', 'step-2', '2'],
      },
    ];
  },
};

/**
 * Resolves child step definitions for a given section, respecting product scope and intake state.
 */
export function getSectionChildSteps(
  sectionKey: IntakeSectionKey,
  intakeData?: Partial<UniversalIntakeData> | null,
  productId?: string | null
): ChildStepDefinition[] {
  const entry = SECTION_CHILDREN_REGISTRY[sectionKey];
  if (!entry) return [];
  if (typeof entry === 'function') {
    return entry(intakeData, productId);
  }
  return entry;
}

/**
 * Hierarchical tree node representation of an onboarding step.
 */
export interface PortalStepNode {
  id: string; // e.g. 'curriculum' or 'curriculum.overview'
  sectionKey: IntakeSectionKey;
  subTabKey?: string;
  title: string;
  shortTitle: string;
  slug: string;
  fullPath: string; // e.g. 'curriculum/class-wise'
  chapter: IntakeChapterKey;
  description?: string;
  isMandatory: boolean;
  children?: PortalStepNode[];
}

/**
 * Concrete, flattened sequential step that can be navigated to linearly.
 */
export interface NavigableStep {
  id: string;
  sectionKey: IntakeSectionKey;
  subTabKey?: string;
  title: string;
  shortTitle: string;
  slug: string;
  fullPath: string;
  chapter: IntakeChapterKey;
  isMandatory: boolean;
  isChildStep: boolean;
  parentSectionKey?: IntakeSectionKey;
  childIndex?: number;
  totalChildren?: number;
  isFirstChild?: boolean;
  isLastChild?: boolean;
}

/**
 * Builds the hierarchical navigation tree for applicable sections and project data.
 */
export function buildHierarchicalNavigation(
  applicableSections: SectionMetadata[],
  intakeData?: Partial<UniversalIntakeData> | null,
  productId?: string | null
): PortalStepNode[] {
  return applicableSections.map((sec) => {
    const childDefs = getSectionChildSteps(sec.key, intakeData, productId);

    if (childDefs && childDefs.length > 0) {
      const children: PortalStepNode[] = childDefs.map((child) => ({
        id: `${sec.key}.${child.subTabKey}`,
        sectionKey: sec.key,
        subTabKey: child.subTabKey,
        title: child.title,
        shortTitle: child.shortTitle,
        slug: child.slug,
        fullPath: `${sec.key}/${child.slug}`,
        chapter: sec.chapter,
        description: child.description,
        isMandatory: child.isMandatory ?? sec.isMandatory,
      }));

      return {
        id: sec.key,
        sectionKey: sec.key,
        title: sec.title,
        shortTitle: sec.shortTitle,
        slug: sec.key,
        fullPath: sec.key,
        chapter: sec.chapter,
        description: sec.description,
        isMandatory: sec.isMandatory,
        children,
      };
    }

    return {
      id: sec.key,
      sectionKey: sec.key,
      title: sec.title,
      shortTitle: sec.shortTitle,
      slug: sec.key,
      fullPath: sec.key,
      chapter: sec.chapter,
      description: sec.description,
      isMandatory: sec.isMandatory,
    };
  });
}

/**
 * Flattens the hierarchical tree into a strictly ordered linear sequence of navigable leaf steps.
 * Sections with children expand sequentially: Child 1 -> Child 2 -> Child 3 -> Next Section.
 */
export function flattenNavigableSteps(hierarchy: PortalStepNode[]): NavigableStep[] {
  const steps: NavigableStep[] = [];

  for (const node of hierarchy) {
    if (node.children && node.children.length > 0) {
      const childCount = node.children.length;
      node.children.forEach((child, idx) => {
        steps.push({
          id: child.id,
          sectionKey: child.sectionKey,
          subTabKey: child.subTabKey,
          title: child.title,
          shortTitle: child.shortTitle,
          slug: child.slug,
          fullPath: child.fullPath,
          chapter: child.chapter,
          isMandatory: child.isMandatory,
          isChildStep: true,
          parentSectionKey: node.sectionKey,
          childIndex: idx,
          totalChildren: childCount,
          isFirstChild: idx === 0,
          isLastChild: idx === childCount - 1,
        });
      });
    } else {
      steps.push({
        id: node.id,
        sectionKey: node.sectionKey,
        title: node.title,
        shortTitle: node.shortTitle,
        slug: node.slug,
        fullPath: node.fullPath,
        chapter: node.chapter,
        isMandatory: node.isMandatory,
        isChildStep: false,
      });
    }
  }

  return steps;
}

/**
 * Finds the index of a step in the flattened sequence.
 */
export function findStepIndex(
  steps: NavigableStep[],
  target: { sectionKey: IntakeSectionKey; subTabKey?: string }
): number {
  if (target.subTabKey) {
    const exactIdx = steps.findIndex(
      (s) => s.sectionKey === target.sectionKey && s.subTabKey === target.subTabKey
    );
    if (exactIdx !== -1) return exactIdx;
  }
  // Fallback to first step matching sectionKey
  return steps.findIndex((s) => s.sectionKey === target.sectionKey);
}

/**
 * Resolves the next navigable step in the linear hierarchy.
 */
export function getNextNavigableStep(
  current: { sectionKey: IntakeSectionKey; subTabKey?: string },
  flattenedSteps: NavigableStep[],
  _intakeData?: Partial<UniversalIntakeData> | null,
  _changeRequests?: SchoolIntakeChangeRequest[]
): NavigableStep | null {
  if (flattenedSteps.length === 0) return null;

  const currentIdx = findStepIndex(flattenedSteps, current);
  if (currentIdx === -1) {
    return flattenedSteps[0] || null;
  }

  if (currentIdx < flattenedSteps.length - 1) {
    return flattenedSteps[currentIdx + 1];
  }

  return null; // Already on last step
}

/**
 * Resolves the previous navigable step in the linear hierarchy.
 */
export function getPreviousNavigableStep(
  current: { sectionKey: IntakeSectionKey; subTabKey?: string },
  flattenedSteps: NavigableStep[],
  _intakeData?: Partial<UniversalIntakeData> | null
): NavigableStep | null {
  if (flattenedSteps.length === 0) return null;

  const currentIdx = findStepIndex(flattenedSteps, current);
  if (currentIdx > 0) {
    return flattenedSteps[currentIdx - 1];
  }

  return null; // Already on first step
}

/**
 * Resolves a URL slug or path segments to a concrete NavigableStep.
 * Accepts arrays e.g. ['curriculum', 'class-wise'] or strings e.g. 'curriculum/class-wise' or 'curriculum?subPage=class_curriculum'.
 */
export function resolveStepFromSlugOrUrl(
  slugOrPath: string | string[] | undefined | null,
  flattenedSteps: NavigableStep[]
): NavigableStep | null {
  if (!slugOrPath || flattenedSteps.length === 0) return null;

  let rawString = '';
  if (Array.isArray(slugOrPath)) {
    rawString = slugOrPath.map((s) => s.trim().toLowerCase()).filter(Boolean).join('/');
  } else {
    rawString = slugOrPath.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
  }

  if (!rawString) return null;

  // Strip query parameters if present in raw string
  const [cleanPath, queryPart] = rawString.split('?');
  const segments = cleanPath.split('/').filter(Boolean);

  // Parse query params if any
  let querySection: string | null = null;
  let querySubPage: string | null = null;
  if (queryPart) {
    const qParams = new URLSearchParams(queryPart);
    querySection = qParams.get('section') || (segments.length === 1 ? segments[0] : null);
    querySubPage = qParams.get('subpage') || qParams.get('sub_page') || qParams.get('step') || qParams.get('tab');
  }

  // Special alias handling for final-review
  if (cleanPath === 'final-review' || segments[0] === 'final-review' || querySection === 'websiteRequirements') {
    const reviewStep = flattenedSteps.find((s) => s.sectionKey === 'websiteRequirements');
    if (reviewStep) return reviewStep;
  }

  // If query parameters specify section + subpage
  if (querySection) {
    const matched = flattenedSteps.find((s) => {
      if (s.sectionKey.toLowerCase() !== querySection.toLowerCase()) return false;
      if (!querySubPage) return true;
      if (s.subTabKey?.toLowerCase() === querySubPage.toLowerCase()) return true;
      if (s.slug.toLowerCase() === querySubPage.toLowerCase()) return true;
      const childDef = getSectionChildSteps(s.sectionKey).find((c) => c.subTabKey === s.subTabKey);
      if (childDef?.aliases?.some((a) => a.toLowerCase() === querySubPage.toLowerCase())) return true;
      return false;
    });
    if (matched) return matched;
  }

  // 1. Exact fullPath match (e.g. 'curriculum/class-wise')
  const exactPathMatch = flattenedSteps.find(
    (s) => s.fullPath.toLowerCase() === cleanPath
  );
  if (exactPathMatch) return exactPathMatch;

  // 2. Section + SubTab alias matching (e.g. ['curriculum', 'class-wise'] or ['curriculum', 'subjects'])
  if (segments.length >= 2) {
    const [secSeg, subSeg] = segments;
    const matched = flattenedSteps.find((s) => {
      const isSecMatch = s.sectionKey.toLowerCase() === secSeg || s.slug.toLowerCase() === secSeg;
      if (!isSecMatch) return false;

      const isSubMatch =
        s.slug.toLowerCase() === subSeg ||
        s.subTabKey?.toLowerCase() === subSeg ||
        Boolean(
          getSectionChildSteps(s.sectionKey)
            .find((c) => c.subTabKey === s.subTabKey)
            ?.aliases?.some((a) => a.toLowerCase() === subSeg)
        );
      return isSubMatch;
    });
    if (matched) return matched;
  }

  // 3. Section key match (returns first child or root section)
  if (segments.length >= 1) {
    const secMatch = flattenedSteps.find(
      (s) => s.sectionKey.toLowerCase() === segments[0] || s.slug.toLowerCase() === segments[0]
    );
    if (secMatch) return secMatch;
  }

  return null;
}

/**
 * Builds the canonical relative URL path segment for a navigable step.
 * e.g. '/school-onboarding/TOKEN/curriculum/class-wise' or query parameters.
 */
export function buildStepUrlPath(
  step: NavigableStep,
  basePath: string = ''
): string {
  const cleanBase = basePath.replace(/\/+$/, '');
  if (step.sectionKey === 'websiteRequirements') {
    return `${cleanBase}/final-review`;
  }
  if (step.isChildStep && step.parentSectionKey) {
    return `${cleanBase}/${step.parentSectionKey}/${step.slug}`;
  }
  return `${cleanBase}/${step.sectionKey}`;
}

/**
 * Checks change request count for a specific step or child page.
 */
export function getStepChangeRequestCount(
  step: NavigableStep,
  changeRequests?: SchoolIntakeChangeRequest[]
): number {
  if (!changeRequests || changeRequests.length === 0) return 0;

  return changeRequests.filter((cr) => {
    if (cr.status !== 'open' && cr.status !== 'waiting_for_school') return false;

    // Direct section match
    const isMatchingSection =
      cr.section_key === step.sectionKey ||
      (step.sectionKey === 'curriculum' && (cr.section_key === 'curriculum' || cr.section_key === 'academics'));

    if (!isMatchingSection) return false;

    // If this step is a specific child page, filter by field relevance
    if (step.isChildStep && step.subTabKey) {
      const field = (cr.field_key || cr.asset_id || '').toLowerCase();
      if (step.subTabKey === 'overview') {
        return (
          field.includes('overview') ||
          field.includes('board') ||
          field.includes('approach') ||
          field.includes('philosophy') ||
          field.includes('methodology')
        );
      }
      if (step.subTabKey === 'class_curriculum') {
        return field.includes('class') || field.includes('grade') || field.includes('mapping');
      }
      if (step.subTabKey === 'subjects') {
        return field.includes('subject') || field.includes('catalog');
      }
    }

    return true;
  }).length;
}
