import assert from 'assert';
import * as XLSX from 'xlsx';
import {
  STAFF_FIELD_CATEGORIES,
  STAFF_FIELD_DEFINITIONS,
  DEFAULT_ENABLED_STAFF_FIELDS,
  DEFAULT_REQUIRED_STAFF_FIELDS,
  getStaffFieldDefinition,
  getOrderedStaffFields,
  filterFieldsByStaffType,
  normalizeStaffFacultyConfig,
  generateSafeCustomFieldKey,
  resolveStaffFields,
} from '../staffFieldDefinitions';
import {
  generateStaffWorkbook,
  generateStaffExcelBuffer,
  generateStaffCsvString,
  getApplicableStaffFields,
  SAMPLE_STAFF_PROFILES,
} from '../staffTemplateGenerator';
import {
  parseDateValue,
  parseBooleanValue,
  validateStaffSheetData,
  parseAndValidateStaffFile,
  generateStaffErrorWorkbook,
  mapHeadersToFields,
} from '../staffValidationService';
import type { StaffCustomField } from '../types';

async function runTests() {
  console.log('======================================================');
  console.log('TEST SUITE: Faculty & Staff Master Data Workflow');
  console.log('======================================================\n');

  // 1. Categories and Fields Integrity
  console.log('1. Verifying Staff Field Categories & Catalog Integrity...');
  assert.strictEqual(STAFF_FIELD_CATEGORIES.length, 10, 'Must have 10 staff field categories (9 canonical + 1 custom)');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[0].id, 'employment', 'Category 1 must be employment');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[1].id, 'personal', 'Category 2 must be personal');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[2].id, 'contact', 'Category 3 must be contact');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[3].id, 'address', 'Category 4 must be address');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[4].id, 'qualification', 'Category 5 must be qualification');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[5].id, 'teaching', 'Category 6 must be teaching');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[6].id, 'non_teaching', 'Category 7 must be non_teaching');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[7].id, 'payroll', 'Category 8 must be payroll');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[8].id, 'documents', 'Category 9 must be documents');
  assert.strictEqual(STAFF_FIELD_CATEGORIES[9].id, 'custom', 'Category 10 must be custom');

  const allFieldKeys = Object.keys(STAFF_FIELD_DEFINITIONS);
  assert(allFieldKeys.length >= 40, 'Must have at least 40 canonical staff fields');

  // Verify locked fields
  const empIdDef = getStaffFieldDefinition('employee_code');
  assert(empIdDef && empIdDef.lockedRequired, 'Employee code must be locked required');
  const staffTypeDef = getStaffFieldDefinition('staff_type');
  assert(staffTypeDef && staffTypeDef.lockedRequired, 'Staff type must be locked required');
  const nameDef = getStaffFieldDefinition('name');
  assert(nameDef && nameDef.lockedRequired, 'Name must be locked required');

  console.log(`✓ Verified ${allFieldKeys.length} canonical fields across 10 categories.\n`);

  // 2. Staff Type Scoping and Ordering
  console.log('2. Verifying Staff Type Scoping & Filtering...');
  const orderedAll = getOrderedStaffFields();
  assert(orderedAll[0].templateOrder <= orderedAll[1].templateOrder, 'Must be ordered by templateOrder');

  const teachingOnly = filterFieldsByStaffType(orderedAll, 'TEACHING');
  const nonTeachingOnly = filterFieldsByStaffType(orderedAll, 'NON_TEACHING');

  assert(teachingOnly.some((f) => f.key === 'primary_subject'), 'Teaching fields must include primary_subject');
  assert(!teachingOnly.some((f) => f.key === 'job_role'), 'Teaching fields must NOT include non-teaching job_role');

  assert(nonTeachingOnly.some((f) => f.key === 'job_role'), 'Non-teaching fields must include job_role');
  assert(!nonTeachingOnly.some((f) => f.key === 'primary_subject'), 'Non-teaching fields must NOT include primary_subject');
  console.log('✓ Staff type field isolation confirmed.\n');

  // 3. Normalization Config
  console.log('3. Verifying Config Normalization...');
  const emptyConfig = normalizeStaffFacultyConfig(null);
  assert(emptyConfig.enabledFields?.includes('employee_code'), 'Default enabled must include employee_code');
  assert(emptyConfig.enabledFields?.includes('name'), 'Default enabled must include name');
  assert(emptyConfig.requiredFields?.includes('employee_code'), 'Default required must include employee_code');
  assert.strictEqual(emptyConfig.activeStage, 'directory', 'Default stage must be directory');
  console.log('✓ Config normalization confirmed.\n');

  // 4. Custom Field Key Generation & Resolution
  console.log('4. Verifying Safe Custom Field Key Generation & Canonical Resolver...');
  const key1 = generateSafeCustomFieldKey('Bus Route Number');
  assert.strictEqual(key1, 'cf_bus_route_number', 'Key must be prefixed with cf_ and underscored');

  const key2 = generateSafeCustomFieldKey('Special ID & Tag! #99');
  assert.strictEqual(key2, 'cf_special_id_tag_99', 'Key must sanitize special characters');

  const keyCollision = generateSafeCustomFieldKey('Bus Route', ['cf_bus_route']);
  assert.strictEqual(keyCollision, 'cf_bus_route_2', 'Collision must append incremented number');

  // Mock custom fields across different categories
  const mockCustomFields: StaffCustomField[] = [
    {
      id: 'cf-1',
      field_key: 'cf_room_number',
      field_label: 'Room Number',
      field_type: 'TEXT',
      category: 'employment',
      staff_scope: 'BOTH',
      is_required: false,
      is_active: true,
      display_order: 1,
    },
    {
      id: 'cf-2',
      field_key: 'cf_bus_route',
      field_label: 'Bus Route',
      field_type: 'DROPDOWN',
      options: ['Route 1', 'Route 2', 'Route 3'],
      category: 'custom',
      staff_scope: 'BOTH',
      is_required: true,
      is_active: true,
      display_order: 1,
    },
    {
      id: 'cf-3',
      field_key: 'cf_teacher_mentor',
      field_label: 'Mentor Teacher ID',
      field_type: 'TEXT',
      category: 'teaching',
      staff_scope: 'TEACHING',
      is_required: false,
      is_active: true,
      display_order: 2,
    },
  ];

  const resolved = resolveStaffFields({
    config: {
      enabledFields: ['employee_code', 'staff_type', 'name', 'department', 'designation', 'status'],
      requiredFields: ['employee_code', 'staff_type', 'name'],
    },
    customFields: mockCustomFields,
    staffType: 'ALL',
  });

  // Verify canonical ordering rule:
  // In employment category, canonical fields must come first, followed by cf_room_number
  const empResolved = resolved.filter((r) => r.category === 'employment');
  const canonicalEmp = empResolved.filter((r) => !r.isCustom);
  const customEmp = empResolved.filter((r) => r.isCustom);

  assert(canonicalEmp.length > 0, 'Must have canonical fields in employment category');
  assert.strictEqual(customEmp.length, 1, 'Must have 1 custom field in employment category');
  assert(empResolved[empResolved.length - 1].key === 'cf_room_number', 'Custom field must appear after canonical fields');

  // Verify custom category appears at the end
  const customCatFields = resolved.filter((r) => r.category === 'custom');
  assert.strictEqual(customCatFields.length, 1, 'Must have 1 field in custom category');
  assert.strictEqual(customCatFields[0].key, 'cf_bus_route', 'Custom category must contain cf_bus_route');

  console.log('✓ Custom field resolution and canonical ordering verified.\n');

  // 5. Excel & CSV Template Generation with Custom Fields
  console.log('5. Verifying Dynamic Template Generation (Excel & CSV) with Custom Fields...');
  const excelBuffer = generateStaffExcelBuffer({
    enabledFields: DEFAULT_ENABLED_STAFF_FIELDS,
    requiredFields: DEFAULT_REQUIRED_STAFF_FIELDS,
    customFields: mockCustomFields,
    staffTypeScope: 'ALL',
    schoolName: 'Test Heritage Academy',
  });
  assert(excelBuffer.length > 1000, 'Excel buffer must be non-empty valid binary');

  const wb = XLSX.read(excelBuffer, { type: 'array' });
  assert(wb.SheetNames.includes('Staff & Faculty Data'), 'Workbook must include Staff & Faculty Data sheet');
  assert(wb.SheetNames.includes('Instructions'), 'Workbook must include Instructions sheet');

  // Check headers in generated sheet
  const dataWs = wb.Sheets['Staff & Faculty Data'];
  const headerRow: any[] = XLSX.utils.sheet_to_json(dataWs, { header: 1 })[0] as any[];
  assert(headerRow.includes('Bus Route *'), 'Excel headers must contain mandatory custom field Bus Route *');
  assert(headerRow.includes('Room Number'), 'Excel headers must contain custom field Room Number');

  const csvString = generateStaffCsvString({
    enabledFields: ['employee_code', 'staff_type', 'name', 'phone'],
    requiredFields: ['employee_code', 'staff_type', 'name'],
    customFields: mockCustomFields,
    staffTypeScope: 'ALL',
  });
  assert(csvString.includes('Employee ID *'), 'CSV headers must contain required asterisk');
  assert(csvString.includes('Bus Route *'), 'CSV must contain required custom field header');
  assert(csvString.includes('Rahul Sharma'), 'CSV must include sample staff profile');
  console.log('✓ Excel and CSV template generation with custom fields verified.\n');

  // 6. Date and Boolean Parsers
  console.log('6. Verifying Date & Boolean parsing...');
  assert.strictEqual(parseDateValue('15/04/2021'), '2021-04-15', 'Must parse DD/MM/YYYY');
  assert.strictEqual(parseDateValue('2021-04-15'), '2021-04-15', 'Must parse YYYY-MM-DD');
  assert.strictEqual(parseBooleanValue('yes'), true, 'Must parse yes as true');
  assert.strictEqual(parseBooleanValue('No'), false, 'Must parse no as false');
  console.log('✓ Helper parsers verified.\n');

  // 7. Validation Service: Valid Rows with Custom Fields
  console.log('7. Verifying Staff Sheet Validation (Valid Batch + Custom Fields)...');
  const validSheet = [
    [
      'Employee ID *',
      'Staff Type *',
      'Full Name *',
      'Department *',
      'Designation *',
      'Official Phone *',
      'Status *',
      'Bus Route *',
      'Room Number',
    ],
    ['FAC-2026-0001', 'TEACHING', 'Ananya Roy', 'Mathematics', 'TGT', '9876543210', 'active', 'Route 1', 'Room 101'],
    ['FAC-2026-0002', 'NON_TEACHING', 'Kishore Sen', 'Administration', 'Accountant', '9876543211', 'active', 'Route 2', 'Admin Office'],
  ];

  const validResult = validateStaffSheetData(validSheet, {
    customFields: mockCustomFields,
  });
  assert.strictEqual(validResult.totalDetected, 2, 'Should detect 2 data rows');
  assert.strictEqual(validResult.validCount, 2, 'Should have 2 valid records');
  assert.strictEqual(validResult.errorCount, 0, 'Should have 0 errors');
  assert.strictEqual(validResult.validRecords[0].name, 'Ananya Roy');
  assert.strictEqual(validResult.validRecords[0].customFields?.cf_bus_route, 'Route 1');
  assert.strictEqual(validResult.validRecords[0].customFields?.cf_room_number, 'Room 101');
  assert.strictEqual(validResult.validRecords[1].customFields?.cf_bus_route, 'Route 2');
  console.log('✓ Valid batch with custom fields parsed successfully.\n');

  // 8. Validation Service: Custom Field Validation, Type Checking & Unknown Columns
  console.log('8. Verifying Custom Field Validations, Dropdown Checks & Unknown Column Detection...');
  const testValidationSheet = [
    [
      'Employee ID *',
      'Staff Type *',
      'Full Name *',
      'Department *',
      'Designation *',
      'Official Phone *',
      'Status *',
      'Bus Route *', // required DROPDOWN: Route 1, Route 2, Route 3
      'Extra Unrecognized Col', // Unknown column
    ],
    // Row 1: Invalid Dropdown option for Bus Route
    ['FAC-2026-0010', 'TEACHING', 'Teacher Ten', 'Science', 'PGT', '9876543220', 'active', 'Invalid Route 99', 'Val1'],
    // Row 2: Missing required custom field Bus Route
    ['FAC-2026-0011', 'TEACHING', 'Teacher Eleven', 'Science', 'PGT', '9876543221', 'active', '', 'Val2'],
    // Row 3: Valid row
    ['FAC-2026-0012', 'TEACHING', 'Teacher Twelve', 'Science', 'PGT', '9876543222', 'active', 'Route 3', 'Val3'],
  ];

  const customResult = validateStaffSheetData(testValidationSheet, {
    customFields: mockCustomFields,
  });

  assert.strictEqual(customResult.totalDetected, 3, 'Should detect 3 data rows');
  assert.strictEqual(customResult.validCount, 1, 'Should have 1 valid record');
  assert.strictEqual(customResult.errorCount, 2, 'Should have 2 error rows');

  // Verify unknown column detection
  assert(
    customResult.unknownColumns.includes('Extra Unrecognized Col'),
    'Must detect Extra Unrecognized Col as unknown column'
  );

  // Check error message details
  const row1Error = customResult.errorRecords.find((r) => r.employeeCode === 'FAC-2026-0010');
  assert(
    row1Error?.errors.some((e) => e.fieldKey === 'cf_bus_route' && e.message.includes('must be one of')),
    'Row 1 must fail with dropdown validation error'
  );

  const row2Error = customResult.errorRecords.find((r) => r.employeeCode === 'FAC-2026-0011');
  assert(
    row2Error?.errors.some((e) => e.fieldKey === 'cf_bus_route' && e.message.includes('required')),
    'Row 2 must fail with required custom field error'
  );

  console.log('✓ Custom field validation, type checking, and unknown column detection confirmed.\n');

  // 9. Validation Service: Duplicate IDs & Error Workbook
  console.log('9. Verifying Duplicate IDs and Error Workbook Generation...');
  const errorSheet = [
    ['Employee ID *', 'Staff Type *', 'Full Name *', 'Department *', 'Designation *', 'Official Phone *', 'Official Email'],
    ['FAC-2026-0001', 'TEACHING', 'Duplicate One', 'Mathematics', 'TGT', '9876543210', 'valid@school.com'],
    ['FAC-2026-0001', 'TEACHING', 'Duplicate Two', 'Science', 'PGT', '9876543211', 'valid2@school.com'], // duplicate ID
    ['', 'TEACHING', 'Missing ID', 'Languages', 'PRT', '9876543212', 'valid3@school.com'], // missing ID
    ['FAC-2026-0004', 'INVALID_TYPE', 'Bad Type', 'Arts', 'Instructor', '9876543213', 'valid4@school.com'], // invalid type
    ['FAC-2026-0005', 'TEACHING', 'Bad Email', 'Music', 'Teacher', '9876543214', 'not-an-email'], // bad email
  ];

  const errorResult = validateStaffSheetData(errorSheet);
  assert.strictEqual(errorResult.totalDetected, 5, 'Should detect 5 data rows');
  assert(errorResult.errorCount >= 4, 'Should detect at least 4 error rows');
  assert(errorResult.duplicateEmployeeCodes.includes('FAC-2026-0001'), 'Must flag FAC-2026-0001 as duplicate');

  const errWbBuffer = generateStaffErrorWorkbook(errorResult.errorRecords);
  assert(errWbBuffer.length > 500, 'Error workbook must be non-empty');
  console.log(`✓ Detected ${errorResult.errorCount} error rows and generated error workbook successfully.\n`);

  console.log('======================================================');
  console.log('ALL 9 FACULTY & STAFF TEST SUITES PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failure:', err);
  process.exit(1);
});
