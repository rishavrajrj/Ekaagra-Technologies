'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  MessageSquare,
  Smartphone,
  Bus,
  Home,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { schoolAddonCategories, type SchoolAddonCategoryGroup } from '@/lib/schoolPricing';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  finance: CreditCard,
  communication: MessageSquare,
  mobile: Smartphone,
  operations: Bus,
  campus: Home,
};

const CATEGORY_SUMMARIES: Record<string, string> = {
  finance: 'Fee collection • Payments',
  communication: 'WhatsApp • SMS Gateway',
  mobile: 'Parent App • Teacher/Admin App',
  operations: 'Transport • Library Management',
  campus: 'Hostel & Boarding Management',
};

type CardTier = 'small' | 'medium' | 'large';

// Symmetrical focal hierarchy: SMALL → MEDIUM → LARGE → MEDIUM → SMALL
const TIER_BY_INDEX: Record<number, CardTier> = {
  0: 'small',
  1: 'medium',
  2: 'large',
  3: 'medium',
  4: 'small',
};

export default function SchoolOptionalModules() {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'carousel' | 'list'>('carousel');
  const [activeMobileIndex, setActiveMobileIndex] = useState<number>(2); // Center card (Mobile) by default
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  // Scroll to a specific card in mobile carousel (container-scoped horizontal scroll)
  const scrollToCard = useCallback((index: number) => {
    const cardEl = cardRefs.current[index];
    const container = carouselRef.current;
    if (cardEl && container) {
      // Calculate scroll position to center the card in the container
      const cardCenter = cardEl.offsetLeft + cardEl.offsetWidth / 2;
      const containerCenter = container.clientWidth / 2;
      const targetScrollLeft = cardCenter - containerCenter;
      
      container.scrollTo({
        left: targetScrollLeft,
        behavior: 'smooth',
      });
      setActiveMobileIndex(index);
    }
  }, []);

  // Track currently centered card during horizontal swipe on mobile
  const handleMobileScroll = useCallback(() => {
    const container = carouselRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 2;
    let closestDistance = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = idx;
      }
    });

    setActiveMobileIndex(closestIndex);
  }, []);

  // On initial mount or when switching to carousel mode, center the focal card (index 2)
  useEffect(() => {
    if (mobileViewMode === 'carousel') {
      const timer = setTimeout(() => {
        const centerCard = cardRefs.current[2];
        const container = carouselRef.current;
        if (centerCard && container) {
          // Calculate scroll position to center the card in the container
          const cardCenter = centerCard.offsetLeft + centerCard.offsetWidth / 2;
          const containerCenter = container.clientWidth / 2;
          const targetScrollLeft = cardCenter - containerCenter;
          
          container.scrollTo({
            left: targetScrollLeft,
            behavior: 'auto',
          });
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [mobileViewMode]);

  return (
    <section className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-white scroll-mt-12 overflow-hidden">
      <div className="site-container max-w-6xl mx-auto space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>EXPANSION CAPABILITIES</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Optional School Modules
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Activate specialized campus modules as your digital operations grow. Every module integrates seamlessly with the core platform.
          </p>
        </div>

        {/* ─── DESKTOP & TABLET: FOCAL-POINT CARD LAYOUT (SMALL → MEDIUM → LARGE → MEDIUM → SMALL) ─── */}
        <div className="hidden md:grid school-focal-card-grid gap-2.5 lg:gap-3.5 xl:gap-4 w-full">
          {schoolAddonCategories.map((group, index) => {
            const Icon = CATEGORY_ICONS[group.id] || CreditCard;
            const isExpanded = expandedCategoryId === group.id;
            const summary = CATEGORY_SUMMARIES[group.id] || group.description;
            const tier = TIER_BY_INDEX[index] || 'medium';

            // Size tier visual tokens
            const isLarge = tier === 'large';
            const isSmall = tier === 'small';

            // Distinctive card container styles
            const containerHeight = isLarge
              ? 'min-h-[290px] lg:min-h-[305px] p-4.5 md:p-5 lg:p-6'
              : isSmall
              ? 'min-h-[225px] lg:min-h-[235px] p-3 md:p-3.5 lg:p-4'
              : 'min-h-[255px] lg:min-h-[268px] p-3.5 md:p-4 lg:p-4.5';

            const cardBorderBg = isExpanded
              ? isLarge
                ? 'border-[#4338CA] bg-indigo-50/50 shadow-xl shadow-indigo-950/[0.08] ring-2 ring-[#4338CA]/30 relative z-10'
                : 'border-[#4338CA] bg-indigo-50/40 shadow-sm ring-2 ring-[#4338CA]/10'
              : isLarge
              ? 'border-[#CBD5E1] bg-white shadow-lg shadow-indigo-950/[0.05] ring-1 ring-[#4338CA]/15 hover:border-[#94A3B8] hover:shadow-xl hover:shadow-indigo-950/[0.08] relative z-10'
              : 'border-[#E2E8F0] bg-[#FAF7F2] hover:border-slate-300 hover:bg-white hover:shadow-xs';

            return (
              <div
                key={group.id}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between ${containerHeight} ${cardBorderBg}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div
                      className={`rounded-xl bg-white border flex items-center justify-center text-[#4338CA] shrink-0 transition-transform ${
                        isLarge
                          ? 'w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 border-indigo-200/80 shadow-xs'
                          : isSmall
                          ? 'w-7 h-7 sm:w-8 sm:h-8 border-[#E2E8F0]'
                          : 'w-8 h-8 sm:w-9 sm:h-9 border-[#E2E8F0]'
                      }`}
                    >
                      <Icon
                        className={
                          isLarge
                            ? 'w-4.5 h-4.5 sm:w-5 sm:h-5'
                            : isSmall
                            ? 'w-3.5 h-3.5 sm:w-4 sm:h-4'
                            : 'w-4 h-4'
                        }
                      />
                    </div>
                    {isLarge ? (
                      <span className="text-[9.5px] lg:text-[10px] font-extrabold text-[#4338CA] uppercase tracking-wider bg-[#4338CA]/10 px-2 py-0.5 rounded-full border border-[#4338CA]/20">
                        {group.categoryNumber}
                      </span>
                    ) : (
                      <span
                        className={`font-bold text-[#64748B] uppercase tracking-wider ${
                          isSmall ? 'text-[8.5px] lg:text-[9px]' : 'text-[9px] lg:text-[9.5px]'
                        }`}
                      >
                        {group.categoryNumber}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3
                      className={`font-extrabold text-[#131B2E] tracking-tight ${
                        isLarge
                          ? 'text-base lg:text-lg font-black'
                          : isSmall
                          ? 'text-xs lg:text-sm'
                          : 'text-sm lg:text-[15px]'
                      }`}
                    >
                      {group.title}
                    </h3>
                    <p
                      className={`text-[#64748B] mt-0.5 line-clamp-2 ${
                        isLarge
                          ? 'text-xs lg:text-sm leading-relaxed font-medium text-[#475569]'
                          : isSmall
                          ? 'text-[10.5px] lg:text-[11px] leading-tight'
                          : 'text-[11px] lg:text-xs leading-snug'
                      }`}
                    >
                      {summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    aria-expanded={isExpanded}
                    className={`w-full rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isLarge
                        ? 'min-h-[38px] md:min-h-[40px] py-2 px-3 text-xs lg:text-sm font-extrabold shadow-xs'
                        : isSmall
                        ? 'min-h-[32px] md:min-h-[34px] py-1.5 px-2 text-[11px] md:text-xs'
                        : 'min-h-[34px] md:min-h-[36px] py-1.5 px-2.5 text-xs'
                    } ${
                      isExpanded
                        ? 'bg-[#4338CA] text-white'
                        : isLarge
                        ? 'bg-white text-[#4338CA] border border-indigo-200 hover:bg-indigo-50/60 shadow-xs'
                        : 'bg-white text-[#4338CA] border border-[#CBD5E1] hover:bg-indigo-50/50'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide' : 'View modules'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── MOBILE: RESPONSIVE SWIPEABLE OR STACKED CAROUSEL (< 768px) ─── */}
        <div className="block md:hidden space-y-3">
          {/* Mobile View Toggle */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              {mobileViewMode === 'carousel' ? 'Swipe to explore' : 'All 5 Categories'}
            </span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setMobileViewMode('carousel')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'carousel'
                    ? 'bg-white text-[#4338CA] shadow-xs'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Carousel
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'list'
                    ? 'bg-white text-[#4338CA] shadow-xs'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                List View
              </button>
            </div>
          </div>

          {mobileViewMode === 'carousel' ? (
            <div className="space-y-3">
              {/* Swipeable Horizontal Snap Reel */}
              <div
                ref={carouselRef}
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-4 -mx-4 pb-3 pt-1 items-center scrollbar-none"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {schoolAddonCategories.map((group, index) => {
                  const Icon = CATEGORY_ICONS[group.id] || CreditCard;
                  const isExpanded = expandedCategoryId === group.id;
                  const summary = CATEGORY_SUMMARIES[group.id] || group.description;
                  const tier = TIER_BY_INDEX[index] || 'medium';
                  const isLarge = tier === 'large';
                  const isSmall = tier === 'small';

                  // Width and sizing per tier on mobile carousel
                  const cardWidth = isLarge
                    ? 'w-[84vw] max-w-[315px] min-h-[275px] p-5'
                    : isSmall
                    ? 'w-[70vw] max-w-[250px] min-h-[230px] p-3.5'
                    : 'w-[77vw] max-w-[280px] min-h-[250px] p-4';

                  const borderBg = isExpanded
                    ? 'border-[#4338CA] bg-indigo-50/50 shadow-md ring-2 ring-[#4338CA]/20'
                    : isLarge
                    ? 'border-[#CBD5E1] bg-white shadow-lg shadow-indigo-950/[0.06] ring-1 ring-[#4338CA]/20'
                    : 'border-[#E2E8F0] bg-[#FAF7F2]';

                  return (
                    <div
                      key={group.id}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                      className={`shrink-0 snap-center rounded-2xl border transition-all duration-200 flex flex-col justify-between ${cardWidth} ${borderBg}`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div
                            className={`rounded-xl bg-white border flex items-center justify-center text-[#4338CA] shrink-0 ${
                              isLarge
                                ? 'w-10 h-10 border-indigo-200/80 shadow-xs'
                                : 'w-8 h-8 border-[#E2E8F0]'
                            }`}
                          >
                            <Icon className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
                          </div>
                          {isLarge ? (
                            <span className="text-[10px] font-extrabold text-[#4338CA] uppercase tracking-wider bg-[#4338CA]/10 px-2 py-0.5 rounded-full border border-[#4338CA]/20">
                              {group.categoryNumber} • FOCAL
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                              {group.categoryNumber}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3
                            className={`font-extrabold text-[#131B2E] tracking-tight ${
                              isLarge ? 'text-base font-black' : isSmall ? 'text-xs' : 'text-sm'
                            }`}
                          >
                            {group.title}
                          </h3>
                          <p
                            className={`text-[#64748B] mt-0.5 line-clamp-2 ${
                              isLarge
                                ? 'text-xs leading-relaxed font-medium text-[#475569]'
                                : 'text-[11px] leading-snug'
                            }`}
                          >
                            {summary}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
                        <button
                          type="button"
                          onClick={() => toggleCategory(group.id)}
                          aria-expanded={isExpanded}
                          className={`w-full rounded-xl font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isLarge ? 'min-h-[38px] py-2 px-3 text-xs' : 'min-h-[34px] py-1.5 px-2.5 text-xs'
                          } ${
                            isExpanded
                              ? 'bg-[#4338CA] text-white'
                              : 'bg-white text-[#4338CA] border border-[#CBD5E1] hover:bg-indigo-50/50'
                          }`}
                        >
                          <span>{isExpanded ? 'Hide' : 'View modules'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Symmetrical Focal Pagination Indicator: SMALL → MEDIUM → LARGE → MEDIUM → SMALL */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {schoolAddonCategories.map((group, idx) => {
                  const tier = TIER_BY_INDEX[idx];
                  const isActive = activeMobileIndex === idx;

                  // Symmetrical indicator sizes reflecting card tier
                  const dotSize =
                    tier === 'large'
                      ? 'w-4 h-4'
                      : tier === 'medium'
                      ? 'w-2.5 h-2.5'
                      : 'w-2 h-2';

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => scrollToCard(idx)}
                      aria-label={`Go to ${group.title} card`}
                      className={`rounded-full transition-all flex items-center justify-center cursor-pointer ${dotSize} ${
                        isActive
                          ? 'bg-[#4338CA] ring-2 ring-[#4338CA]/30 shadow-xs'
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            /* Clean Single-Column Stacked View */
            <div className="space-y-3">
              {schoolAddonCategories.map((group, index) => {
                const Icon = CATEGORY_ICONS[group.id] || CreditCard;
                const isExpanded = expandedCategoryId === group.id;
                const summary = CATEGORY_SUMMARIES[group.id] || group.description;
                const tier = TIER_BY_INDEX[index] || 'medium';
                const isLarge = tier === 'large';

                return (
                  <div
                    key={group.id}
                    className={`rounded-2xl border transition-all duration-200 p-4 ${
                      isExpanded
                        ? 'border-[#4338CA] bg-indigo-50/40 shadow-sm ring-2 ring-[#4338CA]/10'
                        : isLarge
                        ? 'border-[#CBD5E1] bg-white shadow-md ring-1 ring-[#4338CA]/20'
                        : 'border-[#E2E8F0] bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-xl bg-white border flex items-center justify-center text-[#4338CA] shrink-0 ${
                            isLarge ? 'w-10 h-10 border-indigo-200/80 shadow-xs' : 'w-8 h-8 border-[#E2E8F0]'
                          }`}
                        >
                          <Icon className={isLarge ? 'w-5 h-5' : 'w-4 h-4'} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-extrabold text-[#131B2E] ${
                                isLarge ? 'text-base font-black' : 'text-sm'
                              }`}
                            >
                              {group.title}
                            </h3>
                            {isLarge && (
                              <span className="text-[9px] font-extrabold text-[#4338CA] uppercase tracking-wider bg-[#4338CA]/10 px-1.5 py-0.5 rounded-full border border-[#4338CA]/20">
                                Focal
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#64748B] mt-0.5">{summary}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider shrink-0 pt-1">
                        {group.categoryNumber}
                      </span>
                    </div>

                    <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => toggleCategory(group.id)}
                        aria-expanded={isExpanded}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px] ${
                          isExpanded
                            ? 'bg-[#4338CA] text-white'
                            : 'bg-white text-[#4338CA] border border-[#CBD5E1] hover:bg-indigo-50/50'
                        }`}
                      >
                        <span>{isExpanded ? 'Hide' : 'View modules'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── EXPANDED CATEGORY DETAILS PANEL (PROGRESSIVE DISCLOSURE) ─── */}
        {expandedCategoryId && (
          <div
            id="school-optional-modules-details"
            className="bg-[#FAF7F2] rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 space-y-5 animate-in fade-in duration-200"
          >
            {(() => {
              const group = schoolAddonCategories.find((g) => g.id === expandedCategoryId);
              if (!group) return null;

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#4338CA] uppercase tracking-wider block">
                        {group.categoryNumber} — {group.title}
                      </span>
                      <h4 className="text-base font-extrabold text-[#131B2E]">
                        Available Specialized Modules
                      </h4>
                    </div>
                    <p className="text-xs text-[#64748B]">{group.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-sm text-[#131B2E]">
                            {addon.name}
                          </h5>
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {addon.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {addon.priceNote}
                          </span>
                          <Link
                            href="/schools/configure"
                            className="inline-flex items-center gap-1 font-bold text-[#4338CA] hover:text-[#3730A3]"
                          >
                            <span>Add to proposal</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
