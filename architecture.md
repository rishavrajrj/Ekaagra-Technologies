# SYSTEM ARCHITECTURE & SUBSYSTEM DEEP DIVE
**Platform**: Ekaagra Technologies Full-Stack Engineering Platform  
**Architecture**: Next.js 16.3.0 App Router + Dual-Database Supabase Multi-Tenant Engine  
**Last Verified**: September 2026

---

## 1. Architectural Philosophy & Design Principles

The Ekaagra Technologies platform is architected around six core software engineering principles:

1. **Unified Core Engine**: Rather than maintaining fragmented codebases for each client or school, a single Next.js engine powers agency marketing, business client delivery, and multi-school web portals.
2. **Decoupled Dual-Database Topology**: Clean separation between client acquisition / commercial billing (Database A: CRM & Orders) and institutional multi-tenant operational data (Database B: Schools Platform).
3. **Zero Fabrication Policy**: The website generation engine strictly renders authoritative data provided during onboarding. It never invents placeholder stats, fake teachers, or mock facilities. If a school does not operate transport, transport modules dynamically vanish.
4. **Universal Verification & Publication Gatekeeping**: A multi-pillar blocker engine prevents premature deployment. Required statutory documents (CBSE affiliation, State NOC, Fire Safety) and canonical leadership portraits must be satisfied before publication sign-off.
5. **Centralized Media Registry**: Assets uploaded anywhere (logos, campus buildings, principal headshots) are cataloged in an idempotent registry (`SharedMediaAsset[]`), eliminating duplicate uploads across forms.
6. **Multi-Branch Campus Scope Architecture**: Every institutional record accommodates multi-campus branches, allowing child campuses to inherit or override facilities, classrooms, and contact parameters cleanly.

---

## 2. High-Level System Architecture Diagram

```
                               ┌─────────────────────────────────────────┐
                               │           CLIENT BROWSER / USER         │
                               └────────────────────┬────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
    ┌─────────────────────────┐                                           ┌─────────────────────────┐
    │  Public Agency / SEO    │                                           │ School Onboarding / CRM │
    │  - Homepage & Services  │                                           │  - 32-Step Intake Form  │
    │  - Quote Builders       │                                           │  - Verification Center  │
    │  - Razorpay Checkout    │                                           │  - Live Website Preview │
    └────────────┬────────────┘                                           └────────────┬────────────┘
                 │                                                                     │
                 ▼                                                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 16 APP ROUTER RUNTIME (Node.js)                              │
│                                                                                                  │
│  ┌─────────────────────────┐ ┌───────────────────────────┐ ┌──────────────────────────────────┐  │
│  │   Server Actions        │ │    HTTP Route Handlers    │ │      Dynamic Website Engine      │  │
│  │ - Lead Submission       │ │ - /api/payments/*         │ │ - SchoolWebsiteRenderer          │  │
│  │ - Intake Auto-Save      │ │ - /api/school-assets/*    │ │ - SchoolWebsiteData Contract     │  │
│  │ - Blocker Verification  │ │ - /api/transport/*        │ │ - Reusable Section Components    │  │
│  └─────────────┬───────────┘ └─────────────┬─────────────┘ └─────────────────┬────────────────┘  │
└────────────────┼───────────────────────────┼─────────────────────────────────┼───────────────────┘
                 │                           │                                 │
                 ▼                           ▼                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA & STORAGE LAYER                                          │
│                                                                                                  │
│     ┌────────────────────────────────────┐             ┌───────────────────────────────────┐     │
│     │            DATABASE A              │             │            DATABASE B             │     │
│     │   (Lead Management & Orders)       │             │    (Schools Multi-Tenant Platform)│     │
│     │ - leads, orders, payment_events    │             │ - school_projects, invitations    │     │
│     │ - projects, clients, requirements  │             │ - school_intake_submissions       │     │
│     │ - design_reviews, project_activity │             │ - schools, campuses, students     │     │
│     └────────────────────────────────────┘             └───────────────────────────────────┘     │
│                                                                                                  │
│     ┌────────────────────────────────────┐             ┌───────────────────────────────────┐     │
│     │          SUPABASE STORAGE          │             │     LOCAL FALLBACK STORAGE        │     │
│     │ - bucket: 'school-assets' (public) │             │ - /public/uploads/school-assets/  │     │
│     │ - bucket: 'school-assets-private'  │             │ - /private/uploads/school-assets/ │     │
│     └────────────────────────────────────┘             └───────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Deep Dive

### 3.1 Corporate Web & Hyper-Local SEO Subsystem
- **Core Files**: `src/app/page.tsx`, `src/app/services/*`, `src/app/projects/*`, `src/lib/data.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`.
- **Functionality**: Serves corporate marketing, engineering portfolio, interactive 3D elements (`three.js`), and programmatically targets high-intent search queries in Northern Bihar (`/website-development-motihari`, `/school-erp-motihari`, etc.).
- **SEO Architecture**: Fully structured JSON-LD schemas (`Organization`, `LocalBusiness`, `Service`, `Article`). Next.js metadata API generates dynamic OpenGraph cards and canonical tags.

### 3.2 Commercial Pricing & Razorpay Settlement Subsystem
- **Core Files**: `src/lib/pricingEngine.ts`, `src/lib/businessPricing.ts`, `src/lib/schoolPricing.ts`, `src/lib/razorpay.ts`, `src/app/api/payments/*`.
- **Zero-Client-Trust Guardrail**: The client browser sends only selected plan IDs and add-on codes. All prices, GST calculations, domain allowances, and milestone splits are computed strictly on the server in `calculateVerifiedOrderTotal()`.
- **Transaction Flow**:
  1. Client triggers checkout -> `/api/payments/create-order` validates input and invokes Razorpay API creating order in paise.
  2. Order record persisted to Database A with status `'PENDING'`.
  3. Razorpay client popup captures payment -> `/api/payments/verify` verifies HMAC SHA-256 signature using `RAZORPAY_KEY_SECRET`.
  4. Order updated to `'PAID'`, lead converted to `'CONVERTED'`, project status updated to `'PAID'`.

### 3.3 Business Projects & Client Portal Subsystem
- **Core Files**: `src/lib/businessProjectsDb.ts`, `src/app/businessProjectActions.ts`, `src/app/business-requirements/[token]/page.tsx`, `src/app/design-review/[token]/page.tsx`.
- **Token Security**: Tokens are generated using `crypto.randomBytes(32)` and stored as SHA-256 hashes (`token_hash`). The raw token is delivered via secure link (`/business-requirements/[token]`).
- **Design Review Flow**: Clients inspect interactive Figma prototypes, approve or dispute specific sections (Hero, Services, Pricing), and submit change requests directly to the project activity feed.

### 3.4 School Master Onboarding & Universal Intake 2.0 Subsystem
- **Core Files**: `src/lib/schoolIntake.ts`, `src/app/schoolProjectActions.ts`, `src/components/schools/SchoolOnboardingPortal.tsx`.
- **Chapter & Section Architecture**: 32 comprehensive intake sections organized into 8 intuitive chapters:
  1. *Chapter 1: Identity & Campuses* (UDISE, basic info, campuses, leadership).
  2. *Chapter 2: Branding & School Story* (Logos, colors, typography, pedagogy, history).
  3. *Chapter 3: Academics & People* (Classes, sections, subjects, staff roster, student roster).
  4. *Chapter 4: Admissions, Fees & Schedule* (Enrollment criteria, fee heads, timetable, exams).
  5. *Chapter 5: Facilities & Campus Operations* (Labs, smart classrooms, transport fleet, hostel).
  6. *Chapter 6: Tech, Domain & Integrations* (CMS workflow, domain DNS, data migration, apps).
  7. *Chapter 7: Assets & Legal Policies* (Compliance documents, safety policies, project deadlines).
  8. *Chapter 8: Verification & Final Sign-Off* (Review command center, super admin sign-off).
- **Auto-Save Resilience**: Form modifications debounce auto-save to Database B via `saveSchoolIntakeDraftAction()`, preserving work across browser crashes.

### 3.5 Universal Verification & Publication Blocker Engine
- **Core Files**: `src/lib/universalVerificationEngine.ts`, `src/lib/remediationRegistry.ts`, `src/lib/canonicalDocuments.ts`.
- **6-Pillar Readiness Model**: Evaluates intake completeness across:
  1. *Identity*: School name, UDISE code, canonical Principal name, main campus address.
  2. *Content*: School story, mission statement, philosophy, academic curriculum.
  3. *Facilities*: Verified classrooms, science/computer laboratories, sports amenities.
  4. *Assets*: High-resolution school logo, campus hero photograph, principal portrait.
  5. *Compliance*: CBSE Affiliation Certificate, State Government NOC, Fire Safety Certificate, Appendix IX Disclosure.
  6. *Admin / Sign-Off*: Designated decision maker declaration and contact details.
- **Remediation Navigation**: Every blocker provides a deep-link anchor that immediately routes the user to the exact form field needing resolution.

### 3.6 Unified School Website Engine & Website Data Contract
- **Core Files**: `src/lib/schoolWebsiteContract.ts`, `src/components/schools/website-engine/*`.
- **Data Transformation**: The engine bridges database records to UI presentation props via `buildSchoolWebsiteDataFromIntake()` or `buildSchoolWebsiteDataFromDb()`.
- **Dynamic Conditional Rendering**:
  - `data.transport.isOperated` controls the visibility of the bus routes and GPS section.
  - `data.hostel.isAvailable` controls the visibility of the residential boarding section.
  - `data.gallery.length > 0` conditionally renders the 10-category photo showcase.
- **Theme & Branding Injection**: School colors (`primaryColor`, `secondaryColor`) and typography dynamically style Tailwind CSS variables at runtime.

### 3.7 Database Handoff & Platform Provisioning Engine
- **Core Files**: `src/lib/schoolHandoffToPlatform.ts`, `src/lib/schoolDatabaseProvisioning.ts`, `src/lib/schoolTenant.ts`.
- **Lifecycle Transition**: When a school onboarding intake reaches 100% readiness and receives sign-off, `executePlatformHandoff()` transitions the draft JSONB payload into first-class relational database entities in Database B:
  - Inserts school tenant row into `schools` (`slug`, `school_id`).
  - Inserts branch rows into `campuses`.
  - Provisions student roster into `students`.
  - Provisions faculty directory into `staff`.
  - Creates immutable snapshot in `school_approved_snapshots`.

### 3.8 School Transport & Live Bus GPS Tracking Subsystem
- **Core Files**: `src/lib/publicTransportUtils.ts`, `src/lib/services/*`, `src/components/schools/maps/*`, `src/app/api/transport/live-location/route.ts`.
- **Zero-API-Key Architecture**: Transport route planning and bus stops utilize Leaflet, OpenStreetMap, Nominatim geocoding, and OSRM (Open Source Routing Machine), eliminating recurring Google Maps API costs for public transit routes.
- **Live GPS Tracking**: Drivers run a lightweight mobile PWA sending GPS coordinates to `/api/transport/live-location`. Parent trackers poll or stream updates via `DriverLocationTracker.tsx` and render vehicle positions along polyline routes.
