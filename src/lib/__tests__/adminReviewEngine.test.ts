import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCustomerRequirementInventory,
  buildPageByPageVerifications,
  buildContentComparisonMap,
  buildDocumentReviewInventory,
  buildMediaUsageInventory,
  buildDesignVerification,
  detectProjectIssues,
  calculateProjectReviewScorecard,
  generateDeveloperHandoffSpecification,
} from '../adminReviewEngine';
import { buildSchoolWebsiteDataFromIntake } from '../schoolWebsiteContract';
import type { SchoolProject, UniversalIntakeData, SchoolIntakeChangeRequest } from '../types';

export const mockProject: SchoolProject = {
  id: 'proj-test-123',
  project_number: 'SCH-2026-5277',
  domain: 'SCHOOL',
  source_system: 'EKAAGRA_WEBSITE',
  school_name: 'SparkNest Academy School',
  product_id: 'school-complete',
  status: 'submitted',
  media_status: 'draft',
  completeness_percentage: 92,
  primary_contact_name: 'Dr. Rajesh Sharma',
  primary_contact_email: 'principal@sparknest.edu.in',
  primary_contact_phone: '+91 98765 43210',
  commercial_summary: {},
  metadata: {
    adminOverrides: {
      'schoolProfile.yearOfEstablishment': {
        fieldKey: 'schoolProfile.yearOfEstablishment',
        sectionKey: 'schoolProfile',
        originalValue: '2015',
        adminValue: '2012',
        notes: 'Verified via CBSE Affiliation Certificate',
        updatedAt: '2026-09-12T10:00:00Z',
        updatedBy: 'Admin Reviewer',
      },
    },
    requirementReviews: {
      'req-school-name': {
        status: 'APPROVED',
        notes: 'Matches Society Registration Deed',
      },
    },
    pageReviews: {
      Home: {
        status: 'APPROVED',
        notes: 'Homepage layout and sections verified',
      },
    },
    reviewIssues: [],
  },
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-12T00:00:00Z',
};

export const mockIntakeData: Partial<UniversalIntakeData> = {
  schoolProfile: {
    schoolName: 'SparkNest Academy School',
    displayName: 'SparkNest Academy',
    yearOfEstablishment: '2015',
    board: 'CBSE',
    affiliationNumber: '2130001',
    udiseCode: '09010100101',
    tagline: 'Empowering Future Leaders',
    primaryPhone: '+91 98765 43210',
    primaryEmail: 'info@sparknest.edu.in',
  } as any,
  campuses: [
    {
      id: 'campus-main',
      campusName: 'Main Campus',
      isMainCampus: true,
      addressLine1: 'Plot 42, Knowledge Park III',
      city: 'Greater Noida',
      state: 'Uttar Pradesh',
      postalCode: '201306',
      contactPhone: '+91 98765 43210',
      contactEmail: 'info@sparknest.edu.in',
    } as any,
  ],
  leadership: {
    principalName: 'Dr. Rajesh Sharma',
    principalDesignation: 'Principal',
    principalPhoto: 'https://cdn.ekaagra.in/sparknest/principal.jpg',
    principalMessage: 'Welcome to SparkNest Academy, where we inspire young minds to achieve excellence.',
  } as any,
  brandingDesign: {
    logo: 'https://cdn.ekaagra.in/sparknest/logo.png',
    primaryColor: '#1e3a8a',
    secondaryColor: '#d97706',
    fontFamily: 'Inter',
    themeVariant: 'modern_classic',
    navigationStyle: 'sticky',
  } as any,
  websiteRequirements: {
    requiredPages: ['Home', 'About School', 'Leadership & Desk', 'Academics', 'Admissions', 'Fee Structure', 'Campus Facilities', 'Contact Us', 'Mandatory Disclosures'],
    heroHeadline: 'Empowering Future Leaders',
    heroSubheadline: 'World-Class Education from Nursery to Class 12 with Global Standards',
    callToActionPrimary: 'Apply for Admission',
  } as any,
  schoolContent: {
    aboutDescription: 'SparkNest Academy is committed to holistic development, combining academic rigour with athletic prowess.',
    vision: 'To be a globally admired center of learning that fosters innovation and ethical leadership.',
    mission: 'Nurturing curiosity, character, and competence in every learner.',
  } as any,
  institutionStructure: {
    gradeLevelsOffered: ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'],
  } as any,
  admissions: {
    isEnrolling: true,
    guidelines: 'Admission is granted based on seat availability and interaction.',
    eligibilitySummary: 'Nursery: 3+ years as of March 31. Class 1: 5+ years.',
  } as any,
  feesConfiguration: {
    feeCategories: [
      { category: 'Admission Fee', frequency: 'One Time', amountINR: 25000 },
      { category: 'Annual Composite Fee', frequency: 'Annually', amountINR: 65000 },
      { category: 'Quarterly Tuition Fee', frequency: 'Quarterly', amountINR: 18000 },
    ],
  } as any,
  facilitiesConfig: {
    facilitiesList: [
      { key: 'library', name: 'Central Digital Library', isAvailable: true, capacityOrCount: '15000+ Volumes' },
      { key: 'stem_lab', name: 'Robotics & STEM Lab', isAvailable: true, capacityOrCount: '40 Workstations' },
      { key: 'sports', name: 'Multi-Sport Complex', isAvailable: true },
    ],
  } as any,
  assetChecklist: {
    items: [
      { key: 'cert-affiliation', title: 'CBSE Affiliation Certificate', fileUrl: 'https://cdn.ekaagra.in/sparknest/cbse.pdf', fileName: 'CBSE_Affiliation.pdf', isVerified: true },
      { key: 'cert-recognition', title: 'State Government NOC', fileUrl: 'https://cdn.ekaagra.in/sparknest/noc.pdf', fileName: 'State_NOC.pdf', isVerified: true },
      { key: 'cert-registration', title: 'Society / Trust Registration', fileUrl: 'https://cdn.ekaagra.in/sparknest/trust.pdf', fileName: 'Trust_Deed.pdf', isVerified: true },
      { key: 'cert-safety', title: 'Fire & Building Safety', fileUrl: 'https://cdn.ekaagra.in/sparknest/safety.pdf', fileName: 'Safety_Cert.pdf', isVerified: true },
      { key: 'adm-fee-circular', title: 'Official Fee Schedule', fileUrl: 'https://cdn.ekaagra.in/sparknest/fees.pdf', fileName: 'Fee_Circular.pdf', isVerified: true },
      { key: 'cert-mandatory-disclosure', title: 'Mandatory Public Disclosure (Appendix IX)', fileUrl: 'https://cdn.ekaagra.in/sparknest/disclosure.pdf', fileName: 'Appendix_IX.pdf', isVerified: true },
    ],
  } as any,
};

test('ADMIN REVIEW ENGINE: Customer Requirements Inventory', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const reqs = buildCustomerRequirementInventory(mockIntakeData, websiteData, mockProject);

  assert.ok(reqs.length > 10, 'Expected at least 10 customer requirements');
  
  // Check School Name
  const nameReq = reqs.find((r) => r.id === 'req-school-name');
  assert.ok(nameReq, 'Expected req-school-name to exist');
  assert.strictEqual(nameReq?.submittedValue, 'SparkNest Academy School');
  assert.strictEqual(nameReq?.actualWebsiteResult, 'SparkNest Academy School');
  assert.strictEqual(nameReq?.adminReviewStatus, 'APPROVED');

  // Check Admin Override on Year of Establishment
  const yearReq = reqs.find((r) => r.id === 'req-established-year');
  assert.ok(yearReq, 'Expected req-established-year to exist');
  assert.strictEqual(yearReq?.rawSubmittedValue, '2015');
  assert.strictEqual(yearReq?.submittedValue, '2012', 'Expected admin override value 2012');
  assert.ok(yearReq?.adminOverride, 'Expected adminOverride metadata to be attached');

  // Check Hero Headline & CTA
  const heroReq = reqs.find((r) => r.id === 'req-hero-headline');
  assert.strictEqual(heroReq?.status, 'MATCHED');

  const ctaReq = reqs.find((r) => r.id === 'req-hero-cta');
  assert.strictEqual(ctaReq?.status, 'MATCHED');
});

test('ADMIN REVIEW ENGINE: Page-by-Page Website Verification', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const pages = buildPageByPageVerifications(mockIntakeData, websiteData, mockProject);

  assert.ok(pages.length >= 8, 'Expected standard pages array');
  
  const home = pages.find((p) => p.pageKey === 'Home');
  assert.ok(home, 'Home page must be present');
  assert.strictEqual(home?.isRequiredByCustomer, true);
  assert.strictEqual(home?.isImplemented, true);
  assert.strictEqual(home?.status, 'APPROVED', 'Home should inherit admin approved status');
  assert.ok(home?.requiredSections.length > 3, 'Home should have multiple required sections');

  const admissions = pages.find((p) => p.pageKey === 'Admissions');
  assert.ok(admissions, 'Admissions page must be present');
  assert.strictEqual(admissions?.status, 'MATCHED');
});

test('ADMIN REVIEW ENGINE: Content Comparison & Diffing', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const diffs = buildContentComparisonMap(mockIntakeData, websiteData);

  assert.ok(diffs.length >= 6, 'Expected content diffs');
  const nameDiff = diffs.find((d) => d.id === 'diff-school-name');
  assert.strictEqual(nameDiff?.status, 'MATCHED');
  assert.strictEqual(nameDiff?.matchScore, 100);

  const heroDiff = diffs.find((d) => d.id === 'diff-hero-headline');
  assert.strictEqual(heroDiff?.status, 'MATCHED');
});

test('ADMIN REVIEW ENGINE: Statutory Documents Review', () => {
  const docs = buildDocumentReviewInventory(mockIntakeData, mockProject);
  assert.ok(docs.length >= 6, 'Expected canonical statutory documents');

  const affiliation = docs.find((d) => d.id === 'doc-affiliation');
  assert.ok(affiliation, 'Affiliation cert must exist');
  assert.strictEqual(affiliation?.isUploaded, true);
  assert.strictEqual(affiliation?.isPdf, true);
  assert.strictEqual(affiliation?.verificationStatus, 'VERIFIED');

  const feeCirc = docs.find((d) => d.id === 'doc-fee-structure');
  assert.ok(feeCirc, 'Fee circular must exist');
  assert.strictEqual(feeCirc?.isUploaded, true);
});

test('ADMIN REVIEW ENGINE: Media Usage Audit', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const media = buildMediaUsageInventory(mockIntakeData, websiteData, mockProject);

  // Logo asset
  const logo = media.find((m) => m.category === 'logo' || m.id.includes('logo') || m.intendedUsage.includes('Brandmark'));
  if (logo) {
    assert.strictEqual(logo.isUsedOnWebsite, true);
    assert.strictEqual(logo.usageStatus, 'ACTIVE_ON_WEBSITE');
  }
});

test('ADMIN REVIEW ENGINE: Design & Branding Verification', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const design = buildDesignVerification(mockIntakeData, websiteData);

  assert.strictEqual(design.overallStatus, 'MATCHED');
  assert.strictEqual(design.primaryColor, '#1e3a8a');
  assert.strictEqual(design.secondaryColor, '#d97706');
});

test('ADMIN REVIEW ENGINE: Scorecard & Readiness Calculation', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const scorecard = calculateProjectReviewScorecard(mockIntakeData, websiteData, mockProject);

  assert.ok(scorecard.informationCompleteness >= 80, `Completeness was ${scorecard.informationCompleteness}%`);
  assert.ok(scorecard.websiteRequirementMatch >= 80, `Match was ${scorecard.websiteRequirementMatch}%`);
  assert.ok(scorecard.overallReadiness >= 80, `Readiness was ${scorecard.overallReadiness}%`);
  assert.strictEqual(scorecard.isReadyForApproval, true, 'Mock project should be ready for approval');
  assert.strictEqual(scorecard.approvalBlockers.length, 0);
});

test('ADMIN REVIEW ENGINE: Developer Handoff Generation', () => {
  const websiteData = buildSchoolWebsiteDataFromIntake(mockIntakeData);
  const handoff = generateDeveloperHandoffSpecification(mockIntakeData, websiteData, mockProject);

  assert.strictEqual(handoff.projectName, 'SparkNest Academy School');
  assert.strictEqual(handoff.projectNumber, 'SCH-2026-5277');
  assert.ok(handoff.pages.length >= 5, 'Expected pages in handoff');
  assert.ok(handoff.markdownExport.includes('SparkNest Academy School'));
  assert.ok(handoff.markdownExport.includes('#1e3a8a'));
});
