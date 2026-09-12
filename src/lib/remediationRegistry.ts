/**
 * Centralized Guided Remediation & Deep Navigation Registry
 *
 * Maps every blocker, missing requirement, statutory document, and incomplete field
 * to its exact onboarding destination and DOM anchor for scrolling, focusing, and visual highlighting.
 */

import type { UniversalIntakeData } from './types';
import { CANONICAL_DOCUMENT_IDS } from './canonicalDocuments';
export { CANONICAL_DOCUMENT_IDS } from './canonicalDocuments';

export type IntakeSectionKey = keyof UniversalIntakeData | string;

export const PUBLICATION_REQUIREMENT_KEYS = {
  PRINCIPAL_NAME: 'PRINCIPAL_NAME',
  PRINCIPAL_PORTRAIT: 'PRINCIPAL_PORTRAIT',
  AFFILIATION_CERTIFICATE: 'AFFILIATION_CERTIFICATE',
  RECOGNITION_NOC: 'RECOGNITION_NOC',
  FIRE_SAFETY_CERTIFICATE: 'FIRE_SAFETY_CERTIFICATE',
  MANDATORY_PUBLIC_DISCLOSURE: 'MANDATORY_PUBLIC_DISCLOSURE',
  SCHOOL_NAME: 'SCHOOL_NAME',
  SCHOOL_ADDRESS: 'SCHOOL_ADDRESS',
  SCHOOL_PHONE: 'SCHOOL_PHONE',
  SCHOOL_EMAIL: 'SCHOOL_EMAIL',
  ADMIN_CONTACT: 'ADMIN_CONTACT',
  CAMPUS_HERO_IMAGE: 'CAMPUS_HERO_IMAGE',
} as const;

export type PublicationRequirementKey =
  typeof PUBLICATION_REQUIREMENT_KEYS[keyof typeof PUBLICATION_REQUIREMENT_KEYS];

export interface RemediationDestination {
  step: IntakeSectionKey;
  subsection?: string;
  field?: string;
  anchor: string;
  title: string;
  categoryLabel: 'Documents' | 'School Information' | 'Leadership' | 'Admissions & Fees' | 'Facilities & Operations' | 'Policies & Disclosures';
  message?: string;
}

/**
 * Authoritative destination mappings for all publication requirements and document keys.
 */
export const REMEDIATION_REGISTRY: Record<string, RemediationDestination> = {
  // ── School Identity & Basics ──
  [PUBLICATION_REQUIREMENT_KEYS.SCHOOL_NAME]: {
    step: 'schoolProfile',
    field: 'schoolProfile.schoolName',
    anchor: 'field-school-name',
    title: 'School Official Name',
    categoryLabel: 'School Information',
    message: 'Please enter the official registered name of the school.',
  },
  'blocker-school-name': {
    step: 'schoolProfile',
    field: 'schoolProfile.schoolName',
    anchor: 'field-school-name',
    title: 'School Official Name',
    categoryLabel: 'School Information',
    message: 'Please enter the official registered name of the school.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.SCHOOL_ADDRESS]: {
    step: 'campuses',
    field: 'campuses[0].address',
    anchor: 'field-campus-address',
    title: 'Official School Address',
    categoryLabel: 'School Information',
    message: 'Please provide the complete street address for the primary campus.',
  },
  'blocker-school-address': {
    step: 'campuses',
    field: 'campuses[0].address',
    anchor: 'field-campus-address',
    title: 'Official School Address',
    categoryLabel: 'School Information',
    message: 'Please provide the complete street address for the primary campus.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.SCHOOL_PHONE]: {
    step: 'schoolProfile',
    field: 'schoolProfile.officialPhone',
    anchor: 'field-school-phone',
    title: 'School Contact Phone',
    categoryLabel: 'School Information',
    message: 'Please enter the official phone number for general inquiries.',
  },
  'blocker-school-phone': {
    step: 'schoolProfile',
    field: 'schoolProfile.officialPhone',
    anchor: 'field-school-phone',
    title: 'School Contact Phone',
    categoryLabel: 'School Information',
    message: 'Please enter the official phone number for general inquiries.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.SCHOOL_EMAIL]: {
    step: 'schoolProfile',
    field: 'schoolProfile.officialEmail',
    anchor: 'field-school-email',
    title: 'Official School Email',
    categoryLabel: 'School Information',
    message: 'Please enter the official administrative email address.',
  },
  'blocker-school-email': {
    step: 'schoolProfile',
    field: 'schoolProfile.officialEmail',
    anchor: 'field-school-email',
    title: 'Official School Email',
    categoryLabel: 'School Information',
    message: 'Please enter the official administrative email address.',
  },

  // ── Leadership ──
  [PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_NAME]: {
    step: 'leadership',
    field: 'leadership.principalName',
    anchor: 'field-principal-name',
    title: 'Principal / Head of Institution Name',
    categoryLabel: 'Leadership',
    message: 'Please provide the full name of the school principal or head of institution.',
  },
  'blocker-principal-name': {
    step: 'leadership',
    field: 'leadership.principalName',
    anchor: 'field-principal-name',
    title: 'Principal / Head of Institution Name',
    categoryLabel: 'Leadership',
    message: 'Please provide the full name of the school principal or head of institution.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.PRINCIPAL_PORTRAIT]: {
    step: 'leadership',
    field: 'leadership.principalPhoto',
    anchor: 'field-principal-portrait',
    title: 'Principal Official Portrait',
    categoryLabel: 'Leadership',
    message: 'Please upload a formal, high-resolution portrait of the Principal.',
  },
  'blocker-asset-asset-principal-photo': {
    step: 'leadership',
    field: 'leadership.principalPhoto',
    anchor: 'field-principal-portrait',
    title: 'Principal Official Portrait',
    categoryLabel: 'Leadership',
    message: 'Please upload a formal, high-resolution portrait of the Principal.',
  },

  // ── Statutory Documents (Group F in Assets & Documents) ──
  [CANONICAL_DOCUMENT_IDS.BOARD_AFFILIATION]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-affiliation',
    anchor: 'asset-row-cert-affiliation',
    title: 'Board Affiliation Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Board Affiliation Grant Letter or Extension Order.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.AFFILIATION_CERTIFICATE]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-affiliation',
    anchor: 'asset-row-cert-affiliation',
    title: 'Board Affiliation Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Board Affiliation Grant Letter or Extension Order.',
  },
  'cert-affiliation': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-affiliation',
    anchor: 'asset-row-cert-affiliation',
    title: 'Board Affiliation Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Board Affiliation Grant Letter or Extension Order.',
  },
  'doc-affiliation-cert': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-affiliation',
    anchor: 'asset-row-cert-affiliation',
    title: 'Board Affiliation Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Board Affiliation Grant Letter or Extension Order.',
  },

  [CANONICAL_DOCUMENT_IDS.SCHOOL_RECOGNITION_NOC]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-recognition',
    anchor: 'asset-row-cert-recognition',
    title: 'State Recognition Certificate / Government NOC',
    categoryLabel: 'Documents',
    message: 'Please upload the State Education Department NOC or formal recognition order.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.RECOGNITION_NOC]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-recognition',
    anchor: 'asset-row-cert-recognition',
    title: 'State Recognition Certificate / Government NOC',
    categoryLabel: 'Documents',
    message: 'Please upload the State Education Department NOC or formal recognition order.',
  },
  'cert-recognition': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-recognition',
    anchor: 'asset-row-cert-recognition',
    title: 'State Recognition Certificate / Government NOC',
    categoryLabel: 'Documents',
    message: 'Please upload the State Education Department NOC or formal recognition order.',
  },
  'doc-recognition-noc': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-recognition',
    anchor: 'asset-row-cert-recognition',
    title: 'State Recognition Certificate / Government NOC',
    categoryLabel: 'Documents',
    message: 'Please upload the State Education Department NOC or formal recognition order.',
  },

  [CANONICAL_DOCUMENT_IDS.SOCIETY_TRUST_REGISTRATION]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-registration',
    anchor: 'asset-row-cert-registration',
    title: 'Society / Trust Registration Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Society / Trust Registration Certificate or mark as Not Applicable.',
  },
  'cert-registration': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-registration',
    anchor: 'asset-row-cert-registration',
    title: 'Society / Trust Registration Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Society / Trust Registration Certificate or mark as Not Applicable.',
  },
  'doc-cert-registration': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-registration',
    anchor: 'asset-row-cert-registration',
    title: 'Society / Trust Registration Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the Society / Trust Registration Certificate or mark as Not Applicable.',
  },

  [CANONICAL_DOCUMENT_IDS.BUILDING_FIRE_SAFETY]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },
  [PUBLICATION_REQUIREMENT_KEYS.FIRE_SAFETY_CERTIFICATE]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },
  'cert-safety': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },
  'doc-cert-safety': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },
  'doc-fire-safety': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },
  'doc-building-safety': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-safety',
    anchor: 'asset-row-cert-safety',
    title: 'Building Safety & Fire Safety Certificate',
    categoryLabel: 'Documents',
    message: 'Please upload the municipal building safety or fire safety certificate.',
  },

  [CANONICAL_DOCUMENT_IDS.MANDATORY_PUBLIC_DISCLOSURE]: {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-mandatory-disclosure',
    anchor: 'asset-row-cert-mandatory-disclosure',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    categoryLabel: 'Documents',
    message: 'Please upload the mandatory disclosure document prescribed by the board.',
  },
  'cert-mandatory-disclosure': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-mandatory-disclosure',
    anchor: 'asset-row-cert-mandatory-disclosure',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    categoryLabel: 'Documents',
    message: 'Please upload the mandatory disclosure document prescribed by the board.',
  },
  'doc-cert-mandatory-disclosure': {
    step: 'assetChecklist',
    subsection: 'certificates',
    field: 'cert-mandatory-disclosure',
    anchor: 'asset-row-cert-mandatory-disclosure',
    title: 'Mandatory Public Disclosure Document (Appendix IX)',
    categoryLabel: 'Documents',
    message: 'Please upload the mandatory disclosure document prescribed by the board.',
  },

  // ── Fee Structure (Academic) ──
  [CANONICAL_DOCUMENT_IDS.FEE_SCHEDULE]: {
    step: 'feesConfiguration',
    subsection: 'commonFees',
    field: 'feesConfiguration.commonFees',
    anchor: 'section-fees-structure',
    title: 'Fee Structure & Payment Schedule',
    categoryLabel: 'Admissions & Fees',
    message: 'Configure the fee structure for parents to see on the school website.',
  },
  'doc-fee-structure': {
    step: 'feesConfiguration',
    subsection: 'commonFees',
    field: 'feesConfiguration.commonFees',
    anchor: 'section-fees-structure',
    title: 'Fee Structure & Payment Schedule',
    categoryLabel: 'Admissions & Fees',
    message: 'Configure the fee structure for parents to see on the school website.',
  },
};

/**
 * Resolves a requirement key or blocker ID to its canonical destination.
 */
export function resolveRemediationDestination(keyOrId: string): RemediationDestination {
  if (REMEDIATION_REGISTRY[keyOrId]) {
    return REMEDIATION_REGISTRY[keyOrId];
  }

  // Handle blocker prefix patterns
  const strippedId = keyOrId.replace(/^blocker-(doc-|asset-)?/, '');
  if (REMEDIATION_REGISTRY[strippedId]) {
    return REMEDIATION_REGISTRY[strippedId];
  }

  // Fallback destination
  return {
    step: 'assetChecklist',
    anchor: `asset-row-${keyOrId}`,
    title: keyOrId,
    categoryLabel: 'Documents',
  };
}

/**
 * Client-side execution helper:
 * 1. Switches to the target onboarding step
 * 2. Reveals subsection/category if needed
 * 3. Smooth-scrolls to the exact target anchor element
 * 4. Focuses the relevant input / action button
 * 5. Applies temporary pulsing visual highlight with auto-removal
 */
export function executeRemediationNavigation(
  destination: RemediationDestination,
  onNavigate: (sectionKey: IntakeSectionKey) => void
): void {
  if (typeof window === 'undefined') return;

  // 1. Navigate to the step
  onNavigate(destination.step);

  // 2. Dispatch event for child components (e.g. Asset Checklist expanding Group F)
  window.dispatchEvent(
    new CustomEvent('ekaagra:remediation-navigate', {
      detail: { destination },
    })
  );

  // 3. Wait for DOM mounting and execute scroll + focus + highlight
  const startTime = Date.now();
  const maxWaitMs = 2500;

  const tryLocateAndHighlight = () => {
    const el = document.getElementById(destination.anchor) ||
      document.querySelector(`[data-anchor="${destination.anchor}"]`) ||
      document.querySelector(`[data-checklist-item-id="${destination.field || destination.anchor}"]`);

    if (el) {
      // Scroll into view comfortably centered
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus primary input or button inside target element
      const focusable = el.querySelector<HTMLElement>(
        'input:not([type="hidden"]), select, textarea, button:not([disabled])'
      );
      if (focusable) {
        setTimeout(() => {
          try {
            focusable.focus({ preventScroll: true });
          } catch {
            // Ignored
          }
        }, 300);
      }

      // Add temporary highlight class
      el.classList.add('remediation-highlight-pulse');

      // Create or ensure informational toast/banner
      const cleanupHighlight = () => {
        el.classList.remove('remediation-highlight-pulse');
        window.removeEventListener('click', cleanupHighlight);
        window.removeEventListener('keydown', cleanupHighlight);
      };

      // Remove highlight after 4.5 seconds or on user interaction
      setTimeout(cleanupHighlight, 4500);
      window.addEventListener('click', cleanupHighlight, { once: true });
      window.addEventListener('keydown', cleanupHighlight, { once: true });
      return;
    }

    if (Date.now() - startTime < maxWaitMs) {
      requestAnimationFrame(tryLocateAndHighlight);
    }
  };

  // Give React state transition one tick to unmount previous and mount new view
  setTimeout(() => {
    requestAnimationFrame(tryLocateAndHighlight);
  }, 100);
}
