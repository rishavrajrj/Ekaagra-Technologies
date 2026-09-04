import { websitePlans, additionalPageTiers, planDomainAllowances } from './data';
import type { CreateOrderRequest } from './types';

export interface VerifiedOrderCalculation {
  isValid: boolean;
  error?: string;
  serviceType: string;
  planId?: string;
  planName: string;
  planPrice: number;
  additionalPagesTotal: number;
  verifiedPages: Array<{ name: string; tierId: string; price: number }>;
  domainUpgrade: number;
  domainName: string | null;
  domainStatus: string;
  finalAmountINR: number;
  amountInPaise: number;
  isAllInclusive: boolean;
  notes: string;
}

/**
 * Strict Server-Side Price Calculation Engine
 * Recomputes every fee from canonical server data. Completely rejects and ignores
 * any client-supplied totals, manipulated prices, or unverified domain estimates.
 */
export function calculateVerifiedOrderTotal(
  request: CreateOrderRequest
): VerifiedOrderCalculation {
  // 1. Handle Admin Custom Payment Links (Milestones, booking deposits, custom quotes)
  if (request.isCustomPaymentLink) {
    const rawCustomAmount = Number(request.customAmountINR);
    if (isNaN(rawCustomAmount) || rawCustomAmount <= 0) {
      return {
        isValid: false,
        error: 'Invalid custom payment amount specified.',
        serviceType: request.serviceType || 'Custom Project Payment',
        planName: 'Custom Payment',
        planPrice: 0,
        additionalPagesTotal: 0,
        verifiedPages: [],
        domainUpgrade: 0,
        domainName: null,
        domainStatus: 'N/A',
        finalAmountINR: 0,
        amountInPaise: 0,
        isAllInclusive: true,
        notes: '',
      };
    }

    const sanitizedAmount = Math.round(rawCustomAmount);
    return {
      isValid: true,
      serviceType: request.serviceType || 'Custom Software Milestone',
      planId: 'custom-payment',
      planName: request.customDescription || 'Custom Project Milestone Payment',
      planPrice: sanitizedAmount,
      additionalPagesTotal: 0,
      verifiedPages: [],
      domainUpgrade: 0,
      domainName: null,
      domainStatus: 'N/A',
      finalAmountINR: sanitizedAmount,
      amountInPaise: sanitizedAmount * 100,
      isAllInclusive: true,
      notes: request.customDescription || 'Admin Generated Custom Payment Link',
    };
  }

  // 2. Validate Standardized Website Plan
  const planId = request.planId || 'starter';
  const matchedPlan = websitePlans.find((p) => p.id === planId);

  if (!matchedPlan) {
    return {
      isValid: false,
      error: `Invalid plan specified (${planId}). Must be one of: ${websitePlans.map((p) => p.id).join(', ')}`,
      serviceType: request.serviceType || 'Website Development',
      planName: 'Unknown Plan',
      planPrice: 0,
      additionalPagesTotal: 0,
      verifiedPages: [],
      domainUpgrade: 0,
      domainName: null,
      domainStatus: 'INVALID',
      finalAmountINR: 0,
      amountInPaise: 0,
      isAllInclusive: true,
      notes: '',
    };
  }

  // Authoritative server-side plan price (e.g., Launch Plus = ₹499, Starter = ₹999)
  const serverPlanPrice = matchedPlan.price;

  // 3. Validate & Recompute Additional Pages
  let serverPagesTotal = 0;
  const verifiedPages: Array<{ name: string; tierId: string; price: number }> = [];

  if (Array.isArray(request.additionalPages)) {
    for (const requestedPage of request.additionalPages) {
      const matchedTier = additionalPageTiers.find((t) => t.id === requestedPage.tierId);
      if (matchedTier) {
        serverPagesTotal += matchedTier.price;
        verifiedPages.push({
          name: (requestedPage.name || matchedTier.type).slice(0, 100),
          tierId: matchedTier.id,
          price: matchedTier.price,
        });
      } else {
        // Default to simple-info tier price (₹199) if unrecognized tier
        const fallbackTier = additionalPageTiers[0];
        serverPagesTotal += fallbackTier.price;
        verifiedPages.push({
          name: (requestedPage.name || 'Additional Page').slice(0, 100),
          tierId: fallbackTier.id,
          price: fallbackTier.price,
        });
      }
    }
  }

  // 4. Validate Domain Upgrades (Phase 18 Anti-Tampering Rules)
  // Domains marked as PRECHECK_REQUIRED or unverified CANNOT increase the online checkout total.
  // Only domains with live server-side registrar verification may have a difference applied.
  const domainAllowance = planDomainAllowances[matchedPlan.id] ?? 0;
  let domainUpgradeAmount = 0;
  let domainStatus = 'NOT_SELECTED';
  const domainName = request.preferredDomain?.trim() || null;

  if (request.domainChoice === 'EXISTING_DOMAIN' || request.domainChoice === 'existing') {
    domainStatus = 'EXISTING';
    domainUpgradeAmount = 0;
  } else if (request.domainChoice === 'DECIDE_LATER' || request.domainChoice === 'later' || !domainName) {
    domainStatus = 'DECIDE_LATER';
    domainUpgradeAmount = 0;
  } else {
    // NEW_DOMAIN
    // If the registrar is configured and the price was live-verified, we can check.
    // However, if unverified, domain difference remains strictly 0 for online checkout.
    if (request.isPriceVerified && domainAllowance > 0) {
      // In checkout, only standard registered domains within plan allowance are included without difference.
      domainUpgradeAmount = 0;
      domainStatus = 'AVAILABLE';
    } else {
      domainStatus = 'PRECHECK_REQUIRED';
      domainUpgradeAmount = 0; // Never add unverified client estimates to payable amount
    }
  }

  // 5. Final Authoritative Payable Calculation (INR and Paise)
  const finalPayableINR = serverPlanPrice + serverPagesTotal + domainUpgradeAmount;
  const amountInPaise = Math.round(finalPayableINR * 100);

  const notesSummary = [
    `Plan: ${matchedPlan.name} (₹${serverPlanPrice})`,
    verifiedPages.length > 0 ? `Pages (${verifiedPages.length}): ₹${serverPagesTotal}` : '',
    domainName ? `Domain: ${domainName} (${domainStatus})` : '',
    `Total Payable: ₹${finalPayableINR}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return {
    isValid: true,
    serviceType: request.serviceType || 'Website Development',
    planId: matchedPlan.id,
    planName: matchedPlan.name,
    planPrice: serverPlanPrice,
    additionalPagesTotal: serverPagesTotal,
    verifiedPages,
    domainUpgrade: domainUpgradeAmount,
    domainName,
    domainStatus,
    finalAmountINR: finalPayableINR,
    amountInPaise,
    isAllInclusive: true, // Net transparent pricing, zero hidden fees
    notes: notesSummary,
  };
}
