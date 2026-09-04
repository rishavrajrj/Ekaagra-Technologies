import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  GraduationCap,
  Globe,
  Database,
  Smartphone,
  ShieldCheck,
  Check,
  HelpCircle,
  Clock,
  Layers,
  FileText,
  Lock,
  Phone,
  MessageCircle,
} from 'lucide-react';
import Reveal from '@/components/motion/Reveal';
import StaggerReveal from '@/components/motion/StaggerReveal';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import FAQItem from '@/components/ui/FAQItem';
import SchoolQuoteConfigurator from '@/components/schools/SchoolQuoteConfigurator';
import {
  schoolPlans,
  schoolStudentTiers,
  schoolAddons,
} from '@/lib/schoolPricing';
import {
  createPageMetadata,
  webPageSchema,
  serviceSchema,
  SITE_URL,
} from '@/lib/seo.config';

export const metadata: Metadata = createPageMetadata({
  title: 'School Website, CMS & ERP Solutions | Ekaagra Technologies',
  description:
    'From professional CBSE/ICSE school websites to student-tiered School ERP platforms, Ekaagra Technologies builds, hosts, and supports complete digital school management systems with transparent pricing.',
  path: '/schools',
  keywords: [
    'school website development',
    'school ERP Bihar',
    'school ERP Motihari',
    'school management software',
    'CBSE school website',
    'ICSE school ERP',
    'student management system',
    'school CMS portal',
    'school attendance software',
    'school fees management system',
  ],
});

const schoolFaqs = [
  {
    question: 'What is included in the School Website plan?',
    answer:
      'The School Website plan (₹9,999 Year 1 / ₹6,999/year renewal) includes up to 10 professionally designed standard pages (Home, About Us, Principal’s Message, Academics, Facilities, Campus Activities, Photo Gallery, Admission Enquiry, Notices, and Contact Us). It also comes with high-speed cloud hosting, an SSL security certificate, school branding integration, basic Google Search SEO, mobile-first responsive layout, and year-round technical maintenance.',
  },
  {
    question: 'What is the difference between CMS and ERP?',
    answer:
      'CMS (Content Management System) is designed for managing your public-facing school website — allowing staff to publish notices, update photo galleries, add circulars, and post news without touching code. ERP (Enterprise Resource Planning), on the other hand, is an internal operational platform for managing student records, admissions, class sections, attendance, examinations, CBSE report cards, fees, and staff payroll. CMS is for the public, while ERP runs the school’s daily academic administration.',
  },
  {
    question: 'How is ERP pricing calculated? Does it depend on student strength?',
    answer:
      'Yes. ERP pricing scales directly with your school’s student strength (e.g. Up to 300 students: ₹24,999 Year 1; 301–700 students: ₹34,999; 701–1,500 students: ₹49,999; 1,501–3,000 students: ₹69,999). This tiered approach ensures smaller academies and expanding schools only pay for the computational capacity, database storage, and operational volume they actually require.',
  },
  {
    question: 'Why is Year 1 different from the renewal price?',
    answer:
      'Year 1 covers the intensive initial engineering and setup: custom design, school identity integration, database deployment, student/faculty data structure setup, user roles configuration, and staff training. Renewal covers ongoing operations: high-performance hosting, cloud database storage, daily backups, technical support, security patches, bug fixes, and continuous platform maintenance.',
  },
  {
    question: 'Can we choose our own domain, and is it included?',
    answer:
      'Yes! You can choose ANY available domain. Every plan includes an annual domain allowance (₹300 for School Website, ₹500 for Website + CMS or ERP, and ₹750 for Complete Platform). If your preferred domain costs within the allowance, it is 100% included at no extra cost. If you pick a domain priced above your plan’s allowance, you simply pay the transparent difference as an upgrade.',
  },
  {
    question: 'What happens if our preferred domain costs more than the allowance?',
    answer:
      'Our live domain tool calculates the upgrade difference automatically. For example, on the Complete Platform (allowance ₹750/year), if a domain costs ₹1,200 for 1 year, you only pay an upgrade difference of ₹450. You are never restricted to specific extensions.',
  },
  {
    question: 'Can we add modules later as our school grows?',
    answer:
      'Absolutely. Our architecture is modular. You can launch with a School Website or Core ERP today, and activate advanced modules like Online Fee Collection, Parent Android App, Biometric Attendance Sync, or WhatsApp Notification APIs whenever your institution is ready.',
  },
  {
    question: 'Can you migrate our existing student data from Excel or older software?',
    answer:
      'Yes. We provide comprehensive data onboarding services. We extract, sanitize, and securely import your existing student records, parent contact details, and historical academic sessions from spreadsheets or legacy database exports directly into your new platform.',
  },
  {
    question: 'Can the platform support multiple branches or campuses?',
    answer:
      'Yes. For multi-branch educational societies and school groups with 3,000+ students, we provide centralized multi-branch ERP architecture with branch-level permissions, consolidated reporting, and cross-campus administrative dashboards.',
  },
  {
    question: 'Can the school upgrade from Website to ERP later?',
    answer:
      'Yes. Many schools start with our School Website + CMS to quickly modernize their public admissions presence, and later upgrade to the Complete Platform by activating ERP without needing to rebuild their website from scratch.',
  },
];

export default function SchoolsPage() {
  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Structured Data Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'School Website, CMS & ERP Solutions',
              description:
                'Professional school websites, CMS portals, and student-tiered ERP platforms built for CBSE, ICSE, and State Board schools by Ekaagra Technologies.',
              url: `${SITE_URL}/schools`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'School Technology & ERP Platforms',
              description:
                'Modern school websites, CMS management, student records, fee management, attendance, and CBSE report card generation for educational institutions.',
              url: `${SITE_URL}/schools`,
            })
          ),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'School Solutions & Pricing' }]} />
      </div>

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-4 relative z-10 max-w-4xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              <GraduationCap className="w-3.5 h-3.5 text-[#4338CA]" />
              SCHOOL TECHNOLOGY SOLUTIONS
            </span>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
              Build a Smarter Digital School
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              From professional school websites to complete school management platforms, Ekaagra Technologies helps schools build, manage, and grow their digital presence.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#school-configurator"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25 hover:-translate-y-0.5"
              >
                <span>Explore School Plans</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider rounded-xl transition-all border border-[#E2E8F0] shadow-sm"
              >
                <span>Talk to Ekaagra</span>
              </Link>
            </div>
          </Reveal>

          {/* Connected Ecosystem Visual Card */}
          <Reveal delay={300}>
            <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border border-[#E2E8F0] shadow-xl max-w-3xl mx-auto">
              <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-widest block mb-4">
                The Connected School Technology Ecosystem
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#131B2E]">
                    School Website
                  </h2>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Showcases campus life, infrastructure, and attracts admission inquiries.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#131B2E]">
                    School Website + CMS
                  </h2>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Lets school staff publish circulars, notices, and albums without coding.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <Database className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#131B2E]">
                    School ERP
                  </h2>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Automates admissions, student records, daily attendance, fees, and report cards.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 2. PRODUCT TYPE SECTION ─────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-white">
        <div className="site-container space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              FOUR TARGETED PACKAGES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Choose the Right Solution for Your School
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Transparent, student-scaled pricing designed for CBSE, ICSE, State Board, and private institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolPlans.map((plan) => (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 border bg-[#FAF7F2] transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted
                    ? 'border-2 border-[#4338CA] bg-white shadow-lg shadow-[#4338CA]/10'
                    : 'border-[#E2E8F0]'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white shadow-md">
                    {plan.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-[#131B2E]">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                      {plan.bestFor}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Year 1 Platform
                    </span>
                    <span className="text-2xl font-extrabold font-mono text-[#131B2E] block mt-0.5">
                      {plan.startingPriceDisplay}
                    </span>
                    {plan.renewalPriceDisplay && (
                      <span className="text-xs text-[#4338CA] font-semibold block mt-1">
                        Renewal: {plan.renewalPriceDisplay}
                      </span>
                    )}
                  </div>

                  {plan.id === 'school-website-cms' && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950 leading-normal">
                      <strong>Important:</strong> CMS manages the public website content (notices, gallery). It is distinct from internal ERP student administration.
                    </div>
                  )}

                  {plan.isStudentBased && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 leading-normal">
                      <strong>Student-Based Capacity:</strong> ERP capacity scales dynamically based on student enrollment strength.
                    </div>
                  )}

                  <div className="space-y-2 pt-2 text-xs">
                    <span className="font-bold text-[#131B2E] uppercase tracking-wider text-[10px] block">
                      Included Capabilities:
                    </span>
                    {plan.features.slice(0, 7).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-[#334155] leading-relaxed">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E2E8F0]">
                  <a
                    href="#school-configurator"
                    className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      plan.highlighted
                        ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white shadow-md shadow-[#4338CA]/25'
                        : 'bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0]'
                    }`}
                  >
                    <span>{plan.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. ERP STUDENT-BASED PRICING SECTION ───────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              SCALABLE STUDENT CAPACITY
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              ERP Pricing by Student Strength
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              ERP pricing scales with student strength so your school only pays for the platform capacity it needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Table 1: Standalone School ERP */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] font-extrabold text-[#4338CA] uppercase tracking-wider block">
                  Standalone Solution
                </span>
                <h3 className="text-lg font-extrabold text-[#131B2E]">
                  School ERP Student Tiers
                </h3>
              </div>

              <div className="space-y-3">
                {schoolStudentTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-extrabold text-xs text-[#131B2E] block">
                        {tier.label}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {tier.studentRangeText}
                      </span>
                    </div>

                    <div className="text-right">
                      {tier.isCustom ? (
                        <span className="text-xs font-bold text-[#4338CA]">
                          Custom Quotation
                        </span>
                      ) : (
                        <div>
                          <span className="font-extrabold font-mono text-xs text-[#131B2E] block">
                            ₹{tier.erpYearOnePrice?.toLocaleString('en-IN')} (Yr 1)
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Renewal: ₹{tier.erpRenewalPrice?.toLocaleString('en-IN')}/yr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 2: Complete Platform (Website + CMS + ERP) */}
            <div className="bg-white rounded-3xl border-2 border-[#4338CA] p-6 shadow-lg shadow-[#4338CA]/10 space-y-4 relative">
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#4338CA] text-white">
                BEST VALUE PLATFORM
              </span>

              <div className="border-b border-[#E2E8F0] pb-3">
                <span className="text-[11px] font-extrabold text-[#4338CA] uppercase tracking-wider block">
                  Connected Ecosystem
                </span>
                <h3 className="text-lg font-extrabold text-[#131B2E]">
                  Website + CMS + ERP Tiers
                </h3>
              </div>

              <div className="space-y-3">
                {schoolStudentTiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-extrabold text-xs text-[#131B2E] block">
                        {tier.label}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {tier.studentRangeText}
                      </span>
                    </div>

                    <div className="text-right">
                      {tier.isCustom ? (
                        <span className="text-xs font-bold text-[#4338CA]">
                          Custom Quotation
                        </span>
                      ) : (
                        <div>
                          <span className="font-extrabold font-mono text-xs text-[#4338CA] block">
                            ₹{tier.completeYearOnePrice?.toLocaleString('en-IN')} (Yr 1)
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            Renewal: ₹{tier.completeRenewalPrice?.toLocaleString('en-IN')}/yr
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. YEAR 1 VS RENEWAL EXPLANATION ───────────────────────────────── */}
      <section className="py-14 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              TRANSPARENT COMMERCIAL BREAKDOWN
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Why is Year 1 Different from Renewal?
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              We believe in upfront clarity. Year 1 encompasses full implementation and deployment, while renewals cover reliable ongoing operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#4338CA] text-white flex items-center justify-center font-bold text-xs">
                  01
                </span>
                <h3 className="font-extrabold text-base text-[#131B2E]">
                  Year 1 Includes (Setup &amp; Launch)
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-[#334155]">
                {[
                  'Initial custom school design & UI/UX branding',
                  'Platform deployment & cloud database configuration',
                  'Student, teacher & role permissions setup',
                  'Academic session & timetable structuring',
                  'Initial student data configuration / import',
                  'Administrator and teacher onboarding training',
                  'High-speed hosting & SSL security certificate',
                  'Year-round technical maintenance & platform access',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-3xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  02
                </span>
                <h3 className="font-extrabold text-base text-[#131B2E]">
                  Renewal Includes (Annual Operations)
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-[#334155]">
                {[
                  'Continuous platform access for all school users',
                  'High-performance cloud hosting & bandwidth',
                  'Regular automated database backups',
                  'Security updates & system patches',
                  'Bug fixes & performance optimizations',
                  'Continuous platform feature updates',
                  'Direct priority technical support',
                  'Domain renewal coordination',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. INTERACTIVE CONFIGURATOR & DOMAIN FUNNEL ──────────────────────── */}
      <SchoolQuoteConfigurator />

      {/* ─── 6. OPTIONAL MODULES SHOWCASE ────────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-white">
        <div className="site-container space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              CAMPUS EXPANSION
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Optional School Modules
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Activate specialized capabilities as your institution expands its digital operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schoolAddons.slice(0, 9).map((addon) => (
              <div
                key={addon.id}
                className="p-5 rounded-3xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#4338CA] uppercase tracking-wider">
                    Optional Add-on
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {addon.priceNote}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-[#131B2E]">
                  {addon.name}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {addon.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. FREQUENTLY ASKED QUESTIONS ───────────────────────────────────── */}
      <section className="py-14 sm:py-20 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Clear answers to common questions asked by school directors, principals, and administrative heads.
            </p>
          </div>

          <div className="space-y-3">
            {schoolFaqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#131B2E] tracking-tight">
            Ready to Modernize Your School&apos;s Technology?
          </h2>
          <p className="text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Schedule a personalized walkthrough with our school technology team or get a customized proposal for your institution.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#school-configurator"
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Configure Your School Plan</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all border border-[#E2E8F0]"
            >
              <span>Speak to an Engineer</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
