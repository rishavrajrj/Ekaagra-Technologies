/**
 * Centralized School Solutions & Pricing Configuration
 * ----------------------------------------------------
 * Single source of truth for all school product tiers, student-based
 * ERP capacity brackets, optional add-ons, domain allowances, and calculation logic.
 */

export type SchoolProductId =
  | 'school-website'
  | 'school-website-cms'
  | 'school-erp'
  | 'school-complete';

export type SchoolStudentTierId =
  | 'up-to-300'
  | '301-700'
  | '701-1500'
  | '1501-3000'
  | '3000-plus';

export interface SchoolPlanConfig {
  id: SchoolProductId;
  name: string;
  tagline: string;
  badge?: string;
  highlighted?: boolean;
  baseYearOnePrice?: number;
  baseRenewalPrice?: number;
  startingPriceDisplay: string;
  renewalPriceDisplay?: string;
  domainAllowance: number; // Annual allowance in INR
  includedPages?: number;
  isStudentBased: boolean;
  bestFor: string;
  features: string[];
  ctaText: string;
}

export interface SchoolStudentTierConfig {
  id: SchoolStudentTierId;
  label: string;
  studentRangeText: string;
  minStudents: number;
  maxStudents: number | null;
  erpYearOnePrice: number | null;
  erpRenewalPrice: number | null;
  completeYearOnePrice: number | null;
  completeRenewalPrice: number | null;
  isCustom: boolean;
}

export interface SchoolAddonConfig {
  id: string;
  name: string;
  category: 'core' | 'communication' | 'mobile' | 'operations' | 'support';
  description: string;
  priceNote: string;
  isCustomQuote?: boolean;
  thirdPartyUsageNote?: string;
}

// ─── 1. Primary School Products ───────────────────────────────────────────────

export const schoolPlans: SchoolPlanConfig[] = [
  {
    id: 'school-website',
    name: 'School Website',
    tagline: 'Professional modern web presence designed for schools and institutes.',
    baseYearOnePrice: 9999,
    baseRenewalPrice: 6999,
    startingPriceDisplay: '₹9,999',
    renewalPriceDisplay: '₹6,999/year',
    domainAllowance: 300,
    includedPages: 10,
    isStudentBased: false,
    bestFor: 'Schools that need a professional, credible online presence with zero administrative complexity.',
    features: [
      'Professional school website (up to 10 standard pages)',
      'Responsive, mobile-first design for smartphones & tablets',
      'School branding, logo integration & custom color palette',
      'Core institutional pages: About, Principal Message, Academics, Facilities',
      'Admission enquiry form with direct email & phone capture',
      'Photo gallery, activities & campus life showcase',
      'Notices, circulars & announcements board',
      'WhatsApp quick-contact & direct phone dial integration',
      'Fast high-performance hosting & SSL security certificate',
      'Google Search baseline SEO & clean metadata',
      'Year-round technical maintenance & uptime monitoring',
    ],
    ctaText: 'Choose School Website',
  },
  {
    id: 'school-website-cms',
    name: 'School Website + CMS',
    tagline: 'Empower your school staff to update notices, gallery, and pages anytime.',
    baseYearOnePrice: 16999,
    baseRenewalPrice: 10999,
    startingPriceDisplay: '₹16,999',
    renewalPriceDisplay: '₹10,999/year',
    domainAllowance: 500,
    includedPages: 10,
    isStudentBased: false,
    bestFor: 'Schools that want internal staff to manage public website content independently without coding.',
    features: [
      'Everything in School Website (up to 10 standard pages)',
      'Dedicated CMS Admin Panel for authorized school staff',
      'Publish & unpublish public notices, circulars, and announcements',
      'Manage school events calendar & holiday schedules',
      'Upload & organize campus photo galleries & event albums',
      'Faculty & staff directory management',
      'Downloadable forms manager (prospectus, syllabi, holiday homework)',
      'Direct admission enquiries viewer & lead management dashboard',
      'Role-based staff logins with secure access control',
      'Clean intuitive dashboard designed for non-technical educators',
      'Comprehensive staff training & documentation',
    ],
    ctaText: 'Choose Website + CMS',
  },
  {
    id: 'school-erp',
    name: 'School ERP',
    tagline: 'Complete digital management platform built specifically for school operations.',
    startingPriceDisplay: 'Starting at ₹24,999',
    renewalPriceDisplay: 'Based on student strength',
    domainAllowance: 500,
    isStudentBased: true,
    bestFor: 'Schools, academies, and institutes seeking to automate academic administration and student records.',
    features: [
      'Student Information System & complete academic history',
      'New admission workflow & student enrollment lifecycle',
      'Academic session management, classes, sections & roll numbers',
      'Teacher & staff directory with qualification tracking',
      'Daily student & staff attendance tracking with summary reports',
      'Timetable & class schedule management',
      'Examination configuration, marks entry & grading scales',
      'CBSE/State-board compliant report cards generation & publishing',
      'Automated student promotion to next academic session',
      'Transfer Certificate (TC), Bonafide & Character Certificate generator',
      'Student & staff ID card generation with photo & barcode support',
      'Parent/Guardian database with emergency contact links',
      'Internal notices & circulars distribution engine',
      'Comprehensive administrative reports & Excel/PDF data export',
      'Role-based access for Principal, Admin, Teacher, and Clerk',
    ],
    ctaText: 'Choose School ERP',
  },
  {
    id: 'school-complete',
    name: 'Website + CMS + ERP',
    tagline: 'The complete all-in-one digital school platform connecting your public presence and campus operations.',
    badge: 'RECOMMENDED',
    highlighted: true,
    startingPriceDisplay: 'Starting at ₹39,999',
    renewalPriceDisplay: 'Starting at ₹24,999/year',
    domainAllowance: 750,
    includedPages: 10,
    isStudentBased: true,
    bestFor: 'Schools that want a single, cohesive technology partner for both their public brand and internal management.',
    features: [
      'Professional School Website with modern custom UI/UX',
      'Staff CMS Admin Panel for public notices, news, and galleries',
      'Full-featured School ERP platform scaled to your student strength',
      'Seamless synchronization between public admission inquiries and ERP',
      'Custom institutional branding across public web and ERP portals',
      'Fast high-speed cloud hosting, SSL, and daily data backups',
      'End-to-end deployment, initial student data import & setup',
      'Administrator & teacher onboarding training sessions',
      'Priority technical support, regular software updates & maintenance',
      'Annual renewal covers hosting, security patches, ERP access & support',
    ],
    ctaText: 'Choose Complete Platform',
  },
];

// ─── 2. Student Capacity Brackets (ERP & Complete Platform) ───────────────────

export const schoolStudentTiers: SchoolStudentTierConfig[] = [
  {
    id: 'up-to-300',
    label: 'Up to 300 Students',
    studentRangeText: '1 – 300 students',
    minStudents: 1,
    maxStudents: 300,
    erpYearOnePrice: 24999,
    erpRenewalPrice: 16999,
    completeYearOnePrice: 39999,
    completeRenewalPrice: 24999,
    isCustom: false,
  },
  {
    id: '301-700',
    label: '301 – 700 Students',
    studentRangeText: '301 – 700 students',
    minStudents: 301,
    maxStudents: 700,
    erpYearOnePrice: 34999,
    erpRenewalPrice: 24999,
    completeYearOnePrice: 54999,
    completeRenewalPrice: 34999,
    isCustom: false,
  },
  {
    id: '701-1500',
    label: '701 – 1,500 Students',
    studentRangeText: '701 – 1,500 students',
    minStudents: 701,
    maxStudents: 1500,
    erpYearOnePrice: 49999,
    erpRenewalPrice: 34999,
    completeYearOnePrice: 74999,
    completeRenewalPrice: 49999,
    isCustom: false,
  },
  {
    id: '1501-3000',
    label: '1,501 – 3,000 Students',
    studentRangeText: '1,501 – 3,000 students',
    minStudents: 1501,
    maxStudents: 3000,
    erpYearOnePrice: 69999,
    erpRenewalPrice: 49999,
    completeYearOnePrice: 99999,
    completeRenewalPrice: 69999,
    isCustom: false,
  },
  {
    id: '3000-plus',
    label: '3,000+ Students',
    studentRangeText: '3,000+ students (Enterprise / Multi-Branch)',
    minStudents: 3001,
    maxStudents: null,
    erpYearOnePrice: null,
    erpRenewalPrice: null,
    completeYearOnePrice: null,
    completeRenewalPrice: null,
    isCustom: true,
  },
];

// ─── 3. School Add-ons & Optional Modules ────────────────────────────────────

export const schoolAddons: SchoolAddonConfig[] = [
  {
    id: 'online-fee-management',
    name: 'Online Fee Management & Receipts',
    category: 'core',
    description: 'Fee heads configuration, concessions, dues tracking, automated fine calculations, and printed GST/school receipts.',
    priceNote: 'Included in ERP setup consultation',
  },
  {
    id: 'online-fee-payment',
    name: 'Payment Gateway Integration',
    category: 'core',
    description: 'Allow parents to pay fees online via UPI, NetBanking, Debit/Credit cards with instant receipt generation.',
    priceNote: 'Integration included (Gateway transaction fees apply per provider)',
  },
  {
    id: 'parent-mobile-app',
    name: 'Parent Mobile App (Android)',
    category: 'mobile',
    description: 'Dedicated branded mobile application for parents to view attendance, fee dues, report cards, and notices.',
    priceNote: 'Custom quote based on Google Play Store publishing requirements',
    isCustomQuote: true,
  },
  {
    id: 'teacher-admin-app',
    name: 'Teacher & Admin Mobile App',
    category: 'mobile',
    description: 'Fast mobile app for teachers to mark daily attendance, input exam marks, and broadcast class announcements.',
    priceNote: 'Custom quote / Companion package',
    isCustomQuote: true,
  },
  {
    id: 'whatsapp-integration',
    name: 'Official WhatsApp Notification API',
    category: 'communication',
    description: 'Automated WhatsApp alerts for daily absence, fee dues reminders, holiday announcements, and exam schedules.',
    priceNote: 'Setup included + Meta WhatsApp API usage charges at cost',
    thirdPartyUsageNote: 'Meta business verification & template charges apply',
  },
  {
    id: 'sms-integration',
    name: 'DLT-Approved SMS Gateway Integration',
    category: 'communication',
    description: 'TRAI/DLT compliant bulk SMS gateway for attendance alerts, urgent school closures, and OTP authentication.',
    priceNote: 'Setup included + SMS credits at actual provider rates',
    thirdPartyUsageNote: 'TRAI DLT registration required',
  },
  {
    id: 'transport-management',
    name: 'Transport & Bus Route Management',
    category: 'operations',
    description: 'Bus routes, pickup/drop stops, vehicle documentation, driver allocation, and transport fee scheduling.',
    priceNote: 'Optional operational add-on',
  },
  {
    id: 'library-management',
    name: 'Library Book & Issue Management',
    category: 'operations',
    description: 'Book cataloging, barcode scanning, student/teacher issue-return tracking, overdue fine calculation.',
    priceNote: 'Optional academic add-on',
  },
  {
    id: 'hostel-management',
    name: 'Hostel & Boarding Management',
    category: 'operations',
    description: 'Hostel rooms, bed allocation, warden records, meal management, and boarding fee accounting.',
    priceNote: 'Optional add-on for residential schools',
  },
  {
    id: 'payroll-hr',
    name: 'Staff Payroll & HR Management',
    category: 'operations',
    description: 'Staff attendance linkage, salary slip generation, deductions, leaves tracker, and advance loans.',
    priceNote: 'Optional HR add-on',
  },
  {
    id: 'inventory-management',
    name: 'Inventory & School Store',
    category: 'operations',
    description: 'Uniforms, books, stationery inventory, vendor purchase orders, and distribution tracking.',
    priceNote: 'Optional store add-on',
  },
  {
    id: 'biometric-integration',
    name: 'Biometric Attendance Device Sync',
    category: 'operations',
    description: 'Sync physical fingerprint or face-recognition attendance machines directly with ERP database.',
    priceNote: 'Hardware-dependent integration',
    isCustomQuote: true,
  },
  {
    id: 'advanced-reports',
    name: 'Advanced CBSE / Government Reports',
    category: 'support',
    description: 'Customized OASIS, U-DISE+ data exports, caste-wise student strength, and statutory audit reports.',
    priceNote: 'Custom export formatting',
  },
  {
    id: 'data-migration',
    name: 'Legacy Student Data Migration',
    category: 'support',
    description: 'Extraction, cleanup, and secure migration of existing student, parent, and fee records from Excel or older software.',
    priceNote: 'Comprehensive onboarding service',
  },
  {
    id: 'custom-module',
    name: 'Custom Tailored School Module',
    category: 'support',
    description: 'Specific unique workflows, custom evaluation systems, or institutional integrations.',
    priceNote: 'Scoped individually upon request',
    isCustomQuote: true,
  },
];

// ─── 4. Domain Allowances for School Plans ────────────────────────────────────

export const schoolDomainAllowances: Record<SchoolProductId, number> = {
  'school-website': 300,
  'school-website-cms': 500,
  'school-erp': 500,
  'school-complete': 750,
};

// ─── 5. Deterministic Price Calculation Helper ────────────────────────────────

export interface SchoolPriceCalculation {
  productId: SchoolProductId;
  productName: string;
  studentTierId: SchoolStudentTierId | null;
  studentTierLabel: string | null;
  isStudentBased: boolean;
  isCustomQuote: boolean;
  yearOnePlatformPrice: number | null;
  renewalPlatformPrice: number | null;
  annualDomainAllowance: number;
  termDomainAllowance: number;
  domainCostINR: number;
  domainUpgradeAmount: number;
  isDomainPriceVerified: boolean;
  isDomainPricePendingVerification: boolean;
  selectedAddonsCount: number;
  selectedAddonNames: string[];
  totalEstimatedYearOne: number | null;
  totalRenewalFrom: number | null;
}

export function calculateSchoolPrice(params: {
  productId: SchoolProductId;
  studentTierId?: SchoolStudentTierId | null;
  selectedAddonIds?: string[];
  domainQuote?: {
    estimatedINR?: number;
    period?: number;
    annualAllowance?: number;
    isPriceVerified?: boolean;
    domainStatus?: string;
  } | null;
}): SchoolPriceCalculation {
  const plan = schoolPlans.find((p) => p.id === params.productId) || schoolPlans[0];
  const annualAllowance = schoolDomainAllowances[plan.id] ?? 300;

  let yearOnePlatform: number | null = null;
  let renewalPlatform: number | null = null;
  let isCustom = false;
  let tierLabel: string | null = null;

  if (plan.isStudentBased) {
    const tierId = params.studentTierId || 'up-to-300';
    const tier = schoolStudentTiers.find((t) => t.id === tierId) || schoolStudentTiers[0];
    tierLabel = tier.label;

    if (tier.isCustom) {
      isCustom = true;
      yearOnePlatform = null;
      renewalPlatform = null;
    } else if (plan.id === 'school-erp') {
      yearOnePlatform = tier.erpYearOnePrice;
      renewalPlatform = tier.erpRenewalPrice;
    } else if (plan.id === 'school-complete') {
      yearOnePlatform = tier.completeYearOnePrice;
      renewalPlatform = tier.completeRenewalPrice;
    }
  } else {
    yearOnePlatform = plan.baseYearOnePrice ?? 0;
    renewalPlatform = plan.baseRenewalPrice ?? 0;
  }

  // Domain Calculation
  const hasDomain = Boolean(params.domainQuote);
  const isVerified = Boolean(params.domainQuote?.isPriceVerified);
  const period = params.domainQuote?.period || 1;
  const termAllowance = annualAllowance * period;
  const rawDomainCost = params.domainQuote?.estimatedINR;
  const domainCostINR = isVerified && typeof rawDomainCost === 'number' && rawDomainCost > 0 ? rawDomainCost : 0;
  
  // Only add domain excess charges when the domain price is actually verified
  const domainUpgrade = isVerified ? Math.max(0, domainCostINR - termAllowance) : 0;
  const isPendingVerification = hasDomain && !isVerified && params.domainQuote?.domainStatus !== 'not_selected';

  // Add-ons resolution
  const selectedAddonIds = params.selectedAddonIds || [];
  const selectedAddons = schoolAddons.filter((a) => selectedAddonIds.includes(a.id));
  const selectedAddonNames = selectedAddons.map((a) => a.name);

  // Totals
  const totalYearOne =
    isCustom || yearOnePlatform === null
      ? null
      : yearOnePlatform + domainUpgrade;

  const totalRenewal =
    isCustom || renewalPlatform === null
      ? null
      : renewalPlatform;

  return {
    productId: plan.id,
    productName: plan.name,
    studentTierId: plan.isStudentBased ? params.studentTierId || 'up-to-300' : null,
    studentTierLabel: tierLabel,
    isStudentBased: plan.isStudentBased,
    isCustomQuote: isCustom,
    yearOnePlatformPrice: yearOnePlatform,
    renewalPlatformPrice: renewalPlatform,
    annualDomainAllowance: annualAllowance,
    termDomainAllowance: termAllowance,
    domainCostINR,
    domainUpgradeAmount: domainUpgrade,
    isDomainPriceVerified: isVerified,
    isDomainPricePendingVerification: isPendingVerification,
    selectedAddonsCount: selectedAddonNames.length,
    selectedAddonNames,
    totalEstimatedYearOne: totalYearOne,
    totalRenewalFrom: totalRenewal,
  };
}
