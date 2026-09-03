import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Code2,
  Check,
  ArrowRight,
  Database,
  Lock,
  Layers,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';
import {
  createPageMetadata,
  serviceSchema,
  faqPageSchema,
  SITE_URL,
} from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import FAQItem from '@/components/ui/FAQItem';

export const metadata: Metadata = createPageMetadata({
  title: 'Custom Software Development in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Bespoke software development for businesses and institutions in Motihari, Bihar. We engineer custom billing, inventory, management systems, and database workflows.',
  path: '/software-development-motihari',
  keywords: [
    'software development company in Motihari',
    'custom software development Motihari',
    'software company in Bihar',
    'billing software Motihari',
    'inventory software Motihari Bihar',
  ],
});

const softwareFaqs = [
  {
    question: 'Why build custom software instead of buying off-the-shelf software?',
    answer:
      'Off-the-shelf tools force your business to fit someone else’s rigid workflow and charge recurring per-user fees forever. Custom software is engineered around your exact operations, integrates with your specific hardware or APIs, and you own 100% of the code rights.',
  },
  {
    question: 'What types of custom software do you build in Motihari?',
    answer:
      'We build inventory tracking systems, GST-ready billing platforms, coaching institute management tools, wholesale distribution portals, and automated business reporting systems.',
  },
  {
    question: 'How much does custom software development cost?',
    answer:
      'Custom software packages start from ₹40,000 depending on complexity, required database architecture, third-party integrations, and user permission roles.',
  },
];

export default function SoftwareDevelopmentMotihariPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'Custom Software Development in Motihari',
              description:
                'Tailored software engineering for businesses and organizations in Motihari and Bihar.',
              url: `${SITE_URL}/software-development-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(softwareFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'Software Development in Motihari' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Code2 className="w-4 h-4 text-[#F97360]" />
            ENGINEERING &amp; ARCHITECTURE • MOTIHARI, BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Custom Software Development in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Stop forcing your business into rigid generic software. We engineer bespoke business systems, billing modules, inventory engines, and automated workflows tailored to how you run.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Scope Your Software</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services/custom-software"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E2E8F0] shadow-sm transition-all"
            >
              <span>Explore Software Capabilities</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Software Systems Built for Real Business Needs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Database className="w-8 h-8 text-[#4338CA]" />
              <h3 className="text-base font-bold text-[#131B2E]">Inventory &amp; Stock Tracking</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Real-time stock level monitoring, low inventory alerts, multi-warehouse support, and purchase order tracking tailored for local distributors and retailers.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Zap className="w-8 h-8 text-emerald-600" />
              <h3 className="text-base font-bold text-[#131B2E]">GST Billing &amp; Invoicing</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Speedy point-of-sale and GST invoice generation with automated tax calculations, customer balance tracking, and WhatsApp invoice dispatch.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Lock className="w-8 h-8 text-[#F97360]" />
              <h3 className="text-base font-bold text-[#131B2E]">Role-Based Access &amp; Audit</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Granular permissions for owners, managers, accountants, and staff so sensitive financial metrics remain protected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Custom Software FAQs
            </h2>
          </div>
          <div className="space-y-3">
            {softwareFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Need Software Built for Your Business?
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            Book a technical consultation with Ekaagra Technologies in Motihari to discuss your workflow and operational challenges.
          </p>
          <div className="pt-2">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Request Software Scope</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
