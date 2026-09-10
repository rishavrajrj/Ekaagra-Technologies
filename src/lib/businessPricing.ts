/**
 * Centralized Ekaagra Business Solutions & Pricing Architecture
 * ------------------------------------------------------------
 * Single source of truth for all business product tiers, Year-1 setup
 * prices, Year-2+ renewal prices, and capability mappings.
 *
 * PRICING MODEL RULES:
 * 1. Year 1: Initial setup & development price.
 * 2. Year 2 onward: Approximately 50% of Year-1 price as the annual renewal for
 *    hosting, domain, maintenance and operational support.
 * 3. Exact approved prices are hardcoded (no dynamic floating-point division).
 * 4. School ERP is excluded from this business configuration.
 */

export type BusinessPlanId =
  | 'business-website'
  | 'business-website-cms'
  | 'website-design-dev'
  | 'web-applications'
  | 'android-applications'
  | 'custom-software'
  | 'business-solutions';

export interface BusinessPlanConfig {
  id: BusinessPlanId;
  name: string;
  priceYear1: number | null;
  renewalPrice: number | null;
  billingType: 'fixed' | 'custom';
  priceDisplayYear1: string;
  renewalDisplay: string;
  description: string;
  pages: string;
  domain: string;
  domainAllowance: number;
  hosting: string;
  seo: string;
  forms: string;
  integrations: string;
  maintenance: string;
  support: string;
  bestFor: string;
  badge?: string;
  highlighted?: boolean;
  cta: string;
  features: string[];
  isCustomQuote?: boolean;
  developmentScopeNote?: string;
}

export const businessPlans: BusinessPlanConfig[] = [
  {
    id: 'business-website',
    name: 'Business Website',
    priceYear1: 7999,
    renewalPrice: 3999,
    billingType: 'fixed',
    priceDisplayYear1: '₹7,999',
    renewalDisplay: 'Renewal: ₹3,999/year',
    description:
      'Professional responsive website for small businesses, consultants, brands and local organizations.',
    pages: 'Up to 8–10 pages',
    domain: 'Custom domain included',
    domainAllowance: 500,
    hosting: 'Fast cloud hosting + SSL',
    seo: 'Basic SEO structure & sitemap',
    forms: 'Business contact & lead capture form',
    integrations: 'Direct WhatsApp integration',
    maintenance: 'Basic maintenance & deployment care',
    support: 'Standard email and WhatsApp support',
    bestFor:
      'Small businesses, consultants, local brands and organizations needing an authoritative web presence.',
    badge: 'Starter Business',
    cta: 'GET STARTED →',
    features: [
      'Up to 8–10 pages',
      'Responsive / mobile-first design',
      'Custom domain included',
      'Hosting + SSL',
      'Business contact form',
      'WhatsApp integration',
      'Basic maintenance',
    ],
  },
  {
    id: 'business-website-cms',
    name: 'Business Website + CMS',
    priceYear1: 12999,
    renewalPrice: 6499,
    billingType: 'fixed',
    priceDisplayYear1: '₹12,999',
    renewalDisplay: 'Renewal: ₹6,499/year',
    description:
      'Professional website with a simple CMS for managing business content without technical help.',
    pages: 'Up to 10 pages',
    domain: 'Custom domain included',
    domainAllowance: 500,
    hosting: 'Cloud hosting + SSL',
    seo: 'SEO-ready structure & metadata controls',
    forms: 'Enquiry forms & lead notifications',
    integrations: 'WhatsApp & CMS dashboard',
    maintenance: 'CMS platform & hosting maintenance',
    support: 'CMS training & ongoing guidance',
    bestFor:
      'Businesses requiring regular blog posts, notices, team updates, and gallery additions without coding.',
    badge: 'Self-Managed',
    cta: 'GET STARTED →',
    features: [
      'Up to 10 pages',
      'CMS administration control panel',
      'Content & page management',
      'Blog / news management',
      'Gallery management',
      'Enquiry management',
      'Hosting + SSL & maintenance',
    ],
  },
  {
    id: 'website-design-dev',
    name: 'Website Design & Development',
    priceYear1: 15000,
    renewalPrice: 7500,
    billingType: 'fixed',
    priceDisplayYear1: '₹15,000',
    renewalDisplay: 'Renewal: ₹7,500/year',
    description:
      'Bespoke corporate websites designed around your brand, content and business goals.',
    pages: 'Custom layout & sections',
    domain: 'Custom domain included',
    domainAllowance: 500,
    hosting: 'Edge production hosting + SSL',
    seo: 'Comprehensive SEO foundation & schema markup',
    forms: 'Advanced multi-field contact forms',
    integrations: 'WhatsApp & custom tools',
    maintenance: 'Maintenance & stability patches',
    support: 'Priority engineer support',
    bestFor:
      'Corporate companies, established brands, and organizations requiring bespoke design and distinctive branding.',
    badge: 'Custom Corporate',
    highlighted: true,
    cta: 'GET STARTED →',
    developmentScopeNote:
      'Major new design or feature development work after launch is quoted separately.',
    features: [
      'Custom UI/UX & brand design',
      'Custom responsive layout',
      'Branding integration',
      'SEO-ready structure',
      'Advanced forms',
      'WhatsApp integration',
      'Production deployment',
    ],
  },
  {
    id: 'web-applications',
    name: 'Web Applications',
    priceYear1: 24999,
    renewalPrice: 12499,
    billingType: 'fixed',
    priceDisplayYear1: '₹24,999',
    renewalDisplay: 'Renewal: ₹12,499/year',
    description:
      'Interactive web applications with dashboards, authentication, workflows and database functionality.',
    pages: 'Custom dynamic views & dashboards',
    domain: 'Custom domain included',
    domainAllowance: 500,
    hosting: 'Cloud database + serverless backend',
    seo: 'Application landing & indexable pages',
    forms: 'Interactive workflows & data capture',
    integrations: 'API integrations & Supabase / PostgreSQL',
    maintenance: 'Database & application maintenance',
    support: 'Dedicated developer support',
    bestFor:
      'Businesses requiring user portals, authentication, dynamic records, role permissions, and operational dashboards.',
    badge: 'Dynamic Portal',
    cta: 'GET STARTED →',
    developmentScopeNote:
      'Major new workflow or database feature engineering after launch is quoted separately.',
    features: [
      'Admin dashboard & analytics',
      'User authentication & profiles',
      'Database backend (PostgreSQL)',
      'Dynamic content management',
      'Role-based permissions',
      'Custom workflows',
      'API integration where applicable',
    ],
  },
  {
    id: 'android-applications',
    name: 'Android Applications',
    priceYear1: 24999,
    renewalPrice: 12499,
    billingType: 'fixed',
    priceDisplayYear1: '₹24,999',
    renewalDisplay: 'Renewal: ₹12,499/year',
    description:
      'Mobile applications for businesses and organizations, built around your required workflows.',
    pages: 'App screens & mobile workflows',
    domain: 'API & server domain included',
    domainAllowance: 500,
    hosting: 'Cloud backend API + database',
    seo: 'Play Store ASO guidance',
    forms: 'Mobile input forms & camera upload',
    integrations: 'Push notifications & Google Play setup',
    maintenance: 'API backend & mobile maintenance',
    support: 'Google Play deployment support',
    bestFor:
      'Businesses needing a direct mobile presence on Android devices for customers, field staff, or members.',
    badge: 'Mobile Package',
    cta: 'GET STARTED →',
    developmentScopeNote:
      'Major new mobile features or architectural updates after launch are quoted separately.',
    features: [
      'Android application',
      'Native or WebView architecture',
      'Push notifications',
      'API integration',
      'Google Play preparation',
      'Backend integration',
      'User login & data sync',
    ],
  },
  {
    id: 'custom-software',
    name: 'Custom Software',
    priceYear1: 34999,
    renewalPrice: 17499,
    billingType: 'fixed',
    priceDisplayYear1: '₹34,999',
    renewalDisplay: 'Renewal: ₹17,499/year',
    description:
      'Bespoke software engineered around specific business processes and operational workflows.',
    pages: 'Modular software system',
    domain: 'Enterprise domain setup',
    domainAllowance: 500,
    hosting: 'Dedicated cloud server / database',
    seo: 'Enterprise portal security',
    forms: 'Custom operational inputs & file ingestion',
    integrations: 'Custom APIs, webhooks, and exports',
    maintenance: 'Operational stability & bug fixes',
    support: 'Direct engineer consultation',
    bestFor:
      'Enterprises and specialized businesses with unique operations, multi-department coordination, and data automation needs.',
    badge: 'Bespoke Engineering',
    cta: 'GET STARTED →',
    developmentScopeNote:
      'Major new modules or business logic additions after initial delivery are quoted separately.',
    features: [
      'Custom workflows',
      'Database architecture',
      'User roles & permissions',
      'Automated reporting',
      'Process automation',
      'API integrations',
      'Custom business logic',
    ],
  },
  {
    id: 'business-solutions',
    name: 'Business Solutions',
    priceYear1: null,
    renewalPrice: null,
    billingType: 'custom',
    priceDisplayYear1: 'Custom Quote',
    renewalDisplay: 'Renewal: Custom',
    description:
      'Tailored digital systems for businesses requiring specialized workflows, integrations or multi-user operations.',
    pages: 'Tailored to organizational scope',
    domain: 'Custom enterprise infrastructure',
    domainAllowance: 500,
    hosting: 'Custom cloud environment',
    seo: 'Custom enterprise implementation',
    forms: 'Comprehensive operational data capture',
    integrations: 'Custom ERP/CRM/Billing integrations',
    maintenance: 'SLA-backed maintenance agreement',
    support: 'Dedicated account & engineering lead',
    bestFor:
      'Large retailers, multi-branch distributors, healthcare clinics, and enterprises needing full operational systems.',
    badge: 'Tailored Solution',
    cta: "LET'S DISCUSS →",
    isCustomQuote: true,
    developmentScopeNote:
      'Enterprise scope and renewal terms are structured individually in your project agreement.',
    features: [
      'CRM (Customer management)',
      'Inventory & stock tracking',
      'Billing & GST invoicing',
      'Multi-user permissions',
      'Financial reports & logs',
      'Custom integrations',
    ],
  },
];

/**
 * Retrieve a business plan by its identifier with safe fallback to the default business website.
 */
export function getBusinessPlan(id?: string | null): BusinessPlanConfig {
  if (!id) return businessPlans[0];
  const matched = businessPlans.find((p) => p.id === id);
  return matched || businessPlans[0];
}

/**
 * Get all 7 canonical business plans.
 */
export function getAllBusinessPlans(): BusinessPlanConfig[] {
  return businessPlans;
}

/**
 * Format Year 1 price for UI display.
 */
export function formatBusinessYear1Price(plan: BusinessPlanConfig): string {
  if (plan.priceYear1 === null || plan.billingType === 'custom') {
    return 'Custom Quote';
  }
  return `₹${plan.priceYear1.toLocaleString('en-IN')}`;
}

/**
 * Format Renewal price for UI display.
 */
export function formatBusinessRenewalPrice(plan: BusinessPlanConfig): string {
  if (plan.renewalPrice === null || plan.billingType === 'custom') {
    return 'Renewal: Custom';
  }
  return `Renewal: ₹${plan.renewalPrice.toLocaleString('en-IN')}/year`;
}
