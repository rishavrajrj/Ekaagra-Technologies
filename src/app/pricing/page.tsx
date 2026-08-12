import type { Metadata } from 'next';
import Link from 'next/link';
import { pricingTiers, projectPricingBenchmark, schoolSalesStrategies } from '@/lib/data';
import { ArrowUpRight, Check, ShieldCheck, Smartphone, Clock, Sparkles, CheckCircle2, Building2, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Packages | Ekaagra Technologies',
  description:
    'Transparent pricing tiers for Websites, Web Applications, Android Apps, Custom Software, and School ERP systems tailored for business value and flexible institutional adoption models.',
};

export default function PricingPage() {
  return (
    <div className="bg-[#090d16] dark:bg-[#090d16] light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 min-h-screen transition-colors duration-300">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 bg-tech-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 light:bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <span className="text-xs font-mono font-bold text-blue-400 dark:text-blue-400 light:text-blue-600 uppercase tracking-widest bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-500/20 dark:border-blue-500/20 light:border-blue-200 shadow-sm inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            TRANSPARENT PRICING
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Investment &amp; Service Tiers
          </h1>
          <p className="text-base sm:text-lg text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Market-aligned starting estimates optimized for business utility, reliable execution, and flexible deployment models.
          </p>
        </div>
      </section>

      {/* Pricing Cards Grid */}
      <section className="py-20 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
              Service Packages &amp; Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
              Clear scope alignment and strategic entry points designed to deliver maximum value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.title}
                className={`relative flex flex-col justify-between rounded-2xl p-7 border transition-all duration-300 bg-[#0e1320] dark:bg-[#0e1320] light:bg-white border-white/10 dark:border-white/10 light:border-slate-200 hover:border-white/20 dark:hover:border-white/20 light:hover:border-blue-400 shadow-xl light:shadow-slate-200/80 ${
                  tier.highlighted
                    ? 'ring-2 ring-blue-500/50 dark:ring-blue-500/50 light:ring-blue-500 border-blue-500/60 dark:border-blue-500/60 light:border-blue-500 shadow-2xl shadow-blue-950/40 light:shadow-blue-200/50'
                    : ''
                }`}
              >
                {tier.badge && (
                  <div className="mb-3">
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        tier.highlighted
                          ? 'bg-blue-500/20 text-blue-300 dark:text-blue-300 light:text-blue-700 border-blue-400/40 light:border-blue-300'
                          : 'bg-white/5 dark:bg-white/5 light:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-700 border-white/10 dark:border-white/10 light:border-slate-300'
                      }`}
                    >
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900">{tier.title}</h3>
                    <div className="mt-2 text-2xl font-mono font-extrabold text-blue-400 dark:text-blue-400 light:text-blue-600">
                      {tier.startingFrom}
                    </div>
                  </div>

                  {/* Pricing Options if available */}
                  {tier.pricingOptions && (
                    <div className="mb-4 p-3 rounded-xl bg-[#080b13] dark:bg-[#080b13] light:bg-blue-50/80 border border-blue-500/20 dark:border-blue-500/20 light:border-blue-200 space-y-1">
                      <div className="text-[10px] font-mono text-blue-400 dark:text-blue-400 light:text-blue-700 font-bold uppercase tracking-wider">
                        Flexible Models
                      </div>
                      {tier.pricingOptions.map((opt) => (
                        <div key={opt} className="text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">
                          • {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Scope Alignment */}
                  {tier.scopeAlignment && (
                    <p className="mb-4 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed border-l-2 border-blue-500/40 dark:border-blue-500/40 light:border-blue-500 pl-3">
                      {tier.scopeAlignment}
                    </p>
                  )}

                  <div className="border-t border-white/10 dark:border-white/10 light:border-slate-200 pt-4 mb-6">
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-widest block mb-2">
                      Included Scope &amp; Features
                    </span>
                    <ul className="space-y-2">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-400 dark:text-blue-400 light:text-blue-600 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link
                  href="/get-quote"
                  className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                    tier.highlighted
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950 light:shadow-blue-300'
                      : 'bg-white/10 dark:bg-white/10 light:bg-slate-100 hover:bg-white/20 light:hover:bg-slate-200 text-white dark:text-white light:text-slate-800 border border-white/10 dark:border-white/10 light:border-slate-300'
                  }`}
                >
                  <span>{tier.cta || 'Request Quote'}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Pricing Benchmark Spotlight: Roshani Public School */}
      <section className="py-20 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-slate-100/60 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0e1320] dark:bg-[#0e1320] light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 rounded-3xl p-8 sm:p-12 shadow-xl light:shadow-slate-200/80 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between relative z-10">
              <div className="space-y-4 max-w-2xl">
                <span className="text-xs font-mono font-bold text-blue-400 dark:text-blue-400 light:text-blue-600 uppercase tracking-widest bg-blue-500/10 dark:bg-blue-500/10 light:bg-blue-50 px-3 py-1 rounded-full border border-blue-500/20 dark:border-blue-500/20 light:border-blue-200">
                  REAL-WORLD CASE STUDY BENCHMARK
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900">
                  Where Does the {projectPricingBenchmark.projectName} Sit?
                </h2>
                <p className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed">
                  The {projectPricingBenchmark.projectName} project built by Ekaagra Technologies exemplifies our{' '}
                  <strong className="text-white dark:text-white light:text-slate-900">Web Applications tier (Tier 2)</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#080b13] dark:bg-[#080b13] light:bg-slate-50 border border-white/10 dark:border-white/10 light:border-slate-200">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase block">Total Scope</span>
                    <span className="text-sm font-semibold text-white dark:text-white light:text-slate-900 mt-1 block">
                      {projectPricingBenchmark.scope}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#080b13] dark:bg-[#080b13] light:bg-slate-50 border border-blue-500/30 dark:border-blue-500/30 light:border-blue-300">
                    <span className="text-[10px] font-mono text-blue-400 dark:text-blue-400 light:text-blue-700 uppercase block">Fair Price Benchmark</span>
                    <span className="text-lg font-mono font-bold text-white dark:text-white light:text-slate-900 mt-1 block">
                      {projectPricingBenchmark.fairPrice}
                    </span>
                    <span className="text-[11px] text-blue-300 dark:text-blue-300 light:text-blue-600 block font-medium">
                      + {projectPricingBenchmark.amcRate}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {projectPricingBenchmark.highlights.map((h: string) => (
                    <div key={h} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-400 light:text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-72 bg-[#080b13] dark:bg-[#080b13] light:bg-slate-50 p-6 rounded-2xl border border-white/10 dark:border-white/10 light:border-slate-200 space-y-4 shrink-0 shadow-lg">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-blue-400 dark:text-blue-400 light:text-blue-700 uppercase font-bold tracking-wider">
                    Tier Category
                  </span>
                  <p className="text-base font-bold text-white dark:text-white light:text-slate-900">{projectPricingBenchmark.category}</p>
                </div>

                <div className="border-t border-white/10 dark:border-white/10 light:border-slate-200 pt-3 space-y-2 text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                  <p>
                    ✓ <strong className="text-slate-200 dark:text-slate-200 light:text-slate-800">Modern Architecture:</strong> HTML/JS + Supabase database.
                  </p>
                  <p>
                    ✓ <strong className="text-slate-200 dark:text-slate-200 light:text-slate-800">Zero Code Edits:</strong> School updates notices/gallery independently.
                  </p>
                </div>

                <Link
                  href="/projects/roshani-public-school"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-950 light:shadow-blue-300"
                >
                  <span>Explore Project Case Study</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Service & Delivery Packages */}
      <section className="py-24 border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 bg-[#0b0f19] dark:bg-[#0b0f19] light:bg-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-emerald-400 dark:text-emerald-400 light:text-emerald-700 uppercase tracking-widest bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 px-3 py-1 rounded-full border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200">
              FLEXIBLE ENGAGEMENT MODELS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              Specialized Institutional &amp; Delivery Packages
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Tailored engagement packages designed to meet your organization's budget, compliance, and mobile application requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {schoolSalesStrategies.map((strat, idx) => (
              <div
                key={strat.title}
                className="bg-[#0e1320] dark:bg-[#0e1320] light:bg-white border border-white/10 dark:border-white/10 light:border-slate-200 hover:border-blue-500/40 light:hover:border-blue-400 p-8 rounded-2xl flex flex-col justify-between space-y-6 transition-all duration-300 hover:shadow-2xl shadow-lg light:shadow-slate-200/80 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-600/10 light:bg-blue-50 border border-blue-500/20 dark:border-blue-500/20 light:border-blue-200 text-blue-400 dark:text-blue-400 light:text-blue-600 font-mono font-bold flex items-center justify-center text-sm">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 dark:text-emerald-400 light:text-emerald-700 bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 px-2.5 py-0.5 rounded-full">
                      {strat.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-900 group-hover:text-blue-400 light:group-hover:text-blue-600 transition-colors">
                      {strat.title}
                    </h3>
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">{strat.subtitle}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#080b13] dark:bg-[#080b13] light:bg-blue-50/80 border border-white/5 dark:border-white/5 light:border-blue-200 font-mono text-xs font-bold text-blue-400 dark:text-blue-400 light:text-blue-700">
                    {strat.priceTag}
                  </div>

                  <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">{strat.description}</p>
                </div>

                <div className="pt-4 border-t border-white/10 dark:border-white/10 light:border-slate-200">
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase font-bold block mb-1">
                    Client Benefit
                  </span>
                  <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed italic">{strat.whyItWorks}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#060911] dark:bg-[#060911] light:bg-white text-center border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
            Ready to Scope Your Next Project?
          </h2>
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 max-w-lg mx-auto leading-relaxed">
            Talk to Ekaagra Technologies today to craft a customized package or schedule a free CBSE compliance audit.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950 light:shadow-blue-300"
            >
              <span>Get Custom Quote</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white/10 dark:bg-white/10 light:bg-slate-100 hover:bg-white/15 light:hover:bg-slate-200 text-white dark:text-white light:text-slate-900 text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all border border-white/15 dark:border-white/15 light:border-slate-300"
            >
              <span>Contact Sales Team</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



