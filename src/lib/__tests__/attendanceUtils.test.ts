import assert from 'node:assert';
import {
  timeToMinutes,
  minutesToTimeString,
  validateSchoolHours,
  isDeviceBasedAttendance,
  generateTimetableSchedulePreview,
  STUDENT_ATTENDANCE_MODES,
  STAFF_ATTENDANCE_MODES,
  WORKING_DAYS,
  SATURDAY_SCHEDULE_OPTIONS,
  PARENT_ALERT_CHANNELS,
} from '../attendanceUtils';
import { calculateIntakeCompleteness } from '../schoolIntake';
import type { UniversalIntakeData } from '../types';

console.log('=== RUNNING ATTENDANCE & TIMETABLE TEST SUITE ===\n');

// 1. Time Conversion Tests
console.log('1. Testing time conversion helpers...');
assert.strictEqual(timeToMinutes('08:00 AM'), 480);
assert.strictEqual(timeToMinutes('02:30 PM'), 870);
assert.strictEqual(timeToMinutes('12:00 PM'), 720);
assert.strictEqual(timeToMinutes('12:00 AM'), 0);
assert.strictEqual(minutesToTimeString(480), '08:00 AM');
assert.strictEqual(minutesToTimeString(870), '02:30 PM');
assert.strictEqual(minutesToTimeString(720), '12:00 PM');
console.log('✓ Time conversion between 12-hour AM/PM and minutes from midnight passed.');

// 2. School Hours Validation Tests
console.log('\n2. Testing school hours validation...');
// Valid timing: 08:00 AM to 02:30 PM
const validTimings = validateSchoolHours({
  startTime: '08:00 AM',
  endTime: '02:30 PM',
  assemblyStartTime: '08:00 AM',
  dispersalTime: '02:30 PM',
});
assert.strictEqual(validTimings.isValid, true);

// Invalid: End time before start time
const endBeforeStart = validateSchoolHours({
  startTime: '02:30 PM',
  endTime: '08:00 AM',
});
assert.strictEqual(endBeforeStart.isValid, false);
assert.ok(endBeforeStart.error?.includes('End Time must be later'));

// Invalid: Operating duration too short (< 2 hours)
const tooShort = validateSchoolHours({
  startTime: '08:00 AM',
  endTime: '09:00 AM',
});
assert.strictEqual(tooShort.isValid, false);
assert.ok(tooShort.error?.includes('at least 2 hours'));

// Invalid: Dispersal before start
const invalidDispersal = validateSchoolHours({
  startTime: '08:00 AM',
  endTime: '02:30 PM',
  dispersalTime: '07:00 AM',
});
assert.strictEqual(invalidDispersal.isValid, false);
assert.ok(invalidDispersal.error?.includes('Dispersal Time cannot precede'));
console.log('✓ School operating hours validation rules passed.');

// 3. Device-Based Attendance Detection
console.log('\n3. Testing device-based attendance detection...');
assert.strictEqual(isDeviceBasedAttendance('biometric'), true);
assert.strictEqual(isDeviceBasedAttendance('rfid'), true);
assert.strictEqual(isDeviceBasedAttendance('qr_code'), true);
assert.strictEqual(isDeviceBasedAttendance('face_recognition'), true);
assert.strictEqual(isDeviceBasedAttendance('daily'), false);
assert.strictEqual(isDeviceBasedAttendance('mobile'), false);
assert.strictEqual(isDeviceBasedAttendance('manual_register'), false);
console.log('✓ Device-based hardware detection accurately identifies biometric/RFID/QR modes.');

// 4. Timetable Schedule Preview Generation
console.log('\n4. Testing dynamic period schedule generation...');
const preview = generateTimetableSchedulePreview({
  startTime: '08:00 AM',
  periodCount: 6,
  periodDurationMinutes: 40,
  assemblyDurationMinutes: 15,
  breaks: [
    { id: 'b1', name: 'Short Break', startTime: '10:15 AM', endTime: '10:30 AM', type: 'short_break' },
    { id: 'b2', name: 'Lunch Break', startTime: '11:50 AM', endTime: '12:20 PM', type: 'lunch' },
  ],
});

// Slot 0: Morning Assembly (08:00 AM - 08:15 AM)
assert.strictEqual(preview[0].type, 'assembly');
assert.strictEqual(preview[0].label, 'Morning Assembly');
assert.strictEqual(preview[0].startTime, '08:00 AM');
assert.strictEqual(preview[0].endTime, '08:15 AM');

// Slot 1: Period 1 (08:15 AM - 08:55 AM)
assert.strictEqual(preview[1].type, 'period');
assert.strictEqual(preview[1].label, 'Period 1');
assert.strictEqual(preview[1].startTime, '08:15 AM');
assert.strictEqual(preview[1].endTime, '08:55 AM');

// Slot 2: Period 2 (08:55 AM - 09:35 AM)
assert.strictEqual(preview[2].label, 'Period 2');

// Verify breaks are present
const hasShortBreak = preview.some((s) => s.label === 'Short Break' && s.type === 'break');
const hasLunchBreak = preview.some((s) => s.label === 'Lunch Break' && s.type === 'break');
assert.strictEqual(hasShortBreak, true);
assert.strictEqual(hasLunchBreak, true);

// Verify total period count
const periods = preview.filter((s) => s.type === 'period');
assert.strictEqual(periods.length, 6);
console.log('✓ Dynamic timetable schedule calculation and break insertion verified.');

// 5. Completion Scoring Logic (8 Required Fields)
console.log('\n5. Testing 8-field Section 10 completion scoring...');
const mockFullIntake: Partial<UniversalIntakeData> = {
  attendanceConfig: {
    studentAttendanceMode: 'daily',
    staffAttendanceMode: 'biometric',
    schoolStartTime: '08:00 AM',
    schoolEndTime: '02:30 PM',
    workingDays: [1, 2, 3, 4, 5, 6],
    periodCount: 8,
    periodDurationMinutes: 40,
    parentAbsenceChannels: ['whatsapp'],
  },
};

const resultFull = calculateIntakeCompleteness('school-erp', mockFullIntake as any);
assert.strictEqual(resultFull.sectionPercentages['attendanceConfig'], 100);

// Incomplete intake missing school start time and staff attendance
const mockIncompleteIntake: Partial<UniversalIntakeData> = {
  attendanceConfig: {
    studentAttendanceMode: 'daily',
    schoolEndTime: '02:30 PM',
    workingDays: [1, 2, 3, 4, 5],
    periodCount: 8,
    periodDurationMinutes: 40,
    parentAbsenceChannels: ['whatsapp'],
  },
};

const resultIncomplete = calculateIntakeCompleteness('school-erp', mockIncompleteIntake as any);
// 6 out of 8 required fields = 75%
assert.strictEqual(resultIncomplete.sectionPercentages['attendanceConfig'], 75);
assert.ok(resultIncomplete.missingFields.some((f) => f.includes('Staff Attendance Mode')));
assert.ok(resultIncomplete.missingFields.some((f) => f.includes('School Start Time')));
console.log('✓ Section 10 completion score accurately evaluates 8 required fields (6/8 = 75%, 8/8 = 100%).');

// 6. Option Registries Validation
console.log('\n6. Validating canonical option registries...');
assert.ok(STUDENT_ATTENDANCE_MODES.length >= 8);
assert.ok(STAFF_ATTENDANCE_MODES.length >= 7);
assert.strictEqual(WORKING_DAYS.length, 7);
assert.ok(SATURDAY_SCHEDULE_OPTIONS.length >= 4);
assert.ok(PARENT_ALERT_CHANNELS.length >= 5);
console.log('✓ All canonical option registries verified.');

console.log('\n=========================================');
console.log('ALL SECTION 10 TESTS PASSED! (100% PASS)');
console.log('=========================================\n');
