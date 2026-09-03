# Google Search Console — Complete Setup, Verification & Indexing Playbook

This document provides the business owner with exact, step-by-step instructions to connect, verify, submit, and monitor **Ekaagra Technologies** in Google Search Console.

---

## Step 1: Add Property in Google Search Console

1. Visit [https://search.google.com/search-console](https://search.google.com/search-console) and sign in with the official business Google account (`ekaagratechnologies@gmail.com`).
2. Click **Add Property** in the top-left dropdown.
3. Choose one of two property types:
   - **Option A (Recommended) — Domain Property:**
     - Enter: `ekaagratechnologies.site` (without `https://` or `www`).
     - Covers all subdomains (`www`, non-www, `m.`, etc.) and all protocols (`http`, `https`).
   - **Option B — URL Prefix Property:**
     - Enter: `https://www.ekaagratechnologies.site/`.

---

## Step 2: Complete Ownership Verification

### Method 1: DNS TXT Record (Required for Domain Property)
1. In Search Console, copy the generated `google-site-verification=...` TXT record value.
2. Log into your domain registrar / DNS management dashboard (e.g. Cloudflare, Namecheap, Hostinger, GoDaddy).
3. Navigate to **DNS Management** for `ekaagratechnologies.site`.
4. Add a new record:
   - **Type:** `TXT`
   - **Name / Host:** `@` (or `ekaagratechnologies.site`)
   - **Value:** `google-site-verification=YOUR_UNIQUE_TOKEN_HERE`
   - **TTL:** Auto or 300 seconds
5. Save the record, wait 2–5 minutes for DNS propagation, then click **Verify** in Google Search Console.

### Method 2: HTML Meta Tag (For URL Prefix Property)
If you prefer HTML meta tag verification, provide the verification code to be placed in `src/app/layout.tsx`:
```html
<meta name="google-site-verification" content="OWNER_VERIFICATION_TOKEN_HERE" />
```
*(Note: Never fabricate a token. Use the exact code provided by your Search Console account.)*

---

## Step 3: Submit the XML Sitemap

1. In Google Search Console, click **Sitemaps** in the left-hand navigation under the *Indexing* tab.
2. In the **Add a new sitemap** field, enter:
   ```text
   sitemap.xml
   ```
   *(The full URL will be: `https://www.ekaagratechnologies.site/sitemap.xml`)*
3. Click **Submit**.
4. Confirm status changes to **Success** (green).
5. Verify that Google discovers all 34 submitted canonical pages.

---

## Step 4: Priority URL Inspection & Indexing Requests

Do not wait for Googlebot's natural crawl schedule to discover your new local pages. Use the **URL Inspection Tool** to expedite immediate discovery.

### Priority 1: Primary Commercial Pages (Inspect Day 1)
1. Paste `https://www.ekaagratechnologies.site/` in the top search bar.
   - Click **Test Live URL**. Verify HTTP 200 and valid detected rich results (`Organization`, `LocalBusiness`).
   - Click **Request Indexing**.
2. Paste `https://www.ekaagratechnologies.site/website-development-motihari`.
   - Click **Test Live URL**. Verify detected rich results (`LocalBusiness`, `Service`, `FAQPage`).
   - Click **Request Indexing**.

### Priority 2: Institutional & Service Pages (Inspect Day 2)
1. `https://www.ekaagratechnologies.site/school-website-development-motihari`
2. `https://www.ekaagratechnologies.site/school-erp-motihari`
3. `https://www.ekaagratechnologies.site/services`
4. `https://www.ekaagratechnologies.site/projects`

### Priority 3: Informational Guides (Inspect Day 3)
1. `https://www.ekaagratechnologies.site/blog/best-website-developer-motihari`
2. `https://www.ekaagratechnologies.site/blog/website-development-cost-in-motihari-bihar`
3. `https://www.ekaagratechnologies.site/blog/school-website-development-bihar-complete-guide`

---

## Step 5: Ongoing Performance & Health Monitoring Routine

Check Google Search Console on a regular weekly and monthly rhythm:

### 1. Indexing Coverage Report (Weekly)
- Navigate to **Pages** under *Indexing*.
- Ensure indexable pages are classified as **Indexed**.
- Check that `/admin/*` and `/api/*` appear under *Excluded by ‘noindex’ tag* or *Blocked by robots.txt* (expected behavior).
- Ensure there are zero 5xx server errors or broken 404 errors.

### 2. Search Performance & Query Tracking (Bi-weekly)
- Navigate to **Performance → Search results**.
- Check all 4 metrics: **Total Clicks**, **Total Impressions**, **Average CTR**, and **Average Position**.
- Set filter to **Date: Last 28 days** and **Country: India**.
- Track organic performance for target queries:
  - *website developer in Motihari*
  - *website development company in Motihari*
  - *school ERP Motihari*
  - *school website design Bihar*
  - *Ekaagra Technologies*

### 3. Core Web Vitals & Page Experience (Monthly)
- Navigate to **Core Web Vitals** under *Experience*.
- Review Mobile and Desktop status:
  - **LCP (Largest Contentful Paint):** < 2.5 seconds (Good)
  - **INP (Interaction to Next Paint):** < 200 milliseconds (Good)
  - **CLS (Cumulative Layout Shift):** < 0.1 (Good)
- Our Next.js 16 edge architecture is pre-optimized to comfortably meet all three thresholds.

---

## Step 6: Search Console Optimization Feedback Loop

Use real user search data to continuously strengthen rankings:

```text
High Impressions, Low CTR (>100 imp, <2% CTR)
  ↳ Improve Page Title & Meta Description to be more compelling and benefit-driven.

Query Ranking on Positions 8–20 (Striking Distance)
  ↳ Enhance content depth on the target page.
  ↳ Add supporting internal links from relevant blog articles.

Emerging Query Themes Discovered
  ↳ Write a new targeted blog article answering the specific user question.
  ↳ Link back to the primary commercial service page.
```
