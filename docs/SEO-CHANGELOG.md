# SEO Experimental Changelog & Governance Engines

## 1. Governance Rules: Technical & Content Freeze

### A. Technical Architecture Freeze (Active)
Unless a critical security vulnerability or verified indexing bug is detected, the following systems are **FROZEN**:
- **URL Structure & Slugs:** Frozen across all 34 canonical routes.
- **Canonical Strategy:** Frozen to `https://www.ekaagratechnologies.site`.
- **Sitemap Generator:** Frozen to pure 34 canonical routes (`sitemap.ts`).
- **Robots Rules:** Frozen to blocking `/admin/` and `/api/` while permitting public crawling.
- **Structured Data Schemas:** Frozen across `Organization`, `WebSite`, `LocalBusiness`, `Service`, `Article`, `FAQPage`, and `BreadcrumbList`.

### B. Content Freeze Rule (Active)
Before proposing or drafting ANY new page or article, the author must answer "YES" to all 5 criteria:
1. **Verified User Search Intent:** Does Google Search Console or keyword research demonstrate real search demand?
2. **Existing Content Inadequacy:** Can the intent be addressed by enhancing an existing canonical page instead?
3. **Cannibalization Safety:** Will this new page compete with existing landing pages? (Must check `docs/KEYWORD-CANNIBALIZATION-AUDIT.md`).
4. **Unique Commercial Value:** Does it provide genuine, non-repetitive regional insights?
5. **Clear Conversion Pathway:** Does it connect naturally to a core service or quote funnel?

---

## 2. Experimental Optimization Engines

### A. Striking-Distance Engine (Positions 4.0 – 20.0)
When Search Console telemetry reveals queries with high impression volume ranking in positions 4.0 through 20.0:
1. Review target page against top 3 competitors in Motihari/Bihar.
2. Enrich introductory paragraph with clearer answers to the specific query.
3. Add supporting internal links from relevant blog articles with natural anchor variations.
4. Add 1 relevant FAQ answering searcher questions directly.
5. Log the experiment in the table below and wait 21–28 days before measuring results.

### B. Low-CTR Optimization Engine
When a page has **High Impressions (>100) + Low CTR (<3.0%)**:
1. Keep the URL identical (never alter URLs during CTR testing).
2. Test a more benefit-driven, localized meta title.
3. Add clear value qualifiers (e.g. *"Starting ₹15,000 Base"*, *"CBSE Disclosure Ready"*).
4. Record the OLD title, NEW title, DATE, and 30-day RESULT in the changelog.

---

## 3. SEO Experimental Changelog Table

| Date | Target URL | Parameter Changed | Reason & Hypothesis | Expected Effect | Actual Measured Effect (30-Day Audit) |
|---|---|---|---|---|---|
| **2026-09-03** | Entire Domain | MetadataBase & Canonical Origin | Consolidate domain from legacy `.in` to official `https://www.ekaagratechnologies.site` | Eliminate split domain signals & establish canonical authority | Pending live Vercel deployment |
| **2026-09-03** | `/website-development-motihari` | Full Page Architecture | Upgrade flagship page into 10-step high-converting local commercial pillar | Capture core search queries and reduce bounce rates | Pending indexation |
| **2026-09-03** | `/blog/how-to-choose-best-website-developer-in-motihari` | 301 Server Redirect | Eliminate keyword cannibalization with `/blog/best-website-developer-motihari` | Direct 100% link equity to canonical article | Prerender removed; 301 active in `next.config.ts` |
| **2026-09-03** | `/blog/website-development-cost-in-motihari-bihar` | Content & Pricing Matrix | Answer price search intent transparently with 5-tier breakdown | Capture featured snippets and drive quote inquiries | Baseline pending |
| **2026-09-03** | `/projects/[slug]` | Case Study Service Attribution | Add *Why This Approach* & *Verified Outcome* + Service link cards | Increase case study trust & guide visitors to commercial services | Active in project template |
| **2026-09-03** | Global Components | Analytics Event Dispatchers | Wire conversion tracking (`whatsapp_click`, form submissions, project clicks) | Enable privacy-safe conversion attribution without PII | Active in `src/lib/analytics.ts` |
| *[Pending Data]* | *[Target URL]* | *[Title/Meta/Content]* | *[Hypothesis based on GSC]* | *[Expected CTR/Pos]* | *[To be recorded post-experiment]* |
