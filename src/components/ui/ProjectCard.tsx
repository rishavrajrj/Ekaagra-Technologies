import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className = '' }: ProjectCardProps) {
  const initials = project.title.substring(0, 2).toUpperCase();

  return (
    <div className={`group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0e1320] transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-950/50 ${className}`}>
      {/* Browser Window Frame Header */}
      <div className="bg-[#090d16] px-4 py-2.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 inline-block"></span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]">
          {project.slug}.app
        </span>
        <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
          {project.category}
        </span>
      </div>

      {/* Image Preview Container */}
      <div className="relative flex h-52 w-full items-center justify-center bg-[#070a12] overflow-hidden border-b border-white/[0.06]">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-3xl font-mono font-bold text-slate-700">{initials}</span>
            <span className="text-xs font-mono text-slate-600">EKAAGRA STUDIO</span>
          </div>
        )}

        {/* Hover overlay badge */}
        <div className="absolute inset-0 bg-blue-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-[2px]">
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span>Go to Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <Link 
              href={`/projects/${project.slug}`}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {project.title}
          </h3>
        </div>

        <p className="mb-4 flex-1 text-xs text-slate-400 leading-relaxed line-clamp-3">
          {project.description}
        </p>

        {/* Tech tags */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono font-medium bg-white/[0.04] text-slate-300 border border-white/[0.08] px-2.5 py-1 rounded"
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span className="text-[10px] font-mono text-slate-500 self-center">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.08] text-xs font-semibold uppercase tracking-wider">
          <Link 
            href={`/projects/${project.slug}`}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Go to Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;


