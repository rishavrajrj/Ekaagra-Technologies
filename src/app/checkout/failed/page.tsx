import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, RotateCcw, MessageSquare } from 'lucide-react';
import { createPageMetadata, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { buildGeneralInquiryWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = createPageMetadata({
  title: 'Payment Incomplete | Ekaagra Technologies',
  description: 'Your payment was not completed. You can safely retry or submit your project quote directly.',
  path: '/checkout/failed',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default function PaymentFailedPage() {
  const whatsappUrl = buildGeneralInquiryWhatsAppUrl();

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Checkout' }, { label: 'Payment Status' }]} />
      </div>

      <section className="py-12 sm:py-16">
        <div className="site-container max-w-2xl space-y-8">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 border border-rose-500/20">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-500/10 px-3 py-0.5 rounded-full uppercase tracking-wider border border-rose-500/20">
                  Transaction Incomplete
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                  Payment Could Not Be Completed
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Your online transaction was interrupted, cancelled, or declined by your bank. No project funds were captured.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-2 text-xs text-[#475569]">
              <span className="font-bold text-[#131B2E] block">Common reasons for payment interruptions:</span>
              <ul className="space-y-1 pl-1">
                <li>• Bank or UPI payment session timed out before approval.</li>
                <li>• Payment modal was closed before the transaction completed.</li>
                <li>• Insufficient balance or daily UPI transaction limits reached.</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-xs font-bold text-[#131B2E] uppercase tracking-wider">
                What Would You Like to Do?
              </h2>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/get-quote"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#4338CA]/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Order or Customize Scope</span>
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-[#25D366]" />
                  <span>Discuss Alternative on WhatsApp</span>
                </a>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] border-t border-[#E2E8F0] pt-4">
              If an amount was debited by your bank, the funds will automatically reverse back to your source account within 2–4 banking hours as per standard RBI gateway protocols.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
