import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Check,
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

export default function HomePage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] overflow-hidden">
      {/* ─── 1. HERO SECTION (WHY / POSITIONING) ────────────────── */}
      <section className="relative pt-3 sm:pt-5 pb-6 sm:pb-8 bg-warm-grid border-b border-[#E2E8F0] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-warm-glow pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-4 text-left">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-full text-xs font-bold text-[#4338CA] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                <span>WEBSITE DESIGN &amp; DEVELOPMENT STUDIO</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[3.15rem] font-extrabold text-[#131B2E] tracking-tight leading-[1.12]">
                Your business deserves a website{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#EA580C]">
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
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/35 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Build My Website</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/30 transition-all duration-200 shadow-sm"
                >
                  <span>Explore Our Work</span>
                </Link>
              </div>

              {/* Micro Credibility Specs */}
              <div className="pt-3 border-t border-[#E2E8F0] grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Specialty</span>
                  <span className="text-xs font-extrabold text-[#131B2E] block mt-0.5">High-Converting</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Performance</span>
                  <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">Fast &amp; Optimized</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Engagement</span>
                  <span className="text-xs font-extrabold text-[#F97360] block mt-0.5">WhatsApp Ready</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Ownership</span>
                  <span className="text-xs font-extrabold text-[#4338CA] block mt-0.5">100% Code &amp; Domain</span>
                </div>
              </div>
            </div>

            {/* Right Signature Visual Workspace (Preview Only) */}
            <div className="lg:col-span-7">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STRIP (PROOF) ─────────────────────────────── */}
      <section className="bg-[#FAF7F2] border-b border-[#E2E8F0] py-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 min-w-[700px] text-xs font-bold tracking-wider text-[#475569] uppercase">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#4338CA]"></span>
              <span>100% CUSTOM DESIGNED</span>
            </div>
            <span className="text-[#CBD5E1]">•</span>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#F97360]"></span>
              <span>MOBILE-FIRST ARCHITECTURE</span>
            </div>
            <span className="text-[#CBD5E1]">•</span>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#F4C95D]"></span>
              <span>DIRECT LEAD CAPTURE</span>
            </div>
            <span className="text-[#CBD5E1]">•</span>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>POST-LAUNCH SUPPORT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. INDUSTRIES (WHO WE SERVE) ───────────────────────── */}
      <IndustryShowcase />

      {/* ─── 5. BEFORE → AFTER (TRANSFORMATION) ─────────────────── */}
      <BeforeAfterSection />

      {/* ─── 6. SERVICES (WHAT WE BUILD) ────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-[#E2E8F0] bg-[#FAF7F2]" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
                END-TO-END CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
                Services Built Around Your Brand
              </h2>
            </div>
            <p className="text-sm text-[#64748B] max-w-md">
              From high-converting business websites to full-scale school ERP systems and native Android apps.
            </p>
          </div>

          {/* 5 Core Services Card Grid */}
          <ServicesList />
        </div>
      </section>

      {/* ─── 7. WORKFLOW (HOW WE WORK) ──────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-[#E2E8F0] bg-[#FAF7F2]" id="process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
              TRANSPARENT WORKFLOW
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
              From First Idea to Live Launch
            </h2>
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              A predictable 6-step roadmap with dedicated client review checkpoints before anything goes live.
            </p>
          </div>

          {/* Process Timeline */}
          <ProcessTimeline />
        </div>
      </section>

      {/* ─── 8. PRICING (INVESTMENT) ────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-[#E2E8F0] bg-[#F5F0E8]" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
              HONEST &amp; TRANSPARENT PRICING
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
              Simple Packages. Real Value.
            </h2>
            <p className="text-base sm:text-lg text-[#64748B]">
              Clear starting packages tailored for small businesses, educational institutions, and growing enterprises.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.slice(0, 3).map((tier) => (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-3xl p-8 border transition-all duration-300 bg-white shadow-xl ${
                  tier.highlighted
                    ? 'border-2 border-[#4338CA] shadow-[#4338CA]/15 scale-[1.02]'
                    : 'border-[#E2E8F0] hover:border-[#4338CA]/30'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 right-6 bg-[#4338CA] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
                      {tier.badge || 'Package'}
                    </span>
                    <h3 className="text-xl font-extrabold text-[#131B2E] mt-1">
                      {tier.title}
                    </h3>
                    <div className="mt-3 text-3xl font-extrabold text-[#4338CA] font-mono">
                      {tier.startingFrom}
                    </div>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] space-y-2.5">
                    <span className="text-[11px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    {tier.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-[#334155] font-medium">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/get-quote"
                    className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                      tier.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[#4338CA]/25'
                        : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0]'
                    }`}
                  >
                    <span>Get a Quote</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Featured Strategy Callout: The Prestige Combo */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 shadow-xl grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#F97360]/10 text-[#F97360] font-bold text-[10px] uppercase tracking-wider rounded-full border border-[#F97360]/20">
                  FEATURED INSTITUTIONAL BUNDLE 🚀
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  ₹38,000 Special Offer
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-[#131B2E]">
                The &ldquo;Prestige Combo&rdquo; Bundle (Website + Google Play Store App)
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Combine a full institutional Web Application with an official Play Store Android Application into a single high-impact package giving your school or business maximum authority.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
              >
                <span>Explore All Packages</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. TECHNOLOGY (HOW WE BUILD) ───────────────────────── */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center">
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest">
              TECHNOLOGY STACK
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
              Engineered with Modern Standards
            </h3>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
            {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Kotlin / Android', 'Java', 'Spring Boot', 'Vercel Edge'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#334155] shadow-sm hover:border-[#4338CA]/30 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. FAQ (OBJECTIONS) ────────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-[#E2E8F0] bg-[#F5F0E8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
              CLEAR ANSWERS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#64748B]">
              Key details regarding ownership, timelines, revisions, and post-launch support.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 11. FINAL CTA (CONVERSION) ─────────────────────────── */}
      <section className="py-28 sm:py-36 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#F97360]" />
            LET&apos;S BUILD YOUR WEBSITE
          </span>

          <h2 className="text-3xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight leading-tight">
            Imagine what your business <br className="hidden sm:inline" />
            could look like online.
          </h2>

          <p className="text-base sm:text-xl text-[#64748B] leading-relaxed max-w-2xl mx-auto font-normal">
            Let&apos;s turn your idea into a website people remember. Tell us what you need and receive a detailed roadmap and estimate within 24 hours.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-2xl shadow-[#4338CA]/30 hover:scale-[1.02]"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] transition-all duration-200 shadow-sm"
            >
              <span>Explore Our Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



