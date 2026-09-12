'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  Copy,
  AlertCircle,
  AlertTriangle,
  Clock,
  MinusCircle,
  ExternalLink,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Sparkles,
  Camera,
  Building2,
  Users,
  Award,
  BookOpen,
  Palette,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Info,
  Download,
  EyeOff,
  Check,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  AssetChecklistItem,
  AssetChecklistCategory,
  AssetChecklistStatus,
  AssetFileMeta,
  CampusImageData,
} from '@/lib/types';
import {
  ASSET_CATEGORIES,
  type AssetCategoryInfo,
  syncAssetChecklistWithIntake,
  calculateAssetChecklistScore,
  evaluatePublicationReadiness,
  validateSchoolAssetFile,
} from '@/lib/schoolAssetChecklist';
import ModalPortal from '@/components/ui/ModalPortal';
import ContentRecommendationAssistant from './ContentRecommendationAssistant';

interface SchoolAssetChecklistSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  token: string;
}

export default function SchoolAssetChecklistSection({
  intakeData,
  updateSectionField,
  token,
}: SchoolAssetChecklistSectionProps) {
  // 1. Synced items with earlier sections
  const items = useMemo(() => {
    return syncAssetChecklistWithIntake(intakeData, intakeData.assetChecklist?.items);
  }, [intakeData]);

  // 2. Filter and search state
  const [selectedCategory, setSelectedCategory] = useState<AssetChecklistCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'required' | 'pending' | 'provided'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  type UploadPhase = 'idle' | 'uploading' | 'optimizing' | 'complete' | 'error';
  const [uploadPhase, setUploadPhase] = useState<Record<string, UploadPhase>>({});
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ id: string; message: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    fileUrl?: string;
    title: string;
    fileName?: string;
    storageKey?: string;
    width?: number;
    height?: number;
    fileSize?: number;
    originalSize?: number;
    optimizedSize?: number;
    isPrivate?: boolean;
  } | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // 3. Completeness score and Publication Readiness
  const score = useMemo(() => {
    return calculateAssetChecklistScore(items);
  }, [items]);

  // Guided remediation: auto-reveal category and reset filter if remediation navigation targets this section
  useEffect(() => {
    const handleRemediation = (e: Event) => {
      const customEvent = e as CustomEvent<{ section: string; subsection?: string; anchorId?: string }>;
      if (customEvent.detail) {
        if (customEvent.detail.subsection) {
          const sub = customEvent.detail.subsection;
          if (sub === 'certificates' || ASSET_CATEGORIES.some((c) => c.key === sub)) {
            setSelectedCategory(sub as any);
          } else {
            setSelectedCategory('all');
          }
        } else {
          setSelectedCategory('all');
        }
        setStatusFilter('all');
        setSearchQuery('');
      }
    };

    window.addEventListener('ekaagra:remediation-navigate', handleRemediation);
    return () => {
      window.removeEventListener('ekaagra:remediation-navigate', handleRemediation);
    };
  }, []);

  const publicationReadiness = useMemo(() => {
    return evaluatePublicationReadiness(items);
  }, [items]);

  // Helper to commit updated items array back into intakeData.assetChecklist.items
  const updateItemInState = useCallback(
    (itemId: string, updates: Partial<AssetChecklistItem>) => {
      const updatedList = items.map((item) => {
        if (item.id === itemId) {
          const newItem = { ...item, ...updates };
          // If status isn't explicitly changed, adjust based on content
          if (!updates.status) {
            if (newItem.type === 'gallery') {
              newItem.status = (newItem.galleryUrls && newItem.galleryUrls.length > 0) ? 'provided' : 'not_provided';
            } else if (newItem.type === 'text') {
              newItem.status = (newItem.textContent && newItem.textContent.trim().length > 0) ? 'provided' : 'not_provided';
            } else {
              newItem.status = (newItem.fileUrl && newItem.fileUrl.trim().length > 0) ? 'provided' : 'not_provided';
            }
          }
          return newItem;
        }
        return item;
      });

      updateSectionField('assetChecklist', 'items', updatedList);

      // Two-way sync: if user updated logo, crest, motto, etc. directly in checklist, sync back to branding/leadership/content
      const target = updatedList.find((i) => i.id === itemId);
      if (target) {
        if (target.id === 'brand-logo') {
          if (target.fileUrl) {
            updateSectionField('brandingDesign', 'logoUrl', target.fileUrl);
            updateSectionField('brandingDesign', 'hasHighResLogo', true);
          } else {
            updateSectionField('brandingDesign', 'logoUrl', '');
            updateSectionField('brandingDesign', 'hasHighResLogo', false);
          }
        } else if (target.id === 'brand-crest') {
          updateSectionField('brandingDesign', 'crestUrl', target.fileUrl || '');
        } else if (target.id === 'brand-favicon') {
          updateSectionField('brandingDesign', 'faviconUrl', target.fileUrl || '');
        } else if (target.id === 'brand-motto') {
          updateSectionField('brandingDesign', 'motto', target.textContent || '');
          updateSectionField('brandingDesign', 'taglineOrMotto', target.textContent || '');
        } else if (target.id === 'lead-principal-msg') {
          updateSectionField('leadership', 'principalMessage', target.textContent || '');
        } else if (target.id === 'lead-principal-photo') {
          updateSectionField('leadership', 'principalPhotoUrl', target.fileUrl || '');
        } else if (target.id === 'acad-about') {
          updateSectionField('schoolContent', 'aboutSchool', target.textContent || '');
        } else if (target.id === 'acad-vision') {
          updateSectionField('brandingDesign', 'visionStatement', target.textContent || '');
          updateSectionField('leadership', 'visionStatement', target.textContent || '');
        } else if (target.id === 'acad-mission') {
          updateSectionField('brandingDesign', 'missionStatement', target.textContent || '');
          updateSectionField('leadership', 'missionStatement', target.textContent || '');
        }
      }
    },
    [items, updateSectionField]
  );

  // Authoritative download URL builder ensuring downloads always return canonical WebP with attachment disposition
  const getAssetDownloadUrl = useCallback(
    (targetItem: { fileUrl?: string; url?: string; storageKey?: string; fileName?: string; isPrivate?: boolean }) => {
      const directUrl = targetItem.fileUrl || targetItem.url;
      if (!directUrl && !targetItem.storageKey) return '';

      // If we have a storageKey and a token, use the authoritative server download route
      if (targetItem.storageKey && token) {
        return `/api/school-assets/download?token=${encodeURIComponent(token)}&key=${encodeURIComponent(
          targetItem.storageKey
        )}&download=1&filename=${encodeURIComponent(targetItem.fileName || '')}`;
      }

      // If directUrl already routes through school-assets/download
      if (directUrl && directUrl.startsWith('/api/school-assets/download')) {
        const delimiter = directUrl.includes('?') ? '&' : '?';
        let url = directUrl;
        if (!url.includes('download=1')) {
          url += `${delimiter}download=1`;
        }
        if (targetItem.fileName && !url.includes('filename=')) {
          url += `&filename=${encodeURIComponent(targetItem.fileName)}`;
        }
        return url;
      }

      // If directUrl contains Supabase storage path, extract storageKey
      if (token && directUrl && !targetItem.storageKey) {
        const match = directUrl.match(/\/(?:school-assets|school-public|school-private)(?:-private)?\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          return `/api/school-assets/download?token=${encodeURIComponent(token)}&key=${encodeURIComponent(
            decodeURIComponent(match[1])
          )}&download=1&filename=${encodeURIComponent(targetItem.fileName || '')}`;
        }
      }

      return directUrl || '';
    },
    [token]
  );

  // Authoritative asset removal handler with safe reference counting (don't delete if reused)
  const handleRemoveAsset = useCallback(
    async (targetItem: AssetChecklistItem) => {
      const oldStorageKey = targetItem.storageKey;

      // 1. Build updated list with targetItem cleared and marked isManualOverride
      const updatedList = items.map((item) => {
        if (item.id === targetItem.id) {
          return {
            ...item,
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            storageKey: undefined,
            width: undefined,
            height: undefined,
            originalSize: undefined,
            optimizedSize: undefined,
            optimizedFormat: undefined,
            status: 'not_provided' as AssetChecklistStatus,
            isManualOverride: true,
            sourceSection: undefined,
            reusedFromId: undefined,
          };
        }
        // If other items reused this asset, unlink/clear them as well
        if (item.reusedFromId === targetItem.id) {
          return {
            ...item,
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            storageKey: undefined,
            width: undefined,
            height: undefined,
            originalSize: undefined,
            optimizedSize: undefined,
            optimizedFormat: undefined,
            status: 'not_provided' as AssetChecklistStatus,
            isManualOverride: true,
            sourceSection: undefined,
            reusedFromId: undefined,
          };
        }
        return item;
      });

      // Update checklist items in parent intake state
      updateSectionField('assetChecklist', 'items', updatedList);

      // 2. Clear corresponding cross-section parent intake fields
      if (targetItem.id === 'brand-logo') {
        updateSectionField('brandingDesign', 'logoUrl', '');
        updateSectionField('brandingDesign', 'crestUrl', '');
        updateSectionField('brandingDesign', 'hasHighResLogo', false);
        updateSectionField('brandingDesign', 'logoFileName', undefined);
        updateSectionField('brandingDesign', 'logoFileSize', undefined);
        updateSectionField('brandingDesign', 'logoWidth', null);
        updateSectionField('brandingDesign', 'logoHeight', null);
        updateSectionField('brandingDesign', 'logoOptimizedFormat', null);
        updateSectionField('brandingDesign', 'logoStorageKey', undefined);
        updateSectionField('brandingDesign', 'logoOriginalSize', undefined);
      } else if (targetItem.id === 'brand-crest') {
        updateSectionField('brandingDesign', 'crestUrl', '');
      } else if (targetItem.id === 'brand-favicon') {
        updateSectionField('brandingDesign', 'faviconUrl', '');
      } else if (targetItem.id === 'lead-principal-photo') {
        updateSectionField('leadership', 'principalPhotoUrl', '');
      }

      // If any dependent item unlinked was brand-crest or brand-favicon, clear its parent field too
      const clearedReusedCrest = items.some((i) => i.reusedFromId === targetItem.id && i.id === 'brand-crest');
      if (clearedReusedCrest) {
        updateSectionField('brandingDesign', 'crestUrl', '');
      }
      const clearedReusedFavicon = items.some((i) => i.reusedFromId === targetItem.id && i.id === 'brand-favicon');
      if (clearedReusedFavicon) {
        updateSectionField('brandingDesign', 'faviconUrl', '');
      }

      // 3. Storage deletion on server
      if (oldStorageKey && token) {
        const isReusedElsewhere = items.some(
          (other) => other.id !== targetItem.id && other.reusedFromId !== targetItem.id && other.storageKey === oldStorageKey
        );
        if (!isReusedElsewhere) {
          try {
            await fetch('/api/school-assets/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, storageKey: oldStorageKey }),
            });
          } catch {
            // Non-fatal cleanup
          }
        }
      }
    },
    [items, updateSectionField, token]
  );

  // Handle reuse toggle: when user checks "Also use as Crest" etc.
  const handleReuseToggle = useCallback(
    (sourceItemId: string, targetItemId: string, checked: boolean) => {
      const sourceItem = items.find((i) => i.id === sourceItemId);
      if (!sourceItem || !sourceItem.fileUrl) return;

      if (checked) {
        // Reuse: copy the source image to the target with full WebP optimization metadata
        updateItemInState(targetItemId, {
          fileUrl: sourceItem.fileUrl,
          fileName: sourceItem.fileName,
          fileSize: sourceItem.fileSize,
          fileType: sourceItem.fileType,
          storageKey: sourceItem.storageKey,
          width: sourceItem.width,
          height: sourceItem.height,
          originalSize: sourceItem.originalSize,
          optimizedSize: sourceItem.optimizedSize,
          optimizedFormat: sourceItem.optimizedFormat,
          status: 'provided',
          reusedFromId: sourceItemId,
          sourceSection: `Reused from ${sourceItem.title}`,
          isManualOverride: true,
        });
        if (targetItemId === 'brand-crest') {
          updateSectionField('brandingDesign', 'crestUrl', sourceItem.fileUrl);
        } else if (targetItemId === 'brand-favicon') {
          updateSectionField('brandingDesign', 'faviconUrl', sourceItem.fileUrl);
        }
      } else {
        // Uncheck: remove the reused image from target
        updateItemInState(targetItemId, {
          fileUrl: undefined,
          fileName: undefined,
          fileSize: undefined,
          fileType: undefined,
          storageKey: undefined,
          width: undefined,
          height: undefined,
          originalSize: undefined,
          optimizedSize: undefined,
          optimizedFormat: undefined,
          status: 'not_provided',
          reusedFromId: undefined,
          sourceSection: undefined,
          isManualOverride: true,
        });
        if (targetItemId === 'brand-crest') {
          updateSectionField('brandingDesign', 'crestUrl', '');
        } else if (targetItemId === 'brand-favicon') {
          updateSectionField('brandingDesign', 'faviconUrl', '');
        }
      }
    },
    [items, updateItemInState, updateSectionField]
  );

  // Campus images available across all campuses (especially Main Campus in single-campus setup)
  const isSingleCampus = (intakeData.campuses || []).length <= 1;
  const campusImages = useMemo(() => {
    const campuses = intakeData.campuses || [];
    return campuses.flatMap((c) =>
      (c.images || []).map((img) => ({
        ...img,
        campusId: img.campusId || c.id,
        campusName: c.name || (c.isMainCampus ? 'Main Campus' : 'Campus Branch'),
        isMain: Boolean(c.isMainCampus),
      }))
    );
  }, [intakeData.campuses]);

  // Handle direct reuse of campus images without re-uploading
  const handleReuseCampusImage = useCallback(
    (targetItemId: string, campusImg: CampusImageData & { campusName?: string }) => {
      const targetItem = items.find((i) => i.id === targetItemId);
      if (!targetItem) return;

      if (targetItem.type === 'gallery') {
        const currentList = targetItem.galleryUrls || [];
        const isMatch = (g: AssetFileMeta) =>
          (Boolean(g.id) && Boolean(campusImg.id) && g.id!.trim() === campusImg.id.trim()) ||
          (Boolean(g.storageKey) && Boolean(campusImg.storageKey) && g.storageKey!.trim() === campusImg.storageKey.trim()) ||
          (Boolean(g.url) && Boolean(campusImg.url) && g.url.trim() === campusImg.url.trim());

        const alreadyIncluded = currentList.some(isMatch);

        if (alreadyIncluded) {
          const filtered = currentList.filter((g) => !isMatch(g));
          updateItemInState(targetItemId, {
            galleryUrls: filtered,
            status: filtered.length > 0 ? 'provided' : 'not_provided',
            isManualOverride: true,
          });
        } else {
          const newAssetMeta: AssetFileMeta = {
            id: campusImg.id || `gal-campus-${Date.now()}`,
            name: campusImg.fileName,
            size: campusImg.optimizedSize || 0,
            type: campusImg.mimeType || 'image/webp',
            url: campusImg.url,
            storageKey: campusImg.storageKey,
            width: campusImg.width || undefined,
            height: campusImg.height || undefined,
            originalSize: campusImg.originalSize,
            optimizedSize: campusImg.optimizedSize,
            optimizedFormat: campusImg.optimizedFormat || 'webp',
            uploadedAt: campusImg.createdAt,
          };
          const updated = [...currentList, newAssetMeta];
          updateItemInState(targetItemId, {
            galleryUrls: updated,
            status: 'provided',
            isManualOverride: true,
          });
        }
      } else {
        const isAlreadySet =
          (Boolean(targetItem.storageKey) && Boolean(campusImg.storageKey) && targetItem.storageKey!.trim() === campusImg.storageKey.trim()) ||
          (Boolean(targetItem.fileUrl) && Boolean(campusImg.url) && targetItem.fileUrl!.trim() === campusImg.url.trim()) ||
          (Boolean(targetItem.reusedFromId) && targetItem.reusedFromId === campusImg.id);

        if (isAlreadySet) {
          updateItemInState(targetItemId, {
            fileUrl: undefined,
            fileName: undefined,
            fileSize: undefined,
            fileType: undefined,
            storageKey: undefined,
            width: undefined,
            height: undefined,
            originalSize: undefined,
            optimizedSize: undefined,
            optimizedFormat: undefined,
            status: 'not_provided',
            reusedFromId: undefined,
            isManualOverride: true,
          });
        } else {
          updateItemInState(targetItemId, {
            fileUrl: campusImg.url,
            fileName: campusImg.fileName,
            fileSize: campusImg.optimizedSize || 0,
            fileType: campusImg.mimeType || 'image/webp',
            storageKey: campusImg.storageKey,
            width: campusImg.width || undefined,
            height: campusImg.height || undefined,
            originalSize: campusImg.originalSize,
            optimizedSize: campusImg.optimizedSize,
            optimizedFormat: campusImg.optimizedFormat || 'webp',
            status: 'provided',
            reusedFromId: campusImg.id,
            sourceSection: `Reused from ${campusImg.campusName || 'Campus'}`,
            isManualOverride: true,
          });
        }
      }
    },
    [items, updateItemInState]
  );

  // Batch reuse of campus images for multi-select / clear actions
  const handleBatchReuseCampusImages = useCallback(
    (
      targetItemId: string,
      campusImgs: (CampusImageData & { campusName?: string })[],
      action: 'select_all' | 'clear_all'
    ) => {
      const targetItem = items.find((i) => i.id === targetItemId);
      if (!targetItem || targetItem.type !== 'gallery') return;

      if (action === 'clear_all') {
        const campusKeys = new Set<string>();
        campusImgs.forEach((c) => {
          if (c.id && c.id.trim()) campusKeys.add(c.id.trim());
          if (c.storageKey && c.storageKey.trim()) campusKeys.add(c.storageKey.trim());
          if (c.url && c.url.trim()) campusKeys.add(c.url.trim());
        });
        const currentList = targetItem.galleryUrls || [];
        const isCampusPhoto = (g: AssetFileMeta) =>
          (Boolean(g.id) && campusKeys.has(g.id!.trim())) ||
          (Boolean(g.storageKey) && campusKeys.has(g.storageKey!.trim())) ||
          (Boolean(g.url) && campusKeys.has(g.url.trim()));

        const remaining = currentList.filter((g) => !isCampusPhoto(g));
        updateItemInState(targetItemId, {
          galleryUrls: remaining,
          status: remaining.length > 0 ? 'provided' : 'not_provided',
          isManualOverride: true,
        });
      } else if (action === 'select_all') {
        const currentList = targetItem.galleryUrls || [];
        const newMetas: AssetFileMeta[] = [];
        campusImgs.forEach((cImg) => {
          const isMatchInList = (list: AssetFileMeta[]) =>
            list.some(
              (g) =>
                (Boolean(g.id) && Boolean(cImg.id) && g.id!.trim() === cImg.id.trim()) ||
                (Boolean(g.storageKey) && Boolean(cImg.storageKey) && g.storageKey!.trim() === cImg.storageKey.trim()) ||
                (Boolean(g.url) && Boolean(cImg.url) && g.url.trim() === cImg.url.trim())
            );

          if (!isMatchInList(currentList) && !isMatchInList(newMetas)) {
            newMetas.push({
              id: cImg.id || `gal-campus-${Date.now()}-${newMetas.length}`,
              name: cImg.fileName,
              size: cImg.optimizedSize || 0,
              type: cImg.mimeType || 'image/webp',
              url: cImg.url,
              storageKey: cImg.storageKey,
              width: cImg.width || undefined,
              height: cImg.height || undefined,
              originalSize: cImg.originalSize,
              optimizedSize: cImg.optimizedSize,
              optimizedFormat: cImg.optimizedFormat || 'webp',
              uploadedAt: cImg.createdAt,
            });
          }
        });
        const updated = [...currentList, ...newMetas];
        updateItemInState(targetItemId, {
          galleryUrls: updated,
          status: updated.length > 0 ? 'provided' : 'not_provided',
          isManualOverride: true,
        });
      }
    },
    [items, updateItemInState]
  );

  // File upload handler
  const handleFileUpload = async (
    item: AssetChecklistItem,
    files: FileList | null
  ) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploadPhase((prev) => ({ ...prev, [item.id]: 'uploading' }));

    try {
      if (item.type === 'gallery') {
        // Multi-image upload for galleries (Campus Photos)
        const newMetas: AssetFileMeta[] = [...(item.galleryUrls || [])];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const validation = validateSchoolAssetFile(
            { name: file.name, size: file.size, type: file.type },
            'gallery'
          );

          if (!validation.isValid) {
            setUploadError({ id: item.id, message: validation.error || 'Invalid file format.' });
            continue;
          }

          // Upload to server endpoint
          let fileUrl = '';
          let optimizedData: any = null;
          try {
            const formData = new FormData();
            formData.append('token', token);
            formData.append('file', file);
            formData.append('itemId', item.id);
            formData.append('itemType', 'gallery');

            setUploadPhase((prev) => ({ ...prev, [item.id]: 'optimizing' }));
            const res = await fetch('/api/school-assets/upload', {
              method: 'POST',
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success && data.asset?.url) {
                fileUrl = data.asset.url;
                optimizedData = data.asset;
              }
            }
          } catch {
            // Offline/fallback to Data URL
          }

          if (!fileUrl) {
            fileUrl = await readFileAsDataUrl(file);
          }

          const isWebp = optimizedData?.optimizedFormat === 'webp' || fileUrl.includes('.webp');
          const finalName = optimizedData?.name || (isWebp ? file.name.replace(/\.[^.]+$/, '.webp') : file.name);

          newMetas.push({
            id: optimizedData?.id || `gal-${Date.now()}-${i}`,
            name: finalName,
            size: optimizedData?.size || file.size,
            type: optimizedData?.type || (isWebp ? 'image/webp' : file.type),
            url: fileUrl,
            storageKey: optimizedData?.storageKey,
            uploadedAt: new Date().toISOString(),
            width: optimizedData?.width,
            height: optimizedData?.height,
            originalSize: optimizedData?.originalSize,
            optimizedSize: optimizedData?.optimizedSize,
            optimizedFormat: optimizedData?.optimizedFormat || (isWebp ? 'webp' : undefined),
          });
        }

        updateItemInState(item.id, {
          galleryUrls: newMetas,
          status: newMetas.length > 0 ? 'provided' : 'not_provided',
        });
        
        setUploadPhase((prev) => ({ ...prev, [item.id]: 'complete' }));
        setTimeout(() => setUploadPhase((prev) => ({ ...prev, [item.id]: 'idle' })), 2000);
      } else {
        // Single file upload (Image or Document)
        const file = files[0];
        const validation = validateSchoolAssetFile(
          { name: file.name, size: file.size, type: file.type },
          item.type === 'document' ? 'document' : 'image'
        );

        if (!validation.isValid) {
          setUploadError({ id: item.id, message: validation.error || 'Invalid file format.' });
          setUploadPhase((prev) => ({ ...prev, [item.id]: 'error' }));
          return;
        }

        let fileUrl = '';
        let optimizedData: any = null;
        try {
          const formData = new FormData();
          formData.append('token', token);
          formData.append('file', file);
          formData.append('itemId', item.id);
          formData.append('itemType', item.type);

          setUploadPhase((prev) => ({ ...prev, [item.id]: 'optimizing' }));
          const res = await fetch('/api/school-assets/upload', {
            method: 'POST',
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.asset?.url) {
              fileUrl = data.asset.url;
              optimizedData = data.asset;
            }
          }
        } catch {
          // Fallback to Data URL
        }

        if (!fileUrl) {
          fileUrl = await readFileAsDataUrl(file);
        }

        const isWebp = optimizedData?.optimizedFormat === 'webp' || fileUrl.includes('.webp');
        const finalName = optimizedData?.name || (isWebp ? file.name.replace(/\.[^.]+$/, '.webp') : file.name);
        const finalSize = optimizedData?.size || file.size;
        const finalType = optimizedData?.type || (isWebp ? 'image/webp' : file.type);
        const oldStorageKey = item.storageKey;

        updateItemInState(item.id, {
          fileUrl,
          fileName: finalName,
          fileSize: finalSize,
          fileType: finalType,
          storageKey: optimizedData?.storageKey,
          status: 'provided',
          width: optimizedData?.width,
          height: optimizedData?.height,
          originalSize: optimizedData?.originalSize,
          optimizedSize: optimizedData?.optimizedSize,
          optimizedFormat: optimizedData?.optimizedFormat || (isWebp ? 'webp' : undefined),
          isManualOverride: true,
        });

        // Safe replace cleanup: remove old storage object only if not reused elsewhere
        if (oldStorageKey && optimizedData?.storageKey && oldStorageKey !== optimizedData.storageKey && token) {
          const isReusedElsewhere = items.some(
            (other) => other.id !== item.id && other.storageKey === oldStorageKey
          );
          if (!isReusedElsewhere) {
            try {
              fetch('/api/school-assets/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, storageKey: oldStorageKey }),
              }).catch(() => {});
            } catch {
              // Non-fatal cleanup
            }
          }
        }
        
        setUploadPhase((prev) => ({ ...prev, [item.id]: 'complete' }));
        setTimeout(() => setUploadPhase((prev) => ({ ...prev, [item.id]: 'idle' })), 2000);
      }
    } catch (err: any) {
      setUploadError({
        id: item.id,
        message: err.message || 'An error occurred during file upload.',
      });
      setUploadPhase((prev) => ({ ...prev, [item.id]: 'error' }));
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

  // Filter items based on active criteria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'required' && item.requirement !== 'required') {
        return false;
      }
      if (statusFilter === 'pending' && item.status !== 'pending' && (item.requirement === 'required' && item.status !== 'provided' && item.status !== 'not_applicable')) {
        return false;
      }
      if (statusFilter === 'provided' && item.status !== 'provided') {
        return false;
      }

      // Search query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesUse = (item.intendedUse || '').toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUse && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [items, selectedCategory, statusFilter, searchQuery]);

  // Group filtered items by category
  const groupedItems = useMemo(() => {
    const groups: { category: AssetCategoryInfo; items: AssetChecklistItem[] }[] = [];
    ASSET_CATEGORIES.forEach((cat) => {
      const catItems = filteredItems.filter((i) => i.category === cat.key);
      if (catItems.length > 0) {
        groups.push({ category: cat, items: catItems });
      }
    });
    return groups;
  }, [filteredItems]);

  const getCategoryIcon = (key: AssetChecklistCategory) => {
    switch (key) {
      case 'branding':
        return <Palette className="w-4 h-4 text-[#4338CA]" />;
      case 'campus_photos':
        return <Camera className="w-4 h-4 text-[#4338CA]" />;
      case 'leadership':
        return <Users className="w-4 h-4 text-[#4338CA]" />;
      case 'academic_content':
        return <BookOpen className="w-4 h-4 text-[#4338CA]" />;
      case 'admissions':
        return <Award className="w-4 h-4 text-[#4338CA]" />;
      case 'certificates':
        return <FileCheck className="w-4 h-4 text-[#4338CA]" />;
      case 'policies':
        return <FileText className="w-4 h-4 text-[#4338CA]" />;
      default:
        return <Building2 className="w-4 h-4 text-[#4338CA]" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* 1. Summary & Real Progress Panel */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
              <h3 className="font-bold text-sm text-[#131B2E]">Asset Provisioning Readiness</h3>
            </div>
            <p className="text-xs text-[#64748B]">
              Ekaagra requires these institutional materials to design, build, and publish your official website.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-auto shrink-0">
            <div className="text-right">
              <div className="text-lg sm:text-xl font-extrabold text-[#131B2E]">
                {score.percentage}%
              </div>
              <div className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
                Completion Score
              </div>
            </div>

            <div className="w-12 h-12 rounded-full border-4 border-[#EEF2FF] flex items-center justify-center relative">
              <div
                className="w-12 h-12 rounded-full border-4 border-[#4338CA] absolute inset-0"
                style={{
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    score.percentage >= 25 ? '100% 0%,' : ''
                  }${score.percentage >= 50 ? '100% 100%,' : ''}${
                    score.percentage >= 75 ? '0% 100%,' : ''
                  }${score.percentage >= 100 ? '0% 0%,' : ''}${
                    50 + 50 * Math.sin((score.percentage / 100) * 2 * Math.PI)
                  }% ${50 - 50 * Math.cos((score.percentage / 100) * 2 * Math.PI)}%)`,
                }}
              />
              <span className="text-xs font-bold text-[#4338CA] relative z-10">
                {score.providedRequired}/{score.totalRequired}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full h-2.5 rounded-full bg-[#EEF2FF] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                score.percentage === 100
                  ? 'bg-emerald-600'
                  : score.percentage >= 60
                  ? 'bg-[#4338CA]'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${score.percentage}%` }}
              role="progressbar"
              aria-valuenow={score.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Asset checklist progress"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#64748B] pt-1">
            <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{score.providedRequired} Required Provided</span>
            </div>

            {score.pendingRequired > 0 ? (
              <div className="flex items-center space-x-1.5 text-amber-800 font-medium">
                <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                <span>{score.pendingRequired} Required Pending / Provide Later</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>All Required Items Ready</span>
              </div>
            )}

            <div className="flex items-center space-x-1.5 text-[#64748B]">
              <Info className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
              <span>{score.recommendedCount + score.optionalCount} Optional / Recommended</span>
            </div>
          </div>
        </div>

        {/* Website Publication Readiness */}
        <div className="pt-3 border-t border-[#E2E8F0]">
          <div className="bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  publicationReadiness.isReadyForPublication ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="font-bold text-[#131B2E]">Website Publication Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                  publicationReadiness.isReadyForPublication
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {publicationReadiness.isReadyForPublication
                  ? 'Ready for Public Launch'
                  : `${publicationReadiness.blockingItems.length} Publication Blockers Pending`}
              </span>
            </div>

            <span className="text-[11px] text-[#64748B]">
              {publicationReadiness.isReadyForPublication
                ? 'All mandatory institutional and statutory disclosures verified.'
                : `Must be provided before public launch: ${publicationReadiness.blockingItems.slice(0, 2).map((b) => b.title).join(', ')}${publicationReadiness.blockingItems.length > 2 ? '...' : ''}`}
            </span>
          </div>
        </div>

        {/* Sync Attribution Notice */}
        <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between gap-3 text-[11px] text-[#4338CA] bg-[#EEF2FF]/60 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3 px-5 sm:px-6 rounded-b-2xl">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 shrink-0 text-[#4338CA]" />
            <span className="font-medium">
              Information already entered in earlier sections (Logo, Motto, Principal Message, About Us) is automatically synced.
            </span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-white px-2 py-0.5 rounded border border-[#C7D2FE] shrink-0">
            Zero Duplication
          </span>
        </div>
      </div>

      {/* 2. Filter, Search & Category Navigation */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets (e.g. Logo, Principal, Campus, Affiliation, Policy)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] text-xs text-[#131B2E] placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10 focus:outline-hidden transition shadow-2xs"
              aria-label="Search asset checklist"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#131B2E] p-0.5 rounded"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                  : 'bg-[#FAF7F2] text-[#64748B] hover:text-[#131B2E] border border-[#E2E8F0]'
              }`}
            >
              All ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('required')}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                statusFilter === 'required'
                  ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                  : 'bg-[#FAF7F2] text-[#64748B] hover:text-[#131B2E] border border-[#E2E8F0]'
              }`}
            >
              Required ({score.totalRequired})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                statusFilter === 'pending'
                  ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                  : 'bg-[#FAF7F2] text-[#64748B] hover:text-[#131B2E] border border-[#E2E8F0]'
              }`}
            >
              Pending ({score.pendingRequired})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('provided')}
              className={`px-3 py-1.5 rounded-lg font-medium transition text-xs whitespace-nowrap ${
                statusFilter === 'provided'
                  ? 'bg-[#4338CA] text-white shadow-2xs font-semibold'
                  : 'bg-[#FAF7F2] text-[#64748B] hover:text-[#131B2E] border border-[#E2E8F0]'
              }`}
            >
              Provided ({score.providedRequired})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E2E8F0] scrollbar-none text-[11px]">
          <span className="text-[#64748B] font-semibold text-[10px] uppercase tracking-wider pr-1 shrink-0">
            Group:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-md transition shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#131B2E] text-white font-semibold'
                : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
            }`}
          >
            All Groups
          </button>
          {ASSET_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-md transition shrink-0 ${
                selectedCategory === cat.key
                  ? 'bg-[#131B2E] text-white font-semibold'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
              }`}
            >
              {cat.letter}. {cat.title.split('&')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Grouped Checklist Content */}
      {groupedItems.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-3 shadow-2xs">
          <AlertCircle className="w-8 h-8 text-[#94A3B8] mx-auto" />
          <h4 className="font-bold text-sm text-[#131B2E]">No matching checklist items found</h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Try adjusting your search query or reset the filter filters to display all checklist items.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setSelectedCategory('all');
            }}
            className="px-4 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] text-xs font-semibold rounded-xl transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(({ category, items: catItems }) => (
            <div
              key={category.key}
              className="bg-white border border-[#E2E8F0] rounded-2xl overflow-visible shadow-2xs"
            >
              {/* Category Header */}
              <div className="bg-[#FAF7F2] border-b border-[#E2E8F0] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-t-2xl">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center shrink-0">
                    {getCategoryIcon(category.key)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#131B2E]">
                      Group {category.letter}: {category.title}
                    </h4>
                    <p className="text-[11px] text-[#64748B] leading-tight">
                      {category.description}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-semibold text-[#64748B] bg-white border border-[#E2E8F0] px-2.5 py-0.5 rounded-full self-start sm:self-auto shrink-0">
                  {catItems.filter((i) => i.status === 'provided').length} of {catItems.length} Provided
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#E2E8F0]">
                {catItems.map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    uploadPhase={uploadPhase[item.id] || 'idle'}
                    uploadError={uploadError?.id === item.id ? uploadError.message : null}
                    onUpload={(files) => handleFileUpload(item, files)}
                    onUpdate={(updates) => updateItemInState(item.id, updates)}
                    onPreview={(url, title, meta) => setPreviewImage({ url, fileUrl: url, title, ...meta })}
                    isNotesExpanded={Boolean(expandedNotes[item.id])}
                    onToggleNotes={() =>
                      setExpandedNotes((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    allItems={items}
                    onReuseToggle={handleReuseToggle}
                    formatFileSize={formatFileSize}
                    copiedUrlId={copiedUrlId}
                    setCopiedUrlId={setCopiedUrlId}
                    getDownloadUrl={getAssetDownloadUrl}
                    onRemoveAsset={handleRemoveAsset}
                    campusImages={campusImages}
                    isSingleCampus={isSingleCampus}
                    campuses={intakeData.campuses}
                    onReuseCampusImage={handleReuseCampusImage}
                    onBatchReuseCampusImages={handleBatchReuseCampusImages}
                    intakeData={intakeData}
                    token={token}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Image Preview Modal */}
      {previewImage && (
        <LightboxModal 
          previewImage={previewImage}
          onClose={() => setPreviewImage(null)}
          formatFileSize={formatFileSize}
          getDownloadUrl={getAssetDownloadUrl}
        />
      )}
    </div>
  );
}

// Subcomponent for individual checklist row
interface ChecklistItemRowProps {
  item: AssetChecklistItem;
  uploadPhase: 'idle' | 'uploading' | 'optimizing' | 'complete' | 'error';
  uploadError: string | null;
  onUpload: (files: FileList | null) => void;
  onUpdate: (updates: Partial<AssetChecklistItem>) => void;
  onPreview: (url: string, title: string, meta?: any) => void;
  isNotesExpanded: boolean;
  onToggleNotes: () => void;
  allItems: AssetChecklistItem[];
  onReuseToggle: (sourceItemId: string, targetItemId: string, checked: boolean) => void;
  formatFileSize: (bytes?: number) => string;
  copiedUrlId: string | null;
  setCopiedUrlId: (id: string | null) => void;
  getDownloadUrl: (targetItem: { fileUrl?: string; url?: string; storageKey?: string; fileName?: string; isPrivate?: boolean }) => string;
  onRemoveAsset: (targetItem: AssetChecklistItem) => void;
  campusImages?: (CampusImageData & { campusName?: string; isMain?: boolean })[];
  isSingleCampus?: boolean;
  campuses?: { id: string; name: string; isMainCampus: boolean; images?: CampusImageData[] }[];
  onReuseCampusImage?: (targetItemId: string, campusImg: CampusImageData & { campusName?: string }) => void;
  onBatchReuseCampusImages?: (
    targetItemId: string,
    campusImgs: (CampusImageData & { campusName?: string })[],
    action: 'select_all' | 'clear_all'
  ) => void;
  intakeData: UniversalIntakeData;
  token?: string;
}

function ChecklistItemRow({
  item,
  uploadPhase,
  uploadError,
  onUpload,
  onUpdate,
  onPreview,
  isNotesExpanded,
  onToggleNotes,
  allItems,
  onReuseToggle,
  formatFileSize,
  copiedUrlId,
  setCopiedUrlId,
  getDownloadUrl,
  onRemoveAsset,
  campusImages,
  isSingleCampus,
  campuses,
  onReuseCampusImage,
  onBatchReuseCampusImages,
  intakeData,
  token,
}: ChecklistItemRowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localText, setLocalText] = useState(item.textContent || '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCampusPicker, setShowCampusPicker] = useState(false);
  const [pickerFilter, setPickerFilter] = useState<'all' | 'selected' | 'unselected'>('all');
  const [hideSelectedInPicker, setHideSelectedInPicker] = useState(false);
  const [selectedCampusBranchId, setSelectedCampusBranchId] = useState<string>('all');
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(true);

  // Set of selected keys/urls for fast lookup
  const selectedCampusKeys = useMemo(() => {
    const set = new Set<string>();
    (item.galleryUrls || []).forEach((g) => {
      if (g.storageKey && g.storageKey.trim()) set.add(g.storageKey.trim());
      if (g.url && g.url.trim()) set.add(g.url.trim());
      if (g.id && g.id.trim()) set.add(g.id.trim());
    });
    return set;
  }, [item.galleryUrls]);

  const isCampusImgIncluded = useCallback(
    (cImg: CampusImageData) => {
      if (cImg.id && selectedCampusKeys.has(cImg.id.trim())) return true;
      if (cImg.storageKey && selectedCampusKeys.has(cImg.storageKey.trim())) return true;
      if (cImg.url && selectedCampusKeys.has(cImg.url.trim())) return true;
      return false;
    },
    [selectedCampusKeys]
  );

  const campusImagesCount = campusImages?.length || 0;
  const selectedCount = useMemo(() => {
    if (!campusImages) return 0;
    return campusImages.filter((c) => isCampusImgIncluded(c)).length;
  }, [campusImages, isCampusImgIncluded]);
  const unselectedCount = Math.max(0, campusImagesCount - selectedCount);

  // Filtered campus images list for clean visibility, campus branch filter, and show/hide logic
  const filteredCampusImages = useMemo(() => {
    if (!campusImages) return [];
    return campusImages.filter((cImg) => {
      if (selectedCampusBranchId !== 'all' && cImg.campusId !== selectedCampusBranchId) {
        return false;
      }
      const included = isCampusImgIncluded(cImg);
      if (pickerFilter === 'selected' && !included) return false;
      if (pickerFilter === 'unselected' && included) return false;
      if (pickerFilter === 'all' && hideSelectedInPicker && included) return false;
      return true;
    });
  }, [campusImages, isCampusImgIncluded, selectedCampusBranchId, pickerFilter, hideSelectedInPicker]);

  const unselectedVisibleCount = useMemo(() => {
    return filteredCampusImages.filter((c) => !isCampusImgIncluded(c)).length;
  }, [filteredCampusImages, isCampusImgIncluded]);

  const isUploading = uploadPhase === 'uploading' || uploadPhase === 'optimizing';

  const isProvided = item.status === 'provided';
  const isPending = item.status === 'pending';
  const isNotApplicable = item.status === 'not_applicable';

  return (
    <div
      id={`asset-row-${item.id}`}
      data-checklist-item-id={item.id}
      className={`p-4 sm:p-5 transition-colors ${
        isProvided
          ? 'bg-white'
          : isPending
          ? 'bg-amber-50/20'
          : isNotApplicable
          ? 'bg-slate-50/60'
          : 'bg-white'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        {/* Left Side: Information & Metadata */}
        <div className="space-y-1.5 flex-1 min-w-0 sm:min-w-[280px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-xs sm:text-sm text-[#131B2E]">
              {item.title}
            </span>

            {/* Requirement Badge */}
            {item.requirement === 'statutory' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                Statutory
              </span>
            )}
            {item.requirement === 'conditional' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                Conditional
              </span>
            )}
            {item.requirement === 'required' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                Required
              </span>
            )}
            {item.requirement === 'recommended' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                Recommended
              </span>
            )}
            {item.requirement === 'optional' && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                Optional
              </span>
            )}

            {/* Status Badge */}
            {isProvided && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>{item.sourceSection ? (item.sourceSection.includes('Recommended') ? 'Provided' : 'Already Available') : 'Provided'}</span>
              </span>
            )}
            {item.status === 'recommended_available' && !isProvided && (
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>Recommended Available</span>
              </span>
            )}
            {item.requiresReview && item.contentSource === 'template' && (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Needs Review</span>
              </span>
            )}
            {(isPending || item.status === 'will_provide_later') && (
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span>Will provide later</span>
              </span>
            )}
            {isNotApplicable && (
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <MinusCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Not applicable</span>
              </span>
            )}
            {!isProvided && !isPending && !isNotApplicable && item.status !== 'recommended_available' && (
              <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                Not provided
              </span>
            )}

            {/* Sourced Section Pill */}
            {item.sourceSection && (
              <span className="text-[10px] font-medium text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md">
                Source: {item.sourceSection}
              </span>
            )}

            {/* Reused From Badge */}
            {item.reusedFromId && (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Copy className="w-3 h-3" />
                <span>Linked from {allItems.find((i) => i.id === item.reusedFromId)?.title || 'Logo'}</span>
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748B] leading-relaxed">
            {item.description}
          </p>

          {item.intendedUse && (
            <div className="flex items-center space-x-1.5 text-[11px] text-[#4338CA]">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Intended Use:</strong> {item.intendedUse}
              </span>
            </div>
          )}

          {/* Validation Error Banner */}
          {uploadError && (
            <div
              role="alert"
              className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Right Side: Action Controls & Form Inputs */}
        <div className="shrink-0 w-full lg:w-auto flex flex-col items-start lg:items-end gap-2.5">
          {/* A. Image Asset Controls */}
          {item.type === 'image' && (
            <div className="w-full sm:w-auto">
              {item.fileUrl && !isNotApplicable ? (
                <div className="flex items-center gap-3 bg-[#FAF7F2] border border-[#E2E8F0] p-2 rounded-xl">
                  {/* Thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onPreview(item.fileUrl!, item.title, {
                      fileUrl: item.fileUrl,
                      fileName: item.fileName,
                      fileSize: item.fileSize,
                      storageKey: item.storageKey,
                      width: item.width,
                      height: item.height,
                      originalSize: item.originalSize,
                      optimizedSize: item.optimizedSize,
                      isPrivate: item.isPrivate
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onPreview(item.fileUrl!, item.title, {
                        fileUrl: item.fileUrl,
                        fileName: item.fileName,
                        fileSize: item.fileSize,
                        storageKey: item.storageKey,
                        width: item.width,
                        height: item.height,
                        originalSize: item.originalSize,
                        optimizedSize: item.optimizedSize,
                        isPrivate: item.isPrivate
                      });
                    }}
                    className="w-10 h-10 rounded-lg bg-white border border-[#CBD5E1] overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition relative shrink-0"
                    title="Click to preview image"
                    aria-label={`Preview ${item.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.fileUrl}
                      alt={item.title}
                      className="w-full h-full object-contain"
                    />
                    <Eye className="w-3 h-3 text-[#4338CA] absolute bottom-0.5 right-0.5 bg-white/90 rounded p-0.5" />
                  </div>

                  {/* File Info */}
                  <div className="text-xs min-w-[120px] max-w-[180px]">
                    <div className="font-semibold text-[#131B2E] truncate" title={item.fileName || 'Asset Image'}>
                      {item.fileName || 'Provided Image'}
                    </div>
                    <div className="text-[10px] text-[#64748B] flex flex-col gap-0.5 mt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{item.fileSize ? formatFileSize(item.fileSize) : 'Available'}</span>
                        {item.width && item.height && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                            <span>{item.width}×{item.height}</span>
                          </>
                        )}
                        {item.optimizedFormat && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                            <span className="uppercase text-[#4338CA] font-medium">{item.optimizedFormat}</span>
                          </>
                        )}
                      </div>
                      {item.optimizedSize && item.originalSize && item.optimizedSize < item.originalSize && (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit font-medium">
                          Saved {Math.round((1 - item.optimizedSize / item.originalSize) * 100)}% size
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons (Desktop) */}
                  <div className="hidden sm:flex items-center space-x-1 pl-2 border-l border-[#E2E8F0]">
                    <a
                      href={getDownloadUrl(item)}
                      download={item.fileName}
                      className="p-1.5 text-[#4338CA] hover:bg-[#EEF2FF] rounded-lg transition"
                      title="Download image"
                      aria-label={`Download ${item.title}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    {!item.isPrivate && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(item.fileUrl!);
                          setCopiedUrlId(item.id);
                          setTimeout(() => setCopiedUrlId(null), 2000);
                        }}
                        className="p-1.5 text-[#4338CA] hover:bg-[#EEF2FF] rounded-lg transition"
                        title="Copy URL"
                        aria-label={`Copy URL for ${item.title}`}
                      >
                        {copiedUrlId === item.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1.5 text-[#4338CA] hover:bg-[#EEF2FF] rounded-lg transition"
                      title="Replace image"
                      aria-label={`Replace ${item.title}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onRemoveAsset(item)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove image"
                      aria-label={`Remove ${item.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Action Buttons (Mobile Dropdown) */}
                  <div className="sm:hidden relative pl-2 border-l border-[#E2E8F0]">
                    <button
                      type="button"
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition"
                      aria-label="More actions"
                    >
                      <div className="flex flex-col gap-0.5 items-center justify-center h-4 w-4">
                        <span className="w-1 h-1 bg-current rounded-full" />
                        <span className="w-1 h-1 bg-current rounded-full" />
                        <span className="w-1 h-1 bg-current rounded-full" />
                      </div>
                    </button>
                    
                    {isMobileMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-30 py-1 overflow-hidden flex flex-col">
                        <a
                          href={getDownloadUrl(item)}
                          download={item.fileName}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[#131B2E] hover:bg-[#F8FAFC]"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Download className="w-3.5 h-3.5 text-[#64748B]" /> Download
                        </a>
                        {!item.isPrivate && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.fileUrl!);
                              setCopiedUrlId(item.id);
                              setTimeout(() => setCopiedUrlId(null), 2000);
                              setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-[#131B2E] hover:bg-[#F8FAFC] text-left"
                          >
                            <Copy className="w-3.5 h-3.5 text-[#64748B]" /> Copy URL
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-[#131B2E] hover:bg-[#F8FAFC] text-left"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#64748B]" /> Replace
                        </button>
                        <div className="h-px bg-[#E2E8F0] my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            onRemoveAsset(item);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {uploadPhase === 'error' ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold rounded-xl shadow-2xs transition active:scale-[0.98]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Upload</span>
                    </button>
                  ) : uploadPhase === 'complete' ? (
                    <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Optimized</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isNotApplicable}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl shadow-2xs transition active:scale-[0.98] ${
                        isNotApplicable ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      aria-label={`Upload ${item.title}`}
                    >
                      {uploadPhase === 'uploading' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : uploadPhase === 'optimizing' ? (
                        <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {uploadPhase === 'uploading' ? 'Uploading...' : uploadPhase === 'optimizing' ? 'Optimizing...' : 'Upload Image'}
                      </span>
                    </button>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg"
                onChange={(e) => onUpload(e.target.files)}
                className="hidden"
                aria-label={`Upload file for ${item.title}`}
              />
            </div>
          )}

          {/* Reuse Image Checkboxes */}
          {item.type === 'image' && item.reuseTargets && item.reuseTargets.length > 0 && item.fileUrl && item.status === 'provided' && (
            <div className="w-full bg-[#EEF2FF]/60 border border-[#C7D2FE] rounded-xl p-3 space-y-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[#4338CA]">
                <Copy className="w-3.5 h-3.5" />
                <span>Reuse this image for other assets</span>
              </div>
              <div className="space-y-1.5">
                {item.reuseTargets.map((targetId) => {
                  const targetItem = allItems.find((i) => i.id === targetId);
                  if (!targetItem || targetItem.status === 'not_applicable') return null;
                  const isReused = targetItem.reusedFromId === item.id;
                  const isAlreadyProvided = targetItem.status === 'provided' && !isReused;
                  return (
                    <label
                      key={targetId}
                      className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition text-xs ${
                        isReused
                          ? 'bg-emerald-50 border border-emerald-200'
                          : isAlreadyProvided
                          ? 'bg-slate-50 border border-slate-200 opacity-60 cursor-default'
                          : 'bg-white border border-[#E2E8F0] hover:border-[#4338CA]/40 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isReused}
                        disabled={isAlreadyProvided}
                        onChange={(e) => onReuseToggle(item.id, targetId, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-[#CBD5E1] text-[#4338CA] focus:ring-[#4338CA]/20 accent-[#4338CA]"
                      />
                      <span className={`font-medium ${
                        isReused ? 'text-emerald-800' : isAlreadyProvided ? 'text-slate-500' : 'text-[#334155]'
                      }`}>
                        {isReused ? '✓ ' : ''}Also use as {targetItem.title}
                      </span>
                      {isAlreadyProvided && (
                        <span className="text-[10px] text-slate-500 ml-auto">(already has its own file)</span>
                      )}
                      {isReused && (
                        <span className="text-[10px] text-emerald-600 ml-auto font-semibold">Linked</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* B. Document Asset Controls (PDF) */}
          {item.type === 'document' && (
            <div className="w-full sm:w-auto">
              {item.fileUrl && !isNotApplicable ? (
                <div className="flex items-center gap-3 bg-[#FAF7F2] border border-[#E2E8F0] p-2 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="text-xs min-w-[120px] max-w-[180px]">
                    <div className="font-semibold text-[#131B2E] truncate" title={item.fileName || 'Document.pdf'}>
                      {item.fileName || 'Uploaded PDF'}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {item.fileSize ? formatFileSize(item.fileSize) : 'PDF Document'}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 pl-2 border-l border-[#E2E8F0]">
                    <a
                      href={getDownloadUrl(item)}
                      download={item.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-[#4338CA] hover:bg-[#EEF2FF] rounded-lg transition"
                      title="Download PDF"
                      aria-label={`Download PDF for ${item.title}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="p-1.5 text-[#4338CA] hover:bg-[#EEF2FF] rounded-lg transition"
                      title="Replace document"
                      aria-label={`Replace document for ${item.title}`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveAsset(item)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Remove document"
                      aria-label={`Remove document for ${item.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isNotApplicable}
                    className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-semibold rounded-xl shadow-2xs transition active:scale-[0.98] ${
                      isNotApplicable ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    aria-label={`Upload document for ${item.title}`}
                  >
                    <Upload className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                    <span>{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => onUpload(e.target.files)}
                className="hidden"
                aria-label={`Upload PDF file for ${item.title}`}
              />
            </div>
          )}

          {/* C. Multi-Photo Gallery Controls (Campus Photos) */}
          {item.type === 'gallery' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[#64748B] whitespace-nowrap">
                {item.galleryUrls && item.galleryUrls.length > 0
                  ? `${item.galleryUrls.length} photo${item.galleryUrls.length > 1 ? 's' : ''} selected`
                  : 'No photos selected'}
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isNotApplicable}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] text-xs font-semibold rounded-xl transition shrink-0 cursor-pointer ${
                  isNotApplicable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                aria-label={`Add photos to ${item.title}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Add Photos'}</span>
              </button>

              {campusImages && campusImages.length > 0 && onReuseCampusImage && (
                <button
                  type="button"
                  onClick={() => setShowCampusPicker(!showCampusPicker)}
                  disabled={isNotApplicable}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer shrink-0 ${
                    showCampusPicker
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  } ${isNotApplicable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Select from photos already uploaded to Main Campus or branches (Zero Duplicate Storage)"
                >
                  <Building2 className={`w-3.5 h-3.5 ${showCampusPicker ? 'text-white' : 'text-emerald-600'}`} />
                  <span>
                    {showCampusPicker
                      ? `Hide Campus Photos (${campusImages.length})`
                      : `Browse Campus Photos (${campusImages.length})`}
                  </span>
                  {showCampusPicker ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp"
                onChange={(e) => onUpload(e.target.files)}
                className="hidden"
                aria-label={`Add photos for ${item.title}`}
              />
            </div>
          )}

          {/* D. Text Content Controls with Intelligent Recommendation Assistant */}
          {item.type === 'text' && (
            <ContentRecommendationAssistant
              item={item}
              intakeData={intakeData}
              onUpdate={onUpdate}
              token={token}
              isNotApplicable={isNotApplicable}
            />
          )}

          {/* E. Auxiliary Status Switches: Provide Later & Not Applicable */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Will provide later toggle */}
            {!isProvided && !isNotApplicable && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    status: isPending ? 'not_provided' : 'pending',
                  })
                }
                className={`text-[11px] font-medium px-2 py-1 rounded-md border transition ${
                  isPending
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-semibold'
                    : 'bg-white text-[#64748B] hover:text-[#131B2E] border-[#E2E8F0]'
                }`}
                aria-label={`Toggle provide later for ${item.title}`}
              >
                {isPending ? '◷ Marked: Will provide later' : 'Mark: Will provide later'}
              </button>
            )}

            {/* Not Applicable toggle (only if allowed) */}
            {item.allowNotApplicable !== false && (
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    status: isNotApplicable ? 'not_provided' : 'not_applicable',
                  })
                }
                className={`text-[11px] font-medium px-2 py-1 rounded-md border transition ${
                  isNotApplicable
                    ? 'bg-slate-200 text-slate-800 border-slate-300 font-semibold'
                    : 'bg-white text-[#64748B] hover:text-[#131B2E] border-[#E2E8F0]'
                }`}
                aria-label={`Toggle not applicable for ${item.title}`}
              >
                {isNotApplicable ? '— Marked: Not applicable' : 'Mark: Not applicable'}
              </button>
            )}

            {/* Admin Notes Toggle */}
            <button
              type="button"
              onClick={onToggleNotes}
              className="text-[11px] font-medium text-[#64748B] hover:text-[#4338CA] px-1.5 py-1 flex items-center gap-1"
              aria-label="Add developer notes"
            >
              <span>Notes</span>
              {isNotesExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Admin Notes Input Drawer */}
          {isNotesExpanded && (
            <div className="w-full pt-1">
              <input
                type="text"
                value={item.notes || ''}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Optional notes for Ekaagra web developer team..."
                className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs text-[#334155] placeholder:text-[#94A3B8] focus:border-[#4338CA] focus:outline-hidden"
                aria-label={`Developer notes for ${item.title}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* F. Dedicated Full-Width Campus Photo Selector Panel (Zero Duplicate Storage) */}
      {showCampusPicker && campusImages && campusImages.length > 0 && onReuseCampusImage && (
        <div className="mt-4 p-4 sm:p-5 bg-gradient-to-b from-emerald-50/90 via-emerald-50/50 to-white border border-emerald-200 rounded-2xl shadow-xs space-y-3.5 w-full min-w-0 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Panel Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <h5 className="font-bold text-sm text-emerald-950">
                  Available Campus Photos (Reused Without Duplicate Storage)
                </h5>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedCount} of {campusImagesCount} selected
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 sm:ml-9">
                Click any photo to toggle inclusion for {item.title}. Zero duplicate storage overhead.
              </p>
            </div>

            {/* Close / Hide Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowCampusPicker(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/80 rounded-lg transition cursor-pointer"
                aria-label="Hide campus photos picker"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hide Campus Photos</span>
              </button>
            </div>
          </div>

          {/* Filter Toolbar: Show / Hide Selected Images Controls & Campus Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* View Filter Tabs: All, Selected, Available to Add */}
              <div className="inline-flex items-center p-0.5 bg-emerald-100/60 rounded-xl border border-emerald-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPickerFilter('all');
                    setHideSelectedInPicker(false);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    pickerFilter === 'all'
                      ? 'bg-white text-emerald-950 shadow-2xs font-bold'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  All Photos ({campusImagesCount})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickerFilter('selected');
                    setHideSelectedInPicker(false);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    pickerFilter === 'selected'
                      ? 'bg-white text-emerald-950 shadow-2xs font-bold'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <span>Selected</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCount > 0
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-emerald-200/70 text-emerald-800'
                    }`}
                  >
                    {selectedCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPickerFilter('unselected');
                    setHideSelectedInPicker(false);
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    pickerFilter === 'unselected'
                      ? 'bg-white text-emerald-950 shadow-2xs font-bold'
                      : 'text-emerald-800 hover:text-emerald-950'
                  }`}
                >
                  <span>Available to Add</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/70 text-emerald-800 font-semibold">
                    {unselectedCount}
                  </span>
                </button>
              </div>

              {/* Multi-Campus Selector (Shown when school has multiple campuses) */}
              {!isSingleCampus && campuses && campuses.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <select
                    value={selectedCampusBranchId}
                    onChange={(e) => setSelectedCampusBranchId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-emerald-300 text-emerald-950 hover:border-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    aria-label="Filter photos by campus branch"
                  >
                    <option value="all">All Campuses ({campusImagesCount})</option>
                    {campuses.map((c) => {
                      const count = (campusImages || []).filter((img) => (img.campusId || '') === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name || (c.isMainCampus ? 'Main Campus' : 'Branch')} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Right Controls: Quick "Hide/Show Selected" Toggle & Batch Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (pickerFilter === 'selected') {
                    setPickerFilter('all');
                    setHideSelectedInPicker(true);
                  } else if (pickerFilter === 'unselected') {
                    setPickerFilter('all');
                    setHideSelectedInPicker(false);
                  } else {
                    setHideSelectedInPicker(!hideSelectedInPicker);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  hideSelectedInPicker || pickerFilter === 'unselected'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                    : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                }`}
                title="Toggle visibility of already selected images in this picker"
              >
                {hideSelectedInPicker || pickerFilter === 'unselected' ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Selected Photos</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Selected Photos</span>
                  </>
                )}
              </button>

              {onBatchReuseCampusImages && (
                <div className="flex items-center gap-1.5 pl-1.5 border-l border-emerald-200">
                  {unselectedVisibleCount > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        onBatchReuseCampusImages(
                          item.id,
                          filteredCampusImages.filter((c) => !isCampusImgIncluded(c)),
                          'select_all'
                        )
                      }
                      className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-300 transition cursor-pointer flex items-center gap-1"
                      title="Add all currently visible unselected photos to this section"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Select All ({unselectedVisibleCount})</span>
                    </button>
                  ) : filteredCampusImages.length > 0 ? (
                    <span className="text-[11px] font-semibold text-emerald-700 px-2 py-1 flex items-center gap-1 bg-emerald-100/50 rounded-lg">
                      <Check className="w-3 h-3" />
                      <span>All Visible Added</span>
                    </span>
                  ) : null}

                  {selectedCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        onBatchReuseCampusImages(item.id, campusImages || [], 'clear_all')
                      }
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                      title="Clear campus photo selections for this section"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Selection ({selectedCount})</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Photos Grid - Fully Responsive & Visible */}
          {filteredCampusImages.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-xl border border-dashed border-emerald-200 space-y-2">
              <p className="text-xs font-semibold text-emerald-950">
                {pickerFilter === 'selected'
                  ? 'No campus photos have been selected for this section yet.'
                  : pickerFilter === 'unselected' || hideSelectedInPicker
                  ? 'All available campus photos have already been selected!'
                  : selectedCampusBranchId !== 'all'
                  ? 'No campus photos found for the selected campus branch.'
                  : 'No campus photos match the filter.'}
              </p>
              <p className="text-[11px] text-emerald-700">
                {pickerFilter === 'selected'
                  ? 'Click "All Photos" to browse and select photos.'
                  : pickerFilter === 'unselected' || hideSelectedInPicker
                  ? 'You can view selected photos or reset filters anytime.'
                  : 'Try selecting a different campus or reset filters.'}
              </p>
              {(pickerFilter !== 'all' || hideSelectedInPicker || selectedCampusBranchId !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setPickerFilter('all');
                    setHideSelectedInPicker(false);
                    setSelectedCampusBranchId('all');
                  }}
                  className="text-xs font-semibold text-emerald-800 hover:underline inline-block mt-1 cursor-pointer"
                >
                  Reset Filters & View All Photos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 min-w-0 w-full">
              {filteredCampusImages.map((cImg) => {
                const isIncluded = isCampusImgIncluded(cImg);
                return (
                  <div
                    key={cImg.id || cImg.storageKey || cImg.url}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isIncluded}
                    aria-label={`${isIncluded ? 'Remove' : 'Select'} photo ${cImg.fileName} for ${item.title}`}
                    onClick={() => onReuseCampusImage(item.id, cImg)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onReuseCampusImage(item.id, cImg);
                      }
                    }}
                    className={`group relative rounded-xl border text-left cursor-pointer transition overflow-hidden flex flex-col min-w-0 ${
                      isIncluded
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/25 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 shadow-2xs'
                    }`}
                  >
                    {/* Image Preview Box */}
                    <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-300 pointer-events-none" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cImg.url}
                        alt={cImg.fileName || 'Campus Photo'}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 absolute inset-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />

                      {/* Lightbox Zoom Icon on Hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreview(cImg.url, cImg.fileName || 'Campus Photo', {
                            fileUrl: cImg.url,
                            fileName: cImg.fileName || 'Campus Photo',
                            fileSize: cImg.optimizedSize,
                            storageKey: cImg.storageKey,
                            width: cImg.width,
                            height: cImg.height,
                          });
                        }}
                        className="absolute bottom-1.5 left-1.5 p-1.5 bg-black/60 hover:bg-black text-white rounded-md opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition z-10 cursor-pointer shadow-xs"
                        title="Click to preview full size"
                        aria-label={`Preview full resolution of ${cImg.fileName || 'Campus Photo'}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Selection Badge Pill (Top Right) */}
                      <div className="absolute top-1.5 right-1.5 z-10">
                        {isIncluded ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-white/95 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 text-[10px] font-semibold rounded-full shadow-2xs border border-slate-200 group-hover:border-transparent transition">
                            <Plus className="w-3 h-3" />
                            <span>Select</span>
                          </span>
                        )}
                      </div>

                      {/* Campus Pill (Bottom Right) */}
                      {cImg.campusName && (
                        <div className="absolute bottom-1.5 right-1.5 z-10 max-w-[70%]">
                          <span className="text-[9px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-xs truncate block" title={cImg.campusName}>
                            {cImg.campusName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Meta & Toggle Action */}
                    <div className="p-2 flex flex-col justify-between flex-1 gap-1 min-w-0">
                      <div className="font-semibold text-slate-900 text-xs truncate" title={cImg.fileName || 'Campus Photo'}>
                        {cImg.fileName || 'Campus Photo'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] min-w-0 gap-1">
                        <span className={`truncate ${isIncluded ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                          {isIncluded ? '✓ Included' : '+ Click to add'}
                        </span>
                        {cImg.optimizedSize ? (
                          <span className="text-slate-400 font-mono text-[9px] shrink-0">
                            {formatFileSize(cImg.optimizedSize)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* G. Dedicated Full-Width Gallery Photos Grid (When photos are uploaded) */}
      {item.type === 'gallery' && item.galleryUrls && item.galleryUrls.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-[#F1F5F9] w-full min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#334155]">
              <Camera className="w-3.5 h-3.5 text-[#4338CA]" />
              <span>Selected Campus Photos ({item.galleryUrls.length})</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#64748B] hidden sm:inline">
                Click thumbnail to preview full resolution
              </span>

              {/* Toggle to Professionally Show / Hide Selected Images */}
              <button
                type="button"
                onClick={() => setIsGalleryExpanded(!isGalleryExpanded)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4338CA] hover:text-[#3730A3] px-2 py-0.5 rounded-md hover:bg-[#EEF2FF] transition cursor-pointer"
                aria-label={isGalleryExpanded ? 'Hide selected photos' : `Show selected photos (${item.galleryUrls.length})`}
              >
                {isGalleryExpanded ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Photos</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show Photos ({item.galleryUrls.length})</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {isGalleryExpanded ? (
            <div className="flex flex-wrap gap-2.5 items-center animate-in fade-in duration-200 min-w-0">
              {item.galleryUrls.map((photo, idx) => (
                <div
                  key={photo.id || photo.storageKey || photo.url || `photo-${idx}`}
                  className="relative group w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-[#CBD5E1] bg-slate-100 shrink-0 shadow-2xs hover:border-[#4338CA] transition flex items-center justify-center"
                >
                  <ImageIcon className="w-5 h-5 text-slate-300 pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.name || 'Campus Photo'}
                    className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105 absolute inset-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                    onClick={() =>
                      onPreview(photo.url, photo.name || 'Campus Photo', {
                        fileUrl: photo.url,
                        fileName: photo.name || 'Campus Photo',
                        fileSize: photo.size,
                        storageKey: photo.storageKey,
                        width: photo.width,
                        height: photo.height,
                        originalSize: photo.originalSize,
                        optimizedSize: photo.optimizedSize,
                        isPrivate: item.isPrivate,
                      })
                    }
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition pointer-events-none" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = (item.galleryUrls || []).filter((_, i) => i !== idx);
                      onUpdate({
                        galleryUrls: updated,
                        status: updated.length > 0 ? 'provided' : 'not_provided',
                        isManualOverride: true,
                      });
                    }}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white p-1 rounded-md opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer z-10"
                    title="Delete photo"
                    aria-label={`Delete ${photo.name || 'photo'}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-1 pointer-events-none opacity-0 group-hover:opacity-100 transition z-10">
                    <p className="text-[9px] text-white font-medium truncate">{photo.name || 'Campus Photo'}</p>
                  </div>
                </div>
              ))}

              {/* Matching Add More Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isNotApplicable}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-[#CBD5E1] hover:border-[#4338CA] hover:bg-[#EEF2FF]/50 bg-[#FAF7F2] flex flex-col items-center justify-center text-[#64748B] hover:text-[#4338CA] transition gap-1 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group/add"
                title="Add more photos"
                aria-label={`Add more photos for ${item.title}`}
              >
                <Plus className="w-4 h-4 transition-transform group-hover/add:scale-110" />
                <span className="text-[10px] font-semibold">Add More</span>
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Show ${item.galleryUrls.length} selected photos for ${item.title}`}
              onClick={() => setIsGalleryExpanded(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsGalleryExpanded(true);
                }
              }}
              className="p-2.5 px-3.5 bg-slate-50 border border-slate-200 hover:border-[#4338CA]/30 rounded-xl flex items-center justify-between text-xs text-[#334155] cursor-pointer transition hover:bg-slate-100/70"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium text-[11px]">
                  {item.galleryUrls.length} photo{item.galleryUrls.length > 1 ? 's' : ''} currently included in {item.title}.
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#4338CA] hover:underline flex items-center gap-1">
                Show photos ({item.galleryUrls.length}) <ChevronDown className="w-3 h-3" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LightboxModal({
  previewImage,
  onClose,
  formatFileSize,
  getDownloadUrl,
}: {
  previewImage: any;
  onClose: () => void;
  formatFileSize: (bytes?: number) => string;
  getDownloadUrl: (targetItem: any) => string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <ModalPortal isOpen={true}>
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
      className="fixed inset-0 z-[9999] bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="space-y-1 pr-4">
            <h4 id="preview-title" className="font-bold text-sm sm:text-base text-[#131B2E]">
              {previewImage.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#64748B] flex-wrap">
              {previewImage.fileName && <span className="font-medium text-[#334155]">{previewImage.fileName}</span>}
              {previewImage.width && previewImage.height && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                  <span>{previewImage.width}×{previewImage.height}</span>
                </>
              )}
              {previewImage.fileSize && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                  <span>{formatFileSize(previewImage.fileSize)}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {(() => {
              const downloadHref = getDownloadUrl(previewImage) || previewImage.fileUrl || previewImage.url;
              return (
                <a
                  href={downloadHref}
                  download={previewImage.fileName || 'download.webp'}
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 sm:px-3 sm:py-1.5 text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  title="Download image"
                  aria-label={`Download ${previewImage.title || 'image'}`}
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              );
            })()}
            <a
              href={previewImage.fileUrl || previewImage.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 sm:px-3 sm:py-1.5 text-[#475569] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>
            <div className="w-px h-6 bg-[#E2E8F0] mx-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#64748B] hover:text-[#131B2E] p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close image preview"
              autoFocus
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div 
          className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-xl p-2 border border-[#E2E8F0]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h10v10H0zm10 10h10v10H10z' fill='%23e2e8f0' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E\")"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImage.url}
            alt={previewImage.title}
            className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
          />
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
