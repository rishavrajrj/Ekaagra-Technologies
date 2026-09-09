'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  X,
  User,
  AlertTriangle,
  Check,
  Plus,
  ArrowRight,
  Sparkles,
  Building2,
  Briefcase,
} from 'lucide-react';
import type { StaffMember } from '@/lib/types';
import {
  getFacultyById,
  isFacultyActive,
  formatFacultyDisplay,
  searchFaculty,
} from '@/lib/staffFacultyUtils';

interface FacultySelectorProps {
  /** The currently selected Faculty internal ID (StaffMember.id) or employee code */
  selectedFacultyId?: string;
  /** Legacy teacher name fallback if not linked to a Faculty record */
  legacyTeacherName?: string;
  /** Callback when a faculty member is chosen or cleared */
  onSelect: (faculty: StaffMember | null) => void;
  /** Canonical list of faculty members from intakeData.staffFaculty */
  facultyList?: StaffMember[];
  /** Optional field label */
  label?: string;
  /** Optional placeholder */
  placeholder?: string;
  /** Allow clearing selection */
  allowClear?: boolean;
  /** Subject context (e.g. "Mathematics", "Physics") to prioritize matching teachers */
  subjectContext?: string;
  /** Action to navigate to Faculty section */
  onNavigateToFaculty?: () => void;
  /** Compact mode for table rows */
  isCompact?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export default function FacultySelector({
  selectedFacultyId,
  legacyTeacherName,
  onSelect,
  facultyList = [],
  label,
  placeholder = 'Select Faculty Member...',
  allowClear = true,
  subjectContext,
  onNavigateToFaculty,
  isCompact = false,
  disabled = false,
}: FacultySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Resolve currently selected faculty member
  const selectedMember = useMemo(() => {
    return getFacultyById(selectedFacultyId, facultyList);
  }, [selectedFacultyId, facultyList]);

  // Is selection an unlinked legacy name?
  const isLegacyUnlinked = Boolean(!selectedMember && legacyTeacherName && legacyTeacherName.trim());

  // Check if assigned teacher is inactive
  const isAssignedInactive = Boolean(selectedMember && !isFacultyActive(selectedMember));

  // 2. Filter & Sort Faculty pool
  const filteredFaculty = useMemo(() => {
    const rawMatches = searchFaculty(searchQuery, facultyList);

    // If subjectContext is provided, sort specialists to the top
    if (subjectContext && subjectContext.trim()) {
      const lowerContext = subjectContext.trim().toLowerCase();
      return [...rawMatches].sort((a, b) => {
        const aMatches =
          (a.department && a.department.toLowerCase().includes(lowerContext)) ||
          (a.specialization && a.specialization.toLowerCase().includes(lowerContext)) ||
          (a.subjectsTaught && a.subjectsTaught.toLowerCase().includes(lowerContext));

        const bMatches =
          (b.department && b.department.toLowerCase().includes(lowerContext)) ||
          (b.specialization && b.specialization.toLowerCase().includes(lowerContext)) ||
          (b.subjectsTaught && b.subjectsTaught.toLowerCase().includes(lowerContext));

        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;

        // Active first
        if (isFacultyActive(a) && !isFacultyActive(b)) return -1;
        if (!isFacultyActive(a) && isFacultyActive(b)) return 1;

        return a.name.localeCompare(b.name);
      });
    }

    // Default sort: Active first, then alphabetical
    return [...rawMatches].sort((a, b) => {
      if (isFacultyActive(a) && !isFacultyActive(b)) return -1;
      if (!isFacultyActive(a) && isFacultyActive(b)) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchQuery, facultyList, subjectContext]);

  // 3. Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setHighlightedIndex(-1);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredFaculty.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredFaculty.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredFaculty.length) {
        onSelect(filteredFaculty[highlightedIndex]);
        setIsOpen(false);
      }
    }
  };

  const selectedDisplay = formatFacultyDisplay(selectedMember);

  return (
    <div className="relative w-full text-xs" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block font-bold text-[#334155] mb-1">
          {label}
        </label>
      )}

      {/* ── Main Trigger Button ────────────────────────────────────────── */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`group relative w-full flex items-center justify-between gap-2 text-left transition rounded-xl border ${
          isCompact ? 'px-2.5 py-1.5 min-h-[38px]' : 'px-3 py-2 min-h-[42px]'
        } ${
          disabled
            ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-60'
            : isAssignedInactive
            ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400 cursor-pointer shadow-2xs'
            : isLegacyUnlinked
            ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400 cursor-pointer shadow-2xs'
            : selectedMember
            ? 'bg-white border-[#CBD5E1] hover:border-[#94A3B8] cursor-pointer shadow-2xs'
            : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1] cursor-pointer shadow-2xs'
        } ${isOpen ? 'ring-2 ring-[#4338CA]/20 border-[#4338CA]' : ''}`}
      >
        <div className="flex-1 min-w-0">
          {selectedMember ? (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <span className="font-bold text-[#131B2E] truncate">
                {selectedMember.name}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] font-semibold shrink-0">
                {selectedMember.employeeCode || selectedMember.facultyId || 'FAC'}
              </span>

              {isAssignedInactive ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  Inactive ({selectedMember.status})
                </span>
              ) : selectedMember.department ? (
                <span className="text-[10px] text-[#64748B] truncate hidden sm:inline">
                  • {selectedMember.department}
                </span>
              ) : null}
            </div>
          ) : isLegacyUnlinked ? (
            <div className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-semibold text-xs text-[#131B2E]">
                {legacyTeacherName}
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md font-medium">
                Unlinked Legacy Name
              </span>
            </div>
          ) : (
            <span className="text-[#94A3B8] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>{placeholder}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && (selectedMember || isLegacyUnlinked) && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              title="Clear assignment"
              className="p-1 rounded-md text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEE2E2] transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <ChevronDown
            className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#4338CA]' : ''
            }`}
          />
        </div>
      </div>

      {/* ── Dropdown Popover ───────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full min-w-[280px] sm:min-w-[340px] bg-white border border-[#CBD5E1] rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Header */}
          <div className="p-2.5 bg-[#FAF7F2] border-b border-[#E2E8F0] space-y-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID (FAC-...), department..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#131B2E] placeholder:text-[#94A3B8] focus:border-[#4338CA] focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {subjectContext && (
              <div className="flex items-center gap-1 text-[10px] text-[#4338CA] font-medium px-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>Prioritizing {subjectContext} faculty</span>
              </div>
            )}
          </div>

          {/* Faculty Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F1F5F9] p-1">
            {facultyList.length === 0 ? (
              /* Empty Faculty Directory State */
              <div className="p-4 text-center space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#4338CA] mx-auto flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-bold text-xs text-[#131B2E]">No faculty members available</p>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Add teachers in the Faculty section before assigning subject teachers.
                  </p>
                </div>
                {onNavigateToFaculty && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToFaculty();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4338CA] text-white font-bold text-[11px] hover:bg-[#3730A3] transition cursor-pointer shadow-xs"
                  >
                    <span>Go to Faculty Section</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : filteredFaculty.length === 0 ? (
              /* No Search Results */
              <div className="p-4 text-center text-[#64748B] space-y-1">
                <p className="font-semibold text-xs text-[#334155]">No matching teachers found</p>
                <p className="text-[11px] text-[#94A3B8]">
                  Try searching with a different name, employee code, or department.
                </p>
              </div>
            ) : (
              filteredFaculty.map((member, idx) => {
                const isSelected = selectedMember?.id === member.id;
                const active = isFacultyActive(member);
                const isHighlighted = highlightedIndex === idx;

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onSelect(member);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#EEF2FF] text-[#4338CA]'
                        : isHighlighted
                        ? 'bg-[#F8FAFC]'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                          active
                            ? 'bg-[#4338CA]/10 text-[#4338CA]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-[#131B2E]">
                            {member.name}
                          </span>
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {member.employeeCode || member.facultyId || member.id}
                          </span>
                          {!active && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                              {member.status || 'Inactive'}
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-[#64748B] truncate">
                          {[member.department, member.designation, member.specialization]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#4338CA] shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Manage in Faculty link */}
          {onNavigateToFaculty && facultyList.length > 0 && (
            <div className="p-2 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
              <span className="text-[#64748B]">
                {facultyList.length} faculty members registered
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToFaculty();
                }}
                className="font-bold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Manage Faculty</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
