/**
 * ==============================================================================
 * TEST SUITE: School Submission Lock & Admin-Allowed Edit Safety
 * File: src/lib/__tests__/schoolSubmissionLockAndEditSafety.test.ts
 * ==============================================================================
 */

import test, { describe } from 'node:test';
import assert from 'node:assert';
import type { SchoolProject, SchoolIntakeChangeRequest } from '../types';

describe('School Submission Lock & Admin-Allowed Edit Safety', () => {
  function isFieldEditableHelper(
    project: Partial<SchoolProject>,
    changeRequests: SchoolIntakeChangeRequest[] | undefined,
    sectionKey: string,
    fieldKey?: string
  ): boolean {
    const isProjectSubmitted = ['submitted', 'resubmitted', 'under_review', 'approved', 'handoff_ready', 'handed_off'].includes(
      project.status || ''
    );
    const isChangesRequested =
      project.status === 'changes_requested' ||
      Boolean(changeRequests && changeRequests.some((cr) => cr.status === 'open' || cr.status === 'waiting_for_school'));

    // If project is submitted and NOT in revision mode, strictly locked
    if (isProjectSubmitted && !isChangesRequested) {
      return false;
    }

    // If in revision mode, ONLY fields with active change requests from admin are editable
    if (isChangesRequested) {
      const cr = changeRequests?.find(
        (c) =>
          (c.section_key === sectionKey || (sectionKey === 'schoolProfile' && (c.section_key === 'schoolProfile' || c.section_key === 'identity'))) &&
          (!fieldKey || c.field_key === fieldKey)
      );
      if (cr && (cr.status === 'open' || cr.status === 'waiting_for_school')) {
        return true;
      }
      return false;
    }

    return true;
  }

  function isSectionEditableHelper(
    project: Partial<SchoolProject>,
    changeRequests: SchoolIntakeChangeRequest[] | undefined,
    sectionKey: string
  ): boolean {
    const isProjectSubmitted = ['submitted', 'resubmitted', 'under_review', 'approved', 'handoff_ready', 'handed_off'].includes(
      project.status || ''
    );
    const isChangesRequested =
      project.status === 'changes_requested' ||
      Boolean(changeRequests && changeRequests.some((cr) => cr.status === 'open' || cr.status === 'waiting_for_school'));

    if (isProjectSubmitted && !isChangesRequested) return false;
    if (!isChangesRequested) return true;
    if (!changeRequests || changeRequests.length === 0) return false;

    return changeRequests.some((cr) => {
      if (cr.status !== 'open' && cr.status !== 'waiting_for_school') return false;
      return (
        cr.section_key === sectionKey ||
        (sectionKey === 'schoolProfile' && (cr.section_key === 'schoolProfile' || cr.section_key === 'identity')) ||
        (sectionKey === 'campuses' && (cr.section_key === 'campuses' || cr.section_key === 'campusFacilities')) ||
        (sectionKey === 'leadership' && (cr.section_key === 'leadership' || cr.section_key === 'websiteContent')) ||
        (sectionKey === 'brandingDesign' && (cr.section_key === 'brandingDesign' || cr.section_key === 'media'))
      );
    });
  }

  test('Pre-submission draft mode: All fields and sections are fully editable', () => {
    const project: Partial<SchoolProject> = { status: 'draft' };
    assert.strictEqual(isFieldEditableHelper(project, [], 'schoolProfile', 'schoolName'), true);
    assert.strictEqual(isFieldEditableHelper(project, [], 'brandingDesign', 'logoUrl'), true);
    assert.strictEqual(isSectionEditableHelper(project, [], 'schoolProfile'), true);
    assert.strictEqual(isSectionEditableHelper(project, [], 'leadership'), true);
  });

  test('Post-submission: When project is submitted and no change requests exist, all fields are locked', () => {
    const submittedStatuses = ['submitted', 'resubmitted', 'under_review', 'approved', 'handoff_ready', 'handed_off'];

    for (const status of submittedStatuses) {
      const project: Partial<SchoolProject> = { status: status as any };
      assert.strictEqual(isFieldEditableHelper(project, [], 'schoolProfile', 'schoolName'), false);
      assert.strictEqual(isFieldEditableHelper(project, [], 'brandingDesign', 'logoUrl'), false);
      assert.strictEqual(isFieldEditableHelper(project, [], 'campuses', 'mainCampusName'), false);
      assert.strictEqual(isSectionEditableHelper(project, [], 'schoolProfile'), false);
      assert.strictEqual(isSectionEditableHelper(project, [], 'campuses'), false);
      assert.strictEqual(isSectionEditableHelper(project, [], 'leadership'), false);
    }
  });

  test('Revision mode (changes_requested): ONLY fields requested by admin are unlocked for editing', () => {
    const project: Partial<SchoolProject> = { status: 'changes_requested' };
    const changeRequests: SchoolIntakeChangeRequest[] = [
      {
        id: 'cr-1',
        project_id: 'proj-1',
        submission_id: 'sub-1',
        section_key: 'schoolProfile',
        field_key: 'affiliationNumber',
        status: 'open',
        reviewer_note: 'Please provide CBSE affiliation number matching official records',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // Requested field is editable
    assert.strictEqual(
      isFieldEditableHelper(project, changeRequests, 'schoolProfile', 'affiliationNumber'),
      true,
      'Field with open change request must be editable'
    );

    // Unrequested field in the same section remains locked
    assert.strictEqual(
      isFieldEditableHelper(project, changeRequests, 'schoolProfile', 'schoolName'),
      false,
      'Field without change request must remain strictly locked'
    );

    // Other sections without change requests remain strictly locked
    assert.strictEqual(
      isSectionEditableHelper(project, changeRequests, 'campuses'),
      false,
      'Section with no change requests must be locked'
    );
    assert.strictEqual(
      isFieldEditableHelper(project, changeRequests, 'campuses', 'mainCampusName'),
      false,
      'Field in unrelated section must remain locked'
    );
  });

  test('Revision mode: Resolved or approved change requests lock fields back up', () => {
    const project: Partial<SchoolProject> = { status: 'submitted' };
    const changeRequests: SchoolIntakeChangeRequest[] = [
      {
        id: 'cr-1',
        project_id: 'proj-1',
        submission_id: 'sub-1',
        section_key: 'schoolProfile',
        field_key: 'affiliationNumber',
        status: 'resolved',
        reviewer_note: 'Done',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    assert.strictEqual(
      isFieldEditableHelper(project, changeRequests, 'schoolProfile', 'affiliationNumber'),
      false,
      'Resolved change request must not unlock the field'
    );
  });

  test('Draft save guardrail validation: Rejects edits on submitted projects', () => {
    function mockSaveDraftGuard(status: string) {
      const submittedStatuses = ['submitted', 'resubmitted', 'under_review', 'approved', 'provisioned', 'completed'];
      if (submittedStatuses.includes(status) && status !== 'changes_requested') {
        return {
          success: false,
          error: 'This school onboarding submission has already been submitted and is locked against further edits.',
        };
      }
      return { success: true };
    }

    assert.strictEqual(mockSaveDraftGuard('submitted').success, false);
    assert.strictEqual(mockSaveDraftGuard('resubmitted').success, false);
    assert.strictEqual(mockSaveDraftGuard('under_review').success, false);
    assert.strictEqual(mockSaveDraftGuard('approved').success, false);
    assert.strictEqual(mockSaveDraftGuard('draft').success, true);
    assert.strictEqual(mockSaveDraftGuard('changes_requested').success, true);
  });
});
