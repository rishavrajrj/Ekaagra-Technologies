/**
 * PRODUCTION-GRADE FEE CALCULATION & INHERITANCE ENGINE
 * 
 * Core Philosophy: CONFIGURE ONCE -> INHERIT EVERYWHERE -> OVERRIDE ONLY WHEN NEEDED
 * 
 * Hierarchy:
 * GLOBAL DATA -> SERVICE CONFIGURATION -> CLASS-WISE OVERRIDES -> CALCULATED FEE -> PUBLIC WEBSITE
 */

import type {
  FeesConfigurationData,
  CommonFeeItem,
  OptionalServiceConfig,
  PaymentPlanConfig,
  ScholarshipConfigData,
  ClassFeeOverrideItem,
  FeeStatusKind,
  FeeBillingFrequency,
  StudentTypeEligibility,
  FeeNoteItem,
  AcademicClassConfig,
} from './types';

// ============================================================================
// 1. DEFAULT CONSTANTS & CATALOGS
// ============================================================================

export const DEFAULT_FEE_CATEGORIES = [
  'Tuition',
  'Annual Charges',
  'Examination',
  'Library',
  'Insurance',
  'Student Welfare',
  'Sports',
  'Technology / Computer',
  'Activity',
  'Other',
] as const;

export const DEFAULT_ANNUAL_CHARGES_INCLUSIONS = [
  { id: 'exam', label: 'Examination' },
  { id: 'library', label: 'Library' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'welfare', label: 'Student Welfare' },
  { id: 'sports', label: 'Sports' },
  { id: 'student_info', label: 'Online Student Information' },
  { id: 'pdp', label: 'PDP (Personality Development Program)' },
] as const;

export const DEFAULT_OPTIONAL_SERVICES: OptionalServiceConfig[] = [
  {
    id: 'opt-transport',
    key: 'transport',
    name: 'Transport',
    isProvided: true,
    description: 'Safe GPS-tracked school bus transit across authorized routes.',
    feeAmount: 1500,
    frequency: 'monthly',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'route_based',
  },
  {
    id: 'opt-hostel',
    key: 'hostel',
    name: 'Hostel / Boarding',
    isProvided: false,
    description: 'Residential boarding facilities, warden supervision, and study halls.',
    feeAmount: 45000,
    frequency: 'annually',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
  {
    id: 'opt-meals',
    key: 'meals',
    name: 'Meals / Cafeteria',
    isProvided: false,
    description: 'Nutritious breakfast, lunch, and evening snacks prepared hygienically.',
    feeAmount: 2000,
    frequency: 'monthly',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
  {
    id: 'opt-uniform',
    key: 'uniform',
    name: 'Uniform',
    isProvided: true,
    description: 'Prescribed seasonal school uniform sets, blazer, sports attire, and badges.',
    feeAmount: 3500,
    frequency: 'one_time',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
  {
    id: 'opt-books',
    key: 'books',
    name: 'Books / Study Material',
    isProvided: true,
    description: 'Textbooks, activity workbooks, notebooks, and learning supplementary kits.',
    feeAmount: 4000,
    frequency: 'annually',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
  {
    id: 'opt-trips',
    key: 'trips',
    name: 'School Trips & Excursions',
    isProvided: false,
    description: 'Educational field trips, botanical visits, science center tours, and leadership camps.',
    feeAmount: 2500,
    frequency: 'annually',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
  {
    id: 'opt-activities',
    key: 'activities',
    name: 'After-School Activities',
    isProvided: false,
    description: 'Specialized coaching in robotics, chess, martial arts, classical music & dance.',
    feeAmount: 1000,
    frequency: 'monthly',
    applicableClasses: 'all',
    isRequired: false,
    studentType: 'both',
    isVisibleOnWebsite: true,
    pricingModel: 'flat',
  },
];

export const DEFAULT_PAYMENT_PLANS: PaymentPlanConfig[] = [
  { frequency: 'monthly', isEnabled: true },
  { frequency: 'quarterly', isEnabled: true },
  { frequency: 'half_yearly', isEnabled: true },
  {
    frequency: 'yearly',
    isEnabled: true,
    yearlyDiscountPercentage: 5,
    discountAppliesTo: 'tuition_only',
  },
];

export const DEFAULT_SCHOLARSHIPS: ScholarshipConfigData = {
  meritScholarship: {
    isEnabled: true,
    slabs: [
      { id: 'merit-1', minPercentage: 90, maxPercentage: 100, discountPercentage: 20, appliesTo: 'net_tuition' },
      { id: 'merit-2', minPercentage: 85, maxPercentage: 89.99, discountPercentage: 15, appliesTo: 'net_tuition' },
      { id: 'merit-3', minPercentage: 80, maxPercentage: 84.99, discountPercentage: 10, appliesTo: 'net_tuition' },
      { id: 'merit-4', minPercentage: 0, maxPercentage: 79.99, discountPercentage: 0, appliesTo: 'net_tuition' },
    ],
  },
  defenceScholarship: {
    isEnabled: true,
    name: 'Wards of Defence Personnel',
    discountPercentage: 5,
    eligibility: 'Children of serving and retired armed forces and paramilitary personnel.',
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
    notes: '25% of scholarship seats are allocated on a First Come First Serve basis upon eligibility verification.',
  },
  stackingRule: 'highest_only',
};

export const DEFAULT_FEE_NOTES: FeeNoteItem[] = [
  { id: 'fn-1', text: 'Fees are subject to revision for future academic sessions as per school regulatory guidelines.', isPublished: true },
  { id: 'fn-2', text: 'One-time admission and registration charges apply strictly to newly admitted students.', isPublished: true },
  { id: 'fn-3', text: 'Optional services (transport, meals, hostel) are charged separately based on opted routes or facilities.', isPublished: true },
  { id: 'fn-4', text: 'Caution Money is refundable according to school policy upon withdrawal after settling all dues.', isPublished: true },
  { id: 'fn-5', text: 'Late payment charges may apply if dues are not cleared within the designated grace period.', isPublished: true },
];

// ============================================================================
// 2. HELPER UTILITIES
// ============================================================================

/**
 * Checks whether a class is Pre-Nursery / Playgroup / Creche
 * In these foundational classes, all students are new admissions.
 * Existing Student fee configuration is strictly Not Applicable.
 */
export function isPreNurseryClass(className?: string): boolean {
  if (!className) return false;
  const norm = className.trim().toLowerCase();
  return (
    norm === 'pre-nursery' ||
    norm === 'prenursery' ||
    norm === 'pre nursery' ||
    norm === 'playgroup' ||
    norm === 'play-group' ||
    norm === 'play group' ||
    norm === 'creche' ||
    norm === 'toddlers' ||
    norm === 'early years'
  );
}

/**
 * Converts any fee amount into its full-year annual equivalent
 */
export function calculateAnnualEquivalent(amount: number, frequency: FeeBillingFrequency): number {
  if (!amount || isNaN(amount) || amount < 0) return 0;
  switch (frequency) {
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'half_yearly':
      return amount * 2;
    case 'annually':
      return amount * 1;
    case 'one_time':
      return amount * 1;
    default:
      return amount;
  }
}

/**
 * Formats currency amount in Indian Rupees format (e.g. ₹12,000)
 */
export function formatFeeCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

// ============================================================================
// 3. NORMALIZER & SELF-HEALING ENGINE
// ============================================================================

export interface CanonicalFeeContext {
  classes?: AcademicClassConfig[];
  session?: string;
}

export function normalizeFeesData(
  fees?: Partial<FeesConfigurationData> | null,
  context?: CanonicalFeeContext
): FeesConfigurationData {
  const base = fees ? { ...fees } : {};

  // 1. Common Fees: Ensure baseline defaults if none exist
  let commonFees = Array.isArray(base.commonFees) ? [...base.commonFees] : [];
  if (commonFees.length === 0) {
    // If legacy classFeeStructures exists, synthesize a clean Common Tuition Fee
    const legacyTuition = base.classFeeStructures?.find((f) => f.feeType?.toLowerCase().includes('tuition'));
    const initialTuitionAmount = legacyTuition ? legacyTuition.amount : 4000;

    commonFees = [
      {
        id: 'cf-tuition',
        name: 'Tuition Fee',
        category: 'Tuition',
        amount: initialTuitionAmount,
        frequency: 'monthly',
        studentType: 'both',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        description: 'Core instructional, curriculum, and classroom academic fee.',
      },
      {
        id: 'cf-annual',
        name: 'Annual Charges',
        category: 'Annual Charges',
        amount: 12000,
        frequency: 'annually',
        studentType: 'both',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        description: 'Comprehensive annual infrastructure, library, sports, and maintenance charges.',
      },
      {
        id: 'cf-exam',
        name: 'Examination Fee',
        category: 'Examination',
        amount: 1500,
        frequency: 'annually',
        studentType: 'both',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        description: 'Term assessments, evaluation, and CBSE/Board record keeping.',
      },
    ];
  }

  // 2. New Student / Admission Fees (One-time charges)
  let newStudentFees = Array.isArray(base.newStudentFees) ? [...base.newStudentFees] : [];
  if (newStudentFees.length === 0) {
    newStudentFees = [
      {
        id: 'adm-reg',
        name: 'Registration Fee',
        category: 'Other',
        amount: 1000,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'Prospectus, entrance processing, and application registration fee.',
      },
      {
        id: 'adm-fee',
        name: 'Admission Fee',
        category: 'Other',
        amount: 10000,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: false,
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'One-time admission charge for newly enrolled students.',
      },
      {
        id: 'adm-caution',
        name: 'Caution Money',
        category: 'Other',
        amount: 3000,
        frequency: 'one_time',
        studentType: 'new_only',
        applicableClasses: 'all',
        isRefundable: true,
        refundPolicy: 'Caution Money is 100% refundable at the time of leaving the school, subject to clearance of all dues.',
        isVisibleOnWebsite: true,
        isAdmissionOnly: true,
        paymentTiming: 'at_admission',
        description: 'Refundable security deposit against school assets and library materials.',
      },
    ];
  }

  // 3. Optional Services
  let optionalServices = Array.isArray(base.optionalServices) ? [...base.optionalServices] : [];
  if (optionalServices.length === 0) {
    optionalServices = DEFAULT_OPTIONAL_SERVICES;
  } else {
    // Ensure all standard service keys are represented
    for (const def of DEFAULT_OPTIONAL_SERVICES) {
      if (!optionalServices.some((s) => s.key === def.key)) {
        optionalServices.push(def);
      }
    }
  }

  // 4. Payment Plans
  let paymentPlans = Array.isArray(base.paymentPlans) ? [...base.paymentPlans] : [];
  if (paymentPlans.length === 0) {
    paymentPlans = DEFAULT_PAYMENT_PLANS;
  }

  // 5. Scholarships & Discounts
  let scholarships: ScholarshipConfigData = base.scholarships
    ? {
        ...DEFAULT_SCHOLARSHIPS,
        ...base.scholarships,
        meritScholarship: {
          ...DEFAULT_SCHOLARSHIPS.meritScholarship,
          ...(base.scholarships.meritScholarship || {}),
          slabs:
            base.scholarships.meritScholarship?.slabs && base.scholarships.meritScholarship.slabs.length > 0
              ? base.scholarships.meritScholarship.slabs
              : DEFAULT_SCHOLARSHIPS.meritScholarship.slabs,
        },
        defenceScholarship: {
          ...DEFAULT_SCHOLARSHIPS.defenceScholarship,
          ...(base.scholarships.defenceScholarship || {}),
        },
        girlsScholarship: {
          ...DEFAULT_SCHOLARSHIPS.girlsScholarship,
          ...(base.scholarships.girlsScholarship || {}),
        },
        siblingDiscount: {
          ...DEFAULT_SCHOLARSHIPS.siblingDiscount,
          ...(base.scholarships.siblingDiscount || {}),
        },
        seatAvailability: {
          ...DEFAULT_SCHOLARSHIPS.seatAvailability,
          ...(base.scholarships.seatAvailability || {}),
        },
      }
    : DEFAULT_SCHOLARSHIPS;

  // 6. Annual Charges Inclusions
  let annualChargesInclusions = Array.isArray(base.annualChargesInclusions)
    ? base.annualChargesInclusions
    : DEFAULT_ANNUAL_CHARGES_INCLUSIONS.map((i) => i.id);

  // 7. Fee Notes
  let feeNotes = Array.isArray(base.feeNotes) ? base.feeNotes : DEFAULT_FEE_NOTES;

  return {
    ...base,
    feeCategories: Array.isArray(base.feeCategories) && base.feeCategories.length > 0 ? base.feeCategories : [...DEFAULT_FEE_CATEGORIES],
    commonFees,
    newStudentFees,
    optionalServices,
    classOverrides: base.classOverrides || {},
    paymentPlans,
    scholarships,
    annualChargesInclusions,
    annualChargesCustomText: base.annualChargesCustomText || '',
    feeNotes,
    dueDateDay: base.dueDateDay ?? 10,
    gracePeriodDays: base.gracePeriodDays ?? 5,
    lateFeeType: base.lateFeeType || 'fixed',
    lateFeeAmount: base.lateFeeAmount ?? 50,
  };
}

// ============================================================================
// 4. CLASS-WISE FEE RESOLUTION ENGINE
// ============================================================================

export interface ResolvedFeeItem {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: FeeBillingFrequency;
  status: FeeStatusKind;
  sourceText: string;
  isCustom: boolean;
  isRefundable: boolean;
  refundPolicy?: string;
  isVisibleOnWebsite: boolean;
  isOptionalService?: boolean;
  serviceKey?: string;
  annualEquivalent: number;
}

/**
 * Resolves all fee components applicable to a specific class and student type.
 * Applies inheritance from Common Fees, Admission Fees, and Optional Services,
 * followed by any class-specific overrides.
 */
export function resolveClassFees(
  className: string,
  classId: string,
  feesConfig: FeesConfigurationData,
  studentType: 'new_admission' | 'existing_student'
): ResolvedFeeItem[] {
  const isPreNursery = isPreNurseryClass(className);

  // Pre-Nursery Rule: Existing Student has zero applicable fees
  if (isPreNursery && studentType === 'existing_student') {
    return [];
  }

  const overrides = feesConfig.classOverrides?.[className] || feesConfig.classOverrides?.[classId] || {};
  const result: ResolvedFeeItem[] = [];

  // 1. One-Time New Student Fees (Only for new admissions)
  if (studentType === 'new_admission') {
    const admissionFees = feesConfig.newStudentFees || [];
    for (const fee of admissionFees) {
      if (fee.applicableClasses && fee.applicableClasses !== 'all' && !fee.applicableClasses.includes(className) && !fee.applicableClasses.includes(classId)) {
        continue;
      }
      const override = overrides[fee.id];
      const isCustom = Boolean(override?.isCustom);
      const amount = isCustom ? override.amount : fee.amount;

      result.push({
        id: fee.id,
        name: fee.name,
        category: fee.category,
        amount,
        frequency: fee.frequency,
        status: isCustom ? 'CUSTOM' : 'INHERITED',
        sourceText: isCustom ? 'Custom override' : 'From Admission Fees',
        isCustom,
        isRefundable: Boolean(fee.isRefundable),
        refundPolicy: fee.refundPolicy,
        isVisibleOnWebsite: fee.isVisibleOnWebsite ?? true,
        annualEquivalent: calculateAnnualEquivalent(amount, fee.frequency),
      });
    }
  }

  // 2. Common / Global Fees
  const commonFees = feesConfig.commonFees || [];
  for (const fee of commonFees) {
    // Check student type eligibility
    if (studentType === 'new_admission' && fee.studentType === 'existing_only') continue;
    if (studentType === 'existing_student' && fee.studentType === 'new_only') continue;

    // Check class applicability
    if (fee.applicableClasses && fee.applicableClasses !== 'all' && !fee.applicableClasses.includes(className) && !fee.applicableClasses.includes(classId)) {
      continue;
    }

    const override = overrides[fee.id];
    const isCustom = Boolean(override?.isCustom);
    const amount = isCustom ? override.amount : fee.amount;

    result.push({
      id: fee.id,
      name: fee.name,
      category: fee.category,
      amount,
      frequency: fee.frequency,
      status: isCustom ? 'CUSTOM' : 'INHERITED',
      sourceText: isCustom ? 'Custom override' : 'Inherited from Common Fees',
      isCustom,
      isRefundable: Boolean(fee.isRefundable),
      refundPolicy: fee.refundPolicy,
      isVisibleOnWebsite: fee.isVisibleOnWebsite ?? true,
      annualEquivalent: calculateAnnualEquivalent(amount, fee.frequency),
    });
  }

  // 3. Optional Services (Only if service is provided/enabled)
  const optionalServices = feesConfig.optionalServices || [];
  for (const s of optionalServices) {
    if (!s.isProvided) continue;

    // Check class applicability
    if (s.applicableClasses && s.applicableClasses !== 'all' && !s.applicableClasses?.includes(className) && !s.applicableClasses?.includes(classId)) {
      continue;
    }

    if (studentType === 'new_admission' && s.studentType === 'existing_only') continue;
    if (studentType === 'existing_student' && s.studentType === 'new_only') continue;

    const override = overrides[s.id];
    const isCustom = Boolean(override?.isCustom);
    const amount = isCustom ? override.amount : (s.feeAmount ?? 0);

    result.push({
      id: s.id,
      name: s.name,
      category: 'Optional Service',
      amount,
      frequency: s.frequency || 'monthly',
      status: s.isRequired ? (isCustom ? 'CUSTOM' : 'INHERITED') : 'OPTIONAL',
      sourceText: s.isRequired ? 'Mandatory service' : 'Optional Service',
      isCustom,
      isRefundable: false,
      isVisibleOnWebsite: s.isVisibleOnWebsite ?? true,
      isOptionalService: true,
      serviceKey: s.key,
      annualEquivalent: calculateAnnualEquivalent(amount, s.frequency || 'monthly'),
    });
  }

  return result;
}

// ============================================================================
// 5. LIVE FEE SIMULATOR & CALCULATION ENGINE
// ============================================================================

export interface FeeCalculationParams {
  className: string;
  classId?: string;
  studentType: 'new_admission' | 'existing_student';
  paymentPlanFrequency?: PaymentPlanConfig['frequency'];
  scholarshipType?: 'none' | 'merit' | 'defence' | 'girls' | 'sibling' | 'custom';
  meritScorePercentage?: number;
  siblingIndex?: 2 | 3;
  feesConfig: FeesConfigurationData;
}

export interface FeeCalculationResult {
  className: string;
  studentType: 'new_admission' | 'existing_student';
  isPreNurseryExempt: boolean;
  tuitionMonthly: number;
  tuitionAnnual: number;
  annualCharges: number;
  otherRecurringAnnual: number;
  oneTimeChargesTotal: number;
  cautionMoneyRefundable: number;
  
  // Discounts
  yearlyPaymentDiscountPercentage: number;
  yearlyPaymentDiscountAmount: number;
  scholarshipDiscountPercentage: number;
  scholarshipDiscountAmount: number;
  scholarshipName: string;
  
  // Totals
  grossFirstYearPayable: number;
  totalDiscounts: number;
  netEstimatedPayable: number;

  // Breakdown items for live preview
  breakdownItems: Array<{
    label: string;
    amount: number;
    isDiscount?: boolean;
    isRefundable?: boolean;
    note?: string;
  }>;
}

export function calculateFeeBreakdown(params: FeeCalculationParams): FeeCalculationResult {
  const {
    className,
    classId = className,
    studentType,
    paymentPlanFrequency = 'monthly',
    scholarshipType = 'none',
    meritScorePercentage,
    siblingIndex = 2,
    feesConfig,
  } = params;

  const isPreNursery = isPreNurseryClass(className);

  if (isPreNursery && studentType === 'existing_student') {
    return {
      className,
      studentType,
      isPreNurseryExempt: true,
      tuitionMonthly: 0,
      tuitionAnnual: 0,
      annualCharges: 0,
      otherRecurringAnnual: 0,
      oneTimeChargesTotal: 0,
      cautionMoneyRefundable: 0,
      yearlyPaymentDiscountPercentage: 0,
      yearlyPaymentDiscountAmount: 0,
      scholarshipDiscountPercentage: 0,
      scholarshipDiscountAmount: 0,
      scholarshipName: 'N/A',
      grossFirstYearPayable: 0,
      totalDiscounts: 0,
      netEstimatedPayable: 0,
      breakdownItems: [],
    };
  }

  const resolved = resolveClassFees(className, classId, feesConfig, studentType);

  let tuitionMonthly = 0;
  let tuitionAnnual = 0;
  let annualCharges = 0;
  let otherRecurringAnnual = 0;
  let oneTimeChargesTotal = 0;
  let cautionMoneyRefundable = 0;

  const breakdownItems: FeeCalculationResult['breakdownItems'] = [];

  for (const item of resolved) {
    if (item.isOptionalService && item.status === 'OPTIONAL') {
      continue;
    }

    if (item.category === 'Tuition') {
      tuitionAnnual += item.annualEquivalent;
      if (item.frequency === 'monthly') tuitionMonthly += item.amount;
      else tuitionMonthly += Math.round(item.annualEquivalent / 12);
      breakdownItems.push({
        label: `${item.name} (${formatFeeCurrency(item.amount)}/${item.frequency})`,
        amount: item.annualEquivalent,
        note: 'Annual equivalent',
      });
    } else if (item.category === 'Annual Charges') {
      annualCharges += item.annualEquivalent;
      breakdownItems.push({
        label: `${item.name} (${formatFeeCurrency(item.amount)}/${item.frequency})`,
        amount: item.annualEquivalent,
      });
    } else if (item.frequency === 'one_time') {
      oneTimeChargesTotal += item.amount;
      if (item.isRefundable) {
        cautionMoneyRefundable += item.amount;
      }
      breakdownItems.push({
        label: `${item.name}${item.isRefundable ? ' (Refundable)' : ''}`,
        amount: item.amount,
        isRefundable: item.isRefundable,
        note: 'One-time fee',
      });
    } else {
      otherRecurringAnnual += item.annualEquivalent;
      breakdownItems.push({
        label: `${item.name} (${formatFeeCurrency(item.amount)}/${item.frequency})`,
        amount: item.annualEquivalent,
      });
    }
  }

  // 1. Payment Plan Discount Calculation (e.g. 5% Yearly Discount)
  let yearlyPaymentDiscountPercentage = 0;
  let yearlyPaymentDiscountAmount = 0;

  if (paymentPlanFrequency === 'yearly') {
    const yearlyPlan = feesConfig.paymentPlans?.find((p) => p.frequency === 'yearly' && p.isEnabled);
    if (yearlyPlan && yearlyPlan.yearlyDiscountPercentage && yearlyPlan.yearlyDiscountPercentage > 0) {
      yearlyPaymentDiscountPercentage = Math.min(100, yearlyPlan.yearlyDiscountPercentage);
      const baseForYearlyDiscount =
        yearlyPlan.discountAppliesTo === 'all_academic'
          ? tuitionAnnual + annualCharges + otherRecurringAnnual
          : tuitionAnnual;

      yearlyPaymentDiscountAmount = Math.round((baseForYearlyDiscount * yearlyPaymentDiscountPercentage) / 100);
    }
  }

  // Net Tuition after yearly discount
  const netTuition = Math.max(0, tuitionAnnual - yearlyPaymentDiscountAmount);

  // 2. Scholarship Discount Calculation
  let scholarshipDiscountPercentage = 0;
  let scholarshipDiscountAmount = 0;
  let scholarshipName = 'None';

  const scholConfig = feesConfig.scholarships || DEFAULT_SCHOLARSHIPS;

  if (scholarshipType === 'merit' && scholConfig.meritScholarship?.isEnabled) {
    const score = meritScorePercentage ?? 85;
    const slabs = scholConfig.meritScholarship.slabs || [];
    const matchedSlab = slabs.find((s) => score >= s.minPercentage && score <= s.maxPercentage);
    if (matchedSlab && matchedSlab.discountPercentage > 0) {
      scholarshipDiscountPercentage = matchedSlab.discountPercentage;
      scholarshipName = `Merit Scholarship (${score}%)`;
      const baseAmount = matchedSlab.appliesTo === 'total_fee' ? tuitionAnnual + annualCharges : netTuition;
      scholarshipDiscountAmount = Math.round((baseAmount * scholarshipDiscountPercentage) / 100);
    }
  } else if (scholarshipType === 'defence' && scholConfig.defenceScholarship?.isEnabled) {
    scholarshipDiscountPercentage = scholConfig.defenceScholarship.discountPercentage || 5;
    scholarshipName = scholConfig.defenceScholarship.name || 'Wards of Defence Personnel';
    const baseAmount = scholConfig.defenceScholarship.appliesTo === 'total_fee' ? tuitionAnnual + annualCharges : netTuition;
    scholarshipDiscountAmount = Math.round((baseAmount * scholarshipDiscountPercentage) / 100);
  } else if (scholarshipType === 'girls' && scholConfig.girlsScholarship?.isEnabled) {
    scholarshipDiscountPercentage = scholConfig.girlsScholarship.discountPercentage || 10;
    scholarshipName = 'Girls Scholarship';
    const baseAmount = scholConfig.girlsScholarship.appliesTo === 'total_fee' ? tuitionAnnual + annualCharges : netTuition;
    scholarshipDiscountAmount = Math.round((baseAmount * scholarshipDiscountPercentage) / 100);
  } else if (scholarshipType === 'sibling' && scholConfig.siblingDiscount?.isEnabled) {
    scholarshipDiscountPercentage =
      siblingIndex === 3
        ? scholConfig.siblingDiscount.thirdChildDiscount || 15
        : scholConfig.siblingDiscount.secondChildDiscount || 10;
    scholarshipName = `Sibling Discount (${siblingIndex === 3 ? '3rd' : '2nd'} Child)`;
    scholarshipDiscountAmount = Math.round((netTuition * scholarshipDiscountPercentage) / 100);
  }

  // Deduct discounts from items
  if (yearlyPaymentDiscountAmount > 0) {
    breakdownItems.push({
      label: `Yearly Payment Discount (${yearlyPaymentDiscountPercentage}%)`,
      amount: yearlyPaymentDiscountAmount,
      isDiscount: true,
      note: 'Applied to tuition',
    });
  }

  if (scholarshipDiscountAmount > 0) {
    breakdownItems.push({
      label: `${scholarshipName} (-${scholarshipDiscountPercentage}%)`,
      amount: scholarshipDiscountAmount,
      isDiscount: true,
      note: 'Calculated per policy',
    });
  }

  const grossFirstYearPayable = tuitionAnnual + annualCharges + otherRecurringAnnual + oneTimeChargesTotal;
  const totalDiscounts = yearlyPaymentDiscountAmount + scholarshipDiscountAmount;
  const netEstimatedPayable = Math.max(0, grossFirstYearPayable - totalDiscounts);

  return {
    className,
    studentType,
    isPreNurseryExempt: false,
    tuitionMonthly,
    tuitionAnnual,
    annualCharges,
    otherRecurringAnnual,
    oneTimeChargesTotal,
    cautionMoneyRefundable,
    yearlyPaymentDiscountPercentage,
    yearlyPaymentDiscountAmount,
    scholarshipDiscountPercentage,
    scholarshipDiscountAmount,
    scholarshipName,
    grossFirstYearPayable,
    totalDiscounts,
    netEstimatedPayable,
    breakdownItems,
  };
}

// ============================================================================
// 6. NATURAL LANGUAGE & PUBLIC SUMMARY GENERATORS
// ============================================================================

/**
 * Generates an authoritative sentence summarizing what Annual Charges include
 * e.g. "Annual Charges include Examination, Library, Insurance, Student Welfare, Sports, Online Student Information and PDP."
 */
export function generateAnnualChargesSummary(
  inclusionIds?: string[],
  customText?: string
): string {
  const ids = Array.isArray(inclusionIds) ? inclusionIds : DEFAULT_ANNUAL_CHARGES_INCLUSIONS.map((i) => i.id);
  const matchedLabels: string[] = DEFAULT_ANNUAL_CHARGES_INCLUSIONS.filter(
    (item) => ids.includes(item.id) || ids.includes(item.label)
  ).map((i) => String(i.label));

  // Also include any custom items passed in ids directly
  for (const id of ids) {
    if (!DEFAULT_ANNUAL_CHARGES_INCLUSIONS.some((item) => item.id === id || item.label === id)) {
      matchedLabels.push(id);
    }
  }

  if (customText && customText.trim()) {
    matchedLabels.push(customText.trim());
  }

  if (matchedLabels.length === 0) {
    return 'Annual Charges cover standard institutional maintenance and student support facilities.';
  }

  if (matchedLabels.length === 1) {
    return `Annual Charges include ${matchedLabels[0]}.`;
  }

  const allExceptLast = matchedLabels.slice(0, -1).join(', ');
  const last = matchedLabels[matchedLabels.length - 1];
  return `Annual Charges include ${allExceptLast} and ${last}.`;
}

/**
 * Generates structured "What's Included" and "What's Not Included" lists
 * based on active fees and optional service configurations
 */
export function generateInclusionsExclusions(feesConfig: FeesConfigurationData): {
  included: string[];
  notIncluded: string[];
} {
  const ids = feesConfig.annualChargesInclusions || DEFAULT_ANNUAL_CHARGES_INCLUSIONS.map((i) => i.id);
  const included: string[] = DEFAULT_ANNUAL_CHARGES_INCLUSIONS.filter(
    (item) => ids.some((id) => id.toLowerCase() === item.id.toLowerCase() || id.toLowerCase() === item.label.toLowerCase())
  ).map((i) => String(i.label));

  for (const id of ids) {
    if (!DEFAULT_ANNUAL_CHARGES_INCLUSIONS.some((item) => id.toLowerCase() === item.id.toLowerCase() || id.toLowerCase() === item.label.toLowerCase())) {
      included.push(id);
    }
  }

  if (feesConfig.annualChargesCustomText?.trim()) {
    included.push(feesConfig.annualChargesCustomText.trim());
  }

  // Not included list derived from optional services that are charged separately
  const notIncluded: string[] = [];
  const services = feesConfig.optionalServices || DEFAULT_OPTIONAL_SERVICES;

  for (const s of services) {
    if (s.isProvided && !s.isRequired) {
      notIncluded.push(s.name);
    }
  }

  return {
    included,
    notIncluded: notIncluded.length > 0 ? notIncluded : ['Transport', 'Uniform', 'Books', 'Meals', 'Excursions'],
  };
}

// ============================================================================
// 7. CENTRALIZED VALIDATION & READINESS ENGINE
// ============================================================================

export interface FeeValidationResult {
  isValid: boolean;
  blockers: string[];
  warnings: string[];
  percentage: number;
}

export function validateFeeStructure(
  feesConfig?: Partial<FeesConfigurationData> | null,
  context?: CanonicalFeeContext
): FeeValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!feesConfig) {
    return {
      isValid: false,
      blockers: ['Fee Structure has not been configured yet.'],
      warnings: [],
      percentage: 0,
    };
  }

  const commonFees = feesConfig.commonFees || [];
  const newStudentFees = feesConfig.newStudentFees || [];
  const optionalServices = feesConfig.optionalServices || [];
  const paymentPlans = feesConfig.paymentPlans || [];
  const scholarships = feesConfig.scholarships || DEFAULT_SCHOLARSHIPS;

  // 1. Check for negative fee amounts (Strict Blocker)
  for (const f of commonFees) {
    if (typeof f.amount === 'number' && f.amount < 0) {
      blockers.push(`Common Fee "${f.name}" cannot have a negative amount.`);
    }
  }
  for (const f of newStudentFees) {
    if (typeof f.amount === 'number' && f.amount < 0) {
      blockers.push(`Admission Fee "${f.name}" cannot have a negative amount.`);
    }
  }

  // 2. Check for Tuition Fee (Strict Blocker)
  const hasTuition = commonFees.some((f) => f.category === 'Tuition' && f.amount > 0);
  if (!hasTuition) {
    blockers.push('Tuition Fee: At least one common Tuition Fee must be configured.');
  }

  // 3. Payment Plan Discounts (Strict Blocker if > 100%)
  for (const plan of paymentPlans) {
    if (plan.yearlyDiscountPercentage !== undefined && (plan.yearlyDiscountPercentage < 0 || plan.yearlyDiscountPercentage > 100)) {
      blockers.push(`Payment Plan: Yearly payment discount cannot exceed 100% (found ${plan.yearlyDiscountPercentage}%).`);
    }
  }

  // 4. Scholarship Validation
  if (scholarships.meritScholarship?.isEnabled) {
    const slabs = scholarships.meritScholarship.slabs || [];
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      if (slab.minPercentage > slab.maxPercentage) {
        blockers.push(`Merit Scholarship: Minimum percentage (${slab.minPercentage}%) cannot exceed maximum percentage (${slab.maxPercentage}%).`);
      }
      if (slab.discountPercentage < 0 || slab.discountPercentage > 100) {
        blockers.push(`Merit Scholarship: Discount percentage must be between 0% and 100% (found ${slab.discountPercentage}%).`);
      }
    }
  }

  if (scholarships.defenceScholarship?.isEnabled) {
    const dPct = scholarships.defenceScholarship.discountPercentage;
    if (dPct < 0 || dPct > 100) {
      blockers.push(`Defence Scholarship: Discount percentage must be between 0% and 100% (found ${dPct}%).`);
    }
  }

  if (scholarships.girlsScholarship?.isEnabled) {
    const gPct = scholarships.girlsScholarship.discountPercentage;
    if (gPct < 0 || gPct > 100) {
      blockers.push(`Girls Scholarship: Discount percentage must be between 0% and 100% (found ${gPct}%).`);
    }
  }

  // 5. Warnings (Non-blocking recommendations)
  for (const s of optionalServices) {
    if (s.isProvided && (!s.feeAmount || s.feeAmount <= 0) && s.pricingModel !== 'route_based') {
      warnings.push(`Optional Service "${s.name}" is enabled but no fee amount is configured.`);
    }
  }

  const publishedNotes = (feesConfig.feeNotes || []).filter((n) => n.isPublished);
  if (publishedNotes.length === 0) {
    warnings.push('Fee Policies: No fee notes are currently marked for publication.');
  }

  // Scoring calculation
  let score = 0;
  const maxScore = 5;
  if (hasTuition) score++;
  if (newStudentFees.length > 0) score++;
  if (commonFees.some((f) => f.category === 'Annual Charges')) score++;
  if (paymentPlans.length > 0) score++;
  if (scholarships) score++;

  const percentage = Math.round((score / maxScore) * 100);

  return {
    isValid: blockers.length === 0,
    blockers,
    warnings,
    percentage,
  };
}
