'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Sparkles,
  Globe,
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

type PricingTab = 'websites' | 'schools' | 'systems';

interface MobileSlideshowProps {
  slides: React.ReactNode[];
  slideIndex: number;
  onSlideChange: (index: number) => void;
  slideLabels: string[];
}

function MobileSlideshow({
  slides,
  slideIndex,
  onSlideChange,
  slideLabels,
}: MobileSlideshowProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && slideIndex < slides.length - 1) {
      onSlideChange(slideIndex + 1);
    }
    if (isRightSwipe && slideIndex > 0) {
      onSlideChange(slideIndex - 1);
    }
  };

  return (
    <div className="block md:hidden space-y-2.5">
      {/* Mobile Slide Navigation Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSlideChange(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                slideIndex === idx
                  ? 'w-6 bg-[#4338CA]'
                  : 'w-2 bg-[#CBD5E1] hover:bg-[#94A3B8]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
          <span className="text-[10px] font-bold font-mono text-[#64748B] ml-1 uppercase">
            {slideLabels[slideIndex] || `${slideIndex + 1}/${slides.length}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSlideChange(Math.max(0, slideIndex - 1))}
            disabled={slideIndex === 0}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#131B2E] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF7F2] transition-colors shadow-xs"
            aria-label="Previous plan"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSlideChange(Math.min(slides.length - 1, slideIndex + 1))}
            disabled={slideIndex === slides.length - 1}
            className="p-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[#131B2E] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF7F2] transition-colors shadow-xs"
            aria-label="Next plan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Swipeable Viewport */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        <div key={slideIndex} className="animate-fade-in transition-all duration-300">
          {slides[slideIndex]}
        </div>
      </div>

      {/* Mobile Swipe Tip & Direct Jump */}
      <div className="flex items-center justify-between text-[10.5px] text-[#64748B] font-medium px-1">
        <span>👈 Swipe left/right for more</span>
        {slideIndex < slides.length - 1 ? (
          <button
            type="button"
            onClick={() => onSlideChange(slides.length - 1)}
            className="text-[#4338CA] font-bold hover:underline"
          >
            More Plans &rarr;
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function HomePricingSection() {
  const [activeTab, setActiveTab] = useState<PricingTab>('websites');
  const [slideIndex, setSlideIndex] = useState<number>(0);

  const switchTab = (tab: PricingTab) => {
    setActiveTab(tab);
    setSlideIndex(0);
  };

  // ─── 1. BUSINESS WEBSITE CARDS ──────────────────────────────────────────────
  const websiteCardStarter = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border-2 border-[#4338CA] bg-white shadow-sm shadow-[#4338CA]/10 h-full">
      <span className="absolute -top-2.5 right-4 bg-[#4338CA] text-white text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
        Best Value for Local Business
      </span>

      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
            Fast 3-Day Turnaround
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Starter Website
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#4338CA] font-mono">
              ₹999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ₹499/year for domain &amp; hosting
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Complete multi-page presence with custom domain allowance, fast mobile UI, and direct WhatsApp inquiries.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>3–5 Custom Responsive Pages</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>1 Standard Domain Included (within allowance)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Basic SEO (Meta, Sitemap, Schema)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Direct WhatsApp CTA &amp; Click-to-Call</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Maintenance &amp; Uptime Support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=starter"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-sm shadow-[#4338CA]/25 transition-all"
          >
            <span>Choose Starter (₹999)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const websiteCardGrowth = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
            Multi-Service Growth
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Growth Website
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹1,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ₹999/year for domain &amp; hosting
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            For established businesses offering multiple services, product catalogs, and requiring search engine visibility.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Up to 7 Structured Pages</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Standard Domain Allowance Included</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>On-Page Search Optimization &amp; JSON-LD</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Interactive Contact &amp; Inquiry Forms</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Full Source Code Handover</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=growth"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Choose Growth (₹1,999)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const websiteCardCms = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
            Admin Self-Management
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Custom Corporate CMS
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹15,000
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ~50% annually for maintenance &amp; cloud
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Custom branding, private admin panel to publish notices and edit content, without touching code.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Private Admin Dashboard &amp; Editor</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dynamic Notices, Circulars &amp; Media</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Custom UI/UX &amp; High-Authority Layout</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Cloud Database &amp; Edge Deployment</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Priority WhatsApp Support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=business-website-cms"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Choose CMS (₹15,000)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const websiteCardMore = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-4 sm:p-4.5 border-2 border-dashed border-[#4338CA]/40 bg-[#FAF7F2] shadow-xs h-full">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#F4C95D]" />
          <span>Explore All 5 Website Tiers</span>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E]">
            Need More Pages or Custom Features?
          </h3>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed">
            From single-page micro sites to large multi-category commercial web portals with catalog systems.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs text-[#334155] font-medium">
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>5 Full Website Packages (from ₹999 to ₹15,000+)</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Additional Pages at ₹499 / Standard Page</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Domain Allowance (.com, .in, .org options)</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>E-Commerce, Catalog &amp; WhatsApp Stores</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <Link
          href="/pricing#website-plans"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#131B2E] hover:bg-black text-white shadow-sm transition-all"
        >
          <span>Compare All Website Plans</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  const websiteSlides = [
    websiteCardStarter,
    websiteCardGrowth,
    websiteCardCms,
    websiteCardMore,
  ];
  const websiteLabels = ['Starter (₹999)', 'Growth (₹1,999)', 'Corporate CMS (₹15k)', 'More Plans'];

  // ─── 2. SCHOOLS & INSTITUTES CARDS ──────────────────────────────────────────
  const schoolCardWebsite = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
            CBSE / ICSE Compliant
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            School Website
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹9,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ₹6,999/year for cloud hosting &amp; maintenance
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Professional institutional web portal, CBSE-mandated disclosures, photo gallery, and online admission enquiry forms.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Up to 10 Standard Pages (CBSE Mandated)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>1 Standard Domain Included (within allowance)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Admission Enquiry &amp; Lead Capture System</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Notices, Circulars &amp; Photo Gallery</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Mobile-First Responsive Layout</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=school-website"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Choose School Website (₹9,999)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const schoolCardCms = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border-2 border-[#4338CA] bg-white shadow-sm shadow-[#4338CA]/10 h-full">
      <span className="absolute -top-2.5 right-4 bg-[#4338CA] text-white text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-xs">
        Most Popular for Schools
      </span>

      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
            Self-Managed Portal
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            School CMS Portal
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#4338CA] font-mono">
              ₹14,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ~50% annually for maintenance &amp; hosting
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Complete institutional portal with private staff admin login to publish notices, date sheets, circulars, and event galleries without code.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dedicated Staff Admin Panel &amp; Editor</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Instant Circular &amp; Notice PDF Publishing</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Campus Events &amp; Activity Media Gallery</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Mandatory CBSE/ICSE Disclosure System</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Multi-Staff Role Access &amp; Audit Logs</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=school-website-cms"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-sm shadow-[#4338CA]/25 transition-all"
          >
            <span>Choose School CMS (₹14,999)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const schoolCardErp = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
            6-Role Campus Suite
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            School ERP Platform
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹17,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup (From)
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Student-tiered pricing with predictable renewals
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Integrated school management software covering fee collection, digital attendance, student report cards, and parent notifications.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>6-Role Logins (Admin, Teacher, Parent, etc.)</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Fee Collection &amp; Automated Print Receipts</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Daily Student &amp; Staff Attendance Tracking</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Exams, Marks Entry &amp; Report Card Generation</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>SMS &amp; WhatsApp Communication Alerts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/schools"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Explore ERP Tiers (from ₹17,999)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const schoolCardMore = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-4 sm:p-4.5 border-2 border-dashed border-[#4338CA]/40 bg-[#FAF7F2] shadow-xs h-full">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#F4C95D]" />
          <span>Full School Digital Ecosystem</span>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E]">
            Comprehensive School Solutions
          </h3>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed">
            Need bus GPS tracking, library management, biometric attendance, or branded mobile applications for parents?
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs text-[#334155] font-medium">
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Student Capacity Brackets (up to 3,000+ students)</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Biometric &amp; Staff Mobile Geo-Fencing</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Bus GPS Live Route Tracking &amp; Alerts</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Roshani Modern Academy Institutional Benchmark</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <Link
          href="/schools"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#131B2E] hover:bg-black text-white shadow-sm transition-all"
        >
          <span>Explore School ERP &amp; Modules</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  const schoolSlides = [
    schoolCardWebsite,
    schoolCardCms,
    schoolCardErp,
    schoolCardMore,
  ];
  const schoolLabels = ['School Web (₹9,999)', 'School CMS (₹14,999)', 'School ERP (₹17k+)', 'More Modules'];

  // ─── 3. CUSTOM APPS & SYSTEMS CARDS ─────────────────────────────────────────
  const systemsCardWebApp = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
            Interactive Workflows
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Web Applications
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹24,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ₹13,999/year for cloud infrastructure &amp; care
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Custom dashboards, role-based logins, PostgreSQL databases, and automated customer workflows.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Admin Dashboard &amp; Analytics Portal</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Secure Multi-Role Authentication</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>PostgreSQL / Supabase Cloud DB</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Custom API &amp; Webhook Connections</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>100% Proprietary Code Ownership</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=web-applications"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Inquire Web App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const systemsCardAndroid = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
            Google Play Store
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Android Applications
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹24,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Renews at ₹15,999/year for API server &amp; store updates
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Native Android apps or high-speed WebView architectures engineered for Android smartphones and tablets.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dedicated Android Application Bundle</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Push Notifications &amp; Alert Engine</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Google Play Store Deployment Prep</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Secure Local Storage &amp; Token Auth</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Backend Cloud API Sync</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=android-applications"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Inquire Mobile App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const systemsCardSoftware = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-3.5 sm:p-4 lg:p-4.5 border border-[#E2E8F0] bg-white shadow-xs hover:border-[#4338CA]/40 h-full">
      <div className="space-y-2.5">
        <div>
          <span className="text-[9.5px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
            Enterprise Grade
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
            Custom Software
          </h3>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-[#131B2E] font-mono">
              ₹34,999
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              / Year 1 Setup
            </span>
          </div>
          <p className="text-[10.5px] text-[#475569] mt-0.5 font-medium">
            Bespoke enterprise scope with dedicated SLA
          </p>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed line-clamp-2">
            Custom workflow automation engines, ERP data pipelines, and internal business management tooling.
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
          <span className="text-[9.5px] font-bold text-[#131B2E] uppercase tracking-wider block">
            Included Scope:
          </span>
          <div className="space-y-1 text-xs text-[#334155] font-medium">
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Custom Workflow Automation Engines</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Granular Permissions &amp; Audit Logs</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Automated Reporting &amp; Exports</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Dedicated Staging Testing Server</span>
            </div>
            <div className="flex items-start gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Complete Database Ownership</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <MagneticButton maxDistance={5} className="w-full">
          <Link
            href="/get-quote?plan=custom-software"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
          >
            <span>Inquire Custom Software</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </MagneticButton>
      </div>
    </div>
  );

  const systemsCardMore = (
    <div className="card-popup relative flex flex-col justify-between rounded-xl p-4 sm:p-4.5 border-2 border-dashed border-[#4338CA]/40 bg-[#FAF7F2] shadow-xs h-full">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-[#F4C95D]" />
          <span>Full Enterprise Specifications</span>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E]">
            Enterprise Combos &amp; Infrastructure
          </h3>
          <p className="text-[11.5px] text-[#64748B] mt-1 leading-relaxed">
            Need multi-branch warehouses, payment gateways, custom APIs, or bundled Web + Android applications?
          </p>
        </div>

        <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5 text-xs text-[#334155] font-medium">
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Prestige Combo (Web App + Android App at ₹38,000)</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Cloud Databases, Row-Level Security &amp; Supabase</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Custom API Webhooks &amp; Third-Party Gateways</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Check className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
            <span>Strict Service Level Agreement (SLA) &amp; Staging</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
        <Link
          href="/pricing#enterprise-packages"
          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#131B2E] hover:bg-black text-white shadow-sm transition-all"
        >
          <span>View Enterprise Specifications</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );

  const systemsSlides = [
    systemsCardWebApp,
    systemsCardAndroid,
    systemsCardSoftware,
    systemsCardMore,
  ];
  const systemsLabels = ['Web App (₹24,999)', 'Android App (₹24,999)', 'Custom Software (₹35k)', 'More Specs'];

  return (
    <section
      id="pricing"
      className="home-viewport-section border-b border-[#E2E8F0] bg-[#F5F0E8] py-4 sm:py-6 lg:py-6 scroll-mt-18"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#F97360]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container relative z-10 w-full space-y-3 sm:space-y-3.5 lg:space-y-4 my-auto">
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <Sparkles className="w-3 h-3 text-[#F4C95D]" />
              HONEST &amp; TRANSPARENT PRICING
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              Predictable Plans. Real Value.
            </h2>
            <p className="section-supporting-subtitle mx-auto text-xs sm:text-sm">
              Clear Year 1 setup pricing with ~50% predictable renewals. Choose between affordable business websites, institutional school portals &amp; ERP, or high-scale custom systems.
            </p>

            {/* Segmented 3-Way Intent Selector Tabs */}
            <div className="pt-1.5 flex items-center justify-center">
              <div
                role="tablist"
                aria-label="Pricing Categories"
                className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xs gap-1 max-w-full overflow-x-auto"
              >
                {/* 1. Websites Tab */}
                <button
                  type="button"
                  role="tab"
                  id="tab-websites"
                  aria-selected={activeTab === 'websites'}
                  aria-controls="panel-websites"
                  onClick={() => switchTab('websites')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    activeTab === 'websites'
                      ? 'bg-[#4338CA] text-white shadow-sm shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="xs:hidden">Websites</span>
                    <span className="hidden xs:inline">Business Websites</span>
                  </span>
                </button>

                {/* 2. Schools & Institutes Tab (MIDDLE) */}
                <button
                  type="button"
                  role="tab"
                  id="tab-schools"
                  aria-selected={activeTab === 'schools'}
                  aria-controls="panel-schools"
                  onClick={() => switchTab('schools')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    activeTab === 'schools'
                      ? 'bg-[#4338CA] text-white shadow-sm shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="xs:hidden">Schools</span>
                    <span className="hidden xs:inline">Schools &amp; Institutes</span>
                  </span>
                </button>

                {/* 3. Apps & Systems Tab */}
                <button
                  type="button"
                  role="tab"
                  id="tab-systems"
                  aria-selected={activeTab === 'systems'}
                  aria-controls="panel-systems"
                  onClick={() => switchTab('systems')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 ${
                    activeTab === 'systems'
                      ? 'bg-[#4338CA] text-white shadow-sm shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="xs:hidden">Apps &amp; Systems</span>
                    <span className="hidden xs:inline">Custom Apps &amp; Systems</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ══════════════════ TAB PANEL 1: WEBSITES ══════════════════ */}
        {activeTab === 'websites' && (
          <div
            id="panel-websites"
            role="tabpanel"
            aria-labelledby="tab-websites"
            className="space-y-3 sm:space-y-3.5 animate-fade-in"
          >
            {/* Launch Offer Callout Banner */}
            <div className="bg-white border-2 border-[#4338CA]/30 rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#4338CA] text-white font-extrabold text-[9.5px] uppercase tracking-wider rounded-full">
                    🎉 ZERO-RISK LAUNCH OFFER
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    Free Landing Page (₹0 for 3 Months)
                  </span>
                </div>
                <p className="text-[11.5px] text-[#64748B] leading-relaxed">
                  Test your verified business presence online for ₹0 upfront. Upgrade to an annual domain whenever you are ready.
                </p>
              </div>
              <Link
                href="/get-quote?plan=free-launch"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#131B2E] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs"
              >
                <span>Claim Free (₹0)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Mobile Slideshow (One-by-One with Touch & Arrows) */}
            <MobileSlideshow
              slides={websiteSlides}
              slideIndex={slideIndex}
              onSlideChange={setSlideIndex}
              slideLabels={websiteLabels}
            />

            {/* Desktop 3-Card Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
              {websiteCardStarter}
              {websiteCardGrowth}
              {websiteCardCms}
            </div>

            {/* Sub-Page Link Row for More Plans */}
            <div className="pt-0.5 text-center">
              <Link
                href="/pricing#website-plans"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
              >
                <span>Compare all 5 Website Tiers, Additional Page Pricing &amp; Domain Allowances</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB PANEL 2: SCHOOLS & INSTITUTES (MIDDLE) ══════════════════ */}
        {activeTab === 'schools' && (
          <div
            id="panel-schools"
            role="tabpanel"
            aria-labelledby="tab-schools"
            className="space-y-3 sm:space-y-3.5 animate-fade-in"
          >
            {/* Featured School Strategy Callout: Roshani Benchmark */}
            <div className="bg-white border-2 border-[#4338CA] rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#4338CA] text-white font-extrabold text-[9.5px] uppercase tracking-wider rounded-full shrink-0">
                    CAMPUS BENCHMARK 🎓
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    CBSE / ICSE Compliant Digital Infrastructure
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#131B2E]">
                  Roshani Modern Academy Benchmark: Complete School Portals &amp; Student ERP
                </h3>
                <p className="text-[11.5px] text-[#64748B]">
                  Empower your school with mandatory disclosure web portals, dynamic circular publishing, digital fee receipts, and multi-role access.
                </p>
              </div>

              <MagneticButton maxDistance={6}>
                <Link
                  href="/schools"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-[#4338CA]/20"
                >
                  <span>Explore School Solutions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </MagneticButton>
            </div>

            {/* Mobile Slideshow (One-by-One with Touch & Arrows) */}
            <MobileSlideshow
              slides={schoolSlides}
              slideIndex={slideIndex}
              onSlideChange={setSlideIndex}
              slideLabels={schoolLabels}
            />

            {/* Desktop 3-Card Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
              {schoolCardWebsite}
              {schoolCardCms}
              {schoolCardErp}
            </div>

            {/* Sub-Page Link Row for More Plans */}
            <div className="pt-0.5 text-center">
              <Link
                href="/schools"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
              >
                <span>Compare Complete School ERP, Fee Engine, Student Tiers &amp; Case Studies</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════ TAB PANEL 3: APPS & SYSTEMS ══════════════════ */}
        {activeTab === 'systems' && (
          <div
            id="panel-systems"
            role="tabpanel"
            aria-labelledby="tab-systems"
            className="space-y-3 sm:space-y-3.5 animate-fade-in"
          >
            {/* Featured Strategy Callout: The Prestige Combo */}
            <div className="bg-white border-2 border-[#4338CA] rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#F97360]/10 text-[#F97360] font-bold text-[9.5px] uppercase tracking-wider rounded-full border border-[#F97360]/20 shrink-0">
                    FEATURED COMBO 🚀
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    ₹38,000 Complete Institutional Bundle
                  </span>
                </div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#131B2E]">
                  The &ldquo;Prestige Combo&rdquo; (Custom Web Application + Google Play Store Android App)
                </h3>
                <p className="text-[11.5px] text-[#64748B]">
                  Equip your business or institution with both an official web portal and a verified mobile app for maximum credibility.
                </p>
              </div>

              <MagneticButton maxDistance={6}>
                <Link
                  href="/get-quote"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm shadow-[#4338CA]/20"
                >
                  <span>Inquire for Prestige Combo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </MagneticButton>
            </div>

            {/* Mobile Slideshow (One-by-One with Touch & Arrows) */}
            <MobileSlideshow
              slides={systemsSlides}
              slideIndex={slideIndex}
              onSlideChange={setSlideIndex}
              slideLabels={systemsLabels}
            />

            {/* Desktop 3-Card Grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-3.5 sm:gap-4 items-stretch">
              {systemsCardWebApp}
              {systemsCardAndroid}
              {systemsCardSoftware}
            </div>

            {/* Sub-Page Link Row for More Plans */}
            <div className="pt-0.5 text-center">
              <Link
                href="/pricing#enterprise-packages"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
              >
                <span>View Full Enterprise Specifications, Roshani Case Study Benchmark &amp; Custom Bundles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Unified Transparent Guarantee Bar */}
        <Reveal delay={100}>
          <div className="pt-2 sm:pt-2.5 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-1.5 gap-x-4 sm:gap-x-8 text-[10.5px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA] shrink-0" />
                <span>FIXED MILESTONE PAYMENTS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F97360] shrink-0" />
                <span>100% FULL CODE HANDOVER</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F4C95D] shrink-0" />
                <span>FREE DOMAIN &amp; SSL SETUP</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>ZERO VENDOR LOCK-IN</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
