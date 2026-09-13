/**
 * ==============================================================================
 * TEST SUITE: School Onboarding Hierarchical Navigation Engine
 * Verifies nested step-by-step navigation through sub-pages before next section
 * ==============================================================================
 */

import assert from 'node:assert';
import {
  SECTION_CHILDREN_REGISTRY,
  getSectionChildSteps,
  buildHierarchicalNavigation,
  flattenNavigableSteps,
  findStepIndex,
  getNextNavigableStep,
  getPreviousNavigableStep,
  resolveStepFromSlugOrUrl,
  buildStepUrlPath,
  type NavigableStep,
} from '../schoolNavigationHierarchy';
import { getApplicableSections, INTAKE_SECTIONS } from '../schoolIntake';

console.log('===========================================================');
console.log('TEST SUITE: School Onboarding Hierarchical Navigation Engine');
console.log('===========================================================');

const applicableSections = getApplicableSections('school-complete');

// -----------------------------------------------------------------------------
// TEST 1: Registry verification for multi-page sections
// -----------------------------------------------------------------------------
console.log('\nTEST 1: Multi-page section registry configuration');
{
  const curriculumChildren = getSectionChildSteps('curriculum');
  assert(curriculumChildren.length === 3, 'Curriculum must have exactly 3 sub-pages');
  assert(curriculumChildren[0].subTabKey === 'overview', 'First sub-page is overview');
  assert(curriculumChildren[1].subTabKey === 'class_curriculum', 'Second sub-page is class_curriculum');
  assert(curriculumChildren[2].subTabKey === 'subjects', 'Third sub-page is subjects');
  console.log('  ✓ Curriculum registry has 3 sub-pages: overview, class_curriculum, subjects');

  const feeChildren = getSectionChildSteps('feesConfiguration');
  assert(feeChildren.length === 8, 'Fees configuration must have 8 sub-pages');
  console.log('  ✓ Fees configuration registry has 8 sub-pages');

  const facilitiesChildren = getSectionChildSteps('facilitiesConfig');
  assert(facilitiesChildren.length === 3, 'Facilities configuration must have 3 sub-stages');
  console.log('  ✓ Facilities configuration registry has 3 sub-stages');

  const singleSection = getSectionChildSteps('schoolProfile');
  assert(singleSection.length === 0, 'Single-page sections return empty child array');
  console.log('  ✓ Single-page section returns empty child array');
}

// -----------------------------------------------------------------------------
// TEST 2: Hierarchy building and flattening
// -----------------------------------------------------------------------------
console.log('\nTEST 2: Hierarchy building and linear flattening');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  assert(hierarchy.length === applicableSections.length, 'Root hierarchy nodes match applicable section count');

  const curriculumNode = hierarchy.find((n) => n.sectionKey === 'curriculum');
  assert(curriculumNode !== undefined, 'Curriculum node exists in hierarchy');
  assert(curriculumNode.children && curriculumNode.children.length === 3, 'Curriculum node has 3 children');

  const flattened = flattenNavigableSteps(hierarchy);
  assert(flattened.length > applicableSections.length, 'Flattened steps include expanded leaf children');
  console.log(`  ✓ Flattened ${applicableSections.length} sections into ${flattened.length} linear navigable steps`);

  // Verify Curriculum leaf steps in flattened list
  const currSteps = flattened.filter((s) => s.sectionKey === 'curriculum');
  assert(currSteps.length === 3, 'Curriculum appears as 3 sequential leaf steps');
  assert(currSteps[0].subTabKey === 'overview' && currSteps[0].childIndex === 0 && currSteps[0].isFirstChild === true);
  assert(currSteps[1].subTabKey === 'class_curriculum' && currSteps[1].childIndex === 1 && !currSteps[1].isFirstChild && !currSteps[1].isLastChild);
  assert(currSteps[2].subTabKey === 'subjects' && currSteps[2].childIndex === 2 && currSteps[2].isLastChild === true);
  console.log('  ✓ Curriculum child steps have accurate childIndex, totalChildren, and first/last flags');
}

// -----------------------------------------------------------------------------
// TEST 3: Curriculum Sequential Forward Navigation (Acceptance Criteria 1-3)
// -----------------------------------------------------------------------------
console.log('\nTEST 3: Curriculum Sequential Forward Navigation');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  const flattened = flattenNavigableSteps(hierarchy);

  // Step 1: On Curriculum Overview -> Continue -> Class-wise Curriculum
  const step1 = { sectionKey: 'curriculum' as const, subTabKey: 'overview' };
  const nextFrom1 = getNextNavigableStep(step1, flattened);
  assert(nextFrom1 !== null, 'Next step from Curriculum Overview exists');
  assert(nextFrom1.sectionKey === 'curriculum', 'Next step stays within Curriculum main section');
  assert(nextFrom1.subTabKey === 'class_curriculum', 'Next step is Class-wise Curriculum');
  console.log('  ✓ Step 1: Curriculum Overview -> Continue -> Class-wise Curriculum (Does NOT advance to next main section)');

  // Step 2: On Class-wise Curriculum -> Continue -> Subjects Catalog
  const step2 = { sectionKey: 'curriculum' as const, subTabKey: 'class_curriculum' };
  const nextFrom2 = getNextNavigableStep(step2, flattened);
  assert(nextFrom2 !== null, 'Next step from Class-wise Curriculum exists');
  assert(nextFrom2.sectionKey === 'curriculum', 'Next step stays within Curriculum main section');
  assert(nextFrom2.subTabKey === 'subjects', 'Next step is Subject Catalog');
  console.log('  ✓ Step 2: Class-wise Curriculum -> Continue -> Subjects Catalog (Does NOT advance to next main section)');

  // Step 3: On Subjects Catalog -> Continue -> Next Main Section
  const step3 = { sectionKey: 'curriculum' as const, subTabKey: 'subjects' };
  const nextFrom3 = getNextNavigableStep(step3, flattened);
  assert(nextFrom3 !== null, 'Next step from Subjects Catalog exists');
  assert(nextFrom3.sectionKey !== 'curriculum', 'Next step leaves Curriculum main section');
  console.log(`  ✓ Step 3: Subjects Catalog -> Continue -> Next Main Section (${nextFrom3.sectionKey})`);
}

// -----------------------------------------------------------------------------
// TEST 4: Curriculum Symmetrical Previous Navigation (Acceptance Criteria 4-6)
// -----------------------------------------------------------------------------
console.log('\nTEST 4: Curriculum Symmetrical Previous Navigation');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  const flattened = flattenNavigableSteps(hierarchy);

  // Previous from Next Main Section -> Lands on Subjects Catalog (last child)
  const currIdx = flattened.findIndex((s) => s.sectionKey === 'curriculum' && s.subTabKey === 'subjects');
  const nextMainStep = flattened[currIdx + 1];
  const prevFromNextMain = getPreviousNavigableStep(
    { sectionKey: nextMainStep.sectionKey, subTabKey: nextMainStep.subTabKey },
    flattened
  );
  assert(prevFromNextMain !== null, 'Previous step from Next Main Section exists');
  assert(prevFromNextMain.sectionKey === 'curriculum', 'Previous step enters Curriculum');
  assert(prevFromNextMain.subTabKey === 'subjects', 'Previous step lands on Subjects Catalog (the last sub-page)');
  console.log('  ✓ Next Main Section -> Previous -> Subjects Catalog');

  // Subjects Catalog -> Previous -> Class-wise Curriculum
  const prevFromSubjects = getPreviousNavigableStep(
    { sectionKey: 'curriculum', subTabKey: 'subjects' },
    flattened
  );
  assert(prevFromSubjects !== null);
  assert(prevFromSubjects.sectionKey === 'curriculum');
  assert(prevFromSubjects.subTabKey === 'class_curriculum');
  console.log('  ✓ Subjects Catalog -> Previous -> Class-wise Curriculum');

  // Class-wise Curriculum -> Previous -> Curriculum Overview
  const prevFromClassWise = getPreviousNavigableStep(
    { sectionKey: 'curriculum', subTabKey: 'class_curriculum' },
    flattened
  );
  assert(prevFromClassWise !== null);
  assert(prevFromClassWise.sectionKey === 'curriculum');
  assert(prevFromClassWise.subTabKey === 'overview');
  console.log('  ✓ Class-wise Curriculum -> Previous -> Curriculum Overview');

  // Curriculum Overview -> Previous -> Previous Main Section
  const prevFromOverview = getPreviousNavigableStep(
    { sectionKey: 'curriculum', subTabKey: 'overview' },
    flattened
  );
  assert(prevFromOverview !== null);
  assert(prevFromOverview.sectionKey !== 'curriculum', 'Leaves Curriculum for previous main section');
  console.log(`  ✓ Curriculum Overview -> Previous -> Previous Main Section (${prevFromOverview.sectionKey})`);
}

// -----------------------------------------------------------------------------
// TEST 5: Generic Multi-Section Navigation
// -----------------------------------------------------------------------------
console.log('\nTEST 5: Generic Reusability Across All Multi-Step Sections');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  const flattened = flattenNavigableSteps(hierarchy);

  // Test FacilitiesConfig 3-stage sequence
  const facStep1 = { sectionKey: 'facilitiesConfig' as const, subTabKey: 'availability' };
  const facStep2 = getNextNavigableStep(facStep1, flattened);
  assert(facStep2?.sectionKey === 'facilitiesConfig' && facStep2.subTabKey === 'details');
  const facStep3 = getNextNavigableStep({ sectionKey: 'facilitiesConfig', subTabKey: 'details' }, flattened);
  assert(facStep3?.sectionKey === 'facilitiesConfig' && facStep3.subTabKey === 'preview');
  console.log('  ✓ Facilities configuration advances availability -> details -> preview');

  // Test StudentConfig 3-stage sequence
  const stuStep1 = { sectionKey: 'studentConfig' as const, subTabKey: 'fields' };
  const stuStep2 = getNextNavigableStep(stuStep1, flattened);
  assert(stuStep2?.sectionKey === 'studentConfig' && stuStep2.subTabKey === 'template');
  const stuStep3 = getNextNavigableStep({ sectionKey: 'studentConfig', subTabKey: 'template' }, flattened);
  assert(stuStep3?.sectionKey === 'studentConfig' && stuStep3.subTabKey === 'directory');
  console.log('  ✓ Student configuration advances fields -> template -> directory');
}

// -----------------------------------------------------------------------------
// TEST 6: URL Slug and Query Resolution
// -----------------------------------------------------------------------------
console.log('\nTEST 6: URL Slug and Query Resolution');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  const flattened = flattenNavigableSteps(hierarchy);

  // Exact path e.g. 'curriculum/class-wise'
  const resolved1 = resolveStepFromSlugOrUrl('curriculum/class-wise', flattened);
  assert(resolved1 !== null);
  assert(resolved1.sectionKey === 'curriculum');
  assert(resolved1.subTabKey === 'class_curriculum');
  console.log('  ✓ Resolves exact path "curriculum/class-wise" to class_curriculum');

  // Array path segments e.g. ['curriculum', 'overview']
  const resolved2 = resolveStepFromSlugOrUrl(['curriculum', 'overview'], flattened);
  assert(resolved2 !== null);
  assert(resolved2.sectionKey === 'curriculum');
  assert(resolved2.subTabKey === 'overview');
  console.log('  ✓ Resolves array ["curriculum", "overview"] to overview');

  // Query parameter e.g. '?section=curriculum&subPage=subjects'
  const resolved3 = resolveStepFromSlugOrUrl('?section=curriculum&subPage=subjects', flattened);
  assert(resolved3 !== null);
  assert(resolved3.sectionKey === 'curriculum');
  assert(resolved3.subTabKey === 'subjects');
  console.log('  ✓ Resolves query "?section=curriculum&subPage=subjects" to subjects');

  // Aliases e.g. 'curriculum/class-curriculum'
  const resolved4 = resolveStepFromSlugOrUrl('curriculum/class-curriculum', flattened);
  assert(resolved4 !== null);
  assert(resolved4.subTabKey === 'class_curriculum');
  console.log('  ✓ Resolves alias "curriculum/class-curriculum" to class_curriculum');

  // Final review special alias
  const resolvedReview = resolveStepFromSlugOrUrl('final-review', flattened);
  assert(resolvedReview !== null);
  assert(resolvedReview.sectionKey === 'websiteRequirements');
  console.log('  ✓ Resolves alias "final-review" to websiteRequirements');
}

// -----------------------------------------------------------------------------
// TEST 7: Boundary Conditions (First & Last Steps)
// -----------------------------------------------------------------------------
console.log('\nTEST 7: Boundary conditions (First & Last Steps)');
{
  const hierarchy = buildHierarchicalNavigation(applicableSections);
  const flattened = flattenNavigableSteps(hierarchy);

  const firstStep = flattened[0];
  const prevFromFirst = getPreviousNavigableStep({ sectionKey: firstStep.sectionKey, subTabKey: firstStep.subTabKey }, flattened);
  assert(prevFromFirst === null, 'First step has no previous step');
  console.log('  ✓ First step has no previous step (disabled Previous Section)');

  const lastStep = flattened[flattened.length - 1];
  const nextFromLast = getNextNavigableStep({ sectionKey: lastStep.sectionKey, subTabKey: lastStep.subTabKey }, flattened);
  assert(nextFromLast === null, 'Last step has no next step');
  console.log('  ✓ Last step has no next step (ready for submission)');
}

console.log('\n===========================================================');
console.log('RESULTS: ALL HIERARCHICAL NAVIGATION TESTS PASSED (7/7)');
console.log('===========================================================');
