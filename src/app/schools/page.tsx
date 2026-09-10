import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

import SchoolSolutionCards from '@/components/schools/SchoolSolutionCards';
import AnimatedPageHero from '@/components/ui/AnimatedPageHero';
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



      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <AnimatedPageHero pageName="schools">
        <MagneticButton maxDistance={6}>
          <Link
            href="/schools/configure"
            className="premium-shimmer-btn inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 hover:shadow-2xl hover:shadow-[#4338CA]/40 hover:-translate-y-0.5"
          >
            <span>Configure Your School Plan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </MagneticButton>
        <MagneticButton maxDistance={5}>
          <a
            href="#solutions"
            className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-[#E2E8F0] shadow-xs hover:border-[#4338CA]/40 hover:text-[#4338CA] hover:-translate-y-0.5"
          >
            <span>Explore Solutions</span>
          </a>
        </MagneticButton>
        <MagneticButton maxDistance={4}>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-3 text-[#64748B] hover:text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all hover:bg-white/60"
          >
            <span>Talk to Ekaagra</span>
          </Link>
        </MagneticButton>
      </AnimatedPageHero>

      {/* Interactive School Solution Showcase */}
      <section className="py-8 sm:py-12 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-5xl mx-auto">
          <Reveal delay={100}>
            <SchoolVisualShowcase />
          </Reveal>
        </div>
      </section>

      {/* ─── 2. FOUR SOLUTIONS (COMPACT CARDS + PROGRESSIVE DISCLOSURE) ──────── */}
      <SchoolSolutionCards />

      {/* ─── 3. COMPARISON MATRIX (COMPACT TABLE + MOBILE STICKY COLUMN) ────── */}
      <SchoolFeatureComparison />

      {/* ─── 4. STUDENT-BASED PRICING & YEAR 1 VS RENEWAL EXPANDER ──────────── */}
      <SchoolPricingTable />

      {/* ─── 5. OPTIONAL SCHOOL MODULES (CATEGORY EXPANDABLE GRID) ──────────── */}
      <SchoolOptionalModules />

      {/* ─── 6. FREQUENTLY ASKED QUESTIONS (SINGLE-EXPANSION ACCORDION) ─────── */}
      <SchoolFaqAccordion />

      {/* ─── 7. FINAL HIGH-INTENT CONVERSION CTA ─────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>START YOUR SCHOOL TRANSFORMATION</span>
          </span>
          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
            Ready to Modernize Your School&apos;s Technology?
          </h2>
          <p className="section-supporting-subtitle mx-auto">
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
