import sharp from 'sharp';
import path from 'path';
import {
  toWebpFileName,
  isOptimizableImage,
  formatBytes,
  formatOptimizationStats,
} from './imageUtils';

export {
  toWebpFileName,
  isOptimizableImage,
  formatBytes,
  formatOptimizationStats,
};

/**
 * Server-side image optimization utility for Ekaagra Technologies.
 * Converts raster images (JPG, PNG, GIF, BMP, TIFF, AVIF, HEIC, WebP) to genuine WebP bytes.
 * SVGs and non-image files (PDFs) pass through untouched.
 */

/** MIME types that sharp can process and convert to WebP */
const OPTIMIZABLE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/bmp',
  'image/x-ms-bmp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

/** MIME types that should NEVER be converted to WebP (vectors, documents) */
const PASSTHROUGH_TYPES = new Set([
  'image/svg+xml',
  'application/pdf',
]);

/** Extensions of raster images that should be converted to WebP */
const RASTER_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.tiff',
  '.tif',
  '.avif',
  '.heic',
  '.heif',
]);

export interface OptimizationResult {
  /** The output buffer (verified WebP or original passthrough) */
  buffer: Buffer;
  /** Output MIME type */
  mimeType: string;
  /** Output file extension including the dot (e.g. '.webp') */
  extension: string;
  /** Image width in pixels (null for non-images) */
  width: number | null;
  /** Image height in pixels (null for non-images) */
  height: number | null;
  /** Original input file size in bytes */
  originalSize: number;
  /** Final output file size in bytes */
  optimizedSize: number;
  /** Whether genuine WebP optimization was performed */
  wasOptimized: boolean;
}

export interface OptimizationOptions {
  /** Maximum width in pixels. Images wider than this are resized down without upscaling. Default: 1920 */
  maxWidth?: number;
  /** WebP quality (1-100). Default: 80 */
  quality?: number;
}



/**
 * Robust detection of raster image types using magic bytes, declared MIME, and file extension.
 * Ensures images are never skipped just because the client sent empty or generic MIME types.
 */
export function detectRasterImageType(
  buffer: Buffer<ArrayBufferLike>,
  fileName: string,
  declaredMime?: string
): { isRaster: boolean; detectedMime: string; extension: string } {
  const normMime = (declaredMime || '').trim().toLowerCase();
  const ext = path.extname(fileName || '').toLowerCase();

  // 1. Explicitly protect non-raster / passthrough types (SVGs & PDFs)
  if (normMime === 'image/svg+xml' || ext === '.svg') {
    return { isRaster: false, detectedMime: 'image/svg+xml', extension: '.svg' };
  }
  if (normMime === 'application/pdf' || ext === '.pdf') {
    return { isRaster: false, detectedMime: 'application/pdf', extension: '.pdf' };
  }

  // Check SVG / PDF magic bytes directly
  if (buffer.length >= 5 && buffer.slice(0, 5).toString('ascii') === '%PDF-') {
    return { isRaster: false, detectedMime: 'application/pdf', extension: '.pdf' };
  }
  if (buffer.length >= 10) {
    const headerStr = buffer.slice(0, 100).toString('utf8').toLowerCase();
    if (headerStr.includes('<svg') || headerStr.includes('<?xml')) {
      return { isRaster: false, detectedMime: 'image/svg+xml', extension: '.svg' };
    }
  }

  // 2. Check Magic Bytes for Raster Images
  if (buffer.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { isRaster: true, detectedMime: 'image/png', extension: '.png' };
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isRaster: true, detectedMime: 'image/jpeg', extension: '.jpg' };
    }
    // GIF: GIF87a or GIF89a (47 49 46 38)
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
      return { isRaster: true, detectedMime: 'image/gif', extension: '.gif' };
    }
    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return { isRaster: true, detectedMime: 'image/webp', extension: '.webp' };
    }
    // BMP: 'BM' (42 4D)
    if (buffer[0] === 0x42 && buffer[1] === 0x4d) {
      return { isRaster: true, detectedMime: 'image/bmp', extension: '.bmp' };
    }
    // TIFF: II*. (49 49 2A 00) or MM.* (4D 4D 00 2A)
    if (
      (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a)
    ) {
      return { isRaster: true, detectedMime: 'image/tiff', extension: '.tiff' };
    }
  }

  // 3. Fallback to declared MIME or extension
  if (OPTIMIZABLE_IMAGE_TYPES.has(normMime)) {
    return { isRaster: true, detectedMime: normMime, extension: ext || mimeTypeToExtension(normMime) };
  }
  if (RASTER_EXTENSIONS.has(ext)) {
    return { isRaster: true, detectedMime: extensionToMimeType(ext), extension: ext };
  }

  return { isRaster: false, detectedMime: normMime || 'application/octet-stream', extension: ext };
}

/**
 * Verify whether a buffer contains genuinely valid WebP bytes.
 * Validates both the binary RIFF...WEBP signature and sharp format metadata.
 */
export async function verifyWebpBuffer(buffer: Buffer<ArrayBufferLike>): Promise<boolean> {
  if (!buffer || buffer.length < 12) return false;
  
  // Fast signature check: 'RIFF' .... 'WEBP'
  const isWebpHeader =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isWebpHeader) return false;

  try {
    const meta = await sharp(buffer).metadata();
    return (
      meta.format === 'webp' &&
      typeof meta.width === 'number' &&
      meta.width > 0 &&
      typeof meta.height === 'number' &&
      meta.height > 0
    );
  } catch {
    return false;
  }
}

/**
 * Optimize a raster image buffer to true WebP format with optional resizing.
 * 
 * - Raster images (JPG, PNG, GIF, BMP, TIFF, AVIF, HEIC, WebP) -> converted to genuine WebP
 * - SVGs -> passthrough untouched
 * - Non-image files (PDF, etc.) -> passthrough untouched
 * 
 * @param inputBuffer - Raw file buffer
 * @param mimeType - Original MIME type or detected type
 * @param fileName - Original filename for extension and fallback detection
 * @param options - Optional optimization settings
 * @returns OptimizationResult with the verified WebP buffer and metadata
 */
export async function optimizeImage(
  inputBuffer: Buffer<ArrayBufferLike>,
  mimeType: string,
  fileName: string = 'image',
  options: OptimizationOptions = {}
): Promise<OptimizationResult> {
  const { maxWidth = 1920, quality = 80 } = options;
  const originalSize = inputBuffer.length;

  const detection = detectRasterImageType(inputBuffer, fileName, mimeType);

  // If not a raster image (SVG, PDF, document), pass through untouched
  if (!detection.isRaster) {
    return {
      buffer: Buffer.from(inputBuffer),
      mimeType: detection.detectedMime,
      extension: detection.extension,
      width: null,
      height: null,
      originalSize,
      optimizedSize: originalSize,
      wasOptimized: false,
    };
  }

  try {
    const pipeline = sharp(inputBuffer);
    const metadata = await pipeline.metadata();
    const inputWidth = metadata.width || 0;
    const inputHeight = metadata.height || 0;

    // Resize only if the image is wider than maxWidth (never upscale)
    const resizedPipeline = pipeline
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
      })
      .webp({ quality });

    const optimizedBuffer = await resizedPipeline.toBuffer();

    // STRICT VERIFICATION: Ensure the output buffer is genuinely decodable WebP
    const isGenuineWebp = await verifyWebpBuffer(optimizedBuffer);
    if (!isGenuineWebp) {
      console.warn('[IMAGE OPTIMIZER] Generated buffer failed strict WebP decode verification.');
      throw new Error('Sharp generated output failed strict WebP decode verification (format, width, height)');
    }

    const outputMeta = await sharp(optimizedBuffer).metadata();
    const outputWidth = outputMeta.width || inputWidth;
    const outputHeight = outputMeta.height || inputHeight;

    return {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      extension: '.webp',
      width: outputWidth,
      height: outputHeight,
      originalSize,
      optimizedSize: optimizedBuffer.length,
      wasOptimized: true,
    };
  } catch (err: any) {
    console.error('[IMAGE OPTIMIZER] Sharp processing failed for raster image:', err);
    throw new Error(`Raster image optimization failed: ${err.message || String(err)}`);
  }
}

/**
 * Extract image dimensions from a buffer without converting.
 * Returns null dimensions for non-image files.
 */
export async function getImageDimensions(
  buffer: Buffer<ArrayBufferLike>,
  mimeType: string
): Promise<{ width: number | null; height: number | null }> {
  const normMime = (mimeType || '').trim().toLowerCase();
  if (!OPTIMIZABLE_IMAGE_TYPES.has(normMime) && !normMime.startsWith('image/')) {
    return { width: null, height: null };
  }

  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || null,
      height: metadata.height || null,
    };
  } catch {
    return { width: null, height: null };
  }
}



/**
 * Map MIME type to a canonical file extension.
 */
function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/pjpeg': '.jpg',
    'image/png': '.png',
    'image/x-png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'image/tiff': '.tiff',
    'image/bmp': '.bmp',
    'image/x-ms-bmp': '.bmp',
    'image/avif': '.avif',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
  };
  return map[mimeType.toLowerCase()] || '';
}

/**
 * Map file extension to a canonical MIME type.
 */
function extensionToMimeType(ext: string): string {
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
    '.bmp': 'image/bmp',
    '.avif': 'image/avif',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.pdf': 'application/pdf',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

