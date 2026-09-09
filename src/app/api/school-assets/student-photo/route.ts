import { NextRequest, NextResponse } from 'next/server';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { optimizeAndStoreStudentPhoto } from '@/lib/studentPhotoOptimizer';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawToken = formData.get('token') as string | null;
    const file = formData.get('file') as File | null;
    const admissionNumber = (formData.get('admissionNumber') as string | null) || undefined;
    const targetFileName = (formData.get('fileName') as string | null) || file?.name || 'student_photo.jpg';

    if (!rawToken || rawToken.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Authentication token is required.' },
        { status: 401 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file was provided for student photo.' },
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

    // 2. Process through isolated Student Photo Pipeline
    const result = await optimizeAndStoreStudentPhoto(buffer, {
      tenantId: project.id,
      originalFileName: targetFileName,
      maxWidth: 600,
      maxHeight: 800,
      quality: 85,
    });

    return NextResponse.json({
      success: true,
      asset: {
        url: result.url,
        storageKey: result.storageKey,
        fileName: result.fileName,
        originalFileName: file.name,
        admissionNumber,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType,
      },
    });
  } catch (err: any) {
    console.error('[ROUTE ERROR] /api/school-assets/student-photo:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error processing student photo.' },
      { status: 400 }
    );
  }
}
