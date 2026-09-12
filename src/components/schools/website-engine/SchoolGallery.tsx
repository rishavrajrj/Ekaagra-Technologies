'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import type { SchoolWebsiteData } from '@/lib/schoolWebsiteContract';

interface SchoolGalleryProps {
  data: SchoolWebsiteData;
}

export default function SchoolGallery({ data }: SchoolGalleryProps) {
  const { gallery, school, branding } = data;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (gallery.length === 0) {
    return null;
  }

  const categories = ['all', ...Array.from(new Set(gallery.map((g) => g.category)))];
  const filteredImages =
    selectedCategory === 'all'
      ? gallery
      : gallery.filter((g) => g.category === selectedCategory);

  return (
    <section id="gallery" className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <span
              className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: branding.primaryColor || '#4338CA' }}
            >
              Visual Life
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Gallery &amp; Student Activities
            </h2>
            <p className="text-xs text-slate-500">
              Moments of discovery, athletics, artistic expression, and community life at {school.displayName}.
            </p>
          </div>

          {/* Category Filter Pills */}
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-1.5 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Moments' : cat.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden aspect-4/3 bg-slate-100 border border-slate-200 shadow-2xs"
            >
              <img
                src={img.url}
                alt={img.altText || 'School event'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
              {img.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition p-3 flex items-end">
                  <span className="text-[11px] font-medium text-white line-clamp-2">
                    {img.caption}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
