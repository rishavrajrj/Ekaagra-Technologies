'use client';

import { useState, useId } from 'react';
import Link from 'next/link';
import {
  Globe,
  Search,
  ArrowRight,
  Check,
  AlertCircle,
  Info,
  Sparkles,
  Award,
  Tag,
  Clock,
  ShieldAlert,
  Loader2,
  XCircle,
  CheckCircle2,
  Star,
} from 'lucide-react';
import {
  planDomainAllowances,
  domainPricingStrategy,
  domainExtensionOptions,
} from '@/lib/data';
import type {
  DomainCheckResponse,
  DomainExtensionQuote,
} from '@/lib/domain/types';
import Reveal from '@/components/motion/Reveal';

interface DomainStrategySectionProps {
  className?: string;
  defaultPlanId?: string;
}

const BUSINESS_CATEGORIES = [
  { id: 'school', label: 'School / Academy' },
  { id: 'business', label: 'Business / Retail' },
  { id: 'tech', label: 'Technology / Startup' },
  { id: 'general', label: 'General Organization' },
];

type SearchPhase =
  | 'IDLE'
  | 'SEARCHING_DIRECT'
  | 'SEARCHING_SUGGESTIONS'
  | 'PROCESSING_RESULTS'
  | 'COMPLETED';

export function DomainStrategySection({
  className = '',
  defaultPlanId = 'starter',
}: DomainStrategySectionProps) {
  const searchInputId = useId();
  const [domainInput, setDomainInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(defaultPlanId);
  const [category, setCategory] = useState('general');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('IDLE');
  const [hasSearched, setHasSearched] = useState(false);
  const [checkResult, setCheckResult] = useState<DomainCheckResponse | null>(null);

  const runDomainCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = domainInput.trim();
    if (!clean) return;

    setHasSearched(true);
    setSearchPhase('SEARCHING_DIRECT');

    // Simulate progressive status text while waiting for server response
    const sugTimer = setTimeout(() => {
      setSearchPhase('SEARCHING_SUGGESTIONS');
    }, 1500);

    const procTimer = setTimeout(() => {
      setSearchPhase('PROCESSING_RESULTS');
    }, 3200);

    try {
      const res = await fetch('/api/domain/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: clean,
          selectedPlanId: selectedPlan,
          businessCategory: category,
        }),
      });

      clearTimeout(sugTimer);
      clearTimeout(procTimer);

      if (res.ok) {
        const data = (await res.json()) as DomainCheckResponse;
        setCheckResult(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setCheckResult({
          query: clean,
          sanitizedName: clean,
          requestedDomain: null,
          requestedDomainAvailable: null,
          selectedPlanId: selectedPlan,
          planAllowance: planDomainAllowances[selectedPlan] ?? 0,
          isLiveChecked: false,
          status: 'ERROR',
          errorMessage: errData.error || 'Unable to connect to domain registrar.',
          topRecommendation: null,
          results: [],
          suggestionsUsed: false,
          disclaimer: domainPricingStrategy.disclaimer,
          instructions: 'Please try again or submit your preferred domain in your quote request.',
        });
      }
    } catch (err) {
      clearTimeout(sugTimer);
      clearTimeout(procTimer);
      console.error('Failed to query domain allowance', err);
      setCheckResult({
        query: clean,
        sanitizedName: clean,
        requestedDomain: null,
        requestedDomainAvailable: null,
        selectedPlanId: selectedPlan,
        planAllowance: planDomainAllowances[selectedPlan] ?? 0,
        isLiveChecked: false,
        status: 'PROVIDER_UNAVAILABLE',
        errorMessage:
          'Domain registrar timed out or is temporarily unreachable. Availability and pricing will be confirmed before registration.',
        topRecommendation: null,
        results: [],
        suggestionsUsed: false,
        disclaimer: domainPricingStrategy.disclaimer,
        instructions: 'Please try again or submit your preferred domain in your quote request.',
      });
    } finally {
      setSearchPhase('COMPLETED');
    }
  };

  const currentAllowance = planDomainAllowances[selectedPlan] ?? 0;
  const isFreePlan = selectedPlan === 'free-launch';
  const planName =
    selectedPlan === 'starter'
      ? 'Starter Website'
      : selectedPlan === 'launch-plus'
      ? 'Launch Plus'
      : 'Free Launch';

  const isSearching = searchPhase !== 'IDLE' && searchPhase !== 'COMPLETED';

  const topRec = checkResult?.topRecommendation || null;
  const otherOptions = checkResult?.results.filter((r) => r.domain !== topRec?.domain) || [];

  return (
    <section
      id="domain-search"
      className={`py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#F5F0E8] relative overflow-hidden ${className}`}
    >
      <div className="site-container relative z-10 space-y-8">
        {/* Section Heading */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <Globe className="w-3.5 h-3.5 text-[#F97360]" />
              TERM-AWARE DOMAIN PRICING SYSTEM
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Domain Included Based on Your Plan
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Choose any available domain within your plan’s included price allowance. If you choose a higher-priced domain, simply pay the difference.
            </p>
          </div>
        </Reveal>

        {/* Main Explorer Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-5 sm:p-8 border border-[#E2E8F0] shadow-xl space-y-6">
          {/* Top Bar: Plan Allowance Indicator */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E]">
                Select Website Plan to Test Allowance
              </h3>
              <p className="text-xs text-[#64748B]">
                Allowance applies automatically to any available domain extension.
              </p>
            </div>

            {/* Plan Switcher Pills */}
            <div className="flex flex-wrap items-center bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E2E8F0] text-xs font-bold gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('free-launch');
                  if (hasSearched && domainInput.trim()) {
                    runDomainCheck();
                  }
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedPlan === 'free-launch'
                    ? 'bg-[#131B2E] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Free Launch (₹0)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('launch-plus');
                  if (hasSearched && domainInput.trim()) {
                    runDomainCheck();
                  }
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedPlan === 'launch-plus'
                    ? 'bg-[#4338CA] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Launch Plus (₹300/yr)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlan('starter');
                  if (hasSearched && domainInput.trim()) {
                    runDomainCheck();
                  }
                }}
                className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  selectedPlan === 'starter'
                    ? 'bg-[#4338CA] text-white shadow-sm'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Starter Website (₹500/yr)
              </button>
            </div>
          </div>

          {/* Business Category Context Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#4338CA] shrink-0" />
              <span className="text-xs font-bold text-[#131B2E]">Business Context:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {BUSINESS_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    if (hasSearched && domainInput.trim()) {
                      runDomainCheck();
                    }
                  }}
                  className={`text-[11px] font-semibold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-white text-[#4338CA] border-[#4338CA]/40 shadow-xs font-bold'
                      : 'bg-transparent text-[#64748B] border-transparent hover:bg-white/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={runDomainCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Enter your preferred business name or domain
              </label>
              <input
                id={searchInputId}
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="Enter business name or domain (e.g. sparknest or sparknestacademy.com)"
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl pl-11 pr-4 py-3.5 text-sm text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="inline-flex items-center justify-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer disabled:opacity-60"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search Domain</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Active Plan Allowance Pill Indicator */}
          {isFreePlan ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Free Launch Hosted URL:</strong> The Free Launch plan includes production hosting on an Ekaagra subdomain (e.g.{' '}
                <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-mono font-bold">
                  {domainInput.trim() ? `${domainInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}.ekaagratechnologies.site` : 'business.ekaagratechnologies.site'}
                </code>
                ). No custom domain allowance is provided on Free Launch. To connect your own custom domain, choose{' '}
                <strong className="font-bold">Launch Plus (₹300 domain allowance)</strong> or{' '}
                <strong className="font-bold">Starter Website (₹500 domain allowance)</strong>.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Active Plan Allowance:{' '}
                  <strong className="font-bold text-emerald-900 text-sm">
                    ₹{currentAllowance}/year
                  </strong>{' '}
                  ({planName})
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-medium">
                Allowance multiplies by registration term (e.g. ₹{currentAllowance * 2} for 2 years).
              </span>
            </div>
          )}

          {/* 1. STATE: Progressive Search Loading Indicators */}
          {isSearching && (
            <div className="p-8 text-center space-y-3 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0]">
              <Loader2 className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
              <p className="text-sm font-extrabold text-[#131B2E]">
                {searchPhase === 'SEARCHING_DIRECT' && 'Checking domain availability...'}
                {searchPhase === 'SEARCHING_SUGGESTIONS' && 'Finding available domain alternatives...'}
                {searchPhase === 'PROCESSING_RESULTS' && 'Preparing domain prices and recommendations...'}
              </p>
              <p className="text-xs text-[#64748B]">
                Querying GoDaddy v3 registrar endpoints and calculating term-aware allowances.
              </p>
            </div>
          )}

          {/* 2. STATE: PRECHECK_REQUIRED (When live registrar credentials not configured) */}
          {!isSearching && hasSearched && checkResult?.status === 'PRECHECK_REQUIRED' && (
            <div className="p-6 rounded-3xl bg-amber-50/70 border border-amber-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-800 flex items-center justify-center mx-auto border border-amber-500/20">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>

              <div className="space-y-1.5 max-w-xl mx-auto">
                <h4 className="text-base font-extrabold text-[#131B2E]">
                  Live Domain Pricing Currently Unavailable
                </h4>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  Live domain pricing is currently unavailable. Domain availability and final pricing will be confirmed before registration.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200/80 text-left max-w-lg mx-auto space-y-2 text-xs text-[#334155]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-[#64748B]">Selected Plan Allowance:</span>
                  <span className="font-bold text-[#131B2E]">
                    {isFreePlan ? 'None (Hosted Subdomain)' : `₹${currentAllowance}/year (${planName})`}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Include your desired domain (e.g. <strong>{domainInput.trim() || 'yourbrand'}</strong>) in your quote request. Our team will verify real-time registrar availability and apply your full ₹{currentAllowance} plan allowance to the final quote.
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href={`/get-quote?plan=${selectedPlan}&domain=${encodeURIComponent(domainInput.trim())}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer"
                >
                  <span>Request Domain Verification in Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* 3. STATE: RATE_LIMITED */}
          {!isSearching && hasSearched && checkResult?.status === 'RATE_LIMITED' && (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2">
              <ShieldAlert className="w-6 h-6 text-red-600 mx-auto" />
              <h4 className="text-sm font-bold text-red-950">Domain search is temporarily busy</h4>
              <p className="text-xs text-red-800">
                Please try again shortly, or proceed to request a quote with your preferred domain name.
              </p>
            </div>
          )}

          {/* 4. STATE: ERROR / PROVIDER_UNAVAILABLE / AUTH_ERROR */}
          {!isSearching &&
            hasSearched &&
            (checkResult?.status === 'PROVIDER_UNAVAILABLE' ||
              checkResult?.status === 'AUTH_ERROR' ||
              checkResult?.status === 'ERROR') && (
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center space-y-3">
                <AlertCircle className="w-6 h-6 text-[#F97360] mx-auto" />
                <h4 className="text-sm font-bold text-[#131B2E]">
                  Registrar Verification Pending
                </h4>
                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  {checkResult.errorMessage ||
                    'Domain registrar is temporarily unreachable. Domain availability and final pricing will be confirmed during project scoping.'}
                </p>
                <Link
                  href={`/get-quote?plan=${selectedPlan}&domain=${encodeURIComponent(domainInput.trim())}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:underline"
                >
                  <span>Continue to Quote with &ldquo;{domainInput.trim()}&rdquo; →</span>
                </Link>
              </div>
            )}

          {/* 5. STATE: NO_RESULTS (Appears ONLY after direct + suggestions pipeline finished with genuinely 0 results) */}
          {!isSearching && hasSearched && checkResult?.status === 'NO_RESULTS' && (
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center space-y-2">
              <Info className="w-6 h-6 text-[#64748B] mx-auto" />
              <h4 className="text-sm font-bold text-[#131B2E]">No Available Domains Found</h4>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                We couldn&apos;t find an available domain matching &ldquo;{domainInput.trim()}&rdquo;. Try another business name or variation.
              </p>
            </div>
          )}

          {/* 6. STATE: SUCCESS (Real Available Results from Registrar) */}
          {!isSearching &&
            hasSearched &&
            checkResult?.status === 'SUCCESS' &&
            checkResult.results.length > 0 && (
              <div className="space-y-6 pt-2">
                {/* Specific Notice: If requested domain was checked and found UNAVAILABLE */}
                {checkResult.requestedDomain && checkResult.requestedDomainAvailable === false && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#131B2E]">
                          {checkResult.requestedDomain}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-700">
                          Unavailable
                        </span>
                      </div>
                      <p className="mt-1 text-[#64748B]">
                        The exact requested domain is already registered. We queried GoDaddy for the best available alternatives below:
                      </p>
                    </div>
                  </div>
                )}

                {/* Specific Notice: If requested domain was checked and found AVAILABLE */}
                {checkResult.requestedDomain && checkResult.requestedDomainAvailable === true && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-emerald-900">
                      <strong className="font-bold">✓ Your requested domain is available!</strong>
                      <p className="mt-0.5 text-emerald-800">
                        {checkResult.requestedDomain} is ready for registration under your selected plan.
                      </p>
                    </div>
                  </div>
                )}

                {/* 🥇 Ekaagra Recommendation Section */}
                {topRec && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-[#4338CA] text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#F4C95D]" />
                        <span>EKAAGRA RECOMMENDATION</span>
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        Tailored for your business context and plan value
                      </span>
                    </div>

                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/70 to-[#FAF7F2] border-2 border-[#4338CA] shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                      <div className="space-y-2 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-xl sm:text-2xl font-mono font-extrabold text-[#131B2E]">
                            {topRec.domain}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-500/10 border border-emerald-500/20">
                            ✓ Available
                          </span>
                          {topRec.premium && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                              ⭐ Premium Domain
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20">
                            {topRec.recommendationBadge || 'Best Overall'}
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                          {topRec.recommendationReason}
                        </p>

                        <div className="space-y-1 pt-1 text-xs text-[#64748B]">
                          <div className="flex flex-wrap items-center gap-3">
                            {topRec.sourceAmount !== undefined && (
                              <span>
                                Registrar Price:{' '}
                                <strong className="text-[#131B2E] font-bold">
                                  {topRec.sourceCurrency === 'USD' ? '$' : ''}{topRec.sourceAmount} {topRec.sourceCurrency}
                                </strong>
                              </span>
                            )}
                            <span>
                              Estimated Equivalent:{' '}
                              <strong className="text-[#131B2E] font-bold">
                                ~₹{topRec.registrationPrice} / {topRec.registrationPeriod}
                              </strong>
                            </span>
                            {topRec.effectiveAnnualPrice && (
                              <span>
                                (Effective: ~₹{topRec.effectiveAnnualPrice}/year)
                              </span>
                            )}
                            {topRec.sourceRenewalAmount && (
                              <span>
                                • Renewal: {topRec.sourceCurrency === 'USD' ? '$' : ''}{topRec.sourceRenewalAmount} {topRec.sourceCurrency}/yr
                                {topRec.renewalPrice ? ` (~₹${topRec.renewalPrice})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px]">
                            <span>
                              Plan Allowance: <strong>₹{topRec.planAllowance}/year</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Term Allowance ({topRec.registrationPeriod}): <strong>₹{topRec.termAllowance}</strong>
                            </span>
                          </div>
                          {topRec.exchangeRateNotice && (
                            <span className="text-[10px] text-[#64748B] italic block">
                              *Based on live exchange rate ({topRec.exchangeRateNotice})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 border-[#E2E8F0] pt-4 md:pt-0">
                        <div>
                          {topRec.included ? (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold shadow-sm">
                              <Check className="w-4 h-4" />
                              <span>✓ INCLUDED IN PLAN</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] text-[#F97360] border border-[#F97360]/30 text-xs font-extrabold">
                              <Tag className="w-3.5 h-3.5" />
                              <span>UPGRADE +₹{topRec.upgradeAmount}</span>
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/get-quote?plan=${selectedPlan}&domain=${encodeURIComponent(topRec.domain)}&registrarPrice=${topRec.sourceAmount || topRec.registrationPrice}&registrarCurrency=${topRec.sourceCurrency}&estimatedINR=${topRec.registrationPrice}&allowance=${topRec.planAllowance}&termAllowance=${topRec.termAllowance}&upgrade=${topRec.upgradeAmount}&term=${encodeURIComponent(topRec.registrationPeriod)}&provider=GoDaddy`}
                          className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20"
                        >
                          <span>Choose Domain</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Other Good Available Options / Suggestions */}
                {otherOptions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-wider block">
                        {checkResult.suggestionsUsed ? 'Available Domains & Suggestions' : 'Other Available Options'}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        You can choose any available domain below.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {otherOptions.map((quote) => (
                        <div
                          key={quote.domain}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            quote.included
                              ? 'bg-emerald-50/40 border-emerald-300/80 shadow-xs'
                              : 'bg-[#FAF7F2] border-[#E2E8F0] hover:border-[#4338CA]/30'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-extrabold text-sm sm:text-base text-[#131B2E]">
                                    {quote.domain}
                                  </span>
                                  {quote.premium && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-white">
                                      PREMIUM
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-medium text-[#64748B] space-y-0.5">
                                  <div>
                                    {quote.sourceAmount !== undefined && (
                                      <span>
                                        {quote.sourceCurrency === 'USD' ? '$' : ''}{quote.sourceAmount} {quote.sourceCurrency} •{' '}
                                      </span>
                                    )}
                                    <strong className="text-[#131B2E]">~₹{quote.registrationPrice}</strong> / {quote.registrationPeriod}
                                    {quote.renewalPrice ? ` (Renewal: ~₹${quote.renewalPrice}/yr)` : ''}
                                  </div>
                                  {quote.effectiveAnnualPrice && (
                                    <div className="text-[10px] text-[#64748B]">
                                      Effective: ~₹{quote.effectiveAnnualPrice}/year
                                    </div>
                                  )}
                                  {quote.exchangeRateNotice && (
                                    <span className="text-[10px] text-[#94A3B8] block italic">
                                      {quote.exchangeRateNotice}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Inclusion / Upgrade Badge */}
                              <div>
                                {quote.included ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                                    ✓ INCLUDED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/20">
                                    UPGRADE +₹{quote.upgradeAmount}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Recommendation Category & Short Note */}
                            <div className="flex items-center gap-1.5">
                              {quote.recommendationBadge && (
                                <span className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-2 py-0.5 rounded-md">
                                  {quote.recommendationBadge}
                                </span>
                              )}
                              <p className="text-[11px] text-[#64748B] leading-snug">
                                {quote.recommendationReason}
                              </p>
                            </div>
                          </div>

                          {/* Action CTA */}
                          <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between">
                            <span className="text-[11px] text-[#64748B]">
                              {quote.included ? 'No additional cost' : `Difference: ₹${quote.upgradeAmount}`}
                            </span>
                            <Link
                              href={`/get-quote?plan=${selectedPlan}&domain=${encodeURIComponent(quote.domain)}&registrarPrice=${quote.sourceAmount || quote.registrationPrice}&registrarCurrency=${quote.sourceCurrency}&estimatedINR=${quote.registrationPrice}&allowance=${quote.planAllowance}&termAllowance=${quote.termAllowance}&upgrade=${quote.upgradeAmount}&term=${encodeURIComponent(quote.registrationPeriod)}&provider=GoDaddy`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline"
                            >
                              <span>Choose Domain</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* 7. STATE: Initial Prompt (Before searching) */}
          {!hasSearched && !isSearching && (
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center space-y-3">
              <Sparkles className="w-6 h-6 text-[#4338CA] mx-auto" />
              <h4 className="text-sm font-extrabold text-[#131B2E]">
                Choose your domain
              </h4>
              <p className="text-xs text-[#64748B] max-w-md mx-auto leading-relaxed">
                Type your brand or school name above and click &ldquo;Search Domain&rdquo;. We&apos;ll check live availability, registrar pricing, and suggestions across all popular extensions.
              </p>
            </div>
          )}

          {/* Mandatory Disclaimer */}
          <div className="space-y-1.5 border-t border-[#E2E8F0] pt-4 text-center">
            <p className="text-[11px] text-[#64748B] leading-relaxed italic">
              *Displayed domain prices are current indicative registrar prices and may change before registration.
            </p>
            <p className="text-[11px] text-[#64748B] leading-relaxed italic">
              {domainPricingStrategy.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DomainStrategySection;
