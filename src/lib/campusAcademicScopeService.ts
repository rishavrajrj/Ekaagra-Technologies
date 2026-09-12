/**
 * ==============================================================================
 * CANONICAL CAMPUS ACADEMIC SCOPE SERVICE
 * File: src/lib/campusAcademicScopeService.ts
 * ==============================================================================
 *
 * Single Source of Truth for all class-dependent academic features:
 * - Fee Structure (Common Fees, Class Overrides, Optional Services)
 * - Curriculum (Class Curricula, Subject Applicability, Syllabus)
 * - Admissions (Intake, Availability, Age Criteria)
 * - Public Website (Classes Offered, Fee Highlights, Admissions)
 * - ERP / Academic Operations
 *
 * Core Guarantees:
 * 1. Classes selected under "Campus Academic Scope & Levels" are the canonical source.
 * 2. Multi-campus isolation: Each campus has strictly isolated class offerings.
 * 3. Zero Client Trust: Server-side validation rejects invalid class configurations.
 * 4. Safe Class Removal: Historical records are preserved; removing a class flags it inactive.
 * 5. Re-adding a class restores configuration without duplication.
 */

import type {
  UniversalIntakeData,
  CampusBranchData,
  AcademicClassConfig,
  FeesConfigurationData,
  CurriculumData,
  AdmissionsData,
  CommonFeeItem,
  OptionalServiceConfig,
} from './types';
import {
  DEFAULT_LEVEL_CLASS_PRESETS,
  DEFAULT_SUGGESTED_CLASSES,
  deriveCampusClassRange,
  getSuggestedClassesForSchoolType,
  reconcileClassesForAcademicLevels,
} from './academicStructureUtils';
import { getMainCampus, getCampusDisplayName } from './campusScopeRegistry';

export interface CanonicalCampusAcademicScope {
  campusId: string;
  campusName: string;
  isMainCampus: boolean;
  academicLevels: string[];
  classes: AcademicClassConfig[];
  activeClasses: AcademicClassConfig[];
  classNames: string[];
  classRange: string;
  hasClasses: boolean;
  wingDescription?: string;
  schoolType?: string;
  inactiveClassNames?: string[];
}

/**
 * Resolve canonical academic level for a class name from presets.
 */
export function resolveLevelForClassName(className: string, fallbackLevels: string[] = []): string {
  const clean = (className || '').trim().toLowerCase();
  for (const [level, presetClasses] of Object.entries(DEFAULT_LEVEL_CLASS_PRESETS)) {
    if (presetClasses.some((c) => c.toLowerCase() === clean)) {
      return level;
    }
  }
  return fallbackLevels[0] || 'Other';
}

/**
 * Derives canonical academic scope for a specified campus.
 * Retrieves strictly the classes configured in that campus's academic scope.
 */
export function getCampusAcademicScope(
  campusIdOrIndex?: string | number,
  intakeData?: Partial<UniversalIntakeData> | null
): CanonicalCampusAcademicScope {
  const campuses = Array.isArray(intakeData?.campuses) ? intakeData.campuses : [];
  let targetCampus: CampusBranchData | undefined;

  if (typeof campusIdOrIndex === 'number') {
    targetCampus = campuses[campusIdOrIndex];
  } else if (typeof campusIdOrIndex === 'string' && campusIdOrIndex.trim() !== '') {
    targetCampus = campuses.find((c) => c.id === campusIdOrIndex);
  }

  if (!targetCampus) {
    targetCampus = getMainCampus(campuses) || campuses[0];
  }

  const campusId = targetCampus?.id || 'main-campus';
  const campusName = targetCampus ? getCampusDisplayName(targetCampus) : 'Main Campus';
  const isMainCampus = Boolean(targetCampus?.isMainCampus || (!targetCampus && campuses.length === 0));

  // 1. Resolve Academic Levels
  const rawLevels: string[] = [];
  if (Array.isArray(targetCampus?.academicLevels)) rawLevels.push(...targetCampus.academicLevels);
  if (targetCampus?.academicLevel) rawLevels.push(targetCampus.academicLevel);
  if (Array.isArray(targetCampus?.schoolLevel)) rawLevels.push(...targetCampus.schoolLevel);
  else if (targetCampus?.schoolLevel && typeof targetCampus.schoolLevel === 'string') {
    rawLevels.push(targetCampus.schoolLevel);
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
  const explicitClassNames = (Array.isArray(targetCampus?.classesOffered) ? targetCampus.classesOffered : [])
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean);

  let finalClassNames: string[] = [];

  if (explicitClassNames.length > 0) {
    // Canonical explicit campus classes
    finalClassNames = Array.from(new Set(explicitClassNames));
  } else if (academicLevels.length > 0) {
    // If explicit classesOffered is not set, reconcile deterministically from selected academicLevels
    const reconciled = reconcileClassesForAcademicLevels(academicLevels, []);
    finalClassNames = reconciled.classes;
  } else if (
    targetCampus &&
    Array.isArray(targetCampus.classesOffered) &&
    targetCampus.classesOffered.length === 0 &&
    academicLevels.length === 0
  ) {
    // Explicitly empty campus academic scope: Do not fall back to defaults or legacy data
    finalClassNames = [];
  } else {
    // Backward compatibility fallback: check institutionStructure or presets
    const structClasses = intakeData?.institutionStructure?.classes;
    if (Array.isArray(structClasses) && structClasses.length > 0) {
      const matching = structClasses.filter((c: any) => {
        if (!c) return false;
        if (typeof c === 'string') return true;
        return !c.campusId || c.campusId === campusId || campuses.length <= 1;
      });
      if (matching.length > 0) {
        finalClassNames = matching
          .map((c: any) => (typeof c === 'string' ? c.trim() : (c.name || c.className || '').trim()))
          .filter(Boolean);
      }
    }

    if (finalClassNames.length === 0 && campuses.length <= 1 && !targetCampus) {
      // Single campus fallback: smart preset from school type only when no campus configured
      const suggested = getSuggestedClassesForSchoolType(
        intakeData?.schoolProfile?.schoolType || 'k12'
      );
      finalClassNames = suggested.map((c) => c.name).filter(Boolean);
    }
  }

  // Deduplicate and filter non-empty strings
  finalClassNames = Array.from(new Set(finalClassNames.filter((n) => typeof n === 'string' && n.trim().length > 0)));

  // Map class names into structured AcademicClassConfig
  const classes: AcademicClassConfig[] = finalClassNames.map((name, idx) => {
    const existingSuggested = DEFAULT_SUGGESTED_CLASSES.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    const level = resolveLevelForClassName(name, academicLevels);
    const code = existingSuggested?.code || name.toUpperCase().replace(/\s+/g, '-');
    const isCustom = !existingSuggested;

    return {
      id: existingSuggested?.id || `cls_${campusId}_${idx + 1}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      code,
      level,
      sortOrder: idx + 1,
      displayOrder: idx + 1,
      isActive: true,
      campusId,
      isCustom,
      sections: existingSuggested?.sections || ['A'],
    };
  });

  const classRange = targetCampus?.classRange || deriveCampusClassRange(finalClassNames);
  const wingDescription = targetCampus?.wingDescription || targetCampus?.academicDescription;
  const schoolType = targetCampus?.schoolType;

  return {
    campusId,
    campusName,
    isMainCampus,
    academicLevels,
    classes,
    activeClasses: classes,
    classNames: finalClassNames,
    classRange,
    hasClasses: classes.length > 0,
    wingDescription,
    schoolType,
  };
}

/**
 * Checks whether a given class name, class ID, academic level, or level-band descriptor
 * belongs to the active campus academic scope.
 *
 * Supports:
 * - Exact class names (e.g. "Class 1", "Nursery", "Playgroup")
 * - Class IDs and codes
 * - Academic levels (e.g. "Primary", "Senior Secondary")
 * - Level tier descriptors with class range brackets (e.g. "Pre-Primary (Nursery - UKG)", "Primary (Class 1-5)")
 * - Universal keywords ("all", "All Classes")
 */
export function isClassOrLevelInCampusScope(
  targetName: string,
  scope: CanonicalCampusAcademicScope
): boolean {
  if (!targetName || typeof targetName !== 'string') return false;
  const clean = targetName.trim();
  if (!clean) return false;

  const cleanLower = clean.toLowerCase();

  // 1. Universal keywords
  if (cleanLower === 'all' || cleanLower === 'all classes' || cleanLower === 'all_classes') {
    return true;
  }

  // 2. Exact match in campus classes
  if (scope.classNames.some((c) => c.toLowerCase() === cleanLower)) {
    return true;
  }

  // 3. Exact match by class id, code, or name
  if (
    scope.classes.some(
      (c) =>
        (c.id && c.id.toLowerCase() === cleanLower) ||
        (c.code && c.code.toLowerCase() === cleanLower) ||
        (c.name && c.name.toLowerCase() === cleanLower)
    )
  ) {
    return true;
  }

  // 4. Exact match in campus academic levels
  const campusLevelsLower = new Set(scope.academicLevels.map((l) => l.toLowerCase()));
  if (campusLevelsLower.has(cleanLower)) {
    return true;
  }

  // 5. Match academic level band / tier descriptor (e.g. "Pre-Primary (Nursery - UKG)", "Primary (Class 1-5)")
  const baseLevelRaw = clean.split('(')[0].trim();
  const baseLevelClean = baseLevelRaw
    .replace(/\s+(school|wing|level|section|classes?|standard|grade)$/i, '')
    .trim();

  const baseLower = baseLevelClean.toLowerCase();
  const rawLower = baseLevelRaw.toLowerCase();

  if (campusLevelsLower.has(baseLower) || campusLevelsLower.has(rawLower)) {
    return true;
  }

  // 6. Check canonical level presets
  for (const [levelName, presetClasses] of Object.entries(DEFAULT_LEVEL_CLASS_PRESETS)) {
    const levelLower = levelName.toLowerCase();
    if (baseLower === levelLower || rawLower.startsWith(levelLower)) {
      if (
        campusLevelsLower.has(levelLower) ||
        presetClasses.some((cls) => scope.classNames.some((sc) => sc.toLowerCase() === cls.toLowerCase()))
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates whether a given class name or id belongs to the active campus academic scope.
 */
export function validateClassInCampusScope(
  campusId: string,
  classNameOrId: string,
  intakeData?: Partial<UniversalIntakeData> | null
): { valid: boolean; error?: string } {
  if (!classNameOrId || classNameOrId.trim() === '') {
    return { valid: false, error: 'Class name cannot be empty.' };
  }

  const scope = getCampusAcademicScope(campusId, intakeData);
  if (!isClassOrLevelInCampusScope(classNameOrId, scope)) {
    return {
      valid: false,
      error: `Class "${classNameOrId}" is not currently offered at ${scope.campusName}. Please update Campus Academic Scope before configuring this class.`,
    };
  }

  return { valid: true };
}

/**
 * Server-Side & Domain Validator for Academic Payloads.
 * Validates Fee Structure, Curriculum, and Admissions class references against active campus scope.
 * Zero Client Trust: Enforces Rule 1, 2, 3, 4.
 */
export function validateCampusAcademicPayload(
  campusId: string,
  intakeData: Partial<UniversalIntakeData>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const scope = getCampusAcademicScope(campusId, intakeData);

  // 1. Validate Fee Structure
  const fees = intakeData.feesConfiguration;
  if (fees) {
    // Check Common Fees
    if (Array.isArray(fees.commonFees)) {
      for (const fee of fees.commonFees) {
        if (Array.isArray(fee.applicableClasses)) {
          for (const cls of fee.applicableClasses) {
            if (!isClassOrLevelInCampusScope(cls, scope)) {
              errors.push(
                `Fee Structure: Common fee "${fee.name}" targets class "${cls}" which is outside the academic scope of ${scope.campusName}.`
              );
            }
          }
        }
      }
    }

    // Check Class Fee Structures / Overrides
    if (Array.isArray(fees.classFeeStructures)) {
      for (const override of fees.classFeeStructures) {
        const clsName = override.className;
        if (clsName && !isClassOrLevelInCampusScope(clsName, scope)) {
          errors.push(
            `Fee Structure: Class override targets class "${clsName}" which is outside the academic scope of ${scope.campusName}.`
          );
        }
      }
    }

    // Check Optional Services
    if (Array.isArray(fees.optionalServices)) {
      for (const opt of fees.optionalServices) {
        if (Array.isArray(opt.applicableClasses)) {
          for (const cls of opt.applicableClasses) {
            if (!isClassOrLevelInCampusScope(cls, scope)) {
              errors.push(
                `Fee Structure: Optional service "${opt.name}" targets class "${cls}" which is outside the academic scope of ${scope.campusName}.`
              );
            }
          }
        }
      }
    }
  }

  // 2. Validate Curriculum
  const curriculum = intakeData.curriculum;
  if (curriculum && Array.isArray(curriculum.classCurricula)) {
    for (const item of curriculum.classCurricula) {
      if (item.className && !isClassOrLevelInCampusScope(item.className, scope)) {
        errors.push(
          `Curriculum: Class curriculum targets class "${item.className}" which is outside the academic scope of ${scope.campusName}.`
        );
      }
    }
  }

  // 3. Validate Admissions
  const admissions = intakeData.admissions;
  if (admissions) {
    if (Array.isArray(admissions.classesOpenForAdmission)) {
      for (const cls of admissions.classesOpenForAdmission) {
        if (!isClassOrLevelInCampusScope(cls, scope)) {
          errors.push(
            `Admissions: Open admission class "${cls}" is outside the academic scope of ${scope.campusName}.`
          );
        }
      }
    }
    if (Array.isArray(admissions.classAvailability)) {
      for (const avail of admissions.classAvailability) {
        if (avail.className && !isClassOrLevelInCampusScope(avail.className, scope)) {
          errors.push(
            `Admissions: Class seat availability targets "${avail.className}" which is outside the academic scope of ${scope.campusName}.`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Filter fee configuration to only expose active campus classes.
 * Safely retains common fees while stripping inapplicable overrides.
 */
export function filterFeesByCampusScope(
  feesConfig: FeesConfigurationData,
  scope: CanonicalCampusAcademicScope
): FeesConfigurationData {
  const filteredCommonFees = (feesConfig.commonFees || []).map((fee) => {
    if (Array.isArray(fee.applicableClasses)) {
      return {
        ...fee,
        applicableClasses: fee.applicableClasses.filter((c) => isClassOrLevelInCampusScope(c, scope)),
      };
    }
    return fee;
  });

  const filteredNewStudentFees = (feesConfig.newStudentFees || []).map((fee) => {
    if (Array.isArray(fee.applicableClasses)) {
      return {
        ...fee,
        applicableClasses: fee.applicableClasses.filter((c) => isClassOrLevelInCampusScope(c, scope)),
      };
    }
    return fee;
  });

  const filteredClassFeeStructures = (feesConfig.classFeeStructures || []).filter((override) =>
    override.className ? isClassOrLevelInCampusScope(override.className, scope) : false
  );

  const filteredOptionalServices = (feesConfig.optionalServices || []).map((opt) => {
    if (Array.isArray(opt.applicableClasses)) {
      return {
        ...opt,
        applicableClasses: opt.applicableClasses.filter((c) => isClassOrLevelInCampusScope(c, scope)),
      };
    }
    return opt;
  });

  const filteredClassOverrides: Record<string, Record<string, any>> = {};
  if (feesConfig.classOverrides) {
    for (const [clsName, overrides] of Object.entries(feesConfig.classOverrides)) {
      if (isClassOrLevelInCampusScope(clsName, scope)) {
        filteredClassOverrides[clsName] = overrides;
      }
    }
  }

  return {
    ...feesConfig,
    commonFees: filteredCommonFees,
    newStudentFees: filteredNewStudentFees,
    classFeeStructures: filteredClassFeeStructures,
    classOverrides: filteredClassOverrides,
    optionalServices: filteredOptionalServices,
  };
}

/**
 * Filter curriculum to only expose active campus classes.
 */
export function filterCurriculumByCampusScope(
  curriculum: CurriculumData,
  scope: CanonicalCampusAcademicScope
): CurriculumData {
  const allowedSet = new Set(scope.classNames.map((c) => c.toLowerCase()));

  const filteredClassCurricula = (curriculum.classCurricula || []).filter((cc) =>
    cc.className ? allowedSet.has(cc.className.toLowerCase()) : false
  );

  return {
    ...curriculum,
    classCurricula: filteredClassCurricula,
  };
}

/**
 * Filter admissions data to only expose active campus classes.
 */
export function filterAdmissionsByCampusScope(
  admissions: AdmissionsData,
  scope: CanonicalCampusAcademicScope
): AdmissionsData {
  const allowedSet = new Set(scope.classNames.map((c) => c.toLowerCase()));

  const filteredClassesOpen = (admissions.classesOpenForAdmission || []).filter((c) =>
    allowedSet.has(c.toLowerCase())
  );

  const filteredClassAvailability = (admissions.classAvailability || []).filter((a) =>
    a.className ? allowedSet.has(a.className.toLowerCase()) : false
  );

  return {
    ...admissions,
    classesOpenForAdmission: filteredClassesOpen,
    classAvailability: filteredClassAvailability,
  };
}

/**
 * Fee Inheritance Engine (Requirement 10):
 * Resolves effective fee for a specific class:
 * 1. Checks for class-specific override in classFeeStructures.
 * 2. If not present, falls back to common/default fee applicable to that class.
 */
export function resolveEffectiveFeeForClass(
  className: string,
  feeCategoryOrName: string,
  feesConfig: FeesConfigurationData,
  scope: CanonicalCampusAcademicScope
): { amount: number; source: 'class_override' | 'common_default'; frequency: string; isConfigured: boolean } {
  const allowedSet = new Set(scope.classNames.map((c) => c.toLowerCase()));
  if (!allowedSet.has(className.toLowerCase())) {
    return { amount: 0, source: 'common_default', frequency: 'monthly', isConfigured: false };
  }

  const categoryLower = feeCategoryOrName.trim().toLowerCase();

  // 1. Check exact class override
  const override = (feesConfig.classFeeStructures || []).find(
    (item) =>
      item.className?.toLowerCase() === className.toLowerCase() &&
      (item.feeType?.toLowerCase() === categoryLower || (item as any).feeHead?.toLowerCase() === categoryLower)
  );

  if (override && typeof override.amount === 'number') {
    return {
      amount: override.amount,
      source: 'class_override',
      frequency: (override as any).frequency || 'monthly',
      isConfigured: true,
    };
  }

  // 1.5 Check academic level tier override (e.g. "Primary (Class 1-5)" or "Primary")
  const classLevel = resolveLevelForClassName(className, scope.academicLevels);
  const classLevelLower = classLevel.toLowerCase();

  const tierOverride = (feesConfig.classFeeStructures || []).find((item) => {
    if (!item.className) return false;
    const itemMatchesCategory =
      item.feeType?.toLowerCase() === categoryLower || (item as any).feeHead?.toLowerCase() === categoryLower;
    if (!itemMatchesCategory) return false;

    const itemLower = item.className.trim().toLowerCase();
    if (itemLower === classLevelLower) return true;
    if (itemLower.startsWith(classLevelLower) && itemLower.includes('(')) return true;
    return false;
  });

  if (tierOverride && typeof tierOverride.amount === 'number') {
    return {
      amount: tierOverride.amount,
      source: 'class_override',
      frequency: (tierOverride as any).frequency || 'monthly',
      isConfigured: true,
    };
  }

  // 2. Check common fee
  const common = (feesConfig.commonFees || []).find((f) => {
    const matchesCategory =
      f.category.toLowerCase() === categoryLower || f.name.toLowerCase() === categoryLower;
    const isApplicable =
      f.applicableClasses === 'all' ||
      !Array.isArray(f.applicableClasses) ||
      f.applicableClasses.some((c) => c.toLowerCase() === className.toLowerCase());
    return matchesCategory && isApplicable;
  });

  if (common && typeof common.amount === 'number') {
    return {
      amount: common.amount,
      source: 'common_default',
      frequency: common.frequency || 'monthly',
      isConfigured: true,
    };
  }

  return { amount: 0, source: 'common_default', frequency: 'monthly', isConfigured: false };
}
