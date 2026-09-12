'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Award, MapPin } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolHeroProps {
  data: SchoolWebsiteData;
  onCtaClick?: (action: string) => void;
}

export default function SchoolHero({ data, onCtaClick }: SchoolHeroProps) {
  const { school, branding, hero, contact, campuses } = data;
  const primaryCampus = campuses.find((c) => c.isMainCampus) || campuses[0];

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white py-16 sm:py-24">
      {/* Background Graphic / Image Overlay */}
      {hero.imageUrl ? (
        <div className="absolute inset-0 z-0">
          <img
            src={hero.imageUrl}
            alt={school.displayName}
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>
      ) : (
        <div
          className="absolute inset-0 z-0 opacity-20"
          style={{
            background: `radial-gradient(circle at top right, ${branding.primaryColor || '#4338CA'} 0%, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="max-w-2xl space-y-6">
          {/* Institutional Affiliation Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Affiliated to {school.board}</span>
            {school.affiliationNumber && (
              <span className="font-mono text-white/80">({school.affiliationNumber})</span>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {hero.headline}
            </h1>
            {hero.subheadline && (
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                {hero.subheadline}
              </p>
            )}
          </div>

          {/* Primary Campus Address Pill */}
          {primaryCampus && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">
                {primaryCampus.address}
                {primaryCampus.city ? `, ${primaryCampus.city}` : ''}
              </span>
            </div>
          )}

          {/* Call to Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onCtaClick?.('admissions')}
              className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition hover:scale-102 active:scale-98 flex items-center gap-2 cursor-pointer"
              style={{ backgroundColor: branding.primaryColor || '#4338CA' }}
            >
              <span>{hero.primaryCtaText || 'Admissions & Inquiries'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onCtaClick?.('facilities')}
              className="px-5 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white/10 hover:bg-white/15 border border-white/20 text-white transition cursor-pointer"
            >
              {hero.secondaryCtaText || 'Campus Facilities'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
