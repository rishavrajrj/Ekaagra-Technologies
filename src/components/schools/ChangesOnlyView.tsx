'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, ArrowRight, ArrowLeft, Save, Sparkles, MessageSquare } from 'lucide-react';
import type { SchoolIntakeChangeRequest } from '@/lib/types';
import { lookupCanonicalField, isRequestActivePending, isRequestAwaitingAdminReview } from '@/lib/canonicalFieldRegistry';

export interface ChangesOnlyViewProps {
  changeRequests: SchoolIntakeChangeRequest[];
  onNavigateToField: (sectionKey: string, fieldKey: string) => void;
  onSaveAllChanges: () => void;
  isSaving: boolean;
  onSwitchToAllInformation: () => void;
  onOpenResponseModal?: (cr: SchoolIntakeChangeRequest) => void;
}

/**
 * Changes-Only Mode & Completion Summary
 * Meets Requirements 17, 18, 21:
 * - Shows only fields that require school action across all 18 sections
 * - 1-Click direct navigation/jump to exact field
 * - Shows reviewer instruction, current value, suggested value, and response status
 * - Displays clear Completion Summary when all items are addressed
 */
export default function ChangesOnlyView({
  changeRequests,
  onNavigateToField,
  onSaveAllChanges,
  isSaving,
  onSwitchToAllInformation,
  onOpenResponseModal,
}: ChangesOnlyViewProps) {
  const pendingCRs = changeRequests.filter(isRequestActivePending);
  const awaitingAdminCRs = changeRequests.filter(isRequestAwaitingAdminReview);
  const totalActionable = pendingCRs.length + awaitingAdminCRs.length;

  // If there are zero pending changes needing school action, show Completion Summary (Requirement 18)
  if (pendingCRs.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xs text-center space-y-6 max-w-2xl mx-auto my-6 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-full inline-block">
            Verification Readiness
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#131B2E] tracking-tight">
            ✓ All requested changes completed
          </h2>
          <p className="text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            {awaitingAdminCRs.length > 0 ? (
              <>
                <strong className="text-slate-800">{awaitingAdminCRs.length} of {totalActionable}</strong> changes updated.
                Your adjustments are saved and awaiting Ekaagra verification.
              </>
            ) : (
              'All requested adjustments have been saved and your onboarding profile is ready for review.'
            )}
          </p>
        </div>

        {awaitingAdminCRs.length > 0 && (
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 text-left max-w-lg mx-auto space-y-2">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Updated Items Awaiting Verification ({awaitingAdminCRs.length})
            </span>
            <ul className="space-y-1.5 text-xs text-slate-600">
              {awaitingAdminCRs.map((cr, idx) => {
                const def = lookupCanonicalField(cr.field_key || cr.asset_id || '', cr.page_key || cr.section_key);
                const title = cr.field_label || def.fieldLabel || 'Field';
                return (
                  <li key={cr.id || idx} className="flex items-center justify-between gap-2 py-1 border-b border-slate-200/60 last:border-b-0">
                    <span className="font-semibold text-slate-800 truncate">• {title}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      Updated
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onSwitchToAllInformation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Onboarding</span>
          </button>

          <button
            type="button"
            onClick={onSaveAllChanges}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto my-4 animate-fadeIn">
      {/* Header bar */}
      <div className="bg-amber-50/70 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <h2 className="font-extrabold text-sm sm:text-base text-amber-950">
              {pendingCRs.length} {pendingCRs.length === 1 ? 'change' : 'changes'} requested
            </h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please review each requested item below. You can navigate directly to any field to fix it.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveAllChanges}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-2xs transition active:scale-[0.98] cursor-pointer shrink-0 self-start sm:self-center"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving Changes...' : 'Save all changes'}</span>
        </button>
      </div>

      {/* Changes list */}
      <div className="space-y-4">
        {pendingCRs.map((cr, idx) => {
          const fieldDef = lookupCanonicalField(
            cr.field_key || cr.asset_id || '',
            cr.page_key || cr.section_key
          );
          const targetKey = fieldDef.canonicalKey || fieldDef.fieldKey || cr.field_key || '';
          const targetSection = fieldDef.intakeSectionKey || cr.section_key || cr.page_key || '';
          const fieldTitle = cr.field_label || fieldDef.fieldLabel || 'Field';
          const sectionTitle = fieldDef.sectionTitle || fieldDef.pageTitle || cr.section_key || 'Section';

          return (
            <div
              key={cr.id || idx}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300/90 p-4 sm:p-5 shadow-2xs transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {fieldTitle}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 pl-7 block">
                    in {sectionTitle}
                  </span>
                </div>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                  <span>⚠️</span>
                  <span>Change requested</span>
                </span>
              </div>

              {/* Reviewer instruction */}
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/70 text-xs space-y-1">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  Reviewer:
                </span>
                <p className="text-amber-950 font-medium italic leading-relaxed">
                  &ldquo;{cr.request_comment || cr.reason || 'Please correct this field per reviewer requirements.'}&rdquo;
                </p>
              </div>

              {/* Current value */}
              {cr.current_value && (
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                    Current value:
                  </span>
                  <span className="font-mono text-slate-800 text-[11px] truncate">
                    {typeof cr.current_value === 'object'
                      ? JSON.stringify(cr.current_value)
                      : String(cr.current_value)}
                  </span>
                </div>
              )}

              {/* Suggested value */}
              {cr.suggested_value && (
                <div className="bg-emerald-50/60 rounded-lg p-2.5 border border-emerald-200/80 text-xs flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0">
                    Suggested value:
                  </span>
                  <span className="font-mono font-bold text-emerald-900 text-[11px]">
                    {cr.suggested_value}
                  </span>
                </div>
              )}

              {/* School response if entered */}
              {cr.school_response && (
                <div className="bg-indigo-50/50 rounded-lg p-2.5 border border-indigo-200 text-xs flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider shrink-0">
                    Your note:
                  </span>
                  <span className="text-slate-700 text-[11px] italic">
                    &ldquo;{cr.school_response}&rdquo;
                  </span>
                </div>
              )}

              {/* Actions row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                {onOpenResponseModal && (
                  <button
                    type="button"
                    onClick={() => onOpenResponseModal(cr)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cr.school_response ? 'Edit response note' : 'Add response note'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onNavigateToField(targetSection, targetKey)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer ml-auto"
                >
                  <span>Fix this field</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Save Action */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onSwitchToAllInformation}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all sections</span>
        </button>

        <button
          type="button"
          onClick={onSaveAllChanges}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition active:scale-[0.98] cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save all changes'}</span>
        </button>
      </div>
    </div>
  );
}
