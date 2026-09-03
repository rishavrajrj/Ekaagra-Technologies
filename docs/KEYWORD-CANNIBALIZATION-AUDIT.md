# Keyword Cannibalization Audit & Search Intent Architecture

## 1. Audit Methodology & Intent Segregation

Keyword cannibalization occurs when multiple URLs on the same domain compete against each other in Google's search results for identical search queries. When this happens, Google divides link equity, click-through authority, and ranking signals between the competing pages, often causing both pages to rank lower.

To prevent cannibalization, every distinct search query theme must map to **exactly one primary canonical page**. All other pages that mention the topic must serve as supporting cluster pages that pass link authority back to the primary canonical URL.

---

## 2. Search Intent Mapping & Action Table

| Query Theme / Keywords | Primary Canonical Page | Supporting Pages | Action Taken | Rationale & Status |
|---|---|---|---|---|
| **Website Developer in Motihari**<br>*(developer, web designer, website design)* | `/website-development-motihari` | `/services/website-development`, `/projects`, `/about` | **KEEP (Primary)** | Dedicated commercial landing page with full local conversion architecture, local case studies, and FAQ schema. |
| **How to Choose a Web Developer**<br>*(best website developer Motihari)* | `/blog/best-website-developer-motihari` | `/website-development-motihari` | **MERGE / REDIRECT** | Previous duplicate `/blog/how-to-choose-best-website-developer-in-motihari` merged into this single canonical article. 301 permanent redirect configured in `next.config.ts`. |
| **Website Development Cost**<br>*(website price Motihari, website packages Bihar)* | `/blog/website-development-cost-in-motihari-bihar` | `/pricing`, `/get-quote`, `/website-development-motihari` | **KEEP** | Distinct informational/evaluative pricing intent. Features transparent cost matrix and funnels traffic to `/pricing` and `/get-quote`. |
| **General Website Pricing**<br>*(packages, commercial quotes)* | `/pricing` | `/get-quote`, `/website-development-motihari` | **KEEP** | Commercial transactional pricing tier page. |
| **School Website Development**<br>*(school website Motihari, CBSE school design Bihar)* | `/school-website-development-motihari` | `/blog/school-website-development-bihar-complete-guide`, `/projects/roshani-public-school` | **KEEP** | Dedicated local landing page for educational institutions requiring CBSE compliance archives and admission forms. |
| **School Website Guide for Principals**<br>*(CBSE disclosure checklist)* | `/blog/school-website-development-bihar-complete-guide` | `/school-website-development-motihari`, `/projects/roshani-public-school` | **KEEP** | Informational guide answering regulatory requirements and linking to the commercial school service. |
| **School ERP Systems**<br>*(school management software Motihari)* | `/school-erp-motihari` | `/projects/roshani-public-school-erp`, `/services/school-erp` | **KEEP** | Dedicated commercial software page detailing 6 user portals, fee receipt engines, and attendance modules. |
| **School ERP vs School Website**<br>*(differences, which one to buy)* | `/blog/school-erp-vs-school-website` | `/school-erp-motihari`, `/school-website-development-motihari` | **KEEP** | Comparative evaluative guide for trustees and school administrators. |
| **Custom Software Development**<br>*(billing software, inventory Motihari)* | `/software-development-motihari` | `/services/custom-software`, `/solutions` | **KEEP** | Local commercial page targeting retail, wholesale, and clinic management software in East Champaran. |
| **Web Applications & Portals**<br>*(custom portals, client dashboards Bihar)* | `/web-application-development-motihari` | `/services/web-application-development`, `/projects/palak-enterprises` | **KEEP** | Targeted full-stack page for businesses needing cloud databases and interactive customer portals. |
| **Android Mobile App Development**<br>*(mobile app developer Motihari)* | `/android-app-development-motihari` | `/services/android-development`, `/pricing` | **KEEP** | Mobile engineering page for native Android apps and Play Store deployment. |
| **General / National Website Services**<br>*(website development services)* | `/services/website-development` | `/website-development-motihari`, `/projects` | **KEEP** | Broad commercial service page targeting general non-geo-restricted searches. |
| **Brand Searches**<br>*(Ekaagra Technologies, Ekaagra Motihari)* | `https://www.ekaagratechnologies.site/` | `/about`, `/contact` | **KEEP** | Official studio homepage with Organization and WebSite schema. |

---

## 3. Specific Blog Cannibalization Resolution

### The Issue Identified
Prior to Phase 3, the blog data contained two overlapping URLs:
1. `/blog/best-website-developer-motihari`
2. `/blog/how-to-choose-best-website-developer-in-motihari`

Both articles addressed the exact same user search query: *"How to evaluate and choose a website developer in Motihari."* Serving both URLs caused split ranking signals and risked Google indexing the wrong version.

### The Resolution Executed
1. **Canonical Selection:** Kept `/blog/best-website-developer-motihari` as the permanent, authoritative canonical URL.
2. **Permanent 301 Redirection:** Configured Next.js server-side 301 redirection in `next.config.ts`:
   ```typescript
   async redirects() {
     return [
       {
         source: '/blog/how-to-choose-best-website-developer-in-motihari',
         destination: '/blog/best-website-developer-motihari',
         permanent: true,
       },
     ];
   }
   ```
3. **Sitemap & Prerender Cleanup:** Removed the legacy alias from `src/lib/blog-data.ts` and `src/app/blog/[slug]/page.tsx` static parameter generation.
4. **Result:** Googlebot is automatically redirected to the canonical URL with zero duplicate content penalty.
