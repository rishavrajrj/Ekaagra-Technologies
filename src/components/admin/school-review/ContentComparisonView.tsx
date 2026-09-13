'use client';

import React, { useState } from 'react';
import type { ContentDiffItem } from '@/lib/adminReviewEngine';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Edit3,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ContentComparisonViewProps {
  diffs: ContentDiffItem[];
  onEditContent: (diff: ContentDiffItem) => void;
  onFlagIssue: (diff: ContentDiffItem) => void;
}

export default function ContentComparisonView({
  diffs,
  onEditContent,
  onFlagIssue,
}: ContentComparisonViewProps) {
  const [filter, setFilter] = useState<'ALL' | 'MISMATCHED' | 'MATCHED' | 'MISSING'>('ALL');
  const [search, setSearch] = useState('');

  const filteredDiffs = diffs.filter((d) => {
    if (filter === 'MISMATCHED' && d.status !== 'MISMATCHED') return false;
    if (filter === 'MATCHED' && d.status !== 'MATCHED') return false;
    if (filter === 'MISSING' && d.status !== 'MISSING') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.section.toLowerCase().includes(q) ||
        d.submittedText.toLowerCase().includes(q) ||
        d.websiteText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Automated Content Comparison</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {diffs.length} Text Blocks
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic diffing between customer onboarding submissions and live generated website copy.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search content diffs..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['ALL', 'MISMATCHED', 'MATCHED', 'MISSING'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="space-y-3">
        {filteredDiffs.map((diff) => {
          const isMatched = diff.status === 'MATCHED';
          const isMissing = diff.status === 'MISSING';
          const isMismatched = diff.status === 'MISMATCHED';

          return (
            <div
              key={diff.id}
              className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition ${
                isMismatched
                  ? 'border-amber-300 bg-amber-50/20'
                  : isMissing
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {diff.section}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{diff.title}</h3>
                  <span className="text-xs text-slate-400">• Expected on {diff.expectedLocation}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isMatched && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Content Matches ({diff.matchScore}%)
                    </span>
                  )}
                  {isMismatched && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Mismatch Detected ({diff.matchScore}%)
                    </span>
                  )}
                  {isMissing && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      Missing from Website
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditContent(diff)}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                    title="Edit Website Data"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onFlagIssue(diff)}
                    className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 transition cursor-pointer"
                    title="Create Issue"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Side-by-Side Content Diff Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    SUBMITTED BY CUSTOMER
                  </span>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-900 leading-relaxed min-h-[70px]">
                    {diff.submittedText}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    IMPLEMENTED ON WEBSITE
                  </span>
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-medium leading-relaxed min-h-[70px] ${
                      isMismatched
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-semibold'
                        : isMissing
                        ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                        : 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                    }`}
                  >
                    {diff.websiteText}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
