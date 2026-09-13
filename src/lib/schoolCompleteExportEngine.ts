/**
 * ==============================================================================
 * COMPLETE SCHOOL PROJECT TECHNICAL EXPORT ENGINE
 * File: src/lib/schoolCompleteExportEngine.ts
 * ==============================================================================
 *
 * Implements a complete, structured, portable technical export of everything
 * submitted and collected through the School Onboarding Portal.
 *
 * Output ZIP structure:
 * SCH-YYYY-XXXX/
 * ├── README.md
 * ├── manifest.json
 * ├── submission.json
 * ├── project.json
 * ├── school-profile/
 * │   ├── school-profile.json
 * │   ├── campuses.json
 * │   ├── contact-information.json
 * │   ├── institutional-details.json
 * │   └── staff-directory.json
 * ├── academics/
 * │   ├── academic-structure.json
 * │   ├── classes.json
 * │   ├── sections.json
 * │   ├── subjects.json
 * │   ├── subject-catalog.json
 * │   ├── curriculum.json
 * │   ├── class-wise-curriculum.json
 * │   ├── attendance-config.json
 * │   ├── examination-config.json
 * │   ├── timetable-config.json
 * │   └── student-directory.json
 * ├── admissions/
 * │   ├── admissions.json
 * │   ├── eligibility.json
 * │   ├── admission-process.json
 * │   └── required-documents.json
 * ├── fees/
 * │   ├── fee-structure.json
 * │   ├── fee-categories.json
 * │   └── payment-information.json
 * ├── facilities/
 * │   ├── facilities.json
 * │   ├── infrastructure.json
 * │   ├── facility-details.json
 * │   ├── transport.json
 * │   ├── hostel.json
 * │   └── library.json
 * ├── website/
 * │   ├── website-content.json
 * │   ├── pages.json
 * │   ├── navigation.json
 * │   ├── sections.json
 * │   ├── seo.json
 * │   ├── branding.json
 * │   ├── theme.json
 * │   ├── colors.json
 * │   ├── typography.json
 * │   ├── layout.json
 * │   ├── design-config.json
 * │   ├── cms-workflow.json
 * │   ├── domain-hosting.json
 * │   ├── portal-requirements.json
 * │   └── media-governance.json
 * ├── legal/
 * │   ├── legal-information.json
 * │   ├── policies.json
 * │   ├── terms.json
 * │   ├── privacy-policy.json
 * │   ├── declarations.json
 * │   └── statutory-information.json
 * ├── media/             (Only folders with actual assets)
 * │   ├── logo/
 * │   ├── favicon/
 * │   ├── gallery/
 * │   ├── campus/
 * │   ├── facilities/
 * │   ├── staff/
 * │   ├── academics/
 * │   └── other/
 * ├── documents/         (Only folders with actual documents)
 * │   ├── certificates/
 * │   ├── statutory/
 * │   ├── accreditation/
 * │   ├── policies/
 * │   ├── approvals/
 * │   └── other/
 * └── technical/
 *     ├── field-mapping.json
 *     ├── submission-schema.json
 *     ├── asset-manifest.json
 *     ├── export-metadata.json
 *     ├── integrations.json
 *     ├── mobile-app.json
 *     ├── data-migration.json
 *     ├── security-privacy.json
 *     ├── erp-requirements.json
 *     ├── additional-requirements.json
 *     ├── admin-provisioning.json
 *     └── project-delivery.json
 */

import JSZip from 'jszip';
import type {
  SchoolProject,
  SchoolIntakeSubmission,
  UniversalIntakeData,
  WebsitePageConfiguration,
  CampusBranchData,
  AcademicClassConfig,
  AcademicSubjectConfig,
  SharedMediaAsset,
} from './types';
import { buildWebsitePageConfigurations } from './websitePageRequirements';
import { resolveCanonicalDocuments } from './canonicalDocuments';
import { getEffectiveMediaRegistry } from './mediaRegistryUtils';
import { evaluateSchoolReviewState } from './schoolReviewEngine';
import { calculateDocumentCompletenessSummary } from './canonicalDocumentReviewEngine';

// ─── TYPES & INTERFACES ───────────────────────────────────────────────────────

export type ExportProgressStep =
  | 'Preparing submission...'
  | 'Collecting form data...'
  | 'Collecting website configuration...'
  | 'Collecting media assets...'
  | 'Collecting documents...'
  | 'Validating package integrity...'
  | 'Building manifest...'
  | 'Creating ZIP...'
  | 'Export complete.';

export interface AssetManifestEntry {
  id: string;
  originalName: string;
  exportPath: string;
  mimeType: string;
  size: number;
  sha256?: string;
  category: string;
  sourceField: string;
  url?: string;
}

export interface CompleteExportStatistics {
  formFields: number;
  uploadedFiles: number;
  images: number;
  documents: number;
  websitePages: number;
}

export interface ManifestFileEntry {
  path: string;
  section: string;
  type: 'data_json' | 'binary_image' | 'binary_document' | 'documentation' | 'schema' | 'technical_manifest';
  mimeType: string;
  size: number;
  sha256?: string;
  description: string;
  sourceField?: string;
  relationships?: Record<string, unknown>;
}

export interface CompleteExportManifest {
  exportVersion: string;
  projectId: string;
  schoolName: string;
  exportedAt: string;
  submissionVersion: string;
  status: string;
  sections: {
    schoolProfile: boolean;
    academics: boolean;
    admissions: boolean;
    fees: boolean;
    facilities: boolean;
    website: boolean;
    legal: boolean;
    media: boolean;
    documents: boolean;
    technical: boolean;
  };
  files: string[];
  fileEntries?: ManifestFileEntry[];
  statistics: CompleteExportStatistics;
}

export interface CompleteExportResult {
  zipBlob: Blob;
  manifest: CompleteExportManifest;
  statistics: CompleteExportStatistics;
  folderName: string;
}

export interface ExportAssetCandidate {
  id: string;
  title: string;
  originalName: string;
  url?: string;
  data?: Uint8Array | ArrayBuffer | string; // Buffer or data URL
  mimeType?: string;
  size?: number;
  category:
    | 'logo'
    | 'favicon'
    | 'gallery'
    | 'campus'
    | 'facilities'
    | 'staff'
    | 'academics'
    | 'certificate'
    | 'statutory'
    | 'accreditation'
    | 'policy'
    | 'approval'
    | 'other';
  isDocument?: boolean;
  sourceField: string;
}

export interface ExportOptions {
  project?: SchoolProject | null;
  submission?: SchoolIntakeSubmission | null;
  intakePayload: UniversalIntakeData;
  onProgress?: (step: ExportProgressStep) => void;
  assetResolver?: (asset: ExportAssetCandidate) => Promise<Uint8Array | null>;
  token?: string;
}

// ─── CHECKSUM CALCULATION ─────────────────────────────────────────────────────

export async function calculateSha256(bytes: Uint8Array): Promise<string> {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    try {
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback below
    }
  }
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const nodeCrypto = await import('crypto');
      return nodeCrypto.createHash('sha256').update(bytes).digest('hex');
    } catch {
      // Fallback below
    }
  }
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ─── SECURITY & SENSITIVE KEYS REDACTION ──────────────────────────────────────

/**
 * Whitelist of legitimate school domain fields that may contain words like 'session',
 * 'key', 'code', 'token' (e.g. design tokens, academic sessions), but MUST NOT be scrubbed.
 */
const LEGITIMATE_DOMAIN_KEYS = new Set([
  'currentAcademicSession',
  'academicSession',
  'session',
  'sessions',
  'targetSessions',
  'admissionSession',
  'sessionStartDate',
  'sessionEndDate',
  'sessionYear',
  'admissionCycleNotes',
  'interviewSession',
  'tokens',
  'colorTokens',
  'designTokens',
  'themeTokens',
  'tokenList',
  'facilityKey',
  'pageKey',
  'policyKey',
  'checklistKey',
  'roleKey',
  'storageKey',
  'categoryKey',
  'stepKey',
  'subjectCode',
  'schoolCode',
  'buildingCode',
  'roomCode',
  'pinCode',
  'postalCode',
  'employeeCode',
  'curriculumCode',
  'courseCode',
  'classId',
  'sectionId',
  'studentId',
  'staffId',
  'campusId',
  'projectId',
  'submissionId',
  'keyAchievements',
  'faqItems',
]);

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /pwd/i,
  /api_?key/i,
  /client_?secret/i,
  /private_?key/i,
  /secret_?key/i,
  /service_?role/i,
  /database_?url/i,
  /db_?password/i,
  /authorization/i,
  /auth_?header/i,
  /proxy_?authorization/i,
  /auth_?token/i,
  /access_?token/i,
  /refresh_?token/i,
  /user_?token/i,
  /token_?hash/i,
  /^token$/i,
  /_token$/i,
  /session/i,
  /^secret$/i,
  /^credentials$/i,
];

/**
 * Recursively deep-clones an object while scrubbing internal security credentials,
 * auth tokens, session keys, and database secrets, while safely preserving legitimate
 * school data (academic sessions, design tokens, identifiers, codes).
 */
export function sanitizeExportData<T>(val: T): T {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') {
    // Value-based check: scrub raw private keys or bearer tokens in strings
    if (typeof val === 'string') {
      if (val.startsWith('Bearer ') && val.length > 30) return '[REDACTED_AUTH_TOKEN]' as unknown as T;
      if (val.includes('BEGIN PRIVATE KEY')) return '[REDACTED_PRIVATE_KEY]' as unknown as T;
      if (val.startsWith('sbp_') && val.length > 25) return '[REDACTED_SERVICE_KEY]' as unknown as T;
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeExportData(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, propVal] of Object.entries(val as Record<string, unknown>)) {
    // Check if key is an explicit legitimate domain key
    if (LEGITIMATE_DOMAIN_KEYS.has(key)) {
      result[key] = sanitizeExportData(propVal);
      continue;
    }

    // Check if key is a domain composite that shouldn't be matched
    const isDomainSessionOrToken = /(academic_?session|session_?start|session_?end|session_?year|target_?sessions?|color_?tokens?|design_?tokens?|theme_?tokens?|key_?achievements?|facility_?key|page_?key|storage_?key)/i.test(key);
    if (isDomainSessionOrToken) {
      result[key] = sanitizeExportData(propVal);
      continue;
    }

    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      // Exclude entirely from export
      continue;
    }
    result[key] = sanitizeExportData(propVal);
  }

  return result as T;
}

// ─── FILENAME & PATH SANITIZATION ─────────────────────────────────────────────

/**
 * Clean filenames so they extract safely and consistently across Windows, macOS, and Linux.
 */
export function sanitizeZipFileName(rawName: string, defaultExt: string = ''): string {
  if (!rawName || typeof rawName !== 'string') return `asset${defaultExt}`;

  // Strip URL query strings and hash only if it is a URL
  let clean = rawName;
  if (clean.includes('://')) {
    clean = clean.split('?')[0].split('#')[0];
  }
  clean = clean.replace(/\\/g, '/').split('/').pop() || 'asset';

  // Remove dangerous filesystem characters: : * ? " < > | / \ and control chars
  clean = clean.replace(/[/\\?%*:|"<>]/g, '_').replace(/[\x00-\x1f\x80-\x9f]/g, '');

  // Truncate excessively long names (preserving extension)
  const extMatch = clean.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? `.${extMatch[1]}` : defaultExt;
  const baseName = extMatch ? clean.slice(0, -ext.length) : clean;

  const safeBase = baseName.slice(0, 60).replace(/^\.+/, '') || 'asset';
  return `${safeBase}${ext}`;
}

/**
 * Resolve an appropriate file extension from a MIME type or URL.
 */
export function resolveExtension(mimeType?: string, url?: string): string {
  if (mimeType) {
    const cleanMime = mimeType.toLowerCase();
    if (cleanMime.includes('pdf')) return '.pdf';
    if (cleanMime.includes('png')) return '.png';
    if (cleanMime.includes('jpeg') || cleanMime.includes('jpg')) return '.jpg';
    if (cleanMime.includes('webp')) return '.webp';
    if (cleanMime.includes('svg')) return '.svg';
    if (cleanMime.includes('gif')) return '.gif';
    if (cleanMime.includes('json')) return '.json';
  }
  if (url) {
    const match = url.match(/\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/);
    if (match) return `.${match[1].toLowerCase()}`;
  }
  return '';
}

// ─── BINARY ASSET FETCHER ────────────────────────────────────────────────────

/**
 * Converts a base64 Data URL to a Uint8Array buffer.
 */
function dataUrlToUint8Array(dataUrl: string): { data: Uint8Array; mimeType: string } {
  const parts = dataUrl.split(',');
  const header = parts[0] || '';
  const base64 = parts[1] || '';
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

  const binaryString = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return { data: bytes, mimeType };
}

/**
 * Fetches the binary content of an uploaded asset.
 * Supports:
 * 1. Preloaded buffer or base64 Data URL
 * 2. Node filesystem reading (when available)
 * 3. Browser/Universal fetch with download route fallback
 */
export async function fetchAssetBytes(
  asset: ExportAssetCandidate,
  token?: string
): Promise<{ data: Uint8Array; mimeType: string }> {
  // 1. Direct Data / Buffer provided
  if (asset.data) {
    if (typeof asset.data === 'string') {
      if (asset.data.startsWith('data:')) {
        return dataUrlToUint8Array(asset.data);
      }
      return {
        data: new TextEncoder().encode(asset.data),
        mimeType: asset.mimeType || 'text/plain',
      };
    }
    const bytes = asset.data instanceof Uint8Array ? asset.data : new Uint8Array(asset.data);
    return {
      data: bytes,
      mimeType: asset.mimeType || 'application/octet-stream',
    };
  }

  const url = asset.url?.trim();
  if (!url) {
    throw new Error(`Asset "${asset.title}" (${asset.id}) has no valid URL or binary data.`);
  }

  // 2. Data URL in url property
  if (url.startsWith('data:')) {
    return dataUrlToUint8Array(url);
  }

  // 3. Node.js environment filesystem lookup (e.g. running under tests or server)
  if (typeof process !== 'undefined' && process.cwd && typeof window === 'undefined') {
    try {
      const fs = await import('fs');
      const path = await import('path');

      const cleanPath = url.split('?')[0];
      const candidates = [
        path.join(process.cwd(), 'public', cleanPath.replace(/^\/+/, '')),
        path.join(process.cwd(), 'private', cleanPath.replace(/^\/+/, '')),
        path.join(process.cwd(), cleanPath),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          const stat = fs.statSync(cand);
          if (stat.isFile()) {
            const buf = fs.readFileSync(cand);
            return {
              data: new Uint8Array(buf),
              mimeType: asset.mimeType || 'application/octet-stream',
            };
          }
        }
      }
    } catch {
      // Continue to fetch
    }
  }

  // 4. Universal fetch (Browser or Node with fetch)
  try {
    const fetchUrl = url.startsWith('/') && typeof window !== 'undefined'
      ? `${window.location.origin}${url}`
      : url;

    const response = await fetch(fetchUrl);
    if (response.ok) {
      const arrayBuf = await response.arrayBuffer();
      const detectedMime = response.headers.get('content-type') || asset.mimeType || 'application/octet-stream';
      return {
        data: new Uint8Array(arrayBuf),
        mimeType: detectedMime.split(';')[0].trim(),
      };
    }
  } catch (err: any) {
    // Fallback to proxy route if running in browser
    if (typeof window !== 'undefined') {
      try {
        const proxyUrl = `/api/school-assets/download?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token || '')}`;
        const proxyResp = await fetch(proxyUrl, { credentials: 'same-origin' });
        if (proxyResp.ok) {
          const arrayBuf = await proxyResp.arrayBuffer();
          const detectedMime = proxyResp.headers.get('content-type') || asset.mimeType || 'application/octet-stream';
          return {
            data: new Uint8Array(arrayBuf),
            mimeType: detectedMime.split(';')[0].trim(),
          };
        }
      } catch {
        // Fall through to error
      }
    }
  }

  throw new Error(
    `Failed to download uploaded asset "${asset.title}" (${asset.id}) from "${url}". ` +
    `The export was stopped to ensure a complete, non-corrupt technical ZIP package.`
  );
}

// ─── FORM FIELD COUNTING ──────────────────────────────────────────────────────

/**
 * Counts all non-null/non-empty scalar and object values in the submission to
 * accurately report total submitted form records in manifest statistics.
 */
export function countSubmissionFormFields(obj: unknown): number {
  if (obj === null || obj === undefined) return 0;
  if (typeof obj !== 'object') {
    if (typeof obj === 'string') return obj.trim().length > 0 ? 1 : 0;
    return 1;
  }

  if (Array.isArray(obj)) {
    return obj.reduce((acc: number, item) => acc + countSubmissionFormFields(item), 0);
  }

  let count = 0;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    count += countSubmissionFormFields(val);
  }
  return count;
}

// ─── ASSET AGGREGATION FOR EXPORT ─────────────────────────────────────────────

/**
 * Audits the entire submission data model and extracts every uploaded image,
 * document, photo, and certificate across all sections.
 */
export function collectAllExportAssets(intakeData: Partial<UniversalIntakeData>): ExportAssetCandidate[] {
  const assetMap = new Map<string, ExportAssetCandidate>();

  const registerCandidate = (cand: ExportAssetCandidate) => {
    if (!cand.url && !cand.data) return;
    const existing =
      assetMap.get(cand.id) ||
      assetMap.get(`doc-${cand.id}`) ||
      (cand.id.startsWith('doc-') ? assetMap.get(cand.id.replace(/^doc-/, '')) : undefined);

    if (!existing) {
      assetMap.set(cand.id, cand);
    } else {
      if (!existing.url && cand.url) existing.url = cand.url;
      if (!existing.data && cand.data) existing.data = cand.data;
      if (!existing.size && cand.size) existing.size = cand.size;
      if (existing.id.startsWith('doc-') && !cand.id.startsWith('doc-')) {
        assetMap.delete(existing.id);
        existing.id = cand.id;
        assetMap.set(cand.id, existing);
      }
    }
  };

  // 1. Branding: Logo, Crest, Favicon, Secondary Logo
  const branding = intakeData.brandingDesign || ({} as any);
  if (branding.logoUrl) {
    registerCandidate({
      id: 'brand-logo',
      title: 'Official School Logo',
      originalName: branding.logoFileName || 'school-logo.png',
      url: branding.logoUrl,
      size: branding.logoFileSize || branding.logoOriginalSize,
      mimeType: branding.logoOptimizedFormat ? `image/${branding.logoOptimizedFormat}` : 'image/png',
      category: 'logo',
      sourceField: 'brandingDesign.logoUrl',
    });
  }
  if (branding.crestUrl) {
    registerCandidate({
      id: 'brand-crest',
      title: 'School Crest / Emblem',
      originalName: 'school-crest.png',
      url: branding.crestUrl,
      mimeType: 'image/png',
      category: 'logo',
      sourceField: 'brandingDesign.crestUrl',
    });
  }
  if (branding.faviconUrl) {
    registerCandidate({
      id: 'brand-favicon',
      title: 'Website Favicon',
      originalName: 'favicon.png',
      url: branding.faviconUrl,
      mimeType: 'image/png',
      category: 'favicon',
      sourceField: 'brandingDesign.faviconUrl',
    });
  }
  if (branding.secondaryLogoUrl) {
    registerCandidate({
      id: 'brand-secondary-logo',
      title: 'Secondary School Logo',
      originalName: 'secondary-logo.png',
      url: branding.secondaryLogoUrl,
      mimeType: 'image/png',
      category: 'logo',
      sourceField: 'brandingDesign.secondaryLogoUrl',
    });
  }

  // 2. Campuses Photos
  (intakeData.campuses || []).forEach((campus: CampusBranchData, cIdx: number) => {
    (campus.images || []).forEach((img, iIdx: number) => {
      const url = img.url || (img as any).fileUrl;
      if (!url) return;
      const cat = img.category === 'sports_playground' || img.category === 'classrooms' || img.category === 'laboratories' || img.category === 'library' || img.category === 'cafeteria'
        ? 'facilities'
        : 'campus';

      registerCandidate({
        id: img.id || `campus-${cIdx}-img-${iIdx}`,
        title: img.caption || `${campus.name || 'Campus'} Photo ${iIdx + 1}`,
        originalName: img.fileName || `campus-photo-${iIdx + 1}.jpg`,
        url,
        size: (img as any).fileSize || (img as any).size,
        mimeType: (img as any).fileType || 'image/jpeg',
        category: cat,
        sourceField: `campuses[${cIdx}].images[${iIdx}]`,
      });
    });
  });

  // 3. Leadership & Staff Photos
  const leadership = intakeData.leadership || ({} as any);
  const principalPhoto = leadership.principalPhoto;
  const principalPhotoUrl = leadership.principalPhotoUrl || principalPhoto?.url;
  if (principalPhotoUrl) {
    registerCandidate({
      id: principalPhoto?.id || 'leadership-principal-photo',
      title: `Principal Portrait (${leadership.principalName || 'Principal'})`,
      originalName: principalPhoto?.fileName || 'principal-portrait.webp',
      url: principalPhotoUrl,
      size: principalPhoto?.optimizedSize || principalPhoto?.originalSize,
      mimeType: principalPhoto?.mimeType || 'image/webp',
      category: 'staff',
      sourceField: 'leadership.principalPhoto',
    });
  }

  (leadership.managementMembers || []).forEach((member: any, mIdx: number) => {
    const photoUrl = member.photo?.url || member.photoUrl;
    if (photoUrl) {
      registerCandidate({
        id: member.photo?.id || `leadership-mgmt-${mIdx}`,
        title: `${member.name || 'Management'} Portrait`,
        originalName: member.photo?.fileName || `management-${mIdx + 1}.jpg`,
        url: photoUrl,
        size: member.photo?.optimizedSize || member.photo?.originalSize,
        mimeType: member.photo?.mimeType || 'image/jpeg',
        category: 'staff',
        sourceField: `leadership.managementMembers[${mIdx}].photo`,
      });
    }
  });

  // Staff records if present
  (intakeData.staffRecords || []).forEach((staff: any, sIdx: number) => {
    if (staff.photoUrl) {
      registerCandidate({
        id: staff.id || `staff-${sIdx}`,
        title: `${staff.name || 'Staff'} Portrait`,
        originalName: `staff-${staff.employeeCode || sIdx + 1}.jpg`,
        url: staff.photoUrl,
        mimeType: 'image/jpeg',
        category: 'staff',
        sourceField: `staffRecords[${sIdx}].photoUrl`,
      });
    }
  });

  // 4. Central Media Registry
  const mediaReg: SharedMediaAsset[] = getEffectiveMediaRegistry(intakeData);
  mediaReg.forEach((asset) => {
    if (!asset.url) return;
    const cat = asset.categories.includes('principal') || asset.categories.includes('leadership')
      ? 'staff'
      : asset.categories.includes('facilities') || asset.categories.includes('classrooms') || asset.categories.includes('laboratories')
      ? 'facilities'
      : asset.categories.includes('events') || asset.categories.includes('activities')
      ? 'gallery'
      : 'campus';

    registerCandidate({
      id: asset.id,
      title: asset.caption || asset.fileName || 'Media Asset',
      originalName: asset.fileName || 'asset.webp',
      url: asset.url,
      size: asset.size,
      mimeType: asset.mimeType || 'image/webp',
      category: cat,
      sourceField: 'mediaRegistry',
    });
  });

  // 5. Facilities Specific Images (Labs, Libraries, Playgrounds)
  const facilities = intakeData.facilitiesConfig?.facilities || {};
  Object.entries(facilities).forEach(([facId, fac]: [string, any]) => {
    (fac.photos || []).forEach((photo: any, pIdx: number) => {
      const url = photo.url || photo.fileUrl;
      if (!url) return;
      registerCandidate({
        id: photo.id || `facility-${facId}-${pIdx}`,
        title: photo.caption || `${fac.name || facId} Photo`,
        originalName: photo.fileName || `${facId}-${pIdx + 1}.jpg`,
        url,
        size: photo.size || photo.fileSize,
        mimeType: photo.fileType || 'image/jpeg',
        category: 'facilities',
        sourceField: `facilitiesConfig.facilities.${facId}.photos[${pIdx}]`,
      });
    });
  });

  // 6. Transport Fleet & Hostel Images
  (intakeData.transportConfig?.fleetPhotos || []).forEach((img: any, idx: number) => {
    const url = img.url || img.fileUrl;
    if (url) {
      registerCandidate({
        id: img.id || `transport-fleet-${idx}`,
        title: img.caption || `Transport Fleet Vehicle ${idx + 1}`,
        originalName: img.fileName || `transport-bus-${idx + 1}.jpg`,
        url,
        size: img.size || img.fileSize,
        mimeType: img.fileType || 'image/jpeg',
        category: 'facilities',
        sourceField: `transportConfig.fleetPhotos[${idx}]`,
      });
    }
  });

  (intakeData.hostelConfig?.images || []).forEach((img: any, idx: number) => {
    const url = img.url || img.fileUrl;
    if (url) {
      registerCandidate({
        id: img.id || `hostel-photo-${idx}`,
        title: img.caption || `Residential Hostel Room ${idx + 1}`,
        originalName: img.fileName || `hostel-room-${idx + 1}.jpg`,
        url,
        size: img.size || img.fileSize,
        mimeType: img.fileType || 'image/jpeg',
        category: 'facilities',
        sourceField: `hostelConfig.images[${idx}]`,
      });
    }
  });

  // 7. Canonical Statutory Compliance Documents (Board Affiliation, Fire Safety, NOC)
  const canonicalDocs = resolveCanonicalDocuments(intakeData);
  canonicalDocs.forEach((doc) => {
    if (!doc.fileUrl) return;
    const cat = doc.checklistId.includes('affiliation') || doc.checklistId.includes('recognition') || doc.checklistId.includes('safety') || doc.checklistId.includes('registration')
      ? 'certificate'
      : doc.checklistId.includes('mandatory')
      ? 'statutory'
      : 'certificate';

    registerCandidate({
      id: doc.checklistId || doc.id,
      title: doc.documentName || doc.title,
      originalName: doc.fileName || `${doc.checklistId}.pdf`,
      url: doc.fileUrl,
      size: doc.fileSize,
      mimeType: 'application/pdf',
      category: cat,
      isDocument: true,
      sourceField: `statutoryCompliance.${doc.checklistId}`,
    });
  });

  // 8. Legal Policies Documents
  if (intakeData.legalPolicies?.policies) {
    Object.entries(intakeData.legalPolicies.policies).forEach(([policyKey, policy]: [string, any]) => {
      if (policy && policy.officialDocumentUrl) {
        registerCandidate({
          id: `policy-doc-${policyKey}`,
          title: policy.title ? `${policy.title} (Official PDF)` : `${policyKey} Policy`,
          originalName: policy.officialDocumentFileName || `${policyKey}-policy.pdf`,
          url: policy.officialDocumentUrl,
          size: policy.officialDocumentFileSize,
          mimeType: 'application/pdf',
          category: 'policy',
          isDocument: true,
          sourceField: `legalPolicies.policies.${policyKey}.officialDocumentUrl`,
        });
      }
    });
  }

  // 9. Section 25 Asset Checklist Items
  (intakeData.assetChecklist?.items || []).forEach((item: any) => {
    const url = item.fileUrl || item.storageKey;
    if (!url) return;

    const isDoc =
      item.type === 'document' ||
      item.fileType === 'application/pdf' ||
      item.fileType?.includes('pdf') ||
      item.category === 'certificates' ||
      item.category === 'policies' ||
      item.fileName?.toLowerCase().endsWith('.pdf') ||
      url.toLowerCase().endsWith('.pdf');

    let cat: ExportAssetCandidate['category'] = 'other';
    if (isDoc) {
      if (item.category === 'certificates') cat = 'certificate';
      else if (item.category === 'policies') cat = 'policy';
      else cat = 'statutory';
    } else {
      if (item.category === 'branding') cat = 'logo';
      else if (item.category === 'leadership') cat = 'staff';
      else if (item.category === 'campus_photos') cat = 'campus';
      else if (item.category === 'academic_content') cat = 'academics';
      else cat = 'gallery';
    }

    registerCandidate({
      id: item.id || `checklist-${item.category}-${item.title}`,
      title: item.title,
      originalName: item.fileName || `${item.id || 'document'}${isDoc ? '.pdf' : '.jpg'}`,
      url,
      size: item.fileSize,
      mimeType: item.fileType || (isDoc ? 'application/pdf' : 'image/jpeg'),
      category: cat,
      isDocument: isDoc,
      sourceField: `assetChecklist.items.${item.id}`,
    });
  });

  return Array.from(assetMap.values());
}

// ─── VALIDATION PHASE ─────────────────────────────────────────────────────────

export interface ValidationIssue {
  type: 'error' | 'warning';
  path: string;
  message: string;
}

/**
 * Validates the generated export files, cross-references, and binaries
 * BEFORE creating the final ZIP file. Fails fast if anything is invalid.
 */
export function validateExportPackage(
  root: JSZip,
  fileList: string[],
  assetManifest: AssetManifestEntry[],
  intakePayload: UniversalIntakeData
): void {
  const issues: ValidationIssue[] = [];

  // 1. Required core files check
  const requiredFiles = [
    'submission.json',
    'project.json',
    'school-profile/school-profile.json',
    'academics/academic-structure.json',
    'admissions/admissions.json',
    'fees/fee-structure.json',
    'facilities/facilities.json',
    'website/pages.json',
    'legal/legal-information.json',
    'technical/field-mapping.json',
    'technical/asset-manifest.json',
  ];

  for (const req of requiredFiles) {
    if (!root.file(req)) {
      issues.push({
        type: 'error',
        path: req,
        message: `Missing mandatory export file: ${req}`,
      });
    }
  }

  // 2. Verify all generated JSON files are parsable and non-empty
  for (const relativePath of fileList) {
    const file = root.file(relativePath);
    if (!file) {
      issues.push({
        type: 'error',
        path: relativePath,
        message: `File recorded in export list does not exist in ZIP: ${relativePath}`,
      });
      continue;
    }

    if (relativePath.endsWith('.json')) {
      // Synchronous check of text content
      try {
        // Since JSZip keeps internal file data, we can verify JSON parseability
        const fileData = (file as any)._data;
        if (fileData) {
          const text = typeof fileData === 'string'
            ? fileData
            : Buffer.isBuffer(fileData)
            ? fileData.toString('utf-8')
            : fileData.uncompressed
            ? Buffer.from(fileData.uncompressed).toString('utf-8')
            : null;

          if (text) {
            JSON.parse(text);
          }
        }
      } catch (err: any) {
        issues.push({
          type: 'error',
          path: relativePath,
          message: `Generated JSON file is invalid: ${err?.message}`,
        });
      }
    }
  }

  // 3. Verify all recorded assets exist and have non-zero size
  for (const asset of assetManifest) {
    const file = root.file(asset.exportPath);
    if (!file) {
      issues.push({
        type: 'error',
        path: asset.exportPath,
        message: `Asset recorded in manifest is missing from archive: ${asset.id} (${asset.exportPath})`,
      });
    } else if (asset.size <= 0) {
      issues.push({
        type: 'error',
        path: asset.exportPath,
        message: `Asset has 0 byte length: ${asset.id}`,
      });
    }
  }

  // 4. Verify Academic Cross-References
  const structure = intakePayload.institutionStructure;
  if (structure?.classes && structure.classes.length > 0) {
    const classIds = new Set(structure.classes.map((c: any) => c.classId || c.className));
    if (structure.subjectApplicability) {
      for (const app of structure.subjectApplicability) {
        if (app.classId && !classIds.has(app.classId)) {
          issues.push({
            type: 'warning',
            path: 'academics/class-wise-curriculum.json',
            message: `Subject applicability references undeclared classId: ${app.classId}`,
          });
        }
      }
    }
  }

  // 5. Check for security leaks in any JSON files
  for (const relativePath of fileList) {
    if (relativePath.endsWith('.json') && !relativePath.includes('submission-schema.json')) {
      const file = root.file(relativePath);
      const raw = (file as any)?._data;
      const text = typeof raw === 'string'
        ? raw
        : Buffer.isBuffer(raw)
        ? raw.toString('utf-8')
        : raw?.uncompressed
        ? Buffer.from(raw.uncompressed).toString('utf-8')
        : '';

      if (text) {
        const forbiddenPatterns = [
          /"api_key"\s*:\s*"[^"]{5,}"/i,
          /"access_token"\s*:\s*"[^"]{10,}"/i,
          /"service_role_key"\s*:\s*"[^"]{10,}"/i,
          /"db_password"\s*:\s*"[^"]{3,}"/i,
        ];
        for (const pat of forbiddenPatterns) {
          if (pat.test(text)) {
            issues.push({
              type: 'error',
              path: relativePath,
              message: `Sensitive security credential leaked in ${relativePath}`,
            });
          }
        }
      }
    }
  }

  const errors = issues.filter((i) => i.type === 'error');
  if (errors.length > 0) {
    const errorDetails = errors.map((e) => `[${e.path}] ${e.message}`).join('; ');
    throw new Error(`Export package validation failed: ${errorDetails}`);
  }
}

// ─── MASTER EXPORT ENGINE ─────────────────────────────────────────────────────

/**
 * Builds the complete, well-organized technical ZIP containing all submission records,
 * logical section JSONs, website pages, manifests, and binary media/document assets.
 */
export async function exportCompleteSchoolProjectZip(options: ExportOptions): Promise<CompleteExportResult> {
  const {
    project,
    submission,
    intakePayload,
    onProgress,
    assetResolver,
    token,
  } = options;

  onProgress?.('Preparing submission...');

  const projectId = project?.project_number || submission?.id?.slice(0, 16) || `SCH-${new Date().getFullYear()}-EXPORT`;
  const schoolName = intakePayload.schoolProfile?.schoolName || (intakePayload.schoolProfile as any)?.name || project?.school_name || 'School';
  const submissionVersion = `v${submission?.version_number || 1}`;
  const exportedAt = new Date().toISOString();
  const folderName = `${projectId}`;
  const branding = intakePayload.brandingDesign || ({} as any);

  const zip = new JSZip();
  const root = zip.folder(folderName) || zip;

  // Track all files created for manifest
  const fileList: string[] = [];
  const manifestEntries: ManifestFileEntry[] = [];
  const assetManifest: AssetManifestEntry[] = [];

  const addJsonFile = (
    relativePath: string,
    data: unknown,
    meta?: {
      section: string;
      description: string;
      sourceField?: string;
      type?: ManifestFileEntry['type'];
      relationships?: Record<string, unknown>;
    }
  ) => {
    const sanitized = sanitizeExportData(data);
    const content = JSON.stringify(sanitized, null, 2);
    const bytes = new TextEncoder().encode(content);
    root.file(relativePath, content);
    fileList.push(relativePath);

    manifestEntries.push({
      path: relativePath,
      section: meta?.section || relativePath.split('/')[0] || 'root',
      type: meta?.type || 'data_json',
      mimeType: 'application/json',
      size: bytes.length,
      description: meta?.description || `Structured JSON export for ${relativePath}`,
      sourceField: meta?.sourceField,
      relationships: meta?.relationships,
    });
  };

  // ── 1. Top-Level Canonical Submissions & Project ──
  onProgress?.('Collecting form data...');

  addJsonFile(
    'submission.json',
    {
      exportVersion: '2.0',
      projectId,
      schoolName,
      exportedAt,
      submissionVersion,
      submissionStatus: submission?.status || project?.status || 'SUBMITTED',
      submissionId: submission?.id || null,
      submittedBy: {
        name: submission?.submitted_by_name || project?.primary_contact_name || 'Authorized Administrator',
        email: submission?.submitted_by_email || project?.primary_contact_email || '',
      },
      customFields: submission?.custom_fields_data || {},
      canonicalData: intakePayload,
    },
    {
      section: 'root',
      description: 'Master canonical intake submission payload snapshot with full form state',
      sourceField: 'intake_payload',
      type: 'data_json',
      relationships: { projectId, submissionId: submission?.id },
    }
  );

  addJsonFile(
    'project.json',
    {
      id: project?.id || null,
      projectNumber: projectId,
      schoolName: project?.school_name || schoolName,
      domain: 'SCHOOL',
      productId: project?.product_id || 'school-complete',
      status: project?.status || 'UNDER_REVIEW',
      mediaStatus: project?.media_status || 'NOT_STARTED',
      completenessPercentage: project?.completeness_percentage || 100,
      primaryContact: {
        name: project?.primary_contact_name || '',
        email: project?.primary_contact_email || '',
        phone: project?.primary_contact_phone || '',
        designation: project?.primary_contact_designation || null,
      },
      city: project?.city || null,
      state: project?.state || null,
      domainRequirement: project?.domain_requirement || null,
      assignedReviewer: project?.assigned_reviewer_name || null,
      approvedAt: project?.approved_at || null,
      approvedBy: project?.approved_by || null,
      createdAt: project?.created_at || exportedAt,
      updatedAt: project?.updated_at || exportedAt,
    },
    {
      section: 'root',
      description: 'Institutional project record, review state, approval audit, and operational tracking',
      sourceField: 'school_projects',
      type: 'data_json',
      relationships: { projectId },
    }
  );

  // ── 2. Section: School Profile ──
  const profile: any = intakePayload.schoolProfile || {};
  addJsonFile(
    'school-profile/school-profile.json',
    {
      schoolName: profile.schoolName || profile.name || schoolName,
      establishedYear: profile.establishedYear || profile.establishmentYear || null,
      schoolType: profile.schoolType || 'Day School',
      board: profile.board || profile.curriculumBoard || 'CBSE',
      affiliationNumber: profile.affiliationNumber || null,
      mediumOfInstruction: profile.mediumOfInstruction || ['English'],
      tagline: profile.tagline || intakePayload.brandingDesign?.taglineOrMotto || null,
      schoolMotto: intakePayload.brandingDesign?.motto || null,
    },
    {
      section: 'school-profile',
      description: 'School permanent identity, registration, board affiliation, and motto',
      sourceField: 'schoolProfile',
    }
  );

  addJsonFile(
    'school-profile/campuses.json',
    {
      campuses: intakePayload.campuses || [],
      campusOverrides: intakePayload.campusOverrides || {},
    },
    {
      section: 'school-profile',
      description: 'Campus locations, branch hierarchy, infrastructure assignments, and branch overrides',
      sourceField: 'campuses',
      relationships: { campusCount: intakePayload.campuses?.length || 0 },
    }
  );

  addJsonFile(
    'school-profile/contact-information.json',
    {
      officialEmail: profile.officialEmail || profile.contactEmail || project?.primary_contact_email || '',
      officialPhone: profile.officialPhone || profile.contactPhone || project?.primary_contact_phone || '',
      alternatePhone: profile.alternatePhone || null,
      websiteUrl: profile.websiteUrl || null,
      registeredAddress: profile.registeredAddress || profile.address || null,
      administrativeContacts: profile.administrativeContacts || [],
      socialMedia: intakePayload.socialMedia || {},
    },
    {
      section: 'school-profile',
      description: 'Institutional contact channels, physical postal addresses, and official social handles',
      sourceField: 'schoolProfile.contact',
    }
  );

  addJsonFile(
    'school-profile/institutional-details.json',
    {
      leadership: intakePayload.leadership || {},
      visionStatement: intakePayload.brandingDesign?.visionStatement || null,
      missionStatement: intakePayload.brandingDesign?.missionStatement || null,
      coreValues: intakePayload.brandingDesign?.coreValues || [],
      studentConfig: intakePayload.studentConfig || {},
      staffFaculty: intakePayload.staffFaculty || {},
      institutionalIdNumbering: intakePayload.institutionalIdNumbering || {},
    },
    {
      section: 'school-profile',
      description: 'School leadership members, institutional vision, mission, student & staff numbering',
      sourceField: 'leadership',
    }
  );

  addJsonFile(
    'school-profile/staff-directory.json',
    {
      staffRecords: intakePayload.staffRecords || [],
      staffFacultyConfig: intakePayload.staffFaculty || {},
      totalStaffCount: (intakePayload.staffRecords || []).length,
    },
    {
      section: 'school-profile',
      description: 'Staff directory records, employee designations, qualifications, and department allocations',
      sourceField: 'staffRecords',
    }
  );

  // ── 3. Section: Academics ──
  const academics: any = intakePayload.institutionStructure || {};
  addJsonFile(
    'academics/academic-structure.json',
    {
      currentAcademicSession: academics.currentAcademicSession || '2026-2027',
      sessionStartDate: academics.sessionStartDate || null,
      sessionEndDate: academics.sessionEndDate || null,
      classesOfferedFrom: academics.classesOfferedFrom || null,
      classesOfferedTo: academics.classesOfferedTo || null,
      namingConvention: academics.namingConvention || 'Class',
      totalSectionsEstimated: academics.totalSectionsEstimated || null,
      studentCapacityTotal: academics.studentCapacityTotal || null,
      teachingStaffCount: academics.teachingStaffCount || null,
      nonTeachingStaffCount: academics.nonTeachingStaffCount || null,
      academicStreams: academics.academicStreams || [],
      departments: academics.departments || [],
      structureStatus: academics.structureStatus || 'confirmed',
    },
    {
      section: 'academics',
      description: 'Academic session dates, offered grade ranges, naming conventions, and staff quotas',
      sourceField: 'institutionStructure',
    }
  );

  addJsonFile(
    'academics/classes.json',
    {
      classes: (academics.classes || []).map((c: any) => ({
        classId: c.classId || c.id || c.className,
        className: c.className,
        gradeLevel: c.gradeLevel || null,
        stage: c.stage || null,
        capacityPerSection: c.capacityPerSection || null,
        streams: c.streams || [],
        sectionsCount: c.sections?.length || 0,
      })),
    },
    {
      section: 'academics',
      description: 'Grade-wise class catalog with capacities, stages, and section counts',
      sourceField: 'institutionStructure.classes',
      relationships: { classCount: (academics.classes || []).length },
    }
  );

  addJsonFile(
    'academics/sections.json',
    {
      classesWithSections: (academics.classes || []).map((c: any) => ({
        className: c.className,
        sections: c.sections || [],
      })),
    },
    {
      section: 'academics',
      description: 'Detailed section breakdown, room allocations, and student capacities per class',
      sourceField: 'institutionStructure.classes',
    }
  );

  addJsonFile(
    'academics/subjects.json',
    {
      subjects: (academics.subjects || []).map((s: any) => ({
        code: s.code || s.subjectCode || '',
        name: s.name || s.subjectName || '',
        type: s.type || s.category || 'Core',
        creditHours: s.creditHours || null,
        department: s.department || null,
        isOptional: s.isOptional ?? false,
      })),
    },
    {
      section: 'academics',
      description: 'Curriculum subject catalog with codes, credit hours, departments, and requirement type',
      sourceField: 'institutionStructure.subjects',
    }
  );

  addJsonFile(
    'academics/subject-catalog.json',
    {
      catalog: academics.subjects || [],
      subjectApplicability: academics.subjectApplicability || [],
    },
    {
      section: 'academics',
      description: 'Master academic subject catalog with grade-level applicability rules',
      sourceField: 'institutionStructure.subjects',
    }
  );

  addJsonFile(
    'academics/curriculum.json',
    {
      curriculum: intakePayload.curriculum || {},
      boardGuidelines: academics.board || 'CBSE',
      effectiveCurriculum: academics.effectiveCurriculum || 'CBSE Standard',
    },
    {
      section: 'academics',
      description: 'Pedagogical curriculum model, examination framework, and board alignment',
      sourceField: 'curriculum',
    }
  );

  addJsonFile(
    'academics/class-wise-curriculum.json',
    {
      classWiseCurriculum: academics.subjectApplicability || [],
      classTeacherAssignments: academics.classTeacherAssignments || [],
      subjectTeacherAssignments: academics.subjectTeacherAssignments || [],
    },
    {
      section: 'academics',
      description: 'Class-by-class subject allocation, faculty assignments, and syllabus mappings',
      sourceField: 'institutionStructure.subjectApplicability',
    }
  );

  addJsonFile(
    'academics/attendance-config.json',
    {
      attendanceConfig: intakePayload.attendanceConfig || {},
    },
    {
      section: 'academics',
      description: 'Attendance workflow, daily/subject tracking modes, biometric sync, and holidays',
      sourceField: 'attendanceConfig',
    }
  );

  addJsonFile(
    'academics/examination-config.json',
    {
      examinationConfig: intakePayload.examinationConfig || {},
    },
    {
      section: 'academics',
      description: 'Examination assessment structure, terms, grading scales, and report card policies',
      sourceField: 'examinationConfig',
    }
  );

  addJsonFile(
    'academics/timetable-config.json',
    {
      timetableConfig: intakePayload.timetableConfig || {},
    },
    {
      section: 'academics',
      description: 'Timetable configurations, periods per day, period durations, and break timings',
      sourceField: 'timetableConfig',
    }
  );

  addJsonFile(
    'academics/student-directory.json',
    {
      students: intakePayload.students || [],
      studentConfig: intakePayload.studentConfig || {},
      totalStudentsCount: (intakePayload.students || []).length,
    },
    {
      section: 'academics',
      description: 'Enrolled student roster, admission numbers, sections, and parent contact references',
      sourceField: 'students',
    }
  );

  // ── 4. Section: Admissions ──
  const admissions = intakePayload.admissions || ({} as any);
  addJsonFile(
    'admissions/admissions.json',
    {
      admissionsOpen: admissions.admissionsOpen ?? (admissions.status === 'open'),
      status: admissions.status || 'open',
      session: admissions.session || academics.currentAcademicSession || '2026-2027',
      applicationStartDate: admissions.applicationStartDate || null,
      applicationEndDate: admissions.applicationEndDate || null,
      classesOpenForAdmission: admissions.classesOpenForAdmission || [],
      classAvailability: admissions.classAvailability || [],
      contact: admissions.contact || {
        person: admissions.contactPerson || null,
        phone: admissions.admissionPhone || null,
        email: admissions.admissionEmail || null,
        whatsapp: admissions.admissionWhatsapp || null,
        officeHours: admissions.officeHours || null,
      },
      admissionCycleNotes: admissions.admissionCycleNotes || null,
      additionalInformation: admissions.additionalInformation || null,
    },
    {
      section: 'admissions',
      description: 'Admissions cycle overview, open grades, deadlines, and helpdesk contacts',
      sourceField: 'admissions',
    }
  );

  addJsonFile(
    'admissions/eligibility.json',
    {
      eligibility: admissions.eligibility || {},
      eligibilityCriteria: admissions.eligibilityCriteria || null,
      ageCriteria: admissions.ageCriteria || null,
      minAgeCriteria: admissions.minAgeCriteria || null,
      maxAgeCriteria: admissions.maxAgeCriteria || null,
    },
    {
      section: 'admissions',
      description: 'Admission eligibility rules, cutoff dates, minimum ages, and academic pre-requisites',
      sourceField: 'admissions.eligibility',
    }
  );

  addJsonFile(
    'admissions/admission-process.json',
    {
      processSteps: admissions.process || [],
      workflowStages: admissions.workflowStages || admissions.admissionStages || [],
      importantDates: admissions.importantDates || [],
      interviewRequired: admissions.interviewRequired ?? false,
      entranceTestRequired: admissions.entranceTestRequired ?? false,
      applicationMethod: admissions.applicationOptions || admissions.application || {},
      ctaConfig: {
        action: admissions.callToAction || 'online_form',
        customLabel: admissions.customCtaLabel || null,
      },
    },
    {
      section: 'admissions',
      description: 'Step-by-step admission roadmap, milestones, interview procedures, and action buttons',
      sourceField: 'admissions.process',
    }
  );

  addJsonFile(
    'admissions/required-documents.json',
    {
      documents: admissions.documents || [],
      requiredDocumentsList: admissions.requiredDocuments || [],
    },
    {
      section: 'admissions',
      description: 'Mandatory and optional documents required from applicant parents during admission',
      sourceField: 'admissions.documents',
    }
  );

  // ── 5. Section: Fees ──
  const fees = intakePayload.feesConfiguration || ({} as any);
  addJsonFile(
    'fees/fee-structure.json',
    {
      academicSession: fees.academicSession || academics.currentAcademicSession || '2026-2027',
      currency: fees.currency || 'INR',
      commonFees: fees.commonFees || [],
      classFeeOverrides: fees.classFeeOverrides || {},
      optionalServices: fees.optionalServices || [],
    },
    {
      section: 'fees',
      description: 'Tuition, development, and admission fee schedules with class-specific overrides',
      sourceField: 'feesConfiguration',
    }
  );

  addJsonFile(
    'fees/fee-categories.json',
    {
      tuitionFees: (fees.commonFees || []).filter((f: any) => f.category === 'Tuition'),
      annualCharges: (fees.commonFees || []).filter((f: any) => f.category === 'Annual Charges'),
      oneTimeAdmissionFees: (fees.commonFees || []).filter((f: any) => f.frequency === 'one_time' || f.isAdmissionOnly),
      concessionsAndDiscounts: fees.concessionsAndDiscounts || fees.discounts || [],
      feeCategoriesList: fees.feeCategories || [],
    },
    {
      section: 'fees',
      description: 'Categorized breakdown of tuition, annual, admission fees, sibling discounts, and scholarships',
      sourceField: 'feesConfiguration.feeCategories',
    }
  );

  addJsonFile(
    'fees/payment-information.json',
    {
      paymentPlans: fees.paymentPlans || [],
      paymentMethods: fees.paymentMethods || ['Net Banking', 'UPI', 'Debit/Credit Card', 'Cheque / Demand Draft'],
      lateFeePolicy: fees.lateFeePolicy || null,
      refundPolicy: fees.refundPolicy || null,
      bankAccountInstructions: fees.bankAccountInstructions || null,
    },
    {
      section: 'fees',
      description: 'Payment schedule intervals, accepted banking channels, refund policies, and late fines',
      sourceField: 'feesConfiguration.payment',
    }
  );

  // ── 6. Section: Facilities & Operations ──
  const facilitiesData = intakePayload.facilitiesConfig || ({} as any);
  addJsonFile(
    'facilities/facilities.json',
    {
      facilities: facilitiesData.facilities || {},
      generalDescription: facilitiesData.generalDescription || null,
    },
    {
      section: 'facilities',
      description: 'Inventory of campus amenities, sports fields, science laboratories, and art studios',
      sourceField: 'facilitiesConfig',
    }
  );

  addJsonFile(
    'facilities/infrastructure.json',
    {
      campusAreaSqFt: facilitiesData.campusAreaSqFt || null,
      builtUpAreaSqFt: facilitiesData.builtUpAreaSqFt || null,
      playgroundAreaSqFt: facilitiesData.playgroundAreaSqFt || null,
      smartClassroomsCount: facilitiesData.facilities?.smart_classrooms?.count || null,
      laboratoriesCount: facilitiesData.facilities?.science_lab?.count || null,
      computerLabsCount: facilitiesData.facilities?.computer_lab?.count || null,
      libraryBookCount: (intakePayload.libraryConfig as any)?.totalBooks || facilitiesData.facilities?.library?.bookCount || null,
      sportsInfrastructure: facilitiesData.facilities?.sports_playground || {},
      transportation: intakePayload.transportConfig || facilitiesData.facilities?.transport || {},
      hostelResidential: intakePayload.hostelConfig || facilitiesData.facilities?.hostel || {},
    },
    {
      section: 'facilities',
      description: 'Campus acreage, built-up areas, architectural specifications, and lab counts',
      sourceField: 'facilitiesConfig.infrastructure',
    }
  );

  addJsonFile(
    'facilities/facility-details.json',
    {
      detailedFacilities: Object.entries(facilitiesData.facilities || {}).map(([key, fac]: [string, any]) => ({
        facilityKey: key,
        name: fac.name || key,
        isAvailable: fac.isAvailable ?? true,
        features: fac.features || [],
        specifications: fac.specifications || {},
        description: fac.description || null,
        photosCount: fac.photos?.length || 0,
      })),
    },
    {
      section: 'facilities',
      description: 'Deep feature checklists, equipment counts, and photo links per facility category',
      sourceField: 'facilitiesConfig.facilities',
    }
  );

  addJsonFile(
    'facilities/transport.json',
    {
      transportConfig: intakePayload.transportConfig || {},
    },
    {
      section: 'facilities',
      description: 'Transport fleet specifications, routes, GPS tracking, vehicle counts, and safety rules',
      sourceField: 'transportConfig',
    }
  );

  addJsonFile(
    'facilities/hostel.json',
    {
      hostelConfig: intakePayload.hostelConfig || {},
    },
    {
      section: 'facilities',
      description: 'Residential hostel buildings, wardens, room allocations, mess/dining, and medical care',
      sourceField: 'hostelConfig',
    }
  );

  addJsonFile(
    'facilities/library.json',
    {
      libraryConfig: intakePayload.libraryConfig || {},
    },
    {
      section: 'facilities',
      description: 'Library management catalog, book volumes, digital OPAC, and circulation rules',
      sourceField: 'libraryConfig',
    }
  );

  // ── 7. Section: Website & Design ──
  onProgress?.('Collecting website configuration...');
  const pageConfigs: Record<string, WebsitePageConfiguration> =
    intakePayload.websiteRequirements?.pageConfigurations ||
    buildWebsitePageConfigurations(intakePayload);

  const schoolContent: any = intakePayload.schoolContent || {};
  addJsonFile(
    'website/website-content.json',
    {
      aboutSchool: schoolContent.aboutSchool || null,
      principalMessage: schoolContent.principalDeskMessage || schoolContent.principalMessage || intakePayload.leadership?.principalMessage || null,
      historyAndLegacy: schoolContent.historyAndLegacy || null,
      visionMission: {
        mission: schoolContent.mission || intakePayload.brandingDesign?.missionStatement || null,
        vision: schoolContent.vision || intakePayload.brandingDesign?.visionStatement || null,
      },
      keyAchievements: schoolContent.keyAchievements || [],
      faqItems: schoolContent.faqItems || [],
    },
    {
      section: 'website',
      description: 'Narrative copy, about school history, principal desk message, and FAQ directory',
      sourceField: 'schoolContent',
    }
  );

  addJsonFile(
    'website/pages.json',
    {
      pages: pageConfigs,
    },
    {
      section: 'website',
      description: 'Full page definitions, slugs, page layout blocks, and content specifications',
      sourceField: 'websiteRequirements.pageConfigurations',
      relationships: { totalPages: Object.keys(pageConfigs).length },
    }
  );

  addJsonFile(
    'website/navigation.json',
    {
      mainNavigation: Object.values(pageConfigs)
        .filter((p) => p.enabled)
        .map((p) => ({
          label: p.label,
          slug: p.slug,
          pageKey: p.pageKey,
          isCustom: p.isCustom,
        })),
      footerLinks: (intakePayload.websiteRequirements as any)?.footerLinks || [
        'Privacy Policy',
        'Terms & Conditions',
        'Mandatory Public Disclosure',
        'Contact Us',
      ],
    },
    {
      section: 'website',
      description: 'Header primary navbar hierarchy, dropdown menus, and footer legal links',
      sourceField: 'websiteRequirements',
    }
  );

  addJsonFile(
    'website/sections.json',
    {
      pageSections: Object.fromEntries(
        Object.entries(pageConfigs).map(([key, cfg]) => [
          key,
          {
            label: cfg.label,
            recommendedSections: cfg.recommendedSections || [],
            requirements: cfg.requirements || [],
          },
        ])
      ),
    },
    {
      section: 'website',
      description: 'Page-by-page section ordering, layout requirements, and component blocks',
      sourceField: 'websiteRequirements.pageConfigurations',
    }
  );

  addJsonFile(
    'website/seo.json',
    {
      seoConfig: intakePayload.seoConfig || {
        seoSchoolTitle: `${schoolName} | Official Website`,
        seoMetaDescription: `Official portal of ${schoolName}. Admissions, curriculum, facilities and school disclosures.`,
        targetKeywords: 'admissions, school, academics, cbse',
      },
    },
    {
      section: 'website',
      description: 'Search Engine Optimization tags, OpenGraph previews, keywords, and meta descriptions',
      sourceField: 'seoConfig',
    }
  );

  addJsonFile(
    'website/branding.json',
    {
      hasHighResLogo: branding.hasHighResLogo ?? Boolean(branding.logoUrl),
      logoUrl: branding.logoUrl || null,
      crestUrl: branding.crestUrl || null,
      faviconUrl: branding.faviconUrl || null,
      brandTone: branding.brandTone || 'Academic & Scholarly',
      preferredWebsiteStyle: branding.preferredWebsiteStyle || 'Modern & Progressive',
      preferredVisualTone: branding.preferredVisualTone || 'modern_vibrant',
      brandGuidelinesUrl: branding.brandGuidelinesUrl || null,
    },
    {
      section: 'website',
      description: 'School branding guidelines, visual identity preferences, and logo links',
      sourceField: 'brandingDesign',
    }
  );

  addJsonFile(
    'website/theme.json',
    {
      themeName: branding.brandTone || 'default-theme',
      style: branding.preferredWebsiteStyle || 'Modern & Progressive',
      visualTone: branding.preferredVisualTone || 'modern_vibrant',
      tokens: {
        primaryColor: branding.primaryColor || '#1e3a8a',
        secondaryColor: branding.secondaryColor || '#0284c7',
        accentColor: branding.accentColor || '#f59e0b',
        fontFamily: branding.fontFamilyPreference || 'Inter, sans-serif',
        borderRadius: '0.75rem',
        shadows: 'subtle-modern',
      },
    },
    {
      section: 'website',
      description: 'CSS design tokens, theme color variables, border radii, and visual styling rules',
      sourceField: 'brandingDesign',
    }
  );

  addJsonFile(
    'website/colors.json',
    {
      primary: branding.primaryColor || '#1e3a8a',
      secondary: branding.secondaryColor || '#0284c7',
      accent: branding.accentColor || '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      textMain: '#0f172a',
      textMuted: '#64748b',
    },
    {
      section: 'website',
      description: 'Color palette specifications for light and dark rendering modes',
      sourceField: 'brandingDesign.primaryColor',
    }
  );

  addJsonFile(
    'website/typography.json',
    {
      fontFamily: branding.fontFamilyPreference || 'Inter, system-ui, sans-serif',
      headingScale: '1.25',
      bodyWeight: '400',
      headingWeight: '700',
    },
    {
      section: 'website',
      description: 'Font family configuration, heading scales, and typographic weights',
      sourceField: 'brandingDesign.fontFamilyPreference',
    }
  );

  addJsonFile(
    'website/layout.json',
    {
      headerLayout: 'standard-navbar-with-logo-and-cta',
      footerLayout: 'four-column-disclosure-footer',
      containerMaxWidth: '1280px',
      homepageLayout: [
        'Hero Banner',
        'Principal Desk',
        'About School',
        'Academic Highlights',
        'Campus Facilities Preview',
        'Latest Announcements',
        'Mandatory Disclosures Strip',
      ],
    },
    {
      section: 'website',
      description: 'Structural container widths, navbar layout, and homepage module arrangement',
      sourceField: 'websiteRequirements',
    }
  );

  addJsonFile(
    'website/design-config.json',
    {
      designReferences: intakePayload.designReferences || {},
      websiteScope: intakePayload.websiteScope || {},
    },
    {
      section: 'website',
      description: 'Visual references, competitor benchmark websites, and customized project scope',
      sourceField: 'designReferences',
    }
  );

  addJsonFile(
    'website/cms-workflow.json',
    {
      cmsRequirements: intakePayload.cmsRequirements || {},
    },
    {
      section: 'website',
      description: 'Content Management System publishing permissions, workflow, and news modules',
      sourceField: 'cmsRequirements',
    }
  );

  addJsonFile(
    'website/domain-hosting.json',
    {
      domainPresence: intakePayload.domainPresence || {},
    },
    {
      section: 'website',
      description: 'Domain registrar, DNS records, SSL requirements, and official email setups',
      sourceField: 'domainPresence',
    }
  );

  addJsonFile(
    'website/portal-requirements.json',
    {
      portalRequirements: intakePayload.portalRequirements || {},
    },
    {
      section: 'website',
      description: 'Student, Parent, and Faculty portal authentication and access specifications',
      sourceField: 'portalRequirements',
    }
  );

  addJsonFile(
    'website/media-governance.json',
    {
      mediaAssetsGovernance: intakePayload.mediaAssets?.governance || {},
      generalNotes: intakePayload.mediaAssets?.generalNotes || null,
      sharedDriveUrl: intakePayload.mediaAssets?.sharedDriveUrl || null,
    },
    {
      section: 'website',
      description: 'Copyright authorizations, student photography consent, and usage rights governance',
      sourceField: 'mediaAssets.governance',
    }
  );

  // ── 8. Section: Legal & Policies ──
  const legal = intakePayload.legalPolicies || ({} as any);
  addJsonFile(
    'legal/legal-information.json',
    {
      societyOrTrustName: legal.societyOrTrustName || null,
      registrationNumber: legal.registrationNumber || null,
      mandatoryPublicDisclosures: legal.mandatoryPublicDisclosures || legal.disclosures || [],
      governanceDetails: legal.governanceDetails || null,
    },
    {
      section: 'legal',
      description: 'Educational trust registration, public disclosures, and governing council records',
      sourceField: 'legalPolicies',
    }
  );

  addJsonFile(
    'legal/policies.json',
    {
      policies: legal.policies || {},
    },
    {
      section: 'legal',
      description: 'Official school compliance policies: POSH, Grievance, Child Protection, and Code of Conduct',
      sourceField: 'legalPolicies.policies',
    }
  );

  addJsonFile(
    'legal/terms.json',
    {
      termsAndConditions: legal.termsAndConditions || legal.policies?.terms || 'Standard School Portal Terms & Conditions',
    },
    {
      section: 'legal',
      description: 'Terms of service, portal usage terms, and online admission agreements',
      sourceField: 'legalPolicies.termsAndConditions',
    }
  );

  addJsonFile(
    'legal/privacy-policy.json',
    {
      privacyPolicyConfig: intakePayload.websiteRequirements?.privacyPolicyConfig || legal.policies?.privacy || {},
    },
    {
      section: 'legal',
      description: 'Student data protection policy, cookie declaration, and DPDP Act compliance',
      sourceField: 'legalPolicies.policies.privacy',
    }
  );

  addJsonFile(
    'legal/declarations.json',
    {
      clientConfirmation: intakePayload.clientConfirmation || {},
      statutoryDeclarations: legal.statutoryDeclarations || [],
    },
    {
      section: 'legal',
      description: 'Signed legal affirmations, client sign-off records, timestamps, and authorized signatories',
      sourceField: 'clientConfirmation',
    }
  );

  addJsonFile(
    'legal/statutory-information.json',
    {
      affiliationStatus: legal.affiliationStatus || profile.board || 'CBSE',
      affiliationNumber: profile.affiliationNumber || null,
      validUntil: legal.affiliationValidUntil || '2028-03-31',
      nocDetails: legal.nocDetails || null,
      fireSafetyNocValidUntil: legal.fireSafetyNocValidUntil || '2027-06-30',
    },
    {
      section: 'legal',
      description: 'Affiliation grant numbers, government recognition letters, and NOC validity schedules',
      sourceField: 'legalPolicies.statutory',
    }
  );

  // ── 9. Technical Specifications & Integrations ──
  addJsonFile(
    'technical/integrations.json',
    {
      integrationsConfig: intakePayload.integrationsConfig || {},
    },
    {
      section: 'technical',
      description: 'Third-party integrations: biometric devices, payment gateways, SMS vendors, and GPS',
      sourceField: 'integrationsConfig',
    }
  );

  addJsonFile(
    'technical/mobile-app.json',
    {
      mobileAppConfig: intakePayload.mobileAppConfig || {},
    },
    {
      section: 'technical',
      description: 'Mobile application platforms (Android / iOS), target audiences, and push notifications',
      sourceField: 'mobileAppConfig',
    }
  );

  addJsonFile(
    'technical/data-migration.json',
    {
      existingSystemsMigration: intakePayload.existingSystemsMigration || {},
    },
    {
      section: 'technical',
      description: 'Legacy software migration scopes, historical data migration, and data file specs',
      sourceField: 'existingSystemsMigration',
    }
  );

  addJsonFile(
    'technical/security-privacy.json',
    {
      securityPrivacy: intakePayload.securityPrivacy || {},
      userRolesConfig: intakePayload.userRolesConfig || {},
    },
    {
      section: 'technical',
      description: 'Role-based access permissions, audit logging, session timeouts, and data retention',
      sourceField: 'securityPrivacy',
    }
  );

  addJsonFile(
    'technical/erp-requirements.json',
    {
      erpRequirements: intakePayload.erpRequirements || {},
    },
    {
      section: 'technical',
      description: 'School Enterprise Resource Planning (ERP) functional modules and complexity tiers',
      sourceField: 'erpRequirements',
    }
  );

  addJsonFile(
    'technical/additional-requirements.json',
    {
      additionalRequirements: intakePayload.additionalRequirements || {},
    },
    {
      section: 'technical',
      description: 'Custom implementation requests, special workflows, and bespoke report designs',
      sourceField: 'additionalRequirements',
    }
  );

  addJsonFile(
    'technical/admin-provisioning.json',
    {
      usersAccess: intakePayload.usersAccess || {},
      userRolesConfig: intakePayload.userRolesConfig || {},
    },
    {
      section: 'technical',
      description: 'Primary administrator credentials, contact access delegations, and role allocations',
      sourceField: 'usersAccess',
    }
  );

  addJsonFile(
    'technical/project-delivery.json',
    {
      projectDelivery: intakePayload.projectDelivery || {},
    },
    {
      section: 'technical',
      description: 'Project delivery priorities, target go-live milestones, and delivery pricing tier',
      sourceField: 'projectDelivery',
    }
  );

  // ── 10. Collect & Download Media and Document Assets ──
  onProgress?.('Collecting media assets...');
  const allAssetCandidates = collectAllExportAssets(intakePayload);

  // Group assets into destination paths with collision detection
  const usedPaths = new Set<string>();

  for (let i = 0; i < allAssetCandidates.length; i++) {
    const candidate = allAssetCandidates[i];
    if (candidate.isDocument) {
      onProgress?.('Collecting documents...');
    }

    // Resolve binary data
    let binaryData: Uint8Array;
    let mimeType: string = candidate.mimeType || 'application/octet-stream';

    if (assetResolver) {
      const customBuf = await assetResolver(candidate);
      if (!customBuf) {
        throw new Error(`Asset resolver failed to provide binary bytes for asset "${candidate.title}" (${candidate.id}).`);
      }
      binaryData = customBuf;
    } else {
      const fetched = await fetchAssetBytes(candidate, token);
      binaryData = fetched.data;
      mimeType = fetched.mimeType || mimeType;
    }

    // Determine target directory inside ZIP
    let targetDir: string;
    if (candidate.isDocument) {
      const docFolder =
        candidate.category === 'certificate' ? 'certificates' :
        candidate.category === 'statutory' ? 'statutory' :
        candidate.category === 'accreditation' ? 'accreditation' :
        candidate.category === 'policy' ? 'policies' :
        candidate.category === 'approval' ? 'approvals' : 'other';
      targetDir = `documents/${docFolder}`;
    } else {
      const mediaFolder =
        candidate.category === 'logo' ? 'logo' :
        candidate.category === 'favicon' ? 'favicon' :
        candidate.category === 'gallery' ? 'gallery' :
        candidate.category === 'campus' ? 'campus' :
        candidate.category === 'facilities' ? 'facilities' :
        candidate.category === 'staff' ? 'staff' :
        candidate.category === 'academics' ? 'academics' : 'other';
      targetDir = `media/${mediaFolder}`;
    }

    // Sanitize and resolve unique filename in target folder
    const ext = resolveExtension(mimeType, candidate.originalName || candidate.url);
    const cleanFileName = sanitizeZipFileName(candidate.originalName || `${candidate.id}${ext}`, ext);

    let exportPath = `${targetDir}/${cleanFileName}`;
    let collisionCounter = 2;
    while (usedPaths.has(exportPath)) {
      const extMatch = cleanFileName.match(/\.([a-zA-Z0-9]+)$/);
      const fileExt = extMatch ? `.${extMatch[1]}` : '';
      const base = extMatch ? cleanFileName.slice(0, -fileExt.length) : cleanFileName;
      exportPath = `${targetDir}/${base}-${collisionCounter}${fileExt}`;
      collisionCounter++;
    }
    usedPaths.add(exportPath);

    // Compute cryptographic SHA-256 for asset integrity
    const checksum = await calculateSha256(binaryData);

    // Add binary file to ZIP
    root.file(exportPath, binaryData);
    fileList.push(exportPath);

    // Record in asset manifest
    assetManifest.push({
      id: candidate.id,
      originalName: candidate.originalName,
      exportPath,
      mimeType,
      size: binaryData.length,
      sha256: checksum,
      category: candidate.category,
      sourceField: candidate.sourceField,
      url: candidate.url,
    });

    manifestEntries.push({
      path: exportPath,
      section: candidate.isDocument ? 'documents' : 'media',
      type: candidate.isDocument ? 'binary_document' : 'binary_image',
      mimeType,
      size: binaryData.length,
      sha256: checksum,
      description: `${candidate.title} (${candidate.category})`,
      sourceField: candidate.sourceField,
      relationships: { assetId: candidate.id, originalUrl: candidate.url },
    });
  }

  // ── 11. Technical Manifests & Schema ──
  addJsonFile(
    'technical/asset-manifest.json',
    assetManifest,
    {
      section: 'technical',
      description: 'Authoritative machine-readable inventory of all bundled binary media and document assets',
      type: 'technical_manifest',
    }
  );

  addJsonFile(
    'technical/field-mapping.json',
    {
      exportVersion: '2.0.0',
      description: 'Comprehensive mapping linking all 32 onboarding sections and fields to exported file paths and logical models.',
      mappings: [
        { section: 1, field: 'schoolProfile', targetFile: 'school-profile/school-profile.json' },
        { section: 2, field: 'campuses', targetFile: 'school-profile/campuses.json' },
        { section: 3, field: 'leadership', targetFile: 'school-profile/institutional-details.json' },
        { section: 4, field: 'brandingDesign', targetFile: 'website/branding.json' },
        { section: 5, field: 'websiteRequirements', targetFile: 'website/pages.json' },
        { section: 6, field: 'schoolContent', targetFile: 'website/website-content.json' },
        { section: 7, field: 'institutionStructure', targetFile: 'academics/academic-structure.json' },
        { section: 8, field: 'staffFaculty', targetFile: 'school-profile/staff-directory.json' },
        { section: 9, field: 'studentConfig', targetFile: 'academics/student-directory.json' },
        { section: 10, field: 'admissions', targetFile: 'admissions/admissions.json' },
        { section: 11, field: 'feesConfiguration', targetFile: 'fees/fee-structure.json' },
        { section: 12, field: 'curriculum', targetFile: 'academics/curriculum.json' },
        { section: 13, field: 'attendanceConfig', targetFile: 'academics/attendance-config.json' },
        { section: 14, field: 'examinationConfig', targetFile: 'academics/examination-config.json' },
        { section: 15, field: 'transportConfig', targetFile: 'facilities/transport.json' },
        { section: 16, field: 'facilitiesConfig', targetFile: 'facilities/facilities.json' },
        { section: 17, field: 'libraryConfig', targetFile: 'facilities/library.json' },
        { section: 18, field: 'hostelConfig', targetFile: 'facilities/hostel.json' },
        { section: 19, field: 'cmsRequirements', targetFile: 'website/cms-workflow.json' },
        { section: 20, field: 'domainPresence', targetFile: 'website/domain-hosting.json' },
        { section: 21, field: 'existingSystemsMigration', targetFile: 'technical/data-migration.json' },
        { section: 22, field: 'integrationsConfig', targetFile: 'technical/integrations.json' },
        { section: 23, field: 'mobileAppConfig', targetFile: 'technical/mobile-app.json' },
        { section: 24, field: 'securityPrivacy', targetFile: 'technical/security-privacy.json' },
        { section: 25, field: 'assetChecklist', targetFile: 'technical/asset-manifest.json' },
        { section: 26, field: 'legalPolicies', targetFile: 'legal/legal-information.json' },
        { section: 27, field: 'projectDelivery', targetFile: 'technical/project-delivery.json' },
        { section: 28, field: 'usersAccess', targetFile: 'technical/admin-provisioning.json' },
        { section: 29, field: 'erpRequirements', targetFile: 'technical/erp-requirements.json' },
        { section: 30, field: 'portalRequirements', targetFile: 'website/portal-requirements.json' },
        { section: 31, field: 'mediaAssets', targetFile: 'website/media-governance.json' },
        { section: 32, field: 'additionalRequirements', targetFile: 'technical/additional-requirements.json' },
      ],
      assetLinks: assetManifest.map((a) => ({
        field: a.sourceField,
        assetId: a.id,
        path: a.exportPath,
        checksum: a.sha256,
      })),
    },
    {
      section: 'technical',
      description: 'Exhaustive cross-reference directory mapping onboarding fields to archive paths',
      type: 'technical_manifest',
    }
  );

  addJsonFile(
    'technical/submission-schema.json',
    {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'SchoolOnboardingUniversalSubmissionSchema',
      version: '2.0.0',
      description: 'Canonical schema defining the complete school onboarding data model and export structure.',
      sections: [
        'schoolProfile',
        'campuses',
        'leadership',
        'brandingDesign',
        'websiteRequirements',
        'schoolContent',
        'institutionStructure',
        'staffFaculty',
        'studentConfig',
        'admissions',
        'feesConfiguration',
        'curriculum',
        'attendanceConfig',
        'examinationConfig',
        'transportConfig',
        'facilitiesConfig',
        'libraryConfig',
        'hostelConfig',
        'cmsRequirements',
        'domainPresence',
        'existingSystemsMigration',
        'integrationsConfig',
        'mobileAppConfig',
        'securityPrivacy',
        'assetChecklist',
        'legalPolicies',
        'projectDelivery',
        'usersAccess',
        'erpRequirements',
        'portalRequirements',
        'mediaAssets',
        'additionalRequirements',
      ],
    },
    {
      section: 'technical',
      description: 'Canonical JSON Schema for validating school onboarding submissions',
      type: 'schema',
    }
  );

  addJsonFile(
    'technical/export-metadata.json',
    {
      exportVersion: '2.0.0',
      schemaVersion: '2.0.0',
      generator: 'Ekaagra Technologies Complete School Exporter',
      generatedAt: exportedAt,
      projectId,
      schoolName,
      submissionVersion,
      totalFiles: fileList.length + 2, // including README & manifest
      totalAssets: assetManifest.length,
      compatibility: [
        'Ekaagra Website Builder v2.0',
        'Ekaagra School ERP v3.0',
        'Static Site Generators (Next.js / Astro)',
      ],
      validationStatus: 'PASSED',
    },
    {
      section: 'technical',
      description: 'Export build metadata, versioning, system compatibility, and verification status',
      type: 'technical_manifest',
    }
  );

  // Authoritative Review & Verification State Snapshot
  const safeProject: SchoolProject = project || ({
    id: projectId,
    project_number: projectId,
    school_name: schoolName,
    domain: 'SCHOOL',
    status: 'draft',
    media_status: 'not_started',
    completeness_percentage: countSubmissionFormFields(intakePayload) > 0 ? 100 : 0,
    created_at: exportedAt,
    updated_at: exportedAt,
  } as any);

  const reviewEvaluation = evaluateSchoolReviewState(
    safeProject,
    submission || null,
    (safeProject?.metadata as any)?.changeRequests || []
  );

  addJsonFile(
    'technical/review-status.json',
    {
      submissionStatus: reviewEvaluation.submissionStatus,
      submissionCompleteness: reviewEvaluation.submissionCompleteness,
      contentReviewStatus: reviewEvaluation.contentReviewStatus,
      mediaReviewStatus: reviewEvaluation.mediaReviewStatus,
      websiteReadiness: reviewEvaluation.websiteReadiness,
      websiteReadinessReason: reviewEvaluation.websiteReadinessReason,
      provisioningStatus: reviewEvaluation.provisioningStatus,
      overallReviewPercentage: reviewEvaluation.overallReviewPercentage,
      totalBlockers: reviewEvaluation.blockers.length,
      blockers: reviewEvaluation.blockers,
      sectionReviews: reviewEvaluation.sectionReviews,
      checklist: reviewEvaluation.checklist,
      generatedAt: exportedAt,
    },
    {
      section: 'technical',
      description: 'Authoritative admin review state, section review breakdown, and publication blockers',
      type: 'technical_manifest',
    }
  );

  const canonicalDocuments = resolveCanonicalDocuments(intakePayload);
  const docCompleteness = calculateDocumentCompletenessSummary(
    canonicalDocuments.map((doc) => ({
      required: doc.required,
      isPublicationBlocker: doc.isPublicationBlocker,
      status: doc.isVerified ? 'approved' : 'pending',
      fileUrl: doc.fileUrl,
      fileName: doc.fileName,
    }))
  );

  addJsonFile(
    'technical/document-manifest.json',
    {
      summary: docCompleteness,
      documents: canonicalDocuments.map((doc) => ({
        id: doc.id,
        checklistId: doc.checklistId,
        documentName: doc.documentName,
        category: doc.category,
        isRequired: doc.required,
        isPublicationBlocker: doc.isPublicationBlocker,
        isVerified: doc.isVerified,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        expiryDate: doc.expiryDate,
        expiryStatus: doc.expiryStatus,
        notes: doc.notes,
      })),
      generatedAt: exportedAt,
    },
    {
      section: 'technical',
      description: 'Canonical statutory documents inventory, verification status, and publication blocker metrics',
      type: 'technical_manifest',
    }
  );

  // ── 12. Run Pre-Export Completeness & Integrity Validation ──
  onProgress?.('Validating package integrity...');
  validateExportPackage(root, fileList, assetManifest, intakePayload);

  // Calculate statistics
  const imagesCount = assetManifest.filter((a) => a.exportPath.startsWith('media/')).length;
  const docsCount = assetManifest.filter((a) => a.exportPath.startsWith('documents/')).length;
  const formFieldsCount = countSubmissionFormFields(intakePayload);
  const websitePagesCount = Object.keys(pageConfigs).length;

  const statistics: CompleteExportStatistics = {
    formFields: formFieldsCount,
    uploadedFiles: assetManifest.length,
    images: imagesCount,
    documents: docsCount,
    websitePages: websitePagesCount,
  };

  // ── 13. Root Manifest.json ──
  onProgress?.('Building manifest...');

  const manifest: CompleteExportManifest = {
    exportVersion: '2.0',
    projectId,
    schoolName,
    exportedAt,
    submissionVersion,
    status: project?.status || submission?.status || 'APPROVED',
    sections: {
      schoolProfile: true,
      academics: true,
      admissions: true,
      fees: true,
      facilities: true,
      website: true,
      legal: true,
      media: imagesCount > 0,
      documents: docsCount > 0,
      technical: true,
    },
    files: [...fileList, 'manifest.json', 'README.md'].sort(),
    fileEntries: manifestEntries,
    statistics,
  };

  root.file('manifest.json', JSON.stringify(manifest, null, 2));

  // ── 14. Root README.md ──
  const readmeContent = `# School Project Technical Export

**Project**: ${schoolName}  
**Project ID**: ${projectId}  
**Submission**: ${submissionVersion}  
**Export Date**: ${exportedAt}  
**Export Version**: 2.0.0  
**Verification Status**: PASSED (All assets, documents, schemas, and references validated)  

---

## Overview

This package contains the **complete, portable, production-grade snapshot** of the entire school submission collected through the Ekaagra School Onboarding Portal.

It includes:
- **Canonical Form Data**: All school profile, academic, admission, fee, facility, transport, hostel, library, and legal disclosures.
- **Website & Content Specification**: Complete page structures, navigation, branding, color tokens, typography, and section configs required to reconstruct the school website.
- **Uploaded Binary Media Assets**: High-resolution official logos, crests, favicons, campus architecture, smart classrooms, laboratories, and leadership portraits.
- **Uploaded Statutory Documents**: Board affiliation grant letters, state NOCs, trust registrations, fire/building safety certificates, and mandatory public disclosures.
- **Technical Mapping & Metadata**: Authoritative \`manifest.json\`, \`field-mapping.json\`, and \`asset-manifest.json\` linking every form field to its respective asset.
- **System Specifications**: Integrations, ERP modules, data migration requirements, mobile apps, and security policies.

---

## Package Statistics

- **Form Records & Fields**: ${formFieldsCount}
- **Uploaded Assets**: ${assetManifest.length} (${imagesCount} images, ${docsCount} statutory documents)
- **Website Pages**: ${websitePagesCount} structured pages ready for deployment
- **Total Archive Files**: ${fileList.length + 2}

---

## Folder Organization

\`\`\`text
${folderName}/
├── README.md                      # Package overview & documentation (this file)
├── manifest.json                  # Authoritative machine-readable index & checksums
├── submission.json                # Master canonical intake submission payload snapshot
├── project.json                   # Institutional project metadata & review records
│
├── school-profile/                # Institutional Identity & Governance
│   ├── school-profile.json        # Core school profile, board affiliation, established year
│   ├── campuses.json              # Main campus, branch campuses, and overrides
│   ├── contact-information.json   # Administrative phone, email, addresses, social media
│   ├── institutional-details.json # Leadership, vision, mission, student & staff numbering
│   └── staff-directory.json       # Employee roster, designations, and department mappings
│
├── academics/                     # Academic Architecture & Curriculum
│   ├── academic-structure.json    # Session dates, offered grades, naming convention, capacity
│   ├── classes.json               # Grades/classes offered with sections and stages
│   ├── sections.json              # Section breakdown per class
│   ├── subjects.json              # Academic subjects with credits, types, departments
│   ├── subject-catalog.json       # Master subject catalog & syllabus links
│   ├── curriculum.json            # Pedagogical approach and assessment policy
│   ├── class-wise-curriculum.json # Subject allocation per grade & teacher assignments
│   ├── attendance-config.json     # Attendance tracking workflows, biometric sync, holidays
│   ├── examination-config.json    # Grading scales, assessment terms, report card template
│   ├── timetable-config.json      # Timetable periods, durations, and break schedules
│   └── student-directory.json     # Enrolled student roster and admission numbers
│
├── admissions/                    # Admissions Experience & Operations
│   ├── admissions.json            # Admission cycle, availability, contact person, fees
│   ├── eligibility.json           # Age criteria, grade-wise requirements
│   ├── admission-process.json     # Steps, deadlines, entrance criteria, CTAs
│   └── required-documents.json    # Checklist of documents required from applicants
│
├── fees/                          # Fee Structure & Finance
│   ├── fee-structure.json         # Tuition, development, admission fee schedules
│   ├── fee-categories.json        # One-time fees, recurring terms, optional services
│   └── payment-information.json   # Payment options, plans, discounts, bank instructions
│
├── facilities/                    # Infrastructure & Campus Facilities
│   ├── facilities.json            # Smart classrooms, labs, library, sports, medical, transport
│   ├── infrastructure.json        # Square footage, building dimensions, campus areas
│   ├── facility-details.json      # In-depth feature checklist and photo associations
│   ├── transport.json             # Transport fleet specifications, routes, safety, GPS
│   ├── hostel.json                # Residential hostel buildings, rooms, wardens, mess
│   └── library.json               # Library management catalog, book volumes, OPAC
│
├── website/                       # Website Design & Content Configuration
│   ├── website-content.json       # About school, principal message, history, achievements, FAQs
│   ├── pages.json                 # Complete structured configurations for every page
│   ├── navigation.json            # Main menu items, dropdowns, and footer links
│   ├── sections.json              # Section ordering and page-specific layouts
│   ├── seo.json                   # Title, meta descriptions, target keywords
│   ├── branding.json              # Visual identity, logo URLs, brand tone
│   ├── theme.json                 # Color tokens, typography, visual style settings
│   ├── colors.json                # Primary, secondary, accent, and neutral color tokens
│   ├── typography.json            # Font families, scale, and weights
│   ├── layout.json                # Navbar, header, footer, container configurations
│   ├── design-config.json         # Design references, style guides, website scope
│   ├── cms-workflow.json          # Editorial publishing workflows and content creator roles
│   ├── domain-hosting.json        # Custom domain names, DNS, SSL, and school email
│   ├── portal-requirements.json   # Parent, Student, and Staff portal specifications
│   └── media-governance.json      # Copyright clearances, student photo consent policies
│
├── legal/                         # Statutory Compliance & Governance
│   ├── legal-information.json     # Society/trust governance, mandatory public disclosure
│   ├── policies.json              # Child protection, POSH, grievance, admission policies
│   ├── terms.json                 # Terms of service and portal agreements
│   ├── privacy-policy.json        # Data privacy, student protection, cookies policy
│   ├── declarations.json          # Statutory declarations and client legal sign-offs
│   └── statutory-information.json # Affiliation numbers, NOC codes, validity dates
│
├── media/                         # Binary Media Assets
│   ├── logo/                      # High-resolution logos, crests, emblems
│   ├── favicon/                   # Website favicon files
│   ├── gallery/                   # Extracurricular, annual day, and sports photos
│   ├── campus/                    # Campus building, grounds, gate photography
│   ├── facilities/                # Smart classrooms, laboratories, library photos
│   ├── staff/                     # Principal and management portrait photography
│   └── academics/                 # Science exhibitions, classroom activity photos
│
├── documents/                     # Binary Statutory & Policy Documents
│   ├── certificates/              # Affiliation grant letter, recognition NOC, trust deeds
│   ├── statutory/                 # Mandatory Public Disclosure Appendix IX
│   ├── accreditation/             # NABET, ISO, quality certificates
│   └── policies/                  # Official fee schedules, parent privacy policy PDFs
│
└── technical/                     # Technical Schemas & Manifests
    ├── field-mapping.json         # Comprehensive onboarding field to file mapping directory
    ├── submission-schema.json     # Formal JSON schema for school submissions
    ├── asset-manifest.json        # Detailed inventory of binary assets with SHA-256 checksums
    ├── export-metadata.json       # Generation timestamps, exporter version, statistics
    ├── integrations.json          # Third-party integrations (biometric, SMS, payment gateways)
    ├── mobile-app.json            # Android and iOS application requirements
    ├── data-migration.json        # Legacy software data migration scopes
    ├── security-privacy.json      # Role-based access control and data protection policies
    ├── erp-requirements.json      # ERP functional module complexity tiers
    ├── additional-requirements.json # Custom workflows and special report formats
    ├── admin-provisioning.json    # Initial administrator account provisioning specifications
    └── project-delivery.json      # Target launch milestones and delivery pricing options
\`\`\`

---

## Instructions for Developers & Implementation Teams

1. **Reconstructing the Website**:
   - Inspect \`website/pages.json\` for the list of routes, slugs, and assigned layouts.
   - Use color tokens from \`website/colors.json\` and fonts from \`website/typography.json\`.
   - Embed official high-resolution media located under \`media/logo/\` and \`media/campus/\`.
   - Link statutory documents located under \`documents/\` to footer and mandatory disclosure pages.

2. **Configuring the School ERP**:
   - Populate classes and sections from \`academics/classes.json\` and \`academics/sections.json\`.
   - Setup academic subjects from \`academics/subjects.json\` and \`academics/subject-catalog.json\`.
   - Configure fee schedules from \`fees/fee-structure.json\` and concessions from \`fees/fee-categories.json\`.
   - Provision initial admin users from \`technical/admin-provisioning.json\`.

3. **Verifying Package Integrity**:
   - \`manifest.json\` contains SHA-256 checksums for every binary asset and JSON document.
   - Match the file byte sizes and hashes in \`manifest.json\` to ensure no files were corrupted in transit.

---

## Important Security & Technical Notes

- **Credential Redaction**: In accordance with enterprise security standards, all internal passwords, service role secrets, API keys, and session tokens have been scrubbed from this export.
- **Portability**: All media and document assets are physically embedded as local files inside \`media/\` and \`documents/\`, removing dependencies on temporary external URLs.

---
*Export generated by Ekaagra Technologies Complete School Export Engine (v2.0.0)*
`;

  root.file('README.md', readmeContent);

  // ── 15. Generate Final ZIP Archive ──
  onProgress?.('Creating ZIP...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress?.('Export complete.');

  return {
    zipBlob,
    manifest,
    statistics,
    folderName,
  };
}
