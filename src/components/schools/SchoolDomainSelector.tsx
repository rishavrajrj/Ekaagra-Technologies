'use client';

import React, { useState, useId, useCallback, useEffect } from 'react';
import {
  Search,
  Globe,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  Edit3,
  X,
} from 'lucide-react';
import type {
  QuoteSelectedDomain,
  DomainHostingData,
  DomainChoice,
  DomainStatus,
} from '@/lib/types';
import type { DomainCheckResponse, DomainExtensionQuote } from '@/lib/domain/types';
import {
  normalizeDomainInput,
  validateDomainInput,
  SCHOOL_RECOMMENDED_EXTENSIONS,
} from '@/lib/domain/schoolDomain';
import {
  schoolDomainAllowances,
  type SchoolProductId,
} from '@/lib/schoolPricing';
import { trackSchoolEvent } from '@/lib/analytics';

export interface SchoolDomainSelectorProps {
  productId?: SchoolProductId | string;
  annualAllowance?: number;
  initialSchoolName?: string;
  // Onboarding Portal mode (full state persistence)
  domainData?: DomainHostingData;
  onChange?: (updated: DomainHostingData) => void;
  // Configurator mode props (individual hooks)
  selectedDomain?: QuoteSelectedDomain | null;
  skipDomainSelection?: boolean;
  existingOrLaterSubchoice?: 'existing' | 'later';
  existingDomainInput?: string;
  onSelectDomain?: (quote: DomainExtensionQuote) => void;
  onClearSelectedDomain?: () => void;
  onSkipDomainSelectionChange?: (skip: boolean) => void;
  onExistingOrLaterSubchoiceChange?: (subchoice: 'existing' | 'later') => void;
  onExistingDomainInputChange?: (val: string) => void;
  onConfirmExistingDomain?: (domain: string) => void;
  onDecideLater?: () => void;
  className?: string;
}

export default function SchoolDomainSelector({
  productId = 'school-complete',
  annualAllowance: customAllowance,
  initialSchoolName = '',
  // Onboarding mode
  domainData,
  onChange,
  // Configurator mode
  selectedDomain: propSelectedDomain,
  skipDomainSelection: propSkipDomainSelection,
  existingOrLaterSubchoice: propExistingOrLaterSubchoice,
  existingDomainInput: propExistingDomainInput,
  onSelectDomain,
  onClearSelectedDomain,
  onSkipDomainSelectionChange,
  onExistingOrLaterSubchoiceChange,
  onExistingDomainInputChange,
  onConfirmExistingDomain,
  onDecideLater,
  className = '',
}: SchoolDomainSelectorProps) {
  const domainInputId = useId();
  const searchErrorId = useId();
  const existingDomainErrorId = useId();

  // Determine effective annual domain allowance
  const allowance =
    customAllowance ??
    schoolDomainAllowances[productId as SchoolProductId] ??
    750;

  const isOnboardingMode = Boolean(domainData && onChange);

  // Derive initial values
  const currentDomainString = isOnboardingMode
    ? domainData?.preferredNewDomainName || domainData?.existingDomainName || ''
    : propSelectedDomain?.domain || '';

  const [domainSearchInput, setDomainSearchInput] = useState<string>(() => {
    if (currentDomainString) return currentDomainString;
    if (initialSchoolName) {
      const norm = normalizeDomainInput(initialSchoolName);
      return norm.suggestedDomains[0] || initialSchoolName;
    }
    return '';
  });

  const [isSearching, setIsSearching] = useState(false);
  const [domainCheckResponse, setDomainCheckResponse] = useState<DomainCheckResponse | null>(null);
  const [domainSearchError, setDomainSearchError] = useState<string | null>(null);
  const [isChangingDomain, setIsChangingDomain] = useState(false);

  // Local state for existing domain inputs in onboarding mode
  const [localExistingDomainInput, setLocalExistingDomainInput] = useState<string>(
    domainData?.existingDomainName || propExistingDomainInput || ''
  );
  const [existingDomainError, setExistingDomainError] = useState<string | null>(null);

  // Derive active selection state based on mode
  const effectiveSelectedDomain: QuoteSelectedDomain | null = isOnboardingMode
    ? domainData?.selectedDomainQuote ||
      (domainData?.preferredNewDomainName && domainData?.domainChoice === 'NEW_DOMAIN'
        ? {
            domain: domainData.preferredNewDomainName,
            provider: 'Registrar Live Verification',
            sourceCurrency: 'INR',
            period: 1,
            registrationPeriod: '1 year',
            annualAllowance: allowance,
            termAllowance: allowance,
            upgradeAmount: 0,
            premium: false,
            isIncluded: true,
            domainChoice: 'NEW_DOMAIN',
            domainStatus: 'AVAILABLE',
            isPriceVerified: false,
          }
        : domainData?.alreadyOwnsDomain && domainData?.existingDomainName
        ? {
            domain: domainData.existingDomainName,
            provider: 'Existing Domain (School Owned)',
            sourceCurrency: 'INR',
            period: 1,
            registrationPeriod: '1 year',
            annualAllowance: allowance,
            termAllowance: allowance,
            upgradeAmount: 0,
            premium: false,
            isIncluded: true,
            domainChoice: 'EXISTING_DOMAIN',
            domainStatus: 'EXISTING',
            isPriceVerified: true,
          }
        : null)
    : propSelectedDomain || null;

  const effectiveSkipDomainSelection = isOnboardingMode
    ? Boolean(
        domainData?.decideLater ||
        domainData?.alreadyOwnsDomain ||
        domainData?.domainChoice === 'DECIDE_LATER' ||
        domainData?.domainChoice === 'EXISTING_DOMAIN'
      )
    : Boolean(propSkipDomainSelection);

  const effectiveSubchoice: 'existing' | 'later' = isOnboardingMode
    ? domainData?.alreadyOwnsDomain || domainData?.domainChoice === 'EXISTING_DOMAIN'
      ? 'existing'
      : 'later'
    : propExistingOrLaterSubchoice || 'existing';

  const effectiveExistingDomainInput = isOnboardingMode
    ? localExistingDomainInput
    : propExistingDomainInput || '';

  // Synchronize local input if prop changes
  useEffect(() => {
    if (domainData?.existingDomainName) {
      setLocalExistingDomainInput(domainData.existingDomainName);
    }
  }, [domainData?.existingDomainName]);

  // Execute domain search & live availability check
  const handleDomainSearch = useCallback(
    async (e?: React.FormEvent, overrideQuery?: string) => {
      if (e) e.preventDefault();
      const query = (overrideQuery ?? domainSearchInput).trim();

      if (!query || query.length < 2) {
        setDomainSearchError('Please enter at least 2 characters (e.g. school name or preferred domain).');
        return;
      }

      const validation = validateDomainInput(query);
      if (!validation.isValid) {
        setDomainSearchError(validation.error || 'Please enter a valid school name or domain.');
        return;
      }

      const normalizedRes = normalizeDomainInput(query);
      setDomainSearchError(null);
      setIsSearching(true);

      trackSchoolEvent('school_domain_search', normalizedRes.normalized);

      try {
        const res = await fetch('/api/domain/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: normalizedRes.normalized,
            selectedPlanId: productId,
            businessCategory: 'school',
            annualAllowance: allowance,
          }),
        });

        if (!res.ok) {
          throw new Error('Registrar query returned unexpected response.');
        }

        const data: DomainCheckResponse = await res.json();
        setDomainCheckResponse(data);
      } catch (err: unknown) {
        console.warn('Live domain check fallback engaged:', err);
        // Fallback: Generate candidates so user can select preferred domain without obstruction
        const fallbackQuotes: DomainExtensionQuote[] = [];
        if (normalizedRes.isSpecificDomain) {
          const ext =
            normalizedRes.explicitTld ||
            normalizedRes.normalized.slice(normalizedRes.normalized.indexOf('.'));
          fallbackQuotes.push({
            domain: normalizedRes.normalized,
            extension: ext,
            availability: 'PRECHECK_REQUIRED',
            sourceCurrency: 'INR',
            period: 1,
            registrationPeriod: '1 year',
            hasFxConversion: false,
            currency: 'INR',
            premium: false,
            isRequestedDomain: true,
            planAllowance: allowance,
            termAllowance: allowance,
            included: true,
            upgradeAmount: 0,
            recommendationBadge: 'Requested Domain',
            recommendationReason: 'Availability will be verified during domain registration.',
          });
        }

        for (const candidateDomain of normalizedRes.suggestedDomains) {
          if (candidateDomain.toLowerCase() === normalizedRes.normalized.toLowerCase()) continue;
          const ext = candidateDomain.slice(candidateDomain.indexOf('.'));
          const rec = SCHOOL_RECOMMENDED_EXTENSIONS.find((r) => r.extension === ext);
          fallbackQuotes.push({
            domain: candidateDomain,
            extension: ext,
            availability: 'PRECHECK_REQUIRED',
            sourceCurrency: 'INR',
            period: 1,
            registrationPeriod: '1 year',
            hasFxConversion: false,
            currency: 'INR',
            premium: false,
            isRequestedDomain: false,
            planAllowance: allowance,
            termAllowance: allowance,
            included: true,
            upgradeAmount: 0,
            recommendationBadge: (rec?.badge as any) || 'Good for India',
            recommendationReason: rec?.reason || 'Availability will be verified during domain registration.',
          });
        }

        setDomainCheckResponse({
          query,
          sanitizedName: normalizedRes.cleanLabel,
          requestedDomain: normalizedRes.isSpecificDomain ? normalizedRes.normalized : null,
          requestedDomainAvailable: null,
          selectedPlanId: productId,
          planAllowance: allowance,
          isLiveChecked: false,
          status: 'PRECHECK_REQUIRED',
          topRecommendation: fallbackQuotes[0] || null,
          results: fallbackQuotes,
          suggestionsUsed: true,
          disclaimer: 'Your preferred domain will be verified during domain registration.',
          instructions: 'Availability will be verified during domain registration.',
        });
      } finally {
        setIsSearching(false);
      }
    },
    [domainSearchInput, productId, allowance]
  );

  // Auto-search on initial mount if no selection is made yet but an initial domain or school name is present
  useEffect(() => {
    if (!effectiveSelectedDomain && !domainCheckResponse && domainSearchInput.trim().length >= 2) {
      handleDomainSearch(undefined, domainSearchInput);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle selecting a candidate quote
  const handleSelectQuote = (quote: DomainExtensionQuote) => {
    const period = quote.period || 1;
    const termAllowance = allowance * period;
    const cost = quote.registrationPrice || quote.effectiveAnnualPrice || 0;
    const isLiveAvailable = quote.availability === 'AVAILABLE';
    const isVerified = isLiveAvailable && cost > 0;
    const status: DomainStatus = isLiveAvailable
      ? 'available'
      : quote.availability === 'UNAVAILABLE'
      ? 'unavailable'
      : 'verification_required';

    const normalizedResult = normalizeDomainInput(quote.domain);
    const normalizedDomain = normalizedResult.normalized;

    const quoteObj: QuoteSelectedDomain = {
      domain: normalizedDomain,
      provider: isLiveAvailable ? 'GoDaddy Domains API v3' : 'Registrar Verification Required',
      sourceAmount: quote.sourceAmount,
      sourceCurrency: quote.sourceCurrency || 'INR',
      estimatedINR: isVerified ? cost : undefined,
      period,
      registrationPeriod: quote.registrationPeriod || '1 year',
      renewalPrice: quote.renewalPrice,
      annualAllowance: allowance,
      termAllowance,
      upgradeAmount: isVerified ? Math.max(0, cost - termAllowance) : 0,
      premium: Boolean(quote.premium),
      isIncluded: isVerified ? cost <= termAllowance : true,
      recommendationBadge: quote.recommendationBadge,
      recommendationReason: quote.recommendationReason,
      domainChoice: 'NEW_DOMAIN',
      domainStatus: isLiveAvailable ? 'AVAILABLE' : 'PRECHECK_REQUIRED',
      isPriceVerified: isVerified,
    };

    setIsChangingDomain(false);
    setDomainSearchError(null);

    trackSchoolEvent('school_domain_selected', normalizedDomain, {
      upgradeAmount: quoteObj.upgradeAmount,
      isIncluded: quoteObj.isIncluded,
      status,
    });

    if (isOnboardingMode && onChange && domainData) {
      onChange({
        ...domainData,
        alreadyOwnsDomain: false,
        needsNewDomain: true,
        preferredNewDomainName: normalizedDomain,
        preferredDomain: normalizedDomain,
        existingDomainName: '',
        domainChoice: 'NEW_DOMAIN',
        decideLater: false,
        selectedDomainQuote: quoteObj,
      });
    }

    if (onSelectDomain) {
      onSelectDomain(quote);
    }
  };

  // Handle confirming an existing school-owned domain
  const handleConfirmExistingDomain = (inputDomain: string) => {
    const valResult = validateDomainInput(inputDomain, { requireFullDomain: true });
    if (!valResult.isValid) {
      setExistingDomainError(valResult.error || 'Please enter a valid domain (e.g. myschool.com or myschool.edu.in).');
      return;
    }

    const norm = normalizeDomainInput(inputDomain);
    const normalizedDomain = norm.normalized;

    const quoteObj: QuoteSelectedDomain = {
      domain: normalizedDomain,
      provider: 'Existing Domain (School Owned)',
      sourceCurrency: 'INR',
      period: 1,
      registrationPeriod: '1 year',
      annualAllowance: allowance,
      termAllowance: allowance,
      upgradeAmount: 0,
      premium: false,
      isIncluded: true,
      domainChoice: 'EXISTING_DOMAIN',
      domainStatus: 'EXISTING',
      isPriceVerified: true,
    };

    setExistingDomainError(null);
    setDomainSearchError(null);
    trackSchoolEvent('school_domain_selected', normalizedDomain, { type: 'existing' });

    if (isOnboardingMode && onChange && domainData) {
      onChange({
        ...domainData,
        alreadyOwnsDomain: true,
        needsNewDomain: false,
        existingDomainName: normalizedDomain,
        preferredDomain: normalizedDomain,
        preferredNewDomainName: '',
        domainChoice: 'EXISTING_DOMAIN',
        decideLater: false,
        selectedDomainQuote: quoteObj,
      });
    }

    if (onConfirmExistingDomain) {
      onConfirmExistingDomain(normalizedDomain);
    }
  };

  // Handle selecting "We will decide later"
  const handleSelectDecideLater = () => {
    setExistingDomainError(null);
    setDomainSearchError(null);
    trackSchoolEvent('school_domain_selected', 'decide_later', { type: 'later' });

    if (isOnboardingMode && onChange && domainData) {
      onChange({
        ...domainData,
        alreadyOwnsDomain: false,
        needsNewDomain: false,
        existingDomainName: '',
        preferredNewDomainName: '',
        preferredDomain: '',
        domainChoice: 'DECIDE_LATER',
        decideLater: true,
        selectedDomainQuote: null,
      });
    }

    if (onDecideLater) {
      onDecideLater();
    }
    if (onClearSelectedDomain) {
      onClearSelectedDomain();
    }
  };

  // Toggle skipDomainSelection
  const handleToggleSkipDomain = (checked: boolean) => {
    if (isOnboardingMode && onChange && domainData) {
      if (checked) {
        if (effectiveSubchoice === 'later') {
          handleSelectDecideLater();
        } else if (localExistingDomainInput.trim()) {
          handleConfirmExistingDomain(localExistingDomainInput);
        } else {
          onChange({
            ...domainData,
            alreadyOwnsDomain: true,
            needsNewDomain: false,
            domainChoice: 'EXISTING_DOMAIN',
            decideLater: false,
          });
        }
      } else {
        onChange({
          ...domainData,
          alreadyOwnsDomain: false,
          needsNewDomain: true,
          domainChoice: undefined,
          decideLater: false,
          selectedDomainQuote: null,
          existingDomainName: '',
          preferredNewDomainName: '',
          preferredDomain: '',
        });
      }
    }

    if (onSkipDomainSelectionChange) {
      onSkipDomainSelectionChange(checked);
    }
  };

  // Switch between "existing" and "later" subchoices
  const handleSubchoiceChange = (subchoice: 'existing' | 'later') => {
    if (subchoice === 'later') {
      handleSelectDecideLater();
    } else {
      if (localExistingDomainInput.trim()) {
        handleConfirmExistingDomain(localExistingDomainInput);
      } else if (isOnboardingMode && onChange && domainData) {
        onChange({
          ...domainData,
          alreadyOwnsDomain: true,
          needsNewDomain: false,
          domainChoice: 'EXISTING_DOMAIN',
          decideLater: false,
          selectedDomainQuote: null,
        });
      }
    }

    if (onExistingOrLaterSubchoiceChange) {
      onExistingOrLaterSubchoiceChange(subchoice);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. SELECTED DOMAIN HERO CARD (If user already made a selection and is not actively editing) */}
      {effectiveSelectedDomain && !isChangingDomain && !effectiveSkipDomainSelection && (
        <div className="p-5 rounded-2xl bg-white border-2 border-[#4338CA] shadow-md shadow-[#4338CA]/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#4338CA] flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#4338CA]" />
              SELECTED DOMAIN
            </span>
            <button
              type="button"
              onClick={() => {
                setIsChangingDomain(true);
                setDomainSearchInput(effectiveSelectedDomain.domain);
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Change Domain</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h4 className="text-xl font-mono font-extrabold text-[#131B2E]">
                {effectiveSelectedDomain.domain}
              </h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {effectiveSelectedDomain.domainStatus === 'available' ||
                effectiveSelectedDomain.domainStatus === 'AVAILABLE' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" />
                    Available
                  </span>
                ) : effectiveSelectedDomain.domainChoice === 'existing' ||
                  effectiveSelectedDomain.domainChoice === 'EXISTING_DOMAIN' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    <Check className="w-3 h-3" />
                    Existing Institutional Domain
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    Availability verification required
                  </span>
                )}

                {effectiveSelectedDomain.recommendationBadge && (
                  <span className="text-[10px] font-semibold text-[#64748B] bg-[#FAF7F2] border border-[#E2E8F0] px-2 py-0.5 rounded-full">
                    {effectiveSelectedDomain.recommendationBadge}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right">
              {effectiveSelectedDomain.isPriceVerified &&
              typeof effectiveSelectedDomain.estimatedINR === 'number' &&
              effectiveSelectedDomain.estimatedINR > 0 ? (
                effectiveSelectedDomain.isIncluded ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                    ✓ Included in Plan Allowance
                  </span>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-[#4338CA] block">
                      +₹{effectiveSelectedDomain.upgradeAmount.toLocaleString('en-IN')} Upgrade
                    </span>
                    <span className="text-[10px] text-[#64748B] block">
                      Domain Price: ₹{effectiveSelectedDomain.estimatedINR.toLocaleString('en-IN')}/year
                    </span>
                  </div>
                )
              ) : effectiveSelectedDomain.domainChoice === 'existing' ||
                effectiveSelectedDomain.domainChoice === 'EXISTING_DOMAIN' ? (
                <span className="text-xs font-semibold text-[#64748B]">
                  Zero domain charges applicable
                </span>
              ) : (
                <div>
                  <span className="text-xs font-bold text-[#4338CA] block">
                    Plan Allowance: ₹{allowance}/year included
                  </span>
                  <span className="text-[10px] text-[#64748B] block">
                    Pricing verified during registration
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. DOMAIN SEARCH & NORMALIZATION BOX */}
      {(!effectiveSelectedDomain || isChangingDomain) && !effectiveSkipDomainSelection && (
        <form onSubmit={handleDomainSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id={domainInputId}
                type="text"
                value={domainSearchInput}
                onChange={(e) => {
                  setDomainSearchInput(e.target.value);
                  setDomainSearchError(null);
                }}
                placeholder="Search your preferred domain (e.g. sparknestacademy.com)"
                aria-label="Search your preferred domain"
                aria-invalid={Boolean(domainSearchError)}
                aria-describedby={domainSearchError ? searchErrorId : undefined}
                className={`w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-9 ${
                  domainSearchInput ? 'pr-9' : 'pr-4'
                } py-3 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 transition`}
              />
              {domainSearchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setDomainSearchInput('');
                    setDomainSearchError(null);
                    const input = document.getElementById(domainInputId);
                    if (input) input.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#94A3B8] hover:text-[#131B2E] rounded-md transition cursor-pointer"
                  aria-label="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>CHECK DOMAIN</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] px-1">
            <span>
              e.g. <em>sparknetacademy.com</em>, <em>sparknetacademy.org</em>, or <em>myschool.in</em>
            </span>
            {isChangingDomain && effectiveSelectedDomain && (
              <button
                type="button"
                onClick={() => {
                  setIsChangingDomain(false);
                  setDomainSearchInput(effectiveSelectedDomain.domain);
                }}
                className="text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
              >
                Keep Current ({effectiveSelectedDomain.domain})
              </button>
            )}
          </div>

          {domainSearchError && (
            <div
              id={searchErrorId}
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{domainSearchError}</span>
            </div>
          )}
        </form>
      )}

      {/* 3. RECOMMENDED DOMAINS RESULTS */}
      {(!effectiveSelectedDomain || isChangingDomain) &&
        !effectiveSkipDomainSelection &&
        domainCheckResponse &&
        domainCheckResponse.results.length > 0 && (
          <div className="space-y-3 pt-2">
            {/* Explicit Requested Domain Feedback Banner */}
            {domainCheckResponse.requestedDomain && (
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                  domainCheckResponse.requestedDomainAvailable === false
                    ? 'bg-rose-50/90 border-rose-200 text-rose-800'
                    : domainCheckResponse.requestedDomainAvailable === true
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                    : 'bg-indigo-50/90 border-indigo-200 text-indigo-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {domainCheckResponse.requestedDomainAvailable === false ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : domainCheckResponse.requestedDomainAvailable === true ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold font-mono">
                      {domainCheckResponse.requestedDomain}
                    </span>{' '}
                    <span>
                      {domainCheckResponse.requestedDomainAvailable === false
                        ? 'is currently taken or unavailable. Review available alternative recommendations below.'
                        : domainCheckResponse.requestedDomainAvailable === true
                        ? 'is verified available! You can select it below or choose an alternative.'
                        : 'availability will be verified during registration. You can select it as your preferred domain below.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">
                RECOMMENDED DOMAINS
              </span>
              <span className="text-[11px] text-[#64748B]">
                Choose your institution’s preferred web address
              </span>
            </div>

            <div className="space-y-2.5">
              {domainCheckResponse.results.map((quote) => {
                const isSelected = effectiveSelectedDomain?.domain === quote.domain;
                const period = quote.period || 1;
                const termAllowance = allowance * period;
                const cost = quote.registrationPrice || quote.effectiveAnnualPrice || 0;
                const isLiveAvailable = quote.availability === 'AVAILABLE';
                const isUnavailable = quote.availability === 'UNAVAILABLE';
                const upgrade = Math.max(0, cost - termAllowance);
                const isIncluded = cost <= termAllowance;

                return (
                  <div
                    key={quote.domain}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#4338CA] bg-[#FAF7F2] ring-1 ring-[#4338CA]'
                        : isUnavailable
                        ? 'border-[#E2E8F0] bg-[#FAF7F2]/70 opacity-80'
                        : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-[#131B2E]">
                          {quote.domain}
                        </span>
                        {quote.recommendationBadge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {quote.recommendationBadge}
                          </span>
                        )}
                      </div>

                      {/* Status Message */}
                      {isLiveAvailable ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Available</span>
                          {cost > 0 && (
                            <span className="text-[#64748B] font-normal">
                              &bull; Domain price: ₹{cost.toLocaleString('en-IN')}/year
                            </span>
                          )}
                        </div>
                      ) : isUnavailable ? (
                        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                          <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Currently unavailable</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Availability will be verified during registration.</span>
                        </div>
                      )}

                      {quote.recommendationReason && !isUnavailable && (
                        <p className="text-[11px] text-[#64748B]">
                          {quote.recommendationReason}
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                      {isLiveAvailable && cost > 0 ? (
                        isIncluded ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Included in Plan
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-[#4338CA]">
                            +₹{upgrade.toLocaleString('en-IN')} Upgrade
                          </span>
                        )
                      ) : null}

                      {isLiveAvailable ? (
                        <button
                          type="button"
                          onClick={() => handleSelectQuote(quote)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#4338CA] text-white shadow-xs'
                              : 'bg-[#4338CA]/10 text-[#4338CA] hover:bg-[#4338CA] hover:text-white'
                          }`}
                        >
                          {isSelected ? '✓ Selected' : 'Select Domain'}
                        </button>
                      ) : isUnavailable ? (
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(domainInputId);
                            if (input) input.focus();
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#131B2E] border border-[#CBD5E1] hover:border-[#94A3B8] hover:bg-[#FAF7F2] cursor-pointer"
                        >
                          Try Another Domain
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectQuote(quote)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#4338CA] text-white shadow-xs'
                              : 'bg-white border-2 border-[#4338CA] text-[#4338CA] hover:bg-[#4338CA] hover:text-white shadow-xs'
                          }`}
                        >
                          {isSelected ? '✓ Selected Preferred' : 'Select as Preferred Domain'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* 4. DOMAIN ALLOWANCE BOX */}
      <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5 text-xs text-[#334155]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#4338CA] shrink-0" />
          <span className="font-extrabold uppercase tracking-wider text-[#4338CA]">
            DOMAIN ALLOWANCE
          </span>
        </div>
        <p className="font-bold text-[#131B2E]">
          ₹{allowance}/year domain allowance included in your plan.
        </p>
        <p className="text-[#64748B] leading-relaxed">
          Your plan includes ₹{allowance}/year toward your domain. If the domain costs more than ₹{allowance}/year, you only pay the difference. The allowance applies only to the eligible annual domain cost and does not reduce the base website plan price.
        </p>
      </div>

      {/* 5. EXISTING DOMAIN OR DECIDE LATER WORKFLOW */}
      <div className="pt-1 space-y-3">
        <label className="flex items-start gap-2.5 text-xs text-[#334155] font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={effectiveSkipDomainSelection}
            onChange={(e) => handleToggleSkipDomain(e.target.checked)}
            className="w-4 h-4 rounded text-[#4338CA] focus:ring-[#4338CA] border-[#CBD5E1] mt-0.5 cursor-pointer"
          />
          <span>Our school already owns a domain OR we will decide the domain later.</span>
        </label>

        {effectiveSkipDomainSelection && (
          <div className="p-4 rounded-2xl bg-white border border-[#CBD5E1] space-y-3.5 pl-5 sm:pl-6">
            <span className="text-xs font-bold text-[#131B2E] uppercase tracking-wider block">
              Domain option:
            </span>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-[#334155] font-medium cursor-pointer">
                <input
                  type="radio"
                  name="existingOrLaterRadio"
                  checked={effectiveSubchoice === 'existing'}
                  onChange={() => handleSubchoiceChange('existing')}
                  className="text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                />
                <span>We already own a domain</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-[#334155] font-medium cursor-pointer">
                <input
                  type="radio"
                  name="existingOrLaterRadio"
                  checked={effectiveSubchoice === 'later'}
                  onChange={() => handleSubchoiceChange('later')}
                  className="text-[#4338CA] focus:ring-[#4338CA] cursor-pointer"
                />
                <span>We will decide the domain later</span>
              </label>
            </div>

            {/* Sub-Option A: "We already own a domain" */}
            {effectiveSubchoice === 'existing' && (
              <div className="space-y-2 pt-1 border-t border-[#E2E8F0]">
                <label htmlFor="existing-domain-input" className="text-xs font-bold text-[#131B2E] block">
                  Enter your existing domain *
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="existing-domain-input"
                    type="text"
                    value={effectiveExistingDomainInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLocalExistingDomainInput(val);
                      setExistingDomainError(null);
                      if (onExistingDomainInputChange) {
                        onExistingDomainInputChange(val);
                      }
                    }}
                    placeholder="e.g. www.myschool.com or myschool.edu.in"
                    aria-invalid={Boolean(existingDomainError)}
                    aria-describedby={existingDomainError ? existingDomainErrorId : undefined}
                    className="flex-1 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#131B2E] placeholder-[#94A3B8] focus:outline-hidden focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmExistingDomain(effectiveExistingDomainInput)}
                    className="px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Confirm Existing Domain
                  </button>
                </div>

                {existingDomainError && (
                  <p id={existingDomainErrorId} role="alert" className="text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{existingDomainError}</span>
                  </p>
                )}

                {((isOnboardingMode && domainData?.alreadyOwnsDomain && domainData?.existingDomainName) ||
                  (!isOnboardingMode && effectiveSelectedDomain && effectiveSelectedDomain.domainChoice === 'existing')) && (
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Confirmed: {isOnboardingMode ? domainData?.existingDomainName : effectiveSelectedDomain?.domain} (We will connect DNS during onboarding)
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Sub-Option B: "We will decide later" */}
            {effectiveSubchoice === 'later' && (
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-[#64748B] space-y-1">
                <p className="font-bold text-[#131B2E] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Domain selection can be completed later.</span>
                </p>
                <p className="leading-relaxed">
                  You can continue configuring your school website, and our team will coordinate domain setup during onboarding.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. DOMAIN REGISTRATION / CONFIGURATION VERIFICATION NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-amber-950">
          <Clock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Domain verification</span>
        </p>
        <p className="leading-relaxed">
          Your preferred domain will be verified during registration or configuration. You can select a preferred domain now, or continue without choosing one.
        </p>
      </div>
    </div>
  );
}
