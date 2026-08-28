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
  typingSpeed = 80,
  deletingSpeed = 40,
  pauseDuration = 2500,
  className = '',
}: TypewriterHeadlineProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState(phrases[0] || 'people remember.');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

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
  }, [currentText, isDeleting, isPaused, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration, isHydrated]);

  return (
    <h1 className={`fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight ${className}`}>
      {prefix}{' '}
      <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift">
        <span>{currentText}</span>
        <span
          className="inline-block w-[3px] sm:w-[4px] h-[0.88em] align-middle ml-1 bg-gradient-to-b from-[#4338CA] to-[#F97360] rounded-full animate-cursor-blink shadow-[0_0_10px_rgba(249,115,96,0.85)]"
          aria-hidden="true"
        />
      </span>
    </h1>
  );
}
