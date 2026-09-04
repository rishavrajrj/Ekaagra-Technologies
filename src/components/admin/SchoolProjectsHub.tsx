'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
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
  draft: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  onboarding_invited: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  onboarding_in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  submitted: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  under_review: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  changes_requested: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  resubmitted: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  handoff_ready: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  handed_off: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  archived: { bg: 'bg-slate-200', text: 'text-slate-700', border: 'border-slate-300' },
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
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [changeRequestSection, setChangeRequestSection] = useState<string>('schoolProfile');
  const [changeRequestComment, setChangeRequestComment] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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
      setActionMsg({ text: 'Changes requested successfully. School notified.', type: 'success' });
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#131B2E] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="hidden sm:inline-block w-px h-5 bg-[#E2E8F0]" />
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-[#4338CA]" />
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#131B2E]">
                School Projects & Intake 2.0
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-200">
                Option 3 Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Orders &amp; Payments</span>
            </Link>

            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#E2E8F0] text-xs font-bold rounded-lg border border-[#E2E8F0] transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              <span>Sales Leads</span>
            </Link>

            <button
              onClick={() => loadProjects()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-bold rounded-lg border border-[#E2E8F0] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
              Confirmed School Projects
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Universal detailed intake, media asset collections, reviewer change requests, and controlled Step 41/42 provisioning handoff.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2 flex items-center gap-3 shadow-xs">
              <span className="text-xs font-bold text-[#64748B]">Total Active Projects:</span>
              <span className="text-lg font-extrabold text-[#4338CA]">{total}</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by school name, project code (SCH-...), or contact person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#131B2E] focus:outline-hidden"
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
              className="px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#131B2E] focus:outline-hidden"
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
              className="px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#131B2E] focus:outline-hidden"
            >
              <option value="ALL">All Media States</option>
              <option value="not_started">Media Not Started</option>
              <option value="package_downloaded">Kit Downloaded</option>
              <option value="package_submitted">Media Submitted</option>
              <option value="approved">Media Approved</option>
            </select>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-[#4338CA] animate-spin" />
              <p className="text-xs text-[#64748B] font-medium">Loading school projects from Schools DB...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Building2 className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <h3 className="text-sm font-bold text-[#131B2E]">No School Projects Found</h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                No school projects match your current filters. Confirmed leads from the Sales portal can be transitioned here via &quot;Start School Onboarding&quot;.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#E2E8F0] text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
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
                <tbody className="divide-y divide-[#E2E8F0]">
                  {projects.map((proj) => {
                    const statusTheme = STATUS_COLORS[proj.status] || STATUS_COLORS.draft;
                    const mediaInfo = MEDIA_STATUS_LABELS[proj.media_status] || MEDIA_STATUS_LABELS.not_started;
                    return (
                      <tr key={proj.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-[#4338CA]">
                          {proj.project_number}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-[#131B2E] text-sm">{proj.school_name}</div>
                          <div className="text-[11px] text-[#64748B]">
                            {proj.city ? `${proj.city}, ${proj.state || ''}` : 'Location unconfirmed'} • Contact: {proj.primary_contact_name}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
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
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
                            <span className="font-mono font-bold text-[11px] text-[#131B2E]">
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
                          <button
                            onClick={() => loadProjectDetails(proj.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review Workspace Drawer */}
      {selectedProjectId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div
            className="fixed inset-0 bg-[#131B2E]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedProjectId(null)}
          />

          <div className="relative w-full max-w-2xl bg-white shadow-2xl z-10 flex flex-col h-full overflow-y-auto animate-slideLeft">
            {/* Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-start justify-between bg-[#FAF7F2]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-[#4338CA]">
                    {projectDetails?.project.project_number}
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {projectDetails?.project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-[#131B2E]">
                  {projectDetails?.project.school_name || 'Loading School Project...'}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Lead Reference: {projectDetails?.project.lead_reference}
                </p>
              </div>

              <button
                onClick={() => setSelectedProjectId(null)}
                className="p-2 text-[#94A3B8] hover:text-[#131B2E] rounded-xl hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Feedback Banner */}
            {actionMsg && (
              <div
                className={`p-4 text-xs font-bold border-b ${
                  actionMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {actionMsg.text}
              </div>
            )}

            {/* Drawer Body */}
            {isDetailsLoading || !projectDetails ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-6 h-6 text-[#4338CA] animate-spin mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">Loading intake details...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6 flex-1 text-xs">
                {/* 1. Onboarding Access Link Card */}
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">
                      School Representative Portal Access
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold">
                      Code: {projectDetails.invitation?.invitation_code}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-800">
                    Share this direct secure invitation link with the school principal or administrator to complete their universal intake:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}/schools/onboarding/portal?project=${projectDetails.project.project_number}`
                          : `/schools/onboarding/portal?project=${projectDetails.project.project_number}`
                      }
                      className="flex-1 px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono text-indigo-950 select-all"
                    />
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/schools/onboarding/portal?project=${projectDetails.project.project_number}`
                        )
                      }
                      className="px-3 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Reviewer Action Station */}
                <div className="p-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4338CA]" />
                    Reviewer Actions
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Approve Button */}
                    <button
                      onClick={handleApprove}
                      disabled={isSubmittingAction || projectDetails.project.status === 'approved' || projectDetails.project.status === 'handed_off'}
                      className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        projectDetails.project.status === 'approved' || projectDetails.project.status === 'handed_off'
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
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
                      className={`p-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        projectDetails.project.status === 'handed_off'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-not-allowed'
                          : !projectDetails.approvedSnapshot
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-xs'
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
                  <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[11px] font-bold text-[#64748B]">
                      Request Changes / Clarifications from School:
                    </span>
                    <div className="flex gap-2">
                      <select
                        value={changeRequestSection}
                        onChange={(e) => setChangeRequestSection(e.target.value)}
                        className="px-2.5 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs font-bold"
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
                        className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl text-xs"
                      />
                      <button
                        onClick={handleRequestChanges}
                        disabled={isSubmittingAction || !changeRequestComment.trim()}
                        className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Media Status Control */}
                <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                      Campus Media Package Workflow
                    </span>
                    <span className="text-[10px] text-[#94A3B8]">
                      14 Structured Asset Folders
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={projectDetails.project.media_status}
                      onChange={(e) => handleUpdateMedia(e.target.value as SchoolMediaStatus)}
                      className="px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl font-bold text-xs"
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#4338CA]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Media Kit Guidelines</span>
                    </a>
                  </div>
                </div>

                {/* 4. Active Change Requests List */}
                {projectDetails.changeRequests.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                      Recorded Change Requests ({projectDetails.changeRequests.length})
                    </h4>
                    <div className="space-y-2">
                      {projectDetails.changeRequests.map((cr) => (
                        <div
                          key={cr.id}
                          className="p-3 bg-orange-50/60 border border-orange-200 rounded-xl space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-orange-900 font-bold capitalize">
                              {cr.section_key}
                            </strong>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                cr.status === 'resolved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-orange-200 text-orange-900'
                              }`}
                            >
                              {cr.status}
                            </span>
                          </div>
                          <p className="text-orange-950">{cr.request_comment}</p>
                          {cr.resolution_notes && (
                            <p className="text-[10px] text-emerald-700 font-medium">
                              ✓ {cr.resolution_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Submitted Intake Payload Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                    Submitted Intake Responses (Version {projectDetails.currentSubmission?.version_number || 1})
                  </h4>

                  {projectDetails.currentSubmission ? (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-[#E2E8F0] space-y-3 font-mono text-[11px] max-h-80 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(projectDetails.currentSubmission.intake_payload, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 text-center bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E2E8F0]">
                      <Clock className="w-6 h-6 text-[#94A3B8] mx-auto mb-2" />
                      <p className="text-xs text-[#64748B]">
                        No intake responses submitted yet. School has been invited.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
