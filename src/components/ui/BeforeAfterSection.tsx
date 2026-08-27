import Link from 'next/link';
import {
  XCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function BeforeAfterSection() {
  const beforePoints = [
    {
      title: 'Cookie-Cutter Competitor Look',
      desc: 'Built on off-the-shelf generic templates that look identical to competitors and fail to build authority.',
    },
    {
      title: 'Bloated & Sluggish Performance',
      desc: 'Heavy themes and sluggish scripts causing frustrating load delays and high bounce rates on mobile.',
    },
    {
      title: 'Friction-Filled Contact Paths',
      desc: 'Clunky contact forms with no direct WhatsApp connection or fast click-to-call options.',
    },
    {
      title: 'Rigid & Hard to Scale',
      desc: 'Locked into proprietary site builders that break when you need dynamic portals, notices, or database tools.',
    },
  ];

  const afterPoints = [
    {
      title: 'Distinctive Brand Craftsmanship',
      desc: 'Custom UI/UX, typography, and visual hierarchy designed specifically around your organization.',
    },
    {
      title: 'Engineered for Mobile Speed',
      desc: 'Lightweight modern code delivering instant page rendering across all smartphone screen sizes.',
    },
    {
      title: 'High-Converting Direct Inquiries',
      desc: 'Prominent 1-click WhatsApp triggers, verified phone actions, and clean lead capture forms.',
    },
    {
      title: 'Scalable Modern Foundation',
      desc: 'Clean Next.js architecture built to grow into portals, ERP modules, or mobile apps as you expand.',
    },
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#F5F0E8] border-b border-[#E2E8F0] relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#F97360]/10 border border-[#F97360]/20 text-[#F97360] rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            THE TRANSFORMATION
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Your website should work harder for your business.
          </h2>
          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            See the difference intentional design and custom craftsmanship make for customer trust and lead conversion.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Before Column (Red/Generic Template) */}
          <div className="bg-white/95 border border-red-200 rounded-3xl p-8 sm:p-10 shadow-lg space-y-6 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-red-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 block">
                      Common Pitfall
                    </span>
                    <h3 className="text-lg font-bold text-[#131B2E]">
                      Generic Template Website
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-red-50 text-red-600 rounded-full border border-red-200">
                  Low Conversion
                </span>
              </div>

              <div className="space-y-4">
                {beforePoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#131B2E]">
                        {pt.title}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                        {pt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs text-red-700 font-medium">
              Result: Lost enquiries, unmemorable first impression, and missed revenue.
            </div>
          </div>

          {/* After Column (Ekaagra Standard) */}
          <div className="bg-white border-2 border-[#4338CA] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden flex flex-col justify-between">
            {/* Top highlight ribbon */}
            <div className="absolute top-0 right-0 bg-[#4338CA] text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-md">
              Ekaagra Standard
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                      Custom Craftsmanship
                    </span>
                    <h3 className="text-lg font-bold text-[#131B2E]">
                      Custom Ekaagra Website
                    </h3>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 mr-24 sm:mr-0">
                  High Converting
                </span>
              </div>

              <div className="space-y-4">
                {afterPoints.map((pt, i) => (
                  <div key={i} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#131B2E]">
                        {pt.title}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed">
                        {pt.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F4C95D]" />
                <span>Result: Instant credibility &amp; clear conversion paths.</span>
              </div>

              <Link
                href="/get-quote"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/25"
              >
                <span>Upgrade Your Site</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

