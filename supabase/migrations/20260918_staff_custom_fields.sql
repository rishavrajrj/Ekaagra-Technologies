-- ==============================================================================
-- Ekaagra Technologies - Custom Staff Fields Schema Migration
-- Migration: 20260918_staff_custom_fields.sql
-- ==============================================================================

-- 1. SCHOOL STAFF CUSTOM FIELDS TABLE
CREATE TABLE IF NOT EXISTS public.school_staff_custom_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    description TEXT,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'TEXT', 'LONG_TEXT', 'NUMBER', 'DECIMAL', 'DATE', 'BOOLEAN', 
        'PHONE', 'EMAIL', 'DROPDOWN', 'MULTI_SELECT', 'FILE', 'DOCUMENT'
    )),
    category TEXT NOT NULL DEFAULT 'custom' CHECK (category IN (
        'employment', 'personal', 'contact', 'address', 'qualification', 
        'teaching', 'non_teaching', 'payroll', 'documents', 'custom'
    )),
    staff_scope TEXT NOT NULL DEFAULT 'BOTH' CHECK (staff_scope IN ('TEACHING', 'NON_TEACHING', 'BOTH')),
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 1,
    options_json JSONB DEFAULT '[]'::jsonb,
    validation_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT,
    updated_by TEXT,
    CONSTRAINT uq_staff_custom_field_key UNIQUE (school_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_school ON public.school_staff_custom_fields (school_id, is_active);
CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_scope ON public.school_staff_custom_fields (school_id, staff_scope);
CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_category ON public.school_staff_custom_fields (school_id, category);

-- 2. EXTEND PUBLIC.STAFF TO STORE CUSTOM FIELD VALUES IN JSONB
ALTER TABLE public.staff
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- 3. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.school_staff_custom_fields ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_staff_custom_fields') THEN
        CREATE POLICY service_role_all_staff_custom_fields ON public.school_staff_custom_fields FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
