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
  BusinessRequirementAsset,
  BusinessRequirementsData,
  MissingRequirementItem,
} from '@/lib/types';
import {
  updateBusinessProjectStatusAction,
  updateRequirementsReviewAction,
  createDesignReviewAction,
  regenerateBusinessOnboardingTokenAction,
  addProjectNoteAction,
  createPostDesignPaymentMilestoneAction,
  deleteBusinessProjectAssetAction,
  requestMissingInformationAction,
  sendIntakeReminderEmailAction,
} from '@/app/businessProjectActions';
import Logo from '@/components/ui/Logo';
import {
  ArrowLeft,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
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
  Trash2,
  FolderOpen,
  Download,
  UserCheck,
  FileEdit,
  ListChecks,
  Eye,
  SendHorizontal,
  School,
} from 'lucide-react';

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(fileName?: string, mimeType?: string | null): boolean {
  if (mimeType?.startsWith('image/')) return true;
  if (!fileName) return false;
  return /\.(png|jpe?g|webp|gif|svg)$/i.test(fileName);
}

interface BusinessProjectDetailViewProps {
  project: BusinessProject;
  client?: Client;
  latestSubmission?: BusinessRequirementSubmission;
  submissions: BusinessRequirementSubmission[];
  designReviews: DesignReview[];
  activities: ProjectActivity[];
  notes: ProjectNote[];
  assets?: BusinessRequirementAsset[];
  initialOnboardingUrl?: string;
  draftRequirements?: BusinessRequirementsData;
  intakeProgress?: {
    percentage: number;
    checklist: Array<{
      label: string;
      step: number;
      completed: boolean;
    }>;
  };
}

export default function BusinessProjectDetailView({
  project: initialProject,
  client,
  latestSubmission,
  submissions,
  designReviews: initialDesignReviews,
  activities: initialActivities,
  notes: initialNotes,
  assets = [],
  initialOnboardingUrl,
  draftRequirements,
  intakeProgress: initialIntakeProgress,
}: BusinessProjectDetailViewProps) {
  const [project, setProject] = useState<BusinessProject>(initialProject);
  const [designReviews, setDesignReviews] = useState<DesignReview[]>(initialDesignReviews);
  const [activities, setActivities] = useState<ProjectActivity[]>(initialActivities);
  const [notes, setNotes] = useState<ProjectNote[]>(initialNotes);
  const [projectAssets, setProjectAssets] = useState<BusinessRequirementAsset[]>(assets);
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('ALL');
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'REQUIREMENTS' | 'ASSETS' | 'DESIGN' | 'PAYMENT' | 'TIMELINE' | 'NOTES'>('REQUIREMENTS');
  const [selectedSubId, setSelectedSubId] = useState<string>(latestSubmission?.id || (submissions[0]?.id || ''));

  const [onboardingUrl, setOnboardingUrl] = useState<string | undefined>(initialOnboardingUrl);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Intake Management & Missing Info State
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [selectedMissingItems, setSelectedMissingItems] = useState<string[]>([]);
  const [customMissingItem, setCustomMissingItem] = useState('');
  const [missingNotes, setMissingNotes] = useState('');
  const [isSendingMissing, setIsSendingMissing] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

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

  const handleSendReminder = async () => {
    if (!onboardingUrl) return;
    setIsSendingReminder(true);
    try {
      const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl;
      const res = await sendIntakeReminderEmailAction({
        projectId: project.id,
        clientEmail: client?.email || project.client?.email || '',
        clientName: client?.name || project.client?.name || 'Valued Client',
        projectName: project.project_name,
        onboardingUrl: fullUrl,
      });
      if (res.success) {
        setStatusMsg('Intake invitation & reminder email sent ✓');
      } else {
        setStatusMsg(res.error || 'Failed to send email');
      }
      setTimeout(() => setStatusMsg(''), 4000);
    } catch {
      setStatusMsg('Error sending reminder');
      setTimeout(() => setStatusMsg(''), 4000);
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleRequestMissingInfo = async () => {
    const items = [...selectedMissingItems];
    if (customMissingItem.trim()) {
      items.push(customMissingItem.trim());
    }
    if (items.length === 0) {
      alert('Please select or specify at least one missing item.');
      return;
    }

    const mappedItems: MissingRequirementItem[] = items.map((item, idx) => ({
      id: `req-miss-${Date.now()}-${idx}`,
      category: 'CONTENT_OR_MEDIA',
      title: item,
      stepNumber: item.includes('Logo') ? 5 : item.includes('Photo') ? 5 : item.includes('Domain') ? 8 : 1,
      resolved: false,
    }));

    setIsSendingMissing(true);
    try {
      const res = await requestMissingInformationAction({
        projectId: project.id,
        missingItems: mappedItems,
        notes: missingNotes.trim() || undefined,
        clientEmail: client?.email || project.client?.email,
        clientName: client?.name || project.client?.name,
        projectName: project.project_name,
        onboardingUrl: onboardingUrl ? (typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl) : undefined,
      });

      if (res.success) {
        setProject((prev) => ({
          ...prev,
          project_status: 'CLARIFICATION_REQUESTED',
          metadata: {
            ...(prev.metadata || {}),
            intakeStatus: 'CHANGES_REQUESTED',
            missingRequirements: mappedItems,
            missingRequirementsNotes: missingNotes.trim() || undefined,
          },
        }));
        setShowMissingModal(false);
        setSelectedMissingItems([]);
        setCustomMissingItem('');
        setMissingNotes('');
        setStatusMsg('Missing information request dispatched to client ✓');
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        alert(res.error || 'Failed to dispatch request');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error requesting missing info');
    } finally {
      setIsSendingMissing(false);
    }
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

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to delete this asset from the project?')) return;
    setDeletingAssetId(assetId);
    try {
      const res = await deleteBusinessProjectAssetAction({ projectId: project.id, assetId });
      if (res.success) {
        setProjectAssets((prev) => prev.filter((a) => a.id !== assetId));
        setStatusMsg('Asset removed ✓');
        setTimeout(() => setStatusMsg(''), 3000);
      } else {
        alert(res.error || 'Failed to delete asset');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting asset');
    } finally {
      setDeletingAssetId(null);
    }
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
    <div className="eka-content-container space-y-5 sm:space-y-6 min-w-0">
      {/* Detail Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/admin/business-projects"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Back to projects"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
              {project.project_number}
            </span>
            <h2 className="text-sm sm:text-lg font-black text-slate-900 truncate">
              {project.project_name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {statusMsg && (
            <span className="text-xs font-bold text-emerald-600 mr-1 animate-fadeIn">{statusMsg}</span>
          )}
          <Link
            href="/admin/business-projects"
            className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 text-xs transition-colors border border-slate-200"
          >
            All Projects
          </Link>
          <Link
            href="/admin/leads"
            className="px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 text-xs transition-colors border border-slate-200"
          >
            Leads
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Project Snapshot Card & 4-Stage Visual Milestones */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-4 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-[#131B2E]">
                  Status Pipeline:
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-[#4338CA] text-white">
                  {project.project_status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-[#64748B] break-words">
                Client: <strong>{client?.name || 'Primary Contact'}</strong> &bull;{' '}
                {client?.email && <span className="font-mono">{client.email} &bull; </span>}
                Service: <strong>{project.service_type}</strong>
              </p>
            </div>

            {/* Manual Status Override Selector */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-bold text-[#64748B] uppercase tracking-wider text-[11px] shrink-0">Override Status:</span>
              <select
                value={project.project_status}
                onChange={(e) => handleStatusUpdate(e.target.value as any)}
                disabled={isPending}
                className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2 font-bold text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA] min-h-[38px]"
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
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* 4-Stage Horizontal Pipeline Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
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

          {/* =================================================================== */}
          {/* DEDICATED PROJECT INTAKE WORKSPACE CARD */}
          {/* =================================================================== */}
          {(() => {
            const intakeStatus = (project.metadata as any)?.intakeStatus || (latestSubmission ? 'SUBMITTED' : 'NOT_STARTED');
            const isFilledByAdmin = (project.metadata as any)?.lastIntakeModifiedBy === 'ADMIN_ENTERED' || (project.metadata as any)?.completedOnBehalf === true;
            const acqSource = (project.metadata as any)?.acquisitionSource || project.acquisition_source || (project.lead_id ? 'WEBSITE_LEAD' : 'DIRECT');
            const progressPercent = initialIntakeProgress?.percentage ?? ((project.metadata as any)?.intakeProgressPercent ?? (latestSubmission ? 100 : 0));
            const missingReqsList = (project.metadata as any)?.missingRequirements || [];
            const missingNotesMsg = (project.metadata as any)?.missingRequirementsNotes || '';

            const steps = initialIntakeProgress?.checklist
              ? initialIntakeProgress.checklist.map((c) => ({
                  stepNumber: c.step,
                  title: c.label,
                  completed: c.completed,
                  missingDetails: 'Pending details',
                }))
              : [
                  { stepNumber: 1, title: 'Profile & Contact Details', completed: Boolean(draftRequirements?.section_a_profile?.displayName || client?.name), missingDetails: 'Brand/School name & contacts' },
                  { stepNumber: 2, title: 'Goals & Target Audience', completed: Boolean(draftRequirements?.section_b_goals_audience?.primaryType), missingDetails: 'Primary objective & audience' },
                  { stepNumber: 3, title: 'Visual & Design Style', completed: Boolean(draftRequirements?.section_c_design?.styleVibe), missingDetails: 'Color preferences & style vibe' },
                  { stepNumber: 4, title: 'Pages & Architecture', completed: Boolean(draftRequirements?.section_d_structure?.requiredPages?.length), missingDetails: 'Required site pages' },
                  { stepNumber: 5, title: 'Content & Brand Assets', completed: Boolean(draftRequirements?.section_e_assets?.hasLogo), missingDetails: 'Logo, copy & media uploads' },
                  { stepNumber: 6, title: 'Final Review & Agreement', completed: Boolean(latestSubmission || draftRequirements?.section_j_agreement?.confirmedAccurate), missingDetails: 'Client confirmation & signoff' },
                ];

            const copyIntakeLink = () => {
              if (!onboardingUrl) return;
              const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl;
              navigator.clipboard.writeText(fullUrl);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            };

            return (
              <div className="p-5 sm:p-7 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-200/60 pb-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                        <ListChecks className="w-4 h-4 text-indigo-600" />
                        Project Intake &amp; Requirements
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        intakeStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : intakeStatus === 'CHANGES_REQUESTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : intakeStatus === 'SUBMITTED' || intakeStatus === 'UNDER_REVIEW'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : intakeStatus === 'IN_PROGRESS'
                          ? 'bg-sky-100 text-sky-800 border-sky-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {intakeStatus.replace(/_/g, ' ')}
                      </span>
                      {isFilledByAdmin && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> ADMIN ENTERED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-900/80">
                      Acquisition Source: <strong className="text-indigo-950 font-bold">{acqSource.replace(/_/g, ' ')}</strong> &bull; Token Code: <span className="font-mono font-bold text-indigo-700">{(project.metadata as any)?.onboardingTokenCode || 'Active'}</span>
                    </p>
                  </div>

                  {/* Quick Action Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {onboardingUrl && (
                      <>
                        <Link
                          href={onboardingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View Intake</span>
                        </Link>

                        <Link
                          href={`${onboardingUrl}?mode=admin`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                          title="Open intake form in Admin mode to fill details on behalf of client"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Complete on Behalf</span>
                        </Link>

                        <button
                          type="button"
                          onClick={copyIntakeLink}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-2xs"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSendReminder}
                          disabled={isSendingReminder}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-indigo-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                          title="Resend invitation/reminder email to client"
                        >
                          <Send className={`w-3.5 h-3.5 ${isSendingReminder ? 'animate-spin text-indigo-600' : ''}`} />
                          <span>Resend Link</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowMissingModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer shadow-2xs"
                          title="Highlight missing requirements for client review"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Request Missing Info</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleRegenerateToken}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                          title="Regenerate secure access link"
                        >
                          <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-950">Intake Progress Completion:</span>
                    <span className="font-mono font-black text-indigo-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-indigo-100/70 rounded-full h-2.5 overflow-hidden border border-indigo-200">
                    <div
                      className="bg-[#4338CA] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    />
                  </div>
                </div>

                {/* 6-Step Requirements Checklist Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  {steps.map((s) => (
                    <div
                      key={s.stepNumber}
                      className={`p-3 rounded-xl border flex items-start gap-2.5 transition-colors ${
                        s.completed
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-white border-indigo-100 text-slate-700'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {s.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] text-slate-900 truncate">{s.title}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {s.completed ? 'Information supplied ✓' : s.missingDetails || 'Pending details'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Missing Information Banner if Changes Requested */}
                {missingReqsList && missingReqsList.length > 0 && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Missing Requirements Highlighted for Client</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {missingReqsList.map((m: any, idx: number) => (
                        <span key={idx} className="px-2.5 py-1 bg-white text-rose-700 font-semibold rounded-lg border border-rose-200 text-xs shadow-2xs">
                          • {m.title || m.item || String(m)}
                        </span>
                      ))}
                    </div>
                    {missingNotesMsg && (
                      <p className="text-[11px] text-rose-700 italic bg-white/60 p-2 rounded-lg border border-rose-100">
                        Admin Note: "{missingNotesMsg}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-bold overflow-x-auto">
          {[
            { key: 'REQUIREMENTS', label: `Requirements (${submissions.length || (latestSubmission ? 1 : 0)})`, icon: FileText },
            { key: 'ASSETS', label: `Asset Library (${projectAssets.length})`, icon: Layers },
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
                className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
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
        {/* TAB 1: REQUIREMENTS REVIEW (10 SECTIONS BREAKDOWN) */}
        {/* =================================================================== */}
        {activeTab === 'REQUIREMENTS' && (() => {
          const currentSub = submissions.find((s) => s.id === selectedSubId) || latestSubmission || submissions[0];
          const payload = currentSub?.full_payload;

          return (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-[#131B2E]">Submitted Requirements Breakdown</h2>
                    {currentSub && (
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        currentSub.review_status === 'REVIEWED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : currentSub.review_status === 'CLARIFICATION_REQUESTED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}>
                        {currentSub.review_status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {currentSub
                      ? `Version ${currentSub.version_number} • Submitted on ${new Date(currentSub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} by ${currentSub.submitted_by_name}`
                      : 'Awaiting client requirements submission'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {submissions.length > 1 && (
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-xs">
                      <span className="font-bold text-[#64748B]">Version:</span>
                      <select
                        value={currentSub?.id}
                        onChange={(e) => setSelectedSubId(e.target.value)}
                        className="bg-transparent font-black text-[#131B2E] focus:outline-none cursor-pointer"
                      >
                        {submissions.map((s, idx) => (
                          <option key={s.id} value={s.id}>
                            v{s.version_number || submissions.length - idx} &bull; {new Date(s.submitted_at).toLocaleDateString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {currentSub && (
                    <>
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
                    </>
                  )}
                </div>
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

              {/* Previous Admin Review Notes */}
              {currentSub?.admin_review_notes && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                  <span className="font-extrabold text-emerald-950 uppercase text-[10px] tracking-wider block">
                    Admin Review Note ({currentSub.reviewed_by || 'Admin'})
                  </span>
                  <p className="text-emerald-900 leading-relaxed">{currentSub.admin_review_notes}</p>
                </div>
              )}

              {!currentSub || !payload ? (
                <div className="py-12 text-center text-[#94A3B8] space-y-2">
                  <Clock className="w-8 h-8 mx-auto opacity-50" />
                  <p className="font-bold text-sm text-[#131B2E]">No requirements submitted yet.</p>
                  <p className="text-xs text-[#64748B]">
                    The client has received their secure link and has not completed final submission.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 text-xs">
                  {/* SECTION A: Business Profile */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section A &bull; Business Profile &amp; Contact Information
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Brand Name: <strong className="text-[#131B2E] block">{payload.section_a_profile?.displayName || 'N/A'}</strong></div>
                      <div>Legal Name: <strong className="text-[#131B2E] block">{payload.section_a_profile?.legalName || 'N/A'}</strong></div>
                      <div>Category / Industry: <strong className="text-[#131B2E] block">{payload.section_a_profile?.category || 'N/A'}</strong></div>
                      <div>Contact Person: <strong className="text-[#131B2E] block">{payload.section_a_profile?.primaryContactName || 'N/A'}</strong></div>
                      <div>Contact Email: <strong className="font-mono text-[#131B2E] block">{payload.section_a_profile?.email || 'N/A'}</strong></div>
                      <div>Contact Phone: <strong className="font-mono text-[#131B2E] block">{payload.section_a_profile?.phone || 'N/A'}</strong></div>
                      <div>Locations: <strong className="text-[#131B2E] block truncate">{payload.section_a_profile?.locations || 'N/A'}</strong></div>
                      <div>Existing Website: <strong className="font-mono text-[#4338CA] block truncate">{payload.section_a_profile?.website || 'None'}</strong></div>
                    </div>
                    {payload.section_a_profile?.description && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Business Overview:</span>
                        <p className="text-[#334155] leading-relaxed">{payload.section_a_profile.description}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION B: Goals & Target Audience */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section B &bull; Goals &amp; Target Audience
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[#64748B]">
                      <div>Solution Type: <strong className="text-[#4338CA] block text-sm font-black">{payload.section_b_goals_audience?.primaryType || payload.section_b_project_type?.primaryType || 'N/A'}</strong></div>
                      <div>Primary Goal: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.primaryGoal || payload.section_c_objectives?.primaryGoal || 'N/A'}</strong></div>
                      <div>Target Customer Type: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.targetCustomerType || payload.section_d_target_audience?.targetCustomerType || 'N/A'}</strong></div>
                      <div>Geographic Reach: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.geographicReach || payload.section_d_target_audience?.geographicReach || 'N/A'}</strong></div>
                      <div className="sm:col-span-2">Core Problem to Solve: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.problemToSolve || payload.section_c_objectives?.problemToSolve || 'N/A'}</strong></div>
                      <div className="sm:col-span-2">Target Audience Details: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.targetAudienceDescription || payload.section_d_target_audience?.coreCustomerNeeds || 'N/A'}</strong></div>
                      <div>Key Visitor Action: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.keyVisitorAction || payload.section_c_objectives?.keyVisitorAction || 'N/A'}</strong></div>
                      <div>Success Definition: <strong className="text-[#131B2E] block">{payload.section_b_goals_audience?.successDefinition || payload.section_c_objectives?.successDefinition || 'N/A'}</strong></div>
                    </div>
                    {((payload.section_b_goals_audience?.secondaryGoals || []).length > 0) && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Secondary Goals:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {payload.section_b_goals_audience?.secondaryGoals?.map((g) => (
                            <span key={g} className="px-2.5 py-0.5 bg-white border border-[#E2E8F0] rounded-md font-bold text-[11px] text-[#131B2E]">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION C: Design & Aesthetic Preferences */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section C &bull; Design &amp; Aesthetic Preferences
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Style / Vibe: <strong className="text-[#131B2E] block">{payload.section_c_design?.styleVibe || payload.section_i_design_preferences?.styleVibe || 'Modern & Clean'}</strong></div>
                      <div>Preferred Colors: <strong className="text-[#131B2E] block">{payload.section_c_design?.preferredColors || payload.section_i_design_preferences?.preferredColors || 'Not specified'}</strong></div>
                      <div>Colors to Avoid: <strong className="text-[#131B2E] block">{payload.section_c_design?.avoidColors || 'None'}</strong></div>
                      <div>Personality: <strong className="text-[#131B2E] block">{payload.section_c_design?.brandPersonalityKeywords?.join(', ') || 'Professional'}</strong></div>
                    </div>
                    {(payload.section_c_design?.likedWebsites || payload.section_i_design_preferences?.likedWebsites) && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Benchmark / Reference Sites:</span>
                        <p className="text-[#334155] font-mono">{payload.section_c_design?.likedWebsites || payload.section_i_design_preferences?.likedWebsites}</p>
                      </div>
                    )}
                    {(payload.section_c_design?.competitorWebsites || payload.section_i_design_preferences?.competitorWebsites) && (
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Competitor Sites:</span>
                        <p className="text-[#334155] font-mono">{payload.section_c_design?.competitorWebsites || payload.section_i_design_preferences?.competitorWebsites}</p>
                      </div>
                    )}
                    {(payload.section_c_design?.dislikedWebsites || payload.section_i_design_preferences?.dislikedWebsites) && (
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Disliked Design Styles / Sites:</span>
                        <p className="text-[#334155]">{payload.section_c_design?.dislikedWebsites || payload.section_i_design_preferences?.dislikedWebsites}</p>
                      </div>
                    )}
                    {(payload.section_c_design?.designConstraintsOrRules || payload.section_i_design_preferences?.designConstraintsOrRules) && (
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Special Rules &amp; Constraints:</span>
                        <p className="text-[#334155]">{payload.section_c_design?.designConstraintsOrRules || payload.section_i_design_preferences?.designConstraintsOrRules}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION D: Website Architecture & Pages */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section D &bull; Website Architecture &amp; Pages
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Solution Architecture: <strong className="text-[#4338CA] block">{payload.section_d_structure?.solutionType || payload.section_b_project_type?.primaryType || 'N/A'}</strong></div>
                      <div>Homepage Focus: <strong className="text-[#131B2E] block">{payload.section_d_structure?.homepageFocus || payload.section_e_website_reqs?.homepageFocus || 'Standard'}</strong></div>
                      <div>Multilingual: <strong className="text-[#131B2E] block">{payload.section_d_structure?.multilingual ? (payload.section_d_structure.languages?.join(', ') || 'YES') : 'NO'}</strong></div>
                      <div>Blog / News: <strong className="text-[#131B2E] block">{payload.section_d_structure?.blogOrNews ? 'YES' : 'NO'}</strong></div>
                    </div>
                    {((payload.section_d_structure?.requiredPages || payload.section_e_website_reqs?.requiredPages || []).length > 0) && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Standard Pages:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(payload.section_d_structure?.requiredPages || payload.section_e_website_reqs?.requiredPages || []).map((p) => (
                            <span key={p} className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg font-bold text-[11px] text-[#131B2E]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {((payload.section_d_structure?.customPages || payload.section_e_website_reqs?.customPages || []).length > 0) && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Custom / Functional Pages:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(payload.section_d_structure?.customPages || payload.section_e_website_reqs?.customPages || []).map((p) => (
                            <span key={p} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-bold text-[11px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {payload.section_d_structure?.navigationStructure && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Navigation Structure Notes:</span>
                        <p className="text-[#334155]">{payload.section_d_structure.navigationStructure}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION E: Content & Media Assets */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section E &bull; Content &amp; Media Assets
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Logo Status: <strong className="text-[#131B2E] block">{payload.section_e_assets?.hasLogo || payload.section_h_content_assets?.hasLogo || 'NO'}</strong></div>
                      <div>Brand Guidelines: <strong className="text-[#131B2E] block">{payload.section_e_assets?.hasBrandGuidelines ? 'YES' : 'NO'}</strong></div>
                      <div>Photos / Media: <strong className="text-[#131B2E] block">{payload.section_e_assets?.hasProductOrServicePhotos || payload.section_h_content_assets?.hasProductOrServicePhotos || 'NEED_HELP'}</strong></div>
                      <div>Written Copy: <strong className="text-[#131B2E] block">{payload.section_e_assets?.hasWrittenContent || payload.section_h_content_assets?.hasWrittenContent || 'NEED_COPYWRITING'}</strong></div>
                    </div>
                    {(payload.section_e_assets?.contentNotes || payload.section_h_content_assets?.contentNotes) && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Content Notes:</span>
                        <p className="text-[#334155]">{payload.section_e_assets?.contentNotes || payload.section_h_content_assets?.contentNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION F: Core Features & Functionalities */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section F &bull; Core Features &amp; Functionalities
                    </h3>
                    {((payload.section_f_features?.selectedFeatures || []).length > 0) && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#64748B] block mb-1">Selected Functional Modules:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {(payload.section_f_features?.selectedFeatures || []).map((f) => (
                            <span key={f} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg font-bold text-[11px]">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {payload.section_f_features?.customFeatures && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Custom Functional Requirements:</span>
                        <p className="text-[#334155]">{payload.section_f_features.customFeatures}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION G: Technical Integrations */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section G &bull; Technical Integrations
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Payment Gateway: <strong className="text-[#131B2E] block">{payload.section_g_integrations?.paymentGatewayNeeded ? (payload.section_g_integrations.preferredPaymentGateway || 'YES') : 'NO'}</strong></div>
                      <div>WhatsApp API: <strong className="text-[#131B2E] block">{payload.section_g_integrations?.whatsappApiNeeded ? 'YES' : 'NO'}</strong></div>
                      <div>CRM System: <strong className="text-[#131B2E] block">{payload.section_g_integrations?.crmIntegration || 'None'}</strong></div>
                      <div>Accounting: <strong className="text-[#131B2E] block">{payload.section_g_integrations?.accountingIntegration || 'None'}</strong></div>
                    </div>
                    {payload.section_g_integrations?.thirdPartyApis && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Third-Party APIs:</span>
                        <p className="text-[#334155]">{payload.section_g_integrations.thirdPartyApis}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION H: Domain & Infrastructure */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section H &bull; Domain &amp; Infrastructure
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Domain Status: <strong className="text-[#131B2E] block">{payload.section_h_domain_hosting?.hasDomain || payload.section_j_domain_hosting?.hasDomain || 'DECIDE_LATER'}</strong></div>
                      <div>Domain Name: <strong className="font-mono text-[#4338CA] block truncate">{payload.section_h_domain_hosting?.existingDomain || payload.section_h_domain_hosting?.preferredNewDomain || payload.section_j_domain_hosting?.existingDomain || payload.section_j_domain_hosting?.preferredNewDomain || 'None'}</strong></div>
                      <div>DNS Access Available: <strong className="text-[#131B2E] block">{payload.section_h_domain_hosting?.hasDnsAccess ? 'YES' : 'NO'}</strong></div>
                      <div>Hosting Preference: <strong className="text-[#131B2E] block">{payload.section_h_domain_hosting?.hostingPreference || (payload.section_j_domain_hosting?.hasHosting ? 'Client Has Hosting' : 'Managed Cloud')}</strong></div>
                      <div>Business Email: <strong className="text-[#131B2E] block">{payload.section_h_domain_hosting?.hasBusinessEmail ? 'YES' : 'NO'}</strong></div>
                      <div>Migration Needed: <strong className="text-[#131B2E] block">{payload.section_h_domain_hosting?.migrationNeeded ? 'YES' : 'NO'}</strong></div>
                    </div>
                  </div>

                  {/* SECTION I: Budget & Timeline Expectations */}
                  <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
                    <h3 className="font-black text-xs text-[#131B2E] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
                      Section I &bull; Budget &amp; Timeline Expectations
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Budget Range: <strong className="text-[#131B2E] block">{payload.section_i_budget_timeline?.targetBudgetRange || 'Standard'}</strong></div>
                      <div>Timeline: <strong className="text-[#131B2E] block">{payload.section_i_budget_timeline?.timelineRequirement || 'FLEXIBLE'}</strong></div>
                      <div>Target Launch Date: <strong className="text-[#131B2E] block font-mono">{payload.section_i_budget_timeline?.targetLaunchDate || 'Flexible'}</strong></div>
                      <div>Decision Makers: <strong className="text-[#131B2E] block">{payload.section_i_budget_timeline?.decisionMakers || 'Primary Contact'}</strong></div>
                    </div>
                    {payload.section_i_budget_timeline?.hardDeadlinesOrConstraints && (
                      <div className="pt-2 border-t border-[#E2E8F0]">
                        <span className="text-[10px] uppercase font-bold text-[#64748B] block mb-0.5">Hard Deadlines &amp; Constraints:</span>
                        <p className="text-[#334155]">{payload.section_i_budget_timeline.hardDeadlinesOrConstraints}</p>
                      </div>
                    )}
                  </div>

                  {/* SECTION J: Sign-off & Confirmation */}
                  <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                    <h3 className="font-black text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Section J &bull; Sign-off &amp; Confirmation Agreement
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#64748B]">
                      <div>Signatory Name: <strong className="text-[#131B2E] block">{payload.section_j_agreement?.authorizedSignatoryName || currentSub.submitted_by_name}</strong></div>
                      <div>Designation: <strong className="text-[#131B2E] block">{payload.section_j_agreement?.authorizedSignatoryTitle || 'Authorized Representative'}</strong></div>
                      <div>Confirmation Agreed: <strong className="text-emerald-700 block font-bold">{payload.section_j_agreement?.confirmedAccurate ? 'CONFIRMED ✓' : 'UNCONFIRMED'}</strong></div>
                      <div>Submitted At: <strong className="font-mono text-[#131B2E] block">{new Date(currentSub.submitted_at).toLocaleString('en-IN')}</strong></div>
                    </div>
                    {payload.section_j_agreement?.notesForEkaagraTeam && (
                      <div className="pt-2 border-t border-emerald-200">
                        <span className="text-[10px] uppercase font-bold text-emerald-950 block mb-0.5">Notes for Ekaagra Team:</span>
                        <p className="text-emerald-900">{payload.section_j_agreement.notesForEkaagraTeam}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* =================================================================== */}
        {/* TAB 1.5: ASSET LIBRARY */}
        {/* =================================================================== */}
        {activeTab === 'ASSETS' && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="text-lg font-black text-[#131B2E]">Uploaded Brand &amp; Project Assets</h2>
                <p className="text-xs text-[#64748B]">
                  Media, documents, catalogues, and reference files uploaded by the client during requirements submission.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full font-bold text-xs">
                  {projectAssets.length} Total {projectAssets.length === 1 ? 'Asset' : 'Assets'}
                </span>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {['ALL', 'LOGO', 'BRAND_GUIDELINE', 'CATALOGUE', 'DOCUMENT', 'IMAGE', 'REFERENCE_DESIGN', 'OTHER'].map((cat) => {
                const count = cat === 'ALL' ? projectAssets.length : projectAssets.filter(a => a.asset_category === cat).length;
                if (count === 0 && cat !== 'ALL') return null;
                const isActive = assetCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAssetCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4338CA] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat.replace(/_/g, ' ')} ({count})
                  </button>
                );
              })}
            </div>

            {/* Assets Grid */}
            {(() => {
              const filteredAssets = assetCategoryFilter === 'ALL'
                ? projectAssets
                : projectAssets.filter(a => a.asset_category === assetCategoryFilter);

              if (filteredAssets.length === 0) {
                return (
                  <div className="py-12 text-center text-[#94A3B8] space-y-2">
                    <FolderOpen className="w-8 h-8 mx-auto opacity-50 text-[#4338CA]" />
                    <p className="font-bold text-sm text-[#131B2E]">No assets in this category.</p>
                    <p className="text-xs text-[#64748B]">
                      When the client attaches logos, brand guides, brochures, or photos, they appear here.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAssets.map((asset) => {
                    const isCorrupted = Boolean(asset.file_url && asset.file_url.includes('[asset-ref]'));
                    const viewUrl = `/api/business-assets/view?id=${asset.id}`;
                    const downloadUrl = `/api/business-assets/view?id=${asset.id}&download=1`;
                    const directUrl = asset.file_url?.startsWith('data:') ? viewUrl : asset.file_url;

                    return (
                      <div key={asset.id} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                              {asset.asset_category?.replace(/_/g, ' ') || 'ASSET'}
                            </span>
                            {asset.file_size_bytes && (
                              <span className="text-[10px] font-mono text-[#64748B]">
                                {formatBytes(asset.file_size_bytes)}
                              </span>
                            )}
                          </div>

                          {/* Thumbnail or Icon */}
                          {isCorrupted ? (
                            <div className="h-32 rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 flex flex-col items-center justify-center text-center">
                              <AlertTriangle className="w-7 h-7 text-amber-600 mb-1" />
                              <span className="text-[11px] font-bold text-amber-900">Corrupted Upload</span>
                              <span className="text-[9px] text-amber-700 mt-0.5 leading-tight">Truncated reference from earlier bug. Please delete and re-upload.</span>
                            </div>
                          ) : isImageFile(asset.file_name, asset.mime_type) ? (
                            <div className="h-32 rounded-xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center p-2">
                              <img
                                src={directUrl}
                                alt={asset.file_name}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-28 rounded-xl border border-dashed border-[#CBD5E1] bg-white flex flex-col items-center justify-center text-[#64748B]">
                              <FileText className="w-8 h-8 opacity-40 mb-1" />
                              <span className="text-[10px] font-mono uppercase">{asset.mime_type?.split('/')[1] || 'FILE'}</span>
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-xs text-[#131B2E] truncate" title={asset.file_name}>
                              {asset.file_name}
                            </p>
                            <p className="text-[10px] text-[#64748B]">
                              Uploaded {new Date(asset.uploaded_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] text-xs">
                          {isCorrupted ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Needs Re-upload</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-[#4338CA] hover:underline"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open</span>
                              </a>

                              <a
                                href={downloadUrl}
                                className="inline-flex items-center gap-1 font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                                title="Download file"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </a>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.id)}
                            disabled={deletingAssetId === asset.id}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete asset"
                          >
                            <Trash2 className={`w-4 h-4 ${deletingAssetId === asset.id ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
      </div>

      {/* =================================================================== */}
      {/* REQUEST MISSING INFORMATION MODAL */}
      {/* =================================================================== */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">Request Missing Information</h3>
              </div>
              <button
                onClick={() => setShowMissingModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select which items are incomplete. The client will see these highlighted directly inside their intake workspace without losing any progress already saved.
            </p>

            {/* Checklist */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">Common Missing Requirements</span>
              {[
                'Company / School Logo (Vector, SVG, or High-Res PNG)',
                'Product / Campus / Infrastructure Photos',
                'Written Page Copy & Descriptions (About, Services, Offerings)',
                'Domain Name Registrar & DNS Access Credentials',
                'Brand Colors, Typography & Style Guidelines',
                'School Prospectus / Affiliation & Mandatory Disclosures',
              ].map((item) => {
                const isSelected = selectedMissingItems.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedMissingItems((prev) =>
                          isSelected ? prev.filter((i) => i !== item) : [...prev, item]
                        );
                      }}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom missing item */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Additional Missing Item (Optional)
              </label>
              <input
                type="text"
                value={customMissingItem}
                onChange={(e) => setCustomMissingItem(e.target.value)}
                placeholder="e.g. GST Registration Certificate, Staff directory..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Admin notes */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Instructions / Note for Client
              </label>
              <textarea
                rows={3}
                value={missingNotes}
                onChange={(e) => setMissingNotes(e.target.value)}
                placeholder="Explain clearly what needs to be uploaded or clarified..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRequestMissingInfo}
                disabled={isSendingMissing}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSendingMissing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Dispatch Request</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
