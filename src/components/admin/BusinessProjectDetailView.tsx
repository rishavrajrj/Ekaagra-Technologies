'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type {
  BusinessProject,
  BusinessRequirementSubmission,
  DesignReview,
  ProjectActivity,
  ProjectNote,
  Client,
  BusinessProjectStatus,
} from '@/lib/types';
import {
  updateBusinessProjectStatusAction,
  updateRequirementsReviewAction,
  createDesignReviewAction,
  regenerateBusinessOnboardingTokenAction,
  addProjectNoteAction,
  createPostDesignPaymentMilestoneAction,
} from '@/app/businessProjectActions';
import Logo from '@/components/ui/Logo';
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Layers,
  FileText,
  CreditCard,
  MessageSquare,
  Building,
  Phone,
  Mail,
  RefreshCw,
  Plus,
  Lock,
  DollarSign,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface BusinessProjectDetailViewProps {
  project: BusinessProject;
  client?: Client;
  latestSubmission?: BusinessRequirementSubmission;
  submissions: BusinessRequirementSubmission[];
  designReviews: DesignReview[];
  activities: ProjectActivity[];
  notes: ProjectNote[];
  initialOnboardingUrl?: string;
}

export default function BusinessProjectDetailView({
  project: initialProject,
  client,
  latestSubmission,
  submissions,
  designReviews: initialDesignReviews,
  activities: initialActivities,
  notes: initialNotes,
  initialOnboardingUrl,
}: BusinessProjectDetailViewProps) {
  const [project, setProject] = useState<BusinessProject>(initialProject);
  const [designReviews, setDesignReviews] = useState<DesignReview[]>(initialDesignReviews);
  const [activities, setActivities] = useState<ProjectActivity[]>(initialActivities);
  const [notes, setNotes] = useState<ProjectNote[]>(initialNotes);
  const [activeTab, setActiveTab] = useState<'REQUIREMENTS' | 'DESIGN' | 'PAYMENT' | 'TIMELINE' | 'NOTES'>('REQUIREMENTS');

  const [onboardingUrl, setOnboardingUrl] = useState<string | undefined>(initialOnboardingUrl);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Status Change Dialog
  const [statusMsg, setStatusMsg] = useState('');

  // Clarification Form
  const [clarificationNotes, setClarificationNotes] = useState('');
  const [showClarificationBox, setShowClarificationBox] = useState(false);

  // New Design Review Form
  const [showNewDesignBox, setShowNewDesignBox] = useState(false);
  const [designForm, setDesignForm] = useState({
    title: `Concept v${designReviews.length + 1} — Initial Concept`,
    url: '',
    notes: '',
  });

  // Post-Design Payment Milestone Form
  const [showPaymentBox, setShowPaymentBox] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amountINR: 5000,
    title: 'Milestone 1: 50% Project Advance (Post-Design Approval)',
  });
  const [createdPaymentUrl, setCreatedPaymentUrl] = useState<string | null>(null);

  // Internal Note
  const [noteContent, setNoteContent] = useState('');

  const handleStatusUpdate = (newStatus: BusinessProjectStatus) => {
    startTransition(async () => {
      const res = await updateBusinessProjectStatusAction(project.id, newStatus);
      if (res.success) {
        setProject((prev) => ({ ...prev, project_status: newStatus }));
        setStatusMsg('Status updated ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleMarkReviewed = () => {
    if (!latestSubmission) return;
    startTransition(async () => {
      const res = await updateRequirementsReviewAction({
        projectId: project.id,
        submissionId: latestSubmission.id,
        reviewStatus: 'REVIEWED',
        adminNotes: 'Requirements reviewed and approved. Transitioned to design phase.',
      });
      if (res.success) {
        setProject((prev) => ({ ...prev, project_status: 'DESIGN_IN_PROGRESS' }));
        setStatusMsg('Requirements marked as Reviewed ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleSendClarification = () => {
    if (!latestSubmission || !clarificationNotes.trim()) return;
    startTransition(async () => {
      const res = await updateRequirementsReviewAction({
        projectId: project.id,
        submissionId: latestSubmission.id,
        reviewStatus: 'CLARIFICATION_REQUESTED',
        clarificationNotes: clarificationNotes.trim(),
        clientEmail: client?.email || project.client?.email,
        clientName: client?.name || project.client?.name,
        projectName: project.project_name,
        onboardingUrl: onboardingUrl ? `https://www.ekaagratechnologies.site${onboardingUrl}` : undefined,
      });

      if (res.success) {
        setProject((prev) => ({ ...prev, project_status: 'CLARIFICATION_REQUESTED' }));
        setShowClarificationBox(false);
        setClarificationNotes('');
        setStatusMsg('Clarification request dispatched to client ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleCreateDesignReview = () => {
    if (!designForm.title.trim() || !designForm.url.trim()) return;
    startTransition(async () => {
      const res = await createDesignReviewAction({
        projectId: project.id,
        designTitle: designForm.title.trim(),
        designUrl: designForm.url.trim(),
        designNotes: designForm.notes.trim() || undefined,
        clientEmail: client?.email || project.client?.email,
        clientName: client?.name || project.client?.name,
        projectName: project.project_name,
        token: onboardingUrl?.split('/')[2] || 'active',
      });

      if (res.success && res.designReview) {
        setDesignReviews([res.designReview, ...designReviews]);
        setProject((prev) => ({ ...prev, project_status: 'DESIGN_READY' }));
        setShowNewDesignBox(false);
        setStatusMsg('Design review concept created and client notified ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleGeneratePaymentMilestone = () => {
    startTransition(async () => {
      const res = await createPostDesignPaymentMilestoneAction({
        projectId: project.id,
        leadId: project.lead_id || undefined,
        customerName: client?.name || project.client?.name || 'Valued Client',
        customerEmail: client?.email || project.client?.email || 'client@ekaagra.site',
        customerPhone: client?.phone || project.client?.phone || '9999999999',
        amountINR: paymentForm.amountINR,
        milestoneTitle: paymentForm.title,
      });

      if (res.success && res.paymentUrl) {
        setCreatedPaymentUrl(res.paymentUrl);
        setProject((prev) => ({ ...prev, project_status: 'PAYMENT_PENDING' }));
        setShowPaymentBox(false);
        setStatusMsg('Milestone payment link created ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleRegenerateToken = () => {
    startTransition(async () => {
      const res = await regenerateBusinessOnboardingTokenAction(project.id);
      if (res.success && res.onboardingUrl) {
        setOnboardingUrl(res.onboardingUrl);
        setStatusMsg('New secure link generated ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) return;
    startTransition(async () => {
      const res = await addProjectNoteAction(project.id, noteContent.trim());
      if (res.success) {
        setNotes([
          {
            id: `note-${Date.now()}`,
            project_id: project.id,
            author_name: 'Ekaagra Admin',
            content: noteContent.trim(),
            is_internal: true,
            created_at: new Date().toISOString(),
          },
          ...notes,
        ]);
        setNoteContent('');
        setStatusMsg('Internal note recorded ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    });
  };

  // Milestone Stages
  const isReqSubmitted = [
    'REQUIREMENTS_SUBMITTED',
    'REQUIREMENTS_UNDER_REVIEW',
    'CLARIFICATION_REQUESTED',
    'DESIGN_IN_PROGRESS',
    'DESIGN_READY',
    'REVISION_REQUESTED',
    'DESIGN_APPROVED',
    'PAYMENT_PENDING',
    'PAID',
    'DEVELOPMENT',
    'STAGING_REVIEW',
    'FINAL_APPROVAL',
    'LAUNCHED',
    'COMPLETED',
  ].includes(project.project_status);

  const isDesignApproved = [
    'DESIGN_APPROVED',
    'PAYMENT_PENDING',
    'PAID',
    'DEVELOPMENT',
    'STAGING_REVIEW',
    'FINAL_APPROVAL',
    'LAUNCHED',
    'COMPLETED',
  ].includes(project.project_status);

  const isPaid = [
    'PAID',
    'DEVELOPMENT',
    'STAGING_REVIEW',
    'FINAL_APPROVAL',
    'LAUNCHED',
    'COMPLETED',
  ].includes(project.project_status);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/business-projects"
              className="p-2 rounded-xl text-[#64748B] hover:text-[#131B2E] hover:bg-slate-100 transition-colors"
              title="Back to projects"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2 py-0.5 rounded uppercase">
                {project.project_number}
              </span>
              <h1 className="text-sm sm:text-base font-black text-[#131B2E] truncate max-w-[280px] sm:max-w-md">
                {project.project_name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {statusMsg && (
              <span className="text-xs font-bold text-emerald-600 mr-2 animate-fadeIn">{statusMsg}</span>
            )}
            <Link
              href="/admin/business-projects"
              className="px-3 py-1.5 rounded-lg font-bold text-[#64748B] hover:text-[#131B2E] text-xs transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/admin/leads"
              className="px-3 py-1.5 rounded-lg font-bold text-[#64748B] hover:text-[#131B2E] text-xs transition-colors"
            >
              Leads
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Project Snapshot Card & 4-Stage Visual Milestones */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#131B2E]">
                  Status Pipeline:
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#4338CA] text-white">
                  {project.project_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Client: <strong>{client?.name || 'Primary Contact'}</strong> &bull;{' '}
                {client?.email && <span className="font-mono">{client.email} &bull; </span>}
                Service: <strong>{project.service_type}</strong>
              </p>
            </div>

            {/* Manual Status Override Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px]">Override Status:</span>
              <select
                value={project.project_status}
                onChange={(e) => handleStatusUpdate(e.target.value as any)}
                disabled={isPending}
                className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 font-bold text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
              >
                <option value="NEW_PROJECT">New Project</option>
                <option value="REQUIREMENTS_PENDING">Requirements Pending</option>
                <option value="REQUIREMENTS_SUBMITTED">Requirements Submitted</option>
                <option value="REQUIREMENTS_UNDER_REVIEW">Requirements Under Review</option>
                <option value="CLARIFICATION_REQUESTED">Clarification Requested</option>
                <option value="DESIGN_IN_PROGRESS">Design In Progress</option>
                <option value="DESIGN_READY">Design Ready</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
                <option value="DESIGN_APPROVED">Design Approved</option>
                <option value="PAYMENT_PENDING">Payment Pending</option>
                <option value="PAID">Paid</option>
                <option value="DEVELOPMENT">Development</option>
                <option value="STAGING_REVIEW">Staging Review</option>
                <option value="FINAL_APPROVAL">Final Approval</option>
                <option value="LAUNCHED">Launched</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* 4-Stage Horizontal Pipeline Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Stage 1: Requirements */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between font-extrabold uppercase text-[10px] tracking-wider text-[#64748B]">
                <span>1. Requirements</span>
                {isReqSubmitted ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Submitted
                  </span>
                ) : (
                  <span className="text-amber-600 font-bold">Pending</span>
                )}
              </div>
              <div className="text-xs font-bold text-[#131B2E]">
                {submissions.length > 0 ? `v${submissions[0].version_number} Received` : 'Link Issued'}
              </div>
            </div>

            {/* Stage 2: Design */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between font-extrabold uppercase text-[10px] tracking-wider text-[#64748B]">
                <span>2. Design Concept</span>
                {isDesignApproved ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Approved
                  </span>
                ) : designReviews.length > 0 ? (
                  <span className="text-cyan-700 font-bold">Under Review</span>
                ) : (
                  <span className="text-slate-400">Not Started</span>
                )}
              </div>
              <div className="text-xs font-bold text-[#131B2E]">
                {designReviews.length > 0 ? `Concept v${designReviews[0].design_version}` : 'Awaiting Reqs'}
              </div>
            </div>

            {/* Stage 3: Payment */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between font-extrabold uppercase text-[10px] tracking-wider text-[#64748B]">
                <span>3. Milestone Payment</span>
                {isPaid ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Paid
                  </span>
                ) : project.project_status === 'PAYMENT_PENDING' ? (
                  <span className="text-yellow-700 font-bold">Pending</span>
                ) : (
                  <span className="text-slate-400">Post-Design Only</span>
                )}
              </div>
              <div className="text-xs font-bold text-[#131B2E]">
                {isDesignApproved ? 'Unlocked & Requestable' : 'Locked Until Approval'}
              </div>
            </div>

            {/* Stage 4: Development */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between font-extrabold uppercase text-[10px] tracking-wider text-[#64748B]">
                <span>4. Development</span>
                {project.project_status === 'LAUNCHED' || project.project_status === 'COMPLETED' ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Live
                  </span>
                ) : project.project_status === 'DEVELOPMENT' ? (
                  <span className="text-blue-700 font-bold">In Build</span>
                ) : (
                  <span className="text-slate-400">Scheduled</span>
                )}
              </div>
              <div className="text-xs font-bold text-[#131B2E]">
                {project.project_status === 'DEVELOPMENT' ? 'Staging Prototype' : 'Awaiting Milestone'}
              </div>
            </div>
          </div>

          {/* Secure Onboarding Link Ribbon */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                Secure Client Onboarding Workspace Link:
              </span>
              <span className="font-mono text-[11px] text-indigo-950 truncate max-w-md block">
                {onboardingUrl
                  ? typeof window !== 'undefined'
                    ? `${window.location.origin}${onboardingUrl}`
                    : onboardingUrl
                  : 'Link not generated yet'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onboardingUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}${onboardingUrl}`;
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRegenerateToken}
                disabled={isPending}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold rounded-lg border border-indigo-200 text-xs flex items-center gap-1 cursor-pointer"
                title="Generate a fresh token"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                <span>Regenerate Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold">
          {[
            { key: 'REQUIREMENTS', label: 'Requirements Review', icon: FileText },
            { key: 'DESIGN', label: `Design Reviews (${designReviews.length})`, icon: Palette },
            { key: 'PAYMENT', label: 'Payment Milestones', icon: DollarSign },
            { key: 'TIMELINE', label: `Activity Log (${activities.length})`, icon: Clock },
            { key: 'NOTES', label: `Internal Notes (${notes.length})`, icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#4338CA] text-white shadow-xs font-extrabold'
                    : 'bg-white text-[#64748B] hover:text-[#131B2E] border border-[#E2E8F0]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =================================================================== */}
        {/* TAB 1: REQUIREMENTS REVIEW */}
        {/* =================================================================== */}
        {activeTab === 'REQUIREMENTS' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#131B2E]">Submitted Requirements Breakdown</h2>
                <p className="text-xs text-[#64748B]">
                  Form Version 1.0 &bull;{' '}
                  {latestSubmission
                    ? `Submitted on ${new Date(latestSubmission.submitted_at).toLocaleDateString('en-IN')}`
                    : 'Awaiting client submission'}
                </p>
              </div>

              {latestSubmission && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkReviewed}
                    disabled={isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Reviewed &amp; Start Design</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowClarificationBox(!showClarificationBox)}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Request Clarification</span>
                  </button>
                </div>
              )}
            </div>

            {/* Clarification Box */}
            {showClarificationBox && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="space-y-1">
                  <span className="font-extrabold text-xs text-amber-950 uppercase tracking-wider block">
                    Request Clarification from Client
                  </span>
                  <p className="text-xs text-amber-800">
                    Enter the questions or missing details. An email will be dispatched to <strong>{client?.email || project.client?.email}</strong>.
                  </p>
                </div>

                <textarea
                  rows={3}
                  value={clarificationNotes}
                  onChange={(e) => setClarificationNotes(e.target.value)}
                  placeholder="e.g. Please confirm whether you require a doctor schedule calendar or only simple contact appointment booking..."
                  className="w-full bg-white border border-amber-300 rounded-xl p-3 text-xs text-[#131B2E] focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendClarification}
                    disabled={isPending || !clarificationNotes.trim()}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Request to Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClarificationBox(false)}
                    className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-[#64748B]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {!latestSubmission ? (
              <div className="py-12 text-center text-[#94A3B8] space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-50" />
                <p className="font-bold text-sm text-[#131B2E]">No requirements submitted yet.</p>
                <p className="text-xs text-[#64748B]">
                  The client has received their secure link and has not completed final submission.
                </p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Section A: Profile */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                  <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider">
                    Section A &bull; Business Profile
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                    <div>Brand: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_a_profile.displayName}</strong></div>
                    <div>Legal Name: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_a_profile.legalName || 'N/A'}</strong></div>
                    <div>Category: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_a_profile.category}</strong></div>
                    <div>Phone: <strong className="font-mono text-[#131B2E] block">{latestSubmission.full_payload.section_a_profile.phone}</strong></div>
                  </div>
                  {latestSubmission.full_payload.section_a_profile.description && (
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Overview:</span>
                      <p className="text-[#334155] leading-relaxed">{latestSubmission.full_payload.section_a_profile.description}</p>
                    </div>
                  )}
                </div>

                {/* Section B & C: Solution & Objectives */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                  <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider">
                    Section B &amp; C &bull; Solution Type &amp; Goals
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#64748B]">
                    <div>Primary Solution: <strong className="text-[#4338CA] block text-sm">{latestSubmission.full_payload.section_b_project_type.primaryType}</strong></div>
                    <div>Primary Goal: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_c_objectives.primaryGoal}</strong></div>
                    <div className="sm:col-span-2">Problem to Solve: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_c_objectives.problemToSolve}</strong></div>
                  </div>
                </div>

                {/* Section E & F: Pages & Features */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                  <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider">
                    Section E &amp; F &bull; Required Pages &amp; Modules
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Standard Pages:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {latestSubmission.full_payload.section_e_website_reqs?.requiredPages.map((p) => (
                          <span key={p} className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg font-bold text-[11px] text-[#131B2E]">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {(latestSubmission.full_payload.section_e_website_reqs?.customPages || []).length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Custom Pages:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {latestSubmission.full_payload.section_e_website_reqs?.customPages?.map((p) => (
                            <span key={p} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold text-[11px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section I & J: Design & Domain */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                  <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider">
                    Section I &amp; J &bull; Aesthetics &amp; Infrastructure
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                    <div>Style Vibe: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_i_design_preferences.styleVibe}</strong></div>
                    <div>Colors: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_i_design_preferences.preferredColors || 'Not specified'}</strong></div>
                    <div>Domain Status: <strong className="text-[#131B2E] block">{latestSubmission.full_payload.section_j_domain_hosting.hasDomain}</strong></div>
                    <div>Domain Name: <strong className="font-mono text-[#4338CA] block">{latestSubmission.full_payload.section_j_domain_hosting.existingDomain || latestSubmission.full_payload.section_j_domain_hosting.preferredNewDomain || 'None'}</strong></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: DESIGN REVIEWS & CONCEPTS */}
        {/* =================================================================== */}
        {activeTab === 'DESIGN' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#131B2E]">Design Concepts &amp; Client Approvals</h2>
                <p className="text-xs text-[#64748B]">
                  Present your Figma prototypes or staging mockups. The client inspects and approves before payment is due.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowNewDesignBox(!showNewDesignBox)}
                className="px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Design Concept</span>
              </button>
            </div>

            {/* Post Design Box */}
            {showNewDesignBox && (
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4 text-xs">
                <h3 className="font-black text-xs text-indigo-950 uppercase tracking-wider">
                  Publish New Design Concept for Client Review
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-[#131B2E] block mb-1">Concept Title</label>
                    <input
                      type="text"
                      value={designForm.title}
                      onChange={(e) => setDesignForm({ ...designForm, title: e.target.value })}
                      placeholder="e.g. Concept v1 — Minimalist Clean Showcase"
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#131B2E] block mb-1">
                      Prototype / Mockup URL (Figma, Staging site, Google Drive link) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={designForm.url}
                      onChange={(e) => setDesignForm({ ...designForm, url: e.target.value })}
                      placeholder="https://www.figma.com/proto/... or https://staging.ekaagra.site/..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-[#131B2E] block mb-1">Designer Notes / Context for Client</label>
                    <textarea
                      rows={2}
                      value={designForm.notes}
                      onChange={(e) => setDesignForm({ ...designForm, notes: e.target.value })}
                      placeholder="Highlights of the layout, responsive mobile design, color palette chosen..."
                      className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCreateDesignReview}
                    disabled={isPending || !designForm.url.trim()}
                    className="px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish &amp; Notify Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewDesignBox(false)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#64748B]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Design Reviews List */}
            {designReviews.length === 0 ? (
              <div className="py-12 text-center text-[#94A3B8] space-y-2">
                <Palette className="w-8 h-8 mx-auto opacity-50 text-[#4338CA]" />
                <p className="font-bold text-sm text-[#131B2E]">No design concepts published yet.</p>
                <p className="text-xs text-[#64748B]">
                  Click &quot;Post Design Concept&quot; once your initial Figma layout or prototype is ready.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {designReviews.map((rev) => (
                  <div key={rev.id} className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">
                          Version {rev.design_version}
                        </span>
                        <h4 className="font-black text-sm text-[#131B2E]">{rev.design_title}</h4>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : rev.status === 'REVISION_REQUESTED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rev.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={rev.design_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#4338CA] hover:underline"
                      >
                        <span>Open Design Prototype</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {rev.client_feedback && (
                      <div className="p-3 bg-white rounded-xl border border-[#E2E8F0] space-y-1">
                        <span className="font-bold text-[#131B2E] block">Client Feedback:</span>
                        <p className="text-[#475569] italic">&quot;{rev.client_feedback}&quot;</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PAYMENT MILESTONES (POST-DESIGN APPROVAL) */}
        {/* =================================================================== */}
        {activeTab === 'PAYMENT' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#131B2E]">Post-Design Payment Milestones</h2>
                <p className="text-xs text-[#64748B]">
                  Per business rules, payments are strictly decoupled from intake and only requested after design approval.
                </p>
              </div>

              {isDesignApproved ? (
                <button
                  type="button"
                  onClick={() => setShowPaymentBox(!showPaymentBox)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Create Payment Milestone</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Locked Until Design Approved</span>
                </div>
              )}
            </div>

            {!isDesignApproved ? (
              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Strict Business Rule Protection</span>
                </div>
                <p className="leading-relaxed">
                  Payment milestones cannot be issued at this stage. The client must first review and approve their custom design concept.
                  Once the design is approved, this milestone section unlocks to generate invoices and payment links.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {showPaymentBox && (
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs">
                    <h3 className="font-black text-xs text-emerald-950 uppercase tracking-wider">
                      Issue Post-Approval Payment Milestone Link
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#131B2E] block mb-1">Amount (INR) ₹</label>
                        <input
                          type="number"
                          value={paymentForm.amountINR}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amountINR: Number(e.target.value) })}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-[#131B2E] block mb-1">Milestone Description</label>
                        <input
                          type="text"
                          value={paymentForm.title}
                          onChange={(e) => setPaymentForm({ ...paymentForm, title: e.target.value })}
                          className="w-full bg-white border border-[#E2E8F0] rounded-xl p-2.5"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleGeneratePaymentMilestone}
                        disabled={isPending}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Generate Invoice &amp; Payment Link</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentBox(false)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#64748B]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {createdPaymentUrl && (
                  <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-2 text-xs">
                    <div className="font-bold text-emerald-800 flex items-center justify-between">
                      <span>✓ Milestone Payment Link Ready!</span>
                      <Link
                        href={createdPaymentUrl}
                        target="_blank"
                        className="text-[#4338CA] hover:underline flex items-center gap-1"
                      >
                        <span>Open Checkout Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          typeof window !== 'undefined'
                            ? `${window.location.origin}${createdPaymentUrl}`
                            : createdPaymentUrl
                        }
                        className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl font-mono text-xs select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${window.location.origin}${createdPaymentUrl}`;
                          navigator.clipboard.writeText(url);
                          setStatusMsg('Payment link copied ✓');
                          setTimeout(() => setStatusMsg(''), 2500);
                        }}
                        className="px-3 py-2 bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: ACTIVITY LOG */}
        {/* =================================================================== */}
        {activeTab === 'TIMELINE' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-[#131B2E] border-b border-[#E2E8F0] pb-4">
              Project Audit &amp; Activity Timeline
            </h2>

            {activities.length === 0 ? (
              <p className="text-xs text-[#94A3B8] py-8 text-center">No logged activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-[#4338CA] mt-1.5 shrink-0" />
                    <div className="space-y-0.5">
                      <div className="font-bold text-[#131B2E]">{act.description}</div>
                      <div className="text-[10px] text-[#94A3B8]">
                        {new Date(act.created_at).toLocaleString('en-IN')} &bull; Actor: {act.actor_type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: INTERNAL NOTES */}
        {/* =================================================================== */}
        {activeTab === 'NOTES' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-[#131B2E] border-b border-[#E2E8F0] pb-4">
              Private Internal Notes (Admin Only)
            </h2>

            <div className="space-y-3">
              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add private technical notes, client WhatsApp conversation context, hosting server logins..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={isPending || !noteContent.trim()}
                className="px-4 py-2 bg-[#131B2E] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Save Private Note
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
              {notes.length === 0 ? (
                <p className="text-xs text-[#94A3B8] text-center py-6">No internal notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
                      <span>{n.author_name}</span>
                      <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                    </div>
                    <p className="text-[#334155] whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
