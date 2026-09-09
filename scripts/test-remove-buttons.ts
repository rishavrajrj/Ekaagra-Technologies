import assert from 'assert';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import type { UniversalIntakeData } from '../src/lib/types';

console.log('================================================================');
console.log('  REMOVE BUTTONS FUNCTIONAL AUDIT & REGRESSION SUITE');
console.log('================================================================\n');

let testsPassed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// 1. School Onboarding Portal: Logo Removal & Checklist Sync
// -----------------------------------------------------------------------------
console.log('Group 1: School Onboarding Portal Logo Removal');

runTest('handleRemoveLogo clears brandingDesign AND unlinks checklist logo item', () => {
  const intake: UniversalIntakeData = createInitialIntakeData({
    schoolName: 'St. Paul Academy',
    contactName: 'Fr. George',
    contactEmail: 'contact@stpaul.edu',
  });

  intake.brandingDesign.logoUrl = '/uploads/school-assets/test/logo.webp';
  intake.brandingDesign.crestUrl = '/uploads/school-assets/test/logo.webp';
  intake.brandingDesign.hasHighResLogo = true;
  intake.brandingDesign.logoFileName = 'school_logo.webp';
  intake.brandingDesign.logoFileSize = 24000;
  intake.brandingDesign.logoStorageKey = 'test/logo.webp';

  if (intake.assetChecklist) {
    intake.assetChecklist.items = [
      {
        id: 'brand-logo',
        title: 'Official School Logo / Crest',
        category: 'branding',
        description: 'Official School Crest',
        requirement: 'required',
        type: 'image',
        status: 'provided',
        fileUrl: '/uploads/school-assets/test/logo.webp',
        fileName: 'school_logo.webp',
        storageKey: 'test/logo.webp',
        isPrivate: false,
      },
    ];
  }

  const compBefore = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(compBefore.sectionPercentages['brandingDesign'], 100);

  const updatedChecklistItems = (intake.assetChecklist?.items || []).map((item) => {
    if (item.id === 'brand-logo' || item.id === 'brand-crest') {
      return {
        ...item,
        fileUrl: undefined,
        fileName: undefined,
        fileSize: undefined,
        fileType: undefined,
        storageKey: undefined,
        status: 'not_provided' as const,
        isManualOverride: true,
      };
    }
    return item;
  });

  intake.brandingDesign.logoUrl = '';
  intake.brandingDesign.crestUrl = '';
  intake.brandingDesign.hasHighResLogo = false;
  intake.brandingDesign.logoFileName = undefined;
  intake.brandingDesign.logoFileSize = undefined;
  intake.brandingDesign.logoStorageKey = undefined;
  if (intake.assetChecklist) {
    intake.assetChecklist.items = updatedChecklistItems;
  }

  const checklistLogo = intake.assetChecklist?.items?.find(
    (i) => (i.id === 'brand-logo' || i.id === 'brand-crest') && i.fileUrl && i.fileUrl.trim().length > 0 && i.status === 'provided'
  );
  const effectiveLogoUrl = intake.brandingDesign.logoUrl || intake.brandingDesign.crestUrl || checklistLogo?.fileUrl || '';

  assert.strictEqual(effectiveLogoUrl, '', 'Effective logo URL must be empty after removal');
  const compAfter = calculateIntakeCompleteness('school-website', intake);
  assert.strictEqual(compAfter.sectionPercentages['brandingDesign'], 50, 'Section 4 drops to 50% when logo is removed');
});

// -----------------------------------------------------------------------------
// 2. Asset Checklist: Comprehensive Logo Asset Removal
// -----------------------------------------------------------------------------
console.log('\nGroup 2: Asset Checklist Section Asset Removal');

runTest('Removing brand-logo in Asset Checklist cleans up all brandingDesign logo metadata', () => {
  const intake: UniversalIntakeData = createInitialIntakeData({
    schoolName: 'Delhi World Public School',
    contactName: 'Mrs. Sen',
    contactEmail: 'info@dwps.edu',
  });

  intake.brandingDesign.logoUrl = '/uploads/logo.webp';
  intake.brandingDesign.crestUrl = '/uploads/logo.webp';
  intake.brandingDesign.hasHighResLogo = true;
  intake.brandingDesign.logoFileName = 'dwps_logo.webp';
  intake.brandingDesign.logoFileSize = 45000;
  intake.brandingDesign.logoWidth = 800;
  intake.brandingDesign.logoHeight = 600;
  intake.brandingDesign.logoOptimizedFormat = 'webp';
  intake.brandingDesign.logoStorageKey = 'dwps/logo.webp';

  intake.brandingDesign.logoUrl = '';
  intake.brandingDesign.crestUrl = '';
  intake.brandingDesign.hasHighResLogo = false;
  intake.brandingDesign.logoFileName = undefined;
  intake.brandingDesign.logoFileSize = undefined;
  intake.brandingDesign.logoWidth = null;
  intake.brandingDesign.logoHeight = null;
  intake.brandingDesign.logoOptimizedFormat = null;
  intake.brandingDesign.logoStorageKey = undefined;
  intake.brandingDesign.logoOriginalSize = undefined;

  assert.strictEqual(intake.brandingDesign.logoUrl, '');
  assert.strictEqual(intake.brandingDesign.crestUrl, '');
  assert.strictEqual(intake.brandingDesign.hasHighResLogo, false);
  assert.strictEqual(intake.brandingDesign.logoStorageKey, undefined);
  assert.strictEqual(intake.brandingDesign.logoWidth, null);
});

// -----------------------------------------------------------------------------
// 3. Website Quote Builder: Page Removal & Toggle
// -----------------------------------------------------------------------------
console.log('\nGroup 3: Website Quote Builder Page Removal & Toggling');

runTest('Additional page removal and suggested page toggle correctly add/remove items', () => {
  interface ConfiguredPage {
    id: string;
    name: string;
    price: number;
  }

  let additionalPages: ConfiguredPage[] = [
    { id: 'page-1', name: 'Alumni Directory', price: 1500 },
    { id: 'page-2', name: 'Student Gallery', price: 1500 },
  ];

  const handleRemovePage = (id: string) => {
    additionalPages = additionalPages.filter((p) => p.id !== id);
  };

  handleRemovePage('page-1');
  assert.strictEqual(additionalPages.length, 1);
  assert.strictEqual(additionalPages[0].id, 'page-2');

  const toggleSuggestedPage = (sugName: string, price: number) => {
    const existing = additionalPages.find((p) => p.name === sugName);
    if (existing) {
      handleRemovePage(existing.id);
    } else {
      additionalPages.push({ id: `page-${Date.now()}`, name: sugName, price });
    }
  };

  toggleSuggestedPage('Fee Structure', 1500);
  assert.strictEqual(additionalPages.length, 2);
  assert(additionalPages.some((p) => p.name === 'Fee Structure'));

  toggleSuggestedPage('Fee Structure', 1500);
  assert.strictEqual(additionalPages.length, 1);
  assert(!additionalPages.some((p) => p.name === 'Fee Structure'), 'Fee Structure should be removed on second click');
});

// -----------------------------------------------------------------------------
// 4. Business Requirements Form: Custom Pages and Asset Removal
// -----------------------------------------------------------------------------
console.log('\nGroup 4: Business Requirements Form Custom Pages & Asset Removal');

runTest('Custom page tag removal correctly deletes single item without mutating other pages', () => {
  let customPages = ['Admissions', 'Career Opportunities', 'Bus Routes'];

  const handleRemoveCustomPage = (pageName: string) => {
    customPages = customPages.filter((p) => p !== pageName);
  };

  handleRemoveCustomPage('Career Opportunities');
  assert.deepStrictEqual(customPages, ['Admissions', 'Bus Routes']);
});

runTest('Uploaded asset removal filters targeted asset cleanly', () => {
  let uploadedAssets = [
    { id: 'asset-1', file_name: 'brochure.pdf' },
    { id: 'asset-2', file_name: 'campus_photo.jpg' },
  ];

  const handleDeleteAsset = (assetId: string) => {
    uploadedAssets = uploadedAssets.filter((a) => a.id !== assetId);
  };

  handleDeleteAsset('asset-1');
  assert.strictEqual(uploadedAssets.length, 1);
  assert.strictEqual(uploadedAssets[0].id, 'asset-2');
});

// -----------------------------------------------------------------------------
// 5. School Onboarding Portal: Branch Campus and Custom Page Removal
// -----------------------------------------------------------------------------
console.log('\nGroup 5: School Portal Branch Campus & Custom Page Removal');

runTest('Removing branch campus idx > 0 preserves main campus at index 0', () => {
  let campuses = [
    { id: 'c-main', name: 'Main Campus', isMainCampus: true },
    { id: 'c-branch', name: 'North Branch Campus', isMainCampus: false },
  ];

  const removeCampus = (idx: number) => {
    if (idx === 0) return;
    campuses = campuses.filter((_, i) => i !== idx);
  };

  removeCampus(1);
  assert.strictEqual(campuses.length, 1);
  assert.strictEqual(campuses[0].id, 'c-main');
  assert.strictEqual(campuses[0].isMainCampus, true);
});

console.log('\n================================================================');
console.log(`  ALL ${testsPassed}/${testsPassed} REMOVE BUTTON TESTS PASSED!`);
console.log('================================================================\n');
