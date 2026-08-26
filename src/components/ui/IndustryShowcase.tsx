'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  BookOpen,
  Utensils,
  Stethoscope,
  ShoppingBag,
  Rocket,
  User,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface Industry {
  id: string;
  name: string;
  badge: string;
  icon: typeof GraduationCap;
  tagline: string;
  description: string;
  keyFeatures: string[];
  ctaText: string;
  mockup: {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    secondaryCta: string;
    accentColor: string;
    themeBg: string;
    components: {
      title: string;
      items: { name: string; detail: string; tag?: string }[];
    };
  };
}

const industries: Industry[] = [
  {
    id: 'education',
    name: 'Schools & Education',
    badge: 'High Demand',
    icon: GraduationCap,
    tagline: 'Inspire parents and streamline student admissions.',
    description:
      'Complete school websites featuring admissions guidelines, curriculum, faculty directories, mandatory CBSE disclosures, dynamic notices, and photo galleries.',
    keyFeatures: [
      'Online Admissions & Enquiry Forms',
      'CBSE Mandatory Disclosure Ready',
      'Instant Notice Board & Circulars',
      'Campus Facilities & Photo Gallery',
    ],
    ctaText: 'Build a School Website',
    mockup: {
      heroTitle: 'Excellence in Modern Education & Character',
      heroSubtitle: 'Admissions open for Academic Year 2026-27. Shaping tomorrow’s leaders today.',
      heroCta: 'Apply for Admission',
      secondaryCta: 'View Curriculum',
      accentColor: 'bg-[#4338CA] text-white',
      themeBg: 'from-[#4338CA]/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'School Quick Access',
        items: [
          { name: 'Admissions 2026', detail: 'Application criteria & fee schedule', tag: 'Open Now' },
          { name: 'CBSE Disclosures', detail: 'Mandatory public institutional files', tag: 'Compliant' },
          { name: 'Latest Circulars', detail: 'Annual sports day & holiday schedule', tag: 'Updated' },
        ],
      },
    },
  },
  {
    id: 'business',
    name: 'Business & Services',
    badge: 'Conversion Focused',
    icon: Building2,
    tagline: 'Turn visitors into paying customers and qualified leads.',
    description:
      'Professional corporate and local business websites designed to build immediate credibility, rank well on Google Maps, and capture enquiries directly on WhatsApp.',
    keyFeatures: [
      'Direct WhatsApp & Click-to-Call',
      'Service Showcase & Transparent Pricing',
      'Customer Testimonials & Case Studies',
      'Google Maps & Location Integration',
    ],
    ctaText: 'Build a Business Website',
    mockup: {
      heroTitle: 'Professional Solutions Tailored to Your Business',
      heroSubtitle: 'Helping organizations streamline operations, cut costs, and scale with confidence.',
      heroCta: 'Request a Free Consultation',
      secondaryCta: 'Our Capabilities',
      accentColor: 'bg-[#0D9488] text-white',
      themeBg: 'from-teal-500/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Core Business Services',
        items: [
          { name: 'Enterprise Consulting', detail: 'Strategic planning & workflow optimization', tag: 'Popular' },
          { name: 'Custom Implementation', detail: 'Tailored technology execution', tag: 'Fast Turnaround' },
          { name: 'Dedicated Support', detail: 'Continuous monitoring & maintenance', tag: 'Reliable' },
        ],
      },
    },
  },
  {
    id: 'coaching',
    name: 'Coaching & Institutes',
    badge: 'Lead Magnet',
    icon: BookOpen,
    tagline: 'Attract students with proven results and course catalogs.',
    description:
      'High-impact websites for competitive exam academies, tuition centers, and coaching institutes to showcase topper results, faculty credentials, and batch schedules.',
    keyFeatures: [
      'Batch Schedules & Fee Structures',
      'Topper Testimonials & Results Wall',
      'Downloadable Syllabus & Study Material',
      'Fast Enquiry & Scholarship Registration',
    ],
    ctaText: 'Build an Institute Website',
    mockup: {
      heroTitle: 'Target Your Dream Rank with Proven Mentors',
      heroSubtitle: 'New batches starting this Monday. Limited seats per batch for personalized attention.',
      heroCta: 'Book a Free Demo Class',
      secondaryCta: 'Check Recent Results',
      accentColor: 'bg-[#4338CA] text-white',
      themeBg: 'from-[#4338CA]/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Upcoming Batches & Programs',
        items: [
          { name: 'Target Batch 2026', detail: 'Comprehensive 1-year intensive program', tag: 'Starts Monday' },
          { name: 'Weekend Crash Course', detail: 'Doubt resolution & mock test series', tag: 'Limited Seats' },
          { name: 'Scholarship Test', detail: 'Up to 90% scholarship for top performers', tag: 'Register Free' },
        ],
      },
    },
  },
  {
    id: 'restaurant',
    name: 'Restaurants & Cafes',
    badge: 'Appetizing UI',
    icon: Utensils,
    tagline: 'Make mouths water with interactive digital menus and reservations.',
    description:
      'Vibrant culinary websites with categorized food menus, price tags, table reservation forms, food photography, and direct WhatsApp takeout ordering.',
    keyFeatures: [
      'Interactive Digital Menu with Prices',
      'Table Reservation & Booking Engine',
      'Direct WhatsApp Takeaway Orders',
      'Opening Hours & Google Maps Directions',
    ],
    ctaText: 'Build a Restaurant Website',
    mockup: {
      heroTitle: 'Artisanal Flavors Crafted with Passion',
      heroSubtitle: 'Fresh farm-to-table ingredients, cozy ambiance, and memorable dining experiences.',
      heroCta: 'Reserve a Table',
      secondaryCta: 'View Full Menu',
      accentColor: 'bg-[#F97360] text-white',
      themeBg: 'from-[#F97360]/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: "Chef's Specials This Week",
        items: [
          { name: 'Wood-Fired Truffle Pizza', detail: 'San Marzano tomatoes, fresh mozzarella & basil', tag: 'Signature' },
          { name: 'Smoked Butter Garlic Bowls', detail: 'Infused herb broth served with artisanal toast', tag: 'Chef Choice' },
          { name: 'Handcrafted Tiramisu', detail: 'Espresso-soaked savoiardi with mascarpone cream', tag: 'Dessert' },
        ],
      },
    },
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Clinics',
    badge: 'Trust Building',
    icon: Stethoscope,
    tagline: 'Build patient trust with doctor profiles and online appointments.',
    description:
      'Reassuring and clean medical websites for clinics, hospitals, and doctors with specialty details, OPD consultation timings, and easy booking forms.',
    keyFeatures: [
      'Doctor Specialties & Qualification Profiles',
      'OPD Timings & Direct Appointment Request',
      'Patient FAQs & Pre-Visit Guidelines',
      'Emergency Contact & Ambulance Direct Line',
    ],
    ctaText: 'Build a Healthcare Website',
    mockup: {
      heroTitle: 'Compassionate Care, Modern Medical Excellence',
      heroSubtitle: 'Experienced medical specialists dedicated to your health and family wellbeing.',
      heroCta: 'Book an Appointment',
      secondaryCta: 'Our Doctors & OPD',
      accentColor: 'bg-emerald-600 text-white',
      themeBg: 'from-emerald-500/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Specialty Departments & OPD',
        items: [
          { name: 'Cardiology & Heart Care', detail: 'Dr. Sharma (MD, DM) • Mon-Sat 10am-2pm', tag: 'Available Today' },
          { name: 'Pediatrics & Child Health', detail: 'Dr. Verma (MD) • Mon-Fri 4pm-8pm', tag: 'Child Friendly' },
          { name: 'Diagnostic & Lab Tests', detail: 'Full blood panel & digital X-ray services', tag: 'Same-Day' },
        ],
      },
    },
  },
  {
    id: 'retail',
    name: 'Retail & Local Shops',
    badge: 'Product Catalog',
    icon: ShoppingBag,
    tagline: 'Showcase your inventory and drive foot traffic to your store.',
    description:
      'Modern product showcase websites for clothing boutiques, hardware stores, stationery shops, and wholesalers with digital catalogs and quick enquiry links.',
    keyFeatures: [
      'Digital Product Catalog & Image Galleries',
      'Direct WhatsApp Price Inquiries',
      'Store Location, Landmark & Opening Hours',
      'Customer Offers & Festival Promotions',
    ],
    ctaText: 'Build a Store Website',
    mockup: {
      heroTitle: 'Quality Products at Unmatched Local Prices',
      heroSubtitle: 'Explore our latest arrivals, wholesale rates, and fast pickup options in your city.',
      heroCta: 'Browse New Catalog',
      secondaryCta: 'Visit Our Store',
      accentColor: 'bg-[#F97360] text-white',
      themeBg: 'from-[#F97360]/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Featured Product Categories',
        items: [
          { name: 'Trending New Arrivals', detail: 'Premium quality stock updated weekly', tag: 'In Stock' },
          { name: 'Bulk Wholesale Orders', detail: 'Special dealer discounts for commercial buyers', tag: 'Discounts' },
          { name: 'Send & Pick Up in Shop', detail: 'Reserve your items online before visiting', tag: 'Quick Pickup' },
        ],
      },
    },
  },
  {
    id: 'startups',
    name: 'Startups & Modern Tech',
    badge: 'High Impact',
    icon: Rocket,
    tagline: 'Explain your product clearly and convert visitors into early users.',
    description:
      'Sleek landing pages for innovative startups, software products, and mobile apps with interactive feature highlights, pricing tiers, and beta waitlists.',
    keyFeatures: [
      'Product Storytelling & Benefit Cards',
      'Interactive Product Demos & Videos',
      'Transparent Pricing Tier Comparison',
      'Instant Onboarding & Sign-Up Flow',
    ],
    ctaText: 'Build a Startup Website',
    mockup: {
      heroTitle: 'The Modern Operating System for Modern Teams',
      heroSubtitle: 'Automate repetitive workflows, centralize team communication, and ship faster together.',
      heroCta: 'Start Free 14-Day Trial',
      secondaryCta: 'Watch 2-Min Demo',
      accentColor: 'bg-[#8B5CF6] text-white',
      themeBg: 'from-purple-500/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Core Platform Features',
        items: [
          { name: 'Automated Workflows', detail: 'Connect apps and trigger actions automatically', tag: 'Fast' },
          { name: 'Real-time Analytics', detail: 'Track team velocity and operational metrics', tag: 'Live Sync' },
          { name: 'Enterprise Security', detail: 'End-to-end encryption & role permissions', tag: 'Secure' },
        ],
      },
    },
  },
  {
    id: 'personal',
    name: 'Personal Brands & Portfolios',
    badge: 'Authority',
    icon: User,
    tagline: 'Position yourself as an authority in your industry.',
    description:
      'Distinguished portfolio websites for consultants, doctors, lawyers, speakers, and executives to showcase achievements, services, media mentions, and client testimonials.',
    keyFeatures: [
      'Biography & Authority Positioning',
      'Services & Consultation Offerings',
      'Featured Speaking, Press & Publications',
      'Direct Calendar Booking Integration',
    ],
    ctaText: 'Build a Personal Website',
    mockup: {
      heroTitle: 'Helping Founders Scale High-Growth Companies',
      heroSubtitle: 'Executive advisor, angel investor, and keynote speaker on digital transformation and strategy.',
      heroCta: 'Book an Advisory Call',
      secondaryCta: 'Read My Articles',
      accentColor: 'bg-[#131B2E] text-white',
      themeBg: 'from-[#131B2E]/10 via-[#FAF7F2] to-[#FAF7F2]',
      components: {
        title: 'Advisory & Speaking Engagements',
        items: [
          { name: '1-on-1 Executive Strategy', detail: 'Monthly advisory for growth-stage leaders', tag: '2 Slots Open' },
          { name: 'Keynote Presentations', detail: 'Actionable frameworks for industry summits', tag: 'Global' },
          { name: 'Published Insights', detail: 'Weekly essays on technology and execution', tag: 'Articles' },
        ],
      },
    },
  },
];

export default function IndustryShowcase() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0]);

  return (
    <section className="py-24 sm:py-32 bg-[#FAF7F2] border-b border-[#E2E8F0] relative overflow-hidden" id="industries">
      {/* Background glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            TAILORED FOR EVERY INDUSTRY
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            What kind of website do you need?
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Click any industry below to see how we design websites specifically around your audience and business conversion goals.
          </p>
        </div>

        {/* Industry Pill Selector Grid (8 Options) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {industries.map((ind) => {
            const Icon = ind.icon;
            const isSelected = selectedIndustry.id === ind.id;
            return (
              <button
                key={ind.id}
                onClick={() => setSelectedIndustry(ind)}
                className={`p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between border cursor-pointer ${
                  isSelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-lg shadow-[#4338CA]/30 scale-[1.02]'
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
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#FAF7F2] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {ind.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold tracking-tight">{ind.name}</h3>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Interactive Website Simulator Preview Container */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-2xl grid lg:grid-cols-12 gap-8 items-center transition-all duration-300">
          {/* Left Column: Requirements & Strategy Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                {selectedIndustry.name} Strategy
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                {selectedIndustry.tagline}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                {selectedIndustry.description}
              </p>
            </div>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#131B2E] uppercase tracking-wider block">
                Included in This Website Package:
              </span>
              {selectedIndustry.keyFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[#334155] font-medium">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Direct CTA */}
            <div className="pt-4">
              <Link
                href="/get-quote"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#4338CA]/25 hover:shadow-xl hover:shadow-[#4338CA]/35"
              >
                <span>{selectedIndustry.ctaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Simulated Website Browser Mockup */}
          <div className="lg:col-span-7">
            <div className="browser-frame shadow-2xl bg-white">
              {/* Browser Chrome Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#FAF7F2] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F97360]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4C95D]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="text-[11px] font-mono text-[#64748B] bg-white px-4 py-1 rounded-full border border-[#E2E8F0]">
                  https://your-{selectedIndustry.id}-website.com
                </div>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Preview
                </span>
              </div>

              {/* Simulated Website Content Body */}
              <div className={`p-6 sm:p-8 bg-gradient-to-b ${selectedIndustry.mockup.themeBg} space-y-6`}>
                {/* Simulated Header Navbar */}
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#4338CA] text-white flex items-center justify-center text-xs font-bold">
                      Y
                    </div>
                    <span className="text-xs font-extrabold text-[#131B2E] tracking-tight">
                      Your Brand
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-[11px] font-semibold text-[#64748B]">
                    <span>About</span>
                    <span>Services</span>
                    <span>Gallery</span>
                    <span className="text-[#4338CA]">Contact</span>
                  </div>
                </div>

                {/* Simulated Hero Banner */}
                <div className="space-y-3 pt-2 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97360] font-mono">
                    Professional • Fast • Mobile Ready
                  </span>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] leading-tight">
                    {selectedIndustry.mockup.heroTitle}
                  </h4>
                  <p className="text-xs text-[#64748B] leading-relaxed max-w-lg">
                    {selectedIndustry.mockup.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    <span className={`text-xs font-bold px-4 py-2 rounded-xl shadow-sm ${selectedIndustry.mockup.accentColor}`}>
                      {selectedIndustry.mockup.heroCta}
                    </span>
                    <span className="text-xs font-semibold px-4 py-2 rounded-xl bg-white/90 text-[#131B2E] border border-[#E2E8F0]">
                      {selectedIndustry.mockup.secondaryCta}
                    </span>
                  </div>
                </div>

                {/* Simulated Feature Cards Container */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-3 shadow-md backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                    <span className="text-xs font-bold text-[#131B2E]">
                      {selectedIndustry.mockup.components.title}
                    </span>
                    <span className="text-[10px] text-[#4338CA] font-semibold">
                      Interactive Modules
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedIndustry.mockup.components.items.map((item, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-3 text-left hover:border-[#4338CA]/30 transition-colors"
                      >
                        <div>
                          <div className="text-xs font-bold text-[#131B2E]">{item.name}</div>
                          <div className="text-[11px] text-[#64748B]">{item.detail}</div>
                        </div>
                        {item.tag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-md shrink-0">
                            {item.tag}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

