'use client';

import React from 'react';
import { GraduationCap, Phone, Mail, MapPin } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolHeaderProps {
  data: SchoolWebsiteData;
  activeSection?: string;
  onSectionClick?: (section: string) => void;
}

export default function SchoolHeader({
  data,
  activeSection = 'home',
  onSectionClick,
}: SchoolHeaderProps) {
  const { school, branding, contact, transport, hostel, compliance } = data;

  const navItems = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About' },
    { key: 'academics', label: 'Academics' },
    { key: 'facilities', label: 'Facilities' },
    ...(transport.isOperated ? [{ key: 'transport', label: 'Transport' }] : []),
    ...(hostel.isAvailable ? [{ key: 'hostel', label: 'Hostel' }] : []),
    { key: 'admissions', label: 'Admissions' },
    ...(data.gallery.length > 0 ? [{ key: 'gallery', label: 'Gallery' }] : []),
    { key: 'disclosures', label: 'Mandatory Disclosures' },
    { key: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Top Institutional Contact Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            {contact.primaryPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-400" />
                <span>{contact.primaryPhone}</span>
              </span>
            )}
            {contact.primaryEmail && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-indigo-400" />
                <span className="truncate">{contact.primaryEmail}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {school.board && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-200">
                {school.board}
              </span>
            )}
            {school.affiliationNumber && (
              <span className="text-[10px] text-slate-400">
                Affiliation: {school.affiliationNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={`${school.displayName} Crest`}
              className="w-10 h-10 object-contain rounded-xl shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight truncate leading-tight">
              {school.displayName}
            </h1>
            {school.tagline && (
              <p className="text-[11px] text-slate-500 truncate">{school.tagline}</p>
            )}
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs">
          {navItems.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSectionClick?.(item.key)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  isActive
                    ? 'text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={isActive ? { backgroundColor: branding.primaryColor || '#4338CA' } : {}}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSectionClick?.('admissions')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
          >
            Apply Now
          </button>
        </div>
      </div>
    </header>
  );
}
