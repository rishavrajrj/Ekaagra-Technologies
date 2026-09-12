'use client';

import React from 'react';
import { Target, Compass, Sparkles, Building2 } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolAboutProps {
  data: SchoolWebsiteData;
}

export default function SchoolAbout({ data }: SchoolAboutProps) {
  const { about, school, branding, campuses } = data;

  if (!about.description && !about.vision && !about.mission && !campuses.length) {
    return null;
  }

  return (
    <section id="about" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Institutional Overview
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {about.title || `About ${school.displayName}`}
          </h2>
          {about.establishedYear && (
            <p className="text-xs font-medium text-slate-500">
              Fostering Academic Excellence Since {about.establishedYear}
            </p>
          )}
        </div>

        {/* Narrative Description */}
        {about.description ? (
          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
            <p>{about.description}</p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            Official institutional overview provided by {school.displayName}.
          </div>
        )}

        {/* Vision & Mission Cards (Only if present in database) */}
        {(about.vision || about.mission) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {about.vision && (
              <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center gap-2 text-indigo-900">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base">Our Vision</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {about.vision}
                </p>
              </div>
            )}

            {about.mission && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base">Our Mission</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {about.mission}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Core Values (if present) */}
        {about.values && about.values.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Institutional Values
            </h3>
            <div className="flex flex-wrap gap-2">
              {about.values.map((val, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
