import { NextRequest, NextResponse } from 'next/server';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { optimizeAndStoreStaffPhoto } from '@/lib/staffPhotoOptimizer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawToken = formData.get('token') as string | null;
    const file = (formData.get('file') || formData.get('photo')) as File | null;
    const employeeCode = (formData.get('employeeCode') as string | null) || undefined;
    const targetFileName = (formData.get('fileName') as string | null) || file?.name || 'staff_photo.jpg';

    if (!rawToken || rawToken.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file was provided for staff photo.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Token Verification
    const verification = await verifyOnboardingToken(rawToken);
    if (!verification.valid || !verification.project) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Invalid or expired onboarding session.' },
        { status: 403 }
      );
    }

    const project = verification.project;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Process through isolated Staff Photo Pipeline
    const result = await optimizeAndStoreStaffPhoto(buffer, {
      tenantId: project.id,
      employeeCode,
      originalFileName: targetFileName,
      maxWidth: 600,
      maxHeight: 800,
      quality: 85,
    });

    return NextResponse.json({
      success: true,
      photoUrl: result.url,
      checksumSha256: result.checksumSha256,
      asset: {
        url: result.url,
        storageKey: result.storageKey,
        fileName: result.fileName,
        originalFileName: file.name,
        employeeCode,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType,
        checksumSha256: result.checksumSha256,
      },
    });
  } catch (err: any) {
    console.error('[ROUTE ERROR] /api/school-assets/staff-photo:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing staff photo.' },
      { status: 400 }
    );
  }
}
