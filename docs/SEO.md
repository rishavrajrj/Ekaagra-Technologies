# Ekaagra Technologies — Production SEO Architecture & Strategy Guide

## Overview & Brand Identity

- **Production Domain:** `https://www.ekaagratechnologies.site`
- **Brand Name:** Ekaagra Technologies
- **Primary Geographic Focus:** Motihari, East Champaran, Bihar, India
- **Core Specialization:** Custom Website Design & Development, School Web Portals, School ERP Platforms, Interactive Web Applications, Custom Software, and Android Mobile Applications.

---

## Centralized Technical SEO Architecture

All site-wide metadata, canonical URL logic, and JSON-LD structured data generators are centralized in:
`src/lib/seo.config.ts`

### 1. Canonical URLs
Every page has an absolute canonical URL configured through `createPageMetadata()` pointing strictly to `https://www.ekaagratechnologies.site`.
- No trailing slashes (except `/`)
- No query parameter leakage
- HTTP to HTTPS and non-www to www normalized

### 2. Structured Data (JSON-LD)
Schema.org structured data implemented across the application:
- **Organization Schema:** Embedded site-wide in `src/app/layout.tsx`. Contains brand name, official URL, verified logo, and areaServed.
- **WebSite Schema:** Embedded site-wide in `src/app/layout.tsx`.
- **LocalBusiness / ProfessionalService Schema:** Embedded on the Homepage and `/website-development-motihari` with exact geo-coordinates, Motihari/Bihar area served, price range, and service types.
- **Service Schema:** Embedded on each individual service page and local landing page.
- **FAQPage Schema:** Embedded dynamically on all pages with visible accordion FAQ sections (Homepage, local landing pages, pricing).
- **BreadcrumbList Schema:** Automatically emitted by `<Breadcrumbs />` component matching visual breadcrumb links.
- **Article Schema:** Embedded on all blog article pages (`/blog/[slug]`) with published date, author, headline, and publisher information.

---

## Search Intent & Route Mapping

| Search Query Theme | Target Canonical Route | Primary Keyword Focus |
|---|---|---|
| Website developer in Motihari | `/website-development-motihari` | Commercial Local Landing Page |
| Website development company in Motihari | `/website-development-motihari` | Commercial Local Landing Page |
| Web designer in Motihari | `/website-development-motihari` | Commercial Local Landing Page |
| School website development Motihari / Bihar | `/school-website-development-motihari` | Institutional Education Website |
| School ERP system in Motihari / Bihar | `/school-erp-motihari` | Institutional Software / SaaS |
| Custom software development Motihari | `/software-development-motihari` | Business Operations Software |
| Web application development Motihari | `/web-application-development-motihari` | Full-stack Web Apps & Dashboards |
| Android app development Motihari | `/android-app-development-motihari` | Mobile App & Play Store |
| Website development cost in Motihari | `/blog/website-development-cost-in-motihari-bihar` | Informational Price Breakdown |
| How to choose best web developer in Motihari | `/blog/how-to-choose-best-website-developer-in-motihari` | Buyer's Guide & Criteria |
| School website guide for Bihar principals | `/blog/school-website-development-bihar-complete-guide` | Educational Authority Content |

---

## Google Search Console Setup Checklist

1. **Add Property:** Open [Google Search Console](https://search.google.com/search-console) and add `https://www.ekaagratechnologies.site`.
2. **Verification Options:**
   - **Domain DNS Verification (Recommended):** Add a TXT record to your DNS provider (Cloudflare, Namecheap, GoDaddy, Hostinger).
   - **HTML Meta Tag:** Add verification string to `<meta name="google-site-verification" content="..." />` in `src/app/layout.tsx`.
3. **Submit Sitemap:**
   - Navigate to **Sitemaps** in the left menu.
   - Enter `sitemap.xml` and click **Submit**.
   - Verify that all routes (static, services, projects, local pages, blog posts) are discovered.
4. **URL Inspection:**
   - Use the Inspect tool on `https://www.ekaagratechnologies.site/` and `https://www.ekaagratechnologies.site/website-development-motihari`.
   - Click "Test Live URL" to ensure clean 200 responses and valid Rich Results (Organization, LocalBusiness, FAQ).
   - Click "Request Indexing".

---

## Monthly SEO Maintenance Routine

### Week 1: Performance & Indexation Audit
- Review Google Search Console **Coverage/Indexing** report for any 404s or crawl anomalies.
- Check Core Web Vitals report (LCP, INP, CLS) on mobile devices.

### Week 2: Content & Keyword Tracking
- Monitor rankings for core keyword clusters:
  - *website developer in Motihari*
  - *website design Motihari*
  - *school ERP Motihari*
  - *school website developer Bihar*
- Note top query impressions and click-through rates (CTR) in Search Console.

### Week 3: Content Expansion
- Publish 1 new article according to the 6-month content calendar (see `LOCAL-SEO.md`).
- Add internal links from the new article to relevant service landing pages.

### Week 4: Technical & Security Review
- Verify SSL certificate status.
- Review lead database submissions and test WhatsApp inquiry triggers.
- Run `npm run lint` and `npm run build` locally to ensure zero build regressions.
