# Google Indexation Launch & Search Console Handoff Playbook

## 1. Owner-Level Governance & Boundaries

> [!IMPORTANT]
> **Codebase Limitation & Owner Responsibility**:
> Next.js source code can generate valid schemas, HTML metadata, and XML sitemaps, but **the codebase cannot verify domain ownership or submit URLs in Google Search Console**. 
> 
> The site owner (`ekaagratechnologies@gmail.com`) must complete the external verification and inspection steps below.

---

## 2. Step-by-Step Owner Verification & Indexation Workflow

### Step 1: Verify Domain Property Ownership (DNS TXT)
1. Sign in to [search.google.com/search-console](https://search.google.com/search-console).
2. Choose **Domain** property type and enter: `ekaagratechnologies.site`.
3. Copy the TXT verification token provided by Google.
4. Log in to your domain registrar DNS panel (e.g. Hostinger, GoDaddy, Cloudflare) and add a TXT record for `@` with the token.
5. In Search Console, click **Verify**. (Verification completes in 1–5 minutes).

### Step 2: Submit the XML Sitemap
1. Navigate to **Indexing &rarr; Sitemaps** in the left sidebar.
2. In the *Add a new sitemap* field, enter: `sitemap.xml`.
3. Click **Submit**.
4. Confirm the status turns green (**Success**) and discovers all **34 Canonical Sitemap URLs**.

### Step 3: Priority Indexation Order (Request Indexing)
Use the top Search Console search bar (**URL Inspection tool**) to inspect and request indexing according to this strict priority schedule:

```text
Priority 1 (Day 1)
  └── https://www.ekaagratechnologies.site/

Priority 2 (Day 1)
  └── https://www.ekaagratechnologies.site/website-development-motihari

Priority 3 (Day 2)
  ├── https://www.ekaagratechnologies.site/school-website-development-motihari
  └── https://www.ekaagratechnologies.site/school-erp-motihari

Priority 4 (Day 3)
  ├── https://www.ekaagratechnologies.site/software-development-motihari
  ├── https://www.ekaagratechnologies.site/web-application-development-motihari
  └── https://www.ekaagratechnologies.site/android-app-development-motihari

Priority 5 (Day 4 — Case Studies)
  ├── https://www.ekaagratechnologies.site/projects/roshani-public-school
  ├── https://www.ekaagratechnologies.site/projects/roshani-public-school-erp
  └── https://www.ekaagratechnologies.site/projects/palak-enterprises

Priority 6 (Day 5 — Authority Blog Content)
  ├── https://www.ekaagratechnologies.site/blog/best-website-developer-motihari
  └── https://www.ekaagratechnologies.site/blog/website-development-cost-in-motihari-bihar
```

*Note: Do not spam "Request Indexing" repeatedly on the same URL. Once submitted, Google queues the URL for crawling within 24 to 72 hours.*

---

## 3. Strict Search Console Terminology Guide

Do not confuse Google search stages. They represent distinct phases of discovery:

1. **Canonical Sitemap URLs:** The 34 verified URLs provided in `sitemap.xml`.
2. **Crawled:** Googlebot has fetched and rendered the HTML of the URL.
3. **Indexed:** Google has evaluated the content and stored the URL in its searchable database.
4. **Ranking:** Google displays the URL on search result pages for relevant queries.
5. **Traffic:** A human searcher clicks on your search result snippet and enters the site.
6. **Conversion:** The visitor takes a commercial action (clicks WhatsApp, calls, or requests a proposal).

---

## 4. Accurate Core Web Vitals Terminology

Do not confuse synthetic development performance with Google's Core Web Vitals:
- **Local Build Speed / Turbopack Compilation:** Internal developer measurement (e.g. 1058ms build).
- **Lighthouse Score:** A synthetic, simulated lab test run on an emulated mobile device.
- **Core Web Vitals (Real User Metrics):** Real field data collected by Google from actual Chrome users over a 28-day rolling window:
  - **LCP (Largest Contentful Paint):** Target < 2.5 seconds.
  - **INP (Interaction to Next Paint):** Target < 200 milliseconds.
  - **CLS (Cumulative Layout Shift):** Target < 0.1.
- *Note:* New websites will display *"Insufficient data to show Core Web Vitals"* in Search Console until enough real visitors access the site via Chrome.
