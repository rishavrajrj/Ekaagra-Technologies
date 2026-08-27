'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Project } from '@/lib/types';
import LiveWebsitePreview from './LiveWebsitePreview';
import ProjectCard from './ProjectCard';

interface FeaturedProjectCarouselProps {
  projects: Project[];
  gridProjects?: Project[];
  gridTitle?: string;
  gridSubtitle?: string;
}

export default function FeaturedProjectCarousel({
  projects,
  gridProjects,
  gridTitle,
  gridSubtitle,
}: FeaturedProjectCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!projects || projects.length === 0) return null;

  const currentProject = projects[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? projects.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === projects.length - 1 ? 0 : prev + 1));
  };

  const handleSelectProject = (slug: string) => {
    const idx = projects.findIndex((p) => p.slug === slug);
    if (idx !== -1) {
      setCurrentIndex(idx);
      // Smooth scroll to top of showcase
      containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const cardsToRender = gridProjects || projects;

  return (
    <div ref={containerRef} className="space-y-12 scroll-mt-24">
      {/* ─── 1. Top Featured Showcase Container ──────────────────── */}
      <div className="space-y-6 relative">
        {/* Top Project Status & Jump Pills */}
        <div className="flex items-center justify-between gap-4 bg-white/80 backdrop-blur-sm border border-[#E2E8F0] px-4 py-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-3 py-1 rounded-full uppercase tracking-wider">
              PROJECT {String(currentIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            </span>
            <span className="text-xs font-extrabold text-[#131B2E] truncate max-w-[180px] sm:max-w-md">
              {currentProject.title}
            </span>
          </div>

          {/* Quick jump indicator pills */}
          <div className="flex items-center gap-1.5">
            {projects.map((p, i) => (
              <button
                key={p.slug}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                  i === currentIndex
                    ? 'w-7 bg-[#4338CA] shadow-sm'
                    : 'w-2.5 bg-[#CBD5E1] hover:bg-[#94A3B8]'
                }`}
                title={`Switch to ${p.title}`}
                aria-label={`View project ${p.title}`}
              />
            ))}
          </div>
        </div>

        {/* Main Showcase Wrapper with Left & Right Center Floating Navigation Arrows */}
        <div className="relative group/carousel">
          {/* Left Center Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous project"
            title="Previous Project"
            className="absolute -left-3 sm:-left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white text-[#131B2E] hover:text-[#4338CA] border-2 border-[#E2E8F0] hover:border-[#4338CA] shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Right Center Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next project"
            title="Next Project"
            className="absolute -right-3 sm:-right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white text-[#131B2E] hover:text-[#4338CA] border-2 border-[#E2E8F0] hover:border-[#4338CA] shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <ChevronRight className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Main Featured Container Card with Compact Equal Height Columns */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-2xl grid lg:grid-cols-12 group hover:border-[#4338CA]/40 transition-all duration-300 items-stretch">
            {/* Left Interactive Live Preview Simulator */}
            <div className="lg:col-span-7 bg-[#F3EFEA] border-b lg:border-b-0 lg:border-r border-[#E2E8F0] p-2.5 sm:p-3.5 flex flex-col h-full justify-stretch">
              <LiveWebsitePreview
                key={currentProject.slug}
                url={currentProject.liveUrl}
                title={currentProject.title}
                fallbackImage={currentProject.image || '/images/projects/roshani-public-school/roshani-2.png'}
                showDeviceControls={true}
                autoLoad={false}
                heightClass="h-[320px] sm:h-[380px] lg:h-[430px]"
                isFeatured={true}
                isFrameRestricted={currentProject.isFrameRestricted}
              />
            </div>

            {/* Right Project Details */}
            <div className="lg:col-span-5 p-5 sm:p-6 lg:p-7 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                    {currentProject.category || 'Featured Platform'}
                  </span>
                  <span className="text-[10px] font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {currentProject.badge || 'SPOTLIGHT'}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#131B2E] tracking-tight">
                  {currentProject.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed line-clamp-2">
                  {currentProject.description}
                </p>

                {/* Problem vs Solution Summary */}
                {(currentProject.problem || currentProject.solution) && (
                  <div className="space-y-1 pt-1 border-t border-[#E2E8F0] text-[11px] sm:text-xs">
                    {currentProject.problem && (
                      <div className="line-clamp-2">
                        <span className="font-bold text-[#131B2E]">The Challenge: </span>
                        <span className="text-[#64748B]">{currentProject.problem}</span>
                      </div>
                    )}
                    {currentProject.solution && (
                      <div className="line-clamp-2">
                        <span className="font-bold text-emerald-700">The Solution: </span>
                        <span className="text-[#64748B]">{currentProject.solution}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Key Deliverables */}
                <div className="space-y-1.5 pt-1">
                  {currentProject.features.slice(0, 3).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#334155] font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {currentProject.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] font-semibold bg-[#FAF7F2] text-[#475569] border border-[#E2E8F0] px-2 py-0.5 rounded-md"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action CTAs */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                {currentProject.liveUrl ? (
                  <a
                    href={currentProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#4338CA]/25 uppercase tracking-wider"
                  >
                    <span>Visit Live Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs font-semibold text-[#64748B] bg-[#FAF7F2] px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                    Case Study Project
                  </span>
                )}

                <Link
                  href={`/projects/${currentProject.slug}`}
                  className="text-xs font-bold text-[#475569] hover:text-[#4338CA] flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Interactive Projects Grid (Click to view above) ───── */}
      <div className="space-y-6 pt-4">
        {(gridTitle || gridSubtitle) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest">
              {gridTitle || 'Interactive Showroom • Click any card to load in showcase above'}
            </div>
            {gridSubtitle && (
              <div className="text-xs text-[#64748B] font-medium">
                {gridSubtitle}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cardsToRender.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              onSelect={handleSelectProject}
              isActive={currentProject.slug === project.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
