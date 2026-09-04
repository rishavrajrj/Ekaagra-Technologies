'use client';

import { useState } from 'react';
import { CreditCard, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import type { Order } from '@/lib/types';

interface PayOrderClientProps {
  order: Order;
  keyId?: string;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as unknown as { Razorpay: unknown }).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PayOrderClient({ order, keyId }: PayOrderClientProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setPaying(true);
    setError('');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setError('Unable to load payment gateway checkout. Please check your internet connection.');
        setPaying(false);
        return;
      }

      let gatewayOrderId = order.gateway_order_id;

      // If gateway order wasn't created yet or needs creation
      if (!gatewayOrderId) {
        const createRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            serviceType: order.service_type,
            isCustomPaymentLink: true,
            customAmountINR: order.amount_inr,
            customDescription: order.metadata?.milestoneDescription || order.service_type,
          }),
        });

        const data = await createRes.json();
        if (!createRes.ok || !data.success) {
          setError(data.error || 'Failed to initialize payment gateway.');
          setPaying(false);
          return;
        }
        gatewayOrderId = data.gatewayOrderId;
      }

      const razorpayWindow = window as unknown as {
        Razorpay: new (options: Record<string, unknown>) => {
          open: () => void;
          on: (event: string, callback: (resp: Record<string, unknown>) => void) => void;
        };
      };

      const options = {
        key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(Number(order.amount_inr) * 100),
        currency: 'INR',
        name: 'Ekaagra Technologies',
        description: `${order.metadata?.planName || order.service_type} (${order.order_number})`,
        order_id: gatewayOrderId,
        prefill: {
          name: order.customer_name,
          email: order.customer_email,
          contact: order.customer_phone,
        },
        theme: {
          color: '#4338CA',
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderNumber: order.order_number,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyRes.ok && verifyData.success) {
              window.location.href = `/checkout/success?order_number=${order.order_number}`;
            } else {
              window.location.href = `/checkout/failed?order_number=${order.order_number}`;
            }
          } catch {
            window.location.href = `/checkout/failed?order_number=${order.order_number}`;
          }
        },
      };

      const rzp = new razorpayWindow.Razorpay(options);
      rzp.on('payment.failed', () => {
        window.location.href = `/checkout/failed?order_number=${order.order_number}`;
      });
      rzp.open();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'An unexpected error occurred.');
      setPaying(false);
    }
  };

  if (order.payment_status === 'PAID') {
    return (
      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="text-lg font-extrabold text-emerald-900">This invoice has been settled</h3>
        <p className="text-xs text-emerald-700">
          Payment of ₹{Number(order.amount_inr).toLocaleString('en-IN')} was received and confirmed.
        </p>
        <a
          href={`/checkout/success?order_number=${order.order_number}`}
          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#4338CA] hover:underline"
        >
          View Official Receipt &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={paying}
        className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
      >
        {paying ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Connecting to Payment Gateway...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ₹{Number(order.amount_inr).toLocaleString('en-IN')} Online</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Secured by Razorpay • UPI, Credit/Debit Cards, NetBanking</span>
      </div>
    </div>
  );
}
