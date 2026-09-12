/**
 * AUTOMATED TEST SUITE: ACADEMIC ONBOARDING & FEE CALCULATION ENGINE
 *
 * Verifies:
 * TEST 1: Global Fee Inheritance across all active classes from academic structure.
 * TEST 2: New Student Fee exclusion from existing student totals.
 * TEST 3: Pre-Nursery existing student "Not applicable" rule (Pre-Nursery is new-admission-only).
 * TEST 4: Class-level override and reset-to-global behavior.
 * TEST 5: Optional services toggle and inclusion in simulator calculations.
 * TEST 6: Payment plan annual equivalent and yearly discount application.
 * TEST 7: Scholarships & Discounts (Merit slabs, Defence 5%, Girls 10%, Sibling).
 * TEST 8: Annual charges sentence generator and inclusions/exclusions natural language output.
 * TEST 9: Centralized validation engine (blockers vs warnings).
 * TEST 10: Academic section completeness and 3/3 chapter mapping.
 */

import {
  normalizeFeesData,
  resolveClassFees,
  calculateFeeBreakdown,
  generateAnnualChargesSummary,
  generateInclusionsExclusions,
  validateFeeStructure,
  calculateAnnualEquivalent,
  isPreNurseryClass,
  formatFeeCurrency,
  DEFAULT_COMMON_FEES,
  DEFAULT_NEW_STUDENT_FEES,
  DEFAULT_OPTIONAL_SERVICES,
  DEFAULT_PAYMENT_PLANS,
  DEFAULT_SCHOLARSHIPS,
  DEFAULT_ANNUAL_CHARGES_INCLUSIONS,
  DEFAULT_FEE_NOTES,
} from '../feeCalculationEngine';
import {
  calculateIntakeCompleteness,
  INTAKE_CHAPTERS,
  INTAKE_SECTIONS,
  isSectionApplicable,
} from '../schoolIntake';
import {
  migrateAndNormalizeAcademicFees,
  calculateAdmissionCompleteness,
  calculateFeeStructureCompleteness,
  calculateCurriculumCompleteness,
  calculateAcademicCompleteness,
} from '../academicCompletenessEngine';
import { resolveRemediationDestination } from '../remediationRegistry';
import { CANONICAL_DOCUMENT_IDS } from '../canonicalDocuments';
import { buildSchoolWebsiteDataFromIntake as buildSchoolWebsiteData } from '../schoolWebsiteContract';
import type {
  FeesConfigurationData,
  AcademicStructureData,
  CurriculumData,
  UniversalIntakeData,
} from '../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('===========================================================');
console.log('TEST SUITE: Academic Onboarding & Fee Calculation Engine');
console.log('===========================================================\n');

// -----------------------------------------------------------------------------
// TEST 1: Global Fee Inheritance
// -----------------------------------------------------------------------------
console.log('TEST 1: Global Fee Inheritance across all active classes');
{
  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'f1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 3500, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
      { id: 'f2', name: 'Annual Development Fee', category: 'Annual Charges', frequency: 'annually', amount: 12000, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
  };

  // Resolve for Class 1 (new student)
  const resolvedClass1 = resolveClassFees('Class 1', 'Class 1', fees, 'new_admission');
  assert(resolvedClass1.length === 2, 'Class 1 inherits all 2 common fees');
  const totalAnnual = resolvedClass1.reduce((sum, item) => sum + item.annualEquivalent, 0);
  assert(totalAnnual === (3500 * 12) + 12000, 'Class 1 annual total matches 3500*12 + 12000 = 54000');
  assert(resolvedClass1.every(i => i.status === 'INHERITED'), 'Fee items are marked as inherited');

  // Resolve for Class 5 (new student)
  const resolvedClass5 = resolveClassFees('Class 5', 'Class 5', fees, 'new_admission');
  const totalClass5 = resolvedClass5.reduce((sum, item) => sum + item.annualEquivalent, 0);
  assert(totalClass5 === 54000, 'Class 5 inherits same base fee without redundant configuration');
}

// -----------------------------------------------------------------------------
// TEST 2: New Student Fee Exclusion for Existing Students
// -----------------------------------------------------------------------------
console.log('\nTEST 2: New Student Fee exclusion for existing students');
{
  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 4000, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
    newStudentFees: [
      { id: 'n1', name: 'Admission Fee', category: 'Admission Fee', frequency: 'one_time', amount: 25000, isRefundable: false, studentType: 'new_only', applicableClasses: 'all' },
      { id: 'n2', name: 'Caution Money (Refundable)', category: 'Caution Money', frequency: 'one_time', amount: 10000, isRefundable: true, studentType: 'new_only', applicableClasses: 'all' },
    ],
  };

  const newStudentRes = resolveClassFees('Class 1', 'Class 1', fees, 'new_admission');
  const existingStudentRes = resolveClassFees('Class 1', 'Class 1', fees, 'existing_student');

  assert(newStudentRes.length === 3, 'New student has 3 fee items (Tuition + Admission + Caution)');
  const oneTimeTotal = newStudentRes.filter(i => i.frequency === 'one_time').reduce((s, i) => s + i.amount, 0);
  assert(oneTimeTotal === 35000, 'New student one-time fee is 35000');

  assert(existingStudentRes.length === 1, 'Existing student has only 1 fee item (Tuition)');
  const existingOneTime = existingStudentRes.filter(i => i.frequency === 'one_time').reduce((s, i) => s + i.amount, 0);
  assert(existingOneTime === 0, 'Existing student one-time fee is 0');
  assert(existingStudentRes[0].id === 'c1', 'Existing student fee item is Tuition only');
}

// -----------------------------------------------------------------------------
// TEST 3: Pre-Nursery Exemption for Existing Students
// -----------------------------------------------------------------------------
console.log('\nTEST 3: Pre-Nursery existing student "Not applicable" rule');
{
  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 3000, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
  };

  assert(isPreNurseryClass('Pre-Nursery') === true, 'isPreNurseryClass identifies "Pre-Nursery"');
  assert(isPreNurseryClass('Playgroup') === true, 'isPreNurseryClass identifies "Playgroup"');
  assert(isPreNurseryClass('Class 1') === false, 'isPreNurseryClass returns false for "Class 1"');

  // When resolving for existing student in Pre-Nursery
  const preNurseryExisting = resolveClassFees('Pre-Nursery', 'Pre-Nursery', fees, 'existing_student');
  assert(preNurseryExisting.length === 0, 'Pre-Nursery existing student has 0 fee items');

  // When resolving for new admission in Pre-Nursery
  const preNurseryNew = resolveClassFees('Pre-Nursery', 'Pre-Nursery', fees, 'new_admission');
  assert(preNurseryNew.length === 1, 'Pre-Nursery new admission has tuition fee item');

  // In calculateFeeBreakdown
  const breakdownPreNurseryExisting = calculateFeeBreakdown({
    className: 'Pre-Nursery',
    studentType: 'existing_student',
    feesConfig: fees,
  });
  assert(breakdownPreNurseryExisting.isPreNurseryExempt === true, 'Pre-Nursery existing marked isPreNurseryExempt');
  assert(breakdownPreNurseryExisting.netEstimatedPayable === 0, 'Pre-Nursery existing payable is 0');
}

// -----------------------------------------------------------------------------
// TEST 4: Class-level Override & Reset
// -----------------------------------------------------------------------------
console.log('\nTEST 4: Class-level override and reset-to-global behavior');
{
  const feesWithOverride: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 3000, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
    classOverrides: {
      'Class 10': {
        'c1': {
          amount: 5000,
          isCustom: true,
          notes: 'Board examination coaching',
        },
      },
    },
  };

  const class9Res = resolveClassFees('Class 9', 'Class 9', feesWithOverride, 'new_admission');
  const class10Res = resolveClassFees('Class 10', 'Class 10', feesWithOverride, 'new_admission');

  assert(class9Res[0].amount === 3000, 'Class 9 uses common tuition fee 3000');
  assert(class9Res[0].status === 'INHERITED', 'Class 9 status is INHERITED');

  assert(class10Res[0].amount === 5000, 'Class 10 uses overridden tuition fee 5000');
  assert(class10Res[0].status === 'CUSTOM', 'Class 10 status is CUSTOM');

  // Reset override
  const feesReset: FeesConfigurationData = {
    ...feesWithOverride,
    classOverrides: {},
  };
  const class10ResetRes = resolveClassFees('Class 10', 'Class 10', feesReset, 'new_admission');
  assert(class10ResetRes[0].amount === 3000, 'Class 10 resets back to common tuition fee 3000');
  assert(class10ResetRes[0].status === 'INHERITED', 'Class 10 source reverts to INHERITED');
}

// -----------------------------------------------------------------------------
// TEST 5: Optional Services Toggle & Inclusion
// -----------------------------------------------------------------------------
console.log('\nTEST 5: Optional services toggle and inclusion in simulator');
{
  const feesWithOptional: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 3000, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
    optionalServices: [
      { id: 'opt-trans', key: 'transport', name: 'School Bus Transport', isProvided: true, frequency: 'monthly', feeAmount: 1800, applicableClasses: 'all', isRequired: false },
      { id: 'opt-hostel', key: 'hostel', name: 'Hostel & Boarding', isProvided: false, frequency: 'annually', feeAmount: 60000, applicableClasses: 'all', isRequired: false },
    ],
  };

  const resolved = resolveClassFees('Class 5', 'Class 5', feesWithOptional, 'existing_student');
  assert(resolved.some(f => f.id === 'opt-trans'), 'Transport service is resolved when isProvided=true');
  assert(!resolved.some(f => f.id === 'opt-hostel'), 'Hostel is omitted when isProvided=false');
}

// -----------------------------------------------------------------------------
// TEST 6: Payment Plans & Yearly Discount
// -----------------------------------------------------------------------------
console.log('\nTEST 6: Payment plan annual equivalent and yearly discount application');
{
  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 5000, isRefundable: false, studentType: 'both', applicableClasses: 'all' }, // 60,000 / yr
      { id: 'c2', name: 'Annual Development Charge', category: 'Annual Charges', frequency: 'annually', amount: 10000, isRefundable: false, studentType: 'both', applicableClasses: 'all' }, // 10,000 / yr
    ],
    paymentPlans: [
      { frequency: 'yearly', isEnabled: true, yearlyDiscountPercentage: 5, discountAppliesTo: 'tuition_only' },
    ],
  };

  const simAnnual = calculateFeeBreakdown({
    className: 'Class 5',
    studentType: 'existing_student',
    paymentPlanFrequency: 'yearly',
    feesConfig: fees,
  });

  // Tuition is 60,000. 5% discount on tuition is 3,000.
  assert(simAnnual.yearlyPaymentDiscountAmount === 3000, '5% discount on tuition (60,000) yields 3,000 discount');
  assert(simAnnual.netEstimatedPayable === (60000 + 10000) - 3000, 'Net payable is 70,000 - 3,000 = 67,000');
}

// -----------------------------------------------------------------------------
// TEST 7: Scholarships & Discounts (Merit, Defence, Girls, Sibling)
// -----------------------------------------------------------------------------
console.log('\nTEST 7: Scholarships & Discounts (Merit slabs, Defence 5%, Girls 10%, Sibling)');
{
  const fees: FeesConfigurationData = {
    commonFees: [
      { id: 'c1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: 10000, isRefundable: false, studentType: 'both', applicableClasses: 'all' }, // 120,000 / yr
    ],
    scholarships: {
      meritScholarship: {
        isEnabled: true,
        slabs: [
          { id: 's1', minPercentage: 90, maxPercentage: 100, discountPercentage: 25, appliesTo: 'net_tuition' },
        ],
      },
      defenceScholarship: {
        isEnabled: true,
        name: 'Wards of Defence Personnel',
        discountPercentage: 5,
        eligibility: 'All ranks',
        appliesTo: 'net_tuition',
      },
      girlsScholarship: {
        isEnabled: true,
        discountPercentage: 10,
        appliesTo: 'net_tuition',
      },
      siblingDiscount: {
        isEnabled: true,
        secondChildDiscount: 10,
        thirdChildDiscount: 15,
        appliesTo: 'net_tuition',
      },
      seatAvailability: {
        seatLimitPercentage: 25,
        allocation: 'fcfs',
      },
      stackingRule: 'highest_only',
    },
  };

  // Case A: Merit 95% -> 25% discount
  const simMerit = calculateFeeBreakdown({
    className: 'Class 8',
    studentType: 'existing_student',
    scholarshipType: 'merit',
    meritScorePercentage: 95,
    feesConfig: fees,
  });
  assert(simMerit.scholarshipDiscountAmount === 30000, 'Merit 95% awards 25% waiver on tuition (30,000)');

  // Case B: Defence 5%
  const simDefence = calculateFeeBreakdown({
    className: 'Class 8',
    studentType: 'existing_student',
    scholarshipType: 'defence',
    feesConfig: fees,
  });
  assert(simDefence.scholarshipDiscountAmount === 6000, 'Defence awards 5% waiver on tuition (6,000)');

  // Case C: Girls 10%
  const simGirls = calculateFeeBreakdown({
    className: 'Class 8',
    studentType: 'existing_student',
    scholarshipType: 'girls',
    feesConfig: fees,
  });
  assert(simGirls.scholarshipDiscountAmount === 12000, 'Girls scholarship awards 10% waiver on tuition (12,000)');
}

// -----------------------------------------------------------------------------
// TEST 8: Annual Charges Sentence Generator & Inclusions/Exclusions
// -----------------------------------------------------------------------------
console.log('\nTEST 8: Annual charges sentence generator & inclusions/exclusions');
{
  const inclusions = ['Library', 'Sports', 'Science & Computer Labs'];
  const summarySentence = generateAnnualChargesSummary(inclusions);
  assert(summarySentence.includes('Annual Charges include'), 'Summary sentence states coverage');
  assert(summarySentence.includes('Science & Computer Labs'), 'Summary sentence lists selected items');

  const incExc = generateInclusionsExclusions({
    annualChargesInclusions: inclusions,
    optionalServices: [
      { id: '1', key: 'transport', name: 'Transport', isProvided: true, feeAmount: 2000, isRequired: false },
      { id: '2', key: 'hostel', name: 'Hostel', isProvided: false, feeAmount: 50000, isRequired: false },
    ],
  });

  assert(incExc.included.length >= 2, 'Inclusions contains expected items');
  assert(incExc.notIncluded.some(e => e.includes('Transport')), 'notIncluded mentions optional Transport');
  assert(!incExc.notIncluded.some(e => e.includes('Hostel')), 'notIncluded excludes unoffered Hostel');
}

// -----------------------------------------------------------------------------
// TEST 9: Centralized Validation Engine
// -----------------------------------------------------------------------------
console.log('\nTEST 9: Centralized validation engine (blockers vs warnings)');
{
  // Invalid data: negative fee and discount > 100%
  const invalidFees: FeesConfigurationData = {
    commonFees: [
      { id: 'f1', name: 'Tuition Fee', category: 'Tuition', frequency: 'monthly', amount: -500, isRefundable: false, studentType: 'both', applicableClasses: 'all' },
    ],
    paymentPlans: [
      { frequency: 'yearly', isEnabled: true, yearlyDiscountPercentage: 150 }, // Invalid!
    ],
  };

  const validation = validateFeeStructure(invalidFees);
  assert(!validation.isValid, 'Validation fails when negative amounts or >100% discounts exist');
  assert(validation.blockers.length >= 2, 'Validation reports blockers');
  assert(validation.blockers.some(b => b.includes('negative amount')), 'Blocker found for negative fee amount');
  assert(validation.blockers.some(b => b.includes('cannot exceed 100%')), 'Blocker found for invalid percentage');

  // Valid normalized fees
  const validFees = normalizeFeesData({});
  const validValidation = validateFeeStructure(validFees);
  assert(validValidation.isValid, 'Normalized default fees pass validation without blockers');
}

// -----------------------------------------------------------------------------
// TEST 10: Academic Section Completeness & 3/3 Chapter Structure
// -----------------------------------------------------------------------------
console.log('\nTEST 10: Academic section completeness and 3/3 chapter mapping');
{
  // Check INTAKE_CHAPTERS
  const academicChapter = INTAKE_CHAPTERS.find(c => c.key === 'chapter_operations_finance');
  assert(academicChapter !== undefined, 'Academic chapter exists');
  assert(academicChapter?.title === 'Academic', 'Chapter title is "Academic"');

  // Check sections in Academic chapter
  const academicSections = INTAKE_SECTIONS.filter(s => s.chapter === 'chapter_operations_finance');
  assert(academicSections.length === 3, 'Academic chapter has EXACTLY 3 sections');
  assert(academicSections[0].key === 'admissions', 'First section is Admissions');
  assert(academicSections[1].key === 'feesConfiguration', 'Second section is Fee Structure');
  assert(academicSections[2].key === 'curriculum', 'Third section is Curriculum');

  // Check calculateIntakeCompleteness for fee structure and curriculum
  const intakeDataWithAcademic: UniversalIntakeData = {
    feesConfiguration: normalizeFeesData({}),
    curriculum: {
      overview: {
        board: 'CBSE',
        academicApproach: 'Experiential and inquiry-based learning',
      },
      classCurricula: [
        { className: 'Class 1', subjects: ['English', 'Mathematics', 'EVS', 'Hindi'] },
      ],
      subjects: [
        { id: 'sub_eng', name: 'English', category: 'Language', isMandatory: true },
      ],
    },
  };

  const completeness = calculateIntakeCompleteness('school-complete', intakeDataWithAcademic);
  const feeScore = completeness.sectionPercentages.feesConfiguration;
  assert(feeScore >= 70, `Fee structure completeness is high with normalized data: ${feeScore}%`);

  const curriculumScore = completeness.sectionPercentages.curriculum;
  assert(curriculumScore === 100, `Curriculum completeness is 100% when board, approach, class curricula, and subjects exist: ${curriculumScore}%`);
}

// -----------------------------------------------------------------------------
// TEST 11: Idempotent Migration from Legacy Admissions Fee Model
// -----------------------------------------------------------------------------
console.log('\nTEST 11: Idempotent Migration from Legacy Admissions Fee Model');
{
  const legacyIntake: Partial<UniversalIntakeData> = {
    admissions: {
      applicationFee: 1500,
      admissionFee: 25000,
      registrationFee: 2000,
      feeNotes: 'Fees once paid are strictly non-refundable.',
      fees: [
        {
          name: 'Annual Composite Fee',
          amount: 48000,
          frequency: 'annual',
          applicableClasses: 'all',
          isRefundable: false,
          showOnWebsite: true,
          displayLabel: 'Annual Academic Fee',
          description: 'Includes tuition and lab charges.',
        },
        {
          name: 'Prospectus Charge',
          amount: 500,
          frequency: 'one_time',
          isRefundable: false,
          showOnWebsite: true,
          isAdmissionOnly: true,
        },
      ],
    } as any,
  };

  // Run migration 1st time
  const { intakeData: migrated1, migratedCount: count1 } = migrateAndNormalizeAcademicFees(legacyIntake);
  assert(count1 > 0, `First migration migrated ${count1} legacy fee items`);
  const feesConfig1 = migrated1.feesConfiguration!;
  assert(Array.isArray(feesConfig1.newStudentFees), 'newStudentFees is an array');
  assert(feesConfig1.newStudentFees!.some(f => f.name === 'Application Fee' && f.amount === 1500), 'Application fee migrated with correct amount 1500');
  assert(feesConfig1.newStudentFees!.some(f => f.name === 'Admission Fee' && f.amount === 25000), 'Admission fee migrated with correct amount 25000');
  assert(feesConfig1.newStudentFees!.some(f => f.name === 'Registration Fee' && f.amount === 2000), 'Registration fee migrated with correct amount 2000');
  assert(feesConfig1.commonFees!.some(f => f.name === 'Annual Academic Fee' && f.amount === 48000), 'Annual Composite Fee migrated with display label and amount');

  // Idempotency: Run migration 5 consecutive times
  let current = migrated1;
  for (let i = 2; i <= 5; i++) {
    const { intakeData: iterated, migratedCount } = migrateAndNormalizeAcademicFees(current);
    assert(migratedCount === 0, `Iteration ${i}: 0 additional items migrated (idempotent)`);
    current = iterated;
  }

  const finalFees = current.feesConfiguration!;
  const appFeeCount = finalFees.newStudentFees!.filter(f => f.name === 'Application Fee').length;
  assert(appFeeCount === 1, `Exact 1 Application Fee entry exists after 5 migration passes (was ${appFeeCount})`);
  const annualCount = finalFees.commonFees!.filter(f => f.name === 'Annual Academic Fee').length;
  assert(annualCount === 1, `Exact 1 Annual Academic Fee entry exists after 5 migration passes (was ${annualCount})`);
}

// -----------------------------------------------------------------------------
// TEST 12: Independent Section Completeness
// -----------------------------------------------------------------------------
console.log('\nTEST 12: Independent Section Completeness (Admissions, Fee Structure, Curriculum)');
{
  // 1. Admission completeness independently
  const admPartial: Partial<UniversalIntakeData> = {
    admissions: {
      session: '2026-2027',
      contact: {
        name: 'Mrs. Rekha Sharma',
        phone: '+91 9876543210',
      },
      applicationOptions: {
        admissionsOpen: true,
        onlineApplication: true,
        applicationFeeRequired: true,
      },
      application: {
        method: 'online',
      },
    } as any,
    feesConfiguration: {
      newStudentFees: [
        { id: 'app1', name: 'Application Fee', category: 'Admission Fee', amount: 500, frequency: 'one_time', isRefundable: false, studentType: 'new_only', applicableClasses: 'all' },
      ],
    } as any,
  };

  const admComp = calculateAdmissionCompleteness(admPartial, 'school-website');
  assert(admComp.isComplete === true, 'Admission section is complete independently');
  assert(admComp.percentage === 100, `Admission percentage is 100% (was ${admComp.percentage}%)`);
  assert(admComp.missingFields.length === 0, 'Zero missing fields for complete admission data');

  // 2. Fee structure completeness independently
  const feePartial: Partial<UniversalIntakeData> = {
    feesConfiguration: normalizeFeesData({}),
  };
  const feeComp = calculateFeeStructureCompleteness(feePartial, 'school-website');
  assert(feeComp.isComplete === true, 'Fee structure is complete independently with default normalized data');
  assert(feeComp.percentage === 100, `Fee structure percentage is 100% (was ${feeComp.percentage}%)`);

  // 3. Curriculum completeness independently
  const currPartial: Partial<UniversalIntakeData> = {
    curriculum: {
      overview: {
        board: 'CBSE',
        academicApproach: 'Inquiry-based and experiential learning methodology',
      },
      subjects: [
        { id: 'sub1', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
      ],
      classCurricula: [
        { className: 'Grade 1', subjects: ['Mathematics', 'English'] },
      ],
    },
  };
  const currComp = calculateCurriculumCompleteness(currPartial, 'school-website');
  assert(currComp.isComplete === true, 'Curriculum is complete independently');
  assert(currComp.percentage === 100, `Curriculum percentage is 100% (was ${currComp.percentage}%)`);
}

// -----------------------------------------------------------------------------
// TEST 13: Unified Academic Completeness 3/3 Guarantee
// -----------------------------------------------------------------------------
console.log('\nTEST 13: Unified Academic Completeness 3/3 Guarantee');
{
  const completeIntake: Partial<UniversalIntakeData> = {
    admissions: {
      session: '2026-2027',
      contact: {
        name: 'Dr. R. K. Verma',
        email: 'admissions@school.edu.in',
      },
    } as any,
    feesConfiguration: normalizeFeesData({}),
    curriculum: {
      overview: {
        board: 'CBSE',
        academicApproach: 'Holistic STEM and Arts education',
      },
      subjects: [
        { id: 's1', name: 'Science', category: 'Science', isMandatory: true, applicableClasses: [] },
      ],
    },
  };

  const academicSummary = calculateAcademicCompleteness(completeIntake, 'school-website');
  assert(academicSummary.totalCount === 3, 'Academic totalCount is strictly 3');
  assert(academicSummary.completedCount === 3, `All 3/3 Academic sections are completed (was ${academicSummary.completedCount}/3)`);
  assert(academicSummary.percentage === 100, `Academic overall percentage is 100% (was ${academicSummary.percentage}%)`);
  assert(academicSummary.isComplete === true, 'Academic chapter isComplete is true');
  assert(academicSummary.missingFields.length === 0, 'Academic chapter has 0 missing fields');
}

// -----------------------------------------------------------------------------
// TEST 14: Dynamic Product Applicability across All 4 Products
// -----------------------------------------------------------------------------
console.log('\nTEST 14: Dynamic Product Applicability across All 4 Products');
{
  const products = ['school-website', 'school-website-cms', 'school-erp', 'school-complete'];
  for (const prod of products) {
    assert(isSectionApplicable('admissions', prod), `admissions is applicable to ${prod}`);
    assert(isSectionApplicable('feesConfiguration', prod), `feesConfiguration is applicable to ${prod}`);
    assert(isSectionApplicable('curriculum', prod), `curriculum is applicable to ${prod}`);
  }
}

// -----------------------------------------------------------------------------
// TEST 15: Remediation Destination Integrity
// -----------------------------------------------------------------------------
console.log('\nTEST 15: Remediation Destination Integrity for Fee Schedule');
{
  const dest1 = resolveRemediationDestination(CANONICAL_DOCUMENT_IDS.FEE_SCHEDULE);
  assert(dest1.step === 'feesConfiguration', `FEE_SCHEDULE destination step is 'feesConfiguration' (was ${dest1.step})`);
  assert(dest1.field === 'feesConfiguration.commonFees', `FEE_SCHEDULE field is 'feesConfiguration.commonFees'`);

  const dest2 = resolveRemediationDestination('doc-fee-structure');
  assert(dest2.step === 'feesConfiguration', `'doc-fee-structure' destination step is 'feesConfiguration' (was ${dest2.step})`);
}

// -----------------------------------------------------------------------------
// TEST 16: School Website Contract Integration from feesConfiguration
// -----------------------------------------------------------------------------
console.log('\nTEST 16: School Website Contract Integration from feesConfiguration');
{
  const intakeForWebsite: UniversalIntakeData = {
    schoolProfile: {
      schoolName: 'Delhi Public Academy',
      board: 'CBSE',
    } as any,
    campuses: [
      { id: 'c1', name: 'Main Campus', isMainCampus: true, address: 'Civil Lines', city: 'Motihari', state: 'Bihar', pin: '845401' },
    ],
    admissions: {
      session: '2026-2027',
    } as any,
    feesConfiguration: {
      commonFees: [
        { id: 'cf1', name: 'Tuition Fee', category: 'Tuition', amount: 3200, frequency: 'monthly', isRefundable: false, studentType: 'both', applicableClasses: 'all', isVisibleOnWebsite: true },
        { id: 'cf2', name: 'Annual Development Charge', category: 'Annual Charges', amount: 8000, frequency: 'annually', isRefundable: false, studentType: 'both', applicableClasses: 'all', isVisibleOnWebsite: true },
      ],
      newStudentFees: [
        { id: 'nsf1', name: 'Admission Processing Fee', category: 'Admission Fee', amount: 5000, frequency: 'one_time', isRefundable: false, studentType: 'new_only', applicableClasses: 'all', isVisibleOnWebsite: true },
      ],
      feeNotes: [
        { id: 'fn1', text: 'Transport charges additional based on route.', isPublished: true },
      ],
    } as any,
  } as any;

  const websiteData = buildSchoolWebsiteData(intakeForWebsite);
  assert(websiteData.fees.hasFeeStructure === true, 'Website data hasFeeStructure is true');
  assert(websiteData.fees.items.length === 3, `Website data contains 3 fee items (was ${websiteData.fees.items.length})`);
  const tuition = websiteData.fees.items.find(i => i.category === 'Tuition Fee');
  assert(tuition !== undefined && tuition.amountINR === 3200, 'Tuition Fee item generated with amountINR 3200');
  const admFee = websiteData.fees.items.find(i => i.category === 'Admission Processing Fee');
  assert(admFee !== undefined && admFee.amountINR === 5000, 'Admission Processing Fee generated with amountINR 5000');
  assert(websiteData.fees.notes?.includes('Transport charges additional'), 'Fee notes properly propagated to website data');
  assert(websiteData.config.showFees === true, 'Website config showFees is true');
}

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n===========================================================');
console.log(`RESULTS: ${passed} passed, ${failed} failed`);
console.log('===========================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
