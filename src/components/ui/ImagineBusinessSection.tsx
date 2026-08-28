'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Building2, 
  UtensilsCrossed, 
  Rocket, 
  ArrowRight, 
  Sparkles, 
  ExternalLink,
  CheckCircle2,
  Calendar,
  MessageCircle,
  Clock,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface MockupCard {
  id: string;
  category: string;
  industry: string;
  name: string;
  tagline: string;
  color: string;
  accentBg: string;
  icon: typeof GraduationCap;
  isRealClient: boolean;
  conceptNote?: string;
  realLink?: string;
  previewElements: {
    badge: string;
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
    navLinks: string[];
    components: {
      type: 'school' | 'business' | 'restaurant' | 'startup';
      data: any;
    };
  };
}

const mockups: MockupCard[] = [
  {
    id: 'school',
    category: 'Education & Academics',
    industry: 'Schools & Colleges',
    name: 'Roshani Public School',
    tagline: 'Modern institutional website with CBSE disclosure & live notices',
    color: '#4338CA',
    accentBg: 'bg-[#4338CA]/10 text-[#4338CA] border-[#4338CA]/20',
    icon: GraduationCap,
    isRealClient: true,
    realLink: '/projects/roshani-public-school',
    previewElements: {
      badge: 'Admissions Open 2026-27',
      heroTitle: 'Nurturing Global Leaders with Value-Based Education',
      heroSubtitle: 'CBSE Affiliated • Nursery to Grade 12 • Modern STEM Labs & Sports Facilities',
      ctaText: 'Apply for Admission',
      navLinks: ['Admissions', 'Academics', 'CBSE Disclosures', 'Notices'],
      components: {
        type: 'school',
        data: {
          ticker: 'Latest: Annual Sports Meet scheduled for Dec 15 • Online Fee Submission Open',
          cards: [
            { title: 'Admissions 2026-27', desc: 'Online application & criteria guide', tag: 'Open Now' },
            { title: 'CBSE Mandatory Disclosure', desc: 'Affiliation & institutional documents', tag: 'Compliant' },
            { title: 'Campus Facilities', desc: 'Smart classrooms, robotics & sports', tag: 'Tour' }
          ]
        }
      }
    }
  },
  {
    id: 'business',
    category: 'Corporate & Consulting',
    industry: 'Business & Services',
    name: 'Palak Enterprises',
    tagline: 'High-authority corporate portal with verified service catalogue',
    color: '#0D9488',
    accentBg: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: Building2,
    isRealClient: true,
    realLink: '/projects/palak-enterprises',
    previewElements: {
      badge: 'Verified B2B Supplier',
      heroTitle: 'Reliable Industrial Supplies & Engineering Solutions',
      heroSubtitle: 'Direct vendor distribution with verified quality certifications and pan-India fulfillment.',
      ctaText: 'Request Wholesale Quote',
      navLinks: ['Products', 'GST Invoicing', 'Specifications', 'Contact'],
      components: {
        type: 'business',
        data: {
          ticker: 'Direct dispatch within 24 hours for verified commercial orders',
          cards: [
            { title: 'Commercial Print Solutions', desc: 'High-volume digital offset & branding', tag: 'Fast Fulfillment' },
            { title: 'Corporate Stationery Supply', desc: 'Customized GST billing & wholesale rates', tag: 'B2B Ready' },
            { title: 'Instant WhatsApp Quotation', desc: 'Send bill of materials for same-day pricing', tag: 'WhatsApp' }
          ]
        }
      }
    }
  },
  {
    id: 'restaurant',
    category: 'Hospitality & Dining',
    industry: 'Restaurants & Cafes',
    name: 'The Artisan Table',
    tagline: 'Sensory dining experience with digital menu & online table booking',
    color: '#F97360',
    accentBg: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: UtensilsCrossed,
    isRealClient: false,
    conceptNote: 'Agency Concept Demo — Crafted specifically to demonstrate hospitality capabilities',
    previewElements: {
      badge: 'Table Reservations Live',
      heroTitle: 'Handcrafted Seasonal Dining in the Heart of the City',
      heroSubtitle: 'Farm-to-table cuisine, artisanal brews, and intimate ambiance curated for every celebration.',
      ctaText: 'Book a Table Tonight',
      navLinks: ['Menu', 'Chef Specials', 'Reservations', 'Location'],
      components: {
        type: 'restaurant',
        data: {
          ticker: 'Chef Special this weekend: Truffle Risotto & Handcrafted Artisanal Desserts',
          cards: [
            { title: 'Wood-Fired Truffle Pizza', desc: 'San Marzano tomatoes, fresh mozzarella & basil', tag: '₹380' },
            { title: 'Smoked Herb Butter Bowls', desc: 'Infused herb broth served with artisanal sourdough', tag: '₹290' },
            { title: 'Instant Table Booking Engine', desc: 'Select date, time, party size & dietary requests', tag: 'Book Online' }
          ]
        }
      }
    }
  },
  {
    id: 'startup',
    category: 'Technology & SaaS',
    industry: 'Startups & Digital Tech',
    name: 'SparkNest Academy',
    tagline: 'Modern tech education platform with interactive curriculum previews',
    color: '#8B5CF6',
    accentBg: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Rocket,
    isRealClient: true,
    realLink: '/projects/sparknest-academy',
    previewElements: {
      badge: 'New Cohort Starting',
      heroTitle: 'Master Next-Gen Tech Skills with Hands-on Mentorship',
      heroSubtitle: 'Industry-guided curriculums designed to help students transition into high-growth tech careers.',
      ctaText: 'Explore All Courses',
      navLinks: ['Curriculum', 'Mentors', 'Student Work', 'Sign In'],
      components: {
        type: 'startup',
        data: {
          ticker: 'Live interactive masterclasses starting this Monday • Limited seats per cohort',
          cards: [
            { title: 'Full-Stack Development', desc: 'Modern React, Next.js, Node & Cloud', tag: '12 Weeks' },
            { title: 'UI/UX Product Design', desc: 'Figma design systems & user research', tag: '8 Weeks' },
            { title: 'Student Learning Dashboard', desc: 'Integrated progress tracker & project reviews', tag: 'Interactive' }
          ]
        }
      }
    }
  }
];

export default function ImagineBusinessSection() {
  const [selectedId, setSelectedId] = useState('school');
  const activeMockup = mockups.find((m) => m.id === selectedId) || mockups[0];
  const IconComponent = activeMockup.icon;

  return (
    <section className="py-8 sm:py-10 lg:py-12 bg-[#FAF7F2] border-b border-[#E2E8F0] relative overflow-hidden" id="imagine">
      {/* Subtle background glow */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[#4338CA]/5 via-[#F97360]/5 to-[#F4C95D]/5 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            TAILORED FOR YOUR INDUSTRY
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Imagine your business here.
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Your industry. Your brand. Your website. See how Ekaagra crafts tailor-made digital experiences for every business sector.
          </p>
        </div>

        {/* Industry Pill Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl mx-auto">
          {mockups.map((m) => {
            const isSelected = m.id === selectedId;
            const TabIcon = m.icon;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-lg shadow-[#4338CA]/25 scale-105'
                    : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-slate-50 hover:text-[#131B2E]'
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isSelected ? 'text-[#F4C95D]' : 'text-[#64748B]'}`} />
                <span>{m.industry}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Interactive Browser Showcase */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden max-w-5xl mx-auto transition-all duration-300">
          {/* Browser Chrome Header */}
          <div className="bg-[#F1ECE4] px-4 sm:px-6 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F97360]" />
              <span className="w-3 h-3 rounded-full bg-[#F4C95D]" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-3 text-xs font-mono text-[#64748B] hidden sm:inline-block">
                https://www.{activeMockup.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeMockup.isRealClient ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Real Ekaagra Client
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3 h-3 text-[#F97360]" />
                  Agency Concept Project
                </span>
              )}
            </div>
          </div>

          {/* Website Canvas Area */}
          <div className="p-6 sm:p-10 space-y-6 bg-gradient-to-b from-[#FAF7F2] to-white">
            {/* Concept Project Clear Disclosure (if applicable) */}
            {activeMockup.conceptNote && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Design Concept:</strong> {activeMockup.conceptNote}</span>
              </div>
            )}

            {/* Simulated Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#131B2E] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                  <IconComponent className="w-4 h-4 text-[#F4C95D]" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-[#131B2E] block">{activeMockup.name}</span>
                  <span className="text-[10px] text-[#64748B] block">{activeMockup.category}</span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-[#64748B]">
                {activeMockup.previewElements.navLinks.map((link, idx) => (
                  <span key={idx} className={idx === 0 ? 'text-[#4338CA] font-bold' : ''}>
                    {link}
                  </span>
                ))}
                <span className="px-3.5 py-1.5 bg-[#4338CA] text-white rounded-xl font-bold text-[11px]">
                  {activeMockup.previewElements.ctaText}
                </span>
              </div>
            </div>

            {/* Simulated Hero Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-block px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] text-[11px] font-bold rounded-full uppercase tracking-wider">
                  {activeMockup.previewElements.badge}
                </span>
                <span className="text-[11px] font-mono text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Preview
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] leading-tight">
                {activeMockup.previewElements.heroTitle}
              </h3>

              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
                {activeMockup.previewElements.heroSubtitle}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  className="px-5 py-2.5 bg-[#4338CA] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-default"
                >
                  {activeMockup.previewElements.ctaText}
                </button>
                <div className="flex items-center gap-4 text-xs text-[#64748B] font-medium px-2 py-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Mobile Optimized
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp Lead Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Simulated Cards / Interactive Modules */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-[#131B2E] px-1">
                <span>Featured Modules</span>
                <span className="text-[11px] text-[#64748B] font-normal">{activeMockup.previewElements.components.data.ticker}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeMockup.previewElements.components.data.cards.map((card: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-2 hover:border-[#4338CA]/30 transition-colors text-left"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#131B2E]">{card.title}</span>
                        {card.tag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-md shrink-0">
                            {card.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{card.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Project Info Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] text-center sm:text-left">
                <strong className="text-[#131B2E] font-bold">{activeMockup.name}: </strong>
                {activeMockup.tagline}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {activeMockup.isRealClient && activeMockup.realLink && (
                  <Link
                    href={activeMockup.realLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4338CA] hover:underline"
                  >
                    <span>View Case Study</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link
                  href="/get-quote"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                >
                  <span>Build My Website</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

