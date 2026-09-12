# PERMANENT CODEBASE INTELLIGENCE & MEMORY
**Project**: Ekaagra Technologies Platform (`ekaagra-technologies`)  
**Version**: 0.1.0  
**Framework**: Next.js 16.3.0 App Router, React 19.2.8, TypeScript 5, Tailwind CSS v4  
**Database**: PostgreSQL via Supabase (Dual-Database Decoupled Architecture)  
**Authoritative Date**: September 2026  
**Document Purpose**: The permanent operational brain and onboarding manual for the entire repository.

---

## 1. PROJECT OVERVIEW & WHY IT EXISTS

### What the Project Does
Ekaagra Technologies is an enterprise-grade software engineering, agency operations, and institutional digital platform headquartered in Motihari, East Champaran, Bihar. The platform combines:
1. **Agency Corporate Presence & Local Authority Engine**: Showcase of engineering capabilities, transparent pricing models, interactive quote builders, and programmatic hyper-local SEO targeting Northern Bihar.
2. **Commercial Order Settlement & Client CRM**: Server-authoritative pricing engine, Razorpay online payments, milestone billing, and lead conversion funnel.
3. **Business Projects Portal**: Token-authenticated client workspaces for requirements intake, Figma prototype review, and change requests.
4. **Institutional School Onboarding & Verification Engine**: A 32-section, 8-chapter universal intake wizard that collects, normalizes, and verifies complete school records (statutory CBSE/State affiliation, multi-branch campuses, fee ledgers, timetable, transport fleets, hostels, and staff/student rosters).
5. **Dynamic Multi-Tenant School Website Engine**: A zero-fabrication presentation engine capable of rendering unlimited school websites from normalized database contracts without code duplication or hardcoded school data.

### Why It Exists
Historically, educational institutions and small-to-medium businesses in regional Indian markets (Tier 2/3 cities like Motihari, Bettiah, Muzaffarpur) have faced fragmented software solutions: static low-quality websites disconnected from operational reality, proprietary monolithic ERPs with poor UX, and manual paperwork for regulatory compliance (CBSE Appendix IX). Ekaagra Technologies bridges this divide by delivering modern, cloud-native digital infrastructure—allowing schools to collect information once, verify compliance automatically, and generate both compliant public portals and ERP databases seamlessly.

---

## 2. BUSINESS PURPOSE & STAKEHOLDERS

### Target Audiences & Personas
1. **School Leadership (Principals, Chairpersons, Trustees)**: Complete institutional onboarding, upload mandatory compliance documents, configure fee structures, and approve website specifications.
2. **School Administrators & Transport In-Charges**: Manage campus branches, upload staff/student rosters via Excel, and monitor live bus GPS tracking.
3. **Prospective Parents & Students**: Browse school websites, review academic curriculum, check fee schedules, view campus facility galleries, and track school buses in real-time.
4. **Corporate Business Clients**: Explore bespoke software, mobile apps, or websites; request instant quotes; review interactive prototypes; and settle milestone invoices.
5. **Ekaagra Staff Administrators**: Monitor inbound leads, review project status, verify school intakes, trigger platform provisioning, and track revenue.

---

## 3. TECHNOLOGY DETECTION & STACK MATRIX

| Layer | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) | 16.3.0 | Modern hybrid rendering (RSC + Client Components), server actions, optimized routing. |
| **Core UI Library** | React & React DOM | 19.2.8 | Latest React architecture with transitions (`useTransition`), actions, and concurrent rendering. |
| **Language** | TypeScript | ^5.0.0 | Strict type safety (`strict: true`), zero compile errors across 80+ domain interfaces. |
| **Styling & Design System** | Tailwind CSS & PostCSS | ^4.0.0 | Utility-first styling with modern PostCSS pipeline (`@tailwindcss/postcss`). |
| **Component Icons** | Lucide React | ^1.31.0 | Lightweight, consistent iconography across marketing, admin, and school portals. |
| **3D Graphics** | Three.js & @types/three | ^0.186.0 | Interactive 3D geometric branding canvas on the corporate homepage (`Ekaagra3DLogo.tsx`). |
| **Database & Auth (BaaS)** | Supabase JS | ^2.112.4 | Dual-instance PostgreSQL database clients, service role authentication, and storage buckets. |
| **Payment Gateway** | Razorpay SDK | Custom Server | Standard checkout modal, server-side order calculation in paise, HMAC SHA256 verification. |
| **Image Processing** | Sharp | ^0.35.4 | Server-side raster image optimization, automatic WebP conversion, dimension normalization. |
| **Spreadsheet Processing** | XLSX (SheetJS) | ^0.18.5 | Client & server generation/parsing of Excel/CSV templates for bulk student & staff rosters. |
| **Archive Packaging** | JSZip | ^3.10.2 | Client-side aggregation and compression of verified school assets and compliance PDFs. |
| **Mapping & GIS** | Leaflet & React-Leaflet | ^1.9.4 / ^5.0.0 | Free OpenStreetMap and OSRM routing for school bus tracking with zero recurring API costs. |
| **Commercial Maps** | Google Maps JS API Loader | ^2.1.1 | Places autocomplete, interactive campus map pin selection, and geocoding. |
| **Email Delivery** | Resend & Nodemailer | ^6.24.0 / ^9.0.5 | Transactional email delivery for lead notifications, quotes, and client receipts. |
| **Analytics & Telemetry** | Vercel Analytics & Speed Insights | ^2.0.1 / ^2.0.0 | Real-time Web Vitals tracking, core performance metrics, and audience conversion paths. |

---

## 4. REPOSITORY STRUCTURE & FOLDER RESPONSIBILITIES

```
ekaagra-technologies/
├── .agent/                      # Antigravity agent configuration and state
├── .coderabbit.yaml             # Automated code review policies and static analysis rules
├── .env.example                 # Comprehensive environment variable documentation template
├── AGENTS.md                    # Engineering standards, workflow guardrails, and agent directives
├── memory.md                    # This document - permanent repository brain
├── architecture.md              # Deep dive architectural blueprints and topology diagrams
├── routes.md                    # Master route inventory across pages and endpoints
├── api-map.md                   # API handler and server action inventory
├── database-map.md              # Dual-database schema and entity relationship diagrams
├── dependency-graph.md          # Module import graphs and blast radius classifications
├── next.config.ts               # Next.js runtime headers (CSP, frame options) and 301 redirects
├── package.json                 # Project dependencies, scripts (lint, test, build)
├── postcss.config.mjs           # PostCSS configuration with Tailwind v4
├── tsconfig.json                # TypeScript strict configuration and `@/*` path aliases
├── docs/                        # 38+ production SEO, authority, and deployment certifications
├── private/                     # Local filesystem fallback for sensitive statutory compliance files
│   └── uploads/school-assets/   # Secure documents when Supabase private bucket is unconfigured
├── public/                      # Static assets, branding logos, icons, and public uploads
├── scripts/                     # 35+ end-to-end browser tests, QA scripts, and data migration tools
├── supabase/                    # 22+ PostgreSQL migrations for Database A and Database B
├── tests/                       # Standalone regression test suites
└── src/
    ├── app/                     # Next.js App Router (pages, layouts, server actions, route handlers)
    ├── components/              # Modular UI components (admin, forms, layout, schools, showcase, ui)
    ├── hooks/                   # Custom React hooks (`useFieldScope`, `useViewport`)
    └── lib/                     # Domain business logic, database clients, pricing engines, utils
```

### Folder Responsibilities:
- `src/app`: Page components and server actions. Top-level action files (`actions.ts`, `schoolProjectActions.ts`, `businessProjectActions.ts`, `orderActions.ts`, `staffActions.ts`, `studentActions.ts`) encapsulate backend operations.
- `src/components/schools/website-engine`: The pure presentation layer for generated school websites. Consumes exclusively `SchoolWebsiteData`.
- `src/components/schools`: Multi-step onboarding form sections (Admissions, Transport, Hostel, Leadership, etc.).
- `src/lib`: Core business logic engines: `schoolIntake.ts` (32 sections), `schoolWebsiteContract.ts` (data bridge), `universalVerificationEngine.ts` (blockers & 6 pillars), `pricingEngine.ts` (server checkout).
- `src/lib/__tests__`: 22 automated test suites executed via `npm test` verifying 100% domain compliance.

---

## 5. SYSTEM ARCHITECTURE & DATA FLOW

### The Long-Term Architectural Highway
```
ONBOARDING FORM (32 Sections)
      ↓
VALIDATION + NORMALIZATION (Zero Fabrication Engine)
      ↓
SCHOOL DATABASE (Database B: school_intake_submissions / schools)
      ↓
SINGLE SOURCE OF TRUTH (Universal Verification Engine)
      ↓
WEBSITE DATA CONTRACT (src/lib/schoolWebsiteContract.ts: SchoolWebsiteData)
      ↓
WEBSITE CONFIGURATION / THEME (Branding, Colors, Typography)
      ↓
REUSABLE WEBSITE COMPONENTS (src/components/schools/website-engine/*)
      ↓
STITCH-DESIGNED UI / RESPONSIVE PORTAL
      ↓
MULTIPLE SCHOOL WEBSITES (/schools/[slug])
```

### End-to-End Data Flow Patterns

#### Pattern A: School Onboarding to Live Website
1. **User Action**: School administrator inputs details across 32 sections in `/schools/onboarding/[token]`.
2. **Client State**: `SchoolOnboardingPortal.tsx` maintains draft state in memory and debounces auto-save.
3. **Draft Persistence**: Calls `saveSchoolIntakeDraftAction(token, payload)` which updates `school_intake_submissions` in Database B.
4. **Verification & Audit**: User navigates to Final Review tab (`/final-review`). The `universalVerificationEngine.ts` scans all 6 pillars and identifies active publication blockers (e.g. missing Principal name or statutory PDFs).
5. **Approval**: Once 0 blockers remain, the user approves the specification via `approveWebsiteSpecificationAction()`, freezing an immutable record into `school_approved_snapshots`.
6. **Platform Provisioning**: Admin triggers `executePlatformHandoff()` which populates relational entities (`schools`, `campuses`, `students`, `staff`).
7. **Rendering**: Visiting `/schools/[slug]` fetches the tenant record, calls `buildSchoolWebsiteDataFromDb()`, and passes the normalized contract into `SchoolWebsiteRenderer.tsx`.

#### Pattern B: Client Inquiry & Razorpay Checkout
1. **User Action**: Prospect configures website or software requirements on `/get-quote` or `/pricing` and clicks "Proceed to Checkout".
2. **Server Action / API**: Client calls `POST /api/payments/create-order` passing only selected plan IDs and add-on codes.
3. **Calculation**: `pricingEngine.ts` computes exact amounts on the server, creates an order in Razorpay (in paise), and writes an order record with status `PENDING` into `orders` in Database A.
4. **Client Modal**: Client browser opens standard Razorpay checkout popup.
5. **Verification**: Upon successful swipe/UPI/netbanking, Razorpay returns signatures to `/api/payments/verify`.
6. **Settlement**: Server verifies HMAC SHA-256 signature, marks order `PAID`, converts lead to `CONVERTED`, and transitions business project status to `PAID`.

---

## 6. ROUTING & ACCESS CONTROL INTELLIGENCE

Routing is partitioned into four distinct security tiers:

1. **Public Routes (No Authentication Required)**:
   - `/`, `/about`, `/services`, `/projects`, `/pricing`, `/process`, `/contact`, `/blog`
   - Local SEO routes: `/website-development-motihari`, `/school-erp-motihari`, etc.
   - Public school portals: `/schools/[slug]`, `/schools/[slug]/transport`
2. **Order-Scoped Public Routes (Scoped by Order Number)**:
   - `/pay/[orderNumber]`: Queries `orders` table specifically for the unique `orderNumber`.
   - `/checkout/success`, `/checkout/failed`: Client receipt rendering.
3. **Token-Authenticated Client Portals (Bearer / URL Token)**:
   - `/business-requirements/[token]`, `/design-review/[token]`
   - `/school-onboarding/[token]`, `/schools/onboarding/[token]`, `/schools/onboarding/[token]/final-review`
   - *Security Model*: The URL contains a raw 32-byte hex token or human code (e.g. `ONB-2026-0001`). Server hashes the token via SHA-256 and matches against `token_hash` in `school_onboarding_invitations`. Tokens expire after 30 days and can be revoked by admins.
4. **Administrator Portal (Cryptographic Session Cookie)**:
   - `/admin`, `/admin/leads`, `/admin/business-projects`, `/admin/school-projects`, `/admin/orders`
   - *Security Model*: Authenticated via `/admin/login`. On successful password verification (`ADMIN_PASSWORD`), the server sets an `httpOnly`, `sameSite: 'lax'` cookie named `ekaagra_admin_session`. The cookie contains `<timestamp>.<HMAC-SHA256-signature>` signed using `ADMIN_SECRET`. Every admin page and action validates this signature before executing.

---

## 7. FRONTEND ARCHITECTURE & STATE MANAGEMENT

### Component Hierarchy
- **Application Shell**: `src/app/layout.tsx` wraps the app with Geist fonts, metadata, and Vercel Analytics/Speed Insights. `SiteShell.tsx` renders persistent `Navbar` and `Footer` for marketing pages while automatically omitting them on admin and onboarding portals.
- **Form State Management**:
  - Complex forms (`SchoolOnboardingPortal.tsx`, `WebsiteQuoteBuilder.tsx`, `BusinessRequirementsForm.tsx`) use React local state combined with custom hooks (`useFieldScope`).
  - No bloated global state libraries (Redux/MobX) are needed; state is scoped directly to feature modules with periodic server synchronizations.
- **Design Tokens**: Standardized in `src/lib/design-system/tokens.ts` (color palettes, shadows, spacing, typography scales).
- **Interactive Visuals**:
  - Three.js WebGL canvas for dynamic 3D geometry (`Ekaagra3DLogo.tsx`).
  - Leaflet maps with dynamic polyline route geometry rendering (`PublicTransportRouteMap.tsx`).
  - Lucide icons dynamically loaded by name via lookup helpers.

---

## 8. BACKEND & BUSINESS LOGIC ENGINES

### 8.1 Server Actions vs API Routes
- **Server Actions** (`'use server'`): Used for form submissions, draft auto-saves, status updates, and admin operations. They provide type-safe RPC without boilerplate fetch code.
- **HTTP Route Handlers** (`src/app/api/*`): Used for binary file streams (Excel templates, asset uploads/downloads), third-party webhooks (Razorpay), external API proxies (domain checks), and high-frequency sensor streams (live GPS bus tracking).

### 8.2 Validation & Error Handling
- All inputs are strictly validated on the server.
- Email formats, 10-digit Indian phone numbers, and coordinate ranges (`lat: -90..90`, `lng: -180..180`) are verified with explicit error messaging.
- File uploads undergo triple-barrier inspection: size limits (15MB), forbidden extension blocks (`.exe`, `.php`, `.js`), and magic byte header inspection.

---

## 9. DATABASE INTELLIGENCE & TENANT ISOLATION

### Dual-Database Implementation
- **Client Factory**:
  - `getSupabaseServerClient()` in `src/lib/supabase.ts` connects to Database A.
  - `getSchoolsServerClient()` in `src/lib/schoolsDb.ts` connects to Database B.
- **Tenant Partitioning**:
  - During onboarding, institutional data is isolated by `school_project_id` in `school_intake_submissions`.
  - Upon platform provisioning, records are isolated by canonical 11-digit UDISE `school_id` across `campuses`, `students`, `staff`, and `schools`.

---

## 10. ENVIRONMENT VARIABLES & SECURITY HYGIENE

| Variable Name | Environment | Purpose & Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Client & Server | Centralized corporate WhatsApp number (e.g. 919876543210). |
| `ADMIN_EMAIL` | Server | Destination email where admin notifications and quote alerts are received. |
| `SUPABASE_URL` | Server & Client | URL endpoint for Lead Management & Orders database (Database A). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | High-privilege service role secret for Database A (never expose to client). |
| `SUPABASE_ANON_KEY` | Server & Client | Public anonymous key for Database A. |
| `SCHOOLS_SUPABASE_URL` | Server Only | URL endpoint for Schools Platform database (Database B). |
| `SCHOOLS_SUPABASE_SERVICE_ROLE_KEY` | Server Only | High-privilege service role secret for Database B. |
| `ADMIN_PASSWORD` | Server Only | Password string for staff administrative console authentication. |
| `ADMIN_SECRET` | Server Only | Secret string used to cryptographically sign admin session HMAC cookies. |
| `RESEND_API_KEY` | Server Only | API key for transactional email delivery through Resend. |
| `FROM_EMAIL` | Server Only | Verified domain sender address (e.g. `notifications@ekaagratechnologies.site`). |
| `RAZORPAY_KEY_ID` | Server Only | Razorpay API key ID for server-side order generation. |
| `RAZORPAY_KEY_SECRET` | Server Only | Razorpay secret for HMAC SHA-256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Server Only | Webhook verification secret for incoming Razorpay events. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client & Server | Public key ID passed to Razorpay checkout browser modal. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client & Server | Browser-safe API key for campus location picker and geocoding autocomplete. |
| `GOOGLE_MAPS_GEOCODING_API_KEY` | Server Only | Authoritative server-side reverse geocoding key. |

---

## 11. QUALITY ASSURANCE, TESTING & VERIFICATION

The platform includes 22 rigorous automated test suites in `src/lib/__tests__/`:
1. `attendanceUtils.test.ts` (Section 11 timetable & attendance modes)
2. `facilitiesUtils.test.ts` (Section 14 campus infrastructure & labs)
3. `institutionalIdNumbering.test.ts` (Student & staff ID generator patterns)
4. `libraryUtils.test.ts` (Section 15 library circulation & RFID rules)
5. `communicationUtils.test.ts` (Section 17 notification matrix & WhatsApp rules)
6. `hostelUtils.test.ts` (Section 16 residential boarding & room categories)
7. `mobileAppRequirements.test.ts` (Section 22 Android/iOS platform configs)
8. `integrationsUtils.test.ts` (Section 21 payment & SMS gateway choices)
9. `portalRequirementsUtils.test.ts` (Role-based web portal preferences)
10. `mediaAssetsUtils.test.ts` (Media asset repository & categories)
11. `studentInformationUtils.test.ts` (Student field definitions & numbering)
12. `fieldScopeRegistry.test.ts` (Product tier field visibility engine)
13. `schoolAccommodation.test.ts` (Day vs residential accommodation normalization)
14. `campusAcademicScope.test.ts` (Multi-campus class ranges & level mapping)
15. `schoolTypeAndCampusConsistency.test.ts` (School type suggestions & class presets)
16. `campusAcademicLevelReconciliation.test.ts` (Dynamic level toggles & class syncing)
17. `campusScopeArchitecture.test.ts` (Inheritance & branch override mechanics)
18. `businessPricing.test.ts` (Commercial pricing models & server order totals)
19. `contentRecommendationService.test.ts` (Zero-hallucination copy synthesis)
20. `publicationBlockerEngine.test.ts` (Principal validation, statutory certs & 6 pillars)
21. `mediaRegistryUtils.test.ts` (Centralized media aggregation & reuse)
22. `campusStatisticsUtils.test.ts` (Campus student & faculty headcount reconciliation)

### Running Verification Commands
- `npm run lint` -> Runs `tsc --noEmit` to verify strict TypeScript type integrity.
- `npm test` -> Executes all 22 test suites with tsx. All tests must achieve 100% pass before any deployment.

---

## 12. KNOWN RISKS & FUTURE RECOMMENDATIONS

### Known Architectural Risks
1. **Dual-Database Synchronization**: In environments where Database A and Database B are separate Supabase projects, cross-database foreign keys cannot be enforced by Postgres. The application layer handles handoff integrity via `school_project_reference`.
2. **Local Upload Storage Fallback**: When Supabase storage buckets are not provisioned, private files are stored in `private/uploads/`. In containerized ephemeral environments (e.g. standard Vercel serverless functions), local disk writes are ephemeral. Supabase S3 storage buckets must always be configured for production.
3. **High File Size on Central Types**: `src/lib/types.ts` is 5,800+ lines long. While perfectly sound for type checking, breaking it down into domain-specific type files in `src/lib/types/` is recommended for future maintainability.

### Future Recommendations
1. **Stitch UI Integration**: The `SchoolWebsiteRenderer` is built as an abstraction layer ready to plug in Stitch designs. Individual school components (`SchoolHero`, `SchoolFacilities`) can be skinned with new theme variants without altering the underlying data contract.
2. **Multi-Domain Routing**: Implement Next.js wildcard middleware routing (e.g. `schoolname.ekaagraschools.com` or custom CNAME domains) pointing directly to `/schools/[slug]`.
