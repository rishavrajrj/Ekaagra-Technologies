'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import MagneticButton from '@/components/motion/MagneticButton';
import {
  PAGE_HEROES,
  type PageHeroKey,
  type TrustPill,
  type HeroCta,
  DEFAULT_TRUST_PILLS,
} from '@/lib/pageHeroConfig';
import TrustPillsSlideshow from '@/components/ui/TrustPillsSlideshow';

export interface AnimatedPageHeroProps {
  pageName?: PageHeroKey;
  eyebrow?: string;
  prefix?: string;
  phrases?: string[];
  description?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  isInlineAnimatedText?: boolean;
  fitViewport?: boolean;
  showTrustStrip?: boolean;
  trustTitle?: string;
  trustSubtitle?: string;
  trustPills?: TrustPill[];
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  children?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string;
  id?: string;
}

export default function AnimatedPageHero({
  pageName,
  eyebrow: propEyebrow,
  prefix: propPrefix,
  phrases: propPhrases,
  description: propDescription,
  typingSpeed = 75,
  deletingSpeed = 38,
  pauseDuration = 2400,
  isInlineAnimatedText: propIsInline,
  fitViewport: propFitViewport,
  showTrustStrip: propShowTrustStrip,
  trustTitle: propTrustTitle,
  trustSubtitle: propTrustSubtitle,
  trustPills: propTrustPills,
  primaryCta: propPrimaryCta,
  secondaryCta: propSecondaryCta,
  children,
  rightContent,
  className = '',
  id,
}: AnimatedPageHeroProps) {
  const config = pageName ? PAGE_HEROES[pageName] : null;
  const fitViewport = propFitViewport ?? true;
  const isInline = propIsInline ?? true;
  const showTrustStrip = propShowTrustStrip ?? true;
  const eyebrow = propEyebrow ?? config?.eyebrow ?? '✦ DIGITAL PRODUCTS • BUILT DIFFERENT';
  const prefix = propPrefix ?? config?.prefix ?? 'Your business deserves a website';
  const phrases = propPhrases ?? config?.phrases ?? [
    'people remember.',
    'that drives sales.',
    'built to scale.',
    'that commands trust.',
  ];
  const description = propDescription ?? config?.description ?? '';
  const primaryCta = propPrimaryCta ?? config?.primaryCta;
  const secondaryCta = propSecondaryCta ?? config?.secondaryCta;
  const trustTitle = propTrustTitle ?? config?.trustTitle ?? '✦ Why Ekaagra';
  const trustSubtitle = propTrustSubtitle ?? config?.trustSubtitle ?? 'Built around quality, performance & real results.';
  const trustPills = propTrustPills ?? config?.trustPills ?? DEFAULT_TRUST_PILLS;
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState(phrases[0] || 'people remember.');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Typewriter Loop
  useEffect(() => {
    if (!isHydrated) return;

    if (isReducedMotion) {
      setCurrentText(phrases[0] || 'people remember.');
      return;
    }

    const fullPhrase = phrases[currentPhraseIndex] || '';

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    if (!isDeleting) {
      // Natural typing forward
      if (currentText.length < fullPhrase.length) {
        const timeout = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length + 1));
        }, typingSpeed + (Math.random() * 20 - 10));
        return () => clearTimeout(timeout);
      } else {
        // Reached end of phrase, hold
        setIsPaused(true);
      }
    } else {
      // Backspacing smoothly
      if (currentText.length > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(fullPhrase.slice(0, currentText.length - 1));
        }, deletingSpeed);
        return () => clearTimeout(timeout);
      } else {
        // Advance to next phrase
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      }
    }
  }, [
    currentText,
    isDeleting,
    isPaused,
    currentPhraseIndex,
    phrases,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    isHydrated,
    isReducedMotion,
  ]);

  const hasCustomPadding = Boolean(className && (/\b(py-|pt-|pb-)/).test(className));
  const paddingClasses = hasCustomPadding
    ? ''
    : rightContent
      ? fitViewport
        ? 'py-3 sm:py-4 lg:py-4 xl:py-5'
        : 'py-6 sm:py-8 lg:py-10'
      : fitViewport
        ? 'py-3 sm:py-5 lg:py-7'
        : 'py-10 sm:py-12 lg:py-16';

  const viewportClasses = fitViewport
    ? 'min-h-[calc(100dvh-var(--eka-header-height,4.5rem))] flex flex-col justify-center'
    : '';

  return (
    <section
      id={id}
      aria-label={`${prefix} ${phrases[0] || ''}`}
      className={`relative w-full bg-[#FAF7F2] bg-warm-grid border-b border-[#E2E8F0] overflow-hidden ${viewportClasses} ${paddingClasses} ${className}`}
    >
      {/* Ambient Top Glows matching Main Page */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-warm-glow pointer-events-none animate-aurora-glow"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {rightContent ? (
        /* ═══════════════════════════════════════════════════════════════
           PREMIUM TWO-COLUMN DESKTOP HERO COMPOSITION
           Left: Brand Messaging, Typewriter H1, CTAs, Why Ekaagra
           Right: Live Interactive Website Preview Showcase
           ═══════════════════════════════════════════════════════════════ */
        <div className={`site-container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full ${fitViewport ? 'my-auto' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 2xl:gap-12 items-center lg:items-stretch">
            {/* ─── LEFT COLUMN: Messaging & Authority ─── */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left justify-between h-full w-full min-w-0">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-3 sm:space-y-3.5 lg:space-y-3 xl:space-y-3.5 w-full">
                {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4338CA]/20 bg-[#4338CA]/10 text-[#4338CA] shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360] shrink-0" />
                <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.14em]">
                  {eyebrow}
                </span>
              </div>

              {/* Dynamic Typewriter Headline with Pre-Reserved Layout Sizing */}
              {isInline ? (
                <div className="relative w-full grid grid-cols-1 items-start justify-items-center lg:justify-items-start">
                  {/* Invisible ghost sizer holding max bounds across all phrases to lock dimensions */}
                  <div
                    aria-hidden="true"
                    className="col-start-1 row-start-1 invisible select-none pointer-events-none opacity-0 grid grid-cols-1 w-full"
                  >
                    {phrases.map((phrase, i) => (
                      <div
                        key={i}
                        className="col-start-1 row-start-1 fluid-hero-headline font-extrabold tracking-tight leading-[1.14] text-center lg:text-left w-full pb-1 lg:text-[2.2rem] xl:text-[2.6rem] 2xl:text-[3.1rem]"
                      >
                        <span className="inline text-[#131B2E]">{prefix}</span>{' '}
                        <span className="inline px-0.5 whitespace-normal break-words">
                          {phrase}
                          <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Active typing H1 occupying the exact same space without jumping */}
                  <h1 className="col-start-1 row-start-1 self-start fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight leading-[1.14] text-center lg:text-left w-full pb-1 overflow-visible lg:text-[2.2rem] xl:text-[2.6rem] 2xl:text-[3.1rem]">
                    <span className="inline text-[#131B2E]">{prefix}</span>{' '}
                    <span className="relative inline text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-0.5 whitespace-normal break-words">
                      <span>{currentText || '\u00A0'}</span>
                      {!isReducedMotion && (
                        <span
                          className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </h1>
                </div>
              ) : (
                <div className="relative w-full grid grid-cols-1 items-start justify-items-center lg:justify-items-start">
                  <div
                    aria-hidden="true"
                    className="col-start-1 row-start-1 invisible select-none pointer-events-none opacity-0 grid grid-cols-1 w-full"
                  >
                    {phrases.map((phrase, i) => (
                      <div
                        key={i}
                        className="col-start-1 row-start-1 fluid-hero-headline font-extrabold tracking-tight leading-[1.14] text-center lg:text-left w-full pb-1 lg:text-[2.2rem] xl:text-[2.6rem] 2xl:text-[3.1rem]"
                      >
                        <span className="block text-[#131B2E] mb-1.5 sm:mb-2">{prefix}</span>
                        <span className="inline-block px-1 whitespace-normal break-words">
                          {phrase}
                          <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
                        </span>
                      </div>
                    ))}
                  </div>

                  <h1 className="col-start-1 row-start-1 self-start fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight leading-[1.14] text-center lg:text-left w-full pb-1 overflow-visible lg:text-[2.2rem] xl:text-[2.6rem] 2xl:text-[3.1rem]">
                    <span className="block text-[#131B2E] mb-1.5 sm:mb-2">
                      {prefix}
                    </span>
                    <span className="relative inline text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-0.5 whitespace-normal break-words">
                      <span>{currentText || '\u00A0'}</span>
                      {!isReducedMotion && (
                        <span
                          className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </h1>
                </div>
              )}

              {/* Supporting Copy */}
              {description && (
                <p className="hero-supporting-subtitle text-center lg:text-left mx-auto lg:mx-0 max-w-xl font-normal text-[#64748B]">
                  {description}
                </p>
              )}

              {/* Action / CTAs Slot */}
              {(children || primaryCta) && (
                <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 pt-1">
                  {children ? (
                    children
                  ) : (
                    <>
                      {primaryCta && (
                        <MagneticButton maxDistance={6}>
                          <Link
                            href={primaryCta.href}
                            className="premium-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/40 hover:-translate-y-0.5 active:translate-y-0"
                          >
                            <span>{primaryCta.label}</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </MagneticButton>
                      )}
                      {secondaryCta && (
                        <MagneticButton maxDistance={5}>
                          <Link
                            href={secondaryCta.href}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/40 hover:text-[#4338CA] transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5"
                          >
                            <span>{secondaryCta.label}</span>
                          </Link>
                        </MagneticButton>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN: Interactive Proof & Live Showcase ─── */}
          <div className="w-full min-w-0 flex flex-col justify-between h-full mt-4 lg:mt-0">
            {rightContent}
          </div>
          </div>
        </div>
      ) : (
        /* Standard Centered Single-Column Layout for Subpages */
        <div className={`site-container relative z-10 text-center mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center ${fitViewport ? 'my-auto' : ''}`}>
          {/* Eyebrow Pill */}
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#4338CA]/20 bg-[#4338CA]/10 text-[#4338CA] shadow-xs ${fitViewport ? 'mb-2 sm:mb-3' : 'mb-4 sm:mb-5'}`}>
            <Sparkles className="w-3.5 h-3.5 text-[#F97360] shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em]">
              {eyebrow}
            </span>
          </div>

          {/* Dynamic Typewriter Headline with Pre-Reserved Layout Sizing */}
          {isInline ? (
            <div className="relative w-full max-w-5xl mx-auto grid grid-cols-1 items-start justify-items-center">
              {/* Invisible ghost sizer holding all full phrases to lock container dimensions */}
              <div
                aria-hidden="true"
                className="col-start-1 row-start-1 invisible select-none pointer-events-none opacity-0 grid grid-cols-1 w-full"
              >
                {phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="col-start-1 row-start-1 fluid-hero-headline font-extrabold tracking-tight leading-[1.14] text-center w-full pb-2"
                  >
                    <span className="inline text-[#131B2E]">{prefix}</span>{' '}
                    <span className="inline px-1 whitespace-normal break-words">
                      {phrase}
                      <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
                    </span>
                  </div>
                ))}
              </div>

              {/* Active typing H1 occupying the exact same space without jumping or layout shift */}
              <h1 className="col-start-1 row-start-1 self-start fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight leading-[1.14] text-center w-full pb-2 overflow-visible">
                <span className="inline text-[#131B2E]">{prefix}</span>{' '}
                <span className="relative inline text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-1 whitespace-normal break-words">
                  <span>{currentText || '\u00A0'}</span>
                  {!isReducedMotion && (
                    <span
                      className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </h1>
            </div>
          ) : (
            <div className="relative w-full max-w-4xl mx-auto grid grid-cols-1 items-start justify-items-center">
              {/* Fallback Block Mode: with pre-reserved height */}
              <div
                aria-hidden="true"
                className="col-start-1 row-start-1 invisible select-none pointer-events-none opacity-0 grid grid-cols-1 w-full"
              >
                {phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="col-start-1 row-start-1 fluid-hero-headline font-extrabold tracking-tight leading-[1.14] text-center w-full pb-2"
                  >
                    <span className="block text-[#131B2E] mb-1.5 sm:mb-2.5">{prefix}</span>
                    <span className="inline-block px-1 whitespace-normal break-words">
                      {phrase}
                      <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
                    </span>
                  </div>
                ))}
              </div>

              <h1 className="col-start-1 row-start-1 self-start fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight leading-[1.14] text-center w-full pb-2 overflow-visible">
                <span className="block text-[#131B2E] mb-1.5 sm:mb-2.5">
                  {prefix}
                </span>
                <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-1 whitespace-normal break-words">
                  <span>{currentText || '\u00A0'}</span>
                  {!isReducedMotion && (
                    <span
                      className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </h1>
            </div>
          )}

          {/* Supporting Copy */}
          {description && (
            <p className={`hero-supporting-subtitle text-center mx-auto font-normal ${fitViewport ? 'mt-2.5 sm:mt-3.5' : 'mt-4 sm:mt-6'}`}>
              {description}
            </p>
          )}

          {/* Action / CTAs Slot */}
          {(children || primaryCta) && (
            <div className={`flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full ${fitViewport ? 'mt-3 sm:mt-4' : 'mt-5 sm:mt-7'}`}>
              {children ? (
                children
              ) : (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
                  {primaryCta && (
                    <MagneticButton maxDistance={6}>
                      <Link
                        href={primaryCta.href}
                        className="premium-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/40 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <span>{primaryCta.label}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </MagneticButton>
                  )}
                  {secondaryCta && (
                    <MagneticButton maxDistance={5}>
                      <Link
                        href={secondaryCta.href}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/40 hover:text-[#4338CA] transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5"
                      >
                        <span>{secondaryCta.label}</span>
                      </Link>
                    </MagneticButton>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Why Ekaagra Trust Strip */}
          {showTrustStrip && trustPills && trustPills.length > 0 && (
            <div className={`w-full max-w-4xl flex flex-col items-center ${fitViewport ? 'mt-3.5 sm:mt-4 pt-3 sm:pt-3.5' : 'mt-6 sm:mt-8 pt-4 sm:pt-5'} border-t border-[#E2E8F0]/60`}>
              {trustTitle && (
                <p className="text-center text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#4338CA] mb-1">
                  {trustTitle}
                </p>
              )}
              {trustSubtitle && (
                <p className="text-center text-[12px] sm:text-[13px] font-medium text-[#64748B] mb-2 sm:mb-2.5">
                  {trustSubtitle}
                </p>
              )}
              <TrustPillsSlideshow pills={trustPills} align="center" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
