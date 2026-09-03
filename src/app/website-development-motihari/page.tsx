import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Check,
  Globe,
  ShieldCheck,
  Zap,
  Smartphone,
  Phone,
  MessageSquare,
  Building2,
  GraduationCap,
  Store,
  Layers,
  HelpCircle,
  Clock,
  Code2,
  Database,
  Cpu,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  createPageMetadata,
  localBusinessSchema,
  serviceSchema,
  faqPageSchema,
  SITE_URL,
  BRAND_EMAIL,
} from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import MagneticButton from '@/components/motion/MagneticButton';
import GlowCard from '@/components/motion/GlowCard';
import FAQItem from '@/components/ui/FAQItem';
import { buildGeneralInquiryWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = createPageMetadata({
  title: 'Website Design & Development Company in Motihari, Bihar | Ekaagra Technologies',
  description:
    'Looking for a professional website developer in Motihari, Bihar? Ekaagra Technologies builds fast, custom, mobile-first websites, school portals, and web applications designed to convert visitors into clients.',
  path: '/website-development-motihari',
  keywords: [
    'website developer in Motihari',
    'website development company in Motihari',
    'web designer in Motihari',
    'web development in Motihari',
    'website design Motihari Bihar',
    'custom website development Motihari',
    'school website development Motihari',
    'Ekaagra Technologies Motihari',
  ],
});

const localFaqs = [
  {
    question: 'How much does website development cost in Motihari?',
    answer:
      'At Ekaagra Technologies, custom responsive business websites start from ₹15,000. Dynamic web applications with admin panels start from ₹30,000, and institutional School ERP platforms start from ₹80,000. Every project includes fixed milestone pricing with zero hidden renewal fees.',
  },
  {
    question: 'How long does it take to design and launch a website?',
    answer:
      'A standard custom responsive website takes 1–2 weeks from discovery to deployment. Interactive web applications take 2–4 weeks, while full-scale School ERP systems take 1–2 months depending on required modules. You test everything on a private staging link before public launch.',
  },
  {
    question: 'Can you build school websites and School ERP in Motihari and East Champaran?',
    answer:
      'Yes! We have proven experience in educational technology, having built the Roshani Public School portal (including CBSE mandatory disclosures) and full-featured School ERP platforms handling attendance, fee receipts, and parent communication.',
  },
  {
    question: 'Do I own the source code and domain of my website?',
    answer:
      'Absolutely 100%. Unlike agencies that lock clients into monthly proprietary builder fees, we hand over full source code, database access, and assist in configuring your own domain name and cloud hosting.',
  },
  {
    question: 'Why should businesses in Motihari have a custom website instead of just social media?',
    answer:
      'Social media accounts are rented land subject to algorithm changes. A professional website establishes local Google Search authority when customers search for products or services in Motihari, provides direct WhatsApp conversion, and showcases verified credibility.',
  },
  {
    question: 'What technologies do you use to build websites?',
    answer:
      'We engineer websites using modern frameworks including Next.js 16, React 19, TypeScript, Tailwind CSS, and cloud PostgreSQL databases (Supabase). This modern edge architecture guarantees sub-500ms load speeds, bank-grade security, and seamless mobile responsiveness.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Discovery & Scope Alignment',
    description:
      'We clarify your target audience in Motihari, business objectives, required features, and conversion triggers before writing any code.',
  },
  {
    step: '02',
    title: 'Custom UI/UX Wireframing',
    description:
      'We design an original, mobile-first prototype focused on effortless readability, clear typography, and 1-click inquiry pathways.',
  },
  {
    step: '03',
    title: 'Modern Full-Stack Engineering',
    description:
      'We build your website using Next.js and React, ensuring fast edge loading speeds, mobile responsiveness, and clean semantic SEO structure.',
  },
  {
    step: '04',
    title: 'Private Staging Review',
    description:
      'You test the complete working website on a private, live URL on your own phone before public launch, verifying all forms and buttons.',
  },
  {
    step: '05',
    title: 'Domain Launch & Code Handover',
    description:
      'We connect your custom domain name, enable free SSL encryption, submit your XML sitemap to Google Search Console, and hand over 100% of your source code.',
  },
];

const techStack = [
  { name: 'Next.js 16', role: 'Server-side rendering & instant edge page loads' },
  { name: 'React 19', role: 'Interactive user interface components & forms' },
  { name: 'Tailwind CSS', role: 'Lightweight mobile-first responsive styling' },
  { name: 'TypeScript', role: 'Type-safe enterprise-grade codebase reliability' },
  { name: 'Supabase / PostgreSQL', role: 'Secure cloud database with real-time sync' },
  { name: 'Vercel Edge Cloud', role: 'Sub-500ms global CDN hosting & automated SSL' },
];

export default function WebsiteDevelopmentMotihariPage() {
  const whatsappUrl = buildGeneralInquiryWhatsAppUrl();

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      {/* Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema()),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema({
              name: 'Website Design & Development in Motihari',
              description:
                'Custom, high-converting website design and web development for businesses, schools, and organizations in Motihari and East Champaran, Bihar.',
              url: `${SITE_URL}/website-development-motihari`,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema(localFaqs)),
        }}
      />

      <div className="site-container pt-6 pb-2">
        <Breadcrumbs
          items={[
            { label: 'Services', href: '/services' },
            { label: 'Website Development in Motihari' },
          ]}
        />
      </div>

      {/* ─── 1. HERO SECTION ───────────────────────────────────────── */}
      <section className="py-12 sm:py-20 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container relative z-10 max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            LOCAL DIGITAL EXCELLENCE • MOTIHARI, BIHAR
          </div>

          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Website Design &amp; Development Company in Motihari, Bihar
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl mx-auto">
            We build fast, beautiful, and conversion-focused websites engineered to give Motihari businesses and institutions an undeniable competitive edge on Google Search and mobile devices.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <MagneticButton maxDistance={6}>
              <Link
                href="/get-quote"
                className="premium-shimmer-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
              >
                <span>Request Project Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </MagneticButton>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Consultation</span>
            </a>
          </div>

          <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-2xl mx-auto border-t border-[#E2E8F0]">
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Location</span>
              <span className="text-xs font-extrabold text-[#131B2E] block">Motihari Studio</span>
              <span className="text-[10px] text-[#64748B] block">Service-Area Base</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Starting Price</span>
              <span className="text-xs font-extrabold text-emerald-600 block">₹15,000 Base</span>
              <span className="text-[10px] text-[#64748B] block">Standard 5-page site</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Turnaround</span>
              <span className="text-xs font-extrabold text-[#F97360] block">1–2 Weeks</span>
              <span className="text-[10px] text-[#64748B] block">Post scope sign-off</span>
            </div>
            <div className="p-2">
              <span className="text-[10px] uppercase font-bold text-[#64748B] block">Ownership</span>
              <span className="text-xs font-extrabold text-[#4338CA] block">100% Code Rights</span>
              <span className="text-[10px] text-[#64748B] block">Full repo handover</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. WHY MOTIHARI BUSINESSES NEED A PROFESSIONAL WEBSITE ─ */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              LOCAL MARKET CONTEXT
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Why Businesses in Motihari Need a Dedicated Website
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              The way customers in East Champaran discover and choose businesses has shifted radically to smartphones and Google Search.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#131B2E]">Capture Local Google Searches</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                When residents search for a &ldquo;website developer in Motihari&rdquo;, &ldquo;school in Motihari&rdquo;, or specific services, businesses with fast, structured websites rank at the top of organic results.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#131B2E]">Instant WhatsApp Enquiries</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Over 85% of local web traffic in Bihar is on mobile. We integrate 1-click WhatsApp buttons and smart inquiry forms that send lead details straight to your phone.
              </p>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F97360]/10 text-[#F97360] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#131B2E]">Stand Out From Outdated Competitors</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Most local businesses either have no website or an obsolete, slow page. A premium, modern web experience instantly positions you as the market leader.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. WHAT EKAAGRA TECHNOLOGIES BUILDS ───────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              CORE SOLUTIONS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
              Website &amp; Software Solutions We Deliver in Motihari
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <GlowCard className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#4338CA]/10 text-[#4338CA] rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#131B2E]">Business &amp; Corporate Websites</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Clean, authoritative websites for service firms, contractors, distributors, and professionals designed to present capabilities, client proof, and capture sales inquiries.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                <Link href="/services/website-development" className="hover:underline">
                  Learn about website packages &rarr;
                </Link>
              </div>
            </GlowCard>

            <GlowCard className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-700 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#131B2E]">School Portals &amp; ERP Systems</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Official CBSE disclosure-ready school websites, online admissions workflows, dynamic notices, fee collection engines, and complete student-parent management portals.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                <Link href="/school-website-development-motihari" className="hover:underline">
                  Explore school website options &rarr;
                </Link>
              </div>
            </GlowCard>

            <GlowCard className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F97360]/10 text-[#F97360] rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#131B2E]">Interactive Web Applications</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Full-featured custom dashboards, customer ordering systems, cloud databases, and role-based staff portals built with Next.js, React, and Supabase.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                <Link href="/web-application-development-motihari" className="hover:underline">
                  View web application capabilities &rarr;
                </Link>
              </div>
            </GlowCard>

            <GlowCard className="p-6 bg-white border border-[#E2E8F0] rounded-2xl space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-800 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#131B2E]">Android Mobile Applications</h3>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Native Android apps and Google Play Store listings for institutions and commercial brands, complete with instant push announcements and offline performance.
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-[#4338CA]">
                <Link href="/android-app-development-motihari" className="hover:underline">
                  See Android development &rarr;
                </Link>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* ─── 4. DEVELOPMENT PROCESS ───────────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              TRANSPARENT EXECUTION
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Our 5-Step Web Development Workflow
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Every project is managed with clear review milestones so you always know what is being built.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {processSteps.map((item, index) => (
              <div
                key={index}
                className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E2E8F0] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <span className="text-xs font-mono font-extrabold text-[#F97360]">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-[#131B2E] leading-snug">
                    {item.title}
                  </h3>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. MODERN ENGINEERING STACK ─────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              PRODUCTION ARCHITECTURE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Engineered With Modern Technologies
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Why our websites load in under 1 second while legacy WordPress sites take 5–8 seconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-2xl border border-[#E2E8F0] flex items-start gap-3 shadow-sm"
              >
                <div className="p-2 bg-[#4338CA]/10 text-[#4338CA] rounded-xl shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-extrabold text-[#131B2E]">{tech.name}</h3>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{tech.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. TRANSPARENT PRICING GUIDANCE ──────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              HONEST INVESTMENT
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Website Pricing Starting Points in Motihari
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Clear starting packages with fixed milestone scopes and 100% source code ownership.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4338CA] uppercase">Starter Business</span>
                <div className="text-2xl font-extrabold text-[#131B2E]">₹15,000</div>
                <p className="text-xs text-[#64748B]">
                  Custom 5-page responsive website with 1-click WhatsApp lead capture and basic Google SEO.
                </p>
                <ul className="text-xs text-[#475569] space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile-first responsive design</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp &amp; Contact forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Code &amp; Domain ownership</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/get-quote"
                className="w-full text-center py-2.5 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase rounded-xl shadow-sm block transition-all"
              >
                Choose Starter
              </Link>
            </div>

            <div className="p-6 bg-white rounded-2xl border-2 border-[#4338CA] shadow-lg space-y-4 flex flex-col justify-between relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#4338CA] text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4338CA] uppercase">Professional Business</span>
                <div className="text-2xl font-extrabold text-[#131B2E]">₹25,000</div>
                <p className="text-xs text-[#64748B]">
                  Comprehensive 8–12 page website with dynamic notice board, photo gallery, and priority SEO.
                </p>
                <ul className="text-xs text-[#475569] space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>CBSE compliance ready (for schools)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Online quote &amp; admission forms</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sub-500ms edge performance</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/get-quote"
                className="w-full text-center py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase rounded-xl shadow-md block transition-all"
              >
                Choose Professional
              </Link>
            </div>

            <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#4338CA] uppercase">Custom Web App &amp; ERP</span>
                <div className="text-2xl font-extrabold text-[#131B2E]">₹30,000+</div>
                <p className="text-xs text-[#64748B]">
                  Full-stack interactive portals, cloud databases, role-based logins, and automated workflows.
                </p>
                <ul className="text-xs text-[#475569] space-y-1.5 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Supabase / PostgreSQL database</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin dashboard &amp; user logins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payment gateway integration</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/pricing"
                className="w-full text-center py-2.5 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase rounded-xl shadow-sm block transition-all"
              >
                View Full Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. LOCAL CASE STUDIES & PROOF ────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-5xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
                PROVEN REGIONAL TRACK RECORD
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                Live Projects Engineered in Bihar
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-xs font-bold text-[#4338CA] hover:text-[#3730A3] inline-flex items-center gap-1"
            >
              <span>View All 6 Case Studies</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] space-y-2.5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase">
                School Web Platform
              </span>
              <h3 className="text-base font-bold text-[#131B2E]">Roshani Public School</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                12 public sections with online admissions inquiry, CBSE mandatory disclosures, dynamic notice board, and mobile-first experience.
              </p>
              <Link
                href="/projects/roshani-public-school"
                className="text-xs font-semibold text-[#4338CA] inline-flex items-center gap-1 hover:underline pt-1"
              >
                <span>Read Case Study</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] space-y-2.5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">
                Institutional ERP
              </span>
              <h3 className="text-base font-bold text-[#131B2E]">Roshani School ERP</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Comprehensive multi-role ERP covering admissions, student records, fee collection, receipt generation, and parent communication.
              </p>
              <Link
                href="/projects/roshani-public-school-erp"
                className="text-xs font-semibold text-[#4338CA] inline-flex items-center gap-1 hover:underline pt-1"
              >
                <span>Read Case Study</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#E2E8F0] space-y-2.5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase">
                B2B Print Web App
              </span>
              <h3 className="text-base font-bold text-[#131B2E]">Palak Enterprises (Chakia)</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Custom web application with direct document uploads, Razorpay payment gateway integration, and live order status lookup.
              </p>
              <Link
                href="/projects/palak-enterprises"
                className="text-xs font-semibold text-[#4338CA] inline-flex items-center gap-1 hover:underline pt-1"
              >
                <span>Read Case Study</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. WHY CHOOSE EKAAGRA TECHNOLOGIES ───────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-white">
        <div className="site-container max-w-5xl space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              CLIENT GUARANTEE
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Why Businesses in Motihari Choose Ekaagra Technologies
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
              <CheckCircle2 className="w-6 h-6 text-[#4338CA]" />
              <h3 className="text-sm font-bold text-[#131B2E]">100% Code Ownership</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Full GitHub repository handover with zero vendor lock-in or proprietary builder fees.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
              <Zap className="w-6 h-6 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#131B2E]">Sub-500ms Edge Speed</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Prerendered Next.js edge pages that load immediately on 4G smartphone connections.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
              <ShieldCheck className="w-6 h-6 text-[#F97360]" />
              <h3 className="text-sm font-bold text-[#131B2E]">Google-Ready SEO</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Built-in Schema.org structured data, XML sitemaps, and optimized metadata for Motihari search intent.
              </p>
            </div>

            <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E2E8F0] space-y-2">
              <Phone className="w-6 h-6 text-amber-600" />
              <h3 className="text-sm font-bold text-[#131B2E]">Direct Local Support</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Direct WhatsApp and phone consultation with the developers building your software.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FREQUENTLY ASKED QUESTIONS ────────────────────────── */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-[#FAF7F2]">
        <div className="site-container max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              CLEAR LOCAL ANSWERS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
              Frequently Asked Questions About Web Development in Motihari
            </h2>
          </div>

          <div className="space-y-3">
            {localFaqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs text-[#64748B]">
              Have a question not listed here? Read our comprehensive{' '}
              <Link
                href="/blog/best-website-developer-motihari"
                className="text-[#4338CA] font-bold hover:underline"
              >
                guide on choosing a web developer in Motihari
              </Link>{' '}
              or review our{' '}
              <Link
                href="/blog/website-development-cost-in-motihari-bihar"
                className="text-[#4338CA] font-bold hover:underline"
              >
                website cost breakdown
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 10. CONVERSION CTA ───────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] text-center border-b border-[#E2E8F0]">
        <div className="site-container max-w-3xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
            Ready to Build Your Website in Motihari?
          </h2>
          <p className="text-sm text-[#64748B] leading-relaxed max-w-xl mx-auto">
            Discuss your requirements directly with our team. We provide a comprehensive development roadmap and fixed-price estimate within 24 hours.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/get-quote"
              className="premium-shimmer-btn inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Get Your Free Quote</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
