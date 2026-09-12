'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Layers,
  ArrowRight,
  RotateCw,
  FileText,
  Clock,
  X,
  Plus,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  AssetChecklistItem,
} from '@/lib/types';
import {
  CONTENT_RECOMMENDATION_CONFIGS,
  generateContentRecommendation,
  type ContentRecommendationResult,
  type RecommendationTone,
  type RecommendationLength,
  type MissingSourceInput,
} from '@/lib/contentRecommendationService';
import { generateContentRecommendationAction } from '@/app/schoolProjectActions';
import ModalPortal from '@/components/ui/ModalPortal';

export interface ContentRecommendationAssistantProps {
  item: AssetChecklistItem;
  intakeData: UniversalIntakeData;
  onUpdate: (updates: Partial<AssetChecklistItem>) => void;
  token?: string;
  isNotApplicable?: boolean;
  onNavigateToSection?: (sectionKey: string) => void;
}

export default function ContentRecommendationAssistant({
  item,
  intakeData,
  onUpdate,
  token,
  isNotApplicable = false,
  onNavigateToSection,
}: ContentRecommendationAssistantProps) {
  const config = CONTENT_RECOMMENDATION_CONFIGS[item.id];

  // 1. Local Draft and Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftResult, setDraftResult] = useState<ContentRecommendationResult | null>(() => {
    if (item.recommendedDraft) {
      return {
        fieldKey: item.id,
        generatedText: item.recommendedDraft,
        sourceFields: [],
        sourceLabels: item.recommendationSources || config?.requiredSources || ['School Profile'],
        confidence: 'high',
        requiresReview: Boolean(item.requiresReview),
        isTemplate: item.contentSource === 'template' || config?.generationType === 'template',
        sourceFingerprint: item.sourceFingerprint || '',
      };
    }
    return null;
  });

  const [selectedTone, setSelectedTone] = useState<RecommendationTone>(
    (item.recommendedTone as RecommendationTone) || 'Professional'
  );
  const [selectedLength, setSelectedLength] = useState<RecommendationLength>(
    item.recommendedLength || config?.defaultLength || 'standard'
  );
  const [variationSeed, setVariationSeed] = useState(0);
  const [isEditingText, setIsEditingText] = useState(false);
  const [localEditText, setLocalEditText] = useState(item.textContent || '');
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. State Classifications
  const hasExistingAuthoritativeText = Boolean(
    item.textContent &&
      item.textContent.trim().length > 0 &&
      item.sourceSection &&
      item.sourceSection !== 'Recommended Content' &&
      !item.sourceSection.includes('Recommended Content') &&
      item.contentSource !== 'ai_recommended' &&
      item.contentSource !== 'ai_recommended_edited'
  );

  const isAcceptedRecommended = Boolean(
    item.textContent &&
      item.textContent.trim().length > 0 &&
      (item.contentSource === 'ai_recommended' ||
        item.contentSource === 'ai_recommended_edited' ||
        item.sourceSection === 'Recommended Content' ||
        item.sourceSection?.includes('Recommended Content'))
  );

  const isTemplateItem = config?.generationType === 'template' || item.contentSource === 'template';

  // 3. Execution of Recommendation Generation
  const handleGenerate = useCallback(
    async (overrideTone?: RecommendationTone, overrideLength?: RecommendationLength, isRegen = false) => {
      if (isNotApplicable) return;
      setIsGenerating(true);
      setErrorMessage(null);

      const toneToUse = overrideTone || selectedTone;
      const lengthToUse = overrideLength || selectedLength;
      const newSeed = isRegen ? variationSeed + 1 : variationSeed;
      if (isRegen) setVariationSeed(newSeed);

      try {
        let result: ContentRecommendationResult;

        if (token) {
          result = await generateContentRecommendationAction(token, {
            fieldKey: item.id,
            intakeData,
            tone: toneToUse,
            length: lengthToUse,
            variationSeed: newSeed,
          });
        } else {
          // Client-side execution fallback
          result = generateContentRecommendation({
            fieldKey: item.id,
            intakeData,
            tone: toneToUse,
            length: lengthToUse,
            variationSeed: newSeed,
          });
        }

        if (result.warnings && result.warnings.length > 0 && !result.generatedText && !result.isInsufficientData) {
          setErrorMessage(result.warnings[0]);
        } else {
          setDraftResult(result);
          // Retain draft in state if not yet accepted
          if (!item.textContent) {
            onUpdate({
              recommendedDraft: result.generatedText,
              sourceFingerprint: result.sourceFingerprint,
              recommendedTone: toneToUse,
              recommendedLength: lengthToUse,
              recommendationSources: result.sourceLabels,
              isOutdated: false,
              requiresReview: result.requiresReview,
              status: 'recommended_available',
            });
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to prepare recommended content.');
      } finally {
        setIsGenerating(false);
      }
    },
    [item.id, item.textContent, intakeData, onUpdate, token, isNotApplicable, selectedTone, selectedLength, variationSeed]
  );

  // 4. Accept Generated Content
  const handleUseText = useCallback(
    (textToUse?: string) => {
      const text = textToUse || draftResult?.generatedText || '';
      if (!text.trim()) return;

      const isTemplate = draftResult?.isTemplate || isTemplateItem;
      const sourceLabel = isTemplate ? 'Standard Template' : 'Recommended Content';

      onUpdate({
        textContent: text,
        status: 'provided',
        sourceSection: sourceLabel,
        contentSource: isTemplate ? 'template' : 'ai_recommended',
        recommendedDraft: text,
        sourceFingerprint: draftResult?.sourceFingerprint || item.sourceFingerprint,
        isOutdated: false,
        requiresReview: Boolean(draftResult?.requiresReview || isTemplate),
        recommendationSources: draftResult?.sourceLabels || config?.requiredSources,
      });

      setShowComparisonModal(false);
    },
    [draftResult, isTemplateItem, item.sourceFingerprint, onUpdate, config?.requiredSources]
  );

  // 5. Save Edited Text
  const handleSaveEditedText = useCallback(() => {
    const trimmed = localEditText.trim();
    if (trimmed.length === 0) {
      onUpdate({
        textContent: '',
        status: 'not_provided',
      });
    } else {
      const isAiDerived =
        item.contentSource === 'ai_recommended' ||
        item.contentSource === 'ai_recommended_edited' ||
        draftResult?.generatedText;
      const sourceLabel = isAiDerived
        ? 'Recommended Content • Edited by School'
        : item.sourceSection || 'School Provided';

      onUpdate({
        textContent: trimmed,
        status: 'provided',
        sourceSection: sourceLabel,
        contentSource: isAiDerived ? 'ai_recommended_edited' : 'school_provided',
      });
    }
    setIsEditingText(false);
  }, [localEditText, item.contentSource, item.sourceSection, draftResult, onUpdate]);

  // 6. Direct Value Suggestions Handler (for Core Values)
  const handleAddValue = useCallback(
    (val: string) => {
      const currentValues = (item.textContent || '')
        .split(/[,;]\s*/)
        .map((v) => v.trim())
        .filter(Boolean);

      if (!currentValues.includes(val)) {
        const nextList = [...currentValues, val];
        const nextStr = nextList.join(', ');
        onUpdate({
          textContent: nextStr,
          status: 'provided',
          sourceSection: 'Recommended Content',
          contentSource: 'ai_recommended',
        });
      }
    },
    [item.textContent, onUpdate]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER MODES
  // ────────────────────────────────────────────────────────────────────────────

  // A. Manual Text Editing Mode (when user clicks "Edit" or "Write Myself")
  if (isEditingText) {
    return (
      <div className="w-full space-y-2.5 bg-white border border-[#CBD5E1] rounded-2xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-4 h-4 text-[#4338CA]" />
            <span className="text-xs font-bold text-[#131B2E]">
              {item.textContent ? `Edit ${item.title}` : `Write Content Manually`}
            </span>
          </div>
          {draftResult?.generatedText && (
            <button
              type="button"
              onClick={() => setLocalEditText(draftResult.generatedText)}
              className="text-[11px] font-semibold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> Insert Recommendation
            </button>
          )}
        </div>

        <textarea
          rows={Math.max(4, Math.min(10, Math.ceil(localEditText.length / 80)))}
          value={localEditText}
          onChange={(e) => setLocalEditText(e.target.value)}
          placeholder={`Enter official ${item.title.toLowerCase()} for the website...`}
          disabled={isNotApplicable}
          className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#94A3B8] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 focus:outline-hidden transition leading-relaxed"
          aria-label={`Enter text for ${item.title}`}
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-[#64748B]">
            {localEditText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalEditText(item.textContent || '');
                setIsEditingText(false);
              }}
              className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#131B2E] font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEditedText}
              className="px-4 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer active:scale-[0.98]"
            >
              Save Text
            </button>
          </div>
        </div>
      </div>
    );
  }

  // B. Authoritative Content Already Available (synced from earlier section)
  if (hasExistingAuthoritativeText) {
    return (
      <div className="w-full space-y-2.5">
        <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 text-xs space-y-2.5 max-w-xl">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-[#131B2E]">Already Available</span>
              <span className="text-[10px] text-[#64748B]">
                • Sourced from <strong>{item.sourceSection}</strong>
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Authoritative
            </span>
          </div>

          <p className="text-[#131B2E] whitespace-pre-wrap leading-relaxed">
            {item.textContent}
          </p>

          <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-[#E2E8F0]">
            <span className="text-[10px] text-[#64748B]">
              {item.textContent?.trim().split(/\s+/).filter(Boolean).length} words
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalEditText(item.textContent || '');
                  setIsEditingText(true);
                }}
                className="px-2.5 py-1 text-xs text-[#4338CA] hover:bg-[#EEF2FF] font-semibold rounded-lg transition cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!draftResult) {
                    handleGenerate();
                  }
                  setShowComparisonModal(true);
                }}
                disabled={isGenerating}
                className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-[#4338CA] border border-[#C7D2FE] text-xs font-bold rounded-lg shadow-2xs transition cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-3 h-3 text-[#4338CA]" />
                <span>Improve with Recommended Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Side-by-Side Comparison Modal */}
        {showComparisonModal && (
          <ModalPortal isOpen={showComparisonModal}>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-[#CBD5E1] rounded-3xl shadow-2xl max-w-3xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#4338CA]" />
                  <div>
                    <h4 className="font-extrabold text-base text-[#131B2E]">
                      Compare Content — {item.title}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Choose whether to keep your existing content or adopt the recommended website version.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowComparisonModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Version */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Current Version
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {item.sourceSection}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {item.textContent}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowComparisonModal(false)}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Keep Current Version
                  </button>
                </div>

                {/* Recommended Version */}
                <div className="bg-indigo-50/70 border-2 border-indigo-200 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#4338CA] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Recommended Version
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded">
                        AI Recommended
                      </span>
                    </div>

                    {isGenerating ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-2 text-indigo-700">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Synthesizing school facts...</span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {draftResult?.generatedText || 'Click regenerate to preview.'}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseText(draftResult?.generatedText)}
                    disabled={isGenerating || !draftResult?.generatedText}
                    className="w-full py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    Use Recommended Version
                  </button>
                </div>
              </div>
            </div>
          </div>
          </ModalPortal>
        )}
      </div>
    );
  }

  // C. Provided State (Accepted from Recommendation or Edited)
  if (item.textContent && item.textContent.trim().length > 0) {
    return (
      <div className="w-full space-y-2 max-w-xl">
        {/* Outdated Warning Banner */}
        {item.isOutdated && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Your school information has changed since this recommendation was prepared.
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleGenerate(undefined, undefined, true)}
              disabled={isGenerating}
              className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 shrink-0 cursor-pointer ml-2"
            >
              Regenerate
            </button>
          </div>
        )}

        {/* Policy Review Reminder */}
        {isTemplateItem && item.requiresReview && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-[11px] text-amber-900">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Standard Template:</strong> Please review and approve this draft to ensure it aligns with your governing committee policies before launch.
            </span>
          </div>
        )}

        <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-3.5 text-xs space-y-2">
          <p className="text-[#131B2E] whitespace-pre-wrap leading-relaxed">
            {item.textContent}
          </p>

          <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-[#E2E8F0]">
            <div className="flex items-center space-x-2 text-[10px] text-[#64748B]">
              <span>{item.textContent.trim().split(/\s+/).filter(Boolean).length} words</span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                {item.sourceSection || 'Provided'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalEditText(item.textContent || '');
                  setIsEditingText(true);
                }}
                className="text-[11px] font-semibold text-[#4338CA] hover:underline cursor-pointer"
              >
                Edit Text
              </button>
              <button
                type="button"
                onClick={() => handleGenerate(undefined, undefined, true)}
                disabled={isGenerating}
                className="text-[11px] font-semibold text-[#64748B] hover:text-[#131B2E] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // D. Insufficient Information State (Missing required facts)
  if (draftResult?.isInsufficientData && draftResult.missingInputs && draftResult.missingInputs.length > 0) {
    return (
      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-3 max-w-xl">
        <div className="flex items-start space-x-2 text-slate-800">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#131B2E] block">Not enough information yet</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              To prepare professional website text without guessing, we need a few more details:
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1.5">
          {draftResult.missingInputs.map((missing, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                {missing.label}
              </span>
              {onNavigateToSection && (
                <button
                  type="button"
                  onClick={() => onNavigateToSection(missing.sectionKey)}
                  className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Go to {missing.sectionLabel}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setLocalEditText('');
              setIsEditingText(true);
            }}
            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            Write Myself
          </button>
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  // E. Draft Generated State (Ready to Review & Accept)
  if (draftResult?.generatedText) {
    return (
      <div className="w-full bg-gradient-to-b from-indigo-50/80 via-white to-white border-2 border-indigo-200 rounded-2xl p-4 text-xs space-y-3 max-w-xl shadow-xs animate-in fade-in duration-200">
        {/* Header Badge & Policy Warning */}
        <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs">
              <Sparkles className="w-3 h-3" />
              <span>{isTemplateItem ? 'Standard Template' : 'Recommended Draft'}</span>
            </span>
            {draftResult.confidence && (
              <span className="text-[10px] font-semibold text-indigo-800">
                {draftResult.confidence === 'high' ? '• High confidence' : '• Standard preview'}
              </span>
            )}
          </div>

          {/* Tone & Length Segmented Selectors */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedTone}
              onChange={(e) => {
                const newTone = e.target.value as RecommendationTone;
                setSelectedTone(newTone);
                handleGenerate(newTone, selectedLength, true);
              }}
              disabled={isGenerating}
              className="text-[10px] font-bold px-2 py-1 bg-white border border-indigo-200 text-indigo-950 rounded-lg shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              title="Select communication tone"
            >
              <option value="Professional">Tone: Professional</option>
              <option value="Warm & Parent-Friendly">Tone: Warm & Friendly</option>
              <option value="Premium / Modern">Tone: Modern</option>
              <option value="Concise">Tone: Concise</option>
            </select>

            <select
              value={selectedLength}
              onChange={(e) => {
                const newLen = e.target.value as RecommendationLength;
                setSelectedLength(newLen);
                handleGenerate(selectedTone, newLen, true);
              }}
              disabled={isGenerating}
              className="text-[10px] font-bold px-2 py-1 bg-white border border-indigo-200 text-indigo-950 rounded-lg shadow-2xs focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              title="Select content length"
            >
              <option value="short">Short</option>
              <option value="standard">Standard</option>
              <option value="detailed">Detailed</option>
            </select>
          </div>
        </div>

        {/* Policy Warning Banner if template */}
        {isTemplateItem && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">⚠️ Template for review</span>
              <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">
                This is a standard draft intended to help prepare your website content. The school must review and approve it before publication.
              </p>
            </div>
          </div>
        )}

        {/* Generated Text Content */}
        <div className="bg-white border border-indigo-100 rounded-xl p-3.5 space-y-2">
          {isGenerating ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-indigo-700">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-xs font-semibold">Preparing recommended content...</span>
            </div>
          ) : (
            <p className="text-[#131B2E] text-xs leading-relaxed whitespace-pre-wrap">
              {draftResult.generatedText}
            </p>
          )}
        </div>

        {/* Core Values Clickable Chips (Special Experience for acad-values) */}
        {item.id === 'acad-values' && draftResult.suggestedValues && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider">
              Selectable Core Values:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {draftResult.suggestedValues.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddValue(val)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white border border-indigo-200 text-indigo-800 hover:bg-indigo-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{val}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Source Facts Attribution */}
        {draftResult.sourceLabels && draftResult.sourceLabels.length > 0 && (
          <div className="space-y-1 text-[11px] text-indigo-950/80">
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center gap-1">
                <strong>Based on:</strong> {draftResult.sourceLabels.join(' • ')}
              </span>
              <button
                type="button"
                onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                className="text-[10px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
              >
                <span>{isSourcesExpanded ? 'Hide' : 'View sources'}</span>
                {isSourcesExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {isSourcesExpanded && (
              <div className="mt-1 p-2 bg-white/80 rounded-lg border border-indigo-100 text-[10px] text-slate-600 space-y-1 animate-in fade-in duration-150">
                <div>
                  • <strong>School Identity:</strong> {intakeData.schoolProfile?.schoolName} ({intakeData.schoolProfile?.board || 'Board'} in {intakeData.schoolProfile?.city || 'Location'})
                </div>
                {item.id === 'acad-facilities-desc' && (
                  <div>
                    • <strong>Verified Facilities:</strong> {intakeData.facilitiesConfig ? 'Active classroom, safety, and amenity data analyzed' : 'Baseline intake records'}
                  </div>
                )}
                <div>
                  • <strong>Brand Tone:</strong> {intakeData.brandingDesign?.brandTone || 'Modern & Progressive'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-indigo-100">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleGenerate(undefined, undefined, true)}
              disabled={isGenerating}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span>Regenerate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalEditText(draftResult.generatedText);
                setIsEditingText(true);
              }}
              className="px-2.5 py-1.5 text-xs text-[#4338CA] hover:bg-indigo-50 font-semibold rounded-xl transition cursor-pointer"
            >
              Edit Before Use
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleUseText()}
            disabled={isGenerating}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isTemplateItem ? 'Use Template' : 'Use This Text'}</span>
          </button>
        </div>
      </div>
    );
  }

  // F. Empty State: Standard Assistant Banner
  return (
    <div className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl p-4 text-xs space-y-3 max-w-xl">
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5">
            <span className="inline-flex items-center space-x-1 text-[10px] font-extrabold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              <span>{isTemplateItem ? 'Recommended Template' : 'Recommended Assistant'}</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {isTemplateItem
              ? 'We can prepare a standard institutional policy template tailored to your school for committee review.'
              : config?.helperDescription || 'We can prepare professional website content using the information you have already provided.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between pt-1 gap-2 border-t border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLocalEditText('');
              setIsEditingText(true);
            }}
            className="px-2.5 py-1 text-xs text-[#64748B] hover:text-[#131B2E] font-medium transition cursor-pointer"
          >
            Write Myself
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleGenerate()}
          disabled={isGenerating || isNotApplicable}
          className={`inline-flex items-center space-x-1.5 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer active:scale-[0.98] ${
            isNotApplicable ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Preparing content...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTemplateItem ? 'Generate Policy Template' : '✨ Generate Recommended Text'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
