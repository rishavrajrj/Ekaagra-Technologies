-- ==============================================================================
-- Ekaagra Technologies - Student Custom Field System Schema
-- Migration: 20260917_student_custom_fields_system.sql
-- ==============================================================================

-- 1. STUDENT CUSTOM SECTIONS (Sections 8+ created dynamically by school admin)
CREATE TABLE IF NOT EXISTS public.student_custom_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    section_key TEXT NOT NULL,
    section_name TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 8,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_custom_sections_school_key UNIQUE (school_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_student_custom_sections_school ON public.student_custom_sections (school_id, display_order);

-- 2. STUDENT CUSTOM FIELD DEFINITIONS (Orders 52+ configured by school admin)
CREATE TABLE IF NOT EXISTS public.student_custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    field_key TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN (
        'text', 'long_text', 'number', 'date', 'phone', 'email', 'url',
        'dropdown', 'multi_select', 'yes_no', 'image', 'file'
    )),
    section_key TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 52,
    options JSONB DEFAULT '[]'::jsonb,
    default_value TEXT,
    placeholder TEXT,
    help_text TEXT,
    validation_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_custom_field_defs_school_key UNIQUE (school_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_student_custom_field_defs_school ON public.student_custom_field_definitions (school_id, display_order);
CREATE INDEX IF NOT EXISTS idx_student_custom_field_defs_active ON public.student_custom_field_definitions (school_id, is_active);

-- 3. STUDENT CUSTOM FIELD VALUES (Stores values without altering core students table)
CREATE TABLE IF NOT EXISTS public.student_custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    custom_field_id UUID NOT NULL REFERENCES public.student_custom_field_definitions(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_custom_field_values_student_field UNIQUE (student_id, custom_field_id)
);

CREATE INDEX IF NOT EXISTS idx_student_custom_values_school_student ON public.student_custom_field_values (school_id, student_id);
CREATE INDEX IF NOT EXISTS idx_student_custom_values_field_id ON public.student_custom_field_values (custom_field_id);

-- 4. ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.student_custom_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_custom_field_values ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_custom_sections') THEN
        CREATE POLICY service_role_all_custom_sections ON public.student_custom_sections FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_custom_field_defs') THEN
        CREATE POLICY service_role_all_custom_field_defs ON public.student_custom_field_definitions FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_custom_values') THEN
        CREATE POLICY service_role_all_custom_values ON public.student_custom_field_values FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
