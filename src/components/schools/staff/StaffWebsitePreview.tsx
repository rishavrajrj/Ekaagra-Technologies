'use client';

import React from 'react';
import { X, Globe, User, Sparkles, Star, ExternalLink, ShieldCheck } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type { StaffMember } from '@/lib/types';

export interface StaffWebsitePreviewProps {
  isOpen: boolean;
  member: StaffMember | null;
  onClose: () => void;
  onEdit?: (member: StaffMember) => void;
}

export default function StaffWebsitePreview({
  isOpen,
  member,
  onClose,
  onEdit,
}: StaffWebsitePreviewProps) {
  if (!isOpen || !member) return null;

  const wp = member.websiteProfile;
  const isVisibleOnWebsite = (wp?.showOnWebsite ?? member.displayOnWebsite) && member.status !== 'archived';
  const isFeatured = Boolean(wp?.featured && isVisibleOnWebsite);

  // Public Presentation Fields (sanitized, zero ERP leak)
  const displayName = (wp?.publicName || member.name || '').trim();
  const displayDesignation = (wp?.publicDesignation || member.designation || '').trim();
  const displayDepartment = (wp?.publicDepartment || member.department || '').trim();
  const displaySubject = (wp?.publicSubject || member.primarySubject || member.jobRole || '').trim();
  const displayBio = (wp?.shortBio || member.bio || '').trim();
  const photoUrl = member.photoUrl;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-up my-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-wide text-white">Public Website Profile Preview</h3>
                <p className="text-[10px] text-slate-400">Live presentation preview (sensitive ERP data omitted)</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visibility Banner */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold text-slate-500">Website Status:</span>
              {isVisibleOnWebsite ? (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Visible on Public School Website</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  <span>Private (Internal ERP Only)</span>
                </span>
              )}
            </div>

            {isFeatured && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Featured</span>
              </span>
            )}
          </div>

          {/* Realistic Website Faculty Card */}
          <div className="p-6 bg-slate-100/60 flex items-center justify-center">
            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition">
              {/* Photo Area */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden flex items-center justify-center group">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName || 'Faculty Member'}
                    className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 text-slate-400">
                    <User className="w-16 h-16 text-slate-300 mb-1" />
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Faculty Member</span>
                  </div>
                )}

                {/* Featured Faculty Star Badge */}
                {isFeatured && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white p-1.5 rounded-full shadow-md">
                    <Star className="w-3.5 h-3.5 fill-white text-white" />
                  </div>
                )}

                {/* Department Chip Overlay */}
                {displayDepartment && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {displayDepartment}
                  </div>
                )}
              </div>

              {/* Information Area */}
              <div className="p-5 space-y-2.5 text-center">
                <div>
                  <h4 className="text-base font-black text-[#131B2E] tracking-tight">
                    {displayName || 'Faculty Member'}
                  </h4>
                  {displayDesignation && (
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">
                      {displayDesignation}
                    </p>
                  )}
                  {displaySubject && displaySubject !== displayDepartment && (
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {displaySubject}
                    </p>
                  )}
                </div>

                {/* Short Bio */}
                {displayBio ? (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-4 pt-1 border-t border-slate-100 text-left">
                    {displayBio}
                  </p>
                ) : (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400 italic">No biography provided.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Guarantee Note */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Personal phone, email, and salary records are strictly hidden.</span>
            </div>

            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(member);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                >
                  Edit Profile
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
