import type { Metadata } from 'next';
import QuoteForm from '@/components/forms/QuoteForm';
import AnimatedPageHero from '@/components/ui/AnimatedPageHero';
import { Sparkles } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';


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


      {/* Hero */}
      <AnimatedPageHero pageName="quote" />

      {/* Main Form Section */}
      <section className="py-10 sm:py-14 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-6xl xl:max-w-7xl">
          <QuoteForm />
        </div>
      </section>
    </div>
  );
}



