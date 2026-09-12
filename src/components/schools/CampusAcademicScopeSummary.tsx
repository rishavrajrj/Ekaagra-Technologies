'use client';

import React from 'react';
import { GraduationCap, AlertCircle, Layers, ArrowRight } from 'lucide-react';
import type { CanonicalCampusAcademicScope } from '@/lib/campusAcademicScopeService';

interface CampusAcademicScopeSummaryProps {
  scope: CanonicalCampusAcademicScope;
  onNavigateToClasses?: () => void;
  /** Compact mode hides secondary details */
  compact?: boolean;
}

/**
 * Contextual scope header component displaying the active campus's academic scope.
 * Renders class badges, class range, academic levels, and class count.
 * Shows a friendly empty state with a "Configure Campus Classes" button when no classes are configured.
 */
export default function CampusAcademicScopeSummary({
  scope,
  onNavigateToClasses,
  compact = false,
}: CampusAcademicScopeSummaryProps) {
  if (!scope.hasClasses) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-[#131B2E]">
              No Classes Configured for {scope.campusName}
            </h4>
            <p className="text-xs text-[#64748B] mt-1">
              Please configure classes under Campus Academic Scope &amp; Levels before setting up this section.
              All class-dependent features will use the campus academic scope as the single source of truth.
            </p>
            {onNavigateToClasses && (
              <button
                type="button"
                onClick={onNavigateToClasses}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#4338CA] rounded-lg hover:bg-[#3730A3] transition-colors"
              >
                Configure Campus Classes
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <GraduationCap className="w-5 h-5 text-[#4338CA]" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider">
              Academic Scope
            </span>
            {!scope.isMainCampus && (
              <span className="text-[10px] font-medium text-[#64748B] bg-white px-2 py-0.5 rounded-full border border-[#E2E8F0]">
                {scope.campusName}
              </span>
            )}
          </div>

          {/* Class Range */}
          {scope.classRange && (
            <p className="text-sm font-semibold text-[#131B2E] mt-1">
              {scope.classRange}
            </p>
          )}

          {/* Class Badges */}
          {!compact && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {scope.classNames.map((cls) => (
                <span
                  key={cls}
                  className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-[#4338CA] bg-white border border-indigo-200 rounded-md"
                >
                  {cls}
                </span>
              ))}
            </div>
          )}

          {/* Footer: Levels and Count */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-[#64748B]">
            {scope.academicLevels.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {scope.academicLevels.join(', ')}
              </span>
            )}
            <span className="font-medium">
              {scope.classNames.length} {scope.classNames.length === 1 ? 'class' : 'classes'} configured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
