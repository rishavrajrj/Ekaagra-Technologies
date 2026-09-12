-- ==============================================================================
-- Ekaagra Technologies - Enhance School Intake Change Requests Schema
-- Migration: 20260922_enhance_school_change_requests_and_reviews.sql
-- ==============================================================================

-- 1. Extend intake_change_request_status enum with operational statuses
ALTER TYPE public.intake_change_request_status ADD VALUE IF NOT EXISTS 'waiting_for_school';
ALTER TYPE public.intake_change_request_status ADD VALUE IF NOT EXISTS 'ready_for_review';
ALTER TYPE public.intake_change_request_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.intake_change_request_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.intake_change_request_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Add optional columns for field-level & asset-level operational change requests
ALTER TABLE public.school_intake_change_requests
    ADD COLUMN IF NOT EXISTS asset_id TEXT,
    ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'correction',
    ADD COLUMN IF NOT EXISTS reason TEXT,
    ADD COLUMN IF NOT EXISTS suggested_value TEXT,
    ADD COLUMN IF NOT EXISTS previous_value TEXT,
    ADD COLUMN IF NOT EXISTS current_value TEXT,
    ADD COLUMN IF NOT EXISTS school_response TEXT,
    ADD COLUMN IF NOT EXISTS school_updated_value TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS resolved_by TEXT;

-- 3. Create indexes for high-performance filtering
CREATE INDEX IF NOT EXISTS idx_school_intake_change_requests_asset_id
    ON public.school_intake_change_requests (asset_id);

CREATE INDEX IF NOT EXISTS idx_school_intake_change_requests_field
    ON public.school_intake_change_requests (school_project_id, section_key, field_key);
