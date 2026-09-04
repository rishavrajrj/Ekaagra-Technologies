import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderByNumber } from '@/lib/supabase';
import { getRazorpayKeyId } from '@/lib/razorpay';
import { createPageMetadata, SITE_URL } from '@/lib/seo.config';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import PayOrderClient from '@/components/forms/PayOrderClient';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PayPageProps {
  params: Promise<{ orderNumber: string }>;
}

export async function generateMetadata({ params }: PayPageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  return createPageMetadata({
    title: `Payment for Invoice ${orderNumber} | Ekaagra Technologies`,
    description: `Secure online payment gateway for Ekaagra Technologies order ${orderNumber}.`,
    path: `/pay/${orderNumber}`,
    noIndex: true,
  });
}

export default async function PayOrderPage({ params }: PayPageProps) {
  const { orderNumber } = await params;

  if (!orderNumber || orderNumber.trim() === '') {
    notFound();
  }

  const orderRes = await getOrderByNumber(orderNumber.trim());
  if (!orderRes.success || !orderRes.data) {
    notFound();
  }

  const order = orderRes.data;
  const keyId = getRazorpayKeyId();
  const formattedAmount = Number(order.amount_inr).toLocaleString('en-IN');

  return (
    <div className="bg-[#FAF7F2] text-[#131B2E] min-h-screen">
      <div className="site-container pt-6 pb-2">
        <Breadcrumbs items={[{ label: 'Invoices' }, { label: order.order_number }]} />
      </div>

      <section className="py-12 sm:py-16">
        <div className="site-container max-w-xl space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Header */}
            <div className="border-b border-[#E2E8F0] pb-5 space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#4338CA] bg-[#4338CA]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Official Ekaagra Invoice
              </span>
              <h1 className="text-2xl font-extrabold text-[#131B2E]">
                Invoice {order.order_number}
              </h1>
              <p className="text-xs text-[#64748B]">
                Issued for {order.customer_name}
              </p>
            </div>

            {/* Invoice Details */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E2E8F0] space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Description / Scope:</span>
                  <strong className="text-[#131B2E] text-right max-w-[240px] truncate">
                    {order.metadata?.planName || order.service_type}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Customer Phone:</span>
                  <span className="font-mono">{order.customer_phone}</span>
                </div>

                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Invoice Date:</span>
                  <span>{new Date(order.created_at).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              <div className="border-t border-[#E2E8F0] pt-3 flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase text-[#131B2E]">Payable Total:</span>
                <span className="text-2xl font-mono font-extrabold text-[#4338CA]">
                  ₹{formattedAmount}
                </span>
              </div>
            </div>

            {/* Interactive Checkout Handler */}
            <PayOrderClient order={order} keyId={keyId} />
          </div>

          <div className="text-center text-xs text-[#64748B] space-y-1">
            <p>Ekaagra Technologies • Motihari, East Champaran, Bihar, India</p>
            <p>100% digital fulfillment • Full code and domain ownership</p>
          </div>
        </div>
      </section>
    </div>
  );
}
