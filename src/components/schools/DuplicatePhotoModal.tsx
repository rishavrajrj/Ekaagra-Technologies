'use client';

import React, { useState } from 'react';
import { Copy, AlertCircle, Check, X, Eye, RefreshCw, ImageOff } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type { SharedMediaAsset } from '@/lib/types';
import { formatBytes } from '@/lib/imageUtils';
import { formatMediaSource, formatAssetCategories } from '@/lib/mediaRegistryUtils';

interface DuplicatePhotoModalProps {
  isOpen: boolean;
  duplicateAsset: SharedMediaAsset | null;
  targetSectionTitle: string;
  isAlreadyInTargetSection: boolean;
  onReuseExisting: () => void;
  onForceUpload?: () => void;
  onCancel: () => void;
}

export default function DuplicatePhotoModal({
  isOpen,
  duplicateAsset,
  targetSectionTitle,
  isAlreadyInTargetSection,
  onReuseExisting,
  onForceUpload,
  onCancel,
}: DuplicatePhotoModalProps) {
  const [isImageBroken, setIsImageBroken] = useState(false);

  if (!isOpen || !duplicateAsset) return null;

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-auto relative"
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-title"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-amber-50 border-b border-amber-100 flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Copy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 id="duplicate-title" className="font-bold text-sm sm:text-base text-amber-950">
                This photo is already uploaded.
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Exact duplicate detected via cryptographic content match.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-amber-900 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-100/60 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-[#131B2E]">
          <p className="text-slate-600 leading-relaxed">
            You can reuse the existing photo instead of uploading it again. This preserves storage and links the same high-resolution WebP asset to <strong>{targetSectionTitle}</strong>.
          </p>

          {/* Existing Asset Card Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3.5">
            <div className="w-18 h-18 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300 relative group flex items-center justify-center">
              {isImageBroken ? (
                <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                  <ImageOff className="w-5 h-5 text-amber-500 mb-0.5" />
                  <span className="text-[8px] font-semibold text-amber-700">Broken File</span>
                </div>
              ) : (
                <img
                  src={duplicateAsset.url}
                  alt={duplicateAsset.fileName}
                  onError={() => setIsImageBroken(true)}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <span className="font-semibold text-xs text-[#131B2E] truncate block">
                  {duplicateAsset.fileName}
                </span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {formatBytes(duplicateAsset.size)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="inline-flex items-center text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  {formatMediaSource(duplicateAsset.source)}
                </span>
                <span className="inline-flex items-center text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {formatAssetCategories(duplicateAsset.categories)}
                </span>
              </div>

              {isAlreadyInTargetSection ? (
                <div className="text-[11px] font-medium text-emerald-700 flex items-center space-x-1 pt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Already selected in {targetSectionTitle}</span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 pt-0.5">
                  Used in {duplicateAsset.usedIn.length} section{duplicateAsset.usedIn.length === 1 ? '' : 's'}
                </div>
              )}
            </div>
          </div>

          {isImageBroken && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start space-x-2 text-amber-900 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Existing image file is missing or corrupted.</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  The previous file in storage cannot be loaded. Click <strong>"Re-upload & Replace"</strong> to upload the fresh file and restore it across all sections.
                </p>
              </div>
            </div>
          )}

          {isAlreadyInTargetSection && !isImageBroken && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start space-x-2 text-emerald-800 text-[11px]">
              <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                This photo is already attached to {targetSectionTitle}. Re-uploading is not required.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-end space-x-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer text-xs"
          >
            Cancel
          </button>

          {/* Re-upload & Replace button (always available if onForceUpload is passed) */}
          {onForceUpload && (
            <button
              type="button"
              onClick={onForceUpload}
              className={`px-4 py-2 rounded-xl font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer text-xs ${
                isImageBroken
                  ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-upload & Replace</span>
            </button>
          )}

          {!isAlreadyInTargetSection && !isImageBroken && (
            <button
              type="button"
              onClick={onReuseExisting}
              className="px-4 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer text-xs"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Use Existing Photo</span>
            </button>
          )}

          {isAlreadyInTargetSection && !onForceUpload && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition shadow-xs text-xs cursor-pointer"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
