'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  MessageSquare,
  Smartphone,
  Bus,
  Home,
  ChevronDown,
  ChevronUp,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { schoolAddonCategories, type SchoolAddonCategoryGroup } from '@/lib/schoolPricing';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  finance: CreditCard,
  communication: MessageSquare,
  mobile: Smartphone,
  operations: Bus,
  campus: Home,
};

const CATEGORY_SUMMARIES: Record<string, string> = {
  finance: 'Fee collection • Payments',
  communication: 'WhatsApp • SMS Gateway',
  mobile: 'Parent App • Teacher/Admin App',
  operations: 'Transport • Library Management',
  campus: 'Hostel & Boarding Management',
};

export default function SchoolOptionalModules() {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <section className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-white scroll-mt-12">
      <div className="site-container max-w-5xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>EXPANSION CAPABILITIES</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Optional School Modules
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Activate specialized campus modules as your digital operations grow. Every module integrates seamlessly with the core platform.
          </p>
        </div>

        {/* Compact Category-Based Expandable Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {schoolAddonCategories.map((group) => {
            const Icon = CATEGORY_ICONS[group.id] || CreditCard;
            const isExpanded = expandedCategoryId === group.id;
            const summary = CATEGORY_SUMMARIES[group.id] || group.description;

            return (
              <div
                key={group.id}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between p-4 ${
                  isExpanded
                    ? 'border-[#4338CA] bg-indigo-50/40 shadow-sm ring-2 ring-[#4338CA]/10'
                    : 'border-[#E2E8F0] bg-[#FAF7F2] hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider">
                      {group.categoryNumber}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-[#131B2E]">
                      {group.title}
                    </h3>
                    <p className="text-[11px] text-[#64748B] mt-0.5 leading-tight">
                      {summary}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => toggleCategory(group.id)}
                    aria-expanded={isExpanded}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[34px] ${
                      isExpanded
                        ? 'bg-[#4338CA] text-white'
                        : 'bg-white text-[#4338CA] border border-[#CBD5E1] hover:bg-indigo-50/50'
                    }`}
                  >
                    <span>{isExpanded ? 'Hide' : 'View modules'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expanded Category Details Panel (Progressive Disclosure) */}
        {expandedCategoryId && (
          <div className="bg-[#FAF7F2] rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 space-y-5 animate-in fade-in duration-200">
            {(() => {
              const group = schoolAddonCategories.find((g) => g.id === expandedCategoryId);
              if (!group) return null;

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#4338CA] uppercase tracking-wider block">
                        {group.categoryNumber} — {group.title}
                      </span>
                      <h4 className="text-base font-extrabold text-[#131B2E]">
                        Available Specialized Modules
                      </h4>
                    </div>
                    <p className="text-xs text-[#64748B]">
                      {group.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="p-4 rounded-2xl bg-white border border-[#E2E8F0] space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-sm text-[#131B2E]">
                            {addon.name}
                          </h5>
                          <p className="text-xs text-[#64748B] leading-relaxed">
                            {addon.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {addon.priceNote}
                          </span>
                          <Link
                            href="/schools/configure"
                            className="inline-flex items-center gap-1 font-bold text-[#4338CA] hover:text-[#3730A3]"
                          >
                            <span>Add to proposal</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </section>
  );
}
