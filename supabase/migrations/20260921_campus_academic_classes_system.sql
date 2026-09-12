-- ==============================================================================
-- Ekaagra Technologies - Campus Academic Classes & Scope Architecture
-- Migration: 20260921_campus_academic_classes_system.sql
-- ==============================================================================

-- 1. CAMPUS-SCOPED ACADEMIC CLASSES
-- Defines which classes each campus operates as its canonical academic scope.
CREATE TABLE IF NOT EXISTS public.campus_academic_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campus_id UUID NOT NULL REFERENCES public.school_campuses(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.academic_classes(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_campus_academic_classes UNIQUE (campus_id, class_id)
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_campus_academic_classes_campus ON public.campus_academic_classes (campus_id);
CREATE INDEX IF NOT EXISTS idx_campus_academic_classes_class ON public.campus_academic_classes (class_id);
CREATE INDEX IF NOT EXISTS idx_campus_academic_classes_active ON public.campus_academic_classes (campus_id, is_active);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.campus_academic_classes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campus_academic_classes' AND policyname = 'service_role_all_campus_classes'
    ) THEN
        CREATE POLICY service_role_all_campus_classes ON public.campus_academic_classes
            FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'campus_academic_classes' AND policyname = 'public_read_active_campus_classes'
    ) THEN
        CREATE POLICY public_read_active_campus_classes ON public.campus_academic_classes
            FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- 4. IDEMPOTENT MIGRATION STRATEGY FOR EXISTING SCHOOL DATA
-- Automatically populates campus_academic_classes for existing campuses and classes
DO $$
BEGIN
    -- Check if both school_campuses and academic_classes exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_campuses')
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'academic_classes') THEN
        
        -- Insert mapping for each campus and class belonging to the same school
        INSERT INTO public.campus_academic_classes (campus_id, class_id, is_active, display_order)
        SELECT 
            c.id AS campus_id,
            ac.id AS class_id,
            TRUE AS is_active,
            COALESCE(ac.sort_order, 0) AS display_order
        FROM public.school_campuses c
        JOIN public.academic_classes ac ON ac.school_id = c.school_id
        ON CONFLICT (campus_id, class_id) DO NOTHING;
        
    END IF;
END $$;
