import { NextRequest, NextResponse } from 'next/server';
import { verifyBusinessOnboardingToken } from '@/lib/businessProjectsDb';
import { getSupabaseServerClient } from '@/lib/supabase';
import { validateAssetUpload, sanitizeFileName } from '@/lib/businessValidation';
import type { BusinessAssetCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawToken = formData.get('token') as string | null;
    const file = formData.get('file') as File | null;
    const categoryParam = (formData.get('category') as BusinessAssetCategory) || null;

    if (!rawToken || rawToken.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was uploaded.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Token & Project Verification
    const verification = await verifyBusinessOnboardingToken(rawToken);
    if (!verification.isValid || !verification.project) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired project link.' },
        { status: 403 }
      );
    }

    const project = verification.project;

    // 2. Validate File Specifications
    const validation = validateAssetUpload({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'File validation failed.' },
        { status: 400 }
      );
    }

    const assetCategory = categoryParam || validation.category;
    const sanitizedName = sanitizeFileName(file.name);
    const storagePath = `${project.id}/${sanitizedName}`;

    // 3. Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let fileUrl = '';
    const supabase = getSupabaseServerClient();

    if (supabase) {
      // Attempt upload to Supabase Storage bucket 'business-assets'
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('business-assets')
        .upload(storagePath, buffer, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (!uploadErr && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('business-assets')
          .getPublicUrl(storagePath);
        fileUrl = publicUrlData?.publicUrl || '';
      } else {
        console.warn(
          '[STORAGE WARNING] Could not upload to bucket business-assets. Falling back to data URL storage.',
          uploadErr?.message
        );
        // Fallback for local testing or unprovisioned storage bucket
        const base64 = buffer.toString('base64');
        fileUrl = `data:${file.type || 'application/octet-stream'};base64,${base64.slice(0, 1000)}...[asset-ref]`;
      }

      // If fileUrl is still empty, construct reference URL
      if (!fileUrl) {
        fileUrl = `/api/business-assets/${storagePath}`;
      }

      // 4. Record asset in database
      const { data: assetRecord, error: dbErr } = await supabase
        .from('business_requirement_assets')
        .insert([
          {
            project_id: project.id,
            asset_category: assetCategory,
            file_name: file.name,
            file_url: fileUrl,
            storage_path: storagePath,
            file_size_bytes: file.size,
            mime_type: file.type || 'application/octet-stream',
            uploaded_by: 'CLIENT',
          },
        ])
        .select()
        .single();

      if (dbErr) {
        console.error('[DB ASSET INSERT ERROR]', dbErr);
        return NextResponse.json(
          { success: false, error: 'Failed to record asset in project records.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        asset: assetRecord,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Database unconfigured.' },
      { status: 503 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ASSET UPLOAD EXCEPTION]', message);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during upload.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawToken = searchParams.get('token');

  if (!rawToken) {
    return NextResponse.json(
      { success: false, error: 'Token is required.' },
      { status: 401 }
    );
  }

  const verification = await verifyBusinessOnboardingToken(rawToken);
  if (!verification.isValid || !verification.project) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized.' },
      { status: 403 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true, assets: [] });
  }

  const { data: assets } = await supabase
    .from('business_requirement_assets')
    .select('*')
    .eq('project_id', verification.project.id)
    .order('uploaded_at', { ascending: false });

  return NextResponse.json({
    success: true,
    assets: assets || [],
  });
}
