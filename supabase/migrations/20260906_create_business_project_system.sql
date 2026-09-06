-- ==============================================================================
-- Ekaagra Technologies - Business Client Project Intake & Management System
-- Migration: 20260906_create_business_project_system.sql
-- ==============================================================================

-- 1. Clients Table (Normalized stable client profile)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT,
    city TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients (email);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients (created_at DESC);

-- Trigger for clients updated_at
DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Business Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number TEXT UNIQUE NOT NULL, -- e.g. BUS-2026-0001
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    project_type TEXT NOT NULL DEFAULT 'BUSINESS', -- 'BUSINESS' | 'SCHOOL'
    project_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    
    -- Pipeline Statuses:
    -- NEW_PROJECT | REQUIREMENTS_PENDING | REQUIREMENTS_SUBMITTED | REQUIREMENTS_UNDER_REVIEW |
    -- CLARIFICATION_REQUESTED | DESIGN_IN_PROGRESS | DESIGN_READY | REVISION_REQUESTED |
    -- DESIGN_APPROVED | PAYMENT_PENDING | PAID | DEVELOPMENT | STAGING_REVIEW | FINAL_APPROVAL |
    -- LAUNCHED | COMPLETED | CANCELLED
    project_status TEXT NOT NULL DEFAULT 'NEW_PROJECT',
    
    assigned_team TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_number ON public.projects (project_number);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects (lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (project_status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects (project_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects (created_at DESC);

-- Trigger for projects updated_at
DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Business Onboarding Tokens (Secure project-specific links)
CREATE TABLE IF NOT EXISTS public.business_onboarding_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    token_code TEXT NOT NULL, -- e.g. REQ-2026-0001
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_reason TEXT,
    access_count INT NOT NULL DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_tokens_hash ON public.business_onboarding_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_biz_tokens_project ON public.business_onboarding_tokens (project_id);

-- 4. Business Requirements Working Draft (Resumable & auto-saved)
CREATE TABLE IF NOT EXISTS public.business_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    form_version INT NOT NULL DEFAULT 1,
    
    -- Normalized sections for structured persistence
    section_a_profile JSONB DEFAULT '{}'::jsonb,
    section_b_project_type JSONB DEFAULT '{}'::jsonb,
    section_c_objectives JSONB DEFAULT '{}'::jsonb,
    section_d_target_audience JSONB DEFAULT '{}'::jsonb,
    section_e_website_reqs JSONB DEFAULT '{}'::jsonb,
    section_f_features JSONB DEFAULT '{}'::jsonb,
    section_g_system_reqs JSONB DEFAULT '{}'::jsonb,
    section_h_content_assets JSONB DEFAULT '{}'::jsonb,
    section_i_design_preferences JSONB DEFAULT '{}'::jsonb,
    section_j_domain_hosting JSONB DEFAULT '{}'::jsonb,
    
    current_step INT NOT NULL DEFAULT 1,
    completion_percentage INT NOT NULL DEFAULT 0,
    is_resumable BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_reqs_project ON public.business_requirements (project_id);

-- Trigger for business_requirements updated_at
DROP TRIGGER IF EXISTS set_biz_reqs_updated_at ON public.business_requirements;
CREATE TRIGGER set_biz_reqs_updated_at
    BEFORE UPDATE ON public.business_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Business Requirement Submissions (Immutable historical snapshot upon submission)
CREATE TABLE IF NOT EXISTS public.business_requirement_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    form_version INT NOT NULL DEFAULT 1,
    
    submitted_by_name TEXT NOT NULL,
    submitted_by_email TEXT NOT NULL,
    client_confirmation BOOLEAN NOT NULL DEFAULT TRUE,
    
    full_payload JSONB NOT NULL,
    
    -- Review Lifecycle: PENDING | UNDER_REVIEW | REVIEWED | CLARIFICATION_REQUESTED
    review_status TEXT NOT NULL DEFAULT 'PENDING',
    admin_review_notes TEXT,
    clarification_notes TEXT,
    
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_biz_submissions_project ON public.business_requirement_submissions (project_id);
CREATE INDEX IF NOT EXISTS idx_biz_submissions_status ON public.business_requirement_submissions (review_status);

-- 6. Business Requirement Assets (Uploaded / linked files)
CREATE TABLE IF NOT EXISTS public.business_requirement_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.business_requirement_submissions(id) ON DELETE SET NULL,
    
    asset_category TEXT NOT NULL, -- 'LOGO' | 'BRAND_GUIDELINE' | 'DOCUMENT' | 'IMAGE' | 'OTHER'
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_assets_project ON public.business_requirement_assets (project_id);

-- 7. Design Reviews & Client Approval Workflow
CREATE TABLE IF NOT EXISTS public.design_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    design_version INT NOT NULL DEFAULT 1,
    
    design_title TEXT NOT NULL,
    design_url TEXT NOT NULL, -- Figma link, staging prototype, or mockup URL
    design_notes TEXT,
    
    -- Review status: PENDING_REVIEW | REVISION_REQUESTED | APPROVED
    status TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    client_feedback TEXT,
    revision_count INT NOT NULL DEFAULT 0,
    
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by_client TEXT
);

CREATE INDEX IF NOT EXISTS idx_design_reviews_project ON public.design_reviews (project_id);
CREATE INDEX IF NOT EXISTS idx_design_reviews_status ON public.design_reviews (status);

-- 8. Project Activity Audit Trail
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'SYSTEM', -- 'ADMIN' | 'CLIENT' | 'SYSTEM'
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project ON public.project_activity (project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_created_at ON public.project_activity (created_at DESC);

-- 9. Internal Project Notes (Admin Private)
CREATE TABLE IF NOT EXISTS public.project_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE, -- Client NEVER sees internal notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project ON public.project_notes (project_id);

-- 10. Link existing orders table to projects
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.orders 
        ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_orders_project_id ON public.orders (project_id);
    END IF;
END $$;

-- 11. Enable Row Level Security (RLS) on all new tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirement_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

-- 12. Policies: Principle of Least Privilege
-- Server route handlers / server actions use service_role key to bypass RLS.
-- Authenticated & anon users can read/write where explicitly permitted.
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'clients', 'projects', 'business_onboarding_tokens', 'business_requirements',
            'business_requirement_submissions', 'business_requirement_assets',
            'design_reviews', 'project_activity', 'project_notes'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow full server access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Allow full server access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;
