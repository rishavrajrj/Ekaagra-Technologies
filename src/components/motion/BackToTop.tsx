'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useShowcase } from '@/components/showcase/ShowcaseProvider';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  let isShowcaseOpen = false;

  try {
    const showcase = useShowcase();
    isShowcaseOpen = showcase.isOpen;
  } catch {
    // fallback
  }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 480);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (isShowcaseOpen || !isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll back to top of page"
      title="Back to Top"
      className="fixed bottom-6 right-6 z-40 p-2.5 sm:p-3 bg-white/90 hover:bg-white text-[#4338CA] hover:text-[#3730A3] border border-[#E2E8F0] hover:border-[#4338CA]/40 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 backdrop-blur-md transition-all duration-300 cursor-pointer animate-fade-in group focus:outline-none focus:ring-2 focus:ring-[#4338CA]/40"
    >
      <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
