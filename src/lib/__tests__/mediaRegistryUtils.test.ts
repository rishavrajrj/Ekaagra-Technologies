/**
 * ==============================================================================
 * CENTRALIZED SCHOOL MEDIA REGISTRY & DEDUPLICATION TEST SUITE
 * File: src/lib/__tests__/mediaRegistryUtils.test.ts
 * ==============================================================================
 */

import {
  computeBufferSha256,
  findDuplicateAsset,
  getEffectiveMediaRegistry,
  registerMediaAsset,
  attachAssetToSection,
  detachAssetFromSection,
  filterAssetsForSection,
  isAssetRelevantForSection,
  campusImageToSharedAsset,
  sharedAssetToCampusImage,
  purgeAssetFromIntake,
  FACILITY_CATEGORY_RECOMMENDATIONS,
} from '../mediaRegistryUtils';
import { createInitialIntakeData } from '../schoolIntake';
import type { UniversalIntakeData, SharedMediaAsset, CampusImageData } from '../types';

async function runMediaRegistryTestSuite() {
  console.log('🧪 Starting Centralized School Media Registry & Deduplication Unit Tests...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`, details || '');
      failed++;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SHA-256 CONTENT HASHING & DUPLICATE DETECTION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Testing SHA-256 Hashing & Duplicate Interception ---');

  const sampleBuffer1 = new TextEncoder().encode('photo-binary-content-sample-alpha');
  const sampleBuffer2 = new TextEncoder().encode('photo-binary-content-sample-alpha');
  const sampleBuffer3 = new TextEncoder().encode('photo-binary-content-sample-beta');

  const hash1 = await computeBufferSha256(sampleBuffer1);
  const hash2 = await computeBufferSha256(sampleBuffer2);
  const hash3 = await computeBufferSha256(sampleBuffer3);

  assert(typeof hash1 === 'string' && hash1.length === 64, 'Generated SHA-256 hash is a 64-character hex string');
  assert(hash1 === hash2, 'Identical file content generates identical SHA-256 hashes');
  assert(hash1 !== hash3, 'Different file content generates different SHA-256 hashes');

  const sampleRegistry: SharedMediaAsset[] = [
    {
      id: 'asset-1',
      url: 'https://storage.school.test/campus/smart-class-1.webp',
      fileName: 'smart-class-1.jpg',
      mimeType: 'image/webp',
      size: 145000,
      hash: hash1,
      categories: ['classrooms'],
      source: 'campus',
      usedIn: ['campus'],
      uploadedAt: new Date().toISOString(),
    },
    {
      id: 'asset-2',
      url: 'https://storage.school.test/campus/science-lab-1.webp',
      fileName: 'physics-lab.jpg',
      mimeType: 'image/webp',
      size: 210000,
      hash: hash3,
      categories: ['laboratories'],
      source: 'facilities',
      usedIn: ['facility_science_lab'],
      uploadedAt: new Date().toISOString(),
    },
  ];

  // Test findDuplicateAsset with hash
  const duplicateByHash = findDuplicateAsset(sampleRegistry, hash1);
  assert(duplicateByHash !== null && duplicateByHash.id === 'asset-1', 'Duplicate detected accurately via SHA-256 hash match');

  // Test findDuplicateAsset with non-existent hash
  const noDuplicate = findDuplicateAsset(sampleRegistry, 'non-existent-sha256-hash-0000000000000000000000000000000000000000');
  assert(noDuplicate === null, 'Non-matching hash returns null (no duplicate detected)');

  // Test findDuplicateAsset with filename + byte size fallback
  const duplicateByNameSize = findDuplicateAsset(sampleRegistry, null, {
    name: 'physics-lab.jpg',
    size: 210000,
  });
  assert(duplicateByNameSize !== null && duplicateByNameSize.id === 'asset-2', 'Duplicate detected via exact filename and size fallback');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. GLOBAL EFFECTIVE MEDIA REGISTRY & BACKWARD COMPATIBILITY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing Effective Media Registry Aggregation ---');

  const intake = createInitialIntakeData({ schoolName: 'Greenwood High School' });

  // Add campus images
  intake.campuses = [
    {
      id: 'campus-main',
      name: 'Main Campus',
      address: '123 School Lane',
      city: 'Patna',
      state: 'Bihar',
      pin: '800001',
      phone: '9876543210',
      email: 'main@greenwood.test',
      isMainCampus: true,
      images: [
        {
          id: 'img-campus-1',
          campusId: 'campus-main',
          storageKey: 'campus-1.webp',
          fileName: 'campus_facade.jpg',
          url: 'https://storage.school.test/campus/facade.webp',
          mimeType: 'image/webp',
          checksumSha256: 'hash-campus-facade-001',
          category: 'campus_buildings',
          imageCategory: 'campus_buildings',
          optimizedSize: 180000,
        },
        {
          id: 'img-campus-2',
          campusId: 'campus-main',
          storageKey: 'campus-class-1.webp',
          fileName: 'smart_room_a.jpg',
          url: 'https://storage.school.test/campus/smart_room_a.webp',
          mimeType: 'image/webp',
          checksumSha256: 'hash-class-room-002',
          category: 'classrooms',
          imageCategory: 'classrooms',
          optimizedSize: 150000,
        },
      ],
    },
  ];

  // Add facility photos
  intake.facilitiesConfig = {
    ...intake.facilitiesConfig,
    facilities: {
      smart_classrooms: {
        id: 'smart_classrooms',
        available: true,
        photos: [
          {
            id: 'img-fac-smart-1',
            campusId: 'campus-main',
            storageKey: 'campus-class-1.webp',
            fileName: 'smart_room_a.jpg',
            url: 'https://storage.school.test/campus/smart_room_a.webp',
            mimeType: 'image/webp',
            checksumSha256: 'hash-class-room-002',
            category: 'classrooms',
            imageCategory: 'classrooms',
            optimizedSize: 150000,
          },
        ],
      },
    },
  } as any;

  const aggregatedRegistry = getEffectiveMediaRegistry(intake);

  assert(aggregatedRegistry.length === 2, `Aggregated registry contains exactly 2 unique physical assets (got ${aggregatedRegistry.length})`);

  const sharedClassroomAsset = aggregatedRegistry.find((a) => a.url === 'https://storage.school.test/campus/smart_room_a.webp');
  assert(Boolean(sharedClassroomAsset), 'Shared classroom asset correctly indexed in registry');
  assert(
    sharedClassroomAsset?.usedIn.includes('campus') && sharedClassroomAsset?.usedIn.includes('facility_smart_classrooms'),
    `Asset usedIn tracking contains both 'campus' and 'facility_smart_classrooms' (got: ${JSON.stringify(sharedClassroomAsset?.usedIn)})`
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 3. MULTI-SECTION REUSE & NON-DESTRUCTIVE DETACHMENT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Multi-Section Attachment & Non-Destructive Detachment ---');

  // Attach campus facade to library
  const { updatedIntakeData: withLibraryAttachment, asset: attachedAsset } = attachAssetToSection(
    intake,
    'https://storage.school.test/campus/facade.webp',
    'facility_library'
  );

  assert(
    Boolean(attachedAsset?.usedIn.includes('facility_library')),
    "Asset attaches 'facility_library' to usedIn"
  );
  assert(
    Boolean(attachedAsset?.usedIn.includes('campus')),
    "Original 'campus' reference remains intact after attaching to facility"
  );

  // Detach from campus
  const detachedIntake = detachAssetFromSection(
    withLibraryAttachment,
    'https://storage.school.test/campus/facade.webp',
    'campus'
  );
  // Also remove from campus branch images array as occurs in UI
  detachedIntake.campuses = (detachedIntake.campuses || []).map((c) => ({
    ...c,
    images: (c.images || []).filter((img) => img.url !== 'https://storage.school.test/campus/facade.webp'),
  }));

  const detachedRegistry = getEffectiveMediaRegistry(detachedIntake);
  const facadeAssetAfterDetach = detachedRegistry.find((a) => a.url === 'https://storage.school.test/campus/facade.webp');

  assert(Boolean(facadeAssetAfterDetach), 'Physical asset is NOT deleted when detached from campus');
  assert(!facadeAssetAfterDetach?.usedIn.includes('campus'), "usedIn no longer contains 'campus'");
  assert(Boolean(facadeAssetAfterDetach?.usedIn.includes('facility_library')), "usedIn still preserves 'facility_library'");

  // ───────────────────────────────────────────────────────────────────────────
  // 4. INTELLIGENT CATEGORY MATCHING FOR FACILITIES
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Intelligent Category Matching Across Facilities ---');

  const testAssets: SharedMediaAsset[] = [
    {
      id: 'a1',
      url: 'url-classroom',
      fileName: 'class.jpg',
      mimeType: 'image/webp',
      size: 100,
      categories: ['classrooms'],
      source: 'campus',
      usedIn: ['campus'],
    },
    {
      id: 'a2',
      url: 'url-lab',
      fileName: 'lab.jpg',
      mimeType: 'image/webp',
      size: 100,
      categories: ['laboratories'],
      source: 'campus',
      usedIn: ['campus'],
    },
    {
      id: 'a3',
      url: 'url-library',
      fileName: 'lib.jpg',
      mimeType: 'image/webp',
      size: 100,
      categories: ['library'],
      source: 'campus',
      usedIn: ['campus'],
    },
    {
      id: 'a4',
      url: 'url-sports',
      fileName: 'turf.jpg',
      mimeType: 'image/webp',
      size: 100,
      categories: ['sports_playground'],
      source: 'campus',
      usedIn: ['campus'],
    },
    {
      id: 'a5',
      url: 'url-bus',
      fileName: 'bus.jpg',
      mimeType: 'image/webp',
      size: 100,
      categories: ['transport'],
      source: 'campus',
      usedIn: ['campus'],
    },
  ];

  // Smart classrooms recommendations
  const smartFilter = filterAssetsForSection(testAssets, 'smart_classrooms');
  assert(smartFilter.recommended.length === 1 && smartFilter.recommended[0].id === 'a1', 'Smart Classrooms correctly recommends classrooms category photo');
  assert(smartFilter.all.length === 5, 'All School Photos list contains all 5 photos');

  // Computer lab recommendations
  const compLabFilter = filterAssetsForSection(testAssets, 'computer_lab');
  const compLabIds = compLabFilter.recommended.map((a) => a.id);
  assert(compLabIds.includes('a1') && compLabIds.includes('a2'), 'Computer Laboratory recommends both classrooms and laboratories photos');

  // Science lab recommendations
  const sciLabFilter = filterAssetsForSection(testAssets, 'science_lab');
  assert(sciLabFilter.recommended.length === 1 && sciLabFilter.recommended[0].id === 'a2', 'Science Laboratory recommends laboratories photo');

  // Library recommendations
  const libFilter = filterAssetsForSection(testAssets, 'library');
  assert(libFilter.recommended.length === 1 && libFilter.recommended[0].id === 'a3', 'Library recommends library photo');

  // Sports recommendations
  const sportsFilter = filterAssetsForSection(testAssets, 'sports_playground');
  assert(sportsFilter.recommended.length === 1 && sportsFilter.recommended[0].id === 'a4', 'Sports & Playground recommends sports_playground photo');

  // Transport recommendations
  const transportFilter = filterAssetsForSection(testAssets, 'transport');
  assert(transportFilter.recommended.length === 1 && transportFilter.recommended[0].id === 'a5', 'Transport recommends transport category photo');

  // ───────────────────────────────────────────────────────────────────────────
  // 5. REGISTER MEDIA ASSET & DUPLICATE INTERCEPTION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing registerMediaAsset ---');

  const newAssetToRegister: SharedMediaAsset = {
    id: 'asset-new-upload',
    url: 'https://storage.school.test/new/facade.webp',
    fileName: 'facade_new.jpg',
    mimeType: 'image/webp',
    size: 190000,
    hash: 'hash-brand-new-007',
    categories: ['campus_buildings'],
    source: 'campus',
    usedIn: ['campus'],
  };

  const { updatedIntakeData: registeredOnce, isDuplicate: dup1 } = registerMediaAsset(intake, newAssetToRegister);
  assert(!dup1, 'First upload of unique asset is NOT flagged as duplicate');
  assert(
    (registeredOnce.mediaRegistry || []).some((a) => a.hash === 'hash-brand-new-007'),
    'New asset added to mediaRegistry'
  );

  // Attempt to register same asset for facility_smart_classrooms
  const identicalUploadAttempt: SharedMediaAsset = {
    id: 'asset-attempt-2',
    url: 'https://storage.school.test/new/facade_dup.webp',
    fileName: 'facade_new.jpg',
    mimeType: 'image/webp',
    size: 190000,
    hash: 'hash-brand-new-007',
    categories: ['classrooms'],
    source: 'facilities',
    usedIn: ['facility_smart_classrooms'],
  };

  const { updatedIntakeData: registeredTwice, isDuplicate: dup2, asset: reusedAsset } = registerMediaAsset(
    registeredOnce,
    identicalUploadAttempt
  );

  assert(dup2, 'Second upload with identical SHA-256 hash is flagged as duplicate');
  assert(
    reusedAsset.usedIn.includes('campus') && reusedAsset.usedIn.includes('facility_smart_classrooms'),
    'Existing asset reused and updated with additional section reference'
  );
  assert(
    (registeredTwice.mediaRegistry || []).filter((a) => a.hash === 'hash-brand-new-007').length === 1,
    'Exactly 1 physical record maintained in mediaRegistry (no redundant entry)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6. CONVERTERS ROUNDTRIP
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Converters ---');

  const campusImg: CampusImageData = {
    id: 'c-img-1',
    campusId: 'campus-main',
    storageKey: 'key-123',
    fileName: 'library.jpg',
    url: 'https://test/lib.webp',
    mimeType: 'image/webp',
    category: 'library',
    checksumSha256: 'hash-lib-999',
    caption: 'Quiet reading room',
    isHero: true,
  };

  const sharedConverted = campusImageToSharedAsset(campusImg, 'campus', ['campus']);
  assert(sharedConverted.url === campusImg.url, 'campusImageToSharedAsset preserves URL');
  assert(sharedConverted.hash === 'hash-lib-999', 'campusImageToSharedAsset preserves checksumSha256');
  assert(sharedConverted.isHero === true, 'campusImageToSharedAsset preserves isHero');

  const backToCampus = sharedAssetToCampusImage(sharedConverted);
  assert(backToCampus.url === campusImg.url, 'sharedAssetToCampusImage preserves URL');
  assert(backToCampus.checksumSha256 === 'hash-lib-999', 'sharedAssetToCampusImage preserves checksum');
  assert(backToCampus.isHero === true, 'sharedAssetToCampusImage preserves isHero');

  // ───────────────────────────────────────────────────────────────────────────
  // 7. PURGE ASSET FROM INTAKE (MEDIA LIBRARY DELETION)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Testing purgeAssetFromIntake ---');

  const intakeWithAssets: UniversalIntakeData = {
    ...intake,
    mediaRegistry: [
      {
        id: 'purge-me-1',
        url: 'https://storage.school.test/purge-me.webp',
        fileName: 'accidental.png',
        mimeType: 'image/png',
        size: 500,
        categories: ['campus_buildings'],
        source: 'facilities',
        usedIn: ['facility_hostel'],
        storageKey: 'tenant-1/public/accidental.png',
      },
    ],
    facilitiesConfig: {
      facilities: {
        hostel: {
          id: 'hostel',
          available: true,
          features: [],
          photos: [
            {
              id: 'photo-hostel-1',
              campusId: 'main-campus',
              storageKey: 'tenant-1/public/accidental.png',
              fileName: 'accidental.png',
              url: 'https://storage.school.test/purge-me.webp',
              mimeType: 'image/png',
              category: 'campus_buildings',
            },
          ],
        },
      },
    },
  };

  const { updatedIntakeData: purgedIntake, purgedStorageKey } = purgeAssetFromIntake(
    intakeWithAssets,
    'purge-me-1'
  );

  assert(purgedStorageKey === 'tenant-1/public/accidental.png', 'purgeAssetFromIntake resolves storageKey for physical deletion');
  assert(
    !purgedIntake.mediaRegistry?.some((a) => a.id === 'purge-me-1'),
    'Purged asset removed from root mediaRegistry'
  );
  assert(
    (purgedIntake.facilitiesConfig?.facilities?.hostel?.photos || []).length === 0,
    'Purged asset removed from facility photos'
  );

  console.log(`\n===========================================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`===========================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMediaRegistryTestSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
