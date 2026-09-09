'use client';

import React, { useEffect } from 'react';
import { OTHER_OPTION } from '@/lib/geography';

export interface AddressDropdownWithOtherProps {
  id: string;
  label: string;
  required?: boolean;
  selectedValue: string;
  customValue: string;
  options: string[]; // standard options
  otherOptionLabel?: string;
  customInputLabel: string;
  placeholder: string;
  helperText?: string;
  disabled?: boolean;
  selectAriaLabel?: string;
  customAriaLabel?: string;
  onSelectChange: (newValue: string) => void;
  onCustomChange: (newValue: string) => void;
}

/**
 * Reusable accessible institutional address dropdown with "Standard List + Other" pattern.
 * When "Other" is chosen, presents a manual text input.
 * When switching from "Other" to a standard option, hides the custom input and resets the custom value.
 * If no standard options exist for the region, intentionally selects "Other" and presents the custom input.
 */
export default function AddressDropdownWithOther({
  id,
  label,
  required = false,
  selectedValue,
  customValue,
  options,
  otherOptionLabel = OTHER_OPTION,
  customInputLabel,
  placeholder,
  helperText = 'Not listed? Enter the official name manually.',
  disabled = false,
  selectAriaLabel,
  customAriaLabel,
  onSelectChange,
  onCustomChange,
}: AddressDropdownWithOtherProps) {
  // Filter out any duplicate 'Other' or 'Other Country' in standard options and sort alphabetically
  const standardOptions = options
    .filter(
      (opt) => opt.toLowerCase() !== 'other' && opt.toLowerCase() !== 'other country'
    )
    .slice()
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  const hasNoStandardOptions = standardOptions.length === 0;
  const isOther = selectedValue === OTHER_OPTION || hasNoStandardOptions;

  const onSelectChangeRef = React.useRef(onSelectChange);
  onSelectChangeRef.current = onSelectChange;

  // If no standard dataset exists for this region, intentionally default to "Other"
  useEffect(() => {
    if (hasNoStandardOptions && selectedValue !== OTHER_OPTION) {
      onSelectChangeRef.current(OTHER_OPTION);
    }
  }, [hasNoStandardOptions, selectedValue]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextVal = e.target.value;
    onSelectChange(nextVal);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomChange(e.target.value);
  };

  const selectId = `${id}-select`;
  const customId = `${id}-custom`;
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;

  const isCustomInputInvalid = isOther && required && (!customValue || !customValue.trim());

  return (
    <div className="space-y-2 min-w-0 w-full">
      {/* Primary Dropdown */}
      <div className="min-w-0 w-full">
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={selectId}
            className="block font-medium text-[#64748B] text-xs sm:text-xs"
          >
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
        </div>

        <select
          id={selectId}
          value={isOther ? OTHER_OPTION : selectedValue}
          onChange={handleSelectChange}
          disabled={disabled || (hasNoStandardOptions && isOther)}
          required={required}
          aria-required={required}
          aria-label={selectAriaLabel || label}
          aria-describedby={helperText ? helperId : undefined}
          className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs font-medium text-xs disabled:opacity-75 disabled:bg-slate-50 disabled:cursor-not-allowed"
        >
          {standardOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          <option value={OTHER_OPTION}>{otherOptionLabel}</option>
        </select>

        {hasNoStandardOptions ? (
          <p id={helperId} className="text-[11px] text-[#64748B] mt-1 leading-normal font-medium">
            Standard {label.toLowerCase()}s for this region are entered manually below.
          </p>
        ) : (
          helperText && !isOther && (
            <p id={helperId} className="text-[11px] text-[#94A3B8] mt-1 leading-normal">
              {helperText}
            </p>
          )
        )}
      </div>

      {/* Manual Custom Input shown when Other is selected */}
      {isOther && (
        <div className="pt-0.5 space-y-1 animate-in fade-in duration-150 min-w-0 w-full">
          <label
            htmlFor={customId}
            className="block font-medium text-[#4338CA] text-xs"
          >
            {customInputLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            id={customId}
            type="text"
            value={customValue}
            onChange={handleCustomChange}
            disabled={disabled}
            placeholder={placeholder}
            required
            aria-required="true"
            aria-invalid={isCustomInputInvalid}
            aria-describedby={isCustomInputInvalid ? errorId : undefined}
            aria-label={customAriaLabel || customInputLabel}
            className={`w-full px-3 py-2 rounded-xl bg-white border text-[#131B2E] placeholder:text-[#94A3B8] text-xs focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs ${
              isCustomInputInvalid
                ? 'border-rose-300 hover:border-rose-400 focus:border-rose-500'
                : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#4338CA]'
            }`}
          />
          {isCustomInputInvalid && (
            <p id={errorId} className="text-[11px] text-rose-600 font-medium" role="alert">
              This custom location value is required while Other is selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
