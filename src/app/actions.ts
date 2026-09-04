'use server';

import type { ContactFormData, QuoteFormData, LeadFilter, LeadStatus, StructuredQuoteRequest, SchoolQuoteRequest } from '@/lib/types';
import { websitePlans, additionalPageTiers, planDomainAllowances } from '@/lib/data';
import { calculateSchoolPrice, schoolPlans, schoolDomainAllowances } from '@/lib/schoolPricing';
import { normalizeDomainInput, validateDomainInput } from '@/lib/domain/schoolDomain';
import { domainProvider } from '@/lib/domain/provider';
import {
  ADMIN_EMAIL,
  FROM_EMAIL,
  sendContactNotification,
  sendQuoteNotification,
  sendClientContactConfirmation,
  sendClientQuoteConfirmation,
  sendSchoolQuoteNotification,
  sendClientSchoolQuoteConfirmation,
} from '@/lib/email';
import { buildSchoolSubmissionWhatsAppUrl } from '@/lib/whatsapp';
import {
  createLead,
  getLeads,
  getLeadStats,
  updateLeadStatus,
  updateLeadNotes,
} from '@/lib/supabase';
import { authenticateAdmin, logoutAdmin, verifyAdminSession } from '@/lib/adminAuth';
import { redirect } from 'next/navigation';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return 'unknown';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `*@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * -----------------------------------------------------------------------------
 * PUBLIC ACTIONS: Contact & Quote Form Submissions
 * -----------------------------------------------------------------------------
 */

export async function submitContactForm(data: ContactFormData) {
  // Validate required fields
  if (!data.name || !data.phone || !data.email || !data.service || !data.description) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Phone validation (basic)
  if (data.phone.length < 10) {
    return { success: false, message: 'Please enter a valid phone number.' };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'ekaagratechnologies@gmail.com';
  const fromEmail = process.env.FROM_EMAIL?.trim() || 'Ekaagra Technologies <notifications@ekaagratechnologies.site>';

  const resendConfigured = Boolean(resendApiKey && resendApiKey.length > 0);
  const adminRecipientConfigured = Boolean(adminEmail && adminEmail.length > 0);
  const fromConfigured = Boolean(fromEmail && fromEmail.length > 0);

  console.log(
    `[CONTACT EMAIL DEBUG]\nserverActionCalled=true\nemailFunctionCalled=true\nresendConfigured=${resendConfigured}\nadminRecipientConfigured=${adminRecipientConfigured}\nfromConfigured=${fromConfigured}`
  );

  // 1. Persist lead to Supabase Database (Source of truth if configured)
  let leadRecordId: string | undefined;
  try {
    const leadInsertRes = await createLead({
      source: 'CONTACT_FORM',
      type: 'CONTACT',
      status: 'NEW',
      name: data.name,
      organization: data.organization || null,
      phone: data.phone,
      email: data.email,
      service: data.service,
      budget: data.budget || null,
      description: data.description,
      preferred_contact: data.preferredContact || null,
    });

    if (leadInsertRes.success && leadInsertRes.data) {
      leadRecordId = leadInsertRes.data.id;
    }
  } catch (dbError) {
    console.error('[CONTACT SUBMISSION] Database insertion exception:', dbError);
  }

  // 2. Send instant email notification to Ekaagra Admin (Exactly 1 call)
  let adminResult;
  try {
    adminResult = await sendContactNotification(data);
  } catch (error) {
    console.error('[CONTACT SUBMISSION] Admin notification exception:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  if (adminResult.success) {
    console.log(`[CONTACT EMAIL STATUS] EMAIL SENT (admin messageId=${adminResult.messageId})`);
  } else {
    console.error(`[CONTACT EMAIL STATUS] EMAIL FAILED (admin error=${adminResult.error})`);
  }

  // 3. Send confirmation email to the Client (independent of admin email)
  let clientResult;
  try {
    clientResult = await sendClientContactConfirmation(data);
  } catch (error) {
    console.error('[CONTACT SUBMISSION] Client confirmation exception:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    leadId: leadRecordId,
    emailDelivered: isDelivered,
    adminMessageId: adminResult.messageId,
    clientMessageId: clientResult.messageId,
    message: isDelivered
      ? "Thank you! Your enquiry has been received. Our team will review your requirements and get back to you within 24 hours."
      : "Thank you! Your enquiry has been received. Our team will review your requirements shortly.",
  };
}
export async function submitQuoteForm(data: QuoteFormData, structuredQuote?: StructuredQuoteRequest) {
  if (!data.name || !data.phone || !data.email || !data.projectType || !data.description) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (data.phone.length < 10) {
    return { success: false, message: 'Please enter a valid phone number.' };
  }

  // --- SERVER-SIDE PRICE VALIDATION & RECALCULATION ---
  if (structuredQuote && structuredQuote.plan) {
    const matchedPlan = websitePlans.find((p) => p.id === structuredQuote.plan.id);
    const verifiedPlanPrice = matchedPlan ? matchedPlan.price : structuredQuote.plan.price;

    let verifiedPagesTotal = 0;
    if (Array.isArray(structuredQuote.additionalPages)) {
      for (const page of structuredQuote.additionalPages) {
        const matchedTier = additionalPageTiers.find((t) => t.id === page.tierId);
        verifiedPagesTotal += matchedTier ? matchedTier.price : page.price;
      }
    }

    const verifiedAnnualAllowance =
      matchedPlan ? planDomainAllowances[matchedPlan.id] ?? 0 : (structuredQuote.domain?.annualAllowance ?? 0);
    const period = structuredQuote.domain?.period || 1;
    const verifiedTermAllowance = verifiedAnnualAllowance * period;
    const comparableCost = structuredQuote.domain?.estimatedINR || 0;
    const verifiedUpgrade = structuredQuote.domain ? Math.max(0, comparableCost - verifiedTermAllowance) : 0;

    const verifiedTotal = verifiedPlanPrice + verifiedPagesTotal + verifiedUpgrade;

    data.budget = `Estimated Total: ₹${verifiedTotal.toLocaleString('en-IN')} (Plan: ₹${verifiedPlanPrice.toLocaleString('en-IN')}, Pages: +₹${verifiedPagesTotal.toLocaleString('en-IN')}, Domain: +₹${verifiedUpgrade.toLocaleString('en-IN')})`;
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'ekaagratechnologies@gmail.com';
  const fromEmail = process.env.FROM_EMAIL?.trim() || 'Ekaagra Technologies <notifications@ekaagratechnologies.site>';

  const resendConfigured = Boolean(resendApiKey && resendApiKey.length > 0);
  const adminRecipientConfigured = Boolean(adminEmail && adminEmail.length > 0);
  const fromConfigured = Boolean(fromEmail && fromEmail.length > 0);

  console.log(
    `[QUOTE EMAIL DEBUG]\nserverActionCalled=true\nemailFunctionCalled=true\nresendConfigured=${resendConfigured}\nadminRecipientConfigured=${adminRecipientConfigured}\nfromConfigured=${fromConfigured}`
  );

  // 1. Persist quote request to Supabase Database (Source of truth if configured)
  let leadRecordId: string | undefined;
  try {
    const leadInsertRes = await createLead({
      source: 'QUOTE_FORM',
      type: 'QUOTE',
      status: 'NEW',
      name: data.name,
      organization: data.organization || null,
      phone: data.phone,
      email: data.email,
      project_type: data.projectType,
      description: data.description,
      features: data.features || null,
      expected_users: data.expectedUsers || null,
      budget: data.budget || null,
      timeline: data.timeline || null,
    });

    if (leadInsertRes.success && leadInsertRes.data) {
      leadRecordId = leadInsertRes.data.id;
    }
  } catch (dbError) {
    console.error('[QUOTE SUBMISSION] Database insertion exception:', dbError);
  }

  // 2. Send instant quote notification to Ekaagra Admin (Exactly 1 call)
  let adminResult;
  try {
    adminResult = await sendQuoteNotification(data);
  } catch (error) {
    console.error('[QUOTE SUBMISSION] Admin notification exception:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  if (adminResult.success) {
    console.log(`[QUOTE EMAIL STATUS] EMAIL SENT (admin messageId=${adminResult.messageId})`);
  } else {
    console.error(`[QUOTE EMAIL STATUS] EMAIL FAILED (admin error=${adminResult.error})`);
  }

  // 3. Send confirmation email to the Client (independent of admin email)
  let clientResult;
  try {
    clientResult = await sendClientQuoteConfirmation(data);
  } catch (error) {
    console.error('[QUOTE SUBMISSION] Client confirmation exception:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  const isDelivered = adminResult.success;

  return {
    success: true,
    leadId: leadRecordId,
    emailDelivered: isDelivered,
    adminMessageId: adminResult.messageId,
    clientMessageId: clientResult.messageId,
    message: isDelivered
      ? "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements and send a customized roadmap and estimate."
      : "Thank you! Your project enquiry and scope details have been received. We'll analyze your requirements shortly.",
  };
}

/**
 * -----------------------------------------------------------------------------
 * SCHOOL ACTION: Dedicated School Solutions Enquiry Submission
 * -----------------------------------------------------------------------------
 */

export async function submitSchoolQuoteForm(request: SchoolQuoteRequest) {
  // 1. Validate required school & contact fields
  const school = request?.school;
  const contact = request?.contact;

  if (
    !school?.schoolName ||
    !school?.schoolType ||
    !school?.board ||
    !school?.city ||
    !school?.state ||
    !school?.approximateStudents ||
    !contact?.fullName ||
    !contact?.email ||
    !contact?.phone ||
    !contact?.designation
  ) {
    return { success: false, message: 'Please complete all required school and contact fields.' };
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contact.email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  // Phone minimum length
  if (contact.phone.replace(/[^0-9]/g, '').length < 10) {
    return { success: false, message: 'Please enter a valid 10-digit phone number.' };
  }

  // Validate product
  const matchedPlan = schoolPlans.find((p) => p.id === request.productId);
  if (!matchedPlan) {
    return { success: false, message: 'Invalid school product selected.' };
  }

  // 2. SERVER-SIDE PRICE RECALCULATION & DOMAIN NORMALIZATION (Never trust client pricing calculations)
  const canonicalAllowance = schoolDomainAllowances[matchedPlan.id] ?? 300;
  
  // Extract and normalize domain selection details
  const rawDomainStr = request.domainSelection?.preferredDomain || request.domain?.domain || '';
  const rawChoice =
    request.domainSelection?.domainChoice ||
    request.domain?.domainChoice ||
    (request.domain ? 'NEW_DOMAIN' : 'DECIDE_LATER');

  // Standardize domain choice to canonical representation
  let canonicalChoice: 'NEW_DOMAIN' | 'EXISTING_DOMAIN' | 'DECIDE_LATER';
  if (rawChoice === 'EXISTING_DOMAIN' || rawChoice === 'existing') {
    canonicalChoice = 'EXISTING_DOMAIN';
  } else if (rawChoice === 'DECIDE_LATER' || rawChoice === 'later' || !rawDomainStr.trim()) {
    canonicalChoice = 'DECIDE_LATER';
  } else {
    canonicalChoice = 'NEW_DOMAIN';
  }

  let canonicalDomain: string | null = null;
  let canonicalStatus: 'AVAILABLE' | 'PRECHECK_REQUIRED' | 'EXISTING' | 'DECIDE_LATER';
  let canonicalPrice: number | null = null;
  let canonicalDifference = 0;
  let isPriceVerified = false;

  if (canonicalChoice === 'DECIDE_LATER') {
    canonicalDomain = null;
    canonicalStatus = 'DECIDE_LATER';
    canonicalPrice = null;
    canonicalDifference = 0;
    isPriceVerified = false;
  } else if (canonicalChoice === 'EXISTING_DOMAIN') {
    if (!rawDomainStr.trim()) {
      return { success: false, message: 'Please enter your school’s existing domain name.' };
    }
    const norm = normalizeDomainInput(rawDomainStr);
    const validation = validateDomainInput(norm.normalized, { requireFullDomain: true });
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Please enter a valid existing school domain.' };
    }
    canonicalDomain = norm.normalized;
    canonicalStatus = 'EXISTING';
    canonicalPrice = 0;
    canonicalDifference = 0;
    isPriceVerified = true;
  } else {
    // NEW_DOMAIN
    const norm = normalizeDomainInput(rawDomainStr);
    const validation = validateDomainInput(norm.normalized);
    if (!validation.isValid) {
      return { success: false, message: validation.error || 'Please enter a valid preferred domain.' };
    }
    canonicalDomain = norm.normalized;

    // ANTI-TAMPERING: Check if a live registrar provider is actually configured in the environment
    const hasRegistrarApi = Boolean(
      process.env.GODADDY_PAT ||
      (process.env.GODADDY_API_KEY && process.env.GODADDY_API_SECRET) ||
      process.env.REGISTRAR_API_KEY
    );

    if (!hasRegistrarApi) {
      // Registrar credentials unconfigured: ALL preferred domains MUST remain PRECHECK_REQUIRED
      // The server strictly ignores any client claims of isPriceVerified or custom domainPrice
      isPriceVerified = false;
      canonicalStatus = 'PRECHECK_REQUIRED';
      canonicalPrice = null;
      canonicalDifference = 0;
    } else {
      // If live registrar is configured, verify authoritatively
      const clientClaimsVerified = Boolean(request.domainSelection?.isPriceVerified || request.domain?.isPriceVerified);
      if (!clientClaimsVerified || request.domainSelection?.domainStatus === 'verification_required') {
        isPriceVerified = false;
        canonicalStatus = 'PRECHECK_REQUIRED';
        canonicalPrice = null;
        canonicalDifference = 0;
      } else {
        try {
          const liveCheck = await domainProvider.checkDomain({
            domain: norm.normalized,
            selectedPlanId: matchedPlan.id,
            businessCategory: 'school',
          });
          const matchedCandidate = liveCheck.results.find(
            (r) => r.domain.toLowerCase() === norm.normalized.toLowerCase() && r.availability === 'AVAILABLE'
          );
          if (matchedCandidate && typeof matchedCandidate.registrationPrice === 'number' && matchedCandidate.registrationPrice > 0) {
            isPriceVerified = true;
            canonicalStatus = 'AVAILABLE';
            canonicalPrice = matchedCandidate.registrationPrice;
            canonicalDifference = Math.max(0, matchedCandidate.registrationPrice - canonicalAllowance);
          } else {
            isPriceVerified = false;
            canonicalStatus = 'PRECHECK_REQUIRED';
            canonicalPrice = null;
            canonicalDifference = 0;
          }
        } catch {
          isPriceVerified = false;
          canonicalStatus = 'PRECHECK_REQUIRED';
          canonicalPrice = null;
          canonicalDifference = 0;
        }
      }
    }
  }

  // Recalculate full quote strictly server-side
  const verifiedPricing = calculateSchoolPrice({
    productId: request.productId,
    studentTierId: request.studentTierId,
    selectedAddonIds: request.selectedAddonIds,
    domainQuote: canonicalDomain && canonicalChoice === 'NEW_DOMAIN'
      ? {
          estimatedINR: canonicalPrice || 0,
          period: 1,
          annualAllowance: canonicalAllowance,
          isPriceVerified,
          domainStatus: canonicalStatus === 'AVAILABLE' ? 'available' : 'verification_required',
        }
      : null,
  });

  const domainStatusText =
    canonicalChoice === 'DECIDE_LATER'
      ? 'Domain to be decided before launch'
      : canonicalChoice === 'EXISTING_DOMAIN'
      ? `Existing domain (${canonicalDomain}) — DNS onboarding`
      : isPriceVerified && canonicalPrice !== null
      ? `${canonicalDomain} (Verified Live: ₹${canonicalPrice}/year, Difference: ₹${canonicalDifference})`
      : `${canonicalDomain} (Availability verification required)`;

  const budgetDisplay =
    verifiedPricing.totalEstimatedYearOne !== null
      ? `Year 1: ₹${verifiedPricing.totalEstimatedYearOne.toLocaleString('en-IN')}${
          verifiedPricing.totalRenewalFrom !== null
            ? ` | Renewal: ₹${verifiedPricing.totalRenewalFrom.toLocaleString('en-IN')}/year`
            : ''
        }${verifiedPricing.isDomainPricePendingVerification ? ' + Domain difference if applicable after verification' : ''}`
      : 'Custom Enterprise Quotation';

  const structuredDescription = [
    `School Name: ${school.schoolName}`,
    `Type: ${school.schoolType} | Board: ${school.board}`,
    `Location: ${school.city}, ${school.state}`,
    `Approximate Students: ${school.approximateStudents}`,
    school.currentWebsite ? `Current Website: ${school.currentWebsite}` : '',
    school.existingErp ? `Existing Software: ${school.existingErp}` : '',
    school.currentSoftware ? `Current Tools: ${school.currentSoftware}` : '',
    school.preferredLanguage ? `Language Preference: ${school.preferredLanguage}` : '',
    school.requirements ? `Goals & Scope: ${school.requirements}` : '',
    '',
    '--- CONFIGURATION SUMMARY ---',
    `Product: ${verifiedPricing.productName}`,
    verifiedPricing.studentTierLabel ? `Capacity Bracket: ${verifiedPricing.studentTierLabel}` : '',
    `Domain Selection: ${domainStatusText}`,
    `Domain Plan Allowance: ₹${canonicalAllowance}/year included`,
    isPriceVerified && canonicalDifference > 0 ? `Domain Additional Cost: ₹${canonicalDifference}` : '',
    verifiedPricing.selectedAddonNames.length > 0
      ? `Selected Add-ons: ${verifiedPricing.selectedAddonNames.join(', ')}`
      : 'Add-ons: None',
    `Calculated Year 1 Total: ${
      verifiedPricing.totalEstimatedYearOne !== null
        ? `₹${verifiedPricing.totalEstimatedYearOne.toLocaleString('en-IN')}`
        : 'Custom'
    }`,
    `Calculated Renewal: ${
      verifiedPricing.totalRenewalFrom !== null
        ? `₹${verifiedPricing.totalRenewalFrom.toLocaleString('en-IN')}/year`
        : 'Custom'
    }`,
    `Contact: ${contact.fullName} (${contact.designation}) | Preferred: ${contact.preferredContactMethod || 'Phone'}`,
    '',
    '--- STORED DOMAIN ATTRIBUTES ---',
    `domain_choice: ${canonicalChoice}`,
    `preferred_domain: ${canonicalDomain || 'null'}`,
    `domain_status: ${canonicalStatus}`,
    `domain_price: ${canonicalPrice !== null ? canonicalPrice : 'null'}`,
    `domain_allowance: ${canonicalAllowance}`,
    `domain_difference: ${canonicalDifference}`,
  ]
    .filter(Boolean)
    .join('\n');

  // 3. Persist lead to Supabase Database
  let leadRecordId: string | undefined;
  try {
    const leadInsertRes = await createLead({
      source: 'QUOTE_FORM',
      type: 'QUOTE',
      status: 'NEW',
      name: contact.fullName,
      organization: `${school.schoolName} (${school.board} - ${school.city})`,
      phone: contact.phone,
      email: contact.email,
      service: 'School Solutions',
      project_type: verifiedPricing.productName,
      expected_users: `${school.approximateStudents} students${
        verifiedPricing.studentTierLabel ? ` (${verifiedPricing.studentTierLabel})` : ''
      }`,
      budget: budgetDisplay,
      features:
        verifiedPricing.selectedAddonNames.length > 0
          ? verifiedPricing.selectedAddonNames.join(', ')
          : 'Standard School Package',
      description: structuredDescription,
      preferred_contact: contact.preferredContactMethod || 'Phone',
      notes: `domain_choice: ${canonicalChoice} | preferred_domain: ${canonicalDomain || 'null'} | domain_status: ${canonicalStatus} | domain_price: ${canonicalPrice !== null ? `₹${canonicalPrice}` : 'null'} | domain_allowance: ₹${canonicalAllowance} | domain_difference: ₹${canonicalDifference} | Designation: ${contact.designation} | WhatsApp: ${contact.whatsapp || contact.phone}`,
    });

    if (leadInsertRes.success && leadInsertRes.data) {
      leadRecordId = leadInsertRes.data.id;
    }
  } catch (dbError) {
    console.error('[SCHOOL QUOTE SUBMISSION] Database insertion exception:', dbError);
  }

  // Sanitized request for notifications
  const sanitizedRequest: SchoolQuoteRequest = {
    ...request,
    domainSelection: {
      domainChoice: canonicalChoice,
      preferredDomain: canonicalDomain,
      domainStatus: canonicalStatus,
      domainPrice: canonicalPrice,
      domainAllowance: canonicalAllowance,
      domainDifference: canonicalDifference,
      isPriceVerified,
    },
    domain: canonicalChoice === 'DECIDE_LATER' || !canonicalDomain ? null : {
      domain: canonicalDomain,
      provider:
        canonicalChoice === 'EXISTING_DOMAIN'
          ? 'Existing Domain (School Owned)'
          : isPriceVerified
          ? 'GoDaddy Domains API v3'
          : 'Registrar Verification Required',
      sourceCurrency: 'INR',
      period: 1,
      registrationPeriod: '1 year',
      annualAllowance: canonicalAllowance,
      termAllowance: canonicalAllowance,
      upgradeAmount: canonicalDifference,
      premium: false,
      isIncluded: canonicalDifference === 0,
      domainChoice: canonicalChoice === 'EXISTING_DOMAIN' ? 'existing' : 'new',
      domainStatus: canonicalStatus === 'AVAILABLE' ? 'available' : 'verification_required',
      isPriceVerified,
      estimatedINR: canonicalPrice ?? undefined,
    },
  };

  // 4. Send email notifications
  let adminResult;
  try {
    adminResult = await sendSchoolQuoteNotification(sanitizedRequest, verifiedPricing);
  } catch (error) {
    console.error('[SCHOOL SUBMISSION] Admin notification exception:', error);
    adminResult = { success: false, method: 'error' as const, error: String(error) };
  }

  let clientResult;
  try {
    clientResult = await sendClientSchoolQuoteConfirmation(sanitizedRequest, verifiedPricing);
  } catch (error) {
    console.error('[SCHOOL SUBMISSION] Client confirmation exception:', error);
    clientResult = { success: false, method: 'error' as const, error: String(error) };
  }

  // 5. Generate direct WhatsApp follow-up link
  const whatsAppUrl = buildSchoolSubmissionWhatsAppUrl({
    schoolName: school.schoolName,
    contactName: contact.fullName,
    productName: verifiedPricing.productName,
    studentRange: verifiedPricing.studentTierLabel || undefined,
    yearOnePrice: verifiedPricing.totalEstimatedYearOne,
    renewalPrice: verifiedPricing.totalRenewalFrom,
    domainChoice: canonicalChoice,
    domainName: canonicalDomain || undefined,
    domainStatus: canonicalStatus,
    isDomainPriceVerified: isPriceVerified,
    domainDifference: canonicalDifference,
    city: school.city,
  });

  return {
    success: true,
    leadId: leadRecordId,
    verifiedPricing,
    whatsAppUrl,
    emailDelivered: adminResult.success,
    message:
      'Thank you! Your school solution enquiry has been successfully received. Our school technology team will review your requirements and reach out within 24 hours.',
  };
}


/**
 * -----------------------------------------------------------------------------
 * ADMIN ACTIONS (Protected by verifyAdminSession)
 * -----------------------------------------------------------------------------
 */

export async function adminLoginAction(password: string) {
  const success = await authenticateAdmin(password);
  if (!success) {
    return { success: false, message: 'Invalid administrative password.' };
  }
  return { success: true };
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect('/admin/login');
}

export async function fetchLeadsAction(filter: LeadFilter = {}) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, leads: [], total: 0, error: 'Unauthorized. Please login to access leads.' };
  }

  return getLeads(filter);
}

export async function fetchLeadStatsAction() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return {
      success: false,
      stats: { total: 0, new: 0, contacted: 0, qualified: 0, proposalSent: 0, converted: 0, lost: 0 },
      error: 'Unauthorized.',
    };
  }

  return getLeadStats();
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return updateLeadStatus(leadId, status);
}

export async function updateLeadNotesAction(leadId: string, notes: string) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    return { success: false, error: 'Unauthorized.' };
  }

  return updateLeadNotes(leadId, notes);
}
