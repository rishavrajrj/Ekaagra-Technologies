'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  SchoolProject,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  SchoolApprovedSnapshot,
  SchoolOnboardingInvitation,
  UniversalIntakeData,
  FieldReviewStatus,
  MediaReviewStatus,
} from '@/lib/types';
import {
  evaluateSchoolReviewState,
  CANONICAL_REVIEWABLE_FIELDS,
  type OverallReviewEvaluation,
  type ReviewBlocker,
  type ReviewChecklistItem,
  type ActionRequiredItem,
} from '@/lib/schoolReviewEngine';
import {
  updateFieldReviewStatusAction,
  updateMediaAssetReviewStatusAction,
  createFieldChangeRequestAction,
  createMediaChangeRequestAction,
  resolveChangeRequestAction,
  finalApproveSchoolProjectAction,
  triggerPlatformHandoffAction,
  sendSchoolChangeRequestsDigestAction,
} from '@/app/schoolProjectActions';
import {
  School,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  Image as ImageIcon,
  MessageSquare,
  ShieldCheck,
  Send,
  Download,
  Share2,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  BookOpen,
  GraduationCap,
  Users,
  DollarSign,
  Palette,
  Calendar,
  Compass,
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { formatBytes } from '@/lib/imageUtils';

interface SchoolProjectWorkspaceProps {
  project: SchoolProject;
  currentSubmission?: SchoolIntakeSubmission | null;
  changeRequests: SchoolIntakeChangeRequest[];
  customFields: SchoolProjectCustomField[];
  customRequirements: SchoolProjectCustomRequirement[];
  approvedSnapshot?: SchoolApprovedSnapshot | null;
  invitation?: SchoolOnboardingInvitation | null;
}

export default function SchoolProjectWorkspace({
  project: initialProject,
  currentSubmission,
  changeRequests: initialChangeRequests,
  customFields,
  customRequirements,
  approvedSnapshot,
  invitation,
}: SchoolProjectWorkspaceProps) {
  const router = useRouter();
  const [project, setProject] = useState<SchoolProject>(initialProject);
  const [changeRequests, setChangeRequests] = useState<SchoolIntakeChangeRequest[]>(initialChangeRequests);
  const [activeTab, setActiveTab] = useState<'overview' | 'intake' | 'media' | 'reviews' | 'provisioning'>('overview');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
    whatsappUrl?: string;
  } | null>(null);

  // Section Filter for Intake tab
  const [intakeSectionFilter, setIntakeSectionFilter] = useState<string>('all');
  // Media Category Filter
  const [mediaCategoryFilter, setMediaCategoryFilter] = useState<string>('all');
  // Change Request Status Filter
  const [crStatusFilter, setCrStatusFilter] = useState<'all' | 'waiting_for_school' | 'ready_for_review' | 'resolved'>('all');

  // Modals state
  const [showRawJsonModal, setShowRawJsonModal] = useState(false);
  const [fieldCRModal, setFieldCRModal] = useState<{
    sectionKey: string;
    fieldKey: string;
    fieldLabel: string;
    currentValue: string;
  } | null>(null);
  const [fieldCRReason, setFieldCRReason] = useState('Incomplete or inaccurate information');
  const [fieldCRComment, setFieldCRComment] = useState('');
  const [fieldCRSuggested, setFieldCRSuggested] = useState('');

  const [mediaCRModal, setMediaCRModal] = useState<{
    assetId: string;
    assetTitle: string;
    currentUrl?: string;
  } | null>(null);
  const [mediaCRReason, setMediaCRReason] = useState('Low resolution or poor aspect ratio');
  const [mediaCRComment, setMediaCRComment] = useState('');

  const [previewingAsset, setPreviewingAsset] = useState<any | null>(null);
  const [finalApprovalNotes, setFinalApprovalNotes] = useState('');

  // Real-time authoritative review engine evaluation
  const reviewEval: OverallReviewEvaluation = useMemo(() => {
    return evaluateSchoolReviewState(project, currentSubmission ?? null, changeRequests);
  }, [project, currentSubmission, changeRequests]);

  const intakePayload: UniversalIntakeData = (currentSubmission?.intake_payload as UniversalIntakeData) || ({} as any);

  const onboardingUrl = invitation?.invitation_code
    ? `/school-onboarding/${invitation.invitation_code}`
    : `/school-onboarding?project=${project.project_number}`;

  const copyOnboardingLink = () => {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl;
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleApproveField = async (fieldKey: string, sectionKey: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await updateFieldReviewStatusAction(project.id, sectionKey, fieldKey, 'verified', 'Approved by administrator');
    if (res.success) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const fieldReviews = { ...(meta.fieldReviews || {}) };
        fieldReviews[fieldKey] = {
          sectionKey,
          fieldKey,
          status: 'verified',
          notes: 'Approved by administrator',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, fieldReviews } };
      });
      setActionMessage({ text: `Field "${fieldKey}" verified successfully!`, type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to verify field', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleDispatchBatchNotification = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await sendSchoolChangeRequestsDigestAction(project.id);
    if (res.success) {
      const emailDetail = res.emailSent
        ? `Consolidated email sent to ${res.contactEmail || 'customer'} (${res.count} items).`
        : `Consolidated notification recorded for ${res.count} item(s).`;
      setActionMessage({
        text: `${emailDetail} WhatsApp digest ready.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
    } else {
      setActionMessage({
        text: res.error || 'Failed to send change requests digest',
        type: 'error',
      });
    }
    setIsActionLoading(false);
  };

  const handleSubmitFieldCR = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault();
    if (!fieldCRModal || !fieldCRComment.trim()) return;
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await createFieldChangeRequestAction({
      projectId: project.id,
      sectionKey: fieldCRModal.sectionKey,
      fieldKey: fieldCRModal.fieldKey,
      currentValue: fieldCRModal.currentValue,
      reason: fieldCRReason,
      suggestedValue: fieldCRSuggested.trim() || undefined,
      reviewerMessage: fieldCRComment.trim(),
      sendImmediately,
    });
    if (res.success && res.changeRequest) {
      setChangeRequests((prev) => [res.changeRequest as SchoolIntakeChangeRequest, ...prev]);
      setProject((prev) => {
        const meta = prev.metadata || {};
        const fieldReviews = { ...(meta.fieldReviews || {}) };
        fieldReviews[fieldCRModal.fieldKey] = {
          sectionKey: fieldCRModal.sectionKey,
          fieldKey: fieldCRModal.fieldKey,
          status: 'changes_requested',
          notes: fieldCRComment.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, status: 'changes_requested', metadata: { ...meta, fieldReviews } };
      });
      const notifDetail = res.emailSent
        ? ` (Consolidated email sent to ${res.contactEmail || 'customer'})`
        : sendImmediately
        ? ''
        : ' (Saved to review pass. You can add more changes and send all in 1 consolidated email)';
      setActionMessage({
        text: `Change request recorded${notifDetail}.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
      setFieldCRModal(null);
      setFieldCRComment('');
      setFieldCRSuggested('');
    } else {
      setActionMessage({ text: res.error || 'Failed to submit change request', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleApproveMediaAsset = async (assetId: string) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await updateMediaAssetReviewStatusAction(project.id, assetId, 'approved', 'Approved for website publication');
    if (res.success) {
      setProject((prev) => {
        const meta = prev.metadata || {};
        const mediaReviews = { ...(meta.mediaReviews || {}) };
        mediaReviews[assetId] = {
          assetId,
          status: 'approved',
          notes: 'Approved for website publication',
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, metadata: { ...meta, mediaReviews } };
      });
      setActionMessage({ text: 'Media asset approved for website use!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to approve media asset', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleSubmitMediaCR = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault();
    if (!mediaCRModal || !mediaCRComment.trim()) return;
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await createMediaChangeRequestAction({
      projectId: project.id,
      assetId: mediaCRModal.assetId,
      assetTitle: mediaCRModal.assetTitle,
      reason: mediaCRReason,
      reviewerMessage: mediaCRComment.trim(),
      sendImmediately,
    });
    if (res.success && res.changeRequest) {
      setChangeRequests((prev) => [res.changeRequest as SchoolIntakeChangeRequest, ...prev]);
      setProject((prev) => {
        const meta = prev.metadata || {};
        const mediaReviews = { ...(meta.mediaReviews || {}) };
        mediaReviews[mediaCRModal.assetId] = {
          assetId: mediaCRModal.assetId,
          status: 'changes_requested',
          notes: mediaCRComment.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: 'Ekaagra Reviewer',
        };
        return { ...prev, status: 'changes_requested', media_status: 'changes_requested', metadata: { ...meta, mediaReviews } };
      });
      const notifDetail = res.emailSent
        ? ` (Consolidated email sent to ${res.contactEmail || 'customer'})`
        : sendImmediately
        ? ''
        : ' (Saved to review pass. You can add more changes and send all in 1 consolidated email)';
      setActionMessage({
        text: `Media replacement request recorded${notifDetail}.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
      setMediaCRModal(null);
      setMediaCRComment('');
    } else {
      setActionMessage({ text: res.error || 'Failed to request media replacement', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleResolveChangeRequest = async (cr: SchoolIntakeChangeRequest, approved: boolean) => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await resolveChangeRequestAction(
      project.id,
      cr.id,
      approved ? 'Correction verified and approved by reviewer' : 'Correction rejected by reviewer'
    );
    if (res.success) {
      setChangeRequests((prev) =>
        prev.map((item) =>
          item.id === cr.id
            ? {
                ...item,
                status: approved ? 'resolved' : 'waiting_for_school',
                resolved_at: approved ? new Date().toISOString() : null,
                resolved_by: approved ? 'Ekaagra Reviewer' : null,
              }
            : item
        )
      );
      setProject((prev) => {
        const meta = prev.metadata || {};
        if (cr.asset_id) {
          const mediaReviews = { ...(meta.mediaReviews || {}) };
          mediaReviews[cr.asset_id] = {
            assetId: cr.asset_id,
            status: approved ? 'approved' : 'changes_requested',
            notes: approved ? 'Resolved and approved' : 'Correction rejected',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Ekaagra Reviewer',
          };
          return { ...prev, metadata: { ...meta, mediaReviews } };
        } else if (cr.field_key) {
          const fieldReviews = { ...(meta.fieldReviews || {}) };
          fieldReviews[cr.field_key] = {
            sectionKey: cr.section_key,
            fieldKey: cr.field_key,
            status: approved ? 'verified' : 'changes_requested',
            notes: approved ? 'Resolved and approved' : 'Correction rejected',
            updatedAt: new Date().toISOString(),
            updatedBy: 'Ekaagra Reviewer',
          };
          return { ...prev, metadata: { ...meta, fieldReviews } };
        }
        return prev;
      });
      setActionMessage({
        text: approved ? 'Change request resolved and item verified!' : 'Change request sent back for revision.',
        type: 'success',
      });
    } else {
      setActionMessage({ text: res.error || 'Failed to resolve change request', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleFinalApprove = async () => {
    if (reviewEval.websiteReadiness !== 'READY') {
      setActionMessage({ text: 'Cannot approve: Website readiness requirements are not met.', type: 'error' });
      return;
    }
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await finalApproveSchoolProjectAction(project.id, finalApprovalNotes.trim() || undefined);
    if (res.success) {
      setProject((prev) => ({
        ...prev,
        status: 'approved',
        metadata: {
          ...(prev.metadata || {}),
          finalApproval: {
            approvedAt: new Date().toISOString(),
            approvedBy: 'Ekaagra Reviewer',
            notes: finalApprovalNotes.trim() || undefined,
          },
        },
      }));
      setActionMessage({ text: 'Project verified and locked for provisioning handoff!', type: 'success' });
      setActiveTab('provisioning');
    } else {
      setActionMessage({ text: res.error || 'Final approval failed', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleTriggerHandoff = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await triggerPlatformHandoffAction(project.id);
    if (res.success) {
      setProject((prev) => ({ ...prev, status: 'handed_off' }));
      setActionMessage({ text: 'Step 41/42 Provisioning handoff executed successfully!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Provisioning failed', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const formatFieldValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return '— Not provided —';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) {
      if (val.length === 0) return '— None specified —';
      if (typeof val[0] === 'object') return `${val.length} item(s)`;
      return val.join(', ');
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  const canonicalFieldsBySection = useMemo(() => {
    const map: Record<string, typeof CANONICAL_REVIEWABLE_FIELDS> = {};
    CANONICAL_REVIEWABLE_FIELDS.forEach((f) => {
      if (!map[f.sectionKey]) map[f.sectionKey] = [];
      map[f.sectionKey].push(f);
    });
    return map;
  }, []);

  return (
    <div className="eka-content-container space-y-6 min-w-0 pb-16">
      {/* ─── TOP HEADER & BREADCRUMB ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link
            href="/admin/school-projects"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to School Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800">
              <School className="w-3 h-3" />
              <span>School Project Workspace</span>
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--admin-surface-secondary)] text-[var(--admin-text-sub)] border border-[var(--admin-border)]">
              {project.project_number}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--admin-text-main)] tracking-tight">
              {project.school_name}
            </h1>
            <p className="text-xs text-[var(--admin-text-sub)] mt-1 flex items-center gap-2 flex-wrap">
              {project.city && <span>{project.city}, {project.state || ''} &bull;</span>}
              <span>Contact: {project.primary_contact_name} ({project.primary_contact_email})</span>
              <span>&bull;</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase">{project.product_id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={copyOnboardingLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--admin-card)] text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-hover)] text-xs font-bold rounded-xl border border-[var(--admin-card-border)] transition-colors shadow-2xs cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Onboarding Link'}</span>
            </button>

            <Link
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] text-xs font-bold rounded-xl border border-[var(--admin-border)] shadow-2xs transition-colors"
            >
              <span>Open Onboarding</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Dynamic Primary Workflow Action */}
            {reviewEval.websiteReadiness === 'BLOCKED' ? (
              <button
                type="button"
                onClick={() => {
                  if (reviewEval.nextActionItem) {
                    setActiveTab(reviewEval.nextActionItem.targetTab);
                  } else {
                    setActiveTab('overview');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span>Review Incomplete ({reviewEval.blockers.length} Blockers)</span>
              </button>
            ) : project.status === 'handed_off' ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Platform Provisioned</span>
              </span>
            ) : project.status === 'approved' || Boolean(project.metadata?.finalApproval?.approvedAt) ? (
              <button
                type="button"
                onClick={handleTriggerHandoff}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute Step 41/42 Provisioning</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalApprove}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve &amp; Lock for Website Build</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── ACTION NOTIFICATION ────────────────────────────────────────────── */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex flex-wrap items-center justify-between gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span>{actionMessage.text}</span>
          </div>
          <div className="flex items-center gap-2">
            {actionMessage.whatsappUrl && (
              <a
                href={actionMessage.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send WhatsApp Alert</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-sm leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* ─── CONSOLIDATED REVIEW PASS BATCH DISPATCH BAR ────────────────────── */}
      {(() => {
        const pendingCRs = changeRequests.filter(
          (cr) => cr.status === 'open' || cr.status === 'waiting_for_school'
        );
        if (pendingCRs.length === 0) return null;

        return (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-[var(--admin-text-main)]">
                    Review Pass: {pendingCRs.length} Change Request{pendingCRs.length > 1 ? 's' : ''} Awaiting School Action
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950 dark:text-amber-200">
                    Batch Consolidation Active
                  </span>
                </div>
                <p className="text-xs text-[var(--admin-text-sub)] mt-0.5">
                  Requested changes are visually highlighted on the customer&apos;s onboarding form. You can consolidate all {pendingCRs.length} item{pendingCRs.length > 1 ? 's' : ''} into a single email digest so the customer is not spammed.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDispatchBatchNotification}
                disabled={isActionLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send All in 1 Email ({pendingCRs.length})</span>
              </button>
            </div>
          </div>
        );
      })()}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Submission */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">Submission</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--admin-surface-secondary)] text-[var(--admin-text-sub)] border border-[var(--admin-border)]">
              v{currentSubmission?.version_number ?? 1}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-black text-[var(--admin-text-main)] uppercase tracking-tight">
              {reviewEval.submissionStatus}
            </span>
            <span className="font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
              {reviewEval.submissionCompleteness}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--admin-surface-secondary)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                reviewEval.submissionCompleteness >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, reviewEval.submissionCompleteness)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Content Review */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Content Review</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                reviewEval.contentReviewStatus === 'approved'
                  ? 'admin-badge-success'
                  : reviewEval.contentReviewStatus === 'changes_requested'
                  ? 'admin-badge-error'
                  : 'admin-badge-warning'
              }`}
            >
              {reviewEval.contentReviewStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--admin-text-sub)]">
              {reviewEval.overallReviewPercentage}%
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.actionRequiredItems.filter((i) => i.targetTab === 'intake').length} fields need action
          </p>
        </div>

        {/* Card 3: Media Review */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Media Assets</span>
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${
                reviewEval.mediaReviewStatus === 'approved'
                  ? 'admin-badge-success'
                  : reviewEval.mediaReviewStatus === 'changes_requested'
                  ? 'admin-badge-error'
                  : 'admin-badge-warning'
              }`}
            >
              {reviewEval.mediaReviewStatus.replace(/_/g, ' ')}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--admin-text-sub)]">
              {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'approved').length}/{reviewEval.aggregatedAssets.length}
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'changes_requested').length} replacements requested
          </p>
        </div>

        {/* Card 4: Website Readiness */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Website Readiness</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${
                reviewEval.websiteReadiness === 'READY'
                  ? 'admin-badge-success'
                  : 'admin-badge-error'
              }`}
            >
              {reviewEval.websiteReadiness === 'READY' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{reviewEval.websiteReadiness}</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate" title={reviewEval.websiteReadinessReason}>
            {reviewEval.blockers.length === 0 ? 'Verified for Build' : `${reviewEval.blockers.length} blockers active`}
          </p>
        </div>

        {/* Card 5: Provisioning State */}
        <div className="bg-[var(--admin-card)] p-4 rounded-2xl border border-[var(--admin-card-border)] shadow-2xs space-y-1.5">
          <span className="text-[10px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider block">Provisioning</span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${
                reviewEval.provisioningStatus === 'HANDED_OFF'
                  ? 'admin-badge-info'
                  : reviewEval.provisioningStatus === 'READY'
                  ? 'admin-badge-success'
                  : 'admin-badge-neutral'
              }`}
            >
              {reviewEval.provisioningStatus === 'HANDED_OFF' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : reviewEval.provisioningStatus === 'READY' ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>{reviewEval.provisioningStatus.replace(/_/g, ' ')}</span>
            </span>
          </div>
          <p className="text-[11px] text-[var(--admin-text-muted)] truncate">
            {reviewEval.provisioningStatus === 'HANDED_OFF'
              ? 'Tenant compiled'
              : reviewEval.provisioningStatus === 'READY'
              ? 'Ready to execute'
              : 'Locked by safety gate'}
          </p>
        </div>
      </section>

      {/* ─── TABS NAVIGATION ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-[var(--admin-border)] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          Overview &amp; Profile
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('intake')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'intake'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Intake Data</span>
          {reviewEval.actionRequiredItems.filter((i) => i.targetTab === 'intake').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {reviewEval.actionRequiredItems.filter((i) => i.targetTab === 'intake').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('media')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'media'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Media &amp; Assets</span>
          {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'changes_requested').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {reviewEval.aggregatedAssets.filter((a) => project.metadata?.mediaReviews?.[a.id]?.status === 'changes_requested').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Change Requests</span>
          {changeRequests.filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {changeRequests.filter((cr) => cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('provisioning')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'provisioning'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--admin-text-sub)] hover:text-[var(--admin-text-main)] hover:bg-[var(--admin-surface-secondary)]'
          }`}
        >
          <span>Provisioning Handoff</span>
          {reviewEval.provisioningStatus === 'LOCKED' ? (
            <Lock className="w-3 h-3 text-[var(--admin-text-muted)]" />
          ) : (
            <Unlock className="w-3 h-3 text-emerald-500" />
          )}
        </button>
      </div>

      {/* ─── TAB 1: OVERVIEW & PROFILE ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* School Profile Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" />
                <span>School Profile &amp; Core Parameters</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Institution Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.school_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solution Package</span>
                  <span className="font-bold text-violet-700 dark:text-violet-400 uppercase">{project.product_id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Primary Contact</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {project.primary_contact_name} ({project.primary_contact_designation || 'Staff'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Phone</span>
                  <span className="font-mono text-slate-900 dark:text-white">{project.primary_contact_phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contact Email</span>
                  <span className="font-mono text-slate-900 dark:text-white">{project.primary_contact_email}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location</span>
                  <span className="text-slate-900 dark:text-white">
                    {project.city ? `${project.city}, ${project.state || ''}` : 'Not confirmed'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Campuses Configured</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {intakePayload.campuses?.length || 1} Campus(es)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Affiliation Board</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {(intakePayload as any)?.curriculum?.board || (intakePayload.schoolProfile as any)?.boardAffiliation || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            {/* Review Summary Dashboard */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    <span>Review Progress by Section</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Field-by-field verification status across all intake chapters
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  {reviewEval.overallReviewPercentage}% Total Verified
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all"
                  style={{ width: `${reviewEval.overallReviewPercentage}%` }}
                />
              </div>

              {/* Section Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {Object.values(reviewEval.sectionReviews).map((sec) => (
                  <div
                    key={sec.sectionKey}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{sec.sectionLabel}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sec.verifiedCount} of {sec.totalFields} verified
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          sec.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : sec.status === 'changes_requested'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {sec.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIntakeSectionFilter(sec.sectionKey);
                          setActiveTab('intake');
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Review section"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Required Items List */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Action Required Items</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {reviewEval.actionRequiredItems.length} Pending
                </span>
              </div>

              {reviewEval.actionRequiredItems.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>All review items have been inspected and verified! No pending actions.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviewEval.actionRequiredItems.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{item.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.targetSection) setIntakeSectionFilter(item.targetSection);
                          setActiveTab(item.targetTab);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  ))}
                  {reviewEval.actionRequiredItems.length > 5 && (
                    <p className="text-xs text-center text-slate-500">
                      + {reviewEval.actionRequiredItems.length - 5} more items requiring review.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Change Requests Summary Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-600" />
                  <span>Change Request Remediation</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  View All Requests ({changeRequests.length})
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 block">
                    {reviewEval.changeRequestsSummary.waitingForSchool + reviewEval.changeRequestsSummary.open}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Waiting for School
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 text-center">
                  <span className="text-lg font-black text-indigo-700 dark:text-indigo-400 block">
                    {reviewEval.changeRequestsSummary.readyForReview}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300">
                    Ready for Review
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 block">
                    {reviewEval.changeRequestsSummary.resolved}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                    Resolved &amp; Closed
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-lg font-black text-slate-700 dark:text-slate-300 block">
                    {reviewEval.changeRequestsSummary.total}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                    Total Lifetime
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            {/* Website Readiness Checklist Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-violet-600" />
                  <span>Website Readiness Checklist</span>
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    reviewEval.websiteReadiness === 'READY'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {reviewEval.websiteReadiness}
                </span>
              </div>

              <div className="space-y-3">
                {reviewEval.checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-2.5 text-xs">
                    {item.status === 'passed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : item.status === 'blocked' ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white leading-tight">{item.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.note}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blockers list if any */}
              {reviewEval.blockers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                    Active Blocker Details ({reviewEval.blockers.length})
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {reviewEval.blockers.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 space-y-0.5"
                      >
                        <p className="font-bold">{b.title}</p>
                        <p className="text-[11px] text-rose-800 dark:text-rose-300">{b.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Onboarding Invitation Link Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-600" />
                <span>Onboarding Link</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                School staff use this authenticated URL to input school details, academic schedules, fees, and photo galleries.
              </p>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                {typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl}
              </div>
              <button
                type="button"
                onClick={copyOnboardingLink}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>

            {/* Custom Requirements if any */}
            {customRequirements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Specific School Requirements ({customRequirements.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {customRequirements.map((cr) => (
                    <div key={cr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white">{cr.title}</p>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">{cr.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: INTAKE DATA (HUMAN-READABLE REVIEW CENTER) ───────────────── */}
      {activeTab === 'intake' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            {/* Section Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Section:</span>
              {[
                { key: 'all', label: 'All Sections' },
                { key: 'schoolProfile', label: 'School Profile' },
                { key: 'campuses', label: 'Campuses' },
                { key: 'academicScope', label: 'Academics' },
                { key: 'admissions', label: 'Admissions' },
                { key: 'fees', label: 'Fees' },
                { key: 'facilities', label: 'Facilities' },
                { key: 'websiteContent', label: 'Website Content' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setIntakeSectionFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    intakeSectionFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Secondary: Raw Submission JSON */}
            <button
              type="button"
              onClick={() => setShowRawJsonModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Raw Submission</span>
            </button>
          </div>

          {/* Submission not recorded empty state */}
          {!currentSubmission ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Intake Submission Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The school staff has not finalized and submitted their onboarding intake form. You can preview their draft link or send a reminder.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sections Rendered */}
              {Object.entries(canonicalFieldsBySection)
                .filter(([secKey]) => intakeSectionFilter === 'all' || intakeSectionFilter === secKey)
                .map(([secKey, fields]) => {
                  const secSummary = reviewEval.sectionReviews[secKey];
                  return (
                    <div
                      key={secKey}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className="p-4 sm:p-5 bg-[var(--admin-surface-secondary)] border-b border-[var(--admin-border)] flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--admin-text-main)]">
                            {secSummary?.sectionLabel || secKey}
                          </h3>
                          <p className="text-xs text-[var(--admin-text-sub)]">
                            {secSummary?.verifiedCount || 0} of {fields.length} verified
                          </p>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                            secSummary?.status === 'approved'
                              ? 'admin-badge-success'
                              : secSummary?.status === 'changes_requested'
                              ? 'admin-badge-error'
                              : 'admin-badge-warning'
                          }`}
                        >
                          {secSummary?.status.replace(/_/g, ' ') || 'in review'}
                        </span>
                      </div>

                      {/* Fields Table / Grid */}
                      <div className="divide-y divide-[var(--admin-border-subtle)]">
                        {fields.map((field) => {
                          const rawVal = field.getter(intakePayload);
                          const displayVal = formatFieldValue(rawVal);
                          const reviewItem = project.metadata?.fieldReviews?.[field.key];
                          const activeCR = changeRequests.find(
                            (cr) =>
                              (cr.field_key === field.key || (cr.section_key === field.sectionKey && cr.field_key === field.key.split('.')[1])) &&
                              (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
                          );

                          let effectiveStatus: FieldReviewStatus = 'needs_review';
                          if (activeCR) {
                            effectiveStatus = 'changes_requested';
                          } else if (reviewItem?.status) {
                            effectiveStatus = reviewItem.status;
                          }

                          return (
                            <div
                              key={field.key}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-[var(--admin-surface-hover)] transition-colors"
                            >
                              <div className="space-y-1.5 max-w-xl">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[var(--admin-text-main)]">
                                    {field.label}
                                  </span>
                                  {field.required && (
                                    <span className="text-[10px] text-rose-500 font-bold">*Required</span>
                                  )}
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                      effectiveStatus === 'verified' || effectiveStatus === 'approved'
                                        ? 'admin-badge-success'
                                        : effectiveStatus === 'changes_requested'
                                        ? 'admin-badge-error'
                                        : 'admin-badge-warning'
                                    }`}
                                  >
                                    {effectiveStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="text-[var(--admin-text-main)] font-mono text-xs break-words bg-[var(--admin-surface-secondary)]/50 p-2 rounded-lg border border-[var(--admin-border-subtle)]">
                                  {displayVal}
                                </div>

                                {activeCR && (
                                  <div className="mt-1 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-700 dark:text-rose-300">
                                    <span className="font-bold">Active Change Request: </span>
                                    {activeCR.request_comment}
                                    {activeCR.school_response && (
                                      <div className="mt-1 font-semibold text-[var(--admin-text-main)]">
                                        School Response: {activeCR.school_response}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {effectiveStatus !== 'verified' && effectiveStatus !== 'approved' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveField(field.key, field.sectionKey)}
                                    disabled={isActionLoading}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold admin-badge-success">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setFieldCRModal({
                                      sectionKey: field.sectionKey,
                                      fieldKey: field.key,
                                      fieldLabel: field.label,
                                      currentValue: displayVal,
                                    });
                                    setFieldCRComment('');
                                    setFieldCRSuggested('');
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-surface-hover)] text-[var(--admin-text-main)] border border-[var(--admin-border)] font-bold text-xs transition-colors cursor-pointer"
                                >
                                  Request Change
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: MEDIA & ASSETS (VISUAL ASSET REVIEW CENTER) ─────────────── */}
      {activeTab === 'media' && (
        <div className="space-y-5">
          {/* Header & Category Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Category:</span>
              {[
                { key: 'all', label: 'All Media' },
                { key: 'branding', label: 'Branding & Logos' },
                { key: 'campus', label: 'Campus & Exterior' },
                { key: 'facilities', label: 'Facilities & Labs' },
                { key: 'people', label: 'Leadership & Faculty' },
                { key: 'promotional', label: 'Promotional & Gallery' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setMediaCategoryFilter(pill.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    mediaCategoryFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-500 font-bold">
              {reviewEval.aggregatedAssets.length} Total Assets Submitted
            </div>
          </div>

          {/* Assets Grid */}
          {reviewEval.aggregatedAssets.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Media Assets Uploaded
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                School campus photos, official logos, and hero banners uploaded during onboarding will appear here for visual verification.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviewEval.aggregatedAssets
                .filter((asset) => mediaCategoryFilter === 'all' || asset.category === mediaCategoryFilter)
                .map((asset) => {
                  const reviewItem = project.metadata?.mediaReviews?.[asset.id];
                  const activeCR = changeRequests.find(
                    (cr) =>
                      cr.asset_id === asset.id &&
                      (cr.status === 'open' || cr.status === 'waiting_for_school' || cr.status === 'ready_for_review')
                  );

                  let effectiveStatus: MediaReviewStatus = 'pending_review';
                  if (activeCR) {
                    effectiveStatus = 'changes_requested';
                  } else if (reviewItem?.status) {
                    effectiveStatus = reviewItem.status;
                  }

                  return (
                    <div
                      key={asset.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between"
                    >
                      {/* Image Thumbnail */}
                      <div
                        className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer group"
                        onClick={() => setPreviewingAsset(asset)}
                      >
                        {asset.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={asset.url}
                            alt={asset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-1.5">
                            <ImageIcon className="w-8 h-8" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">No URL Recorded</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                            {asset.category}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase backdrop-blur-xs ${
                              effectiveStatus === 'approved'
                                ? 'bg-emerald-600/90 text-white'
                                : effectiveStatus === 'changes_requested'
                                ? 'bg-rose-600/90 text-white'
                                : 'bg-amber-500/90 text-white'
                            }`}
                          >
                            {effectiveStatus.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Eye className="w-4 h-4" />
                          <span>Click to Inspect</span>
                        </div>
                      </div>

                      {/* Details & Actions */}
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                              {asset.title}
                            </h4>
                            {asset.required && (
                              <span className="text-[10px] font-bold text-rose-500">*Required</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            Section: {asset.sourceSectionLabel}
                          </p>

                          {/* Usages */}
                          {asset.usages && asset.usages.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {asset.usages.map((u: string) => (
                                <span
                                  key={u}
                                  className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                >
                                  {u}
                                </span>
                              ))}
                            </div>
                          )}

                          {activeCR && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300">
                              <span className="font-bold">Requested: </span>
                              {activeCR.request_comment}
                            </div>
                          )}
                        </div>

                        {/* Inline Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {effectiveStatus !== 'approved' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveMediaAsset(asset.id)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approved</span>
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setMediaCRModal({
                                assetId: asset.id,
                                assetTitle: asset.title,
                                currentUrl: asset.url,
                              });
                              setMediaCRComment('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                          >
                            Request Replacement
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: CHANGE REQUESTS (REMEDIATION HUB) ────────────────────────── */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Top KPI & Filters */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1">Status:</span>
              {[
                { key: 'all', label: 'All Requests' },
                { key: 'waiting_for_school', label: 'Waiting for School' },
                { key: 'ready_for_review', label: 'Ready for Review' },
                { key: 'resolved', label: 'Resolved' },
              ].map((pill) => (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setCrStatusFilter(pill.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    crStatusFilter === pill.key
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500">
              {changeRequests.length} Total Requests
            </span>
          </div>

          {/* Change Request List */}
          {changeRequests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Change Requests Recorded
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Any corrections requested for intake data fields or media assets will be tracked here in real time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequests
                .filter((cr) => {
                  if (crStatusFilter === 'all') return true;
                  if (crStatusFilter === 'waiting_for_school') return cr.status === 'open' || cr.status === 'waiting_for_school';
                  if (crStatusFilter === 'ready_for_review') return cr.status === 'ready_for_review';
                  if (crStatusFilter === 'resolved') return cr.status === 'resolved' || cr.status === 'approved';
                  return true;
                })
                .map((cr) => {
                  const isReadyForReview = cr.status === 'ready_for_review';
                  const isWaiting = cr.status === 'open' || cr.status === 'waiting_for_school';
                  const isResolved = cr.status === 'resolved' || cr.status === 'approved';

                  return (
                    <div
                      key={cr.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isReadyForReview
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                          : isWaiting
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cr.section_key}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {cr.field_key || cr.asset_id || 'Item'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isReadyForReview
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                                : isWaiting
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {cr.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(cr.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Reviewer Note: </span>
                          <span className="text-slate-900 dark:text-white font-medium">{cr.request_comment}</span>
                        </div>

                        {cr.suggested_value && (
                          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
                            <span className="font-bold">Suggested Correction: </span>
                            <span className="font-mono">{cr.suggested_value}</span>
                          </div>
                        )}

                        {/* School Response */}
                        {cr.school_response && (
                          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] space-y-1">
                            <span className="font-bold text-indigo-900 dark:text-indigo-300">
                              School Clarification / Response:
                            </span>
                            <p className="text-indigo-800 dark:text-indigo-200 font-medium">
                              {cr.school_response}
                            </p>
                            {cr.school_updated_value && (
                              <div className="font-mono text-slate-700 dark:text-slate-300">
                                Updated Value: <strong className="text-emerald-600 dark:text-emerald-400">{cr.school_updated_value}</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Resolution Actions */}
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            if (cr.asset_id) {
                              setActiveTab('media');
                            } else {
                              setIntakeSectionFilter(cr.section_key);
                              setActiveTab('intake');
                            }
                          }}
                          className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                        >
                          <span>Jump to Field / Asset</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {isReadyForReview && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleResolveChangeRequest(cr, false)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                            >
                              Request Further Revision
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveChangeRequest(cr, true)}
                              disabled={isActionLoading}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve Correction</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: PROVISIONING HANDOFF ─────────────────────────────────────── */}
      {activeTab === 'provisioning' && (
        <div className="max-w-2xl space-y-6">
          {/* Readiness Gate Banner */}
          {reviewEval.provisioningStatus === 'LOCKED' ? (
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                    Provisioning Locked by Operational Safety Gate
                  </h3>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    Platform provisioning cannot be triggered until all intake review criteria, academic scopes, and media assets are verified.
                  </p>
                </div>
              </div>

              {/* Blockers list */}
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 space-y-1.5">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider block">
                  Mandatory Blockers Preventing Handoff:
                </span>
                <ul className="space-y-1 text-xs text-rose-800 dark:text-rose-300">
                  {reviewEval.blockers.map((b) => (
                    <li key={b.id} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">&bull;</span>
                      <span>
                        <strong>{b.title}:</strong> {b.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : reviewEval.provisioningStatus === 'READY' ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Unlock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Website Review Passed — Ready for Provisioning
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    All review items and media assets have been verified. The school dataset is ready to compile into tenant infrastructure.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border-2 border-cyan-300 dark:border-cyan-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-200 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-cyan-900 dark:text-cyan-200">
                    Step 41/42 School Platform Provisioned
                  </h3>
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Tenant code: <strong className="font-mono">{project.project_number}</strong> &bull; Handoff complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Provisioning Actions Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Step 41/42 Automated Platform Tenant Compilation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Multi-campus sync, DNS records, website dataset locking &amp; tenant bootstrap
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Tenant Code:</span>
                <strong className="font-mono text-violet-600">{project.project_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Website Readiness:</span>
                <strong className={reviewEval.websiteReadiness === 'READY' ? 'text-emerald-600' : 'text-rose-600'}>
                  {reviewEval.websiteReadiness}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Final Approval:</span>
                <strong className={project.status === 'approved' || Boolean(project.metadata?.finalApproval?.approvedAt) ? 'text-emerald-600' : 'text-amber-600'}>
                  {project.status === 'approved' || Boolean(project.metadata?.finalApproval?.approvedAt) ? 'Approved' : 'Pending'}
                </strong>
              </div>
            </div>

            {/* Execute Button */}
            {project.status === 'handed_off' ? (
              <div className="w-full py-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold rounded-xl text-xs text-center">
                Platform Successfully Handed Off &amp; Active
              </div>
            ) : reviewEval.provisioningStatus === 'READY' ? (
              <button
                type="button"
                onClick={handleTriggerHandoff}
                disabled={isActionLoading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Execute Step 41/42 Provisioning</span>
              </button>
            ) : reviewEval.websiteReadiness === 'READY' ? (
              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={finalApprovalNotes}
                  onChange={(e) => setFinalApprovalNotes(e.target.value)}
                  placeholder="Optional approval notes or sign-off remarks..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                />
                <button
                  type="button"
                  onClick={handleFinalApprove}
                  disabled={isActionLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lock &amp; Authorize for Provisioning</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200 dark:border-slate-700"
              >
                <Lock className="w-4 h-4" />
                <span>Provisioning Locked ({reviewEval.blockers.length} Blockers)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: FIELD CHANGE REQUEST ─────────────────────────────────────── */}
      {fieldCRModal && (
        <ModalPortal isOpen={Boolean(fieldCRModal)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Request Change / Correction
                  </h3>
                  <p className="text-xs text-slate-500">
                    Section: {fieldCRModal.sectionKey} &bull; Field: {fieldCRModal.fieldLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFieldCRModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitFieldCR} className="p-5 space-y-4 text-xs">
                {/* Current Value */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Current Submitted Value
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                    {fieldCRModal.currentValue}
                  </div>
                </div>

                {/* Reason Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Revision
                  </label>
                  <select
                    value={fieldCRReason}
                    onChange={(e) => setFieldCRReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium"
                  >
                    <option value="Incomplete or inaccurate information">Incomplete or inaccurate information</option>
                    <option value="Typo / Spelling / Grammar error">Typo / Spelling / Grammar error</option>
                    <option value="Formatting does not match standards">Formatting does not match standards</option>
                    <option value="Outdated or expired information">Outdated or expired information</option>
                    <option value="Conflicting with board/campus guidelines">Conflicting with board/campus guidelines</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Suggested Value */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Suggested Replacement (Optional)
                  </label>
                  <input
                    type="text"
                    value={fieldCRSuggested}
                    onChange={(e) => setFieldCRSuggested(e.target.value)}
                    placeholder="e.g. Correct official phone number or title"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                </div>

                {/* Instructions / Comment */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions to School Administration <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={fieldCRComment}
                    onChange={(e) => setFieldCRComment(e.target.value)}
                    placeholder="Explain clearly what the school needs to correct..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setFieldCRModal(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading || !fieldCRComment.trim()}
                      onClick={(e) => handleSubmitFieldCR(e, false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      title="Save this request and continue reviewing other fields to send together in 1 email"
                    >
                      Save Request (Add More)
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || !fieldCRComment.trim()}
                      onClick={(e) => handleSubmitFieldCR(e, true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Save &amp; Send All Now</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: MEDIA CHANGE REQUEST ─────────────────────────────────────── */}
      {mediaCRModal && (
        <ModalPortal isOpen={Boolean(mediaCRModal)}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Request Asset Replacement
                  </h3>
                  <p className="text-xs text-slate-500">{mediaCRModal.assetTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaCRModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitMediaCR} className="p-5 space-y-4 text-xs">
                {mediaCRModal.currentUrl && (
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaCRModal.currentUrl} alt="Current" className="w-full h-full object-cover" />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Replacement Reason
                  </label>
                  <select
                    value={mediaCRReason}
                    onChange={(e) => setMediaCRReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium"
                  >
                    <option value="Low resolution or poor aspect ratio">Low resolution or poor aspect ratio</option>
                    <option value="Watermarked or copyrighted image">Watermarked or copyrighted image</option>
                    <option value="Incorrect or outdated campus photo">Incorrect or outdated campus photo</option>
                    <option value="Bad lighting or blurry photo">Bad lighting or blurry photo</option>
                    <option value="Transparent background required for logo">Transparent background required for logo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instructions to School Administration <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={mediaCRComment}
                    onChange={(e) => setMediaCRComment(e.target.value)}
                    placeholder="Specify resolution guidelines, format, or required photo details..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setMediaCRModal(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isActionLoading || !mediaCRComment.trim()}
                      onClick={(e) => handleSubmitMediaCR(e, false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      title="Save this request and continue reviewing other items to send together in 1 email"
                    >
                      Save Request (Add More)
                    </button>
                    <button
                      type="button"
                      disabled={isActionLoading || !mediaCRComment.trim()}
                      onClick={(e) => handleSubmitMediaCR(e, true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Save &amp; Send All Now</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: RAW SUBMISSION JSON ──────────────────────────────────────── */}
      {showRawJsonModal && (
        <ModalPortal isOpen={showRawJsonModal}>
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Raw Intake Submission Payload (Audit &amp; Debug)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Submission ID: {currentSubmission?.id || 'N/A'} &bull; Version: {currentSubmission?.version_number || 1}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentSubmission) {
                        navigator.clipboard.writeText(JSON.stringify(currentSubmission.intake_payload, null, 2));
                        setActionMessage({ text: 'Raw JSON copied to clipboard!', type: 'success' });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                  >
                    Copy JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawJsonModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <div className="p-4 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
                  <pre>{JSON.stringify(currentSubmission?.intake_payload || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ─── MODAL: ASSET LIGHTBOX PREVIEW ───────────────────────────────────── */}
      {previewingAsset && (
        <ModalPortal isOpen={Boolean(previewingAsset)}>
          <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{previewingAsset.title}</h3>
                  <p className="text-xs text-slate-500">{previewingAsset.sourceSectionLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewingAsset(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
                {previewingAsset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewingAsset.url}
                    alt={previewingAsset.title}
                    className="max-h-[55vh] w-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="py-12 text-slate-500 text-xs">No preview available</div>
                )}
              </div>

              <div className="p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Website Usages:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {previewingAsset.usages?.join(', ') || 'General Gallery'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Publication Blocker:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {previewingAsset.isPublicationBlocker ? 'Yes (Mandatory)' : 'No (Optional)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
