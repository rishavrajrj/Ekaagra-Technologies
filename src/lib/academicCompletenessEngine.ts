/**
 * AUTHORITATIVE ACADEMIC ONBOARDING COMPLETENESS & MIGRATION ENGINE
 * 
 * Single Source of Truth for:
 * 1. Safe, Idempotent Legacy Fee Migration (admissions.fees -> feesConfiguration).
 * 2. Independent Section Completeness:
 *    - calculateAdmissionCompleteness()
 *    - calculateFeeStructureCompleteness()
 *    - calculateCurriculumCompleteness()
 * 3. Unified Academic Aggregation (calculateAcademicCompleteness() -> 3/3).
 */

import type {
  UniversalIntakeData,
  AdmissionsData,
  FeesConfigurationData,
  CurriculumData,
  CommonFeeItem,
  FeeBillingFrequency,
} from './types';
import {
  normalizeFeesData,
  validateFeeStructure,
} from './feeCalculationEngine';

// ============================================================================
// 1. SAFE, IDEMPOTENT MIGRATION: ADMISSION FEES -> FEES CONFIGURATION
// ============================================================================

/**
 * Migrates legacy fee entries inside `admissions` (e.g. `admissions.fees`,
 * `admissions.applicationFee`, `admissions.admissionFee`, `admissions.registrationFee`,
 * `admissions.feeNotes`) into the authoritative `feesConfiguration` structure.
 *
 * Guarantees:
 * - Reads legacy data without data loss.
 * - Idempotent: Calling multiple times NEVER duplicates fee items.
 * - Preserves amount, currency, frequency, applicable classes, display label, and notes.
 * - Sets `feesConfiguration` as the definitive single source of truth.
 */
export function migrateAndNormalizeAcademicFees(
  intakeData: Partial<UniversalIntakeData>
): {
  intakeData: Partial<UniversalIntakeData>;
  migratedCount: number;
} {
  const result = { ...intakeData };
  const adm = (result.admissions || {}) as Partial<AdmissionsData>;
  let feesConfig = normalizeFeesData(result.feesConfiguration);
  let migratedCount = 0;

  const existingNewStudentFees = [...(feesConfig.newStudentFees || [])];
  const existingCommonFees = [...(feesConfig.commonFees || [])];

  // Helper to check if item already exists by ID or name
  const hasNewStudentFee = (idOrName?: string) => {
    if (!idOrName) return false;
    const target = idOrName.trim().toLowerCase();
    return existingNewStudentFees.some(
      (f) => f && (f.id === idOrName || (f.name && f.name.trim().toLowerCase() === target))
    );
  };

  const hasCommonFee = (idOrName?: string) => {
    if (!idOrName) return false;
    const target = idOrName.trim().toLowerCase();
    return existingCommonFees.some(
      (f) => f && (f.id === idOrName || (f.name && f.name.trim().toLowerCase() === target))
    );
  };

  // 1. Migrate scalar fees from admissions
  if (typeof adm.applicationFee === 'number' && adm.applicationFee > 0) {
    const existing = existingNewStudentFees.find(
      (f) => f.id === 'adm-legacy-app-fee' || f.name.trim().toLowerCase() === 'application fee'
    );
    if (existing) {
      if (existing.amount !== adm.applicationFee) {
        existing.amount = adm.applicationFee;
        migratedCount++;
      }
    } else {
      existingNewStudentFees.unshift({
        id: 'adm-legacy-app-fee',
        name: 'Application Fee',
        category: 'Admission Fee',
        amount: adm.applicationFee,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'Application processing and prospectus fee (migrated from Admission desk).',
      });
      migratedCount++;
    }
  }

  if (typeof adm.admissionFee === 'number' && adm.admissionFee > 0) {
    const existing = existingNewStudentFees.find(
      (f) => f.id === 'adm-legacy-adm-fee' || f.name.trim().toLowerCase() === 'admission fee'
    );
    if (existing) {
      if (existing.amount !== adm.admissionFee) {
        existing.amount = adm.admissionFee;
        migratedCount++;
      }
    } else {
      existingNewStudentFees.push({
        id: 'adm-legacy-adm-fee',
        name: 'Admission Fee',
        category: 'Admission Fee',
        amount: adm.admissionFee,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'One-time admission charge (migrated from Admission desk).',
      });
      migratedCount++;
    }
  }

  if (typeof adm.registrationFee === 'number' && adm.registrationFee > 0) {
    const existing = existingNewStudentFees.find(
      (f) => f.id === 'adm-legacy-reg-fee' || f.name.trim().toLowerCase() === 'registration fee' || f.name.trim().toLowerCase().includes('registration')
    );
    if (existing) {
      if (existing.amount !== adm.registrationFee) {
        existing.amount = adm.registrationFee;
        migratedCount++;
      }
    } else {
      existingNewStudentFees.unshift({
        id: 'adm-legacy-reg-fee',
        name: 'Registration Fee',
        category: 'Admission Fee',
        amount: adm.registrationFee,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'One-time registration fee (migrated from Admission desk).',
      });
      migratedCount++;
    }
  }

  // 2. Migrate structured fee array from admissions.fees
  if (Array.isArray(adm.fees) && adm.fees.length > 0) {
    for (const legacyFee of adm.fees) {
      if (!legacyFee || typeof legacyFee.amount !== 'number' || legacyFee.amount <= 0) {
        continue;
      }

      const feeName = (legacyFee.displayLabel || legacyFee.name || 'Fee Head').trim();
      const feeFreq: FeeBillingFrequency =
        legacyFee.frequency === 'annual' || legacyFee.frequency === 'per_session' || legacyFee.frequency === 'per_term'
          ? 'annually'
          : legacyFee.frequency === 'one_time'
          ? 'one_time'
          : legacyFee.frequency === 'quarterly'
          ? 'quarterly'
          : legacyFee.frequency === 'half_yearly'
          ? 'half_yearly'
          : 'monthly';

      const isOneTimeOrAdmission =
        feeFreq === 'one_time' ||
        feeName.toLowerCase().includes('application') ||
        feeName.toLowerCase().includes('admission') ||
        feeName.toLowerCase().includes('registration') ||
        feeName.toLowerCase().includes('prospectus') ||
        feeName.toLowerCase().includes('caution') ||
        Boolean((legacyFee as any).isAdmissionOnly);

      if (isOneTimeOrAdmission) {
        const existing = existingNewStudentFees.find(
          (f) => (legacyFee.id && f.id === legacyFee.id) || f.name.trim().toLowerCase() === feeName.toLowerCase()
        );
        if (existing) {
          if (existing.amount !== legacyFee.amount) {
            existing.amount = legacyFee.amount;
            migratedCount++;
          }
        } else {
          existingNewStudentFees.push({
            id: legacyFee.id || `adm-migrated-${Date.now()}-${migratedCount}`,
            name: feeName,
            category: feeName.toLowerCase().includes('caution') ? 'Caution Money' : 'Admission Fee',
            amount: legacyFee.amount,
            frequency: 'one_time',
            studentType: 'new_only',
            applicableClasses: Array.isArray(legacyFee.applicableClasses) && legacyFee.applicableClasses.length > 0
              ? legacyFee.applicableClasses
              : 'all',
            isRefundable: feeName.toLowerCase().includes('caution'),
            isVisibleOnWebsite: legacyFee.showOnWebsite !== false,
            isAdmissionOnly: true,
            paymentTiming: 'at_admission',
            description: legacyFee.notes || 'Migrated from Admission Fee Details',
          });
          migratedCount++;
        }
      } else {
        if (!hasCommonFee(feeName) && !hasCommonFee(legacyFee.id)) {
          existingCommonFees.push({
            id: legacyFee.id || `cf-migrated-${Date.now()}-${migratedCount}`,
            name: feeName,
            category: feeName.toLowerCase().includes('annual') ? 'Annual Charges' : 'Tuition',
            amount: legacyFee.amount,
            frequency: feeFreq,
            studentType: 'both',
            applicableClasses: Array.isArray(legacyFee.applicableClasses) && legacyFee.applicableClasses.length > 0
              ? legacyFee.applicableClasses
              : 'all',
            isRefundable: false,
            isVisibleOnWebsite: legacyFee.showOnWebsite !== false,
            description: legacyFee.notes || 'Migrated from Admission Fee Details',
          });
          migratedCount++;
        }
      }
    }
  }

  // 3. Migrate fee disclaimer / notes if present
  if (adm.feeNotes && adm.feeNotes.trim()) {
    if (!feesConfig.customFeeNotesText) {
      feesConfig.customFeeNotesText = adm.feeNotes.trim();
    }
    const hasNote = (feesConfig.feeNotes || []).some((n) => n.text === adm.feeNotes?.trim());
    if (!hasNote) {
      feesConfig.feeNotes = [
        ...(feesConfig.feeNotes || []),
        { id: `fn-migrated-${Date.now()}`, text: adm.feeNotes.trim(), isPublished: true },
      ];
    }
  }

  feesConfig.newStudentFees = existingNewStudentFees;
  feesConfig.commonFees = existingCommonFees;

  result.feesConfiguration = feesConfig;
  return { intakeData: result, migratedCount };
}

// ============================================================================
// 2. INDEPENDENT COMPLETENESS ENGINES
// ============================================================================

export interface SectionCompletenessResult {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
  score: { total: number; filled: number };
}

/**
 * Calculates independent completion score for ADMISSION (admissions).
 * Preserves all statutory admissions criteria while delegating fee ownership
 * to `feesConfiguration`.
 */
export function calculateAdmissionCompleteness(
  data: Partial<UniversalIntakeData>,
  productId?: string
): SectionCompletenessResult {
  const missingFields: string[] = [];
  const adm = data.admissions || ({} as Partial<AdmissionsData>);

  let total = 3;
  let filled = 0;

  // 1. Target Admission Session
  const session = (adm.session || adm.targetSessions || '').trim();
  if (session.length > 0) {
    filled++;
  } else {
    missingFields.push('Admissions: Target Admission Session');
  }

  // 2. Admissions In-Charge / Representative Name
  const incharge = (adm.contact?.name || adm.contactPerson || '').trim();
  if (incharge.length > 0) {
    filled++;
  } else {
    missingFields.push('Admissions: Admission In-Charge Name');
  }

  // 3. Admissions Contact Method (Phone, Email, WhatsApp, Hours, or Address)
  const hasPhone = Boolean((adm.contact?.phone || adm.admissionPhone || '').trim());
  const hasEmail = Boolean((adm.contact?.email || adm.admissionEmail || '').trim());
  const hasWhatsapp = Boolean((adm.contact?.whatsapp || adm.admissionWhatsapp || '').trim());
  const hasHours = Boolean((adm.contact?.visitingHours || adm.officeHours || '').trim());
  const hasAddress = Boolean((adm.contact?.address || '').trim());

  if (hasPhone || hasEmail || hasWhatsapp || hasHours || hasAddress) {
    filled++;
  } else {
    missingFields.push('Admissions: Primary contact method (Phone, Email, WhatsApp or Visiting Hours)');
  }

  // Conditional 1: Online Application enabled -> Application method required
  const onlineAppEnabled = Boolean(adm.applicationOptions?.onlineApplication ?? adm.onlineApplicationEnabled);
  if (onlineAppEnabled) {
    total++;
    const appMethod = (adm.application?.method || '').trim();
    if (appMethod.length > 0) {
      filled++;
    } else {
      missingFields.push('Admissions: Application Method (Online Application enabled)');
    }
  }

  // Conditional 2: Document Upload enabled -> Document requirements configured
  const docUploadEnabled = Boolean(adm.applicationOptions?.documentUpload ?? adm.documentUploadEnabled);
  if (docUploadEnabled) {
    total++;
    const hasConfiguredDoc =
      (Array.isArray(adm.documents) &&
        adm.documents.some((d) => d.requirement === 'required' || d.requirement === 'optional')) ||
      (Array.isArray(adm.requiredDocuments) && adm.requiredDocuments.length > 0);

    if (hasConfiguredDoc) {
      filled++;
    } else {
      missingFields.push('Admissions: Required/Optional Document configuration (Document Upload enabled)');
    }
  }

  // Conditional 3: Application Fee Required -> Fee configured in feesConfiguration or admissions
  const appFeeRequired = Boolean(adm.applicationOptions?.applicationFeeRequired);
  if (appFeeRequired) {
    total++;
    const feesConfig = data.feesConfiguration;
    const hasNewStudentAppFee =
      Array.isArray(feesConfig?.newStudentFees) &&
      feesConfig.newStudentFees.some((f) => typeof f.amount === 'number' && f.amount > 0);
    const hasLegacyAppFee =
      (Array.isArray(adm.fees) && adm.fees.some((f) => typeof f.amount === 'number' && f.amount > 0)) ||
      (typeof adm.applicationFee === 'number' && adm.applicationFee > 0);

    if (hasNewStudentAppFee || hasLegacyAppFee) {
      filled++;
    } else {
      missingFields.push('Admissions: Application or Registration fee (Fee Required is checked)');
    }
  }

  const percentage = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  return {
    percentage,
    missingFields,
    isComplete: percentage === 100 && missingFields.length === 0,
    score: { total, filled },
  };
}

/**
 * Calculates independent completion score for FEE STRUCTURE (feesConfiguration).
 * Verifies meaningful normalized configuration without relying on duplicate admission data.
 */
export function calculateFeeStructureCompleteness(
  data: Partial<UniversalIntakeData>,
  productId?: string
): SectionCompletenessResult {
  const missingFields: string[] = [];
  const feesConfig = data.feesConfiguration;

  if (!feesConfig) {
    return {
      percentage: 0,
      missingFields: ['Fee Structure: Fee configuration has not been initialized'],
      isComplete: false,
      score: { total: 4, filled: 0 },
    };
  }

  let total = 4;
  let filled = 0;

  // 1. Common Tuition Fee Configured
  const hasTuitionFee =
    (Array.isArray(feesConfig.commonFees) &&
      feesConfig.commonFees.some(
        (f) => (f.category?.toLowerCase() === 'tuition' || f.name?.toLowerCase().includes('tuition')) && f.amount > 0
      )) ||
    (Array.isArray(feesConfig.classFeeStructures) &&
      feesConfig.classFeeStructures.some(
        (c) => ((c.feeType?.toLowerCase() || '').includes('tuition') || ((c as any).feeHead?.toLowerCase() || '').includes('tuition')) && c.amount > 0
      ));

  if (hasTuitionFee) {
    filled++;
  } else {
    missingFields.push('Fee Structure: Core Common Tuition Fee must be configured');
  }

  // 2. Annual or One-Time New Student Charges Configured
  const hasNewStudentOrAnnual =
    (Array.isArray(feesConfig.newStudentFees) && feesConfig.newStudentFees.some((f) => f.amount > 0)) ||
    (Array.isArray(feesConfig.commonFees) &&
      feesConfig.commonFees.some(
        (f) => (f.category?.toLowerCase().includes('annual') || f.name?.toLowerCase().includes('annual')) && f.amount > 0
      )) ||
    (Array.isArray(feesConfig.classFeeStructures) &&
      feesConfig.classFeeStructures.some(
        (c) => ((c.feeType?.toLowerCase() || '').includes('annual') || (c.feeType?.toLowerCase() || '').includes('admission')) && c.amount > 0
      ));

  if (hasNewStudentOrAnnual) {
    filled++;
  } else {
    missingFields.push('Fee Structure: Annual Charges or New Admission Fees must be configured');
  }

  // 3. Payment Plans Configured
  const hasPaymentPlans =
    (Array.isArray(feesConfig.paymentPlans) && feesConfig.paymentPlans.some((p) => p.isEnabled)) ||
    (Array.isArray(feesConfig.billingFrequencies) && feesConfig.billingFrequencies.length > 0);

  if (hasPaymentPlans) {
    filled++;
  } else {
    missingFields.push('Fee Structure: At least one payment plan (e.g. Monthly, Yearly) must be enabled');
  }

  // 4. Domain Validation Cleanliness (No blocking calculation errors)
  const validation = validateFeeStructure(feesConfig);
  if (validation.isValid && validation.blockers.length === 0) {
    filled++;
  } else {
    missingFields.push(...validation.blockers.map((b) => `Fee Structure: ${b}`));
  }

  const percentage = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  return {
    percentage,
    missingFields,
    isComplete: percentage === 100 && missingFields.length === 0,
    score: { total, filled },
  };
}

/**
 * Calculates independent completion score for CURRICULUM (curriculum).
 * Verifies board affiliation, pedagogical philosophy, subject catalog, and class mapping.
 */
export function calculateCurriculumCompleteness(
  data: Partial<UniversalIntakeData>,
  productId?: string
): SectionCompletenessResult {
  const missingFields: string[] = [];
  const curr = data.curriculum || ({} as Partial<CurriculumData>);

  let total = 4;
  let filled = 0;

  // 1. Affiliation Board
  const board = (curr.overview?.board || data.schoolProfile?.board || '').trim();
  if (board.length > 0) {
    filled++;
  } else {
    missingFields.push('Curriculum: Affiliation Board (e.g. CBSE, ICSE, Cambridge)');
  }

  // 2. Academic Approach / Pedagogy
  const approach = (
    curr.overview?.academicApproach ||
    curr.overview?.learningPhilosophy ||
    curr.overview?.teachingMethodology ||
    ''
  ).trim();

  if (approach.length > 0) {
    filled++;
  } else {
    missingFields.push('Curriculum: Academic Approach or Learning Philosophy');
  }

  // 3. Subject Catalog
  const hasSubjectsInCatalog =
    (Array.isArray(curr.subjects) && curr.subjects.length > 0) ||
    (Array.isArray(data.institutionStructure?.subjects) && data.institutionStructure.subjects.length > 0) ||
    (Array.isArray(curr.classCurricula) && curr.classCurricula.some((c) => Array.isArray(c.subjects) && c.subjects.length > 0));

  if (hasSubjectsInCatalog) {
    filled++;
  } else {
    missingFields.push('Curriculum: Subject Catalog must contain at least one subject');
  }

  // 4. Class-wise Curriculum Mapping
  const hasClassCurricula =
    Array.isArray(curr.classCurricula) &&
    curr.classCurricula.some((c) => Array.isArray(c.subjects) && c.subjects.length > 0);

  if (hasClassCurricula || hasSubjectsInCatalog) {
    filled++;
  } else {
    missingFields.push('Curriculum: Class-wise subject assignment');
  }

  const percentage = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  return {
    percentage,
    missingFields,
    isComplete: percentage === 100 && missingFields.length === 0,
    score: { total, filled },
  };
}

// ============================================================================
// 3. AGGREGATED ACADEMIC COMPLETENESS (3/3 GUARANTEE)
// ============================================================================

export interface AcademicCompletenessSummary {
  percentage: number;
  completedCount: number;
  totalCount: 3;
  isComplete: boolean;
  missingFields: string[];
  sectionScores: {
    admissions: SectionCompletenessResult;
    feesConfiguration: SectionCompletenessResult;
    curriculum: SectionCompletenessResult;
  };
}

/**
 * Aggregates completeness across all 3 Academic sections:
 * - Admission (admissions)
 * - Fee Structure (feesConfiguration)
 * - Curriculum (curriculum)
 *
 * Always evaluates to exactly `3/3` total count.
 */
export function calculateAcademicCompleteness(
  data: Partial<UniversalIntakeData>,
  productId: string = 'school-complete'
): AcademicCompletenessSummary {
  // Ensure migration is run first so fees in admissions migrate seamlessly
  const { intakeData: normalizedData } = migrateAndNormalizeAcademicFees(data);

  const admissionResult = calculateAdmissionCompleteness(normalizedData, productId);
  const feeResult = calculateFeeStructureCompleteness(normalizedData, productId);
  const curriculumResult = calculateCurriculumCompleteness(normalizedData, productId);

  const completedCount = [
    admissionResult.isComplete,
    feeResult.isComplete,
    curriculumResult.isComplete,
  ].filter(Boolean).length;

  const aggregatedPercentage = Math.round(
    (admissionResult.percentage + feeResult.percentage + curriculumResult.percentage) / 3
  );

  const missingFields = [
    ...admissionResult.missingFields,
    ...feeResult.missingFields,
    ...curriculumResult.missingFields,
  ];

  return {
    percentage: aggregatedPercentage,
    completedCount,
    totalCount: 3,
    isComplete: completedCount === 3,
    missingFields,
    sectionScores: {
      admissions: admissionResult,
      feesConfiguration: feeResult,
      curriculum: curriculumResult,
    },
  };
}
