# API & SERVER ACTIONS INVENTORY
**System**: Ekaagra Technologies Platform  
**Architecture**: Next.js 16.3.0 App Router (Route Handlers & Server Actions)  
**Last Verified**: September 2026

---

## 1. HTTP API Route Handlers (`src/app/api/*`)

### 1.1 `/api/payments/create-order`
- **Method**: `POST`
- **File**: `src/app/api/payments/create-order/route.ts`
- **Purpose**: Authoritative server-side price calculation and creation of Razorpay order with strict zero-client-trust.
- **Used By**: `/pay/[orderNumber]`, `QuoteForm.tsx`, `WebsiteQuoteBuilder.tsx`, `PayOrderClient.tsx`.
- **Inputs**: `CreateOrderRequest` (JSON)
  - `customerName` (string, required)
  - `customerEmail` (string, required)
  - `customerPhone` (string, required, >= 10 digits)
  - `serviceType` (string)
  - `planId` (string)
  - `domainChoice` ('INCLUDED' | 'CUSTOM' | 'EXISTING')
  - `selectedPages` (string[])
  - `customAmount` (optional number for custom invoices)
- **Outputs**:
  - `200 OK`: `{ success: true, orderId: string, orderNumber: string, gatewayOrderId: string, amountInPaise: number, amountINR: number, currency: "INR", keyId: string }`
  - `400 Bad Request`: `{ success: false, error: string }`
  - `503 Service Unavailable`: `{ success: false, error: string, isConfigError: true }`
- **Dependencies**: `razorpay` (server client), `pricingEngine.ts`, `supabase.ts`.
- **Database Access**: Writes new row to `orders` table (Database A).

---

### 1.2 `/api/payments/verify`
- **Method**: `POST`
- **File**: `src/app/api/payments/verify/route.ts`
- **Purpose**: Cryptographic verification of Razorpay payment signature (HMAC SHA256) and atomic status progression.
- **Used By**: Checkout frontend after Razorpay modal completes (`PayOrderClient.tsx`).
- **Inputs**: JSON payload
  - `orderNumber` (string, required)
  - `razorpay_order_id` (string, required)
  - `razorpay_payment_id` (string, required)
  - `razorpay_signature` (string, required)
- **Outputs**:
  - `200 OK`: `{ success: true, message: "Payment verified successfully", order: Order }`
  - `400 Bad Request`: `{ success: false, error: "Invalid payment signature" }`
- **Dependencies**: `crypto` (HMAC SHA256 with `RAZORPAY_KEY_SECRET`), `supabase.ts`.
- **Database Access**: Updates `orders` table (`payment_status = 'PAID'`), updates `leads` (`status = 'CONVERTED'`), updates `projects` (`project_status = 'PAID'`), inserts into `project_activity` (Database A).

---

### 1.3 `/api/payments/webhook`
- **Method**: `POST`
- **File**: `src/app/api/payments/webhook/route.ts`
- **Purpose**: Asynchronous Razorpay webhook ingestion for background reconciliation, capture events, and refund notices.
- **Used By**: External Razorpay Webhook Infrastructure.
- **Inputs**: Raw HTTP request body with header `x-razorpay-signature`.
- **Outputs**: `200 OK`: `{ status: "ok" }`.
- **Dependencies**: `crypto`, `supabase.ts`.
- **Database Access**: Idempotently marks orders as `PAID`, inserts into `payment_events` table (Database A).

---

### 1.4 `/api/school-assets/upload`
- **Method**: `POST`
- **File**: `src/app/api/school-assets/upload/route.ts`
- **Purpose**: Authoritative upload endpoint for school intake photos, campus infrastructure, and compliance certificates.
- **Used By**: `SchoolOnboardingPortal.tsx`, `SchoolAssetChecklistSection.tsx`, `CampusImagesSection.tsx`, `PersonPhotoSection.tsx`.
- **Inputs**: `FormData`
  - `token` (string, onboarding invitation token, required)
  - `file` (binary File, max 15MB)
  - `itemId` (canonical checklist asset key, e.g. `cert-affiliation`, `photo-principal`)
  - `itemType` ('image' | 'document' | 'gallery')
  - `campusId` (optional UUID)
  - `personId` (optional UUID)
- **Outputs**:
  - `200 OK`: `{ success: true, asset: CanonicalAssetResult }`
  - `401 / 403`: `{ success: false, error: "Unauthorized / Expired token" }`
  - `400 Bad Request`: `{ success: false, error: "Validation or malware block error" }`
- **Dependencies**: `sharp` (WebP conversion), `schoolHandoff.ts`, `imageUploadService.ts`, `schoolAssetChecklist.ts`.
- **Database Access**: Validates token against `school_onboarding_invitations` (Database B). Stores in Supabase Storage (`school-assets` or `school-assets-private`) or local filesystem fallback (`private/uploads/school-assets`).

---

### 1.5 `/api/school-assets/download`
- **Method**: `GET`
- **File**: `src/app/api/school-assets/download/route.ts`
- **Purpose**: Authorized streaming download of sensitive statutory school documents (NOC, Trust Deed, Fire Safety Certificate).
- **Used By**: `SchoolAssetChecklistSection.tsx`, `UniversalVerificationPage.tsx`.
- **Inputs**: Query parameters: `?token=<onboarding_token>&key=<storage_key>`.
- **Outputs**: Binary stream with `Content-Type: application/pdf` or `image/webp`.
- **Dependencies**: `schoolHandoff.ts`, `schoolsDb.ts`, `supabase.ts`.
- **Database Access**: Validates session against `school_onboarding_invitations` (Database B) before streaming.

---

### 1.6 `/api/school-assets/delete`
- **Method**: `DELETE` / `POST`
- **File**: `src/app/api/school-assets/delete/route.ts`
- **Purpose**: Deletes uploaded asset file and removes references from current intake payload.
- **Used By**: `SchoolAssetChecklistSection.tsx`, `CampusImagesSection.tsx`.
- **Inputs**: JSON payload: `{ token: string, storageKey: string, assetId?: string }`.
- **Outputs**: `{ success: true, message: "Asset deleted" }`.
- **Dependencies**: `schoolsDb.ts`, `schoolHandoff.ts`.
- **Database Access**: Updates `school_intake_submissions` intake payload (Database B).

---

### 1.7 `/api/school-assets/staff-photo` & `/api/school-assets/student-photo`
- **Method**: `POST`
- **Files**: `src/app/api/school-assets/staff-photo/route.ts` & `src/app/api/school-assets/student-photo/route.ts`
- **Purpose**: Dedicated endpoints for optimized staff faculty headshots and student ID card photographs with size/dimension constraints.
- **Used By**: `StaffFacultySection.tsx`, `StudentInformationSection.tsx`, `StaffBulkPhotoModal.tsx`.
- **Inputs**: `FormData` with `token`, `file`, and identifier (`employeeCode` or `admissionNumber`).
- **Outputs**: `{ success: true, photoUrl: string, assetId: string }`.
- **Dependencies**: `sharp`, `staffPhotoOptimizer.ts`, `studentPhotoOptimizer.ts`.
- **Database Access**: Updates staff/student records in `school_intake_submissions` (Database B).

---

### 1.8 `/api/school-media/template`
- **Method**: `GET`
- **File**: `src/app/api/school-media/template/route.ts`
- **Purpose**: Dynamically generates and streams Excel (`.xlsx`) or CSV template spreadsheets for bulk staff or student imports based on configured custom fields.
- **Used By**: `StaffTemplateStage.tsx`, `StudentTemplateStage.tsx`.
- **Inputs**: Query parameters: `?type=staff|students&format=xlsx|csv&token=<token>`.
- **Outputs**: Streaming binary file with `Content-Disposition: attachment; filename="staff_roster_template.xlsx"`.
- **Dependencies**: `xlsx`, `staffTemplateGenerator.ts`, `studentTemplateGenerator.ts`.
- **Database Access**: Reads custom field definitions from `school_project_custom_fields` (Database B).

---

### 1.9 `/api/domain/check`
- **Method**: `GET`
- **File**: `src/app/api/domain/check/route.ts`
- **Purpose**: Live domain availability query, TLD extension verification, and annual pricing estimate.
- **Used By**: `SchoolDomainSelector.tsx`, `WebsiteQuoteBuilder.tsx`.
- **Inputs**: Query parameter: `?domain=example.com`.
- **Outputs**: `{ success: true, available: boolean, domain: string, priceINR: number | null, provider: string }`.
- **Dependencies**: `schoolDomain.ts`, external registrar DNS endpoint.
- **Database Access**: None (stateless external lookup).

---

### 1.10 `/api/geo/resolve-maps-url`
- **Method**: `POST`
- **File**: `src/app/api/geo/resolve-maps-url/route.ts`
- **Purpose**: Resolves shortened Google Maps redirect links (`maps.app.goo.gl/*`) to extract full coordinates (`lat`, `lng`).
- **Used By**: `CampusMapPinPicker.tsx`, `SchoolIdentityCard.tsx`.
- **Inputs**: JSON: `{ url: string }`.
- **Outputs**: `{ success: true, resolvedUrl: string, lat?: number, lng?: number }`.
- **Dependencies**: Native `fetch` with redirect following (`redirect: 'follow'`), `coordinateValidator.ts`.
- **Database Access**: None.

---

### 1.11 `/api/transport/live-location`
- **Method**: `GET` / `POST`
- **File**: `src/app/api/transport/live-location/route.ts`
- **Purpose**: GPS beacon ingestion from school bus driver PWA (POST) and live transit broadcast to student/parent trackers (GET).
- **Used By**: `DriverLocationTracker.tsx`, `PublicTransportRouteMap.tsx`, `/schools/[slug]/transport`.
- **Inputs**:
  - `POST`: `{ busId: string, tripId: string, latitude: number, longitude: number, speed?: number, heading?: number }`
  - `GET`: `?busId=<bus_id>&schoolId=<school_id>`
- **Outputs**:
  - `POST`: `{ success: true, recordedAt: string }`
  - `GET`: `{ success: true, location: { lat, lng, speed, heading, updatedAt } }`
- **Dependencies**: `liveLocationService.ts`, `busMovementEngine.ts`.
- **Database Access**: Ingests into `school_transport_live_locations` (Database B).

---

### 1.12 `/mandatory-disclosure`
- **Method**: `GET`
- **File**: `src/app/mandatory-disclosure/route.ts`
- **Purpose**: Regulatory machine-readable JSON specification for CBSE Affiliation By-Laws Appendix IX.
- **Used By**: Automated CBSE inspection crawlers, external accreditation bots.
- **Inputs**: None / optional `?school=<slug>`.
- **Outputs**: JSON payload detailing legal Society name, affiliation numbers, safety cert links, and fee schedule.
- **Dependencies**: `canonicalDocuments.ts`, `schoolTenant.ts`.
- **Database Access**: Reads `schools` and `school_approved_snapshots` (Database B).

---

## 2. Server Actions Inventory

| Action Name | Source File | Auth Requirement | Purpose & Business Logic | Primary Tables Mutated |
| :--- | :--- | :--- | :--- | :--- |
| `submitContactForm` | `src/app/actions.ts` | Public | Validates inbound contact inquiry, sends email via Resend, inserts lead. | `leads` (Database A) |
| `submitWebsiteQuote` | `src/app/actions.ts` | Public | Processes business website quote, calculates price, sends confirmation emails. | `leads` (Database A) |
| `submitSchoolQuote` | `src/app/actions.ts` | Public | Processes school inquiry, validates student tier, generates WhatsApp direct link. | `leads` (Database A) |
| `adminLoginAction` | `src/app/actions.ts` | Public | Verifies `ADMIN_PASSWORD` and sets HMAC SHA-256 cookie `ekaagra_admin_session`. | None (Cookie set) |
| `adminLogoutAction` | `src/app/actions.ts` | Public | Clears `ekaagra_admin_session` cookie and redirects to `/admin/login`. | None (Cookie cleared) |
| `fetchLeadsAction` | `src/app/actions.ts` | Admin Session | Retrieves paginated and filtered leads with stats. | None (Read `leads`) |
| `updateLeadStatusAction` | `src/app/actions.ts` | Admin Session | Updates lead pipeline status (`NEW` -> `CONTACTED` -> `CONVERTED`). | `leads` |
| `updateLeadNotesAction` | `src/app/actions.ts` | Admin Session | Saves internal staff notes on lead record. | `leads` |
| `startSchoolOnboardingAction` | `src/app/schoolProjectActions.ts` | Admin Session | Initiates school onboarding from a lead: creates project & invitation token. | `school_projects`, `school_onboarding_invitations`, `leads` |
| `createDirectSchoolProjectAction` | `src/app/schoolProjectActions.ts` | Admin Session | Direct admin creation of a school project with custom product plan. | `school_projects`, `school_onboarding_invitations` |
| `verifySchoolTokenAction` | `src/app/schoolProjectActions.ts` | Token | Validates raw token, invitation code, or project ID for onboarding portal access. | Read `school_onboarding_invitations` |
| `saveSchoolIntakeDraftAction` | `src/app/schoolProjectActions.ts` | Token | Persists auto-saved draft changes to the 32-section universal intake payload. | `school_intake_submissions`, `school_projects` |
| `submitSchoolIntakeAction` | `src/app/schoolProjectActions.ts` | Token | Executes final publication validation and submits intake for platform provisioning. | `school_intake_submissions`, `school_projects`, `school_project_activity` |
| `updateProjectProductAction` | `src/app/schoolProjectActions.ts` | Admin / Token | Changes the institutional commercial product tier (Website vs ERP vs Complete). | `school_projects` |
| `approveWebsiteSpecificationAction` | `src/app/schoolProjectActions.ts` | Token / Admin | Freezes approved draft into immutable `school_approved_snapshots`. | `school_approved_snapshots`, `school_projects` |
| `handoffSchoolToPlatformAction` | `src/app/schoolProjectActions.ts` | Admin Session | Provisions multi-tenant database tables (`schools`, `campuses`, `staff`, `students`). | Database B (`schools`, `campuses`, `students`, etc.) |
| `generateDeskMessageAction` | `src/app/schoolProjectActions.ts` | Token | AI / algorithmic synthesis of Principal desk messages without hallucinations. | None (Stateless synthesis) |
| `generateContentRecommendationAction` | `src/app/schoolProjectActions.ts` | Token | Rule-based synthesis of school story, mission, and facilities content. | None (Stateless synthesis) |
| `createBusinessProjectAction` | `src/app/businessProjectActions.ts` | Admin Session | Converts corporate lead into active business development project. | `projects`, `business_onboarding_tokens` |
| `saveBusinessRequirementsAction` | `src/app/businessProjectActions.ts` | Token | Saves corporate client requirements submission payload. | `business_requirements`, `projects` |
| `submitDesignFeedbackAction` | `src/app/businessProjectActions.ts` | Token | Records client feedback, section approvals, or change requests for Figma designs. | `design_reviews`, `project_activity` |
| `saveStaffConfigurationAction` | `src/app/staffActions.ts` | Token | Saves faculty settings, numbering patterns, and department configurations. | `school_intake_submissions` |
| `importStaffBulkAction` | `src/app/staffActions.ts` | Token | Parses and inserts validated staff roster records into the intake submission. | `school_intake_submissions` |
| `saveStudentConfigurationAction` | `src/app/studentActions.ts` | Token | Saves student field selections, custom fields, and numbering pattern settings. | `school_intake_submissions`, `school_project_custom_fields` |
| `importStudentsBulkAction` | `src/app/studentActions.ts` | Token | Parses and inserts bulk student roster records into intake submission. | `school_intake_submissions` |
