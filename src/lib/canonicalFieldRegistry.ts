/**
 * ==============================================================================
 * CANONICAL FIELD REGISTRY & CHANGE REQUEST ENGINE
 * File: src/lib/canonicalFieldRegistry.ts
 * ==============================================================================
 *
 * Single Authoritative Source of Truth for:
 * - Deterministic Canonical Field Keys (e.g. identity.year_established)
 * - Bidirectional Aliasing between Admin Reviews and Onboarding Form Inputs
 * - Pure Function Pending Change Count Calculation
 * - Stale Field Fault-Tolerance (Prevents UI crashes on schema drift)
 * - Deterministic DOM Anchors and Deep Linking
 */

import type { SchoolIntakeChangeRequest, UniversalIntakeData, ChangeRequestType } from './types';

export interface CanonicalFieldDefinition {
  canonicalKey: string; // e.g. 'identity.year_established'
  pageKey: string; // Normalized page key: 'identity' | 'campuses' | etc.
  intakeSectionKey: string; // Internal INTAKE_SECTIONS key: 'schoolProfile' | 'campuses' | etc.
  pageTitle: string; // e.g. 'School Information → Identity'
  sectionKey: string; // Form section key: 'institutional_identification'
  sectionTitle: string; // e.g. 'Institutional Identification & Legal Governance'
  fieldKey: string; // e.g. 'year_established'
  fieldLabel: string; // e.g. 'Year of Establishment'
  domAnchor: string; // e.g. 'field-container-yearOfEstablishment'
  aliases: string[]; // Variations: ['schoolProfile.yearOfEstablishment', 'yearOfEstablishment', 'establishedYear']
  getter: (payload: UniversalIntakeData) => any;
  isStale?: boolean;
}

/**
 * Standard Normalized Page Key Mappings
 */
export const PAGE_KEY_MAP: Record<string, { intakeSectionKey: string; canonicalPageKey: string; label: string }> = {
  identity: { intakeSectionKey: 'schoolProfile', canonicalPageKey: 'identity', label: 'School Information → Identity' },
  schoolProfile: { intakeSectionKey: 'schoolProfile', canonicalPageKey: 'identity', label: 'School Information → Identity' },
  campuses: { intakeSectionKey: 'campuses', canonicalPageKey: 'campuses', label: 'School Information → Campuses' },
  campusFacilities: { intakeSectionKey: 'campuses', canonicalPageKey: 'campuses', label: 'School Information → Campuses' },
  leadership: { intakeSectionKey: 'leadership', canonicalPageKey: 'leadership', label: 'School Information → Leadership' },
  brand_identity: { intakeSectionKey: 'brandingDesign', canonicalPageKey: 'brand_identity', label: 'School Information → Brand Identity' },
  brandingDesign: { intakeSectionKey: 'brandingDesign', canonicalPageKey: 'brand_identity', label: 'School Information → Brand Identity' },
  branding: { intakeSectionKey: 'brandingDesign', canonicalPageKey: 'brand_identity', label: 'School Information → Brand Identity' },
  media: { intakeSectionKey: 'brandingDesign', canonicalPageKey: 'brand_identity', label: 'School Information → Brand Identity' },
  story_philosophy: { intakeSectionKey: 'schoolContent', canonicalPageKey: 'story_philosophy', label: 'School Information → Story & Philosophy' },
  schoolContent: { intakeSectionKey: 'schoolContent', canonicalPageKey: 'story_philosophy', label: 'School Information → Story & Philosophy' },
  academics: { intakeSectionKey: 'institutionStructure', canonicalPageKey: 'academics', label: 'School Information → Academics' },
  institutionStructure: { intakeSectionKey: 'institutionStructure', canonicalPageKey: 'academics', label: 'School Information → Academics' },
  academicScope: { intakeSectionKey: 'institutionStructure', canonicalPageKey: 'academics', label: 'School Information → Academics' },
  faculty: { intakeSectionKey: 'staffFaculty', canonicalPageKey: 'faculty', label: 'School Information → Faculty' },
  staffFaculty: { intakeSectionKey: 'staffFaculty', canonicalPageKey: 'faculty', label: 'School Information → Faculty' },
  students: { intakeSectionKey: 'studentConfig', canonicalPageKey: 'students', label: 'School Information → Students' },
  studentConfig: { intakeSectionKey: 'studentConfig', canonicalPageKey: 'students', label: 'School Information → Students' },
  facilities: { intakeSectionKey: 'facilities', canonicalPageKey: 'facilities', label: 'Campus & Student Facilities' },
  transport: { intakeSectionKey: 'transport', canonicalPageKey: 'transport', label: 'Operations → Transport Fleet' },
  library: { intakeSectionKey: 'library', canonicalPageKey: 'library', label: 'Academic Resources → Library' },
  hostel: { intakeSectionKey: 'hostel', canonicalPageKey: 'hostel', label: 'Residential Infrastructure → Hostel' },
  curriculum: { intakeSectionKey: 'curriculum', canonicalPageKey: 'curriculum', label: 'Academics → Curriculum & Books' },
  admissions: { intakeSectionKey: 'admissions', canonicalPageKey: 'admissions', label: 'Student Enrollment → Admissions' },
  admission: { intakeSectionKey: 'admissions', canonicalPageKey: 'admissions', label: 'Student Enrollment → Admissions' },
  fee_structure: { intakeSectionKey: 'feesConfiguration', canonicalPageKey: 'fee_structure', label: 'Operations & Finance → Fee Structure' },
  feesConfiguration: { intakeSectionKey: 'feesConfiguration', canonicalPageKey: 'fee_structure', label: 'Operations & Finance → Fee Structure' },
  fees: { intakeSectionKey: 'feesConfiguration', canonicalPageKey: 'fee_structure', label: 'Operations & Finance → Fee Structure' },
  communication: { intakeSectionKey: 'communication', canonicalPageKey: 'communication', label: 'Digital Engagement → Communication' },
  mobileApp: { intakeSectionKey: 'mobileApp', canonicalPageKey: 'mobileApp', label: 'Software Requirements → Mobile App' },
  portalRequirements: { intakeSectionKey: 'portalRequirements', canonicalPageKey: 'portalRequirements', label: 'Software Requirements → Portals' },
  mediaAssets: { intakeSectionKey: 'mediaAssets', canonicalPageKey: 'mediaAssets', label: 'Assets & Verification → Media' },
  assetChecklist: { intakeSectionKey: 'assetChecklist', canonicalPageKey: 'assetChecklist', label: 'Assets & Verification → Checklist' },
  legalPolicies: { intakeSectionKey: 'legalPolicies', canonicalPageKey: 'legalPolicies', label: 'Legal Policies & Digital Governance' },
};

/**
 * Authoritative Canonical Field Catalog
 */
export const CANONICAL_FIELD_CATALOG: CanonicalFieldDefinition[] = [
  // ─── 1. IDENTITY & GOVERNANCE ─────────────────────────────────────────────
  {
    canonicalKey: 'identity.official_school_name',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'official_school_name',
    fieldLabel: 'Official School Name',
    domAnchor: 'field-container-schoolName',
    aliases: ['schoolProfile.schoolName', 'schoolName', 'school_name', 'official_school_name'],
    getter: (p) => p.schoolProfile?.schoolName,
  },
  {
    canonicalKey: 'identity.institution_display_name',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'institution_display_name',
    fieldLabel: 'Institution Display Name',
    domAnchor: 'field-container-displayName',
    aliases: ['schoolProfile.displayName', 'displayName', 'display_name', 'institution_display_name'],
    getter: (p) => p.schoolProfile?.displayName,
  },
  {
    canonicalKey: 'identity.udise_code',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'udise_code',
    fieldLabel: 'UDISE+ School Code',
    domAnchor: 'field-container-udiseCode',
    aliases: ['schoolProfile.udiseCode', 'udiseCode', 'udise_code'],
    getter: (p) => p.schoolProfile?.udiseCode,
  },
  {
    canonicalKey: 'identity.year_established',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'year_established',
    fieldLabel: 'Year of Establishment',
    domAnchor: 'field-container-yearOfEstablishment',
    aliases: [
      'schoolProfile.yearOfEstablishment',
      'yearOfEstablishment',
      'year_established',
      'establishedYear',
      'established_year',
      'establishmentYear',
      'schoolProfile.establishedYear',
    ],
    getter: (p) => p.schoolProfile?.yearOfEstablishment || p.schoolProfile?.establishmentYear,
  },
  {
    canonicalKey: 'identity.management_type',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'management_type',
    fieldLabel: 'Management Type',
    domAnchor: 'field-container-managementType',
    aliases: ['schoolProfile.managementType', 'managementType', 'management_type'],
    getter: (p) => p.schoolProfile?.managementType,
  },
  {
    canonicalKey: 'identity.managing_society',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'managing_society',
    fieldLabel: 'Managing Society / Trust / Company',
    domAnchor: 'field-container-legalInstitutionName',
    aliases: [
      'schoolProfile.legalInstitutionName',
      'legalInstitutionName',
      'managingSociety',
      'managing_society',
      'trust_name',
    ],
    getter: (p) => p.schoolProfile?.legalInstitutionName,
  },
  {
    canonicalKey: 'identity.school_type',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'institutional_identification',
    sectionTitle: 'Institutional Identification & Legal Governance',
    fieldKey: 'school_type',
    fieldLabel: 'School Category / Type',
    domAnchor: 'field-container-schoolType',
    aliases: ['schoolProfile.schoolType', 'schoolType', 'school_type'],
    getter: (p) => p.schoolProfile?.schoolType,
  },

  // ─── 2. BOARD & AFFILIATION ───────────────────────────────────────────────
  {
    canonicalKey: 'affiliation.affiliation_board',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'board_affiliation',
    sectionTitle: 'Board Affiliation & Academic Classification',
    fieldKey: 'affiliation_board',
    fieldLabel: 'Affiliation Board / Body',
    domAnchor: 'field-container-board',
    aliases: ['schoolProfile.board', 'board', 'affiliationBoard', 'affiliation_board'],
    getter: (p) => p.schoolProfile?.board,
  },
  {
    canonicalKey: 'affiliation.cbse_school_code',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'board_affiliation',
    sectionTitle: 'Board Affiliation & Academic Classification',
    fieldKey: 'cbse_school_code',
    fieldLabel: 'CBSE School Code / Number',
    domAnchor: 'field-container-schoolCode',
    aliases: ['schoolProfile.schoolCode', 'schoolCode', 'cbse_school_code', 'school_code'],
    getter: (p) => p.schoolProfile?.schoolCode,
  },
  {
    canonicalKey: 'affiliation.cbse_affiliation_number',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'board_affiliation',
    sectionTitle: 'Board Affiliation & Academic Classification',
    fieldKey: 'cbse_affiliation_number',
    fieldLabel: 'Affiliation / Registration Number',
    domAnchor: 'field-container-affiliationNumber',
    aliases: [
      'schoolProfile.affiliationNumber',
      'affiliationNumber',
      'cbse_affiliation_number',
      'affiliation_number',
    ],
    getter: (p) => p.schoolProfile?.affiliationNumber,
  },

  // ─── 3. OFFICIAL CONTACTS ─────────────────────────────────────────────────
  {
    canonicalKey: 'identity.official_phone',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'official_contacts',
    sectionTitle: 'Official Institutional Contacts',
    fieldKey: 'official_phone',
    fieldLabel: 'Official Phone Number / Helpline',
    domAnchor: 'field-container-officialPhone',
    aliases: ['schoolProfile.officialPhone', 'officialPhone', 'official_phone', 'primaryPhone'],
    getter: (p) => p.schoolProfile?.officialPhone || (p.schoolProfile as any)?.primaryPhone,
  },
  {
    canonicalKey: 'identity.official_email',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'official_contacts',
    sectionTitle: 'Official Institutional Contacts',
    fieldKey: 'official_email',
    fieldLabel: 'Official School Email Address',
    domAnchor: 'field-container-officialEmail',
    aliases: ['schoolProfile.officialEmail', 'officialEmail', 'official_email'],
    getter: (p) => p.schoolProfile?.officialEmail,
  },
  {
    canonicalKey: 'identity.whatsapp_number',
    pageKey: 'identity',
    intakeSectionKey: 'schoolProfile',
    pageTitle: 'School Information → Identity',
    sectionKey: 'official_contacts',
    sectionTitle: 'Official Institutional Contacts',
    fieldKey: 'whatsapp_number',
    fieldLabel: 'Official WhatsApp Helpline',
    domAnchor: 'field-container-whatsappNumber',
    aliases: ['schoolProfile.whatsappNumber', 'whatsappNumber', 'whatsapp_number'],
    getter: (p) => p.schoolProfile?.whatsappNumber,
  },

  // ─── 4. CAMPUS DETAILS ────────────────────────────────────────────────────
  {
    canonicalKey: 'campuses.main_campus_name',
    pageKey: 'campuses',
    intakeSectionKey: 'campuses',
    pageTitle: 'School Information → Campuses',
    sectionKey: 'campus_branches',
    sectionTitle: 'Main Campus Details',
    fieldKey: 'main_campus_name',
    fieldLabel: 'Main Campus Name',
    domAnchor: 'field-container-mainCampusName',
    aliases: ['campuses.mainCampusName', 'mainCampusName', 'main_campus_name'],
    getter: (p) => p.campuses?.[0]?.name,
  },
  {
    canonicalKey: 'campuses.main_campus_address',
    pageKey: 'campuses',
    intakeSectionKey: 'campuses',
    pageTitle: 'School Information → Campuses',
    sectionKey: 'campus_branches',
    sectionTitle: 'Main Campus Details',
    fieldKey: 'main_campus_address',
    fieldLabel: 'Main Campus Full Postal Address',
    domAnchor: 'field-container-mainCampusAddress',
    aliases: ['campuses.mainCampusAddress', 'mainCampusAddress', 'main_campus_address', 'address'],
    getter: (p) => p.campuses?.[0]?.address,
  },
  {
    canonicalKey: 'campuses.main_campus_city',
    pageKey: 'campuses',
    intakeSectionKey: 'campuses',
    pageTitle: 'School Information → Campuses',
    sectionKey: 'campus_branches',
    sectionTitle: 'Main Campus Details',
    fieldKey: 'main_campus_city',
    fieldLabel: 'City',
    domAnchor: 'field-container-mainCampusCity',
    aliases: ['campuses.mainCampusCity', 'mainCampusCity', 'main_campus_city', 'city'],
    getter: (p) => p.campuses?.[0]?.city,
  },
  {
    canonicalKey: 'campuses.main_campus_pin',
    pageKey: 'campuses',
    intakeSectionKey: 'campuses',
    pageTitle: 'School Information → Campuses',
    sectionKey: 'campus_branches',
    sectionTitle: 'Main Campus Details',
    fieldKey: 'main_campus_pin',
    fieldLabel: 'Postal PIN Code',
    domAnchor: 'field-container-mainCampusPin',
    aliases: ['campuses.mainCampusPin', 'mainCampusPin', 'main_campus_pin', 'pincode', 'pin'],
    getter: (p) => p.campuses?.[0]?.pin || (p.campuses?.[0] as any)?.pincode,
  },

  // ─── 5. LEADERSHIP ────────────────────────────────────────────────────────
  {
    canonicalKey: 'leadership.principal_name',
    pageKey: 'leadership',
    intakeSectionKey: 'leadership',
    pageTitle: 'School Information → Leadership',
    sectionKey: 'principal_leadership',
    sectionTitle: 'Principal & Executive Leadership',
    fieldKey: 'principal_name',
    fieldLabel: 'Principal / Head of Institution Name',
    domAnchor: 'field-container-principalName',
    aliases: ['leadership.principalName', 'principalName', 'principal_name'],
    getter: (p) => p.leadership?.principalName,
  },
  {
    canonicalKey: 'leadership.principal_message',
    pageKey: 'leadership',
    intakeSectionKey: 'leadership',
    pageTitle: 'School Information → Leadership',
    sectionKey: 'principal_leadership',
    sectionTitle: 'Principal & Executive Leadership',
    fieldKey: 'principal_message',
    fieldLabel: "Principal's Desk Message",
    domAnchor: 'field-container-principalMessage',
    aliases: [
      'leadership.principalMessage',
      'principalMessage',
      'principal_message',
      'websiteContent.principalMessage',
    ],
    getter: (p) => p.leadership?.principalMessage,
  },

  // ─── 6. BRAND IDENTITY ───────────────────────────────────────────────────
  {
    canonicalKey: 'brand_identity.primary_logo',
    pageKey: 'brand_identity',
    intakeSectionKey: 'brandingDesign',
    pageTitle: 'School Information → Brand Identity',
    sectionKey: 'visual_identity',
    sectionTitle: 'Logos & Brand Colors',
    fieldKey: 'primary_logo',
    fieldLabel: 'Primary School Crest / Logo',
    domAnchor: 'field-container-logoUrl',
    aliases: ['brandingDesign.logoUrl', 'logoUrl', 'primary_logo', 'logo'],
    getter: (p) => (p as any).branding?.logoUrl || p.brandingDesign?.logoUrl,
  },

  // ─── 7. STORY & PHILOSOPHY ────────────────────────────────────────────────
  {
    canonicalKey: 'story_philosophy.about_school',
    pageKey: 'story_philosophy',
    intakeSectionKey: 'schoolContent',
    pageTitle: 'School Information → Story & Philosophy',
    sectionKey: 'institutional_narrative',
    sectionTitle: 'School Story & History',
    fieldKey: 'about_school',
    fieldLabel: 'About School Overview',
    domAnchor: 'field-container-aboutSchool',
    aliases: ['schoolContent.aboutSchool', 'aboutSchool', 'about_school', 'websiteContent.aboutSchool'],
    getter: (p) => p.schoolContent?.aboutSchool,
  },

  // ─── 8. ACADEMICS & CURRICULUM ───────────────────────────────────────────
  {
    canonicalKey: 'academics.classes_offered',
    pageKey: 'academics',
    intakeSectionKey: 'institutionStructure',
    pageTitle: 'School Information → Academics',
    sectionKey: 'class_hierarchy',
    sectionTitle: 'Active Classes Offered',
    fieldKey: 'classes_offered',
    fieldLabel: 'Active Classes Offered',
    domAnchor: 'field-container-classesOffered',
    aliases: [
      'institutionStructure.classesOffered',
      'classesOffered',
      'academicScope.classesOffered',
      'classes_offered',
    ],
    getter: (p) => p.institutionStructure?.classes || p.campuses?.[0]?.classesOffered,
  },

  // ─── 9. FACULTY & STAFF ──────────────────────────────────────────────────
  {
    canonicalKey: 'faculty.staff_count',
    pageKey: 'faculty',
    intakeSectionKey: 'staffFaculty',
    pageTitle: 'School Information → Faculty',
    sectionKey: 'faculty_configuration',
    sectionTitle: 'Staff & Faculty Statistics',
    fieldKey: 'staff_count',
    fieldLabel: 'Total Teaching Faculty Count',
    domAnchor: 'field-container-totalTeachers',
    aliases: ['staffFaculty.totalTeachers', 'totalTeachers', 'staff_count', 'faculty_count'],
    getter: (p) => (p.staffFaculty as any)?.totalTeachers,
  },

  // ─── 10. LEGAL POLICIES & DIGITAL GOVERNANCE ─────────────────────────────
  {
    canonicalKey: 'legalPolicies.privacy-policy',
    pageKey: 'legalPolicies',
    intakeSectionKey: 'legalPolicies',
    pageTitle: 'Legal Policies & Digital Governance',
    sectionKey: 'legal_policies',
    sectionTitle: 'Legal Policies & Statutory Governance',
    fieldKey: 'pol-privacy',
    fieldLabel: 'Website & Student Data Privacy Policy',
    domAnchor: 'field-legal-privacy-policy',
    aliases: [
      'pol-privacy',
      'privacy-policy',
      'legalPolicies.privacy-policy',
      'legalPolicies.pol-privacy',
      'assetChecklist.pol-privacy',
      'mediaAssets.pol-privacy',
    ],
    getter: (p) =>
      p.legalPolicies?.policies?.['privacy-policy']?.officialDocumentUrl ||
      p.legalPolicies?.policies?.['privacy-policy']?.textContent,
  },
  {
    canonicalKey: 'legalPolicies.terms-and-conditions',
    pageKey: 'legalPolicies',
    intakeSectionKey: 'legalPolicies',
    pageTitle: 'Legal Policies & Digital Governance',
    sectionKey: 'legal_policies',
    sectionTitle: 'Legal Policies & Statutory Governance',
    fieldKey: 'pol-terms',
    fieldLabel: 'Terms of Website Usage & Portal Access',
    domAnchor: 'field-legal-terms-and-conditions',
    aliases: [
      'pol-terms',
      'terms-and-conditions',
      'legalPolicies.terms-and-conditions',
      'legalPolicies.pol-terms',
      'assetChecklist.pol-terms',
      'mediaAssets.pol-terms',
    ],
    getter: (p) =>
      p.legalPolicies?.policies?.['terms-and-conditions']?.officialDocumentUrl ||
      p.legalPolicies?.policies?.['terms-and-conditions']?.textContent,
  },
  {
    canonicalKey: 'legalPolicies.fee-refund',
    pageKey: 'legalPolicies',
    intakeSectionKey: 'legalPolicies',
    pageTitle: 'Legal Policies & Digital Governance',
    sectionKey: 'legal_policies',
    sectionTitle: 'Legal Policies & Statutory Governance',
    fieldKey: 'pol-refund',
    fieldLabel: 'Fee Refund & Cancellation Policy',
    domAnchor: 'field-legal-fee-refund',
    aliases: [
      'pol-refund',
      'fee-refund',
      'legalPolicies.fee-refund',
      'legalPolicies.pol-refund',
      'assetChecklist.pol-refund',
      'mediaAssets.pol-refund',
    ],
    getter: (p) =>
      p.legalPolicies?.policies?.['fee-refund']?.officialDocumentUrl ||
      p.legalPolicies?.policies?.['fee-refund']?.textContent,
  },
  {
    canonicalKey: 'legalPolicies.child-safety',
    pageKey: 'legalPolicies',
    intakeSectionKey: 'legalPolicies',
    pageTitle: 'Legal Policies & Digital Governance',
    sectionKey: 'legal_policies',
    sectionTitle: 'Legal Policies & Statutory Governance',
    fieldKey: 'pol-child-safety',
    fieldLabel: 'Child Protection & Safeguarding Policy (POCSO)',
    domAnchor: 'field-legal-child-safety',
    aliases: [
      'pol-child-safety',
      'child-safety',
      'legalPolicies.child-safety',
      'legalPolicies.pol-child-safety',
      'assetChecklist.pol-child-safety',
      'mediaAssets.pol-child-safety',
    ],
    getter: (p) =>
      p.legalPolicies?.policies?.['child-safety']?.officialDocumentUrl ||
      p.legalPolicies?.policies?.['child-safety']?.textContent,
  },
];

/**
 * Statuses that represent ACTIVE / PENDING change requests requiring school attention.
 * These are counted in the sidebar badges and displayed in page summaries.
 */
export const ACTIVE_CHANGE_REQUEST_STATUSES = new Set([
  'pending',
  'changes_requested',
  'needs_revision',
  'open',
  'waiting_for_school',
]);

/**
 * Statuses where school has submitted their update and it is awaiting admin review.
 * These are NOT counted in the school user's pending badge count, but are highlighted as
 * "Updated — Awaiting Admin Review" in the UI.
 */
export const SCHOOL_UPDATED_STATUSES = new Set([
  'school_updated',
  'ready_for_review',
]);

/**
 * Statuses where the change request has been closed / approved / rejected.
 */
export const RESOLVED_CHANGE_REQUEST_STATUSES = new Set([
  'approved',
  'resolved',
  'cancelled',
  'rejected',
  'waived',
]);

/**
 * Check whether a change request is actively pending school user correction.
 */
export function isRequestActivePending(cr?: SchoolIntakeChangeRequest | null): boolean {
  if (!cr) return false;
  return ACTIVE_CHANGE_REQUEST_STATUSES.has((cr.status || '').toLowerCase());
}

/**
 * Check whether a change request has been updated by the school and is awaiting admin review.
 */
export function isRequestAwaitingAdminReview(cr?: SchoolIntakeChangeRequest | null): boolean {
  if (!cr) return false;
  return SCHOOL_UPDATED_STATUSES.has((cr.status || '').toLowerCase());
}

/**
 * Normalize an input section/page identifier into both canonical pageKey and intakeSectionKey.
 */
export function normalizePageKey(key?: string | null): {
  canonicalPageKey: string;
  intakeSectionKey: string;
  pageTitle: string;
} {
  if (!key) {
    return {
      canonicalPageKey: 'identity',
      intakeSectionKey: 'schoolProfile',
      pageTitle: 'School Information → Identity',
    };
  }

  const lookup = PAGE_KEY_MAP[key];
  if (lookup) {
    return {
      canonicalPageKey: lookup.canonicalPageKey,
      intakeSectionKey: lookup.intakeSectionKey,
      pageTitle: lookup.label,
    };
  }

  // Fallback if not directly in map
  return {
    canonicalPageKey: key,
    intakeSectionKey: key,
    pageTitle: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
  };
}

/**
 * Look up a canonical field definition from a canonical key, alias, or field identifier.
 * Fault-tolerant: if the field no longer exists, returns a safe fallback definition with `isStale: true`.
 * This fulfills requirement 30: "If a change request points to a field that no longer exists... do NOT crash the onboarding page."
 */
export function lookupCanonicalField(
  rawFieldKey: string,
  rawSectionKey?: string
): CanonicalFieldDefinition {
  if (!rawFieldKey && !rawSectionKey) {
    return createFallbackFieldDefinition('unknown_field', 'identity');
  }

  const cleanFieldKey = (rawFieldKey || '').trim();
  const cleanSectionKey = (rawSectionKey || '').trim();
  const lowerField = cleanFieldKey.toLowerCase();
  const leafField = lowerField.split('.').pop() || lowerField;

  // 1. Direct canonicalKey match
  const directMatch = CANONICAL_FIELD_CATALOG.find(
    (f) => f.canonicalKey.toLowerCase() === lowerField
  );
  if (directMatch) return directMatch;

  // 2. Alias match
  const aliasMatch = CANONICAL_FIELD_CATALOG.find((f) =>
    f.aliases.some((a) => a.toLowerCase() === lowerField || a.toLowerCase() === leafField)
  );
  if (aliasMatch) return aliasMatch;

  // 3. Match by fieldKey + sectionKey / pageKey
  if (cleanSectionKey) {
    const norm = normalizePageKey(cleanSectionKey);
    const sectionMatch = CANONICAL_FIELD_CATALOG.find(
      (f) =>
        (f.intakeSectionKey === norm.intakeSectionKey || f.pageKey === norm.canonicalPageKey) &&
        (f.fieldKey.toLowerCase() === leafField || f.aliases.some((a) => a.toLowerCase() === leafField))
    );
    if (sectionMatch) return sectionMatch;
  }

  // 4. Stale / Custom Field Fallback (Safe degradation)
  return createFallbackFieldDefinition(cleanFieldKey || 'unspecified_field', cleanSectionKey || 'identity');
}

/**
 * Safe fallback definition for stale or uncataloged fields.
 */
function createFallbackFieldDefinition(fieldKey: string, sectionKey: string): CanonicalFieldDefinition {
  const norm = normalizePageKey(sectionKey);
  const formattedLabel = fieldKey
    .replace(/^.*\./, '')
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return {
    canonicalKey: `${norm.canonicalPageKey}.${fieldKey}`,
    pageKey: norm.canonicalPageKey,
    intakeSectionKey: norm.intakeSectionKey,
    pageTitle: norm.pageTitle,
    sectionKey: 'general_section',
    sectionTitle: 'Form Information',
    fieldKey,
    fieldLabel: formattedLabel || 'Field Under Review',
    domAnchor: `field-container-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    aliases: [fieldKey],
    getter: () => null,
    isStale: true,
  };
}

/**
 * AUTHORITATIVE CHANGE COUNT CALCULATION
 * Fulfills Requirement 25:
 * Implement a reusable function/service: getPendingChangeCounts(projectId, changeRequests)
 *
 * Calculates active pending counts per page/tab deterministically.
 * Only counts active pending statuses: 'pending', 'changes_requested', 'needs_revision', 'open', 'waiting_for_school'.
 * Strictly EXCLUDES: 'approved', 'resolved', 'cancelled', 'rejected', and 'ready_for_review' / 'school_updated'.
 */
export function getPendingChangeCounts(
  projectIdOrRequests: string | SchoolIntakeChangeRequest[],
  optionalChangeRequests: SchoolIntakeChangeRequest[] = []
): Record<string, number> {
  const changeRequests = Array.isArray(projectIdOrRequests)
    ? projectIdOrRequests
    : optionalChangeRequests || [];
  const counts: Record<string, number> = {
    identity: 0,
    schoolProfile: 0,
    campuses: 0,
    leadership: 0,
    brand_identity: 0,
    brandingDesign: 0,
    story_philosophy: 0,
    schoolContent: 0,
    academics: 0,
    institutionStructure: 0,
    faculty: 0,
    staffFaculty: 0,
    students: 0,
    studentConfig: 0,
    facilities: 0,
    transport: 0,
    library: 0,
    hostel: 0,
    curriculum: 0,
    admission: 0,
    admissions: 0,
    fee_structure: 0,
    feesConfiguration: 0,
    communication: 0,
    mobileApp: 0,
    portalRequirements: 0,
    mediaAssets: 0,
    assetChecklist: 0,
    legalPolicies: 0,
  };

  if (!changeRequests || changeRequests.length === 0) {
    return counts;
  }

  changeRequests.forEach((cr) => {
    if (!isRequestActivePending(cr)) {
      return; // Skip resolved, approved, cancelled, and ready_for_review
    }

    const fieldDef = lookupCanonicalField(cr.field_key || cr.asset_id || '', cr.page_key || cr.section_key);
    const canonicalKey = fieldDef.pageKey;
    const intakeKey = fieldDef.intakeSectionKey;

    counts[canonicalKey] = (counts[canonicalKey] || 0) + 1;
    if (intakeKey && intakeKey !== canonicalKey) {
      counts[intakeKey] = (counts[intakeKey] || 0) + 1;
    }
  });

  return counts;
}

/**
 * Retrieve all active pending change requests for a given page/tab.
 */
export function getPagePendingChangeRequests(
  pageKeyOrSection: string,
  changeRequests: SchoolIntakeChangeRequest[] = []
): SchoolIntakeChangeRequest[] {
  if (!changeRequests || changeRequests.length === 0) return [];

  const norm = normalizePageKey(pageKeyOrSection);

  return changeRequests.filter((cr) => {
    if (!isRequestActivePending(cr)) return false;
    const fieldDef = lookupCanonicalField(cr.field_key || cr.asset_id || '', cr.page_key || cr.section_key);
    return fieldDef.pageKey === norm.canonicalPageKey || fieldDef.intakeSectionKey === norm.intakeSectionKey;
  });
}

/**
 * Retrieve any change request (active or awaiting review) for a specific field.
 */
export function getFieldChangeRequest(
  fieldKey: string,
  sectionKeyOrRequests?: string | SchoolIntakeChangeRequest[],
  optionalRequests?: SchoolIntakeChangeRequest[]
): SchoolIntakeChangeRequest | undefined {
  let sectionKey: string | undefined;
  let changeRequests: SchoolIntakeChangeRequest[] = [];

  if (Array.isArray(sectionKeyOrRequests)) {
    changeRequests = sectionKeyOrRequests;
  } else {
    sectionKey = sectionKeyOrRequests;
    changeRequests = optionalRequests || [];
  }

  if (!changeRequests || changeRequests.length === 0) return undefined;

  const targetDef = lookupCanonicalField(fieldKey, sectionKey);

  return changeRequests.find((cr) => {
    if (cr.asset_id && (cr.asset_id === fieldKey || cr.asset_id === targetDef.fieldKey)) {
      return true;
    }
    const crDef = lookupCanonicalField(cr.field_key || '', cr.page_key || cr.section_key);
    return crDef.canonicalKey === targetDef.canonicalKey || crDef.domAnchor === targetDef.domAnchor;
  });
}

/**
 * Format field values cleanly for admin review or display.
 */
export function formatFieldValue(val: any): string {
  if (val === null || val === undefined || val === '') return 'Not Provided';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) {
    if (val.length === 0) return 'None';
    if (typeof val[0] === 'object') return `${val.length} items configured`;
    return val.join(', ');
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

/**
 * Robustly resolves the operational ChangeRequestType for a change request.
 * Discovers whether a request requires a PDF upload, image replacement, URL update,
 * text correction, or specific field edit based on structured metadata and field context.
 */
export function resolveChangeRequestType(
  cr?: Partial<SchoolIntakeChangeRequest> | null
): ChangeRequestType {
  if (!cr) return 'FIELD';

  const rawType = (cr.request_type || '').toUpperCase();
  if (rawType === 'PDF') return 'PDF';
  if (rawType === 'DOCUMENT') return 'DOCUMENT';
  if (rawType === 'IMAGE') return 'IMAGE';
  if (rawType === 'URL') return 'URL';
  if (rawType === 'TEXT') return 'TEXT';
  if (rawType === 'MULTI_FIELD') return 'MULTI_FIELD';
  if (rawType === 'FIELD') return 'FIELD';

  const fieldKey = (cr.field_key || '').toLowerCase();
  const assetId = (cr.asset_id || '').toLowerCase();
  const comment = (cr.request_comment || '').toLowerCase();
  const reason = (cr.reason || '').toLowerCase();
  const text = `${comment} ${reason}`;

  // 1. Explicit text cues for PDF or document
  if (
    text.includes('upload pdf') ||
    text.includes('official pdf') ||
    text.includes('provide pdf') ||
    text.includes('pdf copy') ||
    text.includes('handbook pdf') ||
    text.includes('signed pdf') ||
    text.includes('.pdf')
  ) {
    return 'PDF';
  }

  // 2. Policy documents & statutory certificates
  const policyKeys = [
    'pol-privacy',
    'pol-terms',
    'pol-refund',
    'pol-child-safety',
    'privacy-policy',
    'terms-and-conditions',
    'fee-refund',
    'child-safety',
  ];
  if (policyKeys.some((pk) => fieldKey.includes(pk) || assetId.includes(pk))) {
    // If reviewer asked for text revision specifically:
    if (
      text.includes('wording') ||
      text.includes('text content') ||
      text.includes('edit text') ||
      text.includes('rewrite') ||
      text.includes('clause')
    ) {
      return 'TEXT';
    }
    // Default for policies when change is requested is official PDF
    return 'PDF';
  }

  if (
    fieldKey.startsWith('cert-') ||
    assetId.startsWith('cert-') ||
    fieldKey.startsWith('doc-') ||
    assetId.startsWith('doc-') ||
    assetId.includes('affiliation') ||
    assetId.includes('recognition') ||
    assetId.includes('fire-safety') ||
    assetId.includes('sanitation') ||
    assetId.includes('mandatory-disclosure')
  ) {
    return 'PDF';
  }

  // 3. Image cues
  if (
    text.includes('image') ||
    text.includes('photo') ||
    text.includes('resolution') ||
    text.includes('aspect ratio') ||
    text.includes('png') ||
    text.includes('jpg') ||
    fieldKey.includes('logo') ||
    assetId.includes('logo') ||
    fieldKey.includes('photo') ||
    assetId.includes('photo') ||
    fieldKey.includes('image') ||
    assetId.includes('image') ||
    fieldKey.includes('gallery') ||
    assetId.includes('gallery')
  ) {
    return 'IMAGE';
  }

  // 4. URL cues
  if (
    text.includes('url') ||
    text.includes('link') ||
    text.includes('website') ||
    fieldKey.includes('url') ||
    fieldKey.includes('website') ||
    fieldKey.includes('drive')
  ) {
    return 'URL';
  }

  return 'FIELD';
}

