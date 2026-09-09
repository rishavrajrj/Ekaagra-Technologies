'use client';

import React, { useMemo, useState } from 'react';
import {
  type UniversalIntakeData,
  type SchoolProject,
  type AttendanceData,
  type TimetableBreakItem,
  type AbsenceAlertChannel,
  type AttendanceCorrectionRole,
} from '@/lib/types';
import {
  STUDENT_ATTENDANCE_MODES,
  STAFF_ATTENDANCE_MODES,
  ATTENDANCE_DEVICE_TYPES,
  ATTENDANCE_LOCATIONS,
  DEVICE_INTEGRATION_STATUSES,
  WORKING_DAYS,
  SATURDAY_SCHEDULE_OPTIONS,
  ALTERNATE_SATURDAY_PATTERNS,
  BREAK_TYPE_OPTIONS,
  SCHEDULE_STRUCTURE_OPTIONS,
  LATE_MARKING_OPTIONS,
  ABSENT_MARKING_OPTIONS,
  PARENT_ALERT_CHANNELS,
  ALERT_TIMING_OPTIONS,
  CORRECTION_ROLES,
  isDeviceBasedAttendance,
  validateSchoolHours,
  generateTimetableSchedulePreview,
} from '@/lib/attendanceUtils';
import {
  Clock,
  Calendar,
  Layers,
  Bell,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Users,
  ShieldCheck,
  Cpu,
  Coffee,
  Sparkles,
  ChevronDown,
  Building2,
} from 'lucide-react';

interface AttendanceTimetableSectionProps {
  project?: SchoolProject;
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
}

export default function AttendanceTimetableSection({
  project,
  intakeData,
  updateSectionField,
}: AttendanceTimetableSectionProps) {
  const att: AttendanceData = intakeData.attendanceConfig || {};

  // Local helper to update attendanceConfig fields
  const updateAttField = (field: keyof AttendanceData, value: any) => {
    updateSectionField('attendanceConfig', field, value);
  };

  // State for adding a new break inline
  const [newBreakName, setNewBreakName] = useState('Short Break');
  const [newBreakStart, setNewBreakStart] = useState('10:00 AM');
  const [newBreakEnd, setNewBreakEnd] = useState('10:15 AM');
  const [newBreakType, setNewBreakType] = useState<TimetableBreakItem['type']>('short_break');
  const [isAddingBreak, setIsAddingBreak] = useState(false);

  // Time validation
  const timeValidation = useMemo(() => {
    return validateSchoolHours({
      startTime: att.schoolStartTime || '08:00 AM',
      endTime: att.schoolEndTime || '02:30 PM',
      assemblyStartTime: att.assemblyStartTime,
      dispersalTime: att.dispersalTime,
    });
  }, [att.schoolStartTime, att.schoolEndTime, att.assemblyStartTime, att.dispersalTime]);

  // Working days array (1 = Mon, ..., 7 = Sun)
  const activeWorkingDays: number[] = useMemo(() => {
    return Array.isArray(att.workingDays) && att.workingDays.length > 0
      ? att.workingDays
      : [1, 2, 3, 4, 5, 6];
  }, [att.workingDays]);

  const isSaturdayWorking = activeWorkingDays.includes(6);

  // Parent alert channels
  const activeAlertChannels: AbsenceAlertChannel[] = useMemo(() => {
    if (Array.isArray(att.parentAbsenceChannels)) return att.parentAbsenceChannels;
    if (att.parentAbsenceNotification && att.parentAbsenceNotification !== 'none') {
      return [att.parentAbsenceNotification as AbsenceAlertChannel];
    }
    return ['whatsapp'];
  }, [att.parentAbsenceChannels, att.parentAbsenceNotification]);

  // Dynamic timetable live preview
  const timetablePreview = useMemo(() => {
    return generateTimetableSchedulePreview({
      startTime: att.schoolStartTime || '08:00 AM',
      periodCount: att.periodCount || 8,
      periodDurationMinutes: att.periodDurationMinutes || 40,
      breaks: att.breaks || [
        { id: 'b1', name: 'Short Break', startTime: '10:00 AM', endTime: '10:15 AM', type: 'short_break' },
        { id: 'b2', name: 'Lunch Break', startTime: '12:15 PM', endTime: '12:45 PM', type: 'lunch' },
      ],
      assemblyStartTime: att.assemblyStartTime,
      assemblyDurationMinutes: att.assemblyDurationMinutes,
    });
  }, [
    att.schoolStartTime,
    att.periodCount,
    att.periodDurationMinutes,
    att.breaks,
    att.assemblyStartTime,
    att.assemblyDurationMinutes,
  ]);

  // Toggle working day
  const toggleWorkingDay = (dayNum: number) => {
    let next: number[];
    if (activeWorkingDays.includes(dayNum)) {
      if (activeWorkingDays.length === 1) return; // Must have at least 1 working day
      next = activeWorkingDays.filter((d) => d !== dayNum);
    } else {
      next = [...activeWorkingDays, dayNum].sort((a, b) => a - b);
    }
    updateAttField('workingDays', next);
  };

  // Toggle alert channel
  const toggleAlertChannel = (channel: AbsenceAlertChannel) => {
    if (channel === 'none') {
      updateAttField('parentAbsenceChannels', ['none']);
      updateAttField('parentAbsenceNotification', 'none');
      return;
    }

    let next = activeAlertChannels.filter((c) => c !== 'none');
    if (next.includes(channel)) {
      next = next.filter((c) => c !== channel);
      if (next.length === 0) next = ['none'];
    } else {
      next = [...next, channel];
    }
    updateAttField('parentAbsenceChannels', next);
    updateAttField('parentAbsenceNotification', next[0] || 'whatsapp');
  };

  // Toggle correction role
  const activeCorrectionRoles: AttendanceCorrectionRole[] = useMemo(() => {
    return Array.isArray(att.canCorrectAttendance)
      ? att.canCorrectAttendance
      : ['class_teacher', 'attendance_coordinator', 'administrator'];
  }, [att.canCorrectAttendance]);

  const toggleCorrectionRole = (role: AttendanceCorrectionRole) => {
    let next: AttendanceCorrectionRole[];
    if (activeCorrectionRoles.includes(role)) {
      if (activeCorrectionRoles.length === 1) return;
      next = activeCorrectionRoles.filter((r) => r !== role);
    } else {
      next = [...activeCorrectionRoles, role];
    }
    updateAttField('canCorrectAttendance', next);
  };

  // Breaks management
  const breaksList: TimetableBreakItem[] = useMemo(() => {
    return (
      att.breaks || [
        { id: 'b1', name: 'Short Break', startTime: '10:00 AM', endTime: '10:15 AM', type: 'short_break' },
        { id: 'b2', name: 'Lunch Break', startTime: '12:15 PM', endTime: '12:45 PM', type: 'lunch' },
      ]
    );
  }, [att.breaks]);

  const handleAddBreak = () => {
    if (!newBreakName || !newBreakStart || !newBreakEnd) return;
    const item: TimetableBreakItem = {
      id: `break-${Date.now()}`,
      name: newBreakName.trim(),
      startTime: newBreakStart,
      endTime: newBreakEnd,
      type: newBreakType,
    };
    const next = [...breaksList, item];
    updateAttField('breaks', next);
    setIsAddingBreak(false);
  };

  const handleRemoveBreak = (breakId: string) => {
    const next = breaksList.filter((b) => b.id !== breakId);
    updateAttField('breaks', next);
  };

  const campuses = intakeData.campuses || [];
  const hasMultipleCampuses = campuses.length > 1;

  return (
    <div className="space-y-8">
      {/* SECTION HEADER */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-[#4338CA]">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#131B2E]">Attendance Workflow &amp; Timetable Schedule</h2>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  Section 10 of 29
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Configure student and staff attendance, school timings, timetable structure, absence alerts and attendance rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B]">Policy Status:</span>
            {att.isAttendanceConfirmed ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed by Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Sparkles className="w-3.5 h-3.5" /> Default / In Configuration
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CARD 1: STUDENT ATTENDANCE */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
          <Users className="w-4 h-4 text-[#4338CA]" />
          <h3 className="font-bold text-[#131B2E] text-base">Student Attendance</h3>
          <span className="text-xs text-[#64748B]">Define how student attendance is recorded and managed.</span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
              Student Attendance Mode *
            </label>
            <select
              value={att.studentAttendanceMode || 'daily'}
              onChange={(e) => updateAttField('studentAttendanceMode', e.target.value)}
              className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs cursor-pointer"
            >
              {STUDENT_ATTENDANCE_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label} — {mode.description}
                </option>
              ))}
            </select>
          </div>

          {/* Biometric / Device-Based Conditional Sub-Form */}
          {isDeviceBasedAttendance(att.studentAttendanceMode) && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#4338CA]" />
                <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
                  Hardware &amp; Device Integration
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Attendance Device Type</label>
                  <select
                    value={att.attendanceDevice || 'fingerprint'}
                    onChange={(e) => updateAttField('attendanceDevice', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                  >
                    {ATTENDANCE_DEVICE_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Capture Location</label>
                  <select
                    value={att.attendanceCaptureLocation || 'main_gate'}
                    onChange={(e) => updateAttField('attendanceCaptureLocation', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                  >
                    {ATTENDANCE_LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#334155] mb-1">Device Integration Status</label>
                  <select
                    value={att.deviceIntegrationStatus || 'planned'}
                    onChange={(e) => updateAttField('deviceIntegrationStatus', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                  >
                    {DEVICE_INTEGRATION_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: FACULTY & STAFF ATTENDANCE */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
          <h3 className="font-bold text-[#131B2E] text-base">Faculty &amp; Staff Attendance</h3>
          <span className="text-xs text-[#64748B]">Define how employees and teaching staff record attendance.</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1.5">
            Staff Attendance Mode *
          </label>
          <select
            value={att.staffAttendanceMode || 'biometric'}
            onChange={(e) => updateAttField('staffAttendanceMode', e.target.value)}
            className="w-full sm:w-2/3 px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs cursor-pointer"
          >
            {STAFF_ATTENDANCE_MODES.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label} — {mode.description}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-[#64748B] mt-1.5">
            Configured independently from student attendance to support staff room biometric readers, mobile GPS geo-punch, or reception muster books.
          </p>
        </div>
      </div>

      {/* CARD 3: SCHOOL TIMINGS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-[#131B2E] text-base">School Operating Timings</h3>
          </div>
          <span className="text-xs text-[#64748B]">Defines the official campus bell schedule and operating boundary.</span>
        </div>

        {/* Validation Warning if invalid */}
        {!timeValidation.isValid && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-semibold">{timeValidation.error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              School Start Time *
            </label>
            <input
              type="text"
              value={att.schoolStartTime || '08:00 AM'}
              onChange={(e) => updateAttField('schoolStartTime', e.target.value)}
              placeholder="08:00 AM"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Official classes begin.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              School End Time *
            </label>
            <input
              type="text"
              value={att.schoolEndTime || '02:30 PM'}
              onChange={(e) => updateAttField('schoolEndTime', e.target.value)}
              placeholder="02:30 PM"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Final period ends.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Assembly Start Time
            </label>
            <input
              type="text"
              value={att.assemblyStartTime || '08:00 AM'}
              onChange={(e) => updateAttField('assemblyStartTime', e.target.value)}
              placeholder="08:00 AM"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Morning prayer / assembly.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Assembly Duration (Min)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={att.assemblyDurationMinutes ?? 15}
              onChange={(e) => updateAttField('assemblyDurationMinutes', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Scheduled minutes.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Gate Opening / Student Reporting Time
            </label>
            <input
              type="text"
              value={att.reportingTime || '07:45 AM'}
              onChange={(e) => updateAttField('reportingTime', e.target.value)}
              placeholder="07:45 AM"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs focus:border-[#4338CA] focus:outline-hidden"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Campus gates open for early student arrivals.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1">
              Student Dispersal Time
            </label>
            <input
              type="text"
              value={att.dispersalTime || '02:30 PM'}
              onChange={(e) => updateAttField('dispersalTime', e.target.value)}
              placeholder="02:30 PM"
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs focus:border-[#4338CA] focus:outline-hidden"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Bus boarding and parent pickup dispersal.</p>
          </div>
        </div>
      </div>

      {/* CARD 4: WEEKLY SCHEDULE & WORKING DAYS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-[#131B2E] text-base">Weekly Working Schedule</h3>
          </div>
          <span className="text-xs text-[#64748B]">Select operational instructional days for the institution.</span>
        </div>

        {/* Day Pills */}
        <div>
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">
            Working Days (Instructional Days) *
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {WORKING_DAYS.map((d) => {
              const isActive = activeWorkingDays.includes(d.day);
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => toggleWorkingDay(d.day)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isActive
                      ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-2xs'
                      : 'bg-slate-50 text-[#64748B] border-[#E2E8F0] hover:border-[#CBD5E1]'
                  }`}
                >
                  {d.fullLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Saturday Schedule */}
        {isSaturdayWorking && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#4338CA]" />
              <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                Saturday Operating Schedule
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SATURDAY_SCHEDULE_OPTIONS.map((opt) => {
                const isSelected = (att.saturdaySchedule || 'full_day') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateAttField('saturdaySchedule', opt.value)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/70 border-[#4338CA] ring-1 ring-[#4338CA]'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <span className={`block font-bold text-xs ${isSelected ? 'text-[#4338CA]' : 'text-[#131B2E]'}`}>
                      {opt.label}
                    </span>
                    <span className="text-[11px] text-[#64748B] leading-tight block mt-0.5">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Alternate Saturday Pattern Selector */}
            {att.saturdaySchedule === 'alternate' && (
              <div className="pt-2 border-t border-slate-200/60">
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Alternate Saturday Working Pattern *
                </label>
                <select
                  value={att.alternateSaturdayPattern || '1st_3rd'}
                  onChange={(e) => updateAttField('alternateSaturdayPattern', e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                >
                  {ALTERNATE_SATURDAY_PATTERNS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {att.saturdaySchedule === 'custom' && (
              <div className="pt-2 border-t border-slate-200/60">
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Custom Saturday Details
                </label>
                <input
                  type="text"
                  value={att.customSaturdayDetails || ''}
                  onChange={(e) => updateAttField('customSaturdayDetails', e.target.value)}
                  placeholder="e.g. Remedial classes 9 AM to 12 PM, clubs & sports in afternoon"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs focus:border-[#4338CA] focus:outline-hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* CARD 5: TIMETABLE CONFIGURATION & LIVE SCHEDULE PREVIEW */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-[#131B2E] text-base">Timetable Configuration</h3>
          </div>
          <span className="text-xs text-[#64748B]">Define the basic period structure used to generate class timetables.</span>
        </div>

        {/* Periods & Duration Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Number of Periods Per Day *
            </label>
            <input
              type="number"
              min={1}
              max={12}
              value={att.periodCount ?? 8}
              onChange={(e) => updateAttField('periodCount', parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Typical standard: 7 to 9 periods.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Default Period Duration (Minutes) *
            </label>
            <input
              type="number"
              min={20}
              max={90}
              value={att.periodDurationMinutes ?? 40}
              onChange={(e) => updateAttField('periodDurationMinutes', parseInt(e.target.value, 10) || 40)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
            />
            <p className="text-[11px] text-[#64748B] mt-1">CBSE/Standard typical: 40 to 45 mins.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Timetable Schedule Structure
            </label>
            <select
              value={att.scheduleStructure || 'same_for_all'}
              onChange={(e) => updateAttField('scheduleStructure', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
            >
              {SCHEDULE_STRUCTURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B] mt-1">Grade-specific variations can be refined in ERP.</p>
          </div>
        </div>

        {/* Multi-campus Schedule Scope if applicable */}
        {hasMultipleCampuses && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#4338CA]" />
              <span className="text-xs font-bold text-[#131B2E]">Multi-Campus Timing Policy</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateAttField('multiCampusScheduleMode', 'same_for_all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  (att.multiCampusScheduleMode || 'same_for_all') === 'same_for_all'
                    ? 'bg-[#4338CA] text-white'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                Same for All Campuses
              </button>
              <button
                type="button"
                onClick={() => updateAttField('multiCampusScheduleMode', 'by_campus')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  att.multiCampusScheduleMode === 'by_campus'
                    ? 'bg-[#4338CA] text-white'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                Configure by Campus
              </button>
            </div>
          </div>
        )}

        {/* Break Structure Manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-[#4338CA]" />
              <span className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                Scheduled Breaks &amp; Recesses
              </span>
            </div>
            {!isAddingBreak && (
              <button
                type="button"
                onClick={() => setIsAddingBreak(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Break
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {breaksList.map((b) => (
              <div
                key={b.id}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#131B2E]">{b.name}</span>
                    <span className="text-[10px] font-semibold uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                      {b.type === 'lunch' ? 'Lunch' : 'Break'}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-[#64748B]">
                    {b.startTime} – {b.endTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveBreak(b.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                  title="Remove break"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Inline Add Break Form */}
          {isAddingBreak && (
            <div className="bg-indigo-50/40 border border-indigo-200 rounded-xl p-3.5 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Break Name</label>
                  <input
                    type="text"
                    value={newBreakName}
                    onChange={(e) => setNewBreakName(e.target.value)}
                    placeholder="Short Break"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#E2E8F0] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newBreakStart}
                    onChange={(e) => setNewBreakStart(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#E2E8F0] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">End Time</label>
                  <input
                    type="text"
                    value={newBreakEnd}
                    onChange={(e) => setNewBreakEnd(e.target.value)}
                    placeholder="10:15 AM"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white border border-[#E2E8F0] text-[#131B2E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#334155] mb-1">Type</label>
                  <select
                    value={newBreakType}
                    onChange={(e) => setNewBreakType(e.target.value as any)}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-[#E2E8F0] text-[#131B2E]"
                  >
                    {BREAK_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingBreak(false)}
                  className="px-3 py-1 text-xs font-semibold text-[#64748B] hover:text-[#131B2E]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddBreak}
                  className="px-3.5 py-1 text-xs font-bold bg-[#4338CA] text-white rounded-lg hover:bg-indigo-700 cursor-pointer shadow-2xs"
                >
                  Save Break
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Period Schedule Preview */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
                Live Timetable Schedule Preview
              </span>
            </div>
            <span className="text-[11px] text-[#64748B]">Auto-recalculated from start time, periods &amp; breaks</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {timetablePreview.map((slot, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-center transition ${
                  slot.type === 'break'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : slot.type === 'assembly'
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
                    : 'bg-white border-slate-200/80 text-[#131B2E] shadow-2xs'
                }`}
              >
                <span className="block text-[11px] font-bold truncate">{slot.label}</span>
                <span className="font-mono text-[10px] text-[#64748B] block mt-0.5">
                  {slot.startTime} – {slot.endTime}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                  {slot.durationMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD 6: ATTENDANCE RULES */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
          <h3 className="font-bold text-[#131B2E] text-base">Attendance Rules &amp; Thresholds</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Late Arrival Threshold (Min)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={att.lateArrivalThresholdMinutes ?? 10}
              onChange={(e) => updateAttField('lateArrivalThresholdMinutes', parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-sm font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
            />
            <p className="text-[11px] text-[#64748B] mt-1">Grace period before student is flagged late.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Late Marking Protocol
            </label>
            <select
              value={att.lateMarkingRule || 'automatic'}
              onChange={(e) => updateAttField('lateMarkingRule', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
            >
              {LATE_MARKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B] mt-1">Handling of gate arrivals past grace period.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
              Absent Marking Submission
            </label>
            <select
              value={att.absentMarkingRule || 'teacher_submits'}
              onChange={(e) => updateAttField('absentMarkingRule', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
            >
              {ABSENT_MARKING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B] mt-1">Muster register finalization workflow.</p>
          </div>
        </div>

        {/* Half-Day Rule Toggle */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-bold text-[#131B2E] block">Half-Day Attendance Rule</span>
            <span className="text-[11px] text-[#64748B] block">
              Allow recording half-day attendance for medical leaves or pre-approved early departure.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateAttField('halfDayRuleEnabled', !att.halfDayRuleEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                att.halfDayRuleEnabled ? 'bg-[#4338CA]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  att.halfDayRuleEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            {att.halfDayRuleEnabled && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#334155]">Min. School Hours:</span>
                <input
                  type="number"
                  min={20}
                  max={80}
                  value={att.halfDayThresholdPercent ?? 50}
                  onChange={(e) => updateAttField('halfDayThresholdPercent', parseInt(e.target.value, 10) || 50)}
                  className="w-16 px-2 py-1 text-xs rounded-lg bg-white border border-[#E2E8F0] text-center font-mono"
                />
                <span className="text-xs text-[#64748B]">%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 7: PARENT ATTENDANCE ALERTS */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#4338CA]" />
            <h3 className="font-bold text-[#131B2E] text-base">Parent Absence Alerts</h3>
          </div>
          <span className="text-xs text-[#64748B]">Automated notifications sent when a student is marked absent.</span>
        </div>

        {/* Multi-channel selector */}
        <div>
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">
            Absence Notification Channels *
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PARENT_ALERT_CHANNELS.map((ch) => {
              const isSelected = activeAlertChannels.includes(ch.value as AbsenceAlertChannel);
              return (
                <button
                  key={ch.value}
                  type="button"
                  onClick={() => toggleAlertChannel(ch.value as AbsenceAlertChannel)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-50 border-[#4338CA] text-[#4338CA] ring-1 ring-[#4338CA]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                  }`}
                >
                  <span>{ch.label}</span>
                  <span className="text-[10px] font-semibold opacity-70">({ch.badge})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert Dispatch Timing (if not none) */}
        {!activeAlertChannels.includes('none') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1">
                When Should Absence Alerts Be Dispatched?
              </label>
              <select
                value={att.alertTiming || 'immediate'}
                onChange={(e) => updateAttField('alertTiming', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
              >
                {ALERT_TIMING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {att.alertTiming === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1">
                  Custom Alert Dispatch Time
                </label>
                <input
                  type="text"
                  value={att.customAlertTime || '10:00 AM'}
                  onChange={(e) => updateAttField('customAlertTime', e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#131B2E]"
                />
              </div>
            )}
          </div>
        )}

        {/* Late Arrival Alert Toggle */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <span className="text-xs font-bold text-[#131B2E] block">Notify Parents on Late Arrival</span>
            <span className="text-[11px] text-[#64748B] block">
              Send an instant WhatsApp or SMS alert when student arrives after grace period.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateAttField('notifyLateArrival', !att.notifyLateArrival)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                att.notifyLateArrival ? 'bg-[#4338CA]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  att.notifyLateArrival ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            {att.notifyLateArrival && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#334155]">Late Alert Threshold:</span>
                <input
                  type="number"
                  min={5}
                  max={60}
                  value={att.lateAlertThresholdMinutes ?? att.lateArrivalThresholdMinutes ?? 10}
                  onChange={(e) => updateAttField('lateAlertThresholdMinutes', parseInt(e.target.value, 10) || 10)}
                  className="w-16 px-2 py-1 text-xs rounded-lg bg-white border border-[#E2E8F0] text-center font-mono"
                />
                <span className="text-xs text-[#64748B]">min</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CARD 8: ATTENDANCE CORRECTION & LEAVE WORKFLOW */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
          <ShieldCheck className="w-4 h-4 text-[#4338CA]" />
          <h3 className="font-bold text-[#131B2E] text-base">Attendance Correction &amp; Leave Integration</h3>
        </div>

        {/* Who can correct attendance */}
        <div>
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-2">
            Who Can Correct Attendance Records?
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {CORRECTION_ROLES.map((r) => {
              const isSelected = activeCorrectionRoles.includes(r.value as AttendanceCorrectionRole);
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleCorrectionRole(r.value as AttendanceCorrectionRole)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-50 border-[#4338CA] text-[#4338CA] ring-1 ring-[#4338CA]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Approval Required Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#131B2E] block">Correction Requires Approval</span>
              <span className="text-[11px] text-[#64748B]">Audit log required before attendance record modification.</span>
            </div>
            <button
              type="button"
              onClick={() => updateAttField('correctionRequiresApproval', !att.correctionRequiresApproval)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                att.correctionRequiresApproval ? 'bg-[#4338CA]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  att.correctionRequiresApproval ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#131B2E] block">Approved Leaves Auto-Sync</span>
              <span className="text-[11px] text-[#64748B]">Parent leave requests automatically update daily roll call.</span>
            </div>
            <button
              type="button"
              onClick={() => updateAttField('leaveAffectsAttendance', !att.leaveAffectsAttendance)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                att.leaveAffectsAttendance ? 'bg-[#4338CA]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  att.leaveAffectsAttendance ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* CARD 9: CONFIGURATION SUMMARY CARD */}
      <div className="bg-slate-50/80 border border-[#CBD5E1] rounded-2xl p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
              Attendance &amp; Timetable Configuration Summary
            </h4>
          </div>
          <span className="text-[11px] text-[#64748B]">Verified baseline for ERP &amp; platform modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Student Mode</span>
            <span className="text-xs font-bold text-[#131B2E] capitalize truncate block mt-0.5">
              {att.studentAttendanceMode || 'Daily'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Staff Mode</span>
            <span className="text-xs font-bold text-[#4338CA] capitalize truncate block mt-0.5">
              {att.staffAttendanceMode || 'Biometric'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">School Hours</span>
            <span className="text-xs font-bold text-[#131B2E] truncate block mt-0.5">
              {att.schoolStartTime || '08:00 AM'} – {att.schoolEndTime || '02:30 PM'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Working Days</span>
            <span className="text-xs font-bold text-[#131B2E] block mt-0.5">
              {activeWorkingDays.length} Days/Wk
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Periods</span>
            <span className="text-xs font-bold text-[#131B2E] block mt-0.5">
              {att.periodCount || 8} × {att.periodDurationMinutes || 40}m
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Parent Alerts</span>
            <span className="text-xs font-bold text-emerald-700 capitalize block mt-0.5">
              {activeAlertChannels[0] || 'WhatsApp'}
            </span>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-2.5 rounded-xl text-center">
            <span className="block text-[10px] font-bold text-[#64748B] uppercase">Late Grace</span>
            <span className="text-xs font-bold text-[#131B2E] block mt-0.5">
              {att.lateArrivalThresholdMinutes ?? 10} min
            </span>
          </div>
        </div>

        {/* Confirmation Action */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={att.isAttendanceConfirmed ?? false}
              onChange={(e) => updateAttField('isAttendanceConfirmed', e.target.checked)}
              className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
            />
            <span className="text-xs font-semibold text-[#131B2E]">
              I confirm these attendance policies and timetable timings reflect our school’s operating schedule.
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
