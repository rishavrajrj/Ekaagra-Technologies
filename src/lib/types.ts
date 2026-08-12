// ─── Service Types ───────────────────────────────────────────────
export interface Service {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  longDescription: string;
  icon: string; // Lucide icon name
  features: string[];
  technologies: string[];
  useCases: string[];
}

// ─── Project Types ───────────────────────────────────────────────
export interface Project {
  slug: string;
  title: string;
  category: string;
  description: string;
  overview: string;
  problem: string;
  solution: string;
  features: string[];
  technologies: string[];
  image: string;
  images?: string[];
  liveUrl?: string;
  githubUrl?: string;
}

// ─── Technology Types ────────────────────────────────────────────
export interface Technology {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'mobile' | 'tools';
}

export interface TechnologyCategory {
  name: string;
  key: Technology['category'];
  technologies: Technology[];
}

// ─── Pricing Types ───────────────────────────────────────────────
export interface PricingTier {
  title: string;
  startingFrom: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  badge?: string;
  marketPerception?: string;
  smallCityDemand?: string;
  scopeAlignment?: string;
  upsellOpportunity?: string;
  pricingOptions?: string[];
}

export interface SchoolSalesStrategy {
  title: string;
  subtitle: string;
  badge: string;
  priceTag: string;
  description: string;
  whyItWorks: string;
  icon?: string;
}

export interface ProjectBenchmark {
  projectName: string;
  category: string;
  scope: string;
  fairPrice: string;
  amcRate: string;
  highlights: string[];
}


// ─── FAQ Types ───────────────────────────────────────────────────
export interface FAQ {
  question: string;
  answer: string;
}

// ─── Process Step Types ──────────────────────────────────────────
export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

// ─── Solution Types ──────────────────────────────────────────────
export interface Solution {
  title: string;
  description: string;
  features: string[];
  icon: string;
}

// ─── Why Ekaagra Types ───────────────────────────────────────────
export interface Differentiator {
  title: string;
  description: string;
  icon: string;
}

// ─── Form Types ──────────────────────────────────────────────────
export interface ContactFormData {
  name: string;
  organization: string;
  phone: string;
  email: string;
  service: string;
  budget: string;
  description: string;
  preferredContact: string;
}

export interface QuoteFormData {
  name: string;
  organization: string;
  phone: string;
  email: string;
  projectType: string;
  description: string;
  features: string;
  expectedUsers: string;
  budget: string;
  timeline: string;
}

// ─── Enquiry Status ──────────────────────────────────────────────
export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'in_discussion'
  | 'proposal_sent'
  | 'won'
  | 'closed';

// ─── Navigation Types ────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
}
