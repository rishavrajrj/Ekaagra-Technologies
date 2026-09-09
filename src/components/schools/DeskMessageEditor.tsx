'use client';

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Sparkles, RefreshCw, AlertCircle, CheckCircle2, Loader2, Edit3, X } from 'lucide-react';
import {
  resolveEffectiveDesignation,
  buildDeskMessageHeading,
  type SchoolContext,
} from '@/lib/schoolDeskMessageGenerator';
import { generateDeskMessageAction } from '@/app/schoolProjectActions';

export interface DeskMessageEditorProps {
  id?: string;
  personId?: string;
  personName?: string;
  officialDesignation?: string;
  otherDesignation?: string;
  academicQualifications?: string;
  isPrincipal?: boolean;
  value: string;
  messageSource?: 'generated' | 'user';
  onChange: (value: string, source: 'generated' | 'user') => void;
  token: string;
  schoolContext?: SchoolContext;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export default function DeskMessageEditor({
  id,
  personId,
  personName = '',
  officialDesignation = '',
  otherDesignation = '',
  academicQualifications = '',
  isPrincipal = false,
  value = '',
  messageSource = 'generated',
  onChange,
  token,
  schoolContext,
  required = false,
  disabled = false,
  rows = 4,
}: DeskMessageEditorProps) {
  const generatedId = useId();
  const fieldId = id || `desk-msg-${generatedId}`;

  // 1. Normalized Effective Designation
  const effectiveDesig = resolveEffectiveDesignation(officialDesignation, otherDesignation);

  // 2. Local State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);

  // 3. Race Condition & Request Tracking
  const activeRequestIdRef = useRef<string | null>(null);
  const autoGenTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 4. Digest of Profile at Generation Time (to detect when profile has changed)
  const currentProfileDigest = `${effectiveDesig}::${personName.trim()}::${academicQualifications.trim()}`;
  const [lastGeneratedDigest, setLastGeneratedDigest] = useState<string>(() => {
    // If we already have a message on mount, assume it matches the initial profile
    return value.trim().length > 0 ? currentProfileDigest : '';
  });

  // Check if profile changed since message was generated or saved
  const hasProfileChanged =
    value.trim().length > 0 &&
    lastGeneratedDigest.length > 0 &&
    currentProfileDigest !== lastGeneratedDigest;

  // 5. Word Count Calculator
  const words = (value || '').trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 6. Dynamic Label and Placeholder
  const headingLabel = buildDeskMessageHeading(effectiveDesig, isPrincipal, required);
  const placeholderText = effectiveDesig
    ? `Official welcome address or leadership message from the ${effectiveDesig.toLowerCase()} published on the public website...`
    : isPrincipal
    ? 'Official welcome address from the principal published on the public website...'
    : 'Official welcome address or leadership message published on the public website...';

  // 7. Core Generation Execution
  const executeGeneration = useCallback(
    async (isManualRegenerate = false) => {
      // Must have effective designation unless it's principal
      if (!effectiveDesig && !isPrincipal) {
        if (officialDesignation.trim().toLowerCase() === 'other' && !otherDesignation.trim()) {
          setErrorMessage('Please enter the custom official designation first.');
        }
        return;
      }

      const reqId = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      activeRequestIdRef.current = reqId;

      setIsGenerating(true);
      setErrorMessage(null);

      try {
        const result = await generateDeskMessageAction(token, {
          personId,
          fullName: personName,
          officialDesignation,
          otherDesignation,
          academicQualifications,
          isPrincipal,
          schoolContext,
          requestId: reqId,
        });

        // Race condition protection: Ignore if a newer request was dispatched
        if (activeRequestIdRef.current !== reqId) {
          return;
        }

        if (result.success && result.message) {
          onChange(result.message, 'generated');
          setLastGeneratedDigest(currentProfileDigest);
          setErrorMessage(null);
        } else {
          setErrorMessage(result.error || 'Unable to generate the message right now. Your existing message has been preserved.');
        }
      } catch (err: any) {
        if (activeRequestIdRef.current === reqId) {
          setErrorMessage(err.message || 'Unable to generate the message right now. Your existing message has been preserved.');
        }
      } finally {
        if (activeRequestIdRef.current === reqId) {
          setIsGenerating(false);
          setShowConfirmRegenerate(false);
        }
      }
    },
    [
      effectiveDesig,
      isPrincipal,
      officialDesignation,
      otherDesignation,
      token,
      personId,
      personName,
      academicQualifications,
      schoolContext,
      currentProfileDigest,
      onChange,
    ]
  );

  // 8. Auto-Generation Effect (Debounced on initial load or empty field when profile is ready)
  useEffect(() => {
    // Only auto-generate if field is currently blank and not already generating
    if (value.trim().length > 0 || isGenerating) {
      return;
    }

    // Must have a valid effective designation
    if (!effectiveDesig && !isPrincipal) {
      return;
    }

    // Debounce to prevent firing on every keystroke of custom designation / qualification
    if (autoGenTimeoutRef.current) {
      clearTimeout(autoGenTimeoutRef.current);
    }

    autoGenTimeoutRef.current = setTimeout(() => {
      executeGeneration(false);
    }, 700);

    return () => {
      if (autoGenTimeoutRef.current) {
        clearTimeout(autoGenTimeoutRef.current);
      }
    };
  }, [value, effectiveDesig, isPrincipal, executeGeneration, isGenerating]);

  // 9. Handle User Textarea Edits (Transitions source to 'user' to protect against silent overwrite)
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    onChange(nextVal, 'user');
    setErrorMessage(null);
  };

  // 10. Handle Regenerate Click
  const handleRegenerateClick = () => {
    // If message was edited by user, ask confirmation first
    if (messageSource === 'user' && value.trim().length > 0) {
      setShowConfirmRegenerate(true);
    } else {
      executeGeneration(true);
    }
  };

  return (
    <div className="space-y-1.5" role="group" aria-labelledby={`${fieldId}-label`}>
      {/* Header Bar: Dynamic Label + Status Badge + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <label
          id={`${fieldId}-label`}
          htmlFor={fieldId}
          className="block font-medium text-[#64748B] text-xs select-none"
        >
          {headingLabel}
        </label>

        <div className="flex items-center space-x-2 text-[11px]">
          {/* Status Badge */}
          {isGenerating ? (
            <span className="inline-flex items-center space-x-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating message...</span>
            </span>
          ) : messageSource === 'user' && value.trim().length > 0 ? (
            <span className="inline-flex items-center space-x-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200">
              <Edit3 className="w-2.5 h-2.5" />
              <span>Edited by user</span>
            </span>
          ) : messageSource === 'generated' && value.trim().length > 0 ? (
            <span className="inline-flex items-center space-x-1 text-[#4338CA] bg-indigo-50 px-2 py-0.5 rounded-full font-medium border border-indigo-200">
              <Sparkles className="w-2.5 h-2.5 text-[#4338CA]" />
              <span>AI-generated from role &amp; profile</span>
            </span>
          ) : null}

          {/* Regenerate / Generate Button */}
          <button
            type="button"
            onClick={handleRegenerateClick}
            disabled={disabled || isGenerating || (!effectiveDesig && !isPrincipal)}
            aria-label={`Regenerate ${effectiveDesig || 'leadership'} desk message`}
            className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-semibold transition border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Generate or update message using latest profile details"
          >
            <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{value.trim().length > 0 ? 'Regenerate' : 'Generate'}</span>
          </button>
        </div>
      </div>

      {/* Profile Changed Unobtrusive Warning (when user has edited and profile changes) */}
      {hasProfileChanged && messageSource === 'user' && !showConfirmRegenerate && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] animate-in fade-in duration-200">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Profile details changed. Regenerate if you wish to refresh this message based on the updated role.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmRegenerate(true)}
            className="font-bold underline hover:text-amber-950 ml-2 shrink-0 cursor-pointer"
          >
            Regenerate
          </button>
        </div>
      )}

      {/* Confirmation Modal for Overwriting User Edits */}
      {showConfirmRegenerate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${fieldId}-confirm-title`}
          className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl space-y-2 animate-in fade-in duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p id={`${fieldId}-confirm-title`} className="font-bold text-amber-900 text-xs">
                  Replace manually edited message?
                </p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Regenerate this Desk Message using the latest profile information? Your current edited message will be replaced.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmRegenerate(false)}
              className="text-amber-600 hover:text-amber-900 p-0.5 rounded cursor-pointer"
              aria-label="Cancel regeneration"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowConfirmRegenerate(false)}
              className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => executeGeneration(true)}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer transition"
            >
              Yes, Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] animate-in fade-in duration-150">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => executeGeneration(true)}
            className="font-bold underline hover:text-rose-950 ml-2 shrink-0 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Textarea Input */}
      <div className="relative">
        <textarea
          id={fieldId}
          rows={rows}
          value={value}
          onChange={handleTextChange}
          disabled={disabled || isGenerating}
          required={required}
          aria-required={required}
          placeholder={placeholderText}
          className={`w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs text-xs leading-relaxed ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
          }`}
        />
      </div>

      {/* Bottom Footer: Word Count and Target Guidelines */}
      <div className="flex items-center justify-between text-[10px] text-[#94A3B8] px-0.5">
        <span>
          {wordCount > 0 ? (
            <span
              className={
                wordCount >= 120 && wordCount <= 180
                  ? 'text-emerald-600 font-semibold'
                  : wordCount >= 100 && wordCount <= 220
                  ? 'text-slate-600 font-medium'
                  : 'text-amber-600 font-medium'
              }
            >
              {wordCount} words
            </span>
          ) : (
            'No message yet'
          )}
          {' • '}Target: 120–180 words for website leadership page
        </span>
        {wordCount >= 120 && wordCount <= 180 && (
          <span className="hidden sm:inline-flex items-center space-x-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Optimal length</span>
          </span>
        )}
      </div>
    </div>
  );
}
