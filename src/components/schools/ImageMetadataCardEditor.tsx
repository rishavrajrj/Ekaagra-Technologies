'use client';

import React, { useState } from 'react';
import { ChevronDown, Star, AlertCircle } from 'lucide-react';
import {
  CAMPUS_IMAGE_TYPES,
  type ImageTypeOption,
} from '@/lib/schoolIntake';

export interface ImageMetadataCardEditorProps {
  /** Unique ID of the image for accessible form controls */
  imageId: string;
  /** Currently assigned image type */
  imageType?: string;
  /** User-specified custom string when imageType === 'other' */
  customImageType?: string | null;
  /** Whether this image is the designated primary/featured image */
  isPrimary?: boolean;
  /** Optional descriptive caption */
  caption?: string;
  /** Predefined options list (defaults to CAMPUS_IMAGE_TYPES) */
  options?: readonly ImageTypeOption[];
  /** Callback fired whenever any metadata field changes */
  onUpdateMetadata: (patch: {
    imageType?: string;
    customImageType?: string | null;
    isPrimary?: boolean;
    caption?: string;
  }) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Toggle whether primary/featured control is enabled */
  allowPrimary?: boolean;
  /** Toggle whether caption input is enabled */
  allowCaption?: boolean;
  /** Optional custom label for Image Type */
  typeLabel?: string;
  /** Optional placeholder for 'Other' input */
  otherPlaceholder?: string;
}

/**
 * Reusable Per-Image Metadata Editor
 *
 * Implements per-image classification, custom "Other" type specification,
 * single-primary designation, and optional captions. Can be reused across
 * any onboarding section with configurable type options.
 */
export default function ImageMetadataCardEditor({
  imageId,
  imageType = '',
  customImageType = '',
  isPrimary = false,
  caption = '',
  options = CAMPUS_IMAGE_TYPES,
  onUpdateMetadata,
  disabled = false,
  allowPrimary = true,
  allowCaption = true,
  typeLabel = 'Image Type',
  otherPlaceholder = 'e.g. Robotics Lab, Music Room, Smart Classroom',
}: ImageMetadataCardEditorProps) {
  const [touched, setTouched] = useState(false);

  const selectId = `${imageId}-image-type`;
  const otherInputId = `${imageId}-custom-type`;
  const primaryId = `${imageId}-primary`;
  const captionId = `${imageId}-caption`;
  const errorId = `${imageId}-type-error`;

  const isOther = imageType.toLowerCase() === 'other';
  const isTypeMissing = touched && !imageType.trim();
  const isOtherEmpty = isOther && (!customImageType || !customImageType.trim()) && touched;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTouched(true);
    const val = e.target.value;
    if (val.toLowerCase() === 'other') {
      onUpdateMetadata({
        imageType: 'other',
        customImageType: customImageType || '',
      });
    } else {
      onUpdateMetadata({
        imageType: val,
        customImageType: null,
      });
    }
  };

  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTouched(true);
    onUpdateMetadata({
      imageType: 'other',
      customImageType: e.target.value,
    });
  };

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateMetadata({ isPrimary: e.target.checked });
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateMetadata({ caption: e.target.value });
  };

  return (
    <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0] text-xs">
      {/* 1. Image Type Dropdown */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor={selectId}
            className="block font-medium text-[#475569] text-[11px]"
          >
            {typeLabel} <span className="text-rose-500">*</span>
          </label>
          {!imageType && (
            <span className="text-[10px] text-amber-600 font-medium">
              Required
            </span>
          )}
        </div>

        <div className="relative">
          <select
            id={selectId}
            value={imageType}
            onChange={handleTypeChange}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            aria-required="true"
            aria-invalid={isTypeMissing}
            aria-describedby={isTypeMissing ? errorId : undefined}
            className={`w-full appearance-none px-2.5 py-1.5 pr-8 rounded-lg bg-white border text-xs font-medium transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/10 disabled:opacity-50 disabled:cursor-not-allowed ${
              !imageType
                ? 'text-[#94A3B8] border-amber-300 hover:border-amber-400 focus:border-[#4338CA]'
                : isTypeMissing
                ? 'border-rose-300 text-[#131B2E] focus:border-rose-500'
                : 'border-[#E2E8F0] text-[#131B2E] hover:border-[#CBD5E1] focus:border-[#4338CA]'
            }`}
          >
            <option value="" disabled>
              Select image type...
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#64748B] pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>

        {isTypeMissing && (
          <p id={errorId} className="text-[10px] text-rose-600 font-medium mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Please select an image type.</span>
          </p>
        )}
      </div>

      {/* 2. Conditional "Other" Specification Input */}
      {isOther && (
        <div className="space-y-1 animate-in fade-in duration-150">
          <label
            htmlFor={otherInputId}
            className="block font-medium text-[#4338CA] text-[11px]"
          >
            Specify Image Type <span className="text-rose-500">*</span>
          </label>
          <input
            id={otherInputId}
            type="text"
            value={customImageType || ''}
            onChange={handleCustomTypeChange}
            onBlur={() => setTouched(true)}
            disabled={disabled}
            placeholder={otherPlaceholder}
            required
            aria-required="true"
            aria-invalid={isOtherEmpty}
            className={`w-full px-2.5 py-1.5 rounded-lg bg-white border text-xs text-[#131B2E] placeholder:text-[#94A3B8] transition shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#4338CA]/10 ${
              isOtherEmpty
                ? 'border-rose-300 hover:border-rose-400 focus:border-rose-500'
                : 'border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#4338CA]'
            }`}
          />
          {isOtherEmpty && (
            <p className="text-[10px] text-rose-600 font-medium">
              Please specify the custom image type.
            </p>
          )}
        </div>
      )}

      {/* 3. Optional Image Caption */}
      {allowCaption && (
        <div>
          <label
            htmlFor={captionId}
            className="block font-medium text-[#64748B] text-[11px] mb-1"
          >
            Caption (optional)
          </label>
          <input
            id={captionId}
            type="text"
            value={caption || ''}
            onChange={handleCaptionChange}
            disabled={disabled}
            placeholder="Describe this image briefly"
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
          />
        </div>
      )}

      {/* 4. Primary / Featured Image Toggle */}
      {allowPrimary && (
        <div className="pt-0.5">
          <label
            htmlFor={primaryId}
            className={`flex items-center space-x-2 text-[11px] font-medium p-1.5 rounded-lg border transition cursor-pointer select-none ${
              isPrimary
                ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-2xs'
                : 'bg-[#FAF7F2] border-transparent hover:border-[#E2E8F0] text-[#475569]'
            }`}
          >
            <input
              id={primaryId}
              type="checkbox"
              checked={Boolean(isPrimary)}
              onChange={handlePrimaryChange}
              disabled={disabled}
              aria-label="Primary / Featured Image"
              className="w-3.5 h-3.5 rounded text-[#4338CA] focus:ring-[#4338CA]/20 border-slate-300 cursor-pointer shrink-0"
            />
            <span className="flex items-center space-x-1 min-w-0">
              {isPrimary && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
              <span className="truncate">Primary / Featured Image</span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
