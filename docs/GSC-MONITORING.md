# Google Search Console (GSC) Monitoring, Query Analysis & Health Playbook

This operational playbook guides the business owner through ongoing performance analysis, indexing verification, and conversion intelligence using Google Search Console.

---

## 1. Owner-Only Setup & Verification (Execute Once)

> [!IMPORTANT]
> **Owner Action Required**:
> 1. Sign in to [search.google.com/search-console](https://search.google.com/search-console) with `ekaagratechnologies@gmail.com`.
> 2. Add Domain property: `ekaagratechnologies.site`.
> 3. Add the generated DNS TXT verification token in your domain DNS management panel.
> 4. Go to **Indexing &rarr; Sitemaps**, enter `sitemap.xml`, and click **Submit**.
> 5. Confirm that status reports **Success** and all 34 canonical URLs are discovered.

---

## 2. Weekly Health & Index Coverage Monitoring

Perform this 5-minute health check every Monday:

1. **Check Indexing Coverage (*Pages* report):**
   - **Indexed Pages:** Should equal or trend toward the 34 submitted sitemap URLs.
   - **Excluded / Not Indexed:** Expected for `/admin/*` and `/api/*` (disallowed in `robots.txt`).
   - **Errors (Red):** Must be **0**. If any 5xx server errors or broken 404s appear, investigate immediately.

2. **Check Core Web Vitals (*Experience* tab):**
   - **LCP (Largest Contentful Paint):** < 2.5s (Good)
   - **INP (Interaction to Next Paint):** < 200ms (Good)
   - **CLS (Cumulative Layout Shift):** < 0.1 (Good)
   - *Note:* Next.js static prerendering ensures Ekaagra pages naturally pass these thresholds.

---

## 3. Search Query Analysis Framework

Navigate to **Performance &rarr; Search Results** (Filters: Date = Last 28 Days, Country = India). Track queries across 3 key clusters:

### Cluster A: Branded Entity Queries
*Queries: `Ekaagra Technologies`, `Ekaagra`, `Ekaagra Technologies Motihari`*
- **What to look for:** Position should be 1.0. CTR should exceed 40%+.
- **Health check:** If CTR is low, verify that your homepage meta title and description are rendering cleanly without truncation.

### Cluster B: Commercial Local Queries
*Queries: `website developer in Motihari`, `website development Motihari`, `web designer Motihari`, `web development company in Motihari`*
- **Primary Landing Page:** `/website-development-motihari`
- **Target Metrics:** Growing impressions weekly; position improving from 30+ &rarr; 10–20 &rarr; Top 3.

### Cluster C: Educational Technology Queries
*Queries: `school website development Motihari`, `school ERP Motihari`, `school management software Bihar`, `CBSE school website design`*
- **Primary Landing Pages:** `/school-website-development-motihari`, `/school-erp-motihari`
- **Target Metrics:** Gaining traction among school trustees and principals in North Bihar.

---

## 4. CTR Optimization Protocol (Striking Distance Queries)

Identify high-opportunity pages using this exact filter in Search Console:
1. Filter queries by **Impressions > 100** and **Average Position between 4.0 and 20.0**.
2. Identify queries with a **CTR below 3.0%**.

### Why Low CTR Happens:
Searchers see your snippet in Google results, but click on a competitor instead.

### Action Plan to Improve CTR:
- **Do NOT change the URL** (this resets accumulated Google ranking history).
- **Refine the Meta Title**: Make the benefit more compelling, include starting price qualification or turnaround speed:
  - *Current:* `Website Development Company in Motihari | Ekaagra Technologies`
  - *Test Variant:* `Website Design & Development in Motihari, Bihar (₹15,000 Base) | Ekaagra`
- **Refine the Meta Description**: Include direct call-to-actions:
  - *"Custom, fast websites built for Motihari businesses and schools. 100% code ownership, WhatsApp lead capture & 24h proposal turnaround. Get your quote."*
- Log the date in [`docs/SEO-METRICS-BASELINE.md`](file:///d:/Antigravity%20Projects/Ekaagra%20Technologies/docs/SEO-METRICS-BASELINE.md) and review click movement 21 days later.

---

## 5. Identifying Genuine Content Gaps

When reviewing Search Console queries, look for queries with rising impressions that do not have a dedicated landing page.
- If searchers query *"e-commerce website developer in Motihari"*, evaluate whether to add a dedicated e-commerce section to `/website-development-motihari` or write an informative guide.
- **Rule:** Never publish a new page unless real Search Console search data proves an unmet user intent.
