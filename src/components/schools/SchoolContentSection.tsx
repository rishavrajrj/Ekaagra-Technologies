'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Edit3,
  Check,
  Plus,
  X,
  ShieldCheck,
  GraduationCap,
  FileText,
  Compass,
  Heart,
  Info,
  Globe,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  SchoolContentData,
  ContentBlockStatus,
} from '@/lib/types';
import {
  resolveContentBlockText,
  resolveContentBlockStatus,
  createContentBlock,
} from '@/lib/types';
import {
  UNIVERSAL_CORE_VALUES,
  extractSchoolFacts,
  buildSourceDataDigest,
  extractCanonicalSchoolHighlights,
  generateAboutSchool,
  generateMissionStatement,
  generateVisionStatement,
  generateEducationalPhilosophy,
  getRecommendedCoreValues,
  generateFullSchoolContent,
  getSection6StatusSummary,
} from '@/lib/schoolContentGenerator';
import { getSchoolTypeConfig } from '@/lib/academicStructureUtils';

interface SchoolContentSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
}

export default function SchoolContentSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
}: SchoolContentSectionProps) {
  const content = intakeData.schoolContent || ({} as SchoolContentData);
  const facts = useMemo(() => extractSchoolFacts(intakeData), [intakeData]);
  const canonicalHighlights = useMemo(() => extractCanonicalSchoolHighlights(intakeData), [intakeData]);
  const liveDigest = useMemo(() => buildSourceDataDigest(intakeData), [intakeData]);

  // Upstream source facts change detection
  const isUpstreamChanged = Boolean(
    content.sourceDataDigest && content.sourceDataDigest !== liveDigest
  );

  // Content blocks text & statuses
  const aboutText = resolveContentBlockText(content.aboutSchool);
  const aboutStatus = resolveContentBlockStatus(content.aboutSchool);

  const missionText = resolveContentBlockText(
    content.mission || intakeData.brandingDesign?.missionStatement || intakeData.leadership?.missionStatement
  );
  const missionStatus = resolveContentBlockStatus(content.mission);

  const visionText = resolveContentBlockText(
    content.vision || intakeData.brandingDesign?.visionStatement || intakeData.leadership?.visionStatement
  );
  const visionStatus = resolveContentBlockStatus(content.vision);

  const philosophyText = resolveContentBlockText(
    content.educationalPhilosophy || content.teachingMethodology || content.philosophy
  );
  const philosophyStatus = resolveContentBlockStatus(content.educationalPhilosophy);

  // Core Values - Non-destructive preservation & 6-8 public selection
  const recommendedValues = useMemo(() => getRecommendedCoreValues(intakeData), [intakeData]);

  const allAvailableValues = useMemo(() => {
    const list = new Set<string>([
      ...recommendedValues,
      ...UNIVERSAL_CORE_VALUES,
      ...(Array.isArray(content.availableCoreValues) ? content.availableCoreValues : []),
      ...(Array.isArray(content.coreValues) ? content.coreValues : []),
      ...(Array.isArray(intakeData.brandingDesign?.coreValues) ? intakeData.brandingDesign.coreValues : []),
    ]);
    return Array.from(list);
  }, [content.availableCoreValues, content.coreValues, intakeData.brandingDesign?.coreValues, recommendedValues]);

  const selectedCoreValues = useMemo(() => {
    if (Array.isArray(content.coreValues) && content.coreValues.length > 0) {
      if (content.coreValues.length > 8) {
        // If 16 values are currently auto-selected, prioritize recommended 6-8 for public profile
        const recSet = new Set(recommendedValues);
        const matching = content.coreValues.filter((v) => recSet.has(v));
        if (matching.length >= 6 && matching.length <= 8) {
          return matching;
        }
        return recommendedValues.slice(0, 8);
      }
      return content.coreValues;
    }
    if (Array.isArray(intakeData.brandingDesign?.coreValues) && intakeData.brandingDesign.coreValues.length > 0) {
      if (intakeData.brandingDesign.coreValues.length > 8) {
        return recommendedValues.slice(0, 8);
      }
      return intakeData.brandingDesign.coreValues;
    }
    return recommendedValues.slice(0, 6);
  }, [content.coreValues, intakeData.brandingDesign?.coreValues, recommendedValues]);

  const isApproved = Boolean(content.isApproved || content.approved);

  // Live calculated status summary
  const sectionSummary = useMemo(
    () => getSection6StatusSummary(intakeData, { ...content, coreValues: selectedCoreValues }),
    [intakeData, content, selectedCoreValues]
  );

  // Inline editor open state per narrative field
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({
    aboutSchool: false,
    mission: false,
    vision: false,
    educationalPhilosophy: false,
  });

  const toggleEditField = (field: 'aboutSchool' | 'mission' | 'vision' | 'educationalPhilosophy') => {
    setEditingFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Regeneration confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    field: 'aboutSchool' | 'mission' | 'vision' | 'educationalPhilosophy' | null;
    title: string;
  }>({
    isOpen: false,
    field: null,
    title: '',
  });

  // Custom core value input
  const [customValueInput, setCustomValueInput] = useState('');
  const [showAddCustomValue, setShowAddCustomValue] = useState(false);

  // Update content block and drop approval to Needs Review if user edits
  const handleTextBlockChange = useCallback(
    (field: 'aboutSchool' | 'mission' | 'vision' | 'educationalPhilosophy', newText: string) => {
      const updatedBlock = createContentBlock(newText, 'customized', liveDigest);
      updateSectionDirect('schoolContent', {
        ...content,
        [field]: updatedBlock,
        coreValues: selectedCoreValues,
        availableCoreValues: allAvailableValues,
        isApproved: false,
        approved: false,
        ...(field === 'educationalPhilosophy'
          ? { philosophy: newText, teachingMethodology: newText }
          : {}),
      });
    },
    [allAvailableValues, content, liveDigest, selectedCoreValues, updateSectionDirect]
  );

  // Perform regeneration for a specific field using verified canonical facts
  const executeRegenerateField = useCallback(
    (field: 'aboutSchool' | 'mission' | 'vision' | 'educationalPhilosophy') => {
      let generatedText = '';
      if (field === 'aboutSchool') generatedText = generateAboutSchool(intakeData);
      else if (field === 'mission') generatedText = generateMissionStatement(intakeData);
      else if (field === 'vision') generatedText = generateVisionStatement(intakeData);
      else if (field === 'educationalPhilosophy') generatedText = generateEducationalPhilosophy(intakeData);

      const block = createContentBlock(generatedText, 'generated', liveDigest);
      updateSectionDirect('schoolContent', {
        ...content,
        [field]: block,
        coreValues: selectedCoreValues,
        availableCoreValues: allAvailableValues,
        isApproved: false,
        approved: false,
        sourceDataDigest: liveDigest,
        ...(field === 'educationalPhilosophy'
          ? { philosophy: generatedText, teachingMethodology: generatedText }
          : {}),
      });
      setConfirmModal({ isOpen: false, field: null, title: '' });
    },
    [allAvailableValues, content, intakeData, liveDigest, selectedCoreValues, updateSectionDirect]
  );

  // Handle click on Regenerate (confirmation guard if user customized)
  const handleRegenerateClick = useCallback(
    (field: 'aboutSchool' | 'mission' | 'vision' | 'educationalPhilosophy', title: string) => {
      const status =
        field === 'aboutSchool'
          ? aboutStatus
          : field === 'mission'
          ? missionStatus
          : field === 'vision'
          ? visionStatus
          : philosophyStatus;

      if (status === 'customized') {
        setConfirmModal({
          isOpen: true,
          field,
          title,
        });
      } else {
        executeRegenerateField(field);
      }
    },
    [aboutStatus, missionStatus, visionStatus, philosophyStatus, executeRegenerateField]
  );

  // Toggle Core Value selection (with 6-8 validation feedback)
  const handleToggleCoreValue = useCallback(
    (val: string) => {
      const current = [...selectedCoreValues];
      const idx = current.indexOf(val);
      let updated: string[];
      if (idx > -1) {
        updated = current.filter((v) => v !== val);
      } else {
        if (current.length >= 8) {
          // Cap at 8
          return;
        }
        updated = [...current, val];
      }
      const updatedAvailable = Array.from(new Set([...allAvailableValues, ...updated]));
      updateSectionDirect('schoolContent', {
        ...content,
        coreValues: updated,
        availableCoreValues: updatedAvailable,
        isApproved: false,
        approved: false,
      });
    },
    [allAvailableValues, content, selectedCoreValues, updateSectionDirect]
  );

  // Add Custom Core Value
  const handleAddCustomValue = useCallback(() => {
    const trimmed = customValueInput.trim();
    if (!trimmed) return;
    if (!selectedCoreValues.includes(trimmed)) {
      const updatedSelected = selectedCoreValues.length < 8 ? [...selectedCoreValues, trimmed] : selectedCoreValues;
      const updatedAvailable = Array.from(new Set([...allAvailableValues, trimmed]));
      updateSectionDirect('schoolContent', {
        ...content,
        coreValues: updatedSelected,
        availableCoreValues: updatedAvailable,
        isApproved: false,
        approved: false,
      });
    }
    setCustomValueInput('');
    setShowAddCustomValue(false);
  }, [allAvailableValues, content, customValueInput, selectedCoreValues, updateSectionDirect]);

  // Remove Custom Core Value
  const handleRemoveCoreValue = useCallback(
    (val: string) => {
      const updatedSelected = selectedCoreValues.filter((v) => v !== val);
      const updatedAvailable = allAvailableValues.filter((v) => v !== val);
      updateSectionDirect('schoolContent', {
        ...content,
        coreValues: updatedSelected,
        availableCoreValues: updatedAvailable,
        isApproved: false,
        approved: false,
      });
    },
    [allAvailableValues, content, selectedCoreValues, updateSectionDirect]
  );

  // Handle Review & Update when upstream source data changed
  const handleRefreshSourceData = useCallback(() => {
    const regenerated = generateFullSchoolContent(intakeData, content, false);
    updateSectionDirect('schoolContent', {
      ...regenerated,
      coreValues: selectedCoreValues,
      availableCoreValues: allAvailableValues,
      sourceDataDigest: liveDigest,
      isApproved: false,
      approved: false,
    });
  }, [allAvailableValues, content, intakeData, liveDigest, selectedCoreValues, updateSectionDirect]);

  // Dismiss upstream change notice
  const handleDismissSourceChange = useCallback(() => {
    updateSectionDirect('schoolContent', {
      ...content,
      sourceDataDigest: liveDigest,
    });
  }, [content, liveDigest, updateSectionDirect]);

  // Toggle Final Section Approval
  const handleToggleApprove = useCallback(() => {
    if (isApproved) {
      // Revert to edit mode
      updateSectionDirect('schoolContent', {
        ...content,
        isApproved: false,
        approved: false,
      });
    } else {
      if (!sectionSummary.canApprove) return;
      const now = new Date().toISOString();
      const approver = intakeData.schoolProfile?.officialEmail || 'School Administrator';

      updateSectionDirect('schoolContent', {
        ...content,
        aboutSchool: createContentBlock(aboutText, 'approved', liveDigest),
        mission: createContentBlock(missionText, 'approved', liveDigest),
        vision: createContentBlock(visionText, 'approved', liveDigest),
        educationalPhilosophy: createContentBlock(philosophyText, 'approved', liveDigest),
        coreValues: selectedCoreValues,
        availableCoreValues: allAvailableValues,
        isApproved: true,
        approved: true,
        approvedAt: now,
        approvedBy: approver,
        sourceDataDigest: liveDigest,
        philosophy: philosophyText,
        teachingMethodology: philosophyText,
      });
    }
  }, [
    aboutText,
    allAvailableValues,
    content,
    intakeData.schoolProfile?.officialEmail,
    isApproved,
    liveDigest,
    missionText,
    philosophyText,
    sectionSummary.canApprove,
    selectedCoreValues,
    updateSectionDirect,
    visionText,
  ]);

  // Helper for narrative block status badge
  const renderStatusBadge = (status: ContentBlockStatus) => {
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
          <Check className="w-3 h-3 mr-1 text-emerald-600" />
          Approved
        </span>
      );
    }
    if (status === 'customized') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold">
          <Edit3 className="w-3 h-3 mr-1 text-amber-600" />
          Edited by you · Needs approval
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA] text-[10px] font-semibold">
        <Sparkles className="w-3 h-3 mr-1 text-[#4338CA]" />
        AI-prepared draft · Needs review
      </span>
    );
  };

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ---------------------------------------------------------------------- */}
      {/* 1. REVIEW-ORIENTED HEADER & WORKFLOW STATUS */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 text-[#4338CA] shadow-2xs mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4338CA]">
                  Section 6
                </span>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[11px] font-medium text-[#64748B]">
                  School Story, Mission &amp; Educational Philosophy
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-extrabold text-[#131B2E] mt-0.5">
                Review your school&apos;s story before it is published
              </h3>
              <p className="text-xs text-[#334155] font-medium mt-1.5 leading-relaxed max-w-2xl">
                We&apos;ve already prepared these drafts using information you&apos;ve provided in earlier sections.
              </p>
              <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed max-w-2xl">
                You do <strong>NOT</strong> need to enter this information again. Review the drafts below, make changes only where needed, then approve them.
              </p>
            </div>
          </div>

          {/* Real State Status Badge */}
          <div className="self-start sm:self-auto shrink-0">
            {isApproved ? (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approved</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] text-xs font-bold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                <span>{sectionSummary.statusText}</span>
              </span>
            )}
          </div>
        </div>

        {/* Compact Workflow Bar: 1 Review -> 2 Edit if needed -> 3 Approve */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
            Guided Action Workflow:
          </span>
          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>✓ 1 Review</span>
            </span>
            <span className="text-[#94A3B8]">→</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-[#4338CA] border border-indigo-200">
              <span>→ 2 Edit if needed</span>
            </span>
            <span className="text-[#94A3B8]">→</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <span>→ 3 Approve</span>
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* UPSTREAM SOURCE DATA CHANGED NOTICE */}
      {/* ---------------------------------------------------------------------- */}
      {isUpstreamChanged && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-900 text-xs">
                Some school information has changed. Your prepared drafts can be updated.
              </p>
              <p className="text-[11px] text-amber-700">
                School identity, facilities, campuses, or brand style were recently updated. Your customized work will never be silently overwritten.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleRefreshSourceData}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>Review &amp; Update</span>
            </button>
            <button
              type="button"
              onClick={handleDismissSourceChange}
              className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-medium text-xs transition cursor-pointer"
            >
              Keep Current Drafts
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 2. PREPARED FROM VERIFIED SCHOOL INFORMATION CARD */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#131B2E]">
                Prepared from your verified school information
              </h4>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                These drafts were created from information you&apos;ve already provided. Do NOT enter these facts again.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto">
            Verified School Data
          </span>
        </div>

        {/* Canonical Source Facts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Established">Established</span>
            <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words">
              {canonicalHighlights.establishedYear || 'Not specified'}
            </span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Location">Location</span>
            <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words leading-snug" title={canonicalHighlights.location}>
              {canonicalHighlights.location || 'Not specified'}
            </span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Board">Board</span>
            <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words leading-snug" title={canonicalHighlights.board}>
              {canonicalHighlights.board || 'Not specified'}
            </span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1.5 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Classes">Classes</span>
              {canonicalHighlights.campusBreakdowns && canonicalHighlights.campusBreakdowns.length > 0 && (
                <span className="text-[9px] font-semibold text-[#4338CA] bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                  By Campus
                </span>
              )}
            </div>
            {canonicalHighlights.campusBreakdowns && canonicalHighlights.campusBreakdowns.length > 0 ? (
              <div className="space-y-2">
                {canonicalHighlights.campusBreakdowns.map((b) => (
                  <div
                    key={b.campusId}
                    className="bg-white/90 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 shadow-2xs text-xs leading-normal"
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[#64748B] font-bold text-[11px]" title={b.campusName}>
                        {b.campusName}
                      </span>
                      {b.isMainCampus && (
                        <span className="text-[9px] font-bold text-[#4338CA] bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100 shrink-0">
                          Main
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-[#131B2E] break-words" title={b.classRange}>
                      {b.classRange}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words leading-snug" title={canonicalHighlights.classes || getSchoolTypeConfig(facts.schoolType).classRange}>
                {canonicalHighlights.classes || getSchoolTypeConfig(facts.schoolType).classRange}
              </span>
            )}
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Campus">Campus</span>
            <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words">
              {facts.isMultiCampus ? `${facts.campusCount} Campuses` : '1 Campus'}
            </span>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3 rounded-xl min-w-0 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] block" title="Communication Tone">Communication Tone</span>
            <span className="font-bold text-xs text-[#131B2E] mt-0.5 block break-words leading-snug" title={facts.brandTone}>
              {facts.brandTone}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#F1F5F9] text-[11px] text-[#64748B]">
          <span>
            Source information: School Identity · Location · Brand Identity / Tone · Campuses · Verified facilities
          </span>
          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Factual integrity guaranteed (no fabricated claims)</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. ABOUT YOUR SCHOOL */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#131B2E]">About Your School</h4>
                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Your school&apos;s story, background, and what makes your institution distinctive.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            {renderStatusBadge(aboutStatus)}

            {/* Primary Action: Edit */}
            <button
              type="button"
              onClick={() => toggleEditField('aboutSchool')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ${
                editingFields.aboutSchool
                  ? 'bg-[#4338CA] text-white'
                  : 'bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] hover:text-[#4338CA]'
              }`}
              aria-label={editingFields.aboutSchool ? 'Done editing About School' : 'Edit About School'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingFields.aboutSchool ? 'Done Editing' : 'Edit'}</span>
            </button>

            {/* Secondary Action: Regenerate */}
            <button
              type="button"
              onClick={() => handleRegenerateClick('aboutSchool', 'About Your School')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#64748B] hover:text-[#4338CA] text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Generate a new draft using the same verified school information."
            >
              <RotateCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Narrative Presentation / Editor */}
        <div className="space-y-2">
          {editingFields.aboutSchool ? (
            <div className="space-y-2">
              <textarea
                id="about-school-editor"
                rows={5}
                value={aboutText}
                onChange={(e) => handleTextBlockChange('aboutSchool', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#4338CA] text-[#131B2E] placeholder:text-[#94A3B8] text-xs sm:text-sm leading-relaxed focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs resize-y min-h-[120px]"
                placeholder="Review and edit your official About School story..."
                autoFocus
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => toggleEditField('aboutSchool')}
                  className="px-3 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done Editing</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => toggleEditField('aboutSchool')}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs sm:text-sm leading-relaxed shadow-2xs cursor-pointer hover:border-[#CBD5E1] transition group relative"
              title="Click to edit this draft"
            >
              <p className="whitespace-pre-line">{aboutText || 'Click Edit to draft your About School story...'}</p>
              <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                Click to edit
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span className="text-[10px] text-[#94A3B8]">
              {aboutStatus === 'customized'
                ? '✎ Edited by you · Needs approval before publishing.'
                : '✨ Prepared from School Identity, Location, and Brand Tone.'}
            </span>
            <span className={`font-mono ${aboutText.length >= 20 ? 'text-[#64748B]' : 'text-amber-600 font-medium'}`}>
              {aboutText.length} characters {aboutText.length < 20 ? '(min 20 required)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. MISSION */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#131B2E]">Mission</h4>
                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                A concise statement describing what your school is committed to achieving every day.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            {renderStatusBadge(missionStatus)}

            <button
              type="button"
              onClick={() => toggleEditField('mission')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ${
                editingFields.mission
                  ? 'bg-[#4338CA] text-white'
                  : 'bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] hover:text-[#4338CA]'
              }`}
              aria-label={editingFields.mission ? 'Done editing Mission' : 'Edit Mission'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingFields.mission ? 'Done Editing' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRegenerateClick('mission', 'Mission Statement')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#64748B] hover:text-[#4338CA] text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Generate a new draft using the same verified school information."
            >
              <RotateCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {editingFields.mission ? (
            <div className="space-y-2">
              <textarea
                id="mission-editor"
                rows={3}
                value={missionText}
                onChange={(e) => handleTextBlockChange('mission', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#4338CA] text-[#131B2E] placeholder:text-[#94A3B8] text-xs sm:text-sm leading-relaxed focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs resize-y min-h-[90px]"
                placeholder="A concise, actionable mission statement..."
                autoFocus
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => toggleEditField('mission')}
                  className="px-3 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done Editing</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => toggleEditField('mission')}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs sm:text-sm leading-relaxed shadow-2xs cursor-pointer hover:border-[#CBD5E1] transition group relative"
              title="Click to edit this draft"
            >
              <p className="whitespace-pre-line">{missionText || 'Click Edit to draft your Mission statement...'}</p>
              <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                Click to edit
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span className="text-[10px] text-[#94A3B8]">
              {missionStatus === 'customized'
                ? '✎ Edited by you · Needs approval.'
                : '✨ Grounded in your institution’s core purpose.'}
            </span>
            <span className={`font-mono ${missionText.length >= 10 ? 'text-[#64748B]' : 'text-amber-600 font-medium'}`}>
              {missionText.length} characters {missionText.length < 10 ? '(min 10 required)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 5. VISION */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#131B2E]">Vision</h4>
                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                A forward-looking statement describing the kind of learners and community your school aims to develop.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            {renderStatusBadge(visionStatus)}

            <button
              type="button"
              onClick={() => toggleEditField('vision')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ${
                editingFields.vision
                  ? 'bg-[#4338CA] text-white'
                  : 'bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] hover:text-[#4338CA]'
              }`}
              aria-label={editingFields.vision ? 'Done editing Vision' : 'Edit Vision'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingFields.vision ? 'Done Editing' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRegenerateClick('vision', 'Vision Statement')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#64748B] hover:text-[#4338CA] text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Generate a new draft using the same verified school information."
            >
              <RotateCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {editingFields.vision ? (
            <div className="space-y-2">
              <textarea
                id="vision-editor"
                rows={3}
                value={visionText}
                onChange={(e) => handleTextBlockChange('vision', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#4338CA] text-[#131B2E] placeholder:text-[#94A3B8] text-xs sm:text-sm leading-relaxed focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs resize-y min-h-[90px]"
                placeholder="A forward-looking institutional vision statement..."
                autoFocus
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => toggleEditField('vision')}
                  className="px-3 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done Editing</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => toggleEditField('vision')}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs sm:text-sm leading-relaxed shadow-2xs cursor-pointer hover:border-[#CBD5E1] transition group relative"
              title="Click to edit this draft"
            >
              <p className="whitespace-pre-line">{visionText || 'Click Edit to draft your Vision statement...'}</p>
              <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                Click to edit
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span className="text-[10px] text-[#94A3B8]">
              {visionStatus === 'customized'
                ? '✎ Edited by you · Needs approval.'
                : '✨ Forward-looking, inspiring, and grounded in your school’s ethos.'}
            </span>
            <span className={`font-mono ${visionText.length >= 10 ? 'text-[#64748B]' : 'text-amber-600 font-medium'}`}>
              {visionText.length} characters {visionText.length < 10 ? '(min 10 required)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 6. EDUCATIONAL PHILOSOPHY & TEACHING APPROACH */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#131B2E]">
                  Educational Philosophy &amp; Teaching Approach
                </h4>
                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Describe how your school approaches learning, teaching, and student development.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            {renderStatusBadge(philosophyStatus)}

            <button
              type="button"
              onClick={() => toggleEditField('educationalPhilosophy')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer ${
                editingFields.educationalPhilosophy
                  ? 'bg-[#4338CA] text-white'
                  : 'bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#334155] hover:text-[#4338CA]'
              }`}
              aria-label={editingFields.educationalPhilosophy ? 'Done editing Philosophy' : 'Edit Philosophy'}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{editingFields.educationalPhilosophy ? 'Done Editing' : 'Edit'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleRegenerateClick('educationalPhilosophy', 'Educational Philosophy')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF7F2] border border-[#CBD5E1] text-[#64748B] hover:text-[#4338CA] text-xs font-medium transition cursor-pointer shadow-2xs"
              title="Generate a new draft using the same verified school information."
            >
              <RotateCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {editingFields.educationalPhilosophy ? (
            <div className="space-y-2">
              <textarea
                id="philosophy-editor"
                rows={5}
                value={philosophyText}
                onChange={(e) => handleTextBlockChange('educationalPhilosophy', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-[#4338CA] text-[#131B2E] placeholder:text-[#94A3B8] text-xs sm:text-sm leading-relaxed focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs resize-y min-h-[120px]"
                placeholder="Review and edit your educational philosophy and teaching approach..."
                autoFocus
              />
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => toggleEditField('educationalPhilosophy')}
                  className="px-3 py-1 rounded-lg bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold shadow-2xs transition cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Done Editing</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => toggleEditField('educationalPhilosophy')}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] text-xs sm:text-sm leading-relaxed shadow-2xs cursor-pointer hover:border-[#CBD5E1] transition group relative"
              title="Click to edit this draft"
            >
              <p className="whitespace-pre-line">{philosophyText || 'Click Edit to draft your Educational Philosophy...'}</p>
              <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition text-[10px] text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md font-semibold">
                Click to edit
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span className="text-[10px] text-[#94A3B8]">
              {philosophyStatus === 'customized'
                ? '✎ Edited by you · Needs approval.'
                : '✨ Reflects verified facilities (smart classrooms, science labs, sports) and pedagogical approach.'}
            </span>
            <span className={`font-mono ${philosophyText.length >= 20 ? 'text-[#64748B]' : 'text-amber-600 font-medium'}`}>
              {philosophyText.length} characters {philosophyText.length < 20 ? '(min 20 required)' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 7. CORE VALUES (CLEAR 6-8 SELECTION MODEL) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-5 md:p-6 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <Heart className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#131B2E]">Core Values</h4>
                <span className="text-rose-500 font-bold text-xs" title="Required">*</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Choose 6–8 values that best represent your school.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                selectedCoreValues.length >= 6 && selectedCoreValues.length <= 8
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {selectedCoreValues.length >= 6 && selectedCoreValues.length <= 8 && (
                <Check className="w-3 h-3 text-emerald-600 mr-1" />
              )}
              <span>{selectedCoreValues.length} of 8 selected</span>
            </span>
          </div>
        </div>

        {/* Value Guidance Banner */}
        {selectedCoreValues.length < 6 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please select at least 6 core values for your public-facing profile (currently {selectedCoreValues.length} selected).</span>
          </div>
        )}
        {selectedCoreValues.length > 8 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Please choose at most 8 core values for your public profile (currently {selectedCoreValues.length} selected).</span>
          </div>
        )}

        {/* Recommended Values Group */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4338CA]">
              Recommended Values (Based on {facts.brandTone})
            </span>
            <span className="text-[10px] text-[#94A3B8]">Tailored to your tone</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendedValues.map((val) => {
              const isSelected = selectedCoreValues.includes(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleToggleCoreValue(val)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                    isSelected
                      ? 'bg-[#4338CA] text-white border border-[#3730A3]'
                      : 'bg-white text-[#475569] border border-[#CBD5E1] hover:border-[#4338CA] hover:text-[#4338CA]'
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3 text-white" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                  <span>{val}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional Values Group */}
        <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Additional Values
            </span>
            <span className="text-[10px] text-[#94A3B8]">Select any to represent your school</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allAvailableValues
              .filter((v) => !recommendedValues.includes(v))
              .map((val) => {
                const isSelected = selectedCoreValues.includes(val);
                const isCustom = !UNIVERSAL_CORE_VALUES.includes(val);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleToggleCoreValue(val)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-2xs ${
                      isSelected
                        ? 'bg-[#4338CA] text-white border border-[#3730A3]'
                        : 'bg-white text-[#475569] border border-[#CBD5E1] hover:border-[#4338CA] hover:text-[#4338CA]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 text-white" /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                    <span>{val}</span>
                    {isCustom && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCoreValue(val);
                        }}
                        className="ml-1 p-0.5 rounded-full hover:bg-black/10 cursor-pointer"
                        title={`Remove ${val}`}
                      >
                        <X className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Add Custom Core Value Input */}
        <div className="pt-2">
          {showAddCustomValue ? (
            <div className="flex items-center space-x-2 max-w-sm">
              <input
                type="text"
                value={customValueInput}
                onChange={(e) => setCustomValueInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomValue();
                  }
                }}
                placeholder="e.g. Environmental Stewardship"
                className="px-3 py-1.5 rounded-lg bg-white border border-[#CBD5E1] text-[#131B2E] text-xs hover:border-[#4338CA] focus:border-[#4338CA] focus:outline-hidden w-full shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddCustomValue}
                disabled={!customValueInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#4338CA] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomValue(false);
                  setCustomValueInput('');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] text-xs hover:bg-[#FAF7F2] cursor-pointer shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCustomValue(true)}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Custom Value</span>
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 8. WHERE WILL THIS CONTENT BE USED? */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 md:p-6 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-[#131B2E]">
          <Globe className="w-4 h-4 text-[#4338CA]" />
          <h4 className="font-extrabold text-sm text-[#131B2E]">
            Where will this content be used?
          </h4>
        </div>
        <p className="text-[11px] text-[#64748B] leading-relaxed">
          This approved content may appear across your public digital channels and school collateral:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5">
            <span className="font-bold text-[#131B2E] block">Website</span>
            <ul className="text-[11px] text-[#64748B] space-y-1 list-disc list-inside">
              <li>About Us</li>
              <li>Homepage</li>
              <li>School Profile</li>
            </ul>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5">
            <span className="font-bold text-[#131B2E] block">Admissions</span>
            <ul className="text-[11px] text-[#64748B] space-y-1 list-disc list-inside">
              <li>Digital prospectus</li>
              <li>Admission portal</li>
              <li>Parent information</li>
            </ul>
          </div>
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] p-3.5 rounded-xl space-y-1.5">
            <span className="font-bold text-[#131B2E] block">Institutional Profile</span>
            <ul className="text-[11px] text-[#64748B] space-y-1 list-disc list-inside">
              <li>Directory</li>
              <li>Handbook</li>
              <li>Official digital documents</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 9. READY TO APPROVE? FINAL APPROVAL WORKFLOW */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white border-2 border-[#C7D2FE] rounded-2xl p-5 md:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
          <div className="flex items-start sm:items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4338CA] text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#131B2E]">
                Ready to approve?
              </h4>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                Review the content above. Once approved, this institutional narrative can be used across your website and admissions materials.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-auto">
            {isApproved ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>✓ Approved</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold shadow-2xs">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>• Approval Pending</span>
              </span>
            )}
          </div>
        </div>

        {/* Approval Safety Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          <div className="flex items-center space-x-2 bg-[#FAF7F2] border border-[#E2E8F0] p-2.5 rounded-xl">
            {aboutText.length >= 20 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className={`font-semibold ${aboutText.length >= 20 ? 'text-[#131B2E]' : 'text-rose-600'}`}>
              About School
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#FAF7F2] border border-[#E2E8F0] p-2.5 rounded-xl">
            {missionText.length >= 10 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className={`font-semibold ${missionText.length >= 10 ? 'text-[#131B2E]' : 'text-rose-600'}`}>
              Mission
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#FAF7F2] border border-[#E2E8F0] p-2.5 rounded-xl">
            {visionText.length >= 10 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className={`font-semibold ${visionText.length >= 10 ? 'text-[#131B2E]' : 'text-rose-600'}`}>
              Vision
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#FAF7F2] border border-[#E2E8F0] p-2.5 rounded-xl">
            {philosophyText.length >= 20 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span className={`font-semibold ${philosophyText.length >= 20 ? 'text-[#131B2E]' : 'text-rose-600'}`}>
              Educational Philosophy
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#FAF7F2] border border-[#E2E8F0] p-2.5 rounded-xl">
            {selectedCoreValues.length >= 6 && selectedCoreValues.length <= 8 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span
              className={`font-semibold ${
                selectedCoreValues.length >= 6 && selectedCoreValues.length <= 8 ? 'text-[#131B2E]' : 'text-rose-600'
              }`}
            >
              Core Values ({selectedCoreValues.length})
            </span>
          </div>
        </div>

        {/* Validation issues if any */}
        {!sectionSummary.canApprove && !isApproved && (
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl space-y-1 text-xs text-rose-800">
            <span className="font-bold block">Please resolve the following before approval:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {sectionSummary.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Approval Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-[#64748B]">
            {isApproved
              ? `Approved by ${content.approvedBy || 'Administrator'}${
                  content.approvedAt ? ` on ${new Date(content.approvedAt).toLocaleDateString()}` : ''
                }. Section 6 is 100% complete. You can edit anytime to make adjustments.`
              : 'Review the content above. Click "Approve & Complete Section" to complete this onboarding step.'}
          </p>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {isApproved ? (
              <button
                type="button"
                onClick={handleToggleApprove}
                className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#334155] hover:bg-[#FAF7F2] font-semibold text-xs transition cursor-pointer shadow-2xs flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Approved Content</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleApprove}
                disabled={!sectionSummary.canApprove}
                className="px-5 py-2.5 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Approve &amp; Complete Section</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* REGENERATION CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-[#131B2E]">
                  Replace Customized Content?
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  This content for <strong>{confirmModal.title}</strong> has been manually edited. Regenerating will create a new draft using the same verified school information and replace your current edits.
                </p>
              </div>
            </div>

            <p className="text-xs font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              Generate a new draft using the same verified school information. Continue?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, field: null, title: '' })}
                className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-[#475569] hover:bg-[#FAF7F2] text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmModal.field && executeRegenerateField(confirmModal.field)}
                className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate Draft</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
