'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  Sparkles,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter,
} from 'lucide-react';
import type { AcademicStructureData, AcademicSubjectConfig } from '@/lib/types';
import {
  DEFAULT_SUGGESTED_SUBJECTS,
  generateAcademicId,
} from '@/lib/academicStructureUtils';
import ModalPortal from '@/components/ui/ModalPortal';

interface Step4SubjectCatalogProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step4SubjectCatalog({
  structure,
  onChange,
  onNext,
  onPrev,
}: Step4SubjectCatalogProps) {
  const subjects = structure.subjects || [];

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Form Fields
  const [nameInput, setNameInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [typeInput, setTypeInput] = useState<'theory' | 'practical' | 'combined' | 'activity'>('theory');
  const [categoryInput, setCategoryInput] = useState<'core' | 'elective' | 'optional' | 'additional' | 'activity'>('core');
  const [descInput, setDescInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation
  const [subToDelete, setSubToDelete] = useState<AcademicSubjectConfig | null>(null);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategoryFilter === 'all' ||
        (s.category && s.category === selectedCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [subjects, searchQuery, selectedCategoryFilter]);

  const handleOpenAdd = () => {
    setEditingSubId(null);
    setNameInput('');
    setCodeInput('');
    setTypeInput('theory');
    setCategoryInput('core');
    setDescInput('');
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (sub: AcademicSubjectConfig) => {
    setEditingSubId(sub.id || null);
    setNameInput(sub.name);
    setCodeInput(sub.code || '');
    setTypeInput(sub.subjectType || 'theory');
    setCategoryInput(sub.category || 'core');
    setDescInput(sub.description || '');
    setFormError(null);
    setIsEditorOpen(true);
  };

  const handleSaveSubject = () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setFormError('Subject name cannot be empty.');
      return;
    }

    const isDuplicate = subjects.some(
      (s) =>
        s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== editingSubId
    );
    if (isDuplicate) {
      setFormError(`A subject named "${trimmedName}" is already defined in the catalog.`);
      return;
    }

    let updated: AcademicSubjectConfig[];

    if (editingSubId) {
      updated = subjects.map((s) => {
        if (s.id === editingSubId) {
          return {
            ...s,
            name: trimmedName,
            code: codeInput.trim().toUpperCase() || undefined,
            subjectType: typeInput,
            category: categoryInput,
            isElective: categoryInput === 'elective',
            description: descInput.trim() || undefined,
          };
        }
        return s;
      });
    } else {
      const newSub: AcademicSubjectConfig = {
        id: generateAcademicId('sub'),
        name: trimmedName,
        code: codeInput.trim().toUpperCase() || undefined,
        subjectType: typeInput,
        category: categoryInput,
        isElective: categoryInput === 'elective',
        status: 'active',
        description: descInput.trim() || undefined,
      };
      updated = [...subjects, newSub];
    }

    onChange({
      ...structure,
      subjects: updated,
    });
    setIsEditorOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!subToDelete) return;
    const filtered = subjects.filter((s) => s.id !== subToDelete.id);

    // Clean up any applicability and subject teacher assignments referencing this subject
    const cleanedApplicability = (structure.subjectApplicability || []).filter(
      (a) => a.subjectId !== subToDelete.id
    );
    const cleanedTeacherAssignments = (structure.subjectTeacherAssignments || []).filter(
      (a) => a.subjectId !== subToDelete.id
    );

    onChange({
      ...structure,
      subjects: filtered,
      subjectApplicability: cleanedApplicability,
      subjectTeacherAssignments: cleanedTeacherAssignments,
    });
    setSubToDelete(null);
  };

  const handleLoadSuggested = () => {
    const seenNames = new Set(subjects.map((s) => s.name.toLowerCase()));
    const toAdd: AcademicSubjectConfig[] = [];

    for (const sugg of DEFAULT_SUGGESTED_SUBJECTS) {
      if (!seenNames.has(sugg.name.toLowerCase())) {
        toAdd.push({
          ...sugg,
          id: generateAcademicId('sub'),
        });
      }
    }

    onChange({
      ...structure,
      subjects: [...subjects, ...toAdd],
    });
  };

  return (
    <div className="space-y-5 text-xs text-[#131B2E]">
      {/* Concept Explainer Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 font-bold">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#131B2E]">What is the Curriculum Catalog?</h4>
          <p className="text-[#64748B] leading-relaxed">
            A <strong>Subject</strong> represents a course of study (such as Mathematics, English, Physics, or
            History). Subjects are <strong>reusable</strong> — you define "Mathematics" once here, and in
            the next step you choose which grades and streams learn it. You do not need to create duplicate
            subjects for each class.
          </p>
        </div>
      </div>

      {/* Main Subjects Card */}
      <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-[#131B2E]">
                Reusable Subject Catalog ({subjects.length})
              </h3>
              {subjects.length > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> Catalog Active
                </span>
              )}
            </div>
            <p className="text-[#64748B] text-[11px]">
              Master repository of curriculum disciplines taught across your institution.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Subject</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSuggested}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] font-semibold text-xs transition cursor-pointer"
              title="Add standard CBSE/ICSE curriculum subjects"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Load Common Subjects</span>
            </button>
          </div>
        </div>

        {/* Filter / Search Bar */}
        {subjects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject or code..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] focus:border-[#4338CA] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase mr-1">
                Category:
              </span>
              {['all', 'core', 'elective', 'optional', 'activity'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-[#4338CA] text-white shadow-2xs'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#131B2E]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Subject Cards Grid */}
        {subjects.length === 0 ? (
          <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] mx-auto shadow-2xs">
              <BookOpen className="w-6 h-6 text-[#4338CA]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#131B2E]">No subjects in catalog yet</h4>
              <p className="text-[#64748B] text-[11px] max-w-md mx-auto">
                Define the subjects taught in your school. You can load our standard set of common
                subjects or create your own custom curriculum disciplines.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                + Add Custom Subject
              </button>
              <button
                type="button"
                onClick={handleLoadSuggested}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#131B2E] font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                Load Common Subjects
              </button>
            </div>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#94A3B8]">
            No subjects found matching "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubjects.map((sub) => {
              const typeColor =
                sub.subjectType === 'practical'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : sub.subjectType === 'combined'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : sub.subjectType === 'activity'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';

              const categoryBadge =
                sub.category === 'elective'
                  ? 'bg-indigo-50 text-[#4338CA] border-indigo-200'
                  : sub.category === 'optional'
                  ? 'bg-slate-50 text-[#64748B] border-slate-200'
                  : sub.category === 'activity'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-[#EEF2FF] text-[#3730A3] border-[#C7D2FE]';

              return (
                <div
                  key={sub.id}
                  className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] p-3.5 rounded-xl shadow-2xs transition flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#131B2E] truncate">
                          {sub.name}
                        </span>
                        {sub.code && (
                          <span className="text-[10px] font-mono text-[#94A3B8]">
                            [{sub.code}]
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-md border ${categoryBadge}`}
                        >
                          {sub.category || 'core'}
                        </span>
                        <span
                          className={`text-[9px] font-semibold capitalize px-1.5 py-0.2 rounded-md border ${typeColor}`}
                        >
                          {sub.subjectType || 'theory'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 text-[#64748B] hover:text-[#131B2E] rounded hover:bg-[#F1F5F9] cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubToDelete(sub)}
                        className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {sub.description && (
                    <p className="text-[10px] text-[#64748B] line-clamp-1 italic">
                      {sub.description}
                    </p>
                  )}
                </div>
              );
            })}
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
          <span>Back: Sections & Streams</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Subject Applicability</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── MODAL: ADD / EDIT SUBJECT ──────────────────────────────────── */}
      {isEditorOpen && (
        <ModalPortal isOpen={isEditorOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#131B2E]">
                    {editingSubId ? 'Edit Subject' : 'Add Subject to Catalog'}
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Define reusable curriculum discipline.</p>
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
                  Subject Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="e.g. Mathematics, English, Physics, Accountancy"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#334155] mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="e.g. MATH, 041"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition shadow-2xs font-medium uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#334155] mb-1">Subject Type</label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                  >
                    <option value="theory">Theory</option>
                    <option value="practical">Practical</option>
                    <option value="combined">Combined (Theory + Lab)</option>
                    <option value="activity">Co-curricular / Activity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Curriculum Category</label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden text-[#131B2E] transition shadow-2xs font-medium"
                >
                  <option value="core">Core (Mandatory for all enrolled)</option>
                  <option value="elective">Elective (Chosen from alternatives)</option>
                  <option value="optional">Optional (Skill or supplementary)</option>
                  <option value="additional">Additional (Sixth/Extra subject)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#334155] mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="e.g. Core STEM foundation curriculum"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition shadow-2xs font-medium"
                />
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
                onClick={handleSaveSubject}
                className="px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Save Subject
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* ── DIALOG: DELETE CONFIRMATION ──────────────────────────────────── */}
      {subToDelete && (
        <ModalPortal isOpen={!!subToDelete}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-[#131B2E]">Delete "{subToDelete.name}"?</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Removing this subject will also remove it from any classes, streams, and teacher
                assignments where it was assigned. Are you sure?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSubToDelete(null)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] font-semibold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Yes, Delete Subject
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
