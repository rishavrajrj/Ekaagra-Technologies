/**
 * Canonical Document Architecture & Statutory Requirements Registry
 *
 * Provides ONE single source of truth for:
 * - Assets & Documents (Group F: Certificates & Institutional Documents)
 * - Final Website Review & Submission (Universal Verification)
 * - Statutory compliance calculation & percentage
 * - Blocker calculation & publication readiness
 * - Download Report (HTML/PDF) & Download ZIP
 * - Submission validation
 */

import type {
  UniversalIntakeData,
} from './types';

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

// ─── 1. CANONICAL DOCUMENT IDS ───────────────────────────────────────────────

export const CANONICAL_DOCUMENT_IDS = {
  BOARD_AFFILIATION: 'BOARD_AFFILIATION',
  AFFILIATION_CERTIFICATE: 'BOARD_AFFILIATION',
  SCHOOL_RECOGNITION_NOC: 'SCHOOL_RECOGNITION_NOC',
  RECOGNITION_NOC: 'SCHOOL_RECOGNITION_NOC',
  SOCIETY_TRUST_REGISTRATION: 'SOCIETY_TRUST_REGISTRATION',
  SOCIETY_REGISTRATION: 'SOCIETY_TRUST_REGISTRATION',
  BUILDING_FIRE_SAFETY: 'BUILDING_FIRE_SAFETY',
  BUILDING_SAFETY: 'BUILDING_SAFETY',
  FIRE_SAFETY: 'FIRE_SAFETY',
  MANDATORY_PUBLIC_DISCLOSURE: 'MANDATORY_PUBLIC_DISCLOSURE',
  MANDATORY_DISCLOSURE: 'MANDATORY_PUBLIC_DISCLOSURE',
  FEE_SCHEDULE: 'FEE_SCHEDULE',
} as const;

export type CanonicalDocumentId =
  typeof CANONICAL_DOCUMENT_IDS[keyof typeof CANONICAL_DOCUMENT_IDS];

// ─── 2. EXPLICIT DOCUMENT STATUS MODEL ───────────────────────────────────────

export type CanonicalDocumentStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'VALID'
  | 'INVALID'
  | 'EXPIRED'
  | 'NOT_APPLICABLE'
  | 'REVIEW_REQUIRED';

// ─── 3. REQUIREMENT DEFINITION SCHEMA ───────────────────────────────────────

export interface CanonicalDocumentRequirement {
  id: CanonicalDocumentId;
  checklistId: string;
  title: string;
  category: 'STATUTORY' | 'CONDITIONAL' | 'RECOMMENDED';
  required: boolean;
  isPublicationBlocker: boolean;
  allowNotApplicable: boolean;
  accepts: string[];
  description: string;
  defaultExpiryDate?: string;
  notes: string;
  remediationAnchor: string;
}

/**
 * Authoritative statutory requirement definitions.
 * Group F in Assets & Documents and Final Review both consume this exact array.
 */
export const CANONICAL_STATUTORY_REQUIREMENTS: CanonicalDocumentRequirement[] = [
  {
    id: CANONICAL_DOCUMENT_IDS.BOARD_AFFILIATION,
    checklistId: 'cert-affiliation',
    title: 'Board Affiliation Certificate / Extension Letter',
    category: 'STATUTORY',
    required: true,
    isPublicationBlocker: true,
    allowNotApplicable: false,
    accepts: ['BOARD_AFFILIATION', 'cert-affiliation', 'affiliation'],
    description: 'Official grant letter or affiliation certificate from CBSE, CISCE, or State Board.',
    defaultExpiryDate: '2028-03-31',
    notes: 'Mandatory statutory proof displayed on the Board Affiliation disclosure page.',
    remediationAnchor: 'asset-row-cert-affiliation',
  },
  {
    id: CANONICAL_DOCUMENT_IDS.SCHOOL_RECOGNITION_NOC,
    checklistId: 'cert-recognition',
    title: 'School Recognition Certificate / Government NOC',
    category: 'STATUTORY',
    required: true,
    isPublicationBlocker: true,
    allowNotApplicable: false,
    accepts: ['SCHOOL_RECOGNITION_NOC', 'cert-recognition', 'cert-noc', 'recognition', 'noc'],
    description: 'State Education Department No Objection Certificate (NOC) or formal recognition order.',
    defaultExpiryDate: 'Permanent',
    notes: 'Official permission certificate issued by State Education Department.',
    remediationAnchor: 'asset-row-cert-recognition',
  },
  {
    id: CANONICAL_DOCUMENT_IDS.SOCIETY_TRUST_REGISTRATION,
    checklistId: 'cert-registration',
    title: 'Society / Trust Registration Certificate',
    category: 'CONDITIONAL',
    required: false, // Conditional: non-blocker, can be marked N/A
    isPublicationBlocker: false,
    allowNotApplicable: true,
    accepts: ['SOCIETY_TRUST_REGISTRATION', 'cert-registration', 'cert-society', 'trust', 'society'],
    description: 'Registration certificate of the educational society or non-profit trust running the school.',
    defaultExpiryDate: 'Permanent',
    notes: 'Archived under legal governance verification and compliance records.',
    remediationAnchor: 'asset-row-cert-registration',
  },
  {
    id: CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY,
    checklistId: 'cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    category: 'STATUTORY',
    required: true,
    isPublicationBlocker: true,
    allowNotApplicable: false,
    // Explicitly accepts combined building & fire safety certificate OR separate certificates
    accepts: [
      'BUILDING_FIRE_SAFETY',
      'BUILDING_SAFETY',
      'FIRE_SAFETY',
      'cert-safety',
      'cert-building-safety',
      'cert-fire-safety',
      'building',
      'fire',
    ],
    description: 'Valid building stability certificate and Fire Safety NOC from municipal authorities.',
    defaultExpiryDate: '2027-06-30',
    notes: 'Mandatory building stability and municipal fire safety inspection certificate.',
    remediationAnchor: 'asset-row-cert-safety',
  },
  {
    id: CANONICAL_DOCUMENT_IDS.MANDATORY_PUBLIC_DISCLOSURE,
    checklistId: 'cert-mandatory-disclosure',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    category: 'STATUTORY',
    required: true,
    isPublicationBlocker: true,
    allowNotApplicable: false,
    accepts: ['MANDATORY_PUBLIC_DISCLOSURE', 'cert-mandatory-disclosure', 'mandatory', 'appendix-ix'],
    description: 'Official board mandatory disclosure sheet containing school details, land certs, and safety orders.',
    defaultExpiryDate: 'Annual Update',
    notes: 'Prominently linked on the school website homepage footer as legally required by CBSE/ICSE.',
    remediationAnchor: 'asset-row-cert-mandatory-disclosure',
  },
];

// ─── 4. RESOLVED CANONICAL DOCUMENT INSTANCE ────────────────────────────────

export interface ResolvedCanonicalDocument {
  id: string; // e.g. 'doc-affiliation-cert', 'doc-safety-cert'
  requirementId: CanonicalDocumentId;
  checklistId: string;
  title: string;
  documentName: string;
  category: 'STATUTORY' | 'CONDITIONAL' | 'RECOMMENDED';
  status: CanonicalDocumentStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
  isVerified: boolean;
  required: boolean;
  isPublicationBlocker: boolean;
  allowNotApplicable: boolean;
  isNotApplicable: boolean;
  expiryDate?: string;
  expiryStatus: 'valid' | 'expiring_soon' | 'expired';
  notes: string;
  remediationAnchor: string;
}

// ─── 5. ROBUST DOCUMENT MATCHING & RESOLUTION ENGINE ────────────────────────

/**
 * Resolves uploaded documents from intake data against canonical statutory requirements.
 * Matches using:
 * 1. Exact checklistId / canonical requirement id
 * 2. Uploaded document metadata / accepted ID mapping
 * 3. Backward-compatible title/filename match (fallback ONLY)
 */
export function resolveCanonicalDocuments(
  intakeData: Partial<UniversalIntakeData>
): ResolvedCanonicalDocument[] {
  const checklistItems = intakeData.assetChecklist?.items || [];

  return CANONICAL_STATUTORY_REQUIREMENTS.map((req) => {
    // 1. Primary match: by exact checklistId
    let matchedItem = checklistItems.find((i) => i.id === req.checklistId);

    // 2. Secondary match: by accepts list
    if (!matchedItem) {
      matchedItem = checklistItems.find((i) =>
        req.accepts.some((acceptedId) => i.id === acceptedId)
      );
    }

    // Special matching for BUILDING_FIRE_SAFETY:
    // If combined cert-safety is not found, check if separate cert-fire-safety or cert-building-safety is uploaded
    if (req.id === CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY && (!matchedItem || !matchedItem.fileUrl)) {
      const separateFire = checklistItems.find(
        (i) => i.id === 'cert-fire-safety' || i.id === 'FIRE_SAFETY'
      );
      const separateBuilding = checklistItems.find(
        (i) => i.id === 'cert-building-safety' || i.id === 'BUILDING_SAFETY'
      );
      if (separateFire?.fileUrl && isValidUploadedDocument(separateFire.fileUrl, separateFire.fileName)) {
        matchedItem = separateFire;
      } else if (separateBuilding?.fileUrl && isValidUploadedDocument(separateBuilding.fileUrl, separateBuilding.fileName)) {
        matchedItem = separateBuilding;
      }
    }

    // 3. Fallback match (backward compatibility only): title substring
    if (!matchedItem) {
      matchedItem = checklistItems.find((i) => {
        const titleLower = (i.title || '').toLowerCase();
        return req.accepts.some((acc) => titleLower.includes(acc.toLowerCase()));
      });
    }

    const isNotApplicable = Boolean(
      req.allowNotApplicable && matchedItem?.status === 'not_applicable'
    );

    const hasValidFile = Boolean(
      matchedItem &&
      isValidUploadedDocument(matchedItem.fileUrl, matchedItem.fileName)
    );

    // Explicit status derivation
    let status: CanonicalDocumentStatus = 'MISSING';
    if (isNotApplicable) {
      status = 'NOT_APPLICABLE';
    } else if (hasValidFile) {
      status = 'VALID';
    } else if (matchedItem?.fileUrl) {
      status = 'INVALID';
    } else {
      status = 'MISSING';
    }

    const isVerified = status === 'VALID';

    // Required determination: If marked Not Applicable, it is excluded from required
    const isRequired = req.required && !isNotApplicable;

    // Blocker determination: only if strictly required and not satisfied
    const isBlocker = isRequired && !isVerified;

    return {
      id: `doc-${req.checklistId}`,
      requirementId: req.id,
      checklistId: req.checklistId,
      title: req.title,
      documentName: req.title,
      category: req.category,
      status,
      fileUrl: matchedItem?.fileUrl,
      fileName: matchedItem?.fileName,
      fileSize: matchedItem?.fileSize,
      uploadedAt: (matchedItem as any)?.uploadedAt,
      isVerified,
      required: isRequired,
      isPublicationBlocker: isBlocker,
      allowNotApplicable: req.allowNotApplicable,
      isNotApplicable,
      expiryDate: req.defaultExpiryDate,
      expiryStatus: 'valid',
      notes: req.notes,
      remediationAnchor: req.remediationAnchor,
    };
  });
}
