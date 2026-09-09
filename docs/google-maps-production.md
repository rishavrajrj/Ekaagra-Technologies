# Google Maps Platform: Production Configuration & Cost-Control Guide

This document defines the production hardening, security protocols, API restrictions, cost controls, and fallback architecture for the Google Maps integration in the **Ekaagra Technologies School Onboarding Portal**.

---

## 1. Core Principle: Zero Single-Point-of-Failure

> [!IMPORTANT]
> **Google Maps is an enhancement, NOT a hard requirement for completing school onboarding.**
>
> If Google Maps is available, enabled, and within quota:
> - Administrators enjoy an interactive map, address autocomplete, click-to-pin, pin dragging, and GPS device positioning.
>
> If Google Maps is unavailable, keyless, quota-exhausted, billing-restricted, or offline:
> - The onboarding portal automatically switches to the fallback interface.
> - Administrators can still complete onboarding by manually typing institutional address fields, pasting a Google Maps share link (`maps.app.goo.gl`), or typing GPS coordinates.
> - The application will **never** crash, hang, throw unhandled exceptions, or block school provisioning.

---

## 2. Google Cloud Setup & Required APIs

### Step A: Create or Select a Google Cloud Project
1. Visit the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your organizational project (e.g., `ekaagra-technologies-prod`).
3. Ensure **Billing** is linked to the project (required by Google Maps Platform to generate live tiles).

### Step B: Enable Only the Required APIs
Enable strictly the three APIs used by the codebase. Do not enable unnecessary Google APIs:

| Feature in School Onboarding | Google Maps Platform API | Used Service / Method |
| :--- | :--- | :--- |
| **Interactive Map Canvas** | **Maps JavaScript API** | `google.maps.Map`, `google.maps.Marker`, satellite/roadmap layers |
| **School / Place Autocomplete** | **Places API** | `google.maps.places.AutocompleteService`, `PlacesService.getDetails` |
| **"Locate Address" (Forward)** | **Geocoding API** | `google.maps.Geocoder.geocode({ address, componentRestrictions })` |
| **Pin Drop Address (Reverse)** | **Geocoding API** | `google.maps.Geocoder.geocode({ location })` |

---

## 3. API Key Creation & Security Restrictions

Google Maps API keys running in the browser are client-accessible by design. To prevent unauthorized usage, quota exhaustion, or domain spoofing, enforce **both** Application Restrictions and API Restrictions in Google Cloud Console.

### Step C: Restrict by HTTP Referrer (Application Restriction)
1. Navigate to **Google Cloud Console > APIs & Services > Credentials**.
2. Select or create your API Key (e.g., `Ekaagra-School-Onboarding-Browser-Key`).
3. Under **Set an application restriction**, select **Websites (HTTP referrers)**.
4. Add your exact production and development authorized URLs:

| Environment | Allowed Referrer Pattern | Purpose |
| :--- | :--- | :--- |
| **Production Apex** | `https://ekaagratechnologies.site/*` | Main customer domain |
| **Production WWW** | `https://www.ekaagratechnologies.site/*` | Canonical www domain |
| **Production Subdomains** | `https://*.ekaagratechnologies.site/*` | Onboarding portal and school tenant preview routes |
| **Vercel Preview Deployments** | `https://*.vercel.app/*` | Optional: Preview deployment testing |
| **Localhost Development** | `http://localhost:3000/*` | Local Next.js dev server |
| **Local IP Development** | `http://127.0.0.1:3000/*` | Local alternate loopback testing |

> [!TIP]
> Best practice: Maintain two distinct API keys:
> - One strictly restricted to `localhost:3000/*` for local developer testing.
> - One strictly restricted to `https://ekaagratechnologies.site/*`, `https://www.ekaagratechnologies.site/*`, and `https://*.ekaagratechnologies.site/*` for production deployments in Vercel.

### Step D: Restrict Allowed APIs (API Restriction)
1. Under **API restrictions**, select **Restrict key**.
2. In the dropdown, check **ONLY**:
   - `Maps JavaScript API`
   - `Places API`
   - `Geocoding API`
3. Save changes. Never leave a browser API key unrestricted.

---

## 4. Environment Variables Configuration

Set the browser-safe environment variable in your local `.env.local` or in the Vercel Project Settings:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourActualRestrictedKeyHere
```

### Security Checklist:
- [x] Variable is prefixed with `NEXT_PUBLIC_` because it is loaded by client-side `@googlemaps/js-api-loader`.
- [x] No API key is hardcoded anywhere in Git repositories.
- [x] `.env.local` is listed in `.gitignore`.
- [x] `.env.example` contains only placeholder instructions.
- [x] No server logs or error toasts print the key string.

---

## 5. Cost Control & Quota Optimization Architecture

Google Maps charges per service request (SKU: Dynamic Maps, Autocomplete per session, Geocoding). The codebase includes deliberate safeguards:

### 1. In-Memory Bounded LRU Caching (Best-Effort Duplicate Reduction)
> [!NOTE]
> In-memory caches (`autocompleteCache`, `reverseGeocodeCache`, `geocodeAddressCache`, `placeDetailsCache`) operate within the client browser session. They provide **best-effort duplicate-request reduction** during active form filling (e.g. testing different marker positions or re-typing queries), but do not guarantee zero billing across reloads or distinct client sessions.
- **Autocomplete**: Results for identical queries are cached in a bounded map (max 60 items). Typing back and forth produces zero duplicate Google API calls.
- **Reverse Geocoding**: Coordinates are cached to 5 decimal places (~1.1m accuracy). Nudging a pin back to a previous spot uses cached results.
- **Forward Geocoding**: Structured address queries from "Locate Address" are cached.
- **Place Details**: Geometry results are indexed by `place_id`.

### 2. Debouncing & Rapid Event Throttling
- **Autocomplete Search**: Debounced by **280ms**, with a minimum threshold of **3 characters**. Out-of-order responses are rejected using `searchSequenceRef`.
- **Rapid Map Clicking**: Map clicks are debounced by **350ms**. Rapidly clicking across the canvas updates local marker state immediately, but cancels pending reverse-geocodes so that only the final resting location dispatches an API request.
- **Pin Dragging**: Dragging updates coordinates visually in real-time with **zero API requests** during drag. Reverse geocoding executes strictly **once** with a **250ms debounce** upon `dragend`.

### 3. Controlled Autocomplete Place Details
- When a place prediction is chosen, `placesService.getDetails` strictly requests only five basic fields:
  `fields: ['name', 'formatted_address', 'geometry', 'address_components', 'place_id']`
  Avoiding expensive Contact Data or Atmosphere Data SKUs.

### 4. Explicit Address Geocoding
- Typing into institutional address fields does **not** trigger any background API calls.
- Forward geocoding occurs **only** when the administrator clicks the deliberate **"Locate Address"** button.

### 5. Singleton Script Loading
- `@googlemaps/js-api-loader` maintains a single in-flight promise.
- Navigating between onboarding tabs or triggering re-renders never re-downloads the Google Maps SDK.

---

## 6. Budget Alerts & Daily Quota Caps

To prevent unexpected billing spikes:

1. **Set Daily Quotas**:
   - Go to **Google Cloud Console > APIs & Services > Enabled APIs & Services**.
   - Click on **Places API > Quotas & System Limits** and **Geocoding API > Quotas & System Limits**.
   - Set a daily request cap (e.g., `1,000 requests / day`) suitable for current school onboarding volume.
2. **Set Budget Alerts**:
   - Go to **Billing > Budgets & alerts**.
   - Create a monthly budget (e.g., `$20/month` or `₹1,500/month`).
   - Configure email thresholds at **50%**, **90%**, and **100%**.

---

## 7. Fallback Hierarchy & Graceful Degradation

If any failure occurs, the portal executes the following fallback order:

```
[ Level 1: Interactive Google Maps ]
   ↓ (If missing key, quota exceeded, billing error, or network drop)
[ Level 2: Clean Fallback Viewport ]
   - Informative notice: "Interactive map is currently unavailable."
   - Action: [Retry Map]
   - Action: [Use Google Maps Link] (focuses short-link input)
   - Action: [Enter Coordinates] (focuses decimal latitude input)
   ↓
[ Level 3: Google Maps Share Link ]
   - Paste link (e.g., https://maps.app.goo.gl/xyz)
   - Resolves coordinates via /api/geo/resolve-maps-url with 6s timeout & SSRF protection
   ↓
[ Level 4: Direct Decimal Coordinates ]
   - Enter Latitude & Longitude directly (validated to [-90, 90] & [-180, 180])
   ↓
[ Level 5: Primary Institutional Address Form ]
   - Street address, City, District, State, Country, Postal PIN
   - Always editable, authoritative, and submittable
```

---

## 8. Troubleshooting Common Production Issues

| Symptom | Probable Cause | Resolution |
| :--- | :--- | :--- |
| Fallback card shows *"Interactive map temporarily unavailable"* | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set in `.env.local` or hosting provider environment variables. | Add the key to `.env.local` or your production hosting dashboard and redeploy. |
| Browser console shows `RefererNotAllowedMapError` | The HTTP referrer restriction does not match the domain accessing the site. | Add `https://*.ekaagratechnologies.site/*` or `http://localhost:3000/*` to Credentials in Google Cloud Console. |
| Browser console shows `ApiNotActivatedMapError` | One of the required APIs (Maps JavaScript, Places, Geocoding) has not been enabled in the project. | Enable the API in **Google Cloud Console > APIs & Services > Library**. |
| Browser console shows `BillingNotEnabledMapError` | No active credit card or billing account is attached to the Google Cloud project. | Attach a billing account under **Billing** in Google Cloud Console. |
| Autocomplete dropdown doesn't show local schools | Search term is too short (< 3 chars) or outside India. | Autocomplete prioritizes India (`country: 'in'`) and falls back to worldwide results if no matches exist. |

---

## 9. How Administrators Complete Onboarding Without Google Maps

If Google Maps is unavailable, offline, blocked by firewall, or quota-limited, administrators can complete onboarding seamlessly using either of these three independent workflows:

### Workflow A: Direct Institutional Postal Address
1. Fill out the native postal address fields: Street Address, City/Town, District, State, Country, and Postal PIN Code.
2. The form submission and school provisioning pipeline accept the postal address directly.
3. Coordinates are optional; our engineering team can backfill coordinates prior to custom domain cutover.

### Workflow B: Google Maps Share Link
1. On a mobile device or desktop browser, open [Google Maps](https://maps.google.com).
2. Search for the school, tap **Share**, and click **Copy Link** (e.g. `https://maps.app.goo.gl/...`).
3. Paste the URL into the **Google Maps Location URL / Pin Share Link** field in the onboarding portal.
4. The system validates and resolves coordinates automatically, preserving both the link and coordinates.

### Workflow C: Manual Latitude & Longitude Entry
1. Right-click the campus on Google Maps or any GPS app and copy the latitude and longitude.
2. Enter the decimal latitude (between -90 and 90) and longitude (between -180 and 180) in the dedicated inputs.
3. The coordinates are stored with 6-decimal precision and are immediately ready for submission.

---

## 10. Multi-Campus Architecture & State Isolation

In multi-campus schools (institutions with branches or separate senior/junior wings):
- **Independent State**: Each campus (Primary Campus and each branch in `intakeData.campuses`) renders its own `<CampusMapPinPicker />` instance.
- **Isolated DOM IDs**: Unique React `useId()` hooks assign instance-scoped input IDs (`campus-latitude-:r1:`, `google-maps-share-url-:r1:`, etc.).
- **Decoupled Focus Handlers**: Fallback action buttons focus the exact inputs belonging to that specific branch, eliminating cross-campus focus theft.
- **Independent Coordinates & Address Context**: Moving a pin or resolving an address on Campus 2 never modifies or overwrites the address or coordinates of Campus 1.
