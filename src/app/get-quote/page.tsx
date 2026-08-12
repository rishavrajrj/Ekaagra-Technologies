import type { Metadata } from 'next';
import QuoteForm from '@/components/forms/QuoteForm';

export const metadata: Metadata = {
  title: 'Get a Quote | Ekaagra Technologies',
  description: 'Tell us about your project and we\'ll provide a detailed estimate based on your requirements.',
};

export default function GetQuotePage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-24 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            TECHNICAL ESTIMATION
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Request a Project Estimate
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Provide details about your project requirements and expected scale to receive a comprehensive proposal.
          </p>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-20 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}

