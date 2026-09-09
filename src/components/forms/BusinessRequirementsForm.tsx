'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  BusinessProject,
  Client,
  BusinessRequirementsData,
  BusinessRequirementAsset,
  BusinessAssetCategory,
} from '@/lib/types';
import {
  saveDraftRequirementsAction,
  submitFinalRequirementsAction,
  deleteBusinessProjectAssetAction,
} from '@/app/businessProjectActions';
import { validateBusinessRequirementsPayload, sanitizeWebUrl } from '@/lib/businessValidation';
import {
  Building2,
  Target,
  Palette,
  Globe,
  UploadCloud,
  Sliders,
  Cpu,
  Server,
  DollarSign,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  HelpCircle,
  Info,
} from 'lucide-react';

interface BusinessRequirementsFormProps {
  token: string;
  project: BusinessProject;
  client?: Client;
  initialDraft?: BusinessRequirementsData;
  initialStep?: number;
  isAdminMode?: boolean;
}

const DEFAULT_SECTIONS: BusinessRequirementsData = {
  section_a_profile: {
    displayName: '',
    legalName: '',
    category: 'Retail / Commercial Business',
    description: '',
    locations: 'Motihari, Bihar',
    primaryContactName: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
  },
  section_b_goals_audience: {
    primaryType: 'Business Website',
    secondaryTypes: [],
    primaryGoal: 'Generate local customer leads & inquiries',
    problemToSolve: '',
    targetCustomerType: 'B2C',
    targetAudienceDescription: '',
    geographicReach: 'Local & Regional (Bihar)',
    keyVisitorAction: 'Call / WhatsApp or fill Contact Form',
    successDefinition: '',
  },
  section_c_design: {
    styleVibe: 'Modern & Clean',
    preferredColors: '',
    avoidColors: '',
    likedWebsites: '',
    dislikedWebsites: '',
    competitorWebsites: '',
    designConstraintsOrRules: '',
  },
  section_d_structure: {
    solutionType: 'WEBSITE',
    requiredPages: ['Home Landing Page', 'About Company', 'Products / Services', 'Contact & Inquiries'],
    customPages: [],
    multilingual: false,
    blogOrNews: false,
    galleryNeeded: true,
    careersSection: false,
    testimonialsNeeded: true,
  },
  section_e_assets: {
    hasLogo: 'YES',
    hasBrandGuidelines: false,
    hasProductOrServicePhotos: 'READY',
    hasWrittenContent: 'READY',
    uploadedAssets: [],
    contentNotes: '',
  },
  section_f_features: {
    selectedFeatures: ['Contact Form', 'WhatsApp Chat Button', 'Mobile Responsive Layout', 'Google Maps Location'],
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
    notificationsSmsEmail: false,
  },
  section_g_integrations: {
    paymentGatewayNeeded: false,
    preferredPaymentGateway: 'RAZORPAY',
    whatsappApiNeeded: true,
    crmIntegration: '',
    thirdPartyApis: '',
  },
  section_h_domain_hosting: {
    hasDomain: 'DECIDE_LATER',
    existingDomain: '',
    preferredNewDomain: '',
    hasHosting: false,
    hostingPreference: 'MANAGED_BY_EKAAGRA',
    hasBusinessEmail: false,
    hasDnsAccess: false,
    migrationNeeded: false,
    sslCertificateNeeded: true,
  },
  section_i_budget_timeline: {
    targetBudgetRange: '₹20,000 - ₹50,000',
    timelineRequirement: 'ONE_TO_TWO_MONTHS',
    hardDeadlinesOrConstraints: '',
  },
  section_j_agreement: {
    confirmedAccurate: false,
    authorizedSignatoryName: '',
    notesForEkaagraTeam: '',
  },
};

export function isSchoolProjectCheck(project: BusinessProject, client?: Client | null): boolean {
  if (project.project_type === 'SCHOOL') return true;
  const combined = [
    project.project_name,
    project.service_type,
    client?.organization,
    (project.metadata as any)?.initialBudget,
    (project.metadata as any)?.originalDescription,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    combined.includes('school') ||
    combined.includes('academy') ||
    combined.includes('vidyalaya') ||
    combined.includes('institution') ||
    combined.includes('cbse') ||
    combined.includes('icse') ||
    combined.includes('convent') ||
    combined.includes('matriculation')
  );
}

export function getInitialSchoolBudget(project: BusinessProject): string {
  const metadataBudget = (project.metadata as any)?.initialBudget;
  if (metadataBudget && typeof metadataBudget === 'string' && metadataBudget.includes('₹')) {
    return metadataBudget;
  }
  const svc = (project.service_type || '').toLowerCase();
  if (svc.includes('complete') || (svc.includes('cms') && svc.includes('erp'))) {
    return '₹39,999 - ₹74,999 (Website + CMS + ERP)';
  } else if (svc.includes('erp')) {
    return '₹24,999 - ₹49,999 (School ERP)';
  } else if (svc.includes('cms')) {
    return '₹16,999 (School Website + CMS)';
  } else if (svc.includes('school')) {
    return '₹9,999 (School Website)';
  }
  return '₹16,999 (School Website + CMS)';
}

const getSteps = (isSchool: boolean) => [
  { id: 1, label: isSchool ? 'School Profile' : 'Company Profile', icon: Building2, desc: isSchool ? 'Campus & contacts' : 'Brand & contacts' },
  { id: 2, label: isSchool ? 'Goals & Students' : 'Goals & Audience', icon: Target, desc: isSchool ? 'Objectives & students' : 'Objectives & users' },
  { id: 3, label: 'Design & Visuals', icon: Palette, desc: 'Aesthetic & colors' },
  { id: 4, label: 'Structure & Pages', icon: Globe, desc: 'Site architecture' },
  { id: 5, label: 'Content & Assets', icon: UploadCloud, desc: isSchool ? 'Prospectus & files' : 'Files & materials' },
  { id: 6, label: 'Key Features', icon: Sliders, desc: 'Functionality' },
  { id: 7, label: 'Integrations & Tech', icon: Cpu, desc: 'APIs & systems' },
  { id: 8, label: 'Domain & Hosting', icon: Server, desc: 'Infrastructure' },
  { id: 9, label: 'Budget & Timeline', icon: DollarSign, desc: isSchool ? 'School plan' : 'Constraints' },
  { id: 10, label: 'Review & Submit', icon: Sparkles, desc: 'Finalize intake' },
];

export default function BusinessRequirementsForm({
  token,
  project,
  client,
  initialDraft,
  initialStep = 1,
  isAdminMode = false,
}: BusinessRequirementsFormProps) {
  const isInitialSchool = isSchoolProjectCheck(project, client);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formData, setFormData] = useState<BusinessRequirementsData>(() => {
    const base: BusinessRequirementsData = {
      ...DEFAULT_SECTIONS,
      ...initialDraft,
      section_a_profile: {
        ...DEFAULT_SECTIONS.section_a_profile,
        displayName: project.project_name || client?.organization || '',
        primaryContactName: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        whatsapp: client?.whatsapp || client?.phone || '',
        locations: client?.city || 'Motihari, Bihar',
        category:
          initialDraft?.section_a_profile?.category ||
          (isInitialSchool ? 'K-12 School / CBSE / ICSE / State Board' : DEFAULT_SECTIONS.section_a_profile.category),
        ...(initialDraft?.section_a_profile || {}),
      },
      section_b_goals_audience: {
        ...DEFAULT_SECTIONS.section_b_goals_audience,
        primaryType:
          initialDraft?.section_b_goals_audience?.primaryType ||
          (isInitialSchool
            ? project.service_type?.toLowerCase().includes('erp')
              ? 'School ERP'
              : project.service_type?.toLowerCase().includes('cms')
              ? 'School Website + CMS'
              : 'School Website'
            : DEFAULT_SECTIONS.section_b_goals_audience.primaryType),
        primaryGoal:
          initialDraft?.section_b_goals_audience?.primaryGoal ||
          (isInitialSchool
            ? 'Showcase school achievements, satisfy CBSE mandatory disclosures, and streamline online admissions'
            : DEFAULT_SECTIONS.section_b_goals_audience.primaryGoal),
        keyVisitorAction:
          initialDraft?.section_b_goals_audience?.keyVisitorAction ||
          (isInitialSchool
            ? 'Submit Admission Inquiry / Download Prospectus or Contact Campus'
            : DEFAULT_SECTIONS.section_b_goals_audience.keyVisitorAction),
        ...(initialDraft?.section_b_goals_audience || {}),
      },
      section_d_structure: {
        ...DEFAULT_SECTIONS.section_d_structure,
        requiredPages:
          initialDraft?.section_d_structure?.requiredPages && initialDraft.section_d_structure.requiredPages.length > 0
            ? initialDraft.section_d_structure.requiredPages
            : isInitialSchool
            ? [
                'Home Landing Page',
                'About School & Management',
                'Principal Message',
                'Mandatory Public Disclosure (CBSE)',
                'Academics & Curriculum',
                'Admissions & Inquiries',
                'Photo & Event Gallery',
                'Notices & Circulars',
              ]
            : DEFAULT_SECTIONS.section_d_structure.requiredPages,
        ...(initialDraft?.section_d_structure || {}),
      },
      section_i_budget_timeline: {
        ...DEFAULT_SECTIONS.section_i_budget_timeline,
        targetBudgetRange:
          initialDraft?.section_i_budget_timeline?.targetBudgetRange &&
          !['₹15,000 - ₹30,000', '₹20,000 - ₹50,000'].includes(initialDraft.section_i_budget_timeline.targetBudgetRange)
            ? initialDraft.section_i_budget_timeline.targetBudgetRange
            : isInitialSchool
            ? getInitialSchoolBudget(project)
            : DEFAULT_SECTIONS.section_i_budget_timeline.targetBudgetRange,
        ...(initialDraft?.section_i_budget_timeline || {}),
      },
    };
    return base;
  });

  const isSchoolProject =
    isInitialSchool ||
    formData.section_a_profile.category === 'Coaching / Institute / Education' ||
    Boolean(formData.section_a_profile.category?.includes('School'));

  const steps = getSteps(isSchoolProject);

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'offline' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submissionInfo, setSubmissionInfo] = useState<{ projectNumber?: string; projectName?: string }>({});

  // Asset Upload States
  const [uploadedAssets, setUploadedAssets] = useState<BusinessRequirementAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<BusinessAssetCategory>('LOGO');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom page input
  const [customPageInput, setCustomPageInput] = useState('');

  // Local Storage Key
  const localStorageKey = `ekaagra_reqs_draft_${token}`;

  // 1. Load Local Storage backup if newer
  useEffect(() => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      }
    } catch {
      // Ignore local storage parse issues
    }
  }, [localStorageKey]);

  // Migrate legacy generic business values to school plan if project is school
  useEffect(() => {
    if (isSchoolProject) {
      const currentBudget = formData.section_i_budget_timeline.targetBudgetRange;
      if (
        !currentBudget ||
        currentBudget === '₹15,000 - ₹30,000' ||
        currentBudget === '₹20,000 - ₹50,000' ||
        currentBudget.includes('Starter Business Website')
      ) {
        const suggested = getInitialSchoolBudget(project);
        setFormData((prev) => ({
          ...prev,
          section_i_budget_timeline: {
            ...prev.section_i_budget_timeline,
            targetBudgetRange: suggested,
          },
        }));
      }

      const currentType = formData.section_b_goals_audience.primaryType;
      if (currentType === 'Business Website') {
        const suggestedType = project.service_type?.toLowerCase().includes('erp')
          ? 'School ERP'
          : project.service_type?.toLowerCase().includes('cms')
          ? 'School Website + CMS'
          : 'School Website';
        setFormData((prev) => ({
          ...prev,
          section_b_goals_audience: {
            ...prev.section_b_goals_audience,
            primaryType: suggestedType,
          },
        }));
      }
    }
  }, [isSchoolProject, project]);

  // 2. Fetch already uploaded assets for this project
  useEffect(() => {
    async function loadAssets() {
      try {
        const res = await fetch(`/api/business-assets/upload?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.assets)) {
            setUploadedAssets(data.assets);
          }
        }
      } catch {
        // Non-fatal asset fetch
      }
    }
    loadAssets();
  }, [token]);

  // 3. Debounced Autosave (1500ms)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAutosave = useCallback(
    (updatedData: BusinessRequirementsData, step: number) => {
      // Local backup immediately
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(updatedData));
      } catch {
        // Non-fatal
      }

      setSaveStatus('saving');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const res = await saveDraftRequirementsAction({
            rawToken: token,
            sectionKey: 'full_payload',
            sectionData: updatedData as unknown as Record<string, unknown>,
            currentStep: step,
            actorType: isAdminMode ? 'ADMIN' : 'CLIENT',
            adminName: isAdminMode ? 'Ekaagra Operations Admin' : undefined,
          });

          if (res.success) {
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
          } else {
            setSaveStatus('offline');
          }
        } catch {
          setSaveStatus('offline');
        }
      }, 1500);
    },
    [token, localStorageKey]
  );

  // Update Section Helper
  const updateSection = <K extends keyof BusinessRequirementsData>(
    sectionKey: K,
    patch: Partial<BusinessRequirementsData[K]>
  ) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [sectionKey]: {
          ...(prev[sectionKey] || {}),
          ...patch,
        },
      };
      triggerAutosave(updated, currentStep);
      return updated;
    });
  };

  // Step Validation
  const validateStep = (stepNumber: number): boolean => {
    const errors: Record<string, string> = {};

    if (stepNumber === 1) {
      const a = formData.section_a_profile;
      if (!a.displayName?.trim() || a.displayName.trim().length < 2) {
        errors['displayName'] = 'Brand / Business Name is required (minimum 2 characters).';
      }
      if (!a.primaryContactName?.trim() || a.primaryContactName.trim().length < 2) {
        errors['primaryContactName'] = 'Contact person name is required.';
      }
      if (!a.email?.trim() || !/^\S+@\S+\.\S+$/.test(a.email.trim())) {
        errors['email'] = 'A valid email address is required.';
      }
      const cleanPhone = (a.phone || '').replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 10) {
        errors['phone'] = 'A valid 10-digit phone number is required.';
      }
    }

    if (stepNumber === 2) {
      const b = formData.section_b_goals_audience;
      if (!b.primaryType) {
        errors['primaryType'] = 'Please select a primary solution type.';
      }
      if (!b.primaryGoal?.trim() || b.primaryGoal.trim().length < 5) {
        errors['primaryGoal'] = 'Please specify your primary goal (minimum 5 characters).';
      }
      if (!b.problemToSolve?.trim() || b.problemToSolve.trim().length < 10) {
        errors['problemToSolve'] = 'Please describe the core business challenge or problem to solve (minimum 10 characters).';
      }
    }

    if (stepNumber === 4) {
      const d = formData.section_d_structure;
      if (!d.requiredPages || d.requiredPages.length === 0) {
        errors['requiredPages'] = 'Please select at least one required page or section.';
      }
    }

    if (stepNumber === 9) {
      const i = formData.section_i_budget_timeline;
      if (!i.targetBudgetRange) {
        errors['targetBudgetRange'] = 'Please select a target budget range.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    const next = Math.min(10, currentStep + 1);
    setCurrentStep(next);
    triggerAutosave(formData, next);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handlePrev = () => {
    const prev = Math.max(1, currentStep - 1);
    setCurrentStep(prev);
    triggerAutosave(formData, prev);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // Final Submit Handler
  const handleFinalSubmit = async () => {
    if (!formData.section_j_agreement.confirmedAccurate) {
      setSubmitError('Please check the confirmation box to certify your specifications.');
      return;
    }
    if (!formData.section_j_agreement.authorizedSignatoryName?.trim()) {
      setSubmitError('Please enter the name of the authorized representative submitting this form.');
      return;
    }

    // Run authoritative validation
    const val = validateBusinessRequirementsPayload(formData);
    if (!val.isValid) {
      const errList = Object.values(val.errors).join(' ');
      setSubmitError(`Please complete all required fields: ${errList}`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitFinalRequirementsAction({
        rawToken: token,
        payload: formData,
        contactName: formData.section_j_agreement.authorizedSignatoryName || formData.section_a_profile.primaryContactName,
        contactEmail: formData.section_a_profile.email,
        actorType: isAdminMode ? 'ADMIN' : 'CLIENT',
        adminName: isAdminMode ? 'Ekaagra Operations Admin' : undefined,
      });

      if (res.success) {
        setSubmissionInfo({
          projectNumber: res.projectNumber || project.project_number,
          projectName: res.projectName || project.project_name,
        });
        setSubmissionSuccess(true);
        // Clear local storage draft upon successful final submission
        try {
          localStorage.removeItem(localStorageKey);
        } catch {
          // Non-fatal
        }
        window.scrollTo({ top: 60, behavior: 'smooth' });
      } else {
        setSubmitError(res.error || 'Failed to submit requirements. Please try again.');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Network error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asset Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');

    try {
      const uploadData = new FormData();
      uploadData.append('token', token);
      uploadData.append('file', file);
      uploadData.append('category', uploadCategory);

      const res = await fetch('/api/business-assets/upload', {
        method: 'POST',
        body: uploadData,
      });

      const json = await res.json();
      if (json.success && json.asset) {
        const newAsset = json.asset as BusinessRequirementAsset;
        const updated = [newAsset, ...uploadedAssets];
        setUploadedAssets(updated);

        // Update form state
        const currentUrls = formData.section_e_assets.uploadedAssetUrls || [];
        updateSection('section_e_assets', {
          uploadedAssetUrls: [...currentUrls, newAsset.file_url],
        });
      } else {
        setUploadError(json.error || 'File upload failed.');
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Network error during upload.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm('Are you sure you want to remove this file?')) return;
    setDeletingAssetId(assetId);
    try {
      const res = await deleteBusinessProjectAssetAction({
        rawToken: token,
        assetId,
      });
      if (res.success) {
        setUploadedAssets((prev) => prev.filter((a) => a.id !== assetId));
      } else {
        alert(res.error || 'Failed to remove file.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error removing file.');
    } finally {
      setDeletingAssetId(null);
    }
  };

  // Add Custom Page
  const handleAddCustomPage = () => {
    if (!customPageInput.trim()) return;
    const current = formData.section_d_structure.customPages || [];
    if (!current.includes(customPageInput.trim())) {
      updateSection('section_d_structure', {
        customPages: [...current, customPageInput.trim()],
      });
    }
    setCustomPageInput('');
  };

  const handleRemoveCustomPage = (pageName: string) => {
    const current = formData.section_d_structure.customPages || [];
    updateSection('section_d_structure', {
      customPages: current.filter((p) => p !== pageName),
    });
  };

  // Check for Clarification Request
  const isClarification = project.project_status === 'CLARIFICATION_REQUESTED';

  // ---------------------------------------------------------------------------
  // SUBMISSION SUCCESS VIEW
  // ---------------------------------------------------------------------------
  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="p-8 sm:p-12 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
            <Check className="w-9 h-9 stroke-[3]" />
          </div>

          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Snapshot Verified &bull; {submissionInfo.projectNumber}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-[#131B2E]">
            Requirements Submitted Successfully!
          </h1>

          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-md mx-auto">
            Thank you, <strong>{formData.section_a_profile.displayName}</strong>. Your detailed project specifications have been securely recorded into an immutable version snapshot for engineering review.
          </p>

          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-left space-y-2.5">
            <div className="font-bold text-[#131B2E] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>What Happens Next (Zero Upfront Payment Guarantee)</span>
            </div>
            <ul className="text-[#64748B] space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li>
                <strong>1. Engineering Review:</strong> Our team reviews your requirements and clarifies any technical or architecture questions.
              </li>
              <li>
                <strong>2. Initial Custom Design Concept:</strong> We craft your custom interactive prototype and layout mockups.
              </li>
              <li>
                <strong>3. Client Review &amp; Approval:</strong> You inspect the design. You may request revisions until you are 100% satisfied.
              </li>
              <li>
                <strong>4. Milestone Invoice:</strong> Only AFTER you approve the design concept will the initial milestone payment link be issued.
              </li>
            </ul>
          </div>

          <div className="pt-2 text-[11px] text-[#94A3B8]">
            Confirmation email sent to <strong>{formData.section_a_profile.email}</strong>. Our team in Motihari is on standby.
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN INTAKE FORM VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-4 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {project.project_number} &bull; {isSchoolProject ? 'School Project Workspace' : 'Business Project Workspace'}
            </span>
            <h1 className="text-lg sm:text-2xl font-black text-[#131B2E]">
              {formData.section_a_profile.displayName || project.project_name}
            </h1>
          </div>

          {/* Real-time Save Indicator & Step Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            {saveStatus === 'saving' && (
              <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Cloud Synced
              </span>
            )}
            {saveStatus === 'offline' && (
              <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1" title="Saved to local device cache">
                <Clock className="w-3.5 h-3.5" /> Saved Locally
              </span>
            )}
            <span className="text-xs font-mono font-bold text-[#4338CA] bg-indigo-50 px-2.5 py-1 rounded-lg">
              Step {currentStep} of 10
            </span>
          </div>
        </div>

        {/* Admin On-Behalf Mode Banner */}
        {isAdminMode && (
          <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-300 text-xs text-purple-950 space-y-1 animate-fadeIn">
            <div className="font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-purple-900">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin Mode: Completing Intake on Behalf of Client</span>
            </div>
            <p className="text-purple-800 leading-relaxed">
              You are completing this requirements form directly as an administrator. Progress saves and final submission will be attributed to <strong>ADMIN_ENTERED</strong> in the project activity logs.
            </p>
          </div>
        )}

        {/* Clarification / Missing Information Alert Banner */}
        {((project.metadata as any)?.missingRequirements?.length > 0 || isClarification) && (
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-900 space-y-2 animate-fadeIn">
            <div className="font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-rose-950">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Missing Information / Changes Requested</span>
            </div>
            <p className="leading-relaxed text-rose-900">
              Our project engineering team reviewed your project intake and identified items that need to be supplied or completed:
            </p>
            {((project.metadata as any)?.missingRequirements || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {((project.metadata as any)?.missingRequirements || []).map((m: any, idx: number) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      if (m.stepNumber) setCurrentStep(m.stepNumber);
                    }}
                    className={`px-3 py-1 bg-white text-rose-800 font-bold rounded-xl border border-rose-200 text-xs shadow-2xs ${
                      m.stepNumber ? 'cursor-pointer hover:bg-rose-100 hover:border-rose-400' : ''
                    }`}
                  >
                    • {m.title || m.item || String(m)} {m.stepNumber ? `(Jump to Step ${m.stepNumber} →)` : ''}
                  </button>
                ))}
              </div>
            )}
            {(project.metadata as any)?.missingRequirementsNotes && (
              <p className="text-xs text-rose-800 italic bg-white/70 p-2.5 rounded-xl border border-rose-200 mt-2">
                Team Notes: "{(project.metadata as any)?.missingRequirementsNotes}"
              </p>
            )}
          </div>
        )}

        {/* Mobile Step Status Header & Progress Bar */}
        <div className="sm:hidden space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#131B2E]">
              Step {currentStep} of 10 &bull; {steps[currentStep - 1]?.label}
            </span>
            <span className="font-mono font-bold text-[#4338CA]">
              {Math.round((currentStep / 10) * 100)}%
            </span>
          </div>
          <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#4338CA] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* 10-Step Visual Timeline (Mobile scrollable) */}
        <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
          <div className="flex items-center gap-1.5 min-w-[720px]">
            {steps.map((step) => {
              const Icon = step.icon;
              const isDone = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (currentStep > step.id || validateStep(currentStep)) {
                      setCurrentStep(step.id);
                    }
                  }}
                  className={`flex-1 p-2 rounded-xl text-left transition-all border cursor-pointer ${
                    isCurrent
                      ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
                      : 'bg-[#FAF7F2] text-[#64748B] border-[#E2E8F0] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase">
                      {step.id < 10 ? `0${step.id}` : step.id}
                    </span>
                    {isDone ? <Check className="w-3 h-3 text-emerald-600" /> : <Icon className="w-3 h-3 opacity-70" />}
                  </div>
                  <div className="text-[11px] font-black truncate mt-0.5">{step.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Form Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-4 sm:p-8 shadow-xl space-y-6">
        {/* =================================================================== */}
        {/* SECTION A: COMPANY & BRAND PROFILE */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">
                {isSchoolProject ? 'Section A \u2022 School & Institutional Profile' : 'Section A \u2022 Company & Brand Profile'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isSchoolProject
                  ? 'Provide official school details, board affiliation, and administrative contacts.'
                  : 'Provide essential legal and display details for your organization.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  {isSchoolProject ? 'School / Institution Name' : 'Brand / Website Display Name'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_a_profile.displayName}
                  onChange={(e) => updateSection('section_a_profile', { displayName: e.target.value })}
                  placeholder={isSchoolProject ? 'e.g. SparkNest Academy School, Motihari' : 'e.g. Champaran Sweets & Bakers'}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none"
                />
                {stepErrors['displayName'] && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['displayName']}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  {isSchoolProject ? 'Trust / Society / Legal Registered Name' : 'Legal Entity / Registered Name'}
                </label>
                <input
                  type="text"
                  value={formData.section_a_profile.legalName || ''}
                  onChange={(e) => updateSection('section_a_profile', { legalName: e.target.value })}
                  placeholder={isSchoolProject ? 'e.g. SparkNest Educational Trust (optional)' : 'e.g. Champaran Retail Private Limited (optional)'}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  {isSchoolProject ? 'Institution / Board Affiliation Category' : 'Business Industry / Category'}
                </label>
                <select
                  value={formData.section_a_profile.category}
                  onChange={(e) => updateSection('section_a_profile', { category: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none font-bold"
                >
                  {isSchoolProject ? (
                    <>
                      <option value="K-12 School / CBSE / ICSE / State Board">K-12 School (CBSE / ICSE / State Board)</option>
                      <option value="Coaching / Institute / Education">Coaching / Institute / Education</option>
                      <option value="Play School / Pre-Primary & Daycare">Play School / Pre-Primary &amp; Daycare</option>
                      <option value="College / Degree / Higher Education Institute">College / Degree / Higher Education Institute</option>
                      <option value="Other Educational Organization">Other Educational Organization</option>
                    </>
                  ) : (
                    <>
                      <option value="Retail / Commercial Business">Retail / Commercial Business</option>
                      <option value="Healthcare / Clinic / Hospital">Healthcare / Clinic / Hospital</option>
                      <option value="Hospitality / Hotel / Restaurant">Hospitality / Hotel / Restaurant</option>
                      <option value="Manufacturing / Industrial / Distribution">Manufacturing / Industrial / Distribution</option>
                      <option value="Real Estate / Construction">Real Estate / Construction</option>
                      <option value="Coaching / Institute / Education">Coaching / Institute / Education</option>
                      <option value="Professional Services (Legal, CA, Tech)">Professional Services (Legal, CA, Tech)</option>
                      <option value="Other Commercial Enterprise">Other Commercial Enterprise</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Primary Location / Headquarters <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_a_profile.locations}
                  onChange={(e) => updateSection('section_a_profile', { locations: e.target.value })}
                  placeholder="e.g. Motihari, East Champaran, Bihar"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Primary Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_a_profile.primaryContactName}
                  onChange={(e) => updateSection('section_a_profile', { primaryContactName: e.target.value })}
                  placeholder="Full name of representative"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none"
                />
                {stepErrors['primaryContactName'] && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['primaryContactName']}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Contact Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.section_a_profile.email}
                  onChange={(e) => updateSection('section_a_profile', { email: e.target.value })}
                  placeholder="email@yourdomain.com"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none font-mono"
                />
                {stepErrors['email'] && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['email']}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Primary Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.section_a_profile.phone}
                  onChange={(e) => updateSection('section_a_profile', { phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none font-mono"
                />
                {stepErrors['phone'] && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['phone']}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">WhatsApp Business Number</label>
                <input
                  type="tel"
                  value={formData.section_a_profile.whatsapp || ''}
                  onChange={(e) => updateSection('section_a_profile', { whatsapp: e.target.value })}
                  placeholder="For chat widget integration"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1 text-xs">
                Business Description &bull; What products or services do you offer?
              </label>
              <textarea
                rows={3}
                value={formData.section_a_profile.description}
                onChange={(e) => updateSection('section_a_profile', { description: e.target.value })}
                placeholder="Give a concise summary of your business activities, key strengths, and target market..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs focus:bg-white focus:border-[#4338CA] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION B: BUSINESS GOALS & TARGET AUDIENCE */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">
                {isSchoolProject ? 'Section B \u2022 Educational Goals & Target Audience' : 'Section B \u2022 Business Goals & Target Audience'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isSchoolProject
                  ? 'Clarify school objectives, digital solution tier, and campus stakeholders.'
                  : 'Clarify who will use this software or website, and what you want to achieve.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Primary Solution Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.section_b_goals_audience.primaryType}
                  onChange={(e) => updateSection('section_b_goals_audience', { primaryType: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  {isSchoolProject ? (
                    <>
                      <option value="School Website">School Website (Official Web Presence &amp; Admissions)</option>
                      <option value="School Website + CMS">School Website + CMS (Staff Dynamic Updates &amp; Notice Board)</option>
                      <option value="School ERP">School ERP (Student SIS, Attendance, Marks &amp; Operations)</option>
                      <option value="Website + CMS + ERP">Website + CMS + ERP (Complete All-in-One Platform)</option>
                      <option value="Custom Educational Portal">Custom Educational Software / Multi-Branch Portal</option>
                    </>
                  ) : (
                    <>
                      <option value="Business Website">Business Website (Informational / Lead Generation)</option>
                      <option value="E-commerce Website">E-commerce Website (Online Shop &amp; Orders)</option>
                      <option value="Web Application">Web Application (Interactive Cloud Software)</option>
                      <option value="Custom Software">Custom Enterprise Software / Portal</option>
                      <option value="CRM / ERP">CRM / ERP / Billing &amp; Inventory System</option>
                      <option value="Booking & Appointment System">Booking &amp; Appointment System</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  {isSchoolProject ? 'Primary Campus Audience / Stakeholders' : 'Customer / User Relationship'}
                </label>
                <select
                  value={formData.section_b_goals_audience.targetCustomerType}
                  onChange={(e) => updateSection('section_b_goals_audience', { targetCustomerType: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  {isSchoolProject ? (
                    <>
                      <option value="B2C">Parents &amp; Prospective Students (Public Admissions &amp; Inquiries)</option>
                      <option value="INTERNAL_TEAM">School Teachers, Faculty &amp; Administrative Staff</option>
                      <option value="B2B_AND_B2C">Both Parents/Students and Campus Staff (Hybrid)</option>
                      <option value="B2B">Trustees, Board Inspectors &amp; External Affiliations</option>
                    </>
                  ) : (
                    <>
                      <option value="B2C">B2C (Individual retail consumers / general public)</option>
                      <option value="B2B">B2B (Other businesses, wholesale distributors)</option>
                      <option value="B2B_AND_B2C">Both B2B and B2C audiences</option>
                      <option value="INTERNAL_TEAM">Internal Company Team / Staff Portal</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                Primary Goal of this Website or Software <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.section_b_goals_audience.primaryGoal}
                onChange={(e) => updateSection('section_b_goals_audience', { primaryGoal: e.target.value })}
                placeholder={
                  isSchoolProject
                    ? 'e.g. Modernize our school portal, satisfy CBSE disclosure guidelines, and increase online admissions'
                    : 'e.g. Generate high-intent phone and WhatsApp inquiries from clients in East Champaran'
                }
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
              {stepErrors['primaryGoal'] && (
                <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['primaryGoal']}</span>
              )}
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                Core Problem or Challenge to Solve <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.section_b_goals_audience.problemToSolve}
                onChange={(e) => updateSection('section_b_goals_audience', { problemToSolve: e.target.value })}
                placeholder={
                  isSchoolProject
                    ? 'e.g. Our existing website is outdated, not mobile responsive, lacks CBSE mandatory disclosures, and fee records are still managed on paper...'
                    : 'e.g. Our competitors appear on Google when clients search for our services in Motihari, while we have no official web presence to verify our authenticity...'
                }
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
              {stepErrors['problemToSolve'] && (
                <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['problemToSolve']}</span>
              )}
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">Target Audience &bull; Who are your ideal customers?</label>
              <input
                type="text"
                value={formData.section_b_goals_audience.targetAudienceDescription}
                onChange={(e) => updateSection('section_b_goals_audience', { targetAudienceDescription: e.target.value })}
                placeholder="e.g. Families and business owners looking for high quality commercial services in Bihar"
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION C: DESIGN & VISUAL PREFERENCES */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section C &bull; Design &amp; Visual Preferences</h2>
              <p className="text-xs text-[#64748B]">Help our UI/UX designers understand your visual taste and aesthetic guidelines.</p>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-2">Overall Design Vibe &amp; Style</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { id: 'Modern & Clean', desc: 'Sleek, ample whitespace, high legibility' },
                  { id: 'Corporate & Prestigious', desc: 'Authoritative, structured, trust-building' },
                  { id: 'Minimalist', desc: 'Simplified typography, subtle lines, modern' },
                  { id: 'Bold & Vibrant', desc: 'Energetic, dynamic accents, engaging' },
                  { id: 'Luxury & Premium', desc: 'High-end, dark or gold accents, refined' },
                  { id: 'Friendly & Warm', desc: 'Approachable, warm colors, community-centric' },
                ].map((vibe) => (
                  <button
                    key={vibe.id}
                    type="button"
                    onClick={() => updateSection('section_c_design', { styleVibe: vibe.id as any })}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      formData.section_c_design.styleVibe === vibe.id
                        ? 'border-[#4338CA] bg-indigo-50/60 shadow-xs'
                        : 'border-[#E2E8F0] bg-[#FAF7F2] hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold text-[#131B2E]">{vibe.id}</div>
                    <div className="text-[10px] text-[#64748B] mt-0.5">{vibe.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Preferred Brand Colors</label>
                <input
                  type="text"
                  value={formData.section_c_design.preferredColors}
                  onChange={(e) => updateSection('section_c_design', { preferredColors: e.target.value })}
                  placeholder="e.g. Deep Navy Blue, White, and Gold accents (#1E3A8A, #D97706)"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
                />
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Colors to Avoid</label>
                <input
                  type="text"
                  value={formData.section_c_design.avoidColors || ''}
                  onChange={(e) => updateSection('section_c_design', { avoidColors: e.target.value })}
                  placeholder="e.g. Neon green, bright purple"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                Websites You Like (Inspirations) &bull; Include links and what you like
              </label>
              <textarea
                rows={2}
                value={formData.section_c_design.likedWebsites || ''}
                onChange={(e) => updateSection('section_c_design', { likedWebsites: e.target.value })}
                placeholder="e.g. https://apple.com (love the clean typography), https://stripe.com (modern cards)"
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                Competitor Websites &bull; Who else in your region or industry do you compete with?
              </label>
              <textarea
                rows={2}
                value={formData.section_c_design.competitorWebsites || ''}
                onChange={(e) => updateSection('section_c_design', { competitorWebsites: e.target.value })}
                placeholder="Competitor URLs or names in Motihari / Bihar..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION D: WEBSITE / APPLICATION STRUCTURE */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section D &bull; Website / Application Structure</h2>
              <p className="text-xs text-[#64748B]">Select the required pages, screens, and content architecture.</p>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-2">
                Standard Pages Required <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {(isSchoolProject
                  ? [
                      'Home Landing Page',
                      'About School & Management',
                      'Principal Message',
                      'Mandatory Public Disclosure (CBSE)',
                      'Academics & Curriculum',
                      'Admissions & Inquiries',
                      'Fee Structure & Rules',
                      'Campus Facilities & Tour',
                      'Photo & Event Gallery',
                      'Notices & Circulars',
                      'Faculty & Staff Directory',
                      'Contact & Campus Location',
                    ]
                  : [
                      'Home Landing Page',
                      'About Company',
                      'Products / Services',
                      'Contact & Inquiries',
                      'Customer Testimonials',
                      'Photo / Project Gallery',
                      'Blog / News Updates',
                      'Careers / Jobs',
                      'Pricing / Rate Card',
                      'FAQ Section',
                      'Privacy Policy & Terms',
                    ]
                ).map((page) => {
                  const isChecked = formData.section_d_structure.requiredPages.includes(page);
                  return (
                    <label
                      key={page}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#4338CA] bg-indigo-50/50 font-bold text-[#131B2E]'
                          : 'border-[#E2E8F0] bg-[#FAF7F2] text-[#64748B]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const current = formData.section_d_structure.requiredPages;
                          const next = isChecked ? current.filter((p) => p !== page) : [...current, page];
                          updateSection('section_d_structure', { requiredPages: next });
                        }}
                        className="rounded text-[#4338CA] focus:ring-0"
                      />
                      <span className="text-[11px] truncate">{page}</span>
                    </label>
                  );
                })}
              </div>
              {stepErrors['requiredPages'] && (
                <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['requiredPages']}</span>
              )}
            </div>

            {/* Custom Pages Manager */}
            <div>
              <label className="font-bold text-[#131B2E] block mb-1">Add Custom Pages / Modules</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPageInput}
                  onChange={(e) => setCustomPageInput(e.target.value)}
                  placeholder={
                    isSchoolProject
                      ? 'e.g. TC Verification Portal, Bus Routes & Transport, Alumni Network'
                      : 'e.g. Doctor OPD Timetable, Franchise Application, Wholesale Portal'
                  }
                  className="flex-1 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-2.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomPage}
                  className="px-4 py-2.5 bg-[#4338CA] text-white font-bold rounded-xl text-xs hover:bg-[#3730A3] cursor-pointer shrink-0"
                >
                  Add Page
                </button>
              </div>

              {(formData.section_d_structure.customPages || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.section_d_structure.customPages?.map((p) => (
                    <span
                      key={p}
                      className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold text-[11px] rounded-lg flex items-center gap-1.5"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPage(p)}
                        className="inline-flex items-center justify-center p-0.5 ml-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/70 rounded transition-colors cursor-pointer"
                        title={`Remove ${p}`}
                        aria-label={`Remove page ${p}`}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-2 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.section_d_structure.multilingual}
                  onChange={(e) => updateSection('section_d_structure', { multilingual: e.target.checked })}
                  className="rounded text-[#4338CA]"
                />
                <div>
                  <div className="font-bold text-[#131B2E]">Multilingual Support Needed</div>
                  <div className="text-[10px] text-[#64748B]">e.g. English + Hindi toggling</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.section_d_structure.blogOrNews}
                  onChange={(e) => updateSection('section_d_structure', { blogOrNews: e.target.checked })}
                  className="rounded text-[#4338CA]"
                />
                <div>
                  <div className="font-bold text-[#131B2E]">Dynamic News / Blog Section</div>
                  <div className="text-[10px] text-[#64748B]">Publish continuous updates without coding</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION E: CONTENT & ASSETS (WITH FILE UPLOADS) */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-5 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section E &bull; Content &amp; Assets</h2>
              <p className="text-xs text-[#64748B]">
                Upload logos, brand guidelines, service catalogues, or reference mockups. Files are securely associated with your project.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Do you have a vector or high-res Logo?</label>
                <select
                  value={formData.section_e_assets.hasLogo}
                  onChange={(e) => updateSection('section_e_assets', { hasLogo: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="YES">Yes, we have a logo file ready to upload</option>
                  <option value="NO">No, we need Ekaagra to design a logo for us</option>
                  <option value="NEEDS_REDESIGN">We have an old logo, but want a redesign</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Status of Written Text &amp; Copy</label>
                <select
                  value={formData.section_e_assets.hasWrittenContent}
                  onChange={(e) => updateSection('section_e_assets', { hasWrittenContent: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="READY">Ready &bull; We have our text &amp; brochures ready</option>
                  <option value="DRAFT">Rough Draft &bull; We will need editorial assistance</option>
                  <option value="NEED_COPYWRITING">Need Copywriting &bull; We want Ekaagra to write the copy</option>
                </select>
              </div>
            </div>

            {/* Asset Upload Box */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider block">
                    Upload Project Assets &amp; Reference Files
                  </span>
                  <p className="text-[11px] text-indigo-900">
                    Allowed: PNG, JPG, WEBP, SVG, PDF, DOCX, XLSX (Max 15MB each). Server-side encrypted.
                  </p>
                </div>

                {/* Category selector for next upload */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-900 uppercase">Category:</span>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as BusinessAssetCategory)}
                    className="bg-white border border-indigo-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#131B2E]"
                  >
                    <option value="LOGO">Logo</option>
                    <option value="BRAND_GUIDELINE">Brand Guidelines</option>
                    <option value="SCREENSHOT">Website Screenshot</option>
                    <option value="CATALOGUE">Product / Service Catalogue</option>
                    <option value="DOCUMENT">PDF / Document</option>
                    <option value="IMAGE">Photos / Images</option>
                    <option value="REFERENCE_DESIGN">Reference Design</option>
                    <option value="OTHER">Other Material</option>
                  </select>
                </div>
              </div>

              {/* Upload Input */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full sm:w-auto text-xs text-[#64748B] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#4338CA] file:text-white hover:file:bg-[#3730A3] cursor-pointer"
                />

                {isUploading && (
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading &amp; encrypting file...
                  </span>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold">
                  {uploadError}
                </div>
              )}

              {/* Uploaded Files Table */}
              {uploadedAssets.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-indigo-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-950 block">
                    Attached Files ({uploadedAssets.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {uploadedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 flex-1 mr-2">
                          <FileText className="w-4 h-4 text-[#4338CA] shrink-0" />
                          <span className="font-bold text-[#131B2E] truncate">{asset.file_name}</span>
                          <span className="text-[9px] font-mono font-bold bg-indigo-50 text-[#4338CA] px-2 py-0.5 rounded uppercase">
                            {asset.asset_category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {asset.file_size_bytes && (
                            <span className="text-[10px] text-[#94A3B8] font-mono">
                              {(asset.file_size_bytes / (1024 * 1024)).toFixed(1)}MB
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.id)}
                            disabled={deletingAssetId === asset.id}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Remove file"
                            aria-label={`Remove ${asset.file_name}`}
                          >
                            <Trash2 className={`w-3.5 h-3.5 ${deletingAssetId === asset.id ? 'animate-spin text-rose-600' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">Additional Content Notes</label>
              <textarea
                rows={2}
                value={formData.section_e_assets.contentNotes || ''}
                onChange={(e) => updateSection('section_e_assets', { contentNotes: e.target.value })}
                placeholder="Notes on photo shoots, existing brochure links, Google Drive folders..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION F: FEATURES & FUNCTIONAL REQUIREMENTS */}
        {/* =================================================================== */}
        {currentStep === 6 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section F &bull; Features &amp; Functional Requirements</h2>
              <p className="text-xs text-[#64748B]">Select the operational features required for your software or portal.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  key: 'contactForm',
                  title: isSchoolProject ? 'Online Admission Inquiry Form' : 'Interactive Inquiry / Contact Form',
                  desc: isSchoolProject ? 'Captures parent inquiries & student applications' : 'Captures visitor inquiries directly',
                },
                {
                  key: 'whatsAppChat',
                  title: 'WhatsApp Direct Chat Widget',
                  desc: isSchoolProject ? 'Direct link for parents to contact school office' : 'Connects customers instantly to your mobile',
                },
                {
                  key: 'googleMaps',
                  title: isSchoolProject ? 'Google Maps Campus Driving Directions' : 'Google Maps & Driving Directions',
                  desc: isSchoolProject ? 'Helps parents and visitors find your school campus' : 'Helps local clients find your premises',
                },
                {
                  key: 'searchFilter',
                  title: isSchoolProject ? 'Notices / Curriculum Search & Filter' : 'Product / Content Search & Filter',
                  desc: isSchoolProject ? 'Fast indexing of circulars, syllabus, or faculty' : 'Fast indexing of catalogues or listings',
                },
                {
                  key: 'userAuth',
                  title: isSchoolProject ? 'Student / Staff Account Portal Login' : 'User Account Registration & Login',
                  desc: isSchoolProject ? 'Secure credentials for parents, teachers, and staff' : 'Secure customer or client accounts',
                },
                {
                  key: 'adminPanel',
                  title: isSchoolProject ? 'Principal & Staff Management Dashboard' : 'Custom Admin Management Dashboard',
                  desc: isSchoolProject ? 'Manage admissions, notices, student records' : 'Control content, leads, and orders',
                },
                {
                  key: 'cms',
                  title: isSchoolProject ? 'School CMS (Notices, Events & Gallery)' : 'Content Management System (CMS)',
                  desc: isSchoolProject ? 'Publish circulars, date sheets, event photos easily' : 'Edit notices, galleries, products easily',
                },
                {
                  key: 'onlineBooking',
                  title: isSchoolProject ? 'Parent-Teacher Meeting (PTM) Booking' : 'Appointment / Table Booking',
                  desc: isSchoolProject ? 'Schedule parent counseling & admission visit slots' : 'Schedule dates, timeslots, and services',
                },
                {
                  key: 'paymentGateway',
                  title: isSchoolProject ? 'Online Academic Fee Payment Gateway' : 'Online Payment Gateway (Razorpay/UPI)',
                  desc: isSchoolProject ? 'Collect term fees, admission dues, and issue receipts' : 'Collect payments, advance deposits, invoices',
                },
                {
                  key: 'analyticsSeo',
                  title: 'Search Engine Optimization & Analytics',
                  desc: isSchoolProject ? 'Top Google ranking for school searches in your district' : 'Google Search Console, meta tags, visitor analytics',
                },
              ].map((feat) => {
                const isChecked = Boolean((formData.section_f_features as any)[feat.key]);
                return (
                  <label
                    key={feat.key}
                    className={`flex items-start gap-2.5 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? 'border-[#4338CA] bg-indigo-50/50 shadow-2xs'
                        : 'border-[#E2E8F0] bg-[#FAF7F2] hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => updateSection('section_f_features', { [feat.key]: e.target.checked } as any)}
                      className="mt-0.5 rounded text-[#4338CA] focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-[#131B2E]">{feat.title}</div>
                      <div className="text-[10px] text-[#64748B] mt-0.5">{feat.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                {isSchoolProject ? 'Custom School Logic / Specific Administrative Workflows' : 'Custom Business Logic / Specific Workflows'}
              </label>
              <textarea
                rows={2}
                value={formData.section_f_features.customFeatures || ''}
                onChange={(e) => updateSection('section_f_features', { customFeatures: e.target.value })}
                placeholder={
                  isSchoolProject
                    ? 'e.g. CBSE mandatory disclosure document archive, TC serial verification lookup, automated absence SMS alerts...'
                    : 'e.g. Generate automatic PDF quote when client inputs room dimensions, or email alert on high-value order...'
                }
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION G: INTEGRATIONS & TECHNICAL REQUIREMENTS */}
        {/* =================================================================== */}
        {currentStep === 7 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section G &bull; Integrations &amp; Technical Requirements</h2>
              <p className="text-xs text-[#64748B]">Specify third-party APIs, payment gateways, and system architecture.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Payment Gateway Preference</label>
                <select
                  value={formData.section_g_integrations.preferredPaymentGateway || 'RAZORPAY'}
                  onChange={(e) => updateSection('section_g_integrations', { preferredPaymentGateway: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="RAZORPAY">Razorpay (Recommended &bull; UPI, Cards, Net Banking)</option>
                  <option value="PAYTM">Paytm Business Gateway</option>
                  <option value="CASHFREE">Cashfree Payments</option>
                  <option value="STRIPE">Stripe (For International Payments)</option>
                  <option value="NONE">No Online Payment Gateway Required</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">WhatsApp Official Cloud API Integration</label>
                <select
                  value={formData.section_g_integrations.whatsappApiNeeded ? 'YES' : 'NO'}
                  onChange={(e) => updateSection('section_g_integrations', { whatsappApiNeeded: e.target.value === 'YES' })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="YES">Yes &bull; Automatic WhatsApp order alerts and receipts</option>
                  <option value="NO">No &bull; Simple click-to-chat button is sufficient</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">CRM / Accounting / ERP Integration</label>
              <input
                type="text"
                value={formData.section_g_integrations.crmIntegration || ''}
                onChange={(e) => updateSection('section_g_integrations', { crmIntegration: e.target.value })}
                placeholder="e.g. Tally, Zoho Books, Vyapar, Marg ERP (if applicable)"
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">Other External APIs or Security Requirements</label>
              <textarea
                rows={2}
                value={formData.section_g_integrations.thirdPartyApis || ''}
                onChange={(e) => updateSection('section_g_integrations', { thirdPartyApis: e.target.value })}
                placeholder="e.g. Shiprocket delivery API, SMS OTP gateway, private database access..."
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION H: DOMAIN, HOSTING, EMAIL & DEPLOYMENT */}
        {/* =================================================================== */}
        {currentStep === 8 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section H &bull; Domain, Hosting, Email &amp; Deployment</h2>
              <p className="text-xs text-[#64748B]">Establish infrastructure, DNS management, and business email addresses.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Domain Name Status</label>
                <select
                  value={formData.section_h_domain_hosting.hasDomain}
                  onChange={(e) => updateSection('section_h_domain_hosting', { hasDomain: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="YES">We already own a domain name</option>
                  <option value="NO">We need Ekaagra to purchase &amp; register our domain</option>
                  <option value="DECIDE_LATER">Decide later during the project</option>
                </select>
              </div>

              {formData.section_h_domain_hosting.hasDomain === 'YES' ? (
                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">Existing Domain Name</label>
                  <input
                    type="text"
                    value={formData.section_h_domain_hosting.existingDomain || ''}
                    onChange={(e) => updateSection('section_h_domain_hosting', { existingDomain: e.target.value })}
                    placeholder={isSchoolProject ? 'e.g. sparknestschool.com or sparknest.edu.in' : 'e.g. yourcompany.com or yourcompany.in'}
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-mono text-xs"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">Preferred New Domain Name</label>
                  <input
                    type="text"
                    value={formData.section_h_domain_hosting.preferredNewDomain || ''}
                    onChange={(e) => updateSection('section_h_domain_hosting', { preferredNewDomain: e.target.value })}
                    placeholder={isSchoolProject ? 'e.g. sparknestacademy.com or sparknestschool.in' : 'e.g. yourbrandbihar.com'}
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-mono text-xs"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Hosting Preference</label>
                <select
                  value={formData.section_h_domain_hosting.hostingPreference}
                  onChange={(e) => updateSection('section_h_domain_hosting', { hostingPreference: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="MANAGED_BY_EKAAGRA">Managed Cloud Hosting by Ekaagra (High Speed, SSL, Backups)</option>
                  <option value="CLIENT_AWS_CLOUD">Client Cloud (AWS / Vercel / Google Cloud)</option>
                  <option value="CLIENT_CPANEL">Client cPanel / Shared Server</option>
                  <option value="DECIDE_LATER">Decide later with Ekaagra Engineers</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  {isSchoolProject ? 'Official School Email (@school.edu.in / @school.com)' : 'Custom Business Email (@company.com)'}
                </label>
                <select
                  value={formData.section_h_domain_hosting.hasBusinessEmail ? 'YES' : 'NO'}
                  onChange={(e) => updateSection('section_h_domain_hosting', { hasBusinessEmail: e.target.value === 'YES' })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  <option value="YES">
                    {isSchoolProject
                      ? 'Yes \u2022 Setup institutional mailboxes (Google Workspace / Zoho)'
                      : 'Yes \u2022 Setup business mailboxes (Google Workspace / Zoho)'}
                  </option>
                  <option value="NO">No &bull; We will use regular Gmail / existing email</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION I: BUDGET, TIMELINE & BUSINESS CONSTRAINTS */}
        {/* =================================================================== */}
        {currentStep === 9 && (
          <div className="space-y-4 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">
                {isSchoolProject
                  ? 'Section I \u2022 Budget, Timeline & School Plans'
                  : 'Section I \u2022 Budget, Timeline & Business Constraints'}
              </h2>
              <p className="text-xs text-[#64748B]">
                {isSchoolProject
                  ? 'Select your target school plan tier and set expectation boundaries for academic scheduling.'
                  : 'Set expectation boundaries to ensure realistic milestone scheduling.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Target Budget Bracket <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.section_i_budget_timeline.targetBudgetRange}
                  onChange={(e) => updateSection('section_i_budget_timeline', { targetBudgetRange: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  {isSchoolProject ? (
                    <>
                      <option value="₹9,999 (School Website)">₹9,999 &bull; School Website (10 Pages, Admissions &amp; Notices)</option>
                      <option value="₹16,999 (School Website + CMS)">₹16,999 &bull; School Website + Staff CMS Admin Panel</option>
                      <option value="₹24,999 - ₹49,999 (School ERP)">₹24,999 - ₹49,999 &bull; School ERP (Attendance, Marks, TC &amp; Fees)</option>
                      <option value="₹39,999 - ₹74,999 (Website + CMS + ERP)">₹39,999 - ₹74,999 &bull; Complete Platform (Website + CMS + ERP)</option>
                      <option value="₹75,000 - ₹1,20,000+ (Enterprise Campus Suite)">₹75,000 - ₹1,20,000+ &bull; Enterprise Campus Suite (1,500+ Students / Multi-Branch)</option>
                      <option value="FLEXIBLE_BASED_ON_DESIGN">Flexible / Based on approved school plan &amp; student count</option>
                      {formData.section_i_budget_timeline.targetBudgetRange &&
                        ![
                          '₹9,999 (School Website)',
                          '₹16,999 (School Website + CMS)',
                          '₹24,999 - ₹49,999 (School ERP)',
                          '₹39,999 - ₹74,999 (Website + CMS + ERP)',
                          '₹75,000 - ₹1,20,000+ (Enterprise Campus Suite)',
                          'FLEXIBLE_BASED_ON_DESIGN',
                        ].includes(formData.section_i_budget_timeline.targetBudgetRange) && (
                          <option value={formData.section_i_budget_timeline.targetBudgetRange}>
                            {formData.section_i_budget_timeline.targetBudgetRange}
                          </option>
                        )}
                    </>
                  ) : (
                    <>
                      <option value="₹15,000 - ₹30,000">₹15,000 - ₹30,000 (Starter Business Website)</option>
                      <option value="₹30,000 - ₹60,000">₹30,000 - ₹60,000 (Custom Commercial Solution)</option>
                      <option value="₹60,000 - ₹1,20,000">₹60,000 - ₹1,20,000 (E-commerce / Web App)</option>
                      <option value="₹1,20,000+">₹1,20,000+ (Full Custom Enterprise Portal)</option>
                      <option value="FLEXIBLE_BASED_ON_DESIGN">Flexible / Based on approved design</option>
                      {formData.section_i_budget_timeline.targetBudgetRange &&
                        ![
                          '₹15,000 - ₹30,000',
                          '₹30,000 - ₹60,000',
                          '₹60,000 - ₹1,20,000',
                          '₹1,20,000+',
                          'FLEXIBLE_BASED_ON_DESIGN',
                        ].includes(formData.section_i_budget_timeline.targetBudgetRange) && (
                          <option value={formData.section_i_budget_timeline.targetBudgetRange}>
                            {formData.section_i_budget_timeline.targetBudgetRange}
                          </option>
                        )}
                    </>
                  )}
                </select>
                {stepErrors['targetBudgetRange'] && (
                  <span className="text-[10px] text-rose-500 font-bold block mt-1">{stepErrors['targetBudgetRange']}</span>
                )}
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Target Launch Timeline</label>
                <select
                  value={formData.section_i_budget_timeline.timelineRequirement}
                  onChange={(e) => updateSection('section_i_budget_timeline', { timelineRequirement: e.target.value as any })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 font-bold text-[#131B2E]"
                >
                  {isSchoolProject ? (
                    <>
                      <option value="IMMEDIATE">Urgent / Fast-track (Within 2 to 3 weeks before new session)</option>
                      <option value="ONE_TO_TWO_MONTHS">Standard (1 to 2 Months &bull; Ready for Admissions)</option>
                      <option value="TWO_TO_FOUR_MONTHS">Comprehensive (2 to 4 Months &bull; Phased ERP Rollout)</option>
                      <option value="FLEXIBLE">Flexible / Quality-driven</option>
                    </>
                  ) : (
                    <>
                      <option value="IMMEDIATE">Urgent / Fast-track (Within 2 to 3 weeks)</option>
                      <option value="ONE_TO_TWO_MONTHS">Standard (1 to 2 Months)</option>
                      <option value="TWO_TO_FOUR_MONTHS">Comprehensive (2 to 4 Months)</option>
                      <option value="FLEXIBLE">Flexible / Quality-driven</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* School Plan Quick Selector Reference for Schools */}
            {isSchoolProject && (
              <div className="p-3.5 sm:p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                    Official Ekaagra School Plans
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">Click any plan card to select</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      name: 'School Website',
                      price: '₹9,999',
                      tag: '10 Pages, Mobile & Admissions',
                      targetVal: '₹9,999 (School Website)',
                    },
                    {
                      name: 'School Website + CMS',
                      price: '₹16,999',
                      tag: 'Staff CMS Admin Panel',
                      targetVal: '₹16,999 (School Website + CMS)',
                    },
                    {
                      name: 'School ERP',
                      price: 'From ₹24,999',
                      tag: 'SIS, Attendance & Marks',
                      targetVal: '₹24,999 - ₹49,999 (School ERP)',
                    },
                    {
                      name: 'Website + CMS + ERP',
                      price: 'From ₹39,999',
                      tag: 'Complete All-in-One Platform',
                      badge: 'RECOMMENDED',
                      targetVal: '₹39,999 - ₹74,999 (Website + CMS + ERP)',
                    },
                  ].map((plan) => {
                    const isSelected = formData.section_i_budget_timeline.targetBudgetRange === plan.targetVal;
                    return (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => updateSection('section_i_budget_timeline', { targetBudgetRange: plan.targetVal })}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white border-[#4338CA] shadow-sm ring-2 ring-[#4338CA]'
                            : 'bg-white/80 border-indigo-100 hover:border-indigo-300 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#131B2E]">{plan.name}</span>
                          {plan.badge && (
                            <span className="text-[8px] font-extrabold bg-[#4338CA] text-white px-1.5 py-0.5 rounded-full">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-black font-mono text-[#4338CA] mt-1">{plan.price}</div>
                        <div className="text-[10px] text-[#64748B] mt-0.5">{plan.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">
                {isSchoolProject
                  ? 'Hard Deadlines, Affiliation Audits, or Academic Constraints'
                  : 'Hard Deadlines, Regulatory, or Business Constraints'}
              </label>
              <textarea
                rows={3}
                value={formData.section_i_budget_timeline.hardDeadlinesOrConstraints || ''}
                onChange={(e) => updateSection('section_i_budget_timeline', { hardDeadlinesOrConstraints: e.target.value })}
                placeholder={
                  isSchoolProject
                    ? 'e.g. CBSE Board inspection next month, annual admission open day in March, or domain expiring soon...'
                    : 'e.g. We have a grand opening on Diwali, or our existing domain expires next month...'
                }
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SECTION J: FINAL REVIEW & SUBMISSION AGREEMENT */}
        {/* =================================================================== */}
        {currentStep === 10 && (
          <div className="space-y-5 text-xs">
            <div>
              <h2 className="text-lg font-black text-[#131B2E]">Section J &bull; Final Review &amp; Submission Agreement</h2>
              <p className="text-xs text-[#64748B]">Review your specifications before creating an immutable submission snapshot.</p>
            </div>

            {/* Summary Review Cards */}
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
                <div className="font-bold text-[#131B2E] uppercase text-[11px] tracking-wider">Specifications Summary</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#64748B]">
                  <div>Brand: <strong className="text-[#131B2E] block">{formData.section_a_profile.displayName}</strong></div>
                  <div>Primary Type: <strong className="text-[#4338CA] block">{formData.section_b_goals_audience.primaryType}</strong></div>
                  <div>Style: <strong className="text-[#131B2E] block">{formData.section_c_design.styleVibe}</strong></div>
                  <div>Pages: <strong className="text-[#131B2E] block">{formData.section_d_structure.requiredPages.length} selected</strong></div>
                </div>
              </div>

              {/* Zero upfront payment reminder banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Design-First Principle &bull; Zero Upfront Fee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800">
                  Submitting this form does not require any payment. Ekaagra Technologies will review these requirements, create your custom design concept, and present it for your inspection.
                  <strong> You only pay after you review and approve the design concept.</strong>
                </p>
              </div>
            </div>

            {/* Signatory Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Authorized Signatory / Representative Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.section_j_agreement.authorizedSignatoryName}
                  onChange={(e) => updateSection('section_j_agreement', { authorizedSignatoryName: e.target.value })}
                  placeholder="Your full legal name"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
                />
              </div>

              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Title / Designation (Optional)</label>
                <input
                  type="text"
                  value={formData.section_j_agreement.authorizedSignatoryTitle || ''}
                  onChange={(e) => updateSection('section_j_agreement', { authorizedSignatoryTitle: e.target.value })}
                  placeholder={isSchoolProject ? 'e.g. Principal, Director, Secretary' : 'e.g. Managing Director, Partner, Proprietor'}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#131B2E] block mb-1">Special Notes for the Ekaagra Engineering Team</label>
              <textarea
                rows={2}
                value={formData.section_j_agreement.notesForEkaagraTeam || ''}
                onChange={(e) => updateSection('section_j_agreement', { notesForEkaagraTeam: e.target.value })}
                placeholder={
                  isSchoolProject
                    ? 'Any special instructions regarding CBSE guidelines, school board affiliations, or preferred launch date...'
                    : 'Any special instructions, immediate concerns, or timing preferences...'
                }
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3"
              />
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.section_j_agreement.confirmedAccurate}
                onChange={(e) => updateSection('section_j_agreement', { confirmedAccurate: e.target.checked })}
                className="mt-1 rounded text-[#4338CA] focus:ring-0"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#131B2E] block text-xs">
                  I confirm that the specifications and requirements provided above are accurate and ready for review.
                </span>
                <span className="text-[10px] text-[#64748B] block">
                  Clicking &ldquo;Submit Final Requirements&rdquo; creates an immutable snapshot version for our design team.
                </span>
              </div>
            </label>

            {submitError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation & Submission Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#131B2E] text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#4338CA]/20 transition-all"
            >
              <span>Next Section</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Immutable Snapshot...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Final Requirements &rarr;</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
