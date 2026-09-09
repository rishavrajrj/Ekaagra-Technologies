-- ==============================================================================
-- Ekaagra Technologies - UDISE School Identity Architecture Refactor
-- Migration: 20260908_udise_school_identity_architecture.sql
-- ==============================================================================
-- Standardizes the Canonical School Tenant Identifier across the entire platform:
-- 1. id (UUID): Internal database primary key
-- 2. school_id (VARCHAR(11)): Official school tenant identifier = UDISE Code (11 digits, numeric)
-- 3. slug (VARCHAR): Public URL routing identifier
-- 4. code (TEXT): Internal school institutional code (e.g. DPS-001)
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. MASTER TENANT ROOT: public.schools
-- ------------------------------------------------------------------------------

-- Ensure public.schools exists
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    display_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    school_id VARCHAR(11),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure school_id column exists
ALTER TABLE public.schools
    ADD COLUMN IF NOT EXISTS school_id VARCHAR(11);

-- Backfill school_id from udise_code if udise_code exists and matches 11 digits
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'udise_code'
    ) THEN
        UPDATE public.schools
        SET school_id = udise_code
        WHERE udise_code ~ '^[0-9]{11}$' AND (school_id IS NULL OR school_id = '');
    END IF;
END $$;

-- Enforce check constraint on school_id format: exactly 11 numeric digits
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_schools_school_id_format'
    ) THEN
        ALTER TABLE public.schools
            ADD CONSTRAINT chk_schools_school_id_format CHECK (school_id ~ '^[0-9]{11}$');
    END IF;
END $$;

-- Enforce UNIQUE constraint on schools(school_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_schools_school_id'
    ) THEN
        ALTER TABLE public.schools
            ADD CONSTRAINT uq_schools_school_id UNIQUE (school_id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_school_id ON public.schools (school_id);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools (slug);
CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools (code);

-- Safely drop duplicate udise_code column from schools if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'udise_code'
    ) THEN
        ALTER TABLE public.schools DROP COLUMN udise_code;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 2. SCHOOL PROFILES (1-to-1 permanent institutional identity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL UNIQUE REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    legal_name TEXT,
    display_name TEXT,
    affiliation_number TEXT,
    tax_identifier TEXT,
    registration_number TEXT,
    accreditation_body TEXT,
    primary_email TEXT,
    secondary_email TEXT,
    primary_phone TEXT,
    secondary_phone TEXT,
    website_url TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_province TEXT,
    country TEXT DEFAULT 'India',
    postal_code TEXT,
    principal_staff_id UUID,
    established_year INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration safety for school_profiles.school_id if it was previously UUID
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'school_profiles' AND column_name = 'school_id' AND data_type = 'uuid'
    ) THEN
        -- Drop old foreign key
        ALTER TABLE public.school_profiles DROP CONSTRAINT IF EXISTS school_profiles_school_id_fkey;
        -- Alter column type
        ALTER TABLE public.school_profiles ALTER COLUMN school_id TYPE VARCHAR(11) USING NULL;
        -- Add new foreign key referencing schools(school_id)
        ALTER TABLE public.school_profiles 
            ADD CONSTRAINT fk_school_profiles_school_id 
            FOREIGN KEY (school_id) REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_profiles_school_id ON public.school_profiles (school_id);

-- Safely drop duplicate udise_code column from school_profiles if present
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'school_profiles' AND column_name = 'udise_code'
    ) THEN
        ALTER TABLE public.school_profiles DROP COLUMN udise_code;
    END IF;
END $$;


-- ------------------------------------------------------------------------------
-- 3. TENANT AUTHORIZATION & MEMBERSHIPS: public.school_memberships
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'school_admin', 'principal', 'teacher', 'staff', 'accountant', 'librarian', 'transport_incharge', 'student', 'guardian', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_memberships_user_tenant UNIQUE (school_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_school_memberships_school_id ON public.school_memberships (school_id);
CREATE INDEX IF NOT EXISTS idx_school_memberships_user_id ON public.school_memberships (user_id);


-- ------------------------------------------------------------------------------
-- 4. STANDARDIZED HELPER TO CONVERT UUID SCHOOL_ID TO VARCHAR(11)
-- ------------------------------------------------------------------------------
-- A PL/pgSQL function to migrate an existing table's school_id column safely
CREATE OR REPLACE FUNCTION pg_temp.migrate_table_to_udise_school_id(tbl_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = tbl_name AND column_name = 'school_id' AND data_type = 'uuid'
    ) THEN
        -- Remove existing foreign keys on school_id
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I_school_id_fkey', tbl_name, tbl_name);
        -- Alter column type to VARCHAR(11)
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN school_id TYPE VARCHAR(11) USING NULL', tbl_name);
        -- Add foreign key constraint to schools(school_id)
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT fk_%I_school_id FOREIGN KEY (school_id) REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT', tbl_name, tbl_name);
    END IF;
    -- Ensure index exists
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_school_id ON public.%I (school_id)', tbl_name, tbl_name);
END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------------------------
-- 5. CONVERT ALL EXISTING ONBOARDING & SETTINGS TABLES
-- ------------------------------------------------------------------------------
SELECT pg_temp.migrate_table_to_udise_school_id('school_campuses');
SELECT pg_temp.migrate_table_to_udise_school_id('facility_campuses');
SELECT pg_temp.migrate_table_to_udise_school_id('school_brandings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_localizations');
SELECT pg_temp.migrate_table_to_udise_school_id('school_academic_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('academic_sessions');
SELECT pg_temp.migrate_table_to_udise_school_id('academic_classes');
SELECT pg_temp.migrate_table_to_udise_school_id('sections');
SELECT pg_temp.migrate_table_to_udise_school_id('subjects');
SELECT pg_temp.migrate_table_to_udise_school_id('departments');
SELECT pg_temp.migrate_table_to_udise_school_id('designations');
SELECT pg_temp.migrate_table_to_udise_school_id('staff');
SELECT pg_temp.migrate_table_to_udise_school_id('school_admission_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_fee_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_attendance_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_exam_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_transport_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_library_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_hostel_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_communication_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_website_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('school_integrations');
SELECT pg_temp.migrate_table_to_udise_school_id('school_migration_requests');
SELECT pg_temp.migrate_table_to_udise_school_id('school_onboarding_assets');
SELECT pg_temp.migrate_table_to_udise_school_id('school_onboarding_submissions');
SELECT pg_temp.migrate_table_to_udise_school_id('school_onboarding_activity');
SELECT pg_temp.migrate_table_to_udise_school_id('cms_site_settings');
SELECT pg_temp.migrate_table_to_udise_school_id('cms_pages');
SELECT pg_temp.migrate_table_to_udise_school_id('school_module_subscriptions');
SELECT pg_temp.migrate_table_to_udise_school_id('school_module_configs');


-- ------------------------------------------------------------------------------
-- 6. CORE SCHOOL-OWNED ERP TABLES (STUDENTS, FEES, ATTENDANCE, ETC.)
-- ------------------------------------------------------------------------------

-- STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    admission_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    class_id UUID,
    section_id UUID,
    roll_number TEXT,
    dob DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    email TEXT,
    phone TEXT,
    blood_group TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_students_school_admission UNIQUE (school_id, admission_number)
);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students (school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students (school_id, class_id);

-- STAFF (Faculty & Administration Roster)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    employee_code TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT,
    email TEXT,
    designation TEXT,
    department TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_staff_school_employee UNIQUE (school_id, employee_code)
);
CREATE INDEX IF NOT EXISTS idx_staff_school_id ON public.staff (school_id);

-- GUARDIANS / PARENTS
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    occupation TEXT,
    is_primary_contact BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guardians_school_id ON public.guardians (school_id);
CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON public.guardians (student_id);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID,
    section_id UUID,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'half_day', 'excused')),
    remarks TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_student_date UNIQUE (school_id, student_id, date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance (school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance (school_id, date);

-- FEE CATEGORIES
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fee_categories_code UNIQUE (school_id, code)
);
CREATE INDEX IF NOT EXISTS idx_fee_categories_school_id ON public.fee_categories (school_id);

-- FEE STRUCTURES
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    category_id UUID REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    frequency TEXT DEFAULT 'monthly',
    session_name TEXT NOT NULL DEFAULT '2026-2027',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fee_structures_school_id ON public.fee_structures (school_id);

-- FEES / STUDENT FEE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES public.fee_structures(id) ON DELETE RESTRICT,
    due_date DATE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fees_school_id ON public.fees (school_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON public.fees (school_id, student_id);

-- INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'partially_paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoices_number UNIQUE (school_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_school_id ON public.invoices (school_id);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'online', 'cheque', 'upi', 'bank_transfer', 'other')),
    transaction_reference TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'pending', 'failed', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payments_receipt UNIQUE (school_id, receipt_number)
);
CREATE INDEX IF NOT EXISTS idx_payments_school_id ON public.payments (school_id);

-- ADMISSIONS
CREATE TABLE IF NOT EXISTS public.admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    application_number TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    class_applying TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('inquiry', 'applied', 'verified', 'approved', 'rejected', 'enrolled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_admissions_app_no UNIQUE (school_id, application_number)
);
CREATE INDEX IF NOT EXISTS idx_admissions_school_id ON public.admissions (school_id);

-- APPLICATIONS (General Online Applications)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    application_type TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_applications_school_id ON public.applications (school_id);

-- TRANSPORT VEHICLES
CREATE TABLE IF NOT EXISTS public.transport_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    vehicle_number TEXT NOT NULL,
    vehicle_type TEXT DEFAULT 'bus',
    capacity INTEGER NOT NULL DEFAULT 40,
    driver_name TEXT,
    driver_phone TEXT,
    helper_name TEXT,
    gps_device_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vehicles_number UNIQUE (school_id, vehicle_number)
);
CREATE INDEX IF NOT EXISTS idx_transport_vehicles_school_id ON public.transport_vehicles (school_id);

-- TRANSPORT ROUTES
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    route_name TEXT NOT NULL,
    route_code TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE SET NULL,
    start_point TEXT,
    end_point TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_routes_code UNIQUE (school_id, route_code)
);
CREATE INDEX IF NOT EXISTS idx_transport_routes_school_id ON public.transport_routes (school_id);

-- TRANSPORT STOPS
CREATE TABLE IF NOT EXISTS public.transport_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    pickup_time TEXT,
    drop_time TEXT,
    fare NUMERIC(10, 2) DEFAULT 0,
    stop_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transport_stops_school_id ON public.transport_stops (school_id);

-- TRANSPORT ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.transport_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES public.transport_stops(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_transport_student UNIQUE (school_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_transport_assignments_school_id ON public.transport_assignments (school_id);

-- LIBRARY BOOKS
CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    isbn TEXT,
    author TEXT,
    publisher TEXT,
    category TEXT,
    edition TEXT,
    total_copies INTEGER NOT NULL DEFAULT 1,
    available_copies INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_library_books_school_id ON public.library_books (school_id);

-- LIBRARY COPIES
CREATE TABLE IF NOT EXISTS public.library_copies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    book_id UUID REFERENCES public.library_books(id) ON DELETE CASCADE,
    barcode TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'issued', 'lost', 'damaged', 'maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_library_barcode UNIQUE (school_id, barcode)
);
CREATE INDEX IF NOT EXISTS idx_library_copies_school_id ON public.library_copies (school_id);

-- LIBRARY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.library_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    copy_id UUID REFERENCES public.library_copies(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    fine_amount NUMERIC(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_library_transactions_school_id ON public.library_transactions (school_id);

-- HOSTELS
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boys', 'girls', 'combined')),
    capacity INTEGER NOT NULL DEFAULT 50,
    warden_name TEXT,
    warden_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hostels_school_id ON public.hostels (school_id);

-- HOSTEL ROOMS
CREATE TABLE IF NOT EXISTS public.hostel_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 4,
    occupied INTEGER NOT NULL DEFAULT 0,
    monthly_fee NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hostel_room UNIQUE (school_id, hostel_id, room_number)
);
CREATE INDEX IF NOT EXISTS idx_hostel_rooms_school_id ON public.hostel_rooms (school_id);

-- HOSTEL RESIDENTS
CREATE TABLE IF NOT EXISTS public.hostel_residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    room_id UUID REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    bed_number TEXT,
    check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_out_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_hostel_student UNIQUE (school_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_hostel_residents_school_id ON public.hostel_residents (school_id);

-- CMS POSTS (News, Announcements, Blog)
CREATE TABLE IF NOT EXISTS public.cms_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    cover_image_url TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cms_posts_slug UNIQUE (school_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_cms_posts_school_id ON public.cms_posts (school_id);

-- CMS CATEGORIES
CREATE TABLE IF NOT EXISTS public.cms_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cms_categories_slug UNIQUE (school_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_cms_categories_school_id ON public.cms_categories (school_id);

-- GALLERIES
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    event_date DATE,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_galleries_slug UNIQUE (school_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_galleries_school_id ON public.galleries (school_id);

-- GALLERY ITEMS
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_items_school_id ON public.gallery_items (school_id);

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    location TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_school_id ON public.events (school_id);

-- NOTICES & CIRCULARS
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    content TEXT,
    attachment_url TEXT,
    target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'teachers', 'parents')),
    is_important BOOLEAN DEFAULT FALSE,
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expires_at DATE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notices_school_id ON public.notices (school_id);

-- DOCUMENTS & COMPLIANCE (e.g. CBSE SARAS Disclosures)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    is_mandatory_disclosure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_school_id ON public.documents (school_id);

-- ASSETS
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_school_id ON public.assets (school_id);

-- SCHOOL SETTINGS (Key-Value Store per Tenant)
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id VARCHAR(11) NOT NULL REFERENCES public.schools(school_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_school_settings_key UNIQUE (school_id, key)
);
CREATE INDEX IF NOT EXISTS idx_school_settings_school_id ON public.school_settings (school_id);

-- View for backward compatibility if code references school_branding (singular)
CREATE OR REPLACE VIEW public.school_branding AS
SELECT * FROM public.school_brandings;


-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL SCHOOL-OWNED TABLES
-- ------------------------------------------------------------------------------

-- Enable RLS on all newly created tables
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_copies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Helper to apply standard RLS policies to school-owned tables
CREATE OR REPLACE FUNCTION pg_temp.apply_school_rls_policy(tbl_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Service role bypass
    EXECUTE format('DROP POLICY IF EXISTS service_role_bypass ON public.%I', tbl_name);
    EXECUTE format('CREATE POLICY service_role_bypass ON public.%I FOR ALL USING (auth.jwt() ->> ''role'' = ''service_role'')', tbl_name);

    -- Tenant isolation: user must belong to active school_memberships for this row''s school_id
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON public.%I', tbl_name);
    EXECUTE format(
        'CREATE POLICY tenant_isolation_policy ON public.%I FOR ALL USING (' ||
        '  EXISTS (' ||
        '    SELECT 1 FROM public.school_memberships sm ' ||
        '    WHERE sm.user_id = auth.uid() ' ||
        '      AND sm.school_id = %I.school_id ' ||
        '      AND sm.is_active = true' ||
        '  )' ||
        ')',
        tbl_name, tbl_name
    );
END;
$$ LANGUAGE plpgsql;

-- Apply RLS policies across all school-owned tables
SELECT pg_temp.apply_school_rls_policy('school_profiles');
SELECT pg_temp.apply_school_rls_policy('school_campuses');
SELECT pg_temp.apply_school_rls_policy('facility_campuses');
SELECT pg_temp.apply_school_rls_policy('school_brandings');
SELECT pg_temp.apply_school_rls_policy('school_localizations');
SELECT pg_temp.apply_school_rls_policy('school_academic_settings');
SELECT pg_temp.apply_school_rls_policy('academic_sessions');
SELECT pg_temp.apply_school_rls_policy('academic_classes');
SELECT pg_temp.apply_school_rls_policy('sections');
SELECT pg_temp.apply_school_rls_policy('subjects');
SELECT pg_temp.apply_school_rls_policy('departments');
SELECT pg_temp.apply_school_rls_policy('designations');
SELECT pg_temp.apply_school_rls_policy('staff');
SELECT pg_temp.apply_school_rls_policy('school_admission_settings');
SELECT pg_temp.apply_school_rls_policy('school_fee_settings');
SELECT pg_temp.apply_school_rls_policy('school_attendance_settings');
SELECT pg_temp.apply_school_rls_policy('school_exam_settings');
SELECT pg_temp.apply_school_rls_policy('school_transport_settings');
SELECT pg_temp.apply_school_rls_policy('school_library_settings');
SELECT pg_temp.apply_school_rls_policy('school_hostel_settings');
SELECT pg_temp.apply_school_rls_policy('school_communication_settings');
SELECT pg_temp.apply_school_rls_policy('school_website_settings');
SELECT pg_temp.apply_school_rls_policy('school_integrations');
SELECT pg_temp.apply_school_rls_policy('school_migration_requests');
SELECT pg_temp.apply_school_rls_policy('school_onboarding_assets');
SELECT pg_temp.apply_school_rls_policy('school_onboarding_submissions');
SELECT pg_temp.apply_school_rls_policy('school_onboarding_activity');
SELECT pg_temp.apply_school_rls_policy('school_module_subscriptions');
SELECT pg_temp.apply_school_rls_policy('school_module_configs');
SELECT pg_temp.apply_school_rls_policy('students');
SELECT pg_temp.apply_school_rls_policy('guardians');
SELECT pg_temp.apply_school_rls_policy('attendance');
SELECT pg_temp.apply_school_rls_policy('fee_categories');
SELECT pg_temp.apply_school_rls_policy('fee_structures');
SELECT pg_temp.apply_school_rls_policy('fees');
SELECT pg_temp.apply_school_rls_policy('invoices');
SELECT pg_temp.apply_school_rls_policy('payments');
SELECT pg_temp.apply_school_rls_policy('admissions');
SELECT pg_temp.apply_school_rls_policy('applications');
SELECT pg_temp.apply_school_rls_policy('transport_vehicles');
SELECT pg_temp.apply_school_rls_policy('transport_routes');
SELECT pg_temp.apply_school_rls_policy('transport_stops');
SELECT pg_temp.apply_school_rls_policy('transport_assignments');
SELECT pg_temp.apply_school_rls_policy('library_books');
SELECT pg_temp.apply_school_rls_policy('library_copies');
SELECT pg_temp.apply_school_rls_policy('library_transactions');
SELECT pg_temp.apply_school_rls_policy('hostels');
SELECT pg_temp.apply_school_rls_policy('hostel_rooms');
SELECT pg_temp.apply_school_rls_policy('hostel_residents');
SELECT pg_temp.apply_school_rls_policy('cms_posts');
SELECT pg_temp.apply_school_rls_policy('cms_categories');
SELECT pg_temp.apply_school_rls_policy('galleries');
SELECT pg_temp.apply_school_rls_policy('gallery_items');
SELECT pg_temp.apply_school_rls_policy('events');
SELECT pg_temp.apply_school_rls_policy('notices');
SELECT pg_temp.apply_school_rls_policy('documents');
SELECT pg_temp.apply_school_rls_policy('assets');
SELECT pg_temp.apply_school_rls_policy('school_settings');

-- Public Read Policies for Public-Facing Content
CREATE POLICY public_read_active_schools ON public.schools 
    FOR SELECT USING (status = 'active');

CREATE POLICY public_read_school_profiles ON public.school_profiles 
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.schools s WHERE s.school_id = school_profiles.school_id AND s.status = 'active')
    );

CREATE POLICY public_read_cms_pages ON public.cms_pages 
    FOR SELECT USING (status = 'published');

CREATE POLICY public_read_cms_posts ON public.cms_posts 
    FOR SELECT USING (status = 'published');

CREATE POLICY public_read_notices ON public.notices 
    FOR SELECT USING (status = 'active' AND (expires_at IS NULL OR expires_at >= CURRENT_DATE));

CREATE POLICY public_read_events ON public.events 
    FOR SELECT USING (is_public = true);

CREATE POLICY public_read_galleries ON public.galleries 
    FOR SELECT USING (status = 'published');

CREATE POLICY public_read_documents ON public.documents 
    FOR SELECT USING (is_mandatory_disclosure = true);

CREATE POLICY service_role_all_memberships ON public.school_memberships 
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY users_view_own_memberships ON public.school_memberships 
    FOR SELECT USING (user_id = auth.uid());
