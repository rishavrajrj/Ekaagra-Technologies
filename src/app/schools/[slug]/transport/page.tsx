import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Bus,
  ArrowLeft,
  GraduationCap,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Navigation,
} from 'lucide-react';
import { getSchoolPublicTransportData } from '@/lib/schoolTenant';
import PublicTransportRouteMap from '@/components/schools/maps/PublicTransportRouteMap';

interface TransportPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ embed?: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: TransportPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getSchoolPublicTransportData(slug);
  if (!data || !data.transport.isEnabled) {
    return {
      title: 'School Transport | Ekaagra School Platform',
      description: 'Official school transport route network and pickup locations.',
    };
  }

  const schoolName = data.school.display_name || data.school.name;
  return {
    title: `School Transport & Bus Routes | ${schoolName}`,
    description: `Explore the school bus routes, designated pickup stops, and transit schedules for ${schoolName}.`,
  };
}

export default async function SchoolTransportPublicPage({ params, searchParams }: TransportPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isEmbed = resolvedSearchParams.embed === 'true' || resolvedSearchParams.embed === '1';

  const data = await getSchoolPublicTransportData(slug);

  // If school doesn't exist or transport is not enabled, do not expose public transport page
  if (!data || !data.transport.isEnabled) {
    notFound();
  }

  const { school, profile, branding, transport } = data;
  const schoolName = school.display_name || school.name;
  const primaryColor = (branding?.primary_color as string) || '#4338CA';
  const schoolAddress = (profile?.address_line1 as string) || 'Main Campus';
  const city = (profile?.city as string) || 'Motihari';
  const state = (profile?.state_province as string) || 'Bihar';

  // Embed Mode: Clean full-bleed interactive map for official school website iframe integration
  if (isEmbed) {
    return (
      <div className="w-full h-screen min-h-[550px] p-2 bg-transparent">
        <PublicTransportRouteMap
          model={transport}
          schoolBrandingColor={primaryColor}
          className="h-full border-none shadow-none rounded-2xl"
        />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen flex flex-col overflow-x-hidden">
      {/* 1. Institutional Top Navigation */}
      <header className="border-b border-[#E2E8F0] bg-white sticky top-0 z-30 shadow-2xs">
        <div className="site-container py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/schools/${slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to School</span>
            </Link>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-xs sm:text-sm text-[#131B2E] truncate max-w-xs">
                {schoolName}
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Official Transport Network
            </span>
          </div>
        </div>
      </header>

      {/* 2. Public Page Header (Requirement 1 & 16) */}
      <section className="py-10 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-[#4338CA] text-[11px] font-extrabold tracking-wider uppercase">
                <Bus className="w-3.5 h-3.5" />
                <span>School Transport • Safe Rides, Brighter Tomorrows</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
                Our Bus Routes
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Explore the areas covered by our school transport network. Explore school transport routes and find the nearest pickup point for your area. View all active routes simultaneously on the map below, toggle specific bus lines, and inspect designated pickup and drop stops.
              </p>
            </div>

            {/* Real Data Metrics Summary (Requirement 16) */}
            {transport.isConfigured && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs shrink-0">
                <div className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center">
                  <span className="text-base font-extrabold text-[#131B2E] block">
                    {transport.totalActiveRoutes}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Active Routes
                  </span>
                </div>

                <div className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center">
                  <span className="text-base font-extrabold text-[#131B2E] block">
                    {transport.totalStops}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pickup Stops
                  </span>
                </div>

                {transport.areasServed.length > 0 && (
                  <div className="px-3.5 py-2 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] text-center">
                    <span className="text-base font-extrabold text-[#131B2E] block">
                      {transport.areasServed.length}+
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Areas Served
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Hero: Single Combined Interactive Map (Requirement 2) */}
      <main className="flex-1 py-8">
        <div className="site-container max-w-7xl mx-auto space-y-6">
          <PublicTransportRouteMap
            model={transport}
            schoolBrandingColor={primaryColor}
          />

          {/* Transport Guidance & Parent Safety Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-[#131B2E]">
                <Clock className="w-4 h-4 text-[#4338CA]" />
                <span>Punctual Transit</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Students should arrive at their assigned stop 5 minutes prior to scheduled pickup. Timings reflect standard traffic conditions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-[#131B2E]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supervised Safety</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All buses follow strict institutional safety guidelines with designated staff attendants, authorized stops, and emergency communication protocols.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 font-extrabold text-[#131B2E]">
                <Navigation className="w-4 h-4 text-[#4338CA]" />
                <span>Route Inquiries</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                For new admissions seeking bus enrollment or stop changes, please contact the school administrative office at {schoolAddress}, {city}.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-slate-500">
        <div className="site-container">
          <p>
            © {new Date().getFullYear()} {schoolName} • Transport Network powered by Ekaagra School Platform
          </p>
        </div>
      </footer>
    </div>
  );
}
