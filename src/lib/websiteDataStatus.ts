/**
 * ==============================================================================
 * CENTRALIZED WEBSITE DATA STATUS & REQUIREMENTS ENGINE
 * File: src/lib/websiteDataStatus.ts
 * ==============================================================================
 *
 * Core architectural principle:
 * Establish an authoritative requirements registry and status model so that
 * no component hardcodes readiness rules or misinterprets optional / not-applicable
 * fields as missing.
 */

import type { UniversalIntakeData } from './types';
import { buildSchoolWebsiteDataFromIntake, type SchoolWebsiteData } from './schoolWebsiteContract';
import { validateCrossSectionConsistency, type DataConflict } from './dataConsistencyEngine';
import {
  aggregateUniversalAssets,
  aggregateUniversalDocuments,
  aggregateUniversalFacilities,
  calculateUniversalReadiness,
  PUBLICATION_REQUIREMENT_KEYS,
} from './universalVerificationEngine';
import { resolveRemediationDestination } from './remediationRegistry';

export type RequirementScope = 'REQUIRED' | 'OPTIONAL' | 'CONDITIONAL' | 'NOT_APPLICABLE';
export type CollectionStatus = 'COLLECTED' | 'INCOMPLETE';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'NEEDS_REVIEW' | 'REJECTED';
export type WebsiteReadinessStatus = 'WEBSITE_READY' | 'BLOCKED' | 'NOT_APPLICABLE';

export type SectionStatus = 'READY' | 'INCOMPLETE' | 'BLOCKED' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';

export type GlobalWebsiteStatus =
  | 'DRAFT'
  | 'INCOMPLETE'
  | 'READY_FOR_REVIEW'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'LOCKED'
  | 'PUBLISHED';

export interface WebsiteRequirementDefinition {
  id: string;
  sectionKey: string;
  sectionLabel: string;
  field: string;
  label: string;
  scope: RequirementScope;
  conditionDescription?: string;
  websiteImpact: 'BLOCKING' | 'RECOMMENDED' | 'ENHANCING';
  verificationRequired: boolean;
  route: string;
  anchor: string;
}

export interface EvaluatedRequirement {
  id: string;
  definition: WebsiteRequirementDefinition;
  scope: RequirementScope;
  isCollected: boolean;
  isVerified: boolean;
  isWebsiteReady: boolean;
  isBlocked: boolean;
  blockerReason?: string;
  value?: any;
}

export interface SectionReadinessResult {
  sectionKey: string;
  sectionLabel: string;
  requiredTotal: number;
  requiredCompleted: number;
  requiredVerified: number;
  conditionalRequiredTotal: number;
  conditionalRequiredCompleted: number;
  optionalTotal: number;
  optionalCompleted: number;
  notApplicableCount: number;
  blockedCount: number;
  missingRequired: string[];
  blockers: Array<{
    id: string;
    title: string;
    description: string;
    field: string;
    route: string;
    anchor: string;
    fixAction: string;
  }>;
  status: SectionStatus;
  percentage: number;
}

export interface GlobalReadinessResult {
  score: number;
  status: GlobalWebsiteStatus;
  isPublishable: boolean;
  totalRequirements: number;
  verifiedCount: number;
  notApplicableCount: number;
  blockers: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    title: string;
    description: string;
    section: string;
    field: string;
    route: string;
    anchor: string;
    fixAction: string;
  }>;
  warnings: Array<{
    id: string;
    title: string;
    description: string;
    section: string;
    field?: string;
    route?: string;
    anchor?: string;
  }>;
  sections: Record<string, SectionReadinessResult>;
  lastCalculatedAt: string;
}

/**
 * Authoritative Master Requirements Registry for Institutional Website Launch.
 */
export const WEBSITE_REQUIREMENTS_REGISTRY: WebsiteRequirementDefinition[] = [
  // ── 1. School Identity ──────────────────────────────────────────────────────
  {
    id: 'req_school_name',
    sectionKey: 'schoolProfile',
    sectionLabel: 'Identity & Legal Details',
    field: 'schoolProfile.schoolName',
    label: 'Official School Name',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-school-name',
  },
  {
    id: 'req_school_address',
    sectionKey: 'campuses',
    sectionLabel: 'Campus Structure',
    field: 'campuses[0].address',
    label: 'Primary Campus Official Address',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-campus-address',
  },
  {
    id: 'req_school_phone',
    sectionKey: 'schoolProfile',
    sectionLabel: 'Identity & Legal Details',
    field: 'schoolProfile.officialPhone',
    label: 'Official Phone Number',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-school-phone',
  },
  {
    id: 'req_school_email',
    sectionKey: 'schoolProfile',
    sectionLabel: 'Identity & Legal Details',
    field: 'schoolProfile.officialEmail',
    label: 'Official Email Address',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-school-email',
  },
  {
    id: 'req_school_board',
    sectionKey: 'schoolProfile',
    sectionLabel: 'Identity & Legal Details',
    field: 'schoolProfile.board',
    label: 'Curriculum Affiliation Board',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-school-board',
  },

  // ── 2. Branding & Assets ────────────────────────────────────────────────────
  {
    id: 'req_school_logo',
    sectionKey: 'brandingDesign',
    sectionLabel: 'Brand Identity',
    field: 'brandingDesign.logo',
    label: 'Official High-Resolution School Crest / Logo',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-school-logo',
  },
  {
    id: 'req_hero_image',
    sectionKey: 'campusImages',
    sectionLabel: 'Campus Photography',
    field: 'campusImages.primaryHero',
    label: 'Campus Main Facade / Hero Photograph',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-campus-hero',
  },

  // ── 3. Leadership & Content ─────────────────────────────────────────────────
  {
    id: 'req_principal_name',
    sectionKey: 'leadership',
    sectionLabel: 'Leadership & Management',
    field: 'leadership.principalName',
    label: 'Head of Institution / Principal Name',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-principal-name',
  },
  {
    id: 'req_principal_portrait',
    sectionKey: 'leadership',
    sectionLabel: 'Leadership & Management',
    field: 'leadership.principalPhoto',
    label: 'Principal Official Portrait Photo',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-principal-portrait',
  },
  {
    id: 'req_about_school',
    sectionKey: 'schoolContent',
    sectionLabel: 'Story & Philosophy',
    field: 'schoolContent.aboutSchool',
    label: 'Institutional Overview / About School',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-about-school',
  },
  {
    id: 'req_vision_mission',
    sectionKey: 'schoolContent',
    sectionLabel: 'Story & Philosophy',
    field: 'schoolContent.vision',
    label: 'Vision & Mission Statements',
    scope: 'OPTIONAL',
    websiteImpact: 'RECOMMENDED',
    verificationRequired: false,
    route: '/schools/onboarding/[token]',
    anchor: 'field-vision',
  },

  // ── 4. Academics & Facilities ───────────────────────────────────────────────
  {
    id: 'req_academic_classes',
    sectionKey: 'institutionStructure',
    sectionLabel: 'Academics & Curriculum',
    field: 'institutionStructure.classes',
    label: 'Classes & Grade Hierarchy',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-academic-classes',
  },
  {
    id: 'req_campus_facilities',
    sectionKey: 'campusFacilities',
    sectionLabel: 'Campus Facilities',
    field: 'campusFacilities.items',
    label: 'Campus Facilities & Learning Spaces',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-campus-facilities',
  },

  // ── 5. Conditional Modules ──────────────────────────────────────────────────
  {
    id: 'req_transport_fleet',
    sectionKey: 'transportConfig',
    sectionLabel: 'Transport & Fleet',
    field: 'transportConfig.routes',
    label: 'Bus Routes, Fleet & Stop Details',
    scope: 'CONDITIONAL',
    conditionDescription: 'Required only if school operates official student transportation.',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-transport-routes',
  },
  {
    id: 'req_hostel_residential',
    sectionKey: 'hostelConfig',
    sectionLabel: 'Residential Hostel',
    field: 'hostelConfig.buildings',
    label: 'Hostel Buildings, Capacity & Amenities',
    scope: 'CONDITIONAL',
    conditionDescription: 'Required only if school offers residential boarding facilities.',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-hostel-buildings',
  },

  // ── 6. Statutory Compliance & Disclosures ───────────────────────────────────
  {
    id: 'req_affiliation_cert',
    sectionKey: 'assetChecklist',
    sectionLabel: 'Statutory Documents',
    field: 'assetChecklist.cert-affiliation',
    label: 'Board Affiliation Letter / Grant Order',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'asset-row-cert-affiliation',
  },
  {
    id: 'req_recognition_noc',
    sectionKey: 'assetChecklist',
    sectionLabel: 'Statutory Documents',
    field: 'assetChecklist.cert-state-noc',
    label: 'State Government Recognition / NOC',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'asset-row-cert-state-noc',
  },
  {
    id: 'req_fire_safety',
    sectionKey: 'assetChecklist',
    sectionLabel: 'Statutory Documents',
    field: 'assetChecklist.cert-safety',
    label: 'Fire Safety & Building Certificate',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'asset-row-cert-safety',
  },
  {
    id: 'req_mandatory_disclosure',
    sectionKey: 'assetChecklist',
    sectionLabel: 'Statutory Documents',
    field: 'assetChecklist.cbse-sarus-disclosure',
    label: 'Mandatory Public Disclosure (SARAS / Appendix IX)',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'asset-row-cbse-sarus-disclosure',
  },

  // ── 7. Admin & Sign-Off Authorization ───────────────────────────────────────
  {
    id: 'req_admin_contact',
    sectionKey: 'usersAccess',
    sectionLabel: 'Authorized Sign-Off',
    field: 'usersAccess.superAdminFullName',
    label: 'Designated Administrator Name & Contact',
    scope: 'REQUIRED',
    websiteImpact: 'BLOCKING',
    verificationRequired: true,
    route: '/schools/onboarding/[token]',
    anchor: 'field-admin-contact',
  },
];

/**
 * Evaluates whether an onboarding section number is applicable for the given school.
 */
export function isSectionApplicableToSchool(
  sectionNumber: number,
  intakeData: Partial<UniversalIntakeData>
): boolean {
  const prof = intakeData.schoolProfile || ({} as any);
  const transport = intakeData.transportConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);

  // Section 8: Transport
  if (sectionNumber === 8) {
    if (transport.status === 'no' || transport.enabled === false) {
      return false;
    }
    return true;
  }

  // Section 9 / 15: Hostel
  if (sectionNumber === 9 || sectionNumber === 15) {
    const isDay =
      prof.schoolType === 'day_school' ||
      prof.residentialStatus === 'day_school' ||
      hostel.status === 'no' ||
      hostel.isApplicable === false;
    const isRes =
      prof.schoolType === 'boarding' ||
      prof.schoolType === 'residential' ||
      prof.residentialStatus === 'residential' ||
      prof.residentialStatus === 'both_day_and_residential';
    if (isDay && !isRes) {
      return false;
    }
    return true;
  }

  return true;
}

export interface WebsiteBlockerItem {
  id: string;
  fieldKey: string;
  title: string;
  reason: string;
  targetSection: number;
  targetAnchor: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface WebsiteReadinessEvaluation {
  isReadyForSubmission: boolean;
  overallReadinessScore: number;
  blockers: WebsiteBlockerItem[];
  warnings: Array<{ id: string; title: string; reason: string }>;
  applicableRequirementsCount: number;
  satisfiedRequirementsCount: number;
}

/**
 * Evaluates global website launch readiness, computing true score and detecting blockers
 * with direct section and anchor targets for instant remediation.
 */
export function evaluateWebsiteReadiness(
  intakeData: Partial<UniversalIntakeData>
): WebsiteReadinessEvaluation {
  const prof = intakeData.schoolProfile || ({} as any);
  const campuses = intakeData.campuses || [];
  const primaryCampus = campuses[0] || ({} as any);
  const content = intakeData.schoolContent || ({} as any);
  const checklist = intakeData.assetChecklist?.items || [];

  const blockers: WebsiteBlockerItem[] = [];
  const warnings: Array<{ id: string; title: string; reason: string }> = [];

  // Check School Name
  const schoolName = (prof.schoolName || prof.name || '').trim();
  if (!schoolName) {
    blockers.push({
      id: 'blocker-school-name',
      fieldKey: 'schoolProfile.schoolName',
      title: 'School Name is Missing',
      reason: 'Official school name is required to generate the website.',
      targetSection: 1,
      targetAnchor: 'school-name',
      severity: 'CRITICAL',
    });
  }

  // Check Affiliation / Accreditation Certificate
  const affiliationDoc = checklist.find(
    (i: any) => i.id === 'cert-affiliation' || i.id?.includes('affiliation')
  );
  const hasAffiliation =
    affiliationDoc && (affiliationDoc.status === 'provided' || affiliationDoc.fileUrl);
  if (!hasAffiliation && prof.board && prof.board !== 'State Board Non-Affiliated') {
    blockers.push({
      id: 'blocker-affiliation-doc',
      fieldKey: 'compliance.cert-affiliation',
      title: 'Affiliation Certificate Missing',
      reason: 'Mandatory statutory affiliation grant letter must be provided.',
      targetSection: 17,
      targetAnchor: 'cert-affiliation',
      severity: 'CRITICAL',
    });
  }

  let totalApplicable = 5;
  let satisfied = 0;

  if (schoolName) satisfied++;
  if (prof.officialEmail || prof.contactEmail) satisfied++;
  if (primaryCampus.address || prof.address) satisfied++;
  if (hasAffiliation || !prof.board) satisfied++;
  if (content.aboutSchool) satisfied++;

  const overallReadinessScore =
    blockers.length === 0 ? 100 : Math.round((satisfied / totalApplicable) * 100);

  return {
    isReadyForSubmission: blockers.length === 0,
    overallReadinessScore,
    blockers,
    warnings,
    applicableRequirementsCount: totalApplicable,
    satisfiedRequirementsCount: satisfied,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// AUTHORITATIVE UNIFIED PUBLICATION READINESS PIPELINE
// ────────────────────────────────────────────────────────────────────────────

export interface PublicationBlocker {
  id: string;
  section: string;
  field: string;
  status: string; // 'MISSING' | 'UNVERIFIED' | 'BLOCKED'
  severity: 'CRITICAL' | 'HIGH' | 'REQUIRED';
  route: string;
  anchor: string;
  reason: string;
  source: string;
  sourceLabel: string;
  sourceSection: string;
  sourceField?: string;
  remediationAnchor?: string;
  applicability: string;
  title: string;
  pageLabel?: string;
  isStatutory?: boolean;
  key?: string;
  destination?: any;
  debug?: any;
}

export interface PublicationWarning {
  id: string;
  section: string;
  field?: string;
  title: string;
  reason: string;
  route?: string;
  anchor?: string;
  source?: string;
  sourceLabel?: string;
  destination?: any;
}

export interface WebsitePublicationValidationResult {
  isReady: boolean;
  readinessScore: number;
  blockers: PublicationBlocker[];
  warnings: PublicationWarning[];
  conflicts: DataConflict[];
  requiredIncomplete: Array<{ id: string; label: string; section: string; field: string; reason: string }>;
  notApplicable: Array<{ id: string; label: string; section: string; reason: string }>;
  verified: Array<{ id: string; label: string; section: string }>;
  websiteReady: Array<{ id: string; label: string; section: string }>;
  counts: {
    blockers: number;
    warnings: number;
    conflicts: number;
    requiredIncomplete: number;
    verified: number;
    notApplicable: number;
  };
  metrics: {
    totalRequirements: number;
    verifiedCount: number;
    needsAttentionCount: number;
    publicationBlockersCount: number;
    optionalCount: number;
    notApplicableCount: number;
  };
  categoryScores: {
    identity: number;
    content: number;
    facilities: number;
    assets: number;
    compliance: number;
    configuration: number;
    confirmation: number;
  };
  normalizedData: SchoolWebsiteData;
  // Compatibility properties for UI components
  hasPublicationBlockers: boolean;
  publicationBlockers: PublicationBlocker[];
  overallScore: number;
  isReadyForSubmission: boolean;
  recommendations: PublicationWarning[];
}

/**
 * Authoritative Publication-Readiness Pipeline:
 *
 *   onboarding data
 *         ↓
 *   normalize data (buildSchoolWebsiteDataFromIntake)
 *         ↓
 *   evaluate requirements & conditional applicability
 *         ↓
 *   evaluate cross-section consistency (validateCrossSectionConsistency)
 *         ↓
 *   evaluate website readiness & produce authoritative blocker list
 *         ↓
 *   Final Review UI & Submit & Lock
 *
 * Both the Final Review UI and Submit & Lock MUST consume this EXACT result.
 */
export function evaluateWebsitePublicationReadiness(
  intakeData: Partial<UniversalIntakeData>
): WebsitePublicationValidationResult {
  // 1. Authoritative Data Normalization (zero fake fallbacks)
  const normalizedData = buildSchoolWebsiteDataFromIntake(intakeData, false);

  // 2. Cross-Section Consistency Validation
  const consistencyResult = validateCrossSectionConsistency(intakeData);

  // 3. Canonical Universal Aggregations
  const allAssets = aggregateUniversalAssets(intakeData);
  const allDocuments = aggregateUniversalDocuments(intakeData);
  const allFacilities = aggregateUniversalFacilities(intakeData, allAssets);
  const universalReadiness = calculateUniversalReadiness(
    intakeData,
    allAssets,
    allDocuments,
    allFacilities
  );

  const blockers: PublicationBlocker[] = [];
  const warnings: PublicationWarning[] = [];
  const requiredIncomplete: Array<{ id: string; label: string; section: string; field: string; reason: string }> = [];
  const notApplicable: Array<{ id: string; label: string; section: string; reason: string }> = [];
  const verified: Array<{ id: string; label: string; section: string }> = [];
  const websiteReady: Array<{ id: string; label: string; section: string }> = [];

  // ── 4. Cross-Section Consistency Integration ───────────────────────────────
  for (const conflict of consistencyResult.conflicts) {
    if (conflict.severity === 'CRITICAL' || conflict.severity === 'HIGH') {
      blockers.push({
        id: conflict.id,
        section: conflict.conflictingSections[0] || 'schoolProfile',
        field: conflict.fieldA?.field || 'crossSection',
        status: 'BLOCKED',
        severity: 'CRITICAL',
        route: '/schools/onboarding/[token]',
        anchor: conflict.remediationAnchor || 'field-cross-section',
        reason: `${conflict.title}: ${conflict.description}`,
        source: 'Cross-Section Consistency Engine',
        sourceLabel: 'Cross-Section Consistency Engine',
        sourceSection: conflict.conflictingSections[0] || 'schoolProfile',
        sourceField: conflict.fieldA?.field || 'crossSection',
        remediationAnchor: conflict.remediationAnchor || 'field-cross-section',
        applicability: 'CRITICAL_CONSISTENCY',
        title: conflict.title,
        key: conflict.code,
        pageLabel: 'Cross-Section Integrity',
        isStatutory: false,
      });
      requiredIncomplete.push({
        id: conflict.id,
        label: conflict.title,
        section: conflict.conflictingSections[0] || 'schoolProfile',
        field: conflict.fieldA?.field || 'crossSection',
        reason: conflict.description,
      });
    } else {
      warnings.push({
        id: conflict.id,
        section: conflict.conflictingSections[0] || 'schoolProfile',
        field: conflict.fieldA?.field,
        title: conflict.title,
        reason: conflict.description,
        route: '/schools/onboarding/[token]',
        anchor: conflict.remediationAnchor,
        source: 'Cross-Section Consistency Engine',
        sourceLabel: 'Cross-Section Consistency Engine',
      });
    }
  }

  // ── 5. Publication Blockers from Canonical Verification ─────────────────────
  for (const ub of universalReadiness.publicationBlockers) {
    const dest = ub.destination || resolveRemediationDestination(ub.key || ub.id);
    blockers.push({
      id: ub.id,
      section: ub.sourceSection || 'schoolProfile',
      field: ub.sourceField || ub.key || ub.id,
      status: 'MISSING',
      severity: 'REQUIRED',
      route: '/schools/onboarding/[token]',
      anchor: ub.remediationAnchor || dest?.anchor || 'field-unknown',
      reason: ub.reason,
      source: ub.sourceLabel || 'Universal Verification',
      sourceLabel: ub.sourceLabel || 'Universal Verification',
      sourceSection: ub.sourceSection || 'schoolProfile',
      sourceField: ub.sourceField || ub.key || ub.id,
      remediationAnchor: ub.remediationAnchor || dest?.anchor || 'field-unknown',
      applicability: 'REQUIRED',
      title: ub.title,
      pageLabel: ub.sourceLabel,
      isStatutory: Boolean(
        ub.id.includes('cert') ||
        ub.id.includes('doc') ||
        ub.key?.includes('statutory') ||
        ub.key?.includes('affiliation')
      ),
      key: ub.key || ub.id,
      destination: dest,
      debug: ub.debug,
    });
    requiredIncomplete.push({
      id: ub.id,
      label: ub.title,
      section: ub.sourceSection || 'schoolProfile',
      field: ub.sourceField || ub.key || ub.id,
      reason: ub.reason,
    });
  }

  // ── 6. Mandatory School Logo Guardrail ──────────────────────────────────────
  if (!normalizedData.branding.logoUrl) {
    if (!blockers.some((b) => b.id.includes('logo') || b.key === 'asset_school_logo' || b.field.includes('logo'))) {
      const dest = resolveRemediationDestination('req_school_logo');
      blockers.push({
        id: 'blocker-school-logo',
        section: 'brandingDesign',
        field: 'brandingDesign.logo',
        status: 'MISSING',
        severity: 'REQUIRED',
        route: '/schools/onboarding/[token]',
        anchor: dest?.anchor || 'field-school-logo',
        reason: 'High-resolution official school crest or logo must be uploaded before website publication.',
        source: 'Section 4 — Branding & Design',
        sourceLabel: 'Section 4 — Branding & Design',
        sourceSection: 'brandingDesign',
        sourceField: 'brandingDesign.logo',
        remediationAnchor: dest?.anchor || 'field-school-logo',
        applicability: 'REQUIRED',
        title: 'Official School Crest / Logo',
        pageLabel: 'Global Branding',
        isStatutory: true,
        key: 'asset_school_logo',
        destination: dest,
      });
      requiredIncomplete.push({
        id: 'blocker-school-logo',
        label: 'Official School Crest / Logo',
        section: 'brandingDesign',
        field: 'brandingDesign.logo',
        reason: 'Official school crest or logo is required.',
      });
    }
  } else {
    verified.push({
      id: 'req_school_logo',
      label: 'Official School Crest / Logo',
      section: 'brandingDesign',
    });
    websiteReady.push({
      id: 'branding_logo',
      label: 'Official School Logo',
      section: 'brandingDesign',
    });
  }

  // ── 7. Conditional Modules Applicability ────────────────────────────────────
  const transport = intakeData.transportConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);
  const fees = intakeData.feesConfiguration || ({} as any);
  const prof = intakeData.schoolProfile || ({} as any);

  // Transport: If disabled, mark NOT_APPLICABLE and ensure NO transport blockers exist
  const isTransportDisabled = transport.status === 'no' || transport.enabled === false;
  if (isTransportDisabled) {
    notApplicable.push({
      id: 'transport',
      label: 'Student Transportation',
      section: 'transportConfig',
      reason: "School does not operate official student transportation (status: 'no').",
    });
  }

  // Hostel: If day school or hostel disabled, mark NOT_APPLICABLE
  const isHostelDisabled =
    !normalizedData.config.showHostel ||
    hostel.status === 'no' ||
    hostel.isApplicable === false;
  if (isHostelDisabled) {
    notApplicable.push({
      id: 'hostel',
      label: 'Residential Boarding',
      section: 'hostelConfig',
      reason: 'School is a day institution / residential boarding not offered.',
    });
  }

  // Multi-campus: If single campus, mark multi-campus features NOT_APPLICABLE
  if (!prof.isMultiCampus) {
    notApplicable.push({
      id: 'multi_campus',
      label: 'Multi-Campus Architecture',
      section: 'campuses',
      reason: 'Institution operates a single consolidated campus.',
    });
  }

  // Fees: Optional module - if not configured, mark NOT_APPLICABLE so it NEVER blocks
  if (fees.hasFeeStructure === false && (!fees.items || fees.items.length === 0)) {
    notApplicable.push({
      id: 'fees_schedule',
      label: 'Online Fee Schedule Publication',
      section: 'feesConfiguration',
      reason: 'Fee schedules are optional and managed via institutional office.',
    });
  }

  // Gallery: Enhancing module - if not uploaded, mark NOT_APPLICABLE for blockers
  if (normalizedData.gallery.length === 0) {
    notApplicable.push({
      id: 'gallery',
      label: 'Campus Photo Gallery',
      section: 'campusImages',
      reason: 'Gallery is an optional enhancing feature.',
    });
  }

  // ── 8. Warnings & Recommendations Integration ───────────────────────────────
  for (const rec of universalReadiness.recommendations) {
    warnings.push({
      id: rec.id,
      section: rec.sourceSection || 'schoolProfile',
      title: rec.title,
      reason: rec.reason,
      route: rec.destination?.route || '/schools/onboarding/[token]',
      anchor: rec.remediationAnchor,
      source: rec.sourceLabel || 'Universal Verification',
      destination: rec.destination,
    });
  }

  // ── 9. Verified & Website Ready Elements Attribution ────────────────────────
  if (normalizedData.school.name) {
    verified.push({ id: 'school_name', label: 'Official School Name', section: 'schoolProfile' });
    websiteReady.push({ id: 'school_name', label: 'Official School Name', section: 'schoolProfile' });
  }
  if (normalizedData.contact.address) {
    verified.push({ id: 'school_address', label: 'Campus Address', section: 'campuses' });
    websiteReady.push({ id: 'school_address', label: 'Campus Address', section: 'campuses' });
  }
  if (normalizedData.contact.primaryPhone) {
    verified.push({ id: 'school_phone', label: 'Official Phone', section: 'schoolProfile' });
  }
  if (normalizedData.contact.primaryEmail) {
    verified.push({ id: 'school_email', label: 'Official Email', section: 'schoolProfile' });
  }
  if (normalizedData.leadership.principalName) {
    verified.push({ id: 'principal_name', label: 'Principal Name', section: 'leadership' });
    websiteReady.push({ id: 'principal_name', label: 'Principal Name', section: 'leadership' });
  }
  if (normalizedData.leadership.principalPhotoUrl) {
    verified.push({ id: 'principal_photo', label: 'Principal Portrait', section: 'leadership' });
    websiteReady.push({ id: 'principal_photo', label: 'Principal Portrait', section: 'leadership' });
  }
  if (normalizedData.hero.imageUrl) {
    verified.push({ id: 'hero_image', label: 'Hero Image', section: 'campusImages' });
    websiteReady.push({ id: 'hero_image', label: 'Hero Image', section: 'campusImages' });
  }

  for (const doc of allDocuments) {
    if (doc.status === 'verified') {
      verified.push({ id: doc.id, label: doc.documentName, section: doc.sourceSection });
      websiteReady.push({ id: doc.id, label: doc.documentName, section: doc.sourceSection });
    }
  }

  for (const fac of allFacilities) {
    if (fac.status === 'verified') {
      verified.push({ id: fac.key, label: fac.name, section: 'campusFacilities' });
      websiteReady.push({ id: fac.key, label: fac.name, section: 'campusFacilities' });
    }
  }

  // ── 10. Single Authoritative Readiness & Eligibility ────────────────────────
  const isReady = blockers.length === 0;
  const readinessScore = isReady ? 100 : Math.min(universalReadiness.overallScore, 95);

  const categoryScores = {
    ...universalReadiness.categoryScores,
    configuration: 100,
  };

  return {
    isReady,
    readinessScore,
    blockers,
    warnings,
    conflicts: consistencyResult.conflicts,
    requiredIncomplete,
    notApplicable,
    verified,
    websiteReady,
    counts: {
      blockers: blockers.length,
      warnings: warnings.length,
      conflicts: consistencyResult.conflicts.length,
      requiredIncomplete: requiredIncomplete.length,
      verified: verified.length,
      notApplicable: notApplicable.length,
    },
    metrics: {
      totalRequirements: universalReadiness.metrics.totalRequirements,
      verifiedCount: verified.length,
      needsAttentionCount: blockers.length + warnings.length,
      publicationBlockersCount: blockers.length,
      optionalCount: warnings.length,
      notApplicableCount: notApplicable.length,
    },
    categoryScores,
    normalizedData,
    // Compatibility aliases
    hasPublicationBlockers: blockers.length > 0,
    publicationBlockers: blockers,
    overallScore: readinessScore,
    isReadyForSubmission: isReady,
    recommendations: warnings,
  };
}

