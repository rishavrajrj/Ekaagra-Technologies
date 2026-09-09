'use client';

import React, { useState } from 'react';
import {
  GitFork,
  Calendar,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type {
  AcademicStructureData,
  AcademicClassConfig,
  AcademicSubjectConfig,
  SubjectApplicabilityConfig,
  SubjectTeacherAssignment,
  ClassTeacherAssignment,
} from '@/lib/types';
import {
  deriveTeachingGroups,
  getApplicableSubjectsForGroup,
  getSubjectTeacherAssignment,
  getClassTeacherAssignment,
} from '@/lib/academicStructureUtils';

interface AcademicStructureTreeProps {
  structure: AcademicStructureData;
  onNavigateToStep?: (step: number) => void;
}

export default function AcademicStructureTree({
  structure,
  onNavigateToStep,
}: AcademicStructureTreeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const classes = structure.classes || [];
  const teachingGroups = deriveTeachingGroups(classes);
  const subjects = structure.subjects || [];
  const applicability = structure.subjectApplicability || [];
  const subjectAssignments = structure.subjectTeacherAssignments || [];
  const classAssignments = structure.classTeacherAssignments || [];

  return (
    <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
            <GitFork className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-[#131B2E] flex items-center gap-2">
              Academic Structure Hierarchy
              <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </h3>
            <p className="text-[#64748B] text-[11px]">
              Visual breakdown of academic levels, streams, sections, and teaching groups.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] font-semibold text-[#4338CA] hover:text-[#3730A3] p-1.5 rounded-lg hover:bg-[#EEF2FF] transition cursor-pointer"
        >
          {isExpanded ? (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Expand Tree</span>
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="pt-1 text-xs">
          {classes.length === 0 ? (
            <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-xl p-4 text-center space-y-1">
              <p className="text-xs font-semibold text-[#475569]">
                No classes configured yet to preview.
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                Add your school's classes or load standard defaults in Step 2.
              </p>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(2)}
                  className="mt-2 text-xs text-[#4338CA] font-bold hover:underline cursor-pointer"
                >
                  Go to Step 2: Add Grades & Classes →
                </button>
              )}
            </div>
          ) : (
            <div className="font-mono text-xs text-[#334155] space-y-1 overflow-x-auto p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              {/* Root Academic Year */}
              <div className="flex items-center gap-2 font-bold text-[#131B2E] text-xs">
                <Calendar className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>{structure.currentAcademicSession || '2026-2027'}</span>
                <span className="text-[10px] text-[#64748B] font-sans font-normal">
                  ({structure.effectiveCurriculum || structure.board || 'CBSE'})
                </span>
              </div>

              {/* Classes branches */}
              <div className="pl-4 space-y-2.5 pt-1 border-l-2 border-[#CBD5E1] ml-1.5">
                {classes.map((cls, cIdx) => {
                  const hasStreams = Array.isArray(cls.streams) && cls.streams.length > 0;
                  const secList = (cls.sections || []).map((s) =>
                    typeof s === 'string' ? s : s.name
                  );

                  return (
                    <div key={cls.id || cIdx} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#94A3B8]">├──</span>
                        <GraduationCap className="w-3 h-3 text-[#4338CA]" />
                        <span className="font-bold text-[#131B2E] font-sans">
                          {cls.name}
                        </span>
                        {cls.level && (
                          <span className="text-[9px] font-sans font-medium px-1.5 py-0.2 bg-[#F1F5F9] text-[#64748B] rounded border border-[#E2E8F0]">
                            {cls.level}
                          </span>
                        )}
                      </div>

                      {/* Case 1: Streams (Structure C & D) */}
                      {hasStreams ? (
                        <div className="pl-6 space-y-1.5 border-l border-[#CBD5E1]/60 ml-2">
                          {cls.streams!.map((strm, sIdx) => {
                            const streamSecList = (strm.sections || []).map((s) =>
                              typeof s === 'string' ? s : s.name
                            );

                            return (
                              <div key={strm.id || sIdx} className="space-y-1">
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className="text-[#94A3B8]">├──</span>
                                  <Layers className="w-3 h-3 text-[#D97706]" />
                                  <span className="font-semibold text-[#B45309] font-sans">
                                    Stream: {strm.name}
                                  </span>
                                </div>

                                {streamSecList.length > 0 ? (
                                  <div className="pl-6 space-y-0.5 border-l border-[#CBD5E1]/40 ml-2">
                                    {streamSecList.map((sec, secIdx) => {
                                      const groupId = `tg_${cls.id}_${strm.id}_${sec.toLowerCase()}`;
                                      const group = teachingGroups.find((g) => g.id === groupId);
                                      const groupSubs = group
                                        ? getApplicableSubjectsForGroup(group, subjects, applicability)
                                        : [];
                                      const classTeacher = group
                                        ? getClassTeacherAssignment(group.id, classAssignments)
                                        : undefined;

                                      return (
                                        <div
                                          key={secIdx}
                                          className="flex items-center gap-2 text-[10px] text-[#64748B] font-sans flex-wrap"
                                        >
                                          <span className="text-[#94A3B8] font-mono">└──</span>
                                          <span className="font-bold text-[#4338CA] px-1.5 py-0.2 bg-[#EEF2FF] rounded border border-[#C7D2FE]">
                                            Section {sec}
                                          </span>
                                          <span className="text-[#94A3B8]">•</span>
                                          <span>{groupSubs.length} Subjects</span>
                                          {classTeacher?.teacherName && (
                                            <>
                                              <span className="text-[#94A3B8]">•</span>
                                              <span className="text-emerald-700 font-medium">
                                                CT: {classTeacher.teacherName}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="pl-6 text-[10px] text-[#94A3B8] font-sans">
                                    └── (No stream sections)
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : secList.length > 0 ? (
                        /* Case 2: Sections Only (Structure B) */
                        <div className="pl-6 space-y-0.5 border-l border-[#CBD5E1]/60 ml-2">
                          {secList.map((sec, sIdx) => {
                            const groupId = `tg_${cls.id}_sec_${sec.toLowerCase()}`;
                            const group = teachingGroups.find((g) => g.id === groupId);
                            const groupSubs = group
                              ? getApplicableSubjectsForGroup(group, subjects, applicability)
                              : [];
                            const classTeacher = group
                              ? getClassTeacherAssignment(group.id, classAssignments)
                              : undefined;

                            return (
                              <div
                                key={sIdx}
                                className="flex items-center gap-2 text-[10px] text-[#64748B] font-sans flex-wrap"
                              >
                                <span className="text-[#94A3B8] font-mono">└──</span>
                                <span className="font-bold text-[#4338CA] px-1.5 py-0.2 bg-[#EEF2FF] rounded border border-[#C7D2FE]">
                                  Section {sec}
                                </span>
                                <span className="text-[#94A3B8]">•</span>
                                <span>{groupSubs.length} Subjects</span>
                                {classTeacher?.teacherName && (
                                  <>
                                    <span className="text-[#94A3B8]">•</span>
                                    <span className="text-emerald-700 font-medium">
                                      CT: {classTeacher.teacherName}
                                    </span>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Case 3: Grade Only (Structure A) */
                        <div className="pl-6 text-[10px] text-[#64748B] font-sans flex items-center gap-2">
                          <span className="text-[#94A3B8] font-mono">└──</span>
                          <span className="italic text-[#94A3B8]">(Single teaching group — no sections)</span>
                          {(() => {
                            const group = teachingGroups.find((g) => g.id === `tg_${cls.id}`);
                            const groupSubs = group
                              ? getApplicableSubjectsForGroup(group, subjects, applicability)
                              : [];
                            const classTeacher = group
                              ? getClassTeacherAssignment(group.id, classAssignments)
                              : undefined;

                            return (
                              <>
                                <span className="text-[#94A3B8]">•</span>
                                <span>{groupSubs.length} Subjects</span>
                                {classTeacher?.teacherName && (
                                  <>
                                    <span className="text-[#94A3B8]">•</span>
                                    <span className="text-emerald-700 font-medium">
                                      CT: {classTeacher.teacherName}
                                    </span>
                                  </>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
