'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Stethoscope,
  Rocket,
  BookOpen,
  Utensils,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface IndustrySector {
  id: string;
  name: string;
  badge: string;
  icon: typeof GraduationCap;
  tagline: string;
  description: string;
  outcomes: { title: string; detail: string }[];
  highlight: string;
}

const industrySectors: IndustrySector[] = [
  {
    id: 'education',
    name: 'Schools & Education',
    badge: 'Education',
    icon: GraduationCap,
    tagline: 'Admissions, notices, and parent-facing institutional experiences.',
    description:
      'Purpose-built digital platforms that inspire parent trust, satisfy regulatory disclosures, and eliminate administrative friction.',
    highlight: 'CBSE Affiliation & Admission Ready',
    outcomes: [
      {
        title: 'Admissions & Enquiry Workflows',
        detail: 'Clear criteria, fee guidance, and direct parent enquiry capture.',
      },
      {
        title: 'Real-Time Digital Notice Board',
        detail: 'Publish circulars, holiday calendars, and academic updates instantly.',
      },
      {
        title: 'CBSE Mandatory Disclosures',
        detail: 'Structured compliance repository ensuring zero regulatory hassle.',
      },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Clinics',
    badge: 'Healthcare',
    icon: Stethoscope,
    tagline: 'Doctor profiles, OPD schedules, and patient appointment requests.',
    description:
      'Reassuring, clear interfaces that present physician credentials and make booking consultations effortless for patients.',
    highlight: 'Patient Trust & Clarity',
    outcomes: [
      {
        title: 'Doctor Credentials & Specialties',
        detail: 'Clear department profiles, qualifications, and areas of expertise.',
      },
      {
        title: 'OPD Schedules & Booking',
        detail: 'Live consultation hours and friction-free appointment requests.',
      },
      {
        title: 'Emergency & Patient Guidelines',
        detail: 'One-tap emergency dialing, location directions, and pre-visit FAQs.',
      },
    ],
  },
  {
    id: 'business',
    name: 'Local Businesses & Services',
    badge: 'Commercial',
    icon: Building2,
    tagline: 'Service catalogs, direct WhatsApp inquiries, and local discovery.',
    description:
      'High-authority websites designed to convert local search discovery into verified commercial enquiries.',
    highlight: 'Direct WhatsApp Leads',
    outcomes: [
      {
        title: 'Verified Service & Product Catalog',
        detail: 'Present your capabilities, specifications, and wholesale pricing clearly.',
      },
      {
        title: '1-Tap WhatsApp Lead Capture',
        detail: 'Connect prospective clients directly to your team with pre-filled inquiries.',
      },
      {
        title: 'Local Google Maps Presence',
        detail: 'Optimized for local discovery, directions, and customer review authority.',
      },
    ],
  },
  {
    id: 'startups',
    name: 'Startups & Modern Tech',
    badge: 'Technology',
    icon: Rocket,
    tagline: 'Product storytelling, feature previews, and high-converting onboarding.',
    description:
      'Sleek digital products that explain complex value propositions in seconds and turn visitors into active users.',
    highlight: 'Sub-500ms Conversion Speed',
    outcomes: [
      {
        title: 'Interactive Feature Previews',
        detail: 'Walkthrough key capabilities and workflows with engaging visuals.',
      },
      {
        title: 'Transparent Pricing Comparisons',
        detail: 'Clear plan tiers, feature matrices, and upgrade pathways.',
      },
      {
        title: 'Frictionless User Onboarding',
        detail: 'Streamlined account creation, waitlist signups, and trial activations.',
      },
    ],
  },
  {
    id: 'coaching',
    name: 'Coaching & Academies',
    badge: 'Institutes',
    icon: BookOpen,
    tagline: 'Results showcase, batch timetables, and demo class registrations.',
    description:
      'Academic platforms engineered to prove results, highlight faculty credentials, and fill upcoming cohorts.',
    highlight: 'Topper Results Authority',
    outcomes: [
      {
        title: 'Results Wall & Testimonials',
        detail: 'Showcase verified rank holders, student achievements, and reviews.',
      },
      {
        title: 'Upcoming Batch Schedules',
        detail: 'Clear fee structures, subject timetables, and curriculum roadmaps.',
      },
      {
        title: 'Demo Class & Scholarship Registration',
        detail: 'Capture student registrations for upcoming diagnostic tests and demo sessions.',
      },
    ],
  },
  {
    id: 'dining',
    name: 'Restaurants & Dining',
    badge: 'Hospitality',
    icon: Utensils,
    tagline: 'Interactive digital menus, reservations, and takeout orders.',
    description:
      'Appetizing websites crafted for mobile browsing, menu discovery, table reservations, and direct ordering.',
    highlight: 'Mobile Dining UX',
    outcomes: [
      {
        title: 'Categorized Digital Menu with Prices',
        detail: 'High-resolution food photography, chef specials, and allergen tags.',
      },
      {
        title: 'Online Table Reservations',
        detail: 'Date, time, and party size booking engine without third-party commissions.',
      },
      {
        title: 'Direct WhatsApp Takeaway',
        detail: 'Quick-order flow sending selected dishes straight to your kitchen staff.',
      },
    ],
  },
];

export default function IndustryShowcase() {
  const [selectedId, setSelectedId] = useState<string>('education');
  const activeSector =
    industrySectors.find((s) => s.id === selectedId) || industrySectors[0];
  const ActiveIcon = activeSector.icon;

  return (
    <section className="py-24 sm:py-32 bg-[#FAF7F2] border-b border-[#E2E8F0] relative overflow-hidden" id="industries">
      {/* Background glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            WHERE WE BUILD
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Tailored around the people you serve.
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Every industry has distinct operational challenges. We build digital experiences designed around your specific audience and workflow.
          </p>
        </div>

        {/* Industry Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {industrySectors.map((sector) => {
            const Icon = sector.icon;
            const isSelected = selectedId === sector.id;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setSelectedId(sector.id)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-lg shadow-[#4338CA]/25 scale-[1.02]'
                    : 'bg-white text-[#131B2E] border-[#E2E8F0] hover:border-[#4338CA]/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#4338CA]/10 text-[#4338CA]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${
                      isSelected ? 'text-[#F4C95D]' : 'text-[#64748B]'
                    }`}
                  >
                    {sector.badge}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold tracking-tight leading-snug">
                    {sector.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Showcase Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-12 shadow-2xl grid lg:grid-cols-12 gap-8 lg:gap-12 items-center transition-all duration-300">
          {/* Left Column: Context & Positioning */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
                <ActiveIcon className="w-3.5 h-3.5 text-[#F97360]" />
                <span>{activeSector.highlight}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                {activeSector.tagline}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {activeSector.description}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/get-quote"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#4338CA]/25 hover:shadow-xl hover:shadow-[#4338CA]/35"
              >
                <span>Discuss Your Project</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Concrete Industry Outcomes */}
          <div className="lg:col-span-7 grid gap-4 sm:gap-5">
            <div className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest mb-1">
              Key Industry Outcomes:
            </div>
            {activeSector.outcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl flex items-start gap-4 hover:border-[#4338CA]/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#131B2E]">
                    {outcome.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
                    {outcome.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

