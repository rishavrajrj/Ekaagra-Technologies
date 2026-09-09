-- ==============================================================================
-- Ekaagra Technologies - Faculty & Staff Master Data Management Schema
-- Migration: 20260917_faculty_staff_management_system.sql
-- ==============================================================================

-- 1. SCHOOL STAFF SETTINGS (Field selection & numbering configuration)
CREATE TABLE IF NOT EXISTS public.school_staff_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    enabled_fields TEXT[] NOT NULL DEFAULT ARRAY[
        'employee_code', 'staff_type', 'first_name', 'last_name', 'department', 
        'designation', 'phone', 'email', 'status', 'highest_qualification', 'joining_date'
    ],
    required_fields TEXT[] NOT NULL DEFAULT ARRAY[
        'employee_code', 'staff_type', 'first_name', 'department', 'designation', 'status'
    ],
    faculty_id_format TEXT NOT NULL DEFAULT 'FAC-{{YEAR}}-{{NUM}}',
    default_staff_type TEXT NOT NULL DEFAULT 'TEACHING' CHECK (default_staff_type IN ('TEACHING', 'NON_TEACHING')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_staff_settings_school UNIQUE (school_id)
);

CREATE INDEX IF NOT EXISTS idx_school_staff_settings_school_id ON public.school_staff_settings (school_id);

-- 2. ENHANCE PUBLIC.STAFF TO SUPPORT DYNAMIC CONFIGURATION & MASTER DATA
ALTER TABLE public.staff
    ADD COLUMN IF NOT EXISTS staff_type TEXT NOT NULL DEFAULT 'TEACHING' CHECK (staff_type IN ('TEACHING', 'NON_TEACHING')),
    ADD COLUMN IF NOT EXISTS middle_name TEXT,
    ADD COLUMN IF NOT EXISTS dob DATE,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS blood_group TEXT,
    ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
    ADD COLUMN IF NOT EXISTS religion TEXT,
    ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
    ADD COLUMN IF NOT EXISTS marital_status TEXT,
    ADD COLUMN IF NOT EXISTS official_email TEXT,
    ADD COLUMN IF NOT EXISTS personal_email TEXT,
    ADD COLUMN IF NOT EXISTS official_phone TEXT,
    ADD COLUMN IF NOT EXISTS personal_phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
    ADD COLUMN IF NOT EXISTS current_address TEXT,
    ADD COLUMN IF NOT EXISTS current_city TEXT,
    ADD COLUMN IF NOT EXISTS current_state TEXT,
    ADD COLUMN IF NOT EXISTS current_pincode TEXT,
    ADD COLUMN IF NOT EXISTS current_country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS permanent_address TEXT,
    ADD COLUMN IF NOT EXISTS permanent_city TEXT,
    ADD COLUMN IF NOT EXISTS permanent_state TEXT,
    ADD COLUMN IF NOT EXISTS permanent_pincode TEXT,
    ADD COLUMN IF NOT EXISTS permanent_country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS highest_qualification TEXT,
    ADD COLUMN IF NOT EXISTS qualification_details JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS specialization TEXT,
    ADD COLUMN IF NOT EXISTS experience_years NUMERIC,
    ADD COLUMN IF NOT EXISTS joining_date DATE,
    ADD COLUMN IF NOT EXISTS leaving_date DATE,
    ADD COLUMN IF NOT EXISTS reporting_manager_id TEXT,
    ADD COLUMN IF NOT EXISTS primary_subject TEXT,
    ADD COLUMN IF NOT EXISTS additional_subjects TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS classes_taught TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS sections_taught TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS is_class_teacher BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_hod BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_coordinator BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS job_role TEXT,
    ADD COLUMN IF NOT EXISTS work_location TEXT,
    ADD COLUMN IF NOT EXISTS work_schedule TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_storage_path TEXT,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS payroll_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_staff_school_type ON public.staff (school_id, staff_type);
CREATE INDEX IF NOT EXISTS idx_staff_school_department ON public.staff (school_id, department);
CREATE INDEX IF NOT EXISTS idx_staff_school_status ON public.staff (school_id, status);

-- 3. ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.school_staff_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_staff_settings') THEN
        CREATE POLICY service_role_all_staff_settings ON public.school_staff_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
