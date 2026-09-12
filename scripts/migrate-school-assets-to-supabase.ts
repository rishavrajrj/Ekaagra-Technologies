import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// 1. Manually parse .env.local
const projectRoot = process.cwd();
const envLocalPath = path.resolve(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const schoolsUrl = process.env.SCHOOLS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SCHOOLS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!schoolsUrl || !serviceKey) {
  console.error('[ERROR] Missing SCHOOLS_SUPABASE_URL or SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const client = createClient(schoolsUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function detectMime(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  if (ext === '.pdf') return 'application/pdf';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.gif') return 'image/gif';
  return 'application/octet-stream';
}

function deriveSectionAndType(fileName: string, folder: string): { section: string; assetType: string } {
  const lower = fileName.toLowerCase();
  if (lower.includes('logo')) return { section: 'branding', assetType: 'logo' };
  if (lower.includes('crest') || lower.includes('emblem')) return { section: 'branding', assetType: 'crest' };
  if (lower.includes('principal')) return { section: 'leadership', assetType: 'principal_photo' };
  if (lower.includes('front') || lower.includes('drone') || lower.includes('building')) {
    return { section: 'campuses', assetType: 'campus_photo' };
  }
  if (lower.includes('classroom')) return { section: 'facilities', assetType: 'classroom_photo' };
  if (lower.includes('lab')) return { section: 'facilities', assetType: 'lab_photo' };
  if (lower.includes('library')) return { section: 'facilities', assetType: 'library_photo' };
  if (lower.includes('sports')) return { section: 'facilities', assetType: 'sports_photo' };
  if (lower.includes('hostel')) return { section: 'facilities', assetType: 'hostel_photo' };
  if (lower.includes('cafeteria')) return { section: 'facilities', assetType: 'cafeteria_photo' };
  if (lower.includes('fee')) return { section: 'fees', assetType: 'fee_circular' };
  if (lower.includes('disclosure')) return { section: 'documents', assetType: 'mandatory_disclosure' };
  if (lower.endsWith('.pdf')) return { section: 'documents', assetType: 'document' };
  return { section: folder || 'general', assetType: 'image' };
}

interface MigrationReport {
  totalFilesDiscovered: number;
  filesMigrated: number;
  filesAlreadyMigrated: number;
  filesSkipped: number;
  filesFailed: number;
  dbRecordsUpserted: number;
  jsonReferencesUpdated: number;
  details: Array<{
    localPath: string;
    targetBucket: string;
    storagePath: string;
    publicUrl: string;
    status: 'migrated' | 'already_migrated' | 'failed' | 'skipped';
    reason?: string;
  }>;
}

async function migrate() {
  console.log('================================================================');
  console.log('  STARTING IDEMPOTENT SCHOOL ASSETS MIGRATION TO SUPABASE');
  console.log(`  Target Supabase Host: ${new URL(schoolsUrl!).hostname}`);
  console.log('================================================================\n');

  const report: MigrationReport = {
    totalFilesDiscovered: 0,
    filesMigrated: 0,
    filesAlreadyMigrated: 0,
    filesSkipped: 0,
    filesFailed: 0,
    dbRecordsUpserted: 0,
    jsonReferencesUpdated: 0,
    details: [],
  };

  const localBaseDir = path.join(projectRoot, 'public', 'uploads', 'school-assets');
  if (!fs.existsSync(localBaseDir)) {
    console.log(`[INFO] No local directory found at ${localBaseDir}`);
    return;
  }

  // 1. Fetch existing projects to associate assets correctly
  const { data: projects, error: pErr } = await client.from('school_projects').select('id, project_number, school_name');
  if (pErr) {
    console.error('[ERROR] Could not fetch school_projects:', pErr.message);
    return;
  }
  const projectMap = new Map(projects?.map(p => [p.id, p]));

  // 2. Discover all local files recursively
  function listAllFiles(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) {
        listAllFiles(full, fileList);
      } else {
        fileList.push(full);
      }
    }
    return fileList;
  }

  const allDiscovered = listAllFiles(localBaseDir);
  report.totalFilesDiscovered = allDiscovered.length;
  console.log(`Discovered ${allDiscovered.length} local file(s) across tenant directories.\n`);

  // Map to hold old-url-to-new-url for updating intake payloads
  const urlReplacementMap = new Map<string, string>();

  for (const localFilePath of allDiscovered) {
    const relFromAssets = path.relative(localBaseDir, localFilePath).replace(/\\/g, '/');
    const segments = relFromAssets.split('/');
    const tenantId = segments[0];
    const fileName = segments[segments.length - 1];
    const folder = segments.length > 2 ? segments[1] : 'public';

    const project = projectMap.get(tenantId);
    if (!project) {
      console.warn(`[SKIP] No project matching tenant folder ID: ${tenantId}`);
      report.filesSkipped++;
      report.details.push({
        localPath: relFromAssets,
        targetBucket: 'none',
        storagePath: 'none',
        publicUrl: 'none',
        status: 'skipped',
        reason: `Tenant ID "${tenantId}" not found in school_projects table`,
      });
      continue;
    }

    // Determine bucket: Mandatory Public Disclosure (Appendix IX) is legally mandated to be public on the school website
    const isStatutoryPublic = fileName.includes('05_Mandatory_Public_Disclosure') || relFromAssets.includes('cert-mandatory-disclosure');
    const isPrivate = !isStatutoryPublic && (relFromAssets.includes('/private/') || fileName.toLowerCase().endsWith('.pdf'));
    const bucket = isPrivate ? 'school-private' : 'school-public';
    const storagePath = `school-projects/${tenantId}/${folder}/${fileName}`;

    const buffer = fs.readFileSync(localFilePath);
    const mimeType = detectMime(fileName);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const { section, assetType } = deriveSectionAndType(fileName, folder);

    // Compute public URL
    const { data: pubUrlData } = client.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = isPrivate
      ? `/api/school-assets/download?key=${encodeURIComponent(storagePath)}`
      : pubUrlData.publicUrl;

    // Register into old-to-new URL map
    const oldLocalUrl1 = `/uploads/school-assets/${relFromAssets}`;
    const oldLocalUrl2 = `/uploads/school-assets/${tenantId}/${fileName}`;
    urlReplacementMap.set(oldLocalUrl1, publicUrl);
    urlReplacementMap.set(oldLocalUrl2, publicUrl);

    // Check if object already exists in Supabase Storage (Idempotency)
    let alreadyExistsInStorage = false;
    try {
      const parentFolder = `school-projects/${tenantId}/${folder}`;
      const { data: existingFiles } = await client.storage.from(bucket).list(parentFolder, { search: fileName });
      if (existingFiles && existingFiles.some(f => f.name === fileName)) {
        alreadyExistsInStorage = true;
      }
    } catch {
      // ignore
    }

    if (!alreadyExistsInStorage) {
      // Upload to Supabase Storage
      const { error: upErr } = await client.storage.from(bucket).upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

      if (upErr) {
        console.error(`[FAIL] Upload failed for ${storagePath}: ${upErr.message}`);
        report.filesFailed++;
        report.details.push({
          localPath: relFromAssets,
          targetBucket: bucket,
          storagePath,
          publicUrl,
          status: 'failed',
          reason: upErr.message,
        });
        continue;
      }
      report.filesMigrated++;
      console.log(`[UPLOADED] ${storagePath} -> ${bucket}`);
    } else {
      report.filesAlreadyMigrated++;
      console.log(`[ALREADY PRESENT] ${storagePath} in ${bucket}`);
    }

    // Upsert into school_assets database table
    const { error: dbErr } = await client.from('school_assets').upsert(
      {
        school_project_id: tenantId,
        section,
        asset_type: assetType,
        original_filename: fileName,
        storage_bucket: bucket,
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: buffer.length,
        visibility: isPrivate ? 'private' : 'public',
        status: 'provided',
        source: 'migration_script',
        checksum_sha256: sha256,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'storage_bucket,storage_path' }
    );

    if (dbErr) {
      console.warn(`[DB WARNING] Could not upsert into school_assets for ${storagePath}: ${dbErr.message}`);
    } else {
      report.dbRecordsUpserted++;
    }

    report.details.push({
      localPath: relFromAssets,
      targetBucket: bucket,
      storagePath,
      publicUrl,
      status: alreadyExistsInStorage ? 'already_migrated' : 'migrated',
    });
  }

  // 3. Update JSONB payloads in school_intake_submissions
  console.log('\n--- Normalizing Intake Submissions Payloads ---');
  const { data: submissions, error: sErr } = await client.from('school_intake_submissions').select('*');
  if (sErr) {
    console.error('[ERROR] Could not fetch submissions:', sErr.message);
  } else {
    for (const sub of submissions || []) {
      if (!sub.intake_payload) continue;

      let payloadString = JSON.stringify(sub.intake_payload);
      let replacedInThisSub = 0;

      for (const [oldUrl, newUrl] of urlReplacementMap.entries()) {
        if (payloadString.includes(oldUrl)) {
          payloadString = payloadString.split(oldUrl).join(newUrl);
          replacedInThisSub++;
          report.jsonReferencesUpdated++;
        }
      }

      // Also replace any generic "/uploads/school-assets/<sub.school_project_id>/public/<file>" with public URL
      const genericRegex = new RegExp(`/uploads/school-assets/${sub.school_project_id}/public/([^"'\\s]+)`, 'g');
      payloadString = payloadString.replace(genericRegex, (match, fName) => {
        const cloudUrl = `${schoolsUrl.replace(/\/+$/, '')}/storage/v1/object/public/school-public/school-projects/${sub.school_project_id}/public/${fName}`;
        replacedInThisSub++;
        report.jsonReferencesUpdated++;
        return cloudUrl;
      });

      if (replacedInThisSub > 0) {
        const updatedPayload = JSON.parse(payloadString);
        const { error: updErr } = await client
          .from('school_intake_submissions')
          .update({
            intake_payload: updatedPayload,
          })
          .eq('id', sub.id);

        if (updErr) {
          console.error(`[ERROR] Failed to update submission ${sub.id}: ${updErr.message}`);
        } else {
          console.log(`[UPDATED INTAKE] Submission ${sub.id} (Project ${sub.school_project_id}) updated with ${replacedInThisSub} cloud asset URL(s).`);
        }
      }
    }
  }

  console.log('\n================================================================');
  console.log('  MIGRATION SUMMARY REPORT');
  console.log('================================================================');
  console.log(`Total local files discovered : ${report.totalFilesDiscovered}`);
  console.log(`Successfully migrated        : ${report.filesMigrated}`);
  console.log(`Already migrated (idempotent): ${report.filesAlreadyMigrated}`);
  console.log(`Skipped (unknown tenant)     : ${report.filesSkipped}`);
  console.log(`Failed                       : ${report.filesFailed}`);
  console.log(`Database records upserted    : ${report.dbRecordsUpserted}`);
  console.log(`Intake references updated    : ${report.jsonReferencesUpdated}`);
  console.log('================================================================\n');
}

migrate().catch(console.error);
