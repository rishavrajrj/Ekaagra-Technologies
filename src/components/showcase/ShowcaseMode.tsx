'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';
import ShowcaseProgress from './ShowcaseProgress';
import { X } from 'lucide-react';

export default function ShowcaseMode() {
  const { isOpen, closeShowcase } = useShowcase();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ekaagra Technologies Cinematic Website Showcase"
      className="fixed inset-0 z-[99999] pointer-events-none select-none"
    >
      {/* ── Discreet Floating Exit Button (Top Right) ─────────────── */}
      <button
        type="button"
        onClick={closeShowcase}
        data-showcase-control="true"
        aria-label="Exit Showcase Mode"
        title="Exit Showcase Mode (Esc)"
        className="pointer-events-auto absolute top-4 right-4 sm:top-6 sm:right-6 z-[100000] inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/60 hover:bg-black/85 active:bg-black backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 shadow-xl cursor-pointer hover:scale-105"
      >
        <X className="w-3.5 h-3.5" />
        <span>Exit</span>
        <span className="text-[10px] text-white/60 font-mono hidden sm:inline">(Esc)</span>
      </button>

      {/* ── Sleek Edge-to-Edge Full Width Bottom Progress Bar ───────── */}
      <ShowcaseProgress />
    </div>
  );
}
