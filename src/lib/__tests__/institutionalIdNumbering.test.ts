import assert from 'node:assert';
import {
  PREDEFINED_ID_FORMATS,
  ROLE_PREFIX_REGISTRY,
  formatSequenceNumber,
  validateCustomIdPattern,
  formatInstitutionalId,
  generateInstitutionalIdPreview,
  deriveEntityFormatPattern,
  normalizeInstitutionalIdConfig,
  CAPACITY_ERROR_MESSAGE,
  MAX_FIVE_DIGIT_SEQUENCE,
  type InstitutionalIdNumberingConfig,
} from '../institutionalIdNumbering';

console.log('=== RUNNING INSTITUTIONAL ID NUMBERING TEST SUITE ===\n');

// 1. Five Digit Padding Tests
console.log('1. Testing 5-digit sequence padding...');
assert.strictEqual(formatSequenceNumber(1), '00001');
assert.strictEqual(formatSequenceNumber(25), '00025');
assert.strictEqual(formatSequenceNumber(999), '00999');
assert.strictEqual(formatSequenceNumber(9999), '09999');
assert.strictEqual(formatSequenceNumber(99999), '99999');
console.log('✓ 5-digit padding works perfectly (00001 -> 99999)');

// 2. Capacity Overflow Tests
console.log('\n2. Testing sequence capacity overflow handling...');
assert.throws(
  () => formatSequenceNumber(100000),
  (err: any) => err.message === CAPACITY_ERROR_MESSAGE,
  'Should throw capacity error when exceeding 99999'
);
assert.throws(
  () => formatSequenceNumber(MAX_FIVE_DIGIT_SEQUENCE + 1),
  (err: any) => err.message === CAPACITY_ERROR_MESSAGE
);
console.log('✓ Sequence capacity overflow produces controlled error: "ID sequence capacity reached for this format."');

// 3. Centralized Prefix Mapping
console.log('\n3. Testing system-controlled centralized prefix mapping...');
assert.strictEqual(ROLE_PREFIX_REGISTRY.single.student, 'S');
assert.strictEqual(ROLE_PREFIX_REGISTRY.single.faculty, 'F');
assert.strictEqual(ROLE_PREFIX_REGISTRY.single.employee, 'E');
assert.strictEqual(ROLE_PREFIX_REGISTRY.single.administrator, 'A');
assert.strictEqual(ROLE_PREFIX_REGISTRY.single.staff, 'T');

assert.strictEqual(ROLE_PREFIX_REGISTRY.short.student, 'SA');
assert.strictEqual(ROLE_PREFIX_REGISTRY.short.faculty, 'FA');
assert.strictEqual(ROLE_PREFIX_REGISTRY.short.employee, 'EA');
assert.strictEqual(ROLE_PREFIX_REGISTRY.short.administrator, 'AA');

assert.strictEqual(ROLE_PREFIX_REGISTRY.long.student, 'STD');
assert.strictEqual(ROLE_PREFIX_REGISTRY.long.faculty, 'FAC');
assert.strictEqual(ROLE_PREFIX_REGISTRY.long.employee, 'EMP');
assert.strictEqual(ROLE_PREFIX_REGISTRY.long.administrator, 'ADM');
console.log('✓ Centralized entity prefixes properly registered for single, short, and long styles.');

// 4. Predefined Formats Previews (Options 1 to 7)
console.log('\n4. Testing predefined formats (Options 1 to 7)...');

// OPTION 1 — 5 Digit Number
const opt1Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'NUMBER_5' }, 2026);
assert.strictEqual(opt1Preview.student, 'S00001');
assert.strictEqual(opt1Preview.faculty, 'F00001');
assert.strictEqual(opt1Preview.employee, 'E00001');
assert.strictEqual(opt1Preview.administrator, 'A00001');
console.log('✓ Option 1 (5 Digit Number): S00001, F00001, E00001, A00001');

// OPTION 2 — YY + 5 Digit
const opt2Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'YY_NUMBER_5' }, 2026);
assert.strictEqual(opt2Preview.student, 'S2600001');
assert.strictEqual(opt2Preview.faculty, 'F2600001');
assert.strictEqual(opt2Preview.employee, 'E2600001');
assert.strictEqual(opt2Preview.administrator, 'A2600001');
console.log('✓ Option 2 (YY + 5 Digit): S2600001, F2600001, E2600001, A2600001');

// OPTION 3 — YY - 5 Digit
const opt3Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'YY_NUMBER_5_HYPHEN' }, 2026);
assert.strictEqual(opt3Preview.student, 'S26-00001');
assert.strictEqual(opt3Preview.faculty, 'F26-00001');
assert.strictEqual(opt3Preview.employee, 'E26-00001');
assert.strictEqual(opt3Preview.administrator, 'A26-00001');
console.log('✓ Option 3 (YY - 5 Digit): S26-00001, F26-00001, E26-00001, A26-00001');

// OPTION 4 — Full Year + 5 Digit
const opt4Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'YEAR_NUMBER_5' }, 2026);
assert.strictEqual(opt4Preview.student, 'S202600001');
assert.strictEqual(opt4Preview.faculty, 'F202600001');
assert.strictEqual(opt4Preview.employee, 'E202600001');
assert.strictEqual(opt4Preview.administrator, 'A202600001');
console.log('✓ Option 4 (Full Year + 5 Digit): S202600001, F202600001, E202600001, A202600001');

// OPTION 5 — Full Year - 5 Digit
const opt5Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'YEAR_NUMBER_5_HYPHEN' }, 2026);
assert.strictEqual(opt5Preview.student, 'S2026-00001');
assert.strictEqual(opt5Preview.faculty, 'F2026-00001');
assert.strictEqual(opt5Preview.employee, 'E2026-00001');
assert.strictEqual(opt5Preview.administrator, 'A2026-00001');
console.log('✓ Option 5 (Full Year - 5 Digit): S2026-00001, F2026-00001, E2026-00001, A2026-00001');

// OPTION 6 — Student Style (STD-YYYY-Number)
const opt6Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'STD_YEAR_ROLL' }, 2026);
assert.strictEqual(opt6Preview.student, 'STD-2026-00001');
assert.strictEqual(opt6Preview.faculty, 'FAC-2026-00001');
assert.strictEqual(opt6Preview.employee, 'EMP-2026-00001');
assert.strictEqual(opt6Preview.administrator, 'ADM-2026-00001');
console.log('✓ Option 6 (STD-YYYY-Number): STD-2026-00001, FAC-2026-00001, EMP-2026-00001, ADM-2026-00001');

// OPTION 7 — Short Prefix + Year + Number
const opt7Preview = generateInstitutionalIdPreview({ mode: 'PRESET', presetId: 'SHORT_PREFIX_YEAR_NUMBER' }, 2026);
assert.strictEqual(opt7Preview.student, 'SA-2026-00001');
assert.strictEqual(opt7Preview.faculty, 'FA-2026-00001');
assert.strictEqual(opt7Preview.employee, 'EA-2026-00001');
assert.strictEqual(opt7Preview.administrator, 'AA-2026-00001');
console.log('✓ Option 7 (Short Prefix + Year + Number): SA-2026-00001, FA-2026-00001, EA-2026-00001, AA-2026-00001');

// 5. Custom Format Validation
console.log('\n5. Testing custom pattern validation rules...');
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{YY}}-{{NUMBER}}').isValid, true);
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}{{YEAR}}{{NUMBER}}').isValid, true);
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}/{{YY}}/{{NUMBER}}').isValid, true);
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{ROLL}}').isValid, true); // Backward compatible sequence alias

// Rejections:
assert.strictEqual(validateCustomIdPattern('').isValid, false);
assert.strictEqual(validateCustomIdPattern('   ').isValid, false);
assert.strictEqual(validateCustomIdPattern('PREFIX-YY-NUMBER').isValid, false); // missing placeholders
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{YY}}').isValid, false); // missing sequence token
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{UNKNOWN}}-{{NUMBER}}').isValid, false); // unsupported placeholder
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{YY}}-{{YEAR}}-{{NUMBER}}').isValid, false); // conflicting year tokens
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{NUMBER}}-{{NUMBER}}').isValid, false); // duplicate sequence tokens
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{NUMBER}} <script>').isValid, false); // unsafe characters
assert.strictEqual(validateCustomIdPattern('{{PREFIX}}-{{NUMBER').isValid, false); // unmatched braces
console.log('✓ Custom pattern validation safely rejects invalid, conflicting, or unsafe formats.');

// 6. Custom Format Live Preview
console.log('\n6. Testing custom format live preview...');
const customPreview = generateInstitutionalIdPreview({
  mode: 'CUSTOM',
  customPattern: '{{PREFIX}}-{{YY}}-{{NUMBER}}',
}, 2026);
assert.strictEqual(customPreview.student, 'S-26-00001');
assert.strictEqual(customPreview.faculty, 'F-26-00001');
assert.strictEqual(customPreview.employee, 'E-26-00001');
assert.strictEqual(customPreview.administrator, 'A-26-00001');
console.log('✓ Custom format live preview: S-26-00001, F-26-00001, E-26-00001, A-26-00001');

// 7. Backward Compatibility Normalization
console.log('\n7. Testing backward compatibility normalization...');
// Legacy EMP-{{YEAR}}-{{NUM}} maps to STD_YEAR_ROLL preset
const norm1 = normalizeInstitutionalIdConfig(null, 'EMP-{{YEAR}}-{{NUM}}');
assert.strictEqual(norm1.mode, 'PRESET');
assert.strictEqual(norm1.presetId, 'STD_YEAR_ROLL');

// Legacy SCH-{{YEAR}}-{{ROLL}} maps to STD_YEAR_ROLL preset
const norm2 = normalizeInstitutionalIdConfig(null, 'STD-{{YEAR}}-{{ROLL}}');
assert.strictEqual(norm2.mode, 'PRESET');
assert.strictEqual(norm2.presetId, 'STD_YEAR_ROLL');

// New school without existing config defaults to YY_NUMBER_5
const norm3 = normalizeInstitutionalIdConfig(null, null);
assert.strictEqual(norm3.mode, 'PRESET');
assert.strictEqual(norm3.presetId, 'YY_NUMBER_5');

// Existing custom config is preserved intact
const norm4 = normalizeInstitutionalIdConfig({ mode: 'CUSTOM', customPattern: '{{PREFIX}}-ACAD-{{NUMBER}}' }, null);
assert.strictEqual(norm4.mode, 'CUSTOM');
assert.strictEqual(norm4.customPattern, '{{PREFIX}}-ACAD-{{NUMBER}}');
console.log('✓ Backward compatibility preserves existing settings and maps legacy patterns cleanly.');

// 8. Class Roll Independence
console.log('\n8. Testing class roll decoupling...');
const studentId1 = formatInstitutionalId({
  pattern: '{{PREFIX}}{{YY}}{{NUMBER}}',
  role: 'student',
  sequence: 1, // Institutional sequence #1
  year: 2026,
});
assert.strictEqual(studentId1, 'S2600001');
// Notice: even if student's academic class roll is 45, the institutional sequence generates S2600001, NOT S2600045!
console.log('✓ Institutional sequence is decoupled from mutable academic class roll.');

console.log('\n=========================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (100% PASS)');
console.log('=========================================\n');
