import type { Metadata } from 'next';
import Link from 'next/link';
import ProjectCard from '@/components/ui/ProjectCard';
import { projects } from '@/lib/data';
import { ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Projects | Ekaagra Technologies',
  description: 'Explore our portfolio of websites, web applications, and custom software systems built for clients.',
};

export default function ProjectsPage() {
  return (
    <div className="bg-[#090d16] text-slate-100 min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28 border-b border-white/[0.08] bg-tech-grid relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            PORTFOLIO &amp; CASE STUDIES
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Selected Projects
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Real products, custom websites, web platforms, and mobile software applications built around actual client requirements.
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-24 border-b border-white/[0.08] bg-[#0b0f19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#060911] text-center border-b border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Ready to Build Your Project?</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Let us collaborate to build a customized digital solution tailored to your exact business goals.
          </p>
          <div className="pt-2">
            <Link 
              href="/get-quote" 
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-950"
            >
              <span>Start Your Project</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

