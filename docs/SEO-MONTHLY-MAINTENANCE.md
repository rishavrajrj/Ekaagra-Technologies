# Monthly Technical SEO Maintenance & Ranking Milestones Playbook

## 1. Monthly Technical Health Checklist

Perform these routine technical verifications on the first Monday of every month:

### 1. Sitemap & Robots Health
- [ ] Visit `https://www.ekaagratechnologies.site/sitemap.xml` directly in a browser.
- [ ] Confirm all URLs return HTTP 200 and reflect the production domain.
- [ ] Ensure redirected URLs (such as `/blog/how-to-choose-best-website-developer-in-motihari`) do NOT appear in the sitemap.
- [ ] Visit `https://www.ekaagratechnologies.site/robots.txt` and confirm `/admin/` and `/api/` remain disallowed while `/` is allowed.

### 2. Broken Links & Redirect Audit
- [ ] Test internal links across the primary navigation and footer.
- [ ] Verify that all service cards, case study buttons, and blog read-more links navigate cleanly without 404 errors.
- [ ] Verify that the 301 redirect from `/blog/how-to-choose-best-website-developer-in-motihari` to `/blog/best-website-developer-motihari` is functioning properly.

### 3. Schema & Structured Data Quality
- [ ] Open the [Google Rich Results Test](https://search.google.com/test/rich-results) and test:
  - Homepage (`https://www.ekaagratechnologies.site/`) &rarr; Valid `LocalBusiness`, `Organization`, `WebSite`, `FAQPage`.
  - Flagship page (`/website-development-motihari`) &rarr; Valid `Service`, `FAQPage`, `BreadcrumbList`.
  - Blog article (`/blog/best-website-developer-motihari`) &rarr; Valid `Article`, `BreadcrumbList`.

### 4. Core Web Vitals & Mobile Performance
- [ ] Run a quick Lighthouse audit on mobile emulation for `/website-development-motihari`.
- [ ] Ensure Performance > 90, SEO = 100, Accessibility > 95.

---

## 2. Quarterly Content Freshness & Pricing Audit System

Every 90 days (March, June, September, December), conduct a formal content refresh:
1. **Pricing Review:** Audit `/pricing` and `/blog/website-development-cost-in-motihari-bihar` to ensure advertised base prices (e.g. ₹15,000 Starter) remain accurate.
2. **Case Study Updates:** Add newly launched client projects to `src/lib/data.ts` and add screenshots.
3. **Date Modified Updates:** When substantive enhancements are made to blog articles, update the `dateModified` field in `src/lib/blog-data.ts`. Never modify publication dates for superficial cosmetic changes.

---

## 3. Realistic 7-Stage Ranking Milestones (No False Guarantees)

Google Search rankings develop progressively over time. Success is measured through milestones:

- **Stage 1: Crawl & Discovery (Days 1–14):** Googlebot crawls the deployed sitemap and discovers all 34 canonical routes.
- **Stage 2: Indexation (Days 14–30):** All submitted public routes show as "Indexed" in Google Search Console.
- **Stage 3: Initial Impressions (Month 2):** Long-tail queries (e.g. *"website development cost in Motihari"*, *"school ERP Roshani"*) begin generating search impressions.
- **Stage 4: Long-Tail Positions 20–50 (Month 2–3):** Pages enter the search results index for secondary local queries.
- **Stage 5: Striking Distance Positions 10–20 (Month 3–4):** Core queries (*"website developer in Motihari"*) move toward page 1.
- **Stage 6: Top 10 Commercial Visibility (Month 5–6):** Optimized local pages and Google Business Profile rank in prominent mobile search positions.
- **Stage 7: Sustainable Local Authority & Inbound Leads (Month 6+):** Inbound WhatsApp chats, phone inquiries, and proposal requests arrive consistently from organic searchers.
