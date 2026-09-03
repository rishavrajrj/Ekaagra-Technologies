# Social Brand Consistency & Multi-Channel Entity Alignment

## 1. Objective: Multi-Channel Entity Reinforcement

Google evaluates entity consistency across web properties, external profiles, social channels, and directories. Inconsistent names, differing logos, or conflicting websites weaken Google’s entity recognition confidence.

This specification standardizes the presentation of **Ekaagra Technologies** across all official social platforms.

---

## 2. Core Profile Assets

| Asset Type | Dimension / Format | File Location in Codebase |
|---|---|---|
| **Avatar / Profile Icon** | 500 x 500 px (Square WebP/PNG) | `/public/images/logo/logo.png` or `/public/images/logo/logo.webp` |
| **Header / Banner Cover** | 1584 x 396 px (LinkedIn) / 1200 x 630 px (FB) | High-contrast branded dark/warm gradient with official logo |
| **Brand Color Palette** | Royal Indigo `#4338CA`, Coral Orange `#F97360`, Cream `#FAF7F2` | Defined in `src/app/globals.css` |

---

## 3. Platform-Specific Copy & Configurations

### 1. LinkedIn (Primary Commercial B2B Profile)
- **Company Name:** `Ekaagra Technologies`
- **Tagline:** `Website Design & Digital Product Studio in Motihari, Bihar`
- **Website URL:** `https://www.ekaagratechnologies.site/`
- **Industry:** Technology, Information and Internet
- **Company Size:** 2–10 employees
- **Location:** Motihari, Bihar, India
- **About Description:**
  > Ekaagra Technologies is an independent website design, web application, and software development studio based in Motihari, Bihar. We engineer custom, mobile-first websites, CBSE-compliant school web platforms, School ERP systems, and custom software architectures. Built on modern Next.js and cloud databases for sub-500ms speeds, Google visibility, and 100% client code ownership.

---

### 2. Instagram
- **Name:** `Ekaagra Technologies`
- **Username / Handle Recommendation:** `@ekaagratechnologies`
- **Bio (150 chars max):**
  > 🌐 Custom Websites, School ERP & Web Apps  
  > ⚡ Sub-500ms Edge Speed • 100% Code Ownership  
  > 📍 Motihari, Bihar  
  > 🔗 www.ekaagratechnologies.site
- **Link in Bio:** `https://www.ekaagratechnologies.site/`

---

### 3. Facebook Business Page
- **Page Name:** `Ekaagra Technologies`
- **Category:** Software Company / Web Designer
- **Website:** `https://www.ekaagratechnologies.site/`
- **Contact Email:** `ekaagratechnologies@gmail.com`
- **Service Area:** Motihari, East Champaran, Bihar
- **About:**
  > Independent website design, school portal, and software development studio based in Motihari, Bihar. Fast, modern, mobile-first technology for growing institutions and businesses.

---

### 4. YouTube (Video Portfolio & Client Walkthroughs)
- **Channel Name:** `Ekaagra Technologies`
- **Handle:** `@ekaagratechnologies`
- **Channel Description:**
  > Official channel of Ekaagra Technologies. Watch live website demonstrations, School ERP feature walkthroughs, and web design case studies engineered in Motihari, Bihar.

---

## 4. Entity Schema Integration (`sameAs`)

When official social profiles are live and active, register their full URLs in `src/lib/seo.config.ts` inside the `organizationSchema()` function:

```typescript
sameAs: [
  'https://www.linkedin.com/company/ekaagratechnologies',
  'https://www.instagram.com/ekaagratechnologies',
  'https://www.facebook.com/ekaagratechnologies',
  'https://github.com/Ekaagra-Technologies'
]
```
*(Only include active, verified links. Do not add broken or placeholder links).*
