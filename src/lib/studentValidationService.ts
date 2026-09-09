import * as XLSX from 'xlsx';
import {
  STUDENT_FIELD_DEFINITIONS,
  getStudentFieldDefinition,
  getStudentFieldDefinitions,
  StudentFieldDefinition,
} from './studentFieldDefinitions';
import type { AcademicStructureData, Student, StudentCustomFieldDefinition } from './types';
import { validateCustomFieldValue } from './studentCustomFieldService';

export interface HeaderMatchResult {
  fileHeader: string;
  matchedFieldKey?: string;
  matchedFieldLabel?: string;
  confidence: 'exact' | 'high' | 'fuzzy' | 'unmatched';
  isConfiguredField: boolean;
}

export interface CellValidationIssue {
  fieldKey: string;
  fieldLabel: string;
  value: any;
  severity: 'error' | 'warning';
  message: string;
  suggestedFix?: string;
}

export interface StudentImportRow {
  rowNumber: number;
  status: 'ready' | 'warning' | 'error';
  issues: CellValidationIssue[];
  rawValues: Record<string, any>;
  studentData: Partial<Student>;
  // Associated photo details if available
  photoFileName?: string;
  photoUrl?: string;
  isDuplicateAdmissionNo?: boolean;
}

export interface FileValidationResult {
  fileName: string;
  totalDetected: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  headerMatches: HeaderMatchResult[];
  missingRequiredFields: string[];
  unexpectedHeaders: string[];
  rows: StudentImportRow[];
}

export interface ValidationContext {
  enabledFields: string[];
  requiredFields: string[];
  academicStructure?: AcademicStructureData | null;
  existingAdmissionNumbers?: Set<string>;
  existingStudents?: Student[];
  customFields?: StudentCustomFieldDefinition[];
}

/**
 * Normalizes string for fuzzy header comparison (lowercasing, stripping special chars).
 */
function normalizeForComparison(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[★*]/g, '')
    .replace(/['’._\-\/\\()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligently matches incoming file headers against configured field definitions.
 * Employs tiered matching: exact -> alias -> contextual constrained fuzzy.
 * Prevents multiple headers from claiming the same field key and avoids family/role misattributions.
 */
export function matchHeadersWithFields(
  fileHeaders: string[],
  enabledFields: string[],
  customFields?: StudentCustomFieldDefinition[]
): HeaderMatchResult[] {
  const allDefs = getStudentFieldDefinitions(customFields);
  const enabledSet = new Set(enabledFields);
  const claimedKeys = new Set<string>();

  // Helper to test if a candidate definition is contextually compatible with the header
  const isContextuallyCompatible = (norm: string, defKey: string): boolean => {
    // 1. Family / Guardian isolation
    if (norm.includes('mother') || norm.includes('mom') || norm.includes('matru')) {
      return defKey.includes('mother');
    }
    if (norm.includes('father') || norm.includes('dad') || norm.includes('patru')) {
      return defKey.includes('father');
    }
    if (norm.includes('guardian') || norm.includes('local guardian')) {
      return defKey.includes('guardian');
    }
    if (norm.includes('emergency')) {
      return defKey.includes('emergency');
    }

    // 2. Previous school/class vs current
    if (norm.includes('previous') || norm.includes('prev') || norm.includes('last school')) {
      return defKey.startsWith('previous_');
    }
    if (defKey.startsWith('previous_') && !norm.includes('previous') && !norm.includes('prev')) {
      return false;
    }

    // 3. Roll number vs Admission number
    if (norm.includes('roll') && !norm.includes('admission') && !norm.includes('adm')) {
      return defKey === 'roll_number';
    }
    if ((norm.includes('admission') || norm.includes('adm')) && !norm.includes('roll')) {
      return defKey === 'admission_number' || defKey === 'admission_date';
    }

    // If header has family words, do not map to generic student name
    if (
      (norm.includes('parent') || norm.includes('father') || norm.includes('mother') || norm.includes('guardian')) &&
      defKey === 'student_name'
    ) {
      return false;
    }

    return true;
  };

  const results: HeaderMatchResult[] = fileHeaders.map((header) => ({
    fileHeader: header,
    confidence: 'unmatched',
    isConfiguredField: false,
  }));

  // PASS 1: Exact label or exact key match
  fileHeaders.forEach((header, idx) => {
    const norm = normalizeForComparison(header);
    if (!norm) return;

    const exactDef = allDefs.find(
      (def) =>
        normalizeForComparison(def.label) === norm ||
        def.key.toLowerCase() === norm.replace(/\s+/g, '_') ||
        (def.isCustom && def.key.toLowerCase().replace(/^custom_/, '') === norm.replace(/\s+/g, '_'))
    );

    if (exactDef && isContextuallyCompatible(norm, exactDef.key)) {
      results[idx] = {
        fileHeader: header,
        matchedFieldKey: exactDef.key,
        matchedFieldLabel: exactDef.label,
        confidence: 'exact',
        isConfiguredField: enabledSet.has(exactDef.key),
      };
      claimedKeys.add(exactDef.key);
    }
  });

  // PASS 2: Exact alias match (unclaimed keys only)
  fileHeaders.forEach((header, idx) => {
    if (results[idx].confidence !== 'unmatched') return;
    const norm = normalizeForComparison(header);
    if (!norm) return;

    const aliasDef = allDefs.find(
      (def) =>
        !claimedKeys.has(def.key) &&
        isContextuallyCompatible(norm, def.key) &&
        def.aliases.some((alias) => normalizeForComparison(alias) === norm)
    );

    if (aliasDef) {
      results[idx] = {
        fileHeader: header,
        matchedFieldKey: aliasDef.key,
        matchedFieldLabel: aliasDef.label,
        confidence: 'high',
        isConfiguredField: enabledSet.has(aliasDef.key),
      };
      claimedKeys.add(aliasDef.key);
    }
  });

  // PASS 3: Word boundary / High-confidence fuzzy match
  fileHeaders.forEach((header, idx) => {
    if (results[idx].confidence !== 'unmatched') return;
    const norm = normalizeForComparison(header);
    if (!norm || norm.length < 3) return;

    const fuzzyDef = allDefs.find((def) => {
      if (claimedKeys.has(def.key)) return false;
      if (!isContextuallyCompatible(norm, def.key)) return false;

      const defNorm = normalizeForComparison(def.label);
      if (norm === defNorm) return true;

      // Ensure boundary matching for words
      const headerWords = norm.split(' ');
      const defWords = defNorm.split(' ');

      // Substring match only if term is non-trivial (> 3 chars)
      const hasSignificantSubstring =
        (norm.length > 4 && defNorm.includes(norm)) ||
        (defNorm.length > 4 && norm.includes(defNorm));

      const hasAliasMatch = def.aliases.some((a) => {
        const aNorm = normalizeForComparison(a);
        return aNorm.length > 3 && (norm.includes(aNorm) || aNorm.includes(norm));
      });

      // Word intersection check
      const wordOverlap = headerWords.filter((w) => w.length > 3 && defWords.includes(w));

      return hasSignificantSubstring || hasAliasMatch || wordOverlap.length > 0;
    });

    if (fuzzyDef) {
      results[idx] = {
        fileHeader: header,
        matchedFieldKey: fuzzyDef.key,
        matchedFieldLabel: fuzzyDef.label,
        confidence: 'fuzzy',
        isConfiguredField: enabledSet.has(fuzzyDef.key),
      };
      claimedKeys.add(fuzzyDef.key);
    }
  });

  return results;
}

/**
 * Validates date strings in DD/MM/YYYY or YYYY-MM-DD format, JS Date objects, and Excel serial dates.
 * Enforces real calendar day validity (e.g. rejects 31/04/2015, handles leap years).
 */
export function parseAndValidateDate(
  val: any,
  options?: { maxDate?: Date; minYear?: number; maxYear?: number }
): { isValid: boolean; isoDate?: string; formatted?: string } {
  if (val === null || val === undefined || val === '') return { isValid: false };
  const minYear = options?.minYear ?? 1990;
  const maxYear = options?.maxYear ?? 2040;

  let y = 0;
  let m = 0;
  let d = 0;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return { isValid: false };
    y = val.getFullYear();
    m = val.getMonth() + 1;
    d = val.getDate();
  } else if (typeof val === 'number' || /^\d{5}$/.test(String(val).trim())) {
    try {
      const parsed = XLSX.SSF.parse_date_code(Number(val));
      if (parsed && parsed.y && parsed.m && parsed.d) {
        y = parsed.y;
        m = parsed.m;
        d = parsed.d;
      }
    } catch {
      return { isValid: false };
    }
  } else {
    const str = String(val).trim();

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      d = parseInt(dmyMatch[1], 10);
      m = parseInt(dmyMatch[2], 10);
      y = parseInt(dmyMatch[3], 10);
    } else {
      // YYYY-MM-DD
      const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (ymdMatch) {
        y = parseInt(ymdMatch[1], 10);
        m = parseInt(ymdMatch[2], 10);
        d = parseInt(ymdMatch[3], 10);
      }
    }
  }

  if (y < minYear || y > maxYear || m < 1 || m > 12 || d < 1 || d > 31) {
    return { isValid: false };
  }

  // Exact calendar validity check (handles leap years, 30-day months, Feb 29 etc)
  const testDate = new Date(y, m - 1, d);
  if (
    testDate.getFullYear() !== y ||
    testDate.getMonth() !== m - 1 ||
    testDate.getDate() !== d
  ) {
    return { isValid: false };
  }

  if (options?.maxDate && testDate > options.maxDate) {
    return { isValid: false };
  }

  const yStr = String(y).padStart(4, '0');
  const mStr = String(m).padStart(2, '0');
  const dStr = String(d).padStart(2, '0');

  return {
    isValid: true,
    isoDate: `${yStr}-${mStr}-${dStr}`,
    formatted: `${dStr}/${mStr}/${yStr}`,
  };
}

/**
 * Validates Indian 10-digit mobile number.
 * Rejects numbers with letters, repeating placeholder digits, or invalid prefixes.
 */
export function isValidPhoneNumber(val: any): boolean {
  if (!val) return false;
  const str = String(val).trim();
  // Reject if contains alphabetical characters
  if (/[a-zA-Z]/.test(str)) return false;

  const cleaned = str.replace(/[^0-9]/g, '');
  // Reject if all repeating dummy digits like "0000000000", "9999999999", etc.
  if (/^(\d)\1{9}$/.test(cleaned)) return false;

  // 10 digits starting with 6-9, or 12 digits with 91 prefix
  if (cleaned.length === 10) return /^[6-9]\d{9}$/.test(cleaned);
  if (cleaned.length === 12 && cleaned.startsWith('91')) return /^[6-9]\d{9}$/.test(cleaned.slice(2));
  return false;
}

/**
 * Validates standard email address.
 */
export function isValidEmail(val: any): boolean {
  if (!val) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
}

/**
 * Parses uploaded Excel or CSV buffer into raw row objects and headers.
 */
export function parseUploadedFileBuffer(
  buffer: ArrayBuffer | Uint8Array,
  fileName: string
): { headers: string[]; rawRows: Record<string, any>[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Uploaded workbook contains no visible sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!aoa || aoa.length === 0) {
    throw new Error('Uploaded file is completely empty.');
  }

  // Intelligently find the actual header row by scoring candidate rows against known field definitions.
  // This ensures templates with title/banner rows (e.g. rows 1-4) or raw spreadsheets are parsed accurately.
  let bestHeaderRowIndex = -1;
  let maxMatches = -1;

  for (let r = 0; r < Math.min(aoa.length, 15); r++) {
    const candidateRow = aoa[r];
    if (!Array.isArray(candidateRow)) continue;

    let matchCount = 0;
    candidateRow.forEach((cell) => {
      const cellStr = normalizeForComparison(String(cell || ''));
      if (!cellStr) return;
      const isFieldMatch = STUDENT_FIELD_DEFINITIONS.some((def) => {
        return (
          normalizeForComparison(def.label) === cellStr ||
          def.key.toLowerCase() === cellStr.replace(/\s+/g, '_') ||
          def.aliases.some((a) => normalizeForComparison(a) === cellStr)
        );
      });
      if (isFieldMatch) matchCount++;
    });

    if (matchCount > maxMatches && matchCount >= 1) {
      maxMatches = matchCount;
      bestHeaderRowIndex = r;
    }
  }

  const headerRowIndex =
    maxMatches >= 1
      ? bestHeaderRowIndex
      : aoa.findIndex((row) => row.some((cell) => cell && String(cell).trim().length > 0));

  if (headerRowIndex === -1) {
    throw new Error('No valid header row found in uploaded file.');
  }

  const headerRow = aoa[headerRowIndex];
  const headers = headerRow.map((cell) => String(cell || '').trim()).filter(Boolean);

  const rawRows: Record<string, any>[] = [];
  for (let i = headerRowIndex + 1; i < aoa.length; i++) {
    const row = aoa[i];
    // Skip entirely empty rows
    const hasData = row.some((cell: any) => cell !== null && cell !== undefined && String(cell).trim().length > 0);
    if (!hasData) continue;

    const rowObj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      rowObj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
    });
    rawRows.push(rowObj);
  }

  return { headers, rawRows };
}

/**
 * Validates parsed student rows against configured fields and academic relationships.
 */
export function validateStudentRecords(
  rawRows: Record<string, any>[],
  headerMapping: Record<string, string>, // fileHeader -> fieldKey
  context: ValidationContext
): FileValidationResult {
  const {
    enabledFields,
    requiredFields,
    academicStructure,
    existingAdmissionNumbers = new Set<string>(),
  } = context;

  const requiredSet = new Set(requiredFields);
  const seenAdmissionNumbers = new Set<string>();

  // Extract configured classes and sections from Academic Structure
  const configuredClasses = (academicStructure?.classes || []).map((c) => ({
    rawName: c.name || c.className || '',
    normName: normalizeForComparison(c.name || c.className || ''),
    sections: (c.sections || []).map((s) => (typeof s === 'string' ? s : s.name)),
  }));

  const rows: StudentImportRow[] = [];
  let readyCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +2 considering 1-based index and header row
    const issues: CellValidationIssue[] = [];
    const mappedRow: Record<string, any> = {};

    // Map raw row values to canonical field keys
    Object.entries(headerMapping).forEach(([fileHeader, fieldKey]) => {
      if (fieldKey && rawRow[fileHeader] !== undefined) {
        mappedRow[fieldKey] = rawRow[fileHeader];
      }
    });

    const studentNameVal = String(mappedRow['student_name'] || '').trim();
    const admissionNoVal = String(mappedRow['admission_number'] || '').trim();

    // 1. Mandatory Core Field Validations
    if (!studentNameVal) {
      issues.push({
        fieldKey: 'student_name',
        fieldLabel: 'Student Name',
        value: '',
        severity: 'error',
        message: 'Student name is missing.',
        suggestedFix: 'Enter the full legal name of the student.',
      });
    }

    if (!admissionNoVal) {
      issues.push({
        fieldKey: 'admission_number',
        fieldLabel: 'Admission Number',
        value: '',
        severity: 'error',
        message: 'Admission number is missing.',
        suggestedFix: 'Provide a unique admission number (e.g. ADM-2026-0101).',
      });
    } else {
      // In-file duplicate check
      if (seenAdmissionNumbers.has(admissionNoVal.toLowerCase())) {
        issues.push({
          fieldKey: 'admission_number',
          fieldLabel: 'Admission Number',
          value: admissionNoVal,
          severity: 'error',
          message: `Duplicate admission number "${admissionNoVal}" found in this file.`,
          suggestedFix: 'Each student must have a unique admission number.',
        });
      } else {
        seenAdmissionNumbers.add(admissionNoVal.toLowerCase());
      }

      // Existing database duplicate check (Warning or Error depending on duplicate policy)
      if (existingAdmissionNumbers.has(admissionNoVal.toLowerCase())) {
        issues.push({
          fieldKey: 'admission_number',
          fieldLabel: 'Admission Number',
          value: admissionNoVal,
          severity: 'warning',
          message: `Admission number "${admissionNoVal}" already exists in the school database.`,
          suggestedFix: 'Will update existing student or skip based on duplicate handling policy.',
        });
      }
    }

    // 2. Check Other Required Fields configured by School
    enabledFields.forEach((fieldKey) => {
      if (fieldKey === 'student_name' || fieldKey === 'admission_number') return;
      const def = getStudentFieldDefinition(fieldKey, context.customFields);
      if (!def) return;

      const isRequired = requiredSet.has(fieldKey);
      const val = mappedRow[fieldKey];
      const hasValue = val !== null && val !== undefined && String(val).trim().length > 0;

      if (isRequired && !hasValue) {
        issues.push({
          fieldKey,
          fieldLabel: def.label,
          value: '',
          severity: 'error',
          message: `${def.label} is required by your school's configuration.`,
          suggestedFix: `Provide ${def.label.toLowerCase()} in format: ${def.formatInstructions}`,
        });
      }
    });

    // Custom Fields Validation and Processing
    const studentCustomFields: Record<string, any> = {};
    if (context.customFields && context.customFields.length > 0) {
      context.customFields.forEach((cf) => {
        if (!cf.is_active) return;
        const isFieldEnabled = enabledFields.includes(cf.field_key);
        if (!isFieldEnabled) return;

        const rawVal = mappedRow[cf.field_key];
        const valRes = validateCustomFieldValue(cf, rawVal);

        if (!valRes.isValid) {
          issues.push({
            fieldKey: cf.field_key,
            fieldLabel: cf.field_name,
            value: rawVal ?? '',
            severity: (cf.is_required || requiredSet.has(cf.field_key)) ? 'error' : 'warning',
            message: valRes.error || `Invalid value for "${cf.field_name}".`,
            suggestedFix: cf.placeholder || 'Provide a valid value according to the field format.',
          });
        }

        if (valRes.formattedValue !== undefined && valRes.formattedValue !== null && String(valRes.formattedValue).length > 0) {
          studentCustomFields[cf.field_key] = valRes.formattedValue;
        }
      });
    }

    // 3. Date Validations
    if (mappedRow['dob']) {
      const dateCheck = parseAndValidateDate(mappedRow['dob'], { maxDate: new Date() });
      if (!dateCheck.isValid) {
        issues.push({
          fieldKey: 'dob',
          fieldLabel: 'Date of Birth',
          value: mappedRow['dob'],
          severity: 'error',
          message: `Invalid Date of Birth "${mappedRow['dob']}" (must be a valid past calendar date).`,
          suggestedFix: 'Enter the date in DD/MM/YYYY format (e.g. 15/04/2015).',
        });
      } else {
        mappedRow['dob_formatted'] = dateCheck.isoDate;
      }
    }

    if (mappedRow['admission_date']) {
      const dateCheck = parseAndValidateDate(mappedRow['admission_date']);
      if (!dateCheck.isValid) {
        issues.push({
          fieldKey: 'admission_date',
          fieldLabel: 'Admission Date',
          value: mappedRow['admission_date'],
          severity: 'warning',
          message: `Invalid Admission Date "${mappedRow['admission_date']}".`,
          suggestedFix: 'Use DD/MM/YYYY format.',
        });
      } else {
        mappedRow['admission_date_formatted'] = dateCheck.isoDate;
      }
    }

    // 4. Phone Number Validations
    const phoneKeys = ['father_phone', 'mother_phone', 'guardian_phone', 'emergency_contact_number'];
    phoneKeys.forEach((k) => {
      const val = mappedRow[k];
      if (val && String(val).trim().length > 0) {
        if (!isValidPhoneNumber(val)) {
          const def = getStudentFieldDefinition(k);
          issues.push({
            fieldKey: k,
            fieldLabel: def?.label || k,
            value: val,
            severity: 'warning',
            message: `Phone number "${val}" does not appear to be a valid 10-digit mobile number.`,
            suggestedFix: 'Use 10 digits without prefix (e.g. 9876543210).',
          });
        }
      }
    });

    // 5. Email Validations
    const emailKeys = ['father_email', 'mother_email', 'guardian_email'];
    emailKeys.forEach((k) => {
      const val = mappedRow[k];
      if (val && String(val).trim().length > 0) {
        if (!isValidEmail(val)) {
          const def = getStudentFieldDefinition(k);
          issues.push({
            fieldKey: k,
            fieldLabel: def?.label || k,
            value: val,
            severity: 'warning',
            message: `Email "${val}" is not a valid email address.`,
            suggestedFix: 'Check for typos (e.g. name@domain.com).',
          });
        }
      }
    });

    // 6. Academic Setup Class & Section Relationship Check
    const classVal = String(mappedRow['class_grade'] || '').trim();
    const sectionVal = String(mappedRow['section'] || '').trim();

    if (classVal && configuredClasses.length > 0) {
      const normClass = normalizeForComparison(classVal);
      // Look for exact or fuzzy match
      const matchedClass = configuredClasses.find(
        (c) => c.normName === normClass || normClass.includes(c.normName) || c.normName.includes(normClass)
      );

      if (!matchedClass) {
        issues.push({
          fieldKey: 'class_grade',
          fieldLabel: 'Class / Grade',
          value: classVal,
          severity: 'error',
          message: `Class "${classVal}" does not match any class configured in Academic Setup.`,
          suggestedFix: `Select from configured classes: ${configuredClasses.map((c) => c.rawName).join(', ')}`,
        });
      } else if (sectionVal && matchedClass.sections.length > 0) {
        const normSection = sectionVal.toUpperCase();
        const hasSection = matchedClass.sections.some((s) => s.toUpperCase() === normSection);
        if (!hasSection) {
          issues.push({
            fieldKey: 'section',
            fieldLabel: 'Section',
            value: sectionVal,
            severity: 'warning',
            message: `Section "${sectionVal}" is not configured for ${matchedClass.rawName}.`,
            suggestedFix: `Configured sections: ${matchedClass.sections.join(', ')}`,
          });
        }
      }
    }

    // Determine row status
    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = issues.some((i) => i.severity === 'warning');
    const rowStatus: 'ready' | 'warning' | 'error' = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ready';

    if (rowStatus === 'ready') readyCount++;
    else if (rowStatus === 'warning') warningCount++;
    else errorCount++;

    // Split name into first and last name
    const nameParts = studentNameVal.split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

    const studentData: Partial<Student> = {
      first_name: firstName,
      last_name: lastName,
      admission_number: admissionNoVal,
      dob: mappedRow['dob_formatted'] || mappedRow['dob'] || null,
      gender: mappedRow['gender'] ? (mappedRow['gender'].toLowerCase() as any) : null,
      blood_group: mappedRow['blood_group'] || null,
      nationality: mappedRow['nationality'] || 'Indian',
      religion: mappedRow['religion'] || null,
      mother_tongue: mappedRow['mother_tongue'] || null,
      photo_url: mappedRow['photo'] ? String(mappedRow['photo']).trim() : null,
      academic_year: mappedRow['academic_year'] || academicStructure?.currentAcademicSession || '2026-2027',
      roll_number: mappedRow['roll_number'] ? String(mappedRow['roll_number']).trim() : null,
      admission_date: mappedRow['admission_date_formatted'] || mappedRow['admission_date'] || null,
      previous_school: mappedRow['previous_school'] || null,
      previous_class: mappedRow['previous_class'] || null,
      previous_admission_number: mappedRow['previous_admission_number'] || null,
      father_name: mappedRow['father_name'] || null,
      father_phone: mappedRow['father_phone'] || null,
      father_email: mappedRow['father_email'] || null,
      mother_name: mappedRow['mother_name'] || null,
      mother_phone: mappedRow['mother_phone'] || null,
      mother_email: mappedRow['mother_email'] || null,
      guardian_name: mappedRow['guardian_name'] || null,
      guardian_phone: mappedRow['guardian_phone'] || null,
      guardian_email: mappedRow['guardian_email'] || null,
      parent_occupation: mappedRow['parent_occupation'] || null,
      relationship_with_student: mappedRow['relationship_with_student'] || 'Father',
      address: mappedRow['address'] || null,
      city: mappedRow['city'] || null,
      state: mappedRow['state'] || null,
      postal_code: mappedRow['pincode'] || null,
      country: mappedRow['country'] || 'India',
      emergency_contact_name: mappedRow['emergency_contact_name'] || null,
      emergency_contact_phone: mappedRow['emergency_contact_number'] || null,
      emergency_contact_relation: mappedRow['emergency_contact_relationship'] || null,
      emergency_contact_address: mappedRow['emergency_contact_address'] || null,
      identification_type: mappedRow['identification_type'] || null,
      identification_number: mappedRow['identification_number'] || null,
      transport_required: mappedRow['transport_required']
        ? ['yes', 'true', '1'].includes(String(mappedRow['transport_required']).toLowerCase())
        : false,
      transport_route: mappedRow['transport_route'] || null,
      house: mappedRow['house'] || null,
      medical_notes: mappedRow['medical_notes'] || null,
      notes: mappedRow['notes'] || null,
      status: 'active',
      custom_fields: studentCustomFields,
    };

    rows.push({
      rowNumber,
      status: rowStatus,
      issues,
      rawValues: rawRow,
      studentData,
      photoFileName: mappedRow['photo'] ? String(mappedRow['photo']).trim() : undefined,
      isDuplicateAdmissionNo: existingAdmissionNumbers.has(admissionNoVal.toLowerCase()),
    });
  });

  const configuredKeys = new Set(getStudentFieldDefinitions(context.customFields).map((d) => d.key));
  const unexpectedHeaders: string[] = [];
  if (rawRows.length > 0) {
    const fileHeaders = Object.keys(rawRows[0]);
    fileHeaders.forEach((h) => {
      const mappedKey = headerMapping[h];
      if (mappedKey && !configuredKeys.has(mappedKey)) {
        unexpectedHeaders.push(h);
      }
    });
  }

  return {
    fileName: '',
    totalDetected: rawRows.length,
    readyCount,
    warningCount,
    errorCount,
    headerMatches: [],
    missingRequiredFields: [],
    unexpectedHeaders,
    rows,
  };
}

/**
 * Generates an Excel Error Report for download containing:
 * Row, Student Name, Field, Problem, Suggested Fix.
 */
export function generateErrorReportWorkbook(errorRows: StudentImportRow[]): XLSX.WorkBook {
  const headers = ['Row', 'Student Name', 'Admission No', 'Field', 'Severity', 'Problem', 'Suggested Fix'];
  const dataRows: any[][] = [];

  errorRows.forEach((row) => {
    const studentName = row.studentData.first_name
      ? `${row.studentData.first_name} ${row.studentData.last_name || ''}`.trim()
      : 'Unknown';
    const admissionNo = row.studentData.admission_number || '';

    row.issues.forEach((issue) => {
      dataRows.push([
        row.rowNumber,
        studentName,
        admissionNo,
        issue.fieldLabel,
        issue.severity.toUpperCase(),
        issue.message,
        issue.suggestedFix || 'Please correct the cell value in your spreadsheet.',
      ]);
    });
  });

  const sheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  sheet['!cols'] = [
    { wch: 8 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 45 },
    { wch: 45 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Import Errors');
  return workbook;
}

/**
 * Generates an error report buffer for download.
 */
export function generateErrorReportBuffer(errorRows: StudentImportRow[]): Uint8Array {
  const workbook = generateErrorReportWorkbook(errorRows);
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(arrayBuffer);
}
