'use client';

import { useState } from 'react';
import Link from 'next/link';
import { websitePlans } from '@/lib/data';
import { Check, X, ArrowRight, Sparkles, Globe, ShieldCheck, Search, HelpCircle } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import StaggerReveal from '@/components/motion/StaggerReveal';
import MagneticButton from '@/components/motion/MagneticButton';
import { MaintenanceModal, MaintenanceTriggerButton } from '@/components/ui/MaintenanceModal';

interface WebsitePricingSectionProps {
  className?: string;
  showSectionHeading?: boolean;
}

export function WebsitePricingSection({
  className = '',
  showSectionHeading = true,
}: WebsitePricingSectionProps) {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  return (
    <section id="website-plans" className={`py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2] ${className}`}>
      <MaintenanceModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
      />

      <div className="site-container space-y-10">
        {showSectionHeading && (
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                WEBSITE LAUNCH &amp; GROWTH PACKAGES
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#131B2E] tracking-tight">
                From Free Launch to Full Business Presence
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
                Test your market with zero upfront cost, then seamlessly upgrade to your own domain, multi-page structure, and search engine setup.
              </p>
            </div>
          </Reveal>
        )}

        {/* Pricing Cards Progression */}
        <StaggerReveal staggerInterval={90} className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {websitePlans.map((plan) => {
            const isStarter = plan.id === 'starter';
            const isFree = plan.id === 'free-launch';
            const isPlus = plan.id === 'launch-plus';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all duration-300 h-full ${
                  isStarter
                    ? 'bg-white border-2 border-[#4338CA] shadow-2xl shadow-[#4338CA]/15 ring-1 ring-[#4338CA]/20 md:-translate-y-2'
                    : isFree
                    ? 'bg-[#FAF7F2] border border-[#E2E8F0] shadow-md hover:shadow-lg'
                    : 'bg-white border border-[#E2E8F0] shadow-lg hover:shadow-xl hover:border-[#4338CA]/30'
                }`}
              >
                {/* Highlighted Banner */}
                {isStarter && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#4338CA] text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-[#F4C95D]" />
                    <span>RECOMMENDED FOR BUSINESSES</span>
                  </div>
                )}

                <div className="space-y-5">
                  {/* Badge & Duration */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isStarter
                          ? 'bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20'
                          : isFree
                          ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                      }`}
                    >
                      {plan.badge}
                    </span>

                    <span className="text-[11px] font-mono font-bold text-[#64748B]">
                      {plan.duration}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h3 className="text-xl font-extrabold text-[#131B2E]">
                      {plan.name}
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span
                        className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-tight ${
                          isStarter ? 'text-[#4338CA]' : 'text-[#131B2E]'
                        }`}
                      >
                        {plan.priceDisplay}
                      </span>
                      <span className="text-xs text-[#64748B] font-medium">
                        / {plan.duration}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  {/* Core Metrics Strip: Pages | Domain | Maintenance */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Pages:</span>
                      <span className="font-bold text-[#131B2E]">{plan.pages} {plan.pages === '1' ? 'Landing Page' : 'Custom Pages'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Domain:</span>
                      <span className={`font-bold ${plan.domainIncluded ? 'text-emerald-700' : 'text-[#F97360]'}`}>
                        {plan.domainIncluded ? '1 Standard Domain Included' : 'Hosted URL (No Custom Domain)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] font-medium">Search SEO:</span>
                      <span className={`font-bold ${plan.seoIncluded ? 'text-emerald-700' : 'text-[#64748B]'}`}>
                        {plan.seoIncluded ? '✓ Basic SEO Included' : 'Not Included'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-[#E2E8F0] pt-2">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>✓ Maintenance Included</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setMaintenanceModalOpen(true)}
                        className="text-[10px] text-[#4338CA] hover:underline cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Deliverables:
                    </span>
                    <ul className="space-y-2">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Not Included Scope */}
                  {plan.notIncluded && plan.notIncluded.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                        Excluded in this plan:
                      </span>
                      <ul className="space-y-1">
                        {plan.notIncluded.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                            <X className="w-3 h-3 text-[#94A3B8] shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Upgrade Note */}
                  {plan.upgradeNote && (
                    <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-[11px] text-[#64748B] leading-relaxed">
                      💡 {plan.upgradeNote}
                    </div>
                  )}
                </div>

                {/* Card CTA */}
                <div className="pt-6">
                  <MagneticButton maxDistance={6} className="w-full">
                    <Link
                      href={plan.ctaHref}
                      className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                        isStarter
                          ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[#4338CA]/25'
                          : isFree
                          ? 'bg-[#131B2E] hover:bg-black text-white'
                          : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0]'
                      }`}
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            );
          })}
        </StaggerReveal>

        {/* Global Maintenance Trigger Strip */}
        <Reveal delay={150}>
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left max-w-3xl mx-auto">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold text-[#131B2E]">
                  ✓ Maintenance is included on all website plans.
                </span>{' '}
                <span className="text-[#64748B]">
                  Ensures your website remains properly deployed, live, and operational.
                </span>
              </div>
            </div>

            <MaintenanceTriggerButton onOpen={() => setMaintenanceModalOpen(true)} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default WebsitePricingSection;
