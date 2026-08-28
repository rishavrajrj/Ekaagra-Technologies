'use client';

import { useState, useEffect } from 'react';
import { projects } from '@/lib/data';
import LiveWebsitePreview from './LiveWebsitePreview';
import { useShowcase } from '@/components/showcase/ShowcaseProvider';

const PROJECT_DURATION = 5000;

export default function HeroVisual() {
  // Use first 4 projects from centralized data
  const previewProjects = projects.slice(0, 4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Connect to Showcase state if active
  let isOpen = false;
  let isShowcasePaused = false;
  let currentStepIndex = 0;

  try {
    const showcase = useShowcase();
    isOpen = showcase.isOpen;
    isShowcasePaused = showcase.isPaused;
    currentStepIndex = showcase.currentStepIndex;
  } catch {
    // Graceful fallback if rendered outside ShowcaseProvider
  }

  // Reset to project 0 whenever Showcase mode opens or enters Step 0 (Hero)
  useEffect(() => {
    if (isOpen && currentStepIndex === 0) {
      setCurrentIndex(0);
    }
  }, [isOpen, currentStepIndex]);

  const effectivePaused = isHovered || (isOpen && isShowcasePaused);

  // Automatically cycle through projects 1 to 4 every 5 seconds
  useEffect(() => {
    if (effectivePaused || previewProjects.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % previewProjects.length);
    }, PROJECT_DURATION);

    return () => clearInterval(timer);
  }, [effectivePaused, previewProjects.length, currentIndex]);

  const activeProject = previewProjects[currentIndex] || previewProjects[0];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full max-w-2xl lg:max-w-none mx-auto space-y-3.5"
    >
      {/* Ambient background glows */}
      <div className="absolute -top-12 -left-12 w-56 h-56 bg-[#F97360]/20 rounded-full blur-3xl pointer-events-none animate-aurora-glow" />
      <div className="absolute -bottom-12 -right-12 w-56 h-56 bg-[#4338CA]/20 rounded-full blur-3xl pointer-events-none animate-aurora-glow [animation-delay:2s]" />

      {/* --- Compact Project Preview Selector Bar with Auto-Cycle -- */}
      <div
        role="tablist"
        aria-label="Interactive Website Previews"
        className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2E8F0] shadow-md flex items-center justify-between gap-1 overflow-x-auto relative z-20"
      >
        {previewProjects.map((proj, index) => {
          const isActive = index === currentIndex;
          const num = String(index + 1).padStart(2, '0');
          return (
            <button
              key={proj.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`preview-panel-${proj.slug}`}
              onClick={() => {
                setCurrentIndex(index);
              }}
              className={`flex-1 min-w-[72px] xs:min-w-[85px] sm:min-w-[100px] py-1.5 sm:py-2 px-2 sm:px-3 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer relative overflow-hidden ${
                isActive
                  ? 'bg-[#4338CA] text-white shadow-md shadow-[#4338CA]/20 scale-[1.02]'
                  : 'text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2]'
              }`}
            >
              <span
                className={`font-mono text-[8.5px] sm:text-[9px] ${
                  isActive ? 'text-[#F4C95D]' : 'text-[#64748B]'
                }`}
              >
                {num}
              </span>
              <span className="truncate">{proj.shortLabel || proj.title}</span>

              {/* Subtle animated timer bar on the active tab when not paused */}
              {isActive && !effectivePaused && (
                <span
                  key={`${currentIndex}-${effectivePaused}`}
                  className="absolute bottom-0 left-0 h-[2px] bg-[#F4C95D] rounded-full animate-progress"
                  style={{
                    animation: `growWidth ${PROJECT_DURATION}ms linear forwards`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* --- Main Live Browser Preview Window ----------------------- */}
      <div className="relative z-10 w-full min-w-0" id={`preview-panel-${activeProject.slug}`}>
        <LiveWebsitePreview
          key={activeProject.slug}
          url={activeProject.liveUrl}
          title={activeProject.title}
          fallbackImage={activeProject.image}
          autoLoad={true}
          showDeviceControls={true}
          heightClass="h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] lg:h-[440px]"
          isFeatured={true}
          isFrameRestricted={activeProject.isFrameRestricted}
          className="shadow-2xl hover:border-[#4338CA]/40"
        />
      </div>

      {/* Keyframe animation styling for the tab progress indicator */}
      <style jsx>{`
        @keyframes growWidth {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
