/**
 * ==============================================================================
 * CENTRALIZED SCHOOL REVIEW & WEBSITE READINESS ENGINE
 * File: src/lib/schoolReviewEngine.ts
 * ==============================================================================
 *
 * Single Authoritative Source of Truth for:
 * - Submission Completeness vs Website Readiness
 * - Field-Level & Asset-Level Review Status
 * - Change Request Aggregation & Remediation Flow
 * - Central Review Checklist
 * - Server & Client Gated Provisioning Safety
 * - Verified Downstream Website Dataset Generation
 */

import type {
  SchoolProject,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  UniversalIntakeData,
  FieldReviewStatus,
  MediaReviewStatus,
} from './types';
import { aggregateUniversalAssets, type UniversalVerificationAsset } from './universalVerificationEngine';
import { validateCampusAcademicPayload } from './campusAcademicScopeService';
import { buildSchoolWebsiteDataFromIntake, type SchoolWebsiteData } from './schoolWebsiteContract';

export type SchoolSubmissionStatus = 'draft' | 'submitted' | 'complete' | 'incomplete';
export type SchoolContentReviewStatus = 'not_started' | 'in_review' | 'changes_requested' | 'ready_for_approval' | 'approved';
export type SchoolMediaReviewStatus = 'not_started' | 'in_review' | 'changes_requested' | 'ready_for_approval' | 'approved';
export type SchoolWebsiteReadinessStatus = 'BLOCKED' | 'READY';
export type SchoolProvisioningStatus = 'LOCKED' | 'READY' | 'HANDED_OFF';

export interface ReviewBlocker {
  id: string;
  title: string;
  reason: string;
  sectionKey: string;
  fieldKey?: string;
  assetId?: string;
  targetTab: 'overview' | 'intake' | 'media' | 'reviews' | 'provisioning';
  targetSection?: string;
  targetAnchor?: string;
  severity: 'CRITICAL' | 'WARNING';
}

export interface ReviewChecklistItem {
  id: string;
  label: string;
  status: 'passed' | 'warning' | 'blocked';
  note: string;
  targetTab: 'overview' | 'intake' | 'media' | 'reviews' | 'provisioning';
  targetSection?: string;
}

export interface SectionReviewSummary {
  sectionKey: string;
  sectionLabel: string;
  totalFields: number;
  verifiedCount: number;
  needsReviewCount: number;
  changesRequestedCount: number;
  status: 'approved' | 'needs_review' | 'changes_requested' | 'not_started';
}

export interface ActionRequiredItem {
  id: string;
  title: string;
  description: string;
  targetTab: 'overview' | 'intake' | 'media' | 'reviews' | 'provisioning';
  targetSection?: string;
  targetField?: string;
}

export interface OverallReviewEvaluation {
  submissionStatus: SchoolSubmissionStatus;
  submissionCompleteness: number;
  contentReviewStatus: SchoolContentReviewStatus;
  mediaReviewStatus: SchoolMediaReviewStatus;
  websiteReadiness: SchoolWebsiteReadinessStatus;
  websiteReadinessReason: string;
  provisioningStatus: SchoolProvisioningStatus;
  provisioningBlockersCount: number;
  changeRequestsSummary: {
    open: number;
    waitingForSchool: number;
    readyForReview: number;
    resolved: number;
    total: number;
  };
  overallReviewPercentage: number;
  sectionReviews: Record<string, SectionReviewSummary>;
  blockers: ReviewBlocker[];
  checklist: ReviewChecklistItem[];
  actionRequiredItems: ActionRequiredItem[];
  nextActionItem?: ActionRequiredItem;
  aggregatedAssets: UniversalVerificationAsset[];
}

/**
 * Definition of standard reviewable fields per section
 */
export interface ReviewableFieldDef {
  key: string;
  sectionKey: string;
  label: string;
  required: boolean;
  getter: (payload: UniversalIntakeData) => any;
}

export const CANONICAL_REVIEWABLE_FIELDS: ReviewableFieldDef[] = [
  // 1. School Profile
  {
    key: 'schoolProfile.schoolName',
    sectionKey: 'schoolProfile',
    label: 'Official School Name',
    required: true,
    getter: (p) => p.schoolProfile?.schoolName,
  },
  {
    key: 'schoolProfile.legalInstitutionName',
    sectionKey: 'schoolProfile',
    label: 'Legal Institution Name',
    required: false,
    getter: (p) => p.schoolProfile?.legalInstitutionName,
  },
  {
    key: 'schoolProfile.yearOfEstablishment',
    sectionKey: 'schoolProfile',
    label: 'Year Established',
    required: true,
    getter: (p) => p.schoolProfile?.yearOfEstablishment,
  },
  {
    key: 'schoolProfile.schoolType',
    sectionKey: 'schoolProfile',
    label: 'School Category / Type',
    required: true,
    getter: (p) => p.schoolProfile?.schoolType,
  },
  {
    key: 'schoolProfile.board',
    sectionKey: 'schoolProfile',
    label: 'Board / Affiliation Authority',
    required: true,
    getter: (p) => p.schoolProfile?.board,
  },
  {
    key: 'schoolProfile.affiliationNumber',
    sectionKey: 'schoolProfile',
    label: 'Affiliation / Registration Number',
    required: false,
    getter: (p) => p.schoolProfile?.affiliationNumber,
  },
  {
    key: 'schoolProfile.officialPhone',
    sectionKey: 'schoolProfile',
    label: 'Official Phone Number',
    required: true,
    getter: (p) => p.schoolProfile?.officialPhone,
  },
  {
    key: 'schoolProfile.officialEmail',
    sectionKey: 'schoolProfile',
    label: 'Official Email Address',
    required: true,
    getter: (p) => p.schoolProfile?.officialEmail,
  },

  // 2. Campus Information
  {
    key: 'campuses.mainCampusName',
    sectionKey: 'campuses',
    label: 'Main Campus Name',
    required: true,
    getter: (p) => p.campuses?.[0]?.name,
  },
  {
    key: 'campuses.mainCampusAddress',
    sectionKey: 'campuses',
    label: 'Main Campus Full Address',
    required: true,
    getter: (p) => p.campuses?.[0]?.address,
  },
  {
    key: 'campuses.mainCampusCity',
    sectionKey: 'campuses',
    label: 'City',
    required: true,
    getter: (p) => p.campuses?.[0]?.city,
  },
  {
    key: 'campuses.mainCampusState',
    sectionKey: 'campuses',
    label: 'State',
    required: true,
    getter: (p) => p.campuses?.[0]?.state,
  },
  {
    key: 'campuses.mainCampusPin',
    sectionKey: 'campuses',
    label: 'Postal PIN Code',
    required: true,
    getter: (p) => p.campuses?.[0]?.pin,
  },
  {
    key: 'campuses.mainCampusPhone',
    sectionKey: 'campuses',
    label: 'Campus Contact Phone',
    required: false,
    getter: (p) => p.campuses?.[0]?.contactPhone,
  },

  // 3. Academic Scope
  {
    key: 'academicScope.classesOffered',
    sectionKey: 'academicScope',
    label: 'Active Classes Offered',
    required: true,
    getter: (p) => (p.campuses?.[0]?.classesOffered?.length ? p.campuses[0].classesOffered : (p.institutionStructure?.classes || p.institutionStructure?.classesOfferedFrom)),
  },
  {
    key: 'academicScope.academicLevels',
    sectionKey: 'academicScope',
    label: 'Academic Levels Offered',
    required: true,
    getter: (p) => ((p.institutionStructure as any)?.academicLevels || (p.campuses?.[0]?.academicLevels)),
  },
  {
    key: 'academicScope.streams',
    sectionKey: 'academicScope',
    label: 'Senior Secondary Streams',
    required: false,
    getter: (p) => p.institutionStructure?.academicStreams,
  },

  // 4. Admissions
  {
    key: 'admissions.status',
    sectionKey: 'admissions',
    label: 'Admissions Open Status',
    required: true,
    getter: (p) => (p.admissions?.status !== undefined ? (p.admissions.status ? 'Open' : 'Closed') : 'Configured'),
  },
  {
    key: 'admissions.inchargeContact',
    sectionKey: 'admissions',
    label: 'Admissions Contact Person',
    required: false,
    getter: (p) => p.admissions?.contact?.name || p.admissions?.contact?.phone,
  },

  // 5. Fees Structure
  {
    key: 'fees.commonFees',
    sectionKey: 'fees',
    label: 'Fee Schedule & Breakdown',
    required: true,
    getter: (p) => (p.feesConfiguration?.commonFees?.length ? `${p.feesConfiguration.commonFees.length} Fee Items` : null),
  },

  // 6. Campus Facilities
  {
    key: 'facilities.selectedFacilities',
    sectionKey: 'facilities',
    label: 'Campus Facilities & Amenities',
    required: true,
    getter: (p) => {
      const c = p.campuses?.[0]?.facilities;
      if (Array.isArray(c) && c.length) return `${c.length} Facilities`;
      const f = p.facilitiesConfig?.facilities;
      if (f && Object.keys(f).length) return `${Object.keys(f).length} Facilities`;
      return null;
    },
  },

  // 7. Website Content
  {
    key: 'websiteContent.aboutSchool',
    sectionKey: 'websiteContent',
    label: 'About School Description',
    required: true,
    getter: (p) => p.schoolContent?.aboutSchool,
  },
  {
    key: 'websiteContent.principalMessage',
    sectionKey: 'websiteContent',
    label: "Principal / Director's Message",
    required: true,
    getter: (p) => p.leadership?.principalMessage,
  },
  {
    key: 'websiteContent.missionVision',
    sectionKey: 'websiteContent',
    label: 'Mission & Vision Statements',
    required: false,
    getter: (p) => p.schoolContent?.mission || p.schoolContent?.vision,
  },
];

/**
 * Main Authoritative Review State Evaluator
 */
export function evaluateSchoolReviewState(
  project: SchoolProject,
  submission: SchoolIntakeSubmission | null | undefined,
  changeRequests: SchoolIntakeChangeRequest[] = []
): OverallReviewEvaluation {
  const metadata = project.metadata || {};
  const fieldReviews = metadata.fieldReviews || {};
  const mediaReviews = metadata.mediaReviews || {};
  const finalApproval = metadata.finalApproval;

  const payload: UniversalIntakeData = (submission?.intake_payload as UniversalIntakeData) || ({} as any);
  const completeness = project.completeness_percentage || submission?.completeness_percentage || 0;

  // 1. Submission Status
  const isSubmissionComplete = completeness >= 100 && Boolean(submission);
  let submissionStatus: SchoolSubmissionStatus = 'draft';
  if (project.status === 'submitted' || project.status === 'resubmitted') {
    submissionStatus = isSubmissionComplete ? 'complete' : 'submitted';
  } else if (isSubmissionComplete) {
    submissionStatus = 'complete';
  } else if (completeness > 0) {
    submissionStatus = 'incomplete';
  }

  // 2. Change Requests Breakdown
  const crOpen = changeRequests.filter((cr) => cr.status === 'open').length;
  const crWaiting = changeRequests.filter((cr) => cr.status === 'waiting_for_school').length;
  const crReadyForReview = changeRequests.filter((cr) => cr.status === 'ready_for_review').length;
  const crResolved = changeRequests.filter((cr) => cr.status === 'resolved' || cr.status === 'approved' || cr.status === 'waived').length;
  const crTotal = changeRequests.length;

  const hasUnresolvedCRs = crOpen > 0 || crWaiting > 0 || crReadyForReview > 0;

  // 3. Field-Level Evaluation
  const blockers: ReviewBlocker[] = [];
  const actionRequiredItems: ActionRequiredItem[] = [];

  if (!isSubmissionComplete) {
    blockers.unshift({
      id: 'blocker-submission-incomplete',
      title: 'Incomplete Onboarding Submission',
      reason: submission ? `Intake submission is only ${completeness}% complete.` : 'No intake submission recorded.',
      sectionKey: 'schoolProfile',
      targetTab: 'overview',
      severity: 'CRITICAL',
    });
  }

  const sectionReviews: Record<string, SectionReviewSummary> = {
    schoolProfile: { sectionKey: 'schoolProfile', sectionLabel: 'School Profile', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    campuses: { sectionKey: 'campuses', sectionLabel: 'Campus Information', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    academicScope: { sectionKey: 'academicScope', sectionLabel: 'Academic Scope', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    admissions: { sectionKey: 'admissions', sectionLabel: 'Admissions & Incharge', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    fees: { sectionKey: 'fees', sectionLabel: 'Fee Structure', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    facilities: { sectionKey: 'facilities', sectionLabel: 'Facilities & Amenities', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
    websiteContent: { sectionKey: 'websiteContent', sectionLabel: 'Website Content', totalFields: 0, verifiedCount: 0, needsReviewCount: 0, changesRequestedCount: 0, status: 'not_started' },
  };

  let totalFieldCount = 0;
  let verifiedFieldCount = 0;

  CANONICAL_REVIEWABLE_FIELDS.forEach((fieldDef) => {
    const sec = sectionReviews[fieldDef.sectionKey];
    if (!sec) return;
    sec.totalFields++;
    totalFieldCount++;

    const submittedVal = submission ? fieldDef.getter(payload) : null;
    const hasValue = submittedVal !== null && submittedVal !== undefined && submittedVal !== '';

    // Check if there is an active change request on this field
    const activeCR = changeRequests.find(
      (cr) =>
        (cr.field_key === fieldDef.key || (cr.section_key === fieldDef.sectionKey && cr.field_key === fieldDef.key.split('.')[1])) &&
        (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
    );

    // Determine current effective field status
    const recordedReview = fieldReviews[fieldDef.key];
    let effectiveStatus: FieldReviewStatus = 'needs_review';

    if (activeCR) {
      if (activeCR.status === 'ready_for_review') {
        effectiveStatus = 'needs_review';
      } else {
        effectiveStatus = 'changes_requested';
      }
    } else if (recordedReview) {
      effectiveStatus = recordedReview.status;
    }

    if (effectiveStatus === 'verified' || effectiveStatus === 'approved') {
      sec.verifiedCount++;
      verifiedFieldCount++;
    } else if (effectiveStatus === 'changes_requested') {
      sec.changesRequestedCount++;
      blockers.push({
        id: `blocker-field-cr-${fieldDef.key}`,
        title: `${fieldDef.label}: Change Requested`,
        reason: activeCR?.request_comment || 'Correction requested by administrator.',
        sectionKey: fieldDef.sectionKey,
        fieldKey: fieldDef.key,
        targetTab: 'intake',
        severity: 'CRITICAL',
      });
      actionRequiredItems.push({
        id: `act-cr-${fieldDef.key}`,
        title: `${fieldDef.label}: Awaiting Correction`,
        description: `Change request pending: "${activeCR?.request_comment || 'Correction needed'}"`,
        targetTab: 'intake',
        targetSection: fieldDef.sectionKey,
        targetField: fieldDef.key,
      });
    } else {
      sec.needsReviewCount++;
      if (fieldDef.required && !hasValue) {
        blockers.push({
          id: `blocker-field-missing-${fieldDef.key}`,
          title: `Missing Required Field: ${fieldDef.label}`,
          reason: 'This required field has not been provided in the intake submission.',
          sectionKey: fieldDef.sectionKey,
          fieldKey: fieldDef.key,
          targetTab: 'intake',
          severity: 'CRITICAL',
        });
      } else if (fieldDef.required) {
        blockers.push({
          id: `blocker-field-review-${fieldDef.key}`,
          title: `Field Unverified: ${fieldDef.label}`,
          reason: 'Must be inspected and verified by administrator before website launch.',
          sectionKey: fieldDef.sectionKey,
          fieldKey: fieldDef.key,
          targetTab: 'intake',
          severity: 'WARNING',
        });
      }
    }
  });

  // Calculate Section Statuses
  Object.values(sectionReviews).forEach((sec) => {
    if (sec.changesRequestedCount > 0) {
      sec.status = 'changes_requested';
    } else if (sec.totalFields > 0 && sec.verifiedCount === sec.totalFields) {
      sec.status = 'approved';
    } else if (sec.verifiedCount > 0) {
      sec.status = 'needs_review';
    } else {
      sec.status = 'not_started';
    }
  });

  // Overall Content Review Status
  let contentReviewStatus: SchoolContentReviewStatus = 'not_started';
  const hasChangesReq = Object.values(sectionReviews).some((s) => s.status === 'changes_requested');
  const allContentApproved = totalFieldCount > 0 && verifiedFieldCount === totalFieldCount;

  if (hasChangesReq) {
    contentReviewStatus = 'changes_requested';
  } else if (allContentApproved) {
    contentReviewStatus = 'approved';
  } else if (verifiedFieldCount > 0) {
    contentReviewStatus = 'in_review';
  } else if (submission) {
    contentReviewStatus = 'not_started';
  }

  // 4. Media & Assets Evaluation
  const aggregatedAssets = aggregateUniversalAssets(payload);
  let approvedAssetCount = 0;
  let pendingAssetCount = 0;
  let changesRequestedAssetCount = 0;
  let missingRequiredAssetCount = 0;

  aggregatedAssets.forEach((asset) => {
    // Check if change request exists on this asset
    const activeAssetCR = changeRequests.find(
      (cr) =>
        (cr.asset_id === asset.id || (cr.section_key === 'media' && cr.field_key === asset.id)) &&
        (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
    );

    const recordedMedia = mediaReviews[asset.id];
    let effMediaStatus: MediaReviewStatus = 'pending_review';

    if (activeAssetCR) {
      effMediaStatus = activeAssetCR.status === 'ready_for_review' ? 'pending_review' : 'changes_requested';
    } else if (recordedMedia) {
      effMediaStatus = recordedMedia.status;
    } else if (project.media_status === 'approved') {
      effMediaStatus = 'approved';
    }

    if (asset.status === 'missing' && asset.required) {
      missingRequiredAssetCount++;
      blockers.push({
        id: `blocker-media-missing-${asset.id}`,
        title: `Required Media Missing: ${asset.title}`,
        reason: 'Statutory or mandatory visual asset required for website launch.',
        sectionKey: 'media',
        assetId: asset.id,
        targetTab: 'media',
        severity: 'CRITICAL',
      });
      actionRequiredItems.push({
        id: `act-media-missing-${asset.id}`,
        title: `Upload Required Media: ${asset.title}`,
        description: 'Asset is missing from the submitted media kit.',
        targetTab: 'media',
      });
    } else if (effMediaStatus === 'approved') {
      approvedAssetCount++;
    } else if (effMediaStatus === 'changes_requested') {
      changesRequestedAssetCount++;
      blockers.push({
        id: `blocker-media-cr-${asset.id}`,
        title: `Asset Requires Replacement: ${asset.title}`,
        reason: activeAssetCR?.request_comment || 'Replacement asset requested by reviewer.',
        sectionKey: 'media',
        assetId: asset.id,
        targetTab: 'media',
        severity: 'CRITICAL',
      });
      actionRequiredItems.push({
        id: `act-media-cr-${asset.id}`,
        title: `Replace Asset: ${asset.title}`,
        description: activeAssetCR?.request_comment || 'Reviewer requested image replacement.',
        targetTab: 'media',
      });
    } else {
      pendingAssetCount++;
      if (asset.required || asset.isPublicationBlocker) {
        blockers.push({
          id: `blocker-media-review-${asset.id}`,
          title: `Asset Needs Review: ${asset.title}`,
          reason: 'Must be verified for website suitability and visual fidelity.',
          sectionKey: 'media',
          assetId: asset.id,
          targetTab: 'media',
          severity: 'WARNING',
        });
      }
    }
  });

  // Calculate Media Review Status
  let mediaReviewStatus: SchoolMediaReviewStatus = 'not_started';
  if (changesRequestedAssetCount > 0) {
    mediaReviewStatus = 'changes_requested';
  } else if (aggregatedAssets.length > 0 && approvedAssetCount === aggregatedAssets.length && missingRequiredAssetCount === 0) {
    mediaReviewStatus = 'approved';
  } else if (approvedAssetCount > 0 || pendingAssetCount > 0) {
    mediaReviewStatus = 'in_review';
  } else if (aggregatedAssets.length > 0) {
    mediaReviewStatus = 'not_started';
  }

  // 5. Academic Scope Validation (Zero Out-of-Scope Classes)
  const campuses = payload.campuses || [];
  let isAcademicScopeValid = true;
  let academicScopeError = '';

  if (submission) {
    if (campuses.length > 0) {
      for (const c of campuses) {
        const scopeRes = validateCampusAcademicPayload(c.id, payload);
        if (!scopeRes.isValid) {
          isAcademicScopeValid = false;
          academicScopeError = scopeRes.errors[0] || 'Academic scope mismatch detected';
          break;
        }
      }
    } else {
      const scopeRes = validateCampusAcademicPayload('main-campus', payload);
      if (!scopeRes.isValid) {
        isAcademicScopeValid = false;
        academicScopeError = scopeRes.errors[0] || 'Academic scope mismatch detected';
      }
    }
  }

  if (!isAcademicScopeValid) {
    blockers.push({
      id: 'blocker-academic-scope',
      title: 'Canonical Academic Scope Violation',
      reason: academicScopeError,
      sectionKey: 'academicScope',
      targetTab: 'intake',
      targetSection: 'academicScope',
      severity: 'CRITICAL',
    });
    actionRequiredItems.unshift({
      id: 'act-academic-scope',
      title: 'Academic Scope Violation',
      description: academicScopeError,
      targetTab: 'intake',
      targetSection: 'academicScope',
    });
  }

  // 6. Overall Review Percentage Calculation
  const totalAssetsCount = aggregatedAssets.length;
  const totalItems = totalFieldCount + (totalAssetsCount > 0 ? totalAssetsCount : 1);
  const totalVerified = verifiedFieldCount + approvedAssetCount;
  const overallReviewPercentage = totalItems > 0 ? Math.min(100, Math.round((totalVerified / totalItems) * 100)) : 0;

  // 7. Website Readiness (Strict Rule: BLOCKED if any critical/warning blocker or unresolved CR)
  const isReady =
    submission !== null &&
    submission !== undefined &&
    isSubmissionComplete &&
    isAcademicScopeValid &&
    contentReviewStatus === 'approved' &&
    mediaReviewStatus === 'approved' &&
    !hasUnresolvedCRs &&
    blockers.length === 0;

  const websiteReadiness: SchoolWebsiteReadinessStatus = isReady ? 'READY' : 'BLOCKED';

  let websiteReadinessReason = 'All review and verification requirements passed.';
  if (!submission) {
    websiteReadinessReason = 'No intake submission recorded.';
  } else if (!isSubmissionComplete) {
    websiteReadinessReason = `Submission is incomplete (${completeness}%).`;
  } else if (blockers.length > 0) {
    websiteReadinessReason = `${blockers.length} unresolved review item(s) require action.`;
  } else if (hasUnresolvedCRs) {
    websiteReadinessReason = `${crOpen + crWaiting + crReadyForReview} unresolved change request(s).`;
  } else if (!isAcademicScopeValid) {
    websiteReadinessReason = academicScopeError;
  }

  // 8. Provisioning Status (Gated by Readiness + Final Approval)
  let provisioningStatus: SchoolProvisioningStatus = 'LOCKED';
  if (project.status === 'handed_off') {
    provisioningStatus = 'HANDED_OFF';
  } else if (websiteReadiness === 'READY' && (project.status === 'approved' || Boolean(finalApproval))) {
    provisioningStatus = 'READY';
  } else {
    provisioningStatus = 'LOCKED';
  }

  // 9. Central Checklist
  const checklist: ReviewChecklistItem[] = [
    {
      id: 'chk-submission',
      label: 'Onboarding Submission',
      status: isSubmissionComplete ? 'passed' : 'blocked',
      note: isSubmissionComplete ? '100% submission recorded' : `Current: ${completeness}%`,
      targetTab: 'overview',
    },
    {
      id: 'chk-profile',
      label: 'School Profile Details',
      status: sectionReviews.schoolProfile.status === 'approved' ? 'passed' : sectionReviews.schoolProfile.status === 'changes_requested' ? 'blocked' : 'warning',
      note: `${sectionReviews.schoolProfile.verifiedCount}/${sectionReviews.schoolProfile.totalFields} fields verified`,
      targetTab: 'intake',
      targetSection: 'schoolProfile',
    },
    {
      id: 'chk-campus',
      label: 'Campus Structure & Contacts',
      status: sectionReviews.campuses.status === 'approved' ? 'passed' : sectionReviews.campuses.status === 'changes_requested' ? 'blocked' : 'warning',
      note: `${sectionReviews.campuses.verifiedCount}/${sectionReviews.campuses.totalFields} fields verified`,
      targetTab: 'intake',
      targetSection: 'campuses',
    },
    {
      id: 'chk-scope',
      label: 'Academic Scope & Classes',
      status: isAcademicScopeValid && sectionReviews.academicScope.status === 'approved' ? 'passed' : 'blocked',
      note: isAcademicScopeValid ? `${sectionReviews.academicScope.verifiedCount}/${sectionReviews.academicScope.totalFields} verified` : 'Scope mismatch',
      targetTab: 'intake',
      targetSection: 'academicScope',
    },
    {
      id: 'chk-admissions',
      label: 'Admissions & Incharge',
      status: sectionReviews.admissions.status === 'approved' ? 'passed' : 'warning',
      note: `${sectionReviews.admissions.verifiedCount}/${sectionReviews.admissions.totalFields} verified`,
      targetTab: 'intake',
      targetSection: 'admissions',
    },
    {
      id: 'chk-fees',
      label: 'Fee Schedule & Breakdown',
      status: sectionReviews.fees.status === 'approved' ? 'passed' : 'warning',
      note: `${sectionReviews.fees.verifiedCount}/${sectionReviews.fees.totalFields} verified`,
      targetTab: 'intake',
      targetSection: 'fees',
    },
    {
      id: 'chk-content',
      label: 'Website Content & Statements',
      status: sectionReviews.websiteContent.status === 'approved' ? 'passed' : sectionReviews.websiteContent.status === 'changes_requested' ? 'blocked' : 'warning',
      note: `${sectionReviews.websiteContent.verifiedCount}/${sectionReviews.websiteContent.totalFields} verified`,
      targetTab: 'intake',
      targetSection: 'websiteContent',
    },
    {
      id: 'chk-media',
      label: 'Media Kit & Photography',
      status: mediaReviewStatus === 'approved' ? 'passed' : mediaReviewStatus === 'changes_requested' ? 'blocked' : 'warning',
      note: `${approvedAssetCount}/${aggregatedAssets.length} assets approved`,
      targetTab: 'media',
    },
    {
      id: 'chk-changes',
      label: 'Change Requests Resolution',
      status: !hasUnresolvedCRs ? 'passed' : 'blocked',
      note: hasUnresolvedCRs ? `${crOpen + crWaiting + crReadyForReview} open requests` : 'All resolved',
      targetTab: 'reviews',
    },
    {
      id: 'chk-final-approval',
      label: 'Final Administrator Approval',
      status: project.status === 'approved' || Boolean(finalApproval) ? 'passed' : 'warning',
      note: project.status === 'approved' ? 'Approved & Locked' : 'Pending final sign-off',
      targetTab: 'provisioning',
    },
    {
      id: 'chk-provisioning',
      label: 'Platform Provisioning Handoff',
      status: project.status === 'handed_off' ? 'passed' : provisioningStatus === 'READY' ? 'warning' : 'blocked',
      note: project.status === 'handed_off' ? 'Handed off' : provisioningStatus === 'READY' ? 'Ready to execute' : 'Locked',
      targetTab: 'provisioning',
    },
  ];

  // Prioritized next action item
  let nextActionItem: ActionRequiredItem | undefined = actionRequiredItems[0];
  if (!nextActionItem && blockers.length > 0) {
    const firstB = blockers[0];
    nextActionItem = {
      id: firstB.id,
      title: firstB.title,
      description: firstB.reason,
      targetTab: firstB.targetTab,
      targetSection: firstB.sectionKey,
      targetField: firstB.fieldKey,
    };
  }

  return {
    submissionStatus,
    submissionCompleteness: completeness,
    contentReviewStatus,
    mediaReviewStatus,
    websiteReadiness,
    websiteReadinessReason,
    provisioningStatus,
    provisioningBlockersCount: blockers.length,
    changeRequestsSummary: {
      open: crOpen,
      waitingForSchool: crWaiting,
      readyForReview: crReadyForReview,
      resolved: crResolved,
      total: crTotal,
    },
    overallReviewPercentage,
    sectionReviews,
    blockers,
    checklist,
    actionRequiredItems,
    nextActionItem,
    aggregatedAssets,
  };
}

/**
 * Builds Verified School Website Dataset for Downstream Website Builder
 * Consumes ONLY approved and verified information.
 */
export function buildVerifiedSchoolWebsiteDataset(
  project: SchoolProject,
  submission: SchoolIntakeSubmission | null | undefined
): SchoolWebsiteData | null {
  if (!submission?.intake_payload) return null;
  const payload = submission.intake_payload;
  const metadata = project.metadata || {};
  const fieldReviews = metadata.fieldReviews || {};

  // Clone payload and clean unverified fields where required
  const verifiedPayload: UniversalIntakeData = JSON.parse(JSON.stringify(payload));

  // If a field was explicitly marked changes_requested, replace with fallback
  Object.entries(fieldReviews).forEach(([key, review]) => {
    if (review.status === 'changes_requested') {
      const parts = key.split('.');
      if (parts.length === 2 && (verifiedPayload as any)[parts[0]]) {
        delete (verifiedPayload as any)[parts[0]][parts[1]];
      }
    }
  });

  return buildSchoolWebsiteDataFromIntake(verifiedPayload, false);
}
