import { getSchoolsServerClient } from './schoolsDb';

export interface CanonicalSchoolAssetRecord {
  id?: string;
  school_project_id: string;
  section: string;
  asset_type: string;
  original_filename: string;
  storage_bucket: 'school-public' | 'school-private';
  storage_path: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
  caption?: string | null;
  visibility?: 'public' | 'private';
  status?: 'pending' | 'provided' | 'verified' | 'rejected';
  source?: string;
  checksum_sha256?: string;
}

/**
 * Return the public CDN URL for an object stored in school-public.
 */
export function getSchoolAssetPublicUrl(storagePath: string, bucket: string = 'school-public'): string {
  const client = getSchoolsServerClient();
  if (!client) {
    const url = process.env.SCHOOLS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const cleanUrl = url.replace(/\/+$/, '');
    const cleanPath = storagePath.replace(/^\/+/, '');
    return `${cleanUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Generate a short-lived signed URL for an object stored in school-private.
 */
export async function getSchoolAssetSignedUrl(
  storagePath: string,
  bucket: string = 'school-private',
  expiresInSeconds: number = 3600
): Promise<string | null> {
  const client = getSchoolsServerClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage.from(bucket).createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data) {
      console.warn(`[ASSET SERVICE] Failed to create signed URL for ${bucket}/${storagePath}:`, error?.message);
      return null;
    }
    return data.signedUrl;
  } catch (err: any) {
    console.warn(`[ASSET SERVICE] Error creating signed URL:`, err.message);
    return null;
  }
}

/**
 * Resolve any asset reference to a playable, renderable URL.
 * Automatically converts legacy local '/uploads/school-assets/...' paths
 * into direct Supabase Storage CDN URLs.
 */
export function resolveSchoolAssetUrl(
  input: string | { url?: string; storagePath?: string; storageKey?: string; storageBucket?: string; isPrivate?: boolean } | null | undefined,
  token?: string
): string {
  if (!input) return '';

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return '';

    // If already absolute remote URL (Supabase Storage or CDN), return as-is
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      return trimmed;
    }

    // If it is a download route with token, return as-is
    if (trimmed.startsWith('/api/school-assets/download')) {
      return trimmed;
    }

    // If it is a legacy local upload path: /uploads/school-assets/<tenantId>/public/<fileName>
    if (trimmed.startsWith('/uploads/school-assets/')) {
      const relative = trimmed.replace(/^\/uploads\/school-assets\//, '');
      const parts = relative.split('/');
      const isPrivate = parts.includes('private');
      const bucket = isPrivate ? 'school-private' : 'school-public';
      const storageKey = relative.startsWith('school-projects/') ? relative : `school-projects/${relative}`;
      
      if (isPrivate) {
        return `/api/school-assets/download?token=${encodeURIComponent(token || '')}&key=${encodeURIComponent(storageKey)}`;
      }
      return getSchoolAssetPublicUrl(storageKey, bucket);
    }

    // Static site images in public/images
    if (trimmed.startsWith('/images/')) {
      return trimmed;
    }

    // Assume it is a storage path
    const storageKey = trimmed.startsWith('school-projects/') ? trimmed : `school-projects/${trimmed}`;
    return getSchoolAssetPublicUrl(storageKey);
  }

  // Handle object input
  const rawPath = input.storagePath || input.storageKey;
  const bucket = (input.storageBucket as 'school-public' | 'school-private') || (input.isPrivate ? 'school-private' : 'school-public');

  if (rawPath) {
    const storagePath = rawPath.startsWith('school-projects/') ? rawPath : `school-projects/${rawPath}`;
    if (input.isPrivate) {
      return `/api/school-assets/download?token=${encodeURIComponent(token || '')}&key=${encodeURIComponent(storagePath)}`;
    }
    return getSchoolAssetPublicUrl(storagePath, bucket);
  }

  if (input.url) {
    return resolveSchoolAssetUrl(input.url, token);
  }

  return '';
}

/**
 * Register or upsert a canonical record in public.school_assets table.
 */
export async function recordCanonicalSchoolAsset(
  asset: CanonicalSchoolAssetRecord
): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getSchoolsServerClient();
  if (!client) {
    return { success: false, error: 'Schools database client not initialized.' };
  }

  try {
    const { data, error } = await client
      .from('school_assets')
      .upsert(
        {
          school_project_id: asset.school_project_id,
          section: asset.section,
          asset_type: asset.asset_type,
          original_filename: asset.original_filename,
          storage_bucket: asset.storage_bucket,
          storage_path: asset.storage_path,
          mime_type: asset.mime_type,
          file_size: asset.file_size,
          width: asset.width || null,
          height: asset.height || null,
          alt_text: asset.alt_text || null,
          caption: asset.caption || null,
          visibility: asset.visibility || (asset.storage_bucket === 'school-public' ? 'public' : 'private'),
          status: asset.status || 'provided',
          source: asset.source || 'onboarding_upload',
          checksum_sha256: asset.checksum_sha256 || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'storage_bucket,storage_path' }
      )
      .select('id')
      .single();

    if (error) {
      console.warn(`[ASSET SERVICE] Failed to record canonical asset in DB:`, error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error(`[ASSET SERVICE] Exception in recordCanonicalSchoolAsset:`, err);
    return { success: false, error: err.message };
  }
}
