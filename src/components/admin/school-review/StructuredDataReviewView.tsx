'use client';

import React, { useState } from 'react';
import type { SchoolProject, UniversalIntakeData } from '@/lib/types';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';
import {
  GraduationCap,
  Building2,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface StructuredDataReviewViewProps {
  project: SchoolProject;
  intakePayload: UniversalIntakeData;
  websiteData: SchoolWebsiteData;
  onEditOverride: (key: string, label: string, currentValue: any) => void;
  onApproveRequirement?: (key: string) => void;
}

type StructuredTab = 'academics' | 'facilities' | 'fees' | 'campuses';

export default function StructuredDataReviewView({
  project,
  intakePayload,
  websiteData,
  onEditOverride,
  onApproveRequirement,
}: StructuredDataReviewViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<StructuredTab>('academics');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract structured datasets
  const academicsData = {
    submitted: {
      affiliationBoard: (intakePayload.schoolProfile as any)?.affiliationBoard || intakePayload.schoolProfile?.board || (intakePayload as any).academics?.affiliationBoard || 'Not provided',
      curriculum: (intakePayload as any).academics?.curriculum || (intakePayload as any).curriculum || 'Standard',
      gradeLevelsOffered: (intakePayload as any).academics?.gradeLevelsOffered || (intakePayload as any).gradeLevelsOffered || (intakePayload.schoolProfile as any)?.gradeLevelsOffered || 'N/A',
      streamsOffered: (intakePayload as any).academics?.streamsOffered || (intakePayload as any).streams || [],
      keySubjects: (intakePayload as any).academics?.keySubjects || (intakePayload as any).academics?.subjectList || [],
      academicCalendar: (intakePayload as any).academics?.academicCalendar || (intakePayload as any).calendarEvents || [],
    },
    actual: {
      board: (websiteData as any).profile?.affiliationBoard || intakePayload.schoolProfile?.board || 'CBSE',
      gradeRange: (websiteData.academics.classesOffered && websiteData.academics.classesOffered.length > 0)
        ? websiteData.academics.classesOffered.join(', ')
        : 'Pre-KG to Grade 12',
      curriculumDescription: websiteData.academics?.curriculumSummary || 'Comprehensive curriculum fostering intellectual and moral excellence.',
      streams: websiteData.academics?.streams || [],
      departments: (websiteData.academics as any)?.departments || [],
      calendar: (websiteData.academics as any)?.academicCalendar || [],
    },
  };

  const facilitiesData = {
    submitted: {
      facilitiesList: (intakePayload as any).facilities?.facilitiesList || (intakePayload as any).facilitiesList || (intakePayload as any).amenities || [],
      smartClassrooms: Boolean((intakePayload as any).facilities?.smartClassrooms || (intakePayload as any).smartClassrooms),
      sportsFacilities: (intakePayload as any).facilities?.sportsFacilities || (intakePayload as any).sports || [],
      laboratories: (intakePayload as any).facilities?.laboratories || (intakePayload as any).labs || [],
      transportAvailable: Boolean((intakePayload as any).facilities?.transportAvailable || (intakePayload as any).transportation),
      safetyMeasures: (intakePayload as any).facilities?.safetyMeasures || (intakePayload as any).safety || [],
    },
    actual: {
      items: Array.isArray(websiteData.facilities) ? websiteData.facilities : (websiteData.facilities as any)?.items || [],
      categories: Array.isArray(websiteData.facilities)
        ? Array.from(new Set(websiteData.facilities.map((f: any) => f.category).filter(Boolean)))
        : [],
      highlights: Array.isArray(websiteData.facilities)
        ? websiteData.facilities.filter((f: any) => f.isAvailable).map((f: any) => f.name)
        : [],
    },
  };

  const feesData = {
    submitted: {
      admissionFee: (intakePayload as any).fees?.admissionFee || (intakePayload as any).admissions?.admissionFee || 'Contact School',
      annualTuitionRange: (intakePayload as any).fees?.annualTuitionRange || (intakePayload as any).tuitionRange || 'Provided in circular',
      feeCategories: (intakePayload as any).fees?.feeCategories || (intakePayload as any).feeCategories || [],
      paymentModes: (intakePayload as any).fees?.paymentModes || (intakePayload as any).paymentModes || ['Online / Net Banking', 'Cheque / DD'],
      refundPolicy: (intakePayload as any).fees?.refundPolicy || (intakePayload as any).refundPolicy || 'As per CBSE & State regulatory norms',
      feeCircularUrl: (intakePayload as any).fees?.feeCircularUrl || (intakePayload as any).documents?.feeScheduleUrl,
    },
    actual: {
      feeStructure: websiteData.fees?.items || [],
      admissionProcess: websiteData.admissions?.importantDates || [],
      feeNotes: websiteData.fees?.notes || 'Fees are payable quarterly. Detailed circular available in compliance section.',
    },
  };

  const campusesData = {
    submitted: {
      mainCampus: {
        name: intakePayload.schoolProfile?.schoolName || project.school_name,
        address: (intakePayload.schoolProfile as any)?.campusAddress || (intakePayload as any).contactInfo?.address || project.city,
        city: project.city,
        state: project.state,
        phone: (intakePayload as any).contactInfo?.primaryPhone || project.primary_contact_phone,
        email: (intakePayload as any).contactInfo?.primaryEmail || project.primary_contact_email,
      },
      branches: (intakePayload as any).campuses?.branches || (intakePayload as any).branches || [],
      isMultiCampus: Boolean((intakePayload as any).campuses?.isMultiCampus || ((intakePayload as any).branches && (intakePayload as any).branches.length > 0)),
    },
    actual: {
      campuses: (websiteData as any).campuses || [
        {
          id: 'main',
          name: websiteData.about?.title || project.school_name,
          address: websiteData.contact?.address || `${project.city || ''}, ${project.state || ''}`,
          phone: websiteData.contact?.primaryPhone || project.primary_contact_phone,
          email: websiteData.contact?.primaryEmail || project.primary_contact_email,
          isMainCampus: true,
        },
      ],
    },
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('academics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'academics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Academics &amp; Curriculum</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('facilities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'facilities'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Facilities &amp; Infrastructure</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('fees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'fees'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Fees &amp; Admissions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('campuses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'campuses'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Campuses &amp; Branches</span>
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search structured data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* ─── TAB 1: ACADEMICS ────────────────────────────────────────────────── */}
      {activeSubTab === 'academics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Submitted */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900">Customer Intake Academics</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Source: Intake</span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Affiliation Board</span>
                <span className="text-xs font-bold text-slate-800">{academicsData.submitted.affiliationBoard}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Grade Levels Offered</span>
                <span className="text-xs font-semibold text-slate-800">{String(academicsData.submitted.gradeLevelsOffered)}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Streams Offered (Senior Sec)</span>
                {Array.isArray(academicsData.submitted.streamsOffered) && academicsData.submitted.streamsOffered.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {academicsData.submitted.streamsOffered.map((stream: any, idx: number) => (
                      <span key={idx} className="text-[11px] font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                        {typeof stream === 'string' ? stream : stream.name || JSON.stringify(stream)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No specific stream list provided</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Academic Calendar Events</span>
                {Array.isArray(academicsData.submitted.academicCalendar) && academicsData.submitted.academicCalendar.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                    {academicsData.submitted.academicCalendar.map((ev: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-bold">{ev.title || ev.event}:</span> {ev.date || ev.month}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400 italic">Default academic term cycles will be generated</span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onEditOverride('academics.curriculum', 'Academic Curriculum & Streams', academicsData.submitted)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Override Academic Data</span>
              </button>
            </div>
          </div>

          {/* Website Generated */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900">Generated Website Representation</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Live Contract
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Board &amp; Range</span>
                <span className="text-xs font-bold text-slate-900">{academicsData.actual.board} &bull; {academicsData.actual.gradeRange}</span>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Curriculum Narrative</span>
                <p className="text-xs text-slate-700 leading-relaxed">{academicsData.actual.curriculumDescription}</p>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Normalized Streams</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {academicsData.actual.streams.length > 0 ? (
                    academicsData.actual.streams.map((stream: any, idx: number) => (
                      <span key={idx} className="text-[11px] font-bold bg-white px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-900">
                        {typeof stream === 'string' ? stream : stream.name || stream.title}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Science, Commerce, Arts (Humanities)</span>
                  )}
                </div>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Departments / Wings</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-700">
                  <span className="p-2 bg-white rounded border border-emerald-100">Pre-Primary Wing (EYFS)</span>
                  <span className="p-2 bg-white rounded border border-emerald-100">Primary Wing (Grade 1-5)</span>
                  <span className="p-2 bg-white rounded border border-emerald-100">Middle School (Grade 6-8)</span>
                  <span className="p-2 bg-white rounded border border-emerald-100">Senior Secondary (Grade 9-12)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onApproveRequirement && onApproveRequirement('academics.curriculum')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify Academics Layout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: FACILITIES ───────────────────────────────────────────────── */}
      {activeSubTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900">Submitted Amenities &amp; Infrastructure</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Source: Intake</span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Declared Facilities List</span>
                {Array.isArray(facilitiesData.submitted.facilitiesList) && facilitiesData.submitted.facilitiesList.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {facilitiesData.submitted.facilitiesList.map((item: any, idx: number) => (
                      <span key={idx} className="text-[11px] font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                        {typeof item === 'string' ? item : item.name || item.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 italic">No custom facility roster provided</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Smart Classrooms</span>
                  <span className={`text-xs font-bold ${facilitiesData.submitted.smartClassrooms ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {facilitiesData.submitted.smartClassrooms ? 'Enabled' : 'Standard'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Transport Fleet</span>
                  <span className={`text-xs font-bold ${facilitiesData.submitted.transportAvailable ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {facilitiesData.submitted.transportAvailable ? 'Available' : 'Not Requested'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Sports &amp; Safety</span>
                <p className="text-xs text-slate-700">
                  {facilitiesData.submitted.sportsFacilities.length > 0
                    ? `Sports: ${facilitiesData.submitted.sportsFacilities.join(', ')}`
                    : 'Standard campus play area & physical education program.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEditOverride('facilities.list', 'Campus Facilities List', facilitiesData.submitted)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override Facilities</span>
            </button>
          </div>

          {/* Website Generated */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900">Website Facilities Catalog</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {facilitiesData.actual.items.length || 6} Items
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {(facilitiesData.actual.items.length > 0
                ? facilitiesData.actual.items
                : [
                    { title: 'STEM & Robotics Lab', category: 'Academic', description: 'Hands-on experiential learning for coding and scientific discovery.' },
                    { title: 'Olympic Size Swimming Pool', category: 'Sports', description: 'Certified coaching and safety surveillance.' },
                    { title: 'Modern Digital Library', category: 'Academic', description: 'Over 10,000+ volumes, periodicals, and e-learning resources.' },
                    { title: 'GPS-Tracked Bus Fleet', category: 'Transport', description: 'Real-time parent tracking with trained attendants and speed governors.' },
                  ]
              ).map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title || item.name}</span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                        {item.category || 'Campus'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onApproveRequirement && onApproveRequirement('facilities.list')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Facilities Roster</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 3: FEES & ADMISSIONS ────────────────────────────────────────── */}
      {activeSubTab === 'fees' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900">Customer Intake Fee Rules</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Source: Intake</span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Registration &amp; Admission Fee</span>
                <span className="text-xs font-bold text-slate-800">{String(feesData.submitted.admissionFee)}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Fee Categories &amp; Slabs</span>
                {Array.isArray(feesData.submitted.feeCategories) && feesData.submitted.feeCategories.length > 0 ? (
                  <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                    {feesData.submitted.feeCategories.map((cat: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-bold">{cat.name || cat.grade}:</span> {cat.amount || cat.fee}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-500 italic">Annual fee schedule published via compliance circular</span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Refund &amp; Withdrawal Policy</span>
                <p className="text-xs text-slate-700">{feesData.submitted.refundPolicy}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEditOverride('fees.structure', 'Fee Structure & Rules', feesData.submitted)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override Fee Rules</span>
            </button>
          </div>

          {/* Website Generated */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900">Website Admissions Presentation</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Transparent &bull; Compliant
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Admission Workflow</span>
                <ol className="text-xs space-y-1.5 text-slate-700 list-decimal list-inside">
                  <li>Online Registration &amp; Form Submission</li>
                  <li>Campus Tour &amp; Student-Parent Interaction</li>
                  <li>Document Verification &amp; Provisional Offer</li>
                  <li>Fee Payment &amp; Enrollment Confirmation</li>
                </ol>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Statutory Fee Disclosure Notice</span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Fee structures comply with Department of Education guidelines. Detailed breakdown is available in Appendix IX Mandatory Public Disclosure.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onApproveRequirement && onApproveRequirement('fees.structure')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Fee Layout</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 4: CAMPUSES ─────────────────────────────────────────────────── */}
      {activeSubTab === 'campuses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900">Customer Intake Campus Location</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Source: Profile</span>
            </div>

            <div className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Campus Title &amp; Address</span>
                <span className="text-xs font-bold text-slate-900 block">{campusesData.submitted.mainCampus.name}</span>
                <span className="text-xs text-slate-600 mt-0.5 block">{campusesData.submitted.mainCampus.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Direct Phone</span>
                  <span className="text-xs font-semibold text-slate-800">{campusesData.submitted.mainCampus.phone || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Official Email</span>
                  <span className="text-xs font-semibold text-slate-800 truncate block">{campusesData.submitted.mainCampus.email || 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Branches Declared</span>
                <span className="text-xs text-slate-600">
                  {campusesData.submitted.isMultiCampus
                    ? `${campusesData.submitted.branches.length} additional branches declared`
                    : 'Single central campus institution'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onEditOverride('campuses.directory', 'Campuses & Branches', campusesData.submitted)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Override Campus Info</span>
            </button>
          </div>

          {/* Website Generated */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900">Website Campus Directory</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {campusesData.actual.campuses.length} Campus Registered
              </span>
            </div>

            <div className="space-y-3">
              {campusesData.actual.campuses.map((campus: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{campus.name}</span>
                    {campus.isMainCampus && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">Main Campus</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{campus.address}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono pt-1">
                    Phone: {campus.phone} &bull; Email: {campus.email}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onApproveRequirement && onApproveRequirement('campuses.directory')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verify Campus Information</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
