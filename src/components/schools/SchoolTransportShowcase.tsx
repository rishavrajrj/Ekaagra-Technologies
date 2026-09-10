'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Bus,
  Navigation,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Radio,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import type { PublicTransportMapModel } from '@/lib/publicTransportUtils';

// Dynamically load the Leaflet interactive map with zero SSR to avoid window/document errors
const PublicTransportRouteMap = dynamic(
  () => import('@/components/schools/maps/PublicTransportRouteMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[640px] bg-slate-100/80 rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-slate-200 animate-pulse">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Initializing Interactive School Transport Network...
        </span>
        <span className="text-xs text-slate-500 mt-1">
          Loading OpenStreetMap tiles, road geometries &amp; live school bus simulation
        </span>
      </div>
    ),
  }
);

/**
 * Authentic 4-route interactive demonstration model
 * Centered at Motihari with routes extending to Piprakothi (South), Turkaulia (Southwest),
 * Chiraia (East), and Sugauli / Banjaria (Northwest).
 */
const DEMO_SHOWCASE_TRANSPORT_MODEL: PublicTransportMapModel = {
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
      routeName: 'Piprakothi-school',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#E53935', // Red
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
      color: '#1976D2', // Blue
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
      routeName: 'Route 3',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#2EAD4B', // Green
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
      routeName: 'Route 4',
      routeType: 'both',
      morningTripEnabled: true,
      afternoonTripEnabled: true,
      color: '#F57C00', // Orange
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

export default function SchoolTransportShowcase() {
  return (
    <section
      id="transport-network"
      className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-gradient-to-b from-[#FAF7F2] to-white relative overflow-hidden"
    >
      <div className="site-container max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-extrabold uppercase tracking-widest border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Interactive Live Fleet &amp; Route Network</span>
          </span>

          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
            Live Bus Tracking &amp; Public Route Network
          </h2>

          <p className="section-supporting-subtitle leading-relaxed">
            Give parents full confidence before admission. Our platforms include an interactive,
            turn-by-turn school bus route map with live animated GPS buses, locality discovery, and
            scheduled stop timings — completely free of third-party Google Maps API billing.
          </p>

          {/* Key Value Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-slate-700">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Bus className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>Moving School Buses</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>OSRM Road Routing</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Parent Locality Search</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Zero Map API Costs</span>
            </span>
          </div>
        </div>

        {/* Live Interactive Map Showcase Card */}
        <div className="bg-white rounded-3xl border border-[#CBD5E1] shadow-xl overflow-hidden p-2 sm:p-4">
          <div className="mb-3 px-3 py-2 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-950">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="font-semibold">
                <b>Interactive Live Demonstration:</b> Click any route on the left, search a locality, or watch the buses move live toward campus!
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-white text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
                4 Active Routes
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                Live Simulation
              </span>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="min-h-[640px]">
            <PublicTransportRouteMap
              model={DEMO_SHOWCASE_TRANSPORT_MODEL}
              schoolBrandingColor="#4338CA"
              className="h-full border-none shadow-none"
            />
          </div>
        </div>

        {/* Bottom Callout & Action Bar */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-base text-[#131B2E]">
                Want this interactive transit network on your school website?
              </h3>
            </div>
            <p className="text-xs text-[#64748B] max-w-2xl leading-relaxed">
              Every Ekaagra school platform comes with full transport route management, designated
              pickup stops, driver phone GPS tracking, and parent route embeds ready out of the box.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <a
              href="#school-configurator"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
            >
              <span>Explore School Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-[#E2E8F0]"
            >
              <span>Schedule a Demo</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
