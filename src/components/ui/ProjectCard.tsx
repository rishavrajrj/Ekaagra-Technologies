'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ArrowRight, Sparkles, CheckCircle2, Eye } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  className?: string;
  onSelect?: (slug: string) => void;
  isActive?: boolean;
}

export function ProjectCard({
  project,
  className = '',
  onSelect,
  isActive = false,
}: ProjectCardProps) {
  const isValidUrl = Boolean(
    project.liveUrl &&
      (project.liveUrl.startsWith('https://') || project.liveUrl.startsWith('http://'))
  );

  const cleanDisplayUrl = isValidUrl
    ? project.liveUrl!.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${project.slug}.com`;

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger select if not clicking on an anchor tag
    const target = e.target as HTMLElement;
    if (target.closest('a')) return;
    if (onSelect) {
      onSelect(project.slug);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 bg-white ${
        isActive
          ? 'border-2 border-[#4338CA] shadow-2xl shadow-[#4338CA]/15 ring-2 ring-[#4338CA]/20 scale-[1.01]'
          : 'border-[#E2E8F0] hover:border-[#4338CA]/40 hover:shadow-2xl hover:shadow-[#4338CA]/10 hover:-translate-y-1'
      } ${onSelect ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* ─── Browser Chrome Header ───────────────────────────────── */}
      <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F97360]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#F4C95D]" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>

        <span className="text-[11px] font-mono text-[#64748B] truncate max-w-[140px] sm:max-w-[180px]">
          {cleanDisplayUrl}
        </span>

        <div className="flex items-center gap-1.5">
          {isActive ? (
            <span className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA] animate-pulse" />
              Active Above
            </span>
          ) : (
            <span className="text-[10px] font-bold text-[#64748B] bg-[#FAF7F2] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {project.category}
            </span>
          )}
        </div>
      </div>

      {/* ─── Screenshot Preview Canvas ───────────────────────────── */}
      <div className="relative flex h-64 sm:h-72 w-full items-center justify-center bg-[#F3EFEA] overflow-hidden border-b border-[#E2E8F0]">
        <div className="relative w-full h-full group/preview">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-3xl font-mono font-bold text-slate-400">
                {project.title.substring(0, 2).toUpperCase()}
              </span>
              <span className="text-xs font-mono text-slate-400">EKAAGRA DESIGN</span>
            </div>
          )}

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-[#131B2E]/60 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2.5 backdrop-blur-[2px] p-4">
            {onSelect && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(project.slug);
                }}
                className="bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Above ↑</span>
              </button>
            )}
            <Link
              href={`/projects/${project.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="bg-white hover:bg-slate-100 text-[#131B2E] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span>Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Project Information Content ─────────────────────────── */}
      <div className="flex flex-1 flex-col p-6 sm:p-7 justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#F97360] uppercase tracking-widest block">
              {project.category}
            </span>
            {isValidUrl && (
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Website
              </span>
            )}
          </div>

          <h3 className="text-xl font-extrabold text-[#131B2E] group-hover:text-[#4338CA] transition-colors">
            {project.title}
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-3">
            {project.description}
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {/* Tech tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-[10px] font-semibold bg-[#FAF7F2] text-[#475569] border border-[#E2E8F0] px-2.5 py-1 rounded-lg"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="text-[10px] font-semibold text-[#64748B] self-center">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E2E8F0] text-xs font-bold uppercase tracking-wider">
            {onSelect ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(project.slug);
                }}
                className="text-[#4338CA] hover:text-[#3730A3] flex items-center gap-1.5 transition-colors font-bold uppercase cursor-pointer"
              >
                <span>View Above ↑</span>
              </button>
            ) : (
              <Link
                href={`/projects/${project.slug}`}
                className="text-[#4338CA] hover:text-[#3730A3] flex items-center gap-1.5 transition-colors"
              >
                <span>Case Study</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}

            <Link
              href={`/projects/${project.slug}`}
              className="text-[#64748B] hover:text-[#131B2E] flex items-center gap-1 transition-colors"
            >
              <span>Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
