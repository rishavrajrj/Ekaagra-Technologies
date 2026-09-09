'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

export interface CampusMapPinPickerProps {
  googleMapsUrl?: string;
  onChange: (updates: { googleMapsUrl?: string }) => void;
  title?: string;
  description?: string;
}

/**
 * Pure text URL input for Google Maps share links.
 * All detection, geocoding, coordinates, and map canvases have been completely removed.
 */
export default function CampusMapPinPicker({
  googleMapsUrl = '',
  onChange,
  title = 'Campus Location',
  description = "If your school has a Google Maps location, paste the share link here. Ekaagra will use it to add a map or directions link to your school's website.",
}: CampusMapPinPickerProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
      <div className="flex items-center space-x-2">
        <MapPin className="w-4 h-4 text-[#4338CA]" />
        <h4 className="font-bold text-sm text-[#131B2E]">{title}</h4>
      </div>
      <div>
        <label className="flex items-center justify-between font-medium text-[#131B2E] mb-1 text-xs">
          <span>Google Maps Location Link</span>
          <span className="font-normal text-[#64748B] text-[11px]">Optional</span>
        </label>
        <input
          type="url"
          value={googleMapsUrl}
          onChange={(e) => onChange({ googleMapsUrl: e.target.value })}
          placeholder="https://maps.app.goo.gl/..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:ring-3 focus:ring-[#4338CA]/10 focus:outline-hidden text-[#131B2E] placeholder:text-[#94A3B8] text-xs transition shadow-2xs"
        />
        <p className="text-[11px] text-[#64748B] mt-1.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
