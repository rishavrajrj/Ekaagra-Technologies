'use client';

import React, { useState } from 'react';
import type { ProjectReviewScorecard } from '@/lib/adminReviewEngine';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  ArrowRight,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface FinalApprovalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  scorecard: ProjectReviewScorecard;
  onConfirmApproval: (notes: string) => Promise<void>;
  onNavigateToTab?: (tabKey: string) => void;
  isLoading?: boolean;
}

export default function FinalApprovalGateModal({
  isOpen,
  onClose,
  scorecard,
  onConfirmApproval,
  onNavigateToTab,
  isLoading = false,
}: FinalApprovalGateModalProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);

  if (!isOpen) return null;

  // 7 Safety Gates
  const gates = [
    {
      id: 'requirements',
      title: 'Customer Requirements Inventory',
      status: scorecard.counts.matchedRequirements >= Math.min(10, scorecard.counts.totalRequirements),
      detail: `${scorecard.counts.matchedRequirements} of ${scorecard.counts.totalRequirements} requirements reviewed and verified.`,
      targetTab: 'requirements',
    },
    {
      id: 'pages',
      title: 'Page-by-Page Verification',
      status: scorecard.counts.implementedPages >= scorecard.counts.totalPages,
      detail:
        scorecard.counts.implementedPages >= scorecard.counts.totalPages
          ? `All ${scorecard.counts.totalPages} essential school pages verified.`
          : `${scorecard.counts.totalPages - scorecard.counts.implementedPages} pages pending verification.`,
      targetTab: 'pages',
    },
    {
      id: 'content',
      title: 'Content Diff & Fidelity',
      status: scorecard.contentMatch >= 75,
      detail: `Content match score is ${scorecard.contentMatch}% (Threshold: 75%).`,
      targetTab: 'content-comparison',
    },
    {
      id: 'branding',
      title: 'Branding & Design Tokens',
      status: scorecard.designMatch >= 75,
      detail: scorecard.designMatch >= 75
        ? 'Logo, Favicon, WCAG contrast & fonts approved.'
        : `Design tokens match score is ${scorecard.designMatch}%.`,
      targetTab: 'branding',
    },
    {
      id: 'documents',
      title: 'Statutory Compliance Documents',
      status: scorecard.counts.verifiedDocuments >= scorecard.counts.totalDocuments,
      detail:
        scorecard.counts.verifiedDocuments >= scorecard.counts.totalDocuments
          ? 'All statutory certificates verified.'
          : `${scorecard.counts.totalDocuments - scorecard.counts.verifiedDocuments} statutory documents missing.`,
      targetTab: 'documents',
    },
    {
      id: 'media',
      title: 'Media Asset Placement',
      status: scorecard.counts.usedMediaAssets > 0,
      detail: `${scorecard.counts.usedMediaAssets} of ${scorecard.counts.totalMediaAssets} assets bound to site templates.`,
      targetTab: 'media',
    },
    {
      id: 'blockers',
      title: 'Zero Critical Blockers',
      status: scorecard.counts.criticalIssues === 0,
      detail:
        scorecard.counts.criticalIssues === 0
          ? 'Zero critical blockers active.'
          : `${scorecard.counts.criticalIssues} critical blockers must be resolved first.`,
      targetTab: 'issues',
    },
  ];

  const failedBlockers = gates.filter((g) => !g.status && (g.id === 'blockers' || g.id === 'documents'));
  const hasHardBlocker = failedBlockers.length > 0;
  const allPassed = gates.every((g) => g.status);

  const canApprove = (allPassed || (!hasHardBlocker && acknowledgedWarnings)) && !isLoading;

  const handleConfirm = async () => {
    if (!canApprove) return;
    await onConfirmApproval(approvalNotes.trim() || 'Verified all customer requirements and website presentation.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">7-Point Pre-Publication Safety Gate</h3>
              <p className="text-xs text-slate-500">
                Final administrative verification before locking this school project for technical website build.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Gate List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {gates.map((gate, idx) => (
            <div
              key={gate.id}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                gate.status
                  ? 'bg-emerald-50/50 border-emerald-200/80 text-slate-800'
                  : gate.id === 'blockers' || gate.id === 'documents'
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0">
                  {gate.status ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : gate.id === 'blockers' || gate.id === 'documents' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{gate.title}</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-0.5 truncate">{gate.detail}</p>
                </div>
              </div>

              {!gate.status && onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab(gate.targetTab);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 shrink-0 cursor-pointer px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs"
                >
                  <span>Resolve</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Hard blocker warning */}
        {hasHardBlocker && (
          <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Approval Locked:</strong> Critical issues or statutory certificates are still missing. You cannot approve this project until all critical blockers are resolved.
            </p>
          </div>
        )}

        {/* Warning acknowledgement if no hard blocker but some soft warnings */}
        {!hasHardBlocker && !allPassed && (
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Some non-critical verifications or warnings remain open. You may proceed if you have verified these items manually.
            </p>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledgedWarnings}
                onChange={(e) => setAcknowledgedWarnings(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <span>I acknowledge open non-critical items and approve build readiness.</span>
            </label>
          </div>
        )}

        {/* Final Sign-off Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Approval &amp; Sign-off Notes</label>
          <textarea
            rows={2}
            placeholder="Document any special customer agreements or build instructions..."
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canApprove}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Locking Project...' : 'Confirm Final Approval & Lock for Build'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
