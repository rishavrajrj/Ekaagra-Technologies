'use client';

import React from 'react';
import type { ProjectReviewScorecard } from '@/lib/adminReviewEngine';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Layers,
  Image as ImageIcon,
  ShieldCheck,
  Palette,
  AlertCircle,
  ExternalLink,
  Download,
  Terminal,
  Sparkles,
} from 'lucide-react';

interface ReviewScorecardBarProps {
  scorecard: ProjectReviewScorecard;
  activeView: string;
  onSelectView: (viewKey: string) => void;
  onOpenPreview: () => void;
  onOpenHandoff: () => void;
  onOpenApproval: () => void;
  onExportZip: () => void;
  isExportingZip?: boolean;
}

export default function ReviewScorecardBar({
  scorecard,
  activeView,
  onSelectView,
  onOpenPreview,
  onOpenHandoff,
  onOpenApproval,
  onExportZip,
  isExportingZip = false,
}: ReviewScorecardBarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top Row: Overall Readiness & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div
            className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${getScoreColor(
              scorecard.overallReadiness
            )}`}
          >
            <span className="text-xl font-black leading-none">{scorecard.overallReadiness}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Readiness</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Project Review &amp; Website Health</h3>
              {scorecard.isReadyForApproval ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready for Approval
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {scorecard.approvalBlockers.length} Blocker{scorecard.approvalBlockers.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {scorecard.counts.totalPages} Pages • {scorecard.counts.totalRequirements} Requirements •{' '}
              {scorecard.counts.totalDocuments} Documents • {scorecard.counts.totalMediaAssets} Media Assets •{' '}
              <span className={scorecard.counts.criticalIssues > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                {scorecard.counts.totalIssues} Issue{scorecard.counts.totalIssues !== 1 ? 's' : ''} (
                {scorecard.counts.criticalIssues} Critical)
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Live Website Preview</span>
          </button>

          <button
            type="button"
            onClick={onOpenHandoff}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Terminal className="w-4 h-4" />
            <span>Developer Handoff</span>
          </button>

          <button
            type="button"
            onClick={onExportZip}
            disabled={isExportingZip}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExportingZip ? 'Packaging...' : 'Export ZIP'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenApproval}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Approve &amp; Lock Project</span>
          </button>
        </div>
      </div>

      {/* Health Scorecard Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Completeness</span>
            <span className="font-bold text-slate-800">{scorecard.informationCompleteness}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.informationCompleteness)}`}
              style={{ width: `${scorecard.informationCompleteness}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Customer Input</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Website Match</span>
            <span className="font-bold text-slate-800">{scorecard.websiteRequirementMatch}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.websiteRequirementMatch)}`}
              style={{ width: `${scorecard.websiteRequirementMatch}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {scorecard.counts.matchedRequirements}/{scorecard.counts.totalRequirements} Matched
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Content Match</span>
            <span className="font-bold text-slate-800">{scorecard.contentMatch}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.contentMatch)}`}
              style={{ width: `${scorecard.contentMatch}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {scorecard.counts.matchedContentItems}/{scorecard.counts.totalContentItems} Verified
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Design Match</span>
            <span className="font-bold text-slate-800">{scorecard.designMatch}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.designMatch)}`}
              style={{ width: `${scorecard.designMatch}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Colors &amp; Typography</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Documents</span>
            <span className="font-bold text-slate-800">{scorecard.documentsVerified}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.documentsVerified)}`}
              style={{ width: `${scorecard.documentsVerified}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Statutory &amp; Disclosures</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Media Usage</span>
            <span className="font-bold text-slate-800">{scorecard.mediaUsage}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${getProgressBarColor(scorecard.mediaUsage)}`}
              style={{ width: `${scorecard.mediaUsage}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {scorecard.counts.usedMediaAssets}/{scorecard.counts.totalMediaAssets} Live on Site
          </span>
        </div>
      </div>

      {/* Navigation Quick Jump Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 text-xs scrollbar-thin">
        {[
          { key: 'overview', label: 'Overview', icon: Layers },
          { key: 'requirements', label: `Customer Requirements (${scorecard.counts.totalRequirements})`, icon: FileText },
          { key: 'website-verification', label: 'Website & Preview', icon: ExternalLink },
          { key: 'pages', label: `Pages (${scorecard.counts.totalPages})`, icon: Layers },
          { key: 'content-comparison', label: 'Content Diff', icon: FileText },
          { key: 'structured-data', label: 'Structured Data', icon: Layers },
          { key: 'documents', label: `Documents (${scorecard.counts.totalDocuments})`, icon: ShieldCheck },
          { key: 'media', label: `Media (${scorecard.counts.totalMediaAssets})`, icon: ImageIcon },
          { key: 'branding', label: 'Design & Theme', icon: Palette },
          {
            key: 'issues',
            label: `Issues (${scorecard.counts.totalIssues})`,
            icon: AlertCircle,
            badge: scorecard.counts.criticalIssues > 0 ? `${scorecard.counts.criticalIssues} Critical` : undefined,
          },
          { key: 'developer-handoff', label: 'Developer Handoff', icon: Terminal },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectView(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
