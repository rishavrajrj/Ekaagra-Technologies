-- ============================================================================
-- Ekaagra Technologies - Business Assets Storage Policies
-- Migration: 20260906_fix_storage_bucket_policies.sql
-- Enables upload, download, and delete access for business-assets storage bucket
-- ============================================================================

-- 1. Ensure storage bucket exists with generous allowed types and size limit (15MB)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'business-assets',
            'business-assets',
            true,
            15728640,
            ARRAY[
                'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ]
        )
        ON CONFLICT (id) DO UPDATE SET
            public = true,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END $$;

-- 2. Drop existing policies on storage.objects for business-assets bucket to avoid conflict
DROP POLICY IF EXISTS "Public select on business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon uploads to business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes on business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates on business-assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Access business-assets" ON storage.objects;

-- 3. Create permissive policies for storage.objects on business-assets bucket
-- Allows public reads
CREATE POLICY "Public select on business-assets"
ON storage.objects FOR SELECT
TO anon, authenticated, service_role
USING (bucket_id = 'business-assets');

-- Allows client intake uploads and admin uploads
CREATE POLICY "Allow anon uploads to business-assets"
ON storage.objects FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (bucket_id = 'business-assets');

-- Allows updates and upserts
CREATE POLICY "Allow public updates on business-assets"
ON storage.objects FOR UPDATE
TO anon, authenticated, service_role
USING (bucket_id = 'business-assets')
WITH CHECK (bucket_id = 'business-assets');

-- Allows asset deletion from dashboard
CREATE POLICY "Allow public deletes on business-assets"
ON storage.objects FOR DELETE
TO anon, authenticated, service_role
USING (bucket_id = 'business-assets');
