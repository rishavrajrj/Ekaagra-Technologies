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
      className="relative py-10 sm:py-12 lg:py-16 bg-[#F5F0E8] border-b border-[#E2E8F0] overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#F97360]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container relative z-10 w-full space-y-6 sm:space-y-8">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#F97360]/10 border border-[#F97360]/20 text-[#F97360] rounded-full text-[11px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            THE TRANSFORMATION
          </span>
          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
            Your website should work harder for your business.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            See the difference intentional design and custom craftsmanship make for customer trust and lead conversion.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {/* Before Column (Red/Generic Template) */}
          <div className="bg-white/95 border border-red-200 rounded-2xl p-4 sm:p-6 shadow-md space-y-3 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-red-100 pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-red-500 block">
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

            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 font-medium">
              Result: Lost enquiries, unmemorable first impression, and missed revenue.
            </div>
          </div>

          {/* After Column (Ekaagra Standard) */}
          <div className="bg-white border-2 border-[#4338CA] rounded-2xl p-4 sm:p-6 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between">
            {/* Top highlight ribbon */}
            <div className="absolute top-0 right-0 bg-[#4338CA] text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-bl-lg shadow-sm">
              Ekaagra Standard
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 block">
                      Custom Craftsmanship
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#131B2E]">
                      Custom Ekaagra Website
                    </h3>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200 mr-20 sm:mr-0 shrink-0">
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

              <Link
                href="/get-quote"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm"
              >
                <span>Upgrade Your Site</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Integrated Conversion Proof Strip */}
        <div className="pt-4 border-t border-[#E2E8F0]">
          <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
              <span>3.2X HIGHER ENGAGEMENT</span>
            </div>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
              <span>SUB-500MS LOAD SPEEDS</span>
            </div>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
              <span>ZERO VENDOR LOCK-IN</span>
            </div>
            <span className="text-[#CBD5E1] hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>100% PROPRIETARY CODEBASE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

