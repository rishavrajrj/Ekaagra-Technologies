'use client';

import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
} from 'lucide-react';
import type { AcademicStructureData, AcademicClassConfig, CampusBranchData } from '@/lib/types';
import {
  DEFAULT_ACADEMIC_LEVELS,
  DEFAULT_SUGGESTED_CLASSES,
  generateAcademicId,
  getSchoolTypeConfig,
  getSuggestedClassesForSchoolType,
  reconcileClassesForAcademicLevels,
  DEFAULT_LEVEL_CLASS_PRESETS,
} from '@/lib/academicStructureUtils';
import { getCampusDisplayName } from '@/lib/campusScopeRegistry';

interface Step2GradesClassesProps {
  structure: AcademicStructureData;
  schoolType?: string;
  campuses?: CampusBranchData[];
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2GradesClasses({
  structure,
  schoolType,
  campuses = [],
  onChange,
  onNext,
  onPrev,
}: Step2GradesClassesProps) {
  const schoolTypeConfig = getSchoolTypeConfig(schoolType);
  const classes = structure.classes || [];

  const isMultiCampus = campuses.length > 1;
  const [selectedCampusFilter, setSelectedCampusFilter] = useState<string>('all');

  const filteredClasses = useMemo(() => {
    if (!isMultiCampus || selectedCampusFilter === 'all') {
      return classes;
    }
    return classes.filter((c) => (c.campusId || '') === selectedCampusFilter);
  }, [classes, isMultiCampus, selectedCampusFilter]);

  const targetCampus = useMemo(() => {
    if (selectedCampusFilter === 'all') return undefined;
    return campuses.find((c) => c.id === selectedCampusFilter);
  }, [campuses, selectedCampusFilter]);

  const campusClassNames = useMemo(() => {
    if (selectedCampusFilter === 'all') return [];
    return classes
      .filter((c) => (c.campusId || '') === selectedCampusFilter)
      .map((c) => c.name);
  }, [classes, selectedCampusFilter]);

  const activeLevelsForCampus = useMemo(() => {
    if (selectedCampusFilter === 'all') return [];
    const levels = new Set<string>();
    classes
      .filter((c) => (c.campusId || '') === selectedCampusFilter)
      .forEach((c) => {
        if (c.level) levels.add(c.level);
      });
    (targetCampus?.academicLevels || []).forEach((lvl) => levels.add(lvl));
    return Array.from(levels);
  }, [classes, selectedCampusFilter, targetCampus]);

  const handleToggleLevelForCampus = (level: string) => {
    if (!selectedCampusFilter || selectedCampusFilter === 'all') return;
    const isSelected = activeLevelsForCampus.some(
      (l) => l.toLowerCase() === level.toLowerCase()
    );
    const nextLevels = isSelected
      ? activeLevelsForCampus.filter((l) => l.toLowerCase() !== level.toLowerCase())
      : [...activeLevelsForCampus, level];

    const { classes: nextClassNames } = reconcileClassesForAcademicLevels(
      nextLevels,
      campusClassNames
    );

    // Keep all other campuses' classes completely intact
    const otherCampusClasses = classes.filter(
      (c) => (c.campusId || '') !== selectedCampusFilter
    );

    const existingMap = new Map<string, AcademicClassConfig>();
    classes
      .filter((c) => (c.campusId || '') === selectedCampusFilter)
      .forEach((c) => existingMap.set(c.name.toLowerCase(), c));

    const LEVEL_MAP: Record<string, string> = {
      Playgroup: 'Pre-Primary',
      Nursery: 'Pre-Primary',
      LKG: 'Pre-Primary',
      UKG: 'Pre-Primary',
      'Class 1': 'Primary',
      'Class 2': 'Primary',
      'Class 3': 'Primary',
      'Class 4': 'Primary',
      'Class 5': 'Primary',
      'Class 6': 'Middle',
      'Class 7': 'Middle',
      'Class 8': 'Middle',
      'Class 9': 'Secondary',
      'Class 10': 'Secondary',
      'Class 11': 'Senior Secondary',
      'Class 12': 'Senior Secondary',
    };

    const newCampusClasses: AcademicClassConfig[] = nextClassNames.map((name, idx) => {
      const existing = existingMap.get(name.toLowerCase());
      if (existing) {
        return {
          ...existing,
          sortOrder: idx + 1,
          displayOrder: idx + 1,
          campusId: selectedCampusFilter,
        };
      }
      return {
        id: generateAcademicId('cls'),
        name,
        className: name,
        level: LEVEL_MAP[name] || 'Primary',
        code: `STD-${idx + 1}`,
        sortOrder: idx + 1,
        displayOrder: idx + 1,
        isActive: true,
        sections: ['A'],
        campusId: selectedCampusFilter,
      };
    });

    const combined = [...otherCampusClasses, ...newCampusClasses];
    combined.sort(
      (a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0)
    );

    onChange({
      ...structure,
      classes: combined,
    });
  };

  // Editor Drawer / Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Form Fields
  const [classNameInput, setClassNameInput] = useState('');
  const [classLevelInput, setClassLevelInput] = useState('Primary');
  const [classCodeInput, setClassCodeInput] = useState('');
  const [classOrderInput, setClassOrderInput] = useState<number>(1);
  const [classCampusIdInput, setClassCampusIdInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion Confirmation Dialog
  const [classToDelete, setClassToDelete] = useState<AcademicClassConfig | null>(null);

  // Template Confirmation Dialog
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleOpenAdd = () => {
    setEditingClassId(null);
    const convention = structure.namingConvention || 'Class';
    const nextNum = classes.length + 1;
    const defaultPrefix =
      convention === 'Grade' ? 'Grade' : convention === 'Standard' ? 'Standard' : 'Class';
    setClassNameInput(`${defaultPrefix} ${nextNum}`);
    setClassLevelInput('Primary');
    setClassCodeInput(`STD-${nextNum}`);
    setClassOrderInput(nextNum);
    setClassCampusIdInput(
      selectedCampusFilter !== 'all' ? selectedCampusFilter : (campuses?.[0]?.id || '')
    );
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (cls: AcademicClassConfig) => {
    setEditingClassId(cls.id || null);
    setClassNameInput(cls.name);
    setClassLevelInput(cls.level || 'Primary');
    setClassCodeInput(cls.code || '');
    setClassOrderInput(cls.displayOrder ?? cls.sortOrder ?? 1);
    setClassCampusIdInput(cls.campusId || '');
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleSaveClass = () => {
    const trimmedName = classNameInput.trim();
    if (!trimmedName) {
      setFormError('Class / Grade name cannot be empty.');
      return;
    }

    // Duplicate name check (scoped to campus)
    const isDuplicate = classes.some(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingClassId &&
        (!c.campusId || !classCampusIdInput || c.campusId === classCampusIdInput)
    );
    if (isDuplicate) {
      setFormError(`A class named "${trimmedName}" already exists for this campus.`);
      return;
    }

    let updated: AcademicClassConfig[];

    if (editingClassId) {
      updated = classes.map((c) => {
        if (c.id === editingClassId) {
          return {
            ...c,
            name: trimmedName,
            className: trimmedName,
            level: classLevelInput,
            code: classCodeInput.trim() || undefined,
            sortOrder: classOrderInput,
            displayOrder: classOrderInput,
            campusId: classCampusIdInput || undefined,
          };
        }
        return c;
      });
    } else {
      const newCls: AcademicClassConfig = {
        id: generateAcademicId('cls'),
        name: trimmedName,
        className: trimmedName,
        level: classLevelInput,
        code: classCodeInput.trim() || undefined,
        sortOrder: classOrderInput,
        displayOrder: classOrderInput,
        isActive: true,
        sections: ['A'], // Default to 1 section
        campusId: classCampusIdInput || undefined,
      };
      updated = [...classes, newCls];
    }

    // Sort by order
    updated.sort((a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0));

    onChange({
      ...structure,
      classes: updated,
    });
    setIsEditorOpen(false);
  };

  const handleMove = (filteredIdx: number, direction: 'up' | 'down') => {
    const targetFilteredIdx = direction === 'up' ? filteredIdx - 1 : filteredIdx + 1;
    if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredClasses.length) return;

    const sourceCls = filteredClasses[filteredIdx];
    const targetCls = filteredClasses[targetFilteredIdx];
    if (!sourceCls || !targetCls) return;

    const sourceOrder = sourceCls.displayOrder ?? sourceCls.sortOrder ?? 1;
    const targetOrder = targetCls.displayOrder ?? targetCls.sortOrder ?? 1;

    const updated = classes.map((c) => {
      if (c.id === sourceCls.id) {
        return { ...c, sortOrder: targetOrder, displayOrder: targetOrder };
      }
      if (c.id === targetCls.id) {
        return { ...c, sortOrder: sourceOrder, displayOrder: sourceOrder };
      }
      return c;
    });

    updated.sort(
      (a, b) => (a.displayOrder ?? a.sortOrder ?? 0) - (b.displayOrder ?? b.sortOrder ?? 0)
    );
    const reordered = updated.map((c, idx) => ({
      ...c,
      sortOrder: idx + 1,
      displayOrder: idx + 1,
    }));

    onChange({
      ...structure,
      classes: reordered,
    });
  };

  const handleConfirmDelete = () => {
    if (!classToDelete) return;
    const filtered = classes.filter((c) => c.id !== classToDelete.id);
    const reordered = filtered.map((c, idx) => ({
      ...c,
      sortOrder: idx + 1,
      displayOrder: idx + 1,
    }));

    // Also clean up any subject applicability referencing this deleted class
    const cleanedApplicability = (structure.subjectApplicability || []).filter(
      (a) => a.classId !== classToDelete.id
    );

    onChange({
      ...structure,
      classes: reordered,
      subjectApplicability: cleanedApplicability,
    });
    setClassToDelete(null);
  };

  const handleApplyTemplate = () => {
    const fresh = getSuggestedClassesForSchoolType(schoolType);

    onChange({
      ...structure,
      classes: fresh,
      structureStatus: 'suggested',
    });
    setShowTemplateConfirm(false);
  };

  const handleClearAll = () => {
    onChange({
      ...structure,
      classes: [],
      subjectApplicability: [],
      subjectTeacherAssignments: [],
      classTeacherAssignments: [],
      structureStatus: 'unconfigured',
    });
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-5 text-xs text-[#131B2E]">
      {/* Concept Explainer Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 font-bold">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#131B2E]">What is a Grade / Class?</h4>
          <p className="text-[#64748B] leading-relaxed">
            A Grade or Class represents an academic level offered by your institution (such as Nursery,
            Class 1, Class 10, or Class 12). Sections, streams, curriculum subjects, and teachers will be
            configured in subsequent steps after defining your grade roster.
          </p>
        </div>
      </div>

      {/* Campus Filter Bar (Multi-Campus Institutions) */}
      {isMultiCampus && (
        <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#4338CA]" />
            <span className="text-xs font-bold text-[#131B2E]">Filter Roster by Campus:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCampusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition cursor-pointer shadow-2xs ${
                selectedCampusFilter === 'all'
                  ? 'bg-[#4338CA] text-white border-[#4338CA]'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50'
              }`}
            >
              All Campuses ({classes.length})
            </button>
            {campuses.map((camp, cIdx) => {
              const campCount = classes.filter((c) => c.campusId === camp.id).length;
              const isSel = selectedCampusFilter === camp.id;
              return (
                <button
                  key={camp.id || cIdx}
                  type="button"
                  onClick={() => setSelectedCampusFilter(camp.id)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition cursor-pointer shadow-2xs ${
                    isSel
                      ? 'bg-[#4338CA] text-white border-[#4338CA]'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  {getCampusDisplayName(camp, cIdx + 1)} ({campCount})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Campus Academic Level Quick-Toggle Strip (when a specific campus is filtered) */}
      {isMultiCampus && selectedCampusFilter !== 'all' && (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#131B2E] block">
                Academic Levels Offered at {getCampusDisplayName(targetCampus)}
              </span>
              <p className="text-[11px] text-[#64748B]">
                Click to add or remove standard class groups for this campus. Selections are strictly isolated.
              </p>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto shadow-2xs">
              Campus-Scoped Reconciler
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {(['Pre-Primary', 'Primary', 'Middle', 'Secondary', 'Senior Secondary'] as const).map((level) => {
              const isSelected = activeLevelsForCampus.some((l) => l.toLowerCase() === level.toLowerCase());
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleToggleLevelForCampus(level)}
                  className={`px-3 py-1.5 rounded-xl font-semibold text-xs border transition cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#4338CA] text-white border-[#4338CA]'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-slate-50'
                  }`}
                >
                  {isSelected ? '✓ ' : '+ '}{level}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Roster Card */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#131B2E]">
                Grades & Classes Roster ({classes.length})
                {selectedCampusFilter !== 'all' && (
                  <span className="text-xs font-normal text-[#64748B]">
                    {' '}— {getCampusDisplayName(targetCampus)} ({filteredClasses.length})
                  </span>
                )}
              </h3>
              {filteredClasses.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              )}
            </div>
            <p className="text-[#64748B] text-[11px]">
              Add each academic level in the sequential order students progress through your school.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Grade / Class</span>
            </button>

            {classes.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowTemplateConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] font-semibold text-xs transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>Load Suggested Defaults</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowTemplateConfirm(true)}
                  className="px-2.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-medium text-[11px] transition cursor-pointer"
                  title="Reset to standard Nursery-12 starting structure"
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-2.5 py-2 rounded-xl bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200 font-medium text-[11px] transition cursor-pointer"
                  title="Clear all classes"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Classes List */}
        {classes.length === 0 ? (
          <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto shadow-2xs">
              <GraduationCap className="w-6 h-6 text-[#4338CA]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#131B2E]">No grades or classes added yet</h4>
              <p className="text-[#64748B] text-[11px] max-w-md mx-auto">
                Start by adding the individual academic grades your school offers, or load our suggested
                pre-configured roster to customize.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                + Add First Grade / Class
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#131B2E] font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                Load Suggested Structure
              </button>
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto shadow-2xs">
              <Building2 className="w-5 h-5 text-[#4338CA]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#131B2E]">
                No classes assigned to {getCampusDisplayName(targetCampus)}
              </h4>
              <p className="text-[#64748B] text-[11px] max-w-md mx-auto">
                Use the academic level buttons above to configure class groups for this campus, or add a specific grade manually.
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Grade to {getCampusDisplayName(targetCampus)}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClasses.map((cls, idx) => (
              <div
                key={cls.id || idx}
                className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] p-3 sm:p-3.5 rounded-xl shadow-2xs transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] text-[#64748B] font-bold text-xs flex items-center justify-center shrink-0">
                    {cls.displayOrder ?? idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#131B2E]">{cls.name}</span>
                      {cls.level && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-md border border-[#E2E8F0]">
                          {cls.level}
                        </span>
                      )}
                      {cls.code && (
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          [{cls.code}]
                        </span>
                      )}
                      {isMultiCampus && (
                        cls.campusId ? (() => {
                          const matchedCamp = campuses.find((c) => c.id === cls.campusId);
                          return (
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>{getCampusDisplayName(matchedCamp)}</span>
                            </span>
                          );
                        })() : (
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                            All Campuses
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === filteredClasses.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#131B2E] hover:bg-[#F1F5F9] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cls)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#131B2E] border border-[#E2E8F0] font-semibold text-[11px] transition cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3 text-[#4338CA]" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setClassToDelete(cls)}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    title="Remove Grade"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Academic Year</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={classes.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Sections & Streams</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── MODAL: ADD / EDIT GRADE ONLY ───────────────────────────────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">
                    {editingClassId ? 'Edit Academic Grade / Class' : 'Add Academic Grade / Class'}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Define the academic level offered.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#131B2E] hover:bg-[#F1F5F9] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#334155] mb-1">
                  Class / Grade Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={classNameInput}
                  onChange={(e) => {
                    setClassNameInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Nursery, Class 5, Class 10, Class 12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Academic Wing / Level</label>
                  <select
                    value={classLevelInput}
                    onChange={(e) => setClassLevelInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                  >
                    {DEFAULT_ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={classOrderInput}
                    onChange={(e) => setClassOrderInput(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Grade Code (Optional)</label>
                <input
                  type="text"
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value)}
                  placeholder="e.g. STD-10 or NUR"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                />
              </div>

              {campuses && campuses.length > 1 && (
                <div>
                  <label className="block font-bold text-[#334155] mb-1">
                    Assigned Campus (Optional)
                  </label>
                  <select
                    value={classCampusIdInput}
                    onChange={(e) => setClassCampusIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                  >
                    <option value="">All Campuses / Institution-Wide</option>
                    {campuses.map((camp, cIdx) => (
                      <option key={camp.id || cIdx} value={camp.id || `campus-${cIdx}`}>
                        {camp.name || (camp.isMainCampus ? 'Main Campus' : `Campus ${cIdx + 1}`)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-[#FAF7F2] rounded-xl text-[11px] text-[#64748B] leading-relaxed">
                Sections, streams, curriculum subjects, and teacher assignments can be configured
                in subsequent steps after saving this grade.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveClass}
                className="px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Save & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIALOG: DELETE CONFIRMATION ──────────────────────────────────── */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-[#131B2E]">Delete "{classToDelete.name}"?</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Removing this grade will remove its sections, streams, and teaching assignments from
                this academic session. Are you sure?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Yes, Delete Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIALOG: LOAD TEMPLATE CONFIRMATION ───────────────────────────── */}
      {showTemplateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center mx-auto">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-[#131B2E]">Load Suggested Classes?</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                This will populate the standard structure for <strong>{schoolTypeConfig.displayLabel}</strong> ({schoolTypeConfig.classRange}). You can customize or remove any grade afterward.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTemplateConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyTemplate}
                className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Load Suggested Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIALOG: CLEAR ALL CONFIRMATION ───────────────────────────────── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-[#131B2E]">Clear All Configured Classes?</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                This will remove all classes and dependent assignments from the roster.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
