'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { TrustPill } from '@/lib/pageHeroConfig';

export interface TrustPillsSlideshowProps {
  pills: TrustPill[];
  align?: 'left' | 'center';
  interval?: number;
  className?: string;
}

export default function TrustPillsSlideshow({
  pills,
  align = 'center',
  interval = 2800,
  className = '',
}: TrustPillsSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const total = pills?.length || 0;

  // Responsive visible count: 3 on desktop/tablet, 2 on wide mobile, 1 on small mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateCount = () => {
      if (window.innerWidth < 480) {
        setVisibleCount(1);
      } else if (window.innerWidth < 640) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateCount();
    window.addEventListener('resize', updateCount, { passive: true });
    return () => window.removeEventListener('resize', updateCount);
  }, []);

  // Reduced motion detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mediaQuery.matches);
      const handleChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Advance by 1 item to the left
  const handleNext = useCallback(() => {
    if (total <= visibleCount) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [total, visibleCount]);

  // Seamless reset when reaching the cloned boundary
  const handleTransitionEnd = () => {
    if (currentIndex >= total) {
      setIsTransitioning(false);
      setCurrentIndex(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    }
  };

  // Autoplay ticker loop
  useEffect(() => {
    if (total <= visibleCount || isPaused || isReducedMotion) return;

    const timer = setInterval(() => {
      handleNext();
    }, interval);

    return () => clearInterval(timer);
  }, [total, visibleCount, isPaused, isReducedMotion, interval, handleNext]);

  if (!pills || total === 0) return null;

  // Create an extended array for seamless wrap-around sliding
  const extendedPills = total > visibleCount ? [...pills, ...pills, ...pills] : pills;
  const isCenter = align === 'center';
  const itemWidthPercent = 100 / visibleCount;

  return (
    <div
      className={`w-full flex flex-col ${
        isCenter ? 'items-center' : 'items-center lg:items-start'
      } py-1 select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Why Ekaagra Trust Highlights"
    >
      {/* Sliding Viewport - strictly overflow-hidden, shows 3 items at once, slides 1 by 1 */}
      <div className="relative overflow-hidden w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl touch-pan-y">
        <div
          className="flex"
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translateX(-${currentIndex * itemWidthPercent}%)`,
            transition: isTransitioning && !isReducedMotion
              ? 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)'
              : 'none',
          }}
        >
          {extendedPills.map((pill, idx) => (
            <div
              key={`${pill.label}-${idx}`}
              style={{ width: `${itemWidthPercent}%` }}
              className="shrink-0 flex items-center justify-center px-1.5 sm:px-2.5 py-0.5"
            >
              <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/95 border border-[#E2E8F0] shadow-xs hover:border-[#4338CA]/30 transition-colors whitespace-nowrap">
                <span
                  className="w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-2xs animate-pulse"
                  style={{ backgroundColor: pill.color }}
                />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.06em] text-[#334155] uppercase whitespace-nowrap select-none">
                  {pill.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
