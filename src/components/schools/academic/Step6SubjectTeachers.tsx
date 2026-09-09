'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  GraduationCap,
  Layers,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  Filter,
} from 'lucide-react';
import type {
  AcademicStructureData,
  TeachingGroup,
  AcademicSubjectConfig,
  SubjectTeacherAssignment,
  UniversalIntakeData,
  StaffMember,
} from '@/lib/types';
import {
  deriveTeachingGroups,
  getApplicableSubjectsForGroup,
  getSubjectTeacherAssignment,
  generateAcademicId,
} from '@/lib/academicStructureUtils';
import { getFacultyById, isFacultyActive } from '@/lib/staffFacultyUtils';
import FacultySelector from './FacultySelector';

interface Step6SubjectTeachersProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
  intakeData?: UniversalIntakeData;
  onNavigateToSection?: (key: any) => void;
}

export default function Step6SubjectTeachers({
  structure,
  onChange,
  onNext,
  onPrev,
  intakeData,
  onNavigateToSection,
}: Step6SubjectTeachersProps) {
  const classes = structure.classes || [];
  const subjects = structure.subjects || [];
  const applicability = structure.subjectApplicability || [];
  const assignments = structure.subjectTeacherAssignments || [];

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

  // Active filter by Teaching Group
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    teachingGroups[0]?.id || ''
  );

  const [groupFilter, setGroupFilter] = useState<'selected' | 'all'>('selected');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  // Selected group object
  const activeGroup =
    teachingGroups.find((g) => g.id === selectedGroupId) || teachingGroups[0];

  // Handler to assign or update teacher for a specific teaching group & subject using Faculty record
  const handleSelectTeacher = (
    teachingGroupId: string,
    subjectId: string,
    faculty: StaffMember | null
  ) => {
    let updated: SubjectTeacherAssignment[];

    const existingIdx = assignments.findIndex(
      (a) => a.teachingGroupId === teachingGroupId && a.subjectId === subjectId
    );

    if (!faculty) {
      // If cleared, retain record if co-teacher is present
      if (existingIdx >= 0 && assignments[existingIdx].secondaryTeacherName) {
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
        updated = assignments.filter(
          (a) => !(a.teachingGroupId === teachingGroupId && a.subjectId === subjectId)
        );
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
        const newAssignment: SubjectTeacherAssignment = {
          id: generateAcademicId('sub_tch'),
          teachingGroupId,
          subjectId,
          teacherId: faculty.id,
          facultyId: code,
          teacherName: faculty.name,
        };
        updated = [...assignments, newAssignment];
      }
    }

    onChange({
      ...structure,
      subjectTeacherAssignments: updated,
    });
  };

  const handleSelectCoTeacher = (
    teachingGroupId: string,
    subjectId: string,
    faculty: StaffMember | null
  ) => {
    const existing = getSubjectTeacherAssignment(teachingGroupId, subjectId, assignments);
    if (!existing && !faculty) return;

    let updated: SubjectTeacherAssignment[];
    if (!existing && faculty) {
      const code = faculty.facultyId || faculty.employeeCode || faculty.id;
      const newAssignment: SubjectTeacherAssignment = {
        id: generateAcademicId('sub_tch'),
        teachingGroupId,
        subjectId,
        teacherName: '',
        secondaryTeacherId: faculty.id,
        secondaryFacultyId: code,
        secondaryTeacherName: faculty.name,
      };
      updated = [...assignments, newAssignment];
    } else if (existing) {
      const code = faculty ? (faculty.facultyId || faculty.employeeCode || faculty.id) : undefined;
      updated = assignments.map((a) => {
        if (a.id === existing.id) {
          return {
            ...a,
            secondaryTeacherId: faculty ? faculty.id : undefined,
            secondaryFacultyId: code,
            secondaryTeacherName: faculty ? faculty.name : undefined,
          };
        }
        return a;
      });
    } else {
      return;
    }

    onChange({
      ...structure,
      subjectTeacherAssignments: updated,
    });
  };

  // Groups to display
  const displayGroups = useMemo(() => {
    if (groupFilter === 'all') {
      return teachingGroups;
    }
    return activeGroup ? [activeGroup] : [];
  }, [groupFilter, teachingGroups, activeGroup]);

  // Overall counts
  const totalSubjectRequirements = useMemo(() => {
    return teachingGroups.reduce((acc, g) => {
      const subs = getApplicableSubjectsForGroup(g, subjects, applicability);
      return acc + subs.length;
    }, 0);
  }, [teachingGroups, subjects, applicability]);

  const assignedCount = assignments.filter((a) => {
    return Boolean(a.teacherId?.trim() || a.teacherName?.trim());
  }).length;
  const missingCount = Math.max(totalSubjectRequirements - assignedCount, 0);

  if (teachingGroups.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-[#131B2E]">No Teaching Groups Found</h3>
        <p className="text-xs text-[#64748B]">
          Please configure your grades in Step 2 and sections in Step 3.
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
              <strong>{inactiveAssignments.length} assignment(s)</strong> are assigned to inactive or on-leave faculty. Please reassign them to active faculty members.
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
          <h4 className="font-bold text-[#131B2E]">What is a Subject Teacher Assignment?</h4>
          <p className="text-[#64748B] leading-relaxed">
            A Subject Teacher Assignment links a <strong>Teaching Group</strong> (e.g. Class 10-A), a{' '}
            <strong>Subject</strong> (e.g. Mathematics), and a <strong>Teacher</strong> selected from your Faculty directory.
            Assignments use stable Faculty IDs so teacher profile changes update automatically.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-visible space-y-4">
        {/* Teaching Group Selector */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 overflow-x-auto flex items-center justify-between gap-3 scrollbar-thin rounded-t-2xl">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {teachingGroups.map((g) => {
              const isSelected = g.id === activeGroup?.id;
              const applicable = getApplicableSubjectsForGroup(g, subjects, applicability);
              const groupAssigned = applicable.filter((sub) => {
                const a = getSubjectTeacherAssignment(g.id, sub.id!, assignments);
                return Boolean(a?.teacherId?.trim() || a?.teacherName?.trim());
              }).length;
              const isGroupComplete = applicable.length > 0 && groupAssigned === applicable.length;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGroupId(g.id);
                    setGroupFilter('selected');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected && groupFilter === 'selected'
                      ? 'bg-[#4338CA] text-white shadow-xs'
                      : 'bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]'
                  }`}
                >
                  <span>{g.shortLabel}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected && groupFilter === 'selected'
                        ? 'bg-white/20 text-white'
                        : isGroupComplete
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {groupAssigned}/{applicable.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setGroupFilter(groupFilter === 'all' ? 'selected' : 'all')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                groupFilter === 'all'
                  ? 'bg-[#4338CA] text-white border-[#4338CA]'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              {groupFilter === 'all' ? 'Viewing All Groups' : 'View All Groups'}
            </button>
          </div>
        </div>

        {/* Work Area */}
        <div className="p-5 space-y-6">
          {/* Status summary banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#131B2E]">
                  Subject Teacher Allocation
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                    missingCount === 0 && totalSubjectRequirements > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {assignedCount} of {totalSubjectRequirements} Assigned
                </span>
              </div>
              <p className="text-[#64748B] text-[11px]">
                Select teachers from your Faculty Directory for each subject. No manual typing required.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-[#475569] font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMissingOnly}
                  onChange={(e) => setShowMissingOnly(e.target.checked)}
                  className="rounded text-[#4338CA] focus:ring-[#4338CA]/20 border-[#CBD5E1]"
                />
                <span>Show missing assignments only</span>
              </label>
            </div>
          </div>

          {/* Groups Roster */}
          <div className="space-y-6">
            {displayGroups.map((group) => {
              const applicable = getApplicableSubjectsForGroup(group, subjects, applicability);
              const visibleSubs = showMissingOnly
                ? applicable.filter((sub) => {
                    const a = getSubjectTeacherAssignment(group.id, sub.id!, assignments);
                    return !a?.teacherId?.trim() && !a?.teacherName?.trim();
                  })
                : applicable;

              return (
                <div
                  key={group.id}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                      <h4 className="font-extrabold text-sm text-[#131B2E]">
                        {group.displayName}
                      </h4>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        ({group.structureType.replace(/_/g, ' ')})
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-[#64748B]">
                      {applicable.length} Subjects in Curriculum
                    </span>
                  </div>

                  {applicable.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-dashed border-[#CBD5E1] text-center space-y-1">
                      <p className="font-semibold text-xs text-[#475569]">
                        No subjects mapped to {group.displayName} yet.
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Return to Step 5 (Subject Applicability) to choose which subjects this group studies.
                      </p>
                    </div>
                  ) : visibleSubs.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All subject teachers are assigned for this teaching group!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {visibleSubs.map((sub) => {
                        const assignment = getSubjectTeacherAssignment(
                          group.id,
                          sub.id!,
                          assignments
                        );
                        const isAssigned = Boolean(
                          assignment?.teacherId?.trim() || assignment?.teacherName?.trim()
                        );

                        return (
                          <div
                            key={sub.id}
                            className={`p-3 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                              isAssigned
                                ? 'bg-white border-[#E2E8F0]'
                                : 'bg-amber-50/40 border-amber-200'
                            }`}
                          >
                            {/* Subject Info */}
                            <div className="space-y-0.5 lg:w-1/4">
                              <div className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
                                <span className="font-bold text-xs text-[#131B2E]">
                                  {sub.name}
                                </span>
                                {sub.code && (
                                  <span className="text-[10px] font-mono text-[#94A3B8]">
                                    [{sub.code}]
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                                <span className="capitalize">{sub.category || 'core'}</span>
                                <span>•</span>
                                <span className="capitalize">{sub.subjectType || 'theory'}</span>
                              </div>
                            </div>

                            {/* Faculty Selectors (Primary & Co-Teacher) */}
                            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                              {/* Primary Teacher Selector */}
                              <div className="flex-1 min-w-[200px]">
                                <FacultySelector
                                  selectedFacultyId={assignment?.teacherId || assignment?.facultyId}
                                  legacyTeacherName={assignment?.teacherName}
                                  facultyList={facultyList}
                                  subjectContext={sub.name}
                                  placeholder="Select Subject Teacher..."
                                  allowClear={true}
                                  onSelect={(faculty) => {
                                    handleSelectTeacher(group.id, sub.id!, faculty);
                                  }}
                                  onNavigateToFaculty={
                                    onNavigateToSection
                                      ? () => onNavigateToSection('staffFaculty')
                                      : undefined
                                  }
                                />
                              </div>

                              {/* Co-teacher optional selector */}
                              <div className="w-full sm:w-56">
                                <FacultySelector
                                  selectedFacultyId={assignment?.secondaryTeacherId || assignment?.secondaryFacultyId}
                                  legacyTeacherName={assignment?.secondaryTeacherName}
                                  facultyList={facultyList}
                                  subjectContext={sub.name}
                                  placeholder="Co-Teacher (Optional)..."
                                  allowClear={true}
                                  onSelect={(faculty) => {
                                    handleSelectCoTeacher(group.id, sub.id!, faculty);
                                  }}
                                  onNavigateToFaculty={
                                    onNavigateToSection
                                      ? () => onNavigateToSection('staffFaculty')
                                      : undefined
                                  }
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
                                    Missing
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
          <span>Back: Subject Applicability</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Class Teachers</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
