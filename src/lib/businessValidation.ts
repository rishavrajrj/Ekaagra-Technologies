import type {
  BusinessRequirementsData,
  BusinessAssetCategory,
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedPayload?: BusinessRequirementsData;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_CLEAN_REGEX = /[^0-9+]/g;

/**
 * Safely validate and sanitize a URL
 * Strips dangerous schemes like javascript:, data:, vbscript:
 */
export function sanitizeWebUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;

  // Enforce http:// or https://
  let normalized = trimmed;
  if (!/^https?:\/\//i.test(normalized)) {
    // If it looks like a domain (e.g. example.com), prepend https://
    if (/^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(normalized)) {
      normalized = `https://${normalized}`;
    } else {
      return undefined;
    }
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    if (!trimmed.endsWith('/') && parsed.pathname === '/' && !parsed.search && !parsed.hash) {
      return normalized;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/**
 * Clean string to prevent malicious injection or unreasonable length
 */
export function sanitizeText(val?: string, maxLen = 1000): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

/**
 * Authoritative Server-Side Validation for Final Business Requirements Submission
 * Never trusts frontend validation alone.
 */
export function validateBusinessRequirementsPayload(
  payload: Partial<BusinessRequirementsData>
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!payload || typeof payload !== 'object') {
    return { isValid: false, errors: { form: 'Submission payload is empty or malformed.' } };
  }

  // --- Section A: Company & Brand Profile ---
  const a = payload.section_a_profile;
  if (!a) {
    errors['section_a'] = 'Company profile section is missing.';
  } else {
    if (!a.displayName || a.displayName.trim().length < 2) {
      errors['section_a.displayName'] = 'Brand / Company Name must be at least 2 characters.';
    }
    if (!a.primaryContactName || a.primaryContactName.trim().length < 2) {
      errors['section_a.primaryContactName'] = 'Primary contact person name is required.';
    }
    if (!a.email || !EMAIL_REGEX.test(a.email.trim())) {
      errors['section_a.email'] = 'A valid contact email address is required.';
    }
    const cleanPhone = (a.phone || '').replace(PHONE_CLEAN_REGEX, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors['section_a.phone'] = 'A valid 10-digit phone number is required.';
    }
    if (!a.locations || a.locations.trim().length < 2) {
      errors['section_a.locations'] = 'Business location / city is required.';
    }
  }

  // Support either section_b_goals_audience OR legacy section_b_project_type + section_c_objectives
  const b = payload.section_b_goals_audience;
  const legacyB = payload.section_b_project_type;
  const legacyC = payload.section_c_objectives;

  const primaryType = b?.primaryType || legacyB?.primaryType;
  if (!primaryType || primaryType.trim().length === 0) {
    errors['section_b.primaryType'] = 'Primary solution type must be selected.';
  }

  const primaryGoal = b?.primaryGoal || legacyC?.primaryGoal;
  if (!primaryGoal || primaryGoal.trim().length < 5) {
    errors['section_b.primaryGoal'] = 'Primary business goal must be at least 5 characters.';
  }

  const problemToSolve = b?.problemToSolve || legacyC?.problemToSolve;
  if (!problemToSolve || problemToSolve.trim().length < 10) {
    errors['section_b.problemToSolve'] = 'Please provide a clear description of the core problem to solve (at least 10 characters).';
  }

  // --- Section D: Website / Application Structure ---
  const d = payload.section_d_structure;
  const legacyE = payload.section_e_website_reqs;
  const requiredPages = d?.requiredPages || legacyE?.requiredPages || [];
  if (!Array.isArray(requiredPages) || requiredPages.length === 0) {
    errors['section_d.requiredPages'] = 'At least one required page or core section must be selected.';
  }

  // --- Section I: Budget & Timeline ---
  const i = payload.section_i_budget_timeline;
  if (!i || !i.targetBudgetRange || i.targetBudgetRange.trim().length === 0) {
    // If not provided in section_i, check if legacy form has default
    if (!i?.targetBudgetRange) {
      errors['section_i.targetBudgetRange'] = 'Target budget range is required.';
    }
  }

  // --- Section J: Agreement ---
  const j = payload.section_j_agreement;
  if (!j || !j.confirmedAccurate) {
    errors['section_j.confirmedAccurate'] = 'You must confirm that the submitted requirements are accurate to proceed.';
  }
  if (!j?.authorizedSignatoryName || j.authorizedSignatoryName.trim().length < 2) {
    errors['section_j.authorizedSignatoryName'] = 'Authorized representative name is required.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
  };
}

/**
 * File upload validation rules
 */
export const ASSET_UPLOAD_LIMITS = {
  maxSizeBytes: 15 * 1024 * 1024, // 15MB
  allowedMimeTypes: [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  allowedExtensions: [
    '.png',
    '.jpg',
    '.jpeg',
    '.webp',
    '.svg',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
  ],
};

export function validateAssetUpload(file: {
  name: string;
  size: number;
  type: string;
}): { isValid: boolean; error?: string; category: BusinessAssetCategory } {
  if (!file || !file.name) {
    return { isValid: false, error: 'No file provided.', category: 'OTHER' };
  }

  if (file.size > ASSET_UPLOAD_LIMITS.maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds the 15MB limit (Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      category: 'OTHER',
    };
  }

  const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
  if (!ASSET_UPLOAD_LIMITS.allowedExtensions.includes(ext)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed formats: Images (PNG, JPG, WEBP, SVG), PDFs, Word Documents, Excel sheets, and Text.`,
      category: 'OTHER',
    };
  }

  // Deduce default category if unspecified
  let cat: BusinessAssetCategory = 'DOCUMENT';
  const lowerName = file.name.toLowerCase();
  if (lowerName.includes('logo')) {
    cat = 'LOGO';
  } else if (lowerName.includes('guideline') || lowerName.includes('brand')) {
    cat = 'BRAND_GUIDELINE';
  } else if (lowerName.includes('screen') || lowerName.includes('mockup')) {
    cat = 'SCREENSHOT';
  } else if (lowerName.includes('catalogue') || lowerName.includes('catalog')) {
    cat = 'CATALOGUE';
  } else if (['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) {
    cat = 'IMAGE';
  }

  return { isValid: true, category: cat };
}

/**
 * Sanitize filename to prevent directory traversal and special character injection
 */
export function sanitizeFileName(originalName: string): string {
  // Extract basename to eliminate directory traversal sequences
  const basename = originalName.split(/[\\\/]/).pop() || 'asset';
  // Remove consecutive dots that could simulate traversal or hidden extensions
  const cleanDots = basename.replace(/\.{2,}/g, '.');
  const baseName = cleanDots.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomSuffix}_${baseName}`;
}
