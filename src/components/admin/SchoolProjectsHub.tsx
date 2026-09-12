'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ModalPortal from '@/components/ui/ModalPortal';

import {
  School,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  X,
  Copy,
  Check,
  Building2,
  ArrowRight,
  Sparkles,
  Download,
  CreditCard,
  Briefcase,
  Plus,
  MessageSquare,
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DirectSchoolOnboardingModal from '@/components/admin/DirectSchoolOnboardingModal';
import {
  fetchSchoolProjectsAction,
  getSchoolProjectDetailsAction,
  requestProjectChangesAction,
  approveSchoolProjectAction,
  triggerPlatformHandoffAction,
  updateMediaStatusAction,
} from '@/app/schoolProjectActions';
import type {
  SchoolProject,
  SchoolProjectStatus,
  SchoolMediaStatus,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  SchoolApprovedSnapshot,
  SchoolOnboardingInvitation,
} from '@/lib/types';
import { MEDIA_STATUS_LABELS } from '@/lib/schoolMedia';
import { INTAKE_SECTIONS } from '@/lib/schoolIntake';

const STATUS_COLORS: Record<SchoolProjectStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: 'bg-[var(--admin-surface-secondary)]', text: 'text-[var(--admin-text-sub)]', border: 'border-[var(--admin-border)]' },
  onboarding_invited: { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/25' },
  onboarding_in_progress: { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/25' },
  submitted: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500/25' },
  under_review: { bg: 'bg-indigo-500/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-500/25' },
  changes_requested: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/25' },
  resubmitted: { bg: 'bg-purple-500/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-500/25' },
  approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/25' },
  handoff_ready: { bg: 'bg-cyan-500/10', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-500/25' },
  handed_off: { bg: 'bg-emerald-500/15', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-500/35' },
  cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/25' },
  archived: { bg: 'bg-[var(--admin-surface-secondary)]', text: 'text-[var(--admin-text-muted)]', border: 'border-[var(--admin-border)]' },
};

const PRODUCT_LABELS: Record<string, string> = {
  'school-website': 'School Website',
  'school-website-cms': 'Website + CMS',
  'school-erp': 'Core ERP Platform',
  'school-complete': 'Complete (Website+CMS+ERP)',
};

export default function SchoolProjectsHub() {
  const [projects, setProjects] = useState<SchoolProject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedMediaStatus, setSelectedMediaStatus] = useState<string>('ALL');

  // Detail Drawer
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetails, setProjectDetails] = useState<{
    project: SchoolProject;
    currentSubmission?: SchoolIntakeSubmission | null;
    changeRequests: SchoolIntakeChangeRequest[];
    customFields: SchoolProjectCustomField[];
    customRequirements: SchoolProjectCustomRequirement[];
    approvedSnapshot?: SchoolApprovedSnapshot | null;
    invitation?: SchoolOnboardingInvitation | null;
  } | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Action states
  const [actionMsg, setActionMsg] = useState<{
    text: string;
    type: 'success' | 'error';
    whatsappUrl?: string;
  } | null>(null);
  const [changeRequestSection, setChangeRequestSection] = useState<string>('schoolProfile');
  const [changeRequestComment, setChangeRequestComment] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDirectModalOpen, setIsDirectModalOpen] = useState(false);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchSchoolProjectsAction({
      query: searchQuery,
      productId: selectedProduct as any,
      status: selectedStatus as any,
      mediaStatus: selectedMediaStatus as any,
    });
    if (res.success) {
      setProjects(res.projects);
      setTotal(res.total);
    }
    setIsLoading(false);
  }, [searchQuery, selectedProduct, selectedStatus, selectedMediaStatus]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadProjectDetails = async (projectId: string) => {
    setIsDetailsLoading(true);
    setSelectedProjectId(projectId);
    setActionMsg(null);
    const res = await getSchoolProjectDetailsAction(projectId);
    if (res.success && res.project) {
      setProjectDetails({
        project: res.project,
        currentSubmission: res.currentSubmission,
        changeRequests: res.changeRequests || [],
        customFields: res.customFields || [],
        customRequirements: res.customRequirements || [],
        approvedSnapshot: res.approvedSnapshot,
        invitation: res.invitation,
      });
    }
    setIsDetailsLoading(false);
  };

  const handleRequestChanges = async () => {
    if (!selectedProjectId || !changeRequestComment.trim()) return;
    setIsSubmittingAction(true);
    const res = await requestProjectChangesAction(
      selectedProjectId,
      changeRequestSection,
      changeRequestComment
    );
    if (res.success) {
      const notifDetail = res.emailSent
        ? ` (Email sent to ${res.contactEmail || 'customer'})`
        : '';
      setActionMsg({
        text: `Changes requested successfully${notifDetail}.`,
        type: 'success',
        whatsappUrl: res.whatsappUrl || undefined,
      });
      setChangeRequestComment('');
      loadProjectDetails(selectedProjectId);
      loadProjects();
    } else {
      setActionMsg({ text: res.error || 'Failed to submit change request', type: 'error' });
    }
    setIsSubmittingAction(false);
  };

  const handleApprove = async () => {
    if (!selectedProjectId) return;
    setIsSubmittingAction(true);
    const res = await approveSchoolProjectAction(selectedProjectId);
    if (res.success) {
      setActionMsg({
        text: `Project approved! Immutable snapshot created (${res.snapshotNumber}).`,
        type: 'success',
      });
      loadProjectDetails(selectedProjectId);
      loadProjects();
    } else {
      setActionMsg({ text: res.error || 'Approval failed', type: 'error' });
    }
    setIsSubmittingAction(false);
  };

  const handlePlatformHandoff = async () => {
    if (!selectedProjectId) return;
    setIsSubmittingAction(true);
    const res: any = await triggerPlatformHandoffAction(selectedProjectId);
    if (res.success) {
      setActionMsg({
        text: `Platform handoff completed! Provisioning request created (${res.idempotencyKey}) with plan ${res.planCode}.`,
        type: 'success',
      });
      loadProjectDetails(selectedProjectId);
      loadProjects();
    } else {
      setActionMsg({ text: res.error || 'Platform handoff failed', type: 'error' });
    }
    setIsSubmittingAction(false);
  };

  const handleUpdateMedia = async (newStatus: SchoolMediaStatus) => {
    if (!selectedProjectId) return;
    const res = await updateMediaStatusAction(selectedProjectId, newStatus);
    if (res.success) {
      loadProjectDetails(selectedProjectId);
      loadProjects();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="eka-content-container space-y-5 sm:space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              School Projects
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
              {total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage school onboarding, intake, content, media, review workflows, and platform provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadProjects()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsDirectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start School Onboarding</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">

        {/* Filters Bar */}
        <div className="bg-[var(--admin-card)] rounded-2xl p-4 border border-[var(--admin-border)] shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[var(--admin-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by school name, project code (SCH-...), or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-medium text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-hidden focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text-primary)] focus:outline-hidden"
            >
              <option value="ALL">All Products</option>
              <option value="school-website">School Website</option>
              <option value="school-website-cms">Website + CMS</option>
              <option value="school-erp">Core ERP</option>
              <option value="school-complete">Complete Platform</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text-primary)] focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="onboarding_invited">Onboarding Invited</option>
              <option value="onboarding_in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="approved">Approved</option>
              <option value="handed_off">Handed Off</option>
            </select>

            <select
              value={selectedMediaStatus}
              onChange={(e) => setSelectedMediaStatus(e.target.value)}
              className="px-3 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text-primary)] focus:outline-hidden"
            >
              <option value="ALL">All Media States</option>
              <option value="not_started">Media Not Started</option>
              <option value="package_downloaded">Kit Downloaded</option>
              <option value="package_submitted">Media Submitted</option>
              <option value="approved">Media Approved</option>
            </select>
          </div>
        </div>

        {/* Mobile School Projects Cards (< 768px) */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs">
              <RefreshCw className="w-6 h-6 text-[var(--admin-accent)] animate-spin" />
              <p className="text-xs text-[var(--admin-text-muted)] font-medium">Loading school projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs p-6">
              <Building2 className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto" />
              <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">No School Projects Found</h3>
              <p className="text-xs text-[var(--admin-text-muted)] max-w-xs mx-auto">
                No school projects match your current filters. Confirmed leads can be transitioned here via &quot;Start School Onboarding&quot;.
              </p>
            </div>
          ) : (
            projects.map((proj) => {
              const statusTheme = STATUS_COLORS[proj.status] || STATUS_COLORS.draft;
              const mediaInfo = MEDIA_STATUS_LABELS[proj.media_status] || MEDIA_STATUS_LABELS.not_started;
              const udiseCode = (proj.metadata as any)?.udiseCode || (proj.metadata as any)?.school_id || null;

              return (
                <div
                  key={proj.id}
                  className="bg-[var(--admin-card)] rounded-2xl p-4 border border-[var(--admin-border)] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--admin-accent)]">
                          {proj.project_number}
                        </span>
                        {udiseCode && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded admin-badge-warning font-bold" title="UDISE+ School ID">
                            UDISE: {udiseCode}
                          </span>
                        )}
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                        >
                          {proj.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[var(--admin-text-primary)] text-sm mt-1">
                        {proj.school_name}
                      </h3>
                      <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
                        {proj.city ? `${proj.city}, ${proj.state || ''}` : 'Location unconfirmed'} • Contact: {proj.primary_contact_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--admin-border-subtle)] text-xs">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[var(--admin-surface-secondary)] text-[var(--admin-text-primary)] font-semibold text-[11px] border border-[var(--admin-border)]">
                      {PRODUCT_LABELS[proj.product_id] || proj.product_id}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${mediaInfo.badgeClass}`}>
                      {mediaInfo.label}
                    </span>
                  </div>

                  {/* Completeness Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--admin-text-muted)] font-medium">Intake Completeness</span>
                      <span className="font-mono font-bold text-[var(--admin-text-primary)]">{proj.completeness_percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--admin-surface-secondary)] rounded-full overflow-hidden border border-[var(--admin-border-subtle)]">
                      <div
                        className={`h-full rounded-full ${
                          proj.completeness_percentage >= 100
                            ? 'bg-emerald-500'
                            : proj.completeness_percentage > 50
                            ? 'bg-indigo-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${proj.completeness_percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--admin-border-subtle)] flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/school-projects/${proj.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-hover-overlay)] text-[var(--admin-text-primary)] font-bold rounded-xl text-xs border border-[var(--admin-border)] transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => loadProjectDetails(proj.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Projects Table (>= 768px) */}
        <div className="hidden md:block bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[var(--admin-accent)] animate-spin" />
              <p className="text-xs text-[var(--admin-text-muted)] font-medium">Loading school projects from Schools DB...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Building2 className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto" />
              <h3 className="text-sm font-bold text-[var(--admin-text-primary)]">No School Projects Found</h3>
              <p className="text-xs text-[var(--admin-text-muted)] max-w-sm mx-auto">
                No school projects match your current filters. Confirmed leads from the Sales portal can be transitioned here via &quot;Start School Onboarding&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--admin-surface-secondary)] border-b border-[var(--admin-border)] text-[11px] font-extrabold uppercase tracking-wider text-[var(--admin-text-muted)]">
                  <tr>
                    <th className="py-3.5 px-4">Project ID</th>
                    <th className="py-3.5 px-4">School & Location</th>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Intake Status</th>
                    <th className="py-3.5 px-4">Completeness</th>
                    <th className="py-3.5 px-4">Media Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border-subtle)]">
                  {projects.map((proj) => {
                    const statusTheme = STATUS_COLORS[proj.status] || STATUS_COLORS.draft;
                    const mediaInfo = MEDIA_STATUS_LABELS[proj.media_status] || MEDIA_STATUS_LABELS.not_started;
                    const udiseCode = (proj.metadata as any)?.udiseCode || (proj.metadata as any)?.school_id || null;
                    return (
                      <tr key={proj.id} className="hover:bg-[var(--admin-hover-overlay)] transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[var(--admin-accent)]">
                          <div>{proj.project_number}</div>
                          {udiseCode && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded admin-badge-warning font-bold inline-block mt-1" title="UDISE+ School ID">
                              UDISE: {udiseCode}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-[var(--admin-text-primary)] text-sm">{proj.school_name}</div>
                          <div className="text-[11px] text-[var(--admin-text-muted)]">
                            {proj.city ? `${proj.city}, ${proj.state || ''}` : 'Location unconfirmed'} • Contact: {proj.primary_contact_name}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-[var(--admin-surface-secondary)] text-[var(--admin-text-primary)] font-bold text-[11px] border border-[var(--admin-border)]">
                            {PRODUCT_LABELS[proj.product_id] || proj.product_id}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                          >
                            {proj.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-[var(--admin-surface-secondary)] rounded-full overflow-hidden border border-[var(--admin-border-subtle)]">
                              <div
                                className={`h-full rounded-full ${
                                  proj.completeness_percentage >= 100
                                    ? 'bg-emerald-500'
                                    : proj.completeness_percentage > 50
                                    ? 'bg-indigo-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${proj.completeness_percentage}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px] text-[var(--admin-text-primary)]">
                              {proj.completeness_percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${mediaInfo.badgeClass}`}
                          >
                            {mediaInfo.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/school-projects/${proj.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--admin-surface-secondary)] hover:bg-[var(--admin-hover-overlay)] text-[var(--admin-text-primary)] font-bold rounded-lg text-xs border border-[var(--admin-border)] transition-colors cursor-pointer"
                              title="Open dedicated School Project Workspace"
                            >
                              <span>Workspace</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                            <button
                              onClick={() => loadProjectDetails(proj.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Review</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Workspace Drawer (Responsive Bottom Sheet on Mobile / Slide-Over on Desktop) */}
      <ModalPortal isOpen={!!selectedProjectId}>
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-end sm:items-stretch justify-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedProjectId(null)}
          />


          <div className="relative w-full max-w-2xl bg-[var(--admin-card)] shadow-2xl z-10 flex flex-col h-[90vh] sm:h-full rounded-t-3xl sm:rounded-none overflow-y-auto animate-slideLeft">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-[var(--admin-border)] flex items-start justify-between bg-[var(--admin-surface-secondary)] sticky top-0 z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-[var(--admin-accent)]">
                    {projectDetails?.project.project_number}
                  </span>
                  {projectDetails?.currentSubmission?.intake_payload?.schoolProfile?.udiseCode && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded admin-badge-warning font-bold">
                      UDISE: {projectDetails.currentSubmission.intake_payload.schoolProfile.udiseCode}
                    </span>
                  )}
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold admin-badge-info uppercase">
                    {projectDetails?.project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[var(--admin-text-primary)]">
                  {projectDetails?.project.school_name || 'Loading School Project...'}
                </h2>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  Lead Reference: {projectDetails?.project.lead_reference}
                </p>
              </div>

              <button
                onClick={() => setSelectedProjectId(null)}
                className="p-2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] rounded-xl hover:bg-[var(--admin-hover-overlay)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Feedback Banner */}
            {actionMsg && (
              <div
                className={`p-4 text-xs font-bold border-b flex flex-wrap items-center justify-between gap-3 ${
                  actionMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                }`}
              >
                <span>{actionMsg.text}</span>
                {actionMsg.whatsappUrl && (
                  <a
                    href={actionMsg.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send WhatsApp Alert</span>
                  </a>
                )}
              </div>
            )}

            {/* Drawer Body */}
            {isDetailsLoading || !projectDetails ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-6 h-6 text-[var(--admin-accent)] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[var(--admin-text-muted)]">Loading intake details...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* 1. Onboarding Access Link Card */}
                <div className="p-4 bg-[var(--admin-accent)]/5 rounded-2xl border border-[var(--admin-accent)]/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--admin-text-primary)]">
                      School Representative Portal Access
                    </span>
                    <span className="text-[10px] text-[var(--admin-accent)] font-bold">
                      Code: {projectDetails.invitation?.invitation_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--admin-text-muted)]">
                    Share this direct secure invitation link with the school principal or administrator to complete their universal intake:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/school-onboarding/${projectDetails.invitation?.invitation_code || projectDetails.project.project_number}`
                          : `/school-onboarding/${projectDetails.invitation?.invitation_code || projectDetails.project.project_number}`
                      }
                      className="flex-1 px-3 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-mono text-[var(--admin-text-primary)] select-all"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/school-onboarding/${projectDetails.invitation?.invitation_code || projectDetails.project.project_number}`
                        )
                      }
                      className="px-3 py-2 bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Reviewer Action Station */}
                <div className="p-4 bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--admin-text-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--admin-accent)]" />
                    Reviewer Actions
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Approve Button */}
                    <button
                      onClick={handleApprove}
                      disabled={isSubmittingAction || projectDetails.project.status === 'approved' || projectDetails.project.status === 'handed_off'}
                      className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                        projectDetails.project.status === 'approved' || projectDetails.project.status === 'handed_off'
                          ? 'bg-[var(--admin-surface-secondary)] text-[var(--admin-text-muted)] border border-[var(--admin-border)] cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Intake (Create Snapshot)</span>
                    </button>

                    {/* Step 41/42 Handoff Button */}
                    <button
                      onClick={handlePlatformHandoff}
                      disabled={isSubmittingAction || projectDetails.project.status === 'handed_off' || !projectDetails.approvedSnapshot}
                      className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                        projectDetails.project.status === 'handed_off'
                          ? 'admin-badge-success cursor-not-allowed'
                          : !projectDetails.approvedSnapshot
                          ? 'bg-[var(--admin-surface-secondary)] text-[var(--admin-text-muted)] border border-[var(--admin-border)] cursor-not-allowed'
                          : 'bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] text-white shadow-xs'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>
                        {projectDetails.project.status === 'handed_off'
                          ? 'Handed Off to Platform'
                          : 'Trigger Step 42 Provisioning'}
                      </span>
                    </button>
                  </div>

                  {/* Change Request Box */}
                  <div className="pt-2 border-t border-[var(--admin-border)] space-y-2">
                    <span className="text-[11px] font-bold text-[var(--admin-text-muted)]">
                      Request Changes / Clarifications from School:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={changeRequestSection}
                        onChange={(e) => setChangeRequestSection(e.target.value)}
                        className="px-2.5 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text-primary)] min-h-[44px]"
                      >
                        {INTAKE_SECTIONS.map((sec) => (
                          <option key={sec.key} value={sec.key}>
                            {sec.title}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="e.g. Please upload higher-resolution logo or verify student count"
                        value={changeRequestComment}
                        onChange={(e) => setChangeRequestComment(e.target.value)}
                        className="flex-1 px-3 py-2 bg-[var(--admin-surface-secondary)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] rounded-xl text-xs min-h-[44px]"
                      />
                      <button
                        onClick={handleRequestChanges}
                        disabled={isSubmittingAction || !changeRequestComment.trim()}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Media Status Control */}
                <div className="p-4 bg-[var(--admin-surface-secondary)] rounded-2xl border border-[var(--admin-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--admin-text-muted)]">
                      Campus Media Package Workflow
                    </span>
                    <span className="text-[10px] text-[var(--admin-text-muted)]">
                      14 Structured Asset Folders
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={projectDetails.project.media_status}
                      onChange={(e) => handleUpdateMedia(e.target.value as SchoolMediaStatus)}
                      className="px-3 py-2 bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] rounded-xl font-bold text-xs"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="package_downloaded">Folder Package Downloaded</option>
                      <option value="package_in_progress">Files Being Collected</option>
                      <option value="package_submitted">Media Package Submitted</option>
                      <option value="under_review">Under Review by Team</option>
                      <option value="changes_requested">Higher-Res Photos Required</option>
                      <option value="approved">Media Approved</option>
                    </select>

                    <a
                      href="/api/school-media/template"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--admin-card)] hover:bg-[var(--admin-hover-overlay)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-accent)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Media Kit Guidelines</span>
                    </a>
                  </div>
                </div>

                {/* 4. Active Change Requests List */}
                {projectDetails.changeRequests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      Recorded Change Requests ({projectDetails.changeRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {projectDetails.changeRequests.map((cr) => (
                        <div
                          key={cr.id}
                          className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-amber-700 dark:text-amber-300 font-bold capitalize">
                              {cr.section_key}
                            </strong>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                cr.status === 'resolved'
                                  ? 'admin-badge-success'
                                  : 'admin-badge-warning'
                              }`}
                            >
                              {cr.status}
                            </span>
                          </div>
                          <p className="text-[var(--admin-text-primary)]">{cr.request_comment}</p>
                          {cr.resolution_notes && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {cr.resolution_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Project Delivery & Priorities Plan (Admin Insight) */}
                {projectDetails.currentSubmission?.intake_payload?.projectDelivery && (() => {
                  const pd = projectDetails.currentSubmission.intake_payload.projectDelivery as any;
                  return (
                    <div className="p-4 bg-[var(--admin-card)] rounded-2xl border border-[var(--admin-border)] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[var(--admin-accent)]" />
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--admin-text-primary)]">
                            Project Timeline &amp; Delivery Priorities
                          </h4>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          pd.deliveryPriority === 'urgent'
                            ? 'admin-badge-error'
                            : pd.deliveryPriority === 'priority'
                            ? 'admin-badge-info'
                            : 'admin-badge-neutral'
                        }`}>
                          {pd.deliveryPriority === 'urgent' ? 'Urgent / Expedited' : pd.deliveryPriority === 'priority' ? 'Priority Queue' : 'Standard Delivery'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                        <div className="p-2.5 bg-[var(--admin-surface-secondary)] rounded-xl border border-[var(--admin-border)]">
                          <span className="text-[var(--admin-text-muted)] block text-[10px] uppercase font-bold">Target Launch</span>
                          <span className="font-bold text-[var(--admin-text-primary)] mt-0.5 block truncate">
                            {pd.targetLaunchTimeline === 'specific-date' && pd.targetLaunchDate ? pd.targetLaunchDate : pd.targetLaunchTimeline || pd.targetLaunchDate || 'Within 3-4 weeks'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[var(--admin-surface-secondary)] rounded-xl border border-[var(--admin-border)]">
                          <span className="text-[var(--admin-text-muted)] block text-[10px] uppercase font-bold">Expedited Surcharge</span>
                          <span className="font-bold text-[var(--admin-text-primary)] mt-0.5 block">
                            {pd.deliveryPriority === 'urgent' ? `+₹${(pd.expeditedFeeINR || 0).toLocaleString('en-IN')}` : 'Included (₹0)'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[var(--admin-surface-secondary)] rounded-xl border border-[var(--admin-border)]">
                          <span className="text-[var(--admin-text-muted)] block text-[10px] uppercase font-bold">Decision Maker</span>
                          <span className="font-bold text-[var(--admin-text-primary)] mt-0.5 block truncate">
                            {pd.decisionMakerName || pd.decisionMakers || 'Not specified'}
                          </span>
                        </div>

                        <div className="p-2.5 bg-[var(--admin-surface-secondary)] rounded-xl border border-[var(--admin-border)]">
                          <span className="text-[var(--admin-text-muted)] block text-[10px] uppercase font-bold">Contact</span>
                          <span className="font-mono text-[10px] text-[var(--admin-text-primary)] mt-0.5 block truncate">
                            {pd.decisionMakerPhone || pd.decisionMakerEmail || '—'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[var(--admin-text-muted)] space-y-1 pt-1">
                        <div>
                          <span className="font-bold text-[var(--admin-text-primary)]">Phase 1 Essentials ({(pd.phase1Priorities || []).length}): </span>
                          <span>{(pd.phase1Priorities || []).join(', ') || pd.phase1Requirements || 'Default essentials'}</span>
                        </div>
                        {pd.phase2Priorities && pd.phase2Priorities.length > 0 && (
                          <div>
                            <span className="font-bold text-[var(--admin-text-primary)]">Phase 2 Enhancements ({pd.phase2Priorities.length}): </span>
                            <span>{pd.phase2Priorities.join(', ')}</span>
                          </div>
                        )}
                        {pd.importantDeadlineDate && (
                          <div>
                            <span className="font-bold text-[var(--admin-text-primary)]">Important Deadline: </span>
                            <span className="text-[var(--admin-accent)]">{pd.importantDeadlineType || 'Milestone'} on {pd.importantDeadlineDate}</span>
                            {pd.importantDeadlineNotes ? ` (${pd.importantDeadlineNotes})` : ''}
                          </div>
                        )}
                        {pd.deliveryNotes && (
                          <div>
                            <span className="font-bold text-[var(--admin-text-primary)]">Delivery Notes: </span>
                            <span className="italic">{pd.deliveryNotes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 6. Submitted Intake Payload Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--admin-text-primary)]">
                    Submitted Intake Responses (Version {projectDetails.currentSubmission?.version_number || 1})
                  </h4>

                  {projectDetails.currentSubmission ? (
                    <div className="p-4 bg-[var(--admin-surface-secondary)] rounded-2xl border border-[var(--admin-border)] space-y-3 font-mono text-[11px] max-h-80 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-[var(--admin-text-primary)]">
                        {JSON.stringify(projectDetails.currentSubmission.intake_payload, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-[var(--admin-surface-secondary)] rounded-2xl border border-dashed border-[var(--admin-border)]">
                      <Clock className="w-6 h-6 text-[var(--admin-text-muted)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--admin-text-muted)]">
                        No intake responses submitted yet. School has been invited.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </ModalPortal>


      {/* Direct School Onboarding Modal */}
      <DirectSchoolOnboardingModal
        isOpen={isDirectModalOpen}
        onClose={() => setIsDirectModalOpen(false)}
        onProjectCreated={() => {
          setIsDirectModalOpen(false);
          loadProjects();
        }}
      />
    </div>
  );
}
