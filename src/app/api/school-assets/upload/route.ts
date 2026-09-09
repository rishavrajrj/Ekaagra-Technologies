import { NextRequest, NextResponse } from 'next/server';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { CANONICAL_ASSET_CHECKLIST_ITEMS } from '@/lib/schoolAssetChecklist';
import { processAndUploadCanonicalAsset } from '@/lib/imageUploadService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawToken = formData.get('token') as string | null;
    const file = formData.get('file') as File | null;
    const itemId = (formData.get('itemId') as string | null) || 'asset';
    const itemType = ((formData.get('itemType') as string) || 'image') as 'image' | 'document' | 'gallery';
    const campusId = formData.get('campusId') as string | null;
    const personId = formData.get('personId') as string | null;

    if (!rawToken || rawToken.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided for upload.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Token & Project Tenant Verification
    const verification = await verifyOnboardingToken(rawToken);
    if (!verification.valid || !verification.project) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired onboarding session.' },
        { status: 403 }
      );
    }

    const project = verification.project;

    // 2. Determine whether asset is private/sensitive
    const canonicalDef = CANONICAL_ASSET_CHECKLIST_ITEMS.find((c) => c.id === itemId);
    const isPrivate = canonicalDef?.isPrivate ?? (itemType === 'document');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Delegate to Centralized Canonical Upload Service (Sharp WebP optimization & strict validation)
    const assetResult = await processAndUploadCanonicalAsset({
      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },
      buffer,
      tenantId: project.id,
      folderPrefix: isPrivate ? 'private' : 'public',
      bucketName: isPrivate ? 'school-assets-private' : 'school-assets',
      isPrivate,
      itemType,
      authToken: rawToken,
    });

    return NextResponse.json({
      success: true,
      asset: {
        ...assetResult,
        campusId: campusId || undefined,
        personId: personId || undefined,
      },
    });
  } catch (err: any) {
    console.error('[ROUTE ERROR] /api/school-assets/upload:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during upload.' },
      { status: 400 }
    );
  }
}

