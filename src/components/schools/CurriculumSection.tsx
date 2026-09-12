'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Layers,
  GraduationCap,
  Info,
  CheckCircle2,
  FileText,
  Compass,
  Award,
  Users,
  Search,
  RotateCcw,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolProject,
  CurriculumData,
  SubjectItem,
  SubjectCategoryType,
  ClassCurriculumItem,
  AcademicClassConfig,
} from '@/lib/types';
import { getSuggestedClassesForSchoolType } from '@/lib/academicStructureUtils';
import { useCampusAcademicScope } from '@/hooks/useCampusAcademicScope';
import { filterCurriculumByCampusScope } from '@/lib/campusAcademicScopeService';
import {
  getCurriculumPresetForBoard,
  generateDefaultClassCurricula,
  BOARD_CURRICULUM_PRESETS,
} from '@/lib/curriculumBoardPresets';
import CampusAcademicScopeSummary from './CampusAcademicScopeSummary';
import ModalPortal from '@/components/ui/ModalPortal';

interface CurriculumSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  project?: SchoolProject | null;
  activeCampusId?: string;
  onNavigateToSection?: (sectionKey: any) => void;
}

const SUBJECT_CATEGORIES: SubjectCategoryType[] = [
  'Language',
  'Mathematics',
  'Science',
  'Social Science',
  'Computer / Technology',
  'Arts',
  'Physical Education',
  'Life Skills',
  'Other',
];

const DEFAULT_CURRICULUM_OVERVIEW = {
  board: 'CBSE',
  curriculumType: 'National Curriculum Framework (NCF / NEP 2020)',
  academicApproach: 'Experiential, Inquiry-Based & Multidisciplinary',
  learningPhilosophy:
    'Nurturing intellectual curiosity, ethical character, critical thinking, and 21st-century problem-solving capabilities.',
  teachingMethodology:
    'Interactive digital smart boards, hands-on composite science laboratories, project-based inquiry, and differentiated student mentoring.',
  assessmentApproach:
    'Continuous and Comprehensive Evaluation (CCE), internal unit assessments, and standardized term-end examinations.',
};

const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: 'sub-eng', name: 'English Language & Literature', category: 'Language', isMandatory: true, applicableClasses: [] },
  { id: 'sub-hin', name: 'Hindi / Regional Language', category: 'Language', isMandatory: true, applicableClasses: [] },
  { id: 'sub-mat', name: 'Mathematics', category: 'Mathematics', isMandatory: true, applicableClasses: [] },
  { id: 'sub-sci', name: 'Science & Discovery', category: 'Science', isMandatory: true, applicableClasses: [] },
  { id: 'sub-sst', name: 'Social Studies & Civics', category: 'Social Science', isMandatory: true, applicableClasses: [] },
  { id: 'sub-cs', name: 'Computer Science & Coding', category: 'Computer / Technology', isMandatory: true, applicableClasses: [] },
  { id: 'sub-art', name: 'Visual Arts & Craft', category: 'Arts', isMandatory: false, applicableClasses: [] },
  { id: 'sub-pe', name: 'Physical Education & Yoga', category: 'Physical Education', isMandatory: true, applicableClasses: [] },
  { id: 'sub-life', name: 'Value Education & Life Skills', category: 'Life Skills', isMandatory: false, applicableClasses: [] },
];

export default function CurriculumSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  project,
  activeCampusId,
  onNavigateToSection,
}: CurriculumSectionProps) {
  // 1. Classes inherited from Campus Academic Scope (Single Source of Truth)
  const campusScope = useCampusAcademicScope(activeCampusId, intakeData);
  const activeClasses: AcademicClassConfig[] = campusScope.classes;

  // 2. Normalized Curriculum Data strictly scoped to Campus Academic Scope
  const curriculum: CurriculumData = useMemo(() => {
    const curr = intakeData.curriculum || {};
    const schoolBoard = curr.overview?.board || intakeData.schoolProfile?.board || 'CBSE';
    const preset = getCurriculumPresetForBoard(schoolBoard);

    // Resolve subjects catalog: use custom subjects if populated, otherwise use board preset
    const subjectsPool =
      Array.isArray(curr.subjects) && curr.subjects.length > 0 ? curr.subjects : preset.subjects;

    // Resolve class curricula: populate default subjects for active classes if not yet configured
    const existingClassCurricula = Array.isArray(curr.classCurricula) ? curr.classCurricula : [];
    let resolvedClassCurricula: ClassCurriculumItem[];

    if (existingClassCurricula.length === 0 && activeClasses.length > 0) {
      resolvedClassCurricula = generateDefaultClassCurricula(schoolBoard, activeClasses, subjectsPool);
    } else {
      const defaultMappings = generateDefaultClassCurricula(schoolBoard, activeClasses, subjectsPool);
      resolvedClassCurricula = activeClasses.map((cls) => {
        const found = existingClassCurricula.find((c) => c.className === cls.name);
        if (found) return found;
        const defaultForClass = defaultMappings.find((d) => d.className === cls.name);
        return (
          defaultForClass || {
            className: cls.name,
            classId: cls.id,
            subjects: [],
            learningAreas: [],
            learningObjectives: [],
          }
        );
      });
    }

    const raw: CurriculumData = {
      overview: {
        board: curr.overview?.board || schoolBoard,
        curriculumType: curr.overview?.curriculumType || preset.overview.curriculumType,
        academicApproach: curr.overview?.academicApproach || preset.overview.academicApproach,
        learningPhilosophy: curr.overview?.learningPhilosophy || preset.overview.learningPhilosophy,
        teachingMethodology: curr.overview?.teachingMethodology || preset.overview.teachingMethodology,
        assessmentApproach: curr.overview?.assessmentApproach || preset.overview.assessmentApproach,
      },
      subjects: subjectsPool,
      classCurricula: resolvedClassCurricula,
    };
    return filterCurriculumByCampusScope(raw, campusScope);
  }, [intakeData.curriculum, intakeData.schoolProfile?.board, activeClasses, campusScope]);

  const updateCurriculum = useCallback(
    (updater: (prev: CurriculumData) => CurriculumData) => {
      const updated = updater(curriculum);
      const filtered = filterCurriculumByCampusScope(updated, campusScope);
      updateSectionDirect('curriculum', filtered);
    },
    [curriculum, campusScope, updateSectionDirect]
  );

  // Active view: overview | class_curriculum | subjects
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'class_curriculum' | 'subjects'>('overview');

  // Selected Class in Class-wise Curriculum
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClasses[0]?.id || 'cls_1');

  // Add / Edit Subject Modal state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [subName, setSubName] = useState('');
  const [subCategory, setSubCategory] = useState<SubjectCategoryType>('Language');
  const [subMandatory, setSubMandatory] = useState(true);
  const [subDescription, setSubDescription] = useState('');

  // Batch Apply Modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedTargetClasses, setSelectedTargetClasses] = useState<string[]>([]);

  // Open Subject Modal
  const handleOpenAddSubject = () => {
    setSubjectToEdit(null);
    setSubName('');
    setSubCategory('Language');
    setSubMandatory(true);
    setSubDescription('');
    setSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: SubjectItem) => {
    setSubjectToEdit(sub);
    setSubName(sub.name);
    setSubCategory(sub.category as SubjectCategoryType);
    setSubMandatory(sub.isMandatory);
    setSubDescription(sub.description || '');
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = () => {
    if (!subName.trim()) return;

    updateCurriculum((prev) => {
      const existing = prev.subjects || [];
      let updated: SubjectItem[];

      if (subjectToEdit) {
        updated = existing.map((s) =>
          s.id === subjectToEdit.id
            ? {
                ...s,
                name: subName.trim(),
                category: subCategory,
                isMandatory: subMandatory,
                description: subDescription.trim() || undefined,
              }
            : s
        );
      } else {
        const newSub: SubjectItem = {
          id: `sub-${Date.now()}`,
          name: subName.trim(),
          category: subCategory,
          isMandatory: subMandatory,
          description: subDescription.trim() || undefined,
          applicableClasses: [],
        };
        updated = [...existing, newSub];
      }

      return {
        ...prev,
        subjects: updated,
      };
    });

    setSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    updateCurriculum((prev) => ({
      ...prev,
      subjects: (prev.subjects || []).filter((s) => s.id !== id),
    }));
  };

  // Batch Apply Subjects to Multiple Classes
  const handleBatchApply = () => {
    if (selectedSubjectIds.length === 0 || selectedTargetClasses.length === 0) return;

    updateCurriculum((prev) => {
      const existingClassCurricula = [...(prev.classCurricula || [])];

      for (const clsName of selectedTargetClasses) {
        let entry = existingClassCurricula.find((c) => c.className === clsName);
        if (!entry) {
          entry = {
            className: clsName,
            subjects: [...selectedSubjectIds],
            learningAreas: [],
            learningObjectives: [],
          };
          existingClassCurricula.push(entry);
        } else {
          const merged = Array.from(new Set([...(entry.subjects || []), ...selectedSubjectIds]));
          entry.subjects = merged;
        }
      }

      // Also update subjects' applicableClasses
      const updatedSubjects = (prev.subjects || []).map((sub) => {
        if (selectedSubjectIds.includes(sub.id)) {
          const mergedClasses = Array.from(
            new Set([...(sub.applicableClasses || []), ...selectedTargetClasses])
          );
          return { ...sub, applicableClasses: mergedClasses };
        }
        return sub;
      });

      return {
        ...prev,
        subjects: updatedSubjects,
        classCurricula: existingClassCurricula,
      };
    });

    setBatchModalOpen(false);
    setSelectedSubjectIds([]);
    setSelectedTargetClasses([]);
  };

  // Apply Board Defaults across Overview, Subjects, and All Classes
  const handleApplyBoardDefaults = (boardName?: string) => {
    const targetBoard = boardName || curriculum.overview?.board || intakeData.schoolProfile?.board || 'CBSE';
    const preset = getCurriculumPresetForBoard(targetBoard);
    const newClassCurricula = generateDefaultClassCurricula(targetBoard, activeClasses, preset.subjects);

    if (updateSectionField) {
      updateSectionField('schoolProfile', 'board', preset.overview.board);
    }

    const updatedSubjects: SubjectItem[] = preset.subjects.map((sub) => {
      const applicableClasses = newClassCurricula
        .filter((cc) => cc.subjects?.includes(sub.id))
        .map((cc) => cc.className);
      return {
        ...sub,
        applicableClasses,
      };
    });

    updateCurriculum(() => ({
      overview: {
        ...preset.overview,
        board: targetBoard,
      },
      subjects: updatedSubjects,
      classCurricula: newClassCurricula,
    }));
  };

  // Reset single class to board recommended defaults
  const handleResetClassToBoardDefaults = (targetClass: AcademicClassConfig) => {
    if (!targetClass) return;
    const currentBoard = curriculum.overview?.board || intakeData.schoolProfile?.board || 'CBSE';
    const defaultMappings = generateDefaultClassCurricula(currentBoard, [targetClass], curriculum.subjects);
    const defaultForClass = defaultMappings[0];
    if (!defaultForClass) return;

    updateCurriculum((prev) => {
      const existing = [...(prev.classCurricula || [])];
      const idx = existing.findIndex((c) => c.className === targetClass.name);
      if (idx >= 0) {
        existing[idx] = {
          ...existing[idx],
          subjects: defaultForClass.subjects,
          description: existing[idx].description || defaultForClass.description,
        };
      } else {
        existing.push(defaultForClass);
      }
      return {
        ...prev,
        classCurricula: existing,
      };
    });
  };

  // Active Class Curriculum details
  const activeClassObj = activeClasses.find((c) => c.id === selectedClassId) || activeClasses[0];
  const activeClassCurriculum =
    curriculum.classCurricula?.find((c) => c.className === activeClassObj?.name) || {
      className: activeClassObj?.name || '',
      subjects: [],
      learningAreas: [],
      learningObjectives: [],
    };

  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* ─── CANONICAL CAMPUS ACADEMIC SCOPE SUMMARY ─────────────────── */}
      <CampusAcademicScopeSummary
        scope={campusScope}
        onNavigateToClasses={() => onNavigateToSection?.('campuses')}
      />

      {/* ─── BANNER ────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl sm:rounded-3xl p-5 md:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider">
              Academic Framework &amp; Pedagogy
            </span>
            <span className="text-slate-400 text-xs">• {activeClasses.length} Active Classes</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Curriculum &amp; Subject Architecture
          </h3>
          <p className="text-xs text-indigo-100/80 leading-relaxed">
            Configure educational philosophy, teaching methods, and map standardized subject catalogs across all academic grades without repetitive data entry.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleApplyBoardDefaults()}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5"
            title="Auto-fill recommended curriculum overview and age-appropriate subjects for all classes"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Apply {curriculum.overview?.board || 'Board'} Defaults</span>
          </button>
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Subjects to Multiple Classes</span>
          </button>
        </div>
      </div>

      {/* ─── SUB-NAV TABS ──────────────────────────────────────────────── */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
        {[
          { id: 'overview', label: '1. Curriculum Overview', icon: BookOpen },
          { id: 'class_curriculum', label: '2. Class-wise Curriculum', icon: Layers },
          { id: 'subjects', label: '3. Subjects Catalog', icon: GraduationCap },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center space-x-2 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs ring-1 ring-indigo-500'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── SUB-TAB 1: CURRICULUM OVERVIEW (Rule 34) ───────────────────── */}
      {activeSubTab === 'overview' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-base font-bold text-slate-900">Curriculum Overview &amp; Pedagogy</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured institutional learning framework, pedagogical philosophy, and assessment methodology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800">Affiliation Board / Governing Body *</label>
                <button
                  type="button"
                  onClick={() => handleApplyBoardDefaults()}
                  className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                  title="Auto-fill recommended pedagogy, subjects, and class mapping for this board"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>Apply Board Defaults</span>
                </button>
              </div>
              <select
                value={
                  Object.keys(BOARD_CURRICULUM_PRESETS).includes(curriculum.overview?.board || '')
                    ? curriculum.overview?.board
                    : 'Other'
                }
                onChange={(e) => {
                  const selectedVal = e.target.value;
                  if (selectedVal === 'Other') {
                    updateCurriculum((prev) => ({
                      ...prev,
                      overview: { ...(prev.overview || {}), board: 'Other' },
                    }));
                  } else {
                    handleApplyBoardDefaults(selectedVal);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                <option value="CISCE / ICSE">CISCE / ICSE</option>
                <option value="State Board">State Board (BSEB / Other)</option>
                <option value="IB">IB (International Baccalaureate)</option>
                <option value="Cambridge">Cambridge (IGCSE / CAIE)</option>
                <option value="NIOS">NIOS (National Institute of Open Schooling)</option>
                <option value="Other">Other / Custom Affiliation</option>
              </select>
              {curriculum.overview?.board === 'Other' && (
                <input
                  type="text"
                  value={curriculum.overview?.board === 'Other' ? '' : curriculum.overview?.board}
                  onChange={(e) =>
                    updateCurriculum((prev) => ({
                      ...prev,
                      overview: { ...(prev.overview || {}), board: e.target.value },
                    }))
                  }
                  className="w-full mt-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  placeholder="Enter custom board or governing authority name..."
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Curriculum Framework</label>
              <input
                type="text"
                value={curriculum.overview?.curriculumType || ''}
                onChange={(e) =>
                  updateCurriculum((prev) => ({
                    ...prev,
                    overview: { ...(prev.overview || {}), curriculumType: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                placeholder="e.g. National Curriculum Framework (NCF / NEP 2020)"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Academic Approach</label>
              <input
                type="text"
                value={curriculum.overview?.academicApproach || ''}
                onChange={(e) =>
                  updateCurriculum((prev) => ({
                    ...prev,
                    overview: { ...(prev.overview || {}), academicApproach: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                placeholder="e.g. Experiential Learning, Concept-based, Holistic Inquiry, STEM-integrated"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Learning Philosophy</label>
              <textarea
                rows={2}
                value={curriculum.overview?.learningPhilosophy || ''}
                onChange={(e) =>
                  updateCurriculum((prev) => ({
                    ...prev,
                    overview: { ...(prev.overview || {}), learningPhilosophy: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                placeholder="Core institutional learning philosophy and character formation aims..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Teaching Methodology</label>
              <textarea
                rows={2}
                value={curriculum.overview?.teachingMethodology || ''}
                onChange={(e) =>
                  updateCurriculum((prev) => ({
                    ...prev,
                    overview: { ...(prev.overview || {}), teachingMethodology: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                placeholder="Smart board instruction, lab practicals, group collaborations, individualized support..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-800 mb-1">Assessment Approach</label>
              <input
                type="text"
                value={curriculum.overview?.assessmentApproach || ''}
                onChange={(e) =>
                  updateCurriculum((prev) => ({
                    ...prev,
                    overview: { ...(prev.overview || {}), assessmentApproach: e.target.value },
                  }))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                placeholder="e.g. Continuous and Comprehensive Evaluation (CCE) with term-end examinations"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 2: CLASS-WISE CURRICULUM (Rule 35) ────────────────── */}
      {activeSubTab === 'class_curriculum' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-base font-bold text-slate-900">Class-wise Curriculum Mapping</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a class from your Academic Structure to review assigned subjects, key learning areas, and learning objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Classes Selector */}
            <div className="md:col-span-4 space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1">
                Academic Classes ({activeClasses.length})
              </span>
              {activeClasses.map((cls) => {
                const isSelected = cls.id === activeClassObj?.id;
                const assignedCount =
                  curriculum.classCurricula?.find((c) => c.className === cls.name)?.subjects?.length || 0;

                return (
                  <button
                    key={cls.id || cls.name}
                    type="button"
                    onClick={() => setSelectedClassId(cls.id || cls.name)}
                    className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{cls.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{cls.level || 'Academic'}</div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 rounded-md text-slate-600">
                      {assignedCount} subjects
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Class Curriculum Details */}
            <div className="md:col-span-8 p-5 bg-slate-50/60 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 flex-wrap gap-2">
                <div>
                  <h5 className="font-bold text-base text-slate-900">{activeClassObj?.name} Curriculum</h5>
                  <span className="text-[11px] text-slate-500">Level: {activeClassObj?.level || 'Academic Level'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleResetClassToBoardDefaults(activeClassObj)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition cursor-pointer flex items-center space-x-1"
                    title={`Reset subjects in ${activeClassObj?.name} to board recommended defaults`}
                  >
                    <RotateCcw className="w-3 h-3 text-indigo-600" />
                    <span>Board Defaults</span>
                  </button>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                    {activeClassCurriculum.subjects?.length || 0} Subjects Assigned
                  </span>
                </div>
              </div>

              {/* Subjects in this class */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 text-xs">Subjects Taught in {activeClassObj?.name}</label>
                <div className="flex flex-wrap gap-2">
                  {(curriculum.subjects || []).map((sub) => {
                    const isTaught = activeClassCurriculum.subjects?.includes(sub.id) || false;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          updateCurriculum((prev) => {
                            const list = [...(prev.classCurricula || [])];
                            let entry = list.find((c) => c.className === activeClassObj?.name);
                            if (!entry) {
                              entry = {
                                className: activeClassObj?.name || '',
                                subjects: [sub.id],
                                learningAreas: [],
                                learningObjectives: [],
                              };
                              list.push(entry);
                            } else {
                              const currentSubs = entry.subjects || [];
                              entry.subjects = currentSubs.includes(sub.id)
                                ? currentSubs.filter((id) => id !== sub.id)
                                : [...currentSubs, sub.id];
                            }
                            return { ...prev, classCurricula: list };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                          isTaught
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isTaught && <Check className="w-3.5 h-3.5" />}
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Learning Objectives for this class */}
              <div className="space-y-1.5 pt-2">
                <label className="block font-bold text-slate-800 text-xs">
                  Key Learning Objectives &amp; Areas ({activeClassObj?.name})
                </label>
                <textarea
                  rows={3}
                  value={activeClassCurriculum.description || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCurriculum((prev) => {
                      const list = [...(prev.classCurricula || [])];
                      let entry = list.find((c) => c.className === activeClassObj?.name);
                      if (!entry) {
                        entry = {
                          className: activeClassObj?.name || '',
                          subjects: [],
                          learningAreas: [],
                          learningObjectives: [],
                          description: val,
                        };
                        list.push(entry);
                      } else {
                        entry.description = val;
                      }
                      return { ...prev, classCurricula: list };
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white leading-relaxed"
                  placeholder="e.g. Foundational literacy and numeracy, composite laboratory exploration, foundational phonics..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── SUB-TAB 3: SUBJECT MANAGEMENT (Rule 36) ───────────────────── */}
      {activeSubTab === 'subjects' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 md:p-6 space-y-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">Reusable Subject Catalog</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Define subjects once and apply them across multiple grades without repetitive entry.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddSubject}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Subject</span>
            </button>
          </div>

          {/* Subjects Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Applicable Classes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(curriculum.subjects || []).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{sub.name}</div>
                      {sub.description && <div className="text-[10px] text-slate-400 font-normal">{sub.description}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium">
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {sub.isMandatory ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Optional / Elective
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {sub.applicableClasses && sub.applicableClasses.length > 0 ? (
                        <span>{sub.applicableClasses.length} Classes</span>
                      ) : (
                        <span className="text-slate-400 italic">Universal Catalog</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubject(sub)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADD/EDIT SUBJECT MODAL (Viewport Centered) ─────────────────── */}
      <ModalPortal isOpen={subjectModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h4 className="font-bold text-sm text-slate-900">{subjectToEdit ? 'Edit Subject' : 'Add Subject'}</h4>
              <button
                type="button"
                onClick={() => setSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Subject Name *</label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Mathematics, Sanskrit, Robotics"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Subject Category *</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value as SubjectCategoryType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {SUBJECT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="subMandatory"
                  checked={subMandatory}
                  onChange={(e) => setSubMandatory(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <label htmlFor="subMandatory" className="font-semibold text-slate-800 text-xs">
                  Mandatory Subject for Students
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Description / Syllabus Scope (Optional)</label>
                <input
                  type="text"
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  placeholder="e.g. Foundational grammar, reading comprehension and creative writing"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSubjectModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubject}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {subjectToEdit ? 'Save Changes' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>

      {/* ─── BATCH APPLY SUBJECTS MODAL (Viewport Centered) ────────────── */}
      <ModalPortal isOpen={batchModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">Apply Subjects to Multiple Classes</h4>
                  <p className="text-xs text-slate-500">Batch assign common subjects across selected grades</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto">
              {/* Step 1: Select Subjects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">1. Select Subjects to Apply:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSubjectIds.length === (curriculum.subjects || []).length) {
                        setSelectedSubjectIds([]);
                      } else {
                        setSelectedSubjectIds((curriculum.subjects || []).map((s) => s.id));
                      }
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    {selectedSubjectIds.length === (curriculum.subjects || []).length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {(curriculum.subjects || []).map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setSelectedSubjectIds((prev) =>
                            prev.includes(sub.id) ? prev.filter((id) => id !== sub.id) : [...prev, sub.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{sub.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Select Target Classes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">2. Select Target Academic Classes:</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedTargetClasses.length === activeClasses.length) {
                        setSelectedTargetClasses([]);
                      } else {
                        setSelectedTargetClasses(activeClasses.map((c) => c.name));
                      }
                    }}
                    className="text-xs text-indigo-600 font-semibold hover:underline"
                  >
                    {selectedTargetClasses.length === activeClasses.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {activeClasses.map((cls) => {
                    const isSelected = selectedTargetClasses.includes(cls.name);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setSelectedTargetClasses((prev) =>
                            prev.includes(cls.name) ? prev.filter((name) => name !== cls.name) : [...prev, cls.name]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{cls.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-slate-500 text-xs">
                Applying {selectedSubjectIds.length} subjects to {selectedTargetClasses.length} classes
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedSubjectIds.length === 0 || selectedTargetClasses.length === 0}
                  onClick={handleBatchApply}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Apply Subjects Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}
