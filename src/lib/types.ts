// --- Service Types -----------------------------------------------
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

// --- Project Types -----------------------------------------------
export interface Project {
  slug: string;
  title: string;
  shortLabel?: string;
  category: string;
  badge?: string;
  description: string;
  overview: string;
  problem: string;
  solution: string;
  approach?: string;
  outcome?: string;
  features: string[];
  technologies: string[];
  image: string;
  images?: string[];
  liveUrl?: string;
  githubUrl?: string;
  isFrameRestricted?: boolean;
}

// --- Technology Types --------------------------------------------
export interface Technology {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'mobile' | 'tools';
}

export interface TechnologyCategory {
  name: string;
  key: Technology['category'];
  technologies: Technology[];
}

// --- Pricing Types -----------------------------------------------
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

// --- FAQ Types ---------------------------------------------------
export interface FAQ {
  question: string;
  answer: string;
}

// --- Process Step Types ------------------------------------------
export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

// --- Solution Types ----------------------------------------------
export interface Solution {
  id?: string;
  title: string;
  industry?: string;
  tagline?: string;
  description: string;
  businessProblem?: string;
  features: string[];
  icon: string;
  badge?: string;
  accent?: string;
  exampleProjectSlug?: string;
}

// --- Why Ekaagra Types -------------------------------------------
export interface Differentiator {
  title: string;
  description: string;
  icon: string;
}

// --- Form Types --------------------------------------------------
export interface ContactFormData {
  name: string;
  organization?: string;
  phone: string;
  email: string;
  service: string;
  budget?: string;
  description: string;
  preferredContact?: string;
}

export interface QuoteFormData {
  name: string;
  organization?: string;
  phone: string;
  email: string;
  projectType: string;
  description: string;
  features?: string;
  expectedUsers?: string;
  budget?: string;
  timeline?: string;
}

// --- Lead Management Types (Supabase) ----------------------------
export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'CONVERTED'
  | 'LOST';

export type LeadType = 'CONTACT' | 'QUOTE' | 'WHATSAPP';
export type LeadSource = 'CONTACT_FORM' | 'QUOTE_FORM' | 'WHATSAPP';

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  source: LeadSource;
  type: LeadType;
  status: LeadStatus;

  name: string;
  organization?: string | null;
  phone: string;
  email: string;

  service?: string | null;
  project_type?: string | null;
  budget?: string | null;
  timeline?: string | null;
  expected_users?: string | null;
  features?: string | null;
  description: string;
  preferred_contact?: string | null;

  contacted_at?: string | null;
  proposal_sent_at?: string | null;
  converted_at?: string | null;
  lost_at?: string | null;

  notes?: string | null;
}

export interface LeadFilter {
  query?: string;
  status?: LeadStatus | 'ALL';
  type?: LeadType | 'ALL';
  source?: LeadSource | 'ALL';
  page?: number;
  pageSize?: number;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  proposalSent: number;
  converted: number;
  lost: number;
}

// --- Navigation Types --------------------------------------------
export interface NavItem {
  label: string;
  href: string;
}
