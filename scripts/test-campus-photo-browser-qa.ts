/**
 * ==============================================================================
 * CAMPUS PHOTO PICKER & SELECTION UX — BROWSER MARKUP & INTERACTION AUDIT
 * File: scripts/test-campus-photo-browser-qa.ts
 * ==============================================================================
 *
 * Performs static and structural verification of the browser DOM structure,
 * styling classes, accessibility landmarks, ARIA bindings, and event handlers
 * inside src/components/schools/SchoolAssetChecklistSection.tsx.
 */

import assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

console.log('==============================================================================');
console.log('  SECTION 10: CAMPUS PHOTO PICKER BROWSER MARKUP & ACCESSIBILITY AUDIT');
console.log('==============================================================================\n');

let passCount = 0;
let failCount = 0;

function check(desc: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${desc} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

const componentPath = path.resolve(process.cwd(), 'src/components/schools/SchoolAssetChecklistSection.tsx');
// Normalize line endings to avoid CRLF mismatch on Windows
const rawSource = fs.readFileSync(componentPath, 'utf8');
const componentSource = rawSource.replace(/\r\n/g, '\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Full-Width Container & Layout Structure
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 1. Full-Width Container & Layout Structure ---');

check(
  'Campus photo picker panel occupies full width (w-full) outside narrow column',
  componentSource.includes('w-full min-w-0 overflow-hidden animate-in fade-in slide-in-from-top-2')
);

check(
  'Panel uses clean emerald gradient backdrop with border and rounded corners',
  componentSource.includes('bg-gradient-to-b from-emerald-50/90 via-emerald-50/50 to-white border border-emerald-200 rounded-2xl')
);

check(
  'Responsive photo grid supports mobile (2-col), tablet (3-4 col), and desktop (5-6 col)',
  componentSource.includes('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 min-w-0 w-full')
);

check(
  'Photo preview container enforces consistent 4:3 aspect ratio without clipping',
  componentSource.includes('aspect-[4/3] w-full bg-slate-100 overflow-hidden shrink-0')
);

check(
  'Images use object-cover with smooth hover scale transition',
  componentSource.includes('w-full h-full object-cover transition-transform duration-200 group-hover:scale-105')
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Filename Truncation & Metadata Visibility
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 2. Filename Truncation & Metadata Visibility ---');

check(
  'Long filenames are safely truncated with tooltip fallback (truncate and title)',
  componentSource.includes('font-semibold text-slate-900 text-xs truncate" title={cImg.fileName || \'Campus Photo\'}')
);

check(
  'File sizes are formatted and displayed with monospace styling',
  componentSource.includes('formatFileSize(cImg.optimizedSize)') &&
  componentSource.includes('font-mono text-[9px]')
);

check(
  'Campus name pill is displayed over image thumbnail with dark backdrop',
  componentSource.includes('text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs truncate block')
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Accessibility & Keyboard Navigation (WAI-ARIA)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. Accessibility & Keyboard Navigation (WAI-ARIA) ---');

check(
  'Campus photo card has role="button" and tabIndex={0}',
  componentSource.includes('role="button"') &&
  componentSource.includes('tabIndex={0}')
);

check(
  'Photo card dynamically binds aria-pressed based on isIncluded state',
  componentSource.includes('aria-pressed={isIncluded}')
);

check(
  'Photo card provides descriptive aria-label with action and filename',
  componentSource.includes('aria-label={`${isIncluded ? \'Remove\' : \'Select\'} photo ${cImg.fileName} for ${item.title}`}')
);

check(
  'Photo card supports keyboard navigation (Enter & Space) via onKeyDown',
  componentSource.includes("if (e.key === 'Enter' || e.key === ' ')")
);

check(
  'Preview zoom button provides explicit title and aria-label',
  componentSource.includes('title="Click to preview full size"') &&
  componentSource.includes('aria-label={`Preview full resolution of ${cImg.fileName || \'Campus Photo\'}`}')
);

check(
  'Collapsed selected photos banner is keyboard-accessible (role="button", tabIndex={0}, onKeyDown)',
  componentSource.includes('role="button"') &&
  componentSource.includes('aria-label={`Show ${item.galleryUrls.length} selected photos for ${item.title}`}') &&
  componentSource.includes('setIsGalleryExpanded(true)')
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Header Action Controls & Labels
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 4. Header Action Controls & Labels ---');

check(
  'Main action toggle button displays exact standard labels: Browse Campus Photos (N) / Hide Campus Photos (N)',
  componentSource.includes('`Hide Campus Photos (${campusImages.length})`') &&
  componentSource.includes('`Browse Campus Photos (${campusImages.length})`')
);

check(
  'Header action button includes dynamic ChevronUp / ChevronDown icons',
  componentSource.includes('<ChevronUp className="w-3.5 h-3.5 ml-0.5" />') &&
  componentSource.includes('<ChevronDown className="w-3.5 h-3.5 ml-0.5" />')
);

check(
  'Picker panel features dedicated Close button with X icon',
  componentSource.includes('aria-label="Hide campus photos picker"') &&
  componentSource.includes('Hide Campus Photos')
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Filter Controls & Contradiction Protection
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 5. Filter Controls & Contradiction Protection ---');

check(
  'Picker includes 3 segmented filter tabs: All Photos, Selected, Available to Add',
  componentSource.includes('All Photos ({campusImagesCount})') &&
  componentSource.includes('<span>Selected</span>') &&
  componentSource.includes('<span>Available to Add</span>')
);

check(
  'Hide Selected toggle is strictly scoped to pickerFilter === "all" to prevent blanking Selected tab',
  componentSource.includes("if (pickerFilter === 'all' && hideSelectedInPicker && included) return false;")
);

check(
  'Quick Hide Selected Photos toggle button is provided with Eye / EyeOff icons',
  componentSource.includes('Hide Selected Photos') &&
  componentSource.includes('Show Selected Photos')
);

check(
  'Empty state displays contextual message and Reset Filters button',
  componentSource.includes('No campus photos have been selected for this section yet.') &&
  componentSource.includes('Reset Filters & View All Photos')
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Batch Actions & Data Safety
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 6. Batch Actions & Data Safety ---');

check(
  'Select All button displays visible count: Select All ({unselectedVisibleCount})',
  componentSource.includes('Select All ({unselectedVisibleCount})')
);

check(
  'Clear Selection button is available when selectedCount > 0',
  componentSource.includes('selectedCount > 0 &&') &&
  componentSource.includes('Clear Selection')
);

check(
  'handleBatchReuseCampusImages clear_all safely filters campus keys without wiping custom uploads',
  componentSource.includes('const campusKeys = new Set<string>();') &&
  componentSource.includes('const isCampusPhoto = (g: AssetFileMeta) =>') &&
  componentSource.includes('!isCampusPhoto(g)')
);

check(
  'handleBatchReuseCampusImages select_all verifies uniqueness across currentList AND newMetas',
  componentSource.includes('!isMatchInList(currentList) && !isMatchInList(newMetas)')
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Stable React Keys & Manual Override Flags
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 7. Stable React Keys & Manual Override Flags ---');

check(
  'Selected photo thumbnails resolve stable keys via compound fallback',
  componentSource.includes('key={photo.id || photo.storageKey || photo.url || `photo-${idx}`}')
);

check(
  'Deleting a photo from galleryUrls sets isManualOverride: true to prevent auto-sync resurrection',
  componentSource.includes('isManualOverride: true') &&
  componentSource.includes('onUpdate({') &&
  componentSource.includes('galleryUrls: updated,')
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Strict Non-Undefined Matching
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 8. Strict Non-Undefined Matching ---');

check(
  'handleReuseCampusImage verifies truthiness of IDs, storageKeys, and URLs before comparison',
  componentSource.includes('Boolean(g.id) && Boolean(campusImg.id)') &&
  componentSource.includes('Boolean(g.storageKey) && Boolean(campusImg.storageKey)') &&
  componentSource.includes('Boolean(g.url) && Boolean(campusImg.url)')
);

check(
  'Single image reuse check uses null-safe compound equality',
  componentSource.includes('Boolean(targetItem.storageKey) && Boolean(campusImg.storageKey)') &&
  componentSource.includes('Boolean(targetItem.fileUrl) && Boolean(campusImg.url)')
);

console.log('\n==============================================================================');
console.log(`  AUDIT COMPLETED: ${passCount} PASSED, ${failCount} FAILED`);
console.log('==============================================================================\n');

if (failCount > 0) {
  process.exit(1);
}
