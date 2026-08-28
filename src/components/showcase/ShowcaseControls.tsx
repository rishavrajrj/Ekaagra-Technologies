'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Tv,
} from 'lucide-react';

export default function ShowcaseControls() {
  const {
    closeShowcase,
    nextStep,
    prevStep,
    isPaused,
    togglePause,
    isHudVisible,
    currentStep,
    steps,
  } = useShowcase();

  return (
    <>
      {/* ── Top Bar Controls ────────────────────────────────────── */}
      <div
        data-showcase-control="true"
        className={`fixed top-0 inset-x-0 z-[100000] p-4 sm:p-6 flex items-center justify-between pointer-events-none select-none transition-opacity duration-500 ${
          isHudVisible || isPaused ? 'opacity-100' : 'opacity-30 hover:opacity-100'
        }`}
      >
        {/* Top-Left Live Indicator */}
        <div className="flex items-center gap-3 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full border border-white/20 text-white/95 shadow-2xl pointer-events-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97360] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F97360]"></span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#FAF7F2]">
              Ekaagra Live Showcase
            </span>
            <span className="text-white/30">•</span>
            <span className="flex items-center gap-1 text-[11px] text-[#F4C95D] font-mono font-bold">
              <Tv className="w-3.5 h-3.5" />
              Digital Advertisement
            </span>
          </div>
        </div>

        {/* Top-Right Exit & Media Controls */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Play/Pause Button */}
          <button
            type="button"
            data-showcase-control="true"
            onClick={(e) => {
              e.stopPropagation();
              togglePause();
            }}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-black/70 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl border border-white/20 transition-all flex items-center gap-2 text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={isPaused ? 'Resume tour' : 'Pause tour'}
            title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 text-[#F4C95D] fill-current" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 text-white/90" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </button>

          {/* Exit Showcase Button */}
          <button
            type="button"
            data-showcase-control="true"
            onClick={(e) => {
              e.stopPropagation();
              closeShowcase();
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-[#4338CA] to-[#F97360] hover:from-[#3730A3] hover:to-[#ea580c] text-white rounded-2xl border border-white/20 transition-all duration-200 flex items-center gap-2 text-xs font-bold shadow-2xl hover:scale-105 active:scale-95 cursor-pointer group"
            aria-label="Exit showcase mode"
            title="Exit Showcase (Esc or click anywhere)"
          >
            <span>Exit Showcase</span>
            <span className="text-[10px] font-mono opacity-70 group-hover:opacity-100 hidden md:inline">
              [ESC]
            </span>
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* ── Left / Right Floating Navigation Chevrons (Only if multiple steps) ── */}
      {steps.length > 1 && (
        <>
          <div
            data-showcase-control="true"
            className={`fixed inset-y-0 left-3 sm:left-6 z-[100000] flex items-center pointer-events-none transition-opacity duration-500 ${
              isHudVisible || isPaused ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
          >
            <button
              type="button"
              data-showcase-control="true"
              onClick={(e) => {
                e.stopPropagation();
                prevStep();
              }}
              className="pointer-events-auto p-3.5 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-xl text-white/90 hover:text-white border border-white/20 hover:border-white/40 shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous section"
              title="Previous Section (←)"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <div
            data-showcase-control="true"
            className={`fixed inset-y-0 right-3 sm:right-6 z-[100000] flex items-center pointer-events-none transition-opacity duration-500 ${
              isHudVisible || isPaused ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
          >
            <button
              type="button"
              data-showcase-control="true"
              onClick={(e) => {
                e.stopPropagation();
                nextStep();
              }}
              className="pointer-events-auto p-3.5 rounded-full bg-black/60 hover:bg-white/20 backdrop-blur-xl text-white/90 hover:text-white border border-white/20 hover:border-white/40 shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next section"
              title="Next Section (→)"
            >
              <ChevronRight className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </>
      )}
    </>
  );
}
