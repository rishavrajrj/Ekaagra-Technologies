'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  SCHOOL_ACCOMMODATION_OPTIONS,
  normalizeSchoolAccommodationType,
  type SchoolAccommodationType,
  type SchoolAccommodationOption,
} from '@/lib/schoolIntake';

export interface SchoolAccommodationSelectorProps {
  value?: string | null;
  onChange: (value: SchoolAccommodationType) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const SchoolAccommodationSelector: React.FC<SchoolAccommodationSelectorProps> = ({
  value,
  onChange,
  label = 'School Accommodation Type *',
  helperText = 'Select how students are accommodated at the school.',
  disabled = false,
  className = '',
  id: customId,
}) => {
  const generatedId = useId();
  const selectId = customId || `school-accommodation-${generatedId.replace(/:/g, '')}`;
  const listboxId = `${selectId}-listbox`;

  const normalizedValue = normalizeSchoolAccommodationType(value);
  const selectedOption =
    SCHOOL_ACCOMMODATION_OPTIONS.find((opt) => opt.value === normalizedValue) ||
    SCHOOL_ACCOMMODATION_OPTIONS[0];

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<SchoolAccommodationType | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [tooltipPlacement, setTooltipPlacement] = useState<'left' | 'right'>('right');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Determine smart tooltip horizontal placement (left or right)
  const updateTooltipPlacement = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    // If less than 290px available to the right, flip tooltip to the left side
    if (rect.right + 290 > windowWidth) {
      setTooltipPlacement('left');
    } else {
      setTooltipPlacement('right');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateTooltipPlacement();
      const handleResize = () => updateTooltipPlacement();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isOpen, updateTooltipPlacement]);

  // Handle outside click to close dropdown
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHoveredValue(null);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Open dropdown and initialize focused option
  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    const selectedIdx = SCHOOL_ACCOMMODATION_OPTIONS.findIndex(
      (opt) => opt.value === normalizedValue
    );
    setFocusedIndex(selectedIdx >= 0 ? selectedIdx : 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setHoveredValue(null);
    setFocusedIndex(-1);
  };

  const handleSelect = (optionValue: SchoolAccommodationType) => {
    onChange(optionValue);
    handleClose();
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < SCHOOL_ACCOMMODATION_OPTIONS.length - 1 ? prev + 1 : 0
        );
        setHoveredValue(null);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : SCHOOL_ACCOMMODATION_OPTIONS.length - 1
        );
        setHoveredValue(null);
        break;
      }
      case 'Home': {
        e.preventDefault();
        setFocusedIndex(0);
        setHoveredValue(null);
        break;
      }
      case 'End': {
        e.preventDefault();
        setFocusedIndex(SCHOOL_ACCOMMODATION_OPTIONS.length - 1);
        setHoveredValue(null);
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < SCHOOL_ACCOMMODATION_OPTIONS.length) {
          handleSelect(SCHOOL_ACCOMMODATION_OPTIONS[focusedIndex].value);
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        handleClose();
        triggerRef.current?.focus();
        break;
      }
      case 'Tab': {
        handleClose();
        break;
      }
    }
  };

  // Resolve currently active option (hovered takes precedence, then keyboard focused)
  const activeOption: SchoolAccommodationOption | null =
    (hoveredValue && SCHOOL_ACCOMMODATION_OPTIONS.find((opt) => opt.value === hoveredValue)) ||
    (focusedIndex >= 0 ? SCHOOL_ACCOMMODATION_OPTIONS[focusedIndex] : null);

  return (
    <div className={`space-y-1 ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          id={`${selectId}-label`}
          className="block font-bold text-[#334155] mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-labelledby={`${selectId}-label ${selectId}`}
          aria-activedescendant={
            isOpen && activeOption ? `${selectId}-opt-${activeOption.value}` : undefined
          }
          disabled={disabled}
          onClick={() => (isOpen ? handleClose() : handleOpen())}
          onKeyDown={handleKeyDown}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border text-[#131B2E] transition shadow-2xs text-left cursor-pointer ${
            disabled
              ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
              : isOpen
              ? 'border-[#4338CA] ring-3 ring-[#4338CA]/10'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden'
          }`}
        >
          <span className="font-medium truncate text-sm">
            {selectedOption.label}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#4338CA]' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Menu Popover */}
        {isOpen && (
          <div className="absolute z-50 left-0 top-full mt-1.5 w-full min-w-[260px] bg-white border border-[#CBD5E1] rounded-2xl shadow-xl overflow-visible p-1.5 animate-in fade-in-50 zoom-in-95 duration-100">
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-label={label.replace('*', '').trim()}
              tabIndex={-1}
              onMouseLeave={() => setHoveredValue(null)}
              className="space-y-1 outline-hidden"
            >
              {SCHOOL_ACCOMMODATION_OPTIONS.map((opt, idx) => {
                const isSelected = opt.value === normalizedValue;
                const isFocused = focusedIndex === idx;
                const isHovered = hoveredValue === opt.value;
                const isOptionActive = isHovered || (!hoveredValue && isFocused);

                return (
                  <li
                    key={opt.value}
                    id={`${selectId}-opt-${opt.value}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-describedby={
                      isOptionActive ? `${selectId}-desc-${opt.value}` : undefined
                    }
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => {
                        setHoveredValue(opt.value);
                        setFocusedIndex(idx);
                      }}
                      onFocus={() => {
                        setFocusedIndex(idx);
                        setHoveredValue(opt.value);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm text-left transition cursor-pointer font-medium ${
                        isOptionActive
                          ? isSelected
                            ? 'bg-indigo-50 text-[#4338CA] font-semibold'
                            : 'bg-[#F1F5F9] text-[#131B2E]'
                          : isSelected
                          ? 'text-[#4338CA] font-semibold'
                          : 'text-[#334155] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <Check
                          className="w-4 h-4 text-[#4338CA] shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </button>

                    {/* Desktop Contextual Tooltip Popover */}
                    {isOptionActive && (
                      <div
                        role="tooltip"
                        id={`${selectId}-desc-${opt.value}`}
                        className={`pointer-events-none absolute z-60 w-64 md:w-72 p-3 bg-[#0F172A] text-white rounded-xl shadow-2xl border border-slate-700/80 animate-in fade-in-50 zoom-in-95 duration-100 hidden sm:block ${
                          tooltipPlacement === 'left'
                            ? 'right-[calc(100%+12px)] top-1/2 -translate-y-1/2'
                            : 'left-[calc(100%+12px)] top-1/2 -translate-y-1/2'
                        }`}
                      >
                        <div className="font-bold text-amber-300 text-xs mb-1">
                          {opt.label}
                        </div>
                        <p className="text-slate-200 text-[11px] leading-relaxed font-normal">
                          {opt.description}
                        </p>
                        {/* Caret pointing at the option */}
                        {tooltipPlacement === 'left' ? (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-3 bg-[#0F172A] border-t border-r border-slate-700/80 rotate-45 transform"
                            aria-hidden="true"
                          />
                        ) : (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -left-1.5 w-3 h-3 bg-[#0F172A] border-b border-l border-slate-700/80 rotate-45 transform"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Mobile / Narrow Screen Contextual Description Panel */}
            {activeOption && (
              <div
                role="tooltip"
                id={`${selectId}-mobile-desc`}
                className="sm:hidden mt-2 p-2.5 bg-slate-900 text-white rounded-xl border border-slate-700/80 shadow-md text-xs space-y-1 pointer-events-none animate-in fade-in duration-100"
              >
                <div className="font-bold text-amber-300 text-[11px]">
                  {activeOption.label}
                </div>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                  {activeOption.description}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {helperText && (
        <span className="text-[10px] text-[#94A3B8] mt-1 block">
          {helperText}
        </span>
      )}
    </div>
  );
};

export default SchoolAccommodationSelector;
