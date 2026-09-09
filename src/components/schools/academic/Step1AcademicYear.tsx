'use client';

import React from 'react';
import { Calendar, BookOpen, Info, ArrowRight, Check } from 'lucide-react';
import type { AcademicStructureData } from '@/lib/types';
import {
  DEFAULT_CURRICULUM_BOARDS,
  DEFAULT_NAMING_CONVENTIONS,
} from '@/lib/academicStructureUtils';

interface Step1AcademicYearProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  canonicalSchoolBoard?: string;
}

export default function Step1AcademicYear({
  structure,
  onChange,
  onNext,
  canonicalSchoolBoard,
}: Step1AcademicYearProps) {
  const startDate = structure.sessionStartDate || '';
  const endDate = structure.sessionEndDate || '';
  const isDateOrderValid =
    !startDate ||
    !endDate ||
    new Date(endDate).getTime() > new Date(startDate).getTime();

  return (
    <div className="space-y-5 text-xs text-[#131B2E]">
      {/* Concept Explainer Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 font-bold">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#131B2E]">What is an Academic Year?</h4>
          <p className="text-[#64748B] leading-relaxed">
            The Academic Year defines the active period for which your classes, curriculum, students, and
            teacher assignments apply. It acts as the parent timeline for your entire academic operations.
          </p>
        </div>
      </div>

      {/* Card 1: Academic Session & Operating Dates */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F1F5F9]">
          <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">Academic Session & Term Dates</h3>
            <p className="text-[#64748B] text-[11px]">
              Specify the session label and the official starting and concluding dates.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-[#334155] mb-1">
              Academic Session Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={structure.currentAcademicSession || ''}
              onChange={(e) =>
                onChange({ ...structure, currentAcademicSession: e.target.value })
              }
              placeholder="e.g. 2026-2027 or 2026-27"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
            />
            <span className="text-[10px] text-[#94A3B8] mt-1 block">
              Used in report cards, timetable, and student admissions
            </span>
          </div>

          <div>
            <label className="block font-bold text-[#334155] mb-1">
              Session Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={structure.sessionStartDate || ''}
              onChange={(e) =>
                onChange({ ...structure, sessionStartDate: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
            />
            <span className="text-[10px] text-[#94A3B8] mt-1 block">
              First day of academic session
            </span>
          </div>

          <div>
            <label className="block font-bold text-[#334155] mb-1">
              Session End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={structure.sessionEndDate || ''}
              onChange={(e) =>
                onChange({ ...structure, sessionEndDate: e.target.value })
              }
              className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${
                !isDateOrderValid ? 'border-rose-400 bg-rose-50/20' : 'border-[#E2E8F0]'
              } text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium`}
            />
            {!isDateOrderValid ? (
              <span className="text-[10px] text-rose-500 mt-1 block font-semibold">
                End date must be after start date
              </span>
            ) : (
              <span className="text-[10px] text-[#94A3B8] mt-1 block">
                Last day of academic session
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card 2: Curriculum Board & Naming Convention */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F1F5F9]">
          <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">
              Governing Curriculum Board & Naming Convention
            </h3>
            <p className="text-[#64748B] text-[11px]">
              Configure your governing education board and how grade levels are displayed.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-[#334155] mb-1">
              Curriculum / Affiliation Board <span className="text-rose-500">*</span>
            </label>
            <select
              value={structure.board || 'CBSE'}
              onChange={(e) => onChange({ ...structure, board: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
            >
              {DEFAULT_CURRICULUM_BOARDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {canonicalSchoolBoard && structure.board === canonicalSchoolBoard && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md mt-1.5 border border-emerald-200/60">
                <Check className="w-3 h-3 text-emerald-600" />
                Consistent with School Identity Profile
              </span>
            )}

            {structure.board === 'Other' && (
              <div className="mt-3">
                <label className="block font-bold text-[#334155] mb-1">
                  Custom Board Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={structure.customBoard || ''}
                  onChange={(e) => onChange({ ...structure, customBoard: e.target.value })}
                  placeholder="Enter governing educational board or affiliation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-[#334155] mb-1">
              Class / Grade Naming Terminology
            </label>
            <select
              value={structure.namingConvention || 'Class'}
              onChange={(e) =>
                onChange({ ...structure, namingConvention: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
            >
              {DEFAULT_NAMING_CONVENTIONS.map((n) => (
                <option key={n} value={n}>
                  {n === 'Class' && 'Class (e.g. Class 1, Class 2)'}
                  {n === 'Grade' && 'Grade (e.g. Grade 1, Grade 2)'}
                  {n === 'Standard' && 'Standard (e.g. Standard 1, Standard 2)'}
                  {n === 'Custom' && 'Custom Terminology'}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[#94A3B8] mt-1 block">
              Controls terminology displayed across prospectus, admissions, and website
            </span>

            {structure.namingConvention === 'Custom' && (
              <div className="mt-3">
                <label className="block font-bold text-[#334155] mb-1">
                  Custom Terminology <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={structure.customNamingConvention || ''}
                  onChange={(e) =>
                    onChange({
                      ...structure,
                      customNamingConvention: e.target.value,
                    })
                  }
                  placeholder="e.g. Year, Form, Stage, Level"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Grades / Classes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
