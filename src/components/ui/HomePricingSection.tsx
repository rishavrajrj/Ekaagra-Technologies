'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Globe, Layers } from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import MagneticButton from '@/components/motion/MagneticButton';

export default function HomePricingSection() {
  const [activeTab, setActiveTab] = useState<'websites' | 'systems'>('websites');

  return (
    <section
      id="pricing"
      className="relative py-12 sm:py-16 lg:py-20 border-b border-[#E2E8F0] bg-[#F5F0E8] overflow-hidden scroll-mt-18"
    >
      {/* Background ambient accents */}
      <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#F97360]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="site-container relative z-10 w-full space-y-8 sm:space-y-10">
        {/* Section Header */}
        <Reveal>
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-[11px] font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <Sparkles className="w-3 h-3 text-[#F4C95D]" />
              HONEST &amp; TRANSPARENT PRICING
            </span>
            <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
              Predictable Plans. Real Value.
            </h2>
            <p className="section-supporting-subtitle mx-auto">
              Clear Year 1 setup pricing with ~50% predictable renewals. Choose between affordable business websites or high-scale custom application systems.
            </p>

            {/* Segmented Intent Selector Tabs */}
            <div className="pt-3 flex items-center justify-center">
              <div
                role="tablist"
                aria-label="Pricing Categories"
                className="inline-flex p-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm gap-1.5"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-websites"
                  aria-selected={activeTab === 'websites'}
                  aria-controls="panel-websites"
                  onClick={() => setActiveTab('websites')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === 'websites'
                      ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="xs:hidden">Websites</span>
                    <span className="hidden xs:inline">Business Websites</span>
                  </span>
                </button>
                <button
                  type="button"
                  role="tab"
                  id="tab-systems"
                  aria-selected={activeTab === 'systems'}
                  aria-controls="panel-systems"
                  onClick={() => setActiveTab('systems')}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === 'systems'
                      ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="xs:hidden">Apps &amp; Systems</span>
                    <span className="hidden xs:inline">Custom Apps &amp; Systems</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Tab Panel 1: Business Website Packages */}
        {activeTab === 'websites' && (
          <div
            id="panel-websites"
            role="tabpanel"
            aria-labelledby="tab-websites"
            className="space-y-6 animate-fade-in"
          >
            {/* Launch Offer Callout Banner */}
            <div className="bg-white border-2 border-[#4338CA]/30 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#4338CA] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full">
                    🎉 ZERO-RISK LAUNCH OFFER
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    Free Landing Page (₹0 for 3 Months)
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Test your verified business presence online for ₹0 upfront. Upgrade to an annual domain whenever you are ready.
                </p>
              </div>
              <Link
                href="/get-quote?plan=free-launch"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#131B2E] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
              >
                <span>Claim Free (₹0)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 3 Core Website Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
              {/* Card 1: Starter Website */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border-2 border-[#4338CA] bg-white shadow-md shadow-[#4338CA]/10">
                <span className="absolute -top-3 right-5 bg-[#4338CA] text-white text-[9.5px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-full shadow-sm">
                  Best Value for Local Business
                </span>

                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
                      Fast 3-Day Turnaround
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Starter Website
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#4338CA] font-mono">
                        ₹999
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Renews at ₹499/year for domain &amp; hosting
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Complete multi-page presence with custom domain allowance, fast mobile UI, and direct WhatsApp inquiries.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>3–5 Custom Responsive Pages</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>1 Standard Domain Included (within allowance)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Basic SEO (Meta, Sitemap, Schema)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Direct WhatsApp CTA &amp; Click-to-Call</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Maintenance &amp; Uptime Support</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=starter"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/25 transition-all"
                    >
                      <span>Choose Starter (₹999)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>

              {/* Card 2: Growth Platform */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] bg-white shadow-sm hover:border-[#4338CA]/40">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
                      Multi-Service Growth
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Growth Website
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] font-mono">
                        ₹1,999
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Renews at ₹999/year for domain &amp; hosting
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      For established businesses offering multiple services, product catalogs, and requiring search engine visibility.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Up to 7 Structured Pages</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Standard Domain Allowance Included</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>On-Page Search Optimization &amp; JSON-LD</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Interactive Contact &amp; Inquiry Forms</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Full Source Code Handover</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=growth"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
                    >
                      <span>Choose Growth (₹1,999)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>

              {/* Card 3: Custom Corporate & CMS */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] bg-white shadow-sm hover:border-[#4338CA]/40">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
                      Admin Self-Management
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Custom Corporate CMS
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] font-mono">
                        ₹15,000
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Renews at ~50% annually for maintenance &amp; cloud
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Custom branding, private admin panel to publish notices and edit content, without touching code.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Private Admin Dashboard &amp; Editor</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Dynamic Notices, Circulars &amp; Media</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Custom UI/UX &amp; High-Authority Layout</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Cloud Database &amp; Edge Deployment</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Priority WhatsApp Support</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=business-website-cms"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
                    >
                      <span>Choose CMS (₹15,000)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>

            {/* Sub-Page Link Row */}
            <div className="pt-2 text-center">
              <Link
                href="/pricing#website-plans"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
              >
                <span>Compare all 5 Website Tiers, Additional Page Pricing &amp; Domain Allowances</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab Panel 2: Custom Systems, Mobile Apps & Combos */}
        {activeTab === 'systems' && (
          <div
            id="panel-systems"
            role="tabpanel"
            aria-labelledby="tab-systems"
            className="space-y-6 animate-fade-in"
          >
            {/* Featured Strategy Callout: The Prestige Combo */}
            <div className="bg-white border-2 border-[#4338CA] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#F97360]/10 text-[#F97360] font-bold text-[10px] uppercase tracking-wider rounded-full border border-[#F97360]/20 shrink-0">
                    FEATURED COMBO 🚀
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-600">
                    ₹38,000 Complete Institutional Bundle
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#131B2E]">
                  The &ldquo;Prestige Combo&rdquo; (Custom Web Application + Google Play Store Android App)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Equip your business or institution with both an official web portal and a verified mobile app for maximum credibility.
                </p>
              </div>

              <MagneticButton maxDistance={6}>
                <Link
                  href="/get-quote"
                  className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20"
                >
                  <span>Inquire for Prestige Combo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </MagneticButton>
            </div>

            {/* 3 Dedicated Custom System Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
              {/* Card 1: Web Applications */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] bg-white shadow-sm hover:border-[#4338CA]/40">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase tracking-wider block">
                      Interactive Workflows
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Web Applications
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] font-mono">
                        ₹24,999
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Renews at ₹13,999/year for cloud infrastructure &amp; care
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Custom dashboards, role-based logins, PostgreSQL databases, and automated customer workflows.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Admin Dashboard &amp; Analytics Portal</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Secure Multi-Role Authentication</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>PostgreSQL / Supabase Cloud DB</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Custom API &amp; Webhook Connections</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>100% Proprietary Code Ownership</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=web-applications"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
                    >
                      <span>Inquire Web App</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>

              {/* Card 2: Android Applications */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] bg-white shadow-sm hover:border-[#4338CA]/40">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-wider block">
                      Google Play Store
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Android Applications
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] font-mono">
                        ₹24,999
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Renews at ₹15,999/year for API server &amp; store updates
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Native Android apps or high-speed WebView architectures engineered for Android smartphones and tablets.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Dedicated Android Application Bundle</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Push Notifications &amp; Alert Engine</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Google Play Store Deployment Prep</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Secure Local Storage &amp; Token Auth</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Backend Cloud API Sync</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=android-applications"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
                    >
                      <span>Inquire Mobile App</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>

              {/* Card 3: Custom Software & ERP */}
              <div className="card-popup relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] bg-white shadow-sm hover:border-[#4338CA]/40">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider block">
                      Enterprise Grade
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#131B2E] mt-0.5 tracking-tight">
                      Custom Software
                    </h3>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] font-mono">
                        ₹34,999
                      </span>
                      <span className="text-xs font-semibold text-[#64748B]">
                        / Year 1 Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
                      Bespoke enterprise scope with dedicated SLA
                    </p>
                    <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                      Custom workflow automation engines, ERP data pipelines, and internal business management tooling.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                    <span className="text-[10px] font-bold text-[#131B2E] uppercase tracking-wider block">
                      Included Scope:
                    </span>
                    <div className="space-y-1.5 text-xs text-[#334155] font-medium">
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Custom Workflow Automation Engines</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Granular Permissions &amp; Audit Logs</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Automated Reporting &amp; Exports</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Dedicated Staging Testing Server</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Complete Database Ownership</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#E2E8F0]">
                  <MagneticButton maxDistance={5} className="w-full">
                    <Link
                      href="/get-quote?plan=custom-software"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#131B2E] border border-[#E2E8F0] transition-all"
                    >
                      <span>Inquire Custom Software</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </MagneticButton>
                </div>
              </div>
            </div>

            {/* Sub-Page Link Row */}
            <div className="pt-2 text-center">
              <Link
                href="/pricing#enterprise-packages"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3] hover:underline uppercase tracking-wider"
              >
                <span>View Full Enterprise Specifications, Roshani Case Study Benchmark &amp; School Bundles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Unified Transparent Guarantee Bar */}
        <Reveal delay={100}>
          <div className="pt-4 border-t border-[#E2E8F0]">
            <div className="flex flex-wrap items-center justify-center lg:justify-between gap-y-2.5 gap-x-4 sm:gap-x-8 text-[11px] sm:text-xs font-bold tracking-wider text-[#475569] uppercase text-center sm:text-left">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4338CA] shrink-0" />
                <span>FIXED MILESTONE PAYMENTS</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97360] shrink-0" />
                <span>100% FULL CODE HANDOVER</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0" />
                <span>FREE DOMAIN &amp; SSL SETUP</span>
              </div>
              <span className="text-[#CBD5E1] hidden sm:inline">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>ZERO VENDOR LOCK-IN</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
