import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { verifyWebpBuffer, toWebpFileName } from './imageOptimizer';

export interface StaffPhotoOptimizationResult {
  buffer: Buffer;
  fileName: string;
  storageKey: string;
  url: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  originalSize: number;
  optimizedSize: number;
  checksumSha256: string;
}

export interface OptimizeStaffPhotoOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  tenantId: string;
  employeeCode?: string;
  originalFileName: string;
}

/** Maximum allowed upload size for staff photos: 5 MB */
export const MAX_STAFF_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types for staff photos */
const ALLOWED_PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/**
 * Optimizes a staff photograph specifically for institutional ID cards, web directory, and ERP profile records.
 * 
 * Pipeline:
 * 1. Validates size (<= 5MB) and mime signature
 * 2. Auto-rotates via EXIF orientation
 * 3. Fits inside 600x800 without upscale, maintaining aspect ratio
 * 4. Strips extraneous camera/location metadata
 * 5. Encodes to high-fidelity WebP (quality 85)
 * 6. Strictly verifies decodable WebP buffer
 * 7. Stores to local public directory / cloud storage and returns canonical URL
 */
export async function optimizeAndStoreStaffPhoto(
  inputBuffer: Buffer,
  options: OptimizeStaffPhotoOptions
): Promise<StaffPhotoOptimizationResult> {
  const {
    maxWidth = 600,
    maxHeight = 800,
    quality = 85,
    tenantId,
    employeeCode,
    originalFileName,
  } = options;

  const originalSize = inputBuffer.length;

  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Staff photo buffer is empty.');
  }

  if (inputBuffer.length > MAX_STAFF_PHOTO_SIZE_BYTES) {
    throw new Error(
      `Photo size (${(originalSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of 5 MB.`
    );
  }

  // Quick signature check
  const isJpeg = inputBuffer.length >= 3 && inputBuffer[0] === 0xff && inputBuffer[1] === 0xd8 && inputBuffer[2] === 0xff;
  const isPng = inputBuffer.length >= 8 && inputBuffer[0] === 0x89 && inputBuffer[1] === 0x50 && inputBuffer[2] === 0x4e && inputBuffer[3] === 0x47;
  const isWebp = inputBuffer.length >= 12 && inputBuffer[0] === 0x52 && inputBuffer[1] === 0x49 && inputBuffer[2] === 0x46 && inputBuffer[3] === 0x46;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Invalid image format. Staff photos must be JPEG, PNG, or WebP.');
  }

  // Sharp optimization pipeline
  const pipeline = sharp(inputBuffer)
    .rotate() // Auto-orient based on EXIF
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 4,
    });

  const optimizedBuffer = await pipeline.toBuffer();
  const metadata = await sharp(optimizedBuffer).metadata();

  if (!verifyWebpBuffer(optimizedBuffer)) {
    throw new Error('WebP verification failed for optimized staff photo.');
  }

  const checksumSha256 = crypto
    .createHash('sha256')
    .update(optimizedBuffer)
    .digest('hex');

  // Compute canonical file name
  const cleanCode = employeeCode ? employeeCode.replace(/[^a-zA-Z0-9_\-]/g, '_') : '';
  const hashPrefix = checksumSha256.substring(0, 8);
  const baseName = cleanCode ? `${cleanCode}_${hashPrefix}.webp` : toWebpFileName(originalFileName);

  const storageKey = `schools/${tenantId}/staff_photos/${baseName}`;
  const relativeUrlPath = `/uploads/staff/${baseName}`;

  // Store in public/uploads/staff/
  const targetDir = path.join(process.cwd(), 'public', 'uploads', 'staff');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetFilePath = path.join(targetDir, baseName);
  fs.writeFileSync(targetFilePath, optimizedBuffer);

  return {
    buffer: optimizedBuffer,
    fileName: baseName,
    storageKey,
    url: relativeUrlPath,
    mimeType: 'image/webp',
    width: metadata.width || maxWidth,
    height: metadata.height || maxHeight,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    checksumSha256,
  };
}
