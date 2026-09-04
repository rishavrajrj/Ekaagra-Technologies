import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, Sparkles, CheckCircle2, Clock, Globe, ArrowRight } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Service Delivery & Fulfillment Policy | Ekaagra Technologies, Motihari',
  description:
    'Read the Service Delivery and Fulfillment Policy of Ekaagra Technologies. Learn about our digital delivery schedules, staging approvals, and production launch procedures.',
  path: '/delivery-policy',
});

export default function DeliveryPolicyPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Service Delivery & Fulfillment Policy — Ekaagra Technologies',
              description: 'Official digital service fulfillment timelines, staging reviews, and deployment procedures.',
              url: `${SITE_URL}/delivery-policy`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Service Delivery Policy' }]} />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Truck className="w-3.5 h-3.5 text-[#F97360]" />
            DIGITAL FULFILLMENT &amp; TIMELINES
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Service Delivery &amp; Fulfillment Policy
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Ekaagra Technologies provides 100% digital software and web engineering services. Review our milestone timelines, delivery mechanisms, and staging sign-off workflows.
          </p>
          <div className="text-xs font-mono text-[#64748B]">Last updated: {lastUpdated}</div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="site-container max-w-4xl space-y-10">
          {/* Electronic Delivery Notice */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-[#4338CA]">
              <Globe className="w-5 h-5" />
              <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">1. Electronic &amp; Digital Fulfillment</h2>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed">
              All services provided by <strong>Ekaagra Technologies</strong> are electronic in nature. We do not dispatch physical parcels or hardware goods. There are <strong>zero shipping charges</strong> (₹0) associated with our service packages.
            </p>
            <p className="text-sm text-[#475569] leading-relaxed">
              Deliverables are fulfilled through digital channels, including private staging preview URLs, cloud repository access, administrative credential handovers, and DNS propagation on your live domain name.
            </p>
          </div>

          {/* Timelines Table */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">2. Standard Service Delivery Timelines</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Delivery schedules commence once the initial project intake details, business assets (logos, text content), and initial payment confirmation have been received:
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border border-[#E2E8F0] rounded-xl overflow-hidden">
                <thead className="bg-[#FAF7F2] text-[#131B2E] border-b border-[#E2E8F0]">
                  <tr>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Service Package</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Estimated Delivery Time</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Deliverable Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                  <tr>
                    <td className="p-3.5 font-semibold text-[#131B2E]">Free Launch</td>
                    <td className="p-3.5 text-emerald-700 font-bold">3–5 Business Days</td>
                    <td className="p-3.5">1 Responsive landing page deployed on an Ekaagra production subdomain.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#131B2E]">Launch Plus (₹499)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">5–7 Business Days</td>
                    <td className="p-3.5">1 Custom landing page, official domain registration, SSL certification, and live deployment.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#131B2E]">Starter Website (₹999)</td>
                    <td className="p-3.5 text-emerald-700 font-bold">7–12 Business Days</td>
                    <td className="p-3.5">3–5 Custom pages, domain setup, on-page search engine setup (SEO), and dynamic sitemap.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#131B2E]">School ERP &amp; Portals</td>
                    <td className="p-3.5 text-[#4338CA] font-bold">2–4 Weeks</td>
                    <td className="p-3.5">Multi-role database portals, fee management engine, student records import, staff training.</td>
                  </tr>
                  <tr>
                    <td className="p-3.5 font-semibold text-[#131B2E]">Custom Software &amp; Apps</td>
                    <td className="p-3.5 text-[#4338CA] font-bold">As per Project Milestone Agreement</td>
                    <td className="p-3.5">Architectural wireframes, database provisioning, custom APIs, APK release builds.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">3. The 4-Step Fulfillment Process</h2>
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">Step 01</span>
                <h3 className="text-xs font-bold text-[#131B2E]">Intake &amp; Scope Confirmation</h3>
                <p className="text-xs text-[#64748B]">
                  We confirm your design preferences, color palette, logo assets, and page requirements via online form or WhatsApp consultation.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">Step 02</span>
                <h3 className="text-xs font-bold text-[#131B2E]">Staging Development</h3>
                <p className="text-xs text-[#64748B]">
                  Our developers engineer your website on a private, testable preview URL so you can inspect responsiveness on your phone and desktop.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">Step 03</span>
                <h3 className="text-xs font-bold text-[#131B2E]">Client Revisions &amp; Approval</h3>
                <p className="text-xs text-[#64748B]">
                  You request text edits, image replacements, or layout adjustments. We refine the deliverable until final sign-off.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[#4338CA] uppercase">Step 04</span>
                <h3 className="text-xs font-bold text-[#131B2E]">Production Launch &amp; Handoff</h3>
                <p className="text-xs text-[#64748B]">
                  We map your official domain, issue free SSL security certificates, publish the project live, and transfer administrative access.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">4. Factors That May Influence Timelines</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              We take pride in on-time delivery. However, timelines may occasionally be adjusted due to:
            </p>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Client Content Availability:</strong> Delays in supplying essential product images, school notices, or corporate copy.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Domain Propagation:</strong> While DNS updates are generally instant, global DNS caches can take 24–48 hours to fully propagate worldwide.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Scope Expansions:</strong> Additions of unquoted custom pages, extra interactive forms, or payment gateway integrations during active development.</span>
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">5. Inquiries &amp; Delivery Support</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              If you have any questions regarding your project delivery status or milestone schedule, contact our engineering desk:
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1 text-xs text-[#334155]">
              <p><strong>Ekaagra Technologies — Delivery &amp; Handoff Desk</strong></p>
              <p><strong>Location:</strong> Motihari, East Champaran, Bihar - 845401, India</p>
              <p><strong>Email:</strong> <a href={`mailto:${BRAND_EMAIL}`} className="text-[#4338CA] hover:underline">{BRAND_EMAIL}</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
