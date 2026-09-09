-- ==============================================================================
-- SECTION 7: PRODUCTION-GRADE STRUCTURED ADMISSIONS SYSTEM MIGRATION
-- Migration: 20260912_production_grade_admissions_system.sql
-- 
-- 1. Idempotent column enhancements for public.school_admission_settings.
-- 2. Normalized relational tables for dynamic admission records:
--    - school_admission_class_availability
--    - school_admission_fees
--    - school_admission_documents
--    - school_admission_process_steps
--    - school_admission_dates
-- 3. Strict Row Level Security (RLS) & tenant isolation policies.
-- 4. Full backward-compatibility preserving all existing intake data and drafts.
-- ==============================================================================

-- 1. EXTEND SCHOOL_ADMISSION_SETTINGS (IDEMPOTENT)
DO $$
BEGIN
    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'status') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN status TEXT DEFAULT 'upcoming' CHECK (status IN ('open', 'upcoming', 'closed', 'waitlist', 'not_accepting'));
    END IF;

    -- Application Dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'application_start_date') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN application_start_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'application_last_date') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN application_last_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'admission_cycle_notes') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN admission_cycle_notes TEXT;
    END IF;

    -- Contact Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'whatsapp_number') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN whatsapp_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'visiting_hours') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN visiting_hours TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'preferred_contact_method') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN preferred_contact_method TEXT DEFAULT 'phone';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'office_address') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN office_address TEXT;
    END IF;

    -- Application Configuration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'application_method') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN application_method TEXT DEFAULT 'website';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'application_url') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN application_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'application_instructions') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN application_instructions TEXT;
    END IF;

    -- CTA & Additional Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'call_to_action') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN call_to_action TEXT DEFAULT 'Apply Now';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'custom_cta_label') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN custom_cta_label TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'fee_notes') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN fee_notes TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'school_admission_settings' AND column_name = 'additional_information') THEN
        ALTER TABLE public.school_admission_settings ADD COLUMN additional_information TEXT;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CLASS-WISE ADMISSION AVAILABILITY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_class_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID,
    class_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'waitlist', 'enquiry_only', 'not_offered')),
    available_seats INTEGER CHECK (available_seats >= 0),
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_class_avail_school_id ON public.school_admission_class_availability (school_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admission_class_avail_unique ON public.school_admission_class_availability (school_id, class_name);

-- ------------------------------------------------------------------------------
-- 3. ADMISSION & DYNAMIC FEES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(12, 2) CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    frequency TEXT NOT NULL DEFAULT 'one_time' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'half_yearly', 'annual', 'per_term', 'per_session', 'other')),
    applicable_classes TEXT[] DEFAULT '{}',
    notes TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_fees_school_id ON public.school_admission_fees (school_id);

-- ------------------------------------------------------------------------------
-- 4. REQUIRED ADMISSION DOCUMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    requirement TEXT NOT NULL DEFAULT 'optional' CHECK (requirement IN ('required', 'optional', 'not_requested')),
    custom_name TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_documents_school_id ON public.school_admission_documents (school_id);

-- ------------------------------------------------------------------------------
-- 5. ADMISSION PROCESS STEPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_process_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    step_label TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    step_order INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admission_process_steps_school_id ON public.school_admission_process_steps (school_id);

-- ------------------------------------------------------------------------------
-- 6. IMPORTANT ADMISSION DATES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_date_chronology CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_admission_dates_school_id ON public.school_admission_dates (school_id);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.school_admission_class_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission_process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_admission_classes" ON public.school_admission_class_availability
    FOR ALL USING (school_id = current_setting('app.current_school_id', true)::uuid);

CREATE POLICY "tenant_isolation_admission_fees" ON public.school_admission_fees
    FOR ALL USING (school_id = current_setting('app.current_school_id', true)::uuid);

CREATE POLICY "tenant_isolation_admission_docs" ON public.school_admission_documents
    FOR ALL USING (school_id = current_setting('app.current_school_id', true)::uuid);

CREATE POLICY "tenant_isolation_admission_process" ON public.school_admission_process_steps
    FOR ALL USING (school_id = current_setting('app.current_school_id', true)::uuid);

CREATE POLICY "tenant_isolation_admission_dates" ON public.school_admission_dates
    FOR ALL USING (school_id = current_setting('app.current_school_id', true)::uuid);
