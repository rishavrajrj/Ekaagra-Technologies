-- ==============================================================================
-- Ekaagra Technologies - Lead Management Migration
-- Table: leads
-- ==============================================================================

-- 1. Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Classification
    source TEXT NOT NULL,           -- 'CONTACT_FORM' | 'QUOTE_FORM' | 'WHATSAPP'
    type TEXT NOT NULL,             -- 'CONTACT' | 'QUOTE' | 'WHATSAPP'
    status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL_SENT' | 'CONVERTED' | 'LOST'

    -- Client Contact Information
    name TEXT NOT NULL,
    organization TEXT,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,

    -- Project Specifications
    service TEXT,                   -- Service requested in contact form
    project_type TEXT,              -- Solution type requested in quote form
    budget TEXT,
    timeline TEXT,
    expected_users TEXT,
    features TEXT,
    description TEXT NOT NULL,
    preferred_contact TEXT,

    -- Lead Lifecycle Tracking Timestamps
    contacted_at TIMESTAMPTZ,
    proposal_sent_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    lost_at TIMESTAMPTZ,

    -- Internal Notes
    notes TEXT
);

-- 3. Indexes for high-performance querying, search, and dashboard filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_type ON public.leads (type);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads (phone);

-- 4. Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6. Strict RLS Policies:
-- Disallow public anon SELECT, UPDATE, DELETE to protect customer privacy and internal notes.
-- Server-side operations run via Supabase Service Role Key bypass RLS automatically.

-- Allow authenticated admins (if using Supabase Auth) full access
CREATE POLICY "Admins have full access to leads"
    ON public.leads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
