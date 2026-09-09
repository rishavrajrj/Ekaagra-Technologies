'use client';

import Link from 'next/link';
import { Check, Minus } from 'lucide-react';
import {
  schoolPlans,
  schoolComparisonRows,
  type SchoolProductId,
} from '@/lib/schoolPricing';

export default function SchoolFeatureComparison() {
  // Group comparison rows by their category
  const categories = Array.from(
    new Set(schoolComparisonRows.map((r) => r.category))
  );

  return (
    <section
      id="comparison"
      className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-white scroll-mt-12"
    >
      <div className="site-container space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            COMPREHENSIVE MATRIX
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Everything Included
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Side-by-side feature comparison across all four school technology tiers. Verify exactly which portals, engines, and services are deployed.
          </p>
          <p className="text-xs text-[#64748B] sm:hidden">
            ← Scroll horizontally to compare all plans →
          </p>
        </div>

        {/* Compact Table Container with Sticky First Column for Mobile */}
        <div className="rounded-3xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#FAF7F2]">
                  <th className="p-4 sm:p-5 w-[36%] min-w-[220px] text-xs font-extrabold uppercase tracking-wider text-[#64748B] sticky left-0 bg-[#FAF7F2] z-20 border-r border-[#E2E8F0]">
                    Capabilities &amp; Deliverables
                  </th>
                  {schoolPlans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`p-3.5 sm:p-4 text-center align-top relative min-w-[120px] sm:min-w-[135px] ${
                        plan.highlighted
                          ? 'bg-[#4338CA]/5 border-x-2 border-t-2 border-[#4338CA]'
                          : 'border-r border-[#E2E8F0] last:border-r-0'
                      }`}
                    >
                      {plan.badge && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white mb-1 shadow-2xs">
                          {plan.badge}
                        </span>
                      )}
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#64748B] block">
                        {plan.category}
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-[#131B2E] block mt-0.5">
                        {plan.name}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#4338CA] block mt-0.5">
                        {plan.startingPriceDisplay}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              {categories.map((cat) => {
                const rowsInCat = schoolComparisonRows.filter(
                  (r) => r.category === cat
                );
                return (
                  <tbody key={cat} className="divide-y divide-[#E2E8F0]">
                    <tr className="bg-slate-100/80">
                      <td
                        colSpan={5}
                        className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-[#4338CA] border-y border-[#E2E8F0] sticky left-0 z-10 bg-slate-100/95"
                      >
                        {cat}
                      </td>
                    </tr>
                    {rowsInCat.map((row, idx) => (
                      <tr
                        key={`${cat}-${idx}`}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        {/* Sticky Feature Name Column */}
                        <td className="p-3 sm:px-5 sm:py-2.5 text-xs font-semibold text-[#131B2E] sticky left-0 bg-white group-hover:bg-[#F9F9FB] z-10 border-r border-[#E2E8F0]">
                          {row.name}
                        </td>
                        {schoolPlans.map((plan) => {
                          const isIncluded = row.availability[plan.id];
                          return (
                            <td
                              key={plan.id}
                              className={`p-2.5 sm:py-2.5 text-center ${
                                plan.highlighted
                                  ? 'bg-[#4338CA]/5 border-x-2 border-[#4338CA]'
                                  : 'border-r border-[#E2E8F0] last:border-r-0'
                              }`}
                            >
                              {isIncluded ? (
                                <span
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 mx-auto"
                                  title="Included"
                                >
                                  <Check
                                    className="w-3 h-3 stroke-[2.5]"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">Included</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center justify-center text-[#94A3B8] mx-auto"
                                  title="Not included"
                                >
                                  <Minus
                                    className="w-3 h-3 stroke-[2]"
                                    aria-hidden="true"
                                  />
                                  <span className="sr-only">Not included</span>
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                );
              })}

              <tfoot>
                <tr className="bg-[#FAF7F2] border-t border-[#E2E8F0]">
                  <td className="p-4 text-xs text-[#64748B] sticky left-0 bg-[#FAF7F2] z-10 border-r border-[#E2E8F0]">
                    Complete ownership, deployment, and onboarding support included.
                  </td>
                  {schoolPlans.map((plan) => (
                    <td
                      key={plan.id}
                      className={`p-3 text-center align-middle ${
                        plan.highlighted
                          ? 'bg-[#4338CA]/5 border-x-2 border-b-2 border-[#4338CA]'
                          : 'border-r border-[#E2E8F0] last:border-r-0'
                      }`}
                    >
                      <Link
                        href={`/schools/configure?plan=${plan.id}`}
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all min-h-[34px] w-full ${
                          plan.highlighted
                            ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 text-[#131B2E] border border-[#E2E8F0]'
                        }`}
                      >
                        <span>Select Plan</span>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
