import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SchoolTransportMapEmbed from '@/components/schools/maps/SchoolTransportMapEmbed';

import {
  Building2,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Bell,
  ArrowRight,
  ExternalLink,
  Bus,
} from 'lucide-react';
import { getSchoolPublicData, getSchoolPublicTransportData } from '@/lib/schoolTenant';

interface SchoolSlugPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: SchoolSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSchoolPublicData(slug);
  if (!data) {
    return {
      title: 'School Not Found | Ekaagra School Platform',
      description: 'The requested school portal does not exist.',
    };
  }

  const schoolName = data.school.display_name || data.school.name;
  return {
    title: `${schoolName} | Official Portal`,
    description: `Official digital portal for ${schoolName}. Explore admissions, academics, notices, and facilities.`,
  };
}

export default async function SchoolSlugPage({ params }: SchoolSlugPageProps) {
  const { slug } = await params;
  const data = await getSchoolPublicData(slug);

  if (!data) {
    notFound();
  }

  const { school, profile, branding, academicSettings, notices, campuses } = data;

  // Fetch transport map data when transport is enabled
  const transportData = data.transportEnabled
    ? await getSchoolPublicTransportData(slug)
    : null;
  const schoolName = school.display_name || school.name;
  const legalName = school.legal_name || schoolName;
  const schoolCode = school.school_code || school.code;
  const affiliationNumber = school.affiliation_number || (profile?.affiliation_number as string) || null;
  const schoolId = school.school_id; // Canonical 11-digit UDISE+ School Code

  const primaryColor = (branding?.primary_color as string) || '#4338CA';
  const board = (profile?.accreditation_body as string) || (profile?.affiliation_number ? 'CBSE' : 'Recognized Board');
  const city = (profile?.city as string) || 'Motihari';
  const state = (profile?.state_province as string) || 'Bihar';
  const email = (profile?.primary_email as string) || 'info@school.edu';
  const phone = (profile?.primary_phone as string) || '9876543210';
  const address = (profile?.address_line1 as string) || 'Main Campus';

  const mainCampus = campuses?.find((c: any) => c.is_main_campus) || (campuses && campuses[0]) || null;
  const mainCampusMeta = (mainCampus?.metadata as Record<string, any>) || {};
  const profileMeta = (profile?.metadata as Record<string, any>) || {};
  const mainMapsLink = (
    (mainCampusMeta.googleMapsLink as string) ||
    (mainCampusMeta.googleMapsUrl as string) ||
    (mainCampus?.google_maps_url as string) ||
    (mainCampus?.googleMapsUrl as string) ||
    (mainCampus?.googleMapsLink as string) ||
    (profileMeta.googleMapsLink as string) ||
    (profileMeta.googleMapsUrl as string) ||
    (profile?.google_maps_url as string) ||
    (profile?.googleMapsUrl as string) ||
    ''
  ).trim();

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* 1. Institutional Header Banner */}
      <header className="border-b border-[#E2E8F0] bg-white shadow-xs">
        <div className="site-container py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] tracking-tight">
                  {schoolName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Active
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                {legalName} • Affiliated to {board}
              </p>
            </div>
          </div>

          {/* Canonical Identity Badges (Four Identifiers Model) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-700">
              <span className="text-slate-400 text-[9px] uppercase font-sans font-bold block">UDISE+ School Code</span>
              <span className="font-extrabold text-[#131B2E]">{schoolId}</span>
            </div>
            {schoolCode && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-700">
                <span className="text-slate-400 text-[9px] uppercase font-sans font-bold block">
                  {board === 'CBSE' || !board ? 'CBSE School No.' : `${board} School Code`}
                </span>
                <span className="font-bold text-[#131B2E]">{schoolCode}</span>
              </div>
            )}
            {affiliationNumber && (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-700">
                <span className="text-slate-400 text-[9px] uppercase font-sans font-bold block">
                  {board === 'CBSE' || !board ? 'CBSE Affiliation' : `${board} Affiliation`}
                </span>
                <span className="font-bold text-[#131B2E]">{affiliationNumber}</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-300 font-mono text-[11px] text-slate-700">
              <span className="text-slate-400 text-[9px] uppercase font-sans font-bold block">Public Slug</span>
              <span className="text-slate-600">/{school.slug}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="py-12 border-b border-[#E2E8F0] bg-warm-grid">
        <div className="site-container max-w-5xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="text-xs font-bold text-[#4338CA] uppercase tracking-wider block">
                  Institutional Master Record
                </span>
                <h2 className="text-2xl font-extrabold text-[#131B2E] mt-0.5">
                  Welcome to {schoolName}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {data.transportEnabled && (
                  <Link
                    href={`/schools/${slug}/transport`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4338CA] hover:bg-[#3730A3] shadow-xs transition-colors"
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>Bus Routes &amp; Transport</span>
                  </Link>
                )}
                <Link
                  href="/schools"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#4338CA] bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                >
                  <span>All Schools Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Campus Location</span>
                </div>
                <p className="font-medium text-[#131B2E]">{address}, {city}, {state}</p>
                {mainMapsLink && (
                  <div className="pt-0.5">
                    <a
                      href={mainMapsLink.startsWith('http') ? mainMapsLink : `https://${mainMapsLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline"
                      aria-label={`View ${schoolName} campus on Google Maps (opens in new tab)`}
                    >
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Official Email</span>
                </div>
                <p className="font-medium text-[#131B2E] truncate">{email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Phone className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Official Phone</span>
                </div>
                <p className="font-medium text-[#131B2E]">{phone}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#4338CA]" />
                  <span>Current Academic Session</span>
                </div>
                <p className="font-medium text-[#131B2E]">
                  {(academicSettings?.current_session_name as string) || '2026-2027'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Tenant Data Modules */}
      <section className="py-12">
        <div className="site-container max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notices Board */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#4338CA]" />
                  <h3 className="font-extrabold text-base text-[#131B2E]">
                    Official Notices &amp; Circulars
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Tenant: {schoolId}
                </span>
              </div>

              {notices && notices.length > 0 ? (
                <div className="space-y-2.5">
                  {notices.map((n, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs space-y-1"
                    >
                      <span className="font-bold text-[#131B2E] block">
                        {(n.title as string) || 'School Notice'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {(n.publish_date as string) || 'Today'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>All official notices published by {schoolName} will appear here.</p>
                </div>
              )}
            </div>

            {/* Campuses / Facilities */}
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#4338CA]" />
                  <h3 className="font-extrabold text-base text-[#131B2E]">
                    Campuses &amp; Infrastructure
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {campuses && campuses.length > 0
                    ? `${campuses.length} Campus${campuses.length > 1 ? 'es' : ''}`
                    : '1 Campus'}
                </span>
              </div>

              <div className="space-y-3">
                {campuses && campuses.length > 0 ? (
                  campuses.map((camp: any, idx: number) => {
                    const cMeta = (camp.metadata as Record<string, any>) || {};
                    const cMapsLink = (
                      (cMeta.googleMapsLink as string) ||
                      (cMeta.googleMapsUrl as string) ||
                      (camp.google_maps_url as string) ||
                      (camp.googleMapsUrl as string) ||
                      (camp.googleMapsLink as string) ||
                      (camp.is_main_campus ? mainMapsLink : '') ||
                      ''
                    ).trim();

                    const cAddressParts = [
                      camp.address_line1 || (camp.is_main_campus ? address : ''),
                      camp.city || city,
                      camp.state_province || state,
                      camp.postal_code,
                    ].filter(Boolean);

                    const cDisplayAddress =
                      cAddressParts.length > 0 ? cAddressParts.join(', ') : `${address}, ${city}, ${state}`;
                    const cFacilities =
                      Array.isArray(camp.facilities) && camp.facilities.length > 0
                        ? camp.facilities
                        : ['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Sports Ground'];

                    const cAcademicLevels = Array.isArray(cMeta.academicLevels)
                      ? cMeta.academicLevels
                      : (Array.isArray(camp.academicLevels) ? camp.academicLevels : []);
                    const cClassRange = (cMeta.classRange || camp.classRange || '').trim();
                    const cWingDesc = (cMeta.wingDescription || camp.wingDescription || '').trim();

                    return (
                      <div
                        key={camp.id || idx}
                        className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#131B2E] block">
                              {camp.name || (camp.is_main_campus ? 'Main Campus' : `Campus ${idx + 1}`)}
                            </span>
                            {cAcademicLevels.length > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4338CA] border border-indigo-200">
                                {cAcademicLevels.join(' & ')}
                                {cClassRange ? ` • ${cClassRange}` : ''}
                              </span>
                            )}
                          </div>
                          {camp.is_main_campus && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Main Campus
                            </span>
                          )}
                        </div>
                        {cWingDesc && (
                          <p className="text-[11px] text-[#4338CA] font-medium">{cWingDesc}</p>
                        )}
                        <p className="text-slate-600">{cDisplayAddress}</p>
                        {cMapsLink && (
                          <div className="pt-0.5">
                            <a
                              href={cMapsLink.startsWith('http') ? cMapsLink : `https://${cMapsLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline"
                              aria-label={`View on Google Maps and Get Directions to ${camp.name || 'Campus'} (opens in new tab)`}
                            >
                              <span>View on Google Maps / Get Directions</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            </a>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cFacilities.map((f: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] text-slate-700 font-medium"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs space-y-2">
                    <span className="font-bold text-sm text-[#131B2E] block">
                      Main Campus
                    </span>
                    <p className="text-slate-600">
                      {address}, {city}, {state}
                    </p>
                    {mainMapsLink && (
                      <div className="pt-0.5">
                        <a
                          href={mainMapsLink.startsWith('http') ? mainMapsLink : `https://${mainMapsLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:text-[#3730A3] hover:underline"
                          aria-label={`View on Google Maps and Get Directions to Main Campus (opens in new tab)`}
                        >
                          <span>View on Google Maps / Get Directions</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Smart Classrooms', 'Science Lab', 'Computer Lab', 'Library', 'Sports Ground'].map((f, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[10px] text-slate-700 font-medium"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* School Transport — Live Route Map (when enabled) */}
          {data.transportEnabled && transportData?.transport && (
            <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-[#131B2E]">
                      School Bus Routes &amp; Transport Network
                    </h3>
                    <p className="text-xs text-slate-500">
                      Explore live route maps, bus lines, and designated student pickup stops.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {transportData.transport.isConfigured && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        {transportData.transport.totalActiveRoutes} Routes
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {transportData.transport.totalStops} Stops
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/schools/${slug}/transport`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#131B2E] hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    <span>Full Transport Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Embedded Interactive Map */}
              <div className="rounded-2xl overflow-hidden border border-[#E2E8F0]" style={{ height: '420px' }}>
                <SchoolTransportMapEmbed
                  model={transportData.transport}
                  schoolBrandingColor={primaryColor}
                  className="h-full border-none shadow-none"
                />
              </div>
            </div>
          )}

          {/* Institutional Compliance Notice */}
          <div className="p-6 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-[#131B2E] block">
                Verified Multi-Tenant Institutional Boundary
              </span>
              <p className="text-[#64748B] leading-relaxed">
                This school portal is powered by the Ekaagra Technologies multi-tenant education engine.
                All student rosters, staff credentials, fee collections, and examination records are
                strictly isolated under canonical UDISE tenant identifier <strong className="font-mono text-[#131B2E]">{schoolId}</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
