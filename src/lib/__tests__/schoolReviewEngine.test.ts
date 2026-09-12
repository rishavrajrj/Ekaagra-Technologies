/**
 * ==============================================================================
 * TEST SUITE: Centralized School Review & Website Readiness Engine
 * File: src/lib/__tests__/schoolReviewEngine.test.ts
 * ==============================================================================
 */

import test from 'node:test';
import assert from 'node:assert';
import type {
  SchoolProject,
  SchoolIntakeSubmission,
  SchoolIntakeChangeRequest,
  UniversalIntakeData,
} from '../types';
import {
  evaluateSchoolReviewState,
  buildVerifiedSchoolWebsiteDataset,
  CANONICAL_REVIEWABLE_FIELDS,
} from '../schoolReviewEngine';
import { aggregateUniversalAssets } from '../universalVerificationEngine';

function createMockProject(overrides?: Partial<SchoolProject>): SchoolProject {
  return {
    id: 'proj-uuid-101',
    project_number: 'SCH-2026-9999',
    domain: 'SCHOOL',
    lead_reference: 'LEAD-2026-001',
    source_system: 'EKAAGRA_WEBSITE',
    school_name: 'St. Xavier Global Academy',
    primary_contact_name: 'Dr. Xavier Francis',
    primary_contact_email: 'principal@xavierglobal.edu',
    primary_contact_phone: '+91 9876543210',
    product_id: 'school-complete',
    status: 'draft',
    media_status: 'not_started',
    completeness_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function createMockSubmission(payloadOverrides?: Partial<UniversalIntakeData>, completeness = 100): SchoolIntakeSubmission {
  const payload: UniversalIntakeData = {
    schoolProfile: {
      schoolName: 'St. Xavier Global Academy',
      board: 'CBSE',
      legalInstitutionName: 'St. Xavier Educational Trust',
      tagline: 'Excellence in Faith and Knowledge',
      yearOfEstablishment: '1995',
      schoolType: 'Day School',
      genderType: 'Co-Educational',
      dayBoardingType: 'Day',
      aboutSchool: 'A premier educational institute focused on holistic student development.',
      vision: 'To nurture global leaders of tomorrow.',
      mission: 'Empowering minds through values and scholarship.',
      motto: 'Knowledge is Light',
      primaryPhone: '+91 9876543210',
      officialEmail: 'info@xavierglobal.edu',
      website: 'https://xavierglobal.edu',
      addressLine1: '123 Academy Road',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800001',
      country: 'India',
    },
    campuses: [
      {
        id: 'main-campus',
        name: 'Main Campus',
        campusCode: 'MAIN',
        campusType: 'Main',
        isMainCampus: true,
        address: '123 Academy Road',
        city: 'Patna',
        state: 'Bihar',
        pincode: '800001',
        country: 'India',
        phone: '+91 9876543210',
        email: 'main@xavierglobal.edu',
        activeGradesOffered: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        facilities: ['Science Lab', 'Library', 'Auditorium', 'Playground'],
        images: [
          {
            id: 'campus-hero-1',
            url: 'https://cdn.example.com/campus-hero.jpg',
            category: 'campus_buildings',
            caption: 'Main Campus Building',
          },
        ],
      },
    ],
    leadership: {
      principalName: 'Dr. Xavier Francis',
      principalPhoto: {
        id: 'principal_photo',
        url: 'https://cdn.example.com/principal.jpg',
        name: 'principal.jpg',
        status: 'verified',
      } as any,
    },
    institutionStructure: {
      gradesOffered: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      streamsOffered: ['Science', 'Commerce'],
      languagesTaught: ['English', 'Hindi', 'Sanskrit'],
      studentTeacherRatio: '20:1',
      academicCalendarType: 'April to March',
      termStructure: 'Semester',
    },
    curriculum: {
      board: 'CBSE',
      gradeRange: 'Class 1 to 10',
      streamsOffered: ['Science', 'Commerce'],
      languagesTaught: ['English', 'Hindi', 'Sanskrit'],
    },
    admissions: {
      admissionStatus: 'Open',
      processDescription: 'Online registration followed by parent interaction.',
      ageCriteria: 'Minimum 5 years for Class 1',
      applicationFee: '1000',
      keyDates: 'Registrations close on March 31',
      requiredDocuments: 'Birth Certificate, Transfer Certificate, Previous Report Card',
    },
    feesConfiguration: {
      academicFees: '50000 - 80000 per annum',
      paymentTerms: 'Quarterly installments',
      optionalFees: 'Transport, Cafeteria, Special Sports Coaching',
    },
    facilitiesConfig: {
      sportsFacilities: ['Cricket Ground', 'Basketball Court', 'Swimming Pool'],
      scienceLabs: ['Physics Lab', 'Chemistry Lab', 'Biology Lab'],
      computerLabs: ['Senior Computer Center', 'Junior IT Room'],
      libraryFacilities: ['Central Reference Library', 'Digital Reading Corner'],
      transportSafety: ['GPS-enabled buses', 'CCTV monitoring', 'Speed governors'],
    },
    schoolContent: {
      principalMessage: 'Welcome to our vibrant campus where dreams take wing.',
      chairmanMessage: 'Committed to shaping responsible citizens.',
      coreValues: ['Integrity', 'Empathy', 'Excellence', 'Innovation'],
      achievements: ['Ranked #1 in Patna for STEM education', 'National Science Olympiad Winners'],
    },
    brandingDesign: {
      brandTone: 'Academic & Scholarly',
      logoUrl: 'https://cdn.example.com/xavier-logo.png',
      logo: 'https://cdn.example.com/xavier-logo.png',
      heroImageUrl: 'https://cdn.example.com/xavier-hero.jpg',
    },
    ...payloadOverrides,
  };

  return {
    id: 'sub-uuid-001',
    school_project_id: 'proj-uuid-101',
    intake_payload: payload,
    version_number: 1,
    is_current: true,
    completeness_percentage: completeness,
    submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

test('evaluateSchoolReviewState: Empty or Draft submission is BLOCKED and LOCKED', () => {
  const project = createMockProject({ status: 'draft', completeness_percentage: 0 });
  const result = evaluateSchoolReviewState(project, null, []);

  assert.strictEqual(result.submissionStatus, 'draft');
  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.strictEqual(result.provisioningStatus, 'LOCKED');
  assert.strictEqual(result.overallReviewPercentage, 0);
  assert.ok(result.blockers.length > 0);
});

test('evaluateSchoolReviewState: Incomplete submission (< 100%) is BLOCKED', () => {
  const project = createMockProject({ status: 'draft', completeness_percentage: 60 });
  const submission = createMockSubmission({}, 60);
  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.submissionStatus, 'incomplete');
  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.strictEqual(result.provisioningStatus, 'LOCKED');
  assert.ok(result.blockers.some((b) => b.id === 'blocker-submission-incomplete'));
});

test('evaluateSchoolReviewState: 100% submission with unreviewed fields is BLOCKED', () => {
  const project = createMockProject({ status: 'submitted', completeness_percentage: 100 });
  const submission = createMockSubmission({}, 100);
  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.submissionStatus, 'complete');
  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.strictEqual(result.provisioningStatus, 'LOCKED');
  assert.ok(result.contentReviewStatus !== 'approved');
  assert.ok(result.blockers.length > 0);
});

test('evaluateSchoolReviewState: Open change requests prevent website readiness', () => {
  const project = createMockProject({
    status: 'submitted',
    completeness_percentage: 100,
  });
  const submission = createMockSubmission({}, 100);
  const cr: SchoolIntakeChangeRequest = {
    id: 'cr-101',
    school_project_id: project.id,
    section_key: 'schoolProfile',
    field_key: 'schoolProfile.officialEmail',
    request_type: 'correction',
    reason: 'Typo in domain',
    request_comment: 'Please use the official edu domain.',
    requested_by: 'Ekaagra Reviewer',
    status: 'waiting_for_school',
    created_at: new Date().toISOString(),
  };

  const result = evaluateSchoolReviewState(project, submission, [cr]);

  assert.strictEqual(result.websiteReadiness, 'BLOCKED');
  assert.strictEqual(result.changeRequestsSummary.waitingForSchool, 1);
  assert.ok(result.blockers.some((b) => b.id.includes('field-cr')));
});

test('evaluateSchoolReviewState: Full verification passes and unlocks readiness', () => {
  const submission = createMockSubmission({}, 100);
  const aggregatedAssets = aggregateUniversalAssets(submission.intake_payload as UniversalIntakeData);

  // Mock full field verification
  const fieldReviews: Record<string, any> = {};
  CANONICAL_REVIEWABLE_FIELDS.forEach((f) => {
    fieldReviews[f.key] = {
      sectionKey: f.sectionKey,
      fieldKey: f.key,
      status: 'verified',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Test Reviewer',
    };
  });

  const mediaReviews: Record<string, any> = {};
  aggregatedAssets.forEach((a) => {
    mediaReviews[a.id] = { assetId: a.id, status: 'approved' };
  });

  const project = createMockProject({
    status: 'submitted',
    completeness_percentage: 100,
    metadata: {
      fieldReviews,
      mediaReviews,
    },
  });

  const result = evaluateSchoolReviewState(project, submission, []);

  assert.strictEqual(result.submissionStatus, 'complete');
  assert.strictEqual(result.contentReviewStatus, 'approved');
  assert.strictEqual(result.mediaReviewStatus, 'approved');
  assert.strictEqual(result.websiteReadiness, 'READY');
  assert.strictEqual(result.blockers.length, 0);
});

test('evaluateSchoolReviewState: Provisioning is LOCKED until final approval is provided', () => {
  const sub = createMockSubmission({}, 100);
  const aggregatedAssets = aggregateUniversalAssets(sub.intake_payload as UniversalIntakeData);

  const fieldReviews: Record<string, any> = {};
  CANONICAL_REVIEWABLE_FIELDS.forEach((f) => {
    fieldReviews[f.key] = {
      sectionKey: f.sectionKey,
      fieldKey: f.key,
      status: 'verified',
      updatedAt: new Date().toISOString(),
      updatedBy: 'Test Reviewer',
    };
  });

  const mediaReviews: Record<string, any> = {};
  aggregatedAssets.forEach((a) => {
    mediaReviews[a.id] = { assetId: a.id, status: 'approved' };
  });

  // 1. Ready but not approved -> Provisioning LOCKED
  const projectNotApproved = createMockProject({
    status: 'submitted',
    completeness_percentage: 100,
    metadata: { fieldReviews, mediaReviews },
  });
  const resNotApproved = evaluateSchoolReviewState(projectNotApproved, sub, []);
  assert.strictEqual(resNotApproved.websiteReadiness, 'READY');
  assert.strictEqual(resNotApproved.provisioningStatus, 'LOCKED');

  // 2. Final approved -> Provisioning READY
  const projectApproved = createMockProject({
    status: 'approved',
    completeness_percentage: 100,
    metadata: {
      fieldReviews,
      mediaReviews,
      finalApproval: {
        approvedAt: new Date().toISOString(),
        approvedBy: 'Admin Sign-Off',
        notes: 'Ready for deployment',
      },
    },
  });
  const resApproved = evaluateSchoolReviewState(projectApproved, sub, []);
  assert.strictEqual(resApproved.websiteReadiness, 'READY');
  assert.strictEqual(resApproved.provisioningStatus, 'READY');

  // 3. Handed off -> Provisioning HANDED_OFF
  const projectHandedOff = createMockProject({
    status: 'handed_off',
    completeness_percentage: 100,
    metadata: {
      fieldReviews,
      mediaReviews,
      finalApproval: { approvedAt: new Date().toISOString(), approvedBy: 'Admin' },
    },
  });
  const resHandedOff = evaluateSchoolReviewState(projectHandedOff, sub, []);
  assert.strictEqual(resHandedOff.provisioningStatus, 'HANDED_OFF');
});

test('buildVerifiedSchoolWebsiteDataset: Generates verified payload and asserts integrity', () => {
  const submission = createMockSubmission({}, 100);
  const project = createMockProject({
    status: 'approved',
    completeness_percentage: 100,
  });

  const dataset = buildVerifiedSchoolWebsiteDataset(project, submission);

  assert.ok(dataset !== null);
  assert.strictEqual(dataset.school.name, 'St. Xavier Global Academy');
  assert.strictEqual(dataset.school.board, 'CBSE');
  assert.strictEqual(dataset.campuses.length, 1);
  assert.strictEqual(dataset.campuses[0].name, 'Main Campus');
  assert.strictEqual(dataset.branding.logoUrl, 'https://cdn.example.com/xavier-logo.png');
});
