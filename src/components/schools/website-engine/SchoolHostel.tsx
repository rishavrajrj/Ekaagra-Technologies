'use client';

import React from 'react';
import { Home, ShieldCheck, Check, Users } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolHostelProps {
  data: SchoolWebsiteData;
}

export default function SchoolHostel({ data }: SchoolHostelProps) {
  const { hostel, school, branding } = data;

  // STRICT CONDITIONAL: If school is day school / no hostel, do not render this section!
  if (!hostel.isAvailable) {
    return null;
  }

  return (
    <section id="hostel" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Residential Life
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Boarding &amp; Residential Hostel
          </h2>
          <p className="text-xs text-slate-500">
            A secure home away from home fostering camaraderie, disciplined study routines, and pastoral care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Accommodation</span>
            <div className="text-base font-extrabold text-slate-900">
              {hostel.genderAccommodation || 'Residential Hostels'}
            </div>
            {hostel.capacity && (
              <p className="text-xs text-slate-500">
                Residential Capacity: <strong>{hostel.capacity} beds</strong>
              </p>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pastoral Care</span>
            <div className="text-base font-extrabold text-slate-900">
              {hostel.wardenName ? `Chief Warden: ${hostel.wardenName}` : 'Dedicated Residential Wardens'}
            </div>
            <p className="text-xs text-slate-500">24/7 security, infirmary, and mentored prep study hours.</p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Campus Living</span>
            <div className="text-base font-extrabold text-slate-900">
              {hostel.buildingsCount ? `${hostel.buildingsCount} Residential Wings` : 'Modern Boarding Facilities'}
            </div>
            <p className="text-xs text-slate-500">Hygienic dining mess, recreational common rooms, and sports access.</p>
          </div>
        </div>

        {hostel.features.length > 0 && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hostel Amenities &amp; Services
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {hostel.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
