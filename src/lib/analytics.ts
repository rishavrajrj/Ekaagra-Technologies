/**
 * Privacy-Conscious Analytics & Conversion Event Dispatcher
 * -----------------------------------------------------------
 * Provides lightweight, zero-dependency conversion event tracking.
 * Safely pushes to window.dataLayer (GTM / GA4) if present, and dispatches
 * a standard CustomEvent for client listeners.
 *
 * Never collects or transmits Personally Identifiable Information (PII).
 */

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export type ConversionEventName =
  | 'whatsapp_click'
  | 'phone_click'
  | 'email_click'
  | 'quote_cta_click'
  | 'contact_form_submit'
  | 'quote_form_submit'
  | 'consultation_request'
  | 'project_view';

export interface AnalyticsEventPayload {
  event: ConversionEventName;
  event_category: 'Conversion' | 'Engagement';
  event_label?: string;
  source_page?: string;
  [key: string]: unknown;
}

/**
 * Safe internal dispatcher that operates without errors during SSR or when ad-blockers are active.
 */
function dispatchAnalyticsEvent(payload: AnalyticsEventPayload): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Push to Google Tag Manager / GA4 dataLayer if available
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    // 2. Dispatch a standard browser event for custom client tracking
    window.dispatchEvent(
      new CustomEvent('ekaagra_analytics', {
        detail: payload,
      })
    );
  } catch {
    // Silent fail to ensure user experience is never impacted
  }
}

/**
 * Track user clicking a WhatsApp inquiry button or link.
 */
export function trackWhatsAppClick(sourcePage: string, buttonLabel?: string): void {
  dispatchAnalyticsEvent({
    event: 'whatsapp_click',
    event_category: 'Conversion',
    source_page: sourcePage,
    event_label: buttonLabel ?? 'WhatsApp Chat Button',
  });
}

/**
 * Track user initiating a direct phone call.
 */
export function trackPhoneClick(sourcePage: string): void {
  dispatchAnalyticsEvent({
    event: 'phone_click',
    event_category: 'Conversion',
    source_page: sourcePage,
    event_label: 'Direct Phone Dial',
  });
}

/**
 * Track user clicking the contact email link.
 */
export function trackEmailClick(sourcePage: string): void {
  dispatchAnalyticsEvent({
    event: 'email_click',
    event_category: 'Conversion',
    source_page: sourcePage,
    event_label: 'Email Client Link',
  });
}

/**
 * Track user clicking a "Get Quote" or "Request Proposal" primary CTA button.
 */
export function trackQuoteCtaClick(sourcePage: string, buttonLabel?: string): void {
  dispatchAnalyticsEvent({
    event: 'quote_cta_click',
    event_category: 'Engagement',
    source_page: sourcePage,
    event_label: buttonLabel ?? 'Request Proposal CTA',
  });
}

/**
 * Track form submission outcomes without capturing form field content (No PII).
 */
export function trackFormSubmission(
  formType: 'contact' | 'quote',
  status: 'success' | 'error'
): void {
  dispatchAnalyticsEvent({
    event: formType === 'contact' ? 'contact_form_submit' : 'quote_form_submit',
    event_category: 'Conversion',
    status,
    event_label: `${formType}_submission_${status}`,
  });
}

/**
 * Track user viewing or clicking into a case study project.
 */
export function trackProjectClick(projectSlug: string, sourcePage?: string): void {
  dispatchAnalyticsEvent({
    event: 'project_view',
    event_category: 'Engagement',
    project_slug: projectSlug,
    source_page: sourcePage,
    event_label: `View Project: ${projectSlug}`,
  });
}
