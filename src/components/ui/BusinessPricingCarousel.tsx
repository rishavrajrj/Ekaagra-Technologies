'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Info,
  ShieldCheck,
} from 'lucide-react';
import {
  businessPlans,
  type BusinessPlanConfig,
  type BusinessPlanId,
} from '@/lib/businessPricing';

interface BusinessPricingCarouselProps {
  mode?: 'interactive' | 'link';
  selectedPlanId?: string;
  onSelectPlan?: (planId: BusinessPlanId) => void;
  className?: string;
  showSectionHeader?: boolean;
}

export default function BusinessPricingCarousel({
  mode = 'link',
  selectedPlanId,
  onSelectPlan,
  className = '',
  showSectionHeader = false,
}: BusinessPricingCarouselProps) {
  // Number of cards visible per breakpoint
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [autoplayDisabled, setAutoplayDisabled] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const totalPlans = businessPlans.length; // 7 plans

  // Responsive visible count tracking (3 on desktop >= 1024, 2 on tablet >= 640, 1 on mobile < 640)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setVisibleCount(3);
      } else if (width >= 640) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Cloned buffer list for infinite sliding loop: [Buffer Before] + [Original Plans] + [Buffer After]
  // 3 buffer items before and 3 after ensures seamless continuous transition
  const bufferCount = 3;
  const extendedPlans = [
    ...businessPlans.slice(-bufferCount),
    ...businessPlans,
    ...businessPlans.slice(0, bufferCount),
  ];

  // Internal physical slide index offset by bufferCount
  const [slideIndex, setSlideIndex] = useState<number>(bufferCount);

  // Synchronize initial selection to center the selected plan if provided
  useEffect(() => {
    if (selectedPlanId) {
      const targetIndex = businessPlans.findIndex((p) => p.id === selectedPlanId);
      if (targetIndex !== -1) {
        setCurrentIndex(targetIndex);
        setSlideIndex(targetIndex + bufferCount);
        // If a plan is selected, stop autoplay permanently
        setAutoplayDisabled(true);
      }
    }
  }, [selectedPlanId, bufferCount]);

  // Navigate forward
  const handleNext = useCallback(() => {
    if (!isTransitioning) setIsTransitioning(true);
    setSlideIndex((prev) => prev + 1);
    setCurrentIndex((prev) => (prev + 1) % totalPlans);
  }, [isTransitioning, totalPlans]);

  // Navigate backward
  const handlePrev = useCallback(() => {
    if (!isTransitioning) setIsTransitioning(true);
    setSlideIndex((prev) => prev - 1);
    setCurrentIndex((prev) => (prev - 1 + totalPlans) % totalPlans);
  }, [isTransitioning, totalPlans]);

  // Handle seamless teleport reset when sliding beyond boundaries
  const handleTransitionEnd = () => {
    if (slideIndex >= totalPlans + bufferCount) {
      setIsTransitioning(false);
      setSlideIndex(slideIndex - totalPlans);
    } else if (slideIndex < bufferCount) {
      setIsTransitioning(false);
      setSlideIndex(slideIndex + totalPlans);
    }
  };

  // Re-enable CSS transition after teleport
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Autoplay Timer (3.5 seconds)
  useEffect(() => {
    if (autoplayDisabled || isHovered || isFocused || prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      handleNext();
    }, 3500);

    return () => clearInterval(timer);
  }, [autoplayDisabled, isHovered, isFocused, prefersReducedMotion, handleNext]);

  // Plan selection handler
  const handleSelect = (plan: BusinessPlanConfig) => {
    // Permanently disable autoplay on selection
    setAutoplayDisabled(true);
    if (mode === 'interactive' && onSelectPlan) {
      onSelectPlan(plan.id);
    }
  };

  // Direct jump via indicator dots
  const handleJumpTo = (index: number) => {
    setIsTransitioning(true);
    setCurrentIndex(index);
    setSlideIndex(index + bufferCount);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Card percentage width based on visibleCount
  const cardWidthPercent = 100 / visibleCount;
  const trackTranslatePercent = -(slideIndex * cardWidthPercent);

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Ekaagra Business Pricing Plans Carousel"
      tabIndex={0}
    >
      {/* Optional Section Heading */}
      {showSectionHeader && (
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            TRANSPARENT BUSINESS PRICING
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Year 1 Setup &amp; Development with ~50% Annual Renewal
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            Choose the package tailored to your business. Year 1 covers custom architecture and launch; Year 2 onward keeps your website secure, fast, and fully maintained.
          </p>
        </div>
      )}

      {/* Carousel Header Controls: Status Bar + Prev / Next Arrows */}
      <div className="flex items-center justify-between gap-3 bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            PLAN {currentIndex + 1} OF {totalPlans}
          </span>
          <span className="text-xs font-extrabold text-[#131B2E] hidden sm:inline truncate max-w-[220px]">
            {businessPlans[currentIndex]?.name}
          </span>
          {autoplayDisabled ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Manual Mode
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#64748B] bg-[#FAF7F2] border border-[#E2E8F0] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Auto-Sliding
            </span>
          )}
        </div>

        {/* Navigation Arrows & Dot Indicators */}
        <div className="flex items-center gap-2">
          {/* Indicator dots */}
          <div className="hidden md:flex items-center gap-1 mr-1" aria-hidden="true">
            {businessPlans.map((plan, idx) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => handleJumpTo(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex
                    ? 'w-6 bg-[#4338CA]'
                    : 'w-2 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                }`}
                title={`Jump to ${plan.name}`}
                aria-label={`Jump to ${plan.name}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous pricing plan"
            title="Previous Plan"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] hover:bg-white text-[#131B2E] hover:text-[#4338CA] hover:border-[#4338CA]/40 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next pricing plan"
            title="Next Plan"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-[#E2E8F0] bg-[#FAF7F2] hover:bg-white text-[#131B2E] hover:text-[#4338CA] hover:border-[#4338CA]/40 flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Overflow Clip Viewport */}
      <div className="overflow-hidden rounded-3xl p-1 -m-1">
        {/* Sliding Track */}
        <div
          className="flex transition-transform ease-in-out"
          style={{
            transform: `translate3d(${trackTranslatePercent}%, 0, 0)`,
            transitionDuration: prefersReducedMotion || !isTransitioning ? '0ms' : '500ms',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedPlans.map((plan, idx) => {
            const isSelected = selectedPlanId === plan.id;
            const isCustom = plan.billingType === 'custom' || plan.priceYear1 === null;

            return (
              <div
                key={`${plan.id}-${idx}`}
                className="px-2 sm:px-2.5 shrink-0 flex flex-col"
                style={{ width: `${cardWidthPercent}%` }}
              >
                {/* Strict Equal-Height Card Container */}
                <div
                  onClick={() => handleSelect(plan)}
                  className={`relative flex flex-col h-full rounded-3xl p-5 sm:p-6 transition-all duration-200 cursor-pointer bg-white border-2 ${
                    isSelected
                      ? 'border-[#4338CA] shadow-xl shadow-[#4338CA]/15 ring-4 ring-[#4338CA]/10 bg-indigo-50/20'
                      : plan.highlighted
                      ? 'border-[#4338CA]/50 shadow-md hover:border-[#4338CA] hover:shadow-lg'
                      : 'border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] hover:shadow-md'
                  }`}
                >
                  {/* Floating Highlight / Selection Badge */}
                  {isSelected ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#4338CA] px-3 py-0.5 text-[9px] font-mono font-extrabold text-white uppercase tracking-widest shadow-md">
                        <Check className="w-3 h-3" />
                        <span>CURRENT SELECTION</span>
                      </span>
                    </div>
                  ) : plan.highlighted ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#4338CA] px-3 py-0.5 text-[9px] font-mono font-extrabold text-white uppercase tracking-widest shadow-md">
                        <Sparkles className="w-3 h-3 text-[#F4C95D]" />
                        <span>POPULAR CHOICE</span>
                      </span>
                    </div>
                  ) : null}

                  {/* Header Slot: Badge (min-h-[26px]) */}
                  <div className="min-h-[26px] flex items-center justify-between gap-1">
                    {plan.badge ? (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#4338CA] border border-[#E2E8F0]">
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-50 text-[#64748B]">
                        STANDARD
                      </span>
                    )}

                    {/* Radio Indicator for Selection */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#4338CA] bg-[#4338CA] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Title & Description Slot (min-h-[82px] ensures uniform top alignment) */}
                  <div className="mt-3 min-h-[84px] flex flex-col justify-start">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] tracking-tight leading-tight">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-3 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing Block (min-h-[104px] fixed height to ensure perfect horizontal alignment) */}
                  <div className="mt-3 p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] min-h-[104px] flex flex-col justify-between">
                    <div>
                      {/* Dominant Year 1 Price */}
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`font-mono font-black tracking-tight ${
                            isCustom
                              ? 'text-xl sm:text-2xl text-[#131B2E]'
                              : 'text-2xl sm:text-3xl text-[#131B2E]'
                          }`}
                        >
                          {plan.priceDisplayYear1}
                        </span>
                        <span className="inline-block text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#4338CA] bg-[#4338CA]/10 px-2 py-0.5 rounded-md">
                          YEAR 1
                        </span>
                      </div>

                      {/* Clearly Readable Secondary Renewal */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
                        <span>{plan.renewalDisplay}</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-[#94A3B8]">
                      {isCustom
                        ? 'Tailored deployment agreement'
                        : 'Setup & dev in Y1 • Maintenance from Y2'}
                    </div>
                  </div>

                  {/* Feature Checklist (min-h-[220px] and flex-1) */}
                  <div className="mt-4 flex-1 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block mb-1">
                      Included Capabilities:
                    </span>
                    <ul className="space-y-2">
                      {plan.features.map((feat, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start gap-2 text-[#334155] leading-snug font-medium"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Horizontally Pinned Bottom CTA Button */}
                  <div className="mt-auto pt-5 border-t border-[#E2E8F0]">
                    {mode === 'interactive' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(plan);
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20'
                            : 'bg-[#FAF7F2] hover:bg-[#131B2E] hover:text-white text-[#131B2E] border border-[#E2E8F0]'
                        }`}
                      >
                        <span>{isSelected ? 'Selected' : plan.cta}</span>
                        {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <Link
                        href={`/get-quote?plan=${plan.id}`}
                        onClick={() => handleSelect(plan)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          plan.highlighted
                            ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/20'
                            : 'bg-[#131B2E] hover:bg-black text-white'
                        }`}
                      >
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subordinate Renewal Explanatory Note (Section 15) */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] text-xs text-[#64748B] flex flex-col sm:flex-row sm:items-center justify-between gap-2 max-w-4xl mx-auto shadow-xs">
        <div className="flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="text-[#131B2E]">Transparent Pricing Model:</strong> Year 1 includes setup and development. From Year 2, renewal covers hosting, domain, maintenance and ongoing support.
          </p>
        </div>
        <span className="text-[11px] text-[#94A3B8] italic sm:text-right shrink-0">
          Major new features quoted separately.
        </span>
      </div>
    </div>
  );
}
