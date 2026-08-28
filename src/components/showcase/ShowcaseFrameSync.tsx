'use client';

import { useEffect } from 'react';

/**
 * ShowcaseFrameSync dynamically measures the rendered height of #hero
 * and synchronizes the `--showcase-frame-height` CSS custom property
 * on documentElement and window resize/orientation change.
 */
export default function ShowcaseFrameSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measureAndSync = () => {
      const heroEl = document.getElementById('hero');
      if (heroEl) {
        const height = heroEl.offsetHeight;
        if (height > 0) {
          document.documentElement.style.setProperty(
            '--showcase-frame-height',
            `${height}px`
          );
        }
      }
    };

    measureAndSync();

    // ResizeObserver for dynamic measurement
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
