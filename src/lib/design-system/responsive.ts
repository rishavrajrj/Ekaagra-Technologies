/**
 * Ekaagra Technologies Responsive Breakpoint Utilities
 */

import { BREAKPOINTS, type BreakpointKey, type DensityMode } from './tokens';

export function getDensityMode(width: number): DensityMode {
  if (width < BREAKPOINTS.desktop) {
    return 'compact';
  }
  if (width < BREAKPOINTS.wideDesktop) {
    return 'standard';
  }
  return 'spacious';
}

export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.compactDesktop - 1}px)`,
  compactDesktop: `(min-width: ${BREAKPOINTS.compactDesktop}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px) and (max-width: ${BREAKPOINTS.wideDesktop - 1}px)`,
  wideDesktop: `(min-width: ${BREAKPOINTS.wideDesktop}px)`,
  ultrawide: `(min-width: ${BREAKPOINTS.ultrawide}px)`,
} as const;
