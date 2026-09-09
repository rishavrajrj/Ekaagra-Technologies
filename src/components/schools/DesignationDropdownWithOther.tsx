'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DESIGNATION_OTHER,
  isPredefinedDesignation,
  resolveDesignationDisplay,
} from '@/lib/schoolIntake';

export interface DesignationDropdownWithOtherProps {
  id: string;
  label?: string;
  required?: boolean;
  value: string;
  options: readonly string[];
  placeholder?: string;
  helperText?: string;
  otherInputLabel?: string;
  otherPlaceholder?: string;
  otherHelperText?: string;
  disabled?: boolean;
  cachedCustomValue?: string;
  onCustomValueCache?: (val: string) => void;
  onChange: (resolvedValue: string) => void;
}

/**
 * Standardized Official Designation Dropdown with conditional 'Other' option.
 *
 * - Provides predefined institutional titles.
 * - Selecting 'Other' reveals a required custom designation input directly below.
 * - Stores user's custom designation directly in the canonical designation field (never literal 'Other').
 * - Preserves custom text when toggling between predefined titles and Other.
 * - Accessible native select with custom chevron, focus ring, and keyboard navigation.
 */
export default function DesignationDropdownWithOther({
  id,
  label = 'Official Designation',
  required = false,
  value,
  options,
  placeholder = 'Select designation ▼',
  helperText,
  otherInputLabel = 'Other Designation',
  otherPlaceholder = 'Enter official designation',
  otherHelperText = 'Enter the official designation used by your institution.',
  disabled = false,
  cachedCustomValue = '',
  onCustomValueCache,
  onChange,
}: DesignationDropdownWithOtherProps) {
  // Determine if the current canonical value matches one of the predefined options
  const isPredefined = isPredefinedDesignation(value, options);

  // Local state tracking whether the dropdown is currently set to 'Other'
  const [isOtherMode, setIsOtherMode] = useState<boolean>(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) return false;
    return !isPredefined;
  });

  // Local state tracking the custom input text
  const [customText, setCustomText] = useState<string>(() => {
    if (isPredefined) {
      return cachedCustomValue || '';
    }
    const display = resolveDesignationDisplay(value);
    return display || cachedCustomValue || '';
  });

  // Track whether the user has interacted with the custom field or chosen Other
  const [isTouched, setIsTouched] = useState<boolean>(false);

  // Sync internal state when canonical value changes from outside (e.g. section navigation or load)
  useEffect(() => {
    const currentIsPredefined = isPredefinedDesignation(value, options);
    if (currentIsPredefined) {
      setIsOtherMode(false);
    } else if (value && value.trim().length > 0) {
      setIsOtherMode(true);
      const display = resolveDesignationDisplay(value);
      if (display) {
        setCustomText(display);
      }
    }
  }, [value, options]);

  // Handle Dropdown Change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setIsTouched(true);

    if (selected === DESIGNATION_OTHER) {
      setIsOtherMode(true);
      // Restore from customText if available
      const trimmedCustom = customText.trim();
      // Propagate custom value or empty string (never 'Other')
      onChange(trimmedCustom);
    } else {
      setIsOtherMode(false);
      onChange(selected);
    }
  };

  // Handle Custom Input Change
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setCustomText(nextVal);
    setIsTouched(true);
    if (onCustomValueCache) {
      onCustomValueCache(nextVal);
    }
    // Propagate typed value (or empty string if only whitespace)
    onChange(nextVal.trim().length > 0 ? nextVal : '');
  };

  const handleCustomBlur = () => {
    setIsTouched(true);
    const trimmed = customText.trim();
    setCustomText(trimmed);
    if (onCustomValueCache) {
      onCustomValueCache(trimmed);
    }
    onChange(trimmed);
  };

  // Predefined options excluding 'Other', sorted alphabetically
  const standardOptions = options
    .filter((opt) => opt.toLowerCase() !== DESIGNATION_OTHER.toLowerCase())
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Determine current dropdown value
  const selectValue = isOtherMode
    ? DESIGNATION_OTHER
    : isPredefined
    ? value
    : '';

  // Validation state: when Other is active, custom designation cannot be empty or whitespace-only
  const isCustomEmpty = customText.trim().length === 0;
  const isError = isOtherMode && isCustomEmpty && (isTouched || required);

  const selectId = `${id}-select`;
  const customId = `${id}-custom`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      {/* Primary Designation Dropdown */}
      <div>
        <label
          htmlFor={selectId}
          className="block font-medium text-[#64748B] mb-1 text-xs"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        <div className="relative">
          <select
            id={selectId}
            value={selectValue}
            onChange={handleSelectChange}
            disabled={disabled}
            required={required}
            aria-required={required}
            aria-label={label}
            aria-describedby={helperText ? helperId : undefined}
            className={`w-full appearance-none px-3 py-2 pr-9 rounded-xl bg-white border text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
              !selectValue ? 'text-[#94A3B8]' : 'text-[#131B2E]'
            } border-[#E2E8F0]`}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {standardOptions.map((opt) => (
              <option key={opt} value={opt} className="text-[#131B2E]">
                {opt}
              </option>
            ))}
            <option value={DESIGNATION_OTHER} className="text-[#131B2E]">
              {DESIGNATION_OTHER}
            </option>
          </select>
          <ChevronDown className="w-4 h-4 text-[#64748B] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>

        {helperText && !isOtherMode && (
          <p id={helperId} className="text-[11px] text-[#94A3B8] mt-1 leading-normal">
            {helperText}
          </p>
        )}
      </div>

      {/* Conditional Custom Designation Input (revealed immediately when 'Other' is chosen) */}
      {isOtherMode && (
        <div className="pt-1 space-y-1 animate-in fade-in duration-150">
          <label
            htmlFor={customId}
            className="block font-medium text-[#4338CA] text-xs"
          >
            {otherInputLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            id={customId}
            type="text"
            value={customText}
            onChange={handleCustomChange}
            onBlur={handleCustomBlur}
            disabled={disabled}
            placeholder={otherPlaceholder}
            required
            aria-required="true"
            aria-invalid={isError}
            aria-describedby={isError ? errorId : undefined}
            aria-label={otherInputLabel}
            className={`w-full px-3 py-2 rounded-xl bg-white border text-[#131B2E] placeholder:text-[#94A3B8] text-xs focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs ${
              isError
                ? 'border-rose-300 hover:border-rose-400 focus:border-rose-500'
                : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#4338CA]'
            }`}
          />
          <p className="text-[11px] text-[#64748B] leading-normal">
            {otherHelperText}
          </p>
          {isError && (
            <p id={errorId} className="text-[11px] text-rose-600 font-medium">
              Please enter the official designation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
