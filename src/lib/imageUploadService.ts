import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  optimizeImage,
  toWebpFileName,
  verifyWebpBuffer,
  detectRasterImageType,
  OptimizationOptions,
} from './imageOptimizer';
import {
  validateFileBufferSignature,
  scanAssetForMalware,
  ASSET_UPLOAD_LIMITS,
} from './schoolAssetChecklist';
import { getSchoolsServerClient } from './schoolsDb';
import { getSupabaseServerClient } from './supabase';

export interface UploadAssetInput {
  file: {
    name: string;
    size: number;
    type?: string;
  };
  buffer: Buffer<ArrayBufferLike>;
  tenantId: string; // project.id or school.id
  folderPrefix?: string; // e.g. 'public', 'private', 'campus', 'business'
  bucketName?: 'school-assets' | 'school-assets-private' | 'business-assets' | string;
  isPrivate?: boolean;
  itemType?: 'image' | 'document' | 'gallery';
  optimizationOptions?: OptimizationOptions;
  authToken?: string;
}

export interface CanonicalAssetResult {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  storageKey: string;
  isPrivate: boolean;
  checksumSha256: string;
  uploadedAt: string;
  width: number | null;
  height: number | null;
  originalSize: number;
  optimizedSize: number;
  optimizedFormat: string | null;
}

export function sanitizeFileName(fileName: string): string {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const cleanBase = base
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 60);
  return `${cleanBase}${ext.toLowerCase()}`;
}

export async function processAndUploadCanonicalAsset(
  input: UploadAssetInput
): Promise<CanonicalAssetResult> {
  const {
    file,
    buffer,
    tenantId,
    folderPrefix = 'public',
    bucketName = 'school-assets',
    isPrivate = false,
    itemType = 'image',
    optimizationOptions = {},
    authToken,
  } = input;

  if (!buffer || buffer.length === 0) {
    throw new Error('Upload failed: Empty file buffer provided.');
  }

  if (buffer.length > ASSET_UPLOAD_LIMITS.maxSizeBytes) {
    throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 15MB.`);
  }

  const ext = path.extname(file.name).toLowerCase();
  if (ASSET_UPLOAD_LIMITS.disallowedDangerousExtensions.includes(ext)) {
    throw new Error(`File extension "${ext}" is blocked for security reasons.`);
  }

  const sigValidation = validateFileBufferSignature(buffer, file.name, file.type || '');
  if (!sigValidation.isValid) {
    throw new Error(sigValidation.error || 'File signature validation failed.');
  }

  const malwareScan = await scanAssetForMalware(buffer, file.name);
  if (!malwareScan.isClean) {
    console.warn(`[MALWARE BLOCKED] File ${file.name} blocked by ${malwareScan.scanner}: ${malwareScan.threatName}`);
    throw new Error('Upload rejected by security inspection engine.');
  }

  let finalBuffer: Buffer<ArrayBufferLike> = buffer;
  let finalMimeType = file.type || 'application/octet-stream';
  let optimizationWidth: number | null = null;
  let optimizationHeight: number | null = null;
  let originalFileSize = buffer.length;
  let optimizedFileSize = buffer.length;
  let wasOptimized = false;

  const rasterDetection = detectRasterImageType(buffer, file.name, file.type);

  if (rasterDetection.isRaster && itemType !== 'document') {
    const optimization = await optimizeImage(
      buffer,
      rasterDetection.detectedMime,
      file.name,
      optimizationOptions
    );

    if (optimization.wasOptimized) {
      const isGenuine = await verifyWebpBuffer(optimization.buffer);
      if (!isGenuine) {
        throw new Error('Generated WebP buffer failed strict decode verification.');
      }

      finalBuffer = optimization.buffer;
      finalMimeType = 'image/webp';
      optimizationWidth = optimization.width;
      optimizationHeight = optimization.height;
      originalFileSize = optimization.originalSize;
      optimizedFileSize = optimization.optimizedSize;
      wasOptimized = true;
    }
  } else if (!rasterDetection.isRaster) {
    finalMimeType = rasterDetection.detectedMime;
  }

  const checksumSha256 = crypto.createHash('sha256').update(finalBuffer).digest('hex');
  const sanitizedName = sanitizeFileName(file.name);
  const uniquePrefix = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const finalSanitizedName = wasOptimized
    ? toWebpFileName(sanitizedName)
    : sanitizedName;
  const canonicalAssetName = wasOptimized
    ? toWebpFileName(file.name)
    : file.name;
  const storageFileName = `${uniquePrefix}_${finalSanitizedName}`;

  const cleanFolder = (folderPrefix || (isPrivate ? 'private' : 'public')).replace(/^\/+|\/+$/g, '');
  const storageKey = `${tenantId}/${cleanFolder}/${storageFileName}`;

  let fileUrl = '';

  const schoolsDb = getSchoolsServerClient();
  const supabase = getSupabaseServerClient();
  const storageClient = schoolsDb?.storage || supabase?.storage;

  if (storageClient) {
    try {
      const { data: uploadData, error: uploadErr } = await storageClient
        .from(bucketName)
        .upload(storageKey, finalBuffer, {
          contentType: finalMimeType,
          upsert: true,
        });

      if (!uploadErr && uploadData) {
        if (isPrivate) {
          fileUrl = `/api/school-assets/download?token=${encodeURIComponent(authToken || '')}&key=${encodeURIComponent(storageKey)}`;
        } else {
          const { data: publicUrlData } = storageClient
            .from(bucketName)
            .getPublicUrl(storageKey);
          fileUrl = publicUrlData?.publicUrl || '';
        }
      } else if (uploadErr) {
        console.warn(`[CANONICAL STORAGE WARNING] Could not upload to bucket ${bucketName}:`, uploadErr.message);
      }
    } catch (storageEx) {
      console.warn('[CANONICAL STORAGE EXCEPTION] Supabase upload failed:', storageEx);
    }
  }

  if (!fileUrl) {
    try {
      const subFolder = bucketName === 'business-assets'
        ? path.join('business-assets', tenantId)
        : path.join('school-assets', tenantId, cleanFolder);

      const baseDir = isPrivate
        ? path.join(process.cwd(), 'private', 'uploads', subFolder)
        : path.join(process.cwd(), 'public', 'uploads', subFolder);

      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }
      const localFilePath = path.join(baseDir, storageFileName);
      fs.writeFileSync(localFilePath, finalBuffer);

      if (isPrivate) {
        fileUrl = `/api/school-assets/download?token=${encodeURIComponent(authToken || '')}&key=${encodeURIComponent(storageKey)}`;
      } else if (bucketName === 'business-assets') {
        fileUrl = `/uploads/business-assets/${tenantId}/${storageFileName}`;
      } else {
        fileUrl = `/uploads/school-assets/${tenantId}/${cleanFolder}/${storageFileName}`;
      }
    } catch (localEx) {
      console.error('[LOCAL STORAGE FAILURE] Fallback write error:', localEx);
      const base64 = finalBuffer.toString('base64');
      fileUrl = `data:${finalMimeType};base64,${base64}`;
    }
  }

  return {
    id: uniquePrefix,
    name: canonicalAssetName,
    size: optimizedFileSize,
    type: finalMimeType,
    url: fileUrl,
    storageKey,
    isPrivate,
    checksumSha256,
    uploadedAt: new Date().toISOString(),
    width: optimizationWidth,
    height: optimizationHeight,
    originalSize: originalFileSize,
    optimizedSize: optimizedFileSize,
    optimizedFormat: wasOptimized ? 'webp' : null,
  };
}
