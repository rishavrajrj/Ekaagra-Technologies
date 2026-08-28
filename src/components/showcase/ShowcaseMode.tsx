'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';
import ShowcaseProgress from './ShowcaseProgress';
import { X } from 'lucide-react';

export default function ShowcaseMode() {
  const { isOpen, closeShowcase } = useShowcase();
  const [showHint, setShowHint] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setShowHint(true);
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ekaagra Technologies Cinematic Website Showcase"
      className="fixed inset-0 z-[99999] pointer-events-none select-none"
    >
      {/* ── Initial HUD Keyboard Hint (Auto Fades) ────────────────── */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-[100000] px-4 py-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-medium text-white/90 shadow-2xl transition-all duration-700 pointer-events-none ${
          showHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <span>Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">Space</kbd> to Pause • <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">Esc</kbd> to Exit</span>
      </div>

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
