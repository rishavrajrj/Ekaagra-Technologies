import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, Sparkles, AlertCircle, CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Cancellation & Refund Policy | Ekaagra Technologies, Motihari',
  description:
    'Review the official Cancellation & Refund Policy of Ekaagra Technologies. Learn about refund eligibility for website packages, custom software milestones, and domain registrations.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Cancellation & Refund Policy — Ekaagra Technologies',
              description: 'Official cancellation terms, refund eligibility criteria, and processing timelines.',
              url: `${SITE_URL}/refund-policy`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Cancellation & Refund Policy' }]} />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <RotateCcw className="w-3.5 h-3.5 text-[#F97360]" />
            TRANSPARENT CLIENT PROTECTION
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Cancellation &amp; Refund Policy
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            We value client satisfaction, transparent business practices, and clear expectations. Review our policies on project cancellations, refunds, and adjustments.
          </p>
          <div className="text-xs font-mono text-[#64748B]">Last updated: {lastUpdated}</div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="site-container max-w-4xl space-y-10">
          {/* Summary Box */}
          <div className="p-6 rounded-3xl bg-white border border-[#4338CA]/20 shadow-md flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#4338CA]/10 text-[#4338CA] shrink-0">
              <Sparkles className="w-6 h-6 text-[#F97360]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-[#131B2E]">Our Fair Service Commitment</h2>
              <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                Because digital software and websites involve customized human engineering and allocated cloud resources, refunds are governed by the stage of project completion. We always strive to resolve any dissatisfaction through design revisions before processing cancellations.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">1. Standardized Website Packages (Launch Plus &amp; Starter)</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>For standardized website packages purchased directly online:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cancellation Before Work Commencement (Within 48 Hours):</strong> If you cancel within 48 hours of order placement and before design intake or domain purchase has initiated, you are eligible for a <strong>100% full refund</strong> minus nominal payment gateway processing charges (typically 2%).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Cancellation During Drafting Phase:</strong> If cancellation is requested after initial wireframes or layout previews are shared but before final deployment, a <strong>50% partial refund</strong> will be issued to cover allocated designer hours.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#F97360] shrink-0 mt-0.5" />
                  <span>
                    <strong>Post-Deployment:</strong> Once the final website is deployed to the production URL or domain with source code access, fees are non-refundable as the deliverable has been fulfilled.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">2. Custom Software &amp; School ERP Projects</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                Custom software systems, School ERP platforms, and bespoke web portals operate under milestone-based service agreements:
              </p>
              <ul className="space-y-2">
                <li>• <strong>Discovery &amp; Advance Deposits:</strong> Advance booking deposits (typically 30%–50%) fund technical architecture planning and database provisioning. Advance fees are refundable up to 72 hours following payment, provided discovery interviews have not been executed.</li>
                <li>• <strong>Milestone Sign-Offs:</strong> Each approved milestone payment represents formal client sign-off on delivered modules (e.g., student database, fee receipts module). Once a milestone is signed off and tested, that milestone payment is non-refundable.</li>
                <li>• <strong>Project Termination by Client:</strong> The Client may terminate the engagement upon 7 days written notice. In such cases, the Client retains all completed code assets and documentation up to the last settled milestone.</li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">3. Third-Party Domain &amp; Registrar Fees (Non-Refundable)</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                Top-level domain registrations (e.g., <code>.in</code>, <code>.co.in</code>, <code>.com</code>, <code>.org</code>) are executed with accredited registrars (such as GoDaddy, NIXI, or registry operators).
              </p>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 leading-relaxed">
                <strong>Important Notice:</strong> Once a domain name is registered with an official registrar, the registry fee is <strong>strictly non-refundable</strong> under ICANN and registry regulations. If a project is cancelled after domain registration, the domain remains 100% the property of the client, and we will transfer full DNS and auth-code controls to you.
              </div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">4. Annual Maintenance (AMC) &amp; Hosting Renewals</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                Clients may cancel annual maintenance plans at any time by giving 15 days notice prior to the upcoming renewal date. Once an annual renewal term begins and server allocations are provisioned, renewal fees are non-refundable for that active term.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">5. Refund Processing Timelines &amp; Methods</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <div className="grid sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#131B2E] text-xs">
                    <CreditCard className="w-4 h-4 text-[#4338CA]" />
                    <span>Refund Method</span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Refunds are credited strictly to the original payment source (UPI account, Credit/Debit card, or NetBanking bank account) through our payment gateway.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-[#131B2E] text-xs">
                    <Clock className="w-4 h-4 text-[#4338CA]" />
                    <span>Turnaround Time</span>
                  </div>
                  <p className="text-xs text-[#64748B]">
                    Approved refunds are initiated within 2 business days. It typically takes <strong>5–7 working days</strong> for the funds to reflect in your banking statement depending on your bank.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">6. How to Request a Cancellation or Refund</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              To request a cancellation or refund, please submit your request in writing from your registered email address:
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1 text-xs text-[#334155]">
              <p><strong>Subject:</strong> Cancellation &amp; Refund Request — [Your Order Number or Project Name]</p>
              <p><strong>Email to:</strong> <a href={`mailto:${BRAND_EMAIL}`} className="text-[#4338CA] hover:underline">{BRAND_EMAIL}</a></p>
              <p><strong>Include:</strong> Order number / Transaction ID, Client name, phone number, and reason for cancellation.</p>
            </div>
            <p className="text-xs text-[#64748B]">
              Our billing and support desk reviews all requests within 24 hours.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
