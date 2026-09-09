-- ==============================================================================
-- Ekaagra Technologies - Canonical School Identity Architecture Refactor
-- Migration: 20260909_canonical_school_identity_cbse_udise.sql
-- ==============================================================================
-- Enforces the four canonical identity fields:
-- 1. id: UUID PRIMARY KEY (Internal database identity only)
-- 2. school_id: VARCHAR(11) UNIQUE (UDISE+ School Code - Canonical external tenant ID)
-- 3. school_code: VARCHAR(50) (CBSE School Code / School No., e.g. 66664)
-- 4. affiliation_number: VARCHAR(50) (CBSE Affiliation Number, e.g. 330943)
-- ==============================================================================

-- 1. Ensure school_code and affiliation_number columns exist on public.schools
ALTER TABLE public.schools
    ADD COLUMN IF NOT EXISTS school_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS affiliation_number VARCHAR(50);

-- 2. Backfill school_code from existing code column if present and not set
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'code'
    ) THEN
        UPDATE public.schools
        SET school_code = code
        WHERE school_code IS NULL OR school_code = '';
    END IF;
END $$;

-- 3. Backfill affiliation_number from public.school_profiles if available
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'school_profiles' AND column_name = 'affiliation_number'
    ) THEN
        UPDATE public.schools s
        SET affiliation_number = sp.affiliation_number
        FROM public.school_profiles sp
        WHERE s.school_id = sp.school_id
          AND (s.affiliation_number IS NULL OR s.affiliation_number = '')
          AND sp.affiliation_number IS NOT NULL;
    END IF;
END $$;

-- 4. Create indexes on external CBSE codes
CREATE INDEX IF NOT EXISTS idx_schools_cbse_school_code ON public.schools (school_code);
CREATE INDEX IF NOT EXISTS idx_schools_cbse_affiliation_no ON public.schools (affiliation_number);

-- 5. Comments explaining canonical external identity roles
COMMENT ON COLUMN public.schools.id IS 'Internal database UUID primary key only. Never exposed as public identifier.';
COMMENT ON COLUMN public.schools.school_id IS 'UDISE+ School Code (Canonical external tenant identifier, exactly 11 digits).';
COMMENT ON COLUMN public.schools.school_code IS 'CBSE School Code / School No. (e.g. 66664).';
COMMENT ON COLUMN public.schools.affiliation_number IS 'CBSE Affiliation Number (e.g. 330943).';
