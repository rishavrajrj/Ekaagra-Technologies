/**
 * campusScopeRegistry.ts
 *
 * Central configuration, scope classification, and inheritance engine for
 * multi-campus school onboarding.
 *
 * Core Guarantees:
 * 1. Single source of truth for section scope (SCHOOL_LEVEL, CAMPUS_LEVEL, MIXED).
 * 2. Reference & Inheritance Model: Inherited data is referenced rather than copied.
 * 3. Loop / Cycle Prevention: Guarantees that circular inheritance (A -> B -> A or
 *    A -> B -> C -> A) is impossible across any number of campuses.
 * 4. Backward Compatibility: Single-campus schools operate cleanly with zero overhead.
 * 5. Safe Mutation: Renaming, deleting, or switching the Main Campus designation
 *    propagates dynamically and never destroys valid records.
 */

import type {
  CampusBranchData,
  CampusDataSourceMode,
  CampusOverridesMap,
  CampusSectionOverride,
  UniversalIntakeData,
} from './types';
import type { IntakeSectionKey } from './schoolIntake';

export type SectionScope = 'SCHOOL_LEVEL' | 'CAMPUS_LEVEL' | 'MIXED';

export interface SectionScopeDefinition {
  sectionKey: IntakeSectionKey;
  scope: SectionScope;
  title: string;
  description: string;
  supportsInheritance: boolean;
  supportsNotApplicable: boolean;
  defaultSourceMode?: CampusDataSourceMode;
}

/**
 * Authoritative Section Scope Registry
 * Classifies every onboarding section across the 28-section catalog + legacy extensions.
 */
export const SECTION_SCOPE_REGISTRY: Record<IntakeSectionKey, SectionScopeDefinition> = {
  // Chapter 1: Identity & Campuses
  schoolProfile: {
    sectionKey: 'schoolProfile',
    scope: 'SCHOOL_LEVEL',
    title: 'School Identity & Permanent Legal Information',
    description: 'UDISE+ code, legal entity name, board affiliation, official email/phone.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  campuses: {
    sectionKey: 'campuses',
    scope: 'CAMPUS_LEVEL',
    title: 'Campuses & Branch Structure',
    description: 'Campus locations, postal addresses, GPS pins, coordinators, and wings.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  leadership: {
    sectionKey: 'leadership',
    scope: 'MIXED',
    title: 'Management & Leadership',
    description: 'Institutional Principal & Trustees are school-wide; campus heads or desk messages can be campus-specific.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },

  // Chapter 2: Branding & School Story
  brandingDesign: {
    sectionKey: 'brandingDesign',
    scope: 'SCHOOL_LEVEL',
    title: 'Brand Identity & Visual Design',
    description: 'School motto, crest, colors, and typography apply to the entire school.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  schoolContent: {
    sectionKey: 'schoolContent',
    scope: 'SCHOOL_LEVEL',
    title: 'School Story, Mission & Educational Philosophy',
    description: 'Institutional narrative, mission, vision, and pedagogy apply school-wide.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },

  // Chapter 3: Academics & People
  institutionStructure: {
    sectionKey: 'institutionStructure',
    scope: 'CAMPUS_LEVEL',
    title: 'Academic Structure & Curriculum',
    description: 'Classes offered, grade ranges, sections, and subjects taught per campus.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  staffFaculty: {
    sectionKey: 'staffFaculty',
    scope: 'CAMPUS_LEVEL',
    title: 'Staff & Faculty Configuration',
    description: 'Faculty rosters, teacher allocations, and department counts per campus.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  studentConfig: {
    sectionKey: 'studentConfig',
    scope: 'MIXED',
    title: 'Student Information & Configuration',
    description: 'Institutional numbering is school-wide; student roster counts and class allotments are campus-aware.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },

  // Chapter 4: Operations & Finance
  admissions: {
    sectionKey: 'admissions',
    scope: 'MIXED',
    title: 'Admissions Experience & Schedule',
    description: 'School-wide admission cycles and criteria; campus-specific in-charge contact, visiting hours, and fees.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  feesConfiguration: {
    sectionKey: 'feesConfiguration',
    scope: 'CAMPUS_LEVEL',
    title: 'Fees & Finance Ledger Configuration',
    description: 'Class-wise fee schedules, fee categories, and payment terms per campus.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  curriculum: {
    sectionKey: 'curriculum',
    scope: 'CAMPUS_LEVEL',
    title: 'Academic Curriculum & Subjects',
    description: 'Curriculum overview, pedagogical approach, class-wise curriculum objectives, and subjects taught per campus.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  attendanceConfig: {
    sectionKey: 'attendanceConfig',
    scope: 'CAMPUS_LEVEL',
    title: 'Attendance Workflow & Timetable Schedule',
    description: 'Campus shifts, daily timings, period counts, and alert channels.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  examinationConfig: {
    sectionKey: 'examinationConfig',
    scope: 'SCHOOL_LEVEL',
    title: 'Examinations, Grading & Report Cards',
    description: 'Institutional grading scales, report card templates, and assessment policies.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },

  // Chapter 5: Facilities & Campus Operations
  transportConfig: {
    sectionKey: 'transportConfig',
    scope: 'CAMPUS_LEVEL',
    title: 'Transport Fleet & Route Management',
    description: 'Bus fleet, routes, pickup stops, and transit tracking per campus.',
    supportsInheritance: true,
    supportsNotApplicable: true,
    defaultSourceMode: 'inherited',
  },
  facilitiesConfig: {
    sectionKey: 'facilitiesConfig',
    scope: 'CAMPUS_LEVEL',
    title: 'Campus Facilities & Infrastructure',
    description: 'Laboratories, sports grounds, smart classrooms, and amenities per campus.',
    supportsInheritance: true,
    supportsNotApplicable: true,
    defaultSourceMode: 'inherited',
  },
  libraryConfig: {
    sectionKey: 'libraryConfig',
    scope: 'CAMPUS_LEVEL',
    title: 'Library Management System',
    description: 'Library book collection, circulation rules, and catalog system per campus.',
    supportsInheritance: true,
    supportsNotApplicable: true,
    defaultSourceMode: 'inherited',
  },
  hostelConfig: {
    sectionKey: 'hostelConfig',
    scope: 'CAMPUS_LEVEL',
    title: 'Hostel & Residential Boarding',
    description: 'Residential accommodation, room categories, and wardens per campus.',
    supportsInheritance: true,
    supportsNotApplicable: true,
    defaultSourceMode: 'inherited',
  },

  // Chapter 6: Tech, Domain & Integrations
  communicationConfig: {
    sectionKey: 'communicationConfig',
    scope: 'SCHOOL_LEVEL',
    title: 'Institutional Communication Preferences',
    description: 'WhatsApp API, SMS gateway, email circulars, and messaging provider selections.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  cmsRequirements: {
    sectionKey: 'cmsRequirements',
    scope: 'SCHOOL_LEVEL',
    title: 'Website CMS Workflow & Publishing Roles',
    description: 'Editorial approval workflows and publishing roles apply school-wide.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  websiteScope: {
    sectionKey: 'websiteScope',
    scope: 'SCHOOL_LEVEL',
    title: 'Website Scope & Project Configuration',
    description: 'Select the modules, pages, and special capabilities that apply to this website project.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  domainPresence: {
    sectionKey: 'domainPresence',
    scope: 'SCHOOL_LEVEL',
    title: 'Website & Domain Setup',
    description: 'Domain registration, DNS setup, and email hosting for the school.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  existingSystemsMigration: {
    sectionKey: 'existingSystemsMigration',
    scope: 'SCHOOL_LEVEL',
    title: 'Legacy Data Migration Assessment',
    description: 'Legacy software systems, Tally/Excel readiness, and institutional migration records.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  integrationsConfig: {
    sectionKey: 'integrationsConfig',
    scope: 'SCHOOL_LEVEL',
    title: 'Third-Party Integration Selections',
    description: 'Payment gateways, biometrics, DigiLocker, and external APIs.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  mobileAppConfig: {
    sectionKey: 'mobileAppConfig',
    scope: 'SCHOOL_LEVEL',
    title: 'Mobile Application Requirements',
    description: 'Parent, student, and teacher mobile applications.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  securityPrivacy: {
    sectionKey: 'securityPrivacy',
    scope: 'SCHOOL_LEVEL',
    title: 'Security, Privacy & Administrative Access',
    description: 'Administrator headcount, 2FA, session timeout, and data policies.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },

  // Chapter 7: Assets, Legal & Project Delivery
  assetChecklist: {
    sectionKey: 'assetChecklist',
    scope: 'MIXED',
    title: 'Content, Assets & Documents Provisioning',
    description: 'Official school crest/certificates (school-wide) vs campus infrastructure photos (campus-specific).',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  legalPolicies: {
    sectionKey: 'legalPolicies',
    scope: 'MIXED',
    title: 'Legal Policies & Statutory Disclosures',
    description: 'School-wide mandatory policies, with option for campus-specific policies.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  projectDelivery: {
    sectionKey: 'projectDelivery',
    scope: 'SCHOOL_LEVEL',
    title: 'Project Timeline & Delivery Priorities',
    description: 'Target launch date, expedited delivery preference, and authorized decision maker.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },

  // Chapter 8: Verification & Final Sign-Off
  websiteRequirements: {
    sectionKey: 'websiteRequirements',
    scope: 'SCHOOL_LEVEL',
    title: 'Final Website Review & Submission',
    description: 'Overall school website specification reviewing all campus and school content.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  usersAccess: {
    sectionKey: 'usersAccess',
    scope: 'SCHOOL_LEVEL',
    title: 'Administrator Provisioning & Final Sign-Off',
    description: 'Super Administrator account and final legal confirmation.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },

  // Legacy extensions
  erpRequirements: {
    sectionKey: 'erpRequirements',
    scope: 'SCHOOL_LEVEL',
    title: 'ERP Scope Assessment',
    description: 'Legacy ERP module requirements.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  portalRequirements: {
    sectionKey: 'portalRequirements',
    scope: 'SCHOOL_LEVEL',
    title: 'Portal Requirements & Notifications',
    description: 'Legacy portal visibility and alerts.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
  mediaAssets: {
    sectionKey: 'mediaAssets',
    scope: 'MIXED',
    title: 'Media Assets & Content Kit',
    description: 'School branding kit vs campus photo galleries.',
    supportsInheritance: true,
    supportsNotApplicable: false,
    defaultSourceMode: 'inherited',
  },
  additionalRequirements: {
    sectionKey: 'additionalRequirements',
    scope: 'SCHOOL_LEVEL',
    title: 'Additional Requirements & Scope Notes',
    description: 'Custom notes and specific workflow instructions.',
    supportsInheritance: false,
    supportsNotApplicable: false,
  },
};

/**
 * Resolves the scope for a given section key.
 */
export function getSectionScope(sectionKey: IntakeSectionKey): SectionScope {
  return SECTION_SCOPE_REGISTRY[sectionKey]?.scope || 'SCHOOL_LEVEL';
}

/**
 * Returns true if a section can have campus-specific configuration (CAMPUS_LEVEL or MIXED).
 */
export function isCampusScopedSection(sectionKey: IntakeSectionKey): boolean {
  const scope = getSectionScope(sectionKey);
  return scope === 'CAMPUS_LEVEL' || scope === 'MIXED';
}

/**
 * Returns true if a section supports inheritance from another campus.
 */
export function isSectionInheritanceAllowed(sectionKey: IntakeSectionKey): boolean {
  return Boolean(SECTION_SCOPE_REGISTRY[sectionKey]?.supportsInheritance);
}

/**
 * Returns true if a section supports "Not applicable" selection for a campus.
 */
export function isSectionNotApplicableAllowed(sectionKey: IntakeSectionKey): boolean {
  return Boolean(SECTION_SCOPE_REGISTRY[sectionKey]?.supportsNotApplicable);
}

/**
 * Returns the designated Main Campus from a list of campuses.
 * Falls back to the first campus in the array if none is explicitly marked.
 */
export function getMainCampus(campuses?: CampusBranchData[] | null): CampusBranchData | undefined {
  if (!Array.isArray(campuses) || campuses.length === 0) return undefined;
  return campuses.find((c) => c.isMainCampus) || campuses[0];
}

/**
 * Looks up a campus by its unique ID.
 */
export function getCampusById(
  campuses?: CampusBranchData[] | null,
  campusId?: string | null
): CampusBranchData | undefined {
  if (!Array.isArray(campuses) || !campusId) return undefined;
  return campuses.find((c) => c.id === campusId);
}

/**
 * Formats a clean human-readable campus name dynamically.
 */
export function getCampusDisplayName(campus?: CampusBranchData | null, fallbackIndex = 1): string {
  if (!campus) return `Campus ${fallbackIndex}`;
  const name = campus.name?.trim();
  if (name) return name;
  return campus.isMainCampus ? 'Main Campus' : `Campus ${fallbackIndex}`;
}

/**
 * Cycle-Safe Inheritance Validator
 *
 * Checks if targetCampusId can inherit from candidateSourceCampusId without creating
 * a circular reference loop (e.g. A -> B -> A or A -> B -> C -> A).
 */
export function validateInheritanceChain(
  campuses: CampusBranchData[],
  overrides: CampusOverridesMap | undefined,
  sectionKey: string,
  targetCampusId: string,
  candidateSourceCampusId: string
): { valid: boolean; error?: string } {
  // A campus cannot inherit from itself
  if (targetCampusId === candidateSourceCampusId) {
    return {
      valid: false,
      error: 'A campus cannot inherit data from itself.',
    };
  }

  // Candidate source campus must exist
  const sourceCampus = getCampusById(campuses, candidateSourceCampusId);
  if (!sourceCampus) {
    return {
      valid: false,
      error: `Source campus with ID "${candidateSourceCampusId}" does not exist.`,
    };
  }

  // Traverse the inheritance chain starting from candidateSourceCampusId
  const visited = new Set<string>([targetCampusId]);
  let currentId: string | undefined = candidateSourceCampusId;

  while (currentId) {
    if (visited.has(currentId)) {
      return {
        valid: false,
        error: `Circular inheritance detected! "${sourceCampus.name || candidateSourceCampusId}" cannot be chosen as source because it depends on "${targetCampusId}".`,
      };
    }
    visited.add(currentId);

    // Look up what currentId inherits from
    const currentOverride: CampusSectionOverride | undefined = overrides?.[currentId]?.[sectionKey];
    if (currentOverride && currentOverride.sourceMode === 'inherited' && currentOverride.sourceCampusId) {
      currentId = currentOverride.sourceCampusId;
    } else {
      // Reached a root or customized campus; chain is safe
      break;
    }
  }

  return { valid: true };
}

export interface ResolvedCampusSectionData<T = any> {
  mode: CampusDataSourceMode;
  sourceCampusId?: string;
  sourceCampusName?: string;
  data: T | undefined;
  isReadOnly: boolean;
  isOverridden: boolean;
}

/**
 * Authoritative Section Data Resolver
 *
 * Resolves the effective section data for a given campus and section key.
 *
 * If single-campus or main campus: returns intakeData[sectionKey].
 * If inherited: traces through inheritance chain and returns source campus data as read-only.
 * If customized: returns the campus-specific override data.
 * If not_applicable: returns undefined data with mode 'not_applicable'.
 *
 * Cycle-Safe & Depth-Protected:
 * Even if corrupted or manipulated external state contains circular loops,
 * a visited set and depth cap (<= 20 hops) guarantee zero stack overflow,
 * automatically falling back to Main Campus data.
 */
export function resolveCampusSectionData<T = any>(
  intakeData: Partial<UniversalIntakeData>,
  sectionKey: IntakeSectionKey,
  campusId: string,
  _visitedCampusIds?: Set<string>
): ResolvedCampusSectionData<T> {
  const campuses = intakeData.campuses || [];
  const mainCampus = getMainCampus(campuses);
  const currentCampus = getCampusById(campuses, campusId);

  // Fallback / Baseline school-level data
  const schoolLevelData = (intakeData as any)[sectionKey] as T | undefined;

  // Case 1: Single campus or invalid campusId
  if (campuses.length <= 1 || !currentCampus) {
    return {
      mode: 'customized',
      data: schoolLevelData,
      isReadOnly: false,
      isOverridden: false,
    };
  }

  // Defensive recursion depth / cycle protection
  const visited = _visitedCampusIds ? new Set(_visitedCampusIds) : new Set<string>();
  if (visited.has(campusId) || visited.size > 20) {
    return {
      mode: 'inherited',
      sourceCampusId: mainCampus?.id || campuses[0]?.id,
      sourceCampusName: getCampusDisplayName(mainCampus || campuses[0]),
      data: schoolLevelData,
      isReadOnly: true,
      isOverridden: false,
    };
  }
  visited.add(campusId);

  const overrides = intakeData.campusOverrides || {};
  const campusOverride: CampusSectionOverride<T> | undefined =
    overrides[campusId]?.[sectionKey] || currentCampus.sectionConfigs?.[sectionKey];

  // Case 2: Main Campus
  if (currentCampus.id === mainCampus?.id) {
    if (campusOverride && campusOverride.sourceMode === 'customized' && campusOverride.customData !== undefined) {
      return {
        mode: 'customized',
        data: campusOverride.customData,
        isReadOnly: false,
        isOverridden: true,
      };
    }
    return {
      mode: 'customized',
      data: schoolLevelData,
      isReadOnly: false,
      isOverridden: false,
    };
  }

  // Case 3: Branch campus with explicit override
  if (campusOverride) {
    // Mode: Not Applicable
    if (campusOverride.sourceMode === 'not_applicable') {
      return {
        mode: 'not_applicable',
        data: undefined,
        isReadOnly: true,
        isOverridden: true,
      };
    }

    // Mode: Customized
    if (campusOverride.sourceMode === 'customized') {
      return {
        mode: 'customized',
        data: campusOverride.customData !== undefined ? campusOverride.customData : schoolLevelData,
        isReadOnly: false,
        isOverridden: true,
      };
    }

    // Mode: Inherited
    if (campusOverride.sourceMode === 'inherited' && campusOverride.sourceCampusId) {
      const sourceCampusId = campusOverride.sourceCampusId;
      const sourceCampus = getCampusById(campuses, sourceCampusId);

      // Self-healing: Dangling or self reference fallback to Main Campus
      if (sourceCampusId === campusId || !sourceCampus) {
        return {
          mode: 'inherited',
          sourceCampusId: mainCampus?.id || campuses[0]?.id,
          sourceCampusName: getCampusDisplayName(mainCampus || campuses[0]),
          data: schoolLevelData,
          isReadOnly: true,
          isOverridden: false,
        };
      }

      const sourceCampusName = getCampusDisplayName(sourceCampus);

      // If source is Main Campus, data comes from school-level/main data
      if (sourceCampusId === mainCampus?.id) {
        return {
          mode: 'inherited',
          sourceCampusId,
          sourceCampusName,
          data: schoolLevelData,
          isReadOnly: true,
          isOverridden: false,
        };
      }

      // If source is another branch campus, resolve recursively with depth tracking
      const sourceResolved = resolveCampusSectionData<T>(intakeData, sectionKey, sourceCampusId, visited);
      return {
        mode: 'inherited',
        sourceCampusId,
        sourceCampusName,
        data: sourceResolved.data,
        isReadOnly: true,
        isOverridden: false,
      };
    }
  }

  // Case 4: Default for non-main campus when no explicit override is set -> Inherit from Main Campus
  const defaultSourceId = mainCampus?.id || campuses[0]?.id;
  const defaultSourceName = getCampusDisplayName(mainCampus || campuses[0]);
  return {
    mode: 'inherited',
    sourceCampusId: defaultSourceId,
    sourceCampusName: defaultSourceName,
    data: schoolLevelData,
    isReadOnly: true,
    isOverridden: false,
  };
}

/**
 * Immutable State Transition: Update the data source mode for a campus section.
 */
export function setCampusSectionMode(
  intakeData: UniversalIntakeData,
  sectionKey: IntakeSectionKey,
  campusId: string,
  mode: CampusDataSourceMode,
  sourceCampusId?: string,
  initialCustomData?: any
): UniversalIntakeData {
  const currentOverrides = intakeData.campusOverrides || {};
  const currentCampusOverrides = currentOverrides[campusId] || {};
  const mainCampus = getMainCampus(intakeData.campuses);

  let nextOverride: CampusSectionOverride;

  if (mode === 'inherited') {
    let targetSourceId = sourceCampusId || mainCampus?.id || intakeData.campuses?.[0]?.id || '';
    if (targetSourceId === campusId) {
      targetSourceId = mainCampus?.id && mainCampus.id !== campusId ? mainCampus.id : '';
    }

    // Validate that targetSourceId does not create a cycle
    if (targetSourceId) {
      const cycleCheck = validateInheritanceChain(
        intakeData.campuses || [],
        currentOverrides,
        sectionKey,
        campusId,
        targetSourceId
      );
      if (!cycleCheck.valid) {
        targetSourceId = mainCampus?.id && mainCampus.id !== campusId ? mainCampus.id : '';
      }
    }

    nextOverride = {
      sourceMode: 'inherited',
      sourceCampusId: targetSourceId,
    };
  } else if (mode === 'not_applicable') {
    nextOverride = {
      sourceMode: 'not_applicable',
    };
  } else {
    // 'customized': if initial data was provided, use it; otherwise clone freshly from currently resolved data
    let customDataToSet = initialCustomData;
    if (customDataToSet === undefined) {
      const resolved = resolveCampusSectionData(intakeData, sectionKey, campusId);
      customDataToSet = resolved.data !== undefined ? JSON.parse(JSON.stringify(resolved.data)) : undefined;
    }

    nextOverride = {
      sourceMode: 'customized',
      customData: customDataToSet,
    };
  }

  const updatedOverrides: CampusOverridesMap = {
    ...currentOverrides,
    [campusId]: {
      ...currentCampusOverrides,
      [sectionKey]: nextOverride,
    },
  };

  // Also update campus.sectionConfigs for backwards-compatibility mirror
  const updatedCampuses = (intakeData.campuses || []).map((c) => {
    if (c.id !== campusId) return c;
    return {
      ...c,
      sectionConfigs: {
        ...(c.sectionConfigs || {}),
        [sectionKey]: nextOverride,
      },
    };
  });

  return {
    ...intakeData,
    campuses: updatedCampuses,
    campusOverrides: updatedOverrides,
  };
}

/**
 * Immutable State Transition: Update custom override data for a campus section.
 */
export function updateCampusCustomData(
  intakeData: UniversalIntakeData,
  sectionKey: IntakeSectionKey,
  campusId: string,
  customDataUpdates: any
): UniversalIntakeData {
  const campuses = intakeData.campuses || [];
  const mainCampus = getMainCampus(campuses);

  // If updating Main Campus, keep primary intakeData[sectionKey] updated as the canonical source
  if (campusId === mainCampus?.id) {
    const prevSectionData = (intakeData as any)[sectionKey] || {};
    const nextSectionData =
      typeof customDataUpdates === 'object' && customDataUpdates !== null && !Array.isArray(customDataUpdates)
        ? { ...prevSectionData, ...customDataUpdates }
        : customDataUpdates;

    // Purge any redundant main campus override to prevent shadowing
    const currentOverrides = intakeData.campusOverrides || {};
    let updatedOverrides = currentOverrides;
    if (currentOverrides[campusId]?.[sectionKey]) {
      const nextCampusMap = { ...currentOverrides[campusId] };
      delete nextCampusMap[sectionKey];
      updatedOverrides = {
        ...currentOverrides,
        [campusId]: nextCampusMap,
      };
    }

    return {
      ...intakeData,
      [sectionKey]: nextSectionData,
      campusOverrides: updatedOverrides,
    };
  }

  const currentOverrides = intakeData.campusOverrides || {};
  const currentCampusOverrides = currentOverrides[campusId] || {};
  const existingOverride = currentCampusOverrides[sectionKey];

  const prevCustom = existingOverride?.customData || {};
  const nextCustom =
    typeof customDataUpdates === 'object' && customDataUpdates !== null && !Array.isArray(customDataUpdates)
      ? { ...prevCustom, ...customDataUpdates }
      : customDataUpdates;

  const nextOverride: CampusSectionOverride = {
    sourceMode: 'customized',
    customData: nextCustom,
  };

  const updatedOverrides: CampusOverridesMap = {
    ...currentOverrides,
    [campusId]: {
      ...currentCampusOverrides,
      [sectionKey]: nextOverride,
    },
  };

  const updatedCampuses = campuses.map((c) => {
    if (c.id !== campusId) return c;
    return {
      ...c,
      sectionConfigs: {
        ...(c.sectionConfigs || {}),
        [sectionKey]: nextOverride,
      },
    };
  });

  return {
    ...intakeData,
    campuses: updatedCampuses,
    campusOverrides: updatedOverrides,
  };
}

/**
 * Safe Campus Deletion Handler
 *
 * When a campus is removed:
 * 1. Filters out the deleted campus.
 * 2. If the deleted campus was Main Campus, elevates the next campus to Main Campus AND
 *    synchronizes the primary address in schoolProfile.
 * 3. Any campus that was inheriting from the deleted campus is safely pointed to the new Main Campus.
 * 4. Removes orphaned overrides for the deleted campus.
 * 5. Cleans up academic classes scoped to the deleted campus to prevent ghost entries.
 */
export function handleCampusDeletion(
  intakeData: UniversalIntakeData,
  deletedCampusId: string
): UniversalIntakeData {
  const campuses = intakeData.campuses || [];
  const remaining = campuses.filter((c) => c.id !== deletedCampusId);

  if (remaining.length === 0) {
    return intakeData; // Cannot delete the only campus
  }

  // Ensure there is always a designated Main Campus
  const hasMain = remaining.some((c) => c.isMainCampus);
  const normalizedRemaining = remaining.map((c, idx) => ({
    ...c,
    isMainCampus: hasMain ? c.isMainCampus : idx === 0,
  }));

  const newMainCampus = getMainCampus(normalizedRemaining);
  const newMainId = newMainCampus?.id || normalizedRemaining[0]?.id || '';

  const deletedWasMain = campuses.find((c) => c.id === deletedCampusId)?.isMainCampus;
  let updatedProfile = intakeData.schoolProfile;

  // Synchronize schoolProfile primary address with new main campus if the deleted campus was main
  if (deletedWasMain && newMainCampus) {
    updatedProfile = {
      ...intakeData.schoolProfile,
      address: newMainCampus.address || '',
      addressLine2: newMainCampus.addressLine2 || '',
      landmark: newMainCampus.landmark || '',
      city: newMainCampus.city || '',
      district: newMainCampus.district || '',
      state: newMainCampus.state || '',
      country: newMainCampus.country || 'India',
      pin: newMainCampus.pin || '',
      latitude: newMainCampus.latitude ?? null,
      longitude: newMainCampus.longitude ?? null,
      googleMapsUrl: newMainCampus.googleMapsLink || newMainCampus.googleMapsUrl || '',
      googleMapsLink: newMainCampus.googleMapsLink || newMainCampus.googleMapsUrl || '',
    };
  }

  // Clean up academic classes referencing the deleted campus
  let updatedInstitutionStructure = intakeData.institutionStructure;
  if (updatedInstitutionStructure?.classes && Array.isArray(updatedInstitutionStructure.classes)) {
    const remainingClasses = updatedInstitutionStructure.classes.filter(
      (cls) => cls.campusId !== deletedCampusId
    );
    if (remainingClasses.length !== updatedInstitutionStructure.classes.length) {
      updatedInstitutionStructure = {
        ...updatedInstitutionStructure,
        classes: remainingClasses,
      };
    }
  }

  // Clean up overrides
  const rawOverrides = intakeData.campusOverrides || {};
  const updatedOverrides: CampusOverridesMap = {};

  Object.entries(rawOverrides).forEach(([cId, sectionMap]) => {
    if (cId === deletedCampusId) return; // Discard deleted campus overrides
    if (cId === newMainId) return; // Main campus has no overrides

    const cleanSectionMap: Record<string, CampusSectionOverride> = {};
    Object.entries(sectionMap).forEach(([secKey, override]) => {
      if (!override) return;
      if (override.sourceMode === 'inherited' && override.sourceCampusId === deletedCampusId) {
        // Safe fallback: point to new main campus
        cleanSectionMap[secKey] = {
          sourceMode: 'inherited',
          sourceCampusId: newMainId,
        };
      } else {
        cleanSectionMap[secKey] = override;
      }
    });

    if (Object.keys(cleanSectionMap).length > 0) {
      updatedOverrides[cId] = cleanSectionMap;
    }
  });

  const finalCampuses: CampusBranchData[] = normalizedRemaining.map((c) => ({
    ...c,
    sectionConfigs: updatedOverrides[c.id] || undefined,
  }));

  return {
    ...intakeData,
    campuses: finalCampuses,
    campusOverrides: updatedOverrides,
    schoolProfile: updatedProfile,
    institutionStructure: updatedInstitutionStructure,
  };
}

/**
 * Safe Main Campus Designation Handler
 *
 * Changes which campus is designated as the Main Campus without wiping data.
 * 1. Promotes customized section data from the new Main Campus into canonical school-level data.
 * 2. Preserves prior Main Campus data into the old main campus overrides.
 * 3. Removes inherited overrides on the new Main Campus (Main Campus is the root source of truth).
 * 4. Repoints any branch campuses that were inheriting from the old Main Campus to the new Main Campus.
 * 5. Runs cycle validation on all remaining branches.
 * 6. Synchronizes address in schoolProfile to match the new Main Campus.
 */
export function handleMainCampusDesignation(
  intakeData: UniversalIntakeData,
  newMainCampusId: string
): UniversalIntakeData {
  const campuses = intakeData.campuses || [];
  const target = campuses.find((c) => c.id === newMainCampusId);
  if (!target) return intakeData;

  const oldMainCampus = getMainCampus(campuses);
  const oldMainId = oldMainCampus?.id;

  if (oldMainId === newMainCampusId) {
    return intakeData; // Already Main Campus
  }

  const updatedCampuses = campuses.map((c) => ({
    ...c,
    isMainCampus: c.id === newMainCampusId,
  }));

  const rawOverrides = intakeData.campusOverrides || {};
  const updatedOverrides: CampusOverridesMap = {};
  const updatedIntakeData: UniversalIntakeData = { ...intakeData };

  const newMainOverrides = rawOverrides[newMainCampusId] || {};

  // For any section that was customized on newMainCampusId, promote that custom data to intakeData[secKey]
  Object.entries(newMainOverrides).forEach(([secKey, override]) => {
    if (override && override.sourceMode === 'customized' && override.customData !== undefined) {
      if (oldMainId && (intakeData as any)[secKey] !== undefined) {
        if (!updatedOverrides[oldMainId]) updatedOverrides[oldMainId] = {};
        updatedOverrides[oldMainId][secKey] = {
          sourceMode: 'customized',
          customData: (intakeData as any)[secKey],
        };
      }
      (updatedIntakeData as any)[secKey] = override.customData;
    }
  });

  // Reconcile overrides for all non-main campuses
  Object.entries(rawOverrides).forEach(([cId, sectionMap]) => {
    if (cId === newMainCampusId) return; // Main campus has no overrides

    const cleanMap: Partial<Record<string, CampusSectionOverride>> = { ...(updatedOverrides[cId] || {}) };
    Object.entries(sectionMap).forEach(([secKey, override]) => {
      if (!override) return;
      if (cleanMap[secKey]) return; // Already preserved

      if (override.sourceMode === 'inherited') {
        if (override.sourceCampusId === oldMainId) {
          cleanMap[secKey] = {
            sourceMode: 'inherited',
            sourceCampusId: newMainCampusId,
          };
        } else if (override.sourceCampusId === newMainCampusId) {
          cleanMap[secKey] = override;
        } else {
          const check = validateInheritanceChain(
            updatedCampuses,
            rawOverrides,
            secKey,
            cId,
            override.sourceCampusId || ''
          );
          if (check.valid) {
            cleanMap[secKey] = override;
          } else {
            cleanMap[secKey] = {
              sourceMode: 'inherited',
              sourceCampusId: newMainCampusId,
            };
          }
        }
      } else {
        cleanMap[secKey] = override;
      }
    });

    if (Object.keys(cleanMap).length > 0) {
      updatedOverrides[cId] = cleanMap;
    }
  });

  // Synchronize schoolProfile primary address with new main campus
  const updatedProfile = {
    ...intakeData.schoolProfile,
    address: target.address || intakeData.schoolProfile?.address || '',
    addressLine2: target.addressLine2 || intakeData.schoolProfile?.addressLine2 || '',
    landmark: target.landmark || intakeData.schoolProfile?.landmark || '',
    city: target.city || intakeData.schoolProfile?.city || '',
    district: target.district || intakeData.schoolProfile?.district || '',
    state: target.state || intakeData.schoolProfile?.state || '',
    country: target.country || intakeData.schoolProfile?.country || 'India',
    pin: target.pin || intakeData.schoolProfile?.pin || '',
    latitude: target.latitude ?? intakeData.schoolProfile?.latitude ?? null,
    longitude: target.longitude ?? intakeData.schoolProfile?.longitude ?? null,
    googleMapsUrl: target.googleMapsLink || target.googleMapsUrl || intakeData.schoolProfile?.googleMapsUrl || '',
    googleMapsLink: target.googleMapsLink || target.googleMapsUrl || intakeData.schoolProfile?.googleMapsLink || '',
  };

  const finalCampuses: CampusBranchData[] = updatedCampuses.map((c) => ({
    ...c,
    sectionConfigs: updatedOverrides[c.id] || undefined,
  }));

  return {
    ...updatedIntakeData,
    campuses: finalCampuses,
    campusOverrides: updatedOverrides,
    schoolProfile: updatedProfile,
  };
}
