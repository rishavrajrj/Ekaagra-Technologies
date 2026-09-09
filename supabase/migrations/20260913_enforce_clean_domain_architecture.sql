-- ==============================================================================
-- Ekaagra Technologies - Domain Architecture Isolation Migration
-- Migration: 20260913_enforce_clean_domain_architecture.sql
-- ==============================================================================

-- 1. Ensure domain column on public.projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'BUSINESS';

CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects (domain);

-- 2. Ensure lead_domain column on public.leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS lead_domain TEXT NOT NULL DEFAULT 'BUSINESS';

CREATE INDEX IF NOT EXISTS idx_leads_lead_domain ON public.leads (lead_domain);

-- 3. Ensure domain and project reference columns on public.orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS domain TEXT NOT NULL DEFAULT 'BUSINESS',
ADD COLUMN IF NOT EXISTS project_number TEXT,
ADD COLUMN IF NOT EXISTS project_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_domain ON public.orders (domain);
CREATE INDEX IF NOT EXISTS idx_orders_project_number ON public.orders (project_number);

-- 4. Default updates for existing data
UPDATE public.projects
SET domain = 'BUSINESS'
WHERE domain IS NULL OR domain = '';

UPDATE public.leads
SET lead_domain = 'SCHOOL'
WHERE lead_domain IS NULL 
   OR lead_domain = 'BUSINESS'
  AND (
    commercial_product_id ILIKE 'school%'
    OR service ILIKE '%school%'
    OR project_type ILIKE '%school%'
    OR organization ILIKE '%school%'
    OR organization ILIKE '%vidyalaya%'
    OR organization ILIKE '%academy%'
    OR description ILIKE '%school name:%'
  );

UPDATE public.orders
SET domain = 'SCHOOL'
WHERE (
  service_type ILIKE '%school%'
  OR plan_id ILIKE 'school%'
  OR (metadata->>'domain') = 'SCHOOL'
);
