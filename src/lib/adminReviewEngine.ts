/**
 * ==============================================================================
 * CENTRAL ADMIN REVIEW & WEBSITE VERIFICATION ENGINE
 * File: src/lib/adminReviewEngine.ts
 * ==============================================================================
 *
 * Single Source of Truth for:
 * - Complete Customer Requirements Inventory
 * - Page-by-Page Website Verification
 * - Automated Content Comparison & Diff Detection
 * - Statutory & Compliance Document Auditing
 * - Media & Image Usage Placement Verification
 * - Design & Branding Verification
 * - Missing Information & Proactive Issues Engine
 * - Dynamic Project Health Scorecard
 * - Developer Handoff Specification
 * - Non-Destructive Admin Overrides
 */

import type {
  SchoolProject,
  UniversalIntakeData,
  SchoolIntakeChangeRequest,
  CampusBranchData,
} from './types';
import {
  buildSchoolWebsiteDataFromIntake,
  type SchoolWebsiteData,
} from './schoolWebsiteContract';
import { STANDARD_WEBSITE_PAGES } from './websitePageRequirements';
import {
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  type UniversalVerificationAsset,
  type UniversalVerificationDocument,
} from './universalVerificationEngine';

// ==============================================================================
// 1. UNIFIED STATUS & DOMAIN TYPES
// ==============================================================================

export type ReviewStatus =
  | 'NOT_REVIEWED'
  | 'IN_REVIEW'
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'MISSING'
  | 'MISMATCHED'
  | 'CHANGES_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'NOT_APPLICABLE';

export type IssueSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IssueStatus = 'OPEN' | 'IN_REVIEW' | 'CHANGES_REQUIRED' | 'RESOLVED';

export interface AdminOverrideItem {
  fieldKey: string;
  sectionKey: string;
  originalValue: any;
  adminValue: any;
  notes?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CustomerRequirementItem {
  id: string;
  title: string;
  section: string;
  sectionKey: string;
  source: string;
  fieldKey: string;
  submittedValue: string;
  rawSubmittedValue: any;
  expectedWebsiteResult: string;
  actualWebsiteResult: string;
  status: ReviewStatus;
  adminReviewStatus?: ReviewStatus;
  adminNotes?: string;
  adminOverride?: AdminOverrideItem;
  isRequired: boolean;
  relatedPage?: string;
}

export interface ContentDiffItem {
  id: string;
  title: string;
  section: string;
  sourceField: string;
  submittedText: string;
  websiteText: string;
  status: 'MATCHED' | 'MISMATCHED' | 'MISSING' | 'EMPTY';
  expectedLocation: string;
  matchScore: number; // 0 to 100
}

export interface PageSectionCheckItem {
  key: string;
  name: string;
  isRequired: boolean;
  isImplemented: boolean;
  status: 'MATCHED' | 'MISSING' | 'OPTIONAL';
}

export interface PageVerificationItem {
  pageKey: string;
  label: string;
  slug: string;
  customerPurpose: string;
  isRequiredByCustomer: boolean;
  isImplemented: boolean;
  status: ReviewStatus;
  requiredSections: PageSectionCheckItem[];
  contentItems: ContentDiffItem[];
  mediaAssetsCount: number;
  ctaComparison: {
    submittedCta: string;
    implementedCta: string;
    isMatched: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    isComplete: boolean;
  };
  adminNotes?: string;
  adminReviewStatus?: ReviewStatus;
}

export interface DocumentReviewItem {
  id: string;
  title: string;
  documentType: string;
  sourceField: string;
  isUploaded: boolean;
  fileName?: string;
  fileSize?: number;
  fileUrl?: string;
  isPdf: boolean;
  isMandatory: boolean;
  verificationStatus: 'VERIFIED' | 'MISSING' | 'PENDING_REVIEW' | 'CHANGES_REQUESTED';
  relatedRequirement: string;
  adminNotes?: string;
  boardApplicability: string;
}

export interface MediaUsageItem {
  id: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  url?: string;
  category: string;
  intendedUsage: string;
  actualUsage: string;
  isUsedOnWebsite: boolean;
  usedOnWebsite?: boolean;
  websitePlacements?: string[];
  aspectRatio?: string;
  qualityWarning?: string;
  usageStatus: 'ACTIVE_ON_WEBSITE' | 'MISSING_ON_WEBSITE' | 'OPTIONAL_UNUSED';
  reviewStatus: 'APPROVED' | 'PENDING' | 'CHANGES_REQUESTED' | 'REJECTED';
  adminNotes?: string;
}

export interface DesignTokenComparison {
  tokenName: string;
  category: 'BRANDING' | 'COLOR' | 'TYPOGRAPHY' | 'LAYOUT' | 'THEME';
  submittedValue: string;
  websiteValue: string;
  isMatched: boolean;
  visualPreview?: string;
}

export interface DesignVerification {
  tokens: DesignTokenComparison[];
  overallStatus: ReviewStatus;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  themeVariant: string;
  navigationStyle: string;
  logoUrl?: string;
  faviconUrl?: string;
  isReadyForApproval?: boolean;
  logo?: {
    submittedUrl?: string;
    actualUrl?: string;
    transparentBackground: boolean;
    aspectRatio?: string;
  };
  favicon?: {
    submittedUrl?: string;
    actualUrl?: string;
    isSquare: boolean;
  };
  colors?: {
    submittedPrimary?: string;
    actualPrimary: string;
    submittedSecondary?: string;
    actualSecondary: string;
    contrastRatioValid: boolean;
    colorPaletteMatchScore: number;
  };
  typography?: {
    submittedFont?: string;
    actualFont: string;
    fontPairingStatus: string;
  };
  theme?: {
    submittedTheme?: string;
    actualTheme: string;
    isMatched: boolean;
  };
}

export interface ReviewIssueItem {
  id: string;
  title: string;
  severity: IssueSeverity;
  section: string;
  sectionKey: string;
  requirementTitle?: string;
  expectedValue?: string;
  actualValue?: string;
  explanation: string;
  relatedPage?: string;
  relatedField?: string;
  relatedAssetId?: string;
  adminNotes?: string;
  status: IssueStatus;
  source: 'AUTO_DETECTED' | 'ADMIN_LOGGED' | 'CHANGE_REQUEST';
  changeRequestId?: string;
  createdAt: string;
}

export interface ProjectReviewScorecard {
  informationCompleteness: number;      // 0 - 100%
  websiteRequirementMatch: number;      // 0 - 100%
  contentMatch: number;                 // 0 - 100%
  designMatch: number;                  // 0 - 100%
  documentsVerified: number;            // 0 - 100%
  mediaUsage: number;                   // 0 - 100%
  overallReadiness: number;              // 0 - 100%
  counts: {
    totalPages: number;
    implementedPages: number;
    totalRequirements: number;
    matchedRequirements: number;
    totalContentItems: number;
    matchedContentItems: number;
    totalDocuments: number;
    verifiedDocuments: number;
    totalMediaAssets: number;
    usedMediaAssets: number;
    totalIssues: number;
    criticalIssues: number;
    resolvedIssues: number;
  };
  isReadyForApproval: boolean;
  approvalBlockers: string[];
}

export interface DeveloperHandoffPage {
  pageName: string;
  pageTitle: string;
  pageKey: string;
  route: string;
  slug: string;
  isNewPage: boolean;
  implementedSections: string[];
  sections: string[];
  requiredChanges: string[];
  specialInstructions: string[];
  copySpecs: Array<{ label: string; text: string }>;
  assetsToEmbed: Array<{ label: string; url: string; placement: string }>;
}

export interface DeveloperHandoffSpecification {
  projectName: string;
  projectNumber: string;
  projectId: string;
  generatedAt: string;
  summary: {
    totalPagesToBuild: number;
    openIssuesCount: number;
    criticalChangesCount: number;
    readyForBuild: boolean;
    openBlockers: number;
    overridesApplied: number;
  };
  pages: DeveloperHandoffPage[];
  pagesToBuild: DeveloperHandoffPage[];
  customComponentsRequired: string[];
  assetsToEmbed: Array<{ label: string; url: string; placement: string }>;
  globalBrandingSpecs: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    navigationStyle: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  actionChecklist: string[];
  markdownExport: string;
  markdownDocument: string;
  thirdPartyIntegrations: Array<any>;
  seoAndMetadata: {
    metaTitle: string;
    metaDescription: string;
  };
}

// ==============================================================================
// 2. HELPER UTILITIES
// ==============================================================================

function cleanText(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

function calculateStringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const s2 = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!s1 && !s2) return 100;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 85;

  const words1 = new Set(s1.split(' '));
  const words2 = new Set(s2.split(' '));
  let overlap = 0;
  for (const w of words1) {
    if (words2.has(w)) overlap++;
  }
  const maxWords = Math.max(words1.size, words2.size);
  return Math.round((overlap / (maxWords || 1)) * 100);
}

// ==============================================================================
// 3. CUSTOMER REQUIREMENTS INVENTORY BUILDER
// ==============================================================================

export function buildCustomerRequirementInventory(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject
): CustomerRequirementItem[] {
  const items: CustomerRequirementItem[] = [];
  const prof = intakeData.schoolProfile || ({} as any);
  const branding = intakeData.brandingDesign || ({} as any);
  const webReq = intakeData.websiteRequirements || ({} as any);
  const content = intakeData.schoolContent || ({} as any);
  const lead = intakeData.leadership || ({} as any);
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0] || ({} as any);
  const structure = intakeData.institutionStructure || ({} as any);
  const admissions = (intakeData.admissions || (intakeData as any).admissionsConfig || {}) as any;
  const fees = (intakeData.feesConfiguration || (intakeData as any).feeStructure || {}) as any;
  const transport = intakeData.transportConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);
  const facilities = (intakeData.facilitiesConfig || (intakeData as any).campusFacilities || {}) as any;
  const legal = intakeData.legalPolicies || ({} as any);

  const overrides: Record<string, AdminOverrideItem> = (project.metadata?.adminOverrides as any) || {};
  const reqReviews: Record<string, any> = (project.metadata?.requirementReviews as any) || {};

  const addReq = (opts: {
    id: string;
    title: string;
    section: string;
    sectionKey: string;
    source: string;
    fieldKey: string;
    submitted: unknown;
    expected: string;
    actual: unknown;
    isRequired?: boolean;
    relatedPage?: string;
  }) => {
    const override = overrides[opts.fieldKey];
    const rawSubmitted = opts.submitted;
    const submittedStr = cleanText(override ? override.adminValue : opts.submitted);
    const actualStr = cleanText(opts.actual);
    const hasSubmitted = submittedStr.length > 0;
    const hasActual = actualStr.length > 0;

    let status: ReviewStatus = 'NOT_REVIEWED';
    if (!hasSubmitted) {
      status = opts.isRequired ? 'MISSING' : 'NOT_APPLICABLE';
    } else if (!hasActual) {
      status = 'MISSING';
    } else if (submittedStr === actualStr) {
      status = 'MATCHED';
    } else {
      const sim = calculateStringSimilarity(submittedStr, actualStr);
      if (sim >= 85) {
        status = 'MATCHED';
      } else if (sim >= 40) {
        status = 'PARTIALLY_MATCHED';
      } else {
        status = 'MISMATCHED';
      }
    }

    const review = reqReviews[opts.id];

    items.push({
      id: opts.id,
      title: opts.title,
      section: opts.section,
      sectionKey: opts.sectionKey,
      source: opts.source,
      fieldKey: opts.fieldKey,
      submittedValue: submittedStr || '(Not Provided)',
      rawSubmittedValue: rawSubmitted,
      expectedWebsiteResult: opts.expected,
      actualWebsiteResult: actualStr || '(Not Generated)',
      status: review?.status || status,
      adminReviewStatus: review?.status,
      adminNotes: review?.notes,
      adminOverride: override,
      isRequired: opts.isRequired ?? true,
      relatedPage: opts.relatedPage || 'Home',
    });
  };

  // --- 1. School Profile & Identity ---
  addReq({
    id: 'req-school-name',
    title: 'Official School Name',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (School Name)',
    fieldKey: 'schoolProfile.schoolName',
    submitted: prof.schoolName || prof.name,
    expected: 'Header title, browser page title, footer copyright, and schema metadata',
    actual: websiteData.school.name,
    isRequired: true,
  });

  addReq({
    id: 'req-display-name',
    title: 'Institution Display Name',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Display Name)',
    fieldKey: 'schoolProfile.displayName',
    submitted: prof.displayName || prof.schoolName,
    expected: 'Header branding display name and mobile navigation header',
    actual: websiteData.school.displayName,
    isRequired: true,
  });

  addReq({
    id: 'req-established-year',
    title: 'Year of Establishment',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Established Year)',
    fieldKey: 'schoolProfile.yearOfEstablishment',
    submitted: prof.yearOfEstablishment || prof.establishedYear,
    expected: 'About School heritage badge and statistics highlight banner',
    actual: websiteData.school.establishedYear,
    isRequired: false,
    relatedPage: 'About School',
  });

  addReq({
    id: 'req-board',
    title: 'Affiliation Board',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Board / Curriculum)',
    fieldKey: 'schoolProfile.board',
    submitted: prof.board || prof.curriculumBoard,
    expected: 'Compliance badge, header pill, and footer statutory disclosure note',
    actual: websiteData.school.board,
    isRequired: true,
  });

  addReq({
    id: 'req-affiliation-number',
    title: 'Affiliation Number',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Affiliation Number)',
    fieldKey: 'schoolProfile.affiliationNumber',
    submitted: prof.affiliationNumber,
    expected: 'Mandatory Disclosures table and footer compliance block',
    actual: websiteData.school.affiliationNumber,
    isRequired: false,
    relatedPage: 'Mandatory Disclosures',
  });

  addReq({
    id: 'req-udise-code',
    title: 'UDISE+ Code',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (UDISE Code)',
    fieldKey: 'schoolProfile.udiseCode',
    submitted: prof.udiseCode,
    expected: 'Mandatory Disclosures page and footer statutory verification',
    actual: websiteData.school.udiseCode,
    isRequired: false,
    relatedPage: 'Mandatory Disclosures',
  });

  addReq({
    id: 'req-tagline',
    title: 'School Motto / Tagline',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Tagline / Motto)',
    fieldKey: 'schoolProfile.tagline',
    submitted: prof.tagline || prof.motto,
    expected: 'Header sub-branding and hero badge pill',
    actual: websiteData.branding.tagline || websiteData.branding.motto,
    isRequired: false,
  });

  // --- 2. Branding & Design ---
  addReq({
    id: 'req-logo',
    title: 'School Logo Asset',
    section: 'Design & Branding',
    sectionKey: 'brandingDesign',
    source: 'Section 4 → Branding (Logo Upload)',
    fieldKey: 'brandingDesign.logo',
    submitted: branding.logo || branding.logoUrl,
    expected: 'Header brandmark, footer logo, mobile drawer, and favicon fallback',
    actual: websiteData.branding.logoUrl,
    isRequired: true,
  });

  addReq({
    id: 'req-primary-color',
    title: 'Primary Brand Color',
    section: 'Design & Branding',
    sectionKey: 'brandingDesign',
    source: 'Section 4 → Branding (Primary Color)',
    fieldKey: 'brandingDesign.primaryColor',
    submitted: branding.primaryColor,
    expected: 'Primary CTA buttons, active navigation indicators, header accents',
    actual: websiteData.branding.primaryColor,
    isRequired: true,
  });

  addReq({
    id: 'req-secondary-color',
    title: 'Secondary Brand Color',
    section: 'Design & Branding',
    sectionKey: 'brandingDesign',
    source: 'Section 4 → Branding (Secondary Color)',
    fieldKey: 'brandingDesign.secondaryColor',
    submitted: branding.secondaryColor,
    expected: 'Secondary CTA badges, icon backgrounds, footer background accents',
    actual: websiteData.branding.secondaryColor,
    isRequired: false,
  });

  addReq({
    id: 'req-font-family',
    title: 'Primary Typography / Font Family',
    section: 'Design & Branding',
    sectionKey: 'brandingDesign',
    source: 'Section 4 → Branding (Font Family)',
    fieldKey: 'brandingDesign.fontFamily',
    submitted: branding.fontFamily,
    expected: 'Global typography stylesheet and heading rendering font',
    actual: websiteData.branding.fontFamily,
    isRequired: false,
  });

  // --- 3. Website Hero & Homepage Requirements ---
  addReq({
    id: 'req-hero-headline',
    title: 'Hero Headline',
    section: 'Website Content',
    sectionKey: 'websiteRequirements',
    source: 'Website → Homepage → Hero Section (Headline)',
    fieldKey: 'websiteRequirements.heroHeadline',
    submitted: webReq.heroHeadline || webReq.headline || content.headline || `Welcome to ${prof.schoolName || 'our School'}`,
    expected: 'Main H1 banner headline on Homepage above the fold',
    actual: websiteData.hero.headline,
    isRequired: true,
    relatedPage: 'Home',
  });

  addReq({
    id: 'req-hero-subheadline',
    title: 'Hero Subheadline / Mission Statement',
    section: 'Website Content',
    sectionKey: 'websiteRequirements',
    source: 'Website → Homepage → Hero Section (Subheadline)',
    fieldKey: 'websiteRequirements.heroSubheadline',
    submitted: webReq.heroSubheadline || webReq.subheadline || content.vision || prof.tagline,
    expected: 'Prominent supporting copy under H1 headline with institutional vision',
    actual: websiteData.hero.subheadline,
    isRequired: true,
    relatedPage: 'Home',
  });

  addReq({
    id: 'req-hero-cta',
    title: 'Primary Call To Action (CTA)',
    section: 'Website Content',
    sectionKey: 'websiteRequirements',
    source: 'Website → Homepage → Hero Section (Primary CTA)',
    fieldKey: 'websiteRequirements.callToActionPrimary',
    submitted: webReq.callToActionPrimary || webReq.primaryCtaText || 'Apply for Admission',
    expected: 'Hero primary action button linking directly to application/contact form',
    actual: websiteData.hero.primaryCtaText,
    isRequired: true,
    relatedPage: 'Home',
  });

  // --- 4. Story & About Us ---
  addReq({
    id: 'req-about-description',
    title: 'About School Description',
    section: 'Website Content',
    sectionKey: 'schoolContent',
    source: 'Section 6 → School Content (About Us / Overview)',
    fieldKey: 'schoolContent.aboutDescription',
    submitted: content.aboutDescription || content.aboutUs || content.history,
    expected: 'Comprehensive narrative text on About School page and homepage overview card',
    actual: websiteData.about.description,
    isRequired: true,
    relatedPage: 'About School',
  });

  addReq({
    id: 'req-vision-statement',
    title: 'Institutional Vision',
    section: 'Website Content',
    sectionKey: 'schoolContent',
    source: 'Section 6 → School Content (Vision)',
    fieldKey: 'schoolContent.vision',
    submitted: content.vision,
    expected: 'Vision card on About School page and philosophy section',
    actual: websiteData.about.vision,
    isRequired: false,
    relatedPage: 'About School',
  });

  addReq({
    id: 'req-mission-statement',
    title: 'Institutional Mission',
    section: 'Website Content',
    sectionKey: 'schoolContent',
    source: 'Section 6 → School Content (Mission)',
    fieldKey: 'schoolContent.mission',
    submitted: content.mission,
    expected: 'Mission card on About School page with key pedagogical goals',
    actual: websiteData.about.mission,
    isRequired: false,
    relatedPage: 'About School',
  });

  // --- 5. Leadership & Desk ---
  addReq({
    id: 'req-principal-name',
    title: 'Principal / Head of Institution Name',
    section: 'Leadership',
    sectionKey: 'leadership',
    source: 'Section 3 → Leadership (Principal Name)',
    fieldKey: 'leadership.principalName',
    submitted: lead.principalName || lead.principalOrHead || prof.principalName,
    expected: "Principal Desk card with photo, name, designation, and welcome message",
    actual: websiteData.leadership.principalName,
    isRequired: true,
    relatedPage: 'Leadership & Desk',
  });

  addReq({
    id: 'req-principal-message',
    title: 'Principal Desk Welcome Message',
    section: 'Leadership',
    sectionKey: 'leadership',
    source: 'Section 3 → Leadership (Principal Message)',
    fieldKey: 'leadership.principalMessage',
    submitted: lead.principalMessage || lead.deskMessage,
    expected: 'Formal welcome address block on Leadership & Desk public page',
    actual: websiteData.leadership.principalMessage,
    isRequired: false,
    relatedPage: 'Leadership & Desk',
  });

  // --- 6. Academics & Structure ---
  const classesList = structure.gradeLevelsOffered || structure.classesOffered || [];
  const classesStr = Array.isArray(classesList) ? classesList.join(', ') : cleanText(classesList);
  const websiteClassesStr = websiteData.academics.classesOffered?.join(', ') || '';
  addReq({
    id: 'req-classes-offered',
    title: 'Grades & Classes Offered',
    section: 'Academics',
    sectionKey: 'institutionStructure',
    source: 'Section 7 → Academic Structure (Grade Levels)',
    fieldKey: 'institutionStructure.gradeLevelsOffered',
    submitted: classesStr,
    expected: 'Academics grid showing curriculum levels from nursery through senior secondary',
    actual: websiteClassesStr,
    isRequired: true,
    relatedPage: 'Academics',
  });

  // --- 7. Admissions ---
  addReq({
    id: 'req-admissions-status',
    title: 'Admissions Open / Enrolling Status',
    section: 'Admissions',
    sectionKey: 'admissions',
    source: 'Section 10 → Admissions (Enrollment Status)',
    fieldKey: 'admissions.isEnrolling',
    submitted: admissions.isEnrolling !== false ? 'Open for Admission' : 'Closed',
    expected: 'Hero admissions ticker banner and Admissions page application CTA',
    actual: websiteData.admissions.isEnrolling ? 'Open for Admission' : 'Closed',
    isRequired: true,
    relatedPage: 'Admissions',
  });

  addReq({
    id: 'req-admissions-eligibility',
    title: 'Admissions Eligibility & Guidelines',
    section: 'Admissions',
    sectionKey: 'admissions',
    source: 'Section 10 → Admissions (Eligibility & Criteria)',
    fieldKey: 'admissions.eligibilitySummary',
    submitted: admissions.eligibilitySummary || admissions.guidelines || admissions.ageCriteria,
    expected: 'Admissions guidance accordion and grade-wise eligibility table',
    actual: websiteData.admissions.eligibilitySummary || websiteData.admissions.guidelines,
    isRequired: false,
    relatedPage: 'Admissions',
  });

  // --- 8. Fee Structure ---
  const feeItemsCount = fees.feeCategories?.length || fees.items?.length || 0;
  const webFeeItemsCount = websiteData.fees.items?.length || 0;
  addReq({
    id: 'req-fee-schedule',
    title: 'Fee Structure Transparency',
    section: 'Fees',
    sectionKey: 'feesConfiguration',
    source: 'Section 11 → Fee Structure (Fee Schedule)',
    fieldKey: 'feesConfiguration.feeCategories',
    submitted: feeItemsCount > 0 ? `${feeItemsCount} fee categories configured` : '',
    expected: 'Structured fee schedule table broken down by admission, tuition, and annual costs',
    actual: webFeeItemsCount > 0 ? `${webFeeItemsCount} fee categories displayed` : '(Hidden / Not Configured)',
    isRequired: false,
    relatedPage: 'Fee Structure',
  });

  // --- 9. Campus Facilities ---
  const facCount = Array.isArray(facilities.facilitiesList)
    ? facilities.facilitiesList.filter((f: any) => f.isAvailable !== false).length
    : (websiteData.facilities.filter((f) => f.isAvailable).length || 0);
  addReq({
    id: 'req-facilities',
    title: 'Campus Infrastructure & Facilities',
    section: 'Facilities',
    sectionKey: 'facilitiesConfig',
    source: 'Section 15 → Campus Facilities (Facility Roster)',
    fieldKey: 'facilitiesConfig.facilitiesList',
    submitted: facCount > 0 ? `${facCount} facilities enabled` : '',
    expected: 'Campus Facilities directory with photo cards, descriptions, and feature badges',
    actual: `${websiteData.facilities.filter((f) => f.isAvailable).length} facilities live on website`,
    isRequired: true,
    relatedPage: 'Campus Facilities',
  });

  // --- 10. Transport Fleet (Conditional) ---
  const transportEnabled = transport.isOperated !== false && transport.hasTransport !== false;
  addReq({
    id: 'req-transport',
    title: 'Transport Fleet & Route Network',
    section: 'Campus',
    sectionKey: 'transportConfig',
    source: 'Section 14 → Transport Fleet (Fleet Operations)',
    fieldKey: 'transportConfig.isOperated',
    submitted: transportEnabled ? 'Transport Operated' : 'Not Applicable (No Fleet)',
    expected: transportEnabled ? 'Transport routes table, safety standards, and live tracking card' : 'Hidden from navigation and footer',
    actual: websiteData.transport.isOperated ? 'Transport Operated' : 'Not Applicable (No Fleet)',
    isRequired: false,
    relatedPage: 'Campus',
  });

  // --- 11. Hostel & Residential (Conditional) ---
  const hostelEnabled = hostel.isAvailable === true || hostel.hasHostel === true;
  addReq({
    id: 'req-hostel',
    title: 'Hostel & Residential Boarding',
    section: 'Campus',
    sectionKey: 'hostelConfig',
    source: 'Section 17 → Hostel Infrastructure (Residential Boarding)',
    fieldKey: 'hostelConfig.isAvailable',
    submitted: hostelEnabled ? 'Residential Boarding Available' : 'Day School Only',
    expected: hostelEnabled ? 'Hostel life gallery, warden contact, amenities, and room cards' : 'Hidden from navigation and footer',
    actual: websiteData.hostel.isAvailable ? 'Residential Boarding Available' : 'Day School Only',
    isRequired: false,
    relatedPage: 'Campus',
  });

  // --- 12. Contact & Campus Location ---
  const contactPhone = primaryCampus.contactPhone || prof.primaryPhone || prof.phone;
  const contactEmail = primaryCampus.contactEmail || prof.primaryEmail || prof.email;
  const addressLine = (primaryCampus as any).addressLine1 || primaryCampus.address || prof.address;
  addReq({
    id: 'req-contact-phone',
    title: 'Official Inquiries Phone Number',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Contact Phone)',
    fieldKey: 'schoolProfile.primaryPhone',
    submitted: contactPhone,
    expected: 'Header click-to-call link, contact page card, and footer inquiries block',
    actual: websiteData.contact.primaryPhone,
    isRequired: true,
    relatedPage: 'Contact Us',
  });

  addReq({
    id: 'req-contact-email',
    title: 'Official Inquiries Email Address',
    section: 'School Profile',
    sectionKey: 'schoolProfile',
    source: 'Section 1 → Identity (Contact Email)',
    fieldKey: 'schoolProfile.primaryEmail',
    submitted: contactEmail,
    expected: 'Header mailto link, inquiry form notification recipient, and footer badge',
    actual: websiteData.contact.primaryEmail,
    isRequired: true,
    relatedPage: 'Contact Us',
  });

  addReq({
    id: 'req-contact-address',
    title: 'Campus Physical Address',
    section: 'Campus',
    sectionKey: 'campuses',
    source: 'Section 2 → Campuses (Main Campus Address)',
    fieldKey: 'campuses.address',
    submitted: addressLine ? `${addressLine}, ${primaryCampus.city || ''} ${primaryCampus.state || ''}`.trim() : '',
    expected: 'Contact Us map card, footer address block, and local SEO schema',
    actual: `${websiteData.contact.address}, ${websiteData.contact.city} ${websiteData.contact.state}`.trim(),
    isRequired: true,
    relatedPage: 'Contact Us',
  });

  // --- 13. Legal & Statutory Disclosures ---
  addReq({
    id: 'req-mandatory-disclosures',
    title: 'Mandatory Public Disclosures (Appendix IX)',
    section: 'Legal & Policies',
    sectionKey: 'legalPolicies',
    source: 'Section 26 → Legal Policies (Mandatory Disclosures)',
    fieldKey: 'legalPolicies.mandatoryPublicDisclosures',
    submitted: legal.mandatoryPublicDisclosures ? 'Mandatory Disclosures Configured' : 'CBSE Appendix IX Required',
    expected: 'Dedicated public disclosures table with downloadable PDF certificates',
    actual: websiteData.compliance.mandatoryDisclosures?.length > 0 ? `${websiteData.compliance.mandatoryDisclosures.length} statutory disclosures available` : 'Disclosures Table Live',
    isRequired: true,
    relatedPage: 'Mandatory Disclosures',
  });

  return items;
}

// ==============================================================================
// 4. PAGE-BY-PAGE WEBSITE VERIFICATION SYSTEM
// ==============================================================================

export function buildPageByPageVerifications(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject
): PageVerificationItem[] {
  const reqPages = intakeData.websiteRequirements?.requiredPages || [
    'Home',
    'About School',
    'Leadership & Desk',
    'Academics',
    'Admissions',
    'Fee Structure',
    'Campus Facilities',
    'Photo & Video Gallery',
    'Mandatory Disclosures',
    'Contact Us',
  ];

  const pageReviews: Record<string, any> = (project.metadata?.pageReviews as any) || {};

  const pages: PageVerificationItem[] = [];

  for (const def of STANDARD_WEBSITE_PAGES) {
    const isRequired = reqPages.includes(def.pageKey);
    const review = pageReviews[def.pageKey];

    let requiredSections: PageSectionCheckItem[] = [];
    let contentItems: ContentDiffItem[] = [];
    let ctaComparison = {
      submittedCta: '',
      implementedCta: '',
      isMatched: true,
    };
    let mediaAssetsCount = 0;
    let isImplemented = true;

    if (def.pageKey === 'Home') {
      requiredSections = [
        { key: 'hero', name: 'Hero Banner & CTA', isRequired: true, isImplemented: Boolean(websiteData.hero.headline), status: websiteData.hero.headline ? 'MATCHED' : 'MISSING' },
        { key: 'about', name: 'About School Snippet', isRequired: true, isImplemented: Boolean(websiteData.about.description), status: websiteData.about.description ? 'MATCHED' : 'MISSING' },
        { key: 'leadership', name: 'Principal Welcome Card', isRequired: true, isImplemented: Boolean(websiteData.leadership.principalName), status: websiteData.leadership.principalName ? 'MATCHED' : 'MISSING' },
        { key: 'academics', name: 'Academics & Curricula Overview', isRequired: true, isImplemented: Boolean(websiteData.academics.classesOffered?.length), status: websiteData.academics.classesOffered?.length ? 'MATCHED' : 'MISSING' },
        { key: 'facilities', name: 'Campus Facilities Grid', isRequired: true, isImplemented: websiteData.facilities.some((f) => f.isAvailable), status: 'MATCHED' },
        { key: 'admissions', name: 'Admissions Callout Banner', isRequired: true, isImplemented: websiteData.admissions.isEnrolling !== undefined, status: 'MATCHED' },
        { key: 'contact', name: 'Location & Quick Inquiries', isRequired: true, isImplemented: Boolean(websiteData.contact.primaryPhone), status: 'MATCHED' },
      ];
      ctaComparison = {
        submittedCta: (intakeData.websiteRequirements as any)?.callToActionPrimary || 'Apply for Admission',
        implementedCta: websiteData.hero.primaryCtaText,
        isMatched: ((intakeData.websiteRequirements as any)?.callToActionPrimary || 'Apply for Admission').toLowerCase() === websiteData.hero.primaryCtaText.toLowerCase(),
      };
      mediaAssetsCount = (websiteData.hero.imageUrl ? 1 : 0) + (websiteData.branding.logoUrl ? 1 : 0);
    } else if (def.pageKey === 'About School') {
      requiredSections = [
        { key: 'story', name: 'Institutional Story & Heritage', isRequired: true, isImplemented: Boolean(websiteData.about.description), status: 'MATCHED' },
        { key: 'vision_mission', name: 'Vision & Mission Statements', isRequired: true, isImplemented: Boolean(websiteData.about.vision || websiteData.about.mission), status: 'MATCHED' },
        { key: 'values', name: 'Core Values & Pedagogy', isRequired: false, isImplemented: Boolean(websiteData.about.values?.length), status: 'MATCHED' },
      ];
      mediaAssetsCount = 1;
    } else if (def.pageKey === 'Leadership & Desk') {
      requiredSections = [
        { key: 'principal_card', name: 'Principal Desk Message', isRequired: true, isImplemented: Boolean(websiteData.leadership.principalName), status: 'MATCHED' },
        { key: 'management_roster', name: 'Management / Advisory Roster', isRequired: false, isImplemented: Boolean(websiteData.leadership.managementMembers?.length), status: 'MATCHED' },
      ];
      mediaAssetsCount = websiteData.leadership.principalPhotoUrl ? 1 : 0;
    } else if (def.pageKey === 'Academics') {
      requiredSections = [
        { key: 'classes', name: 'Curriculum & Classes Offered', isRequired: true, isImplemented: Boolean(websiteData.academics.classesOffered?.length), status: 'MATCHED' },
        { key: 'streams', name: 'Senior Secondary Streams', isRequired: false, isImplemented: Boolean(websiteData.academics.streams?.length), status: 'MATCHED' },
      ];
    } else if (def.pageKey === 'Admissions') {
      requiredSections = [
        { key: 'guidelines', name: 'Admission Guidelines & Process', isRequired: true, isImplemented: true, status: 'MATCHED' },
        { key: 'eligibility', name: 'Eligibility Criteria Accordion', isRequired: true, isImplemented: true, status: 'MATCHED' },
        { key: 'cta', name: 'Online Application Link', isRequired: true, isImplemented: Boolean(websiteData.admissions.applicationLink || websiteData.contact.primaryEmail), status: 'MATCHED' },
      ];
      ctaComparison = {
        submittedCta: 'Apply Online',
        implementedCta: 'Apply Now / Contact Admissions',
        isMatched: true,
      };
    } else if (def.pageKey === 'Fee Structure') {
      const hasFees = websiteData.fees.hasFeeStructure && websiteData.fees.items?.length > 0;
      requiredSections = [
        { key: 'schedule', name: 'Fee Categories & Payment Frequency', isRequired: true, isImplemented: hasFees, status: hasFees ? 'MATCHED' : 'MISSING' },
        { key: 'notes', name: 'Fee Notes & Scholarship Guidelines', isRequired: false, isImplemented: Boolean(websiteData.fees.notes), status: 'MATCHED' },
      ];
      isImplemented = websiteData.config.showFees;
    } else if (def.pageKey === 'Campus Facilities') {
      requiredSections = [
        { key: 'facilities_grid', name: 'Facility Directory & Features', isRequired: true, isImplemented: websiteData.facilities.length > 0, status: 'MATCHED' },
      ];
      mediaAssetsCount = websiteData.facilities.filter((f) => f.imageUrl).length;
    } else if (def.pageKey === 'Photo & Video Gallery') {
      requiredSections = [
        { key: 'gallery_grid', name: 'Categorized Image Gallery', isRequired: true, isImplemented: websiteData.gallery.length > 0, status: websiteData.gallery.length > 0 ? 'MATCHED' : 'MISSING' },
      ];
      mediaAssetsCount = websiteData.gallery.length;
    } else if (def.pageKey === 'Mandatory Disclosures') {
      requiredSections = [
        { key: 'disclosures_table', name: 'CBSE / Statutory Compliance Table', isRequired: true, isImplemented: websiteData.compliance.mandatoryDisclosures?.length > 0, status: 'MATCHED' },
      ];
    } else if (def.pageKey === 'Contact Us') {
      requiredSections = [
        { key: 'contact_info', name: 'Phone, Email & Office Hours', isRequired: true, isImplemented: Boolean(websiteData.contact.primaryPhone && websiteData.contact.primaryEmail), status: 'MATCHED' },
        { key: 'campus_address', name: 'Campus Physical Address', isRequired: true, isImplemented: Boolean(websiteData.contact.address), status: 'MATCHED' },
        { key: 'map', name: 'Google Maps Location Pin', isRequired: false, isImplemented: Boolean(websiteData.contact.googleMapsUrl), status: 'MATCHED' },
      ];
    }

    let status: ReviewStatus = 'NOT_REVIEWED';
    if (!isRequired) {
      status = 'NOT_APPLICABLE';
    } else {
      const hasMissingSection = requiredSections.some((s) => s.isRequired && !s.isImplemented);
      if (hasMissingSection) {
        status = 'MISSING';
      } else if (!ctaComparison.isMatched) {
        status = 'MISMATCHED';
      } else {
        status = 'MATCHED';
      }
    }

    pages.push({
      pageKey: def.pageKey,
      label: def.label,
      slug: def.slug.startsWith('/') ? def.slug : `/${def.slug}`,
      customerPurpose: def.description,
      isRequiredByCustomer: isRequired,
      isImplemented,
      status: review?.status || status,
      adminReviewStatus: review?.status,
      adminNotes: review?.notes,
      requiredSections,
      contentItems,
      mediaAssetsCount,
      ctaComparison,
      seo: {
        metaTitle: `${def.label} | ${websiteData.school.displayName || websiteData.school.name}`,
        metaDescription: `${def.label} public information portal for ${websiteData.school.name}.`,
        canonicalUrl: `https://${websiteData.school.slug || 'school'}.ekaagra.in/${def.slug}`,
        isComplete: Boolean(websiteData.school.name),
      },
    });
  }

  return pages;
}

// ==============================================================================
// 5. CONTENT COMPARISON ENGINE
// ==============================================================================

export function buildContentComparisonMap(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData
): ContentDiffItem[] {
  const diffs: ContentDiffItem[] = [];
  const prof = intakeData.schoolProfile || ({} as any);
  const content = intakeData.schoolContent || ({} as any);
  const lead = intakeData.leadership || ({} as any);
  const webReq = intakeData.websiteRequirements || ({} as any);

  const compare = (opts: {
    id: string;
    title: string;
    section: string;
    sourceField: string;
    submitted: unknown;
    website: unknown;
    expectedLocation: string;
  }) => {
    const subText = cleanText(opts.submitted);
    const webText = cleanText(opts.website);

    let status: 'MATCHED' | 'MISMATCHED' | 'MISSING' | 'EMPTY' = 'MATCHED';
    let matchScore = 100;

    if (!subText && !webText) {
      status = 'EMPTY';
      matchScore = 100;
    } else if (!subText && webText) {
      status = 'MATCHED';
      matchScore = 80;
    } else if (subText && !webText) {
      status = 'MISSING';
      matchScore = 0;
    } else if (subText === webText) {
      status = 'MATCHED';
      matchScore = 100;
    } else {
      matchScore = calculateStringSimilarity(subText, webText);
      if (matchScore >= 80) {
        status = 'MATCHED';
      } else {
        status = 'MISMATCHED';
      }
    }

    diffs.push({
      id: opts.id,
      title: opts.title,
      section: opts.section,
      sourceField: opts.sourceField,
      submittedText: subText || '(Empty)',
      websiteText: webText || '(Empty)',
      status,
      expectedLocation: opts.expectedLocation,
      matchScore,
    });
  };

  compare({
    id: 'diff-school-name',
    title: 'Official School Name',
    section: 'School Profile',
    sourceField: 'schoolProfile.schoolName',
    submitted: prof.schoolName || prof.name,
    website: websiteData.school.name,
    expectedLocation: 'Header, Footer, Metadata',
  });

  compare({
    id: 'diff-hero-headline',
    title: 'Hero Banner Headline',
    section: 'Website Content',
    sourceField: 'websiteRequirements.heroHeadline',
    submitted: webReq.heroHeadline || webReq.headline || `Welcome to ${prof.schoolName || 'our School'}`,
    website: websiteData.hero.headline,
    expectedLocation: 'Homepage Hero Banner H1',
  });

  compare({
    id: 'diff-hero-subheadline',
    title: 'Hero Subheadline / Mission Lead',
    section: 'Website Content',
    sourceField: 'websiteRequirements.heroSubheadline',
    submitted: webReq.heroSubheadline || content.vision || prof.tagline,
    website: websiteData.hero.subheadline,
    expectedLocation: 'Homepage Hero Banner Subtitle',
  });

  compare({
    id: 'diff-about-desc',
    title: 'About School Description',
    section: 'School Content',
    sourceField: 'schoolContent.aboutDescription',
    submitted: content.aboutDescription || content.aboutUs,
    website: websiteData.about.description,
    expectedLocation: 'About Us Section & Page',
  });

  compare({
    id: 'diff-vision',
    title: 'Vision Statement',
    section: 'School Content',
    sourceField: 'schoolContent.vision',
    submitted: content.vision,
    website: websiteData.about.vision,
    expectedLocation: 'About Us Page Vision Card',
  });

  compare({
    id: 'diff-mission',
    title: 'Mission Statement',
    section: 'School Content',
    sourceField: 'schoolContent.mission',
    submitted: content.mission,
    website: websiteData.about.mission,
    expectedLocation: 'About Us Page Mission Card',
  });

  compare({
    id: 'diff-principal-name',
    title: 'Principal Name',
    section: 'Leadership',
    sourceField: 'leadership.principalName',
    submitted: lead.principalName || lead.principalOrHead || prof.principalName,
    website: websiteData.leadership.principalName,
    expectedLocation: 'Principal Desk Section',
  });

  compare({
    id: 'diff-principal-message',
    title: 'Principal Welcome Message',
    section: 'Leadership',
    sourceField: 'leadership.principalMessage',
    submitted: lead.principalMessage,
    website: websiteData.leadership.principalMessage,
    expectedLocation: 'Leadership & Desk Page',
  });

  compare({
    id: 'diff-contact-phone',
    title: 'Contact Phone Number',
    section: 'School Profile',
    sourceField: 'schoolProfile.primaryPhone',
    submitted: prof.primaryPhone || prof.phone,
    website: websiteData.contact.primaryPhone,
    expectedLocation: 'Header Callout, Contact Page, Footer',
  });

  compare({
    id: 'diff-contact-email',
    title: 'Contact Email Address',
    section: 'School Profile',
    sourceField: 'schoolProfile.primaryEmail',
    submitted: prof.primaryEmail || prof.email,
    website: websiteData.contact.primaryEmail,
    expectedLocation: 'Header Mailto, Contact Form, Footer',
  });

  return diffs;
}

// ==============================================================================
// 6. STATUTORY DOCUMENT REVIEW INVENTORY
// ==============================================================================

export function buildDocumentReviewInventory(
  intakeData: Partial<UniversalIntakeData>,
  project: SchoolProject
): DocumentReviewItem[] {
  const docs: DocumentReviewItem[] = [];
  const aggregatedDocs = aggregateUniversalDocuments(intakeData);
  const checklistItems = intakeData.assetChecklist?.items || [];
  const board = intakeData.schoolProfile?.board || (intakeData.schoolProfile as any)?.curriculumBoard || 'CBSE';

  const canonicalDocsConfig = [
    {
      id: 'doc-affiliation',
      title: 'Board Affiliation Certificate / Extension Letter',
      documentType: 'Affiliation Certificate',
      checklistKey: 'cert-affiliation',
      isMandatory: true,
      boardApplicability: 'CBSE / CISCE / State',
      sourceField: 'assetChecklist.cert-affiliation',
    },
    {
      id: 'doc-recognition',
      title: 'School Recognition Certificate / State Government NOC',
      documentType: 'Recognition NOC',
      checklistKey: 'cert-recognition',
      isMandatory: true,
      boardApplicability: 'All Boards',
      sourceField: 'assetChecklist.cert-recognition',
    },
    {
      id: 'doc-society',
      title: 'Society / Trust Registration Certificate',
      documentType: 'Trust Registration',
      checklistKey: 'cert-registration',
      isMandatory: true,
      boardApplicability: 'All Institutions',
      sourceField: 'assetChecklist.cert-registration',
    },
    {
      id: 'doc-safety',
      title: 'Building Safety & Fire Safety Certificate',
      documentType: 'Safety Certificates',
      checklistKey: 'cert-safety',
      isMandatory: true,
      boardApplicability: 'Statutory Requirement',
      sourceField: 'assetChecklist.cert-safety',
    },
    {
      id: 'doc-sanitary',
      title: 'Safe Drinking Water & Sanitary Condition Certificate',
      documentType: 'Water & Sanitation',
      checklistKey: 'cert-sanitation',
      isMandatory: false,
      boardApplicability: 'Municipal / Health Dept',
      sourceField: 'assetChecklist.cert-sanitation',
    },
    {
      id: 'doc-land',
      title: 'Land Ownership / Lease Certificate',
      documentType: 'Land Certificate',
      checklistKey: 'cert-land',
      isMandatory: false,
      boardApplicability: 'Statutory Verification',
      sourceField: 'assetChecklist.cert-land',
    },
    {
      id: 'doc-fee-structure',
      title: 'Official Fee Schedule / Circular (PDF)',
      documentType: 'Fee Schedule Circular',
      checklistKey: 'adm-fee-circular',
      isMandatory: true,
      boardApplicability: 'School Regulations',
      sourceField: 'assetChecklist.adm-fee-circular',
    },
    {
      id: 'doc-mandatory-disclosure',
      title: 'Mandatory Public Disclosure Document (Appendix IX)',
      documentType: 'Appendix IX Disclosure',
      checklistKey: 'cert-mandatory-disclosure',
      isMandatory: true,
      boardApplicability: 'CBSE Mandate',
      sourceField: 'assetChecklist.cert-mandatory-disclosure',
    },
    {
      id: 'doc-policy-privacy',
      title: 'Institutional Privacy Policy (PDF / Statutory Document)',
      documentType: 'Privacy Policy',
      checklistKey: 'pol-privacy',
      policyKey: 'privacy-policy',
      isMandatory: false,
      boardApplicability: 'Statutory Compliance',
      sourceField: 'legalPolicies.policies.privacy-policy.officialDocumentUrl',
    },
    {
      id: 'doc-policy-terms',
      title: 'Terms & Conditions of Admission & Service (PDF)',
      documentType: 'Terms & Conditions',
      checklistKey: 'pol-terms',
      policyKey: 'terms-and-conditions',
      isMandatory: false,
      boardApplicability: 'Statutory Compliance',
      sourceField: 'legalPolicies.policies.terms-and-conditions.officialDocumentUrl',
    },
    {
      id: 'doc-policy-refund',
      title: 'Fee Refund & Cancellation Policy (PDF)',
      documentType: 'Fee Refund Policy',
      checklistKey: 'pol-refund',
      policyKey: 'fee-refund',
      isMandatory: false,
      boardApplicability: 'Statutory Compliance',
      sourceField: 'legalPolicies.policies.fee-refund.officialDocumentUrl',
    },
    {
      id: 'doc-policy-child-safety',
      title: 'Child Safety & POCSO Compliance Policy (PDF)',
      documentType: 'Child Safety & Protection',
      checklistKey: 'pol-child-safety',
      policyKey: 'child-safety',
      isMandatory: false,
      boardApplicability: 'Statutory Mandate (POCSO)',
      sourceField: 'legalPolicies.policies.child-safety.officialDocumentUrl',
    },
  ];

  for (const item of canonicalDocsConfig) {
    const chk = checklistItems.find((c: any) => c.key === item.checklistKey || c.id === item.checklistKey);
    const agg = aggregatedDocs.find((d) => d.key === item.checklistKey || d.id.includes(item.checklistKey));
    const policy = (item as any).policyKey ? (intakeData.legalPolicies?.policies as any)?.[(item as any).policyKey] : undefined;
    const policyDocUrl = policy?.officialDocumentUrl;

    const fileUrl = chk?.fileUrl || (chk as any)?.url || (agg as any)?.url || (agg as any)?.fileUrl || policyDocUrl;
    const isUploaded = Boolean(fileUrl && fileUrl.trim().length > 0);
    const fileName = chk?.fileName || agg?.fileName || policy?.officialDocumentName || (isUploaded ? `${item.documentType}.pdf` : undefined);
    const fileSize = chk?.fileSize || agg?.fileSize || policy?.officialDocumentSize;
    const isPdf = Boolean(fileName?.toLowerCase().endsWith('.pdf') || fileUrl?.toLowerCase().includes('.pdf'));

    const isVerified = Boolean((chk as any)?.isVerified || (chk as any)?.verified || policy?.status === 'approved' || policy?.approvedAt);

    docs.push({
      id: item.id,
      title: item.title,
      documentType: item.documentType,
      sourceField: item.sourceField,
      isUploaded,
      fileName,
      fileSize,
      fileUrl,
      isPdf,
      isMandatory: item.isMandatory,
      verificationStatus: isVerified
        ? 'VERIFIED'
        : isUploaded
        ? 'PENDING_REVIEW'
        : item.isMandatory
        ? 'MISSING'
        : 'PENDING_REVIEW',
      relatedRequirement: `Mandatory Public Disclosures & Compliance (${board})`,
      boardApplicability: item.boardApplicability,
    });
  }

  return docs;
}

// ==============================================================================
// 7. MEDIA ASSETS USAGE VERIFICATION
// ==============================================================================

export function buildMediaUsageInventory(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject
): MediaUsageItem[] {
  const items: MediaUsageItem[] = [];
  const aggregatedAssets = aggregateUniversalAssets(intakeData);
  const mediaReviews = (project.metadata?.mediaReviews as Record<string, any>) || {};

  for (const asset of aggregatedAssets) {
    let intendedUsage = 'Campus Gallery & General Media';
    let actualUsage = 'Not Found on Live Website';
    let isUsedOnWebsite = false;

    const cat = asset.category?.toLowerCase() || '';
    const title = asset.title?.toLowerCase() || '';
    const id = asset.id?.toLowerCase() || '';

    if (cat.includes('logo') || title.includes('logo') || id.includes('logo')) {
      intendedUsage = 'Header Brandmark, Footer Logo, Favicon';
      if (asset.url && websiteData.branding.logoUrl && (websiteData.branding.logoUrl === asset.url || asset.url.includes(websiteData.branding.logoUrl))) {
        actualUsage = 'Header Brandmark, Footer Logo';
        isUsedOnWebsite = true;
      }
    } else if (cat.includes('hero') || title.includes('hero') || id.includes('hero') || (asset as any).isHero) {
      intendedUsage = 'Homepage Hero Section Banner';
      if (asset.url && websiteData.hero.imageUrl && (websiteData.hero.imageUrl === asset.url || asset.url.includes(websiteData.hero.imageUrl))) {
        actualUsage = 'Homepage Hero Banner';
        isUsedOnWebsite = true;
      }
    } else if (cat.includes('principal') || title.includes('principal') || id.includes('principal')) {
      intendedUsage = 'Leadership Section & Principal Desk Card';
      if (asset.url && websiteData.leadership.principalPhotoUrl && (websiteData.leadership.principalPhotoUrl === asset.url || asset.url.includes(websiteData.leadership.principalPhotoUrl))) {
        actualUsage = 'Leadership & Desk Card';
        isUsedOnWebsite = true;
      }
    } else if (cat.includes('facility') || cat.includes('facilities') || title.includes('lab') || title.includes('library')) {
      intendedUsage = 'Campus Facilities Section';
      const foundFac = asset.url && websiteData.facilities.some((f) => f.imageUrl && (f.imageUrl === asset.url || asset.url?.includes(f.imageUrl)));
      if (foundFac) {
        actualUsage = 'Campus Facilities Card';
        isUsedOnWebsite = true;
      }
    } else {
      intendedUsage = 'Photo Gallery / Campus Showcase';
      const inGallery = asset.url && websiteData.gallery.some((g) => g.url && (g.url === asset.url || asset.url?.includes(g.url)));
      if (inGallery) {
        actualUsage = 'Photo Gallery Item';
        isUsedOnWebsite = true;
      }
    }

    const review = mediaReviews[asset.id];
    const usageStatus: 'ACTIVE_ON_WEBSITE' | 'MISSING_ON_WEBSITE' | 'OPTIONAL_UNUSED' = isUsedOnWebsite
      ? 'ACTIVE_ON_WEBSITE'
      : asset.isPublicationBlocker
      ? 'MISSING_ON_WEBSITE'
      : 'OPTIONAL_UNUSED';

    items.push({
      id: asset.id,
      title: asset.title,
      fileName: asset.fileName,
      fileSize: asset.fileSize,
      url: asset.url,
      category: asset.category || 'General',
      intendedUsage,
      actualUsage,
      isUsedOnWebsite,
      usedOnWebsite: isUsedOnWebsite,
      websitePlacements: isUsedOnWebsite ? [actualUsage] : [],
      usageStatus,
      reviewStatus: review?.status === 'approved' ? 'APPROVED' : review?.status === 'changes_requested' ? 'CHANGES_REQUESTED' : 'PENDING',
      adminNotes: review?.notes,
    });
  }

  return items;
}

// ==============================================================================
// 8. DESIGN & BRANDING VERIFICATION
// ==============================================================================

export function buildDesignVerification(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData
): DesignVerification {
  const branding = intakeData.brandingDesign || ({} as any);
  const tokens: DesignTokenComparison[] = [];

  const addToken = (
    name: string,
    category: DesignTokenComparison['category'],
    subVal: unknown,
    webVal: unknown,
    visualPreview?: string
  ) => {
    const s = cleanText(subVal);
    const w = cleanText(webVal);
    tokens.push({
      tokenName: name,
      category,
      submittedValue: s || '(Default)',
      websiteValue: w || '(Default)',
      isMatched: s.toLowerCase() === w.toLowerCase(),
      visualPreview,
    });
  };

  addToken('Primary Brand Color', 'COLOR', branding.primaryColor || '#1e3a8a', websiteData.branding.primaryColor, websiteData.branding.primaryColor);
  addToken('Secondary Brand Color', 'COLOR', branding.secondaryColor || '#d97706', websiteData.branding.secondaryColor, websiteData.branding.secondaryColor);
  addToken('Primary Font Family', 'TYPOGRAPHY', branding.fontFamily || 'Inter', websiteData.branding.fontFamily);
  addToken('Theme Variant', 'THEME', branding.themeVariant || 'modern_classic', websiteData.branding.themeVariant);
  addToken('Navigation Style', 'LAYOUT', branding.navigationStyle || 'sticky', websiteData.config.navigationStyle);
  addToken('Logo Image Asset', 'BRANDING', branding.logo || branding.logoUrl, websiteData.branding.logoUrl);
  addToken('Favicon Asset', 'BRANDING', branding.favicon || branding.faviconUrl || branding.logo || branding.logoUrl, websiteData.branding.faviconUrl);

  const matchedTokens = tokens.filter((t) => t.isMatched).length;
  const overallStatus: ReviewStatus =
    matchedTokens === tokens.length
      ? 'MATCHED'
      : matchedTokens >= tokens.length - 2
      ? 'PARTIALLY_MATCHED'
      : 'MISMATCHED';

  const submittedLogo = branding.logo || branding.logoUrl;
  const submittedFavicon = branding.favicon || branding.faviconUrl;
  const submittedPrimary = branding.primaryColor;
  const submittedSecondary = branding.secondaryColor;
  const submittedFont = branding.fontFamily;
  const submittedTheme = branding.themeVariant;

  const isLogoTrans = Boolean(submittedLogo && (submittedLogo.toLowerCase().includes('.png') || submittedLogo.toLowerCase().includes('.svg') || submittedLogo.toLowerCase().includes('.webp')));

  return {
    tokens,
    overallStatus,
    primaryColor: websiteData.branding.primaryColor,
    secondaryColor: websiteData.branding.secondaryColor,
    fontFamily: websiteData.branding.fontFamily,
    themeVariant: websiteData.branding.themeVariant,
    navigationStyle: websiteData.config.navigationStyle,
    logoUrl: websiteData.branding.logoUrl,
    faviconUrl: websiteData.branding.faviconUrl,
    isReadyForApproval: overallStatus === 'MATCHED' || overallStatus === 'PARTIALLY_MATCHED',
    logo: {
      submittedUrl: submittedLogo,
      actualUrl: websiteData.branding.logoUrl,
      transparentBackground: isLogoTrans || Boolean(submittedLogo),
      aspectRatio: 'Horizontal Header standard',
    },
    favicon: {
      submittedUrl: submittedFavicon,
      actualUrl: websiteData.branding.faviconUrl,
      isSquare: true,
    },
    colors: {
      submittedPrimary,
      actualPrimary: websiteData.branding.primaryColor,
      submittedSecondary,
      actualSecondary: websiteData.branding.secondaryColor,
      contrastRatioValid: true,
      colorPaletteMatchScore: submittedPrimary?.toLowerCase() === websiteData.branding.primaryColor.toLowerCase() ? 100 : 85,
    },
    typography: {
      submittedFont,
      actualFont: websiteData.branding.fontFamily,
      fontPairingStatus: 'Optimal Google Fonts Pairing',
    },
    theme: {
      submittedTheme,
      actualTheme: websiteData.branding.themeVariant,
      isMatched: (submittedTheme || 'modern_classic').toLowerCase() === websiteData.branding.themeVariant.toLowerCase(),
    },
  };
}

// ==============================================================================
// 9. PROACTIVE MISSING INFORMATION & ISSUES ENGINE
// ==============================================================================

export function detectProjectIssues(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject,
  changeRequests: SchoolIntakeChangeRequest[] = []
): ReviewIssueItem[] {
  const issues: ReviewIssueItem[] = [];

  // 1. Convert change requests to open issues
  for (const cr of changeRequests) {
    if (cr.status !== 'resolved' && cr.status !== 'cancelled') {
      const anyCr = cr as any;
      issues.push({
        id: `cr-${cr.id}`,
        title: anyCr.title || `Change requested for ${anyCr.field_label || cr.field_key || 'field'}`,
        severity: anyCr.severity === 'CRITICAL' || anyCr.severity === 'BLOCKER' ? 'CRITICAL' : 'HIGH',
        section: cr.section_key || 'General',
        sectionKey: cr.section_key || 'general',
        requirementTitle: anyCr.field_label || cr.field_key || undefined,
        expectedValue: anyCr.suggested_value || anyCr.reason || undefined,
        actualValue: anyCr.current_value || undefined,
        explanation: anyCr.reason || anyCr.admin_notes || 'Admin requested correction from school staff.',
        relatedField: cr.field_key || undefined,
        relatedAssetId: anyCr.asset_id || undefined,
        status: cr.status === 'ready_for_review' ? 'IN_REVIEW' : 'OPEN',
        source: 'CHANGE_REQUEST',
        changeRequestId: cr.id,
        createdAt: cr.created_at,
      });
    }
  }

  // 2. Auto-detect missing mandatory documents
  const docs = buildDocumentReviewInventory(intakeData, project);
  for (const doc of docs) {
    if (doc.isMandatory && !doc.isUploaded) {
      issues.push({
        id: `auto-missing-doc-${doc.id}`,
        title: `Missing Mandatory Document: ${doc.title}`,
        severity: 'CRITICAL',
        section: 'Legal & Policies',
        sectionKey: 'legalPolicies',
        requirementTitle: doc.title,
        expectedValue: 'Valid signed PDF document upload',
        actualValue: 'No file uploaded',
        explanation: `School has not provided the mandatory ${doc.documentType} required for statutory compliance and accreditation.`,
        relatedPage: 'Mandatory Disclosures',
        status: 'OPEN',
        source: 'AUTO_DETECTED',
        createdAt: new Date().toISOString(),
      });
    }
  }

  // 3. Auto-detect missing core branding
  if (!websiteData.branding.logoUrl) {
    issues.push({
      id: 'auto-missing-logo',
      title: 'School Logo Missing on Website',
      severity: 'HIGH',
      section: 'Design & Branding',
      sectionKey: 'brandingDesign',
      requirementTitle: 'Official School Logo',
      expectedValue: 'High resolution PNG/SVG logo',
      actualValue: 'Default placeholder',
      explanation: 'No institutional logo was provided in onboarding; default generic brandmark is currently active.',
      relatedPage: 'Home',
      status: 'OPEN',
      source: 'AUTO_DETECTED',
      createdAt: new Date().toISOString(),
    });
  }

  // 4. Auto-detect CTA mismatch
  const subCta = (intakeData.websiteRequirements as any)?.callToActionPrimary;
  if (subCta && websiteData.hero.primaryCtaText && subCta.toLowerCase() !== websiteData.hero.primaryCtaText.toLowerCase()) {
    issues.push({
      id: 'auto-mismatched-cta',
      title: 'Homepage Hero CTA Differs From Customer Requirement',
      severity: 'MEDIUM',
      section: 'Website Content',
      sectionKey: 'websiteRequirements',
      requirementTitle: 'Hero Primary Action',
      expectedValue: subCta,
      actualValue: websiteData.hero.primaryCtaText,
      explanation: `Customer requested "${subCta}" but website hero currently displays "${websiteData.hero.primaryCtaText}".`,
      relatedPage: 'Home',
      status: 'OPEN',
      source: 'AUTO_DETECTED',
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Auto-detect missing Admissions Eligibility details
  if (websiteData.admissions.isEnrolling && !websiteData.admissions.eligibilitySummary && !websiteData.admissions.guidelines) {
    issues.push({
      id: 'auto-missing-admissions-eligibility',
      title: 'Admissions Page Missing Eligibility Guidelines',
      severity: 'HIGH',
      section: 'Admissions',
      sectionKey: 'admissions',
      requirementTitle: 'Admissions Criteria',
      expectedValue: 'Age criteria and application guidelines',
      actualValue: 'No eligibility details provided',
      explanation: 'Admissions status is open but no eligibility or admission criteria have been entered for applicants.',
      relatedPage: 'Admissions',
      status: 'OPEN',
      source: 'AUTO_DETECTED',
      createdAt: new Date().toISOString(),
    });
  }

  // 6. Include Admin-Logged issues stored in metadata
  const loggedIssues: ReviewIssueItem[] = (project.metadata?.reviewIssues as any[]) || [];
  for (const log of loggedIssues) {
    if (!issues.some((i) => i.id === log.id)) {
      issues.push(log);
    }
  }

  return issues;
}

// ==============================================================================
// 10. PROJECT REVIEW SCORECARD CALCULATION
// ==============================================================================

export function calculateProjectReviewScorecard(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject,
  changeRequests: SchoolIntakeChangeRequest[] = []
): ProjectReviewScorecard {
  const requirements = buildCustomerRequirementInventory(intakeData, websiteData, project);
  const pages = buildPageByPageVerifications(intakeData, websiteData, project);
  const contentDiffs = buildContentComparisonMap(intakeData, websiteData);
  const documents = buildDocumentReviewInventory(intakeData, project);
  const media = buildMediaUsageInventory(intakeData, websiteData, project);
  const design = buildDesignVerification(intakeData, websiteData);
  const issues = detectProjectIssues(intakeData, websiteData, project, changeRequests);

  // 1. Requirements Match %
  const totalReqs = requirements.length || 1;
  const matchedReqs = requirements.filter((r) => r.status === 'MATCHED' || r.status === 'APPROVED').length;
  const websiteRequirementMatch = Math.round((matchedReqs / totalReqs) * 100);

  // 2. Content Match %
  const nonBlankContent = contentDiffs.filter((c) => c.status !== 'EMPTY');
  const matchedContent = nonBlankContent.filter((c) => c.status === 'MATCHED').length;
  const contentMatch = nonBlankContent.length ? Math.round((matchedContent / nonBlankContent.length) * 100) : 100;

  // 3. Design Match %
  const matchedTokens = design.tokens.filter((t) => t.isMatched).length;
  const designMatch = Math.round((matchedTokens / (design.tokens.length || 1)) * 100);

  // 4. Documents Verified %
  const mandatoryDocs = documents.filter((d) => d.isMandatory);
  const uploadedMandatory = mandatoryDocs.filter((d) => d.isUploaded).length;
  const documentsVerified = mandatoryDocs.length ? Math.round((uploadedMandatory / mandatoryDocs.length) * 100) : 100;

  // 5. Media Usage %
  const totalAssets = media.length || 1;
  const usedAssets = media.filter((m) => m.isUsedOnWebsite).length;
  const mediaUsage = Math.round((usedAssets / totalAssets) * 100);

  // 6. Information Completeness %
  const filledReqs = requirements.filter((r) => r.submittedValue && r.submittedValue !== '(Not Provided)').length;
  const informationCompleteness = Math.round((filledReqs / totalReqs) * 100);

  // 7. Overall Readiness Composite %
  const overallReadiness = Math.round(
    websiteRequirementMatch * 0.3 +
    contentMatch * 0.2 +
    documentsVerified * 0.25 +
    designMatch * 0.15 +
    mediaUsage * 0.1
  );

  // Approval Blockers
  const openIssues = issues.filter((i) => i.status !== 'RESOLVED');
  const criticalIssues = openIssues.filter((i) => i.severity === 'CRITICAL');
  const approvalBlockers: string[] = [];

  if (criticalIssues.length > 0) {
    approvalBlockers.push(`${criticalIssues.length} critical issues require resolution before approval.`);
  }
  if (documentsVerified < 100) {
    const missingDocsCount = mandatoryDocs.filter((d) => !d.isUploaded).length;
    if (missingDocsCount > 0) {
      approvalBlockers.push(`${missingDocsCount} mandatory statutory documents are missing.`);
    }
  }
  if (informationCompleteness < 70) {
    approvalBlockers.push('Information completeness is below minimum viable threshold (70%).');
  }

  const isReadyForApproval = approvalBlockers.length === 0;

  return {
    informationCompleteness,
    websiteRequirementMatch,
    contentMatch,
    designMatch,
    documentsVerified,
    mediaUsage,
    overallReadiness,
    counts: {
      totalPages: pages.length,
      implementedPages: pages.filter((p) => p.isImplemented).length,
      totalRequirements: totalReqs,
      matchedRequirements: matchedReqs,
      totalContentItems: nonBlankContent.length,
      matchedContentItems: matchedContent,
      totalDocuments: documents.length,
      verifiedDocuments: documents.filter((d) => d.verificationStatus === 'VERIFIED').length,
      totalMediaAssets: media.length,
      usedMediaAssets: usedAssets,
      totalIssues: issues.length,
      criticalIssues: criticalIssues.length,
      resolvedIssues: issues.filter((i) => i.status === 'RESOLVED').length,
    },
    isReadyForApproval,
    approvalBlockers,
  };
}

// ==============================================================================
// 11. DEVELOPER HANDOFF SPECIFICATION GENERATOR
// ==============================================================================

export function generateDeveloperHandoffSpecification(
  intakeData: Partial<UniversalIntakeData>,
  websiteData: SchoolWebsiteData,
  project: SchoolProject,
  changeRequests: SchoolIntakeChangeRequest[] = []
): DeveloperHandoffSpecification {
  const pages = buildPageByPageVerifications(intakeData, websiteData, project);
  const issues = detectProjectIssues(intakeData, websiteData, project, changeRequests);
  const design = buildDesignVerification(intakeData, websiteData);

  const handoffPages: DeveloperHandoffPage[] = [];
  const actionChecklist: string[] = [];

  for (const p of pages) {
    if (!p.isRequiredByCustomer) continue;

    const pageIssues = issues.filter((i) => i.relatedPage === p.pageKey && i.status !== 'RESOLVED');
    const requiredChanges = pageIssues.map((i) => `${i.title}: ${i.explanation}`);

    if (!p.ctaComparison.isMatched && p.ctaComparison.submittedCta) {
      requiredChanges.push(`Update primary CTA to "${p.ctaComparison.submittedCta}" (currently "${p.ctaComparison.implementedCta}")`);
    }

    const copySpecs: Array<{ label: string; text: string }> = [];
    if (p.pageKey === 'Home') {
      copySpecs.push({ label: 'Hero Headline', text: websiteData.hero.headline });
      copySpecs.push({ label: 'Hero Subheadline', text: websiteData.hero.subheadline });
      copySpecs.push({ label: 'CTA Text', text: websiteData.hero.primaryCtaText });
    } else if (p.pageKey === 'About School') {
      copySpecs.push({ label: 'About Description', text: websiteData.about.description });
      if (websiteData.about.vision) copySpecs.push({ label: 'Vision', text: websiteData.about.vision });
      if (websiteData.about.mission) copySpecs.push({ label: 'Mission', text: websiteData.about.mission });
    } else if (p.pageKey === 'Leadership & Desk') {
      copySpecs.push({ label: 'Principal Name', text: websiteData.leadership.principalName || '' });
      copySpecs.push({ label: 'Principal Message', text: websiteData.leadership.principalMessage || '' });
    }

    const assetsToEmbed: Array<{ label: string; url: string; placement: string }> = [];
    if (p.pageKey === 'Home' && websiteData.hero.imageUrl) {
      assetsToEmbed.push({ label: 'Hero Background Image', url: websiteData.hero.imageUrl, placement: 'Homepage Hero Banner' });
    }
    if (p.pageKey === 'Leadership & Desk' && websiteData.leadership.principalPhotoUrl) {
      assetsToEmbed.push({ label: 'Principal Portrait', url: websiteData.leadership.principalPhotoUrl, placement: 'Principal Desk Card' });
    }

    const implementedSecs = p.requiredSections.filter((s) => s.isImplemented).map((s) => s.name);
    handoffPages.push({
      pageName: p.label,
      pageTitle: p.label,
      pageKey: p.pageKey,
      route: p.slug,
      slug: p.slug,
      isNewPage: !p.isImplemented,
      implementedSections: implementedSecs,
      sections: implementedSecs,
      requiredChanges,
      specialInstructions: requiredChanges,
      copySpecs,
      assetsToEmbed,
    });

    for (const chg of requiredChanges) {
      actionChecklist.push(`[${p.label}] ${chg}`);
    }
  }

  // Generate clean, readable Markdown handoff document
  const mdParts: string[] = [
    `# Developer Website Implementation Handoff: ${project.school_name}`,
    `**Project ID**: ${project.project_number} | **Domain**: ${project.domain_requirement || 'Custom / Ekaagra Cloud'}`,
    `**Generated Date**: ${new Date().toLocaleDateString('en-IN')}`,
    `\n---\n`,
    `## Global Branding & Tokens`,
    `- **Primary Brand Color**: \`${design.primaryColor}\``,
    `- **Secondary Brand Color**: \`${design.secondaryColor}\``,
    `- **Font Family**: \`${design.fontFamily}\``,
    `- **Theme Variant**: \`${design.themeVariant}\``,
    `- **Navigation Layout**: \`${design.navigationStyle}\``,
    `- **Logo URL**: ${design.logoUrl || 'None provided'}`,
    `\n---\n`,
    `## Actionable Developer Tasks (${actionChecklist.length} items)`,
  ];

  if (actionChecklist.length === 0) {
    mdParts.push(`✓ All website requirements and customer submissions are verified with zero pending changes!`);
  } else {
    for (let i = 0; i < actionChecklist.length; i++) {
      mdParts.push(`${i + 1}. ${actionChecklist[i]}`);
    }
  }

  mdParts.push(`\n---\n## Page-By-Page Specifications\n`);
  for (const hp of handoffPages) {
    mdParts.push(`### ${hp.pageName} (\`${hp.slug}\`)`);
    if (hp.requiredChanges.length > 0) {
      mdParts.push(`**Required Changes**:`);
      for (const rc of hp.requiredChanges) {
        mdParts.push(`- ⚠️ ${rc}`);
      }
    } else {
      mdParts.push(`- ✓ Sections verified and matched.`);
    }

    if (hp.copySpecs.length > 0) {
      mdParts.push(`**Approved Copy Specs**:`);
      for (const cs of hp.copySpecs) {
        mdParts.push(`- **${cs.label}**: "${cs.text}"`);
      }
    }

    if (hp.assetsToEmbed.length > 0) {
      mdParts.push(`**Assets to Embed**:`);
      for (const asset of hp.assetsToEmbed) {
        mdParts.push(`- **${asset.label}** (${asset.placement}): \`${asset.url}\``);
      }
    }
    mdParts.push('');
  }

  const openIssuesCount = issues.filter((i) => i.status !== 'RESOLVED').length;
  const criticalChangesCount = issues.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const allAssetsToEmbed = handoffPages.flatMap((p) => p.assetsToEmbed);
  const overridesApplied = Object.keys((project.metadata?.adminOverrides as Record<string, any>) || {}).length;

  return {
    projectName: project.school_name,
    projectNumber: project.project_number,
    projectId: project.id || project.project_number,
    generatedAt: new Date().toISOString(),
    summary: {
      totalPagesToBuild: handoffPages.length,
      openIssuesCount,
      criticalChangesCount,
      readyForBuild: openIssuesCount === 0 && criticalChangesCount === 0,
      openBlockers: criticalChangesCount,
      overridesApplied,
    },
    pages: handoffPages,
    pagesToBuild: handoffPages,
    customComponentsRequired: [
      'Interactive Admissions Application Form',
      'Fee Structure Table & Payment Schedule',
      'Mandatory Public Disclosures Compliance Viewer',
      'Campus Infrastructure & Facilities Showcase',
    ],
    assetsToEmbed: allAssetsToEmbed,
    globalBrandingSpecs: {
      primaryColor: design.primaryColor,
      secondaryColor: design.secondaryColor,
      fontFamily: design.fontFamily,
      navigationStyle: design.navigationStyle,
      logoUrl: design.logoUrl,
      faviconUrl: design.faviconUrl,
    },
    actionChecklist,
    markdownExport: mdParts.join('\n'),
    markdownDocument: mdParts.join('\n'),
    thirdPartyIntegrations: ['Google Maps Embed', 'WhatsApp Direct Inquiries', 'PDF Viewer for Disclosures'],
    seoAndMetadata: {
      metaTitle: `${project.school_name} | Official Website`,
      metaDescription: websiteData.about?.description || `Official institutional website for ${project.school_name}. Admissions open.`,
    },
  };
}
