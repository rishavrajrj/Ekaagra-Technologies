'use client';

import React, { useState } from 'react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';
import SchoolWebsiteRenderer from '@/components/schools/website-engine/SchoolWebsiteRenderer';
import {
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface WebsiteVerificationViewProps {
  websiteData: SchoolWebsiteData;
  onFlagIssue: (sectionName: string) => void;
}

export default function WebsiteVerificationView({
  websiteData,
  onFlagIssue,
}: WebsiteVerificationViewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'tabbed' | 'full'>('tabbed');
  const [activeSection, setActiveSection] = useState<string>('home');
  const [verifiedSections, setVerifiedSections] = useState<Record<string, boolean>>({
    home: true,
    about: true,
  });

  const sectionsList = [
    { key: 'home', label: 'Homepage & Hero', implemented: Boolean(websiteData.hero.headline) },
    { key: 'about', label: 'About School & Story', implemented: Boolean(websiteData.about.description) },
    { key: 'academics', label: 'Academics & Curricula', implemented: Boolean(websiteData.academics.classesOffered?.length) },
    { key: 'facilities', label: 'Campus Facilities', implemented: websiteData.facilities.length > 0 },
    { key: 'admissions', label: 'Admissions & Fees', implemented: websiteData.admissions.isEnrolling !== undefined },
    { key: 'gallery', label: 'Photo Gallery', implemented: websiteData.gallery.length > 0 },
    { key: 'disclosures', label: 'Mandatory Disclosures', implemented: websiteData.compliance.mandatoryDisclosures?.length > 0 },
    { key: 'contact', label: 'Contact & Location', implemented: Boolean(websiteData.contact.primaryPhone) },
  ];

  const toggleSectionVerified = (key: string) => {
    setVerifiedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <span>Live Website Verification</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Preview
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Test and verify the generated public school website across responsive breakpoints.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('tabbed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'tabbed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page-by-Page
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Continuous
            </button>
          </div>

          {/* Viewport Toggles */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              title="Desktop View (1200px)"
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewport === 'desktop'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              title="Tablet View (768px)"
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewport === 'tablet'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              title="Mobile View (375px)"
              className={`p-2 rounded-lg transition cursor-pointer ${
                viewport === 'mobile'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container with Split Section Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Section Verification Checklist */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Section Checklist
            </span>
            <span className="text-xs font-bold text-indigo-600">
              {Object.values(verifiedSections).filter(Boolean).length}/{sectionsList.length} Verified
            </span>
          </div>

          <div className="space-y-1.5">
            {sectionsList.map((sec) => {
              const isVerified = Boolean(verifiedSections[sec.key]);
              const isActive = activeSection === sec.key;

              return (
                <div
                  key={sec.key}
                  className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 ${
                    isActive
                      ? 'bg-indigo-50/70 border-indigo-200'
                      : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveSection(sec.key)}
                    className="flex-1 text-left flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isVerified ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-xs font-bold text-slate-800 leading-none">{sec.label}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleSectionVerified(sec.key)}
                      title={isVerified ? 'Mark Unverified' : 'Mark Verified'}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        isVerified
                          ? 'text-emerald-600 hover:bg-emerald-100'
                          : 'text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onFlagIssue(sec.label)}
                      title="Flag Issue for this section"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Tip: Click any section above to navigate the live preview frame directly to that page or block.
          </div>
        </div>

        {/* Right Preview Frame */}
        <div className="lg:col-span-3 bg-slate-900/60 rounded-2xl p-3 sm:p-5 flex items-start justify-center overflow-x-auto min-h-[700px]">
          <div
            className={`bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-full min-h-[680px] ${
              viewport === 'desktop'
                ? 'max-w-5xl'
                : viewport === 'tablet'
                ? 'max-w-2xl'
                : 'max-w-sm'
            }`}
          >
            <SchoolWebsiteRenderer
              data={websiteData}
              viewMode={viewMode}
              initialTab={activeSection}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
