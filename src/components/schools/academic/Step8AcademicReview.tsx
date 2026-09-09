'use client';

import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  Layers,
  BookOpen,
  Users,
  Award,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type {
  AcademicStructureData,
  SchoolProject,
  AcademicClassConfig,
  UniversalIntakeData,
} from '@/lib/types';
import {
  deriveTeachingGroups,
  getApplicableSubjectsForGroup,
  getSubjectTeacherAssignment,
  getClassTeacherAssignment,
  getAcademicSetupProgress,
  deriveSchoolAcademicSummary,
  type AcademicWarningItem,
} from '@/lib/academicStructureUtils';
import AcademicStructureTree from './AcademicStructureTree';

interface Step8AcademicReviewProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNavigateToStep: (step: number) => void;
  onPrev: () => void;
  project?: SchoolProject | null;
  intakeData?: UniversalIntakeData;
}

export default function Step8AcademicReview({
  structure,
  onChange,
  onNavigateToStep,
  onPrev,
  project,
  intakeData,
}: Step8AcademicReviewProps) {
  const classes = structure.classes || [];
  const subjects = structure.subjects || [];
  const applicability = structure.subjectApplicability || [];
  const subjectAssignments = structure.subjectTeacherAssignments || [];
  const classAssignments = structure.classTeacherAssignments || [];
  const teachingGroups = deriveTeachingGroups(classes);
  const staffMembers = intakeData?.staffFaculty?.staffMembers;
  const progress = getAcademicSetupProgress(structure, staffMembers);

  const isConfirmed = Boolean(
    structure.confirmed || structure.academicStructureConfirmed
  );

  const handleToggleConfirm = () => {
    const nextVal = !isConfirmed;
    if (nextVal) {
      if (classes.length === 0) {
        alert('Cannot complete setup: Please add at least one Grade or Class in Step 2.');
        onNavigateToStep(2);
        return;
      }
      if (!progress.step1.isComplete) {
        alert('Cannot complete setup: Please configure valid academic session dates in Step 1.');
        onNavigateToStep(1);
        return;
      }
      const errorWarnings = progress.warnings.filter((w) => w.severity === 'error');
      if (errorWarnings.length > 0) {
        alert(`Cannot complete setup: Please fix the following critical issue first:\n• ${errorWarnings[0].message}`);
        onNavigateToStep(errorWarnings[0].targetStep);
        return;
      }

      onChange({
        ...structure,
        confirmed: true,
        academicStructureConfirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedByName: project?.primary_contact_name || 'Authorized School Administrator',
        structureStatus: 'confirmed',
      });
    } else {
      onChange({
        ...structure,
        confirmed: false,
        academicStructureConfirmed: false,
        structureStatus: 'review_required',
      });
    }
  };

  const handleWarningAction = (w: AcademicWarningItem) => {
    onNavigateToStep(w.targetStep);
  };

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold">
            <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Academic Grades</span>
          </div>
          <div className="text-xl font-extrabold text-[#131B2E]">
            {classes.length}
          </div>
          <span className="text-[10px] text-[#94A3B8]">Configured levels</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold">
            <Layers className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Teaching Groups</span>
          </div>
          <div className="text-xl font-extrabold text-[#131B2E]">
            {teachingGroups.length}
          </div>
          <span className="text-[10px] text-[#94A3B8]">Classroom divisions</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Catalog Subjects</span>
          </div>
          <div className="text-xl font-extrabold text-[#131B2E]">
            {subjects.length}
          </div>
          <span className="text-[10px] text-[#94A3B8]">Reusable courses</span>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[#64748B] text-[11px] font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Faculty Assigned</span>
          </div>
          <div className="text-xl font-extrabold text-[#131B2E]">
            {progress.step6.assignedCount} / {progress.step6.totalRequired}
          </div>
          <span className="text-[10px] text-[#94A3B8]">Subject teachers</span>
        </div>
      </div>

      {/* Warnings & Incomplete Alert Card */}
      {progress.warnings.length > 0 ? (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B45309]" />
            <h3 className="font-bold text-sm text-[#78350F]">
              Academic Structure Notice ({progress.warnings.length} items to review)
            </h3>
          </div>
          <p className="text-xs text-[#92400E] leading-relaxed">
            The following assignments or configurations are incomplete. You may fix them now using the
            direct action buttons or proceed if your school's data is still being compiled.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {progress.warnings.map((w) => (
              <div
                key={w.id}
                className="bg-white/90 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-[#131B2E]">{w.title}:</span>
                    <span className="text-xs text-[#475569] truncate">{w.message}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#94A3B8]">
                    Found in Step {w.step}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleWarningAction(w)}
                  className="px-3 py-1.5 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shrink-0 shadow-xs transition cursor-pointer"
                >
                  {w.actionLabel || 'Fix Issue'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-xs text-emerald-950">
              Academic Structure 100% Configured & Validated
            </h4>
            <p className="text-[11px] text-emerald-800">
              All grades, sections, streams, subjects, subject teachers, and class teachers are
              assigned without errors.
            </p>
          </div>
        </div>
      )}

      {/* Campus-Specific Academic Scope Breakdown */}
      {(() => {
        const academicSummary = deriveSchoolAcademicSummary(
          intakeData?.campuses,
          structure,
          intakeData?.schoolProfile
        );
        if (academicSummary.campusBreakdowns.length === 0) return null;

        return (
          <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">
                    Campus-Specific Academic Distribution
                  </h3>
                  <p className="text-[#64748B] text-[11px]">
                    Independent academic scopes and class allocations across campuses.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  academicSummary.isConsolidated
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {academicSummary.isConsolidated
                  ? 'Consolidated Curriculum'
                  : 'Multi-Campus Distinct Scopes'}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 text-xs">
              <span className="font-extrabold text-sm text-[#131B2E]">
                {academicSummary.headlineSummary}
              </span>
              <span className="text-[#64748B] font-medium text-[11px]">
                • {academicSummary.subSummary}
              </span>
              {academicSummary.isConsolidated && academicSummary.consolidatedClassRange && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Shared: {academicSummary.consolidatedClassRange}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {academicSummary.campusBreakdowns.map((b) => (
                <div
                  key={b.campusId}
                  className="bg-[#FAF7F2] border border-[#E2E8F0] p-3.5 rounded-xl space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-[#131B2E] truncate">{b.campusName}</span>
                    {b.isMainCampus && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 shrink-0">
                        Main
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Level:</span>
                      <span className="font-semibold text-[#4338CA]">{b.levelSummary}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Classes:</span>
                      <span className="font-semibold text-[#131B2E]">{b.classRange}</span>
                    </div>
                    {b.schoolType && (
                      <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-200">
                        Wing: {b.schoolType}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Live Tree Preview Component */}
      <AcademicStructureTree structure={structure} onNavigateToStep={onNavigateToStep} />

      {/* Grade-by-Grade Detailed Breakdown */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">Grade-by-Grade Summary</h3>
            <p className="text-[#64748B] text-[11px]">
              Complete breakdown of sections, curriculum subjects, and teacher allocations per grade.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {classes.map((cls) => {
            const hasStreams = Array.isArray(cls.streams) && cls.streams.length > 0;
            const secList = (cls.sections || []).map((s) => (typeof s === 'string' ? s : s.name));

            // Find all teaching groups belonging to this class
            const classGroups = teachingGroups.filter((g) => g.classId === cls.id);

            // Compute subject count & teacher count
            let totalSubAssignmentsNeeded = 0;
            let totalSubAssignmentsFilled = 0;
            let totalClassTeachersFilled = 0;

            for (const g of classGroups) {
              const appSubs = getApplicableSubjectsForGroup(g, subjects, applicability);
              totalSubAssignmentsNeeded += appSubs.length;
              for (const s of appSubs) {
                const a = getSubjectTeacherAssignment(g.id, s.id!, subjectAssignments);
                if (a?.teacherName && a.teacherName.trim()) totalSubAssignmentsFilled++;
              }
              const ct = getClassTeacherAssignment(g.id, classAssignments);
              if (ct?.teacherName && ct.teacherName.trim()) totalClassTeachersFilled++;
            }

            const isClassFullyAssigned =
              totalSubAssignmentsNeeded > 0 &&
              totalSubAssignmentsFilled >= totalSubAssignmentsNeeded &&
              totalClassTeachersFilled >= classGroups.length;

            return (
              <div
                key={cls.id}
                className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#4338CA]" />
                    <span className="font-extrabold text-sm text-[#131B2E]">{cls.name}</span>
                    {cls.level && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-white text-[#475569] rounded border border-[#E2E8F0]">
                        {cls.level}
                      </span>
                    )}
                  </div>

                  {isClassFullyAssigned ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> Complete
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="w-3 h-3" /> Incomplete
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Structure</span>
                    <span className="font-bold text-[#334155]">
                      {hasStreams
                        ? `${cls.streams!.length} Streams`
                        : secList.length > 0
                        ? `${secList.length} Sections (${secList.join(', ')})`
                        : 'Single Group'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Subject Teachers</span>
                    <span className="font-bold text-[#334155]">
                      {totalSubAssignmentsFilled} / {totalSubAssignmentsNeeded}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#94A3B8] block">Class Teachers</span>
                    <span className="font-bold text-[#334155]">
                      {totalClassTeachersFilled} / {classGroups.length}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation & Authorization Control */}
      <div
        className={`border rounded-2xl p-5 shadow-2xs transition ${
          isConfirmed
            ? 'bg-emerald-50/40 border-emerald-300'
            : 'bg-white border-[#E2E8F0]'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="pt-0.5">
            <input
              id="review-academic-structure-confirm"
              type="checkbox"
              checked={isConfirmed}
              onChange={handleToggleConfirm}
              className="w-5 h-5 rounded-md text-[#4338CA] focus:ring-[#4338CA]/20 border-[#CBD5E1] cursor-pointer"
            />
          </div>
          <div className="space-y-1 flex-1">
            <label
              htmlFor="review-academic-structure-confirm"
              className="font-bold text-sm text-[#131B2E] block cursor-pointer select-none"
            >
              Academic Structure Authorization & Confirmation
            </label>
            <p className="text-[11px] text-[#475569] leading-relaxed">
              I certify that the academic session dates ({structure.currentAcademicSession}), curriculum
              disciplines, and class teaching groups configured above accurately represent our school's
              educational structure.
            </p>

            {isConfirmed && structure.confirmedAt && (
              <div className="pt-1.5 text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Confirmed on {new Date(structure.confirmedAt).toLocaleDateString()} at{' '}
                  {new Date(structure.confirmedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  by {structure.confirmedByName || 'Authorized Administrator'}
                </span>
              </div>
            )}
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
          <span>Back: Class Teachers</span>
        </button>

        <div className="flex items-center gap-2">
          {progress.warnings.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigateToStep(progress.warnings[0].targetStep)}
              className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#4338CA] border border-[#CBD5E1] font-bold text-xs transition cursor-pointer"
            >
              Fix First Issue
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (!isConfirmed) {
                handleToggleConfirm();
              } else {
                alert('Academic Structure configuration is verified and complete!');
              }
            }}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer ${
              isConfirmed
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#4338CA] hover:bg-[#3730A3] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isConfirmed ? 'Academic Setup Complete' : 'Confirm & Complete Academic Setup'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
