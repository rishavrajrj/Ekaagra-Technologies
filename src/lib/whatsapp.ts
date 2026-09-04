import type { ContactFormData, QuoteFormData } from './types';

/**
 * Fallback business WhatsApp number (can be empty to use generic direct WhatsApp share links).
 */
export const DEFAULT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '';

/**
 * Sanitize any phone number string into clean digits with country code.
 */
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  // If 10-digit Indian number provided without 91 country code, prepend 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }
  return digitsOnly;
}

/**
 * Retrieve the centralized business WhatsApp number.
 */
export function getBusinessWhatsAppNumber(): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (envNumber && envNumber.trim() !== '') {
    return sanitizePhoneNumber(envNumber);
  }
  return DEFAULT_WHATSAPP_NUMBER ? sanitizePhoneNumber(DEFAULT_WHATSAPP_NUMBER) : '';
}

/**
 * Generic safe helper to build WhatsApp chat URL.
 */
export function getWhatsAppChatUrl(message: string, customNumber?: string): string {
  const targetNumber = customNumber
    ? sanitizePhoneNumber(customNumber)
    : getBusinessWhatsAppNumber();

  const encodedMessage = encodeURIComponent(message.trim());

  if (targetNumber) {
    return `https://wa.me/${targetNumber}?text=${encodedMessage}`;
  }

  return `https://api.whatsapp.com/send?text=${encodedMessage}`;
}

/**
 * Pre-filled message for Global Floating WhatsApp Button.
 */
export function buildGeneralInquiryWhatsAppUrl(): string {
  const message = 'Hello Ekaagra Technologies, I would like to discuss a website/project.';
  return getWhatsAppChatUrl(message);
}

/**
 * Pre-filled message for Contact Form submission.
 */
export function buildContactSubmissionWhatsAppUrl(data: ContactFormData): string {
  const lines: string[] = [
    'Hello Ekaagra Technologies,',
    '',
    'I just submitted an enquiry through your website.',
    '',
    `Name: ${data.name || 'N/A'}`,
  ];

  if (data.organization) {
    lines.push(`Organization: ${data.organization}`);
  }

  lines.push(`Service: ${data.service || 'N/A'}`);

  if (data.budget) {
    lines.push(`Budget: ${data.budget}`);
  }

  if (data.description) {
    lines.push(`Requirements: ${data.description}`);
  }

  return getWhatsAppChatUrl(lines.join('\n'));
}

/**
 * Pre-filled message for Quote Form submission.
 */
export function buildQuoteSubmissionWhatsAppUrl(data: QuoteFormData): string {
  const lines: string[] = [
    'Hello Ekaagra Technologies,',
    '',
    'I just submitted a project quote request through your website.',
    '',
    `Name: ${data.name || 'N/A'}`,
  ];

  if (data.organization) {
    lines.push(`Organization: ${data.organization}`);
  }

  lines.push(`Solution Type: ${data.projectType || 'N/A'}`);

  if (data.budget) {
    lines.push(`Target Budget: ${data.budget}`);
  }

  if (data.timeline) {
    lines.push(`Launch Timeline: ${data.timeline}`);
  }

  if (data.expectedUsers) {
    lines.push(`Expected Users/Scale: ${data.expectedUsers}`);
  }

  if (data.description) {
    lines.push(`Project Overview: ${data.description}`);
  }

  if (data.features) {
    lines.push(`Key Modules: ${data.features}`);
  }

  return getWhatsAppChatUrl(lines.join('\n'));
}

export interface SchoolSubmissionWhatsAppParams {
  schoolName: string;
  contactName: string;
  productName: string;
  studentRange?: string;
  yearOnePrice?: number | null;
  renewalPrice?: number | null;
  domainChoice?: string;
  domainName?: string;
  domainStatus?: string;
  isDomainPriceVerified?: boolean;
  domainDifference?: number;
  city?: string;
}

/**
 * Pre-filled message for School Solution Enquiry submission.
 */
export function buildSchoolSubmissionWhatsAppUrl(params: SchoolSubmissionWhatsAppParams): string {
  let domainLine = '';
  if (params.domainChoice === 'EXISTING_DOMAIN' || params.domainChoice === 'existing') {
    domainLine = `Domain: ${params.domainName || 'Existing Domain'} (Existing school domain — DNS onboarding)`;
  } else if (params.domainChoice === 'DECIDE_LATER' || params.domainChoice === 'later' || !params.domainName) {
    domainLine = 'Domain: To be decided before website launch';
  } else {
    // NEW_DOMAIN
    if (params.isDomainPriceVerified) {
      domainLine = `Preferred Domain: ${params.domainName} (Verified Available)`;
    } else {
      domainLine = `Preferred Domain: ${params.domainName} (Availability verification required)`;
    }
  }

  const isUnverifiedNewDomain =
    (params.domainChoice === 'NEW_DOMAIN' || params.domainChoice === 'new' || (!params.domainChoice && params.domainName)) &&
    !params.isDomainPriceVerified;

  const yearOnePriceText = params.yearOnePrice
    ? `Estimated Year 1: ₹${params.yearOnePrice.toLocaleString('en-IN')}${
        isUnverifiedNewDomain ? ' (+ Domain difference if applicable after verification)' : ''
      }`
    : '';

  const lines: string[] = [
    'Hello Ekaagra Technologies,',
    '',
    'I just submitted an enquiry for School Solutions through your website.',
    '',
    `School: ${params.schoolName || 'N/A'}`,
    `Contact Person: ${params.contactName || 'N/A'}`,
    params.city ? `Location: ${params.city}` : '',
    `Selected Solution: ${params.productName}`,
    params.studentRange ? `Student Strength: ${params.studentRange}` : '',
    domainLine,
    yearOnePriceText,
    params.renewalPrice ? `Renewal From: ₹${params.renewalPrice.toLocaleString('en-IN')}/year` : '',
    '',
    'I would like to discuss next steps and platform setup.',
  ].filter(Boolean);

  return getWhatsAppChatUrl(lines.join('\n'));
}

