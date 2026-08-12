import type { Metadata } from 'next';
import Link from 'next/link';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Our Process | Ekaagra Technologies',
  description: 'A structured, transparent development process from first conversation to final deployment.',
};

export default function ProcessPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            ENGINEERING WORKFLOW
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            How We Work
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A structured, transparent development process from initial scoping conversation to deployment and continuous support.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProcessTimeline />
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#060911] text-center border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Ready to Begin?</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Contact us today to start discussing your project requirements and receive a comprehensive development roadmap.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950"
            >
              <span>Start Your Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

