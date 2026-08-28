'use client';

import { useEffect } from 'react';

/**
 * ShowcaseFrameSync dynamically calculates the optimal frame height
 * across standard, 2K, and 4K displays, ensuring every section fills
 * the viewport seamlessly.
 */
export default function ShowcaseFrameSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureAndSync = () => {
      const vh = window.innerHeight;
      const headerEl = document.querySelector('header');
      const navH = headerEl ? headerEl.offsetHeight : 72;
      const availableHeight = Math.max(660, vh - navH);

      document.documentElement.style.setProperty(
        '--showcase-frame-height',
        `${availableHeight}px`
      );
    };

    measureAndSync();

    window.addEventListener('resize', measureAndSync, { passive: true });
    window.addEventListener('orientationchange', measureAndSync, { passive: true });

    return () => {
      window.removeEventListener('resize', measureAndSync);
      window.removeEventListener('orientationchange', measureAndSync);
    };
  }, []);

  return null;
}
