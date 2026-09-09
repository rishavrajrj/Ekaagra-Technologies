import * as XLSX from 'xlsx';
import {
  STUDENT_FIELD_DEFINITIONS,
  getStudentFieldDefinition,
  getSelectedFieldDefinitions,
  getOrderedStudentFields,
  StudentFieldDefinition,
} from './studentFieldDefinitions';
import type { AcademicStructureData, StudentCustomFieldDefinition } from './types';

export interface TemplateGenerationOptions {
  enabledFields: string[];
  requiredFields?: string[];
  academicStructure?: AcademicStructureData | null;
  schoolName?: string;
  admissionNumberFormat?: string;
  customFields?: StudentCustomFieldDefinition[];
  markRequiredHeaders?: boolean;
}

export interface SampleStudentProfile {
  admission_number: string;
  admission_date: string;
  academic_year: string;
  class_grade: string;
  section: string;
  roll_number: string;
  previous_school: string;
  previous_class: string;
  previous_admission_number: string;
  student_name: string;
  photo: string;
  dob: string;
  gender: string;
  blood_group: string;
  nationality: string;
  religion: string;
  mother_tongue: string;
  student_id_code: string;
  father_name: string;
  father_phone: string;
  father_email: string;
  mother_name: string;
  mother_phone: string;
  mother_email: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  parent_occupation: string;
  relationship_with_student: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  emergency_contact_name: string;
  emergency_contact_number: string;
  emergency_contact_relationship: string;
  emergency_contact_address: string;
  house: string;
  transport_required: string;
  transport_route: string;
  identification_type: string;
  identification_number: string;
  medical_notes: string;
  notes: string;
  doc_birth_certificate: string;
  doc_transfer_certificate: string;
  doc_government_id: string;
  doc_previous_marksheet: string;
  doc_medical_certificate: string;
  doc_other: string;
  [key: string]: string;
}

/**
 * 3 realistic fictional Indian student profiles following the exact canonical field structure.
 */
export const SAMPLE_STUDENTS: SampleStudentProfile[] = [
  {
    admission_number: 'ADM-2026-0101',
    admission_date: '02/04/2026',
    academic_year: '2026-2027',
    class_grade: 'Class 5',
    section: 'A',
    roll_number: '1',
    previous_school: 'St. Xavier High School',
    previous_class: 'Class 4',
    previous_admission_number: 'SX-8421',
    student_name: 'Aarav Kumar',
    photo: 'ADM-2026-0101.jpg',
    dob: '15/04/2015',
    gender: 'Male',
    blood_group: 'O+',
    nationality: 'Indian',
    religion: 'Hindu',
    mother_tongue: 'Hindi',
    student_id_code: 'STD-2026-0101',
    father_name: 'Rajesh Kumar',
    father_phone: '9876543210',
    father_email: 'rajesh.kumar@example.com',
    mother_name: 'Sunita Kumar',
    mother_phone: '9876543211',
    mother_email: 'sunita.kumar@example.com',
    guardian_name: 'Rajesh Kumar',
    guardian_phone: '9876543210',
    guardian_email: 'rajesh.kumar@example.com',
    parent_occupation: 'Civil Engineer',
    relationship_with_student: 'Father',
    address: '14/B Gandhi Chowk, Station Road',
    city: 'Motihari',
    state: 'Bihar',
    pincode: '845401',
    country: 'India',
    emergency_contact_name: 'Dr. S. K. Verma',
    emergency_contact_number: '9431234567',
    emergency_contact_relationship: 'Family Physician',
    emergency_contact_address: 'Main Hospital Road, Motihari',
    house: 'Tagore House (Red)',
    transport_required: 'Yes',
    transport_route: 'Route 3 — Chhatauni Bus Stand',
    identification_type: 'Aadhaar Card',
    identification_number: '1234-5678-9012',
    medical_notes: 'Mild seasonal dust allergy',
    notes: 'Merit intake applicant',
    doc_birth_certificate: 'ADM-2026-0101_birth.pdf',
    doc_transfer_certificate: 'ADM-2026-0101_tc.pdf',
    doc_government_id: 'ADM-2026-0101_id.pdf',
    doc_previous_marksheet: 'ADM-2026-0101_marks.pdf',
    doc_medical_certificate: 'ADM-2026-0101_medical.pdf',
    doc_other: 'ADM-2026-0101_other.pdf',
  },
  {
    admission_number: 'ADM-2026-0102',
    admission_date: '05/04/2026',
    academic_year: '2026-2027',
    class_grade: 'Class 6',
    section: 'B',
    roll_number: '14',
    previous_school: 'Delhi Public School',
    previous_class: 'Class 5',
    previous_admission_number: 'DPS-9021',
    student_name: 'Ananya Singh',
    photo: 'ADM-2026-0102.jpg',
    dob: '22/08/2014',
    gender: 'Female',
    blood_group: 'B+',
    nationality: 'Indian',
    religion: 'Hindu',
    mother_tongue: 'Hindi',
    student_id_code: 'STD-2026-0102',
    father_name: 'Amit Singh',
    father_phone: '9876543220',
    father_email: 'amit.singh@example.com',
    mother_name: 'Priyanka Singh',
    mother_phone: '9876543221',
    mother_email: 'priyanka.singh@example.com',
    guardian_name: 'Amit Singh',
    guardian_phone: '9876543220',
    guardian_email: 'amit.singh@example.com',
    parent_occupation: 'Bank Manager',
    relationship_with_student: 'Father',
    address: 'Flat 402, Royal Residency, Belbanwa',
    city: 'Motihari',
    state: 'Bihar',
    pincode: '845401',
    country: 'India',
    emergency_contact_name: 'Rameshwar Singh',
    emergency_contact_number: '9431234588',
    emergency_contact_relationship: 'Grandfather',
    emergency_contact_address: 'Belbanwa, Motihari',
    house: 'Ashoka House (Blue)',
    transport_required: 'No',
    transport_route: 'Self Commute / Walking',
    identification_type: 'Aadhaar Card',
    identification_number: '2345-6789-0123',
    medical_notes: 'None reported',
    notes: 'Sibling in Class 9 (Aryan Singh)',
    doc_birth_certificate: 'ADM-2026-0102_birth.pdf',
    doc_transfer_certificate: 'ADM-2026-0102_tc.pdf',
    doc_government_id: 'ADM-2026-0102_id.pdf',
    doc_previous_marksheet: 'ADM-2026-0102_marks.pdf',
    doc_medical_certificate: 'ADM-2026-0102_medical.pdf',
    doc_other: '',
  },
  {
    admission_number: 'ADM-2026-0103',
    admission_date: '08/04/2026',
    academic_year: '2026-2027',
    class_grade: 'Class 5',
    section: 'B',
    roll_number: '22',
    previous_school: 'Kendriya Vidyalaya',
    previous_class: 'Class 4',
    previous_admission_number: 'KV-3310',
    student_name: 'Vihaan Sharma',
    photo: 'ADM-2026-0103.jpg',
    dob: '10/11/2015',
    gender: 'Male',
    blood_group: 'A+',
    nationality: 'Indian',
    religion: 'Hindu',
    mother_tongue: 'Hindi',
    student_id_code: 'STD-2026-0103',
    father_name: 'Manoj Sharma',
    father_phone: '9876543230',
    father_email: 'manoj.sharma@example.com',
    mother_name: 'Reena Sharma',
    mother_phone: '9876543231',
    mother_email: 'reena.sharma@example.com',
    guardian_name: 'Manoj Sharma',
    guardian_phone: '9876543230',
    guardian_email: 'manoj.sharma@example.com',
    parent_occupation: 'High School Teacher',
    relationship_with_student: 'Father',
    address: 'Near Old Bus Stand, Balua Bazar',
    city: 'Motihari',
    state: 'Bihar',
    pincode: '845401',
    country: 'India',
    emergency_contact_name: 'Reena Sharma',
    emergency_contact_number: '9876543231',
    emergency_contact_relationship: 'Mother',
    emergency_contact_address: 'Balua Bazar, Motihari',
    house: 'Raman House (Green)',
    transport_required: 'Yes',
    transport_route: 'Route 1 — Balua Chowk',
    identification_type: 'Aadhaar Card',
    identification_number: '3456-7890-1234',
    medical_notes: 'Wears corrective glasses (-1.5D)',
    notes: 'Staff ward concession applicant',
    doc_birth_certificate: 'ADM-2026-0103_birth.pdf',
    doc_transfer_certificate: 'ADM-2026-0103_tc.pdf',
    doc_government_id: 'ADM-2026-0103_id.pdf',
    doc_previous_marksheet: 'ADM-2026-0103_marks.pdf',
    doc_medical_certificate: 'ADM-2026-0103_medical.pdf',
    doc_other: '',
  },
];

/**
 * Converts 0-based column index to Excel column letter (0 -> 'A', 25 -> 'Z', 26 -> 'AA', etc.)
 */
export function getColumnLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

// Precomputed CRC32 table for pure TypeScript ZIP reconstruction
const CRC32_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC32_TABLE[i] = c;
}

function calculateCrc32(buf: Uint8Array): number {
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ CRC32_TABLE[(c ^ buf[i]) & 0xFF];
  }
  return (c ^ (-1)) >>> 0;
}

export interface ListsOptionsData {
  genders: string[];
  bloodGroups: string[];
  transportOptions: string[];
  academicYears: string[];
  classes: string[];
  sections: string[];
  idTypes: string[];
  houses: string[];
}

/**
 * Extracts and compiles dropdown options dynamically from the school's actual Academic Setup configuration.
 */
export function extractListsOptions(
  academicStructure?: AcademicStructureData | null,
  options?: TemplateGenerationOptions
): ListsOptionsData {
  const configuredClasses =
    academicStructure?.classes?.map((c) => c.name || c.className).filter((n): n is string => Boolean(n)) || [];

  const configuredSections = Array.from(
    new Set(
      academicStructure?.classes?.flatMap((c) =>
        (c.sections || []).map((s) => (typeof s === 'string' ? s : s.name))
      ) || []
    )
  ).filter((s): s is string => Boolean(s));

  const sessionYear = academicStructure?.currentAcademicSession || '2026-2027';

  return {
    genders: ['Male', 'Female', 'Other'],
    bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    transportOptions: ['Yes', 'No'],
    academicYears: [sessionYear, '2025-2026', '2027-2028'],
    classes: configuredClasses.length > 0 ? configuredClasses : ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
    sections: configuredSections.length > 0 ? configuredSections : ['A', 'B', 'C', 'D'],
    idTypes: ['Aadhaar Card', 'APAAR / PEN', 'Passport', 'Birth Certificate ID'],
    houses: ['Tagore House (Red)', 'Ashoka House (Blue)', 'Raman House (Green)', 'Kalam House (Yellow)'],
  };
}

/**
 * Generates the 4-Sheet Excel Workbook:
 * Sheet 1: Student Data (Main entry table with title metadata rows, locked Admission Number & Student Name visibility)
 * Sheet 2: Instructions & Rules (Comprehensive guidance strictly ordered by canonical templateOrder)
 * Sheet 3: Sample Data (3 realistic fictional students matching configured classes/sections)
 * Sheet 4: Lists & Options (Dynamically populated validation source lists)
 */
export function generateStudentExcelWorkbook(options: TemplateGenerationOptions): XLSX.WorkBook {
  const { enabledFields, requiredFields = [], academicStructure, schoolName = 'Demo Public School', customFields } = options;
  // Selected definitions strictly ordered by canonical templateOrder (system fields 1..51, custom fields 52+)
  const selectedDefs = getSelectedFieldDefinitions(enabledFields, customFields);
  const requiredSet = new Set(requiredFields);
  const listsData = extractListsOptions(academicStructure, options);
  const sessionYear = academicStructure?.currentAcademicSession || '2026-2027';

  // Identify any custom fields that have dropdown / selection options
  const customDropdownFields = selectedDefs.filter(
    (d) => d.isCustom && d.allowedOptions && d.allowedOptions.length > 0
  );

  // ==========================================================================
  // SHEET 1: Student Data
  // ==========================================================================
  // Row 1: School Name
  // Row 2: STUDENT MASTER DATA IMPORT TEMPLATE
  // Row 3: Academic Session & metadata
  // Row 4: Usage Instructions banner
  // Row 5: Data Table Headers (Ordered strictly by canonical templateOrder)
  const headerLabels = selectedDefs.map((def) => {
    if (options.markRequiredHeaders) {
      const isRequired = requiredSet.has(def.key) || def.lockedRequired === true;
      return isRequired ? `${def.label} ★` : def.label;
    }
    return def.label;
  });

  const studentDataAoa: any[][] = [
    [schoolName.toUpperCase()],
    ['STUDENT MASTER DATA IMPORT TEMPLATE'],
    [`Academic Session: ${sessionYear} | Active Fields: ${selectedDefs.length} | Generated: ${new Date().toLocaleDateString('en-IN')}`],
    ['Instructions: Enter 1 student per row below row 5. Do not modify or rename column headers in row 5. Save and upload this file.'],
    headerLabels,
  ];

  const studentDataSheet = XLSX.utils.aoa_to_sheet(studentDataAoa);

  // Column widths based on header length and expected content
  studentDataSheet['!cols'] = selectedDefs.map((def) => ({
    wch: Math.max(def.label.length + 5, 18),
  }));

  // ==========================================================================
  // SHEET 2: Instructions & Rules
  // ==========================================================================
  const instructionsHeader = [
    'Section',
    'Field Name',
    'Required Status',
    'Data Type',
    'Example Value',
    'Allowed Values & Guidance',
  ];

  const instructionsRows = selectedDefs.map((def) => {
    const isLocked = def.lockedRequired === true;
    const isRequired = requiredSet.has(def.key) || isLocked;
    let guidance = def.description;

    if (def.key === 'class_grade') {
      guidance += ` Configured in Academic Setup: ${listsData.classes.join(', ')}.`;
    } else if (def.key === 'section') {
      guidance += ` Configured sections: ${listsData.sections.join(', ')}.`;
    } else if (def.allowedOptions && def.allowedOptions.length > 0) {
      guidance += ` Options: ${def.allowedOptions.join(' | ')}.`;
    } else if (def.key === 'photo') {
      guidance += ' Name the image file matching your admission number (e.g. ADM-2026-0101.jpg). Upload photos in batch during import.';
    } else if (def.dataType === 'date') {
      guidance += ' Use DD/MM/YYYY format (e.g. 15/04/2015).';
    } else if (def.dataType === 'phone') {
      guidance += ' 10-digit Indian mobile number without prefix (e.g. 9876543210).';
    }

    let sectionName = 'Additional Information';
    if (def.isCustom) {
      const matchedCustom = customFields?.find((cf) => cf.field_key === def.key);
      sectionName = matchedCustom?.section_name || 'Custom Fields';
    } else {
      sectionName =
        def.category === 'academic'
          ? 'Academic & Admission'
          : def.category === 'personal' || def.category === 'basic'
          ? 'Personal Information'
          : def.category === 'parent'
          ? 'Parent / Guardian'
          : def.category === 'address'
          ? 'Residential Address'
          : def.category === 'emergency'
          ? 'Emergency Information'
          : def.category === 'additional'
          ? 'Additional Information'
          : 'Certificates & Documents';
    }

    return [
      sectionName,
      def.label,
      isLocked ? 'LOCKED REQUIRED (Mandatory)' : isRequired ? 'REQUIRED (Mandatory)' : 'OPTIONAL',
      def.formatInstructions,
      def.sampleValue,
      guidance,
    ];
  });

  const instructionsSheet = XLSX.utils.aoa_to_sheet([instructionsHeader, ...instructionsRows]);
  instructionsSheet['!cols'] = [
    { wch: 26 },
    { wch: 28 },
    { wch: 26 },
    { wch: 32 },
    { wch: 25 },
    { wch: 65 },
  ];

  // ==========================================================================
  // SHEET 3: Sample Data
  // ==========================================================================
  const sampleClass1 = listsData.classes[0] || 'Class 5';
  const sampleClass2 = listsData.classes[1] || listsData.classes[0] || 'Class 6';
  const sampleSec1 = listsData.sections[0] || 'A';
  const sampleSec2 = listsData.sections[1] || listsData.sections[0] || 'B';

  const adaptedSampleStudents: SampleStudentProfile[] = [
    {
      ...SAMPLE_STUDENTS[0],
      class_grade: sampleClass1,
      section: sampleSec1,
      academic_year: sessionYear,
    },
    {
      ...SAMPLE_STUDENTS[1],
      class_grade: sampleClass2,
      section: sampleSec2,
      academic_year: sessionYear,
    },
    {
      ...SAMPLE_STUDENTS[2],
      class_grade: sampleClass1,
      section: sampleSec2,
      academic_year: sessionYear,
    },
  ];

  const sampleRows = adaptedSampleStudents.map((student) => {
    return selectedDefs.map((def) => {
      return student[def.key] ?? def.sampleValue ?? '';
    });
  });

  const sampleSheet = XLSX.utils.aoa_to_sheet([
    ['SAMPLE DATA — DO NOT IMPORT (FOR DEMONSTRATION PURPOSES ONLY)'],
    headerLabels,
    ...sampleRows,
  ]);
  sampleSheet['!cols'] = selectedDefs.map((def) => ({
    wch: Math.max(def.label.length + 5, 18),
  }));

  // ==========================================================================
  // SHEET 4: Lists & Options (Dropdown source values)
  // ==========================================================================
  const listHeaders = [
    'Gender',
    'Blood Group',
    'Transport Required',
    'Academic Year',
    'Class / Grade',
    'Section',
    'Identification Type',
    'House',
    ...customDropdownFields.map((cf) => cf.label),
  ];

  const customMaxRows = customDropdownFields.reduce(
    (max, cf) => Math.max(max, (cf.allowedOptions || []).length),
    0
  );

  const maxListRows = Math.max(
    listsData.genders.length,
    listsData.bloodGroups.length,
    listsData.transportOptions.length,
    listsData.academicYears.length,
    listsData.classes.length,
    listsData.sections.length,
    listsData.idTypes.length,
    listsData.houses.length,
    customMaxRows
  );

  const listsAoa: any[][] = [listHeaders];
  for (let r = 0; r < maxListRows; r++) {
    const row = [
      listsData.genders[r] || '',
      listsData.bloodGroups[r] || '',
      listsData.transportOptions[r] || '',
      listsData.academicYears[r] || '',
      listsData.classes[r] || '',
      listsData.sections[r] || '',
      listsData.idTypes[r] || '',
      listsData.houses[r] || '',
    ];

    // Append custom dropdown options
    for (const cf of customDropdownFields) {
      row.push(cf.allowedOptions?.[r] || '');
    }

    listsAoa.push(row);
  }

  const listsSheet = XLSX.utils.aoa_to_sheet(listsAoa);
  listsSheet['!cols'] = listHeaders.map(() => ({ wch: 24 }));

  // ==========================================================================
  // Build Final Workbook
  // ==========================================================================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, studentDataSheet, 'Student Data');
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions & Rules');
  XLSX.utils.book_append_sheet(workbook, sampleSheet, 'Sample Data');
  XLSX.utils.book_append_sheet(workbook, listsSheet, 'Lists & Options');

  return workbook;
}

/**
 * Post-processes the XLSX binary buffer in pure TypeScript to inject:
 * 1. Freeze Panes (Header row 5 and Column A for Admission Number)
 * 2. Table AutoFilter on row 5
 * 3. Native Excel Data Validations referencing the 'Lists & Options' sheet
 */
export function enhanceExcelBuffer(
  rawBuffer: Uint8Array,
  selectedDefs: StudentFieldDefinition[],
  listsData: ListsOptionsData
): Uint8Array {
  // Mapping of field key to column on Lists & Options sheet and row count
  const listSheetMap: Record<string, { colLetter: string; count: number }> = {
    gender: { colLetter: 'A', count: listsData.genders.length },
    blood_group: { colLetter: 'B', count: listsData.bloodGroups.length },
    transport_required: { colLetter: 'C', count: listsData.transportOptions.length },
    academic_year: { colLetter: 'D', count: listsData.academicYears.length },
    class_grade: { colLetter: 'E', count: listsData.classes.length },
    section: { colLetter: 'F', count: listsData.sections.length },
    identification_type: { colLetter: 'G', count: listsData.idTypes.length },
    house: { colLetter: 'H', count: listsData.houses.length },
  };

  // Map any custom dropdown fields to subsequent columns on Lists & Options sheet (I, J, K...)
  const customDropdownFields = selectedDefs.filter(
    (d) => d.isCustom && d.allowedOptions && d.allowedOptions.length > 0
  );

  customDropdownFields.forEach((cf, idx) => {
    const colLetter = getColumnLetter(8 + idx); // Column 8 is 'I'
    listSheetMap[cf.key] = {
      colLetter,
      count: cf.allowedOptions!.length,
    };
  });

  // Identify which columns in Sheet 1 (Student Data) receive data validation
  const validationsXmlList: string[] = [];

  selectedDefs.forEach((def, colIdx) => {
    const listInfo = listSheetMap[def.key];
    if (listInfo && listInfo.count > 0) {
      const colLetter = getColumnLetter(colIdx);
      const sqref = `${colLetter}6:${colLetter}1000`;
      const formula = `&apos;Lists &amp; Options&apos;!$${listInfo.colLetter}$2:$${listInfo.colLetter}$${listInfo.count + 1}`;
      validationsXmlList.push(
        `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${sqref}"><formula1>${formula}</formula1></dataValidation>`
      );
    }
  });

  const lastColLetter = getColumnLetter(selectedDefs.length - 1);

  // Parse zip entries
  let pos = 0;
  const entries: {
    name: string;
    modTime: number;
    modDate: number;
    data: Uint8Array;
    crc: number;
    size: number;
  }[] = [];

  const view = new DataView(rawBuffer.buffer, rawBuffer.byteOffset, rawBuffer.byteLength);

  while (pos < rawBuffer.length) {
    if (pos + 4 > rawBuffer.length) break;
    const sig = view.getUint32(pos, true);

    if (sig === 0x04034b50) {
      // Local file header
      const modTime = view.getUint16(pos + 10, true);
      const modDate = view.getUint16(pos + 12, true);
      const compSize = view.getUint32(pos + 18, true);
      const nameLen = view.getUint16(pos + 26, true);
      const extraLen = view.getUint16(pos + 28, true);

      const nameBytes = rawBuffer.subarray(pos + 30, pos + 30 + nameLen);
      const name = new TextDecoder().decode(nameBytes);

      const dataStart = pos + 30 + nameLen + extraLen;
      const dataEnd = dataStart + compSize;
      let data = rawBuffer.subarray(dataStart, dataEnd);

      if (name === 'xl/worksheets/sheet1.xml') {
        let xml = new TextDecoder().decode(data);

        // 1. Inject Freeze Panes: freezes top 5 rows and column A (Admission Number)
        const freezeXml =
          '<sheetView workbookViewId="0"><pane ySplit="5" xSplit="1" topLeftCell="B6" activePane="bottomRight" state="frozen"/></sheetView>';

        xml = xml.replace(
          /<sheetView workbookViewId="0"\/>|<sheetView workbookViewId="0">[\s\S]*?<\/sheetView>/,
          freezeXml
        );

        // 2. Inject AutoFilter on row 5
        const autoFilterXml = `<autoFilter ref="A5:${lastColLetter}5"/>`;
        if (!xml.includes('<autoFilter')) {
          xml = xml.replace('</sheetData>', `</sheetData>${autoFilterXml}`);
        }

        // 3. Inject Data Validations
        if (validationsXmlList.length > 0) {
          const dvXml = `<dataValidations count="${validationsXmlList.length}">${validationsXmlList.join('')}</dataValidations>`;
          xml = xml.replace('</worksheet>', `${dvXml}</worksheet>`);
        }

        data = new TextEncoder().encode(xml);
      }

      entries.push({
        name,
        modTime,
        modDate,
        data,
        crc: calculateCrc32(data),
        size: data.length,
      });

      pos = dataEnd;
    } else {
      break;
    }
  }

  if (entries.length === 0) {
    return rawBuffer;
  }

  // Rebuild ZIP with uncompressed STORE entries (standard OpenXML)
  const localChunks: Uint8Array[] = [];
  const cdChunks: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = new TextEncoder().encode(entry.name);
    const localHeader = new Uint8Array(30);
    const lView = new DataView(localHeader.buffer);

    lView.setUint32(0, 0x04034b50, true);
    lView.setUint16(4, 20, true); // version needed: 2.0
    lView.setUint16(6, 0, true);  // flags
    lView.setUint16(8, 0, true);  // compression = 0 (STORE)
    lView.setUint16(10, entry.modTime, true);
    lView.setUint16(12, entry.modDate, true);
    lView.setUint32(14, entry.crc, true);
    lView.setUint32(18, entry.size, true); // comp size
    lView.setUint32(22, entry.size, true); // uncomp size
    lView.setUint16(26, nameBytes.length, true);
    lView.setUint16(28, 0, true); // extra length

    localChunks.push(localHeader, nameBytes, entry.data);

    const cdHeader = new Uint8Array(46);
    const cView = new DataView(cdHeader.buffer);

    cView.setUint32(0, 0x02014b50, true);
    cView.setUint16(4, 20, true); // version made by
    cView.setUint16(6, 20, true); // version needed
    cView.setUint16(8, 0, true);  // flags
    cView.setUint16(10, 0, true); // compression
    cView.setUint16(12, entry.modTime, true);
    cView.setUint16(14, entry.modDate, true);
    cView.setUint32(16, entry.crc, true);
    cView.setUint32(20, entry.size, true);
    cView.setUint32(24, entry.size, true);
    cView.setUint16(28, nameBytes.length, true);
    cView.setUint16(30, 0, true); // extra length
    cView.setUint16(32, 0, true); // comment length
    cView.setUint16(34, 0, true); // disk num
    cView.setUint16(36, 0, true); // internal attrs
    cView.setUint32(38, 0, true); // external attrs
    cView.setUint32(42, offset, true); // local header offset

    cdChunks.push(cdHeader, nameBytes);

    offset += 30 + nameBytes.length + entry.size;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of cdChunks) cdSize += c.length;

  const eocd = new Uint8Array(22);
  const eView = new DataView(eocd.buffer);
  eView.setUint32(0, 0x06054b50, true);
  eView.setUint16(4, 0, true);
  eView.setUint16(6, 0, true);
  eView.setUint16(8, entries.length, true);
  eView.setUint16(10, entries.length, true);
  eView.setUint32(12, cdSize, true);
  eView.setUint32(16, cdStart, true);
  eView.setUint16(20, 0, true);

  const totalLen = offset + cdSize + 22;
  const result = new Uint8Array(totalLen);
  let writeOffset = 0;

  for (const chunk of [...localChunks, ...cdChunks, eocd]) {
    result.set(chunk, writeOffset);
    writeOffset += chunk.length;
  }

  return result;
}

/**
 * Generates an Excel (.xlsx) file buffer ready for download with freeze panes and data validation dropdowns.
 */
export function generateStudentExcelBuffer(options: TemplateGenerationOptions): Uint8Array {
  const workbook = generateStudentExcelWorkbook(options);
  const arrayBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const rawUint8 = new Uint8Array(arrayBuffer);

  const selectedDefs = getSelectedFieldDefinitions(options.enabledFields, options.customFields);
  const listsData = extractListsOptions(options.academicStructure, options);

  try {
    return enhanceExcelBuffer(rawUint8, selectedDefs, listsData);
  } catch (enhanceErr) {
    console.warn('[EXCEL ENHANCE WARN] Falling back to standard workbook buffer:', enhanceErr);
    return rawUint8;
  }
}

/**
 * Escapes a cell value for CSV (RFC 4180).
 */
function escapeCsvCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates a clean UTF-8 CSV string with BOM strictly following canonical templateOrder.
 */
export function generateStudentCsvTemplate(options: TemplateGenerationOptions): string {
  const { enabledFields, customFields } = options;
  const selectedDefs = getSelectedFieldDefinitions(enabledFields, customFields);
  const headers = selectedDefs.map((def) => escapeCsvCell(def.label)).join(',');
  // \uFEFF ensures UTF-8 BOM so Excel opens Indian languages and characters cleanly
  return `\uFEFF${headers}\r\n`;
}

/**
 * Generates a sample CSV with realistic student rows strictly following canonical templateOrder.
 */
export function generateSampleStudentCsv(options: TemplateGenerationOptions): string {
  const { enabledFields, academicStructure, customFields } = options;
  const selectedDefs = getSelectedFieldDefinitions(enabledFields, customFields);
  const headerLine = selectedDefs.map((def) => escapeCsvCell(def.label)).join(',');
  const sessionYear = academicStructure?.currentAcademicSession || '2026-2027';

  const rows = SAMPLE_STUDENTS.map((student) => {
    const adaptedStudent: Record<string, any> = {
      ...student,
      academic_year: sessionYear,
    };
    return selectedDefs
      .map((def) => escapeCsvCell(adaptedStudent[def.key] ?? def.sampleValue ?? ''))
      .join(',');
  });

  return `\uFEFF${headerLine}\r\n${rows.join('\r\n')}\r\n`;
}
