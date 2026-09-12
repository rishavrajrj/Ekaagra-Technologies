import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurriculumPresetForBoard,
  normalizeBoardKey,
  getAcademicStageForClass,
  getDefaultSubjectsForStage,
  generateDefaultClassCurricula,
  getInitialCurriculumData,
  BOARD_CURRICULUM_PRESETS,
} from '../curriculumBoardPresets';
import { createInitialIntakeData } from '../schoolIntake';
import { calculateCurriculumCompleteness } from '../academicCompletenessEngine';

test('1. Board preset retrieval and normalization', () => {
  // CBSE
  const cbse = getCurriculumPresetForBoard('CBSE');
  assert.equal(cbse.boardKey, 'CBSE');
  assert.match(cbse.overview.curriculumType, /National Curriculum Framework/);
  assert.match(cbse.overview.assessmentApproach, /CCE/);
  assert.equal(cbse.subjects.length, 9);

  // CISCE / ICSE
  const icse = getCurriculumPresetForBoard('CISCE / ICSE');
  assert.equal(icse.boardKey, 'CISCE / ICSE');
  assert.match(icse.overview.curriculumType, /CISCE/);
  assert.equal(icse.subjects.find((s) => s.id === 'sub-pe')?.name, 'Physical Education & SUPW');

  // State Board
  const stateBoard = getCurriculumPresetForBoard('State Board (BSEB)');
  assert.equal(stateBoard.boardKey, 'State Board');
  assert.match(stateBoard.overview.curriculumType, /State Curriculum Framework/);
  assert.equal(stateBoard.subjects.find((s) => s.id === 'sub-mat')?.name, 'Mathematics (Ganit)');

  // Cambridge
  const cambridge = getCurriculumPresetForBoard('Cambridge (IGCSE)');
  assert.equal(cambridge.boardKey, 'Cambridge');
  assert.match(cambridge.overview.curriculumType, /Cambridge International/);
  assert.equal(cambridge.subjects.find((s) => s.id === 'sub-eng')?.name, 'Cambridge English');

  // IB
  const ib = getCurriculumPresetForBoard('IB World School');
  assert.equal(ib.boardKey, 'IB');
  assert.match(ib.overview.curriculumType, /IB Continuum/);
  assert.equal(ib.subjects.find((s) => s.id === 'sub-cs')?.name, 'Design & Technology');

  // NIOS
  const nios = getCurriculumPresetForBoard('NIOS');
  assert.equal(nios.boardKey, 'NIOS');
  assert.match(nios.overview.curriculumType, /Open & Flexible/);

  // Normalization aliases
  assert.equal(normalizeBoardKey('ICSE'), 'ICSE');
  assert.equal(normalizeBoardKey('BSEB'), 'State Board');
  assert.equal(normalizeBoardKey('CAIE'), 'Cambridge');
  assert.equal(normalizeBoardKey('International Baccalaureate'), 'IB');
  assert.equal(normalizeBoardKey(null), 'CBSE');
});

test('2. Academic stage detection for classes', () => {
  assert.equal(getAcademicStageForClass({ id: '1', name: 'Playgroup', level: 'Pre-Primary' }), 'playgroup');
  assert.equal(getAcademicStageForClass({ id: '2', name: 'Pre-Nursery', level: 'Pre-Primary' }), 'playgroup');
  assert.equal(getAcademicStageForClass({ id: '3', name: 'Nursery', level: 'Pre-Primary' }), 'nursery');
  assert.equal(getAcademicStageForClass({ id: '4', name: 'LKG', level: 'Pre-Primary' }), 'kindergarten');
  assert.equal(getAcademicStageForClass({ id: '5', name: 'UKG', level: 'Pre-Primary' }), 'kindergarten');
  assert.equal(getAcademicStageForClass({ id: '6', name: 'Class 1', level: 'Primary' }), 'primary');
  assert.equal(getAcademicStageForClass({ id: '7', name: 'Class 5', level: 'Primary' }), 'primary');
  assert.equal(getAcademicStageForClass({ id: '8', name: 'Class 6', level: 'Middle' }), 'middle');
  assert.equal(getAcademicStageForClass({ id: '9', name: 'Class 8', level: 'Middle' }), 'middle');
  assert.equal(getAcademicStageForClass({ id: '10', name: 'Class 9', level: 'Secondary' }), 'secondary');
  assert.equal(getAcademicStageForClass({ id: '11', name: 'Class 10', level: 'Secondary' }), 'secondary');
  assert.equal(getAcademicStageForClass({ id: '12', name: 'Class 11', level: 'Senior Secondary' }), 'senior_secondary');
  assert.equal(getAcademicStageForClass({ id: '13', name: 'Class 12', level: 'Senior Secondary' }), 'senior_secondary');
});

test('3. Default subjects for Playgroup stage matches reference (exactly 5 subjects)', () => {
  const pg = getDefaultSubjectsForStage('playgroup');
  assert.equal(pg.subjectIds.length, 5);
  assert.deepEqual(pg.subjectIds, ['sub-eng', 'sub-hin', 'sub-mat', 'sub-art', 'sub-life']);

  const primary = getDefaultSubjectsForStage('primary');
  assert.equal(primary.subjectIds.length, 9);
  assert.ok(primary.subjectIds.includes('sub-sci'));
  assert.ok(primary.subjectIds.includes('sub-sst'));
  assert.ok(primary.subjectIds.includes('sub-cs'));

  const secondary = getDefaultSubjectsForStage('secondary');
  assert.equal(secondary.subjectIds.length, 7);
});

test('4. generateDefaultClassCurricula correctly maps subjects per class', () => {
  const classes = [
    { id: 'c-pg', name: 'Playgroup', level: 'Pre-Primary' },
    { id: 'c-nur', name: 'Nursery', level: 'Pre-Primary' },
    { id: 'c-c1', name: 'Class 1', level: 'Primary' },
    { id: 'c-c10', name: 'Class 10', level: 'Secondary' },
  ];

  const curricula = generateDefaultClassCurricula('CBSE', classes);
  assert.equal(curricula.length, 4);

  const pgCurriculum = curricula.find((c) => c.className === 'Playgroup');
  assert.ok(pgCurriculum);
  assert.equal(pgCurriculum.subjects?.length, 5);
  assert.deepEqual(pgCurriculum.subjects, ['sub-eng', 'sub-hin', 'sub-mat', 'sub-art', 'sub-life']);

  const c1Curriculum = curricula.find((c) => c.className === 'Class 1');
  assert.ok(c1Curriculum);
  assert.equal(c1Curriculum.subjects?.length, 9);

  const c10Curriculum = curricula.find((c) => c.className === 'Class 10');
  assert.ok(c10Curriculum);
  assert.equal(c10Curriculum.subjects?.length, 7);
});

test('5. createInitialIntakeData defaults curriculum based on board', () => {
  // CBSE Default
  const intakeCbse = createInitialIntakeData({
    schoolName: 'SparkNest Academy School',
    board: 'CBSE',
  });
  assert.equal(intakeCbse.curriculum?.overview?.board, 'CBSE');
  assert.match(intakeCbse.curriculum?.overview?.curriculumType || '', /National Curriculum Framework/);
  assert.ok(Array.isArray(intakeCbse.curriculum?.classCurricula));
  assert.ok(intakeCbse.curriculum!.classCurricula!.length >= 10);

  // Verify Class 1 has 9 subjects by default
  const c1 = intakeCbse.curriculum!.classCurricula!.find((c) => c.className === 'Class 1');
  assert.ok(c1);
  assert.equal(c1.subjects?.length, 9);

  // ICSE
  const intakeIcse = createInitialIntakeData({
    schoolName: 'St. Xavier School',
    board: 'CISCE / ICSE',
  });
  assert.equal(intakeIcse.curriculum?.overview?.board, 'CISCE / ICSE');
  assert.match(intakeIcse.curriculum?.overview?.curriculumType || '', /CISCE/);
  const icseSub = intakeIcse.curriculum?.subjects?.find((s) => s.id === 'sub-pe');
  assert.equal(icseSub?.name, 'Physical Education & SUPW');

  // Completeness test
  const completeness = calculateCurriculumCompleteness(intakeCbse);
  assert.equal(completeness.isComplete, true);
  assert.equal(completeness.percentage, 100);
  assert.equal(completeness.missingFields.length, 0);
});
