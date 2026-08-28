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
    <section
      className="relative py-10 sm:py-12 lg:py-16 bg-[#FAF7F2] border-b border-[#E2E8F0] overflow-hidden"
      id="industries"
    >
      {/* Background glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container relative z-10 w-full space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-[#F97360]" />
            WHERE WE BUILD
          </span>
          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
            Tailored around the people you serve.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Every industry has distinct operational challenges. We build digital experiences designed around your specific audience and workflow.
          </p>
        </div>

        {/* Industry Selector Tabs (6-Card Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {industrySectors.map((sector) => {
            const Icon = sector.icon;
            const isSelected = selectedId === sector.id;
            return (
              <button
                key={sector.id}
                type="button"
                onClick={() => setSelectedId(sector.id)}
                className={`p-2.5 sm:p-3.5 rounded-xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-md shadow-[#4338CA]/25 scale-[1.01]'
                    : 'bg-white text-[#131B2E] border-[#E2E8F0] hover:border-[#4338CA]/40 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#4338CA]/10 text-[#4338CA]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>

                <div className="min-w-0">
                  <span
                    className={`text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider block mb-0.5 truncate ${
                      isSelected ? 'text-[#F4C95D]' : 'text-[#64748B]'
                    }`}
                  >
                    {sector.badge}
                  </span>
                  <h3 className="text-[11px] sm:text-xs font-bold tracking-tight leading-snug line-clamp-2">
                    {sector.name}
                  </h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail Showcase Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 lg:p-7 shadow-lg grid lg:grid-cols-12 gap-5 lg:gap-6 items-center transition-all duration-300">
          {/* Left Column: Context & Positioning */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ActiveIcon className="w-3 h-3 text-[#F97360]" />
                <span>{activeSector.highlight}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] tracking-tight">
                {activeSector.tagline}
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                {activeSector.description}
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/get-quote"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/25 hover:shadow-lg"
              >
                <span>Discuss Your Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Concrete Industry Outcomes */}
          <div className="lg:col-span-7 grid gap-2.5 sm:gap-3">
            <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-widest">
              Key Industry Outcomes:
            </div>
            {activeSector.outcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl flex items-start gap-3 hover:border-[#4338CA]/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#131B2E]">
                    {outcome.title}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
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

