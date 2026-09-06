'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import type {
  BusinessProject,
  Client,
  BusinessRequirementsData,
  SectionAProfile,
  SectionBProjectType,
  SectionCObjectives,
  SectionDTargetAudience,
  SectionEWebsiteRequirements,
  SectionFFeatures,
  SectionGSystemRequirements,
  SectionHContentAssets,
  SectionIDesignPreferences,
  SectionJDomainHosting,
} from '@/lib/types';
import {
  saveDraftRequirementsAction,
  submitFinalRequirementsAction,
} from '@/app/businessProjectActions';
import Logo from '@/components/ui/Logo';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building,
  Layers,
  Target,
  Users,
  Globe,
  Sliders,
  Cpu,
  FileText,
  Palette,
  Server,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Send,
  Sparkles,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

interface BusinessRequirementsFormProps {
  token: string;
  project: BusinessProject;
  client?: Client;
  initialDraft?: BusinessRequirementsData;
  initialStep?: number;
}

const DEFAULT_SECTIONS: BusinessRequirementsData = {
  section_a_profile: {
    displayName: '',
    category: 'Retail / Business',
    description: '',
    primaryContactName: '',
    email: '',
    phone: '',
    whatsapp: '',
    locations: 'Motihari, Bihar',
  },
  section_b_project_type: {
    primaryType: 'Business Website',
    secondaryTypes: [],
  },
  section_c_objectives: {
    problemToSolve: '',
    primaryGoal: '',
    targetUserRoles: '',
    keyVisitorAction: '',
    successDefinition: '',
  },
  section_d_target_audience: {
    targetCustomerType: 'B2C',
    geographicReach: 'Local & Regional (Bihar)',
    coreCustomerNeeds: '',
  },
  section_e_website_reqs: {
    requiredPages: ['Home Landing Page', 'About Us', 'Services / Products', 'Contact & Inquiries'],
    customPages: [],
    multilingual: false,
    blogOrNews: false,
    galleryNeeded: true,
    careersSection: false,
    testimonialsNeeded: true,
  },
  section_f_features: {
    selectedFeatures: ['Contact Form', 'WhatsApp Chat', 'Mobile Responsive', 'Google Maps Location'],
    contactForm: true,
    whatsAppChat: true,
    googleMaps: true,
    searchFilter: false,
    userAuth: false,
    adminPanel: false,
    cms: false,
    onlineBooking: false,
    paymentGateway: false,
    analyticsSeo: true,
  },
  section_g_system_reqs: {
    userRoles: ['Super Admin', 'Staff Member'],
    adminCapabilities: '',
    authPermissions: '',
  },
  section_h_content_assets: {
    hasLogo: 'YES',
    hasBrandGuidelines: false,
    hasProductOrServicePhotos: 'READY',
    hasWrittenContent: 'READY',
  },
  section_i_design_preferences: {
    styleVibe: 'Modern & Clean',
    preferredColors: '',
    likedWebsites: '',
    dislikedWebsites: '',
  },
  section_j_domain_hosting: {
    hasDomain: 'DECIDE_LATER',
    hasHosting: false,
    hasBusinessEmail: false,
    hasDnsAccess: false,
    migrationNeeded: false,
  },
};

const STEPS = [
  { id: 1, label: 'Profile', icon: Building },
  { id: 2, label: 'Project Type', icon: Layers },
  { id: 3, label: 'Objectives', icon: Target },
  { id: 4, label: 'Audience', icon: Users },
  { id: 5, label: 'Website / Software', icon: Globe },
  { id: 6, label: 'Features', icon: Sliders },
  { id: 7, label: 'Assets', icon: FileText },
  { id: 8, label: 'Design', icon: Palette },
  { id: 9, label: 'Domain', icon: Server },
  { id: 10, label: 'Review & Submit', icon: Sparkles },
];

export default function BusinessRequirementsForm({
  token,
  project,
  client,
  initialDraft,
  initialStep = 1,
}: BusinessRequirementsFormProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<BusinessRequirementsData>(() => ({
    ...DEFAULT_SECTIONS,
    ...initialDraft,
    section_a_profile: {
      ...DEFAULT_SECTIONS.section_a_profile,
      displayName: project.project_name || client?.organization || '',
      primaryContactName: client?.name || '',
      email: client?.email || '',
      phone: client?.phone || '',
      whatsapp: client?.whatsapp || client?.phone || '',
      ...(initialDraft?.section_a_profile || {}),
    },
  }));

  const [customPageInput, setCustomPageInput] = useState('');
  const [isSaving, startSaving] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [clientConfirmed, setClientConfirmed] = useState(false);

  // Auto-save debounced on current step changes
  const saveCurrentProgress = useCallback(
    async (stepToSave = currentStep) => {
      setSaveStatus('saving');
      try {
        const res = await saveDraftRequirementsAction({
          rawToken: token,
          sectionKey: 'full_payload',
          sectionData: formData as unknown as Record<string, unknown>,
          currentStep: stepToSave,
        });

        if (res.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
        }
      } catch {
        setSaveStatus('error');
      }
    },
    [token, currentStep, formData]
  );

  const handleNext = () => {
    const nextStep = Math.min(10, currentStep + 1);
    setCurrentStep(nextStep);
    saveCurrentProgress(nextStep);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handlePrev = () => {
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const handleFinalSubmit = async () => {
    if (!clientConfirmed) {
      setSubmitError('Please check the confirmation box to certify your specifications.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitFinalRequirementsAction({
        rawToken: token,
        payload: formData,
        contactName: formData.section_a_profile.primaryContactName || client?.name || 'Client',
        contactEmail: formData.section_a_profile.email || client?.email || 'client@ekaagra.site',
      });

      if (res.success) {
        setSubmissionSuccess(true);
        window.scrollTo({ top: 80, behavior: 'smooth' });
      } else {
        setSubmitError(res.error || 'Failed to submit requirements. Please verify connection and try again.');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Network error submitting requirements.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Conditionals
  const isSoftwareProject = [
    'Web Application',
    'Custom Software',
    'CRM',
    'ERP',
    'Booking System',
    'Portal',
  ].includes(formData.section_b_project_type.primaryType);

  if (submissionSuccess) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 sm:p-12 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Requirements Received &bull; {project.project_number}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
              Requirements Submitted Successfully!
            </h1>
            <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
              Thank you, <strong>{formData.section_a_profile.primaryContactName}</strong>. Our engineering and design team has received your project specifications for <strong>{project.project_name}</strong>.
            </p>
          </div>

          {/* Next Steps Card */}
          <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] text-left space-y-3">
            <div className="flex items-center gap-2 font-bold text-[#131B2E] text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#F97360]" />
              <span>What Happens Next?</span>
            </div>
            <ul className="text-xs text-[#475569] space-y-2.5 list-disc list-inside leading-relaxed">
              <li>Our design team reviews your branding, pages, and feature preferences.</li>
              <li>We prepare your first custom interactive design concept / prototype.</li>
              <li>You will receive a notification to review, request revisions, or approve the design.</li>
              <li className="font-bold text-emerald-800">
                Zero payment is required today. Payment only becomes due after you inspect and approve your design concept.
              </li>
            </ul>
          </div>

          <div className="pt-2 text-xs text-[#94A3B8]">
            Confirmation has been sent to <strong>{formData.section_a_profile.email}</strong>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Top Banner / Project Header */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Official Business Requirements Form
              </span>
              <span className="text-[10px] font-mono text-slate-500 font-semibold">
                v1.0 &bull; {project.project_number}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#131B2E]">
              {project.project_name}
            </h1>
            <p className="text-xs text-[#64748B]">
              Prepared for {formData.section_a_profile.primaryContactName || client?.name} &bull; {project.service_type}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => saveCurrentProgress(currentStep)}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] bg-[#FAF7F2] transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Progress'}</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[#131B2E] flex items-center gap-1.5">
              <span>Section {currentStep} of 10:</span>
              <span className="text-[#4338CA]">{STEPS[currentStep - 1]?.label}</span>
            </span>
            <span className="font-mono text-xs font-bold text-[#64748B]">
              {Math.round((currentStep / 10) * 100)}% Complete
            </span>
          </div>

          <div className="w-full bg-[#FAF7F2] h-2.5 rounded-full overflow-hidden border border-[#E2E8F0]">
            <div
              className="bg-[#4338CA] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Icons Ribbon */}
        <div className="hidden md:flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isCompleted = s.id < currentStep;
            const isCurrent = s.id === currentStep;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setCurrentStep(s.id);
                  saveCurrentProgress(s.id);
                }}
                className={`flex flex-col items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer p-1.5 rounded-lg ${
                  isCurrent
                    ? 'text-[#4338CA]'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono ${
                    isCurrent
                      ? 'bg-[#4338CA] text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] truncate max-w-[70px]">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Content Container */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-10 shadow-xl space-y-8">
        {/* =================================================================== */}
        {/* STEP 1: Section A - Business Profile */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section A: Business Profile</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Tell us about your organization so we can tailor the voice, branding, and contact channels.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  Brand / Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_a_profile.displayName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, displayName: e.target.value },
                    })
                  }
                  placeholder="e.g. Apex Hospital, Champaran Retailers"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Legal Entity Name (if different)</label>
                <input
                  type="text"
                  value={formData.section_a_profile.legalName || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, legalName: e.target.value },
                    })
                  }
                  placeholder="e.g. Apex Healthcare Pvt. Ltd."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Business Category / Industry</label>
                <select
                  value={formData.section_a_profile.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, category: e.target.value },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                >
                  <option value="Retail / Shop / Commerce">Retail / Shop / Commerce</option>
                  <option value="Healthcare / Clinic / Diagnostic">Healthcare / Clinic / Diagnostic</option>
                  <option value="Education / Training / Academy">Education / Training / Academy</option>
                  <option value="Hotel / Restaurant / Hospitality">Hotel / Restaurant / Hospitality</option>
                  <option value="Real Estate / Construction">Real Estate / Construction</option>
                  <option value="Professional Services / Legal / CA">Professional Services / Legal / CA</option>
                  <option value="Manufacturing / Industrial">Manufacturing / Industrial</option>
                  <option value="Technology / Software / Startup">Technology / Software / Startup</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Short Business Overview / Description</label>
                <textarea
                  rows={3}
                  value={formData.section_a_profile.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, description: e.target.value },
                    })
                  }
                  placeholder="What products or services does your business provide? Who are your primary clients?"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Primary Contact Name</label>
                <input
                  type="text"
                  value={formData.section_a_profile.primaryContactName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, primaryContactName: e.target.value },
                    })
                  }
                  placeholder="Full name"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Official Email</label>
                <input
                  type="email"
                  value={formData.section_a_profile.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, email: e.target.value },
                    })
                  }
                  placeholder="contact@yourbusiness.com"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Phone / WhatsApp</label>
                <input
                  type="text"
                  value={formData.section_a_profile.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: {
                        ...formData.section_a_profile,
                        phone: e.target.value,
                        whatsapp: formData.section_a_profile.whatsapp || e.target.value,
                      },
                    })
                  }
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Locations / City</label>
                <input
                  type="text"
                  value={formData.section_a_profile.locations || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_a_profile: { ...formData.section_a_profile, locations: e.target.value },
                    })
                  }
                  placeholder="e.g. Main Road, Motihari, Bihar"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: Section B - Project Type */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section B: Project Type</h2>
              <p className="text-xs text-[#64748B] mt-1">
                What solution are you looking for? Selecting software vs website adjusts upcoming questions automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Business Website', desc: 'Modern showcase website to capture leads and build brand trust.' },
                { title: 'E-commerce Website', desc: 'Online storefront with catalog, shopping cart, and payments.' },
                { title: 'Web Application', desc: 'Interactive custom cloud app with accounts and dashboards.' },
                { title: 'Custom Software', desc: 'Tailor-made software to automate specific operational workflows.' },
                { title: 'CRM', desc: 'Customer and lead management pipeline for your sales/support team.' },
                { title: 'ERP', desc: 'Comprehensive enterprise system uniting billing, staff, and inventory.' },
                { title: 'Booking System', desc: 'Appointment and slot booking calendar with automated reminders.' },
                { title: 'Portal', desc: 'Dedicated client or vendor login workspace with private data access.' },
                { title: 'Other', desc: 'Unique or hybrid custom technology requirement.' },
              ].map((item) => {
                const isSelected = formData.section_b_project_type.primaryType === item.title;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        section_b_project_type: {
                          ...formData.section_b_project_type,
                          primaryType: item.title as any,
                        },
                      })
                    }
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-[#4338CA]/5 border-[#4338CA] ring-2 ring-[#4338CA]/20 shadow-sm'
                        : 'bg-[#FAF7F2] border-[#E2E8F0] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-[#131B2E]">{item.title}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#4338CA] bg-[#4338CA] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-[#64748B] leading-relaxed">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: Section C - Project Objective */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section C: Project Objective &amp; Goals</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Help us understand the real-world business outcomes this solution must achieve.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  What specific problem should this project solve? <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.section_c_objectives.problemToSolve}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_c_objectives: { ...formData.section_c_objectives, problemToSolve: e.target.value },
                    })
                  }
                  placeholder="e.g. Currently customers call manually on WhatsApp; we lose track of enquiries and have no official presence on Google..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  What is the primary #1 goal of this solution? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_c_objectives.primaryGoal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_c_objectives: { ...formData.section_c_objectives, primaryGoal: e.target.value },
                    })
                  }
                  placeholder="e.g. Generate 50+ inbound customer enquiries each month / Automate billing"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  What action should visitors / users take?
                </label>
                <input
                  type="text"
                  value={formData.section_c_objectives.keyVisitorAction}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_c_objectives: { ...formData.section_c_objectives, keyVisitorAction: e.target.value },
                    })
                  }
                  placeholder="e.g. Click WhatsApp chat / Fill contact form / Register an account / Book a consultation"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  What does success look like 6 months from now?
                </label>
                <input
                  type="text"
                  value={formData.section_c_objectives.successDefinition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_c_objectives: { ...formData.section_c_objectives, successDefinition: e.target.value },
                    })
                  }
                  placeholder="e.g. Top ranking on Google in Motihari / Zero paper records needed"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: Section D - Target Audience */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section D: Target Audience</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Who are we designing and building this for?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Customer Type</label>
                <select
                  value={formData.section_d_target_audience.targetCustomerType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_d_target_audience: {
                        ...formData.section_d_target_audience,
                        targetCustomerType: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                >
                  <option value="B2C">B2C (General Public / Consumers / Patients / Students)</option>
                  <option value="B2B">B2B (Other Businesses / Corporate Clients / Vendors)</option>
                  <option value="B2B_AND_B2C">Both B2B and B2C</option>
                  <option value="INTERNAL_TEAM">Internal Company Staff &amp; Management</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Geographic Reach</label>
                <input
                  type="text"
                  value={formData.section_d_target_audience.geographicReach}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_d_target_audience: {
                        ...formData.section_d_target_audience,
                        geographicReach: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Motihari &amp; North Bihar / All India / Global"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  Core Customer Needs / Motivations
                </label>
                <textarea
                  rows={3}
                  value={formData.section_d_target_audience.coreCustomerNeeds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_d_target_audience: {
                        ...formData.section_d_target_audience,
                        coreCustomerNeeds: e.target.value,
                      },
                    })
                  }
                  placeholder="Why do customers choose you over competitors? Fast service, lower cost, trusted reputation, local availability?"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 5: Section E or G - Website / Software Pages & Roles */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">
                {isSoftwareProject ? 'Section G: Software Architecture & Roles' : 'Section E: Required Pages'}
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                {isSoftwareProject
                  ? 'Define the user types, permissions, and administrative workflows required.'
                  : 'Select the primary pages to be included in your site architecture.'}
              </p>
            </div>

            {!isSoftwareProject ? (
              <div className="space-y-5 text-xs">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider block">
                  Select Required Pages
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    'Home Landing Page',
                    'About Us',
                    'Services',
                    'Products / Catalog',
                    'Contact Us',
                    'Photo Gallery',
                    'Testimonials / Reviews',
                    'FAQ',
                    'Blog / News Updates',
                    'Careers / Jobs',
                    'Privacy Policy & Terms',
                  ].map((page) => {
                    const pages = formData.section_e_website_reqs?.requiredPages || [];
                    const isChecked = pages.includes(page);
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => {
                          const updated = isChecked ? pages.filter((p) => p !== page) : [...pages, page];
                          setFormData({
                            ...formData,
                            section_e_website_reqs: {
                              ...formData.section_e_website_reqs!,
                              requiredPages: updated,
                            },
                          });
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA]'
                            : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        <span>{page}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-[#4338CA]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Page Addition */}
                <div className="pt-2 space-y-2">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider block">Add Custom Pages</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPageInput}
                      onChange={(e) => setCustomPageInput(e.target.value)}
                      placeholder="e.g. Doctor Profiles / Patient Portal Link"
                      className="flex-1 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#131B2E]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPageInput.trim()) {
                          const existing = formData.section_e_website_reqs?.customPages || [];
                          setFormData({
                            ...formData,
                            section_e_website_reqs: {
                              ...formData.section_e_website_reqs!,
                              customPages: [...existing, customPageInput.trim()],
                            },
                          });
                          setCustomPageInput('');
                        }
                      }}
                      className="px-4 py-2 bg-[#131B2E] text-white rounded-xl font-bold text-xs"
                    >
                      Add Page
                    </button>
                  </div>

                  {(formData.section_e_website_reqs?.customPages || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {formData.section_e_website_reqs?.customPages?.map((cp, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <span>{cp}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.section_e_website_reqs?.customPages || []).filter(
                                (_, i) => i !== idx
                              );
                              setFormData({
                                ...formData,
                                section_e_website_reqs: {
                                  ...formData.section_e_website_reqs!,
                                  customPages: updated,
                                },
                              });
                            }}
                            className="text-indigo-400 hover:text-rose-600"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider">User Roles &amp; Permissions</label>
                  <input
                    type="text"
                    value={(formData.section_g_system_reqs?.userRoles || []).join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_g_system_reqs: {
                          ...formData.section_g_system_reqs,
                          userRoles: e.target.value.split(',').map((s) => s.trim()),
                        },
                      })
                    }
                    placeholder="e.g. Super Admin, Store Manager, Customer, Accountant"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider">Admin Dashboard Requirements</label>
                  <textarea
                    rows={3}
                    value={formData.section_g_system_reqs?.adminCapabilities || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_g_system_reqs: {
                          ...formData.section_g_system_reqs,
                          adminCapabilities: e.target.value,
                        },
                      })
                    }
                    placeholder="What must the admin see? Daily revenue charts, order status updates, staff management, inventory alerts?"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider">Reports &amp; Export Requirements</label>
                  <input
                    type="text"
                    value={formData.section_g_system_reqs?.reportingNeeds || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_g_system_reqs: {
                          ...formData.section_g_system_reqs,
                          reportingNeeds: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. Monthly GST invoice PDF downloads, Excel export of customer list"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 6: Section F - Features & Integrations */}
        {/* =================================================================== */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section F: Features &amp; Integrations</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Select the interactive features and communication modules you want built.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {[
                { key: 'whatsAppChat', label: '1-Click WhatsApp Chat', desc: 'Direct chat button with pre-filled message.' },
                { key: 'contactForm', label: 'Contact & Lead Capture Form', desc: 'Email alerts and CRM lead storage.' },
                { key: 'googleMaps', label: 'Google Maps Location Embed', desc: 'Interactive pin for local store visits.' },
                { key: 'analyticsSeo', label: 'Google Analytics & Local SEO', desc: 'Structured schema and visitor metrics.' },
                { key: 'searchFilter', label: 'Live Search & Filter', desc: 'Instant search across products or services.' },
                { key: 'onlineBooking', label: 'Appointment / Slot Booking', desc: 'Calendar reservation system.' },
                { key: 'paymentGateway', label: 'Online Payment (Razorpay/UPI)', desc: 'Accept cards, UPI, net banking.' },
                { key: 'userAuth', label: 'User Accounts / Login', desc: 'Sign up, password reset, profile area.' },
                { key: 'cms', label: 'Content Management (CMS)', desc: 'Self-manage blogs, notices, and photos.' },
              ].map((f) => {
                const isChecked = (formData.section_f_features as any)[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        section_f_features: {
                          ...formData.section_f_features,
                          [f.key]: !isChecked,
                        },
                      });
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                      isChecked
                        ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#131B2E]'
                        : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    <div className="flex items-center justify-between font-extrabold text-xs">
                      <span>{f.label}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isChecked ? 'bg-[#4338CA] border-[#4338CA] text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-[#64748B]">{f.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <label className="font-bold text-[#131B2E] uppercase tracking-wider">Any Special Custom Features?</label>
              <textarea
                rows={2}
                value={formData.section_f_features.customFeatures || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    section_f_features: { ...formData.section_f_features, customFeatures: e.target.value },
                  })
                }
                placeholder="Explain any custom calculation, SMS alert integration, or specific workflow needed..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 7: Section H - Content & Assets */}
        {/* =================================================================== */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section H: Content &amp; Assets Readiness</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Tell us what branding assets you have ready. If you need help creating a logo or copywriting, let us know!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Do you have a Logo?</label>
                <select
                  value={formData.section_h_content_assets.hasLogo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_h_content_assets: {
                        ...formData.section_h_content_assets,
                        hasLogo: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                >
                  <option value="YES">Yes, we have high-resolution logo files ready</option>
                  <option value="NEEDS_REDESIGN">We have an old logo but want a modern redesign</option>
                  <option value="NO">No, we need Ekaagra to design a new brand logo</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Photos / Videos</label>
                <select
                  value={formData.section_h_content_assets.hasProductOrServicePhotos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_h_content_assets: {
                        ...formData.section_h_content_assets,
                        hasProductOrServicePhotos: e.target.value as any,
                      },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                >
                  <option value="READY">Ready (we will provide high-res photos)</option>
                  <option value="PARTIAL">Partial (some photos ready, need stock images)</option>
                  <option value="NEED_HELP">Need help / Use licensed professional stock photography</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">
                  Links to Existing Assets (Google Drive / Dropbox / Website)
                </label>
                <input
                  type="url"
                  value={(formData.section_h_content_assets.uploadedAssetUrls || []).join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_h_content_assets: {
                        ...formData.section_h_content_assets,
                        uploadedAssetUrls: e.target.value.split(',').map((s) => s.trim()),
                      },
                    })
                  }
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Additional Content Notes</label>
                <textarea
                  rows={2}
                  value={formData.section_h_content_assets.contentNotes || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_h_content_assets: {
                        ...formData.section_h_content_assets,
                        contentNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. We have a printed brochure we can WhatsApp over..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 8: Section I - Design Preferences */}
        {/* =================================================================== */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section I: Design Preferences &amp; Aesthetics</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Tell us about your visual taste. Our design team uses this to create your bespoke concept.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider block">Visual Tone &amp; Vibe</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    'Modern & Clean',
                    'Corporate & Prestigious',
                    'Minimalist',
                    'Bold & Vibrant',
                    'Luxury & Premium',
                    'Friendly & Warm',
                  ].map((vibe) => {
                    const isSelected = formData.section_i_design_preferences.styleVibe === vibe;
                    return (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            section_i_design_preferences: {
                              ...formData.section_i_design_preferences,
                              styleVibe: vibe as any,
                            },
                          })
                        }
                        className={`p-3 rounded-xl border font-bold text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA]'
                            : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#334155]'
                        }`}
                      >
                        <span>{vibe}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#4338CA]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Preferred Brand Colors</label>
                <input
                  type="text"
                  value={formData.section_i_design_preferences.preferredColors || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_i_design_preferences: {
                        ...formData.section_i_design_preferences,
                        preferredColors: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Navy Blue &amp; Gold / Emerald Green &amp; Slate White"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Websites You Like (Inspiration URLs)</label>
                <input
                  type="text"
                  value={formData.section_i_design_preferences.likedWebsites || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_i_design_preferences: {
                        ...formData.section_i_design_preferences,
                        likedWebsites: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. apple.com, stripe.com, competitor.com"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Websites You Dislike (What to avoid)</label>
                <input
                  type="text"
                  value={formData.section_i_design_preferences.dislikedWebsites || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_i_design_preferences: {
                        ...formData.section_i_design_preferences,
                        dislikedWebsites: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g. Avoid cluttered text, pop-up ads, dark background..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                />
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 9: Section J - Domain & Hosting */}
        {/* =================================================================== */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Section J: Domain &amp; Online Infrastructure</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Let us know about your website address (domain) and server hosting preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Do you already own a domain?</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { val: 'YES', label: 'Yes, we own a domain' },
                    { val: 'NO', label: 'No, need a new domain' },
                    { val: 'DECIDE_LATER', label: 'Help me choose later' },
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          section_j_domain_hosting: {
                            ...formData.section_j_domain_hosting,
                            hasDomain: d.val as any,
                          },
                        })
                      }
                      className={`p-3 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                        formData.section_j_domain_hosting.hasDomain === d.val
                          ? 'bg-[#4338CA]/10 border-[#4338CA] text-[#4338CA]'
                          : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.section_j_domain_hosting.hasDomain === 'YES' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider">Existing Domain Name</label>
                  <input
                    type="text"
                    value={formData.section_j_domain_hosting.existingDomain || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_j_domain_hosting: {
                          ...formData.section_j_domain_hosting,
                          existingDomain: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. apexhospital.com"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] font-mono"
                  />
                </div>
              )}

              {formData.section_j_domain_hosting.hasDomain === 'NO' && (
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-bold text-[#131B2E] uppercase tracking-wider">Preferred New Domain Name</label>
                  <input
                    type="text"
                    value={formData.section_j_domain_hosting.preferredNewDomain || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        section_j_domain_hosting: {
                          ...formData.section_j_domain_hosting,
                          preferredNewDomain: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g. champaranretailers.in"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E] font-mono"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">Business Email Needed?</label>
                <select
                  value={formData.section_j_domain_hosting.hasBusinessEmail ? 'YES' : 'NO'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_j_domain_hosting: {
                        ...formData.section_j_domain_hosting,
                        hasBusinessEmail: e.target.value === 'YES',
                      },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                >
                  <option value="YES">Yes, create business email (info@yourcompany.com)</option>
                  <option value="NO">No, standard email is fine</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#131B2E] uppercase tracking-wider">DNS Management Access</label>
                <select
                  value={formData.section_j_domain_hosting.hasDnsAccess ? 'YES' : 'NO'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      section_j_domain_hosting: {
                        ...formData.section_j_domain_hosting,
                        hasDnsAccess: e.target.value === 'YES',
                      },
                    })
                  }
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-[#131B2E]"
                >
                  <option value="YES">Yes, we have login credentials for domain registrar</option>
                  <option value="NO">No / Need Ekaagra to configure DNS</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 10: Review & Submit */}
        {/* =================================================================== */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-[#131B2E]">Review Your Requirements</h2>
              <p className="text-xs text-[#64748B] mt-1">
                Inspect your specifications before final submission to Ekaagra&apos;s central engineering registry.
              </p>
            </div>

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Profile Review */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 font-bold text-[#131B2E]">
                  <span>Business Profile</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[#4338CA] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#64748B]">
                  <div>Brand: <strong className="text-[#131B2E]">{formData.section_a_profile.displayName}</strong></div>
                  <div>Category: <strong className="text-[#131B2E]">{formData.section_a_profile.category}</strong></div>
                  <div>Contact: <strong className="text-[#131B2E]">{formData.section_a_profile.primaryContactName}</strong></div>
                  <div>Phone: <strong className="font-mono text-[#131B2E]">{formData.section_a_profile.phone}</strong></div>
                </div>
              </div>

              {/* Solution & Objectives */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 font-bold text-[#131B2E]">
                  <span>Solution &amp; Objectives</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[#4338CA] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1 text-[#64748B]">
                  <div>Type: <strong className="text-[#4338CA]">{formData.section_b_project_type.primaryType}</strong></div>
                  <div>Problem: <strong className="text-[#131B2E]">{formData.section_c_objectives.problemToSolve || 'Not specified'}</strong></div>
                  <div>Primary Goal: <strong className="text-[#131B2E]">{formData.section_c_objectives.primaryGoal || 'Not specified'}</strong></div>
                </div>
              </div>

              {/* Pages & Features */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 font-bold text-[#131B2E]">
                  <span>Pages &amp; Interactive Features</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[#4338CA] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-1.5 text-[#64748B]">
                  {!isSoftwareProject && (
                    <div>
                      Pages ({formData.section_e_website_reqs?.requiredPages.length}):{' '}
                      <span className="text-[#131B2E] font-medium">
                        {formData.section_e_website_reqs?.requiredPages.join(', ')}
                      </span>
                    </div>
                  )}
                  <div>
                    Style Tone: <strong className="text-[#131B2E]">{formData.section_i_design_preferences.styleVibe}</strong>
                  </div>
                </div>
              </div>

              {/* Reassurance Callout */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Ekaagra Zero-Risk Design Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900">
                  Submitting this form initiates your design phase. You will inspect your custom design concept first. No payment is due until you approve the design.
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={clientConfirmed}
                  onChange={(e) => setClientConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#4338CA] rounded border-slate-300 focus:ring-[#4338CA]"
                />
                <span className="text-xs text-[#131B2E] font-semibold leading-relaxed">
                  I confirm these specifications accurately represent our requirements. I understand Ekaagra will review and prepare our initial design concept.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 1 || isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer"
            >
              <span>Save &amp; Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting || !clientConfirmed}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Requirements...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Requirements for Review</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
