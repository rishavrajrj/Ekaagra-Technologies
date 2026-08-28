'use client';

import React, { useEffect, useState } from 'react';
import { useShowcase } from '@/components/showcase/ShowcaseProvider';

export default function ScrollProgress() {
  const [scrollPercentage, setScrollPercentage] = useState(0);
  let isShowcaseOpen = false;

  try {
    const showcase = useShowcase();
    isShowcaseOpen = showcase.isOpen;
  } catch {
    // fallback if outside provider
  }

  useEffect(() => {
    if (typeof window === 'undefined' || isShowcaseOpen) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docEl = document.documentElement;
          const totalHeight = docEl.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const current = (window.scrollY / totalHeight) * 100;
            setScrollPercentage(Math.min(100, Math.max(0, current)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isShowcaseOpen]);

  if (isShowcaseOpen || scrollPercentage <= 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[60] h-[2.5px] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#F4C95D] transition-all duration-75 shadow-[0_0_8px_rgba(249,115,96,0.8)]"
        style={{ width: `${scrollPercentage}%` }}
      />
    </div>
  );
}
