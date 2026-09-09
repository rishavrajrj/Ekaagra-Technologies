-- ==============================================================================
-- Ekaagra Technologies - Complete School Master Onboarding & Multi-Tenant Schema
-- Migration: 20260907_complete_school_master_onboarding_system.sql
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. MASTER TENANT ROOT: public.schools
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_name TEXT,
    display_name TEXT,
    slug TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    udise_code TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all expected columns exist on schools
ALTER TABLE public.schools
    ADD COLUMN IF NOT EXISTS legal_name TEXT,
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS udise_code TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools (slug);
CREATE INDEX IF NOT EXISTS idx_schools_code ON public.schools (code);
CREATE INDEX IF NOT EXISTS idx_schools_udise ON public.schools (udise_code);

-- ------------------------------------------------------------------------------
-- 2. SCHOOL PROFILES (Permanent Institutional Identity)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    legal_name TEXT,
    display_name TEXT,
    affiliation_number TEXT,
    udise_code TEXT,
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

ALTER TABLE public.school_profiles
    ADD COLUMN IF NOT EXISTS legal_name TEXT,
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS affiliation_number TEXT,
    ADD COLUMN IF NOT EXISTS udise_code TEXT,
    ADD COLUMN IF NOT EXISTS tax_identifier TEXT,
    ADD COLUMN IF NOT EXISTS registration_number TEXT,
    ADD COLUMN IF NOT EXISTS accreditation_body TEXT,
    ADD COLUMN IF NOT EXISTS primary_email TEXT,
    ADD COLUMN IF NOT EXISTS secondary_email TEXT,
    ADD COLUMN IF NOT EXISTS primary_phone TEXT,
    ADD COLUMN IF NOT EXISTS secondary_phone TEXT,
    ADD COLUMN IF NOT EXISTS website_url TEXT,
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state_province TEXT,
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS postal_code TEXT,
    ADD COLUMN IF NOT EXISTS principal_staff_id UUID,
    ADD COLUMN IF NOT EXISTS established_year INTEGER,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_school_profiles_school_id ON public.school_profiles (school_id);
CREATE INDEX IF NOT EXISTS idx_school_profiles_udise ON public.school_profiles (udise_code);

-- ------------------------------------------------------------------------------
-- 3. SCHOOL CAMPUSES / BRANCHES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_campuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state_province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'India',
    contact_phone TEXT,
    contact_email TEXT,
    coordinator_name TEXT,
    operating_hours TEXT,
    facilities TEXT[] DEFAULT '{}',
    is_main_campus BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_campuses_school_id ON public.school_campuses (school_id);

-- ------------------------------------------------------------------------------
-- 4. SCHOOL BRANDING & VISUAL IDENTITY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_brandings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    logo_storage_path TEXT,
    crest_storage_path TEXT,
    favicon_storage_path TEXT,
    header_logo_storage_path TEXT,
    footer_logo_storage_path TEXT,
    primary_color TEXT DEFAULT '#1E40AF',
    secondary_color TEXT DEFAULT '#3B82F6',
    accent_color TEXT DEFAULT '#F59E0B',
    font_family TEXT DEFAULT 'Inter',
    motto TEXT,
    tagline TEXT,
    vision TEXT,
    mission TEXT,
    core_values TEXT[] DEFAULT '{}',
    brand_tone TEXT DEFAULT 'Modern',
    preferred_website_style TEXT DEFAULT 'Modern',
    report_header_text TEXT,
    report_footer_text TEXT,
    is_publicly_visible BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_brandings_school_id ON public.school_brandings (school_id);

-- ------------------------------------------------------------------------------
-- 5. ACADEMIC SETTINGS & SESSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_academic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    current_session_name TEXT NOT NULL DEFAULT '2026-2027',
    session_start_date DATE,
    session_end_date DATE,
    classes_from TEXT,
    classes_to TEXT,
    streams TEXT[] DEFAULT '{}',
    departments TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_academic_settings_school_id ON public.school_academic_settings (school_id);

-- ------------------------------------------------------------------------------
-- 6. ADMISSION SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_admission_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    admissions_open BOOLEAN DEFAULT TRUE,
    target_session TEXT,
    classes_open TEXT[] DEFAULT '{}',
    eligibility_criteria TEXT,
    min_age_criteria TEXT,
    application_fee NUMERIC(10, 2) DEFAULT 0,
    admission_fee NUMERIC(10, 2) DEFAULT 0,
    registration_fee NUMERIC(10, 2) DEFAULT 0,
    incharge_name TEXT,
    incharge_phone TEXT,
    incharge_email TEXT,
    enquiry_tracking_enabled BOOLEAN DEFAULT TRUE,
    online_application_enabled BOOLEAN DEFAULT TRUE,
    document_upload_enabled BOOLEAN DEFAULT TRUE,
    workflow_stages TEXT[] DEFAULT ARRAY['Enquiry', 'Application', 'Document Verification', 'Approved', 'Enrollment'],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_admission_settings_school_id ON public.school_admission_settings (school_id);

-- ------------------------------------------------------------------------------
-- 7. FEE SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_fee_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    fee_categories TEXT[] DEFAULT ARRAY['Tuition Fee', 'Admission Fee', 'Annual Fee', 'Exam Fee', 'Computer Fee'],
    billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('monthly', 'quarterly', 'half_yearly', 'annually', 'custom')),
    due_date_day INTEGER DEFAULT 10,
    grace_period_days INTEGER DEFAULT 5,
    late_fee_type TEXT DEFAULT 'fixed' CHECK (late_fee_type IN ('fixed', 'percentage', 'none')),
    late_fee_amount NUMERIC(10, 2) DEFAULT 10,
    online_payment_enabled BOOLEAN DEFAULT TRUE,
    preferred_gateway TEXT DEFAULT 'razorpay',
    automated_receipts BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_fee_settings_school_id ON public.school_fee_settings (school_id);

-- ------------------------------------------------------------------------------
-- 8. ATTENDANCE & SCHEDULE SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_attendance_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    student_attendance_mode TEXT DEFAULT 'daily' CHECK (student_attendance_mode IN ('daily', 'period_wise', 'web', 'mobile', 'biometric', 'rfid', 'other')),
    staff_attendance_mode TEXT DEFAULT 'biometric' CHECK (staff_attendance_mode IN ('biometric', 'web', 'mobile', 'rfid', 'manual', 'other')),
    working_days INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6],
    school_start_time TEXT DEFAULT '08:00 AM',
    school_end_time TEXT DEFAULT '02:00 PM',
    assembly_time TEXT DEFAULT '08:00 AM',
    lunch_time TEXT DEFAULT '11:30 AM',
    period_count INTEGER DEFAULT 8,
    period_duration_minutes INTEGER DEFAULT 40,
    break_duration_minutes INTEGER DEFAULT 15,
    parent_absence_alert_channel TEXT DEFAULT 'whatsapp' CHECK (parent_absence_alert_channel IN ('whatsapp', 'sms', 'email', 'app', 'none')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_attendance_settings_school_id ON public.school_attendance_settings (school_id);

-- ------------------------------------------------------------------------------
-- 9. EXAM SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_exam_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    exam_terms TEXT[] DEFAULT ARRAY['Term 1', 'Term 2'],
    grading_system TEXT DEFAULT 'cbse_9point' CHECK (grading_system IN ('cbse_9point', 'percentage', 'letter_grade', 'gpa', 'custom')),
    has_internal_assessment BOOLEAN DEFAULT TRUE,
    has_practical_marks BOOLEAN DEFAULT TRUE,
    report_card_layout TEXT DEFAULT 'cbse_standard',
    parent_portal_visibility BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_exam_settings_school_id ON public.school_exam_settings (school_id);

-- ------------------------------------------------------------------------------
-- 10. TRANSPORT SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_transport_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    transport_enabled BOOLEAN DEFAULT FALSE,
    fleet_count INTEGER DEFAULT 0,
    gps_tracking_required BOOLEAN DEFAULT FALSE,
    parent_tracking_enabled BOOLEAN DEFAULT FALSE,
    route_management_required BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_transport_settings_school_id ON public.school_transport_settings (school_id);

-- ------------------------------------------------------------------------------
-- 11. LIBRARY SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_library_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    library_enabled BOOLEAN DEFAULT FALSE,
    estimated_book_count INTEGER DEFAULT 0,
    barcode_system_enabled BOOLEAN DEFAULT FALSE,
    rfid_system_enabled BOOLEAN DEFAULT FALSE,
    student_borrow_limit INTEGER DEFAULT 2,
    staff_borrow_limit INTEGER DEFAULT 5,
    fine_per_day NUMERIC(10, 2) DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_library_settings_school_id ON public.school_library_settings (school_id);

-- ------------------------------------------------------------------------------
-- 12. HOSTEL SETTINGS (Conditional on Residential = Yes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_hostel_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    hostel_enabled BOOLEAN DEFAULT FALSE,
    boys_hostel_count INTEGER DEFAULT 0,
    girls_hostel_count INTEGER DEFAULT 0,
    total_capacity INTEGER DEFAULT 0,
    mess_included BOOLEAN DEFAULT TRUE,
    attendance_tracking_enabled BOOLEAN DEFAULT TRUE,
    visitor_management_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_hostel_settings_school_id ON public.school_hostel_settings (school_id);

-- ------------------------------------------------------------------------------
-- 13. COMMUNICATION SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_communication_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    email_alerts_enabled BOOLEAN DEFAULT TRUE,
    push_notifications_enabled BOOLEAN DEFAULT TRUE,
    parent_announcements BOOLEAN DEFAULT TRUE,
    teacher_announcements BOOLEAN DEFAULT TRUE,
    emergency_broadcasts BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_communication_settings_school_id ON public.school_communication_settings (school_id);

-- ------------------------------------------------------------------------------
-- 14. WEBSITE & CMS SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_website_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    website_goal TEXT DEFAULT 'Complete digital platform',
    primary_domain TEXT,
    requires_new_domain BOOLEAN DEFAULT FALSE,
    dns_access_available BOOLEAN DEFAULT FALSE,
    email_suite_preference TEXT DEFAULT 'google_workspace',
    cms_roles TEXT[] DEFAULT ARRAY['Super Admin', 'Principal', 'Content Manager', 'Office Admin'],
    publishing_workflow TEXT DEFAULT 'two_step_approval',
    languages_supported TEXT[] DEFAULT ARRAY['English', 'Hindi'],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_website_settings_school_id ON public.school_website_settings (school_id);

-- ------------------------------------------------------------------------------
-- 15. THIRD-PARTY INTEGRATIONS (SELECTION ONLY - NO SECRETS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL UNIQUE REFERENCES public.schools(id) ON DELETE CASCADE,
    payment_gateway TEXT DEFAULT 'razorpay',
    sms_gateway TEXT DEFAULT 'msg91',
    whatsapp_provider TEXT DEFAULT 'meta_cloud_api',
    email_service TEXT DEFAULT 'google_workspace',
    biometric_hardware_sync BOOLEAN DEFAULT TRUE,
    gps_tracking_integration BOOLEAN DEFAULT FALSE,
    accounting_software TEXT DEFAULT 'tally',
    digilocker_integration BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_integrations_school_id ON public.school_integrations (school_id);

-- ------------------------------------------------------------------------------
-- 16. DATA MIGRATION REQUESTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_migration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    current_system_type TEXT DEFAULT 'excel_spreadsheets',
    software_name TEXT,
    migrate_students BOOLEAN DEFAULT TRUE,
    migrate_staff BOOLEAN DEFAULT FALSE,
    migrate_fees BOOLEAN DEFAULT FALSE,
    migrate_attendance BOOLEAN DEFAULT FALSE,
    migrate_exams BOOLEAN DEFAULT FALSE,
    migrate_library BOOLEAN DEFAULT FALSE,
    migrate_transport BOOLEAN DEFAULT FALSE,
    estimated_student_count INTEGER DEFAULT 0,
    estimated_staff_count INTEGER DEFAULT 0,
    readiness_status TEXT DEFAULT 'needs_formatting_help',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_migration_requests_school_id ON public.school_migration_requests (school_id);

-- ------------------------------------------------------------------------------
-- 17. ONBOARDING ASSETS (SECURE FILE MANAGEMENT)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_onboarding_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    uploaded_by TEXT,
    status TEXT DEFAULT 'provided' CHECK (status IN ('pending', 'provided', 'verified', 'rejected', 'not_applicable')),
    verification_notes TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_assets_school_id ON public.school_onboarding_assets (school_id);

-- ------------------------------------------------------------------------------
-- 18. IMMUTABLE SUBMISSION SNAPSHOTS (VERSIONING)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_onboarding_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    school_project_id UUID,
    version_number INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    submitted_by_name TEXT NOT NULL,
    submitted_by_email TEXT NOT NULL,
    submitted_by_phone TEXT,
    change_summary TEXT,
    intake_payload JSONB NOT NULL,
    custom_fields_data JSONB DEFAULT '{}'::jsonb,
    completeness_percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'resubmitted', 'approved')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_submissions_school_id ON public.school_onboarding_submissions (school_id);
CREATE INDEX IF NOT EXISTS idx_school_onboarding_submissions_version ON public.school_onboarding_submissions (school_id, version_number);

-- ------------------------------------------------------------------------------
-- 19. AUDIT ACTIVITY LOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_onboarding_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    actor_email TEXT,
    previous_status TEXT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_activity_school_id ON public.school_onboarding_activity (school_id);

-- ------------------------------------------------------------------------------
-- 20. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_brandings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_academic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_admission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_fee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_exam_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_transport_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_hostel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_communication_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_migration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_onboarding_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_onboarding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_onboarding_activity ENABLE ROW LEVEL SECURITY;

-- Service Role / Admin Bypass (Allows full management by backend server)
DO $$
BEGIN
    -- Only create service role policies if not present
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_schools') THEN
        CREATE POLICY service_role_all_schools ON public.schools FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_profiles') THEN
        CREATE POLICY service_role_all_profiles ON public.school_profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$;
