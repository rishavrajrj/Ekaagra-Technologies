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
      legalInstitutionName: params.schoolName || '',
      displayName: params.schoolName || '',
      shortName: (params.schoolName || '').split(' ').map(w => w[0]).join('').slice(0, 6).toUpperCase(),
      schoolType: 'Co-Educational Day School',
      schoolCategory: 'Day School',
      board: 'CBSE',
      affiliationNumber: '',
      registrationNumber: '',
      establishmentYear: '2010',
      mediumOfInstruction: ['English', 'Hindi'],
      coEdStatus: 'co_ed',
      schoolLevel: ['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'],
      address: '',
      city: params.city || 'Motihari',
      district: params.city || 'East Champaran',
      state: params.state || 'Bihar',
      country: 'India',
      pin: '845401',
      officialEmail: params.contactEmail || '',
      officialPhone: params.contactPhone || '',
      whatsappNumber: params.contactPhone || '',
      emergencyContact: params.contactPhone || '',
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
        city: params.city || 'Motihari',
        district: params.city || 'East Champaran',
        state: params.state || 'Bihar',
        pin: '845401',
        contactPhone: params.contactPhone || '',
        contactEmail: params.contactEmail || '',
        operatingHours: '08:00 AM - 03:00 PM',
        facilities: ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Playground'],
        isMainCampus: true,
      },
    ],
    leadership: {
      principalName: '',
      principalDesignation: 'Principal',
      managementContactName: params.contactName || '',
      managementDesignation: 'Director / Management Committee Head',
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
      preferredVisualTone: 'modern_vibrant',
    },
    websiteRequirements: {
      primaryPurpose: 'Enhance school credibility, attract new admissions, and publish circulars.',
      requiredPages: [
        'Home',
        'About School',
        'Principal Message',
        'Academics',
        'Campus Facilities',
        'Photo & Video Gallery',
        'Notice Board',
        'Admissions Online Form',
        'Fee Information',
        'Contact Us',
        'Mandatory Disclosures',
      ],
      customPages: [],
      migrationNeededFromExisting: false,
      languagesRequired: ['English', 'Hindi'],
    },
    schoolContent: {
      aboutSchool: `${params.schoolName || 'Our school'} is dedicated to nurturing young minds with a blend of academic rigor, character building, and modern educational values.`,
      history: 'Established to provide accessible, high-standard modern education in the region.',
      philosophy: 'Holistic child development focusing on academic excellence, co-curricular skills, and ethical values.',
      teachingMethodology: 'Activity-based experiential learning integrated with modern audio-visual technology and personalized mentorship.',
      specialPrograms: 'Remedial coaching, competitive exam foundation, STEM robotics, and spoken English workshops.',
      uniqueSellingPoints: ['Experienced faculty', 'Safe campus', 'Modern smart classrooms', 'Individual student attention'],
    },
    institutionStructure: {
      isMultiCampus: false,
      currentAcademicSession: '2026-2027',
      sessionStartDate: '2026-04-01',
      sessionEndDate: '2027-03-31',
      classesOfferedFrom: 'Nursery',
      classesOfferedTo: 'Class 12',
      totalSectionsEstimated: 14,
      studentCapacityTotal: 600,
      teachingStaffCount: 30,
      nonTeachingStaffCount: 10,
      academicStreams: ['Science', 'Commerce', 'Arts / Humanities'],
      classes: [
        { name: 'Nursery', sortOrder: 1, sections: ['A'] },
        { name: 'LKG', sortOrder: 2, sections: ['A'] },
        { name: 'UKG', sortOrder: 3, sections: ['A'] },
        { name: 'Class 1', sortOrder: 4, sections: ['A', 'B'] },
        { name: 'Class 2', sortOrder: 5, sections: ['A', 'B'] },
        { name: 'Class 3', sortOrder: 6, sections: ['A', 'B'] },
        { name: 'Class 4', sortOrder: 7, sections: ['A', 'B'] },
        { name: 'Class 5', sortOrder: 8, sections: ['A', 'B'] },
        { name: 'Class 6', sortOrder: 9, sections: ['A', 'B'] },
        { name: 'Class 7', sortOrder: 10, sections: ['A', 'B'] },
        { name: 'Class 8', sortOrder: 11, sections: ['A', 'B'] },
        { name: 'Class 9', sortOrder: 12, sections: ['A', 'B'] },
        { name: 'Class 10', sortOrder: 13, sections: ['A', 'B'] },
        { name: 'Class 11', sortOrder: 14, sections: ['A'] },
        { name: 'Class 12', sortOrder: 15, sections: ['A'] },
      ],
      subjects: [
        { name: 'English', code: 'ENG', subjectType: 'theory', isElective: false },
        { name: 'Hindi', code: 'HIN', subjectType: 'theory', isElective: false },
        { name: 'Mathematics', code: 'MATH', subjectType: 'theory', isElective: false },
        { name: 'Science', code: 'SCI', subjectType: 'combined', isElective: false },
        { name: 'Social Science', code: 'SST', subjectType: 'theory', isElective: false },
        { name: 'Computer Science / IT', code: 'IT', subjectType: 'combined', isElective: false },
        { name: 'Sanskrit', code: 'SKT', subjectType: 'theory', isElective: true },
        { name: 'Physics', code: 'PHY', subjectType: 'combined', isElective: false },
        { name: 'Chemistry', code: 'CHEM', subjectType: 'combined', isElective: false },
        { name: 'Biology', code: 'BIO', subjectType: 'combined', isElective: true },
        { name: 'Physical Education', code: 'PED', subjectType: 'activity', isElective: true },
      ],
      departments: [
        { name: 'Science & Technology', headStaffName: 'Head of Science', description: 'Physics, Chemistry, Biology, IT' },
        { name: 'Mathematics', headStaffName: 'Head of Math', description: 'Primary and Secondary Mathematics' },
        { name: 'Languages & Humanities', headStaffName: 'Head of Languages', description: 'English, Hindi, Sanskrit, Social Science' },
        { name: 'Sports & Physical Education', headStaffName: 'Sports Director', description: 'Athletics, Yoga, Team Sports' },
      ],
    },
    staffFaculty: {
      bulkImportMode: false,
      estimatedTotalStaff: 40,
      teachingStaffCount: 30,
      nonTeachingStaffCount: 10,
      staffMembers: [],
    },
    studentConfig: {
      studentIdFormat: 'SCH-{{YEAR}}-{{ROLL}}',
      admissionNumberFormat: 'ADM-{{YEAR}}-{{NUM}}',
      rollNumberSystem: 'section_wise',
      houseSystemEnabled: true,
      houseNames: ['Red House (Tagore)', 'Blue House (Ashoka)', 'Green House (Raman)', 'Yellow House (Kalam)'],
      studentCategories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
      requiredStudentFields: ['Full Name', 'DOB', 'Gender', 'Blood Group', 'Father Name', 'Mother Name', 'Address', 'Phone'],
      requiredDocumentTypes: ['Birth Certificate', 'Transfer Certificate', 'Previous Marksheet', 'Aadhaar Card', 'Passport Photo'],
      migrationRequired: true,
      estimatedStudentCount: 500,
    },
    admissions: {
      admissionsOpen: true,
      targetSessions: '2026-2027',
      classesOpenForAdmission: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 6', 'Class 9', 'Class 11'],
      eligibilityCriteria: 'Age appropriate criteria as per NEP / Board guidelines; written assessment for Class 6 and above.',
      applicationFee: 500,
      admissionFee: 5000,
      contactPerson: params.contactName || 'Admission Incharge',
      admissionPhone: params.contactPhone || '',
      admissionEmail: params.contactEmail || '',
      officeHours: '09:00 AM - 02:00 PM (Monday to Saturday)',
      onlineEnquiryEnabled: true,
      onlineApplicationEnabled: true,
      documentUploadEnabled: true,
      applicationTrackingEnabled: true,
      interviewSchedulingEnabled: true,
    },
    feesConfiguration: {
      feeCategories: ['Tuition Fee', 'Admission Fee', 'Annual Development Fee', 'Exam Fee', 'Computer Fee'],
      classFeeStructures: [
        { className: 'Primary (Class 1-5)', feeType: 'Tuition Fee', amount: 1500, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Middle (Class 6-8)', feeType: 'Tuition Fee', amount: 1800, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Secondary (Class 9-10)', feeType: 'Tuition Fee', amount: 2200, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
        { className: 'Senior Secondary (Class 11-12)', feeType: 'Tuition Fee', amount: 2800, frequency: 'monthly', dueDateDay: 10, lateFeePerDay: 10 },
      ],
      onlineFeePaymentRequired: true,
      feeReceiptsAutomated: true,
      parentLedgerHistoryEnabled: true,
      dueRemindersEnabled: true,
    },
    attendanceConfig: {
      studentAttendanceMode: 'daily',
      staffAttendanceMode: 'biometric',
      lateArrivalTracking: true,
      leaveManagementEnabled: true,
      parentAbsenceNotification: 'whatsapp',
      workingDays: [1, 2, 3, 4, 5, 6],
    },
    examinationConfig: {
      examTypes: ['Periodic Assessment 1', 'Term 1 Exam', 'Periodic Assessment 2', 'Annual Final Exam'],
      terms: ['Term 1 (April - September)', 'Term 2 (October - March)'],
      gradingSystem: 'cbse_9point',
      hasInternalAssessment: true,
      hasPracticalMarks: true,
      reportCardLayout: 'cbse_standard',
      resultPublishVisibility: 'parent_portal',
    },
    timetableConfig: {
      workingDaysPerWeek: 6,
      schoolStartTime: '08:00 AM',
      schoolEndTime: '02:00 PM',
      periodCount: 8,
      periodDurationMinutes: 40,
      breakDurationMinutes: 15,
      lunchDurationMinutes: 30,
      assemblyDurationMinutes: 20,
      timetableAutomationNeeded: true,
    },
    communicationConfig: {
      channelsRequired: ['Notice Board', 'WhatsApp Alerts', 'SMS Broadcast', 'Email Newsletters'],
      parentCommunicationEnabled: true,
      staffCommunicationEnabled: true,
      emergencyAnnouncementsEnabled: true,
    },
    cmsRequirements: {
      managingRoles: ['Principal', 'Vice-Principal', 'Computer Teacher', 'Office Admin'],
      estimatedCmsUsers: 4,
      requiresApprovalBeforePublish: true,
      contentCategories: ['Notices & Circulars', 'Photo Gallery', 'Events Calendar', 'School News', 'Achievements'],
    },
    facilitiesConfig: {
      availableFacilities: [
        { name: 'Smart Classrooms', description: 'Interactive smart panels and digital multimedia curriculum in all classes.', isWebsiteVisible: true },
        { name: 'Computer Laboratory', description: 'High-speed internet networked computer lab with latest software.', isWebsiteVisible: true },
        { name: 'Composite Science Lab', description: 'Fully equipped Physics, Chemistry, and Biology demonstration stations.', isWebsiteVisible: true },
        { name: 'Modern Library', description: 'Well-stocked library with reference books, fiction, periodicals, and quiet reading room.', isWebsiteVisible: true },
        { name: 'Sports Grounds', description: 'Football field, cricket practice nets, basketball court, and athletic track.', isWebsiteVisible: true },
        { name: 'Auditorium / Multipurpose Hall', description: 'Large capacity acoustic auditorium for cultural events and seminars.', isWebsiteVisible: true },
        { name: 'Infirmary / Medical Room', description: 'First-aid room with visiting doctor and trained health attendant.', isWebsiteVisible: true },
      ],
    },
    transportConfig: {
      enabled: false,
      routesCount: 4,
      vehiclesCount: 4,
      routes: [],
      gpsTrackingRequired: false,
      parentGpsVisibility: false,
    },
    hostelConfig: {
      enabled: false,
      hostelNames: [],
    },
    libraryConfig: {
      enabled: false,
      bookCountEstimate: 2000,
      categories: ['Textbooks', 'Reference Books', 'Children Fiction', 'Magazines', 'General Knowledge'],
      issueReturnTrackingNeeded: true,
      barcodeScannerIntegration: false,
    },
    documentsDownloads: {
      documentsChecklist: [
        'School Prospectus (PDF)',
        'Admission Registration Form',
        'Academic Calendar 2026-2027',
        'Fee Schedule Circular',
        'CBSE Mandatory Public Disclosure (OASIS / SARAS)',
      ],
    },
    mediaGallery: {
      albums: ['Campus Infrastructure', 'Annual Sports Meet', 'Science Exhibition', 'Independence Day Celebration', 'Annual Day Cultural Evening'],
      hasCampusPhotos: true,
      hasEventPhotos: true,
      youtubeChannelUrl: '',
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      youtube: '',
      twitter: '',
      linkedin: '',
    },
    domainPresence: {
      alreadyOwnsDomain: false,
      preferredNewDomainName: params.domainRequirement || '',
      dnsManagementAccessAvailable: false,
      officialEmailDomainNeeded: true,
      schoolEmailProvider: 'google_workspace',
      socialMediaLinks: {},
    },
    seoConfig: {
      seoSchoolTitle: `${params.schoolName || 'School'} | Best School in ${params.city || 'Motihari'}`,
      seoMetaDescription: `Admissions open at ${params.schoolName || 'our school'} in ${params.city || 'Motihari'}. Leading CBSE-affiliated institution with modern smart campus and outstanding academics.`,
      targetKeywords: `best school in ${params.city || 'motihari'}, top cbse school, school admission ${params.city || 'motihari'}`,
      cityAndDistrictKeywords: `${params.city || 'Motihari'}, ${params.state || 'Bihar'}`,
      analyticsRequired: true,
    },
    integrationsConfig: {
      paymentGateway: 'razorpay',
      smsGateway: 'msg91',
      whatsappProvider: 'meta_cloud_api',
      biometricAttendanceSync: true,
      accountingSoftware: 'tally',
    },
    existingSystemsMigration: {
      currentSystemType: 'excel_spreadsheets',
      migrateStudentRecords: true,
      migrateStaffRecords: false,
      migrateHistoricalFeeLedgers: false,
      estimatedStudentRecordsToImport: 450,
      migrationReadinessStatus: 'needs_formatting_help',
    },
    userRolesConfig: {
      requiredRoles: ['Super Admin', 'Principal', 'School Admin', 'Teacher', 'Accountant', 'Receptionist', 'Parent', 'Student'],
    },
    securityPrivacy: {
      require2FAForAdmin: true,
      parentStudentRoleSeparation: true,
      auditLogsRetentionMonths: 24,
      automatedDailyBackup: true,
    },
    designReferences: {
      preferredVisualTone: 'modern_innovative',
      referenceWebsites: '',
      dislikedWebsites: '',
      specialDesignNotes: 'Clean, fast-loading, mobile-friendly design with clear admission call-to-actions.',
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
    usersAccess: {
      superAdminFullName: params.contactName || '',
      superAdminEmail: params.contactEmail || '',
      superAdminPhone: params.contactPhone || '',
      initialStaffLoginsCountEstimate: 5,
    },
    additionalRequirements: {
      specialCustomWorkflows: '',
      customReportsRequired: '',
      generalCommentsOrQuestions: '',
    },
    clientConfirmation: {
      confirmedByName: params.contactName || '',
      confirmedByDesignation: 'School Authority / Representative',
      confirmedByEmail: params.contactEmail || '',
      confirmedByPhone: params.contactPhone || '',
      isConfirmed: false,
      confirmedAt: '',
      declarationStatement: 'I confirm that the information provided is accurate to the best of my knowledge and represents the requirements for our school website/software project.',
    },
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
