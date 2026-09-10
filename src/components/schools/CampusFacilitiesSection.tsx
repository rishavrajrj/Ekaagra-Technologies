'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  X,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react';
import type {
  UniversalIntakeData,
  FacilitiesData,
  WebsiteFacilityConfig,
  CampusImageData,
  SharedMediaAsset,
} from '@/lib/types';
import {
  FACILITY_DEFINITIONS,
  getFacilityDefinition,
  normalizeFacilitiesData,
  getFacilitiesSectionScore,
  type FacilityDefinition,
} from '@/lib/facilitiesUtils';
import FacilityDetailForm from './FacilityDetailForm';
import DuplicatePhotoModal from './DuplicatePhotoModal';
import {
  computeFileSha256,
  findDuplicateAsset,
  getEffectiveMediaRegistry,
  registerMediaAsset,
  attachAssetToSection,
  detachAssetFromSection,
  sharedAssetToCampusImage,
  campusImageToSharedAsset,
  purgeAssetFromIntake,
} from '@/lib/mediaRegistryUtils';

interface CampusFacilitiesSectionProps {
  intakeData: UniversalIntakeData;
  updateSectionField: (section: keyof UniversalIntakeData, field: string, value: any) => void;
  updateSectionDirect?: (section: keyof UniversalIntakeData, value: any) => void;
  onNavigateToSection?: (sectionKey: any) => void;
  isReadOnly?: boolean;
  sourceMode?: string;
  sourceCampusName?: string;
  token?: string;
}

const ICON_COLORS: Record<string, string> = {
  Sparkles: 'text-amber-500',
  Laptop: 'text-indigo-500',
  FlaskConical: 'text-emerald-500',
  BookOpen: 'text-blue-500',
  Trophy: 'text-orange-500',
  Theater: 'text-purple-500',
  HeartPulse: 'text-rose-500',
  Utensils: 'text-yellow-600',
  ShieldCheck: 'text-teal-600',
  Home: 'text-cyan-600',
  Building2: 'text-slate-500',
};

interface UploadTask {
  id: string;
  file: File;
  status: 'uploading' | 'optimizing' | 'done' | 'error';
  message: string;
}

export default function CampusFacilitiesSection({
  intakeData,
  updateSectionField,
  updateSectionDirect,
  onNavigateToSection,
  isReadOnly = false,
  sourceMode,
  sourceCampusName,
  token,
}: CampusFacilitiesSectionProps) {
  // ── Normalize state ─────────────────────────────────────────────────────────
  const { normalized, facilities } = useMemo(() => {
    return normalizeFacilitiesData(intakeData.facilitiesConfig, intakeData);
  }, [intakeData.facilitiesConfig, intakeData]);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null);
  const [uploadTasks, setUploadTasks] = useState<Record<string, UploadTask>>({});
  const [activeStage, setActiveStage] = useState<'availability' | 'details' | 'preview'>('availability');
  const [duplicateModalInfo, setDuplicateModalInfo] = useState<{
    asset: SharedMediaAsset;
    facilityId: string;
    file?: File;
    isAlreadyInFacility: boolean;
  } | null>(null);

  // ── Central Media Registry ──────────────────────────────────────────────────
  const mediaRegistry = useMemo(() => {
    return getEffectiveMediaRegistry(intakeData);
  }, [intakeData]);

  // Main Campus Helper
  const campuses = intakeData.campuses || [];
  const mainCampus = campuses.find((c) => c.isMainCampus) || campuses[0];
  const campusId = mainCampus?.id || 'main-campus';

  // ── Completion score ─────────────────────────────────────────────────────────
  const score = useMemo(() => {
    return getFacilitiesSectionScore(normalized, intakeData);
  }, [normalized, intakeData]);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const saveFacilities = useCallback(
    (updatedFacilities: Record<string, WebsiteFacilityConfig>) => {
      if (isReadOnly) return;
      const { normalized: synched } = normalizeFacilitiesData(
        { ...normalized, facilities: updatedFacilities },
        intakeData
      );
      if (updateSectionDirect) {
        updateSectionDirect('facilitiesConfig', synched);
      } else {
        updateSectionField('facilitiesConfig', 'facilities', updatedFacilities);
      }
    },
    [normalized, intakeData, isReadOnly, updateSectionDirect, updateSectionField]
  );

  const updateFacilityField = useCallback(
    (facilityId: string, field: keyof WebsiteFacilityConfig, value: any) => {
      const current = facilities[facilityId] || { id: facilityId, available: true, features: [], photos: [] };
      saveFacilities({ ...facilities, [facilityId]: { ...current, [field]: value } });
    },
    [facilities, saveFacilities]
  );

  const toggleFacilityAvailability = useCallback(
    (facilityId: string, available: boolean) => {
      const current = facilities[facilityId] || { id: facilityId, available: true, features: [], photos: [] };
      saveFacilities({ ...facilities, [facilityId]: { ...current, available } });
    },
    [facilities, saveFacilities]
  );

  // ── Reuse existing photo handler ─────────────────────────────────────────────
  const handleReuseExisting = useCallback(
    (asset: SharedMediaAsset, facilityId: string) => {
      const currentPhotos = facilities[facilityId]?.photos || [];
      const isAlreadyIn = currentPhotos.some(
        (p) => p.url === asset.url || p.id === asset.id || (asset.hash && p.checksumSha256 === asset.hash)
      );

      if (!isAlreadyIn) {
        const newPhoto = sharedAssetToCampusImage(asset, {
          campusId,
          imageType: getFacilityDefinition(facilityId)?.title || 'Facility',
          caption: asset.caption || `${getFacilityDefinition(facilityId)?.title} on campus`,
        });
        updateFacilityField(facilityId, 'photos', [...currentPhotos, newPhoto]);

        const { updatedIntakeData: withAttached } = attachAssetToSection(
          intakeData,
          asset.id,
          `facility_${facilityId}`
        );
        if (updateSectionDirect && withAttached.mediaRegistry) {
          updateSectionDirect('mediaRegistry', withAttached.mediaRegistry);
        }
      }
      setDuplicateModalInfo(null);
    },
    [facilities, campusId, intakeData, updateFacilityField, updateSectionDirect]
  );

  // ── Force re-upload / replace existing photo ──────────────────────────────────
  const handleForceUploadDuplicate = useCallback(
    async (info: { asset: SharedMediaAsset; facilityId: string; file?: File; isAlreadyInFacility: boolean }) => {
      const { asset, facilityId, file } = info;
      setDuplicateModalInfo(null);
      if (!file) return;

      const taskId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setUploadTasks((prev) => ({
        ...prev,
        [taskId]: { id: taskId, file, status: 'uploading', message: `Replacing ${file.name}...` },
      }));

      try {
        const fileHash = await computeFileSha256(file);
        const formData = new FormData();
        formData.append('token', token || 'demo');
        formData.append('file', file);
        formData.append('itemId', `facility_${facilityId}`);
        formData.append('itemType', 'image');
        formData.append('campusId', campusId);

        const res = await fetch('/api/school-assets/upload', { method: 'POST', body: formData });
        let uploadedAsset: any = null;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.asset) uploadedAsset = json.asset;
        }

        const newImageUrl = uploadedAsset?.url || (typeof window !== 'undefined' ? URL.createObjectURL(file) : '');
        const newStorageKey = uploadedAsset?.storageKey || taskId;
        const newChecksum = uploadedAsset?.checksumSha256 || fileHash;

        // 1. Update or append photo in facility
        const currentPhotos = facilities[facilityId]?.photos || [];
        const isExistingInFacility = currentPhotos.some(
          (p) => p.url === asset.url || p.id === asset.id || (asset.hash && p.checksumSha256 === asset.hash)
        );

        let updatedFacilityPhotos: CampusImageData[];
        if (isExistingInFacility) {
          updatedFacilityPhotos = currentPhotos.map((p) => {
            if (p.url === asset.url || p.id === asset.id || (asset.hash && p.checksumSha256 === asset.hash)) {
              return {
                ...p,
                url: newImageUrl,
                storageKey: newStorageKey,
                checksumSha256: newChecksum,
                originalSize: uploadedAsset?.originalSize || file.size,
                optimizedSize: uploadedAsset?.optimizedSize || file.size,
              };
            }
            return p;
          });
        } else {
          const newPhoto = sharedAssetToCampusImage(asset, {
            campusId,
            url: newImageUrl,
            storageKey: newStorageKey,
            checksumSha256: newChecksum,
            originalSize: uploadedAsset?.originalSize || file.size,
            optimizedSize: uploadedAsset?.optimizedSize || file.size,
            imageType: getFacilityDefinition(facilityId)?.title || 'Facility',
            caption: asset.caption || `${getFacilityDefinition(facilityId)?.title} on campus`,
          });
          updatedFacilityPhotos = [...currentPhotos, newPhoto];
        }
        updateFacilityField(facilityId, 'photos', updatedFacilityPhotos);

        // 2. Update central mediaRegistry so all sections reference the fresh working URL
        const currentReg = getEffectiveMediaRegistry(intakeData);
        const nextReg = currentReg.map((a) => {
          if (a.id === asset.id || (asset.hash && a.hash === asset.hash) || a.url === asset.url) {
            return {
              ...a,
              url: newImageUrl,
              thumbnailUrl: newImageUrl,
              storageKey: newStorageKey,
              hash: newChecksum,
              size: uploadedAsset?.optimizedSize || file.size,
              usedIn: Array.from(new Set([...a.usedIn, `facility_${facilityId}`])),
            };
          }
          return a;
        });

        if (updateSectionDirect) {
          updateSectionDirect('mediaRegistry', nextReg);
        }

        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: { ...prev[taskId], status: 'done', message: '✓ Replaced & Updated' },
        }));
        setTimeout(() => {
          setUploadTasks((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }, 3500);
      } catch (err: any) {
        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            status: 'error',
            message: 'Replacement failed',
            errorMessage: err.message || 'Failed to replace image file.',
          },
        }));
      }
    },
    [facilities, campusId, intakeData, token, updateFacilityField, updateSectionDirect]
  );

  // ── Delete photo from media library across facilities and registry ───────────
  const handleDeleteAssetFromLibrary = useCallback(
    async (asset: SharedMediaAsset) => {
      const { updatedIntakeData, purgedStorageKey } = purgeAssetFromIntake(intakeData, asset.id);

      // Clean up physical storage if key exists
      const keyToDelete = purgedStorageKey || asset.storageKey;
      if (keyToDelete && token) {
        try {
          await fetch('/api/school-assets/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, storageKey: keyToDelete }),
          });
        } catch {
          // Non-blocking cleanup
        }
      }

      if (updateSectionDirect) {
        if (updatedIntakeData.mediaRegistry) {
          updateSectionDirect('mediaRegistry', updatedIntakeData.mediaRegistry);
        }
        if (updatedIntakeData.facilitiesConfig) {
          updateSectionDirect('facilitiesConfig', updatedIntakeData.facilitiesConfig);
        }
      }
    },
    [intakeData, token, updateSectionDirect]
  );

  // ── Multi-photo selection from media picker ──────────────────────────────────
  const handleSelectExistingPhotos = useCallback(
    (facilityId: string, selectedAssets: SharedMediaAsset[]) => {
      if (isReadOnly || selectedAssets.length === 0) return;
      const currentPhotos = facilities[facilityId]?.photos || [];
      const existingUrlsOrIds = new Set(
        currentPhotos
          .map((p) => (p.url || '').toLowerCase())
          .concat(currentPhotos.map((p) => (p.id || '').toLowerCase()))
      );

      const newPhotosToAdd: CampusImageData[] = [];
      let currentIntake = intakeData;

      selectedAssets.forEach((asset) => {
        if (
          !existingUrlsOrIds.has((asset.url || '').toLowerCase()) &&
          !existingUrlsOrIds.has((asset.id || '').toLowerCase())
        ) {
          const photo = sharedAssetToCampusImage(asset, {
            campusId,
            imageType: getFacilityDefinition(facilityId)?.title || 'Facility',
            caption: asset.caption || `${getFacilityDefinition(facilityId)?.title} on campus`,
          });
          newPhotosToAdd.push(photo);
          existingUrlsOrIds.add((asset.url || '').toLowerCase());
          const { updatedIntakeData: nextData } = attachAssetToSection(
            currentIntake,
            asset.id,
            `facility_${facilityId}`
          );
          currentIntake = nextData;
        }
      });

      if (newPhotosToAdd.length > 0) {
        updateFacilityField(facilityId, 'photos', [...currentPhotos, ...newPhotosToAdd]);
        if (updateSectionDirect && currentIntake.mediaRegistry) {
          updateSectionDirect('mediaRegistry', currentIntake.mediaRegistry);
        }
      }
    },
    [facilities, isReadOnly, campusId, intakeData, updateFacilityField, updateSectionDirect]
  );

  // ── Photo handlers ───────────────────────────────────────────────────────────
  const handlePhotoUpload = async (facilityId: string, files: FileList | null) => {
    if (!files || files.length === 0 || isReadOnly) return;

    for (const file of Array.from(files)) {
      // 1. Check SHA-256 hash for duplicates BEFORE uploading
      const fileHash = await computeFileSha256(file);
      const existingAsset = findDuplicateAsset(mediaRegistry, fileHash, {
        name: file.name,
        size: file.size,
      });

      if (existingAsset) {
        const isAlreadyIn = (facilities[facilityId]?.photos || []).some(
          (p) =>
            p.url === existingAsset.url ||
            p.id === existingAsset.id ||
            (existingAsset.hash && p.checksumSha256 === existingAsset.hash)
        );

        setDuplicateModalInfo({
          asset: existingAsset,
          facilityId,
          file,
          isAlreadyInFacility: isAlreadyIn,
        });
        continue; // Skip uploading duplicate file
      }

      const taskId = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setUploadTasks((prev) => ({
        ...prev,
        [taskId]: { id: taskId, file, status: 'uploading', message: `Uploading ${file.name}...` },
      }));

      try {
        const formData = new FormData();
        formData.append('token', token || 'demo');
        formData.append('file', file);
        formData.append('itemId', `facility_${facilityId}`);
        formData.append('itemType', 'image');
        formData.append('campusId', campusId);

        const res = await fetch('/api/school-assets/upload', { method: 'POST', body: formData });
        let uploadedAsset: any = null;
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.asset) uploadedAsset = json.asset;
        }

        const newImageData: CampusImageData = {
          id: uploadedAsset?.id || taskId,
          campusId,
          storageKey: uploadedAsset?.storageKey || taskId,
          fileName: file.name,
          url: uploadedAsset?.url || URL.createObjectURL(file),
          mimeType: uploadedAsset?.mimeType || file.type,
          originalSize: uploadedAsset?.originalSize || file.size,
          optimizedSize: uploadedAsset?.optimizedSize || file.size,
          checksumSha256: uploadedAsset?.checksumSha256 || fileHash,
          category: 'campus_buildings',
          imageCategory: 'campus_buildings',
          imageType: getFacilityDefinition(facilityId)?.title || 'Facility',
          caption: `${getFacilityDefinition(facilityId)?.title} on campus`,
          isPrimary: false,
          sourceSection: 'facilities',
        };

        const currentPhotos = facilities[facilityId]?.photos || [];
        updateFacilityField(facilityId, 'photos', [...currentPhotos, newImageData]);

        // Register in central media registry
        const sharedAsset = campusImageToSharedAsset(newImageData, 'facilities', [
          `facility_${facilityId}`,
        ]);
        sharedAsset.hash = uploadedAsset?.checksumSha256 || fileHash;
        const { updatedIntakeData: withRegistered } = registerMediaAsset(intakeData, sharedAsset);
        if (updateSectionDirect && withRegistered.mediaRegistry) {
          updateSectionDirect('mediaRegistry', withRegistered.mediaRegistry);
        }

        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: { ...prev[taskId], status: 'done', message: '✓ Optimized & Saved' },
        }));
        setTimeout(() => {
          setUploadTasks((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });
        }, 2000);
      } catch {
        setUploadTasks((prev) => ({
          ...prev,
          [taskId]: { ...prev[taskId], status: 'error', message: 'Upload failed' },
        }));
      }
    }
  };

  const handleDeletePhoto = useCallback(
    (facilityId: string, photoId: string) => {
      const photoToDelete = (facilities[facilityId]?.photos || []).find((p) => p.id === photoId);
      const updatedPhotos = (facilities[facilityId]?.photos || []).filter((p) => p.id !== photoId);
      updateFacilityField(facilityId, 'photos', updatedPhotos);

      // Non-destructive detach from section
      if (photoToDelete) {
        const targetId = photoToDelete.sharedAssetId || photoToDelete.url || photoToDelete.id;
        const updatedIntake = detachAssetFromSection(intakeData, targetId, `facility_${facilityId}`);
        if (updateSectionDirect && updatedIntake.mediaRegistry) {
          updateSectionDirect('mediaRegistry', updatedIntake.mediaRegistry);
        }
      }
    },
    [facilities, intakeData, updateFacilityField, updateSectionDirect]
  );

  const handleSetPhotoCaption = useCallback(
    (facilityId: string, photoId: string, caption: string) => {
      const updatedPhotos = (facilities[facilityId]?.photos || []).map((p) =>
        p.id === photoId ? { ...p, caption } : p
      );
      updateFacilityField(facilityId, 'photos', updatedPhotos);
    },
    [facilities, updateFacilityField]
  );

  const handleTogglePhotoHero = useCallback(
    (facilityId: string, photoId: string) => {
      const updatedPhotos = (facilities[facilityId]?.photos || []).map((p) =>
        p.id === photoId ? { ...p, isPrimary: !p.isPrimary } : { ...p, isPrimary: false }
      );
      updateFacilityField(facilityId, 'photos', updatedPhotos);
    },
    [facilities, updateFacilityField]
  );

  // ── Derived ──────────────────────────────────────────────────────────────────
  const availableFacilities = useMemo(
    () => FACILITY_DEFINITIONS.filter((def) => facilities[def.id]?.available === true || (facilities[def.id] === undefined && def.defaultAvailable)),
    [facilities]
  );

  const unavailableFacilities = useMemo(
    () => FACILITY_DEFINITIONS.filter((def) => facilities[def.id]?.available === false),
    [facilities]
  );

  const notSetFacilities = useMemo(
    () => FACILITY_DEFINITIONS.filter((def) => facilities[def.id] === undefined && !def.defaultAvailable),
    [facilities]
  );

  const totalAvailable = availableFacilities.length;
  const totalWithDetails = availableFacilities.filter((def) => {
    const cfg = facilities[def.id];
    return cfg && (def.validate(cfg).isValid || (cfg.description && cfg.description.length > 10));
  }).length;

  // ── Stage tab colors ─────────────────────────────────────────────────────────
  const stageTabClass = (stage: typeof activeStage) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
      activeStage === stage
        ? 'bg-[#4338CA] text-white shadow-sm'
        : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#131B2E]'
    }`;

  return (
    <div className="space-y-6 text-xs text-[#131B2E]">
      {/* ─── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#131B2E]">
                Campus Facilities &amp; Infrastructure
              </h2>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Tell us which facilities your campus has — then add photos and details that will be
              showcased on your public school website.
            </p>
          </div>

          {/* Completion badge */}
          <div className="flex-shrink-0 text-right">
            <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
              score.isComplete
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {score.isComplete ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {totalWithDetails}/{totalAvailable} facilities detailed
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-semibold text-[#64748B]">
            <span>{totalAvailable} facilities available</span>
            <span>{totalWithDetails} fully described</span>
          </div>
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4338CA] to-[#7C3AED] rounded-full transition-all duration-500"
              style={{ width: `${totalAvailable ? (totalWithDetails / totalAvailable) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Stage tabs */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1">
          <button type="button" onClick={() => setActiveStage('availability')} className={stageTabClass('availability')}>
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Facility Availability</span>
            <span className="ml-1 bg-white/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
              {totalAvailable}/{FACILITY_DEFINITIONS.length}
            </span>
          </button>
          <button type="button" onClick={() => setActiveStage('details')} className={stageTabClass('details')}>
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Facility Details</span>
            {totalAvailable > 0 && (
              <span className="ml-1 bg-white/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                {totalWithDetails}/{totalAvailable}
              </span>
            )}
          </button>
          <button type="button" onClick={() => setActiveStage('preview')} className={stageTabClass('preview')}>
            <Eye className="w-3.5 h-3.5" />
            <span>Website Preview</span>
          </button>
        </div>
      </div>

      {/* ─── STAGE A: FACILITY AVAILABILITY ──────────────────────────────────── */}
      {activeStage === 'availability' && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-sm text-[#131B2E]">Which facilities does your campus have?</h3>
            <p className="text-[#64748B] mt-0.5">
              Mark each facility as <strong>Available</strong> or <strong>Not Available</strong>.
              Available facilities will be featured on your school website.
            </p>
          </div>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FACILITY_DEFINITIONS.map((def) => {
              const cfg = facilities[def.id];
              const isAvailable = cfg?.available ?? def.defaultAvailable;
              const isExplicitlySet = cfg !== undefined;
              const colorClass = ICON_COLORS[def.iconName] || 'text-slate-500';

              return (
                <div
                  key={def.id}
                  className={`relative flex flex-col gap-2 p-3.5 rounded-xl border transition-all ${
                    isAvailable
                      ? 'border-[#4338CA] bg-[#EEF2FF]/50'
                      : isExplicitlySet
                      ? 'border-slate-200 bg-slate-50/70 opacity-75'
                      : 'border-[#E2E8F0] bg-white'
                  }`}
                >
                  {/* Facility identity */}
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 ${colorClass}`}>
                      {isAvailable ? (
                        <CheckCircle2 className="w-4 h-4 text-[#4338CA]" />
                      ) : isExplicitlySet ? (
                        <X className="w-4 h-4 text-slate-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#131B2E] text-xs leading-snug">{def.title}</div>
                      <div className="text-[10px] text-[#64748B] leading-relaxed mt-0.5 line-clamp-2">
                        {def.description}
                      </div>
                    </div>
                  </div>

                  {/* Yes / No toggle */}
                  {!isReadOnly && (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleFacilityAvailability(def.id, true)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          isAvailable
                            ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-sm'
                            : 'border-[#E2E8F0] text-[#64748B] hover:border-[#4338CA] hover:text-[#4338CA] bg-white'
                        }`}
                      >
                        ✓ Yes, we have it
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFacilityAvailability(def.id, false)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                          isExplicitlySet && !isAvailable
                            ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                            : 'border-[#E2E8F0] text-[#64748B] hover:border-slate-400 hover:text-slate-700 bg-white'
                        }`}
                      >
                        ✗ Not available
                      </button>
                    </div>
                  )}

                  {isReadOnly && (
                    <div className={`text-[10px] font-bold px-2 py-0.5 rounded text-center ${
                      isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {isAvailable ? 'Available' : 'Not Available'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA to next stage */}
          {!isReadOnly && totalAvailable > 0 && (
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-3">
              <p className="text-xs text-[#64748B]">
                <span className="font-bold text-[#4338CA]">{totalAvailable} facilities</span> marked as available.
                Now add descriptions and photos.
              </p>
              <button
                type="button"
                onClick={() => setActiveStage('details')}
                className="flex-shrink-0 px-4 py-2 bg-[#4338CA] text-white text-xs font-bold rounded-xl hover:bg-[#3730A3] transition-colors"
              >
                Add Details →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── STAGE B: FACILITY DETAILS ───────────────────────────────────────── */}
      {activeStage === 'details' && (
        <div className="space-y-3">
          {availableFacilities.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="font-semibold text-[#131B2E]">No facilities marked as available yet.</p>
              <p className="text-[#64748B]">Go back to Facility Availability and mark the facilities your campus has.</p>
              <button
                type="button"
                onClick={() => setActiveStage('availability')}
                className="mt-2 px-4 py-2 bg-[#4338CA] text-white text-xs font-bold rounded-xl hover:bg-[#3730A3] transition-colors"
              >
                ← Go to Availability
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5">
                <h3 className="font-bold text-sm text-[#131B2E]">Add website content for each facility</h3>
                <p className="text-[#64748B] mt-0.5">
                  Click any facility below to expand its form. Add a description and photos that will appear on your school website.
                </p>
              </div>

              {availableFacilities.map((def) => {
                const cfg = facilities[def.id] || {
                  id: def.id,
                  available: true,
                  features: [],
                  photos: [],
                };
                const isExpanded = expandedFacilityId === def.id;
                const activeTask = Object.values(uploadTasks).find(
                  (t) => t.status === 'uploading' || t.status === 'optimizing'
                );

                return (
                  <FacilityDetailForm
                    key={def.id}
                    def={def}
                    config={cfg}
                    isReadOnly={isReadOnly}
                    isExpanded={isExpanded}
                    onToggleExpand={() =>
                      setExpandedFacilityId(isExpanded ? null : def.id)
                    }
                    onUpdateField={(field, value) => updateFacilityField(def.id, field, value)}
                    onPhotoUpload={(files) => handlePhotoUpload(def.id, files)}
                    onRemovePhoto={(photoId) => handleDeletePhoto(def.id, photoId)}
                    onSetHeroPhoto={(photoId) => handleTogglePhotoHero(def.id, photoId)}
                    onUpdatePhotoCaption={(photoId, caption) =>
                      handleSetPhotoCaption(def.id, photoId, caption)
                    }
                    uploadingTaskMessage={activeTask?.message}
                    mediaRegistry={mediaRegistry}
                    onSelectExistingPhotos={(selectedAssets) =>
                      handleSelectExistingPhotos(def.id, selectedAssets)
                    }
                    onDeleteAsset={handleDeleteAssetFromLibrary}
                  />
                );
              })}

              {/* CTA to preview */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveStage('availability')}
                  className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] text-xs font-semibold rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  ← Back to Availability
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStage('preview')}
                  className="px-4 py-2 bg-[#4338CA] text-white text-xs font-bold rounded-xl hover:bg-[#3730A3] transition-colors"
                >
                  Preview Website →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── STAGE C: WEBSITE PREVIEW ────────────────────────────────────────── */}
      {activeStage === 'preview' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-[#4338CA]" />
              <h3 className="font-bold text-sm text-[#131B2E]">Facilities — Website Preview</h3>
            </div>
            <p className="text-[#64748B]">
              This is how your school's facilities will appear on the public website.
            </p>
          </div>

          {availableFacilities.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center">
              <p className="text-[#64748B]">No facilities to preview yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableFacilities.map((def) => {
                const cfg = facilities[def.id];
                const heroPhoto = cfg?.photos?.find((p) => p.isPrimary) || cfg?.photos?.[0];
                const summary = cfg ? def.generateWebsiteSummary(cfg) : def.description;
                const validation = cfg ? def.validate(cfg) : { isValid: false };

                return (
                  <div
                    key={def.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
                  >
                    {/* Hero image */}
                    <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
                      {heroPhoto ? (
                        <img
                          src={heroPhoto.url}
                          alt={heroPhoto.caption || def.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                          <AlertCircle className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-medium">No photo uploaded</span>
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                        validation.isValid
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-700'
                          : 'bg-amber-50/90 border-amber-200 text-amber-700'
                      }`}>
                        {validation.isValid ? '✓ Ready' : '⚠ Incomplete'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3.5 space-y-2">
                      <div className="font-bold text-[#131B2E] text-xs">{def.title}</div>
                      <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-3">
                        {summary || def.description}
                      </p>
                      {cfg?.photos && cfg.photos.length > 0 && (
                        <div className="text-[10px] text-[#64748B]">
                          {cfg.photos.length} photo{cfg.photos.length !== 1 ? 's' : ''} uploaded
                        </div>
                      )}
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedFacilityId(def.id);
                            setActiveStage('details');
                          }}
                          className="w-full mt-1 py-1.5 border border-[#E2E8F0] text-[#4338CA] text-[11px] font-semibold rounded-lg hover:bg-[#EEF2FF] transition-colors"
                        >
                          Edit Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completion summary */}
          <div className={`rounded-2xl border p-4 sm:p-5 ${
            score.isComplete
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              {score.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`font-bold text-sm ${score.isComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {score.isComplete
                    ? 'Facilities section complete!'
                    : `${totalAvailable - totalWithDetails} facilit${totalAvailable - totalWithDetails !== 1 ? 'ies need' : 'y needs'} more details`}
                </div>
                <p className={`text-xs mt-0.5 ${score.isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {score.isComplete
                    ? 'All available facilities have descriptions and content ready for the website.'
                    : 'Add descriptions and photos to fully describe each available facility.'}
                </p>
                {!score.isComplete && score.missingFields && score.missingFields.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {score.missingFields.slice(0, 4).map((msg, i) => (
                      <li key={i} className="text-[11px] text-amber-700 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                        {msg}
                      </li>
                    ))}
                    {score.missingFields.length > 4 && (
                      <li className="text-[11px] text-amber-600 font-semibold">
                        +{score.missingFields.length - 4} more items…
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStage('details')}
              className="px-4 py-2 border border-[#E2E8F0] text-[#64748B] text-xs font-semibold rounded-xl hover:bg-[#F8FAFC] transition-colors"
            >
              ← Back to Details
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Photo Detection Modal */}
      {duplicateModalInfo && (
        <DuplicatePhotoModal
          isOpen={Boolean(duplicateModalInfo)}
          duplicateAsset={duplicateModalInfo.asset}
          targetSectionTitle={
            getFacilityDefinition(duplicateModalInfo.facilityId)?.title || 'Facility Photos'
          }
          isAlreadyInTargetSection={duplicateModalInfo.isAlreadyInFacility}
          onReuseExisting={() =>
            handleReuseExisting(duplicateModalInfo.asset, duplicateModalInfo.facilityId)
          }
          onForceUpload={() => handleForceUploadDuplicate(duplicateModalInfo)}
          onCancel={() => setDuplicateModalInfo(null)}
        />
      )}
    </div>
  );
}
