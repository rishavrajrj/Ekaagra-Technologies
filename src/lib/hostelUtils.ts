/**
 * ==============================================================================
 * PRODUCTION HOSTEL & RESIDENTIAL BOARDING UTILITIES (SECTION 15)
 * File: src/lib/hostelUtils.ts
 * ==============================================================================
 *
 * Provides:
 * 1. Canonical applicability resolution (isHostelApplicable).
 * 2. Option catalogs with human-readable labels, badges, and descriptions.
 * 3. Normalization & safe legacy migration (preserving historical drafts & buildings).
 * 4. Dynamic capacity calculation (derived from rooms, beds, and active assignments).
 * 5. Multi-tenant validation engine (preventing over-capacity & duplicate identifiers).
 * 6. Conditional completion scoring (reflecting true active requirements).
 * 7. Safe domain operations (student assignment, transfer, leave, attendance).
 * 8. Dynamic summary generation for onboarding cards and preview pills.
 */

import type {
  HostelData,
  HostelBuilding,
  HostelRoom,
  HostelBed,
  ResidentialStudentAssignment,
  HostelAttendanceRecord,
  ResidentialLeaveRecord,
  HostelCurfewPolicy,
  HostelMessConfig,
  HostelSafetyEmergencyConfig,
  ResidentialModel,
  GenderAccommodationModel,
  ResidentialStudentEligibility,
  HostelBuildingGender,
  HostelBuildingStatus,
  HostelRoomCategory,
  ResidentialAssignmentStatus,
  HostelAttendanceStatus,
  ResidentialLeaveStatus,
} from './types';

// ─── CANONICAL APPLICABILITY RESOLUTION ─────────────────────────────────────────

/**
 * Determines whether Hostel & Residential Boarding is applicable based on
 * the canonical institutional profile.
 *
 * Rules:
 * - DAY SCHOOL ('day_school') -> NOT APPLICABLE
 * - DAY BOARDING ('day_boarding') -> NOT APPLICABLE (unless configured as residential)
 * - RESIDENTIAL / BOARDING ('residential') -> APPLICABLE
 * - DAY + RESIDENTIAL ('both_day_and_residential') -> APPLICABLE
 */
export function isHostelApplicable(schoolProfile?: { residentialStatus?: string } | null): boolean {
  if (!schoolProfile || !schoolProfile.residentialStatus) return false;
  const status = schoolProfile.residentialStatus.trim().toLowerCase();
  return status === 'residential' || status === 'both_day_and_residential';
}

// ─── OPTION CATALOGS ──────────────────────────────────────────────────────────

export interface OptionItem<T extends string> {
  value: T;
  label: string;
  badge: string;
  description: string;
  iconName?: string;
}

export const RESIDENTIAL_MODEL_OPTIONS: OptionItem<ResidentialModel>[] = [
  {
    value: 'school_operated',
    label: 'School-Operated Hostel',
    badge: 'Campus Run',
    description: 'Institutionally owned and managed residential hostels on campus grounds.',
    iconName: 'Building2',
  },
  {
    value: 'managed_facility',
    label: 'Managed Residential Facility',
    badge: 'Managed Partner',
    description: 'Professional residential management partner operating facilities under school oversight.',
    iconName: 'ShieldCheck',
  },
  {
    value: 'third_party',
    label: 'Third-Party Residential Facility',
    badge: 'Affiliated Housing',
    description: 'Designated external private hostel partner with verified school transit and caretaking.',
    iconName: 'Home',
  },
  {
    value: 'mixed',
    label: 'Mixed Residential Model',
    badge: 'Hybrid Model',
    description: 'Combination of school-operated wings alongside partner residential arrangements.',
    iconName: 'Layers',
  },
];

export const GENDER_ACCOMMODATION_OPTIONS: OptionItem<GenderAccommodationModel>[] = [
  {
    value: 'separate_wings',
    label: 'Separate Boys & Girls Hostels / Wings',
    badge: 'Segregated Wings',
    description: 'Independent residential blocks or wings with dedicated warden desks and security perimeters.',
    iconName: 'Users',
  },
  {
    value: 'boys_only',
    label: 'Boys Hostel Only',
    badge: 'Boys Campus',
    description: 'Exclusively boys boarding facilities with male wardens and pastoral care staff.',
    iconName: 'Users',
  },
  {
    value: 'girls_only',
    label: 'Girls Hostel Only',
    badge: 'Girls Campus',
    description: 'Exclusively girls boarding facilities with female wardens, matrons, and 24/7 security.',
    iconName: 'Users',
  },
  {
    value: 'co_educational',
    label: 'Co-Educational Residential Facility',
    badge: 'Co-Ed Complex',
    description: 'Single co-educational complex with strictly segregated floors, stairwells, and access controls.',
    iconName: 'Building2',
  },
];

export const STUDENT_ELIGIBILITY_OPTIONS: OptionItem<ResidentialStudentEligibility>[] = [
  {
    value: 'all_classes',
    label: 'All Enrolled Grades (Classes 1–12)',
    badge: 'Grades 1–12',
    description: 'Boarding available for all age groups from primary through senior secondary.',
  },
  {
    value: 'grade_6_above',
    label: 'Middle & Senior School (Classes 6–12)',
    badge: 'Grades 6–12',
    description: 'Boarding admissions open from Class 6 onwards with specialized pastoral supervision.',
  },
  {
    value: 'middle_and_secondary',
    label: 'Secondary & Senior (Classes 9–12)',
    badge: 'Grades 9–12',
    description: 'Dedicated boarding for board exam preparation, study schedules, and academic mentoring.',
  },
  {
    value: 'senior_secondary_only',
    label: 'Senior Secondary Only (Classes 11–12)',
    badge: 'Grades 11–12',
    description: 'Specialized competitive prep & residential senior secondary boarding program.',
  },
  {
    value: 'custom',
    label: 'Custom Eligibility Criteria',
    badge: 'Institutional Discretion',
    description: 'Eligibility evaluated on admission interview, distance from home, or parent request.',
  },
];

export const ROOM_CATEGORY_OPTIONS: OptionItem<HostelRoomCategory>[] = [
  {
    value: 'single',
    label: 'Single Room (1 Bed)',
    badge: '1 Bed',
    description: 'Private single occupancy room with dedicated study desk and wardrobe.',
  },
  {
    value: 'double',
    label: 'Double Sharing (2 Beds)',
    badge: '2 Beds',
    description: 'Twin-sharing room with individual study tables and storage lockers.',
  },
  {
    value: 'triple',
    label: 'Triple Sharing (3 Beds)',
    badge: '3 Beds',
    description: 'Three-bed room optimized for peer camaraderie and shared living.',
  },
  {
    value: 'four_bed',
    label: 'Four-Bed Dorm Room (4 Beds)',
    badge: '4 Beds',
    description: 'Quad-sharing dormitory room with partitioned bed areas and lockers.',
  },
  {
    value: 'dormitory',
    label: 'Dormitory Hall (6–12 Beds)',
    badge: '6–12 Beds',
    description: 'Large community dormitory hall with central ventilation and supervisor presence.',
  },
  {
    value: 'custom',
    label: 'Custom Room Category',
    badge: 'Custom',
    description: 'Institutionally customized room format or suite arrangement.',
  },
];

export const RESIDENTIAL_STATUS_OPTIONS: OptionItem<ResidentialAssignmentStatus>[] = [
  {
    value: 'active_resident',
    label: 'Active Resident',
    badge: 'On Campus',
    description: 'Currently resident and actively occupying assigned bed in hostel.',
  },
  {
    value: 'on_leave',
    label: 'On Approved Leave',
    badge: 'On Leave',
    description: 'Temporarily away from campus on approved out-pass, medical leave, or vacation.',
  },
  {
    value: 'temporarily_away',
    label: 'Temporarily Away',
    badge: 'Out-Pass',
    description: 'Approved daily out-pass for coaching, authorized visit, or school tournament.',
  },
  {
    value: 'checked_out',
    label: 'Checked Out',
    badge: 'Vacated',
    description: 'Formally vacated room and returned room keys at conclusion of academic term.',
  },
  {
    value: 'withdrawn',
    label: 'Withdrawn',
    badge: 'Withdrawn',
    description: 'Boarding admission withdrawn or transitioned to day scholar status.',
  },
];

export const HOSTEL_ATTENDANCE_STATUS_OPTIONS: OptionItem<HostelAttendanceStatus>[] = [
  {
    value: 'present',
    label: 'Present in Room',
    badge: 'Present',
    description: 'Present during nightly roll call and accounted for in dormitory.',
  },
  {
    value: 'absent',
    label: 'Unaccounted / Absent',
    badge: 'Alert',
    description: 'Missing from dormitory roll call without active approved out-pass.',
  },
  {
    value: 'on_leave',
    label: 'Approved Leave',
    badge: 'Leave',
    description: 'Recorded as on sanctioned home leave or weekend exit.',
  },
  {
    value: 'late_return',
    label: 'Late Return Past Curfew',
    badge: 'Curfew Breach',
    description: 'Reported to hostel desk after official curfew closure time.',
  },
  {
    value: 'excused',
    label: 'Excused / Infirmary',
    badge: 'Excused',
    description: 'Under medical care at campus infirmary or attending school function.',
  },
  {
    value: 'checked_out',
    label: 'Checked Out',
    badge: 'Off Campus',
    description: 'End of term exit or official withdrawal from residential roll.',
  },
  {
    value: 'emergency',
    label: 'Emergency Alert',
    badge: 'Emergency',
    description: 'Emergency protocol initiated or urgent hospitalization notification.',
  },
];

// ─── NORMALIZATION & STATE PRESERVATION ────────────────────────────────────────

export function getDefaultCurfewPolicy(): HostelCurfewPolicy {
  return {
    curfewEnabled: true,
    weekdayCurfewTime: '20:00',
    weekendCurfewTime: '21:30',
    lateReturnPolicy: 'Late return requires written permission from Chief Warden and parent SMS alert.',
    escalationContactBehavior: 'Notify Chief Warden after 15 minutes past curfew; contact parents after 30 minutes.',
  };
}

export function getDefaultMessConfig(): HostelMessConfig {
  return {
    messAvailable: true,
    diningHallName: 'Main Central Dining Hall',
    mealsOffered: ['breakfast', 'lunch', 'evening_snack', 'dinner'],
    dietarySupport: ['vegetarian', 'non_vegetarian', 'jain'],
    messOperatorModel: 'in_house',
    notes: 'Nutritious dietitian-approved menu rotated every academic fortnight.',
  };
}

export function getDefaultSafetyEmergencyConfig(): HostelSafetyEmergencyConfig {
  return {
    emergencyContactLeadName: 'Campus Medical & Security Desk',
    emergencyContactPhone: '',
    medicalContactDetails: '24/7 Campus Infirmary with resident nursing officer',
    nightSupervisorStaffId: '',
    fireSafetyProcedureRef: 'Emergency Evacuation SOP Rev. 3 & Assembly Point B',
    nearestHospitalContact: 'District Civil Hospital / Apollo Clinic Emergency Desk',
  };
}

/**
 * Normalizes raw hostel configuration, preserving all nested arrays,
 * draft fields, and legacy boolean mirrors.
 */
export function normalizeHostelData(
  raw?: Partial<HostelData> | null,
  schoolProfile?: { residentialStatus?: string } | null
): HostelData {
  const isApplicable = isHostelApplicable(schoolProfile);
  const data = raw || {};

  const buildings: HostelBuilding[] = Array.isArray(data.buildings)
    ? data.buildings.map((b, idx) => ({
        id: b.id || `building-${idx + 1}-${Date.now()}`,
        name: b.name?.trim() || `Hostel Block ${String.fromCharCode(65 + idx)}`,
        code: b.code?.trim().toUpperCase() || `HB-${String.fromCharCode(65 + idx)}`,
        genderCategory: b.genderCategory || (idx % 2 === 0 ? 'boys' : 'girls'),
        capacity: Number(b.capacity) > 0 ? Number(b.capacity) : 50,
        floorsCount: Number(b.floorsCount) > 0 ? Number(b.floorsCount) : 3,
        wardenStaffId: b.wardenStaffId || '',
        assistantWardenStaffId: b.assistantWardenStaffId || '',
        supervisorStaffId: b.supervisorStaffId || '',
        status: b.status || 'active',
        notes: b.notes || '',
        metadata: b.metadata || {},
      }))
    : [];

  const rooms: HostelRoom[] = Array.isArray(data.rooms)
    ? data.rooms.map((r, idx) => ({
        id: r.id || `room-${idx + 1}-${Date.now()}`,
        buildingId: r.buildingId || (buildings[0]?.id || ''),
        roomNumber: r.roomNumber?.trim() || `10${idx + 1}`,
        floor: r.floor ?? 1,
        category: r.category || 'four_bed',
        capacity: Number(r.capacity) > 0 ? Number(r.capacity) : 4,
        genderCategory: r.genderCategory || 'any',
        status: r.status || 'active',
        notes: r.notes || '',
      }))
    : [];

  const beds: HostelBed[] = Array.isArray(data.beds)
    ? data.beds.map((b, idx) => ({
        id: b.id || `bed-${idx + 1}-${Date.now()}`,
        roomId: b.roomId || (rooms[0]?.id || ''),
        buildingId: b.buildingId || (buildings[0]?.id || ''),
        bedIdentifier: b.bedIdentifier?.trim() || `Bed-${idx + 1}`,
        status: b.status || 'available',
        assignedStudentId: b.assignedStudentId || '',
        assignmentStartDate: b.assignmentStartDate || '',
        assignmentEndDate: b.assignmentEndDate || '',
      }))
    : [];

  const residentAssignments: ResidentialStudentAssignment[] = Array.isArray(data.residentAssignments)
    ? data.residentAssignments.map((a, idx) => ({
        id: a.id || `assign-${idx + 1}-${Date.now()}`,
        studentId: String(a.studentId || '').trim(),
        buildingId: a.buildingId || '',
        roomId: a.roomId || '',
        bedId: a.bedId || '',
        status: a.status || 'active_resident',
        startDate: a.startDate || new Date().toISOString().split('T')[0],
        endDate: a.endDate || '',
        guardianName: a.guardianName || '',
        guardianPhone: a.guardianPhone || '',
        emergencyContactName: a.emergencyContactName || '',
        emergencyContactPhone: a.emergencyContactPhone || '',
        notes: a.notes || '',
        metadata: a.metadata || {},
      }))
    : [];

  const attendanceRecords: HostelAttendanceRecord[] = Array.isArray(data.attendanceRecords)
    ? data.attendanceRecords.map((att, idx) => ({
        id: att.id || `att-${idx + 1}-${Date.now()}`,
        studentId: att.studentId,
        buildingId: att.buildingId,
        roomId: att.roomId,
        bedId: att.bedId,
        date: att.date || new Date().toISOString().split('T')[0],
        attendanceStatus: att.attendanceStatus || 'present',
        timestamp: att.timestamp || new Date().toISOString(),
        markedBy: att.markedBy || 'Chief Warden',
        source: att.source || 'manual',
        notes: att.notes || '',
      }))
    : [];

  const leaveRecords: ResidentialLeaveRecord[] = Array.isArray(data.leaveRecords)
    ? data.leaveRecords.map((lv, idx) => ({
        id: lv.id || `leave-${idx + 1}-${Date.now()}`,
        studentId: lv.studentId,
        leaveType: lv.leaveType || 'out_pass',
        startDateTime: lv.startDateTime || new Date().toISOString(),
        expectedReturnDateTime: lv.expectedReturnDateTime || new Date().toISOString(),
        actualReturnDateTime: lv.actualReturnDateTime,
        reason: lv.reason || 'Weekend family visit',
        approvedByStaffId: lv.approvedByStaffId,
        status: lv.status || 'approved',
        guardianContactAcknowledged: lv.guardianContactAcknowledged ?? true,
        notes: lv.notes || '',
      }))
    : [];

  // Determine total capacity from rooms, buildings, or explicit field
  let computedCapacity = 0;
  if (rooms.length > 0) {
    computedCapacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  } else if (buildings.length > 0) {
    computedCapacity = buildings.reduce((sum, b) => sum + (Number(b.capacity) || 0), 0);
  } else {
    computedCapacity = Number(data.totalCapacity) || 0;
  }

  // Count active boys/girls hostels for backward compatibility mirrors
  const boysCount = buildings.filter((b) => b.genderCategory === 'boys').length;
  const girlsCount = buildings.filter((b) => b.genderCategory === 'girls').length;

  return {
    // Canonical status
    status: !isApplicable
      ? 'not_applicable'
      : data.status && data.status !== 'not_applicable'
      ? (data.status as any)
      : (buildings.length > 0 ? 'complete' : 'incomplete'),
    residentialModel: data.residentialModel || 'school_operated',
    genderAccommodation: data.genderAccommodation || 'separate_wings',
    studentEligibility: data.studentEligibility || 'grade_6_above',
    totalCapacity: computedCapacity,
    waitlistCount: Number(data.waitlistCount) >= 0 ? Number(data.waitlistCount) : 0,

    // Hierarchical entities
    buildings,
    rooms,
    beds,
    residentAssignments,
    attendanceRecords,
    leaveRecords,

    // Policies
    curfewPolicy: {
      ...getDefaultCurfewPolicy(),
      ...(data.curfewPolicy || {}),
    },
    messConfig: {
      ...getDefaultMessConfig(),
      ...(data.messConfig || {}),
    },
    safetyEmergency: {
      ...getDefaultSafetyEmergencyConfig(),
      ...(data.safetyEmergency || {}),
    },

    // Legacy backward-compatible mirrors
    enabled: isApplicable ? (data.enabled ?? true) : false,
    boysHostel: boysCount > 0 || Boolean(data.boysHostel),
    girlsHostel: girlsCount > 0 || Boolean(data.girlsHostel),
    hostelsCount: buildings.length > 0 ? buildings.length : (data.hostelsCount || 0),
    roomTypes: Array.isArray(data.roomTypes) && data.roomTypes.length > 0
      ? data.roomTypes
      : ['Single', 'Double Sharing', 'Dormitory (4 Bed)'],
    wardensAssigned: buildings.some((b) => Boolean(b.wardenStaffId)) || Boolean(data.wardensAssigned),
    hostelFeeMonthly: Number(data.hostelFeeMonthly) || Number(data.monthlyFee) || 0,
    messIncluded: data.messIncluded ?? true,
    attendanceTracking: data.attendanceTracking ?? true,
    visitorManagement: data.visitorManagement ?? true,
    hostelNames: buildings.map((b) => b.name),
    capacityBoys: buildings.filter((b) => b.genderCategory === 'boys').reduce((s, b) => s + b.capacity, 0),
    capacityGirls: buildings.filter((b) => b.genderCategory === 'girls').reduce((s, b) => s + b.capacity, 0),
    rulesNotes: data.rulesNotes || '',
    monthlyFee: Number(data.monthlyFee) || Number(data.hostelFeeMonthly) || 0,
  };
}

// ─── DYNAMIC CAPACITY CALCULATION ──────────────────────────────────────────────

export interface HostelCapacityMetrics {
  totalCapacity: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  waitlistCount: number;
  activeResidentsCount: number;
  onLeaveCount: number;
}

/**
 * Calculates genuine dynamic hostel capacity without inferring from total school enrollment.
 * Occupied beds are derived strictly from active student resident assignments.
 */
export function calculateHostelCapacity(data: HostelData): HostelCapacityMetrics {
  const assignments = data.residentAssignments || [];
  const activeResidents = assignments.filter((a) => a.status === 'active_resident');
  const onLeave = assignments.filter((a) => a.status === 'on_leave' || a.status === 'temporarily_away');

  let totalCapacity = 0;
  if (data.rooms && data.rooms.length > 0) {
    totalCapacity = data.rooms
      .filter((r) => r.status === 'active')
      .reduce((sum, r) => sum + (Number(r.capacity) || 0), 0);
  } else if (data.buildings && data.buildings.length > 0) {
    totalCapacity = data.buildings
      .filter((b) => b.status === 'active')
      .reduce((sum, b) => sum + (Number(b.capacity) || 0), 0);
  } else {
    totalCapacity = Number(data.totalCapacity) || 0;
  }

  const occupiedBeds = activeResidents.length;
  const availableBeds = Math.max(0, totalCapacity - occupiedBeds);
  const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;
  const waitlistCount = Number(data.waitlistCount) || 0;

  return {
    totalCapacity,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    waitlistCount,
    activeResidentsCount: activeResidents.length,
    onLeaveCount: onLeave.length,
  };
}

// ─── VALIDATION ENGINE ─────────────────────────────────────────────────────────

export interface HostelValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  missingFields: string[];
}

export function validateHostelData(
  data: HostelData,
  isApplicable: boolean,
  eligibleStaffList?: Array<{ id?: string; status?: string; designation?: string }>,
  productId?: string
): HostelValidationResult {
  const errors: Record<string, string> = {};
  const missingFields: string[] = [];

  // If hostel is Not Applicable (e.g. Day School), zero validation errors
  if (!isApplicable) {
    return { isValid: true, errors: {}, missingFields: [] };
  }

  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';

  // 1. Overview validations
  if (!data.residentialModel) {
    errors.residentialModel = 'Residential accommodation model is required.';
    missingFields.push('Hostel Overview: Residential Model');
  }

  if (!data.genderAccommodation) {
    errors.genderAccommodation = 'Gender accommodation structure is required.';
    missingFields.push('Hostel Overview: Gender Accommodation');
  }

  if (isWebsiteOnly) {
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      missingFields,
    };
  }

  // 2. Capacity validations
  const metrics = calculateHostelCapacity(data);
  if (metrics.totalCapacity < 0) {
    errors.totalCapacity = 'Total boarding capacity cannot be negative.';
  }

  if (metrics.occupiedBeds > metrics.totalCapacity && metrics.totalCapacity > 0) {
    errors.capacityOverflow = `Occupied beds (${metrics.occupiedBeds}) cannot exceed total capacity (${metrics.totalCapacity}).`;
  }

  // 3. Building validations
  const buildingCodes = new Set<string>();
  (data.buildings || []).forEach((b, idx) => {
    if (!b.name || !b.name.trim()) {
      errors[`building_${idx}_name`] = `Building ${idx + 1} name is required.`;
      missingFields.push(`Building ${idx + 1}: Name`);
    }

    if (!b.code || !b.code.trim()) {
      errors[`building_${idx}_code`] = `Building ${idx + 1} code is required.`;
      missingFields.push(`Building ${idx + 1}: Code`);
    } else {
      const upperCode = b.code.trim().toUpperCase();
      if (buildingCodes.has(upperCode)) {
        errors[`building_${idx}_code_dup`] = `Duplicate building code "${upperCode}". Codes must be unique.`;
      }
      buildingCodes.add(upperCode);
    }

    if (b.capacity < 0) {
      errors[`building_${idx}_capacity`] = `Capacity for ${b.name} cannot be negative.`;
    }

    // Validate warden assignment if staff list is provided
    if (b.wardenStaffId && eligibleStaffList && eligibleStaffList.length > 0) {
      const staffMember = eligibleStaffList.find((s) => s.id === b.wardenStaffId);
      if (staffMember && staffMember.status === 'inactive') {
        errors[`building_${idx}_warden_inactive`] = `Assigned warden for ${b.name} is currently inactive.`;
      }
    }
  });

  // 4. Room validations
  const roomsPerBuilding: Record<string, Set<string>> = {};
  (data.rooms || []).forEach((r, idx) => {
    if (!r.roomNumber || !r.roomNumber.trim()) {
      errors[`room_${idx}_number`] = `Room ${idx + 1} number is required.`;
    } else {
      if (!roomsPerBuilding[r.buildingId]) {
        roomsPerBuilding[r.buildingId] = new Set<string>();
      }
      const upperNum = r.roomNumber.trim().toUpperCase();
      if (roomsPerBuilding[r.buildingId].has(upperNum)) {
        errors[`room_${idx}_dup`] = `Duplicate room number "${upperNum}" in the same building.`;
      }
      roomsPerBuilding[r.buildingId].add(upperNum);
    }

    if (r.capacity < 0) {
      errors[`room_${idx}_capacity`] = `Capacity for Room ${r.roomNumber} cannot be negative.`;
    }

    // Room bed allocation check
    const roomAssignments = (data.residentAssignments || []).filter(
      (a) => a.roomId === r.id && a.status === 'active_resident'
    );
    if (roomAssignments.length > r.capacity && r.capacity > 0) {
      errors[`room_${idx}_overcapacity`] = `Room ${r.roomNumber} is over capacity (${roomAssignments.length}/${r.capacity}).`;
    }
  });

  // 5. Resident assignment validations
  const activeStudentIds = new Set<string>();
  (data.residentAssignments || []).forEach((a, idx) => {
    if (!a.studentId || !a.studentId.trim()) {
      errors[`assign_${idx}_student`] = `Resident assignment ${idx + 1} missing student reference.`;
    } else if (a.status === 'active_resident') {
      if (activeStudentIds.has(a.studentId)) {
        errors[`assign_${idx}_double`] = `Student cannot occupy multiple active beds simultaneously.`;
      }
      activeStudentIds.add(a.studentId);
    }

    // Verify assigned building & room exist and are active
    if (a.buildingId && a.status === 'active_resident') {
      const bldg = (data.buildings || []).find((b) => b.id === a.buildingId);
      if (bldg && bldg.status === 'inactive') {
        errors[`assign_${idx}_inactive_building`] = `Cannot assign resident to inactive hostel building "${bldg.name}".`;
      }
    }

    if (a.roomId && a.status === 'active_resident') {
      const rm = (data.rooms || []).find((r) => r.id === a.roomId);
      if (rm && rm.status === 'inactive') {
        errors[`assign_${idx}_inactive_room`] = `Cannot assign resident to inactive room "${rm.roomNumber}".`;
      }
    }

    // Date checks
    if (a.startDate && a.endDate) {
      if (new Date(a.endDate) < new Date(a.startDate)) {
        errors[`assign_${idx}_dates`] = `Check-out date cannot precede assignment start date.`;
      }
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    missingFields,
  };
}

// ─── COMPLETION SCORING ENGINE ────────────────────────────────────────────────

export interface HostelSectionScore {
  total: number;
  filled: number;
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
  status: 'not_applicable' | 'incomplete' | 'partially_configured' | 'complete';
  statusLabel: string;
}

/**
 * Computes authoritative Section 15 score.
 *
 * DAY SCHOOL:
 * -> status: 'not_applicable'
 * -> statusLabel: 'Not Applicable'
 * -> percentage: 100 (bypassed without penalizing progress)
 * -> total: 0, filled: 0 (excluded from denominator)
 *
 * BOARDING SCHOOL:
 * Evaluates core required configuration:
 * 1. Residential Model
 * 2. Gender Accommodation Model
 * 3. At least 1 Building configured with code & capacity > 0
 * 4. Positive Total Capacity
 */
export function getHostelSectionScore(
  rawConfig?: Partial<HostelData> | null,
  isApplicable: boolean = true,
  productId?: string
): HostelSectionScore {
  // If not applicable (Day School), return not_applicable immediately
  if (!isApplicable) {
    return {
      total: 0,
      filled: 0,
      percentage: 100,
      missingFields: [],
      isComplete: true,
      status: 'not_applicable',
      statusLabel: 'Not Applicable',
    };
  }

  const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
  const data = normalizeHostelData(rawConfig, { residentialStatus: 'residential' });
  const missingFields: string[] = [];
  const total = isWebsiteOnly ? 2 : 4;
  let filled = 0;

  // 1. Residential Model
  if (data.residentialModel) {
    filled++;
  } else {
    missingFields.push('Hostel Overview: Residential Model');
  }

  // 2. Gender Accommodation
  if (data.genderAccommodation) {
    filled++;
  } else {
    missingFields.push('Hostel Overview: Gender Accommodation Structure');
  }

  if (!isWebsiteOnly) {
    // 3. Buildings
    const validBuildings = (data.buildings || []).filter(
      (b) => b.name?.trim() && b.code?.trim() && b.capacity > 0
    );
    if (validBuildings.length > 0) {
      filled++;
    } else {
      missingFields.push('Hostel Buildings: At least one building configured with code and capacity');
    }

    // 4. Total Capacity
    const metrics = calculateHostelCapacity(data);
    if (metrics.totalCapacity > 0) {
      filled++;
    } else {
      missingFields.push('Hostel Overview: Total Boarding Capacity (> 0)');
    }
  }

  const percentage = Math.round((filled / total) * 100);
  let status: 'incomplete' | 'partially_configured' | 'complete' = 'incomplete';
  let statusLabel = 'Incomplete';

  if (filled === total) {
    status = 'complete';
    statusLabel = 'Complete';
  } else if (filled > 0) {
    status = 'partially_configured';
    statusLabel = 'Partially Configured';
  }

  return {
    total,
    filled,
    percentage,
    missingFields,
    isComplete: filled === total,
    status,
    statusLabel,
  };
}

// ─── DOMAIN OPERATION HELPERS ─────────────────────────────────────────────────

/**
 * Assigns a student to a hostel room/bed with capacity checks.
 */
export function assignStudentToHostel(
  current: HostelData,
  assignment: Omit<ResidentialStudentAssignment, 'id'> & { id?: string }
): { success: boolean; data: HostelData; error?: string } {
  const norm = normalizeHostelData(current, { residentialStatus: 'residential' });

  // 1. Prevent assigning to inactive building
  const bldg = (norm.buildings || []).find((b) => b.id === assignment.buildingId);
  if (!bldg || bldg.status === 'inactive') {
    return { success: false, data: norm, error: 'Cannot assign student to an inactive or non-existent hostel building.' };
  }

  // 2. Prevent assigning to inactive room
  const room = (norm.rooms || []).find((r) => r.id === assignment.roomId);
  if (!room || room.status === 'inactive') {
    return { success: false, data: norm, error: 'Cannot assign student to an inactive or non-existent room.' };
  }

  // 3. Check room capacity
  const currentOccupancy = (norm.residentAssignments || []).filter(
    (a) => a.roomId === assignment.roomId && a.status === 'active_resident' && a.studentId !== assignment.studentId
  ).length;
  if (currentOccupancy >= room.capacity) {
    return { success: false, data: norm, error: `Room ${room.roomNumber} has reached maximum capacity (${room.capacity} beds).` };
  }

  // 4. Prevent assigning student to multiple active beds simultaneously
  const existingActive = (norm.residentAssignments || []).find(
    (a) => a.studentId === assignment.studentId && a.status === 'active_resident' && a.id !== assignment.id
  );
  if (existingActive) {
    return { success: false, data: norm, error: 'Student already has an active residential bed assignment. Please transfer or check out first.' };
  }

  const newAssignment: ResidentialStudentAssignment = {
    id: assignment.id || `assign-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    studentId: assignment.studentId,
    buildingId: assignment.buildingId,
    roomId: assignment.roomId,
    bedId: assignment.bedId || '',
    status: assignment.status || 'active_resident',
    startDate: assignment.startDate || new Date().toISOString().split('T')[0],
    endDate: assignment.endDate || '',
    guardianName: assignment.guardianName || '',
    guardianPhone: assignment.guardianPhone || '',
    emergencyContactName: assignment.emergencyContactName || '',
    emergencyContactPhone: assignment.emergencyContactPhone || '',
    notes: assignment.notes || '',
  };

  const updatedAssignments = [
    ...(norm.residentAssignments || []).filter((a) => a.id !== newAssignment.id),
    newAssignment,
  ];

  const updated = {
    ...norm,
    residentAssignments: updatedAssignments,
  };

  return { success: true, data: updated };
}

/**
 * Transfers a student to a new room/building while maintaining historical records.
 */
export function transferStudentRoom(
  current: HostelData,
  studentId: string,
  newBuildingId: string,
  newRoomId: string,
  newBedId?: string,
  effectiveDate: string = new Date().toISOString().split('T')[0]
): { success: boolean; data: HostelData; error?: string } {
  const norm = normalizeHostelData(current, { residentialStatus: 'residential' });

  // Find current active assignment
  const activeAssignment = (norm.residentAssignments || []).find(
    (a) => a.studentId === studentId && a.status === 'active_resident'
  );

  // Close prior active assignment with historical effective end date
  const updatedAssignments = (norm.residentAssignments || []).map((a) => {
    if (a.id === activeAssignment?.id) {
      return {
        ...a,
        status: 'checked_out' as ResidentialAssignmentStatus,
        endDate: effectiveDate,
        notes: `${a.notes || ''} [Transferred on ${effectiveDate}]`.trim(),
      };
    }
    return a;
  });

  // Assign to new room
  return assignStudentToHostel(
    { ...norm, residentAssignments: updatedAssignments },
    {
      studentId,
      buildingId: newBuildingId,
      roomId: newRoomId,
      bedId: newBedId || '',
      status: 'active_resident',
      startDate: effectiveDate,
      guardianName: activeAssignment?.guardianName,
      guardianPhone: activeAssignment?.guardianPhone,
      emergencyContactName: activeAssignment?.emergencyContactName,
      emergencyContactPhone: activeAssignment?.emergencyContactPhone,
      notes: `Transferred from prior room on ${effectiveDate}`,
    }
  );
}

/**
 * Records attendance for a resident with persistent building/room/bed snapshot.
 */
export function recordHostelAttendance(
  current: HostelData,
  record: Omit<HostelAttendanceRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
): { success: boolean; data: HostelData } {
  const norm = normalizeHostelData(current, { residentialStatus: 'residential' });

  const newRecord: HostelAttendanceRecord = {
    id: record.id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    studentId: record.studentId,
    buildingId: record.buildingId,
    roomId: record.roomId,
    bedId: record.bedId,
    date: record.date || new Date().toISOString().split('T')[0],
    attendanceStatus: record.attendanceStatus,
    timestamp: record.timestamp || new Date().toISOString(),
    markedBy: record.markedBy || 'Warden',
    source: record.source || 'manual',
    notes: record.notes || '',
  };

  const updatedRecords = [newRecord, ...(norm.attendanceRecords || [])];

  return {
    success: true,
    data: {
      ...norm,
      attendanceRecords: updatedRecords,
    },
  };
}

// ─── DYNAMIC SUMMARY FOR PREVIEWS ─────────────────────────────────────────────

export interface HostelSummary {
  pillLabel: string;
  isApplicable: boolean;
  statusLabel: string;
  badgeClass: string;
  details: string[];
}

export function getHostelSummary(
  data: HostelData,
  isApplicable: boolean
): HostelSummary {
  if (!isApplicable) {
    return {
      pillLabel: 'Not Applicable',
      isApplicable: false,
      statusLabel: 'Auto-skipped',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      details: ['Institution marked as Day School', 'Hostel configuration bypassed'],
    };
  }

  const metrics = calculateHostelCapacity(data);
  const buildingsCount = (data.buildings || []).length;
  const modelLabel = RESIDENTIAL_MODEL_OPTIONS.find((m) => m.value === data.residentialModel)?.badge || 'Hostel';

  const details: string[] = [
    `${modelLabel} • ${buildingsCount} Building${buildingsCount === 1 ? '' : 's'}`,
    `Capacity: ${metrics.totalCapacity} beds (${metrics.occupiedBeds} occupied, ${metrics.availableBeds} available)`,
  ];

  if (data.messConfig?.messAvailable) {
    details.push('Dining & Mess included');
  }

  return {
    pillLabel: `${metrics.occupiedBeds}/${metrics.totalCapacity} Beds`,
    isApplicable: true,
    statusLabel: metrics.totalCapacity > 0 ? 'Configured' : 'Incomplete',
    badgeClass: metrics.totalCapacity > 0
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-amber-50 text-amber-700 border-amber-200',
    details,
  };
}
