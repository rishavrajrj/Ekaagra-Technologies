import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Calendar,
  FileText,
  Users,
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
  title: 'School Website Development in Motihari & Bihar | Ekaagra Technologies',
  description:
    'Custom school website design in Motihari, Bihar. Built for CBSE mandatory disclosures, online admissions, dynamic notices, photo gallery, and mobile-friendly parent communication.',
  path: '/school-website-development-motihari',
  keywords: [
    'school website development Motihari',
    'school website design Bihar',
    'school website developer East Champaran',
    'CBSE school website developer',
    'school online admission website Motihari',
  ],
});

const schoolFaqs = [
  {
    question: 'Are your school websites compliant with CBSE Mandatory Disclosure requirements?',
    answer:
      'Yes. We design dedicated compliance repositories for mandatory CBSE disclosures, affiliation documents, fee structures, academic calendars, and management committee information as required by regulatory boards.',
  },
  {
    question: 'Can school staff update notices, circulars, and photos without technical knowledge?',
    answer:
      'Yes. Through an intuitive admin control panel, school staff can post daily circulars, event notices, holiday updates, and photo galleries in seconds with zero coding required.',
  },
  {
    question: 'How much does a school website cost in Motihari?',
    answer:
      'A complete institutional school website (5–12 pages with admissions forms and notice board) typically ranges from ₹15,000 to ₹35,000 depending on features and dynamic database requirements.',
  },
  {
    question: 'Can the school website later be connected to a School ERP system?',
    answer:
      'Yes! Our school websites are architected modularly, allowing seamless future upgrades to our School ERP system for fee collection, attendance, and parent portals.',
  },
];

export default function SchoolWebsiteDevelopmentMotihariPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'School Website Development in Motihari',
              description:
                'Official school website design with CBSE compliance, online admissions, dynamic notices, and mobile-friendly parent communication in Motihari, Bihar.',
              url: `${SITE_URL}/school-website-development-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(schoolFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'School Website Development in Motihari' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <GraduationCap className="w-4 h-4 text-[#F97360]" />
            ACADEMIC DIGITAL PLATFORMS • MOTIHARI &amp; BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            School Website Development in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Inspire prospective parents, satisfy CBSE mandatory disclosure regulations, and streamline student admissions with a modern, fast, and authoritative school website.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Build School Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects/roshani-public-school"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E2E8F0] shadow-sm transition-all"
            >
              <span>View School Case Study</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Essential Features for Modern Schools
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Designed specifically around the regulatory and communication requirements of schools in Bihar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <ShieldCheck className="w-8 h-8 text-[#4338CA]" />
              <h3 className="text-base font-bold text-[#131B2E]">CBSE Mandatory Disclosures</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Dedicated regulatory sections for affiliation status, fee norms, safety certificates, staff profiles, and academic calendars compliant with official inspection criteria.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <FileText className="w-8 h-8 text-emerald-600" />
              <h3 className="text-base font-bold text-[#131B2E]">Online Admissions Workflow</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Streamline new student inquiries with clear admission guidelines, downloadable prospectus, and digital forms that notify school administration instantly.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Calendar className="w-8 h-8 text-[#F97360]" />
              <h3 className="text-base font-bold text-[#131B2E]">Live Notice Board &amp; Circulars</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Publish exam timetables, urgent holiday announcements, and academic circulars directly to parents, eliminating the cost and delay of physical paper circulars.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Callout */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
          <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
            FEATURED SCHOOL CASE STUDY
          </span>
          <h3 className="text-2xl font-extrabold text-[#131B2E]">
            Roshani Public School Web Platform
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            We designed and deployed an institutional 12-page web platform for Roshani Public School with full CBSE mandatory compliance sections, dynamic photo gallery, live notice board with Supabase backend, and WhatsApp admission integration.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/projects/roshani-public-school"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3]"
            >
              <span>Read Full Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/school-erp-motihari"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#131B2E]"
            >
              <span>Explore School ERP Upgrade &rarr;</span>
            </Link>
            <Link
              href="/blog/school-erp-vs-school-website"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
            >
              <span>ERP vs Website Comparison &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              School Website FAQs
            </h2>
          </div>
          <div className="space-y-3">
            {schoolFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Elevate Your School&apos;s Digital Presence
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            Contact Ekaagra Technologies in Motihari to discuss your school website project and get a free CBSE compliance review.
          </p>
          <div className="pt-2">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get School Website Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
