'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Plus,
  X,
  Info,
  CheckCircle2,
  HelpCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { UniversalIntakeData, SchoolProject } from '@/lib/types';

interface CustomRequirementsSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField?: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject;
  onNavigateToSection?: (sectionKey: any) => void;
}

const COMMON_SUGGESTIONS = [
  'Bilingual English & Hindi Public Content',
  'Domain Transfer from Current Registrar',
  'Google Workspace for Education Setup Assistance',
  'Custom Admissions Application Form Fields',
  'Legacy Student & Staff Data Migration Support',
  'Custom Report Card Layout Alignment',
  'Alumni Association Directory Setup',
  'Emergency Notification SMS / WhatsApp Template Sync',
];

export default function CustomRequirementsSection({
  intakeData,
  updateSectionDirect,
}: CustomRequirementsSectionProps) {
  const reqData = intakeData.additionalRequirements || {};
  const [newChipInput, setNewChipInput] = useState('');
  const [showLegacyDetails, setShowLegacyDetails] = useState(false);

  // Extract structured custom requests
  const customRequests: string[] = Array.isArray(reqData.customRequests)
    ? reqData.customRequests
    : [];

  const notes: string = reqData.notes || reqData.generalCommentsOrQuestions || '';

  // Check if legacy fields have data
  const hasLegacyData = Boolean(
    reqData.specialCustomWorkflows ||
    reqData.customReportsRequired ||
    reqData.thirdPartyIntegrations ||
    (reqData.generalCommentsOrQuestions && reqData.notes && reqData.generalCommentsOrQuestions !== reqData.notes)
  );

  const handleUpdate = (updated: Record<string, any>) => {
    if (updateSectionDirect) {
      updateSectionDirect('additionalRequirements', {
        ...reqData,
        ...updated,
      });
    }
  };

  const addRequestChip = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!customRequests.includes(trimmed)) {
      handleUpdate({ customRequests: [...customRequests, trimmed] });
    }
    setNewChipInput('');
  };

  const removeRequestChip = (chipToRemove: string) => {
    handleUpdate({ customRequests: customRequests.filter((c) => c !== chipToRemove) });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-7 shadow-2xs space-y-5">
        {/* Header Banner */}
        <div className="flex items-center space-x-3 pb-4 border-b border-[#E2E8F0]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-[#131B2E]">Custom Requirements &amp; Special Requests</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Strictly Optional
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Have unique workflows, custom integrations, or specific requests? Capture them here for Ekaagra&apos;s implementation team.
            </p>
          </div>
        </div>

        {/* Optional Status Banner */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-start space-x-2.5 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="block text-emerald-950 font-bold mb-0.5">Standard Implementations are 100% Complete by Default</strong>
            If your institution does not require custom development or special engineering requests beyond standard configuration, you can leave this section blank and proceed directly to review.
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#131B2E] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Common Project Requests (Click to add)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SUGGESTIONS.map((sugg) => {
              const isAdded = customRequests.includes(sugg);
              return (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => (isAdded ? removeRequestChip(sugg) : addRequestChip(sugg))}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                    isAdded
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300 font-medium'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{sugg}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{sugg}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Requests Tag List */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <label className="block text-xs font-bold text-[#131B2E]">
            Selected Custom Requests
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newChipInput}
              onChange={(e) => setNewChipInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRequestChip(newChipInput);
                }
              }}
              placeholder="Type a custom request and press Enter..."
              className="flex-1 px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-indigo-500"
            />
            <button
              type="button"
              onClick={() => addRequestChip(newChipInput)}
              className="px-3.5 py-2 bg-[#131B2E] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {customRequests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {customRequests.map((req) => (
                <span
                  key={req}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold"
                >
                  <span>{req}</span>
                  <button
                    type="button"
                    onClick={() => removeRequestChip(req)}
                    className="text-amber-500 hover:text-amber-800 cursor-pointer"
                    aria-label={`Remove ${req}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-[#64748B] italic pt-1">
              No custom requests added yet. Standard project scope applies.
            </p>
          )}
        </div>

        {/* Detailed Notes & Specifications */}
        <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
          <label className="block text-xs font-bold text-[#131B2E]">
            Detailed Notes, Questions, or Specific Instructions (Optional)
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) =>
              handleUpdate({
                notes: e.target.value,
                generalCommentsOrQuestions: e.target.value, // Keep legacy field synchronized
              })
            }
            placeholder="Provide any additional institutional context, legacy portal details, timeline constraints, or queries..."
            className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-indigo-500"
          />
        </div>

        {/* Legacy Fields Preservation (Collapsible) */}
        {hasLegacyData && (
          <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
            <button
              type="button"
              onClick={() => setShowLegacyDetails(!showLegacyDetails)}
              className="flex items-center justify-between w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <span>Legacy Scope &amp; Workflow Notes (Preserved)</span>
              {showLegacyDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showLegacyDetails && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                {reqData.specialCustomWorkflows && (
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Special Custom Workflows:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-wrap">{reqData.specialCustomWorkflows}</p>
                  </div>
                )}
                {reqData.customReportsRequired && (
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Custom Reports Required:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-wrap">{reqData.customReportsRequired}</p>
                  </div>
                )}
                {reqData.thirdPartyIntegrations && (
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">Third-Party Integrations:</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 whitespace-pre-wrap">{reqData.thirdPartyIntegrations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Implementation Callout */}
        <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-[#64748B]">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed text-[11px]">
            <strong className="text-[#131B2E] block mb-0.5">Implementation Timeline Guarantee</strong>
            Custom requests and scope notes are reviewed by Ekaagra&apos;s project engineers during deployment setup. Standard school website pages are provisioned immediately regardless of whether custom notes are submitted.
          </div>
        </div>
      </div>
    </div>
  );
}
