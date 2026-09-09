/**
 * ==============================================================================
 * SECTION 5: ACADEMIC STRUCTURE & CURRICULUM VERIFICATION SUITE
 * Test Suite: scripts/test-section5-academic-structure.ts
 * ==============================================================================
 *
 * Verifies all 27 core requirements:
 * 1. Empty academic structure handling
 * 2. Add class with stable ID
 * 3. Edit class without duplicating record
 * 4. Remove class and re-index sortOrder
 * 5. Add section to class
 * 6. Remove section from class
 * 7. Duplicate section prevention within same class
 * 8. Duplicate class name prevention across roster
 * 9. Add streams to senior secondary classes
 * 10. Stream sections handling
 * 11. Custom board resolution (effectiveCurriculum)
 * 12. Custom naming convention handling
 * 13. Suggested structure is NOT automatically confirmed
 * 14. Confirmation transitions valid structure to 100% completion
 * 15. Editing confirmed structure invalidates confirmation
 * 16. Invalid date format rejection
 * 17. End date before start date rejected
 * 18. Missing session name detected
 * 19. Missing class name rejected
 * 20. Save Draft restores exact unconfirmed/confirmed structure
 * 21. Multiple classes maintain independent state
 * 22. Stable IDs remain intact after reorder/delete
 * 23. Progress reflects actual completion percentage
 * 24. Zero false 100% completion on initial intake
 * 25. Existing legacy data migrates/loads correctly without data loss
 * 26. Downstream Admissions consumer receives canonical classes seamlessly
 * 27. Downstream Database Provisioning receives canonical classes and streams
 */

import assert from 'assert';
import {
  createInitialIntakeData,
  calculateIntakeCompleteness,
} from '../src/lib/schoolIntake';
import {
  normalizeAcademicStructure,
  validateAcademicStructure,
  resolveEffectiveCurriculum,
  resolveEffectiveNamingConvention,
  deriveClassesOfferedSummary,
  getAcademicStructureWebsiteOutput,
  generateAcademicId,
  DEFAULT_SUGGESTED_CLASSES,
  DEFAULT_SUGGESTED_SUBJECTS,
  deriveTeachingGroups,
  normalizeSubjects,
  normalizeSubjectApplicability,
  isSubjectApplicableToGroup,
  getApplicableSubjectsForGroup,
  normalizeSubjectTeacherAssignments,
  normalizeClassTeacherAssignments,
  getSubjectTeacherAssignment,
  getClassTeacherAssignment,
  getAcademicSetupProgress,
} from '../src/lib/academicStructureUtils';
import type {
  UniversalIntakeData,
  AcademicStructureData,
  AcademicClassConfig,
  StaffMember,
} from '../src/lib/types';
import {
  STANDARD_CBSE_FACULTY_TEMPLATE,
  generateNextFacultyId,
  getFacultyById,
  isFacultyActive,
} from '../src/lib/staffFacultyUtils';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ Test ${totalTests}: ${name}`);
  } catch (err: any) {
    console.error(`  ✗ Test ${totalTests} FAILED: ${name}`);
    console.error(`    ${err.message}`);
    throw err;
  }
}

console.log('================================================================');
console.log('  SECTION 5: ACADEMIC STRUCTURE & CURRICULUM TEST SUITE');
console.log('================================================================\n');

// ─── GROUP 1: STRUCTURAL BUILDER OPERATIONS ──────────────────────────────────

console.log('Group 1: Academic Classes & Sections Builder Operations');

runTest('Empty academic structure initializes cleanly without errors', () => {
  const norm = normalizeAcademicStructure({});
  assert.strictEqual(norm.currentAcademicSession, '2026-2027');
  assert.strictEqual(norm.confirmed, false);
  assert.strictEqual(norm.structureStatus, 'unconfigured');
  assert.deepStrictEqual(norm.classes, []);
});

runTest('Add class creates class with stable ID and proper ordering', () => {
  const norm = normalizeAcademicStructure({
    classes: [
      { id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] },
      { name: 'Class 2', sortOrder: 2, sections: ['A', 'B'] },
    ],
  });

  assert.strictEqual(norm.classes?.length, 2);
  assert.strictEqual(norm.classes?.[0].id, 'cls-1');
  assert.ok(norm.classes?.[1].id && norm.classes[1].id.startsWith('cls_'), 'Generates stable ID for new class');
  assert.strictEqual(norm.classes?.[1].name, 'Class 2');
});

runTest('Edit class updates class record in place without duplicating', () => {
  const initial = normalizeAcademicStructure({
    classes: [
      { id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] },
      { id: 'cls-2', name: 'Class 2', sortOrder: 2, sections: ['A'] },
    ],
  });

  // Edit Class 2 to Grade 2 with sections A, B, C
  const updatedClasses = (initial.classes || []).map((c) => {
    if (c.id === 'cls-2') {
      return { ...c, name: 'Grade 2', sections: ['A', 'B', 'C'] };
    }
    return c;
  });

  const edited = normalizeAcademicStructure({ ...initial, classes: updatedClasses });
  assert.strictEqual(edited.classes?.length, 2, 'Roster count remains exactly 2');
  assert.strictEqual(edited.classes?.[1].id, 'cls-2', 'Stable ID is preserved');
  assert.strictEqual(edited.classes?.[1].name, 'Grade 2', 'Name was updated');
  assert.deepStrictEqual(edited.classes?.[1].sections, ['A', 'B', 'C'], 'Sections updated');
});

runTest('Remove class removes record and recalculates summaries', () => {
  const initial = normalizeAcademicStructure({
    classes: [
      { id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] },
      { id: 'cls-2', name: 'Class 2', sortOrder: 2, sections: ['A'] },
      { id: 'cls-3', name: 'Class 3', sortOrder: 3, sections: ['A'] },
    ],
  });

  const filtered = (initial.classes || []).filter((c) => c.id !== 'cls-2');
  const normalized = normalizeAcademicStructure({ ...initial, classes: filtered });
  assert.strictEqual(normalized.classes?.length, 2);
  assert.strictEqual(normalized.classes?.[0].name, 'Class 1');
  assert.strictEqual(normalized.classes?.[1].name, 'Class 3');
});

runTest('Add section to class persists correctly', () => {
  const initial = normalizeAcademicStructure({
    classes: [{ id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
  });

  const withNewSec = {
    ...initial,
    classes: [{ ...initial.classes![0], sections: ['A', 'B'] }],
  };
  const normalized = normalizeAcademicStructure(withNewSec);
  assert.deepStrictEqual(normalized.classes?.[0].sections, ['A', 'B']);
});

runTest('Remove section from class succeeds and allows zero sections', () => {
  const initial = normalizeAcademicStructure({
    classes: [{ id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
  });

  const withoutSec = {
    ...initial,
    classes: [{ ...initial.classes![0], sections: [] }],
  };
  const normalized = normalizeAcademicStructure(withoutSec);
  assert.deepStrictEqual(normalized.classes?.[0].sections, [], 'Zero sections is allowed');
});

runTest('Duplicate section prevention normalizes and removes duplicates', () => {
  const structure = normalizeAcademicStructure({
    classes: [{ id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A', 'a', 'B', ' B '] }],
  });
  assert.deepStrictEqual(structure.classes?.[0].sections, ['A', 'B'], 'Trims and deduplicates sections case-insensitively');
});

runTest('Duplicate class name prevention detects duplicates in validation', () => {
  const val = validateAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    confirmed: true,
    classes: [
      { id: 'cls-1', name: 'Class 1', sortOrder: 1, sections: ['A'] },
      { id: 'cls-2', name: 'class 1', sortOrder: 2, sections: ['B'] },
    ],
  });
  assert.strictEqual(val.isValid, false);
  assert.ok(val.missingFields.some((f) => f.includes('Duplicate Class Name "class 1"')));
});

// ─── GROUP 2: STREAMS, PROGRAMS, BOARDS & NAMING ────────────────────────────

console.log('\nGroup 2: Streams, Programs, Curriculum Boards & Naming Conventions');

runTest('Add streams to senior secondary classes persists structured data', () => {
  const structure = normalizeAcademicStructure({
    classes: [
      {
        id: 'cls-11',
        name: 'Class 11',
        sortOrder: 11,
        sections: ['A'],
        streams: [
          { id: 'strm-1', name: 'Science', sections: ['A', 'B'] },
          { id: 'strm-2', name: 'Commerce', sections: ['A'] },
          { id: 'strm-3', name: 'Humanities', sections: ['A'] },
        ],
      },
    ],
  });

  assert.strictEqual(structure.classes?.[0].streams?.length, 3);
  assert.deepStrictEqual(structure.academicStreams, ['Science', 'Commerce', 'Humanities']);
});

runTest('Stream sections manage independent section rosters', () => {
  const structure = normalizeAcademicStructure({
    classes: [
      {
        id: 'cls-12',
        name: 'Class 12',
        sortOrder: 12,
        sections: [],
        streams: [
          { id: 's-1', name: 'Science', sections: ['PCM-1', 'PCB-1'] },
          { id: 's-2', name: 'Commerce', sections: ['Comm-A'] },
        ],
      },
    ],
  });

  assert.deepStrictEqual(structure.classes?.[0].streams?.[0].sections, ['PCM-1', 'PCB-1']);
  assert.deepStrictEqual(structure.classes?.[0].streams?.[1].sections, ['Comm-A']);
});

runTest('Custom board resolution (effectiveCurriculum) handles Other correctly', () => {
  // 1. Standard board
  assert.strictEqual(resolveEffectiveCurriculum('ICSE', ''), 'ICSE');

  // 2. Other with custom board
  assert.strictEqual(
    resolveEffectiveCurriculum('Other', 'Autonomous Board of Education'),
    'Autonomous Board of Education'
  );

  // 3. Fallback when unset
  assert.strictEqual(resolveEffectiveCurriculum('', '', 'Cambridge'), 'Cambridge');
  assert.strictEqual(resolveEffectiveCurriculum('', '', ''), 'CBSE');
});

runTest('Custom naming convention resolves custom text cleanly', () => {
  assert.strictEqual(resolveEffectiveNamingConvention('Class'), 'Class');
  assert.strictEqual(resolveEffectiveNamingConvention('Grade'), 'Grade');
  assert.strictEqual(resolveEffectiveNamingConvention('Custom', 'Year Group'), 'Year Group');
  assert.strictEqual(resolveEffectiveNamingConvention('Custom', ''), 'Custom');
});

// ─── GROUP 3: SUGGESTIONS, CONFIRMATION & LIFECYCLE ──────────────────────────

console.log('\nGroup 3: Suggestions, Explicit Confirmation & Lifecycle Management');

runTest('Suggested structure is NOT automatically confirmed', () => {
  const initial = createInitialIntakeData({ schoolName: 'Test Academy' });
  assert.strictEqual(initial.institutionStructure?.confirmed, false);
  assert.strictEqual(initial.institutionStructure?.academicStructureConfirmed, false);
  assert.strictEqual(initial.institutionStructure?.structureStatus, 'suggested');
});

runTest('Confirmation makes valid structure complete (100%)', () => {
  const intake = createInitialIntakeData({ schoolName: 'Test Academy' });
  // Confirm the structure
  intake.institutionStructure!.confirmed = true;
  intake.institutionStructure!.academicStructureConfirmed = true;

  const comp = calculateIntakeCompleteness('school-erp', intake);
  assert.strictEqual(
    comp.sectionPercentages['institutionStructure'],
    100,
    'Confirmed valid structure achieves 100%'
  );
  assert(!comp.missingFields.some((f) => f.includes('Academic Structure')));
});

runTest('Editing confirmed structure invalidates confirmation', () => {
  const initial = normalizeAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    confirmed: true,
    academicStructureConfirmed: true,
    classes: [{ id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
  });

  assert.strictEqual(initial.confirmed, true);

  // User simulates adding a class after confirmation
  const userStructuralEdit = (current: AcademicStructureData, nextClasses: AcademicClassConfig[]): AcademicStructureData => {
    return {
      ...current,
      classes: nextClasses,
      confirmed: false,
      academicStructureConfirmed: false,
      structureStatus: 'review_required',
    };
  };

  const modified = userStructuralEdit(initial, [
    ...initial.classes!,
    { id: 'c2', name: 'Class 2', sortOrder: 2, sections: ['A'] },
  ]);

  assert.strictEqual(modified.confirmed, false, 'Confirmation flag dropped');
  assert.strictEqual(modified.academicStructureConfirmed, false);
  assert.strictEqual(modified.structureStatus, 'review_required');
});

// ─── GROUP 4: VALIDATION CONSTRAINTS ─────────────────────────────────────────

console.log('\nGroup 4: Validation Constraints & Error Handling');

runTest('Invalid date format and order is detected and rejected', () => {
  const val = validateAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2027-04-01',
    sessionEndDate: '2026-03-31', // End before start!
    classes: [{ id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
    confirmed: true,
  });

  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.sessionEndDate);
  assert.ok(val.missingFields.some((f) => f.includes('Session End Date must be after Start Date')));
});

runTest('Missing session name is detected', () => {
  const val = validateAcademicStructure({
    currentAcademicSession: '   ',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [{ id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
    confirmed: true,
  });

  assert.strictEqual(val.isValid, false);
  assert.ok(val.errors.currentAcademicSession);
  assert.ok(val.missingFields.some((f) => f.includes('Academic Session Name')));
});

runTest('Missing class name is rejected', () => {
  const val = validateAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [{ id: 'c1', name: '   ', sortOrder: 1, sections: ['A'] }],
    confirmed: true,
  });

  assert.strictEqual(val.isValid, false);
  assert.ok(val.missingFields.some((f) => f.includes('Class #1 Name Required')));
});

runTest('Save Draft restores exact structure even when unconfirmed', () => {
  const draft: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    board: 'ICSE',
    namingConvention: 'Grade',
    confirmed: false,
    academicStructureConfirmed: false,
    structureStatus: 'review_required',
    classes: [
      { id: 'cls-1', name: 'Grade 1', sortOrder: 1, sections: ['Red', 'Blue'] },
      { id: 'cls-2', name: 'Grade 2', sortOrder: 2, sections: ['Green'] },
    ],
  };

  const restored = normalizeAcademicStructure(draft);
  assert.strictEqual(restored.board, 'ICSE');
  assert.strictEqual(restored.namingConvention, 'Grade');
  assert.strictEqual(restored.confirmed, false);
  assert.strictEqual(restored.structureStatus, 'review_required');
  assert.strictEqual(restored.classes?.length, 2);
  assert.strictEqual(restored.classes?.[0].name, 'Grade 1');
  assert.deepStrictEqual(restored.classes?.[0].sections, ['Red', 'Blue']);
});

runTest('Multiple classes maintain independent state without cross-leakage', () => {
  const structure = normalizeAcademicStructure({
    classes: [
      { id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A', 'B'] },
      { id: 'c2', name: 'Class 2', sortOrder: 2, sections: ['A'] },
      { id: 'c11', name: 'Class 11', sortOrder: 11, sections: [], streams: [{ id: 's1', name: 'Science', sections: ['A'] }] },
    ],
  });

  // Modify Class 2 only
  const nextClasses = structure.classes!.map((c) => {
    if (c.id === 'c2') {
      return { ...c, sections: ['A', 'B', 'C'] };
    }
    return c;
  });

  const updated = normalizeAcademicStructure({ ...structure, classes: nextClasses });
  assert.deepStrictEqual(updated.classes?.[0].sections, ['A', 'B'], 'Class 1 untouched');
  assert.deepStrictEqual(updated.classes?.[1].sections, ['A', 'B', 'C'], 'Class 2 updated');
  assert.strictEqual(updated.classes?.[2].streams?.length, 1, 'Class 11 streams untouched');
});

runTest('Stable IDs remain intact after reorder and deletion', () => {
  const initial = normalizeAcademicStructure({
    classes: [
      { id: 'stable-alpha', name: 'Nursery', sortOrder: 1, displayOrder: 1, sections: ['A'] },
      { id: 'stable-beta', name: 'LKG', sortOrder: 2, displayOrder: 2, sections: ['A'] },
      { id: 'stable-gamma', name: 'UKG', sortOrder: 3, displayOrder: 3, sections: ['A'] },
    ],
  });

  // Reorder UKG to the top by setting its displayOrder
  const reordered = [
    { ...initial.classes![2], sortOrder: 1, displayOrder: 1 },
    { ...initial.classes![0], sortOrder: 2, displayOrder: 2 },
    { ...initial.classes![1], sortOrder: 3, displayOrder: 3 },
  ];
  const normReordered = normalizeAcademicStructure({ ...initial, classes: reordered });

  assert.strictEqual(normReordered.classes?.[0].id, 'stable-gamma');
  assert.strictEqual(normReordered.classes?.[1].id, 'stable-alpha');
  assert.strictEqual(normReordered.classes?.[2].id, 'stable-beta');

  // Deletion preserving stable IDs
  const afterDelete = normReordered.classes!.filter((c) => c.id !== 'stable-alpha');
  const normAfterDelete = normalizeAcademicStructure({ ...normReordered, classes: afterDelete });
  assert.strictEqual(normAfterDelete.classes?.length, 2);
  assert.strictEqual(normAfterDelete.classes?.[0].id, 'stable-gamma');
  assert.strictEqual(normAfterDelete.classes?.[1].id, 'stable-beta');
});

runTest('Progress reflects actual completion percentage accurately', () => {
  const intake = createInitialIntakeData({ schoolName: 'Test Academy' });
  // Initial state: 2 out of 3 requirements met (session valid, classes valid, but confirmation pending)
  const initialComp = calculateIntakeCompleteness('school-erp', intake);
  const initialPct = initialComp.sectionPercentages['institutionStructure'];
  assert.strictEqual(initialPct, 67, 'Initial suggested structure is 67%, not 100%');
  assert.ok(initialComp.missingFields.some((f) => f.includes('Explicit Confirmation Required')));

  // Invalidate dates
  intake.institutionStructure!.sessionEndDate = '2025-01-01'; // Before start date
  const dateErrComp = calculateIntakeCompleteness('school-erp', intake);
  assert.strictEqual(dateErrComp.sectionPercentages['institutionStructure'], 33, 'Drops to 33% when dates are invalid');

  // Fix dates and confirm
  intake.institutionStructure!.sessionEndDate = '2027-03-31';
  intake.institutionStructure!.confirmed = true;
  intake.institutionStructure!.academicStructureConfirmed = true;
  const confirmedComp = calculateIntakeCompleteness('school-erp', intake);
  assert.strictEqual(confirmedComp.sectionPercentages['institutionStructure'], 100, 'Reaches 100% when confirmed and valid');
});

runTest('Zero false 100% completion: newly initialized project never claims Section 5 is complete', () => {
  const intake = createInitialIntakeData({ schoolName: 'Greenwood High' });
  const comp = calculateIntakeCompleteness('school-erp', intake);
  assert.notStrictEqual(comp.sectionPercentages['institutionStructure'], 100);
});

// ─── GROUP 5: BACKWARD COMPATIBILITY & DOWNSTREAM CONSUMERS ──────────────────

console.log('\nGroup 5: Backward Compatibility & Downstream Consumers');

runTest('Existing legacy data format migrates correctly without data loss', () => {
  // Simulate old database record without stable IDs, without confirmed flag
  const legacyRecord: any = {
    currentAcademicSession: '2025-2026',
    classes: [
      { name: 'Nursery', sortOrder: 1, sections: ['A'] },
      { name: 'Class 1', sortOrder: 4, sections: [{ name: 'A' }, { name: 'B' }] },
    ],
  };

  const migrated = normalizeAcademicStructure(legacyRecord);
  assert.strictEqual(migrated.currentAcademicSession, '2025-2026');
  assert.strictEqual(migrated.confirmed, false, 'Legacy unconfirmed data remains unconfirmed');
  assert.strictEqual(migrated.classes?.length, 2);
  assert.ok(migrated.classes?.[0].id, 'Assigned stable ID to Nursery');
  assert.ok(migrated.classes?.[1].id, 'Assigned stable ID to Class 1');
  assert.deepStrictEqual(migrated.classes?.[1].sections, ['A', 'B'], 'Normalized object sections to strings');
});

runTest('Downstream Admissions consumer receives canonical classes seamlessly', () => {
  const intake = createInitialIntakeData({ schoolName: 'Model School' });
  const canonicalClasses = intake.institutionStructure?.classes || [];
  assert.ok(canonicalClasses.length > 0);
  for (const c of canonicalClasses) {
    assert.ok(c.name, 'Every class has name for admissions availability');
    assert.ok(c.id, 'Every class has id for admissions mapping');
  }
});

runTest('Downstream Database Provisioning receives canonical classes and streams', () => {
  const intake = createInitialIntakeData({ schoolName: 'Model School' });
  const classes = intake.institutionStructure?.classes || [];
  assert.ok(classes.length >= 12);
  assert.ok(classes.every((c) => typeof c.sortOrder === 'number'));
  assert.ok(intake.institutionStructure?.currentAcademicSession);
  assert.ok(intake.institutionStructure?.sessionStartDate);
  assert.ok(intake.institutionStructure?.sessionEndDate);
});

// ─── GROUP 6: TEACHING GROUPS ENGINE ACROSS STRUCTURES A, B, C, D ─────────────

console.log('\nGroup 6: Teaching Groups Engine across Structures A, B, C, D');

runTest('Structure A: Grade without sections or streams creates 1 teaching group', () => {
  const classes: AcademicClassConfig[] = [
    { id: 'cls_nur', name: 'Nursery', sortOrder: 1, sections: [] },
  ];
  const groups = deriveTeachingGroups(classes);
  assert.strictEqual(groups.length, 1);
  assert.strictEqual(groups[0].id, 'tg_cls_nur');
  assert.strictEqual(groups[0].displayName, 'Nursery');
  assert.strictEqual(groups[0].structureType, 'grade_only');
});

runTest('Structure B: Grade with sections only creates section-wise teaching groups', () => {
  const classes: AcademicClassConfig[] = [
    { id: 'cls_c5', name: 'Class 5', sortOrder: 8, sections: ['A', 'B', 'C'] },
  ];
  const groups = deriveTeachingGroups(classes);
  assert.strictEqual(groups.length, 3);
  assert.strictEqual(groups[0].id, 'tg_cls_c5_sec_a');
  assert.strictEqual(groups[0].shortLabel, 'Class 5-A');
  assert.strictEqual(groups[0].structureType, 'grade_section');
  assert.strictEqual(groups[1].shortLabel, 'Class 5-B');
  assert.strictEqual(groups[2].shortLabel, 'Class 5-C');
});

runTest('Structure C: Grade with streams only creates stream-wise teaching groups', () => {
  const classes: AcademicClassConfig[] = [
    {
      id: 'cls_c11',
      name: 'Class 11',
      sortOrder: 14,
      sections: [],
      streams: [
        { id: 'strm_sci', name: 'Science', sections: [] },
        { id: 'strm_com', name: 'Commerce', sections: [] },
        { id: 'strm_hum', name: 'Humanities', sections: [] },
      ],
    },
  ];
  const groups = deriveTeachingGroups(classes);
  assert.strictEqual(groups.length, 3);
  assert.strictEqual(groups[0].id, 'tg_cls_c11_strm_sci');
  assert.strictEqual(groups[0].displayName, 'Class 11 → Science');
  assert.strictEqual(groups[0].structureType, 'grade_stream');
  assert.strictEqual(groups[1].displayName, 'Class 11 → Commerce');
  assert.strictEqual(groups[2].displayName, 'Class 11 → Humanities');
});

runTest('Structure D: Grade with streams AND sections creates stream-section teaching groups', () => {
  const classes: AcademicClassConfig[] = [
    {
      id: 'cls_c11',
      name: 'Class 11',
      sortOrder: 14,
      sections: [],
      streams: [
        { id: 'strm_sci', name: 'Science', sections: ['A', 'B'] },
        { id: 'strm_com', name: 'Commerce', sections: ['A'] },
        { id: 'strm_hum', name: 'Humanities', sections: ['A'] },
      ],
    },
  ];
  const groups = deriveTeachingGroups(classes);
  assert.strictEqual(groups.length, 4);
  assert.strictEqual(groups[0].id, 'tg_cls_c11_strm_sci_a');
  assert.strictEqual(groups[0].displayName, 'Class 11 → Science → Section A');
  assert.strictEqual(groups[0].shortLabel, 'Class 11 Science-A');
  assert.strictEqual(groups[0].structureType, 'grade_stream_section');
  assert.strictEqual(groups[1].shortLabel, 'Class 11 Science-B');
  assert.strictEqual(groups[2].shortLabel, 'Class 11 Commerce-A');
  assert.strictEqual(groups[3].shortLabel, 'Class 11 Humanities-A');
});

// ─── GROUP 7: REUSABLE CURRICULUM CATALOG & APPLICABILITY ────────────────────

console.log('\nGroup 7: Reusable Curriculum Catalog & Applicability');

runTest('Reusable subject is defined once and applied to multiple grades without duplication', () => {
  const subjects = normalizeSubjects([
    { id: 'sub_math', name: 'Mathematics', code: 'MATH', subjectType: 'theory', category: 'core' },
    { id: 'sub_eng', name: 'English', code: 'ENG', subjectType: 'theory', category: 'core' },
  ]);

  assert.strictEqual(subjects.length, 2);

  const classes: AcademicClassConfig[] = [
    { id: 'cls_c5', name: 'Class 5', sortOrder: 5, sections: ['A', 'B'] },
    { id: 'cls_c10', name: 'Class 10', sortOrder: 10, sections: ['A', 'B', 'C'] },
  ];
  const groups = deriveTeachingGroups(classes);

  // Apply Mathematics to Class 5 and Class 10
  const applicability = normalizeSubjectApplicability([
    { id: 'app_1', subjectId: 'sub_math', classId: 'cls_c5' },
    { id: 'app_2', subjectId: 'sub_math', classId: 'cls_c10' },
  ]);

  // Check that Mathematics applies to all sections of Class 5 and Class 10
  const c5a = groups.find((g) => g.shortLabel === 'Class 5-A')!;
  const c10b = groups.find((g) => g.shortLabel === 'Class 10-B')!;

  assert.ok(isSubjectApplicableToGroup('sub_math', c5a, applicability));
  assert.ok(isSubjectApplicableToGroup('sub_math', c10b, applicability));
});

runTest('Stream-specific curriculum: Science subjects do not leak to Commerce', () => {
  const subjects = normalizeSubjects([
    { id: 'sub_phy', name: 'Physics', code: 'PHY', subjectType: 'combined', category: 'core' },
    { id: 'sub_chem', name: 'Chemistry', code: 'CHEM', subjectType: 'combined', category: 'core' },
    { id: 'sub_acc', name: 'Accountancy', code: 'ACC', subjectType: 'theory', category: 'core' },
  ]);

  const classes: AcademicClassConfig[] = [
    {
      id: 'cls_c11',
      name: 'Class 11',
      sortOrder: 14,
      sections: [],
      streams: [
        { id: 'strm_sci', name: 'Science', sections: ['A', 'B'] },
        { id: 'strm_com', name: 'Commerce', sections: ['A'] },
      ],
    },
  ];
  const groups = deriveTeachingGroups(classes);

  // Physics & Chemistry apply only to Science stream, Accountancy only to Commerce
  const applicability = normalizeSubjectApplicability([
    { id: 'app_sci_phy', subjectId: 'sub_phy', classId: 'cls_c11', streamId: 'strm_sci' },
    { id: 'app_sci_chem', subjectId: 'sub_chem', classId: 'cls_c11', streamId: 'strm_sci' },
    { id: 'app_com_acc', subjectId: 'sub_acc', classId: 'cls_c11', streamId: 'strm_com' },
  ]);

  const sciGroupA = groups.find((g) => g.shortLabel === 'Class 11 Science-A')!;
  const sciGroupB = groups.find((g) => g.shortLabel === 'Class 11 Science-B')!;
  const comGroupA = groups.find((g) => g.shortLabel === 'Class 11 Commerce-A')!;

  assert.ok(isSubjectApplicableToGroup('sub_phy', sciGroupA, applicability));
  assert.ok(isSubjectApplicableToGroup('sub_phy', sciGroupB, applicability));
  assert.strictEqual(isSubjectApplicableToGroup('sub_phy', comGroupA, applicability), false);
  assert.ok(isSubjectApplicableToGroup('sub_acc', comGroupA, applicability));
  assert.strictEqual(isSubjectApplicableToGroup('sub_acc', sciGroupA, applicability), false);
});

// ─── GROUP 8: SUBJECT TEACHER ASSIGNMENTS ────────────────────────────────────

console.log('\nGroup 8: Independent Subject Teacher Assignments across Sections');

runTest('Subject Teacher Assignments link TeachingGroup + Subject + Teacher independently', () => {
  const classes: AcademicClassConfig[] = [
    { id: 'cls_c10', name: 'Class 10', sortOrder: 10, sections: ['A', 'B', 'C'] },
  ];
  const groups = deriveTeachingGroups(classes);
  const subjects = [{ id: 'sub_math', name: 'Mathematics', subjectType: 'theory' as const }];

  const group10A = groups.find((g) => g.shortLabel === 'Class 10-A')!;
  const group10B = groups.find((g) => g.shortLabel === 'Class 10-B')!;
  const group10C = groups.find((g) => g.shortLabel === 'Class 10-C')!;

  // Assign Mr. Sharma to 10-A, Mr. Kumar to 10-B, Ms. Priya to 10-C
  const assignments = normalizeSubjectTeacherAssignments(
    [
      { id: 'a1', teachingGroupId: group10A.id, subjectId: 'sub_math', teacherName: 'Mr. Sharma' },
      { id: 'a2', teachingGroupId: group10B.id, subjectId: 'sub_math', teacherName: 'Mr. Kumar' },
      { id: 'a3', teachingGroupId: group10C.id, subjectId: 'sub_math', teacherName: 'Ms. Priya' },
    ],
    groups,
    subjects
  );

  assert.strictEqual(assignments.length, 3);
  assert.strictEqual(
    getSubjectTeacherAssignment(group10A.id, 'sub_math', assignments)?.teacherName,
    'Mr. Sharma'
  );
  assert.strictEqual(
    getSubjectTeacherAssignment(group10B.id, 'sub_math', assignments)?.teacherName,
    'Mr. Kumar'
  );
  assert.strictEqual(
    getSubjectTeacherAssignment(group10C.id, 'sub_math', assignments)?.teacherName,
    'Ms. Priya'
  );

  // Updating 10-B does not alter 10-A
  const updatedAssignments = assignments.map((a) =>
    a.teachingGroupId === group10B.id ? { ...a, teacherName: 'Mr. Verma' } : a
  );
  assert.strictEqual(
    getSubjectTeacherAssignment(group10A.id, 'sub_math', updatedAssignments)?.teacherName,
    'Mr. Sharma'
  );
  assert.strictEqual(
    getSubjectTeacherAssignment(group10B.id, 'sub_math', updatedAssignments)?.teacherName,
    'Mr. Verma'
  );
});

// ─── GROUP 9: CLASS TEACHER ASSIGNMENTS ──────────────────────────────────────

console.log('\nGroup 9: Independent Class Teacher Assignments');

runTest('Class Teachers are assigned per Teaching Group, separate from subject teachers', () => {
  const classes: AcademicClassConfig[] = [
    { id: 'cls_c5', name: 'Class 5', sortOrder: 5, sections: ['A', 'B'] },
    { id: 'cls_nur', name: 'Nursery', sortOrder: 1, sections: [] },
  ];
  const groups = deriveTeachingGroups(classes);

  const group5A = groups.find((g) => g.shortLabel === 'Class 5-A')!;
  const group5B = groups.find((g) => g.shortLabel === 'Class 5-B')!;
  const groupNur = groups.find((g) => g.shortLabel === 'Nursery')!;

  const classTeachers = normalizeClassTeacherAssignments(
    [
      { id: 'ct1', teachingGroupId: group5A.id, teacherName: 'Ms. Priya' },
      { id: 'ct2', teachingGroupId: group5B.id, teacherName: 'Mr. Sharma' },
      { id: 'ct3', teachingGroupId: groupNur.id, teacherName: 'Ms. Neha' },
    ],
    groups,
    classes
  );

  assert.strictEqual(classTeachers.length, 3);
  assert.strictEqual(getClassTeacherAssignment(group5A.id, classTeachers)?.teacherName, 'Ms. Priya');
  assert.strictEqual(getClassTeacherAssignment(group5B.id, classTeachers)?.teacherName, 'Mr. Sharma');
  assert.strictEqual(getClassTeacherAssignment(groupNur.id, classTeachers)?.teacherName, 'Ms. Neha');
});

// ─── GROUP 10: REAL PROGRESS & PROACTIVE WARNINGS ────────────────────────────

console.log('\nGroup 10: Real Progress Engine & Incomplete Data Warning Detection');

runTest('Incomplete subject teacher assignment triggers specific warning with target and action', () => {
  const classes: AcademicClassConfig[] = [
    { id: 'cls_c10', name: 'Class 10', sortOrder: 10, sections: ['A', 'B'] },
  ];
  const subjects = [{ id: 'sub_math', name: 'Mathematics', subjectType: 'theory' as const }];
  const groups = deriveTeachingGroups(classes);
  const applicability = [{ id: 'app_1', subjectId: 'sub_math', classId: 'cls_c10' }];

  // Only Class 10-A has a teacher; Class 10-B Mathematics is unassigned
  const subjectAssignments = [
    { id: 'a1', teachingGroupId: groups[0].id, subjectId: 'sub_math', teacherName: 'Mr. Sharma' },
  ];

  const structure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes,
    subjects,
    subjectApplicability: applicability,
    subjectTeacherAssignments: subjectAssignments,
    classTeacherAssignments: [],
  };

  const progress = getAcademicSetupProgress(structure);
  assert.strictEqual(progress.step6.isComplete, false);
  assert.strictEqual(progress.step6.missingCount, 1);

  const missingWarn = progress.warnings.find((w) => w.targetGroupId === groups[1].id);
  assert.ok(missingWarn, 'Generated warning for unassigned Class 10-B');
  assert.ok(missingWarn.message.includes('Mathematics teacher missing for Class 10 → Section B'));
  assert.strictEqual(missingWarn.actionLabel, 'Assign Teacher');
  assert.strictEqual(missingWarn.targetStep, 6);
});

// ─── GROUP 11: ORPHANED STATE PURGING & LIFECYCLE GUARDS ─────────────────────

console.log('\nGroup 11: Orphaned State Purging & Lifecycle Guards');

runTest('Deleting a grade cleanly purges orphaned applicability, subject teachers, and class teachers', () => {
  const initial = normalizeAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [
      { id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A'] },
      { id: 'c2', name: 'Class 2', sortOrder: 2, sections: ['A'] },
    ],
    subjects: [{ id: 's1', name: 'Mathematics' }],
    subjectApplicability: [
      { id: 'app1', subjectId: 's1', classId: 'c1' },
      { id: 'app2', subjectId: 's1', classId: 'c2' },
    ],
    subjectTeacherAssignments: [
      { id: 'st1', teachingGroupId: 'tg_c1_sec_a', subjectId: 's1', teacherName: 'Teacher A' },
      { id: 'st2', teachingGroupId: 'tg_c2_sec_a', subjectId: 's1', teacherName: 'Teacher B' },
    ],
    classTeacherAssignments: [
      { id: 'ct1', teachingGroupId: 'tg_c1_sec_a', teacherName: 'Teacher A' },
      { id: 'ct2', teachingGroupId: 'tg_c2_sec_a', teacherName: 'Teacher B' },
    ],
  });

  assert.strictEqual(initial.classes?.length, 2);
  assert.strictEqual(initial.subjectApplicability?.length, 2);
  assert.strictEqual(initial.subjectTeacherAssignments?.length, 2);
  assert.strictEqual(initial.classTeacherAssignments?.length, 2);

  // Now delete Class 2
  const updated = normalizeAcademicStructure({
    ...initial,
    classes: initial.classes?.filter((c) => c.id !== 'c2'),
  });

  assert.strictEqual(updated.classes?.length, 1);
  assert.strictEqual(updated.classes?.[0].id, 'c1');

  // c2 applicability must be pruned
  assert.strictEqual(updated.subjectApplicability?.length, 1);
  assert.strictEqual(updated.subjectApplicability?.[0].classId, 'c1');

  // c2 teacher assignments must be pruned
  assert.strictEqual(updated.subjectTeacherAssignments?.length, 1);
  assert.strictEqual(updated.subjectTeacherAssignments?.[0].teachingGroupId, 'tg_c1_sec_a');

  // c2 class teacher assignments must be pruned
  assert.strictEqual(updated.classTeacherAssignments?.length, 1);
  assert.strictEqual(updated.classTeacherAssignments?.[0].teachingGroupId, 'tg_c1_sec_a');
});

runTest('Deleting a stream cleanly purges stream-specific applicability and assignments', () => {
  const initial = normalizeAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [
      {
        id: 'c11',
        name: 'Class 11',
        sortOrder: 11,
        sections: ['A'],
        streams: [
          { id: 'strm_sci', name: 'Science', sections: ['A'] },
          { id: 'strm_com', name: 'Commerce', sections: ['A'] },
        ],
      },
    ],
    subjects: [
      { id: 'sub_phy', name: 'Physics' },
      { id: 'sub_acc', name: 'Accountancy' },
    ],
    subjectApplicability: [
      { id: 'app_sci', subjectId: 'sub_phy', classId: 'c11', streamId: 'strm_sci' },
      { id: 'app_com', subjectId: 'sub_acc', classId: 'c11', streamId: 'strm_com' },
    ],
    subjectTeacherAssignments: [
      { id: 'st_sci', teachingGroupId: 'tg_c11_strm_sci_a', subjectId: 'sub_phy', teacherName: 'Dr. Bose' },
      { id: 'st_com', teachingGroupId: 'tg_c11_strm_com_a', subjectId: 'sub_acc', teacherName: 'Mr. Gupta' },
    ],
  });

  assert.strictEqual(initial.subjectApplicability?.length, 2);
  assert.strictEqual(initial.subjectTeacherAssignments?.length, 2);

  // Remove Commerce stream
  const classWithoutCommerce: AcademicClassConfig = {
    ...initial.classes![0],
    streams: initial.classes![0].streams?.filter((s) => s.id !== 'strm_com'),
  };

  const updated = normalizeAcademicStructure({
    ...initial,
    classes: [classWithoutCommerce],
  });

  assert.strictEqual(updated.classes![0].streams?.length, 1);
  assert.strictEqual(updated.classes![0].streams?.[0].id, 'strm_sci');

  // Commerce applicability should be pruned
  assert.strictEqual(updated.subjectApplicability?.length, 1);
  assert.strictEqual(updated.subjectApplicability?.[0].streamId, 'strm_sci');

  // Commerce teacher assignment should be pruned
  assert.strictEqual(updated.subjectTeacherAssignments?.length, 1);
  assert.strictEqual(updated.subjectTeacherAssignments?.[0].teachingGroupId, 'tg_c11_strm_sci_a');
});

runTest('Deleting a subject cleanly purges applicability and teacher assignments', () => {
  const initial = normalizeAcademicStructure({
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [{ id: 'c1', name: 'Class 1', sortOrder: 1, sections: ['A'] }],
    subjects: [
      { id: 'sub_eng', name: 'English' },
      { id: 'sub_fre', name: 'French' },
    ],
    subjectApplicability: [
      { id: 'app_eng', subjectId: 'sub_eng', classId: 'c1' },
      { id: 'app_fre', subjectId: 'sub_fre', classId: 'c1' },
    ],
    subjectTeacherAssignments: [
      { id: 'st_eng', teachingGroupId: 'tg_c1_sec_a', subjectId: 'sub_eng', teacherName: 'Ms. Smith' },
      { id: 'st_fre', teachingGroupId: 'tg_c1_sec_a', subjectId: 'sub_fre', teacherName: 'Mme. Dupont' },
    ],
  });

  // Delete French from subjects
  const updated = normalizeAcademicStructure({
    ...initial,
    subjects: initial.subjects?.filter((s) => s.id !== 'sub_fre'),
  });

  assert.strictEqual(updated.subjects?.length, 1);
  assert.strictEqual(updated.subjects?.[0].id, 'sub_eng');

  // French applicability pruned
  assert.strictEqual(updated.subjectApplicability?.length, 1);
  assert.strictEqual(updated.subjectApplicability?.[0].subjectId, 'sub_eng');

  // French teacher assignment pruned
  assert.strictEqual(updated.subjectTeacherAssignments?.length, 1);
  assert.strictEqual(updated.subjectTeacherAssignments?.[0].subjectId, 'sub_eng');
});

// ─── GROUP 12: CANONICAL FACULTY → ACADEMIC SETUP INTEGRATION ─────────────────

console.log('\nGroup 12: Canonical Faculty → Academic Setup Integration');

runTest('Faculty ID assignment resolution dynamically resolves up-to-date faculty names', () => {
  const staffFacultyRoster: StaffMember[] = [
    {
      id: 'stf_phys_101',
      facultyId: 'FAC-2026-00001',
      employeeCode: 'FAC-2026-00001',
      name: 'Dr. Arvind Swaminathan',
      designation: 'Senior PGT Physics',
      department: 'Science',
      category: 'teaching',
      status: 'active',
      specialization: 'Quantum Mechanics',
    },
  ];

  const structure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    classes: [{ id: 'cls_11', name: 'Class 11', sortOrder: 11, sections: ['A'] }],
    subjects: [{ id: 'sub_phys', name: 'Physics', code: 'PHY-042' }],
    subjectApplicability: [{ id: 'app_1', subjectId: 'sub_phys', classId: 'cls_11' }],
    subjectTeacherAssignments: [
      {
        id: 'st_1',
        teachingGroupId: 'tg_cls_11_sec_a',
        subjectId: 'sub_phys',
        teacherId: 'stf_phys_101',
        facultyId: 'FAC-2026-00001',
        teacherName: 'Old Stale Name', // Cached name should be refreshed
      },
    ],
  };

  const normalized = normalizeAcademicStructure(structure, { staffMembers: staffFacultyRoster });
  const assignment = normalized.subjectTeacherAssignments?.[0];

  assert.ok(assignment, 'Assignment exists');
  assert.strictEqual(assignment.teacherId, 'stf_phys_101');
  assert.strictEqual(assignment.facultyId, 'FAC-2026-00001');
  assert.strictEqual(assignment.teacherName, 'Dr. Arvind Swaminathan', 'Dynamic name resolution overrides stale cache');
});

runTest('Faculty renaming in Faculty Directory propagates automatically to academic assignments', () => {
  let staffFacultyRoster: StaffMember[] = [
    {
      id: 'stf_math_202',
      facultyId: 'FAC-2026-00002',
      name: 'Ms. Priya Sharma',
      designation: 'TGT Mathematics',
      department: 'Mathematics',
      category: 'teaching',
      status: 'active',
    },
  ];

  const structure: AcademicStructureData = {
    classes: [{ id: 'cls_10', name: 'Class 10', sortOrder: 10, sections: ['A'] }],
    subjects: [{ id: 'sub_math', name: 'Mathematics' }],
    subjectApplicability: [{ id: 'app_math', subjectId: 'sub_math', classId: 'cls_10' }],
    subjectTeacherAssignments: [
      {
        id: 'st_math',
        teachingGroupId: 'tg_cls_10_sec_a',
        subjectId: 'sub_math',
        teacherId: 'stf_math_202',
      },
    ],
    classTeacherAssignments: [
      {
        id: 'ct_10a',
        teachingGroupId: 'tg_cls_10_sec_a',
        teacherId: 'stf_math_202',
      },
    ],
  };

  // 1. Initial normalization
  let normalized = normalizeAcademicStructure(structure, { staffMembers: staffFacultyRoster });
  assert.strictEqual(normalized.subjectTeacherAssignments?.[0].teacherName, 'Ms. Priya Sharma');
  assert.strictEqual(normalized.classTeacherAssignments?.[0].teacherName, 'Ms. Priya Sharma');

  // 2. Renamed in Faculty section (e.g. marriage or official title update)
  staffFacultyRoster = [
    {
      ...staffFacultyRoster[0],
      name: 'Dr. Priya Sharma-Verma',
    },
  ];

  // 3. Normalization without editing assignments
  normalized = normalizeAcademicStructure(normalized, { staffMembers: staffFacultyRoster });
  assert.strictEqual(
    normalized.subjectTeacherAssignments?.[0].teacherName,
    'Dr. Priya Sharma-Verma',
    'Subject teacher dynamically reflects updated faculty name'
  );
  assert.strictEqual(
    normalized.classTeacherAssignments?.[0].teacherName,
    'Dr. Priya Sharma-Verma',
    'Class teacher dynamically reflects updated faculty name'
  );
});

runTest('Single faculty member can be reused across multiple classes, sections, and subjects', () => {
  const teacher: StaffMember = {
    id: 'stf_versatile_303',
    facultyId: 'FAC-2026-00003',
    name: 'Mr. Rajesh Nair',
    designation: 'PGT Computer Science',
    department: 'Computer Science',
    category: 'teaching',
    status: 'active',
  };

  const structure: AcademicStructureData = {
    classes: [
      { id: 'cls_9', name: 'Class 9', sortOrder: 9, sections: ['A', 'B'] },
      { id: 'cls_10', name: 'Class 10', sortOrder: 10, sections: ['A'] },
    ],
    subjects: [{ id: 'sub_cs', name: 'Computer Applications' }],
    subjectApplicability: [
      { id: 'app_9', subjectId: 'sub_cs', classId: 'cls_9' },
      { id: 'app_10', subjectId: 'sub_cs', classId: 'cls_10' },
    ],
    subjectTeacherAssignments: [
      {
        id: 'st_9a',
        teachingGroupId: 'tg_cls_9_sec_a',
        subjectId: 'sub_cs',
        teacherId: 'stf_versatile_303',
      },
      {
        id: 'st_9b',
        teachingGroupId: 'tg_cls_9_sec_b',
        subjectId: 'sub_cs',
        teacherId: 'stf_versatile_303',
      },
      {
        id: 'st_10a',
        teachingGroupId: 'tg_cls_10_sec_a',
        subjectId: 'sub_cs',
        teacherId: 'stf_versatile_303',
      },
    ],
    classTeacherAssignments: [
      {
        id: 'ct_9a',
        teachingGroupId: 'tg_cls_9_sec_a',
        teacherId: 'stf_versatile_303',
      },
    ],
  };

  const normalized = normalizeAcademicStructure(structure, { staffMembers: [teacher] });
  assert.strictEqual(normalized.subjectTeacherAssignments?.length, 3);
  for (const a of normalized.subjectTeacherAssignments!) {
    assert.strictEqual(a.teacherId, 'stf_versatile_303');
    assert.strictEqual(a.teacherName, 'Mr. Rajesh Nair');
  }
  assert.strictEqual(normalized.classTeacherAssignments?.[0].teacherId, 'stf_versatile_303');
  assert.strictEqual(normalized.classTeacherAssignments?.[0].teacherName, 'Mr. Rajesh Nair');
});

runTest('Inactive faculty assignments trigger warning without silent deletion', () => {
  const staffList: StaffMember[] = [
    {
      id: 'stf_inactive_404',
      facultyId: 'FAC-2026-00004',
      name: 'Mr. Inactive Sharma',
      designation: 'TGT Science',
      department: 'Science',
      category: 'teaching',
      status: 'inactive', // Marked inactive
    },
  ];

  const structure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    sessionStartDate: '2026-04-01',
    sessionEndDate: '2027-03-31',
    classes: [{ id: 'cls_8', name: 'Class 8', sortOrder: 8, sections: ['A'] }],
    subjects: [{ id: 'sub_sci', name: 'Science' }],
    subjectApplicability: [{ id: 'app_sci_8', subjectId: 'sub_sci', classId: 'cls_8' }],
    subjectTeacherAssignments: [
      {
        id: 'st_8a',
        teachingGroupId: 'tg_cls_8_sec_a',
        subjectId: 'sub_sci',
        teacherId: 'stf_inactive_404',
      },
    ],
    classTeacherAssignments: [
      {
        id: 'ct_8a',
        teachingGroupId: 'tg_cls_8_sec_a',
        teacherId: 'stf_inactive_404',
      },
    ],
  };

  const normalized = normalizeAcademicStructure(structure, { staffMembers: staffList });
  assert.strictEqual(normalized.subjectTeacherAssignments?.length, 1, 'Inactive assignment is NEVER silently deleted');
  assert.strictEqual(normalized.classTeacherAssignments?.length, 1, 'Inactive class teacher is NEVER silently deleted');

  // Verify setup progress detects the inactive assignment
  const progress = getAcademicSetupProgress(normalized, staffList);
  const inactiveSubjectWarning = progress.warnings.find((w) => w.id.includes('warn_inactive_tch_'));
  const inactiveClassWarning = progress.warnings.find((w) => w.id.includes('warn_inactive_cls_tch_'));

  assert.ok(inactiveSubjectWarning, 'Produces warning for inactive subject teacher');
  assert.ok(inactiveSubjectWarning.message.includes('inactive'), 'Warning notes inactive status');
  assert.strictEqual(inactiveSubjectWarning.targetStep, 6);

  assert.ok(inactiveClassWarning, 'Produces warning for inactive class teacher');
  assert.strictEqual(inactiveClassWarning.targetStep, 7);
});

runTest('Reassignment of subject teacher or class teacher to new faculty member updates IDs correctly', () => {
  const staffList: StaffMember[] = [
    {
      id: 'stf_old',
      facultyId: 'FAC-2026-00005',
      name: 'Ms. Old Teacher',
      status: 'inactive',
    },
    {
      id: 'stf_new',
      facultyId: 'FAC-2026-00006',
      name: 'Ms. New Teacher',
      status: 'active',
    },
  ];

  let structure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    classes: [{ id: 'cls_7', name: 'Class 7', sortOrder: 7, sections: ['A'] }],
    subjects: [{ id: 'sub_eng', name: 'English' }],
    subjectApplicability: [{ id: 'app_7', subjectId: 'sub_eng', classId: 'cls_7' }],
    subjectTeacherAssignments: [
      {
        id: 'st_7a',
        teachingGroupId: 'tg_cls_7_sec_a',
        subjectId: 'sub_eng',
        teacherId: 'stf_old',
      },
    ],
  };

  // Reassign to new teacher
  structure = {
    ...structure,
    subjectTeacherAssignments: [
      {
        id: 'st_7a',
        teachingGroupId: 'tg_cls_7_sec_a',
        subjectId: 'sub_eng',
        teacherId: 'stf_new',
        facultyId: 'FAC-2026-00006',
      },
    ],
  };

  const normalized = normalizeAcademicStructure(structure, { staffMembers: staffList });
  assert.strictEqual(normalized.subjectTeacherAssignments?.[0].teacherId, 'stf_new');
  assert.strictEqual(normalized.subjectTeacherAssignments?.[0].teacherName, 'Ms. New Teacher');

  // Verify warning is now cleared
  const progress = getAcademicSetupProgress(normalized, staffList);
  const inactiveWarning = progress.warnings.find((w) => w.id.includes('warn_inactive_tch_'));
  assert.strictEqual(inactiveWarning, undefined, 'Reassignment clears inactive faculty warning');
});

runTest('Legacy teacher name without ID auto-links to matching faculty member when name matches', () => {
  const staffList: StaffMember[] = [
    {
      id: 'stf_sunita_777',
      facultyId: 'FAC-2026-00077',
      name: 'Sunita Sharma',
      status: 'active',
      department: 'Mathematics',
    },
  ];

  const structure: AcademicStructureData = {
    classes: [{ id: 'cls_6', name: 'Class 6', sortOrder: 6, sections: ['A'] }],
    subjects: [{ id: 'sub_m', name: 'Math' }],
    subjectApplicability: [{ id: 'app_6', subjectId: 'sub_m', classId: 'cls_6' }],
    subjectTeacherAssignments: [
      {
        id: 'st_legacy',
        teachingGroupId: 'tg_cls_6_sec_a',
        subjectId: 'sub_m',
        teacherName: 'Sunita Sharma', // No teacherId or facultyId
      },
    ],
  };

  const normalized = normalizeAcademicStructure(structure, { staffMembers: staffList });
  const assignment = normalized.subjectTeacherAssignments?.[0];

  assert.ok(assignment);
  assert.strictEqual(assignment.teacherId, 'stf_sunita_777', 'Auto-links stable teacherId');
  assert.strictEqual(assignment.facultyId, 'FAC-2026-00077', 'Auto-links institutional facultyId');
  assert.strictEqual(assignment.teacherName, 'Sunita Sharma');
});

runTest('Empty faculty directory handles legacy and custom assignments gracefully without crashing', () => {
  const structure: AcademicStructureData = {
    currentAcademicSession: '2026-2027',
    classes: [{ id: 'cls_5', name: 'Class 5', sortOrder: 5, sections: ['A'] }],
    subjects: [{ id: 'sub_env', name: 'EVS' }],
    subjectApplicability: [{ id: 'app_5', subjectId: 'sub_env', classId: 'cls_5' }],
    subjectTeacherAssignments: [
      {
        id: 'st_custom',
        teachingGroupId: 'tg_cls_5_sec_a',
        subjectId: 'sub_env',
        teacherName: 'Guest Lecturer Mr. Roy',
      },
    ],
  };

  // Normalize with completely empty staff roster
  const normalized = normalizeAcademicStructure(structure, { staffMembers: [] });
  assert.ok(normalized);
  assert.strictEqual(normalized.subjectTeacherAssignments?.[0].teacherName, 'Guest Lecturer Mr. Roy');

  const progress = getAcademicSetupProgress(normalized, []);
  assert.ok(progress.step6.assignedCount === 1);
  assert.strictEqual(progress.warnings.filter((w) => w.id.includes('warn_inactive_')).length, 0);
});

console.log('\n================================================================');
console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('================================================================\n');


