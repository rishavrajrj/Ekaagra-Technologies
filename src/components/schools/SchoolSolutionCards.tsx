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
            const previewCapabilities = plan.coreCapabilities.slice(0, 3);
            const extraCapabilities = plan.coreCapabilities.slice(3);

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
                  plan.highlighted
                    ? 'border-2 border-[#4338CA] bg-white shadow-xl shadow-[#4338CA]/10 ring-4 ring-[#4338CA]/5'
                    : 'border border-[#E2E8F0] bg-[#FAF7F2] hover:bg-white hover:border-[#CBD5E1] hover:shadow-lg'
                }`}
              >
                {/* Highlighted Badge */}
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  {/* Category & Title */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4338CA] border border-indigo-100 inline-block mb-2">
                      {plan.category}
                    </span>
                    <h3 className="text-xl font-extrabold text-[#131B2E]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed min-h-[36px]">
                      {plan.bestFor}
                    </p>
                  </div>

                  {/* Compact Pricing Box */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Year 1 Platform
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-[#131B2E] block mt-0.5">
                      {plan.startingPriceDisplay}
                    </span>
                    {plan.renewalPriceDisplay && (
                      <span className="text-xs text-[#4338CA] font-semibold block mt-1">
                        Renewal: {plan.renewalPriceDisplay}
                      </span>
                    )}
                  </div>

                  {/* Important Note (if present) */}
                  {plan.importantNote && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-[11px] text-indigo-950 leading-relaxed">
                      <strong>Note:</strong> {plan.importantNote}
                    </div>
                  )}

                  {/* Key Benefits (Initial 3 items) */}
                  <div className="space-y-2 pt-2 text-xs">
                    <span className="font-bold text-[#131B2E] uppercase tracking-wider text-[10px] block">
                      Key Capabilities:
                    </span>
                    {previewCapabilities.map((capability, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-[#334155] leading-relaxed">{capability}</span>
                      </div>
                    ))}

                    {/* Expandable Extra Capabilities */}
                    {extraCapabilities.length > 0 && (
                      <div
                        className={`space-y-2 pt-1 transition-all duration-300 ${
                          isExpanded ? 'block animate-in fade-in' : 'hidden'
                        }`}
                      >
                        {extraCapabilities.map((capability, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                            <span className="text-[#334155] leading-relaxed">{capability}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Progressive Disclosure Toggle Button */}
                  {extraCapabilities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(plan.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] transition-colors pt-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide details' : `View all ${plan.coreCapabilities.length} capabilities`}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="pt-6 mt-6 border-t border-[#E2E8F0] space-y-2">
                  <Link
                    href={`/schools/configure?plan=${plan.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer shadow-sm ${
                      plan.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[#4338CA]/25'
                        : 'bg-[#131B2E] hover:bg-[#1E293B] text-white'
                    }`}
                  >
                    <span>Configure Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>

                  {plan.primaryCta.isExternal ? (
                    <a
                      href={plan.primaryCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#4338CA] bg-white hover:bg-indigo-50/70 text-center border border-[#E2E8F0] transition-colors cursor-pointer min-h-[36px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#4338CA]" aria-hidden="true" />
                      <span>Inspect Live Demo</span>
                    </a>
                  ) : (
                    <a
                      href={plan.secondaryCta.href}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-[#4338CA] bg-white hover:bg-indigo-50/70 text-center border border-[#E2E8F0] transition-colors cursor-pointer min-h-[36px]"
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
