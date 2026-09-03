import type { Metadata } from 'next';
import Link from 'next/link';
import {
  GraduationCap,
  Check,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Users,
  Award,
  Bell,
  Clock,
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
  title: 'School ERP Systems in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Complete School ERP software in Motihari, Bihar. Manage admissions, fee collection with digital receipts, student attendance, exams, report cards, and parent communication.',
  path: '/school-erp-motihari',
  keywords: [
    'school ERP in Motihari',
    'school management software Motihari',
    'school ERP software Bihar',
    'fee management software schools Motihari',
    'student attendance management system Bihar',
  ],
});

const erpFaqs = [
  {
    question: 'What modules are included in the Ekaagra School ERP?',
    answer:
      'Our School ERP includes 6 distinct user portals (Admin, Principal, Teacher, Accountant, Parent, and Student) with modules for admissions, fee collection, receipt generation, daily attendance, examination grading, digital report cards, and institutional notice boards.',
  },
  {
    question: 'What is the pricing model for School ERP in Motihari?',
    answer:
      'We offer flexible pricing: Option A is a One-Time License starting from ₹80,000 for full deployment. Option B is a Per-Student SaaS model at ₹15–₹25 per student/month. Option C is a Hybrid model with ₹25,000 setup plus an Annual Maintenance Agreement (AMC).',
  },
  {
    question: 'Can parents pay fees online and get instant receipts?',
    answer:
      'Yes. The system tracks fee dues, records cash or digital payments, generates automated printable receipts, and can be integrated with payment gateways like Razorpay for direct online parent payments.',
  },
  {
    question: 'Is training provided for school administrative staff and teachers?',
    answer:
      'Yes. Every School ERP deployment includes complete on-site or guided remote staff training, administrative documentation, and 30-day post-launch technical support.',
  },
];

export default function SchoolErpMotihariPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'School ERP Development in Motihari',
              description:
                'Enterprise School Resource Planning software for educational institutions in Motihari and East Champaran, Bihar.',
              url: `${SITE_URL}/school-erp-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(erpFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'School ERP in Motihari' },
          ]}
        />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            INSTITUTIONAL AUTOMATION • MOTIHARI &amp; BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            School ERP Systems in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            Eliminate paperwork bottlenecks. Manage student admissions, fee collections with instant receipts, attendance tracking, and exam report cards in a single unified cloud platform.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Request ERP Demo &amp; Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects/roshani-public-school-erp"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] font-bold text-xs uppercase tracking-wider rounded-xl border border-[#E2E8F0] shadow-sm transition-all"
            >
              <span>View Live ERP Case Study</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              POWERFUL SYSTEM MODULES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Everything Your School Administration Needs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                ₹
              </div>
              <h3 className="text-base font-bold text-[#131B2E]">Fee Collection &amp; Receipts</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Track pending dues, generate instant thermal/A4 digital receipts, manage installment structures, and run automated monthly revenue reports.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Clock className="w-10 h-10 text-[#4338CA]" />
              <h3 className="text-base font-bold text-[#131B2E]">Attendance &amp; Leave Records</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Daily and subject-wise student attendance with automated parent notifications for absences, plus staff duty and leave management.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <Award className="w-10 h-10 text-[#F97360]" />
              <h3 className="text-base font-bold text-[#131B2E]">Exams &amp; Report Cards</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Grade entry for unit tests and term examinations with automated percentage calculations, rank generation, and printable CBSE-format report cards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Callout */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
          <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
            VERIFIED LOCAL DEPLOYMENT
          </span>
          <h3 className="text-2xl font-extrabold text-[#131B2E]">
            Roshani Public School ERP Deployment
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            A full-scale school ERP platform engineered with 6 role-based user portals (Admin, Principal, Teacher, Accountant, Parent, and Student), Supabase PostgreSQL backend, and automated fee receipt generation.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link
              href="/projects/roshani-public-school-erp"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4338CA] hover:text-[#3730A3]"
            >
              <span>Read Full ERP Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/school-website-development-motihari"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#131B2E]"
            >
              <span>Explore School Website Solutions &rarr;</span>
            </Link>
            <Link
              href="/blog/school-erp-vs-school-website"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] hover:underline"
            >
              <span>Read ERP vs Website Guide &rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Frequently Asked Questions About School ERP
            </h2>
          </div>
          <div className="space-y-3">
            {erpFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">
            Digitize Your School Operations Today
          </h2>
          <p className="text-sm text-[#64748B] max-w-xl mx-auto">
            Book a live School ERP demonstration with Ekaagra Technologies in Motihari and discover how much administrative time your staff can save.
          </p>
          <div className="pt-2">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Schedule Live Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
