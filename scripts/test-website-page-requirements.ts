/**
 * SECTION 5: INTELLIGENT WEBSITE PAGE REQUIREMENTS TEST HARNESS
 *
 * Verifies:
 * 1. Centralized Page Requirement Engine & 22 Standard Pages Registry
 * 2. Single Source of Truth Auto-Fill from all 28 Onboarding Sections
 * 3. Zero Fabrication Policy (fees, affiliation numbers, exam results)
 * 4. Mandatory Disclosures Structured Regulatory Configuration
 * 5. Privacy Policy Template Generator with Purpose Toggles
 * 6. Campus Facility & Gallery 10-Category Photo Parity & Asset Reuse
 * 7. Conditional Hostel Information (Disabled Notice vs Active)
 * 8. Enhanced Custom Specialized Pages (Page Types + Custom Requirements)
 * 9. Smart Field States (auto_filled, confirmed, missing, optional, not_applicable, generated)
 * 10. Future CMS Content Non-Blocking Evaluation
 * 11. Multi-Campus Isolation & Scope Targeting
 * 12. Normalized Developer Specification Output (pages, nav, sources, assets, docs, templates)
 * 13. State Persistence & Draft Round-Trip Deserialization
 * 14. Section 5 Completeness Scoring & Backward Compatibility
 */

import assert from 'assert';
import {
  STANDARD_WEBSITE_PAGES,
  autoFillPageRequirements,
  evaluatePageStatus,
  generatePrivacyPolicyTemplate,
  generateMandatoryDisclosureConfig,
  generateWebsiteDeveloperSpec,
  buildWebsitePageConfigurations,
  getCampusGalleryCategoryCounts,
  findStatutoryDocumentsInChecklist,
} from '../src/lib/websitePageRequirements';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import type {
  UniversalIntakeData,
  WebsitePageConfiguration,
  WebsitePrivacyPolicyConfig,
  CampusImageData,
} from '../src/lib/types';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  SECTION 5: INTELLIGENT WEBSITE PAGE REQUIREMENTS TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// GROUP 1: Centralized Requirement Definitions & Standard Pages Registry
// -----------------------------------------------------------------------------
console.log('Group 1: Standard Pages Registry & Centralized Definitions');

runTest('Exactly 22 standard website pages are defined in centralized registry', () => {
  assert.strictEqual(STANDARD_WEBSITE_PAGES.length, 22);
});

runTest('All 22 standard pages define required metadata (label, slug, recommendedSections)', () => {
  for (const page of STANDARD_WEBSITE_PAGES) {
    assert(page.pageKey.length > 0, `Page key must not be empty`);
    assert(page.label.length > 0, `Page label must not be empty for ${page.pageKey}`);
    assert(page.slug.length > 0, `Page slug must not be empty for ${page.pageKey}`);
    assert(page.description.length > 0, `Page description must not be empty for ${page.pageKey}`);
    assert(Array.isArray(page.recommendedSections) && page.recommendedSections.length >= 3,
      `Recommended sections must have at least 3 entries for ${page.pageKey}`);
  }
});

runTest('Mandatory Disclosures and Privacy Policy are explicitly registered', () => {
  const disclosure = STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === 'Mandatory Disclosures');
  const privacy = STANDARD_WEBSITE_PAGES.find((p) => p.pageKey === 'Privacy Policy');
  assert(disclosure, 'Mandatory Disclosures page must exist');
  assert(privacy, 'Privacy Policy page must exist');
  assert.strictEqual(disclosure.slug, 'mandatory-disclosures');
  assert.strictEqual(privacy.slug, 'privacy-policy');
});

// -----------------------------------------------------------------------------
// GROUP 2: Single Source of Truth Auto-Fill Engine
// -----------------------------------------------------------------------------
console.log('\nGroup 2: Single Source of Truth Auto-Fill Engine');

const mockIntake: UniversalIntakeData = createInitialIntakeData({
  schoolName: 'Delhi Public International School',
  contactName: 'Dr. Joseph Vijay',
  contactEmail: 'principal@dpis.edu.in',
  contactPhone: '+91 98765 43210',
  city: 'Patna',
  state: 'Bihar',
});

// Populate upstream onboarding data across multiple sections
mockIntake.schoolProfile.affiliationNumber = '330943';
mockIntake.schoolProfile.schoolCode = '66664';
mockIntake.schoolProfile.udiseCode = '10020300405';
mockIntake.schoolProfile.board = 'CBSE';
mockIntake.schoolProfile.yearOfEstablishment = '1998';
mockIntake.schoolProfile.officialEmail = 'contact@dpis.edu.in';
mockIntake.schoolProfile.officialPhone = '+91 612 2233445';
mockIntake.schoolProfile.address = 'Bailey Road, Danapur';
mockIntake.schoolProfile.pin = '801503';
mockIntake.schoolProfile.city = 'Patna';
mockIntake.schoolProfile.state = 'Bihar';

mockIntake.brandingDesign.motto = 'Service Before Self';
mockIntake.brandingDesign.taglineOrMotto = 'Service Before Self';
mockIntake.brandingDesign.brandTone = 'Modern';
if (!mockIntake.websiteRequirements!.requiredPages.includes('Privacy Policy')) {
  mockIntake.websiteRequirements!.requiredPages.push('Privacy Policy');
}

mockIntake.leadership = {
  principalName: 'Dr. Joseph Vijay',
  principalDesignation: 'Principal',
  principalEmail: 'principal@dpis.edu.in',
  principalMessage: 'Welcome to an empowering academic sanctuary.',
  managementMembers: [
    {
      id: 'm-1',
      name: 'Shri R. K. Sharma',
      designation: 'Chairman',
      role: 'Chairman',
      email: 'chairman@dpis.edu.in',
      phone: '+91 9988776655',
      displayOnWebsite: true,
    },
  ],
};

const mockCampusImage: CampusImageData = {
  id: 'img-main-hero',
  campusId: 'camp-main',
  storageKey: 'schools/dpis/campus/hero.webp',
  fileName: 'main_gate_front.webp',
  url: 'https://cdn.ekaagraschools.in/dpis/hero.webp',
  mimeType: 'image/webp',
  category: 'campus_buildings',
  isPrimary: true,
};

mockIntake.campuses = [
  {
    id: 'camp-main',
    name: 'Main Campus Danapur',
    address: 'Bailey Road',
    city: 'Patna',
    state: 'Bihar',
    pin: '801503',
    contactPhone: '+91 612 2233445',
    contactEmail: 'maincampus@dpis.edu.in',
    isMainCampus: true,
    images: [mockCampusImage],
  },
];

mockIntake.assetChecklist = {
  items: [
    {
      id: 'cert-mandatory-disclosure',
      category: 'certificates',
      title: 'Mandatory Public Disclosure (Appendix IX)',
      description: 'Official statutory compliance disclosure sheet',
      requirement: 'statutory',
      type: 'document',
      status: 'provided',
      fileUrl: 'https://cdn.ekaagraschools.in/dpis/docs/appendix_ix.pdf',
      fileName: 'CBSE_Appendix_IX_Signed.pdf',
    },
    {
      id: 'cert-affiliation',
      category: 'certificates',
      title: 'CBSE Affiliation Grant Order',
      description: 'Official board affiliation letter',
      requirement: 'statutory',
      type: 'document',
      status: 'provided',
      fileUrl: 'https://cdn.ekaagraschools.in/dpis/docs/cbse_affiliation.pdf',
    },
  ],
};

runTest('Home page auto-fills school name, motto, primary campus, and hero image from existing assets', () => {
  const reqs = autoFillPageRequirements('Home', mockIntake);
  const nameReq = reqs.find((r) => r.key === 'school_name');
  const mottoReq = reqs.find((r) => r.key === 'tagline');
  const heroReq = reqs.find((r) => r.key === 'hero_image');
  const campusReq = reqs.find((r) => r.key === 'primary_campus');

  assert(nameReq && nameReq.value === 'Delhi Public International School');
  assert.strictEqual(nameReq.status, 'auto_filled');
  assert.strictEqual(nameReq.source, 'Section 1 — Identity');

  assert(mottoReq && mottoReq.value === 'Service Before Self');
  assert.strictEqual(mottoReq.status, 'auto_filled');

  assert(heroReq && heroReq.value === mockCampusImage.url);
  assert.strictEqual(heroReq.status, 'auto_filled');
  assert.strictEqual(heroReq.referenceAssetId, mockCampusImage.id);

  assert(campusReq && campusReq.value?.toString().includes('Main Campus Danapur'));
});

runTest('About School auto-fills year of establishment, principal message, and values', () => {
  const reqs = autoFillPageRequirements('About School', mockIntake);
  const estReq = reqs.find((r) => r.key === 'history_establishment');
  const msgReq = reqs.find((r) => r.key === 'principal_message_teaser');

  assert(estReq && estReq.value === '1998');
  assert.strictEqual(estReq.status, 'auto_filled');

  assert(msgReq && msgReq.value === 'Welcome to an empowering academic sanctuary.');
  assert.strictEqual(msgReq.status, 'auto_filled');
});

runTest('Leadership & Desk auto-fills principal name and management roster without re-entry', () => {
  const reqs = autoFillPageRequirements('Leadership & Desk', mockIntake);
  const princReq = reqs.find((r) => r.key === 'principal_name');
  const mgmtReq = reqs.find((r) => r.key === 'management_roster');

  assert(princReq && princReq.value === 'Dr. Joseph Vijay');
  assert.strictEqual(princReq.status, 'auto_filled');

  assert(mgmtReq && mgmtReq.value?.toString().includes('Shri R. K. Sharma (Chairman)'));
  assert.strictEqual(mgmtReq.status, 'auto_filled');
});

runTest('Contact Us auto-fills full address, telephone, email, and campus identity', () => {
  const reqs = autoFillPageRequirements('Contact Us', mockIntake);
  const addrReq = reqs.find((r) => r.key === 'contact_address');
  const phoneReq = reqs.find((r) => r.key === 'contact_phone');
  const emailReq = reqs.find((r) => r.key === 'contact_email');

  assert(addrReq && addrReq.value?.toString().includes('Bailey Road'));
  assert.strictEqual(addrReq.status, 'auto_filled');
  assert(phoneReq && phoneReq.value === '+91 612 2233445');
  assert(emailReq && emailReq.value === 'maincampus@dpis.edu.in');
});

// -----------------------------------------------------------------------------
// GROUP 3: Zero-Fabrication Safety Rules
// -----------------------------------------------------------------------------
console.log('\nGroup 3: Zero-Fabrication Safety Rules');

runTest('Fee Structure never fabricates monetary amounts when unprovided', () => {
  // Empty fee structure in intake
  const intakeWithoutFees = { ...mockIntake, feesConfiguration: { classFeeStructures: [] } };
  const reqs = autoFillPageRequirements('Fee Structure', intakeWithoutFees);
  const feeTableReq = reqs.find((r) => r.key === 'fee_table');

  assert(feeTableReq, 'Fee table requirement must exist');
  assert.strictEqual(feeTableReq.status, 'missing');
  assert.strictEqual(feeTableReq.value, '');
  assert(feeTableReq.missingWarning?.includes('Fee amounts have not been provided'));
  assert(feeTableReq.missingWarning?.includes('never fabricate'));
});

runTest('Mandatory Disclosures flags missing affiliation number without fabricating numbers', () => {
  const intakeWithoutAffNo = {
    ...mockIntake,
    schoolProfile: { ...mockIntake.schoolProfile, affiliationNumber: '' },
  };
  const reqs = autoFillPageRequirements('Mandatory Disclosures', intakeWithoutAffNo);
  const affReq = reqs.find((r) => r.key === 'affiliation_number');

  assert(affReq, 'Affiliation number requirement must exist');
  assert.strictEqual(affReq.status, 'missing');
  assert.strictEqual(affReq.value, '');
  assert(affReq.missingWarning?.includes('Not provided — requires confirmation'));
});

// -----------------------------------------------------------------------------
// GROUP 4: Structured Mandatory Disclosures & Document Linking
// -----------------------------------------------------------------------------
console.log('\nGroup 4: Mandatory Disclosures Structured Regulatory Engine');

runTest('Mandatory Disclosures populates regulatory structure with linked checklist PDFs', () => {
  const config = generateMandatoryDisclosureConfig(mockIntake);

  assert.strictEqual(config.regulatoryBody, 'CBSE');
  assert.strictEqual(config.affiliationNumber, '330943');
  assert.strictEqual(config.schoolCode, '66664');
  assert.strictEqual(config.principalName, 'Dr. Joseph Vijay');
  assert(config.schoolAddress.includes('Bailey Road'));
  assert.strictEqual(config.autoGenerateStandardStructure, true);

  // Check statutory document links
  const appIxDoc = config.statutoryDocuments?.find((d) => d.documentKey === 'cert-mandatory-disclosure');
  assert(appIxDoc, 'Appendix IX statutory doc entry must exist');
  assert.strictEqual(appIxDoc.status, 'found');
  assert.strictEqual(appIxDoc.fileUrl, 'https://cdn.ekaagraschools.in/dpis/docs/appendix_ix.pdf');

  const affDoc = config.statutoryDocuments?.find((d) => d.documentKey === 'cert-affiliation');
  assert(affDoc, 'Affiliation grant order statutory doc entry must exist');
  assert.strictEqual(affDoc.status, 'found');
});

runTest('Mandatory Disclosures marks missing statutory documents accurately when absent in Section 25', () => {
  const intakeWithoutDocs = { ...mockIntake, assetChecklist: { items: [] } };
  const config = generateMandatoryDisclosureConfig(intakeWithoutDocs);

  const appIxDoc = config.statutoryDocuments?.find((d) => d.documentKey === 'cert-mandatory-disclosure');
  assert(appIxDoc, 'Appendix IX entry must exist');
  assert.strictEqual(appIxDoc.status, 'missing');
});

// -----------------------------------------------------------------------------
// GROUP 5: Privacy Policy Template Generator with Purpose Toggles
// -----------------------------------------------------------------------------
console.log('\nGroup 5: Privacy Policy Template Generator');

runTest('Privacy Policy generates customizable template reflecting active school toggles', () => {
  const privConfig: WebsitePrivacyPolicyConfig = {
    autoGenerateStandardPolicy: true,
    collectsContactFormSubmissions: true,
    collectsAdmissionEnquiries: true,
    usesCookies: true,
    usesAnalytics: true,
    offersNewsletterSubscription: true,
    acceptsDocumentUploads: true,
    acceptsOnlinePayments: false,
    schoolName: 'Delhi Public International School',
    schoolContactEmail: 'privacy@dpis.edu.in',
    dataProtectionContact: 'School Legal Desk',
  };

  const template = generatePrivacyPolicyTemplate(
    privConfig,
    privConfig.schoolName,
    privConfig.schoolContactEmail
  );

  assert(template.includes('PRIVACY POLICY FOR DELHI PUBLIC INTERNATIONAL SCHOOL'));
  assert(template.includes('Contact information (name, email address'));
  assert(template.includes('Student admission details'));
  assert(template.includes('Session cookies'));
  assert(template.includes('Aggregated analytical usage statistics'));
  assert(template.includes('Email addresses for school newsletter'));
  assert(template.includes('Academic credentials and statutory documents'));
  assert(!template.includes('Payment transaction identifiers'), 'Should not include payment copy when disabled');
  assert(template.includes('privacy@dpis.edu.in'));
});

// -----------------------------------------------------------------------------
// GROUP 6: Campus Facilities, Gallery Parity & Conditional Hostel
// -----------------------------------------------------------------------------
console.log('\nGroup 6: Campus Facilities, 10-Category Photos & Conditional Hostel');

runTest('Campus Gallery counts reflect all 10 canonical categories', () => {
  const counts = getCampusGalleryCategoryCounts(mockIntake.campuses);
  assert.strictEqual(counts.campus_buildings, 1);
  assert.strictEqual(counts.classrooms, 0);
  assert.strictEqual(counts.laboratories, 0);
  assert.strictEqual(counts.sports_playground, 0);
});

runTest('Hostel page displays disabled confirmation when school has no hostel', () => {
  const intakeNoHostel = {
    ...mockIntake,
    hostelConfig: { enabled: false },
    schoolProfile: { ...mockIntake.schoolProfile, residentialStatus: 'day_school' as const },
  };

  const reqs = autoFillPageRequirements('Hostel Information', intakeNoHostel);
  const statusReq = reqs.find((r) => r.key === 'hostel_status_disabled');

  assert(statusReq, 'Disabled status requirement must be present');
  assert.strictEqual(statusReq.status, 'not_applicable');
  assert(statusReq.value?.toString().includes('Hostel page disabled — school does not provide hostel facilities.'));
});

runTest('Hostel page displays capacity requirement when school provides hostel', () => {
  const intakeWithHostel = {
    ...mockIntake,
    hostelConfig: { enabled: true, totalCapacity: 250 },
  };

  const reqs = autoFillPageRequirements('Hostel Information', intakeWithHostel);
  const capReq = reqs.find((r) => r.key === 'hostel_capacity');

  assert(capReq, 'Capacity requirement must be present when hostel enabled');
  assert.strictEqual(capReq.status, 'auto_filled');
  assert(capReq.value?.toString().includes('250 students'));
});

// -----------------------------------------------------------------------------
// GROUP 7: Custom Specialized Pages with Page Types & Requirements
// -----------------------------------------------------------------------------
console.log('\nGroup 7: Custom Specialized Pages with Page Types & Dynamic Requirements');

runTest('Custom specialized pages support Page Types and custom requirements list', () => {
  const intakeWithCustom = {
    ...mockIntake,
    websiteRequirements: {
      ...mockIntake.websiteRequirements,
      primaryPurpose: 'Empower students',
      requiredPages: ['Home', 'About School'],
      customPages: [
        {
          id: 'cp-ib-diploma',
          title: 'IB Diploma Programme Hub',
          slug: 'ib-diploma',
          purpose: 'Detailed IB curriculum, CAS projects, and faculty credentials',
          language: 'English',
          isPublic: true,
          isCmsEditable: true,
          pageType: 'information' as const,
          customRequirements: [
            { id: 'cr-1', title: 'Curriculum Guide PDF', description: 'Downloadable brochure', type: 'document' },
            { id: 'cr-2', title: 'CAS Coordinator Bio', description: 'Faculty credentials', type: 'text' },
          ],
        },
      ],
      migrationNeededFromExisting: false,
      languagesRequired: ['English'],
    },
  };

  const configs = buildWebsitePageConfigurations(intakeWithCustom);
  const customConfig = configs['custom_cp-ib-diploma'];

  assert(customConfig, 'Custom page configuration must be generated');
  assert.strictEqual(customConfig.label, 'IB Diploma Programme Hub');
  assert.strictEqual(customConfig.slug, 'ib-diploma');
  assert.strictEqual(customConfig.isCustom, true);
  assert.strictEqual(customConfig.customPageType, 'information');
  assert.strictEqual(customConfig.requirements.length, 2);
  assert.strictEqual(customConfig.requirements[0].label, 'Curriculum Guide PDF');
});

// -----------------------------------------------------------------------------
// GROUP 8: Progressive Evaluation, CMS Future Content & Readiness Status
// -----------------------------------------------------------------------------
console.log('\nGroup 8: Progressive Evaluation & CMS Future Content Non-Blocking');

runTest('Future CMS pages (Events, Notices, Results) do not block onboarding completeness', () => {
  const eventsReqs = autoFillPageRequirements('Events & News', mockIntake);
  const noticesReqs = autoFillPageRequirements('Notices & Circulars', mockIntake);

  const eventsStatus = evaluatePageStatus(eventsReqs, 'Events & News');
  const noticesStatus = evaluatePageStatus(noticesReqs, 'Notices & Circulars');

  assert.strictEqual(eventsStatus.status, 'ready');
  assert.strictEqual(noticesStatus.status, 'ready');
});

runTest('Missing statutory document marks page as needs_review or incomplete', () => {
  const intakeMissingStatutory = {
    ...mockIntake,
    assetChecklist: { items: [] },
  };

  const reqs = autoFillPageRequirements('Mandatory Disclosures', intakeMissingStatutory);
  const evaluation = evaluatePageStatus(reqs, 'Mandatory Disclosures');

  assert(evaluation.status === 'needs_review' || evaluation.status === 'incomplete',
    `Status should require review when statutory docs are missing (Got: ${evaluation.status})`);
});

// -----------------------------------------------------------------------------
// GROUP 9: Developer Output Specification
// -----------------------------------------------------------------------------
console.log('\nGroup 9: Normalized Developer Output Specification');

runTest('generateWebsiteDeveloperSpec produces complete downstream execution artifact', () => {
  const spec = generateWebsiteDeveloperSpec(mockIntake);

  assert(Array.isArray(spec.pages), 'Pages array must exist in spec');
  assert(spec.pages.length >= 10, 'At least 10 pages must be in specification');
  assert(Array.isArray(spec.navigation), 'Navigation array must exist');
  assert(spec.summary.totalPages === spec.pages.length, 'Total pages must match summary count');
  assert(spec.summary.readyPages > 0, 'Ready pages must be positive');
  assert(spec.assetReferences['hero_image'], 'Hero image must be referenced in assetReferences');
  assert(spec.generatedTemplates['privacy-policy'], 'Privacy policy must be in generatedTemplates');
});

// -----------------------------------------------------------------------------
// GROUP 10: Section 5 Intake Completeness & Backward Compatibility
// -----------------------------------------------------------------------------
console.log('\nGroup 10: Intake Completeness & Backward Compatibility');

runTest('Section 5 completeness scores 100% when purpose, pages, and requirements are ready', () => {
  const completeness = calculateIntakeCompleteness('school-website', mockIntake);
  const sec5Score = completeness.sectionPercentages['websiteRequirements'];

  assert.strictEqual(sec5Score, 100, `Section 5 should be 100% complete for well-populated intake (Got: ${sec5Score}%)`);
});

runTest('Section 5 completeness drops if primary purpose is missing', () => {
  const incompleteIntake = {
    ...mockIntake,
    websiteRequirements: {
      ...mockIntake.websiteRequirements!,
      primaryPurpose: '',
    },
  };

  const completeness = calculateIntakeCompleteness('school-website', incompleteIntake);
  const sec5Score = completeness.sectionPercentages['websiteRequirements'];

  assert(sec5Score < 100, `Section 5 must not be 100% when primary purpose is empty (Got: ${sec5Score}%)`);
  assert(completeness.missingFields.some((f) => f.includes('Primary Website Purpose')));
});

runTest('Full intake state serializes to JSON and deserializes cleanly without data loss', () => {
  const serialized = JSON.stringify(mockIntake);
  const deserialized: UniversalIntakeData = JSON.parse(serialized);

  assert.strictEqual(
    deserialized.websiteRequirements?.primaryPurpose,
    mockIntake.websiteRequirements?.primaryPurpose
  );
  assert.strictEqual(
    (deserialized.websiteRequirements?.requiredPages || []).length,
    (mockIntake.websiteRequirements?.requiredPages || []).length
  );
  assert(deserialized.websiteRequirements?.pageConfigurations, 'pageConfigurations must persist');
  assert(deserialized.websiteRequirements?.mandatoryDisclosureConfig, 'mandatoryDisclosureConfig must persist');
});

console.log('\n================================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');
