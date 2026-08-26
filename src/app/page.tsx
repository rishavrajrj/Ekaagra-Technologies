import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  ExternalLink,
  Check,
  Zap,
  Globe,
  Building2,
  GraduationCap,
  Smartphone,
  Code2,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  services,
  projects,
  technologyCategories,
  faqs,
  pricingTiers,
  projectPricingBenchmark,
  schoolSalesStrategies,
} from '@/lib/data';
import FAQItem from '@/components/ui/FAQItem';
import HeroVisual from '@/components/ui/HeroVisual';
import ImagineBusinessSection from '@/components/ui/ImagineBusinessSection';
import IndustryShowcase from '@/components/ui/IndustryShowcase';
import BeforeAfterSection from '@/components/ui/BeforeAfterSection';
import BenefitsSection from '@/components/ui/BenefitsSection';
import ServicesList from '@/components/ui/ServicesList';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import ProjectCard from '@/components/ui/ProjectCard';
import LiveWebsitePreview from '@/components/ui/LiveWebsitePreview';

export default function HomePage() {
  const featuredProject = projects.find((p) => p.slug === 'roshani-public-school') || projects[0];
  const secondaryProjects = projects.filter((p) => p.slug !== featuredProject.slug);

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] overflow-hidden">
      {/* ─── 1. HERO SECTION ───────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-10 pb-12 sm:pb-16 bg-warm-grid border-b border-[#E2E8F0] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-warm-glow pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-8 items-center">
            {/* Left Content (42% width on desktop) */}
            <div className="lg:col-span-5 space-y-5 text-left">
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

              {/* CTAs */}
              <div className="pt-0.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/get-quote"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/35 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Build My Website</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#portfolio"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/30 transition-all duration-200 shadow-sm"
                >
                  <span>Explore Our Work</span>
                </Link>
              </div>

              {/* Micro specs / Real credibility pill grid */}
              <div className="pt-4 border-t border-[#E2E8F0] grid grid-cols-3 gap-3 max-w-md">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Specialty</span>
                  <span className="text-xs font-extrabold text-[#131B2E] block mt-0.5">High-Converting Web</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Performance</span>
                  <span className="text-xs font-extrabold text-emerald-600 block mt-0.5">Fast &amp; Optimized</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Engagement</span>
                  <span className="text-xs font-extrabold text-[#F97360] block mt-0.5">WhatsApp Ready</span>
                </div>
              </div>
            </div>

            {/* Right Signature Visual Workspace (58% width on desktop) */}
            <div className="lg:col-span-7">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STRIP ────────────────────────────────────── */}
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
              <span>INSTANT WHATSAPP LEAD CAPTURE</span>
            </div>
            <span className="text-[#CBD5E1]">•</span>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>POST-LAUNCH CARE &amp; SUPPORT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. STAR PORTFOLIO SHOWCASE ────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-[#E2E8F0] bg-[#FAF7F2]" id="portfolio">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#E2E8F0] pb-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                FEATURED WORK &amp; CASE STUDIES
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
                Websites that make businesses look better.
              </h2>
              <p className="text-base text-[#64748B] max-w-2xl leading-relaxed">
                Every project is designed around the people who will use it — and the business goals behind it.
              </p>
            </div>

            <Link
              href="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold uppercase tracking-wider text-[#4338CA] hover:border-[#4338CA] transition-colors shadow-sm shrink-0"
            >
              <span>View All Projects</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Featured Major Project Spotlight: Roshani Public School with Live Interactive Preview */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-12 group hover:border-[#4338CA]/40 transition-all duration-300">
            <div className="lg:col-span-7 bg-[#F3EFEA] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-3 sm:p-4 flex flex-col justify-center">
              <LiveWebsitePreview
                url={featuredProject.liveUrl}
                title={featuredProject.title}
                fallbackImage={featuredProject.image || '/images/projects/roshani-public-school/roshani-2.png'}
                showDeviceControls={true}
                autoLoad={false}
                heightClass="h-[360px] sm:h-[460px]"
                isFeatured={true}
              />
            </div>

            <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                    Education • School Web Platform
                  </span>
                  <span className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                    STAR PORTFOLIO PIECE
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                  {featuredProject.title}
                </h3>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  An engaging digital experience designed to showcase academics, campus facilities, achievements, CBSE mandatory disclosures, and instant online admissions.
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Dedicated admissions guidelines &amp; enquiry workflow</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Real-time digital notice board without writing code</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>CBSE compliance &amp; mandatory disclosure ready</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-3">
                  {featuredProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-semibold bg-[#FAF7F2] text-[#475569] border border-[#E2E8F0] px-3 py-1 rounded-lg"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between gap-4">
                {featuredProject.liveUrl && (
                  <a
                    href={featuredProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-[#4338CA]/25 uppercase tracking-wider"
                  >
                    <span>Visit Live Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <Link
                  href={`/projects/${featuredProject.slug}`}
                  className="text-xs font-bold text-[#475569] hover:text-[#4338CA] flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Secondary Real Projects Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {secondaryProjects.slice(0, 3).map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. IMAGINE YOUR BUSINESS HERE ─────────────────────── */}
      <ImagineBusinessSection />

      {/* ─── 5. INDUSTRY SELECTOR & INTERACTIVE LIVE PREVIEW ──── */}
      <IndustryShowcase />

      {/* ─── 6. BEFORE → AFTER TRANSFORMATION ──────────────────── */}
      <BeforeAfterSection />

      {/* ─── 7. SERVICES SECTION ───────────────────────────────── */}
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

          {/* Upgraded Services Card Grid */}
          <ServicesList />
        </div>
      </section>

      {/* ─── 8. CUSTOMER BENEFITS SECTION ──────────────────────── */}
      <BenefitsSection />

      {/* ─── 9. PROCESS SECTION ────────────────────────────────── */}
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
              A predictable 6-step roadmap with guaranteed client review checkpoints before anything goes live.
            </p>
          </div>

          {/* Process Timeline Component */}
          <ProcessTimeline />
        </div>
      </section>

      {/* ─── 10. PRICING & INVESTMENT SECTION ───────────────────── */}
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
                      Included Deliverables:
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

      {/* ─── 11. MODERN TECHNOLOGY & CREDIBILITY ────────────────── */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
          <div className="space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest">
              CREDIBILITY &amp; MODERN FOUNDATION
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E]">
              Built with Modern Standards
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B]">
              We build on proven, lightning-fast foundations used by the world’s leading digital products.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 max-w-4xl mx-auto">
            {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Android / Kotlin', 'Java', 'Spring Boot', 'Vercel Edge'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#334155] shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 12. FAQ ACCORDION ─────────────────────────────────── */}
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
              Everything you need to know about working with Ekaagra Technologies.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. FINAL MEMORABLE CTA ───────────────────────────── */}
      <section className="py-28 sm:py-36 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#F97360]" />
            TRANSFORM YOUR DIGITAL PRESENCE
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



