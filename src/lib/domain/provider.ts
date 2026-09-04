import type {
  DomainCheckRequest,
  DomainCheckResponse,
  DomainExtensionQuote,
  IDomainProvider,
  RecommendationCategory,
} from './types';
import { planDomainAllowances, domainExtensionOptions } from '@/lib/data';

interface CacheEntry {
  response: DomainCheckResponse;
  timestamp: number;
}

// In-memory cache for successful domain search results (TTL: 5 minutes)
const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Central Currency Rounding Function (Round to nearest ₹1 for whole-rupee consistency)
export function roundToNearestRupee(amount: number): number {
  return Math.round(amount);
}

// Live Exchange Rate Cache (TTL: 1 hour)
interface FxCache {
  rate: number;
  timestamp: number;
  source: string;
}
let fxCache: FxCache | null = null;
const FX_CACHE_TTL_MS = 60 * 60 * 1000;

export async function getLiveUsdToInrRate(): Promise<{ rate: number; timestamp: number } | null> {
  // Configured environment override if present
  if (process.env.USD_TO_INR_RATE) {
    const custom = parseFloat(process.env.USD_TO_INR_RATE);
    if (!isNaN(custom) && custom > 0) {
      return { rate: Math.round(custom * 100) / 100, timestamp: Date.now() };
    }
  }

  // Use cached FX if fresh
  if (fxCache && Date.now() - fxCache.timestamp < FX_CACHE_TTL_MS) {
    return { rate: fxCache.rate, timestamp: fxCache.timestamp };
  }

  // Real-time trusted exchange rate source
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates?.INR && typeof data.rates.INR === 'number' && data.rates.INR > 0) {
        const rate = Math.round(data.rates.INR * 100) / 100;
        fxCache = { rate, timestamp: Date.now(), source: 'open.er-api.com' };
        return { rate, timestamp: fxCache.timestamp };
      }
    }
  } catch (err) {
    console.warn('Live FX rate fetch notice:', (err as Error).message);
  }

  // Fallback to last known cached rate if available
  if (fxCache) {
    return { rate: fxCache.rate, timestamp: fxCache.timestamp };
  }

  // If live FX completely fails, return null so we don't fabricate an exchange rate
  return null;
}

interface TldMetadata {
  extension: string;
  categoryAffinity: Record<string, number>;
  defaultBadge: RecommendationCategory;
  defaultReason: string;
}

const TLD_METADATA: TldMetadata[] = [
  {
    extension: '.in',
    categoryAffinity: { general: 9, school: 9, business: 9, tech: 7 },
    defaultBadge: 'Best Value',
    defaultReason: 'Affordable, trusted, and highly suitable for India-focused operations.',
  },
  {
    extension: '.co.in',
    categoryAffinity: { general: 7, school: 7, business: 8, tech: 6 },
    defaultBadge: 'Good for India',
    defaultReason: 'Established commercial identity for registered Indian businesses.',
  },
  {
    extension: '.com',
    categoryAffinity: { general: 9, school: 8, business: 10, tech: 10 },
    defaultBadge: 'Good for Global Branding',
    defaultReason: 'The world’s gold standard for universal recognition and credibility.',
  },
  {
    extension: '.org',
    categoryAffinity: { general: 6, school: 10, business: 5, tech: 6 },
    defaultBadge: 'Best Overall',
    defaultReason: 'Trusted extension tailored for educational institutions, academies, and organizations.',
  },
  {
    extension: '.school',
    categoryAffinity: { general: 4, school: 10, business: 2, tech: 3 },
    defaultBadge: 'Best Overall',
    defaultReason: 'Modern dedicated extension clearly identifying your school campus.',
  },
  {
    extension: '.ac.in',
    categoryAffinity: { general: 3, school: 10, business: 2, tech: 2 },
    defaultBadge: 'Good for India',
    defaultReason: 'Official academic domain reserved for recognized educational institutions in India.',
  },
  {
    extension: '.co',
    categoryAffinity: { general: 6, school: 4, business: 7, tech: 9 },
    defaultBadge: 'Premium Option',
    defaultReason: 'Modern, high-appeal branding choice favored by innovators and tech startups.',
  },
  {
    extension: '.ai',
    categoryAffinity: { general: 4, school: 3, business: 5, tech: 10 },
    defaultBadge: 'Premium Option',
    defaultReason: 'Specialized tech and artificial intelligence domain identity.',
  },
];

export class GoDaddyDomainProvider implements IDomainProvider {
  public name = 'GoDaddy Domains API v3';

  /**
   * Sanitizes input to extract a pure label and optional explicit domain.
   */
  public sanitizeInput(input: string): {
    cleanLabel: string;
    explicitTld?: string;
    requestedDomain?: string;
  } {
    const raw = input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');

    const match = raw.match(/^([a-z0-9-]+)\.([a-z0-9.-]+)$/);
    if (match) {
      const label = match[1].replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
      const tld = `.${match[2].replace(/[^a-z0-9.-]/g, '')}`;
      return { cleanLabel: label, explicitTld: tld, requestedDomain: `${label}${tld}` };
    }

    const cleanLabel = raw.replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
    return { cleanLabel };
  }

  /**
   * Resolves authentication headers from server environment.
   */
  private getAuthHeaders(): { authHeader?: string; baseUrl: string } | null {
    const pat = process.env.GODADDY_PAT;
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;
    const genericKey = process.env.REGISTRAR_API_KEY;
    const env = (process.env.GODADDY_ENV || 'production').toLowerCase();

    const baseUrl =
      env === 'ote' || env === 'test'
        ? 'https://api.ote-godaddy.com'
        : 'https://api.godaddy.com';

    if (pat) {
      const token = pat.trim();
      return {
        authHeader: token.startsWith('Bearer ')
          ? token
          : token.startsWith('sso-key ')
          ? token
          : token.startsWith('gd_pat_')
          ? `Bearer ${token}`
          : `Bearer ${token}`,
        baseUrl,
      };
    }

    if (apiKey && apiSecret) {
      return {
        authHeader: `sso-key ${apiKey.trim()}:${apiSecret.trim()}`,
        baseUrl,
      };
    }

    if (genericKey) {
      const key = genericKey.trim();
      return {
        authHeader: key.startsWith('gd_pat_')
          ? `Bearer ${key}`
          : key.startsWith('sso-key ')
          ? key
          : `Bearer ${key}`,
        baseUrl,
      };
    }

    return null;
  }

  /**
   * GoDaddy v3 API returns values in minor currency units (cents for USD, paise for INR).
   * 100 minor units = 1 standard currency unit.
   */
  public normalizeV3Price(minorUnitValue: number | undefined): number | undefined {
    if (minorUnitValue === undefined || minorUnitValue === null) return undefined;
    if (minorUnitValue <= 0) return 0;
    return Math.round((minorUnitValue / 100) * 100) / 100;
  }

  /**
   * Performs real domain check via GoDaddy Domains API v3 with intelligent suggestions fallback.
   * Flow:
   * 1. Query direct / common candidate domains.
   * 2. If exact domain is unavailable OR available direct candidates are insufficient (< 4),
   *    query GoDaddy v3 suggestions endpoint (/v3/domains/suggestions).
   * 3. Merge, deduplicate, filter unavailable, calculate term-aware allowances, rank.
   */
  public async checkDomain(request: DomainCheckRequest): Promise<DomainCheckResponse> {
    const rawInput = request.domain || '';
    const { cleanLabel, explicitTld, requestedDomain } = this.sanitizeInput(rawInput);
    const planId = request.selectedPlanId || 'starter';
    const category = (request.businessCategory || 'general').toLowerCase();
    const annualAllowance = planDomainAllowances[planId] ?? (planId === 'free-launch' ? 0 : 300);

    if (!cleanLabel || cleanLabel.length < 2) {
      return {
        query: rawInput,
        sanitizedName: cleanLabel,
        requestedDomain: null,
        requestedDomainAvailable: null,
        selectedPlanId: planId,
        planAllowance: annualAllowance,
        isLiveChecked: false,
        status: 'INVALID_INPUT',
        topRecommendation: null,
        results: [],
        suggestionsUsed: false,
        disclaimer:
          'Please enter a valid domain name or business keyword (at least 2 letters or numbers).',
        instructions: 'Enter your brand or business name to explore domain options.',
      };
    }

    // Check 5-minute memory cache
    const cacheKey = `${cleanLabel}:${requestedDomain || 'keyword'}:${planId}:${category}`;
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.response;
    }

    const auth = this.getAuthHeaders();

    // Safe state: If no registrar credentials configured, return PRECHECK_REQUIRED with candidate options
    if (!auth) {
      const candidates: string[] = [];
      if (requestedDomain) {
        candidates.push(requestedDomain.toLowerCase());
      }
      const schoolExtensions = ['.in', '.com', '.org', '.school', '.ac.in'];
      const defaultExtensions = category === 'school'
        ? schoolExtensions
        : TLD_METADATA.map((m) => m.extension);

      for (const ext of defaultExtensions) {
        const candidate = `${cleanLabel}${ext}`.toLowerCase();
        if (!candidates.includes(candidate)) {
          candidates.push(candidate);
        }
      }

      const candidateResults: DomainExtensionQuote[] = candidates.map((candidateDomain) => {
        const ext = candidateDomain.slice(candidateDomain.indexOf('.'));
        const meta = TLD_METADATA.find((m) => m.extension === ext);
        const isReq = requestedDomain && candidateDomain.toLowerCase() === requestedDomain.toLowerCase();

        return {
          domain: candidateDomain,
          extension: ext,
          availability: 'PRECHECK_REQUIRED',
          sourceCurrency: 'INR',
          period: 1,
          registrationPeriod: '1 year',
          hasFxConversion: false,
          currency: 'INR',
          premium: false,
          isRequestedDomain: Boolean(isReq),
          planAllowance: annualAllowance,
          termAllowance: annualAllowance,
          included: true,
          upgradeAmount: 0,
          recommendationBadge: isReq ? 'Requested Domain' : meta?.defaultBadge || 'Good for India',
          recommendationReason: 'Availability will be verified during domain registration.',
        };
      });

      return {
        query: rawInput,
        sanitizedName: cleanLabel,
        requestedDomain: requestedDomain || null,
        requestedDomainAvailable: null,
        selectedPlanId: planId,
        planAllowance: annualAllowance,
        isLiveChecked: false,
        status: 'PRECHECK_REQUIRED',
        providerName: this.name,
        errorMessage: undefined,
        topRecommendation: candidateResults[0] || null,
        results: candidateResults,
        suggestionsUsed: false,
        disclaimer:
          'Your preferred domain will be verified during our registration process. You can select a preferred domain now, or continue without choosing one.',
        instructions:
          'Availability will be verified during domain registration. You can select a preferred domain now, or choose to decide later.',
      };
    }

    try {
      // 1. Build Direct / Common Candidates
      const directCandidates: string[] = [];
      if (requestedDomain) {
        directCandidates.push(requestedDomain.toLowerCase());
      }
      for (const meta of TLD_METADATA) {
        const candidate = `${cleanLabel}${meta.extension}`.toLowerCase();
        if (!directCandidates.includes(candidate)) {
          directCandidates.push(candidate);
        }
      }

      // Query direct availability via v3 in parallel
      const directPromises = directCandidates.map(async (domain) => {
        const url = `${auth.baseUrl}/v3/domains/check-availability?domain=${encodeURIComponent(domain)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: auth.authHeader!,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(6000),
        });

        return { domain, status: res.status, ok: res.ok, data: res.ok ? await res.json() : null };
      });

      const directResults = await Promise.allSettled(directPromises);

      let hasRateLimit = false;
      let hasAuthError = false;
      const rawDirectItems: any[] = [];
      let requestedDomainAvailable: boolean | null = null;

      for (const r of directResults) {
        if (r.status === 'fulfilled') {
          if (r.value.status === 429) hasRateLimit = true;
          if (r.value.status === 401 || r.value.status === 403) hasAuthError = true;
          if (r.value.ok && r.value.data) {
            rawDirectItems.push(r.value.data);
            if (requestedDomain && r.value.data.domain?.toLowerCase() === requestedDomain.toLowerCase()) {
              requestedDomainAvailable = Boolean(r.value.data.available);
            }
          }
        }
      }

      // Count direct available domains
      const directAvailableCount = rawDirectItems.filter((i) => i.available).length;

      // 2. GoDaddy Suggestions Fallback:
      // Trigger suggestions if exact requested domain is unavailable OR available candidates are insufficient (< 4)
      let rawSuggestionItems: any[] = [];
      let suggestionsUsed = false;

      const needsSuggestions =
        (requestedDomain && requestedDomainAvailable === false) || directAvailableCount < 4;

      if (needsSuggestions) {
        try {
          const sugUrl = `${auth.baseUrl}/v3/domains/suggestions?query=${encodeURIComponent(cleanLabel)}&country=IN`;
          const sugRes = await fetch(sugUrl, {
            method: 'GET',
            headers: {
              Authorization: auth.authHeader!,
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(6000),
          });

          if (sugRes.status === 429) hasRateLimit = true;
          if (sugRes.status === 401 || sugRes.status === 403) hasAuthError = true;

          if (sugRes.ok) {
            const sugData = await sugRes.json();
            if (Array.isArray(sugData?.items)) {
              rawSuggestionItems = sugData.items.map((item: any) => ({
                ...item,
                available: true, // GoDaddy v3 suggestions endpoint returns available inventory
              }));
              suggestionsUsed = true;
            }
          }
        } catch (sugErr) {
          console.warn('GoDaddy v3 suggestions query notice:', (sugErr as Error).message);
        }
      }

      // Handle terminal rate limit or auth error if zero items received
      if (hasRateLimit && rawDirectItems.length === 0 && rawSuggestionItems.length === 0) {
        return {
          query: rawInput,
          sanitizedName: cleanLabel,
          requestedDomain: requestedDomain || null,
          requestedDomainAvailable: null,
          selectedPlanId: planId,
          planAllowance: annualAllowance,
          isLiveChecked: true,
          status: 'RATE_LIMITED',
          errorMessage: 'Domain search is temporarily busy. Please try again shortly.',
          topRecommendation: null,
          results: [],
          suggestionsUsed: false,
          disclaimer: 'Domain registrar rate limit reached. Please wait a moment and try again.',
          instructions: 'Please retry in a few moments.',
        };
      }

      if (hasAuthError && rawDirectItems.length === 0 && rawSuggestionItems.length === 0) {
        return {
          query: rawInput,
          sanitizedName: cleanLabel,
          requestedDomain: requestedDomain || null,
          requestedDomainAvailable: null,
          selectedPlanId: planId,
          planAllowance: annualAllowance,
          isLiveChecked: true,
          status: 'AUTH_ERROR',
          errorMessage:
            'Registrar authentication error. Domain availability and final pricing will be confirmed before registration.',
          topRecommendation: null,
          results: [],
          suggestionsUsed: false,
          disclaimer:
            'Unable to authenticate with domain registrar. Your quote will be verified manually.',
          instructions: 'Specify your preferred domain and our team will verify registrar pricing.',
        };
      }

      // 3. Merge & Deduplicate (Direct + Suggestions)
      const mergedItemsMap = new Map<string, any>();

      // Direct results first
      for (const item of rawDirectItems) {
        if (!item || !item.domain) continue;
        const key = item.domain.trim().toLowerCase();
        mergedItemsMap.set(key, item);
      }

      // Suggestions next (do not overwrite direct results)
      for (const item of rawSuggestionItems) {
        if (!item || !item.domain) continue;
        const key = item.domain.trim().toLowerCase();
        if (!mergedItemsMap.has(key)) {
          mergedItemsMap.set(key, item);
        }
      }

      // 4. Fetch live FX rate
      const fxData = await getLiveUsdToInrRate();

      // 5. Parse and calculate quotes
      const quotes: DomainExtensionQuote[] = [];

      for (const item of mergedItemsMap.values()) {
        if (!item || !item.domain) continue;

        // CRITICAL: Only available domains are presented as selectable options
        if (!item.available) continue;

        const domainStr = item.domain.trim().toLowerCase();
        const extMatch = domainStr.match(/\.[a-z0-9.-]+$/);
        const ext = extMatch ? extMatch[0] : '';
        const meta = TLD_METADATA.find((m) => m.extension === ext);

        // Extract v3 prices array
        const priceList: any[] = Array.isArray(item.prices) ? item.prices : [];
        if (priceList.length === 0) continue;

        // Choose 1-year registration period if available; otherwise pick minimum available term
        const oneYearOption = priceList.find((p) => p.period === 1);
        const selectedPriceOption =
          oneYearOption || priceList.slice().sort((a, b) => (a.period || 1) - (b.period || 1))[0];

        const period = selectedPriceOption.period || 1;
        const registrationPeriod = period === 1 ? '1 year' : `${period} years`;
        const sourceCurrency = selectedPriceOption.price?.currencyCode || 'USD';

        // Normalized source amounts (v3 minor currency units / 100)
        const sourceAmount = this.normalizeV3Price(selectedPriceOption.price?.value);
        const sourceRenewalAmount = this.normalizeV3Price(selectedPriceOption.renewalPrice?.value);
        const sourceFirstTermAmount = this.normalizeV3Price(selectedPriceOption.firstTermPrice?.value);

        if (sourceAmount === undefined) continue;

        // Currency Conversion & Central Rounding
        let hasFxConversion = false;
        let fxRate: number | undefined = undefined;
        let fxTimestamp: number | undefined = undefined;
        let registrationPrice: number = sourceAmount;
        let renewalPrice: number | undefined = sourceRenewalAmount;
        let firstTermPrice: number | undefined = sourceFirstTermAmount;
        let currency = sourceCurrency;
        let exchangeRateNotice: string | undefined = undefined;

        if (sourceCurrency.toUpperCase() === 'USD') {
          if (fxData) {
            hasFxConversion = true;
            fxRate = fxData.rate;
            fxTimestamp = fxData.timestamp;
            currency = 'INR';
            registrationPrice = roundToNearestRupee(sourceAmount * fxRate);
            if (sourceRenewalAmount !== undefined) {
              renewalPrice = roundToNearestRupee(sourceRenewalAmount * fxRate);
            }
            if (sourceFirstTermAmount !== undefined) {
              firstTermPrice = roundToNearestRupee(sourceFirstTermAmount * fxRate);
            }
            exchangeRateNotice = `Estimated INR equivalent (~₹${fxRate}/USD)`;
          } else {
            hasFxConversion = false;
            currency = 'USD';
            registrationPrice = sourceAmount;
            renewalPrice = sourceRenewalAmount;
            firstTermPrice = sourceFirstTermAmount;
          }
        } else if (sourceCurrency.toUpperCase() === 'INR') {
          hasFxConversion = false;
          currency = 'INR';
          registrationPrice = roundToNearestRupee(sourceAmount);
          if (sourceRenewalAmount !== undefined) {
            renewalPrice = roundToNearestRupee(sourceRenewalAmount);
          }
          if (sourceFirstTermAmount !== undefined) {
            firstTermPrice = roundToNearestRupee(sourceFirstTermAmount);
          }
        }

        // Multi-year effective annual price
        const effectiveAnnualPrice =
          period > 1 ? roundToNearestRupee(registrationPrice / period) : undefined;

        // TERM-AWARE ALLOWANCE CALCULATION:
        // termAllowance = annualPlanAllowance * registrationPeriodYears
        // upgradeAmount = Math.max(0, comparableCost - termAllowance)
        const termAllowance = annualAllowance * period;
        const comparableCost = currency === 'INR' ? registrationPrice : Math.round(registrationPrice * 87);
        const included = termAllowance > 0 && comparableCost <= termAllowance;
        const upgradeAmount = Math.max(0, comparableCost - termAllowance);

        // Premium detection strictly from GoDaddy v3 inventory/fee attributes
        const isPremium = item.inventory === 'PREMIUM' || Boolean(item.premium);
        const premiumFees = item.fees?.premium ? this.normalizeV3Price(item.fees.premium) : undefined;
        const isGoDaddyRecommended = Boolean(selectedPriceOption.recommended);
        const isRequested = requestedDomain ? domainStr === requestedDomain.toLowerCase() : false;

        // Recommendation score calculation
        const affinityScore = meta?.categoryAffinity[category] || 6;
        const requestedBonus = isRequested ? 10 : 0;
        const inclusionBonus = included ? 5 : 0;
        const recBonus = isGoDaddyRecommended ? 2 : 0;
        const pricePenalty = upgradeAmount > 0 ? Math.min(5, Math.floor(upgradeAmount / 300)) : 0;
        const termPenalty = period > 1 ? 2 : 0;
        const totalScore = affinityScore + requestedBonus + inclusionBonus + recBonus - pricePenalty - termPenalty;

        quotes.push({
          domain: domainStr,
          extension: ext,
          availability: 'AVAILABLE',
          sourceAmount,
          sourceCurrency,
          sourceRenewalAmount,
          sourceFirstTermAmount,
          period,
          registrationPeriod,
          hasFxConversion,
          fxRate,
          fxTimestamp,
          registrationPrice,
          effectiveAnnualPrice,
          renewalPrice,
          firstTermPrice,
          currency,
          exchangeRateNotice,
          premium: isPremium,
          premiumFees,
          inventory: item.inventory,
          isGoDaddyRecommended,
          isRequestedDomain: isRequested,
          planAllowance: annualAllowance,
          termAllowance,
          included,
          upgradeAmount,
          recommendationBadge: isRequested
            ? 'Requested Domain'
            : meta?.defaultBadge || (included ? 'Best Overall' : 'Best Value'),
          recommendationReason: isRequested
            ? 'Your exact requested domain is available.'
            : meta?.defaultReason || 'Recommended domain for your business.',
          suitability: domainExtensionOptions.find((d) => d.extension === ext)?.suitability,
          note:
            annualAllowance === 0
              ? 'Free Launch includes hosted URL. Select Launch Plus or Starter to apply domain allowance.'
              : included
              ? `✓ 100% INCLUDED in your plan allowance (₹${termAllowance} for ${registrationPeriod}).`
              : `Upgrade +₹${upgradeAmount} over your plan's included ₹${termAllowance} allowance.`,
          _score: totalScore,
        } as DomainExtensionQuote & { _score: number });
      }

      // If zero available domains after direct AND suggestions:
      if (quotes.length === 0) {
        return {
          query: rawInput,
          sanitizedName: cleanLabel,
          requestedDomain: requestedDomain || null,
          requestedDomainAvailable: requestedDomainAvailable,
          selectedPlanId: planId,
          planAllowance: annualAllowance,
          isLiveChecked: true,
          status: 'NO_RESULTS',
          errorMessage:
            'No available domains found matching this search. Try another business name or variation.',
          topRecommendation: null,
          results: [],
          suggestionsUsed,
          disclaimer: 'Domain availability varies continuously based on global registrar databases.',
          instructions: 'Try modifying your keyword or adding a prefix/suffix.',
        };
      }

      // Rank recommendations
      quotes.sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0));

      const topRec = quotes[0];
      if (topRec) {
        if (topRec.isRequestedDomain) {
          topRec.recommendationBadge = 'Requested Domain';
          topRec.recommendationReason = 'Your exact requested domain is verified available.';
        } else if (category === 'school' && topRec.extension === '.org') {
          topRec.recommendationBadge = 'Best Overall';
          topRec.recommendationReason =
            'Ideal institutional identity for an educational academy, school, or trust with a reasonable upgrade cost.';
        } else if (category === 'tech' && topRec.extension === '.com') {
          topRec.recommendationBadge = 'Best Overall';
          topRec.recommendationReason =
            'Strongest recognized brand presence for a tech and modern digital venture.';
        } else if (topRec.included) {
          topRec.recommendationBadge = 'Best Overall';
          topRec.recommendationReason = `Fully covered by your plan allowance (₹${topRec.termAllowance} for ${topRec.registrationPeriod}) with zero upgrade cost.`;
        } else {
          topRec.recommendationBadge = 'Best Value';
          topRec.recommendationReason = 'Optimal balance of brand recognition and upgrade affordability.';
        }
      }

      // Cap results to top 12 clean results
      const cleanResults = quotes
        .slice(0, 12)
        .map(({ _score, ...rest }: any) => rest as DomainExtensionQuote);

      const successResponse: DomainCheckResponse = {
        query: rawInput,
        sanitizedName: cleanLabel,
        requestedDomain: requestedDomain || null,
        requestedDomainAvailable: requestedDomainAvailable,
        selectedPlanId: planId,
        planAllowance: annualAllowance,
        isLiveChecked: true,
        status: 'SUCCESS',
        providerName: this.name,
        topRecommendation: cleanResults[0] || null,
        results: cleanResults,
        suggestionsUsed,
        disclaimer:
          'Displayed domain prices are current indicative registrar prices and may change before registration. Domain inclusion is based strictly on your selected plan’s domain price allowance.',
        instructions:
          'Select any available domain below. If its price exceeds your plan allowance, you only pay the difference.',
      };

      // Cache successful response for 5 minutes
      responseCache.set(cacheKey, {
        response: successResponse,
        timestamp: Date.now(),
      });

      return successResponse;
    } catch (err: any) {
      console.error('GoDaddy v3 lookup error:', err?.message || err);
      return {
        query: rawInput,
        sanitizedName: cleanLabel,
        requestedDomain: requestedDomain || null,
        requestedDomainAvailable: null,
        selectedPlanId: planId,
        planAllowance: annualAllowance,
        isLiveChecked: true,
        status: 'PROVIDER_UNAVAILABLE',
        errorMessage:
          'Domain registrar timed out or is temporarily unreachable. Availability and pricing will be confirmed before registration.',
        topRecommendation: null,
        results: [],
        suggestionsUsed: false,
        disclaimer: 'Registrar temporary error. Domain will be verified during project scoping.',
        instructions: 'Please try again or submit your preferred domain in your quote request.',
      };
    }
  }
}

export const domainProvider: IDomainProvider = new GoDaddyDomainProvider();
