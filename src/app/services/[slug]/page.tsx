import { services } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Globe, LayoutDashboard, Smartphone, Code2, GraduationCap, Building2, Server, Wrench, ArrowUpRight } from 'lucide-react';
import React from 'react';
import type { LucideIcon } from 'lucide-react';

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

  return {
    title: `${service.title} | Ekaagra Technologies`,
    description: service.description,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const Icon = iconMap[service.icon] || Code2;

  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <article className="space-y-16">
        {/* Header Hero */}
        <header className="border-b border-white/10 pb-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20 text-blue-400">
              <Icon className="w-8 h-8" />
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              SERVICE ARCHITECTURE
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            {service.title}
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
            {service.longDescription}
          </p>

          <div className="pt-4">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950"
            >
              <span>Start a {service.shortTitle} Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Key Features Matrix */}
        <section className="space-y-6">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            CORE SYSTEM CAPABILITIES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {service.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3.5 bg-[#0e1320] p-5 rounded-xl border border-white/10">
                <div className="mt-0.5 bg-blue-500/10 text-blue-400 p-1 rounded-md shrink-0 border border-blue-500/20">
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-sm text-slate-300 font-medium leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Stack Tech Badges */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            RECOMMENDED STACK
          </h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {service.technologies.map((tech, index) => (
              <span 
                key={index} 
                className="bg-[#0e1320] text-slate-300 px-4 py-2 rounded-lg text-xs font-mono font-medium border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            TARGET USE CASES &amp; APPLICATION
          </h2>
          <ul className="grid sm:grid-cols-2 gap-4 text-slate-300 text-sm font-medium">
            {service.useCases.map((useCase, index) => (
              <li key={index} className="flex items-center gap-3 bg-[#080b13] p-3.5 rounded-lg border border-white/5">
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Footer CTA */}
        <section className="bg-[#060911] text-white p-10 sm:p-14 rounded-2xl text-center border border-white/10 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Ready to build your {service.shortTitle.toLowerCase()}?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Let us scope your technical requirements and provide a clear quote and development roadmap.
          </p>
          <Link 
            href="/get-quote" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xl shadow-blue-950"
          >
            <span>Request Estimate</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </section>
      </article>
    </div>
  );
}

