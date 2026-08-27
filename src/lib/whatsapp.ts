import type { ContactFormData, QuoteFormData } from './types';

/**
 * Single source of truth for Ekaagra Technologies Business WhatsApp number.
 * Configured via NEXT_PUBLIC_WHATSAPP_NUMBER environment variable.
 * Fallback placeholder is provided for development/staging.
 */
export const DEFAULT_WHATSAPP_NUMBER = '917970733767';

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
  return DEFAULT_WHATSAPP_NUMBER;
}

/**
 * Generic safe helper to build wa.me WhatsApp chat URL.
 */
export function getWhatsAppChatUrl(message: string, customNumber?: string): string {
  const targetNumber = customNumber
    ? sanitizePhoneNumber(customNumber)
    : getBusinessWhatsAppNumber();

  if (!targetNumber) {
    return '#';
  }

  const encodedMessage = encodeURIComponent(message.trim());
  return `https://wa.me/${targetNumber}?text=${encodedMessage}`;
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

  if (data.preferredContact) {
    lines.push(`Preferred Contact: ${data.preferredContact}`);
  }

  lines.push('', 'Requirement:');
  lines.push(data.description || 'N/A');
  lines.push('', 'Please help me with the next steps.');

  return getWhatsAppChatUrl(lines.join('\n'));
}

/**
 * Pre-filled message for Project Quote Form submission.
 */
export function buildQuoteSubmissionWhatsAppUrl(data: QuoteFormData): string {
  const lines: string[] = [
    'Hello Ekaagra Technologies,',
    '',
    'I just submitted a project quote request.',
    '',
    `Name: ${data.name || 'N/A'}`,
  ];

  if (data.organization) {
    lines.push(`Organization: ${data.organization}`);
  }

  lines.push(`Project Type: ${data.projectType || 'N/A'}`);

  if (data.budget) {
    lines.push(`Budget: ${data.budget}`);
  }

  if (data.timeline) {
    lines.push(`Timeline: ${data.timeline}`);
  }

  if (data.expectedUsers) {
    lines.push(`Expected Users: ${data.expectedUsers}`);
  }

  if (data.features) {
    lines.push('', 'Features:', data.features);
  }

  lines.push('', 'Requirements:');
  lines.push(data.description || 'N/A');
  lines.push('', "I'd like to discuss the project and next steps.");

  return getWhatsAppChatUrl(lines.join('\n'));
}
