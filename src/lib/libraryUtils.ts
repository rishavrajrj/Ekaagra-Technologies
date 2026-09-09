/**
 * ==============================================================================
 * PRODUCTION LIBRARY MANAGEMENT UTILITIES & CONDITIONAL ONBOARDING ENGINE
 * File: src/lib/libraryUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Option catalogs with human-readable labels, subtitles, and Lucide icons.
 * 2. Normalization & safe legacy migration (preserving 2,500 books & barcode scanner).
 * 3. Bidirectional legacy mirror synchronization (zero breaking changes downstream).
 * 4. Branch-specific validation without false errors on hidden fields.
 * 5. Conditional completion scoring (reflecting true active requirements).
 * 6. Dynamic Library Configuration Summary generation.
 * 7. Currency-aware formatting helpers.
 */

import type {
  LibraryData,
  LibraryStatus,
  FutureLibraryPlan,
  PlannedAvailability,
  PlannedLibraryType,
  DigitalResourceType,
  DigitalAccessModel,
  BookIdentificationMethod,
  BarcodeScannerAvailability,
  BarcodeGeneration,
  RfidInfrastructure,
  RfidUsageOption,
  LendingPreference,
  LoanDurationOption,
  RenewalPolicyOption,
  ReservationAccessOption,
  OverdueFineType,
  FineGracePeriodOption,
  LostDamagedPolicy,
  EligibleLibraryMember,
  LibraryManagementStaff,
  OutsourcedServiceModel,
  OutsourcedSchoolAccess,
  OutsourcedDigitalIntegration,
  LibrarySoftwareSystem,
  InventoryManagementType,
  InventoryAuditFrequency,
  ParentVisibilityItem,
  LibraryAutomationFeature,
  LibraryNotificationChannel,
} from './types';

// ─── OPTION CATALOGS ──────────────────────────────────────────────────────────

export interface StatusOption {
  value: LibraryStatus;
  label: string;
  badge: string;
  description: string;
  iconName: string;
}

export const LIBRARY_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'yes_physical',
    label: 'Yes — Physical Library',
    badge: 'On-Campus Reading Room',
    description: 'School maintains physical reading facilities, book stacks, and lending circulation.',
    iconName: 'BookOpen',
  },
  {
    value: 'yes_physical_digital',
    label: 'Yes — Physical + Digital Library',
    badge: 'Hybrid Library',
    description: 'School maintains physical stacks alongside online e-books, journals, or digital repository.',
    iconName: 'Layers',
  },
  {
    value: 'digital_only',
    label: 'Digital Library Only',
    badge: 'Online Access Portal',
    description: 'No physical book stacks; library services are delivered completely via online platforms.',
    iconName: 'Laptop',
  },
  {
    value: 'outsourced',
    label: 'Outsourced / External Library',
    badge: 'External Partner',
    description: 'Library services are provided through partner universities, commercial vendors, or public libraries.',
    iconName: 'Handshake',
  },
  {
    value: 'planned',
    label: 'Planned / Coming Soon',
    badge: 'Upcoming Session',
    description: 'Library facilities or digital portal will launch in an upcoming academic session or month.',
    iconName: 'CalendarClock',
  },
  {
    value: 'no_library',
    label: 'No Library',
    badge: 'Service Not Provided',
    description: 'Institution does not currently operate or offer library services to students or faculty.',
    iconName: 'Ban',
  },
  {
    value: 'not_decided',
    label: 'Not Yet Decided',
    badge: 'Configure Later',
    description: 'Library operational decisions are pending; complete during administrative onboarding handoff.',
    iconName: 'Clock',
  },
];

export const FUTURE_LIBRARY_OPTIONS: { value: FutureLibraryPlan; label: string; description: string }[] = [
  { value: 'no_plans', label: 'No plans currently', description: 'Institution has no immediate or planned library infrastructure.' },
  { value: 'planned_in_future', label: 'Planned in future', description: 'Library services are on the institutional long-term roadmap.' },
  { value: 'not_decided', label: 'Not decided', description: 'Library roadmap has not been formally evaluated yet.' },
];

export const PLANNED_AVAILABILITY_OPTIONS: { value: PlannedAvailability; label: string }[] = [
  { value: 'this_academic_session', label: 'This Academic Session' },
  { value: 'next_academic_session', label: 'Next Academic Session' },
  { value: 'within_3_months', label: 'Within 3 Months' },
  { value: 'within_6_months', label: 'Within 6 Months' },
  { value: 'within_1_year', label: 'Within 1 Year' },
  { value: 'date_not_decided', label: 'Date Not Decided' },
];

export const PLANNED_TYPE_OPTIONS: { value: PlannedLibraryType; label: string; description: string }[] = [
  { value: 'physical', label: 'Physical Library', description: 'Dedicated physical reading room and book collection.' },
  { value: 'physical_digital', label: 'Physical + Digital', description: 'Blended physical stacks with online digital library.' },
  { value: 'digital', label: 'Digital Only', description: 'Paperless digital portal with e-book access.' },
  { value: 'not_decided', label: 'Not Yet Decided', description: 'Exact format to be finalized prior to rollout.' },
];

export const DIGITAL_RESOURCE_OPTIONS: { value: DigitalResourceType; label: string; description: string }[] = [
  { value: 'ebooks', label: 'E-books', description: 'Digital textbooks, literature, and readers.' },
  { value: 'online_journals', label: 'Online Journals', description: 'Academic and scientific peer-reviewed periodicals.' },
  { value: 'research_databases', label: 'Research Databases', description: 'JSTOR, EBSCO, Google Scholar or custom indexes.' },
  { value: 'educational_videos', label: 'Educational Videos', description: 'Curated video lectures and multimedia content.' },
  { value: 'digital_newspapers', label: 'Digital Newspapers', description: 'Daily national and international e-papers.' },
  { value: 'digital_magazines', label: 'Digital Magazines', description: 'Current affairs and subject-specific periodicals.' },
  { value: 'institutional_repository', label: 'Institutional Repository', description: 'School publications, dissertations, and archive.' },
  { value: 'other', label: 'Other', description: 'Custom digital library content format.' },
];

export const DIGITAL_ACCESS_MODELS: { value: DigitalAccessModel; label: string; description: string }[] = [
  { value: 'student_login', label: 'Student Login', description: 'Single sign-on using student ERP credentials.' },
  { value: 'staff_login', label: 'Staff Login', description: 'Restricted faculty and administrative credentials.' },
  { value: 'parent_login', label: 'Parent Login', description: 'Accessible via the parent mobile application portal.' },
  { value: 'public_access', label: 'Public Access', description: 'Open-access public browsing for institution materials.' },
  { value: 'mixed_access', label: 'Mixed Access', description: 'Tiered permissions across students, faculty, and parents.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Authentication model will be finalized during ERP setup.' },
];

export const BOOK_IDENTIFICATION_METHODS: { value: BookIdentificationMethod; label: string; description: string }[] = [
  { value: 'manual_accession', label: 'Manual Accession Numbers', description: 'Traditional handwritten register numbers on book spine/cover.' },
  { value: 'barcode', label: 'Barcode', description: 'Linear 1D barcodes scanned via handheld laser/CCD scanners.' },
  { value: 'rfid', label: 'RFID', description: 'Radio frequency smart tags for contact-free scanning and security gates.' },
  { value: 'barcode_rfid', label: 'Barcode + RFID', description: 'Dual system: barcodes for circulation, RFID tags for security.' },
  { value: 'not_decided', label: 'Not Yet Decided', description: 'Identification strategy to be determined with library vendor.' },
];

export const BARCODE_SCANNER_OPTIONS: { value: BarcodeScannerAvailability; label: string }[] = [
  { value: 'already_available', label: 'Already Available (Hardware in Place)' },
  { value: 'scanner_required', label: 'Scanner Required (Need Ekaagra Recommendation)' },
  { value: 'existing_plus_additional', label: 'Existing + Additional Scanners Required' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later' },
];

export const BARCODE_GENERATION_OPTIONS: { value: BarcodeGeneration; label: string }[] = [
  { value: 'system_generated', label: 'System Generated (Auto-generate code & print labels via ERP)' },
  { value: 'existing_barcodes', label: 'Existing Barcodes (Use pre-printed publisher/library labels)' },
  { value: 'both', label: 'Both (Hybrid legacy & system generated)' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later' },
];

export const RFID_INFRASTRUCTURE_OPTIONS: { value: RfidInfrastructure; label: string }[] = [
  { value: 'already_available', label: 'Already Available (Gates & tags active)' },
  { value: 'rfid_required', label: 'RFID Required (Need hardware procurement & installation)' },
  { value: 'partially_available', label: 'Partially Available (Piloting in progress)' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later' },
];

export const RFID_USAGE_OPTIONS: { value: RfidUsageOption; label: string }[] = [
  { value: 'book_identification', label: 'Book Identification' },
  { value: 'self_checkout', label: 'Self Checkout Kiosk' },
  { value: 'entry_exit_security', label: 'Entry/Exit Anti-Theft Gates' },
  { value: 'inventory_auditing', label: 'Inventory Auditing Wand' },
  { value: 'other', label: 'Other RFID Workflow' },
];

export const LENDING_PREFERENCE_OPTIONS: { value: LendingPreference; label: string; description: string }[] = [
  { value: 'yes', label: 'Yes — Book Lending Allowed', description: 'Students and faculty may borrow books for home study.' },
  { value: 'no', label: 'No — Reference Only', description: 'Books are for in-library reading and reference only; no checkout.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Lending rules to be finalized during academic term start.' },
];

export const LOAN_DURATION_OPTIONS: { value: LoanDurationOption; label: string; days: number }[] = [
  { value: '7_days', label: '7 Days (1 Week)', days: 7 },
  { value: '14_days', label: '14 Days (2 Weeks)', days: 14 },
  { value: '21_days', label: '21 Days (3 Weeks)', days: 21 },
  { value: '30_days', label: '30 Days (1 Month)', days: 30 },
  { value: 'custom', label: 'Custom Duration...', days: 0 },
];

export const RENEWAL_POLICY_OPTIONS: { value: RenewalPolicyOption; label: string }[] = [
  { value: 'allowed', label: 'Allowed (Students may renew unreserved books)' },
  { value: 'not_allowed', label: 'Not Allowed (Must return upon due date)' },
  { value: 'configured_per_book', label: 'Configured Per Book Category' },
  { value: 'to_be_decided', label: 'To Be Decided Later' },
];

export const RESERVATION_ACCESS_OPTIONS: { value: ReservationAccessOption; label: string }[] = [
  { value: 'students', label: 'Students Only' },
  { value: 'faculty', label: 'Faculty Only' },
  { value: 'staff', label: 'Staff Only' },
  { value: 'students_faculty', label: 'Students + Faculty' },
  { value: 'all_library_members', label: 'All Library Members' },
];

export const OVERDUE_FINE_OPTIONS: { value: OverdueFineType; label: string; description: string }[] = [
  { value: 'no_fine', label: 'No Fine', description: 'Institution does not levy monetary penalties for overdue returns.' },
  { value: 'per_day', label: 'Per Day', description: 'Fixed penalty per calendar day until the book is returned.' },
  { value: 'per_book', label: 'Per Book', description: 'One-time fixed late charge per overdue book.' },
  { value: 'per_day_per_book', label: 'Per Day + Per Book', description: 'Standard daily rate calculated independently for each overdue book.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Fine scale to be approved by school management committee.' },
];

export const GRACE_PERIOD_OPTIONS: { value: FineGracePeriodOption; label: string; days: number }[] = [
  { value: 'no_grace', label: 'No Grace Period (Fines accrue immediately on day 1)', days: 0 },
  { value: '1_day', label: '1 Day Grace Period', days: 1 },
  { value: '2_days', label: '2 Days Grace Period', days: 2 },
  { value: '3_days', label: '3 Days Grace Period', days: 3 },
  { value: '7_days', label: '7 Days Grace Period', days: 7 },
  { value: 'custom', label: 'Custom Days...', days: 0 },
];

export const LOST_DAMAGED_OPTIONS: { value: LostDamagedPolicy; label: string; description: string }[] = [
  { value: 'replacement_required', label: 'Replacement Required', description: 'Member must procure and provide an exact physical replacement copy.' },
  { value: 'replacement_cost', label: 'Replacement Cost Charged', description: 'Invoice actual retail price or catalog acquisition cost.' },
  { value: 'fixed_penalty', label: 'Fixed Penalty Surcharge', description: 'Standard administrative penalty amount billed to member.' },
  { value: 'manual_review', label: 'Manual Review by Librarian', description: 'Librarian inspects wear, determines cost on case-by-case basis.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Policy will be defined in institutional library charter.' },
];

export const ELIGIBLE_MEMBERS_OPTIONS: { value: EligibleLibraryMember; label: string }[] = [
  { value: 'students', label: 'Students' },
  { value: 'teaching_faculty', label: 'Teaching Faculty' },
  { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
  { value: 'administrators', label: 'Administrators' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'other', label: 'Other Custom Membership' },
];

export const LIBRARY_MANAGEMENT_STAFF_OPTIONS: { value: LibraryManagementStaff; label: string; description: string }[] = [
  { value: 'dedicated_librarian', label: 'Dedicated Librarian', description: 'Full-time professional library science specialist on campus.' },
  { value: 'teacher_managed', label: 'Teacher Managed', description: 'Faculty members hold library rotation duty alongside classes.' },
  { value: 'admin_staff_managed', label: 'Administrative Staff Managed', description: 'School administrative officer oversees desk and lending.' },
  { value: 'outsourced', label: 'Outsourced Staffing', description: 'Third-party education partner manages library personnel.' },
  { value: 'shared_responsibility', label: 'Shared Responsibility', description: 'Rotating team of teachers, administrators, and student prefects.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Librarian assignment will be mapped during staff onboarding.' },
];

export const OUTSOURCED_SERVICE_MODELS: { value: OutsourcedServiceModel; label: string; description: string }[] = [
  { value: 'partner_institution', label: 'Partner Institution', description: 'Affiliation with university, college, or sister trust library.' },
  { value: 'commercial_library', label: 'Commercial Library Service', description: 'Contracted educational library vendor with rotating catalog.' },
  { value: 'public_library', label: 'Public Library Consortium', description: 'Direct partnership with municipal or national central library.' },
  { value: 'other', label: 'Other External Model', description: 'Custom institutional consortium arrangement.' },
];

export const OUTSOURCED_SCHOOL_ACCESS: { value: OutsourcedSchoolAccess; label: string }[] = [
  { value: 'student_access', label: 'Student Access Only' },
  { value: 'faculty_access', label: 'Faculty Access Only' },
  { value: 'both', label: 'Both Students & Faculty Access' },
  { value: 'other', label: 'Other Access Scope' },
];

export const OUTSOURCED_DIGITAL_INTEGRATIONS: { value: OutsourcedDigitalIntegration; label: string; description: string }[] = [
  { value: 'api_digital', label: 'API / Digital Integration', description: 'Direct catalog sync and SSO between external partner and ERP.' },
  { value: 'manual_access', label: 'Manual Access', description: 'Physical ID cards or vouchers used at partner library branch.' },
  { value: 'no_digital', label: 'No Digital Integration', description: 'Completely unlinked external access.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Technical integration level to be agreed upon with partner.' },
];

export const LIBRARY_SOFTWARE_OPTIONS: { value: LibrarySoftwareSystem; label: string; description: string }[] = [
  { value: 'school_erp_library', label: 'School ERP Library Module (Recommended)', description: 'Built-in unified Ekaagra Library Module with auto-member sync.' },
  { value: 'existing_software', label: 'Existing Library Software', description: 'Koha, LibSys, Bookends, or custom software currently in use.' },
  { value: 'standalone_software', label: 'Standalone Library Software', description: 'Dedicated third-party library package to be integrated.' },
  { value: 'spreadsheet_manual', label: 'Spreadsheet / Manual Register', description: 'Currently tracked in Excel/Google Sheets or paper registers.' },
  { value: 'no_software', label: 'No Existing Software', description: 'Starting fresh; need clean digital catalog setup.' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later', description: 'Software architecture review scheduled for later.' },
];

export const INVENTORY_MANAGEMENT_OPTIONS: { value: InventoryManagementType; label: string }[] = [
  { value: 'fully_digital', label: 'Fully Digital (Barcode/RFID scanner based automated audits)' },
  { value: 'partially_digital', label: 'Partially Digital (Spreadsheets + periodic shelf checks)' },
  { value: 'manual', label: 'Manual Register (Physical ledger book checkoff)' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later' },
];

export const INVENTORY_AUDIT_OPTIONS: { value: InventoryAuditFrequency; label: string }[] = [
  { value: 'monthly', label: 'Monthly Auditing' },
  { value: 'quarterly', label: 'Quarterly Auditing' },
  { value: 'half_yearly', label: 'Half-Yearly (Semestral)' },
  { value: 'annually', label: 'Annual Stocktaking (Summer/Winter Break)' },
  { value: 'as_needed', label: 'As Needed / Ad-hoc' },
  { value: 'to_be_decided', label: 'To Be Decided Later' },
];

export const PARENT_VISIBILITY_OPTIONS: { value: ParentVisibilityItem; label: string }[] = [
  { value: 'issued_books', label: 'Issued Books & Titles' },
  { value: 'due_dates', label: 'Return Due Dates' },
  { value: 'overdue_books', label: 'Overdue Book Alerts' },
  { value: 'fines', label: 'Accrued Library Fines' },
  { value: 'reservations', label: 'Active Book Reservations' },
  { value: 'reading_history', label: 'Borrowing & Reading History' },
];

export const AUTOMATION_FEATURE_OPTIONS: { value: LibraryAutomationFeature; label: string }[] = [
  { value: 'due_date_reminders', label: 'Automatic Due-Date Reminders (2 days before due)' },
  { value: 'overdue_notifications', label: 'Overdue Notifications (Sent on due date & day after)' },
  { value: 'book_issue_notifications', label: 'Instant Book Issue Notifications' },
  { value: 'book_return_notifications', label: 'Instant Book Return Receipts' },
  { value: 'reservation_notifications', label: 'Book Available Reservation Pick-up Alerts' },
  { value: 'fine_notifications', label: 'Fine Accrual & Payment Confirmations' },
  { value: 'inventory_alerts', label: 'Low Stock & Missing Book Inventory Alerts' },
  { value: 'none', label: 'None (Disable automated alerts)' },
  { value: 'to_be_configured_later', label: 'To Be Configured Later' },
];

export const NOTIFICATION_CHANNEL_OPTIONS: { value: LibraryNotificationChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS Gateway' },
  { value: 'push_notification', label: 'Push Notification' },
  { value: 'parent_app', label: 'Parent Mobile App' },
  { value: 'email', label: 'Email' },
];

// ─── CURRENCY HELPER ─────────────────────────────────────────────────────────

export interface CurrencyConfig {
  code: string;
  symbol: string;
}

export function getInstitutionCurrency(intakeData?: any): CurrencyConfig {
  const code =
    intakeData?.feesConfiguration?.currency ||
    (intakeData?.schoolProfile?.country?.toLowerCase() === 'india' || !intakeData?.schoolProfile?.country
      ? 'INR'
      : 'USD');

  const symbol = code === 'INR' ? '₹' : code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'GBP' ? '£' : code;
  return { code, symbol };
}

// ─── NORMALIZATION & DRAFT PRESERVATION ──────────────────────────────────────

/**
 * Normalizes raw libraryConfig into canonical LibraryData.
 * Safely preserves draft inputs, migrates legacy keys (e.g. 2,500 books & barcode scanner),
 * and synchronizes backward-compatible mirrors for database provisioning and downstream consumers.
 */
export function normalizeLibraryData(raw?: Partial<LibraryData> | null): LibraryData {
  const lib = (raw || {}) as any;

  // Determine canonical status
  let status: LibraryStatus | undefined = undefined;
  const validStatuses: LibraryStatus[] = [
    'yes_physical',
    'yes_physical_digital',
    'digital_only',
    'outsourced',
    'planned',
    'no_library',
    'not_decided',
  ];

  if (lib.status && validStatuses.includes(lib.status)) {
    status = lib.status;
  } else if (lib.enabled === true) {
    status = lib.digitalLibraryEnabled ? 'yes_physical_digital' : 'yes_physical';
  } else if (lib.enabled === false && lib.status === 'no_library') {
    status = 'no_library';
  }
  // Note: if status is undefined, we leave it as undefined so conditional completion
  // accurately detects that the user hasn't chosen a status yet.

  // 1. Physical library configuration & legacy bookCountEstimate migration
  const legacyBookCount =
    typeof lib.bookCountEstimate === 'number' && lib.bookCountEstimate >= 0
      ? lib.bookCountEstimate
      : 2500; // default historical estimate if present in intake

  const physical = {
    estimatedPhysicalBookCount:
      lib.physical?.estimatedPhysicalBookCount !== undefined
        ? lib.physical.estimatedPhysicalBookCount
        : legacyBookCount,
    approximateSeatingCapacity:
      typeof lib.physical?.approximateSeatingCapacity === 'number'
        ? lib.physical.approximateSeatingCapacity
        : undefined,
    readingSeatsCount:
      typeof lib.physical?.readingSeatsCount === 'number'
        ? lib.physical.readingSeatsCount
        : undefined,
    libraryRoomsCount:
      typeof lib.physical?.libraryRoomsCount === 'number'
        ? lib.physical.libraryRoomsCount
        : 1,
  };

  // 2. Digital library configuration
  const legacyDigitalAvailable =
    lib.digital?.isAvailable !== undefined
      ? lib.digital.isAvailable
      : status === 'yes_physical_digital' || status === 'digital_only' || lib.digitalLibraryEnabled === true;

  const defaultDigitalResources: DigitalResourceType[] = ['ebooks', 'online_journals'];

  const digital = {
    isAvailable: legacyDigitalAvailable,
    resources: Array.isArray(lib.digital?.resources)
      ? lib.digital.resources
      : (lib.digitalLibraryEnabled || status === 'yes_physical_digital' ? defaultDigitalResources : []),
    otherResourceDescription: lib.digital?.otherResourceDescription || '',
    accessModel: lib.digital?.accessModel,
  };

  // 3. Identification system & legacy barcode scanner migration
  let defaultMethod: BookIdentificationMethod = 'barcode';
  if (lib.identification?.method) {
    defaultMethod = lib.identification.method;
  } else if (lib.rfidRequired) {
    defaultMethod = 'rfid';
  } else if (lib.barcodeScannerRequired || lib.barcodeScannerIntegration) {
    defaultMethod = 'barcode';
  }

  let defaultScannerStatus: BarcodeScannerAvailability = 'scanner_required';
  if (lib.identification?.scannerStatus) {
    defaultScannerStatus = lib.identification.scannerStatus;
  } else if (lib.barcodeScannerRequired === true) {
    defaultScannerStatus = 'scanner_required';
  } else if (lib.barcodeScannerRequired === false) {
    defaultScannerStatus = 'already_available';
  }

  const identification = {
    method: defaultMethod,
    scannerStatus: defaultScannerStatus,
    barcodeGeneration: lib.identification?.barcodeGeneration || 'system_generated',
    rfidStatus: lib.identification?.rfidStatus || (lib.rfidRequired ? 'rfid_required' : 'to_be_configured_later'),
    rfidUsage: Array.isArray(lib.identification?.rfidUsage)
      ? lib.identification.rfidUsage
      : ['book_identification', 'entry_exit_security'],
  };

  // 4. Circulation & lending
  const circulation = {
    lendingAvailable: lib.circulation?.lendingAvailable || 'yes',
    maxBooksPerStudent:
      typeof lib.circulation?.maxBooksPerStudent === 'number'
        ? lib.circulation.maxBooksPerStudent
        : (typeof lib.studentBorrowLimit === 'number' ? lib.studentBorrowLimit : 2),
    maxBooksPerStaff:
      typeof lib.circulation?.maxBooksPerStaff === 'number'
        ? lib.circulation.maxBooksPerStaff
        : (typeof lib.staffBorrowLimit === 'number' ? lib.staffBorrowLimit : 5),
    loanDurationOption: lib.circulation?.loanDurationOption || '14_days',
    customLoanDurationDays:
      typeof lib.circulation?.customLoanDurationDays === 'number'
        ? lib.circulation.customLoanDurationDays
        : 14,
    renewalPolicy: lib.circulation?.renewalPolicy || 'allowed',
    maxRenewals: typeof lib.circulation?.maxRenewals === 'number' ? lib.circulation.maxRenewals : 2,
    canReserveBooks: lib.circulation?.canReserveBooks || 'yes',
    reservationAccess: lib.circulation?.reservationAccess || 'students_faculty',
  };

  // 5. Fines & overdue policy
  const fines = {
    overdueFineType: lib.fines?.overdueFineType || (lib.fineSystemEnabled ? 'per_day' : 'no_fine'),
    fineAmount: typeof lib.fines?.fineAmount === 'number' ? lib.fines.fineAmount : 5,
    gracePeriodOption: lib.fines?.gracePeriodOption || '2_days',
    customGracePeriodDays: typeof lib.fines?.customGracePeriodDays === 'number' ? lib.fines.customGracePeriodDays : 2,
    lostDamagedPolicy: lib.fines?.lostDamagedPolicy || 'replacement_cost',
    lostBookFixedPenalty: typeof lib.fines?.lostBookFixedPenalty === 'number' ? lib.fines.lostBookFixedPenalty : 200,
    lostBookReplacementCostHandling: lib.fines?.lostBookReplacementCostHandling || 'catalog_price',
  };

  // 6. Membership
  const membership = {
    eligibleMembers: Array.isArray(lib.membership?.eligibleMembers)
      ? lib.membership.eligibleMembers
      : ['students', 'teaching_faculty', 'non_teaching_staff'],
    otherMemberDescription: lib.membership?.otherMemberDescription || '',
  };

  // 7. Staffing
  const staffing = {
    managementModel: lib.staffing?.managementModel || 'dedicated_librarian',
  };

  // 8. Outsourced
  const outsourced = {
    serviceModel: lib.outsourced?.serviceModel,
    schoolAccess: lib.outsourced?.schoolAccess,
    digitalIntegration: lib.outsourced?.digitalIntegration || 'api_digital',
  };

  // 9. Software
  const software = {
    system: lib.software?.system || 'school_erp_library',
    existingSystemName: lib.software?.existingSystemName || '',
    integrationRequired: lib.software?.integrationRequired || 'to_be_decided',
  };

  // 10. Inventory
  const inventory = {
    managementType: lib.inventory?.managementType || 'fully_digital',
    auditFrequency: lib.inventory?.auditFrequency || 'annually',
  };

  // 11. Visibility
  const visibility = {
    parentVisibilityEnabled: lib.visibility?.parentVisibilityEnabled || 'yes',
    visibleItems: Array.isArray(lib.visibility?.visibleItems)
      ? lib.visibility.visibleItems
      : ['issued_books', 'due_dates', 'overdue_books', 'fines'],
  };

  // 12. Automation & notifications
  const automation = {
    features: Array.isArray(lib.automation?.features)
      ? lib.automation.features
      : ['due_date_reminders', 'overdue_notifications', 'book_issue_notifications', 'book_return_notifications'],
    channels: Array.isArray(lib.automation?.channels)
      ? lib.automation.channels
      : ['whatsapp', 'parent_app', 'sms'],
  };

  // 13. Planned
  const planned = {
    availability: lib.planned?.availability,
    plannedType: lib.planned?.plannedType,
  };

  // 14. Downstream legacy mirrors
  const isLibraryActive =
    status === 'yes_physical' ||
    status === 'yes_physical_digital' ||
    status === 'digital_only' ||
    status === 'outsourced';

  const isBarcodeActive =
    (status === 'yes_physical' || status === 'yes_physical_digital') &&
    (identification.method === 'barcode' || identification.method === 'barcode_rfid');

  const isRfidActive =
    (status === 'yes_physical' || status === 'yes_physical_digital') &&
    (identification.method === 'rfid' || identification.method === 'barcode_rfid');

  return {
    status,
    noLibraryFuturePlan: lib.noLibraryFuturePlan || 'no_plans',
    planned,
    physical,
    digital,
    identification,
    circulation,
    fines,
    membership,
    staffing,
    outsourced,
    software,
    inventory,
    visibility,
    automation,

    // Legacy synchronized mirrors (protecting database provisioning and external consumers)
    enabled: isLibraryActive,
    bookCountEstimate: physical.estimatedPhysicalBookCount,
    librariesCount: physical.libraryRoomsCount,
    barcodeScannerIntegration: isBarcodeActive,
    barcodeScannerRequired: isBarcodeActive && identification.scannerStatus !== 'already_available',
    rfidRequired: isRfidActive && identification.rfidStatus !== 'already_available',
    digitalLibraryEnabled: status === 'yes_physical_digital' || status === 'digital_only' || digital.isAvailable,
    issueReturnTrackingNeeded: circulation.lendingAvailable === 'yes',
    fineSystemEnabled: fines.overdueFineType !== 'no_fine',
    studentBorrowLimit: circulation.maxBooksPerStudent,
    staffBorrowLimit: circulation.maxBooksPerStaff,
    categories: Array.isArray(lib.categories) && lib.categories.length > 0
      ? lib.categories
      : ['Textbooks', 'Reference Books', 'General Knowledge', 'Fiction', 'Periodicals & Magazines'],
  };
}

// ─── BRANCH-SPECIFIC VALIDATION ──────────────────────────────────────────────

export interface LibraryValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  missingFields: string[];
}

/**
 * Validates ONLY the active branch requirements.
 * Hidden conditional fields NEVER create validation errors.
 */
export function validateLibraryData(
  config: LibraryData,
  productId?: string
): LibraryValidationResult {
  const errors: Record<string, string> = {};
  const missingFields: string[] = [];

  const status = config.status;
  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';

  if (!status) {
    errors['status'] = 'Please select whether your institution provides library services.';
    missingFields.push('Library: Service Status');
    return { isValid: false, errors, missingFields };
  }

  // Branch 1 & 2: No Library or Not Yet Decided -> always valid once chosen
  if (status === 'no_library' || status === 'not_decided') {
    return { isValid: true, errors: {}, missingFields: [] };
  }

  // Branch 3: Planned / Coming Soon
  if (status === 'planned') {
    if (!config.planned?.availability) {
      errors['planned.availability'] = 'Please specify expected library availability.';
      missingFields.push('Library: Expected Availability');
    }
    if (!config.planned?.plannedType) {
      errors['planned.plannedType'] = 'Please specify planned library type.';
      missingFields.push('Library: Planned Library Type');
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFields,
    };
  }

  // Branch 4: Outsourced / External Library
  if (status === 'outsourced') {
    if (!config.outsourced?.serviceModel) {
      errors['outsourced.serviceModel'] = 'Please select an external library service model.';
      missingFields.push('Library: External Service Model');
    }
    if (!config.outsourced?.schoolAccess) {
      errors['outsourced.schoolAccess'] = 'Please select school access scope.';
      missingFields.push('Library: School Access Model');
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFields,
    };
  }

  // Branch 5: Digital Library Only
  if (status === 'digital_only') {
    if (!config.digital?.resources || config.digital.resources.length === 0) {
      errors['digital.resources'] = 'Please select at least one digital resource category.';
      missingFields.push('Library: Digital Resource Categories');
    }
    if (config.digital?.resources?.includes('other') && !config.digital?.otherResourceDescription?.trim()) {
      errors['digital.otherResourceDescription'] = 'Please describe your other digital resources.';
      missingFields.push('Library: Other Digital Resources');
    }
    if (!config.digital?.accessModel) {
      errors['digital.accessModel'] = 'Please select an access model.';
      missingFields.push('Library: Digital Access Model');
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFields,
    };
  }

  // Branch 6 & 7: Physical or Physical + Digital
  if (status === 'yes_physical' || status === 'yes_physical_digital') {
    // Physical book volume
    const books = config.physical?.estimatedPhysicalBookCount;
    if (books === undefined || books === null || isNaN(books) || books < 0) {
      errors['physical.estimatedPhysicalBookCount'] = 'Approximate book volume must be a non-negative number.';
      missingFields.push('Library: Estimated Book Volume');
    }

    if (!isWebsiteOnly) {
      // Identification method
      if (!config.identification?.method) {
        errors['identification.method'] = 'Please select a book identification method.';
        missingFields.push('Library: Book Identification Method');
      }

      // Lending preference
      if (!config.circulation?.lendingAvailable) {
        errors['circulation.lendingAvailable'] = 'Please specify if book lending is available.';
        missingFields.push('Library: Lending Preference');
      }

      // If lending is enabled, validate limits and duration
      if (config.circulation?.lendingAvailable === 'yes') {
        if (
          config.circulation?.maxBooksPerStudent !== undefined &&
          (isNaN(config.circulation.maxBooksPerStudent) || config.circulation.maxBooksPerStudent <= 0)
        ) {
          errors['circulation.maxBooksPerStudent'] = 'Maximum books per student must be greater than zero.';
          missingFields.push('Library: Max Books Per Student');
        }

        if (
          config.circulation?.maxBooksPerStaff !== undefined &&
          (isNaN(config.circulation.maxBooksPerStaff) || config.circulation.maxBooksPerStaff <= 0)
        ) {
          errors['circulation.maxBooksPerStaff'] = 'Maximum books per staff must be greater than zero.';
          missingFields.push('Library: Max Books Per Staff');
        }

        if (config.circulation?.loanDurationOption === 'custom') {
          const customDays = config.circulation?.customLoanDurationDays;
          if (!customDays || isNaN(customDays) || customDays <= 0) {
            errors['circulation.customLoanDurationDays'] = 'Custom loan duration must be a positive number of days.';
            missingFields.push('Library: Custom Loan Duration');
          }
        }
      }

      // If fine is configured, validate fine amount
      if (
        config.fines?.overdueFineType &&
        config.fines.overdueFineType !== 'no_fine' &&
        config.fines.overdueFineType !== 'to_be_configured_later'
      ) {
        const fineAmt = config.fines?.fineAmount;
        if (fineAmt === undefined || isNaN(fineAmt) || fineAmt < 0) {
          errors['fines.fineAmount'] = 'Fine amount must be a non-negative amount.';
          missingFields.push('Library: Fine Amount');
        }
      }
    }

    // If Physical + Digital, also validate digital resources
    if (status === 'yes_physical_digital') {
      if (!config.digital?.resources || config.digital.resources.length === 0) {
        errors['digital.resources'] = 'Please select at least one digital resource category.';
        missingFields.push('Library: Digital Resource Categories');
      }
      if (config.digital?.resources?.includes('other') && !config.digital?.otherResourceDescription?.trim()) {
        errors['digital.otherResourceDescription'] = 'Please describe your other digital resources.';
        missingFields.push('Library: Other Digital Resources');
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingFields,
  };
}

// ─── CONDITIONAL COMPLETION SCORING ──────────────────────────────────────────

export interface LibrarySectionScore {
  total: number;
  filled: number;
  percentage: number;
  isConfiguredForLater: boolean;
  missingFields: string[];
}

/**
 * Calculates conditional score matching Prompt Section 24 requirements.
 */
export function getLibrarySectionScore(
  config?: Partial<LibraryData> | null,
  productId?: string
): LibrarySectionScore {
  if (!config || !config.status) {
    return {
      total: 1,
      filled: 0,
      percentage: 0,
      isConfiguredForLater: false,
      missingFields: ['Library: Institutional Library Service Status'],
    };
  }

  const status = config.status;
  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';

  // 1. No Library -> 100% Complete
  if (status === 'no_library') {
    return {
      total: 1,
      filled: 1,
      percentage: 100,
      isConfiguredForLater: false,
      missingFields: [],
    };
  }

  // 2. Not Yet Decided -> 100% Complete (configured for later)
  if (status === 'not_decided') {
    return {
      total: 1,
      filled: 1,
      percentage: 100,
      isConfiguredForLater: true,
      missingFields: [],
    };
  }

  // 3. Planned / Coming Soon
  if (status === 'planned') {
    let filled = 0;
    const missing: string[] = [];

    if (config.planned?.availability) filled++;
    else missing.push('Library: Expected Availability');

    if (config.planned?.plannedType) filled++;
    else missing.push('Library: Planned Library Type');

    const total = 2;
    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      isConfiguredForLater: false,
      missingFields: missing,
    };
  }

  // 4. Outsourced / External Library
  if (status === 'outsourced') {
    let filled = 0;
    const missing: string[] = [];

    if (config.outsourced?.serviceModel) filled++;
    else missing.push('Library: Service Model');

    if (config.outsourced?.schoolAccess) filled++;
    else missing.push('Library: Access Model');

    const total = 2;
    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      isConfiguredForLater: false,
      missingFields: missing,
    };
  }

  // 5. Digital Library Only
  if (status === 'digital_only') {
    let filled = 0;
    const missing: string[] = [];

    // Digital library status itself (1)
    filled++;

    if (config.digital?.resources && config.digital.resources.length > 0) filled++;
    else missing.push('Library: Digital Resource Categories');

    if (config.digital?.accessModel) filled++;
    else missing.push('Library: Digital Access Model');

    const total = 3;
    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      isConfiguredForLater: false,
      missingFields: missing,
    };
  }

  // 6. Physical Library
  if (status === 'yes_physical') {
    let filled = 0;
    const missing: string[] = [];

    // 1. Library type
    filled++;

    // 2. Estimated book volume
    if (
      config.physical?.estimatedPhysicalBookCount !== undefined &&
      config.physical.estimatedPhysicalBookCount >= 0
    ) {
      filled++;
    } else {
      missing.push('Library: Estimated Book Volume');
    }

    if (!isWebsiteOnly) {
      // 3. Identification method
      if (config.identification?.method) {
        filled++;
      } else {
        missing.push('Library: Identification Method');
      }

      // 4. Lending preference
      if (config.circulation?.lendingAvailable) {
        filled++;
      } else {
        missing.push('Library: Lending Preference');
      }
    }

    const total = isWebsiteOnly ? 2 : 4;
    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      isConfiguredForLater: false,
      missingFields: missing,
    };
  }

  // 7. Physical + Digital
  if (status === 'yes_physical_digital') {
    let filled = 0;
    const missing: string[] = [];

    // Physical fields
    filled++; // Library status

    if (
      config.physical?.estimatedPhysicalBookCount !== undefined &&
      config.physical.estimatedPhysicalBookCount >= 0
    ) {
      filled++;
    } else {
      missing.push('Library: Estimated Book Volume');
    }

    if (!isWebsiteOnly) {
      if (config.identification?.method) filled++;
      else missing.push('Library: Identification Method');

      if (config.circulation?.lendingAvailable) filled++;
      else missing.push('Library: Lending Preference');
    }

    // Digital field
    if (config.digital?.resources && config.digital.resources.length > 0) filled++;
    else missing.push('Library: Digital Resource Categories');

    const total = isWebsiteOnly ? 3 : 5;
    return {
      total,
      filled,
      percentage: Math.round((filled / total) * 100),
      isConfiguredForLater: false,
      missingFields: missing,
    };
  }

  return {
    total: 1,
    filled: 0,
    percentage: 0,
    isConfiguredForLater: false,
    missingFields: ['Library: Institutional Library Service Status'],
  };
}

// ─── DYNAMIC CONFIGURATION SUMMARY CARD ──────────────────────────────────────

export interface SummaryItem {
  label: string;
  value: string;
}

/**
 * Generates key-value pairs for the dynamic Library Configuration Summary card
 * per Prompt Section 30.
 */
export function getLibrarySummary(config: LibraryData, currencySymbol: string = '₹'): SummaryItem[] {
  const items: SummaryItem[] = [];
  const status = config.status;

  if (!status) {
    items.push({ label: 'Library Status', value: 'Not Selected' });
    return items;
  }

  const statusObj = LIBRARY_STATUS_OPTIONS.find((s) => s.value === status);
  items.push({ label: 'Library Status', value: statusObj?.label || status });

  if (status === 'no_library') {
    const future = FUTURE_LIBRARY_OPTIONS.find((f) => f.value === config.noLibraryFuturePlan);
    if (future) {
      items.push({ label: 'Future Plans', value: future.label });
    }
    return items;
  }

  if (status === 'not_decided') {
    items.push({ label: 'Configuration', value: 'Deferred to Onboarding Handoff' });
    return items;
  }

  if (status === 'planned') {
    const avail = PLANNED_AVAILABILITY_OPTIONS.find((a) => a.value === config.planned?.availability);
    const ptype = PLANNED_TYPE_OPTIONS.find((t) => t.value === config.planned?.plannedType);
    if (avail) items.push({ label: 'Expected Availability', value: avail.label });
    if (ptype) items.push({ label: 'Planned Type', value: ptype.label });
    return items;
  }

  if (status === 'outsourced') {
    const sModel = OUTSOURCED_SERVICE_MODELS.find((m) => m.value === config.outsourced?.serviceModel);
    const access = OUTSOURCED_SCHOOL_ACCESS.find((a) => a.value === config.outsourced?.schoolAccess);
    const dInt = OUTSOURCED_DIGITAL_INTEGRATIONS.find((i) => i.value === config.outsourced?.digitalIntegration);
    if (sModel) items.push({ label: 'Service Model', value: sModel.label });
    if (access) items.push({ label: 'School Access', value: access.label });
    if (dInt) items.push({ label: 'Digital Integration', value: dInt.label });
    return items;
  }

  // Physical or Physical + Digital
  if (status === 'yes_physical' || status === 'yes_physical_digital') {
    const books = config.physical?.estimatedPhysicalBookCount;
    items.push({
      label: 'Physical Books',
      value: typeof books === 'number' ? `${books.toLocaleString()} estimated` : 'Not defined',
    });

    const ident = BOOK_IDENTIFICATION_METHODS.find((m) => m.value === config.identification?.method);
    items.push({ label: 'Identification', value: ident?.label || 'Not Selected' });

    const lending = LENDING_PREFERENCE_OPTIONS.find((l) => l.value === config.circulation?.lendingAvailable);
    items.push({ label: 'Lending', value: lending?.label || 'Enabled' });

    if (config.circulation?.lendingAvailable === 'yes') {
      if (config.circulation?.maxBooksPerStudent) {
        items.push({ label: 'Books Per Student', value: `${config.circulation.maxBooksPerStudent}` });
      }

      const dur = LOAN_DURATION_OPTIONS.find((d) => d.value === config.circulation?.loanDurationOption);
      const loanText =
        config.circulation?.loanDurationOption === 'custom'
          ? `${config.circulation.customLoanDurationDays} days`
          : dur?.label || '14 Days';
      items.push({ label: 'Loan Duration', value: loanText });

      if (config.fines?.overdueFineType && config.fines.overdueFineType !== 'no_fine') {
        const fineText =
          config.fines.overdueFineType === 'per_day'
            ? `${currencySymbol}${config.fines.fineAmount || 0} / day`
            : config.fines.overdueFineType === 'per_book'
            ? `${currencySymbol}${config.fines.fineAmount || 0} / book`
            : `${currencySymbol}${config.fines.fineAmount || 0} / day / book`;
        items.push({ label: 'Overdue Fine', value: fineText });
      } else {
        items.push({ label: 'Overdue Fine', value: 'No Fine' });
      }
    }
  }

  // Digital resources for Digital Only or Physical + Digital
  if (status === 'digital_only' || status === 'yes_physical_digital') {
    const resCount = config.digital?.resources?.length || 0;
    if (resCount > 0) {
      const resLabels = (config.digital?.resources || [])
        .map((r) => DIGITAL_RESOURCE_OPTIONS.find((o) => o.value === r)?.label || r)
        .slice(0, 2);
      const extra = resCount > 2 ? ` +${resCount - 2} more` : '';
      items.push({ label: 'Digital Resources', value: `${resLabels.join(', ')}${extra}` });
    }

    if (status === 'digital_only') {
      const acc = DIGITAL_ACCESS_MODELS.find((a) => a.value === config.digital?.accessModel);
      if (acc) items.push({ label: 'Access Model', value: acc.label });
    }
  }

  // Notifications
  if (config.automation?.features && config.automation.features.length > 0 && !config.automation.features.includes('none')) {
    items.push({ label: 'Automations', value: `${config.automation.features.length} rules active` });
  }

  // Parent visibility
  if (config.visibility?.parentVisibilityEnabled === 'yes') {
    items.push({ label: 'Parent Visibility', value: 'Enabled via Mobile App' });
  }

  return items;
}
