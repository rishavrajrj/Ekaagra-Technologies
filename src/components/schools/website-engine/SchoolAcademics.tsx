'use client';

import React from 'react';
import { BookOpen, GraduationCap, Calendar, CheckCircle2 } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolAcademicsProps {
  data: SchoolWebsiteData;
}

export default function SchoolAcademics({ data }: SchoolAcademicsProps) {
  const { academics, school, branding } = data;

  return (
    <section id="academics" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Academic Programs
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Curriculum &amp; Educational Structure
          </h2>
          <p className="text-xs text-slate-500">
            Current Academic Session: <strong className="text-slate-800 font-bold">{academics.currentSession}</strong> • Affiliated to <strong className="text-slate-800 font-bold">{school.board}</strong>
          </p>
        </div>

        {/* Classes Offered Badges */}
        {academics.classesOffered.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grades &amp; Classes Offered
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {academics.classesOffered.map((cls, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1 hover:border-indigo-300 transition"
                >
                  <div className="text-xs font-extrabold text-slate-900">{cls}</div>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            Grade levels and class schedules are administered under {school.board} guidelines.
          </div>
        )}

        {/* Academic Streams (if Senior Secondary) */}
        {academics.streams.length > 0 && (
          <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>Senior Secondary Academic Streams</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {academics.streams.map((stream, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-900 shadow-2xs"
                >
                  {stream}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Curriculum Summary */}
        {academics.curriculumSummary && (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Curriculum &amp; Pedagogical Approach</span>
            </h4>
            <p>{academics.curriculumSummary}</p>
          </div>
        )}
      </div>
    </section>
  );
}
