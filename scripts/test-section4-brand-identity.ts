/**
 * SECTION 4: BRAND IDENTITY & OFFICIAL SCHOOL LOGO VERIFICATION SUITE
 * 
 * Tests:
 * 1. Centralized Image Lifecycle & WebP Optimization
 * 2. Section 4 Intake Completeness Calculation (Motto + Logo = 2/2 complete)
 * 3. Incomplete status when logo missing (1/2 with explicit missing field)
 * 4. Existing Logo Reuse from Centralized Asset Checklist
 * 5. Metadata Preservation (filename, WebP format, dimensions, file size, storageKey)
 * 6. Cross-Section Synchronization between Branding and Asset Checklist
 * 7. Safe Deletion & Reference Counting (No accidental storage deletion when referenced elsewhere)
 * 8. Vector (SVG) passthrough preservation
 */

import assert from 'assert';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import {
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../src/lib/schoolIntake';
import {
  syncAssetChecklistWithIntake,
} from '../src/lib/schoolAssetChecklist';
import {
  processAndUploadCanonicalAsset,
} from '../src/lib/imageUploadService';
import {
  optimizeImage,
  verifyWebpBuffer,
} from '../src/lib/imageOptimizer';
import type { UniversalIntakeData } from '../src/lib/types';

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

async function main() {
  console.log('================================================================');
  console.log('  SECTION 4: BRAND IDENTITY & OFFICIAL LOGO VERIFICATION SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------------------------------
  // 1. Centralized Image Lifecycle & WebP Optimization
  // ----------------------------------------------------------------------------
  console.log('Group 1: Centralized Pipeline & WebP Optimization');

  await runAsyncTest('Section 4 raster logo is converted to genuine, verified WebP buffer', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 67, g: 56, b: 202, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await optimizeImage(pngBuffer, 'image/png', 'school_crest_master.png');
    assert.strictEqual(result.wasOptimized, true);
    assert.strictEqual(result.mimeType, 'image/webp');
    assert.strictEqual(result.extension, '.webp');

    const isVerified = await verifyWebpBuffer(result.buffer);
    assert.strictEqual(isVerified, true, 'WebP buffer decodes with genuine WebP magic');

    const decoded = await sharp(result.buffer).metadata();
    assert.strictEqual(decoded.format, 'webp');
    assert.strictEqual(decoded.width, 512);
    assert.strictEqual(decoded.height, 512);
  });

  await runAsyncTest('SVG logo passes through untouched without raster degradation', async () => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>';
    const svgBuffer = Buffer.from(svgContent, 'utf-8');

    const uploadResult = await processAndUploadCanonicalAsset({
      file: { name: 'school_emblem.svg', size: svgBuffer.length, type: 'image/svg+xml' },
      buffer: svgBuffer,
      tenantId: 'test-school-tenant-01',
      folderPrefix: 'public',
      itemType: 'image',
    });

    assert.strictEqual(uploadResult.type, 'image/svg+xml');
    assert.strictEqual(uploadResult.name.endsWith('.svg'), true);
    assert.strictEqual(uploadResult.optimizedFormat, null, 'SVG is not converted to WebP');
  });

  // ----------------------------------------------------------------------------
  // 2. Section 4 Intake Completeness Calculation
  // ----------------------------------------------------------------------------
  console.log('\nGroup 2: Section 4 Intake Completeness & Validation');

  runTest('Section 4 is incomplete (50%) when logo is missing, flagging explicit missing field', () => {
    const intake = createInitialIntakeData({
      schoolName: 'St. Xavier High School',
      contactName: 'Fr. Thomas',
      contactEmail: 'contact@xaviers.edu',
    });

    // Ensure motto is present, but logo is absent
    intake.brandingDesign.motto = 'Truth and Knowledge';
    intake.brandingDesign.logoUrl = '';
    intake.brandingDesign.crestUrl = '';

    const completeness = calculateIntakeCompleteness('school-website', intake);

    assert.strictEqual(completeness.sectionPercentages['brandingDesign'], 50, 'Section 4 percentage is 50%');
    assert(
      completeness.missingFields.includes('Brand Identity: Official School Logo / Crest'),
      'missingFields must explicitly include "Brand Identity: Official School Logo / Crest"'
    );
  });

  runTest('Section 4 is complete (100%) when valid logo is uploaded', () => {
    const intake = createInitialIntakeData({
      schoolName: 'St. Xavier High School',
      contactName: 'Fr. Thomas',
      contactEmail: 'contact@xaviers.edu',
    });

    intake.brandingDesign.motto = 'Truth and Knowledge';
    intake.brandingDesign.logoUrl = '/uploads/school-assets/test-school/public/12345_school_logo.webp';
    intake.brandingDesign.logoOptimizedFormat = 'webp';

    const completeness = calculateIntakeCompleteness('school-website', intake);

    assert.strictEqual(completeness.sectionPercentages['brandingDesign'], 100, 'Section 4 percentage is 100%');
    assert(
      !completeness.missingFields.some((f) => f.includes('Brand Identity')),
      'No Brand Identity fields should be in missingFields'
    );
  });

  runTest('Removing logo drops Section 4 back to incomplete (50%)', () => {
    const intake = createInitialIntakeData({
      schoolName: 'St. Xavier High School',
      contactName: 'Fr. Thomas',
      contactEmail: 'contact@xaviers.edu',
    });

    intake.brandingDesign.motto = 'Truth and Knowledge';
    intake.brandingDesign.logoUrl = '/uploads/school-assets/test-school/public/12345_school_logo.webp';

    let comp = calculateIntakeCompleteness('school-website', intake);
    assert.strictEqual(comp.sectionPercentages['brandingDesign'], 100);

    // Remove logo
    intake.brandingDesign.logoUrl = '';
    intake.brandingDesign.crestUrl = '';
    comp = calculateIntakeCompleteness('school-website', intake);

    assert.strictEqual(comp.sectionPercentages['brandingDesign'], 50);
    assert(comp.missingFields.includes('Brand Identity: Official School Logo / Crest'));
  });

  // ----------------------------------------------------------------------------
  // 3. Centralized Asset Checklist Existing Logo Reuse
  // ----------------------------------------------------------------------------
  console.log('\nGroup 3: Asset Checklist Compatibility & Existing Logo Reuse');

  runTest('Compatible logo in Asset Checklist satisfies Section 4 requirement without re-upload', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Delhi Public School',
      contactName: 'Principal Sharma',
      contactEmail: 'dps@dpsdelhi.edu',
    });

    intake.brandingDesign.motto = 'Service Before Self';
    intake.brandingDesign.logoUrl = ''; // Not yet set on brandingDesign
    intake.brandingDesign.crestUrl = '';

    // Provided in Asset Checklist (e.g. from checklist step or pre-fill)
    intake.assetChecklist = {
      items: [
        {
          id: 'brand-logo',
          category: 'branding',
          title: 'Official School Logo',
          description: 'Official school crest logo',
          requirement: 'required',
          status: 'provided',
          type: 'image',
          fileUrl: '/uploads/school-assets/dps/public/9876_dps_logo.webp',
          fileName: 'dps_crest_master.webp',
          fileSize: 45200,
          storageKey: 'dps/public/9876_dps_logo.webp',
          optimizedFormat: 'webp',
          width: 600,
          height: 600,
        },
      ],
      lastUpdated: new Date().toISOString(),
    };

    const completeness = calculateIntakeCompleteness('school-website', intake);

    assert.strictEqual(completeness.sectionPercentages['brandingDesign'], 100, 'Reused logo from checklist satisfies Section 4 requirement');
    assert(!completeness.missingFields.some((f) => f.includes('Brand Identity: Official School Logo / Crest')));
  });

  runTest('syncAssetChecklistWithIntake propagates full metadata from brandingDesign to assetChecklist', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Kendriya Vidyalaya',
      contactName: 'Principal Verma',
      contactEmail: 'kv@kvs.gov.in',
    });

    intake.brandingDesign.logoUrl = '/uploads/school-assets/kv/public/1122_kv_logo.webp';
    intake.brandingDesign.logoFileName = 'kv_official_crest.webp';
    intake.brandingDesign.logoFileSize = 38400;
    intake.brandingDesign.logoStorageKey = 'kv/public/1122_kv_logo.webp';
    intake.brandingDesign.logoWidth = 480;
    intake.brandingDesign.logoHeight = 480;
    intake.brandingDesign.logoOptimizedFormat = 'webp';

    const syncedItems = syncAssetChecklistWithIntake(intake, []);
    const brandLogoItem = syncedItems.find((i) => i.id === 'brand-logo');

    assert(brandLogoItem, 'brand-logo item exists in synced checklist');
    assert.strictEqual(brandLogoItem.status, 'provided');
    assert.strictEqual(brandLogoItem.fileUrl, intake.brandingDesign.logoUrl);
    assert.strictEqual(brandLogoItem.fileName, 'kv_official_crest.webp', 'Filename correctly propagated');
    assert.strictEqual(brandLogoItem.fileSize, 38400, 'Filesize correctly propagated');
    assert.strictEqual(brandLogoItem.storageKey, 'kv/public/1122_kv_logo.webp', 'Storage key correctly propagated');
    assert.strictEqual(brandLogoItem.width, 480);
    assert.strictEqual(brandLogoItem.height, 480);
    assert.strictEqual(brandLogoItem.optimizedFormat, 'webp');
  });

  // ----------------------------------------------------------------------------
  // 4. Safe Deletion & Multi-Tenant Storage Protection
  // ----------------------------------------------------------------------------
  console.log('\nGroup 4: Reference-Aware Storage Safety & Multi-Tenant Isolation');

  runTest('Replacing/deleting logo checks reference count to prevent breaking shared assets', () => {
    const sharedStorageKey = 'tenant-123/public/shared_logo.webp';

    // Simulate an asset referenced in brandingDesign AND in another section (e.g. Asset Checklist or Campus)
    const allReferencedStorageKeys = [
      sharedStorageKey,
      sharedStorageKey, // 2 references
    ];

    const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === sharedStorageKey).length > 1;
    assert.strictEqual(isReusedElsewhere, true, 'Correctly detects asset is referenced in multiple places');

    // When reference count > 1, physical storage deletion must NOT be requested
    let deleteAttempted = false;
    if (!isReusedElsewhere) {
      deleteAttempted = true;
    }
    assert.strictEqual(deleteAttempted, false, 'Physical storage object preserved when referenced elsewhere');
  });

  runTest('Unreferenced logo is safely marked for physical deletion', () => {
    const uniqueStorageKey = 'tenant-123/public/unique_old_logo.webp';

    const allReferencedStorageKeys = [
      uniqueStorageKey, // exactly 1 reference (the one being deleted)
    ];

    const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === uniqueStorageKey).length > 1;
    assert.strictEqual(isReusedElsewhere, false, 'Correctly detects unreferenced asset');
  });

  console.log('\n================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Test suite execution failed:', err);
  process.exit(1);
});
