# DATABASE ARCHITECTURE & ENTITY MAP
**System**: Ekaagra Technologies Platform  
**Engine**: PostgreSQL via Supabase  
**Pattern**: Dual-Database Decoupled Multi-Tenant Architecture  
**Last Verified**: September 2026

---

## 1. Dual-Database Architectural Strategy

The platform maintains strict separation of concerns across two distinct database environments:
1. **Database A (Agency CRM & Business Projects)**: Configured via `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Houses inbound sales leads, client CRM records, Razorpay financial transactions, and bespoke commercial projects.
2. **Database B (Schools Multi-Tenant Platform)**: Configured via `SCHOOLS_SUPABASE_URL` and `SCHOOLS_SUPABASE_SERVICE_ROLE_KEY`. Houses institutional onboarding, intake submissions, compliance documents, student/staff master rosters, and provisioned multi-campus school tenants.

*Fallback Resilience*: If `SCHOOLS_SUPABASE_URL` is omitted, the system can operate in unified mode where both schemas reside within Database A.

---

## 2. Database A: Lead CRM & Business Projects Schema

### 2.1 Table: `leads`
- **Purpose**: Stores all inbound inquiries from contact forms, website quote builders, and direct WhatsApp links.
- **Columns**:
  - `id` (UUID, Primary Key, `gen_random_uuid()`)
  - `created_at` (TIMESTAMPTZ, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, Default: `now()`)
  - `source` (TEXT, e.g. `'CONTACT_FORM'`, `'QUOTE_FORM'`, `'WHATSAPP'`)
  - `type` (TEXT, e.g. `'CONTACT'`, `'QUOTE'`, `'WHATSAPP'`)
  - `status` (TEXT, e.g. `'NEW'`, `'CONTACTED'`, `'QUALIFIED'`, `'PROPOSAL_SENT'`, `'CONVERTED'`, `'LOST'`, `'PROJECT_CONFIRMED'`)
  - `lead_domain` (TEXT, `'BUSINESS'` | `'SCHOOL'`, Default: `'BUSINESS'`)
  - `name` (TEXT, Client representative full name)
  - `organization` (TEXT, Business company or School name)
  - `phone` (TEXT, Validated 10+ digit contact number)
  - `email` (TEXT, Contact email address)
  - `service` (TEXT, Requested service category)
  - `project_type` (TEXT, Specific plan name or product label)
  - `budget` (TEXT, Estimated or selected budget range)
  - `timeline` (TEXT, Desired project delivery timeline)
  - `expected_users` (TEXT, Approximate user count or student tier)
  - `features` (TEXT, Comma-separated list of selected addons)
  - `description` (TEXT, Detailed requirements message)
  - `preferred_contact` (TEXT, `'Phone'`, `'Email'`, `'WhatsApp'`)
  - `notes` (TEXT, Internal staff CRM notes)
  - `commercial_product_id` (TEXT, Foreign key reference to commercial product tier)
  - `school_project_reference` (TEXT, Project code, e.g. `'SCH-2026-0001'`)
  - `handoff_status` (TEXT, `'PENDING'`, `'HANDOFF_COMPLETED'`)
  - `handoff_at` (TIMESTAMPTZ)
- **Relationships**:
  - `leads.id` -> referenced by `orders.lead_id`
  - `leads.id` -> referenced by `projects.lead_id`

### 2.2 Table: `orders`
- **Purpose**: Official commercial ledger for Razorpay checkout orders and payments.
- **Columns**:
  - `id` (UUID, Primary Key, `gen_random_uuid()`)
  - `lead_id` (UUID, Foreign Key -> `leads.id`, Nullable)
  - `project_id` (UUID, Foreign Key -> `projects.id`, Nullable)
  - `project_number` (TEXT, e.g. `'BUS-2026-0012'` or `'SCH-2026-0001'`)
  - `domain` (TEXT, `'BUSINESS'` | `'SCHOOL'`)
  - `order_number` (TEXT, Unique, Indexed, e.g. `'EKA-2026-0001'`)
  - `customer_name` (TEXT)
  - `customer_email` (TEXT)
  - `customer_phone` (TEXT)
  - `service_type` (TEXT)
  - `plan_id` (TEXT, e.g. `'growth'`, `'standard'`, `'school-website'`)
  - `amount_inr` (NUMERIC(12,2), Authoritative invoice amount in INR)
  - `payment_status` (TEXT, `'PENDING'`, `'PAID'`, `'FAILED'`, `'REFUNDED'`)
  - `gateway_name` (TEXT, Default: `'RAZORPAY'`)
  - `gateway_order_id` (TEXT, Unique Razorpay Order ID, e.g. `'order_Px123456789'`)
  - `gateway_payment_id` (TEXT, Razorpay Payment ID upon capture)
  - `gateway_signature` (TEXT, Verified HMAC SHA256 signature)
  - `metadata` (JSONB, Breakdown of plan price, addons, domain upgrade)
  - `paid_at` (TIMESTAMPTZ)
  - `created_at` (TIMESTAMPTZ, Default: `now()`)
  - `updated_at` (TIMESTAMPTZ, Default: `now()`)
- **Relationships**:
  - `orders.id` -> referenced by `payment_events.order_id`

### 2.3 Table: `payment_events`
- **Purpose**: Immutable audit log of all payment gateway webhook events and transitions.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `order_id` (UUID, Foreign Key -> `orders.id`)
  - `event_type` (TEXT, e.g. `'payment.captured'`, `'payment.failed'`)
  - `gateway_event_id` (TEXT)
  - `gateway_payment_id` (TEXT)
  - `payload` (JSONB, Raw webhook event payload)
  - `created_at` (TIMESTAMPTZ)

### 2.4 Table: `projects` (Business Projects)
- **Purpose**: Operational workspace for corporate client delivery (Websites, Portals, SaaS).
- **Columns**:
  - `id` (UUID, Primary Key)
  - `lead_id` (UUID, Foreign Key -> `leads.id`, Nullable)
  - `client_id` (UUID, Foreign Key -> `clients.id`, Nullable)
  - `project_number` (TEXT, Unique, e.g. `'BUS-2026-0042'`)
  - `project_name` (TEXT)
  - `service_type` (TEXT)
  - `project_status` (TEXT, `'DRAFT'`, `'REQUIREMENTS_PENDING'`, `'IN_DEVELOPMENT'`, `'PAID'`, `'COMPLETED'`)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

---

## 3. Database B: Schools Platform Schema

### 3.1 Table: `school_projects`
- **Purpose**: Master state machine for institutional onboarding.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `project_number` (TEXT, Unique, e.g. `'SCH-2026-0001'`)
  - `school_name` (TEXT)
  - `product_id` (TEXT, `'school-website'` | `'school-website-cms'` | `'school-erp'` | `'school-complete'`)
  - `status` (TEXT, `'onboarding_invited'`, `'intake_in_progress'`, `'intake_submitted'`, `'under_review'`, `'approved'`, `'provisioned'`)
  - `media_status` (TEXT, `'not_started'`, `'partially_uploaded'`, `'verified'`)
  - `completeness_percentage` (INTEGER, 0 to 100)
  - `primary_contact_name` (TEXT)
  - `primary_contact_email` (TEXT)
  - `primary_contact_phone` (TEXT)
  - `primary_contact_designation` (TEXT)
  - `city` (TEXT)
  - `state` (TEXT)
  - `commercial_summary` (JSONB)
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

### 3.2 Table: `school_onboarding_invitations`
- **Purpose**: Cryptographic authentication tokens for school principal / coordinator onboarding sessions.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `school_project_id` (UUID, Foreign Key -> `school_projects.id`)
  - `invitation_code` (TEXT, Indexed, e.g. `'ONB-2026-0001'`)
  - `token_hash` (TEXT, Indexed, SHA-256 hash of secret token)
  - `recipient_name` (TEXT)
  - `recipient_email` (TEXT)
  - `recipient_role` (TEXT)
  - `expires_at` (TIMESTAMPTZ, Default: 30 days)
  - `is_revoked` (BOOLEAN, Default: `false`)
  - `created_at` (TIMESTAMPTZ)

### 3.3 Table: `school_intake_submissions`
- **Purpose**: Centralized storage of the 32-section universal intake payload.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `school_project_id` (UUID, Foreign Key -> `school_projects.id`)
  - `intake_payload` (JSONB, Type: `UniversalIntakeData`)
  - `completeness_score` (INTEGER)
  - `is_current` (BOOLEAN, Default: `true`)
  - `submitted_at` (TIMESTAMPTZ, Nullable until finalized)
  - `submitted_by_name` (TEXT)
  - `submitted_by_email` (TEXT)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

### 3.4 Table: `school_approved_snapshots`
- **Purpose**: Immutable frozen snapshots of verified institutional websites before deployment.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `school_project_id` (UUID, Foreign Key -> `school_projects.id`)
  - `version_number` (INTEGER)
  - `specification_hash` (TEXT, SHA-256 fingerprint)
  - `specification_snapshot` (JSONB, Type: `WebsiteSpecificationSnapshot`)
  - `publication_payload` (JSONB, Normalized `SchoolWebsiteData` ready for rendering)
  - `approved_by_name` (TEXT)
  - `approved_by_role` (TEXT)
  - `approved_at` (TIMESTAMPTZ)
  - `status` (TEXT, `'approved'`, `'superseded'`)

### 3.5 Table: `schools` (Multi-Tenant Production Entities)
- **Purpose**: Active institutional tenants deployed on the Ekaagra platform.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `school_id` (TEXT, Canonical 11-digit UDISE code, e.g. `'10020100101'`)
  - `school_code` (TEXT, Human code, e.g. `'RPS-MOT'`)
  - `name` (TEXT, Full school name)
  - `display_name` (TEXT)
  - `legal_name` (TEXT, Trust or Society name)
  - `slug` (TEXT, Unique URL slug, e.g. `'roshani-public-school'`)
  - `status` (TEXT, `'active'`, `'suspended'`)
  - `created_at` (TIMESTAMPTZ)
  - `updated_at` (TIMESTAMPTZ)

### 3.6 Table: `campuses`
- **Purpose**: Individual physical school branches and campuses under a school tenant.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `school_id` (TEXT, Foreign Key -> `schools.school_id` or `schools.id`)
  - `name` (TEXT, e.g. `'Main Campus'`, `'Junior Wing'`)
  - `is_main_campus` (BOOLEAN)
  - `address` (TEXT)
  - `city` (TEXT)
  - `state` (TEXT)
  - `postal_code` (TEXT)
  - `latitude` (NUMERIC(10,7))
  - `longitude` (NUMERIC(10,7))
  - `google_maps_url` (TEXT)
  - `facilities` (JSONB, Array of available facility keys)
  - `academic_levels` (JSONB, e.g. `["Pre-Primary", "Primary", "Secondary"]`)
  - `class_range` (TEXT, e.g. `'Playgroup to Class 10'`)

### 3.7 Table: `students` & `staff`
- **Purpose**: Provisioned master records for pupils and educators.
- **Key Columns**:
  - `id` (UUID, Primary Key)
  - `school_id` (TEXT)
  - `campus_id` (UUID)
  - `admission_number` / `employee_code` (TEXT, Unique per school)
  - `first_name`, `last_name` (TEXT)
  - `class_name`, `section_name` (TEXT for students)
  - `designation`, `department` (TEXT for staff)
  - `photo_url` (TEXT)
  - `custom_fields` (JSONB, Dynamic key-value pairs matching custom definitions)

### 3.8 Table: `school_transport_live_locations`
- **Purpose**: Real-time vehicle GPS coordinates stream.
- **Columns**:
  - `id` (UUID, Primary Key)
  - `bus_id` (TEXT, Vehicle registration or internal bus identifier)
  - `school_id` (TEXT, Foreign Key -> `schools.school_id`)
  - `trip_id` (TEXT)
  - `latitude` (DOUBLE PRECISION)
  - `longitude` (DOUBLE PRECISION)
  - `speed` (NUMERIC(6,2))
  - `heading` (NUMERIC(6,2))
  - `recorded_at` (TIMESTAMPTZ, Default: `now()`)

---

## 4. Entity Relationships Diagram (Text Form)

```
[leads] ───(1:N)───> [orders] ───(1:N)───> [payment_events]
   │
   ├──(1:1)───> [projects] ───(1:N)───> [business_requirements]
   │                               └───(1:N)───> [design_reviews]
   │
   └──(Handoff: 1:1)───> [school_projects]
                               │
                               ├──(1:N)───> [school_onboarding_invitations]
                               ├──(1:N)───> [school_intake_submissions] (JSONB payload)
                               ├──(1:N)───> [school_approved_snapshots]
                               │
                               └──(Platform Handoff: 1:1)
                                       │
                                       ▼
                                   [schools]
                                       │
                                       ├──(1:N)───> [campuses]
                                       ├──(1:N)───> [students]
                                       ├──(1:N)───> [staff]
                                       └──(1:N)───> [school_transport_live_locations]
```
