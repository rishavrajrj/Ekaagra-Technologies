import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Check,
  CheckCircle2,
  Zap,
  Smartphone,
  Search,
  ShieldCheck,
  Cloud,
  Layers,
} from 'lucide-react';
import {
  faqs,
  pricingTiers,
} from '@/lib/data';
import FAQItem from '@/components/ui/FAQItem';
import HeroVisual from '@/components/ui/HeroVisual';
import IndustryShowcase from '@/components/ui/IndustryShowcase';
import BeforeAfterSection from '@/components/ui/BeforeAfterSection';
import ServicesList from '@/components/ui/ServicesList';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import ShowcaseFrameSync from '@/components/showcase/ShowcaseFrameSync';

export default function HomePage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] overflow-hidden">
      {/* ── Dynamic Hero Height Synchronizer for Cinematic Showcase ── */}
      <ShowcaseFrameSync />

      {/* ─── 1. HERO SECTION (WHY / POSITIONING & MASTER FRAME) ─── */}
      <section
        id="hero"
        className="relative py-4 px-0 bg-warm-grid border-b border-[#E2E8F0] overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-warm-glow pointer-events-none animate-aurora-glow" />

        <div className="site-container relative z-10 w-full flex flex-col gap-4">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-4 text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-full text-xs font-bold text-[#4338CA] uppercase tracking-wider shadow-sm hover:scale-[1.02] transition-transform">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                <span>WEBSITE DESIGN &amp; DEVELOPMENT STUDIO</span>
              </div>

              {/* Main Headline */}
              <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
                Your business deserves a website{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C] animate-gradient-shift">
                  people remember.
                </span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl font-normal">
                Beautiful, fast and conversion-focused websites designed around your business — not another generic template. We craft custom digital experiences that turn visitors into loyal customers.
              </p>

              {/* 3 Core Value Differentiators */}
              <div className="space-y-1.5 pt-0.5 text-xs sm:text-[13px] text-[#475569] font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Custom UI/UX crafted for your business — zero cookie-cutter templates</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Blazing fast load times with 100% mobile-first responsive design</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>1-click WhatsApp inquiries, lead capture forms &amp; Google Search SEO</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/get-quote"
                  className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/40 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Build My Website</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/40 hover:text-[#4338CA] transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5"
                >
                  <span>Explore Our Work</span>
                </Link>
              </div>

              {/* Micro Credibility Specs */}
              <div className="pt-3 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
                <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 hover:shadow-sm">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Specialty</span>
                  <span className="text-xs font-extrabold text-[#131B2E] block mt-0.5">High-Converting</span>
                </div>
                <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 hover:shadow-sm">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Performance</span>
                  <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">Fast &amp; Optimized</span>
                </div>
                <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 hover:shadow-sm">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Engagement</span>
                  <span className="text-xs font-extrabold text-[#F97360] block mt-0.5">WhatsApp Ready</span>
                </div>
                <div className="p-1.5 rounded-xl transition-all duration-200 hover:bg-white/60 hover:shadow-sm">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Ownership</span>
                  <span className="text-xs font-extrabold text-[#4338CA] block mt-0.5">100% Code &amp; Domain</span>
                </div>
              </div>
            </div>

            {/* Right Signature Visual Workspace (Preview Only) */}
            <div className="lg:col-span-7 w-full min-w-0">
              <HeroVisual />
            </div>
          </div>

          {/* Integrated Trust Strip Inside Hero */}
          <div className="pt-4 sm:pt-5 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>100% CUSTOM DESIGNED</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
                <span>MOBILE-FIRST ARCHITECTURE</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
                <span>DIRECT LEAD CAPTURE</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>POST-LAUNCH SUPPORT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. INDUSTRIES (WHO WE SERVE) ───────────────────────── */}
      <IndustryShowcase />

      {/* ─── 5. BEFORE → AFTER (TRANSFORMATION) ─────────────────── */}
      <BeforeAfterSection />

      {/* ─── 6. SERVICES (WHAT WE BUILD) ────────────────────────── */}
      <section
        id="services"
        className="relative py-10 sm:py-12 lg:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2] overflow-hidden"
      >
        <div className="site-container relative z-10 w-full space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#E2E8F0] pb-3">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#F4C95D]" />
                END-TO-END CAPABILITIES
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Services Built Around Your Brand
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md">
              From high-converting business websites to full-scale school ERP systems and native Android apps.
            </p>
          </div>

          {/* 3 Flagship Services Card Grid */}
          <ServicesList />

          {/* Integrated Capability Strip */}
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>CUSTOM CMS &amp; ADMIN PORTALS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
                <span>GOOGLE PLAY STORE APP DEPLOYMENT</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
                <span>PAYMENT GATEWAY &amp; WHATSAPP APIS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>CONTINUOUS CLOUD BACKUPS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. WORKFLOW (HOW WE WORK) ──────────────────────────── */}
      <section
        id="process"
        className="relative py-10 sm:py-12 lg:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2] overflow-hidden"
      >
        <div className="site-container relative z-10 w-full flex flex-col gap-6 sm:gap-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#F97360]" />
              TRANSPARENT WORKFLOW
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              From First Idea to Live Launch
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              A predictable 6-step roadmap with dedicated client review checkpoints before anything goes live.
            </p>
          </div>

          {/* Process Timeline */}
          <ProcessTimeline />
        </div>
      </section>

      {/* ─── 8. PRICING (INVESTMENT) ────────────────────────────── */}
      <section
        id="pricing"
        className="relative py-10 sm:py-12 lg:py-16 border-b border-[#E2E8F0] bg-[#F5F0E8] overflow-hidden"
      >
        <div className="site-container relative z-10 w-full space-y-6 sm:space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#F4C95D]" />
              HONEST &amp; TRANSPARENT PRICING
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              Simple Packages. Real Value.
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Clear starting packages tailored for small businesses, educational institutions, and growing enterprises.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {pricingTiers.slice(0, 3).map((tier) => (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-2xl p-4 sm:p-6 border transition-all duration-300 bg-white shadow-sm min-w-0 ${
                  tier.highlighted
                    ? 'border-2 border-[#4338CA] shadow-[#4338CA]/15 scale-[1.01]'
                    : 'border-[#E2E8F0] hover:border-[#4338CA]/30'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-2.5 right-3 bg-[#4338CA] text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3 min-w-0">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
                      {tier.badge || 'Package'}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#131B2E] mt-0.5 truncate">
                      {tier.title}
                    </h3>
                    <div className="mt-0.5 text-xl sm:text-2xl font-extrabold text-[#4338CA] font-mono">
                      {tier.startingFrom}
                    </div>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[9px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    {tier.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-[#334155] font-medium min-w-0">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/get-quote"
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                      tier.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[#4338CA]/25'
                        : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0]'
                    }`}
                  >
                    <span>Get a Quote</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Featured Strategy Callout: The Prestige Combo */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#F97360]/10 text-[#F97360] font-bold text-[8.5px] uppercase tracking-wider rounded-full border border-[#F97360]/20 shrink-0">
                  FEATURED COMBO 🚀
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  ₹38,000 Special Offer
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#131B2E]">
                The &ldquo;Prestige Combo&rdquo; Bundle (Custom Web App + Google Play Store Android App)
              </h3>
              <p className="text-[11px] text-[#64748B]">
                Combine an institutional web platform with an official mobile app for maximum credibility.
              </p>
            </div>

            <Link
              href="/pricing"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              <span>Explore All Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Integrated Pricing Transparency Strip */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>FIXED MILESTONE PAYMENTS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
                <span>ZERO HIDDEN OR RENEWAL SURPRISES</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
                <span>FREE DOMAIN &amp; SSL CONFIGURATION</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>FULL SOURCE CODE HANDOVER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. TECHNOLOGY (HOW WE BUILD) ───────────────────────── */}
      <section
        id="technology"
        className="relative py-10 sm:py-12 lg:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2] overflow-hidden"
      >
        <div className="site-container relative z-10 w-full flex flex-col gap-6 sm:gap-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-[#F97360]" />
              ENGINEERING &amp; STANDARDS
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              Engineered with Modern Speed &amp; Security
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Every project is built on modern frameworks for instant responsiveness, high SEO authority, and zero maintenance headaches.
            </p>
          </div>

          {/* 4 Technical Pillar Cards */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 items-stretch">
            <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-sm hover:border-[#4338CA]/40 transition-colors min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-sm">
                ⚡
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">Sub-500ms Edge Speed</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Next.js Server-Side Rendering (SSR) and optimized asset pipelines for instant global loading.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-sm hover:border-[#4338CA]/40 transition-colors min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                🛡️
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">100% Code Ownership</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full handover of clean Git repositories and databases. Zero proprietary builder lock-in.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-sm hover:border-[#4338CA]/40 transition-colors min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F97360]/10 text-[#F97360] flex items-center justify-center font-bold text-sm">
                🔍
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">Google Search Ready</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automated sitemaps, JSON-LD schema markup, and OpenGraph preview tags for high search discovery.
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2 shadow-sm hover:border-[#4338CA]/40 transition-colors min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F4C95D]/20 text-[#B45309] flex items-center justify-center font-bold text-sm">
                🔒
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">Enterprise Security</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Automated SSL encryption certificates, DDoS edge mitigation, and automated daily database backups.
              </p>
            </div>
          </div>

          {/* Built for Real-World Performance Proof Strip */}
          <div className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Built for Real-World Performance
                </span>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Fast, responsive, discoverable, secure, and built to scale with your business.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-2 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <Zap className="w-4 h-4 text-[#F97360] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Fast by Default</span>
                  <span className="text-[9px] text-[#64748B] block truncate">Optimized assets</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <Smartphone className="w-4 h-4 text-[#4338CA] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Responsive All</span>
                  <span className="text-[9px] text-[#64748B] block truncate">Mobile &amp; desktop</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <Search className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Search Ready</span>
                  <span className="text-[9px] text-[#64748B] block truncate">Technical SEO</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <ShieldCheck className="w-4 h-4 text-[#4338CA] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Secure by Design</span>
                  <span className="text-[9px] text-[#64748B] block truncate">SSL &amp; safe data</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <Cloud className="w-4 h-4 text-[#F97360] shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Ready to Scale</span>
                  <span className="text-[9px] text-[#64748B] block truncate">High traffic ready</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF7F2] border border-[#E2E8F0]/70 min-w-0">
                <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10.5px] font-bold text-[#131B2E] block truncate">Easy to Maintain</span>
                  <span className="text-[9px] text-[#64748B] block truncate">Zero vendor lock</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tech stack badges */}
          <div className="w-full pt-3 sm:pt-4 border-t border-[#E2E8F0] flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Kotlin / Android', 'Java', 'Spring Boot', 'Vercel Edge'].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#334155] shadow-sm hover:border-[#4338CA]/30 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. FAQ (OBJECTIONS) ────────────────────────────────── */}
      <section
        id="faq"
        className="relative py-10 sm:py-12 lg:py-16 border-b border-[#E2E8F0] bg-[#F5F0E8] overflow-hidden"
      >
        <div className="site-container relative z-10 w-full space-y-6 sm:space-y-8">
          {/* Top Header & Contact Row */}
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-6 items-center">
            {/* Left: Heading & Description */}
            <div className="lg:col-span-6 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-wider">
                CLEAR ANSWERS &amp; TRANSPARENCY
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Everything you need to know before we build.
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Clear policies on source code ownership, project milestones, free revisions, and ongoing post-launch technical support.
              </p>
            </div>

            {/* Right: Direct Inquiry Helper Card */}
            <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center text-sm font-bold shrink-0">
                  <Sparkles className="w-4 h-4 text-[#4338CA]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-[#131B2E] truncate">
                    Have a Custom Requirement?
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Send us your project details for a direct estimate.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/get-quote"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-[#4338CA]/20 uppercase tracking-wider"
                >
                  <span>Get Estimate</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] rounded-xl text-xs font-bold transition-all shadow-sm uppercase tracking-wider"
                >
                  <span>Contact Us</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom: 4 FAQ Accordion Items in a Balanced 2-Column Grid */}
          <div className="space-y-2.5">
            {/* Quick Answers Meta Row */}
            <div className="flex items-center justify-between px-1 text-[10px] font-bold tracking-wider uppercase">
              <span className="text-[#4338CA] font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                4 Common Questions
              </span>
              <span className="text-[#64748B] hidden sm:inline">
                Ownership • Hosting • Timeline • Revisions
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {faqs.slice(0, 4).map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>

          {/* Full-Width Assurance Panel: Your Project, Without Surprises */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2 border-b border-[#E2E8F0]/80">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] font-bold text-[9px] uppercase tracking-wider rounded-md shrink-0">
                  Project Guarantee
                </span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  Your Project, Without Surprises
                </h3>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Clear ownership, visible progress, private review, and direct technical support from start to launch.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 pt-1">
              <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 border border-[#E2E8F0]/70 flex items-start gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#131B2E] block truncate">Clear Scope</span>
                  <span className="text-[9.5px] text-[#64748B] leading-tight block mt-0.5">
                    Know what is included before development begins.
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 border border-[#E2E8F0]/70 flex items-start gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#131B2E] block truncate">Visible Progress</span>
                  <span className="text-[9.5px] text-[#64748B] leading-tight block mt-0.5">
                    Review the project at defined milestones.
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 border border-[#E2E8F0]/70 flex items-start gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F97360] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#131B2E] block truncate">Private Staging</span>
                  <span className="text-[9.5px] text-[#64748B] leading-tight block mt-0.5">
                    Test the real website before it goes public.
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 border border-[#E2E8F0]/70 flex items-start gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#131B2E] block truncate">Full Ownership</span>
                  <span className="text-[9.5px] text-[#64748B] leading-tight block mt-0.5">
                    Your code, domain, and assets remain yours.
                  </span>
                </div>
              </div>

              <div className="col-span-2 sm:col-span-1 bg-[#FAF7F2]/70 rounded-xl p-2.5 border border-[#E2E8F0]/70 flex items-start gap-1.5 min-w-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4338CA] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#131B2E] block truncate">Launch Support</span>
                  <span className="text-[9.5px] text-[#64748B] leading-tight block mt-0.5">
                    Help with deployment, DNS, SSL &amp; care.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Trust Strip */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>NO VENDOR LOCK-IN</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
                <span>TRANSPARENT CONTRACTS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
                <span>30-DAY SUPPORT INCLUDED</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>DEDICATED WHATSAPP ASSISTANCE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. FINAL CTA (CONVERSION) ─────────────────────────── */}
      <section
        id="final-cta"
        className="relative py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] border-b border-[#E2E8F0] text-center overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="site-container relative z-10 w-full flex flex-col items-center gap-6 sm:gap-8">
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-[11px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
              LET&apos;S BUILD YOUR WEBSITE
            </span>

            <h2 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
              Imagine what your business <br className="hidden sm:inline" />
              could look like online.
            </h2>

            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl mx-auto font-normal">
              Let&apos;s turn your idea into a website people remember. Tell us what you need and receive a detailed roadmap and estimate within 24 hours.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-xl shadow-[#4338CA]/25 hover:scale-[1.01]"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] transition-all duration-200 shadow-sm"
            >
              <span>Explore Our Work</span>
            </Link>
          </div>

          {/* What Happens Next - Compact 3-Step Journey Panel */}
          <div className="w-full max-w-4xl mx-auto bg-white/90 border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 pb-2 border-b border-[#E2E8F0]/80 text-left">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] font-bold text-[9px] uppercase tracking-wider rounded-md shrink-0">
                  Your First Step
                </span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#131B2E]">
                  What Happens Next
                </h3>
              </div>
              <p className="text-[11px] text-[#64748B]">
                Clear scope. No pressure. No vendor lock-in.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="bg-[#FAF7F2]/70 rounded-xl p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#4338CA]/10 text-[#4338CA] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  01
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#131B2E] block">Share Your Idea</span>
                  <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                    Tell us about your business, audience, goals, and required features.
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2]/70 rounded-xl p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#F97360]/10 text-[#F97360] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  02
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#131B2E] block">Get Your Roadmap</span>
                  <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                    Receive a clear scope, recommended approach, timeline, and estimate.
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2]/70 rounded-xl p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  03
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-[#131B2E] block">Start With Confidence</span>
                  <span className="text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                    Review the plan, approve the direction, and move into development.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Micro Assurance Grid */}
          <div className="w-full pt-4 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-center">
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Turnaround</span>
              <span className="text-xs font-extrabold text-[#131B2E] block mt-0.5">24h Roadmap</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Consultation</span>
              <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">100% Free &amp; Direct</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Delivery</span>
              <span className="text-xs font-extrabold text-[#F97360] block mt-0.5">Staging Sign-off</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Ownership</span>
              <span className="text-xs font-extrabold text-[#4338CA] block mt-0.5">Full Code Rights</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



