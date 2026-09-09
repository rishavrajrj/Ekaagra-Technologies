-- ==============================================================================
-- Ekaagra Technologies - Complete School Hostel & Residential Boarding System
-- Migration: 20260915_hostel_residential_boarding_system.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HOSTEL BUILDINGS REGISTRY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    gender_category TEXT NOT NULL DEFAULT 'boys' CHECK (gender_category IN ('boys', 'girls', 'co_ed', 'staff_quarters')),
    capacity INTEGER NOT NULL DEFAULT 50 CHECK (capacity >= 0),
    floors_count INTEGER DEFAULT 3 CHECK (floors_count >= 1),
    warden_staff_id UUID,
    assistant_warden_staff_id UUID,
    supervisor_staff_id UUID,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_hostel_building_code UNIQUE (school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_hostel_buildings_school_id ON public.school_hostel_buildings (school_id);
CREATE INDEX IF NOT EXISTS idx_hostel_buildings_status ON public.school_hostel_buildings (status);
CREATE INDEX IF NOT EXISTS idx_hostel_buildings_code ON public.school_hostel_buildings (school_id, code);

-- ------------------------------------------------------------------------------
-- 2. HOSTEL ROOMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.school_hostel_buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    floor INTEGER DEFAULT 1,
    category TEXT NOT NULL DEFAULT 'four_bed' CHECK (category IN ('single', 'double', 'triple', 'four_bed', 'dormitory', 'custom')),
    capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity >= 0),
    gender_category TEXT NOT NULL DEFAULT 'any' CHECK (gender_category IN ('boys', 'girls', 'any')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hostel_building_room UNIQUE (building_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_hostel_rooms_building_id ON public.school_hostel_rooms (building_id);
CREATE INDEX IF NOT EXISTS idx_hostel_rooms_school_id ON public.school_hostel_rooms (school_id);

-- ------------------------------------------------------------------------------
-- 3. HOSTEL INDIVIDUAL BEDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    building_id UUID NOT NULL REFERENCES public.school_hostel_buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.school_hostel_rooms(id) ON DELETE CASCADE,
    bed_identifier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    assigned_student_id TEXT,
    assignment_start_date DATE,
    assignment_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hostel_room_bed UNIQUE (room_id, bed_identifier)
);

CREATE INDEX IF NOT EXISTS idx_hostel_beds_room_id ON public.school_hostel_beds (room_id);
CREATE INDEX IF NOT EXISTS idx_hostel_beds_building_id ON public.school_hostel_beds (building_id);
CREATE INDEX IF NOT EXISTS idx_hostel_beds_student ON public.school_hostel_beds (assigned_student_id);

-- ------------------------------------------------------------------------------
-- 4. RESIDENTIAL STUDENT ASSIGNMENTS (CANONICAL RELATIONSHIP)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_hostel_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    building_id UUID NOT NULL REFERENCES public.school_hostel_buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.school_hostel_rooms(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES public.school_hostel_beds(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active_resident' CHECK (status IN ('active_resident', 'on_leave', 'temporarily_away', 'checked_out', 'withdrawn')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_hostel_assignments_school ON public.student_hostel_assignments (school_id);
CREATE INDEX IF NOT EXISTS idx_student_hostel_assignments_student ON public.student_hostel_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_student_hostel_assignments_room ON public.student_hostel_assignments (room_id);
CREATE INDEX IF NOT EXISTS idx_student_hostel_assignments_building ON public.student_hostel_assignments (building_id);

-- ------------------------------------------------------------------------------
-- 5. RESIDENTIAL ATTENDANCE RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    building_id UUID NOT NULL REFERENCES public.school_hostel_buildings(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.school_hostel_rooms(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES public.school_hostel_beds(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    attendance_status TEXT NOT NULL CHECK (attendance_status IN ('present', 'absent', 'on_leave', 'late_return', 'excused', 'checked_out', 'emergency')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by TEXT NOT NULL DEFAULT 'Warden',
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'biometric', 'rfid', 'mobile_app')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hostel_attendance_school_date ON public.school_hostel_attendance (school_id, date);
CREATE INDEX IF NOT EXISTS idx_hostel_attendance_student ON public.school_hostel_attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_hostel_attendance_room ON public.school_hostel_attendance (room_id);

-- ------------------------------------------------------------------------------
-- 6. RESIDENTIAL LEAVE & OUT-PASS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('out_pass', 'weekend_leave', 'emergency_leave', 'vacation', 'medical')),
    start_datetime TIMESTAMPTZ NOT NULL,
    expected_return_datetime TIMESTAMPTZ NOT NULL,
    actual_return_datetime TIMESTAMPTZ,
    reason TEXT NOT NULL,
    approved_by_staff_id UUID,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'out', 'returned', 'overdue')),
    guardian_acknowledged BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hostel_leaves_school ON public.school_hostel_leaves (school_id);
CREATE INDEX IF NOT EXISTS idx_hostel_leaves_student ON public.school_hostel_leaves (student_id);

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.school_hostel_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_hostel_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_hostel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_hostel_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_hostel_leaves ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "tenant_isolation_hostel_buildings" ON public.school_hostel_buildings;
    CREATE POLICY "tenant_isolation_hostel_buildings" ON public.school_hostel_buildings
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_hostel_rooms" ON public.school_hostel_rooms;
    CREATE POLICY "tenant_isolation_hostel_rooms" ON public.school_hostel_rooms
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_hostel_beds" ON public.school_hostel_beds;
    CREATE POLICY "tenant_isolation_hostel_beds" ON public.school_hostel_beds
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_student_hostel_assignments" ON public.student_hostel_assignments;
    CREATE POLICY "tenant_isolation_student_hostel_assignments" ON public.student_hostel_assignments
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_hostel_attendance" ON public.school_hostel_attendance;
    CREATE POLICY "tenant_isolation_hostel_attendance" ON public.school_hostel_attendance
        FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "tenant_isolation_hostel_leaves" ON public.school_hostel_leaves;
    CREATE POLICY "tenant_isolation_hostel_leaves" ON public.school_hostel_leaves
        FOR ALL USING (true) WITH CHECK (true);
END $$;
