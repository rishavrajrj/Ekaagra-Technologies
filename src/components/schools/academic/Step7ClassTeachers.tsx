'use client';

import React, { useMemo } from 'react';
import {
  Award,
  GraduationCap,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
} from 'lucide-react';
import type {
  AcademicStructureData,
  TeachingGroup,
  ClassTeacherAssignment,
  UniversalIntakeData,
  StaffMember,
} from '@/lib/types';
import {
  deriveTeachingGroups,
  getClassTeacherAssignment,
  generateAcademicId,
} from '@/lib/academicStructureUtils';
import { getFacultyById, isFacultyActive } from '@/lib/staffFacultyUtils';
import FacultySelector from './FacultySelector';

interface Step7ClassTeachersProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
  intakeData?: UniversalIntakeData;
  onNavigateToSection?: (key: any) => void;
}

export default function Step7ClassTeachers({
  structure,
  onChange,
  onNext,
  onPrev,
  intakeData,
  onNavigateToSection,
}: Step7ClassTeachersProps) {
  const classes = structure.classes || [];
  const assignments = structure.classTeacherAssignments || [];
  const teachingGroups = useMemo(() => deriveTeachingGroups(classes), [classes]);

  // Canonical Faculty members list from intakeData.staffFaculty
  const facultyList: StaffMember[] = useMemo(() => {
    return intakeData?.staffFaculty?.staffMembers || [];
  }, [intakeData?.staffFaculty?.staffMembers]);

  // Check for any inactive faculty assignments
  const inactiveAssignments = useMemo(() => {
    if (facultyList.length === 0) return [];
    return assignments.filter((a) => {
      const fid = a.teacherId || a.facultyId;
      if (!fid) return false;
      const member = getFacultyById(fid, facultyList);
      return member && !isFacultyActive(member);
    });
  }, [assignments, facultyList]);

  const handleSelectClassTeacher = (
    teachingGroupId: string,
    faculty: StaffMember | null
  ) => {
    let updated: ClassTeacherAssignment[];

    const existingIdx = assignments.findIndex(
      (a) => a.teachingGroupId === teachingGroupId
    );

    if (!faculty) {
      if (existingIdx >= 0 && assignments[existingIdx].roomNumber) {
        // Keep room number, clear teacher
        updated = assignments.map((a, idx) => {
          if (idx === existingIdx) {
            return {
              ...a,
              teacherId: undefined,
              facultyId: undefined,
              teacherName: '',
            };
          }
          return a;
        });
      } else {
        updated = assignments.filter((a) => a.teachingGroupId !== teachingGroupId);
      }
    } else {
      const code = faculty.facultyId || faculty.employeeCode || faculty.id;
      if (existingIdx >= 0) {
        updated = assignments.map((a, idx) => {
          if (idx === existingIdx) {
            return {
              ...a,
              teacherId: faculty.id,
              facultyId: code,
              teacherName: faculty.name,
            };
          }
          return a;
        });
      } else {
        const newAssignment: ClassTeacherAssignment = {
          id: generateAcademicId('cls_tch'),
          teachingGroupId,
          teacherId: faculty.id,
          facultyId: code,
          teacherName: faculty.name,
        };
        updated = [...assignments, newAssignment];
      }
    }

    onChange({
      ...structure,
      classTeacherAssignments: updated,
    });
  };

  const handleSetRoomNumber = (teachingGroupId: string, room: string) => {
    const existing = getClassTeacherAssignment(teachingGroupId, assignments);
    if (!existing) {
      if (!room.trim()) return;
      const newAssignment: ClassTeacherAssignment = {
        id: generateAcademicId('cls_tch'),
        teachingGroupId,
        teacherName: '',
        roomNumber: room.trim(),
      };
      onChange({
        ...structure,
        classTeacherAssignments: [...assignments, newAssignment],
      });
      return;
    }

    const updated = assignments.map((a) =>
      a.id === existing.id ? { ...a, roomNumber: room.trim() || undefined } : a
    );
    onChange({
      ...structure,
      classTeacherAssignments: updated,
    });
  };

  // Counts
  const assignedCount = assignments.filter((a) => {
    return Boolean(a.teacherId?.trim() || a.teacherName?.trim());
  }).length;
  const missingCount = Math.max(teachingGroups.length - assignedCount, 0);

  if (teachingGroups.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-[#131B2E]">No Teaching Groups Found</h3>
        <p className="text-xs text-[#64748B]">
          Please configure your grades and sections in Steps 2 & 3.
        </p>
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold text-xs cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-xs text-[#131B2E]">
      {/* Empty Faculty Directory Alert Banner */}
      {facultyList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-amber-900">
                Faculty Directory is Empty
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Faculty records must be created and maintained in the <strong>Faculty Section</strong> first. Academic Setup selects from your existing faculty roster.
              </p>
            </div>
          </div>
          {onNavigateToSection && (
            <button
              type="button"
              onClick={() => onNavigateToSection('staffFaculty')}
              className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Go to Faculty Section</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Inactive Faculty Assignments Alert Banner */}
      {inactiveAssignments.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-rose-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs">
              <strong>{inactiveAssignments.length} class teacher(s)</strong> are assigned to inactive or on-leave faculty. Please reassign them to active faculty members.
            </span>
          </div>
          {onNavigateToSection && (
            <button
              type="button"
              onClick={() => onNavigateToSection('staffFaculty')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0 cursor-pointer"
            >
              Manage Faculty Roster →
            </button>
          )}
        </div>
      )}

      {/* Concept Explainer Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 font-bold">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#131B2E]">What is a Class Teacher?</h4>
          <p className="text-[#64748B] leading-relaxed">
            A <strong>Class Teacher</strong> (or Homeroom / Form Tutor) is responsible for student
            pastoral care, attendance roll-call, and parent communications for an entire student group.
            Selected directly from your Faculty directory without manual text typing.
          </p>
        </div>
      </div>

      {/* Main Roster Card */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#131B2E]">
                Class Teacher Allocation ({teachingGroups.length} Groups)
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                  missingCount === 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {assignedCount} of {teachingGroups.length} Assigned
              </span>
            </div>
            <p className="text-[#64748B] text-[11px]">
              Assign an in-charge faculty member from your roster for each classroom group or division.
            </p>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 gap-3">
          {teachingGroups.map((group) => {
            const assignment = getClassTeacherAssignment(group.id, assignments);
            const isAssigned = Boolean(
              assignment?.teacherId?.trim() || assignment?.teacherName?.trim()
            );

            return (
              <div
                key={group.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isAssigned
                    ? 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                {/* Group Details */}
                <div className="space-y-1 sm:w-1/3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                    <span className="font-extrabold text-sm text-[#131B2E]">
                      {group.displayName}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    <span>Label: {group.shortLabel}</span>
                    <span className="mx-1">•</span>
                    <span className="capitalize">{group.structureType.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Assignment Controls */}
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Faculty Selector for Class Teacher */}
                  <div className="flex-1 min-w-[200px]">
                    <FacultySelector
                      selectedFacultyId={assignment?.teacherId || assignment?.facultyId}
                      legacyTeacherName={assignment?.teacherName}
                      facultyList={facultyList}
                      placeholder="Select Class Teacher..."
                      allowClear={true}
                      onSelect={(faculty) => {
                        handleSelectClassTeacher(group.id, faculty);
                      }}
                      onNavigateToFaculty={
                        onNavigateToSection
                          ? () => onNavigateToSection('staffFaculty')
                          : undefined
                      }
                    />
                  </div>

                  {/* Room number (optional) */}
                  <div className="w-full sm:w-32">
                    <input
                      type="text"
                      value={assignment?.roomNumber || ''}
                      onChange={(e) => handleSetRoomNumber(group.id, e.target.value)}
                      placeholder="Room No."
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden"
                      title="Classroom / Room Number"
                    />
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0 flex items-center justify-end">
                    {isAssigned ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-1 rounded-lg border border-amber-300">
                        <AlertCircle className="w-3 h-3" />
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Subject Teachers</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Academic Review</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
