'use client';

import React, { useState } from 'react';
import {
  Shield,
  Sparkles,
  BookOpen,
  Users,
  Building2,
  Bell,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Phone,
  Heart,
  Award,
  GraduationCap,
  Star,
  MapPin,
  Laptop,
  Lock,
} from 'lucide-react';
import type { CommunicationStyleValue } from './CommunicationStyleVisuals';

export type RoshaniVariant =
  | 'traditional'
  | 'modern'
  | 'academic'
  | 'community'
  | 'minimal'
  | CommunicationStyleValue;

interface RoshaniWebsitePreviewProps {
  variant: RoshaniVariant;
  className?: string;
}

export function normalizeRoshaniVariant(
  variant: RoshaniVariant
): 'traditional' | 'modern' | 'academic' | 'community' | 'minimal' {
  if (variant === 'traditional' || variant === 'Traditional & Prestigious') return 'traditional';
  if (variant === 'modern' || variant === 'Modern & Progressive') return 'modern';
  if (variant === 'academic' || variant === 'Academic & Scholarly') return 'academic';
  if (variant === 'community' || variant === 'Warm & Community-focused') return 'community';
  if (variant === 'minimal' || variant === 'Minimal & Professional') return 'minimal';
  return 'academic';
}

/**
 * Reusable miniature image with graceful styling and fallback
 */
function MiniImage({
  src,
  alt,
  className = '',
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`bg-slate-800 flex items-center justify-center text-slate-500 text-[8px] ${className}`}>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

/**
 * ROSHANI WEBSITE PREVIEW
 * Realistic miniature previews based on the actual Roshani Public School website:
 * https://roshani-public-school.vercel.app/
 *
 * Each variant preserves the authentic Roshani Public School branding, CBSE affiliation 330943,
 * Turkauliya East Champaran location, and official imagery while presenting a distinct visual direction.
 */
export default function RoshaniWebsitePreview({
  variant,
  className = '',
}: RoshaniWebsitePreviewProps) {
  const activeVariant = normalizeRoshaniVariant(variant);

  switch (activeVariant) {
    // =========================================================================
    // 1. TRADITIONAL & PRESTIGIOUS
    // Stately British-Indian institutional heritage, Oxford navy & burnished gold,
    // double-ruled borders, formal serif typography, centered crest badge,
    // Latin motto, Roman numeral pillars. Rectangular heritage framing.
    // =========================================================================
    case 'traditional':
      return (
        <div
          className={`w-full h-full flex flex-col justify-between rounded-none border-2 border-[#1E293B] bg-[#FAF6EE] text-[#0F172A] overflow-hidden text-[10px] leading-tight select-none shadow-xs font-serif ${className}`}
        >
          {/* Browser Chrome: Traditional Stately Dark Navy with Gold Filigree */}
          <div className="bg-[#07111E] text-amber-100/90 px-2 py-1 flex items-center justify-between border-b border-amber-700/60 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600/80 border border-amber-400/50 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 border border-amber-400/50 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 border border-amber-400/50 inline-block" />
              <div className="flex items-center space-x-1 bg-[#0A1628] px-1.5 py-0.5 rounded-xs border border-amber-900/50 ml-1">
                <Lock className="w-2 h-2 text-amber-400" />
                <span className="text-[7.5px] font-mono text-amber-200/90 tracking-wide">
                  roshanipublicschool.edu.in
                </span>
              </div>
            </div>
            <span className="text-[6.5px] uppercase tracking-widest text-amber-300 font-semibold">
              ESTD. 2001 • CBSE NO. 330943
            </span>
          </div>

          {/* School Masthead: Stately Oxford Navy with Double Gold Border Rule */}
          <div className="bg-[#0B1829] text-white px-2.5 py-1.5 flex items-center justify-between border-b-2 border-amber-600/70 shrink-0 shadow-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-amber-500/10 p-0.5 border border-amber-400/70 flex items-center justify-center shrink-0">
                <MiniImage
                  src="/images/projects/roshani-public-school/logo.webp"
                  alt="RPS Crest"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="leading-tight min-w-0">
                <span className="font-serif font-bold text-[9px] tracking-wider text-amber-100 block uppercase truncate">
                  ROSHANI PUBLIC SCHOOL
                </span>
                <span className="text-[6px] text-amber-300/80 font-serif italic block truncate">
                  Under Roshani Educational &amp; Welfare Trust • Turkauliya
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-[7px] text-amber-100 font-serif shrink-0">
              <span className="hidden sm:inline hover:text-amber-300">Heritage</span>
              <span className="text-amber-500/60 hidden sm:inline">•</span>
              <span className="hover:text-amber-300">Academics</span>
              <span className="text-amber-500/60">•</span>
              <span className="px-1.5 py-0.5 rounded-none bg-amber-700 hover:bg-amber-600 text-white font-semibold text-[6.5px] border border-amber-400/80 shadow-2xs">
                Prospectus
              </span>
            </div>
          </div>

          {/* Hero Section: Symmetrical Classical Framing & Heritage Building Facade */}
          <div className="relative overflow-hidden border-b border-amber-900/30 flex-1 min-h-[96px] flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <MiniImage
                src="/images/projects/roshani-public-school/BuildingViewFront.webp"
                alt="Roshani Campus"
                className="w-full h-full object-cover brightness-[0.38] contrast-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#091424] via-[#0C1E3C]/80 to-black/40" />
            </div>

            <div className="relative z-10 p-2 text-center space-y-1">
              <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-none bg-[#0B1829]/90 border border-amber-400/60 text-[6.5px] text-amber-300 uppercase tracking-widest backdrop-blur-xs">
                <Award className="w-2 h-2 text-amber-400" />
                <span>25 Years of Scholastic Distinction</span>
              </div>
              <h4 className="font-serif font-bold text-[11px] text-amber-50 leading-tight tracking-wide">
                Shaping Character. Inspiring Excellence.
              </h4>
              <p className="text-[7px] text-amber-200/90 italic max-w-[240px] mx-auto line-clamp-1">
                &ldquo;Virtus in Arduis&rdquo; — Value-based senior secondary education in East Champaran.
              </p>
              <div className="pt-0.5 flex justify-center space-x-1.5">
                <span className="px-2 py-0.5 rounded-none bg-amber-700 text-white font-serif font-semibold text-[7px] border border-amber-400/80 shadow-xs">
                  Request Prospectus
                </span>
                <span className="px-1.5 py-0.5 rounded-none bg-[#0B1829]/90 text-amber-200 text-[7px] border border-amber-700/60 font-serif">
                  The Roshani Heritage →
                </span>
              </div>
            </div>
          </div>

          {/* Institutional Pillars Strip: Roman Numerals on Warm Cream */}
          <div className="bg-[#07111E] text-amber-200 py-1 px-2 border-b border-amber-900/40 grid grid-cols-4 gap-1 text-center font-serif text-[6.5px] shrink-0">
            <div className="border-r border-amber-900/50 pr-1">
              <span className="text-amber-400 font-bold block">Est. 2001</span>
              <span className="text-amber-300/70 block text-[5.5px]">25 Years</span>
            </div>
            <div className="border-r border-amber-900/50 pr-1">
              <span className="text-amber-400 font-bold block">No. 330943</span>
              <span className="text-amber-300/70 block text-[5.5px]">CBSE Affil.</span>
            </div>
            <div className="border-r border-amber-900/50 pr-1">
              <span className="text-amber-400 font-bold block">Nursery–XII</span>
              <span className="text-amber-300/70 block text-[5.5px]">Curriculum</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold block">R.E.W.T.</span>
              <span className="text-amber-300/70 block text-[5.5px]">Governance</span>
            </div>
          </div>

          {/* Classical Heritage Feature Cards */}
          <div className="p-1.5 grid grid-cols-2 gap-1.5 bg-[#FAF6EE] shrink-0">
            <div className="bg-white p-1.5 rounded-none border border-amber-900/20 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-amber-950">
                <span className="font-serif font-bold text-[7.5px] text-amber-800">I.</span>
                <span className="font-serif font-bold text-[7.5px] uppercase tracking-wide">Scholastic Rigor</span>
              </div>
              <p className="text-[6.5px] text-slate-700 line-clamp-1 font-serif">
                CBSE Science, Commerce &amp; Arts with board distinction.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-none border border-amber-900/20 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-amber-950">
                <span className="font-serif font-bold text-[7.5px] text-amber-800">II.</span>
                <span className="font-serif font-bold text-[7.5px] uppercase tracking-wide">Moral Leadership</span>
              </div>
              <p className="text-[6.5px] text-slate-700 line-clamp-1 font-serif">
                Character formation, civic duty &amp; ethical mentorship.
              </p>
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 2. MODERN & PROGRESSIVE
    // Contemporary tech aesthetic, cyber slate & electric indigo/cyan gradient,
    // bold geometric sans typography, live pulse indicator, asymmetric tech hero,
    // DigiClass smart boards, STEM chips, rounded-xl modern cards.
    // =========================================================================
    case 'modern':
      return (
        <div
          className={`w-full h-full flex flex-col justify-between rounded-xl border border-indigo-200 bg-white text-slate-900 overflow-hidden text-[10px] leading-tight select-none shadow-xs font-sans ${className}`}
        >
          {/* Browser Chrome: Sleek Dark Glass with Live Pulse Indicator */}
          <div className="bg-[#0B0F19] text-slate-300 px-2 py-1 flex items-center justify-between border-b border-indigo-950/80 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <div className="flex items-center space-x-1 bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-800 ml-1">
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse inline-block" />
                <span className="text-[7.5px] font-mono text-cyan-300">
                  roshani.ac.in/smart-campus
                </span>
              </div>
            </div>
            <span className="text-[6.5px] font-bold text-cyan-300 flex items-center space-x-1 bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-800/60">
              <Sparkles className="w-2 h-2 text-cyan-400" />
              <span>DIGICLASS 3.0</span>
            </span>
          </div>

          {/* School Modern Navbar: Clean Tech Header with Gradient Accent */}
          <div className="bg-white/95 px-2.5 py-1.5 flex items-center justify-between border-b border-slate-100 shrink-0 backdrop-blur-xs">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 flex items-center justify-center shrink-0 shadow-xs">
                <MiniImage
                  src="/images/projects/roshani-public-school/logo.webp"
                  alt="RPS Logo"
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <div className="leading-tight min-w-0">
                <div className="flex items-center space-x-1">
                  <span className="font-extrabold text-[9px] tracking-tight text-slate-900 block truncate">
                    ROSHANI // CAMPUS
                  </span>
                  <span className="text-[6px] font-bold px-1 rounded-sm bg-indigo-50 text-indigo-600 border border-indigo-200">
                    TECH
                  </span>
                </div>
                <span className="text-[6px] text-indigo-600 font-semibold block truncate">
                  21st-Century DigiClass Learning • CBSE 330943
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-[7px] font-medium text-slate-600 shrink-0">
              <span className="text-indigo-600 font-bold hidden sm:inline">STEM Labs</span>
              <span className="hidden sm:inline">•</span>
              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white px-2 py-0.5 rounded-full text-[6.5px] font-extrabold shadow-xs inline-flex items-center space-x-0.5">
                <span>Apply Online</span>
                <ArrowRight className="w-1.5 h-1.5" />
              </span>
            </div>
          </div>

          {/* Hero Section: Asymmetric Dynamic Tech Composition with Smart Classroom Image */}
          <div className="relative overflow-hidden border-b border-indigo-900/40 flex-1 min-h-[96px] flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <MiniImage
                src="/images/projects/roshani-public-school/smart-classroom.webp"
                alt="Smart Classroom"
                className="w-full h-full object-cover brightness-[0.35]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070B14]/95 via-indigo-950/85 to-[#070B14]/70" />
            </div>

            <div className="relative z-10 p-2 space-y-1">
              <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[6.5px] text-cyan-300 font-semibold">
                <Laptop className="w-2 h-2 text-cyan-300" />
                <span>3D Visual Modules &amp; Robotics Ready</span>
              </div>
              <h4 className="font-black text-[12px] text-white tracking-tight leading-tight">
                Learning Today.{' '}
                <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-rose-300 bg-clip-text text-transparent">
                  Leading Tomorrow.
                </span>
              </h4>
              <p className="text-[7px] text-indigo-200 line-clamp-1 max-w-[240px]">
                Empowering inquisitive minds with interactive smart boards &amp; STEM inquiry.
              </p>
              <div className="pt-0.5 flex space-x-1.5">
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-[7px] shadow-xs inline-flex items-center space-x-0.5">
                  <span>Enroll for 2026</span>
                  <ArrowRight className="w-1.5 h-1.5" />
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white text-[7px] border border-white/20">
                  Virtual Campus Tour
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar with Modern Tech Chips */}
          <div className="bg-[#0B0F19] text-white py-1 px-2 border-b border-indigo-950 grid grid-cols-4 gap-1 text-center text-[6.5px] shrink-0">
            <div className="border-r border-slate-800 pr-1">
              <span className="text-cyan-400 font-bold block">100%</span>
              <span className="text-slate-400 block text-[5.5px]">DigiClass</span>
            </div>
            <div className="border-r border-slate-800 pr-1">
              <span className="text-indigo-400 font-bold block">3 Streams</span>
              <span className="text-slate-400 block text-[5.5px]">Sci/Comm/Arts</span>
            </div>
            <div className="border-r border-slate-800 pr-1">
              <span className="text-cyan-400 font-bold block">STEM Lab</span>
              <span className="text-slate-400 block text-[5.5px]">High-Speed LAN</span>
            </div>
            <div>
              <span className="text-indigo-400 font-bold block">CBSE</span>
              <span className="text-slate-400 block text-[5.5px]">Code 330943</span>
            </div>
          </div>

          {/* Modern Innovation Feature Cards */}
          <div className="p-1.5 grid grid-cols-2 gap-1.5 bg-indigo-50/30 shrink-0">
            <div className="bg-white p-1.5 rounded-lg border border-indigo-100 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-indigo-600">
                <Laptop className="w-2.5 h-2.5 text-indigo-600" />
                <span className="font-extrabold text-[7.5px]">Smart DigiClass</span>
              </div>
              <p className="text-[6.5px] text-slate-500 line-clamp-1 font-medium">
                3D syllabus visualizers &amp; active touchboards.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-cyan-100 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-cyan-600">
                <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
                <span className="font-extrabold text-[7.5px]">STEM &amp; Science Labs</span>
              </div>
              <p className="text-[6.5px] text-slate-500 line-clamp-1 font-medium">
                Physics, Chemistry, Biology &amp; Computer Lab.
              </p>
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 3. ACADEMIC & SCHOLARLY
    // Elite collegiate academic institution, collegiate blue & white, structured
    // editorial masthead, authentic 2-column split (photo carousel left & live
    // notice board right), structured 3-stream curriculum faculty cards.
    // =========================================================================
    case 'academic':
      return (
        <div
          className={`w-full h-full flex flex-col justify-between rounded-lg border border-slate-300 bg-white text-slate-900 overflow-hidden text-[10px] leading-tight select-none shadow-xs font-sans ${className}`}
        >
          {/* Browser Chrome: Academic Gazette Top Announcement Strip */}
          <div className="bg-[#102A4C] text-blue-100 px-2 py-0.5 flex items-center justify-between text-[6.5px] border-b border-blue-900 shrink-0">
            <div className="flex items-center space-x-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
              <span className="font-medium text-blue-200 truncate">
                Admissions Open 2026–27 | Nursery to Class XII (All Streams)
              </span>
            </div>
            <span className="text-[6px] font-mono text-blue-300 hidden sm:inline shrink-0">
              CBSE AFFIL. NO. 330943
            </span>
          </div>

          {/* School Masthead: Authoritative Collegiate Double-Tier Header */}
          <div className="bg-white px-2.5 py-1.5 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-5 h-5 rounded-full p-0.5 bg-blue-50 border border-blue-300 flex items-center justify-center shrink-0">
                <MiniImage
                  src="/images/projects/roshani-public-school/logo.webp"
                  alt="Roshani Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="font-bold text-[9px] text-[#102A4C] tracking-tight block truncate font-serif">
                  Roshani Public School
                </span>
                <span className="text-[6px] text-slate-500 block truncate">
                  Affiliated to CBSE, New Delhi (Code: 330943) • Turkauliya
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 text-[7px] text-slate-600 shrink-0">
              <span className="hidden sm:inline font-medium hover:text-blue-700">Curriculum</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="hidden sm:inline font-medium hover:text-blue-700">Faculties</span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <span className="px-1.5 py-0.5 rounded bg-[#1E40AF] text-white font-bold text-[6.5px] shadow-2xs">
                Apply Now
              </span>
            </div>
          </div>

          {/* Hero Section: Authentic Two-Column Split (Campus Photo Left + Live Notice Board Right) */}
          <div className="grid grid-cols-12 border-b border-slate-200 bg-slate-50 flex-1 min-h-[96px]">
            {/* Left Column (62%): Stately Campus View with Academic Title */}
            <div className="col-span-7 relative overflow-hidden bg-slate-900 flex flex-col justify-end p-2 text-white">
              <MiniImage
                src="/images/projects/roshani-public-school/BuildingViewFront.webp"
                alt="Main Campus"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-black/20" />

              <div className="relative z-10 space-y-0.5">
                <div className="inline-flex items-center space-x-1 px-1 py-0.2 rounded bg-black/60 text-white text-[5.5px] backdrop-blur-2xs">
                  <span>🏛️</span>
                  <span>Academic Excellence</span>
                </div>
                <h4 className="font-serif font-bold text-[9.5px] text-white leading-tight">
                  Scholastic Distinction
                  <br />
                  <span className="text-[7px] font-sans font-normal text-blue-200">
                    Nursery through Class XII
                  </span>
                </h4>
                <div className="pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#2563EB] text-white font-semibold text-[6px] shadow-2xs inline-block">
                    Explore Streams →
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (38%): Scholarly Gazette / Live Notices Panel */}
            <div className="col-span-5 p-1.5 bg-white border-l border-slate-200 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-0.5 border-b border-slate-100">
                  <span className="font-bold text-[7px] text-[#102A4C] flex items-center space-x-0.5">
                    <Bell className="w-2 h-2 text-[#2563EB]" />
                    <span>Gazette</span>
                  </span>
                  <span className="inline-flex items-center text-[5.5px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded-full border border-emerald-200">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mr-0.5 animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="space-y-1 text-[6px]">
                  <div className="p-1 rounded bg-blue-50/70 border border-blue-100 space-y-0.2">
                    <span className="font-bold text-[#102A4C] block line-clamp-1">
                      Admissions 2026-27
                    </span>
                    <span className="text-slate-500 text-[5px] block line-clamp-1">
                      Science, Commerce &amp; Arts
                    </span>
                  </div>
                  <div className="p-1 rounded bg-slate-50 border border-slate-100 space-y-0.2">
                    <span className="font-semibold text-slate-800 block line-clamp-1">
                      CBSE Board Distinction
                    </span>
                    <span className="text-slate-500 text-[5px] block line-clamp-1">
                      100% Board Examination Pass
                    </span>
                  </div>
                </div>
              </div>

              <span className="text-[5.5px] text-[#2563EB] font-bold block pt-0.5 text-right">
                All Notices &rarr;
              </span>
            </div>
          </div>

          {/* Quick Academic Metadata Strip */}
          <div className="bg-slate-100 py-1 px-2 border-b border-slate-200 grid grid-cols-4 gap-1 text-center text-[6.5px] shrink-0 font-sans">
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[#102A4C] font-bold block">Jan 7, 2001</span>
              <span className="text-slate-500 block text-[5.5px]">Established</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[#102A4C] font-bold block">No. 330943</span>
              <span className="text-slate-500 block text-[5.5px]">CBSE Affil.</span>
            </div>
            <div className="border-r border-slate-200 pr-1">
              <span className="text-[#102A4C] font-bold block">Nursery-XII</span>
              <span className="text-slate-500 block text-[5.5px]">Curriculum</span>
            </div>
            <div>
              <span className="text-[#102A4C] font-bold block">Turkauliya</span>
              <span className="text-slate-500 block text-[5.5px]">East Champaran</span>
            </div>
          </div>

          {/* 3 Senior Secondary Academic Streams Grid */}
          <div className="p-1.5 grid grid-cols-2 gap-1.5 bg-white shrink-0">
            <div className="p-1.5 rounded border border-slate-200 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-[#102A4C]">
                <BookOpen className="w-2 h-2 text-[#2563EB]" />
                <span className="font-bold text-[7.5px]">Science Faculty</span>
              </div>
              <p className="text-[6.5px] text-slate-500 line-clamp-1">
                PCM &amp; PCB with specialized laboratory practicums.
              </p>
            </div>
            <div className="p-1.5 rounded border border-slate-200 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-[#102A4C]">
                <Award className="w-2 h-2 text-[#2563EB]" />
                <span className="font-bold text-[7.5px]">Commerce &amp; Arts</span>
              </div>
              <p className="text-[6.5px] text-slate-500 line-clamp-1">
                Accountancy, Economics, Humanities &amp; NCERT syllabus.
              </p>
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 4. WARM & COMMUNITY-FOCUSED
    // Child-centric, family-oriented, warm honey-amber & terracotta, soft rounded
    // pills, joyful student/kids classroom photo, pastoral care quotes,
    // caring community cards with generous rounded corners.
    // =========================================================================
    case 'community':
      return (
        <div
          className={`w-full h-full flex flex-col justify-between rounded-2xl border-2 border-amber-200 bg-[#FFFDF7] text-slate-900 overflow-hidden text-[10px] leading-tight select-none shadow-xs font-sans ${className}`}
        >
          {/* Browser Chrome: Warm Cream with Cheerful Heart Accent */}
          <div className="bg-[#FEF7EC] text-amber-900 px-2.5 py-1 flex items-center justify-between border-b border-amber-200/80 shrink-0">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <div className="flex items-center space-x-1 bg-white px-1.5 py-0.5 rounded-full border border-amber-200/60 ml-1">
                <Heart className="w-1.5 h-1.5 text-rose-500 fill-rose-500" />
                <span className="text-[7.5px] font-medium text-amber-900">
                  roshanikids.org/our-family
                </span>
              </div>
            </div>
            <span className="text-[6.5px] font-bold text-amber-800 flex items-center space-x-0.5 bg-amber-100/70 px-1.5 py-0.5 rounded-full">
              <span>❤️ Child-First Campus</span>
            </span>
          </div>

          {/* Welcoming Top Banner + School Header */}
          <div className="bg-white px-2.5 py-1.5 flex items-center justify-between border-b border-amber-100 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-amber-100/80 p-0.5 border border-amber-300 flex items-center justify-center shrink-0">
                <MiniImage
                  src="/images/projects/roshani-public-school/logo.webp"
                  alt="RPS Emblem"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="font-bold text-[9px] tracking-tight text-amber-950 block truncate">
                  ROSHANI PUBLIC SCHOOL
                </span>
                <span className="text-[6px] text-amber-800 block truncate">
                  Where Every Child is Known, Nurtured &amp; Celebrated
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-[7px] text-amber-900 shrink-0">
              <span className="hidden sm:inline font-medium">Our Family</span>
              <span className="hidden sm:inline text-amber-300">•</span>
              <span className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-full text-[6.5px] shadow-2xs inline-flex items-center space-x-0.5">
                <span>Join Family</span>
                <Heart className="w-1.5 h-1.5 fill-white" />
              </span>
            </div>
          </div>

          {/* Hero Section: Warm Child-Centric Composition with Kids Classroom Photo */}
          <div className="relative overflow-hidden border-b border-amber-200 flex-1 min-h-[96px] flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <MiniImage
                src="/images/projects/roshani-public-school/kids-class.webp"
                alt="Smiling Students"
                className="w-full h-full object-cover brightness-[0.45] contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/60 to-transparent" />
            </div>

            <div className="relative z-10 p-2 space-y-1 text-white">
              <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-white/25 text-white text-[6.5px] font-semibold border border-white/40 backdrop-blur-xs">
                <Heart className="w-2 h-2 text-rose-300 fill-rose-300" />
                <span>Safe, Loving &amp; Child-Centric Campus</span>
              </div>
              <h4 className="font-bold text-[12px] text-white leading-tight">
                Growing Together,{' '}
                <span className="text-amber-300 font-extrabold">Learning Together.</span>
              </h4>
              <p className="text-[7px] text-amber-100 line-clamp-1 max-w-[240px]">
                A joyful learning family in Turkauliya where curiosity meets compassionate care.
              </p>
              <div className="pt-0.5 flex space-x-1.5">
                <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[7px] shadow-xs inline-flex items-center space-x-0.5">
                  <span>Join Our Family</span>
                  <Heart className="w-1.5 h-1.5 fill-white" />
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[7px]">
                  Book Campus Visit
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info Strip in Warm Amber Honey */}
          <div className="bg-[#FFF4E0] text-amber-950 py-1 px-2 border-b border-amber-200 grid grid-cols-4 gap-1 text-center text-[6.5px] shrink-0 font-medium">
            <div className="border-r border-amber-200/80 pr-1">
              <span className="text-amber-900 font-bold block">20:1 Ratio</span>
              <span className="text-amber-700 block text-[5.5px]">Personal Care</span>
            </div>
            <div className="border-r border-amber-200/80 pr-1">
              <span className="text-amber-900 font-bold block">25+ Clubs</span>
              <span className="text-amber-700 block text-[5.5px]">Sports &amp; Arts</span>
            </div>
            <div className="border-r border-amber-200/80 pr-1">
              <span className="text-amber-900 font-bold block">24/7 Safety</span>
              <span className="text-amber-700 block text-[5.5px]">Monitored Fleet</span>
            </div>
            <div>
              <span className="text-amber-900 font-bold block">CBSE 330943</span>
              <span className="text-amber-700 block text-[5.5px]">Child-Centric</span>
            </div>
          </div>

          {/* Warm Caring Feature Cards with Soft Rounded Corners */}
          <div className="p-1.5 grid grid-cols-2 gap-1.5 bg-[#FFF9ED] shrink-0">
            <div className="bg-white p-1.5 rounded-xl border border-amber-200/90 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-amber-900">
                <Users className="w-2.5 h-2.5 text-amber-600" />
                <span className="font-bold text-[7.5px]">Holistic Growth</span>
              </div>
              <p className="text-[6.5px] text-slate-600 line-clamp-1">
                Music, fine arts, athletics &amp; student leadership.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-xl border border-amber-200/90 shadow-2xs space-y-0.5">
              <div className="flex items-center space-x-1 text-rose-700">
                <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                <span className="font-bold text-[7.5px]">Pastoral Care</span>
              </div>
              <p className="text-[6.5px] text-slate-600 line-clamp-1">
                Emotional well-being, trust &amp; individualized support.
              </p>
            </div>
          </div>
        </div>
      );

    // =========================================================================
    // 5. MINIMAL & PROFESSIONAL
    // Swiss architectural minimalism, pure monochrome & zinc, hairline borders,
    // monospace indexing (01 //, 02 //), sharp rectangular zero-radius geometry,
    // structured modular metadata grid, zero decorative clutter.
    // =========================================================================
    case 'minimal':
      return (
        <div
          className={`w-full h-full flex flex-col justify-between rounded-none border border-zinc-300 bg-white text-zinc-900 overflow-hidden text-[10px] leading-tight select-none shadow-xs font-sans ${className}`}
        >
          {/* Browser Chrome: Minimalist Monospace Technical Bar with Hairline Rule */}
          <div className="bg-zinc-100 text-zinc-700 px-2 py-1 flex items-center justify-between border-b border-zinc-200 shrink-0 font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 bg-zinc-400 inline-block" />
              <span className="w-1.5 h-1.5 bg-zinc-400 inline-block" />
              <span className="w-1.5 h-1.5 bg-zinc-400 inline-block" />
              <span className="text-[7.5px] text-zinc-600 uppercase tracking-widest ml-1">
                RPS://SYS/CBSE.330943
              </span>
            </div>
            <span className="text-[6.5px] uppercase tracking-widest text-zinc-500">
              OFFICIAL SYSTEM PORTAL
            </span>
          </div>

          {/* School Header: Sharp Architectural Monospace Grid */}
          <div className="bg-white px-2.5 py-1.5 flex items-center justify-between border-b border-zinc-200 shrink-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-4 h-4 rounded-none bg-zinc-100 p-0.5 border border-zinc-300 flex items-center justify-center shrink-0">
                <MiniImage
                  src="/images/projects/roshani-public-school/logo.webp"
                  alt="RPS"
                  className="w-full h-full object-contain grayscale"
                />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-zinc-950 block truncate">
                    ROSHANI PUBLIC SCHOOL
                  </span>
                  <span className="text-[6px] font-mono text-zinc-400">[01/05]</span>
                </div>
                <span className="text-[6px] font-mono text-zinc-500 block truncate uppercase">
                  SENIOR SECONDARY • TURKAULIYA, BIHAR
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[7px] font-mono uppercase tracking-wider text-zinc-500 shrink-0">
              <span className="hidden sm:inline">01 ACADEMICS</span>
              <span className="px-1.5 py-0.5 rounded-none bg-zinc-950 text-white font-medium text-[6.5px]">
                ADMISSIONS
              </span>
            </div>
          </div>

          {/* Hero Section: Architectural Photographic Grid with High Contrast */}
          <div className="relative overflow-hidden border-b border-zinc-200 flex-1 min-h-[96px] flex flex-col justify-center">
            <div className="absolute inset-0 z-0">
              <MiniImage
                src="/images/projects/roshani-public-school/buildingView1.webp"
                alt="Roshani Architecture"
                className="w-full h-full object-cover brightness-[0.32] contrast-125 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-transparent" />
            </div>

            <div className="relative z-10 p-2 space-y-1 text-white">
              <div className="text-[6px] font-mono uppercase tracking-widest text-zinc-400">
                01 // CBSE AFFILIATION CODE: 330943
              </div>
              <h4 className="font-semibold text-[12px] text-white tracking-tight leading-tight uppercase font-sans">
                Education with Purpose.
              </h4>
              <p className="text-[7px] text-zinc-300 font-mono line-clamp-1 max-w-[240px]">
                Rigorous senior secondary instruction • Transparent statutory compliance.
              </p>
              <div className="pt-0.5 flex space-x-1.5 font-mono">
                <span className="px-2 py-0.5 rounded-none bg-white text-zinc-950 font-bold text-[7px] uppercase tracking-wider">
                  Admissions 2026 →
                </span>
                <span className="px-1.5 py-0.5 rounded-none bg-zinc-900 text-zinc-300 border border-zinc-700 text-[7px] uppercase">
                  Disclosures
                </span>
              </div>
            </div>
          </div>

          {/* Structured Modular Metadata Bar */}
          <div className="bg-zinc-950 text-zinc-200 py-1 px-2 border-b border-zinc-800 grid grid-cols-4 gap-1 text-center font-mono text-[6.5px] shrink-0">
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-white font-bold block">2001</span>
              <span className="text-zinc-500 block text-[5.5px]">ESTD</span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-white font-bold block">330943</span>
              <span className="text-zinc-500 block text-[5.5px]">CBSE CODE</span>
            </div>
            <div className="border-r border-zinc-800 pr-1">
              <span className="text-white font-bold block">K-12</span>
              <span className="text-zinc-500 block text-[5.5px]">GRADES</span>
            </div>
            <div>
              <span className="text-white font-bold block">BIHAR</span>
              <span className="text-zinc-500 block text-[5.5px]">LOCATION</span>
            </div>
          </div>

          {/* Architectural Numbered Directory Index */}
          <div className="p-1.5 grid grid-cols-2 gap-1.5 bg-zinc-50 shrink-0">
            <div className="bg-white p-1.5 rounded-none border border-zinc-200 shadow-2xs space-y-0.5">
              <span className="text-[6px] font-mono text-zinc-400 block uppercase">01 / CURRICULUM</span>
              <span className="font-semibold text-[7.5px] text-zinc-900 block font-mono">Senior Secondary</span>
              <p className="text-[6.5px] text-zinc-500 line-clamp-1 font-mono">Science, Commerce &amp; Arts</p>
            </div>
            <div className="bg-white p-1.5 rounded-none border border-zinc-200 shadow-2xs space-y-0.5">
              <span className="text-[6px] font-mono text-zinc-400 block uppercase">02 / COMPLIANCE</span>
              <span className="font-semibold text-[7.5px] text-zinc-900 block font-mono">Public Disclosures</span>
              <p className="text-[6.5px] text-zinc-500 line-clamp-1 font-mono">100% Verified Certificates</p>
            </div>
          </div>
        </div>
      );
  }
}
