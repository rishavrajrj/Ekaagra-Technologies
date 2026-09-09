/**
 * Ekaagra Technologies Design System Tokens
 * Centralized responsive layout, density, and spatial constants.
 * CSS variables in globals.css remain the primary source of truth for runtime styling.
 */

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  compactDesktop: 1024,
  desktop: 1366,
  largeDesktop: 1600,
  wideDesktop: 1920,
  ultrawide: 2560,
  fourK: 3840,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export const LAYOUT_TOKENS = {
  sidebar: {
    compact: 248,   // 1024px - 1366px (e.g. 1920x1080 @ 150% Windows scaling)
    standard: 268,  // 1367px - 1919px
    spacious: 280,  // 1920px+ (4K, Ultrawide)
  },
  header: {
    height: 64, // 4rem stable height
  },
  contentMaxWidth: {
    publicSite: 1400,
    adminPortal: 1720, // Clean centered max-width on 4K & Ultrawide
  },
  padding: {
    mobile: 16,
    compact: 20,
    standard: 28,
    spacious: 32,
  },
  cardGap: {
    mobile: 12,
    compact: 14,
    standard: 18,
    spacious: 20,
  },
  sectionGap: {
    mobile: 16,
    compact: 20,
    standard: 28,
    spacious: 32,
  },
} as const;

export type DensityMode = 'compact' | 'standard' | 'spacious';
