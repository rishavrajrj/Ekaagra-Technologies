import { projects } from '@/lib/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ExternalLink, ArrowUpRight } from 'lucide-react';
import ProjectGallery from '@/components/ui/ProjectGallery';

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

  return {
    title: `${project.title} | Ekaagra Technologies`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <article className="space-y-16">
        {/* Header Hero */}
        <header className="text-center space-y-6 border-b border-white/10 pb-12">
          <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase">
            CASE STUDY • {project.category}
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            {project.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {project.description}
          </p>

          {project.liveUrl && (
            <div className="pt-2">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg shadow-blue-950 transition-all"
              >
                <span>Visit Live Application</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </header>

        {/* Gallery / Screenshot Preview */}
        {project.images && project.images.length > 0 ? (
          <ProjectGallery images={project.images} title={project.title} />
        ) : (
          project.image && (
            <div className="w-full h-[360px] sm:h-[480px] bg-[#0e1320] rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl">
              <Image 
                src={project.image} 
                alt={project.title} 
                fill
                className="object-contain"
                priority
              />
            </div>
          )
        )}

        {/* Overview */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            PROJECT OVERVIEW
          </h2>
          <p className="text-base text-slate-300 leading-relaxed font-sans">
            {project.overview}
          </p>
        </section>

        {/* Problem vs Solution Split */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0e1320] p-8 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
              The Operational Problem
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {project.problem}
            </p>
          </div>
          <div className="bg-[#0e1320] p-8 rounded-2xl border border-blue-500/30 space-y-3">
            <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest">
              Our Technical Solution
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {project.solution}
            </p>
          </div>
        </section>

        {/* Features List */}
        <section className="space-y-6">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            DELIVERED FEATURES &amp; MODULES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 bg-[#0e1320] p-4.5 rounded-xl border border-white/10">
                <Check className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm text-slate-300 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="space-y-4">
          <h2 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3">
            TECHNOLOGY STACK
          </h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {project.technologies.map((tech, index) => (
              <span 
                key={index} 
                className="bg-[#0e1320] text-slate-300 px-4 py-2 rounded-lg text-xs font-mono font-medium border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        {/* Bottom Callout */}
        <section className="bg-[#060911] text-white p-10 sm:p-14 rounded-2xl text-center border border-white/10 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight">Need a Similar Solution?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Let us build a customized system tailored to your exact operational and business requirements.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold uppercase tracking-wider px-6 py-3.5 rounded-xl border border-white/15 transition-all"
              >
                <span>Live Website Preview</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-950"
            >
              <span>Start Your Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </article>
    </div>
  );
}

