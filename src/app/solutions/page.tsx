import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Building2,
  Stethoscope,
  Utensils,
  ShoppingBag,
  BookOpen,
  Rocket,
  Code2,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import React from 'react';
import { solutions } from '@/lib/data';
import type { LucideIcon } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Digital Solutions for Schools & Businesses in Bihar | Ekaagra Technologies',
  description:
    'Custom websites, school ERP platforms, and software solutions tailored for schools, coaching academies, local retail stores, clinics, and businesses in Motihari and Bihar.',
  path: '/solutions',
});

const iconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Building2,
  Stethoscope,
  Utensils,
  ShoppingBag,
  BookOpen,
  Rocket,
  Code2,
};

export default function SolutionsPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Industry Solutions — Ekaagra Technologies',
              description:
                'Tailored digital solutions for educational institutions, businesses, clinics, and retail in Bihar.',
              url: `${SITE_URL}/solutions`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Solutions' }]} />
      </div>

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            TAILORED FOR YOUR SECTOR
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Industry Solutions
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            How Ekaagra applies custom web design, practical software, and digital workflows to solve real challenges in your specific industry.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Specialized Industry Workflows
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Every industry has distinct operational requirements and audience expectations. Explore how we tailor our solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution) => {
              const Icon = iconMap[solution.icon] || Code2;
              return (
                <div
                  key={solution.id || solution.title}
                  className="bg-white border border-[#E2E8F0] rounded-3xl p-8 hover:border-[#4338CA]/40 transition-all duration-300 space-y-6 shadow-sm hover:shadow-xl group flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center border border-[#4338CA]/20 group-hover:scale-110 group-hover:bg-[#4338CA] group-hover:text-white transition-all duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      {solution.badge && (
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                            solution.accent || 'bg-[#FAF7F2] text-[#475569] border-[#E2E8F0]'
                          }`}
                        >
                          {solution.badge}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-[#131B2E] tracking-tight group-hover:text-[#4338CA] transition-colors">
                        {solution.title}
                      </h3>
                      {solution.tagline && (
                        <p className="text-xs font-mono text-[#F97360] mt-1 font-semibold">
                          {solution.tagline}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                        {solution.description}
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-3 border-t border-[#E2E8F0]">
                      <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
                        Included Capabilities:
                      </span>
                      <ul className="space-y-2 text-xs text-[#334155] font-medium">
                        {solution.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    {solution.exampleProjectSlug ? (
                      <Link
                        href={`/projects/${solution.exampleProjectSlug}`}
                        className="text-xs font-bold text-[#4338CA] hover:text-[#3730A3] flex items-center gap-1 uppercase tracking-wider"
                      >
                        <span>View Real Example</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/get-quote"
                        className="text-xs font-bold text-[#4338CA] hover:text-[#3730A3] flex items-center gap-1 uppercase tracking-wider"
                      >
                        <span>Discuss Solution</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Have a Specific Industry Requirement?
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Tell us about your organization and goals. We will provide a tailored development roadmap and estimate.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Discuss Your Project</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-sm"
            >
              <span>Explore Our Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



