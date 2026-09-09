'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Globe,
  FileText,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Users,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Bell,
  Smartphone,
  Check,
  Eye,
  ArrowRight,
  Upload,
  Send,
  FileSpreadsheet,
  Award,
  BookOpen,
  Printer,
  ChevronRight,
  Lock,
  RotateCcw,
  X,
  Bus,
  Navigation,
  Search,
  Radio,
  Download,
} from 'lucide-react';
import type { PublicTransportMapModel } from '@/lib/publicTransportUtils';

// Lazy load the full ERP simulator modal to optimize initial page bundle
const ErpLiveDemo = dynamic(() => import('@/components/ui/ErpLiveDemo'), {
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-[#031B3A] text-white p-8 text-center">
      <div className="w-8 h-8 border-3 border-[#F4C542] border-t-transparent rounded-full animate-spin mb-3" />
      <div className="text-xs font-extrabold uppercase tracking-wider text-white">
        Loading Live ERP Simulator...
      </div>
      <div className="text-[11px] text-slate-400 mt-1 font-mono">
        Initializing 6-role multi-portal database
      </div>
    </div>
  ),
  ssr: false,
});

// Lazy load the Leaflet interactive map with zero SSR
const PublicTransportRouteMap = dynamic(
  () => import('@/components/schools/maps/PublicTransportRouteMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] bg-slate-100/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-slate-200 animate-pulse">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          Initializing Interactive School Transport Network...
        </span>
        <span className="text-[11px] text-slate-500 mt-1">
          Loading OpenStreetMap tiles, road geometries &amp; live school bus simulation
        </span>
      </div>
    ),
  }
);

export type SolutionTabId = 'website' | 'cms' | 'erp' | 'transport' | 'mobile';

interface SchoolVisualShowcaseProps {
  initialTab?: SolutionTabId;
}

function DemoDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 text-slate-600 text-[10px] font-semibold border border-slate-200/80 select-none ${className}`}
      role="note"
      aria-label="Disclaimer: Interactive demo with sample school data"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
      <span>Interactive Demo — Sample School Data</span>
    </div>
  );
}

const DEMO_TRANSPORT_MODEL: PublicTransportMapModel = {
  isEnabled: true,
  isConfigured: true,
  school: {
    name: 'Ekaagra Model Campus Hub',
    coordinates: { latitude: 26.6538, longitude: 84.9031 },
    address: 'Bairiya Main Road, Motihari, Bihar 845401',
  },
  totalActiveRoutes: 4,
  totalStops: 4,
  areasServed: ['Piprakothi', 'Turkaulia', 'Chiraia', 'Sugauli', 'Banjaria', 'Motihari'],
  routes: [
    {
      id: 'route-r001',
      routeCode: 'R-001',
      routeName: 'Piprakothi-School',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#E53935',
      isActive: true,
      approximateDistanceKm: 18,
      estimatedDurationMinutes: 40,
      stopCount: 1,
      stopsWithCoordinatesCount: 1,
      stops: [
        {
          id: 'stop-piprakothi',
          stopName: 'Piprakothi',
          sequenceOrder: 1,
          pickupTime: '07:30 AM',
          dropTime: '03:50 PM',
          coordinates: { latitude: 26.5463, longitude: 84.9455 },
          landmarkAddress: 'NH-28 Piprakothi Chowk Junction',
          hasValidCoordinates: true,
        },
      ],
    },
    {
      id: 'route-r002',
      routeCode: 'R-002',
      routeName: 'Turkaulia-School',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#1976D2',
      isActive: true,
      approximateDistanceKm: 14,
      estimatedDurationMinutes: 30,
      stopCount: 1,
      stopsWithCoordinatesCount: 1,
      stops: [
        {
          id: 'stop-turkaulia',
          stopName: 'Turkaulia',
          sequenceOrder: 1,
          pickupTime: '07:15 AM',
          dropTime: '04:05 PM',
          coordinates: { latitude: 26.6186, longitude: 84.8294 },
          landmarkAddress: 'Turkaulia Gandhi Smarak Chowk',
          hasValidCoordinates: true,
        },
      ],
    },
    {
      id: 'route-r003',
      routeCode: 'R-003',
      routeName: 'Route 3 (Chiraia)',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#2EAD4B',
      isActive: true,
      approximateDistanceKm: 16,
      estimatedDurationMinutes: 35,
      stopCount: 1,
      stopsWithCoordinatesCount: 1,
      stops: [
        {
          id: 'stop-chiraia',
          stopName: 'Chiraia',
          sequenceOrder: 1,
          pickupTime: '07:20 AM',
          dropTime: '03:55 PM',
          coordinates: { latitude: 26.671, longitude: 85.021 },
          landmarkAddress: 'Chiraia Central Market Chowk',
          hasValidCoordinates: true,
        },
      ],
    },
    {
      id: 'route-r004',
      routeCode: 'R-004',
      routeName: 'Route 4 (Sugauli)',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#F57C00',
      isActive: true,
      approximateDistanceKm: 22,
      estimatedDurationMinutes: 45,
      stopCount: 1,
      stopsWithCoordinatesCount: 1,
      stops: [
        {
          id: 'stop-sugauli',
          stopName: 'Sugauli / Banjaria',
          sequenceOrder: 1,
          pickupTime: '07:10 AM',
          dropTime: '04:15 PM',
          coordinates: { latitude: 26.735, longitude: 84.785 },
          landmarkAddress: 'NH-527D Sugauli Highway Crossing',
          hasValidCoordinates: true,
        },
      ],
    },
  ],
};

const INITIAL_NOTICES = [
  {
    id: '1',
    title: 'CBSE Board Examination Schedule & Admit Card Distribution',
    category: 'Academic',
    date: 'Today, 10:30 AM',
    status: 'Live on Website',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    hasAttachment: true,
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting (PTM) for Classes I to XII',
    category: 'Event',
    date: 'Yesterday',
    status: 'Live on Website',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    hasAttachment: false,
  },
  {
    id: '3',
    title: 'Inter-School Sports Meet 2026 Registration Guidelines',
    category: 'Sports',
    date: '02 Sep 2026',
    status: 'Live on Website',
    badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    hasAttachment: true,
  },
];

const INITIAL_ATTENDANCE = [
  { roll: 1, name: 'Aarav Sharma', class: 'X-A', status: 'Present' as const },
  { roll: 2, name: 'Ananya Verma', class: 'X-A', status: 'Present' as const },
  { roll: 3, name: 'Rohan Gupta', class: 'X-A', status: 'Absent' as const },
  { roll: 4, name: 'Priya Singh', class: 'X-A', status: 'Present' as const },
  { roll: 5, name: 'Aditya Kumar', class: 'X-A', status: 'Present' as const },
];

export default function SchoolVisualShowcase({
  initialTab = 'website',
}: SchoolVisualShowcaseProps) {
  const [activeTab, setActiveTab] = useState<SolutionTabId>(initialTab);
  const [showFullErpModal, setShowFullErpModal] = useState(false);

  // Sync tab with URL hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['website', 'cms', 'erp', 'transport', 'mobile'].includes(hash)) {
        setActiveTab(hash as SolutionTabId);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleSelectTab = useCallback((tab: SolutionTabId) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${tab}`);
    }
  }, []);

  // Modal Escape key listener and body scroll lock
  useEffect(() => {
    if (!showFullErpModal) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullErpModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFullErpModal]);

  // --- Interactive States for CMS Simulator ---
  const [cmsNotices, setCmsNotices] = useState(INITIAL_NOTICES);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeCat, setNewNoticeCat] = useState('Urgent Notice');
  const [attachedPdf, setAttachedPdf] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
  const [noticePublishedSuccess, setNoticePublishedSuccess] = useState(false);

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim()) {
      setValidationError('Please enter a notice headline before publishing.');
      return;
    }
    setValidationError('');

    const newEntry = {
      id: Date.now().toString(),
      title: newNoticeTitle.trim(),
      category: newNoticeCat,
      date: 'Just now',
      status: 'Live on Website',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      hasAttachment: Boolean(attachedPdf),
    };

    setCmsNotices([newEntry, ...cmsNotices]);
    setNewNoticeTitle('');
    setAttachedPdf(null);
    setNoticePublishedSuccess(true);
    setTimeout(() => setNoticePublishedSuccess(false), 3500);
  };

  const handleResetCms = () => {
    setCmsNotices(INITIAL_NOTICES);
    setNewNoticeTitle('');
    setAttachedPdf(null);
    setValidationError('');
    setNoticePublishedSuccess(false);
  };

  // --- Interactive States for ERP Preview ---
  const [erpActiveModule, setErpActiveModule] = useState<'attendance' | 'fees' | 'sis' | 'cbse'>('attendance');
  const [mockAttendance, setMockAttendance] = useState(INITIAL_ATTENDANCE);

  const toggleAttendanceStatus = (index: number) => {
    setMockAttendance((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' }
          : item
      )
    );
  };

  const presentCount = mockAttendance.filter((s) => s.status === 'Present').length;
  const absentCount = mockAttendance.length - presentCount;

  return (
    <section
      id="visual-demo"
      className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-white relative scroll-mt-12 overflow-hidden"
    >
      <div className="site-container space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Eye className="w-3.5 h-3.5 text-[#4338CA]" aria-hidden="true" />
            <span>INTERACTIVE DEMONSTRATION SUITE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            See the Platform in Action
          </h2>

          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Switch between tabs to test the interfaces, notice publishing, student roll call, transport tracking, and mobile apps.
          </p>
        </div>

        {/* 5 Compact Solution Tabs */}
        <div
          role="tablist"
          aria-label="Platform Demonstrations"
          className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto p-1.5 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] shadow-2xs"
        >
          {[
            {
              id: 'website' as SolutionTabId,
              label: 'Website',
              icon: Globe,
              subtitle: 'Public Portal',
            },
            {
              id: 'cms' as SolutionTabId,
              label: 'CMS',
              icon: FileText,
              subtitle: 'Staff Publishing',
            },
            {
              id: 'erp' as SolutionTabId,
              label: 'ERP',
              icon: Database,
              subtitle: '6-Role System',
            },
            {
              id: 'transport' as SolutionTabId,
              label: 'Transport / Modules',
              icon: Bus,
              subtitle: 'Live Fleet GPS',
            },
            {
              id: 'mobile' as SolutionTabId,
              label: 'Mobile',
              icon: Smartphone,
              subtitle: 'Parent & Staff Apps',
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelectTab(tab.id)}
                className={`flex-1 min-w-[130px] p-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer min-h-[48px] ${
                  isActive
                    ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20'
                    : 'text-[#64748B] hover:text-[#131B2E] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-[#F4C542]' : 'text-[#4338CA]'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-xs sm:text-sm font-bold block truncate">{tab.label}</span>
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-[#94A3B8]'}`}>
                  {tab.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: WEBSITE DEMO ────────────────────────────────────────────── */}
        {activeTab === 'website' && (
          <div
            id="panel-website"
            role="tabpanel"
            aria-labelledby="tab-website"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-7 space-y-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Public Institutional Portal</span>
                  </span>
                  <DemoDisclaimer />
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                  High-Authority School Website Designed for Admissions
                </h3>

                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Fast, responsive, and compliant with all CBSE/ICSE regulatory disclosure requirements. Built mobile-first to capture parent admission enquiries with one click.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Mandatory Disclosures', desc: 'CBSE inspection PDFs' },
                    { label: 'Sub-Second Speed', desc: 'Optimized for 4G phones' },
                    { label: 'WhatsApp Capture', desc: 'Instant admission queries' },
                    { label: 'Campus Tour', desc: 'High-res labs & classrooms' },
                    { label: 'Principal Message', desc: 'Institutional vision' },
                    { label: 'Cloud Hosting & SSL', desc: '99.9% guaranteed uptime' },
                  ].map((feat, i) => (
                    <div key={i} className="p-2 rounded-xl bg-white border border-[#E2E8F0]">
                      <div className="font-bold text-xs text-[#131B2E] flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">{feat.label}</span>
                      </div>
                      <div className="text-[10px] text-[#64748B] mt-0.5 truncate">{feat.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://roshani-public-school.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20 min-h-[42px]"
                  >
                    <span>Inspect Live School Website</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                  <Link
                    href="/projects/roshani-public-school"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#E2E8F0] transition-all min-h-[42px]"
                  >
                    <span>Case Study</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              {/* Visual Website Mockup */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-slate-900 text-left">
                  <div className="bg-slate-800 px-3 py-1.5 flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="bg-slate-900 px-3 py-0.5 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1 border border-slate-700">
                      <Lock className="w-2.5 h-2.5 text-emerald-400" />
                      <span>roshani-public-school.vercel.app</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">Live</span>
                  </div>
                  <div className="relative aspect-[4/3] bg-white overflow-hidden group">
                    <Image
                      src="/images/projects/roshani-public-school/roshani-2.png"
                      alt="Roshani Public School website preview"
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 500px"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: CMS DEMO ────────────────────────────────────────────────── */}
        {activeTab === 'cms' && (
          <div
            id="panel-cms"
            role="tabpanel"
            aria-labelledby="tab-cms"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
                      <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Staff CMS Admin Panel</span>
                    </span>
                    <DemoDisclaimer />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Instant Notice Publishing (No Coding Required)
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    School clerks or teachers can post circulars, exam notices, and event photos to the public website in seconds.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetCms}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Demo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* CMS Input Form */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs font-bold text-[#131B2E]">
                    <span>Publish New Notice</span>
                    <span className="text-[10px] text-[#64748B] font-mono">Role: School Clerk</span>
                  </div>

                  <form onSubmit={handlePublishNotice} className="space-y-3">
                    <div>
                      <label htmlFor="cms-headline" className="block text-xs font-bold text-[#131B2E] mb-1">
                        Notice Headline
                      </label>
                      <input
                        id="cms-headline"
                        type="text"
                        value={newNoticeTitle}
                        onChange={(e) => {
                          setNewNoticeTitle(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="e.g. Autumn Break Dates or Annual Sports Meet"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#131B2E] focus:outline-none focus:ring-2 focus:ring-[#4338CA] min-h-[38px]"
                      />
                      {validationError && (
                        <span className="block text-[11px] text-rose-600 mt-1 font-medium">
                          {validationError}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="cms-category" className="block text-xs font-bold text-[#131B2E] mb-1">
                          Category
                        </label>
                        <select
                          id="cms-category"
                          value={newNoticeCat}
                          onChange={(e) => setNewNoticeCat(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs text-[#131B2E] min-h-[38px]"
                        >
                          <option>Urgent Notice</option>
                          <option>Academic</option>
                          <option>Holiday Schedule</option>
                          <option>Sports &amp; Culture</option>
                          <option>Fee Reminder</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#131B2E] mb-1">
                          Attachment
                        </label>
                        <button
                          type="button"
                          onClick={() => setAttachedPdf(attachedPdf ? null : 'notice-doc.pdf')}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#FAF7F2] border border-dashed border-[#CBD5E1] text-[11px] text-[#64748B] flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                        >
                          <Upload className="w-3 h-3 text-[#4338CA]" />
                          <span>{attachedPdf ? 'PDF Added ✓' : 'Add PDF'}</span>
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[40px]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish Instantly to Website</span>
                    </button>

                    {noticePublishedSuccess && (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 text-center animate-in fade-in">
                        ✓ Live on website notice marquee!
                      </div>
                    )}
                  </form>
                </div>

                {/* Real-Time Sync Feed */}
                <div className="lg:col-span-7 bg-white rounded-2xl border-2 border-indigo-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs font-bold text-[#4338CA]">
                    <span>Public School Website Notice Board (Live Feed)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Live Sync
                    </span>
                  </div>

                  <div className="space-y-2">
                    {cmsNotices.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${n.badgeColor}`}>
                              {n.category}
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono">{n.date}</span>
                            {n.hasAttachment && (
                              <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded font-mono">
                                PDF
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-[#131B2E]">{n.title}</div>
                        </div>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                          {n.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: ERP DEMO ────────────────────────────────────────────────── */}
        {activeTab === 'erp' && (
          <div
            id="panel-erp"
            role="tabpanel"
            aria-labelledby="tab-erp"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <div className="bg-[#031B3A] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-xl space-y-6 text-left">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4C542]/20 text-[#F4C542] text-xs font-extrabold border border-[#F4C542]/30">
                      <Database className="w-3.5 h-3.5" />
                      <span>Academic Enterprise Resource Planning</span>
                    </span>
                    <DemoDisclaimer className="bg-white/10 text-white/90 border-white/20" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    6-Role School ERP Management System
                  </h3>
                  <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
                    Automate daily roll call, fee collections with digital receipts, CBSE report cards, and student records across 6 dedicated user portals.
                  </p>
                </div>

                <div className="shrink-0 flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowFullErpModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#F4C542] hover:bg-[#eab82e] text-[#031B3A] font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer min-h-[42px]"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Live ERP Simulator</span>
                  </button>
                  <a
                    href="https://roshani-public-school-erp.vercel.app/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition-all min-h-[42px]"
                  >
                    <span>External Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* 6 Role Pills */}
              <div className="pt-2 border-t border-white/10">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
                  {[
                    { role: 'Admin', desc: 'Full institutional control' },
                    { role: 'Principal', desc: 'Academic oversight & audits' },
                    { role: 'Teacher', desc: 'Attendance & mark entry' },
                    { role: 'Accountant', desc: 'Fee collection & receipts' },
                    { role: 'Parent', desc: 'Fees, attendance & notices' },
                    { role: 'Student', desc: 'Timetable, marks & homework' },
                  ].map((p, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-extrabold text-white">{p.role}</div>
                      <div className="text-[9px] text-white/60">{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Module Preview */}
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-5 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                <div className="text-sm font-extrabold text-[#131B2E]">
                  Test Interactive Module Workflows:
                </div>
                <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-[#E2E8F0]">
                  {[
                    { id: 'attendance', label: 'Roll Call', icon: Users },
                    { id: 'fees', label: 'Fee Receipt', icon: CreditCard },
                    { id: 'sis', label: 'Student SIS', icon: GraduationCap },
                    { id: 'cbse', label: 'CBSE Marksheet', icon: BookOpen },
                  ].map((mod) => {
                    const ModIcon = mod.icon;
                    const isModActive = erpActiveModule === mod.id;
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => setErpActiveModule(mod.id as any)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[34px] ${
                          isModActive
                            ? 'bg-[#4338CA] text-white shadow-xs'
                            : 'text-[#64748B] hover:text-[#131B2E]'
                        }`}
                      >
                        <ModIcon className="w-3.5 h-3.5" />
                        <span>{mod.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Attendance Preview */}
              {erpActiveModule === 'attendance' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2.5">
                    <div className="flex items-center justify-between border-b pb-2 text-xs font-bold text-[#131B2E]">
                      <span>Class X-A Daily Attendance (Click to toggle status)</span>
                      <span className="text-[10px] text-slate-500">Session 2026-27</span>
                    </div>
                    {mockAttendance.map((student, idx) => (
                      <button
                        key={student.roll}
                        type="button"
                        onClick={() => toggleAttendanceStatus(idx)}
                        className={`w-full p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left ${
                          student.status === 'Present'
                            ? 'bg-white border-emerald-200'
                            : 'bg-rose-50 border-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-xs font-bold text-[#131B2E]">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">
                            {student.roll}
                          </span>
                          <span>{student.name}</span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            student.status === 'Present'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {student.status} (Toggle)
                        </span>
                      </button>
                    ))}
                    <div className="pt-1 flex items-center justify-between text-xs font-bold">
                      <span>Present: {presentCount} / {mockAttendance.length}</span>
                      <span className={absentCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {absentCount > 0 ? `${absentCount} Absent — Parent WhatsApp queued` : '100% Attendance'}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2 text-xs text-[#64748B]">
                    <div className="font-extrabold text-[#4338CA] uppercase">Daily Attendance Engine:</div>
                    <p className="leading-relaxed">
                      Teachers take attendance from mobile in under a minute. Instantly updates principal dashboard, triggers parent absence notifications, and calculates CBSE statutory percentages.
                    </p>
                    <div className="pt-2 border-t text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                      <strong>Biometric Ready:</strong> Syncs with RFID student ID cards and biometric fingerprint gates.
                    </div>
                  </div>
                </div>
              )}

              {/* Fees Receipt Preview */}
              {erpActiveModule === 'fees' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-3">
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between border-b pb-1 font-extrabold text-[#131B2E]">
                        <span>OFFICIAL FEE RECEIPT #RPS/2026/0942</span>
                        <span className="text-emerald-700">PAID (UPI)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                        <div>Student: <strong>Aarav Sharma (Class X-A)</strong></div>
                        <div>Term: <strong>Term II (Jul - Sep)</strong></div>
                      </div>
                      <div className="border-t pt-1 space-y-1 text-[11px]">
                        <div className="flex justify-between"><span>Tuition Fee</span><span className="font-mono">₹4,500</span></div>
                        <div className="flex justify-between"><span>Science Lab &amp; Computer Fee</span><span className="font-mono">₹600</span></div>
                        <div className="flex justify-between"><span>Examination Fee</span><span className="font-mono">₹400</span></div>
                        <div className="flex justify-between font-extrabold text-[#131B2E] border-t pt-1 text-xs">
                          <span>Total Paid</span>
                          <span className="font-mono text-[#4338CA]">₹5,500</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2 text-xs text-[#64748B]">
                    <div className="font-extrabold text-[#4338CA] uppercase">Fee Automation:</div>
                    <p className="leading-relaxed">
                      Configure custom fee heads, sibling concessions, late fines, and print thermal slips or A4 GST receipts.
                    </p>
                  </div>
                </div>
              )}

              {/* SIS Records Preview */}
              {erpActiveModule === 'sis' && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="font-extrabold text-sm text-[#131B2E]">Student Information System (SIS) Master Dossier</div>
                  <p className="text-[#64748B]">
                    Complete academic history from Class Nursery to XII: Guardian Aadhaar links, medical records, digital document locker, and 1-click Transfer Certificate (TC) generator.
                  </p>
                </div>
              )}

              {/* CBSE Grading Preview */}
              {erpActiveModule === 'cbse' && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 space-y-2 text-xs animate-in fade-in duration-150">
                  <div className="font-extrabold text-sm text-[#131B2E]">CBSE Examination &amp; Automated Marksheet Engine</div>
                  <p className="text-[#64748B]">
                    Teachers enter marks once; system calculates percentiles, co-scholastic grading, class rankings, and generates printable PDF report cards with institutional crest.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: TRANSPORT / MODULES DEMO ────────────────────────────────── */}
        {activeTab === 'transport' && (
          <div
            id="panel-transport"
            role="tabpanel"
            aria-labelledby="tab-transport"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <Bus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live School Bus Route &amp; Transit Network</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                      Zero Google Maps API Bills
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Interactive Fleet GPS &amp; Public Route Finder
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Parents can inspect bus routes, pickup stops, and morning/afternoon timings directly on your website before taking admission.
                  </p>
                </div>
              </div>

              {/* Embedded Interactive Transport Map */}
              <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-md overflow-hidden p-2 sm:p-3">
                <div className="min-h-[500px] h-[520px]">
                  <PublicTransportRouteMap
                    model={DEMO_TRANSPORT_MODEL}
                    schoolBrandingColor="#4338CA"
                    className="h-full border-none shadow-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 5: MOBILE DEMO ──────────────────────────────────────────────── */}
        {activeTab === 'mobile' && (
          <div
            id="panel-mobile"
            role="tabpanel"
            aria-labelledby="tab-mobile"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm space-y-6 text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#4338CA] text-xs font-bold border border-indigo-200">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Native Mobile Applications</span>
                    </span>
                    <DemoDisclaimer />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
                    Parent Android App &amp; Teacher Companion App
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Direct access for parents to view daily attendance, pay fees via UPI, check report cards, and receive urgent circulars on Android smartphones.
                  </p>
                </div>

                <Link
                  href="/schools/configure?plan=school-complete"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4338CA] text-white text-xs font-bold uppercase rounded-xl hover:bg-[#3730A3] transition-colors shrink-0"
                >
                  <span>Inquire About Mobile Apps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Mobile Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#131B2E]">Parent Push Alerts</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Instant alerts when student is marked absent, fee due reminders, exam schedules, and holiday announcements.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#131B2E]">1-Click UPI Fee Payments</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Parents can pay school fees securely via PhonePe, Google Pay, or NetBanking with immediate PDF receipt download.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#131B2E]">Teacher Roll Call App</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Fast mobile roll call and marks entry designed to work seamlessly even on slow school Wi-Fi connections.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL: FULL INTERACTIVE ERP SIMULATOR ──────────────────────────── */}
        {showFullErpModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="erp-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFullErpModal(false);
            }}
          >
            <div className="relative w-full max-w-6xl h-[92vh] max-h-[900px] bg-[#031B3A] rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col">
              <div className="bg-[#021329] px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  <span
                    id="erp-modal-title"
                    className="text-xs font-bold text-white uppercase tracking-wider font-mono"
                  >
                    Live School ERP Sandbox (Interactive 6-Role Simulator)
                  </span>
                  <DemoDisclaimer className="hidden sm:inline-flex bg-white/10 text-white/90 border-white/20" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFullErpModal(false)}
                    aria-label="Close ERP simulator modal"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer min-h-[32px] flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto relative">
                <ErpLiveDemo />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
