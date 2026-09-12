import { NextRequest, NextResponse } from 'next/server';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, storageKey } = body;

    if (!token || !storageKey) {
      return NextResponse.json(
        { success: false, error: 'Token and storageKey are required.' },
        { status: 400 }
      );
    }

    // 1. Authoritative Token & Project Tenant Verification
    const verification = await verifyOnboardingToken(token);
    if (!verification.valid || !verification.project) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Invalid session token.' },
        { status: 403 }
      );
    }

    const project = verification.project;

    // 2. Strict Tenant Ownership Verification
    const isOwner = storageKey.startsWith(`${project.id}/`) || storageKey.startsWith(`school-projects/${project.id}/`);
    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cross-tenant deletion attempt blocked.' },
        { status: 403 }
      );
    }

    const schoolsDb = getSchoolsServerClient();
    const isPrivate = storageKey.includes('/private/');
    const targetBuckets = isPrivate
      ? ['school-private', 'school-assets-private']
      : ['school-public', 'school-assets'];

    const keyCandidates = [
      storageKey,
      storageKey.startsWith('school-projects/') ? storageKey.replace(/^school-projects\//, '') : `school-projects/${storageKey}`,
    ];

    // 3. Delete from Supabase Storage & canonical DB table
    if (schoolsDb) {
      for (const bucket of targetBuckets) {
        try {
          await schoolsDb.storage.from(bucket).remove(keyCandidates);
        } catch (storageEx) {
          console.warn('[STORAGE DELETE WARNING] Supabase remove error:', storageEx);
        }
      }
      try {
        await schoolsDb.from('school_assets').delete().in('storage_path', keyCandidates);
      } catch (dbErr) {
        console.warn('[DB DELETE WARNING] Could not delete from school_assets:', dbErr);
      }
    }

    // 4. Delete from local filesystem if exists
    try {
      const candidatePaths = [
        path.join(process.cwd(), 'public', 'uploads', 'school-assets', storageKey),
        path.join(process.cwd(), 'private', 'uploads', 'school-assets', storageKey),
        path.join(process.cwd(), 'public', 'uploads', 'school-assets', storageKey.replace(/^([^/]+)\/(?:private|public)\//, '$1/')),
        path.join(process.cwd(), 'private', 'uploads', 'school-assets', storageKey.replace(/^([^/]+)\/(?:private|public)\//, '$1/')),
      ];
      if (project?.id) {
        const baseName = path.basename(storageKey);
        candidatePaths.push(
          path.join(process.cwd(), 'public', 'uploads', 'school-assets', project.id, 'public', baseName),
          path.join(process.cwd(), 'private', 'uploads', 'school-assets', project.id, 'private', baseName),
          path.join(process.cwd(), 'public', 'uploads', 'school-assets', project.id, baseName)
        );
      }
      for (const p of candidatePaths) {
        if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
          try {
            fs.unlinkSync(/*turbopackIgnore: true*/ p);
          } catch (e) {
            console.warn('[LOCAL DELETE WARNING] Could not unlink:', p, e);
          }
        }
      }
    } catch (localEx) {
      console.warn('[LOCAL DELETE WARNING] Local unlink error:', localEx);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ROUTE ERROR] /api/school-assets/delete:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error during delete.' },
      { status: 500 }
    );
  }
}
