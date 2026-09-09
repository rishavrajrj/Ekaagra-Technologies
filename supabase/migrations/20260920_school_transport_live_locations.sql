-- ==============================================================================
-- Migration: 20260920_school_transport_live_locations.sql
-- Description: Minimal, high-performance table for live school bus GPS tracking
--              powered by driver phone Geolocation API and Supabase Realtime.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.school_transport_live_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    route_id TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    accuracy NUMERIC(8, 2),
    heading NUMERIC(6, 2),
    speed NUMERIC(6, 2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'completed', 'stale')),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup for the latest position of a given route
CREATE INDEX IF NOT EXISTS idx_transport_live_loc_route_time 
    ON public.school_transport_live_locations(route_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_transport_live_loc_school 
    ON public.school_transport_live_locations(school_id);

-- Enable RLS
ALTER TABLE public.school_transport_live_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active bus locations so parents and public website can view live transit
DROP POLICY IF EXISTS "Public read access for active transport live locations" ON public.school_transport_live_locations;
CREATE POLICY "Public read access for active transport live locations"
    ON public.school_transport_live_locations
    FOR SELECT
    USING (true);

-- Allow inserting location updates
DROP POLICY IF EXISTS "Allow location updates insert" ON public.school_transport_live_locations;
CREATE POLICY "Allow location updates insert"
    ON public.school_transport_live_locations
    FOR INSERT
    WITH CHECK (true);

-- Allow updating location records
DROP POLICY IF EXISTS "Allow location updates modify" ON public.school_transport_live_locations;
CREATE POLICY "Allow location updates modify"
    ON public.school_transport_live_locations
    FOR UPDATE
    USING (true);

-- Add table to Supabase Realtime publication if publication exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'school_transport_live_locations'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.school_transport_live_locations;
        END IF;
    END IF;
END $$;
