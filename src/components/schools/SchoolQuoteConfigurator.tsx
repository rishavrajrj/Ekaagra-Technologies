'use client';

import { useState, useEffect, useId, useTransition } from 'react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Search,
  Globe,
  Sparkles,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  Clock,
  Layers,
  Award,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  BookOpen,
  School,
  Edit3,
} from 'lucide-react';
import {
  schoolPlans,
  schoolStudentTiers,
  schoolAddons,
  schoolDomainAllowances,
  calculateSchoolPrice,
  type SchoolProductId,
  type SchoolStudentTierId,
  type SchoolPriceCalculation,
} from '@/lib/schoolPricing';
import type {
  QuoteSelectedDomain,
  SchoolQuoteSchoolDetails,
  SchoolQuoteContactDetails,
  SchoolQuoteRequest,
} from '@/lib/types';
import type { DomainCheckResponse, DomainExtensionQuote } from '@/lib/domain/types';
import { submitSchoolQuoteForm } from '@/app/actions';
import { trackSchoolEvent } from '@/lib/analytics';

const SCHOOL_TYPES = [
  'K-12 School',
  'Secondary / High School',
  'Primary / Middle School',
  'Play School / Kindergarten',
  'Coaching / Tuition Academy',
  'Collegiate Institute',
  'Educational Trust / Society',
  'Other Educational Organization',
];

const BOARDS = [
  'CBSE (Central Board of Secondary Education)',
  'ICSE / ISC',
  'Bihar State Board (BSEB)',
  'Other State Board',
  'IB (International Baccalaureate)',
  'Cambridge (IGCSE)',
  'Non-Affiliated / Autonomous',
];

interface SchoolQuoteConfiguratorProps {
  initialProductId?: SchoolProductId;
}

export default function SchoolQuoteConfigurator({
  initialProductId = 'school-complete',
}: SchoolQuoteConfiguratorProps) {
  const domainInputId = useId();
  const [isPending, startTransition] = useTransition();

  // Active step
  // Step 1: Product
  // Step 2: Student Strength (if ERP / Complete)
  // Step 3: Add-ons
  // Step 4: Domain
  // Step 5: Review Configuration
  // Step 6: School Info
  // Step 7: Contact Info
  // Step 8: Final Review
  // Step 9: Success
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: Product
  const [selectedProductId, setSelectedProductId] = useState<SchoolProductId>(initialProductId);

  // STEP 2: Student Strength
  const [selectedStudentTierId, setSelectedStudentTierId] = useState<SchoolStudentTierId>('up-to-300');

  // STEP 3: Add-ons
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // STEP 4: Domain
  const [domainSearchInput, setDomainSearchInput] = useState('');
  const [domainSearchPhase, setDomainSearchPhase] = useState<
    | 'IDLE'
    | 'SEARCHING_DIRECT'
    | 'SEARCHING_SUGGESTIONS'
    | 'PROCESSING_RESULTS'
    | 'SUCCESS'
    | 'NO_RESULTS'
    | 'PRECHECK_REQUIRED'
    | 'RATE_LIMITED'
    | 'PROVIDER_UNAVAILABLE'
    | 'ERROR'
  >('IDLE');
  const [domainCheckResponse, setDomainCheckResponse] = useState<DomainCheckResponse | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<QuoteSelectedDomain | null>(null);
  const [skipDomainSelection, setSkipDomainSelection] = useState(false);
  const [domainSearchError, setDomainSearchError] = useState<string | null>(null);

  // STEP 6: School Information
  const [schoolInfo, setSchoolInfo] = useState<SchoolQuoteSchoolDetails>({
    schoolName: '',
    schoolType: 'K-12 School',
    board: 'CBSE (Central Board of Secondary Education)',
    city: '',
    state: 'Bihar',
    approximateStudents: '350',
    currentWebsite: '',
    existingErp: '',
    currentSoftware: '',
    requirements: '',
    preferredLanguage: 'English & Hindi (Bilingual)',
  });

  // STEP 7: Contact Information
  const [contactInfo, setContactInfo] = useState<SchoolQuoteContactDetails>({
    fullName: '',
    email: '',
    phone: '',
    designation: 'Principal / Director',
    whatsapp: '',
    preferredContactMethod: 'Phone Call',
  });

  // Submission State
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    leadId?: string;
    verifiedPricing?: SchoolPriceCalculation;
    whatsAppUrl?: string;
    message?: string;
  } | null>(null);

  // Helper calculation
  const activePlan = schoolPlans.find((p) => p.id === selectedProductId) || schoolPlans[3];
  const calculatedPricing = calculateSchoolPrice({
    productId: selectedProductId,
    studentTierId: activePlan.isStudentBased ? selectedStudentTierId : null,
    selectedAddonIds,
    domainQuote:
      !skipDomainSelection && selectedDomain
        ? {
            estimatedINR: selectedDomain.estimatedINR,
            period: selectedDomain.period,
            annualAllowance: selectedDomain.annualAllowance,
          }
        : null,
  });

  // Update URL hash or track view
  useEffect(() => {
    trackSchoolEvent('school_page_view', 'Configurator Loaded');
  }, []);

  // When product changes, reset domain quote allowance if already selected
  useEffect(() => {
    if (selectedDomain) {
      const annualAllowance = schoolDomainAllowances[selectedProductId] ?? 300;
      const termAllowance = annualAllowance * selectedDomain.period;
      const cost = selectedDomain.estimatedINR || 0;
      setSelectedDomain((prev) =>
        prev
          ? {
              ...prev,
              annualAllowance,
              termAllowance,
              upgradeAmount: Math.max(0, cost - termAllowance),
              isIncluded: cost <= termAllowance,
            }
          : null
      );
    }
  }, [selectedProductId]);

  // Handle Domain Search
  const handleDomainSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = domainSearchInput.trim();
    if (!query || query.length < 2) {
      setDomainSearchError('Please enter at least 2 characters (e.g. your school name).');
      return;
    }

    setDomainSearchError(null);
    setDomainSearchPhase('SEARCHING_DIRECT');
    setDomainCheckResponse(null);

    trackSchoolEvent('school_domain_search', query);

    try {
      const res = await fetch('/api/domain/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: query,
          selectedPlanId: selectedProductId,
          businessCategory: 'school',
        }),
      });

      if (!res.ok) {
        throw new Error('Network error while querying domain registrar.');
      }

      const data: DomainCheckResponse = await res.json();
      setDomainCheckResponse(data);

      if (data.status === 'SUCCESS') {
        setDomainSearchPhase('SUCCESS');
        // Auto-select top recommendation if available and nothing selected yet
        if (data.topRecommendation && !selectedDomain) {
          handleSelectDomain(data.topRecommendation);
        }
      } else if (data.status === 'PRECHECK_REQUIRED') {
        setDomainSearchPhase('PRECHECK_REQUIRED');
      } else if (data.status === 'RATE_LIMITED') {
        setDomainSearchPhase('RATE_LIMITED');
      } else if (data.status === 'NO_RESULTS') {
        setDomainSearchPhase('NO_RESULTS');
      } else {
        setDomainSearchPhase('ERROR');
      }
    } catch (err: unknown) {
      console.error('Domain search error:', err);
      setDomainSearchPhase('ERROR');
      setDomainSearchError(
        'Unable to query live domain registrar. You may proceed and our team will verify domain availability during consultation.'
      );
    }
  };

  const handleSelectDomain = (quote: DomainExtensionQuote) => {
    const annualAllowance = schoolDomainAllowances[selectedProductId] ?? 300;
    const period = quote.period || 1;
    const termAllowance = annualAllowance * period;
    const cost = quote.registrationPrice || quote.effectiveAnnualPrice || 0;

    const domainSelection: QuoteSelectedDomain = {
      domain: quote.domain,
      provider: 'GoDaddy Domains API v3',
      sourceAmount: quote.sourceAmount,
      sourceCurrency: quote.sourceCurrency,
      estimatedINR: cost,
      period,
      registrationPeriod: quote.registrationPeriod,
      renewalPrice: quote.renewalPrice,
      annualAllowance,
      termAllowance,
      upgradeAmount: Math.max(0, cost - termAllowance),
      premium: quote.premium,
      isIncluded: cost <= termAllowance,
      recommendationBadge: quote.recommendationBadge,
      recommendationReason: quote.recommendationReason,
    };

    setSelectedDomain(domainSelection);
    setSkipDomainSelection(false);
    trackSchoolEvent('school_domain_selected', quote.domain, {
      upgradeAmount: domainSelection.upgradeAmount,
      isIncluded: domainSelection.isIncluded,
    });
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const exists = prev.includes(addonId);
      const next = exists ? prev.filter((id) => id !== addonId) : [...prev, addonId];
      trackSchoolEvent('school_addon_selected', addonId, { selected: !exists });
      return next;
    });
  };

  // Next step navigation with auto-skipping Step 2 if non-ERP
  const goToNextStep = () => {
    setSubmitError(null);
    if (currentStep === 1) {
      trackSchoolEvent('school_plan_selected', selectedProductId);
      if (activePlan.isStudentBased) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3); // Skip student strength for static website
      }
    } else if (currentStep === 2) {
      trackSchoolEvent('school_erp_student_tier_selected', selectedStudentTierId);
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      trackSchoolEvent('school_configuration_completed', 'Config Complete');
      setCurrentStep(5);
    } else if (currentStep === 5) {
      trackSchoolEvent('school_request_started', 'Details Form');
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Validate school details
      if (
        !schoolInfo.schoolName.trim() ||
        !schoolInfo.city.trim() ||
        !schoolInfo.approximateStudents.trim()
      ) {
        setSubmitError('Please enter School Name, City, and Student Strength.');
        return;
      }
      setCurrentStep(7);
    } else if (currentStep === 7) {
      // Validate contact details
      if (!contactInfo.fullName.trim() || !contactInfo.email.trim() || !contactInfo.phone.trim()) {
        setSubmitError('Please enter your Name, Email, and Phone Number.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactInfo.email)) {
        setSubmitError('Please enter a valid email address.');
        return;
      }
      if (contactInfo.phone.replace(/[^0-9]/g, '').length < 10) {
        setSubmitError('Please enter a valid 10-digit phone number.');
        return;
      }
      setCurrentStep(8);
    }
  };

  const goToPrevStep = () => {
    setSubmitError(null);
    if (currentStep === 3 && !activePlan.isStudentBased) {
      setCurrentStep(1); // Jump back to product if non-ERP
    } else {
      setCurrentStep((prev) => Math.max(1, prev - 1));
    }
  };

  // Submit Request
  const handleSubmit = async () => {
    setSubmitError(null);
    startTransition(async () => {
      try {
        const payload: SchoolQuoteRequest = {
          productId: selectedProductId,
          studentTierId: activePlan.isStudentBased ? selectedStudentTierId : undefined,
          selectedAddonIds,
          domain: skipDomainSelection ? null : selectedDomain,
          school: schoolInfo,
          contact: contactInfo,
        };

        const res = await submitSchoolQuoteForm(payload);
        if (res.success) {
          setSubmissionSuccess(true);
          setSubmittedResult(res);
          setCurrentStep(9);
          trackSchoolEvent('school_request_submitted', selectedProductId, {
            leadId: res.leadId,
          });
        } else {
          setSubmitError(res.message || 'Submission failed. Please try again.');
        }
      } catch (err: unknown) {
        console.error('School submission error:', err);
        setSubmitError('An unexpected network error occurred. Please try again or reach out on WhatsApp.');
      }
    });
  };

  // Step Labels for Breadcrumb / Progress
  const stepLabels = [
    { id: 1, label: 'Product' },
    ...(activePlan.isStudentBased ? [{ id: 2, label: 'Capacity' }] : []),
    { id: 3, label: 'Modules' },
    { id: 4, label: 'Domain' },
    { id: 5, label: 'Config Review' },
    { id: 6, label: 'School Info' },
    { id: 7, label: 'Contact' },
    { id: 8, label: 'Submit' },
  ];

  return (
    <div id="school-configurator" className="py-12 sm:py-16 bg-[#FAF7F2] text-[#131B2E]">
      <div className="site-container">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
            STEP-BY-STEP SCHOOL SOLUTION CONFIGURATOR
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Configure Your School&apos;s Solution &amp; Transparent Pricing
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            Choose your product, calibrate capacity, select campus add-ons, and check your official school domain.
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="mb-10 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center justify-between min-w-[620px] max-w-4xl mx-auto px-4">
            {stepLabels.map((s, idx) => {
              const isCompleted = currentStep > s.id;
              const isCurrent = currentStep === s.id;

              return (
                <div key={s.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep > s.id && !submissionSuccess) {
                        setCurrentStep(s.id);
                      }
                    }}
                    disabled={currentStep < s.id || submissionSuccess}
                    className={`flex items-center gap-2 group transition-all text-left ${
                      currentStep > s.id ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isCurrent
                          ? 'bg-[#4338CA] text-white ring-4 ring-[#4338CA]/20 shadow-md'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : s.id}
                    </span>
                    <span
                      className={`text-xs font-bold tracking-wide uppercase ${
                        isCurrent
                          ? 'text-[#4338CA]'
                          : isCompleted
                          ? 'text-[#131B2E]'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      {s.label}
                    </span>
                  </button>

                  {idx < stepLabels.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-3 transition-colors ${
                        currentStep > s.id ? 'bg-emerald-500' : 'bg-[#E2E8F0]'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Left Configuration Form, Right Sticky Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Step Content Area */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* ─── STEP 1: CHOOSE PRODUCT ────────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 1: Choose the right solution for your school
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Select the technology foundation that matches your school&apos;s current operational requirements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {schoolPlans.map((plan) => {
                    const isSelected = selectedProductId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedProductId(plan.id)}
                        className={`relative rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#4338CA] bg-[#FAF7F2] shadow-md shadow-[#4338CA]/10'
                            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:bg-slate-50/50'
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white shadow-sm">
                            {plan.badge}
                          </span>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-extrabold text-base text-[#131B2E]">
                              {plan.name}
                            </h4>
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#4338CA] bg-[#4338CA] text-white'
                                  : 'border-[#CBD5E1]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                          </div>

                          <p className="text-xs text-[#64748B] line-clamp-2">
                            {plan.tagline}
                          </p>

                          <div className="pt-2">
                            <span className="text-xs text-[#64748B] block font-medium">Year 1</span>
                            <span className="text-xl font-extrabold font-mono text-[#131B2E]">
                              {plan.startingPriceDisplay}
                            </span>
                            {plan.renewalPriceDisplay && (
                              <span className="text-[11px] text-[#64748B] block mt-0.5">
                                Renewal: <strong className="text-[#334155]">{plan.renewalPriceDisplay}</strong>
                              </span>
                            )}
                          </div>

                          <div className="pt-2 text-[11px] text-[#475569] space-y-1">
                            <p className="font-semibold text-[#131B2E]">Includes:</p>
                            {plan.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{f}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 mt-3 border-t border-[#E2E8F0]">
                          <span
                            className={`inline-flex items-center justify-center w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-[#4338CA] text-white shadow-sm'
                                : 'bg-[#FAF7F2] text-[#131B2E] border border-[#E2E8F0]'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : plan.ctaText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Continue to {activePlan.isStudentBased ? 'Student Capacity' : 'Add-on Modules'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 2: STUDENT STRENGTH (ERP / COMPLETE) ─────────────────── */}
            {currentStep === 2 && activePlan.isStudentBased && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                      Selected Plan: {activePlan.name}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] mt-1">
                    Step 2: Select Your School&apos;s Student Strength
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    ERP pricing scales with student strength so your school only pays for the platform capacity it needs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {schoolStudentTiers.map((tier) => {
                    const isSelected = selectedStudentTierId === tier.id;
                    const yearOne =
                      selectedProductId === 'school-erp'
                        ? tier.erpYearOnePrice
                        : tier.completeYearOnePrice;
                    const renewal =
                      selectedProductId === 'school-erp'
                        ? tier.erpRenewalPrice
                        : tier.completeRenewalPrice;

                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedStudentTierId(tier.id)}
                        className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#4338CA] bg-[#FAF7F2] shadow-md shadow-[#4338CA]/10'
                            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-[#131B2E]">
                              {tier.label}
                            </span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-[#4338CA] bg-[#4338CA] text-white'
                                  : 'border-[#CBD5E1]'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                          <span className="text-[11px] text-[#64748B] block">
                            {tier.studentRangeText}
                          </span>

                          <div className="pt-2">
                            {tier.isCustom ? (
                              <div>
                                <span className="text-base font-extrabold text-[#4338CA]">
                                  Custom Enterprise Pricing
                                </span>
                                <span className="text-[11px] text-[#64748B] block">
                                  Tailored for multi-branch networks
                                </span>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-xs text-[#64748B]">Year 1:</span>
                                  <span className="text-lg font-extrabold font-mono text-[#131B2E]">
                                    ₹{yearOne?.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#64748B]">
                                  Renewal:{' '}
                                  <strong className="text-[#334155]">
                                    ₹{renewal?.toLocaleString('en-IN')}/year
                                  </strong>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-[#64748B] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                  <span>
                    No hidden per-user license fees. Pricing covers your full school faculty, administration, teachers, students, and parent accounts.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Products</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Continue to Add-on Modules</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: OPTIONAL ADD-ONS ─────────────────────────────────── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 3: Optional Modules &amp; Integrations
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Select any optional specialized modules your school requires. Core academic records and student lifecycle modules are already included in ERP.
                  </p>
                </div>

                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {schoolAddons.map((addon) => {
                    const isChecked = selectedAddonIds.includes(addon.id);

                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'border-[#4338CA] bg-[#FAF7F2]'
                            : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          aria-label={addon.name}
                          className="w-4 h-4 rounded mt-1 text-[#4338CA] focus:ring-[#4338CA] border-slate-300"
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#131B2E]">
                              {addon.name}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {addon.priceNote}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] leading-relaxed">
                            {addon.description}
                          </p>
                          {addon.thirdPartyUsageNote && (
                            <p className="text-[10px] text-amber-700 italic">
                              * {addon.thirdPartyUsageNote}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Continue to Domain Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 4: DOMAIN SELECTION ─────────────────────────────────── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                      Included Plan Allowance: ₹{calculatedPricing.annualDomainAllowance}/year
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] mt-1">
                    Step 4: Choose Your School Domain
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Search for your school domain. You can pick ANY available domain. If the domain cost exceeds your plan allowance of ₹{calculatedPricing.annualDomainAllowance}, you only pay the difference.
                  </p>
                </div>

                {/* Domain Search Box */}
                <form onSubmit={handleDomainSearch} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id={domainInputId}
                        type="text"
                        value={domainSearchInput}
                        onChange={(e) => {
                          setDomainSearchInput(e.target.value);
                          setDomainSearchError(null);
                        }}
                        placeholder="e.g. dpsmotihari, saintxavier, vidyamandir"
                        className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-9 pr-4 py-3 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={domainSearchPhase === 'SEARCHING_DIRECT' || domainSearchPhase === 'SEARCHING_SUGGESTIONS'}
                      className="px-5 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {domainSearchPhase === 'SEARCHING_DIRECT' || domainSearchPhase === 'SEARCHING_SUGGESTIONS' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Searching Live...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Check Domain</span>
                        </>
                      )}
                    </button>
                  </div>

                  {domainSearchError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{domainSearchError}</span>
                    </p>
                  )}
                </form>

                {/* Domain Search Results */}
                {domainCheckResponse && domainCheckResponse.results.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">
                      Live Registrar Results
                    </span>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {domainCheckResponse.results.map((quote) => {
                        const isSelected = selectedDomain?.domain === quote.domain;
                        const annualAllowance = calculatedPricing.annualDomainAllowance;
                        const period = quote.period || 1;
                        const termAllowance = annualAllowance * period;
                        const cost = quote.registrationPrice || quote.effectiveAnnualPrice || 0;
                        const upgrade = Math.max(0, cost - termAllowance);
                        const isIncluded = cost <= termAllowance;

                        return (
                          <div
                            key={quote.domain}
                            onClick={() => handleSelectDomain(quote)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#4338CA] bg-[#FAF7F2] shadow-sm'
                                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-[#131B2E]">
                                  {quote.domain}
                                </span>
                                {quote.recommendationBadge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    {quote.recommendationBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#64748B]">
                                {quote.recommendationReason || `${quote.registrationPeriod} term at registrar`}
                              </p>
                            </div>

                            <div className="text-right shrink-0">
                              {isIncluded ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  ✓ Included in Plan
                                </span>
                              ) : (
                                <div>
                                  <span className="text-xs font-bold text-[#4338CA] block">
                                    +₹{upgrade.toLocaleString('en-IN')} Upgrade
                                  </span>
                                  <span className="text-[10px] text-[#64748B] block">
                                    (Registrar: ₹{cost.toLocaleString('en-IN')})
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Precheck Required / Fallback notice */}
                {domainSearchPhase === 'PRECHECK_REQUIRED' && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>Registrar Verification Notice</span>
                    </p>
                    <p>
                      Domain availability will be confirmed when your request is reviewed. Enter your preferred domain name above or in your notes.
                    </p>
                  </div>
                )}

                {/* Skip / Already Have Domain Option */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDomainSelection}
                      onChange={(e) => {
                        setSkipDomainSelection(e.target.checked);
                        if (e.target.checked) setSelectedDomain(null);
                      }}
                      className="rounded text-[#4338CA] focus:ring-[#4338CA]"
                    />
                    <span>
                      Our school already owns a domain OR we will decide the domain later.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Continue to Configuration Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 5: CONFIGURATION REVIEW ─────────────────────────────── */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 5: Review Your Solution Configuration
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Review your chosen platform details before entering your school and contact information.
                  </p>
                </div>

                <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        Selected Product
                      </span>
                      <h4 className="text-base font-extrabold text-[#131B2E]">
                        {calculatedPricing.productName}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-bold text-[#4338CA] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {calculatedPricing.isStudentBased && (
                    <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                          Student Capacity Tier
                        </span>
                        <p className="text-sm font-bold text-[#131B2E]">
                          {calculatedPricing.studentTierLabel}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-bold text-[#4338CA] hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        Domain Selection
                      </span>
                      <p className="text-sm font-bold text-[#131B2E]">
                        {selectedDomain ? (
                          <>
                            {selectedDomain.domain}{' '}
                            <span className="text-xs text-emerald-600 font-semibold">
                              ({selectedDomain.isIncluded ? 'Included' : `Upgrade: +₹${selectedDomain.upgradeAmount}`})
                            </span>
                          </>
                        ) : (
                          'Existing domain / Decide later'
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-xs font-bold text-[#4338CA] hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        Selected Add-ons ({calculatedPricing.selectedAddonsCount})
                      </span>
                      <p className="text-xs text-[#334155] font-medium mt-0.5">
                        {calculatedPricing.selectedAddonNames.length > 0
                          ? calculatedPricing.selectedAddonNames.join(', ')
                          : 'None selected'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-xs font-bold text-[#4338CA] hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Proceed to School Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 6: SCHOOL INFORMATION ───────────────────────────────── */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 6: Tell us about your school
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Provide basic institutional details to help us customize your setup and ensure compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      School / Institution Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.schoolName}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, schoolName: e.target.value }))
                      }
                      placeholder="e.g. St. Joseph Public School"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Institution Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={schoolInfo.schoolType}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, schoolType: e.target.value }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                    >
                      {SCHOOL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Affiliated Board <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={schoolInfo.board}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, board: e.target.value }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                    >
                      {BOARDS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      City / District <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.city}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="e.g. Motihari, Bettiah, Muzaffarpur"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.state}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="e.g. Bihar"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Approximate Student Strength <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolInfo.approximateStudents}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({
                          ...prev,
                          approximateStudents: e.target.value,
                        }))
                      }
                      placeholder="e.g. 450"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Current Website (Optional)
                    </label>
                    <input
                      type="text"
                      value={schoolInfo.currentWebsite}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({
                          ...prev,
                          currentWebsite: e.target.value,
                        }))
                      }
                      placeholder="e.g. https://oldschoolsite.com"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Specific Requirements or Current Challenges (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={schoolInfo.requirements}
                      onChange={(e) =>
                        setSchoolInfo((prev) => ({ ...prev, requirements: e.target.value }))
                      }
                      placeholder="Tell us about any specific workflows (e.g. CBSE report card format, online fee collection, or migration from older software)..."
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{submitError}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Continue to Contact Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 7: CONTACT INFORMATION ──────────────────────────────── */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 7: Official Contact Person
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Who should our school solutions team coordinate with regarding this quotation and implementation?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactInfo.fullName}
                      onChange={(e) =>
                        setContactInfo((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="e.g. Dr. A. K. Sharma"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Role / Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={contactInfo.designation}
                      onChange={(e) =>
                        setContactInfo((prev) => ({ ...prev, designation: e.target.value }))
                      }
                      placeholder="e.g. Principal, Director, Manager, IT Coordinator"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={contactInfo.email}
                      onChange={(e) =>
                        setContactInfo((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="e.g. principal@school.edu.in"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Mobile / Phone <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactInfo.phone}
                      onChange={(e) =>
                        setContactInfo((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="e.g. +91 98765 43210"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={contactInfo.whatsapp}
                      onChange={(e) =>
                        setContactInfo((prev) => ({ ...prev, whatsapp: e.target.value }))
                      }
                      placeholder="Leave empty if same as mobile"
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#131B2E] block">
                      Preferred Contact Method
                    </label>
                    <select
                      value={contactInfo.preferredContactMethod}
                      onChange={(e) =>
                        setContactInfo((prev) => ({
                          ...prev,
                          preferredContactMethod: e.target.value,
                        }))
                      }
                      className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-[#131B2E] focus:outline-none focus:border-[#4338CA]"
                    >
                      <option value="Phone Call">Phone Call</option>
                      <option value="WhatsApp Chat">WhatsApp Chat</option>
                      <option value="Email">Email</option>
                      <option value="Campus Visit / In-Person">Campus Visit / In-Person (Champaran)</option>
                    </select>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{submitError}</span>
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={goToNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                  >
                    <span>Review Final Summary</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 8: FINAL REVIEW & SUBMISSION ────────────────────────── */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Step 8: Final Review &amp; Request Submission
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Please review all submitted institutional specifications before dispatching your request to our engineering team.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* School & Contact Card */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                        School &amp; Contact
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(6)}
                        className="text-xs font-bold text-[#4338CA] hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="text-xs text-[#334155] space-y-1">
                      <p>
                        <strong>{schoolInfo.schoolName}</strong> ({schoolInfo.board}) &bull;{' '}
                        {schoolInfo.city}, {schoolInfo.state}
                      </p>
                      <p>
                        Approx. Strength: <strong>{schoolInfo.approximateStudents} students</strong>
                      </p>
                      <p>
                        Contact: <strong>{contactInfo.fullName}</strong> ({contactInfo.designation}) &bull;{' '}
                        <a href={`tel:${contactInfo.phone}`} className="text-[#4338CA]">
                          {contactInfo.phone}
                        </a>{' '}
                        &bull; {contactInfo.email}
                      </p>
                    </div>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
                        Configured Solution &amp; Pricing
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs font-bold text-[#4338CA] hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y divide-[#E2E8F0]">
                        <tr>
                          <td className="py-2 text-[#64748B]">Platform:</td>
                          <td className="py-2 text-right font-bold text-[#131B2E]">
                            {calculatedPricing.productName}
                            {calculatedPricing.studentTierLabel && (
                              <span className="text-[#64748B] block font-normal">
                                {calculatedPricing.studentTierLabel}
                              </span>
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-[#64748B]">Official Domain:</td>
                          <td className="py-2 text-right font-bold text-[#131B2E]">
                            {selectedDomain ? (
                              <>
                                {selectedDomain.domain}{' '}
                                <span className="text-emerald-600 block font-semibold text-[11px]">
                                  {selectedDomain.isIncluded
                                    ? 'Included in plan allowance'
                                    : `+₹${selectedDomain.upgradeAmount} upgrade`}
                                </span>
                              </>
                            ) : (
                              'To be decided / School-owned'
                            )}
                          </td>
                        </tr>
                        {calculatedPricing.selectedAddonNames.length > 0 && (
                          <tr>
                            <td className="py-2 text-[#64748B]">Selected Add-ons:</td>
                            <td className="py-2 text-right text-[#334155]">
                              {calculatedPricing.selectedAddonNames.join(', ')}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-2.5 font-extrabold text-[#131B2E]">
                            Estimated Year 1 Total:
                          </td>
                          <td className="py-2.5 text-right font-mono font-extrabold text-base text-[#4338CA]">
                            {calculatedPricing.totalEstimatedYearOne !== null
                              ? `₹${calculatedPricing.totalEstimatedYearOne.toLocaleString('en-IN')}`
                              : 'Custom Quotation'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-[#64748B]">Annual Renewal From:</td>
                          <td className="py-2 text-right font-mono font-bold text-xs text-[#334155]">
                            {calculatedPricing.totalRenewalFrom !== null
                              ? `₹${calculatedPricing.totalRenewalFrom.toLocaleString('en-IN')}/year`
                              : 'Custom Quotation'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={goToPrevStep}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#64748B] hover:text-[#131B2E] transition-colors disabled:opacity-50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 disabled:opacity-50"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying &amp; Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#F4C95D]" />
                        <span>Request School Solution</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ─── STEP 9: SUCCESS STATE ────────────────────────────────────── */}
            {currentStep === 9 && (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Enquiry Successfully Received
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
                    Thank You, {contactInfo.fullName}!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    We have logged your specifications for <strong>{schoolInfo.schoolName}</strong>. A verification confirmation has been sent to <strong>{contactInfo.email}</strong>.
                  </p>
                </div>

                {submittedResult?.verifiedPricing && (
                  <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-left space-y-1.5">
                    <p className="font-bold text-[#131B2E]">Summary of Logged Enquiry:</p>
                    <p className="text-[#475569]">
                      Solution: <strong>{submittedResult.verifiedPricing.productName}</strong>
                    </p>
                    {submittedResult.verifiedPricing.studentTierLabel && (
                      <p className="text-[#475569]">
                        Tier: <strong>{submittedResult.verifiedPricing.studentTierLabel}</strong>
                      </p>
                    )}
                    <p className="text-[#475569]">
                      Estimated Year 1:{' '}
                      <strong className="text-[#4338CA]">
                        {submittedResult.verifiedPricing.totalEstimatedYearOne !== null
                          ? `₹${submittedResult.verifiedPricing.totalEstimatedYearOne.toLocaleString('en-IN')}`
                          : 'Custom'}
                      </strong>
                    </p>
                  </div>
                )}

                {submittedResult?.whatsAppUrl && (
                  <div className="pt-2">
                    <a
                      href={submittedResult.whatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#25D366]/30"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Discuss on WhatsApp With Lead Engineer</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Sticky Live Price Summary */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white border-2 border-[#4338CA]/20 rounded-3xl p-6 shadow-xl shadow-[#4338CA]/5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] font-extrabold text-[#4338CA] uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
                  Your School Plan
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Transparent Estimate
                </span>
              </div>

              {/* Product Info */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Product
                </span>
                <h4 className="text-base font-extrabold text-[#131B2E]">
                  {calculatedPricing.productName}
                </h4>
                {calculatedPricing.studentTierLabel && (
                  <span className="text-xs text-[#4338CA] font-semibold block">
                    Capacity: {calculatedPricing.studentTierLabel}
                  </span>
                )}
              </div>

              {/* Domain Breakdown */}
              <div className="border-t border-[#E2E8F0] pt-3 space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Domain Allowance
                </span>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#334155]">
                    {selectedDomain ? selectedDomain.domain : 'Plan allowance'}
                  </span>
                  <span className="font-bold text-[#131B2E]">
                    ₹{calculatedPricing.annualDomainAllowance}/yr included
                  </span>
                </div>
                {selectedDomain && !selectedDomain.isIncluded && (
                  <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                    <span>Upgrade charge:</span>
                    <span>+₹{selectedDomain.upgradeAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Add-ons count */}
              {calculatedPricing.selectedAddonsCount > 0 && (
                <div className="border-t border-[#E2E8F0] pt-3">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Optional Add-ons
                  </span>
                  <span className="text-xs font-semibold text-[#131B2E]">
                    {calculatedPricing.selectedAddonsCount} module(s) selected
                  </span>
                </div>
              )}

              {/* Price Totals */}
              <div className="border-t-2 border-[#131B2E] pt-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#131B2E]">Estimated Year 1:</span>
                  <span className="text-2xl font-extrabold font-mono text-[#4338CA]">
                    {calculatedPricing.totalEstimatedYearOne !== null
                      ? `₹${calculatedPricing.totalEstimatedYearOne.toLocaleString('en-IN')}`
                      : 'Custom Quote'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs text-[#64748B]">
                  <span>Annual Renewal From:</span>
                  <span className="font-bold font-mono text-[#131B2E]">
                    {calculatedPricing.totalRenewalFrom !== null
                      ? `₹${calculatedPricing.totalRenewalFrom.toLocaleString('en-IN')}/year`
                      : 'Custom Quote'}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              {currentStep < 8 && (
                <button
                  type="button"
                  onClick={goToNextStep}
                  className="w-full py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20 flex items-center justify-center gap-1.5"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Reassurance text */}
              <div className="pt-2 text-[11px] text-[#64748B] space-y-1.5 border-t border-[#E2E8F0]">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Zero hidden costs. Full code ownership &amp; data privacy.</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />
                  <span>CBSE &amp; State Board compliance alignment.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
