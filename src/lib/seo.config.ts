/**
 * Centralized SEO Configuration for Ekaagra Technologies
 * -------------------------------------------------------
 * All SEO-related constants, metadata helpers, and JSON-LD
 * schema generators live here so nothing is scattered.
 */

import type { Metadata } from 'next';

// ─── Core Constants ──────────────────────────────────────────────────────────

export const SITE_URL = 'https://www.ekaagratechnologies.site';
export const BRAND_NAME = 'Ekaagra Technologies';
export const BRAND_TAGLINE = 'Website Design & Development in Motihari, Bihar';
export const BRAND_EMAIL = 'ekaagratechnologies@gmail.com';
export const BRAND_LOCATION = 'Motihari, East Champaran, Bihar, India';
export const BRAND_LOCALE = 'en_IN';

export const BRAND_LOGO_PATH = '/images/logo/logo.webp';
export const BRAND_LOGO_URL = `${SITE_URL}${BRAND_LOGO_PATH}`;

/**
 * Default Open Graph image
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

// ─── Default Metadata ────────────────────────────────────────────────────────

export const DEFAULT_TITLE = `Website Developer in Motihari, Bihar | ${BRAND_NAME}`;
export const DEFAULT_DESCRIPTION =
  'Ekaagra Technologies designs and develops custom websites, web applications, school websites, school ERP systems, and business software in Motihari, Bihar. Get a professional, mobile-first website built for your business.';

export const DEFAULT_KEYWORDS = [
  'website developer in Motihari',
  'website development company in Motihari',
  'web designer in Motihari',
  'website design Motihari Bihar',
  'school website development Bihar',
  'school ERP Motihari',
  'custom software development Motihari',
  'web application development Bihar',
  'Ekaagra Technologies',
];

// ─── Canonical URL Helper ────────────────────────────────────────────────────

/**
 * Build a fully-qualified canonical URL from a relative path.
 * Ensures no trailing slash (except for homepage "/").
 */
export function canonicalUrl(path: string): string {
  const clean = path === '/' ? '' : path.replace(/\/+$/, '');
  return `${SITE_URL}${clean}`;
}

// ─── Page Metadata Helper ────────────────────────────────────────────────────

interface PageSeoOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articlePublishedTime?: string;
}

/**
 * Generate complete page-level Metadata object.
 * Use in each page's `export const metadata` or `generateMetadata`.
 */
export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
  ogImage,
  ogType = 'website',
  articlePublishedTime,
}: PageSeoOptions): Metadata {
  const url = canonicalUrl(path);

  return {
    title,
    description,
    keywords: keywords ?? DEFAULT_KEYWORDS,
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND_NAME,
      locale: BRAND_LOCALE,
      type: ogType,
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
      ...(articlePublishedTime ? { publishedTime: articlePublishedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

// ─── JSON-LD Schema Generators ───────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
type JsonLd = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Organization schema — used site-wide in layout */
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: BRAND_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: BRAND_LOGO_URL,
    },
    description: DEFAULT_DESCRIPTION,
    email: BRAND_EMAIL,
    areaServed: [
      {
        '@type': 'City',
        name: 'Motihari',
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'East Champaran',
          containedInPlace: {
            '@type': 'State',
            name: 'Bihar',
            containedInPlace: {
              '@type': 'Country',
              name: 'India',
            },
          },
        },
      },
    ],
    knowsAbout: [
      'Website Design',
      'Website Development',
      'Web Applications',
      'School Website Development',
      'School ERP Systems',
      'Custom Software Development',
      'Android App Development',
      'Next.js',
      'React',
      'TypeScript',
    ],
  };
}

/** LocalBusiness schema — for the homepage and local landing pages */
export function localBusinessSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#localbusiness`,
    name: BRAND_NAME,
    url: SITE_URL,
    logo: BRAND_LOGO_URL,
    image: BRAND_LOGO_URL,
    description:
      'Website design and development company in Motihari, Bihar. We build custom websites, web applications, school websites, school ERP systems, Android apps, and business software.',
    email: BRAND_EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Motihari',
      addressRegion: 'Bihar',
      addressCountry: 'IN',
    },
    areaServed: [
      { '@type': 'City', name: 'Motihari' },
      { '@type': 'AdministrativeArea', name: 'East Champaran' },
      { '@type': 'State', name: 'Bihar' },
    ],
    serviceType: [
      'Website Design & Development',
      'Web Application Development',
      'School Website Development',
      'School ERP Systems',
      'Custom Software Development',
      'Android App Development',
      'Backend & API Development',
      'Website Maintenance & Support',
    ],
    priceRange: '₹₹',
    knowsLanguage: ['en', 'hi'],
  };
}

/** WebSite schema — used site-wide in layout */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: BRAND_NAME,
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'en-IN',
  };
}

/** WebPage schema — for individual pages */
export function webPageSchema(options: {
  name: string;
  description: string;
  url: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: options.url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'en-IN',
  };
}

/** Service schema — for service and local service pages */
export function serviceSchema(options: {
  name: string;
  description: string;
  url: string;
  provider?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    url: options.url,
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: options.provider ?? BRAND_NAME,
    },
    areaServed: [
      { '@type': 'City', name: 'Motihari' },
      { '@type': 'AdministrativeArea', name: 'East Champaran' },
      { '@type': 'State', name: 'Bihar' },
    ],
  };
}

/** BreadcrumbList schema */
export function breadcrumbSchema(
  items: Array<{ name: string; url: string }>
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** FAQPage schema — only for pages with visible FAQ sections */
export function faqPageSchema(
  faqs: Array<{ question: string; answer: string }>
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/** Article schema — for blog posts */
export function articleSchema(options: {
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    url: options.url,
    datePublished: options.datePublished,
    dateModified: options.dateModified ?? options.datePublished,
    author: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url: BRAND_LOGO_URL,
      },
    },
    isPartOf: { '@id': `${SITE_URL}/#website` },
    inLanguage: 'en-IN',
    ...(options.image ? { image: options.image } : {}),
  };
}

export function jsonLdScript(schema: JsonLd): string {
  return JSON.stringify(schema);
}
