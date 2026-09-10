/**
 * ==============================================================================
 * CENTRALIZED SCHOOL MEDIA ASSET REGISTRY & DEDUPLICATION ENGINE
 * File: src/lib/mediaRegistryUtils.ts
 * ==============================================================================
 *
 * Implements:
 * 1. Client & server SHA-256 content hashing for instant duplicate interception.
 * 2. Deduplication registry with 1 physical image -> multiple section references.
 * 3. Intelligent category matching across all 11 campus facilities and website sections.
 * 4. Non-destructive section unlinking (preserving global asset integrity).
 * 5. Automatic backward-compatible aggregation of existing campus/facility photos.
 */

import type {
  UniversalIntakeData,
  SharedMediaAsset,
  CampusImageData,
  CampusImageCategory,
  CampusBranchData,
} from './types';
import { isCampusImageCategory, resolveCategoryLabel } from './schoolIntake';

/**
 * Recommendation definitions mapping facility IDs to relevant CampusImageCategories
 */
export interface FacilityCategoryConfig {
  primary: CampusImageCategory[];
  secondary: CampusImageCategory[];
  label: string;
}

export const FACILITY_CATEGORY_RECOMMENDATIONS: Record<string, FacilityCategoryConfig> = {
  smart_classrooms: {
    primary: ['classrooms'],
    secondary: ['campus_buildings', 'activities'],
    label: 'Classrooms & Smart Learning Spaces',
  },
  computer_lab: {
    primary: ['laboratories', 'classrooms'],
    secondary: ['campus_buildings'],
    label: 'IT & Computer Laboratories',
  },
  science_lab: {
    primary: ['laboratories'],
    secondary: ['campus_buildings'],
    label: 'Science & STEM Laboratories',
  },
  library: {
    primary: ['library'],
    secondary: ['campus_buildings', 'activities'],
    label: 'Library & Reading Rooms',
  },
  sports_playground: {
    primary: ['sports_playground', 'activities'],
    secondary: ['campus_buildings', 'events'],
    label: 'Playground, Sports & Athletics',
  },
  sports: {
    primary: ['sports_playground', 'activities'],
    secondary: ['campus_buildings', 'events'],
    label: 'Playground, Sports & Athletics',
  },
  auditorium: {
    primary: ['events', 'activities', 'campus_buildings'],
    secondary: ['other'],
    label: 'Auditorium & Multipurpose Halls',
  },
  cafeteria: {
    primary: ['cafeteria'],
    secondary: ['campus_buildings'],
    label: 'Cafeteria & Dining Infrastructure',
  },
  medical_room: {
    primary: ['campus_buildings', 'other'],
    secondary: [],
    label: 'Infirmary & First Aid Bay',
  },
  transport: {
    primary: ['transport'],
    secondary: ['campus_buildings'],
    label: 'Transport & Fleet Logistics',
  },
  hostel: {
    primary: ['campus_buildings', 'other'],
    secondary: ['cafeteria'],
    label: 'Residential Hostel & Boarding',
  },
  security_cctv: {
    primary: ['campus_buildings', 'other'],
    secondary: [],
    label: 'Campus Security & Gate Infrastructure',
  },
  cctv_security: {
    primary: ['campus_buildings', 'other'],
    secondary: [],
    label: 'Campus Security & Gate Infrastructure',
  },
  other: {
    primary: ['campus_buildings', 'other'],
    secondary: [],
    label: 'General Campus Facilities',
  },
};

/**
 * Compute SHA-256 hash from a browser File object using the native Web Crypto API.
 */
export async function computeFileSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return computeBufferSha256(buffer);
}

/**
 * Compute SHA-256 hex string from an ArrayBuffer or Uint8Array.
 * Works seamlessly in both browser (window.crypto.subtle) and modern Node/SSR.
 */
export async function computeBufferSha256(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer as ArrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js or environment without window.crypto.subtle
  try {
    const cryptoModule = await import('crypto');
    const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return cryptoModule.createHash('sha256').update(u8).digest('hex');
  } catch {
    // Graceful fallback if crypto module cannot be resolved
    return `hash-${buffer.byteLength}-${Date.now()}`;
  }
}

/**
 * Search the media registry for an identical photo:
 * 1. By content hash (SHA-256 checksum)
 * 2. By file name and exact byte size as fallback
 * 3. By matching clean URL or storage key
 */
export function findDuplicateAsset(
  registry: SharedMediaAsset[],
  hash?: string | null,
  fileMeta?: { name?: string; size?: number; url?: string }
): SharedMediaAsset | null {
  if (!registry || registry.length === 0) return null;

  // 1. Authoritative Hash Match
  if (hash && hash.trim()) {
    const cleanHash = hash.trim().toLowerCase();
    const match = registry.find((a) => a.hash && a.hash.toLowerCase() === cleanHash);
    if (match) return match;
  }

  // 2. URL or Storage Key Match
  if (fileMeta?.url) {
    const matchUrl = registry.find((a) => a.url === fileMeta.url || (a.storageKey && fileMeta.url?.includes(a.storageKey)));
    if (matchUrl) return matchUrl;
  }

  // 3. Exact File Name and Size Match
  if (fileMeta?.name && fileMeta?.size && fileMeta.size > 0) {
    const matchNameSize = registry.find(
      (a) => a.fileName.toLowerCase() === fileMeta.name?.toLowerCase() && a.size === fileMeta.size
    );
    if (matchNameSize) return matchNameSize;
  }

  return null;
}

/**
 * Inspect whether an asset is relevant for a given facility or onboarding section.
 */
export function isAssetRelevantForSection(
  asset: SharedMediaAsset,
  sectionId: string
): boolean {
  const mapping = FACILITY_CATEGORY_RECOMMENDATIONS[sectionId];
  if (!mapping) return false;

  const allRelevantCategories = new Set([...mapping.primary, ...mapping.secondary]);
  return (asset.categories || []).some((c) => allRelevantCategories.has(c as CampusImageCategory));
}

/**
 * Categorize assets into Recommended vs All School Photos for a target section.
 */
export function filterAssetsForSection(
  assets: SharedMediaAsset[],
  sectionId: string,
  categoryFilter?: string
): { recommended: SharedMediaAsset[]; all: SharedMediaAsset[] } {
  let list = assets || [];

  if (categoryFilter && categoryFilter !== 'all') {
    list = list.filter((a) => (a.categories || []).includes(categoryFilter));
  }

  const mapping = FACILITY_CATEGORY_RECOMMENDATIONS[sectionId];
  if (!mapping) {
    return { recommended: [], all: list };
  }

  const primarySet = new Set(mapping.primary);
  const secondarySet = new Set(mapping.secondary);

  const recommended: SharedMediaAsset[] = [];
  const others: SharedMediaAsset[] = [];

  list.forEach((asset) => {
    const hasPrimary = (asset.categories || []).some((c) => primarySet.has(c as CampusImageCategory));
    const hasSecondary = (asset.categories || []).some((c) => secondarySet.has(c as CampusImageCategory));

    if (hasPrimary || hasSecondary) {
      recommended.push(asset);
    } else {
      others.push(asset);
    }
  });

  return {
    recommended,
    all: list,
  };
}

/**
 * Convert a CampusImageData to a SharedMediaAsset
 */
export function campusImageToSharedAsset(
  img: CampusImageData,
  source: SharedMediaAsset['source'] = 'campus',
  usedInSections: string[] = ['campus']
): SharedMediaAsset {
  const cat = (img.category || img.imageCategory || 'campus_buildings') as string;
  return {
    id: img.sharedAssetId || img.id,
    url: img.url,
    thumbnailUrl: img.url,
    fileName: img.fileName || 'photo.webp',
    mimeType: img.mimeType || 'image/webp',
    size: img.optimizedSize || img.originalSize || 0,
    width: img.width ?? null,
    height: img.height ?? null,
    hash: img.checksumSha256,
    categories: [cat],
    source,
    usedIn: Array.from(new Set(usedInSections)),
    caption: img.caption || '',
    uploadedAt: img.createdAt || new Date().toISOString(),
    storageKey: img.storageKey,
    isHero: Boolean(img.isHero),
  };
}

/**
 * Convert a SharedMediaAsset to CampusImageData for section consumption
 */
export function sharedAssetToCampusImage(
  asset: SharedMediaAsset,
  overrides?: Partial<CampusImageData>
): CampusImageData {
  const primaryCategory = (asset.categories[0] as CampusImageCategory) || 'campus_buildings';
  return {
    id: `img-${asset.id}-${Date.now().toString(36).substring(4)}`,
    sharedAssetId: asset.id,
    campusId: overrides?.campusId || 'main-campus',
    storageKey: asset.storageKey || asset.id,
    fileName: asset.fileName,
    url: asset.url,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    originalSize: asset.size,
    optimizedSize: asset.size,
    optimizedFormat: 'webp',
    checksumSha256: asset.hash,
    category: overrides?.category || primaryCategory,
    imageCategory: overrides?.imageCategory || primaryCategory,
    imageType: overrides?.imageType || resolveCategoryLabel(primaryCategory),
    caption: overrides?.caption || asset.caption || '',
    isPrimary: overrides?.isPrimary ?? false,
    isHero: overrides?.isHero ?? asset.isHero ?? false,
    sourceSection: asset.source,
    createdAt: asset.uploadedAt,
    ...overrides,
  };
}

/**
 * Synchronizes and computes the comprehensive media registry from the intake data.
 * Aggregates:
 * 1. Root `mediaRegistry`
 * 2. `campuses[].images`
 * 3. `facilitiesConfig.facilities[].photos`
 * 4. `transportConfig.fleetPhotos` / `transportConfig.images`
 * 5. `hostelConfig.images`
 * 6. `libraryConfig.images`
 *
 * Guarantees zero duplicates in the registry and accurate `usedIn` tracking.
 */
export function getEffectiveMediaRegistry(intakeData: Partial<UniversalIntakeData>): SharedMediaAsset[] {
  const registryMap = new Map<string, SharedMediaAsset>();

  // Helper to get a stable key for deduplication
  const getAssetKey = (item: { id?: string; url?: string; hash?: string; checksumSha256?: string; fileName?: string; size?: number }) => {
    if (item.hash) return `hash:${item.hash.toLowerCase()}`;
    if (item.checksumSha256) return `hash:${item.checksumSha256.toLowerCase()}`;
    if (item.url && !item.url.startsWith('blob:')) return `url:${item.url}`;
    if (item.id) return `id:${item.id}`;
    if (item.fileName && item.size) return `name:${item.fileName.toLowerCase()}_${item.size}`;
    return null;
  };

  // 1. Seed with root mediaRegistry if already present
  if (Array.isArray(intakeData.mediaRegistry)) {
    intakeData.mediaRegistry.forEach((asset) => {
      const key = getAssetKey(asset);
      if (key) {
        registryMap.set(key, {
          ...asset,
          usedIn: Array.isArray(asset.usedIn) ? [...asset.usedIn] : [],
          categories: Array.isArray(asset.categories) ? [...asset.categories] : ['campus_buildings'],
        });
      }
    });
  }

  // Helper to upsert image into map
  const recordImage = (
    img: CampusImageData,
    source: SharedMediaAsset['source'],
    sectionIdentifier: string
  ) => {
    if (!img || !img.url) return;
    const key = getAssetKey(img);
    if (!key) return;

    const existing = registryMap.get(key);
    const cat = (img.category || img.imageCategory || 'campus_buildings') as string;

    if (existing) {
      // Add section to usedIn if not already present
      if (!existing.usedIn.includes(sectionIdentifier)) {
        existing.usedIn.push(sectionIdentifier);
      }
      // Merge categories
      if (cat && !existing.categories.includes(cat)) {
        existing.categories.push(cat);
      }
      if (!existing.hash && img.checksumSha256) {
        existing.hash = img.checksumSha256;
      }
      if (!existing.caption && img.caption) {
        existing.caption = img.caption;
      }
    } else {
      const newAsset = campusImageToSharedAsset(img, source, [sectionIdentifier]);
      registryMap.set(key, newAsset);
    }
  };

  // 2. Scan Campuses
  (intakeData.campuses || []).forEach((campus) => {
    (campus.images || []).forEach((img) => {
      recordImage(img, 'campus', 'campus');
    });
  });

  // 3. Scan Facilities
  const facilities = intakeData.facilitiesConfig?.facilities || {};
  Object.entries(facilities).forEach(([facilityId, facConfig]) => {
    (facConfig.photos || []).forEach((photo) => {
      recordImage(photo, 'facilities', `facility_${facilityId}`);
    });
  });

  // 4. Scan Transport
  (intakeData.transportConfig?.fleetPhotos || []).forEach((img) => {
    recordImage(img, 'other', 'transport');
  });
  (intakeData.transportConfig?.images || []).forEach((img) => {
    recordImage(img, 'other', 'transport');
  });

  // 5. Scan Hostel
  (intakeData.hostelConfig?.images || []).forEach((img) => {
    recordImage(img, 'other', 'hostel');
  });

  // 6. Scan Library
  (intakeData.libraryConfig?.images || []).forEach((img) => {
    recordImage(img, 'other', 'library');
  });

  // 7. Scan Leadership (Principal & Management)
  const principalPhoto = intakeData.leadership?.principalPhoto;
  const principalPhotoUrl = intakeData.leadership?.principalPhotoUrl || principalPhoto?.url;
  if (principalPhoto && principalPhoto.url) {
    const key = getAssetKey(principalPhoto);
    if (key) {
      const existing = registryMap.get(key);
      if (existing) {
        if (!existing.usedIn.includes('leadership')) existing.usedIn.push('leadership');
        if (!existing.usedIn.includes('principal_portrait')) existing.usedIn.push('principal_portrait');
        if (!existing.categories.includes('principal')) existing.categories.push('principal');
        if (!existing.categories.includes('leadership')) existing.categories.push('leadership');
        if (principalPhoto.checksumSha256 && !existing.hash) existing.hash = principalPhoto.checksumSha256;
      } else {
        registryMap.set(key, {
          id: principalPhoto.id || 'lead-principal-photo',
          url: principalPhoto.url,
          thumbnailUrl: principalPhoto.url,
          fileName: principalPhoto.fileName || 'principal.webp',
          mimeType: principalPhoto.mimeType || 'image/webp',
          size: principalPhoto.optimizedSize || principalPhoto.originalSize || 0,
          width: principalPhoto.width ?? null,
          height: principalPhoto.height ?? null,
          hash: principalPhoto.checksumSha256,
          categories: ['leadership', 'principal', 'people'],
          source: 'leadership',
          usedIn: ['leadership', 'principal_portrait', 'homepage'],
          caption: principalPhoto.caption || 'Principal / Head of Institution Portrait',
          uploadedAt: principalPhoto.createdAt || new Date().toISOString(),
          storageKey: principalPhoto.storageKey,
        });
      }
    }
  } else if (principalPhotoUrl && principalPhotoUrl.trim().length > 0) {
    const key = `url:${principalPhotoUrl.trim()}`;
    if (!registryMap.has(key)) {
      registryMap.set(key, {
        id: 'lead-principal-photo',
        url: principalPhotoUrl.trim(),
        thumbnailUrl: principalPhotoUrl.trim(),
        fileName: 'principal.webp',
        mimeType: 'image/webp',
        size: 0,
        width: null,
        height: null,
        categories: ['leadership', 'principal', 'people'],
        source: 'leadership',
        usedIn: ['leadership', 'principal_portrait', 'homepage'],
        caption: 'Principal / Head of Institution Portrait',
        uploadedAt: new Date().toISOString(),
      });
    }
  }

  (intakeData.leadership?.managementMembers || []).forEach((m, idx) => {
    if (m.photo && m.photo.url) {
      const key = getAssetKey(m.photo);
      if (key) {
        const existing = registryMap.get(key);
        if (existing) {
          if (!existing.usedIn.includes('leadership')) existing.usedIn.push('leadership');
          if (!existing.categories.includes('leadership')) existing.categories.push('leadership');
        } else {
          registryMap.set(key, {
            id: m.photo.id || `mgmt-${idx}-${m.id}`,
            url: m.photo.url,
            thumbnailUrl: m.photo.url,
            fileName: m.photo.fileName || `mgmt-${idx + 1}.webp`,
            mimeType: m.photo.mimeType || 'image/webp',
            size: m.photo.optimizedSize || m.photo.originalSize || 0,
            width: m.photo.width ?? null,
            height: m.photo.height ?? null,
            hash: m.photo.checksumSha256,
            categories: ['leadership', 'people'],
            source: 'leadership',
            usedIn: ['leadership'],
            caption: m.photo.caption || `${m.name || 'Management'} Portrait`,
            uploadedAt: m.photo.createdAt || new Date().toISOString(),
            storageKey: m.photo.storageKey,
          });
        }
      }
    }
  });

  return Array.from(registryMap.values());
}

/**
 * Register a newly uploaded asset into the central media registry.
 * If an identical asset is already present, appends the section reference instead.
 */
export function registerMediaAsset<T extends Partial<UniversalIntakeData>>(
  intakeData: T,
  newAsset: SharedMediaAsset
): { updatedIntakeData: T; asset: SharedMediaAsset; isDuplicate: boolean } {
  const currentRegistry = getEffectiveMediaRegistry(intakeData);
  const duplicate = findDuplicateAsset(currentRegistry, newAsset.hash, {
    name: newAsset.fileName,
    size: newAsset.size,
    url: newAsset.url,
  });

  if (duplicate) {
    // Append section reference to existing asset
    const mergedUsedIn = Array.from(new Set([...duplicate.usedIn, ...newAsset.usedIn]));
    const mergedCategories = Array.from(new Set([...duplicate.categories, ...newAsset.categories]));

    const updatedAsset: SharedMediaAsset = {
      ...duplicate,
      usedIn: mergedUsedIn,
      categories: mergedCategories,
    };

    const nextRegistry = currentRegistry.map((a) => (a.id === duplicate.id ? updatedAsset : a));

    return {
      updatedIntakeData: {
        ...intakeData,
        mediaRegistry: nextRegistry,
      },
      asset: updatedAsset,
      isDuplicate: true,
    };
  }

  // Clean new asset
  const cleanAsset: SharedMediaAsset = {
    ...newAsset,
    usedIn: Array.from(new Set(newAsset.usedIn || [])),
    categories: Array.from(new Set(newAsset.categories || ['campus_buildings'])),
  };

  return {
    updatedIntakeData: {
      ...intakeData,
      mediaRegistry: [...currentRegistry, cleanAsset],
    },
    asset: cleanAsset,
    isDuplicate: false,
  };
}

/**
 * Attach an existing shared media asset to a target section without physical re-upload.
 */
export function attachAssetToSection<T extends Partial<UniversalIntakeData>>(
  intakeData: T,
  assetId: string,
  sectionKey: string
): { updatedIntakeData: T; asset: SharedMediaAsset | null } {
  const registry = getEffectiveMediaRegistry(intakeData);
  const target = registry.find((a) => a.id === assetId || a.url === assetId || a.hash === assetId);

  if (!target) {
    return { updatedIntakeData: intakeData, asset: null };
  }

  if (target.usedIn.includes(sectionKey)) {
    return { updatedIntakeData: intakeData, asset: target };
  }

  const updatedAsset: SharedMediaAsset = {
    ...target,
    usedIn: [...target.usedIn, sectionKey],
  };

  const nextRegistry = registry.map((a) => (a.id === target.id ? updatedAsset : a));

  return {
    updatedIntakeData: {
      ...intakeData,
      mediaRegistry: nextRegistry,
    },
    asset: updatedAsset,
  };
}

/**
 * Remove an image reference from a section without deleting the actual physical image asset.
 * The asset is preserved in the central registry for other sections to continue using.
 */
export function detachAssetFromSection<T extends Partial<UniversalIntakeData>>(
  intakeData: T,
  assetIdOrUrl: string,
  sectionKey: string
): T {
  const registry = getEffectiveMediaRegistry(intakeData);

  const nextRegistry = registry.map((asset) => {
    if (asset.id === assetIdOrUrl || asset.url === assetIdOrUrl || asset.hash === assetIdOrUrl) {
      return {
        ...asset,
        usedIn: asset.usedIn.filter((sec) => sec !== sectionKey),
      };
    }
    return asset;
  });

  return {
    ...intakeData,
    mediaRegistry: nextRegistry,
  };
}

/**
 * Format source badge label for UI display
 */
export function formatMediaSource(source: SharedMediaAsset['source'] | string): string {
  switch (source) {
    case 'campus':
      return 'Campus Photos';
    case 'facilities':
      return 'Facilities';
    case 'leadership':
      return 'Leadership';
    default:
      return 'School Gallery';
  }
}

/**
 * Format category badges for UI display
 */
export function formatAssetCategories(categories: string[]): string {
  if (!categories || categories.length === 0) return 'General';
  return categories
    .map((c) => (isCampusImageCategory(c) ? resolveCategoryLabel(c as CampusImageCategory) : c.replace(/_/g, ' ')))
    .join(', ');
}

/**
 * Completely purge a media asset from the intake data:
 * - Removes from root mediaRegistry
 * - Removes from all campuses[].images
 * - Removes from all facilitiesConfig.facilities[].photos
 * - Removes from transportConfig.fleetPhotos / images
 * - Removes from hostelConfig.images
 * - Removes from libraryConfig.images
 */
export function purgeAssetFromIntake<T extends Partial<UniversalIntakeData>>(
  intakeData: T,
  assetIdOrUrl: string
): { updatedIntakeData: T; purgedStorageKey?: string } {
  const cleanId = (assetIdOrUrl || '').toLowerCase();
  const matchKeys = new Set<string>();
  if (cleanId) matchKeys.add(cleanId);

  let foundStorageKey: string | undefined;

  // 1. Locate in registry to collect all alias keys (url, storageKey, hash)
  const currentRegistry = intakeData.mediaRegistry || [];
  const targetAsset = currentRegistry.find(
    (a) =>
      (a.id && a.id.toLowerCase() === cleanId) ||
      (a.url && a.url.toLowerCase() === cleanId) ||
      (a.storageKey && a.storageKey.toLowerCase() === cleanId) ||
      (a.hash && a.hash.toLowerCase() === cleanId)
  );

  if (targetAsset) {
    if (targetAsset.id) matchKeys.add(targetAsset.id.toLowerCase());
    if (targetAsset.url) matchKeys.add(targetAsset.url.toLowerCase());
    if (targetAsset.storageKey) matchKeys.add(targetAsset.storageKey.toLowerCase());
    if (targetAsset.hash) matchKeys.add(targetAsset.hash.toLowerCase());
    foundStorageKey = targetAsset.storageKey;
  }

  const isMatch = (item: {
    id?: string;
    sharedAssetId?: string;
    url?: string;
    storageKey?: string;
    hash?: string;
    checksumSha256?: string;
  }) => {
    if (!item) return false;
    if (item.id && matchKeys.has(item.id.toLowerCase())) return true;
    if (item.sharedAssetId && matchKeys.has(item.sharedAssetId.toLowerCase())) return true;
    if (item.url && matchKeys.has(item.url.toLowerCase())) return true;
    if (item.storageKey && matchKeys.has(item.storageKey.toLowerCase())) return true;
    if (item.hash && matchKeys.has(item.hash.toLowerCase())) return true;
    if (item.checksumSha256 && matchKeys.has(item.checksumSha256.toLowerCase())) return true;
    return false;
  };

  const nextRegistry = currentRegistry.filter((a) => !isMatch(a));

  // 2. Purge from campuses
  const nextCampuses = (intakeData.campuses || []).map((campus) => ({
    ...campus,
    images: (campus.images || []).filter((img) => {
      if (isMatch(img)) {
        if (!foundStorageKey && img.storageKey) foundStorageKey = img.storageKey;
        return false;
      }
      return true;
    }),
  }));

  // 3. Purge from facilities
  const currentFacilities = intakeData.facilitiesConfig?.facilities || {};
  const nextFacilities: Record<string, any> = {};
  Object.entries(currentFacilities).forEach(([facId, facConfig]) => {
    nextFacilities[facId] = {
      ...facConfig,
      photos: (facConfig.photos || []).filter((p: any) => {
        if (isMatch(p)) {
          if (!foundStorageKey && p.storageKey) foundStorageKey = p.storageKey;
          return false;
        }
        return true;
      }),
    };
  });

  // 4. Purge from transport
  const nextTransport = intakeData.transportConfig
    ? {
        ...intakeData.transportConfig,
        fleetPhotos: (intakeData.transportConfig.fleetPhotos || []).filter((p) => !isMatch(p)),
        images: (intakeData.transportConfig.images || []).filter((p) => !isMatch(p)),
      }
    : intakeData.transportConfig;

  // 5. Purge from hostel
  const nextHostel = intakeData.hostelConfig
    ? {
        ...intakeData.hostelConfig,
        images: (intakeData.hostelConfig.images || []).filter((p) => !isMatch(p)),
      }
    : intakeData.hostelConfig;

  // 6. Purge from library
  const nextLibrary = intakeData.libraryConfig
    ? {
        ...intakeData.libraryConfig,
        images: (intakeData.libraryConfig.images || []).filter((p) => !isMatch(p)),
      }
    : intakeData.libraryConfig;

  return {
    updatedIntakeData: {
      ...intakeData,
      mediaRegistry: nextRegistry,
      campuses: nextCampuses,
      facilitiesConfig: intakeData.facilitiesConfig
        ? {
            ...intakeData.facilitiesConfig,
            facilities: nextFacilities,
          }
        : intakeData.facilitiesConfig,
      transportConfig: nextTransport,
      hostelConfig: nextHostel,
      libraryConfig: nextLibrary,
    },
    purgedStorageKey: foundStorageKey,
  };
}
