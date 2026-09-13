'use client';

import React, { useState, useMemo } from 'react';
import type { ReviewIssueItem, IssueSeverity } from '@/lib/adminReviewEngine';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Check,
  Tag,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface IssuesTrackerViewProps {
  issues: ReviewIssueItem[];
  onLogIssue: (issue: {
    title: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    section: string;
    sectionKey: string;
    requirementTitle?: string;
    expectedValue?: string;
    actualValue?: string;
    explanation: string;
    relatedPage?: string;
    relatedField?: string;
    adminNotes?: string;
  }) => void;
  onResolveIssue: (issueId: string) => void;
  onJumpToTarget?: (tab: string, fieldKey?: string) => void;
}

export default function IssuesTrackerView({
  issues,
  onLogIssue,
  onResolveIssue,
  onJumpToTarget,
}: IssuesTrackerViewProps) {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('OPEN');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // New Issue Form State
  const [newTitle, setNewTitle] = useState('');
  const [newExplanation, setNewExplanation] = useState('');
  const [newSection, setNewSection] = useState('General Information');
  const [newSectionKey, setNewSectionKey] = useState('schoolProfile');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [newRelatedPage, setNewRelatedPage] = useState('Home');

  const filteredIssues = useMemo(() => {
    return issues.filter((iss) => {
      if (filterSeverity !== 'all' && iss.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && iss.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          iss.title.toLowerCase().includes(q) ||
          iss.explanation.toLowerCase().includes(q) ||
          iss.section.toLowerCase().includes(q) ||
          (iss.relatedField && iss.relatedField.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [issues, filterSeverity, filterStatus, search]);

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL' && i.status === 'OPEN').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH' && i.status === 'OPEN').length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED').length;
  const totalOpen = issues.filter((i) => i.status === 'OPEN').length;

  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onLogIssue({
      title: newTitle.trim(),
      explanation: newExplanation.trim() || newTitle.trim(),
      section: newSection.trim(),
      sectionKey: newSectionKey.trim(),
      severity: newSeverity,
      adminNotes: newAdminNotes.trim() || undefined,
      relatedPage: newRelatedPage.trim() || undefined,
    });
    setNewTitle('');
    setNewExplanation('');
    setNewAdminNotes('');
    setIsLogModalOpen(false);
  };

  const getSeverityBadge = (sev: IssueSeverity) => {
    if (sev === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          <span>Critical Blocker</span>
        </span>
      );
    }
    if (sev === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3" />
          <span>High Severity</span>
        </span>
      );
    }
    if (sev === 'MEDIUM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Info className="w-3 h-3" />
          <span>Medium</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
        <Info className="w-3 h-3" />
        <span>Low</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── METRIC CARDS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Blockers</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {criticalCount}
            </span>
            <span className={`text-xs font-bold ${criticalCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {criticalCount === 0 ? 'Zero Blockers' : 'Blocks Launch'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Legal, safety, or contact data missing</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">High Issues</span>
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-black ${highCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {highCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Review advised</span>
          </div>
          <p className="text-[11px] text-slate-500">Copy polish or image resolution</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Resolved</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{resolvedCount}</span>
            <span className="text-xs font-semibold text-emerald-600">Fixed</span>
          </div>
          <p className="text-[11px] text-slate-500">Issues successfully cleared</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Open Issues</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalOpen}</span>
            <span className="text-xs font-semibold text-slate-500">Remaining</span>
          </div>
          <p className="text-[11px] text-slate-500">Auto-detected + Manual</p>
        </div>
      </div>

      {/* ─── CONTROLS & LOG ISSUE BUTTON ──────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues by title, section, or explanation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All (Open + Resolved)</option>
            <option value="OPEN">Open Issues Only</option>
            <option value="RESOLVED">Resolved Only</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="CRITICAL">Critical Blockers</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Issue</span>
          </button>
        </div>
      </div>

      {/* ─── ISSUES LIST ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredIssues.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-900">No issues found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All checks matching the active filters are clear. Zero unresolved issues in this scope.
            </p>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isResolved = issue.status === 'RESOLVED';

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                  isResolved
                    ? 'border-slate-200 opacity-60 bg-slate-50/40'
                    : issue.severity === 'CRITICAL'
                    ? 'border-rose-200 bg-rose-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(issue.severity)}
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {issue.section}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Source: <strong className="uppercase">{issue.source}</strong>
                      </span>
                      {issue.relatedPage && (
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded">
                          Page: {issue.relatedPage}
                        </span>
                      )}
                    </div>

                    <h4 className={`text-sm font-bold text-slate-900 ${isResolved ? 'line-through text-slate-500' : ''}`}>
                      {issue.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">{issue.explanation}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-start">
                    {!isResolved ? (
                      <button
                        type="button"
                        onClick={() => onResolveIssue(issue.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolved</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Values comparison if present */}
                {(issue.expectedValue || issue.actualValue || issue.adminNotes) && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                    {issue.expectedValue && (
                      <div>
                        <span className="font-bold text-slate-500">Expected Result: </span>
                        <span className="font-mono text-slate-800">{issue.expectedValue}</span>
                      </div>
                    )}
                    {issue.actualValue && (
                      <div>
                        <span className="font-bold text-slate-500">Actual Website Result: </span>
                        <span className="font-mono text-slate-800">{issue.actualValue}</span>
                      </div>
                    )}
                    {issue.adminNotes && (
                      <div>
                        <span className="font-bold text-indigo-600">Admin Notes: </span>
                        <span>{issue.adminNotes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ─── LOG ISSUE MODAL ──────────────────────────────────────────────── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Log Review Issue</h3>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Missing Affiliation Number in Footer"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    <option value="CRITICAL">Critical Blocker</option>
                    <option value="HIGH">High Severity</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Section</label>
                  <input
                    type="text"
                    value={newSection}
                    onChange={(e) => {
                      setNewSection(e.target.value);
                      setNewSectionKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Explanation</label>
                <textarea
                  rows={3}
                  placeholder="Describe the defect, missing item, or mismatch..."
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Admin Notes / Suggested Action</label>
                <input
                  type="text"
                  placeholder="e.g., Admin override required or request customer re-upload"
                  value={newAdminNotes}
                  onChange={(e) => setNewAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                >
                  Log Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
