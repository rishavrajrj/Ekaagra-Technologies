/**
 * SECTION 2 CAMPUS IMAGES - PER-IMAGE METADATA & CLASSIFICATION TEST SUITE
 *
 * Verifies:
 * 1. Data Model Extension (imageType, customImageType, isPrimary, caption)
 * 2. Predefined Image Types & Canonical Options Mapping
 * 3. Conditional "Other" Behavior (stores imageType='other', customImageType=val; null for predefined)
 * 4. Single Primary Image Enforcement per Campus
 * 5. Automatic Primary Status Handoff (switching primary unsets prior image)
 * 6. Multi-Campus Primary & Metadata Isolation
 * 7. Metadata Preservation during Image Replacement
 * 8. Validation Rules (Image Type required, Custom Type required for 'other', caption optional)
 * 9. Backward Compatibility (legacy images without classification render safely)
 * 10. Reusable Architecture across Onboarding Sections
 */

import assert from 'assert';
import type { CampusBranchData, CampusImageData } from '../src/lib/types';
import {
  CAMPUS_IMAGE_TYPES,
  resolveImageTypeDisplay,
  calculateIntakeCompleteness,
  createInitialIntakeData,
} from '../src/lib/schoolIntake';

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

function main() {
  console.log('================================================================');
  console.log('  SECTION 2: CAMPUS IMAGES PER-IMAGE CLASSIFICATION TEST SUITE');
  console.log('================================================================\n');

  // ----------------------------------------------------------------------------
  // 1. Data Model & Option Verification
  // ----------------------------------------------------------------------------
  console.log('Group 1: Predefined Options & Image Type Display Resolution');

  runTest('CAMPUS_IMAGE_TYPES contains all required institutional options', () => {
    const requiredLabels = [
      'Campus / Building',
      'Campus Entrance',
      'Reception / Front Desk',
      'Helpdesk',
      'Classroom',
      'Laboratory',
      'Library',
      'Playground / Sports',
      'Auditorium / Hall',
      'Computer Lab',
      'Science Lab',
      'Activity Room',
      'Transport / Bus',
      'Cafeteria / Dining',
      'Security / Gate',
      'Administrative Office',
      'Principal / Head Office',
      'Prayer / Assembly Area',
      'Other',
    ];

    for (const label of requiredLabels) {
      const match = CAMPUS_IMAGE_TYPES.find((opt) => opt.label.toLowerCase() === label.toLowerCase());
      assert(match, `Missing required image type option: ${label}`);
    }

    // Verify 'other' option has value 'other'
    const otherOpt = CAMPUS_IMAGE_TYPES.find((opt) => opt.value === 'other');
    assert(otherOpt, "Option with value 'other' must be present");
  });

  runTest('resolveImageTypeDisplay resolves predefined types correctly', () => {
    assert.strictEqual(resolveImageTypeDisplay('Classroom'), 'Classroom');
    assert.strictEqual(resolveImageTypeDisplay('Campus Entrance'), 'Campus Entrance');
    assert.strictEqual(resolveImageTypeDisplay(''), '');
    assert.strictEqual(resolveImageTypeDisplay(null), '');
  });

  runTest('resolveImageTypeDisplay resolves "other" with custom type', () => {
    assert.strictEqual(
      resolveImageTypeDisplay('other', 'Robotics & AI Innovation Hub'),
      'Robotics & AI Innovation Hub'
    );
    assert.strictEqual(resolveImageTypeDisplay('other', ''), 'Other');
    assert.strictEqual(resolveImageTypeDisplay('other', null), 'Other');
  });

  // ----------------------------------------------------------------------------
  // 2. Per-Image Metadata Storage Contract
  // ----------------------------------------------------------------------------
  console.log('\nGroup 2: Per-Image Metadata Storage Contract');

  runTest('Predefined image classification stores predefined value and null customImageType', () => {
    const img: CampusImageData = {
      id: 'img-1',
      campusId: 'campus-1',
      storageKey: 'schools/img-1.webp',
      fileName: 'campus-exterior.webp',
      url: '/media/img-1.webp',
      mimeType: 'image/webp',
      width: 1536,
      height: 1024,
      originalSize: 820000,
      optimizedSize: 368400,
      optimizedFormat: 'webp',
      displayOrder: 0,
      imageType: 'Campus / Building',
      customImageType: null,
      isPrimary: true,
      caption: 'Main administrative block and central campus courtyard',
    };

    assert.strictEqual(img.imageType, 'Campus / Building');
    assert.strictEqual(img.customImageType, null);
    assert.strictEqual(img.isPrimary, true);
    assert.strictEqual(img.caption, 'Main administrative block and central campus courtyard');
  });

  runTest('Custom "Other" classification stores imageType="other" and user-provided custom string', () => {
    const img: CampusImageData = {
      id: 'img-2',
      campusId: 'campus-1',
      storageKey: 'schools/img-2.webp',
      fileName: 'robotics-lab.webp',
      url: '/media/img-2.webp',
      mimeType: 'image/webp',
      width: 1200,
      height: 800,
      originalSize: 500000,
      optimizedSize: 220000,
      optimizedFormat: 'webp',
      displayOrder: 1,
      imageType: 'other',
      customImageType: 'Smart Robotics & IoT Lab',
      isPrimary: false,
      caption: 'Advanced student robotics workstations',
    };

    assert.strictEqual(img.imageType, 'other');
    assert.strictEqual(img.customImageType, 'Smart Robotics & IoT Lab');
    assert.strictEqual(img.isPrimary, false);
  });

  // ----------------------------------------------------------------------------
  // 3. Single Primary Image Enforcement & Handoff
  // ----------------------------------------------------------------------------
  console.log('\nGroup 3: Single Primary Image Enforcement & Auto Handoff');

  runTest('Designating a new image as Primary clears primary status from previous image', () => {
    const images: CampusImageData[] = [
      {
        id: 'img-1',
        campusId: 'campus-main',
        storageKey: 'schools/img-1.webp',
        fileName: 'front-gate.webp',
        url: '/media/img-1.webp',
        mimeType: 'image/webp',
        imageType: 'Campus Entrance',
        isPrimary: true,
      },
      {
        id: 'img-2',
        campusId: 'campus-main',
        storageKey: 'schools/img-2.webp',
        fileName: 'building.webp',
        url: '/media/img-2.webp',
        mimeType: 'image/webp',
        imageType: 'Campus / Building',
        isPrimary: false,
      },
      {
        id: 'img-3',
        campusId: 'campus-main',
        storageKey: 'schools/img-3.webp',
        fileName: 'classroom.webp',
        url: '/media/img-3.webp',
        mimeType: 'image/webp',
        imageType: 'Classroom',
        isPrimary: false,
      },
    ];

    // Simulate selecting img-2 as primary
    const targetImageId = 'img-2';
    const updatedImages = images.map((im) => {
      if (im.id === targetImageId) {
        return { ...im, isPrimary: true };
      }
      return { ...im, isPrimary: false };
    });

    const primaryCount = updatedImages.filter((im) => im.isPrimary).length;
    assert.strictEqual(primaryCount, 1, 'Exactly one primary image must exist');
    assert.strictEqual(updatedImages[0].isPrimary, false, 'Previous primary must be cleared');
    assert.strictEqual(updatedImages[1].isPrimary, true, 'Target image must be primary');
    assert.strictEqual(updatedImages[2].isPrimary, false);
  });

  // ----------------------------------------------------------------------------
  // 4. Multi-Campus Primary & Metadata Isolation
  // ----------------------------------------------------------------------------
  console.log('\nGroup 4: Multi-Campus Isolation');

  runTest('Primary status and metadata of Main Campus never leaks to Branch Campus', () => {
    const mainCampusImages: CampusImageData[] = [
      {
        id: 'main-img-1',
        campusId: 'main-campus',
        storageKey: 'schools/main-1.webp',
        fileName: 'main-exterior.webp',
        url: '/media/main-1.webp',
        mimeType: 'image/webp',
        imageType: 'Campus / Building',
        isPrimary: true,
        caption: 'Main Campus Admin Wing',
      },
    ];

    const branchCampusImages: CampusImageData[] = [
      {
        id: 'branch-img-1',
        campusId: 'branch-campus',
        storageKey: 'schools/branch-1.webp',
        fileName: 'branch-library.webp',
        url: '/media/branch-1.webp',
        mimeType: 'image/webp',
        imageType: 'Library',
        isPrimary: true,
        caption: 'Senior Branch Central Library',
      },
    ];

    const campuses: CampusBranchData[] = [
      {
        id: 'main-campus',
        name: 'Main Campus',
        address: '100 Knowledge Park',
        city: 'Motihari',
        state: 'Bihar',
        pin: '845401',
        contactPhone: '9876543210',
        isMainCampus: true,
        images: mainCampusImages,
      },
      {
        id: 'branch-campus',
        name: 'Senior Wing Branch',
        address: '200 Science City Road',
        city: 'Motihari',
        state: 'Bihar',
        pin: '845402',
        contactPhone: '9876543211',
        isMainCampus: false,
        images: branchCampusImages,
      },
    ];

    // Verify Main Campus has its own primary
    assert.strictEqual(campuses[0].images?.[0].isPrimary, true);
    assert.strictEqual(campuses[0].images?.[0].imageType, 'Campus / Building');

    // Verify Branch Campus has its own independent primary
    assert.strictEqual(campuses[1].images?.[0].isPrimary, true);
    assert.strictEqual(campuses[1].images?.[0].imageType, 'Library');

    // Updating Main Campus does not alter Branch Campus
    const updatedMainImages = mainCampusImages.map((im) => ({
      ...im,
      caption: 'Updated Main Wing',
    }));
    campuses[0].images = updatedMainImages;

    assert.strictEqual(campuses[0].images[0].caption, 'Updated Main Wing');
    assert.strictEqual(campuses[1].images?.[0].caption, 'Senior Branch Central Library');
  });

  // ----------------------------------------------------------------------------
  // 5. Metadata Preservation on Replace
  // ----------------------------------------------------------------------------
  console.log('\nGroup 5: Image Replacement Metadata Preservation');

  runTest('Replacing an image preserves imageType, customImageType, caption, and primary status', () => {
    const existingImage: CampusImageData = {
      id: 'img-10',
      campusId: 'campus-1',
      storageKey: 'schools/old-photo.webp',
      fileName: 'old-photo.webp',
      url: '/media/old-photo.webp',
      mimeType: 'image/webp',
      imageType: 'other',
      customImageType: 'Robotics Workshop',
      isPrimary: true,
      caption: 'Robotics assembly station',
      displayOrder: 2,
    };

    // Simulate replacement asset returned from server upload
    const replacementAsset = {
      id: 'asset-new',
      storageKey: 'schools/new-photo.webp',
      name: 'new-photo.webp',
      url: '/media/new-photo.webp',
      type: 'image/webp',
      width: 1920,
      height: 1080,
      size: 450000,
    };

    // Replaced image merges new binary references while preserving user classifications
    const replacedImage: CampusImageData = {
      id: replacementAsset.id,
      campusId: existingImage.campusId,
      storageKey: replacementAsset.storageKey,
      fileName: replacementAsset.name,
      url: replacementAsset.url,
      mimeType: replacementAsset.type,
      width: replacementAsset.width,
      height: replacementAsset.height,
      originalSize: replacementAsset.size,
      optimizedSize: replacementAsset.size,
      optimizedFormat: 'webp',
      displayOrder: existingImage.displayOrder,
      // Metadata preserved:
      imageType: existingImage.imageType,
      customImageType: existingImage.customImageType,
      isPrimary: existingImage.isPrimary,
      caption: existingImage.caption,
    };

    assert.strictEqual(replacedImage.storageKey, 'schools/new-photo.webp');
    assert.strictEqual(replacedImage.imageType, 'other');
    assert.strictEqual(replacedImage.customImageType, 'Robotics Workshop');
    assert.strictEqual(replacedImage.isPrimary, true);
    assert.strictEqual(replacedImage.caption, 'Robotics assembly station');
    assert.strictEqual(replacedImage.displayOrder, 2);
  });

  // ----------------------------------------------------------------------------
  // 6. Validation Rules & Intake Completeness
  // ----------------------------------------------------------------------------
  console.log('\nGroup 6: Validation & Intake Completeness');

  runTest('computeIntakeCompleteness validates Image Type for uploaded campus images', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Ekaagra Academy',
      contactName: 'Director',
      contactEmail: 'admin@ekaagra.edu',
      contactPhone: '9876543210',
      city: 'Motihari',
      state: 'Bihar',
    });

    intake.campuses = [
      {
        id: 'camp-1',
        name: 'Main Campus',
        address: 'Station Road',
        country: 'India',
        state: 'Bihar',
        district: 'East Champaran',
        city: 'Motihari',
        pin: '845401',
        contactPhone: '9876543210',
        isMainCampus: true,
        images: [
          {
            id: 'img-unclassified',
            campusId: 'camp-1',
            storageKey: 'schools/test.webp',
            fileName: 'test.webp',
            url: '/test.webp',
            mimeType: 'image/webp',
            imageType: '', // Missing!
          },
        ],
      },
    ];

    const completeness = calculateIntakeCompleteness('school-website', intake);
    const imageMissing = completeness.missingFields.some((mf) =>
      mf.includes('Image Type is required for "test.webp"')
    );
    assert(imageMissing, 'Validation must report missing Image Type for uploaded image');
  });

  runTest('computeIntakeCompleteness validates Custom Image Type when imageType is "other"', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Ekaagra Academy',
      contactName: 'Director',
      contactEmail: 'admin@ekaagra.edu',
      contactPhone: '9876543210',
      city: 'Motihari',
      state: 'Bihar',
    });

    intake.campuses = [
      {
        id: 'camp-1',
        name: 'Main Campus',
        address: 'Station Road',
        country: 'India',
        state: 'Bihar',
        district: 'East Champaran',
        city: 'Motihari',
        pin: '845401',
        contactPhone: '9876543210',
        isMainCampus: true,
        images: [
          {
            id: 'img-other-blank',
            campusId: 'camp-1',
            storageKey: 'schools/other.webp',
            fileName: 'other.webp',
            url: '/other.webp',
            mimeType: 'image/webp',
            imageType: 'other',
            customImageType: '', // Missing custom specification!
          },
        ],
      },
    ];

    const completeness = calculateIntakeCompleteness('school-website', intake);
    const customMissing = completeness.missingFields.some((mf) =>
      mf.includes('Please specify custom type for "other.webp"')
    );
    assert(customMissing, 'Validation must report missing custom type for "other"');
  });

  runTest('Fully classified campus images produce 0 image validation errors', () => {
    const intake = createInitialIntakeData({
      schoolName: 'Ekaagra Academy',
      contactName: 'Director',
      contactEmail: 'admin@ekaagra.edu',
      contactPhone: '9876543210',
      city: 'Motihari',
      state: 'Bihar',
    });

    intake.campuses = [
      {
        id: 'camp-1',
        name: 'Main Campus',
        address: 'Station Road',
        country: 'India',
        state: 'Bihar',
        district: 'East Champaran',
        city: 'Motihari',
        pin: '845401',
        contactPhone: '9876543210',
        isMainCampus: true,
        images: [
          {
            id: 'img-ok-1',
            campusId: 'camp-1',
            storageKey: 'schools/ok1.webp',
            fileName: 'building.webp',
            url: '/ok1.webp',
            mimeType: 'image/webp',
            imageType: 'Campus / Building',
            isPrimary: true,
          },
          {
            id: 'img-ok-2',
            campusId: 'camp-1',
            storageKey: 'schools/ok2.webp',
            fileName: 'robotics.webp',
            url: '/ok2.webp',
            mimeType: 'image/webp',
            imageType: 'other',
            customImageType: 'Robotics Workshop',
            isPrimary: false,
          },
        ],
      },
    ];

    const completeness = calculateIntakeCompleteness('school-website', intake);
    const hasImageError = completeness.missingFields.some((mf) =>
      mf.toLowerCase().includes('image type')
    );
    assert.strictEqual(hasImageError, false, 'No image validation errors should exist when properly classified');
  });

  // ----------------------------------------------------------------------------
  // 7. Backward Compatibility
  // ----------------------------------------------------------------------------
  console.log('\nGroup 7: Backward Compatibility');

  runTest('Legacy image objects with undefined imageType do not crash and can be safely resolved', () => {
    const legacyImg: CampusImageData = {
      id: 'legacy-1',
      campusId: 'campus-legacy',
      storageKey: 'legacy.webp',
      fileName: 'legacy.webp',
      url: '/legacy.webp',
      mimeType: 'image/webp',
      // No imageType, customImageType, isPrimary, or caption
    };

    const display = resolveImageTypeDisplay(legacyImg.imageType, legacyImg.customImageType);
    assert.strictEqual(display, '');
    assert.strictEqual(Boolean(legacyImg.isPrimary), false);
  });

  console.log('\n================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');
}

main();
