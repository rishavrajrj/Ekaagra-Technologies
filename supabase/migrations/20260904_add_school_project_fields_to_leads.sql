-- ==============================================================================
-- Ekaagra Technologies - Add School Project Handoff Fields
-- Table: leads
-- ==============================================================================

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS school_project_reference TEXT,
ADD COLUMN IF NOT EXISTS handoff_status TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS handoff_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commercial_product_id TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_school_proj_ref ON public.leads (school_project_reference);
CREATE INDEX IF NOT EXISTS idx_leads_handoff_status ON public.leads (handoff_status);
