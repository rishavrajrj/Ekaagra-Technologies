import assert from 'assert';
import * as XLSX from 'xlsx';
import sharp from 'sharp';
import {
  STUDENT_FIELD_CATEGORIES,
  STUDENT_FIELD_DEFINITIONS,
  getStudentFieldDefinition,
  getFieldsByCategory,
  getSelectedFieldDefinitions,
  getOrderedStudentFields,
  sortStudentFieldsByTemplateOrder,
  normalizeStudentConfig,
  DEFAULT_ENABLED_STUDENT_FIELDS,
  DEFAULT_REQUIRED_STUDENT_FIELDS,
  generateCustomFieldKey,
  buildCustomFieldAliases,
  customFieldToFieldDefinition,
  getAllStudentCategories,
} from '../studentFieldDefinitions';
import {
  generateStudentExcelWorkbook,
  generateStudentExcelBuffer,
  generateStudentCsvTemplate,
  generateSampleStudentCsv,
  extractListsOptions,
  SAMPLE_STUDENTS,
} from '../studentTemplateGenerator';
import {
  matchHeadersWithFields,
  parseAndValidateDate,
  isValidPhoneNumber,
  isValidEmail,
  validateStudentRecords,
  generateErrorReportWorkbook,
  parseUploadedFileBuffer,
} from '../studentValidationService';
import {
  validateCustomFieldName,
  validateCustomFieldValue,
  canDeleteCustomField,
  canChangeCustomFieldType,
} from '../studentCustomFieldService';
import {
  optimizeAndStoreStudentPhoto,
  MAX_STUDENT_PHOTO_SIZE_BYTES,
} from '../studentPhotoOptimizer';
import { calculateIntakeCompleteness } from '../schoolIntake';
import type { AcademicStructureData, UniversalIntakeData, StudentCustomFieldDefinition, StudentCustomSection } from '../types';

async function runTests() {
  console.log('======================================================');
  console.log('TEST SUITE: Student Information & Structured Import Workflow');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // 1. Field Definitions Catalog Integrity & Canonical Ordering (1 - 51)
  // --------------------------------------------------------------------------
  console.log('1. Verifying Field Definitions Catalog Integrity & Master Order...');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES.length, 7, 'Must have exactly 7 categories');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[0].id, 'academic', 'Category 1 must be Academic & Admission');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[1].id, 'personal', 'Category 2 must be Personal Information');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[2].id, 'parent', 'Category 3 must be Parent / Guardian');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[3].id, 'address', 'Category 4 must be Residential Address');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[4].id, 'emergency', 'Category 5 must be Emergency Information');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[5].id, 'additional', 'Category 6 must be Additional Information');
  assert.strictEqual(STUDENT_FIELD_CATEGORIES[6].id, 'documents', 'Category 7 must be Certificates & Documents');

  assert.strictEqual(STUDENT_FIELD_DEFINITIONS.length, 51, 'Must have exactly 51 defined student fields');

  const keys = new Set<string>();
  const orders = new Set<number>();

  STUDENT_FIELD_DEFINITIONS.forEach((def) => {
    assert(!keys.has(def.key), `Duplicate field key detected: ${def.key}`);
    keys.add(def.key);
    assert(!orders.has(def.templateOrder), `Duplicate templateOrder detected: ${def.templateOrder} on ${def.key}`);
    orders.add(def.templateOrder);
    assert(def.templateOrder >= 1 && def.templateOrder <= 51, `templateOrder out of bounds: ${def.templateOrder}`);
    assert(def.label && def.label.trim().length > 0, `Field ${def.key} missing label`);
    assert(def.category, `Field ${def.key} missing category`);
    assert(def.dataType, `Field ${def.key} missing dataType`);
  });

  // Verify specific canonical positions
  const admNoDef = getStudentFieldDefinition('admission_number');
  assert(admNoDef && admNoDef.templateOrder === 1, 'Admission Number must have templateOrder = 1');
  assert(admNoDef.lockedRequired === true, 'Admission Number must be locked required');

  const admDateDef = getStudentFieldDefinition('admission_date');
  assert(admDateDef && admDateDef.templateOrder === 2, 'Admission Date must have templateOrder = 2');

  const acadYearDef = getStudentFieldDefinition('academic_year');
  assert(acadYearDef && acadYearDef.templateOrder === 3, 'Academic Year must have templateOrder = 3');

  const classDef = getStudentFieldDefinition('class_grade');
  assert(classDef && classDef.templateOrder === 4, 'Class / Grade must have templateOrder = 4');

  const secDef = getStudentFieldDefinition('section');
  assert(secDef && secDef.templateOrder === 5, 'Section must have templateOrder = 5');

  const rollDef = getStudentFieldDefinition('roll_number');
  assert(rollDef && rollDef.templateOrder === 6, 'Roll Number must have templateOrder = 6');

  const studentNameDef = getStudentFieldDefinition('student_name');
  assert(studentNameDef && studentNameDef.templateOrder === 10, 'Student Name must have templateOrder = 10');
  assert(studentNameDef.lockedRequired === true, 'Student Name must be locked required');

  const photoDef = getStudentFieldDefinition('photo');
  assert(photoDef && photoDef.templateOrder === 11, 'Student Photo must have templateOrder = 11');

  const dobDef = getStudentFieldDefinition('dob');
  assert(dobDef && dobDef.templateOrder === 12, 'Date of Birth must have templateOrder = 12');

  const fatherNameDef = getStudentFieldDefinition('father_name');
  assert(fatherNameDef && fatherNameDef.templateOrder === 19, "Father's Name must have templateOrder = 19");

  const addressDef = getStudentFieldDefinition('address');
  assert(addressDef && addressDef.templateOrder === 30, 'Address must have templateOrder = 30');

  const emerDef = getStudentFieldDefinition('emergency_contact_name');
  assert(emerDef && emerDef.templateOrder === 35, 'Emergency Contact Name must have templateOrder = 35');

  const houseDef = getStudentFieldDefinition('house');
  assert(houseDef && houseDef.templateOrder === 39, 'House must have templateOrder = 39');

  const birthCertDef = getStudentFieldDefinition('doc_birth_certificate');
  assert(birthCertDef && birthCertDef.templateOrder === 46, 'Birth Certificate must have templateOrder = 46');

  const otherDocDef = getStudentFieldDefinition('doc_other');
  assert(otherDocDef && otherDocDef.templateOrder === 51, 'Other Document must have templateOrder = 51');

  console.log('✓ All 51 fields with strictly ordered templateOrder (1..51) verified.\n');

  // --------------------------------------------------------------------------
  // 2. Canonical Sorting Utilities & Selection Order Independence
  // --------------------------------------------------------------------------
  console.log('2. Testing Selection Order Independence & Canonical Sorting...');
  // Deliberately shuffled / reversed array of selected keys
  const shuffledSelection = [
    'doc_birth_certificate',
    'father_phone',
    'student_name',
    'pincode',
    'admission_number',
    'gender',
    'section',
    'class_grade',
  ];

  const orderedKeys = getOrderedStudentFields(shuffledSelection);
  assert.strictEqual(orderedKeys[0], 'admission_number', 'Admission Number must always be sorted first');
  assert.strictEqual(orderedKeys[1], 'class_grade');
  assert.strictEqual(orderedKeys[2], 'section');
  assert.strictEqual(orderedKeys[3], 'student_name');
  assert.strictEqual(orderedKeys[4], 'gender');
  assert.strictEqual(orderedKeys[5], 'father_phone');
  assert.strictEqual(orderedKeys[6], 'pincode');
  assert.strictEqual(orderedKeys[7], 'doc_birth_certificate', 'Document must be sorted last');

  const selectedDefsSorted = getSelectedFieldDefinitions(shuffledSelection);
  assert.strictEqual(selectedDefsSorted[0].key, 'admission_number');
  assert.strictEqual(selectedDefsSorted[selectedDefsSorted.length - 1].key, 'doc_birth_certificate');

  // Verify disabled fields are excluded
  const partialSelection = ['admission_number', 'student_name'];
  const partialDefs = getSelectedFieldDefinitions(partialSelection);
  assert.strictEqual(partialDefs.length, 2);
  assert(!partialDefs.some((d) => d.key === 'dob'));

  console.log('✓ Selection order never affects generated canonical ordering.\n');

  // --------------------------------------------------------------------------
  // 3. Normalization & Locked Core Field Protection
  // --------------------------------------------------------------------------
  console.log('3. Testing Normalization & Locked Required Field Protection...');
  // User attempts to provide empty or malicious config omitting locked core fields
  const emptyNorm = normalizeStudentConfig({});
  assert(emptyNorm.enabledFields?.includes('admission_number'), 'Must include admission_number');
  assert(emptyNorm.enabledFields?.includes('student_name'), 'Must include student_name');
  assert(emptyNorm.requiredFields?.includes('admission_number'), 'admission_number must be locked required');
  assert(emptyNorm.requiredFields?.includes('student_name'), 'student_name must be locked required');
  assert.strictEqual(emptyNorm.enabledFields[0], 'admission_number', 'First enabled field must be admission_number');

  // User attempts to craft an API payload that makes locked fields optional
  const tamperedConfig = normalizeStudentConfig({
    enabledFields: ['dob', 'gender'],
    requiredFields: [], // empty required fields
  });
  assert(tamperedConfig.enabledFields?.includes('admission_number'), 'Self-heals admission_number');
  assert(tamperedConfig.enabledFields?.includes('student_name'), 'Self-heals student_name');
  assert(tamperedConfig.requiredFields?.includes('admission_number'), 'Locks admission_number required');
  assert(tamperedConfig.requiredFields?.includes('student_name'), 'Locks student_name required');

  console.log('✓ Locked required fields cannot be disabled or made optional.\n');

  // --------------------------------------------------------------------------
  // 4. 4-Sheet Professional Excel Workbook & Dynamic Lists & Options
  // --------------------------------------------------------------------------
  console.log('4. Testing 4-Sheet Excel Workbook & Dynamic Lists & Options...');
  const mockAcademicStructure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    classes: [
      {
        name: 'Class 5',
        sortOrder: 5,
        sections: ['A', 'B'],
      },
      {
        name: 'Class 6',
        sortOrder: 6,
        sections: ['A', 'B', 'C'],
      },
    ],
  };

  const testEnabledFields = [
    'student_name', // deliberately shuffled
    'admission_number',
    'admission_date',
    'academic_year',
    'class_grade',
    'section',
    'roll_number',
    'photo',
    'dob',
    'gender',
    'blood_group',
    'father_name',
    'father_phone',
    'address',
    'city',
    'state',
    'pincode',
    'emergency_contact_name',
    'emergency_contact_number',
    'transport_required',
    'doc_birth_certificate',
  ];

  const wb = generateStudentExcelWorkbook({
    enabledFields: testEnabledFields,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section'],
    academicStructure: mockAcademicStructure,
    schoolName: 'Roshani Public School',
  });

  // Verify exact 4 sheets
  assert.strictEqual(wb.SheetNames.length, 4, 'Workbook must contain exactly 4 sheets');
  assert.strictEqual(wb.SheetNames[0], 'Student Data');
  assert.strictEqual(wb.SheetNames[1], 'Instructions & Rules');
  assert.strictEqual(wb.SheetNames[2], 'Sample Data');
  assert.strictEqual(wb.SheetNames[3], 'Lists & Options');

  // Sheet 1: Student Data Headers in Row 5 (index 4)
  const sheet1 = wb.Sheets['Student Data'];
  const sheet1Data: any[][] = XLSX.utils.sheet_to_json(sheet1, { header: 1 });
  assert.strictEqual(sheet1Data[0][0], 'ROSHANI PUBLIC SCHOOL');
  assert.strictEqual(sheet1Data[1][0], 'STUDENT MASTER DATA IMPORT TEMPLATE');
  assert(String(sheet1Data[2][0]).includes('2026-2027'));

  const dataHeaders = sheet1Data[4];
  assert.strictEqual(dataHeaders.length, testEnabledFields.length);
  assert.strictEqual(dataHeaders[0], 'Admission Number', 'Column 1 must always be Admission Number');
  assert.strictEqual(dataHeaders[1], 'Admission Date');
  assert.strictEqual(dataHeaders[2], 'Academic Year');
  assert.strictEqual(dataHeaders[3], 'Class / Grade');
  assert.strictEqual(dataHeaders[4], 'Section');
  assert.strictEqual(dataHeaders[5], 'Roll Number');
  assert.strictEqual(dataHeaders[6], 'Student Name', 'Student Name must be in Personal Information position');
  assert.strictEqual(dataHeaders[7], 'Student Photo');
  assert.strictEqual(dataHeaders[dataHeaders.length - 1], 'Birth Certificate', 'Documents must be at the end');

  // Sheet 2: Instructions & Rules
  const sheet2 = wb.Sheets['Instructions & Rules'];
  const sheet2Data: any[][] = XLSX.utils.sheet_to_json(sheet2, { header: 1 });
  assert.strictEqual(sheet2Data[0][0], 'Section');
  assert.strictEqual(sheet2Data[0][1], 'Field Name');
  assert.strictEqual(sheet2Data[1][1], 'Admission Number');
  assert(String(sheet2Data[1][2]).includes('LOCKED REQUIRED'));

  // Sheet 3: Sample Data
  const sheet3 = wb.Sheets['Sample Data'];
  const sheet3Data: any[][] = XLSX.utils.sheet_to_json(sheet3, { header: 1 });
  assert(sheet3Data[0][0].includes('SAMPLE DATA'));
  assert.strictEqual(sheet3Data[1][0], 'Admission Number');
  assert.strictEqual(sheet3Data[2][0], 'ADM-2026-0101');
  assert.strictEqual(sheet3Data[2][3], 'Class 5', 'Sample student must use configured class');

  // Sheet 4: Lists & Options
  const sheet4 = wb.Sheets['Lists & Options'];
  const sheet4Data: any[][] = XLSX.utils.sheet_to_json(sheet4, { header: 1 });
  const listHeaders = sheet4Data[0];
  assert(listHeaders.includes('Gender'));
  assert(listHeaders.includes('Blood Group'));
  assert(listHeaders.includes('Class / Grade'));
  assert(listHeaders.includes('Section'));

  // Test buffer generation & post-processing (freeze panes & dropdowns)
  const excelBuffer = generateStudentExcelBuffer({
    enabledFields: testEnabledFields,
    academicStructure: mockAcademicStructure,
    schoolName: 'Roshani Public School',
  });
  assert(excelBuffer.length > 2000, 'Excel buffer must be created cleanly');

  // Verify generated buffer can be read back by XLSX parser seamlessly
  const roundtripWb = XLSX.read(excelBuffer, { type: 'array' });
  assert.strictEqual(roundtripWb.SheetNames.length, 4);

  console.log('✓ 4-sheet workbook, dynamic Lists & Options, and freeze pane buffer verified.\n');

  // --------------------------------------------------------------------------
  // 5. CSV Generation Strictly Matching Canonical Order
  // --------------------------------------------------------------------------
  console.log('5. Testing CSV Generation Canonical Ordering...');
  const csvTemplate = generateStudentCsvTemplate({ enabledFields: testEnabledFields });
  assert(csvTemplate.startsWith('\uFEFF'), 'CSV must begin with UTF-8 BOM');
  const csvHeaderLine = csvTemplate.replace('\uFEFF', '').split('\r\n')[0];
  const csvHeaders = csvHeaderLine.split(',');
  assert.strictEqual(csvHeaders[0], 'Admission Number', 'CSV Column 1 must be Admission Number');
  assert.strictEqual(csvHeaders[1], 'Admission Date');
  assert.strictEqual(csvHeaders[2], 'Academic Year');
  assert.strictEqual(csvHeaders[3], 'Class / Grade');
  assert.strictEqual(csvHeaders[4], 'Section');
  assert.strictEqual(csvHeaders[5], 'Roll Number');
  assert.strictEqual(csvHeaders[6], 'Student Name');

  const sampleCsv = generateSampleStudentCsv({
    enabledFields: testEnabledFields,
    academicStructure: mockAcademicStructure,
  });
  assert(sampleCsv.includes('ADM-2026-0101'), 'Sample CSV must contain realistic sample data');

  console.log('✓ CSV and XLSX column orders match identically.\n');

  // --------------------------------------------------------------------------
  // 6. Intelligent Header Matching & Position Independence
  // --------------------------------------------------------------------------
  console.log('6. Testing Header Matching Position Independence & Normalization...');
  // User uploads a spreadsheet where columns have been manually reordered
  const userReorderedHeaders = [
    'Student Name ★',
    'Class / Grade',
    'Admission Number',
    'DOB',
    'Mobile',
    'Sec',
    'Photo Filename',
    'Blood Group',
  ];

  const matchedHeaders = matchHeadersWithFields(userReorderedHeaders, testEnabledFields);
  assert.strictEqual(matchedHeaders[0].matchedFieldKey, 'student_name');
  assert.strictEqual(matchedHeaders[1].matchedFieldKey, 'class_grade');
  assert.strictEqual(matchedHeaders[2].matchedFieldKey, 'admission_number');
  assert.strictEqual(matchedHeaders[3].matchedFieldKey, 'dob');
  assert.strictEqual(matchedHeaders[4].matchedFieldKey, 'father_phone');
  assert.strictEqual(matchedHeaders[5].matchedFieldKey, 'section');
  assert.strictEqual(matchedHeaders[6].matchedFieldKey, 'photo');
  assert.strictEqual(matchedHeaders[7].matchedFieldKey, 'blood_group');

  console.log('✓ Reordered headers and star indicators map accurately without position dependence.\n');

  // --------------------------------------------------------------------------
  // 7. Intelligent Table Header Detection (Ignoring Title Banner Rows)
  // --------------------------------------------------------------------------
  console.log('7. Testing Intelligent Header Row Detection in Template Workbooks...');
  const testWb = XLSX.utils.book_new();
  const titleAoa = [
    ['Demo School'],
    ['STUDENT MASTER DATA IMPORT TEMPLATE'],
    ['Session: 2026-2027'],
    ['Instructions banner row'],
    ['Admission Number', 'Student Name', 'Class / Grade', 'Section'],
    ['ADM-2026-001', 'Aarav Kumar', 'Class 5', 'A'],
  ];
  XLSX.utils.book_append_sheet(testWb, XLSX.utils.aoa_to_sheet(titleAoa), 'Sheet1');
  const testFileBuf = XLSX.write(testWb, { bookType: 'xlsx', type: 'array' });

  const parsed = parseUploadedFileBuffer(testFileBuf, 'template.xlsx');
  assert.strictEqual(parsed.headers[0], 'Admission Number', 'Must detect row 5 as header, not row 1');
  assert.strictEqual(parsed.headers[1], 'Student Name');
  assert.strictEqual(parsed.rawRows.length, 1);
  assert.strictEqual(parsed.rawRows[0]['Admission Number'], 'ADM-2026-001');

  console.log('✓ Intelligent parser correctly skips title banners and detects actual table headers.\n');

  // --------------------------------------------------------------------------
  // 8. Record Validation, Duplicate Detection, & Field Rules
  // --------------------------------------------------------------------------
  console.log('8. Testing Record Validation & Duplicate Detection...');
  const testRows = [
    // Row 1: Valid
    {
      'Admission Number': 'ADM-2026-001',
      'Student Name': 'Aarav Kumar',
      'Class / Grade': 'Class 5',
      'Section': 'A',
      'Date of Birth': '15/04/2015',
      "Father's Phone": '9876543210',
    },
    // Row 2: In-file duplicate admission number & invalid date
    {
      'Admission Number': 'ADM-2026-001',
      'Student Name': 'Rohan Das',
      'Class / Grade': 'Class 5',
      'Section': 'B',
      'Date of Birth': '31/04/2015', // April has 30 days
      "Father's Phone": '9876543211',
    },
    // Row 3: Missing required student name & unconfigured class
    {
      'Admission Number': 'ADM-2026-003',
      'Student Name': '',
      'Class / Grade': 'Class 10', // Not in mockAcademicStructure
      'Section': 'A',
    },
  ];

  const mapping: Record<string, string> = {
    'Admission Number': 'admission_number',
    'Student Name': 'student_name',
    'Class / Grade': 'class_grade',
    'Section': 'section',
    'Date of Birth': 'dob',
    "Father's Phone": 'father_phone',
  };

  const validationRes = validateStudentRecords(testRows, mapping, {
    enabledFields: testEnabledFields,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section'],
    academicStructure: mockAcademicStructure,
  });

  assert.strictEqual(validationRes.totalDetected, 3);
  assert.strictEqual(validationRes.readyCount, 1, 'Row 1 must be ready');
  assert(validationRes.errorCount >= 2, 'Rows 2 and 3 must have errors');

  // Verify Row 2 flags in-file duplicate admission number
  assert(
    validationRes.rows[1].issues.some((i) => i.message.includes('Duplicate admission number')),
    'Row 2 must flag duplicate admission number'
  );
  // Verify Row 2 flags invalid calendar date
  assert(
    validationRes.rows[1].issues.some((i) => i.fieldKey === 'dob'),
    'Row 2 must flag invalid calendar date 31/04/2015'
  );

  // Verify Row 3 flags missing required student name
  assert(
    validationRes.rows[2].issues.some((i) => i.fieldKey === 'student_name'),
    'Row 3 must flag missing student name'
  );

  console.log('✓ Validation flags duplicates, invalid calendar dates, missing required fields, and unconfigured classes.\n');

  // --------------------------------------------------------------------------
  // 9. Quick Service Upload Isolation & Photo Pipeline
  // --------------------------------------------------------------------------
  console.log('9. Verifying Quick Service Upload Isolation & Photo Pipeline...');
  const testJpeg = await sharp({
    create: {
      width: 800,
      height: 1000,
      channels: 3,
      background: { r: 10, g: 80, b: 160 },
    },
  })
    .jpeg()
    .toBuffer();

  const optimized = await optimizeAndStoreStudentPhoto(testJpeg, {
    tenantId: 'test-school-tenant',
    originalFileName: 'ADM-2026-0101.jpg',
  });

  assert.strictEqual(optimized.mimeType, 'image/webp');
  assert(optimized.width <= 600);
  assert(optimized.height <= 800);
  assert(optimized.url.endsWith('.webp'));

  console.log('✓ Student photo pipeline remains isolated and conforms to WebP standards.\n');

  // --------------------------------------------------------------------------
  // 10. Dynamic Admin-Created Custom Fields Catalog & Key Generation
  // --------------------------------------------------------------------------
  console.log('10. Verifying Dynamic Custom Fields Catalog & Key Generation...');
  // 10.1 Key generator prefix and sanitization
  const key1 = generateCustomFieldKey('Uniform Size');
  assert.strictEqual(key1, 'custom_uniform_size', 'Key must be prefixed with custom_ and snake_cased');

  const key2 = generateCustomFieldKey('T-Shirt / Polo Size');
  assert.strictEqual(key2, 'custom_t_shirt_polo_size', 'Special characters must be sanitized');

  // 10.2 Collision resolution
  const key3 = generateCustomFieldKey('Hostel Room', ['custom_hostel_room']);
  assert.strictEqual(key3, 'custom_hostel_room_2', 'Colliding key must be suffixed with _2');

  // 10.3 Reserved system keys protection
  const key4 = generateCustomFieldKey('Student Name');
  assert.strictEqual(key4, 'custom_student_name', 'Reserved key must still be prefixed with custom_');
  assert.notStrictEqual(key4, 'student_name', 'Custom key must never equal reserved key');

  // 10.4 Alias generation
  const aliases = buildCustomFieldAliases('T-Shirt Size', 'custom_t_shirt_size');
  assert(aliases.includes('t-shirt size'));
  assert(aliases.includes('t shirt size'));
  assert(aliases.includes('custom_t_shirt_size'));

  // 10.5 Custom field definitions and canonical order segregation
  const mockCustomDefs: StudentCustomFieldDefinition[] = [
    {
      id: 'cust-1',
      school_id: 'school-1',
      field_key: 'custom_uniform_size',
      field_label: 'Uniform Size',
      field_type: 'dropdown',
      options: ['Small', 'Medium', 'Large', 'XL'],
      is_required: true,
      is_active: true,
      order_index: 52,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cust-2',
      school_id: 'school-1',
      field_key: 'custom_bus_route',
      field_label: 'Bus Route Number',
      field_type: 'dropdown',
      options: ['Route 1', 'Route 2', 'Route 3'],
      is_required: false,
      is_active: true,
      order_index: 53,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'cust-3',
      school_id: 'school-1',
      field_key: 'custom_scholarship_id',
      field_label: 'Scholarship Identifier',
      field_type: 'text',
      is_required: false,
      is_active: true,
      order_index: 54,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const conv1 = customFieldToFieldDefinition(mockCustomDefs[0], 52);
  assert.strictEqual(conv1.key, 'custom_uniform_size');
  assert.strictEqual(conv1.label, 'Uniform Size');
  assert.strictEqual(conv1.templateOrder, 52);
  assert.strictEqual(conv1.isCustom, true);
  assert.strictEqual(conv1.supportsImport, true);
  assert.deepStrictEqual(conv1.options, ['Small', 'Medium', 'Large', 'XL']);

  // Verify sorting preserves system 1..51 before custom 52+
  const unsortedWithCustom = [
    'custom_uniform_size',
    'student_name',
    'custom_bus_route',
    'admission_number',
    'father_phone',
  ];
  const sortedWithCustom = getOrderedStudentFields(unsortedWithCustom, mockCustomDefs);
  assert.deepStrictEqual(sortedWithCustom, [
    'admission_number',
    'student_name',
    'father_phone',
    'custom_uniform_size',
    'custom_bus_route',
  ], 'System fields must strictly precede custom fields regardless of input order');

  console.log('✓ Dynamic Custom Fields Catalog and Master Order segregation verified.\n');

  // --------------------------------------------------------------------------
  // 11. Domain Safety & Validation Rules (studentCustomFieldService)
  // --------------------------------------------------------------------------
  console.log('11. Verifying Domain Safety & Validation Rules...');
  // Name validation
  assert(!validateCustomFieldName('').valid, 'Empty field name must be invalid');
  assert(!validateCustomFieldName('a'.repeat(65)).valid, 'Field name > 60 chars must be invalid');
  assert(!validateCustomFieldName('admission_number').valid, 'Reserved key name without custom_ prefix must be invalid');
  assert(validateCustomFieldName('T-Shirt Size').valid, 'Normal field name must be valid');

  // Value validation across data types
  // Number
  const numDef: StudentCustomFieldDefinition = { id: 'n1', field_key: 'custom_num', field_name: 'Custom Num', field_type: 'number', section_key: 'academic', is_required: true, is_active: true, display_order: 52 };
  assert(validateCustomFieldValue(numDef, '123').isValid);
  assert(!validateCustomFieldValue(numDef, 'abc').isValid, 'Non-number must be invalid');

  // Email
  const emailDef: StudentCustomFieldDefinition = { id: 'e1', field_key: 'custom_email', field_name: 'Custom Email', field_type: 'email', section_key: 'academic', is_required: false, is_active: true, display_order: 53 };
  assert(validateCustomFieldValue(emailDef, 'test@example.com').isValid);
  assert(!validateCustomFieldValue(emailDef, 'invalid-email').isValid);

  // Phone
  const phoneDef: StudentCustomFieldDefinition = { id: 'p1', field_key: 'custom_phone', field_name: 'Custom Phone', field_type: 'phone', section_key: 'academic', is_required: false, is_active: true, display_order: 54 };
  assert(validateCustomFieldValue(phoneDef, '9876543210').isValid);
  assert(!validateCustomFieldValue(phoneDef, '123').isValid, 'Invalid phone number must fail');

  // Date
  const dateDef: StudentCustomFieldDefinition = { id: 'd1', field_key: 'custom_date', field_name: 'Custom Date', field_type: 'date', section_key: 'academic', is_required: false, is_active: true, display_order: 55 };
  assert(validateCustomFieldValue(dateDef, '15/05/2026').isValid);
  assert(!validateCustomFieldValue(dateDef, '31/02/2026').isValid, 'Invalid calendar date must fail');

  // Yes/No Boolean
  const boolDef: StudentCustomFieldDefinition = { id: 'b1', field_key: 'custom_bool', field_name: 'Custom Bool', field_type: 'yes_no', section_key: 'academic', is_required: false, is_active: true, display_order: 56 };
  assert(validateCustomFieldValue(boolDef, 'Yes').isValid);
  assert(validateCustomFieldValue(boolDef, 'No').isValid);

  // Select / Dropdown
  const dropDef: StudentCustomFieldDefinition = { id: 'dd1', field_key: 'custom_dropdown', field_name: 'Custom Dropdown', field_type: 'dropdown', section_key: 'academic', options: ['Small', 'Medium', 'Large'], is_required: false, is_active: true, display_order: 57 };
  assert(validateCustomFieldValue(dropDef, 'Medium').isValid);
  assert(!validateCustomFieldValue(dropDef, 'Extra Large').isValid);

  // Safety checks for delete & type change
  const mockStudentsWithData = [{ id: 'std-1', admission_number: 'ADM-01', custom_fields: { custom_uniform_size: 'Medium' } }] as any[];
  const canDelNoData = canDeleteCustomField('custom_uniform_size', []);
  assert.strictEqual(canDelNoData.canDelete, true);
  const canDelWithData = canDeleteCustomField('custom_uniform_size', mockStudentsWithData);
  assert.strictEqual(canDelWithData.canDelete, false, 'Field with existing student data must not be deleted');

  const canChangeSafe = canChangeCustomFieldType('custom_uniform_size', 'dropdown', 'dropdown', mockStudentsWithData);
  assert.strictEqual(canChangeSafe.canChange, true);
  const canChangeUnsafe = canChangeCustomFieldType('custom_uniform_size', 'dropdown', 'text', mockStudentsWithData);
  assert.strictEqual(canChangeUnsafe.canChange, false, 'Dangerous type change with data must be blocked');

  console.log('✓ Domain Safety barriers, data type validators, and mutation guards verified.\n');

  // --------------------------------------------------------------------------
  // 12. 4-Sheet Excel Generator with Custom Fields & Custom Dropdown Validations
  // --------------------------------------------------------------------------
  console.log('12. Verifying 4-Sheet Excel Generator with Custom Fields & Validations...');
  const enabledWithCustom = [
    'admission_number',
    'student_name',
    'class_grade',
    'section',
    'gender',
    'custom_uniform_size',
    'custom_bus_route',
    'custom_scholarship_id',
  ];

  const customWorkbook = generateStudentExcelWorkbook({
    enabledFields: enabledWithCustom,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section', 'custom_uniform_size'],
    academicStructure: mockAcademicStructure,
    schoolName: 'Greenwood High International',
    customFields: mockCustomDefs,
  });

  // Sheet 1: Columns count and custom headers at the end
  const customSheet1 = customWorkbook.Sheets['Student Data'];
  assert(customSheet1, 'Sheet 1 (Student Data) must exist');
  const customSheet1Data = XLSX.utils.sheet_to_json<string[]>(customSheet1, { header: 1 });
  const customHeadersRow = customSheet1Data[4];

  assert(customHeadersRow.includes('Admission Number'), 'Must include Admission Number');
  assert(customHeadersRow.includes('Student Name'), 'Must include Student Name');
  assert(customHeadersRow.includes('Uniform Size'), 'Must include Uniform Size');
  assert(customHeadersRow.includes('Bus Route Number'), 'Must include Bus Route Number');
  assert(customHeadersRow.includes('Scholarship Identifier'), 'Must include Scholarship Identifier');

  // Verify custom columns are placed strictly after system columns
  const admIdx = customHeadersRow.indexOf('Admission Number');
  const nameIdx = customHeadersRow.indexOf('Student Name');
  const uniformIdx = customHeadersRow.indexOf('Uniform Size');
  const busIdx = customHeadersRow.indexOf('Bus Route Number');
  const scholIdx = customHeadersRow.indexOf('Scholarship Identifier');

  assert(uniformIdx > nameIdx && uniformIdx > admIdx, 'Custom field must follow system fields');
  assert(busIdx > uniformIdx, 'Custom field 2 must follow custom field 1');
  assert(scholIdx > busIdx, 'Custom field 3 must follow custom field 2');

  // Sheet 2: Field Instructions has rows for custom fields
  const customSheet2 = customWorkbook.Sheets['Instructions & Rules'];
  assert(customSheet2, 'Sheet 2 (Instructions & Rules) must exist');
  const customSheet2Data = XLSX.utils.sheet_to_json<any[]>(customSheet2);
  const uniformInstruction = customSheet2Data.find((r: any) => r['Field Name']?.includes('Uniform Size'));
  assert(uniformInstruction, 'Sheet 2 must contain row for Uniform Size');

  // Sheet 3: Sample Data has custom fields
  const customSheet3 = customWorkbook.Sheets['Sample Data'];
  assert(customSheet3, 'Sheet 3 (Sample Data) must exist');
  const customSheet3Data = XLSX.utils.sheet_to_json<any[]>(customSheet3);
  assert(customSheet3Data.length > 0, 'Sheet 3 must contain sample rows');

  // Sheet 4: Lists & Options contains columns for Uniform Size and Bus Route
  const customSheet4 = customWorkbook.Sheets['Lists & Options'];
  assert(customSheet4, 'Sheet 4 (Lists & Options) must exist');
  const customSheet4Data = XLSX.utils.sheet_to_json<string[]>(customSheet4, { header: 1 });
  const customSheet4Headers = customSheet4Data[0] || [];
  assert(customSheet4Headers.includes('Uniform Size'), 'Sheet 4 must have Uniform Size column');
  assert(customSheet4Headers.includes('Bus Route Number'), 'Sheet 4 must have Bus Route Number column');

  // Test buffer generation and XML enhancement
  const customExcelBuffer = generateStudentExcelBuffer({
    enabledFields: enabledWithCustom,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section', 'custom_uniform_size'],
    academicStructure: mockAcademicStructure,
    schoolName: 'Greenwood High International',
    customFields: mockCustomDefs,
  });
  assert(customExcelBuffer && customExcelBuffer.length > 0, 'Excel buffer must be successfully generated');

  console.log('✓ 4-Sheet Excel Generator with Custom Fields, dynamic lists & dropdowns verified.\n');

  // --------------------------------------------------------------------------
  // 13. CSV Template & Sample CSV with Custom Fields
  // --------------------------------------------------------------------------
  console.log('13. Verifying CSV Template & Sample CSV with Custom Fields...');
  const customCsvTemplate = generateStudentCsvTemplate({
    enabledFields: enabledWithCustom,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section', 'custom_uniform_size'],
    customFields: mockCustomDefs,
  });
  assert(customCsvTemplate.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
  assert(customCsvTemplate.includes('Uniform Size'), 'CSV template must include custom field header');
  assert(customCsvTemplate.includes('Bus Route Number'), 'CSV template must include bus route header');

  const customSampleCsv = generateSampleStudentCsv({
    enabledFields: enabledWithCustom,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section'],
    academicStructure: mockAcademicStructure,
    customFields: mockCustomDefs,
  });
  assert(customSampleCsv.startsWith('\uFEFF'), 'Sample CSV must start with UTF-8 BOM');
  assert(customSampleCsv.includes('Uniform Size'), 'Sample CSV must include custom field column');

  console.log('✓ CSV Template and Sample CSV generation with Custom Fields verified.\n');

  // --------------------------------------------------------------------------
  // 14. Intelligent Header Detection for Custom Fields
  // --------------------------------------------------------------------------
  console.log('14. Verifying Intelligent Header Detection for Custom Fields...');
  const fileHeaders = [
    'Admission No',
    'Student Full Name',
    'Grade / Standard',
    'Section',
    'T-Shirt Size', // Alias match for custom_uniform_size
    'Bus Route',    // Match for custom_bus_route
    'Scholarship ID', // Alias match for custom_scholarship_id
  ];

  const headerMatches = matchHeadersWithFields(
    fileHeaders,
    enabledWithCustom,
    mockCustomDefs
  );

  const matchedKeys = headerMatches.reduce<Record<string, string>>((acc, m) => {
    if (m.matchedFieldKey) acc[m.fileHeader] = m.matchedFieldKey;
    return acc;
  }, {});

  assert.strictEqual(matchedKeys['Admission No'], 'admission_number');
  assert.strictEqual(matchedKeys['Student Full Name'], 'student_name');
  assert.strictEqual(matchedKeys['Grade / Standard'], 'class_grade');
  assert.strictEqual(matchedKeys['Section'], 'section');
  assert.strictEqual(matchedKeys['T-Shirt Size'], 'custom_uniform_size', 'T-Shirt Size must map to custom_uniform_size');
  assert.strictEqual(matchedKeys['Bus Route'], 'custom_bus_route', 'Bus Route must map to custom_bus_route');
  assert.strictEqual(matchedKeys['Scholarship ID'], 'custom_scholarship_id', 'Scholarship ID must map to custom_scholarship_id');

  console.log('✓ Intelligent 3-pass header matching successfully resolves custom fields and aliases.\n');

  // --------------------------------------------------------------------------
  // 15. Student Import Validation with Custom Fields
  // --------------------------------------------------------------------------
  console.log('15. Verifying Student Import Validation with Custom Fields...');
  const testRowsWithCustom = [
    // Row 1: Fully valid with valid custom values
    {
      'Admission No': 'ADM-2026-901',
      'Student Full Name': 'Aarav Patel',
      'Grade / Standard': 'Class 5',
      'Section': 'A',
      'T-Shirt Size': 'Medium',
      'Bus Route': 'Route 1',
      'Scholarship ID': 'SCH-2026-PAT',
    },
    // Row 2: Missing required custom field (Uniform Size is marked required)
    {
      'Admission No': 'ADM-2026-902',
      'Student Full Name': 'Diya Sharma',
      'Grade / Standard': 'Class 5',
      'Section': 'A',
      'T-Shirt Size': '', // MISSING REQUIRED
      'Bus Route': 'Route 2',
      'Scholarship ID': '',
    },
    // Row 3: Invalid dropdown option for custom field
    {
      'Admission No': 'ADM-2026-903',
      'Student Full Name': 'Rohan Gupta',
      'Grade / Standard': 'Class 5',
      'Section': 'A',
      'T-Shirt Size': 'XXX-Large', // NOT IN ['Small', 'Medium', 'Large', 'XL']
      'Bus Route': 'Route 99', // NOT IN ['Route 1', 'Route 2', 'Route 3']
      'Scholarship ID': '',
    },
  ];

  const customValidationRes = validateStudentRecords(testRowsWithCustom, matchedKeys, {
    enabledFields: enabledWithCustom,
    requiredFields: ['admission_number', 'student_name', 'class_grade', 'section', 'custom_uniform_size'],
    academicStructure: mockAcademicStructure,
    customFields: mockCustomDefs,
  });

  assert.strictEqual(customValidationRes.totalDetected, 3);
  assert.strictEqual(customValidationRes.readyCount, 1, 'Row 1 must be ready');
  assert(customValidationRes.errorCount >= 2, 'Rows 2 and 3 must have errors');

  // Verify Row 1 stores custom_fields in studentData
  const row1Student = customValidationRes.rows[0].studentData;
  assert(row1Student.custom_fields, 'Row 1 must have custom_fields object in studentData');
  assert.strictEqual(row1Student.custom_fields['custom_uniform_size'], 'Medium');
  assert.strictEqual(row1Student.custom_fields['custom_bus_route'], 'Route 1');
  assert.strictEqual(row1Student.custom_fields['custom_scholarship_id'], 'SCH-2026-PAT');

  // Verify Row 2 flags missing required custom field
  assert(
    customValidationRes.rows[1].issues.some((i) => i.fieldKey === 'custom_uniform_size'),
    'Row 2 must flag missing required custom_uniform_size'
  );

  // Verify Row 3 flags invalid dropdown options
  assert(
    customValidationRes.rows[2].issues.some((i) => i.fieldKey === 'custom_uniform_size'),
    'Row 3 must flag invalid dropdown option XXX-Large'
  );

  console.log('✓ Student Import Validation enforces custom required rules, dropdown options, and populates studentData.custom_fields.\n');

  console.log('======================================================');
  console.log('ALL STUDENT STRUCTURED ORDER & IMPORT TESTS PASSED! (15/15)');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
