import type { Metadata } from 'next';
import QuoteForm from '@/components/forms/QuoteForm';
import { Sparkles } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Get a Website Quote — Ekaagra Technologies, Motihari',
  description:
    'Request a tailored proposal and cost estimate for your website, web application, or school ERP project from Ekaagra Technologies in Motihari, Bihar. Detailed scope delivered within 24 hours.',
  path: '/get-quote',
});

export default function GetQuotePage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Get a Website Quote — Ekaagra Technologies',
              description:
                'Request a tailored proposal and estimate for website and software projects in Motihari, Bihar.',
              url: `${SITE_URL}/get-quote`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Get a Quote' }]} />
      </div>

      {/* Hero */}
      <section className="py-16 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            PROJECT SCOPING &amp; ESTIMATE
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Build My Website
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Provide details about your business, target audience, and desired features to receive a comprehensive proposal within 24 hours.
          </p>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}



