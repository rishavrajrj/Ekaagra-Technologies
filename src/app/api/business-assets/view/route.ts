import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { detectRasterImageType, toWebpFileName } from '@/lib/imageOptimizer';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      return new NextResponse('Asset ID is required.', { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return new NextResponse('Database unconfigured.', { status: 503 });
    }

    const { data: asset, error } = await supabase
      .from('business_requirement_assets')
      .select('*')
      .eq('id', assetId)
      .maybeSingle();

    if (error || !asset) {
      return new NextResponse('Asset not found.', { status: 404 });
    }

    const isDownload = searchParams.get('download') === '1';
    const disposition = isDownload ? 'attachment' : 'inline';
    const safeFileName = asset.file_name || 'asset';
    const encodedName = encodeURIComponent(safeFileName);

    // 1. Detect corrupted legacy asset uploads containing truncation marker '[asset-ref]'
    if (asset.file_url && asset.file_url.includes('[asset-ref]')) {
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Asset Corrupted &bull; Ekaagra Technologies</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #0f172a;
      color: #f8fafc;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      max-width: 520px;
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 24px;
      padding: 36px 32px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-badge {
      width: 56px;
      height: 56px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #f59e0b;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin: 0 0 20px;
    }
    .file-pill {
      display: inline-block;
      background: #334155;
      color: #e2e8f0;
      font-family: monospace;
      font-size: 12px;
      padding: 4px 12px;
      border-radius: 8px;
      margin-bottom: 24px;
      word-break: break-all;
    }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .btn {
      padding: 10px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #4f46e5;
      color: white;
      border: none;
    }
    .btn-primary:hover {
      background: #4338ca;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-badge">⚠️</div>
    <h1>Corrupted File Reference</h1>
    <p>
      The uploaded file <strong>${asset.file_name}</strong> was stored with a truncated reference placeholder from a previous upload attempt.
    </p>
    <div class="file-pill">${asset.file_name} (${asset.asset_category || 'ASSET'})</div>
    <p style="font-size: 13px; color: #cbd5e1;">
      The image storage engine has now been patched. Please return to the project portal, remove this entry, and re-upload the original image file.
    </p>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.close()">Close Window</button>
    </div>
  </div>
</body>
</html>`,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    const buildFileResponse = (rawBuffer: Buffer) => {
      // Determine canonical format from actual buffer bytes
      const detected = detectRasterImageType(rawBuffer, asset.file_name || '', asset.mime_type || '');
      const isWebp = detected.detectedMime === 'image/webp';
      
      let finalName = asset.file_name || 'asset';
      if (isWebp && !finalName.toLowerCase().endsWith('.webp')) {
        finalName = toWebpFileName(finalName);
      }

      const cleanAscii = finalName.replace(/["\r\n\\]/g, '_');
      const utf8Encoded = encodeURIComponent(finalName);
      const dispositionHeader = `${disposition}; filename="${cleanAscii}"; filename*=UTF-8''${utf8Encoded}`;

      return new NextResponse(new Uint8Array(rawBuffer), {
        headers: {
          'Content-Type': detected.detectedMime || asset.mime_type || 'application/octet-stream',
          'Content-Disposition': dispositionHeader,
          'Content-Length': rawBuffer.length.toString(),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': isDownload ? 'private, no-cache, no-store' : 'public, max-age=31536000, immutable',
        },
      });
    };

    // 2. Decode valid Base64 data URLs and stream binary response directly
    if (asset.file_url && asset.file_url.startsWith('data:')) {
      const commaIndex = asset.file_url.indexOf(',');
      if (commaIndex !== -1) {
        const base64Data = asset.file_url.substring(commaIndex + 1);
        const buffer = Buffer.from(base64Data, 'base64');
        return buildFileResponse(buffer);
      }
    }

    // 3. Serve from local filesystem if saved in public/uploads
    if (asset.file_url && asset.file_url.startsWith('/uploads/')) {
      const localRelPath = asset.file_url.replace(/^\//, '');
      const localAbsPath = path.join(process.cwd(), 'public', localRelPath);
      if (fs.existsSync(localAbsPath)) {
        const fileBuffer = fs.readFileSync(localAbsPath);
        return buildFileResponse(fileBuffer);
      }
    }

    // 4. If asset has storage_path in Supabase Storage bucket, download & serve
    if (asset.storage_path) {
      try {
        const { data: blobData, error: dlErr } = await supabase.storage
          .from('business-assets')
          .download(asset.storage_path);

        if (!dlErr && blobData) {
          const arrayBuf = await blobData.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          return buildFileResponse(buffer);
        }
      } catch {
        // Fall through
      }
    }

    // 5. If it is an external HTTP/HTTPS URL, proxy/download if attachment requested, or redirect
    if (
      asset.file_url &&
      (asset.file_url.startsWith('http://') || asset.file_url.startsWith('https://'))
    ) {
      if (isDownload) {
        try {
          const res = await fetch(asset.file_url);
          if (res.ok) {
            const arrayBuf = await res.arrayBuffer();
            return buildFileResponse(Buffer.from(arrayBuf));
          }
        } catch {
          // Fall through to redirect
        }
      }
      return NextResponse.redirect(asset.file_url);
    }

    return new NextResponse('Asset data unavailable.', { status: 404 });
  } catch (err) {
    console.error('[ASSET VIEW EXCEPTION]', err);
    return new NextResponse('Internal server error retrieving asset.', { status: 500 });
  }
}
