'use client';

import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';
import { schoolFaqs } from '@/lib/schoolPricing';

export default function SchoolFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default or null

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="py-16 sm:py-24 border-b border-[#E2E8F0] bg-[#FAF7F2] scroll-mt-12">
      <div className="site-container max-w-3xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <HelpCircle className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </span>
          <h2 className="fluid-section-headline font-extrabold text-[#131B2E] tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="section-supporting-subtitle mx-auto">
            Clear answers to common questions asked by school directors, principals, and administrative management.
          </p>
        </div>

        {/* Single-Expansion Accordion */}
        <div className="space-y-3">
          {schoolFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const headingId = `faq-heading-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={index}
                className={`transition-all duration-200 rounded-2xl border relative overflow-hidden ${
                  isOpen
                    ? 'bg-white border-[#4338CA]/40 shadow-md px-5 sm:px-6 py-1.5'
                    : 'bg-white/90 border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white px-5 sm:px-6 py-1.5 shadow-2xs'
                }`}
              >
                {/* Active Accent Glow Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#4338CA] to-[#6366F1] transition-opacity duration-200 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                  }`}
                />

                <button
                  type="button"
                  id={headingId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleFaq(index)}
                  className="group flex w-full items-center justify-between py-3.5 sm:py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] rounded-xl transition-colors cursor-pointer"
                >
                  <span
                    className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                      isOpen
                        ? 'text-[#4338CA]'
                        : 'text-[#131B2E] group-hover:text-[#4338CA]'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`ml-3 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      isOpen
                        ? 'bg-[#4338CA] border-[#4338CA] text-white shadow-xs rotate-180'
                        : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#64748B] group-hover:border-[#4338CA] group-hover:text-[#4338CA]'
                    }`}
                  >
                    {isOpen ? (
                      <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    )}
                  </span>
                </button>

                {/* Animated Accordion Content */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headingId}
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen
                      ? 'grid-rows-[1fr] opacity-100 pb-4'
                      : 'grid-rows-[0fr] opacity-0 pb-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-[#64748B] text-xs sm:text-sm leading-relaxed border-t border-[#E2E8F0] pt-3">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
