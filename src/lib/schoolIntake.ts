import {
  isValidSchoolId,
  type UniversalIntakeData,
  type SchoolProjectCustomField,
  type TargetLaunchTimelineOption,
  type DeliveryPriorityOption,
  type CampusImageCategory,
  type CampusCategoryDefinition,
  type WebsitePageConfiguration,
  type MobileAppData,
  type MobileAppAudienceId,
  type MobileAppPlatformId,
  type MobileAppAuthMethod,
  type MobileAppDistributionId,
  type SchoolAccommodationType,
  type AcademicClassConfig,
} from './types';
import { isAddressFieldValid, resolveAddressValue, isKnownDistrict } from './geography';
import { syncAssetChecklistWithIntake, calculateAssetChecklistScore } from './schoolAssetChecklist';
import { calculateExpeditedDeliveryFee, schoolDeliveryPricing } from './schoolPricing';
import {
  buildWebsitePageConfigurations,
  generateMandatoryDisclosureConfig,
  generateWebsiteDeveloperSpec,
} from './websitePageRequirements';
import { normalizeAdmissionsData } from './admissionsUtils';
import { getTransportSectionScore, normalizeTransportData } from './transportUtils';
import { getLibrarySectionScore, normalizeLibraryData } from './libraryUtils';
import { isHostelApplicable, getHostelSectionScore, normalizeHostelData } from './hostelUtils';
import { getCommunicationSectionScore, normalizeCommunicationData } from './communicationUtils';
import {
  createDefaultSecurityPrivacyData,
  calculateSecuritySectionScore,
} from './securityPrivacyUtils';
import {
  getIntegrationsSectionScore,
  normalizeIntegrationsData,
  createDefaultIntegrationsConfig,
} from './integrationsUtils';
import {
  calculateDataMigrationScore,
  normalizeDataMigrationData,
  validateDataMigrationData,
} from './dataMigrationUtils';
import { generateFullSchoolContent } from './schoolContentGenerator';
import { resolveContentBlockText } from './types';
import {
  validatePortalRequirementsData,
  normalizePortalRequirementsData,
} from './portalRequirementsUtils';
import {
  validateMediaAssetsData,
  normalizeMediaAssetsData,
} from './mediaAssetsUtils';
import {
  resolveCampusSectionData,
  getCampusDisplayName,
  getMainCampus,
} from './campusScopeRegistry';
import { getFacilitiesSectionScore } from './facilitiesUtils';
import { normalizeFeesData } from './feeCalculationEngine';
import { getInitialCurriculumData } from './curriculumBoardPresets';
import {
  migrateAndNormalizeAcademicFees,
  calculateAdmissionCompleteness,
  calculateFeeStructureCompleteness,
  calculateCurriculumCompleteness,
  calculateAcademicCompleteness,
} from './academicCompletenessEngine';

export {
  isHostelApplicable,
  migrateAndNormalizeAcademicFees,
  calculateAdmissionCompleteness,
  calculateFeeStructureCompleteness,
  calculateCurriculumCompleteness,
  calculateAcademicCompleteness,
};

export type IntakeSectionKey =
  | 'schoolProfile'
  | 'campuses'
  | 'leadership'
  | 'brandingDesign'
  | 'websiteRequirements'
  | 'schoolContent'
  | 'institutionStructure'
  | 'staffFaculty'
  | 'studentConfig'
  | 'admissions'
  | 'feesConfiguration'
  | 'curriculum'
  | 'attendanceConfig'
  | 'examinationConfig'
  | 'transportConfig'
  | 'facilitiesConfig'
  | 'libraryConfig'
  | 'hostelConfig'
  | 'communicationConfig'
  | 'cmsRequirements'
  | 'domainPresence'
  | 'existingSystemsMigration'
  | 'integrationsConfig'
  | 'mobileAppConfig'
  | 'securityPrivacy'
  | 'assetChecklist'
  | 'legalPolicies'
  | 'projectDelivery'
  | 'usersAccess'
  | 'erpRequirements'
  | 'portalRequirements'
  | 'mediaAssets'
  | 'websiteScope'
  | 'additionalRequirements';

export type IntakeChapterKey =
  | 'chapter_school_info'
  | 'chapter_campus_operations'
  | 'chapter_operations_finance'
  | 'chapter_content_compliance'
  | 'chapter_website_configuration'
  | 'chapter_review_signoff'
  // Backward compatibility aliases
  | 'chapter_identity'
  | 'chapter_branding_website'
  | 'chapter_academics_people'
  | 'chapter_campus_facilities'
  | 'chapter_tech_integrations'
  | 'chapter_assets_legal';

export interface SectionMetadata {
  key: IntakeSectionKey;
  chapter: IntakeChapterKey;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  applicableProducts: ('school-website' | 'school-website-cms' | 'school-erp' | 'school-complete')[];
  isMandatory: boolean;
  isConditional?: boolean;
}

export const INTAKE_CHAPTERS: Array<{ key: IntakeChapterKey; title: string; subtitle: string; iconName: string }> = [
  { key: 'chapter_school_info', title: 'School Information', subtitle: 'Permanent registration, branding, leadership & academics', iconName: 'School' },
  { key: 'chapter_campus_operations', title: 'Campus & Operations', subtitle: 'Campus infrastructure, facilities, transport & hostel', iconName: 'Building2' },
  { key: 'chapter_operations_finance', title: 'Academic', subtitle: 'Enrollment desk, fee structure & academic curriculum', iconName: 'GraduationCap' },
  { key: 'chapter_content_compliance', title: 'Content & Compliance', subtitle: 'Media gallery kit, document checklist & legal disclosures', iconName: 'FileText' },
  { key: 'chapter_website_configuration', title: 'Website Configuration', subtitle: 'Website scope, domain setup & custom requirements', iconName: 'Settings' },
  { key: 'chapter_review_signoff', title: 'Verification & Final Sign-Off', subtitle: 'Authoritative publication review, readiness & submission', iconName: 'ShieldCheck' },
];

export const DESIGNATION_OTHER = 'Other';

export const PRINCIPAL_DESIGNATIONS = [
  'Principal',
  'Headmaster',
  'Headmistress',
  'Director',
  'Managing Director',
  'Chairman',
  'Chairperson',
  'Secretary',
  'Administrator',
  'Academic Director',
  'Executive Director',
  'Vice Principal',
  'Head of School',
  'Head of Institution',
  DESIGNATION_OTHER,
] as const;

export const TRUSTEE_DESIGNATIONS = [
  'Trustee',
  'Chairman',
  'Chairperson',
  'Vice Chairman',
  'Secretary',
  'Treasurer',
  'Director',
  'Managing Director',
  'Management Committee Head',
  'Management Committee Member',
  'Governing Body Member',
  'Administrator',
  'Academic Director',
  'Executive Director',
  DESIGNATION_OTHER,
] as const;

export function resolveDesignationDisplay(designation?: string | null): string {
  if (!designation) return '';
  const trimmed = designation.trim();
  if (trimmed.toLowerCase() === 'other') return '';
  return trimmed;
}

export function isPredefinedDesignation(val: string, options: readonly string[]): boolean {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  if (trimmed === 'other') return false;
  return options.some((opt) => opt.toLowerCase() === trimmed && opt.toLowerCase() !== 'other');
}

export type { SchoolAccommodationType };

export interface SchoolAccommodationOption {
  value: SchoolAccommodationType;
  label: string;
  description: string;
}

export const SCHOOL_ACCOMMODATION_OPTIONS: readonly SchoolAccommodationOption[] = [
  {
    value: 'day_school',
    label: 'Day School',
    description:
      'Students attend school during the day and return home after school hours. No hostel accommodation is provided.',
  },
  {
    value: 'both_day_and_residential',
    label: 'Day & Residential (Hostel)',
    description:
      'The school offers both day schooling and hostel accommodation for students who live on campus.',
  },
  {
    value: 'day_boarding',
    label: 'Day Boarding',
    description:
      'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.',
  },
  {
    value: 'residential',
    label: 'Residential / Boarding School',
    description:
      'Students live on the school campus in school-provided hostel/residential facilities.',
  },
] as const;

export const SCHOOL_ACCOMMODATION_LABELS: Record<SchoolAccommodationType, string> = {
  day_school: 'Day School',
  day_boarding: 'Day Boarding',
  residential: 'Residential / Boarding School',
  both_day_and_residential: 'Day & Residential (Hostel)',
};

export const SCHOOL_ACCOMMODATION_DESCRIPTIONS: Record<SchoolAccommodationType, string> = {
  day_school:
    'Students attend school during the day and return home after school hours. No hostel accommodation is provided.',
  both_day_and_residential:
    'The school offers both day schooling and hostel accommodation for students who live on campus.',
  day_boarding:
    'Students remain at school for extended hours, including meals and supervised study/activities, but do not stay overnight.',
  residential:
    'Students live on the school campus in school-provided hostel/residential facilities.',
};

/**
 * Resolves the contextual description for a school accommodation / residential status value.
 */
export function getSchoolAccommodationDescription(val?: string | null): string {
  const canonical = normalizeSchoolAccommodationType(val);
  return SCHOOL_ACCOMMODATION_DESCRIPTIONS[canonical];
}

/**
 * Normalizes any canonical, human-readable, or legacy residential status string
 * to its canonical enum value ('day_school' | 'day_boarding' | 'residential' | 'both_day_and_residential').
 */
export function normalizeSchoolAccommodationType(val?: string | null): SchoolAccommodationType {
  if (!val) return 'day_school';
  const normalized = val.trim().toLowerCase();
  if (
    normalized === 'both_day_and_residential' ||
    normalized === 'both day & residential' ||
    normalized === 'both day and residential' ||
    normalized === 'day & residential (hostel)' ||
    normalized === 'day & residential' ||
    normalized === 'day and residential'
  ) {
    return 'both_day_and_residential';
  }
  if (
    normalized === 'residential' ||
    normalized === 'residential / boarding school' ||
    normalized === 'residential / boarding' ||
    normalized === 'boarding'
  ) {
    return 'residential';
  }
  if (normalized === 'day_boarding' || normalized === 'day boarding') {
    return 'day_boarding';
  }
  return 'day_school';
}

/**
 * Resolves a human-readable display label for a school accommodation / residential status value.
 * Fully backwards-compatible with existing stored values, canonical enums, and legacy strings.
 */
export function getSchoolAccommodationLabel(val?: string | null): string {
  const canonical = normalizeSchoolAccommodationType(val);
  return SCHOOL_ACCOMMODATION_LABELS[canonical];
}

export interface ImageTypeOption {
  value: string;
  label: string;
}

/**
 * Canonical 10 Campus Gallery Categories
 * Single source of truth for category keys, display labels, descriptions, and empty states.
 */
export const CAMPUS_GALLERY_CATEGORIES: readonly CampusCategoryDefinition[] = [
  {
    key: 'campus_buildings',
    label: 'Campus & Buildings',
    description: 'Main campus, academic blocks, entrances and buildings.',
    uploadPrompt: 'Upload all campus exterior, entrance and building photos for this campus.',
    addBtnLabel: 'Add Campus & Building Images',
    emptyStateText: 'No campus or building photos have been added yet.',
  },
  {
    key: 'classrooms',
    label: 'Classrooms',
    description: 'Regular classrooms, smart classrooms and learning spaces.',
    uploadPrompt: 'Upload all classroom photos for this campus.',
    addBtnLabel: 'Add Classroom Images',
    emptyStateText: 'No classroom photos have been added yet.',
  },
  {
    key: 'laboratories',
    label: 'Laboratories',
    description: 'Science, computer, robotics and specialized laboratories.',
    uploadPrompt: 'Upload all laboratory photos for this campus.',
    addBtnLabel: 'Add Laboratory Images',
    emptyStateText: 'No laboratory photos have been added yet.',
  },
  {
    key: 'library',
    label: 'Library',
    description: 'Library spaces, reading areas and resources.',
    uploadPrompt: 'Upload all library and reading room photos for this campus.',
    addBtnLabel: 'Add Library Images',
    emptyStateText: 'No library photos have been added yet.',
  },
  {
    key: 'sports_playground',
    label: 'Sports & Playground',
    description: 'Grounds, courts, sports facilities and playgrounds.',
    uploadPrompt: 'Upload all sports, grounds, and court photos for this campus.',
    addBtnLabel: 'Add Sports & Playground Images',
    emptyStateText: 'No sports or playground photos have been added yet.',
  },
  {
    key: 'activities',
    label: 'Activities',
    description: 'Clubs, activity rooms, arts, music and student activities.',
    uploadPrompt: 'Upload all activity rooms, music, art and club photos for this campus.',
    addBtnLabel: 'Add Activity Images',
    emptyStateText: 'No activity photos have been added yet.',
  },
  {
    key: 'events',
    label: 'Events',
    description: 'Annual functions, celebrations, ceremonies and school events.',
    uploadPrompt: 'Upload all event, annual day, and celebration photos for this campus.',
    addBtnLabel: 'Add Event Images',
    emptyStateText: 'No event photos have been added yet.',
  },
  {
    key: 'transport',
    label: 'Transport',
    description: 'School buses, transport facilities and boarding areas.',
    uploadPrompt: 'Upload all school bus, fleet, and transport photos for this campus.',
    addBtnLabel: 'Add Transport Images',
    emptyStateText: 'No transport photos have been added yet.',
  },
  {
    key: 'cafeteria',
    label: 'Cafeteria',
    description: 'Cafeteria, dining hall and food-service areas.',
    uploadPrompt: 'Upload all cafeteria, dining, and mess photos for this campus.',
    addBtnLabel: 'Add Cafeteria Images',
    emptyStateText: 'No cafeteria photos have been added yet.',
  },
  {
    key: 'other',
    label: 'Other',
    description: 'Images that do not fit the categories above.',
    uploadPrompt: 'Upload other photos that do not fit the categories above.',
    addBtnLabel: 'Add Other Images',
    emptyStateText: 'No other photos have been added yet.',
  },
] as const;

export const DEFAULT_CATEGORY_CAPTIONS: Record<CampusImageCategory, string> = {
  campus_buildings: 'Modern school infrastructure and campus facilities',
  classrooms: 'Engaging and collaborative learning inside modern classrooms',
  laboratories: 'Hands-on practical learning in our state-of-the-art laboratory',
  library: 'Extensive learning resources and quiet reading space in our library',
  sports_playground: 'Outdoor athletic sports and physical fitness facilities',
  activities: 'Students participating in creative and co-curricular activities',
  events: 'Annual Day, festivals, and celebratory campus events',
  transport: 'Safe and comfortable GPS-tracked school transportation fleet',
  cafeteria: 'Hygienic campus dining and nutritious meal facilities',
  other: 'Campus learning facilities and infrastructure',
};

/**
 * Resolves a tailored default caption for a given campus image category.
 */
export function getDefaultCaptionForCategory(category?: CampusImageCategory | string | null): string {
  if (category && category in DEFAULT_CATEGORY_CAPTIONS) {
    return DEFAULT_CATEGORY_CAPTIONS[category as CampusImageCategory];
  }
  return 'Campus learning facilities and infrastructure';
}

/**
 * Maximum number of photos that can be designated as Home Page Hero slides.
 */
export const MAX_HERO_IMAGES_LIMIT = 7;

export function isCampusImageCategory(val: unknown): val is CampusImageCategory {
  if (typeof val !== 'string') return false;
  return CAMPUS_GALLERY_CATEGORIES.some((c) => c.key === val);
}

export function resolveCategoryLabel(cat?: string | null): string {
  if (!cat) return '';
  const match = CAMPUS_GALLERY_CATEGORIES.find((c) => c.key === cat);
  return match ? match.label : cat;
}

export function resolveCategoryDescription(cat?: string | null): string {
  if (!cat) return '';
  const match = CAMPUS_GALLERY_CATEGORIES.find((c) => c.key === cat);
  return match ? match.description : '';
}

/**
 * Maps legacy detailed `image_type` values to canonical 10 gallery categories.
 */
export function mapLegacyImageTypeToCategory(legacyType?: string | null): CampusImageCategory | null {
  if (!legacyType || !legacyType.trim()) return null;
  const t = legacyType.trim().toLowerCase();

  // Already a valid category key
  if (isCampusImageCategory(t)) return t;

  if (
    t === 'campus / building' ||
    t === 'campus entrance' ||
    t === 'reception / front desk' ||
    t === 'helpdesk' ||
    t === 'security / gate' ||
    t === 'administrative office' ||
    t === 'principal / head office'
  ) {
    return 'campus_buildings';
  }
  if (t === 'classroom') {
    return 'classrooms';
  }
  if (t === 'laboratory' || t === 'computer lab' || t === 'science lab') {
    return 'laboratories';
  }
  if (t === 'library') {
    return 'library';
  }
  if (t === 'playground / sports') {
    return 'sports_playground';
  }
  if (t === 'activity room' || t === 'prayer / assembly area') {
    return 'activities';
  }
  if (t === 'auditorium / hall') {
    return 'activities';
  }
  if (t === 'events' || t === 'event') {
    return 'events';
  }
  if (t === 'transport / bus' || t === 'transport') {
    return 'transport';
  }
  if (t === 'cafeteria / dining' || t === 'cafeteria') {
    return 'cafeteria';
  }
  if (t === 'other') {
    return 'other';
  }
  return 'other';
}

/**
 * Optional secondary subtypes mapped to category for advanced metadata specification
 */
export function getCategorySubtypes(cat: CampusImageCategory): readonly ImageTypeOption[] {
  switch (cat) {
    case 'campus_buildings':
      return [
        { value: 'Campus / Building', label: 'Campus / Building' },
        { value: 'Campus Entrance', label: 'Campus Entrance' },
        { value: 'Reception / Front Desk', label: 'Reception / Front Desk' },
        { value: 'Helpdesk', label: 'Helpdesk' },
        { value: 'Security / Gate', label: 'Security / Gate' },
        { value: 'Administrative Office', label: 'Administrative Office' },
        { value: 'Principal / Head Office', label: 'Principal / Head Office' },
      ];
    case 'classrooms':
      return [
        { value: 'Classroom', label: 'Standard Classroom' },
        { value: 'Smart Classroom', label: 'Smart Classroom' },
        { value: 'Lecture Hall', label: 'Lecture Hall' },
      ];
    case 'laboratories':
      return [
        { value: 'Laboratory', label: 'General Laboratory' },
        { value: 'Science Lab', label: 'Science Lab (Physics / Chemistry / Bio)' },
        { value: 'Computer Lab', label: 'Computer Lab' },
        { value: 'Robotics Lab', label: 'Robotics / STEM Lab' },
      ];
    case 'library':
      return [
        { value: 'Library', label: 'Central Library' },
        { value: 'Reading Room', label: 'Reading Room' },
        { value: 'Digital Library', label: 'Digital Library' },
      ];
    case 'sports_playground':
      return [
        { value: 'Playground / Sports', label: 'Main Playground' },
        { value: 'Sports Court', label: 'Sports Court (Basketball / Tennis)' },
        { value: 'Football Ground', label: 'Football / Cricket Ground' },
        { value: 'Indoor Sports Arena', label: 'Indoor Sports Complex' },
      ];
    case 'activities':
      return [
        { value: 'Activity Room', label: 'Activity Room' },
        { value: 'Auditorium / Hall', label: 'Auditorium / Hall' },
        { value: 'Music / Dance Studio', label: 'Music & Dance Studio' },
        { value: 'Art & Craft Room', label: 'Art & Craft Studio' },
        { value: 'Prayer / Assembly Area', label: 'Prayer / Assembly Area' },
      ];
    case 'events':
      return [
        { value: 'Annual Day', label: 'Annual Day / Function' },
        { value: 'Sports Day', label: 'Sports Day' },
        { value: 'Exhibition', label: 'Science / Art Exhibition' },
        { value: 'Celebration', label: 'Festival / Celebration' },
      ];
    case 'transport':
      return [
        { value: 'Transport / Bus', label: 'School Bus' },
        { value: 'Fleet', label: 'Transport Fleet' },
        { value: 'Bus Bay', label: 'Pick-up & Drop Bay' },
      ];
    case 'cafeteria':
      return [
        { value: 'Cafeteria / Dining', label: 'Cafeteria / Dining Hall' },
        { value: 'Canteen', label: 'School Canteen' },
        { value: 'Kitchen Area', label: 'Hygienic Kitchen Area' },
      ];
    case 'other':
    default:
      return [{ value: 'other', label: 'Other' }];
  }
}

export const CAMPUS_IMAGE_TYPES: readonly ImageTypeOption[] = [
  { value: 'Campus / Building', label: 'Campus / Building' },
  { value: 'Campus Entrance', label: 'Campus Entrance' },
  { value: 'Reception / Front Desk', label: 'Reception / Front Desk' },
  { value: 'Helpdesk', label: 'Helpdesk' },
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Library', label: 'Library' },
  { value: 'Playground / Sports', label: 'Playground / Sports' },
  { value: 'Auditorium / Hall', label: 'Auditorium / Hall' },
  { value: 'Computer Lab', label: 'Computer Lab' },
  { value: 'Science Lab', label: 'Science Lab' },
  { value: 'Activity Room', label: 'Activity Room' },
  { value: 'Transport / Bus', label: 'Transport / Bus' },
  { value: 'Cafeteria / Dining', label: 'Cafeteria / Dining' },
  { value: 'Security / Gate', label: 'Security / Gate' },
  { value: 'Administrative Office', label: 'Administrative Office' },
  { value: 'Principal / Head Office', label: 'Principal / Head Office' },
  { value: 'Prayer / Assembly Area', label: 'Prayer / Assembly Area' },
  { value: 'other', label: 'Other' },
] as const;

export const PRINCIPAL_IMAGE_TYPES: readonly ImageTypeOption[] = [
  { value: 'Principal / Head of Institution', label: 'Principal / Head of Institution' },
  { value: 'Headmaster / Headmistress', label: 'Headmaster / Headmistress' },
  { value: 'Director', label: 'Director' },
  { value: 'Academic Head', label: 'Academic Head' },
  { value: 'School Leadership', label: 'School Leadership' },
  { value: 'other', label: 'Other' },
] as const;

export const TRUSTEE_IMAGE_TYPES: readonly ImageTypeOption[] = [
  { value: 'Trustee', label: 'Trustee' },
  { value: 'Chairperson', label: 'Chairperson' },
  { value: 'Director', label: 'Director' },
  { value: 'Managing Committee Member', label: 'Managing Committee Member' },
  { value: 'Management Representative', label: 'Management Representative' },
  { value: 'Governing Body Member', label: 'Governing Body Member' },
  { value: 'School Leadership', label: 'School Leadership' },
  { value: 'other', label: 'Other' },
] as const;

export function resolveImageTypeDisplay(
  imageType?: string | null,
  customImageType?: string | null,
  customOptions?: readonly ImageTypeOption[]
): string {
  if (!imageType) return '';
  if (imageType.toLowerCase() === 'other') {
    return customImageType?.trim() || 'Other';
  }
  const pool = customOptions || [
    ...CAMPUS_IMAGE_TYPES,
    ...PRINCIPAL_IMAGE_TYPES,
    ...TRUSTEE_IMAGE_TYPES,
  ];
  const match = pool.find(
    (opt) => opt.value.toLowerCase() === imageType.toLowerCase()
  );
  return match ? match.label : imageType;
}


export function isValidGoogleMapsUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return true;
  const trimmed = url.trim();
  try {
    const withProto = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // 1. Mobile app share links: maps.app.goo.gl
    if (host === 'maps.app.goo.gl') return true;

    // 2. Short links: goo.gl/maps
    if (host === 'goo.gl' && (path.startsWith('/maps') || path.length > 1)) return true;

    // 3. Subdomain: maps.google.<tld> (e.g. maps.google.com, maps.google.co.in)
    if (host === 'maps.google.com' || /^maps\.google\.[a-z.]+$/i.test(host)) return true;

    // 4. Domain: [www.]google.<tld>/maps (e.g. google.com/maps, www.google.com/maps, google.co.in/maps)
    if (
      (host === 'google.com' || host === 'www.google.com' || /(?:^|\.)google\.[a-z.]+$/i.test(host)) &&
      (path.startsWith('/maps') || path.includes('/maps'))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export const INTAKE_SECTIONS: SectionMetadata[] = [
  // Chapter 1: School Information
  {
    key: 'schoolProfile',
    chapter: 'chapter_school_info',
    stepNumber: 1,
    title: 'School Identity & Permanent Legal Information',
    shortTitle: 'Identity',
    description: 'UDISE code, legal registration, board affiliation & official contacts.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'campuses',
    chapter: 'chapter_school_info',
    stepNumber: 2,
    title: 'Campuses & Branch Structure',
    shortTitle: 'Campuses',
    description: 'Main campus location, postal address, GPS map pin, secondary branches, coordinators & operating hours.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'leadership',
    chapter: 'chapter_school_info',
    stepNumber: 3,
    title: 'Management & Leadership',
    shortTitle: 'Leadership',
    description: 'Principal credentials, board of management, vision, mission, and leadership messages.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'brandingDesign',
    chapter: 'chapter_school_info',
    stepNumber: 4,
    title: 'Brand Identity & School Profile',
    shortTitle: 'Brand Identity',
    description: "Provide the school's official identity and communication style. Ekaagra will use this information to create a consistent digital presence.",
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'schoolContent',
    chapter: 'chapter_school_info',
    stepNumber: 5,
    title: 'School Story, Mission & Educational Philosophy',
    shortTitle: 'Story & Philosophy',
    description: 'Review the content prepared from your school information and personalize it before it is used across your website and digital materials.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'institutionStructure',
    chapter: 'chapter_school_info',
    stepNumber: 6,
    title: 'Academic Structure & Curriculum',
    shortTitle: 'Academics',
    description: 'Academic session dates, class hierarchy, sections, subjects & academic streams.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'staffFaculty',
    chapter: 'chapter_school_info',
    stepNumber: 7,
    title: 'Staff & Faculty Configuration',
    shortTitle: 'Faculty',
    description: 'Teaching counts, departments, employee ID conventions, and Excel/CSV bulk roster import.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'studentConfig',
    chapter: 'chapter_school_info',
    stepNumber: 8,
    title: 'Student Information & Configuration',
    shortTitle: 'Students',
    description: 'Field selection, dynamic Excel/CSV template, student roster import & numbering rules.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },

  // Chapter 2: Campus & Operations
  {
    key: 'facilitiesConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 9,
    title: 'Campus Facilities & Infrastructure Highlights',
    shortTitle: 'Facilities',
    description: 'Smart classrooms, composite science labs, computer laboratories & sports amenities.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'transportConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 10,
    title: 'Transport Fleet & Route Management',
    shortTitle: 'Transport',
    description: 'Bus count, route planning, GPS tracking requirements & parent transit visibility.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
    isConditional: true,
  },
  {
    key: 'libraryConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 11,
    title: 'Library Management System',
    shortTitle: 'Library',
    description: 'Book volume estimate, barcode/RFID integration, circulation limits & fine policies.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
    isConditional: true,
  },
  {
    key: 'hostelConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 12,
    title: 'Hostel & Residential Boarding',
    shortTitle: 'Hostel',
    description: 'Boarding capacity, room categories, wardens, mess facilities & residential curfew rules.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
    isConditional: true, // Only if Residential
  },

  // Chapter 3: Academic (Admission, Fee Structure, Curriculum)
  {
    key: 'admissions',
    chapter: 'chapter_operations_finance',
    stepNumber: 13,
    title: 'Admission Desk & Enrollment',
    shortTitle: 'Admission',
    description: 'Target admission session, class availability, age eligibility, admission process, required documents and key dates.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'feesConfiguration',
    chapter: 'chapter_operations_finance',
    stepNumber: 14,
    title: 'Fee Structure & Payment Policies',
    shortTitle: 'Fee Structure',
    description: 'Configure common fees, class-wise inheritance, optional services, payment plans, scholarships and transparent public fee presentation.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'curriculum',
    chapter: 'chapter_operations_finance',
    stepNumber: 15,
    title: 'Academic Curriculum & Subjects',
    shortTitle: 'Curriculum',
    description: 'Curriculum overview, pedagogical approach, class-wise curriculum objectives, and reusable subject catalog.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },

  // Campus Operations - ERP Modules
  {
    key: 'attendanceConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 16,
    title: 'Attendance Workflow & Timetable Schedule',
    shortTitle: 'Attendance',
    description: 'Daily/biometric attendance modes, school timings, period duration & parent alerts.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'examinationConfig',
    chapter: 'chapter_campus_operations',
    stepNumber: 17,
    title: 'Examinations, Grading & Report Cards',
    shortTitle: 'Exams',
    description: 'Exam terms, grading scales (CBSE/Percentage), internal marks & report card templates.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },

  // Chapter 4: Content & Compliance
  {
    key: 'mediaAssets',
    chapter: 'chapter_content_compliance',
    stepNumber: 17,
    title: 'Media Assets & Content Kit',
    shortTitle: 'Media Kit',
    description: 'Official branding photos, campus infrastructure photography & gallery collections.',
    applicableProducts: ['school-erp'],
    isMandatory: false,
  },
  {
    key: 'assetChecklist',
    chapter: 'chapter_content_compliance',
    stepNumber: 18,
    title: 'Content, Assets & Documents Provisioning',
    shortTitle: 'Assets & Documents',
    description: 'Structured repository of photos, affiliation certificates, prospectuses & mandatory disclosures.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'legalPolicies',
    chapter: 'chapter_content_compliance',
    stepNumber: 19,
    title: 'Legal Policies & Statutory Disclosures',
    shortTitle: 'Legal & Policies',
    description: 'Privacy policy, fee refund rules, child protection guidelines & mandatory public disclosure.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'projectDelivery',
    chapter: 'chapter_content_compliance',
    stepNumber: 20,
    title: 'Project Timeline & Delivery Priorities',
    shortTitle: 'Delivery Scope',
    description: 'Target launch dates, Phase 1 vs Phase 2 priorities, deadlines & designated decision makers.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },

  // Chapter 5: Website Configuration / Project Scope
  {
    key: 'websiteScope',
    chapter: 'chapter_website_configuration',
    stepNumber: 21,
    title: 'Website Scope & Project Configuration',
    shortTitle: 'Website Scope',
    description: 'Select the modules, pages, and special capabilities that apply to this website project.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'domainPresence',
    chapter: 'chapter_website_configuration',
    stepNumber: 22,
    title: 'Website & Domain Setup',
    shortTitle: 'Domain Setup',
    description: 'Configure your preferred website domain, transfer existing domain, or decide later.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'additionalRequirements',
    chapter: 'chapter_website_configuration',
    stepNumber: 23,
    title: 'Custom Requirements & Special Requests',
    shortTitle: 'Custom Requirements',
    description: 'Capture project-specific client requests that do not fit into the standard school data model.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'communicationConfig',
    chapter: 'chapter_website_configuration',
    stepNumber: 24,
    title: 'Institutional Communication Preferences',
    shortTitle: 'Communication',
    description: 'WhatsApp API, SMS gateway, email circulars, push notifications & emergency broadcasts.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'cmsRequirements',
    chapter: 'chapter_website_configuration',
    stepNumber: 25,
    title: 'Website CMS Workflow & Publishing Roles',
    shortTitle: 'CMS Workflow',
    description: 'Editorial roles, draft approval workflows (single vs two-step) & publishing categories.',
    applicableProducts: ['school-website-cms', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'existingSystemsMigration',
    chapter: 'chapter_website_configuration',
    stepNumber: 26,
    title: 'Legacy Data Migration Assessment',
    shortTitle: 'Data Migration',
    description: 'Current system assessment (Excel/CSV/Legacy ERP/Tally), record volumes & formatting readiness.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'integrationsConfig',
    chapter: 'chapter_website_configuration',
    stepNumber: 27,
    title: 'Third-Party Integration Selections',
    shortTitle: 'Integrations',
    description: 'Gateway selections (Razorpay/MSG91/Meta Cloud API/Biometrics/DigiLocker). No secrets.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'mobileAppConfig',
    chapter: 'chapter_website_configuration',
    stepNumber: 28,
    title: 'Mobile Application Requirements',
    shortTitle: 'Mobile Apps',
    description: 'Parent, student, teacher and admin mobile apps for Android, iOS & PWA with push notifications.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'securityPrivacy',
    chapter: 'chapter_website_configuration',
    stepNumber: 29,
    title: 'Security, Privacy & Administrative Access',
    shortTitle: 'Security',
    description: 'Administrator headcounts, 2FA, session policies, audit logs retention & data export limits.',
    applicableProducts: ['school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'erpRequirements',
    chapter: 'chapter_website_configuration',
    stepNumber: 30,
    title: 'ERP Requirements & Scope',
    shortTitle: 'ERP Scope',
    description: 'Legacy ERP scope assessment',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'portalRequirements',
    chapter: 'chapter_website_configuration',
    stepNumber: 31,
    title: 'Portal Requirements & Notifications',
    shortTitle: 'Portals',
    description: 'Legacy portal visibility and alerts configuration',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: false,
  },

  // Chapter 6: Verification & Final Sign-Off
  {
    key: 'websiteRequirements',
    chapter: 'chapter_review_signoff',
    stepNumber: 32,
    title: 'Final Website Review & Submission',
    shortTitle: 'Final Review',
    description: 'Universal final review, verification, asset management, compliance, preview, download, and submission command center.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'usersAccess',
    chapter: 'chapter_review_signoff',
    stepNumber: 33,
    title: 'Administrator Provisioning & Final Sign-Off',
    shortTitle: 'Provisioning & Sign-Off',
    description: 'Super Administrator identity, invitation recipients, final completeness check & submission declaration.',
    applicableProducts: ['school-erp'],
    isMandatory: true,
  },
];

// ─── Section 20: Mobile Application Requirements Catalogs & Helpers ───────────

export const MOBILE_APP_AUDIENCES: Array<{
  id: MobileAppAudienceId;
  label: string;
  shortDesc: string;
  roleBadge: string;
}> = [
  {
    id: 'parent_app',
    label: 'Parent App',
    shortDesc: 'Parent mobile app for homework, fees, attendance, circulars & child progress.',
    roleBadge: 'Primary Guardian',
  },
  {
    id: 'student_app',
    label: 'Student App',
    shortDesc: 'Student mobile portal for assignments, timetable, exam prep & academic records.',
    roleBadge: 'Enrolled Students',
  },
  {
    id: 'teacher_app',
    label: 'Teacher / Staff App',
    shortDesc: 'Faculty app for daily attendance marking, homework publishing & student remarks.',
    roleBadge: 'Teaching Staff',
  },
  {
    id: 'admin_app',
    label: 'School Admin App',
    shortDesc: 'Administrative dashboard for daily headcounts, fee collections & alerts.',
    roleBadge: 'Management & Ops',
  },
  {
    id: 'driver_app',
    label: 'Transport / Driver App',
    shortDesc: 'Real-time bus GPS location streaming, pickup logs & route status.',
    roleBadge: 'Fleet Drivers',
  },
  {
    id: 'conductor_app',
    label: 'Conductor App',
    shortDesc: 'Bus student boarding verification, headcounts & stop confirmations.',
    roleBadge: 'Bus Attendants',
  },
  {
    id: 'management_app',
    label: 'Management / Principal App',
    shortDesc: 'Executive oversight, institutional KPIs, fee reconciliations & approvals.',
    roleBadge: 'Leadership',
  },
];

export const MOBILE_APP_PLATFORMS: Array<{
  id: MobileAppPlatformId;
  label: string;
  description: string;
}> = [
  { id: 'android', label: 'Android', description: 'Native Android app (.apk / Google Play Store bundle)' },
  { id: 'ios', label: 'iOS', description: 'Native Apple iOS app (.ipa / App Store bundle)' },
  { id: 'pwa', label: 'Progressive Web App (PWA)', description: 'Installable web app running across desktop & mobile browsers' },
];

export const MOBILE_APP_AUTH_METHODS: Array<{
  id: MobileAppAuthMethod;
  label: string;
  description: string;
}> = [
  { id: 'mobile_otp', label: 'Mobile Number + OTP', description: 'Instant SMS / WhatsApp OTP login (recommended for parents & staff)' },
  { id: 'email_password', label: 'Email + Password', description: 'Standard email address with password verification' },
  { id: 'username_password', label: 'Username + Password', description: 'Custom chosen alphanumeric username credentials' },
  { id: 'school_id_password', label: 'School ID + Password', description: 'Permanent student/employee institutional enrollment ID' },
  { id: 'multiple', label: 'Multiple methods', description: 'Allow users to select their preferred login method' },
];

export const MOBILE_APP_NOTIFICATION_CATEGORIES = [
  'Attendance',
  'Homework',
  'Exam / Results',
  'Fees / Payment',
  'Transport',
  'Timetable',
  'Circulars / Notices',
  'Events',
  'Leave Requests',
  'Emergency Alerts',
  'Messages',
  'School Announcements',
  'Other',
] as const;

export const MOBILE_APP_ACADEMIC_FEATURES = [
  { id: 'attendance', label: 'Attendance', desc: 'Daily attendance log, percentage & trends' },
  { id: 'homework', label: 'Homework / Assignments', desc: 'View assignments, download attachments, upload homework' },
  { id: 'timetable', label: 'Class Timetable', desc: 'Daily period schedule, subject teachers & substitutions' },
  { id: 'exam_schedule', label: 'Exam Schedule', desc: 'Exam dates, syllabus & reporting timings' },
  { id: 'exam_results', label: 'Exam Results', desc: 'Term scores, marks breakdown & rank if enabled' },
  { id: 'report_cards', label: 'Report Cards', desc: 'Download digital signed report cards' },
  { id: 'study_material', label: 'Study Material', desc: 'Subject notes, PDFs & reference links' },
  { id: 'online_classes', label: 'Online Classes', desc: 'Zoom / Google Meet link launcher' },
  { id: 'lesson_plans', label: 'Lesson Plans', desc: 'Syllabus coverage & upcoming topics' },
  { id: 'academic_calendar', label: 'Academic Calendar', desc: 'Terms, holidays, exams & school events' },
  { id: 'progress_tracking', label: 'Progress Tracking', desc: 'Continuous assessment & skill milestones' },
  { id: 'teacher_feedback', label: 'Teacher Feedback', desc: 'Teacher remarks, conduct notes & observations' },
  { id: 'student_performance', label: 'Student Performance', desc: 'Analytics graphs & subject-wise comparison' },
] as const;

export const MOBILE_APP_COMMUNICATION_FEATURES = [
  { id: 'school_announcements', label: 'School Announcements', desc: 'General morning broadcast bulletins' },
  { id: 'circulars', label: 'Circulars', desc: 'Official school notices & circulars' },
  { id: 'parent_teacher_comm', label: 'Parent-Teacher Communication', desc: 'Direct secure parent-teacher inquiries' },
  { id: 'teacher_messaging', label: 'Teacher Messaging', desc: 'Faculty-to-faculty internal coordination' },
  { id: 'broadcast_messages', label: 'Broadcast Messages', desc: 'Class-wide and school-wide announcements' },
  { id: 'notice_board', label: 'Notice Board', desc: 'Digital bulletin board for general updates' },
  { id: 'event_notifications', label: 'Event Notifications', desc: 'Invitations & reminders for upcoming celebrations' },
  { id: 'emergency_broadcast', label: 'Emergency Broadcast', desc: 'Urgent priority alerts for campus emergencies' },
  { id: 'whatsapp_integration', label: 'WhatsApp integration', desc: 'Synced WhatsApp alerts (credentials managed in integrations)' },
  { id: 'email_notifications', label: 'Email notifications', desc: 'Email digests (credentials managed in integrations)' },
  { id: 'sms_notifications', label: 'SMS notifications', desc: 'Transactional SMS alerts (credentials managed in integrations)' },
] as const;

export const MOBILE_APP_FEE_FEATURES = [
  { id: 'view_fee_structure', label: 'View Fee Structure', desc: 'Fee breakdown by quarter/term' },
  { id: 'view_outstanding_fees', label: 'View Outstanding Fees', desc: 'Real-time pending dues and late fee calculator' },
  { id: 'online_fee_payment', label: 'Online Fee Payment', desc: 'In-app UPI, Net Banking, Debit/Credit card payment' },
  { id: 'payment_receipts', label: 'Payment Receipts', desc: 'Download instant GST-compliant digital fee receipt' },
  { id: 'payment_history', label: 'Payment History', desc: 'Ledger of past transactions & reference IDs' },
  { id: 'fee_reminders', label: 'Fee Reminders', desc: 'Automated app push and due date alerts' },
  { id: 'installment_info', label: 'Installment Information', desc: 'Scheduled installment breakdown & milestones' },
  { id: 'discounts_concessions', label: 'Discounts / Concessions', desc: 'Sibling concession, staff discount & scholarship display' },
  { id: 'refund_status', label: 'Refund Status', desc: 'Security deposit and excess fee refund tracking' },
] as const;

export const MOBILE_APP_TRANSPORT_FEATURES = [
  { id: 'bus_tracking', label: 'Bus Tracking', desc: 'Real-time vehicle GPS location on interactive map' },
  { id: 'route_information', label: 'Route Information', desc: 'Stops, timings, pickup and drop points' },
  { id: 'bus_arrival_notifications', label: 'Bus Arrival Notifications', desc: 'Proximity alert when bus is 5-10 mins away' },
  { id: 'pickup_drop_notifications', label: 'Pickup / Drop Notifications', desc: 'Instant alert when child boards/deboards' },
  { id: 'driver_information', label: 'Driver Information', desc: 'Assigned driver name, contact & photo' },
  { id: 'conductor_information', label: 'Conductor Information', desc: 'Assigned attendant / conductor details' },
  { id: 'route_changes', label: 'Route Changes', desc: 'Notice of temporary route deviations or maintenance' },
  { id: 'transport_emergency_alerts', label: 'Transport Emergency Alerts', desc: 'Breakdown, delay or emergency SOS notification' },
] as const;

export const MOBILE_APP_DOCUMENT_SERVICES = [
  { id: 'download_circulars', label: 'Download Circulars', desc: 'PDF notices & school letters' },
  { id: 'download_report_cards', label: 'Download Report Cards', desc: 'Term & annual marksheets' },
  { id: 'certificates', label: 'Certificates', desc: 'Transfer certificate & character certificate requests' },
  { id: 'bonafide_certificate', label: 'Bonafide Certificate', desc: 'Instant digital bonafide certificate generator' },
  { id: 'fee_receipts', label: 'Fee Receipts', desc: 'Downloadable consolidated annual fee certificates' },
  { id: 'student_documents', label: 'Student Documents', desc: 'Aadhaar, birth certificate, vaccination cards' },
  { id: 'school_documents', label: 'School Documents', desc: 'Prospectus, rules handbook, code of conduct' },
  { id: 'digital_id_card', label: 'Digital ID Card', desc: 'Virtual student & staff identity card with QR code' },
  { id: 'digilocker_integration', label: 'DigiLocker integration', desc: 'Academic depository credential synchronization' },
] as const;

export const MOBILE_APP_DISTRIBUTION_OPTIONS: Array<{
  id: MobileAppDistributionId;
  label: string;
  description: string;
}> = [
  { id: 'play_store', label: 'Google Play Store', description: 'Standard public release for Android users worldwide' },
  { id: 'app_store', label: 'Apple App Store', description: 'Standard public release for iPhone/iPad users worldwide' },
  { id: 'internal', label: 'Private / Internal Distribution', description: 'Direct APK download / managed MDM organization distribution' },
  { id: 'pwa_only', label: 'PWA only', description: 'Instant browser installation without app store publishing' },
  { id: 'not_decided', label: 'Not decided', description: 'Determine publishing distribution method during build phase' },
];

export const MOBILE_APP_OFFLINE_FEATURES = [
  { id: 'cached_timetable', label: 'View cached timetable' },
  { id: 'cached_homework', label: 'View cached homework' },
  { id: 'cached_notices', label: 'View cached notices' },
  { id: 'cached_student_info', label: 'View cached student information' },
  { id: 'offline_sync', label: 'Offline data sync' },
] as const;

export function normalizeMobileAppData(
  raw?: Partial<MobileAppData>,
  schoolName?: string
): MobileAppData {
  const base = raw || {};

  // Normalize required apps
  let requiredApps: MobileAppAudienceId[];
  if (Array.isArray(base.requiredApps)) {
    requiredApps = [...base.requiredApps];
  } else {
    // Initial creation or legacy migration
    requiredApps = [];
    if (base.parentAppRequired ?? true) requiredApps.push('parent_app');
    if (base.studentAppRequired ?? true) requiredApps.push('student_app');
    if (base.teacherAppRequired ?? true) requiredApps.push('teacher_app');
    if (base.adminAppRequired ?? true) requiredApps.push('admin_app');
  }

  // Normalize supported platforms
  let supportedPlatforms: MobileAppPlatformId[];
  if (Array.isArray(base.supportedPlatforms)) {
    supportedPlatforms = [...base.supportedPlatforms];
  } else if (base.platforms) {
    supportedPlatforms = [];
    if (base.platforms.android) supportedPlatforms.push('android');
    if (base.platforms.ios) supportedPlatforms.push('ios');
    if (base.platforms.pwa) supportedPlatforms.push('pwa');
  } else {
    supportedPlatforms = ['android', 'pwa'];
  }

  // Normalize push notifications
  const pushEnabled = base.pushNotifications?.enabled ?? base.pushNotificationsRequired ?? true;
  let pushCategories: string[];
  if (Array.isArray(base.pushNotifications?.categories)) {
    pushCategories = [...base.pushNotifications.categories];
  } else {
    pushCategories = [
      'Attendance',
      'Homework',
      'Exam / Results',
      'Fees / Payment',
      'Circulars / Notices',
      'Emergency Alerts',
      'School Announcements',
    ];
  }

  // Normalize authentication
  const authentication = {
    authMethod: base.authentication?.authMethod || 'mobile_otp',
    authMethods: base.authentication?.authMethods || ['mobile_otp', 'email_password'],
    rememberDevice: base.authentication?.rememberDevice ?? true,
    biometricLogin: base.authentication?.biometricLogin ?? true,
    forgotPasswordEnabled: base.authentication?.forgotPasswordEnabled ?? true,
    accountSwitching: base.authentication?.accountSwitching ?? true,
    multiChildSupport: base.authentication?.multiChildSupport ?? true,
    roleBasedAccess: base.authentication?.roleBasedAccess ?? true,
    multipleGuardians: base.authentication?.multipleGuardians ?? true,
  };

  // Normalize branding
  const appDisplayName = base.branding?.appDisplayName !== undefined
    ? base.branding.appDisplayName
    : (schoolName || '').trim();

  const branding = {
    appDisplayName,
    iconPreference: (base.branding?.iconPreference || 'school_logo') as 'school_logo' | 'custom_icon',
    customIconUrl: base.branding?.customIconUrl,
    themeInherited: base.branding?.themeInherited ?? true,
    brandPrimaryColor: base.branding?.brandPrimaryColor,
  };

  // Normalize transport
  const transport = {
    features: Array.isArray(base.transport?.features)
      ? [...base.transport!.features]
      : ['bus_tracking', 'route_information', 'bus_arrival_notifications', 'pickup_drop_notifications'],
    trackingMethod: (base.transport?.trackingMethod || 'driver_phone') as 'dedicated_gps' | 'driver_phone' | 'hybrid' | 'not_decided',
    dedicatedGpsDeviceId: base.transport?.dedicatedGpsDeviceId || '',
    driverPhoneTrackingConsent: base.transport?.driverPhoneTrackingConsent ?? true,
  };

  // Normalize distribution
  let distribution: MobileAppDistributionId[];
  if (Array.isArray(base.distribution)) {
    distribution = [...base.distribution];
  } else {
    distribution = ['play_store'];
  }

  // Normalize languages
  const languages = Array.isArray(base.languages)
    ? [...base.languages]
    : ['English', 'Hindi'];

  // Normalize offline
  const offline = {
    enabled: (base.offline?.enabled || 'yes') as 'yes' | 'no' | 'not_decided',
    features: Array.isArray(base.offline?.features)
      ? [...base.offline!.features]
      : ['cached_timetable', 'cached_homework', 'cached_notices', 'offline_sync'],
  };

  // Academic features
  const academicFeatures = Array.isArray(base.academicFeatures)
    ? [...base.academicFeatures]
    : ['attendance', 'homework', 'timetable', 'exam_schedule', 'exam_results', 'report_cards', 'academic_calendar'];

  // Communication features
  const communicationFeatures = Array.isArray(base.communicationFeatures)
    ? [...base.communicationFeatures]
    : ['school_announcements', 'circulars', 'parent_teacher_comm', 'broadcast_messages', 'notice_board', 'emergency_broadcast'];

  // Fee features
  const feeFeatures = Array.isArray(base.feeFeatures)
    ? [...base.feeFeatures]
    : ['view_fee_structure', 'view_outstanding_fees', 'online_fee_payment', 'payment_receipts', 'fee_reminders'];

  // Document features
  const documentFeatures = Array.isArray(base.documentFeatures)
    ? [...base.documentFeatures]
    : ['download_circulars', 'download_report_cards', 'fee_receipts', 'digital_id_card'];

  const additionalRequirements = typeof base.additionalRequirements === 'string'
    ? base.additionalRequirements.slice(0, 1000)
    : '';

  return {
    ...base,
    // Legacy flags maintained in sync
    parentAppRequired: requiredApps.includes('parent_app'),
    studentAppRequired: requiredApps.includes('student_app'),
    teacherAppRequired: requiredApps.includes('teacher_app'),
    adminAppRequired: requiredApps.includes('admin_app'),
    platforms: {
      android: supportedPlatforms.includes('android'),
      ios: supportedPlatforms.includes('ios'),
      pwa: supportedPlatforms.includes('pwa'),
    },
    pushNotificationsRequired: pushEnabled,
    requiredFeatures: base.requiredFeatures || [
      'Daily Attendance',
      'Fee Receipts & Online Pay',
      'Exam Results',
      'Circulars',
      'Homework',
    ],
    // Structured data
    requiredApps,
    supportedPlatforms,
    authentication,
    pushNotifications: {
      enabled: pushEnabled,
      categories: pushCategories,
      priority: base.pushNotifications?.priority || 'high',
      emergencyMandatory: base.pushNotifications?.emergencyMandatory ?? true,
      otherCategoryText: base.pushNotifications?.otherCategoryText,
    },
    academicFeatures,
    communicationFeatures,
    feeFeatures,
    preferredPaymentGateway: base.preferredPaymentGateway || 'razorpay',
    paymentGatewayOther: base.paymentGatewayOther,
    transport,
    documentFeatures,
    branding,
    distribution,
    languages,
    otherLanguageText: base.otherLanguageText,
    offline,
    additionalRequirements,
  };
}

export function validateMobileAppSection(
  raw?: Partial<MobileAppData>,
  schoolName?: string
): {
  isValid: boolean;
  score: { total: number; filled: number };
  missingFields: string[];
  fieldErrors: Record<string, string>;
} {
  const missingFields: string[] = [];
  const fieldErrors: Record<string, string> = {};
  let total = 0;
  let filled = 0;

  const data = raw;
  if (!data) {
    return {
      isValid: false,
      score: { total: 8, filled: 0 },
      missingFields: [
        'Mobile Apps: At least one application must be selected',
        'Mobile Apps: At least one platform must be selected',
        'Mobile Apps: Authentication method',
        'Mobile Apps: Push notification preference',
        'Mobile Apps: App display name',
        'Mobile Apps: Distribution preference',
      ],
      fieldErrors: {
        requiredApps: 'Please select at least one mobile application',
        supportedPlatforms: 'Please select at least one platform',
        authMethod: 'Please choose an authentication method',
        pushNotifications: 'Please specify push notification preference',
        appDisplayName: 'App display name is required',
        distribution: 'Please select at least one distribution method',
      },
    };
  }

  // 1. At least one App audience
  total++;
  const hasApp = Array.isArray(data.requiredApps)
    ? data.requiredApps.length > 0
    : Boolean(data.parentAppRequired || data.studentAppRequired || data.teacherAppRequired || data.adminAppRequired);
  if (hasApp) {
    filled++;
  } else {
    missingFields.push('Mobile Apps: At least one application must be selected');
    fieldErrors['requiredApps'] = 'Please select at least one mobile application';
  }

  // 2. At least one Platform
  total++;
  const hasPlatform = Array.isArray(data.supportedPlatforms)
    ? data.supportedPlatforms.length > 0
    : Boolean(data.platforms && (data.platforms.android || data.platforms.ios || data.platforms.pwa));
  if (hasPlatform) {
    filled++;
  } else {
    missingFields.push('Mobile Apps: At least one platform must be selected');
    fieldErrors['supportedPlatforms'] = 'Please select at least one platform (Android, iOS, or PWA)';
  }

  // 3. Authentication method
  total++;
  if (data.authentication?.authMethod) {
    filled++;
  } else {
    missingFields.push('Mobile Apps: Authentication method');
    fieldErrors['authMethod'] = 'Please choose a primary authentication method';
  }

  // 4. Push notifications decision & categories if enabled
  total++;
  const pushDecision =
    typeof data.pushNotifications?.enabled === 'boolean'
      ? data.pushNotifications.enabled
      : typeof data.pushNotificationsRequired === 'boolean'
      ? data.pushNotificationsRequired
      : undefined;

  if (pushDecision === undefined) {
    missingFields.push('Mobile Apps: Push notification preference');
    fieldErrors['pushNotifications'] = 'Please indicate whether push notifications are required';
  } else if (pushDecision === true) {
    const cats = data.pushNotifications?.categories || [];
    if (cats.length > 0) {
      filled++;
    } else {
      missingFields.push('Mobile Apps: At least one push notification category');
      fieldErrors['pushCategories'] = 'Please select at least one notification category';
    }
  } else {
    filled++;
  }

  // 5. Transport tracking validation (Conditional on bus tracking)
  const isBusTrackingSelected =
    data.transport?.features?.includes('bus_tracking') ?? false;
  if (isBusTrackingSelected) {
    total++;
    const trackingMethod = data.transport?.trackingMethod;
    if (!trackingMethod) {
      missingFields.push('Mobile Apps: Bus tracking method');
      fieldErrors['trackingMethod'] = 'Please select a bus tracking method';
    } else if (trackingMethod === 'dedicated_gps' || trackingMethod === 'hybrid') {
      const gpsId = (data.transport?.dedicatedGpsDeviceId || '').trim();
      if (gpsId) {
        filled++;
      } else {
        missingFields.push('Mobile Apps: Dedicated GPS Device ID / IMEI');
        fieldErrors['dedicatedGpsDeviceId'] = 'Please specify the dedicated GPS Device ID or IMEI';
      }
    } else {
      filled++;
    }
  }

  // 6. Fee payment gateway validation (Conditional on online fee payments)
  const isOnlinePaymentSelected =
    data.feeFeatures?.includes('online_fee_payment') ?? false;
  if (isOnlinePaymentSelected) {
    total++;
    if (data.preferredPaymentGateway) {
      if (data.preferredPaymentGateway === 'other' && !(data.paymentGatewayOther || '').trim()) {
        missingFields.push('Mobile Apps: Preferred payment gateway name');
        fieldErrors['paymentGatewayOther'] = 'Please enter your preferred payment gateway name';
      } else {
        filled++;
      }
    } else {
      missingFields.push('Mobile Apps: Preferred payment gateway');
      fieldErrors['preferredPaymentGateway'] = 'Please select a preferred payment gateway';
    }
  }

  // 7. App display name
  total++;
  const appDisplayName = (
    data.branding?.appDisplayName !== undefined
      ? data.branding.appDisplayName
      : schoolName || ''
  ).trim();
  if (appDisplayName) {
    filled++;
  } else {
    missingFields.push('Mobile Apps: App display name');
    fieldErrors['appDisplayName'] = 'App display name is required';
  }

  // 8. Distribution preference
  total++;
  if (Array.isArray(data.distribution) && data.distribution.length > 0) {
    filled++;
  } else {
    missingFields.push('Mobile Apps: Distribution preference');
    fieldErrors['distribution'] = 'Please select at least one distribution preference';
  }

  return {
    isValid: missingFields.length === 0,
    score: { total, filled },
    missingFields,
    fieldErrors,
  };
}

// ─── Step 12: Delivery Priorities Catalogs & Helpers ─────────────────────────

export interface PhasePriorityItemConfig {
  id: string;
  label: string;
  description: string;
  category: string;
  applicableProducts: ('school-website' | 'school-website-cms' | 'school-erp' | 'school-complete')[];
  requiresUpgradeText?: string;
}

export const TARGET_TIMELINE_OPTIONS: Array<{
  id: TargetLaunchTimelineOption;
  label: string;
  helper: string;
  requiresDatePicker?: boolean;
}> = [
  { id: 'asap', label: 'As soon as possible', helper: 'Priority fast-track request for immediate deployment queue' },
  { id: 'within-1-week', label: 'Within 1 week', helper: 'Expedited 7-day delivery schedule target' },
  { id: 'within-2-weeks', label: 'Within 2 weeks', helper: 'Accelerated 14-day turnaround target' },
  { id: 'within-3-4-weeks', label: 'Within 3–4 weeks', helper: 'Standard recommended delivery timeframe' },
  { id: 'within-5-6-weeks', label: 'Within 5–6 weeks', helper: 'Comprehensive multi-phase deployment window' },
  { id: 'flexible', label: 'Flexible / No fixed date', helper: 'Standard queue progression without hard milestone date' },
  { id: 'specific-date', label: 'Specific target date', helper: 'Milestone tied to a planned school launch or event date', requiresDatePicker: true },
];

export const DEADLINE_TYPE_OPTIONS = [
  'Admission Campaign Launch',
  'New Academic Session',
  'School Annual Day / Foundation Event',
  'CBSE / Board Affiliation Inspection',
  'Management Board Meeting',
  'Public Website Rebrand',
  'Government Statutory Compliance',
  'Other Event',
] as const;

export const PHASE1_PRIORITY_CATALOG: PhasePriorityItemConfig[] = [
  {
    id: 'home_page',
    label: 'Home Page & Hero Showcase',
    description: 'Header, hero banner, vision/mission, highlights & quick-action CTA bar',
    category: 'Core Website',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'about_school',
    label: 'About School & Pedagogical Story',
    description: 'Founding history, values, educational philosophy & campus highlights',
    category: 'Core Website',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'admissions_contact',
    label: 'Admissions Desk & Online Enquiry',
    description: 'Direct inquiry lead capture, criteria overview, and registration guidance',
    category: 'Admissions & Inquiries',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'contact_locations',
    label: 'Contact & Interactive Map Location',
    description: 'Postal address, interactive Google Maps pin, phone numbers & office timings',
    category: 'Institutional Info',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'leadership',
    label: 'Leadership & Messages',
    description: 'Principal and management leadership messages, portraits & credentials',
    category: 'Institutional Info',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'academics_curriculum',
    label: 'Academics & Curriculum Overview',
    description: 'Board affiliation, academic streams, subjects & pedagogy summary',
    category: 'Academics',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'campus_facilities',
    label: 'Campus Infrastructure & Facilities',
    description: 'Laboratories, classrooms, library, playground & security amenities',
    category: 'Campus',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'photo_gallery',
    label: 'Campus Photo Gallery (Curated)',
    description: 'Curated 10–20 high-res photos showcasing real campus life & events',
    category: 'Media',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'mandatory_disclosures',
    label: 'Mandatory Disclosures & Statutory Policies',
    description: 'CBSE Appendix IX disclosures, safety certificates & fee transparency',
    category: 'Compliance',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'domain_setup',
    label: 'Official Domain & SSL Setup',
    description: 'Institutional .edu.in / .ac.in / .com domain, DNS wiring & TLS certificate',
    category: 'Technical',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'notices_announcements',
    label: 'Digital Notices & Circulars Board',
    description: 'Live announcement ticker and public school circulars for parents & students',
    category: 'Communication',
    applicableProducts: ['school-website-cms', 'school-erp', 'school-complete'],
    requiresUpgradeText: 'Requires Website + CMS or Complete Platform',
  },
  {
    id: 'student_roster',
    label: 'Student Database & Enrollment Setup',
    description: 'Initial student directory import, classes, sections & roll numbers setup',
    category: 'Operations',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Requires School ERP or Complete Platform',
  },
];

export const PHASE2_PRIORITY_CATALOG: PhasePriorityItemConfig[] = [
  {
    id: 'events_calendar',
    label: 'Interactive School Events & Holiday Calendar',
    description: 'Upcoming academic events, sports meets, parent-teacher meetings & holiday schedule',
    category: 'Enhancements',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'extended_gallery',
    label: 'Extended Photo Albums & Video Showcase',
    description: 'Categorized event albums, sports day galleries, and YouTube video tour integration',
    category: 'Media',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'alumni_network',
    label: 'Alumni Network & Student Achievements',
    description: 'Hall of fame, board toppers showcase, and alumni contact directory',
    category: 'Community',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'additional_pages',
    label: 'Additional Custom Institutional Pages',
    description: 'Houses, student council, clubs, MUN, community outreach & specialized labs',
    category: 'Content',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
  },
  {
    id: 'advanced_cms',
    label: 'Staff CMS Multi-Editor Roles & Permissions',
    description: 'Departmental staff logins to independently manage notices, gallery & forms',
    category: 'Administration',
    applicableProducts: ['school-website-cms', 'school-complete'],
    requiresUpgradeText: 'Available in Website + CMS & Complete Platform',
  },
  {
    id: 'online_fee_gateway',
    label: 'Online Fee Payment Gateway (UPI / NetBanking)',
    description: 'Integrated parent fee payments, automatic digital receipts & fine ledger',
    category: 'Finance',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available in School ERP & Complete Platform',
  },
  {
    id: 'exam_report_cards',
    label: 'Automated Examination & Bilingual Report Cards',
    description: 'Scholastic marks entry, CBSE compliant report card generation & publishing',
    category: 'Academics',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available in School ERP & Complete Platform',
  },
  {
    id: 'transport_routes',
    label: 'Transport & Bus Route Live Management',
    description: 'Bus fleet tracking, route stops, pickup timings & driver contact allocation',
    category: 'Operations',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available in School ERP & Complete Platform',
  },
  {
    id: 'biometric_sync',
    label: 'Biometric Attendance Device Integration',
    description: 'Direct synchronization between physical fingerprint/facial machine and staff ledger',
    category: 'Operations',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available in School ERP & Complete Platform',
  },
  {
    id: 'mobile_apps',
    label: 'Parent & Teacher Mobile Applications (Android)',
    description: 'Dedicated branded Android mobile application on Google Play Store',
    category: 'Mobile',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available as Companion Add-on / ERP Complete',
  },
  {
    id: 'data_migration',
    label: 'Comprehensive Legacy Data Migration',
    description: 'Detailed cleanup and migration of multi-year student and financial records',
    category: 'Services',
    applicableProducts: ['school-erp', 'school-complete'],
    requiresUpgradeText: 'Available as Specialized Consultation Service',
  },
];

export function getApplicableSections(
  productId: string,
  data?: Partial<UniversalIntakeData>
): SectionMetadata[] {
  return INTAKE_SECTIONS.filter((section) => {
    if (!(section.applicableProducts as string[]).includes(productId)) {
      return false;
    }
    const isWebsiteMode = productId === 'school-website' || productId === 'school-website-cms';
    if (isWebsiteMode) {
      // In website onboarding, Library and Hostel are consolidated inside Campus Facilities
      if (section.key === 'libraryConfig' || section.key === 'hostelConfig') {
        return false;
      }
      // If transport is explicitly marked as not operated, omit from active website navigation
      if (section.key === 'transportConfig' && data?.transportConfig?.status === 'no') {
        return false;
      }
    } else {
      // For ERP / Complete products
      if (section.key === 'hostelConfig' && data && !isHostelApplicable(data.schoolProfile)) {
        return false;
      }
      if (section.key === 'transportConfig' && data?.transportConfig?.status === 'no') {
        return false;
      }
    }
    return true;
  });
}

export function isSectionApplicable(
  sectionKey: IntakeSectionKey,
  productId: string,
  data?: Partial<UniversalIntakeData>
): boolean {
  if (data !== undefined) {
    const applicable = getApplicableSections(productId, data);
    return applicable.some((s) => s.key === sectionKey);
  }
  const section = INTAKE_SECTIONS.find((s) => s.key === sectionKey);
  if (!section) return false;
  return (section.applicableProducts as string[]).includes(productId);
}

export function deriveSlugFromSchoolName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}

export interface BoardIdentityConfig {
  boardKey: string;
  boardDisplayName: string;
  codeLabel: string;
  codePlaceholder: string;
  codeHelper: string;
  affiliationLabel: string;
  affiliationPlaceholder: string;
  affiliationHelper: string;
}

export function getBoardIdentityConfig(board?: string | null): BoardIdentityConfig {
  const normalized = (board || 'CBSE').trim();

  if (
    normalized === 'CISCE / ICSE' ||
    normalized === 'ICSE' ||
    normalized.includes('ICSE') ||
    normalized.includes('CISCE')
  ) {
    return {
      boardKey: 'CISCE / ICSE',
      boardDisplayName: 'CISCE / ICSE (Council for the Indian School Certificate Examinations)',
      codeLabel: 'CISCE / ICSE School Code',
      codePlaceholder: 'e.g. BR042 or 4-digit code',
      codeHelper: 'Official School / Centre Code assigned by CISCE.',
      affiliationLabel: 'CISCE Affiliation / Registration Number',
      affiliationPlaceholder: 'e.g. ICSE/2019/042',
      affiliationHelper: 'Official permanent or provisional affiliation number assigned by CISCE.',
    };
  }

  if (
    normalized === 'State Board' ||
    normalized === 'BSEB' ||
    normalized.includes('State Board') ||
    normalized.includes('BSEB')
  ) {
    return {
      boardKey: 'State Board',
      boardDisplayName: 'State Board (BSEB / Other State Education Department)',
      codeLabel: 'State Board School / College Code',
      codePlaceholder: 'e.g. 52001 or District College Code',
      codeHelper: 'Official School / College Code assigned by State Board (BSEB / State Education Dept).',
      affiliationLabel: 'State Board Recognition / Affiliation Number',
      affiliationPlaceholder: 'e.g. BSEB-REC-2016-104',
      affiliationHelper: 'Government recognition order number or state board affiliation number.',
    };
  }

  if (normalized === 'IB' || normalized.includes('International Baccalaureate')) {
    return {
      boardKey: 'IB',
      boardDisplayName: 'IB (International Baccalaureate)',
      codeLabel: 'IB World School Code',
      codePlaceholder: 'e.g. 004321',
      codeHelper: 'Official School Code assigned by the International Baccalaureate Organization.',
      affiliationLabel: 'IB Authorization / Programme Code',
      affiliationPlaceholder: 'e.g. IB-PYP-MYP-04321',
      affiliationHelper: 'IB authorization reference number for authorized programmes (PYP, MYP, DP).',
    };
  }

  if (
    normalized === 'Cambridge' ||
    normalized.includes('Cambridge') ||
    normalized.includes('IGCSE')
  ) {
    return {
      boardKey: 'Cambridge',
      boardDisplayName: 'Cambridge Assessment International Education (IGCSE / A-Levels)',
      codeLabel: 'Cambridge Centre Number',
      codePlaceholder: 'e.g. IN789',
      codeHelper: 'Official 5-character Centre Number assigned by Cambridge International.',
      affiliationLabel: 'Cambridge Registration Number',
      affiliationPlaceholder: 'e.g. CAIE-IN789',
      affiliationHelper: 'Official Cambridge Assessment International Education registration reference.',
    };
  }

  if (normalized === 'NIOS' || normalized.includes('Open Schooling')) {
    return {
      boardKey: 'NIOS',
      boardDisplayName: 'NIOS (National Institute of Open Schooling)',
      codeLabel: 'NIOS Accredited Institution (AI) Code',
      codePlaceholder: 'e.g. 030045',
      codeHelper: 'Accredited Institution (AI) / Study Centre Code assigned by NIOS.',
      affiliationLabel: 'NIOS Accreditation Number',
      affiliationPlaceholder: 'e.g. NIOS-AI-030045',
      affiliationHelper: 'Official NIOS accreditation reference number.',
    };
  }

  if (
    normalized === 'Other' ||
    normalized.includes('Autonomous') ||
    normalized.includes('Non-Affiliated')
  ) {
    return {
      boardKey: 'Other',
      boardDisplayName: 'Other / Autonomous / Non-Affiliated Board',
      codeLabel: 'Board / Institutional School Code',
      codePlaceholder: 'e.g. Assigned School Code or N/A',
      codeHelper: 'Official school identification code assigned by your governing board, trust, or education department (enter N/A if autonomous).',
      affiliationLabel: 'Board Recognition / Affiliation Number',
      affiliationPlaceholder: 'e.g. Recognition / Reg No. or N/A',
      affiliationHelper: 'Official affiliation, trust registration, or state recognition number.',
    };
  }

  // Default: CBSE
  return {
    boardKey: 'CBSE',
    boardDisplayName: 'CBSE (Central Board of Secondary Education)',
    codeLabel: 'CBSE School Code (School No.)',
    codePlaceholder: 'e.g. 66664',
    codeHelper: 'Official 5-digit CBSE School Number assigned by CBSE (distinct from Affiliation No.).',
    affiliationLabel: 'CBSE Affiliation Number',
    affiliationPlaceholder: 'e.g. 330943',
    affiliationHelper: 'Official CBSE Affiliation Number (e.g. 330XXXX or provisional affiliation ID).',
  };
}

export function createInitialIntakeData(params: {
  schoolName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  city?: string | null;
  state?: string | null;
  domainRequirement?: string | null;
  board?: string | null;
}): UniversalIntakeData {
  const slug = deriveSlugFromSchoolName(params.schoolName || 'School');

  const effectiveState = params.state || 'Bihar';
  const resolvedDistrict =
    params.city && isKnownDistrict('India', effectiveState, params.city)
      ? params.city
      : 'East Champaran';

  const effectiveBoard = params.board || 'CBSE';

  const initialClasses: AcademicClassConfig[] = [
    { id: 'cls_sugg_nur', name: 'Nursery', code: 'NUR', level: 'Pre-Primary', sortOrder: 1, displayOrder: 1, isActive: true, sections: ['A'] },
    { id: 'cls_sugg_lkg', name: 'LKG', code: 'LKG', level: 'Pre-Primary', sortOrder: 2, displayOrder: 2, isActive: true, sections: ['A'] },
    { id: 'cls_sugg_ukg', name: 'UKG', code: 'UKG', level: 'Pre-Primary', sortOrder: 3, displayOrder: 3, isActive: true, sections: ['A'] },
    { id: 'cls_sugg_c1', name: 'Class 1', code: 'STD-1', level: 'Primary', sortOrder: 4, displayOrder: 4, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c2', name: 'Class 2', code: 'STD-2', level: 'Primary', sortOrder: 5, displayOrder: 5, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c3', name: 'Class 3', code: 'STD-3', level: 'Primary', sortOrder: 6, displayOrder: 6, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c4', name: 'Class 4', code: 'STD-4', level: 'Primary', sortOrder: 7, displayOrder: 7, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c5', name: 'Class 5', code: 'STD-5', level: 'Primary', sortOrder: 8, displayOrder: 8, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c6', name: 'Class 6', code: 'STD-6', level: 'Middle', sortOrder: 9, displayOrder: 9, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c7', name: 'Class 7', code: 'STD-7', level: 'Middle', sortOrder: 10, displayOrder: 10, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c8', name: 'Class 8', code: 'STD-8', level: 'Middle', sortOrder: 11, displayOrder: 11, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c9', name: 'Class 9', code: 'STD-9', level: 'Secondary', sortOrder: 12, displayOrder: 12, isActive: true, sections: ['A', 'B'] },
    { id: 'cls_sugg_c10', name: 'Class 10', code: 'STD-10', level: 'Secondary', sortOrder: 13, displayOrder: 13, isActive: true, sections: ['A', 'B'] },
    {
      id: 'cls_sugg_c11',
      name: 'Class 11',
      code: 'STD-11',
      level: 'Senior Secondary',
      sortOrder: 14,
      displayOrder: 14,
      isActive: true,
      sections: ['A'],
      streams: [
        { id: 'strm_c11_sci', name: 'Science', sections: ['A', 'B'] },
        { id: 'strm_c11_com', name: 'Commerce', sections: ['A'] },
        { id: 'strm_c11_hum', name: 'Humanities', sections: ['A'] },
      ],
    },
    {
      id: 'cls_sugg_c12',
      name: 'Class 12',
      code: 'STD-12',
      level: 'Senior Secondary',
      sortOrder: 15,
      displayOrder: 15,
      isActive: true,
      sections: ['A'],
      streams: [
        { id: 'strm_c12_sci', name: 'Science', sections: ['A', 'B'] },
        { id: 'strm_c12_com', name: 'Commerce', sections: ['A'] },
        { id: 'strm_c12_hum', name: 'Humanities', sections: ['A'] },
      ],
    },
  ];

  const initialIntake: UniversalIntakeData = {
    schoolProfile: {
      schoolName: params.schoolName || '',
      legalInstitutionName: params.schoolName || '',
      displayName: params.schoolName || '',
      udiseCode: '',
      schoolCode: '',
      shortName: (params.schoolName || '').split(' ').map((w) => w[0]).join('').slice(0, 6).toUpperCase(),
      schoolType: 'K-12 School',
      managementType: 'Private Unaided',
      yearOfEstablishment: '2010',
      establishmentYear: '2010',
      schoolStatus: 'active',
      board: effectiveBoard,
      affiliationNumber: '',
      registrationNumber: '',
      accreditationBody: 'Central Board of Secondary Education',
      recognitionDetails: 'Recognized by Department of School Education',
      recognitionValidity: 'Permanent / Renewable',
      mediumOfInstruction: ['English', 'Hindi'],
      genderCategory: 'co_ed',
      coEdStatus: 'co_ed',
      schoolCategory: 'Day School',
      schoolLevel: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'],
      residentialStatus: 'day_school',
      officialEmail: params.contactEmail || '',
      secondaryEmail: '',
      officialPhone: params.contactPhone || '',
      secondaryPhone: '',
      whatsappNumber: params.contactPhone || '',
      emergencyContact: params.contactPhone || '',
      faxNumber: '',
      country: 'India',
      state: effectiveState,
      district: resolvedDistrict,
      city: params.city || 'Motihari',
      address: '',
      addressLine2: '',
      landmark: '',
      pin: '845401',
      latitude: null,
      longitude: null,
      googleMapsUrl: '',
      googleMapsLink: '',
      existingWebsiteUrl: '',
      websiteStatus: 'no_website',
      existingDomain: '',
      currentHostingProvider: '',
      currentCms: '',
      hasCurrentWebsiteAdminAccess: false,
      existingSocialMediaAccounts: { facebook: '', instagram: '', youtube: '', twitter: '' },
      slug: slug,
      platformSubdomain: `${slug}.ekaagraschools.in`,
      preferredPublicUrl: `https://${slug}.edu.in`,
      principalName: '',
      managementContactName: params.contactName || '',
      managementContactPhone: params.contactPhone || '',
    },
    campuses: [
      {
        id: 'campus-main',
        name: 'Main Campus',
        code: 'CAMPUS-1',
        address: '',
        addressLine2: '',
        city: params.city || 'Motihari',
        district: resolvedDistrict,
        state: effectiveState,
        country: 'India',
        pin: '845401',
        contactPhone: params.contactPhone || '',
        contactEmail: params.contactEmail || '',
        coordinatorName: params.contactName || 'Campus Administrator',
        operatingHours: '08:00 AM - 03:00 PM (Mon - Sat)',
        facilities: ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Playground'],
        isMainCampus: true,
        isActive: true,
      },
    ],
    leadership: {
      principalId: 'principal-main',
      principalName: '',
      principalDesignation: 'Principal',
      principalPhotoUrl: '',
      principalPhoto: null,
      principalEmail: '',
      principalPhone: '',
      principalWhatsapp: '',
      principalQualification: 'M.Sc., B.Ed., M.Ed.',
      principalExperienceYears: 15,
      principalBiography: 'An experienced educational leader dedicated to student-centered experiential learning and character formation.',
      principalMessage: 'Welcome to our institution. Our pursuit is to develop knowledgeable, confident, and compassionate global citizens.',
      managementMembers: [
        {
          id: 'mgmt-1',
          name: params.contactName || 'Managing Director',
          designation: 'Director / Management Committee Head',
          role: 'Director',
          email: params.contactEmail || '',
          phone: params.contactPhone || '',
          photoUrl: '',
          photo: null,
          displayOnWebsite: true,
          biography: 'Committed to delivering world-class educational infrastructure and opportunities to our regional youth.',
        },
      ],
      managementContactName: params.contactName || '',
      chairmanMessage: 'Education is the foundation of individual growth and societal prosperity. We are committed to excellence in every sphere.',
      visionStatement: 'To foster intellectual curiosity, moral integrity, innovation, and lifelong learning.',
      missionStatement: 'To provide high-quality holistic education that empowers every student to excel academically and ethically.',
    },
    brandingDesign: {
      hasHighResLogo: false,
      primaryColor: '#1E40AF',
      secondaryColor: '#3B82F6',
      accentColor: '#F59E0B',
      fontFamilyPreference: 'Inter',
      taglineOrMotto: 'Excellence in Education',
      motto: 'Knowledge is Power',
      visionStatement: 'To foster intellectual curiosity, moral integrity, and lifelong learning.',
      missionStatement: 'To provide high-quality holistic education that empowers students to excel.',
      coreValues: ['Integrity', 'Excellence', 'Respect', 'Innovation', 'Discipline'],
      brandTone: 'Modern',
      preferredWebsiteStyle: 'Modern',
      preferredVisualTone: 'modern_vibrant',
      designReferenceWebsites: '',
    },
    websiteRequirements: {
      websiteGoal: 'complete_platform',
      primaryPurpose: 'Enhance school credibility, attract new admissions, and publish circulars & exam results seamlessly.',
      requiredPages: [
        'Home',
        'About School',
        'Leadership & Desk',
        'Academics',
        'Admissions',
        'Fee Structure',
        'Campus Facilities',
        'Photo & Video Gallery',
        'Events & News',
        'Notices & Circulars',
        'Mandatory Disclosures',
        'Contact Us',
      ],
      customPages: [
        {
          id: 'cp-1',
          title: 'CBSE Mandatory Disclosures',
          slug: 'mandatory-disclosures',
          purpose: 'Statutory SARAS / OASIS compliance disclosure documents',
          language: 'English',
          isPublic: true,
          isCmsEditable: true,
        },
      ],
      migrationNeededFromExisting: false,
      languagesRequired: ['English', 'Hindi'],
    },
    schoolContent: {
      aboutSchool: `${params.schoolName || 'Our school'} is dedicated to nurturing young minds with a blend of academic rigor, character building, and modern educational values.`,
      history: 'Established with the noble mission to make high-standard education accessible, inspiring, and globally competitive.',
      foundingStory: 'Founded by visionary educators driven by the urge to establish an institution that balances traditional values with modern STEM learning.',
      philosophy: 'Holistic child development focusing on academic excellence, co-curricular skills, and ethical values.',
      teachingMethodology: 'Activity-based experiential learning integrated with audio-visual technology and personalized mentorship.',
      uniqueSellingPoints: ['Experienced faculty', 'Safe campus with 24x7 CCTV', 'Smart classrooms', 'Individual attention'],
      specialProgramsConfig: {
        stem: true,
        robotics: true,
        spokenEnglish: true,
        coding: true,
        sports: true,
        arts: true,
        music: true,
        clubs: ['Science Club', 'Eco Club', 'Literary Society', 'Robotics Club'],
        competitions: ['Inter-School Olympiad', 'Annual Sports Championship', 'Science Exhibition'],
      },
      awardsAndAchievements: [
        { id: 'award-1', title: 'Best Academic Excellence in Region', year: '2025', recipient: 'School', category: 'school' },
      ],
      infrastructureHighlights: ['Interactive Digital Panels', 'Spacious Library with 3000+ Books', 'Composite Science Lab', 'Multi-Sport Playground'],
      parentTestimonials: [
        { id: 'test-1', parentName: 'Amit Sharma', studentName: 'Rohan Sharma', gradeOrClass: 'Class 8', quote: 'The teachers are exceptionally dedicated and the campus environment has brought out the best in my son.', rating: 5 },
      ],
      alumniInformation: 'Our alumni have gone on to prestigious medical, engineering, and administrative academies nationwide.',
    },
    institutionStructure: {
      isMultiCampus: false,
      currentAcademicSession: '2026-2027',
      sessionStartDate: '2026-04-01',
      sessionEndDate: '2027-03-31',
      classesOfferedFrom: 'Nursery',
      classesOfferedTo: 'Class 12',
      totalSectionsEstimated: 15,
      studentCapacityTotal: 650,
      teachingStaffCount: 32,
      nonTeachingStaffCount: 12,
      board: effectiveBoard,
      effectiveCurriculum: effectiveBoard,
      namingConvention: 'Class',
      confirmed: false,
      academicStructureConfirmed: false,
      structureStatus: 'suggested',
      academicStreams: ['Science', 'Commerce', 'Humanities'],
      classes: initialClasses,
      subjects: [
        { name: 'English Core', code: 'ENG', subjectType: 'theory', isElective: false },
        { name: 'Hindi Course A', code: 'HIN', subjectType: 'theory', isElective: false },
        { name: 'Mathematics', code: 'MATH', subjectType: 'theory', isElective: false },
        { name: 'Science', code: 'SCI', subjectType: 'combined', isElective: false },
        { name: 'Social Science', code: 'SST', subjectType: 'theory', isElective: false },
        { name: 'Information Technology / CS', code: 'IT', subjectType: 'combined', isElective: false },
        { name: 'Physics', code: 'PHY', subjectType: 'combined', isElective: false, stream: 'Science' },
        { name: 'Chemistry', code: 'CHEM', subjectType: 'combined', isElective: false, stream: 'Science' },
        { name: 'Biology', code: 'BIO', subjectType: 'combined', isElective: true, stream: 'Science' },
        { name: 'Accountancy', code: 'ACC', subjectType: 'theory', isElective: false, stream: 'Commerce' },
        { name: 'Business Studies', code: 'BST', subjectType: 'theory', isElective: false, stream: 'Commerce' },
        { name: 'Economics', code: 'ECO', subjectType: 'theory', isElective: false },
      ],
      departments: [
        { name: 'Science & Technology', headStaffName: 'Head of Science', description: 'Physics, Chemistry, Biology, IT' },
        { name: 'Mathematics', headStaffName: 'Head of Mathematics', description: 'Primary and Secondary Mathematics' },
        { name: 'Languages & Humanities', headStaffName: 'Head of Languages', description: 'English, Hindi, Sanskrit, Social Science' },
        { name: 'Sports & Physical Education', headStaffName: 'Sports Director', description: 'Athletics, Yoga, Team Sports' },
      ],
    },
    staffFaculty: {
      bulkImportMode: true,
      estimatedTotalStaff: 44,
      teachingStaffCount: 32,
      nonTeachingStaffCount: 12,
      departments: ['Science', 'Mathematics', 'Languages', 'Social Studies', 'Commerce', 'Computer & IT', 'Sports & Arts', 'Administration'],
      staffCategories: ['PGT Teacher', 'TGT Teacher', 'PRT Teacher', 'NTT Teacher', 'Lab Assistant', 'Librarian', 'Administrative Staff', 'Support Staff'],
      institutionalIdNumbering: {
        mode: 'PRESET',
        presetId: 'YY_NUMBER_5',
      },
      staffIdFormat: '{{PREFIX}}{{YY}}{{NUMBER}}',
      employeeIdFormat: 'STF-{{NUM}}',
      staffAttendanceRequirement: 'Biometric fingerprint or facial recognition punch in/out with daily shift logging.',
      isStaffDirectoryRequired: true,
      isStaffProfilesPublic: true,
      staffMembers: [],
    },
    studentConfig: {
      estimatedStudentCount: 550,
      studentIdFormat: '{{PREFIX}}{{YY}}{{NUMBER}}',
      admissionNumberFormat: 'ADM-{{YEAR}}-{{NUM}}',
      rollNumberSystem: 'section_wise',
      houseSystemEnabled: true,
      houseNames: ['Tagore House (Red)', 'Ashoka House (Blue)', 'Raman House (Green)', 'Kalam House (Yellow)'],
      reservationCategories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      studentCategories: ['Regular Student', 'RTE Beneficiary', 'Sibling Discount', 'Staff Ward'],
      requiredStudentFields: ['Full Name', 'DOB', 'Gender', 'Blood Group', 'Father Name', 'Mother Name', 'Address', 'Phone', 'Aadhaar Number'],
      requiredDocumentTypes: ['Birth Certificate', 'Transfer Certificate (TC)', 'Previous Marksheet', 'Aadhaar Card Copy', 'Passport Photos (4)'],
      studentPhotoRequired: true,
      parentGuardianRequirements: ['Father Details', 'Mother Details', 'Local Guardian Details (for boarders)', 'Emergency Contact'],
      siblingTrackingEnabled: true,
      alumniTrackingEnabled: true,
      migrationRequired: true,
    },
    admissions: normalizeAdmissionsData(
      {
        session: '2026-2027',
        status: 'upcoming',
        contact: {
          name: params.contactName || '',
          phone: params.contactPhone || '',
          email: params.contactEmail || '',
          preferredMethod: 'phone',
        },
        applicationOptions: {
          admissionsOpen: false,
          onlineApplication: false,
          documentUpload: false,
          walkInApplication: true,
          enquiryEnabled: true,
          callbackEnabled: false,
          applicationFeeRequired: false,
        },
        callToAction: 'Apply Now',
      },
      {
        session: '2026-2027',
        officialEmail: params.contactEmail,
        officialPhone: params.contactPhone,
      }
    ),
    feesConfiguration: normalizeFeesData({
      feeCategories: ['Tuition Fee', 'Admission Fee', 'Annual Development Fee', 'Examination Fee', 'Computer / Smart Class Fee', 'Transport Fee'],
      classFeeStructures: [
        { className: 'Pre-Primary (Nursery - UKG)', feeType: 'Tuition Fee', amount: 1200, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Primary (Class 1-5)', feeType: 'Tuition Fee', amount: 1500, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Middle (Class 6-8)', feeType: 'Tuition Fee', amount: 1800, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Secondary (Class 9-10)', feeType: 'Tuition Fee', amount: 2200, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Senior Secondary (Class 11-12)', feeType: 'Tuition Fee', amount: 2800, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
      ],
      billingFrequencies: ['monthly', 'quarterly'],
      dueDateDay: 10,
      gracePeriodDays: 5,
      lateFeeType: 'fixed',
      lateFeeAmount: 10,
      concessionsAndScholarships: 'Merit scholarship for 90%+ in board exams; 25% RTE concession scheme.',
      siblingDiscounts: '20% tuition concession on the younger sibling.',
      categoryDiscounts: 'Staff ward concession as per management policy.',
      preferredPaymentGateway: 'razorpay',
      onlineFeePaymentRequired: true,
      feeReceiptsAutomated: true,
      parentLedgerHistoryEnabled: true,
      dueRemindersEnabled: true,
    }),
    curriculum: getInitialCurriculumData(effectiveBoard, initialClasses),
    attendanceConfig: {
      studentAttendanceMode: 'daily',
      staffAttendanceMode: 'biometric',
      workingDays: [1, 2, 3, 4, 5, 6],
      saturdaySchedule: 'full_day',
      schoolStartTime: '08:00 AM',
      schoolEndTime: '02:30 PM',
      assemblyStartTime: '08:00 AM',
      assemblyDurationMinutes: 15,
      reportingTime: '07:45 AM',
      dispersalTime: '02:30 PM',
      periodCount: 8,
      periodDurationMinutes: 40,
      breaks: [
        { id: 'break-1', name: 'Short Break', startTime: '10:00 AM', endTime: '10:15 AM', type: 'short_break' },
        { id: 'break-2', name: 'Lunch Break', startTime: '12:15 PM', endTime: '12:45 PM', type: 'lunch' },
      ],
      scheduleStructure: 'same_for_all',
      lateArrivalThresholdMinutes: 10,
      lateMarkingRule: 'automatic',
      halfDayRuleEnabled: false,
      halfDayThresholdPercent: 50,
      absentMarkingRule: 'teacher_submits',
      parentAbsenceChannels: ['whatsapp'],
      parentAbsenceNotification: 'whatsapp',
      alertTiming: 'immediate',
      notifyLateArrival: true,
      lateAlertThresholdMinutes: 10,
      canCorrectAttendance: ['class_teacher', 'attendance_coordinator', 'administrator'],
      correctionRequiresApproval: true,
      correctionApprovalBy: 'principal',
      leaveAffectsAttendance: true,
      leaveApprovalRequired: true,
      isAttendanceConfirmed: false,
      // Legacy compatibility
      lateArrivalTracking: true,
      leaveManagementEnabled: true,
      assemblyTime: '08:00 AM',
      lunchTime: '12:15 PM',
      breakDurationMinutes: 15,
    },
    examinationConfig: {
      examTermsList: [
        { name: 'Periodic Assessment 1 (PA1)', term: 'Term 1', order: 1 },
        { name: 'Half Yearly Examination', term: 'Term 1', order: 2 },
        { name: 'Periodic Assessment 2 (PA2)', term: 'Term 2', order: 3 },
        { name: 'Annual Final Examination', term: 'Term 2', order: 4 },
      ],
      gradingSystem: 'cbse_9point',
      assessmentComponents: {
        theoryMarks: true,
        practicalMarks: true,
        internalAssessment: true,
        attendanceMarks: true,
        projectMarks: true,
        coCurricular: true,
      },
      hasInternalAssessment: true,
      hasPracticalMarks: true,
      reportCardLayout: 'cbse_standard',
      reportCardOptions: {
        showLogo: true,
        showSignatures: true,
        showRemarks: true,
        showGrading: true,
        showRank: true,
        showPercentage: true,
        publishOnParentPortal: true,
        pdfDownloadEnabled: true,
      },
      resultPublishVisibility: 'parent_portal',
    },
    transportConfig: {
      status: 'not_decided',
      enabled: false,
      serviceModel: 'school_owned',
      fleet: {
        totalVehicles: undefined,
        vehicleTypeCounts: [],
      },
      tracking: {
        gpsOption: 'not_decided',
        providerIntegration: 'not_known',
        parentLiveTracking: 'not_decided',
      },
      routesPlanning: {
        managementMethod: 'to_be_configured',
        approximateRoutesCount: undefined,
        usesDesignatedStops: 'to_be_configured',
        stopManagement: 'admin_defined',
      },
      staff: {
        driverManagement: 'to_be_configured',
        attendantRequired: true,
        attendantAssignment: 'one_per_vehicle',
      },
      parentCommunication: {
        notificationChannels: ['whatsapp', 'sms', 'parent_app'],
        alertTypes: [
          'vehicle_started',
          'approaching_stop',
          'student_picked_up',
          'student_dropped_off',
          'route_delay',
          'vehicle_breakdown',
          'route_cancelled',
        ],
        delayThreshold: '10_min',
      },
      safetyCompliance: {
        vehicleSafetyTracking: 'recommended',
        emergencyContactRole: 'transport_coordinator',
        emergencyChannels: ['phone_call', 'whatsapp'],
      },
      outsourced: {
        providerModel: 'single_provider',
        schoolVisibility: 'full_route',
        notificationChannels: ['whatsapp', 'sms'],
      },
      planned: {
        expectedLaunch: 'this_academic_session',
        plannedServiceType: 'school_owned',
      },
      busesCount: 0,
      routesCount: 0,
      gpsTrackingRequired: false,
      parentTrackingEnabled: false,
      parentGpsVisibility: false,
      routeManagementRequired: false,
      pickupPointsRequired: false,
      transportFeeModel: 'distance_slab',
      driverManagement: false,
      conductorManagement: true,
      emergencyAlertsEnabled: true,
      routes: [],
    },
    facilitiesConfig: {
      classroomsCount: 24,
      computerLab: true,
      scienceLab: true,
      library: true,
      auditorium: true,
      playground: true,
      sportsFacilities: ['Cricket Net', 'Football Field', 'Basketball Court', 'Badminton Court', 'Table Tennis'],
      medicalRoom: true,
      cafeteria: false,
      smartClassrooms: true,
      cctvInstalled: true,
      securityStaff: true,
      visitorManagement: true,
      biometricAttendanceHardware: true,
      availableFacilities: [
        { name: 'Smart Classrooms', description: 'Multimedia interactive digital boards in all classrooms.', isWebsiteVisible: true },
        { name: 'Computer Lab', description: 'Networked modern computer laboratory with high-speed internet.', isWebsiteVisible: true },
        { name: 'Composite Science Lab', description: 'Fully equipped Physics, Chemistry, and Biology work stations.', isWebsiteVisible: true },
        { name: 'School Library', description: 'Comprehensive library with thousands of fiction, science & reference books.', isWebsiteVisible: true },
        { name: 'Sports Grounds', description: 'Athletic track, cricket practice pitch, and basketball court.', isWebsiteVisible: true },
      ],
    },
    libraryConfig: normalizeLibraryData({
      enabled: false,
      bookCountEstimate: 2500,
      librariesCount: 1,
      barcodeScannerRequired: true,
      rfidRequired: false,
      digitalLibraryEnabled: true,
      issueReturnTrackingNeeded: true,
      fineSystemEnabled: true,
      studentBorrowLimit: 2,
      staffBorrowLimit: 5,
      categories: ['Textbooks', 'Reference Books', 'General Knowledge', 'Fiction', 'Periodicals & Magazines'],
    }),
    hostelConfig: {
      enabled: false,
      boysHostel: false,
      girlsHostel: false,
      hostelsCount: 0,
      roomTypes: ['Dormitory (4 Bed)', 'Double Sharing'],
      totalCapacity: 0,
      wardensAssigned: false,
      hostelFeeMonthly: 0,
      messIncluded: true,
      attendanceTracking: true,
      visitorManagement: true,
    },
    communicationConfig: normalizeCommunicationData(
      {
        enabledChannels: [
          'whatsapp',
          'sms',
          'email',
          'push',
          'parent_portal',
          'student_portal',
          'website_notices',
          'in_app_notifications',
          'emergency_broadcast',
        ],
      },
      {
        schoolName: params.schoolName,
        officialEmail: params.contactEmail,
        phone: params.contactPhone,
      } as any
    ),
    cmsRequirements: {
      managingRoles: ['Principal', 'Content Manager', 'Office Admin', 'Computer Teacher'],
      whoCanPublish: ['Principal', 'Content Manager'],
      whoCanDraft: ['Teacher', 'Office Admin', 'Admission Officer'],
      approvalWorkflow: 'two_step_approval',
      revisionHistoryRequired: true,
      scheduledPublishing: true,
      estimatedCmsUsers: 4,
      requiresApprovalBeforePublish: true,
      contentCategories: ['Notices & Circulars', 'Photo Gallery', 'Events Calendar', 'School News', 'Academic Achievements'],
    },
    websiteScope: {
      websiteType: 'public_school',
      coreModules: ['home', 'about', 'academics', 'admissions', 'contact', 'gallery'],
      optionalModules: [],
      customPages: [],
      specialInstructions: '',
      notes: '',
    },
    domainPresence: {
      alreadyOwnsDomain: false,
      needsNewDomain: true,
      preferredNewDomainName: params.domainRequirement || '',
      preferredDomain: params.domainRequirement || '',
      domainChoice: params.domainRequirement ? 'NEW_DOMAIN' : undefined,
      dnsManagementAccessAvailable: false,
      officialEmailDomainNeeded: true,
      emailSuite: 'google_workspace',
      schoolEmailProvider: 'google_workspace',
    },
    additionalRequirements: {
      notes: '',
      customRequests: [],
      specialCustomWorkflows: '',
      customReportsRequired: '',
      thirdPartyIntegrations: '',
      generalCommentsOrQuestions: '',
    },
    existingSystemsMigration: normalizeDataMigrationData({
      sources: ['excel'],
      dataCategories: ['student_records'],
      recordVolumes: {
        students: 450,
        staff: 30,
      },
      readiness: 'minor_cleanup_required',
      migrationPreference: 'selective_migration',
      historicalYears: 'current_year_only',
      fileFormats: ['xls_xlsx'],
      dataStructureCondition: 'mostly_structured',
      dataAccess: 'yes_immediately',
    }),
    integrationsConfig: createDefaultIntegrationsConfig(),
    mobileAppConfig: normalizeMobileAppData({
      parentAppRequired: true,
      studentAppRequired: true,
      teacherAppRequired: true,
      adminAppRequired: true,
      platforms: { android: true, ios: false, pwa: true },
      pushNotificationsRequired: true,
      requiredFeatures: ['Daily Attendance', 'Fee Receipts & Online Pay', 'Exam Results', 'Circulars', 'Homework'],
    }),
    securityPrivacy: createDefaultSecurityPrivacyData(),
    assetChecklist: {
      items: syncAssetChecklistWithIntake({
        schoolProfile: {
          schoolName: params.schoolName || '',
          phone: params.contactPhone || '',
          email: params.contactEmail || '',
        } as any,
        brandingDesign: {
          primaryColor: '#1E3A8A',
          secondaryColor: '#D97706',
          accentColor: '#10B981',
          motto: '',
          hasHighResLogo: false,
        } as any,
      } as any),
      checklist: [
        { id: 'ast-1', section: 'branding', title: 'High-Resolution Crest / Logo (PNG / Vector SVG)', status: 'pending' },
        { id: 'ast-2', section: 'documents', title: 'Affiliation Certificate / Registration Copy', status: 'pending' },
        { id: 'ast-3', section: 'documents', title: 'Fee Structure Circular PDF', status: 'provided' },
        { id: 'ast-4', section: 'content', title: 'Principal Desk Photo & Signed Message', status: 'pending' },
        { id: 'ast-5', section: 'media', title: 'Campus Infrastructure Photography (Front, Classrooms, Grounds)', status: 'pending' },
        { id: 'ast-6', section: 'media', title: 'Annual Function / Sports Meet Highlights', status: 'pending' },
      ],
    },
    legalPolicies: {
      privacyPolicyRequired: true,
      termsRequired: true,
      refundPolicyRequired: true,
      admissionPolicyRequired: true,
      feePolicyRequired: true,
      transportPolicyRequired: true,
      hostelPolicyRequired: false,
      childSafetyPolicyRequired: true,
      grievanceContact: `${params.contactName || 'Principal Office'}, ${params.contactPhone || ''}`,
      mandatoryDisclosuresProvided: true,
    },
    projectDelivery: {
      targetLaunchTimeline: 'within-3-4-weeks',
      targetLaunchDate: '',
      deliveryPriority: 'standard',
      isUrgentRequested: false,
      urgentConfirmed: false,
      expeditedFeeINR: 0,
      paymentStatus: 'not_requested',
      phase1Priorities: [
        'home_page',
        'about_school',
        'admissions_contact',
        'contact_locations',
        'mandatory_disclosures',
      ],
      phase2Priorities: [
        'events_calendar',
        'extended_gallery',
      ],
      importantDeadlineType: '',
      importantDeadlineDate: '',
      importantDeadlineNotes: '',
      decisionMakerType: 'primary_contact',
      decisionMakerName: params.contactName || '',
      decisionMakerRole: 'Principal / Director',
      decisionMakerEmail: params.contactEmail || '',
      decisionMakerPhone: params.contactPhone || '',
      deliveryNotes: '',
      // Legacy compatibility
      priority: 'Standard',
      phase1Requirements: 'Complete school website, online admission forms, fee structure publication, and staff CMS.',
      phase2Requirements: 'ERP student database, parent portal result publishing, and biometric attendance sync.',
      futureRequirements: 'GPS live bus tracking and custom native Android/iOS mobile application.',
      specialCustomizations: 'CBSE automated bilingual report cards with scholastic & co-scholastic grading.',
      importantDeadlines: '',
      decisionMakers: params.contactName || '',
      approvalAuthority: params.contactName || '',
    },
    usersAccess: {
      superAdminFullName: params.contactName || '',
      superAdminEmail: params.contactEmail || '',
      superAdminPhone: params.contactPhone || '',
      superAdminDesignation: 'Director / Principal',
      superAdminWhatsapp: params.contactPhone || '',
      additionalAdmins: [],
      initialStaffLoginsCountEstimate: 5,
    },
    clientConfirmation: {
      confirmedByName: params.contactName || '',
      confirmedByDesignation: 'Authorized Institutional Representative',
      confirmedByEmail: params.contactEmail || '',
      confirmedByPhone: params.contactPhone || '',
      isConfirmed: false,
      confirmedAt: '',
      isAccurate: false,
      isAuthorized: false,
      understandsReview: false,
      understandsMissingInfoDelays: false,
      declarationStatement: 'I declare that I am authorized by the institution management to provide these specifications and confirm that the information submitted is accurate and binding for system provisioning.',
    },
  };

  // Prepopulate intelligent Section 27 Final Website Verification & Specification and developer specifications
  const pageConfigs = buildWebsitePageConfigurations(initialIntake);
  const mandatoryConfig = generateMandatoryDisclosureConfig(initialIntake);
  const devSpec = generateWebsiteDeveloperSpec(initialIntake);

  if (initialIntake.websiteRequirements) {
    initialIntake.websiteRequirements.pageConfigurations = pageConfigs;
    initialIntake.websiteRequirements.mandatoryDisclosureConfig = mandatoryConfig;
    initialIntake.websiteRequirements.developerSpecification = devSpec;
  }

  // Prepopulate intelligent Section 6 School Story, Mission & Educational Philosophy
  initialIntake.schoolContent = generateFullSchoolContent(initialIntake, initialIntake.schoolContent);

  // Prepopulate intelligent Section 27 Portal Requirements & Notifications
  initialIntake.portalRequirements = normalizePortalRequirementsData(null, initialIntake);

  // Prepopulate intelligent Section 28 Media Assets & Content Kit
  initialIntake.mediaAssets = normalizeMediaAssetsData(null, initialIntake);

  // Initialize centralized media registry
  initialIntake.mediaRegistry = [];

  const { intakeData: normalizedInitial } = migrateAndNormalizeAcademicFees(initialIntake);
  return normalizedInitial as UniversalIntakeData;
}

export type SectionCompletionStatus =
  | 'complete'
  | 'incomplete'
  | 'partially_configured'
  | 'not_applicable';

export function calculateIntakeCompleteness(
  productId: string,
  data: Partial<UniversalIntakeData>,
  customFields: SchoolProjectCustomField[] = []
): {
  percentage: number;
  sectionPercentages: Record<IntakeSectionKey, number>;
  sectionStatuses: Record<IntakeSectionKey, SectionCompletionStatus>;
  missingFields: string[];
  isSubmissionReady: boolean;
} {
  // Support reversed argument order defensively
  if (typeof productId !== 'string' && typeof (data as any) === 'string') {
    const temp = productId;
    productId = data as any;
    data = temp as any;
  }

  const applicableSections = getApplicableSections(productId);
  const sectionPercentages = {} as Record<IntakeSectionKey, number>;
  const sectionStatuses = {} as Record<IntakeSectionKey, SectionCompletionStatus>;
  const missingFields: string[] = [];

  if (!data || Object.keys(data).length === 0) {
    applicableSections.forEach((s) => {
      sectionPercentages[s.key] = 0;
      sectionStatuses[s.key] = 'incomplete';
    });
    return {
      percentage: 0,
      sectionPercentages,
      sectionStatuses,
      missingFields: ['School Profile: School Identity data is required'],
      isSubmissionReady: false,
    };
  }

  // Authoritatively migrate and normalize legacy academic fees
  const { intakeData: normalizedData } = migrateAndNormalizeAcademicFees(data);
  data = normalizedData;

  const sectionScores: Record<string, { total: number; filled: number }> = {};
  const campuses = data.campuses || [];
  const isMultiCampus = campuses.length > 1;

  // 1. School Profile
  if (isSectionApplicable('schoolProfile', productId)) {
    const prof = data.schoolProfile || ({} as any);
    const boardCfg = getBoardIdentityConfig(prof.board);
    const required = [
      { key: 'schoolName', label: 'School Name' },
      { key: 'udiseCode', label: 'UDISE+ School Code' },
      { key: 'schoolCode', label: boardCfg.codeLabel },
      { key: 'schoolType', label: 'School Type' },
      { key: 'board', label: 'Affiliation Board' },
      { key: 'officialEmail', label: 'Primary Official Email' },
      { key: 'officialPhone', label: 'Primary Official Phone' },
    ];
    let filled = 0;
    required.forEach((r) => {
      const val = prof[r.key] ? String(prof[r.key]).trim() : '';
      if (r.key === 'udiseCode') {
        if (isValidSchoolId(val)) {
          filled++;
        } else {
          missingFields.push('School Profile: UDISE+ School Code (11 digits)');
        }
      } else if (r.key === 'schoolCode') {
        // Non-affiliated / other boards may enter N/A or code
        if (val.length > 0 || prof.board === 'Other') {
          filled++;
        } else {
          missingFields.push(`School Profile: ${r.label}`);
        }
      } else if (val.length > 0) {
        filled++;
      } else {
        missingFields.push(`School Profile: ${r.label}`);
      }
    });
    sectionScores['schoolProfile'] = { total: required.length, filled };
  }

  // 2. Campuses (Location source of truth)
  if (isSectionApplicable('campuses', productId)) {
    const campuses = data.campuses || [];
    let filled = 0;
    const mainCampus = campuses[0];
    if (mainCampus) {
      const countryVal = mainCampus.country;
      const customCountry = mainCampus.otherCountry || mainCampus.countryName;
      const hasValidCountry = isAddressFieldValid(countryVal || 'India', customCountry, true);

      const stateVal = mainCampus.state;
      const customState = mainCampus.otherStateProvince || mainCampus.otherState;
      const hasValidState = isAddressFieldValid(stateVal, customState, true);

      const effectiveCountry = resolveAddressValue(countryVal || 'India', customCountry);
      const isIndia = effectiveCountry.trim().toLowerCase() === 'india';

      const distVal = mainCampus.district;
      const customDist = mainCampus.otherDistrict;
      const hasValidDistrict = isIndia
        ? isAddressFieldValid(distVal, customDist, true)
        : isAddressFieldValid(distVal, customDist, false);

      const hasCity = Boolean(mainCampus.city?.trim());
      const hasPin = Boolean(mainCampus.pin?.trim());
      const hasAddress = Boolean(mainCampus.address?.trim());
      const hasName = Boolean(mainCampus.name?.trim());

      if (hasName && hasAddress && hasCity && hasValidState && hasValidDistrict && hasPin && hasValidCountry) {
        filled = 2;
      } else if (hasName || hasAddress || hasCity) {
        filled = 1;
        missingFields.push('Campuses: Main Campus Postal Address, Country, State/Province, District, City & PIN');
      } else {
        missingFields.push('Campuses: At least one campus/branch');
      }
    } else {
      missingFields.push('Campuses: At least one campus/branch');
    }
    sectionScores['campuses'] = { total: 2, filled };

    // Optional Google Maps URL validation: Google Maps Location Link must NEVER affect the campus section completion percentage
    for (let cIdx = 0; cIdx < campuses.length; cIdx++) {
      const c = campuses[cIdx];
      const link = c.googleMapsLink || c.googleMapsUrl;
      if (link && !isValidGoogleMapsUrl(link)) {
        missingFields.push('Campuses: Please enter a valid Google Maps link.');
      }

      // Validate per-image category classification for all uploaded campus images
      if (c.images && c.images.length > 0) {
        for (let iIdx = 0; iIdx < c.images.length; iIdx++) {
          const img = c.images[iIdx];
          const imgName = img.fileName || `Photo #${iIdx + 1}`;
          const campusLabel = c.name || `Campus ${cIdx + 1}`;

          const effectiveCategory =
            img.category ||
            img.imageCategory ||
            mapLegacyImageTypeToCategory(img.imageType);

          if (!effectiveCategory) {
            missingFields.push(`Campuses: Image Category / Image Type is required for "${imgName}" (${campusLabel})`);
          } else if (
            (effectiveCategory === 'other' || img.imageType?.toLowerCase() === 'other') &&
            (!img.customImageType || !img.customImageType.trim())
          ) {
            missingFields.push(`Campuses: Please specify custom type for "${imgName}" (${campusLabel})`);
          }
        }
      }
    }
  }

  // 3. Leadership
  if (isSectionApplicable('leadership', productId)) {
    const ldr = data.leadership || ({} as any);
    let filled = 0;
    if (ldr.principalName && ldr.principalName.trim().length > 0) filled++;
    else missingFields.push('Leadership: Principal Name');

    const desig = resolveDesignationDisplay(ldr.principalDesignation);
    if (desig.length > 0) filled++;
    else missingFields.push('Leadership: Principal Official Designation');

    const isErpOnly = productId === 'school-erp';
    if (!isErpOnly) {
      if (ldr.principalMessage && ldr.principalMessage.trim().length > 0) filled++;
      else missingFields.push('Leadership: Principal Desk Message');
    }

    const totalLeadership = isErpOnly ? 2 : 3;
    sectionScores['leadership'] = { total: totalLeadership, filled };
  }

  // 4. Brand Identity & School Profile
  if (isSectionApplicable('brandingDesign', productId)) {
    const brand = data.brandingDesign || ({} as any);
    let filled = 0;
    const isErpOnly = productId === 'school-erp';
    const total = isErpOnly ? 1 : 2;

    if (!isErpOnly) {
      const motto = (brand.motto || brand.taglineOrMotto || '').trim();
      if (motto.length > 0) filled++;
      else missingFields.push('Brand Identity: School Motto');
    }

    // Official School Logo / Crest requirement (supports direct upload or reused checklist asset)
    const logo = (brand.logoUrl || brand.crestUrl || '').trim();
    const checklistLogo = data.assetChecklist?.items?.find(
      (i) => (i.id === 'brand-logo' || i.id === 'brand-crest') && i.fileUrl && i.fileUrl.trim().length > 0 && i.status === 'provided'
    );
    if (logo.length > 0 || (checklistLogo && checklistLogo.fileUrl)) {
      filled++;
    } else {
      missingFields.push('Brand Identity: Official School Logo / Crest');
    }

    sectionScores['brandingDesign'] = { total, filled };
  }

  // 5. Website Requirements
  if (isSectionApplicable('websiteRequirements', productId)) {
    const web = data.websiteRequirements || ({} as any);
    let total = 3;
    let filled = 0;

    if (web.primaryPurpose && web.primaryPurpose.trim().length > 0) filled++;
    else missingFields.push('Website Requirements: Primary Website Purpose');

    if (Array.isArray(web.requiredPages) && web.requiredPages.length >= 3) filled++;
    else missingFields.push('Website Requirements: At least 3 required pages checked');

    // Requirement Configuration Readiness (distinguishing configuration from future CMS content)
    const configsMap = buildWebsitePageConfigurations(data, web.pageConfigurations);
    const configs = Object.values(configsMap) as WebsitePageConfiguration[];
    const enabledConfigs = configs.filter((c) => c.enabled);
    if (enabledConfigs.length > 0) {
      const incompletePages = enabledConfigs.filter((c) => {
        if (c.status === 'incomplete') return true;
        return (c.requirements || []).some(
          (r) => r.required && r.status === 'missing' && !r.isCmsFutureContent
        );
      });

      if (incompletePages.length === 0) {
        filled++;
      } else {
        missingFields.push(
          `Website Requirements: ${incompletePages.length} page(s) require information confirmation (${incompletePages.map((p) => p.label).slice(0, 3).join(', ')}${incompletePages.length > 3 ? '...' : ''})`
        );
      }
    } else {
      filled++;
    }

    sectionScores['websiteRequirements'] = { total, filled };
  }

  // 6. School Story, Mission & Educational Philosophy
  if (isSectionApplicable('schoolContent', productId)) {
    const content = data.schoolContent || ({} as any);
    const total = 5;
    let filled = 0;

    const aboutText = resolveContentBlockText(content.aboutSchool).trim();
    const missionText = (resolveContentBlockText(content.mission) || data.brandingDesign?.missionStatement || data.leadership?.missionStatement || '').trim();
    const visionText = (resolveContentBlockText(content.vision) || data.brandingDesign?.visionStatement || data.leadership?.visionStatement || '').trim();
    const philosophyText = (resolveContentBlockText(content.educationalPhilosophy) || content.teachingMethodology || content.philosophy || '').trim();
    const isExplicitlyApproved = content.isApproved === true || content.approved === true;

    // 1. About School Narrative (minimum 20 characters)
    if (aboutText.length > 20) {
      filled++;
    } else {
      missingFields.push('School Content: About School Narrative');
    }

    // 2. Mission Statement (minimum 10 characters)
    if (missionText.length > 10) {
      filled++;
    } else {
      missingFields.push('School Content: Mission Statement');
    }

    // 3. Vision Statement (minimum 10 characters)
    if (visionText.length > 10) {
      filled++;
    } else {
      missingFields.push('School Content: Vision Statement');
    }

    // 4. Educational Philosophy & Teaching Approach (minimum 20 characters)
    if (philosophyText.length > 20) {
      filled++;
    } else {
      missingFields.push('School Content: Educational Philosophy & Teaching Approach');
    }

    // 5. Explicit Approval (or legacy 2-field compatibility)
    if (isExplicitlyApproved) {
      filled++;
    } else if (
      content.isApproved === undefined &&
      !content.mission &&
      !content.vision &&
      aboutText.length > 20 &&
      philosophyText.length > 20
    ) {
      // Legacy draft compatibility: grant the 5th point if old 2-field format was already fully filled
      filled++;
    } else {
      missingFields.push('School Content: Story, Mission & Philosophy Review and Approval');
    }

    sectionScores['schoolContent'] = { total, filled };
  }

  // 7. Academic Structure
  if (isSectionApplicable('institutionStructure', productId)) {
    const inst = data.institutionStructure || ({} as any);
    let total = 3;
    let filled = 0;

    // Requirement 1: Session Name & Valid Dates
    const sessionName = (inst.currentAcademicSession || '').trim();
    const startDate = (inst.sessionStartDate || '').trim();
    const endDate = (inst.sessionEndDate || '').trim();
    const isDateOrderValid = Boolean(
      startDate &&
      endDate &&
      !isNaN(new Date(startDate).getTime()) &&
      !isNaN(new Date(endDate).getTime()) &&
      new Date(endDate).getTime() > new Date(startDate).getTime()
    );

    if (sessionName && startDate && endDate && isDateOrderValid) {
      filled++;
    } else {
      if (!sessionName) missingFields.push('Academic Structure: Academic Session Name');
      if (!startDate) missingFields.push('Academic Structure: Session Start Date');
      if (!endDate) missingFields.push('Academic Structure: Session End Date');
      if (startDate && endDate && !isDateOrderValid) missingFields.push('Academic Structure: Session End Date must be after Start Date');
    }

    // Requirement 2: Classes Roster & Structural Consistency
    const classes = Array.isArray(inst.classes) ? inst.classes : [];
    let classesValid = classes.length > 0;
    if (!classesValid) {
      missingFields.push('Academic Structure: At least one class/grade is required');
    } else {
      const seenClasses = new Set<string>();
      let hasClassError = false;
      for (let idx = 0; idx < classes.length; idx++) {
        const cls = classes[idx];
        const name = (cls?.name || cls?.className || '').trim();
        if (!name) {
          hasClassError = true;
          missingFields.push(`Academic Structure: Class #${idx + 1} Name Required`);
        } else if (seenClasses.has(name.toLowerCase())) {
          hasClassError = true;
          missingFields.push(`Academic Structure: Duplicate Class Name "${name}"`);
        } else {
          seenClasses.add(name.toLowerCase());
        }

        // Duplicate sections check
        if (Array.isArray(cls.sections)) {
          const seenSecs = new Set<string>();
          for (const sec of cls.sections) {
            const secName = typeof sec === 'string' ? sec.trim() : (sec?.name || '').trim();
            if (secName) {
              if (seenSecs.has(secName.toLowerCase())) {
                hasClassError = true;
                missingFields.push(`Academic Structure: Duplicate Section "${secName}" in ${name || 'class'}`);
              }
              seenSecs.add(secName.toLowerCase());
            }
          }
        }
      }

      // Custom Board validation
      if ((inst.board || '').trim().toLowerCase() === 'other' && !(inst.customBoard || '').trim()) {
        hasClassError = true;
        missingFields.push('Academic Structure: Custom Board Name Required');
      }

      if (hasClassError) {
        classesValid = false;
      }
    }

    if (classesValid) {
      filled++;
    }

    // Requirement 3: Explicit Confirmation
    const isConfirmed = Boolean(inst.confirmed ?? inst.academicStructureConfirmed ?? false);
    if (isConfirmed) {
      filled++;
    } else {
      missingFields.push('Academic Structure: Explicit Confirmation Required');
    }

    sectionScores['institutionStructure'] = { total, filled };
  }

  // 8. Staff Faculty
  if (isSectionApplicable('staffFaculty', productId)) {
    const staff = data.staffFaculty || ({} as any);
    const isWebsiteOnly = productId === 'school-website' || productId === 'school-website-cms';
    if (isWebsiteOnly) {
      sectionScores['staffFaculty'] = { total: 1, filled: 1 };
    } else if (!isMultiCampus) {
      let filled = 0;
      if (staff.estimatedTotalStaff && staff.estimatedTotalStaff > 0) filled++;
      else missingFields.push('Staff & Faculty: Estimated Total Staff Count');

      sectionScores['staffFaculty'] = { total: 1, filled };
    } else {
      let total = 0;
      let filled = 0;
      let allNotApplicable = true;
      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'staffFaculty', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        allNotApplicable = false;
        total++;
        const cStaff = (resolved.data as any) || {};
        const count = cStaff.estimatedTotalStaff ?? (Array.isArray(cStaff.staffMembers) ? cStaff.staffMembers.length : 0);
        if (count && count > 0) {
          filled++;
        } else {
          missingFields.push(`${getCampusDisplayName(camp)}: Staff & Faculty - Estimated Total Staff Count`);
        }
      }
      if (allNotApplicable) {
        sectionScores['staffFaculty'] = { total: 0, filled: 0 };
        sectionStatuses['staffFaculty'] = 'not_applicable';
        sectionPercentages['staffFaculty'] = 100;
      } else {
        sectionScores['staffFaculty'] = { total: Math.max(1, total), filled };
      }
    }
  }

  // 9. Student Information & Configuration
  if (isSectionApplicable('studentConfig', productId)) {
    const st = data.studentConfig || ({} as any);
    let total = 3;
    let filled = 0;

    // 1. Student Institutional ID format
    if (st.studentIdFormat && st.studentIdFormat.trim().length > 0) filled++;
    else missingFields.push('Student Information: Student ID Format');

    // 2. Admission Number Format
    if (st.admissionNumberFormat && st.admissionNumberFormat.trim().length > 0) filled++;
    else missingFields.push('Student Information: Admission Number Format');

    // 3. Student Information Field Selection (with legacy fallback)
    const enabled = Array.isArray(st.enabledFields) ? st.enabledFields : (st.requiredStudentFields || []);
    if (enabled.length >= 2 || (st.studentIdFormat && st.admissionNumberFormat)) filled++;
    else missingFields.push('Student Information: Field Selection');

    sectionScores['studentConfig'] = { total, filled };
  }

  // 10. Admissions, Fees & Schedule
  if (isSectionApplicable('admissions', productId)) {
    if (!isMultiCampus) {
      const admResult = calculateAdmissionCompleteness(data, productId);
      sectionScores['admissions'] = admResult.score;
      missingFields.push(...admResult.missingFields);
    } else {
      let total = 1;
      let filled = 0;
      const adm = data.admissions || ({} as any);

      // Required 1: Target Admission Session (School-wide)
      const session = (adm.session || adm.targetSessions || '').trim();
      if (session.length > 0) {
        filled++;
      } else {
        missingFields.push('Admissions: Target Admission Session');
      }

      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'admissions', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        const cAdm = (resolved.data as any) || {};

        total += 2;
        const incharge = (cAdm.contact?.name || cAdm.contactPerson || '').trim();
        if (incharge.length > 0) {
          filled++;
        } else {
          missingFields.push(`${getCampusDisplayName(camp)}: Admissions - In-Charge Name`);
        }

        const hasPhone = Boolean((cAdm.contact?.phone || cAdm.admissionPhone || '').trim());
        const hasEmail = Boolean((cAdm.contact?.email || cAdm.admissionEmail || '').trim());
        const hasWhatsapp = Boolean((cAdm.contact?.whatsapp || cAdm.admissionWhatsapp || '').trim());
        const hasHours = Boolean((cAdm.contact?.visitingHours || cAdm.officeHours || '').trim());
        const hasAddress = Boolean((cAdm.contact?.address || '').trim());

        if (hasPhone || hasEmail || hasWhatsapp || hasHours || hasAddress) {
          filled++;
        } else {
          missingFields.push(`${getCampusDisplayName(camp)}: Admissions - Primary admissions contact method`);
        }
      }

      sectionScores['admissions'] = { total, filled };
    }
  }

  // 11. Fees
  if (isSectionApplicable('feesConfiguration', productId)) {
    const feeResult = calculateFeeStructureCompleteness(data, productId);
    sectionScores['feesConfiguration'] = feeResult.score;
    missingFields.push(...feeResult.missingFields);
  }

  // 12. Academic Curriculum
  if (isSectionApplicable('curriculum', productId)) {
    const currResult = calculateCurriculumCompleteness(data, productId);
    sectionScores['curriculum'] = currResult.score;
    missingFields.push(...currResult.missingFields);
  }

  // 12. Attendance
  if (isSectionApplicable('attendanceConfig', productId)) {
    const att = data.attendanceConfig || ({} as any);
    let filled = 0;
    const total = 8;

    // 1. Student Attendance Mode
    if (att.studentAttendanceMode && att.studentAttendanceMode !== 'undecided') filled++;
    else missingFields.push('Attendance: Student Attendance Mode');

    // 2. Staff Attendance Mode
    if (att.staffAttendanceMode && att.staffAttendanceMode !== 'undecided') filled++;
    else missingFields.push('Attendance: Staff Attendance Mode');

    // 3. School Start Time
    if (att.schoolStartTime && String(att.schoolStartTime).trim().length > 0) filled++;
    else missingFields.push('Attendance: School Start Time');

    // 4. School End Time
    if (att.schoolEndTime && String(att.schoolEndTime).trim().length > 0) filled++;
    else missingFields.push('Attendance: School End Time');

    // 5. Working Days
    if (Array.isArray(att.workingDays) && att.workingDays.length > 0) filled++;
    else missingFields.push('Attendance: Working Days Schedule');

    // 6. Number of Periods
    if (typeof att.periodCount === 'number' && att.periodCount > 0) filled++;
    else missingFields.push('Attendance: Number of Periods');

    // 7. Period Duration
    if (typeof att.periodDurationMinutes === 'number' && att.periodDurationMinutes > 0) filled++;
    else missingFields.push('Attendance: Period Duration');

    // 8. Parent Alert Preference
    const hasChannels = Array.isArray(att.parentAbsenceChannels) && att.parentAbsenceChannels.length > 0 && !att.parentAbsenceChannels.includes('undecided');
    const hasLegacyAlert = att.parentAbsenceNotification && att.parentAbsenceNotification.length > 0 && att.parentAbsenceNotification !== 'none';
    if (hasChannels || hasLegacyAlert) filled++;
    else missingFields.push('Attendance: Parent Absence Alert Channel');

    sectionScores['attendanceConfig'] = { total, filled };
  }

  // 13. Examination
  if (isSectionApplicable('examinationConfig', productId)) {
    const exam = data.examinationConfig || ({} as any);
    let filled = 0;
    if (exam.gradingSystem) filled++;
    else missingFields.push('Examinations: Grading System');

    sectionScores['examinationConfig'] = { total: 1, filled };
  }

  // 14. Transport (Conditional)
  if (data.transportConfig?.status === 'no') {
    sectionScores['transportConfig'] = { total: 0, filled: 0 };
    sectionStatuses['transportConfig'] = 'not_applicable';
    sectionPercentages['transportConfig'] = 100;
  } else if (isSectionApplicable('transportConfig', productId)) {
    if (!isMultiCampus) {
      const score = getTransportSectionScore(data.transportConfig, productId);
      sectionScores['transportConfig'] = { total: score.total, filled: score.filled };
      if (score.missingFields.length > 0) {
        score.missingFields.forEach((mf) => missingFields.push(`Transport: ${mf}`));
      }
    } else {
      let total = 0;
      let filled = 0;
      let allNotApplicable = true;
      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'transportConfig', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        allNotApplicable = false;
        const score = getTransportSectionScore(resolved.data, productId);
        total += score.total;
        filled += score.filled;
        if (score.missingFields.length > 0) {
          score.missingFields.forEach((mf) => missingFields.push(`${getCampusDisplayName(camp)}: Transport - ${mf}`));
        }
      }
      if (allNotApplicable) {
        sectionScores['transportConfig'] = { total: 0, filled: 0 };
        sectionStatuses['transportConfig'] = 'not_applicable';
        sectionPercentages['transportConfig'] = 100;
      } else {
        sectionScores['transportConfig'] = { total: Math.max(1, total), filled };
      }
    }
  }

  // 15. Campus Facilities (Structured Website Content Engine)
  if (isSectionApplicable('facilitiesConfig', productId)) {
    if (!isMultiCampus) {
      const facScore = getFacilitiesSectionScore(data.facilitiesConfig, data);
      sectionScores['facilitiesConfig'] = { total: facScore.total, filled: facScore.filled };
      sectionPercentages['facilitiesConfig'] = facScore.percentage;
      sectionStatuses['facilitiesConfig'] = facScore.isComplete ? 'complete' : facScore.filled > 0 ? 'partially_configured' : 'incomplete';
      if (facScore.missingFields.length > 0) {
        missingFields.push(...facScore.missingFields);
      }
    } else {
      let total = 0;
      let filled = 0;
      let allNotApplicable = true;
      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'facilitiesConfig', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        allNotApplicable = false;
        const facScore = getFacilitiesSectionScore(resolved.data, data);
        total += facScore.total;
        filled += facScore.filled;
        if (facScore.missingFields.length > 0) {
          missingFields.push(...facScore.missingFields.map((mf) => `${getCampusDisplayName(camp)}: ${mf}`));
        }
      }
      if (allNotApplicable) {
        sectionScores['facilitiesConfig'] = { total: 0, filled: 0 };
        sectionStatuses['facilitiesConfig'] = 'not_applicable';
        sectionPercentages['facilitiesConfig'] = 100;
      } else {
        sectionScores['facilitiesConfig'] = { total: Math.max(1, total), filled };
        sectionPercentages['facilitiesConfig'] = Math.round((filled / Math.max(1, total)) * 100);
        sectionStatuses['facilitiesConfig'] = filled === total ? 'complete' : filled > 0 ? 'partially_configured' : 'incomplete';
      }
    }
  }

  // 16. Library (Consolidated into Facilities for Website products; standalone for ERP)
  const isWebsiteProduct = productId === 'school-website' || productId === 'school-website-cms';
  if (isWebsiteProduct) {
    sectionScores['libraryConfig'] = { total: 0, filled: 0 };
    sectionStatuses['libraryConfig'] = 'not_applicable';
    sectionPercentages['libraryConfig'] = 100;
  } else if (isSectionApplicable('libraryConfig', productId)) {
    if (!isMultiCampus) {
      const libScore = getLibrarySectionScore(data.libraryConfig, productId);
      sectionScores['libraryConfig'] = { total: libScore.total, filled: libScore.filled };
      if (libScore.missingFields.length > 0) {
        missingFields.push(...libScore.missingFields);
      }
    } else {
      let total = 0;
      let filled = 0;
      let allNotApplicable = true;
      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'libraryConfig', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        allNotApplicable = false;
        const libScore = getLibrarySectionScore(resolved.data, productId);
        total += libScore.total;
        filled += libScore.filled;
        if (libScore.missingFields.length > 0) {
          missingFields.push(...libScore.missingFields.map((mf) => `${getCampusDisplayName(camp)}: ${mf}`));
        }
      }
      if (allNotApplicable) {
        sectionScores['libraryConfig'] = { total: 0, filled: 0 };
        sectionStatuses['libraryConfig'] = 'not_applicable';
        sectionPercentages['libraryConfig'] = 100;
      } else {
        sectionScores['libraryConfig'] = { total: Math.max(1, total), filled };
      }
    }
  }

  // 17. Hostel (Consolidated into Facilities for Website products; standalone for ERP)
  if (isWebsiteProduct) {
    sectionScores['hostelConfig'] = { total: 0, filled: 0 };
    sectionStatuses['hostelConfig'] = 'not_applicable';
    sectionPercentages['hostelConfig'] = 100;
  } else if (isSectionApplicable('hostelConfig', productId)) {
    const isApplicable = isHostelApplicable(data.schoolProfile);
    if (!isApplicable) {
      sectionScores['hostelConfig'] = { total: 0, filled: 0 };
      sectionStatuses['hostelConfig'] = 'not_applicable';
      sectionPercentages['hostelConfig'] = 100;
    } else if (!isMultiCampus) {
      const hstScore = getHostelSectionScore(data.hostelConfig, true, productId);
      sectionScores['hostelConfig'] = { total: hstScore.total, filled: hstScore.filled };
      sectionStatuses['hostelConfig'] = hstScore.status;
      sectionPercentages['hostelConfig'] = hstScore.percentage;
      if (hstScore.missingFields.length > 0) {
        missingFields.push(...hstScore.missingFields);
      }
    } else {
      let total = 0;
      let filled = 0;
      let allNotApplicable = true;
      for (const camp of campuses) {
        const resolved = resolveCampusSectionData(data, 'hostelConfig', camp.id);
        if (resolved.mode === 'not_applicable') continue;
        allNotApplicable = false;
        const hstScore = getHostelSectionScore(resolved.data, true, productId);
        total += hstScore.total;
        filled += hstScore.filled;
        if (hstScore.missingFields.length > 0) {
          missingFields.push(...hstScore.missingFields.map((mf) => `${getCampusDisplayName(camp)}: ${mf}`));
        }
      }
      if (allNotApplicable) {
        sectionScores['hostelConfig'] = { total: 0, filled: 0 };
        sectionStatuses['hostelConfig'] = 'not_applicable';
        sectionPercentages['hostelConfig'] = 100;
      } else {
        sectionScores['hostelConfig'] = { total: Math.max(1, total), filled };
      }
    }
  }

  // 18. Communication
  if (isSectionApplicable('communicationConfig', productId)) {
    const commScore = getCommunicationSectionScore(data.communicationConfig);
    sectionScores['communicationConfig'] = { total: commScore.total, filled: commScore.filled };
    if (commScore.missingFields.length > 0) {
      missingFields.push(...commScore.missingFields);
    }
  }

  // 19. CMS Requirements
  if (isSectionApplicable('cmsRequirements', productId)) {
    const cms = data.cmsRequirements || ({} as any);
    let total = 2;
    let filled = 0;

    const roles = Array.isArray(cms.managingRoles) ? cms.managingRoles : (cms.roles || []);
    if (roles.length > 0) filled++;
    else missingFields.push('Website CMS: Managing Editorial Roles');

    if (cms.approvalWorkflow) filled++;
    else missingFields.push('Website CMS: Content Approval Workflow Choice');

    sectionScores['cmsRequirements'] = { total, filled };
  }

  // Website Scope & Project Configuration (Section 21) - Strictly optional
  if (isSectionApplicable('websiteScope', productId)) {
    sectionScores['websiteScope'] = { total: 1, filled: 1 };
  }

  // 20. Domain Presence (Website & Domain Setup)
  if (isSectionApplicable('domainPresence', productId)) {
    const dom = data.domainPresence || ({} as any);
    // Complete if school has selected a new domain, provided an existing domain, or chose to decide later
    const hasSelectedDomain = Boolean(
      (dom.domainChoice === 'NEW_DOMAIN' || dom.domainChoice === 'new' || dom.needsNewDomain) &&
      (
        dom.selectedDomainQuote?.domainName ||
        (dom.preferredNewDomainName && dom.preferredNewDomainName.trim().length > 0) ||
        (dom.preferredDomain && dom.preferredDomain.trim().length > 0)
      )
    );
    const hasExistingDomain = Boolean(
      (dom.domainChoice === 'EXISTING_DOMAIN' || dom.domainChoice === 'existing' || dom.alreadyOwnsDomain) &&
      (
        (dom.existingDomainName && dom.existingDomainName.trim().length > 0) ||
        (dom.preferredDomain && dom.preferredDomain.trim().length > 0)
      )
    );
    const hasDecideLater = Boolean(
      dom.domainChoice === 'DECIDE_LATER' ||
      dom.domainChoice === 'later' ||
      dom.decideLater === true
    );
    // Backward compatibility for pre-existing records with preferredNewDomainName
    const hasLegacySelectedDomain = Boolean(
      !dom.domainChoice &&
      dom.preferredNewDomainName &&
      dom.preferredNewDomainName.trim().length > 0 &&
      !dom.alreadyOwnsDomain
    );

    const isComplete = hasSelectedDomain || hasExistingDomain || hasDecideLater || hasLegacySelectedDomain;

    if (isComplete) {
      sectionScores['domainPresence'] = { total: 1, filled: 1 };
    } else {
      sectionScores['domainPresence'] = { total: 1, filled: 0 };
      missingFields.push('Website & Domain Setup: Please select a preferred domain, confirm your existing domain, or choose decide later.');
    }
  }

  // Custom Requirements & Special Requests (Section 23) - Strictly optional
  if (isSectionApplicable('additionalRequirements', productId)) {
    sectionScores['additionalRequirements'] = { total: 1, filled: 1 };
  }

  // 21. Data Migration (Section 18 in 29-section ERP)
  if (isSectionApplicable('existingSystemsMigration', productId)) {
    const migScore = calculateDataMigrationScore(data.existingSystemsMigration);
    sectionScores['existingSystemsMigration'] = {
      total: Math.max(1, migScore.total),
      filled: migScore.filled,
    };
    if (migScore.missingTitles.length > 0) {
      migScore.missingTitles.forEach((t) => missingFields.push(t));
    }
  }

  // 22. Integrations (Section 19 in 29-section ERP)
  if (isSectionApplicable('integrationsConfig', productId)) {
    const integScore = getIntegrationsSectionScore(data.integrationsConfig);
    sectionScores['integrationsConfig'] = { total: integScore.total, filled: integScore.filled };
    if (integScore.missingFields.length > 0) {
      integScore.missingFields.forEach((mf) => missingFields.push(`Integrations: ${mf}`));
    }
  }

  // 23. Mobile Apps
  if (isSectionApplicable('mobileAppConfig', productId)) {
    const mobileValidation = validateMobileAppSection(
      data.mobileAppConfig,
      data.schoolProfile?.schoolName
    );
    sectionScores['mobileAppConfig'] = {
      total: Math.max(1, mobileValidation.score.total),
      filled: mobileValidation.score.filled,
    };
    if (mobileValidation.missingFields.length > 0) {
      missingFields.push(...mobileValidation.missingFields);
    }
  }

  // 24. Security
  if (isSectionApplicable('securityPrivacy', productId)) {
    const secScore = calculateSecuritySectionScore(data.securityPrivacy, productId);
    sectionScores['securityPrivacy'] = { total: secScore.total, filled: secScore.filled };
    if (secScore.missingFields.length > 0) {
      secScore.missingFields.forEach((mf) => missingFields.push(`Security: ${mf}`));
    }
  }

  // 25. Assets Checklist
  if (isSectionApplicable('assetChecklist', productId)) {
    const rawAssetData = data.assetChecklist;
    const syncedItems = syncAssetChecklistWithIntake(
      data as UniversalIntakeData,
      rawAssetData?.items
    );
    const score = calculateAssetChecklistScore(syncedItems);

    sectionScores['assetChecklist'] = {
      total: Math.max(1, score.totalRequired),
      filled: score.providedRequired,
    };

    if (score.missingRequiredTitles.length > 0) {
      score.missingRequiredTitles.forEach((t) => {
        missingFields.push(`Asset Checklist: ${t}`);
      });
    }
  }

  // 26. Legal Policies
  if (isSectionApplicable('legalPolicies', productId)) {
    sectionScores['legalPolicies'] = { total: 1, filled: 1 };
  }

  // 27. Project Delivery
  if (isSectionApplicable('projectDelivery', productId)) {
    const pd = data.projectDelivery || ({} as any);
    let filled = 0;
    const isUrgent = pd.deliveryPriority === 'urgent';
    const totalRequired = isUrgent ? 5 : 4;

    // 1. Target Launch Timeline
    const timeline = pd.targetLaunchTimeline || pd.targetLaunchDate;
    const isSpecificDate = timeline === 'specific-date';
    if (isSpecificDate) {
      if (pd.targetLaunchDate && pd.targetLaunchDate.trim().length > 0 && pd.targetLaunchDate !== 'specific-date') {
        filled++;
      } else {
        missingFields.push('Project Delivery: Specific Target Launch Date');
      }
    } else if (timeline && String(timeline).trim().length > 0) {
      filled++;
    } else {
      missingFields.push('Project Delivery: Target Launch Timeline');
    }

    // 2. Delivery Priority
    if (pd.deliveryPriority && ['standard', 'priority', 'urgent'].includes(pd.deliveryPriority)) {
      filled++;
    } else if (pd.priority && String(pd.priority).trim().length > 0) {
      filled++;
    } else {
      missingFields.push('Project Delivery: Delivery Priority Selection');
    }

    // 3. Project Decision Maker
    const dmName = pd.decisionMakerName?.trim() || pd.decisionMakers?.trim() || '';
    const dmContact = pd.decisionMakerEmail?.trim() || pd.decisionMakerPhone?.trim() || '';
    if (dmName.length > 0 && dmContact.length > 0) {
      filled++;
    } else if (dmName.length > 0) {
      filled++;
    } else {
      missingFields.push('Project Delivery: Project Decision Maker');
    }

    // 4. Phase 1 Priorities (Launch Essentials)
    const hasPhase1 =
      (Array.isArray(pd.phase1Priorities) && pd.phase1Priorities.length > 0) ||
      (pd.phase1Requirements && String(pd.phase1Requirements).trim().length > 0);
    if (hasPhase1) {
      filled++;
    } else {
      missingFields.push('Project Delivery: Phase 1 Launch Priorities');
    }

    // 5. Conditional Urgent Confirmation (only if urgent is selected)
    if (isUrgent) {
      if (pd.urgentConfirmed === true) {
        filled++;
      } else {
        missingFields.push('Project Delivery: Expedited Delivery Charge Confirmation');
      }
    }

    sectionScores['projectDelivery'] = { total: totalRequired, filled };
  }

  // 28. Users & Access
  if (isSectionApplicable('usersAccess', productId)) {
    const usr = data.usersAccess || ({} as any);
    let filled = 0;
    if (usr.superAdminFullName && usr.superAdminFullName.trim().length > 0) filled++;
    else missingFields.push('Administrator Provisioning: Super Admin Name');

    if (usr.superAdminEmail && usr.superAdminEmail.trim().length > 0) filled++;
    else missingFields.push('Administrator Provisioning: Super Admin Email');

    if (usr.superAdminPhone && usr.superAdminPhone.trim().length > 0) filled++;
    else missingFields.push('Administrator Provisioning: Super Admin Phone');

    sectionScores['usersAccess'] = { total: 3, filled };
  }

  // 29. Portal Requirements & Notifications
  if (isSectionApplicable('portalRequirements', productId)) {
    const portalValidation = validatePortalRequirementsData(
      data.portalRequirements,
      data
    );
    sectionScores['portalRequirements'] = {
      total: Math.max(1, portalValidation.score.total),
      filled: portalValidation.score.filled,
    };
    if (portalValidation.missingFields.length > 0) {
      missingFields.push(...portalValidation.missingFields);
    }
  }

  // 30. Media Assets & Content Kit
  if (isSectionApplicable('mediaAssets', productId)) {
    const mediaValidation = validateMediaAssetsData(
      data.mediaAssets,
      data
    );
    sectionScores['mediaAssets'] = {
      total: Math.max(1, mediaValidation.score.total),
      filled: mediaValidation.score.filled,
    };
    if (mediaValidation.missingFields.length > 0) {
      missingFields.push(...mediaValidation.missingFields);
    }
  }

  // Custom mandatory fields
  customFields.forEach((cf) => {
    if (cf.is_required) {
      const sectionKey = cf.section_key as IntakeSectionKey;
      if (sectionScores[sectionKey]) {
        sectionScores[sectionKey].total += 1;
        const val = (data as any)[sectionKey]?.[cf.field_key];
        if (val !== undefined && String(val).trim().length > 0) {
          sectionScores[sectionKey].filled += 1;
        } else {
          missingFields.push(`Custom Field (${cf.label}): Required`);
        }
      }
    }
  });

  let grandTotal = 0;
  let grandFilled = 0;

  applicableSections.forEach((s) => {
    // If section is marked as not_applicable, exclude it from required completion calculation
    if (sectionStatuses[s.key] === 'not_applicable') {
      if (sectionPercentages[s.key] === undefined) {
        sectionPercentages[s.key] = 100;
      }
      return;
    }

    const score = sectionScores[s.key] || { total: 1, filled: 1 };
    grandTotal += score.total;
    grandFilled += score.filled;
    if (sectionPercentages[s.key] === undefined) {
      sectionPercentages[s.key] = score.total > 0 ? Math.round((score.filled / score.total) * 100) : 100;
    }
    if (!sectionStatuses[s.key]) {
      if (sectionPercentages[s.key] === 100) {
        sectionStatuses[s.key] = 'complete';
      } else if (sectionPercentages[s.key] > 0) {
        sectionStatuses[s.key] = 'partially_configured';
      } else {
        sectionStatuses[s.key] = 'incomplete';
      }
    }
  });

  const percentage = grandTotal > 0 ? Math.round((grandFilled / grandTotal) * 100) : 100;
  const isSubmissionReady = missingFields.length === 0;

  return {
    percentage,
    sectionPercentages,
    sectionStatuses,
    missingFields,
    isSubmissionReady,
  };
}
