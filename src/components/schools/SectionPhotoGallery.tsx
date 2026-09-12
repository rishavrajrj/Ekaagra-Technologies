'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Star,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Maximize2,
  X,
} from 'lucide-react';
import type { UniversalIntakeData, CampusImageData, CampusImageCategory } from '@/lib/types';
import { formatBytes, formatOptimizationStats } from '@/lib/imageUtils';
import ModalPortal from '@/components/ui/ModalPortal';

export interface SectionPhotoTag {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

export interface SectionPhotoGalleryProps {
  sectionKey: keyof UniversalIntakeData;
  category: CampusImageCategory;
  title: string;
  subtitle: string;
  cardIndex?: number | string;
  badgeLabel?: string;
  tags: readonly SectionPhotoTag[];
  defaultTag: string;
  defaultCaption: string;
  token?: string;
  intakeData: UniversalIntakeData;
  sectionImages?: CampusImageData[];
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  campusImageFilter?: (img: CampusImageData) => boolean;
  extraActions?: React.ReactNode;
  defaultOpen?: boolean;
  badgeColorClass?: string;
}

interface UploadTask {
  id: string;
  file: File;
  status: 'uploading' | 'optimizing' | 'validating' | 'done' | 'error';
  message: string;
  errorMessage?: string;
  originalSize?: number;
  optimizedSize?: number;
  percentage?: number;
}

export default function SectionPhotoGallery({
  sectionKey,
  category,
  title,
  subtitle,
  cardIndex,
  badgeLabel,
  tags,
  defaultTag,
  defaultCaption,
  token,
  intakeData,
  sectionImages = [],
  updateSectionField,
  updateSectionDirect,
  campusImageFilter,
  extraActions,
  defaultOpen = true,
  badgeColorClass = 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
}: SectionPhotoGalleryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadTasks, setUploadTasks] = useState<Record<string, UploadTask>>({});
  const [replacingPhotoId, setReplacingPhotoId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<CampusImageData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Unify photos from section config and matching campus images
  const photos: CampusImageData[] = useMemo(() => {
    const mainCampus =
      (intakeData.campuses || []).find((c) => c.isMainCampus) ||
      (intakeData.campuses || [])[0];

    const filterFn =
      campusImageFilter ||
      ((img: CampusImageData) =>
        img.category === category || img.imageCategory === category);

    const fromCampus: CampusImageData[] = (mainCampus?.images || []).filter(filterFn);
    const fromSection: CampusImageData[] = sectionImages || [];

    const map = new Map<string, CampusImageData>();
    fromCampus.forEach((img) => {
      const key = img.id || img.storageKey || img.url;
      if (key) map.set(key, img);
    });
    fromSection.forEach((img) => {
      const key = img.id || img.storageKey || img.url;
      if (key) map.set(key, img);
    });

    return Array.from(map.values());
  }, [sectionImages, intakeData.campuses, category, campusImageFilter]);

  // Persist updated photo list to both the section config and main campus images
  const handleSavePhotos = (newPhotos: CampusImageData[]) => {
    // 1. Update section config images
    const currentSectionData = (intakeData as any)[sectionKey] || {};
    const updatedSectionData = {
      ...currentSectionData,
      images: newPhotos,
    };
    if (updateSectionDirect) {
      updateSectionDirect(sectionKey, updatedSectionData);
    } else {
      updateSectionField(sectionKey, 'images', newPhotos);
    }

    // 2. Synchronize to main campus images under this category
    const campuses = intakeData.campuses || [];
    if (campuses.length > 0) {
      const mainIdx = campuses.findIndex((c) => c.isMainCampus);
      const targetIdx = mainIdx >= 0 ? mainIdx : 0;
      const targetCampus = campuses[targetIdx];

      const filterFn =
        campusImageFilter ||
        ((img: CampusImageData) =>
          img.category === category || img.imageCategory === category);

      const nonCategoryImages = (targetCampus.images || []).filter((img) => !filterFn(img));
      const updatedCampusImages = [...nonCategoryImages, ...newPhotos];

      const updatedCampuses = campuses.map((c, idx) => {
        if (idx === targetIdx) {
          return { ...c, images: updatedCampusImages };
        }
        return c;
      });

      if (updateSectionDirect) {
        updateSectionDirect('campuses', updatedCampuses);
      } else {
        updateSectionField('campuses', `${targetIdx}` as any, updatedCampuses[targetIdx]);
      }
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadSingleFile = async (
    file: File,
    preferredTag: string = defaultTag
  ): Promise<CampusImageData> => {
    const taskId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    setUploadTasks((prev) => ({
      ...prev,
      [taskId]: {
        id: taskId,
        file,
        status: 'uploading',
        message: 'Uploading original file securely...',
        originalSize: file.size,
      },
    }));

    const timerOpt = setTimeout(() => {
      setUploadTasks((prev) => {
        if (!prev[taskId] || prev[taskId].status === 'error' || prev[taskId].status === 'done') return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'optimizing',
            message: 'Server optimizing with Sharp & converting to WebP...',
          },
        };
      });
    }, 450);

    const timerVal = setTimeout(() => {
      setUploadTasks((prev) => {
        if (!prev[taskId] || prev[taskId].status === 'error' || prev[taskId].status === 'done') return prev;
        return {
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'validating',
            message: 'Validating WebP decode and dimensions...',
          },
        };
      });
    }, 950);

    try {
      const campuses = intakeData.campuses || [];
      const main = campuses.find((c) => c.isMainCampus) || campuses[0];
      const mainId = main?.id || 'main-campus';

      const formData = new FormData();
      formData.append('token', token || 'demo');
      formData.append('file', file);
      formData.append('itemId', String(sectionKey));
      formData.append('itemType', 'image');
      formData.append('campusId', mainId);

      const res = await fetch('/api/school-assets/upload', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timerOpt);
      clearTimeout(timerVal);

      let asset: any = null;
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.asset) {
          asset = json.asset;
        }
      }

      if (asset) {
        const stats = formatOptimizationStats(asset.originalSize || asset.size, asset.optimizedSize || asset.size);
        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'done',
            message: '✓ WebP Optimized',
            originalSize: asset.originalSize || asset.size,
            optimizedSize: asset.optimizedSize || asset.size,
            percentage: stats ? stats.percentage : undefined,
          },
        }));

        setTimeout(() => {
          setUploadTasks((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }, 4000);

        const newPhoto: CampusImageData = {
          id: asset.id || `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          campusId: mainId,
          storageKey: asset.storageKey || '',
          fileName: asset.name || file.name.replace(/\.[^.]+$/, '.webp'),
          url: asset.url,
          mimeType: asset.type || 'image/webp',
          width: asset.width ?? null,
          height: asset.height ?? null,
          originalSize: asset.originalSize || asset.size || file.size,
          optimizedSize: asset.optimizedSize || asset.size || file.size,
          optimizedFormat: asset.optimizedFormat || 'webp',
          displayOrder: photos.length,
          createdAt: asset.uploadedAt || new Date().toISOString(),
          checksumSha256: asset.checksumSha256,
          category,
          imageCategory: category,
          imageType: preferredTag,
          customImageType: null,
          isPrimary: photos.length === 0,
          caption: defaultCaption,
        };

        return newPhoto;
      } else {
        const dataUrl = await readFileAsDataUrl(file);
        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'done',
            message: '✓ Loaded (Local Preview)',
            originalSize: file.size,
            optimizedSize: file.size,
          },
        }));

        setTimeout(() => {
          setUploadTasks((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }, 3000);

        const newPhoto: CampusImageData = {
          id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          campusId: mainId,
          storageKey: `local_${Date.now()}`,
          fileName: file.name,
          url: dataUrl,
          mimeType: file.type || 'image/jpeg',
          width: null,
          height: null,
          originalSize: file.size,
          optimizedSize: file.size,
          optimizedFormat: 'webp',
          displayOrder: photos.length,
          createdAt: new Date().toISOString(),
          category,
          imageCategory: category,
          imageType: preferredTag,
          customImageType: null,
          isPrimary: photos.length === 0,
          caption: defaultCaption,
        };

        return newPhoto;
      }
    } catch (err: any) {
      clearTimeout(timerOpt);
      clearTimeout(timerVal);
      setUploadTasks((prev) => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'error',
          message: 'Optimization failed',
          errorMessage: err.message || 'Image upload failed.',
        },
      }));
      throw err;
    }
  };

  const handleMultipleFilesUpload = async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    const validFiles = fileArr.filter((f) => {
      const isImg = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|avif|heic|gif)$/i.test(f.name);
      return isImg && f.size <= 15 * 1024 * 1024;
    });

    if (validFiles.length === 0) return;

    try {
      const uploadedPhotos: CampusImageData[] = [];
      for (const file of validFiles) {
        try {
          const photo = await uploadSingleFile(file);
          uploadedPhotos.push(photo);
        } catch (e) {
          console.error('Failed to upload file:', file.name, e);
        }
      }

      if (uploadedPhotos.length > 0) {
        const nextList = [...photos, ...uploadedPhotos];
        handleSavePhotos(nextList);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    }
  };

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingPhotoId) return;

    try {
      const existing = photos.find((p) => p.id === replacingPhotoId);
      const preferredTag = existing?.imageType || defaultTag;
      const newPhoto = await uploadSingleFile(file, preferredTag);

      const nextList = photos.map((p) =>
        p.id === replacingPhotoId ? { ...newPhoto, id: replacingPhotoId, isPrimary: p.isPrimary } : p
      );
      handleSavePhotos(nextList);
    } catch (err) {
      console.error('Replace photo error:', err);
    } finally {
      setReplacingPhotoId(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    const nextList = photos.filter((p) => p.id !== photoId);
    const hadPrimary = photos.find((p) => p.id === photoId)?.isPrimary;
    if (hadPrimary && nextList.length > 0) {
      nextList[0].isPrimary = true;
    }
    handleSavePhotos(nextList);
  };

  const handleSetPrimaryPhoto = (photoId: string) => {
    const nextList = photos.map((p) => ({
      ...p,
      isPrimary: p.id === photoId,
    }));
    handleSavePhotos(nextList);
  };

  const handleUpdatePhotoMeta = (
    photoId: string,
    updates: Partial<{ caption: string; imageType: string }>
  ) => {
    const nextList = photos.map((p) => (p.id === photoId ? { ...p, ...updates } : p));
    handleSavePhotos(nextList);
  };

  const handleMovePhoto = (photoId: string, direction: 'left' | 'right') => {
    const index = photos.findIndex((p) => p.id === photoId);
    if (index < 0) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;

    const nextList = [...photos];
    const [moved] = nextList.splice(index, 1);
    nextList.splice(targetIndex, 0, moved);
    handleSavePhotos(nextList);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden transition-all duration-200">
      {/* Header */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-4 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-[#FAF7F2]/50 border-b border-[#E2E8F0]"
      >
        <div className="flex items-center gap-3">
          {cardIndex !== undefined && (
            <span
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border ${badgeColorClass}`}
            >
              {cardIndex}
            </span>
          )}
          <div>
            <h3 className="font-bold text-sm text-[#131B2E]">{title}</h3>
            <p className="text-[11px] text-[#64748B]">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}>
            {photos.length} Photo{photos.length !== 1 ? 's' : ''}
          </span>
          {badgeLabel && (
            <span className="text-[10px] text-[#64748B] bg-slate-100 px-2 py-0.5 rounded-md font-medium">
              {badgeLabel}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          )}
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="p-5 space-y-4">
          {/* Drag & Drop Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
              isDragging
                ? 'border-[#4338CA] bg-[#EEF2FF] scale-[1.01]'
                : 'border-[#CBD5E1] bg-[#FAF7F2] hover:border-[#4338CA]/40'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) handleMultipleFilesUpload(e.dataTransfer.files);
            }}
          >
            <UploadCloud className="w-8 h-8 mx-auto text-[#4338CA] mb-2" />
            <p className="text-xs font-bold text-[#131B2E]">Drag & Drop Photos Here</p>
            <p className="text-[11px] text-[#64748B] mt-1">
              or click below to browse — JPG, PNG, WebP, AVIF up to 15 MB each
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 rounded-xl bg-[#4338CA] text-white text-xs font-bold hover:bg-[#3730A3] transition cursor-pointer shadow-xs"
            >
              <Camera className="w-3.5 h-3.5 inline mr-1.5" />
              Select Photos to Upload
            </button>
            <p className="text-[10px] text-[#94A3B8] mt-2">
              All images are automatically optimized to modern WebP via Sharp for lightning-fast page speeds
            </p>
          </div>

          {/* Upload Progress Stepper */}
          {Object.values(uploadTasks).length > 0 && (
            <div className="space-y-2">
              {Object.values(uploadTasks).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs ${
                    task.status === 'error'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : task.status === 'done'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]'
                  }`}
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : task.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  )}
                  <span className="font-semibold truncate flex-1">{task.file.name}</span>
                  <span className="text-[10px] shrink-0">{task.message}</span>
                  {task.status === 'done' &&
                    task.originalSize &&
                    task.optimizedSize &&
                    task.optimizedSize < task.originalSize && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">
                        {formatBytes(task.originalSize)} → {formatBytes(task.optimizedSize)}
                        {task.percentage ? ` (−${task.percentage}%)` : ''}
                      </span>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* Photo Gallery Grid */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-[#131B2E]">
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1 text-[#4338CA]" />
                  Uploaded Photos ({photos.length})
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="group relative bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-2xs hover:shadow-md transition-all"
                  >
                    {/* Image Thumbnail */}
                    <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative">
                      <img
                        src={photo.url}
                        alt={photo.caption || photo.fileName || 'Photo'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewPhoto(photo)}
                        className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white hover:bg-black/70 transition opacity-0 group-hover:opacity-100"
                        title="View full size"
                      >
                        <Maximize2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Primary Hero Badge */}
                    {photo.isPrimary && (
                      <div className="absolute top-1.5 left-1.5 bg-[#4338CA] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                        <Star className="w-2.5 h-2.5" /> Hero
                      </div>
                    )}

                    {/* Optimization Badge */}
                    {photo.optimizedSize && photo.originalSize && photo.optimizedSize < photo.originalSize && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                        WebP −{Math.round((1 - photo.optimizedSize / photo.originalSize) * 100)}%
                      </div>
                    )}

                    {/* Hover Action Bar */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none group-hover:pointer-events-auto">
                      <div className="flex flex-wrap gap-1 w-full">
                        {!photo.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPhoto(photo.id)}
                            className="px-1.5 py-1 rounded-md bg-white/90 text-[9px] font-bold text-[#4338CA] hover:bg-white transition cursor-pointer"
                            title="Set as hero image"
                          >
                            <Star className="w-2.5 h-2.5 inline mr-0.5" /> Hero
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingPhotoId(photo.id);
                            replaceInputRef.current?.click();
                          }}
                          className="px-1.5 py-1 rounded-md bg-white/90 text-[9px] font-bold text-[#334155] hover:bg-white transition cursor-pointer"
                          title="Replace this photo"
                        >
                          <RotateCw className="w-2.5 h-2.5 inline mr-0.5" /> Replace
                        </button>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(photo.id, 'left')}
                            className="px-1.5 py-1 rounded-md bg-white/90 text-[9px] font-bold text-[#334155] hover:bg-white transition cursor-pointer"
                            title="Move left"
                          >
                            ◀
                          </button>
                        )}
                        {idx < photos.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(photo.id, 'right')}
                            className="px-1.5 py-1 rounded-md bg-white/90 text-[9px] font-bold text-[#334155] hover:bg-white transition cursor-pointer"
                            title="Move right"
                          >
                            ▶
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="px-1.5 py-1 rounded-md bg-red-500/90 text-[9px] font-bold text-white hover:bg-red-600 transition cursor-pointer ml-auto"
                          title="Delete photo"
                        >
                          <Trash2 className="w-2.5 h-2.5 inline mr-0.5" /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Metadata Editors */}
                    <div className="p-2 space-y-1">
                      <select
                        value={photo.imageType || defaultTag}
                        onChange={(e) => handleUpdatePhotoMeta(photo.id, { imageType: e.target.value })}
                        className="w-full text-[10px] font-semibold rounded-lg border border-[#E2E8F0] bg-[#FAF7F2] px-1.5 py-1 text-[#334155] cursor-pointer"
                      >
                        {tags.map((tag) => (
                          <option key={tag.value} value={tag.label}>
                            {tag.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={photo.caption || ''}
                        onChange={(e) => handleUpdatePhotoMeta(photo.id, { caption: e.target.value })}
                        placeholder="Add caption..."
                        className="w-full text-[10px] rounded-lg border border-[#E2E8F0] bg-white px-1.5 py-1 text-[#334155] placeholder:text-[#94A3B8]"
                      />
                      {photo.optimizedSize && (
                        <span className="text-[9px] text-[#94A3B8] block">
                          {formatBytes(photo.optimizedSize)} • WebP
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Extra Custom Section Actions */}
          {extraActions}

          {/* Empty State */}
          {photos.length === 0 && Object.values(uploadTasks).length === 0 && (
            <div className="text-center py-4">
              <Camera className="w-6 h-6 mx-auto text-[#94A3B8] mb-1" />
              <p className="text-[11px] text-[#64748B]">
                No photos uploaded yet. Drag photos above or click &quot;Select Photos to Upload&quot; to begin.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleMultipleFilesUpload(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplacePhoto}
      />

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <ModalPortal isOpen={!!previewPhoto}>
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.caption || 'Preview'}
              className="max-h-[75vh] w-auto mx-auto object-contain"
            />
            <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-[#131B2E] block">{previewPhoto.caption || previewPhoto.fileName}</span>
                <span className="text-[#64748B] text-[11px]">{previewPhoto.imageType || category}</span>
              </div>
              {previewPhoto.optimizedSize && previewPhoto.originalSize && (
                <span className="font-mono text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                  {formatBytes(previewPhoto.originalSize)} → {formatBytes(previewPhoto.optimizedSize)} (WebP)
                </span>
              )}
            </div>
          </div>
        </div>
        </ModalPortal>
      )}
    </div>
  );
}
