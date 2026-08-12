import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowUpRight,
  Shield,
  Cpu,
  Headphones,
  Target,
  Puzzle,
  Eye,
  TrendingUp,
  Globe,
  LayoutDashboard,
  Smartphone,
  Code2,
  GraduationCap,
  Building2,
  Server,
  Wrench,
  Check,
  Zap,
  ChevronRight,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  services,
  solutions,
  projects,
  technologyCategories,
  differentiators,
  faqs,
  pricingTiers,
} from '@/lib/data';
import type { LucideIcon } from 'lucide-react';
import FAQItem from '@/components/ui/FAQItem';
import HeroVisual from '@/components/ui/HeroVisual';
import ServicesList from '@/components/ui/ServicesList';
import ProcessTimeline from '@/components/ui/ProcessTimeline';
import ProjectCard from '@/components/ui/ProjectCard';

const iconMap: Record<string, LucideIcon> = {
  Globe,
  LayoutDashboard,
  Smartphone,
  Code2,
  GraduationCap,
  Building2,
  Server,
  Wrench,
  Target,
  Puzzle,
  Eye,
  TrendingUp,
  Headphones,
};

export default function HomePage() {
  const featuredProject = projects.find((p) => p.slug === 'roshani-public-school') || projects[0];
  const secondaryProjects = projects.filter((p) => p.slug !== featuredProject.slug);

  return (
    <div className="bg-[#090d16] text-slate-100 overflow-hidden">
      {/* ─── 1. HERO SECTION ───────────────────────────────────── */}
      <section className="relative pt-12 sm:pt-20 pb-20 md:pb-32 bg-tech-grid border-b border-white/[0.08]">
        {/* Subtle Glow Overlay */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial-gradient pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span>INDEPENDENT DIGITAL PRODUCT STUDIO</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-6xl lg:text-[4.25rem] font-extrabold text-white tracking-tight leading-[1.08]">
                We turn ideas into <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-white">
                  digital products.
                </span>
              </h1>

              {/* Supporting Text */}
              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                Ekaagra Technologies designs and develops websites, applications, custom software and scalable digital systems built around real business needs.
              </p>

              {/* CTAs */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link
                  href="/get-quote"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-xl shadow-blue-950/80 hover:shadow-blue-600/30 active:scale-[0.98]"
                >
                  <span>Start a Project</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
                >
                  <span>Explore Our Work</span>
                </Link>
              </div>

              {/* Micro specs */}
              <div className="pt-8 border-t border-white/[0.08] grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Positioning</span>
                  <span className="text-xs font-bold text-slate-300 block mt-0.5">Web • Mobile • Software</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Solutions</span>
                  <span className="text-xs font-bold text-slate-300 block mt-0.5">ERP &amp; Custom Apps</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Standards</span>
                  <span className="text-xs font-bold text-slate-300 block mt-0.5">Production Grade</span>
                </div>
              </div>
            </div>

            {/* Right Signature Visual Workspace */}
            <div className="lg:col-span-5">
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST STRIP ────────────────────────────────────── */}
      <section className="bg-[#060911] border-b border-white/[0.08] py-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-8 min-w-[600px] text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>CUSTOM BUILT</span>
            </div>
            <span className="text-white/10">•</span>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>MODERN STACK</span>
            </div>
            <span className="text-white/10">•</span>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>SCALABLE ARCHITECTURE</span>
            </div>
            <span className="text-white/10">•</span>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>LONG-TERM SUPPORT</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. INTRODUCTION SECTION ────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] relative bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Left Statement */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                Technology Built Around Your Needs
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Technology should solve a problem, not create another one.
              </h2>
            </div>

            {/* Right Explanation & Process Micro List */}
            <div className="lg:col-span-6 space-y-8 lg:pl-6 border-l border-white/10 lg:border-l">
              <p className="text-base text-slate-400 leading-relaxed">
                Off-the-shelf templates and generic scripts force business workflows into rigid boxes. At Ekaagra Technologies, we analyze your exact operational requirements first, then design software built around how your business actually functions.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                {[
                  { num: '01', label: 'Understand', desc: 'Identify core operational requirements.' },
                  { num: '02', label: 'Design', desc: 'Architect tailored UI/UX and workflows.' },
                  { num: '03', label: 'Build', desc: 'Develop clean, scalable code.' },
                  { num: '04', label: 'Improve', desc: 'Continuous updates & maintenance.' },
                ].map((item) => (
                  <div key={item.num} className="bg-[#0e1320] p-4 rounded-xl border border-white/5 space-y-1">
                    <span className="text-xs font-mono font-bold text-blue-400">{item.num} — {item.label}</span>
                    <p className="text-xs text-slate-400 leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SERVICES REDESIGN ──────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                Capabilities &amp; Services
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                What We Build
              </h2>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              High-impact software engineering for schools, enterprises, startups, and local growing businesses.
            </p>
          </div>

          {/* Numbered Editorial Services List Component */}
          <ServicesList />
        </div>
      </section>

      {/* ─── 5. FEATURED SOLUTIONS ──────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              End-to-End Products
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Featured Solutions
            </h2>
            <p className="text-base text-slate-400">
              Purpose-built systems designed for complex operational requirements.
            </p>
          </div>

          {/* Large Solution Panels */}
          <div className="space-y-12">
            {/* Solution 1: School ERP */}
            <div className="bg-[#0e1320] border border-white/10 rounded-2xl p-8 lg:p-12 grid lg:grid-cols-12 gap-8 items-center relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  INSTITUTIONAL PLATFORM
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  School ERP &amp; Management System
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Complete digital administration for K-12 schools, coaching academies, and colleges. Automate student admissions, daily attendance, fee collection receipts, exam scorecards, and parent notices.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    'Admissions & Records',
                    'Attendance Tracking',
                    'Fee Receipts & Ledger',
                    'Exam & Result Portals',
                    'Notice Board & Circulars',
                    'Parent & Staff Access',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/services/school-erp"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300"
                  >
                    <span>Explore School ERP Solution</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Mock Dashboard Preview Visual */}
              <div className="lg:col-span-6 bg-[#080b13] border border-white/10 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-white font-bold font-sans text-sm">School ERP Admin Console</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Active Session</span>
                </div>
                <div className="grid grid-cols-3 gap-2 py-2">
                  <div className="bg-[#101726] p-2.5 rounded border border-white/5">
                    <span className="text-[9px] text-slate-400 block">Total Students</span>
                    <span className="text-base font-bold text-white block mt-0.5">1,248</span>
                  </div>
                  <div className="bg-[#101726] p-2.5 rounded border border-white/5">
                    <span className="text-[9px] text-slate-400 block">Today's Attendance</span>
                    <span className="text-base font-bold text-emerald-400 block mt-0.5">96.4%</span>
                  </div>
                  <div className="bg-[#101726] p-2.5 rounded border border-white/5">
                    <span className="text-[9px] text-slate-400 block">Fee Collection</span>
                    <span className="text-base font-bold text-blue-400 block mt-0.5">₹4.2 Lakh</span>
                  </div>
                </div>
                <div className="bg-[#0e1320] p-3 rounded border border-white/5 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Recent Activity</span>
                    <span className="text-blue-400">Just Now</span>
                  </div>
                  <div className="text-slate-300 font-sans text-xs">
                    ✓ Grade 10 Exam Scorecards published to Parent Portal
                  </div>
                </div>
              </div>
            </div>

            {/* Solution 2: Business Management */}
            <div className="bg-[#0e1320] border border-white/10 rounded-2xl p-8 lg:p-12 grid lg:grid-cols-12 gap-8 items-center relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
              <div className="lg:col-span-6 lg:order-2 space-y-6">
                <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  ENTERPRISE OPERATIONS
                </span>
                <h3 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Business &amp; Operations Software
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Streamline internal workflows, inventory tracking, client billing, CRM, and automated reporting into a single intuitive business platform.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    'Inventory & Stock Tracking',
                    'Automated Billing System',
                    'Customer CRM Records',
                    'Role-Based Staff Access',
                    'Financial Reports & Export',
                    'Cloud Backup & Security',
                  ].map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                      <Check className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    href="/services/business-solutions"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300"
                  >
                    <span>Explore Business Solutions</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Visual mockup */}
              <div className="lg:col-span-6 lg:order-1 bg-[#080b13] border border-white/10 rounded-xl p-5 font-mono text-xs text-slate-300 space-y-3 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-white font-bold font-sans text-sm">Business Operations Hub</span>
                  <span className="text-[10px] text-blue-400 font-mono">v3.2 Secure API</span>
                </div>
                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between bg-[#101726] p-2.5 rounded text-xs">
                    <span className="text-slate-300">Monthly Invoices Generated</span>
                    <span className="font-bold text-white">412 Invoices</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#101726] p-2.5 rounded text-xs">
                    <span className="text-slate-300">Inventory Stock Status</span>
                    <span className="font-bold text-emerald-400">Optimal (98.2%)</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#101726] p-2.5 rounded text-xs">
                    <span className="text-slate-300">System Integration Sync</span>
                    <span className="font-bold text-blue-400">PostgreSQL Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. PORTFOLIO SHOWCASE ─────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#090d16]" id="projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
                Portfolio &amp; Showcase
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Selected Work
              </h2>
              <p className="text-sm text-slate-400">
                Real products built around practical business and institutional goals.
              </p>
            </div>
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300"
            >
              <span>View All Projects</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Featured Major Project: Roshani Public School */}
          <div className="bg-[#0e1320] border border-white/10 rounded-2xl overflow-hidden shadow-2xl grid lg:grid-cols-12 group hover:border-blue-500/50 transition-all duration-300">
            <div className="lg:col-span-7 relative h-72 lg:h-auto bg-[#070a12] border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden">
              <Image
                src={featuredProject.image || '/images/projects/roshani-public-school/roshani-2.png'}
                alt={featuredProject.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
              />
              <div className="absolute top-4 left-4 bg-[#090d16]/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                FEATURED PROJECT
              </div>
            </div>

            <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  Education • Web Platform
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {featuredProject.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {featuredProject.description}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {featuredProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-mono font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] px-2.5 py-1 rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                {featuredProject.liveUrl ? (
                  <a
                    href={featuredProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    <span>Go to Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <Link
                    href={`/projects/${featuredProject.slug}`}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors uppercase tracking-wider"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                <Link
                  href={`/projects/${featuredProject.slug}`}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Secondary Projects Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {secondaryProjects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. TECHNOLOGY SECTION ─────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Tech Stack Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Built With Modern Technology
            </h2>
            <p className="text-base text-slate-400">
              Industry-standard languages, frameworks, and database engines.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {technologyCategories.map((cat) => (
              <div key={cat.key} className="bg-[#0e1320] border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-2">
                  {cat.name}
                </h3>
                <div className="space-y-2">
                  {cat.technologies.map((t) => (
                    <div
                      key={t.name}
                      className="bg-[#080b13] border border-white/5 rounded-lg px-3.5 py-2 text-xs font-mono font-medium text-slate-300 flex items-center justify-between"
                    >
                      <span>{t.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. PROCESS REDESIGN ───────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#090d16]" id="process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Execution Methodology
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              From Idea to Launch
            </h2>
            <p className="text-base text-slate-400">
              A transparent, predictable process focused on delivery and long-term stability.
            </p>
          </div>

          {/* Process Timeline Component */}
          <ProcessTimeline />
        </div>
      </section>

      {/* ─── 9. PHILOSOPHY SECTION ─────────────────────────────── */}
      <section className="py-28 sm:py-36 border-b border-white/[0.08] bg-[#060911] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
            STUDIO CREED
          </span>

          <h2 className="text-3xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Think clearly. <br />
            Design intentionally. <br />
            <span className="text-blue-500">Build relentlessly.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            We don&apos;t stop at an idea. We keep refining until the solution works for the real people who use it every single day.
          </p>
        </div>
      </section>

      {/* ─── 10. WHY RSM ───────────────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#090d16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Value Proposition
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight uppercase">
              WHY CLIENTS WORK WITH US
            </h2>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {differentiators.map((item, idx) => (
              <div
                key={item.title}
                className="py-8 grid md:grid-cols-12 gap-6 items-start hover:bg-white/[0.02] transition-colors px-4 rounded-lg"
              >
                <div className="md:col-span-4 flex items-center gap-4">
                  <span className="text-xs font-mono font-bold text-blue-400">0{idx + 1}</span>
                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                </div>
                <div className="md:col-span-8">
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 11. PRICING REDESIGN ──────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#0b0f19]" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Transparent Pricing Structure
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Investment &amp; Rates
            </h2>
            <p className="text-base text-slate-400">
              Clear, transparent pricing based on scope, feature set, and support requirements.
            </p>
          </div>

          {/* Clean Pricing Rows */}
          <div className="divide-y divide-white/10 border-t border-b border-white/10 bg-[#0e1320] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            {pricingTiers.map((tier) => (
              <div
                key={tier.title}
                className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] transition-colors"
              >
                <div className="space-y-1.5 md:max-w-xl">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{tier.title}</h3>
                    {tier.badge && (
                      <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        {tier.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tier.scopeAlignment || tier.description}
                  </p>
                </div>

                <div className="flex items-center gap-6 justify-between md:justify-end shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Starting From</span>
                    <span className="text-xl font-mono font-bold text-white block">{tier.startingFrom}</span>
                  </div>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors shadow-md shadow-blue-900/40"
                  >
                    <span>View Tier Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>


          <p className="text-center text-xs font-mono text-slate-500 tracking-wider">
            Note: Final pricing depends on exact scope, complexity, third-party integrations, and ongoing support requirements.
          </p>
        </div>
      </section>

      {/* ─── 12. FAQ SECTION ───────────────────────────────────── */}
      <section className="py-24 sm:py-32 border-b border-white/[0.08] bg-[#090d16]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3 pt-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 13. FINAL CONTACT CTA ─────────────────────────────── */}
      <section className="py-28 sm:py-36 bg-[#060911] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
            START YOUR JOURNEY
          </span>

          <h2 className="text-3xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Have an idea worth building?
          </h2>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Tell us what you&apos;re trying to achieve. We&apos;ll help turn the requirement into a practical digital solution.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all duration-200 shadow-2xl shadow-blue-900/80"
            >
              <span>Start a Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-semibold text-xs tracking-wider uppercase rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              <span>View Our Work</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

