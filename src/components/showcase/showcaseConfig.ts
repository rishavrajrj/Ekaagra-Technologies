export interface ShowcaseTourStep {
  id: string;
  sectionId: string;
  number: string;
  label: string;
  subtitle: string;
  duration: number; // in milliseconds (time camera spends focused on this section)
}

export interface ShowcaseConfig {
  enabled: boolean;
  autoTriggerOnIdle: boolean;
  idleTimeout: number; // in milliseconds
  mobileIdleTimeout: number; // in milliseconds
  showManualButton: boolean;
  showProgress: boolean;
  showControls: boolean;
  loop: boolean;
}

/**
 * Global Showcase / Screensaver Configuration
 */
export const SHOWCASE_IDLE_TIMEOUT = 30000; // 30 seconds default
export const SHOWCASE_MOBILE_IDLE_TIMEOUT = 45000; // 45 seconds on mobile

export const SHOWCASE_CONFIG: ShowcaseConfig = {
  enabled: true,
  autoTriggerOnIdle: false, // Showcase is ONLY triggered manually through buttons
  idleTimeout: SHOWCASE_IDLE_TIMEOUT,
  mobileIdleTimeout: SHOWCASE_MOBILE_IDLE_TIMEOUT,
  showManualButton: true,
  showProgress: true,
  showControls: true,
  loop: true,
};

/**
 * Automated Tour Chapters across the REAL Ekaagra Technologies Website
 */
export const SHOWCASE_TOUR_STEPS: ShowcaseTourStep[] = [
  {
    id: 'hero',
    sectionId: 'hero',
    number: '01',
    label: 'Hero & Signature Work',
    subtitle: 'High-Converting Digital Experiences',
    duration: 7500,
  },
  {
    id: 'industries',
    sectionId: 'industries',
    number: '02',
    label: 'Industries We Serve',
    subtitle: 'Education, Healthcare, Corporate & Local Brands',
    duration: 7000,
  },
  {
    id: 'transformation',
    sectionId: 'transformation',
    number: '03',
    label: 'The Transformation',
    subtitle: 'Generic Templates vs. Ekaagra Custom Craftsmanship',
    duration: 7000,
  },
  {
    id: 'services',
    sectionId: 'services',
    number: '04',
    label: 'End-to-End Services',
    subtitle: 'Websites, Web Apps, Android & Enterprise ERP',
    duration: 7000,
  },
  {
    id: 'process',
    sectionId: 'process',
    number: '05',
    label: 'Transparent Workflow',
    subtitle: '6-Step Predictable Roadmap to Live Launch',
    duration: 7000,
  },
  {
    id: 'pricing',
    sectionId: 'pricing',
    number: '06',
    label: 'Transparent Investment',
    subtitle: 'Honest Packages & Featured Prestige Bundle',
    duration: 7000,
  },
  {
    id: 'technology',
    sectionId: 'technology',
    number: '07',
    label: 'Modern Tech & Trust',
    subtitle: 'Sub-500ms Speed, Next.js & Full Code Ownership',
    duration: 7000,
  },
  {
    id: 'faq',
    sectionId: 'faq',
    number: '08',
    label: 'Clear Answers & Objections',
    subtitle: 'Code Ownership, Timelines, Revisions & Support',
    duration: 7000,
  },
  {
    id: 'final-cta',
    sectionId: 'final-cta',
    number: '09',
    label: 'Let\'s Build Together',
    subtitle: 'Custom Estimate & Roadmap within 24 Hours',
    duration: 7500,
  },
];
