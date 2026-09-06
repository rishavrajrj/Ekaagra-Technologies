-- ==============================================================================
-- Ekaagra Technologies - Business Project System Security Hardening
-- Migration: 20260906_harden_business_security_and_assets.sql
-- ==============================================================================

-- 1. Revoke insecure wide-open anon access on all business tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'clients', 'projects', 'business_onboarding_tokens', 'business_requirements',
            'business_requirement_submissions', 'business_requirement_assets',
            'design_reviews', 'project_activity', 'project_notes'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow full server access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon read access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I;', tbl);
        
        -- Enforce Principle of Least Privilege:
        -- Only service_role (server actions / Next.js backend) has full access.
        -- Client-side anon / authenticated users CANNOT read or write these tables directly.
        EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- 2. Ensure business_requirement_assets has all necessary columns and constraints
DO $$
BEGIN
    -- Storage path column for object storage reference
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_requirement_assets' 
        AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE public.business_requirement_assets ADD COLUMN storage_path TEXT;
    END IF;

    -- Uploader identity / role
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_requirement_assets' 
        AND column_name = 'uploaded_by'
    ) THEN
        ALTER TABLE public.business_requirement_assets ADD COLUMN uploaded_by TEXT DEFAULT 'CLIENT';
    END IF;
END $$;

-- 3. Indexes for fast lookup of assets and submissions
CREATE INDEX IF NOT EXISTS idx_biz_assets_project_cat ON public.business_requirement_assets (project_id, asset_category);
CREATE INDEX IF NOT EXISTS idx_biz_submissions_proj_ver ON public.business_requirement_submissions (project_id, version_number DESC);

-- 4. Enforce strict check constraint on project_type = 'BUSINESS' for business project system
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_project_type_valid'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT check_project_type_valid 
        CHECK (project_type IN ('BUSINESS', 'SCHOOL'));
    END IF;
END $$;

-- 5. Storage Bucket Configuration (Idempotent creation script for Supabase storage)
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
            15728640, -- 15MB limit
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
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END $$;
