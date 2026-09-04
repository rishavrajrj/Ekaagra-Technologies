import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Sparkles, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Terms of Service | Ekaagra Technologies, Motihari',
  description:
    'Read the official Terms of Service for Ekaagra Technologies. Learn about project engagement, code ownership, milestone deliverables, and payment guidelines.',
  path: '/terms',
});

export default function TermsPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Terms of Service — Ekaagra Technologies',
              description: 'Official client terms of service, engagement conditions, and ownership guarantees.',
              url: `${SITE_URL}/terms`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Terms of Service' }]} />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <FileText className="w-3.5 h-3.5 text-[#F97360]" />
            LEGAL &amp; CLIENT AGREEMENT
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Please read these terms carefully before engaging Ekaagra Technologies for web development, software engineering, or related digital services.
          </p>
          <div className="text-xs font-mono text-[#64748B]">Last updated: {lastUpdated}</div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16">
        <div className="site-container max-w-4xl space-y-10">
          {/* Section 1 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 text-[#4338CA]">
              <Shield className="w-5 h-5" />
              <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">1. Acceptance of Terms</h2>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed">
              By accessing our website (<a href={SITE_URL} className="text-[#4338CA] hover:underline">{SITE_URL}</a>), submitting an inquiry or quote request, making an online payment, or signing a project proposal with <strong>Ekaagra Technologies</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you (&quot;Client&quot;, &quot;Customer&quot;, or &quot;User&quot;) agree to be bound by these Terms of Service. If you are entering into this agreement on behalf of a school, business, or other legal entity, you represent that you possess the authority to bind such entity.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">2. Scope of Services</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Ekaagra Technologies provides professional digital technology services including:
            </p>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Website Development:</strong> Single-page landing sites, multi-page business websites, and institutional web portals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>School ERP Systems:</strong> Multi-role educational management software, fee collection engines, attendance tracking, and parent portals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Custom Web Applications &amp; Mobile Apps:</strong> Database systems, client portals, and native Android applications.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Maintenance &amp; Hosting Support:</strong> Deployment uptime monitoring, basic security patches, and server stability care under active plans.</span>
              </li>
            </ul>
            <p className="text-sm text-[#475569] leading-relaxed">
              Each custom engagement will specify its unique scope, deliverables, and estimated timelines in an approved project quote or statement of work.
            </p>
          </div>

          {/* Section 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">3. Pricing, Invoicing &amp; Payments</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                <strong>3.1 Transparent Pricing:</strong> All service packages displayed on our website are denominated in Indian Rupees (INR, ₹). Listed prices for standardized website packages (e.g., Launch Plus, Starter Website) are net and clearly state included allowances with zero hidden fees.
              </p>
              <p>
                <strong>3.2 Payment Gateway:</strong> Online payments are processed securely through certified payment aggregators (including Razorpay). Accepted payment methods include UPI (Google Pay, PhonePe, Paytm), Credit Cards, Debit Cards, and NetBanking.
              </p>
              <p>
                <strong>3.3 Milestone Payments for Custom Projects:</strong> Custom software, school portals, and bespoke web applications are typically structured with milestone stages (e.g., 50% project kickoff advance, 50% upon final staging approval and production deployment).
              </p>
              <p>
                <strong>3.4 Annual Maintenance &amp; Renewals:</strong> Website hosting, third-party domain renewals, and annual maintenance plans (AMC) renew annually. Clients are notified 30 days prior to expiration. Failure to settle renewal fees may result in temporary service suspension.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">4. Full Ownership &amp; Intellectual Property Rights</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                <strong>4.1 100% Client Ownership:</strong> Unlike proprietary platforms that trap businesses in vendor lock-in, Ekaagra Technologies guarantees 100% ownership of your customized application code, database assets, and digital design files upon final payment settlement.
              </p>
              <p>
                <strong>4.2 Domain Ownership:</strong> Any custom domain registered as part of an included plan allowance or paid upgrade is registered with the Client as the sole legal owner and administrative contact.
              </p>
              <p>
                <strong>4.3 Client Supplied Content:</strong> The Client warrants that all logos, trademarks, photographs, copy, and documents supplied to Ekaagra Technologies for inclusion in the website or application do not infringe upon any third-party copyrights or intellectual property.
              </p>
            </div>
          </div>

          {/* Section 5 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">5. Client Responsibilities</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Timely delivery of digital projects depends on close collaboration. The Client agrees to:
            </p>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Provide required business logos, high-resolution media, contact information, and initial text copy promptly during the intake phase.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Review staging links and test deployments within 7 business days to ensure on-schedule production launch.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Designate a single primary point of contact authorized to approve revisions and milestone handoffs.</span>
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">6. Limitation of Liability &amp; Third-Party Services</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>
                While we apply rigorous engineering standards and uptime monitoring, Ekaagra Technologies shall not be held liable for indirect, consequential, or incidental damages resulting from third-party hosting outages (e.g., AWS, Vercel, Supabase), third-party registrar DNS propagation delays, or external payment aggregator network downtimes beyond our reasonable control.
              </p>
              <p>
                In all circumstances, our maximum financial liability shall not exceed the total fees paid by the Client to Ekaagra Technologies for the specific service under dispute.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">7. Governing Law &amp; Dispute Resolution</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              These Terms of Service and any dispute arising from or related to our services shall be governed by and construed in accordance with the laws of the Republic of India. The courts located in <strong>Motihari, East Champaran, Bihar</strong> shall have exclusive jurisdiction to settle any legal claim or dispute.
            </p>
          </div>

          {/* Section 8 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">8. Contact Information</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              If you have any questions regarding these Terms of Service, please contact our administrative desk:
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1 text-xs text-[#334155]">
              <p><strong>Entity:</strong> Ekaagra Technologies</p>
              <p><strong>Studio Location:</strong> Motihari, East Champaran, Bihar - 845401, India</p>
              <p><strong>Email:</strong> <a href={`mailto:${BRAND_EMAIL}`} className="text-[#4338CA] hover:underline">{BRAND_EMAIL}</a></p>
              <p><strong>Website:</strong> <a href={SITE_URL} className="text-[#4338CA] hover:underline">{SITE_URL}</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
