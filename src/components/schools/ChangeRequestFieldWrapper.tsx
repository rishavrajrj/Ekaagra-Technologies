'use client';

import React from 'react';
import { AlertCircle, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import type { SchoolIntakeChangeRequest } from '@/lib/types';
import { isRequestActivePending, isRequestAwaitingAdminReview } from '@/lib/canonicalFieldRegistry';

export interface ChangeRequestFieldWrapperProps {
  canonicalKey: string;
  fieldLabel?: string;
  fieldKey?: string;
  sectionKey?: string;
  request?: SchoolIntakeChangeRequest | null;
  isEditable?: boolean;
  className?: string;
  children: React.ReactNode;
  onOpenResponseModal?: (cr: SchoolIntakeChangeRequest) => void;
}

/**
 * Reusable Field-Level Change Request Wrapper
 * Meets Requirements 7, 10, 15, 20, 21, 22:
 * - Deterministic data-field-key attribute for deep links and automated scrolling
 * - Keeps the canonical onboarding input 100% editable (no duplicate inputs)
 * - Accessible text + icons for non-color-only communication
 * - Distinct visual states: Active Change Requested vs Updated Awaiting Admin Review
 */
export default function ChangeRequestFieldWrapper({
  canonicalKey,
  fieldLabel,
  request,
  isEditable = true,
  className = '',
  children,
  onOpenResponseModal,
}: ChangeRequestFieldWrapperProps) {
  const isPending = isRequestActivePending(request);
  const isAwaitingReview = isRequestAwaitingAdminReview(request);
  const hasCR = Boolean(request && (isPending || isAwaitingReview));

  // Determine wrapper container styling based on state
  let containerStyle = 'space-y-1.5 transition-all duration-200';
  if (isPending) {
    containerStyle =
      'p-3.5 sm:p-4 rounded-2xl border border-amber-400/80 bg-amber-50/25 ring-2 ring-amber-300/20 shadow-2xs space-y-2 relative transition-all duration-200';
  } else if (isAwaitingReview) {
    containerStyle =
      'p-3.5 sm:p-4 rounded-2xl border border-indigo-200 bg-indigo-50/15 ring-2 ring-indigo-200/20 shadow-2xs space-y-2 relative transition-all duration-200';
  }

  const instructionId = `cr-instruction-${canonicalKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  return (
    <div
      data-field-key={canonicalKey}
      id={`field-container-${canonicalKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
      className={`${containerStyle} ${className}`}
      aria-describedby={hasCR ? instructionId : undefined}
    >
      {/* Field Label + Single State Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {fieldLabel && (
          <label className="block font-bold text-xs sm:text-sm text-[#131B2E]">
            {fieldLabel}
          </label>
        )}

        {isPending && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
            role="status"
            aria-label="Change requested by reviewer"
          >
            <span>⚠️</span>
            <span>Change requested</span>
          </span>
        )}

        {isAwaitingReview && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200"
            role="status"
            aria-label="Updated, awaiting reviewer verification"
          >
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-indigo-600" aria-hidden="true" />
            <span>Updated — awaiting review</span>
          </span>
        )}
      </div>

      {/* The actual editable input rendered as child */}
      <div className="relative">{children}</div>

      {/* Reviewer Instructions Box */}
      {hasCR && request && (
        <div
          id={instructionId}
          className={`mt-2 rounded-xl p-3 border text-xs leading-relaxed transition-all ${
            isPending
              ? 'bg-white border-amber-200/80 text-slate-800 shadow-2xs'
              : 'bg-white border-indigo-100 text-slate-800 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
            <span className="text-[11px] font-bold text-slate-700">
              Reviewer note:
            </span>

            {onOpenResponseModal && (
              <button
                type="button"
                onClick={() => onOpenResponseModal(request)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
              >
                {request.school_response ? 'Edit note' : 'Add note'}
              </button>
            )}
          </div>

          <p className="mt-1.5 text-slate-800 text-xs italic">
            &ldquo;{request.request_comment || 'Please update this field per reviewer requirements.'}&rdquo;
          </p>

          {request.suggested_value && (
            <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 flex items-baseline gap-1.5">
              <span className="font-bold text-slate-500 uppercase not-font-mono text-[9px] tracking-wider">
                Suggested value:
              </span>
              <span className="font-bold text-slate-900">{request.suggested_value}</span>
            </div>
          )}

          {request.school_response && (
            <div className="mt-2 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900">
              <span className="font-bold">Your response: </span>
              <span className="italic">&ldquo;{request.school_response}&rdquo;</span>
              {request.school_updated_value && (
                <div className="mt-0.5 font-mono text-[10px] text-emerald-800 font-medium">
                  Updated value: {request.school_updated_value}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
