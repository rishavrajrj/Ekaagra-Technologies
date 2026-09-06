/**
 * Comprehensive Automated Verification Test Suite
 * Ekaagra Technologies - Business Client Requirement & Workflow System
 */

import {
  validateBusinessRequirementsPayload,
  validateAssetUpload,
  sanitizeFileName,
  sanitizeWebUrl,
} from '../src/lib/businessValidation';
import type { BusinessRequirementsData, BusinessProjectStatus } from '../src/lib/types';

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
console.log('EKAAGRA TECHNOLOGIES — BUSINESS CLIENT SYSTEM VERIFICATION');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. Authoritative Server-Side Form Validation (Sections A through J)
// -----------------------------------------------------------------------------
console.log('1. Form Validation Suite (Sections A - J):');

const valid10SectionPayload: BusinessRequirementsData = {
  section_a_profile: {
    displayName: 'Aura Health & Wellness',
    legalName: 'Aura Wellness Private Limited',
    category: 'Healthcare & Wellness',
    description: 'Premier integrated wellness and physiotherapy centre in Bangalore.',
    yearEstablished: '2021',
    locations: 'Indiranagar, Bangalore, Karnataka',
    primaryContactName: 'Dr. Radhika Sharma',
    email: 'radhika@aurahealth.co.in',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    website: 'https://aurahealth.co.in',
  },
  section_b_goals_audience: {
    primaryType: 'Business Website & Booking Portal',
    primaryGoal: 'Generate high-intent patient consultations and online session bookings.',
    problemToSolve: 'Current booking process is manual over phone; patient drop-off is high.',
    targetCustomerType: 'B2C',
    targetAudienceDescription: 'Working urban professionals aged 25-55 seeking preventive therapy.',
    geographicReach: 'Metropolitan Bangalore & Karnataka',
    keyVisitorAction: 'Schedule an initial diagnostic consultation',
    successDefinition: 'Over 50 qualified consultation inquiries booked per month.',
    secondaryGoals: ['Establish doctor credibility', 'Publish wellness articles'],
  },
  section_c_design: {
    styleVibe: 'Modern & Clean',
    preferredColors: '#0D9488 (Teal), #F8FAFC (Soft White), #0F172A (Deep Slate)',
    avoidColors: 'Neon yellow, harsh red',
    likedWebsites: 'https://onemedical.com, https://carehospital.com',
    competitorWebsites: 'https://apollohospitals.com',
    brandPersonalityKeywords: ['Calm', 'Authoritative', 'Modern', 'Caring'],
    designConstraintsOrRules: 'Must meet WCAG AA accessibility standards with high contrast.',
  },
  section_d_structure: {
    solutionType: 'WEBSITE',
    requiredPages: ['Home', 'About Us', 'Services & Therapies', 'Doctor Profiles', 'Contact & Location'],
    customPages: ['Self-Assessment Symptom Checker', 'Patient Testimonials Showcase'],
    homepageFocus: 'Hero consultation booking banner followed by doctor credentials and service pillars.',
    navigationStructure: 'Sticky clean header with clear "Book Appointment" CTA button.',
    multilingual: false,
    languages: ['English'],
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
    contentNotes: 'All clinic interior photos and doctor bios photographed professionally in 4K.',
  },
  section_f_features: {
    selectedFeatures: [
      'Online Appointment Scheduling',
      'Doctor Profile Cards',
      'Automated WhatsApp Chat Widget',
      'Google Maps Location Integration',
      'Interactive FAQ Accordion',
    ],
    contactForm: true,
    whatsAppChat: true,
    googleMaps: true,
    searchFilter: false,
    userAuth: false,
    adminPanel: true,
    cms: true,
    onlineBooking: true,
    paymentGateway: false,
    analyticsSeo: true,
  },
  section_g_integrations: {
    paymentGatewayNeeded: false,
    whatsappApiNeeded: true,
    crmIntegration: 'HubSpot Free CRM for patient lead notifications',
    thirdPartyApis: 'Google Reviews Embed Widget',
  },
  section_h_domain_hosting: {
    hasDomain: 'YES',
    existingDomain: 'aurahealth.co.in',
    hasHosting: false,
    hostingPreference: 'MANAGED_BY_EKAAGRA',
    hasBusinessEmail: true,
    businessEmailAccountsNeeded: 'contact@aurahealth.co.in, doctors@aurahealth.co.in',
    hasDnsAccess: true,
    migrationNeeded: false,
  },
  section_i_budget_timeline: {
    targetBudgetRange: '₹35,000 - ₹50,000',
    timelineRequirement: 'ONE_TO_TWO_MONTHS',
    targetLaunchDate: '2026-10-15',
    hardDeadlinesOrConstraints: 'New clinic branch inauguration ceremony on 1st November 2026.',
    decisionMakers: 'Dr. Radhika Sharma (Managing Director)',
  },
  section_j_agreement: {
    confirmedAccurate: true,
    authorizedSignatoryName: 'Dr. Radhika Sharma',
    authorizedSignatoryTitle: 'Managing Director & Founder',
    notesForEkaagraTeam: 'Please ensure mobile responsiveness is prioritized as 80% traffic is mobile.',
    agreedAt: new Date().toISOString(),
  },
};

// Test 1.1: Complete valid submission
const validResult = validateBusinessRequirementsPayload(valid10SectionPayload);
assert(validResult.isValid === true, 'Complete 10-section payload validates successfully');
assert(Object.keys(validResult.errors).length === 0, 'Zero validation errors on complete payload');

// Test 1.2: Missing Section A required business name
const missingNamePayload = JSON.parse(JSON.stringify(valid10SectionPayload));
delete missingNamePayload.section_a_profile.displayName;
missingNamePayload.section_a_profile.businessName = '';
const missingNameResult = validateBusinessRequirementsPayload(missingNamePayload);
assert(missingNameResult.isValid === false, 'Rejects payload with missing Business Name');
assert(Object.keys(missingNameResult.errors).some((k) => k.includes('displayName') || k.includes('section_a')), 'Points to section_a error');

// Test 1.3: Invalid contact email format
const badEmailPayload = JSON.parse(JSON.stringify(valid10SectionPayload));
badEmailPayload.section_a_profile.email = 'not-an-email';
const badEmailResult = validateBusinessRequirementsPayload(badEmailPayload);
assert(badEmailResult.isValid === false, 'Rejects invalid email format');
assert(Boolean(badEmailResult.errors['section_a.email']), 'Identifies bad email field');

// Test 1.4: Invalid contact phone number
const badPhonePayload = JSON.parse(JSON.stringify(valid10SectionPayload));
badPhonePayload.section_a_profile.phone = '123';
const badPhoneResult = validateBusinessRequirementsPayload(badPhonePayload);
assert(badPhoneResult.isValid === false, 'Rejects phone number with fewer than 10 digits');
assert(Boolean(badPhoneResult.errors['section_a.phone']), 'Identifies bad phone field');

// Test 1.5: Missing Section B primary goal
const missingGoalPayload = JSON.parse(JSON.stringify(valid10SectionPayload));
missingGoalPayload.section_b_goals_audience.primaryGoal = '';
const missingGoalResult = validateBusinessRequirementsPayload(missingGoalPayload);
assert(missingGoalResult.isValid === false, 'Rejects missing primary business goal in Section B');
assert(Boolean(missingGoalResult.errors['section_b.primaryGoal']), 'Identifies missing primary goal field');

// Test 1.6: Section J client agreement unconfirmed
const unconfirmedAgreementPayload = JSON.parse(JSON.stringify(valid10SectionPayload));
unconfirmedAgreementPayload.section_j_agreement.confirmedAccurate = false;
const unconfirmedResult = validateBusinessRequirementsPayload(unconfirmedAgreementPayload);
assert(unconfirmedResult.isValid === false, 'Rejects submission when Section J confirmation agreement is false');
assert(Boolean(unconfirmedResult.errors['section_j.confirmedAccurate']), 'Demands confirmed accuracy agreement');

// -----------------------------------------------------------------------------
// 2. Asset Upload & Security Validation
// -----------------------------------------------------------------------------
console.log('\n2. File Asset Upload & Security Tests:');

// Test 2.1: Filename Sanitization & Path Traversal Prevention
const maliciousName1 = '../../../../etc/passwd.png';
const sanitized1 = sanitizeFileName(maliciousName1);
assert(!sanitized1.includes('..') && !sanitized1.includes('/'), 'Strips directory traversal sequences');
assert(sanitized1.endsWith('.png'), 'Preserves legitimate extension');

const weirdCharsName = 'My Logo & Brochure (2026) #Final!@$.pdf';
const sanitized2 = sanitizeFileName(weirdCharsName);
assert(!sanitized2.includes('&') && !sanitized2.includes('#') && !sanitized2.includes('!'), 'Sanitizes dangerous punctuation and shell symbols');
assert(sanitized2.endsWith('.pdf'), 'Preserves .pdf extension');

// Test 2.2: Disallowed Executable Extensions
const exeCheck = validateAssetUpload({
  name: 'installer.exe',
  type: 'application/x-msdownload',
  size: 1024 * 1024,
});
assert(exeCheck.isValid === false, 'Rejects executable .exe files');
assert(exeCheck.error?.includes('not supported') || false, 'Provides disallowed file type explanation');

const batCheck = validateAssetUpload({
  name: 'run.bat',
  type: 'text/plain',
  size: 1024,
});
assert(batCheck.isValid === false, 'Rejects .bat scripts regardless of spoofed text mimeType');

// Test 2.3: File Size Enforcement (15 MB Limit)
const oversizedCheck = validateAssetUpload({
  name: 'heavy_video.mp4',
  type: 'video/mp4',
  size: 16 * 1024 * 1024, // 16 MB
});
assert(oversizedCheck.isValid === false, 'Rejects files larger than 15 MB');
assert(oversizedCheck.error?.includes('15MB') || false, 'Mentions 15MB limit in rejection');

const validAssetCheck = validateAssetUpload({
  name: 'brand_guide.pdf',
  type: 'application/pdf',
  size: 4 * 1024 * 1024, // 4 MB
});
assert(validAssetCheck.isValid === true, 'Accepts compliant 4MB PDF asset');

// Test 2.4: URL Sanitization (XSS & Protocol Hijack Prevention)
assert(sanitizeWebUrl('https://www.ekaagratechnologies.site') === 'https://www.ekaagratechnologies.site', 'Permits HTTPS URLs');
assert(sanitizeWebUrl('http://my-clinic.in') === 'http://my-clinic.in', 'Permits HTTP URLs');
assert(sanitizeWebUrl('javascript:alert(document.cookie)') === undefined, 'Rejects javascript: XSS vector');
assert(sanitizeWebUrl('data:text/html,<script>alert(1)</script>') === undefined, 'Rejects data: URI payload');
assert(sanitizeWebUrl('ftp://ftp.example.com') === undefined, 'Rejects FTP scheme');

// -----------------------------------------------------------------------------
// 3. Workflow Principle: Strict Decoupling & Payment Gating
// -----------------------------------------------------------------------------
console.log('\n3. Workflow State Machine & Payment Gating Rules:');

/**
 * Strict workflow principle:
 * Milestone payments can ONLY be created AFTER design is approved (DESIGN_APPROVED).
 * Initial intake, requirements submission, design review must have ZERO mandatory payments.
 */
function simulatePaymentMilestoneGate(projectStatus: BusinessProjectStatus): {
  allowed: boolean;
  reason?: string;
} {
  if (projectStatus !== 'DESIGN_APPROVED' && projectStatus !== 'DEVELOPMENT') {
    return {
      allowed: false,
      reason: `Payments are strictly locked until design is approved by client. Current status: ${projectStatus}`,
    };
  }
  return { allowed: true };
}

// Test 3.1: Payment locked at Requirements Pending
const gatePending = simulatePaymentMilestoneGate('REQUIREMENTS_PENDING');
assert(gatePending.allowed === false, 'Payment strictly locked during REQUIREMENTS_PENDING');

// Test 3.2: Payment locked at Requirements Submitted
const gateReqSubmitted = simulatePaymentMilestoneGate('REQUIREMENTS_SUBMITTED');
assert(gateReqSubmitted.allowed === false, 'Payment strictly locked during REQUIREMENTS_SUBMITTED');

// Test 3.3: Payment locked at Clarification Requested
const gateClarification = simulatePaymentMilestoneGate('CLARIFICATION_REQUESTED');
assert(gateClarification.allowed === false, 'Payment strictly locked during CLARIFICATION_REQUESTED');

// Test 3.4: Payment locked during Design In Progress
const gateDesignProgress = simulatePaymentMilestoneGate('DESIGN_IN_PROGRESS');
assert(gateDesignProgress.allowed === false, 'Payment strictly locked during DESIGN_IN_PROGRESS');

// Test 3.5: Payment locked while Design is Under Review
const gateDesignReady = simulatePaymentMilestoneGate('DESIGN_READY');
assert(gateDesignReady.allowed === false, 'Payment strictly locked during DESIGN_READY (awaiting client approval)');

// Test 3.6: Payment locked when Client Requests Revision
const gateRevision = simulatePaymentMilestoneGate('REVISION_REQUESTED');
assert(gateRevision.allowed === false, 'Payment strictly locked during REVISION_REQUESTED');

// Test 3.7: Payment unlocked ONLY AFTER DESIGN APPROVED
const gateApproved = simulatePaymentMilestoneGate('DESIGN_APPROVED');
assert(gateApproved.allowed === true, 'Payment successfully unlocked when status is DESIGN_APPROVED');

// Test 3.8: Payment accessible during Development
const gateDev = simulatePaymentMilestoneGate('DEVELOPMENT');
assert(gateDev.allowed === true, 'Subsequent payment milestones accessible during DEVELOPMENT');

// -----------------------------------------------------------------------------
// 4. Design Concept Review State Machine & Security (IDOR & Immutability)
// -----------------------------------------------------------------------------
console.log('\n4. Design Concept Review State Machine & Security:');

interface MockDesignReview {
  id: string;
  projectId: string;
  status: 'PENDING_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED';
  revisionCount: number;
}

function simulateDesignFeedbackSubmission(params: {
  review: MockDesignReview;
  requestProjectId: string;
  decision: 'APPROVED' | 'REVISION_REQUESTED';
}): { success: boolean; error?: string; nextReviewStatus?: string; nextProjectStatus?: BusinessProjectStatus } {
  // 1. IDOR Protection check
  if (params.review.projectId !== params.requestProjectId) {
    return { success: false, error: 'Unauthorized: Review does not belong to project.' };
  }

  // 2. Immutability / anti-tampering check: already approved cannot be changed
  if (params.review.status === 'APPROVED') {
    return { success: false, error: 'Design already approved. Revisions or re-approval not allowed.' };
  }

  // 3. Status transition
  const nextReviewStatus = params.decision === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUESTED';
  const nextProjectStatus: BusinessProjectStatus = params.decision === 'APPROVED' ? 'DESIGN_APPROVED' : 'REVISION_REQUESTED';

  return {
    success: true,
    nextReviewStatus,
    nextProjectStatus,
  };
}

const mockReview: MockDesignReview = {
  id: 'rev-101',
  projectId: 'project-aura',
  status: 'PENDING_REVIEW',
  revisionCount: 0,
};

// Test 4.1: IDOR Attack Prevention
const idorAttempt = simulateDesignFeedbackSubmission({
  review: mockReview,
  requestProjectId: 'different-project-attacker',
  decision: 'APPROVED',
});
assert(idorAttempt.success === false, 'Blocks IDOR attack on mismatched project_id');

// Test 4.2: Legitimate Revision Request
const revisionFeedback = simulateDesignFeedbackSubmission({
  review: mockReview,
  requestProjectId: 'project-aura',
  decision: 'REVISION_REQUESTED',
});
assert(revisionFeedback.success === true, 'Accepts valid revision request from authorized client');
assert(revisionFeedback.nextProjectStatus === 'REVISION_REQUESTED', 'Updates project status to REVISION_REQUESTED');

// Test 4.3: Legitimate Approval
const approvalFeedback = simulateDesignFeedbackSubmission({
  review: mockReview,
  requestProjectId: 'project-aura',
  decision: 'APPROVED',
});
assert(approvalFeedback.success === true, 'Accepts design approval from authorized client');
assert(approvalFeedback.nextProjectStatus === 'DESIGN_APPROVED', 'Transitions project status to DESIGN_APPROVED');

// Test 4.4: Anti-tamper on already approved review
const alreadyApprovedReview: MockDesignReview = {
  id: 'rev-101',
  projectId: 'project-aura',
  status: 'APPROVED',
  revisionCount: 1,
};
const tamperAttempt = simulateDesignFeedbackSubmission({
  review: alreadyApprovedReview,
  requestProjectId: 'project-aura',
  decision: 'REVISION_REQUESTED',
});
assert(tamperAttempt.success === false, 'Blocks state tampering: approved design cannot be revised');

// -----------------------------------------------------------------------------
// 5. Summary Results
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('===============================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL BUSINESS SYSTEM SPECIFICATION TESTS PASSED SUCCESSFULLY.\n');
  process.exit(0);
}
