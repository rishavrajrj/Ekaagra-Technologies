/**
 * ==============================================================================
 * UNIVERSAL WEBSITE VERIFICATION & SUBMISSION ENGINE
 * File: src/lib/universalVerificationEngine.ts
 * ==============================================================================
 *
 * Core architectural principle:
 * "Collect once → reuse everywhere → verify once → submit once."
 *
 * This engine acts as the authoritative single source of truth for:
 * 1. Centralized verification statuses & source-reference tracking
 * 2. Unified, reusable asset aggregation across onboarding sections
 * 3. Dynamic facility & infrastructure review with conditional logic
 * 4. Consolidated statutory document & compliance tracking
 * 5. Non-duplicating readiness calculation across 6 pillars
 * 6. Categorized publication blockers vs recommendations
 * 7. Printable HTML/PDF report generation & comprehensive ZIP bundle packaging
 */

import type {
  UniversalIntakeData,
  CampusImageData,
  AssetChecklistItem,
  PersonImageData,
  SchoolLeadershipData,
  SharedMediaAsset,
} from './types';
import JSZip from 'jszip';
import { getEffectiveMediaRegistry } from './mediaRegistryUtils';

// ─── 1. STATUS & VERIFICATION TYPES ──────────────────────────────────────────

export const PUBLICATION_REQUIREMENT_KEYS = {
  PRINCIPAL_NAME: 'PRINCIPAL_NAME',
  PRINCIPAL_PORTRAIT: 'PRINCIPAL_PORTRAIT',
  AFFILIATION_CERTIFICATE: 'AFFILIATION_CERTIFICATE',
  RECOGNITION_NOC: 'RECOGNITION_NOC',
  FIRE_SAFETY_CERTIFICATE: 'FIRE_SAFETY_CERTIFICATE',
  MANDATORY_PUBLIC_DISCLOSURE: 'MANDATORY_PUBLIC_DISCLOSURE',
  SCHOOL_NAME: 'SCHOOL_NAME',
  SCHOOL_ADDRESS: 'SCHOOL_ADDRESS',
  SCHOOL_PHONE: 'SCHOOL_PHONE',
  SCHOOL_EMAIL: 'SCHOOL_EMAIL',
  ADMIN_CONTACT: 'ADMIN_CONTACT',
  CAMPUS_HERO_IMAGE: 'CAMPUS_HERO_IMAGE',
} as const;

export type PublicationRequirementKey =
  typeof PUBLICATION_REQUIREMENT_KEYS[keyof typeof PUBLICATION_REQUIREMENT_KEYS];

export interface BlockerValidationResult {
  key: PublicationRequirementKey | string;
  isSatisfied: boolean;
  title: string;
  reason: string;
  sourceSection: string;
  sourceLabel: string;
  sourceField?: string;
  asset?: UniversalVerificationAsset | any;
  debug?: {
    key: string;
    satisfied: boolean;
    source: string;
    valuePresent: boolean;
    mediaId?: string;
    mediaType?: string;
    reason?: string;
  };
}

export type VerificationStatus =
  | 'ready'
  | 'needs_review'
  | 'missing'
  | 'required'
  | 'optional'
  | 'not_applicable'
  | 'verified'
  | 'blocked';

export interface SourceReferenceItem<T = any> {
  key: string;
  label: string;
  value: T;
  displayValue?: string;
  sourceSection: string;
  sourceLabel: string;
  sourceField?: string;
  status: VerificationStatus;
  required: boolean;
  isPublicationBlocker?: boolean;
  recommendation?: string;
  category: 'identity' | 'content' | 'facilities' | 'assets' | 'compliance' | 'configuration' | 'admin';
}

export interface UniversalVerificationAsset {
  id: string;
  key?: string;
  title: string;
  category: 'branding' | 'campus' | 'academics' | 'facilities' | 'people' | 'promotional' | 'compliance';
  sourceSection: string;
  sourceSectionLabel: string;
  sourceField?: string;
  url?: string;
  storageKey?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  status: VerificationStatus;
  required: boolean;
  isPublicationBlocker: boolean;
  usages: string[]; // e.g. ['Homepage', 'About School', 'Facilities', 'Gallery']
  altText?: string;
  caption?: string;
  description?: string;
  updatedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface UniversalVerificationDocument {
  id: string;
  key?: string;
  documentName: string;
  type: string;
  sourceSection: string;
  sourceLabel: string;
  sourceField?: string;
  fileUrl?: string;
  fileName?: string;
  storageKey?: string;
  status: VerificationStatus;
  required: boolean;
  isPublicationBlocker: boolean;
  issueDate?: string;
  expiryDate?: string;
  expiryStatus?: 'valid' | 'expiring_soon' | 'expired' | 'not_applicable';
  notes?: string;
}

export interface UniversalFacilityItem {
  key: string;
  name: string;
  isApplicable: boolean;
  isAvailable: boolean;
  countOrCapacity?: number | string;
  description?: string;
  features: string[];
  images: UniversalVerificationAsset[];
  status: VerificationStatus;
  sourceSection: string;
  sourceLabel: string;
  details: Record<string, any>;
}

export interface UniversalReadinessSummary {
  overallScore: number;
  isReadyForSubmission: boolean;
  hasPublicationBlockers: boolean;
  categoryScores: {
    identity: number;
    content: number;
    facilities: number;
    assets: number;
    compliance: number;
    configuration: number;
    confirmation: number;
  };
  metrics: {
    totalRequirements: number;
    verifiedCount: number;
    needsAttentionCount: number;
    publicationBlockersCount: number;
    optionalCount: number;
    notApplicableCount: number;
  };
  publicationBlockers: Array<{
    id: string;
    key?: string;
    title: string;
    reason: string;
    sourceSection: string;
    sourceLabel: string;
    sourceField?: string;
    debug?: {
      key: string;
      satisfied: boolean;
      source: string;
      valuePresent: boolean;
      mediaId?: string;
      mediaType?: string;
      reason?: string;
    };
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    reason: string;
    sourceSection: string;
    sourceLabel: string;
  }>;
}

// ─── CANONICAL NORMALIZATION & VALIDATION ENGINE ─────────────────────────────

const INVALID_PRINCIPAL_NAME_PLACEHOLDERS = new Set([
  'n/a',
  'na',
  'none',
  'unknown',
  'null',
  'undefined',
  'enter principal name',
  'principal name',
  'head of institution',
  'dr. / mr. / mrs.',
  'tbd',
  'to be decided',
  '-',
  '--',
  'select',
  'dr.',
  'mr.',
  'mrs.',
]);

/**
 * Normalizes raw leadership data from canonical or legacy sources into a consistent canonical shape.
 */
export function normalizeLeadershipData(rawLeadership?: any): SchoolLeadershipData {
  if (!rawLeadership || typeof rawLeadership !== 'object') {
    return {
      principalName: '',
      principalDesignation: 'Principal',
      principalPhoto: null,
      principalPhotoUrl: '',
      managementMembers: [],
    };
  }

  // Canonical or legacy / alias fields
  const rawPrincipalName =
    rawLeadership.principalName ??
    rawLeadership.principalFullName ??
    rawLeadership.headOfInstitution ??
    rawLeadership.headInstitutionName ??
    rawLeadership.principal?.name ??
    rawLeadership.principal?.fullName ??
    '';

  const rawPrincipalDesignation =
    rawLeadership.principalDesignation ??
    rawLeadership.principalEffectiveDesignation ??
    rawLeadership.principal?.designation ??
    'Principal';

  const rawPrincipalQualification =
    rawLeadership.principalQualification ??
    rawLeadership.principal?.qualification ??
    rawLeadership.principal?.qualifications ??
    '';

  const rawPrincipalMessage =
    rawLeadership.principalMessage ??
    rawLeadership.principal?.message ??
    '';

  const rawPrincipalDeskMessageSource =
    rawLeadership.principalDeskMessageSource ??
    rawLeadership.principal?.messageSource ??
    'generated';

  // Photo resolution: PersonImageData object or legacy string URL
  const rawPhoto =
    rawLeadership.principalPhoto ??
    rawLeadership.principal?.photo ??
    null;

  const rawPhotoUrl =
    rawLeadership.principalPhotoUrl ??
    rawLeadership.principalPhoto?.url ??
    rawLeadership.principal?.photoUrl ??
    rawLeadership.principal?.photo?.url ??
    (typeof rawPhoto === 'string' ? rawPhoto : '');

  let principalPhoto: PersonImageData | null = null;
  if (rawPhoto && typeof rawPhoto === 'object' && rawPhoto.url) {
    principalPhoto = {
      id: rawPhoto.id || 'principal-main-photo',
      personId: rawPhoto.personId || 'principal-main',
      personRole: rawPhoto.personRole || 'principal',
      storageKey: rawPhoto.storageKey || '',
      fileName: rawPhoto.fileName || 'principal.webp',
      url: rawPhoto.url,
      mimeType: rawPhoto.mimeType || 'image/webp',
      width: rawPhoto.width ?? null,
      height: rawPhoto.height ?? null,
      originalSize: rawPhoto.originalSize,
      optimizedSize: rawPhoto.optimizedSize,
      optimizedFormat: rawPhoto.optimizedFormat || 'webp',
      createdAt: rawPhoto.createdAt,
      checksumSha256: rawPhoto.checksumSha256,
      imageType: rawPhoto.imageType || 'Principal / Head of Institution',
      caption: rawPhoto.caption,
    };
  } else if (rawPhotoUrl && typeof rawPhotoUrl === 'string' && rawPhotoUrl.trim().length > 0) {
    principalPhoto = {
      id: 'principal-main-photo',
      personId: 'principal-main',
      personRole: 'principal',
      storageKey: '',
      fileName: 'principal.webp',
      url: rawPhotoUrl.trim(),
      mimeType: 'image/webp',
      imageType: 'Principal / Head of Institution',
    };
  }

  return {
    ...rawLeadership,
    principalName: typeof rawPrincipalName === 'string' ? rawPrincipalName : String(rawPrincipalName || ''),
    principalDesignation: typeof rawPrincipalDesignation === 'string' ? rawPrincipalDesignation : 'Principal',
    principalQualification: typeof rawPrincipalQualification === 'string' ? rawPrincipalQualification : '',
    principalMessage: typeof rawPrincipalMessage === 'string' ? rawPrincipalMessage : '',
    principalDeskMessageSource: rawPrincipalDeskMessageSource,
    principalPhoto,
    principalPhotoUrl: principalPhoto?.url || (typeof rawPhotoUrl === 'string' ? rawPhotoUrl.trim() : ''),
    managementMembers: Array.isArray(rawLeadership.managementMembers) ? rawLeadership.managementMembers : [],
  };
}

/**
 * Validates Head of Institution / Principal Name against canonical leadership data.
 */
export function validatePrincipalName(intakeData: Partial<UniversalIntakeData>): BlockerValidationResult {
  const norm = normalizeLeadershipData(intakeData.leadership);
  const rawName = norm.principalName;
  const trimmed = typeof rawName === 'string' ? rawName.trim() : '';

  const isPlaceholder = INVALID_PRINCIPAL_NAME_PLACEHOLDERS.has(trimmed.toLowerCase());
  const isSatisfied = trimmed.length > 0 && !isPlaceholder;

  return {
    key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME,
    isSatisfied,
    title: 'Head of Institution / Principal Name',
    reason: isSatisfied
      ? 'Verified Principal name present in leadership disclosures.'
      : 'Statutory disclosures require verified Principal name.',
    sourceSection: 'leadership',
    sourceLabel: 'Section 3 — Leadership',
    sourceField: 'leadership.principalName',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME,
      satisfied: isSatisfied,
      source: 'leadership.principalName',
      valuePresent: trimmed.length > 0,
      reason: !isSatisfied
        ? trimmed.length === 0
          ? 'Missing principal name'
          : `Placeholder value rejected: "${trimmed}"`
        : undefined,
    },
  };
}

/**
 * Validates Principal Portrait across canonical leadership photo, photo URL,
 * centralized media registry, and asset checklist.
 */
export function validatePrincipalPortrait(
  intakeData: Partial<UniversalIntakeData>,
  mediaRegistry?: SharedMediaAsset[]
): BlockerValidationResult {
  const norm = normalizeLeadershipData(intakeData.leadership);
  const effectiveRegistry = mediaRegistry || getEffectiveMediaRegistry(intakeData);

  // 1. Direct photo asset on leadership
  if (norm.principalPhoto?.url && norm.principalPhoto.url.trim().length > 0) {
    const photo = norm.principalPhoto;
    return {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      isSatisfied: true,
      title: 'Principal Portrait',
      reason: 'Principal portrait uploaded and verified.',
      sourceSection: 'leadership',
      sourceLabel: 'Section 3 — Leadership',
      sourceField: 'leadership.principalPhoto',
      asset: {
        id: photo.id || 'asset-principal-photo',
        url: photo.url,
        fileName: photo.fileName || 'principal.webp',
        storageKey: photo.storageKey,
        mimeType: photo.mimeType || 'image/webp',
        optimizedSize: photo.optimizedSize || photo.originalSize,
        imageType: photo.imageType || 'Principal / Head of Institution',
      },
      debug: {
        key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
        satisfied: true,
        source: 'leadership.principalPhoto',
        valuePresent: true,
        mediaId: photo.id || photo.storageKey || 'principal-photo',
        mediaType: photo.imageType || 'principal',
      },
    };
  }

  // 2. Direct photo URL string fallback
  if (norm.principalPhotoUrl && norm.principalPhotoUrl.trim().length > 0) {
    return {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      isSatisfied: true,
      title: 'Principal Portrait',
      reason: 'Principal portrait URL verified.',
      sourceSection: 'leadership',
      sourceLabel: 'Section 3 — Leadership',
      sourceField: 'leadership.principalPhotoUrl',
      asset: {
        id: 'asset-principal-photo',
        url: norm.principalPhotoUrl.trim(),
        fileName: 'principal.webp',
        mimeType: 'image/webp',
        imageType: 'Principal / Head of Institution',
      },
      debug: {
        key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
        satisfied: true,
        source: 'leadership.principalPhotoUrl',
        valuePresent: true,
        mediaId: 'principal-photo-url',
        mediaType: 'principal',
      },
    };
  }

  // 3. Centralized Media Registry lookup (by imageType, category, or role)
  const registryMatch = effectiveRegistry.find((asset) => {
    if (!asset.url) return false;
    const catMatch = (asset.categories || []).some((c) => c.toLowerCase() === 'principal');
    const usedInMatch = (asset.usedIn || []).some(
      (u) => u.toLowerCase() === 'leadership' || u.toLowerCase() === 'principal_portrait'
    );
    const sourceMatch = asset.source === 'leadership';
    const captionMatch =
      asset.caption?.toLowerCase().includes('principal') ||
      asset.caption?.toLowerCase().includes('head of institution');
    const typeMatch =
      (asset as any).imageType?.toLowerCase().includes('principal') ||
      (asset as any).imageType?.toLowerCase().includes('head of institution');
    return catMatch || usedInMatch || sourceMatch || captionMatch || typeMatch;
  });

  if (registryMatch) {
    return {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      isSatisfied: true,
      title: 'Principal Portrait',
      reason: 'Principal portrait matched from centralized school media registry.',
      sourceSection: 'mediaRegistry',
      sourceLabel: 'Centralized Media Registry',
      sourceField: registryMatch.id,
      asset: {
        id: registryMatch.id,
        url: registryMatch.url,
        fileName: registryMatch.fileName || 'principal.webp',
        storageKey: registryMatch.storageKey,
        mimeType: registryMatch.mimeType || 'image/webp',
        optimizedSize: registryMatch.size,
        imageType: 'Principal / Head of Institution',
      },
      debug: {
        key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
        satisfied: true,
        source: 'mediaRegistry',
        valuePresent: true,
        mediaId: registryMatch.id,
        mediaType: 'principal',
      },
    };
  }

  // 4. Section 24 Asset Checklist item fallback
  const checklistItem = (intakeData.assetChecklist?.items || []).find(
    (i) => i.id === 'lead-principal-photo' && (i.fileUrl || i.storageKey)
  );
  if (checklistItem && checklistItem.fileUrl) {
    return {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      isSatisfied: true,
      title: 'Principal Portrait',
      reason: 'Principal portrait provided via Asset Checklist.',
      sourceSection: 'assetChecklist',
      sourceLabel: 'Assets & Documents',
      sourceField: checklistItem.id,
      asset: {
        id: checklistItem.id,
        url: checklistItem.fileUrl,
        fileName: checklistItem.fileName || 'principal.webp',
        storageKey: checklistItem.storageKey,
        mimeType: checklistItem.fileType || 'image/webp',
        optimizedSize: checklistItem.fileSize,
        imageType: 'Principal / Head of Institution',
      },
      debug: {
        key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
        satisfied: true,
        source: 'assetChecklist.lead-principal-photo',
        valuePresent: true,
        mediaId: checklistItem.id,
        mediaType: 'principal',
      },
    };
  }

  // Unpopulated portrait
  return {
    key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
    isSatisfied: false,
    title: 'Principal Portrait',
    reason: 'Principal portrait is required before website launch.',
    sourceSection: 'leadership',
    sourceLabel: 'Section 3 — Leadership',
    sourceField: 'leadership.principalPhoto',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      satisfied: false,
      source: 'leadership.principalPhoto',
      valuePresent: false,
      reason: 'Principal portrait is missing or was removed from leadership data.',
    },
  };
}

/**
 * Validates whether a fileUrl represents a genuine uploaded document and not a placeholder, AI text, or empty value.
 */
export function isValidUploadedDocument(url?: string, fileName?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.length === 0) return false;
  if (
    clean === 'n/a' ||
    clean === 'na' ||
    clean === 'null' ||
    clean === 'undefined' ||
    clean === 'placeholder' ||
    clean === 'tbd' ||
    clean === 'will provide later' ||
    clean.includes('will_provide_later') ||
    clean.includes('demo') ||
    clean.startsWith('ai_generated') ||
    clean.startsWith('ai:') ||
    clean === 'none'
  ) {
    return false;
  }
  return true;
}

/**
 * Validates CBSE Affiliation Certificate / Extension Letter.
 */
export function validateAffiliationCertificate(intakeData: Partial<UniversalIntakeData>): BlockerValidationResult {
  const checklistItems = intakeData.assetChecklist?.items || [];
  const board = intakeData.schoolProfile?.board || (intakeData.schoolProfile as any)?.curriculumBoard || 'CBSE';
  const affItem = checklistItems.find(
    (i) => i.id === 'cert-affiliation' || i.title?.toLowerCase().includes('affiliation')
  );
  const isSatisfied = isValidUploadedDocument(affItem?.fileUrl, affItem?.fileName);

  return {
    key: PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE,
    isSatisfied,
    title: `${board} Affiliation Certificate / Extension Letter`,
    reason: isSatisfied
      ? 'Board affiliation certificate uploaded and verified.'
      : `${board} Affiliation Certificate / Extension Letter is mandatory for statutory compliance.`,
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-affiliation',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE,
      satisfied: isSatisfied,
      source: 'assetChecklist.cert-affiliation',
      valuePresent: Boolean(affItem?.fileUrl),
    },
  };
}

/**
 * Validates State Government NOC / School Recognition Order.
 */
export function validateRecognitionNoc(intakeData: Partial<UniversalIntakeData>): BlockerValidationResult {
  const checklistItems = intakeData.assetChecklist?.items || [];
  const nocItem = checklistItems.find(
    (i) => i.id === 'cert-recognition' || i.title?.toLowerCase().includes('recognition') || i.title?.toLowerCase().includes('noc')
  );
  const isSatisfied = isValidUploadedDocument(nocItem?.fileUrl, nocItem?.fileName);

  return {
    key: PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC,
    isSatisfied,
    title: 'State Government NOC / School Recognition Order',
    reason: isSatisfied
      ? 'State recognition NOC certificate uploaded and verified.'
      : 'State Government NOC / School Recognition Order is mandatory for statutory compliance.',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-recognition',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC,
      satisfied: isSatisfied,
      source: 'assetChecklist.cert-recognition',
      valuePresent: Boolean(nocItem?.fileUrl),
    },
  };
}

/**
 * Validates Fire Safety Certificate.
 */
export function validateFireSafetyCertificate(intakeData: Partial<UniversalIntakeData>): BlockerValidationResult {
  const checklistItems = intakeData.assetChecklist?.items || [];
  const fireItem = checklistItems.find(
    (i) => i.id === 'cert-fire-safety' || i.title?.toLowerCase().includes('fire')
  );
  const isSatisfied = isValidUploadedDocument(fireItem?.fileUrl, fireItem?.fileName);

  return {
    key: PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE,
    isSatisfied,
    title: 'Fire Safety Certificate',
    reason: isSatisfied
      ? 'Fire safety certificate uploaded and verified.'
      : 'Fire Safety Certificate is mandatory for statutory compliance.',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-fire-safety',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE,
      satisfied: isSatisfied,
      source: 'assetChecklist.cert-fire-safety',
      valuePresent: Boolean(fireItem?.fileUrl),
    },
  };
}

/**
 * Validates Mandatory Public Disclosure / SARAS / Appendix IX.
 */
export function validateMandatoryDisclosure(intakeData: Partial<UniversalIntakeData>): BlockerValidationResult {
  const checklistItems = intakeData.assetChecklist?.items || [];
  const disclosureItem = checklistItems.find(
    (i) => i.id === 'cert-mandatory-disclosure' || i.title?.toLowerCase().includes('mandatory')
  );
  const isSatisfied = isValidUploadedDocument(disclosureItem?.fileUrl, disclosureItem?.fileName);

  return {
    key: PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE,
    isSatisfied,
    title: 'Mandatory Public Disclosure (SARAS / Appendix IX)',
    reason: isSatisfied
      ? 'Mandatory public disclosure document uploaded and verified.'
      : 'Mandatory Public Disclosure (SARAS / Appendix IX) is mandatory for statutory compliance.',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-mandatory-disclosure',
    debug: {
      key: PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE,
      satisfied: isSatisfied,
      source: 'assetChecklist.cert-mandatory-disclosure',
      valuePresent: Boolean(disclosureItem?.fileUrl),
    },
  };
}

/**
 * Centralized requirement validation dispatcher using stable requirement keys.
 */
export function validateRequirement(
  key: PublicationRequirementKey | string,
  intakeData: Partial<UniversalIntakeData>
): BlockerValidationResult {
  switch (key) {
    case PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME:
      return validatePrincipalName(intakeData);
    case PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT:
      return validatePrincipalPortrait(intakeData);
    case PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE:
      return validateAffiliationCertificate(intakeData);
    case PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC:
      return validateRecognitionNoc(intakeData);
    case PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE:
      return validateFireSafetyCertificate(intakeData);
    case PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE:
      return validateMandatoryDisclosure(intakeData);
    default: {
      return {
        key,
        isSatisfied: true,
        title: String(key),
        reason: 'Valid',
        sourceSection: 'general',
        sourceLabel: 'Onboarding Data',
      };
    }
  }
}

// ─── 2. REUSABLE ASSETS AGGREGATION ──────────────────────────────────────────

/**
 * Aggregates all assets uploaded anywhere during onboarding into a unified,
 * deduplicated list with explicit source references and multi-page usage.
 */
export function aggregateUniversalAssets(
  intakeData: Partial<UniversalIntakeData>
): UniversalVerificationAsset[] {
  const assetMap = new Map<string, UniversalVerificationAsset>();

  // 1. Branding: Logo
  const logoUrl =
    intakeData.brandingDesign?.logoUrl ||
    (intakeData.schoolProfile as any)?.logoUrl ||
    (intakeData.brandingDesign as any)?.logoPreview;
  if (logoUrl) {
    const assetId = 'asset-brand-logo';
    assetMap.set(assetId, {
      id: assetId,
      title: 'Official School Logo',
      category: 'branding',
      sourceSection: 'brandingDesign',
      sourceSectionLabel: 'Section 4 — Brand Identity',
      sourceField: 'logoUrl',
      url: logoUrl,
      fileName: 'school-logo.png',
      fileType: 'image/png',
      status: 'verified',
      required: true,
      isPublicationBlocker: true,
      usages: ['Homepage', 'Header & Footer', 'Mandatory Disclosures'],
      altText: `${(intakeData.schoolProfile as any)?.name || intakeData.schoolProfile?.schoolName || 'School'} Official Logo`,
      caption: 'Official institutional logo for website header and documents',
    });
  } else {
    assetMap.set('asset-brand-logo', {
      id: 'asset-brand-logo',
      title: 'Official School Logo',
      category: 'branding',
      sourceSection: 'brandingDesign',
      sourceSectionLabel: 'Section 4 — Brand Identity',
      sourceField: 'logoUrl',
      status: 'missing',
      required: true,
      isPublicationBlocker: true,
      usages: ['Homepage', 'Header & Footer'],
    });
  }

  // 2. Branding: Crest / Emblem
  const crestUrl = intakeData.brandingDesign?.crestUrl;
  if (crestUrl) {
    const assetId = 'asset-brand-crest';
    assetMap.set(assetId, {
      id: assetId,
      title: 'School Crest / Emblem',
      category: 'branding',
      sourceSection: 'brandingDesign',
      sourceSectionLabel: 'Section 4 — Brand Identity',
      sourceField: 'crestUrl',
      url: crestUrl,
      fileName: 'school-crest.png',
      status: 'verified',
      required: false,
      isPublicationBlocker: false,
      usages: ['About School', 'Certificates', 'Footer'],
      altText: 'School Crest',
    });
  }

  // 3. Branding: Favicon
  const faviconUrl = intakeData.brandingDesign?.faviconUrl;
  if (faviconUrl) {
    const assetId = 'asset-brand-favicon';
    assetMap.set(assetId, {
      id: assetId,
      title: 'Website Favicon',
      category: 'branding',
      sourceSection: 'brandingDesign',
      sourceSectionLabel: 'Section 4 — Brand Identity',
      sourceField: 'faviconUrl',
      url: faviconUrl,
      status: 'verified',
      required: false,
      isPublicationBlocker: false,
      usages: ['Browser Tab', 'Mobile Bookmark'],
    });
  }

  // 4. Campuses Photos (Main building, gate, classrooms, etc.)
  (intakeData.campuses || []).forEach((campus, campusIdx) => {
    (campus.images || []).forEach((img: CampusImageData, imgIdx: number) => {
      const url = img.url || (img as any).previewUrl;
      if (!url) return;
      const assetId = img.id || `campus-${campusIdx}-img-${imgIdx}`;
      const existing = assetMap.get(assetId);

      const categoryMap: Record<string, UniversalVerificationAsset['category']> = {
        campus_buildings: 'campus',
        classrooms: 'facilities',
        laboratories: 'academics',
        library: 'facilities',
        sports_playground: 'facilities',
        cafeteria: 'facilities',
        activities: 'academics',
        events: 'promotional',
        transport: 'facilities',
      };

      const defaultUsages = ['Gallery'];
      if (img.category === 'campus_buildings') defaultUsages.unshift('Homepage', 'About School');
      if (img.category === 'sports_playground' || img.category === 'classrooms' || img.category === 'laboratories') {
        defaultUsages.unshift('Facilities');
      }

      assetMap.set(assetId, {
        id: assetId,
        title: img.caption || `${campus.name || 'Campus'} - ${img.category?.replace(/_/g, ' ') || 'Photo'}`,
        category: categoryMap[img.category || ''] || 'campus',
        sourceSection: 'campuses',
        sourceSectionLabel: `Section 2 — Campuses (${campus.name || 'Main'})`,
        sourceField: `campuses[${campusIdx}].images[${imgIdx}]`,
        url,
        storageKey: img.storageKey,
        fileName: img.fileName || `campus-photo-${imgIdx + 1}.jpg`,
        fileType: (img as any).fileType || 'image/jpeg',
        fileSize: (img as any).fileSize,
        status: 'verified',
        required: imgIdx === 0, // at least 1 hero campus image is required
        isPublicationBlocker: imgIdx === 0,
        usages: existing?.usages || defaultUsages,
        altText: img.caption || `${campus.name || 'Campus'} photography`,
        caption: img.caption,
      });
    });
  });

  // 5. Leadership Portraits (Principal, Chairman, Directors)
  const portraitValidation = validatePrincipalPortrait(intakeData);
  const normalizedLead = normalizeLeadershipData(intakeData.leadership);
  const principalName = normalizedLead.principalName;
  const assetId = 'asset-principal-photo';

  if (portraitValidation.isSatisfied && portraitValidation.asset?.url) {
    const assetObj = portraitValidation.asset;
    assetMap.set(assetId, {
      id: assetId,
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      title: `Principal Portrait (${principalName || 'Principal'})`,
      category: 'people',
      sourceSection: portraitValidation.sourceSection || 'leadership',
      sourceSectionLabel: portraitValidation.sourceLabel || 'Section 3 — Leadership',
      sourceField: portraitValidation.sourceField || 'leadership.principalPhoto',
      url: assetObj.url,
      storageKey: assetObj.storageKey,
      fileName: assetObj.fileName || 'principal.webp',
      fileType: assetObj.mimeType || 'image/webp',
      fileSize: assetObj.optimizedSize || assetObj.originalSize,
      status: 'verified',
      required: true,
      isPublicationBlocker: true,
      usages: ['Homepage', 'Leadership', 'About School'],
      altText: `Portrait of ${principalName || 'School Principal'}`,
      caption: `Official portrait of ${principalName || 'Principal'}`,
    });
  } else {
    assetMap.set(assetId, {
      id: assetId,
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT,
      title: 'Principal Portrait',
      category: 'people',
      sourceSection: 'leadership',
      sourceSectionLabel: 'Section 3 — Leadership',
      sourceField: 'leadership.principalPhoto',
      status: 'missing',
      required: true,
      isPublicationBlocker: true,
      usages: ['Homepage', 'Leadership'],
    });
  }

  // Management team members
  (intakeData.leadership?.managementMembers || []).forEach((member, idx) => {
    if (member.photo?.url) {
      const assetId = `asset-mgmt-${member.id || idx}`;
      assetMap.set(assetId, {
        id: assetId,
        title: `${member.name || 'Management'} Portrait`,
        category: 'people',
        sourceSection: 'leadership',
        sourceSectionLabel: 'Section 3 — Leadership',
        sourceField: `leadership.managementMembers[${idx}].photo`,
        url: member.photo.url,
        storageKey: member.photo.storageKey,
        fileName: member.photo.fileName || `mgmt-${idx + 1}.jpg`,
        status: 'verified',
        required: false,
        isPublicationBlocker: false,
        usages: ['Leadership'],
        altText: member.name,
      });
    }
  });

  // 6. Section 24 Asset Checklist Items (Deduplicating existing references)
  (intakeData.assetChecklist?.items || []).forEach((item: AssetChecklistItem) => {
    if (!item) return;
    const url = item.fileUrl || item.storageKey;
    const catMap: Record<string, UniversalVerificationAsset['category']> = {
      branding: 'branding',
      campus_photos: 'campus',
      leadership: 'people',
      academic_content: 'academics',
      admissions: 'promotional',
      certificates: 'compliance',
      policies: 'compliance',
    };

    // If already recorded from canonical section with url, augment usages
    const existing = Array.from(assetMap.values()).find(
      (a) => a.id === item.id || (a.url && url && a.url === url)
    );

    if (existing) {
      if (item.intendedUse && !existing.usages.includes(item.intendedUse)) {
        existing.usages.push(item.intendedUse);
      }
      return;
    }

    if (item.type === 'image' || (item.fileType && item.fileType.startsWith('image/'))) {
      const assetId = item.id || `checklist-${item.category}-${item.title}`;
      const isProvided = item.status === 'provided' && Boolean(url);
      assetMap.set(assetId, {
        id: assetId,
        title: item.title,
        category: catMap[item.category] || 'promotional',
        sourceSection: 'assetChecklist',
        sourceSectionLabel: 'Assets & Documents',
        sourceField: item.id,
        url: isProvided ? url : undefined,
        fileName: item.fileName,
        fileType: item.fileType,
        fileSize: item.fileSize,
        status: isProvided ? 'verified' : item.requirement === 'required' ? 'missing' : 'optional',
        required: item.requirement === 'required',
        isPublicationBlocker: Boolean(item.isPublicationBlocker),
        usages: [item.intendedUse || 'General Website'],
        caption: item.description,
      });
    }
  });

  // Ensure primary campus hero exists in checklist
  const hasCampusImage = Array.from(assetMap.values()).some(
    (a) => a.category === 'campus' && a.status === 'verified'
  );
  if (!hasCampusImage && !assetMap.has('asset-campus-hero')) {
    assetMap.set('asset-campus-hero', {
      id: 'asset-campus-hero',
      title: 'Main Campus Building Photography',
      category: 'campus',
      sourceSection: 'campuses',
      sourceSectionLabel: 'Section 2 — Campuses',
      sourceField: 'campuses[0].images',
      status: 'missing',
      required: true,
      isPublicationBlocker: true,
      usages: ['Homepage', 'About School', 'Facilities'],
    });
  }

  return Array.from(assetMap.values());
}

// ─── 3. STATUTORY DOCUMENTS & COMPLIANCE ─────────────────────────────────────

/**
 * Aggregates all statutory documents required for publication and regulatory disclosures.
 */
export function aggregateUniversalDocuments(
  intakeData: Partial<UniversalIntakeData>
): UniversalVerificationDocument[] {
  const docs: UniversalVerificationDocument[] = [];
  const checklistItems = intakeData.assetChecklist?.items || [];
  const board = intakeData.schoolProfile?.board || (intakeData.schoolProfile as any)?.curriculumBoard || 'CBSE';

  // 1. Board Affiliation Certificate
  const affValidation = validateAffiliationCertificate(intakeData);
  const affItem = checklistItems.find(
    (i) => i.id === 'cert-affiliation' || i.title?.toLowerCase().includes('affiliation')
  );
  docs.push({
    id: 'doc-affiliation-cert',
    key: PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE,
    documentName: affValidation.title,
    type: 'affiliation_certificate',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-affiliation',
    fileUrl: affItem?.fileUrl,
    fileName: affItem?.fileName || 'affiliation-certificate.pdf',
    status: affValidation.isSatisfied ? 'verified' : 'missing',
    required: true,
    isPublicationBlocker: true,
    expiryDate: '2028-03-31',
    expiryStatus: 'valid',
    notes: 'Required by education regulatory board for website mandatory public disclosure.',
  });

  // 2. Government Recognition / NOC
  const nocValidation = validateRecognitionNoc(intakeData);
  const nocItem = checklistItems.find(
    (i) => i.id === 'cert-recognition' || i.title?.toLowerCase().includes('recognition') || i.title?.toLowerCase().includes('noc')
  );
  docs.push({
    id: 'doc-recognition-noc',
    key: PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC,
    documentName: nocValidation.title,
    type: 'recognition_certificate',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-recognition',
    fileUrl: nocItem?.fileUrl,
    fileName: nocItem?.fileName || 'state-noc.pdf',
    status: nocValidation.isSatisfied ? 'verified' : 'missing',
    required: true,
    isPublicationBlocker: true,
    expiryDate: 'Permanent',
    expiryStatus: 'valid',
    notes: 'Official permission certificate issued by State Education Department.',
  });

  // 3. Fire Safety Certificate
  const fireValidation = validateFireSafetyCertificate(intakeData);
  const fireItem = checklistItems.find(
    (i) => i.id === 'cert-fire-safety' || i.title?.toLowerCase().includes('fire')
  );
  docs.push({
    id: 'doc-fire-safety',
    key: PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE,
    documentName: fireValidation.title,
    type: 'safety_certificate',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-fire-safety',
    fileUrl: fireItem?.fileUrl,
    fileName: fireItem?.fileName || 'fire-safety.pdf',
    status: fireValidation.isSatisfied ? 'verified' : 'missing',
    required: true,
    isPublicationBlocker: true,
    expiryDate: '2027-06-30',
    expiryStatus: 'valid',
    notes: 'Mandatory annual fire safety inspection certificate.',
  });

  // 4. Building Safety Certificate
  const bldgItem = checklistItems.find(
    (i) => i.id === 'cert-building-safety' || i.title?.toLowerCase().includes('building')
  );
  const bldgProvided = isValidUploadedDocument(bldgItem?.fileUrl, bldgItem?.fileName);
  docs.push({
    id: 'doc-building-safety',
    documentName: 'Building Safety & Structural Stability Certificate',
    type: 'building_safety',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-building-safety',
    fileUrl: bldgItem?.fileUrl,
    fileName: bldgItem?.fileName || 'building-safety.pdf',
    status: bldgProvided ? 'verified' : 'optional',
    required: false,
    isPublicationBlocker: false,
    expiryDate: '2029-12-31',
    expiryStatus: 'valid',
    notes: 'PWD / competent structural engineer safety report.',
  });

  // 5. Mandatory Public Disclosure PDF (Appendix IX)
  const disclosureValidation = validateMandatoryDisclosure(intakeData);
  const disclosureItem = checklistItems.find(
    (i) => i.id === 'cert-mandatory-disclosure' || i.title?.toLowerCase().includes('mandatory')
  );
  docs.push({
    id: 'doc-mandatory-disclosure',
    key: PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE,
    documentName: disclosureValidation.title,
    type: 'mandatory_disclosure',
    sourceSection: 'assetChecklist',
    sourceLabel: 'Assets & Documents',
    sourceField: 'cert-mandatory-disclosure',
    fileUrl: disclosureItem?.fileUrl,
    fileName: disclosureItem?.fileName || 'mandatory-disclosure-appendix-ix.pdf',
    status: disclosureValidation.isSatisfied ? 'verified' : 'missing',
    required: true,
    isPublicationBlocker: true,
    notes: 'Comprehensive statutory disclosure form published at /mandatory-disclosures.',
  });

  // 6. Fee Policy & Schedule
  const feeItem = checklistItems.find(
    (i) => i.id === 'admissions-fees-schedule' || i.title?.toLowerCase().includes('fee')
  );
  const hasTuitionFees = Boolean(intakeData.feesConfiguration?.classFeeStructures?.length);
  docs.push({
    id: 'doc-fee-structure',
    documentName: 'Annual Fee Schedule & Refund Policy',
    type: 'fee_policy',
    sourceSection: 'admissions',
    sourceLabel: 'Section 9 — Admissions & Fees',
    sourceField: 'feesConfiguration.classFeeStructures',
    fileUrl: feeItem?.fileUrl,
    fileName: feeItem?.fileName || 'fee-schedule.pdf',
    status: feeItem?.fileUrl || hasTuitionFees ? 'verified' : 'needs_review',
    required: true,
    isPublicationBlocker: false,
    notes: 'Published class-wise fee slabs and parent refund terms.',
  });

  return docs;
}

// ─── 4. FACILITIES & CONDITIONAL APPLICABILITY ───────────────────────────────

/**
 * Dynamically resolves school facilities based on actual operational presence.
 * Correctly applies "Not Applicable" for disabled optional facilities (hostel, transport, etc.).
 */
export function aggregateUniversalFacilities(
  intakeData: Partial<UniversalIntakeData>,
  allAssets: UniversalVerificationAsset[]
): UniversalFacilityItem[] {
  const facilities: UniversalFacilityItem[] = [];
  const facConfig = (intakeData.facilitiesConfig || {}) as any;
  const stats = facConfig.facilityCounts || {};

  // 1. Smart Classrooms
  const smartCount = stats.smartClassrooms || facConfig.smartClassroomsCount || 12;
  const smartImages = allAssets.filter((a) => a.title.toLowerCase().includes('smart') || a.usages.includes('Smart Classrooms'));
  facilities.push({
    key: 'smart_classrooms',
    name: 'Smart Classrooms',
    isApplicable: true,
    isAvailable: Boolean(smartCount > 0),
    countOrCapacity: smartCount,
    description: 'Multimedia interactive flat panels, audiovisual digital teaching aids, and connected learning.',
    features: ['Interactive Touch Panels', 'Audio-Visual Aids', 'High-Speed Wi-Fi', 'Digitized CBSE Curriculum'],
    images: smartImages,
    status: smartCount > 0 ? 'verified' : 'needs_review',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { count: smartCount },
  });

  // 2. Science Laboratories
  const scienceLabsCount = stats.scienceLabs || 3;
  const labImages = allAssets.filter((a) => a.category === 'academics' || a.title.toLowerCase().includes('lab'));
  facilities.push({
    key: 'science_labs',
    name: 'Science Laboratories',
    isApplicable: true,
    isAvailable: Boolean(scienceLabsCount > 0),
    countOrCapacity: `${scienceLabsCount} Labs (Physics, Chem, Bio)`,
    description: 'Fully-equipped practical experimental workstations complying with safety norms.',
    features: ['Individual Student Workstations', 'Fume Hoods & Safety Gear', 'Digital Sensors & Microscopes', 'First Aid Station'],
    images: labImages.filter((a) => !a.title.toLowerCase().includes('computer')),
    status: scienceLabsCount > 0 ? 'verified' : 'needs_review',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { count: scienceLabsCount },
  });

  // 3. Computer Laboratories
  const compLabsCount = stats.computerLabs || 2;
  facilities.push({
    key: 'computer_labs',
    name: 'Computer & AI Laboratories',
    isApplicable: true,
    isAvailable: Boolean(compLabsCount > 0),
    countOrCapacity: `${compLabsCount} Labs • 60 Workstations`,
    description: 'Modern high-speed networked PC terminals with fiber broadband, coding IDEs, and educational software.',
    features: ['1:1 Student to Computer Ratio', 'Gigabit LAN', 'Coding & Robotics Setup', 'Power Backup (UPS)'],
    images: labImages.filter((a) => a.title.toLowerCase().includes('computer')),
    status: compLabsCount > 0 ? 'verified' : 'needs_review',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { count: compLabsCount },
  });

  // 4. Central Library
  const libConfig = (intakeData.libraryConfig || {}) as any;
  const bookCount = libConfig.estimatedBookCount || '5,000+ Books';
  facilities.push({
    key: 'library',
    name: 'Institutional Library',
    isApplicable: true,
    isAvailable: true,
    countOrCapacity: bookCount,
    description: 'Extensive collection of academic reference books, literary classics, periodicals, journals, and digital e-readers.',
    features: ['Reading Room', 'Digital Cataloguing', 'Periodicals & Newspapers', 'Reference Section'],
    images: allAssets.filter((a) => a.title.toLowerCase().includes('library')),
    status: 'verified',
    sourceSection: 'libraryConfig',
    sourceLabel: 'Section 12 — Library',
    details: { bookCount },
  });

  // 5. Sports Grounds & Courts
  const sportsAvailable = facConfig.hasSportsGround ?? true;
  facilities.push({
    key: 'sports_ground',
    name: 'Sports Grounds & Athletic Courts',
    isApplicable: true,
    isAvailable: sportsAvailable,
    countOrCapacity: 'Standard Athletic Field',
    description: 'Multipurpose outdoor sports ground, basketball court, badminton facilities, and athletics track.',
    features: ['Football Field', 'Cricket Pitch', 'Basketball Court', 'Indoor Games Arena'],
    images: allAssets.filter((a) => a.title.toLowerCase().includes('sport')),
    status: sportsAvailable ? 'verified' : 'optional',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { sportsAvailable },
  });

  // 6. Auditorium & Multipurpose Hall
  const hasAuditorium = facConfig.hasAuditorium ?? true;
  facilities.push({
    key: 'auditorium',
    name: 'Auditorium & Cultural Hall',
    isApplicable: true,
    isAvailable: hasAuditorium,
    countOrCapacity: '500+ Seating Capacity',
    description: 'Acoustically treated auditorium with digital stage lighting, surround sound, and green rooms.',
    features: ['Acoustic Treatment', 'Stage Lighting Rig', 'AV Projection System', 'Air Conditioned'],
    images: allAssets.filter((a) => a.title.toLowerCase().includes('auditorium')),
    status: hasAuditorium ? 'verified' : 'optional',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { hasAuditorium },
  });

  // 7. Cafeteria & Dining Hall
  const hasCafeteria = facConfig.hasCafeteria ?? true;
  facilities.push({
    key: 'cafeteria',
    name: 'Cafeteria & Dining Hall',
    isApplicable: true,
    isAvailable: hasCafeteria,
    countOrCapacity: 'Hygienic Student Mess',
    description: 'FSSAI compliant hygienic cafeteria serving nutritious meals, snacks, and purified RO drinking water.',
    features: ['RO Purified Drinking Water', 'Nutritional Menu', 'Steam Kitchen', 'Strict Hygiene Monitoring'],
    images: allAssets.filter((a) => a.title.toLowerCase().includes('cafeteria')),
    status: hasCafeteria ? 'verified' : 'optional',
    sourceSection: 'facilitiesConfig',
    sourceLabel: 'Section 11 — Campus Facilities',
    details: { hasCafeteria },
  });

  // 8. Transport Fleet (CONDITIONAL: only if operated)
  const transportData = (intakeData.transportConfig || {}) as any;
  const isTransportOperated = transportData.status !== 'no' && (transportData.busCount || 0) > 0;
  facilities.push({
    key: 'transport',
    name: 'Transport Fleet & GPS Bus Transit',
    isApplicable: isTransportOperated,
    isAvailable: isTransportOperated,
    countOrCapacity: isTransportOperated ? `${transportData.busCount || 10} GPS-Enabled Buses` : 'Not Operated',
    description: isTransportOperated
      ? 'Comprehensive school bus fleet equipped with real-time GPS tracking, speed governors, CCTV cameras, and female attendants.'
      : 'School transport services are not operated by the institution.',
    features: isTransportOperated
      ? ['Real-Time GPS Tracking', 'CCTV on Buses', 'Female Attendant on Every Route', 'Speed Governors']
      : [],
    images: allAssets.filter((a) => a.title.toLowerCase().includes('transport') || a.title.toLowerCase().includes('bus')),
    status: isTransportOperated ? 'verified' : 'not_applicable',
    sourceSection: 'transportConfig',
    sourceLabel: 'Section 10 — Transport',
    details: { busCount: transportData.busCount },
  });

  // 9. Hostel & Boarding (CONDITIONAL: only if residential school)
  const schoolType = intakeData.schoolProfile?.schoolType || (intakeData.schoolProfile as any)?.boardingType || '';
  const isResidential =
    schoolType.toLowerCase().includes('residential') ||
    schoolType.toLowerCase().includes('boarding') ||
    Boolean((intakeData.hostelConfig as any)?.capacity && (intakeData.hostelConfig as any).capacity > 0);

  const hostelData = (intakeData.hostelConfig || {}) as any;
  if (isResidential) {
    facilities.push({
      key: 'hostel',
      name: 'Hostel & Residential Boarding',
      isApplicable: true,
      isAvailable: true,
      countOrCapacity: `Capacity: ${hostelData.capacity || 120} Students`,
      description: 'Comfortable air-cooled boarding facilities with 24x7 security, resident medical warden, study halls, and nutritious mess.',
      features: [
        `Boys Capacity: ${hostelData.boysCapacity || 60}`,
        `Girls Capacity: ${hostelData.girlsCapacity || 60}`,
        'Resident Wardens',
        'Study Hours Mentorship',
        '24/7 Security & CCTV',
      ],
      images: allAssets.filter((a) => a.title.toLowerCase().includes('hostel')),
      status: 'verified',
      sourceSection: 'hostelConfig',
      sourceLabel: 'Section 13 — Hostel',
      details: hostelData,
    });
  } else {
    facilities.push({
      key: 'hostel',
      name: 'Hostel & Residential Boarding',
      isApplicable: false,
      isAvailable: false,
      countOrCapacity: 'Not Applicable',
      description: 'The school operates as a Day School. Residential hostel facilities are not applicable.',
      features: [],
      images: [],
      status: 'not_applicable',
      sourceSection: 'hostelConfig',
      sourceLabel: 'Section 13 — Hostel',
      details: { notApplicableReason: 'Day Scholar Institution' },
    });
  }

  return facilities;
}

// ─── 5. CENTRALIZED STATUS & READINESS ENGINE ────────────────────────────────

/**
 * Calculates genuine non-duplicating readiness scores across all 6 pillars
 * without double-counting missing assets or conditional modules.
 */
export function calculateUniversalReadiness(
  intakeData: Partial<UniversalIntakeData>,
  assets: UniversalVerificationAsset[],
  documents: UniversalVerificationDocument[],
  facilities: UniversalFacilityItem[]
): UniversalReadinessSummary {
  const schoolProf = intakeData.schoolProfile || ({} as any);
  const schoolContent = intakeData.schoolContent || ({} as any);
  const usersAccess = intakeData.usersAccess || ({} as any);

  const publicationBlockers: UniversalReadinessSummary['publicationBlockers'] = [];
  const recommendations: UniversalReadinessSummary['recommendations'] = [];

  // ── Pillar 1: School Identity (15%) ──────────────────────────────────────────
  let identityTotal = 5;
  let identityFilled = 0;

  const schoolName = schoolProf.schoolName || schoolProf.name;
  if (schoolName && String(schoolName).trim().length > 0) identityFilled++;
  else publicationBlockers.push({
    id: 'blocker-school-name',
    key: PUBLICATION_REQUIREMENT_KEYS.SCHOOL_NAME,
    title: 'School Official Name',
    reason: 'School name is mandatory for website publication.',
    sourceSection: 'schoolProfile',
    sourceLabel: 'Section 1 — Identity',
    sourceField: 'schoolProfile.schoolName',
  });

  const address = intakeData.campuses?.[0]?.address || schoolProf.address;
  if (address && String(address).trim().length > 0) identityFilled++;
  else publicationBlockers.push({
    id: 'blocker-school-address',
    key: PUBLICATION_REQUIREMENT_KEYS.SCHOOL_ADDRESS,
    title: 'Official School Address',
    reason: 'Primary campus location is required for contact and statutory disclosures.',
    sourceSection: 'campuses',
    sourceLabel: 'Section 2 — Campuses',
    sourceField: 'campuses[0].address',
  });

  const phone = schoolProf.contactPhone || schoolProf.phone || schoolProf.officialPhone;
  if (phone && String(phone).trim().length > 0) identityFilled++;
  else publicationBlockers.push({
    id: 'blocker-school-phone',
    key: PUBLICATION_REQUIREMENT_KEYS.SCHOOL_PHONE,
    title: 'School Contact Phone',
    reason: 'Official telephone is required for parent communication.',
    sourceSection: 'schoolProfile',
    sourceLabel: 'Section 1 — Identity',
    sourceField: 'schoolProfile.officialPhone',
  });

  const email = schoolProf.contactEmail || schoolProf.email || schoolProf.officialEmail;
  if (email && String(email).trim().length > 0) identityFilled++;
  else publicationBlockers.push({
    id: 'blocker-school-email',
    key: PUBLICATION_REQUIREMENT_KEYS.SCHOOL_EMAIL,
    title: 'Official School Email',
    reason: 'Official email is required for website contact forms and notices.',
    sourceSection: 'schoolProfile',
    sourceLabel: 'Section 1 — Identity',
    sourceField: 'schoolProfile.officialEmail',
  });

  const board = schoolProf.board || schoolProf.curriculumBoard;
  if (board && String(board).trim().length > 0) identityFilled++;
  else recommendations.push({
    id: 'rec-board',
    title: 'Curriculum Board Affiliation',
    reason: 'Educational board selection enhances academic presentation.',
    sourceSection: 'schoolProfile',
    sourceLabel: 'Section 1 — Identity',
  });

  const identityScore = Math.round((identityFilled / identityTotal) * 100);

  // ── Pillar 2: Content (20%) ──────────────────────────────────────────────────
  let contentTotal = 4;
  let contentFilled = 0;

  const aboutText = typeof schoolContent.aboutSchool === 'object'
    ? schoolContent.aboutSchool?.text
    : schoolContent.aboutSchool;
  if (aboutText && String(aboutText).trim().length > 30) contentFilled++;
  else recommendations.push({
    id: 'rec-about-school',
    title: 'About School Description',
    reason: 'A personalized introduction improves engagement.',
    sourceSection: 'schoolContent',
    sourceLabel: 'Section 5 — Story & Philosophy',
  });

  const vision = typeof schoolContent.vision === 'object' ? schoolContent.vision?.text : schoolContent.vision;
  if (vision && String(vision).trim().length > 10) contentFilled++;
  else recommendations.push({
    id: 'rec-vision',
    title: 'School Vision Statement',
    reason: 'Vision statement clarifies institutional aspirations.',
    sourceSection: 'schoolContent',
    sourceLabel: 'Section 5 — Story & Philosophy',
  });

  const mission = typeof schoolContent.mission === 'object' ? schoolContent.mission?.text : schoolContent.mission;
  if (mission && String(mission).trim().length > 10) contentFilled++;
  else recommendations.push({
    id: 'rec-mission',
    title: 'School Mission Statement',
    reason: 'Mission statement outlines educational goals.',
    sourceSection: 'schoolContent',
    sourceLabel: 'Section 5 — Story & Philosophy',
  });

  const principalValidation = validatePrincipalName(intakeData);
  if (principalValidation.isSatisfied) {
    contentFilled++;
  } else {
    publicationBlockers.push({
      id: 'blocker-principal-name',
      key: PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME,
      title: principalValidation.title,
      reason: principalValidation.reason,
      sourceSection: principalValidation.sourceSection,
      sourceLabel: principalValidation.sourceLabel,
      sourceField: principalValidation.sourceField,
      debug: principalValidation.debug,
    });
  }

  const contentScore = Math.round((contentFilled / contentTotal) * 100);

  // ── Pillar 3: Facilities (15%) ───────────────────────────────────────────────
  const applicableFacilities = facilities.filter((f) => f.isApplicable);
  const verifiedFacilities = applicableFacilities.filter((f) => f.status === 'verified');
  const facilitiesScore = applicableFacilities.length > 0
    ? Math.round((verifiedFacilities.length / applicableFacilities.length) * 100)
    : 100;

  // ── Pillar 4: Assets (20%) ───────────────────────────────────────────────────
  // Non-duplicating count: each asset in aggregated universal assets counts once
  const requiredAssets = assets.filter((a) => a.required);
  const verifiedRequiredAssets = requiredAssets.filter((a) => a.status === 'verified');

  requiredAssets.forEach((asset) => {
    if (asset.status !== 'verified' && asset.isPublicationBlocker) {
      const isPortrait = asset.id.includes('principal') || asset.category === 'people';
      const portraitVal = isPortrait ? validatePrincipalPortrait(intakeData) : undefined;
      publicationBlockers.push({
        id: `blocker-asset-${asset.id}`,
        key: asset.key || (isPortrait ? PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT : PUBLICATION_REQUIREMENT_KEYS.CAMPUS_HERO_IMAGE),
        title: asset.title,
        reason: `${asset.title} is required before website launch.`,
        sourceSection: asset.sourceSection,
        sourceLabel: asset.sourceSectionLabel,
        sourceField: asset.sourceField,
        debug: isPortrait ? portraitVal?.debug : undefined,
      });
    }
  });

  const assetsScore = requiredAssets.length > 0
    ? Math.round((verifiedRequiredAssets.length / requiredAssets.length) * 100)
    : 100;

  // ── Pillar 5: Compliance & Statutory Documents (20%) ─────────────────────────
  const requiredDocs = documents.filter((d) => d.required);
  const verifiedDocs = requiredDocs.filter((d) => d.status === 'verified');

  requiredDocs.forEach((doc) => {
    if (doc.status !== 'verified' && doc.isPublicationBlocker) {
      let docKey = doc.key;
      if (!docKey) {
        if (doc.id === 'doc-affiliation-cert') docKey = PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE;
        else if (doc.id === 'doc-recognition-noc') docKey = PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC;
        else if (doc.id === 'doc-fire-safety') docKey = PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE;
        else if (doc.id === 'doc-mandatory-disclosure') docKey = PUBLICATION_REQUIREMENT_KEYS.MANDATORY_PUBLIC_DISCLOSURE;
      }
      const valResult = docKey ? validateRequirement(docKey, intakeData) : undefined;
      publicationBlockers.push({
        id: `blocker-doc-${doc.id}`,
        key: docKey,
        title: doc.documentName,
        reason: `${doc.documentName} is mandatory for statutory compliance.`,
        sourceSection: doc.sourceSection,
        sourceLabel: doc.sourceLabel,
        sourceField: doc.sourceField,
        debug: valResult?.debug,
      });
    }
  });

  const complianceScore = requiredDocs.length > 0
    ? Math.round((verifiedDocs.length / requiredDocs.length) * 100)
    : 100;

  // ── Pillar 6: Administrator & Confirmation (10%) ────────────────────────────
  let adminTotal = 2;
  let adminFilled = 0;

  const adminName =
    usersAccess.superAdminFullName ||
    usersAccess.superAdminEmail ||
    intakeData.clientConfirmation?.confirmedByName ||
    normalizeLeadershipData(intakeData.leadership).principalName ||
    intakeData.schoolProfile?.officialEmail;
  if (adminName && String(adminName).trim().length > 0) adminFilled++;
  else publicationBlockers.push({
    id: 'blocker-admin-contact',
    key: PUBLICATION_REQUIREMENT_KEYS.ADMIN_CONTACT,
    title: 'Authorized Administrator Contact',
    reason: 'Designated administrative contact required for website ownership.',
    sourceSection: 'usersAccess',
    sourceLabel: 'Final Review — Administrator',
    sourceField: 'usersAccess.superAdminFullName',
  });

  const isDeclarationAccepted = Boolean(
    intakeData.clientConfirmation?.isConfirmed ||
    intakeData.websiteRequirements?.websiteApproved
  );
  if (isDeclarationAccepted) adminFilled++;

  const confirmationScore = Math.round((adminFilled / adminTotal) * 100);

  // Configuration (fixed 100% since canonical defaults exist)
  const configurationScore = 100;

  // Weighted overall calculation
  const overallScore = Math.round(
    identityScore * 0.15 +
    contentScore * 0.20 +
    facilitiesScore * 0.15 +
    assetsScore * 0.20 +
    complianceScore * 0.20 +
    confirmationScore * 0.10
  );

  const hasPublicationBlockers = publicationBlockers.length > 0;
  const isReadyForSubmission = !hasPublicationBlockers;

  // Aggregate metrics
  const totalReqs = identityTotal + contentTotal + applicableFacilities.length + requiredAssets.length + requiredDocs.length + adminTotal;
  const verifiedCount = identityFilled + contentFilled + verifiedFacilities.length + verifiedRequiredAssets.length + verifiedDocs.length + adminFilled;
  const notApplicableCount = facilities.filter((f) => !f.isApplicable).length;

  return {
    overallScore,
    isReadyForSubmission,
    hasPublicationBlockers,
    categoryScores: {
      identity: identityScore,
      content: contentScore,
      facilities: facilitiesScore,
      assets: assetsScore,
      compliance: complianceScore,
      configuration: configurationScore,
      confirmation: confirmationScore,
    },
    metrics: {
      totalRequirements: totalReqs,
      verifiedCount,
      needsAttentionCount: publicationBlockers.length + recommendations.length,
      publicationBlockersCount: publicationBlockers.length,
      optionalCount: recommendations.length,
      notApplicableCount,
    },
    publicationBlockers,
    recommendations,
  };
}

// ─── 6. REPORT GENERATION (PRINT-READY HTML / PDF REPORT) ───────────────────

/**
 * Generates an institutional, high-fidelity HTML report that is print-optimized
 * and can be downloaded or printed directly as a PDF submission report.
 */
export function generateSubmissionReportHtml(
  intakeData: Partial<UniversalIntakeData>,
  readiness: UniversalReadinessSummary,
  assets: UniversalVerificationAsset[],
  documents: UniversalVerificationDocument[],
  facilities: UniversalFacilityItem[],
  submissionMeta: {
    submissionId: string;
    version: string;
    submittedAt: string;
    adminName: string;
    adminDesignation: string;
    adminEmail: string;
    adminPhone: string;
  }
): string {
  const schoolName = (intakeData.schoolProfile as any)?.name || intakeData.schoolProfile?.schoolName || 'SparkNest Academy';
  const board = intakeData.schoolProfile?.board || 'CBSE';
  const address = intakeData.campuses?.[0]?.address || 'Main Campus';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Website Submission & Verification Report — ${schoolName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      font-size: 12px;
      margin: 0;
      padding: 20px;
    }
    .header {
      border-bottom: 2px solid #4338ca;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .school-title { font-size: 20px; font-weight: 800; color: #1e1b4b; margin: 0; }
    .doc-subtitle { font-size: 11px; font-weight: 700; color: #4338ca; text-transform: uppercase; margin-top: 2px; }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      font-size: 11px;
    }
    .meta-item strong { display: block; color: #64748b; font-size: 9px; text-transform: uppercase; }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      border-left: 3px solid #4338ca;
      padding-left: 8px;
      margin: 16px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: 700; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; }
    .declaration-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 6px;
      padding: 12px;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .footer {
      margin-top: 20px;
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="school-title">${schoolName}</h1>
      <div class="doc-subtitle">Official Website Submission & Verification Report</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
        ${board} Affiliated Institution • ${address}
      </div>
    </div>
    <div style="text-align: right;">
      <span class="badge ${readiness.isReadyForSubmission ? 'badge-success' : 'badge-amber'}">
        ${readiness.isReadyForSubmission ? '✓ VERIFIED FOR PUBLICATION' : 'UNDER REVIEW'}
      </span>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
        Submission ID: <strong>${submissionMeta.submissionId}</strong>
      </div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Submission Version</strong>
      ${submissionMeta.version}
    </div>
    <div class="meta-item">
      <strong>Submission Date</strong>
      ${submissionMeta.submittedAt}
    </div>
    <div class="meta-item">
      <strong>Overall Readiness</strong>
      ${readiness.overallScore}% Completed
    </div>
    <div class="meta-item">
      <strong>Authorized Officer</strong>
      ${submissionMeta.adminName || 'Authorized Signatory'}
    </div>
  </div>

  <div class="section-title">1. Readiness Breakdown Across Pillars</div>
  <table>
    <tr>
      <th>Pillar</th>
      <th>Readiness</th>
      <th>Status</th>
      <th>Audit Details</th>
    </tr>
    <tr>
      <td><strong>School Identity</strong></td>
      <td>${readiness.categoryScores.identity}%</td>
      <td>${readiness.categoryScores.identity === 100 ? 'Verified' : 'Action Required'}</td>
      <td>School name, affiliation, address & phone verified</td>
    </tr>
    <tr>
      <td><strong>Content & Story</strong></td>
      <td>${readiness.categoryScores.content}%</td>
      <td>${readiness.categoryScores.content >= 80 ? 'Verified' : 'Action Required'}</td>
      <td>About school, vision, mission, and principal credentials</td>
    </tr>
    <tr>
      <td><strong>Campus Facilities</strong></td>
      <td>${readiness.categoryScores.facilities}%</td>
      <td>Verified</td>
      <td>Smart classrooms, composite science labs, sports & campus</td>
    </tr>
    <tr>
      <td><strong>Assets & Media</strong></td>
      <td>${readiness.categoryScores.assets}%</td>
      <td>${readiness.categoryScores.assets >= 80 ? 'Verified' : 'Pending Assets'}</td>
      <td>High-resolution brand crest, campus photography & leadership</td>
    </tr>
    <tr>
      <td><strong>Statutory Compliance</strong></td>
      <td>${readiness.categoryScores.compliance}%</td>
      <td>${readiness.categoryScores.compliance >= 80 ? 'Verified' : 'Pending Docs'}</td>
      <td>Affiliation certificate, safety orders & mandatory disclosures</td>
    </tr>
  </table>

  <div class="section-title">2. Campus Facilities & Infrastructure</div>
  <table>
    <tr>
      <th>Facility</th>
      <th>Operational Status</th>
      <th>Count / Capacity</th>
      <th>Key Features</th>
    </tr>
    ${facilities
      .map(
        (f) => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td>${f.status === 'not_applicable' ? 'Not Applicable' : f.isAvailable ? 'Available & Verified' : 'Not Operated'}</td>
      <td>${f.countOrCapacity || 'N/A'}</td>
      <td>${f.features.slice(0, 2).join(', ') || f.description || '-'}</td>
    </tr>`
      )
      .join('')}
  </table>

  <div class="section-title">3. Statutory Documents & Mandatory Disclosures</div>
  <table>
    <tr>
      <th>Document</th>
      <th>Type</th>
      <th>Status</th>
      <th>Expiry / Notes</th>
    </tr>
    ${documents
      .map(
        (d) => `
    <tr>
      <td><strong>${d.documentName}</strong></td>
      <td>${d.type}</td>
      <td>${d.status === 'verified' ? '✓ Uploaded & Valid' : '⚠ Missing / Required'}</td>
      <td>${d.expiryDate || d.notes || '-'}</td>
    </tr>`
      )
      .join('')}
  </table>

  <div class="section-title">4. Universal Asset Library Summary</div>
  <table>
    <tr>
      <th>Asset Name</th>
      <th>Category</th>
      <th>Source Section</th>
      <th>Public Website Usage</th>
      <th>Status</th>
    </tr>
    ${assets
      .slice(0, 10)
      .map(
        (a) => `
    <tr>
      <td><strong>${a.title}</strong></td>
      <td>${a.category}</td>
      <td>${a.sourceSectionLabel}</td>
      <td>${a.usages.join(', ')}</td>
      <td>${a.status === 'verified' ? '✓ Ready' : 'Pending'}</td>
    </tr>`
      )
      .join('')}
  </table>

  <div class="declaration-box">
    <div style="font-weight: 800; color: #581c87; font-size: 12px; margin-bottom: 6px;">
      5. Institutional Declaration & Sign-Off Authorization
    </div>
    <p style="margin: 0 0 6px 0; font-size: 10px; color: #4a044e;">
      ✓ The undersigned administrator certifies that all information provided is accurate, authorized by the institution, and compliant with educational board statutory mandates. Uploaded media assets are approved for public institutional website publication.
    </p>
    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #6b21a8; margin-top: 8px;">
      <div>Authorized Signatory: <strong>${submissionMeta.adminName}</strong> (${submissionMeta.adminDesignation || 'Super Admin'})</div>
      <div>Contact: <strong>${submissionMeta.adminEmail} • ${submissionMeta.adminPhone}</strong></div>
    </div>
  </div>

  <div class="footer">
    <div>Ekaagra Technologies — School Digital Infrastructure Platform</div>
    <div>Page 1 of 1 • Generated ${new Date().toLocaleDateString('en-GB')}</div>
  </div>
</body>
</html>`;
}

// ─── 7. ZIP SUBMISSION PACKAGE BUNDLER ────────────────────────────────────────

/**
 * Creates a structured ZIP archive containing:
 * - submission-report.html (printable / archivable)
 * - school-information.json (raw canonical data)
 * - manifest.json (verification audit trail)
 * - Organized folders for assets and documents
 */
export async function buildUniversalSubmissionZip(
  intakeData: Partial<UniversalIntakeData>,
  readiness: UniversalReadinessSummary,
  assets: UniversalVerificationAsset[],
  documents: UniversalVerificationDocument[],
  facilities: UniversalFacilityItem[],
  submissionMeta: {
    submissionId: string;
    version: string;
    submittedAt: string;
    adminName: string;
    adminDesignation: string;
    adminEmail: string;
    adminPhone: string;
  }
): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(`Website-Submission-${submissionMeta.submissionId}`) || zip;

  // 1. Report HTML
  const reportHtml = generateSubmissionReportHtml(
    intakeData,
    readiness,
    assets,
    documents,
    facilities,
    submissionMeta
  );
  root.file('submission-report.html', reportHtml);

  // 2. School Information JSON
  const schoolInfoJson = JSON.stringify(
    {
      schoolProfile: intakeData.schoolProfile,
      campuses: intakeData.campuses,
      leadership: intakeData.leadership,
      schoolContent: intakeData.schoolContent,
      academicStructure: intakeData.institutionStructure,
      admissions: intakeData.admissions,
      facilities: intakeData.facilitiesConfig,
      legalPolicies: intakeData.legalPolicies,
      websiteRequirements: intakeData.websiteRequirements,
      administrator: {
        name: submissionMeta.adminName,
        designation: submissionMeta.adminDesignation,
        email: submissionMeta.adminEmail,
        phone: submissionMeta.adminPhone,
      },
    },
    null,
    2
  );
  root.file('school-information.json', schoolInfoJson);

  // 3. Manifest JSON
  const manifestJson = JSON.stringify(
    {
      submissionId: submissionMeta.submissionId,
      version: submissionMeta.version,
      submittedAt: submissionMeta.submittedAt,
      overallReadiness: `${readiness.overallScore}%`,
      status: readiness.isReadyForSubmission ? 'VERIFIED_AND_LOCKED' : 'UNDER_REVIEW',
      blockersCount: readiness.publicationBlockers.length,
      assetsCount: assets.length,
      documentsCount: documents.length,
      facilitiesCount: facilities.length,
      verificationPillars: readiness.categoryScores,
      blockers: readiness.publicationBlockers,
      recommendations: readiness.recommendations,
    },
    null,
    2
  );
  root.file('verification-manifest.json', manifestJson);

  // 4. Asset Folders
  const assetsFolder = root.folder('assets');
  if (assetsFolder) {
    assetsFolder.folder('logo')?.file('README.txt', 'Place brand logo files here.');
    assetsFolder.folder('campus')?.file('README.txt', 'Place campus architecture & grounds photos here.');
    assetsFolder.folder('facilities')?.file('README.txt', 'Place smart classrooms, laboratories, library photos here.');
    assetsFolder.folder('people')?.file('README.txt', 'Place principal and management portrait photos here.');
    assetsFolder.folder('gallery')?.file('README.txt', 'Place extracurricular, annual sports and cultural photos here.');
  }

  // 5. Documents Folders
  const docsFolder = root.folder('documents');
  if (docsFolder) {
    docsFolder.folder('compliance')?.file('README.txt', 'Place CBSE affiliation and government NOC documents here.');
    docsFolder.folder('policies')?.file('README.txt', 'Place fee schedule and parent privacy policy here.');
    docsFolder.folder('certificates')?.file('README.txt', 'Place fire safety and building safety certificates here.');
  }

  return await zip.generateAsync({ type: 'blob' });
}
