import * as XLSX from 'xlsx';
import {
  resolveStaffFields,
  ResolvedStaffField,
} from './staffFieldDefinitions';
import type { StaffCustomField } from './types';

export interface StaffTemplateGenerationOptions {
  enabledFields: string[];
  requiredFields?: string[];
  customFields?: StaffCustomField[];
  staffTypeScope?: 'ALL' | 'TEACHING' | 'NON_TEACHING';
  schoolName?: string;
  academicYear?: string;
}

export interface SampleStaffProfile {
  employee_code: string;
  staff_type: string;
  department: string;
  designation: string;
  status: string;
  name: string;
  photo: string;
  dob: string;
  gender: string;
  blood_group: string;
  nationality: string;
  marital_status: string;
  official_email: string;
  personal_email: string;
  phone: string;
  personal_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  current_address: string;
  current_city: string;
  current_state: string;
  current_pincode: string;
  highest_qualification: string;
  specialization: string;
  experience_years: string;
  certifications: string;
  primary_subject: string;
  additional_subjects: string;
  classes_taught: string;
  sections_taught: string;
  is_class_teacher: string;
  is_hod: string;
  is_coordinator: string;
  job_role: string;
  work_location: string;
  work_schedule: string;
  joining_date: string;
  leaving_date: string;
  reporting_manager: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  pan: string;
  [key: string]: string;
}

export const SAMPLE_STAFF_PROFILES: SampleStaffProfile[] = [
  {
    employee_code: 'FAC-2026-00012',
    staff_type: 'TEACHING',
    department: 'Mathematics',
    designation: 'PGT (Post Graduate Teacher)',
    status: 'active',
    name: 'Rahul Sharma',
    photo: 'FAC-2026-00012.jpg',
    dob: '12/08/1988',
    gender: 'Male',
    blood_group: 'O+',
    nationality: 'Indian',
    marital_status: 'Married',
    official_email: 'rahul.sharma@school.edu.in',
    personal_email: 'rahul.sharma.personal@gmail.com',
    phone: '9876543210',
    personal_phone: '9876543219',
    emergency_contact_name: 'Meena Sharma',
    emergency_contact_phone: '9876543218',
    emergency_contact_relation: 'Spouse',
    current_address: 'Flat 402, Green Avenue, Main Road',
    current_city: 'Motihari',
    current_state: 'Bihar',
    current_pincode: '845401',
    highest_qualification: 'M.Sc. Mathematics, B.Ed.',
    specialization: 'Mathematics & Statistics',
    experience_years: '10',
    certifications: 'CTET Qualified (Paper II)',
    primary_subject: 'Mathematics',
    additional_subjects: 'Applied Mathematics, Statistics',
    classes_taught: 'Class 9, Class 10, Class 11, Class 12',
    sections_taught: '9-A, 10-A, 11-A',
    is_class_teacher: 'Yes',
    is_hod: 'Yes',
    is_coordinator: 'No',
    job_role: '',
    work_location: 'Senior Academic Wing',
    work_schedule: 'Regular School Shift (7:45 AM - 2:30 PM)',
    joining_date: '15/06/2016',
    leaving_date: '',
    reporting_manager: 'Principal Dr. R. Verma',
    bank_name: 'State Bank of India',
    account_number: '38294829104',
    ifsc: 'SBIN0001245',
    pan: 'ABCDE1234F',
    tet_number: 'TET-BR-2026-00125',
    hostel_warden: 'No',
    transport_duty: 'Bus Route 4 Morning',
  },
  {
    employee_code: 'FAC-2026-00018',
    staff_type: 'TEACHING',
    department: 'Languages',
    designation: 'TGT (Trained Graduate Teacher)',
    status: 'active',
    name: 'Priya Kumari',
    photo: 'FAC-2026-00018.jpg',
    dob: '25/11/1992',
    gender: 'Female',
    blood_group: 'B+',
    nationality: 'Indian',
    marital_status: 'Single',
    official_email: 'priya.kumari@school.edu.in',
    personal_email: 'priya.kumari@gmail.com',
    phone: '9876543211',
    personal_phone: '9876543220',
    emergency_contact_name: 'Suresh Kumari',
    emergency_contact_phone: '9876543221',
    emergency_contact_relation: 'Father',
    current_address: 'House No. 18, Teachers Colony',
    current_city: 'Motihari',
    current_state: 'Bihar',
    current_pincode: '845401',
    highest_qualification: 'M.A. English Literature, B.Ed.',
    specialization: 'English Literature & Grammar',
    experience_years: '7',
    certifications: 'CBSE ELT Master Trainer',
    primary_subject: 'English',
    additional_subjects: 'Creative Writing',
    classes_taught: 'Class 6, Class 7, Class 8',
    sections_taught: '6-A, 7-B, 8-A',
    is_class_teacher: 'Yes',
    is_hod: 'No',
    is_coordinator: 'No',
    job_role: '',
    work_location: 'Middle School Wing',
    work_schedule: 'Regular School Shift (7:45 AM - 2:30 PM)',
    joining_date: '01/07/2019',
    leaving_date: '',
    reporting_manager: 'Rahul Sharma (HoD)',
    bank_name: 'Punjab National Bank',
    account_number: '19482948102',
    ifsc: 'PUNB0012400',
    pan: 'BCDEF2345G',
    tet_number: 'TET-BR-2026-00241',
    hostel_warden: 'Yes',
    transport_duty: '',
  },
  {
    employee_code: 'FAC-2026-00035',
    staff_type: 'NON_TEACHING',
    department: 'Administration',
    designation: 'Administrative Officer',
    status: 'active',
    name: 'Vikas Chandra',
    photo: 'FAC-2026-00035.jpg',
    dob: '05/03/1985',
    gender: 'Male',
    blood_group: 'A+',
    nationality: 'Indian',
    marital_status: 'Married',
    official_email: 'admin.officer@school.edu.in',
    personal_email: 'vikas.chandra@gmail.com',
    phone: '9876543212',
    personal_phone: '9876543222',
    emergency_contact_name: 'Anjali Chandra',
    emergency_contact_phone: '9876543223',
    emergency_contact_relation: 'Spouse',
    current_address: '42, Civil Lines, Near Stadium',
    current_city: 'Motihari',
    current_state: 'Bihar',
    current_pincode: '845401',
    highest_qualification: 'MBA Human Resources, B.Com.',
    specialization: 'School Operations & Statutory Compliance',
    experience_years: '12',
    certifications: 'First Aid Certified Officer',
    primary_subject: '',
    additional_subjects: '',
    classes_taught: '',
    sections_taught: '',
    is_class_teacher: 'No',
    is_hod: 'No',
    is_coordinator: 'No',
    job_role: 'Operations Head, Admission Desk, Transport Coordinator',
    work_location: 'Main Administrative Complex - Room 101',
    work_schedule: 'General Administration Shift (8:00 AM - 4:30 PM)',
    joining_date: '10/04/2014',
    leaving_date: '',
    reporting_manager: 'School Management Committee / Principal',
    bank_name: 'HDFC Bank',
    account_number: '5010023491823',
    ifsc: 'HDFC0001824',
    pan: 'CDEFG3456H',
    tet_number: '',
    hostel_warden: 'No',
    transport_duty: 'Fleet Supervisor',
  },
];

export function getApplicableStaffFields(
  options: StaffTemplateGenerationOptions
): ResolvedStaffField[] {
  return resolveStaffFields({
    config: {
      enabledFields: options.enabledFields,
      requiredFields: options.requiredFields,
      customFields: options.customFields,
    },
    staffType: options.staffTypeScope || 'ALL',
  });
}

/**
 * Builds the headers and rows for the staff import worksheet, strictly following canonical order.
 */
export function buildStaffSheetData(
  options: StaffTemplateGenerationOptions,
  includeSampleRows = true
): { headers: string[]; rows: string[][] } {
  const fields = getApplicableStaffFields(options);

  const headers = fields.map((f) => {
    return f.isRequired ? `${f.label} *` : f.label;
  });

  const rows: string[][] = [];

  if (includeSampleRows) {
    const samplePool = SAMPLE_STAFF_PROFILES.filter((sample) => {
      if (!options.staffTypeScope || options.staffTypeScope === 'ALL') return true;
      return sample.staff_type === options.staffTypeScope;
    });

    for (const sample of samplePool) {
      const row = fields.map((f) => {
        // If sample has explicit key
        if (sample[f.key] !== undefined) return sample[f.key];
        // Otherwise use sampleValue or type fallback
        if (f.isCustom) {
          if (f.dataType === 'boolean') return 'No';
          if (f.dataType === 'date') return '01/04/2026';
          if (f.options && f.options.length > 0) return f.options[0];
          return f.sampleValue || `Sample ${f.label}`;
        }
        return '';
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Generates an XLSX workbook with data sheet and dynamic instructions reference sheet.
 */
export function generateStaffWorkbook(
  options: StaffTemplateGenerationOptions,
  includeSampleRows = true
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const { headers, rows } = buildStaffSheetData(options, includeSampleRows);

  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Auto-width columns
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    for (const r of rows) {
      if (r[i] && r[i].length > maxLen) maxLen = r[i].length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 15), 45) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Staff & Faculty Data');

  // Instructions Sheet
  const fields = getApplicableStaffFields(options);
  const instructionRows: string[][] = [
    ['STAFF & FACULTY DIRECTORY IMPORT INSTRUCTIONS'],
    [`Institution: ${options.schoolName || 'School Management Portal'}`],
    [`Template Scope: ${options.staffTypeScope || 'ALL'} STAFF`],
    [''],
    ['IMPORTANT RULES FOR BULK IMPORT:'],
    ['1. Fields marked with an asterisk (*) are mandatory.'],
    ['2. Employee ID must be unique across all staff members.'],
    ['3. Staff Type must be either TEACHING or NON_TEACHING.'],
    ['4. Date format must be DD/MM/YYYY or YYYY-MM-DD.'],
    ['5. For Teaching staff, Primary Subject and Classes Taught assist Academic Setup assignment.'],
    ['6. You can delete the sample demonstration rows before uploading your actual data.'],
    [''],
    ['STANDARD CANONICAL FIELD CATALOG:'],
    ['Field Name', 'Category', 'Required?', 'Format / Valid Options', 'Sample Value'],
  ];

  const canonicalFields = fields.filter((f) => !f.isCustom);
  for (const f of canonicalFields) {
    const isReq = f.isRequired ? 'YES' : 'Optional';
    instructionRows.push([f.label, f.category, isReq, f.formatInstructions || '', f.sampleValue || '']);
  }

  const customFields = fields.filter((f) => f.isCustom);
  if (customFields.length > 0) {
    instructionRows.push(['']);
    instructionRows.push(['CUSTOM SCHOOL-SPECIFIC FIELDS:']);
    instructionRows.push(['Field Name', 'Type / Category', 'Scope', 'Required?', 'Format Instructions / Options']);

    for (const cf of customFields) {
      instructionRows.push([
        cf.label,
        `${cf.dataType.toUpperCase()} (${cf.category})`,
        cf.staffScope,
        cf.isRequired ? 'YES' : 'Optional',
        cf.formatInstructions || cf.description || '',
      ]);
    }
  }

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionRows);
  wsInstructions['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return wb;
}

export function generateStaffExcelBuffer(
  options: StaffTemplateGenerationOptions,
  includeSampleRows = true
): Uint8Array {
  const wb = generateStaffWorkbook(options, includeSampleRows);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

export function generateStaffCsvString(
  options: StaffTemplateGenerationOptions,
  includeSampleRows = true
): string {
  const { headers, rows } = buildStaffSheetData(options, includeSampleRows);
  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  return XLSX.utils.sheet_to_csv(ws);
}
