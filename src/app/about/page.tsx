import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Zap, HeartHandshake, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | Ekaagra Technologies',
  description: 'Ekaagra Technologies is an independent technology development business focused on creating practical digital solutions for businesses, educational institutions, organizations, and startups.',
};

export default function AboutPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            INDEPENDENT STUDIO
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Built with purpose. Designed for people.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Ekaagra Technologies is an independent technology development business focused on creating practical digital solutions for businesses, educational institutions, organizations, and startups.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-3">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              ETHOS &amp; STANDARDS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Our Core Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Quality Engineering</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                We believe in building software that stands the test of time. Every project we undertake is crafted with attention to detail and a commitment to clean code standards.
              </p>
            </div>

            <div className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Simplicity &amp; Clarity</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Technology should solve problems, not create them. We focus on creating clean, intuitive, and straightforward solutions that real users naturally understand.
              </p>
            </div>

            <div className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Reliability &amp; Uptime</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Our solutions are built to be dependable and secure. We write robust code and follow best security practices to ensure your digital presence is always available.
              </p>
            </div>

            <div className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-white">Long-term Partnership</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                We value honest communication and transparent timelines. We are here not just to deliver a project, but to be a trusted technology partner for long-term growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus List */}
      <section className="py-24 border-b border-white/[0.08] bg-[#090d16]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              COMMITMENT
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">What We Focus On</h2>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {[
              { label: 'Custom development', desc: 'Tailored solutions designed specifically for your unique requirements.' },
              { label: 'Clear communication', desc: 'Keeping you informed every step of the way without confusing jargon.' },
              { label: 'Practical solutions', desc: 'Focusing on what works and delivers real value to your business.' },
              { label: 'Maintainable code', desc: 'Building foundations that can grow and adapt with your future needs.' },
              { label: 'Honest timelines', desc: 'Setting realistic expectations and delivering on our commitments.' },
            ].map((item, idx) => (
              <div key={idx} className="py-6 flex items-start gap-4">
                <span className="text-xs font-mono font-bold text-blue-400 mt-1">0{idx + 1}</span>
                <div>
                  <h3 className="text-base font-bold text-white">{item.label}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#060911] text-center border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Ready to Work Together?</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Let us discuss how we can help bring your ideas to life with technology that works for you.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950"
            >
              <span>Start a Conversation</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

