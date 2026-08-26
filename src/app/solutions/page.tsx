import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap, Building2, Globe, Code2, Check, ArrowRight, Sparkles } from 'lucide-react';
import React from 'react';

export const metadata: Metadata = {
  title: 'Industry Solutions | Ekaagra Technologies',
  description: 'Tailored technology and website solutions for schools, businesses, retail, and healthcare by Ekaagra Technologies.',
};

const solutions = [
  {
    id: 'education',
    title: 'School & EdTech Platforms',
    description: 'Comprehensive ERP systems, student admissions portals, dynamic notices, and CBSE mandatory disclosures.',
    icon: 'GraduationCap',
    accent: 'bg-indigo-500/10 text-[#4338CA] border-[#4338CA]/20',
    features: ['Admissions & Student Portals', 'Attendance & Fee Receipts', 'Exam Scorecard Engine', 'CBSE Mandatory Disclosures']
  },
  {
    id: 'enterprise',
    title: 'Enterprise Software & ERP',
    description: 'Scalable internal business applications built around exact company workflows and data pipelines.',
    icon: 'Building2',
    accent: 'bg-[#F97360]/10 text-[#F97360] border-[#F97360]/20',
    features: ['Process Automation', 'Financial & Stock Reports', 'Multi-User Role Control', 'Custom Operations Dashboards']
  },
  {
    id: 'ecommerce',
    title: 'Digital Web Platforms',
    description: 'Professional high-converting websites and digital assets representing corporate and local brands with authority.',
    icon: 'Globe',
    accent: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    features: ['Responsive UI Architecture', 'Sub-500ms Speed', 'Google Schema SEO Structure', 'Direct WhatsApp Lead Capture']
  },
  {
    id: 'saas',
    title: 'Custom Product Development',
    description: 'Web and mobile products engineered with clean architecture, API backends, and cloud databases.',
    icon: 'Code2',
    accent: 'bg-amber-500/10 text-amber-800 border-amber-500/20',
    features: ['Next.js 16 & React 19', 'PostgreSQL / Supabase DB', 'Offline Mobile Capabilities', 'High-Uptime Hosting']
  }
];

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-8 h-8 text-[#4338CA]" />,
  Building2: <Building2 className="w-8 h-8 text-[#F97360]" />,
  Globe: <Globe className="w-8 h-8 text-[#4338CA]" />,
  Code2: <Code2 className="w-8 h-8 text-[#F4C95D]" />
};

export default function SolutionsPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            INDUSTRY ARCHITECTURES
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            Solutions We Build
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            End-to-end digital solutions designed for specific industries, business operational models, and growth scale.
          </p>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solutions.map((solution) => (
              <div key={solution.id} className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 hover:border-[#4338CA]/40 transition-all duration-300 space-y-6 shadow-sm hover:shadow-xl group">
                <div className="flex items-center justify-between">
                  <div className="bg-[#FAF7F2] border border-[#E2E8F0] w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner">
                    {iconMap[solution.icon]}
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${solution.accent}`}>
                    Verified Architecture
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-extrabold text-[#131B2E] tracking-tight group-hover:text-[#4338CA] transition-colors">{solution.title}</h2>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{solution.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-widest block">Key Capabilities:</span>
                  <ul className="grid sm:grid-cols-2 gap-2.5 text-xs text-[#334155] font-medium">
                    {solution.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
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
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">Have a Unique Requirement?</h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            We specialize in engineering custom websites and software tailored around your exact operational workflows.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-sm"
            >
              <span>Explore Case Studies</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



