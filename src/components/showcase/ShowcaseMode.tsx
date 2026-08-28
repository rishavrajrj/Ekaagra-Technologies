'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';
import { SHOWCASE_MIN_DESKTOP_WIDTH } from './showcaseConfig';
import ShowcaseProgress from './ShowcaseProgress';

export default function ShowcaseMode() {
  const { isOpen } = useShowcase();
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
      className="hidden lg:block fixed inset-0 z-[99999] pointer-events-none select-none"
    >
      {/* ── Initial HUD Keyboard Hint (Auto Fades) ────────────────── */}
      <div
        className={`absolute top-6 left-1/2 -translate-x-1/2 z-[100000] px-4 py-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-full text-[11px] font-medium text-white/90 shadow-2xl transition-all duration-700 pointer-events-none ${
          showHint ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <span>Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">Space</kbd> to Pause • <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px] font-mono">Esc</kbd> to Exit</span>
      </div>

      {/* ── Sleek Edge-to-Edge Full Width Bottom Progress Bar ───────── */}
      <ShowcaseProgress />
    </div>
  );
}
