'use client';

import React, { useState } from 'react';
import type { PageVerificationItem, ReviewStatus } from '@/lib/adminReviewEngine';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Edit3,
  MessageSquare,
  Sparkles,
  Layers,
  Globe,
  Search,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

interface PageByPageVerificationViewProps {
  pages: PageVerificationItem[];
  onUpdatePageStatus: (pageKey: string, status: ReviewStatus, notes?: string) => Promise<void>;
  onCreateIssue: (page: PageVerificationItem) => void;
}

export default function PageByPageVerificationView({
  pages,
  onUpdatePageStatus,
  onCreateIssue,
}: PageByPageVerificationViewProps) {
  const [selectedPageKey, setSelectedPageKey] = useState<string>(pages[0]?.pageKey || 'Home');
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const selectedPage = pages.find((p) => p.pageKey === selectedPageKey) || pages[0];

  const handleApprove = async () => {
    if (!selectedPage) return;
    setIsUpdating(true);
    try {
      await onUpdatePageStatus(selectedPage.pageKey, 'APPROVED', adminNoteInput || 'Verified page requirements');
      setAdminNoteInput('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedPage) return;
    setIsUpdating(true);
    try {
      await onUpdatePageStatus(selectedPage.pageKey, 'CHANGES_REQUIRED', adminNoteInput || 'Changes required on this page');
      setAdminNoteInput('');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'APPROVED':
      case 'MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'CHANGES_REQUIRED':
      case 'MISMATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Issues Found
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Missing
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Not Requested
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            Needs Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <span>Page-by-Page Website Verification</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
            {pages.length} Pages Configured
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify every public website page individually: required sections, implemented features, content diffs, CTAs, and SEO metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Pages Navigation List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2 h-fit">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block px-1">
            Website Pages Directory
          </span>

          <div className="space-y-1.5">
            {pages.map((p) => {
              const isSelected = p.pageKey === selectedPageKey;
              return (
                <button
                  key={p.pageKey}
                  type="button"
                  onClick={() => setSelectedPageKey(p.pageKey)}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                      : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">{p.label}</span>
                      {!p.isRequiredByCustomer && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-bold">
                          Optional
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 block truncate">{p.slug}</span>
                  </div>

                  <div className="shrink-0">{getStatusBadge(p.status)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Page Deep Dive */}
        {selectedPage && (
          <div className="lg:col-span-2 space-y-4">
            {/* Page Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{selectedPage.label}</h3>
                    {getStatusBadge(selectedPage.status)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedPage.slug}
                    </span>
                    <span>•</span>
                    <span>{selectedPage.customerPurpose}</span>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleApprove}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Page</span>
                  </button>

                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleRequestChanges}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateIssue(selectedPage)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Flag Issue</span>
                  </button>
                </div>
              </div>

              {/* Sections Checklist */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Required vs Implemented Sections
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPage.requiredSections.map((sec) => (
                    <div
                      key={sec.key}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                        sec.isImplemented
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {sec.isImplemented ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold">{sec.name}</span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">
                        {sec.isImplemented ? 'Live' : 'Missing'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Comparison */}
              {selectedPage.ctaComparison.submittedCta && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                    Call To Action (CTA) Verification
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Submitted CTA</span>
                      <span className="font-bold text-slate-800">{selectedPage.ctaComparison.submittedCta}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Website CTA</span>
                      <span className="font-bold text-slate-800">{selectedPage.ctaComparison.implementedCta}</span>
                    </div>
                  </div>
                  {!selectedPage.ctaComparison.isMatched && (
                    <p className="text-xs text-amber-700 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Warning: Live CTA text differs from customer specification.
                    </p>
                  )}
                </div>
              )}

              {/* SEO & Meta Verification */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Search Engine Optimization (SEO)
                </span>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-bold">Meta Title:</span>{' '}
                    <span className="text-slate-900 font-semibold">{selectedPage.seo.metaTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Meta Description:</span>{' '}
                    <span className="text-slate-700">{selectedPage.seo.metaDescription}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-bold">Canonical Route:</span>{' '}
                    <span className="font-mono text-indigo-600">{selectedPage.seo.canonicalUrl}</span>
                  </div>
                </div>
              </div>

              {/* Admin Note Input */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-slate-700 block">Admin Verification Notes for this Page</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Enter review findings or developer instructions..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
