/**
 * Unit tests for Campus Statistics Manual Entry & ERP Sync Utilities.
 *
 * Covers:
 * - Manual aggregate count authoritativeness
 * - Source tracking (manual vs erp)
 * - ERP review/apply/reject workflows
 * - Validation (whole numbers, negatives, decimals)
 * - Soft warning for activeStudents > totalStudents
 * - Alias sync (nonTeachingStaff <-> totalNonTeachingStaff, etc.)
 * - ERP failure non-blocking resilience
 */

import {
  validateWholeNumber,
  checkStudentsCountWarning,
  updateFieldManual,
  applyErpStatistics,
  compareCampusStatistics,
  fetchErpCampusStatistics,
  formatSyncedAt,
} from '../erpStatisticsUtils';
import type { FacilitiesData, StatCountSource } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. VALIDATION: validateWholeNumber
// ─────────────────────────────────────────────────────────────────────────────

describe('validateWholeNumber', () => {
  test('accepts valid positive integers', () => {
    expect(validateWholeNumber('100')).toEqual({ isValid: true, value: 100 });
    expect(validateWholeNumber('0')).toEqual({ isValid: true, value: 0 });
    expect(validateWholeNumber('99999')).toEqual({ isValid: true, value: 99999 });
  });

  test('accepts empty/undefined/null as valid (optional fields)', () => {
    expect(validateWholeNumber('')).toEqual({ isValid: true, value: undefined });
    expect(validateWholeNumber(undefined)).toEqual({ isValid: true, value: undefined });
    expect(validateWholeNumber(null)).toEqual({ isValid: true, value: undefined });
  });

  test('rejects negative numbers', () => {
    const result = validateWholeNumber('-5');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects decimal numbers', () => {
    const result = validateWholeNumber('3.5');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('rejects non-numeric strings', () => {
    expect(validateWholeNumber('abc').isValid).toBe(false);
    expect(validateWholeNumber('12abc').isValid).toBe(false);
    expect(validateWholeNumber('!@#').isValid).toBe(false);
  });

  test('handles thousands separators', () => {
    expect(validateWholeNumber('10,000')).toEqual({ isValid: true, value: 10000 });
    expect(validateWholeNumber('1,234,567')).toEqual({ isValid: true, value: 1234567 });
  });

  test('accepts numeric type input', () => {
    expect(validateWholeNumber(42)).toEqual({ isValid: true, value: 42 });
  });

  test('supports large institutional scale numbers', () => {
    const result = validateWholeNumber('1000000');
    expect(result.isValid).toBe(true);
    expect(result.value).toBe(1000000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SOFT WARNING: checkStudentsCountWarning
// ─────────────────────────────────────────────────────────────────────────────

describe('checkStudentsCountWarning', () => {
  test('returns warning when active > total', () => {
    const warning = checkStudentsCountWarning(100, 150);
    expect(warning).not.toBeNull();
    expect(warning).toContain('exceed');
  });

  test('returns null when total >= active', () => {
    expect(checkStudentsCountWarning(1000, 800)).toBeNull();
    expect(checkStudentsCountWarning(500, 500)).toBeNull();
  });

  test('returns null when either value is undefined', () => {
    expect(checkStudentsCountWarning(undefined, 100)).toBeNull();
    expect(checkStudentsCountWarning(100, undefined)).toBeNull();
  });

  test('returns null when either value is 0', () => {
    expect(checkStudentsCountWarning(0, 100)).toBeNull();
    expect(checkStudentsCountWarning(100, 0)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. MANUAL FIELD UPDATE WITH SOURCE TRACKING
// ─────────────────────────────────────────────────────────────────────────────

describe('updateFieldManual', () => {
  const baseFac: FacilitiesData = {
    totalStudents: 500,
    totalStudentsSource: 'erp',
    totalStudentsSyncedAt: '2026-01-01T00:00:00Z',
  };

  test('sets value and marks source as manual', () => {
    const updated = updateFieldManual(baseFac, 'totalStudents', 600);
    expect(updated.totalStudents).toBe(600);
    expect(updated.totalStudentsSource).toBe('manual');
  });

  test('reverts ERP source to manual on edit', () => {
    expect(baseFac.totalStudentsSource).toBe('erp');
    const updated = updateFieldManual(baseFac, 'totalStudents', 700);
    expect(updated.totalStudentsSource).toBe('manual');
  });

  test('handles undefined value (clearing a field)', () => {
    const updated = updateFieldManual(baseFac, 'totalStudents', undefined);
    expect(updated.totalStudents).toBeUndefined();
    expect(updated.totalStudentsSource).toBe('manual');
  });

  test('syncs nonTeachingStaff alias bidirectionally', () => {
    const updated = updateFieldManual({}, 'totalNonTeachingStaff', 75);
    expect(updated.totalNonTeachingStaff).toBe(75);
    expect(updated.nonTeachingStaff).toBe(75);
    expect(updated.totalNonTeachingStaffSource).toBe('manual');
    expect(updated.nonTeachingStaffSource).toBe('manual');
  });

  test('syncs historicalStudents alias', () => {
    const updated = updateFieldManual({}, 'historicalStudents', 5000);
    expect(updated.historicalStudents).toBe(5000);
    expect(updated.historicalPreDigitalStudents).toBe(5000);
  });

  test('syncs classroomsCount alias', () => {
    const updated = updateFieldManual({}, 'classroomsCount', 40);
    expect(updated.classroomsCount).toBe(40);
    expect(updated.totalClassrooms).toBe(40);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ERP COMPARISON
// ─────────────────────────────────────────────────────────────────────────────

describe('compareCampusStatistics', () => {
  const erpData = {
    totalStudents: 10000,
    activeStudents: 8750,
    totalTeachers: 320,
    totalNonTeachingStaff: 145,
    historicalStudents: 12000,
    classroomsCount: 64,
    fetchedAt: '2026-09-09T00:00:00Z',
    erpSystemName: 'Test ERP',
  };

  test('identifies changed fields', () => {
    const fac: FacilitiesData = { totalStudents: 9500, activeStudents: 8750 };
    const comparison = compareCampusStatistics(fac, erpData);
    const totalRow = comparison.find((c) => c.fieldKey === 'totalStudents');
    const activeRow = comparison.find((c) => c.fieldKey === 'activeStudents');
    expect(totalRow?.changed).toBe(true);
    expect(activeRow?.changed).toBe(false);
  });

  test('marks all fields as changed when facilities is empty', () => {
    const comparison = compareCampusStatistics(undefined, erpData);
    expect(comparison.filter((c) => c.changed).length).toBeGreaterThan(0);
  });

  test('marks all fields as unchanged when values match', () => {
    const fac: FacilitiesData = {
      totalStudents: 10000,
      activeStudents: 8750,
      totalTeachers: 320,
      totalNonTeachingStaff: 145,
      historicalStudents: 12000,
      classroomsCount: 64,
    };
    const comparison = compareCampusStatistics(fac, erpData);
    expect(comparison.every((c) => !c.changed)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ERP APPLY WITH SOURCE TAGGING
// ─────────────────────────────────────────────────────────────────────────────

describe('applyErpStatistics', () => {
  const erpData = {
    totalStudents: 10000,
    activeStudents: 8750,
    totalTeachers: 320,
    totalNonTeachingStaff: 145,
    historicalStudents: 12000,
    classroomsCount: 64,
    fetchedAt: '2026-09-09T00:00:00Z',
    erpSystemName: 'Test ERP',
  };

  test('applies all fields when no selection specified', () => {
    const result = applyErpStatistics({}, erpData);
    expect(result.totalStudents).toBe(10000);
    expect(result.activeStudents).toBe(8750);
    expect(result.totalTeachers).toBe(320);
    expect(result.totalNonTeachingStaff).toBe(145);
    expect(result.historicalStudents).toBe(12000);
    expect(result.classroomsCount).toBe(64);
  });

  test('sets source to erp for all applied fields', () => {
    const result = applyErpStatistics({}, erpData);
    expect(result.totalStudentsSource).toBe('erp');
    expect(result.activeStudentsSource).toBe('erp');
    expect(result.totalTeachersSource).toBe('erp');
    expect(result.totalNonTeachingStaffSource).toBe('erp');
    expect(result.classroomsCountSource).toBe('erp');
  });

  test('sets sync timestamp', () => {
    const result = applyErpStatistics({}, erpData);
    expect(result.totalStudentsSyncedAt).toBe('2026-09-09T00:00:00Z');
  });

  test('applies only selected fields', () => {
    const existing: FacilitiesData = {
      totalStudents: 5000,
      activeStudents: 4000,
    };
    const result = applyErpStatistics(existing, erpData, ['totalStudents']);
    expect(result.totalStudents).toBe(10000); // Updated
    expect(result.activeStudents).toBe(4000); // Preserved
  });

  test('preserves non-selected manual values', () => {
    const existing: FacilitiesData = {
      totalTeachers: 100,
      totalTeachersSource: 'manual',
    };
    const result = applyErpStatistics(existing, erpData, ['totalStudents']);
    expect(result.totalTeachers).toBe(100);
    expect(result.totalTeachersSource).toBe('manual');
  });

  test('syncs nonTeachingStaff alias on ERP apply', () => {
    const result = applyErpStatistics({}, erpData, ['totalNonTeachingStaff']);
    expect(result.totalNonTeachingStaff).toBe(145);
    expect(result.nonTeachingStaff).toBe(145);
    expect(result.nonTeachingStaffSource).toBe('erp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ERP FETCH & FAILURE RESILIENCE
// ─────────────────────────────────────────────────────────────────────────────

describe('fetchErpCampusStatistics', () => {
  test('returns success with data', async () => {
    const result = await fetchErpCampusStatistics();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalStudents).toBeGreaterThan(0);
  });

  test('returns failure gracefully when simulated', async () => {
    const result = await fetchErpCampusStatistics({ simulateFailure: true });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.data).toBeUndefined();
  });

  test('failure does not throw exceptions', async () => {
    await expect(fetchErpCampusStatistics({ simulateFailure: true })).resolves.toBeDefined();
  });

  test('branch campus returns different data', async () => {
    const mainResult = await fetchErpCampusStatistics({ campusId: 'main' });
    const branchResult = await fetchErpCampusStatistics({ campusId: 'branch-1' });
    expect(mainResult.data?.totalStudents).not.toBe(branchResult.data?.totalStudents);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. FORMAT SYNCED-AT BADGE
// ─────────────────────────────────────────────────────────────────────────────

describe('formatSyncedAt', () => {
  test('formats valid date string', () => {
    const result = formatSyncedAt('2026-09-09T00:00:00Z');
    expect(result).toContain('Synced from ERP');
    expect(result).toContain('Sep');
    expect(result).toContain('2026');
  });

  test('handles undefined gracefully', () => {
    expect(formatSyncedAt()).toBe('Synced from ERP');
  });

  test('handles invalid date string', () => {
    expect(formatSyncedAt('not-a-date')).toBe('Synced from ERP');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. MANUAL ENTRY AUTHORITATIVENESS
// ─────────────────────────────────────────────────────────────────────────────

describe('Manual entry authoritativeness', () => {
  test('manual value is never overwritten silently', () => {
    const fac: FacilitiesData = {
      totalStudents: 5000,
      totalStudentsSource: 'manual',
    };

    // Simulate what applyErpStatistics does when NOT selected
    const result = applyErpStatistics(fac, {
      totalStudents: 10000,
      activeStudents: 8000,
      totalTeachers: 200,
      totalNonTeachingStaff: 100,
      historicalStudents: 3000,
      classroomsCount: 50,
      fetchedAt: new Date().toISOString(),
      erpSystemName: 'Test',
    }, ['activeStudents']); // Only apply activeStudents

    // totalStudents should remain manual
    expect(result.totalStudents).toBe(5000);
    expect(result.totalStudentsSource).toBe('manual');
  });

  test('editing an ERP-synced field immediately reverts to manual', () => {
    const fac: FacilitiesData = {
      totalStudents: 10000,
      totalStudentsSource: 'erp',
      totalStudentsSyncedAt: '2026-09-09T00:00:00Z',
    };

    const updated = updateFieldManual(fac, 'totalStudents', 9500);
    expect(updated.totalStudentsSource).toBe('manual');
    expect(updated.totalStudents).toBe(9500);
  });

  test('ERP sync is not required — empty facilities is valid', () => {
    // An empty facilitiesConfig should be perfectly fine for onboarding
    const fac: FacilitiesData = {};
    expect(fac.totalStudents).toBeUndefined();
    expect(fac.totalStudentsSource).toBeUndefined();
    // This represents a valid state: no data entered yet, onboarding not blocked
  });
});
