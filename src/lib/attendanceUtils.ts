/**
 * Attendance & Timetable Schedule Utilities
 * Canonical registries, time validation, dynamic period schedule generation,
 * and completion helpers for School Onboarding Section 10.
 */

export interface TimetableBreakItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: 'short_break' | 'lunch' | 'recess' | 'assembly' | 'other';
}

export interface TimetableSlotPreview {
  slotNumber: number;
  label: string;
  type: 'period' | 'break' | 'assembly';
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export const STUDENT_ATTENDANCE_MODES = [
  { value: 'daily', label: 'Daily Attendance', description: 'Marked once per day during morning roll call or homeroom.' },
  { value: 'period_wise', label: 'Period-wise Attendance', description: 'Subject teachers record student attendance every period.' },
  { value: 'daily_and_period', label: 'Daily + Period-wise', description: 'Morning homeroom master attendance combined with period-wise tracking.' },
  { value: 'biometric', label: 'Biometric Attendance', description: 'Fingerprint or facial recognition device logging for students.' },
  { value: 'rfid', label: 'RFID / Smart Card', description: 'Tap card at campus entrance gates or classroom turnstiles.' },
  { value: 'qr_code', label: 'QR Code', description: 'Student ID badge QR scanned via teacher mobile app or kiosk.' },
  { value: 'mobile', label: 'Mobile / Teacher App', description: 'Single-tap attendance directly on teachers’ school smartphones.' },
  { value: 'manual_register', label: 'Manual Register', description: 'Physical paper muster register digitized by school admin office.' },
  { value: 'undecided', label: 'Not Yet Decided', description: 'Decide during platform onboarding training.' },
] as const;

export const STAFF_ATTENDANCE_MODES = [
  { value: 'daily', label: 'Daily Attendance', description: 'Staff check in once daily upon arrival.' },
  { value: 'biometric', label: 'Biometric (Fingerprint)', description: 'Biometric fingerprint reader wall terminal at staff room/gate.' },
  { value: 'face_recognition', label: 'Face Recognition', description: 'AI facial scan terminal with anti-spoofing detection.' },
  { value: 'rfid', label: 'RFID / Smart Card', description: 'Staff employee smart badge tap at reception or staff room.' },
  { value: 'mobile', label: 'Mobile App with Geo-fencing', description: 'Punch in/out on staff mobile app within school campus GPS boundary.' },
  { value: 'manual', label: 'Manual Register', description: 'Physical paper signature muster book maintained in principal office.' },
  { value: 'multiple_methods', label: 'Multiple Methods', description: 'Combination of biometric terminals, mobile apps and admin overrides.' },
  { value: 'undecided', label: 'Not Yet Decided', description: 'Determine during staff onboarding.' },
] as const;

export const ATTENDANCE_DEVICE_TYPES = [
  { value: 'fingerprint', label: 'Fingerprint Scanner' },
  { value: 'face_recognition', label: 'Facial Recognition Terminal' },
  { value: 'rfid', label: 'RFID Card Reader' },
  { value: 'smart_card', label: 'Smart Card Kiosk' },
  { value: 'qr_code', label: 'QR Scanner / Kiosk' },
  { value: 'multiple_devices', label: 'Multiple Devices' },
  { value: 'other', label: 'Other Hardware' },
] as const;

export const ATTENDANCE_LOCATIONS = [
  { value: 'main_gate', label: 'Main School Gate / Entrance' },
  { value: 'classroom', label: 'Classrooms' },
  { value: 'both_gate_classroom', label: 'Both Gate & Classrooms' },
  { value: 'dedicated_area', label: 'Dedicated Attendance Hub / Reception' },
  { value: 'multiple_locations', label: 'Multiple Designated Locations' },
] as const;

export const DEVICE_INTEGRATION_STATUSES = [
  { value: 'available', label: 'Already Available (Hardware installed)' },
  { value: 'planned', label: 'Planned / Procurement in Progress' },
  { value: 'not_required', label: 'Not Required' },
  { value: 'not_decided', label: 'Not Yet Decided' },
] as const;

export const WORKING_DAYS = [
  { day: 1, label: 'Mon', fullLabel: 'Monday' },
  { day: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { day: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { day: 4, label: 'Thu', fullLabel: 'Thursday' },
  { day: 5, label: 'Fri', fullLabel: 'Friday' },
  { day: 6, label: 'Sat', fullLabel: 'Saturday' },
  { day: 7, label: 'Sun', fullLabel: 'Sunday' },
] as const;

export const SATURDAY_SCHEDULE_OPTIONS = [
  { value: 'full_day', label: 'Full Working Day', description: 'Normal daily operating hours and timetable.' },
  { value: 'half_day', label: 'Half Day', description: 'Shortened school hours (typically 08:00 AM – 12:00 PM).' },
  { value: 'alternate', label: 'Alternate Saturdays', description: 'Select which Saturdays are working vs. off.' },
  { value: 'custom', label: 'Custom Schedule', description: 'Activity/co-curricular classes or remedial sessions.' },
  { value: 'not_decided', label: 'Working Saturday Not Yet Decided', description: 'To be finalized in academic calendar.' },
] as const;

export const ALTERNATE_SATURDAY_PATTERNS = [
  { value: '1st_3rd', label: '1st & 3rd Saturdays Working (2nd & 4th Off)' },
  { value: '2nd_4th', label: '2nd & 4th Saturdays Working (1st & 3rd Off)' },
  { value: '1st_3rd_5th', label: '1st, 3rd & 5th Saturdays Working' },
  { value: '2nd_4th_5th', label: '2nd, 4th & 5th Saturdays Working' },
  { value: 'custom', label: 'Custom Calendar Rule' },
] as const;

export const BREAK_TYPE_OPTIONS = [
  { value: 'short_break', label: 'Short Break' },
  { value: 'lunch', label: 'Lunch Break' },
  { value: 'recess', label: 'Recess' },
  { value: 'assembly', label: 'Morning Assembly' },
  { value: 'other', label: 'Other' },
] as const;

export const SCHEDULE_STRUCTURE_OPTIONS = [
  { value: 'same_for_all', label: 'Same timetable structure for all classes', description: 'All grades follow standard bell timings and periods.' },
  { value: 'by_grade', label: 'Different schedules by grade/group', description: 'Primary vs Secondary have different period counts or lunch hours.' },
  { value: 'by_campus', label: 'Different schedules by campus', description: 'Branch campuses operate under distinct timing structures.' },
  { value: 'configure_later', label: 'To be configured later', description: 'Default template applied; detailed assignments handled in ERP.' },
] as const;

export const LATE_MARKING_OPTIONS = [
  { value: 'automatic', label: 'Automatically mark Late when arriving past threshold' },
  { value: 'teacher_decides', label: 'Teacher decides whether to grant Late or Present' },
  { value: 'admin_decides', label: 'Office / Admin staff approves Late marking' },
] as const;

export const ABSENT_MARKING_OPTIONS = [
  { value: 'teacher_submits', label: 'Teacher submits daily attendance roster' },
  { value: 'automatic_after_school', label: 'Automatic Absent if no check-in before cutoff' },
  { value: 'admin_approval', label: 'Requires Admin approval before finalizing absent list' },
  { value: 'manual', label: 'Manual entry in office muster register' },
] as const;

export const PARENT_ALERT_CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', badge: 'High Delivery' },
  { value: 'sms', label: 'SMS Text Message', badge: 'Universal' },
  { value: 'email', label: 'Email', badge: 'Official' },
  { value: 'push', label: 'Push Notification', badge: 'Fast' },
  { value: 'parent_app', label: 'Parent Portal / App', badge: 'In-App' },
  { value: 'none', label: 'No Automatic Alert', badge: 'Manual' },
] as const;

export const ALERT_TIMING_OPTIONS = [
  { value: 'immediate', label: 'Immediately after attendance is marked' },
  { value: 'after_teacher_submits', label: 'After teacher submits daily attendance' },
  { value: 'after_admin_approval', label: 'After admin approval of daily roster' },
  { value: 'end_of_day', label: 'At the end of the school day' },
  { value: 'custom', label: 'Custom Specific Time' },
] as const;

export const CORRECTION_ROLES = [
  { value: 'teacher', label: 'Subject Teacher' },
  { value: 'class_teacher', label: 'Class Teacher' },
  { value: 'attendance_coordinator', label: 'Attendance Coordinator' },
  { value: 'administrator', label: 'System Administrator' },
  { value: 'principal', label: 'Principal / Head of School' },
] as const;

/**
 * Determine if an attendance mode is device-based (requires hardware configuration).
 */
export function isDeviceBasedAttendance(mode?: string): boolean {
  if (!mode) return false;
  return mode === 'biometric' || mode === 'rfid' || mode === 'qr_code' || mode === 'face_recognition';
}

/**
 * Convert time string to minutes from midnight (0 to 1439).
 * Supports formats: "08:00 AM", "8:00 AM", "14:30", "02:30 PM", "8:00", etc.
 */
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const trimmed = timeStr.trim().toUpperCase();

  const isPm = trimmed.includes('PM');
  const isAm = trimmed.includes('AM');

  const clean = trimmed.replace(/[A-Z]/g, '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return 0;

  let hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;

  if (isPm && hours < 12) hours += 12;
  if (isAm && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to formatted 12-hour AM/PM string.
 * Example: 480 -> "08:00 AM", 870 -> "02:30 PM"
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const mins = normalized % 60;

  const isPm = hours24 >= 12;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;

  const padH = String(hours12).padStart(2, '0');
  const padM = String(mins).padStart(2, '0');
  return `${padH}:${padM} ${isPm ? 'PM' : 'AM'}`;
}

/**
 * Validate school timing relationships.
 */
export function validateSchoolHours(params: {
  startTime?: string;
  endTime?: string;
  assemblyStartTime?: string;
  dispersalTime?: string;
}): { isValid: boolean; error?: string } {
  const { startTime, endTime, assemblyStartTime, dispersalTime } = params;

  if (!startTime || !endTime) {
    return { isValid: false, error: 'School Start Time and End Time are required.' };
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin >= endMin) {
    return { isValid: false, error: 'School End Time must be later than School Start Time.' };
  }

  if (endMin - startMin < 120) {
    return { isValid: false, error: 'School operating duration must be at least 2 hours.' };
  }

  if (assemblyStartTime) {
    const assemblyMin = timeToMinutes(assemblyStartTime);
    if (assemblyMin < startMin - 30 || assemblyMin > endMin) {
      return { isValid: false, error: 'Morning Assembly must fall within school operating hours.' };
    }
  }

  if (dispersalTime) {
    const dispersalMin = timeToMinutes(dispersalTime);
    if (dispersalMin < startMin) {
      return { isValid: false, error: 'Student Dispersal Time cannot precede School Start Time.' };
    }
  }

  return { isValid: true };
}

/**
 * Calculate dynamic period schedule for live visual preview.
 * Integrates periods, breaks, and assembly chronologically.
 */
export function generateTimetableSchedulePreview(params: {
  startTime?: string;
  periodCount?: number;
  periodDurationMinutes?: number;
  breaks?: TimetableBreakItem[];
  assemblyStartTime?: string;
  assemblyDurationMinutes?: number;
}): TimetableSlotPreview[] {
  const startTime = params.startTime || '08:00 AM';
  const periodCount = Math.max(1, Math.min(12, params.periodCount || 8));
  const periodDuration = Math.max(15, Math.min(90, params.periodDurationMinutes || 40));
  const breaks = params.breaks || [];

  const slots: TimetableSlotPreview[] = [];
  let currentMinutes = timeToMinutes(startTime);

  // Optional Morning Assembly before Period 1
  if (params.assemblyDurationMinutes && params.assemblyDurationMinutes > 0) {
    const assemblyEnd = currentMinutes + params.assemblyDurationMinutes;
    slots.push({
      slotNumber: 0,
      label: 'Morning Assembly',
      type: 'assembly',
      startTime: minutesToTimeString(currentMinutes),
      endTime: minutesToTimeString(assemblyEnd),
      durationMinutes: params.assemblyDurationMinutes,
    });
    currentMinutes = assemblyEnd;
  }

  // Sort defined breaks chronologically
  const sortedBreaks = [...breaks]
    .filter((b) => b.startTime && b.endTime)
    .map((b) => ({
      ...b,
      startMin: timeToMinutes(b.startTime),
      endMin: timeToMinutes(b.endTime),
    }))
    .sort((a, b) => a.startMin - b.startMin);

  let breakIndex = 0;

  for (let p = 1; p <= periodCount; p++) {
    // Check if any break occurs before or right at this period
    while (breakIndex < sortedBreaks.length) {
      const nextBreak = sortedBreaks[breakIndex];
      // If current time is close to or at the break start time
      if (currentMinutes >= nextBreak.startMin - 5 && nextBreak.endMin > currentMinutes) {
        const breakDuration = Math.max(5, nextBreak.endMin - nextBreak.startMin);
        slots.push({
          slotNumber: 0,
          label: nextBreak.name || (nextBreak.type === 'lunch' ? 'Lunch Break' : 'Break'),
          type: 'break',
          startTime: minutesToTimeString(nextBreak.startMin),
          endTime: minutesToTimeString(nextBreak.endMin),
          durationMinutes: breakDuration,
        });
        currentMinutes = Math.max(currentMinutes, nextBreak.endMin);
        breakIndex++;
      } else {
        break;
      }
    }

    // Add academic period
    const periodEnd = currentMinutes + periodDuration;
    slots.push({
      slotNumber: p,
      label: `Period ${p}`,
      type: 'period',
      startTime: minutesToTimeString(currentMinutes),
      endTime: minutesToTimeString(periodEnd),
      durationMinutes: periodDuration,
    });
    currentMinutes = periodEnd;
  }

  // Append any remaining breaks (e.g. afternoon snack or dispersal break)
  while (breakIndex < sortedBreaks.length) {
    const remainingBreak = sortedBreaks[breakIndex];
    if (remainingBreak.endMin > remainingBreak.startMin) {
      slots.push({
        slotNumber: 0,
        label: remainingBreak.name || 'Break',
        type: 'break',
        startTime: minutesToTimeString(remainingBreak.startMin),
        endTime: minutesToTimeString(remainingBreak.endMin),
        durationMinutes: remainingBreak.endMin - remainingBreak.startMin,
      });
    }
    breakIndex++;
  }

  return slots;
}
