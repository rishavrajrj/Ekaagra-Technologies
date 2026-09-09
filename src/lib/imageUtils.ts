import path from 'path';

/**
 * Pure image utility functions safe for both client and server environments.
 * No native binary dependencies (e.g., sharp).
 */

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

/**
 * Convert any image filename to its canonical .webp equivalent.
 * Safely strips any raster image extension without mangling the base name.
 * 
 * Example:
 * "School Logo FINAL.png" -> "School Logo FINAL.webp"
 * "photo.2026.backup.jpeg" -> "photo.2026.backup.webp"
 * "already.webp" -> "already.webp"
 */
export function toWebpFileName(originalName: string): string {
  if (!originalName) return 'asset.webp';
  const clean = originalName.trim();
  const ext = path.extname(clean);
  if (!ext) return `${clean}.webp`;
  
  if (RASTER_EXTENSIONS.has(ext.toLowerCase())) {
    const base = clean.slice(0, clean.length - ext.length);
    return `${base}.webp`;
  }
  
  const base = clean.replace(/\.[^.]+$/, '');
  return `${base}.webp`;
}

/**
 * Check if a given MIME type or filename represents an optimizable raster image.
 */
export function isOptimizableImage(mimeType: string, fileName?: string): boolean {
  if (OPTIMIZABLE_IMAGE_TYPES.has((mimeType || '').trim().toLowerCase())) return true;
  if (fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return RASTER_EXTENSIONS.has(ext);
  }
  return false;
}

/**
 * Format file size in human-readable form.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculate and format optimization savings.
 * Returns null if optimization was not performed or didn't reduce size.
 */
export function formatOptimizationStats(
  originalSize: number,
  optimizedSize: number
): { percentage: number; summary: string } | null {
  if (originalSize <= 0 || optimizedSize >= originalSize) {
    return null;
  }

  const percentage = Math.round(((originalSize - optimizedSize) / originalSize) * 100);
  const summary = `${formatBytes(originalSize)} -> ${formatBytes(optimizedSize)} (${percentage}% smaller)`;

  return { percentage, summary };
}
