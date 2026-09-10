import * as React from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { PricingTier } from '@/lib/types';

interface PricingCardProps {
  tier: PricingTier;
  isHighlighted?: boolean;
  className?: string;
}

export function PricingCard({ tier, isHighlighted = false, className = '' }: PricingCardProps) {
  const highlighted = isHighlighted || tier.highlighted;

  return (
    <div
      className={`relative flex flex-col h-full rounded-3xl p-6 sm:p-7 transition-all duration-300 bg-white ${
        highlighted
          ? 'border-2 border-[#4338CA] shadow-xl shadow-[#4338CA]/10 ring-4 ring-[#4338CA]/5'
          : 'border-2 border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-lg'
      } ${className}`}
    >
      {highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4338CA] px-3.5 py-1 text-[10px] font-mono font-bold text-white uppercase tracking-widest shadow-md shadow-[#4338CA]/25 whitespace-nowrap">
            RECOMMENDED
          </span>
        </div>
      )}

      {/* Header Slot */}
      <div className="flex flex-col space-y-4">
        {tier.badge && (
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-[#4338CA] border border-indigo-100/80 inline-flex items-center">
              {tier.badge}
            </span>
          </div>
        )}

        <div className="min-h-[2.5rem] flex items-center">
          <h3 className="text-xl font-extrabold text-[#131B2E] tracking-tight">{tier.title}</h3>
        </div>

        <div className="min-h-[3.5rem] flex items-start">
          <p className="text-xs text-[#64748B] leading-relaxed">{tier.description}</p>
        </div>

        {/* Pricing Block */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] min-h-[96px] flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider block">
            Starting From
          </span>
          <div className="text-2xl font-mono font-extrabold text-[#131B2E] tracking-tight mt-0.5">
            {tier.startingFrom}
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2 pt-1 text-xs">
          <span className="font-bold text-[#131B2E] uppercase tracking-wider text-[10px] block">
            Included Capabilities:
          </span>
          <ul className="space-y-2">
            {tier.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-[#334155] leading-snug">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Flexible Spacer Area */}
      <div className="flex-1 min-h-[16px]" aria-hidden="true" />

      {/* Bottom Divider & CTA */}
      <div className="mt-auto pt-5 border-t border-[#E2E8F0]">
        <Link
          href="/get-quote"
          className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[44px] cursor-pointer shadow-sm ${
            highlighted
              ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/25'
              : 'bg-[#131B2E] hover:bg-[#1E293B] text-white'
          }`}
        >
          <span>{tier.cta || 'Get a Quote'}</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default PricingCard;

