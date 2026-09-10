'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  Eye,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { schoolPlans, type SchoolPlanConfig } from '@/lib/schoolPricing';

export default function SchoolSolutionCards() {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (planId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  return (
    <section id="solutions" className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-white scroll-mt-12">
      <div className="site-container space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>FOUR PROGRESSIVE SOLUTIONS</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Choose the Right Solution for Your School
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Select the digital infrastructure that matches your institution today. Every tier is modular and can be expanded seamlessly as student enrollment grows.
          </p>
        </div>

        {/* 4 Solution Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {schoolPlans.map((plan) => {
            const isExpanded = Boolean(expandedCards[plan.id]);
            const previewCapabilities = plan.coreCapabilities.slice(0, 4);
            const extraCapabilities = plan.coreCapabilities.slice(4);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col h-full rounded-3xl p-6 transition-all duration-300 bg-white ${
                  plan.highlighted
                    ? 'border-2 border-[#4338CA] shadow-xl shadow-[#4338CA]/10 ring-4 ring-[#4338CA]/5'
                    : 'border-2 border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-lg'
                }`}
              >
                {/* 1. Recommended Floating Badge (Positioned absolutely to preserve identical card height) */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/25 whitespace-nowrap">
                      <Sparkles className="w-3 h-3 text-[#F4C95D]" aria-hidden="true" />
                      <span>{plan.badge}</span>
                    </span>
                  </div>
                )}

                {/* Top Section: Aligned Slot Hierarchy */}
                <div className="flex flex-col space-y-4">
                  {/* 1. Plan Badge / Category Tag */}
                  <div className="h-6 flex items-center">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4338CA] border border-indigo-100/80 inline-flex items-center">
                      {plan.category}
                    </span>
                  </div>

                  {/* 2. Plan Name */}
                  <div className="min-h-[3rem] sm:min-h-[3.25rem] flex items-center">
                    <h3 className="text-xl font-extrabold text-[#131B2E] tracking-tight leading-snug">
                      {plan.name}
                    </h3>
                  </div>

                  {/* 3. Description */}
                  <div className="min-h-[4.25rem] flex items-start">
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {plan.bestFor}
                    </p>
                  </div>

                  {/* 4. Pricing Block */}
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] min-h-[104px] flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider block">
                        Year 1 Platform
                      </span>
                      <span className="text-2xl font-extrabold font-mono text-[#131B2E] block mt-0.5 tracking-tight">
                        {plan.startingPriceDisplay}
                      </span>
                    </div>
                    <div className="min-h-[1.125rem] flex items-center mt-1">
                      {plan.renewalPriceDisplay ? (
                        <span className="text-xs text-[#4338CA] font-semibold block truncate">
                          Renewal: {plan.renewalPriceDisplay}
                        </span>
                      ) : (
                        <span className="text-xs text-transparent select-none">Renewal: —</span>
                      )}
                    </div>
                  </div>

                  {/* 5. Key Capabilities / Features */}
                  <div className="space-y-2 pt-1 text-xs">
                    <span className="font-bold text-[#131B2E] uppercase tracking-wider text-[10px] block">
                      Key Capabilities:
                    </span>
                    <ul className="space-y-2">
                      {previewCapabilities.map((capability, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[#334155] leading-snug">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>

                    {/* 6. Expand/Collapse Details */}
                    {extraCapabilities.length > 0 && (
                      <div className="pt-1">
                        {isExpanded && (
                          <ul
                            id={`extra-features-${plan.id}`}
                            className="space-y-2 pt-2 border-t border-[#E2E8F0]/70 animate-in fade-in duration-200"
                          >
                            {extraCapabilities.map((capability, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[#334155] leading-snug">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{capability}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleExpand(plan.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`extra-features-${plan.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] transition-colors pt-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] rounded"
                        >
                          <span>{isExpanded ? 'Hide details' : `Show details (${plan.coreCapabilities.length} total)`}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Flexible Spacer Area (absorbs height variations so footers stay locked) */}
                <div className="flex-1 min-h-[16px]" aria-hidden="true" />

                {/* 8. Bottom Divider & Footer CTAs */}
                <div className="mt-auto pt-5 border-t border-[#E2E8F0] space-y-2.5">
                  {/* 9. Primary CTA */}
                  <Link
                    href={`/schools/configure?plan=${plan.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer shadow-sm ${
                      plan.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/25'
                        : 'bg-[#131B2E] hover:bg-[#1E293B] text-white'
                    }`}
                  >
                    <span>{plan.ctaText || 'Configure Plan'}</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>

                  {/* 10. Secondary CTA */}
                  {plan.primaryCta.isExternal ? (
                    <a
                      href={plan.primaryCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#4338CA] bg-white hover:bg-indigo-50/70 text-center border border-[#E2E8F0] transition-colors cursor-pointer min-h-[38px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#4338CA]" aria-hidden="true" />
                      <span>Inspect Live Demo</span>
                    </a>
                  ) : (
                    <a
                      href={plan.secondaryCta.href}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-[#4338CA] bg-white hover:bg-indigo-50/70 text-center border border-[#E2E8F0] transition-colors cursor-pointer min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#4338CA]" aria-hidden="true" />
                      <span>{plan.secondaryCta.label}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
