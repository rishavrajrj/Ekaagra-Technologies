import type { Metadata } from 'next';
import Link from 'next/link';
import {
  LayoutDashboard,
  Check,
  ArrowRight,
  Database,
  Cloud,
  Layers,
  Sparkles,
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
  title: 'Web Application Development in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Custom web application development in Motihari, Bihar. We build dynamic web portals, admin control dashboards, database-driven applications, and cloud SaaS platforms.',
  path: '/web-application-development-motihari',
  keywords: [
    'web application development Motihari',
    'web portal development Bihar',
    'custom web application company Motihari',
    'Next.js web developer Bihar',
    'React web developer Motihari',
  ],
});

const webAppFaqs = [
  {
    question: 'What is the difference between a standard website and a web application?',
    answer:
      'A standard website is primarily informational, presenting your business and capturing leads. A web application is an interactive software platform with user logins, role permissions, real-time database queries, live status tracking, and automated business logic.',
  },
  {
    question: 'What technology stack do you use for web applications?',
    answer:
      'We use Next.js 16, React 19, TypeScript, Tailwind CSS, and Supabase / PostgreSQL. This modern stack provides sub-500ms edge load times, bank-grade authentication, and real-time data sync.',
  },
  {
    question: 'Can you demonstrate a live web application you have built?',
    answer:
      'Yes! See our case study for Palak Enterprises (a digital printing and order-tracking web app with Razorpay integration) and SparkNest Academy (an interactive EdTech learning portal).',
  },
];

export default function WebApplicationDevelopmentMotihariPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'Web Application Development in Motihari',
              description:
                'Full-stack interactive web application development for businesses and startups in Motihari, Bihar.',
              url: `${SITE_URL}/web-application-development-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(webAppFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'Web Applications in Motihari' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <LayoutDashboard className="w-4 h-4 text-[#F97360]" />
            CLOUD APPS &amp; PORTALS • MOTIHARI, BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Web Application Development in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Build responsive web portals, multi-role admin dashboards, and database applications engineered with Next.js, React, and PostgreSQL for maximum speed and scale.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Scope Web Application</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects/palak-enterprises"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E2E8F0] shadow-sm transition-all"
            >
              <span>View Web App Case Study</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Modern Web App Architecture
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Engineered with production-grade technologies that scale smoothly as your user base grows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Zap className="w-8 h-8 text-[#4338CA]" />
              <h3 className="text-base font-bold text-[#131B2E]">Server-Side Rendering (SSR)</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Lightning-fast initial page loads and complete search engine indexability powered by Next.js edge runtime.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Database className="w-8 h-8 text-emerald-600" />
              <h3 className="text-base font-bold text-[#131B2E]">PostgreSQL Database</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Relational data modeling, secure Row Level Security (RLS), real-time updates, and automated daily backups.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Cloud className="w-8 h-8 text-[#F97360]" />
              <h3 className="text-base font-bold text-[#131B2E]">Cloud Edge Deployment</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Global CDN distribution, free SSL encryption, and high availability without complex server management overhead.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Callout */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
          <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
            FEATURED WEB APP CASE STUDY
          </span>
          <h3 className="text-2xl font-extrabold text-[#131B2E]">
            Palak Enterprises Print Web Application (Chakia)
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            A comprehensive customer web application enabling users to upload documents, choose print specifications, complete online Razorpay payments, and track live order progress.
          </p>
          <div className="pt-2">
            <Link
              href="/projects/palak-enterprises"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3]"
            >
              <span>Read Full Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Web Application FAQs
            </h2>
          </div>
          <div className="space-y-3">
            {webAppFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Build Your Custom Web Application
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            Tell us about the portal, dashboard, or platform you want to build. We will prepare an architecture proposal and estimate.
          </p>
          <div className="pt-2">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get Web App Estimate</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
