'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  Building2,
  Calendar,
  ImageOff,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import type { SharedMediaAsset, CampusImageData } from '@/lib/types';
import { formatBytes } from '@/lib/imageUtils';
import {
  filterAssetsForSection,
  formatMediaSource,
  formatAssetCategories,
  sharedAssetToCampusImage,
} from '@/lib/mediaRegistryUtils';
import { CAMPUS_GALLERY_CATEGORIES } from '@/lib/schoolIntake';

interface SchoolMediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionKey: string;
  sectionTitle: string;
  mediaRegistry: SharedMediaAsset[];
  alreadySelectedPhotoIdsOrUrls: string[];
  onSelectPhotos: (selectedAssets: SharedMediaAsset[]) => void;
  onDeleteAsset?: (asset: SharedMediaAsset) => void | Promise<void>;
}

export default function SchoolMediaPickerModal({
  isOpen,
  onClose,
  sectionKey,
  sectionTitle,
  mediaRegistry,
  alreadySelectedPhotoIdsOrUrls,
  onSelectPhotos,
  onDeleteAsset,
}: SchoolMediaPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'recommended' | 'all'>('recommended');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [previewAsset, setPreviewAsset] = useState<SharedMediaAsset | null>(null);
  const [brokenAssetIds, setBrokenAssetIds] = useState<Set<string>>(new Set());
  const [assetToDelete, setAssetToDelete] = useState<SharedMediaAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Set of IDs or URLs already in the target section
  const alreadySelectedSet = useMemo(() => {
    return new Set(alreadySelectedPhotoIdsOrUrls.map((s) => s.toLowerCase()));
  }, [alreadySelectedPhotoIdsOrUrls]);

  // Split registry into recommended vs all
  const { recommended, all } = useMemo(() => {
    return filterAssetsForSection(mediaRegistry, sectionKey, selectedCategory);
  }, [mediaRegistry, sectionKey, selectedCategory]);

  // Choose the active list based on activeTab (fallback to 'all' if recommended is empty)
  const currentList = useMemo(() => {
    const base = activeTab === 'recommended' && recommended.length > 0 ? recommended : all;
    if (!searchQuery.trim()) return base;

    const q = searchQuery.toLowerCase().trim();
    return base.filter(
      (a) =>
        a.fileName.toLowerCase().includes(q) ||
        (a.caption && a.caption.toLowerCase().includes(q)) ||
        (a.categories || []).some((c) => c.toLowerCase().includes(q))
    );
  }, [activeTab, recommended, all, searchQuery]);

  if (!isOpen) return null;

  const toggleSelection = (asset: SharedMediaAsset) => {
    const isAlreadyUsed =
      alreadySelectedSet.has(asset.id.toLowerCase()) ||
      alreadySelectedSet.has(asset.url.toLowerCase()) ||
      (asset.hash && alreadySelectedSet.has(asset.hash.toLowerCase()));

    if (isAlreadyUsed) return; // Prevent selecting already added photos

    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.id)) {
        next.delete(asset.id);
      } else {
        next.add(asset.id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const chosenAssets = mediaRegistry.filter((a) => selectedAssetIds.has(a.id));
    onSelectPhotos(chosenAssets);
    setSelectedAssetIds(new Set());
    onClose();
  };

  const handleConfirmDelete = async () => {
    if (!assetToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteAsset) {
        await onDeleteAsset(assetToDelete);
      }
      setSelectedAssetIds((prev) => {
        const next = new Set(prev);
        next.delete(assetToDelete.id);
        return next;
      });
      if (previewAsset?.id === assetToDelete.id) {
        setPreviewAsset(null);
      }
    } finally {
      setIsDeleting(false);
      setAssetToDelete(null);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] sm:max-h-[88vh] border border-slate-200 shadow-2xl flex flex-col overflow-hidden my-auto relative"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── MODAL HEADER ────────────────────────────────────────────── */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-[#131B2E]">School Media Library</h3>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {mediaRegistry.length} Total Photos
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Select photos to reuse in <strong>{sectionTitle}</strong> without creating duplicate uploads.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── CONTROLS / FILTERS ───────────────────────────────────────── */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Switches */}
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('recommended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'recommended'
                    ? 'bg-white text-[#4338CA] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Recommended ({recommended.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-white text-[#4338CA] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>All School Photos ({all.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-[#131B2E] placeholder-slate-400 focus:outline-none focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center space-x-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" />
              <span>Category:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {CAMPUS_GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-[#4338CA] text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── PHOTOS GRID ─────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {currentList.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">No photos found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {activeTab === 'recommended'
                  ? `No photos specifically matched the category for ${sectionTitle}. Try clicking "All School Photos" to view photos from Campus.`
                  : 'No uploaded photos match your search or filter criteria.'}
              </p>
              {activeTab === 'recommended' && all.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className="mt-2 text-xs font-bold text-[#4338CA] hover:underline cursor-pointer"
                >
                  View All {all.length} School Photos →
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {currentList.map((asset) => {
                const isSelected = selectedAssetIds.has(asset.id);
                const isAlreadyUsed =
                  alreadySelectedSet.has(asset.id.toLowerCase()) ||
                  alreadySelectedSet.has(asset.url.toLowerCase()) ||
                  (asset.hash && alreadySelectedSet.has(asset.hash.toLowerCase()));
                const isBroken = brokenAssetIds.has(asset.id);

                return (
                  <div
                    key={asset.id}
                    onClick={() => !isAlreadyUsed && toggleSelection(asset)}
                    className={`group relative rounded-xl border overflow-hidden flex flex-col transition cursor-pointer ${
                      isAlreadyUsed
                        ? 'border-emerald-200 bg-emerald-50/40 opacity-80 cursor-default'
                        : isSelected
                        ? 'border-[#4338CA] ring-2 ring-[#4338CA]/20 bg-indigo-50/30'
                        : isBroken
                        ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden flex items-center justify-center">
                      {isBroken ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center w-full h-full bg-slate-50">
                          <ImageOff className="w-6 h-6 text-amber-500 mb-1" />
                          <span className="text-[10px] font-bold text-amber-900 leading-tight">File Missing</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 max-w-[120px] truncate">
                            {asset.caption || asset.fileName}
                          </span>
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.caption || asset.fileName}
                          onError={() => setBrokenAssetIds((prev) => new Set(prev).add(asset.id))}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          loading="lazy"
                        />
                      )}

                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        {isAlreadyUsed ? (
                          <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center space-x-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Already added</span>
                          </span>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition shadow-xs ${
                              isSelected
                                ? 'bg-[#4338CA] border-[#4338CA] text-white'
                                : 'bg-white/90 border-slate-300 hover:border-[#4338CA]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        )}
                      </div>

                      {/* Delete button */}
                      {onDeleteAsset && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssetToDelete(asset);
                          }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 text-white hover:text-red-200 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer shadow-xs"
                          title="Delete from Media Library"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {/* Zoom preview button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewAsset(asset);
                        }}
                        className="absolute bottom-2 right-2 w-6 h-6 rounded-md bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/80"
                        title="Preview Full Image"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="p-2.5 space-y-1 text-xs">
                      <div className="font-semibold text-xs text-[#131B2E] truncate" title={asset.fileName}>
                        {asset.fileName}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate">{formatMediaSource(asset.source)}</span>
                        <span>{formatBytes(asset.size)}</span>
                      </div>

                      <div className="pt-0.5 flex flex-wrap gap-1">
                        <span className="text-[9px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                          {formatAssetCategories(asset.categories)}
                        </span>
                        {asset.usedIn.length > 0 && (
                          <span className="text-[9px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded">
                            Used in {asset.usedIn.length}
                          </span>
                        )}
                        {isBroken && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Missing File
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── PREVIEW OVERLAY ─────────────────────────────────────────── */}
        {previewAsset && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs text-slate-900 truncate">{previewAsset.fileName}</span>
                <button
                  type="button"
                  onClick={() => setPreviewAsset(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="aspect-16/10 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-6">
                {brokenAssetIds.has(previewAsset.id) ? (
                  <div className="text-center text-white space-y-2">
                    <ImageOff className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="font-bold text-sm text-white">Image file cannot be loaded</p>
                    <p className="text-xs text-slate-300 max-w-sm">
                      This photo is missing or corrupted from storage ({previewAsset.url}). Re-uploading this photo in its section will restore it.
                    </p>
                  </div>
                ) : (
                  <img
                    src={previewAsset.url}
                    alt={previewAsset.fileName}
                    onError={() => setBrokenAssetIds((prev) => new Set(prev).add(previewAsset.id))}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>{formatMediaSource(previewAsset.source)} • {formatAssetCategories(previewAsset.categories)}</span>
                <div className="flex items-center space-x-3">
                  <span>{formatBytes(previewAsset.size)}</span>
                  {onDeleteAsset && (
                    <button
                      type="button"
                      onClick={() => setAssetToDelete(previewAsset)}
                      className="text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1 cursor-pointer transition text-xs hover:bg-red-50 px-2 py-1 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL FOOTER ────────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-600">
            {selectedAssetIds.size > 0 ? (
              <span className="font-bold text-[#4338CA]">
                {selectedAssetIds.size} photo{selectedAssetIds.size === 1 ? '' : 's'} selected
              </span>
            ) : (
              <span>Select photos to reuse in {sectionTitle}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedAssetIds.size === 0}
              onClick={handleConfirm}
              className={`px-5 py-2 rounded-xl font-bold transition shadow-xs flex items-center space-x-1.5 text-xs ${
                selectedAssetIds.size > 0
                  ? 'bg-[#4338CA] hover:bg-[#3730A3] text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Use Selected Photos ({selectedAssetIds.size})</span>
            </button>
          </div>
        </div>

        {/* ─── CONFIRM DELETE MODAL ────────────────────────────────────── */}
        {assetToDelete && (
          <div className="fixed inset-0 z-70 bg-black/70 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900">Delete from Media Library?</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Are you sure you want to delete <strong>{assetToDelete.fileName}</strong>? It will be removed from the media library and any sections where it was uploaded or attached.
                  </p>
                </div>
              </div>

              {assetToDelete.usedIn.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                  <span className="font-semibold">Notice:</span> This photo is currently active in{' '}
                  <strong>{assetToDelete.usedIn.length} section(s)</strong> ({assetToDelete.usedIn.join(', ')}). Deleting it will detach it from those sections.
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setAssetToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
