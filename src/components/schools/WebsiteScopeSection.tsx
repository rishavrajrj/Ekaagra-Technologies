'use client';

import React, { useState } from 'react';
import {
  Globe,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  Plus,
  X,
  FileText,
  Bus,
  Home,
  Users,
  CreditCard,
  Bell,
  Calendar,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import type { UniversalIntakeData, SchoolProject, WebsiteScopeData } from '@/lib/types';

interface WebsiteScopeSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField?: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject;
  onNavigateToSection?: (sectionKey: any) => void;
}

const CORE_MODULES = [
  { id: 'home', label: 'Home Page & Hero Showcase', desc: 'Welcome banner, quick highlights, and school philosophy' },
  { id: 'about', label: 'About School & Leadership Desk', desc: 'History, vision, mission, and principal / director credentials' },
  { id: 'academics', label: 'Academic Structure & Curriculum', desc: 'Classes, streams, subjects, and board affiliation details' },
  { id: 'admissions', label: 'Admissions Guidelines & Enquiries', desc: 'Admissions criteria, eligibility, dates, and query form' },
  { id: 'contact', label: 'Contact Coordinates & Campus Map', desc: 'Official phone, email, address, and interactive Google Map' },
  { id: 'gallery', label: 'Campus Photography & Facilities', desc: 'Infrastructure, labs, library, sports grounds, and activities' },
];

const OPTIONAL_MODULES = [
  {
    id: 'notices',
    label: 'E-Notice Board & Circulars',
    desc: 'Public notices, downloadable PDF circulars, and announcements',
    icon: Bell,
  },
  {
    id: 'online_fee',
    label: 'Online Fee Payment Info / Link',
    desc: 'Public fee schedule, payment instructions, and payment gateway link',
    icon: CreditCard,
  },
  {
    id: 'parent_portal',
    label: 'Parent & Student Portal Access',
    desc: 'Direct login access button and instructions for school management portal',
    icon: Users,
  },
  {
    id: 'attendance_view',
    label: 'Academic Calendar & Schedule',
    desc: 'Term calendar, annual event schedule, and holiday announcements',
    icon: Calendar,
  },
  {
    id: 'transport_info',
    label: 'Transport Routes & Fleet Overview',
    desc: 'Public route summaries, pickup safety measures, and transport contact',
    icon: Bus,
    note: 'Note: Transport module appears on website only when transport operations are active for your school.',
  },
  {
    id: 'hostel_showcase',
    label: 'Hostel & Residential Facilities',
    desc: 'Dormitory amenities, mess routine, pastoral care, and boarding safety',
    icon: Home,
    note: 'Note: Hostel module appears on website only when boarding/hostel is offered by your institution.',
  },
  {
    id: 'careers',
    label: 'Faculty Recruitment & Careers',
    desc: 'Open teaching/non-teaching positions and application submission form',
    icon: Briefcase,
  },
  {
    id: 'alumni',
    label: 'Alumni Network & Achievements',
    desc: 'Notable alumni spotlight, success stories, and alumni association registration',
    icon: GraduationCap,
  },
];

export default function WebsiteScopeSection({
  intakeData,
  updateSectionDirect,
}: WebsiteScopeSectionProps) {
  const scope: WebsiteScopeData = intakeData.websiteScope || {
    websiteType: 'public_school',
    coreModules: ['home', 'about', 'academics', 'admissions', 'contact', 'gallery'],
    optionalModules: [],
    customPages: [],
    specialInstructions: '',
    notes: '',
  };

  const [newPageInput, setNewPageInput] = useState('');

  const handleUpdate = (updated: Partial<WebsiteScopeData>) => {
    if (updateSectionDirect) {
      updateSectionDirect('websiteScope', {
        ...scope,
        ...updated,
      });
    }
  };

  const toggleOptionalModule = (moduleId: string) => {
    const current = scope.optionalModules || [];
    const updated = current.includes(moduleId)
      ? current.filter((id) => id !== moduleId)
      : [...current, moduleId];
    handleUpdate({ optionalModules: updated });
  };

  const customPagesList = Array.isArray(scope.customPages) ? scope.customPages : [];

  const addCustomPage = () => {
    const trimmed = newPageInput.trim();
    if (!trimmed) return;
    const current = customPagesList;
    const exists = current.some((p) => {
      const name = typeof p === 'string' ? p : p.name;
      return name.toLowerCase() === trimmed.toLowerCase();
    });
    if (!exists) {
      const newPageItem = {
        id: `page-${Date.now()}`,
        name: trimmed,
      };
      handleUpdate({ customPages: [...current, newPageItem] });
    }
    setNewPageInput('');
  };

  const removeCustomPage = (pageKey: string) => {
    const current = customPagesList;
    handleUpdate({
      customPages: current.filter((p) => {
        const id = typeof p === 'string' ? p : p.id;
        const name = typeof p === 'string' ? p : p.name;
        return id !== pageKey && name !== pageKey;
      }),
    });
  };

  const websiteType = scope.websiteType || 'public_school';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0]">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-[#131B2E]">Website Scope &amp; Project Configuration</h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Website Scope
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Specify the structure, public modules, and custom features to include on your institution&apos;s website.
            </p>
          </div>
        </div>

        {/* Website Style & Architecture Preset */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#131B2E]">
            Website Project Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'public_school',
                title: 'Standard School Website',
                desc: 'Clean, modern public website focusing on admissions, campus showcases, and mandatory disclosures.',
              },
              {
                id: 'k12_comprehensive',
                title: 'Comprehensive K-12 Portal',
                desc: 'Full-featured institutional website with student notices, departmental highlights, and parent hub.',
              },
              {
                id: 'multi_campus_group',
                title: 'Multi-Campus / Group Portal',
                desc: 'Multi-branch institutional portal supporting branch selector, central admissions, and joint achievements.',
              },
            ].map((type) => {
              const isSelected = websiteType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleUpdate({ websiteType: type.id })}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-[#E2E8F0] bg-[#FAF7F2] hover:bg-white hover:border-[#CBD5E1]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-indigo-900' : 'text-[#131B2E]'}`}>
                        {type.title}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1 leading-snug">{type.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Modules (Always included) */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#131B2E] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Core Website Modules (Standard Included)
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              Included in All Packages
            </span>
          </div>
          <p className="text-[11px] text-[#64748B]">
            These foundational sections are provisioned automatically using your verified school data:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {CORE_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800">{mod.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{mod.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional Feature Modules */}
        <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
          <div>
            <span className="text-xs font-bold text-[#131B2E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Optional Feature Modules
            </span>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              Enable additional sections and specialized pages for your website according to your institution&apos;s requirements:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OPTIONAL_MODULES.map((mod) => {
              const IconComp = mod.icon;
              const isChecked = (scope.optionalModules || []).includes(mod.id);
              return (
                <label
                  key={mod.id}
                  className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer transition ${
                    isChecked
                      ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-300'
                      : 'border-[#E2E8F0] bg-[#FAF7F2] hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOptionalModule(mod.id)}
                    className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-[#131B2E]">{mod.label}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{mod.desc}</p>
                    {mod.note && isChecked && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded mt-1.5 leading-tight">
                        {mod.note}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Custom Pages List */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <label className="block text-xs font-bold text-[#131B2E]">
            Additional Custom Pages (Optional)
          </label>
          <p className="text-[11px] text-[#64748B]">
            Need specialized pages not listed above? Enter the page titles below (e.g., &quot;Model United Nations&quot;, &quot;Science Club&quot;, &quot;Founder&apos;s Legacy&quot;).
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPageInput}
              onChange={(e) => setNewPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomPage();
                }
              }}
              placeholder="e.g. Model United Nations Club"
              className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-indigo-500"
            />
            <button
              type="button"
              onClick={addCustomPage}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>
          </div>

          {customPagesList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {customPagesList.map((page) => {
                const pageKey = typeof page === 'string' ? page : page.id || page.name;
                const pageLabel = typeof page === 'string' ? page : page.name;
                return (
                  <span
                    key={pageKey}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                  >
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span>{pageLabel}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomPage(pageKey)}
                      className="text-indigo-400 hover:text-indigo-800 cursor-pointer"
                      aria-label={`Remove ${pageLabel}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Special Instructions */}
        <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
          <label className="block text-xs font-bold text-[#131B2E]">
            Website Scope Instructions &amp; Design Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={scope.specialInstructions || ''}
            onChange={(e) => handleUpdate({ specialInstructions: e.target.value })}
            placeholder="Specify any visual layout preferences, priority sections, or specific requirements for website delivery..."
            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-indigo-500"
          />
        </div>

        {/* Information Callout */}
        <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-[#64748B]">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-[#131B2E] block mb-0.5">Authoritative Fact-Based Publication</strong>
            Website content is populated from your authoritative school profile, campus facilities, and statutory disclosures. Optional modules are configured to launch cleanly once the relevant institutional data is provided.
          </div>
        </div>
      </div>
    </div>
  );
}
