'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useShowcase } from './ShowcaseProvider';
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
    if (pathname !== '/') {
      router.push('/?showcase=true');
    } else {
      openShowcase();
    }
  };

  if (variant === 'mobile') {
    return (
      <button
        type="button"
        onClick={handleLaunchShowcase}
        className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 border bg-gradient-to-r from-[#4338CA]/10 via-[#F97360]/10 to-transparent border-[#4338CA]/30 text-[#4338CA] hover:bg-[#4338CA]/15 cursor-pointer shadow-sm ${className}`}
        aria-label="Start Homepage Showcase Mode"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#4338CA] text-white flex items-center justify-center">
            <Play className="w-3 h-3 fill-current ml-0.5" />
          </div>
          <span>Showcase Mode</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-[#4338CA]/10 text-[#4338CA] rounded-md tracking-wider">
          LIVE
        </span>
      </button>
    );
  }

  if (variant === 'footer') {
    return (
      <button
        type="button"
        onClick={handleLaunchShowcase}
        className={`inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FAF7F2] text-[#4338CA] hover:text-[#3730A3] border border-[#E2E8F0] hover:border-[#4338CA]/40 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group ${className}`}
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-[#FAF7F2] text-[#4338CA] hover:text-[#3730A3] border border-[#4338CA]/30 hover:border-[#4338CA]/60 rounded-full text-xs font-bold transition-all duration-200 shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98] cursor-pointer group ${className}`}
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
