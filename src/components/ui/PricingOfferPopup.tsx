'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, Sparkles, ArrowRight, Check, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'ekaagra_launch_offer_seen_v1';

export function PricingOfferPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      // Check if user has already seen this popup once
      const alreadySeen = localStorage.getItem(STORAGE_KEY);
      if (alreadySeen) {
        return;
      }

      // Mark as seen immediately so it will never show on subsequent reloads/visits
      localStorage.setItem(STORAGE_KEY, 'true');

      // Trigger the popup once on the first visit after a brief delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 3500);

      return () => clearTimeout(timer);
    } catch {
      // Storage access blocked or private mode; do not show repeatedly
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage access blocked
    }
  }, []);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  // If the popup is closed, do NOT render any persistent floating buttons or badges
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="special-offer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] max-h-[92vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close special launch offer popup"
          className="absolute top-4 right-4 p-2 rounded-full text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pr-4 sm:pr-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-extrabold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" aria-hidden="true" />
            <span>🎉 SPECIAL LAUNCH OFFER</span>
          </span>
          <h3
            id="special-offer-title"
            className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight"
          >
            Get Your Landing Page FREE for 3 Months
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
            Launch your business online with zero upfront commitment. Fast, mobile-optimized, and professionally engineered by Ekaagra Technologies.
          </p>
        </div>

        {/* The Main Free Offer Spotlight */}
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border-2 border-[#4338CA]/30 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
                Free Launch Package
              </span>
              <div className="text-2xl font-mono font-extrabold text-[#131B2E]">
                ₹0 <span className="text-xs font-sans text-[#64748B] font-normal">/ 3 months</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                1 Page • 3 Months
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#334155] pt-1">
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>1 Custom Landing Page</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Mobile &amp; Desktop Optimized</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>WhatsApp &amp; Call Inquiries</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>✓ Maintenance Included</span>
            </li>
          </ul>

          <p className="text-[11px] text-[#64748B] italic pt-1 border-t border-[#E2E8F0]">
            *Hosted on an Ekaagra production subdomain (e.g. business.ekaagratechnologies.site). Custom domain not included in Free Launch.
          </p>
        </div>

        {/* Seamless Upgrade Paths */}
        <div className="space-y-2 text-left">
          <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider block">
            Seamless Upgrade Paths:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Launch Plus */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] space-y-1 hover:border-[#4338CA]/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#131B2E]">⭐ Continue for ₹499/yr</span>
                <span className="text-[10px] font-mono text-[#4338CA] font-bold">1 Year</span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                <strong>1 Page • 1 Year • Domain Included</strong>
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                Keep your landing page live on your own standard custom domain.
              </p>
            </div>

            {/* Starter Website */}
            <div className="p-3.5 rounded-2xl bg-[#4338CA]/5 border border-[#4338CA]/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4338CA]">🚀 Starter Website</span>
                <span className="text-[10px] font-mono font-extrabold text-[#4338CA]">₹999/yr</span>
              </div>
              <p className="text-[11px] text-[#131B2E]">
                <strong>3–5 Pages • SEO • Domain • Maintenance</strong>
              </p>
              <p className="text-[10px] text-[#64748B]">
                Complete multi-page business website with on-page SEO.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2.5 pt-1">
          <Link
            href="/get-quote?plan=free-launch"
            onClick={handleDismiss}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#4338CA]/25 cursor-pointer min-h-[44px]"
          >
            <span>Claim My Free Landing Page</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/pricing#website-plans"
              onClick={handleDismiss}
              className="text-xs text-[#4338CA] hover:underline font-bold"
            >
              View All Plans &amp; Details →
            </Link>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-[#64748B] hover:text-[#131B2E] transition-colors cursor-pointer p-1"
            >
              Dismiss for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingOfferPopup;
