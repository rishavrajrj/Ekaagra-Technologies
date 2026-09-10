export type PageHeroKey =
  | 'home'
  | 'work'
  | 'services'
  | 'schools'
  | 'pricing'
  | 'contact'
  | 'quote'
  | 'about';

export interface HeroCta {
  label: string;
  href: string;
}

export interface TrustPill {
  label: string;
  color: string;
}

export interface PageHeroConfig {
  pageName: PageHeroKey;
  eyebrow: string;
  prefix: string;
  phrases: string[];
  description: string;
  primaryCta?: HeroCta;
  secondaryCta?: HeroCta;
  trustTitle?: string;
  trustSubtitle?: string;
  trustPills?: TrustPill[];
}

export const DEFAULT_TRUST_PILLS: TrustPill[] = [
  { label: '100% Custom Designed', color: '#4338CA' },
  { label: 'Mobile-First Architecture', color: '#F97360' },
  { label: 'Direct Lead Capture', color: '#F4C95D' },
  { label: 'India-Based • Global Reach', color: '#10B981' },
];

export const PAGE_HEROES: Record<PageHeroKey, PageHeroConfig> = {
  home: {
    pageName: 'home',
    eyebrow: '✦ EKAAGRA DIGITAL STUDIO • ENGINEERED TO WIN',
    prefix: 'We engineer high-impact websites that',
    phrases: [
      'turn visitors into revenue.',
      'dominate your market.',
      'command absolute trust.',
      'leave competitors behind.',
    ],
    description:
      'We combine world-class UI/UX design, modern cloud architecture, and conversion science to build digital experiences that command authority and drive explosive business growth.',
    primaryCta: {
      label: 'Build My Website',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'Explore Our Work',
      href: '/projects',
    },
    trustTitle: '✦ Why Ekaagra',
    trustSubtitle: 'Built around quality, performance & real results.',
    trustPills: DEFAULT_TRUST_PILLS,
  },
  work: {
    pageName: 'work',
    eyebrow: '✦ PROJECTS • STORIES • RESULTS',
    prefix: 'Some websites get visited. Ours get',
    phrases: [
      'remembered.',
      'real results.',
      'loyal customers.',
      'proven impact.',
    ],
    description:
      "Explore the websites, applications, and digital experiences we've built for ambitious organizations and growing businesses.",
    primaryCta: {
      label: 'Start Your Project',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'View Pricing Plans',
      href: '/pricing',
    },
    trustTitle: '✦ Why Ekaagra',
    trustSubtitle: 'Real client case studies, measured conversion, and zero template shortcuts.',
    trustPills: [
      { label: '100% Custom Design', color: '#4338CA' },
      { label: 'Sub-Second Speeds', color: '#F97360' },
      { label: 'Production Tested', color: '#F4C95D' },
      { label: 'Full Code Ownership', color: '#10B981' },
    ],
  },
  services: {
    pageName: 'services',
    eyebrow: '✦ DESIGN • DEVELOPMENT • STRATEGY',
    prefix: 'You have the idea. We engineer',
    phrases: [
      'high-converting websites.',
      'scalable web platforms.',
      'native Android apps.',
      'enterprise systems.',
    ],
    description:
      'From strategy and design to development and deployment, we turn ambitious ideas into reliable digital products.',
    primaryCta: {
      label: 'Request Project Proposal',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'Explore Case Studies',
      href: '/projects',
    },
    trustTitle: '✦ Why Ekaagra',
    trustSubtitle: 'Full-cycle digital engineering from initial architecture to ongoing scale.',
    trustPills: [
      { label: 'Modern Cloud Stacks', color: '#4338CA' },
      { label: 'Android & Web Apps', color: '#F97360' },
      { label: 'Direct Lead Capture', color: '#F4C95D' },
      { label: '30-Day Launch Care', color: '#10B981' },
    ],
  },
  schools: {
    pageName: 'schools',
    eyebrow: '✦ SCHOOL TECHNOLOGY • DIGITAL TRANSFORMATION',
    prefix: 'Your school deserves',
    phrases: [
      'more than just a website.',
      'smart digital campus systems.',
      'automated fee collection.',
      'CBSE & ICSE report portals.',
    ],
    description:
      "Build a stronger digital presence with modern school websites, CMS, ERP systems, and technology designed around your school's needs.",
    primaryCta: {
      label: 'Configure School Plan',
      href: '/schools/configure',
    },
    secondaryCta: {
      label: 'Explore Solutions',
      href: '#solutions',
    },
    trustTitle: '✦ Why Ekaagra For Schools',
    trustSubtitle: 'Engineered specifically for Indian schools & CBSE/ICSE institutions.',
    trustPills: [
      { label: 'Smart Fee Portals', color: '#4338CA' },
      { label: 'Instant Cloud Sync', color: '#F97360' },
      { label: 'CBSE Gradecards', color: '#F4C95D' },
      { label: 'Dedicated Staff Training', color: '#10B981' },
    ],
  },
  pricing: {
    pageName: 'pricing',
    eyebrow: '✦ SIMPLE PLANS • SERIOUS POSSIBILITIES',
    prefix: 'Start small. Think big.',
    phrases: [
      "Build for what's next.",
      'Predictable annual renewals.',
      '100% domain & code ownership.',
      'No hidden licensing fees.',
    ],
    description:
      'Choose a flexible website package designed to help you launch confidently today and grow tomorrow.',
    primaryCta: {
      label: 'Get Custom Quote',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'Explore Our Work',
      href: '/projects',
    },
    trustTitle: '✦ The Ekaagra Pricing Standard',
    trustSubtitle: 'Predictable annual renewals, zero surprises, and 100% source code ownership.',
    trustPills: [
      { label: '100% Code Ownership', color: '#4338CA' },
      { label: 'No Trapped Hosting', color: '#F97360' },
      { label: 'Clear Itemized Scope', color: '#F4C95D' },
      { label: 'Bihar-Based Direct Care', color: '#10B981' },
    ],
  },
  contact: {
    pageName: 'contact',
    eyebrow: '✦ YOUR IDEA STARTS HERE',
    prefix: "What's the next thing you want to",
    phrases: [
      'build?',
      'launch online?',
      'scale across Bihar?',
      'turn into reality?',
    ],
    description:
      "Tell us what you're trying to achieve. We'll help turn your requirement into a beautiful, practical website or application.",
    primaryCta: {
      label: 'Request Fast Estimate',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'Explore Case Studies',
      href: '/projects',
    },
    trustTitle: '✦ The Ekaagra Promise',
    trustSubtitle: 'Talk directly to engineers and product designers — zero sales friction.',
    trustPills: [
      { label: '24-Hour Response', color: '#4338CA' },
      { label: '100% Free Consultation', color: '#F97360' },
      { label: 'WhatsApp Direct Support', color: '#F4C95D' },
      { label: 'Private Staging Reviews', color: '#10B981' },
    ],
  },
  quote: {
    pageName: 'quote',
    eyebrow: '✦ YOUR IDEA • OUR EXPERTISE',
    prefix: 'Tell us what you are',
    phrases: [
      'imagining.',
      'planning to build.',
      'ready to launch.',
      'aiming to transform.',
    ],
    description:
      "Give us the details. We'll help you understand what to build, how to build it, and what it could take.",
    primaryCta: {
      label: 'Explore Our Work',
      href: '/projects',
    },
    secondaryCta: {
      label: 'View Pricing Plans',
      href: '/pricing',
    },
    trustTitle: '✦ What Happens Next',
    trustSubtitle: 'Receive a tailored architecture roadmap and itemized quote within 24 hours.',
    trustPills: [
      { label: 'No Obligation Estimate', color: '#4338CA' },
      { label: 'Transparent Line Items', color: '#F97360' },
      { label: 'Fixed-Price Guarantee', color: '#F4C95D' },
      { label: 'Zero Spam / Privacy First', color: '#10B981' },
    ],
  },
  about: {
    pageName: 'about',
    eyebrow: '✦ PEOPLE • IDEAS • TECHNOLOGY',
    prefix: "We're not here to build more websites.",
    phrases: [
      'We build better ones.',
      'Crafted with purpose.',
      'Engineered for humans.',
      'Proudly rooted in Bihar.',
    ],
    description:
      'We combine thoughtful design, modern technology, and practical thinking to create digital experiences with purpose.',
    primaryCta: {
      label: 'Work With Us',
      href: '/get-quote',
    },
    secondaryCta: {
      label: 'Explore Our Work',
      href: '/projects',
    },
    trustTitle: '✦ Why Ekaagra',
    trustSubtitle: 'Independent digital studio crafting high-impact technology from Bihar.',
    trustPills: [
      { label: 'Zero Template Shortcuts', color: '#4338CA' },
      { label: 'Engineered For Speed', color: '#F97360' },
      { label: 'Client IP Ownership', color: '#F4C95D' },
      { label: 'Bihar-Rooted • Global Reach', color: '#10B981' },
    ],
  },
};
