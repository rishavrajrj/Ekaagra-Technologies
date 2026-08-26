import type { Metadata } from 'next';
import Link from 'next/link';
import ServicesList from '@/components/ui/ServicesList';
import { ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Services & Capabilities | Ekaagra Technologies',
  description: 'Comprehensive design and technology services offered by Ekaagra Technologies including websites, web apps, Android apps, custom software, and School ERP.',
};

export default function ServicesPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
            END-TO-END CAPABILITIES
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            Digital experiences built around your business.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Beautiful, high-converting websites, native mobile applications, and custom business software engineered around real operational needs.
          </p>
        </div>
      </section>

      {/* Services List Section */}
      <section className="py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ServicesList />
        </div>
      </section>

      {/* Custom Solution CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Need a Custom Architecture?
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed max-w-lg mx-auto">
            Talk to our engineering team about your specific workflows, APIs, and business systems.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white px-8 py-4 text-xs font-bold uppercase tracking-wider shadow-xl shadow-[#4338CA]/25 transition-all"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] px-8 py-4 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              <span>Contact Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


