import * as XLSX from 'xlsx';
import type { StaffMember, StaffCustomField } from './types';
import {
  STAFF_FIELD_DEFINITIONS,
  StaffFieldDefinition,
} from './staffFieldDefinitions';

export interface StaffValidationError {
  fieldKey: string;
  fieldLabel: string;
  message: string;
  rawValue: string;
}

export interface StaffValidationWarning {
  fieldKey: string;
  fieldLabel: string;
  message: string;
}

export interface StaffValidationErrorRow {
  rowNumber: number;
  employeeCode: string;
  staffName: string;
  staffType: string;
  errors: StaffValidationError[];
  warnings: StaffValidationWarning[];
  rawData: Record<string, any>;
}

export interface StaffValidationResult {
  totalDetected: number;
  validCount: number;
  warningCount: number;
  errorCount: number;
  validRecords: StaffMember[];
  errorRecords: StaffValidationErrorRow[];
  duplicateEmployeeCodes: string[];
  unknownColumns: string[];
}

export interface StaffValidationOptions {
  enabledFields?: string[];
  requiredFields?: string[];
  customFields?: StaffCustomField[];
  existingStaffMembers?: StaffMember[];
  ignoreSampleRows?: boolean;
}

/**
 * Normalizes an Excel or CSV column header for fuzzy alias lookup.
 */
export function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[*_#\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ResolvedHeaderField {
  isCustom: boolean;
  canonicalDef?: StaffFieldDefinition;
  customField?: StaffCustomField;
  key: string;
  label: string;
}

/**
 * Maps incoming tabular headers to canonical definitions or custom field configurations,
 * and identifies unknown columns.
 */
export function mapHeadersToFields(
  headers: string[],
  customFields: StaffCustomField[] = []
): {
  mapping: Map<number, ResolvedHeaderField>;
  unknownColumns: string[];
} {
  const mapping = new Map<number, ResolvedHeaderField>();
  const unknownColumns: string[] = [];
  const allCanonicalDefs = Object.values(STAFF_FIELD_DEFINITIONS);

  headers.forEach((h, index) => {
    const raw = String(h || '').trim();
    const clean = normalizeHeader(raw);
    if (!clean) return;

    // 1. Try canonical fields: direct key or label match
    for (const def of allCanonicalDefs) {
      if (
        normalizeHeader(def.key) === clean ||
        normalizeHeader(def.label) === clean
      ) {
        mapping.set(index, {
          isCustom: false,
          canonicalDef: def,
          key: def.key,
          label: def.label,
        });
        return;
      }
    }

    // 2. Try canonical aliases
    for (const def of allCanonicalDefs) {
      for (const alias of def.aliases) {
        if (normalizeHeader(alias) === clean) {
          mapping.set(index, {
            isCustom: false,
            canonicalDef: def,
            key: def.key,
            label: def.label,
          });
          return;
        }
      }
    }

    // 3. Try custom fields
    for (const cf of customFields) {
      const cfKeyNorm = normalizeHeader(cf.field_key);
      const cfLabelNorm = normalizeHeader(cf.field_label);
      if (clean === cfKeyNorm || clean === cfLabelNorm) {
        mapping.set(index, {
          isCustom: true,
          customField: cf,
          key: cf.field_key,
          label: cf.field_label,
        });
        return;
      }
    }

    // 4. Not matched -> unknown column
    unknownColumns.push(raw);
  });

  return { mapping, unknownColumns };
}

/**
 * Robust date parser supporting DD/MM/YYYY, YYYY-MM-DD, and Excel serial dates.
 */
export function parseDateValue(raw: any): string | null {
  if (!raw) return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().split('T')[0];
  }

  // Excel serial number (e.g. 44197)
  if (typeof raw === 'number') {
    const parsed = new Date(Math.round((raw - 25569) * 86400 * 1000));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }

  const str = String(raw).trim();
  if (!str) return null;

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Match YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return str;
}

export function parseBooleanValue(raw: any): boolean {
  if (typeof raw === 'boolean') return raw;
  const str = String(raw || '').trim().toLowerCase();
  return ['yes', 'y', 'true', '1'].includes(str);
}

/**
 * Validates custom field values against field type, options, and rules.
 */
function validateCustomFieldValue(
  cf: StaffCustomField,
  rawValue: string,
  staffType: string
): { isValid: boolean; parsedValue: any; error?: string } {
  const trimmed = rawValue.trim();

  // Scope check: if custom field doesn't apply to this staff type, ignore
  if (cf.staff_scope && cf.staff_scope !== 'BOTH' && cf.staff_scope !== staffType) {
    return { isValid: true, parsedValue: trimmed || undefined };
  }

  // Required check
  if (cf.is_required && !trimmed) {
    return {
      isValid: false,
      parsedValue: undefined,
      error: `${cf.field_label} is required.`,
    };
  }

  if (!trimmed) {
    return { isValid: true, parsedValue: undefined };
  }

  // Type checks
  switch (cf.field_type) {
    case 'DROPDOWN': {
      const options = (
        Array.isArray(cf.options)
          ? cf.options
          : Array.isArray(cf.options_json)
          ? cf.options_json
          : []
      ).map((o: any) => String(o).trim());

      if (options.length > 0) {
        const matched = options.find(
          (o) => o.toLowerCase() === trimmed.toLowerCase()
        );
        if (!matched) {
          return {
            isValid: false,
            parsedValue: trimmed,
            error: `${cf.field_label} must be one of: ${options.join(', ')}.`,
          };
        }
        return { isValid: true, parsedValue: matched };
      }
      return { isValid: true, parsedValue: trimmed };
    }

    case 'MULTI_SELECT': {
      const options = (
        Array.isArray(cf.options)
          ? cf.options
          : Array.isArray(cf.options_json)
          ? cf.options_json
          : []
      ).map((o: any) => String(o).trim());

      const selected = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      if (options.length > 0) {
        const invalid = selected.filter(
          (s) => !options.some((o) => o.toLowerCase() === s.toLowerCase())
        );
        if (invalid.length > 0) {
          return {
            isValid: false,
            parsedValue: selected,
            error: `${cf.field_label} contains invalid options: ${invalid.join(', ')}. Allowed: ${options.join(', ')}.`,
          };
        }
      }
      return { isValid: true, parsedValue: selected };
    }

    case 'NUMBER':
    case 'DECIMAL': {
      const num = Number(trimmed);
      if (isNaN(num)) {
        return {
          isValid: false,
          parsedValue: trimmed,
          error: `${cf.field_label} must be a numeric value.`,
        };
      }
      const valRules = cf.validation || cf.validation_json || {};
      if (valRules.min !== undefined && num < valRules.min) {
        return {
          isValid: false,
          parsedValue: num,
          error: `${cf.field_label} cannot be less than ${valRules.min}.`,
        };
      }
      if (valRules.max !== undefined && num > valRules.max) {
        return {
          isValid: false,
          parsedValue: num,
          error: `${cf.field_label} cannot be greater than ${valRules.max}.`,
        };
      }
      return { isValid: true, parsedValue: num };
    }

    case 'DATE': {
      const parsedDate = parseDateValue(trimmed);
      if (!parsedDate || isNaN(new Date(parsedDate).getTime())) {
        return {
          isValid: false,
          parsedValue: trimmed,
          error: `${cf.field_label} must be a valid date (DD/MM/YYYY or YYYY-MM-DD).`,
        };
      }
      return { isValid: true, parsedValue: parsedDate };
    }

    case 'BOOLEAN': {
      const boolVal = parseBooleanValue(trimmed);
      return { isValid: true, parsedValue: boolVal };
    }

    case 'EMAIL': {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return {
          isValid: false,
          parsedValue: trimmed,
          error: `${cf.field_label} must be a valid email address.`,
        };
      }
      return { isValid: true, parsedValue: trimmed };
    }

    case 'PHONE': {
      const cleanPhone = trimmed.replace(/[^0-9+]/g, '');
      if (cleanPhone.replace(/\+/g, '').length < 7) {
        return {
          isValid: false,
          parsedValue: trimmed,
          error: `${cf.field_label} must be a valid phone number with at least 7 digits.`,
        };
      }
      return { isValid: true, parsedValue: cleanPhone };
    }

    case 'TEXT':
    case 'LONG_TEXT':
    default: {
      const valRules = cf.validation || cf.validation_json || {};
      if (valRules.maxLength !== undefined && trimmed.length > valRules.maxLength) {
        return {
          isValid: false,
          parsedValue: trimmed,
          error: `${cf.field_label} cannot exceed ${valRules.maxLength} characters.`,
        };
      }
      return { isValid: true, parsedValue: trimmed };
    }
  }
}

/**
 * Validates and converts raw file data into typed StaffMember objects and error reports.
 */
export function validateStaffSheetData(
  rows: any[][],
  options: StaffValidationOptions = {}
): StaffValidationResult {
  if (!rows || rows.length === 0) {
    return {
      totalDetected: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      validRecords: [],
      errorRecords: [],
      duplicateEmployeeCodes: [],
      unknownColumns: [],
    };
  }

  // First non-empty row is header
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].some((cell) => cell !== undefined && String(cell).trim() !== '')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      totalDetected: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      validRecords: [],
      errorRecords: [],
      duplicateEmployeeCodes: [],
      unknownColumns: [],
    };
  }

  const customFieldsPool = options.customFields || [];
  const rawHeaders = rows[headerIndex].map((c) => String(c || ''));
  const { mapping: headerMap, unknownColumns } = mapHeadersToFields(rawHeaders, customFieldsPool);

  const existingCodes = new Set(
    (options.existingStaffMembers || [])
      .map((s) => (s.employeeCode || s.facultyId || '').trim().toUpperCase())
      .filter(Boolean)
  );

  const seenInFileCodes = new Set<string>();
  const duplicateCodesInFile = new Set<string>();

  const validRecords: StaffMember[] = [];
  const errorRecords: StaffValidationErrorRow[] = [];

  const requiredKeys = new Set(
    options.requiredFields && options.requiredFields.length > 0
      ? options.requiredFields
      : ['employee_code', 'staff_type', 'name', 'department', 'designation', 'status', 'phone']
  );

  let dataRowCount = 0;

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !row.some((cell) => cell !== undefined && String(cell).trim() !== '')) {
      continue; // Skip empty rows
    }

    dataRowCount++;
    const rowNumber = r + 1;
    const rowDict: Record<string, any> = {};
    const customFieldValues: Record<string, any> = {};

    row.forEach((cellVal, colIdx) => {
      const resolved = headerMap.get(colIdx);
      if (resolved) {
        const valStr = cellVal !== undefined && cellVal !== null ? String(cellVal).trim() : '';
        if (resolved.isCustom) {
          customFieldValues[resolved.key] = valStr;
        } else {
          rowDict[resolved.key] = valStr;
        }
      }
    });

    const errors: StaffValidationError[] = [];
    const warnings: StaffValidationWarning[] = [];

    // 1. Employee Code
    const rawCode = (rowDict.employee_code || '').trim();
    if (!rawCode) {
      errors.push({
        fieldKey: 'employee_code',
        fieldLabel: 'Employee ID',
        message: 'Employee ID is required.',
        rawValue: '',
      });
    } else {
      const upperCode = rawCode.toUpperCase();
      if (seenInFileCodes.has(upperCode)) {
        duplicateCodesInFile.add(upperCode);
        errors.push({
          fieldKey: 'employee_code',
          fieldLabel: 'Employee ID',
          message: `Duplicate Employee ID "${rawCode}" found multiple times in this file.`,
          rawValue: rawCode,
        });
      } else {
        seenInFileCodes.add(upperCode);
      }

      if (existingCodes.has(upperCode)) {
        warnings.push({
          fieldKey: 'employee_code',
          fieldLabel: 'Employee ID',
          message: `Employee ID "${rawCode}" already exists in the system and will be updated.`,
        });
      }
    }

    // 2. Staff Type
    let staffType = (rowDict.staff_type || '').toUpperCase().replace(/[\s\-]/g, '_');
    if (!staffType) {
      staffType = 'TEACHING'; // default fallback
    } else if (staffType.includes('TEACH') && !staffType.includes('NON')) {
      staffType = 'TEACHING';
    } else if (staffType.includes('NON') || staffType.includes('ADMIN') || staffType.includes('SUPPORT')) {
      staffType = 'NON_TEACHING';
    } else {
      errors.push({
        fieldKey: 'staff_type',
        fieldLabel: 'Staff Type',
        message: `Invalid Staff Type "${rowDict.staff_type}". Must be TEACHING or NON_TEACHING.`,
        rawValue: rowDict.staff_type,
      });
    }

    // 3. Full Name
    const fullName = (rowDict.name || '').trim();
    if (!fullName) {
      errors.push({
        fieldKey: 'name',
        fieldLabel: 'Full Name',
        message: 'Full Name is required.',
        rawValue: '',
      });
    }

    // 4. Department & Designation
    const department = (rowDict.department || '').trim();
    const designation = (rowDict.designation || '').trim();
    if (requiredKeys.has('department') && !department) {
      errors.push({
        fieldKey: 'department',
        fieldLabel: 'Department',
        message: 'Department is required.',
        rawValue: '',
      });
    }
    if (requiredKeys.has('designation') && !designation) {
      errors.push({
        fieldKey: 'designation',
        fieldLabel: 'Designation',
        message: 'Designation is required.',
        rawValue: '',
      });
    }

    // 5. Status
    let status = (rowDict.status || 'active').toLowerCase().trim();
    if (!['active', 'inactive', 'on_leave', 'terminated'].includes(status)) {
      if (status === 'leave' || status === 'onleave') status = 'on_leave';
      else if (status === 'resigned' || status === 'left') status = 'inactive';
      else status = 'active';
    }

    // 6. Email validation
    const email = (rowDict.official_email || rowDict.email || '').trim();
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({
          fieldKey: 'official_email',
          fieldLabel: 'Official Email',
          message: `Invalid email format "${email}".`,
          rawValue: email,
        });
      }
    }

    // 7. Phone validation
    const phone = (rowDict.phone || '').replace(/[^0-9+]/g, '');
    if (requiredKeys.has('phone') && !phone) {
      errors.push({
        fieldKey: 'phone',
        fieldLabel: 'Official Phone',
        message: 'Phone number is required.',
        rawValue: '',
      });
    } else if (phone && phone.replace(/\+/g, '').length < 7) {
      errors.push({
        fieldKey: 'phone',
        fieldLabel: 'Official Phone',
        message: `Phone number "${phone}" is too short.`,
        rawValue: phone,
      });
    }

    // Check additional required canonical fields
    for (const reqKey of requiredKeys) {
      if (!['employee_code', 'staff_type', 'name', 'department', 'designation', 'status', 'phone'].includes(reqKey)) {
        const val = rowDict[reqKey];
        const def = STAFF_FIELD_DEFINITIONS[reqKey];
        if (!val || String(val).trim() === '') {
          errors.push({
            fieldKey: reqKey,
            fieldLabel: def ? def.label : reqKey,
            message: `${def ? def.label : reqKey} is marked as required.`,
            rawValue: '',
          });
        }
      }
    }

    // Validate Custom Fields
    const validatedCustomFields: Record<string, any> = {};
    for (const cf of customFieldsPool) {
      if (cf.is_active === false) continue;
      const rawVal = customFieldValues[cf.field_key] || '';
      const { isValid, parsedValue, error } = validateCustomFieldValue(cf, rawVal, staffType);
      if (!isValid && error) {
        errors.push({
          fieldKey: cf.field_key,
          fieldLabel: cf.field_label,
          message: error,
          rawValue: rawVal,
        });
      } else if (parsedValue !== undefined) {
        validatedCustomFields[cf.field_key] = parsedValue;
      }
    }

    // Parse date fields
    const joiningDate = parseDateValue(rowDict.joining_date) || undefined;
    const leavingDate = parseDateValue(rowDict.leaving_date) || undefined;
    const dob = parseDateValue(rowDict.dob) || undefined;

    // Teaching Specific Fields
    const isClassTeacher = parseBooleanValue(rowDict.is_class_teacher);
    const isHod = parseBooleanValue(rowDict.is_hod);
    const isCoordinator = parseBooleanValue(rowDict.is_coordinator);

    const experienceYearsNum = rowDict.experience_years ? parseFloat(rowDict.experience_years) : undefined;

    if (errors.length > 0) {
      errorRecords.push({
        rowNumber,
        employeeCode: rawCode || `ROW-${rowNumber}`,
        staffName: fullName || 'Unnamed Staff',
        staffType: staffType || 'TEACHING',
        errors,
        warnings,
        rawData: { ...rowDict, ...customFieldValues },
      });
    } else {
      const stableId = `staff_${rawCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${r}`;
      const member: StaffMember = {
        id: stableId,
        name: fullName,
        employeeCode: rawCode,
        facultyId: rawCode,
        staffType: staffType as any,
        category: staffType === 'TEACHING' ? 'teaching' : 'non_teaching',
        department: department || (staffType === 'TEACHING' ? 'General Academics' : 'Administration'),
        designation: designation || (staffType === 'TEACHING' ? 'Teacher' : 'Staff'),
        status: status as any,
        joiningDate,
        leavingDate,
        dob,
        gender: rowDict.gender || undefined,
        bloodGroup: rowDict.blood_group || undefined,
        nationality: rowDict.nationality || 'Indian',
        maritalStatus: rowDict.marital_status || undefined,
        email: email || undefined,
        officialEmail: email || undefined,
        personalEmail: rowDict.personal_email || undefined,
        phone: phone || undefined,
        officialPhone: phone || undefined,
        personalPhone: rowDict.personal_phone || undefined,
        emergencyContactName: rowDict.emergency_contact_name || undefined,
        emergencyContactPhone: rowDict.emergency_contact_phone || undefined,
        emergencyContactRelationship: rowDict.emergency_contact_relation || undefined,
        currentAddress: rowDict.current_address || undefined,
        currentCity: rowDict.current_city || undefined,
        currentState: rowDict.current_state || undefined,
        currentPincode: rowDict.current_pincode || undefined,
        highestQualification: rowDict.highest_qualification || undefined,
        qualification: rowDict.highest_qualification || undefined,
        specialization: rowDict.specialization || undefined,
        experienceYears: isNaN(experienceYearsNum as any) ? undefined : experienceYearsNum,
        certifications: rowDict.certifications ? rowDict.certifications.split(',').map((c: string) => c.trim()) : undefined,
        primarySubject: rowDict.primary_subject || undefined,
        additionalSubjects: rowDict.additional_subjects ? rowDict.additional_subjects.split(',').map((s: string) => s.trim()) : undefined,
        classesTaught: rowDict.classes_taught || undefined,
        sectionsTaught: rowDict.sections_taught || undefined,
        isClassTeacher,
        isHod,
        isCoordinator,
        jobRole: rowDict.job_role || undefined,
        workLocation: rowDict.work_location || undefined,
        workSchedule: rowDict.work_schedule || undefined,
        bankName: rowDict.bank_name || undefined,
        accountNumber: rowDict.account_number || undefined,
        ifsc: rowDict.ifsc || undefined,
        pan: rowDict.pan || undefined,
        photoUrl: rowDict.photo ? `/uploads/staff/${rowDict.photo}` : undefined,
        displayOnWebsite: true,
        customFields: validatedCustomFields,
        custom_fields: validatedCustomFields,
      };

      validRecords.push(member);
    }
  }

  return {
    totalDetected: dataRowCount,
    validCount: validRecords.length,
    warningCount: errorRecords.reduce((acc, r) => acc + r.warnings.length, 0),
    errorCount: errorRecords.length,
    validRecords,
    errorRecords,
    duplicateEmployeeCodes: Array.from(duplicateCodesInFile),
    unknownColumns: Array.from(new Set(unknownColumns)),
  };
}

/**
 * Parses and validates an uploaded file buffer (.xlsx, .xls, .csv).
 */
export function parseAndValidateStaffFile(
  fileBuffer: Uint8Array | ArrayBuffer,
  options: StaffValidationOptions = {}
): StaffValidationResult {
  const wb = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    return {
      totalDetected: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      validRecords: [],
      errorRecords: [],
      duplicateEmployeeCodes: [],
      unknownColumns: [],
    };
  }

  const ws = wb.Sheets[firstSheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  return validateStaffSheetData(rows, options);
}

/**
 * Generates an Excel error workbook with failed rows and specific remediation advice.
 */
export function generateStaffErrorWorkbook(errorRows: StaffValidationErrorRow[]): Uint8Array {
  const headers = ['Row Number', 'Employee ID', 'Staff Name', 'Staff Type', 'Field In Error', 'Issue Description', 'Current Value'];
  const dataRows: string[][] = [];

  for (const row of errorRows) {
    for (const err of row.errors) {
      dataRows.push([
        String(row.rowNumber),
        row.employeeCode,
        row.staffName,
        row.staffType,
        err.fieldLabel,
        err.message,
        err.rawValue,
      ]);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 15 }, { wch: 22 }, { wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Staff Import Errors');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
