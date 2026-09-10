'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';

export default function ShowcaseProgress() {
  const { currentStepIndex, currentStep, isPaused, steps, isHudVisible } = useShowcase();

  return (
    <div
      data-showcase-control="true"
      className="fixed bottom-0 inset-x-0 z-[100000] pointer-events-none select-none flex flex-col items-center"
    >
      {/* ── Active Chapter Metadata Badge (Floating above progress bar) ── */}
      <div
        className={`mb-2.5 px-4 py-1.5 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-white shadow-2xl transition-all duration-500 flex items-center gap-2.5 ${
          isHudVisible || isPaused ? 'opacity-100 translate-y-0' : 'opacity-40 hover:opacity-100 translate-y-0.5'
        }`}
      >
        <span className="font-mono font-black text-[#F4C95D] text-xs">
          {currentStep.number} / {String(steps.length).padStart(2, '0')}
        </span>
        <span className="text-white/30">•</span>
        <span className="text-xs font-bold text-white tracking-wide">
          {currentStep.label}
        </span>
        <span className="text-white/40 hidden md:inline">—</span>
        <span className="text-xs text-white/75 font-normal hidden md:inline">
          {currentStep.subtitle}
        </span>
      </div>

      {/* Edge-to-edge full width bottom progress bar across entire page */}
      <div className="w-full bg-black/50 backdrop-blur-md h-1.5 sm:h-2 overflow-hidden shadow-[0_-2px_12px_rgba(0,0,0,0.4)] relative">
        <div
          key={`${currentStepIndex}`}
          className="h-full bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#F4C95D] shadow-[0_0_16px_rgba(249,115,96,0.95)] relative"
          style={{
            animationName: 'showcaseProgressFill',
            animationDuration: `${currentStep.duration}ms`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {/* Leading Comet Flare */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-[2px] shadow-[0_0_8px_#ffffff,0_0_16px_#F4C95D] opacity-95" />
        </div>
      </div>

      <style jsx>{`
        @keyframes showcaseProgressFill {
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
