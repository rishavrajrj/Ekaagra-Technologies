import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, Calendar, Phone, Mail, Clock, FileText } from 'lucide-react';
import { getOrderByNumber, isSupabaseConfigured } from '@/lib/supabase';
import { createPageMetadata, SITE_URL, BRAND_EMAIL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { buildGeneralInquiryWhatsAppUrl } from '@/lib/whatsapp';

export const metadata: Metadata = createPageMetadata({
  title: 'Payment Confirmed | Ekaagra Technologies',
  description: 'Your project payment has been verified and confirmed. Project kickoff is underway.',
  path: '/checkout/success',
  noIndex: true, // Transaction receipt pages should not be publicly indexed
});

export const dynamic = 'force-dynamic';

interface SuccessPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedParams = await searchParams;
  const rawOrderNumber = resolvedParams.order_number;
  const orderNumber = typeof rawOrderNumber === 'string' ? rawOrderNumber.trim() : undefined;

  let orderData = null;
  if (orderNumber && isSupabaseConfigured()) {
    const res = await getOrderByNumber(orderNumber);
    if (res.success && res.data) {
      orderData = res.data;
    }
  }

  const isConfigured = isSupabaseConfigured();
  const isPaid = orderData ? orderData.payment_status === 'PAID' : !isConfigured && Boolean(orderNumber);
  const isPending = orderData?.payment_status === 'PENDING';
  const isFailed = orderData?.payment_status === 'FAILED';
  const notFound = isConfigured && Boolean(orderNumber) && !orderData;
  const noOrderParam = !orderNumber;

  const formattedAmount = orderData ? Number(orderData.amount_inr).toLocaleString('en-IN') : undefined;
  const whatsappUrl = buildGeneralInquiryWhatsAppUrl();

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Checkout' }, { label: isPaid ? 'Payment Confirmed' : 'Payment Status' }]} />
      </div>

      <section className="py-12 sm:py-16">
        <div className="site-container max-w-3xl space-y-8">
          {/* Main Confirmation / Status Card */}
          <div className={`bg-white border-2 ${
            isPaid ? 'border-emerald-500/30 shadow-emerald-500/10' :
            isPending ? 'border-amber-500/30 shadow-amber-500/10' :
            'border-rose-500/30 shadow-rose-500/10'
          } rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center sm:text-left relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${
              isPaid ? 'bg-emerald-500/5' : isPending ? 'bg-amber-500/5' : 'bg-rose-500/5'
            } rounded-full blur-2xl pointer-events-none`} />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className={`w-14 h-14 rounded-2xl ${
                isPaid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                isPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-rose-500/10 text-rose-600 border-rose-500/20'
              } flex items-center justify-center shrink-0 border`}>
                {isPaid ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : isPending ? (
                  <Clock className="w-8 h-8 animate-pulse" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>
              <div className="space-y-1">
                <span className={`text-[11px] font-mono font-bold ${
                  isPaid ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' :
                  isPending ? 'text-amber-700 bg-amber-500/10 border-amber-500/20' :
                  'text-rose-700 bg-rose-500/10 border-rose-500/20'
                } px-3 py-0.5 rounded-full uppercase tracking-wider border`}>
                  {isPaid
                    ? 'Payment Verified & Confirmed'
                    : isPending
                    ? 'Payment Pending Confirmation'
                    : notFound
                    ? 'Order Not Found'
                    : noOrderParam
                    ? 'No Order Specified'
                    : 'Payment Verification Required'}
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131B2E] tracking-tight">
                  {isPaid
                    ? 'Thank You for Choosing Ekaagra Technologies'
                    : isPending
                    ? 'Your Payment Is Being Confirmed'
                    : notFound || noOrderParam
                    ? 'Order Status Unavailable'
                    : 'Payment Verification Incomplete'}
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  {isPaid
                    ? 'Your online payment has been securely confirmed. An official receipt has been dispatched to your email address.'
                    : isPending
                    ? 'We have received the payment dispatch and are awaiting final webhook clearance from Razorpay. This typically concludes within 1–2 minutes.'
                    : 'We could not verify a confirmed payment for this reference. Please check your banking app or contact our billing desk with your payment ID.'}
                </p>
              </div>
            </div>

            {/* Receipt Details Strip */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#64748B] block">Order Number</span>
                  <span className="font-mono font-extrabold text-[#131B2E] text-sm">
                    {orderData?.order_number || orderNumber || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-[#64748B] block">Payment Status</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    isPaid ? 'text-emerald-700' : isPending ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isPaid ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                    }`}></span>
                    {orderData?.payment_status || (isPaid ? 'PAID' : notFound ? 'RECORD NOT FOUND' : 'UNCONFIRMED')}
                  </span>
                </div>

                {orderData && (
                  <>
                    <div>
                      <span className="text-[#64748B] block">Client Name</span>
                      <span className="font-bold text-[#131B2E]">{orderData.customer_name}</span>
                    </div>

                    <div>
                      <span className="text-[#64748B] block">Service Package</span>
                      <span className="font-bold text-[#131B2E]">
                        {orderData.metadata?.planName || orderData.service_type}
                      </span>
                    </div>
                  </>
                )}

                {formattedAmount && (
                  <div className="sm:col-span-2 border-t border-[#E2E8F0] pt-2 flex items-center justify-between">
                    <span className="text-[#64748B] font-medium">Total Amount Paid:</span>
                    <span className="text-lg font-mono font-extrabold text-[#4338CA]">
                      ₹{formattedAmount}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps Guidance */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-[#131B2E] uppercase tracking-wider">
                What Happens Next in Your Project:
              </h2>
              <div className="grid sm:grid-cols-3 gap-3 text-xs text-[#334155]">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#4338CA] block">1. Intake Review</span>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    Our engineering studio reviews your design preferences, color palette, and business copy.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#4338CA] block">2. Staging Preview</span>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    You receive a private staging URL to test mobile responsiveness and request layout revisions.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#4338CA] block">3. Domain Launch</span>
                  <p className="text-[#64748B] text-[11px] leading-relaxed">
                    We configure SSL encryption, map your official domain name, and deploy your project live.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <span>Connect with Team on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-white hover:bg-slate-50 text-[#131B2E] border border-[#E2E8F0] text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>Return to Homepage</span>
              </Link>
            </div>
          </div>

          {/* Assistance Note */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-4 text-xs text-[#64748B]">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Need to share additional media or school circulars? Email our desk at{' '}
                <a href={`mailto:${BRAND_EMAIL}`} className="text-[#4338CA] font-semibold hover:underline">
                  {BRAND_EMAIL}
                </a>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
