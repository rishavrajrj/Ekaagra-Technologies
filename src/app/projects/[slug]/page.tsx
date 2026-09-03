import { projects } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ExternalLink, ArrowRight, Sparkles, Globe, Play } from 'lucide-react';
import ProjectGallery from '@/components/ui/ProjectGallery';
import LiveWebsitePreview from '@/components/ui/LiveWebsitePreview';
import { createPageMetadata, webPageSchema, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);
  
  if (!project) return { title: 'Project Not Found | Ekaagra Technologies' };

  return createPageMetadata({
    title: `${project.title} — Case Study | Ekaagra Technologies`,
    description: `${project.description} Delivered by Ekaagra Technologies for clients in Bihar and across India.`,
    path: `/projects/${slug}`,
    ogImage: project.image ? `${SITE_URL}${project.image}` : undefined,
  });
}

const projectServiceLinks: Record<string, Array<{ label: string; href: string }>> = {
  'roshani-public-school': [
    { label: 'School Website Development in Motihari', href: '/school-website-development-motihari' },
    { label: 'Website Development Services', href: '/services/website-development' },
    { label: 'School ERP Upgrade Options', href: '/school-erp-motihari' },
  ],
  'roshani-public-school-erp': [
    { label: 'School ERP Systems in Motihari', href: '/school-erp-motihari' },
    { label: 'School Website Development', href: '/school-website-development-motihari' },
    { label: 'School ERP vs Website Comparison', href: '/blog/school-erp-vs-school-website' },
  ],
  'palak-enterprises': [
    { label: 'Web Application Development in Motihari', href: '/web-application-development-motihari' },
    { label: 'Web Application Services', href: '/services/web-application-development' },
    { label: 'Custom Software Development', href: '/software-development-motihari' },
  ],
  'sparknest-academy': [
    { label: 'Web Application Development in Motihari', href: '/web-application-development-motihari' },
    { label: 'Web Application Services', href: '/services/web-application-development' },
  ],
  'bankgeu': [
    { label: 'Custom Software Development in Motihari', href: '/software-development-motihari' },
    { label: 'Custom Software Services', href: '/services/custom-software' },
  ],
  'gameverse': [
    { label: 'Custom Software Development in Motihari', href: '/software-development-motihari' },
    { label: 'Custom Software Services', href: '/services/custom-software' },
  ],
};

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  const isValidUrl = Boolean(
    project.liveUrl &&
      (project.liveUrl.startsWith('https://') || project.liveUrl.startsWith('http://'))
  );

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: `${project.title} — Case Study`,
              description: project.description,
              url: `${SITE_URL}/projects/${slug}`,
            })
          ),
        }}
      />
      <div className="pb-8">
        <Breadcrumbs
          items={[
            { label: 'Our Work', href: '/projects' },
            { label: project.title },
          ]}
        />
      </div>

      <article className="space-y-16">
        {/* Header Hero */}
        <header className="text-center space-y-6 border-b border-[#E2E8F0] pb-12">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 rounded-full text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
            CASE STUDY • {project.category}
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-[#131B2E] tracking-tight">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-[#64748B] max-w-3xl mx-auto leading-relaxed">
            {project.description}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {isValidUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-sm transition-all"
              >
                <span>Open Live Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <Link
              href="/get-quote"
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-xl shadow-[#4338CA]/25 transition-all"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Live Website Interactive Preview Showcase */}
        {isValidUrl ? (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                LIVE INTERACTIVE APPLICATION
              </span>
              <span className="text-xs text-[#64748B] font-mono">
                Experience the live system below
              </span>
            </div>

            <LiveWebsitePreview
              url={project.liveUrl}
              title={project.title}
              fallbackImage={project.image}
              autoLoad={true}
              showDeviceControls={true}
              heightClass="h-[440px] sm:h-[560px] md:h-[620px]"
              isFeatured={true}
              isFrameRestricted={project.isFrameRestricted}
            />
          </section>
        ) : (
          /* Static Image or Gallery if no live URL (e.g. desktop apps) */
          project.images && project.images.length > 0 ? (
            <ProjectGallery images={project.images} title={project.title} />
          ) : (
            project.image && (
              <div className="w-full h-[360px] sm:h-[480px] bg-[#F3EFEA] rounded-3xl overflow-hidden relative border border-[#E2E8F0] shadow-2xl">
                <Image 
                  src={project.image} 
                  alt={project.title} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 1000px"
                  className="object-contain"
                  priority
                />
              </div>
            )
          )
        )}

        {/* Additional Screenshot Gallery (if multi-image project) */}
        {isValidUrl && project.images && project.images.length > 1 && (
          <section className="space-y-4 pt-6 border-t border-[#E2E8F0]">
            <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest block">
              SCREENSHOT ARCHIVE
            </span>
            <ProjectGallery images={project.images} title={project.title} />
          </section>
        )}

        {/* Overview */}
        <section className="space-y-4 bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
            PROJECT OVERVIEW
          </span>
          <h2 className="text-2xl font-extrabold text-[#131B2E]">
            Background &amp; Objectives
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed font-sans">
            {project.overview}
          </p>
        </section>

        {/* Problem vs Solution Split */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-red-200 shadow-md space-y-3">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest block">
              The Operational Problem
            </span>
            <p className="text-sm text-[#64748B] leading-relaxed">
              {project.problem}
            </p>
          </div>
          <div className="bg-white p-8 rounded-3xl border-2 border-[#4338CA] shadow-md space-y-3">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              Our Technical Solution
            </span>
            <p className="text-sm text-[#334155] leading-relaxed font-medium">
              {project.solution}
            </p>
          </div>
        </section>

        {/* Architectural Approach & Outcome */}
        {(project.approach || project.outcome) && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.approach && (
              <div className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-3">
                <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
                  Why This Technical Approach
                </span>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {project.approach}
                </p>
              </div>
            )}
            {project.outcome && (
              <div className="bg-white p-8 rounded-3xl border border-emerald-200 shadow-sm space-y-3">
                <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-widest block">
                  Verified Project Outcome
                </span>
                <p className="text-sm text-[#334155] leading-relaxed font-medium">
                  {project.outcome}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Features List */}
        <section className="space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-sm">
          <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
            KEY DELIVERABLES
          </span>
          <h2 className="text-2xl font-extrabold text-[#131B2E]">
            Delivered Modules &amp; Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {project.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E2E8F0]">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-[#334155] font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="space-y-4">
          <span className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest block">
            TECHNOLOGY STACK
          </span>
          <div className="flex flex-wrap gap-2 pt-1">
            {project.technologies.map((tech, index) => (
              <span 
                key={index} 
                className="bg-white text-[#334155] px-4 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Related Service Capabilities (Internal Linking) */}
        {projectServiceLinks[project.slug] && (
          <section className="bg-white p-8 rounded-3xl border border-[#E2E8F0] space-y-4 shadow-sm">
            <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
              DEMONSTRATED CAPABILITIES &amp; SERVICES
            </span>
            <h3 className="text-lg font-bold text-[#131B2E]">
              Explore the Technology &amp; Services Behind This Project
            </h3>
            <div className="flex flex-wrap gap-2.5 pt-1">
              {projectServiceLinks[project.slug].map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FAF7F2] hover:bg-[#F1ECE4] text-[#131B2E] text-xs font-bold rounded-xl border border-[#E2E8F0] transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#4338CA]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Callout */}
        <section className="bg-gradient-to-b from-[#FAF7F2] to-[#F1ECE4] p-10 sm:p-14 rounded-3xl text-center border border-[#E2E8F0] space-y-6">
          <h2 className="text-3xl font-extrabold text-[#131B2E] tracking-tight">Need a Similar Solution?</h2>
          <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Let us build a customized digital solution tailored to your exact business and audience requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {isValidUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#131B2E] text-xs font-bold uppercase tracking-wider px-7 py-4 rounded-xl border border-[#E2E8F0] transition-all"
              >
                <span>Open Live Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all shadow-xl shadow-[#4338CA]/25"
            >
              <span>Build My Website</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}
