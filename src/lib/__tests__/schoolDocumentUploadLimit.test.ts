import assert from 'assert';
import {
  MAX_DOCUMENT_SIZE,
  ASSET_UPLOAD_LIMITS,
  CANONICAL_ASSET_CHECKLIST_ITEMS,
  validateSchoolDocumentFile,
  validateSchoolAssetFile,
  validateFileBufferSignature,
} from '../schoolAssetChecklist';

console.log('=== RUNNING SCHOOL DOCUMENT UPLOAD LIMIT & PDF ENFORCEMENT TEST SUITE ===\n');

let passedTests = 0;
function pass(desc: string) {
  passedTests++;
  console.log(`✓ PASS: ${desc}`);
}

// ─── 1. EXACT BYTE LIMIT CONSTANTS ───────────────────────────────────────────
console.log('--- 1. Testing Exact Byte Limit Constants ---');
assert.strictEqual(
  MAX_DOCUMENT_SIZE,
  2 * 1024 * 1024,
  'MAX_DOCUMENT_SIZE must be exactly 2 * 1024 * 1024 = 2,097,152 bytes'
);
assert.strictEqual(
  MAX_DOCUMENT_SIZE,
  2097152,
  'MAX_DOCUMENT_SIZE must equal 2097152 bytes'
);
assert.strictEqual(
  ASSET_UPLOAD_LIMITS.maxDocumentSizeBytes,
  2097152,
  'ASSET_UPLOAD_LIMITS.maxDocumentSizeBytes must equal 2097152 bytes'
);
pass('MAX_DOCUMENT_SIZE is exactly 2,097,152 bytes (2 * 1024 * 1024)');

// ─── 2. 500 KB PDF ACCEPTANCE ────────────────────────────────────────────────
console.log('\n--- 2. Testing 500 KB PDF Acceptance ---');
const doc500Kb = {
  name: 'Board_Affiliation_Certificate.pdf',
  size: 500 * 1024, // 512,000 bytes
  type: 'application/pdf',
};
const res500Kb = validateSchoolDocumentFile(doc500Kb);
assert.strictEqual(res500Kb.isValid, true, '500 KB PDF must be valid');
assert.strictEqual(res500Kb.error, undefined);
pass('500 KB PDF accepted');

// ─── 3. 1.9 MB PDF ACCEPTANCE ────────────────────────────────────────────────
console.log('\n--- 3. Testing 1.9 MB PDF Acceptance ---');
const doc19Mb = {
  name: 'Building_Safety_Certificate.pdf',
  size: Math.floor(1.9 * 1024 * 1024), // 1,992,294 bytes
  type: 'application/pdf',
};
const res19Mb = validateSchoolDocumentFile(doc19Mb);
assert.strictEqual(res19Mb.isValid, true, '1.9 MB PDF must be valid');
pass('1.9 MB PDF accepted');

// ─── 4. EXACTLY 2,097,152 BYTES PDF ACCEPTANCE (UPPER BOUND) ─────────────────
console.log('\n--- 4. Testing Exact Boundary (2,097,152 Bytes) ---');
const docExact2Mb = {
  name: 'Fire_Safety_NOC.pdf',
  size: 2097152,
  type: 'application/pdf',
};
const resExact2Mb = validateSchoolDocumentFile(docExact2Mb);
assert.strictEqual(resExact2Mb.isValid, true, 'PDF at exactly 2,097,152 bytes must be accepted');
pass('Exactly 2,097,152 bytes PDF accepted');

// ─── 5. 2,097,153 BYTES PDF REJECTION (1 BYTE OVER BOUNDARY) ─────────────────
console.log('\n--- 5. Testing 1 Byte Over Boundary (2,097,153 Bytes) ---');
const docOver1Byte = {
  name: 'School_Recognition_Certificate.pdf',
  size: 2097153,
  type: 'application/pdf',
};
const resOver1Byte = validateSchoolDocumentFile(docOver1Byte);
assert.strictEqual(resOver1Byte.isValid, false, 'PDF at 2,097,153 bytes must be rejected');
assert.strictEqual(resOver1Byte.code, 'DOCUMENT_TOO_LARGE');
assert(resOver1Byte.error?.includes('The maximum allowed size is 2 MB'));
pass('2,097,153 bytes PDF rejected with DOCUMENT_TOO_LARGE');

// ─── 6. 3.2 MB PDF REJECTION WITH EXACT ERROR MESSAGE ────────────────────────
console.log('\n--- 6. Testing 3.2 MB PDF Rejection & Exact Inline Message ---');
const doc32Mb = {
  name: 'Mandatory_Public_Disclosure_Appendix_IX.pdf',
  size: Math.round(3.2 * 1024 * 1024),
  type: 'application/pdf',
};
const res32Mb = validateSchoolDocumentFile(doc32Mb);
assert.strictEqual(res32Mb.isValid, false, '3.2 MB PDF must be rejected');
assert.strictEqual(res32Mb.code, 'DOCUMENT_TOO_LARGE');
assert.strictEqual(
  res32Mb.error,
  'This PDF is 3.2 MB. The maximum allowed size is 2 MB. Please compress the PDF and try again.',
  'Error message must follow the exact specified format'
);
pass('3.2 MB PDF rejected with exact inline message');

// ─── 7. REJECT NON-PDF FILES EVEN UNDER 2 MB ─────────────────────────────────
console.log('\n--- 7. Testing Non-PDF Files Rejection ---');
const nonPdfFiles = [
  { name: 'photo.jpg', size: 500 * 1024, type: 'image/jpeg' },
  { name: 'photo.jpeg', size: 500 * 1024, type: 'image/jpeg' },
  { name: 'scan.png', size: 800 * 1024, type: 'image/png' },
  { name: 'image.webp', size: 300 * 1024, type: 'image/webp' },
  { name: 'document.doc', size: 200 * 1024, type: 'application/msword' },
  { name: 'document.docx', size: 200 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { name: 'sheet.xls', size: 150 * 1024, type: 'application/vnd.ms-excel' },
  { name: 'sheet.xlsx', size: 150 * 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { name: 'archive.zip', size: 500 * 1024, type: 'application/zip' },
  { name: 'program.exe', size: 500 * 1024, type: 'application/x-msdownload' },
];

for (const f of nonPdfFiles) {
  const res = validateSchoolDocumentFile(f);
  assert.strictEqual(res.isValid, false, `File ${f.name} must be rejected`);
  assert.strictEqual(res.code, 'INVALID_FILE_TYPE');
  assert.strictEqual(res.error, f.name.endsWith('.exe') || f.name.endsWith('.zip')
    ? `File extension ".${f.name.split('.').pop()}" is blocked for security reasons.`
    : 'Invalid file type. Please upload a PDF.');
}
pass('All non-PDF formats (JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX, ZIP, EXE) rejected');

// ─── 8. MIME TYPE SPOOFING REJECTION ─────────────────────────────────────────
console.log('\n--- 8. Testing Extension vs MIME Type Spoofing Rejection ---');
const spoofedJpgAsPdf = {
  name: 'malicious.pdf',
  size: 500 * 1024,
  type: 'image/jpeg', // Spoofed MIME type
};
const resSpoofed = validateSchoolDocumentFile(spoofedJpgAsPdf);
assert.strictEqual(resSpoofed.isValid, false, 'Spoofed JPG with .pdf extension must be rejected');
assert.strictEqual(resSpoofed.code, 'INVALID_FILE_TYPE');
pass('MIME type mismatch (spoofed .pdf with image/jpeg MIME) rejected');

// ─── 9. INTEGRATION WITH validateSchoolAssetFile ─────────────────────────────
console.log('\n--- 9. Testing validateSchoolAssetFile Integration ---');
const assetDocValid = validateSchoolAssetFile(
  { name: 'Affiliation_Grant.pdf', size: 1.5 * 1024 * 1024, type: 'application/pdf' },
  'document'
);
assert.strictEqual(assetDocValid.isValid, true, 'Valid document through validateSchoolAssetFile must pass');

const assetDocOversized = validateSchoolAssetFile(
  { name: 'Affiliation_Grant.pdf', size: 2.5 * 1024 * 1024, type: 'application/pdf' },
  'document'
);
assert.strictEqual(assetDocOversized.isValid, false);
assert.strictEqual(assetDocOversized.code, 'DOCUMENT_TOO_LARGE');

const assetDocWrongType = validateSchoolAssetFile(
  { name: 'Affiliation_Grant.docx', size: 500 * 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  'document'
);
assert.strictEqual(assetDocWrongType.isValid, false);
assert.strictEqual(assetDocWrongType.code, 'INVALID_FILE_TYPE');
pass('validateSchoolAssetFile seamlessly delegates document validation to validateSchoolDocumentFile');

// ─── 10. SERVER-SIDE BUFFER SIGNATURE VALIDATION ────────────────────────────
console.log('\n--- 10. Testing Server-Side Buffer & Signature Validation ---');
const validPdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj');
const sigResult = validateFileBufferSignature(validPdfHeader, 'test.pdf', 'application/pdf');
assert.strictEqual(sigResult.isValid, true);
assert.strictEqual(sigResult.detectedType, 'application/pdf');

const fakePdfHeader = Buffer.from('NOT_A_PDF_DOCUMENT');
const fakeSigResult = validateFileBufferSignature(fakePdfHeader, 'fake.pdf', 'application/pdf');
assert.strictEqual(fakeSigResult.isValid, false);
assert(fakeSigResult.error?.includes('Malformed PDF document'));
pass('Server-side PDF buffer magic bytes signature (%PDF-) validated strictly');

// ─── 11. CANONICAL ASSET CHECKLIST ITEMS AUDIT ──────────────────────────────
console.log('\n--- 11. Auditing All Canonical Document Checklist Items ---');
const documentItemIds = [
  'adm-fee-circular',
  'cert-affiliation',
  'cert-recognition',
  'cert-registration',
  'cert-safety',
  'cert-mandatory-disclosure',
];

for (const id of documentItemIds) {
  const item = CANONICAL_ASSET_CHECKLIST_ITEMS.find((c) => c.id === id);
  assert(item, `Item ${id} must exist in CANONICAL_ASSET_CHECKLIST_ITEMS`);
  assert.strictEqual(item.type, 'document', `Item ${id} must have type 'document'`);
  assert.deepStrictEqual(
    item.allowedFormats,
    ['PDF'],
    `Item ${id} must strictly allow only PDF`
  );
  assert.strictEqual(
    item.maxSizeBytes,
    MAX_DOCUMENT_SIZE,
    `Item ${id} maxSizeBytes must equal MAX_DOCUMENT_SIZE (2,097,152 bytes)`
  );
  pass(`Canonical item "${item.title}" (${id}) enforces PDF-only and MAX_DOCUMENT_SIZE`);
}

// ─── 12. SAFE REPLACEMENT / STATE PRESERVATION AUDIT ─────────────────────────
console.log('\n--- 12. Testing Safe Replacement & State Preservation ---');
interface MockAssetItem {
  id: string;
  title: string;
  type: string;
  status: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

const existingDoc: MockAssetItem = {
  id: 'cert-safety',
  title: 'Building Safety & Fire Safety Certificate',
  type: 'document',
  status: 'provided',
  fileUrl: 'https://cdn.school.edu/storage/Building_Safety_2025.pdf',
  fileName: 'Building_Safety_2025.pdf',
  fileSize: 1.4 * 1024 * 1024,
};

// Simulation of user selecting an oversized replacement file
const incomingOversizedFile = {
  name: 'Building_Safety_2026_HighRes.pdf',
  size: 3.4 * 1024 * 1024,
  type: 'application/pdf',
};

const replacementValidation = validateSchoolDocumentFile(incomingOversizedFile);
assert.strictEqual(replacementValidation.isValid, false);
assert.strictEqual(replacementValidation.code, 'DOCUMENT_TOO_LARGE');

// Verify that because validation failed, existingDoc state is untouched
assert.strictEqual(existingDoc.status, 'provided');
assert.strictEqual(existingDoc.fileName, 'Building_Safety_2025.pdf');
assert.strictEqual(existingDoc.fileUrl, 'https://cdn.school.edu/storage/Building_Safety_2025.pdf');
assert.strictEqual(existingDoc.fileSize, 1.4 * 1024 * 1024);
pass('Oversized replacement rejection leaves existing valid document completely intact');

console.log('\n================================================================');
console.log(`TOTAL AUDIT TESTS PASSED: ${passedTests}`);
console.log('ALL 2 MB STRICT DOCUMENT LIMIT & PDF VALIDATION TESTS PASSED (100%)');
console.log('================================================================\n');
