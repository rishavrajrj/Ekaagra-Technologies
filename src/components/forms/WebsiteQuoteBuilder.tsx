'use client';

import { useState, useEffect, useId } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Search,
  Globe,
  Plus,
  Trash2,
  Sparkles,
  ShieldCheck,
  Clock,
  Award,
  Tag,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Send,
  HelpCircle,
  XCircle,
} from 'lucide-react';
import {
  websitePlans,
  additionalPageTiers,
  planDomainAllowances,
  pricingTiers,
} from '@/lib/data';
import type {
  QuoteFormData,
  StructuredQuoteRequest,
  QuoteSelectedPage,
  QuoteSelectedDomain,
} from '@/lib/types';
import type { DomainCheckResponse, DomainExtensionQuote } from '@/lib/domain/types';
import { submitQuoteForm } from '@/app/actions';
import { buildQuoteSubmissionWhatsAppUrl } from '@/lib/whatsapp';

// Suggested popular additional pages
const SUGGESTED_ADDITIONAL_PAGES = [
  { name: 'Services Overview', tierId: 'standard-designed', tierName: 'Standard Designed Page', price: 299 },
  { name: 'Photo / Event Gallery', tierId: 'standard-designed', tierName: 'Standard Designed Page', price: 299 },
  { name: 'Our Team / Faculty', tierId: 'standard-designed', tierName: 'Standard Designed Page', price: 299 },
  { name: 'Client Testimonials / Reviews', tierId: 'standard-designed', tierName: 'Standard Designed Page', price: 299 },
  { name: 'Product Showcase', tierId: 'standard-designed', tierName: 'Standard Designed Page', price: 299 },
  { name: 'About Us / Vision & Mission', tierId: 'simple-info', tierName: 'Simple Information Page', price: 199 },
  { name: 'Contact & Inquiry Page', tierId: 'simple-info', tierName: 'Simple Information Page', price: 199 },
  { name: 'Privacy Policy & Terms', tierId: 'simple-info', tierName: 'Simple Information Page', price: 199 },
  { name: 'Frequently Asked Questions (FAQ)', tierId: 'simple-info', tierName: 'Simple Information Page', price: 199 },
  { name: 'Detailed Pricing / Fee Structure', tierId: 'advanced-custom', tierName: 'Advanced / Custom Page', price: 499 },
  { name: 'Interactive Multi-Step Form', tierId: 'advanced-custom', tierName: 'Advanced / Custom Page', price: 499 },
  { name: 'Interactive Animated Showcase', tierId: 'professional-animated', tierName: 'Professional / Animated Page', price: 999 },
];

const ORGANIZATION_TYPES = [
  'School / Academy',
  'Coaching / Tuition Institute',
  'Business / Retail Shop',
  'Startup / Technology',
  'Healthcare / Clinic / Hospital',
  'Restaurant / Cafe / Food',
  'NGO / Charitable Trust',
  'Professional Service / Consultant',
  'Other',
];

const STEPS = [
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Pages' },
  { id: 3, label: 'Domain' },
  { id: 4, label: 'Organization' },
  { id: 5, label: 'Contact' },
  { id: 6, label: 'Review' },
];

export default function WebsiteQuoteBuilder() {
  const searchParams = useSearchParams();
  const domainInputId = useId();

  // Active step state
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: Plan State
  const [selectedPlanId, setSelectedPlanId] = useState<string>('starter');
  const [showHigherPlans, setShowHigherPlans] = useState(false);

  // STEP 2: Pages State
  const [additionalPages, setAdditionalPages] = useState<QuoteSelectedPage[]>([]);
  const [customPageName, setCustomPageName] = useState('');
  const [customPageTierId, setCustomPageTierId] = useState('standard-designed');

  // STEP 3: Domain State
  const [domainSearchInput, setDomainSearchInput] = useState('');
  const [businessCategory, setBusinessCategory] = useState('general');
  const [domainSearchPhase, setDomainSearchPhase] = useState<'IDLE' | 'SEARCHING' | 'COMPLETED'>('IDLE');
  const [domainCheckResponse, setDomainCheckResponse] = useState<DomainCheckResponse | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<QuoteSelectedDomain | null>(null);
  const [skipCustomDomain, setSkipCustomDomain] = useState(false);

  // STEP 4: Organization State
  const [organization, setOrganization] = useState({
    name: '',
    type: 'School / Academy',
    industry: 'Education',
    location: 'Motihari, Bihar',
    website: '',
    description: '',
    requirements: '',
    preferredLanguage: 'English & Hindi (Bilingual)',
  });

  // STEP 5: Contact State
  const [contact, setContact] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    designation: 'Owner / Administrator',
    preferredContactMethod: 'WhatsApp',
  });

  // Form Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedQuote, setSubmittedQuote] = useState<StructuredQuoteRequest | null>(null);

  // Initialize from searchParams
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      if (['free-launch', 'launch-plus', 'starter'].includes(planParam)) {
        setSelectedPlanId(planParam);
      }
    }

    const domainParam = searchParams.get('domain');
    const priceParam = searchParams.get('registrarPrice') || searchParams.get('price');
    const currencyParam = searchParams.get('registrarCurrency') || 'USD';
    const inrParam = searchParams.get('estimatedINR');
    const termParam = searchParams.get('term') || '1 year';
    const termAllowanceParam = searchParams.get('termAllowance');
    const upgradeParam = searchParams.get('upgrade');

    if (domainParam) {
      const annualAllowance = planDomainAllowances[planParam || 'starter'] ?? 500;
      const period = termParam.includes('2') ? 2 : 1;
      const termAllowance = termAllowanceParam ? Number(termAllowanceParam) : annualAllowance * period;
      const estimatedINR = inrParam ? Number(inrParam) : 995;
      const upgradeAmount = upgradeParam ? Number(upgradeParam) : Math.max(0, estimatedINR - termAllowance);

      setSelectedDomain({
        domain: domainParam,
        provider: 'GoDaddy',
        sourceAmount: priceParam ? Number(priceParam) : 10.49,
        sourceCurrency: currencyParam,
        estimatedINR,
        period,
        registrationPeriod: termParam,
        annualAllowance,
        termAllowance,
        upgradeAmount,
        premium: false,
        isIncluded: upgradeAmount === 0,
        recommendationBadge: 'Pre-Selected Domain',
      });
      setDomainSearchInput(domainParam);
    }
  }, [searchParams]);

  // Selected plan details
  const activePlan = websitePlans.find((p) => p.id === selectedPlanId) || websitePlans[2];
  const activeAnnualAllowance = planDomainAllowances[selectedPlanId] ?? 0;

  // Included pages for the active plan
  const includedPagesList =
    selectedPlanId === 'starter'
      ? ['Home Landing Page', 'About Us & Profile', 'Core Services / Academics', 'Contact & Inquiries']
      : ['Single High-Impact Landing Page'];

  // Recalculate domain upgrade if plan changes
  useEffect(() => {
    if (selectedDomain) {
      const period = selectedDomain.period || 1;
      const termAllowance = activeAnnualAllowance * period;
      const comparableCost = selectedDomain.estimatedINR || 0;
      const upgradeAmount = Math.max(0, comparableCost - termAllowance);
      const isIncluded = termAllowance > 0 && comparableCost <= termAllowance;

      setSelectedDomain((prev) =>
        prev
          ? {
              ...prev,
              annualAllowance: activeAnnualAllowance,
              termAllowance,
              upgradeAmount,
              isIncluded,
            }
          : null
      );
    }
  }, [selectedPlanId, activeAnnualAllowance]);

  // Calculations
  const planPrice = activePlan.price;
  const additionalPagesTotal = additionalPages.reduce((sum, p) => sum + p.price, 0);
  const domainUpgradeAmount = skipCustomDomain || !selectedDomain ? 0 : selectedDomain.upgradeAmount;
  const estimatedTotal = planPrice + additionalPagesTotal + domainUpgradeAmount;

  // Handle adding an additional page
  const handleAddPage = (name: string, tierId: string, tierName: string, price: number) => {
    const id = `page-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setAdditionalPages((prev) => [
      ...prev,
      {
        id,
        name,
        tierId,
        tierName,
        price,
        priceDisplay: `₹${price}`,
      },
    ]);
  };

  const handleRemovePage = (id: string) => {
    setAdditionalPages((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCustomPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPageName.trim()) return;
    const tier = additionalPageTiers.find((t) => t.id === customPageTierId) || additionalPageTiers[1];
    handleAddPage(customPageName.trim(), tier.id, tier.type, tier.price);
    setCustomPageName('');
  };

  // Domain search action
  const handleDomainSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = domainSearchInput.trim();
    if (!clean) return;

    setDomainSearchPhase('SEARCHING');
    try {
      const res = await fetch('/api/domain/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: clean,
          selectedPlanId: selectedPlanId,
          businessCategory,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as DomainCheckResponse;
        setDomainCheckResponse(data);
      } else {
        setDomainCheckResponse({
          query: clean,
          sanitizedName: clean,
          requestedDomain: null,
          requestedDomainAvailable: null,
          selectedPlanId: selectedPlanId,
          planAllowance: activeAnnualAllowance,
          isLiveChecked: false,
          status: 'ERROR',
          errorMessage: 'Unable to connect to live registrar. Domain will be confirmed in your quote.',
          topRecommendation: null,
          results: [],
          suggestionsUsed: false,
          disclaimer: 'Registrar connection temporary notice.',
          instructions: 'Please select a domain or continue to organization details.',
        });
      }
    } catch (err) {
      console.error('Domain check error:', err);
    } finally {
      setDomainSearchPhase('COMPLETED');
    }
  };

  // Handle selecting a domain
  const handleSelectDomain = (quote: DomainExtensionQuote) => {
    setSelectedDomain({
      domain: quote.domain,
      provider: 'GoDaddy',
      sourceAmount: quote.sourceAmount,
      sourceCurrency: quote.sourceCurrency,
      estimatedINR: quote.registrationPrice,
      period: quote.period,
      registrationPeriod: quote.registrationPeriod,
      renewalPrice: quote.renewalPrice,
      annualAllowance: quote.planAllowance,
      termAllowance: quote.termAllowance,
      upgradeAmount: quote.upgradeAmount,
      premium: quote.premium,
      isIncluded: quote.included,
      recommendationBadge: quote.recommendationBadge,
      recommendationReason: quote.recommendationReason,
    });
    setSkipCustomDomain(false);
  };

  // Validation before proceeding
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 4) {
      if (!organization.name.trim()) {
        newErrors.orgName = 'Please enter your Organization or Business Name.';
      }
      if (!organization.type) {
        newErrors.orgType = 'Please select your Organization Type.';
      }
    }

    if (step === 5) {
      if (!contact.fullName.trim()) {
        newErrors.fullName = 'Please enter your Full Name.';
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!contact.email.trim() || !emailRegex.test(contact.email)) {
        newErrors.email = 'Please enter a valid email address.';
      }
      if (!contact.phone.trim() || contact.phone.replace(/[^0-9]/g, '').length < 10) {
        newErrors.phone = 'Please enter a valid 10-digit mobile number.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(6, prev + 1));
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Final Quote Submission
  const handleSubmitQuote = async () => {
    if (!validateStep(4) || !validateStep(5)) {
      setCurrentStep(4);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    // Structured Quote Payload
    const structuredQuote: StructuredQuoteRequest = {
      plan: {
        id: activePlan.id,
        name: activePlan.name,
        price: activePlan.price,
        priceDisplay: activePlan.priceDisplay,
        duration: activePlan.duration,
        pages: activePlan.pages,
        includedPagesCount: includedPagesList.length,
        domainAllowance: activeAnnualAllowance,
        seoIncluded: activePlan.seoIncluded,
        maintenanceIncluded: activePlan.maintenanceIncluded,
      },
      includedPages: includedPagesList,
      additionalPages,
      domain: skipCustomDomain ? null : selectedDomain,
      organization,
      contact,
      totals: {
        planPrice,
        additionalPagesTotal,
        domainUpgrade: domainUpgradeAmount,
        estimatedTotal,
      },
    };

    // Human-readable formatted description for email / notifications
    const formattedDescription = [
      `=== WEBSITE QUOTE REQUEST ===`,
      `PLAN: ${activePlan.name} (${activePlan.priceDisplay})`,
      `Plan Scope: ${activePlan.pages} pages, 1-yr hosting, maintenance included, domain allowance: ₹${activeAnnualAllowance}/yr`,
      ``,
      `INCLUDED PAGES:`,
      includedPagesList.map((p) => `• ${p}`).join('\n'),
      ``,
      `ADDITIONAL PAGES (${additionalPages.length}):`,
      additionalPages.length > 0
        ? additionalPages.map((p) => `• ${p.name} [${p.tierName}] — ₹${p.price}`).join('\n')
        : `None selected.`,
      `Additional Pages Subtotal: ₹${additionalPagesTotal}`,
      ``,
      `DOMAIN SELECTION:`,
      selectedDomain && !skipCustomDomain
        ? `• Domain: ${selectedDomain.domain}\n• Registrar Price: ${selectedDomain.sourceCurrency === 'USD' ? '$' : ''}${selectedDomain.sourceAmount} ${selectedDomain.sourceCurrency} (~₹${selectedDomain.estimatedINR})\n• Term: ${selectedDomain.registrationPeriod} (Term Allowance: ₹${selectedDomain.termAllowance})\n• Domain Upgrade Difference: +₹${selectedDomain.upgradeAmount}`
        : `• Using included Ekaagra subdomain / Free hosted URL (No custom domain upgrade).`,
      ``,
      `ORGANIZATION DETAILS:`,
      `• Organization: ${organization.name} (${organization.type})`,
      `• Industry: ${organization.industry}`,
      `• Location: ${organization.location}`,
      organization.website ? `• Current Website: ${organization.website}` : '',
      organization.description ? `• Purpose: ${organization.description}` : '',
      organization.requirements ? `• Additional Requirements: ${organization.requirements}` : '',
      ``,
      `CONTACT DETAILS:`,
      `• Contact Person: ${contact.fullName} (${contact.designation})`,
      `• Phone: ${contact.phone}`,
      contact.whatsapp ? `• WhatsApp: ${contact.whatsapp}` : '',
      `• Email: ${contact.email}`,
      `• Preferred Contact: ${contact.preferredContactMethod}`,
      ``,
      `ESTIMATED REQUEST TOTAL:`,
      `Plan: ₹${planPrice} + Additional Pages: ₹${additionalPagesTotal} + Domain Upgrade: ₹${domainUpgradeAmount} = ₹${estimatedTotal}`,
    ]
      .filter(Boolean)
      .join('\n');

    const legacyFormData: QuoteFormData = {
      name: contact.fullName,
      organization: organization.name,
      phone: contact.phone,
      email: contact.email,
      projectType: `${activePlan.name} (${activePlan.priceDisplay})`,
      description: formattedDescription,
      budget: `₹${estimatedTotal} Estimated Total`,
      timeline: '2–4 Weeks Standard',
    };

    try {
      const res = await submitQuoteForm(legacyFormData, structuredQuote);
      if (res.success) {
        setSubmitSuccess(true);
        setSubmittedQuote(structuredQuote);
      } else {
        setSubmitError(res.message || 'Unable to submit your quote request. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'A network error occurred while submitting your request.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submitSuccess && submittedQuote) {
    const whatsappUrl = buildQuoteSubmissionWhatsAppUrl({
      name: submittedQuote.contact.fullName,
      organization: submittedQuote.organization.name,
      phone: submittedQuote.contact.phone,
      email: submittedQuote.contact.email,
      projectType: `${submittedQuote.plan.name} (Estimated Total: ₹${submittedQuote.totals.estimatedTotal})`,
      description: `I have submitted a website quote request for ${submittedQuote.organization.name}. Looking forward to discussing the project proposal.`,
    });

    return (
      <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl p-6 sm:p-10 space-y-8 animate-fadeIn text-center">
        <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
            Website Quote Request Received!
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed">
            Thank you, <strong>{submittedQuote.contact.fullName}</strong>. Your customized website proposal request for <strong>{submittedQuote.organization.name}</strong> has been logged into our engineering queue.
          </p>
        </div>

        {/* Structured Summary Card */}
        <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] max-w-lg mx-auto text-left space-y-3.5 text-xs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B] font-medium">Selected Website Plan:</span>
            <strong className="text-[#131B2E] font-bold">
              {submittedQuote.plan.name} ({submittedQuote.plan.priceDisplay})
            </strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B] font-medium">Total Configured Pages:</span>
            <strong className="text-[#131B2E]">
              {submittedQuote.includedPages.length} Included
              {submittedQuote.additionalPages.length > 0 && ` + ${submittedQuote.additionalPages.length} Additional`}
            </strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B] font-medium">Selected Domain:</span>
            <strong className="text-[#131B2E] font-mono">
              {submittedQuote.domain ? submittedQuote.domain.domain : 'Ekaagra Hosted Subdomain'}
            </strong>
          </div>
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <span className="text-[#64748B] font-medium">Domain Upgrade Difference:</span>
            <strong className="text-emerald-700">
              {submittedQuote.domain && submittedQuote.domain.upgradeAmount > 0
                ? `+₹${submittedQuote.domain.upgradeAmount}`
                : '✓ Included in Plan'}
            </strong>
          </div>
          <div className="flex items-center justify-between pt-1 text-sm font-extrabold text-[#131B2E]">
            <span>Estimated Total:</span>
            <span className="text-base text-[#4338CA]">₹{submittedQuote.totals.estimatedTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 max-w-lg mx-auto leading-relaxed">
          *Note: This request does not automatically purchase the domain or charge your card. Our team will verify registrar availability and connect with you to finalize your project scope.
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <span>Connect on WhatsApp Now</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2] transition-all cursor-pointer"
          >
            Create Another Quote
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: The Interactive 6-Step Workflow (8 cols on desktop) */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-5 sm:p-8 space-y-8">
        {/* --- Top Progress Stepper (01 Plan to 06 Review) --- */}
        <div className="border-b border-[#E2E8F0] pb-6">
          <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                  }}
                  disabled={step.id > currentStep}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                    isActive
                      ? 'bg-[#4338CA] text-white shadow-sm'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      : 'bg-[#FAF7F2] text-[#94A3B8] opacity-60'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-80">0{step.id}</span>
                  <span>{step.label}</span>
                  {isPast && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: CHOOSE WEBSITE PLAN */}
        {/* ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 01 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Choose Your Website Plan
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Your plan sets the baseline pages, hosting, maintenance, and domain allowance.
              </p>
            </div>

            {/* Core Website Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {websitePlans.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                      isSelected
                        ? 'border-[#4338CA] bg-indigo-50/40 shadow-md ring-2 ring-[#4338CA]/10'
                        : 'border-[#E2E8F0] bg-[#FAF7F2] hover:border-[#4338CA]/40 hover:bg-white'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1">
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA]/10 text-[#4338CA]">
                            {plan.badge}
                          </span>
                        )}
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#4338CA] bg-[#4338CA] text-white'
                              : 'border-[#94A3B8] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <h4 className="text-base font-extrabold text-[#131B2E]">{plan.name}</h4>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#131B2E]">{plan.priceDisplay}</span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">{plan.tagline}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-[#E2E8F0]/70 text-xs">
                      <div className="flex items-center gap-1.5 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{plan.pages} Page{plan.pages !== '1' ? 's' : ''} Included</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {plan.id === 'free-launch'
                            ? 'Ekaagra Hosted Subdomain'
                            : `₹${plan.domainAllowance}/yr Domain Allowance`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{plan.seoIncluded ? 'Basic SEO Setup Included' : 'No SEO Setup'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#334155]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Maintenance Included</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#4338CA] text-white'
                          : 'bg-white text-[#131B2E] border border-[#E2E8F0] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Choose Plan'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Higher-tier custom packages toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHigherPlans(!showHigherPlans)}
                className="text-xs font-bold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showHigherPlans ? 'Hide' : 'Looking for'} Bespoke Corporate / Web Application Packages?</span>
                <span className="text-xs">{showHigherPlans ? '▲' : '▼'}</span>
              </button>

              {showHigherPlans && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 animate-fadeIn">
                  {pricingTiers.map((tier) => (
                    <div
                      key={tier.title}
                      className="p-4 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="font-bold text-[#131B2E]">{tier.title}</strong>
                        <span className="font-bold text-[#4338CA]">{tier.startingFrom}</span>
                      </div>
                      <p className="text-[#64748B]">{tier.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer"
              >
                <span>Continue to Customize Pages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: CUSTOMIZE PAGES */}
        {/* ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 02 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Customize Your Website Pages
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Your plan includes baseline pages. Add specific pages tailored to your brand.
              </p>
            </div>

            {/* Included Pages Summary */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pages Included in Your {activePlan.name} Plan:</span>
                </span>
                <span className="text-xs font-extrabold text-emerald-800">
                  {includedPagesList.length} Page{includedPagesList.length > 1 ? 's' : ''} Included (₹0 extra)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {includedPagesList.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-950 shadow-xs"
                  >
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Additional Pages Configured */}
            {additionalPages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#131B2E]">
                  <span>Configured Additional Pages ({additionalPages.length}):</span>
                  <span className="text-[#4338CA]">Subtotal: ₹{additionalPagesTotal}</span>
                </div>
                <div className="space-y-1.5">
                  {additionalPages.map((page) => (
                    <div
                      key={page.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs"
                    >
                      <div>
                        <strong className="font-bold text-[#131B2E]">{page.name}</strong>
                        <span className="text-[11px] text-[#64748B] ml-2">({page.tierName})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-[#131B2E]">{page.priceDisplay}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePage(page.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Remove Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Popular Pages */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
                Popular Additional Pages to Add:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_ADDITIONAL_PAGES.map((sug) => {
                  const alreadyAdded = additionalPages.some((p) => p.name === sug.name);
                  return (
                    <button
                      key={sug.name}
                      type="button"
                      onClick={() => {
                        if (!alreadyAdded) {
                          handleAddPage(sug.name, sug.tierId, sug.tierName, sug.price);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        alreadyAdded
                          ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950'
                          : 'bg-white border-[#E2E8F0] hover:border-[#4338CA]/40 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-[#131B2E] block">{sug.name}</span>
                        <span className="text-[10px] text-[#64748B]">{sug.tierName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#4338CA]">₹{sug.price}</span>
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                            alreadyAdded ? 'bg-emerald-600 text-white' : 'bg-[#FAF7F2] text-[#4338CA]'
                          }`}
                        >
                          {alreadyAdded ? '✓' : '+'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add Custom Named Page */}
            <form onSubmit={handleAddCustomPage} className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
              <span className="text-xs font-bold text-[#131B2E] block">
                Need a specific custom page?
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customPageName}
                  onChange={(e) => setCustomPageName(e.target.value)}
                  placeholder="e.g. Admission Inquiry or Faculty Directory"
                  className="flex-1 bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
                <select
                  value={customPageTierId}
                  onChange={(e) => setCustomPageTierId(e.target.value)}
                  className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#131B2E] font-medium"
                >
                  {additionalPageTiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.type} ({t.priceDisplay})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#131B2E] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-all cursor-pointer whitespace-nowrap"
                >
                  + Add Page
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Plans</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <span>Continue to Choose Domain</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: CHOOSE DOMAIN */}
        {/* ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 03 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Choose Your Domain
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Your {activePlan.name} plan includes a domain allowance of{' '}
                <strong>₹{activeAnnualAllowance}/year</strong>.
              </p>
            </div>

            {/* Currently Selected Domain Banner (if already chosen) */}
            {selectedDomain && !skipCustomDomain && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-indigo-50 border-2 border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-[#131B2E]">
                      {selectedDomain.domain}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                      ✓ Selected
                    </span>
                    {selectedDomain.isIncluded ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ 100% Included
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Upgrade: +₹{selectedDomain.upgradeAmount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-2">
                    <span>
                      Registrar: {selectedDomain.sourceCurrency === 'USD' ? '$' : ''}
                      {selectedDomain.sourceAmount} {selectedDomain.sourceCurrency} (~₹{selectedDomain.estimatedINR})
                    </span>
                    <span>•</span>
                    <span>Term: {selectedDomain.registrationPeriod}</span>
                    <span>•</span>
                    <span>Plan Allowance: ₹{selectedDomain.termAllowance}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDomain(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white text-xs font-bold text-[#4338CA] hover:bg-[#FAF7F2] transition-all cursor-pointer whitespace-nowrap"
                >
                  Change Domain
                </button>
              </div>
            )}

            {/* Domain Search & Live Explorer (if no domain selected or changing) */}
            {(!selectedDomain || skipCustomDomain) && (
              <div className="space-y-5">
                {/* Search Form */}
                <form onSubmit={handleDomainSearch} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <label htmlFor={domainInputId} className="sr-only">
                        Search domain name
                      </label>
                      <input
                        id={domainInputId}
                        type="text"
                        value={domainSearchInput}
                        onChange={(e) => setDomainSearchInput(e.target.value)}
                        placeholder="Enter brand or domain (e.g. sparknest or sparknestacademy.com)"
                        className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                      />
                      <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="submit"
                      disabled={domainSearchPhase === 'SEARCHING'}
                      className="px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {domainSearchPhase === 'SEARCHING' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        <>
                          <span>Search Domain</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Business Context Selector */}
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span>Category context:</span>
                    {['general', 'school', 'business', 'tech'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBusinessCategory(c)}
                        className={`capitalize px-2.5 py-0.5 rounded-md border text-[11px] font-semibold cursor-pointer ${
                          businessCategory === c
                            ? 'bg-[#4338CA] text-white border-[#4338CA]'
                            : 'bg-[#FAF7F2] text-[#64748B] border-[#E2E8F0]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Progressive Search Loader */}
                {domainSearchPhase === 'SEARCHING' && (
                  <div className="p-6 text-center space-y-2 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0]">
                    <Loader2 className="w-5 h-5 text-[#4338CA] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-[#131B2E]">
                      Querying GoDaddy live availability and suggestions...
                    </p>
                  </div>
                )}

                {/* Domain Results */}
                {domainSearchPhase === 'COMPLETED' && domainCheckResponse?.status === 'SUCCESS' && (
                  <div className="space-y-4">
                    {/* Top Recommendation */}
                    {domainCheckResponse.topRecommendation && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-white border-2 border-[#4338CA] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#4338CA] text-white">
                            🥇 {domainCheckResponse.topRecommendation.recommendationBadge || 'Top Recommendation'}
                          </span>
                          <span className="text-xs font-extrabold text-[#131B2E]">
                            ~₹{domainCheckResponse.topRecommendation.registrationPrice} / {domainCheckResponse.topRecommendation.registrationPeriod}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-base font-extrabold text-[#131B2E]">
                              {domainCheckResponse.topRecommendation.domain}
                            </span>
                            <p className="text-xs text-[#64748B]">
                              {domainCheckResponse.topRecommendation.recommendationReason}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectDomain(domainCheckResponse.topRecommendation!)}
                            className="px-4 py-2 rounded-xl bg-[#4338CA] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3730A3] transition-all cursor-pointer whitespace-nowrap"
                          >
                            Choose Domain
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Other Available Results */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {domainCheckResponse.results
                        .filter((r) => r.domain !== domainCheckResponse.topRecommendation?.domain)
                        .slice(0, 6)
                        .map((quote) => (
                          <div
                            key={quote.domain}
                            className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#131B2E]">{quote.domain}</span>
                                {quote.included ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                    ✓ Included
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 rounded">
                                    +₹{quote.upgradeAmount}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#64748B]">
                                ~₹{quote.registrationPrice} / {quote.registrationPeriod}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectDomain(quote)}
                              className="px-3 py-1.5 rounded-lg border border-[#4338CA] text-[#4338CA] hover:bg-[#4338CA] hover:text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
                            >
                              Select
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Skip Custom Domain Button (Use included subdomain) */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">
                    {selectedPlanId === 'free-launch'
                      ? 'Free Launch includes an Ekaagra subdomain.'
                      : 'Prefer to connect an existing domain later or use an Ekaagra hosted URL?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSkipCustomDomain(true);
                      setSelectedDomain(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      skipCustomDomain
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#131B2E]'
                    }`}
                  >
                    {skipCustomDomain ? '✓ Using Hosted URL' : 'Use Hosted URL / Connect Later'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Pages</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <span>Continue to Organization Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 4: ORGANIZATION DETAILS */}
        {/* ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 04 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Organization &amp; Project Details
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Tell us about your institution or company so we can tailor the site architecture.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Org Name */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Organization / Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={organization.name}
                  onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                  placeholder="e.g. Roshani Public School or Palak Enterprises"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
                {errors.orgName && <p className="text-red-600 text-[11px] mt-1">{errors.orgName}</p>}
              </div>

              {/* Type & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">
                    Organization Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={organization.type}
                    onChange={(e) => setOrganization({ ...organization, type: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-3 text-xs text-[#131B2E] font-medium"
                  >
                    {ORGANIZATION_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">City &amp; State</label>
                  <input
                    type="text"
                    value={organization.location}
                    onChange={(e) => setOrganization({ ...organization, location: e.target.value })}
                    placeholder="e.g. Motihari, Bihar"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Current Website or Reference */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Current Website or Reference URL (Optional)
                </label>
                <input
                  type="text"
                  value={organization.website}
                  onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
                  placeholder="e.g. https://instagram.com/mybusiness or existing website"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Description / Purpose */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Website Purpose &amp; Primary Goal
                </label>
                <textarea
                  rows={3}
                  value={organization.description}
                  onChange={(e) => setOrganization({ ...organization, description: e.target.value })}
                  placeholder="e.g. We want to showcase our school admissions, display student facilities, and capture parent inquiries via WhatsApp."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
              </div>

              {/* Language */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Preferred Website Language</label>
                <select
                  value={organization.preferredLanguage}
                  onChange={(e) => setOrganization({ ...organization, preferredLanguage: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-3 text-xs text-[#131B2E]"
                >
                  <option value="English & Hindi (Bilingual)">English &amp; Hindi (Bilingual — Recommended)</option>
                  <option value="English Only">English Only</option>
                  <option value="Hindi Only">Hindi Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Domain</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <span>Continue to Contact Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 5: PERSONAL / CONTACT DETAILS */}
        {/* ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 05 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Personal &amp; Contact Details
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Who should our team reach out to with the comprehensive quote proposal?
              </p>
            </div>

            <div className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.fullName}
                  onChange={(e) => setContact({ ...contact, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                />
                {errors.fullName && <p className="text-red-600 text-[11px] mt-1">{errors.fullName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    placeholder="e.g. ramesh@gmail.com"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                  />
                  {errors.email && <p className="text-red-600 text-[11px] mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">
                    Phone / Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                  />
                  {errors.phone && <p className="text-red-600 text-[11px] mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* WhatsApp & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">
                    WhatsApp Number (If different from phone)
                  </label>
                  <input
                    type="tel"
                    value={contact.whatsapp}
                    onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#131B2E] block mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={contact.designation}
                    onChange={(e) => setContact({ ...contact, designation: e.target.value })}
                    placeholder="e.g. Principal, Director, Founder"
                    className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                  />
                </div>
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="font-bold text-[#131B2E] block mb-1">Preferred Contact Method</label>
                <div className="flex gap-4">
                  {['WhatsApp', 'Phone Call', 'Email'].map((method) => (
                    <label key={method} className="flex items-center gap-1.5 cursor-pointer font-medium text-[#334155]">
                      <input
                        type="radio"
                        name="preferredContact"
                        value={method}
                        checked={contact.preferredContactMethod === method}
                        onChange={(e) => setContact({ ...contact, preferredContactMethod: e.target.value })}
                        className="text-[#4338CA]"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Organization</span>
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <span>Continue to Review Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 6: REVIEW REQUEST */}
        {/* ========================================================= */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#4338CA]">
                Step 06 of 06
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                Review Your Website Request
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B]">
                Verify your plan, configured pages, domain, and details before submitting.
              </p>
            </div>

            {submitError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Review Cards */}
            <div className="space-y-3.5 text-xs">
              {/* Card 1: Plan */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    01 • Selected Plan
                  </span>
                  <strong className="text-sm font-extrabold text-[#131B2E]">
                    {activePlan.name} ({activePlan.priceDisplay})
                  </strong>
                  <p className="text-[11px] text-[#64748B]">
                    Includes {activePlan.pages} pages, 1-year hosting, maintenance, and ₹{activeAnnualAllowance}/yr domain allowance.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                >
                  Edit Plan
                </button>
              </div>

              {/* Card 2: Pages */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    02 • Configured Pages
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                  >
                    Edit Pages
                  </button>
                </div>
                <div className="text-[#334155]">
                  <strong className="font-bold text-[#131B2E]">
                    {includedPagesList.length} Included Pages:
                  </strong>{' '}
                  {includedPagesList.join(', ')}
                </div>
                {additionalPages.length > 0 && (
                  <div className="border-t border-[#E2E8F0] pt-2 space-y-1">
                    <strong className="font-bold text-[#131B2E]">
                      Additional Pages ({additionalPages.length}) — ₹{additionalPagesTotal}:
                    </strong>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {additionalPages.map((p) => (
                        <span key={p.id} className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] text-[11px]">
                          {p.name} ({p.priceDisplay})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 3: Domain */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    03 • Domain Selection
                  </span>
                  {selectedDomain && !skipCustomDomain ? (
                    <div>
                      <strong className="font-mono text-sm font-extrabold text-[#131B2E]">
                        {selectedDomain.domain}
                      </strong>
                      <p className="text-[11px] text-[#64748B]">
                        Registrar: {selectedDomain.sourceCurrency === 'USD' ? '$' : ''}
                        {selectedDomain.sourceAmount} {selectedDomain.sourceCurrency} (~₹{selectedDomain.estimatedINR}) • Term: {selectedDomain.registrationPeriod} •{' '}
                        {selectedDomain.upgradeAmount > 0
                          ? `Upgrade: +₹${selectedDomain.upgradeAmount}`
                          : '✓ 100% Included in Plan'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <strong className="font-mono text-sm font-extrabold text-[#131B2E]">
                        Ekaagra Hosted Subdomain
                      </strong>
                      <p className="text-[11px] text-[#64748B]">
                        Using included production URL. No custom domain upgrade fee.
                      </p>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                >
                  Edit Domain
                </button>
              </div>

              {/* Card 4: Organization */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    04 • Organization
                  </span>
                  <strong className="text-sm font-extrabold text-[#131B2E]">
                    {organization.name}
                  </strong>
                  <p className="text-[11px] text-[#64748B]">
                    {organization.type} • {organization.location}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                >
                  Edit Org
                </button>
              </div>

              {/* Card 5: Contact */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#64748B] block">
                    05 • Contact Person
                  </span>
                  <strong className="text-sm font-extrabold text-[#131B2E]">
                    {contact.fullName}
                  </strong>
                  <p className="text-[11px] text-[#64748B]">
                    {contact.phone} • {contact.email} ({contact.designation})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                >
                  Edit Contact
                </button>
              </div>

              {/* Breakdown Total Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/70 border-2 border-[#4338CA] space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#4338CA] block">
                  Estimated Request Total
                </span>
                <div className="flex items-center justify-between text-xs text-[#334155]">
                  <span>Website Plan ({activePlan.name}):</span>
                  <span className="font-bold text-[#131B2E]">₹{planPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#334155]">
                  <span>Additional Pages ({additionalPages.length}):</span>
                  <span className="font-bold text-[#131B2E]">₹{additionalPagesTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#334155]">
                  <span>Domain Upgrade Difference:</span>
                  <span className="font-bold text-[#131B2E]">
                    {domainUpgradeAmount > 0 ? `+₹${domainUpgradeAmount.toLocaleString('en-IN')}` : '₹0 (Included)'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#4338CA]/20 text-base font-extrabold text-[#131B2E]">
                  <span>Estimated Total:</span>
                  <span className="text-xl text-[#4338CA]">₹{estimatedTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#64748B] italic leading-relaxed">
              *Note: Domain pricing is indicative and subject to real-time registrar availability upon project confirmation. Submitting this request sends your full configuration to our development team for official scoping and proposal delivery.
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Contact</span>
              </button>
              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#4338CA]/25 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Request My Website Quote</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Sticky Live Quote Summary (4 cols on desktop) */}
      <div className="lg:col-span-4 sticky top-24 space-y-4">
        <div className="bg-[#FAF7F2] rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
              <span>Quote Summary</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#4338CA]/10 text-[#4338CA] font-bold">
              Step 0{currentStep}/06
            </span>
          </div>

          {/* Plan Section */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Active Plan:</span>
              <strong className="text-[#131B2E]">{activePlan.name}</strong>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Plan Duration:</span>
              <span>{activePlan.duration}</span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Plan Cost:</span>
              <span className="font-bold text-[#131B2E]">₹{planPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Pages Section */}
          <div className="border-t border-[#E2E8F0] pt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Included Pages:</span>
              <span>{includedPagesList.length} pages</span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Additional Pages:</span>
              <span>{additionalPages.length} pages</span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Pages Subtotal:</span>
              <span className="font-bold text-[#131B2E]">₹{additionalPagesTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Domain Section */}
          <div className="border-t border-[#E2E8F0] pt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Domain:</span>
              <span className="font-mono text-[11px] font-bold text-[#131B2E] truncate max-w-[150px]">
                {skipCustomDomain
                  ? 'Hosted Subdomain'
                  : selectedDomain
                  ? selectedDomain.domain
                  : 'Pending Selection'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Plan Allowance:</span>
              <span>₹{activeAnnualAllowance}/yr</span>
            </div>
            <div className="flex items-center justify-between text-[#64748B]">
              <span>Domain Upgrade:</span>
              <span className="font-bold text-emerald-700">
                {domainUpgradeAmount > 0 ? `+₹${domainUpgradeAmount.toLocaleString('en-IN')}` : '₹0 (Included)'}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="border-t-2 border-[#131B2E] pt-3 flex items-baseline justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#131B2E]">
              Estimated Total
            </span>
            <span className="text-xl font-black text-[#4338CA]">
              ₹{estimatedTotal.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-[10px] text-[#94A3B8] leading-relaxed italic text-center">
            Zero commitment • No payment required today
          </p>
        </div>

        {/* Reassurance Guarantee Badge */}
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#131B2E]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ekaagra Engineering Promise</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Tailored proposal delivered within 24 hours. Uptime maintenance, SSL encryption, and direct engineer support included.
          </p>
        </div>
      </div>
    </div>
  );
}
