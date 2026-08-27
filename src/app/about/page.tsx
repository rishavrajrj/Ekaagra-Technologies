import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Zap, HeartHandshake, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Ekaagra Technologies is an independent website design and digital development studio creating high-converting websites, web platforms, and custom software systems.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            STUDIO CREED
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            Built with purpose. Designed for people.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            Ekaagra Technologies is an independent creative website and software studio. We design high-converting websites, educational platforms, and custom software systems built around how businesses actually run.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              ETHOS &amp; STANDARDS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">Our Core Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <Sparkles className="w-6 h-6 text-[#F97360]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#131B2E]">Design That Converts</h3>
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed">
                A website should do more than look pretty — it must build instant trust, guide visitors clearly, and make contacting you effortless.
              </p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <Zap className="w-6 h-6 text-[#F4C95D]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#131B2E]">Speed &amp; Mobile Polish</h3>
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Most visitors view your site on their phone. We engineer lightweight, responsive code with sub-500ms load times and fluid navigation.
              </p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-extrabold text-[#131B2E]">Reliability &amp; Uptime</h3>
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Our solutions are built to be dependable and secure. We write robust code, configure automatic SSL, and deploy on high-uptime global edge networks.
              </p>
            </div>

            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <HeartHandshake className="w-6 h-6 text-[#4338CA]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#131B2E]">Long-term Partnership</h3>
              </div>
              <p className="text-sm text-[#64748B] leading-relaxed">
                We value honest communication and transparent timelines. We are here not just to deliver a project, but to be a trusted technology partner for long-term growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus List */}
      <section className="py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              OUR COMMITMENT
            </span>
            <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">What We Focus On</h2>
          </div>

          <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
            {[
              { label: 'Custom design', desc: 'Distinct brand experiences crafted specifically for your business goals.' },
              { label: 'Clear communication', desc: 'Keeping you informed every step of the way without confusing technical jargon.' },
              { label: 'Practical solutions', desc: 'Focusing on what works and delivers real measurable leads and enquiries.' },
              { label: 'Maintainable code', desc: 'Building foundations that can easily grow into custom portals or mobile apps.' },
              { label: 'Honest timelines', desc: 'Setting realistic expectations with clear client review checkpoints before launch.' },
            ].map((item, idx) => (
              <div key={idx} className="py-6 flex items-start gap-4">
                <span className="text-xs font-mono font-bold text-[#4338CA] mt-1">0{idx + 1}</span>
                <div>
                  <h3 className="text-base font-extrabold text-[#131B2E]">{item.label}</h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">Ready to Work Together?</h2>
          <p className="text-base text-[#64748B] max-w-lg mx-auto leading-relaxed">
            Let us discuss how we can help bring your ideas to life with a website people remember.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Work With Us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-sm"
            >
              <span>Contact Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



