-- ==============================================================================
-- 20260910_campus_images_metadata.sql
-- Per-Image Classification, Custom Other Type, Primary/Featured & Captions
-- ==============================================================================

ALTER TABLE public.school_campus_images
    ADD COLUMN IF NOT EXISTS image_type TEXT,
    ADD COLUMN IF NOT EXISTS custom_image_type TEXT,
    ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS caption TEXT;

CREATE INDEX IF NOT EXISTS idx_school_campus_images_is_primary ON public.school_campus_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_school_campus_images_image_type ON public.school_campus_images(image_type);
