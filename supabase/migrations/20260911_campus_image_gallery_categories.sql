-- ==============================================================================
-- 20260911_campus_image_gallery_categories.sql
-- Canonical Gallery Categories, Safe Backfill & Multi-Tenant Scoped Gallery
-- ==============================================================================

-- 1. Add image_category column with controlled CHECK constraint
ALTER TABLE public.school_campus_images
    ADD COLUMN IF NOT EXISTS image_category TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_school_campus_images_category'
  ) THEN
    ALTER TABLE public.school_campus_images
      ADD CONSTRAINT chk_school_campus_images_category
      CHECK (
        image_category IS NULL OR
        image_category IN (
          'campus_buildings',
          'classrooms',
          'laboratories',
          'library',
          'sports_playground',
          'activities',
          'events',
          'transport',
          'cafeteria',
          'other'
        )
      );
  END IF;
END
$$;

-- 2. Performance index for category-scoped queries
CREATE INDEX IF NOT EXISTS idx_school_campus_images_image_category
    ON public.school_campus_images(image_category);

CREATE INDEX IF NOT EXISTS idx_school_campus_images_campus_category
    ON public.school_campus_images(campus_id, image_category);

-- 3. Safe idempotent data migration: backfill image_category from existing image_type
UPDATE public.school_campus_images
SET image_category = CASE
    WHEN LOWER(TRIM(image_type)) IN (
        'campus / building',
        'campus entrance',
        'reception / front desk',
        'helpdesk',
        'security / gate',
        'administrative office',
        'principal / head office'
    ) THEN 'campus_buildings'

    WHEN LOWER(TRIM(image_type)) = 'classroom' THEN 'classrooms'

    WHEN LOWER(TRIM(image_type)) IN (
        'laboratory',
        'computer lab',
        'science lab'
    ) THEN 'laboratories'

    WHEN LOWER(TRIM(image_type)) = 'library' THEN 'library'

    WHEN LOWER(TRIM(image_type)) = 'playground / sports' THEN 'sports_playground'

    WHEN LOWER(TRIM(image_type)) IN (
        'activity room',
        'auditorium / hall',
        'prayer / assembly area'
    ) THEN 'activities'

    WHEN LOWER(TRIM(image_type)) IN ('events', 'event') THEN 'events'

    WHEN LOWER(TRIM(image_type)) IN ('transport / bus', 'transport') THEN 'transport'

    WHEN LOWER(TRIM(image_type)) IN ('cafeteria / dining', 'cafeteria') THEN 'cafeteria'

    WHEN image_type IS NOT NULL AND TRIM(image_type) <> '' THEN 'other'

    ELSE image_category
END
WHERE image_category IS NULL AND image_type IS NOT NULL;
