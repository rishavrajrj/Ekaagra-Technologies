/**
 * ERP STATISTICS & AGGREGATE INSTITUTIONAL COUNT UTILITIES
 *
 * Provides optional ERP synchronization, side-by-side comparison, source tagging,
 * and robust number validation for Campus Facilities & Infrastructure Highlights.
 *
 * Core principles:
 * 1. Manual aggregate entry is 100% authoritative and first-class.
 * 2. ERP synchronization is an optional convenience feature.
 * 3. Detailed student/staff databases are NEVER required.
 * 4. Manual values are never silently overwritten.
 */

import type { FacilitiesData, StatCountSource } from './types';

export interface ErpCampusStatistics {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalNonTeachingStaff: number;
  historicalStudents: number;
  classroomsCount: number;
  fetchedAt: string;
  erpSystemName: string;
}

export interface ErpFieldComparison {
  fieldKey: 'totalStudents' | 'activeStudents' | 'totalTeachers' | 'totalNonTeachingStaff' | 'historicalStudents' | 'classroomsCount';
  label: string;
  currentValue: number | undefined;
  erpValue: number;
  currentSource: StatCountSource;
  changed: boolean;
}

export interface ErpSyncResult {
  success: boolean;
  data?: ErpCampusStatistics;
  error?: string;
}

/**
 * Format a synced date into a clean human-readable badge label.
 * Example: "Synced from ERP • Sep 9, 2026"
 */
export function formatSyncedAt(dateOrString?: string | Date): string {
  if (!dateOrString) return 'Synced from ERP';
  const date = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
  if (isNaN(date.getTime())) return 'Synced from ERP';

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Synced from ERP • ${formatted}`;
}

/**
 * Fetch available aggregate statistics from ERP.
 * Supports optional simulation of failure to test resilience.
 */
export async function fetchErpCampusStatistics(options?: {
  campusId?: string;
  simulateFailure?: boolean;
}): Promise<ErpSyncResult> {
  // Artificial slight delay for realistic UX feedback
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (options?.simulateFailure) {
    return {
      success: false,
      error: 'ERP sync could not be completed. You can continue using manually entered campus statistics.',
    };
  }

  // Realistic default ERP aggregate metrics for institutional onboarding
  const isBranch = options?.campusId && options.campusId !== 'main' && options.campusId !== 'all';
  const data: ErpCampusStatistics = {
    totalStudents: isBranch ? 4500 : 10000,
    activeStudents: isBranch ? 3850 : 8750,
    totalTeachers: isBranch ? 140 : 320,
    totalNonTeachingStaff: isBranch ? 65 : 145,
    historicalStudents: isBranch ? 5200 : 12000,
    classroomsCount: isBranch ? 36 : 64,
    fetchedAt: new Date().toISOString(),
    erpSystemName: 'Connected Campus ERP',
  };

  return {
    success: true,
    data,
  };
}

/**
 * Compare current facilitiesConfig counts against incoming ERP counts.
 */
export function compareCampusStatistics(
  currentFac: FacilitiesData | undefined,
  erpData: ErpCampusStatistics
): ErpFieldComparison[] {
  const fac = currentFac || {};

  const currentNonTeaching = fac.totalNonTeachingStaff ?? fac.nonTeachingStaff;
  const currentHistorical = fac.historicalStudents ?? fac.historicalPreDigitalStudents;
  const currentClassrooms = fac.classroomsCount ?? fac.totalClassrooms;

  const fields: ErpFieldComparison[] = [
    {
      fieldKey: 'totalStudents',
      label: 'Total Students',
      currentValue: fac.totalStudents,
      erpValue: erpData.totalStudents,
      currentSource: fac.totalStudentsSource || 'manual',
      changed: fac.totalStudents !== erpData.totalStudents,
    },
    {
      fieldKey: 'activeStudents',
      label: 'Active Students',
      currentValue: fac.activeStudents,
      erpValue: erpData.activeStudents,
      currentSource: fac.activeStudentsSource || 'manual',
      changed: fac.activeStudents !== erpData.activeStudents,
    },
    {
      fieldKey: 'totalTeachers',
      label: 'Teachers / Faculty',
      currentValue: fac.totalTeachers,
      erpValue: erpData.totalTeachers,
      currentSource: fac.totalTeachersSource || 'manual',
      changed: fac.totalTeachers !== erpData.totalTeachers,
    },
    {
      fieldKey: 'totalNonTeachingStaff',
      label: 'Non-Teaching Staff',
      currentValue: currentNonTeaching,
      erpValue: erpData.totalNonTeachingStaff,
      currentSource: fac.totalNonTeachingStaffSource || fac.nonTeachingStaffSource || 'manual',
      changed: currentNonTeaching !== erpData.totalNonTeachingStaff,
    },
    {
      fieldKey: 'historicalStudents',
      label: 'Historical Students',
      currentValue: currentHistorical,
      erpValue: erpData.historicalStudents,
      currentSource: fac.historicalStudentsSource || 'manual',
      changed: currentHistorical !== erpData.historicalStudents,
    },
    {
      fieldKey: 'classroomsCount',
      label: 'Total Classrooms',
      currentValue: currentClassrooms,
      erpValue: erpData.classroomsCount,
      currentSource: fac.classroomsCountSource || 'manual',
      changed: currentClassrooms !== erpData.classroomsCount,
    },
  ];

  return fields;
}

/**
 * Apply ERP counts to facilitiesConfig and mark sources as 'erp' with timestamp.
 */
export function applyErpStatistics(
  currentFac: FacilitiesData | undefined,
  erpData: ErpCampusStatistics,
  selectedFields?: string[]
): FacilitiesData {
  const result: FacilitiesData = { ...(currentFac || {}) };
  const nowIso = erpData.fetchedAt || new Date().toISOString();

  const shouldApply = (field: string) => !selectedFields || selectedFields.includes(field);

  if (shouldApply('totalStudents')) {
    result.totalStudents = erpData.totalStudents;
    result.totalStudentsSource = 'erp';
    result.totalStudentsSyncedAt = nowIso;
  }

  if (shouldApply('activeStudents')) {
    result.activeStudents = erpData.activeStudents;
    result.activeStudentsSource = 'erp';
    result.activeStudentsSyncedAt = nowIso;
  }

  if (shouldApply('totalTeachers')) {
    result.totalTeachers = erpData.totalTeachers;
    result.totalTeachersSource = 'erp';
    result.totalTeachersSyncedAt = nowIso;
  }

  if (shouldApply('totalNonTeachingStaff')) {
    result.totalNonTeachingStaff = erpData.totalNonTeachingStaff;
    result.totalNonTeachingStaffSource = 'erp';
    result.totalNonTeachingStaffSyncedAt = nowIso;
    result.nonTeachingStaff = erpData.totalNonTeachingStaff;
    result.nonTeachingStaffSource = 'erp';
    result.nonTeachingStaffSyncedAt = nowIso;
  }

  if (shouldApply('historicalStudents')) {
    result.historicalStudents = erpData.historicalStudents;
    result.historicalStudentsSource = 'erp';
    result.historicalStudentsSyncedAt = nowIso;
    result.historicalPreDigitalStudents = erpData.historicalStudents;
  }

  if (shouldApply('classroomsCount')) {
    result.classroomsCount = erpData.classroomsCount;
    result.classroomsCountSource = 'erp';
    result.classroomsCountSyncedAt = nowIso;
    result.totalClassrooms = erpData.classroomsCount;
  }

  return result;
}

/**
 * Update a single metric when edited manually.
 * Reverts that field's source to 'manual' authoritatively.
 */
export function updateFieldManual(
  currentFac: FacilitiesData | undefined,
  fieldKey: string,
  value: number | undefined
): FacilitiesData {
  const updated: FacilitiesData = { ...(currentFac || {}) };

  switch (fieldKey) {
    case 'totalStudents':
      updated.totalStudents = value;
      updated.totalStudentsSource = 'manual';
      break;
    case 'activeStudents':
      updated.activeStudents = value;
      updated.activeStudentsSource = 'manual';
      break;
    case 'totalTeachers':
      updated.totalTeachers = value;
      updated.totalTeachersSource = 'manual';
      break;
    case 'totalNonTeachingStaff':
    case 'nonTeachingStaff':
      updated.totalNonTeachingStaff = value;
      updated.totalNonTeachingStaffSource = 'manual';
      updated.nonTeachingStaff = value;
      updated.nonTeachingStaffSource = 'manual';
      break;
    case 'historicalStudents':
    case 'historicalPreDigitalStudents':
      updated.historicalStudents = value;
      updated.historicalStudentsSource = 'manual';
      updated.historicalPreDigitalStudents = value;
      break;
    case 'classroomsCount':
    case 'totalClassrooms':
      updated.classroomsCount = value;
      updated.classroomsCountSource = 'manual';
      updated.totalClassrooms = value;
      break;
    default:
      (updated as any)[fieldKey] = value;
  }

  return updated;
}

/**
 * Validate a whole number institutional count:
 * - Whole numbers only
 * - No negative values
 * - No decimal values
 * - Empty strings / undefined allowed for optional fields
 * - Very large institutions supported
 */
export function validateWholeNumber(
  rawInput: string | number | undefined | null,
  fieldName?: string
): { isValid: boolean; value?: number; error?: string } {
  if (rawInput === undefined || rawInput === null || rawInput === '') {
    return { isValid: true, value: undefined };
  }

  const str = String(rawInput).trim();
  if (str === '') {
    return { isValid: true, value: undefined };
  }

  // Reject decimal points
  if (str.includes('.')) {
    return { isValid: false, error: 'Enter a valid whole number.' };
  }

  // Handle commas used as thousands separators
  const cleanStr = str.replace(/,/g, '');

  // Check for non-numeric characters (except leading + or -)
  if (!/^-?\d+$/.test(cleanStr)) {
    return { isValid: false, error: 'Enter a valid whole number.' };
  }

  const parsed = Number(cleanStr);

  if (isNaN(parsed) || !Number.isSafeInteger(parsed)) {
    return { isValid: false, error: 'Enter a valid whole number.' };
  }

  if (parsed < 0) {
    return { isValid: false, error: 'Enter a valid whole number.' };
  }

  return { isValid: true, value: parsed };
}

/**
 * Soft warning check for institutional relationships:
 * If activeStudents > totalStudents and both are positive.
 */
export function checkStudentsCountWarning(
  totalStudents: number | undefined,
  activeStudents: number | undefined
): string | null {
  if (
    totalStudents !== undefined &&
    activeStudents !== undefined &&
    totalStudents > 0 &&
    activeStudents > 0 &&
    activeStudents > totalStudents
  ) {
    return 'Active students cannot normally exceed total students. Please verify these values.';
  }
  return null;
}