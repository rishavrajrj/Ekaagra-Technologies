/**
 * CANONICAL FACULTY & STAFF DIRECTORY ENGINE
 *
 * Provides:
 * 1. Default suggested faculty templates & catalogs (departments, designations, standard CBSE/ICSE staff roster).
 * 2. Stable ID generator with institutional numbering compliance (e.g. FAC-2026-00012).
 * 3. Normalization & safe legacy migration (preserves existing drafts, deduplicates IDs).
 * 4. High-performance lookup & search helpers (by Name, ID, Department, Designation, Specialization).
 * 5. Lifecycle status tracking (Active, Inactive, On Leave, Terminated).
 */

import type {
  StaffFacultyConfigData,
  StaffMember,
  InstitutionalIdNumberingConfig,
} from './types';
import {
  formatInstitutionalId,
  deriveEntityFormatPattern,
  normalizeInstitutionalIdConfig,
  resolveAcademicYear,
} from './institutionalIdNumbering';

// ─── CANONICAL REFERENCE CATALOGS ─────────────────────────────────────────────

export const DEFAULT_FACULTY_DEPARTMENTS = [
  'Mathematics',
  'Science',
  'Languages',
  'Social Studies',
  'Commerce',
  'Computer Science & IT',
  'Arts & Music',
  'Physical Education',
  'Pre-Primary / Foundational',
  'Administration',
] as const;

export const DEFAULT_FACULTY_DESIGNATIONS = [
  'PGT (Post Graduate Teacher)',
  'TGT (Trained Graduate Teacher)',
  'PRT (Primary Teacher)',
  'NTT (Nursery Teacher)',
  'Head of Department (HoD)',
  'Senior Teacher',
  'Lecturer',
  'Physical Education Teacher (PET)',
  'Computer Instructor',
  'Art & Craft Teacher',
  'Music & Dance Teacher',
  'Special Educator',
  'Librarian',
  'Lab Assistant',
] as const;

export const DEFAULT_EMPLOYMENT_STATUSES = [
  { value: 'active', label: 'Active', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'on_leave', label: 'On Leave', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'inactive', label: 'Inactive', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'terminated', label: 'Terminated', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'archived', label: 'Archived', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
] as const;

// ─── STANDARD PRESET TEMPLATES ────────────────────────────────────────────────

export const STANDARD_CBSE_FACULTY_TEMPLATE: StaffMember[] = [
  {
    id: 'fac_tpl_001',
    name: 'Rahul Sharma',
    employeeCode: 'FAC-2026-00012',
    facultyId: 'FAC-2026-00012',
    designation: 'PGT (Post Graduate Teacher)',
    department: 'Mathematics',
    specialization: 'Mathematics & Statistics',
    qualification: 'M.Sc. Mathematics, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 10,
    email: 'rahul.sharma@school.edu.in',
    phone: '+91 98765 43210',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_002',
    name: 'Priya Kumari',
    employeeCode: 'FAC-2026-00018',
    facultyId: 'FAC-2026-00018',
    designation: 'TGT (Trained Graduate Teacher)',
    department: 'Languages',
    specialization: 'English Literature',
    qualification: 'M.A. English, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 7,
    email: 'priya.kumari@school.edu.in',
    phone: '+91 98765 43211',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_003',
    name: 'Amit Kumar',
    employeeCode: 'FAC-2026-00023',
    facultyId: 'FAC-2026-00023',
    designation: 'PGT (Post Graduate Teacher)',
    department: 'Science',
    specialization: 'Physics & Applied Mechanics',
    qualification: 'M.Sc. Physics, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 12,
    email: 'amit.kumar@school.edu.in',
    phone: '+91 98765 43212',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_004',
    name: 'Sunita Rao',
    employeeCode: 'FAC-2026-00029',
    facultyId: 'FAC-2026-00029',
    designation: 'TGT (Trained Graduate Teacher)',
    department: 'Social Studies',
    specialization: 'History & Civics',
    qualification: 'M.A. History, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 8,
    email: 'sunita.rao@school.edu.in',
    phone: '+91 98765 43213',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_005',
    name: 'Dr. Anita Desai',
    employeeCode: 'FAC-2026-00035',
    facultyId: 'FAC-2026-00035',
    designation: 'Head of Department (HoD)',
    department: 'Science',
    specialization: 'Chemistry & Biochemistry',
    qualification: 'Ph.D. Chemistry, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 15,
    email: 'anita.desai@school.edu.in',
    phone: '+91 98765 43214',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_006',
    name: 'Neha Verma',
    employeeCode: 'FAC-2026-00041',
    facultyId: 'FAC-2026-00041',
    designation: 'PRT (Primary Teacher)',
    department: 'Languages',
    specialization: 'Hindi Literature & Grammar',
    qualification: 'M.A. Hindi, D.El.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 5,
    email: 'neha.verma@school.edu.in',
    phone: '+91 98765 43215',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_007',
    name: 'Vikram Singh',
    employeeCode: 'FAC-2026-00048',
    facultyId: 'FAC-2026-00048',
    designation: 'Physical Education Teacher (PET)',
    department: 'Physical Education',
    specialization: 'Cricket, Football & Track',
    qualification: 'M.P.Ed. (Physical Education)',
    category: 'teaching',
    status: 'active',
    experienceYears: 6,
    email: 'vikram.singh@school.edu.in',
    phone: '+91 98765 43216',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_008',
    name: 'Rajesh Kulkarni',
    employeeCode: 'FAC-2026-00054',
    facultyId: 'FAC-2026-00054',
    designation: 'PGT (Post Graduate Teacher)',
    department: 'Computer Science & IT',
    specialization: 'Informatics Practices & Python',
    qualification: 'MCA, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 9,
    email: 'rajesh.kulkarni@school.edu.in',
    phone: '+91 98765 43217',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_009',
    name: 'Meenakshi Iyer',
    employeeCode: 'FAC-2026-00062',
    facultyId: 'FAC-2026-00062',
    designation: 'PGT (Post Graduate Teacher)',
    department: 'Science',
    specialization: 'Biology & Environmental Science',
    qualification: 'M.Sc. Zoology, B.Ed.',
    category: 'teaching',
    status: 'active',
    experienceYears: 11,
    email: 'meenakshi.iyer@school.edu.in',
    phone: '+91 98765 43218',
    displayOnWebsite: true,
  },
  {
    id: 'fac_tpl_010',
    name: 'Kavita Joshi',
    employeeCode: 'FAC-2026-00070',
    facultyId: 'FAC-2026-00070',
    designation: 'NTT (Nursery Teacher)',
    department: 'Pre-Primary / Foundational',
    specialization: 'Early Childhood Education & Phonics',
    qualification: 'B.A., NTT Diploma',
    category: 'teaching',
    status: 'active',
    experienceYears: 4,
    email: 'kavita.joshi@school.edu.in',
    phone: '+91 98765 43219',
    displayOnWebsite: true,
  },
];

// ─── ID GENERATION ENGINE ───────────────────────────────────────────────────

/**
 * Generate unique internal ID for a faculty member.
 */
export function generateFacultyInternalId(): string {
  const rand = Math.random().toString(36).substring(2, 8);
  return `fac_${Date.now().toString(36)}_${rand}`;
}

/**
 * Generate sequential institutional Faculty ID (e.g. FAC-2026-00012).
 */
export function generateNextFacultyId(params: {
  existingMembers?: StaffMember[];
  idConfig?: InstitutionalIdNumberingConfig;
  legacyFormat?: string;
  sessionYear?: string | number;
}): string {
  const { existingMembers = [], idConfig, legacyFormat, sessionYear } = params;
  const year = resolveAcademicYear(sessionYear);

  // Normalize ID configuration pattern
  const normalizedConfig = normalizeInstitutionalIdConfig(idConfig, legacyFormat);
  const pattern = deriveEntityFormatPattern(normalizedConfig, 'faculty');

  // Determine next sequential number
  let maxSeq = existingMembers.length;
  for (const m of existingMembers) {
    const code = m.employeeCode || m.facultyId || '';
    const match = code.match(/(\d{3,5})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxSeq) maxSeq = num;
    }
  }

  const nextSeq = maxSeq + 1;
  return formatInstitutionalId({
    pattern,
    role: 'faculty',
    sequence: nextSeq,
    year,
    prefixStyle: 'long',
  });
}

// ─── NORMALIZATION ENGINE ───────────────────────────────────────────────────

/**
 * Normalize Staff & Faculty configuration data ensuring stable IDs and clean types.
 */
export function normalizeStaffFacultyData(
  raw?: Partial<StaffFacultyConfigData> | null,
  context?: {
    sessionYear?: string | number;
  }
): StaffFacultyConfigData {
  const data = raw || {};
  const year = resolveAcademicYear(context?.sessionYear);

  const rawMembers = Array.isArray(data.staffMembers) ? data.staffMembers : [];
  const seenIds = new Set<string>();
  const seenCodes = new Set<string>();
  const normalizedMembers: StaffMember[] = [];

  for (let i = 0; i < rawMembers.length; i++) {
    const item = rawMembers[i];
    if (!item || typeof item !== 'object') continue;

    const name = (item.name || '').trim();
    if (!name) continue;

    let id = item.id && item.id.trim() ? item.id.trim() : '';
    if (!id || seenIds.has(id)) {
      id = generateFacultyInternalId();
    }
    seenIds.add(id);

    let employeeCode = (item.employeeCode || item.facultyId || '').trim();
    if (!employeeCode || seenCodes.has(employeeCode.toUpperCase())) {
      employeeCode = generateNextFacultyId({
        existingMembers: normalizedMembers,
        idConfig: data.institutionalIdNumbering,
        legacyFormat: data.staffIdFormat,
        sessionYear: year,
      });
    }
    seenCodes.add(employeeCode.toUpperCase());

    const status = (item.status || 'active').trim().toLowerCase();
    const normalizedStatus = ['active', 'inactive', 'on_leave', 'terminated', 'archived'].includes(status)
      ? (status as StaffMember['status'])
      : 'active';

    const category = (item.category || 'teaching').trim().toLowerCase();
    const normalizedCategory = ['teaching', 'non_teaching'].includes(category)
      ? (category as StaffMember['category'])
      : 'teaching';

    normalizedMembers.push({
      ...item,
      id,
      name,
      firstName: item.firstName ? item.firstName.trim() : undefined,
      lastName: item.lastName ? item.lastName.trim() : undefined,
      employeeCode,
      facultyId: employeeCode,
      designation: (item.designation || 'Teacher').trim(),
      department: item.department ? item.department.trim() : undefined,
      category: normalizedCategory,
      status: normalizedStatus,
      campusId: item.campusId ? item.campusId.trim() : undefined,
      qualification: item.qualification ? item.qualification.trim() : undefined,
      specialization: item.specialization ? item.specialization.trim() : undefined,
      experienceYears: typeof item.experienceYears === 'number' ? item.experienceYears : undefined,
      joiningDate: item.joiningDate ? item.joiningDate.trim() : undefined,
      email: item.email ? item.email.trim().toLowerCase() : undefined,
      phone: item.phone ? item.phone.trim() : undefined,
      bio: item.bio ? item.bio.trim() : undefined,
      photoUrl: item.photoUrl ? item.photoUrl.trim() : undefined,
      websiteProfile: item.websiteProfile,
      archivedAt: item.archivedAt,
      archivedReason: item.archivedReason,
      subjectsTaught: item.subjectsTaught ? item.subjectsTaught.trim() : undefined,
      classesTaught: item.classesTaught ? item.classesTaught.trim() : undefined,
      displayOnWebsite: item.displayOnWebsite !== false,
      displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : i + 1,
    });
  }

  // Calculate realistic counts if unspecified
  const teachingCount = normalizedMembers.filter((m) => m.category === 'teaching').length;
  const nonTeachingCount = normalizedMembers.filter((m) => m.category === 'non_teaching').length;
  const totalCount = normalizedMembers.length;

  return {
    ...data,
    bulkImportMode: Boolean(data.bulkImportMode),
    estimatedTotalStaff: data.estimatedTotalStaff || Math.max(totalCount, 40),
    teachingStaffCount: data.teachingStaffCount || teachingCount,
    nonTeachingStaffCount: data.nonTeachingStaffCount || nonTeachingCount,
    departments: Array.isArray(data.departments) && data.departments.length > 0
      ? data.departments
      : Array.from(DEFAULT_FACULTY_DEPARTMENTS),
    staffCategories: Array.isArray(data.staffCategories) && data.staffCategories.length > 0
      ? data.staffCategories
      : ['PGT Teacher', 'TGT Teacher', 'PRT Teacher', 'NTT Teacher', 'Lab Assistant', 'Librarian', 'Administrative Staff'],
    staffIdFormat: data.staffIdFormat || 'FAC-{{YEAR}}-{{NUM}}',
    employeeIdFormat: data.employeeIdFormat || 'STF-{{NUM}}',
    institutionalIdNumbering: data.institutionalIdNumbering || {
      mode: 'PRESET',
      presetId: 'YEAR_NUMBER_5_HYPHEN',
    },
    staffAttendanceRequirement: data.staffAttendanceRequirement || 'Biometric punch in/out with daily shift logging.',
    isStaffDirectoryRequired: data.isStaffDirectoryRequired !== false,
    isStaffProfilesPublic: data.isStaffProfilesPublic !== false,
    staffMembers: normalizedMembers,
  };
}

// ─── QUERY & SEARCH ENGINE ───────────────────────────────────────────────────

/**
 * Retrieve a faculty member by ID or Employee Code.
 */
export function getFacultyById(
  idOrCode: string | undefined | null,
  staffMembers?: StaffMember[] | null
): StaffMember | undefined {
  if (!idOrCode || !staffMembers || staffMembers.length === 0) return undefined;
  const query = idOrCode.trim().toLowerCase();

  return staffMembers.find((s) => {
    if (s.id && s.id.toLowerCase() === query) return true;
    if (s.employeeCode && s.employeeCode.toLowerCase() === query) return true;
    if (s.facultyId && s.facultyId.toLowerCase() === query) return true;
    return false;
  });
}

/**
 * Check if a faculty member is active and available for teaching.
 */
export function isFacultyActive(member?: StaffMember | null): boolean {
  if (!member) return false;
  return member.status === 'active' || member.status === undefined;
}

/**
 * Filter only active faculty members.
 */
export function getActiveFacultyMembers(staffMembers?: StaffMember[] | null): StaffMember[] {
  if (!Array.isArray(staffMembers)) return [];
  return staffMembers.filter((m) => isFacultyActive(m));
}

/**
 * Filter faculty members that should appear on the public school website.
 * Must not be archived or terminated, and must have showOnWebsite set to true.
 * Ordered by featured status (featured first), then by displayOrder, then alphabetically by name.
 */
export function getWebsiteFacultyMembers(staffMembers?: StaffMember[] | null): StaffMember[] {
  if (!Array.isArray(staffMembers)) return [];
  return staffMembers
    .filter((m) => {
      const status = (m.status || 'active').toLowerCase();
      if (status === 'archived' || status === 'terminated') return false;
      return Boolean(m.websiteProfile?.showOnWebsite ?? m.displayOnWebsite ?? false);
    })
    .sort((a, b) => {
      const aFeatured = a.websiteProfile?.featured ? 1 : 0;
      const bFeatured = b.websiteProfile?.featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      const aOrder = a.websiteProfile?.displayOrder ?? 999;
      const bOrder = b.websiteProfile?.displayOrder ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.name || '').localeCompare(b.name || '');
    });
}

/**
 * Fast multi-attribute faculty search.
 */
export function searchFaculty(
  query: string,
  staffMembers?: StaffMember[] | null,
  options?: {
    onlyActive?: boolean;
    onlyTeaching?: boolean;
    department?: string;
  }
): StaffMember[] {
  if (!Array.isArray(staffMembers)) return [];

  let pool = staffMembers;

  if (options?.onlyActive) {
    pool = pool.filter((m) => isFacultyActive(m));
  }

  if (options?.onlyTeaching) {
    pool = pool.filter((m) => m.category === 'teaching');
  }

  if (options?.department && options.department !== 'all') {
    const deptFilter = options.department.toLowerCase();
    pool = pool.filter((m) => (m.department || '').toLowerCase() === deptFilter);
  }

  const cleanQuery = (query || '').trim().toLowerCase();
  if (!cleanQuery) return pool;

  return pool.filter((m) => {
    if (m.name.toLowerCase().includes(cleanQuery)) return true;
    if (m.employeeCode && m.employeeCode.toLowerCase().includes(cleanQuery)) return true;
    if (m.facultyId && m.facultyId.toLowerCase().includes(cleanQuery)) return true;
    if (m.department && m.department.toLowerCase().includes(cleanQuery)) return true;
    if (m.designation && m.designation.toLowerCase().includes(cleanQuery)) return true;
    if (m.specialization && m.specialization.toLowerCase().includes(cleanQuery)) return true;
    return false;
  });
}

/**
 * Format a faculty member for consistent UI display in selectors and tables.
 */
export function formatFacultyDisplay(member?: StaffMember | null): {
  primaryName: string;
  code: string;
  secondaryMeta: string;
  isActive: boolean;
  statusLabel: string;
} {
  if (!member) {
    return {
      primaryName: 'Unassigned',
      code: '',
      secondaryMeta: 'No teacher selected',
      isActive: false,
      statusLabel: 'Unassigned',
    };
  }

  const code = member.employeeCode || member.facultyId || member.id;
  const parts: string[] = [];
  if (member.department) parts.push(member.department);
  if (member.designation) parts.push(member.designation);
  if (member.specialization && member.specialization !== member.department) {
    parts.push(member.specialization);
  }

  const active = isFacultyActive(member);
  const statusLabel =
    member.status === 'on_leave'
      ? 'On Leave'
      : member.status === 'inactive'
      ? 'Inactive'
      : member.status === 'terminated'
      ? 'Terminated'
      : 'Active';

  return {
    primaryName: member.name,
    code,
    secondaryMeta: parts.join(' • ') || 'Faculty Member',
    isActive: active,
    statusLabel,
  };
}
