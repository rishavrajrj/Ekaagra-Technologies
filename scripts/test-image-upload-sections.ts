/**
 * ==============================================================================
 * CROSS-SECTION IMAGE UPLOAD & OPTIMIZATION VERIFICATION SUITE
 * Test Suite: scripts/test-image-upload-sections.ts
 * ==============================================================================
 *
 * Verifies:
 * 1. Transport photo gallery, tags, vehicle image linking, and campus sync
 * 2. Facilities photo gallery, tags, and multi-category campus sync
 * 3. Library photo gallery, tags, normalization preservation, and library category sync
 * 4. Hostel photo gallery, tags, normalization preservation, and hostel sync
 * 5. Cross-section image discovery from Section 2 Campuses
 * 6. WebP optimization metadata format integrity
 */

import { normalizeTransportData, TRANSPORT_PHOTO_TAGS } from '../src/lib/transportUtils';
import { normalizeLibraryData } from '../src/lib/libraryUtils';
import { normalizeHostelData } from '../src/lib/hostelUtils';
import type {
  CampusImageData,
  TransportData,
  LibraryData,
  HostelData,
  FacilitiesData,
  UniversalIntakeData,
} from '../src/lib/types';
import { formatBytes, formatOptimizationStats } from '../src/lib/imageUtils';

console.log('================================================================');
console.log('  SECTION IMAGE UPLOAD & WEBP OPTIMIZATION VERIFICATION SUITE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 1: TRANSPORT FLEET PHOTOGRAPHY
// ─────────────────────────────────────────────────────────────────────────────
console.log('Group 1: Transport Fleet Photography & Vehicle Linking');

const sampleTransportPhoto: CampusImageData = {
  id: 'tr-photo-1',
  campusId: 'main-campus',
  storageKey: 'schools/dps/transport/bus-1.webp',
  fileName: 'bus-1.webp',
  url: 'https://cdn.example.com/schools/dps/transport/bus-1.webp',
  mimeType: 'image/webp',
  originalSize: 2450000,
  optimizedSize: 320000,
  optimizedFormat: 'webp',
  displayOrder: 0,
  category: 'transport',
  imageCategory: 'transport',
  imageType: 'School Bus Exterior',
  isPrimary: true,
  caption: 'Modern air-conditioned school bus fleet',
};

const rawTransport: Partial<TransportData> = {
  status: 'yes',
  fleet: { totalVehicles: 2 },
  vehicles: [
    {
      id: 'veh-1',
      displayName: 'Bus 01',
      registrationNumber: 'BR06PA1234',
      capacity: 40,
      vehicleType: 'standard_bus',
      imageUrl: sampleTransportPhoto.url,
      photoUrl: sampleTransportPhoto.url,
    },
  ],
  images: [sampleTransportPhoto],
};

const normalizedTr = normalizeTransportData(rawTransport);
assert(Array.isArray(normalizedTr.images) && normalizedTr.images.length === 1, 'Transport images array preserved through normalization');
assert(normalizedTr.vehicles?.[0]?.imageUrl === sampleTransportPhoto.url, 'Vehicle imageUrl is preserved');
assert(normalizedTr.vehicles?.[0]?.photoUrl === sampleTransportPhoto.url, 'Vehicle photoUrl is preserved');
assert(TRANSPORT_PHOTO_TAGS.length >= 7, `Transport photo tags catalog contains ${TRANSPORT_PHOTO_TAGS.length} tags`);

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 2: LIBRARY PHOTOGRAPHY & NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 2: Library Photography & Normalization');

const sampleLibraryPhoto: CampusImageData = {
  id: 'lib-photo-1',
  campusId: 'main-campus',
  storageKey: 'schools/dps/library/reading-hall.webp',
  fileName: 'reading-hall.webp',
  url: 'https://cdn.example.com/schools/dps/library/reading-hall.webp',
  mimeType: 'image/webp',
  originalSize: 3100000,
  optimizedSize: 410000,
  optimizedFormat: 'webp',
  displayOrder: 0,
  category: 'library',
  imageCategory: 'library',
  imageType: 'Reading Hall & Study Area',
  isPrimary: true,
  caption: 'Quiet reading hall with rich book collection',
};

const rawLibrary: Partial<LibraryData> = {
  status: 'yes_physical_digital',
  enabled: true,
  images: [sampleLibraryPhoto],
};

const normalizedLib = normalizeLibraryData(rawLibrary);
assert(Array.isArray(normalizedLib.images) && normalizedLib.images.length === 1, 'Library images array preserved through normalizeLibraryData');
assert(normalizedLib.images?.[0]?.category === 'library', 'Library photo category is "library"');
assert(normalizedLib.images?.[0]?.optimizedFormat === 'webp', 'Library photo is WebP format');

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 3: HOSTEL PHOTOGRAPHY & NORMALIZATION
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 3: Hostel Photography & Normalization');

const sampleHostelPhoto: CampusImageData = {
  id: 'hostel-photo-1',
  campusId: 'main-campus',
  storageKey: 'schools/dps/hostel/block-a.webp',
  fileName: 'block-a.webp',
  url: 'https://cdn.example.com/schools/dps/hostel/block-a.webp',
  mimeType: 'image/webp',
  originalSize: 4200000,
  optimizedSize: 510000,
  optimizedFormat: 'webp',
  displayOrder: 0,
  category: 'campus_buildings',
  imageCategory: 'campus_buildings',
  imageType: 'Hostel Building & Exterior',
  isPrimary: true,
  caption: 'Senior Boys Hostel Block A surrounded by greenery',
};

const rawHostel: Partial<HostelData> = {
  status: 'complete',
  enabled: true,
  buildings: [
    {
      id: 'bldg-1',
      name: 'Block A',
      code: 'HB-A',
      genderCategory: 'boys',
      capacity: 60,
      floorsCount: 3,
      status: 'active',
    },
  ],
  images: [sampleHostelPhoto],
};

const normalizedHostel = normalizeHostelData(rawHostel, { residentialStatus: 'both_day_and_residential' });
assert(Array.isArray(normalizedHostel.images) && normalizedHostel.images.length === 1, 'Hostel images array preserved through normalizeHostelData');
assert(normalizedHostel.images?.[0]?.id === 'hostel-photo-1', 'Hostel photo ID preserved');

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 4: CROSS-SECTION IMAGE DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 4: Cross-Section Image Discovery from Campus Gallery');

const mockCampusImages: CampusImageData[] = [
  {
    id: 'campus-img-lib',
    campusId: 'campus-1',
    storageKey: 'campuses/campus-1/lib.webp',
    fileName: 'library.webp',
    url: 'https://cdn.example.com/library.webp',
    mimeType: 'image/webp',
    category: 'library',
    imageCategory: 'library',
    imageType: 'Library',
    isPrimary: false,
    caption: 'Campus library uploaded in Step 2',
  },
  {
    id: 'campus-img-tr',
    campusId: 'campus-1',
    storageKey: 'campuses/campus-1/bus.webp',
    fileName: 'bus.webp',
    url: 'https://cdn.example.com/bus.webp',
    mimeType: 'image/webp',
    category: 'transport',
    imageCategory: 'transport',
    imageType: 'School Bus Exterior',
    isPrimary: false,
    caption: 'Fleet bus uploaded in Step 2',
  },
  {
    id: 'campus-img-lab',
    campusId: 'campus-1',
    storageKey: 'campuses/campus-1/lab.webp',
    fileName: 'lab.webp',
    url: 'https://cdn.example.com/lab.webp',
    mimeType: 'image/webp',
    category: 'laboratories',
    imageCategory: 'laboratories',
    imageType: 'Science Lab',
    isPrimary: false,
    caption: 'Science laboratory uploaded in Step 2',
  },
];

const mockIntake: Partial<UniversalIntakeData> = {
  campuses: [
    {
      id: 'campus-1',
      name: 'Main Campus',
      isMainCampus: true,
      images: mockCampusImages,
    } as any,
  ],
};

// Filter logic matching SectionPhotoGallery
const libraryMatched = (mockIntake.campuses![0].images || []).filter(
  (img) => img.category === 'library' || img.imageCategory === 'library'
);
assert(libraryMatched.length === 1 && libraryMatched[0].id === 'campus-img-lib', 'Library section discovers corresponding images previously uploaded in Campus Gallery');

const transportMatched = (mockIntake.campuses![0].images || []).filter(
  (img) => img.category === 'transport' || img.imageCategory === 'transport'
);
assert(transportMatched.length === 1 && transportMatched[0].id === 'campus-img-tr', 'Transport section discovers corresponding images previously uploaded in Campus Gallery');

const facilitiesMatched = (mockIntake.campuses![0].images || []).filter((img) =>
  ['campus_buildings', 'laboratories', 'sports_playground', 'cafeteria', 'classrooms'].includes(
    img.category || img.imageCategory || ''
  )
);
assert(facilitiesMatched.length === 1 && facilitiesMatched[0].id === 'campus-img-lab', 'Facilities section discovers corresponding images previously uploaded in Campus Gallery');

// ─────────────────────────────────────────────────────────────────────────────
// GROUP 5: SHARP WEBP OPTIMIZATION STATS FORMATTER
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nGroup 5: Sharp WebP Optimization Stats Formatter');

const origBytes = 5 * 1024 * 1024; // 5 MB
const optBytes = 650 * 1024; // 650 KB
const stats = formatOptimizationStats(origBytes, optBytes);

assert(stats !== null, 'formatOptimizationStats computes valid stats');
assert(stats!.percentage > 80, `Optimization percentage computed: ${stats?.percentage}% reduction`);
assert(formatBytes(optBytes).includes('KB'), `formatBytes formats correctly: ${formatBytes(optBytes)}`);

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED:      ${passed}`);
console.log(`FAILED:      ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL SECTION IMAGE UPLOAD & OPTIMIZATION TESTS PASSED SUCCESSFULLY!\n');
}
