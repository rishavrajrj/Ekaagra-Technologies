'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { PAGE_HEROES, type PageHeroKey } from '@/lib/pageHeroConfig';

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
  children?: React.ReactNode;
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
  children,
  className = '',
  id,
}: AnimatedPageHeroProps) {
  const config = pageName ? PAGE_HEROES[pageName] : null;

  const isInline = propIsInline ?? (pageName === 'home');
  const eyebrow = propEyebrow ?? config?.eyebrow ?? '✦ DIGITAL PRODUCTS • BUILT DIFFERENT';
  const prefix = propPrefix ?? config?.prefix ?? 'Your business deserves a website';
  const phrases = propPhrases ?? config?.phrases ?? [
    'people remember.',
    'that drives sales.',
    'built to scale.',
    'that commands trust.',
  ];
  const description = propDescription ?? config?.description ?? '';

  const longestPhrase = useMemo(() => {
    if (!phrases || phrases.length === 0) return '';
    return phrases.reduce((longest, curr) =>
      curr.length > longest.length ? curr : longest,
      phrases[0]
    );
  }, [phrases]);

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

    const fullPhrase = phrases[currentPhraseIndex];

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

  return (
    <section
      id={id}
      aria-label={`${prefix} ${phrases[0] || ''}`}
      className={`relative w-full bg-[#FAF7F2] bg-warm-grid border-b border-[#E2E8F0] overflow-hidden py-16 sm:py-20 lg:py-24 ${className}`}
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

      <div className="site-container relative z-10 text-center mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#4338CA]/20 bg-[#4338CA]/10 text-[#4338CA] shadow-xs mb-5 sm:mb-7">
          <Sparkles className="w-3.5 h-3.5 text-[#F97360] shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest">
            {eyebrow}
          </span>
        </div>

        {/* Dynamic Typewriter Headline with Colour Changing Gradient */}
        {isInline ? (
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight max-w-5xl mx-auto leading-[1.24] sm:leading-[1.20] pb-2 overflow-visible">
            <span className="inline text-[#131B2E]">{prefix}</span>{' '}
            <span className="relative inline-grid place-items-start align-baseline overflow-visible pb-2 -mb-2">
              {/* Invisible ghost sizer holding the longest phrase to lock container dimensions */}
              <span
                aria-hidden="true"
                className="invisible select-none pointer-events-none col-start-1 row-start-1 opacity-0 px-1"
              >
                {longestPhrase}
                <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
              </span>

              {/* Active typing text occupying the exact same space, sitting just beside prefix */}
              <span className="col-start-1 row-start-1 text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-1 -mx-1 overflow-visible text-left">
                <span>{currentText || '\u00A0'}</span>
                {!isReducedMotion && (
                  <span
                    className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                    aria-hidden="true"
                  />
                )}
              </span>
            </span>
          </h1>
        ) : (
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight max-w-4xl mx-auto leading-[1.24] sm:leading-[1.20] pb-2 overflow-visible">
            {/* Prefix always on line 1 */}
            <span className="block text-[#131B2E] mb-1.5 sm:mb-2.5">
              {prefix}
            </span>

            {/* Animated Text always on line 2 with pre-reserved space so container never shrinks */}
            <span className="relative inline-grid place-items-center max-w-full overflow-visible pb-2 -mb-2">
              {/* Invisible ghost sizer holding the longest phrase to lock container dimensions */}
              <span
                aria-hidden="true"
                className="invisible select-none pointer-events-none col-start-1 row-start-1 opacity-0 whitespace-normal px-2"
              >
                {longestPhrase}
                <span className="inline-block w-[3px] sm:w-[4px] h-[0.88em] ml-1.5" />
              </span>

              {/* Active typing text occupying the exact same space */}
              <span className="col-start-1 row-start-1 text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift px-2 -mx-2 overflow-visible">
                <span>{currentText || '\u00A0'}</span>
                {!isReducedMotion && (
                  <span
                    className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1.5 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
                    aria-hidden="true"
                  />
                )}
              </span>
            </span>
          </h1>
        )}

        {/* Supporting Copy */}
        {description && (
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed mt-4 sm:mt-5 font-normal">
            {description}
          </p>
        )}

        {/* Optional Action / CTAs Slot */}
        {children && (
          <div className="mt-7 sm:mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
