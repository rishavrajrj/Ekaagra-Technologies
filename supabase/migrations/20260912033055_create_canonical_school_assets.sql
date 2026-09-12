-- ==============================================================================
-- Canonical School Assets Registry Migration
-- Migration: 20260912033055_create_canonical_school_assets.sql
-- Applied to Database B (dxxdstqwewsmosatipax): version 20260912033055
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.school_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_project_id UUID NOT NULL REFERENCES public.school_projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_bucket TEXT NOT NULL CHECK (storage_bucket IN ('school-public', 'school-private')),
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    alt_text TEXT,
    caption TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
    status TEXT NOT NULL DEFAULT 'provided' CHECK (status IN ('pending', 'provided', 'verified', 'rejected')),
    source TEXT DEFAULT 'onboarding_upload',
    checksum_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_assets_project ON public.school_assets(school_project_id);
CREATE INDEX IF NOT EXISTS idx_school_assets_section ON public.school_assets(section);
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_assets_bucket_path ON public.school_assets(storage_bucket, storage_path);

-- Enable RLS
ALTER TABLE public.school_assets ENABLE ROW LEVEL SECURITY;

DO $$$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_assets' AND policyname = 'Service role full access on school_assets'
  ) THEN
    CREATE POLICY "Service role full access on school_assets"
      ON public.school_assets
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_assets' AND policyname = 'Public read access for school_public assets'
  ) THEN
    CREATE POLICY "Public read access for school_public assets"
      ON public.school_assets
      FOR SELECT
      TO public
      USING (visibility = 'public');
  END IF;
END
$$$;
