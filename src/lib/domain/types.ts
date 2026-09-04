export type DomainAvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN' | 'PRECHECK_REQUIRED';

export type RecommendationCategory =
  | 'Best Overall'
  | 'Best Value'
  | 'Good for India'
  | 'Good for Global Branding'
  | 'Premium Option'
  | 'Requested Domain';

export interface DomainExtensionQuote {
  domain: string;
  extension: string;
  availability: DomainAvailabilityStatus;

  // Source Registrar Data (GoDaddy v3)
  sourceAmount?: number;
  sourceCurrency: string;
  sourceRenewalAmount?: number;
  sourceFirstTermAmount?: number;
  period: number;
  registrationPeriod: string; // e.g. '1 year', '2 years'

  // Normalized Comparable / Display Data (Estimated INR Equivalent)
  hasFxConversion: boolean;
  fxRate?: number;
  fxTimestamp?: number;
  registrationPrice?: number; // Centrally rounded integer amount for the full term
  effectiveAnnualPrice?: number; // Optional annual cost for multi-year terms (e.g. 16129 / 2 = 8065)
  renewalPrice?: number; // Centrally rounded integer amount
  firstTermPrice?: number;
  currency: string;
  exchangeRateNotice?: string;

  // Registrar Attributes
  premium: boolean;
  premiumFees?: number;
  inventory?: string;
  isGoDaddyRecommended?: boolean;
  isRequestedDomain?: boolean;

  // Term-Aware Allowance & Calculations
  planAllowance: number; // Annual allowance (e.g. 500)
  termAllowance: number; // Term allowance = annualAllowance * period (e.g. 1000 for 2 years)
  included: boolean; // comparableCost <= termAllowance
  upgradeAmount: number; // Math.max(0, comparableCost - termAllowance)

  // Recommendation Engine
  recommendationBadge?: RecommendationCategory;
  recommendationReason?: string;
  suitability?: string;
  note?: string;
}

export interface DomainCheckRequest {
  domain: string;
  selectedPlanId?: 'free-launch' | 'launch-plus' | 'starter' | string;
  businessCategory?: 'general' | 'school' | 'business' | 'tech' | string;
}

export type DomainResponseStatus =
  | 'SUCCESS'
  | 'PRECHECK_REQUIRED'
  | 'INVALID_INPUT'
  | 'RATE_LIMITED'
  | 'AUTH_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'NO_RESULTS'
  | 'ERROR';

export interface DomainCheckResponse {
  query: string;
  sanitizedName: string;
  requestedDomain: string | null;
  requestedDomainAvailable: boolean | null;
  selectedPlanId: string;
  planAllowance: number;
  isLiveChecked: boolean;
  status: DomainResponseStatus;
  providerName?: string;
  errorMessage?: string;
  topRecommendation: DomainExtensionQuote | null;
  results: DomainExtensionQuote[];
  suggestionsUsed: boolean;
  disclaimer: string;
  instructions: string;
}

export interface IDomainProvider {
  name: string;
  checkDomain(request: DomainCheckRequest): Promise<DomainCheckResponse>;
}
