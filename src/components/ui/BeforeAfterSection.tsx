import Link from 'next/link';
import {
  XCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

export default function BeforeAfterSection() {
  const beforePoints = [
    {
      title: 'Cookie-Cutter Competitor Look',
      desc: 'Off-the-shelf templates that look identical to competitors and fail to build brand authority.',
    },
    {
      title: 'Bloated & Sluggish Performance',
      desc: 'Heavy themes causing frustrating load delays, low Google SEO rank, and high mobile bounce rates.',
    },
    {
      title: 'Friction-Filled Inquiries',
      desc: 'Clunky contact forms with zero WhatsApp integration or fast 1-click inquiry triggers.',
    },
  ];

  const afterPoints = [
    {
      title: 'Distinctive Brand Craftsmanship',
      desc: 'Custom UI/UX, typography, and visual hierarchy crafted specifically around your organization.',
    },
    {
      title: 'Engineered for Mobile Speed',
      desc: 'Sub-500ms lightweight Next.js code delivering instant responsiveness across all smartphones.',
    },
    {
      title: 'High-Converting Direct Inquiries',
      desc: 'Prominent 1-click WhatsApp triggers, verified phone actions, and clean lead capture forms.',
    },
  ];

  return (
    <section
      id="transformation"
      className="home-viewport-section bg-[#F5F0E8] border-b border-[#E2E8F0] py-4 sm:py-6 lg:py-6"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container relative z-10 w-full space-y-4 sm:space-y-5 lg:space-y-5 my-auto">
        {/* Section Heading */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#F97360]/10 border border-[#F97360]/20 text-[#F97360] rounded-full text-[10.5px] sm:text-[11px] font-bold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              THE TRANSFORMATION
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              Your website should work harder for your business.
            </h2>
            <p className="section-supporting-subtitle mx-auto text-xs sm:text-sm">
              See the difference intentional design and custom craftsmanship make for customer trust and lead conversion.
            </p>
          </div>
        </Reveal>

        {/* Comparison Grid */}
        <Reveal delay={120}>
          <div className="grid md:grid-cols-2 gap-3.5 sm:gap-5 items-stretch">
            {/* Before Column (Red/Generic Template) */}
            <div className="bg-white/95 border border-red-200 rounded-2xl p-4 sm:p-5 lg:p-5 shadow-sm space-y-3 relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[8.5px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-red-500 block">
                        Common Pitfall
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">
                        Generic Template Website
                      </h3>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200 shrink-0">
                    Low Conversion
                  </span>
                </div>

                <div className="space-y-2">
                  {beforePoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                        <XCircle className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#131B2E]">
                          {pt.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                          {pt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2 sm:p-2.5 bg-red-50 border border-red-100 rounded-xl text-[10.5px] sm:text-[11px] text-red-700 font-medium">
                Result: Lost enquiries, unmemorable first impression, and missed revenue.
              </div>
            </div>

            {/* After Column (Ekaagra Standard) */}
            <div className="card-popup bg-white border-2 border-[#4338CA] rounded-2xl p-4 sm:p-5 lg:p-5 shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between">
              {/* Top highlight ribbon */}
              <div className="absolute top-0 right-0 bg-[#4338CA] text-white text-[8.5px] sm:text-[9px] font-extrabold uppercase tracking-widest px-2.5 sm:px-3 py-0.5 rounded-bl-lg shadow-xs">
                Ekaagra Standard
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[8.5px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                        Custom Craftsmanship
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">
                        Custom Ekaagra Website
                      </h3>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 mr-16 sm:mr-0 shrink-0">
                    High Converting
                  </span>
                </div>

                <div className="space-y-2">
                  {afterPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#131B2E]">
                          {pt.title}
                        </h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
                          {pt.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#F4C95D] shrink-0" />
                  <span>Result: Instant credibility &amp; clear conversion paths.</span>
                </div>

                <MagneticButton maxDistance={5}>
                  <Link
                    href="/get-quote"
                    className="premium-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
                  >
                    <span>Upgrade Your Site</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

