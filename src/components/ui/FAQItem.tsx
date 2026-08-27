'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  className?: string;
}

export function FAQItem({ question, answer, className = '' }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`transition-all duration-300 rounded-2xl border ${
        isOpen 
          ? 'bg-white border-[#4338CA]/30 shadow-md px-6 py-2 my-3' 
          : 'bg-white/70 border-[#E2E8F0] hover:border-[#4338CA]/20 hover:bg-white px-6 py-2 my-2'
      } ${className}`}
    >
      <button
        type="button"
        className="group flex w-full items-center justify-between py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338CA] rounded-xl transition-colors cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={`text-base sm:text-lg font-bold tracking-tight transition-colors ${
          isOpen 
            ? 'text-[#4338CA]' 
            : 'text-[#131B2E] group-hover:text-[#4338CA]'
        }`}>
          {question}
        </span>
        <span className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
          isOpen
            ? 'bg-[#4338CA] border-[#4338CA] text-white shadow-sm rotate-180'
            : 'bg-[#FAF7F2] border-[#E2E8F0] text-[#64748B] group-hover:border-[#4338CA] group-hover:text-[#4338CA]'
        }`}>
          {isOpen ? (
            <Minus className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-[#64748B] text-sm sm:text-base leading-relaxed border-t border-[#E2E8F0] pt-3">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default FAQItem;


