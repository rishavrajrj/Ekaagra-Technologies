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
      className={`relative flex flex-col justify-between rounded-2xl bg-[#0e1320] p-8 border ${
        highlighted 
          ? 'border-blue-500/50 ring-1 ring-blue-500/30 shadow-2xl' 
          : 'border-white/10 shadow-lg'
      } ${className}`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-mono font-bold text-white uppercase tracking-widest border border-blue-400/30">
          RECOMMENDED ARCHITECTURE
        </span>
      )}
      <div>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white">{tier.title}</h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">{tier.description}</p>
        </div>
        <div className="mb-6 border-t border-white/10 pt-4">
          <span className="block text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">Starting From</span>
          <div className="text-3xl font-mono font-extrabold text-white mt-1">
            {tier.startingFrom}
          </div>
        </div>
        <ul className="mb-8 space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-blue-400 mt-0.5" aria-hidden="true" />
              <span className="text-xs text-slate-300 leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link 
        href="/get-quote"
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
          highlighted
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950'
            : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
        }`}
      >
        <span>{tier.cta || 'Get a Quote'}</span>
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default PricingCard;

