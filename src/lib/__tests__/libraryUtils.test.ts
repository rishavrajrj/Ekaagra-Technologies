/**
 * ==============================================================================
 * SECTION 14: LIBRARY MANAGEMENT SYSTEM UNIT TEST SUITE
 * File: src/lib/__tests__/libraryUtils.test.ts
 * ==============================================================================
 */

import {
  normalizeLibraryData,
  validateLibraryData,
  getLibrarySectionScore,
  getLibrarySummary,
  getInstitutionCurrency,
  LIBRARY_STATUS_OPTIONS,
  BOOK_IDENTIFICATION_METHODS,
  DIGITAL_RESOURCE_OPTIONS,
} from '../libraryUtils';
import type { LibraryData, UniversalIntakeData } from '../types';

function runLibraryTestSuite() {
  console.log('🧪 Starting Section 14: Library Management System Unit Tests...\n');

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
  // CATEGORY 1: NORMALIZATION & LEGACY DATA MIGRATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 1. Testing Normalization & Legacy Data Migration ---');

  // Test 1.1: Legacy intake values (2500 books, barcode scanner) survive normalization
  {
    const legacyRaw: Partial<LibraryData> = {
      enabled: false,
      bookCountEstimate: 2500,
      librariesCount: 1,
      barcodeScannerRequired: true,
      rfidRequired: false,
      digitalLibraryEnabled: true,
      studentBorrowLimit: 3,
      staffBorrowLimit: 7,
    };

    const normalized = normalizeLibraryData(legacyRaw);

    assert(
      normalized.physical?.estimatedPhysicalBookCount === 2500,
      'Legacy bookCountEstimate (2500) migrated to physical.estimatedPhysicalBookCount'
    );
    assert(
      normalized.identification?.method === 'barcode',
      'Legacy barcodeScannerRequired mapped to identification.method = barcode'
    );
    assert(
      normalized.identification?.scannerStatus === 'scanner_required',
      'Legacy barcodeScannerRequired mapped to identification.scannerStatus = scanner_required'
    );
    assert(
      normalized.circulation?.maxBooksPerStudent === 3,
      'Legacy studentBorrowLimit (3) mapped to circulation.maxBooksPerStudent'
    );
    assert(
      normalized.circulation?.maxBooksPerStaff === 7,
      'Legacy staffBorrowLimit (7) mapped to circulation.maxBooksPerStaff'
    );
    assert(
      normalized.bookCountEstimate === 2500,
      'Legacy mirror bookCountEstimate preserved at root'
    );
  }

  // Test 1.2: Status determination when legacy enabled is true
  {
    const legacyActivePhysical = normalizeLibraryData({
      enabled: true,
      digitalLibraryEnabled: false,
      bookCountEstimate: 1200,
    });
    assert(
      legacyActivePhysical.status === 'yes_physical',
      'Legacy enabled: true without digital maps to yes_physical status'
    );

    const legacyActiveHybrid = normalizeLibraryData({
      enabled: true,
      digitalLibraryEnabled: true,
      bookCountEstimate: 4000,
    });
    assert(
      legacyActiveHybrid.status === 'yes_physical_digital',
      'Legacy enabled: true with digitalLibraryEnabled maps to yes_physical_digital status'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 2: STATE CHANGE & DRAFT PRESERVATION (PROMPT SECTION 28)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Testing State Change & Draft Preservation ---');

  // Test 2.1: Physical -> No Library -> Physical preserves configured volume and circulation
  {
    // User configures Physical library with custom values
    let current = normalizeLibraryData({
      status: 'yes_physical',
      physical: {
        estimatedPhysicalBookCount: 8500,
        approximateSeatingCapacity: 120,
        readingSeatsCount: 90,
        libraryRoomsCount: 2,
      },
      circulation: {
        lendingAvailable: 'yes',
        maxBooksPerStudent: 4,
        maxBooksPerStaff: 10,
        loanDurationOption: '21_days',
      },
      fines: {
        overdueFineType: 'per_day',
        fineAmount: 10,
      },
    });

    assert(current.physical?.estimatedPhysicalBookCount === 8500, 'Initial Physical book count set to 8500');
    assert(current.circulation?.maxBooksPerStudent === 4, 'Initial maxBooksPerStudent set to 4');

    // User switches to 'no_library'
    current = normalizeLibraryData({
      ...current,
      status: 'no_library',
    });

    assert(current.status === 'no_library', 'Status successfully changed to no_library');
    assert(current.enabled === false, 'no_library causes enabled to be false');
    // Verify nested physical draft was NOT destroyed!
    assert(
      current.physical?.estimatedPhysicalBookCount === 8500,
      'Draft physical books count preserved in memory during switch to no_library'
    );
    assert(
      current.circulation?.maxBooksPerStudent === 4,
      'Draft circulation rules preserved in memory during switch to no_library'
    );

    // User switches back to 'yes_physical'
    current = normalizeLibraryData({
      ...current,
      status: 'yes_physical',
    });

    assert(current.status === 'yes_physical', 'Status restored to yes_physical');
    assert(current.enabled === true, 'enabled restored to true');
    assert(current.physical?.estimatedPhysicalBookCount === 8500, 'Restored physical books count is exactly 8500');
    assert(current.circulation?.maxBooksPerStudent === 4, 'Restored circulation maxBooksPerStudent is exactly 4');
  }

  // Test 2.2: Switching Physical -> Digital Only -> Physical + Digital preserves both drafts
  {
    let current = normalizeLibraryData({
      status: 'yes_physical',
      physical: { estimatedPhysicalBookCount: 3200 },
      digital: { resources: ['ebooks', 'research_databases'], accessModel: 'student_login' },
    });

    // Switch to digital_only
    current = normalizeLibraryData({ ...current, status: 'digital_only' });
    assert(current.status === 'digital_only', 'Switched to digital_only');
    assert(current.physical?.estimatedPhysicalBookCount === 3200, 'Physical book count draft preserved');
    assert(current.digital?.resources?.includes('research_databases') === true, 'Digital resources draft intact');

    // Switch to hybrid yes_physical_digital
    current = normalizeLibraryData({ ...current, status: 'yes_physical_digital' });
    assert(current.status === 'yes_physical_digital', 'Switched to hybrid physical + digital');
    assert(current.physical?.estimatedPhysicalBookCount === 3200, 'Physical books count restored to 3200');
    assert(current.digital?.resources?.includes('research_databases') === true, 'Digital resources still intact');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 3: CONDITIONAL COMPLETION SCORING (PROMPT SECTION 24)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Testing Conditional Completion Scoring ---');

  // Test 3.1: Unselected status is 0% complete
  {
    const score = getLibrarySectionScore(normalizeLibraryData({}));
    assert(score.percentage === 0, 'Unselected status has 0% score');
    assert(score.total === 1 && score.filled === 0, 'Score is 0/1');
    assert(score.missingFields.length > 0, 'Missing status warning returned');
  }

  // Test 3.2: No Library is 100% complete immediately
  {
    const score = getLibrarySectionScore(normalizeLibraryData({ status: 'no_library' }));
    assert(score.percentage === 100, 'no_library is 100% complete immediately');
    assert(score.filled === 1 && score.total === 1, 'Score is 1/1');
    assert(score.missingFields.length === 0, 'No missing fields for no_library');
  }

  // Test 3.3: Not Yet Decided is 100% complete (configured for later)
  {
    const score = getLibrarySectionScore(normalizeLibraryData({ status: 'not_decided' }));
    assert(score.percentage === 100, 'not_decided is 100% complete');
    assert(score.isConfiguredForLater === true, 'isConfiguredForLater flag is true for not_decided');
    assert(score.missingFields.length === 0, 'No missing fields for not_decided');
  }

  // Test 3.4: Planned requires availability + plannedType (2 fields)
  {
    const incompletePlanned = normalizeLibraryData({
      status: 'planned',
      planned: { availability: 'this_academic_session' as any, plannedType: undefined as any },
    });
    const scoreIncomplete = getLibrarySectionScore(incompletePlanned);
    assert(scoreIncomplete.percentage === 50, 'Planned with 1 of 2 fields is 50%');
    assert(scoreIncomplete.missingFields.includes('Library: Planned Library Type'), 'Identifies missing planned type');

    const completePlanned = normalizeLibraryData({
      status: 'planned',
      planned: { availability: 'this_academic_session', plannedType: 'physical_digital' },
    });
    const scoreComplete = getLibrarySectionScore(completePlanned);
    assert(scoreComplete.percentage === 100, 'Planned with both fields is 100%');
  }

  // Test 3.5: Outsourced requires serviceModel + schoolAccess (2 fields)
  {
    const completeOutsourced = normalizeLibraryData({
      status: 'outsourced',
      outsourced: { serviceModel: 'partner_institution', schoolAccess: 'both' },
    });
    const score = getLibrarySectionScore(completeOutsourced);
    assert(score.percentage === 100, 'Outsourced with both required fields is 100%');
    assert(score.total === 2 && score.filled === 2, 'Score is 2/2');
  }

  // Test 3.6: Digital Only requires 3 fields (status, resources, accessModel)
  {
    const digitalEmpty = normalizeLibraryData({
      status: 'digital_only',
      digital: { resources: [], accessModel: undefined as any },
    });
    const scoreEmpty = getLibrarySectionScore(digitalEmpty);
    assert(scoreEmpty.percentage === 33, 'Digital only with no resources is 33% (status only)');

    const digitalComplete = normalizeLibraryData({
      status: 'digital_only',
      digital: { resources: ['ebooks'], accessModel: 'student_login' },
    });
    const scoreComplete = getLibrarySectionScore(digitalComplete);
    assert(scoreComplete.percentage === 100, 'Digital only with resources and access model is 100%');
    assert(scoreComplete.total === 3 && scoreComplete.filled === 3, 'Score is 3/3');
  }

  // Test 3.7: Physical Library requires 4 fields (status, bookCount >= 0, identification, lending)
  {
    const physicalData = normalizeLibraryData({
      status: 'yes_physical',
      physical: { estimatedPhysicalBookCount: 2500 },
      identification: { method: 'barcode' },
      circulation: { lendingAvailable: 'yes' },
    });
    const score = getLibrarySectionScore(physicalData);
    assert(score.percentage === 100, 'Physical library with all 4 core requirements is 100%');
    assert(score.total === 4 && score.filled === 4, 'Score is 4/4');
  }

  // Test 3.8: Physical + Digital requires 5 fields (4 physical + 1 digital resources)
  {
    const hybridData = normalizeLibraryData({
      status: 'yes_physical_digital',
      physical: { estimatedPhysicalBookCount: 5000 },
      identification: { method: 'barcode_rfid' },
      circulation: { lendingAvailable: 'yes' },
      digital: { resources: ['ebooks', 'online_journals'] },
    });
    const score = getLibrarySectionScore(hybridData);
    assert(score.percentage === 100, 'Physical + Digital with all 5 requirements is 100%');
    assert(score.total === 5 && score.filled === 5, 'Score is 5/5');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 4: BRANCH-SPECIFIC VALIDATION (HIDDEN FIELDS DO NOT FAIL)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Testing Branch-Specific Validation ---');

  // Test 4.1: No Library ignores missing physical books and circulation
  {
    const noLibConfig: LibraryData = {
      status: 'no_library',
      enabled: false,
      physical: { estimatedPhysicalBookCount: undefined as any },
      identification: { method: undefined as any },
      circulation: { lendingAvailable: undefined as any },
    };
    const val = validateLibraryData(noLibConfig);
    assert(val.isValid === true, 'No Library is valid even with empty physical/circulation objects');
    assert(val.missingFields.length === 0, 'No false missing fields on hidden sections');
  }

  // Test 4.2: Physical library validates invalid book count
  {
    const invalidPhysical = normalizeLibraryData({
      status: 'yes_physical',
      physical: { estimatedPhysicalBookCount: -50 },
    });
    const val = validateLibraryData(invalidPhysical);
    assert(val.isValid === false, 'Physical library rejects negative book count');
    assert(
      val.errors['physical.estimatedPhysicalBookCount'] !== undefined,
      'Error returned on estimatedPhysicalBookCount'
    );
  }

  // Test 4.3: Custom loan duration validates positive number of days
  {
    const invalidCustomDays = normalizeLibraryData({
      status: 'yes_physical',
      physical: { estimatedPhysicalBookCount: 2000 },
      identification: { method: 'barcode' },
      circulation: {
        lendingAvailable: 'yes',
        loanDurationOption: 'custom',
        customLoanDurationDays: 0,
      },
    });
    const val = validateLibraryData(invalidCustomDays);
    assert(val.isValid === false, 'Rejects custom loan duration of 0 days');
    assert(val.errors['circulation.customLoanDurationDays'] !== undefined, 'Error on customLoanDurationDays');
  }

  // Test 4.4: Fine configured validates non-negative fine amount
  {
    const invalidFine = normalizeLibraryData({
      status: 'yes_physical',
      physical: { estimatedPhysicalBookCount: 2000 },
      identification: { method: 'barcode' },
      circulation: { lendingAvailable: 'yes' },
      fines: { overdueFineType: 'per_day', fineAmount: -5 },
    });
    const val = validateLibraryData(invalidFine);
    assert(val.isValid === false, 'Rejects negative fine amount');
    assert(val.errors['fines.fineAmount'] !== undefined, 'Error on fineAmount');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 5: DYNAMIC CONFIGURATION SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Testing Dynamic Summary Generation ---');

  // Test 5.1: Summary reflects physical + digital configurations accurately
  {
    const config = normalizeLibraryData({
      status: 'yes_physical_digital',
      physical: { estimatedPhysicalBookCount: 2500 },
      identification: { method: 'barcode' },
      circulation: {
        lendingAvailable: 'yes',
        maxBooksPerStudent: 2,
        loanDurationOption: '14_days',
      },
      fines: {
        overdueFineType: 'per_day',
        fineAmount: 5,
      },
      digital: {
        resources: ['ebooks', 'online_journals'],
      },
    });

    const summary = getLibrarySummary(config, '₹');
    const summaryMap = Object.fromEntries(summary.map((s) => [s.label, s.value]));

    assert(summaryMap['Library Status'].includes('Physical + Digital'), 'Summary shows Physical + Digital');
    assert(summaryMap['Physical Books'].includes('2,500 estimated'), 'Summary shows 2,500 estimated physical books');
    assert(summaryMap['Identification'].includes('Barcode'), 'Summary shows Barcode identification');
    assert(summaryMap['Books Per Student'] === '2', 'Summary shows 2 books per student');
    assert(summaryMap['Loan Duration'].includes('14 Days'), 'Summary shows 14 Days loan duration');
    assert(summaryMap['Overdue Fine'] === '₹5 / day', 'Summary formats ₹5 / day fine with currency symbol');
    assert(summaryMap['Digital Resources'].includes('E-books'), 'Summary shows E-books digital resource');
  }

  // Test 5.2: Currency aware formatting helper
  {
    const mockIntakeIndia: Partial<UniversalIntakeData> = {
      schoolProfile: { country: 'India' } as any,
    };
    const currIndia = getInstitutionCurrency(mockIntakeIndia);
    assert(currIndia.code === 'INR' && currIndia.symbol === '₹', 'Detects Indian Rupee (INR / ₹) for India');

    const mockIntakeUS: Partial<UniversalIntakeData> = {
      schoolProfile: { country: 'United States' } as any,
    };
    const currUS = getInstitutionCurrency(mockIntakeUS);
    assert(currUS.code === 'USD' && currUS.symbol === '$', 'Detects US Dollar (USD / $) for United States');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CATEGORY 6: CATALOG REGISTRY INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Testing Option Catalogs & Registry Integrity ---');

  assert(LIBRARY_STATUS_OPTIONS.length === 7, 'Exact 7 library statuses registered');
  assert(BOOK_IDENTIFICATION_METHODS.length === 5, 'Exact 5 identification methods registered');
  assert(DIGITAL_RESOURCE_OPTIONS.length === 8, 'Exact 8 digital resource options registered');

  // Summary
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLibraryTestSuite();
