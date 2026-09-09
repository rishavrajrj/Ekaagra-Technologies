import type {
  StudentConfigData,
  Student,
  StudentCustomFieldDefinition,
  StudentCustomSection,
  StudentCustomFieldType,
} from './types';

export type StudentFieldCategory =
  | 'academic'
  | 'personal'
  | 'basic' // Backward-compatible alias for 'personal'
  | 'parent'
  | 'address'
  | 'emergency'
  | 'additional'
  | 'documents'
  | (string & {});

export interface StudentFieldDefinition {
  key: string;
  label: string;
  category: StudentFieldCategory;
  /**
   * Canonical template/display order:
   * - System fields: 1 to 51
   * - Custom fields: 52+
   * Note: The field-definition category structure is an application/data model concern.
   * The templateOrder is the human-facing import and data-entry sequence concern.
   * This distinction is intentional and must be preserved across all components.
   */
  templateOrder: number;
  description: string;
  dataType: 'text' | 'date' | 'select' | 'email' | 'phone' | 'number' | 'image' | 'file' | 'boolean';
  requiredByDefault: boolean;
  lockedRequired?: boolean; // Cannot be made optional or disabled (Admission Number, Student Name)
  supportsImport: boolean;
  supportsPreview: boolean;
  sampleValue: string;
  formatInstructions: string;
  aliases: string[]; // Variations for robust header matching
  allowedOptions?: string[];
  options?: string[];
  isCustom?: boolean;
  customDefinitionId?: string;
}

export interface CategoryInfo {
  id: StudentFieldCategory;
  title: string;
  description: string;
  iconName: string;
  order: number;
}

/**
 * The canonical human-facing category ordering:
 * 1. Academic & Admission Information
 * 2. Personal Information
 * 3. Parent / Guardian Information
 * 4. Residential Address
 * 5. Emergency Information
 * 6. Additional Information
 * 7. Certificates & Documents
 */
export const STUDENT_FIELD_CATEGORIES: CategoryInfo[] = [
  {
    id: 'academic',
    title: 'Academic & Admission Information',
    description: 'Admission number, dates, academic session, class, section, and prior schooling.',
    iconName: 'GraduationCap',
    order: 1,
  },
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Student name, portrait photograph, date of birth, gender, and personal identity.',
    iconName: 'User',
    order: 2,
  },
  {
    id: 'parent',
    title: 'Parent / Guardian Information',
    description: 'Father, mother, or legal guardian details and contacts.',
    iconName: 'Users',
    order: 3,
  },
  {
    id: 'address',
    title: 'Residential Address',
    description: 'Permanent or correspondence address for postal and transport.',
    iconName: 'MapPin',
    order: 4,
  },
  {
    id: 'emergency',
    title: 'Emergency Information',
    description: 'Designated contact in medical or urgent contingencies.',
    iconName: 'ShieldAlert',
    order: 5,
  },
  {
    id: 'additional',
    title: 'Additional Information',
    description: 'House system, transport requirement, ID numbers and medical notes.',
    iconName: 'Sparkles',
    order: 6,
  },
  {
    id: 'documents',
    title: 'Certificates & Documents',
    description: 'Verification documents and statutory admission records.',
    iconName: 'FileText',
    order: 7,
  },
];

export const STUDENT_FIELD_DEFINITIONS: StudentFieldDefinition[] = [
  // ==========================================================================
  // SECTION 1 — ACADEMIC & ADMISSION INFORMATION (Order 1 - 9)
  // ==========================================================================
  {
    key: 'admission_number',
    label: 'Admission Number',
    category: 'academic',
    templateOrder: 1,
    description: 'Unique institutional admission/enrollment number assigned to the student. Primary business identifier.',
    dataType: 'text',
    requiredByDefault: true,
    lockedRequired: true,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'ADM-2026-0101',
    formatInstructions: 'Unique admission number (e.g. ADM-2026-0101)',
    aliases: [
      'admission number',
      'admission no',
      'admission_number',
      'adm no',
      'adm_no',
      'adm. no.',
      'enrollment no',
      'scholar no',
      'gr no',
    ],
  },
  {
    key: 'admission_date',
    label: 'Admission Date',
    category: 'academic',
    templateOrder: 2,
    description: 'Date the student was formally admitted to the school.',
    dataType: 'date',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '01/04/2026',
    formatInstructions: 'Date formatted as DD/MM/YYYY',
    aliases: ['admission date', 'joining date', 'admission_date', 'date of admission'],
  },
  {
    key: 'academic_year',
    label: 'Academic Year',
    category: 'academic',
    templateOrder: 3,
    description: 'Current academic session for admission/enrollment.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '2026-2027',
    formatInstructions: 'Session format (e.g. 2026-2027)',
    aliases: ['academic year', 'session', 'academic_year', 'academic session', 'year'],
  },
  {
    key: 'class_grade',
    label: 'Class / Grade',
    category: 'academic',
    templateOrder: 4,
    description: 'Class or Grade the student is admitted into (matches Academic Setup).',
    dataType: 'text',
    requiredByDefault: true,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Class 5',
    formatInstructions: 'Must match a class configured in Academic Setup (e.g. Class 5, Grade 5, or 5)',
    aliases: ['class', 'grade', 'class / grade', 'standard', 'class_grade', 'std'],
  },
  {
    key: 'section',
    label: 'Section',
    category: 'academic',
    templateOrder: 5,
    description: 'Class section assigned to the student (matches Academic Setup).',
    dataType: 'text',
    requiredByDefault: true,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'A',
    formatInstructions: 'Must match a section configured in Academic Setup (e.g. A, B, C)',
    aliases: ['section', 'sec', 'class section', 'division'],
  },
  {
    key: 'roll_number',
    label: 'Roll Number',
    category: 'academic',
    templateOrder: 6,
    description: 'Assigned classroom roll number.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '1',
    formatInstructions: 'Integer or code (e.g. 1 or 5A-01)',
    aliases: ['roll number', 'roll no', 'roll_number', 'roll_no', 'roll'],
  },
  {
    key: 'previous_school',
    label: 'Previous School',
    category: 'academic',
    templateOrder: 7,
    description: 'Name of the previous educational institution attended.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'St. Xavier School, Motihari',
    formatInstructions: 'School name (e.g. St. Xavier High School)',
    aliases: ['previous school', 'last school', 'previous_school', 'school attended'],
  },
  {
    key: 'previous_class',
    label: 'Previous Class',
    category: 'academic',
    templateOrder: 8,
    description: 'Last class passed at previous school.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Class 4',
    formatInstructions: 'Class passed (e.g. Class 4)',
    aliases: ['previous class', 'last class', 'previous_class', 'class passed'],
  },
  {
    key: 'previous_admission_number',
    label: 'Previous Admission Number',
    category: 'academic',
    templateOrder: 9,
    description: 'Admission/scholar number at previous school.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'SX-8421',
    formatInstructions: 'Previous admission number',
    aliases: ['previous admission number', 'previous adm no', 'previous_admission_number'],
  },

  // ==========================================================================
  // SECTION 2 — PERSONAL INFORMATION (Order 10 - 18)
  // ==========================================================================
  {
    key: 'student_name',
    label: 'Student Name',
    category: 'personal',
    templateOrder: 10,
    description: 'Full legal name of the student as per birth record. Primary human-readable identifier.',
    dataType: 'text',
    requiredByDefault: true,
    lockedRequired: true,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Aarav Kumar',
    formatInstructions: 'Full name (e.g. Aarav Kumar or Aarav Singh)',
    aliases: [
      'student name',
      'name',
      'student_name',
      'full name',
      'candidate name',
      'student',
      'student fullname',
      'student full name',
    ],
  },
  {
    key: 'photo',
    label: 'Student Photo',
    category: 'personal',
    templateOrder: 11,
    description: 'Portrait passport photograph filename (e.g. ADM-2026-0101.jpg). Uploaded separately during import.',
    dataType: 'image',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'ADM-2026-0101.jpg',
    formatInstructions: 'Image filename matching photo upload (e.g. ADM-2026-0101.jpg)',
    aliases: ['student photo', 'photo', 'picture', 'student_photo', 'photo filename', 'image', 'avatar'],
  },
  {
    key: 'dob',
    label: 'Date of Birth',
    category: 'personal',
    templateOrder: 12,
    description: 'Official date of birth of the student.',
    dataType: 'date',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '15/04/2015',
    formatInstructions: 'Date formatted as DD/MM/YYYY (e.g. 15/04/2015) or YYYY-MM-DD',
    aliases: ['date of birth', 'dob', 'birth date', 'birth_date', 'date_of_birth', 'd.o.b'],
  },
  {
    key: 'gender',
    label: 'Gender',
    category: 'personal',
    templateOrder: 13,
    description: 'Gender identity of the student.',
    dataType: 'select',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Male',
    formatInstructions: 'Male, Female, or Other',
    allowedOptions: ['Male', 'Female', 'Other'],
    aliases: ['gender', 'sex', 'student gender'],
  },
  {
    key: 'blood_group',
    label: 'Blood Group',
    category: 'personal',
    templateOrder: 14,
    description: 'Blood group of the student for medical records.',
    dataType: 'select',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'O+',
    formatInstructions: 'A+, A-, B+, B-, AB+, AB-, O+, O-',
    allowedOptions: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    aliases: ['blood group', 'blood_group', 'blood type', 'bg'],
  },
  {
    key: 'nationality',
    label: 'Nationality',
    category: 'personal',
    templateOrder: 15,
    description: 'Nationality / Citizenship of the student.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Indian',
    formatInstructions: 'Country citizenship (default: Indian)',
    aliases: ['nationality', 'citizenship'],
  },
  {
    key: 'religion',
    label: 'Religion',
    category: 'personal',
    templateOrder: 16,
    description: 'Religious community for statutory reporting.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Hindu',
    formatInstructions: 'Hindu, Muslim, Sikh, Christian, Jain, Buddhist, or Other',
    aliases: ['religion', 'faith', 'community'],
  },
  {
    key: 'mother_tongue',
    label: 'Mother Tongue',
    category: 'personal',
    templateOrder: 17,
    description: 'Primary language spoken at home.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Hindi',
    formatInstructions: 'Primary language (e.g. Hindi, English, Bhojpuri, Bengali)',
    aliases: ['mother tongue', 'mother_tongue', 'first language', 'native language'],
  },
  {
    key: 'student_id_code',
    label: 'Student ID Code',
    category: 'personal',
    templateOrder: 18,
    description: 'Unique institutional student ID code (generated automatically by default).',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: false, // Excluded from editable template by default if auto-generated
    supportsPreview: true,
    sampleValue: 'STD-2026-0101',
    formatInstructions: 'Institutional student ID (e.g. STD-2026-0101)',
    aliases: ['student id code', 'student id', 'student_id', 'student_id_code', 'std id'],
  },

  // ==========================================================================
  // SECTION 3 — PARENT / GUARDIAN INFORMATION (Order 19 - 29)
  // ==========================================================================
  {
    key: 'father_name',
    label: "Father's Name",
    category: 'parent',
    templateOrder: 19,
    description: "Full legal name of student's father.",
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Rajesh Kumar',
    formatInstructions: 'Full name (e.g. Rajesh Kumar)',
    aliases: ["father's name", 'father name', 'father_name', 'father', 'fathers name'],
  },
  {
    key: 'father_phone',
    label: "Father's Phone",
    category: 'parent',
    templateOrder: 20,
    description: 'Mobile number for SMS and WhatsApp communications.',
    dataType: 'phone',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: '9876543210',
    formatInstructions: '10-digit mobile number (e.g. 9876543210)',
    aliases: [
      "father's phone",
      'father phone',
      'father_phone',
      'father mobile',
      'fathers mobile',
      'father contact',
      'mobile',
      'phone',
      'mobile no',
      'contact no',
    ],
  },
  {
    key: 'father_email',
    label: "Father's Email",
    category: 'parent',
    templateOrder: 21,
    description: 'Email address for fee receipts and notices.',
    dataType: 'email',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'rajesh.kumar@example.com',
    formatInstructions: 'Valid email address',
    aliases: ["father's email", 'father email', 'father_email', 'fathers email'],
  },
  {
    key: 'mother_name',
    label: "Mother's Name",
    category: 'parent',
    templateOrder: 22,
    description: "Full legal name of student's mother.",
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Sunita Kumar',
    formatInstructions: 'Full name (e.g. Sunita Kumar)',
    aliases: ["mother's name", 'mother name', 'mother_name', 'mother', 'mothers name'],
  },
  {
    key: 'mother_phone',
    label: "Mother's Phone",
    category: 'parent',
    templateOrder: 23,
    description: "Mobile number of student's mother.",
    dataType: 'phone',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9876543211',
    formatInstructions: '10-digit mobile number (e.g. 9876543211)',
    aliases: ["mother's phone", 'mother phone', 'mother_phone', 'mother mobile', 'mothers mobile', 'mother contact'],
  },
  {
    key: 'mother_email',
    label: "Mother's Email",
    category: 'parent',
    templateOrder: 24,
    description: "Email address of student's mother.",
    dataType: 'email',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'sunita.kumar@example.com',
    formatInstructions: 'Valid email address',
    aliases: ["mother's email", 'mother email', 'mother_email', 'mothers email'],
  },
  {
    key: 'guardian_name',
    label: 'Guardian Name',
    category: 'parent',
    templateOrder: 25,
    description: 'Name of legal guardian (if applicable).',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Rajesh Kumar',
    formatInstructions: 'Full name',
    aliases: ['guardian name', 'guardian_name', 'local guardian', 'guardian'],
  },
  {
    key: 'guardian_phone',
    label: 'Guardian Phone',
    category: 'parent',
    templateOrder: 26,
    description: 'Contact phone of guardian.',
    dataType: 'phone',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9876543210',
    formatInstructions: '10-digit mobile number',
    aliases: ['guardian phone', 'guardian_phone', 'guardian mobile', 'local guardian phone'],
  },
  {
    key: 'guardian_email',
    label: 'Guardian Email',
    category: 'parent',
    templateOrder: 27,
    description: 'Email address of legal guardian.',
    dataType: 'email',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'rajesh.kumar@example.com',
    formatInstructions: 'Valid email address',
    aliases: ['guardian email', 'guardian_email'],
  },
  {
    key: 'parent_occupation',
    label: 'Parent Occupation',
    category: 'parent',
    templateOrder: 28,
    description: 'Profession/employment of primary earning parent.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Civil Engineer',
    formatInstructions: 'Profession / Business description',
    aliases: ['parent occupation', 'father occupation', 'occupation', 'parent_occupation'],
  },
  {
    key: 'relationship_with_student',
    label: 'Relationship With Student',
    category: 'parent',
    templateOrder: 29,
    description: 'Relationship of primary guardian to student.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Father',
    formatInstructions: 'Father, Mother, Uncle, Grandparent, Guardian',
    aliases: ['relationship with student', 'guardian relationship', 'parent relationship'],
  },

  // ==========================================================================
  // SECTION 4 — RESIDENTIAL ADDRESS (Order 30 - 34)
  // ==========================================================================
  {
    key: 'address',
    label: 'Address',
    category: 'address',
    templateOrder: 30,
    description: 'Street address / House number / Locality.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '14/B Gandhi Chowk, Station Road',
    formatInstructions: 'House number, street, locality',
    aliases: ['address', 'street address', 'residential address', 'permanent address'],
  },
  {
    key: 'city',
    label: 'City',
    category: 'address',
    templateOrder: 31,
    description: 'City or town of residence.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Motihari',
    formatInstructions: 'City / District name',
    aliases: ['city', 'town', 'district'],
  },
  {
    key: 'state',
    label: 'State',
    category: 'address',
    templateOrder: 32,
    description: 'State / Province of residence.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Bihar',
    formatInstructions: 'State name (e.g. Bihar, Uttar Pradesh, Delhi)',
    aliases: ['state', 'province', 'state_province'],
  },
  {
    key: 'pincode',
    label: 'Pincode',
    category: 'address',
    templateOrder: 33,
    description: 'Postal ZIP/PIN code.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '845401',
    formatInstructions: '6-digit Indian Postal PIN code (e.g. 845401)',
    aliases: ['pincode', 'pin code', 'pin', 'postal code', 'zip', 'zipcode'],
  },
  {
    key: 'country',
    label: 'Country',
    category: 'address',
    templateOrder: 34,
    description: 'Country of residence.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'India',
    formatInstructions: 'Country name (default: India)',
    aliases: ['country', 'nation'],
  },

  // ==========================================================================
  // SECTION 5 — EMERGENCY INFORMATION (Order 35 - 38)
  // ==========================================================================
  {
    key: 'emergency_contact_name',
    label: 'Emergency Contact Name',
    category: 'emergency',
    templateOrder: 35,
    description: 'Name of person to contact in medical or school contingencies.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Dr. S. K. Verma',
    formatInstructions: 'Full name',
    aliases: ['emergency contact name', 'emergency contact', 'emergency name', 'emergency_contact_name'],
  },
  {
    key: 'emergency_contact_number',
    label: 'Emergency Contact Number',
    category: 'emergency',
    templateOrder: 36,
    description: 'Emergency telephone or mobile number.',
    dataType: 'phone',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '9431234567',
    formatInstructions: '10-digit mobile or telephone number',
    aliases: [
      'emergency contact number',
      'emergency phone',
      'emergency mobile',
      'emergency_contact_number',
      'emergency contact phone',
    ],
  },
  {
    key: 'emergency_contact_relationship',
    label: 'Relationship',
    category: 'emergency',
    templateOrder: 37,
    description: 'Relationship of emergency contact to the student.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Family Physician / Uncle',
    formatInstructions: 'Relationship (e.g. Uncle, Neighbor, Physician)',
    aliases: [
      'emergency contact relationship',
      'emergency relation',
      'emergency_contact_relationship',
      'emergency relationship',
      'relationship',
    ],
  },
  {
    key: 'emergency_contact_address',
    label: 'Emergency Contact Address',
    category: 'emergency',
    templateOrder: 38,
    description: 'Address of emergency contact.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Main Hospital Road, Motihari',
    formatInstructions: 'Physical location of emergency contact',
    aliases: ['emergency contact address', 'emergency address', 'emergency_contact_address'],
  },

  // ==========================================================================
  // SECTION 6 — ADDITIONAL INFORMATION (Order 39 - 45)
  // ==========================================================================
  {
    key: 'house',
    label: 'House',
    category: 'additional',
    templateOrder: 39,
    description: 'School institutional house assigned for sports and competitions.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: 'Tagore House (Red)',
    formatInstructions: 'Institutional house name',
    aliases: ['house', 'school house', 'house name', 'color house'],
  },
  {
    key: 'transport_required',
    label: 'Transport Required',
    category: 'additional',
    templateOrder: 40,
    description: 'Whether student utilizes school bus/van fleet service.',
    dataType: 'boolean',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Yes',
    formatInstructions: 'Yes or No',
    allowedOptions: ['Yes', 'No'],
    aliases: ['transport required', 'transport', 'bus required', 'school transport', 'bus service'],
  },
  {
    key: 'transport_route',
    label: 'Transport Route',
    category: 'additional',
    templateOrder: 41,
    description: 'Assigned bus route / pickup stop.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Route 3 — Chhatauni Bus Stand',
    formatInstructions: 'Bus route code or pickup stop name',
    aliases: ['transport route', 'route', 'bus route', 'pickup point', 'stop name'],
  },
  {
    key: 'identification_type',
    label: 'Identification Type',
    category: 'additional',
    templateOrder: 42,
    description: 'Government identity type (e.g. Aadhaar Card, APAAR / PEN).',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Aadhaar Card',
    formatInstructions: 'Aadhaar Card, APAAR / PEN, Passport, Birth Certificate ID',
    allowedOptions: ['Aadhaar Card', 'APAAR / PEN', 'Passport', 'Birth Certificate ID'],
    aliases: ['identification type', 'id type', 'gov id type'],
  },
  {
    key: 'identification_number',
    label: 'Aadhaar / Government ID',
    category: 'additional',
    templateOrder: 43,
    description: 'Unique government registration number.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: '1234-5678-9012',
    formatInstructions: '12-digit Aadhaar or government ID number',
    aliases: [
      'aadhaar / government id',
      'aadhar / government id',
      'aadhaar',
      'aadhar',
      'aadhar number',
      'aadhaar number',
      'id number',
      'government id',
      'uid',
      'pen',
      'apaar',
    ],
  },
  {
    key: 'medical_notes',
    label: 'Medical Notes',
    category: 'additional',
    templateOrder: 44,
    description: 'Known allergies, chronic conditions, or physical requirements.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Mild seasonal dust allergy',
    formatInstructions: 'Medical alerts, allergies, dietary constraints',
    aliases: ['medical notes', 'medical history', 'allergies', 'health notes', 'medical'],
  },
  {
    key: 'notes',
    label: 'Notes / Remarks',
    category: 'additional',
    templateOrder: 45,
    description: 'Special intake remarks, fee concession category, or notes.',
    dataType: 'text',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'Merit intake applicant',
    formatInstructions: 'General notes',
    aliases: ['notes / remarks', 'notes', 'remarks', 'comments', 'additional notes'],
  },

  // ==========================================================================
  // SECTION 7 — CERTIFICATES & DOCUMENTS (Order 46 - 51)
  // ==========================================================================
  {
    key: 'doc_birth_certificate',
    label: 'Birth Certificate',
    category: 'documents',
    templateOrder: 46,
    description: 'Municipal or statutory birth certificate record filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_birth.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_birth.pdf)',
    aliases: ['birth certificate', 'doc_birth_certificate', 'dob certificate', 'birth cert'],
  },
  {
    key: 'doc_transfer_certificate',
    label: 'Transfer Certificate',
    category: 'documents',
    templateOrder: 47,
    description: 'TC from previously recognized school filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_tc.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_tc.pdf)',
    aliases: ['transfer certificate', 'tc', 'doc_transfer_certificate', 'school tc'],
  },
  {
    key: 'doc_government_id',
    label: 'Government ID',
    category: 'documents',
    templateOrder: 48,
    description: 'Aadhaar or national identity document scan filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_id.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_id.pdf)',
    aliases: ['government id', 'aadhaar copy', 'id proof', 'doc_government_id'],
  },
  {
    key: 'doc_previous_marksheet',
    label: 'Previous School Certificate',
    category: 'documents',
    templateOrder: 49,
    description: 'Final marksheet/report card of the last qualifying class filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_marks.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_marks.pdf)',
    aliases: ['previous school certificate', 'previous marksheet', 'report card', 'doc_previous_marksheet'],
  },
  {
    key: 'doc_medical_certificate',
    label: 'Medical Certificate',
    category: 'documents',
    templateOrder: 50,
    description: 'Physician fitness or immunization chart filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_medical.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_medical.pdf)',
    aliases: ['medical certificate', 'fitness certificate', 'immunization record', 'doc_medical_certificate'],
  },
  {
    key: 'doc_other',
    label: 'Other Document',
    category: 'documents',
    templateOrder: 51,
    description: 'Any supplementary document (e.g. caste certificate, residential proof) filename.',
    dataType: 'file',
    requiredByDefault: false,
    supportsImport: true,
    supportsPreview: false,
    sampleValue: 'ADM-2026-0101_other.pdf',
    formatInstructions: 'Document filename matching upload (e.g. ADM-2026-0101_other.pdf)',
    aliases: ['other document', 'supplementary document', 'doc_other', 'additional certificate'],
  },
];

/** Default initially selected enabled fields for standard school onboarding in canonical order */
export const DEFAULT_ENABLED_STUDENT_FIELDS: string[] = [
  'admission_number',
  'academic_year',
  'class_grade',
  'section',
  'roll_number',
  'student_name',
  'photo',
  'dob',
  'gender',
  'blood_group',
  'father_name',
  'father_phone',
  'address',
  'city',
  'pincode',
];

/** Default mandatory fields for import validation in canonical order */
export const DEFAULT_REQUIRED_STUDENT_FIELDS: string[] = [
  'admission_number',
  'class_grade',
  'section',
  'student_name',
];

/**
 * Reserved keys corresponding to the 51 canonical system fields.
 * Custom fields must never use these keys.
 */
export const RESERVED_SYSTEM_FIELD_KEYS = new Set<string>(
  STUDENT_FIELD_DEFINITIONS.map((def) => def.key)
);

/**
 * Generates a clean, unique snake_case field key with 'custom_' prefix.
 * If key already exists in existingKeys, appends suffix '_2', '_3', etc.
 */
export function generateCustomFieldKey(fieldName: string, existingKeys: string[] = []): string {
  const baseSlug = (fieldName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const safeBase = baseSlug.length > 0 ? baseSlug : 'field';
  const prefixKey = safeBase.startsWith('custom_') ? safeBase : `custom_${safeBase}`;

  const existingSet = new Set(existingKeys.map((k) => k.toLowerCase()));
  if (!existingSet.has(prefixKey)) {
    return prefixKey;
  }

  let counter = 2;
  while (existingSet.has(`${prefixKey}_${counter}`)) {
    counter++;
  }
  return `${prefixKey}_${counter}`;
}

/**
 * Builds comprehensive aliases for robust header matching of custom fields.
 */
export function buildCustomFieldAliases(fieldName: string, fieldKey: string): string[] {
  const aliases = new Set<string>();
  const nameTrimmed = (fieldName || '').trim();
  if (nameTrimmed) {
    aliases.add(nameTrimmed);
    aliases.add(nameTrimmed.toLowerCase());
    aliases.add(nameTrimmed.replace(/\s+/g, '_'));
    aliases.add(nameTrimmed.replace(/\s+/g, '-'));
    aliases.add(nameTrimmed.replace(/\s+/g, ' '));
  }
  if (fieldKey) {
    aliases.add(fieldKey);
    aliases.add(fieldKey.toLowerCase());
    aliases.add(fieldKey.replace(/^custom_/, ''));
    aliases.add(fieldKey.replace(/^custom_/, '').replace(/_/g, ' '));
  }
  return Array.from(aliases).filter(Boolean);
}

/**
 * Generates sample value appropriate for custom field type.
 */
function getCustomFieldSampleValue(customDef: StudentCustomFieldDefinition): string {
  if (customDef.default_value !== undefined && customDef.default_value !== null && String(customDef.default_value).length > 0) {
    return String(customDef.default_value);
  }
  if (customDef.options && customDef.options.length > 0) {
    return customDef.options[0];
  }

  switch (customDef.field_type) {
    case 'number':
      return '101';
    case 'date':
      return '15/04/2026';
    case 'phone':
      return '9876543210';
    case 'email':
      return 'student@example.com';
    case 'url':
      return 'https://example.com';
    case 'yes_no':
      return 'Yes';
    case 'dropdown':
    case 'multi_select':
      return customDef.options?.[0] || 'Option 1';
    case 'long_text':
      return 'Additional student notes and information.';
    case 'image':
      return `${customDef.field_key}.jpg`;
    case 'file':
      return `${customDef.field_key}.pdf`;
    case 'text':
    default: {
      const nameLower = (customDef.field_name || (customDef as any).field_label || '').toLowerCase();
      if (nameLower.includes('sibling')) return 'Amit Kumar';
      if (nameLower.includes('scholarship')) return 'SCH-2026-1042';
      if (nameLower.includes('house')) return 'Blue';
      if (nameLower.includes('hobby')) return 'Reading / Cricket';
      return `${customDef.field_name || (customDef as any).field_label || 'Value'} Sample`;
    }
  }
}

/**
 * Converts an admin-created custom field definition into a full StudentFieldDefinition.
 */
export function customFieldToFieldDefinition(
  customDef: StudentCustomFieldDefinition,
  assignedOrder: number
): StudentFieldDefinition {
  const dataTypeMap: Record<StudentCustomFieldType, StudentFieldDefinition['dataType']> = {
    text: 'text',
    long_text: 'text',
    number: 'number',
    date: 'date',
    phone: 'phone',
    email: 'email',
    url: 'text',
    dropdown: 'select',
    multi_select: 'select',
    yes_no: 'boolean',
    image: 'image',
    file: 'file',
  };

  const name = customDef.field_name || (customDef as any).field_label || 'Custom Field';
  const category = (customDef.section_key || (customDef as any).custom_section_id || 'additional') as StudentFieldCategory;

  return {
    key: customDef.field_key,
    label: name,
    category,
    templateOrder: assignedOrder,
    description: customDef.help_text || `Custom school field: ${name}`,
    dataType: dataTypeMap[customDef.field_type] || 'text',
    requiredByDefault: customDef.is_required === true,
    lockedRequired: false,
    supportsImport: true,
    supportsPreview: true,
    sampleValue: getCustomFieldSampleValue(customDef),
    formatInstructions:
      customDef.placeholder ||
      (customDef.field_type === 'dropdown'
        ? `Select from: ${(customDef.options || []).join(', ')}`
        : customDef.field_type === 'date'
        ? 'DD/MM/YYYY'
        : 'Enter value'),
    aliases: buildCustomFieldAliases(name, customDef.field_key),
    allowedOptions: customDef.options,
    options: customDef.options,
    isCustom: true,
    customDefinitionId: customDef.id,
  };
}

/**
 * Returns all student field definitions:
 * - 51 canonical system fields (templateOrder 1..51) ALWAYS first.
 * - Active custom fields (templateOrder 52+) appended and sorted by display_order.
 */
export function getStudentFieldDefinitions(
  customFields?: StudentCustomFieldDefinition[],
  includeInactive = false
): StudentFieldDefinition[] {
  const systemDefs = [...STUDENT_FIELD_DEFINITIONS];
  if (!customFields || customFields.length === 0) {
    return systemDefs;
  }

  const filteredCustom = includeInactive
    ? [...customFields]
    : customFields.filter((cf) => cf.is_active !== false);

  // Sort custom fields deterministically among themselves
  filteredCustom.sort((a, b) => (a.display_order || 52) - (b.display_order || 52));

  const customDefs = filteredCustom.map((cf, idx) =>
    customFieldToFieldDefinition(cf, 52 + idx)
  );

  return [...systemDefs, ...customDefs];
}

/**
 * Returns single field definition by key from system fields or custom fields.
 */
export function getStudentFieldDefinition(
  key: string,
  customFields?: StudentCustomFieldDefinition[]
): StudentFieldDefinition | undefined {
  const allDefs = getStudentFieldDefinitions(customFields, true);
  return allDefs.find((f) => f.key === key);
}

/**
 * Single source of truth for sorting field definitions by canonical templateOrder:
 * 1. System fields (1..51) always appear first.
 * 2. Custom fields (52+) appear after system fields.
 */
export function sortStudentFieldsByTemplateOrder(fields: StudentFieldDefinition[]): StudentFieldDefinition[] {
  return [...fields].sort((a, b) => {
    const aIsCustom = a.isCustom === true || a.templateOrder >= 52;
    const bIsCustom = b.isCustom === true || b.templateOrder >= 52;

    if (!aIsCustom && bIsCustom) return -1;
    if (aIsCustom && !bIsCustom) return 1;

    return a.templateOrder - b.templateOrder;
  });
}

/**
 * Single source of truth for sorting field keys by canonical templateOrder.
 * Supports custom fields without stripping them.
 */
export function getOrderedStudentFields(
  fieldKeys: string[],
  customFields?: StudentCustomFieldDefinition[]
): string[] {
  const allDefs = getStudentFieldDefinitions(customFields, true);
  const defMap = new Map<string, StudentFieldDefinition>();
  allDefs.forEach((d) => defMap.set(d.key, d));

  return [...new Set(fieldKeys)]
    .filter((k) => defMap.has(k))
    .sort((a, b) => (defMap.get(a)!.templateOrder) - (defMap.get(b)!.templateOrder));
}

/**
 * Returns fields in a category strictly sorted by canonical templateOrder.
 * Transparently maps legacy category 'basic' to 'personal'.
 */
export function getFieldsByCategory(
  category: StudentFieldCategory,
  customFields?: StudentCustomFieldDefinition[]
): StudentFieldDefinition[] {
  const targetCategory = category === 'basic' ? 'personal' : category;
  const allDefs = getStudentFieldDefinitions(customFields);
  const filtered = allDefs.filter(
    (f) => f.category === targetCategory || (targetCategory === 'personal' && f.category === 'basic')
  );
  return sortStudentFieldsByTemplateOrder(filtered);
}

/**
 * Returns definitions for the given selected enabled fields,
 * strictly ordered by canonical templateOrder regardless of input array order.
 */
export function getSelectedFieldDefinitions(
  enabledFields: string[],
  customFields?: StudentCustomFieldDefinition[]
): StudentFieldDefinition[] {
  const allDefs = getStudentFieldDefinitions(customFields);
  const set = new Set(enabledFields);
  const matched = allDefs.filter((def) => set.has(def.key));
  return sortStudentFieldsByTemplateOrder(matched);
}

/**
 * Returns all student categories:
 * - 7 canonical categories (order 1..7) ALWAYS first.
 * - Active custom sections (order 8+) appended strictly after canonical categories.
 */
export function getAllStudentCategories(customSections?: StudentCustomSection[]): CategoryInfo[] {
  const categories = [...STUDENT_FIELD_CATEGORIES];
  if (!customSections || customSections.length === 0) return categories;

  const activeCustomSections = customSections
    .filter((s) => s.is_active !== false)
    .sort((a, b) => (a.display_order || 8) - (b.display_order || 8));

  activeCustomSections.forEach((cs, idx) => {
    categories.push({
      id: cs.section_key as StudentFieldCategory,
      title: cs.section_name,
      description: `Custom school section for ${cs.section_name}.`,
      iconName: 'Sparkles',
      order: 8 + idx,
    });
  });

  return categories;
}

/**
 * Normalizes StudentConfigData, self-healing missing fields, enforcing locked required fields,
 * and ensuring enabled and required field lists strictly adhere to canonical templateOrder.
 */
export function normalizeStudentConfig(
  raw?: Partial<StudentConfigData> | null,
  context?: { sessionYear?: string }
): StudentConfigData {
  const current = raw || {};
  const customFields = Array.isArray(current.customFields) ? current.customFields : [];
  const customSections = Array.isArray(current.customSections) ? current.customSections : [];

  // 1. Ensure enabled fields has at least default fields
  let enabledFields = Array.isArray(current.enabledFields) && current.enabledFields.length > 0
    ? [...current.enabledFields]
    : [...DEFAULT_ENABLED_STUDENT_FIELDS];

  // Locked core fields must always be enabled
  if (!enabledFields.includes('admission_number')) enabledFields.push('admission_number');
  if (!enabledFields.includes('student_name')) enabledFields.push('student_name');

  // Sort enabled fields strictly by canonical order (including active custom fields)
  enabledFields = getOrderedStudentFields(enabledFields, customFields);

  // 2. Ensure required fields contains locked fields and is a subset of enabled fields
  let requiredFields = Array.isArray(current.requiredFields) && current.requiredFields.length > 0
    ? [...current.requiredFields]
    : [...DEFAULT_REQUIRED_STUDENT_FIELDS];

  if (!requiredFields.includes('admission_number')) requiredFields.push('admission_number');
  if (!requiredFields.includes('student_name')) requiredFields.push('student_name');

  // Filter required fields to only those currently enabled
  requiredFields = requiredFields.filter((k) => enabledFields.includes(k));

  // Sort required fields strictly by canonical order (including active custom fields)
  requiredFields = getOrderedStudentFields(requiredFields, customFields);

  return {
    estimatedStudentCount: typeof current.estimatedStudentCount === 'number' ? current.estimatedStudentCount : 550,
    students: Array.isArray(current.students) ? current.students : [],
    studentIdFormat: current.studentIdFormat || 'STD-{{YEAR}}-{{NUM}}',
    admissionNumberFormat: current.admissionNumberFormat || 'ADM-{{YEAR}}-{{NUM}}',
    rollNumberSystem: current.rollNumberSystem || 'section_wise',
    houseSystemEnabled: current.houseSystemEnabled !== false,
    houseNames: Array.isArray(current.houseNames) && current.houseNames.length > 0
      ? current.houseNames
      : ['Tagore House (Red)', 'Ashoka House (Blue)', 'Raman House (Green)', 'Kalam House (Yellow)'],
    reservationCategories: current.reservationCategories || ['General', 'OBC', 'SC', 'ST', 'EWS'],
    studentCategories: current.studentCategories || ['Regular Student', 'RTE Beneficiary', 'Sibling Discount', 'Staff Ward'],
    requiredStudentFields: current.requiredStudentFields || [],
    requiredDocumentTypes: current.requiredDocumentTypes || [],
    studentPhotoRequired: current.studentPhotoRequired ?? enabledFields.includes('photo'),
    parentGuardianRequirements: current.parentGuardianRequirements || [],
    siblingTrackingEnabled: current.siblingTrackingEnabled !== false,
    alumniTrackingEnabled: current.alumniTrackingEnabled !== false,
    migrationRequired: current.migrationRequired !== false,
    enabledFields,
    requiredFields,
    activeStage: current.activeStage || 1,
    lastImportSummary: current.lastImportSummary,
    customFields,
    customSections,
  };
}
