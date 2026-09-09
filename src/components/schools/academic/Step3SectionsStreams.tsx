'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import type {
  AcademicStructureData,
  AcademicClassConfig,
  AcademicStreamConfig,
} from '@/lib/types';
import {
  DEFAULT_STREAM_SUGGESTIONS,
  generateAcademicId,
  normalizeSections,
} from '@/lib/academicStructureUtils';

interface Step3SectionsStreamsProps {
  structure: AcademicStructureData;
  onChange: (updated: AcademicStructureData) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3SectionsStreams({
  structure,
  onChange,
  onNext,
  onPrev,
}: Step3SectionsStreamsProps) {
  const classes = structure.classes || [];
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

  // Active Subtab for the selected class: 'sections' vs 'streams'
  const [activeTab, setActiveTab] = useState<'sections' | 'streams'>('sections');

  // Input states for Sections
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionIdx, setEditingSectionIdx] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  // Input states for Streams
  const [newStreamName, setNewStreamName] = useState('');
  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [editingStreamName, setEditingStreamName] = useState('');

  // Input states for Stream-specific sections
  const [activeStreamIdForSec, setActiveStreamIdForSec] = useState<string | null>(null);
  const [newStreamSecName, setNewStreamSecName] = useState('');

  if (classes.length === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl text-center space-y-3">
        <h3 className="font-bold text-sm text-[#131B2E]">No grades configured</h3>
        <p className="text-xs text-[#64748B]">
          Please define your academic grades first before adding sections or streams.
        </p>
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded-xl bg-[#4338CA] text-white font-bold text-xs cursor-pointer"
        >
          ← Go back to Grades / Classes
        </button>
      </div>
    );
  }

  // Update helper for active class
  const updateActiveClassObject = (updatedCls: AcademicClassConfig) => {
    const nextClasses = classes.map((c) => (c.id === updatedCls.id ? updatedCls : c));
    onChange({
      ...structure,
      classes: nextClasses,
    });
  };

  // Section Handlers
  const currentSections = normalizeSections(selectedClass.sections);

  const handleAddSection = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim().toUpperCase();
    if (!trimmed) return;
    if (currentSections.some((s) => s.toUpperCase() === trimmed)) {
      alert(`Section "${trimmed}" already exists in ${selectedClass.name}.`);
      return;
    }
    updateActiveClassObject({
      ...selectedClass,
      sections: [...currentSections, trimmed],
    });
    setNewSectionName('');
  };

  const handleRemoveSection = (secName: string) => {
    updateActiveClassObject({
      ...selectedClass,
      sections: currentSections.filter((s) => s !== secName),
    });
  };

  const handleSaveRenameSection = (oldName: string) => {
    const trimmed = editingSectionName.trim().toUpperCase();
    if (!trimmed) return;
    if (
      trimmed !== oldName.toUpperCase() &&
      currentSections.some((s) => s.toUpperCase() === trimmed)
    ) {
      alert(`Section "${trimmed}" already exists.`);
      return;
    }
    const updated = currentSections.map((s) => (s === oldName ? trimmed : s));
    updateActiveClassObject({
      ...selectedClass,
      sections: updated,
    });
    setEditingSectionIdx(null);
  };

  // Stream Handlers
  const currentStreams = selectedClass.streams || [];

  const handleAddStream = (strmName: string) => {
    const trimmed = strmName.trim();
    if (!trimmed) return;
    if (currentStreams.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Stream "${trimmed}" already exists in ${selectedClass.name}.`);
      return;
    }
    const newStrm: AcademicStreamConfig = {
      id: generateAcademicId('strm'),
      name: trimmed,
      sections: ['A'], // Default to Section A for convenience
    };
    updateActiveClassObject({
      ...selectedClass,
      streams: [...currentStreams, newStrm],
    });
    setNewStreamName('');
  };

  const handleRemoveStream = (streamId: string) => {
    updateActiveClassObject({
      ...selectedClass,
      streams: currentStreams.filter((s) => s.id !== streamId),
    });
  };

  const handleSaveRenameStream = (streamId: string) => {
    const trimmed = editingStreamName.trim();
    if (!trimmed) return;
    const updated = currentStreams.map((s) =>
      s.id === streamId ? { ...s, name: trimmed } : s
    );
    updateActiveClassObject({
      ...selectedClass,
      streams: updated,
    });
    setEditingStreamId(null);
  };

  // Stream Section Handlers (Structure D)
  const handleAddStreamSection = (streamId: string, secName: string) => {
    const trimmed = secName.trim().toUpperCase();
    if (!trimmed) return;
    const updated = currentStreams.map((s) => {
      if (s.id === streamId) {
        const secs = normalizeSections(s.sections);
        if (secs.some((x) => x.toUpperCase() === trimmed)) return s;
        return { ...s, sections: [...secs, trimmed] };
      }
      return s;
    });
    updateActiveClassObject({
      ...selectedClass,
      streams: updated,
    });
    setNewStreamSecName('');
  };

  const handleRemoveStreamSection = (streamId: string, secName: string) => {
    const updated = currentStreams.map((s) => {
      if (s.id === streamId) {
        const secs = normalizeSections(s.sections);
        return { ...s, sections: secs.filter((x) => x !== secName) };
      }
      return s;
    });
    updateActiveClassObject({
      ...selectedClass,
      streams: updated,
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
          <h4 className="font-bold text-[#131B2E]">Sections & Academic Streams</h4>
          <p className="text-[#64748B] leading-relaxed">
            <strong>Sections</strong> are student divisions within a grade (such as A, B, C) — use them
            if multiple groups exist. <strong>Streams</strong> are specialized academic pathways (such as
            Science, Commerce, Humanities) typically offered in higher classes (e.g. Class 11 & 12).
            Both are <strong>completely optional</strong>.
          </p>
        </div>
      </div>

      {/* Main Container: Grade Selector + Configuration Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-visible">
        {/* Grade Selector Tabs */}
        <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 overflow-x-auto flex items-center gap-1.5 scrollbar-thin rounded-t-2xl">
          {classes.map((cls) => {
            const isSelected = cls.id === selectedClass.id;
            const secCount = (cls.sections || []).length;
            const strmCount = (cls.streams || []).length;

            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClassId(cls.id || '');
                  setEditingSectionIdx(null);
                  setEditingStreamId(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'bg-white hover:bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]'
                }`}
              >
                <span>{cls.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  {strmCount > 0 ? `${strmCount} streams` : `${secCount} sec`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Grade Work Area */}
        <div className="p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#131B2E]">
                  {selectedClass.name}
                </h3>
                {selectedClass.level && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-md border border-[#E2E8F0]">
                    {selectedClass.level}
                  </span>
                )}
              </div>
              <p className="text-[#64748B] text-xs">
                Configure student divisions (sections) and optional pathways (streams) for this grade.
              </p>
            </div>

            {/* Subtabs: Sections vs Streams */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'sections'
                    ? 'bg-white text-[#4338CA] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Sections ({currentSections.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('streams')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'streams'
                    ? 'bg-white text-[#4338CA] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#131B2E]'
                }`}
              >
                Streams ({currentStreams.length})
              </button>
            </div>
          </div>

          {/* TAB 1: SECTIONS */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-[#131B2E]">
                    Sections for {selectedClass.name}
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Optional student groups within this grade. If your school has only one group,
                    sections can remain empty or single.
                  </p>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[#94A3B8] font-medium mr-1">Quick Add:</span>
                  {['A', 'B', 'C', 'D'].map((letter) => (
                    <button
                      key={letter}
                      type="button"
                      disabled={currentSections.includes(letter)}
                      onClick={() => handleAddSection(letter)}
                      className="px-2 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#4338CA] border border-[#CBD5E1] font-bold text-[10px] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    >
                      + {letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Section Form */}
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSection(newSectionName);
                    }
                  }}
                  placeholder="e.g. A, B, Blue, Red, Rose"
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAddSection(newSectionName)}
                  className="px-3.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Add Section
                </button>
              </div>

              {/* Current Sections List */}
              {currentSections.length === 0 ? (
                <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-xl p-4 text-center space-y-1">
                  <p className="font-semibold text-xs text-[#475569]">
                    No sections added for {selectedClass.name}.
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    This grade will be treated as a single teaching group (Structure A). You can add
                    sections at any time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {currentSections.map((sec, idx) => {
                    const isEditing = editingSectionIdx === idx;

                    return (
                      <div
                        key={sec}
                        className="p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs flex items-center justify-between gap-2"
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              type="text"
                              value={editingSectionName}
                              onChange={(e) => setEditingSectionName(e.target.value)}
                              className="w-full px-2 py-1 text-xs border rounded-lg font-bold"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRenameSection(sec)}
                              className="px-2 py-1 rounded bg-[#4338CA] text-white text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSectionIdx(null)}
                              className="px-1.5 py-1 text-[#94A3B8] text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] text-[#4338CA] font-extrabold text-xs flex items-center justify-center border border-[#C7D2FE]">
                                {sec}
                              </span>
                              <span className="font-bold text-xs text-[#131B2E]">
                                Section {sec}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSectionIdx(idx);
                                  setEditingSectionName(sec);
                                }}
                                className="p-1 text-[#64748B] hover:text-[#131B2E] rounded hover:bg-[#F1F5F9] cursor-pointer"
                                title="Rename Section"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(sec)}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                                title="Remove Section"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STREAMS */}
          {activeTab === 'streams' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-[#131B2E]">
                    Academic Streams for {selectedClass.name}
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Specialized pathways (e.g. Science, Commerce, Humanities). Each stream can have
                    its own independent curriculum and sections.
                  </p>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-[#94A3B8] font-medium mr-1">Suggestions:</span>
                  {DEFAULT_STREAM_SUGGESTIONS.map((strm) => (
                    <button
                      key={strm}
                      type="button"
                      disabled={currentStreams.some(
                        (s) => s.name.toLowerCase() === strm.toLowerCase()
                      )}
                      onClick={() => handleAddStream(strm)}
                      className="px-2 py-1 rounded-md bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#B45309] border border-[#CBD5E1] font-semibold text-[10px] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                    >
                      + {strm}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Stream Form */}
              <div className="flex items-center gap-2 max-w-sm">
                <input
                  type="text"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStream(newStreamName);
                    }
                  }}
                  placeholder="e.g. Science, Commerce, Humanities, Vocational"
                  className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs hover:border-[#CBD5E1] focus:border-[#4338CA] focus:outline-hidden transition shadow-2xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAddStream(newStreamName)}
                  className="px-3.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  Add Stream
                </button>
              </div>

              {/* Current Streams List */}
              {currentStreams.length === 0 ? (
                <div className="bg-[#FAF7F2] border border-dashed border-[#CBD5E1] rounded-xl p-4 text-center space-y-1">
                  <p className="font-semibold text-xs text-[#475569]">
                    No academic streams configured for {selectedClass.name}.
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    Streams are completely optional. Lower grades usually do not use streams.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentStreams.map((strm) => {
                    const isEditing = editingStreamId === strm.id;
                    const strmSecs = normalizeSections(strm.sections);

                    return (
                      <div
                        key={strm.id}
                        className="p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-2xs space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#F1F5F9]">
                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                              <input
                                type="text"
                                value={editingStreamName}
                                onChange={(e) => setEditingStreamName(e.target.value)}
                                className="px-2 py-1 text-xs border rounded-lg font-bold flex-1"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRenameStream(strm.id)}
                                className="px-2 py-1 rounded bg-[#4338CA] text-white text-[10px] font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStreamId(null)}
                                className="px-1.5 py-1 text-[#94A3B8] text-[10px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-[#B45309] font-bold text-xs border border-amber-200">
                                {strm.name}
                              </span>
                              <span className="text-[11px] text-[#64748B]">
                                Stream Pathway
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStreamId(strm.id);
                                  setEditingStreamName(strm.name);
                                }}
                                className="p-1 text-[#64748B] hover:text-[#131B2E] rounded hover:bg-[#F1F5F9] cursor-pointer"
                                title="Rename Stream"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveStream(strm.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 cursor-pointer"
                              title="Remove Stream"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Stream-Specific Sections (Structure D) */}
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#475569]">
                              Sections for {strm.name} ({strmSecs.length})
                            </span>
                            <div className="flex items-center gap-1">
                              {['A', 'B', 'C'].map((letter) => (
                                <button
                                  key={letter}
                                  type="button"
                                  disabled={strmSecs.includes(letter)}
                                  onClick={() => handleAddStreamSection(strm.id, letter)}
                                  className="px-1.5 py-0.5 rounded bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#4338CA] border border-[#CBD5E1] text-[9px] font-bold disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                                >
                                  + {letter}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {strmSecs.map((sec) => (
                              <div
                                key={sec}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF2FF] text-[#4338CA] font-bold text-xs border border-[#C7D2FE]"
                              >
                                <span>Section {sec}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStreamSection(strm.id, sec)}
                                  className="hover:text-rose-600 transition cursor-pointer"
                                  title="Remove section from stream"
                                >
                                  ×
                                </button>
                              </div>
                            ))}

                            {strmSecs.length === 0 && (
                              <span className="text-[11px] text-[#94A3B8] italic">
                                No sections in this stream (treated as single teaching group)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
          <span>Back: Grades / Classes</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <span>Save & Continue to Curriculum Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
