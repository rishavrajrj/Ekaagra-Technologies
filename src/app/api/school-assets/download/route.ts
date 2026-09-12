import { NextRequest, NextResponse } from 'next/server';
import { verifyOnboardingToken } from '@/lib/schoolHandoff';
import { verifyAdminSession } from '@/lib/adminAuth';
import { getSchoolsServerClient } from '@/lib/schoolsDb';
import { detectRasterImageType, toWebpFileName } from '@/lib/imageOptimizer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Remove internal timestamp and random hash prefixes from stored filenames.
 * e.g. "1725700000000_a1b2c3d4_Official_School_Logo.webp" -> "Official_School_Logo.webp"
 */
function stripUniqueStoragePrefix(fileName: string): string {
  return fileName.replace(/^[0-9]+_[a-fA-F0-9]+_/, '');
}

/**
 * Clean filename to prevent HTTP Header Injection (CRLF, quotes, backslashes).
 */
function sanitizeDownloadFileName(fileName: string): string {
  return fileName
    .replace(/[\r\n\t"]/g, '_')
    .replace(/\\/g, '/')
    .split('/')
    .pop() || 'asset';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const rawKey = searchParams.get('key') || searchParams.get('path') || searchParams.get('url');
    const requestedName = searchParams.get('filename') || searchParams.get('name');
    const forceDownload = searchParams.get('download') === '1';

    if (!rawKey || rawKey.trim() === '') {
      return NextResponse.json({ error: 'Storage key is required.' }, { status: 400 });
    }

    // Clean and normalize storageKey
    let storageKey = rawKey.trim().replace(/^\/+/, '');
    if (storageKey.startsWith('uploads/school-assets/')) {
      storageKey = storageKey.replace(/^uploads\/school-assets\//, '');
    } else if (storageKey.startsWith('public/uploads/school-assets/')) {
      storageKey = storageKey.replace(/^public\/uploads\/school-assets\//, '');
    } else if (storageKey.startsWith('private/uploads/school-assets/')) {
      storageKey = storageKey.replace(/^private\/uploads\/school-assets\//, '');
    }

    // 1. Authoritative Session Verification (Onboarding token OR Admin session)
    let authenticatedProjectId: string | null = null;
    const isAdmin = await verifyAdminSession();

    if (!isAdmin) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized: Session token required.' }, { status: 401 });
      }

      const verification = await verifyOnboardingToken(token);
      if (!verification.valid || !verification.project) {
        return NextResponse.json({ error: 'Forbidden: Invalid session token.' }, { status: 403 });
      }
      authenticatedProjectId = verification.project.id;
    }

    // 2. Strict Tenant Ownership Verification
    // Non-admin requests MUST match the exact project ID prefix of the storageKey
    if (!isAdmin && authenticatedProjectId) {
      if (!storageKey.startsWith(`${authenticatedProjectId}/`)) {
        if (!storageKey.includes('/')) {
          storageKey = `${authenticatedProjectId}/public/${storageKey}`;
        } else {
          return NextResponse.json(
            { error: 'Forbidden: Access to another tenant assets is strictly prohibited.' },
            { status: 403 }
          );
        }
      }
    }

    const isPrivate = storageKey.includes('/private/');
    const candidateBuckets = isPrivate
      ? ['school-private', 'school-assets-private', 'school-public', 'school-assets']
      : ['school-public', 'school-assets', 'school-private', 'school-assets-private'];

    const keyCandidates = [
      storageKey,
      storageKey.startsWith('school-projects/') ? storageKey.replace(/^school-projects\//, '') : `school-projects/${storageKey}`,
    ];

    let fileBuffer: Buffer | null = null;

    // 3. Retrieve from Supabase Storage (checking cloud buckets with key variants)
    const schoolsDb = getSchoolsServerClient();
    if (schoolsDb) {
      for (const bucket of candidateBuckets) {
        for (const candidateKey of keyCandidates) {
          try {
            const { data, error } = await schoolsDb.storage
              .from(bucket)
              .download(candidateKey);

            if (!error && data) {
              const arrayBuf = await data.arrayBuffer();
              fileBuffer = Buffer.from(arrayBuf);
              break;
            }
          } catch {
            // continue checking
          }
        }
        if (fileBuffer) break;
      }
    }

    // 4. Local filesystem fallbacks (checking both with and without cleanFolder prefix)
    if (!fileBuffer) {
      const candidatePaths = [
        // Exact normalized key inside public or private uploads
        path.join(process.cwd(), 'public', 'uploads', 'school-assets', storageKey),
        path.join(process.cwd(), 'private', 'uploads', 'school-assets', storageKey),
        // Fallback: stripped public/private folder
        path.join(
          process.cwd(),
          'public',
          'uploads',
          'school-assets',
          storageKey.replace(/^([^/]+)\/(?:public|private)\//, '$1/')
        ),
        path.join(
          process.cwd(),
          'private',
          'uploads',
          'school-assets',
          storageKey.replace(/^([^/]+)\/(?:public|private)\//, '$1/')
        ),
        // Fallback: direct relative paths
        path.join(process.cwd(), 'public', 'uploads', storageKey),
        path.join(process.cwd(), 'public', storageKey),
      ];

      // Check tenant-scoped subdirectories by filename if tenant ID is known
      if (authenticatedProjectId) {
        const baseName = path.basename(storageKey);
        candidatePaths.push(
          path.join(process.cwd(), 'public', 'uploads', 'school-assets', authenticatedProjectId, 'public', baseName),
          path.join(process.cwd(), 'private', 'uploads', 'school-assets', authenticatedProjectId, 'private', baseName),
          path.join(process.cwd(), 'public', 'uploads', 'school-assets', authenticatedProjectId, baseName)
        );
      }

      for (const candidatePath of candidatePaths) {
        if (fs.existsSync(candidatePath)) {
          try {
            const stat = fs.statSync(candidatePath);
            if (stat.isFile()) {
              fileBuffer = fs.readFileSync(candidatePath);
              break;
            }
          } catch {
            // continue
          }
        }
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    // 6. Authoritative MIME & Format Detection from actual retrieved bytes
    const baseKeyName = path.basename(storageKey);
    const detection = detectRasterImageType(fileBuffer, baseKeyName);

    let canonicalMime = detection.detectedMime;
    let canonicalExt = detection.extension;

    // Direct magic bytes verification for canonical formats
    if (
      fileBuffer.length >= 12 &&
      fileBuffer[0] === 0x52 && fileBuffer[1] === 0x49 && fileBuffer[2] === 0x46 && fileBuffer[3] === 0x46 &&
      fileBuffer[8] === 0x57 && fileBuffer[9] === 0x45 && fileBuffer[10] === 0x42 && fileBuffer[11] === 0x50
    ) {
      canonicalMime = 'image/webp';
      canonicalExt = '.webp';
    } else if (fileBuffer.length >= 5 && fileBuffer.slice(0, 5).toString('ascii') === '%PDF-') {
      canonicalMime = 'application/pdf';
      canonicalExt = '.pdf';
    } else if (fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47) {
      canonicalMime = 'image/png';
      canonicalExt = '.png';
    } else if (fileBuffer.length >= 3 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff) {
      canonicalMime = 'image/jpeg';
      canonicalExt = '.jpg';
    } else if (fileBuffer.length >= 10 && fileBuffer.slice(0, 100).toString('utf8').toLowerCase().includes('<svg')) {
      canonicalMime = 'image/svg+xml';
      canonicalExt = '.svg';
    }

    // 7. Canonical Download Filename Generation
    let finalDownloadName = requestedName
      ? sanitizeDownloadFileName(requestedName)
      : stripUniqueStoragePrefix(baseKeyName);

    // If actual bytes are WebP, guarantee the downloaded filename strictly ends in .webp
    if (canonicalMime === 'image/webp') {
      finalDownloadName = toWebpFileName(finalDownloadName);
    } else if (canonicalExt && !finalDownloadName.toLowerCase().endsWith(canonicalExt)) {
      finalDownloadName = `${finalDownloadName.replace(/\.[^.]+$/, '')}${canonicalExt}`;
    }

    const disposition = forceDownload ? 'attachment' : 'inline';
    const cleanAsciiName = finalDownloadName.replace(/["\r\n\\]/g, '_');
    const utf8EncodedName = encodeURIComponent(finalDownloadName);
    const dispositionHeader = `${disposition}; filename="${cleanAsciiName}"; filename*=UTF-8''${utf8EncodedName}`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': canonicalMime,
        'Content-Disposition': dispositionHeader,
        'Content-Length': fileBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': isPrivate
          ? 'private, no-cache, no-store, must-revalidate'
          : 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[ROUTE ERROR] /api/school-assets/download:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
