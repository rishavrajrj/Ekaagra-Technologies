'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, ArrowRight, Play, Globe, RotateCw, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Project } from '@/lib/types';

interface ProjectCardProps {
  project: Project;
  className?: string;
  autoPlay?: boolean;
}

export function ProjectCard({ project, className = '' }: ProjectCardProps) {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const isValidUrl = Boolean(
    project.liveUrl &&
      (project.liveUrl.startsWith('https://') || project.liveUrl.startsWith('http://'))
  );

  const cleanDisplayUrl = isValidUrl
    ? project.liveUrl!.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : `${project.slug}.com`;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white transition-all duration-300 hover:border-[#4338CA]/40 hover:shadow-2xl hover:shadow-[#4338CA]/10 hover:-translate-y-1 ${className}`}
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
          {isValidUrl && isLiveActive ? (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview
            </span>
          ) : isValidUrl ? (
            <button
              type="button"
              onClick={() => setIsLiveActive(true)}
              aria-label={`Preview ${project.title} live website`}
              className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 hover:bg-[#4338CA] hover:text-white transition-colors px-2 py-0.5 rounded-full uppercase tracking-wider cursor-pointer flex items-center gap-1"
            >
              <Play className="w-2 h-2 fill-current" />
              Preview Live
            </button>
          ) : (
            <span className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {project.category}
            </span>
          )}
        </div>
      </div>

      {/* ─── Live Viewport / Screenshot Canvas ───────────────────── */}
      <div className="relative flex h-64 sm:h-72 w-full items-center justify-center bg-[#F3EFEA] overflow-hidden border-b border-[#E2E8F0]">
        {/* Live Interactive Iframe Mode */}
        {isValidUrl && isLiveActive && !loadError ? (
          <div className="w-full h-full relative bg-white">
            {!isIframeLoaded && (
              <div className="absolute inset-0 bg-[#FAF7F2] flex flex-col items-center justify-center gap-2 z-10">
                <Globe className="w-6 h-6 text-[#4338CA] animate-spin" />
                <span className="text-xs font-bold text-[#131B2E]">Connecting to {project.title}...</span>
              </div>
            )}

            <iframe
              src={project.liveUrl}
              title={`Live website preview of ${project.title}`}
              loading="lazy"
              onLoad={() => setIsIframeLoaded(true)}
              onError={() => {
                setLoadError(true);
                setIsLiveActive(false);
              }}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
            />
          </div>
        ) : (
          /* Static Image Mode with Quick Live Trigger */
          <div className="relative w-full h-full group/preview">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.title}
                fill
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
              {isValidUrl && (
                <button
                  type="button"
                  onClick={() => setIsLiveActive(true)}
                  className="bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Preview Live</span>
                </button>
              )}
              <Link
                href={`/projects/${project.slug}`}
                className="bg-white hover:bg-slate-100 text-[#131B2E] text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center gap-1.5 uppercase tracking-wider"
              >
                <span>Case Study</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
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
            <Link
              href={`/projects/${project.slug}`}
              className="text-[#4338CA] hover:text-[#3730A3] flex items-center gap-1.5 transition-colors"
            >
              <span>View Case Study</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {isValidUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#64748B] hover:text-[#131B2E] flex items-center gap-1 transition-colors"
              >
                <span>Open Live Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard;
