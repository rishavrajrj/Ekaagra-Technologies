import type { Metadata } from 'next';
import Link from 'next/link';
import { pricingTiers, projectPricingBenchmark, schoolSalesStrategies } from '@/lib/data';
import { ArrowRight, Check, ShieldCheck, Smartphone, Clock, Sparkles, CheckCircle2, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Packages | Ekaagra Technologies',
  description:
    'Transparent pricing tiers for Websites, Web Applications, Android Apps, Custom Software, and School ERP systems tailored for business value and flexible institutional adoption models.',
};

export default function PricingPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F4C95D]" />
            HONEST &amp; TRANSPARENT PRICING
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            Investment &amp; Service Packages
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Market-aligned starting estimates optimized for business utility, reliable execution, and long-term value.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Service Packages &amp; Solutions
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Clear scope alignment and strategic entry points designed to deliver maximum return on investment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-3xl p-8 border transition-all duration-300 bg-white shadow-xl ${
                  tier.highlighted
                    ? 'border-2 border-[#4338CA] shadow-[#4338CA]/15 scale-[1.02]'
                    : 'border-[#E2E8F0] hover:border-[#4338CA]/30'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 right-6 bg-[#4338CA] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  {tier.badge && (
                    <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#F97360] border border-[#E2E8F0] uppercase tracking-wider">
                      {tier.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-extrabold text-[#131B2E]">{tier.title}</h3>
                    <div className="mt-2 text-3xl font-mono font-extrabold text-[#4338CA]">
                      {tier.startingFrom}
                    </div>
                  </div>

                  {/* Pricing Options if available */}
                  {tier.pricingOptions && (
                    <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#4338CA]/20 space-y-1">
                      <div className="text-[10px] font-mono text-[#4338CA] font-bold uppercase tracking-wider">
                        Flexible Models
                      </div>
                      {tier.pricingOptions.map((opt) => (
                        <div key={opt} className="text-xs text-[#334155] font-medium">
                          • {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scope Alignment */}
                  {tier.scopeAlignment && (
                    <p className="text-xs text-[#64748B] leading-relaxed border-l-2 border-[#4338CA] pl-3">
                      {tier.scopeAlignment}
                    </p>
                  )}

                  <div className="border-t border-[#E2E8F0] pt-4 space-y-2.5">
                    <span className="text-[11px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope &amp; Deliverables:
                    </span>
                    <ul className="space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-[#334155] font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    href="/get-quote"
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                      tier.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-[#4338CA]/25'
                        : 'bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0]'
                    }`}
                  >
                    <span>{tier.cta || 'Request Quote'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Pricing Benchmark Spotlight: Roshani Public School */}
      <section className="py-20 border-b border-[#E2E8F0] bg-[#F5F0E8] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10">
              <div className="space-y-4 max-w-2xl">
                <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest bg-[#F97360]/10 px-3 py-1 rounded-full border border-[#F97360]/20">
                  REAL-WORLD CASE STUDY BENCHMARK
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131B2E]">
                  Where Does the {projectPricingBenchmark.projectName} Sit?
                </h2>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  The {projectPricingBenchmark.projectName} project built by Ekaagra Technologies exemplifies our{' '}
                  <strong className="text-[#131B2E]">Web Applications tier (Tier 2)</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0]">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase block">Total Scope</span>
                    <span className="text-sm font-bold text-[#131B2E] mt-1 block">
                      {projectPricingBenchmark.scope}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#4338CA]/30">
                    <span className="text-[10px] font-mono text-[#4338CA] uppercase block font-bold">Fair Price Benchmark</span>
                    <span className="text-xl font-mono font-extrabold text-[#131B2E] mt-1 block">
                      {projectPricingBenchmark.fairPrice}
                    </span>
                    <span className="text-xs text-[#4338CA] block font-semibold">
                      + {projectPricingBenchmark.amcRate}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {projectPricingBenchmark.highlights.map((h: string) => (
                    <div key={h} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-[#334155] font-medium">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-72 bg-[#FAF7F2] p-6 rounded-2xl border border-[#E2E8F0] space-y-4 shrink-0 shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#F97360] uppercase font-bold tracking-wider">
                    Tier Category
                  </span>
                  <p className="text-base font-extrabold text-[#131B2E]">{projectPricingBenchmark.category}</p>
                </div>

                <div className="border-t border-[#E2E8F0] pt-3 space-y-2 text-xs text-[#64748B]">
                  <p>
                    ✓ <strong className="text-[#131B2E]">Modern Architecture:</strong> Next.js + Supabase database.
                  </p>
                  <p>
                    ✓ <strong className="text-[#131B2E]">Zero Code Edits:</strong> School updates notices/gallery independently.
                  </p>
                </div>

                <Link
                  href="/projects/roshani-public-school"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                >
                  <span>Explore Project Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Service & Delivery Packages */}
      <section className="py-24 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              FLEXIBLE ENGAGEMENT MODELS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Specialized Institutional &amp; Delivery Bundles
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Tailored engagement packages designed to meet your organization&apos;s budget, compliance, and mobile application requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {schoolSalesStrategies.map((strat, idx) => (
              <div
                key={strat.title}
                className="bg-white border border-[#E2E8F0] hover:border-[#4338CA]/40 p-8 rounded-3xl flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl shadow-lg group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] font-mono font-bold flex items-center justify-center text-sm border border-[#4338CA]/20">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {strat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors">
                      {strat.title}
                    </h3>
                    <p className="text-xs font-mono text-[#F97360] mt-1">{strat.subtitle}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] font-mono text-sm font-extrabold text-[#4338CA]">
                    {strat.priceTag}
                  </div>

                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">{strat.description}</p>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0]">
                  <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block mb-1">
                    Client Value
                  </span>
                  <p className="text-xs text-[#64748B] leading-relaxed italic">{strat.whyItWorks}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Ready to Scope Your Next Project?
          </h2>
          <p className="text-base text-[#64748B] max-w-lg mx-auto leading-relaxed">
            Talk to Ekaagra Technologies today to craft a customized package or schedule a free CBSE compliance audit.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get Custom Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all border border-[#E2E8F0]"
            >
              <span>Contact Sales Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}





