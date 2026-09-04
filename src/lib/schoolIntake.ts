import type { UniversalIntakeData, SchoolProjectCustomField } from './types';

export type IntakeSectionKey =
  | 'schoolProfile'
  | 'institutionStructure'
  | 'websiteRequirements'
  | 'cmsRequirements'
  | 'erpRequirements'
  | 'portalRequirements'
  | 'brandingDesign'
  | 'domainPresence'
  | 'existingSystemsMigration'
  | 'usersAccess'
  | 'mediaAssets'
  | 'additionalRequirements';

export interface SectionMetadata {
  key: IntakeSectionKey;
  title: string;
  shortTitle: string;
  description: string;
  applicableProducts: ('school-website' | 'school-website-cms' | 'school-erp' | 'school-complete')[];
  isMandatory: boolean;
}

export const INTAKE_SECTIONS: SectionMetadata[] = [
  {
    key: 'schoolProfile',
    title: 'School & Institutional Profile',
    shortTitle: 'Profile',
    description: 'Official legal identification, board affiliations, location, and head/management contacts.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'institutionStructure',
    title: 'Academic Structure & Campus Sizing',
    shortTitle: 'Structure',
    description: 'Campuses, class ranges, section counts, student capacities, and faculty scale.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'websiteRequirements',
    title: 'Public Website Architecture & Pages',
    shortTitle: 'Website',
    description: 'Site purpose, page checklist, principal message, achievements, and statutory disclosures.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'cmsRequirements',
    title: 'Content Management (CMS) Workflow',
    shortTitle: 'CMS',
    description: 'Staff publishing permissions, notice categories, albums, and approval workflows.',
    applicableProducts: ['school-website-cms', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'erpRequirements',
    title: 'Operational ERP Requirements Questionnaire',
    shortTitle: 'ERP Scope',
    description: 'Requirements for SIS, fees ledger, attendance modes, CBSE report cards, and optional modules.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'portalRequirements',
    title: 'Self-Service Portals (Parent / Student / Staff)',
    shortTitle: 'Portals',
    description: 'Mobile/web portal visibility, fee receipts, results, and notification preferences.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'brandingDesign',
    title: 'School Branding, Colors & Visual Identity',
    shortTitle: 'Branding',
    description: 'High-resolution crest/logo, color palette, design references, and institutional visual tone.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'domainPresence',
    title: 'Custom Domain & Online Infrastructure',
    shortTitle: 'Domain',
    description: 'Domain registration status, DNS delegation, institutional email addresses, and social handles.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'existingSystemsMigration',
    title: 'Legacy Data Migration Assessment',
    shortTitle: 'Migration',
    description: 'Current software, Excel spreadsheets, student/staff migration volumes, and readiness.',
    applicableProducts: ['school-erp', 'school-complete'],
    isMandatory: false,
  },
  {
    key: 'usersAccess',
    title: 'Administrative Account Provisioning',
    shortTitle: 'Users',
    description: 'Initial Super-Administrator credentials and estimated staff accounts count.',
    applicableProducts: ['school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'mediaAssets',
    title: 'Photography & Document Package Guidance',
    shortTitle: 'Media Package',
    description: 'Download the structured folder kit and verify your institutional photo preparation.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: true,
  },
  {
    key: 'additionalRequirements',
    title: 'Special Custom Requirements & Workflows',
    shortTitle: 'Custom Scope',
    description: 'Unique examination formulas, custom state-specific reports, or specialized workflows.',
    applicableProducts: ['school-website', 'school-website-cms', 'school-erp', 'school-complete'],
    isMandatory: false,
  },
];

export function getApplicableSections(productId: string): SectionMetadata[] {
  return INTAKE_SECTIONS.filter((section) =>
    (section.applicableProducts as string[]).includes(productId)
  );
}

export function isSectionApplicable(sectionKey: IntakeSectionKey, productId: string): boolean {
  const section = INTAKE_SECTIONS.find((s) => s.key === sectionKey);
  if (!section) return false;
  return (section.applicableProducts as string[]).includes(productId);
}

export function createInitialIntakeData(params: {
  schoolName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  city?: string | null;
  state?: string | null;
  domainRequirement?: string | null;
}): UniversalIntakeData {
  return {
    schoolProfile: {
      schoolName: params.schoolName || '',
      schoolType: 'Co-Educational Day School',
      board: 'CBSE',
      address: '',
      city: params.city || 'Motihari',
      state: params.state || 'Bihar',
      country: 'India',
      pin: '',
      officialEmail: params.contactEmail || '',
      officialPhone: params.contactPhone || '',
      principalName: '',
      managementContactName: params.contactName || '',
      managementContactPhone: params.contactPhone || '',
    },
    institutionStructure: {
      isMultiCampus: false,
      currentAcademicSession: '2026-2027',
      classesOfferedFrom: 'Nursery',
      classesOfferedTo: 'Class 12',
      totalSectionsEstimated: 12,
      studentCapacityTotal: 600,
      teachingStaffCount: 30,
      nonTeachingStaffCount: 10,
    },
    websiteRequirements: {
      primaryPurpose: 'Enhance school credibility, attract new admissions, and publish circulars.',
      requiredPages: [
        'About School',
        'Principal Message',
        'Campus Facilities',
        'Photo & Video Gallery',
        'Notice Board',
        'Admissions Online Form',
        'Contact Us',
      ],
      migrationNeededFromExisting: false,
      languagesRequired: ['English', 'Hindi'],
    },
    cmsRequirements: {
      managingRoles: ['Principal', 'Computer Teacher'],
      estimatedCmsUsers: 3,
      requiresApprovalBeforePublish: true,
      contentCategories: ['Notices & Circulars', 'Photo Gallery', 'Events Calendar'],
    },
    erpRequirements: {
      studentManagementPriority: 'Complete student academic profiles and admission lifecycle',
      attendanceTrackingMode: 'daily',
      feeStructureComplexity: 'monthly_tiered',
      examGradingSystem: 'cbse_grading',
      tcCertificateAutomated: true,
      idCardPrintingNeeded: true,
      transportModuleNeeded: false,
      libraryModuleNeeded: false,
      hostelModuleNeeded: false,
      cafeteriaModuleNeeded: false,
    },
    portalRequirements: {
      parentPortalEnabled: true,
      studentPortalEnabled: true,
      staffPortalEnabled: true,
      parentNotificationChannels: ['WhatsApp', 'SMS'],
      resultPublishingOnPortal: true,
      feeReceiptsDownloadable: true,
      attendanceVisibilityImmediate: true,
    },
    brandingDesign: {
      hasHighResLogo: false,
      preferredVisualTone: 'modern_vibrant',
    },
    domainPresence: {
      alreadyOwnsDomain: false,
      preferredNewDomainName: params.domainRequirement || '',
      dnsManagementAccessAvailable: false,
      officialEmailDomainNeeded: true,
    },
    existingSystemsMigration: {
      currentSystemType: 'excel_spreadsheets',
      migrateStudentRecords: true,
      migrateStaffRecords: false,
      migrateHistoricalFeeLedgers: false,
      migrationReadinessStatus: 'needs_formatting_help',
    },
    usersAccess: {
      superAdminFullName: params.contactName || '',
      superAdminEmail: params.contactEmail || '',
      superAdminPhone: params.contactPhone || '',
      initialStaffLoginsCountEstimate: 5,
    },
    additionalRequirements: {},
  };
}

export function calculateIntakeCompleteness(
  productId: string,
  data: Partial<UniversalIntakeData>,
  customFields: SchoolProjectCustomField[] = []
): {
  percentage: number;
  sectionPercentages: Record<IntakeSectionKey, number>;
  missingFields: string[];
  isSubmissionReady: boolean;
} {
  const applicableSections = getApplicableSections(productId);
  if (!data || Object.keys(data).length === 0) {
    const emptyPercentages = {} as Record<IntakeSectionKey, number>;
    applicableSections.forEach((s) => {
      emptyPercentages[s.key] = 0;
    });
    return {
      percentage: 0,
      sectionPercentages: emptyPercentages,
      missingFields: ['No intake data provided'],
      isSubmissionReady: false,
    };
  }

  const sectionScores: Record<string, { total: number; filled: number }> = {};
  const missing: string[] = [];

  // 1. School Profile
  if (isSectionApplicable('schoolProfile', productId)) {
    const prof = (data.schoolProfile || {}) as Record<string, any>;
    const required = [
      { key: 'schoolName', label: 'School Name' },
      { key: 'schoolType', label: 'School Type' },
      { key: 'board', label: 'Affiliation Board' },
      { key: 'address', label: 'School Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'pin', label: 'Postal PIN Code' },
      { key: 'officialEmail', label: 'Official School Email' },
      { key: 'officialPhone', label: 'Official Phone Number' },
    ];
    let filled = 0;
    required.forEach((r) => {
      if (prof[r.key] && String(prof[r.key]).trim().length > 0) filled++;
      else missing.push(`School Profile: ${r.label}`);
    });
    sectionScores['schoolProfile'] = { total: required.length, filled };
  }

  // 2. Institution Structure
  if (isSectionApplicable('institutionStructure', productId)) {
    const inst = (data.institutionStructure || {}) as Record<string, any>;
    const required = [
      { key: 'currentAcademicSession', label: 'Academic Session' },
      { key: 'classesOfferedFrom', label: 'Starting Class' },
      { key: 'classesOfferedTo', label: 'Ending Class' },
      { key: 'studentCapacityTotal', label: 'Total Student Capacity' },
    ];
    let filled = 0;
    required.forEach((r) => {
      if (inst[r.key] !== undefined && String(inst[r.key]).trim().length > 0) filled++;
      else missing.push(`Institution Structure: ${r.label}`);
    });
    sectionScores['institutionStructure'] = { total: required.length, filled };
  }

  // 3. Website Requirements
  if (isSectionApplicable('websiteRequirements', productId)) {
    const web = data.websiteRequirements || ({} as any);
    let filled = 0;
    if (web.primaryPurpose && web.primaryPurpose.trim().length > 0) filled++;
    else missing.push('Website Requirements: Primary Purpose');
    if (Array.isArray(web.requiredPages) && web.requiredPages.length >= 3) filled++;
    else missing.push('Website Requirements: At least 3 required pages selected');
    sectionScores['websiteRequirements'] = { total: 2, filled };
  }

  // 4. CMS Requirements
  if (isSectionApplicable('cmsRequirements', productId)) {
    const cms = data.cmsRequirements || ({} as any);
    let filled = 0;
    if (Array.isArray(cms.managingRoles) && cms.managingRoles.length > 0) filled++;
    else missing.push('CMS Requirements: Content Managing Roles');
    if (Array.isArray(cms.contentCategories) && cms.contentCategories.length > 0) filled++;
    else missing.push('CMS Requirements: Content Categories');
    sectionScores['cmsRequirements'] = { total: 2, filled };
  }

  // 5. ERP Requirements
  if (isSectionApplicable('erpRequirements', productId)) {
    const erp = data.erpRequirements || ({} as any);
    let filled = 0;
    if (erp.studentManagementPriority) filled++;
    else missing.push('ERP Scope: Student Management Priority');
    if (erp.attendanceTrackingMode) filled++;
    else missing.push('ERP Scope: Attendance Tracking Mode');
    if (erp.feeStructureComplexity) filled++;
    else missing.push('ERP Scope: Fee Structure');
    if (erp.examGradingSystem) filled++;
    else missing.push('ERP Scope: Examination Grading System');
    sectionScores['erpRequirements'] = { total: 4, filled };
  }

  // 6. Portal Requirements
  if (isSectionApplicable('portalRequirements', productId)) {
    const portal = data.portalRequirements || ({} as any);
    let filled = 0;
    if (portal.parentPortalEnabled !== undefined) filled++;
    else missing.push('Portal Requirements: Parent Portal Configuration');
    if (Array.isArray(portal.parentNotificationChannels) && portal.parentNotificationChannels.length > 0) filled++;
    else missing.push('Portal Requirements: Parent Notification Channels');
    sectionScores['portalRequirements'] = { total: 2, filled };
  }

  // 7. Branding / Design
  if (isSectionApplicable('brandingDesign', productId)) {
    const brand = data.brandingDesign || ({} as any);
    let filled = 0;
    if (brand.hasHighResLogo !== undefined) filled++;
    else missing.push('Branding: Logo Availability Status');
    if (brand.preferredVisualTone) filled++;
    else missing.push('Branding: Preferred Visual Tone');
    sectionScores['brandingDesign'] = { total: 2, filled };
  }

  // 8. Domain Presence
  if (isSectionApplicable('domainPresence', productId)) {
    const dom = data.domainPresence || ({} as any);
    let filled = 0;
    if (dom.alreadyOwnsDomain !== undefined) filled++;
    else missing.push('Domain Presence: Domain Ownership Status');
    if (dom.alreadyOwnsDomain ? dom.existingDomainName : dom.preferredNewDomainName) filled++;
    else missing.push('Domain Presence: Domain Name');
    sectionScores['domainPresence'] = { total: 2, filled };
  }

  // 9. Existing Systems / Migration
  if (isSectionApplicable('existingSystemsMigration', productId)) {
    const mig = data.existingSystemsMigration || ({} as any);
    let filled = 0;
    if (mig.currentSystemType) filled++;
    else missing.push('Migration: Current System Type');
    sectionScores['existingSystemsMigration'] = { total: 1, filled };
  }

  // 10. Users & Access
  if (isSectionApplicable('usersAccess', productId)) {
    const usr = data.usersAccess || ({} as any);
    let filled = 0;
    if (usr.superAdminFullName && usr.superAdminFullName.trim().length > 0) filled++;
    else missing.push('Users & Access: Super Admin Name');
    if (usr.superAdminEmail && usr.superAdminEmail.trim().length > 0) filled++;
    else missing.push('Users & Access: Super Admin Email');
    if (usr.superAdminPhone && usr.superAdminPhone.trim().length > 0) filled++;
    else missing.push('Users & Access: Super Admin Phone');
    sectionScores['usersAccess'] = { total: 3, filled };
  }

  // 11. Media Assets
  if (isSectionApplicable('mediaAssets', productId)) {
    sectionScores['mediaAssets'] = { total: 1, filled: 1 };
  }

  // 12. Additional Requirements
  if (isSectionApplicable('additionalRequirements', productId)) {
    sectionScores['additionalRequirements'] = { total: 1, filled: 1 };
  }

  // Custom mandatory fields
  customFields.forEach((cf) => {
    if (cf.is_required) {
      const sectionKey = cf.section_key;
      if (sectionScores[sectionKey]) {
        sectionScores[sectionKey].total += 1;
        const val = (data as any)[sectionKey]?.[cf.field_key];
        if (val !== undefined && String(val).trim().length > 0) {
          sectionScores[sectionKey].filled += 1;
        } else {
          missing.push(`Custom Field (${cf.label}): Required`);
        }
      }
    }
  });

  let grandTotal = 0;
  let grandFilled = 0;
  const sectionPercentages = {} as Record<IntakeSectionKey, number>;

  applicableSections.forEach((s) => {
    const score = sectionScores[s.key] || { total: 1, filled: 0 };
    grandTotal += score.total;
    grandFilled += score.filled;
    sectionPercentages[s.key] = score.total > 0 ? Math.round((score.filled / score.total) * 100) : 100;
  });

  const percentage = grandTotal > 0 ? Math.round((grandFilled / grandTotal) * 100) : 0;
  const isSubmissionReady = missing.length === 0;

  return {
    percentage,
    sectionPercentages,
    missingFields: missing,
    isSubmissionReady,
  };
}
