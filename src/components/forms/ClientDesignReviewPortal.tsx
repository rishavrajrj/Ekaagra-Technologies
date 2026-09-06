'use client';

import { useState, useTransition } from 'react';
import type { BusinessProject, DesignReview } from '@/lib/types';
import { submitDesignFeedbackAction } from '@/app/businessProjectActions';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ThumbsUp,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface ClientDesignReviewPortalProps {
  token: string;
  project: BusinessProject;
  activeReview?: DesignReview;
}

export default function ClientDesignReviewPortal({
  token,
  project,
  activeReview,
}: ClientDesignReviewPortalProps) {
  const [decision, setDecision] = useState<'IDLE' | 'APPROVE' | 'REVISE'>('IDLE');
  const [feedback, setFeedback] = useState('');
  const [clientName, setClientName] = useState(project.client?.name || '');
  const [isPending, startTransition] = useTransition();
  const [completedStatus, setCompletedStatus] = useState<'APPROVED' | 'REVISION_REQUESTED' | null>(
    activeReview?.status === 'APPROVED'
      ? 'APPROVED'
      : activeReview?.status === 'REVISION_REQUESTED'
      ? 'REVISION_REQUESTED'
      : null
  );
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitDecision = (selectedDecision: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (selectedDecision === 'REVISION_REQUESTED' && !feedback.trim()) {
      setErrorMsg('Please describe the specific adjustments or revisions you would like us to make.');
      return;
    }

    setErrorMsg('');
    startTransition(async () => {
      if (!activeReview) return;
      const res = await submitDesignFeedbackAction({
        rawToken: token,
        reviewId: activeReview.id,
        decision: selectedDecision,
        feedback: feedback.trim() || undefined,
        clientName: clientName.trim() || undefined,
      });

      if (res.success) {
        setCompletedStatus(selectedDecision);
      } else {
        setErrorMsg(res.error || 'Failed to submit design response. Please try again.');
      }
    });
  };

  if (!activeReview) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4338CA] flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-[#F97360]" />
          </div>
          <h2 className="text-xl font-extrabold text-[#131B2E]">Design Concept In Progress</h2>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Our creative design team is actively preparing your custom concept mockup based on your submitted requirements.
            You will receive an email and WhatsApp notification as soon as the prototype is ready for review!
          </p>
        </div>
      </div>
    );
  }

  if (completedStatus === 'APPROVED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Design Concept Approved &bull; {project.project_number}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#131B2E]">
            Design Approved! Ready for Development.
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md mx-auto">
            Thank you for approving the design concept for <strong>{project.project_name}</strong>. Our engineering team is now initiating development and staging configuration.
          </p>
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-left space-y-1.5">
            <div className="font-bold text-[#131B2E] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Next Milestone: Project Kickoff &amp; Milestone Billing</span>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Your dedicated project lead will share your milestone invoice and development roadmap. You will receive private staging links to test live responsiveness on mobile and desktop.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (completedStatus === 'REVISION_REQUESTED') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <RefreshCw className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Revisions Logged &bull; Version {activeReview.design_version}
          </span>
          <h1 className="text-2xl font-black text-[#131B2E]">
            Revision Request Received!
          </h1>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-md mx-auto">
            Our design team has received your specific feedback and will prepare revised mockups for <strong>{project.project_name}</strong>.
          </p>
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] text-xs text-left space-y-1">
            <span className="font-bold text-[#131B2E]">Your Feedback:</span>
            <p className="text-[#64748B] italic">"{feedback || activeReview.client_feedback}"</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 space-y-6">
      {/* Design Review Header */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            Custom Design Concept Review &bull; v{activeReview.design_version}
          </span>
          <span className="text-[10px] font-mono text-[#64748B] font-bold">
            {project.project_number}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#131B2E]">{activeReview.design_title}</h1>
          <p className="text-xs text-[#64748B]">
            Prepared for <strong>{project.project_name}</strong> by Ekaagra Engineering
          </p>
        </div>

        {activeReview.design_notes && (
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-[#475569] leading-relaxed">
            <strong className="text-[#131B2E] block mb-1">Designer Notes:</strong>
            {activeReview.design_notes}
          </div>
        )}

        {/* Action: Open Prototype */}
        <div className="pt-2">
          <a
            href={activeReview.design_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 bg-[#4338CA] hover:bg-[#3730A3] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer"
          >
            <span>Open Interactive Design Prototype &rarr;</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-center text-[#94A3B8] mt-2">
            Opens in a new window (Figma / Staging prototype / High-res mockup)
          </p>
        </div>
      </div>

      {/* Decision Card */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-black text-[#131B2E]">Your Verdict on this Concept</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            You can either approve the concept to begin development, or request specific adjustments.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {decision === 'IDLE' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setDecision('APPROVE')}
              className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div className="font-black text-sm text-emerald-950">Approve Design Concept</div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                We love the layout, aesthetic, and structure. Proceed to the development phase.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDecision('REVISE')}
              className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-left transition-all cursor-pointer space-y-2 group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="font-black text-sm text-amber-950">Request Revisions</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                We would like adjustments to colors, copy, sections, or layout before final approval.
              </p>
            </button>
          </div>
        )}

        {decision === 'APPROVE' && (
          <div className="space-y-4 p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-emerald-950">Confirm Design Concept Approval</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                By approving this concept, you authorize Ekaagra Technologies to engineer and deploy this exact design.
                Payment for your initial milestone will now be requestable.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#131B2E] uppercase tracking-wider block">Your Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDecision('IDLE')}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#64748B]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSubmitDecision('APPROVED')}
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {isPending ? 'Submitting Approval...' : 'Confirm & Approve Concept ✓'}
              </button>
            </div>
          </div>
        )}

        {decision === 'REVISE' && (
          <div className="space-y-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-950">Describe Your Requested Changes</h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Be as specific as possible so our creative team can produce your exact desired look.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-[#131B2E] uppercase tracking-wider block">
                Feedback &amp; Revision Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Please make the hero background navy blue instead of black, swap the contact form to the right side, and add doctor profile cards..."
                className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDecision('IDLE')}
                disabled={isPending}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-[#64748B]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => handleSubmitDecision('REVISION_REQUESTED')}
                disabled={isPending || !feedback.trim()}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                {isPending ? 'Sending Feedback...' : 'Send Revision Feedback &rarr;'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
