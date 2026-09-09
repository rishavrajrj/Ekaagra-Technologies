/**
 * ==============================================================================
 * WEBSITE SPECIFICATION CONTRACT & APPROVAL INTEGRITY ENGINE
 * File: src/lib/websiteSpecificationContract.ts
 * ==============================================================================
 *
 * Core architectural principle:
 * "Collect once → store canonically → assemble automatically → visually verify → resolve real blockers → approve once → publish the exact approved specification."
 *
 * This module is the server-authoritative engine for:
 * 1. Deterministic Website Specification Snapshot Generation (metadata-only assets, content, compliance, pages)
 * 2. Deterministic SHA-256 Specification Hashing
 * 3. Server-Side Approval Precondition & Blocker Enforcement
 * 4. Idempotent Versioned Specification Sign-Off
 * 5. Real-Time Invalidation & Targeted Change Tracking
 * 6. Publication Contract Generation
 */

import { createHash } from 'node:crypto';
import type {
  UniversalIntakeData,
  WebsitePageConfiguration,
  WebsiteSpecificationSnapshot,
  WebsiteApprovalRecord,
  ApprovalInvalidationResult,
  WebsitePublicationPayload,
} from './types';
export type {
  WebsiteSpecificationSnapshot,
  WebsiteApprovalRecord,
  ApprovalInvalidationResult,
  WebsitePublicationPayload,
};
import {
  buildWebsitePageConfigurations,
  resolveCanonicalPrincipal,
  resolveCanonicalAsset,
  calculateWebsiteReadinessBreakdown,
  detectDuplicatePageRisks,
  type DuplicatePageRisk,
} from './websitePageRequirements';

/**
 * Recursively freezes an object and all nested properties in place,
 * preventing any runtime mutations.
 */
export function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    const val = (obj as any)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

/**
 * Deeply clones an object via JSON serialization to break all reference bindings.
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Deterministically serializes any JavaScript object or primitive.
 * Object keys are sorted alphabetically at every nesting level to guarantee
 * that identical content always yields an identical JSON string representation.
 */
export function deterministicSerialize(val: unknown): string {
  if (val === null || val === undefined) {
    return 'null';
  }
  if (typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map((item) => deterministicSerialize(item)).join(',') + ']';
  }

  const keys = Object.keys(val as Record<string, unknown>).sort();
  const pairs = keys.map((key) => {
    const propertyValue = (val as Record<string, unknown>)[key];
    return `${JSON.stringify(key)}:${deterministicSerialize(propertyValue)}`;
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes a deterministic SHA-256 hash for a website specification snapshot.
 */
export function computeSpecificationHash(snapshot: WebsiteSpecificationSnapshot): string {
  // Exclude volatile fields (snapshotId, snapshotCreatedAt) to ensure content determinism
  const contentToHash = {
    specificationVersion: snapshot.specificationVersion,
    pages: snapshot.pages,
    resolvedAssets: snapshot.resolvedAssets,
    contentSnapshot: snapshot.contentSnapshot,
    complianceSnapshot: snapshot.complianceSnapshot,
  };
  const serialized = deterministicSerialize(contentToHash);
  return createHash('sha256').update(serialized).digest('hex');
}

/**
 * Extracts and resolves canonical asset metadata without copying large files.
 */
function extractCanonicalAssetSnapshots(intakeData: Partial<UniversalIntakeData>) {
  const assetKeys = [
    'school_logo',
    'principal_photo',
    'campus_primary_hero',
    'prospectus_document',
    'mandatory_disclosure_document',
    'affiliation_certificate',
    'society_trust_certificate',
  ];

  const resolvedMap: WebsiteSpecificationSnapshot['resolvedAssets'] = {};

  for (const key of assetKeys) {
    const res = resolveCanonicalAsset(intakeData, key);
    if (res.isAvailable) {
      resolvedMap[key] = {
        id: key,
        title: key.replace(/_/g, ' ').toUpperCase(),
        category: 'canonical',
        url: res.url,
        storageKey: res.storageKey,
        fileName: res.fileName,
        fileType: res.fileType,
        width: res.width,
        height: res.height,
        fileSize: res.fileSize,
        sourceSection: res.sourceSection,
        sourceField: res.sourceField,
      };
    }
  }

  // Also capture any provided items from assetChecklist
  const checklistItems = intakeData.assetChecklist?.items || [];
  for (const item of checklistItems) {
    if (item.status === 'provided' || item.fileUrl || item.storageKey) {
      const id = item.id || `custom_${item.category}_${item.requirement}`;
      if (!resolvedMap[id]) {
        resolvedMap[id] = {
          id,
          title: item.title,
          category: item.category,
          url: item.fileUrl,
          storageKey: item.storageKey,
          fileName: item.fileName,
          fileType: item.fileType,
          width: item.width,
          height: item.height,
          fileSize: item.fileSize,
          sourceSection: 'assetChecklist',
          sourceField: item.id,
        };
      }
    }
  }

  return resolvedMap;
}

/**
 * Generates an immutable, deterministic specification snapshot from the canonical intake data.
 */
export function generateWebsiteSpecificationSnapshot(
  intakeData: Partial<UniversalIntakeData>,
  pageConfigurations?: Record<string, WebsitePageConfiguration>,
  version: number = 1
): WebsiteSpecificationSnapshot {
  const pages = pageConfigurations || intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  const principalRes = resolveCanonicalPrincipal(intakeData);
  const resolvedAssets = extractCanonicalAssetSnapshots(intakeData);
  const readiness = calculateWebsiteReadinessBreakdown(intakeData, pages);

  const schoolProf = intakeData.schoolProfile || ({} as any);
  const schoolContent = intakeData.schoolContent || ({} as any);
  const legal = intakeData.legalPolicies || ({} as any);

  const aboutSchoolText = typeof schoolContent.aboutSchool === 'object'
    ? (schoolContent.aboutSchool?.text || '')
    : (schoolContent.aboutSchool || '');

  const missionText = typeof schoolContent.mission === 'object'
    ? (schoolContent.mission?.text || '')
    : (schoolContent.mission || '');

  const visionText = typeof schoolContent.vision === 'object'
    ? (schoolContent.vision?.text || '')
    : (schoolContent.vision || '');

  const snapshot: WebsiteSpecificationSnapshot = {
    snapshotId: `snap_${Date.now()}_v${version}`,
    snapshotCreatedAt: new Date().toISOString(),
    specificationVersion: version,
    pages: deepClone(pages),
    resolvedAssets: deepClone(resolvedAssets),
    contentSnapshot: {
      aboutSchool: aboutSchoolText,
      mission: missionText,
      vision: visionText,
      principalName: principalRes.value || '',
      principalMessage: intakeData.websiteRequirements?.principalMessageDraft || '',
      managementMessage: intakeData.websiteRequirements?.managementMessageDraft || '',
      schoolHighlights: {
        schoolName: schoolProf.schoolName || schoolProf.name || '',
        board: schoolProf.board || schoolProf.curriculumBoard || '',
        affiliationNumber: schoolProf.affiliationNumber || '',
        establishedYear: schoolProf.establishedYear || '',
        primaryCampusAddress: intakeData.campuses?.[0]?.address || '',
        contactEmail: schoolProf.contactEmail || schoolProf.officialEmail || schoolProf.email || '',
        contactPhone: schoolProf.contactPhone || schoolProf.officialPhone || schoolProf.phone || '',
      },
    },
    complianceSnapshot: {
      mandatoryDisclosures: deepClone(legal.mandatoryPublicDisclosures || legal.disclosures || []),
      affiliationCertPresent: !!resolvedAssets['affiliation_certificate'] || legal.affiliationCertificateProvided === true,
      societyRegistrationPresent: !!resolvedAssets['society_trust_certificate'] || legal.societyRegistrationProvided === true,
      board: schoolProf.board || schoolProf.curriculumBoard || '',
      affiliationNumber: schoolProf.affiliationNumber || '',
    },
    readinessSnapshot: deepClone({
      canApprove: readiness.canApprove,
      websitePagesCount: readiness.websitePagesCount,
      readyPagesCount: readiness.readyPagesCount,
      contentReadyPercentage: readiness.contentReadyPercentage,
      assetsVerifiedCount: readiness.assetsVerifiedCount,
      complianceBlockersCount: readiness.complianceBlockersCount,
      unresolvedBlockers: readiness.unresolvedBlockers,
      duplicateRisks: readiness.duplicateRisks,
    }),
    sourceTimestamps: {
      schoolProfile: intakeData.schoolProfile ? 'present' : undefined,
      leadership: intakeData.leadership ? 'present' : undefined,
      campuses: (intakeData.campuses || []).length > 0 ? 'present' : undefined,
      assetChecklist: (intakeData.assetChecklist?.items || []).length > 0 ? 'present' : undefined,
      legalPolicies: intakeData.legalPolicies ? 'present' : undefined,
    },
  };

  return deepFreeze(snapshot);
}

export interface PreconditionBlocker {
  key: string;
  pageLabel: string;
  label: string;
  sourceSection: string;
  sourceSectionName: string;
  message: string;
  isStatutory: boolean;
}

export interface PreconditionValidationResult {
  canApprove: boolean;
  blockers: PreconditionBlocker[];
  duplicateRisks: DuplicatePageRisk[];
}

/**
 * Server-authoritative validation gating the approval action.
 * Evaluates blockers independently of any client assertions.
 */
export function validateServerApprovalPreconditions(
  intakeData: Partial<UniversalIntakeData>,
  pageConfigurations?: Record<string, WebsitePageConfiguration>
): PreconditionValidationResult {
  const pages = pageConfigurations || intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  const readiness = calculateWebsiteReadinessBreakdown(intakeData, pages);
  const blockers: PreconditionBlocker[] = [...readiness.unresolvedBlockers];
  const duplicateRisks = detectDuplicatePageRisks(Object.values(pages));

  // 1. Check mandatory School Logo
  const logoRes = resolveCanonicalAsset(intakeData, 'school_logo');
  if (!logoRes.isAvailable) {
    if (!blockers.some((b) => b.key === 'asset_school_logo')) {
      blockers.push({
        key: 'asset_school_logo',
        pageLabel: 'Global Branding',
        label: 'Official School Crest / Logo',
        sourceSection: 'brandingDesign',
        sourceSectionName: 'Section 17 — Branding & Design',
        message: 'High-resolution official school crest or logo must be uploaded before website publication.',
        isStatutory: true,
      });
    }
  }

  // 2. Check school identity essentials
  const schoolName = intakeData.schoolProfile?.schoolName || (intakeData.schoolProfile as any)?.name;
  if (!schoolName || String(schoolName).trim().length === 0) {
    blockers.push({
      key: 'profile_school_name',
      pageLabel: 'Identity & Registration',
      label: 'Official School Name',
      sourceSection: 'schoolProfile',
      sourceSectionName: 'Section 1 — Identity',
      message: 'Official school name is missing in Section 1 (Identity).',
      isStatutory: true,
    });
  }

  // 3. Duplicate page / slug collisions that are blocking
  for (const risk of duplicateRisks) {
    if (risk.matchType === 'exact_slug') {
      blockers.push({
        key: `duplicate_${risk.pageKey}_${risk.conflictingPageKey}`,
        pageLabel: risk.label,
        label: `Route Conflict (/${risk.slug})`,
        sourceSection: 'websiteRequirements',
        sourceSectionName: 'Step 27 — Website Verification',
        message: risk.message,
        isStatutory: false,
      });
    }
  }

  const canApprove = blockers.length === 0;

  return {
    canApprove,
    blockers,
    duplicateRisks,
  };
}

export interface ApproverInfo {
  name: string;
  email: string;
  role?: string;
}

export interface ApproveWebsiteSpecificationResult {
  success: boolean;
  approvalRecord?: WebsiteApprovalRecord;
  isNewVersion: boolean;
  message: string;
  preconditionResult?: PreconditionValidationResult;
}

/**
 * Server-authoritative, idempotent specification approval action.
 * Validates preconditions, calculates snapshot and SHA-256 hash,
 * prevents double submissions, and manages version history.
 */
export function approveWebsiteSpecification(
  intakeData: Partial<UniversalIntakeData>,
  approver: ApproverInfo,
  notes?: string
): ApproveWebsiteSpecificationResult {
  const pages = intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  const preconditionResult = validateServerApprovalPreconditions(intakeData, pages);

  if (!preconditionResult.canApprove) {
    return {
      success: false,
      isNewVersion: false,
      message: `Approval rejected: ${preconditionResult.blockers.length} unresolved blocker(s) exist.`,
      preconditionResult,
    };
  }

  const currentApproval = intakeData.websiteRequirements?.currentApproval;
  const nextVersionNumber = (currentApproval?.specificationVersion || 0) + 1;

  // Generate candidate snapshot with potential next version number
  const candidateSnapshot = generateWebsiteSpecificationSnapshot(
    intakeData,
    pages,
    currentApproval ? nextVersionNumber : 1
  );

  // If current approval is valid and approved, compute hash of current vs candidate
  if (currentApproval && currentApproval.status === 'approved') {
    // Check if the content is identical
    const testSnapshot = {
      ...candidateSnapshot,
      specificationVersion: currentApproval.specificationVersion,
    };
    const testHash = computeSpecificationHash(testSnapshot);

    if (testHash === currentApproval.specificationHash) {
      // Idempotent: return existing record without bumping version
      return {
        success: true,
        approvalRecord: currentApproval,
        isNewVersion: false,
        message: 'Specification already approved with identical content. Existing approval retained.',
      };
    }
  }

  // New version required
  const specificationHash = computeSpecificationHash(candidateSnapshot);
  const newApprovalRecord: WebsiteApprovalRecord = {
    id: `appr_${Date.now()}_v${candidateSnapshot.specificationVersion}`,
    status: 'approved',
    specificationVersion: candidateSnapshot.specificationVersion,
    specificationHash,
    approvedAt: new Date().toISOString(),
    approvedBy: {
      name: approver.name,
      email: approver.email,
      role: approver.role || 'Super Administrator',
    },
    notes: notes || undefined,
    approvedSpecification: candidateSnapshot,
  };

  return {
    success: true,
    approvalRecord: deepFreeze(newApprovalRecord),
    isNewVersion: true,
    message: `Specification v${newApprovalRecord.specificationVersion} successfully approved and locked.`,
  };
}

/**
 * Detects whether canonical source data has changed since the last approval.
 * Pinpoints the exact fields and pages affected.
 */
export function detectSpecificationInvalidation(
  currentApproval: WebsiteApprovalRecord | undefined,
  intakeData: Partial<UniversalIntakeData>,
  pageConfigurations?: Record<string, WebsitePageConfiguration>
): ApprovalInvalidationResult {
  if (!currentApproval || currentApproval.status !== 'approved') {
    return {
      isInvalidated: false,
      invalidatedFields: [],
      affectedPages: [],
    };
  }

  const approvedSpec = currentApproval.approvedSpecification;
  const currentPages = pageConfigurations || intakeData.websiteRequirements?.pageConfigurations || buildWebsitePageConfigurations(intakeData);
  const currentSnapshot = generateWebsiteSpecificationSnapshot(
    intakeData,
    currentPages,
    approvedSpec.specificationVersion
  );

  const currentHash = computeSpecificationHash(currentSnapshot);

  if (currentHash === currentApproval.specificationHash) {
    return {
      isInvalidated: false,
      invalidatedFields: [],
      affectedPages: [],
    };
  }

  const invalidatedFields: string[] = [];
  const affectedPagesSet = new Set<string>();

  // 1. Compare Content Snapshot
  if (currentSnapshot.contentSnapshot.aboutSchool !== approvedSpec.contentSnapshot.aboutSchool) {
    invalidatedFields.push('About School Text (schoolContent.aboutSchool)');
    affectedPagesSet.add('About Us');
    affectedPagesSet.add('Home');
  }

  if (currentSnapshot.contentSnapshot.mission !== approvedSpec.contentSnapshot.mission) {
    invalidatedFields.push('School Mission Statement (schoolContent.mission)');
    affectedPagesSet.add('About Us');
  }

  if (currentSnapshot.contentSnapshot.vision !== approvedSpec.contentSnapshot.vision) {
    invalidatedFields.push('School Vision Statement (schoolContent.vision)');
    affectedPagesSet.add('About Us');
  }

  if (currentSnapshot.contentSnapshot.principalName !== approvedSpec.contentSnapshot.principalName) {
    invalidatedFields.push(`Principal Name changed from "${approvedSpec.contentSnapshot.principalName}" to "${currentSnapshot.contentSnapshot.principalName}"`);
    affectedPagesSet.add('About Us');
    affectedPagesSet.add('Leadership');
    affectedPagesSet.add("Principal's Message");
  }

  if (currentSnapshot.contentSnapshot.principalMessage !== approvedSpec.contentSnapshot.principalMessage) {
    invalidatedFields.push("Principal's Message Draft");
    affectedPagesSet.add("Principal's Message");
    affectedPagesSet.add('About Us');
  }

  if (currentSnapshot.contentSnapshot.managementMessage !== approvedSpec.contentSnapshot.managementMessage) {
    invalidatedFields.push("Management Message Draft");
    affectedPagesSet.add('Leadership');
    affectedPagesSet.add('About Us');
  }

  // 2. Compare Assets Snapshot
  const allAssetKeys = Array.from(
    new Set([...Object.keys(approvedSpec.resolvedAssets), ...Object.keys(currentSnapshot.resolvedAssets)])
  );

  for (const assetKey of allAssetKeys) {
    const approvedAsset = approvedSpec.resolvedAssets[assetKey];
    const currentAsset = currentSnapshot.resolvedAssets[assetKey];

    const isModified =
      !approvedAsset ||
      !currentAsset ||
      approvedAsset.url !== currentAsset.url ||
      approvedAsset.storageKey !== currentAsset.storageKey ||
      approvedAsset.fileName !== currentAsset.fileName ||
      approvedAsset.fileSize !== currentAsset.fileSize ||
      approvedAsset.fileType !== currentAsset.fileType;

    if (isModified) {
      const assetTitle = currentAsset?.title || approvedAsset?.title || assetKey;
      if (!approvedAsset) {
        invalidatedFields.push(`Asset "${assetTitle}" (${assetKey}) added`);
      } else if (!currentAsset) {
        invalidatedFields.push(`Asset "${assetTitle}" (${assetKey}) removed`);
      } else {
        invalidatedFields.push(`Asset "${assetTitle}" (${assetKey}) modified`);
      }

      if (assetKey === 'school_logo') {
        affectedPagesSet.add('Global Header');
        affectedPagesSet.add('Global Footer');
        affectedPagesSet.add('Home');
      } else if (assetKey === 'principal_photo') {
        affectedPagesSet.add('About Us');
        affectedPagesSet.add('Leadership');
        affectedPagesSet.add("Principal's Message");
      } else if (assetKey === 'campus_primary_hero') {
        affectedPagesSet.add('Home');
        affectedPagesSet.add('Campus');
      } else if (
        assetKey === 'mandatory_disclosure_document' ||
        assetKey === 'affiliation_certificate' ||
        assetKey === 'society_trust_certificate' ||
        assetKey.startsWith('doc-')
      ) {
        affectedPagesSet.add('Mandatory Disclosures');
      } else {
        affectedPagesSet.add('Gallery');
        affectedPagesSet.add('Campus');
      }
    }
  }

  // 3. Compare Compliance Snapshot
  if (
    currentSnapshot.complianceSnapshot.affiliationCertPresent !== approvedSpec.complianceSnapshot.affiliationCertPresent ||
    currentSnapshot.complianceSnapshot.affiliationNumber !== approvedSpec.complianceSnapshot.affiliationNumber ||
    currentSnapshot.complianceSnapshot.societyRegistrationPresent !== approvedSpec.complianceSnapshot.societyRegistrationPresent
  ) {
    invalidatedFields.push('Affiliation Certification / Board Credentials / Compliance Documents');
    affectedPagesSet.add('Mandatory Disclosures');
    affectedPagesSet.add('About Us');
  }

  // 4. Compare Pages Configurations
  const approvedPageKeys = Object.keys(approvedSpec.pages);
  const currentPageKeys = Object.keys(currentSnapshot.pages);

  for (const pKey of approvedPageKeys) {
    if (!currentSnapshot.pages[pKey]) {
      invalidatedFields.push(`Page "${pKey}" removed`);
      affectedPagesSet.add(pKey);
    } else {
      const pAppr = approvedSpec.pages[pKey];
      const pCurr = currentSnapshot.pages[pKey];
      if (pAppr.slug !== pCurr.slug) {
        invalidatedFields.push(`Page "${pKey}" URL route changed from /${pAppr.slug} to /${pCurr.slug}`);
        affectedPagesSet.add(pKey);
      }
      if (pAppr.enabled !== pCurr.enabled) {
        invalidatedFields.push(`Page "${pKey}" visibility changed (${pCurr.enabled ? 'enabled' : 'disabled'})`);
        affectedPagesSet.add(pKey);
      }
      if (pAppr.label !== pCurr.label) {
        invalidatedFields.push(`Page "${pKey}" title changed from "${pAppr.label}" to "${pCurr.label}"`);
        affectedPagesSet.add(pKey);
      }
    }
  }

  for (const pKey of currentPageKeys) {
    if (!approvedSpec.pages[pKey]) {
      invalidatedFields.push(`New page "${pKey}" added`);
      affectedPagesSet.add(pKey);
    }
  }

  // 5. Compare Identity / Campuses
  const currProf = currentSnapshot.contentSnapshot.schoolHighlights;
  const apprProf = approvedSpec.contentSnapshot.schoolHighlights;
  if (currProf?.schoolName !== apprProf?.schoolName) {
    invalidatedFields.push('Official School Name');
    affectedPagesSet.add('All Pages (Title & Header)');
    affectedPagesSet.add('Home');
  }
  if (currProf?.primaryCampusAddress !== apprProf?.primaryCampusAddress) {
    invalidatedFields.push('Primary Campus Physical Address');
    affectedPagesSet.add('Contact Us');
    affectedPagesSet.add('Global Footer');
  }
  if (currProf?.contactEmail !== apprProf?.contactEmail) {
    invalidatedFields.push(`Official Contact Email changed from "${apprProf?.contactEmail || 'none'}" to "${currProf?.contactEmail || 'none'}"`);
    affectedPagesSet.add('Contact Us');
    affectedPagesSet.add('Global Footer');
  }
  if (currProf?.contactPhone !== apprProf?.contactPhone) {
    invalidatedFields.push(`Official Contact Phone changed from "${apprProf?.contactPhone || 'none'}" to "${currProf?.contactPhone || 'none'}"`);
    affectedPagesSet.add('Contact Us');
    affectedPagesSet.add('Global Footer');
    affectedPagesSet.add('Global Header');
  }
  if (currProf?.board !== apprProf?.board) {
    invalidatedFields.push(`Accreditation Board changed from "${apprProf?.board || 'none'}" to "${currProf?.board || 'none'}"`);
    affectedPagesSet.add('Mandatory Disclosures');
    affectedPagesSet.add('About Us');
  }
  if (currProf?.establishedYear !== apprProf?.establishedYear) {
    invalidatedFields.push(`Established Year changed from "${apprProf?.establishedYear || 'none'}" to "${currProf?.establishedYear || 'none'}"`);
    affectedPagesSet.add('About Us');
    affectedPagesSet.add('Home');
  }

  // 6. Check Route Conflicts / Duplicate Slugs
  if (currentSnapshot.readinessSnapshot.duplicateRisks) {
    for (const risk of currentSnapshot.readinessSnapshot.duplicateRisks) {
      if (risk.matchType === 'exact_slug') {
        invalidatedFields.push(`Route Conflict: duplicate slug /${risk.slug} on ${risk.label}`);
        affectedPagesSet.add(risk.label);
      }
    }
  }

  if (invalidatedFields.length === 0) {
    // Fallback if hash differed due to other metadata
    invalidatedFields.push('Website specification configuration altered');
    affectedPagesSet.add('General Pages');
  }

  return {
    isInvalidated: true,
    invalidatedFields,
    affectedPages: Array.from(affectedPagesSet),
    reason: 'Upstream canonical data was modified after specification approval. Re-verification required.',
  };
}

/**
 * Generates a frozen publication payload strictly from an approved specification.
 * Guarantee: The publication pipeline NEVER reads live draft or unapproved data.
 */
export function generateWebsitePublicationPayload(
  approvedRecord: WebsiteApprovalRecord,
  schoolId: string = 'school_prod',
  currentIntakeData?: Partial<UniversalIntakeData>
): WebsitePublicationPayload {
  if (!approvedRecord || typeof approvedRecord !== 'object') {
    throw new Error('Invalid publication request: No approval record provided.');
  }

  if (approvedRecord.status !== 'approved') {
    throw new Error(`Cannot publish specification with status "${approvedRecord.status}". Must be "approved".`);
  }

  if (!approvedRecord.approvedSpecification || typeof approvedRecord.approvedSpecification !== 'object') {
    throw new Error('Malformed approval record: Missing frozen specification snapshot.');
  }

  // Security & Tamper Check (Test E & F):
  // Deterministically re-compute SHA-256 hash from the frozen snapshot and verify equality with stored fingerprint.
  const computedHash = computeSpecificationHash(approvedRecord.approvedSpecification);
  if (computedHash !== approvedRecord.specificationHash) {
    throw new Error(
      `Tampered approval record detected: specification hash mismatch. Stored fingerprint "${approvedRecord.specificationHash}" does not match computed snapshot hash "${computedHash}". Publication rejected.`
    );
  }

  // Draft Discrepancy Check (Test D):
  // If current draft data is provided, ensure live canonical data has not mutated post-approval.
  if (currentIntakeData) {
    const invalidation = detectSpecificationInvalidation(approvedRecord, currentIntakeData);
    if (invalidation.isInvalidated) {
      throw new Error(
        `Cannot publish website: Canonical onboarding data was modified after approval (${invalidation.invalidatedFields.join(', ')}). Specification must be re-verified and approved.`
      );
    }
  }

  const spec = approvedRecord.approvedSpecification;

  const payload: WebsitePublicationPayload = {
    publicationId: `pub_${approvedRecord.specificationHash.slice(0, 12)}_${Date.now()}`,
    schoolId,
    specificationVersion: approvedRecord.specificationVersion,
    specificationHash: approvedRecord.specificationHash,
    approvedAt: approvedRecord.approvedAt,
    approvedBy: { ...approvedRecord.approvedBy },
    pages: deepClone(spec.pages),
    resolvedAssets: deepClone(spec.resolvedAssets),
    content: deepClone(spec.contentSnapshot),
    compliance: deepClone(spec.complianceSnapshot),
    publishedAt: new Date().toISOString(),
    snapshot: spec,
  };

  return deepFreeze(payload);
}
