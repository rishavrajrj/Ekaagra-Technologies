'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type {
  SchoolProject,
  SchoolProjectStatus,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  SchoolProjectCustomField,
  SchoolProjectCustomRequirement,
  SchoolApprovedSnapshot,
  SchoolOnboardingInvitation,
} from '@/lib/types';
import {
  approveSchoolProjectAction,
  triggerPlatformHandoffAction,
  requestProjectChangesAction,
  updateMediaStatusAction,
} from '@/app/schoolProjectActions';
import { MEDIA_STATUS_LABELS } from '@/lib/schoolMedia';
import {
  School,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Layers,
  Image,
  MessageSquare,
  ShieldCheck,
  Send,
  Download,
  Share2,
} from 'lucide-react';

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
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Review request form
  const [changeSection, setChangeSection] = useState('schoolProfile');
  const [changeComment, setChangeComment] = useState('');

  const onboardingUrl = invitation?.invitation_code
    ? `/school-onboarding/${invitation.invitation_code}`
    : `/school-onboarding?project=${project.project_number}`;

  const copyOnboardingLink = () => {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl;
    navigator.clipboard.writeText(full);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleApprove = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await approveSchoolProjectAction(project.id);
    if (res.success) {
      setProject((prev) => ({ ...prev, status: 'approved' }));
      setActionMessage({ text: 'School project approved! Ready for platform provisioning.', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Failed to approve project', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleTriggerHandoff = async () => {
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await triggerPlatformHandoffAction(project.id);
    if (res.success) {
      setProject((prev) => ({ ...prev, status: 'handed_off' }));
      setActionMessage({ text: 'Provisioning handoff completed successfully!', type: 'success' });
    } else {
      setActionMessage({ text: res.error || 'Provisioning failed', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const handleRequestChanges = async () => {
    if (!changeComment.trim()) return;
    setIsActionLoading(true);
    setActionMessage(null);
    const res = await requestProjectChangesAction(project.id, changeSection, changeComment.trim());
    if (res.success) {
      setActionMessage({ text: 'Change request submitted and school notified.', type: 'success' });
      setChangeComment('');
      router.refresh();
    } else {
      setActionMessage({ text: res.error || 'Failed to submit change request', type: 'error' });
    }
    setIsActionLoading(false);
  };

  const mediaInfo = MEDIA_STATUS_LABELS[project.media_status] || MEDIA_STATUS_LABELS.not_started;
  const pct = project.completeness_percentage || 0;

  return (
    <div className="eka-content-container space-y-6 min-w-0 pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center justify-between">
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
              <span>School Project</span>
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {project.project_number}
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {project.school_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              {project.city && <span>{project.city}, {project.state || ''} &bull;</span>}
              <span>Contact: {project.primary_contact_name} ({project.primary_contact_email})</span>
              <span>&bull;</span>
              <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">{project.product_id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={copyOnboardingLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied' : 'Copy Onboarding Link'}</span>
            </button>

            <Link
              href={onboardingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <span>Open Onboarding</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {project.status === 'submitted' && (
              <button
                onClick={handleApprove}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Intake</span>
              </button>
            )}

            {(project.status === 'approved' || project.status === 'handoff_ready') && (
              <button
                onClick={handleTriggerHandoff}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trigger Provisioning Handoff</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Status Ribbon (Separating Status from Completeness) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Intake Status</span>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {project.status.replace(/_/g, ' ')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completeness</span>
            <span className="font-mono text-xs font-extrabold text-violet-600 dark:text-violet-400">{pct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-violet-600' : 'bg-amber-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Media Kit Status</span>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${mediaInfo.badgeClass}`}>
              {mediaInfo.label}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Provisioning State</span>
          <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            {project.status === 'handed_off' ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Handed Off</span>
              </span>
            ) : (
              <span className="text-slate-500 text-xs font-medium">Pending Final Approval</span>
            )}
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Overview & Profile
        </button>
        <button
          onClick={() => setActiveTab('intake')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'intake'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Intake Data
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Media & Assets
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'reviews'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Change Requests</span>
          {changeRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {changeRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('provisioning')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'provisioning'
              ? 'bg-violet-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Provisioning Handoff
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" />
                <span>School Profile</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Institution Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{project.school_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Solution Package</span>
                  <span className="font-bold text-violet-700 dark:text-violet-400">{project.product_id}</span>
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
              </div>
            </div>

            {/* Custom Requirements if any */}
            {customRequirements.length > 0 && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Specific School Requirements
                </h3>
                <div className="space-y-2">
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

          <div className="space-y-6">
            {/* Onboarding Invitation Link Card */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-600" />
                <span>Onboarding Workspace</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                School staff use this authenticated URL to input school details, academic schedules, fees, and photo galleries.
              </p>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                {typeof window !== 'undefined' ? `${window.location.origin}${onboardingUrl}` : onboardingUrl}
              </div>
              <button
                onClick={copyOnboardingLink}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {copiedLink ? 'Copied to Clipboard!' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Intake Data */}
      {activeTab === 'intake' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Submitted Intake Responses
          </h3>
          {currentSubmission ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto max-h-[600px]">
              <pre>{JSON.stringify(currentSubmission.intake_payload, null, 2)}</pre>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              No formal intake submission has been recorded by the school staff yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Media & Assets */}
      {activeTab === 'media' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                School Media Assets & Galleries
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current Media Status: <strong className="text-violet-600">{mediaInfo.label}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateMediaStatusAction(project.id, 'approved')}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Approve Media Assets
              </button>
            </div>
          </div>

          <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
            School campus images and branding assets uploaded via the onboarding portal appear in the media registry.
          </div>
        </div>
      )}

      {/* Tab 4: Review Requests */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Request Specific Changes
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Section Requiring Revision
                </label>
                <select
                  value={changeSection}
                  onChange={(e) => setChangeSection(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <option value="schoolProfile">School Profile / General Info</option>
                  <option value="academicDetails">Academic Programs & Streams</option>
                  <option value="admissionInfo">Admission Criteria & Fees</option>
                  <option value="mediaAssets">Media Assets & Photos</option>
                  <option value="leadershipMessage">Principal & Chairman Message</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reviewer Feedback / Missing Information
                </label>
                <textarea
                  rows={4}
                  value={changeComment}
                  onChange={(e) => setChangeComment(e.target.value)}
                  placeholder="Explain exactly what the school administration needs to correct or provide..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs"
                />
              </div>

              <button
                onClick={handleRequestChanges}
                disabled={isActionLoading || !changeComment.trim()}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Change Request</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Change Request History
            </h3>
            <div className="space-y-3">
              {changeRequests.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No change requests recorded.</p>
              ) : (
                changeRequests.map((cr) => (
                  <div key={cr.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-600 uppercase text-[10px]">{cr.section_key}</span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {new Date(cr.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200">{cr.request_comment}</p>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Status: <strong className="uppercase">{cr.status}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Provisioning Handoff */}
      {activeTab === 'provisioning' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Step 41/42 School Platform Provisioning
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated platform tenant compilation and multi-campus sync
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Target Tenant Code:</span>
              <strong className="font-mono text-violet-600">{project.project_number}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Provisioning Status:</span>
              <strong className="uppercase">{project.status === 'handed_off' ? 'Active / Handed Off' : 'Pending Handoff'}</strong>
            </div>
          </div>

          <button
            onClick={handleTriggerHandoff}
            disabled={isActionLoading || project.status === 'handed_off'}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {project.status === 'handed_off' ? 'Platform Already Handed Off' : 'Execute Step 41/42 Provisioning'}
          </button>
        </div>
      )}
    </div>
  );
}
