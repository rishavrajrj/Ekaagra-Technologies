'use client';

import React from 'react';
import { useShowcase } from './ShowcaseProvider';
import ShowcaseProgress from './ShowcaseProgress';

export default function ShowcaseMode() {
  const { isOpen } = useShowcase();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ekaagra Technologies Cinematic Website Showcase"
      className="fixed inset-0 z-[99999] pointer-events-none select-none"
    >
      {/* ── Only Sleek Full Width Bottom Progress Bar ─────────────── */}
      <ShowcaseProgress />
    </div>
  );
}
