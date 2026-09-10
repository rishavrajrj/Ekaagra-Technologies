'use client';

import React, { useState, useRef } from 'react';
import ModalPortal from '@/components/ui/ModalPortal';

import {
  User,
  Upload,
  Download,
  Copy,
  Check,
  Maximize2,
  RotateCw,
  Trash2,
  Loader2,
  AlertCircle,
  X,
  Sparkles,
  History,
} from 'lucide-react';
import type { PersonImageData, CampusImageData } from '@/lib/types';
import { formatBytes, formatOptimizationStats } from '@/lib/imageUtils';
import {
  PRINCIPAL_IMAGE_TYPES,
  TRUSTEE_IMAGE_TYPES,
  resolveImageTypeDisplay,
  type ImageTypeOption,
} from '@/lib/schoolIntake';
import ImageMetadataCardEditor from './ImageMetadataCardEditor';

export interface PersonPhotoSectionProps {
  /** Unique entity identifier of the person (e.g. 'principal-main' or member.id) */
  personId: string;
  /** Full name of the person for accessible alt text and titles */
  personName?: string;
  /** Role classification to distinguish Principal vs Trustee */
  personRole: 'principal' | 'trustee';
  /** Field label */
  label?: string;
  /** Explanatory helper text displayed below the label */
  helperText?: string;
  /** Current photo asset associated with this person */
  image?: PersonImageData | null;
  /** Legacy string URL fallback for backwards compatibility */
  legacyPhotoUrl?: string;
  /** Onboarding session auth token */
  token: string;
  /** Callback fired whenever the photo is uploaded, modified, or removed */
  onUpdateImage: (image: PersonImageData | null) => void;
  /** Optional historical/candidate assets belonging to this same person for reuse */
  candidateAssets?: PersonImageData[];
  /** All storage keys currently referenced across the school (campuses + leadership) for safe unreferenced cleanup */
  allReferencedStorageKeys?: string[];
}

export default function PersonPhotoSection({
  personId,
  personName = '',
  personRole,
  label,
  helperText,
  image,
  legacyPhotoUrl,
  token,
  onUpdateImage,
  candidateAssets = [],
  allReferencedStorageKeys = [],
}: PersonPhotoSectionProps) {
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'optimizing' | 'validating' | 'done' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showReusePicker, setShowReusePicker] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPrincipal = personRole === 'principal';
  const defaultLabel = isPrincipal ? 'Principal / Head Photo' : 'Person Photo';
  const defaultHelperText = isPrincipal
    ? "Professional photograph of the Principal / Head of Institution for use on the school's website and leadership sections."
    : "Professional photograph of this committee member for use on the school's website and leadership/management sections.";

  const effectiveLabel = label || defaultLabel;
  const effectiveHelperText = helperText || defaultHelperText;
  const imageTypeOptions: readonly ImageTypeOption[] = isPrincipal
    ? PRINCIPAL_IMAGE_TYPES
    : TRUSTEE_IMAGE_TYPES;
  const defaultSuggestedType = isPrincipal
    ? 'Principal / Head of Institution'
    : 'Trustee';

  // Determine current active image object (synthesize from legacy string URL if needed)
  const currentPhoto: PersonImageData | null = image
    ? image
    : legacyPhotoUrl && legacyPhotoUrl.trim().length > 0
    ? {
        id: `legacy-${personId}`,
        personId,
        personRole,
        storageKey: '',
        fileName: `${personName || 'portrait'}.webp`,
        url: legacyPhotoUrl,
        mimeType: 'image/webp',
        imageType: defaultSuggestedType,
        customImageType: null,
      }
    : null;

  // AI Suggestion prompts according to exact specification
  const aiPromptText = isPrincipal
    ? 'Create a clean, professional school-website leadership portrait suitable for a Principal / Head of Institution. Use a neutral, professional background, natural lighting, formal appearance, realistic photography style, and no text, logos, badges, or watermarks.'
    : 'Create a clean, professional school-website leadership portrait suitable for a Trustee / Director / Management Committee member. Use a neutral, professional background, natural lighting, formal appearance, realistic photography style, and no text, logos, badges, or watermarks.';

  // Trigger file selection
  const triggerFileInput = () => {
    setUploadError(null);
    fileInputRef.current?.click();
  };

  // Upload handler via canonical server-side Sharp WebP optimization pipeline
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value to allow re-selecting same file if necessary
    e.target.value = '';

    setUploadError(null);
    setUploadPhase('uploading');
    setUploadMessage('Uploading portrait original securely...');

    const timerOpt = setTimeout(() => {
      setUploadPhase('optimizing');
      setUploadMessage('Server optimizing with Sharp & converting to genuine WebP...');
    }, 400);

    const timerVal = setTimeout(() => {
      setUploadPhase('validating');
      setUploadMessage('Validating WebP decode and dimensions...');
    }, 900);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);
      formData.append('itemId', isPrincipal ? 'lead-principal-photo' : 'lead-trustee-photo');
      formData.append('itemType', 'image');
      formData.append('personId', personId);

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timerOpt);
      clearTimeout(timerVal);

      const json = await res.json();
      if (!res.ok || !json.success || !json.asset) {
        throw new Error(json.error || 'Failed to upload and optimize portrait image.');
      }

      const asset = json.asset;
      const oldStorageKey = currentPhoto?.storageKey;

      const newPhoto: PersonImageData = {
        id: asset.id || `img-person-${Date.now()}`,
        personId,
        personRole,
        storageKey: asset.storageKey,
        fileName: asset.name,
        url: asset.url,
        mimeType: asset.type || 'image/webp',
        width: asset.width ?? null,
        height: asset.height ?? null,
        originalSize: asset.originalSize || asset.size,
        optimizedSize: asset.optimizedSize || asset.size,
        optimizedFormat: asset.optimizedFormat || 'webp',
        createdAt: asset.uploadedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checksumSha256: asset.checksumSha256,
        imageType: currentPhoto?.imageType || defaultSuggestedType,
        customImageType: currentPhoto?.customImageType ?? null,
        caption: currentPhoto?.caption || '',
      };

      onUpdateImage(newPhoto);

      // Safe cleanup of replaced asset if unreferenced elsewhere
      if (oldStorageKey && oldStorageKey !== newPhoto.storageKey) {
        const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === oldStorageKey).length > 1;
        if (!isReusedElsewhere) {
          try {
            await fetch('/api/school-assets/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, storageKey: oldStorageKey }),
            });
          } catch {
            // Non-blocking cleanup
          }
        }
      }

      setUploadPhase('done');
      setUploadMessage('✓ Genuine WebP Optimized');
      setTimeout(() => {
        setUploadPhase('idle');
        setUploadMessage('');
      }, 2500);
    } catch (err: any) {
      clearTimeout(timerOpt);
      clearTimeout(timerVal);
      setUploadPhase('error');
      setUploadError(err.message || 'Image optimization failed.');
      setTimeout(() => {
        setUploadPhase('idle');
      }, 4000);
    }
  };

  // Metadata update handler (imageType, customImageType, caption)
  const handleUpdateMetadata = (patch: {
    imageType?: string;
    customImageType?: string | null;
    caption?: string;
  }) => {
    if (!currentPhoto) return;
    const updated: PersonImageData = {
      ...currentPhoto,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    onUpdateImage(updated);
  };

  // Delete photo handler with confirmation and unreferenced storage cleanup
  const handleDelete = async () => {
    if (!currentPhoto) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove the photograph for ${personName || (isPrincipal ? 'the Principal' : 'this member')}?`
    );
    if (!confirmed) return;

    const storageKeyToDelete = currentPhoto.storageKey;
    onUpdateImage(null);

    // Safely delete storage object only if not referenced elsewhere
    if (storageKeyToDelete) {
      const isReusedElsewhere = allReferencedStorageKeys.filter((k) => k === storageKeyToDelete).length > 1;
      if (!isReusedElsewhere) {
        try {
          await fetch('/api/school-assets/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, storageKey: storageKeyToDelete }),
          });
        } catch {
          // Non-blocking cleanup
        }
      }
    }
  };

  // Download WebP stream with resilient blob fallback
  const handleDownload = async () => {
    if (!currentPhoto) return;
    const downloadFilename = currentPhoto.fileName.endsWith('.webp')
      ? currentPhoto.fileName
      : `${currentPhoto.fileName || 'portrait'}.webp`;

    const downloadApiUrl = currentPhoto.storageKey
      ? `/api/school-assets/download?token=${encodeURIComponent(token)}&key=${encodeURIComponent(currentPhoto.storageKey)}&download=1&filename=${encodeURIComponent(downloadFilename)}`
      : '';

    // 1. Primary: Try downloading via authoritative server API as blob
    if (downloadApiUrl) {
      try {
        const res = await fetch(downloadApiUrl);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = downloadFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          return;
        }
      } catch (err) {
        console.warn('API download fetch error, attempting direct photo URL fallback:', err);
      }
    }

    // 2. Secondary: If direct photo URL is present, download via blob
    if (currentPhoto.url) {
      try {
        const res = await fetch(currentPhoto.url);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = downloadFilename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          return;
        }
      } catch (err) {
        console.warn('Direct photo URL fetch error, falling back to anchor click:', err);
      }

      // 3. Fallback: Standard browser anchor navigation
      const a = document.createElement('a');
      a.href = currentPhoto.url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 4. Final fallback
    if (downloadApiUrl) {
      const a = document.createElement('a');
      a.href = downloadApiUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = () => {
    if (!currentPhoto) return;
    const directUrl = currentPhoto.storageKey
      ? `${window.location.origin}/api/school-assets/download?token=${encodeURIComponent(token)}&key=${encodeURIComponent(currentPhoto.storageKey)}`
      : (currentPhoto.url.startsWith('http') ? currentPhoto.url : `${window.location.origin}${currentPhoto.url}`);

    navigator.clipboard.writeText(directUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Copy AI prompt to clipboard
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  // Filter candidate assets strictly belonging to this person
  const personCandidates = candidateAssets.filter(
    (c) => c.personId === personId && c.url !== currentPhoto?.url
  );

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/avif"
        onChange={handleFileSelected}
        className="hidden"
        disabled={uploadPhase === 'uploading' || uploadPhase === 'optimizing' || uploadPhase === 'validating'}
        aria-label={`Upload photo for ${personName || (isPrincipal ? 'Principal' : 'member')}`}
      />

      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <User className="w-4 h-4 text-[#4338CA]" />
            <h4 className="font-bold text-sm text-[#131B2E]">{effectiveLabel}</h4>
            <span className="text-[10px] font-bold tracking-wider uppercase text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              RECOMMENDED
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
              WEBP
            </span>
          </div>
          <p className="text-xs text-[#64748B]">{effectiveHelperText}</p>
        </div>

        {/* Subtle recommendation hint + AI guide trigger */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAiModal(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 text-slate-600 hover:text-[#4338CA] bg-slate-50 hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] rounded-xl text-xs font-medium transition cursor-pointer"
            title="View portrait reference guidelines & AI prompt"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggest a clean image</span>
          </button>
        </div>
      </div>

      {/* Subtle Portrait Recommendation Note */}
      <p className="text-[11px] text-slate-500 italic bg-[#FAF7F2] border border-[#E2E8F0]/80 rounded-xl px-3 py-1.5">
        Recommended: use a clear, professional portrait with good lighting and a clean background.
      </p>

      {/* Upload Phase Progress Banner */}
      {uploadPhase !== 'idle' && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            uploadPhase === 'done'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
              : uploadPhase === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50/80 border-indigo-200 text-indigo-900'
          }`}
        >
          <div className="flex items-center space-x-2">
            {uploadPhase === 'done' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : uploadPhase === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#4338CA] animate-spin shrink-0" />
            )}
            <span className="font-medium">{uploadError ? uploadError : uploadMessage}</span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 bg-white/70 px-2 py-0.5 rounded-md border border-slate-200">
            {uploadPhase}
          </span>
        </div>
      )}

      {/* Uploaded Card or Empty State */}
      {currentPhoto ? (
        <div className="max-w-md bg-[#FAF7F2] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl overflow-hidden shadow-2xs transition">
          {/* Portrait Image Container */}
          <div className="group relative aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.url}
              alt={personName ? `Photo of ${personName}` : (isPrincipal ? 'Photo of Principal' : 'Member photograph')}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
            />

            {/* WebP Badge */}
            <div className="absolute top-2 left-2 flex items-center space-x-1">
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-300 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-emerald-700/50 shadow-xs">
                WEBP
              </span>
            </div>

            {/* Desktop Hover Quick Actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                title="Preview in Lightbox"
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition shadow-xs cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                title="Download WebP"
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                title="Copy URL"
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition shadow-xs cursor-pointer"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                title="Replace Image"
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-indigo-700 transition shadow-xs cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                title="Delete Image"
                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Metadata & Image Type Selector directly below image */}
          <div className="p-3 bg-white space-y-2 text-xs">
            <div>
              <div className="font-semibold text-[#131B2E] truncate" title={currentPhoto.fileName}>
                {currentPhoto.fileName}
              </div>
              <div className="flex items-center justify-between text-[#64748B] text-[10px] pt-0.5">
                <span>
                  {currentPhoto.width && currentPhoto.height
                    ? `${currentPhoto.width} × ${currentPhoto.height} px`
                    : 'Standard WebP Portrait'}
                </span>
                {currentPhoto.optimizedSize && (
                  <span className="font-semibold font-mono text-[#334155]">
                    {formatBytes(currentPhoto.optimizedSize)}
                  </span>
                )}
              </div>
              {currentPhoto.originalSize && currentPhoto.optimizedSize && currentPhoto.originalSize > currentPhoto.optimizedSize && (
                <div className="text-[9px] text-emerald-700 font-medium pt-0.5">
                  {formatOptimizationStats(currentPhoto.originalSize, currentPhoto.optimizedSize)?.percentage}% smaller than original
                </div>
              )}
            </div>

            {/* Per-Image Classification Dropdown using canonical editor */}
            <ImageMetadataCardEditor
              imageId={currentPhoto.id}
              imageType={currentPhoto.imageType || defaultSuggestedType}
              customImageType={currentPhoto.customImageType}
              options={imageTypeOptions}
              allowPrimary={false}
              allowCaption={false}
              typeLabel="Image Type"
              otherPlaceholder={isPrincipal ? 'e.g. Founding Principal, Campus Director' : 'e.g. Patron, Advisory Trustee'}
              onUpdateMetadata={(patch) => handleUpdateMetadata(patch)}
              disabled={uploadPhase === 'uploading' || uploadPhase === 'optimizing' || uploadPhase === 'validating'}
            />

            {/* Visible Action Toolbar directly below Image Metadata */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
              <div className="text-slate-400 text-[10px]">
                {resolveImageTypeDisplay(
                  currentPhoto.imageType || defaultSuggestedType,
                  currentPhoto.customImageType,
                  imageTypeOptions
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLightbox(true)}
                  className="text-[#4338CA] hover:text-[#3730A3] font-medium cursor-pointer"
                >
                  Preview
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="text-[#4338CA] hover:text-[#3730A3] font-medium cursor-pointer"
                >
                  Download
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="text-indigo-700 hover:text-indigo-900 font-medium cursor-pointer"
                >
                  Replace
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="space-y-2">
          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-[#CBD5E1] hover:border-[#4338CA]/60 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition space-y-2.5 group"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B] group-hover:text-[#4338CA] group-hover:border-[#4338CA]/40 transition shadow-2xs">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#131B2E] block">
                No photo uploaded
              </span>
              <span className="text-[11px] text-[#64748B] block mt-0.5">
                Upload a clear portrait to showcase this leadership profile on the school website.
              </span>
            </div>
            <div className="pt-1 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                disabled={uploadPhase === 'uploading' || uploadPhase === 'optimizing' || uploadPhase === 'validating'}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Image</span>
              </button>

              {personCandidates.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReusePicker(!showReusePicker);
                  }}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-[#E2E8F0] text-slate-700 rounded-xl text-xs font-medium shadow-2xs transition cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Reuse Previous ({personCandidates.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Candidate Reuse Picker Modal / Drawer */}
          {showReusePicker && personCandidates.length > 0 && (
            <div className="p-3 bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-950">
                <span>Select from previously uploaded portraits for this person:</span>
                <button
                  type="button"
                  onClick={() => setShowReusePicker(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {personCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      onUpdateImage({
                        ...candidate,
                        reusedFromId: candidate.id,
                        updatedAt: new Date().toISOString(),
                      });
                      setShowReusePicker(false);
                    }}
                    className="p-1.5 bg-white border border-[#CBD5E1] hover:border-[#4338CA] rounded-lg cursor-pointer transition text-[10px] space-y-1 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={candidate.url}
                      alt={candidate.fileName}
                      className="w-full aspect-square object-cover rounded-md"
                    />
                    <div className="truncate font-medium text-slate-800">{candidate.fileName}</div>
                    <span className="text-[9px] text-[#4338CA] group-hover:underline block">Select Asset</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {showLightbox && currentPhoto && (
        <ModalPortal isOpen={true}>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
            onClick={() => setShowLightbox(false)}
          >

          <div
            className="relative max-w-3xl w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto bg-[#131B2E] border border-slate-700 rounded-2xl shadow-2xl space-y-3 p-4 sm:p-5 text-white my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2 min-w-0 flex-wrap gap-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">
                  WEBP OPTIMIZED
                </span>
                <span className="text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-md">
                  {resolveImageTypeDisplay(
                    currentPhoto.imageType || defaultSuggestedType,
                    currentPhoto.customImageType,
                    imageTypeOptions
                  )}
                </span>
                <span className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs" title={currentPhoto.fileName}>
                  {personName ? `${personName} — ${currentPhoto.fileName}` : currentPhoto.fileName}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WebP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLightbox(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Portrait Preview */}
            <div className="relative max-h-[70vh] flex items-center justify-center bg-black/50 rounded-xl overflow-hidden p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.url}
                alt={personName ? `Portrait of ${personName}` : currentPhoto.fileName}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Footer Metadata */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>Dimensions:</strong>{' '}
                  {currentPhoto.width && currentPhoto.height ? `${currentPhoto.width} × ${currentPhoto.height} px` : 'Standard'}
                </span>
                {currentPhoto.optimizedSize && (
                  <span>
                    <strong>Size:</strong> {formatBytes(currentPhoto.optimizedSize)}
                  </span>
                )}
              </div>
              {currentPhoto.storageKey && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Storage: {currentPhoto.storageKey}
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalPortal>
    )}



      {/* AI Portrait Suggestion & Guidelines Modal */}
      <ModalPortal isOpen={showAiModal}>
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setShowAiModal(false)}
        >
          <div
            className="relative max-w-xl w-full max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto bg-white border border-[#CBD5E1] rounded-2xl shadow-2xl space-y-4 p-5 sm:p-6 text-[#131B2E] my-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm sm:text-base text-[#131B2E]">
                  Portrait Guidelines &amp; AI Prompt Suggestion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Critical Compliance Disclaimer */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Important Authenticity Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Do not represent an AI-generated person as the actual school official.
                AI generation should only be available as a design or reference suggestion unless the school
                explicitly provides or approves an appropriate real photograph.
              </p>
            </div>

            {/* Guidelines Checklist */}
            <div className="space-y-1.5 text-xs text-[#475569]">
              <span className="font-semibold text-[#131B2E] block">Recommended Portrait Composition:</span>
              <ul className="list-disc pl-4 space-y-1 text-[11px]">
                <li>Formal, professional appearance and neutral background.</li>
                <li>Natural lighting with high contrast and sharp focus on face and shoulders.</li>
                <li>High resolution (minimum 600 × 600 px, optimized automatically to WebP).</li>
                <li>No overlaid text, school crests, logos, badges, or watermarks.</li>
              </ul>
            </div>

            {/* Generated Design Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-[#131B2E]">
                  Recommended Reference Prompt ({isPrincipal ? 'Principal' : 'Trustee / Director'}):
                </label>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center space-x-1 text-xs text-[#4338CA] hover:text-[#3730A3] font-medium cursor-pointer"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 select-all leading-relaxed">
                &ldquo;{aiPromptText}&rdquo;
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAiModal(false);
                  triggerFileInput();
                }}
                className="px-4 py-2 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                Upload Real Photo
              </button>
            </div>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
}

