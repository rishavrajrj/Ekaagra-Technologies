# Ekaagra Technologies — Route Indexability & Canonical Matrix

> **Authoritative Route Count Statement**:  
> *"The production application contains 40 total application routes, of which 34 are canonical public indexable HTML URLs included in the sitemap. Redirect, NOINDEX, and API routes are excluded from the canonical sitemap."*

---

## 1. Route Status Definitions
- **`INDEX`**: Intended for public search engine discovery. Rendered with clean canonical URL, included in `sitemap.xml`, and allowed in `robots.txt`.
- **`REDIRECT`**: Legacy duplicate URL returning an HTTP 301 permanent server redirect to its canonical target. Excluded from sitemap.
- **`NOINDEX`**: Functional utility page protected by `<meta name="robots" content="noindex, nofollow" />`. Excluded from sitemap.
- **`BLOCKED`**: Private administrative or API endpoint disallowed in `robots.txt`. Excluded from sitemap.
- **`SYSTEM`**: Dynamic system endpoint generating sitemaps, robots directives, error pages, or social graph cards. Excluded from sitemap.

---

## 2. Canonical Public Indexable HTML Routes (Exactly 34 URLs in Sitemap)

| # | Route URL Path | Status | Indexable | Canonical URL | Sitemap | Strategic Purpose |
|---|---|---|---|---|---|---|
| 1 | `/` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/` | Included | Main brand homepage & digital studio introduction |
| 2 | `/about` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/about` | Included | Studio background, engineering ethos, team |
| 3 | `/services` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services` | Included | Service catalog hub & overview |
| 4 | `/solutions` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/solutions` | Included | Industry-tailored digital solutions hub |
| 5 | `/projects` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects` | Included | Real client case studies showcase |
| 6 | `/pricing` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/pricing` | Included | Transparent package pricing & tiers |
| 7 | `/process` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/process` | Included | 5-step development & delivery methodology |
| 8 | `/blog` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/blog` | Included | Educational blog and market resource directory |
| 9 | `/contact` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/contact` | Included | General inquiry & direct WhatsApp contact hub |
| 10 | `/get-quote` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/get-quote` | Included | Multi-step customized proposal request funnel |
| 11 | `/website-development-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/website-development-motihari` | Included | **Flagship Local Commercial Landing Page** |
| 12 | `/school-website-development-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/school-website-development-motihari` | Included | Local education institution landing page |
| 13 | `/school-erp-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/school-erp-motihari` | Included | School management software & ERP landing page |
| 14 | `/software-development-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/software-development-motihari` | Included | Custom business software landing page |
| 15 | `/web-application-development-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/web-application-development-motihari` | Included | SaaS & cloud portal landing page |
| 16 | `/android-app-development-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/android-app-development-motihari` | Included | Mobile app development landing page |
| 17 | `/services/website-development` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/website-development` | Included | Core Service: Custom website design & dev |
| 18 | `/services/web-application-development` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/web-application-development` | Included | Core Service: Custom web applications |
| 19 | `/services/android-development` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/android-development` | Included | Core Service: Native Android applications |
| 20 | `/services/school-management-erp` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/school-management-erp` | Included | Core Service: Institutional school ERP |
| 21 | `/services/ui-ux-design` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/ui-ux-design` | Included | Core Service: Digital interface design |
| 22 | `/services/custom-software` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/custom-software` | Included | Core Service: Business management systems |
| 23 | `/services/seo-digital-presence` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/seo-digital-presence` | Included | Core Service: Search & performance optimization |
| 24 | `/services/support-maintenance` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/services/support-maintenance` | Included | Core Service: Long-term SLA & maintenance |
| 25 | `/projects/roshani-public-school` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/roshani-public-school` | Included | Case Study: Roshani School Web Portal |
| 26 | `/projects/sparknest-academy` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/sparknest-academy` | Included | Case Study: SparkNest EdTech Web App |
| 27 | `/projects/palak-enterprises` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/palak-enterprises` | Included | Case Study: Palak Print & CSC Web App |
| 28 | `/projects/roshani-public-school-erp` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/roshani-public-school-erp` | Included | Case Study: Multi-Role School ERP Platform |
| 29 | `/projects/bankgeu` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/bankgeu` | Included | Case Study: Banking Management Desktop App |
| 30 | `/projects/gameverse` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/projects/gameverse` | Included | Case Study: Gaming Community Web Portal |
| 31 | `/blog/best-website-developer-motihari` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/blog/best-website-developer-motihari` | Included | Authority Article: How to Choose a Developer |
| 32 | `/blog/website-development-cost-in-motihari-bihar` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/blog/website-development-cost-in-motihari-bihar` | Included | Authority Article: Website Cost Breakdown |
| 33 | `/blog/school-website-development-bihar-complete-guide` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/blog/school-website-development-bihar-complete-guide` | Included | Authority Article: Complete School Guide |
| 34 | `/blog/school-erp-vs-school-website` | `INDEX` | Yes | `https://www.ekaagratechnologies.site/blog/school-erp-vs-school-website` | Included | Authority Article: School ERP vs Website |

---

## 3. Permanent Redirect Routes (Excluded from Sitemap)

| # | Requested Path | Status | HTTP Status | Target Canonical URL | Purpose |
|---|---|---|---|---|---|
| 1 | `/blog/how-to-choose-best-website-developer-in-motihari` | `REDIRECT` | 301 Permanent | `https://www.ekaagratechnologies.site/blog/best-website-developer-motihari` | Consolidates duplicate blog URL & resolves keyword cannibalization |

---

## 4. Protected Utility & System Endpoints (Excluded from Sitemap)

| # | Route URL Path | Type | Indexable | Robots Directive | Strategic Purpose |
|---|---|---|---|---|---|
| 1 | `/_not-found` | Dynamic UI | No | `noindex, nofollow` | User-friendly 404 error handler |
| 2 | `/admin/login` | Authentication | No | `noindex, nofollow` (Disallowed in robots.txt) | Studio staff login gateway |
| 3 | `/admin/leads` | Server Route | No | `noindex, nofollow` (Disallowed in robots.txt) | Internal client lead management dashboard |
| 4 | `/robots.txt` | System Endpoint | N/A | Publicly Accessible | Search engine crawling instructions |
| 5 | `/sitemap.xml` | System Endpoint | N/A | Publicly Accessible | XML sitemap manifest of the 34 canonical URLs |
| 6 | `/opengraph-image` | Dynamic Asset | N/A | Publicly Accessible | Default 1200x630 social preview image generator |
| 7 | `/api/*` | API Routes | No | Disallowed in robots.txt | Background server action endpoints |

---

## 5. Summary Route Count Certification
- **Total Application Routes in Build Output:** **40**
- **Canonical Public Indexable HTML URLs:** **34**
- **Canonical Sitemap URLs:** **34**
- **Permanent 301 Server Redirects:** **1**
- **NOINDEX Internal Utility Routes:** **2**
- **Dynamic System Endpoints:** **4**
