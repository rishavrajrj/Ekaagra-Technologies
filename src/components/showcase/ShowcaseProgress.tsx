'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';

export default function ShowcaseProgress() {
  const { currentStepIndex, currentStep, isPaused } = useShowcase();

  return (
    <div
      data-showcase-control="true"
      className="fixed bottom-0 inset-x-0 z-[100000] pointer-events-none select-none"
    >
      {/* Edge-to-edge full width bottom progress bar across entire page */}
      <div className="w-full bg-black/40 backdrop-blur-sm h-1.5 sm:h-2 overflow-hidden shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <div
          key={`${currentStepIndex}`}
          className="h-full bg-gradient-to-r from-[#4338CA] via-[#F97360] to-[#F4C95D] shadow-[0_0_12px_rgba(249,115,96,0.9)]"
          style={{
            animationName: 'showcaseProgressFill',
            animationDuration: `${currentStep.duration}ms`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
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
