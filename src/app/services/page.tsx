import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Check,
  GraduationCap,
  Building2,
  Stethoscope,
  Utensils,
  ShoppingBag,
  BookOpen,
  Rocket,
  Code2,
  Briefcase,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { solutions } from '@/lib/data';
import ServicesList from '@/components/ui/ServicesList';
import AnimatedPageHero from '@/components/ui/AnimatedPageHero';
import Reveal from '@/components/motion/Reveal';
import StaggerReveal from '@/components/motion/StaggerReveal';
import MagneticButton from '@/components/motion/MagneticButton';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';

export const metadata: Metadata = createPageMetadata({
  title: 'Website Design, Software Services & Industry Solutions in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Explore our digital capabilities and specialized industry software systems: custom websites, web applications, Android apps, and School ERP platforms engineered by Ekaagra Technologies in Motihari, Bihar.',
  path: '/services',
});

const solutionIconMap: Record<string, LucideIcon> = {
  GraduationCap,
  Building2,
  Stethoscope,
  Utensils,
  ShoppingBag,
  BookOpen,
  Rocket,
  Code2,
};

export default function ServicesPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Services & Industry Solutions — Ekaagra Technologies',
              description:
                'Explore our digital engineering capabilities and tailored industry solutions: custom websites, web applications, Android apps, and School ERP systems in Motihari, Bihar.',
              url: `${SITE_URL}/services`,
            })
          ),
        }}
      />

      {/* Hero */}
      <AnimatedPageHero pageName="services">
        <a
          href="#capabilities"
          className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:border-[#4338CA]/40"
        >
          <Layers className="w-4 h-4 text-[#4338CA]" />
          <span>8 Core Capabilities</span>
        </a>
        <a
          href="#industries"
          className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] px-5 py-2.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all hover:border-[#4338CA]/40"
        >
          <Briefcase className="w-4 h-4 text-[#F97360]" />
          <span>Industry Solutions</span>
        </a>
      </AnimatedPageHero>

      {/* Section 1: Core Technical Capabilities */}
      <section id="capabilities" className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-[#FAF7F2] scroll-mt-20">
        <div className="site-container space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#F4C95D]" />
                FULL TECHNICAL STACK
              </span>
              <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
                Core Engineering Capabilities
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] max-w-md">
              Every system is engineered with clean code, mobile-first responsiveness, and complete code ownership.
            </p>
          </div>

          {/* All 8 Core Services */}
          <ServicesList showAll={true} />
        </div>
      </section>

      {/* Section 2: Specialized Industry Solutions */}
      <section id="industries" className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]/60 scroll-mt-20">
        <div className="site-container space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F97360]/10 text-[#F97360] rounded-full text-xs font-bold uppercase tracking-widest border border-[#F97360]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
              TAILORED FOR YOUR SECTOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Specialized Industry Solutions
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Every industry has distinct operational requirements and audience expectations. Explore how we tailor digital workflows for your exact market.
            </p>
          </div>

          <StaggerReveal staggerInterval={60} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution) => {
              const Icon = solutionIconMap[solution.icon] || Code2;
              const isSchool = solution.id === 'education';

              return (
                <div
                  key={solution.id || solution.title}
                  className="bg-white border border-[#E2E8F0] rounded-3xl p-7 hover:border-[#4338CA]/40 transition-all duration-300 space-y-6 shadow-sm hover:shadow-xl group flex flex-col justify-between"
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
                    {isSchool ? (
                      <Link
                        href="/schools"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Explore School Hub</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        href="/get-quote"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Request Industry Quote</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </StaggerReveal>
        </div>
      </section>

      {/* Section 3: Custom Solution CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
              Need a Custom Architecture?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-base text-[#64748B] leading-relaxed max-w-lg mx-auto">
              Talk to our engineering team about your specific workflows, database requirements, and business systems.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton maxDistance={6}>
                <Link
                  href="/get-quote"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white px-8 py-4 text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#4338CA]/25 transition-all hover:-translate-y-0.5"
                >
                  <span>Get a Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </MagneticButton>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] px-8 py-4 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                <span>Contact Team</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}


