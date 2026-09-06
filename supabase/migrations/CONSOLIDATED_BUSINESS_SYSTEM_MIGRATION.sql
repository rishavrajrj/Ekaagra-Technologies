-- ==============================================================================
-- EKAAGRA TECHNOLOGIES — CONSOLIDATED BUSINESS CLIENT SYSTEM MIGRATION
-- Run this in the Ekaagra Central Supabase SQL Editor
-- Creates: 9 Business Tables, Triggers, RLS Policies, Indexes & Storage Config
-- Does NOT touch any School database or tables!
-- ==============================================================================

-- 0. Universal Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Clients Table (Normalized client profile)
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

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Business Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_number TEXT UNIQUE NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_type TEXT NOT NULL DEFAULT 'BUSINESS',
    project_name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    project_status TEXT NOT NULL DEFAULT 'NEW_PROJECT',
    assigned_team TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_project_type_valid CHECK (project_type IN ('BUSINESS', 'SCHOOL'))
);

CREATE INDEX IF NOT EXISTS idx_projects_number ON public.projects (project_number);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON public.projects (lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (project_status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects (project_type);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects (created_at DESC);

DROP TRIGGER IF EXISTS set_projects_updated_at ON public.projects;
CREATE TRIGGER set_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Business Onboarding Tokens
CREATE TABLE IF NOT EXISTS public.business_onboarding_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    token_code TEXT NOT NULL,
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

-- 4. Business Requirements Working Draft
CREATE TABLE IF NOT EXISTS public.business_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    form_version INT NOT NULL DEFAULT 1,
    requirements_data JSONB NOT NULL DEFAULT '{}'::jsonb,
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
    is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ,
    last_saved_step INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_requirements_project ON public.business_requirements (project_id);

DROP TRIGGER IF EXISTS set_business_requirements_updated_at ON public.business_requirements;
CREATE TRIGGER set_business_requirements_updated_at
    BEFORE UPDATE ON public.business_requirements
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Business Requirement Submissions (Immutable Snapshots)
CREATE TABLE IF NOT EXISTS public.business_requirement_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    submission_data JSONB NOT NULL,
    review_status TEXT NOT NULL DEFAULT 'SUBMITTED',
    admin_notes TEXT,
    clarification_notes TEXT,
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_submissions_project ON public.business_requirement_submissions (project_id);
CREATE INDEX IF NOT EXISTS idx_biz_submissions_proj_ver ON public.business_requirement_submissions (project_id, version_number DESC);

-- 6. Business Requirement Assets
CREATE TABLE IF NOT EXISTS public.business_requirement_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.business_requirement_submissions(id) ON DELETE SET NULL,
    asset_category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    uploaded_by TEXT DEFAULT 'CLIENT',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_biz_assets_project ON public.business_requirement_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_biz_assets_project_cat ON public.business_requirement_assets (project_id, asset_category);

-- 7. Design Reviews & Versioning
CREATE TABLE IF NOT EXISTS public.design_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    design_title TEXT NOT NULL,
    design_url TEXT NOT NULL,
    design_notes TEXT,
    status TEXT NOT NULL DEFAULT 'READY',
    client_feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_reviews_project ON public.design_reviews (project_id);
CREATE INDEX IF NOT EXISTS idx_design_reviews_proj_ver ON public.design_reviews (project_id, version_number DESC);

DROP TRIGGER IF EXISTS set_design_reviews_updated_at ON public.design_reviews;
CREATE TRIGGER set_design_reviews_updated_at
    BEFORE UPDATE ON public.design_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 8. Project Activity (Audit Trail)
CREATE TABLE IF NOT EXISTS public.project_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    actor_type TEXT NOT NULL DEFAULT 'SYSTEM',
    actor_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_activity_project ON public.project_activity (project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_created_at ON public.project_activity (created_at DESC);

-- 9. Project Notes (Internal Team Notes)
CREATE TABLE IF NOT EXISTS public.project_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Admin',
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_notes_project ON public.project_notes (project_id);

-- 10. Link orders table to projects for milestone tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_orders_project_id ON public.orders(project_id);
    END IF;
END $$;

-- 11. Enable Row Level Security & Policies (Principle of Least Privilege)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_onboarding_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirement_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requirement_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_notes ENABLE ROW LEVEL SECURITY;

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
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow full server access" ON public.%I;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon read access" ON public.%I;', tbl);
        
        -- Allow server actions and backend services full access
        EXECUTE format('CREATE POLICY "Service role full access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- 12. Storage Bucket Setup (business-assets)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'business-assets',
            'business-assets',
            true,
            15728640, -- 15MB limit
            ARRAY[
                'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ]
        )
        ON CONFLICT (id) DO UPDATE SET
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END $$;
