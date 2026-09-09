import { NextRequest, NextResponse } from 'next/server';
import { verifyBusinessOnboardingToken } from '@/lib/businessProjectsDb';
import { getSupabaseServerClient } from '@/lib/supabase';
import { validateAssetUpload } from '@/lib/businessValidation';
import type { BusinessAssetCategory } from '@/lib/types';
import { processAndUploadCanonicalAsset } from '@/lib/imageUploadService';

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

    // 3. Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Delegate to Centralized Canonical Upload Service (Sharp WebP optimization & strict validation)
    const assetResult = await processAndUploadCanonicalAsset({
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      buffer,
      tenantId: project.id,
      bucketName: 'business-assets',
      itemType: assetCategory === 'DOCUMENT' ? 'document' : 'image',
    });

    const supabase = getSupabaseServerClient();
    if (supabase) {
      // Record asset in database
      const { data: assetRecord, error: dbErr } = await supabase
        .from('business_requirement_assets')
        .insert([
          {
            project_id: project.id,
            asset_category: assetCategory,
            file_name: assetResult.name,
            file_url: assetResult.url,
            storage_path: assetResult.storageKey,
            file_size_bytes: assetResult.size,
            mime_type: assetResult.type,
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
