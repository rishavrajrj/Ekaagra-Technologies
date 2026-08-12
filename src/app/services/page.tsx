import type { Metadata } from 'next';
import Link from 'next/link';
import ServicesList from '@/components/ui/ServicesList';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Services | Ekaagra Technologies',
  description: 'Comprehensive technology services offered by Ekaagra Technologies including websites, web apps, Android apps, custom software, and School ERP.',
};

export default function ServicesPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            CAPABILITIES &amp; EXPERTISE
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Our Development Services
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Engineering digital platforms, native applications, and custom business software engineered around real operational needs.
          </p>
        </div>
      </section>

      {/* Services List Section */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesList />
        </div>
      </section>

      {/* Custom Solution CTA */}
      <section className="py-24 bg-[#060911] text-center border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Need a Custom Architecture?
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-lg mx-auto">
            Talk to our engineering team about your specific workflows, APIs, and business systems.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-900/50 transition-all"
            >
              <span>Request a Technical Estimate</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

