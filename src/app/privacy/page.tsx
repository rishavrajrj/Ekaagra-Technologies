import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Eye, CheckCircle2, Server } from 'lucide-react';
import { createPageMetadata, webPageSchema, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy | Ekaagra Technologies, Motihari',
  description:
    'Read the Privacy Policy of Ekaagra Technologies. Learn how we collect, safeguard, and handle your data and school information with rigorous security standards.',
  path: '/privacy',
});

export default function PrivacyPage() {
  const lastUpdated = 'September 2026';

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            webPageSchema({
              name: 'Privacy Policy — Ekaagra Technologies',
              description: 'Official privacy policy, data protection standards, and institutional confidentiality practices.',
              url: `${SITE_URL}/privacy`,
            })
          ),
        }}
      />
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
      </div>

      {/* Hero */}
      <section className="py-12 sm:py-16 border-b border-[#E2E8F0] bg-warm-grid relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4338CA]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="site-container text-center space-y-3 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4338CA]/10 text-[#4338CA] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4338CA]/20">
            <Lock className="w-3.5 h-3.5 text-[#F97360]" />
            DATA INTEGRITY &amp; CONFIDENTIALITY
          </span>
          <h1 className="fluid-hero-headline font-extrabold text-[#131B2E] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Your privacy and institutional data security are fundamental to our work. Learn how Ekaagra Technologies collects, processes, and protects your information.
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
              <ShieldCheck className="w-5 h-5" />
              <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">1. Overview &amp; Our Commitment</h2>
            </div>
            <p className="text-sm text-[#475569] leading-relaxed">
              At <strong>Ekaagra Technologies</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we respect the privacy of individuals and organizations who visit our website (<a href={SITE_URL} className="text-[#4338CA] hover:underline">{SITE_URL}</a>), submit inquiries, use our educational ERP platforms, or engage us for bespoke software engineering. We never sell, rent, or trade your personal or institutional data to third-party marketers.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">2. Information We Collect</h2>
            <div className="space-y-3 text-sm text-[#475569] leading-relaxed">
              <p>We collect information only when necessary to scope, execute, or deliver digital services:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Contact &amp; Proposal Data:</strong> Name, phone number, email address, school or organization name, location, and project requirements submitted through our contact and quote forms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Transactional Information:</strong> Payment reference IDs, order numbers, transaction amounts, and timestamps processed through certified payment aggregators (e.g., Razorpay). We do <em>not</em> store debit/credit card numbers or CVVs on our servers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Institutional &amp; School Data:</strong> Data provided during project intake, such as school contact details, student capacity brackets, logo assets, and public circulars.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Technical Logs:</strong> Standard web server telemetry including IP address, browser type, referral URLs, and pages viewed, utilized strictly for performance optimization and abuse prevention.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">3. How We Use Your Information</h2>
            <p className="text-sm text-[#475569] leading-relaxed">Your data is utilized strictly for legitimate business and operational purposes:</p>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>To analyze project requirements and provide customized proposals, milestones, and price estimates.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>To process online order payments, generate official invoices, and manage service renewals.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>To coordinate project onboarding via WhatsApp, email, or telephone consultation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>To maintain website stability, monitor uptime, and protect against security incidents or fraudulent transactions.</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">4. Third-Party Service Providers</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              We partner with industry-leading, compliant cloud infrastructure and service providers who process data on our behalf under strict confidentiality agreements:
            </p>
            <ul className="space-y-2 text-sm text-[#475569]">
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                <span><strong>Payment Processing:</strong> Razorpay Software Private Limited (RBI-authorized Payment Aggregator). Payment data is tokenized and encrypted under PCI-DSS Level 1 compliance.</span>
              </li>
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                <span><strong>Cloud Database &amp; Storage:</strong> Supabase Inc. (PostgreSQL database with encrypted at-rest and in-transit storage, Row Level Security).</span>
              </li>
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                <span><strong>Hosting &amp; Edge Delivery:</strong> Vercel Inc. (global edge CDN with automatic SSL/TLS encryption).</span>
              </li>
              <li className="flex items-start gap-2">
                <Server className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
                <span><strong>Email Delivery:</strong> Resend Inc. / Nodemailer for transactional notices and inquiry receipts.</span>
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">5. Data Security Standards</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              We employ commercial-grade technical and organizational safeguards including end-to-end HTTPS/TLS encryption, salted cryptographic hash verifications, restricted administrative session authentication, and database Row Level Security (RLS) policies. While no internet transmission is 100% immune from external hazards, we continually audit and update our defenses to safeguard your assets.
            </p>
          </div>

          {/* Section 6 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">6. Your Data Rights</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              Under applicable Indian data protection laws, you retain the right to:
            </p>
            <ul className="space-y-1.5 text-sm text-[#475569]">
              <li>• Request access to the personal information we hold concerning your account or inquiry.</li>
              <li>• Request rectification of incomplete or inaccurate records.</li>
              <li>• Request deletion of your contact data from our active prospective lead records.</li>
              <li>• Withdraw consent for marketing communication at any time.</li>
            </ul>
          </div>

          {/* Section 7 */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E2E8F0] shadow-sm space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#131B2E]">7. Contact Our Privacy Officer</h2>
            <p className="text-sm text-[#475569] leading-relaxed">
              For any questions, concerns, or data requests relating to this Privacy Policy, please reach out to us:
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1 text-xs text-[#334155]">
              <p><strong>Ekaagra Technologies — Data Privacy Desk</strong></p>
              <p><strong>Address:</strong> Motihari, East Champaran, Bihar - 845401, India</p>
              <p><strong>Email:</strong> <a href={`mailto:${BRAND_EMAIL}`} className="text-[#4338CA] hover:underline">{BRAND_EMAIL}</a></p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
