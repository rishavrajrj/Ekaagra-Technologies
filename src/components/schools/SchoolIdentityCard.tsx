'use client';

import React from 'react';
import { School, MapPin } from 'lucide-react';

export interface SchoolIdentityCardProps {
  schoolName: string;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
  status?: string;
  projectNumber?: string;
  udiseCode?: string;
  campusCount?: number;
  className?: string;
  variant?: 'card' | 'navbar';
}

/**
 * SchoolIdentityCard
 *
 * Polished, modern production SaaS school identity header card.
 * Responsive horizontal layout: [Logo] [School Information] [Status]
 * - Desktop: 64–72px fixed logo container with object-fit: contain (in card mode)
 * - Navbar mode: Compact 40–52px logo container for persistent top navigation
 * - Subtle border, very light background, soft rounded corners, no heavy shadow
 */
export default function SchoolIdentityCard({
  schoolName,
  city,
  state,
  logoUrl,
  status = 'ONBOARDING',
  projectNumber,
  udiseCode,
  campusCount,
  className = '',
  variant = 'card',
}: SchoolIdentityCardProps) {
  // Derive formatted location string
  const locationParts = [city, state].filter(Boolean);
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : 'Motihari, Bihar';

  // Fallback school initials (e.g. "Joseph Public School" -> "JP")
  const initials = schoolName
    ? schoolName
        .split(' ')
        .filter((w) => w.length > 0)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
    : 'SC';

  if (variant === 'navbar') {
    return (
      <div
        className={`flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 ${className}`}
        aria-label="School Identity"
      >
        {/* Fixed-size Logo Container (Desktop: 48–52px, Mobile: 40px) */}
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] p-1 sm:p-1.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs"
          aria-hidden="true"
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={`${schoolName || 'School'} logo`}
              className="w-full h-full object-contain select-none transition-transform duration-200 hover:scale-105"
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <div className="w-full h-full rounded-lg sm:rounded-xl bg-gradient-to-br from-[#4338CA]/10 via-[#EEF2FF] to-white flex flex-col items-center justify-center text-[#4338CA] select-none">
              <School className="w-4 h-4 sm:w-5 sm:h-5 text-[#4338CA]" />
              <span className="text-[8px] sm:text-[9px] font-mono font-black text-[#4338CA] tracking-wider mt-0.5">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* School Information */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h1
            className="text-xs sm:text-sm lg:text-base font-extrabold text-[#131B2E] tracking-tight truncate leading-tight"
            title={schoolName || 'School'}
          >
            {schoolName || 'School'}
          </h1>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-[#64748B] font-medium min-w-0 flex-wrap">
            <span className="flex items-center gap-1 shrink-0 min-w-0">
              <MapPin className="w-3 h-3 text-[#94A3B8] shrink-0" aria-hidden="true" />
              <span
                className="truncate max-w-[130px] sm:max-w-none"
                title={campusCount && campusCount > 1 ? `${locationText} (Main Campus)` : locationText}
              >
                {campusCount && campusCount > 1 ? `${locationText} (Main Campus)` : locationText}
              </span>
            </span>

            {typeof campusCount === 'number' && (
              <>
                <span className="text-[#CBD5E1] shrink-0">•</span>
                <span
                  className="font-bold text-[10px] text-[#4338CA] bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded shrink-0"
                  title={`${campusCount} ${campusCount === 1 ? 'Campus' : 'Campuses'} Registered`}
                >
                  {campusCount === 1 ? '1 Campus' : `${campusCount} Campuses`}
                </span>
              </>
            )}

            {projectNumber && (
              <>
                <span className="text-[#CBD5E1] shrink-0">•</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-[#475569] font-semibold shrink-0">
                  {projectNumber}
                </span>
              </>
            )}

            {udiseCode && (
              <>
                <span className="text-[#CBD5E1] shrink-0 hidden sm:inline">•</span>
                <span className="font-mono text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.2 rounded font-semibold shrink-0 hidden sm:inline-flex">
                  UDISE: {udiseCode}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/95 backdrop-blur-xs border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 lg:px-6 lg:py-4 shadow-xs transition-all duration-200 ${className}`}
      aria-label="School Identity Card"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
        {/* Left: Logo + School Information */}
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {/* Fixed-size Logo Container (Desktop: 64–72px, Mobile: 56–64px) */}
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] p-1.5 sm:p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs"
            aria-hidden="true"
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={`${schoolName} logo`}
                className="w-full h-full object-contain select-none transition-transform duration-200 hover:scale-105"
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className="w-full h-full rounded-lg sm:rounded-xl bg-gradient-to-br from-[#4338CA]/10 via-[#EEF2FF] to-white flex flex-col items-center justify-center text-[#4338CA] select-none">
                <School className="w-5 h-5 sm:w-6 sm:h-6 text-[#4338CA]" />
                <span className="text-[9px] font-mono font-black text-[#4338CA] tracking-wider mt-0.5">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* School Information */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-base sm:text-lg lg:text-xl font-black text-[#131B2E] tracking-tight truncate leading-tight"
                title={schoolName}
              >
                {schoolName || 'Joseph Public School'}
              </h1>

              {typeof campusCount === 'number' && (
                <span
                  className="inline-flex items-center text-[10px] font-bold text-[#4338CA] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full shrink-0"
                  title={`${campusCount} ${campusCount === 1 ? 'Campus' : 'Campuses'} Registered`}
                >
                  {campusCount === 1 ? '1 Campus' : `${campusCount} Campuses`}
                </span>
              )}

              {projectNumber && (
                <span className="hidden md:inline-flex text-[10px] font-mono font-bold text-[#64748B] bg-[#FAF7F2] border border-[#E2E8F0] px-1.5 py-0.5 rounded-md shrink-0">
                  {projectNumber}
                </span>
              )}

              {udiseCode && (
                <span className="hidden lg:inline-flex text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                  UDISE: {udiseCode}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#64748B] font-medium truncate mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" aria-hidden="true" />
              <span
                className="truncate"
                title={campusCount && campusCount > 1 ? `${locationText} (Main Campus)` : locationText}
              >
                {campusCount && campusCount > 1 ? `${locationText} (Main Campus)` : locationText}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status Badge (Desktop: right-aligned, Mobile: gracefully wraps without overflow) */}
        <div className="shrink-0 ml-auto sm:ml-0">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] shadow-2xs select-none"
            role="status"
            aria-label={`Status: ${status}`}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4338CA] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4338CA]" />
            </span>
            <span>{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
