-- ==============================================================================
-- Ekaagra Technologies - Student Information Configuration & Master Data Schema
-- Migration: 20260916_student_information_configuration_and_master_system.sql
-- ==============================================================================

-- 1. SCHOOL STUDENT SETTINGS (Field selection & numbering configuration)
CREATE TABLE IF NOT EXISTS public.school_student_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    enabled_fields TEXT[] NOT NULL DEFAULT ARRAY[
        'student_name', 'admission_number', 'dob', 'gender', 'class_grade', 'section', 'father_name', 'father_phone'
    ],
    required_fields TEXT[] NOT NULL DEFAULT ARRAY[
        'student_name', 'admission_number', 'class_grade', 'section'
    ],
    admission_number_format TEXT NOT NULL DEFAULT 'ADM-{{YEAR}}-{{NUM}}',
    student_id_format TEXT NOT NULL DEFAULT 'STD-{{YEAR}}-{{NUM}}',
    roll_number_system TEXT NOT NULL DEFAULT 'section_wise' CHECK (roll_number_system IN ('class_wise', 'section_wise', 'alphabetical', 'manual')),
    house_system_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    house_names TEXT[] DEFAULT ARRAY['Tagore House (Red)', 'Ashoka House (Blue)', 'Raman House (Green)', 'Kalam House (Yellow)'],
    transport_tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_student_settings_school UNIQUE (school_id)
);

CREATE INDEX IF NOT EXISTS idx_school_student_settings_school_id ON public.school_student_settings (school_id);

-- 2. ENHANCE PUBLIC.STUDENTS TO SUPPORT DYNAMIC CONFIGURATION & MASTER DATA
ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS student_id_code TEXT,
    ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'Indian',
    ADD COLUMN IF NOT EXISTS religion TEXT,
    ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
    ADD COLUMN IF NOT EXISTS photo_url TEXT,
    ADD COLUMN IF NOT EXISTS photo_storage_path TEXT,
    ADD COLUMN IF NOT EXISTS academic_year TEXT,
    ADD COLUMN IF NOT EXISTS admission_date DATE,
    ADD COLUMN IF NOT EXISTS previous_school TEXT,
    ADD COLUMN IF NOT EXISTS previous_class TEXT,
    ADD COLUMN IF NOT EXISTS previous_admission_number TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT,
    ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT,
    ADD COLUMN IF NOT EXISTS identification_type TEXT,
    ADD COLUMN IF NOT EXISTS identification_number TEXT,
    ADD COLUMN IF NOT EXISTS transport_required BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transport_route TEXT,
    ADD COLUMN IF NOT EXISTS house TEXT,
    ADD COLUMN IF NOT EXISTS medical_notes TEXT,
    ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_students_student_id_code ON public.students (school_id, student_id_code);
CREATE INDEX IF NOT EXISTS idx_students_academic_year ON public.students (school_id, academic_year);

-- 3. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.school_student_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_student_settings') THEN
        CREATE POLICY service_role_all_student_settings ON public.school_student_settings FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
