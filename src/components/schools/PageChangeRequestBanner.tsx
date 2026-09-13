'use client';

import React from 'react';
import { AlertTriangle, ArrowDown, ChevronRight, CornerDownRight } from 'lucide-react';
import type { SchoolIntakeChangeRequest } from '@/lib/types';
import { lookupCanonicalField } from '@/lib/canonicalFieldRegistry';

export interface PageChangeRequestBannerProps {
  pageTitle: string;
  requests: SchoolIntakeChangeRequest[];
  onScrollToField: (fieldKey: string) => void;
}

/**
 * Compact, Single Section-Level Change Request Notification
 * Meets Requirements 3, 10, 21:
 * - Replaces multiple competing section banners with ONE calm notification
 * - Shows "⚠️ X changes requested in this section"
 * - Compact list of affected fields with 1-click scroll navigation
 * - Avoids repeating heavy cards inside section
 */
export default function PageChangeRequestBanner({
  pageTitle,
  requests,
  onScrollToField,
}: PageChangeRequestBannerProps) {
  if (!requests || requests.length === 0) return null;

  const count = requests.length;

  return (
    <div
      role="region"
      aria-label={`Change requests for ${pageTitle}`}
      className="bg-amber-50/70 border border-amber-300/90 rounded-2xl p-3.5 sm:p-4 mb-6 shadow-2xs text-xs text-slate-800"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="font-bold text-amber-950 text-xs sm:text-sm">
              {count} {count === 1 ? 'change' : 'changes'} requested in this section
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 pt-0.5">
            {requests.map((cr, idx) => {
              const fieldDef = lookupCanonicalField(cr.field_key || cr.asset_id || '', cr.page_key || cr.section_key);
              const targetKey = fieldDef.canonicalKey || fieldDef.fieldKey || cr.field_key || '';
              const label = cr.field_label || fieldDef.fieldLabel || 'Field';

              return (
                <button
                  key={cr.id || idx}
                  type="button"
                  onClick={() => onScrollToField(targetKey)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/90 hover:bg-amber-100/80 border border-amber-200 text-amber-950 font-medium text-[11px] transition-colors cursor-pointer shadow-2xs"
                  title="Click to scroll to this field"
                >
                  <span className="text-amber-700">•</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const first = requests[0];
            if (first) {
              const def = lookupCanonicalField(first.field_key || first.asset_id || '', first.section_key);
              onScrollToField(def.canonicalKey || def.fieldKey || first.field_key || '');
            }
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer self-start sm:self-center shrink-0"
        >
          <span>Review changes</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
