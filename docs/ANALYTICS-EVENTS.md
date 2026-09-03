# Privacy-Conscious Conversion Tracking & Analytics Event Specification

## 1. Tracking Philosophy: Privacy First & Zero Personal Data

Ekaagra Technologies implements conversion tracking with strict respect for user privacy:
- **No Personally Identifiable Information (PII)** is ever captured or pushed to analytics (no names, phone numbers, email addresses, or message contents).
- Events capture purely **interaction intent** (e.g. *"User clicked WhatsApp button from `/website-development-motihari`"*).
- The implementation is completely resilient: if Google Analytics or Google Tag Manager scripts are blocked by browser privacy tools, all website features continue to operate with zero JavaScript errors.

---

## 2. Tracked Conversion Events Catalog

| Event Name | Category | Trigger Action | Key Parameters | Business Value |
|---|---|---|---|---|
| `whatsapp_click` | Conversion | User clicks any WhatsApp inquiry button | `source_page`, `event_label` | High (Primary inquiry channel in Bihar) |
| `phone_click` | Conversion | User clicks a `tel:` phone link | `source_page` | High (Direct phone call lead) |
| `email_click` | Conversion | User clicks a `mailto:` email link | `source_page` | Medium (Formal B2B communication) |
| `quote_cta_click` | Engagement | User clicks a "Request Proposal" / "Get Quote" button | `source_page`, `event_label` | Medium (Funnel progression) |
| `contact_form_submit` | Conversion | User successfully submits `/contact` form | `status: success/error` | High (Formal message lead) |
| `quote_form_submit` | Conversion | User successfully submits `/get-quote` form | `status: success/error` | Highest (Qualified project proposal request) |
| `project_view` | Engagement | User clicks into a case study detail page | `project_slug`, `source_page` | Medium (Portfolio proof engagement) |

---

## 3. How Events Are Pushed to the DataLayer

Every interaction calls the unified helper in `src/lib/analytics.ts`:

```typescript
// Example: User clicks WhatsApp button on the flagship page
trackWhatsAppClick('/website-development-motihari', 'Hero WhatsApp Consultation');

// Pushes to window.dataLayer:
{
  event: 'whatsapp_click',
  event_category: 'Conversion',
  source_page: '/website-development-motihari',
  event_label: 'Hero WhatsApp Consultation',
  timestamp: '2026-09-03T12:30:00.000Z'
}
```

---

## 4. Google Tag Manager (GTM) Configuration Guide

If the site owner connects a Google Tag Manager container (`GTM-XXXXXXX`):

### 1. Create DataLayer Variables
In GTM, create User-Defined Variables for:
- `dlv - source_page` &rarr; Variable Type: Data Layer Variable (`source_page`)
- `dlv - event_label` &rarr; Variable Type: Data Layer Variable (`event_label`)
- `dlv - project_slug` &rarr; Variable Type: Data Layer Variable (`project_slug`)

### 2. Create Custom Event Triggers
Create triggers for each event name:
- **Trigger Type:** Custom Event
- **Event Name:** `whatsapp_click` (or `phone_click`, `quote_form_submit`, etc.)

### 3. Link to Google Analytics 4 (GA4) Event Tags
- **Tag Type:** Google Analytics: GA4 Event
- **Measurement ID:** `G-XXXXXXXXXX`
- **Event Name:** `{{Event}}`
- **Event Parameters:** Add `source_page`, `event_label`.
- **Mark as Conversion:** In the GA4 dashboard under *Admin &rarr; Conversions*, mark `whatsapp_click`, `phone_click`, `contact_form_submit`, and `quote_form_submit` as **Key Events (Conversions)**.
