'use client';

import React from 'react';
import { AlertTriangle, X, ChevronRight, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SchoolIntakeChangeRequest } from '@/lib/types';
import { lookupCanonicalField, normalizePageKey, isRequestActivePending } from '@/lib/canonicalFieldRegistry';
import ModalPortal from '@/components/ui/ModalPortal';

export interface GlobalChangeRequestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  changeRequests: SchoolIntakeChangeRequest[];
  onNavigateToField: (pageKey: string, fieldKey: string) => void;
}

/**
 * Global Change Request Summary Drawer / Modal
 * Meets Requirement 13:
 * - Grouped overview of all pending changes across all pages
 * - Clicking any item navigates to page, locates field, scrolls & highlights it
 */
export default function GlobalChangeRequestDrawer({
  isOpen,
  onClose,
  changeRequests,
  onNavigateToField,
}: GlobalChangeRequestDrawerProps) {
  if (!isOpen) return null;

  const activeRequests = (changeRequests || []).filter(isRequestActivePending);

  // Group requests by canonical page
  const grouped: Record<string, { pageTitle: string; pageKey: string; items: SchoolIntakeChangeRequest[] }> = {};

  activeRequests.forEach((cr) => {
    const fieldDef = lookupCanonicalField(cr.field_key || cr.asset_id || '', cr.page_key || cr.section_key);
    const norm = normalizePageKey(fieldDef.pageKey || cr.page_key || cr.section_key);

    if (!grouped[norm.canonicalPageKey]) {
      grouped[norm.canonicalPageKey] = {
        pageTitle: norm.pageTitle,
        pageKey: norm.canonicalPageKey,
        items: [],
      };
    }
    grouped[norm.canonicalPageKey].items.push(cr);
  });

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white text-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-fadeIn">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-amber-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Requested Changes Overview
                </h3>
                <p className="text-xs text-slate-600">
                  {activeRequests.length} {activeRequests.length === 1 ? 'change' : 'changes'} required before project approval
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Grouped by page */}
          <div className="p-5 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
            {activeRequests.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-sm text-slate-800">All Requested Changes Resolved</h4>
                <p className="text-xs text-slate-500">
                  There are no pending change requests. Your onboarding information is ready for review.
                </p>
              </div>
            ) : (
              Object.values(grouped).map((group) => (
                <div key={group.pageKey} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold text-xs text-[#4338CA]">
                    <span>{group.pageTitle}</span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((cr) => {
                      const fieldDef = lookupCanonicalField(
                        cr.field_key || cr.asset_id || '',
                        cr.page_key || cr.section_key
                      );
                      const targetKey = fieldDef.canonicalKey || fieldDef.fieldKey || cr.field_key || '';
                      const fieldTitle = cr.field_label || fieldDef.fieldLabel || 'Field';

                      return (
                        <div
                          key={cr.id}
                          className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50/20 transition-all shadow-2xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {fieldTitle}
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                              Change requested
                            </span>
                          </div>

                          <div className="bg-amber-50/60 rounded-xl p-2.5 border border-amber-200/70 text-xs space-y-1">
                            <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                              Reviewer said:
                            </span>
                            <p className="text-amber-950 font-medium italic">
                              &ldquo;{cr.request_comment || cr.reason || 'Correction requested'}&rdquo;
                            </p>
                          </div>

                          {cr.current_value && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 flex items-baseline gap-1.5">
                              <span className="font-semibold text-slate-500 uppercase text-[9px] tracking-wider shrink-0">
                                Current value:
                              </span>
                              <span className="font-mono text-slate-800 truncate">
                                {typeof cr.current_value === 'object'
                                  ? JSON.stringify(cr.current_value)
                                  : String(cr.current_value)}
                              </span>
                            </div>
                          )}

                          {cr.suggested_value && (
                            <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-200/80 flex items-baseline gap-1.5">
                              <span className="font-semibold text-emerald-600 uppercase text-[9px] tracking-wider shrink-0">
                                Suggested value:
                              </span>
                              <span className="font-mono font-bold text-emerald-900">
                                {cr.suggested_value}
                              </span>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onNavigateToField(fieldDef.intakeSectionKey || group.pageKey, targetKey);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <span>Fix this field</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
