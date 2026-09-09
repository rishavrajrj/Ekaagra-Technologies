import type { StaffFacultyConfigData, StaffMember, StaffCustomField } from './types';

export type StaffFieldCategory =
  | 'employment'
  | 'personal'
  | 'contact'
  | 'address'
  | 'qualification'
  | 'teaching'
  | 'non_teaching'
  | 'payroll'
  | 'documents'
  | 'custom';

export interface StaffFieldDefinition {
  key: string;
  label: string;
  category: StaffFieldCategory;
  templateOrder: number;
  description: string;
  dataType: 'text' | 'date' | 'select' | 'email' | 'phone' | 'number' | 'image' | 'file' | 'boolean';
  requiredByDefault: boolean;
  lockedRequired?: boolean; // Cannot be made optional (e.g. Employee ID, Full Name, Staff Type)
  staffTypeScope?: 'ALL' | 'TEACHING' | 'NON_TEACHING';
  supportsImport: boolean;
  supportsPreview: boolean;
  sampleValue: string;
  formatInstructions: string;
  aliases: string[]; // Variations for robust Excel header matching
  allowedOptions?: string[];
}

export interface StaffCategoryInfo {
  id: StaffFieldCategory;
  title: string;
  description: string;
  iconName: string;
  order: number;
}

export const STAFF_FIELD_CATEGORIES: StaffCategoryInfo[] = [
  {
    id: 'employment',
    title: 'Employment Information',
    description: 'Employee ID, Staff Type, Department, Designation, Joining Date, and Status.',
    iconName: 'Briefcase',
    order: 1,
  },
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Full name, photo, date of birth, gender, blood group, and identity.',
    iconName: 'User',
    order: 2,
  },
  {
    id: 'contact',
    title: 'Contact Information',
    description: 'Official and personal email, phone numbers, and emergency contacts.',
    iconName: 'Phone',
    order: 3,
  },
  {
    id: 'address',
    title: 'Address Information',
    description: 'Current and permanent residential postal addresses.',
    iconName: 'MapPin',
    order: 4,
  },
  {
    id: 'qualification',
    title: 'Qualification & Experience',
    description: 'Highest degree, specialization, certifications, and years of experience.',
    iconName: 'GraduationCap',
    order: 5,
  },
  {
    id: 'teaching',
    title: 'Teaching-Specific Details',
    description: 'Subjects, grades taught, class teacher, and academic coordinator roles.',
    iconName: 'BookOpen',
    order: 6,
  },
  {
    id: 'non_teaching',
    title: 'Non-Teaching Details',
    description: 'Job role, shift schedule, work facility, and operational responsibilities.',
    iconName: 'Settings',
    order: 7,
  },
  {
    id: 'payroll',
    title: 'Payroll & Statutory (Optional)',
    description: 'Bank account, IFSC, PAN, and PF numbers for institutional record.',
    iconName: 'CreditCard',
    order: 8,
  },
  {
    id: 'documents',
    title: 'Certificates & Documents',
    description: 'Government ID, degree certificates, experience letters, and resume.',
    iconName: 'FileText',
    order: 9,
  },
  {
    id: 'custom',
    title: 'Custom Staff Information',
    description: 'School-specific additional staff fields configured by administration.',
    iconName: 'Sparkles',
    order: 10,
  },
];

export const STAFF_FIELD_DEFINITIONS: Record<string, StaffFieldDefinition> = {
  // ── 1. EMPLOYMENT ──
  employee_code: {
    key: 'employee_code',
    label: 'Employee ID',
    category: 'employment',
    templateOrder: 1,
    description: 'Unique institutional employee identifier (e.g. FAC-2026-00012).',
    dataType: 'text',
    requiredByDefault: true,
    lockedRequired: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'FAC-2026-00012',
    formatInstructions: 'Alphanumeric identifier, must be unique across the institution.',
    aliases: ['employee id', 'empid', 'emp_code', 'employee code', 'faculty id', 'staff id', 'teacher id'],
  },
  staff_type: {
    key: 'staff_type',
    label: 'Staff Type',
    category: 'employment',
    templateOrder: 2,
    description: 'Primary staff category: TEACHING or NON_TEACHING.',
    dataType: 'select',
    requiredByDefault: true,
    lockedRequired: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'TEACHING',
    formatInstructions: 'Must be either TEACHING or NON_TEACHING.',
    allowedOptions: ['TEACHING', 'NON_TEACHING'],
    aliases: ['staff type', 'staff category', 'type of staff', 'staff_type', 'stafftype'],
  },
  department: {
    key: 'department',
    label: 'Department',
    category: 'employment',
    templateOrder: 3,
    description: 'Academic department or operational division.',
    dataType: 'select',
    requiredByDefault: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Mathematics',
    formatInstructions: 'e.g. Mathematics, Science, Administration, IT & Systems.',
    allowedOptions: [
      'Mathematics',
      'Science',
      'Languages',
      'Social Studies',
      'Commerce',
      'Computer Science & IT',
      'Arts & Music',
      'Physical Education',
      'Pre-Primary / Foundational',
      'Administration',
      'Accounts & Finance',
      'Library & Media',
      'Transport & Logistics',
    ],
    aliases: ['department', 'dept', 'division'],
  },
  designation: {
    key: 'designation',
    label: 'Designation',
    category: 'employment',
    templateOrder: 4,
    description: 'Institutional role or faculty designation.',
    dataType: 'text',
    requiredByDefault: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'PGT (Post Graduate Teacher)',
    formatInstructions: 'e.g. PGT, TGT, PRT, HoD, Admin Officer, Accountant.',
    aliases: ['designation', 'title', 'post', 'position'],
  },
  status: {
    key: 'status',
    label: 'Employment Status',
    category: 'employment',
    templateOrder: 5,
    description: 'Current lifecycle status of the staff member.',
    dataType: 'select',
    requiredByDefault: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'active',
    formatInstructions: 'active, on_leave, inactive, or terminated.',
    allowedOptions: ['active', 'on_leave', 'inactive', 'terminated'],
    aliases: ['status', 'employment status', 'state', 'active status'],
  },
  joining_date: {
    key: 'joining_date',
    label: 'Date of Joining',
    category: 'employment',
    templateOrder: 6,
    description: 'Official date of joining the school.',
    dataType: 'date',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '15/06/2021',
    formatInstructions: 'DD/MM/YYYY or YYYY-MM-DD.',
    aliases: ['date of joining', 'joining date', 'doj', 'appointment date'],
  },
  leaving_date: {
    key: 'leaving_date',
    label: 'Date of Leaving',
    category: 'employment',
    templateOrder: 7,
    description: 'Date of relief or resignation if inactive.',
    dataType: 'date',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '',
    formatInstructions: 'DD/MM/YYYY or YYYY-MM-DD.',
    aliases: ['date of leaving', 'leaving date', 'dol', 'resignation date'],
  },
  reporting_manager: {
    key: 'reporting_manager',
    label: 'Reporting Manager',
    category: 'employment',
    templateOrder: 8,
    description: 'Supervisor, Principal, Vice Principal, or Head of Department.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Principal Dr. R. Verma',
    formatInstructions: 'Name or Employee ID of direct reporting manager.',
    aliases: ['reporting manager', 'manager', 'supervisor', 'reporting to'],
  },

  // ── 2. PERSONAL ──
  name: {
    key: 'name',
    label: 'Full Name',
    category: 'personal',
    templateOrder: 9,
    description: 'Full legal name of the staff member.',
    dataType: 'text',
    requiredByDefault: true,
    lockedRequired: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Rahul Sharma',
    formatInstructions: 'Official name as shown on educational credentials.',
    aliases: ['name', 'full name', 'staff name', 'faculty name', 'employee name', 'teacher name'],
  },
  photo: {
    key: 'photo',
    label: 'Profile Photo',
    category: 'personal',
    templateOrder: 10,
    description: 'Portrait photo for ID cards, portal profile, and directory.',
    dataType: 'image',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'FAC-2026-00012.jpg',
    formatInstructions: 'Image filename matching employee code (e.g. FAC-2026-00012.jpg) or image URL.',
    aliases: ['photo', 'profile photo', 'photograph', 'image', 'picture', 'avatar'],
  },
  dob: {
    key: 'dob',
    label: 'Date of Birth',
    category: 'personal',
    templateOrder: 11,
    description: 'Date of birth of the staff member.',
    dataType: 'date',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '12/08/1988',
    formatInstructions: 'DD/MM/YYYY or YYYY-MM-DD.',
    aliases: ['dob', 'date of birth', 'birth date'],
  },
  gender: {
    key: 'gender',
    label: 'Gender',
    category: 'personal',
    templateOrder: 12,
    description: 'Gender of the staff member.',
    dataType: 'select',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Male',
    formatInstructions: 'Male, Female, or Other.',
    allowedOptions: ['Male', 'Female', 'Other'],
    aliases: ['gender', 'sex'],
  },
  blood_group: {
    key: 'blood_group',
    label: 'Blood Group',
    category: 'personal',
    templateOrder: 13,
    description: 'Blood group for institutional health record.',
    dataType: 'select',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'O+',
    formatInstructions: 'A+, A-, B+, B-, AB+, AB-, O+, O-.',
    allowedOptions: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    aliases: ['blood group', 'blood_group', 'blood type'],
  },
  nationality: {
    key: 'nationality',
    label: 'Nationality',
    category: 'personal',
    templateOrder: 14,
    description: 'Nationality of the staff member.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Indian',
    formatInstructions: 'e.g. Indian.',
    aliases: ['nationality', 'citizenship'],
  },
  marital_status: {
    key: 'marital_status',
    label: 'Marital Status',
    category: 'personal',
    templateOrder: 15,
    description: 'Marital status.',
    dataType: 'select',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Married',
    formatInstructions: 'Single, Married, Divorced, Widowed.',
    allowedOptions: ['Single', 'Married', 'Divorced', 'Widowed'],
    aliases: ['marital status', 'marital_status'],
  },

  // ── 3. CONTACT ──
  official_email: {
    key: 'official_email',
    label: 'Official Email',
    category: 'contact',
    templateOrder: 16,
    description: 'Institutional work email address.',
    dataType: 'email',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'rahul.sharma@school.edu.in',
    formatInstructions: 'Valid institutional email format.',
    aliases: ['official email', 'work email', 'school email', 'email', 'official_email'],
  },
  personal_email: {
    key: 'personal_email',
    label: 'Personal Email',
    category: 'contact',
    templateOrder: 17,
    description: 'Personal secondary email address.',
    dataType: 'email',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'rahul.personal@gmail.com',
    formatInstructions: 'Valid email format.',
    aliases: ['personal email', 'secondary email', 'personal_email'],
  },
  phone: {
    key: 'phone',
    label: 'Official Phone',
    category: 'contact',
    templateOrder: 18,
    description: 'Primary contact phone / mobile number.',
    dataType: 'phone',
    requiredByDefault: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '9876543210',
    formatInstructions: '10-digit mobile number or format with country code.',
    aliases: ['phone', 'mobile', 'official phone', 'contact number', 'phone number'],
  },
  personal_phone: {
    key: 'personal_phone',
    label: 'Personal / Alternate Phone',
    category: 'contact',
    templateOrder: 19,
    description: 'Alternate telephone or WhatsApp number.',
    dataType: 'phone',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9876543219',
    formatInstructions: '10-digit mobile number.',
    aliases: ['personal phone', 'alternate phone', 'alt phone', 'whatsapp number'],
  },
  emergency_contact_name: {
    key: 'emergency_contact_name',
    label: 'Emergency Contact Person',
    category: 'contact',
    templateOrder: 20,
    description: 'Name of relative or guardian in medical contingency.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Meena Sharma',
    formatInstructions: 'Full name of emergency contact.',
    aliases: ['emergency contact name', 'emergency contact person', 'emergency name'],
  },
  emergency_contact_phone: {
    key: 'emergency_contact_phone',
    label: 'Emergency Contact Phone',
    category: 'contact',
    templateOrder: 21,
    description: 'Phone number of emergency contact.',
    dataType: 'phone',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9876543218',
    formatInstructions: '10-digit mobile number.',
    aliases: ['emergency contact phone', 'emergency phone', 'emergency mobile'],
  },
  emergency_contact_relation: {
    key: 'emergency_contact_relation',
    label: 'Emergency Contact Relationship',
    category: 'contact',
    templateOrder: 22,
    description: 'Relationship with the emergency contact (e.g. Spouse, Brother).',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Spouse',
    formatInstructions: 'e.g. Spouse, Father, Mother, Brother.',
    aliases: ['emergency contact relation', 'emergency relationship', 'emergency relation'],
  },

  // ── 4. ADDRESS ──
  current_address: {
    key: 'current_address',
    label: 'Current Residential Address',
    category: 'address',
    templateOrder: 23,
    description: 'Present street address / quarters.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Flat 402, Green Avenue, Main Road',
    formatInstructions: 'Full present street address.',
    aliases: ['current address', 'present address', 'address', 'residential address'],
  },
  current_city: {
    key: 'current_city',
    label: 'Current City',
    category: 'address',
    templateOrder: 24,
    description: 'Present city or town.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Motihari',
    formatInstructions: 'City name.',
    aliases: ['current city', 'city'],
  },
  current_state: {
    key: 'current_state',
    label: 'Current State',
    category: 'address',
    templateOrder: 25,
    description: 'State / Province.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Bihar',
    formatInstructions: 'State name.',
    aliases: ['current state', 'state'],
  },
  current_pincode: {
    key: 'current_pincode',
    label: 'Current PIN Code',
    category: 'address',
    templateOrder: 26,
    description: '6-digit postal index number.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '845401',
    formatInstructions: '6-digit PIN code.',
    aliases: ['current pincode', 'pincode', 'postal code', 'zip code'],
  },

  // ── 5. QUALIFICATION ──
  highest_qualification: {
    key: 'highest_qualification',
    label: 'Highest Qualification',
    category: 'qualification',
    templateOrder: 27,
    description: 'Highest academic degree achieved.',
    dataType: 'text',
    requiredByDefault: true,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'M.Sc. Mathematics, B.Ed.',
    formatInstructions: 'e.g. M.Sc., B.Ed., M.A., Ph.D., B.Tech, MBA.',
    aliases: ['highest qualification', 'qualification', 'degrees', 'education'],
  },
  specialization: {
    key: 'specialization',
    label: 'Academic Specialization / Major',
    category: 'qualification',
    templateOrder: 28,
    description: 'Field of specialization or university major.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Mathematics & Statistics',
    formatInstructions: 'e.g. Applied Physics, English Literature, Inorganic Chemistry.',
    aliases: ['specialization', 'subject specialization', 'major', 'field of study'],
  },
  experience_years: {
    key: 'experience_years',
    label: 'Years of Experience',
    category: 'qualification',
    templateOrder: 29,
    description: 'Total professional or teaching experience in years.',
    dataType: 'number',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '8',
    formatInstructions: 'Numeric value (e.g. 8 or 8.5).',
    aliases: ['experience years', 'experience', 'total experience', 'years of experience'],
  },
  certifications: {
    key: 'certifications',
    label: 'Professional Certifications',
    category: 'qualification',
    templateOrder: 30,
    description: 'CTET, STET, CBSE Capacity Building, or IT Certifications.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'CTET Qualified (Paper II)',
    formatInstructions: 'Comma-separated certifications.',
    aliases: ['certifications', 'certification', 'teaching eligibility'],
  },

  // ── 6. TEACHING SPECIFIC ──
  primary_subject: {
    key: 'primary_subject',
    label: 'Primary Subject',
    category: 'teaching',
    templateOrder: 31,
    description: 'Main subject taught by the faculty member.',
    dataType: 'text',
    requiredByDefault: true,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Mathematics',
    formatInstructions: 'Subject catalog name (e.g. Mathematics, Physics, English).',
    aliases: ['primary subject', 'main subject', 'subject', 'subject taught'],
  },
  additional_subjects: {
    key: 'additional_subjects',
    label: 'Additional Subjects',
    category: 'teaching',
    templateOrder: 32,
    description: 'Secondary or subsidiary subjects taught.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Applied Mathematics, Statistics',
    formatInstructions: 'Comma-separated subject names.',
    aliases: ['additional subjects', 'other subjects', 'subsidiary subjects'],
  },
  classes_taught: {
    key: 'classes_taught',
    label: 'Classes / Grades Taught',
    category: 'teaching',
    templateOrder: 33,
    description: 'Grade levels or classes assigned to this teacher.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Class 9, Class 10, Class 11',
    formatInstructions: 'Comma-separated classes (e.g. Class 9, Class 10).',
    aliases: ['classes taught', 'grades taught', 'classes', 'standards taught'],
  },
  sections_taught: {
    key: 'sections_taught',
    label: 'Sections Taught',
    category: 'teaching',
    templateOrder: 34,
    description: 'Specific class sections handled.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9-A, 9-B, 10-A',
    formatInstructions: 'Comma-separated sections.',
    aliases: ['sections taught', 'sections'],
  },
  is_class_teacher: {
    key: 'is_class_teacher',
    label: 'Is Class Teacher',
    category: 'teaching',
    templateOrder: 35,
    description: 'Whether designated as a primary Class Teacher.',
    dataType: 'boolean',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Yes',
    formatInstructions: 'Yes or No.',
    aliases: ['is class teacher', 'class teacher', 'class_teacher'],
  },
  is_hod: {
    key: 'is_hod',
    label: 'Head of Department (HoD)',
    category: 'teaching',
    templateOrder: 36,
    description: 'Whether serving as Head of Department.',
    dataType: 'boolean',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'No',
    formatInstructions: 'Yes or No.',
    aliases: ['is hod', 'hod', 'head of department'],
  },
  is_coordinator: {
    key: 'is_coordinator',
    label: 'Academic Coordinator',
    category: 'teaching',
    templateOrder: 37,
    description: 'Whether serving as Section or Academic Coordinator.',
    dataType: 'boolean',
    requiredByDefault: false,
    staffTypeScope: 'TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'No',
    formatInstructions: 'Yes or No.',
    aliases: ['is coordinator', 'academic coordinator', 'coordinator'],
  },

  // ── 7. NON-TEACHING SPECIFIC ──
  job_role: {
    key: 'job_role',
    label: 'Job Role / Function',
    category: 'non_teaching',
    templateOrder: 38,
    description: 'Specific operational function or responsibilities.',
    dataType: 'text',
    requiredByDefault: true,
    staffTypeScope: 'NON_TEACHING',
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Front Office Incharge & Admissions Registrar',
    formatInstructions: 'Summary of operational mandate.',
    aliases: ['job role', 'role', 'function', 'job function'],
  },
  work_location: {
    key: 'work_location',
    label: 'Work Location / Station',
    category: 'non_teaching',
    templateOrder: 39,
    description: 'Building, room, block, or campus facility.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'NON_TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Administrative Block - Room 102',
    formatInstructions: 'Facility or room designation.',
    aliases: ['work location', 'location', 'station', 'office location'],
  },
  work_schedule: {
    key: 'work_schedule',
    label: 'Shift & Work Schedule',
    category: 'non_teaching',
    templateOrder: 40,
    description: 'Regular working hours or shift pattern.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'NON_TEACHING',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'General Shift (8:00 AM - 4:30 PM)',
    formatInstructions: 'e.g. General Shift, Morning Shift.',
    aliases: ['work schedule', 'shift', 'working hours', 'timing'],
  },

  // ── 8. PAYROLL (OPTIONAL) ──
  bank_name: {
    key: 'bank_name',
    label: 'Salary Bank Name',
    category: 'payroll',
    templateOrder: 41,
    description: 'Name of bank for salary disbursement.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'State Bank of India',
    formatInstructions: 'Bank name.',
    aliases: ['bank name', 'salary bank', 'bank'],
  },
  account_number: {
    key: 'account_number',
    label: 'Bank Account Number',
    category: 'payroll',
    templateOrder: 42,
    description: 'Beneficiary bank account number.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '38294829104',
    formatInstructions: 'Account number without hyphens.',
    aliases: ['account number', 'bank account', 'account no'],
  },
  ifsc: {
    key: 'ifsc',
    label: 'Bank IFSC Code',
    category: 'payroll',
    templateOrder: 43,
    description: '11-character Indian Financial System Code.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'SBIN0001245',
    formatInstructions: '11-character alphanumeric IFSC code.',
    aliases: ['ifsc', 'ifsc code', 'bank ifsc'],
  },
  pan: {
    key: 'pan',
    label: 'PAN Card Number',
    category: 'payroll',
    templateOrder: 44,
    description: 'Permanent Account Number for statutory tax deduction.',
    dataType: 'text',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ABCDE1234F',
    formatInstructions: '10-character PAN format (5 letters, 4 digits, 1 letter).',
    aliases: ['pan', 'pan number', 'pan card'],
  },

  // ── 9. DOCUMENTS ──
  doc_aadhaar: {
    key: 'doc_aadhaar',
    label: 'Aadhaar / National ID Proof',
    category: 'documents',
    templateOrder: 45,
    description: 'National identity verification proof.',
    dataType: 'file',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: false,
    supportsPreview: false,
    sampleValue: '',
    formatInstructions: 'PDF or JPEG document scan.',
    aliases: ['aadhaar', 'government id', 'national id proof'],
  },
  doc_degree_certificate: {
    key: 'doc_degree_certificate',
    label: 'Degree & Educational Certificate',
    category: 'documents',
    templateOrder: 46,
    description: 'Graduation / Post-Graduation / B.Ed degree certificates.',
    dataType: 'file',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: false,
    supportsPreview: false,
    sampleValue: '',
    formatInstructions: 'PDF document scan.',
    aliases: ['degree certificate', 'educational certificate', 'degree proof'],
  },
  doc_experience_certificate: {
    key: 'doc_experience_certificate',
    label: 'Experience & Relieving Certificate',
    category: 'documents',
    templateOrder: 47,
    description: 'Prior institutional experience and service credentials.',
    dataType: 'file',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: false,
    supportsPreview: false,
    sampleValue: '',
    formatInstructions: 'PDF document scan.',
    aliases: ['experience certificate', 'relieving letter', 'service certificate'],
  },
  doc_resume: {
    key: 'doc_resume',
    label: 'Curriculum Vitae / Resume',
    category: 'documents',
    templateOrder: 48,
    description: 'Complete professional CV / Resume.',
    dataType: 'file',
    requiredByDefault: false,
    staffTypeScope: 'ALL',
    supportsImport: false,
    supportsPreview: false,
    sampleValue: '',
    formatInstructions: 'PDF format.',
    aliases: ['resume', 'cv', 'curriculum vitae'],
  },
};

/** Default recommended fields enabled for any school onboarding */
export const DEFAULT_ENABLED_STAFF_FIELDS: string[] = [
  'employee_code',
  'staff_type',
  'department',
  'designation',
  'status',
  'name',
  'photo',
  'dob',
  'gender',
  'official_email',
  'phone',
  'highest_qualification',
  'specialization',
  'experience_years',
  'primary_subject',
  'classes_taught',
  'is_class_teacher',
  'joining_date',
];

/** Mandatory fields that cannot be unchecked */
export const DEFAULT_REQUIRED_STAFF_FIELDS: string[] = [
  'employee_code',
  'staff_type',
  'name',
  'department',
  'designation',
  'status',
  'phone',
];

export function getStaffFieldDefinition(key: string): StaffFieldDefinition | undefined {
  return STAFF_FIELD_DEFINITIONS[key];
}

export function getOrderedStaffFields(keys?: string[]): StaffFieldDefinition[] {
  const targetKeys = keys || Object.keys(STAFF_FIELD_DEFINITIONS);
  return targetKeys
    .map((k) => STAFF_FIELD_DEFINITIONS[k])
    .filter((def): def is StaffFieldDefinition => Boolean(def))
    .sort((a, b) => a.templateOrder - b.templateOrder);
}

export function filterFieldsByStaffType(
  fields: StaffFieldDefinition[],
  staffType: 'ALL' | 'TEACHING' | 'NON_TEACHING'
): StaffFieldDefinition[] {
  if (staffType === 'ALL') return fields;
  return fields.filter((f) => !f.staffTypeScope || f.staffTypeScope === 'ALL' || f.staffTypeScope === staffType);
}

export function normalizeStaffFacultyConfig(
  input?: Partial<StaffFacultyConfigData> | null,
  options?: { sessionYear?: string }
): StaffFacultyConfigData {
  const base = input || {};
  const enabledFields = Array.isArray(base.enabledFields) && base.enabledFields.length > 0
    ? Array.from(new Set([...DEFAULT_REQUIRED_STAFF_FIELDS, ...base.enabledFields]))
    : [...DEFAULT_ENABLED_STAFF_FIELDS];

  const requiredFields = Array.isArray(base.requiredFields) && base.requiredFields.length > 0
    ? Array.from(new Set([...DEFAULT_REQUIRED_STAFF_FIELDS, ...base.requiredFields]))
    : [...DEFAULT_REQUIRED_STAFF_FIELDS];

  return {
    ...base,
    enabledFields,
    requiredFields,
    customFields: base.customFields || [],
    activeStage: base.activeStage || 'directory',
    staffMembers: base.staffMembers || [],
    departments: base.departments || [
      'Mathematics',
      'Science',
      'Languages',
      'Social Studies',
      'Commerce',
      'Computer Science & IT',
      'Arts & Music',
      'Physical Education',
      'Pre-Primary / Foundational',
      'Administration',
    ],
  };
}

export interface ResolvedStaffField {
  key: string;
  label: string;
  category: StaffFieldCategory;
  dataType: string;
  description?: string;
  isRequired: boolean;
  isLocked?: boolean;
  isCustom: boolean;
  staffScope: 'ALL' | 'TEACHING' | 'NON_TEACHING' | 'BOTH';
  templateOrder: number;
  options?: string[];
  formatInstructions?: string;
  sampleValue?: string;
  aliases: string[];
}

export function generateSafeCustomFieldKey(label: string, existingKeys: string[] = []): string {
  let base = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!base) base = 'field';
  if (!base.startsWith('cf_')) base = `cf_${base}`;

  const forbidden = new Set([
    ...Object.keys(STAFF_FIELD_DEFINITIONS),
    ...existingKeys.map((k) => k.toLowerCase()),
  ]);

  let candidate = base;
  let counter = 2;
  while (forbidden.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter++;
  }

  return candidate;
}

export function resolveStaffFields(options: {
  config?: Partial<StaffFacultyConfigData> | null;
  customFields?: StaffCustomField[];
  staffType?: 'ALL' | 'TEACHING' | 'NON_TEACHING';
  includeInactiveCustom?: boolean;
}): ResolvedStaffField[] {
  const config = options.config || {};
  const enabledKeys = new Set(config.enabledFields || DEFAULT_ENABLED_STAFF_FIELDS);
  const requiredKeys = new Set(config.requiredFields || DEFAULT_REQUIRED_STAFF_FIELDS);
  const targetScope = options.staffType || 'ALL';

  const customFieldsPool = options.customFields || config.customFields || [];

  const categoryOrder: StaffFieldCategory[] = [
    'employment',
    'personal',
    'contact',
    'address',
    'qualification',
    'teaching',
    'non_teaching',
    'payroll',
    'documents',
    'custom',
  ];

  const resolved: ResolvedStaffField[] = [];
  let globalOrder = 1;

  for (const cat of categoryOrder) {
    // 1. First: Canonical fields in this category
    if (cat !== 'custom') {
      const canonicalInCat = Object.values(STAFF_FIELD_DEFINITIONS)
        .filter((def) => def.category === cat && enabledKeys.has(def.key))
        .sort((a, b) => a.templateOrder - b.templateOrder);

      for (const cDef of canonicalInCat) {
        if (targetScope !== 'ALL' && cDef.staffTypeScope && cDef.staffTypeScope !== 'ALL' && cDef.staffTypeScope !== targetScope) {
          continue;
        }

        resolved.push({
          key: cDef.key,
          label: cDef.label,
          category: cDef.category,
          dataType: cDef.dataType,
          description: cDef.description,
          isRequired: Boolean(cDef.lockedRequired || requiredKeys.has(cDef.key)),
          isLocked: Boolean(cDef.lockedRequired),
          isCustom: false,
          staffScope: cDef.staffTypeScope || 'ALL',
          templateOrder: globalOrder++,
          options: cDef.allowedOptions,
          formatInstructions: cDef.formatInstructions,
          sampleValue: cDef.sampleValue,
          aliases: cDef.aliases,
        });
      }
    }

    // 2. Second: Custom fields in this category
    const customInCat = customFieldsPool
      .filter((cf) => {
        if (!options.includeInactiveCustom && cf.is_active === false) return false;
        const fieldCat = cf.category || 'custom';
        return fieldCat === cat;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    for (const cf of customInCat) {
      if (targetScope !== 'ALL' && cf.staff_scope && cf.staff_scope !== 'BOTH' && cf.staff_scope !== targetScope) {
        continue;
      }

      const optionsList = Array.isArray(cf.options)
        ? cf.options
        : Array.isArray(cf.options_json)
        ? cf.options_json
        : [];

      let formatInstr = `${cf.field_type} value`;
      if (optionsList.length > 0) {
        formatInstr = `One of: ${optionsList.join(', ')}`;
      } else if (cf.field_type === 'BOOLEAN') {
        formatInstr = 'Yes or No';
      } else if (cf.field_type === 'DATE') {
        formatInstr = 'DD/MM/YYYY or YYYY-MM-DD';
      }

      resolved.push({
        key: cf.field_key,
        label: cf.field_label,
        category: cat,
        dataType: cf.field_type.toLowerCase(),
        description: cf.description || '',
        isRequired: Boolean(cf.is_required),
        isLocked: false,
        isCustom: true,
        staffScope: cf.staff_scope,
        templateOrder: globalOrder++,
        options: optionsList,
        formatInstructions: formatInstr,
        sampleValue: optionsList[0] || (cf.field_type === 'BOOLEAN' ? 'Yes' : cf.field_type === 'DATE' ? '01/01/2026' : `Sample ${cf.field_label}`),
        aliases: [
          cf.field_key,
          cf.field_label,
          cf.field_label.toLowerCase(),
          cf.field_label.replace(/\s+/g, '_').toLowerCase(),
        ],
      });
    }
  }

  return resolved;
}
