'use client';

import * as React from 'react';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  className?: string;
}

export function FAQItem({ question, answer, className = '' }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`transition-all duration-300 rounded-xl border ${
        isOpen 
          ? 'bg-white/[0.03] dark:bg-white/[0.03] light:bg-white border-white/15 dark:border-white/15 light:border-blue-200 shadow-lg px-5 my-3 py-1' 
          : 'bg-transparent border-transparent border-b-white/10 dark:border-b-white/10 light:border-b-slate-200 hover:bg-white/[0.015] px-2 py-1'
      } ${className}`}
    >
      <button
        type="button"
        className="group flex w-full items-center justify-between py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={`text-base sm:text-lg font-semibold tracking-tight transition-colors ${
          isOpen 
            ? 'text-blue-400 dark:text-blue-400 light:text-blue-600' 
            : 'text-white dark:text-white light:text-slate-900 group-hover:text-blue-400 light:group-hover:text-blue-600'
        }`}>
          {question}
        </span>
        <span className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
          isOpen
            ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-900/50 rotate-180'
            : 'bg-white/5 dark:bg-white/5 light:bg-slate-100 border-white/10 dark:border-white/10 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-600 group-hover:border-blue-400 group-hover:text-blue-400'
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
        <p className="text-slate-300 dark:text-slate-300 light:text-slate-600 text-sm sm:text-base leading-relaxed border-t border-white/5 dark:border-white/5 light:border-slate-100 pt-3">
          {answer}
        </p>
      </div>
    </div>
  );
}

export default FAQItem;

