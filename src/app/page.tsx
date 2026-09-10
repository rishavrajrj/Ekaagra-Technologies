import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { faqs } from '@/lib/data';
import {
  createPageMetadata,
  localBusinessSchema,
  faqPageSchema,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
} from '@/lib/seo.config';
import FAQItem from '@/components/ui/FAQItem';
import HeroVisual from '@/components/ui/HeroVisual';
import IndustryShowcase from '@/components/ui/IndustryShowcase';
import BeforeAfterSection from '@/components/ui/BeforeAfterSection';
import ServicesList from '@/components/ui/ServicesList';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import HomePricingSection from '@/components/ui/HomePricingSection';
import ShowcaseFrameSync from '@/components/showcase/ShowcaseFrameSync';
import AnimatedPageHero from '@/components/ui/AnimatedPageHero';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';
import GlowCard from '@/components/motion/GlowCard';

export const metadata: Metadata = createPageMetadata({
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  path: '/',
});

export default function HomePage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] overflow-hidden">
      {/* Structured Data: LocalBusiness & FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(faqs.slice(0, 4))),
        }}
      />

      {/* -- Dynamic Hero Height Synchronizer for Cinematic Showcase -- */}
      <ShowcaseFrameSync />

      {/* --- 1. UNIFIED PREMIUM HERO SECTION --- */}
      <AnimatedPageHero
        pageName="home"
        id="hero"
        showTrustStrip={false}
        rightContent={<HeroVisual />}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
          <MagneticButton maxDistance={6}>
            <Link
              href="/get-quote"
              className="premium-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-300 shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </MagneticButton>
          <MagneticButton maxDistance={5}>
            <Link
              href="/projects"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-white hover:bg-[#FAF7F2] text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] hover:border-[#4338CA]/40 hover:text-[#4338CA] transition-all duration-300 shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              <span>Explore Our Work</span>
            </Link>
          </MagneticButton>
        </div>
      </AnimatedPageHero>

      {/* --- 3. INDUSTRIES (WHO WE SERVE) ------------------------- */}
      <IndustryShowcase />

      {/* --- 5. BEFORE → AFTER (TRANSFORMATION) ------------------- */}
      <BeforeAfterSection />

      {/* ─── 6. SERVICES (WHAT WE BUILD) ────────────────────────── */}
      <section
        id="services"
        className="home-viewport-section border-b border-[#E2E8F0] bg-[#FAF7F2] py-4 sm:py-6 lg:py-6"
      >
        <div className="site-container relative z-10 w-full space-y-4 sm:space-y-5 lg:space-y-5 my-auto">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#F4C95D]" />
                END-TO-END CAPABILITIES
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Services Built Around Your Brand
              </h2>
              <p className="section-supporting-subtitle mx-auto text-xs sm:text-sm">
                From high-converting business websites to full-scale school ERP systems and native Android apps.
              </p>
            </div>
          </Reveal>

          {/* 3 Flagship Services Card Grid */}
          <ServicesList />
        </div>
      </section>

      {/* ─── 7. WORKFLOW (HOW WE WORK) ──────────────────────────── */}
      <section
        id="process"
        className="home-viewport-section border-b border-[#E2E8F0] bg-[#FAF7F2] py-4 sm:py-6 lg:py-6"
      >
        <div className="site-container relative z-10 w-full flex flex-col gap-3.5 sm:gap-4 lg:gap-5 my-auto">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#F97360]" />
                TRANSPARENT WORKFLOW
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                From First Idea to Live Launch
              </h2>
              <p className="section-supporting-subtitle mx-auto text-xs sm:text-sm">
                A predictable 6-step roadmap with dedicated client review checkpoints before anything goes live.
              </p>
            </div>
          </Reveal>

          {/* Process Timeline */}
          <ProcessTimeline />
        </div>
      </section>

      {/* ─── 8. PRICING (INVESTMENT) ────────────────────────────── */}
      <HomePricingSection />

      {/* ─── 9. TECHNOLOGY (HOW WE BUILD) ───────────────────────── */}
      <section
        id="technology"
        className="home-viewport-section border-b border-[#E2E8F0] bg-[#FAF7F2] py-4 sm:py-6 lg:py-6"
      >
        <div className="site-container relative z-10 w-full flex flex-col gap-3.5 sm:gap-4 lg:gap-4.5 my-auto">
          {/* Section Header */}
          <Reveal>
            <div className="text-center max-w-3xl mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3 text-[#F97360]" />
                ENGINEERING &amp; STANDARDS
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Engineered with Modern Speed &amp; Security
              </h2>
              <p className="section-supporting-subtitle mx-auto text-xs sm:text-sm">
                Every project is built on modern frameworks for instant responsiveness, high SEO authority, and zero maintenance headaches.
              </p>
            </div>
          </Reveal>

          {/* 4 Technical Pillar Cards */}
          <Reveal delay={100}>
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 items-stretch">
              <GlowCard className="p-3.5 sm:p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-1.5 shadow-xs min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E] tracking-tight text-sm sm:text-base">Sub-500ms Edge Speed</h3>
                <p className="card-supporting-description leading-relaxed font-normal text-xs text-[#64748B]">
                  Next.js Server-Side Rendering (SSR) and optimized asset pipelines for instant global loading.
                </p>
              </GlowCard>

              <GlowCard className="p-3.5 sm:p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-1.5 shadow-xs min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  🛡️
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E] tracking-tight text-sm sm:text-base">100% Code Ownership</h3>
                <p className="card-supporting-description leading-relaxed font-normal text-xs text-[#64748B]">
                  Full handover of clean Git repositories and databases. Zero proprietary builder lock-in.
                </p>
              </GlowCard>

              <GlowCard className="p-3.5 sm:p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-1.5 shadow-xs min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F97360]/10 text-[#F97360] flex items-center justify-center font-bold text-xs">
                  🔍
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E] tracking-tight text-sm sm:text-base">Google Search Ready</h3>
                <p className="card-supporting-description leading-relaxed font-normal text-xs text-[#64748B]">
                  Automated sitemaps, JSON-LD schema markup, and OpenGraph preview tags for high search discovery.
                </p>
              </GlowCard>

              <GlowCard className="p-3.5 sm:p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-1.5 shadow-xs min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#F4C95D]/20 text-[#B45309] flex items-center justify-center font-bold text-xs">
                  🔒
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E] tracking-tight text-sm sm:text-base">Enterprise Security</h3>
                <p className="card-supporting-description leading-relaxed font-normal text-xs text-[#64748B]">
                  Automated SSL encryption certificates, DDoS edge mitigation, and automated daily database backups.
                </p>
              </GlowCard>
            </div>
          </Reveal>

          {/* Tech stack badges */}
          <Reveal delay={150}>
            <div className="w-full pt-2 sm:pt-2.5 px-2 border-t border-[#E2E8F0] flex flex-wrap justify-center items-center gap-1 sm:gap-1.5 max-w-4xl mx-auto">
              {['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Kotlin / Android', 'Java', 'Spring Boot', 'Vercel Edge'].map((tech) => (
                <span
                  key={tech}
                  className="px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-md text-[11px] font-bold text-[#334155] shadow-2xs hover:border-[#4338CA]/40 hover:-translate-y-0.5 transition-all cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 10. FAQ (OBJECTIONS) ────────────────────────────────── */}
      <section
        id="faq"
        className="home-viewport-section border-b border-[#E2E8F0] bg-[#F5F0E8] py-4 sm:py-6 lg:py-6"
      >
        <div className="site-container relative z-10 w-full space-y-3 sm:space-y-3.5 lg:space-y-4 my-auto">
          {/* Top Header & Contact Row */}
          <Reveal>
            <div className="grid lg:grid-cols-12 gap-3.5 lg:gap-5 items-center">
              {/* Left: Heading & Description */}
              <div className="lg:col-span-6 space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 border border-[#4338CA]/20 text-[#4338CA] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3 text-[#F97360]" />
                  CLEAR ANSWERS &amp; TRANSPARENCY
                </span>
                <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                  Everything you need to know before we build.
                </h2>
                <p className="section-supporting-subtitle text-xs sm:text-sm">
                  Clear policies on source code ownership, project milestones, free revisions, and ongoing post-launch technical support.
                </p>
              </div>

              {/* Right: Direct Inquiry Helper Card */}
              <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center text-xs font-bold shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-bold text-[#131B2E] truncate">
                      Have a Custom Requirement?
                    </h4>
                    <p className="text-[11px] text-[#64748B]">
                      Send us your project details for a direct estimate.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <MagneticButton maxDistance={5}>
                    <Link
                      href="/get-quote"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-lg text-xs font-bold transition-all shadow-xs shadow-[#4338CA]/20 uppercase tracking-wider hover:-translate-y-0.5"
                    >
                      <span>Get Estimate</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </MagneticButton>
                  <MagneticButton maxDistance={4}>
                    <Link
                      href="/contact"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-all shadow-xs uppercase tracking-wider hover:-translate-y-0.5"
                    >
                      <span>Contact Us</span>
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Bottom: 4 FAQ Accordion Items in a Balanced 2-Column Grid */}
          <Reveal delay={100}>
            <div className="space-y-2">
              {/* Quick Answers Meta Row */}
              <div className="flex items-center justify-between px-1 text-[9.5px] font-bold tracking-wider uppercase">
                <span className="text-[#4338CA] font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                  4 Common Questions
                </span>
                <span className="text-[#64748B] hidden sm:inline">
                  Ownership • Hosting • Timeline • Revisions
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
                {faqs.slice(0, 4).map((faq, index) => (
                  <FAQItem key={index} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </Reveal>

          {/* Direct Project Guarantee & Post-Launch Support Banner */}
          <Reveal delay={150}>
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-[13px] font-extrabold text-[#131B2E]">
                    The Ekaagra Guarantee: 30-Day Post-Launch Support &amp; Zero Hidden Fees
                  </h4>
                  <p className="text-[10.5px] sm:text-[11px] text-[#64748B] mt-0.5">
                    Every deployment includes 30 days of complimentary bug fixes, performance monitoring, and complete handover of all production keys.
                  </p>
                </div>
              </div>
              <Link
                href="/contact"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] rounded-lg text-xs font-bold transition-all shadow-xs uppercase tracking-wider hover:-translate-y-0.5"
              >
                <span>Ask a Question</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 11. FINAL CTA (CONVERSION) ─────────────────────────── */}
      <section
        id="final-cta"
        className="home-viewport-section bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] border-b border-[#E2E8F0] text-center py-4 sm:py-6 lg:py-6"
      >
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none animate-aurora-glow" />

        <div className="site-container relative z-10 w-full flex flex-col items-center gap-4 sm:gap-4.5 lg:gap-5 my-auto">
          <Reveal>
            <div className="space-y-2 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-[10.5px] sm:text-[11px] font-extrabold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
                LET&apos;S BUILD YOUR WEBSITE
              </span>

              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Imagine what your business <br className="hidden sm:inline" />
                could look like online.
              </h2>

              <p className="section-supporting-subtitle mx-auto font-normal text-xs sm:text-sm">
                Let&apos;s turn your idea into a website people remember. Tell us what you need and receive a detailed roadmap and estimate within 24 hours.
              </p>
            </div>
          </Reveal>

          {/* Action Buttons */}
          <Reveal delay={120}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <MagneticButton maxDistance={7}>
                <Link
                  href="/get-quote"
                  className="premium-shimmer-btn inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-lg shadow-[#4338CA]/25 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Start Your Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </MagneticButton>
              <MagneticButton maxDistance={5}>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 sm:py-3 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs tracking-wider uppercase rounded-xl border border-[#E2E8F0] transition-all duration-200 shadow-xs hover:-translate-y-0.5"
                >
                  <span>Book Free Consultation</span>
                </Link>
              </MagneticButton>
            </div>
          </Reveal>

          {/* What Happens Next - Compact 3-Step Journey Panel */}
          <Reveal delay={180}>
            <div className="w-full max-w-4xl mx-auto bg-white/90 border border-[#E2E8F0] rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0 hover:-translate-y-0.5 transition-transform">
                  <span className="w-5.5 h-5.5 rounded-lg bg-[#4338CA]/10 text-[#4338CA] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    01
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#131B2E] block">Share Your Idea</span>
                    <span className="text-[10px] sm:text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                      Tell us about your business, audience, goals, and required features.
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0 hover:-translate-y-0.5 transition-transform">
                  <span className="w-5.5 h-5.5 rounded-lg bg-[#F97360]/10 text-[#F97360] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    02
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#131B2E] block">Get Your Roadmap</span>
                    <span className="text-[10px] sm:text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                      Receive a clear scope, recommended approach, timeline, and estimate.
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2]/70 rounded-xl p-2.5 sm:p-3 border border-[#E2E8F0]/70 flex items-start gap-2 min-w-0 hover:-translate-y-0.5 transition-transform">
                  <span className="w-5.5 h-5.5 rounded-lg bg-emerald-100 text-emerald-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    03
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[#131B2E] block">Start With Confidence</span>
                    <span className="text-[10px] sm:text-[10.5px] text-[#64748B] leading-relaxed block mt-0.5">
                      Review the plan, approve the direction, and move into development.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
