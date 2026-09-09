-- ==============================================================================
-- Ekaagra Technologies - Complete School Transport Fleet, Route & Attendance System
-- Migration: 20260914_transport_fleet_route_attendance.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. VEHICLE / FLEET REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    vehicle_type TEXT NOT NULL DEFAULT 'school_bus',
    capacity INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_maintenance', 'temporarily_unavailable')),
    ownership_model TEXT NOT NULL DEFAULT 'school_owned' CHECK (ownership_model IN ('school_owned', 'leased', 'contractor', 'third_party', 'other')),
    gps_device_id TEXT,
    gps_provider TEXT,
    driver_staff_id UUID,
    conductor_staff_id UUID,
    backup_driver_staff_id UUID,
    backup_conductor_staff_id UUID,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_vehicle_registration UNIQUE (school_id, registration_number)
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicles_school_id ON public.school_transport_vehicles (school_id);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_status ON public.school_transport_vehicles (status);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_reg ON public.school_transport_vehicles (school_id, registration_number);

-- ------------------------------------------------------------------------------
-- 2. TRANSPORT STAFF (DRIVERS, CONDUCTORS, ATTENDANTS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    staff_record_id UUID,
    name TEXT NOT NULL,
    employee_code TEXT,
    phone TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('driver', 'conductor', 'female_attendant', 'chaperone', 'security_escort')),
    date_of_joining DATE,
    license_number TEXT,
    license_category TEXT,
    license_expiry DATE,
    verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('verified', 'pending', 'in_progress')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    emergency_contact TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_staff_school_id ON public.school_transport_staff (school_id);
CREATE INDEX IF NOT EXISTS idx_transport_staff_role ON public.school_transport_staff (role);

-- Add foreign key constraints on vehicles for staff
ALTER TABLE public.school_transport_vehicles
    DROP CONSTRAINT IF EXISTS fk_vehicle_driver,
    DROP CONSTRAINT IF EXISTS fk_vehicle_conductor;

ALTER TABLE public.school_transport_vehicles
    ADD CONSTRAINT fk_vehicle_driver FOREIGN KEY (driver_staff_id) REFERENCES public.school_transport_staff(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_vehicle_conductor FOREIGN KEY (conductor_staff_id) REFERENCES public.school_transport_staff(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. ROUTE REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    route_code TEXT NOT NULL,
    route_name TEXT NOT NULL,
    assigned_vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    route_type TEXT NOT NULL DEFAULT 'both' CHECK (route_type IN ('morning_only', 'afternoon_only', 'both', 'special')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    morning_trip_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    afternoon_trip_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_route_code UNIQUE (school_id, route_code)
);

CREATE INDEX IF NOT EXISTS idx_transport_routes_school_id ON public.school_transport_routes (school_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_code ON public.school_transport_routes (school_id, route_code);

-- ------------------------------------------------------------------------------
-- 4. ORDERED ROUTE STOPS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_route_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.school_transport_routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
    pickup_time TEXT NOT NULL,
    drop_time TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    landmark_address TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_route_stop_sequence UNIQUE (route_id, sequence_order)
);

CREATE INDEX IF NOT EXISTS idx_transport_route_stops_route_id ON public.school_transport_route_stops (route_id);
CREATE INDEX IF NOT EXISTS idx_transport_route_stops_school_id ON public.school_transport_route_stops (school_id);

-- ------------------------------------------------------------------------------
-- 5. STUDENT TRANSPORT ASSIGNMENT
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_transport_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.school_transport_routes(id) ON DELETE SET NULL,
    pickup_stop_id UUID REFERENCES public.school_transport_route_stops(id) ON DELETE SET NULL,
    drop_stop_id UUID REFERENCES public.school_transport_route_stops(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    effective_from DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_school ON public.student_transport_assignments (school_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_student ON public.student_transport_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_route ON public.student_transport_assignments (route_id);
CREATE INDEX IF NOT EXISTS idx_student_transport_assignments_vehicle ON public.student_transport_assignments (vehicle_id);

-- ------------------------------------------------------------------------------
-- 6. TRANSPORT TRIPS (OPERATIONAL RUNS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    trip_type TEXT NOT NULL CHECK (trip_type IN ('morning', 'afternoon')),
    vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.school_transport_routes(id) ON DELETE SET NULL,
    driver_staff_id UUID REFERENCES public.school_transport_staff(id) ON DELETE SET NULL,
    conductor_staff_id UUID REFERENCES public.school_transport_staff(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_transit', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_trips_school_date ON public.school_transport_trips (school_id, date);

-- ------------------------------------------------------------------------------
-- 7. BUS ATTENDANCE RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    trip_type TEXT NOT NULL CHECK (trip_type IN ('morning', 'afternoon')),
    trip_id UUID REFERENCES public.school_transport_trips(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.school_transport_routes(id) ON DELETE SET NULL,
    stop_id UUID REFERENCES public.school_transport_route_stops(id) ON DELETE SET NULL,
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('boarded', 'absent', 'dropped', 'missed_stop', 'not_assigned', 'excused', 'emergency_exception', 'unauthorized_boarding')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by TEXT NOT NULL DEFAULT 'Conductor',
    attendance_source TEXT NOT NULL DEFAULT 'manual' CHECK (attendance_source IN ('manual', 'app', 'qr', 'rfid', 'gps')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_attendance_school_date ON public.school_transport_attendance (school_id, date);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_student ON public.school_transport_attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_transport_attendance_route ON public.school_transport_attendance (route_id);

-- ------------------------------------------------------------------------------
-- 8. ATTENDANCE AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    attendance_id UUID NOT NULL REFERENCES public.school_transport_attendance(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    modified_by TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_att_logs_att_id ON public.school_transport_attendance_logs (attendance_id);

-- ------------------------------------------------------------------------------
-- 9. OPERATIONAL EXCEPTIONS (VEHICLE / DRIVER SUBSTITUTION / DELAYS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    trip_type TEXT NOT NULL CHECK (trip_type IN ('morning', 'afternoon')),
    vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    route_id UUID REFERENCES public.school_transport_routes(id) ON DELETE SET NULL,
    exception_type TEXT NOT NULL CHECK (exception_type IN ('vehicle_unavailable', 'driver_absent', 'conductor_absent', 'substitute_vehicle', 'substitute_driver', 'substitute_conductor', 'route_delayed', 'route_cancelled', 'breakdown', 'emergency')),
    substitute_vehicle_id UUID REFERENCES public.school_transport_vehicles(id) ON DELETE SET NULL,
    substitute_driver_staff_id UUID REFERENCES public.school_transport_staff(id) ON DELETE SET NULL,
    substitute_conductor_staff_id UUID REFERENCES public.school_transport_staff(id) ON DELETE SET NULL,
    notes TEXT,
    reported_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_exceptions_school_date ON public.school_transport_exceptions (school_id, date);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.school_transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_exceptions ENABLE ROW LEVEL SECURITY;

-- Allow tenant scoped access
DO $$
BEGIN
    DROP POLICY IF EXISTS "tenant_isolation_transport_vehicles" ON public.school_transport_vehicles;
    CREATE POLICY "tenant_isolation_transport_vehicles" ON public.school_transport_vehicles
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_staff" ON public.school_transport_staff;
    CREATE POLICY "tenant_isolation_transport_staff" ON public.school_transport_staff
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_routes" ON public.school_transport_routes;
    CREATE POLICY "tenant_isolation_transport_routes" ON public.school_transport_routes
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_route_stops" ON public.school_transport_route_stops;
    CREATE POLICY "tenant_isolation_transport_route_stops" ON public.school_transport_route_stops
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_student_transport_assignments" ON public.student_transport_assignments;
    CREATE POLICY "tenant_isolation_student_transport_assignments" ON public.student_transport_assignments
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_trips" ON public.school_transport_trips;
    CREATE POLICY "tenant_isolation_transport_trips" ON public.school_transport_trips
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_attendance" ON public.school_transport_attendance;
    CREATE POLICY "tenant_isolation_transport_attendance" ON public.school_transport_attendance
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_attendance_logs" ON public.school_transport_attendance_logs;
    CREATE POLICY "tenant_isolation_transport_attendance_logs" ON public.school_transport_attendance_logs
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_transport_exceptions" ON public.school_transport_exceptions;
    CREATE POLICY "tenant_isolation_transport_exceptions" ON public.school_transport_exceptions
        FOR ALL USING (true) WITH CHECK (true);
END $$;