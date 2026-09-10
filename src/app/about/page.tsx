import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedPageHero from '@/components/ui/AnimatedPageHero';
import { ShieldCheck, Sparkles, Zap, HeartHandshake, ArrowRight } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';


export const metadata: Metadata = createPageMetadata({
  title: 'About Ekaagra Technologies — Website & Software Studio in Motihari, Bihar',
  description:
    'Learn about Ekaagra Technologies, an independent website design and software development studio in Motihari, Bihar. Discover our principles, engineering standards, and mission to empower local businesses and schools.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'About Ekaagra Technologies',
              description:
                'Independent website design and digital development studio based in Motihari, Bihar.',
              url: `${SITE_URL}/about`,
            })
          ),
        }}
      />


      {/* Hero */}
      <AnimatedPageHero pageName="about" />

      {/* Core Values */}
      <section className="py-8 sm:py-10 lg:py-12 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container space-y-6 sm:space-y-8">
          <div className="text-center space-y-2.5">
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              ETHOS &amp; STANDARDS
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">Our Core Principles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] space-y-3 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <Sparkles className="w-5 h-5 text-[#F97360]" />
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E]">Design That Converts</h3>
              </div>
              <p className="card-supporting-description leading-relaxed">
                A website should do more than look pretty — it must build instant trust, guide visitors clearly, and make contacting you effortless.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] space-y-3 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <Zap className="w-5 h-5 text-[#F4C95D]" />
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E]">Speed &amp; Mobile Polish</h3>
              </div>
              <p className="card-supporting-description leading-relaxed">
                Most visitors view your site on their phone. We engineer lightweight, responsive code with sub-500ms load times and fluid navigation.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] space-y-3 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E]">Reliability &amp; Uptime</h3>
              </div>
              <p className="card-supporting-description leading-relaxed">
                Our solutions are built to be dependable and secure. We write robust code, configure automatic SSL, and deploy on high-uptime global edge networks.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] space-y-3 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#4338CA]/10 border border-[#4338CA]/20 rounded-2xl text-[#4338CA]">
                  <HeartHandshake className="w-5 h-5 text-[#4338CA]" />
                </div>
                <h3 className="card-headline-title font-extrabold text-[#131B2E]">Long-term Partnership</h3>
              </div>
              <p className="card-supporting-description leading-relaxed">
                We value honest communication and transparent timelines. We are here not just to deliver a project, but to be a trusted technology partner for long-term growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Focus List */}
      <section className="py-8 sm:py-10 lg:py-12 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <div className="space-y-2">
            <span className="text-[11px] sm:text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              OUR COMMITMENT
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">What We Focus On</h2>
          </div>

          <div className="divide-y divide-[#E2E8F0] border-t border-b border-[#E2E8F0]">
            {[
              { label: 'Custom design', desc: 'Distinct brand experiences crafted specifically for your business goals.' },
              { label: 'Clear communication', desc: 'Keeping you informed every step of the way without confusing technical jargon.' },
              { label: 'Practical solutions', desc: 'Focusing on what works and delivers real measurable leads and enquiries.' },
              { label: '100% Code & Domain Ownership', desc: 'You own your codebase, database, and domain with zero vendor lock-in or proprietary builder fees.' },
              { label: 'Maintainable code', desc: 'Building foundations that can easily grow into custom portals or mobile apps.' },
              { label: 'Honest timelines', desc: 'Setting realistic expectations with clear client review checkpoints before launch.' },
              { label: 'Motihari & Bihar roots', desc: 'Dedicated to empowering local educational institutions and businesses with tier-1 technology.' },
            ].map((item, idx) => (
              <div key={idx} className="py-4 flex items-start gap-4">
                <span className="text-xs font-mono font-bold text-[#4338CA] mt-0.5">0{idx + 1}</span>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#131B2E]">{item.label}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 sm:py-14 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">Ready to Work Together?</h2>
          <p className="section-supporting-subtitle mx-auto">
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



