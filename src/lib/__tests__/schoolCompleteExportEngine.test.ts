/**
 * ==============================================================================
 * TEST SUITE: Complete School Project Technical Export Engine
 * File: src/lib/__tests__/schoolCompleteExportEngine.test.ts
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert';
import JSZip from 'jszip';
import type {
  UniversalIntakeData,
  SchoolProject,
  SchoolIntakeSubmission,
} from '../types';
import {
  exportCompleteSchoolProjectZip,
  sanitizeExportData,
  sanitizeZipFileName,
  countSubmissionFormFields,
  collectAllExportAssets,
  type ExportProgressStep,
  type ExportAssetCandidate,
} from '../schoolCompleteExportEngine';

function createFullSampleIntakeData(): UniversalIntakeData {
  return {
    schoolProfile: {
      schoolName: 'SparkNest International School',
      name: 'SparkNest International School',
      establishedYear: 2012,
      schoolType: 'Day & Residential School',
      board: 'CBSE',
      affiliationNumber: 'CBSE-AFF-998877',
      mediumOfInstruction: ['English', 'Hindi'],
      officialEmail: 'admissions@sparknest.edu.in',
      officialPhone: '+91 9876543210',
      alternatePhone: '+91 9876543211',
      websiteUrl: 'https://sparknest.edu.in',
      registeredAddress: 'Sector 42, Knowledge Park, Gurugram, Haryana - 122001',
      administrativeContacts: [
        { name: 'Dr. Ananya Sharma', designation: 'Director', phone: '+91 9876543212', email: 'ananya@sparknest.edu.in' }
      ],
      tagline: 'Empowering Minds, Inspiring Futures',
    } as any,
    campuses: [
      {
        id: 'campus-main',
        name: 'Main Senior Campus',
        isMain: true,
        address: 'Sector 42, Knowledge Park, Gurugram',
        city: 'Gurugram',
        state: 'Haryana',
        pincode: '122001',
        phone: '+91 9876543210',
        email: 'main@sparknest.edu.in',
        images: [
          {
            id: 'campus-img-1',
            fileName: 'campus-main-building.jpg',
            caption: 'Main Academic Building and Front Plaza',
            category: 'campus_buildings',
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
            fileSize: 1024,
          } as any,
        ],
      },
    ],
    leadership: {
      principalName: 'Father Dr. Augustine Joseph',
      principalDesignation: 'Principal & Academic Director',
      principalQualification: 'Ph.D in Educational Leadership, M.Ed',
      principalMessage: 'Welcome to SparkNest, where excellence meets compassion.',
      principalDeskMessageSource: 'custom',
      principalPhoto: {
        id: 'lead-augustine-photo',
        url: 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
        fileName: 'principal-portrait.webp',
        mimeType: 'image/webp',
        optimizedSize: 2048,
        caption: 'Portrait of Father Dr. Augustine Joseph',
      } as any,
      managementMembers: [
        {
          id: 'mgmt-1',
          name: 'Col. Rajesh Verma',
          designation: 'Managing Trustee',
          photo: {
            url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
            fileName: 'trustee-verma.jpg',
          } as any,
        },
      ],
    },
    brandingDesign: {
      hasHighResLogo: true,
      logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      logoFileName: 'sparknest-crest-logo.png',
      crestUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      faviconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      primaryColor: '#1e3a8a',
      secondaryColor: '#0284c7',
      accentColor: '#f59e0b',
      fontFamilyPreference: 'Plus Jakarta Sans',
      taglineOrMotto: 'Inspiring Futures',
      motto: 'Knowledge is Light',
      visionStatement: 'To foster intellectual curiosity and ethical leadership.',
      missionStatement: 'Providing world-class holistic education.',
      coreValues: ['Integrity', 'Excellence', 'Empathy', 'Innovation'],
      brandTone: 'Academic & Prestigious',
      preferredWebsiteStyle: 'Modern & Vibrant',
      preferredVisualTone: 'modern_vibrant',
    },
    institutionStructure: {
      currentAcademicSession: '2026-2027',
      sessionStartDate: '2026-04-01',
      sessionEndDate: '2027-03-31',
      classesOfferedFrom: 'Nursery',
      classesOfferedTo: 'Class 12',
      namingConvention: 'Class',
      totalSectionsEstimated: 24,
      studentCapacityTotal: 1200,
      teachingStaffCount: 65,
      nonTeachingStaffCount: 25,
      academicStreams: ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Humanities'],
      classes: [
        {
          classId: 'cls-10',
          className: 'Class 10',
          gradeLevel: 10,
          stage: 'Secondary',
          capacityPerSection: 35,
          sections: [
            { sectionId: 'sec-10a', sectionName: 'A', capacity: 35 },
            { sectionId: 'sec-10b', sectionName: 'B', capacity: 35 },
          ],
        } as any,
      ],
      subjects: [
        { code: 'MATH-10', name: 'Mathematics', type: 'Core', creditHours: 5, isOptional: false },
        { code: 'SCI-10', name: 'Science', type: 'Core', creditHours: 5, isOptional: false },
      ] as any,
      subjectApplicability: [
        { classId: 'cls-10', subjectCode: 'MATH-10', isCompulsory: true },
      ] as any,
    },
    admissions: {
      status: 'open',
      session: '2026-2027',
      applicationStartDate: '2026-09-01',
      applicationEndDate: '2026-12-31',
      classesOpenForAdmission: ['Nursery', 'KG', 'Class 1', 'Class 6', 'Class 11'],
      contact: {
        person: 'Mrs. Ritu Chawla',
        phone: '+91 9876543220',
        email: 'admissions.desk@sparknest.edu.in',
        officeHours: '09:00 AM - 03:00 PM',
      },
      eligibility: {
        minAge: '3 years for Nursery',
        criteriaNotes: 'Birth certificate and transfer certificate required.',
      } as any,
      process: [
        { stepNumber: 1, title: 'Online Enquiry & Registration' },
        { stepNumber: 2, title: 'Campus Visit & Interactive Session' },
        { stepNumber: 3, title: 'Document Verification & Fee Deposit' },
      ] as any,
      documents: [
        { documentName: 'Student Birth Certificate', isMandatory: true },
        { documentName: 'Previous Year Report Card', isMandatory: false },
      ] as any,
    },
    feesConfiguration: {
      academicSession: '2026-2027',
      currency: 'INR',
      commonFees: [
        { id: 'fee-tuition', name: 'Tuition Fee (Quarterly)', category: 'Tuition', amount: 24000, frequency: 'quarterly', studentType: 'both', applicableClasses: 'all' },
        { id: 'fee-admission', name: 'One-Time Admission Fee', category: 'Other', amount: 35000, frequency: 'one_time', studentType: 'new_only', applicableClasses: 'all', isAdmissionOnly: true },
      ],
      paymentPlans: [
        { frequency: 'quarterly', isEnabled: true },
        { frequency: 'yearly', isEnabled: true, yearlyDiscountPercentage: 5 },
      ],
    } as any,
    facilitiesConfig: {
      facilities: {
        smart_classrooms: { name: 'Smart Classrooms', isAvailable: true, count: 32, features: ['Interactive Panels', 'High-speed Wi-Fi'] },
        science_lab: { name: 'Composite Science Laboratories', isAvailable: true, count: 3, features: ['Physics Lab', 'Chemistry Lab', 'Biology Lab'] },
        sports_playground: { name: 'Athletic Grounds', isAvailable: true, features: ['Football Field', 'Basketball Court', 'Running Track'] },
      },
      campusAreaSqFt: 217800, // 5 acres
    } as any,
    websiteRequirements: {
      requiredPages: ['Home', 'About School', 'Academics', 'Admissions', 'Fee Structure', 'Campus Facilities', 'Contact Us'],
      privacyPolicyConfig: {
        schoolName: 'SparkNest International School',
        effectiveDate: '2026-04-01',
        studentDataProtectionPolicy: 'Strict adherence to DPDP Act 2023.',
      } as any,
    },
    schoolContent: {
      aboutSchool: {
        text: 'SparkNest International School is a premier day-cum-boarding institution committed to holistic child development.',
      } as any,
      keyAchievements: ['Ranked #1 Day-Boarding School in District', '100% CBSE Board Pass Rate'],
      faqItems: [
        { question: 'What is the student-teacher ratio?', answer: 'We maintain a 15:1 student-to-educator ratio.' }
      ],
    },
    legalPolicies: {
      societyOrTrustName: 'SparkNest Educational and Charitable Trust',
      registrationNumber: 'TRUST-DEL-2011-8876',
      mandatoryPublicDisclosures: [
        { title: 'Affiliation Status Letter', documentUrl: 'https://sparknest.edu.in/docs/affiliation.pdf' }
      ],
      policies: {
        terms: 'Standard terms of educational admission and campus conduct.',
        privacy: { title: 'Parent & Student Privacy Policy', summary: 'Student records are encrypted.' },
      },
    } as any,
    assetChecklist: {
      items: [
        {
          id: 'cert-affiliation',
          title: 'Board Affiliation Grant Letter',
          category: 'certificates',
          requirement: 'required',
          isPublicationBlocker: true,
          status: 'provided',
          fileName: 'CBSE-Affiliation-Letter.pdf',
          fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE0NF0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTEzIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTcwCiUlRU9GCg==',
          fileSize: 220,
        },
        {
          id: 'cert-recognition',
          title: 'State Education Department NOC',
          category: 'certificates',
          requirement: 'required',
          isPublicationBlocker: true,
          status: 'provided',
          fileName: 'Govt-NOC-Recognition.pdf',
          fileUrl: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE0NF0+PmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1NiAwMDAwMCBuIAowMDAwMDAwMTEzIDAwMDAwIG4gCnRyYWlsZXIKPDwvU2l6ZSA0L1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTcwCiUlRU9GCg==',
          fileSize: 220,
        },
      ],
    },
    usersAccess: {
      primaryAdminName: 'Dr. Ananya Sharma',
      primaryAdminEmail: 'ananya@sparknest.edu.in',
    } as any,
    clientConfirmation: {
      isConfirmed: true,
      confirmedByName: 'Father Dr. Augustine Joseph',
      confirmedByRole: 'Principal',
      confirmedAt: '2026-09-12T12:00:00.000Z',
    },
    attendanceConfig: {
      attendanceMode: 'daily_and_subject',
      holidays: ['2026-08-15'],
      workingHours: '08:00 - 14:30',
    } as any,
    examinationConfig: {
      gradingSystem: 'cbse_grading',
      terms: ['Term 1', 'Term 2'],
      reportCardTemplate: 'cbse_standard',
    } as any,
    timetableConfig: {
      periodsPerDay: 8,
      periodDurationMinutes: 40,
      breakDurationMinutes: 30,
    } as any,
    transportConfig: {
      busRoutesCount: 12,
      fleetSize: 15,
      gpsTrackingEnabled: true,
      cctvInBuses: true,
    } as any,
    libraryConfig: {
      totalBooks: 8500,
      hasDigitalOpac: true,
      circulationSystem: 'rfid_automated',
    } as any,
    hostelConfig: {
      totalCapacity: 250,
      buildingsCount: 2,
      wardenAssigned: true,
      messFacility: true,
    } as any,
    cmsRequirements: {
      editorialWorkflow: 'review_required',
      allowDirectPublish: false,
    } as any,
    domainPresence: {
      domainName: 'sparknest.edu.in',
      registrar: 'GoDaddy',
      dnsProvider: 'Cloudflare',
    } as any,
    existingSystemsMigration: {
      currentSystem: 'Legacy Desktop Software',
      recordsToMigrate: ['students', 'fee_history'],
    } as any,
    integrationsConfig: {
      paymentGateway: 'Razorpay',
      smsProvider: 'Twilio',
      biometricDevices: 'eSSL',
    } as any,
    mobileAppConfig: {
      platforms: ['android', 'ios'],
      targetAudiences: ['parents', 'teachers'],
      pushNotificationsEnabled: true,
    } as any,
    securityPrivacy: {
      dataRetentionYears: 7,
      dpdpCompliant: true,
      rbacEnabled: true,
    } as any,
    portalRequirements: {
      studentPortalEnabled: true,
      parentPortalEnabled: true,
      facultyPortalEnabled: true,
    } as any,
    mediaAssets: {
      governance: {
        schoolOwnershipConfirmed: true,
        thirdPartyLicensingCleared: true,
        studentPhotoConsentPolicyConfirmed: true,
        staffPhotoConsentPolicyConfirmed: true,
      },
    } as any,
    erpRequirements: {
      studentManagementPriority: 'high',
      attendanceTrackingMode: 'daily',
      feeStructureComplexity: 'simple_quarterly',
      examGradingSystem: 'cbse_grading',
      tcCertificateAutomated: true,
      idCardPrintingNeeded: true,
      transportModuleNeeded: true,
      libraryModuleNeeded: true,
      hostelModuleNeeded: true,
      cafeteriaModuleNeeded: false,
    } as any,
    additionalRequirements: {
      customRequests: ['Biometric sync with attendance module'],
      notes: 'Deliver staging before final launch',
    },
    projectDelivery: {
      targetLaunchTimeline: 'standard_45_days',
      deliveryPriority: 'standard',
    } as any,
  };
}

function createSampleProject(): SchoolProject {
  return {
    id: 'proj-sparknest-001',
    project_number: 'SCH-2026-5277',
    domain: 'SCHOOL',
    source: 'SCHOOL_ONBOARDING',
    lead_reference: 'LEAD-2026-001',
    source_system: 'EKAAGRA_WEBSITE',
    school_name: 'SparkNest International School',
    product_id: 'school-complete',
    status: 'APPROVED',
    media_status: 'COMPLETE',
    completeness_percentage: 100,
    primary_contact_name: 'Dr. Ananya Sharma',
    primary_contact_email: 'ananya@sparknest.edu.in',
    primary_contact_phone: '+91 9876543212',
    primary_contact_designation: 'Director',
    city: 'Gurugram',
    state: 'Haryana',
    domain_requirement: 'sparknest.edu.in',
    commercial_summary: { plan: 'Complete Enterprise' },
    metadata: { reviewCompleted: true } as any,
    created_at: '2026-09-10T10:00:00Z',
    updated_at: '2026-09-12T12:00:00Z',
  };
}

function createSampleSubmission(intakePayload: UniversalIntakeData): SchoolIntakeSubmission {
  return {
    id: 'sub-sparknest-v8',
    school_project_id: 'proj-sparknest-001',
    version_number: 8,
    is_current: true,
    submitted_by_name: 'Father Dr. Augustine Joseph',
    submitted_by_email: 'augustine@sparknest.edu.in',
    submitted_at: '2026-09-12T12:30:00Z',
    change_summary: 'Final institutional sign-off and document verification',
    intake_payload: intakePayload,
    custom_fields_data: { customFieldTestKey: 'Custom Value' },
    completeness_percentage: 100,
    status: 'APPROVED',
    created_at: '2026-09-12T12:30:00Z',
  };
}

// ─── TESTS ───────────────────────────────────────────────────────────────────

test('COMPLETE EXPORT: generates structured ZIP with all 12 sections, manifest, and README', async () => {
  const intakeData = createFullSampleIntakeData();
  const project = createSampleProject();
  const submission = createSampleSubmission(intakeData);

  const progressSteps: ExportProgressStep[] = [];

  const result = await exportCompleteSchoolProjectZip({
    project,
    submission,
    intakePayload: intakeData,
    onProgress: (step) => progressSteps.push(step),
  });

  assert.ok(result.zipBlob, 'ZIP Blob must be generated');
  assert.ok(result.zipBlob.size > 0, 'ZIP Blob must not be empty');
  assert.strictEqual(result.folderName, 'SCH-2026-5277');

  // Verify progress states followed prompt sequence
  assert.ok(progressSteps.includes('Preparing submission...'));
  assert.ok(progressSteps.includes('Collecting form data...'));
  assert.ok(progressSteps.includes('Collecting website configuration...'));
  assert.ok(progressSteps.includes('Building manifest...'));
  assert.ok(progressSteps.includes('Creating ZIP...'));
  assert.ok(progressSteps.includes('Export complete.'));

  // Load and inspect ZIP entries
  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = 'SCH-2026-5277/';

  // 1. Root files
  assert.ok(zip.file(`${prefix}README.md`), 'Root README.md must exist');
  assert.ok(zip.file(`${prefix}manifest.json`), 'Root manifest.json must exist');
  assert.ok(zip.file(`${prefix}submission.json`), 'Root submission.json must exist');
  assert.ok(zip.file(`${prefix}project.json`), 'Root project.json must exist');

  // 2. School Profile
  assert.ok(zip.file(`${prefix}school-profile/school-profile.json`));
  assert.ok(zip.file(`${prefix}school-profile/campuses.json`));
  assert.ok(zip.file(`${prefix}school-profile/contact-information.json`));
  assert.ok(zip.file(`${prefix}school-profile/institutional-details.json`));

  // 3. Academics
  assert.ok(zip.file(`${prefix}academics/academic-structure.json`));
  assert.ok(zip.file(`${prefix}academics/classes.json`));
  assert.ok(zip.file(`${prefix}academics/sections.json`));
  assert.ok(zip.file(`${prefix}academics/subjects.json`));
  assert.ok(zip.file(`${prefix}academics/subject-catalog.json`));
  assert.ok(zip.file(`${prefix}academics/curriculum.json`));
  assert.ok(zip.file(`${prefix}academics/class-wise-curriculum.json`));

  // 4. Admissions
  assert.ok(zip.file(`${prefix}admissions/admissions.json`));
  assert.ok(zip.file(`${prefix}admissions/eligibility.json`));
  assert.ok(zip.file(`${prefix}admissions/admission-process.json`));
  assert.ok(zip.file(`${prefix}admissions/required-documents.json`));

  // 5. Fees
  assert.ok(zip.file(`${prefix}fees/fee-structure.json`));
  assert.ok(zip.file(`${prefix}fees/fee-categories.json`));
  assert.ok(zip.file(`${prefix}fees/payment-information.json`));

  // 6. Facilities
  assert.ok(zip.file(`${prefix}facilities/facilities.json`));
  assert.ok(zip.file(`${prefix}facilities/infrastructure.json`));
  assert.ok(zip.file(`${prefix}facilities/facility-details.json`));

  // 7. Website
  assert.ok(zip.file(`${prefix}website/website-content.json`));
  assert.ok(zip.file(`${prefix}website/pages.json`));
  assert.ok(zip.file(`${prefix}website/navigation.json`));
  assert.ok(zip.file(`${prefix}website/sections.json`));
  assert.ok(zip.file(`${prefix}website/seo.json`));
  assert.ok(zip.file(`${prefix}website/branding.json`));
  assert.ok(zip.file(`${prefix}website/theme.json`));
  assert.ok(zip.file(`${prefix}website/colors.json`));
  assert.ok(zip.file(`${prefix}website/typography.json`));
  assert.ok(zip.file(`${prefix}website/layout.json`));
  assert.ok(zip.file(`${prefix}website/design-config.json`));

  // 8. Legal
  assert.ok(zip.file(`${prefix}legal/legal-information.json`));
  assert.ok(zip.file(`${prefix}legal/policies.json`));
  assert.ok(zip.file(`${prefix}legal/terms.json`));
  assert.ok(zip.file(`${prefix}legal/privacy-policy.json`));
  assert.ok(zip.file(`${prefix}legal/declarations.json`));
  assert.ok(zip.file(`${prefix}legal/statutory-information.json`));

  // 9. Technical
  assert.ok(zip.file(`${prefix}technical/field-mapping.json`));
  assert.ok(zip.file(`${prefix}technical/submission-schema.json`));
  assert.ok(zip.file(`${prefix}technical/asset-manifest.json`));
  assert.ok(zip.file(`${prefix}technical/export-metadata.json`));

  // 10. Verify Manifest contents
  const manifestJson = JSON.parse(await zip.file(`${prefix}manifest.json`)!.async('text'));
  assert.strictEqual(manifestJson.exportVersion, '2.0');
  assert.strictEqual(manifestJson.projectId, 'SCH-2026-5277');
  assert.strictEqual(manifestJson.schoolName, 'SparkNest International School');
  assert.strictEqual(manifestJson.submissionVersion, 'v8');
  assert.strictEqual(manifestJson.status, 'APPROVED');
  assert.ok(manifestJson.statistics.formFields > 20);
  assert.ok(manifestJson.statistics.uploadedFiles > 0);
  assert.ok(manifestJson.statistics.websitePages > 0);
});

test('BINARY ASSET BUNDLING: actual binary files are embedded in media/ and documents/', async () => {
  const intakeData = createFullSampleIntakeData();
  const project = createSampleProject();
  const submission = createSampleSubmission(intakeData);

  const result = await exportCompleteSchoolProjectZip({
    project,
    submission,
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = 'SCH-2026-5277/';

  // Check binary logo exists in media/logo/
  const logoFile = zip.file(`${prefix}media/logo/sparknest-crest-logo.png`);
  assert.ok(logoFile, 'media/logo/sparknest-crest-logo.png must be present');
  const logoBytes = await logoFile.async('uint8array');
  assert.ok(logoBytes.length > 0, 'Binary logo bytes must not be empty');

  // Check binary principal photo in media/staff/
  const principalPhoto = zip.file(`${prefix}media/staff/principal-portrait.webp`);
  assert.ok(principalPhoto, 'media/staff/principal-portrait.webp must be present');
  const photoBytes = await principalPhoto.async('uint8array');
  assert.ok(photoBytes.length > 0, 'Principal photo bytes must not be empty');

  // Check binary affiliation certificate in documents/certificates/
  const certFile = zip.file(`${prefix}documents/certificates/CBSE-Affiliation-Letter.pdf`);
  assert.ok(certFile, 'documents/certificates/CBSE-Affiliation-Letter.pdf must be present');
  const certBytes = await certFile.async('uint8array');
  assert.ok(certBytes.length > 0, 'Affiliation certificate binary must not be empty');
  // Check PDF signature: %PDF- (0x25, 0x50, 0x44, 0x46)
  assert.strictEqual(certBytes[0], 0x25);
  assert.strictEqual(certBytes[1], 0x50);
  assert.strictEqual(certBytes[2], 0x44);
  assert.strictEqual(certBytes[3], 0x46);

  // Check asset manifest links
  const assetManifestJson = JSON.parse(await zip.file(`${prefix}technical/asset-manifest.json`)!.async('text'));
  assert.ok(Array.isArray(assetManifestJson));
  const logoEntry = assetManifestJson.find((a: any) => a.id === 'brand-logo');
  assert.ok(logoEntry, 'Asset manifest must have brand-logo entry');
  assert.strictEqual(logoEntry.exportPath, 'media/logo/sparknest-crest-logo.png');
  assert.strictEqual(logoEntry.sourceField, 'brandingDesign.logoUrl');

  const certEntry = assetManifestJson.find((a: any) => a.id === 'cert-affiliation');
  assert.ok(certEntry, 'Asset manifest must have cert-affiliation entry');
  assert.strictEqual(certEntry.exportPath, 'documents/certificates/CBSE-Affiliation-Letter.pdf');
});

test('DUPLICATE FILENAMES: handles collisions cleanly without overwriting', async () => {
  const intakeData = createFullSampleIntakeData();
  // Introduce duplicate filename in assets
  intakeData.campuses = [
    {
      id: 'c1',
      name: 'Campus 1',
      images: [
        {
          id: 'img-1',
          fileName: 'photo.jpg',
          category: 'campus_buildings',
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
        } as any,
        {
          id: 'img-2',
          fileName: 'photo.jpg', // DUPLICATE NAME
          category: 'campus_buildings',
          url: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/bAAgBAQABPxA=',
        } as any,
      ],
    } as any,
  ];

  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = 'SCH-2026-5277/';

  // First photo
  assert.ok(zip.file(`${prefix}media/campus/photo.jpg`), 'First photo.jpg must exist');
  // Second collision photo renamed cleanly with suffix
  assert.ok(zip.file(`${prefix}media/campus/photo-2.jpg`), 'Second collision must be named photo-2.jpg');
});

test('SECURITY: strictly redacts tokens, passwords, and sensitive internal secrets', () => {
  const dirtyData = {
    schoolName: 'Public Academy',
    adminPassword: 'SecretPassword123!',
    user_token: 'auth_tok_abcdef123456',
    token_hash: 'sha256_hash_here',
    api_key: 'sk_live_private_key_value',
    sessionData: {
      session_id: 'sess_123',
      valid: true,
    },
    nested: {
      legitimateInfo: 'Safe Value',
      service_role_secret: 'super_secret',
    },
    classesList: ['Class 1', 'Class 2'],
  };

  const clean = sanitizeExportData(dirtyData);

  assert.strictEqual((clean as any).schoolName, 'Public Academy');
  assert.strictEqual((clean as any).adminPassword, undefined, 'adminPassword must be scrubbed');
  assert.strictEqual((clean as any).user_token, undefined, 'user_token must be scrubbed');
  assert.strictEqual((clean as any).token_hash, undefined, 'token_hash must be scrubbed');
  assert.strictEqual((clean as any).api_key, undefined, 'api_key must be scrubbed');
  assert.strictEqual((clean as any).sessionData, undefined, 'sessionData must be scrubbed');
  assert.strictEqual((clean as any).nested.legitimateInfo, 'Safe Value');
  assert.strictEqual((clean as any).nested.service_role_secret, undefined, 'service_role_secret must be scrubbed');
  assert.deepStrictEqual((clean as any).classesList, ['Class 1', 'Class 2']);
});

test('FILENAME SANITIZATION: strips traversal and illegal filesystem characters', () => {
  assert.strictEqual(sanitizeZipFileName('../../secret.pdf'), 'secret.pdf');
  assert.strictEqual(sanitizeZipFileName('doc:with*illegal?chars.pdf'), 'doc_with_illegal_chars.pdf');
  assert.strictEqual(sanitizeZipFileName('normal-certificate.pdf'), 'normal-certificate.pdf');
  assert.strictEqual(sanitizeZipFileName(''), 'asset');
});

test('STRICT ERROR HANDLING: fails fast with clear error when an asset cannot be resolved', async () => {
  const intakeData = createFullSampleIntakeData();
  // Corrupt an asset URL to non-resolvable URL
  intakeData.brandingDesign.logoUrl = 'https://non-existent-domain-404-fake.com/logo.png';

  await assert.rejects(
    async () => {
      await exportCompleteSchoolProjectZip({
        project: createSampleProject(),
        submission: createSampleSubmission(intakeData),
        intakePayload: intakeData,
      });
    },
    (err: Error) => {
      assert.ok(err.message.includes('Failed to download uploaded asset'));
      assert.ok(err.message.includes('Official School Logo'));
      return true;
    }
  );
});

test('ZIP INTEGRITY & JSON VALIDITY: all files listed in manifest exist and parse as valid JSON', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const manifestFile = zip.file(`${prefix}manifest.json`);
  assert.ok(manifestFile, 'manifest.json must exist');
  const manifest = JSON.parse(await manifestFile.async('text'));

  for (const relativePath of manifest.files) {
    const file = zip.file(`${prefix}${relativePath}`);
    assert.ok(file, `File listed in manifest must exist in archive: ${relativePath}`);

    // If JSON file, ensure it parses cleanly without syntax error
    if (relativePath.endsWith('.json')) {
      const content = await file.async('text');
      assert.doesNotThrow(() => JSON.parse(content), `JSON file must parse cleanly: ${relativePath}`);
    }
  }
});

test('DATA PRESERVATION: nested data, arrays, and repeaters maintain types and structures', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  // 1. Check classes.json structure
  const classesData = JSON.parse(await zip.file(`${prefix}academics/classes.json`)!.async('text'));
  assert.ok(Array.isArray(classesData.classes));
  assert.strictEqual(classesData.classes[0].className, 'Class 10');
  assert.strictEqual(classesData.classes[0].gradeLevel, 10);
  assert.strictEqual(classesData.classes[0].sectionsCount, 2);

  // 2. Check sections.json structure
  const sectionsData = JSON.parse(await zip.file(`${prefix}academics/sections.json`)!.async('text'));
  assert.ok(Array.isArray(sectionsData.classesWithSections[0].sections));
  assert.strictEqual(sectionsData.classesWithSections[0].sections[0].sectionName, 'A');

  // 3. Check fee-structure.json types
  const feeData = JSON.parse(await zip.file(`${prefix}fees/fee-structure.json`)!.async('text'));
  assert.strictEqual(typeof feeData.commonFees[0].amount, 'number');
  assert.strictEqual(feeData.commonFees[0].amount, 24000);

  // 4. Check facilities.json infrastructure numbers
  const infraData = JSON.parse(await zip.file(`${prefix}facilities/infrastructure.json`)!.async('text'));
  assert.strictEqual(infraData.campusAreaSqFt, 217800);
  assert.strictEqual(infraData.smartClassroomsCount, 32);
});

test('WEBSITE PAGES CONFIGURATION: all configured pages, navigation, and tokens are complete', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const pagesData = JSON.parse(await zip.file(`${prefix}website/pages.json`)!.async('text'));
  assert.ok(pagesData.pages['Home'], 'Home page must be configured');
  assert.ok(pagesData.pages['About School'], 'About School page must be configured');
  assert.ok(pagesData.pages['Academics'], 'Academics page must be configured');
  assert.ok(pagesData.pages['Admissions'], 'Admissions page must be configured');
  assert.ok(pagesData.pages['Fee Structure'], 'Fee Structure page must be configured');

  const navData = JSON.parse(await zip.file(`${prefix}website/navigation.json`)!.async('text'));
  assert.ok(Array.isArray(navData.mainNavigation));
  assert.ok(navData.mainNavigation.some((item: any) => item.label === 'Home'));
  assert.ok(navData.mainNavigation.some((item: any) => item.label === 'Admissions'));

  const colorsData = JSON.parse(await zip.file(`${prefix}website/colors.json`)!.async('text'));
  assert.strictEqual(colorsData.primary, '#1e3a8a');
  assert.strictEqual(colorsData.secondary, '#0284c7');
  assert.strictEqual(colorsData.accent, '#f59e0b');
});

test('SCHEMA COVERAGE: all 32 onboarding sections have an explicit mapping in field-mapping.json', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const fieldMapping = JSON.parse(await zip.file(`${prefix}technical/field-mapping.json`)!.async('text'));
  assert.ok(Array.isArray(fieldMapping.mappings), 'fieldMapping.mappings must be an array');
  assert.strictEqual(fieldMapping.mappings.length, 32, 'All 32 onboarding sections must have mappings');

  const mappedSections = new Set(fieldMapping.mappings.map((m: any) => m.field));
  const expectedSections = [
    'schoolProfile', 'campuses', 'leadership', 'brandingDesign', 'websiteRequirements',
    'schoolContent', 'institutionStructure', 'staffFaculty', 'studentConfig', 'admissions',
    'feesConfiguration', 'curriculum', 'attendanceConfig', 'examinationConfig', 'transportConfig',
    'facilitiesConfig', 'libraryConfig', 'hostelConfig', 'cmsRequirements', 'domainPresence',
    'existingSystemsMigration', 'integrationsConfig', 'mobileAppConfig', 'securityPrivacy',
    'assetChecklist', 'legalPolicies', 'projectDelivery', 'usersAccess', 'erpRequirements',
    'portalRequirements', 'mediaAssets', 'additionalRequirements',
  ];

  for (const exp of expectedSections) {
    assert.ok(mappedSections.has(exp), `Expected section "${exp}" must be mapped in field-mapping.json`);
  }
});

test('DATA COVERAGE: every populated section generates non-empty structured JSON files', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  // Verify dedicated JSON files for ERP & operations sections exist
  const expectedFiles = [
    'academics/attendance-config.json',
    'academics/examination-config.json',
    'academics/timetable-config.json',
    'facilities/transport.json',
    'facilities/hostel.json',
    'facilities/library.json',
    'website/cms-workflow.json',
    'website/domain-hosting.json',
    'website/portal-requirements.json',
    'website/media-governance.json',
    'technical/integrations.json',
    'technical/mobile-app.json',
    'technical/data-migration.json',
    'technical/security-privacy.json',
    'technical/erp-requirements.json',
    'technical/additional-requirements.json',
    'technical/admin-provisioning.json',
    'technical/project-delivery.json',
  ];

  for (const relPath of expectedFiles) {
    const file = zip.file(`${prefix}${relPath}`);
    assert.ok(file, `Dedicated export file must exist: ${relPath}`);
    const text = await file.async('text');
    const parsed = JSON.parse(text);
    assert.ok(parsed && typeof parsed === 'object', `File content must parse to object: ${relPath}`);
  }
});

test('REPEATER & ORDERING COVERAGE: campuses, classes, sections, fee categories, and staff maintain exact order and items', async () => {
  const intakeData = createFullSampleIntakeData();
  // Add multiple campuses and classes to verify repeaters
  intakeData.campuses = [
    { id: 'c1', name: 'Primary Campus', isMain: true, address: 'Road 1' } as any,
    { id: 'c2', name: 'Senior Wing', isMain: false, address: 'Road 2' } as any,
    { id: 'c3', name: 'Sports Academy', isMain: false, address: 'Road 3' } as any,
  ];

  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const campusesData = JSON.parse(await zip.file(`${prefix}school-profile/campuses.json`)!.async('text'));
  assert.strictEqual(campusesData.campuses.length, 3, 'All 3 campuses preserved');
  assert.strictEqual(campusesData.campuses[0].name, 'Primary Campus');
  assert.strictEqual(campusesData.campuses[1].name, 'Senior Wing');
  assert.strictEqual(campusesData.campuses[2].name, 'Sports Academy');
});

test('NESTED STRUCTURES: deeply nested configurations retain original shape without flattening', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  // Test deeply nested transport config
  const transportData = JSON.parse(await zip.file(`${prefix}facilities/transport.json`)!.async('text'));
  assert.strictEqual(transportData.transportConfig.busRoutesCount, 12);
  assert.strictEqual(transportData.transportConfig.gpsTrackingEnabled, true);

  // Test deeply nested hostel config
  const hostelData = JSON.parse(await zip.file(`${prefix}facilities/hostel.json`)!.async('text'));
  assert.strictEqual(hostelData.hostelConfig.totalCapacity, 250);
  assert.strictEqual(hostelData.hostelConfig.messFacility, true);

  // Test deeply nested integrations config
  const integrationsData = JSON.parse(await zip.file(`${prefix}technical/integrations.json`)!.async('text'));
  assert.strictEqual(integrationsData.integrationsConfig.paymentGateway, 'Razorpay');
  assert.strictEqual(integrationsData.integrationsConfig.biometricDevices, 'eSSL');
});

test('SECURITY HARDENING: credentials scrubbed while legitimate school domain fields remain intact', () => {
  const testPayload = {
    // Legitimate domain fields that MUST stay intact
    currentAcademicSession: '2026-2027',
    academicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    targetSessions: ['2026-2027', '2027-2028'],
    tokens: { primary: '#112233' },
    colorTokens: { accent: '#ff0000' },
    facilityKey: 'smart_classrooms',
    storageKey: 'school-assets/logos/logo.png',
    schoolCode: 'SCH-100',
    subjectCode: 'MATH-10',
    keyAchievements: ['Top 10 School', 'Green Campus Award'],
    // Sensitive credentials that MUST be scrubbed
    adminPassword: 'super_secret_password',
    api_key: 'sk_live_1234567890abcdef',
    client_secret: 'client_secret_xyz',
    auth_token: 'auth_tok_998877',
    access_token: 'access_tok_112233',
    refresh_token: 'refresh_tok_445566',
    service_role_key: 'sbp_service_role_key_secret',
    database_url: 'postgres://user:pass@db.internal:5432/school',
    db_password: 'database_password_99',
    sessionData: { session_token: 'session_token_abc' },
  };

  const sanitized = sanitizeExportData(testPayload) as any;

  // Verify legitimate fields preserved
  assert.strictEqual(sanitized.currentAcademicSession, '2026-2027');
  assert.strictEqual(sanitized.academicSession, '2026-2027');
  assert.strictEqual(sanitized.sessionStartDate, '2026-04-01');
  assert.strictEqual(sanitized.sessionEndDate, '2027-03-31');
  assert.deepStrictEqual(sanitized.targetSessions, ['2026-2027', '2027-2028']);
  assert.deepStrictEqual(sanitized.tokens, { primary: '#112233' });
  assert.deepStrictEqual(sanitized.colorTokens, { accent: '#ff0000' });
  assert.strictEqual(sanitized.facilityKey, 'smart_classrooms');
  assert.strictEqual(sanitized.storageKey, 'school-assets/logos/logo.png');
  assert.strictEqual(sanitized.schoolCode, 'SCH-100');
  assert.strictEqual(sanitized.subjectCode, 'MATH-10');
  assert.deepStrictEqual(sanitized.keyAchievements, ['Top 10 School', 'Green Campus Award']);

  // Verify sensitive fields removed
  assert.strictEqual(sanitized.adminPassword, undefined, 'adminPassword must be scrubbed');
  assert.strictEqual(sanitized.api_key, undefined, 'api_key must be scrubbed');
  assert.strictEqual(sanitized.client_secret, undefined, 'client_secret must be scrubbed');
  assert.strictEqual(sanitized.auth_token, undefined, 'auth_token must be scrubbed');
  assert.strictEqual(sanitized.access_token, undefined, 'access_token must be scrubbed');
  assert.strictEqual(sanitized.refresh_token, undefined, 'refresh_token must be scrubbed');
  assert.strictEqual(sanitized.service_role_key, undefined, 'service_role_key must be scrubbed');
  assert.strictEqual(sanitized.database_url, undefined, 'database_url must be scrubbed');
  assert.strictEqual(sanitized.db_password, undefined, 'db_password must be scrubbed');
  assert.strictEqual(sanitized.sessionData, undefined, 'sessionData must be scrubbed');
});

test('AUTHORITATIVE MANIFEST & CHECKSUMS: manifest includes entries with sizes, MIME types, and SHA-256 hashes', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const manifest = JSON.parse(await zip.file(`${prefix}manifest.json`)!.async('text'));
  assert.ok(Array.isArray(manifest.fileEntries), 'fileEntries must exist in manifest');
  assert.ok(manifest.fileEntries.length > 30, 'fileEntries must record all generated files');

  // Verify asset manifest contains SHA-256 checksums
  const assetManifest = JSON.parse(await zip.file(`${prefix}technical/asset-manifest.json`)!.async('text'));
  assert.ok(Array.isArray(assetManifest));
  for (const entry of assetManifest) {
    assert.ok(entry.sha256, `Asset ${entry.id} must have a SHA-256 checksum`);
    assert.strictEqual(entry.sha256.length, 64, `SHA-256 checksum must be 64 hex characters: ${entry.id}`);
    assert.ok(entry.size > 0, `Asset ${entry.id} size must be > 0`);
  }
});

test('CROSS-REFERENCE INTEGRITY: cross-references between sections resolve accurately', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  const classesData = JSON.parse(await zip.file(`${prefix}academics/classes.json`)!.async('text'));
  const catalogData = JSON.parse(await zip.file(`${prefix}academics/subject-catalog.json`)!.async('text'));

  const classIds = new Set(classesData.classes.map((c: any) => c.classId));
  for (const app of catalogData.subjectApplicability) {
    if (app.classId) {
      assert.ok(classIds.has(app.classId), `Subject applicability classId "${app.classId}" must exist in classes.json`);
    }
  }
});

test('ROUND-TRIP RECONSTRUCTION: submission.json and logical JSON files can reconstruct UniversalIntakeData', async () => {
  const intakeData = createFullSampleIntakeData();
  const result = await exportCompleteSchoolProjectZip({
    project: createSampleProject(),
    submission: createSampleSubmission(intakeData),
    intakePayload: intakeData,
  });

  const arrayBuffer = await result.zipBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const prefix = `${result.folderName}/`;

  // Reconstruct from submission.json
  const submissionData = JSON.parse(await zip.file(`${prefix}submission.json`)!.async('text'));
  const rehydrated = submissionData.canonicalData as UniversalIntakeData;

  assert.strictEqual(rehydrated.schoolProfile.schoolName, intakeData.schoolProfile.schoolName);
  assert.strictEqual(rehydrated.brandingDesign.primaryColor, intakeData.brandingDesign.primaryColor);
  assert.strictEqual(rehydrated.institutionStructure?.classes?.length, intakeData.institutionStructure?.classes?.length);
  assert.strictEqual(rehydrated.feesConfiguration?.commonFees?.length, intakeData.feesConfiguration?.commonFees?.length);
  assert.strictEqual(rehydrated.admissions?.session, intakeData.admissions?.session);
});

