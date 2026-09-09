'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  Maximize2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  Star,
} from 'lucide-react';
import type { CampusBranchData, CampusImageData, CampusImageCategory } from '@/lib/types';
import { formatBytes, formatOptimizationStats } from '@/lib/imageUtils';
import {
  CAMPUS_GALLERY_CATEGORIES,
  DEFAULT_CATEGORY_CAPTIONS,
  getDefaultCaptionForCategory,
  MAX_HERO_IMAGES_LIMIT,
  resolveCategoryLabel,
  mapLegacyImageTypeToCategory,
  isCampusImageCategory,
  resolveImageTypeDisplay,
} from '@/lib/schoolIntake';

interface CampusImagesSectionProps {
  campus: CampusBranchData;
  campusIndex: number;
  isSingleCampus: boolean;
  token: string;
  onUpdateImages: (campusIndex: number, images: CampusImageData[]) => void;
  allCampuses?: CampusBranchData[];
}

interface UploadTask {
  id: string;
  file: File;
  name: string;
  targetCategory: CampusImageCategory;
  status: 'uploading' | 'optimizing' | 'validating' | 'done' | 'error';
  message: string;
  errorMessage?: string;
  percentage?: number;
}

export default function CampusImagesSection({
  campus,
  campusIndex,
  isSingleCampus,
  token,
  onUpdateImages,
  allCampuses = [],
}: CampusImagesSectionProps) {
  // Navigation: 'all' or one of the 10 canonical gallery categories
  const [selectedCategory, setSelectedCategory] = useState<'all' | CampusImageCategory>('all');
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<CampusImageData | null>(null);
  const [heroNotice, setHeroNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const images = campus.images || [];

  // Helper to determine the effective category for any image (handles legacy & migration)
  const getEffectiveCategory = useCallback((img: CampusImageData): CampusImageCategory => {
    if (img.category && isCampusImageCategory(img.category)) return img.category;
    if (img.imageCategory && isCampusImageCategory(img.imageCategory)) return img.imageCategory;
    const mapped = mapLegacyImageTypeToCategory(img.imageType);
    return mapped || 'other';
  }, []);

  // Category image counts computed dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: images.length,
      campus_buildings: 0,
      classrooms: 0,
      laboratories: 0,
      library: 0,
      sports_playground: 0,
      activities: 0,
      events: 0,
      transport: 0,
      cafeteria: 0,
      other: 0,
    };
    images.forEach((img) => {
      const cat = getEffectiveCategory(img);
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts['other']++;
      }
    });
    return counts;
  }, [images, getEffectiveCategory]);

  // Filtered images list based on active tab
  const filteredImages = useMemo(() => {
    if (selectedCategory === 'all') return images;
    return images.filter((img) => getEffectiveCategory(img) === selectedCategory);
  }, [images, selectedCategory, getEffectiveCategory]);

  // Current count of photos selected as Home Page Hero slides
  const heroImagesCount = useMemo(
    () => images.filter((im) => Boolean(im.isHero)).length,
    [images]
  );

  // Auto-dismiss hero limit notice after 4 seconds
  useEffect(() => {
    if (!heroNotice) return;
    const timer = setTimeout(() => setHeroNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [heroNotice]);

  // Details of current category definition
  const currentCategoryDef = useMemo(() => {
    if (selectedCategory === 'all') return null;
    return CAMPUS_GALLERY_CATEGORIES.find((c) => c.key === selectedCategory) || null;
  }, [selectedCategory]);

  // Target category for uploading
  const effectiveUploadCategory: CampusImageCategory =
    selectedCategory === 'all' ? 'campus_buildings' : selectedCategory;

  // Trigger file picker for adding images
  const triggerAddImages = () => {
    fileInputRef.current?.click();
  };

  // Trigger file picker for replacing a specific image
  const triggerReplaceImage = (imageId: string) => {
    setReplacingImageId(imageId);
    replaceInputRef.current?.click();
  };

  // Process a single file upload through the canonical server-side Sharp WebP pipeline
  const uploadSingleFile = async (
    file: File,
    targetCategory: CampusImageCategory,
    onProgressUpdate: (update: Partial<UploadTask>) => void
  ): Promise<CampusImageData> => {
    onProgressUpdate({ status: 'uploading', message: 'Uploading original file securely...' });

    const timerOpt = setTimeout(() => {
      onProgressUpdate({ status: 'optimizing', message: 'Server optimizing with Sharp & converting to WebP...' });
    }, 450);

    const timerVal = setTimeout(() => {
      onProgressUpdate({ status: 'validating', message: 'Validating WebP decode and dimensions...' });
    }, 950);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('file', file);
      formData.append('itemId', 'campus-photo');
      formData.append('itemType', 'image');
      formData.append('campusId', campus.id);

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timerOpt);
      clearTimeout(timerVal);

      const json = await res.json();
      if (!res.ok || !json.success || !json.asset) {
        throw new Error(json.error || 'Failed to upload and optimize campus image.');
      }

      const asset = json.asset;
      const stats = formatOptimizationStats(asset.originalSize || asset.size, asset.optimizedSize || asset.size);

      onProgressUpdate({
        status: 'done',
        message: '✓ WebP Optimized',
        percentage: stats ? stats.percentage : undefined,
      });

      const newImage: CampusImageData = {
        id: asset.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        campusId: campus.id,
        storageKey: asset.storageKey,
        fileName: asset.name,
        url: asset.url,
        mimeType: asset.type || 'image/webp',
        width: asset.width ?? null,
        height: asset.height ?? null,
        originalSize: asset.originalSize || asset.size,
        optimizedSize: asset.optimizedSize || asset.size,
        optimizedFormat: asset.optimizedFormat || 'webp',
        displayOrder: images.length,
        createdAt: asset.uploadedAt || new Date().toISOString(),
        checksumSha256: asset.checksumSha256,
        category: targetCategory,
        imageCategory: targetCategory,
        imageType: resolveCategoryLabel(targetCategory),
        customImageType: null,
        isPrimary: images.length === 0,
        caption: DEFAULT_CATEGORY_CAPTIONS[targetCategory] || '',
      };

      return newImage;
    } catch (err: any) {
      clearTimeout(timerOpt);
      clearTimeout(timerVal);
      onProgressUpdate({
        status: 'error',
        message: 'Optimization failed',
        errorMessage: err.message || 'Image upload failed.',
      });
      throw err;
    }
  };

  // Multi-image selection handler
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    e.target.value = ''; // Reset input

    const targetCategory = effectiveUploadCategory;

    // Create tasks for all selected files
    const newTasks: UploadTask[] = filesArray.map((file) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      targetCategory,
      status: 'uploading',
      message: 'Preparing upload...',
    }));

    setUploadTasks((prev) => [...prev, ...newTasks]);

    let workingList = [...images];
    let isFirstBatchOverall = workingList.length === 0;

    for (const task of newTasks) {
      try {
        const uploadedImg = await uploadSingleFile(task.file, targetCategory, (update) => {
          setUploadTasks((current) =>
            current.map((t) => (t.id === task.id ? { ...t, ...update } : t))
          );
        });

        // Set primary on the first image if campus has none
        if (isFirstBatchOverall && workingList.length === 0) {
          uploadedImg.isPrimary = true;
          isFirstBatchOverall = false;
        }

        uploadedImg.displayOrder = workingList.length;
        workingList = [...workingList, uploadedImg];
        onUpdateImages(campusIndex, workingList);
      } catch {
        // Individual failures remain recorded in uploadTasks
      }
    }

    // Clear completed tasks after 4 seconds
    setTimeout(() => {
      setUploadTasks((current) => current.filter((t) => t.status === 'error'));
    }, 4000);
  };

  // Replacement handler: preserves category, caption, primary status, and subtype
  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;

    e.target.value = '';
    const targetId = replacingImageId;
    const oldImage = images.find((im) => im.id === targetId);
    if (!oldImage) return;

    const oldCategory = getEffectiveCategory(oldImage);

    const replaceTask: UploadTask = {
      id: `replace-${Date.now()}`,
      file,
      name: file.name,
      targetCategory: oldCategory,
      status: 'uploading',
      message: `Replacing ${oldImage.fileName}...`,
    };

    setUploadTasks((prev) => [...prev, replaceTask]);

    try {
      const uploadedImg = await uploadSingleFile(file, oldCategory, (update) => {
        setUploadTasks((current) =>
          current.map((t) => (t.id === replaceTask.id ? { ...t, ...update } : t))
        );
      });

      // Preserve all metadata on replace
      const mergedImage: CampusImageData = {
        ...uploadedImg,
        id: uploadedImg.id,
        category: oldCategory,
        imageCategory: oldCategory,
        imageType: oldImage.imageType || resolveCategoryLabel(oldCategory),
        customImageType: oldImage.customImageType ?? null,
        isPrimary: Boolean(oldImage.isPrimary),
        isHero: Boolean(oldImage.isHero),
        caption: oldImage.caption || '',
        displayOrder: oldImage.displayOrder ?? images.findIndex((im) => im.id === targetId),
      };

      const oldStorageKey = oldImage.storageKey;
      const updatedList = images.map((im) => (im.id === targetId ? mergedImage : im));
      onUpdateImages(campusIndex, updatedList);

      // Clean up old storageKey only if not referenced anywhere across campuses
      if (oldStorageKey && oldStorageKey !== mergedImage.storageKey) {
        const isReusedElsewhere = allCampuses.some((c) =>
          c.images?.some((im) => im.storageKey === oldStorageKey)
        );
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

      setReplacingImageId(null);
      setTimeout(() => {
        setUploadTasks((current) => current.filter((t) => t.id !== replaceTask.id));
      }, 3000);
    } catch {
      // Error is displayed in upload tasks banner
    }
  };

  // Re-categorize image without re-uploading and automatically update caption if appropriate
  const handleMoveCategory = (imageId: string, newCategory: CampusImageCategory) => {
    const updated = images.map((im) => {
      if (im.id === imageId) {
        const currentCat = getEffectiveCategory(im);
        const oldDefaultCaption = DEFAULT_CATEGORY_CAPTIONS[currentCat];
        const newDefaultCaption = DEFAULT_CATEGORY_CAPTIONS[newCategory] || '';

        // Auto-update caption if it was empty or matched a standard auto-generated default caption
        const shouldUpdateCaption =
          !im.caption ||
          im.caption.trim() === '' ||
          im.caption === oldDefaultCaption ||
          Object.values(DEFAULT_CATEGORY_CAPTIONS).includes(im.caption);

        return {
          ...im,
          category: newCategory,
          imageCategory: newCategory,
          imageType: resolveCategoryLabel(newCategory),
          // Clear customImageType if new category is not 'other'
          customImageType: newCategory === 'other' ? im.customImageType : null,
          caption: shouldUpdateCaption ? newDefaultCaption : im.caption,
        };
      }
      return im;
    });
    onUpdateImages(campusIndex, updated);
  };

  // Toggle designated primary image (single primary enforcement per campus, or unselect)
  const handleTogglePrimary = (imageId: string) => {
    const target = images.find((im) => im.id === imageId);
    const willBePrimary = !target?.isPrimary;
    const updated = images.map((im) => ({
      ...im,
      isPrimary: im.id === imageId ? willBePrimary : (willBePrimary ? false : Boolean(im.isPrimary)),
    }));
    onUpdateImages(campusIndex, updated);
  };

  // Toggle designated Home Page / Hero image for school website (max 7)
  const handleToggleHero = (imageId: string) => {
    const target = images.find((im) => im.id === imageId);
    if (!target) return;

    if (!target.isHero && heroImagesCount >= MAX_HERO_IMAGES_LIMIT) {
      setHeroNotice(
        `Limit reached: You can select up to ${MAX_HERO_IMAGES_LIMIT} hero photos for the home page slider. Please uncheck another photo first.`
      );
      return;
    }

    setHeroNotice(null);
    const updated = images.map((im) => {
      if (im.id === imageId) {
        return {
          ...im,
          isHero: !im.isHero,
        };
      }
      return im;
    });
    onUpdateImages(campusIndex, updated);
  };

  // Update caption or optional subtype metadata
  const handleUpdateDetails = (
    imageId: string,
    patch: {
      caption?: string;
      imageType?: string;
      customImageType?: string | null;
    }
  ) => {
    const updated = images.map((im) => {
      if (im.id === imageId) {
        return {
          ...im,
          ...patch,
        };
      }
      return im;
    });
    onUpdateImages(campusIndex, updated);
  };

  // Delete image handler with safe unreferenced cleanup
  const handleDeleteImage = async (imageId: string) => {
    const target = images.find((im) => im.id === imageId);
    if (!target) return;

    const filtered = images.filter((im) => im.id !== imageId);
    // Re-index display orders
    filtered.forEach((im, idx) => {
      im.displayOrder = idx;
    });

    // If deleted image was primary, designate first remaining as primary
    if (target.isPrimary && filtered.length > 0 && !filtered.some((im) => im.isPrimary)) {
      filtered[0].isPrimary = true;
    }

    onUpdateImages(campusIndex, filtered);

    // Safely delete storage object if not referenced in any campus
    const storageKey = target.storageKey;
    if (storageKey) {
      const isReusedElsewhere = allCampuses.some((c) =>
        c.images?.some((im) => im.id !== imageId && im.storageKey === storageKey)
      );
      if (!isReusedElsewhere) {
        try {
          await fetch('/api/school-assets/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, storageKey }),
          });
        } catch {
          // Non-blocking cleanup
        }
      }
    }
  };

  // Reorder images within overall list
  const handleReorder = (idxInFiltered: number, direction: 'left' | 'right') => {
    const targetImage = filteredImages[idxInFiltered];
    if (!targetImage) return;

    const currentGlobalIdx = images.findIndex((im) => im.id === targetImage.id);
    const targetGlobalIdx = direction === 'left' ? currentGlobalIdx - 1 : currentGlobalIdx + 1;

    if (targetGlobalIdx < 0 || targetGlobalIdx >= images.length) return;

    const copy = [...images];
    const temp = copy[currentGlobalIdx];
    copy[currentGlobalIdx] = copy[targetGlobalIdx];
    copy[targetGlobalIdx] = temp;

    copy.forEach((im, i) => {
      im.displayOrder = i;
    });
    onUpdateImages(campusIndex, copy);
  };





  // Lightbox Navigation (Scoped strictly to current filtered category!)
  const currentLightboxIndex = previewImage
    ? filteredImages.findIndex((im) => im.id === previewImage.id)
    : -1;

  const handlePrevLightbox = useCallback(() => {
    if (filteredImages.length === 0) return;
    const prevIdx =
      currentLightboxIndex > 0 ? currentLightboxIndex - 1 : filteredImages.length - 1;
    setPreviewImage(filteredImages[prevIdx]);
  }, [currentLightboxIndex, filteredImages]);

  const handleNextLightbox = useCallback(() => {
    if (filteredImages.length === 0) return;
    const nextIdx =
      currentLightboxIndex < filteredImages.length - 1 ? currentLightboxIndex + 1 : 0;
    setPreviewImage(filteredImages[nextIdx]);
  }, [currentLightboxIndex, filteredImages]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
      if (e.key === 'ArrowLeft') handlePrevLightbox();
      if (e.key === 'ArrowRight') handleNextLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage, handlePrevLightbox, handleNextLightbox]);

  const isUploadingActive = uploadTasks.some(
    (t) => t.status === 'uploading' || t.status === 'optimizing' || t.status === 'validating'
  );

  return (
    <div className="md:col-span-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Hidden File Input for Multiple Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/avif"
        onChange={handleFilesSelected}
        className="hidden"
        disabled={isUploadingActive}
        aria-label="Upload multiple campus images"
      />

      {/* Hidden File Input for Single Image Replacement */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/avif"
        onChange={handleReplaceFileSelected}
        className="hidden"
        disabled={isUploadingActive}
        aria-label="Replace campus image"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3.5">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <ImageIcon className="w-4 h-4 text-[#4338CA]" />
            <h4 className="font-bold text-sm text-[#131B2E]">Campus Gallery</h4>
            <span className="text-[10px] font-semibold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-full">
              {images.length} {images.length === 1 ? 'photo' : 'photos'}
            </span>
            {isSingleCampus && campus.isMainCampus && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Primary School Imagery
              </span>
            )}
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
              WEBP
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Organize photos by category so your website gallery stays clean and easy to manage.
          </p>
        </div>

        {/* Global Action: Add Photo Button */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={triggerAddImages}
            disabled={isUploadingActive}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            {isUploadingActive ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>
              {currentCategoryDef ? currentCategoryDef.addBtnLabel : '+ Add Campus Images'}
            </span>
          </button>
        </div>
      </div>

      {/* Category Tabs Navigation */}
      <div className="relative">
        <div
          role="tablist"
          aria-label="Campus Gallery Categories"
          className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none border-b border-[#F1F5F9]"
        >
          {/* All Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer select-none ${
              selectedCategory === 'all'
                ? 'bg-[#4338CA] text-white shadow-2xs'
                : 'bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
            }`}
          >
            <span>All</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200/80 text-slate-700'
              }`}
            >
              {categoryCounts.all}
            </span>
          </button>

          {/* Canonical 10 Categories */}
          {CAMPUS_GALLERY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            const count = categoryCounts[cat.key] || 0;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[#4338CA] text-white shadow-2xs'
                    : 'bg-[#FAF7F2] hover:bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200/60 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Upload Header & Guidance */}
      <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <h5 className="font-bold text-xs text-[#131B2E]">
              {currentCategoryDef ? currentCategoryDef.label : 'All Campus Photos'}
            </h5>
            {currentCategoryDef && (
              <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                Auto-associates as {currentCategoryDef.label}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#64748B]">
            {currentCategoryDef
              ? currentCategoryDef.uploadPrompt
              : 'Viewing every photo uploaded for this campus. Select a specific category above to focus or add photos.'}
          </p>
        </div>

        <button
          type="button"
          onClick={triggerAddImages}
          disabled={isUploadingActive}
          className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-[#4338CA] border border-[#C7D2FE] rounded-xl text-xs font-semibold shadow-2xs transition shrink-0 cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5 text-[#4338CA]" />
          <span>
            {currentCategoryDef ? currentCategoryDef.addBtnLabel : '+ Add Campus Images'}
          </span>
        </button>
      </div>

      {/* Multi-Image Upload Progress Queue */}
      {uploadTasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
            <span>Uploading & Optimizing ({uploadTasks.length} {uploadTasks.length === 1 ? 'file' : 'files'})...</span>
            {uploadTasks.some((t) => t.status === 'error') && (
              <button
                type="button"
                onClick={() => setUploadTasks((curr) => curr.filter((t) => t.status !== 'error'))}
                className="text-[10px] text-rose-600 hover:underline cursor-pointer"
              >
                Dismiss errors
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {uploadTasks.map((task) => (
              <div
                key={task.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  task.status === 'done'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : task.status === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-center space-x-2 min-w-0 pr-2">
                  {task.status === 'done' ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : task.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-[#4338CA] animate-spin shrink-0" />
                  )}
                  <div className="min-w-0 truncate">
                    <span className="font-semibold block truncate" title={task.name}>
                      {task.name}
                    </span>
                    <span className="text-[10px] opacity-80 block truncate">
                      {task.errorMessage ? task.errorMessage : task.message}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[9px] font-semibold bg-white/80 border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-700">
                    {resolveCategoryLabel(task.targetCategory)}
                  </span>
                  {task.percentage !== undefined && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-md">
                      -{task.percentage}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredImages.map((img, idx) => {
            const imgCategory = getEffectiveCategory(img);
            const categoryDef = CAMPUS_GALLERY_CATEGORIES.find((c) => c.key === imgCategory);

            return (
              <div
                key={img.id}
                className={`group relative bg-[#FAF7F2] border rounded-xl overflow-hidden shadow-2xs transition flex flex-col justify-between ${
                  img.isHero
                    ? 'border-indigo-400 ring-1 ring-indigo-300/50 bg-indigo-50/20'
                    : img.isPrimary
                    ? 'border-amber-400 ring-1 ring-amber-300/50 bg-amber-50/20'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                }`}
              >
                {/* Top Half: Thumbnail & Overlay */}
                <div>
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.caption || img.fileName || 'Campus photograph'}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />

                    {/* WebP Badge */}
                    <div className="absolute top-2 left-2 flex items-center space-x-1">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-950/85 text-emerald-300 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-emerald-700/50 shadow-xs">
                        WEBP
                      </span>
                    </div>

                    {/* Top Right Badges */}
                    <div className="absolute top-2 right-2 flex items-center space-x-1">
                      {img.isHero && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-indigo-400 shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Hero</span>
                        </span>
                      )}
                      {img.isPrimary && !img.isHero && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-amber-400 shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-slate-950" />
                          <span>Primary</span>
                        </span>
                      )}
                    </div>

                    {/* Desktop Hover Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img)}
                        title="Preview in Lightbox"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 transition shadow-xs cursor-pointer"
                        aria-label={`Preview ${img.fileName}`}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerReplaceImage(img.id)}
                        title="Replace Image"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-indigo-700 transition shadow-xs cursor-pointer"
                        aria-label={`Replace ${img.fileName}`}
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        title="Delete Image"
                        className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-rose-600 transition shadow-xs cursor-pointer"
                        aria-label={`Delete ${img.fileName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-2.5 bg-white space-y-2 text-[11px]">
                    {/* Filename & Category Badge */}
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className="font-semibold text-[#131B2E] truncate block max-w-[150px]"
                        title={img.fileName}
                      >
                        {img.fileName}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">
                          {categoryDef ? categoryDef.label : resolveCategoryLabel(imgCategory)}
                        </span>
                        {/* Compact Reorder Arrows */}
                        {filteredImages.length > 1 && (
                          <div className="flex items-center text-slate-400">
                            <button
                              type="button"
                              onClick={() => handleReorder(idx, 'left')}
                              disabled={idx === 0 && images.findIndex((im) => im.id === img.id) === 0}
                              title="Move photo left"
                              className="p-0.5 hover:text-slate-700 disabled:opacity-20 cursor-pointer rounded-xs"
                              aria-label="Move left"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorder(idx, 'right')}
                              disabled={
                                idx === filteredImages.length - 1 &&
                                images.findIndex((im) => im.id === img.id) === images.length - 1
                              }
                              title="Move photo right"
                              className="p-0.5 hover:text-slate-700 disabled:opacity-20 cursor-pointer rounded-xs"
                              aria-label="Move right"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 1-Click Home Page Action */}
                    <label
                      className={`flex items-center space-x-2 py-0.5 select-none cursor-pointer ${
                        !img.isHero && heroImagesCount >= MAX_HERO_IMAGES_LIMIT ? 'opacity-70' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(img.isHero)}
                        onChange={() => handleToggleHero(img.id)}
                        className="w-3.5 h-3.5 text-[#4338CA] rounded border-slate-300 focus:ring-[#4338CA] cursor-pointer"
                      />
                      <span className="text-[10.5px] font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>Show on Home Page (Hero)</span>
                        {img.isHero && (
                          <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded-sm">
                            Hero ({heroImagesCount}/{MAX_HERO_IMAGES_LIMIT})
                          </span>
                        )}
                      </span>
                    </label>

                    {/* Divider & Essential Inputs */}
                    <div className="border-t border-[#F1F5F9] pt-2 space-y-2">
                      {/* Caption */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label
                            htmlFor={`caption-${img.id}`}
                            className="block text-[10px] font-medium text-slate-600"
                          >
                            Caption
                          </label>
                          {(!img.caption || img.caption !== DEFAULT_CATEGORY_CAPTIONS[imgCategory]) && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateDetails(img.id, {
                                  caption: DEFAULT_CATEGORY_CAPTIONS[imgCategory] || '',
                                })
                              }
                              className="text-[9px] text-[#4338CA] hover:text-[#3730A3] font-medium hover:underline cursor-pointer"
                              title="Auto-fill recommended caption for this category"
                            >
                              ✨ Auto-suggest
                            </button>
                          )}
                        </div>
                        <input
                          id={`caption-${img.id}`}
                          type="text"
                          value={img.caption || ''}
                          onChange={(e) => handleUpdateDetails(img.id, { caption: e.target.value })}
                          placeholder={DEFAULT_CATEGORY_CAPTIONS[imgCategory] || 'Write a short description...'}
                          className="w-full text-[10px] px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                        />
                      </div>

                      {/* Category Selector */}
                      <div>
                        <label
                          htmlFor={`category-${img.id}`}
                          className="block text-[10px] font-medium text-slate-600 mb-0.5"
                        >
                          Category
                        </label>
                        <select
                          id={`category-${img.id}`}
                          value={imgCategory}
                          onChange={(e) => handleMoveCategory(img.id, e.target.value as CampusImageCategory)}
                          className="w-full text-[10px] font-medium py-1.5 px-2 bg-white border border-[#CBD5E1] rounded-md text-[#131B2E] focus:ring-1 focus:ring-[#4338CA] focus:border-[#4338CA] transition truncate"
                          aria-label={`Category for ${img.fileName}`}
                        >
                          {CAMPUS_GALLERY_CATEGORIES.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Specification if 'other' */}
                      {(imgCategory === 'other' || img.imageType?.toLowerCase() === 'other') && (
                        <div>
                          <label
                            htmlFor={`custom-type-${img.id}`}
                            className="block text-[10px] font-medium text-[#4338CA] mb-0.5"
                          >
                            Specify Custom Type
                          </label>
                          <input
                            id={`custom-type-${img.id}`}
                            type="text"
                            value={img.customImageType || ''}
                            onChange={(e) => handleUpdateDetails(img.id, { customImageType: e.target.value })}
                            placeholder="e.g. Astronomy Observatory"
                            className="w-full text-[10px] px-2 py-1.5 bg-white border border-[#CBD5E1] rounded-md text-[#131B2E] focus:border-[#4338CA] focus:outline-hidden"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          onClick={triggerAddImages}
          className="border-2 border-dashed border-[#CBD5E1] hover:border-[#4338CA]/60 bg-[#FAF7F2]/50 hover:bg-[#FAF7F2] rounded-xl p-8 text-center cursor-pointer transition space-y-2.5 group"
        >
          <div className="w-11 h-11 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center mx-auto text-[#64748B] group-hover:text-[#4338CA] group-hover:border-[#4338CA]/40 transition shadow-2xs">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#131B2E] block">
              {currentCategoryDef
                ? currentCategoryDef.emptyStateText
                : 'No campus photos added yet'}
            </span>
            <span className="text-[11px] text-[#64748B] block pt-0.5 max-w-md mx-auto">
              {currentCategoryDef
                ? currentCategoryDef.description
                : 'Upload entrance, building, classroom, and sports facility photos to build your website gallery.'}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerAddImages();
            }}
            disabled={isUploadingActive}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {currentCategoryDef ? currentCategoryDef.addBtnLabel : '+ Add Campus Images'}
            </span>
          </button>
        </div>
      )}

      {/* Scoped Fullscreen Lightbox Modal */}
      {previewImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#131B2E] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4 sm:p-5 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2 min-w-0 flex-wrap gap-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md">
                  WEBP OPTIMIZED
                </span>
                {previewImage.isPrimary && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                    <span>Primary Campus Image</span>
                  </span>
                )}
                {/* Category Badge */}
                <span className="text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-md">
                  {resolveCategoryLabel(getEffectiveCategory(previewImage))}
                </span>
                {/* Optional Subtype */}
                {previewImage.imageType &&
                  previewImage.imageType !== resolveCategoryLabel(getEffectiveCategory(previewImage)) && (
                    <span className="text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-md">
                      {resolveImageTypeDisplay(previewImage.imageType, previewImage.customImageType)}
                    </span>
                  )}
                <span
                  className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs"
                  title={previewImage.fileName}
                >
                  {previewImage.fileName}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">

                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Preview Image Container with Scoped Prev/Next Controls */}
            <div className="relative max-h-[70vh] flex items-center justify-center bg-black/60 rounded-xl overflow-hidden p-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.caption || previewImage.fileName}
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />

              {/* Prev Navigation Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handlePrevLightbox}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition cursor-pointer shadow-md"
                  aria-label="Previous image"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Next Navigation Button */}
              {filteredImages.length > 1 && (
                <button
                  type="button"
                  onClick={handleNextLightbox}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition cursor-pointer shadow-md"
                  aria-label="Next image"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Caption in Lightbox */}
            {previewImage.caption && (
              <p className="text-xs text-slate-300 italic px-1">
                &ldquo;{previewImage.caption}&rdquo;
              </p>
            )}

            {/* Modal Footer Metadata & Position */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 pt-1 border-t border-slate-800">
              <div className="flex items-center space-x-4">
                <span>
                  <strong>Dimensions:</strong>{' '}
                  {previewImage.width && previewImage.height
                    ? `${previewImage.width} × ${previewImage.height} px`
                    : 'Standard'}
                </span>
                <span>
                  <strong>Size:</strong> {formatBytes(previewImage.optimizedSize || 0)}
                </span>
                {previewImage.originalSize &&
                  previewImage.originalSize > (previewImage.optimizedSize || 0) && (
                    <span className="text-emerald-400 font-medium">
                      (Reduced from {formatBytes(previewImage.originalSize)})
                    </span>
                  )}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {currentLightboxIndex + 1} of {filteredImages.length}{' '}
                {selectedCategory === 'all'
                  ? 'photos'
                  : `in ${resolveCategoryLabel(selectedCategory)}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hero Limit Alert / Toast */}
      {heroNotice && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 text-white text-xs font-medium rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="max-w-xs sm:max-w-sm leading-snug">{heroNotice}</span>
          <button
            type="button"
            onClick={() => setHeroNotice(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
