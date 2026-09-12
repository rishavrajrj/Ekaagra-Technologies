/**
 * ==============================================================================
 * CROSS-SECTION DATA CONSISTENCY & CONFLICT DETECTION ENGINE
 * File: src/lib/dataConsistencyEngine.ts
 * ==============================================================================
 *
 * Core architectural principle:
 * Never silently guess or override contradictory onboarding data.
 * Detect multi-section contradictions across the database and surface them
 * explicitly to administrators as actionable blockers or warnings.
 */

import type { UniversalIntakeData } from './types';
import { isHostelApplicable } from './hostelUtils';

export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING';

export interface DataConflict {
  id: string;
  code: string;
  severity: ConflictSeverity;
  title: string;
  description: string;
  targetSection?: number;
  conflictingSections: string[];
  fieldA: { section: string; field: string; value: any; label: string };
  fieldB: { section: string; field: string; value: any; label: string };
  remediationAnchor: string;
  fixAction: string;
}

export interface ConsistencyValidationResult {
  isConsistent: boolean;
  hasConflicts: boolean;
  criticalConflictsCount: number;
  warningsCount: number;
  conflicts: DataConflict[];
}

/**
 * Validates cross-section integrity across the complete school intake state.
 */
export function validateCrossSectionConsistency(
  intakeData: Partial<UniversalIntakeData>
): ConsistencyValidationResult {
  const conflicts: DataConflict[] = [];

  const campuses = intakeData.campuses || [];
  const prof = intakeData.schoolProfile || ({} as any);
  const transport = intakeData.transportConfig || ({} as any);
  const hostel = intakeData.hostelConfig || ({} as any);
  const stats = (intakeData as any).campusStatistics || (intakeData as any).statistics || {};

  // 1. Campus Count vs Multi-Campus Flag
  const isMultiCampus = Boolean(prof.isMultiCampus);
  if (campuses.length > 1 && !isMultiCampus) {
    conflicts.push({
      id: 'conflict-multi-campus',
      code: 'CAMPUS_COUNT_CONFLICT',
      severity: 'CRITICAL',
      title: 'Campus Branching Flag Contradiction',
      description: `School profile specifies a single campus (isMultiCampus: false), but ${campuses.length} distinct campuses are defined.`,
      targetSection: 1,
      conflictingSections: ['schoolProfile', 'campuses'],
      fieldA: {
        section: 'schoolProfile',
        field: 'schoolProfile.isMultiCampus',
        value: isMultiCampus,
        label: 'Multiple Campuses Flag',
      },
      fieldB: {
        section: 'campuses',
        field: 'campuses.length',
        value: campuses.length,
        label: 'Configured Campus Count',
      },
      remediationAnchor: 'field-school-multicampus',
      fixAction: 'Toggle Multi-Campus or Consolidate Branches',
    });
  }

  // 2. Transport Conflict (Disabled vs Active Fleet/Routes)
  const isTransportDisabled = transport.status === 'no' || transport.enabled === false;
  const activeRoutes = Array.isArray(transport.routes) ? transport.routes.filter((r: any) => r.isActive !== false) : [];
  const activeBuses = Array.isArray(transport.fleet) ? transport.fleet.filter((f: any) => f.status === 'active' || !f.status) : [];
  if (isTransportDisabled && (activeRoutes.length > 0 || activeBuses.length > 0)) {
    conflicts.push({
      id: 'conflict-transport-records',
      code: 'TRANSPORT_ROUTE_CONTRADICTION',
      severity: 'HIGH',
      title: 'Transport Operation Contradiction',
      description: `Transportation is marked as Not Operated (status: 'no'), but ${activeRoutes.length} route(s) and ${activeBuses.length} bus(es) are configured.`,
      targetSection: 8,
      conflictingSections: ['transportConfig'],
      fieldA: {
        section: 'transportConfig',
        field: 'transportConfig.status',
        value: transport.status,
        label: 'Transport Operated Status',
      },
      fieldB: {
        section: 'transportConfig',
        field: 'transportConfig.routes',
        value: `${activeRoutes.length} routes, ${activeBuses.length} buses`,
        label: 'Active Fleet / Route Records',
      },
      remediationAnchor: 'field-transport-status',
      fixAction: 'Enable Transport or Clear Route Records',
    });
  }

  // 3. Hostel / Boarding Conflict (Day School vs Hostel Records)
  const hostelIsApplicable =
    isHostelApplicable(prof) ||
    prof.schoolType === 'boarding' ||
    prof.schoolType === 'residential' ||
    prof.residentialStatus === 'residential';
  const hostelBuildings = Array.isArray(hostel.buildings) ? hostel.buildings : [];
  if (!hostelIsApplicable && hostelBuildings.length > 0) {
    conflicts.push({
      id: 'conflict-hostel-records',
      code: 'HOSTEL_DAY_SCHOOL_CONTRADICTION',
      severity: 'HIGH',
      title: 'Residential Boarding Contradiction',
      description: `School is marked as Day-Scholar only, but ${hostelBuildings.length} hostel building(s) are configured in Residential facilities.`,
      targetSection: 9,
      conflictingSections: ['schoolProfile', 'hostelConfig'],
      fieldA: {
        section: 'schoolProfile',
        field: 'schoolProfile.schoolType',
        value: prof.schoolType || 'Day School',
        label: 'Institutional Boarding Type',
      },
      fieldB: {
        section: 'hostelConfig',
        field: 'hostelConfig.buildings',
        value: `${hostelBuildings.length} buildings`,
        label: 'Hostel Building Records',
      },
      remediationAnchor: 'field-hostel-status',
      fixAction: 'Set School Accommodation to Boarding or Remove Hostel Records',
    });
  }

  // 4. Student Count Contradiction (Campus Statistics vs Student Information)
  const statsStudentCount = Number(stats.totalStudents || stats.studentCount || 0);
  const studentsRoster = (intakeData as any).studentInformation?.students || intakeData.students || [];
  const studentsRosterCount = Array.isArray(studentsRoster) ? studentsRoster.length : 0;
  if (statsStudentCount > 0 && studentsRosterCount > 0 && Math.abs(statsStudentCount - studentsRosterCount) > 100) {
    conflicts.push({
      id: 'conflict-student-count',
      code: 'STUDENT_ENROLLMENT_DISCREPANCY',
      severity: 'MEDIUM',
      title: 'Student Enrollment Count Discrepancy',
      description: `Campus Statistics reports ${statsStudentCount} total enrolled students, while Student Information roster contains ${studentsRosterCount} records.`,
      targetSection: 13,
      conflictingSections: ['campusStatistics', 'studentInformation'],
      fieldA: {
        section: 'campusStatistics',
        field: 'campusStatistics.totalStudents',
        value: statsStudentCount,
        label: 'Reported Enrolled Students',
      },
      fieldB: {
        section: 'studentInformation',
        field: 'studentInformation.students',
        value: studentsRosterCount,
        label: 'Imported Student Roster Records',
      },
      remediationAnchor: 'field-campus-statistics-students',
      fixAction: 'Reconcile Total Student Enrollment Count',
    });
  }

  const criticalConflictsCount = conflicts.filter((c) => c.severity === 'CRITICAL' || c.severity === 'HIGH').length;
  const warningsCount = conflicts.filter((c) => c.severity === 'MEDIUM' || c.severity === 'WARNING').length;

  return {
    isConsistent: conflicts.length === 0,
    hasConflicts: conflicts.length > 0,
    criticalConflictsCount,
    warningsCount,
    conflicts,
  };
}
