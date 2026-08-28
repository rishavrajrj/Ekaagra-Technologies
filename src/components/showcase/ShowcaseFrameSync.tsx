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
      const heroEl = document.getElementById('hero');
      const vh = window.innerHeight;
      const heroHeight = heroEl ? heroEl.offsetHeight : 680;
      // On 2K/4K displays and large viewports, frame height matches full viewport
      const optimalFrameHeight = Math.max(heroHeight, vh);

      document.documentElement.style.setProperty(
        '--showcase-frame-height',
        `${optimalFrameHeight}px`
      );
    };

    measureAndSync();

    const heroEl = document.getElementById('hero');
    let observer: ResizeObserver | null = null;

    if (heroEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        measureAndSync();
      });
      observer.observe(heroEl);
    }

    window.addEventListener('resize', measureAndSync, { passive: true });
    window.addEventListener('orientationchange', measureAndSync, { passive: true });

    return () => {
      if (observer) observer.disconnect();
      window.removeEventListener('resize', measureAndSync);
      window.removeEventListener('orientationchange', measureAndSync);
    };
  }, []);

  return null;
}
