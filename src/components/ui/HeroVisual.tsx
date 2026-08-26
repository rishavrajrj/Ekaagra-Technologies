'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  Zap,
  ArrowRight,
  GraduationCap,
  Building2,
  BookOpen,
  Smartphone,
  CheckCircle2,
  Play
} from 'lucide-react';
import LiveWebsitePreview from './LiveWebsitePreview';

interface HeroProject {
  id: string;
  number: string;
  name: string;
  shortLabel: string;
  category: string;
  badge: string;
  badgeColor: string;
  liveUrl: string;
  slug: string;
  image: string;
  description: string;
  capabilities: string[];
}

const HERO_PROJECTS: HeroProject[] = [
  {
    id: 'roshani',
    number: '01',
    name: 'Roshani Public School',
    shortLabel: 'Roshani',
    category: 'Education Website',
    badge: 'Live School Portal',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    liveUrl: 'https://roshani-public-school.vercel.app/',
    slug: 'roshani-public-school',
    image: '/images/projects/roshani-public-school/roshani-2.png',
    description: 'Admissions, academics, CBSE mandatory disclosures, and real-time digital notice board.',
    capabilities: ['Mobile First', 'CBSE Ready', 'Admissions Form'],
  },
  {
    id: 'sparknest',
    number: '02',
    name: 'SparkNest Academy',
    shortLabel: 'SparkNest',
    category: 'EdTech Platform',
    badge: 'EdTech Web App',
    badgeColor: 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20',
    liveUrl: 'https://www.sparknestacademy.in/',
    slug: 'sparknest-academy',
    image: '/images/projects/sparknest-academy/sparknest-1.png',
    description: 'Structured course catalog, student learning interface, and enrollment workflows.',
    capabilities: ['Fast UI', 'Course Catalog', 'SEO Optimized'],
  },
  {
    id: 'palak',
    number: '03',
    name: 'Palak Enterprises',
    shortLabel: 'Palak',
    category: 'Business Website',
    badge: 'B2B & Print Shop',
    badgeColor: 'bg-[#F97360]/10 text-[#F97360] border-[#F97360]/20',
    liveUrl: 'https://palak-enterprises-ghit.vercel.app/',
    slug: 'palak-enterprises',
    image: '/images/projects/palak-enterprises.svg',
    description: 'Commercial B2B products, custom printing uploads, and instant WhatsApp inquiries.',
    capabilities: ['WhatsApp Leads', 'Document Upload', 'Razorpay Ready'],
  },
  {
    id: 'erp',
    number: '04',
    name: 'Roshani Public School ERP',
    shortLabel: 'ERP',
    category: 'Institutional ERP',
    badge: 'Institutional System',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    liveUrl: 'https://roshani-public-school-erp.vercel.app/login',
    slug: 'roshani-public-school-erp',
    image: '/images/projects/roshani-public-school-erp/roshani-erp-1.jpg',
    description: 'Multi-role authentication for Admin, Teachers, Parents, and Students with fee & attendance tracking.',
    capabilities: ['Multi-Role RBAC', 'Fee Receipts', 'Attendance Cloud'],
  },
];

export default function HeroVisual() {
  const [activeProjectId, setActiveProjectId] = useState<string>('roshani');

  const activeProject =
    HERO_PROJECTS.find((p) => p.id === activeProjectId) || HERO_PROJECTS[0];

  return (
    <div className="relative w-full max-w-2xl lg:max-w-none mx-auto space-y-3.5">
      {/* Ambient background glows */}
      <div className="absolute -top-12 -left-12 w-56 h-56 bg-[#F97360]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-[#4338CA]/15 rounded-full blur-3xl pointer-events-none" />


      {/* Floating Capability Badge 2 */}
      <div className="hidden sm:flex absolute -bottom-4 -left-4 z-30 bg-white border border-[#E2E8F0] rounded-2xl p-3 shadow-xl items-center gap-3 animate-float-slow">
        <div className="w-10 h-10 rounded-xl bg-[#F97360]/10 text-[#F97360] flex items-center justify-center border border-[#F97360]/20">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="text-[11px] font-bold text-[#131B2E]">Custom Built Website</div>
          <div className="text-[10px] text-[#64748B]">Designed to Convert</div>
        </div>
      </div>

      {/* ─── Compact Project Selector Bar ─────────────────────────── */}
      <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between gap-1 overflow-x-auto relative z-20">
        {HERO_PROJECTS.map((proj) => {
          const isActive = proj.id === activeProjectId;
          return (
            <button
              key={proj.id}
              type="button"
              onClick={() => setActiveProjectId(proj.id)}
              className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
                isActive
                  ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20 scale-[1.02]'
                  : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
              }`}
            >
              <span
                className={`font-mono text-[9px] ${
                  isActive ? 'text-[#F4C95D]' : 'text-[#64748B]'
                }`}
              >
                {proj.number}
              </span>
              <span className="truncate">{proj.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Main Live Browser Preview Window ─────────────────────── */}
      <div className="relative z-10">
        <LiveWebsitePreview
          key={activeProject.id}
          url={activeProject.liveUrl}
          title={activeProject.name}
          fallbackImage={activeProject.image}
          autoLoad={true}
          showDeviceControls={true}
          heightClass="h-[340px] sm:h-[420px] md:h-[460px]"
          isFeatured={true}
          className="shadow-2xl hover:border-[#4338CA]/40"
        />
      </div>

      {/* ─── Project Context & Action Bar ─────────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1 max-w-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-wider">
              {activeProject.category}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified Client
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-[#131B2E]">
            {activeProject.name}
          </h4>
          <p className="text-xs text-[#64748B] line-clamp-1">
            {activeProject.description}
          </p>
        </div>

        {/* Capability Tags + Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5">
            {activeProject.capabilities.map((cap) => (
              <span
                key={cap}
                className="text-[10px] font-semibold bg-[#FAF7F2] text-[#475569] border border-[#E2E8F0] px-2 py-0.5 rounded-md"
              >
                {cap}
              </span>
            ))}
          </div>

          <Link
            href={`/projects/${activeProject.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] px-2.5 py-1.5 rounded-lg hover:bg-[#FAF7F2] transition-colors"
          >
            <span>Case Study</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
