import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Globe,
  FileText,
  Database,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import SchoolSolutionCards from '@/components/schools/SchoolSolutionCards';
import SchoolFeatureComparison from '@/components/schools/SchoolFeatureComparison';
import SchoolPricingTable from '@/components/schools/SchoolPricingTable';
import SchoolVisualShowcase from '@/components/schools/SchoolVisualShowcase';
import SchoolOptionalModules from '@/components/schools/SchoolOptionalModules';
import SchoolFaqAccordion from '@/components/schools/SchoolFaqAccordion';
import {
  createPageMetadata,
  webPageSchema,
  serviceSchema,
  SITE_URL,
} from '@/lib/seo.config';

export const metadata: Metadata = createPageMetadata({
  title: 'School Website, CMS & ERP Solutions | Ekaagra Technologies',
  description:
    'From professional CBSE/ICSE school websites to student-tiered School ERP platforms, Ekaagra Technologies builds, hosts, and supports complete digital school management systems with transparent pricing.',
  path: '/schools',
  keywords: [
    'school website development',
    'school ERP Bihar',
    'school ERP Motihari',
    'school management software',
    'CBSE school website',
    'ICSE school ERP',
    'student management system',
    'school CMS portal',
    'school attendance software',
    'school fees management system',
  ],
});

export default function SchoolsPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'School Website, CMS & ERP Solutions | Ekaagra Technologies',
              description:
                'Professional school websites, CMS portals, and student-tiered ERP platforms built for CBSE, ICSE, and State Board schools by Ekaagra Technologies.',
              url: `${SITE_URL}/schools`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'School Technology & ERP Platforms',
              description:
                'Modern school websites, CMS management, student records, fee management, attendance, and CBSE report card generation for educational institutions.',
              url: `${SITE_URL}/schools`,
            })
          ),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'School Solutions & Pricing' }]} />
      </div>

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-5 relative z-10 max-w-4xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
              SCHOOL TECHNOLOGY SOLUTIONS
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
              Build a Smarter Digital School
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              From a professional school website to comprehensive academic administration, student records, fee collection, and scalable digital operations.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/schools/configure"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 hover:-translate-y-0.5"
              >
                <span>Configure Your School Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#solutions"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-[#E2E8F0] shadow-xs"
              >
                <span>Explore Solutions</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-5 py-3.5 text-[#64748B] hover:text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                <span>Talk to Ekaagra</span>
              </Link>
            </div>
          </Reveal>

          {/* Compact Progression Visual Path */}
          <Reveal delay={300}>
            <div className="mt-8 p-4 sm:p-5 rounded-3xl bg-white border border-[#E2E8F0] shadow-md max-w-3xl mx-auto">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-widest block mb-3 text-center">
                Digital Infrastructure Progression
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-left">
                {/* Step 1 */}
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                      <Globe className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B]">01</span>
                  </div>
                  <h2 className="text-xs font-bold text-[#131B2E]">
                    School Website
                  </h2>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Public presence &amp; admissions
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B]">02</span>
                  </div>
                  <h2 className="text-xs font-bold text-[#131B2E]">
                    Website + CMS
                  </h2>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Staff notice publishing
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                      <Database className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-mono text-[#64748B]">03</span>
                  </div>
                  <h2 className="text-xs font-bold text-[#131B2E]">
                    School ERP
                  </h2>
                  <p className="text-[11px] text-[#64748B] leading-tight">
                    Academic &amp; student records
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-[#4338CA] text-white flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#4338CA] text-white">
                      Unified
                    </span>
                  </div>
                  <h2 className="text-xs font-bold text-[#4338CA]">
                    Website + CMS + ERP
                  </h2>
                  <p className="text-[11px] text-indigo-900 leading-tight">
                    Unified campus ecosystem
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 2. FOUR SOLUTIONS (COMPACT CARDS + PROGRESSIVE DISCLOSURE) ──────── */}
      <SchoolSolutionCards />

      {/* ─── 3. COMPARISON MATRIX (COMPACT TABLE + MOBILE STICKY COLUMN) ────── */}
      <SchoolFeatureComparison />

      {/* ─── 4. STUDENT-BASED PRICING & YEAR 1 VS RENEWAL EXPANDER ──────────── */}
      <SchoolPricingTable />

      {/* ─── 5. PLATFORM DEMONSTRATION (5 TABBED INTERFACES) ─────────────────── */}
      <SchoolVisualShowcase />

      {/* ─── 6. OPTIONAL SCHOOL MODULES (CATEGORY EXPANDABLE GRID) ──────────── */}
      <SchoolOptionalModules />

      {/* ─── 7. FREQUENTLY ASKED QUESTIONS (SINGLE-EXPANSION ACCORDION) ─────── */}
      <SchoolFaqAccordion />

      {/* ─── 8. FINAL HIGH-INTENT CONVERSION CTA ─────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>START YOUR SCHOOL TRANSFORMATION</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Ready to Modernize Your School&apos;s Technology?
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Generate an instant institutional estimate or schedule a live system walkthrough with our school engineering team.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/schools/configure"
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 hover:-translate-y-0.5"
            >
              <span>Configure Your School Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#FAF7F2] text-[#131B2E] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all border border-[#E2E8F0] shadow-xs"
            >
              <span>Speak to an Engineer</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
