'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterHeadlineProps {
  prefix?: string;
  phrases?: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

const DEFAULT_PHRASES = [
  'people remember.',
  'that drives sales.',
  'built to scale.',
  'that commands trust.',
];

export default function TypewriterHeadline({
  prefix = 'Your business deserves a website',
  phrases = DEFAULT_PHRASES,
  pauseDuration = 3800,
  className = '',
}: TypewriterHeadlineProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
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

  useEffect(() => {
    if (!isHydrated || isReducedMotion || !phrases || phrases.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);

      const swapTimer = setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        setIsTransitioning(false);
      }, 220);

      return () => clearTimeout(swapTimer);
    }, pauseDuration || 3800);

    return () => clearInterval(interval);
  }, [isHydrated, isReducedMotion, phrases, pauseDuration]);

  const displayPhrase = phrases[currentPhraseIndex] || phrases[0] || '';

  return (
    <h1 className={`fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight leading-[1.16] overflow-visible ${className}`}>
      <span>{prefix}</span>{' '}
      <span
        className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift transition-all duration-300 ease-in-out px-1 whitespace-normal break-words ${
          isTransitioning ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
        }`}
      >
        {displayPhrase}
      </span>
    </h1>
  );
}
