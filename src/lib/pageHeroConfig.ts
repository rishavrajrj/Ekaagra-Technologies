export type PageHeroKey =
  | 'home'
  | 'work'
  | 'services'
  | 'schools'
  | 'pricing'
  | 'contact'
  | 'quote'
  | 'about';

export interface PageHeroConfig {
  pageName: PageHeroKey;
  eyebrow: string;
  prefix: string;
  phrases: string[];
  description: string;
}

export const PAGE_HEROES: Record<PageHeroKey, PageHeroConfig> = {
  home: {
    pageName: 'home',
    eyebrow: '✦ ELITE DIGITAL STUDIO • ENGINEERED TO WIN',
    prefix: 'We engineer high-impact websites that',
    phrases: [
      'dominate your market.',
      'turn visitors into revenue.',
      'command absolute trust.',
      'leave competitors behind.',
    ],
    description:
      'We combine world-class UI/UX design, modern cloud architecture, and conversion science to build digital experiences that command authority and drive explosive business growth.',
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
      'Give us the details. We\'ll help you understand what to build, how to build it, and what it could take.',
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
  },
};
