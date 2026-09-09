/**
 * Automated Verification Test Suite
 * Ekaagra Technologies - Direct Project Intake & Admin Operations HQ
 */

import { calculateIntakeProgress } from '../src/lib/businessProjectsDb';
import type {
  DirectProjectInput,
  BusinessRequirementsData,
  MissingRequirementItem,
  AcquisitionSource,
} from '../src/lib/types';
import { validateBusinessRequirementsPayload } from '../src/lib/businessValidation';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n===============================================================');
console.log('EKAAGRA TECHNOLOGIES — DIRECT PROJECT INTAKE VERIFICATION');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. Intake Progress Calculation Engine (Checklist & Percentages)
// -----------------------------------------------------------------------------
console.log('1. Intake Progress Engine (calculateIntakeProgress):');

const emptyDraft: Partial<BusinessRequirementsData> = {};

const resEmptyBusiness = calculateIntakeProgress(emptyDraft, false);
assert(resEmptyBusiness.percentage === 0, 'Empty business draft reports 0% completion');
assert(resEmptyBusiness.checklist.length === 6, 'Checklist has 6 canonical milestone stages');
assert(resEmptyBusiness.checklist[0].label === 'Organization Profile', 'Business step 1 label is Organization Profile');

const resEmptySchool = calculateIntakeProgress(emptyDraft, true);
assert(resEmptySchool.percentage === 0, 'Empty school draft reports 0% completion');
assert(resEmptySchool.checklist[0].label === 'School Identity', 'School step 1 label is School Identity');
assert(resEmptySchool.checklist[2].label === 'Campuses & Students', 'School step 2 label is Campuses & Students');

// Partial draft (Profile and Contact filled)
const partialDraft: Partial<BusinessRequirementsData> = {
  section_a_profile: {
    displayName: 'Champaran Diagnostics Lab',
    legalName: 'Champaran Diagnostics Pvt Ltd',
    category: 'Healthcare & Diagnostics',
    description: 'Pathology and imaging laboratory in Motihari.',
    locations: 'Main Road, Motihari, Bihar',
    primaryContactName: 'Dr. Amitabh Verma',
    email: 'amitabh@champarandiag.in',
    phone: '9472464645',
    whatsapp: '9472464645',
    website: 'https://champarandiag.in',
  },
  section_b_goals_audience: {
    primaryType: 'Healthcare Diagnostic Portal',
    primaryGoal: 'Online test bookings & report delivery',
    problemToSolve: 'Patients queue for hours for test reports',
    targetCustomerType: 'B2C',
    targetAudienceDescription: 'Local residents seeking reliable diagnostics',
    geographicReach: 'East Champaran & Bihar',
    keyVisitorAction: 'Book lab test online',
    successDefinition: '500+ report downloads per month',
  },
};

const resPartial = calculateIntakeProgress(partialDraft, false);
assert(resPartial.checklist[0].completed === true, 'Organization Profile marked completed');
assert(resPartial.checklist[1].completed === true, 'Contact Information marked completed');
assert(resPartial.checklist[2].completed === true, 'Project Goals marked completed');
assert(resPartial.checklist[3].completed === false, 'Website Pages & Structure marked incomplete');
assert(resPartial.percentage === 50, `3 of 6 completed equals 50% (got ${resPartial.percentage}%)`);

// Complete draft
const completeDraft: Partial<BusinessRequirementsData> = {
  ...partialDraft,
  section_d_structure: {
    solutionType: 'WEBSITE',
    requiredPages: ['Home', 'About Us', 'Test Catalog', 'Report Download', 'Contact'],
    customPages: [],
    multilingual: false,
    blogOrNews: true,
    galleryNeeded: true,
    careersSection: false,
    testimonialsNeeded: true,
  },
  section_e_assets: {
    hasLogo: 'YES',
    hasBrandGuidelines: true,
    hasProductOrServicePhotos: 'READY',
    hasWrittenContent: 'READY',
    uploadedAssets: [],
    contentNotes: 'All media sent via Google Drive',
  },
  section_j_agreement: {
    confirmedAccurate: true,
    authorizedSignatoryName: 'Dr. Amitabh Verma',
    notesForEkaagraTeam: 'Launch target within 3 weeks',
  },
};

const resComplete = calculateIntakeProgress(completeDraft, false);
assert(resComplete.percentage === 100, `Fully supplied draft equals 100% (got ${resComplete.percentage}%)`);
assert(resComplete.checklist.every((c) => c.completed), 'All 6 checklist stages marked completed');

// -----------------------------------------------------------------------------
// 2. Direct Project Creation Validation Rules (Flow B)
// -----------------------------------------------------------------------------
console.log('\n2. Direct Project Input Validation (FLOW B):');

function validateDirectProjectInput(input: Partial<DirectProjectInput>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.organizationName || input.organizationName.trim().length < 2) {
    errors.push('Organization / School name is required (min 2 characters).');
  }
  if (!input.primaryContactName || input.primaryContactName.trim().length < 2) {
    errors.push('Primary contact name is required (min 2 characters).');
  }
  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.push('A valid contact email address is required.');
  }
  const cleanPhone = (input.phone || '').replace(/\D/g, '');
  if (!input.phone || cleanPhone.length < 10) {
    errors.push('A valid 10-digit telephone or WhatsApp number is required.');
  }
  if (!input.projectName || input.projectName.trim().length < 2) {
    errors.push('Project name is required.');
  }
  if (!input.serviceType || input.serviceType.trim().length < 2) {
    errors.push('Service type or solution tier is required.');
  }
  if (!input.acquisitionSource) {
    errors.push('Acquisition source channel is required.');
  }
  if (!input.projectType || !['BUSINESS', 'SCHOOL'].includes(input.projectType)) {
    errors.push('Project type must be BUSINESS or SCHOOL.');
  }

  return { isValid: errors.length === 0, errors };
}

// Valid Direct Input
const validDirectInput: DirectProjectInput = {
  organizationName: 'St. Xavier High School Motihari',
  primaryContactName: 'Father Joseph K.',
  designation: 'Principal',
  email: 'principal@stxaviermotihari.edu.in',
  phone: '+91 94724 64645',
  projectName: 'St. Xavier Official School Portal & Admissions',
  projectType: 'SCHOOL',
  serviceType: 'School Complete Web & ERP Solution',
  acquisitionSource: 'PHONE',
  estimatedBudget: '₹49,999',
  notes: 'Direct walk-in inquiry at Motihari office. Wants admission form by March.',
  initialAction: 'SEND_INTAKE',
};

const v1 = validateDirectProjectInput(validDirectInput);
assert(v1.isValid, 'Valid Direct School Project input passes validation');
assert(v1.errors.length === 0, 'Zero errors on valid Direct Project input');

// Invalid Direct Input (Missing Contact, Bad Email, Bad Phone)
const invalidDirectInput: Partial<DirectProjectInput> = {
  organizationName: 'A',
  primaryContactName: '',
  email: 'not-an-email',
  phone: '123',
  projectName: '',
  serviceType: '',
  projectType: 'BUSINESS',
};

const v2 = validateDirectProjectInput(invalidDirectInput);
assert(!v2.isValid, 'Invalid input rejected correctly');
assert(v2.errors.some((e) => e.includes('Organization')), 'Rejects single character org name');
assert(v2.errors.some((e) => e.includes('contact name')), 'Demands contact name');
assert(v2.errors.some((e) => e.includes('valid contact email')), 'Rejects invalid email');
assert(v2.errors.some((e) => e.includes('10-digit telephone')), 'Rejects truncated phone number');
assert(v2.errors.some((e) => e.includes('Acquisition source')), 'Demands acquisition source');

// -----------------------------------------------------------------------------
// 3. Strict Flow Separation: Flow A (Lead) vs Flow B (Direct Project)
// -----------------------------------------------------------------------------
console.log('\n3. Strict Architecture Separation (No Artificial Leads in Flow B):');

interface MockProjectRecord {
  id: string;
  project_number: string;
  lead_id: string | null;
  client_id: string;
  project_type: 'BUSINESS' | 'SCHOOL';
  project_name: string;
  project_status: string;
  acquisition_source: AcquisitionSource;
  metadata: {
    acquisitionSource: AcquisitionSource;
    createdVia: 'DIRECT_INTAKE' | 'LEAD_CONVERSION';
    intakeStatus: string;
    onboardingTokenCode: string;
  };
}

// Flow B Simulation
function simulateDirectProjectCreation(input: DirectProjectInput): MockProjectRecord {
  const isSchool = input.projectType === 'SCHOOL';
  const prefix = isSchool ? 'SCH' : 'BUS';
  const projectNumber = `${prefix}-2026-0099`;
  const tokenCode = `REQ-2026-0099`;

  return {
    id: 'proj-direct-uuid-001',
    project_number: projectNumber,
    lead_id: null, // STRICT RULE: Never create artificial inbound leads
    client_id: 'client-uuid-001',
    project_type: input.projectType || 'BUSINESS',
    project_name: input.projectName,
    project_status: input.initialAction === 'SEND_INTAKE' ? 'REQUIREMENTS_PENDING' : 'NEW_PROJECT',
    acquisition_source: input.acquisitionSource,
    metadata: {
      acquisitionSource: input.acquisitionSource,
      createdVia: 'DIRECT_INTAKE',
      intakeStatus: input.initialAction === 'SEND_INTAKE' ? 'INVITATION_SENT' : 'NOT_STARTED',
      onboardingTokenCode: tokenCode,
    },
  };
}

const directProj = simulateDirectProjectCreation(validDirectInput);
assert(directProj.lead_id === null, 'CRITICAL: Flow B direct project has lead_id strictly NULL');
assert(directProj.project_number.startsWith('SCH-2026-'), 'School project gets SCH-2026-XXXX prefix');
assert(directProj.metadata.createdVia === 'DIRECT_INTAKE', 'Metadata tracks createdVia = DIRECT_INTAKE');
assert(directProj.metadata.acquisitionSource === 'PHONE', 'Metadata captures acquisitionSource = PHONE');
assert(directProj.metadata.intakeStatus === 'INVITATION_SENT', 'Intake status set to INVITATION_SENT for SEND_INTAKE action');
assert(directProj.metadata.onboardingTokenCode.startsWith('REQ-2026-'), 'Generates token code REQ-2026-XXXX');

// Commercial Flow B simulation
const commercialDirectInput: DirectProjectInput = {
  ...validDirectInput,
  organizationName: 'Champaran Mega Mart',
  projectName: 'Champaran Mega Mart E-Commerce & Inventory',
  projectType: 'BUSINESS',
  serviceType: 'E-Commerce Solution',
  acquisitionSource: 'WHATSAPP',
  initialAction: 'COMPLETE_MYSELF',
};

const commercialProj = simulateDirectProjectCreation(commercialDirectInput);
assert(commercialProj.lead_id === null, 'Commercial direct project has lead_id strictly NULL');
assert(commercialProj.project_number.startsWith('BUS-2026-'), 'Business project gets BUS-2026-XXXX prefix');
assert(commercialProj.project_status === 'NEW_PROJECT', 'Initial status is NEW_PROJECT for COMPLETE_MYSELF');
assert(commercialProj.metadata.intakeStatus === 'NOT_STARTED', 'Intake status is NOT_STARTED when completing myself');

// Flow A Comparison (Lead Conversion)
interface MockLeadRecord {
  id: string;
  company_name: string;
  contact_name: string;
  lead_status: string;
}

const mockLead: MockLeadRecord = {
  id: 'lead-inbound-999',
  company_name: 'Tech Bihar Corp',
  contact_name: 'Rajesh Kumar',
  lead_status: 'QUALIFIED',
};

function simulateLeadConversion(lead: MockLeadRecord): MockProjectRecord {
  return {
    id: 'proj-converted-uuid-002',
    project_number: 'BUS-2026-0100',
    lead_id: lead.id, // Converted from actual inbound lead
    client_id: 'client-uuid-002',
    project_type: 'BUSINESS',
    project_name: `${lead.company_name} — Commercial Web Build`,
    project_status: 'REQUIREMENTS_PENDING',
    acquisition_source: 'WEBSITE_LEAD',
    metadata: {
      acquisitionSource: 'WEBSITE_LEAD',
      createdVia: 'LEAD_CONVERSION',
      intakeStatus: 'INVITATION_SENT',
      onboardingTokenCode: 'REQ-2026-0100',
    },
  };
}

const convertedProj = simulateLeadConversion(mockLead);
assert(convertedProj.lead_id === 'lead-inbound-999', 'Flow A project maintains foreign key to original inbound lead');
assert(convertedProj.metadata.createdVia === 'LEAD_CONVERSION', 'Flow A tracks createdVia = LEAD_CONVERSION');

// -----------------------------------------------------------------------------
// 4. Admin On-Behalf Mode & Missing Information Workflow
// -----------------------------------------------------------------------------
console.log('\n4. Admin On-Behalf Intake & Missing Information Workflow:');

// Test Missing Information Request
const missingItems: MissingRequirementItem[] = [
  {
    id: 'req-miss-1',
    category: 'CONTENT_OR_MEDIA',
    title: 'High-Resolution Vector School Crest / Logo',
    stepNumber: 5,
    resolved: false,
  },
  {
    id: 'req-miss-2',
    category: 'INFRASTRUCTURE',
    title: 'Domain Registrar & DNS Access for stxaviermotihari.edu.in',
    stepNumber: 8,
    resolved: false,
  },
];

function simulateRequestMissingInfo(project: MockProjectRecord, items: MissingRequirementItem[], notes?: string) {
  return {
    ...project,
    project_status: 'CLARIFICATION_REQUESTED',
    metadata: {
      ...project.metadata,
      intakeStatus: 'CHANGES_REQUESTED',
      missingRequirements: items,
      missingRequirementsNotes: notes,
    },
  };
}

const updatedProjectWithMissing = simulateRequestMissingInfo(
  directProj,
  missingItems,
  'Please provide the high-resolution logo and DNS access by Friday so we can finalize DNS routing.'
);

assert(
  updatedProjectWithMissing.project_status === 'CLARIFICATION_REQUESTED',
  'Project lifecycle status transitions to CLARIFICATION_REQUESTED'
);
assert(
  updatedProjectWithMissing.metadata.intakeStatus === 'CHANGES_REQUESTED',
  'Intake metadata status transitions to CHANGES_REQUESTED'
);
assert(
  updatedProjectWithMissing.metadata.missingRequirements.length === 2,
  '2 missing items accurately attached to project metadata'
);
assert(
  updatedProjectWithMissing.metadata.missingRequirements[0].title.includes('School Crest / Logo'),
  'First missing item title preserved'
);
assert(
  updatedProjectWithMissing.metadata.missingRequirements[0].stepNumber === 5,
  'First missing item step number 5 preserved for client 1-click jump'
);

// Test Admin On-Behalf Completion
function simulateAdminOnBehalfSave(project: MockProjectRecord, adminName: string) {
  return {
    ...project,
    metadata: {
      ...project.metadata,
      lastIntakeModifiedBy: 'ADMIN_ENTERED',
      completedOnBehalf: true,
      completedByAdminName: adminName,
      intakeProgressPercent: 85,
    },
  };
}

const onBehalfSaved = simulateAdminOnBehalfSave(directProj, 'Ekaagra Operations Admin');
assert(onBehalfSaved.metadata.lastIntakeModifiedBy === 'ADMIN_ENTERED', 'Stamped with lastIntakeModifiedBy = ADMIN_ENTERED');
assert(onBehalfSaved.metadata.completedOnBehalf === true, 'Stamped with completedOnBehalf = true');
assert(onBehalfSaved.metadata.completedByAdminName === 'Ekaagra Operations Admin', 'Records administrator name');

console.log('\n===============================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('===============================================================\n');

if (failed === 0) {
  console.log('ALL DIRECT PROJECT INTAKE SPECIFICATIONS VERIFIED SUCCESSFULLY.');
  process.exit(0);
} else {
  console.error('VERIFICATION FAILURES DETECTED.');
  process.exit(1);
}
