import assert from 'node:assert/strict';
import {
  SECTION_CHILDREN_REGISTRY,
  buildHierarchicalNavigation,
  flattenNavigableSteps,
  getNextNavigableStep,
  getPreviousNavigableStep,
  resolveStepFromSlugOrUrl,
  buildStepUrlPath,
  findStepIndex,
  getStepChangeRequestCount,
} from '../schoolNavigationHierarchy';
import {
  getApplicableSections,
  INTAKE_SECTIONS,
} from '../schoolIntake';
import {
  calculateCurriculumCompleteness,
  calculateCurriculumSubStepCompleteness,
} from '../academicCompletenessEngine';
import type { UniversalIntakeData, SchoolIntakeChangeRequest } from '../types';

console.log('\n--- STARTING HIERARCHICAL NAVIGATION ENGINE TEST SUITE ---\n');

const sections = getApplicableSections('school-complete', null);

// TEST 1: Declarative Navigation Hierarchy Building
console.log('Test 1: buildHierarchicalNavigation builds tree with curriculum child sub-pages');
const hierarchy = buildHierarchicalNavigation(sections);
assert.ok(hierarchy.length > 0, 'Hierarchy must contain sections');
const curriculumNode = hierarchy.find((n) => n.sectionKey === 'curriculum');
assert.ok(curriculumNode, 'Curriculum section node must exist');
assert.ok(curriculumNode.children && curriculumNode.children.length === 3, 'Curriculum must have 3 child sub-steps');
assert.equal(curriculumNode.children[0].subTabKey, 'overview');
assert.equal(curriculumNode.children[0].slug, 'overview');
assert.equal(curriculumNode.children[1].subTabKey, 'class_curriculum');
assert.equal(curriculumNode.children[1].slug, 'class-wise');
assert.equal(curriculumNode.children[2].subTabKey, 'subjects');
assert.equal(curriculumNode.children[2].slug, 'subjects');
console.log('  ✓ Curriculum declared with overview, class-wise, and subjects sub-steps');

// TEST 2: Sequence Flattening
console.log('\nTest 2: flattenNavigableSteps produces strict linear sequence');
const flattened = flattenNavigableSteps(hierarchy);
const curriculumSteps = flattened.filter((s) => s.sectionKey === 'curriculum');
assert.equal(curriculumSteps.length, 3, 'Curriculum should have 3 distinct flattened leaf steps');
assert.equal(curriculumSteps[0].subTabKey, 'overview');
assert.equal(curriculumSteps[0].isFirstChild, true);
assert.equal(curriculumSteps[1].subTabKey, 'class_curriculum');
assert.equal(curriculumSteps[2].subTabKey, 'subjects');
assert.equal(curriculumSteps[2].isLastChild, true);

const subjectsIndex = flattened.findIndex((s) => s.sectionKey === 'curriculum' && s.subTabKey === 'subjects');
assert.ok(subjectsIndex > 0);
assert.ok(subjectsIndex + 1 < flattened.length);
const nextStepAfterCurriculum = flattened[subjectsIndex + 1];
assert.notEqual(nextStepAfterCurriculum.sectionKey, 'curriculum', 'Step after Subject Catalog must be next top-level section');
console.log('  ✓ Flattened sequential step order verified');

// TEST 3: Sequential Forward Traversal (getNextNavigableStep)
console.log('\nTest 3: Sequential forward progression adheres strictly to page hierarchy');
const step1 = { sectionKey: 'curriculum' as const, subTabKey: 'overview' };
const step2 = getNextNavigableStep(step1, flattened);
assert.ok(step2, 'Next step from Overview must exist');
assert.equal(step2.sectionKey, 'curriculum');
assert.equal(step2.subTabKey, 'class_curriculum');
assert.equal(step2.slug, 'class-wise');

const step3 = getNextNavigableStep(step2, flattened);
assert.ok(step3, 'Next step from Class-wise must exist');
assert.equal(step3.sectionKey, 'curriculum');
assert.equal(step3.subTabKey, 'subjects');
assert.equal(step3.slug, 'subjects');

const step4 = getNextNavigableStep(step3, flattened);
assert.ok(step4, 'Next step from Subject Catalog must exist');
assert.notEqual(step4.sectionKey, 'curriculum', 'Subject Catalog continue must advance to next top-level section');
assert.equal(step4.id, nextStepAfterCurriculum.id);

const lastStep = flattened[flattened.length - 1];
const nullNext = getNextNavigableStep(lastStep, flattened);
assert.equal(nullNext, null, 'Last step forward continuation returns null');
console.log('  ✓ Overview -> Class-wise -> Subject Catalog -> Next Section forward traversal verified');

// TEST 4: Sequential Backward Traversal (getPreviousNavigableStep)
console.log('\nTest 4: Sequential reverse traversal adheres strictly to page hierarchy');
const prevFromNextSection = getPreviousNavigableStep(step4, flattened);
assert.ok(prevFromNextSection);
assert.equal(prevFromNextSection.sectionKey, 'curriculum');
assert.equal(prevFromNextSection.subTabKey, 'subjects');

const prevFromSubjects = getPreviousNavigableStep(step3, flattened);
assert.ok(prevFromSubjects);
assert.equal(prevFromSubjects.sectionKey, 'curriculum');
assert.equal(prevFromSubjects.subTabKey, 'class_curriculum');

const prevFromClass = getPreviousNavigableStep(step2, flattened);
assert.ok(prevFromClass);
assert.equal(prevFromClass.sectionKey, 'curriculum');
assert.equal(prevFromClass.subTabKey, 'overview');

const prevFromOverview = getPreviousNavigableStep(step1, flattened);
assert.ok(prevFromOverview);
assert.notEqual(prevFromOverview.sectionKey, 'curriculum');

const firstStep = flattened[0];
const nullPrev = getPreviousNavigableStep(firstStep, flattened);
assert.equal(nullPrev, null, 'First step reverse traversal returns null');
console.log('  ✓ Next Section -> Subject Catalog -> Class-wise -> Overview -> Preceding Section verified');

// TEST 5: Deep-Linking & Slug Resolution
console.log('\nTest 5: URL Slug and Path Resolution');
const resOverview = resolveStepFromSlugOrUrl(['curriculum', 'overview'], flattened);
assert.equal(resOverview?.sectionKey, 'curriculum');
assert.equal(resOverview?.subTabKey, 'overview');

const resClass = resolveStepFromSlugOrUrl(['curriculum', 'class-wise'], flattened);
assert.equal(resClass?.sectionKey, 'curriculum');
assert.equal(resClass?.subTabKey, 'class_curriculum');

const resSubjects = resolveStepFromSlugOrUrl(['curriculum', 'subjects'], flattened);
assert.equal(resSubjects?.sectionKey, 'curriculum');
assert.equal(resSubjects?.subTabKey, 'subjects');

const resPathString = resolveStepFromSlugOrUrl('curriculum/class-wise', flattened);
assert.equal(resPathString?.sectionKey, 'curriculum');
assert.equal(resPathString?.subTabKey, 'class_curriculum');

const resFinalReview = resolveStepFromSlugOrUrl('final-review', flattened);
assert.equal(resFinalReview?.sectionKey, 'websiteRequirements');

const resQueryParam = resolveStepFromSlugOrUrl('curriculum?subpage=class_curriculum', flattened);
assert.equal(resQueryParam?.sectionKey, 'curriculum');
assert.equal(resQueryParam?.subTabKey, 'class_curriculum');
console.log('  ✓ Direct deep links, sub-route paths, query parameters, and aliases resolved accurately');

// TEST 6: Canonical URL Path Generation
console.log('\nTest 6: buildStepUrlPath canonical URL generation');
const childStep = {
  id: 'curriculum.class_curriculum',
  sectionKey: 'curriculum' as const,
  subTabKey: 'class_curriculum',
  title: 'Class-wise Curriculum',
  shortTitle: 'Class-wise',
  slug: 'class-wise',
  fullPath: 'curriculum/class-wise',
  chapter: 'academic' as const,
  isMandatory: true,
  isChildStep: true,
  parentSectionKey: 'curriculum' as const,
};
const childUrl = buildStepUrlPath(childStep, '/schools/onboarding/TOKEN123');
assert.equal(childUrl, '/schools/onboarding/TOKEN123/curriculum/class-wise');

const finalReviewStep = {
  id: 'websiteRequirements',
  sectionKey: 'websiteRequirements' as const,
  title: 'Final Website Review & Submission',
  shortTitle: 'Final Review',
  slug: 'websiteRequirements',
  fullPath: 'websiteRequirements',
  chapter: 'review' as const,
  isMandatory: true,
  isChildStep: false,
};
const reviewUrl = buildStepUrlPath(finalReviewStep, '/schools/onboarding/TOKEN123');
assert.equal(reviewUrl, '/schools/onboarding/TOKEN123/final-review');
console.log('  ✓ Child page and Final Review URLs generated correctly');

// TEST 7: Change Request Count Filtering
console.log('\nTest 7: Change Request filtering per sub-page');
const crOverview: SchoolIntakeChangeRequest = {
  id: 'cr-1',
  project_id: 'p-1',
  version_number: 1,
  section_key: 'curriculum',
  field_key: 'curriculum.overview.board',
  change_description: 'Please clarify affiliation number',
  status: 'open',
  created_at: new Date().toISOString(),
};
const crClass: SchoolIntakeChangeRequest = {
  id: 'cr-2',
  project_id: 'p-1',
  version_number: 1,
  section_key: 'curriculum',
  field_key: 'curriculum.classCurricula.grade5',
  change_description: 'Add French language option',
  status: 'open',
  created_at: new Date().toISOString(),
};
const overviewCount = getStepChangeRequestCount(
  { ...childStep, subTabKey: 'overview', id: 'curriculum.overview' },
  [crOverview, crClass]
);
assert.equal(overviewCount, 1);
const classCount = getStepChangeRequestCount(
  { ...childStep, subTabKey: 'class_curriculum', id: 'curriculum.class_curriculum' },
  [crOverview, crClass]
);
assert.equal(classCount, 1);
console.log('  ✓ Change requests scoped to specific sub-steps');

// TEST 8: Completeness Engine
console.log('\nTest 8: Hierarchy-aware Completeness Calculation');
const partialData: Partial<UniversalIntakeData> = {
  schoolProfile: { schoolName: 'Delhi Public School', board: 'CBSE' } as any,
  curriculum: {
    overview: {
      board: 'CBSE',
      academicApproach: 'Holistic STEM and Arts integration',
    },
    subjects: [{ id: 'sub-1', name: 'Mathematics', code: 'MATH' } as any],
    classCurricula: [],
  } as any,
};

const subStatus = calculateCurriculumSubStepCompleteness(partialData);
assert.equal(subStatus.overview.isComplete, true);
assert.equal(subStatus.subjects.isComplete, true);
assert.equal(subStatus.class_curriculum.isComplete, false);

const parentStatus = calculateCurriculumCompleteness(partialData);
assert.equal(parentStatus.isComplete, false, 'Parent curriculum must not be complete when class_curriculum is missing');
assert.ok(parentStatus.percentage < 100);

const completeData: Partial<UniversalIntakeData> = {
  curriculum: {
    overview: {
      board: 'CBSE',
      academicApproach: 'Comprehensive experiential learning framework',
    },
    subjects: [{ id: 'sub-1', name: 'Mathematics', code: 'MATH' } as any],
    classCurricula: [
      {
        classId: 'cls-1',
        className: 'Grade 1',
        subjects: ['sub-1'],
      } as any,
    ],
  } as any,
};

const subStatusComplete = calculateCurriculumSubStepCompleteness(completeData);
assert.equal(subStatusComplete.overview.isComplete, true);
assert.equal(subStatusComplete.subjects.isComplete, true);
assert.equal(subStatusComplete.class_curriculum.isComplete, true);

const parentStatusComplete = calculateCurriculumCompleteness(completeData);
assert.equal(parentStatusComplete.isComplete, true);
assert.equal(parentStatusComplete.percentage, 100);
console.log('  ✓ Sub-step and aggregated parent completeness accurately computed');

console.log('\n--- ALL HIERARCHICAL NAVIGATION ENGINE TESTS PASSED SUCCESSFULLY! ---\n');
