# DEPENDENCY GRAPH & CRITICAL SUBSYSTEMS
**System**: Ekaagra Technologies Platform  
**Analysis**: Module Import Topologies, Blast Radius & Critical Paths  
**Last Verified**: September 2026

---

## 1. Core Architectural Pillars (DO NOT MODIFY LIGHTLY)

These files constitute the foundation of the platform. Any change to their interfaces, signatures, or behavior ripples across dozens of dependent modules, unit tests, and production pages.

```
                               ┌──────────────────────┐
                               │   src/lib/types.ts   │
                               └──────────┬───────────┘
                                          │
       ┌─────────────────┬────────────────┴────────────────┬────────────────┐
       ▼                 ▼                                 ▼                ▼
[schoolIntake.ts] [schoolWebsiteContract.ts]      [supabase.ts]     [schoolsDb.ts]
       │                 │                                 │                │
       ▼                 ▼                                 ▼                ▼
[universalVerification] [SchoolWebsiteRenderer]   [businessProjectsDb] [schoolHandoff]
       │                 │                                 │                │
       ▼                 ▼                                 ▼                ▼
[SchoolOnboardingPortal] [/schools/[slug]]        [Admin Dashboards] [SchoolOnboarding]
```

### 1.1 `src/lib/types.ts` (Core Type Contract)
- **Lines**: 5,895 lines
- **Responsibility**: Single canonical dictionary for every data model, database entity, intake configuration, and UI prop in the codebase.
- **Key Types Defined**: `UniversalIntakeData`, `SchoolWebsiteData`, `SchoolProject`, `SchoolTenant`, `Lead`, `Order`, `BusinessProject`, `WebsitePlan`.
- **Dependents**: Virtually all components in `src/components/`, server actions in `src/app/`, and utilities in `src/lib/`.
- **Modification Rule**: Strictly append-only or non-breaking extensions. Never rename fields without comprehensive refactoring and backward compatibility shims.

### 1.2 `src/lib/schoolWebsiteContract.ts` (Website Data Normalization Contract)
- **Lines**: 723 lines
- **Responsibility**: Bridge between the raw intake database record (`UniversalIntakeData` or database entities) and the frontend presentation layer (`SchoolWebsiteData`).
- **Core Principle**: Zero fabrication. Never invent mock facts. If a school does not operate transport, `data.transport.isOperated` is strictly `false`.
- **Dependents**:
  - `src/components/schools/website-engine/*` (all 14 presentation components)
  - `src/app/schools/[slug]/page.tsx` (production school websites)
  - `src/components/schools/SchoolOnboardingPortal.tsx` (live preview tab)
  - `src/components/schools/UniversalVerificationPage.tsx`

### 1.3 `src/lib/schoolIntake.ts` (Universal Intake State Machine)
- **Lines**: 3,736 lines
- **Responsibility**: Definition of the 32 intake sections, 8 chapters, completeness calculation algorithm, conditional cross-section applicability rules, and validation scoring.
- **Dependents**:
  - `src/components/schools/SchoolOnboardingPortal.tsx`
  - `src/app/schoolProjectActions.ts`
  - `src/lib/universalVerificationEngine.ts`
  - `src/lib/__tests__/` (multiple unit test suites)

### 1.4 `src/lib/universalVerificationEngine.ts` (Publication Blocker & Audit Engine)
- **Lines**: 1,921 lines
- **Responsibility**: Authoritative evaluation of publication readiness across 6 pillars (Identity, Content, Facilities, Assets, Compliance, Admin). Evaluates blockers (e.g. Principal name, statutory CBSE certificates) and generates printable HTML reports & ZIP bundles.
- **Dependents**:
  - `src/components/schools/UniversalVerificationPage.tsx`
  - `src/components/schools/SchoolOnboardingPortal.tsx`
  - `src/app/schoolProjectActions.ts`

### 1.5 `src/lib/campusScopeRegistry.ts` & `src/lib/academicStructureUtils.ts`
- **Responsibility**: Multi-branch campus inheritance, class-range derivation (e.g. 'Playgroup to Class 10'), and section-by-section campus overrides (`inherited` vs `customized`).
- **Dependents**: `AcademicStructureSection.tsx`, `CampusFacilitiesSection.tsx`, `CampusImagesSection.tsx`.

---

## 2. High Impact Files & Blast Radius Table

| File Path | Direct Dependents | Functional Area | Risk Level | Validation Required After Modification |
| :--- | :--- | :--- | :--- | :--- |
| `src/lib/types.ts` | 80+ files | Central Type System | **CRITICAL** | `npm run lint` (`tsc --noEmit`), `npm test` |
| `src/lib/schoolWebsiteContract.ts` | 18 files | Website Engine Contract | **CRITICAL** | `npm test` (websiteApprovalContract, publicationBlockerEngine) |
| `src/lib/schoolIntake.ts` | 24 files | Onboarding Business Logic | **CRITICAL** | `npm test` (all 22 unit test suites) |
| `src/lib/universalVerificationEngine.ts` | 8 files | Readiness & Submission Engine | **HIGH** | `npm test` (publicationBlockerEngine.test.ts) |
| `src/lib/supabase.ts` | 12 files | Database A Client & CRM | **HIGH** | Test Lead creation, Order generation, Admin Leads |
| `src/lib/schoolsDb.ts` | 10 files | Database B Client | **HIGH** | Test Onboarding verification & draft persistence |
| `src/lib/pricingEngine.ts` | 6 files | Server Order Price Calculator | **HIGH** | `npm test` (businessPricing.test.ts) |
| `src/lib/mediaRegistryUtils.ts` | 14 files | Centralized Media Registry | **MEDIUM** | `npm test` (mediaRegistryUtils.test.ts) |
| `src/lib/imageUploadService.ts` | 8 files | Sharp WebP & Asset Storage | **MEDIUM** | Upload smoke test, WebP buffer verification |
| `src/lib/geography/` | 11 files | Pin, State & District Dropdowns | **LOW** | `npm test` (geographyAddressFlow.test.ts) |

---

## 3. Subsystem Dependency Chains

### 3.1 School Onboarding to Live Website Engine Flow
```
User Form Input (32 Sections)
  ↓
SchoolOnboardingPortal.tsx (Draft State Manager)
  ↓
saveSchoolIntakeDraftAction() (src/app/schoolProjectActions.ts)
  ↓
school_intake_submissions (JSONB in Database B)
  ↓
buildSchoolWebsiteDataFromIntake() (src/lib/schoolWebsiteContract.ts)
  ↓
SchoolWebsiteRenderer.tsx
  ├── SchoolHeader.tsx
  ├── SchoolHero.tsx
  ├── SchoolAbout.tsx
  ├── SchoolLeadership.tsx
  ├── SchoolAcademics.tsx
  ├── SchoolFacilities.tsx
  ├── SchoolAdmissions.tsx
  ├── SchoolFees.tsx
  ├── SchoolHostel.tsx (Conditional)
  ├── SchoolTransport.tsx (Conditional)
  ├── SchoolGallery.tsx (Conditional)
  ├── SchoolMandatoryDisclosures.tsx
  └── SchoolFooter.tsx
```

### 3.2 Verification, Report & Submission Flow
```
Draft Intake Payload
  ↓
universalVerificationEngine.ts
  ├── resolveCanonicalPrincipal() (websitePageRequirements.ts)
  ├── getEffectiveMediaRegistry() (mediaRegistryUtils.ts)
  ├── resolveCanonicalDocuments() (canonicalDocuments.ts)
  └── resolveRemediationDestination() (remediationRegistry.ts)
  ↓
Blocker Validation & 6-Pillar Readiness Score
  ↓
UniversalVerificationPage.tsx
  ├── Interactive Remediation Action Links (jumps to exact section)
  ├── Submission Report HTML Generator (downloadable report)
  ├── Comprehensive ZIP Exporter (JSZip)
  └── submitSchoolIntakeAction()
```

### 3.3 Commercial Order & Razorpay Flow
```
Client / Quote Builder
  ↓
/api/payments/create-order
  ↓
calculateVerifiedOrderTotal() (pricingEngine.ts)
  ↓
Razorpay Server SDK (`razorpay.ts`)
  ↓
Razorpay Standard Checkout Modal
  ↓
/api/payments/verify
  ├── verifyRazorpaySignature() (HMAC SHA256)
  ├── markOrderPaid() (supabase.ts)
  ├── Lead Conversion: status = 'CONVERTED'
  └── Project Status: project_status = 'PAID'
```
