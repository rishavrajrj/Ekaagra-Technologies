/**
 * ==============================================================================
 * EKAAGRA TECHNOLOGIES — HIERARCHICAL ONBOARDING NAVIGATION E2E SUITE
 * End-to-End Simulation of Sequential Child Navigation & Boundary Conditions
 * File: scripts/test-hierarchical-navigation-e2e.ts
 * ==============================================================================
 */

import assert from 'node:assert/strict';
import {
  buildHierarchicalNavigation,
  flattenNavigableSteps,
  getNextNavigableStep,
  getPreviousNavigableStep,
  resolveStepFromSlugOrUrl,
  buildStepUrlPath,
  findStepIndex,
  getStepChangeRequestCount,
} from '../src/lib/schoolNavigationHierarchy';
import {
  getApplicableSections,
  INTAKE_SECTIONS,
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import {
  calculateCurriculumCompleteness,
  calculateCurriculumSubStepCompleteness,
} from '../src/lib/academicCompletenessEngine';
import type { UniversalIntakeData, SchoolIntakeChangeRequest } from '../src/lib/types';

console.log('==================================================================');
console.log('🧪 RUNNING HIERARCHICAL ONBOARDING NAVIGATION E2E SUITE');
console.log('==================================================================\n');

// -----------------------------------------------------------------------------
// SCENARIO A: Setup Canonical Multi-Tenant Project & Build Navigation Tree
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO A] Initializing navigation tree and flattening steps...');

const mockToken = 'mock-auth-token-778899';
const intakeData = createInitialIntakeData('Greenwood International School', 'ICSE');
const applicableSections = getApplicableSections('school-complete', intakeData);

assert.ok(applicableSections.length > 5, 'Applicable sections must be populated');
const curriculumSec = applicableSections.find((s) => s.key === 'curriculum');
assert.ok(curriculumSec, 'Curriculum section must be in applicable sections');

const hierarchy = buildHierarchicalNavigation(applicableSections, intakeData, 'school-complete');
assert.ok(hierarchy.length === applicableSections.length, 'Tree root count matches applicable sections');

const currNode = hierarchy.find((n) => n.sectionKey === 'curriculum');
assert.ok(currNode?.children && currNode.children.length === 3, 'Curriculum must declare exactly 3 children');
assert.deepEqual(
  currNode.children.map((c) => c.subTabKey),
  ['overview', 'class_curriculum', 'subjects'],
  'Curriculum children must follow [overview, class_curriculum, subjects]'
);

const flattenedSteps = flattenNavigableSteps(hierarchy);
assert.ok(flattenedSteps.length > applicableSections.length, 'Flattened steps include child sub-pages');

console.log(`  ✓ Root sections: ${hierarchy.length}`);
console.log(`  ✓ Flattened sequential navigable steps: ${flattenedSteps.length}`);
console.log('  ✓ Scenario A passed.\n');

// -----------------------------------------------------------------------------
// SCENARIO B: Forward Linear Progression through Curriculum Sub-Pages
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO B] Simulating forward linear traversal through nested Curriculum...');

// 1. Locate curriculum in the flattened steps
const overviewIdx = flattenedSteps.findIndex((s) => s.sectionKey === 'curriculum' && s.subTabKey === 'overview');
assert.ok(overviewIdx > 0, 'Overview index must be found');
const stepOverview = flattenedSteps[overviewIdx];

// Verify preceding section
const precedingSection = flattenedSteps[overviewIdx - 1];
console.log(`  Current position: ${precedingSection.title} (${precedingSection.id})`);
console.log(`  Clicking [Continue →]...`);

const nextFromPreceding = getNextNavigableStep(precedingSection, flattenedSteps);
assert.ok(nextFromPreceding);
assert.equal(nextFromPreceding.sectionKey, 'curriculum');
assert.equal(nextFromPreceding.subTabKey, 'overview');
console.log(`  ✓ Landed on: ${nextFromPreceding.title} (${nextFromPreceding.id})`);

// 2. Click Continue on Overview -> Must land on Class-wise Curriculum
console.log(`  Clicking [Continue →] on Curriculum Overview...`);
const nextFromOverview = getNextNavigableStep(nextFromPreceding, flattenedSteps);
assert.ok(nextFromOverview);
assert.equal(nextFromOverview.sectionKey, 'curriculum');
assert.equal(nextFromOverview.subTabKey, 'class_curriculum');
assert.equal(nextFromOverview.slug, 'class-wise');
console.log(`  ✓ Landed on: ${nextFromOverview.title} (${nextFromOverview.id})`);

// 3. Click Continue on Class-wise Curriculum -> Must land on Subject Catalog
console.log(`  Clicking [Continue →] on Class-wise Curriculum...`);
const nextFromClass = getNextNavigableStep(nextFromOverview, flattenedSteps);
assert.ok(nextFromClass);
assert.equal(nextFromClass.sectionKey, 'curriculum');
assert.equal(nextFromClass.subTabKey, 'subjects');
assert.equal(nextFromClass.slug, 'subjects');
console.log(`  ✓ Landed on: ${nextFromClass.title} (${nextFromClass.id})`);

// 4. Click Continue on Subject Catalog -> Must land on Next Top-Level Section
console.log(`  Clicking [Continue →] on Subject Catalog...`);
const nextFromSubjects = getNextNavigableStep(nextFromClass, flattenedSteps);
assert.ok(nextFromSubjects);
assert.notEqual(nextFromSubjects.sectionKey, 'curriculum', 'Must advance out of curriculum');
console.log(`  ✓ Landed on next top-level section: ${nextFromSubjects.title} (${nextFromSubjects.id})`);

console.log('  ✓ Scenario B passed.\n');

// -----------------------------------------------------------------------------
// SCENARIO C: Backward Linear Progression (Reverse Traversal)
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO C] Simulating backward reverse traversal from Next Section...');

console.log(`  Current position: ${nextFromSubjects.title} (${nextFromSubjects.id})`);
console.log(`  Clicking [← Previous]...`);
const backToSubjects = getPreviousNavigableStep(nextFromSubjects, flattenedSteps);
assert.ok(backToSubjects);
assert.equal(backToSubjects.sectionKey, 'curriculum');
assert.equal(backToSubjects.subTabKey, 'subjects');
console.log(`  ✓ Returned to: ${backToSubjects.title}`);

console.log(`  Clicking [← Previous] on Subject Catalog...`);
const backToClass = getPreviousNavigableStep(backToSubjects, flattenedSteps);
assert.ok(backToClass);
assert.equal(backToClass.sectionKey, 'curriculum');
assert.equal(backToClass.subTabKey, 'class_curriculum');
console.log(`  ✓ Returned to: ${backToClass.title}`);

console.log(`  Clicking [← Previous] on Class-wise Curriculum...`);
const backToOverview = getPreviousNavigableStep(backToClass, flattenedSteps);
assert.ok(backToOverview);
assert.equal(backToOverview.sectionKey, 'curriculum');
assert.equal(backToOverview.subTabKey, 'overview');
console.log(`  ✓ Returned to: ${backToOverview.title}`);

console.log(`  Clicking [← Previous] on Curriculum Overview...`);
const backToPreceding = getPreviousNavigableStep(backToOverview, flattenedSteps);
assert.ok(backToPreceding);
assert.equal(backToPreceding.id, precedingSection.id);
console.log(`  ✓ Returned to preceding section: ${backToPreceding.title}`);

console.log('  ✓ Scenario C passed.\n');

// -----------------------------------------------------------------------------
// SCENARIO D: Direct Deep Linking & URL Synchronization
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO D] Verifying direct deep linking, URL building, and aliases...');

// 1. Array path params from Next.js App Router [[...step]]
const deepClassStep = resolveStepFromSlugOrUrl(['curriculum', 'class-wise'], flattenedSteps);
assert.ok(deepClassStep);
assert.equal(deepClassStep.sectionKey, 'curriculum');
assert.equal(deepClassStep.subTabKey, 'class_curriculum');

const deepSubjectsStep = resolveStepFromSlugOrUrl(['curriculum', 'subjects'], flattenedSteps);
assert.ok(deepSubjectsStep);
assert.equal(deepSubjectsStep.sectionKey, 'curriculum');
assert.equal(deepSubjectsStep.subTabKey, 'subjects');

// 2. Canonical URL builders
const classCanonicalUrl = buildStepUrlPath(deepClassStep, `/school-onboarding/${mockToken}`);
assert.equal(classCanonicalUrl, `/school-onboarding/${mockToken}/curriculum/class-wise`);

const subjectsCanonicalUrl = buildStepUrlPath(deepSubjectsStep, `/schools/onboarding/${mockToken}`);
assert.equal(subjectsCanonicalUrl, `/schools/onboarding/${mockToken}/curriculum/subjects`);

// 3. Final review URL
const finalReviewNav = flattenedSteps.find((s) => s.sectionKey === 'websiteRequirements');
assert.ok(finalReviewNav, 'Final review step must exist');
const finalReviewUrl = buildStepUrlPath(finalReviewNav, `/schools/onboarding/${mockToken}`);
assert.equal(finalReviewUrl, `/schools/onboarding/${mockToken}/final-review`);

console.log(`  ✓ URL for Class-wise: ${classCanonicalUrl}`);
console.log(`  ✓ URL for Subjects: ${subjectsCanonicalUrl}`);
console.log(`  ✓ URL for Final Review: ${finalReviewUrl}`);
console.log('  ✓ Scenario D passed.\n');

// -----------------------------------------------------------------------------
// SCENARIO E: Final Review Boundary & Centralized Action Verification
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO E] Verifying Final Review boundary and submission contract...');

const lastStepIdx = flattenedSteps.length - 1;
const lastStep = flattenedSteps[lastStepIdx];
assert.equal(lastStep.sectionKey, 'websiteRequirements', 'Last step must be Final Review');

// Verify that getNextNavigableStep returns null on Final Review
const noNextFromReview = getNextNavigableStep(lastStep, flattenedSteps);
assert.equal(noNextFromReview, null, 'Final Review has no forward continue step');

// Verify step immediately preceding Final Review has Go to Final Review target
const preReviewStep = flattenedSteps[lastStepIdx - 1];
const nextFromPreReview = getNextNavigableStep(preReviewStep, flattenedSteps);
assert.ok(nextFromPreReview);
assert.equal(nextFromPreReview.sectionKey, 'websiteRequirements');

console.log(`  ✓ Pre-review step (${preReviewStep.shortTitle}) continues directly into Final Review`);
console.log(`  ✓ Final Review (${lastStep.shortTitle}) returns null for nextNavigableStep (footer Continue hidden)`);
console.log('  ✓ Scenario E passed.\n');

// -----------------------------------------------------------------------------
// SCENARIO F: Hierarchy-Aware Completeness Guardrails
// -----------------------------------------------------------------------------
console.log('👉 [SCENARIO F] Verifying that parent completion requires all child sub-pages...');

const testIntake: UniversalIntakeData = {
  ...intakeData,
  schoolProfile: {
    schoolName: 'Greenwood High',
    board: 'CBSE',
    schoolType: 'K12',
  } as any,
  curriculum: {
    overview: {
      board: 'CBSE',
      academicApproach: 'Inquiry-based collaborative curriculum',
    },
    subjects: [
      { id: 'sub-eng', name: 'English Language & Literature', code: 'ENG', category: 'Core Academic' } as any,
      { id: 'sub-math', name: 'Mathematics', code: 'MATH', category: 'Core Academic' } as any,
    ],
    classCurricula: [], // Incomplete!
  } as any,
};

// Sub-step breakdown
let subBreakdown = calculateCurriculumSubStepCompleteness(testIntake);
assert.equal(subBreakdown.overview.isComplete, true, 'Overview is complete');
assert.equal(subBreakdown.subjects.isComplete, true, 'Subjects catalog is complete');
assert.equal(subBreakdown.class_curriculum.isComplete, false, 'Class-wise mapping is incomplete');

// Parent curriculum must NOT be marked complete
let parentCompleteness = calculateCurriculumCompleteness(testIntake);
assert.equal(parentCompleteness.isComplete, false, 'Parent section must NOT be complete without class mapping');
assert.ok(parentCompleteness.percentage < 100);
console.log(`  ✓ Incomplete parent score: ${parentCompleteness.percentage}% (Missing: ${parentCompleteness.missingFields[0]})`);

// Populate classCurricula
testIntake.curriculum!.classCurricula = [
  {
    classId: 'cls-1',
    className: 'Grade 1',
    subjects: ['sub-eng', 'sub-math'],
  } as any,
];

subBreakdown = calculateCurriculumSubStepCompleteness(testIntake);
assert.equal(subBreakdown.class_curriculum.isComplete, true, 'Class-wise mapping is now complete');

parentCompleteness = calculateCurriculumCompleteness(testIntake);
assert.equal(parentCompleteness.isComplete, true, 'Parent section is now 100% complete');
assert.equal(parentCompleteness.percentage, 100);
console.log(`  ✓ Complete parent score: ${parentCompleteness.percentage}% with 0 missing fields`);
console.log('  ✓ Scenario F passed.\n');

console.log('==================================================================');
console.log('🎉 ALL HIERARCHICAL NAVIGATION E2E SCENARIOS PASSED WITH ZERO ERRORS!');
console.log('==================================================================');
