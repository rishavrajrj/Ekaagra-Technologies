-- ==============================================================================
-- 20260909_campus_images_and_global_webp.sql
-- Campus-Specific Images & Global WebP Image Architecture
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.school_campus_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    campus_id TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'image/webp',
    width INTEGER,
    height INTEGER,
    original_size BIGINT,
    optimized_size BIGINT,
    optimized_format TEXT DEFAULT 'webp',
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_campus_images_school_id ON public.school_campus_images(school_id);
CREATE INDEX IF NOT EXISTS idx_school_campus_images_campus_id ON public.school_campus_images(campus_id);
CREATE INDEX IF NOT EXISTS idx_school_campus_images_storage_key ON public.school_campus_images(storage_key);

ALTER TABLE public.school_campus_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_campus_images' AND policyname = 'school_campus_images_select'
  ) THEN
    CREATE POLICY school_campus_images_select ON public.school_campus_images
      FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'school_campus_images' AND policyname = 'school_campus_images_manage'
  ) THEN
    CREATE POLICY school_campus_images_manage ON public.school_campus_images
      FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;
END
$$;
