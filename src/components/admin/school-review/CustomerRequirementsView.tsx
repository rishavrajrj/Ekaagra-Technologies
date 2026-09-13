'use client';

import React, { useState, useMemo } from 'react';
import type { CustomerRequirementItem, ReviewStatus } from '@/lib/adminReviewEngine';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Edit3,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface CustomerRequirementsViewProps {
  requirements: CustomerRequirementItem[];
  onUpdateStatus: (requirementId: string, status: ReviewStatus, notes?: string) => Promise<void>;
  onEditOverride: (requirement: CustomerRequirementItem) => void;
  onCreateIssue: (requirement: CustomerRequirementItem) => void;
}

export default function CustomerRequirementsView({
  requirements,
  onUpdateStatus,
  onEditOverride,
  onCreateIssue,
}: CustomerRequirementsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const sections = useMemo(() => {
    const s = new Set<string>();
    requirements.forEach((r) => s.add(r.section));
    return ['ALL', ...Array.from(s)];
  }, [requirements]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (sectionFilter !== 'ALL' && r.section !== sectionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.section.toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q) ||
          r.submittedValue.toLowerCase().includes(q) ||
          r.actualWebsiteResult.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [requirements, statusFilter, sectionFilter, searchQuery]);

  const getStatusBadge = (status: ReviewStatus) => {
    switch (status) {
      case 'MATCHED':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Matched
          </span>
        );
      case 'PARTIALLY_MATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Partially Matched
          </span>
        );
      case 'MISMATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Mismatched
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" />
            Missing
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            N/A
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5" />
            Needs Review
          </span>
        );
    }
  };

  const handleQuickApprove = async (req: CustomerRequirementItem) => {
    setUpdatingId(req.id);
    try {
      await onUpdateStatus(req.id, 'APPROVED', 'Verified by administrator');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <span>Customer Requirements Inventory</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {filteredRequirements.length} of {requirements.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative inventory of everything requested by the customer mapped to live website output.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search requirements..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="MATCHED">Matched</option>
            <option value="PARTIALLY_MATCHED">Partially Matched</option>
            <option value="MISMATCHED">Mismatched</option>
            <option value="MISSING">Missing</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 'ALL' ? 'All Sections' : sec}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requirements List / Table */}
      <div className="space-y-3">
        {filteredRequirements.map((req) => {
          const isPending = updatingId === req.id;
          const isMismatched = req.status === 'MISMATCHED' || req.status === 'PARTIALLY_MATCHED';
          const isMissing = req.status === 'MISSING';

          return (
            <div
              key={req.id}
              className={`bg-white rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs hover:shadow-sm ${
                isMismatched
                  ? 'border-amber-300 bg-amber-50/20'
                  : isMissing
                  ? 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Requirement Meta */}
                <div className="space-y-1.5 min-w-[260px] lg:max-w-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {req.section}
                    </span>
                    {getStatusBadge(req.status)}
                    {req.adminOverride && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                        Admin Corrected
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{req.title}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1" title={req.source}>
                    <span>Source:</span>
                    <span className="font-mono text-[11px] text-slate-700 truncate">{req.source}</span>
                  </p>

                  {req.adminNotes && (
                    <div className="p-2 bg-slate-100 rounded-lg text-xs text-slate-700 italic border border-slate-200 mt-2">
                      &quot;{req.adminNotes}&quot;
                    </div>
                  )}
                </div>

                {/* Center: Side-by-Side Submitted vs Expected vs Actual */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  {/* Submitted Value */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                      Customer Submitted Value
                    </span>
                    <div className="text-xs font-semibold text-slate-900 break-words bg-white p-2.5 rounded-lg border border-slate-200 min-h-[46px] flex items-center">
                      {req.submittedValue}
                    </div>
                    {req.adminOverride && (
                      <span className="text-[10px] text-purple-700 block">
                        Original: &quot;{cleanOriginal(req.rawSubmittedValue)}&quot;
                      </span>
                    )}
                  </div>

                  {/* Actual Website Output */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        Live Website Implementation
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">Page: {req.relatedPage}</span>
                    </div>
                    <div
                      className={`text-xs font-semibold break-words p-2.5 rounded-lg border min-h-[46px] flex items-center ${
                        isMismatched
                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                          : isMissing
                          ? 'bg-rose-50 text-rose-900 border-rose-200'
                          : 'bg-white text-slate-900 border-slate-200'
                      }`}
                    >
                      {req.actualWebsiteResult}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate" title={req.expectedWebsiteResult}>
                      Target: {req.expectedWebsiteResult}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-1.5 shrink-0 pt-2 lg:pt-0">
                  {req.status !== 'MATCHED' && req.status !== 'APPROVED' && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickApprove(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPending ? 'Saving...' : 'Mark Matched'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditOverride(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Value</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCreateIssue(req)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Flag Issue</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredRequirements.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No Requirements Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No customer requirements matched the selected filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function cleanOriginal(val: unknown): string {
  if (val === null || val === undefined) return '(None)';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
