'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS, type DensityMode } from '@/lib/design-system/tokens';
import { getDensityMode } from '@/lib/design-system/responsive';

export interface ViewportState {
  isMobile: boolean;
  isTablet: boolean;
  isCompactDesktop: boolean;
  isDesktop: boolean;
  isWideDesktop: boolean;
  density: DensityMode;
}

const DEFAULT_VIEWPORT: ViewportState = {
  isMobile: false,
  isTablet: false,
  isCompactDesktop: false,
  isDesktop: true,
  isWideDesktop: false,
  density: 'standard',
};

export function useEkaagraViewport(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const queries = {
      mobile: window.matchMedia(`(max-width: ${BREAKPOINTS.tablet - 1}px)`),
      tablet: window.matchMedia(
        `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.compactDesktop - 1}px)`
      ),
      compactDesktop: window.matchMedia(
        `(min-width: ${BREAKPOINTS.compactDesktop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`
      ),
      desktop: window.matchMedia(
        `(min-width: ${BREAKPOINTS.desktop}px) and (max-width: ${BREAKPOINTS.wideDesktop - 1}px)`
      ),
      wideDesktop: window.matchMedia(`(min-width: ${BREAKPOINTS.wideDesktop}px)`),
    };

    const updateMatches = () => {
      const isMobile = queries.mobile.matches;
      const isTablet = queries.tablet.matches;
      const isCompactDesktop = queries.compactDesktop.matches;
      const isDesktop = queries.desktop.matches;
      const isWideDesktop = queries.wideDesktop.matches;
      const density = getDensityMode(window.innerWidth);

      setViewport({
        isMobile,
        isTablet,
        isCompactDesktop,
        isDesktop,
        isWideDesktop,
        density,
      });
    };

    updateMatches();

    const listeners = Object.values(queries).map((mq) => {
      mq.addEventListener('change', updateMatches);
      return () => mq.removeEventListener('change', updateMatches);
    });

    return () => {
      listeners.forEach((cleanup) => cleanup());
    };
  }, []);

  return viewport;
}
