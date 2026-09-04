import { services } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Globe, LayoutDashboard, Smartphone, Code2, GraduationCap, Building2, Server, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { createPageMetadata, serviceSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import WebsitePricingSection from '@/components/ui/WebsitePricingSection';
import AdditionalPagesSection from '@/components/ui/AdditionalPagesSection';
import DomainStrategySection from '@/components/ui/DomainStrategySection';

const iconMap: Record<string, LucideIcon> = {
  Globe,
  LayoutDashboard,
  Smartphone,
  Code2,
  GraduationCap,
  Building2,
  Server,
  Wrench,
};

export function generateStaticParams() {
  return services.map((service) => ({
    slug: service.slug,
  }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return { title: 'Service Not Found | Ekaagra Technologies' };

  return createPageMetadata({
    title: `${service.title} in Motihari, Bihar | Ekaagra Technologies`,
    description: `${service.longDescription || service.description} Engineered with modern speed, mobile responsiveness, and clean code in Motihari, Bihar.`,
    path: `/services/${slug}`,
  });
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const Icon = iconMap[service.icon] || Code2;

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: service.title,
              description: service.description,
              url: `${SITE_URL}/services/${slug}`,
            })
          ),
        }}
      />
      <div className="pb-8">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: service.title },
          ]}
        />
      </div>

      <article className="space-y-16">
        {/* Header Hero */}
        <header className="border-b border-[#E2E8F0] pb-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#4338CA]/10 p-3.5 rounded-2xl border border-[#4338CA]/20 text-[#4338CA]">
              <Icon className="w-8 h-8" />
            </div>
            <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest">
              SERVICE CAPABILITY
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            {service.title}
          </h1>

          <p className="text-lg text-[#64748B] leading-relaxed max-w-3xl">
            {service.longDescription}
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider px-7 py-4 rounded-xl shadow-xl shadow-[#4338CA]/25 transition-all"
            >
              <span>Get a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] font-bold text-xs uppercase tracking-wider px-7 py-4 rounded-xl shadow-sm transition-all"
            >
              <span>Explore All Services</span>
            </Link>
          </div>
        </header>

        {/* Key Features Matrix */}
        <section className="space-y-6">
          <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
            CORE CAPABILITIES &amp; DELIVERABLES
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3.5 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm">
                <div className="mt-0.5 bg-emerald-500/10 text-emerald-600 p-1.5 rounded-lg shrink-0 border border-emerald-500/20">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm text-[#334155] font-medium leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Stack Tech Badges */}
        <section className="space-y-4">
          <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest block">
            RECOMMENDED STACK
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {service.technologies.map((tech, index) => (
              <span 
                key={index} 
                className="bg-white text-[#334155] px-4 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] space-y-6 shadow-sm">
          <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
            TARGET USE CASES &amp; AUDIENCES
          </span>
          <ul className="grid sm:grid-cols-2 gap-4 text-[#334155] text-sm font-medium">
            {service.useCases.map((useCase, index) => (
              <li key={index} className="flex items-center gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2E8F0]">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Website Plans, Domain & Additional Pages (For Website Development) */}
        {service.slug === 'website-development' && (
          <div className="space-y-12 border-t border-[#E2E8F0] pt-12">
            <WebsitePricingSection showSectionHeading={true} />
            <AdditionalPagesSection />
            <DomainStrategySection />
          </div>
        )}

        {/* Footer CTA */}
        <section className="bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] p-10 sm:p-14 rounded-3xl text-center border border-[#E2E8F0] space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Ready to build your {service.shortTitle.toLowerCase()}?
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Let us scope your technical requirements and provide a clear quote and development roadmap.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get a Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}


