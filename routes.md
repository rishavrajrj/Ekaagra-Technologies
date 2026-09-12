# ROUTING INTELLIGENCE & ROUTES TABLE
**System**: Ekaagra Technologies Platform  
**Framework**: Next.js 16.3.0 App Router  
**Last Verified**: September 2026

---

## 1. Overview & Routing Architecture
The application uses the Next.js App Router (`src/app`), employing Server Components by default with client boundary declarations (`'use client'`) where interactivity, forms, or browser APIs are required.

### Routing Tiers:
1. **Public Marketing & Agency**: Corporate presence, service offerings, portfolio showcase, pricing configurators, quote builders, process walkthroughs, and blog.
2. **Hyper-Local SEO Pages**: Programmatic landing pages optimized for search queries in Motihari, Champaran, and Bihar (Software, Web, Mobile, ERP).
3. **Legal & Compliance**: Statutory terms, privacy policies, refund and delivery guidelines, and CBSE Appendix IX disclosures.
4. **Commercial Checkout & Invoicing**: Order generation, Razorpay payment processing, and milestone billing portals.
5. **Tokenized Client Portals**: Token-authenticated portals for corporate requirements intake and interactive Figma/Stitch design reviews.
6. **Institutional School Platform**: Multi-chapter school onboarding wizard, centralized media registry, universal verification engine, and dynamic multi-school website generation engine.
7. **Executive Operations Admin**: Cryptographically signed cookie-session protected backoffice for CRM leads, orders, projects, and school intakes.
8. **API Route Handlers**: Edge & Node.js HTTP endpoints for assets, payments, domain DNS queries, geocoding, and live bus GPS tracking.

---

## 2. Master Routes Table

| Route | Source File | Type | Rendering Mode | Auth / Security | Description & Target Audience |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Page | Server Component | Public | Corporate Homepage with interactive 3D hero, testimonials, featured work, and agency trust signals. |
| `/about` | `src/app/about/page.tsx` | Page | Server Component | Public | Company philosophy, technical standards, Bihar technology vision, and founding leadership. |
| `/services` | `src/app/services/page.tsx` | Page | Server Component | Public | Catalog of engineering services (Web, Mobile, Cloud, ERP, Custom Software, AI). |
| `/services/[slug]` | `src/app/services/[slug]/page.tsx` | Page | Server Component (Dynamic) | Public | Deep-dive capability pages for individual services with technology stacks and scope. |
| `/solutions` | `src/app/solutions/page.tsx` | Redirect | Server (301 Permanent) | Public | Permanent redirect to `/services#industries` via `next.config.ts`. |
| `/projects` | `src/app/projects/page.tsx` | Page | Server Component | Public | Portfolio index featuring Palak Printing Press, Roshani School, and custom software. |
| `/projects/[slug]` | `src/app/projects/[slug]/page.tsx` | Page | Server Component (Dynamic) | Public | Project case study highlighting client problem, technical architecture, and impact metrics. |
| `/pricing` | `src/app/pricing/page.tsx` | Page | Server Component | Public | Transparent engineering pricing tiers, website maintenance slabs, and interactive comparison. |
| `/process` | `src/app/process/page.tsx` | Page | Server Component | Public | 6-stage engineering lifecycle from requirements discovery to production deployment. |
| `/get-quote` | `src/app/get-quote/page.tsx` | Page | Client Component | Public | Interactive Plan-First Website & Software Quote Builder with real-time price calculation. |
| `/contact` | `src/app/contact/page.tsx` | Page | Client Component | Public | Multi-channel contact desk, inquiry submission, Google Map office embed, and direct WhatsApp. |
| `/blog` | `src/app/blog/page.tsx` | Page | Server Component | Public | Technical blog, web standards guide, digital transformation, and regional technology insights. |
| `/blog/[slug]` | `src/app/blog/[slug]/page.tsx` | Page | Server Component (Dynamic) | Public | Individual technical articles with structured schema markup (`Article` JSON-LD). |
| `/android-app-development-motihari` | `src/app/android-app-development-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for native and cross-platform Android mobile app engineering. |
| `/school-erp-motihari` | `src/app/school-erp-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for school management software, fees, exams, and attendance. |
| `/school-website-development-motihari` | `src/app/school-website-development-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for school portals, CBSE compliance, and mobile responsive websites. |
| `/software-development-motihari` | `src/app/software-development-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for bespoke software, inventory, billing, and enterprise tools. |
| `/web-application-development-motihari` | `src/app/web-application-development-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for SaaS platforms, cloud dashboards, and React web applications. |
| `/website-development-motihari` | `src/app/website-development-motihari/page.tsx` | Page | Server Component | Public | Localized landing page for modern fast business websites, SEO, and CMS solutions. |
| `/terms` | `src/app/terms/page.tsx` | Page | Server Component | Public | Commercial terms of service, payment milestones, IP ownership, and warranties. |
| `/privacy` | `src/app/privacy/page.tsx` | Page | Server Component | Public | Data protection, DPDP Act compliance, cookies, and client confidentiality standards. |
| `/refund-policy` | `src/app/refund-policy/page.tsx` | Page | Server Component | Public | Clear milestone refund policy and cancellation guidelines. |
| `/delivery-policy` | `src/app/delivery-policy/page.tsx` | Page | Server Component | Public | Digital deliverables handover, milestone delivery timelines, and acceptance criteria. |
| `/mandatory-disclosures` | `src/app/mandatory-disclosures/page.tsx` | Page | Server Component | Public | Centralized mandatory public disclosure registry and regulatory compliance index. |
| `/pay/[orderNumber]` | `src/app/pay/[orderNumber]/page.tsx` | Page | Client Component | Public (Order-Scoped) | Direct customer checkout portal: fetches order details by number and opens Razorpay SDK. |
| `/checkout/success` | `src/app/checkout/success/page.tsx` | Page | Client Component | Public (Order-Scoped) | Post-payment confirmation page with transaction receipt, delivery timeline, and client next steps. |
| `/checkout/failed` | `src/app/checkout/failed/page.tsx` | Page | Client Component | Public (Order-Scoped) | Payment failure resolution page with retry triggers and direct assistance contact. |
| `/business-requirements/[token]` | `src/app/business-requirements/[token]/page.tsx` | Page | Client Component | Token-Protected | Client self-service intake portal for corporate software requirements, branding, and assets. |
| `/design-review/[token]` | `src/app/design-review/[token]/page.tsx` | Page | Client Component | Token-Protected | Interactive client portal for Figma prototype review, section approval, and change requests. |
| `/school-onboarding/[token]` | `src/app/school-onboarding/[token]/page.tsx` | Page | Client Component | Token-Protected | Canonical 32-section institutional onboarding portal with auto-save and asset checklist. |
| `/schools/onboarding/portal` | `src/app/schools/onboarding/portal/page.tsx` | Page | Client Component | Public/Demo | Direct launcher for school onboarding with token parameter or demo sandbox mode. |
| `/schools/onboarding/[token]` | `src/app/schools/onboarding/[token]/page.tsx` | Page | Client Component | Token-Protected | Aliased onboarding route matching institutional platform URL conventions. |
| `/schools/onboarding/[token]/final-review` | `src/app/schools/onboarding/[token]/final-review/page.tsx` | Page | Client Component | Token-Protected | Universal verification command center: blocker engine, compliance audit, and live preview. |
| `/schools` | `src/app/schools/page.tsx` | Page | Server Component | Public | Directory of institutional portals deployed on the Ekaagra School Website Engine. |
| `/schools/configure` | `src/app/schools/configure/page.tsx` | Page | Client Component | Public/Config | Interactive school product tier and addon configurator with live fee projections. |
| `/schools/[slug]` | `src/app/schools/[slug]/page.tsx` | Page | Server Component (Dynamic) | Public | Multi-tenant school website engine: renders complete institutional website from DB record. |
| `/schools/[slug]/transport` | `src/app/schools/[slug]/transport/page.tsx` | Page | Client Component | Public | Dedicated public transit portal: interactive bus routes, stops, and live GPS vehicle tracking. |
| `/admin` | `src/app/admin/page.tsx` | Page | Server Component | Admin Session Cookie | Executive operations dashboard: overview stats, lead funnel, orders, and project statuses. |
| `/admin/login` | `src/app/admin/login/page.tsx` | Page | Client Component | Public | Administrator login console with cryptographic session cookie issuance. |
| `/admin/leads` | `src/app/admin/leads/page.tsx` | Page | Server Component | Admin Session Cookie | Lead CRM: search, filter by domain/status, edit notes, update stages, and initiate onboarding. |
| `/admin/business-projects` | `src/app/admin/business-projects/page.tsx` | Page | Server Component | Admin Session Cookie | Corporate projects management hub: milestone tracking, requirements status, and client links. |
| `/admin/business-projects/[id]` | `src/app/admin/business-projects/[id]/page.tsx` | Page | Server Component (Dynamic) | Admin Session Cookie | Detailed workspace for a single business project: requirements review, design feedback, and logs. |
| `/admin/school-projects` | `src/app/admin/school-projects/page.tsx` | Page | Server Component | Admin Session Cookie | Schools onboarding fleet management: intake progress, blocker alerts, and platform handoffs. |
| `/admin/school-projects/[id]` | `src/app/admin/school-projects/[id]/page.tsx` | Page | Server Component (Dynamic) | Admin Session Cookie | Comprehensive school project workspace: universal verification review and database sync. |
| `/admin/orders` | `src/app/admin/orders/page.tsx` | Page | Server Component | Admin Session Cookie | Financial ledger: Razorpay transactions, order reconciliation, revenue stats, and customer audit. |

---

## 3. API Route Endpoints

| Method | Route | File Path | Auth Requirement | Purpose & Payload |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/business-assets/upload` | `src/app/api/business-assets/upload/route.ts` | Token / Admin | Upload corporate requirement assets (logos, documents). Enforces MIME & Sharp WebP. |
| `GET` | `/api/business-assets/view` | `src/app/api/business-assets/view/route.ts` | Token / Signed URL | Streams private uploaded corporate assets with content-disposition and access validation. |
| `GET` | `/api/domain/check` | `src/app/api/domain/check/route.ts` | Public (Rate Limited) | Queries real-time domain availability and renewal pricing via DNS / Registrar provider API. |
| `POST` | `/api/geo/resolve-maps-url` | `src/app/api/geo/resolve-maps-url/route.ts` | Public / Onboarding | Follows shortened Google Maps links (goo.gl, maps.app) and extracts GPS coordinates. |
| `POST` | `/api/payments/create-order` | `src/app/api/payments/create-order/route.ts` | Public | Server-authoritative order calculation and Razorpay order creation (in paise). Zero client trust. |
| `POST` | `/api/payments/verify` | `src/app/api/payments/verify/route.ts` | Public | Validates Razorpay HMAC SHA256 signature, updates order to PAID, and triggers lead conversion. |
| `POST` | `/api/payments/webhook` | `src/app/api/payments/webhook/route.ts` | Razorpay Webhook Secret | Asynchronous webhook receiver for payment capture, failure events, and audit logging. |
| `POST` | `/api/school-assets/upload` | `src/app/api/school-assets/upload/route.ts` | Valid Onboarding Token | Uploads school photos and compliance PDFs. Runs magic byte check, malware scan, and WebP conversion. |
| `GET` | `/api/school-assets/download` | `src/app/api/school-assets/download/route.ts` | Valid Onboarding Token | Authorized streaming download for sensitive compliance certificates (NOC, Affiliation, Fire Safety). |
| `DELETE` / `POST` | `/api/school-assets/delete` | `src/app/api/school-assets/delete/route.ts` | Valid Onboarding Token | Deletes uploaded asset from storage and disassociates it from the centralized media registry. |
| `POST` | `/api/school-assets/staff-photo` | `src/app/api/school-assets/staff-photo/route.ts` | Valid Onboarding Token | Optimized square portrait upload for teachers and administrators with automatic face centering. |
| `POST` | `/api/school-assets/student-photo` | `src/app/api/school-assets/student-photo/route.ts` | Valid Onboarding Token | Passport-size portrait upload for student roster records with dimension constraints. |
| `GET` | `/api/school-media/template` | `src/app/api/school-media/template/route.ts` | Valid Onboarding Token | Generates dynamic pre-formatted Excel/CSV templates for staff and student roster uploads. |
| `GET` / `POST` | `/api/transport/live-location` | `src/app/api/transport/live-location/route.ts` | Public (GET) / Driver (POST) | Ingests real-time vehicle GPS coordinates from bus drivers and broadcasts active transit positions. |
| `GET` | `/mandatory-disclosure` | `src/app/mandatory-disclosure/route.ts` | Public | Serves statutory CBSE Appendix IX JSON specification for regulatory web scrapers. |

---

## 4. Metadata & SEO Endpoints
- `/sitemap.xml`: Generated dynamically by `src/app/sitemap.ts`. Includes all static pages, active service slugs, project case studies, blog posts, and localized Motihari landing pages.
- `/robots.txt`: Configured via `src/app/robots.ts`. Explicitly disallows `/admin/`, `/business-requirements/`, `/design-review/`, and `/school-onboarding/` while allowing Googlebot across all public content.
- `/opengraph-image`: Generated by `src/app/opengraph-image.tsx` using `@vercel/og` Edge image generation for high-impact social preview sharing.
