import sharp from 'sharp';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { verifyWebpBuffer, toWebpFileName } from './imageOptimizer';

export interface StudentPhotoOptimizationResult {
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

export interface OptimizeStudentPhotoOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  tenantId: string;
  originalFileName: string;
}

/** Maximum allowed upload size for student photos: 5 MB */
export const MAX_STUDENT_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;

/** Allowed MIME types for student photos */
const ALLOWED_PHOTO_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/**
 * Optimizes a student photograph specifically for institutional ID cards and ERP profile records.
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
export async function optimizeAndStoreStudentPhoto(
  inputBuffer: Buffer,
  options: OptimizeStudentPhotoOptions
): Promise<StudentPhotoOptimizationResult> {
  const {
    maxWidth = 600,
    maxHeight = 800,
    quality = 85,
    tenantId,
    originalFileName,
  } = options;

  const originalSize = inputBuffer.length;

  if (!inputBuffer || inputBuffer.length === 0) {
    throw new Error('Student photo buffer is empty.');
  }

  if (inputBuffer.length > MAX_STUDENT_PHOTO_SIZE_BYTES) {
    throw new Error(
      `Photo size (${(originalSize / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of 5 MB.`
    );
  }

  // Quick signature check
  const isJpeg = inputBuffer.length >= 3 && inputBuffer[0] === 0xff && inputBuffer[1] === 0xd8 && inputBuffer[2] === 0xff;
  const isPng = inputBuffer.length >= 8 && inputBuffer[0] === 0x89 && inputBuffer[1] === 0x50 && inputBuffer[2] === 0x4e && inputBuffer[3] === 0x47;
  const isWebp = inputBuffer.length >= 12 && inputBuffer[0] === 0x52 && inputBuffer[1] === 0x49 && inputBuffer[2] === 0x46 && inputBuffer[3] === 0x46;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Invalid image format. Student photos must be JPEG, PNG, or WebP.');
  }

  // Execute Sharp optimization pipeline
  const pipeline = sharp(inputBuffer)
    .rotate() // Automatically orient based on EXIF orientation tags
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside', // preserves aspect ratio, never crops, fits inside bounds
      withoutEnlargement: true, // never upscale smaller photos
    })
    .webp({
      quality,
      effort: 4,
    });

  const optimizedBuffer = await pipeline.toBuffer();
  const metadata = await sharp(optimizedBuffer).metadata();

  // Verification check
  const isGenuine = await verifyWebpBuffer(optimizedBuffer);
  if (!isGenuine) {
    throw new Error('Optimized student photo failed decodable WebP buffer verification.');
  }

  const checksumSha256 = crypto.createHash('sha256').update(optimizedBuffer).digest('hex');
  const cleanBase = path.basename(originalFileName, path.extname(originalFileName))
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 40);

  const uniqueId = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const webpFileName = `${cleanBase}.webp`;
  const storageFileName = `${uniqueId}_${webpFileName}`;

  // Storage path in public uploads with path traversal protection
  const safeTenantId = (tenantId || 'default').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const baseUploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'students');
  const tenantDir = path.resolve(baseUploadsDir, safeTenantId);

  if (!tenantDir.startsWith(baseUploadsDir)) {
    throw new Error('Invalid tenant path detected.');
  }

  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }

  const filePath = path.resolve(tenantDir, storageFileName);
  if (!filePath.startsWith(tenantDir)) {
    throw new Error('Invalid file destination path detected.');
  }
  fs.writeFileSync(filePath, optimizedBuffer);

  const publicUrl = `/uploads/students/${safeTenantId}/${storageFileName}`;
  const storageKey = `students/${safeTenantId}/${storageFileName}`;

  return {
    buffer: optimizedBuffer,
    fileName: webpFileName,
    storageKey,
    url: publicUrl,
    mimeType: 'image/webp',
    width: metadata.width || maxWidth,
    height: metadata.height || maxHeight,
    originalSize,
    optimizedSize: optimizedBuffer.length,
    checksumSha256,
  };
}
