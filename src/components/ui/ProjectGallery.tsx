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
      <div className="bg-[#0e1320] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Window Topbar */}
        <div className="bg-[#080b13] px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            <span className="ml-3 text-xs font-mono text-slate-400">
              preview // {title.toLowerCase().replace(/\s+/g, '-')}.app
            </span>
          </div>

          <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Slide {currentIndex + 1} of {images.length}
          </div>
        </div>

        {/* Main Slide Viewer */}
        <div className="group relative w-full h-[340px] sm:h-[480px] md:h-[560px] bg-[#060911] overflow-hidden">
          <Image
            src={currentImage}
            alt={`${title} screenshot ${currentIndex + 1}`}
            fill
            className="object-contain transition-opacity duration-300"
            priority
          />

          {/* Left Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous slide"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#090d16]/90 hover:bg-blue-600 text-white p-3 rounded-full border border-white/20 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-xl"
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
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#090d16]/90 hover:bg-blue-600 text-white p-3 rounded-full border border-white/20 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 shadow-xl"
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
              className={`relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex
                  ? 'border-blue-500 ring-2 ring-blue-500/50 opacity-100 scale-105'
                  : 'border-white/10 opacity-50 hover:opacity-90'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

