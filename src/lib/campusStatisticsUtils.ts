/**
 * PRODUCTION-GRADE CAMPUS STATISTICS & INSTITUTIONAL METRICS ENGINE
 *
 * Derives canonical people-related statistics dynamically from:
 * 1. Student records & multi-session enrollments (Total Students, Active Students)
 * 2. Faculty & Staff records (Teaching Staff, Non-Teaching Staff)
 * 3. Academic session configuration & multi-campus filtering
 * 4. Pre-digital historical student fallback support
 *
 * Rules:
 * - "Total Students" = All-time unique students ever admitted + Pre-digital historical students.
 *   Never decreases upon graduation or withdrawal.
 * - "Active Students" = Enrolled and active in the selected academic session.
 * - "Teachers / Faculty" = Active staff in teaching roles.
 * - "Non-Teaching Staff" = Active staff in non-teaching roles.
 * - Zero duplicated manual state. Single source of truth.
 */

import type {
  UniversalIntakeData,
  Student,
  StudentStatus,
  StaffRecord,
} from './types';

export interface CampusStatisticsOptions {
  /** Target academic session (e.g. '2026-2027'). Defaults to canonical session from Section 7 */
  selectedSession?: string;
  /** Campus ID filter or 'all' for institution-wide aggregate */
  selectedCampusId?: string | 'all';
}

export interface DerivedCampusStatistics {
  /** Cumulative unique students ever admitted/registered */
  totalStudents: number;
  /** Active students enrolled in the target session */
  activeStudents: number;
  /** Currently active teaching faculty */
  totalTeachers: number;
  /** Currently active non-teaching staff */
  totalNonTeachingStaff: number;

  // Metadata & breakdown
  targetSession: string;
  campusId: string | 'all';
  uniqueDigitalStudents: number;
  historicalPreDigitalStudents: number;
  graduatedStudentsCount: number;
  withdrawnStudentsCount: number;
  inactiveStudentsCount: number;
  isHistoricalFallbackActive: boolean;
  hasStudentRecords: boolean;
  hasStaffRecords: boolean;
}

/**
 * Standard keywords identifying teaching faculty
 */
const TEACHING_DESIGNATION_KEYWORDS = [
  'teacher',
  'pgt',
  'tgt',
  'prt',
  'ntt',
  'faculty',
  'lecturer',
  'professor',
  'instructor',
  'educator',
  'headmistress',
  'headmaster',
  'principal',
  'vice principal',
  'academic coordinator',
  'tutor',
];

/**
 * Categorize whether a staff designation or department represents teaching faculty
 */
export function isTeachingRole(
  category?: string | null,
  designation?: string | null,
  department?: string | null,
  subjectsTaught?: string | null,
  classesTaught?: string | null
): boolean {
  if (category) {
    const cat = category.toLowerCase().trim();
    if (cat === 'teaching' || cat === 'faculty' || cat === 'academic') return true;
    if (cat === 'non_teaching' || cat === 'non-teaching' || cat === 'admin' || cat === 'support') return false;
  }

  // If subjects or classes are assigned, this is a teaching staff member
  if (subjectsTaught && subjectsTaught.trim().length > 0) return true;
  if (classesTaught && classesTaught.trim().length > 0) return true;

  const text = `${designation || ''} ${department || ''}`.toLowerCase();
  return TEACHING_DESIGNATION_KEYWORDS.some((kw) => text.includes(kw));
}

/**
 * Resolve canonical academic session from intake data
 */
export function resolveCanonicalSession(intakeData?: Partial<UniversalIntakeData> | null): string {
  if (!intakeData) return '2026-2027';
  const instSession = intakeData.institutionStructure?.currentAcademicSession;
  if (instSession && instSession.trim().length > 0) return instSession.trim();

  const admSession = intakeData.admissions?.session || intakeData.admissions?.targetSessions;
  if (admSession && admSession.trim().length > 0) return admSession.trim();

  return '2026-2027';
}

/**
 * Extract canonical unique student records from intake data
 */
export function extractCanonicalStudents(intakeData?: Partial<UniversalIntakeData> | null): Student[] {
  if (!intakeData) return [];
  const rootStudents = Array.isArray(intakeData.students) ? intakeData.students : [];
  const configStudents = Array.isArray(intakeData.studentConfig?.students) ? intakeData.studentConfig.students : [];

  const seenIds = new Set<string>();
  const merged: Student[] = [];

  for (const s of [...rootStudents, ...configStudents]) {
    if (!s) continue;
    const identifier = (s.admission_number || s.id || '').trim().toLowerCase();
    const key = identifier || `${s.first_name || ''}_${s.last_name || ''}_${s.dob || ''}`;
    if (!seenIds.has(key)) {
      seenIds.add(key);
      merged.push(s);
    }
  }

  return merged;
}

export interface GenericStaffMember {
  id?: string;
  name: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  category?: 'teaching' | 'non_teaching' | string;
  status?: string;
  campusId?: string;
  subjectsTaught?: string;
  classesTaught?: string;
}

/**
 * Extract canonical staff members from intake data
 */
export function extractCanonicalStaff(intakeData?: Partial<UniversalIntakeData> | null): GenericStaffMember[] {
  if (!intakeData) return [];
  const rosterStaff: GenericStaffMember[] = Array.isArray(intakeData.staffFaculty?.staffMembers)
    ? intakeData.staffFaculty.staffMembers
    : [];

  const dbStaff: GenericStaffMember[] = Array.isArray(intakeData.staffRecords)
    ? intakeData.staffRecords.map((s: StaffRecord) => ({
        id: s.id,
        name: `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Staff Member',
        employeeCode: s.employee_code,
        designation: s.designation || undefined,
        department: s.department || undefined,
        category: (s as any).category,
        status: s.status,
        campusId: (s as any).campus_id || undefined,
      }))
    : [];

  const seen = new Set<string>();
  const merged: GenericStaffMember[] = [];

  for (const st of [...rosterStaff, ...dbStaff]) {
    if (!st) continue;
    const key = (st.employeeCode || st.id || st.name || '').trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(st);
    }
  }

  return merged;
}

/**
 * Check if a student status is considered active/currently enrolled
 */
export function isStudentActive(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toLowerCase().trim();
  return s === 'active' || s === 'enrolled' || s === 'admitted';
}

/**
 * Check if a staff status is considered active
 */
export function isStaffActive(status?: string | null): boolean {
  if (!status) return true; // Default to active if omitted in draft
  const s = status.toLowerCase().trim();
  return s === 'active' || s === 'on_duty' || s === 'confirmed';
}

/**
 * Calculate dynamic campus statistics from canonical intake records
 */
export function calculateCampusStatistics(
  intakeData?: Partial<UniversalIntakeData> | null,
  options?: CampusStatisticsOptions
): DerivedCampusStatistics {
  const canonicalSession = resolveCanonicalSession(intakeData);
  const targetSession = (options?.selectedSession || canonicalSession).trim();
  const campusId = options?.selectedCampusId || 'all';

  const students = extractCanonicalStudents(intakeData);
  const staff = extractCanonicalStaff(intakeData);

  const facConfig = intakeData?.facilitiesConfig;
  const historicalPreDigital =
    facConfig?.historicalStudents !== undefined
      ? Math.max(0, Number(facConfig.historicalStudents))
      : facConfig?.historicalPreDigitalStudents !== undefined
      ? Math.max(0, Number(facConfig.historicalPreDigitalStudents))
      : 0;

  let uniqueDigitalStudents = 0;
  let activeStudents = 0;
  let graduatedStudentsCount = 0;
  let withdrawnStudentsCount = 0;
  let inactiveStudentsCount = 0;

  for (const student of students) {
    // Campus filter
    if (campusId !== 'all') {
      const studentCampus = student.campus_id || (student as any).campusId;
      if (studentCampus && studentCampus !== campusId) {
        continue;
      }
    }

    uniqueDigitalStudents++;

    const statusLower = (student.status || 'active').toLowerCase().trim();
    if (statusLower === 'graduated') graduatedStudentsCount++;
    else if (statusLower === 'withdrawn') withdrawnStudentsCount++;
    else if (statusLower === 'inactive' || statusLower === 'transferred' || statusLower === 'suspended') {
      inactiveStudentsCount++;
    }

    // Determine session-specific active enrollment
    let isActiveInTargetSession = false;

    if (Array.isArray(student.enrollments) && student.enrollments.length > 0) {
      const matchingEnrollment = student.enrollments.find((enr) => {
        const sessionMatch = (enr.session || '').trim().toLowerCase() === targetSession.toLowerCase();
        if (!sessionMatch) return false;
        if (campusId !== 'all' && enr.campus_id && enr.campus_id !== campusId) return false;
        return true;
      });

      if (matchingEnrollment) {
        isActiveInTargetSession = isStudentActive(matchingEnrollment.status);
      }
    } else {
      // Direct session matching
      const studentSession = (student.academic_session || (student as any).session || '').trim().toLowerCase();
      const matchesSession = !studentSession || studentSession === targetSession.toLowerCase();

      if (matchesSession && isStudentActive(student.status)) {
        isActiveInTargetSession = true;
      }
    }

    if (isActiveInTargetSession) {
      activeStudents++;
    }
  }

  // Handle staff calculations
  let totalTeachers = 0;
  let totalNonTeachingStaff = 0;

  for (const member of staff) {
    // Campus filter
    if (campusId !== 'all') {
      const staffCampus = member.campusId || (member as any).campus_id;
      if (staffCampus && staffCampus !== campusId) {
        continue;
      }
    }

    // Only count active personnel
    if (!isStaffActive(member.status)) {
      continue;
    }

    const isTeaching = isTeachingRole(
      member.category,
      member.designation,
      member.department,
      member.subjectsTaught,
      member.classesTaught
    );

    if (isTeaching) {
      totalTeachers++;
    } else {
      totalNonTeachingStaff++;
    }
  }

  // Fallback for manual entry or legacy drafts when NO digital records exist
  const hasDigitalStudents = students.length > 0;
  const hasDigitalStaff = staff.length > 0;
  const isHistoricalFallbackActive = historicalPreDigital > 0 || (!hasDigitalStudents && Boolean(facConfig?.totalStudents));

  let effectiveTotalStudents = historicalPreDigital + uniqueDigitalStudents;

  // Safe manual/fallback preservation if zero digital student records exist
  if (!hasDigitalStudents) {
    if (facConfig?.totalStudents !== undefined) {
      effectiveTotalStudents = Math.max(0, Number(facConfig.totalStudents));
    }
    if (facConfig?.activeStudents !== undefined) {
      activeStudents = Math.max(0, Number(facConfig.activeStudents));
    }
  }

  // Safe manual/fallback preservation if zero digital staff records exist
  if (!hasDigitalStaff) {
    if (facConfig?.totalTeachers !== undefined) {
      totalTeachers = Math.max(0, Number(facConfig.totalTeachers));
    }
    if (facConfig?.totalNonTeachingStaff !== undefined || facConfig?.nonTeachingStaff !== undefined) {
      totalNonTeachingStaff = Math.max(0, Number(facConfig.totalNonTeachingStaff ?? facConfig.nonTeachingStaff));
    }
  }

  return {
    totalStudents: effectiveTotalStudents,
    activeStudents,
    totalTeachers,
    totalNonTeachingStaff,
    targetSession,
    campusId,
    uniqueDigitalStudents,
    historicalPreDigitalStudents: historicalPreDigital,
    graduatedStudentsCount,
    withdrawnStudentsCount,
    inactiveStudentsCount,
    isHistoricalFallbackActive,
    hasStudentRecords: hasDigitalStudents,
    hasStaffRecords: hasDigitalStaff,
  };
}

/**
 * Synchronize statistics into intake facilitiesConfig payload without overwriting manual entries.
 * Manual entry is authoritative. Prevents breaking external consumers while respecting user edits.
 */
export function syncDerivedStatisticsToFacilities<T extends Partial<UniversalIntakeData>>(
  intakeData: T,
  options?: CampusStatisticsOptions
): T {
  if (!intakeData) return intakeData;
  const currentFac = intakeData.facilitiesConfig || {};
  const stats = calculateCampusStatistics(intakeData, options);

  const hasManualTotalStudents = currentFac.totalStudents !== undefined;
  const hasManualActiveStudents = currentFac.activeStudents !== undefined;
  const hasManualTotalTeachers = currentFac.totalTeachers !== undefined;
  const hasManualNonTeachingStaff =
    currentFac.totalNonTeachingStaff !== undefined || currentFac.nonTeachingStaff !== undefined;

  const effectiveTotalStudents = hasManualTotalStudents ? currentFac.totalStudents : stats.totalStudents;
  const effectiveActiveStudents = hasManualActiveStudents ? currentFac.activeStudents : stats.activeStudents;
  const effectiveTotalTeachers = hasManualTotalTeachers ? currentFac.totalTeachers : stats.totalTeachers;
  const effectiveNonTeaching = hasManualNonTeachingStaff
    ? (currentFac.totalNonTeachingStaff ?? currentFac.nonTeachingStaff)
    : stats.totalNonTeachingStaff;

  const historicalCount =
    currentFac.historicalStudents !== undefined
      ? currentFac.historicalStudents
      : currentFac.historicalPreDigitalStudents !== undefined
      ? currentFac.historicalPreDigitalStudents
      : (stats.historicalPreDigitalStudents > 0 ? stats.historicalPreDigitalStudents : undefined);

  const updatedFacilities = {
    ...currentFac,
    totalStudents: effectiveTotalStudents,
    activeStudents: effectiveActiveStudents,
    totalTeachers: effectiveTotalTeachers,
    totalNonTeachingStaff: effectiveNonTeaching,
    nonTeachingStaff: effectiveNonTeaching,
    classroomsCount: currentFac.classroomsCount,
    totalClassrooms: currentFac.totalClassrooms ?? currentFac.classroomsCount,
    historicalStudents: historicalCount,
    historicalPreDigitalStudents: historicalCount,
  };

  return {
    ...intakeData,
    facilitiesConfig: updatedFacilities,
  };
}
