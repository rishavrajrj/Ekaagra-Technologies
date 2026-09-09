'use client';

import React, { useMemo } from 'react';
import {
  Building2,
  ChevronDown,
  Copy,
  Sliders,
  Ban,
  CheckCircle2,
  Info,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type {
  CampusBranchData,
  CampusDataSourceMode,
  CampusOverridesMap,
} from '@/lib/types';
import type { IntakeSectionKey } from '@/lib/schoolIntake';
import {
  getMainCampus,
  getCampusById,
  getCampusDisplayName,
  isSectionInheritanceAllowed,
  isSectionNotApplicableAllowed,
  validateInheritanceChain,
} from '@/lib/campusScopeRegistry';

export interface CampusContextBarProps {
  campuses?: CampusBranchData[];
  activeCampusId: string;
  onSelectCampus: (campusId: string) => void;
  sectionKey: IntakeSectionKey;
  sectionTitle?: string;
  sourceMode: CampusDataSourceMode;
  sourceCampusId?: string;
  onChangeSourceMode: (mode: CampusDataSourceMode, sourceCampusId?: string) => void;
  campusOverrides?: CampusOverridesMap;
  isReadOnly?: boolean;
}

export default function CampusContextBar({
  campuses = [],
  activeCampusId,
  onSelectCampus,
  sectionKey,
  sectionTitle,
  sourceMode,
  sourceCampusId,
  onChangeSourceMode,
  campusOverrides,
  isReadOnly = false,
}: CampusContextBarProps) {
  const isMultiCampus = campuses.length > 1;

  // Single-campus schools: keep UI simple and unchanged
  if (!isMultiCampus) {
    return null;
  }

  const mainCampus = getMainCampus(campuses);
  const currentCampus = getCampusById(campuses, activeCampusId) || campuses[0];
  const isMain = currentCampus.id === mainCampus?.id;

  const supportsInheritance = isSectionInheritanceAllowed(sectionKey);
  const supportsNotApplicable = isSectionNotApplicableAllowed(sectionKey);

  // Candidate source campuses (excluding self and any that would create a circular loop)
  const candidateSourceCampuses = useMemo(() => {
    return campuses.filter((c) => {
      if (c.id === currentCampus.id) return false;
      const check = validateInheritanceChain(
        campuses,
        campusOverrides,
        sectionKey,
        currentCampus.id,
        c.id
      );
      return check.valid;
    });
  }, [campuses, campusOverrides, sectionKey, currentCampus.id]);

  const effectiveSourceCampus = getCampusById(campuses, sourceCampusId) || mainCampus || campuses[0];
  const effectiveSourceName = getCampusDisplayName(effectiveSourceCampus);
  const currentCampusName = getCampusDisplayName(currentCampus);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs space-y-3.5 mb-6">
      {/* Top row: Persistent Campus Context Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                Editing Campus:
              </span>
              <span className="font-extrabold text-sm text-[#131B2E]">
                {currentCampusName}
              </span>
              {isMain && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                  MAIN CAMPUS
                </span>
              )}
            </div>
            {sectionTitle && (
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Campus-specific configuration for <strong className="text-[#131B2E]">{sectionTitle}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Campus Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="campus-context-dropdown" className="text-xs font-semibold text-[#475569] hidden sm:inline">
            Switch Campus:
          </label>
          <div className="relative">
            <select
              id="campus-context-dropdown"
              value={activeCampusId}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-[#131B2E] text-xs font-bold hover:border-[#94A3B8] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/15 focus:outline-hidden transition shadow-2xs cursor-pointer"
            >
              {campuses.map((c, idx) => (
                <option key={c.id} value={c.id}>
                  {getCampusDisplayName(c, idx + 1)} {c.isMainCampus ? '(Main Campus)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bottom row: Data Source & Inheritance Controls (Only applicable to non-main branch campuses) */}
      {!isMain && supportsInheritance && (
        <div className="space-y-3 pt-0.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-[#4338CA]" />
              <span className="font-bold text-[#131B2E]">Data Source:</span>
            </div>

            {/* Segmented Mode Selector Buttons */}
            <div className="flex items-center flex-wrap gap-1.5">
              {/* Option 1: Inherited */}
              <button
                type="button"
                onClick={() => onChangeSourceMode('inherited', effectiveSourceCampus?.id)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  sourceMode === 'inherited'
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#CBD5E1]'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Same as {effectiveSourceName}</span>
              </button>

              {/* Source Picker dropdown if 3+ campuses */}
              {sourceMode === 'inherited' && candidateSourceCampuses.length > 1 && (
                <div className="relative">
                  <select
                    value={sourceCampusId || effectiveSourceCampus?.id}
                    onChange={(e) => onChangeSourceMode('inherited', e.target.value)}
                    className="appearance-none pl-2.5 pr-7 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-[#131B2E] text-xs font-semibold hover:border-[#94A3B8] focus:border-[#4338CA] focus:outline-hidden transition shadow-2xs cursor-pointer"
                    title="Choose which campus to inherit from"
                  >
                    {candidateSourceCampuses.map((sc) => (
                      <option key={sc.id} value={sc.id}>
                        from {getCampusDisplayName(sc)} {sc.isMainCampus ? '(Main)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#64748B] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}

              {/* Option 2: Customize */}
              <button
                type="button"
                onClick={() => onChangeSourceMode('customized')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  sourceMode === 'customized'
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#CBD5E1]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Customize for {currentCampusName}</span>
              </button>

              {/* Option 3: Not Applicable */}
              {supportsNotApplicable && (
                <button
                  type="button"
                  onClick={() => onChangeSourceMode('not_applicable')}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                    sourceMode === 'not_applicable'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#CBD5E1]'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Not applicable</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner 1: Inherited Notice Banner */}
          {sourceMode === 'inherited' && (
            <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center space-x-2 text-indigo-900">
                <Info className="w-4 h-4 text-[#4338CA] shrink-0" />
                <span>
                  Information inherited from <strong>{effectiveSourceName}</strong>. Any changes made to {effectiveSourceName} will automatically reflect here.
                </span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectCampus(effectiveSourceCampus.id)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-[#4338CA] hover:bg-indigo-50 font-bold text-[11px] shadow-2xs transition cursor-pointer"
                >
                  <span>View {effectiveSourceName}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeSourceMode('customized')}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-[11px] shadow-2xs transition cursor-pointer"
                >
                  <span>Customize for {currentCampusName}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Banner 2: Not Applicable Notice Banner */}
          {sourceMode === 'not_applicable' && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  This section is marked as <strong>Not applicable</strong> for <strong>{currentCampusName}</strong>. No data is required and it will not block onboarding completion.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChangeSourceMode('customized')}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs transition cursor-pointer shrink-0"
              >
                <span>Enable for {currentCampusName}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
