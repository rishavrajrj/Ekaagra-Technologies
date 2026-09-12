'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  BookOpen,
  GraduationCap,
  Layers,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Sparkles,
  Check,
  Search,
} from 'lucide-react';
import type {
  AcademicStructureData,
  AcademicClassConfig,
  AcademicSubjectConfig,
  SubjectApplicabilityConfig,
} from '@/lib/types';
import {
  generateAcademicId,
  isSubjectApplicableToGroup,
  deriveTeachingGroups,
} from '@/lib/academicStructureUtils';
import ModalPortal from '@/components/ui/ModalPortal';

interface Step5SubjectApplicabilityProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step5SubjectApplicability({
  structure,
  onChange,
  onNext,
  onPrev,
}: Step5SubjectApplicabilityProps) {
  const classes = structure.classes || [];
  const subjects = structure.subjects || [];
  const applicability = structure.subjectApplicability || [];

  // Selected Class & optional Stream
  const [selectedClassId, setSelectedClassId] = useState<string>(
    classes[0]?.id || ''
  );

  const selectedClass =
    classes.find((c) => c.id === selectedClassId) || classes[0];

  useEffect(() => {
    if (selectedClass && selectedClass.id !== selectedClassId) {
      setSelectedClassId(selectedClass.id || '');
    }
  }, [selectedClass, selectedClassId]);

  const hasStreams =
    Array.isArray(selectedClass?.streams) && selectedClass.streams.length > 0;

  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    hasStreams ? selectedClass.streams![0].id : ''
  );

  // Subject search filter
  const [searchFilter, setSearchFilter] = useState('');

  // Copy modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [sourceClassId, setSourceClassId] = useState<string>('');

  if (classes.length === 0 || subjects.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-[#131B2E]">Prerequisites Missing</h3>
        <p className="text-xs text-[#64748B]">
          {classes.length === 0
            ? 'Please add at least one Grade / Class in Step 2.'
            : 'Please add curriculum subjects to your catalog in Step 4.'}
        </p>
        <button
          type="button"
          onClick={classes.length === 0 ? onPrev : onPrev}
          className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold text-xs cursor-pointer"
        >
          ← Go back
        </button>
      </div>
    );
  }

  // Active target context: stream if active, else class
  const activeStream = hasStreams
    ? selectedClass.streams?.find((s) => s.id === selectedStreamId) ||
      selectedClass.streams![0]
    : undefined;

  // Check if a subject is currently assigned to this target
  const isSubjectAssigned = (subjectId: string): boolean => {
    return applicability.some((item) => {
      if (item.subjectId !== subjectId || item.classId !== selectedClass.id) return false;
      if (hasStreams && activeStream) {
        return item.streamId === activeStream.id;
      }
      return !item.streamId;
    });
  };

  const handleToggleSubject = (subjectId: string) => {
    const currentlyAssigned = isSubjectAssigned(subjectId);
    let updated: SubjectApplicabilityConfig[];

    if (currentlyAssigned) {
      // Remove
      updated = applicability.filter((item) => {
        if (item.subjectId !== subjectId || item.classId !== selectedClass.id) return true;
        if (hasStreams && activeStream) {
          return item.streamId !== activeStream.id;
        }
        return Boolean(item.streamId);
      });
    } else {
      // Add
      const sub = subjects.find((s) => s.id === subjectId);
      const newConfig: SubjectApplicabilityConfig = {
        id: generateAcademicId('sub_app'),
        subjectId,
        classId: selectedClass.id!,
        streamId: hasStreams && activeStream ? activeStream.id : undefined,
        isElective: sub?.isElective,
      };
      updated = [...applicability, newConfig];
    }

    onChange({
      ...structure,
      subjectApplicability: updated,
    });
  };

  const handleSelectAllCore = () => {
    const coreSubs = subjects.filter((s) => s.category === 'core');
    let currentList = [...applicability];

    for (const sub of coreSubs) {
      if (!sub.id) continue;
      const already = isSubjectAssigned(sub.id);
      if (!already) {
        currentList.push({
          id: generateAcademicId('sub_app'),
          subjectId: sub.id,
          classId: selectedClass.id!,
          streamId: hasStreams && activeStream ? activeStream.id : undefined,
          isElective: false,
        });
      }
    }

    onChange({
      ...structure,
      subjectApplicability: currentList,
    });
  };

  const handleClearCurrentTarget = () => {
    const updated = applicability.filter((item) => {
      if (item.classId !== selectedClass.id) return true;
      if (hasStreams && activeStream) {
        return item.streamId !== activeStream.id;
      }
      return Boolean(item.streamId);
    });

    onChange({
      ...structure,
      subjectApplicability: updated,
    });
  };

  const handleCopyFromClass = (srcClsId: string) => {
    const srcItems = applicability.filter((a) => a.classId === srcClsId && !a.streamId);
    if (srcItems.length === 0) {
      alert('The selected source grade has no subjects assigned to copy.');
      return;
    }

    // Remove existing for target
    const remaining = applicability.filter((item) => {
      if (item.classId !== selectedClass.id) return true;
      if (hasStreams && activeStream) {
        return item.streamId !== activeStream.id;
      }
      return Boolean(item.streamId);
    });

    const copied = srcItems.map((item) => ({
      id: generateAcademicId('sub_app'),
      subjectId: item.subjectId,
      classId: selectedClass.id!,
      streamId: hasStreams && activeStream ? activeStream.id : undefined,
      isElective: item.isElective,
    }));

    onChange({
      ...structure,
      subjectApplicability: [...remaining, ...copied],
    });
    setIsCopyModalOpen(false);
  };

  // Count applicable subjects for current view target
  const assignedToTargetCount = subjects.filter((s) => s.id && isSubjectAssigned(s.id)).length;

  const filteredCatalogSubjects = subjects.filter(
    (s) =>
      !searchFilter ||
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="space-y-5 text-xs text-[#131B2E]">
      {/* Concept Explainer Banner */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 font-bold">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#131B2E]">What is Subject Applicability?</h4>
          <p className="text-[#64748B] leading-relaxed">
            Choose which subjects are taught to each Grade or Stream. The exact same subject (e.g.{' '}
            <em>Mathematics</em>) can be assigned to Class 9, Class 10, and Class 11 Science without creating
            multiple duplicate subject definitions.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-visible space-y-4">
        {/* Grade Selector Header */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 overflow-x-auto flex items-center gap-1.5 scrollbar-thin rounded-t-2xl">
          {classes.map((cls) => {
            const isSelected = cls.id === selectedClass.id;
            const clsHasStreams = Array.isArray(cls.streams) && cls.streams.length > 0;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClassId(cls.id || '');
                  if (clsHasStreams) {
                    setSelectedStreamId(cls.streams![0].id);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]'
                }`}
              >
                <span>{cls.name}</span>
                {clsHasStreams && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-normal">
                    {cls.streams!.length} streams
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-5">
          {/* Stream Selector if class has streams */}
          {hasStreams && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#B45309]" />
                <span className="font-bold text-xs text-[#B45309]">
                  {selectedClass.name} has Academic Streams. Select stream pathway to configure its curriculum:
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap pt-1">
                {selectedClass.streams!.map((strm) => {
                  const isStrmSelected = strm.id === activeStream?.id;
                  const strmSubCount = subjects.filter((s) => {
                    if (!s.id) return false;
                    return applicability.some(
                      (a) =>
                        a.subjectId === s.id &&
                        a.classId === selectedClass.id &&
                        a.streamId === strm.id
                    );
                  }).length;

                  return (
                    <button
                      key={strm.id}
                      type="button"
                      onClick={() => setSelectedStreamId(strm.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                        isStrmSelected
                          ? 'bg-[#B45309] text-white shadow-xs'
                          : 'bg-white hover:bg-amber-100/60 text-[#78350F] border border-amber-300'
                      }`}
                    >
                      <span>Stream: {strm.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isStrmSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-[#78350F]'
                        }`}
                      >
                        {strmSubCount} subjects
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Target Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#131B2E]">
                  Curriculum for {selectedClass.name}
                  {hasStreams && activeStream ? ` (${activeStream.name} Stream)` : ''}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] font-bold text-[10px] border border-[#C7D2FE]">
                  {assignedToTargetCount} Subjects Assigned
                </span>
              </div>
              <p className="text-[#64748B] text-[11px]">
                Check or uncheck the subjects studied by students in this group.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllCore}
                className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0] font-semibold text-[11px] transition cursor-pointer"
              >
                + Select All Core Subjects
              </button>

              {classes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsCopyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4338CA] border border-[#CBD5E1] font-semibold text-[11px] transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy From Class...</span>
                </button>
              )}

              {assignedToTargetCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearCurrentTarget}
                  className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-semibold transition cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search subjects in catalog..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] focus:border-[#4338CA] focus:outline-hidden"
            />
          </div>

          {/* Subjects Selection Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCatalogSubjects.map((sub) => {
              if (!sub.id) return null;
              const isAssigned = isSubjectAssigned(sub.id);

              return (
                <div
                  key={sub.id}
                  onClick={() => handleToggleSubject(sub.id!)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isAssigned
                      ? 'bg-[#EEF2FF]/70 border-[#4338CA] shadow-2xs'
                      : 'bg-white hover:bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="pt-0.5">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                        isAssigned
                          ? 'bg-[#4338CA] border-[#4338CA] text-white'
                          : 'border-[#CBD5E1] bg-white'
                      }`}
                    >
                      {isAssigned && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-0.5 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-bold text-xs truncate ${
                          isAssigned ? 'text-[#3730A3]' : 'text-[#131B2E]'
                        }`}
                      >
                        {sub.name}
                      </span>
                      {sub.code && (
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          [{sub.code}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                      <span className="capitalize">{sub.category || 'core'}</span>
                      <span>•</span>
                      <span className="capitalize">{sub.subjectType || 'theory'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#334155] font-bold text-xs shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back: Curriculum Catalog</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Subject Teachers</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── MODAL: COPY FROM ANOTHER CLASS ──────────────────────────────── */}
      {isCopyModalOpen && (
        <ModalPortal isOpen={isCopyModalOpen}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="font-bold text-sm text-[#131B2E]">Copy Curriculum Subjects</h3>
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#131B2E]"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#64748B]">
              Select an existing grade to copy its subject assignments into{' '}
              <strong>{selectedClass.name}</strong>:
            </p>

            <select
              value={sourceClassId}
              onChange={(e) => setSourceClassId(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs bg-white text-[#131B2E] font-medium"
            >
              <option value="">-- Choose source grade --</option>
              {classes
                .filter((c) => c.id !== selectedClass.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] text-[#475569] font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!sourceClassId}
                onClick={() => handleCopyFromClass(sourceClassId)}
                className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-40 text-white font-bold text-xs"
              >
                Copy Subjects
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
