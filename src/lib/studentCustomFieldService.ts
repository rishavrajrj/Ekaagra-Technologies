import {
  StudentCustomFieldDefinition,
  StudentCustomFieldType,
  Student,
} from './types';
import {
  STUDENT_FIELD_DEFINITIONS,
  RESERVED_SYSTEM_FIELD_KEYS,
  generateCustomFieldKey,
  buildCustomFieldAliases,
} from './studentFieldDefinitions';
import { isValidEmail, isValidPhoneNumber, parseAndValidateDate } from './studentValidationService';

export interface FieldValidationResult {
  valid: boolean;
  error?: string;
}

export interface ValueValidationResult {
  isValid: boolean;
  error?: string;
  formattedValue?: any;
}

/**
 * Validates a proposed custom field name for uniqueness and system key safety.
 */
export function validateCustomFieldName(
  fieldName: string,
  existingFields: StudentCustomFieldDefinition[] = []
): FieldValidationResult {
  const trimmed = (fieldName || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Field name is required.' };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: 'Field name must be at least 2 characters.' };
  }

  if (trimmed.length > 60) {
    return { valid: false, error: 'Field name cannot exceed 60 characters.' };
  }

  const normalizedInput = trimmed.toLowerCase();

  // 1. Check against reserved system field names and keys
  const systemConflict = STUDENT_FIELD_DEFINITIONS.find(
    (def) =>
      def.label.toLowerCase() === normalizedInput ||
      def.key.toLowerCase() === normalizedInput ||
      def.aliases.some((alias) => alias.toLowerCase() === normalizedInput)
  );

  if (systemConflict) {
    return {
      valid: false,
      error: `This field name conflicts with system field "${systemConflict.label}". Please choose a distinctive name.`,
    };
  }

  // 2. Check against existing custom field names
  const existingConflict = existingFields.find(
    (cf) => cf.field_name.trim().toLowerCase() === normalizedInput
  );

  if (existingConflict) {
    return {
      valid: false,
      error: `A custom field named "${existingConflict.field_name}" already exists for this school.`,
    };
  }

  return { valid: true };
}

/**
 * Checks whether any student in the dataset already has data recorded for this custom field.
 */
export function customFieldHasData(fieldKey: string, students: Student[] = []): boolean {
  if (!fieldKey || students.length === 0) return false;

  for (const st of students) {
    const val =
      st.custom_fields?.[fieldKey] ??
      (st.metadata as any)?.custom_fields?.[fieldKey] ??
      (st as any)[fieldKey];

    if (val !== undefined && val !== null && String(val).trim().length > 0) {
      return true;
    }
  }
  return false;
}

/**
 * Validates whether a custom field can be safely deleted or if historical data requires deactivation.
 */
export function canDeleteCustomField(
  fieldKey: string,
  students: Student[] = []
): { canDelete: boolean; message?: string } {
  if (customFieldHasData(fieldKey, students)) {
    return {
      canDelete: false,
      message: 'This custom field already contains student data and cannot be deleted. You can deactivate it instead to preserve historical records.',
    };
  }
  return { canDelete: true };
}

/**
 * Prevents dangerous type changes when a custom field already contains saved student data.
 */
export function canChangeCustomFieldType(
  fieldKey: string,
  oldType: StudentCustomFieldType,
  newType: StudentCustomFieldType,
  students: Student[] = []
): { canChange: boolean; message?: string } {
  if (oldType === newType) return { canChange: true };

  if (customFieldHasData(fieldKey, students)) {
    return {
      canChange: false,
      message: 'This field already contains student data, so its field type cannot be changed. Create a new custom field if a different type is required.',
    };
  }

  return { canChange: true };
}

/**
 * Validates a single cell or input value against the custom field definition rules.
 */
export function validateCustomFieldValue(
  def: StudentCustomFieldDefinition,
  rawVal: any
): ValueValidationResult {
  const isPresent = rawVal !== undefined && rawVal !== null && String(rawVal).trim().length > 0;
  const strVal = isPresent ? String(rawVal).trim() : '';

  // Required check
  if (def.is_required && !isPresent) {
    return {
      isValid: false,
      error: `Missing required field: ${def.field_name}`,
    };
  }

  if (!isPresent) {
    return { isValid: true, formattedValue: '' };
  }

  // Type-specific checks
  switch (def.field_type) {
    case 'number': {
      const num = Number(strVal);
      if (isNaN(num)) {
        return { isValid: false, error: `Invalid number for "${def.field_name}". Expected numeric value.` };
      }
      if (def.validation_rules?.min_value !== undefined && num < def.validation_rules.min_value) {
        return { isValid: false, error: `Value must be at least ${def.validation_rules.min_value}.` };
      }
      if (def.validation_rules?.max_value !== undefined && num > def.validation_rules.max_value) {
        return { isValid: false, error: `Value cannot exceed ${def.validation_rules.max_value}.` };
      }
      return { isValid: true, formattedValue: num };
    }

    case 'email': {
      if (!isValidEmail(strVal)) {
        return { isValid: false, error: `Invalid email address format for "${def.field_name}".` };
      }
      return { isValid: true, formattedValue: strVal.toLowerCase() };
    }

    case 'phone': {
      if (!isValidPhoneNumber(strVal)) {
        return { isValid: false, error: `Invalid phone number for "${def.field_name}". Expected 10-digit mobile number.` };
      }
      return { isValid: true, formattedValue: strVal.replace(/\D/g, '') };
    }

    case 'date': {
      const dateCheck = parseAndValidateDate(strVal);
      if (!dateCheck.isValid) {
        return { isValid: false, error: `Invalid date format for "${def.field_name}". Use DD/MM/YYYY.` };
      }
      return { isValid: true, formattedValue: dateCheck.isoDate };
    }

    case 'dropdown': {
      const allowed = def.options || [];
      if (allowed.length > 0) {
        const match = allowed.find((opt) => opt.trim().toLowerCase() === strVal.toLowerCase());
        if (!match) {
          return {
            isValid: false,
            error: `Invalid value for "${def.field_name}". Expected one of: ${allowed.join(', ')}.`,
          };
        }
        return { isValid: true, formattedValue: match };
      }
      return { isValid: true, formattedValue: strVal };
    }

    case 'multi_select': {
      const allowed = (def.options || []).map((o) => o.trim().toLowerCase());
      const selections = strVal.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
      for (const sel of selections) {
        if (allowed.length > 0 && !allowed.includes(sel.toLowerCase())) {
          return {
            isValid: false,
            error: `Invalid option "${sel}" for "${def.field_name}". Allowed: ${(def.options || []).join(', ')}.`,
          };
        }
      }
      return { isValid: true, formattedValue: selections.join(', ') };
    }

    case 'yes_no': {
      const lower = strVal.toLowerCase();
      if (['yes', 'true', '1', 'y'].includes(lower)) {
        return { isValid: true, formattedValue: 'Yes' };
      }
      if (['no', 'false', '0', 'n'].includes(lower)) {
        return { isValid: true, formattedValue: 'No' };
      }
      return { isValid: false, error: `Value for "${def.field_name}" must be Yes or No.` };
    }

    case 'url': {
      try {
        const parsed = new URL(strVal.startsWith('http') ? strVal : `https://${strVal}`);
        return { isValid: true, formattedValue: parsed.toString() };
      } catch {
        return { isValid: false, error: `Invalid website URL format for "${def.field_name}".` };
      }
    }

    case 'text':
    case 'long_text':
    default: {
      if (def.validation_rules?.min_length !== undefined && strVal.length < def.validation_rules.min_length) {
        return { isValid: false, error: `Must be at least ${def.validation_rules.min_length} characters.` };
      }
      if (def.validation_rules?.max_length !== undefined && strVal.length > def.validation_rules.max_length) {
        return { isValid: false, error: `Cannot exceed ${def.validation_rules.max_length} characters.` };
      }
      if (def.validation_rules?.pattern) {
        try {
          const regex = new RegExp(def.validation_rules.pattern);
          if (!regex.test(strVal)) {
            return { isValid: false, error: `Value does not match the required format for "${def.field_name}".` };
          }
        } catch {
          // Ignore broken user regex safely
        }
      }
      return { isValid: true, formattedValue: strVal };
    }
  }
}
