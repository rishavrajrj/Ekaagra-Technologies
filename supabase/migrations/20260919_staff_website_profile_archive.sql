-- ==============================================================================
-- Ekaagra Technologies - Faculty & Staff Website Profile & Archive Support
-- Migration: 20260919_staff_website_profile_archive.sql
-- ==============================================================================

-- 1. ENHANCE PUBLIC.STAFF TO SUPPORT WEBSITE PROFILE & SOFT ARCHIVAL
ALTER TABLE public.staff
    ADD COLUMN IF NOT EXISTS website_profile JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS archived_reason TEXT;

-- 2. EXPAND STATUS CHECK CONSTRAINT TO INCLUDE 'archived'
DO $$
BEGIN
    ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_status_check;
    ALTER TABLE public.staff DROP CONSTRAINT IF EXISTS staff_status_check1;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.staff ADD CONSTRAINT staff_status_check 
    CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated', 'archived'));

-- 3. INDEX FOR WEBSITE VISIBLE ACTIVE STAFF QUERIES
CREATE INDEX IF NOT EXISTS idx_staff_website_active 
    ON public.staff (school_id, status) 
    WHERE status = 'active';

COMMENT ON COLUMN public.staff.website_profile IS 'Dedicated public website presentation metadata (publicName, publicDesignation, publicDepartment, publicSubject, shortBio, featured, displayOrder, showOnWebsite) separated from sensitive ERP fields.';
COMMENT ON COLUMN public.staff.archived_at IS 'Timestamp of when the staff record was archived instead of hard-deleted.';
