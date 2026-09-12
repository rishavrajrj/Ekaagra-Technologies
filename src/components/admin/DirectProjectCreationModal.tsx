'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModalPortal from '@/components/ui/ModalPortal';

import type { AcquisitionSource, DirectProjectInput, Lead } from '@/lib/types';
import {
  createDirectProjectAction,
  createBusinessProjectAction,
  fetchUnconvertedLeadsAction,
} from '@/app/businessProjectActions';
import {
  X,
  Plus,
  Globe,
  Phone,
  MessageSquare,
  Users,
  Building,
  UserCheck,
  Footprints,
  Handshake,
  HelpCircle,
  Briefcase,
  School,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Search,
  Loader2,
  Mail,
  DollarSign,
  FileText,
} from 'lucide-react';

interface DirectProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectNumber: string) => void;
}

const ACQUISITION_SOURCES: Array<{
  key: AcquisitionSource;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    key: 'DIRECT_CONTACT',
    label: 'Direct Contact',
    desc: 'Personal outreach, direct inquiry, or meeting',
    icon: UserCheck,
    color: 'border-blue-200 hover:border-blue-400 dark:border-blue-900/50 dark:hover:border-blue-500',
  },
  {
    key: 'WHATSAPP',
    label: 'WhatsApp',
    desc: 'Inquiry received via WhatsApp chat or message',
    icon: MessageSquare,
    color: 'border-emerald-200 hover:border-emerald-400 dark:border-emerald-900/50 dark:hover:border-emerald-500',
  },
  {
    key: 'PHONE',
    label: 'Phone Call',
    desc: 'Inbound phone call or voice discussion',
    icon: Phone,
    color: 'border-cyan-200 hover:border-cyan-400 dark:border-cyan-900/50 dark:hover:border-cyan-500',
  },
  {
    key: 'REFERRAL',
    label: 'Referral',
    desc: 'Referred by a client, colleague, or friend',
    icon: Users,
    color: 'border-purple-200 hover:border-purple-400 dark:border-purple-900/50 dark:hover:border-purple-500',
  },
  {
    key: 'EXISTING_CLIENT',
    label: 'Existing Client',
    desc: 'New project with an existing relationship',
    icon: Building,
    color: 'border-indigo-200 hover:border-indigo-400 dark:border-indigo-900/50 dark:hover:border-indigo-500',
  },
  {
    key: 'WALK_IN',
    label: 'Walk-in',
    desc: 'In-person visit to our Motihari office',
    icon: Footprints,
    color: 'border-amber-200 hover:border-amber-400 dark:border-amber-900/50 dark:hover:border-amber-500',
  },
  {
    key: 'PARTNER',
    label: 'Partner',
    desc: 'Channel partner or agency collaboration',
    icon: Handshake,
    color: 'border-rose-200 hover:border-rose-400 dark:border-rose-900/50 dark:hover:border-rose-500',
  },
  {
    key: 'WEBSITE_LEAD',
    label: 'Website Lead',
    desc: 'Link to an existing website CRM inquiry',
    icon: Globe,
    color: 'border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600',
  },
  {
    key: 'OTHER',
    label: 'Other',
    desc: 'Other acquisition channels or events',
    icon: HelpCircle,
    color: 'border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600',
  },
];

const SERVICE_PRESETS_BUSINESS = [
  'Website Development',
  'E-commerce Portal',
  'Custom Web Application',
  'Mobile App Development',
  'Corporate Rebranding & Website',
  'Software & ERP Development',
  'Other',
];

export default function DirectProjectCreationModal({
  isOpen,
  onClose,
  onProjectCreated,
}: DirectProjectCreationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSource, setSelectedSource] = useState<AcquisitionSource>('DIRECT_CONTACT');
  const projectType = 'BUSINESS';
  const [isPending, startTransition] = useTransition();

  // Website Lead selection state (if source === 'WEBSITE_LEAD')
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Form Fields for Direct Project
  const [formData, setFormData] = useState<{
    organizationName: string;
    primaryContactName: string;
    designation: string;
    email: string;
    phone: string;
    projectName: string;
    serviceType: string;
    customService: string;
    estimatedBudget: string;
    notes: string;
  }>({
    organizationName: '',
    primaryContactName: '',
    designation: '',
    email: '',
    phone: '',
    projectName: '',
    serviceType: 'Website Development',
    customService: '',
    estimatedBudget: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Success State
  const [createdResult, setCreatedResult] = useState<{
    projectId: string;
    projectNumber: string;
    onboardingUrl?: string;
    token?: string;
    isSchool: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // When org name changes, auto-suggest project name if empty
  const handleOrgNameChange = (org: string) => {
    setFormData((prev) => ({
      ...prev,
      organizationName: org,
      projectName:
        !prev.projectName || prev.projectName === `${prev.organizationName} Project` || prev.projectName === `${prev.organizationName} Website`
          ? org.trim() ? `${org.trim()} Website` : ''
          : prev.projectName,
    }));
  };

  // Fetch leads when website lead is picked
  useEffect(() => {
    if (selectedSource === 'WEBSITE_LEAD' && isOpen) {
      setIsLoadingLeads(true);
      fetchUnconvertedLeadsAction(leadSearch).then((res) => {
        setIsLoadingLeads(false);
        if (res.success && res.leads) {
          setLeads(res.leads as Lead[]);
        }
      });
    }
  }, [selectedSource, leadSearch, isOpen]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setSelectedSource('DIRECT_CONTACT');
        setCreatedResult(null);
        setFormErrors({});
        setFormData({
          organizationName: '',
          primaryContactName: '',
          designation: '',
          email: '',
          phone: '',
          projectName: '',
          serviceType: 'Website Development',
          customService: '',
          estimatedBudget: '',
          notes: '',
        });
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization / Company name is required.';
    }
    if (!formData.primaryContactName.trim()) {
      errors.primaryContactName = 'Primary contact name is required.';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Valid contact email is required.';
    }
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errors.phone = 'Valid 10-digit phone number is required.';
    }
    if (!formData.projectName.trim()) {
      errors.projectName = 'Project name is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDirectProject = (action: 'COMPLETE_MYSELF' | 'SEND_INTAKE') => {
    if (!validateForm()) return;

    const finalService =
      formData.serviceType === 'Other' && formData.customService.trim()
        ? formData.customService.trim()
        : formData.serviceType;

    const payload: DirectProjectInput = {
      organizationName: formData.organizationName.trim(),
      primaryContactName: formData.primaryContactName.trim(),
      designation: formData.designation.trim() || undefined,
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      projectName: formData.projectName.trim(),
      projectType,
      serviceType: finalService,
      acquisitionSource: selectedSource,
      estimatedBudget: formData.estimatedBudget.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      initialAction: action,
    };

    startTransition(async () => {
      const res = await createDirectProjectAction(payload);
      if (res.success && res.project) {
        setCreatedResult({
          projectId: res.project.id,
          projectNumber: res.project.project_number,
          onboardingUrl: res.onboardingUrl,
          token: res.token,
          isSchool: false,
        });
        onProjectCreated(res.project.project_number);
      } else {
        alert(res.error || 'Failed to create direct project.');
      }
    });
  };

  const handleConvertWebsiteLead = () => {
    if (!selectedLeadId) return;

    startTransition(async () => {
      const res = await createBusinessProjectAction(selectedLeadId);
      if (res.success && res.project) {
        setCreatedResult({
          projectId: res.project.id,
          projectNumber: res.project.project_number,
          onboardingUrl: res.onboardingUrl,
          token: res.token,
          isSchool: res.project.project_type === 'SCHOOL',
        });
        onProjectCreated(res.project.project_number);
      } else {
        alert(res.error || 'Failed to convert website lead.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-3xl shadow-2xl overflow-hidden my-auto animate-fadeIn flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)]">

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--admin-border)] flex items-center justify-between bg-[var(--admin-surface-secondary)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                New Project Intake
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {createdResult
                  ? 'Project created successfully'
                  : selectedSource === 'WEBSITE_LEAD'
                  ? 'Convert existing website inquiry'
                  : 'Direct intake • No artificial inbound lead created'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progression Bar (if not completed) */}
        {!createdResult && (
          <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                1
              </span>
              <span className={`font-bold ${step === 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                Acquisition Source
              </span>
            </div>
            <div className="w-16 h-[1px] bg-slate-300 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === 2
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                2
              </span>
              <span className={`font-bold ${step === 2 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}>
                Business Project Information
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* SUCCESS SCREEN */}
          {createdResult ? (
            <div className="py-4 space-y-6 text-center animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200 dark:border-indigo-800">
                  {createdResult.projectNumber}
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                  Project Created &amp; Intake Ready!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {formData.organizationName || 'Client'} has been saved as a confirmed project. No inbound lead was duplicated.
                </p>
              </div>

              {/* Secure Intake Link Box */}
              {createdResult.onboardingUrl && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                      Secure Client Intake Link
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      🔒 Token Protected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={
                        typeof window !== 'undefined'
                          ? `${window.location.origin}${createdResult.onboardingUrl}`
                          : createdResult.onboardingUrl
                      }
                      className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 truncate focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const full = `${window.location.origin}${createdResult.onboardingUrl}`;
                        navigator.clipboard.writeText(full);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/admin/business-projects/${createdResult.projectId}`);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-400 dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Open Project Workspace
                </button>

                {createdResult.onboardingUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.open(`${createdResult.onboardingUrl}?mode=admin`, '_blank');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Complete on Behalf</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : step === 1 ? (
            /* ============================================================= */
            /* STEP 1: HOW DID THIS PROJECT COME TO YOU? */
            /* ============================================================= */
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  How did this project come to you?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select the acquisition source. Direct projects create a project record immediately without cluttering the inbound lead pipeline.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {ACQUISITION_SOURCES.map((source) => {
                  const Icon = source.icon;
                  const isSelected = selectedSource === source.key;

                  return (
                    <button
                      key={source.key}
                      type="button"
                      onClick={() => setSelectedSource(source.key)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {source.label}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {source.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* IF WEBSITE LEAD IS PICKED: SHOW LEAD SELECTOR */}
              {selectedSource === 'WEBSITE_LEAD' && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Select Website Lead to Convert:
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {leads.length} Unconverted
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search leads by name, email, organization..."
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {isLoadingLeads ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>Loading website leads...</span>
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No active unconverted leads found.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 divide-y divide-slate-100 dark:divide-slate-800">
                      {leads.map((l) => (
                        <div
                          key={l.id}
                          onClick={() => setSelectedLeadId(l.id)}
                          className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                            selectedLeadId === l.id
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800'
                              : 'hover:bg-white dark:hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {l.organization ? `${l.organization} (${l.name})` : l.name}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {l.email} • {l.phone} • {l.service || l.project_type || 'General'}
                            </div>
                          </div>
                          {selectedLeadId === l.id && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedLeadId && (
                    <button
                      type="button"
                      onClick={handleConvertWebsiteLead}
                      disabled={isPending}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      <span>Convert Selected Lead to Project</span>
                    </button>
                  )}
                </div>
              )}

              {/* Next Button for Direct Sources */}
              {selectedSource !== 'WEBSITE_LEAD' && (
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 text-violet-900 dark:text-violet-300">
                      <School className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                      <div>
                        <p className="font-bold">Need to onboard an educational institution?</p>
                        <p className="text-[11px] text-violet-700 dark:text-violet-400">School portals &amp; ERP suites use the dedicated School Projects pipeline.</p>
                      </div>
                    </div>
                    <Link
                      href="/admin/school-projects"
                      onClick={onClose}
                      className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 ml-2 shadow-xs transition-colors"
                    >
                      <span>School Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Continue to Project Information</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ============================================================= */
            /* STEP 2: BUSINESS PROJECT INFORMATION */
            /* ============================================================= */
            <div className="space-y-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Basic Business &amp; Project Info
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter minimal essentials to create the business project. Full details will be captured through the client intake form.
                </p>
              </div>

              {/* Form Grid */}
              <div className="space-y-3 text-xs">
                {/* Section 1: Client & Org */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Client / Organization
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Organization / Company Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Industrial Solutions"
                        value={formData.organizationName}
                        onChange={(e) => handleOrgNameChange(e.target.value)}
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                          formErrors.organizationName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.organizationName && (
                        <p className="text-[10px] text-rose-500 mt-1">{formErrors.organizationName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Primary Contact Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Raj Kumar"
                        value={formData.primaryContactName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, primaryContactName: e.target.value }))
                        }
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                          formErrors.primaryContactName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.primaryContactName && (
                        <p className="text-[10px] text-rose-500 mt-1">{formErrors.primaryContactName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Managing Director / Founder"
                        value={formData.designation}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, designation: e.target.value }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Contact Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 94724 64645"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                          formErrors.phone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="text-[10px] text-rose-500 mt-1">{formErrors.phone}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Client Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. contact@apexindustrial.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                          formErrors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="text-[10px] text-rose-500 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: Project Info */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Project Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Project Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Industrial Solutions Website"
                        value={formData.projectName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, projectName: e.target.value }))
                        }
                        className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                          formErrors.projectName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {formErrors.projectName && (
                        <p className="text-[10px] text-rose-500 mt-1">{formErrors.projectName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Service Type
                      </label>
                      <select
                        value={formData.serviceType}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, serviceType: e.target.value }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      >
                        {SERVICE_PRESETS_BUSINESS.map((svc) => (
                          <option key={svc} value={svc}>
                            {svc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {formData.serviceType === 'Other' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Specify Service
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Custom CRM Solution"
                          value={formData.customService}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, customService: e.target.value }))
                          }
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Estimated Budget (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹25,000 - ₹50,000"
                        value={formData.estimatedBudget}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, estimatedBudget: e.target.value }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Internal Notes / Initial Scope (Optional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Client requested 5-page clean corporate website with WhatsApp chat button and photo gallery..."
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer order-2 sm:order-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={() => handleCreateDirectProject('COMPLETE_MYSELF')}
                    disabled={isPending}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {isPending ? 'Creating...' : 'Create Project & Complete Myself'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreateDirectProject('SEND_INTAKE')}
                    disabled={isPending}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Create Project &amp; Send Intake</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </ModalPortal>
  );
}

