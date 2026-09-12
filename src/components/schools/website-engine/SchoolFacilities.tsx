'use client';

import React from 'react';
import { Building2, Check, Sparkles } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolFacilitiesProps {
  data: SchoolWebsiteData;
}

export default function SchoolFacilities({ data }: SchoolFacilitiesProps) {
  const { facilities, campuses, school, branding } = data;
  const applicableFacilities = facilities.filter((f) => f.isApplicable && f.isAvailable);

  if (applicableFacilities.length === 0 && campuses.length === 0) {
    return null;
  }

  return (
    <section id="facilities" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Campus Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Learning Spaces &amp; Campus Amenities
          </h2>
          <p className="text-xs text-slate-500">
            State-of-the-art campus infrastructure designed to foster academic rigor and holistic development.
          </p>
        </div>

        {/* Facilities Grid */}
        {applicableFacilities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {applicableFacilities.map((facility) => (
              <div
                key={facility.key}
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs flex flex-col hover:border-indigo-300 transition"
              >
                {facility.imageUrl ? (
                  <div className="h-40 overflow-hidden bg-slate-100">
                    <img
                      src={facility.imageUrl}
                      alt={facility.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-indigo-400">
                    <Building2 className="w-8 h-8 opacity-70" />
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {facility.name}
                      </h3>
                      {facility.capacityOrCount !== undefined && facility.capacityOrCount !== null && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {facility.capacityOrCount}
                        </span>
                      )}
                    </div>
                    {facility.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {facility.description}
                      </p>
                    )}
                  </div>

                  {facility.features.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {facility.features.map((feat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-600 font-medium"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
            Campus learning spaces and physical infrastructure details are maintained by {school.displayName}.
          </div>
        )}
      </div>
    </section>
  );
}
