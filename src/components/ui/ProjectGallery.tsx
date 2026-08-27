'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectGalleryProps {
  images: string[];
  title: string;
}

export default function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const currentImage = images[currentIndex];

  return (
    <div className="mb-16 space-y-4">
      {/* Browser Mockup Window Container */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl overflow-hidden shadow-2xl">
        {/* Window Topbar */}
        <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97360]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F4C95D]" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-3 text-xs font-mono text-[#64748B]">
              preview // {title.toLowerCase().replace(/\s+/g, '-')}.com
            </span>
          </div>

          <div className="text-[10px] font-bold text-[#4338CA] uppercase tracking-widest bg-[#4338CA]/10 px-3 py-1 rounded-full border border-[#4338CA]/20">
            Slide {currentIndex + 1} of {images.length}
          </div>
        </div>

        {/* Main Slide Viewer */}
        <div className="group relative w-full h-[340px] sm:h-[480px] md:h-[560px] bg-[#F3EFEA] overflow-hidden">
          <Image
            src={currentImage}
            alt={`${title} screenshot ${currentIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 85vw, 1000px"
            className="object-contain transition-opacity duration-300"
            priority={currentIndex === 0}
          />

          {/* Left Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#4338CA] hover:text-white text-[#131B2E] p-3 rounded-full border border-[#E2E8F0] transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-xl cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Right Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next slide"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#4338CA] hover:text-white text-[#131B2E] p-3 rounded-full border border-[#E2E8F0] transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-xl cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail Bar */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto py-2 justify-center">
          {images.map((img, idx) => (
            <button
              key={img}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`View slide ${idx + 1}`}
              className={`relative shrink-0 w-24 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                idx === currentIndex
                  ? 'border-[#4338CA] ring-2 ring-[#4338CA]/40 opacity-100 scale-105 shadow-md'
                  : 'border-[#E2E8F0] opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


