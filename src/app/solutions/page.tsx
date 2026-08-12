import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, Building2, Globe, Code2, Check, ArrowUpRight } from 'lucide-react';
import React from 'react';

export const metadata: Metadata = {
  title: 'Solutions | Ekaagra Technologies',
  description: 'Tailored technology solutions for various industries by Ekaagra Technologies.',
};

const solutions = [
  {
    id: 'education',
    title: 'School & EdTech Platforms',
    description: 'Comprehensive ERP systems, student portals, and administrative tools for modern educational institutions.',
    icon: 'GraduationCap',
    features: ['Student & Teacher Portals', 'Attendance & Fee Receipts', 'Exam Scorecard Engine', 'Notice Board Circulars']
  },
  {
    id: 'enterprise',
    title: 'Enterprise Software & ERP',
    description: 'Scalable internal business applications built around exact company workflows and data pipelines.',
    icon: 'Building2',
    features: ['Process Automation', 'Financial & Stock Reports', 'Multi-User Role Control', 'Custom Operations Dashboards']
  },
  {
    id: 'ecommerce',
    title: 'Digital Web Platforms',
    description: 'Professional high-converting web applications and digital assets representing corporate brands accurately.',
    icon: 'Globe',
    features: ['Responsive UI Architecture', 'Fast Page Performance', 'SEO & Metadata Structure', 'Lead Generation Forms']
  },
  {
    id: 'saas',
    title: 'Custom Product Development',
    description: 'Multi-tenant web & mobile products engineered with clean architecture, API backends, and cloud databases.',
    icon: 'Code2',
    features: ['RESTful API Infrastructure', 'PostgreSQL / Supabase DB', 'Offline Mobile Capabilities', 'Production Monitoring']
  }
];

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-8 h-8 text-blue-400" />,
  Building2: <Building2 className="w-8 h-8 text-blue-400" />,
  Globe: <Globe className="w-8 h-8 text-blue-400" />,
  Code2: <Code2 className="w-8 h-8 text-blue-400" />
};

export default function SolutionsPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            SYSTEM ARCHITECTURES
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Solutions We Build
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            End-to-end digital solutions designed for specific industries, business operational models, and growth scale.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution) => (
              <div key={solution.id} className="bg-[#0e1320] border border-white/10 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 space-y-6">
                <div className="bg-[#080b13] border border-white/10 w-16 h-16 rounded-xl flex items-center justify-center">
                  {iconMap[solution.icon]}
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white tracking-tight">{solution.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{solution.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest block">Key Capabilities:</span>
                  <ul className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300 font-medium">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#060911] text-center border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Have a Unique Requirement?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            We specialize in engineering custom software tailored around your exact operational workflows.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950"
            >
              <span>Discuss Your Requirement</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

