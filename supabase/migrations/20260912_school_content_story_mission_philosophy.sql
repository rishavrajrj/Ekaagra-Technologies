-- ==============================================================================
-- Ekaagra Technologies - School Story, Mission & Educational Philosophy Migration
-- Migration: 20260912_school_content_story_mission_philosophy.sql
-- Section 6 Production-Hardening & Narrative Fact Storage
-- ==============================================================================

-- 1. Ensure permanent institutional narrative columns exist on public.school_profiles
-- (Nullable, fully backward-compatible, idempotent)
ALTER TABLE public.school_profiles
    ADD COLUMN IF NOT EXISTS about_school TEXT,
    ADD COLUMN IF NOT EXISTS mission TEXT,
    ADD COLUMN IF NOT EXISTS vision TEXT,
    ADD COLUMN IF NOT EXISTS educational_philosophy TEXT,
    ADD COLUMN IF NOT EXISTS core_values TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS narrative_status TEXT DEFAULT 'generated',
    ADD COLUMN IF NOT EXISTS narrative_approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS narrative_approved_by TEXT;

-- 2. Ensure indexes exist for rapid tenant lookup
CREATE INDEX IF NOT EXISTS idx_school_profiles_narrative_status 
    ON public.school_profiles (narrative_status);

-- 3. Document canonical JSONB storage in submissions
COMMENT ON COLUMN public.school_profiles.about_school IS 
    'Official institutional story synthesized from identity and verified facts';
COMMENT ON COLUMN public.school_profiles.mission IS 
    'Concise, verified institutional mission statement';
COMMENT ON COLUMN public.school_profiles.vision IS 
    'Forward-looking institutional vision statement';
COMMENT ON COLUMN public.school_profiles.educational_philosophy IS 
    'Pedagogical framework and teaching methodology';
COMMENT ON COLUMN public.school_profiles.core_values IS 
    'Structured array of institutional core values';
