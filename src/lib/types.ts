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
  | 'LOST'
  | 'PROJECT_LOST'
  | 'CANCELLED';

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
}

export interface LeadFilter {
  query?: string;
  status?: LeadStatus | 'ALL';
  type?: LeadType | 'ALL';
  source?: LeadSource | 'ALL';
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
  provider: string;
  sourceAmount?: number;
  sourceCurrency: string;
  estimatedINR?: number;
  period: number;
  registrationPeriod: string;
  renewalPrice?: number;
  annualAllowance: number;
  termAllowance: number;
  upgradeAmount: number;
  premium: boolean;
  isIncluded: boolean;
  recommendationBadge?: string;
  recommendationReason?: string;
  domainChoice?: DomainChoice;
  domainStatus?: DomainStatus;
  isPriceVerified?: boolean;
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

export type IntakeChangeRequestStatus = 'open' | 'resolved' | 'waived';

export interface SchoolProject {
  id: string;
  project_number: string; // SCH-YYYY-XXXX
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
  metadata: Record<string, unknown>;
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
  request_comment: string;
  requested_by: string;
  status: IntakeChangeRequestStatus;
  resolution_notes?: string | null;
  created_at: string;
  resolved_at?: string | null;
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

// --- Universal Intake Form Data Model (Sections A - K) --------------------

export interface UniversalIntakeData {
  // A. School Profile
  schoolProfile: {
    schoolName: string;
    legalInstitutionName?: string;
    schoolType: string; // Private, CBSE Affiliated, ICSE, State Board, etc.
    board: string;
    establishmentYear?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pin: string;
    officialEmail: string;
    officialPhone: string;
    principalName: string;
    principalEmail?: string;
    principalPhone?: string;
    managementContactName?: string;
    managementContactPhone?: string;
  };

  // B. Institution Structure (ERP)
  institutionStructure?: {
    isMultiCampus: boolean;
    campusCount?: number;
    campusesDetails?: string;
    currentAcademicSession: string; // e.g. "2026-2027"
    classesOfferedFrom: string; // e.g. "Nursery"
    classesOfferedTo: string;   // e.g. "Class 12"
    totalSectionsEstimated: number;
    studentCapacityTotal: number;
    teachingStaffCount: number;
    nonTeachingStaffCount: number;
    academicStreams?: string[]; // Science, Commerce, Arts
  };

  // C. Website Requirements (Website / CMS)
  websiteRequirements?: {
    primaryPurpose: string;
    requiredPages: string[]; // About, Principal, Facilities, etc.
    principalMessageDraft?: string;
    managementMessageDraft?: string;
    admissionsOpenAnnouncement?: boolean;
    existingWebsiteUrl?: string;
    migrationNeededFromExisting: boolean;
    seoFocusKeywords?: string;
    languagesRequired: string[]; // English, Hindi, etc.
  };

  // D. CMS Requirements (CMS)
  cmsRequirements?: {
    managingRoles: string[]; // Principal, Vice-Principal, Computer Teacher, Clerk
    estimatedCmsUsers: number;
    requiresApprovalBeforePublish: boolean;
    contentCategories: string[]; // Notices, Events, Gallery, Circulars, News, Staff Directory
    mediaUploadWorkflowNotes?: string;
  };

  // E. ERP Requirements (ERP Questionnaire)
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

  // F. Portal Requirements (ERP / Complete)
  portalRequirements?: {
    parentPortalEnabled: boolean;
    studentPortalEnabled: boolean;
    staffPortalEnabled: boolean;
    parentNotificationChannels: string[]; // SMS, WhatsApp, Email, Push
    resultPublishingOnPortal: boolean;
    feeReceiptsDownloadable: boolean;
    attendanceVisibilityImmediate: boolean;
  };

  // G. Branding / Design
  brandingDesign: {
    hasHighResLogo: boolean;
    logoNotes?: string;
    primaryColor?: string;
    secondaryColor?: string;
    taglineOrMotto?: string;
    designReferenceWebsites?: string;
    preferredVisualTone?: 'traditional_prestigious' | 'modern_vibrant' | 'minimal_clean';
  };

  // H. Domain / Online Presence
  domainPresence: {
    alreadyOwnsDomain: boolean;
    existingDomainName?: string;
    preferredNewDomainName?: string;
    currentRegistrar?: string;
    dnsManagementAccessAvailable: boolean;
    officialEmailDomainNeeded: boolean;
    socialMediaLinks?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      twitter?: string;
    };
  };

  // I. Existing Systems & Data Migration (ERP)
  existingSystemsMigration?: {
    currentSystemType: 'excel_spreadsheets' | 'older_desktop_software' | 'cloud_software' | 'paper_registers';
    currentSoftwareName?: string;
    migrateStudentRecords: boolean;
    migrateStaffRecords: boolean;
    migrateHistoricalFeeLedgers: boolean;
    estimatedStudentRecordsToImport?: number;
    migrationReadinessStatus?: 'ready_files' | 'needs_formatting_help' | 'data_cleanup_in_progress';
  };

  // J. Users & System Access
  usersAccess: {
    superAdminFullName: string;
    superAdminEmail: string;
    superAdminPhone: string;
    initialStaffLoginsCountEstimate?: number;
  };

  // K. Additional Requirements
  additionalRequirements?: {
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
}

export interface Order {
  id: string;
  lead_id?: string | null;
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


