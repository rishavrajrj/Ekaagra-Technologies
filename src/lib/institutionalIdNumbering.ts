/**
 * Institutional ID Numbering Format Central Registry & Utilities
 *
 * Provides a unified institutional ID numbering configuration across all school roles:
 * - Student
 * - Faculty
 * - Employee / Staff
 * - Administrator
 *
 * The system centrally controls entity prefixes, while the school administrator
 * chooses a single numbering style or defines a safe custom pattern.
 */

export type InstitutionalRoleType = 'student' | 'faculty' | 'employee' | 'staff' | 'administrator';

export type PrefixStyle = 'single' | 'short' | 'long';

export type InstitutionalIdPresetId =
  | 'NUMBER_5'
  | 'YY_NUMBER_5'
  | 'YY_NUMBER_5_HYPHEN'
  | 'YEAR_NUMBER_5'
  | 'YEAR_NUMBER_5_HYPHEN'
  | 'STD_YEAR_ROLL'
  | 'SHORT_PREFIX_YEAR_NUMBER';

export interface InstitutionalIdNumberingConfig {
  mode: 'PRESET' | 'CUSTOM';
  presetId?: InstitutionalIdPresetId | string;
  customPattern?: string;
}

export interface PredefinedIdFormat {
  id: InstitutionalIdPresetId;
  label: string;
  pattern: string;
  description: string;
  prefixStyle: PrefixStyle;
  example: string;
}

/**
 * System-controlled canonical role/entity prefix registry.
 * The administrator cannot manually edit prefixes here — prefixes are governed by the system.
 */
export const ROLE_PREFIX_REGISTRY: Record<PrefixStyle, Record<InstitutionalRoleType, string>> = {
  single: {
    student: 'S',
    faculty: 'F',
    employee: 'E',
    staff: 'T',
    administrator: 'A',
  },
  short: {
    student: 'SA',
    faculty: 'FA',
    employee: 'EA',
    staff: 'TA',
    administrator: 'AA',
  },
  long: {
    student: 'STD',
    faculty: 'FAC',
    employee: 'EMP',
    staff: 'STF',
    administrator: 'ADM',
  },
};

/**
 * Default preset id for newly onboarded schools.
 */
export const DEFAULT_ID_PRESET_ID: InstitutionalIdPresetId = 'YY_NUMBER_5';

/**
 * Maximum capacity for a 5-digit sequence (00001 - 99999).
 */
export const MAX_FIVE_DIGIT_SEQUENCE = 99999;
export const CAPACITY_ERROR_MESSAGE = 'ID sequence capacity reached for this format.';

/**
 * Centralized registry of predefined ID formats.
 */
export const PREDEFINED_ID_FORMATS: PredefinedIdFormat[] = [
  {
    id: 'NUMBER_5',
    label: '5 Digit Number',
    pattern: '{{PREFIX}}{{NUMBER}}',
    description: 'Minimal numeric style with 5-digit zero-padded sequence.',
    prefixStyle: 'single',
    example: 'S00001',
  },
  {
    id: 'YY_NUMBER_5',
    label: 'YY + 5 Digit',
    pattern: '{{PREFIX}}{{YY}}{{NUMBER}}',
    description: 'Compact 2-digit session year followed by 5-digit sequence.',
    prefixStyle: 'single',
    example: 'S2600001',
  },
  {
    id: 'YY_NUMBER_5_HYPHEN',
    label: 'YY - 5 Digit',
    pattern: '{{PREFIX}}{{YY}}-{{NUMBER}}',
    description: '2-digit session year separated by hyphen from 5-digit sequence.',
    prefixStyle: 'single',
    example: 'S26-00001',
  },
  {
    id: 'YEAR_NUMBER_5',
    label: 'Full Year + 5 Digit',
    pattern: '{{PREFIX}}{{YEAR}}{{NUMBER}}',
    description: 'Full 4-digit academic year followed by 5-digit sequence.',
    prefixStyle: 'single',
    example: 'S202600001',
  },
  {
    id: 'YEAR_NUMBER_5_HYPHEN',
    label: 'Full Year - 5 Digit',
    pattern: '{{PREFIX}}{{YEAR}}-{{NUMBER}}',
    description: 'Full 4-digit academic year separated by hyphen from 5-digit sequence.',
    prefixStyle: 'single',
    example: 'S2026-00001',
  },
  {
    id: 'STD_YEAR_ROLL',
    label: 'STD-YYYY-Number',
    pattern: '{{PREFIX}}-{{YEAR}}-{{NUMBER}}',
    description: 'Classic institutional style with 3-letter role prefix (e.g. STD, FAC, EMP, ADM).',
    prefixStyle: 'long',
    example: 'STD-2026-00001',
  },
  {
    id: 'SHORT_PREFIX_YEAR_NUMBER',
    label: 'Short Prefix + Year + Number',
    pattern: '{{SHORT_PREFIX}}-{{YEAR}}-{{NUMBER}}',
    description: '2-letter role prefix with full year and 5-digit sequence (e.g. SA, FA, EA, AA).',
    prefixStyle: 'short',
    example: 'SA-2026-00001',
  },
];

/**
 * Supported placeholders for custom formats.
 */
export const SUPPORTED_PLACEHOLDERS = [
  '{{PREFIX}}',
  '{{YY}}',
  '{{YEAR}}',
  '{{NUMBER}}',
  '{{ROLL}}',
] as const;

/**
 * Extract canonical academic year or fall back safely.
 */
export function resolveAcademicYear(sessionOrYear?: string | number | null): number {
  if (typeof sessionOrYear === 'number' && sessionOrYear >= 2000 && sessionOrYear <= 2100) {
    return sessionOrYear;
  }
  if (typeof sessionOrYear === 'string') {
    const match = sessionOrYear.match(/20\d{2}/);
    if (match) {
      const parsed = parseInt(match[0], 10);
      if (parsed >= 2000 && parsed <= 2100) return parsed;
    }
  }
  return new Date().getFullYear();
}

/**
 * Format a 5-digit sequence number with controlled capacity bounds.
 */
export function formatSequenceNumber(sequence: number): string {
  if (sequence < 1) sequence = 1;
  if (sequence > MAX_FIVE_DIGIT_SEQUENCE) {
    throw new Error(CAPACITY_ERROR_MESSAGE);
  }
  return String(sequence).padStart(5, '0');
}

/**
 * Validation result for custom ID format patterns.
 */
export interface CustomPatternValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a custom ID format pattern strictly according to institutional safety rules:
 * - Reject empty or whitespace-only
 * - Reject unsupported placeholders
 * - Require a sequence placeholder ({{NUMBER}} or supported alias {{ROLL}} / {{NUM}})
 * - Reject duplicate sequence tokens
 * - Reject conflicting year placeholders (both {{YEAR}} and {{YY}})
 * - Reject invalid or dangerous characters
 */
export function validateCustomIdPattern(pattern: string): CustomPatternValidationResult {
  if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
    return { isValid: false, error: 'Custom format cannot be empty.' };
  }

  const trimmed = pattern.trim();

  // Check for unmatched or malformed curly braces
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  if (openBraces !== closeBraces || openBraces % 2 !== 0) {
    return { isValid: false, error: 'Malformed placeholders: check for missing or unmatched curly braces.' };
  }

  // Find all placeholders {{...}}
  const matches = trimmed.match(/{{[^{}]+}}/g);
  if (!matches || matches.length === 0) {
    return { isValid: false, error: 'Custom format must contain supported placeholders such as {{PREFIX}} and {{NUMBER}}.' };
  }
  const placeholders: string[] = Array.from(matches);

  // Verify each placeholder is allowed
  const allowedPlaceholders = new Set<string>([
    '{{PREFIX}}',
    '{{SHORT_PREFIX}}',
    '{{LONG_PREFIX}}',
    '{{YY}}',
    '{{YEAR}}',
    '{{NUMBER}}',
    '{{ROLL}}',
    '{{NUM}}',
  ]);

  for (const ph of placeholders) {
    if (!allowedPlaceholders.has(ph)) {
      return {
        isValid: false,
        error: `Unsupported placeholder "${ph}". Only {{PREFIX}}, {{YY}}, {{YEAR}}, and {{NUMBER}} are allowed.`,
      };
    }
  }

  // Check for sequence placeholder
  const sequenceTokens = placeholders.filter((p) => p === '{{NUMBER}}' || p === '{{ROLL}}' || p === '{{NUM}}');
  if (sequenceTokens.length === 0) {
    return {
      isValid: false,
      error: 'Custom format must contain a sequence component ({{NUMBER}}).',
    };
  }
  if (sequenceTokens.length > 1) {
    return {
      isValid: false,
      error: 'Custom format cannot contain multiple sequence tokens.',
    };
  }

  // Check for conflicting year tokens
  const hasYY = placeholders.some((p) => p === '{{YY}}');
  const hasYEAR = placeholders.some((p) => p === '{{YEAR}}');
  if (hasYY && hasYEAR) {
    return {
      isValid: false,
      error: 'Conflicting year placeholders: use either {{YY}} or {{YEAR}}, not both.',
    };
  }

  // Check for duplicate prefix tokens
  const prefixTokens = placeholders.filter((p) => p === '{{PREFIX}}' || p === '{{SHORT_PREFIX}}' || p === '{{LONG_PREFIX}}');
  if (prefixTokens.length > 1) {
    return {
      isValid: false,
      error: 'Custom format cannot contain multiple prefix tokens.',
    };
  }

  // Reject unsafe characters outside placeholders (allow alphanumeric, hyphens, underscores, slashes, periods)
  let stripped = trimmed;
  for (const ph of placeholders) {
    stripped = stripped.split(ph).join('');
  }
  if (!/^[a-zA-Z0-9_\-/. ]*$/.test(stripped)) {
    return {
      isValid: false,
      error: 'Invalid characters in format. Only letters, digits, hyphens (-), underscores (_), slashes (/), and dots (.) are allowed.',
    };
  }

  return { isValid: true };
}

/**
 * Format an institutional ID for a specific role and sequence number.
 */
export function formatInstitutionalId(params: {
  pattern: string;
  role: InstitutionalRoleType;
  sequence: number;
  year?: number;
  prefixStyle?: PrefixStyle;
}): string {
  const { pattern, role, sequence, year = new Date().getFullYear(), prefixStyle = 'single' } = params;

  const paddedSequence = formatSequenceNumber(sequence);
  const fullYearStr = String(year);
  const shortYearStr = fullYearStr.slice(-2);

  const singlePrefix = ROLE_PREFIX_REGISTRY.single[role] || 'S';
  const shortPrefix = ROLE_PREFIX_REGISTRY.short[role] || 'SA';
  const longPrefix = ROLE_PREFIX_REGISTRY.long[role] || 'STD';

  const defaultRolePrefix =
    prefixStyle === 'long'
      ? longPrefix
      : prefixStyle === 'short'
      ? shortPrefix
      : singlePrefix;

  let result = pattern
    .replace(/{{PREFIX}}/g, defaultRolePrefix)
    .replace(/{{SHORT_PREFIX}}/g, shortPrefix)
    .replace(/{{LONG_PREFIX}}/g, longPrefix)
    .replace(/{{YEAR}}/g, fullYearStr)
    .replace(/{{YY}}/g, shortYearStr)
    .replace(/{{NUMBER}}/g, paddedSequence)
    .replace(/{{ROLL}}/g, paddedSequence) // Permanent institutional sequence alias
    .replace(/{{NUM}}/g, paddedSequence);

  // If pattern used static role prefixes from legacy presets (e.g. STD-, EMP-, FAC-, ADM-)
  if (pattern.startsWith('STD-') || pattern.startsWith('FAC-') || pattern.startsWith('EMP-') || pattern.startsWith('ADM-')) {
    result = result.replace(/^(STD|FAC|EMP|ADM)-/, `${longPrefix}-`);
  }

  return result;
}

/**
 * Generate preview IDs for all standard institutional person types:
 * Student, Faculty, Employee, Administrator (and Staff).
 */
export function generateInstitutionalIdPreview(
  config: InstitutionalIdNumberingConfig,
  year?: number
): Record<InstitutionalRoleType, string> {
  const currentYear = resolveAcademicYear(year);

  let pattern = '{{PREFIX}}{{YY}}{{NUMBER}}';
  let prefixStyle: PrefixStyle = 'single';

  if (config.mode === 'CUSTOM') {
    if (config.customPattern && validateCustomIdPattern(config.customPattern).isValid) {
      pattern = config.customPattern.trim();
    } else {
      pattern = '{{PREFIX}}-{{YY}}-{{NUMBER}}';
    }
  } else {
    const preset = PREDEFINED_ID_FORMATS.find((p) => p.id === config.presetId) || PREDEFINED_ID_FORMATS[1]; // default YY_NUMBER_5
    pattern = preset.pattern;
    prefixStyle = preset.prefixStyle;
  }

  const roles: InstitutionalRoleType[] = ['student', 'faculty', 'employee', 'administrator', 'staff'];
  const preview: Record<string, string> = {};

  for (const role of roles) {
    try {
      preview[role] = formatInstitutionalId({
        pattern,
        role,
        sequence: 1,
        year: currentYear,
        prefixStyle,
      });
    } catch {
      preview[role] = 'CAPACITY_REACHED';
    }
  }

  return preview as Record<InstitutionalRoleType, string>;
}

/**
 * Derive the specific format pattern for a given role (e.g. for legacy staffIdFormat or studentIdFormat).
 */
export function deriveEntityFormatPattern(
  config: InstitutionalIdNumberingConfig,
  role: InstitutionalRoleType
): string {
  if (config.mode === 'CUSTOM') {
    const pattern = config.customPattern || '{{PREFIX}}-{{YY}}-{{NUMBER}}';
    const singlePrefix = ROLE_PREFIX_REGISTRY.single[role];
    return pattern
      .replace(/{{PREFIX}}/g, singlePrefix)
      .replace(/{{SHORT_PREFIX}}/g, ROLE_PREFIX_REGISTRY.short[role])
      .replace(/{{LONG_PREFIX}}/g, ROLE_PREFIX_REGISTRY.long[role]);
  }

  const preset = PREDEFINED_ID_FORMATS.find((p) => p.id === config.presetId) || PREDEFINED_ID_FORMATS[1];
  const rolePrefix = ROLE_PREFIX_REGISTRY[preset.prefixStyle][role];

  return preset.pattern
    .replace(/{{PREFIX}}/g, rolePrefix)
    .replace(/{{SHORT_PREFIX}}/g, ROLE_PREFIX_REGISTRY.short[role])
    .replace(/{{LONG_PREFIX}}/g, ROLE_PREFIX_REGISTRY.long[role]);
}

/**
 * Safely normalize an existing or legacy configuration into the unified structure.
 * Never destroys existing settings; preserves existing configurations while providing
 * the new unified dropdown experience.
 */
export function normalizeInstitutionalIdConfig(
  existingConfig?: Partial<InstitutionalIdNumberingConfig> | null,
  legacyStaffFormat?: string | null
): InstitutionalIdNumberingConfig {
  if (existingConfig && existingConfig.mode) {
    if (existingConfig.mode === 'CUSTOM') {
      return {
        mode: 'CUSTOM',
        customPattern: existingConfig.customPattern || '{{PREFIX}}-{{YY}}-{{NUMBER}}',
      };
    }
    if (existingConfig.mode === 'PRESET' && existingConfig.presetId) {
      const match = PREDEFINED_ID_FORMATS.find((p) => p.id === existingConfig.presetId);
      if (match) {
        return {
          mode: 'PRESET',
          presetId: match.id,
        };
      }
    }
  }

  // If there is a legacy staffIdFormat saved in intake
  if (legacyStaffFormat && typeof legacyStaffFormat === 'string' && legacyStaffFormat.trim().length > 0) {
    const trimmed = legacyStaffFormat.trim();

    // Check if it matches any predefined preset pattern
    if (trimmed === 'EMP-{{YEAR}}-{{NUM}}' || trimmed === 'STD-{{YEAR}}-{{ROLL}}' || trimmed === '{{PREFIX}}-{{YEAR}}-{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'STD_YEAR_ROLL' };
    }
    if (trimmed === '{{PREFIX}}{{YY}}{{NUMBER}}' || trimmed === 'S{{YY}}{{NUMBER}}' || trimmed === 'F{{YY}}{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'YY_NUMBER_5' };
    }
    if (trimmed === '{{PREFIX}}{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'NUMBER_5' };
    }
    if (trimmed === '{{PREFIX}}{{YY}}-{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'YY_NUMBER_5_HYPHEN' };
    }
    if (trimmed === '{{PREFIX}}{{YEAR}}{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'YEAR_NUMBER_5' };
    }
    if (trimmed === '{{PREFIX}}{{YEAR}}-{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'YEAR_NUMBER_5_HYPHEN' };
    }
    if (trimmed === '{{SHORT_PREFIX}}-{{YEAR}}-{{NUMBER}}') {
      return { mode: 'PRESET', presetId: 'SHORT_PREFIX_YEAR_NUMBER' };
    }

    // Otherwise, treat as custom format if it has placeholders
    if (trimmed.includes('{{')) {
      const normalizedPattern = trimmed
        .replace(/EMP-|FAC-|STD-|ADM-/g, '{{PREFIX}}-')
        .replace(/{{NUM}}/g, '{{NUMBER}}');

      return {
        mode: 'CUSTOM',
        customPattern: normalizedPattern,
      };
    }
  }

  // Default for new schools: YY + 5 Digit
  return {
    mode: 'PRESET',
    presetId: DEFAULT_ID_PRESET_ID,
  };
}
