'use client';

import { Suspense } from 'react';
import WebsiteQuoteBuilder from './WebsiteQuoteBuilder';
import { Loader2 } from 'lucide-react';

export default function QuoteForm() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-[#E2E8F0] shadow-sm">
          <Loader2 className="w-6 h-6 text-[#4338CA] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#131B2E]">Loading Website Quote Builder...</p>
        </div>
      }
    >
      <WebsiteQuoteBuilder />
    </Suspense>
  );
}
