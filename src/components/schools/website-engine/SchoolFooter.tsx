'use client';

import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolFooterProps {
  data: SchoolWebsiteData;
  onSectionClick?: (section: string) => void;
}

export default function SchoolFooter({ data, onSectionClick }: SchoolFooterProps) {
  const { school, branding, contact, transport, hostel } = data;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Institutional Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={school.displayName}
                  className="w-9 h-9 object-contain rounded-lg"
                />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
              <span className="font-extrabold text-white text-base tracking-tight">
                {school.displayName}
              </span>
            </div>
            {school.tagline && (
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                {school.tagline}
              </p>
            )}
            <div className="text-[11px] text-slate-500 space-y-0.5">
              <div>Affiliated to {school.board}</div>
              {school.affiliationNumber && <div>Affiliation No: {school.affiliationNumber}</div>}
              {school.udiseCode && <div>UDISE+ Code: {school.udiseCode}</div>}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('about')}
                  className="hover:text-white transition cursor-pointer"
                >
                  About Institution
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('academics')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Academics &amp; Curriculum
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('facilities')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Campus Facilities
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('admissions')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Admissions
                </button>
              </li>
              {transport.isOperated && (
                <li>
                  <button
                    type="button"
                    onClick={() => onSectionClick?.('transport')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Transport Network
                  </button>
                </li>
              )}
              {hostel.isAvailable && (
                <li>
                  <button
                    type="button"
                    onClick={() => onSectionClick?.('hostel')}
                    className="hover:text-white transition cursor-pointer"
                  >
                    Boarding &amp; Hostel
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Compliance & Disclosures */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Compliance
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('disclosures')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Mandatory Public Disclosures
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSectionClick?.('contact')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Campus Contact &amp; Directory
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {currentYear} {school.displayName}. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Multi-Tenant Education Engine • Powered by Ekaagra</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
