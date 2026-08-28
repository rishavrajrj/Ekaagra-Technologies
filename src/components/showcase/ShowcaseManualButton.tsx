'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useShowcase } from './ShowcaseProvider';
import { SHOWCASE_MIN_DESKTOP_WIDTH } from './showcaseConfig';
import { Play, Tv } from 'lucide-react';

interface ShowcaseManualButtonProps {
  className?: string;
  variant?: 'navbar' | 'mobile' | 'footer' | 'floating';
}

export default function ShowcaseManualButton({
  className = '',
  variant = 'navbar',
}: ShowcaseManualButtonProps) {
  const { openShowcase } = useShowcase();
  const router = useRouter();
  const pathname = usePathname();

  const handleLaunchShowcase = () => {
    if (typeof window !== 'undefined' && window.innerWidth < SHOWCASE_MIN_DESKTOP_WIDTH) {
      return;
    }

    if (pathname !== '/') {
      router.push('/?showcase=true');
    } else {
      openShowcase();
    }
  };

  // Exclude mobile & tablet variants completely
  if (variant === 'mobile') {
    return null;
  }

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={handleLaunchShowcase}
        className={`hidden lg:inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-[#4338CA] hover:text-[#3730A3] border border-[#E2E8F0] hover:border-[#4338CA]/40 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group ${className}`}
        aria-label="Start Homepage Showcase Mode"
        title="Launch Homepage Website Showcase"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97360] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97360]"></span>
        </span>
        <Tv className="w-3.5 h-3.5 text-[#4338CA] group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">Showcase Mode</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLaunchShowcase}
      className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-[#FAF7F2] text-[#4338CA] hover:text-[#3730A3] border border-[#4338CA]/30 hover:border-[#4338CA]/60 rounded-full text-xs font-bold transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${className}`}
      aria-label="Start Homepage Showcase Mode"
      title="Start Homepage Website Showcase"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F97360] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F97360]"></span>
      </span>
      <span className="tracking-wide">Showcase</span>
      <Play className="w-2.5 h-2.5 fill-current text-[#4338CA] group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}
