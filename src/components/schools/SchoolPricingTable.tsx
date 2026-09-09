'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  schoolStudentTiers,
  schoolYearOneVsRenewal,
  type SchoolStudentTierConfig,
  type SchoolStudentTierId,
} from '@/lib/schoolPricing';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Database,
  Layers,
} from 'lucide-react';

export default function SchoolPricingTable() {
  const [selectedTierId, setSelectedTierId] = useState<SchoolStudentTierId>('up-to-300');
  const [showFullTable, setShowFullTable] = useState(false);
  const [isYearOneVsRenewalOpen, setIsYearOneVsRenewalOpen] = useState(false);

  const selectedTier =
    schoolStudentTiers.find((t) => t.id === selectedTierId) || schoolStudentTiers[0];

  return (
    <section
      id="student-tiers"
      className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-[#FAF7F2] scroll-mt-12"
    >
      <div className="site-container max-w-5xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            TRANSPARENT SCALE
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Student Capacity-Based Pricing
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            School ERP and the Complete Platform scale with student enrollment. Pay only for the computing capacity and database throughput your campus requires.
          </p>
        </div>

        {/* Capacity Selector Tabs (Interactive UX) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs max-w-3xl mx-auto">
            {schoolStudentTiers.map((tier) => {
              const isSelected = tier.id === selectedTierId;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20'
                      : 'text-[#64748B] hover:text-[#131B2E] hover:bg-slate-50'
                  }`}
                >
                  <span className="block truncate">{tier.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Tier Comparison Display Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Option 1: School ERP */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E2E8F0] shadow-sm flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4338CA] flex items-center justify-center border border-indigo-100">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                        6-Role Academic Platform
                      </span>
                      <h3 className="text-lg font-extrabold text-[#131B2E]">
                        School ERP
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#64748B] bg-slate-100 px-2.5 py-1 rounded-full">
                    {selectedTier.label}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0]">
                  {selectedTier.isCustom ? (
                    <div className="py-2">
                      <span className="text-xl font-extrabold text-[#4338CA] block">
                        Custom Enterprise Quotation
                      </span>
                      <span className="text-xs text-[#64748B] mt-1 block">
                        Multi-branch consolidation, dedicated database instance &amp; customized SLA.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                        Year 1 Platform &amp; Implementation
                      </span>
                      <span className="text-3xl font-extrabold font-mono text-[#131B2E] block mt-0.5">
                        ₹{selectedTier.erpYearOnePrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-[#4338CA] font-semibold block mt-1.5">
                        Annual Renewal: ₹{selectedTier.erpRenewalPrice?.toLocaleString('en-IN')}/year
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-[#334155] pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>SIS records scaled for {selectedTier.studentRangeText}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Daily student/teacher attendance &amp; absent alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Fee collection, concession rules &amp; digital receipts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>CBSE marksheet generator &amp; 6 role access portals</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <Link
                  href="/schools/configure?plan=school-erp"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-white hover:bg-slate-50 text-[#131B2E] border border-[#CBD5E1] transition-all min-h-[44px]"
                >
                  <span>Configure ERP for {selectedTier.label}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Option 2: Website + CMS + ERP (Unified Platform) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-[#4338CA] shadow-xl shadow-[#4338CA]/10 ring-4 ring-[#4338CA]/5 flex flex-col justify-between space-y-5 relative">
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white shadow-md">
                RECOMMENDED / ALL-IN-ONE
              </span>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#4338CA] text-white flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider block">
                        Complete School Stack
                      </span>
                      <h3 className="text-lg font-extrabold text-[#131B2E]">
                        Website + CMS + ERP
                      </h3>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#4338CA] bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    {selectedTier.label}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
                  {selectedTier.isCustom ? (
                    <div className="py-2">
                      <span className="text-xl font-extrabold text-[#4338CA] block">
                        Custom Enterprise Quotation
                      </span>
                      <span className="text-xs text-indigo-950 mt-1 block">
                        Full unified web presence + multi-campus ERP deployment with dedicated engineers.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider block">
                        Year 1 Complete Platform &amp; Deployment
                      </span>
                      <span className="text-3xl font-extrabold font-mono text-[#4338CA] block mt-0.5">
                        ₹{selectedTier.completeYearOnePrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-indigo-900 font-semibold block mt-1.5">
                        Annual Renewal: ₹{selectedTier.completeRenewalPrice?.toLocaleString('en-IN')}/year
                      </span>
                    </div>
                  )}
                </div>

                <ul className="space-y-2 text-xs text-[#334155] pt-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Everything in School ERP ({selectedTier.studentRangeText})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Modern School Website (Up to 10 Pages) + ₹750 Domain Credit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Staff CMS admin panel for instant notice &amp; gallery publishing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Automated synchronization from website admission enquiries to ERP</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <Link
                  href="/schools/configure?plan=school-complete"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/20 transition-all min-h-[44px]"
                >
                  <span>Configure Complete Platform</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Toggle Full Comparative Table Button */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowFullTable(!showFullTable)}
              className="text-xs font-bold text-[#4338CA] hover:text-[#3730A3] inline-flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-indigo-50/60 transition-colors"
            >
              <span>{showFullTable ? 'Hide full comparison table' : 'View all 5 student brackets side-by-side'}</span>
              {showFullTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Full Comparison Table */}
          {showFullTable && (
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden animate-in fade-in duration-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-slate-50/80">
                      <th className="p-4 text-xs font-extrabold uppercase tracking-wider text-[#64748B]">
                        Student Strength
                      </th>
                      <th className="p-4 text-center text-xs font-extrabold uppercase tracking-wider text-[#64748B] border-x border-[#E2E8F0]">
                        School ERP
                      </th>
                      <th className="p-4 text-center text-xs font-extrabold uppercase tracking-wider text-[#4338CA] bg-[#4338CA]/5">
                        Website + CMS + ERP
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-xs">
                    {schoolStudentTiers.map((tier) => (
                      <tr
                        key={tier.id}
                        className={`hover:bg-[#FAF7F2] transition-colors ${
                          tier.id === selectedTierId ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <td className="p-4">
                          <span className="font-extrabold text-[#131B2E] block">
                            {tier.studentRangeText}
                          </span>
                          <span className="text-[11px] text-[#64748B] block mt-0.5">
                            {tier.label}
                          </span>
                        </td>
                        <td className="p-4 text-center border-x border-[#E2E8F0]">
                          {tier.isCustom ? (
                            <span className="font-bold text-[#4338CA]">Custom Quote</span>
                          ) : (
                            <div>
                              <span className="font-extrabold font-mono text-[#131B2E] block">
                                ₹{tier.erpYearOnePrice?.toLocaleString('en-IN')} (Yr 1)
                              </span>
                              <span className="text-[11px] text-[#64748B] block mt-0.5">
                                Renewal: ₹{tier.erpRenewalPrice?.toLocaleString('en-IN')}/yr
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center bg-[#4338CA]/5">
                          {tier.isCustom ? (
                            <span className="font-bold text-[#4338CA]">Custom Quote</span>
                          ) : (
                            <div>
                              <span className="font-extrabold font-mono text-[#4338CA] block">
                                ₹{tier.completeYearOnePrice?.toLocaleString('en-IN')} (Yr 1)
                              </span>
                              <span className="text-[11px] text-[#4338CA]/90 block mt-0.5">
                                Renewal: ₹{tier.completeRenewalPrice?.toLocaleString('en-IN')}/yr
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ─── COMPACT EXPANDABLE "WHY IS YEAR 1 DIFFERENT FROM RENEWAL?" ─── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsYearOneVsRenewalOpen(!isYearOneVsRenewalOpen)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
            aria-expanded={isYearOneVsRenewalOpen}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-[#4338CA] shrink-0" />
              <div>
                <span className="text-sm sm:text-base font-extrabold text-[#131B2E] block">
                  Why is Year 1 different from Renewal?
                </span>
                <span className="text-xs text-[#64748B]">
                  Click to understand the difference between initial deployment setup and annual operating maintenance.
                </span>
              </div>
            </div>
            <div className="shrink-0 ml-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              {isYearOneVsRenewalOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </button>

          {isYearOneVsRenewalOpen && (
            <div className="p-5 sm:p-6 border-t border-[#E2E8F0] bg-[#FAF7F2] animate-in fade-in duration-200">
              <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
                {schoolYearOneVsRenewal.statement}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Year 1 Setup & Launch */}
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-[10px]">
                      01
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#131B2E]">
                        {schoolYearOneVsRenewal.card1.title} ({schoolYearOneVsRenewal.card1.subtitle})
                      </h4>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-[#334155]">
                    {schoolYearOneVsRenewal.card1.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Renewal Annual Operations */}
                <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[10px]">
                      02
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#131B2E]">
                        {schoolYearOneVsRenewal.card2.title} ({schoolYearOneVsRenewal.card2.subtitle})
                      </h4>
                    </div>
                  </div>
                  <ul className="space-y-2 text-xs text-[#334155]">
                    {schoolYearOneVsRenewal.card2.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
