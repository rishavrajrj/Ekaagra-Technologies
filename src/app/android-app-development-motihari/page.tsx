import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Smartphone,
  Check,
  ArrowRight,
  Sparkles,
  Bell,
  Play,
  Zap,
  ShieldCheck,
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
  title: 'Android App Development in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Native and modern Android mobile application development in Motihari, Bihar. We build institutional school apps, business mobile apps, and publish to the Google Play Store.',
  path: '/android-app-development-motihari',
  keywords: [
    'android app development Motihari',
    'mobile app developer Motihari',
    'android app development Bihar',
    'school mobile app developer Bihar',
    'Google Play Store app development Motihari',
  ],
});

const androidFaqs = [
  {
    question: 'Do you help publish the app to the Google Play Store?',
    answer:
      'Yes. We handle app signing, generation of release bundles (AAB), store listing preparation, icon and screenshot assets, privacy policy documentation, and Play Store submission.',
  },
  {
    question: 'How much does an Android app cost in Motihari?',
    answer:
      'Native Android applications start from ₹30,000. As a companion add-on to our web application or school portal, WebView-based institutional app packages start from +₹8,000 to +₹12,000.',
  },
  {
    question: 'Can the app send push notifications to parents or customers?',
    answer:
      'Yes! Push notifications are standard for school circulars, urgent announcements, new product offers, and status updates.',
  },
];

export default function AndroidAppDevelopmentMotihariPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'Android App Development in Motihari',
              description:
                'Native Android mobile application development and Google Play Store deployment in Motihari, Bihar.',
              url: `${SITE_URL}/android-app-development-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(androidFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'Android Apps in Motihari' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Smartphone className="w-4 h-4 text-[#F97360]" />
            MOBILE APP ENGINEERING • MOTIHARI, BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Android App Development in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Give your school or business a direct presence on your customers&apos; smartphones with fast, dependable Android apps published on Google Play.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Scope Mobile App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E2E8F0] shadow-sm transition-all"
            >
              <span>Explore Mobile Packages</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Android Capabilities
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Play className="w-8 h-8 text-[#4338CA]" />
              <h3 className="text-base font-bold text-[#131B2E]">Google Play Store Release</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full end-to-end guidance from bundle generation and store metadata to review approval and public availability.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Bell className="w-8 h-8 text-emerald-600" />
              <h3 className="text-base font-bold text-[#131B2E]">Push Notifications</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Instant delivery of school circulars, emergency announcements, holiday alerts, and promotional notices.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Zap className="w-8 h-8 text-[#F97360]" />
              <h3 className="text-base font-bold text-[#131B2E]">Fast &amp; Lightweight</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Clean, battery-efficient architecture optimized for standard Android smartphones across Bihar.
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
              Android App FAQs
            </h2>
          </div>
          <div className="space-y-3">
            {androidFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Launch Your Mobile App
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            Discuss your Android app project with Ekaagra Technologies in Motihari and receive a structured roadmap.
          </p>
          <div className="pt-2">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get Android App Estimate</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
