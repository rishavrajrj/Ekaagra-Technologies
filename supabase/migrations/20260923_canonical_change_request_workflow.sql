-- ==============================================================================
-- Ekaagra Technologies - Canonical Change Request Workflow Migration
-- Migration: 20260923_canonical_change_request_workflow.sql
-- ==============================================================================

-- 1. Add canonical navigation and grouping columns to school_intake_change_requests
ALTER TABLE public.school_intake_change_requests
    ADD COLUMN IF NOT EXISTS page_key TEXT,
    ADD COLUMN IF NOT EXISTS form_section_key TEXT,
    ADD COLUMN IF NOT EXISTS field_label TEXT;

-- 2. Indexes for canonical lookups and change count aggregations
CREATE INDEX IF NOT EXISTS idx_school_intake_change_requests_page_status
    ON public.school_intake_change_requests (school_project_id, page_key, status);

CREATE INDEX IF NOT EXISTS idx_school_intake_change_requests_canonical_field
    ON public.school_intake_change_requests (school_project_id, page_key, form_section_key, field_key);
