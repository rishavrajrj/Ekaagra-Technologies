'use client';

import React from 'react';
import { UserCheck, Award, Quote } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolLeadershipProps {
  data: SchoolWebsiteData;
}

export default function SchoolLeadership({ data }: SchoolLeadershipProps) {
  const { leadership, school, branding } = data;

  if (!leadership.principalName && !leadership.managementMembers.length) {
    return null;
  }

  return (
    <section id="leadership" className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-12">
        {/* Principal / Head of Institution Feature */}
        {leadership.principalName && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Portrait */}
              <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
                {leadership.principalPhotoUrl ? (
                  <img
                    src={leadership.principalPhotoUrl}
                    alt={leadership.principalName}
                    className="w-44 h-44 sm:w-52 sm:h-52 object-cover rounded-2xl shadow-md border-2 border-slate-100"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
                    <UserCheck className="w-16 h-16" />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {leadership.principalName}
                  </h3>
                  <p className="text-xs font-semibold text-indigo-600">
                    {leadership.principalDesignation || 'Principal / Head of Institution'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{school.displayName}</p>
                </div>
              </div>

              {/* Message from the Desk */}
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Quote className="w-6 h-6 rotate-180 opacity-60" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Message from the Principal&apos;s Desk
                  </span>
                </div>

                {leadership.principalMessage ? (
                  <blockquote className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-indigo-300 pl-4 space-y-2">
                    <p>{leadership.principalMessage}</p>
                  </blockquote>
                ) : (
                  <p className="text-xs text-slate-500 leading-relaxed">
                    &ldquo;At {school.displayName}, we are committed to providing a secure, stimulating, and value-based learning environment where every student is empowered to achieve their fullest potential.&rdquo;
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Management Roster / Committee Members */}
        {leadership.managementMembers.length > 0 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                Board of Management &amp; Advisory
              </h3>
              <p className="text-xs text-slate-500">
                Governing leadership guiding institutional policies and academic vision.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {leadership.managementMembers.map((member, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center space-y-2"
                >
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt={member.name}
                      className="w-16 h-16 rounded-full mx-auto object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                      {member.name.charAt(0) || 'M'}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{member.name}</h4>
                    <p className="text-[11px] text-slate-500">{member.designation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
