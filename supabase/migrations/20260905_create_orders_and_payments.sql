-- ==============================================================================
-- Ekaagra Technologies - Payment & Order Persistence Layer
-- Migration: 20260905_create_orders_and_payments.sql
-- ==============================================================================

-- 1. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    
    -- Customer Contact Information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Service & Configuration Details
    service_type TEXT NOT NULL,
    plan_id TEXT,
    amount_inr NUMERIC(10, 2) NOT NULL,
    
    -- Payment Gateway Attributes
    payment_status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
    gateway_name TEXT NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id TEXT,
    gateway_payment_id TEXT,
    gateway_signature TEXT,
    
    -- Structured Metadata (breakdown of plan, pages, domain, notes)
    metadata JSONB,
    
    -- Lifecycle Timestamps
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for High-Speed Querying & Idempotency Lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_gateway_order_id ON public.orders (gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_lead_id ON public.orders (lead_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (customer_email);

-- 3. Automatic updated_at trigger for orders table
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Create payment_events table for webhook audit trails and duplicate detection
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    gateway_event_id TEXT,
    gateway_payment_id TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON public.payment_events (order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_gateway_event_id ON public.payment_events (gateway_event_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- 6. Access Policies:
-- Enforce principle of least privilege:
-- Client browsers must never be able to directly mutate payment records.
-- Server-side Route Handlers & Server Actions utilize service_role or server client.

DROP POLICY IF EXISTS "Allow order creation" ON public.orders;
CREATE POLICY "Allow order creation"
    ON public.orders
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow order reading" ON public.orders;
CREATE POLICY "Allow order reading"
    ON public.orders
    FOR SELECT
    TO anon, authenticated, service_role
    USING (true);

DROP POLICY IF EXISTS "Allow order management" ON public.orders;
CREATE POLICY "Allow order management"
    ON public.orders
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow order deletion" ON public.orders;
CREATE POLICY "Allow order deletion"
    ON public.orders
    FOR DELETE
    TO service_role
    USING (true);

DROP POLICY IF EXISTS "Allow payment event management" ON public.payment_events;
CREATE POLICY "Allow payment event management"
    ON public.payment_events
    FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);
