import type {
  DataMigrationData,
  MigrationSourceId,
  MigrationDataCategoryId,
  HistoricalDataDuration,
  DataReadinessLevel,
  MigrationFileFormat,
  DataQualityIssueId,
  MigrationReadinessOption,
  DataAccessAvailability,
  MigrationExecutionPreference,
  MigrationRecordVolumes,
} from './types';

// ─── 1. OPTION REGISTRIES & CATALOGS ──────────────────────────────────────────

export interface DataSourceCatalogItem {
  id: MigrationSourceId;
  label: string;
  badge: string;
  description: string;
}

export const DATA_SOURCE_OPTIONS: DataSourceCatalogItem[] = [
  {
    id: 'excel',
    label: 'Excel Spreadsheets',
    badge: 'XLS / XLSX',
    description: 'Microsoft Excel workbooks with student, parent, staff, or fee lists.',
  },
  {
    id: 'csv',
    label: 'CSV Files',
    badge: 'Plain Text',
    description: 'Comma or tab-delimited text files exported from previous software.',
  },
  {
    id: 'tally',
    label: 'Tally Accounts',
    badge: 'TallyPrime / ERP 9',
    description: 'Tally financial accounting ledgers, fee vouchers, and receipt books.',
  },
  {
    id: 'legacy_erp',
    label: 'Legacy ERP',
    badge: 'Desktop / Server',
    description: 'Prior installed on-premise ERP or legacy client-server software.',
  },
  {
    id: 'school_management_software',
    label: 'School Management Software',
    badge: 'SaaS / Package',
    description: 'Commercial cloud or local school software (e.g. Edunext, Entab, Fedena).',
  },
  {
    id: 'paper_records',
    label: 'Paper / Physical Records',
    badge: 'Physical Registers',
    description: 'Handwritten registers, card files, physical ledgers, and cash books.',
  },
  {
    id: 'google_sheets',
    label: 'Google Sheets',
    badge: 'Google Drive',
    description: 'Online Google Drive sheets maintained collaboratively by school staff.',
  },
  {
    id: 'other',
    label: 'Other System',
    badge: 'Custom Source',
    description: 'Custom database, proprietary format, or unlisted software.',
  },
];

export interface DataCategoryCatalogItem {
  id: MigrationDataCategoryId;
  label: string;
  group: string;
  description: string;
}

export const DATA_CATEGORY_OPTIONS: DataCategoryCatalogItem[] = [
  {
    id: 'student_records',
    label: 'Student Records',
    group: 'Academics',
    description: 'Master biodata, admission numbers, dates of birth, class, and section.',
  },
  {
    id: 'parent_guardian_records',
    label: 'Parent / Guardian Records',
    group: 'Academics',
    description: 'Father/mother names, mobile contacts, WhatsApp, emails, and home addresses.',
  },
  {
    id: 'staff_records',
    label: 'Staff Records',
    group: 'Personnel',
    description: 'Faculty, administrative, and support staff records with designations.',
  },
  {
    id: 'attendance_records',
    label: 'Attendance Records',
    group: 'Daily Ops',
    description: 'Historical student and staff day-wise attendance and leaves.',
  },
  {
    id: 'examination_records',
    label: 'Examination / Marks Records',
    group: 'Academics',
    description: 'Past term marks, report card scores, and academic grading sheets.',
  },
  {
    id: 'fees_records',
    label: 'Fees / Payment Records',
    group: 'Finance',
    description: 'Student fee ledgers, past receipts, outstanding balances, and concessions.',
  },
  {
    id: 'admission_records',
    label: 'Admission Records',
    group: 'Intake',
    description: 'Inquiries, application registers, and past student enrollments.',
  },
  {
    id: 'transport_records',
    label: 'Transport Records',
    group: 'Campus Ops',
    description: 'Bus routes, student stops, vehicle numbers, and driver assignments.',
  },
  {
    id: 'library_records',
    label: 'Library Records',
    group: 'Campus Ops',
    description: 'Book catalog, accession numbers, and circulation history.',
  },
  {
    id: 'hostel_records',
    label: 'Hostel Records',
    group: 'Campus Ops',
    description: 'Hostel rooms, bed assignments, wardens, and mess accounts.',
  },
  {
    id: 'inventory_records',
    label: 'Inventory / Assets',
    group: 'Administration',
    description: 'Lab equipment, classroom furniture, and institutional fixed assets.',
  },
  {
    id: 'hr_payroll_records',
    label: 'HR / Payroll',
    group: 'Finance',
    description: 'Salary structures, PF/ESI deductions, and staff bank accounts.',
  },
  {
    id: 'other',
    label: 'Other Records',
    group: 'Custom',
    description: 'Custom datasets or institutional records not listed above.',
  },
];

export interface CatalogChoice<T extends string> {
  id: T;
  label: string;
  helper: string;
}

export const HISTORICAL_YEARS_OPTIONS: CatalogChoice<HistoricalDataDuration>[] = [
  { id: 'current_year_only', label: 'Current year only', helper: 'Active session records only' },
  { id: '1_year', label: '1 year', helper: 'Current + 1 preceding session' },
  { id: '2_years', label: '2 years', helper: 'Past 2 academic sessions' },
  { id: '3_years', label: '3 years', helper: 'Past 3 academic sessions' },
  { id: '4_5_years', label: '4–5 years', helper: 'Medium-term historical archive' },
  { id: 'more_than_5_years', label: 'More than 5 years', helper: 'Long-term historical archive (custom years)' },
  { id: 'not_sure', label: 'Not sure', helper: 'Will decide during assessment review' },
];

export const DATA_STRUCTURE_CONDITIONS: CatalogChoice<DataReadinessLevel>[] = [
  {
    id: 'clean_structured',
    label: 'Clean and structured',
    helper: 'Uniform columns, consistent headings, minimal missing values',
  },
  {
    id: 'mostly_structured',
    label: 'Mostly structured',
    helper: 'Minor inconsistencies or sporadic empty cells',
  },
  {
    id: 'requires_cleaning',
    label: 'Requires cleaning',
    helper: 'Contains duplicates, non-standard dates, or mismatched names',
  },
  {
    id: 'highly_inconsistent',
    label: 'Highly inconsistent',
    helper: 'Different formats per year, fragmented sheets, or corrupted data',
  },
  {
    id: 'unknown',
    label: 'Unknown',
    helper: 'Has not been audited by technical staff yet',
  },
];

export const FILE_FORMAT_OPTIONS: CatalogChoice<MigrationFileFormat>[] = [
  { id: 'xls_xlsx', label: 'XLS / XLSX', helper: 'Microsoft Excel workbooks' },
  { id: 'csv', label: 'CSV', helper: 'Comma-separated values' },
  { id: 'pdf', label: 'PDF', helper: 'Exported reports or scanned pages' },
  { id: 'xml', label: 'XML', helper: 'Structured data export' },
  { id: 'database_export', label: 'Database export', helper: 'SQL, MDB, or JSON dump' },
  { id: 'tally_export', label: 'Tally export', helper: 'Tally XML / Excel sheets' },
  { id: 'other', label: 'Other', helper: 'Specialized or proprietary format' },
];

export const DATA_QUALITY_ISSUES: CatalogChoice<DataQualityIssueId>[] = [
  { id: 'duplicate_records', label: 'Duplicate records', helper: 'Same student or parent entered multiple times' },
  { id: 'missing_student_ids', label: 'Missing student IDs', helper: 'No uniform admission / roll number' },
  { id: 'missing_parent_info', label: 'Missing parent info', helper: 'Father/mother contacts missing or incomplete' },
  { id: 'inconsistent_names', label: 'Inconsistent names', helper: 'First/last name reversals or spelling differences' },
  { id: 'inconsistent_phone_numbers', label: 'Inconsistent phone numbers', helper: '9-digit or missing country codes' },
  { id: 'missing_dates', label: 'Missing dates', helper: 'Unrecorded date of birth or admission date' },
  { id: 'inconsistent_class_sections', label: 'Inconsistent class/section names', helper: 'e.g. 10th-A vs X-A vs Class 10 Sec A' },
  { id: 'different_formats_across_years', label: 'Different formats across years', helper: 'Columns changed each academic year' },
  { id: 'missing_historical_records', label: 'Missing historical records', helper: 'Past session sheets lost or unavailable' },
  { id: 'no_major_issues', label: 'No major issues known', helper: 'Data is believed to be in good order' },
  { id: 'other', label: 'Other quality concerns', helper: 'Specific issues to discuss with engineer' },
];

export const MIGRATION_READINESS_OPTIONS: CatalogChoice<MigrationReadinessOption>[] = [
  { id: 'ready_for_migration', label: 'Ready for migration', helper: 'Files are compiled, formatted, and ready for import' },
  { id: 'minor_cleanup_required', label: 'Minor cleanup required', helper: 'School staff is doing quick final adjustments' },
  { id: 'significant_cleanup_required', label: 'Significant cleanup required', helper: 'Substantial deduplication or mapping assistance needed' },
  { id: 'requires_assessment', label: 'Requires assessment', helper: 'Ekaagra engineering team needs to review samples first' },
  { id: 'not_currently_available', label: 'Not currently available', helper: 'Data is currently locked in legacy software' },
];

export const DATA_ACCESS_OPTIONS: CatalogChoice<DataAccessAvailability>[] = [
  { id: 'yes_immediately', label: 'Yes, immediately', helper: 'Direct administrative export access is available' },
  { id: 'yes_after_preparation', label: 'Yes, after preparation', helper: 'Staff needs 2–5 days to extract and compile' },
  { id: 'partially', label: 'Partially', helper: 'Some modules are accessible; others require vendor permission' },
  { id: 'no', label: 'No', helper: 'Vendor refused export or proprietary lock-in' },
  { id: 'not_sure', label: 'Not sure', helper: 'Need technical assistance to check database access' },
];

export const MIGRATION_PREFERENCE_OPTIONS: CatalogChoice<MigrationExecutionPreference>[] = [
  { id: 'full_migration', label: 'Full migration', helper: 'Migrate everything (all historical records, staff, and fees)' },
  { id: 'selective_migration', label: 'Selective migration', helper: 'Migrate specific core categories (e.g. active students only)' },
  { id: 'current_year_only', label: 'Current-year migration only', helper: 'Clean slate for previous years, active students only' },
  { id: 'historical_migration', label: 'Historical migration', helper: 'Full archive of all past alumni and legacy batches' },
  { id: 'assessment_first', label: 'Migration assessment first', helper: 'Assess data sample and provide custom recommendation' },
  { id: 'not_sure', label: 'Not sure', helper: 'Discuss migration scope during kickoff call' },
];

// ─── 2. NORMALIZATION & PRE-FILL UTILITIES ───────────────────────────────────

export function normalizeDataMigrationData(
  raw?: Partial<DataMigrationData>,
  context?: {
    estimatedStudents?: number;
    estimatedStaff?: number;
  }
): DataMigrationData {
  const data = raw || {};

  // Infer sources if upgrading from legacy schema
  let sources: MigrationSourceId[] = Array.isArray(data.sources) ? [...data.sources] : [];
  if (sources.length === 0) {
    if (data.sourceType === 'excel' || data.currentSystemType === 'excel_spreadsheets') {
      sources.push('excel');
    } else if (data.sourceType === 'csv') {
      sources.push('csv');
    } else if (data.sourceType === 'tally') {
      sources.push('tally');
    } else if (data.sourceType === 'older_erp') {
      sources.push('legacy_erp');
    } else if (data.sourceType === 'other_software' || data.currentSystemType === 'cloud_software') {
      sources.push('school_management_software');
    } else if (data.sourceType === 'paper' || data.currentSystemType === 'paper_registers') {
      sources.push('paper_records');
    }
  }

  // Infer categories if upgrading from legacy schema
  let dataCategories: MigrationDataCategoryId[] = Array.isArray(data.dataCategories)
    ? [...data.dataCategories]
    : [];
  if (dataCategories.length === 0 && data.categoriesToMigrate) {
    const cm = data.categoriesToMigrate;
    if (cm.students || data.migrateStudentRecords) dataCategories.push('student_records');
    if (cm.staff || data.migrateStaffRecords) dataCategories.push('staff_records');
    if (cm.fees || data.migrateHistoricalFeeLedgers) dataCategories.push('fees_records');
    if (cm.attendance) dataCategories.push('attendance_records');
    if (cm.examination) dataCategories.push('examination_records');
    if (cm.library) dataCategories.push('library_records');
    if (cm.transport) dataCategories.push('transport_records');
    if (cm.admission) dataCategories.push('admission_records');
    if (cm.alumni) dataCategories.push('student_records');
  }

  // Volumes
  const studentsCount =
    data.recordVolumes?.students ??
    data.recordCounts?.studentsCount ??
    data.estimatedStudentRecordsToImport ??
    context?.estimatedStudents ??
    null;

  const staffCount =
    data.recordVolumes?.staff ??
    data.recordCounts?.staffCount ??
    context?.estimatedStaff ??
    null;

  const recordVolumes: MigrationRecordVolumes = {
    students: studentsCount != null ? Number(studentsCount) : null,
    guardians: data.recordVolumes?.guardians != null ? Number(data.recordVolumes.guardians) : null,
    staff: staffCount != null ? Number(staffCount) : null,
    historicalAcademic:
      data.recordVolumes?.historicalAcademic != null ? Number(data.recordVolumes.historicalAcademic) : null,
    financial: data.recordVolumes?.financial != null ? Number(data.recordVolumes.financial) : null,
    total: data.recordVolumes?.total != null ? Number(data.recordVolumes.total) : null,
  };

  // Readiness
  let readiness: MigrationReadinessOption | undefined = data.readiness;
  if (!readiness && data.migrationReadinessStatus) {
    if (data.migrationReadinessStatus === 'ready_files') readiness = 'ready_for_migration';
    else if (data.migrationReadinessStatus === 'needs_formatting_help') readiness = 'minor_cleanup_required';
    else if (data.migrationReadinessStatus === 'data_cleanup_in_progress') readiness = 'significant_cleanup_required';
  }

  // Backward compatibility synchronization
  const firstSource = sources[0];
  const legacySystemType =
    firstSource === 'excel'
      ? 'excel_spreadsheets'
      : firstSource === 'legacy_erp'
      ? 'older_desktop_software'
      : firstSource === 'school_management_software' || firstSource === 'google_sheets'
      ? 'cloud_software'
      : firstSource === 'paper_records'
      ? 'paper_registers'
      : 'excel_spreadsheets';

  const legacySourceType =
    firstSource === 'excel'
      ? 'excel'
      : firstSource === 'csv'
      ? 'csv'
      : firstSource === 'tally'
      ? 'tally'
      : firstSource === 'legacy_erp'
      ? 'older_erp'
      : firstSource === 'paper_records'
      ? 'paper'
      : 'other_software';

  return {
    ...data,
    sources,
    otherSourceDetails: data.otherSourceDetails || '',
    hasMultipleSources: data.hasMultipleSources ?? (sources.length > 1),

    legacyErpName: data.legacyErpName || data.currentSoftwareName || '',
    legacyErpVersion: data.legacyErpVersion || '',
    tallyVersion: data.tallyVersion || '',
    tallyExportType: data.tallyExportType || '',
    spreadsheetsFileCount: data.spreadsheetsFileCount != null ? Number(data.spreadsheetsFileCount) : null,
    digitizationRequired: data.digitizationRequired ?? false,
    digitizationNotes: data.digitizationNotes || '',

    dataCategories,
    otherCategoryDetails: data.otherCategoryDetails || '',

    recordVolumes,

    historicalYears: data.historicalYears || undefined,
    historicalYearCount: data.historicalYearCount != null ? Number(data.historicalYearCount) : null,

    dataStructureCondition: data.dataStructureCondition || undefined,
    fileFormats: Array.isArray(data.fileFormats) ? data.fileFormats : [],
    otherFormatDetails: data.otherFormatDetails || '',

    dataQualityIssues: Array.isArray(data.dataQualityIssues) ? data.dataQualityIssues : [],
    otherQualityIssueDetails: data.otherQualityIssueDetails || '',

    readiness,
    assessmentNeedsDescription: data.assessmentNeedsDescription || '',

    dataAccess: data.dataAccess || undefined,
    dataAccessExplanation: data.dataAccessExplanation || '',

    migrationPreference: data.migrationPreference || undefined,

    additionalNotes: data.additionalNotes || '',

    // Synchronized legacy mirrors
    hasExistingData: sources.length > 0,
    currentSystemType: legacySystemType,
    currentSoftwareName: data.legacyErpName || data.otherSourceDetails || data.currentSoftwareName || '',
    sourceType: legacySourceType,
    categoriesToMigrate: {
      students: dataCategories.includes('student_records'),
      staff: dataCategories.includes('staff_records'),
      fees: dataCategories.includes('fees_records'),
      attendance: dataCategories.includes('attendance_records'),
      examination: dataCategories.includes('examination_records'),
      library: dataCategories.includes('library_records'),
      transport: dataCategories.includes('transport_records'),
      admission: dataCategories.includes('admission_records'),
      alumni: false,
    },
    recordCounts: {
      studentsCount: recordVolumes.students || undefined,
      staffCount: recordVolumes.staff || undefined,
    },
    migrateStudentRecords: dataCategories.includes('student_records'),
    migrateStaffRecords: dataCategories.includes('staff_records'),
    migrateHistoricalFeeLedgers: dataCategories.includes('fees_records'),
    estimatedStudentRecordsToImport: recordVolumes.students || recordVolumes.total || 0,
    migrationReadinessStatus:
      readiness === 'ready_for_migration'
        ? 'ready_files'
        : readiness === 'minor_cleanup_required'
        ? 'needs_formatting_help'
        : 'data_cleanup_in_progress',
  };
}

// ─── 3. VALIDATION ────────────────────────────────────────────────────────────

export interface DataMigrationValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  missingDescriptions: string[];
}

export function validateDataMigrationData(
  data: Partial<DataMigrationData>
): DataMigrationValidationResult {
  const errors: Record<string, string> = {};
  const missingDescriptions: string[] = [];

  // 1. Data Sources (Required: at least one)
  const sources = data.sources || [];
  if (sources.length === 0) {
    errors.sources = 'Please select at least one existing data source.';
    missingDescriptions.push('Data Source: Select current school data system');
  }

  // Conditional: If 'other' source selected, require details
  if (sources.includes('other') && (!data.otherSourceDetails || !data.otherSourceDetails.trim())) {
    errors.otherSourceDetails = 'Please specify your other data source.';
    missingDescriptions.push('Data Source: Specify other data source');
  }

  // Conditional: Legacy ERP name required if legacy_erp selected
  if (sources.includes('legacy_erp') && (!data.legacyErpName || !data.legacyErpName.trim())) {
    errors.legacyErpName = 'Please enter the name of your legacy ERP system.';
    missingDescriptions.push('Legacy ERP: System name');
  }

  // 2. Data Categories (Required: at least one)
  const categories = data.dataCategories || [];
  if (categories.length === 0) {
    errors.dataCategories = 'Please select at least one data category to migrate.';
    missingDescriptions.push('Data Categories: Select at least one category to migrate');
  }

  // Conditional: If 'other' category selected, require details
  if (categories.includes('other') && (!data.otherCategoryDetails || !data.otherCategoryDetails.trim())) {
    errors.otherCategoryDetails = 'Please specify the other data category.';
    missingDescriptions.push('Data Categories: Specify other record category');
  }

  // 3. Migration Readiness (Required)
  if (!data.readiness) {
    errors.readiness = 'Please select your current data migration readiness.';
    missingDescriptions.push('Migration Readiness: Current preparation status');
  } else if (
    data.readiness === 'requires_assessment' &&
    (!data.assessmentNeedsDescription || !data.assessmentNeedsDescription.trim())
  ) {
    errors.assessmentNeedsDescription = 'Please describe what assessment is needed for your data.';
    missingDescriptions.push('Migration Readiness: Assessment requirements description');
  }

  // 4. Migration Preference (Required)
  if (!data.migrationPreference) {
    errors.migrationPreference = 'Please select how you would like migration handled.';
    missingDescriptions.push('Migration Preference: Scope of execution');
  }

  // 5. Data Access Constraints
  if (
    (data.dataAccess === 'no' || data.dataAccess === 'partially') &&
    (!data.dataAccessExplanation || !data.dataAccessExplanation.trim())
  ) {
    errors.dataAccessExplanation = 'Please explain the reason for restricted or partial data access.';
    missingDescriptions.push('Data Access: Explanation for partial or unavailable exports');
  }

  // 6. Historical Years Validation
  if (
    data.historicalYears === 'more_than_5_years' &&
    data.historicalYearCount != null &&
    (data.historicalYearCount <= 0 || data.historicalYearCount > 50)
  ) {
    errors.historicalYearCount = 'Please enter a valid number of years between 1 and 50.';
  }

  // 7. Numeric Constraints for Record Volumes
  const vols = data.recordVolumes || {};
  (['students', 'guardians', 'staff', 'historicalAcademic', 'financial', 'total'] as const).forEach(
    (field) => {
      const val = vols[field];
      if (val != null) {
        if (typeof val !== 'number' || isNaN(val) || val < 0) {
          errors[`recordVolumes.${field}`] = 'Record count must be a non-negative number.';
        }
      }
    }
  );

  if (
    data.spreadsheetsFileCount != null &&
    (typeof data.spreadsheetsFileCount !== 'number' ||
      isNaN(data.spreadsheetsFileCount) ||
      data.spreadsheetsFileCount < 0)
  ) {
    errors.spreadsheetsFileCount = 'Approximate file count must be a non-negative number.';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    missingDescriptions,
  };
}

// ─── 4. COMPLETION SCORING ───────────────────────────────────────────────────

export interface DataMigrationScoreResult {
  total: number;
  filled: number;
  percentage: number;
  isComplete: boolean;
  missingTitles: string[];
}

export function calculateDataMigrationScore(
  raw?: Partial<DataMigrationData>
): DataMigrationScoreResult {
  const data = raw || {};
  const missingTitles: string[] = [];
  let total = 0;
  let filled = 0;

  // 1. Data Source Selected
  total += 1;
  const sources = data.sources || [];
  const hasSource = sources.length > 0;
  const hasOtherSourceValid = !sources.includes('other') || Boolean(data.otherSourceDetails?.trim());
  if (hasSource && hasOtherSourceValid) {
    filled += 1;
  } else {
    missingTitles.push('Legacy Data Migration: Current data source');
  }

  // Conditional: If Legacy ERP selected, require name
  if (sources.includes('legacy_erp')) {
    total += 1;
    if (data.legacyErpName && data.legacyErpName.trim()) {
      filled += 1;
    } else {
      missingTitles.push('Legacy Data Migration: Legacy ERP system name');
    }
  }

  // 2. Data Categories Selected
  total += 1;
  const categories = data.dataCategories || [];
  const hasCategory = categories.length > 0;
  const hasOtherCategoryValid =
    !categories.includes('other') || Boolean(data.otherCategoryDetails?.trim());
  if (hasCategory && hasOtherCategoryValid) {
    filled += 1;
  } else {
    missingTitles.push('Legacy Data Migration: Categories to migrate');
  }

  // 3. Migration Readiness Selected
  total += 1;
  const hasReadiness = Boolean(data.readiness);
  const hasAssessmentValid =
    data.readiness !== 'requires_assessment' || Boolean(data.assessmentNeedsDescription?.trim());
  if (hasReadiness && hasAssessmentValid) {
    filled += 1;
  } else {
    missingTitles.push('Legacy Data Migration: Migration readiness status');
  }

  // 4. Migration Preference Selected
  total += 1;
  if (data.migrationPreference) {
    filled += 1;
  } else {
    missingTitles.push('Legacy Data Migration: Migration handling preference');
  }

  // Conditional: If data access is restricted ('no' or 'partially'), require explanation
  if (data.dataAccess === 'no' || data.dataAccess === 'partially') {
    total += 1;
    if (data.dataAccessExplanation && data.dataAccessExplanation.trim()) {
      filled += 1;
    } else {
      missingTitles.push('Legacy Data Migration: Data export access explanation');
    }
  }

  const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
  const isComplete = percentage === 100;

  return {
    total,
    filled,
    percentage,
    isComplete,
    missingTitles,
  };
}
