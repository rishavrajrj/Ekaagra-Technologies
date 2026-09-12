'use client';

import React from 'react';
import { UserPlus, FileText, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolAdmissionsProps {
  data: SchoolWebsiteData;
  onApplyClick?: () => void;
}

export default function SchoolAdmissions({ data, onApplyClick }: SchoolAdmissionsProps) {
  const { admissions, fees, school, branding } = data;

  return (
    <section id="admissions" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-10">
        {/* Section Header */}
        <div className="max-w-2xl space-y-2">
          <span
            className="text-xs font-bold uppercase tracking-wider block"
            style={{ color: branding.primaryColor || '#4338CA' }}
          >
            Admissions Open
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Admissions for Academic Session {admissions.sessionName}
          </h2>
          <p className="text-xs text-slate-500">
            Join a vibrant educational community dedicated to character building and intellectual inquiry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Admissions Guidelines & Eligibility */}
          <div className="lg:col-span-8 space-y-6">
            {admissions.guidelines && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Admission Guidelines &amp; Procedure</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {admissions.guidelines}
                </p>
              </div>
            )}

            {admissions.eligibilitySummary && (
              <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <h3 className="font-extrabold text-sm text-indigo-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>Eligibility &amp; Age Criteria</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {admissions.eligibilitySummary}
                </p>
              </div>
            )}

            {/* Standard 4-Step Process */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Application Journey
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <div className="font-bold text-xs text-slate-900">Inquiry &amp; Registration</div>
                  <p className="text-[11px] text-slate-500">Submit the official online inquiry form or visit campus.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <div className="font-bold text-xs text-slate-900">Interaction / Assessment</div>
                  <p className="text-[11px] text-slate-500">Student interaction and foundational skill review.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <div className="font-bold text-xs text-slate-900">Documentation Verification</div>
                  <p className="text-[11px] text-slate-500">Verification of birth certificate, previous report cards, and transfer cert.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <div className="font-bold text-xs text-slate-900">Enrollment &amp; Fee Payment</div>
                  <p className="text-[11px] text-slate-500">Official seat confirmation and student admission kit handover.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admission Action Card */}
          <div className="lg:col-span-4">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-6 shadow-xl sticky top-24">
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Applications Open
                </span>
                <h3 className="text-xl font-black">Begin Application</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Start your child&apos;s educational journey at {school.displayName}. Our admissions team is here to guide you.
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-3">
                <a
                  href="#contact"
                  className="w-full py-3 rounded-xl font-bold text-xs text-center text-white shadow-md block transition hover:opacity-95"
                  style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
                >
                  Contact Admissions Desk
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
