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
  category: string; // PUBLIC PORTAL | STAFF PUBLISHING | 6-ROLE SYSTEM | UNIFIED STACK
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
  importantNote?: string;
  coreCapabilities: string[]; // 5-7 most important capabilities for product cards
  features: string[];
  primaryCta: {
    label: string;
    href: string;
    isExternal?: boolean;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
  demoTabId: 'website' | 'cms' | 'erp' | 'unified';
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
  category: 'core' | 'communication' | 'mobile' | 'operations' | 'support' | 'finance' | 'campus';
  categoryLabel?: string;
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
    category: 'PUBLIC PORTAL',
    tagline: 'Professional modern web presence designed for schools and institutes.',
    baseYearOnePrice: 9999,
    baseRenewalPrice: 6999,
    startingPriceDisplay: '₹9,999',
    renewalPriceDisplay: '₹6,999/year',
    domainAllowance: 300,
    includedPages: 10,
    isStudentBased: false,
    bestFor: 'Professional public website to build institutional credibility, showcase your campus, and capture admission enquiries.',
    coreCapabilities: [
      'Professional school website, up to 10 standard pages',
      'Responsive, mobile-first design for smartphones and tablets',
      'School branding, logo integration and custom color palette',
      'Core institutional pages: About, Principal Message, Academics and Facilities',
      'Admission enquiry form with direct email and phone capture',
      'Photo gallery, activities and campus-life showcase',
      'Notices, circulars and announcements board',
    ],
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
    primaryCta: {
      label: 'Inspect Live Website',
      href: 'https://roshani-public-school.vercel.app/',
      isExternal: true,
    },
    secondaryCta: {
      label: 'Preview Demo',
      href: '#visual-demo',
    },
    demoTabId: 'website',
    ctaText: 'Choose School Website',
  },
  {
    id: 'school-website-cms',
    name: 'School Website + CMS',
    category: 'STAFF PUBLISHING',
    tagline: 'Empower your school staff to update notices, gallery, and pages anytime.',
    baseYearOnePrice: 16999,
    baseRenewalPrice: 10999,
    startingPriceDisplay: '₹16,999',
    renewalPriceDisplay: '₹10,999/year',
    domainAllowance: 500,
    includedPages: 10,
    isStudentBased: false,
    bestFor: 'Public website plus a staff portal to easily publish notices, circulars, events, and photo galleries without any coding.',
    coreCapabilities: [
      'Dedicated CMS admin panel for authorized school staff',
      'Publish and unpublish public notices, circulars and announcements',
      'Manage school events calendar and holiday schedules',
      'Upload and organize campus photo galleries and event albums',
      'Faculty and staff directory management',
      'Downloadable forms manager for prospectus, syllabi, holiday homework, etc.',
    ],
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
    primaryCta: {
      label: 'Try CMS Demo',
      href: '#visual-demo',
    },
    secondaryCta: {
      label: 'Preview Demo',
      href: '#visual-demo',
    },
    demoTabId: 'cms',
    ctaText: 'Choose Website + CMS',
  },
  {
    id: 'school-erp',
    name: 'School ERP',
    category: '6-ROLE SYSTEM',
    tagline: 'Complete digital management platform built specifically for school operations.',
    startingPriceDisplay: 'Starting at ₹24,999',
    renewalPriceDisplay: 'Based on student strength',
    domainAllowance: 500,
    isStudentBased: true,
    bestFor: 'Comprehensive campus management for student records, attendance, fees, exams, and report cards—scaled to student strength.',
    coreCapabilities: [
      'Student Information System and complete academic history',
      'New admission workflow and student enrollment lifecycle',
      'Academic session management, classes, sections and roll numbers',
      'Teacher and staff directory with qualification tracking',
      'Daily student and staff attendance tracking with summary reports',
      'Timetable and class schedule management',
      'Examination configuration, marks entry and grading scales',
      'Fee collection and receipts',
      'Parent/student access',
      'Role-based administration',
    ],
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
    primaryCta: {
      label: 'Launch ERP Demo',
      href: '#visual-demo',
    },
    secondaryCta: {
      label: 'Preview Demo',
      href: '#visual-demo',
    },
    demoTabId: 'erp',
    ctaText: 'Choose School ERP',
  },
  {
    id: 'school-complete',
    name: 'Website + CMS + ERP',
    category: 'UNIFIED STACK',
    tagline: 'The complete all-in-one digital school platform connecting your public presence and campus operations.',
    badge: 'RECOMMENDED',
    highlighted: true,
    startingPriceDisplay: 'Starting at ₹39,999',
    renewalPriceDisplay: 'Starting at ₹24,999/year',
    domainAllowance: 750,
    includedPages: 10,
    isStudentBased: true,
    bestFor: 'Complete unified platform: professional website, staff publishing CMS, and full campus ERP—scaled to your enrollment.',
    coreCapabilities: [
      'Professional school website with modern custom UI/UX',
      'Staff CMS admin panel for public notices, news and galleries',
      'Full-featured School ERP platform scaled to student strength',
      'Seamless synchronization between public admission inquiries and ERP',
      'Custom institutional branding across public web and ERP portals',
      'Fast cloud hosting, SSL and daily data backups',
      'End-to-end deployment, initial student data import and setup',
    ],
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
    primaryCta: {
      label: 'Configure School Plan',
      href: '/schools/configure?plan=school-complete',
    },
    secondaryCta: {
      label: 'Preview Demo',
      href: '#visual-demo',
    },
    demoTabId: 'unified',
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
    category: 'finance',
    categoryLabel: 'CATEGORY 1 — FINANCE',
    description: 'Fee heads configuration, concessions, dues tracking, automated fine calculations and printed GST/school receipts.',
    priceNote: 'Included in ERP setup consultation',
  },
  {
    id: 'online-fee-payment',
    name: 'Payment Gateway Integration',
    category: 'finance',
    categoryLabel: 'CATEGORY 1 — FINANCE',
    description: 'Allow parents to pay fees online via UPI, NetBanking and debit/credit cards with instant receipt generation.',
    priceNote: 'Integration included (Gateway transaction fees apply per provider)',
    thirdPartyUsageNote: 'Gateway transaction fees apply per provider',
  },
  {
    id: 'whatsapp-integration',
    name: 'Official WhatsApp Notification API',
    category: 'communication',
    categoryLabel: 'CATEGORY 2 — COMMUNICATION',
    description: 'Automated WhatsApp alerts for daily absence, fee dues reminders, holiday announcements and exam schedules.',
    priceNote: 'Setup included + Meta WhatsApp API usage charges at cost',
    thirdPartyUsageNote: 'Meta business verification & template charges apply',
  },
  {
    id: 'sms-integration',
    name: 'DLT-Approved SMS Gateway Integration',
    category: 'communication',
    categoryLabel: 'CATEGORY 2 — COMMUNICATION',
    description: 'TRAI/DLT compliant bulk SMS gateway for attendance alerts, urgent school closures and OTP authentication.',
    priceNote: 'Setup included + SMS credits at actual provider rates',
    thirdPartyUsageNote: 'TRAI DLT registration required',
  },
  {
    id: 'parent-mobile-app',
    name: 'Parent Mobile App (Android)',
    category: 'mobile',
    categoryLabel: 'CATEGORY 3 — MOBILE',
    description: 'Dedicated branded mobile application for parents to view attendance, fee dues, report cards and notices.',
    priceNote: 'Custom quote based on Google Play Store publishing requirements',
    isCustomQuote: true,
  },
  {
    id: 'teacher-admin-app',
    name: 'Teacher & Admin Mobile App',
    category: 'mobile',
    categoryLabel: 'CATEGORY 3 — MOBILE',
    description: 'Mobile app for teachers to mark daily attendance, input exam marks and broadcast class announcements.',
    priceNote: 'Custom quote / Companion package',
    isCustomQuote: true,
  },
  {
    id: 'transport-management',
    name: 'Transport & Bus Route Management',
    category: 'operations',
    categoryLabel: 'CATEGORY 4 — OPERATIONS',
    description: 'Bus routes, pickup/drop stops, vehicle documentation, driver allocation and transport fee scheduling.',
    priceNote: 'Optional operational add-on',
  },
  {
    id: 'library-management',
    name: 'Library Book & Issue Management',
    category: 'operations',
    categoryLabel: 'CATEGORY 4 — OPERATIONS',
    description: 'Book cataloging, barcode scanning, student/teacher issue-return tracking and overdue fine calculation.',
    priceNote: 'Optional academic add-on',
  },
  {
    id: 'hostel-management',
    name: 'Hostel & Boarding Management',
    category: 'campus',
    categoryLabel: 'CATEGORY 5 — CAMPUS',
    description: 'Hostel rooms, bed allocation, warden records, meal management and boarding fee accounting.',
    priceNote: 'Optional add-on for residential schools',
  },
  {
    id: 'payroll-hr',
    name: 'Staff Payroll & HR Management',
    category: 'operations',
    categoryLabel: 'OPERATIONAL EXTENSION',
    description: 'Staff attendance linkage, salary slip generation, deductions, leaves tracker, and advance loans.',
    priceNote: 'Optional HR add-on',
  },
  {
    id: 'inventory-management',
    name: 'Inventory & School Store',
    category: 'operations',
    categoryLabel: 'OPERATIONAL EXTENSION',
    description: 'Uniforms, books, stationery inventory, vendor purchase orders, and distribution tracking.',
    priceNote: 'Optional store add-on',
  },
  {
    id: 'biometric-integration',
    name: 'Biometric Attendance Device Sync',
    category: 'operations',
    categoryLabel: 'HARDWARE INTEGRATION',
    description: 'Sync physical fingerprint or face-recognition attendance machines directly with ERP database.',
    priceNote: 'Hardware-dependent integration',
    isCustomQuote: true,
  },
  {
    id: 'advanced-reports',
    name: 'Advanced CBSE / Government Reports',
    category: 'support',
    categoryLabel: 'STATUTORY COMPLIANCE',
    description: 'Customized OASIS, U-DISE+ data exports, caste-wise student strength, and statutory audit reports.',
    priceNote: 'Custom export formatting',
  },
  {
    id: 'data-migration',
    name: 'Legacy Student Data Migration',
    category: 'support',
    categoryLabel: 'ONBOARDING SERVICE',
    description: 'Extraction, cleanup, and secure migration of existing student, parent, and fee records from Excel or older software.',
    priceNote: 'Comprehensive onboarding service',
  },
  {
    id: 'custom-module',
    name: 'Custom Tailored School Module',
    category: 'support',
    categoryLabel: 'BESPOKE ENGINEERING',
    description: 'Specific unique workflows, custom evaluation systems, or institutional integrations.',
    priceNote: 'Scoped individually upon request',
    isCustomQuote: true,
  },
];

export interface SchoolAddonCategoryGroup {
  id: string;
  categoryNumber: string;
  title: string;
  description: string;
  addons: SchoolAddonConfig[];
}

export const schoolAddonCategories: SchoolAddonCategoryGroup[] = [
  {
    id: 'finance',
    categoryNumber: 'CATEGORY 1',
    title: 'FINANCE',
    description: 'Fee collection, digital accounting, and secure payment rails.',
    addons: schoolAddons.filter((a) => a.category === 'finance'),
  },
  {
    id: 'communication',
    categoryNumber: 'CATEGORY 2',
    title: 'COMMUNICATION',
    description: 'Automated parental alerts, circulars, and instant school notices.',
    addons: schoolAddons.filter((a) => a.category === 'communication'),
  },
  {
    id: 'mobile',
    categoryNumber: 'CATEGORY 3',
    title: 'MOBILE',
    description: 'Native mobile interfaces for parents, educators, and campus leaders.',
    addons: schoolAddons.filter((a) => a.category === 'mobile'),
  },
  {
    id: 'operations',
    categoryNumber: 'CATEGORY 4',
    title: 'OPERATIONS',
    description: 'Logistics, asset inventory, and school library management.',
    addons: schoolAddons.filter((a) => a.id === 'transport-management' || a.id === 'library-management'),
  },
  {
    id: 'campus',
    categoryNumber: 'CATEGORY 5',
    title: 'CAMPUS',
    description: 'Residential life, hostel wards, and mess management.',
    addons: schoolAddons.filter((a) => a.category === 'campus'),
  },
];

// ─── 3.5. Feature Comparison Matrix ──────────────────────────────────────────

export interface SchoolComparisonRow {
  name: string;
  category: string;
  availability: Record<SchoolProductId, boolean>;
}

export const schoolComparisonRows: SchoolComparisonRow[] = [
  {
    name: 'Professional School Website',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Mobile Responsive Design',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'School Branding',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Admission Enquiry',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Notices / Announcements',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Gallery',
    category: 'Public Portal',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'CMS Admin',
    category: 'Staff Publishing',
    availability: {
      'school-website': false,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Events Calendar',
    category: 'Staff Publishing',
    availability: {
      'school-website': false,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Faculty/Staff Directory',
    category: 'Staff Publishing',
    availability: {
      'school-website': false,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Downloadable Forms',
    category: 'Staff Publishing',
    availability: {
      'school-website': false,
      'school-website-cms': true,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Student Information System',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Admissions / Enrollment',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Attendance',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Timetable',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Examination & Marks',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Fee Collection',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Parent/Student Access',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Role-Based Administration',
    category: 'Academic ERP',
    availability: {
      'school-website': false,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Admission → ERP Synchronization',
    category: 'Unified Integration',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': false,
      'school-complete': true,
    },
  },
  {
    name: 'Hosting / SSL / Backups',
    category: 'Infrastructure',
    availability: {
      'school-website': true,
      'school-website-cms': true,
      'school-erp': true,
      'school-complete': true,
    },
  },
  {
    name: 'Data Import / Setup',
    category: 'Infrastructure',
    availability: {
      'school-website': false,
      'school-website-cms': false,
      'school-erp': true,
      'school-complete': true,
    },
  },
];

// ─── 3.6. Year 1 vs Renewal Breakdown ─────────────────────────────────────────

export const schoolYearOneVsRenewal = {
  heading: 'Why Is Year 1 Different From Renewal?',
  statement:
    'Year 1 covers implementation, deployment and initial setup. Renewal covers ongoing platform operation, hosting, maintenance and support.',
  card1: {
    title: 'Year 1 Includes',
    subtitle: 'Setup & Launch',
    badge: '01',
    items: [
      'Initial custom school design and UI/UX branding',
      'Platform deployment and cloud database configuration',
      'Student, teacher and role-permission setup',
      'Academic session and timetable structuring',
      'Initial student data configuration/import',
      'Administrator and teacher onboarding training',
      'High-speed hosting and SSL security certificate',
      'Year-round technical maintenance and platform access',
    ],
  },
  card2: {
    title: 'Renewal Includes',
    subtitle: 'Annual Operations',
    badge: '02',
    items: [
      'Continuous platform access for school users',
      'High-performance cloud hosting and bandwidth',
      'Regular automated database backups',
      'Security updates and system patches',
      'Bug fixes and performance optimization',
      'Continuous platform feature updates',
      'Direct priority technical support',
      'Domain renewal coordination',
    ],
  },
};

// ─── 3.7. Authoritative FAQs ──────────────────────────────────────────────────

export const schoolFaqs = [
  {
    question: 'What is included in the School Website plan?',
    answer:
      'The School Website plan (₹9,999 Year 1 / ₹6,999/year renewal) includes up to 10 professionally designed standard pages (Home, About Us, Principal’s Message, Academics, Facilities, Campus Activities, Photo Gallery, Admission Enquiry, Notices, and Contact Us). It also comes with high-speed cloud hosting, an SSL security certificate, school branding integration, basic Google Search SEO, mobile-first responsive layout, and year-round technical maintenance.',
  },
  {
    question: 'What is the difference between CMS and ERP?',
    answer:
      'CMS (Content Management System) is designed for managing your public-facing school website — allowing staff to publish notices, update photo galleries, add circulars, and post news without touching code. ERP (Enterprise Resource Planning), on the other hand, is an internal operational platform for managing student records, admissions, class sections, attendance, examinations, CBSE report cards, fees, and staff payroll. CMS is for the public, while ERP runs the school’s daily academic administration.',
  },
  {
    question: 'How is ERP pricing calculated? Does it depend on student strength?',
    answer:
      'Yes. ERP pricing scales directly with your school’s student strength (e.g. Up to 300 students: ₹24,999 Year 1; 301–700 students: ₹34,999; 701–1,500 students: ₹49,999; 1,501–3,000 students: ₹69,999; 3,000+ custom). This tiered approach ensures smaller academies and expanding schools only pay for the computational capacity, database storage, and operational volume they actually require.',
  },
  {
    question: 'Why is Year 1 different from the renewal price?',
    answer:
      'Year 1 covers the intensive initial engineering and setup: custom design, school identity integration, database deployment, student/faculty data structure setup, user roles configuration, and staff training. Renewal covers ongoing operations: high-performance hosting, cloud database storage, daily backups, technical support, security patches, bug fixes, and continuous platform maintenance.',
  },
  {
    question: 'Can we choose our own domain, and is it included?',
    answer:
      'Yes! You can choose ANY available domain. Every plan includes an annual domain allowance (₹300 for School Website, ₹500 for Website + CMS or ERP, and ₹750 for Complete Platform). If your preferred domain costs within the allowance, it is 100% included at no extra cost. If you pick a domain priced above your plan’s allowance, you simply pay the transparent difference as an upgrade.',
  },
  {
    question: 'What happens if our preferred domain costs more than the allowance?',
    answer:
      'Our live domain tool calculates the upgrade difference automatically. For example, on the Complete Platform (allowance ₹750/year), if a domain costs ₹1,200 for 1 year, you only pay an upgrade difference of ₹450. You are never restricted to specific extensions.',
  },
  {
    question: 'Can we add modules later as our school grows?',
    answer:
      'Absolutely. Our architecture is modular. You can launch with a School Website or Core ERP today, and activate advanced modules like Online Fee Collection, Parent Android App, Biometric Attendance Sync, or WhatsApp Notification APIs whenever your institution is ready.',
  },
  {
    question: 'Can you migrate our existing student data from Excel or older software?',
    answer:
      'Yes. We provide comprehensive data onboarding services. We extract, sanitize, and securely import your existing student records, parent contact details, and historical academic sessions from spreadsheets or legacy database exports directly into your new platform.',
  },
  {
    question: 'Can the platform support multiple branches or campuses?',
    answer:
      'Yes. For multi-branch educational societies and school groups with 3,000+ students, we provide centralized multi-branch ERP architecture with branch-level permissions, consolidated reporting, and cross-campus administrative dashboards.',
  },
  {
    question: 'Can the school upgrade from Website to ERP later?',
    answer:
      'Yes. Many schools start with our School Website + CMS to quickly modernize their public admissions presence, and later upgrade to the Complete Platform by activating ERP without needing to rebuild their website from scratch.',
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

// ─── 6. Delivery Priority & Expedited Pricing ────────────────────────────────

export type SchoolDeliveryPriority = 'standard' | 'priority' | 'urgent';

export interface SchoolDeliveryOptionConfig {
  id: SchoolDeliveryPriority;
  label: string;
  badge: string;
  description: string;
  turnaroundText: string;
  isUrgent: boolean;
  baseChargeINR: number;
}

export interface SchoolProductDeliveryPricing {
  productId: SchoolProductId;
  standardTurnaround: string;
  priorityTurnaround: string;
  urgentTurnaround: string;
  expeditedFeeINR: number;
  expeditedFeeDisplay: string;
}

export const schoolDeliveryPricing: Record<SchoolProductId, SchoolProductDeliveryPricing> = {
  'school-website': {
    productId: 'school-website',
    standardTurnaround: '2 – 3 weeks',
    priorityTurnaround: '1 – 2 weeks',
    urgentTurnaround: 'Within 7 business days',
    expeditedFeeINR: 4999,
    expeditedFeeDisplay: '₹4,999',
  },
  'school-website-cms': {
    productId: 'school-website-cms',
    standardTurnaround: '3 – 4 weeks',
    priorityTurnaround: '2 – 3 weeks',
    urgentTurnaround: 'Within 10 business days',
    expeditedFeeINR: 7499,
    expeditedFeeDisplay: '₹7,499',
  },
  'school-erp': {
    productId: 'school-erp',
    standardTurnaround: '4 – 6 weeks',
    priorityTurnaround: '3 – 4 weeks',
    urgentTurnaround: 'Within 2 – 3 weeks',
    expeditedFeeINR: 9999,
    expeditedFeeDisplay: '₹9,999',
  },
  'school-complete': {
    productId: 'school-complete',
    standardTurnaround: '5 – 7 weeks',
    priorityTurnaround: '3 – 5 weeks',
    urgentTurnaround: 'Within 2 – 3 weeks',
    expeditedFeeINR: 14999,
    expeditedFeeDisplay: '₹14,999',
  },
};

export const DELIVERY_OPTIONS: SchoolDeliveryOptionConfig[] = [
  {
    id: 'standard',
    label: 'Standard Delivery',
    badge: 'Included',
    description: 'Normal project delivery based on your selected plan and current project queue.',
    turnaroundText: 'Plan default timeline',
    isUrgent: false,
    baseChargeINR: 0,
  },
  {
    id: 'priority',
    label: 'Priority Delivery',
    badge: 'Preferred Queue',
    description: 'Request earlier scheduling where capacity allows.',
    turnaroundText: 'Accelerated queue scheduling',
    isUrgent: false,
    baseChargeINR: 0,
  },
  {
    id: 'urgent',
    label: 'Urgent / Expedited Delivery',
    badge: 'Fast-Track Service',
    description: 'Request expedited delivery and earlier project scheduling, subject to availability and applicable charges.',
    turnaroundText: 'Dedicated sprint fast-track',
    isUrgent: true,
    baseChargeINR: 4999,
  },
];

/**
 * Authoritative plan-aware expedited delivery fee resolver.
 * Used by UI, server actions, billing validation, and provisioning handoff.
 */
export function calculateExpeditedDeliveryFee(
  productId: SchoolProductId,
  studentTierId?: SchoolStudentTierId | null
): number {
  const planPricing = schoolDeliveryPricing[productId];
  if (!planPricing) return 4999;
  return planPricing.expeditedFeeINR;
}

export function getDeliveryPricingForPlan(productId: SchoolProductId): SchoolProductDeliveryPricing {
  return (
    schoolDeliveryPricing[productId] || {
      productId: 'school-website',
      standardTurnaround: '2 – 3 weeks',
      priorityTurnaround: '1 – 2 weeks',
      urgentTurnaround: 'Within 7 business days',
      expeditedFeeINR: 4999,
      expeditedFeeDisplay: '₹4,999',
    }
  );
}
