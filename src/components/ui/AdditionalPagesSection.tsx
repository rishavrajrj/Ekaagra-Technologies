'use client';

import Link from 'next/link';
import { additionalPageTiers, additionalPagesDisclaimer } from '@/lib/data';
import { Layers, Plus, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';

interface AdditionalPagesSectionProps {
  className?: string;
}

export function AdditionalPagesSection({ className = '' }: AdditionalPagesSectionProps) {
  return (
    <section className={`py-10 sm:py-14 border-b border-[#E2E8F0] bg-[#FAF7F2] ${className}`}>
      <div className="site-container space-y-8">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <Layers className="w-3.5 h-3.5 text-[#F97360]" />
              FLEXIBLE EXPANSION
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Additional Pages Starting from ₹199/page
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Expand your website anytime with fixed, complexity-based pricing. No percentages or hidden formulas — pay only for what you need.
            </p>
          </div>
        </Reveal>

        {/* 4 Complexity Tiers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {additionalPageTiers.map((tier) => (
            <div
              key={tier.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-md hover:shadow-xl hover:border-[#4338CA]/40 transition-all duration-300 flex flex-col justify-between space-y-5 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#4338CA] border border-[#E2E8F0]">
                    {tier.badge}
                  </span>
                  <div className="text-xl font-mono font-extrabold text-[#4338CA]">
                    {tier.priceDisplay}
                    <span className="text-[11px] text-[#64748B] font-sans font-normal"> / page</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors">
                    {tier.type}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                  <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                    Ideal for:
                  </span>
                  <ul className="space-y-1">
                    {tier.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-xs text-[#334155] font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/get-quote?pages=${encodeURIComponent(tier.id)}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#4338CA] text-[#131B2E] hover:text-white border border-[#E2E8F0] hover:border-[#4338CA] transition-all shadow-sm group-hover:shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a Page</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer Note */}
        <Reveal delay={150}>
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center max-w-3xl mx-auto">
            <p className="text-xs text-[#64748B] leading-relaxed italic">
              <strong>Note:</strong> {additionalPagesDisclaimer}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default AdditionalPagesSection;
