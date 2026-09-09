'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  PREDEFINED_ID_FORMATS,
  DEFAULT_ID_PRESET_ID,
  SUPPORTED_PLACEHOLDERS,
  validateCustomIdPattern,
  generateInstitutionalIdPreview,
  normalizeInstitutionalIdConfig,
  type InstitutionalIdNumberingConfig,
  type InstitutionalIdPresetId,
} from '@/lib/institutionalIdNumbering';
import { Hash, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';

interface InstitutionalIdNumberingSelectorProps {
  config?: InstitutionalIdNumberingConfig | null;
  legacyStaffFormat?: string | null;
  onChange: (newConfig: InstitutionalIdNumberingConfig) => void;
  session?: string | null;
  disabled?: boolean;
}

export const InstitutionalIdNumberingSelector: React.FC<InstitutionalIdNumberingSelectorProps> = ({
  config,
  legacyStaffFormat,
  onChange,
  session,
  disabled = false,
}) => {
  // Normalize incoming configuration safely
  const normalized = useMemo(
    () => normalizeInstitutionalIdConfig(config, legacyStaffFormat),
    [config, legacyStaffFormat]
  );

  const [selectedMode, setSelectedMode] = useState<'PRESET' | 'CUSTOM'>(normalized.mode);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    normalized.presetId || DEFAULT_ID_PRESET_ID
  );
  const [customPattern, setCustomPattern] = useState<string>(
    normalized.customPattern || '{{PREFIX}}-{{YY}}-{{NUMBER}}'
  );

  // Synchronize internal state if props change externally
  useEffect(() => {
    setSelectedMode(normalized.mode);
    if (normalized.presetId) setSelectedPresetId(normalized.presetId);
    if (normalized.customPattern) setCustomPattern(normalized.customPattern);
  }, [normalized]);

  // Validation for custom pattern
  const customValidation = useMemo(() => {
    if (selectedMode !== 'CUSTOM') return { isValid: true };
    return validateCustomIdPattern(customPattern);
  }, [selectedMode, customPattern]);

  // Effective config object
  const currentConfig = useMemo<InstitutionalIdNumberingConfig>(() => {
    if (selectedMode === 'CUSTOM') {
      return {
        mode: 'CUSTOM',
        customPattern: customPattern.trim() || '{{PREFIX}}-{{YY}}-{{NUMBER}}',
      };
    }
    return {
      mode: 'PRESET',
      presetId: (selectedPresetId as InstitutionalIdPresetId) || DEFAULT_ID_PRESET_ID,
    };
  }, [selectedMode, selectedPresetId, customPattern]);

  // Live preview for all four canonical institutional roles
  const preview = useMemo(() => {
    return generateInstitutionalIdPreview(currentConfig);
  }, [currentConfig]);

  // Handlers
  const handleDropdownChange = (value: string) => {
    if (value === 'CUSTOM') {
      setSelectedMode('CUSTOM');
      const updated: InstitutionalIdNumberingConfig = {
        mode: 'CUSTOM',
        customPattern: customPattern.trim() || '{{PREFIX}}-{{YY}}-{{NUMBER}}',
      };
      onChange(updated);
    } else {
      setSelectedMode('PRESET');
      setSelectedPresetId(value);
      const updated: InstitutionalIdNumberingConfig = {
        mode: 'PRESET',
        presetId: value as InstitutionalIdPresetId,
      };
      onChange(updated);
    }
  };

  const handleCustomPatternChange = (newPattern: string) => {
    setCustomPattern(newPattern);
    const updated: InstitutionalIdNumberingConfig = {
      mode: 'CUSTOM',
      customPattern: newPattern,
    };
    onChange(updated);
  };

  const handleInsertPlaceholder = (placeholder: string) => {
    const updated = customPattern ? `${customPattern}-${placeholder}` : placeholder;
    handleCustomPatternChange(updated);
  };

  return (
    <div className="bg-slate-50/70 border border-[#E2E8F0] rounded-2xl p-5 space-y-5 transition-all shadow-2xs">
      {/* Header with badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-100/80 text-[#4338CA]">
              <Hash className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-[#131B2E] text-base">Institutional ID Numbering Format</h3>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-full">
              Unified System
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Choose the numbering style used for institutional IDs across students, faculty, staff and administrators.
            The system controls entity prefixes to guarantee institution-wide consistency.
          </p>
        </div>
      </div>

      {/* Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <div className="md:col-span-7 space-y-2">
          <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
            Select ID Numbering Format *
          </label>
          <div className="relative">
            <select
              value={selectedMode === 'CUSTOM' ? 'CUSTOM' : selectedPresetId}
              onChange={(e) => handleDropdownChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] font-medium text-sm hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              <optgroup label="Predefined Institutional Styles">
                {PREDEFINED_ID_FORMATS.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.label} — (e.g. {fmt.example})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Advanced">
                <option value="CUSTOM">Custom Format (Define Pattern)</option>
              </optgroup>
            </select>
          </div>

          <p className="text-[11px] text-[#64748B] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Single shared format automatically standardizes Student, Faculty, Staff &amp; Admin codes.</span>
          </p>
        </div>

        {/* Selected Preset Description */}
        <div className="md:col-span-5 bg-white border border-indigo-100 rounded-xl p-3 text-xs space-y-1">
          <span className="font-bold text-[#4338CA] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {selectedMode === 'CUSTOM'
              ? 'Custom User-Defined Pattern'
              : PREDEFINED_ID_FORMATS.find((p) => p.id === selectedPresetId)?.label || 'Predefined Style'}
          </span>
          <p className="text-[#64748B] text-[11px]">
            {selectedMode === 'CUSTOM'
              ? 'Use supported variable placeholders to tailor your school numbering structure.'
              : PREDEFINED_ID_FORMATS.find((p) => p.id === selectedPresetId)?.description ||
                'Standard institutional sequential format.'}
          </p>
        </div>
      </div>

      {/* Custom Format Editor (if CUSTOM selected) */}
      {selectedMode === 'CUSTOM' && (
        <div className="bg-white border-2 border-dashed border-indigo-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider">
              Custom ID Pattern Editor
            </label>
            <span className="text-[11px] text-[#64748B]">Click any variable chip below to append</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={customPattern}
              onChange={(e) => handleCustomPatternChange(e.target.value)}
              placeholder="{{PREFIX}}-{{YY}}-{{NUMBER}}"
              disabled={disabled}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50/50 border font-mono text-sm transition shadow-2xs focus:outline-hidden ${
                customValidation.isValid
                  ? 'border-[#CBD5E1] text-[#131B2E] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10'
                  : 'border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-3 focus:ring-rose-500/10'
              }`}
            />
          </div>

          {/* Placeholder Variable Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[#64748B] mr-1">Available variables:</span>
            {SUPPORTED_PLACEHOLDERS.map((ph) => (
              <button
                key={ph}
                type="button"
                onClick={() => handleInsertPlaceholder(ph)}
                disabled={disabled}
                className="text-[11px] font-mono font-semibold bg-indigo-50 hover:bg-indigo-100 text-[#4338CA] border border-indigo-200/80 px-2 py-0.5 rounded-md transition cursor-pointer active:scale-95 disabled:opacity-50"
                title={`Click to insert ${ph}`}
              >
                + {ph}
              </button>
            ))}
          </div>

          {/* Validation Feedback */}
          {!customValidation.isValid ? (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{customValidation.error}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pattern syntax verified. Includes 5-digit sequence component.</span>
            </div>
          )}
        </div>
      )}

      {/* Live Preview Section */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
              Live Preview Across Institutional Roles
            </span>
          </div>
          <span className="text-[10px] text-[#64748B] font-medium">Auto-generated initial samples</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
            <span className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Student
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#131B2E] tracking-tight">
              {preview.student}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
            <span className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Faculty
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#4338CA] tracking-tight">
              {preview.faculty}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
            <span className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Employee / Staff
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#131B2E] tracking-tight">
              {preview.employee}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-center">
            <span className="block text-[11px] font-semibold text-[#64748B] uppercase tracking-wider mb-1">
              Administrator
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold text-[#131B2E] tracking-tight">
              {preview.administrator}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-[#64748B] leading-relaxed flex items-center gap-1.5 pt-1">
          <HelpCircle className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
          <span>
            Institutional IDs use an automated 5-digit sequence (00001–99999). Student institutional IDs are permanent
            and completely decoupled from mutable class roll numbers.
          </span>
        </p>
      </div>
    </div>
  );
};
