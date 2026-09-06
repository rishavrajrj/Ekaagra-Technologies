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

// --- Universal Intake Form Data Model (Phases 2 - 36) --------------------

export interface SchoolIdentityData {
  schoolName: string;
  legalInstitutionName?: string;
  displayName?: string;
  shortName?: string;
  schoolCode?: string;
  board: string;
  affiliationNumber?: string;
  registrationNumber?: string;
  establishmentYear?: string;
  schoolType: string;
  schoolCategory: string;
  mediumOfInstruction: string[];
  coEdStatus: 'co_ed' | 'boys' | 'girls';
  schoolLevel: string[];
  websiteName?: string;
  preferredWebsiteDomain?: string;
  existingDomain?: string;
  existingWebsiteUrl?: string;
  officialEmail: string;
  secondaryEmail?: string;
  officialPhone: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  emergencyContact?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pin: string;
  country: string;
  principalName?: string;
  principalEmail?: string;
  principalPhone?: string;
  managementContactName?: string;
  managementContactPhone?: string;
}

export interface CampusBranchData {
  id: string;
  name: string;
  code?: string;
  address: string;
  city: string;
  district?: string;
  state: string;
  pin: string;
  contactPhone: string;
  contactEmail?: string;
  principalOrHead?: string;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsLink?: string;
  operatingHours?: string;
  facilities?: string[];
  isMainCampus: boolean;
}

export interface SchoolLeadershipData {
  principalName: string;
  principalDesignation?: string;
  principalPhotoUrl?: string;
  principalMessage?: string;
  principalEmail?: string;
  principalPhone?: string;
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
  secondaryLogoUrl?: string;
  emblemUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamilyPreference?: string;
  brandGuidelinesUrl?: string;
  taglineOrMotto?: string;
  motto?: string;
  visionStatement?: string;
  missionStatement?: string;
  coreValues?: string[];
  designReferenceWebsites?: string;
  preferredVisualTone?: 'traditional_prestigious' | 'modern_vibrant' | 'minimal_clean';
}

export interface WebsiteRequirementsData {
  primaryPurpose: string;
  requiredPages: string[];
  customPages?: Array<{ title: string; slug?: string; description?: string; notes?: string }>;
  pageDetails?: Record<string, { description?: string; contentDraft?: string; documentNotes?: string }>;
  principalMessageDraft?: string;
  managementMessageDraft?: string;
  admissionsOpenAnnouncement?: boolean;
  existingWebsiteUrl?: string;
  migrationNeededFromExisting: boolean;
  seoFocusKeywords?: string;
  languagesRequired: string[];
}

export interface SchoolContentData {
  aboutSchool: string;
  history?: string;
  philosophy?: string;
  teachingMethodology?: string;
  specialPrograms?: string;
  uniqueSellingPoints?: string[];
  achievementsAndAwards?: string;
  studentLife?: string;
}

export interface AcademicStructureData {
  isMultiCampus?: boolean;
  currentAcademicSession: string;
  sessionStartDate?: string;
  sessionEndDate?: string;
  classesOfferedFrom?: string;
  classesOfferedTo?: string;
  totalSectionsEstimated?: number;
  studentCapacityTotal?: number;
  teachingStaffCount?: number;
  nonTeachingStaffCount?: number;
  academicStreams?: string[];
  classes?: Array<{ name: string; code?: string; sortOrder: number; sections: string[] }>;
  subjects?: Array<{ name: string; code?: string; subjectType: 'theory' | 'practical' | 'combined' | 'activity'; isElective: boolean; classesTaught?: string[] }>;
  departments?: Array<{ name: string; headStaffName?: string; description?: string }>;
}

export interface StaffFacultyData {
  bulkImportMode?: boolean;
  estimatedTotalStaff?: number;
  teachingStaffCount?: number;
  nonTeachingStaffCount?: number;
  staffMembers?: Array<{
    name: string;
    employeeCode?: string;
    designation: string;
    department?: string;
    qualification?: string;
    specialization?: string;
    experienceYears?: number;
    joiningDate?: string;
    email?: string;
    phone?: string;
    bio?: string;
    subjectsTaught?: string;
    classesTaught?: string;
    displayOnWebsite: boolean;
    displayOrder?: number;
  }>;
}

export interface StudentConfigData {
  studentIdFormat?: string;
  admissionNumberFormat?: string;
  rollNumberSystem?: 'class_wise' | 'section_wise' | 'alphabetical';
  houseSystemEnabled?: boolean;
  houseNames?: string[];
  studentCategories?: string[];
  requiredStudentFields?: string[];
  requiredDocumentTypes?: string[];
  migrationRequired?: boolean;
  estimatedStudentCount?: number;
}

export interface AdmissionsData {
  admissionsOpen?: boolean;
  targetSessions?: string;
  classesOpenForAdmission?: string[];
  eligibilityCriteria?: string;
  ageCriteria?: string;
  requiredDocuments?: string[];
  admissionStages?: string[];
  applicationFee?: number;
  admissionFee?: number;
  contactPerson?: string;
  admissionPhone?: string;
  admissionEmail?: string;
  officeHours?: string;
  onlineEnquiryEnabled?: boolean;
  onlineApplicationEnabled?: boolean;
  documentUploadEnabled?: boolean;
  applicationTrackingEnabled?: boolean;
  interviewSchedulingEnabled?: boolean;
}

export interface FeesConfigurationData {
  feeCategories?: string[];
  classFeeStructures?: Array<{
    className: string;
    feeType: string;
    amount: number;
    frequency: 'monthly' | 'quarterly' | 'annually' | 'one_time';
    dueDateDay?: number;
    lateFeePerDay?: number;
  }>;
  onlineFeePaymentRequired?: boolean;
  feeReceiptsAutomated?: boolean;
  parentLedgerHistoryEnabled?: boolean;
  dueRemindersEnabled?: boolean;
}

export interface AttendanceData {
  studentAttendanceMode?: 'daily' | 'period_wise' | 'biometric_sync';
  staffAttendanceMode?: 'biometric' | 'app_manual' | 'register';
  lateArrivalTracking?: boolean;
  leaveManagementEnabled?: boolean;
  parentAbsenceNotification?: 'sms' | 'whatsapp' | 'email' | 'none';
  workingDays?: number[];
}

export interface ExaminationData {
  examTypes?: string[];
  terms?: string[];
  gradingSystem?: 'cbse_9point' | 'cbse_8point' | 'percentage' | 'custom_marks';
  hasInternalAssessment?: boolean;
  hasPracticalMarks?: boolean;
  reportCardLayout?: 'cbse_standard' | 'state_board' | 'narrative_primary';
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

export interface CommunicationData {
  channelsRequired?: string[];
  parentCommunicationEnabled?: boolean;
  staffCommunicationEnabled?: boolean;
  emergencyAnnouncementsEnabled?: boolean;
}

export interface CmsWorkflowData {
  managingRoles: string[];
  estimatedCmsUsers: number;
  requiresApprovalBeforePublish: boolean;
  contentCategories: string[];
  mediaUploadWorkflowNotes?: string;
}

export interface FacilitiesData {
  availableFacilities?: Array<{
    name: string;
    description?: string;
    features?: string[];
    isWebsiteVisible: boolean;
  }>;
}

export interface TransportData {
  enabled: boolean;
  routesCount?: number;
  vehiclesCount?: number;
  routes?: Array<{ routeName: string; startingPoint: string; destination: string; stops: string[]; monthlyFee?: number }>;
  gpsTrackingRequired?: boolean;
  parentGpsVisibility?: boolean;
}

export interface HostelData {
  enabled: boolean;
  hostelNames?: string[];
  capacityBoys?: number;
  capacityGirls?: number;
  rulesNotes?: string;
  monthlyFee?: number;
}

export interface LibraryData {
  enabled: boolean;
  bookCountEstimate?: number;
  categories?: string[];
  issueReturnTrackingNeeded?: boolean;
  barcodeScannerIntegration?: boolean;
}

export interface UniversalIntakeData {
  // 1. Core Profile & Identity (Backwards compatible key + extended fields)
  schoolProfile: SchoolIdentityData;

  // 2. Multiple Campuses / Branches
  campuses?: CampusBranchData[];

  // 3. School Leadership & Administration
  leadership?: SchoolLeadershipData;

  // 4. Branding & Visual Identity
  brandingDesign: SchoolBrandingData;

  // 5. Public Website Requirements
  websiteRequirements?: WebsiteRequirementsData;

  // 6. School About & Detailed Content
  schoolContent?: SchoolContentData;

  // 7. Academic Structure & Capacity
  institutionStructure?: AcademicStructureData;

  // 8. Staff & Faculty Roster
  staffFaculty?: StaffFacultyData;

  // 9. Student Configuration & Numbering
  studentConfig?: StudentConfigData;

  // 10. Admissions Experience
  admissions?: AdmissionsData;

  // 11. Fee Structures & Finance
  feesConfiguration?: FeesConfigurationData;

  // 12. Attendance Workflow
  attendanceConfig?: AttendanceData;

  // 13. Examination & Assessment
  examinationConfig?: ExaminationData;

  // 14. Timetable & Schedule
  timetableConfig?: TimetableData;

  // 15. Institutional Communication
  communicationConfig?: CommunicationData;

  // 16. Website CMS Workflow
  cmsRequirements?: CmsWorkflowData;

  // 17. Facilities
  facilitiesConfig?: FacilitiesData;

  // 18. Transport Management
  transportConfig?: TransportData;

  // 19. Hostel & Residential
  hostelConfig?: HostelData;

  // 20. Library Management
  libraryConfig?: LibraryData;

  // 21. Documents & Circulars
  documentsDownloads?: { documentsChecklist: string[] };

  // 22. Gallery & Multimedia
  mediaGallery?: { albums: string[]; hasCampusPhotos: boolean; hasEventPhotos: boolean; youtubeChannelUrl?: string };

  // 23. Social Media Presence
  socialMedia?: { facebook?: string; instagram?: string; youtube?: string; linkedin?: string; twitter?: string };

  // 24. Domain & Online Infrastructure
  domainPresence: {
    alreadyOwnsDomain: boolean;
    existingDomainName?: string;
    preferredNewDomainName?: string;
    currentRegistrar?: string;
    dnsManagementAccessAvailable: boolean;
    officialEmailDomainNeeded: boolean;
    schoolEmailProvider?: 'google_workspace' | 'microsoft_365' | 'cpanel_webmail' | 'none';
    socialMediaLinks?: {
      facebook?: string;
      instagram?: string;
      youtube?: string;
      twitter?: string;
    };
  };

  // 25. SEO & Search Setup
  seoConfig?: {
    seoSchoolTitle?: string;
    seoMetaDescription?: string;
    targetKeywords?: string;
    cityAndDistrictKeywords?: string;
    googleBusinessProfileUrl?: string;
    analyticsRequired?: boolean;
  };

  // 26. Third-Party Integrations
  integrationsConfig?: {
    paymentGateway?: 'razorpay' | 'phonepe' | 'payu' | 'none';
    smsGateway?: 'msg91' | 'fast2sms' | 'textlocal' | 'none';
    whatsappProvider?: 'meta_cloud_api' | 'gupshup' | 'none';
    biometricAttendanceSync?: boolean;
    accountingSoftware?: 'tally' | 'busy' | 'none';
  };

  // 27. ERP Legacy Data Migration
  existingSystemsMigration?: {
    currentSystemType: 'excel_spreadsheets' | 'older_desktop_software' | 'cloud_software' | 'paper_registers';
    currentSoftwareName?: string;
    migrateStudentRecords: boolean;
    migrateStaffRecords: boolean;
    migrateHistoricalFeeLedgers: boolean;
    estimatedStudentRecordsToImport?: number;
    migrationReadinessStatus?: 'ready_files' | 'needs_formatting_help' | 'data_cleanup_in_progress';
  };

  // 28. User Roles & Security
  userRolesConfig?: {
    requiredRoles?: string[];
    customRoles?: string[];
  };

  // 29. Security & Privacy
  securityPrivacy?: {
    require2FAForAdmin?: boolean;
    parentStudentRoleSeparation?: boolean;
    auditLogsRetentionMonths?: number;
    automatedDailyBackup?: boolean;
  };

  // 30. Design References
  designReferences?: {
    preferredVisualTone?: string;
    referenceWebsites?: string;
    dislikedWebsites?: string;
    specialDesignNotes?: string;
  };

  // 31. Portals & ERP Questionnaire (backwards compatible fields)
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

  portalRequirements?: {
    parentPortalEnabled: boolean;
    studentPortalEnabled: boolean;
    staffPortalEnabled: boolean;
    parentNotificationChannels: string[];
    resultPublishingOnPortal: boolean;
    feeReceiptsDownloadable: boolean;
    attendanceVisibilityImmediate: boolean;
  };

  // 32. Administrative Provisioning
  usersAccess: {
    superAdminFullName: string;
    superAdminEmail: string;
    superAdminPhone: string;
    initialStaffLoginsCountEstimate?: number;
  };

  // 33. Custom Requirements
  additionalRequirements?: {
    specialCustomWorkflows?: string;
    customReportsRequired?: string;
    thirdPartyIntegrations?: string;
    generalCommentsOrQuestions?: string;
  };

  // 34. Client Legal Confirmation (Phase 36)
  clientConfirmation?: {
    confirmedByName: string;
    confirmedByDesignation: string;
    confirmedByEmail: string;
    confirmedByPhone: string;
    isConfirmed: boolean;
    confirmedAt: string;
    declarationStatement?: string;
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
  project_id?: string | null;
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

// --- BUSINESS CLIENT PROJECT INTAKE & LIFECYCLE TYPES ----------------------

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
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessProject {
  id: string;
  project_number: string; // e.g. BUS-2026-0001
  lead_id?: string | null;
  client_id?: string | null;
  project_type: 'BUSINESS' | 'SCHOOL';
  project_name: string;
  service_type: string;
  project_status: BusinessProjectStatus;
  assigned_team?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;

  // Joined client or lead details for convenience
  client?: Client | null;
  lead?: Lead | null;
}

export interface BusinessProjectFilter {
  query?: string;
  status?: BusinessProjectStatus | 'ALL';
  serviceType?: string | 'ALL';
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



