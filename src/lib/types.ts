import type {
  InstitutionalIdNumberingConfig,
  InstitutionalIdPresetId,
  InstitutionalRoleType,
} from './institutionalIdNumbering';
import type { TimetableBreakItem } from './attendanceUtils';

export type {
  InstitutionalIdNumberingConfig,
  InstitutionalIdPresetId,
  InstitutionalRoleType,
  TimetableBreakItem,
};

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
  metrics?: Array<{
    label: string;
    value: string;
    subtext?: string;
  }>;
  achievements?: Array<{
    title: string;
    description: string;
    stat?: string;
    subtext?: string;
    icon?: string;
  }>;
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

// --- Website Launch & Maintenance Architecture ------------------
export interface WebsitePlan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  duration: string;
  pages: string;
  badge?: string;
  highlighted?: boolean;
  tagline: string;
  description: string;
  domainIncluded: boolean;
  domainAllowance?: number;
  domainDetails: string;
  seoIncluded: boolean;
  seoDetails?: string[];
  maintenanceIncluded: boolean;
  maintenanceNote: string;
  features: string[];
  notIncluded?: string[];
  ctaText: string;
  ctaHref: string;
  upgradeNote?: string;
}

export interface AdditionalPageTier {
  id: string;
  type: string;
  price: number;
  priceDisplay: string;
  badge?: string;
  description: string;
  examples: string[];
}

export interface MaintenanceCoverageInfo {
  tagline: string;
  definition: string;
  included: string[];
  notIncluded: string[];
  disclaimer: string;
}

export interface DomainExtensionOption {
  extension: string;
  category: string;
  suitability: string;
  description: string;
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
  | 'QUOTE_SENT'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'PROJECT_CONFIRMED'
  | 'PROJECT_ON_HOLD'
  | 'CONVERTED'
  | 'NOT_INTERESTED'
  | 'CLOSED'
  | 'LOST'
  | 'PROJECT_LOST'
  | 'CANCELLED';

export type ProjectDomain = 'BUSINESS' | 'SCHOOL';

export interface ProjectReference {
  projectId: string;
  domain: ProjectDomain;
}

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

  // Step 48: Cross-system reference & handoff status
  school_project_reference?: string | null;
  handoff_status?: 'NONE' | 'HANDOFF_PENDING' | 'HANDOFF_COMPLETED' | 'HANDOFF_FAILED' | string | null;
  handoff_at?: string | null;
  commercial_product_id?: string | null;

  // Explicit Domain Isolation
  lead_domain?: ProjectDomain;
}

export interface LeadFilter {
  query?: string;
  status?: LeadStatus | 'ALL';
  type?: LeadType | 'ALL';
  source?: LeadSource | 'ALL';
  domain?: ProjectDomain | 'ALL';
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
  businessCount?: number;
  schoolCount?: number;
}

// --- Navigation Types --------------------------------------------
export interface NavItem {
  label: string;
  href: string;
}

// --- Plan-First Website Quote Builder Types ---------------------
export interface QuoteSelectedPlan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  duration: string;
  pages: string;
  includedPagesCount: number;
  domainAllowance: number;
  seoIncluded: boolean;
  maintenanceIncluded: boolean;
}

export interface QuoteSelectedPage {
  id: string;
  name: string;
  tierId: string;
  tierName: string;
  price: number;
  priceDisplay: string;
}

export type DomainChoice =
  | 'NEW_DOMAIN'
  | 'EXISTING_DOMAIN'
  | 'DECIDE_LATER'
  | 'new'
  | 'existing'
  | 'later';

export type DomainStatus =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'PRECHECK_REQUIRED'
  | 'EXISTING'
  | 'DECIDE_LATER'
  | 'available'
  | 'unavailable'
  | 'verification_required'
  | 'not_selected';

export interface QuoteSelectedDomain {
  domain: string;
  provider?: string;
  sourceAmount?: number;
  sourceCurrency?: string;
  estimatedINR?: number;
  period?: number;
  registrationPeriod?: string;
  renewalPrice?: number;
  annualAllowance?: number;
  termAllowance?: number;
  upgradeAmount: number;
  premium?: boolean;
  isIncluded: boolean;
  recommendationBadge?: string;
  recommendationReason?: string;
  domainChoice?: DomainChoice;
  domainStatus?: DomainStatus;
  isPriceVerified?: boolean;
  tld?: string;
  yearlyPrice?: number;
  currency?: string;
}

export interface QuoteOrganizationDetails {
  name: string;
  type: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  requirements?: string;
  preferredLanguage?: string;
}

export interface QuoteContactDetails {
  fullName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  designation?: string;
  preferredContactMethod?: string;
}

export interface QuoteTotals {
  planPrice: number;
  additionalPagesTotal: number;
  domainUpgrade: number;
  estimatedTotal: number;
}

export interface StructuredQuoteRequest {
  plan: QuoteSelectedPlan;
  includedPages: string[];
  additionalPages: QuoteSelectedPage[];
  domain: QuoteSelectedDomain | null;
  organization: QuoteOrganizationDetails;
  contact: QuoteContactDetails;
  totals: QuoteTotals;
}

// --- School Solutions & Quote Types -----------------------------
export interface SchoolQuoteSchoolDetails {
  schoolName: string;
  schoolType: string;
  board: string;
  city: string;
  state: string;
  approximateStudents: string;
  currentWebsite?: string;
  existingErp?: string;
  currentSoftware?: string;
  requirements?: string;
  preferredLanguage?: string;
}

export interface SchoolQuoteContactDetails {
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  whatsapp?: string;
  preferredContactMethod?: string;
}


export interface SchoolDomainSelection {
  domainChoice: DomainChoice;
  preferredDomain: string | null;
  domainStatus: DomainStatus;
  domainPrice: number | null;
  domainAllowance: number;
  domainDifference: number;
  isPriceVerified: boolean;
  registrationPeriod?: string;
  notes?: string;
}

export interface SchoolQuoteRequest {
  productId: 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete';
  studentTierId?: 'up-to-300' | '301-700' | '701-1500' | '1501-3000' | '3000-plus';
  selectedAddonIds: string[];
  domain: QuoteSelectedDomain | null;
  domainSelection?: SchoolDomainSelection;
  school: SchoolQuoteSchoolDetails;
  contact: SchoolQuoteContactDetails;
}

// --- STEP 48: School Project & Universal Intake 2.0 Types ------------------

export type SchoolProjectStatus =
  | 'draft'
  | 'onboarding_invited'
  | 'onboarding_in_progress'
  | 'submitted'
  | 'under_review'
  | 'changes_requested'
  | 'resubmitted'
  | 'approved'
  | 'handoff_ready'
  | 'handed_off'
  | 'cancelled'
  | 'archived';

export type SchoolMediaStatus =
  | 'not_started'
  | 'package_downloaded'
  | 'package_in_progress'
  | 'package_submitted'
  | 'under_review'
  | 'changes_requested'
  | 'approved';

export type CustomFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'single_choice'
  | 'multiple_choice'
  | 'url'
  | 'email'
  | 'phone';

export type IntakeChangeRequestStatus =
  | 'open'
  | 'waiting_for_school'
  | 'ready_for_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'resolved'
  | 'waived';

export type FieldReviewStatus = 'needs_review' | 'verified' | 'changes_requested' | 'approved';
export type MediaReviewStatus = 'pending_review' | 'approved' | 'changes_requested' | 'replaced' | 'rejected';

export interface FieldReviewItem {
  sectionKey: string;
  fieldKey: string;
  status: FieldReviewStatus;
  notes?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface MediaReviewItem {
  assetId: string;
  status: MediaReviewStatus;
  notes?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface SchoolReviewMetadata {
  fieldReviews?: Record<string, FieldReviewItem>;
  mediaReviews?: Record<string, MediaReviewItem>;
  finalApproval?: {
    approvedAt: string;
    approvedBy: string;
    notes?: string;
    specificationHash?: string;
  };
}

export interface SchoolProject {
  id: string;
  project_number: string; // SCH-YYYY-XXXX
  domain?: 'SCHOOL';
  source?: 'SCHOOL_ONBOARDING' | 'ADMIN_SCHOOL_INTAKE' | string;
  lead_reference: string; // LEAD-YYYY-XXXX or UUID
  source_system: string;  // 'EKAAGRA_WEBSITE'
  school_name: string;
  product_id: 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete';
  student_tier_id?: string | null;
  status: SchoolProjectStatus;
  media_status: SchoolMediaStatus;
  completeness_percentage: number;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  primary_contact_designation?: string | null;
  city?: string | null;
  state?: string | null;
  domain_requirement?: string | null;
  commercial_summary: Record<string, unknown>;
  metadata: Record<string, unknown> & SchoolReviewMetadata;
  assigned_reviewer_id?: string | null;
  assigned_reviewer_name?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  handoff_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolOnboardingInvitation {
  id: string;
  school_project_id: string;
  invitation_code: string; // ONB-YYYY-XXXX
  token_hash: string;
  expires_at: string;
  is_revoked: boolean;
  revoked_at?: string | null;
  revocation_reason?: string | null;
  redeemed_at?: string | null;
  redeemed_by_email?: string | null;
  access_count: number;
  last_accessed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolIntakeSubmission {
  id: string;
  school_project_id: string;
  version_number: number;
  is_current: boolean;
  submitted_by_name: string;
  submitted_by_email: string;
  submitted_at: string;
  change_summary?: string | null;
  intake_payload: UniversalIntakeData;
  custom_fields_data: Record<string, unknown>;
  completeness_percentage: number;
  status: string;
  created_at: string;
}

export interface SchoolIntakeChangeRequest {
  id: string;
  school_project_id: string;
  section_key: string;
  field_key?: string | null;
  asset_id?: string | null;
  request_type?: 'correction' | 'replacement' | 'clarification' | 'content' | string;
  reason?: string | null;
  request_comment: string;
  reviewer_comment?: string | null;
  suggested_value?: string | null;
  previous_value?: string | null;
  current_value?: string | null;
  school_response?: string | null;
  school_updated_value?: string | null;
  requested_by: string;
  status: IntakeChangeRequestStatus;
  resolution_notes?: string | null;
  created_at: string;
  updated_at?: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
}

export interface SchoolProjectCustomField {
  id: string;
  school_project_id: string;
  section_key: string;
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options: string[];
  is_required: boolean;
  help_text?: string | null;
  sort_order: number;
  created_at: string;
}

export interface SchoolProjectCustomRequirement {
  id: string;
  school_project_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requested_by: string;
  status: string;
  notes?: string | null;
  review_status: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolApprovedSnapshot {
  id: string;
  school_project_id: string;
  snapshot_number: string;
  version_number: number;
  approved_by: string;
  approved_at: string;
  school_name: string;
  product_id: string;
  student_tier_id?: string | null;
  commercial_reference: string;
  snapshot_data: Record<string, unknown>;
  step41_entitlement_plan: string;
  step42_provisioning_status: string;
  created_at: string;
}

// ==============================================================================
// CANONICAL SCHOOL IDENTITY & UDISE TENANT ARCHITECTURE
// ==============================================================================

/**
 * Canonical School Tenant Identifier:
 * Represents the official 11-digit numeric UDISE Code for the institution.
 * - Exactly 11 characters
 * - Digits only (0-9)
 * - Preserves leading zeros
 * - Used as the foreign key across all school-owned tables
 */
export type SchoolId = string;

export const UDISE_REGEX = /^[0-9]{11}$/;

/**
 * Validates whether a value is a strictly valid 11-digit UDISE School ID.
 */
export function isValidSchoolId(value: unknown): value is SchoolId {
  if (typeof value !== 'string') return false;
  return UDISE_REGEX.test(value.trim());
}

/**
 * Asserts that a value is a valid 11-digit UDISE School ID, throwing if invalid.
 */
export function assertValidSchoolId(value: unknown): asserts value is SchoolId {
  if (!isValidSchoolId(value)) {
    throw new Error(
      `Invalid School ID '${String(value)}'. Expected exactly 11 numeric digits representing the school's official UDISE code.`
    );
  }
}

/**
 * Normalizes a potential school ID input (trims whitespace).
 */
export function normalizeSchoolId(value: string): string {
  return (value || '').trim();
}

export interface SchoolTenant {
  id: string;                         // Internal database UUID primary key only
  school_id: SchoolId;                // Canonical external identity: UDISE+ School Code (11 digits)
  school_code?: string | null;        // CBSE School Code / School No. (e.g. 66664)
  affiliation_number?: string | null; // CBSE Affiliation Number (e.g. 330943)
  code?: string;                      // Backward-compatible code fallback
  name: string;
  slug: string;                       // Public URL slug identifier
  legal_name?: string | null;
  display_name?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export interface SchoolMembership {
  id: string;
  school_id: SchoolId;
  user_id: string;
  role: 'super_admin' | 'school_admin' | 'principal' | 'teacher' | 'staff' | 'accountant' | 'librarian' | 'transport_incharge' | 'student' | 'guardian' | 'viewer';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export type StudentStatus =
  | 'active'
  | 'inactive'
  | 'transferred'
  | 'graduated'
  | 'suspended'
  | 'withdrawn'
  | 'archived';

export interface StudentEnrollmentRecord {
  id?: string;
  session: string;
  class_id?: string;
  section_id?: string;
  campus_id?: string;
  status: StudentStatus;
  enrolled_at?: string;
}

export interface Student {
  id: string;
  school_id: SchoolId;
  admission_number: string;
  first_name: string;
  last_name?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  campus_id?: string | null;
  roll_number?: string | null;
  dob?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  email?: string | null;
  phone?: string | null;
  academic_session?: string | null;
  enrollments?: StudentEnrollmentRecord[];
  status: StudentStatus;
  created_at?: string;
  // Extended Master Data fields
  student_id_code?: string | null;
  nationality?: string | null;
  religion?: string | null;
  mother_tongue?: string | null;
  photo_url?: string | null;
  photo_storage_path?: string | null;
  academic_year?: string | null;
  admission_date?: string | null;
  previous_school?: string | null;
  previous_class?: string | null;
  previous_admission_number?: string | null;
  blood_group?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  father_name?: string | null;
  father_phone?: string | null;
  father_email?: string | null;
  mother_name?: string | null;
  mother_phone?: string | null;
  mother_email?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
  parent_occupation?: string | null;
  relationship_with_student?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_address?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
  transport_required?: boolean | null;
  transport_route?: string | null;
  house?: string | null;
  medical_notes?: string | null;
  notes?: string | null;
  documents?: Array<{
    type: string;
    name?: string;
    url?: string;
    storagePath?: string;
    verified?: boolean;
  }> | null;
  custom_fields?: Record<string, any>;
  metadata?: Record<string, unknown> | null;
}

export interface StaffRecord {
  id: string;
  school_id: SchoolId;
  employee_code: string;
  first_name: string;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  designation?: string | null;
  department?: string | null;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  created_at?: string;
}

export interface FeeRecord {
  id: string;
  school_id: SchoolId;
  student_id: string;
  structure_id?: string | null;
  amount: number;
  due_date: string;
  paid_amount: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'waived';
  created_at?: string;
}

// --- Universal Intake Form Data Model (All 28 Sections) --------------------

export type SchoolAccommodationType = 'day_school' | 'day_boarding' | 'residential' | 'both_day_and_residential';
export type ResidentialStatus = SchoolAccommodationType;

export interface SchoolIdentityData {
  schoolName: string;
  legalInstitutionName?: string;
  displayName?: string;
  udiseCode?: string;         // Canonical UDISE+ School Code (11 digits)
  schoolCode?: string;        // CBSE School Code / School No. (e.g. 66664)
  schoolType: string;
  managementType?: string;
  yearOfEstablishment?: string;
  establishmentYear?: string; // backwards compatibility
  schoolStatus?: 'active' | 'inactive' | 'suspended' | 'archived';
  // Recognition & Affiliation
  board: string;
  affiliationNumber?: string; // CBSE Affiliation Number (e.g. 330943)
  registrationNumber?: string;
  accreditationBody?: string;
  recognitionDetails?: string;
  recognitionValidity?: string;
  // Academic Identity
  mediumOfInstruction: string[];
  genderCategory: 'co_ed' | 'boys' | 'girls';
  coEdStatus?: 'co_ed' | 'boys' | 'girls'; // backwards compatibility
  schoolCategory?: string;
  schoolLevel?: string[];
  residentialStatus?: SchoolAccommodationType;
  // Official Contact
  officialEmail: string;
  secondaryEmail?: string;
  officialPhone: string;
  phone?: string; // backwards compatibility
  secondaryPhone?: string;
  whatsappNumber?: string;
  emergencyContact?: string;
  faxNumber?: string;
  // Location
  country: string;
  countryName?: string;
  otherCountry?: string;
  state: string;
  otherStateProvince?: string;
  otherState?: string;
  district?: string;
  otherDistrict?: string;
  city: string;
  address: string;
  addressLine2?: string;
  landmark?: string;
  pin: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string;
  googleMapsLink?: string;
  // Existing Online Presence
  existingWebsiteUrl?: string;
  websiteStatus?: 'no_website' | 'redesign' | 'replace' | 'maintain' | 'outdated';
  existingDomain?: string;
  currentHostingProvider?: string;
  currentCms?: string;
  hasCurrentWebsiteAdminAccess?: boolean;
  existingSocialMediaAccounts?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
    linkedin?: string;
  };
  // Platform Identity
  slug?: string;
  platformSubdomain?: string;
  preferredPublicUrl?: string;
  shortName?: string;
  websiteName?: string;
  preferredWebsiteDomain?: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  managementContactName?: string;
  managementContactPhone?: string;
}

export type SchoolProfileData = Partial<SchoolIdentityData>;

export type CampusImageCategory =
  | 'campus_buildings'
  | 'classrooms'
  | 'laboratories'
  | 'library'
  | 'sports_playground'
  | 'activities'
  | 'events'
  | 'transport'
  | 'cafeteria'
  | 'other';

export interface CampusCategoryDefinition {
  key: CampusImageCategory;
  label: string;
  description: string;
  uploadPrompt: string;
  addBtnLabel: string;
  emptyStateText: string;
}

export interface SharedMediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  hash?: string;
  categories: string[];
  source: 'campus' | 'facilities' | 'leadership' | 'other';
  usedIn: string[];
  caption?: string;
  uploadedAt?: string;
  storageKey?: string;
  isHero?: boolean;
}

export interface CampusImageData {
  id: string;
  schoolId?: string;
  campusId: string;
  storageKey: string;
  fileName: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  originalSize?: number;
  optimizedSize?: number;
  optimizedFormat?: string;
  displayOrder?: number;
  createdAt?: string;
  reusedFromId?: string;
  sharedAssetId?: string;
  sourceSection?: string;
  checksumSha256?: string;
  /** Primary gallery category (e.g. 'classrooms', 'campus_buildings') */
  category?: CampusImageCategory;
  /** Alias for category matching API/db representation */
  imageCategory?: CampusImageCategory;
  /** Optional secondary subtype or legacy image type (e.g. 'Classroom', 'Reception / Front Desk') */
  imageType?: string;
  /** Custom Image Type specified when imageType === 'other' or category === 'other' */
  customImageType?: string | null;
  /** Single designated Primary/Featured image flag per campus */
  isPrimary?: boolean;
  /** Designated Home Page / Hero image flag for the school website */
  isHero?: boolean;
  /** Optional caption describing this image */
  caption?: string;
}

export type CampusDataSourceMode = 'inherited' | 'customized' | 'not_applicable';

export interface CampusSectionOverride<T = any> {
  sourceMode: CampusDataSourceMode;
  sourceCampusId?: string; // Campus ID it inherits from (e.g. main campus or other campus)
  customData?: T; // Campus-specific override data when sourceMode === 'customized'
  notes?: string;
}

export type CampusOverridesMap = Record<string, Partial<Record<string, CampusSectionOverride>>>;

export interface CampusBranchData {
  id: string;
  schoolId?: string;
  name: string;
  code?: string;
  address: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country?: string;
  pin: string;
  contactPhone: string;
  officialPhone?: string; // backwards compatibility alias for contactPhone
  contactEmail?: string;
  coordinatorName?: string;
  principalOrHead?: string; // backwards compatibility
  operatingHours?: string;
  facilities?: string[];
  isMainCampus: boolean;
  isActive?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsLink?: string;
  googleMapsUrl?: string;
  countryName?: string;
  otherCountry?: string;
  otherStateProvince?: string;
  otherState?: string;
  otherDistrict?: string;
  /** Campus-specific uploaded images (all WebP optimized) */
  images?: CampusImageData[];
  /** Campus-specific academic levels (e.g. ['Pre-Primary'], ['Primary']) */
  academicLevels?: string[];
  /** Backward compatibility single level string (e.g. 'Pre-Primary') */
  academicLevel?: string;
  /** Campus school type / wing type (e.g. 'Play School / Pre-Primary Wing', 'Primary School', 'Secondary School') */
  schoolType?: string;
  /** Campus school level alias */
  schoolLevel?: string | string[];
  /** Campus classes offered list (e.g. ['Playgroup', 'Nursery', 'LKG', 'UKG']) */
  classesOffered?: string[];
  /** Classes range boundary start (e.g. 'Playgroup' or 'Class 1') */
  classesOfferedFrom?: string;
  /** Classes range boundary end (e.g. 'UKG' or 'Class 5') */
  classesOfferedTo?: string;
  /** Human-readable class range (e.g. 'Playgroup to UKG', 'Class 1 to 5') */
  classRange?: string;
  /** Optional academic / wing description (e.g. 'Early Childhood Development Wing') */
  wingDescription?: string;
  /** Optional academic description alias */
  academicDescription?: string;
  /** Campus-specific section inheritance & override configurations */
  sectionConfigs?: Partial<Record<string, CampusSectionOverride>>;
}

/**
 * Person / Leadership Image Asset (Genuine WebP Optimized)
 * Associates an uploaded image with a specific person (Principal or Management Member).
 */
export interface PersonImageData {
  id: string;
  schoolId?: string;
  personId: string; // 'principal' or member.id
  personRole?: 'principal' | 'trustee' | 'management' | string;
  storageKey: string;
  fileName: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  originalSize?: number;
  optimizedSize?: number;
  optimizedFormat?: string;
  createdAt?: string;
  updatedAt?: string;
  reusedFromId?: string;
  checksumSha256?: string;
  /** Image Type classification (e.g. 'Principal / Head of Institution', 'Trustee', 'other') */
  imageType?: string;
  /** Custom Image Type specified when imageType === 'other' */
  customImageType?: string | null;
  /** Optional descriptive caption */
  caption?: string;
}

export interface ManagementMember {
  id: string;
  name: string;
  designation: string;
  role: 'Chairman' | 'Director' | 'Trustee' | 'Secretary' | 'Manager' | 'Administrator' | 'Other';
  email: string;
  phone: string;
  qualification?: string;
  qualifications?: string;
  photoUrl?: string;
  /** Dedicated person-specific photo asset */
  photo?: PersonImageData | null;
  biography?: string;
  deskMessage?: string;
  deskMessageSource?: 'generated' | 'user';
  effectiveDesignation?: string;
  message?: string;
  displayOnWebsite: boolean;
}

export interface SchoolLeadershipData {
  // Principal Profile
  principalId?: string;
  principalName: string;
  principalDesignation?: string;
  principalEffectiveDesignation?: string;
  principalPhotoUrl?: string;
  /** Dedicated person-specific photo asset */
  principalPhoto?: PersonImageData | null;
  principalEmail?: string;
  principalPhone?: string;
  principalWhatsapp?: string;
  principalQualification?: string;
  principalExperienceYears?: number;
  principalJoiningDate?: string;
  principalBiography?: string;
  principalMessage?: string;
  principalDeskMessageSource?: 'generated' | 'user';
  // Repeatable Management Roster
  managementMembers?: ManagementMember[];
  // Leadership Messages for Website
  chairmanMessage?: string;
  directorMessage?: string;
  trusteeMessage?: string;
  visionStatement?: string;
  missionStatement?: string;
  // Backwards compatibility
  vicePrincipalName?: string;
  vicePrincipalDesignation?: string;
  vicePrincipalMessage?: string;
  managementContactName?: string;
  managementDesignation?: string;
  managementMessage?: string;
  administrativeContacts?: Array<{ name: string; designation: string; phone: string; email?: string }>;
}

export interface SchoolBrandingData {
  hasHighResLogo: boolean;
  logoUrl?: string;
  crestUrl?: string;
  faviconUrl?: string;
  headerLogoUrl?: string;
  footerLogoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamilyPreference?: string;
  taglineOrMotto?: string;
  motto?: string;
  visionStatement?: string;
  missionStatement?: string;
  coreValues?: string[];
  brandTone?:
    | 'Modern'
    | 'Traditional'
    | 'Academic'
    | 'Premium'
    | 'Minimal'
    | 'Corporate'
    | 'Child-friendly'
    | 'Government/Institutional'
    | 'Traditional & Prestigious'
    | 'Modern & Progressive'
    | 'Academic & Scholarly'
    | 'Warm & Community-focused'
    | 'Minimal & Professional'
    | 'Custom'
    | string;
  preferredWebsiteStyle?: string;
  preferredVisualTone?: 'traditional_prestigious' | 'modern_vibrant' | 'minimal_clean';
  designReferenceWebsites?: string;
  brandGuidelinesUrl?: string;
  secondaryLogoUrl?: string;
  emblemUrl?: string;
  // Canonical Image Pipeline Parity Attributes
  logoFileName?: string;
  logoFileSize?: number;
  logoWidth?: number | null;
  logoHeight?: number | null;
  logoOptimizedFormat?: string | null;
  logoStorageKey?: string;
  logoOriginalSize?: number;
}

export type WebsiteFieldState =
  | 'auto_filled'
  | 'confirmed'
  | 'prefilled'
  | 'needs_confirmation'
  | 'missing'
  | 'optional'
  | 'not_applicable'
  | 'generated'
  | 'future_cms';

export interface CanonicalCandidate {
  value: string;
  source: string;
  sourceSection: string;
  sourceField: string;
}

export interface WebsitePageRequirement {
  key: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'boolean'
    | 'image'
    | 'document'
    | 'email'
    | 'phone'
    | 'number'
    | 'reference'
    | 'generated'
    | 'gallery_category';
  required: boolean;
  value?: unknown;
  source?: string;
  sourceSection?: string;
  sourceField?: string;
  autoFilled?: boolean;
  userConfirmed?: boolean;
  userEdited?: boolean;
  status: WebsiteFieldState;
  whyNeeded?: string;
  missingWarning?: string;
  options?: string[];
  isCmsFutureContent?: boolean;
  referenceAssetId?: string;
  referenceUrl?: string;
  referenceFileName?: string;
  referenceWidth?: number;
  referenceHeight?: number;
  referenceFileSize?: number;
  referenceFileType?: string;
  referenceStorageKey?: string;
  referenceUsageSummary?: string;
  hasConflict?: boolean;
  conflictingCandidates?: CanonicalCandidate[];
}

export type CustomPageType =
  | 'information'
  | 'directory'
  | 'listing'
  | 'gallery'
  | 'form'
  | 'document_library'
  | 'other';

export interface CustomPageRequirementItem {
  id: string;
  title: string;
  description?: string;
  type?: string;
}

export interface CustomPageRequirement {
  id: string;
  title: string;
  slug: string;
  purpose?: string;
  contentRequirement?: string;
  language?: string;
  displayOrder?: number;
  isPublic: boolean;
  isCmsEditable: boolean;
  pageType?: CustomPageType;
  customRequirements?: CustomPageRequirementItem[];
}

export interface WebsitePageConfiguration {
  pageKey: string;
  label: string;
  slug: string;
  enabled: boolean;
  status: 'ready' | 'needs_review' | 'incomplete';
  readyCount: number;
  totalCount: number;
  requirements: WebsitePageRequirement[];
  recommendedSections?: string[];
  applicableCampusIds?: string[];
  isCustom?: boolean;
  customPageType?: CustomPageType;
  settings?: Record<string, unknown>;
}

export interface WebsiteMandatoryDisclosureConfig {
  regulatoryBody: 'CBSE' | 'CISCE' | 'State Board' | 'IB' | 'Cambridge' | 'Other';
  otherRegulatoryBody?: string;
  affiliationNumber?: string;
  schoolCode?: string;
  udiseCode?: string;
  academicSession: string;
  principalName: string;
  schoolAddress: string;
  contactPhone: string;
  contactEmail: string;
  infrastructureSummary?: string;
  facultySummary?: string;
  academicResultsSummary?: string;
  autoGenerateStandardStructure: boolean;
  statutoryDocuments?: Array<{
    documentKey: string;
    title: string;
    status: 'found' | 'missing';
    source?: string;
    referenceAssetId?: string;
    fileUrl?: string;
  }>;
}

export interface WebsitePrivacyPolicyConfig {
  autoGenerateStandardPolicy: boolean;
  policyContent?: string;
  lastEditedAt?: string;
  isCustomized?: boolean;
  collectsContactFormSubmissions: boolean;
  collectsAdmissionEnquiries: boolean;
  usesCookies: boolean;
  usesAnalytics: boolean;
  offersNewsletterSubscription: boolean;
  acceptsDocumentUploads: boolean;
  acceptsOnlinePayments: boolean;
  schoolName: string;
  schoolContactEmail: string;
  dataProtectionContact?: string;
}

export interface WebsiteDeveloperSpecification {
  pages: Array<{
    pageKey: string;
    label: string;
    slug: string;
    enabled: boolean;
    pageType: string;
    sections: string[];
    isCmsEnabled: boolean;
    applicableCampusIds?: string[];
  }>;
  navigation: Array<{
    title: string;
    slug: string;
    order: number;
    isPublic: boolean;
  }>;
  pageRequirements: Record<string, WebsitePageRequirement[]>;
  contentSources: Record<string, string[]>;
  assetReferences: Record<string, { storageKey?: string; url?: string; caption?: string; width?: number | null; height?: number | null }>;
  documentReferences: Record<string, { documentId?: string; title: string; url?: string }>;
  generatedTemplates: Record<string, string>;
  missingRequirements: Array<{ pageKey: string; fieldKey: string; label: string; reason: string }>;
  summary: {
    totalPages: number;
    readyPages: number;
    needsReviewPages: number;
    templatePages: number;
    cmsFuturePages: number;
    availableImagesCount: number;
    missingImagesCount: number;
    availableDocsCount: number;
    missingDocsCount: number;
    confirmedRequirementsCount?: number;
    needsConfirmationRequirementsCount?: number;
    prefilledRequirementsCount?: number;
    missingRequirementsCount?: number;
    generatedRequirementsCount?: number;
    futureCmsRequirementsCount?: number;
  };
}

export type WebsiteApprovalStatus = 'pending' | 'approved' | 'requires_reverification' | 'superseded';

export interface WebsiteSpecificationSnapshot {
  snapshotId: string;
  snapshotCreatedAt: string;
  specificationVersion: number;
  pages: Record<string, WebsitePageConfiguration>;
  resolvedAssets: Record<
    string,
    {
      id: string;
      title: string;
      category: string;
      url?: string;
      storageKey?: string;
      fileName?: string;
      fileType?: string;
      width?: number;
      height?: number;
      fileSize?: number;
      sourceSection?: string;
      sourceField?: string;
    }
  >;
  contentSnapshot: {
    aboutSchool: string;
    mission?: string;
    vision?: string;
    principalName: string;
    principalMessage?: string;
    managementMessage?: string;
    schoolHighlights?: Record<string, any>;
  };
  complianceSnapshot: {
    mandatoryDisclosures?: any[];
    affiliationCertPresent: boolean;
    societyRegistrationPresent: boolean;
    board?: string;
    affiliationNumber?: string;
  };
  readinessSnapshot: {
    canApprove: boolean;
    websitePagesCount: number;
    readyPagesCount: number;
    contentReadyPercentage: number;
    assetsVerifiedCount: number;
    complianceBlockersCount: number;
    unresolvedBlockers: Array<{
      key: string;
      pageLabel: string;
      label: string;
      sourceSection: string;
      sourceSectionName: string;
      message: string;
      isStatutory: boolean;
    }>;
    duplicateRisks: Array<{
      pageKey: string;
      label: string;
      slug: string;
      conflictingPageKey: string;
      conflictingLabel: string;
      matchType: string;
      message: string;
    }>;
  };
  sourceTimestamps?: Record<string, string | undefined>;
}

export interface WebsiteApprovalRecord {
  id: string;
  status: WebsiteApprovalStatus;
  specificationVersion: number;
  specificationHash: string; // Deterministic SHA-256
  approvedAt: string;
  approvedBy: {
    name: string;
    email: string;
    role: string;
  };
  notes?: string;
  approvedSpecification: WebsiteSpecificationSnapshot;
  invalidationReason?: string;
  invalidatedAt?: string;
  invalidatedFields?: string[];
  invalidatedPages?: string[];
}

export interface ApprovalInvalidationResult {
  isInvalidated: boolean;
  invalidatedFields: string[];
  affectedPages: string[];
  reason?: string;
}

export interface WebsitePublicationPayload {
  publicationId: string;
  schoolId: string;
  specificationVersion: number;
  specificationHash: string;
  approvedAt: string;
  approvedBy: {
    name: string;
    email: string;
    role: string;
  };
  pages: Record<string, WebsitePageConfiguration>;
  resolvedAssets: Record<string, any>;
  content: Record<string, any>;
  compliance: Record<string, any>;
  publishedAt: string;
  snapshot?: WebsiteSpecificationSnapshot;
}

export interface WebsiteRequirementsData {
  websiteGoal?: 'new_website' | 'redesign' | 'cms_enabled' | 'admissions_focused' | 'portal' | 'complete_platform';
  primaryPurpose?: string;
  requiredPages?: string[];
  customPages?: CustomPageRequirement[];
  pageConfigurations?: Record<string, WebsitePageConfiguration>;
  mandatoryDisclosureConfig?: WebsiteMandatoryDisclosureConfig;
  privacyPolicyConfig?: WebsitePrivacyPolicyConfig;
  developerSpecification?: WebsiteDeveloperSpecification;
  heroImageSource?: 'primary_campus' | 'existing_image' | 'upload_new';
  heroImageSelectedStorageKey?: string;
  galleryCategoriesConfig?: Record<string, { enabled: boolean; displayOrder: number; isFeatured: boolean }>;
  pageDetails?: Record<string, { description?: string; contentDraft?: string; documentNotes?: string }>;
  principalMessageDraft?: string;
  managementMessageDraft?: string;
  admissionsOpenAnnouncement?: boolean;
  existingWebsiteUrl?: string;
  migrationNeededFromExisting?: boolean;
  seoFocusKeywords?: string;
  languagesRequired?: string[];
  websiteApproved?: boolean;
  websiteApprovedAt?: string;
  websiteApprovedBy?: string;
  websiteApprovalNotes?: string;
  currentApproval?: WebsiteApprovalRecord;
  approvalHistory?: WebsiteApprovalRecord[];
}

export interface WebsiteScopeData {
  websiteType?: 'public_school' | 'group_institutions' | 'portal_first' | string;
  coreModules?: string[];
  optionalModules?: string[];
  customPages?: Array<{ id: string; name: string; notes?: string }>;
  specialInstructions?: string;
  notes?: string;
}

export interface AwardOrAchievement {
  id: string;
  title: string;
  year?: string;
  recipient?: string;
  description?: string;
  category?: 'student' | 'faculty' | 'school';
}

export interface ParentTestimonial {
  id: string;
  parentName: string;
  studentName?: string;
  gradeOrClass?: string;
  quote: string;
  rating?: number;
}

export type ContentBlockStatus = 'generated' | 'customized' | 'approved';

export interface GeneratedContentBlock {
  text: string;
  status: ContentBlockStatus;
  sourceVersion?: string;
  sourceChecksum?: string;
  updatedAt?: string;
}

export interface CampusHighlightBreakdown {
  campusId: string;
  campusName: string;
  isMainCampus?: boolean;
  classRange: string;
  levelSummary?: string;
}

export interface SchoolHighlightsData {
  establishedYear?: string | number;
  location?: string;
  board?: string;
  classes?: string;
  campusBreakdowns?: CampusHighlightBreakdown[];
  campusesCount?: number;
  facilities?: string[];
  activities?: string[];
}

export interface SchoolContentData {
  // Primary institutional content blocks (string or structured block for backwards compatibility)
  aboutSchool: string | GeneratedContentBlock;
  mission?: string | GeneratedContentBlock;
  vision?: string | GeneratedContentBlock;
  educationalPhilosophy?: string | GeneratedContentBlock;

  // Legacy fields for backward compatibility
  history?: string;
  foundingStory?: string;
  philosophy?: string;
  teachingMethodology?: string;
  uniqueSellingPoints?: string[];
  specialPrograms?: string;
  specialProgramsConfig?: {
    stem?: boolean;
    robotics?: boolean;
    spokenEnglish?: boolean;
    coding?: boolean;
    sports?: boolean;
    arts?: boolean;
    music?: boolean;
    clubs?: string[];
    competitions?: string[];
    details?: string;
  };
  awardsAndAchievements?: AwardOrAchievement[];
  achievementsAndAwards?: string; // backwards compatibility
  infrastructureHighlights?: string[];
  parentTestimonials?: ParentTestimonial[];
  alumniInformation?: string;
  studentLife?: string;

  // New Section 6 structured content & approval workflow
  coreValues?: string[];
  availableCoreValues?: string[]; // All available/previously configured values preserved without loss
  highlights?: SchoolHighlightsData;
  isApproved?: boolean;
  approved?: boolean; // alias for isApproved
  approvedAt?: string;
  approvedBy?: string;
  sourceDataDigest?: string; // Cryptographic/hash signature to detect if upstream information changed
}

/**
 * Safely resolves plain text string from either a legacy string or a modern GeneratedContentBlock
 */
export function resolveContentBlockText(
  block: string | GeneratedContentBlock | undefined | null,
  fallback = ''
): string {
  if (!block) return fallback;
  if (typeof block === 'string') return block;
  if (typeof block === 'object' && typeof block.text === 'string') return block.text;
  return fallback;
}

/**
 * Safely extracts ContentBlockStatus from either a legacy string or modern GeneratedContentBlock
 */
export function resolveContentBlockStatus(
  block: string | GeneratedContentBlock | undefined | null
): ContentBlockStatus {
  if (!block) return 'generated';
  if (typeof block === 'object' && block.status) return block.status;
  return 'customized';
}

/**
 * Helper to construct a modern GeneratedContentBlock
 */
export function createContentBlock(
  text: string,
  status: ContentBlockStatus = 'generated',
  sourceChecksum?: string
): GeneratedContentBlock {
  return {
    text,
    status,
    sourceChecksum,
    updatedAt: new Date().toISOString(),
  };
}

export interface ClassSectionConfig {
  id?: string;
  name: string;
  code?: string;
  capacity?: number;
  room?: string;
  classTeacher?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface AcademicStreamConfig {
  id: string;
  name: string;
  code?: string;
  sections?: (string | ClassSectionConfig)[];
  description?: string;
}

export interface AcademicProgramConfig {
  id: string;
  name: string;
  code?: string;
  description?: string;
}

export interface AcademicClassConfig {
  id?: string;
  name: string;
  className?: string; // backwards compatibility alias
  code?: string;
  level?: string;
  sortOrder: number;
  displayOrder?: number;
  isActive?: boolean;
  sections: (string | ClassSectionConfig)[];
  streams?: AcademicStreamConfig[];
  programs?: AcademicProgramConfig[];
  /** Campus allocation (if multi-campus) */
  campusId?: string;
  campusIds?: string[];
}

export interface AcademicSubjectConfig {
  id?: string;
  name: string;
  code?: string;
  subjectType: 'theory' | 'practical' | 'combined' | 'activity';
  category?: 'core' | 'elective' | 'optional' | 'additional' | 'activity';
  isElective?: boolean;
  status?: 'active' | 'inactive';
  description?: string;
  className?: string; // backwards compatibility alias
  stream?: string; // backwards compatibility alias
  classesTaught?: string[]; // backwards compatibility alias
}

export type AcademicSubject = AcademicSubjectConfig;

export type TeachingGroupStructureType =
  | 'grade_only'
  | 'grade_section'
  | 'grade_stream'
  | 'grade_stream_section';

export interface TeachingGroup {
  id: string; // e.g. "tg_c10_A" or "tg_c11_sci_A" or "tg_nur"
  classId: string;
  className: string;
  streamId?: string;
  streamName?: string;
  sectionName?: string;
  displayName: string; // e.g. "Class 10 - Section A" or "Class 11 Science - Section A" or "Nursery"
  shortLabel: string; // e.g. "10-A" or "11-Sci-A" or "Nursery"
  structureType: TeachingGroupStructureType;
  classTeacher?: string;
}

export interface SubjectApplicabilityConfig {
  id: string;
  subjectId: string;
  classId: string;
  streamId?: string; // If scoped to a specific stream
  teachingGroupId?: string; // If scoped to a specific teaching group
  isElective?: boolean;
}

export interface SubjectTeacherAssignment {
  id: string;
  teachingGroupId: string;
  subjectId: string;
  teacherId?: string; // Canonical Faculty Member ID (StaffMember.id)
  facultyId?: string; // Canonical alias for teacherId
  teacherName?: string; // Legacy fallback or cached display
  secondaryTeacherId?: string; // Canonical Co-teacher Faculty Member ID
  secondaryFacultyId?: string; // Canonical alias for secondaryTeacherId
  secondaryTeacherName?: string;
  coTeachers?: Array<{ id?: string; facultyId?: string; name: string }>;
  notes?: string;
}

export interface ClassTeacherAssignment {
  id: string;
  teachingGroupId: string;
  teacherId?: string; // Canonical Faculty Member ID (StaffMember.id)
  facultyId?: string; // Canonical alias for teacherId
  teacherName?: string; // Legacy fallback or cached display
  assistantTeacherId?: string;
  assistantTeacherName?: string;
  roomNumber?: string;
}

export interface AcademicStructureData {
  isMultiCampus?: boolean;
  currentAcademicSession: string;
  sessionStartDate?: string;
  sessionEndDate?: string;
  futureSessionPattern?: string;
  classesOfferedFrom?: string;
  classesOfferedTo?: string;
  totalSectionsEstimated?: number;
  studentCapacityTotal?: number;
  teachingStaffCount?: number;
  nonTeachingStaffCount?: number;
  academicStreams?: string[];
  classes?: AcademicClassConfig[];
  subjects?: AcademicSubjectConfig[];
  subjectApplicability?: SubjectApplicabilityConfig[];
  subjectTeacherAssignments?: SubjectTeacherAssignment[];
  classTeacherAssignments?: ClassTeacherAssignment[];
  departments?: Array<{ name: string; headStaffName?: string; description?: string }>;
  // Active wizard step tracking
  activeSetupStep?: number;
  // Board & Curriculum
  board?: string;
  customBoard?: string;
  effectiveCurriculum?: string;
  // Class / Grade Naming Convention
  namingConvention?: 'Class' | 'Grade' | 'Standard' | 'Custom' | string;
  customNamingConvention?: string;
  // Confirmation & Review Lifecycle
  confirmed?: boolean;
  academicStructureConfirmed?: boolean;
  confirmedAt?: string;
  confirmedByName?: string;
  confirmedVersion?: number;
  structureStatus?: 'unconfigured' | 'suggested' | 'review_required' | 'confirmed';
}

export interface StaffQualification {
  degree: string;
  fieldOrSpecialization?: string;
  institution?: string;
  yearOfPassing?: string | number;
  percentageOrGpa?: string;
}

export interface StaffDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  storagePath?: string;
  uploadedAt: string;
  sizeBytes?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  employeeCode?: string; // Stable institutional ID (e.g. "FAC-2026-00012")
  facultyId?: string; // Canonical alias for employeeCode
  staffType?: 'TEACHING' | 'NON_TEACHING' | string;
  designation: string;
  department?: string;
  category?: 'teaching' | 'non_teaching' | string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated' | string;
  campusId?: string;
  qualification?: string;
  highestQualification?: string;
  qualificationDetails?: StaffQualification[];
  specialization?: string; // Subject specialization (e.g. Mathematics, Physics)
  certifications?: string[];
  previousInstitution?: string;
  previousDesignation?: string;
  previousExperienceYears?: number;
  skills?: string[];
  experienceYears?: number;
  joiningDate?: string;
  leavingDate?: string;
  academicYear?: string;
  email?: string;
  officialEmail?: string;
  personalEmail?: string;
  phone?: string;
  officialPhone?: string;
  personalPhone?: string;
  alternatePhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  religion?: string;
  motherTongue?: string;
  maritalStatus?: string;
  currentAddress?: string;
  currentCity?: string;
  currentState?: string;
  currentPincode?: string;
  currentCountry?: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPincode?: string;
  permanentCountry?: string;
  primarySubject?: string;
  additionalSubjects?: string[];
  classesTaught?: string;
  classesTaughtList?: string[];
  sectionsTaught?: string;
  sectionsTaughtList?: string[];
  isClassTeacher?: boolean;
  isHod?: boolean;
  isCoordinator?: boolean;
  jobRole?: string;
  workLocation?: string;
  workSchedule?: string;
  shift?: string;
  reportingManager?: string;
  reportingManagerId?: string;
  photoUrl?: string;
  photoStoragePath?: string;
  documents?: StaffDocument[];
  salaryGrade?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  pan?: string;
  pfNumber?: string;
  esiNumber?: string;
  bio?: string;
  subjectsTaught?: string;
  displayOnWebsite: boolean;
  displayOrder?: number;
  websiteProfile?: {
    showOnWebsite: boolean;
    publicName?: string;
    publicDesignation?: string;
    publicDepartment?: string;
    publicSubject?: string;
    shortBio?: string;
    featured?: boolean;
    displayOrder?: number;
  };
  archivedAt?: string;
  archivedReason?: string;
  customFields?: Record<string, any>;
  custom_fields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export type FacultyMember = StaffMember;

export type StaffCustomFieldType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'DECIMAL'
  | 'DATE'
  | 'BOOLEAN'
  | 'PHONE'
  | 'EMAIL'
  | 'DROPDOWN'
  | 'MULTI_SELECT'
  | 'FILE'
  | 'DOCUMENT';

export type StaffCustomFieldCategory =
  | 'employment'
  | 'personal'
  | 'contact'
  | 'address'
  | 'qualification'
  | 'teaching'
  | 'non_teaching'
  | 'payroll'
  | 'documents'
  | 'custom';

export interface StaffCustomFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  regex?: string;
  allowedFileTypes?: string[];
  maxSizeBytes?: number;
}

export interface StaffCustomField {
  id: string;
  school_id?: string;
  field_key: string;
  field_label: string;
  description?: string;
  field_type: StaffCustomFieldType;
  category: StaffCustomFieldCategory;
  staff_scope: 'TEACHING' | 'NON_TEACHING' | 'BOTH';
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  options?: string[];
  options_json?: string[] | any;
  validation?: StaffCustomFieldValidation;
  validation_json?: StaffCustomFieldValidation | any;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface StaffImportSummary {
  totalDetected: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  importedAt: string;
  fileName?: string;
}

export interface StaffFacultyConfigData {
  bulkImportMode?: boolean;
  estimatedTotalStaff?: number;
  teachingStaffCount?: number;
  nonTeachingStaffCount?: number;
  departments?: string[];
  staffCategories?: string[];
  staffIdFormat?: string;
  employeeIdFormat?: string;
  institutionalIdNumbering?: InstitutionalIdNumberingConfig;
  staffAttendanceRequirement?: string;
  isStaffDirectoryRequired?: boolean;
  isStaffProfilesPublic?: boolean;
  staffMembers?: StaffMember[];
  // Dynamic Field Selection & Multi-Stage Workflow
  enabledFields?: string[];
  requiredFields?: string[];
  customFields?: StaffCustomField[];
  activeStage?: 'directory' | 'fields' | 'template' | 'import';
  lastImportSummary?: StaffImportSummary;
}

export type StaffFacultyData = StaffFacultyConfigData; // alias

export interface StudentImportSummary {
  totalDetected: number;
  readyCount: number;
  warningCount: number;
  errorCount: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  importedAt: string;
  fileName?: string;
}

export type StudentCustomFieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'phone'
  | 'email'
  | 'url'
  | 'dropdown'
  | 'multi_select'
  | 'yes_no'
  | 'image'
  | 'file';

export interface StudentCustomFieldDefinition {
  id: string;
  school_id?: string;
  field_key: string;
  field_name: string;
  field_type: StudentCustomFieldType;
  section_key: string;
  section_name?: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  options?: string[];
  default_value?: any;
  placeholder?: string;
  help_text?: string;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
  };
  has_data?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentCustomSection {
  id: string;
  school_id?: string;
  section_key: string;
  section_name: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StudentConfigData {
  estimatedStudentCount?: number;
  students?: Student[];
  studentIdFormat?: string;
  admissionNumberFormat?: string;
  rollNumberSystem?: 'class_wise' | 'section_wise' | 'alphabetical' | 'manual';
  houseSystemEnabled?: boolean;
  houseNames?: string[];
  reservationCategories?: string[];
  studentCategories?: string[];
  requiredStudentFields?: string[];
  requiredDocumentTypes?: string[];
  studentPhotoRequired?: boolean;
  parentGuardianRequirements?: string[];
  siblingTrackingEnabled?: boolean;
  alumniTrackingEnabled?: boolean;
  migrationRequired?: boolean;
  // Dynamic Field Selection & Multi-Stage Workflow
  enabledFields?: string[];
  requiredFields?: string[];
  activeStage?: 1 | 2 | 3;
  lastImportSummary?: StudentImportSummary;
  // Dynamic Custom Fields (Orders 52+) & Sections (8+)
  customFields?: StudentCustomFieldDefinition[];
  customSections?: StudentCustomSection[];
}

export type AdmissionStatus = 'open' | 'upcoming' | 'closed' | 'waitlist' | 'not_accepting';
export type ClassAdmissionStatus = 'open' | 'closed' | 'waitlist' | 'enquiry_only' | 'not_offered';
export type ContactPreferredMethod = 'phone' | 'whatsapp' | 'email' | 'in_person';
export type FeeFrequency =
  | 'one_time'
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'annual'
  | 'per_term'
  | 'per_session'
  | 'other';
export type DocumentRequirement = 'required' | 'optional' | 'not_requested';
export type ApplicationMethod = 'website' | 'portal' | 'email' | 'in_person' | 'other';
export type AdmissionCtaOption =
  | 'Apply Now'
  | 'Enquire Now'
  | 'Contact Admissions'
  | 'Request a Callback'
  | 'Visit Campus'
  | 'Learn More'
  | 'Other';

export interface AdmissionsContact {
  name?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  visitingHours?: string;
  preferredMethod?: ContactPreferredMethod | string;
  address?: string;
}

export interface AdmissionsApplicationOptions {
  admissionsOpen?: boolean;
  onlineApplication?: boolean;
  documentUpload?: boolean;
  walkInApplication?: boolean;
  enquiryEnabled?: boolean;
  callbackEnabled?: boolean;
  applicationFeeRequired?: boolean;
}

export interface AdmissionClassAvailabilityItem {
  id: string;
  classId?: string;
  className: string;
  status: ClassAdmissionStatus;
  availableSeats?: number;
  notes?: string;
}

export interface AdmissionEligibility {
  applicableClasses?: string[];
  minimumAge?: string;
  maximumAge?: string;
  ageCutoffDate?: string;
  entranceAssessment?: boolean;
  interviewRequired?: boolean;
  previousAcademicRequirement?: string;
  notes?: string;
}

export interface AdmissionProcessStep {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
  description?: string;
}

export interface AdmissionDocumentItem {
  id: string;
  name: string;
  requirement: DocumentRequirement;
  customName?: string;
}

export interface AdmissionFeeItem {
  id: string;
  name: string;
  amount?: number;
  currency?: string;
  frequency?: FeeFrequency | string;
  applicableClasses?: string[];
  session?: string;
  showOnWebsite?: boolean;
  displayLabel?: string;
  notes?: string;
}

export interface AdmissionImportantDateItem {
  id: string;
  eventName: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface AdmissionApplicationConfig {
  method?: ApplicationMethod | string;
  url?: string;
  instructions?: string;
  supportContact?: string;
}

export interface AdmissionsData {
  // Production structured model:
  session?: string;
  status?: AdmissionStatus;
  applicationStartDate?: string;
  applicationEndDate?: string;
  admissionCycleNotes?: string;

  contact?: AdmissionsContact;
  applicationOptions?: AdmissionsApplicationOptions;
  classAvailability?: AdmissionClassAvailabilityItem[];
  eligibility?: AdmissionEligibility;
  process?: AdmissionProcessStep[];
  documents?: AdmissionDocumentItem[];
  fees?: AdmissionFeeItem[];
  feeNotes?: string;
  importantDates?: AdmissionImportantDateItem[];
  application?: AdmissionApplicationConfig;
  callToAction?: AdmissionCtaOption | string;
  customCtaLabel?: string;
  additionalInformation?: string;

  // Backward compatibility legacy flat fields:
  admissionsOpen?: boolean;
  targetSessions?: string;
  classesOpenForAdmission?: string[];
  eligibilityCriteria?: string;
  ageCriteria?: string;
  minAgeCriteria?: string;
  maxAgeCriteria?: string;
  requiredDocuments?: string[];
  admissionStages?: string[];
  workflowStages?: string[];
  applicationFee?: number;
  admissionFee?: number;
  registrationFee?: number;
  contactPerson?: string;
  admissionPhone?: string;
  admissionWhatsapp?: string;
  admissionEmail?: string;
  officeHours?: string;
  enquiryTrackingEnabled?: boolean;
  onlineEnquiryEnabled?: boolean;
  onlineApplicationEnabled?: boolean;
  documentUploadEnabled?: boolean;
  applicationTrackingEnabled?: boolean;
  interviewSchedulingEnabled?: boolean;
  interviewRequired?: boolean;
  entranceTestRequired?: boolean;
}

// --- Layered Fee Architecture & Curriculum Models -------------------
export type FeeCategoryType =
  | 'Tuition'
  | 'Annual Charges'
  | 'Examination'
  | 'Library'
  | 'Insurance'
  | 'Student Welfare'
  | 'Sports'
  | 'Technology / Computer'
  | 'Activity'
  | 'Other';

export type StudentTypeEligibility = 'new_only' | 'existing_only' | 'both';

export type FeeBillingFrequency = 'one_time' | 'monthly' | 'quarterly' | 'half_yearly' | 'annually';

export type FeeStatusKind = 'INHERITED' | 'CUSTOM' | 'NOT APPLICABLE' | 'OPTIONAL' | 'INCLUDED';

export interface CommonFeeItem {
  id: string;
  name: string;
  category: FeeCategoryType | string;
  amount: number;
  frequency: FeeBillingFrequency;
  studentType: StudentTypeEligibility;
  applicableClasses: 'all' | string[]; // 'all' or list of class names
  isRefundable?: boolean;
  refundPolicy?: string;
  isVisibleOnWebsite?: boolean;
  description?: string;
  isAdmissionOnly?: boolean;
  paymentTiming?: 'at_admission' | 'before_session' | 'installments' | string;
}

export type OptionalServiceKey =
  | 'transport'
  | 'hostel'
  | 'meals'
  | 'uniform'
  | 'books'
  | 'trips'
  | 'activities'
  | 'other';

export interface OptionalServiceConfig {
  id: string;
  key: OptionalServiceKey | string;
  name: string;
  isProvided: boolean; // Does your school provide this service?
  description?: string;
  feeAmount?: number;
  frequency?: FeeBillingFrequency;
  applicableClasses?: 'all' | string[];
  isRequired?: boolean; // Optional vs Mandatory
  studentType?: StudentTypeEligibility;
  isVisibleOnWebsite?: boolean;
  pricingModel?: 'flat' | 'route_based';
}

export interface ClassFeeOverrideItem {
  amount: number;
  isCustom: boolean;
  isExcluded?: boolean;
  notes?: string;
}

export type PaymentPlanFrequency = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export interface PaymentPlanConfig {
  frequency: PaymentPlanFrequency;
  isEnabled: boolean;
  yearlyDiscountPercentage?: number;
  discountAppliesTo?: 'tuition_only' | 'selected_fees' | 'all_academic';
}

export interface MeritScholarshipSlab {
  id: string;
  minPercentage: number;
  maxPercentage: number;
  discountPercentage: number;
  appliesTo: 'net_tuition' | 'tuition' | 'total_fee';
}

export interface ScholarshipConfigData {
  meritScholarship: {
    isEnabled: boolean;
    slabs: MeritScholarshipSlab[];
  };
  defenceScholarship: {
    isEnabled: boolean;
    name: string;
    discountPercentage: number;
    eligibility: string;
    appliesTo: 'net_tuition' | 'tuition' | 'total_fee';
  };
  girlsScholarship: {
    isEnabled: boolean;
    discountPercentage: number;
    appliesTo: 'net_tuition' | 'tuition' | 'total_fee';
  };
  siblingDiscount: {
    isEnabled: boolean;
    secondChildDiscount: number;
    thirdChildDiscount: number;
    appliesTo: 'net_tuition' | 'tuition' | 'total_fee';
  };
  customScholarships?: Array<{
    id: string;
    name: string;
    discountPercentage: number;
    criteria: string;
    appliesTo: 'net_tuition' | 'tuition' | 'total_fee';
  }>;
  seatAvailability: {
    seatLimitPercentage: number;
    allocation: 'fcfs' | 'merit' | 'school_selection' | 'custom';
    notes?: string;
  };
  stackingRule: 'highest_only' | 'stackable' | 'custom_priority';
}

export interface FeeNoteItem {
  id: string;
  text: string;
  isPublished: boolean;
}

// Curriculum Models
export type SubjectCategoryType =
  | 'Language'
  | 'Mathematics'
  | 'Science'
  | 'Social Science'
  | 'Computer / Technology'
  | 'Arts'
  | 'Physical Education'
  | 'Life Skills'
  | 'Other';

export interface SubjectItem {
  id: string;
  name: string;
  category: SubjectCategoryType | string;
  isMandatory: boolean;
  description?: string;
  applicableClasses?: string[];
}

export interface ClassCurriculumItem {
  className: string;
  classId?: string;
  subjects?: string[];
  learningAreas?: string[];
  learningObjectives?: string[];
  description?: string;
}

export interface CurriculumData {
  overview?: {
    board?: string;
    curriculumType?: string;
    academicApproach?: string;
    learningPhilosophy?: string;
    teachingMethodology?: string;
    assessmentApproach?: string;
  };
  subjects?: SubjectItem[];
  classCurricula?: ClassCurriculumItem[];
}

export interface FeeStructureItem {
  className: string;
  feeType: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'half_yearly' | 'annually' | 'one_time';
  dueDateDay?: number;
  lateFeePerDay?: number;
}

export interface FeesConfigurationData {
  feeCategories?: string[];
  classFeeStructures?: FeeStructureItem[];
  billingFrequencies?: string[];
  dueDateDay?: number;
  gracePeriodDays?: number;
  lateFeeType?: 'fixed' | 'percentage' | 'none';
  lateFeeAmount?: number;
  concessionsAndScholarships?: string;
  siblingDiscounts?: string;
  categoryDiscounts?: string;
  preferredPaymentGateway?: 'razorpay' | 'phonepe' | 'other' | 'not_required' | 'to_be_decided';
  onlineFeePaymentRequired?: boolean;
  feeReceiptsAutomated?: boolean;
  parentLedgerHistoryEnabled?: boolean;
  dueRemindersEnabled?: boolean;

  // Enriched 5-Layer Fee Architecture
  commonFees?: CommonFeeItem[];
  newStudentFees?: CommonFeeItem[];
  optionalServices?: OptionalServiceConfig[];
  classOverrides?: Record<string, Record<string, ClassFeeOverrideItem>>;
  paymentPlans?: PaymentPlanConfig[];
  scholarships?: ScholarshipConfigData;
  annualChargesInclusions?: string[];
  annualChargesCustomText?: string;
  feeNotes?: FeeNoteItem[];
  customFeeNotesText?: string;
}

export type StudentAttendanceMode =
  | 'daily'
  | 'period_wise'
  | 'daily_and_period'
  | 'biometric'
  | 'rfid'
  | 'qr_code'
  | 'mobile'
  | 'manual_register'
  | 'undecided'
  | string;

export type StaffAttendanceMode =
  | 'daily'
  | 'biometric'
  | 'face_recognition'
  | 'rfid'
  | 'mobile'
  | 'manual'
  | 'multiple_methods'
  | 'undecided'
  | string;

export type AttendanceDeviceType =
  | 'fingerprint'
  | 'face_recognition'
  | 'rfid'
  | 'smart_card'
  | 'qr_code'
  | 'multiple_devices'
  | 'other';

export type AttendanceCaptureLocation =
  | 'main_gate'
  | 'classroom'
  | 'both_gate_classroom'
  | 'dedicated_area'
  | 'multiple_locations';

export type DeviceIntegrationStatus =
  | 'available'
  | 'planned'
  | 'not_required'
  | 'not_decided';

export type SaturdayScheduleType =
  | 'full_day'
  | 'half_day'
  | 'alternate'
  | 'custom'
  | 'not_decided';

export type AlternateSaturdayPattern =
  | '1st_3rd'
  | '2nd_4th'
  | '1st_3rd_5th'
  | '2nd_4th_5th'
  | 'custom';

export type TimetableScheduleStructure =
  | 'same_for_all'
  | 'by_grade'
  | 'by_campus'
  | 'configure_later';

export type LateMarkingRule =
  | 'automatic'
  | 'teacher_decides'
  | 'admin_decides';

export type AbsentMarkingRule =
  | 'teacher_submits'
  | 'automatic_after_school'
  | 'admin_approval'
  | 'manual';

export type AbsenceAlertChannel =
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'push'
  | 'parent_app'
  | 'none'
  | string;

export type AlertTimingMode =
  | 'immediate'
  | 'after_teacher_submits'
  | 'after_admin_approval'
  | 'end_of_day'
  | 'custom';

export type AttendanceCorrectionRole =
  | 'teacher'
  | 'class_teacher'
  | 'attendance_coordinator'
  | 'administrator'
  | 'principal';

export interface AttendanceData {
  studentAttendanceMode?: StudentAttendanceMode;
  attendanceDevice?: AttendanceDeviceType;
  attendanceCaptureLocation?: AttendanceCaptureLocation;
  deviceIntegrationStatus?: DeviceIntegrationStatus;
  staffAttendanceMode?: StaffAttendanceMode;
  schoolStartTime?: string;
  schoolEndTime?: string;
  assemblyStartTime?: string;
  assemblyDurationMinutes?: number;
  reportingTime?: string;
  dispersalTime?: string;
  workingDays?: number[];
  saturdaySchedule?: SaturdayScheduleType;
  alternateSaturdayPattern?: AlternateSaturdayPattern;
  customSaturdayDetails?: string;
  periodCount?: number;
  periodDurationMinutes?: number;
  breaks?: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    type: 'short_break' | 'lunch' | 'recess' | 'assembly' | 'other';
  }>;
  scheduleStructure?: TimetableScheduleStructure;
  multiCampusScheduleMode?: 'same_for_all' | 'by_campus';
  lateArrivalThresholdMinutes?: number;
  lateMarkingRule?: LateMarkingRule;
  halfDayRuleEnabled?: boolean;
  halfDayThresholdPercent?: number;
  halfDayThresholdHours?: string;
  absentMarkingRule?: AbsentMarkingRule;
  parentAbsenceChannels?: AbsenceAlertChannel[];
  parentAbsenceNotification?: 'sms' | 'whatsapp' | 'email' | 'app' | 'none' | string;
  alertTiming?: AlertTimingMode;
  customAlertTime?: string;
  notifyLateArrival?: boolean;
  lateAlertThresholdMinutes?: number;
  canCorrectAttendance?: AttendanceCorrectionRole[];
  correctionRequiresApproval?: boolean;
  correctionApprovalBy?: AttendanceCorrectionRole;
  leaveAffectsAttendance?: boolean;
  leaveApprovalRequired?: boolean;
  isAttendanceConfirmed?: boolean;

  // Legacy fields kept for backward compatibility
  lateArrivalTracking?: boolean;
  leaveManagementEnabled?: boolean;
  assemblyTime?: string;
  lunchTime?: string;
  breakDurationMinutes?: number;
}

export interface ExamTermItem {
  name: string;
  term: string;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface ExaminationData {
  examTermsList?: ExamTermItem[];
  examTypes?: string[];
  terms?: string[];
  gradingSystem?: 'cbse_9point' | 'cbse_8point' | 'percentage' | 'letter_grade' | 'gpa' | 'custom_marks' | 'custom';
  assessmentComponents?: {
    theoryMarks?: boolean;
    practicalMarks?: boolean;
    internalAssessment?: boolean;
    attendanceMarks?: boolean;
    projectMarks?: boolean;
    coCurricular?: boolean;
  };
  hasInternalAssessment?: boolean;
  hasPracticalMarks?: boolean;
  reportCardLayout?: 'cbse_standard' | 'state_board' | 'narrative_primary' | 'custom';
  reportCardOptions?: {
    showLogo?: boolean;
    showSignatures?: boolean;
    showRemarks?: boolean;
    showGrading?: boolean;
    showRank?: boolean;
    showPercentage?: boolean;
    publishOnParentPortal?: boolean;
    pdfDownloadEnabled?: boolean;
  };
  resultPublishVisibility?: 'internal_only' | 'parent_portal' | 'public_website';
}

export interface TimetableData {
  workingDaysPerWeek?: number;
  schoolStartTime?: string;
  schoolEndTime?: string;
  periodCount?: number;
  periodDurationMinutes?: number;
  breakDurationMinutes?: number;
  lunchDurationMinutes?: number;
  assemblyDurationMinutes?: number;
  timetableAutomationNeeded?: boolean;
}

export interface TransportRouteItem {
  routeName: string;
  startingPoint: string;
  destination: string;
  stops: string[];
  monthlyFee?: number;
}

// ─── PRODUCTION TRANSPORT CONFIGURATION TYPES ────────────────────────────────

export type TransportStatus = 'yes' | 'no' | 'outsourced' | 'planned' | 'not_decided';

export type TransportServiceModel =
  | 'school_owned'
  | 'school_managed_outsourced'
  | 'fully_outsourced'
  | 'mixed'
  | 'other';

export type VehicleTypeKey =
  | 'school_bus'
  | 'mini_bus'
  | 'van'
  | 'auto_rickshaw'
  | 'electric_vehicle'
  | 'other';

export interface VehicleTypeCount {
  type: VehicleTypeKey;
  label: string;
  count: number;
}

export type GpsTrackingOption =
  | 'available'
  | 'planned'
  | 'no_gps'
  | 'manual_logs'
  | 'phone_gps'
  | 'dedicated_gps'
  | 'not_decided';

export type TrackingProviderOption =
  | 'existing_provider'
  | 'to_be_integrated'
  | 'custom_api'
  | 'not_known';

export type ParentLiveTrackingOption =
  | 'realtime_location'
  | 'route_status_only'
  | 'no'
  | 'not_decided';

export type RouteManagementMethod =
  | 'fixed'
  | 'dynamic'
  | 'fixed_and_dynamic'
  | 'manual'
  | 'to_be_configured';

export type StopManagementOption = 'admin_defined' | 'parent_requested' | 'both';

export type DriverManagementOption =
  | 'school_employees'
  | 'contract_drivers'
  | 'outsourced_provider'
  | 'mixed'
  | 'to_be_configured';

export type AttendantAssignmentOption =
  | 'one_per_vehicle'
  | 'shared'
  | 'per_route'
  | 'to_be_decided';

export type ParentNotificationChannel =
  | 'whatsapp'
  | 'sms'
  | 'push'
  | 'parent_app'
  | 'email'
  | 'none'
  | 'not_decided';

export type TransportAlertType =
  | 'vehicle_started'
  | 'approaching_stop'
  | 'student_picked_up'
  | 'student_dropped_off'
  | 'route_delay'
  | 'vehicle_breakdown'
  | 'route_cancelled'
  | 'other_emergency';

export type DelayAlertThreshold =
  | '5_min'
  | '10_min'
  | '15_min'
  | '20_min'
  | '30_min'
  | 'custom';

export type VehicleSafetyTracking = 'required' | 'recommended' | 'not_configured';

export type EmergencyTransportContactRole =
  | 'transport_coordinator'
  | 'school_administration'
  | 'principal'
  | 'dedicated_helpline'
  | 'to_be_configured';

export type EmergencyNotificationChannel =
  | 'whatsapp'
  | 'sms'
  | 'push'
  | 'phone_call'
  | 'multiple';

export type OutsourcedProviderModel =
  | 'single_provider'
  | 'multiple_providers'
  | 'parent_managed'
  | 'to_be_configured';

export type OutsourcedSchoolVisibility =
  | 'full_route'
  | 'basic_route'
  | 'student_assignment_only'
  | 'no_digital_tracking'
  | 'to_be_configured';

export type PlannedLaunchTimeline =
  | 'this_academic_session'
  | 'next_academic_session'
  | 'within_3_months'
  | 'within_6_months'
  | 'not_decided';

export type PlannedServiceType = 'school_owned' | 'outsourced' | 'mixed' | 'not_decided';

export type ParentArrangedTransportOption =
  | 'no_service'
  | 'parents_arrange_independently'
  | 'third_party_may_be_used';

export interface TransportFleetConfig {
  totalVehicles?: number;
  vehicleTypeCounts?: VehicleTypeCount[];
  approximateStudentCapacity?: number;
}

export interface TransportTrackingConfig {
  gpsOption?: GpsTrackingOption;
  trackingMode?: VehicleTrackingMode;
  providerIntegration?: TrackingProviderOption;
  parentLiveTracking?: ParentLiveTrackingOption;
}

export interface TransportRoutesPlanningConfig {
  managementMethod?: RouteManagementMethod;
  approximateRoutesCount?: number;
  usesDesignatedStops?: 'yes' | 'no' | 'to_be_configured';
  stopManagement?: StopManagementOption;
}

export interface TransportStaffConfig {
  driverManagement?: DriverManagementOption;
  attendantRequired?: boolean;
  attendantAssignment?: AttendantAssignmentOption;
}

export interface TransportParentCommunicationConfig {
  notificationChannels?: ParentNotificationChannel[];
  alertTypes?: TransportAlertType[];
  delayThreshold?: DelayAlertThreshold;
  customDelayMinutes?: number;
}

export interface TransportSafetyConfig {
  vehicleSafetyTracking?: VehicleSafetyTracking;
  emergencyContactRole?: EmergencyTransportContactRole;
  emergencyChannels?: EmergencyNotificationChannel[];
}

export interface TransportOutsourcedConfig {
  providerModel?: OutsourcedProviderModel;
  schoolVisibility?: OutsourcedSchoolVisibility;
  notificationChannels?: ParentNotificationChannel[];
}

export interface TransportPlannedConfig {
  expectedLaunch?: PlannedLaunchTimeline;
  plannedServiceType?: PlannedServiceType;
  launchTimeline?: PlannedLaunchTimeline;
  serviceType?: PlannedServiceType;
}

// ─── PRODUCTION TRANSPORT FLEET, ROUTE & ATTENDANCE TYPES ───────────

export type VehicleStatus =
  | 'active'
  | 'maintenance'
  | 'under_maintenance'
  | 'inactive'
  | 'retired'
  | 'under_registration'
  | 'temporarily_unavailable';

export type VehicleOwnershipModel =
  | 'school_owned'
  | 'leased'
  | 'contracted'
  | 'contractor'
  | 'third_party'
  | 'other';

export interface VehicleInsuranceDetails {
  policyNumber?: string;
  provider?: string;
  expiryDate?: string;
}

export interface VehicleFitnessDetails {
  certificateNumber?: string;
  validityDate?: string;
  validUntilDate?: string;
}

export interface VehiclePermitDetails {
  permitNumber?: string;
  permitType?: string;
  validityDate?: string;
  validUntilDate?: string;
}

export interface VehiclePucDetails {
  pucNumber?: string;
  certificateNumber?: string;
  expiryDate?: string;
  validUntilDate?: string;
}

export type VehicleTrackingMode = 'manual_logs' | 'phone_gps' | 'dedicated_gps';

export interface VehiclePhoneGpsTracking {
  trackingPerson: 'driver' | 'conductor';
  appDeviceStatus?: 'online' | 'offline' | 'standby' | 'app_not_installed';
  lastLocation?: string;
  locationPermissionStatus?: 'granted' | 'denied' | 'prompt' | 'restricted';
  lastLocationUpdatedAt?: string;
}

export interface VehicleDedicatedGpsTracking {
  deviceId: string;
  provider?: string;
  deviceStatus?: 'active' | 'offline' | 'tampered' | 'battery_low' | 'pending_install';
  simIdentifier?: string;
}

export interface TransportVehicle {
  id: string;
  displayName: string;
  registrationNumber: string; // Unique per school
  vehicleType: VehicleTypeKey;
  makeModel?: string; // e.g. Tata Starbus 32, Force Traveller
  capacity: number; // Seating capacity > 0
  status: VehicleStatus;
  ownershipModel: VehicleOwnershipModel;
  ownership?: VehicleOwnershipModel;
  trackingMode?: VehicleTrackingMode;
  phoneGpsTracking?: VehiclePhoneGpsTracking;
  dedicatedGpsTracking?: VehicleDedicatedGpsTracking;
  gpsTracking?: {
    enabled: boolean;
    deviceId?: string;
    provider?: string;
  };
  insuranceDetails?: VehicleInsuranceDetails;
  fitnessCertificateDetails?: VehicleFitnessDetails;
  permitDetails?: VehiclePermitDetails;
  pollutionCertificateDetails?: VehiclePucDetails;
  lastServiceDate?: string;
  nextServiceDate?: string;
  driverStaffId?: string;
  conductorStaffId?: string;
  backupDriverStaffId?: string;
  backupConductorStaffId?: string;
  primaryRouteId?: string;
  assignedRouteIds?: string[];
  isActive?: boolean;
  notes?: string;
  imageUrl?: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TransportStaffRole = 'driver' | 'conductor' | 'female_attendant' | 'chaperone' | 'security_escort';
export type TransportStaffVerificationStatus = 'verified' | 'pending' | 'in_progress';
export type TransportMedicalFitnessStatus = 'fit' | 'in_review' | 'pending' | 'unfit';
export type MedicalFitnessStatus = TransportMedicalFitnessStatus;
export type TransportEmploymentType = 'permanent' | 'contract' | 'daily_wage' | 'third_party';
export type StaffEmploymentType = TransportEmploymentType;

export interface TransportStaffMember {
  id: string;
  schoolId?: string;
  staffRecordId?: string;
  name: string;
  employeeCode?: string;
  phone: string;
  role: TransportStaffRole;
  dateOfBirth?: string;
  address?: string;
  dateOfJoining?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: string;
  verificationStatus: TransportStaffVerificationStatus;
  policeVerificationStatus?: TransportStaffVerificationStatus;
  medicalFitnessStatus?: TransportMedicalFitnessStatus;
  employmentType?: TransportEmploymentType;
  status: 'active' | 'inactive';
  emergencyContact?: string;
  assignedVehicleIds?: string[];
  assignedRouteIds?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportRouteStop {
  id: string;
  stopName: string;
  sequenceOrder: number;
  pickupTime: string;
  dropTime: string;
  latitude?: number;
  longitude?: number;
  landmarkAddress?: string;
  morningPickupEnabled?: boolean;
  afternoonDropEnabled?: boolean;
  studentCount?: number;
  assignedStudentIds?: string[];
  status: 'active' | 'inactive';
  notes?: string;
}

export type RouteTripType = 'morning_only' | 'afternoon_only' | 'both' | 'special';
export type RouteDirection = 'inward' | 'outward' | 'both' | 'circular';

export interface RouteTimingSchedule {
  startTime?: string;
  endTime?: string;
  schoolArrivalTime?: string;
  departureTime?: string;
}

export interface TransportRoute {
  id: string;
  routeCode: string; // Unique per school
  routeName: string;
  assignedVehicleId?: string;
  routeType: RouteTripType;
  routeDirection?: RouteDirection;
  status: 'active' | 'inactive';
  driverStaffId?: string;
  conductorStaffId?: string;
  approximateDistanceKm?: number;
  estimatedDurationMinutes?: number;
  morningTripEnabled: boolean;
  afternoonTripEnabled: boolean;
  morningPickupSchedule?: RouteTimingSchedule;
  afternoonDropSchedule?: RouteTimingSchedule;
  stops: TransportRouteStop[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentTransportAssignment {
  id: string;
  studentId: string;
  vehicleId: string;
  routeId: string;
  pickupStopId?: string;
  pickupTime?: string;
  dropStopId?: string;
  dropTime?: string;
  status: 'active' | 'inactive' | 'suspended';
  effectiveFrom?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BusAttendanceMode =
  | 'manual'
  | 'rfid'
  | 'barcode'
  | 'qr_code'
  | 'mobile_app'
  | 'gps_scan'
  | 'biometric'
  | 'nfc'
  | 'driver_app'
  | 'no_attendance';

export type TransportAttendanceMethod =
  | 'manual'
  | 'driver_conductor_app'
  | 'qr_code'
  | 'rfid'
  | 'gps_geofence'
  | 'integrated_automated';

export type TransportAttendanceTripMode = 'morning' | 'afternoon' | 'both';

export interface TransportAttendanceConfig {
  attendanceMethod?: TransportAttendanceMethod;
  attendanceModes?: BusAttendanceMode[];
  tripsRecorded?: TransportAttendanceTripMode;
  safeDropConfirmation?: boolean;
  parentAlertTriggers?: string[];
}

export type BusAttendanceStatus =
  | 'expected'
  | 'boarded'
  | 'in_transit'
  | 'arrived_at_school'
  | 'dropped'
  | 'absent'
  | 'missed_pickup'
  | 'missed_stop'
  | 'cancelled'
  | 'late'
  | 'unknown'
  | 'not_assigned'
  | 'emergency_drop'
  | 'changed_stop'
  | 'excused'
  | 'emergency_exception'
  | 'unauthorized_boarding';

export interface TransportAttendanceRecord {
  id: string;
  schoolId?: string;
  studentId: string;
  date: string;
  tripType: 'morning' | 'afternoon';
  tripId?: string;
  vehicleId: string;
  routeId: string;
  stopId?: string;
  attendanceStatus: BusAttendanceStatus;
  timestamp: string;
  recordedBy: string;
  attendanceSource: 'manual' | 'app' | 'qr' | 'rfid' | 'gps' | 'rfid_tap' | 'qr_scan' | string;
  notes?: string;
}

export interface TransportAttendanceLog {
  id: string;
  attendanceId: string;
  previousStatus: BusAttendanceStatus;
  newStatus: BusAttendanceStatus;
  modifiedBy: string;
  reason?: string;
  timestamp: string;
}

export type TransportExceptionType =
  | 'vehicle_unavailable'
  | 'driver_absent'
  | 'conductor_absent'
  | 'substitute_vehicle'
  | 'substitute_driver'
  | 'substitute_conductor'
  | 'route_delayed'
  | 'route_cancelled'
  | 'breakdown'
  | 'emergency';

export interface TransportOperationalException {
  id: string;
  schoolId?: string;
  date: string;
  tripType: 'morning' | 'afternoon';
  vehicleId?: string;
  routeId?: string;
  exceptionType: TransportExceptionType;
  substituteVehicleId?: string;
  substituteDriverStaffId?: string;
  substituteConductorStaffId?: string;
  notes?: string;
  reportedBy?: string;
  createdAt: string;
}

export interface TransportData {
  // Primary conditional status
  status?: TransportStatus;
  parentTransportArrangement?: ParentArrangedTransportOption;

  // Configuration sub-sections (Active when status === 'yes')
  serviceModel?: TransportServiceModel;
  otherTransportModel?: string;
  fleet?: TransportFleetConfig;
  tracking?: TransportTrackingConfig;
  routesPlanning?: TransportRoutesPlanningConfig;
  staff?: TransportStaffConfig;
  parentCommunication?: TransportParentCommunicationConfig;
  safetyCompliance?: TransportSafetyConfig;

  // Website-facing transport content
  description?: string;
  shortDescription?: string;
  areasServed?: string[];
  safetyFeatures?: string[];
  customSafetyFeatures?: string[];

  // Individual Fleet & Operations Registries
  vehicles?: TransportVehicle[];
  staffMembers?: TransportStaffMember[];
  routesList?: TransportRoute[];
  studentAssignments?: StudentTransportAssignment[];
  attendanceConfig?: TransportAttendanceConfig;
  attendanceRecords?: TransportAttendanceRecord[];
  attendanceLogs?: TransportAttendanceLog[];
  exceptions?: TransportOperationalException[];

  // Branch-specific configurations
  outsourced?: TransportOutsourcedConfig;
  planned?: TransportPlannedConfig;

  // School Transport Fleet Photography (Genuine WebP Optimized)
  images?: CampusImageData[];
  fleetPhotos?: CampusImageData[];

  // ─────────────────────────────────────────────────────────────
  // BACKWARD-COMPATIBILITY MIRRORS & LEGACY FIELDS
  // ─────────────────────────────────────────────────────────────
  enabled: boolean;
  routesCount?: number;
  vehiclesCount?: number;
  busesCount?: number;
  routes?: TransportRouteItem[];
  gpsTrackingRequired?: boolean;
  parentGpsVisibility?: boolean;
  parentTrackingEnabled?: boolean;
  routeManagementRequired?: boolean;
  pickupPointsRequired?: boolean;
  transportFeeModel?: string;
  driverManagement?: boolean;
  conductorManagement?: boolean;
  emergencyAlertsEnabled?: boolean;
}

export interface FacilityItem {
  name: string;
  description?: string;
  features?: string[];
  isWebsiteVisible: boolean;
}

export type StatCountSource = 'manual' | 'erp';

export interface WebsiteFacilityConfig {
  id: string;
  available: boolean;
  count?: number;
  capacity?: number;
  description?: string;
  features?: string[];
  photos?: CampusImageData[];
  computersCount?: number;
  types?: string[];
  bookCount?: number;
  digitalLibrary?: boolean;
  sports?: string[];
  bedsCount?: number;
  cctvCount?: number;
  is24x7Monitored?: boolean;
  hostelType?: 'boys' | 'girls' | 'both';
  boysCapacity?: number;
  girlsCapacity?: number;
  roomCount?: number;
  roomOccupancy?: number;
  customName?: string;

  // Specific website showcase fields
  interactiveTechnology?: string;
  airConditioned?: boolean;
  audioSystem?: boolean;
  internetConnectivity?: string;
  operatingSystems?: string[];
  lanWifi?: boolean;
  majorEquipment?: string;
  practicalLearningFeatures?: string[];
  newspapersJournals?: boolean;
  digitalResources?: string[];
  readingArea?: string;
  sportsAreasCount?: number;
  fieldsCourts?: string[];
  indoorSports?: string[];
  outdoorSports?: string[];
  hallType?: string;
  stageAvailable?: boolean;
  soundSystem?: boolean;
  projectorDisplay?: boolean;
  firstAidAvailable?: boolean;
  doctorAvailable?: boolean;
  nurseAvailable?: boolean;
  emergencyEquipment?: string[];
  dedicatedRoom?: boolean;
  diningArea?: boolean;
  kitchenFacility?: boolean;
  drinkingWater?: boolean;
  hygieneFeatures?: string[];
  mealServiceType?: string;
  cctvCoverage?: string[];
  securityStaff?: boolean;
  visitorManagement?: boolean;
  wardenAvailable?: boolean;
  cctvSecured?: boolean;
  studyRoom?: boolean;
  diningMess?: boolean;
  recreationFacilities?: string[];
  category?: string;
  extraItems?: WebsiteFacilityConfig[];
}

export interface FacilitiesData {
  // Website-first structured facilities catalog
  facilities?: Record<string, WebsiteFacilityConfig>;

  // Essential Institutional Campus Statistics (Manually entered or optional ERP sync)
  classroomsCount?: number;
  classroomsCountSource?: StatCountSource;
  classroomsCountSyncedAt?: string;
  totalClassrooms?: number;

  totalStudents?: number;
  totalStudentsSource?: StatCountSource;
  totalStudentsSyncedAt?: string;

  activeStudents?: number;
  activeStudentsSource?: StatCountSource;
  activeStudentsSyncedAt?: string;

  totalTeachers?: number;
  totalTeachersSource?: StatCountSource;
  totalTeachersSyncedAt?: string;

  totalNonTeachingStaff?: number;
  totalNonTeachingStaffSource?: StatCountSource;
  totalNonTeachingStaffSyncedAt?: string;
  nonTeachingStaff?: number;
  nonTeachingStaffSource?: StatCountSource;
  nonTeachingStaffSyncedAt?: string;

  /** Historical offline students / alumni registered before digital records */
  historicalStudents?: number;
  historicalStudentsSource?: StatCountSource;
  historicalStudentsSyncedAt?: string;
  historicalPreDigitalStudents?: number;

  // Progressive Disclosure: More Institutional Statistics
  studentCapacity?: number;
  averageClassSize?: number;
  studentTeacherRatio?: string;
  establishedYear?: number;
  gradesOffered?: string;
  sectionsPerGrade?: string | number;
  totalCampuses?: number;

  // Campus Amenities & Facilities Highlights
  computerLab?: boolean;
  scienceLab?: boolean;
  library?: boolean;
  auditorium?: boolean;
  playground?: boolean;
  sportsFacilities?: string[];
  medicalRoom?: boolean;
  cafeteria?: boolean;
  smartClassrooms?: boolean;
  cctvInstalled?: boolean;
  securityStaff?: boolean;
  visitorManagement?: boolean;
  biometricAttendanceHardware?: boolean;
  availableFacilities?: FacilityItem[];
  customFacilities?: FacilityItem[];
  images?: CampusImageData[];
  facilityPhotos?: CampusImageData[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 14: Library Management System Types
// ─────────────────────────────────────────────────────────────────────────────

export type LibraryStatus =
  | 'yes_physical'
  | 'yes_physical_digital'
  | 'digital_only'
  | 'outsourced'
  | 'planned'
  | 'no_library'
  | 'not_decided';

export type FutureLibraryPlan =
  | 'no_plans'
  | 'planned_in_future'
  | 'not_decided';

export type PlannedAvailability =
  | 'this_academic_session'
  | 'next_academic_session'
  | 'within_3_months'
  | 'within_6_months'
  | 'within_1_year'
  | 'date_not_decided';

export type PlannedLibraryType =
  | 'physical'
  | 'physical_digital'
  | 'digital'
  | 'not_decided';

export type DigitalResourceType =
  | 'ebooks'
  | 'online_journals'
  | 'research_databases'
  | 'educational_videos'
  | 'digital_newspapers'
  | 'digital_magazines'
  | 'institutional_repository'
  | 'other';

export type DigitalAccessModel =
  | 'student_login'
  | 'staff_login'
  | 'parent_login'
  | 'public_access'
  | 'mixed_access'
  | 'to_be_configured_later';

export type BookIdentificationMethod =
  | 'manual_accession'
  | 'barcode'
  | 'rfid'
  | 'barcode_rfid'
  | 'not_decided';

export type BarcodeScannerAvailability =
  | 'already_available'
  | 'scanner_required'
  | 'existing_plus_additional'
  | 'to_be_configured_later';

export type BarcodeGeneration =
  | 'system_generated'
  | 'existing_barcodes'
  | 'both'
  | 'to_be_configured_later';

export type RfidInfrastructure =
  | 'already_available'
  | 'rfid_required'
  | 'partially_available'
  | 'to_be_configured_later';

export type RfidUsageOption =
  | 'book_identification'
  | 'self_checkout'
  | 'entry_exit_security'
  | 'inventory_auditing'
  | 'other';

export type LendingPreference =
  | 'yes'
  | 'no'
  | 'to_be_configured_later';

export type LoanDurationOption =
  | '7_days'
  | '14_days'
  | '21_days'
  | '30_days'
  | 'custom';

export type RenewalPolicyOption =
  | 'allowed'
  | 'not_allowed'
  | 'configured_per_book'
  | 'to_be_decided';

export type ReservationAccessOption =
  | 'students'
  | 'faculty'
  | 'staff'
  | 'students_faculty'
  | 'all_library_members';

export type OverdueFineType =
  | 'no_fine'
  | 'per_day'
  | 'per_book'
  | 'per_day_per_book'
  | 'to_be_configured_later';

export type FineGracePeriodOption =
  | 'no_grace'
  | '1_day'
  | '2_days'
  | '3_days'
  | '7_days'
  | 'custom';

export type LostDamagedPolicy =
  | 'replacement_required'
  | 'replacement_cost'
  | 'fixed_penalty'
  | 'manual_review'
  | 'to_be_configured_later';

export type EligibleLibraryMember =
  | 'students'
  | 'teaching_faculty'
  | 'non_teaching_staff'
  | 'administrators'
  | 'alumni'
  | 'other';

export type LibraryManagementStaff =
  | 'dedicated_librarian'
  | 'teacher_managed'
  | 'admin_staff_managed'
  | 'outsourced'
  | 'shared_responsibility'
  | 'to_be_configured_later';

export type OutsourcedServiceModel =
  | 'partner_institution'
  | 'commercial_library'
  | 'public_library'
  | 'other';

export type OutsourcedSchoolAccess =
  | 'student_access'
  | 'faculty_access'
  | 'both'
  | 'other';

export type OutsourcedDigitalIntegration =
  | 'api_digital'
  | 'manual_access'
  | 'no_digital'
  | 'to_be_configured_later';

export type LibrarySoftwareSystem =
  | 'school_erp_library'
  | 'existing_software'
  | 'standalone_software'
  | 'spreadsheet_manual'
  | 'no_software'
  | 'to_be_configured_later';

export type InventoryManagementType =
  | 'fully_digital'
  | 'partially_digital'
  | 'manual'
  | 'to_be_configured_later';

export type InventoryAuditFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'annually'
  | 'as_needed'
  | 'to_be_decided';

export type ParentVisibilityItem =
  | 'issued_books'
  | 'due_dates'
  | 'overdue_books'
  | 'fines'
  | 'reservations'
  | 'reading_history';

export type LibraryAutomationFeature =
  | 'due_date_reminders'
  | 'overdue_notifications'
  | 'book_issue_notifications'
  | 'book_return_notifications'
  | 'reservation_notifications'
  | 'fine_notifications'
  | 'inventory_alerts'
  | 'none'
  | 'to_be_configured_later';

export type LibraryNotificationChannel =
  | 'whatsapp'
  | 'sms'
  | 'push_notification'
  | 'parent_app'
  | 'email';

export interface PhysicalLibraryConfig {
  estimatedPhysicalBookCount?: number;
  approximateSeatingCapacity?: number;
  readingSeatsCount?: number;
  libraryRoomsCount?: number;
}

export interface DigitalLibraryConfig {
  isAvailable?: boolean;
  resources?: DigitalResourceType[];
  otherResourceDescription?: string;
  accessModel?: DigitalAccessModel;
}

export interface BookIdentificationConfig {
  method?: BookIdentificationMethod;
  scannerStatus?: BarcodeScannerAvailability;
  barcodeGeneration?: BarcodeGeneration;
  rfidStatus?: RfidInfrastructure;
  rfidUsage?: RfidUsageOption[];
}

export interface LibraryCirculationConfig {
  lendingAvailable?: LendingPreference;
  maxBooksPerStudent?: number;
  maxBooksPerStaff?: number;
  loanDurationOption?: LoanDurationOption;
  customLoanDurationDays?: number;
  renewalPolicy?: RenewalPolicyOption;
  maxRenewals?: number;
  canReserveBooks?: 'yes' | 'no' | 'to_be_configured_later';
  reservationAccess?: ReservationAccessOption;
}

export interface LibraryFinePolicyConfig {
  overdueFineType?: OverdueFineType;
  fineAmount?: number;
  gracePeriodOption?: FineGracePeriodOption;
  customGracePeriodDays?: number;
  lostDamagedPolicy?: LostDamagedPolicy;
  lostBookFixedPenalty?: number;
  lostBookReplacementCostHandling?: string;
}

export interface LibraryMembershipConfig {
  eligibleMembers?: EligibleLibraryMember[];
  otherMemberDescription?: string;
}

export interface LibraryStaffingConfig {
  managementModel?: LibraryManagementStaff;
}

export interface OutsourcedLibraryConfig {
  serviceModel?: OutsourcedServiceModel;
  schoolAccess?: OutsourcedSchoolAccess;
  digitalIntegration?: OutsourcedDigitalIntegration;
}

export interface LibrarySoftwareConfig {
  system?: LibrarySoftwareSystem;
  existingSystemName?: string;
  integrationRequired?: 'yes' | 'no' | 'to_be_decided';
}

export interface LibraryInventoryConfig {
  managementType?: InventoryManagementType;
  auditFrequency?: InventoryAuditFrequency;
}

export interface LibraryVisibilityConfig {
  parentVisibilityEnabled?: 'yes' | 'no' | 'to_be_decided';
  visibleItems?: ParentVisibilityItem[];
}

export interface LibraryAutomationConfig {
  features?: LibraryAutomationFeature[];
  channels?: LibraryNotificationChannel[];
}

export interface LibraryData {
  // Primary conditional status
  status?: LibraryStatus;

  // Branch configurations (preserved across switches)
  noLibraryFuturePlan?: FutureLibraryPlan;
  planned?: {
    availability?: PlannedAvailability;
    plannedType?: PlannedLibraryType;
  };
  physical?: PhysicalLibraryConfig;
  digital?: DigitalLibraryConfig;
  identification?: BookIdentificationConfig;
  circulation?: LibraryCirculationConfig;
  fines?: LibraryFinePolicyConfig;
  membership?: LibraryMembershipConfig;
  staffing?: LibraryStaffingConfig;
  outsourced?: OutsourcedLibraryConfig;
  software?: LibrarySoftwareConfig;
  inventory?: LibraryInventoryConfig;
  visibility?: LibraryVisibilityConfig;
  automation?: LibraryAutomationConfig;

  // Legacy & downstream backwards compatibility mirrors
  enabled: boolean;
  bookCountEstimate?: number;
  librariesCount?: number;
  barcodeScannerIntegration?: boolean;
  barcodeScannerRequired?: boolean;
  rfidRequired?: boolean;
  digitalLibraryEnabled?: boolean;
  issueReturnTrackingNeeded?: boolean;
  fineSystemEnabled?: boolean;
  studentBorrowLimit?: number;
  staffBorrowLimit?: number;
  categories?: string[];
  images?: CampusImageData[];
}

// ─── Hostel & Residential Boarding Models (Section 15) ─────────────────────

export type ResidentialModel =
  | 'school_operated'
  | 'managed_facility'
  | 'third_party'
  | 'mixed';

export type GenderAccommodationModel =
  | 'boys_only'
  | 'girls_only'
  | 'separate_wings'
  | 'co_educational';

export type ResidentialStudentEligibility =
  | 'all_classes'
  | 'grade_6_above'
  | 'middle_and_secondary'
  | 'senior_secondary_only'
  | 'custom';

export type HostelBuildingGender = 'boys' | 'girls' | 'co_ed' | 'staff_quarters';

export type HostelBuildingStatus = 'active' | 'inactive' | 'maintenance';

export interface HostelBuilding {
  id: string;
  name: string;
  code: string;
  genderCategory: HostelBuildingGender;
  capacity: number;
  floorsCount?: number;
  wardenStaffId?: string;
  assistantWardenStaffId?: string;
  supervisorStaffId?: string;
  status: HostelBuildingStatus;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export type HostelRoomCategory =
  | 'single'
  | 'double'
  | 'triple'
  | 'four_bed'
  | 'dormitory'
  | 'custom';

export interface HostelRoom {
  id: string;
  buildingId: string;
  roomNumber: string;
  floor: number | string;
  category: HostelRoomCategory;
  capacity: number;
  genderCategory: 'boys' | 'girls' | 'any';
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
}

export type HostelBedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export interface HostelBed {
  id: string;
  roomId: string;
  buildingId: string;
  bedIdentifier: string;
  status: HostelBedStatus;
  assignedStudentId?: string;
  assignmentStartDate?: string;
  assignmentEndDate?: string;
}

export type ResidentialAssignmentStatus =
  | 'active_resident'
  | 'on_leave'
  | 'temporarily_away'
  | 'checked_out'
  | 'withdrawn';

export interface ResidentialStudentAssignment {
  id: string;
  studentId: string;
  buildingId: string;
  roomId: string;
  bedId?: string;
  status: ResidentialAssignmentStatus;
  startDate: string;
  endDate?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export type HostelAttendanceStatus =
  | 'present'
  | 'absent'
  | 'on_leave'
  | 'late_return'
  | 'excused'
  | 'checked_out'
  | 'emergency';

export interface HostelAttendanceRecord {
  id: string;
  studentId: string;
  buildingId: string;
  roomId: string;
  bedId?: string;
  date: string;
  attendanceStatus: HostelAttendanceStatus;
  timestamp: string;
  markedBy: string;
  source: 'manual' | 'biometric' | 'rfid' | 'mobile_app';
  notes?: string;
}

export type ResidentialLeaveType =
  | 'out_pass'
  | 'weekend_leave'
  | 'emergency_leave'
  | 'vacation'
  | 'medical';

export type ResidentialLeaveStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'out'
  | 'returned'
  | 'overdue';

export interface ResidentialLeaveRecord {
  id: string;
  studentId: string;
  leaveType: ResidentialLeaveType;
  startDateTime: string;
  expectedReturnDateTime: string;
  actualReturnDateTime?: string;
  reason: string;
  approvedByStaffId?: string;
  status: ResidentialLeaveStatus;
  guardianContactAcknowledged?: boolean;
  notes?: string;
}

export interface HostelCurfewPolicy {
  curfewEnabled: boolean;
  weekdayCurfewTime?: string;
  weekendCurfewTime?: string;
  lateReturnPolicy?: string;
  escalationContactBehavior?: string;
}

export interface HostelMessConfig {
  messAvailable: boolean;
  diningHallName?: string;
  mealsOffered?: Array<'breakfast' | 'lunch' | 'evening_snack' | 'dinner'>;
  dietarySupport?: Array<'vegetarian' | 'non_vegetarian' | 'jain' | 'vegan' | 'special_medical'>;
  messOperatorModel?: 'in_house' | 'contractor' | 'catered' | 'mixed';
  notes?: string;
}

export interface HostelSafetyEmergencyConfig {
  emergencyContactLeadName?: string;
  emergencyContactPhone?: string;
  medicalContactDetails?: string;
  nightSupervisorStaffId?: string;
  fireSafetyProcedureRef?: string;
  nearestHospitalContact?: string;
}

export interface HostelData {
  // Operational and Status Engine
  status?: 'not_applicable' | 'incomplete' | 'partially_configured' | 'complete' | 'active' | 'inactive' | 'planned';
  residentialModel?: ResidentialModel;
  genderAccommodation?: GenderAccommodationModel;
  studentEligibility?: ResidentialStudentEligibility;
  totalCapacity?: number;
  waitlistCount?: number;

  // Hierarchical Residential Entities
  buildings?: HostelBuilding[];
  rooms?: HostelRoom[];
  beds?: HostelBed[];
  residentAssignments?: ResidentialStudentAssignment[];
  attendanceRecords?: HostelAttendanceRecord[];
  leaveRecords?: ResidentialLeaveRecord[];

  // Institutional Policies
  curfewPolicy?: HostelCurfewPolicy;
  messConfig?: HostelMessConfig;
  safetyEmergency?: HostelSafetyEmergencyConfig;

  // Backward Compatible Legacy Fields
  enabled: boolean;
  boysHostel?: boolean;
  girlsHostel?: boolean;
  hostelsCount?: number;
  roomTypes?: string[];
  wardensAssigned?: boolean;
  hostelFeeMonthly?: number;
  messIncluded?: boolean;
  attendanceTracking?: boolean;
  visitorManagement?: boolean;
  hostelNames?: string[];
  capacityBoys?: number;
  capacityGirls?: number;
  rulesNotes?: string;
  monthlyFee?: number;
  images?: CampusImageData[];
}

// ─── SECTION 16: INSTITUTIONAL COMMUNICATION CONFIGURATION ───────────────────

export type CommunicationChannelKey =
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'push'
  | 'parent_portal'
  | 'student_portal'
  | 'website_notices'
  | 'in_app_notifications'
  | 'voice_ivr'
  | 'emergency_broadcast';

export type AudienceGroupKey =
  | 'parents'
  | 'students'
  | 'faculty'
  | 'non_teaching_staff'
  | 'administrators'
  | 'transport_staff'
  | 'hostel_staff'
  | 'emergency_contacts'
  | 'management';

export type NotificationCategoryGroupKey =
  | 'academic'
  | 'admissions'
  | 'fees'
  | 'transport'
  | 'general'
  | 'emergency';

export type NotificationTypeKey =
  // Academic
  | 'attendance'
  | 'examination'
  | 'result_publication'
  | 'homework_assignment'
  | 'academic_announcements'
  | 'timetable_changes'
  // Admissions
  | 'application_received'
  | 'application_status'
  | 'document_verification'
  | 'admission_confirmation'
  | 'admission_fee_reminder'
  // Fees
  | 'fee_due_reminder'
  | 'payment_confirmation'
  | 'payment_failure'
  | 'fee_receipt'
  | 'overdue_payment'
  // Transport
  | 'vehicle_started'
  | 'approaching_stop'
  | 'student_boarded'
  | 'student_dropped'
  | 'route_delay'
  | 'route_cancellation'
  | 'vehicle_breakdown'
  | 'emergency_transport_alert'
  // General
  | 'circulars'
  | 'announcements'
  | 'events'
  | 'holidays'
  | 'school_closure'
  | 'important_notices'
  // Emergency
  | 'emergency_alert'
  | 'severe_weather'
  | 'campus_incident'
  | 'student_safety_incident'
  | 'evacuation'
  | 'urgent_parent_communication';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export type ProviderIntegrationStatus =
  | 'configured'
  | 'pending_configuration'
  | 'not_required'
  | 'disabled'
  | 'inherited';

export interface ChannelDetailConfig {
  enabled: boolean;
  status: ProviderIntegrationStatus;
  provider?: string;
  notes?: string;
}

export interface NotificationTypePolicyItem {
  key: NotificationTypeKey;
  name: string;
  category: NotificationCategoryGroupKey;
  enabled: boolean;
  defaultChannels: CommunicationChannelKey[];
  priority: NotificationPriority;
  audiences: AudienceGroupKey[];
  requiresImmediateDelivery: boolean;
  allowFallback: boolean;
}

export interface NotificationDeliveryStrategy {
  enabled: boolean;
  primaryChannel: CommunicationChannelKey;
  fallbackChannel: CommunicationChannelKey;
  secondaryFallbackChannel?: CommunicationChannelKey;
  fallbackTimeoutSeconds: number;
  retryAttempts: number;
  deduplicationWindowMinutes?: number;
}

export interface EmergencyCommunicationConfig {
  enabled: boolean;
  emergencyChannels: CommunicationChannelKey[];
  emergencyAudiences: AudienceGroupKey[];
  requireConfirmationBeforeBroadcast: boolean;
  emergencyPriority: 'critical' | 'high' | 'normal';
  multiChannelSimultaneousDispatch: boolean;
  overrideQuietHours: boolean;
}

export interface CommunicationScheduleConfig {
  routineAllowedFrom: string;
  routineAllowedUntil: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  weekendCommunication: 'allowed' | 'restricted' | 'emergency_only';
  holidayCommunication: 'allowed' | 'restricted' | 'emergency_only';
  emergencyOverridesQuietHours: boolean;
}

export interface CommunicationConsentConfig {
  parentConsentRequired: boolean;
  studentConsentRequired: boolean;
  marketingPromotionalOptIn: boolean;
  transactionalMandatory: boolean;
  emergencyMandatory: boolean;
  dltComplianceConsent: boolean;
  allowParentChannelPreferences: boolean;
}

export interface CommunicationSenderIdentity {
  schoolDisplayName: string;
  smsSenderId: string;
  whatsappDisplayName: string;
  emailSenderName: string;
  officialEmail: string;
  officialPhone: string;
  emergencyContactPhone: string;
  replyToEmail: string;
  isInheritedFromProfile?: boolean;
}

export interface WhatsAppProviderConfig {
  provider: 'meta_cloud_api' | 'gupshup' | 'twilio' | 'other';
  status: ProviderIntegrationStatus;
  senderNumber?: string;
  accountName?: string;
  businessAccountId?: string;
  templateStatus?: 'approved' | 'pending' | 'not_submitted';
}

export interface SmsProviderConfig {
  provider: 'msg91' | 'twilio' | 'fast2sms' | 'textlocal' | 'other';
  status: ProviderIntegrationStatus;
  senderId?: string;
  dltEntityId?: string;
  dltHeaderStatus?: 'approved' | 'pending' | 'not_started';
}

export interface EmailProviderConfig {
  provider: 'resend' | 'sendgrid' | 'amazon_ses' | 'google_workspace' | 'smtp' | 'other';
  status: ProviderIntegrationStatus;
  senderEmail?: string;
  senderName?: string;
  replyToEmail?: string;
  verifiedDomain?: boolean;
}

export interface PushProviderConfig {
  provider: 'firebase_fcm' | 'onesignal' | 'expo' | 'other';
  status: ProviderIntegrationStatus;
  platforms?: ('android' | 'ios' | 'web')[];
}

export interface VoiceProviderConfig {
  provider: 'exotel' | 'twilio' | 'other';
  status: ProviderIntegrationStatus;
  callerId?: string;
}

export interface CommunicationProvidersConfig {
  whatsapp?: WhatsAppProviderConfig;
  sms?: SmsProviderConfig;
  email?: EmailProviderConfig;
  push?: PushProviderConfig;
  voice?: VoiceProviderConfig;
}

export interface CommunicationTemplatesConfig {
  templatePolicy: 'standard_system' | 'school_customized' | 'approval_required';
  categoriesRequiringApproval?: string[];
  dltTemplatesRegistered?: boolean;
  notes?: string;
}

export interface CommunicationGovernanceConfig {
  whoCanSendGeneralAnnouncements:
    | 'administrators_only'
    | 'principal_only'
    | 'authorized_staff'
    | 'department_heads'
    | 'teachers';
  whoCanSendEmergencyBroadcasts:
    | 'principal_only'
    | 'administrators'
    | 'authorized_emergency_operators';
  requireApprovalForBulkMessages: boolean;
  requireApprovalForEmergencyMessages: boolean;
  maintainAuditLogging: boolean;
}

export interface CommunicationData {
  // Legacy / Backward Compatibility Mirrors
  whatsappIntegration?: boolean;
  smsIntegration?: boolean;
  emailIntegration?: boolean;
  pushNotifications?: boolean;
  parentAnnouncements?: boolean;
  teacherAnnouncements?: boolean;
  emergencyBroadcasts?: boolean;
  circulars?: boolean;
  notices?: boolean;
  newsletters?: boolean;
  channelsRequired?: string[];
  providerPreference?: string;
  parentCommunicationEnabled?: boolean;
  staffCommunicationEnabled?: boolean;
  emergencyAnnouncementsEnabled?: boolean;

  // Enterprise Structured Communication Engine
  enabledChannels?: CommunicationChannelKey[];
  channelConfigs?: Partial<Record<CommunicationChannelKey, ChannelDetailConfig>>;
  audiences?: AudienceGroupKey[];
  audienceChannelMatrix?: Partial<Record<AudienceGroupKey, CommunicationChannelKey[]>>;
  notificationPolicies?: Partial<Record<NotificationTypeKey, NotificationTypePolicyItem>>;
  deliveryStrategy?: NotificationDeliveryStrategy;
  emergency?: EmergencyCommunicationConfig;
  schedule?: CommunicationScheduleConfig;
  consent?: CommunicationConsentConfig;
  senderIdentity?: CommunicationSenderIdentity;
  providers?: CommunicationProvidersConfig;
  templates?: CommunicationTemplatesConfig;
  governance?: CommunicationGovernanceConfig;
}

export interface CmsWorkflowData {
  managingRoles: string[];
  roles?: string[];
  whoCanPublish?: string[];
  whoCanDraft?: string[];
  approvalWorkflow?: 'single_step' | 'two_step_approval' | 'direct_publish';
  revisionHistoryRequired?: boolean;
  scheduledPublishing?: boolean;
  estimatedCmsUsers: number;
  requiresApprovalBeforePublish: boolean;
  contentCategories: string[];
  mediaUploadWorkflowNotes?: string;
}

export interface DomainHostingData {
  alreadyOwnsDomain?: boolean;
  needsNewDomain?: boolean;
  hasExistingDomain?: boolean;
  existingDomainName?: string;
  preferredNewDomainName?: string;
  preferredDomain?: string;
  currentRegistrar?: string;
  domainExpiryDate?: string;
  dnsManagementAccessAvailable?: boolean;
  hasDnsAccess?: boolean;
  existingHosting?: boolean;
  hostingMigrationRequired?: boolean;
  currentHostingProvider?: string;
  officialEmailDomainNeeded?: boolean;
  emailSuite?: 'google_workspace' | 'microsoft_365' | 'cpanel_webmail' | 'existing_provider' | 'new_needed' | 'none';
  schoolEmailProvider?: 'google_workspace' | 'microsoft_365' | 'cpanel_webmail' | 'none';
  socialMediaLinks?: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  domainChoice?: DomainChoice;
  decideLater?: boolean;
  selectedDomainQuote?: QuoteSelectedDomain | null;
}

export type MigrationSourceId =
  | 'excel'
  | 'csv'
  | 'tally'
  | 'legacy_erp'
  | 'school_management_software'
  | 'paper_records'
  | 'google_sheets'
  | 'other';

export type MigrationDataCategoryId =
  | 'student_records'
  | 'parent_guardian_records'
  | 'staff_records'
  | 'attendance_records'
  | 'examination_records'
  | 'fees_records'
  | 'admission_records'
  | 'transport_records'
  | 'library_records'
  | 'hostel_records'
  | 'inventory_records'
  | 'hr_payroll_records'
  | 'other';

export type HistoricalDataDuration =
  | 'current_year_only'
  | '1_year'
  | '2_years'
  | '3_years'
  | '4_5_years'
  | 'more_than_5_years'
  | 'not_sure';

export type DataReadinessLevel =
  | 'clean_structured'
  | 'mostly_structured'
  | 'requires_cleaning'
  | 'highly_inconsistent'
  | 'unknown';

export type MigrationFileFormat =
  | 'xls_xlsx'
  | 'csv'
  | 'pdf'
  | 'xml'
  | 'database_export'
  | 'tally_export'
  | 'other';

export type DataQualityIssueId =
  | 'duplicate_records'
  | 'missing_student_ids'
  | 'missing_parent_info'
  | 'inconsistent_names'
  | 'inconsistent_phone_numbers'
  | 'missing_dates'
  | 'inconsistent_class_sections'
  | 'different_formats_across_years'
  | 'missing_historical_records'
  | 'no_major_issues'
  | 'other';

export type MigrationReadinessOption =
  | 'ready_for_migration'
  | 'minor_cleanup_required'
  | 'significant_cleanup_required'
  | 'requires_assessment'
  | 'not_currently_available';

export type DataAccessAvailability =
  | 'yes_immediately'
  | 'yes_after_preparation'
  | 'partially'
  | 'no'
  | 'not_sure';

export type MigrationExecutionPreference =
  | 'full_migration'
  | 'selective_migration'
  | 'current_year_only'
  | 'historical_migration'
  | 'assessment_first'
  | 'not_sure';

export interface MigrationRecordVolumes {
  students?: number | null;
  guardians?: number | null;
  staff?: number | null;
  historicalAcademic?: number | null;
  financial?: number | null;
  total?: number | null;
}

export interface DataMigrationData {
  // A. Current System / Data Sources
  sources?: MigrationSourceId[];
  otherSourceDetails?: string;
  hasMultipleSources?: boolean;

  // Conditional Data Source Details
  legacyErpName?: string;
  legacyErpVersion?: string;
  tallyVersion?: string;
  tallyExportType?: string;
  spreadsheetsFileCount?: number | null;
  digitizationRequired?: boolean;
  digitizationNotes?: string;

  // B. Data Categories to Migrate
  dataCategories?: MigrationDataCategoryId[];
  otherCategoryDetails?: string;

  // C. Record Volumes
  recordVolumes?: MigrationRecordVolumes;

  // D. Historical Data
  historicalYears?: HistoricalDataDuration;
  historicalYearCount?: number | null;

  // E. Data Format / File Readiness
  dataStructureCondition?: DataReadinessLevel;
  fileFormats?: MigrationFileFormat[];
  otherFormatDetails?: string;

  // F. Data Quality Challenges
  dataQualityIssues?: DataQualityIssueId[];
  otherQualityIssueDetails?: string;

  // G. Migration Readiness
  readiness?: MigrationReadinessOption;
  assessmentNeedsDescription?: string;

  // H. Data Ownership / Access
  dataAccess?: DataAccessAvailability;
  dataAccessExplanation?: string;

  // I. Migration Preference
  migrationPreference?: MigrationExecutionPreference;

  // J. Additional Requirements / Notes
  additionalNotes?: string;

  // Legacy fields for backward compatibility with database provisioning
  hasExistingData?: boolean;
  currentSystemType?: 'excel_spreadsheets' | 'older_desktop_software' | 'cloud_software' | 'paper_registers';
  currentSoftwareName?: string;
  sourceType?: 'excel' | 'csv' | 'older_erp' | 'database' | 'tally' | 'other_software' | 'paper' | 'none';
  categoriesToMigrate?: {
    students?: boolean;
    staff?: boolean;
    fees?: boolean;
    attendance?: boolean;
    examination?: boolean;
    library?: boolean;
    transport?: boolean;
    admission?: boolean;
    alumni?: boolean;
  };
  recordCounts?: {
    studentsCount?: number;
    staffCount?: number;
    alumniCount?: number;
  };
  migrateStudentRecords?: boolean;
  migrateStaffRecords?: boolean;
  migrateHistoricalFeeLedgers?: boolean;
  estimatedStudentRecordsToImport?: number;
  migrationReadinessStatus?: 'ready_files' | 'needs_formatting_help' | 'data_cleanup_in_progress';
}

export type IntegrationRequirementStatus =
  | 'required'
  | 'optional'
  | 'not_required'
  | 'future'
  | 'not_decided';

export type PaymentGatewayProvider =
  | 'razorpay'
  | 'phonepe'
  | 'payu'
  | 'other'
  | 'none'
  | 'not_decided';

export type PaymentEnvironment =
  | 'test_sandbox'
  | 'production'
  | 'not_decided';

export type PaymentIntendedUse =
  | 'online_fees'
  | 'admission_payments'
  | 'other_school_payments';

export interface PaymentIntegrationConfig {
  status: IntegrationRequirementStatus;
  provider: PaymentGatewayProvider;
  environment: PaymentEnvironment;
  intendedUses: PaymentIntendedUse[];
  otherProvider?: string;
}

export type SmsGatewayProvider =
  | 'msg91'
  | 'fast2sms'
  | 'textlocal'
  | 'other'
  | 'none'
  | 'not_decided';

export type SmsIntendedUse =
  | 'otp'
  | 'attendance_alerts'
  | 'fee_reminders'
  | 'admission_notifications'
  | 'emergency_alerts'
  | 'general_sms'
  | 'other';

export interface SmsIntegrationConfig {
  status: IntegrationRequirementStatus;
  provider: SmsGatewayProvider;
  intendedUses: SmsIntendedUse[];
  otherProvider?: string;
}

export type WhatsAppProvider =
  | 'meta_cloud_api'
  | 'gupshup'
  | 'other'
  | 'none'
  | 'not_decided';

export type WhatsAppBusinessAccountStatus =
  | 'yes'
  | 'no'
  | 'need_setup'
  | 'not_sure';

export type WhatsAppNumberStatus =
  | 'already_configured'
  | 'need_configuration'
  | 'not_sure';

export type WhatsAppIntendedUse =
  | 'admission_communication'
  | 'fee_reminders'
  | 'attendance_alerts'
  | 'transport_notifications'
  | 'emergency_communication'
  | 'general_communication'
  | 'other';

export interface WhatsAppIntegrationConfig {
  status: IntegrationRequirementStatus;
  provider: WhatsAppProvider;
  businessAccountStatus: WhatsAppBusinessAccountStatus;
  phoneNumberStatus: WhatsAppNumberStatus;
  intendedUses: WhatsAppIntendedUse[];
  otherProvider?: string;
}

export type BiometricRequirementStatus =
  | 'required'
  | 'not_required'
  | 'existing'
  | 'planning_to_install'
  | 'not_decided';

export type BiometricDeviceType =
  | 'fingerprint'
  | 'face_recognition'
  | 'rfid'
  | 'other'
  | 'not_sure';

export type BiometricApiAvailability =
  | 'yes'
  | 'no'
  | 'not_sure';

export interface BiometricIntegrationConfig {
  status: BiometricRequirementStatus;
  deviceType: BiometricDeviceType;
  deviceCount?: number;
  vendor?: string;
  apiAvailability: BiometricApiAvailability;
  otherDeviceType?: string;
}

export type DigiLockerRequirementStatus =
  | 'required'
  | 'not_required'
  | 'future'
  | 'not_decided';

export type DigiLockerIntendedUse =
  | 'student_documents'
  | 'certificates'
  | 'identity_verification'
  | 'academic_records'
  | 'other';

export interface DigiLockerIntegrationConfig {
  status: DigiLockerRequirementStatus;
  intendedUses: DigiLockerIntendedUse[];
}

export interface AdditionalIntegrationItem {
  id: string;
  name: string;
  description: string;
  requirementStatus: IntegrationRequirementStatus;
}

export interface IntegrationsData {
  // Rich Section 19 planning configuration
  payment?: PaymentIntegrationConfig;
  sms?: SmsIntegrationConfig;
  whatsapp?: WhatsAppIntegrationConfig;
  biometrics?: BiometricIntegrationConfig;
  digilocker?: DigiLockerIntegrationConfig;
  additionalIntegrations?: AdditionalIntegrationItem[];

  // Legacy & downstream backwards compatibility mirrors
  selectedIntegrations?: {
    razorpay?: boolean;
    whatsapp?: boolean;
    sms?: boolean;
    googleWorkspace?: boolean;
    microsoft365?: boolean;
    googleMaps?: boolean;
    gpsTracking?: boolean;
    biometric?: boolean;
    rfid?: boolean;
    barcode?: boolean;
    digilocker?: boolean;
    other?: string[];
  };
  paymentGateway?: 'razorpay' | 'phonepe' | 'payu' | 'none';
  smsGateway?: 'msg91' | 'fast2sms' | 'textlocal' | 'none';
  whatsappProvider?: 'meta_cloud_api' | 'gupshup' | 'none';
  biometricAttendanceSync?: boolean;
  accountingSoftware?: 'tally' | 'busy' | 'none';
}

export type MobileAppAudienceId =
  | 'parent_app'
  | 'student_app'
  | 'teacher_app'
  | 'admin_app'
  | 'driver_app'
  | 'conductor_app'
  | 'management_app';

export type MobileAppPlatformId = 'android' | 'ios' | 'pwa';

export type MobileAppAuthMethod =
  | 'mobile_otp'
  | 'email_password'
  | 'username_password'
  | 'school_id_password'
  | 'multiple';

export interface MobileAppAuthenticationConfig {
  authMethod: MobileAppAuthMethod;
  authMethods?: string[];
  rememberDevice?: boolean;
  biometricLogin?: boolean;
  forgotPasswordEnabled?: boolean;
  accountSwitching?: boolean;
  multiChildSupport?: boolean;
  roleBasedAccess?: boolean;
  multipleGuardians?: boolean;
}

export interface MobileAppPushNotificationsConfig {
  enabled: boolean;
  categories: string[];
  priority: 'normal' | 'high' | 'critical';
  emergencyMandatory: boolean;
  otherCategoryText?: string;
}

export interface MobileAppTransportConfig {
  features: string[];
  trackingMethod: 'dedicated_gps' | 'driver_phone' | 'hybrid' | 'not_decided';
  dedicatedGpsDeviceId?: string;
  driverPhoneTrackingConsent?: boolean;
}

export interface MobileAppBrandingConfig {
  appDisplayName: string;
  iconPreference: 'school_logo' | 'custom_icon';
  customIconUrl?: string;
  themeInherited: boolean;
  brandPrimaryColor?: string;
}

export interface MobileAppOfflineConfig {
  enabled: 'yes' | 'no' | 'not_decided';
  features: string[];
}

export type MobileAppDistributionId =
  | 'play_store'
  | 'app_store'
  | 'internal'
  | 'pwa_only'
  | 'not_decided';

export interface MobileAppData {
  // Legacy backward-compatible fields
  parentAppRequired?: boolean;
  studentAppRequired?: boolean;
  teacherAppRequired?: boolean;
  adminAppRequired?: boolean;
  platforms?: {
    android: boolean;
    ios: boolean;
    pwa: boolean;
  };
  pushNotificationsRequired?: boolean;
  requiredFeatures?: string[];

  // Production-grade structured requirements model
  requiredApps?: MobileAppAudienceId[];
  supportedPlatforms?: MobileAppPlatformId[];
  authentication?: MobileAppAuthenticationConfig;
  pushNotifications?: MobileAppPushNotificationsConfig;
  academicFeatures?: string[];
  communicationFeatures?: string[];
  feeFeatures?: string[];
  preferredPaymentGateway?: 'razorpay' | 'other' | 'not_decided';
  paymentGatewayOther?: string;
  transport?: MobileAppTransportConfig;
  documentFeatures?: string[];
  branding?: MobileAppBrandingConfig;
  distribution?: MobileAppDistributionId[];
  languages?: string[];
  otherLanguageText?: string;
  offline?: MobileAppOfflineConfig;
  additionalRequirements?: string;
}


export type AdministrativeAccessModel =
  | 'Single Administrator'
  | 'Multiple Administrators'
  | 'Department-based Administrators'
  | 'Role-based Access Control (RBAC)';

export type PermissionModelOption =
  | 'Full access for all administrators'
  | 'Standard predefined roles'
  | 'Strict role-based permissions'
  | 'Custom permission matrix';

export interface PermissionMatrixItem {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

export type TwoFactorRequirement =
  | 'Required for all administrators'
  | 'Recommended but optional'
  | 'Optional'
  | 'Not required';

export interface PasswordRequirementsConfig {
  uppercaseRequired?: boolean;
  lowercaseRequired?: boolean;
  numberRequired?: boolean;
  specialCharRequired?: boolean;
  preventCommonPasswords?: boolean;
  preventRecentPasswords?: boolean;
  allowPassphrases?: boolean;
  passwordExpirationDays?: number;
}

export type AuditLoggingPolicy =
  | 'Enabled and required'
  | 'Enabled'
  | 'Optional'
  | 'Disabled';

export type DataExportPermissionModel =
  | 'Super Administrators only'
  | 'Administrators with explicit export permission'
  | 'All administrators'
  | 'Nobody';

export type HighRiskApprovalPolicy =
  | 'Required'
  | 'Recommended'
  | 'Optional'
  | 'Disabled';

export type DataAccessPrinciple =
  | 'Full administrative access'
  | 'Need-to-know access'
  | 'Strict least-privilege access';

export type DataDeletionPolicy =
  | 'Manual approval required'
  | 'Automatic according to retention policy'
  | 'No automatic deletion';

export interface SecurityAccessData {
  administratorCount?: number;
  accessModel?: AdministrativeAccessModel;
  administratorRoles?: string[];
  customRoles?: string[];
  permissionModel?: PermissionModelOption;
  permissions?: Record<string, PermissionMatrixItem>;
  twoFactor?: {
    required?: TwoFactorRequirement;
    methods?: string[];
  };
  loginSecurity?: {
    maxFailedAttempts?: number;
    lockoutDuration?: string;
    minimumPasswordLength?: number;
    passwordRequirements?: PasswordRequirementsConfig;
  };
  sessionSecurity?: {
    sessionTimeout?: string;
    idleTimeoutEnabled?: boolean;
    idleTimeout?: string;
    concurrentSessionPolicy?: string;
    newDeviceNotification?: boolean;
    suspiciousLoginNotification?: boolean;
  };
  auditLogging?: {
    enabled?: AuditLoggingPolicy;
    events?: string[];
    retentionPeriod?: string;
  };
  dataExport?: {
    permissionModel?: DataExportPermissionModel;
    approvalRequired?: boolean;
    sensitiveDataCategories?: string[];
    maxRecordsPerExport?: number;
    formats?: string[];
  };
  accessRestrictions?: {
    campusRestriction?: boolean;
    departmentRestriction?: boolean;
    sensitiveStudentData?: boolean;
    financialData?: boolean;
    bulkAccessApproval?: boolean;
  };
  notifications?: {
    failedLogin?: boolean;
    newDevice?: boolean;
    passwordChange?: boolean;
    twoFactorChange?: boolean;
    permissionChange?: boolean;
    dataExport?: boolean;
    suspiciousActivity?: boolean;
    channels?: string[];
  };
  highRiskApproval?: {
    policy?: HighRiskApprovalPolicy;
    actions?: string[];
  };
  privacy?: {
    accessPrinciple?: DataAccessPrinciple;
    deletionPolicy?: DataDeletionPolicy;
    anonymization?: boolean;
    incidentNotification?: boolean;
  };

  // Backwards compatibility with previous schema
  administratorsCount?: number;
  roles?: string[];
  require2FAForAdmin?: boolean;
  loginMethods?: string[];
  passwordPolicy?: string;
  auditLogsRetentionMonths?: number;
  ipRestrictions?: boolean;
  sessionTimeoutMinutes?: number;
  dataExportPermissions?: string[];
  parentStudentRoleSeparation?: boolean;
  automatedDailyBackup?: boolean;
}

export type AssetChecklistStatus =
  | 'not_provided'
  | 'pending'
  | 'will_provide_later'
  | 'provided'
  | 'not_applicable'
  | 'blocked_for_publication'
  | 'recommended_available';

export type AssetChecklistRequirement =
  | 'required'
  | 'recommended'
  | 'optional'
  | 'statutory'
  | 'conditional';

export type AssetChecklistType = 'image' | 'document' | 'text' | 'gallery';
export type AssetChecklistCategory =
  | 'branding'
  | 'campus_photos'
  | 'leadership'
  | 'academic_content'
  | 'admissions'
  | 'certificates'
  | 'policies';

export interface AssetFileMeta {
  id?: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storageKey?: string;
  isPrivate?: boolean;
  uploadedAt?: string;
  checksumSha256?: string;
  width?: number;
  height?: number;
  originalSize?: number;
  optimizedSize?: number;
  optimizedFormat?: string;
}

export interface AssetChecklistItem {
  id: string;
  category: AssetChecklistCategory;
  section?: 'branding' | 'content' | 'documents' | 'media' | string;
  title: string;
  description: string;
  requirement: AssetChecklistRequirement;
  type: AssetChecklistType;
  status: AssetChecklistStatus;
  fileUrl?: string;
  storageKey?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  isPrivate?: boolean;
  checksumSha256?: string;
  galleryUrls?: AssetFileMeta[];
  textContent?: string;
  notes?: string;
  sourceSection?: string;
  sourceField?: string;
  intendedUse?: string;
  allowedFormats?: string[];
  maxSizeBytes?: number;
  allowNotApplicable?: boolean;
  isManualOverride?: boolean;
  conditionRule?: string;
  isPublicationBlocker?: boolean;
  /** IDs of other checklist items this image can be reused for (e.g. logo → crest, favicon) */
  reuseTargets?: string[];
  /** If this item was auto-populated by reusing another item's image */
  reusedFromId?: string;
  /** Image width in pixels after optimization */
  width?: number;
  /** Image height in pixels after optimization */
  height?: number;
  /** Original file size before optimization in bytes */
  originalSize?: number;
  /** Optimized file size after WebP conversion in bytes */
  optimizedSize?: number;
  /** Format the image was optimized to (e.g. 'webp') */
  optimizedFormat?: string;

  /** AI Content Recommendation fields */
  contentSource?: 'ai_recommended' | 'ai_recommended_edited' | 'school_provided' | 'template';
  recommendedDraft?: string;
  recommendedAt?: string;
  sourceFingerprint?: string;
  isOutdated?: boolean;
  requiresReview?: boolean;
  recommendationSources?: string[];
  recommendedTone?: string;
  recommendedLength?: 'short' | 'standard' | 'detailed';
}

export interface AssetChecklistData {
  items?: AssetChecklistItem[];
  lastUpdated?: string;
  publicationReadiness?: {
    isReadyForPublication: boolean;
    blockingItems: string[];
    evaluatedAt: string;
  };
  checklist?: Array<{
    id: string;
    section?: 'branding' | 'content' | 'documents' | 'media' | string;
    title: string;
    status: 'pending' | 'provided' | 'not_applicable';
    notes?: string;
    fileUrl?: string;
  }>;
  customNotes?: string;
}

export interface LegalPolicyData {
  privacyPolicyRequired?: boolean;
  termsRequired?: boolean;
  refundPolicyRequired?: boolean;
  admissionPolicyRequired?: boolean;
  feePolicyRequired?: boolean;
  transportPolicyRequired?: boolean;
  hostelPolicyRequired?: boolean;
  childSafetyPolicyRequired?: boolean;
  grievanceContact?: string;
  mandatoryDisclosuresProvided?: boolean;
}

export type TargetLaunchTimelineOption =
  | 'asap'
  | 'within-1-week'
  | 'within-2-weeks'
  | 'within-3-4-weeks'
  | 'within-5-6-weeks'
  | 'flexible'
  | 'specific-date';

export type DeliveryPriorityOption = 'standard' | 'priority' | 'urgent';

export type DeliveryPaymentStatus =
  | 'not_requested'
  | 'requested'
  | 'payment_required'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export interface ProjectDecisionMakerData {
  contactType: 'primary_contact' | 'principal' | 'super_admin' | 'custom';
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ImportantDeadlineData {
  type: string;
  date: string;
  notes?: string;
}

export interface ProjectDeliveryData {
  // Target Launch Timeline
  targetLaunchTimeline?: TargetLaunchTimelineOption | string;
  targetLaunchDate?: string;

  // Delivery Priority & Urgent Tier
  deliveryPriority?: DeliveryPriorityOption;
  isUrgentRequested?: boolean;
  urgentConfirmed?: boolean;
  expeditedFeeINR?: number;
  paymentStatus?: DeliveryPaymentStatus;
  paymentReference?: string;

  // Phase Priorities
  phase1Priorities?: string[];
  phase2Priorities?: string[];

  // Important Deadline
  importantDeadlineType?: string;
  importantDeadlineDate?: string;
  importantDeadlineNotes?: string;

  // Designated Decision Maker
  decisionMakerType?: 'primary_contact' | 'principal' | 'super_admin' | 'custom';
  decisionMakerName?: string;
  decisionMakerRole?: string;
  decisionMakerEmail?: string;
  decisionMakerPhone?: string;

  // Additional Delivery Notes
  deliveryNotes?: string;

  // Backwards compatibility legacy fields
  priority?: 'Critical' | 'High' | 'Medium' | 'Low' | 'Future' | string;
  phase1Requirements?: string;
  phase2Requirements?: string;
  futureRequirements?: string;
  specialCustomizations?: string;
  existingSoftwareLimitations?: string;
  importantDeadlines?: string;
  decisionMakers?: string;
  approvalAuthority?: string;
}

export interface AdditionalAdminRecord {
  id?: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  role: string;
}

export interface AdminProvisioningData {
  superAdminFullName: string;
  superAdminEmail: string;
  superAdminPhone: string;
  superAdminDesignation?: string;
  superAdminWhatsapp?: string;
  additionalAdmins?: AdditionalAdminRecord[];
  initialStaffLoginsCountEstimate?: number;
}

export interface ClientLegalConfirmation {
  confirmedByName: string;
  confirmedByDesignation: string;
  confirmedByEmail: string;
  confirmedByPhone: string;
  isConfirmed: boolean;
  confirmedAt: string;
  declarationStatement?: string;
  isAccurate?: boolean;
  isAuthorized?: boolean;
  understandsReview?: boolean;
  understandsMissingInfoDelays?: boolean;
}

// ─── Section 27: Portal Requirements & Notifications ─────────────────────────

export type PortalKey =
  | 'parent'
  | 'student'
  | 'teacher'
  | 'administrator'
  | 'management'
  | 'finance'
  | 'transport'
  | 'hostel'
  | 'library';

export type PortalAvailabilityStatus =
  | 'enabled'
  | 'planned'
  | 'not_required'
  | 'not_applicable';

export type PortalLoginMethod =
  | 'mobile_otp'
  | 'email_password'
  | 'username_password'
  | 'mobile_password'
  | 'sso'
  | 'multiple';

export type StudentAccessRestriction =
  | 'full'
  | 'limited_academic'
  | 'academic_only'
  | 'custom';

export type TeacherPermissionLevel =
  | 'view_only'
  | 'view_create'
  | 'view_create_edit'
  | 'full';

export type ManagementDashboardVisibility =
  | 'full'
  | 'summary'
  | 'financial_academic'
  | 'academic_only'
  | 'custom';

export type NotificationPriorityLevel =
  | 'informational'
  | 'normal'
  | 'important'
  | 'urgent'
  | 'emergency';

export type NotificationChannelKey =
  | 'in_app'
  | 'push'
  | 'email'
  | 'sms'
  | 'whatsapp';

export type NotificationRecipientKey =
  | 'parents'
  | 'students'
  | 'teachers'
  | 'staff'
  | 'administrators'
  | 'management'
  | 'finance'
  | 'transport'
  | 'hostel';

export type AnnouncementPublisherKey =
  | 'super_admin'
  | 'school_admin'
  | 'principal'
  | 'department_admin'
  | 'teacher'
  | 'custom';

export type AnnouncementApprovalPolicy =
  | 'no_approval'
  | 'principal_approval'
  | 'admin_approval'
  | 'two_step_approval';

export type AnnouncementAudienceKey =
  | 'entire_school'
  | 'specific_campus'
  | 'specific_class'
  | 'specific_section'
  | 'students'
  | 'parents'
  | 'teachers'
  | 'staff'
  | 'custom';

export type PortalLanguageKey =
  | 'english'
  | 'hindi'
  | 'bilingual'
  | 'other';

export type PortalAccessChannelKey =
  | 'web'
  | 'android'
  | 'ios'
  | 'pwa';

export interface PortalRequirementsData {
  portals?: {
    parent?: PortalAvailabilityStatus;
    student?: PortalAvailabilityStatus;
    teacher?: PortalAvailabilityStatus;
    administrator?: PortalAvailabilityStatus;
    management?: PortalAvailabilityStatus;
    finance?: PortalAvailabilityStatus;
    transport?: PortalAvailabilityStatus;
    hostel?: PortalAvailabilityStatus;
    library?: PortalAvailabilityStatus;
  };

  authentication?: {
    preferredLoginMethod: PortalLoginMethod;
    allowMultipleMethods?: boolean;
    additionalLoginMethods?: PortalLoginMethod[];
    notes?: string;
  };

  parentFeatures?: string[];
  studentFeatures?: string[];
  studentAccessRestriction?: StudentAccessRestriction;
  teacherFeatures?: string[];
  teacherPermissionLevel?: TeacherPermissionLevel;
  administratorFeatures?: string[];
  managementFeatures?: string[];
  managementDashboardVisibility?: ManagementDashboardVisibility;
  financeFeatures?: string[];
  transportFeatures?: string[];
  hostelFeatures?: string[];
  libraryFeatures?: string[];
  libraryVisibilityRoles?: Array<'student' | 'parent' | 'teacher' | 'librarian' | 'administrator'>;

  dashboardVisibility?: {
    parent?: string[];
    student?: string[];
    teacher?: string[];
    administrator?: string[];
    management?: string[];
    finance?: string[];
    transport?: string[];
    hostel?: string[];
    library?: string[];
  };

  notificationCenter?: {
    inAppEnabled?: boolean;
    historyRetentionDays?: number;
    readUnreadStateEnabled?: boolean;
    categoriesEnabled?: boolean;
    priorityLevelsEnabled?: boolean;
    userPreferencesEnabled?: boolean;
  };

  notifications?: {
    inApp?: boolean;
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
    categories?: {
      academic?: string[];
      financial?: string[];
      administrative?: string[];
      transport?: string[];
      hostel?: string[];
      security?: string[];
    };
    recipients?: NotificationRecipientKey[];
  };

  emergencyNotifications?: {
    enabled?: boolean;
    eventTypes?: string[];
    channels?: NotificationChannelKey[];
    bypassPreferencesAllowed?: boolean;
    notes?: string;
  };

  announcements?: {
    publishers?: AnnouncementPublisherKey[];
    customPublisherRole?: string;
    approvalPolicy?: AnnouncementApprovalPolicy;
    audiences?: AnnouncementAudienceKey[];
    customAudienceText?: string;
    schedulingEnabled?: boolean;
    expiryEnabled?: boolean;
    pinImportant?: boolean;
  };

  userPreferences?: {
    allowAcademic?: boolean;
    allowFees?: boolean;
    allowAttendance?: boolean;
    allowTransport?: boolean;
    allowEvents?: boolean;
    allowAnnouncements?: boolean;
    allowEmergency?: boolean;
    emergencyLocked?: boolean;
  };

  localization?: {
    defaultLanguage?: PortalLanguageKey;
    otherLanguageName?: string;
    additionalLanguages?: string[];
  };

  accessChannels?: {
    web?: boolean;
    android?: boolean;
    ios?: boolean;
    pwa?: boolean;
  };

  // Backwards-compatible legacy fields
  parentPortalEnabled?: boolean;
  studentPortalEnabled?: boolean;
  staffPortalEnabled?: boolean;
  parentNotificationChannels?: string[];
  resultPublishingOnPortal?: boolean;
  feeReceiptsDownloadable?: boolean;
  attendanceVisibilityImmediate?: boolean;
}

// ─── SECTION 28: MEDIA ASSETS & CONTENT KIT TYPES ──────────────────────────

export type MediaAssetCategory =
  | 'branding'
  | 'campus_facilities'
  | 'people_community'
  | 'academic_promotional'
  | 'digital_channels'
  | 'legal_governance';

export type MediaAssetRequirementLevel =
  | 'mandatory'
  | 'recommended'
  | 'conditional'
  | 'optional';

export type MediaAssetReadinessStatus =
  | 'not_started'
  | 'in_progress'
  | 'ready'
  | 'provided'
  | 'needs_review'
  | 'not_applicable';

export type MediaAssetOwnership =
  | 'institution_owned'
  | 'licensed_stock'
  | 'student_parent_work'
  | 'agency_produced'
  | 'pending_clearance';

export type MediaAssetType =
  | 'image'
  | 'vector'
  | 'video'
  | 'document'
  | 'copy_text'
  | 'color_palette'
  | 'typography';

export interface MediaAssetItem {
  id: string;
  name: string;
  category: MediaAssetCategory;
  assetType: MediaAssetType;
  description: string;
  usageLocations: string[];
  requirementLevel: MediaAssetRequirementLevel;
  isApplicable: boolean;
  inapplicabilityReason?: string;
  expectedFormats: string[];
  recommendedResolution?: string;
  quantityGuidance?: string;
  readinessStatus: MediaAssetReadinessStatus;
  referenceLocation?: string;
  ownershipStatus?: MediaAssetOwnership;
  consentRequired?: boolean;
  consentObtained?: boolean;
  usageRestrictions?: string;
  notes?: string;
  reviewStatus?: 'pending' | 'approved' | 'revision_requested';
}

export interface MediaGovernanceData {
  schoolOwnershipConfirmed: boolean;
  thirdPartyLicensingCleared: boolean;
  studentPhotoConsentPolicyConfirmed: boolean;
  staffPhotoConsentPolicyConfirmed: boolean;
  publicationRestrictions?: string;
  geographicRestrictions?: string;
  licenseExpiryDate?: string;
  governanceNotes?: string;
  authorizedSignatoryName?: string;
  authorizedSignatoryDesignation?: string;
}

export interface MediaAssetsData {
  assets?: Record<string, MediaAssetItem>;
  governance?: MediaGovernanceData;
  generalNotes?: string;
  sharedDriveUrl?: string;
  // Backwards compatibility mirrors
  logoReady?: boolean;
  campusPhotosReady?: boolean;
  leadershipPhotosReady?: boolean;
  prospectusReady?: boolean;
}

export interface UniversalIntakeData {
  // 1. School Identity & Permanent Legal Information
  schoolProfile: SchoolIdentityData;

  // 2. Campuses & Branches (Repeatable)
  campuses?: CampusBranchData[];
  /** Campus-specific section inheritance & override configurations */
  campusOverrides?: CampusOverridesMap;

  // 3. School Leadership & Administration
  leadership?: SchoolLeadershipData;

  // 4. Branding & Visual Identity
  brandingDesign: SchoolBrandingData;

  // 5. Website Objectives & Information Architecture
  websiteRequirements?: WebsiteRequirementsData;

  // 6. School Content & Pedagogy
  schoolContent?: SchoolContentData;

  // 7. Academic Structure & Capacity
  institutionStructure?: AcademicStructureData;

  // 8. Staff & Faculty Configuration
  staffFaculty?: StaffFacultyConfigData;

  // Shared Institutional ID Numbering (cross-entity format)
  institutionalIdNumbering?: InstitutionalIdNumberingConfig;

  // 9. Student Configuration & Numbering
  studentConfig?: StudentConfigData;
  /** Canonical student records attached to this institution */
  students?: Student[];
  /** Canonical staff records attached to this institution */
  staffRecords?: StaffRecord[];

  // 10. Admissions Experience
  admissions?: AdmissionsData;

  // 11. Fee Structures & Finance
  feesConfiguration?: FeesConfigurationData;

  // 12. Academic Curriculum
  curriculum?: CurriculumData;

  // 12. Attendance Workflow & Timetable Schedule
  attendanceConfig?: AttendanceData;
  timetableConfig?: TimetableData;

  // 13. Examination & Assessment
  examinationConfig?: ExaminationData;

  // 14. Transport Management (Conditional)
  transportConfig?: TransportData;

  // 15. Campus Facilities & Operations
  facilitiesConfig?: FacilitiesData;

  // 16. Library Management
  libraryConfig?: LibraryData;

  // 17. Hostel & Residential (Conditional on Residential = Yes)
  hostelConfig?: HostelData;

  // 18. Communication Preferences
  communicationConfig?: CommunicationData;

  // 19. Website CMS Workflow
  cmsRequirements?: CmsWorkflowData;

  // 20. Domain, Hosting & Email
  domainPresence?: DomainHostingData;

  // 21. Data Migration Assessment
  existingSystemsMigration?: DataMigrationData;

  // 22. Third-Party Integrations (Selection only - No Secrets)
  integrationsConfig?: IntegrationsData;

  // 23. Mobile Application Requirements
  mobileAppConfig?: MobileAppData;

  // 24. Security & Access Requirements
  securityPrivacy?: SecurityAccessData;
  userRolesConfig?: { requiredRoles?: string[]; customRoles?: string[] };

  // 25. Content & Asset Checklist
  assetChecklist?: AssetChecklistData;

  // 26. Legal & Policy Information
  legalPolicies?: LegalPolicyData;

  // 27. Project & Delivery Requirements
  projectDelivery?: ProjectDeliveryData;

  // 28. Administrative Provisioning & Final Sign-Off
  usersAccess: AdminProvisioningData;
  clientConfirmation?: ClientLegalConfirmation;

  // Additional backwards-compatible fields
  documentsDownloads?: { documentsChecklist: string[] };
  mediaGallery?: { albums: string[]; hasCampusPhotos: boolean; hasEventPhotos: boolean; youtubeChannelUrl?: string };
  socialMedia?: { facebook?: string; instagram?: string; youtube?: string; linkedin?: string; twitter?: string };
  seoConfig?: {
    seoSchoolTitle?: string;
    seoMetaDescription?: string;
    targetKeywords?: string;
    cityAndDistrictKeywords?: string;
    googleBusinessProfileUrl?: string;
    analyticsRequired?: boolean;
  };
  designReferences?: {
    preferredVisualTone?: string;
    referenceWebsites?: string;
    dislikedWebsites?: string;
    specialDesignNotes?: string;
  };
  erpRequirements?: {
    studentManagementPriority: string;
    attendanceTrackingMode: 'daily' | 'subject_wise' | 'biometric_sync';
    feeStructureComplexity: 'simple_quarterly' | 'monthly_tiered' | 'complex_concessions';
    examGradingSystem: 'cbse_grading' | 'percentage' | 'custom_gpa';
    tcCertificateAutomated: boolean;
    idCardPrintingNeeded: boolean;
    transportModuleNeeded: boolean;
    libraryModuleNeeded: boolean;
    hostelModuleNeeded: boolean;
    cafeteriaModuleNeeded: boolean;
    additionalModuleNotes?: string;
  };
  portalRequirements?: PortalRequirementsData;
  mediaAssets?: MediaAssetsData;
  /** Centralized shared media registry across the school onboarding flow */
  mediaRegistry?: SharedMediaAsset[];
  /** Project Scope & Website Module Configuration */
  websiteScope?: WebsiteScopeData;
  additionalRequirements?: {
    notes?: string;
    customRequests?: string[];
    specialCustomWorkflows?: string;
    customReportsRequired?: string;
    thirdPartyIntegrations?: string;
    generalCommentsOrQuestions?: string;
  };
}

export interface SchoolProjectFilter {
  query?: string;
  productId?: 'ALL' | 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete';
  status?: 'ALL' | SchoolProjectStatus;
  mediaStatus?: 'ALL' | SchoolMediaStatus;
  page?: number;
  pageSize?: number;
}

// --- Payment & Order Management Types ----------------------------

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED';

export interface OrderMetadata {
  planName?: string;
  planPrice?: number;
  additionalPages?: Array<{ name: string; tierId: string; price: number }>;
  domainChoice?: string;
  preferredDomain?: string | null;
  domainPrice?: number | null;
  domainAllowance?: number;
  domainDifference?: number;
  organizationName?: string;
  notes?: string;
  customerWhatsApp?: string;
  isCustomLink?: boolean;
  milestoneDescription?: string;
  domain?: ProjectDomain;
  projectId?: string;
  projectNumber?: string;
  schoolId?: string;
  clientId?: string;
}

export interface Order {
  id: string;
  lead_id?: string | null;
  project_id?: string | null;
  project_number?: string | null;
  domain?: ProjectDomain;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  plan_id?: string | null;
  amount_inr: number;
  payment_status: PaymentStatus;
  gateway_name: string;
  gateway_order_id?: string | null;
  gateway_payment_id?: string | null;
  gateway_signature?: string | null;
  metadata?: OrderMetadata | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentEvent {
  id: string;
  order_id: string;
  event_type: string;
  gateway_event_id?: string | null;
  gateway_payment_id?: string | null;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface OrderFilter {
  query?: string;
  status?: PaymentStatus | 'ALL';
  domain?: ProjectDomain | 'ALL';
  page?: number;
  pageSize?: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  refunded: number;
  totalRevenueINR: number;
}

export interface CreateOrderRequest {
  leadId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsApp?: string;
  organizationName?: string;
  serviceType: string;
  planId?: string;
  additionalPages?: Array<{ name: string; tierId: string; price?: number }>;
  domainChoice?: string;
  preferredDomain?: string;
  isPriceVerified?: boolean;
  notes?: string;
  // For custom admin payment links:
  isCustomPaymentLink?: boolean;
  customAmountINR?: number;
  customDescription?: string;
}

export interface VerifyPaymentRequest {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// --- BUSINESS CLIENT PROJECT INTAKE & LIFECYCLE TYPES ----------------------

export type AcquisitionSource =
  | 'WEBSITE_LEAD'
  | 'DIRECT_CONTACT'
  | 'REFERRAL'
  | 'EXISTING_CLIENT'
  | 'WHATSAPP'
  | 'PHONE'
  | 'WALK_IN'
  | 'PARTNER'
  | 'OTHER';

export type IntakeStatus =
  | 'NOT_STARTED'
  | 'INVITATION_SENT'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'COMPLETED';

export type IntakeResponseSource =
  | 'CLIENT_PROVIDED'
  | 'ADMIN_ENTERED'
  | 'IMPORTED';

export interface MissingRequirementItem {
  id: string;
  category: string;
  title: string;
  description?: string;
  stepNumber?: number;
  resolved?: boolean;
}

export type BusinessProjectStatus =
  | 'NEW_PROJECT'
  | 'REQUIREMENTS_PENDING'
  | 'REQUIREMENTS_SUBMITTED'
  | 'REQUIREMENTS_UNDER_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'DESIGN_IN_PROGRESS'
  | 'DESIGN_READY'
  | 'REVISION_REQUESTED'
  | 'DESIGN_APPROVED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'DEVELOPMENT'
  | 'STAGING_REVIEW'
  | 'FINAL_APPROVAL'
  | 'LAUNCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Client {
  id: string;
  name: string;
  organization?: string | null;
  email: string;
  phone: string;
  whatsapp?: string | null;
  city?: string | null;
  designation?: string | null;
  acquisition_source?: AcquisitionSource | string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProjectMetadata {
  acquisitionSource?: AcquisitionSource | string;
  initialBudget?: string;
  estimatedBudget?: string;
  initialTimeline?: string;
  originalDescription?: string;
  notes?: string;
  designation?: string;
  createdVia?: 'DIRECT_INTAKE' | 'LEAD_CONVERSION' | string;
  intakeStatus?: IntakeStatus;
  intakeProgressPercent?: number;
  missingRequirements?: MissingRequirementItem[];
  missingRequirementsNotes?: string;
  completedOnBehalf?: boolean;
  completedByAdminName?: string;
  lastIntakeModifiedBy?: IntakeResponseSource | string;
  lastIntakeSavedAt?: string;
  intakeSubmittedAt?: string;
  schoolProjectId?: string;
  [key: string]: unknown;
}

export interface BusinessProject {
  id: string;
  project_number: string; // e.g. BUS-2026-0001
  domain?: 'BUSINESS';
  lead_id?: string | null;
  client_id?: string | null;
  project_type: 'BUSINESS' | 'SCHOOL';
  acquisition_source?: AcquisitionSource;
  project_name: string;
  service_type: string;
  project_status: BusinessProjectStatus;
  assigned_team?: string | null;
  metadata?: BusinessProjectMetadata | Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // Joined client or lead details for convenience
  client?: Client | null;
  lead?: Lead | null;
}

export interface DirectProjectInput {
  organizationName: string;
  primaryContactName: string;
  designation?: string;
  email: string;
  phone: string;
  projectName: string;
  projectType?: 'BUSINESS' | 'SCHOOL';
  domain?: 'BUSINESS';
  serviceType: string;
  acquisitionSource: AcquisitionSource;
  estimatedBudget?: string;
  notes?: string;
  initialAction: 'COMPLETE_MYSELF' | 'SEND_INTAKE';
}

export interface BusinessProjectFilter {
  query?: string;
  status?: BusinessProjectStatus | 'ALL';
  serviceType?: string | 'ALL';
  projectType?: 'BUSINESS' | 'SCHOOL' | 'ALL';
  domain?: 'BUSINESS' | 'ALL';
  page?: number;
  pageSize?: number;
}

export interface BusinessOnboardingToken {
  id: string;
  project_id: string;
  token_hash: string;
  token_code: string;
  expires_at: string;
  is_revoked: boolean;
  revoked_reason?: string | null;
  access_count: number;
  last_accessed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Sections A - J Data Structures
export interface SectionAProfile {
  legalName?: string;
  displayName: string;
  category: string;
  description: string;
  yearEstablished?: string;
  locations: string;
  primaryContactName: string;
  email: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
  };
}

export interface SectionBGoalsAudience {
  primaryType: string;
  secondaryTypes?: string[];
  customTypeDetails?: string;
  primaryGoal: string;
  secondaryGoals?: string[];
  problemToSolve: string;
  targetCustomerType: 'B2B' | 'B2C' | 'B2B_AND_B2C' | 'INTERNAL_TEAM';
  targetAudienceDescription: string;
  geographicReach: string;
  keyVisitorAction: string;
  successDefinition: string;
}

export interface SectionCDesignPreferences {
  styleVibe: 'Modern & Clean' | 'Corporate & Prestigious' | 'Minimalist' | 'Bold & Vibrant' | 'Luxury & Premium' | 'Friendly & Warm';
  preferredColors: string;
  avoidColors?: string;
  likedWebsites?: string;
  dislikedWebsites?: string;
  competitorWebsites?: string;
  brandPersonalityKeywords?: string[];
  designConstraintsOrRules?: string;
}

export interface SectionDWebsiteStructure {
  solutionType: 'WEBSITE' | 'WEB_APPLICATION' | 'PORTAL' | 'CUSTOM_SOFTWARE';
  requiredPages: string[];
  customPages?: string[];
  homepageFocus?: string;
  navigationStructure?: string;
  multilingual: boolean;
  languages?: string[];
  blogOrNews: boolean;
  galleryNeeded: boolean;
  careersSection: boolean;
  testimonialsNeeded: boolean;
}

export interface SectionEContentAssets {
  hasLogo: 'YES' | 'NO' | 'NEEDS_REDESIGN';
  hasBrandGuidelines: boolean;
  hasProductOrServicePhotos: 'READY' | 'PARTIAL' | 'NEED_HELP';
  hasWrittenContent: 'READY' | 'DRAFT' | 'NEED_COPYWRITING';
  uploadedAssetUrls?: string[];
  uploadedAssets?: Array<{
    id?: string;
    category: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
  }>;
  contentNotes?: string;
}

export interface SectionFFeatures {
  selectedFeatures: string[];
  customFeatures?: string;
  contactForm: boolean;
  whatsAppChat: boolean;
  googleMaps: boolean;
  searchFilter: boolean;
  userAuth: boolean;
  adminPanel: boolean;
  cms: boolean;
  onlineBooking: boolean;
  paymentGateway: boolean;
  analyticsSeo: boolean;
  notificationsSmsEmail?: boolean;
}

export interface SectionGIntegrations {
  paymentGatewayNeeded: boolean;
  preferredPaymentGateway?: 'RAZORPAY' | 'PAYTM' | 'CASHFREE' | 'STRIPE' | 'NONE' | 'OTHER';
  whatsappApiNeeded: boolean;
  crmIntegration?: string;
  accountingIntegration?: string;
  thirdPartyApis?: string;
  userRoles?: string[];
  adminCapabilities?: string;
  securityComplianceNotes?: string;
}

export interface SectionHDomainHosting {
  hasDomain: 'YES' | 'NO' | 'DECIDE_LATER';
  existingDomain?: string;
  preferredNewDomain?: string;
  hasHosting: boolean;
  existingHostingProvider?: string;
  hostingPreference: 'MANAGED_BY_EKAAGRA' | 'CLIENT_AWS_CLOUD' | 'CLIENT_CPANEL' | 'DECIDE_LATER';
  hasBusinessEmail: boolean;
  businessEmailAccountsNeeded?: string;
  hasDnsAccess: boolean;
  migrationNeeded: boolean;
  sslCertificateNeeded?: boolean;
}

export interface SectionIBudgetTimeline {
  targetBudgetRange: string;
  timelineRequirement: 'IMMEDIATE' | 'ONE_TO_TWO_MONTHS' | 'TWO_TO_FOUR_MONTHS' | 'FLEXIBLE';
  targetLaunchDate?: string;
  hardDeadlinesOrConstraints?: string;
  decisionMakers?: string;
}

export interface SectionJAgreement {
  confirmedAccurate: boolean;
  authorizedSignatoryName: string;
  authorizedSignatoryTitle?: string;
  notesForEkaagraTeam?: string;
  agreedAt?: string;
}

// Backwards compatibility legacy structures
export interface SectionBProjectType {
  primaryType:
    | 'Business Website'
    | 'E-commerce Website'
    | 'Web Application'
    | 'Custom Software'
    | 'CRM'
    | 'ERP'
    | 'Booking System'
    | 'Portal'
    | 'Other';
  secondaryTypes?: string[];
  customTypeDetails?: string;
}

export interface SectionCObjectives {
  problemToSolve: string;
  primaryGoal: string;
  targetUserRoles: string;
  keyVisitorAction: string;
  successDefinition: string;
}

export interface SectionDTargetAudience {
  targetCustomerType: 'B2B' | 'B2C' | 'B2B_AND_B2C' | 'INTERNAL_TEAM';
  demographics?: string;
  geographicReach: string;
  existingCustomerBase?: string;
  coreCustomerNeeds: string;
}

export interface SectionEWebsiteRequirements {
  requiredPages: string[];
  customPages?: string[];
  homepageFocus?: string;
  multilingual: boolean;
  languages?: string[];
  blogOrNews: boolean;
  galleryNeeded: boolean;
  careersSection: boolean;
  testimonialsNeeded: boolean;
}

export interface SectionGSystemRequirements {
  userRoles?: string[];
  adminCapabilities?: string;
  staffCapabilities?: string;
  customerCapabilities?: string;
  authPermissions?: string;
  reportingNeeds?: string;
  workflowApprovalNotes?: string;
  thirdPartyIntegrations?: string;
  importExportNeeds?: string;
}

export interface SectionHContentAssets {
  hasLogo: 'YES' | 'NO' | 'NEEDS_REDESIGN';
  hasBrandGuidelines: boolean;
  hasProductOrServicePhotos: 'READY' | 'PARTIAL' | 'NEED_HELP';
  hasWrittenContent: 'READY' | 'DRAFT' | 'NEED_COPYWRITING';
  uploadedAssetUrls?: string[];
  contentNotes?: string;
}

export interface SectionIDesignPreferences {
  styleVibe: 'Modern & Clean' | 'Corporate & Prestigious' | 'Minimalist' | 'Bold & Vibrant' | 'Luxury & Premium' | 'Friendly & Warm';
  preferredColors?: string;
  likedWebsites?: string;
  dislikedWebsites?: string;
  competitorWebsites?: string;
  designConstraintsOrRules?: string;
}

export interface SectionJDomainHosting {
  hasDomain: 'YES' | 'NO' | 'DECIDE_LATER';
  existingDomain?: string;
  preferredNewDomain?: string;
  hasHosting: boolean;
  existingHostingProvider?: string;
  hasBusinessEmail: boolean;
  hasDnsAccess: boolean;
  migrationNeeded: boolean;
}

export interface BusinessRequirementsData {
  section_a_profile: SectionAProfile;
  section_b_goals_audience: SectionBGoalsAudience;
  section_c_design: SectionCDesignPreferences;
  section_d_structure: SectionDWebsiteStructure;
  section_e_assets: SectionEContentAssets;
  section_f_features: SectionFFeatures;
  section_g_integrations: SectionGIntegrations;
  section_h_domain_hosting: SectionHDomainHosting;
  section_i_budget_timeline: SectionIBudgetTimeline;
  section_j_agreement: SectionJAgreement;

  // Legacy mappings for backwards-compatible persistence
  section_b_project_type?: SectionBProjectType;
  section_c_objectives?: SectionCObjectives;
  section_d_target_audience?: SectionDTargetAudience;
  section_e_website_reqs?: SectionEWebsiteRequirements;
  section_g_system_reqs?: SectionGSystemRequirements;
  section_h_content_assets?: SectionHContentAssets;
  section_i_design_preferences?: SectionIDesignPreferences;
  section_j_domain_hosting?: SectionJDomainHosting;
}

export interface BusinessRequirementSubmission {
  id: string;
  project_id: string;
  version_number: number;
  form_version: number;
  submitted_by_name: string;
  submitted_by_email: string;
  client_confirmation: boolean;
  full_payload: BusinessRequirementsData;
  review_status: 'PENDING' | 'UNDER_REVIEW' | 'REVIEWED' | 'CLARIFICATION_REQUESTED';
  admin_review_notes?: string | null;
  clarification_notes?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

export type BusinessAssetCategory =
  | 'LOGO'
  | 'BRAND_GUIDELINE'
  | 'SCREENSHOT'
  | 'CATALOGUE'
  | 'DOCUMENT'
  | 'IMAGE'
  | 'REFERENCE_DESIGN'
  | 'OTHER';

export interface BusinessRequirementAsset {
  id: string;
  project_id: string;
  submission_id?: string | null;
  asset_category: BusinessAssetCategory;
  file_name: string;
  file_url: string;
  storage_path?: string | null;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface DesignReview {
  id: string;
  project_id: string;
  design_version: number;
  design_title: string;
  design_url: string;
  design_notes?: string | null;
  status: 'PENDING_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED';
  client_feedback?: string | null;
  revision_count: number;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by_client?: string | null;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  activity_type: string;
  actor_type: 'ADMIN' | 'CLIENT' | 'SYSTEM';
  actor_name?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  author_name: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}



