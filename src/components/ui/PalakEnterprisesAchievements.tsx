'use client';

import { useState } from 'react';
import {
  CreditCard,
  Zap,
  ShieldCheck,
  Calculator,
  Activity,
  Globe,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  QrCode,
  Smartphone,
  FileCheck,
  Package,
  HardDrive,
  Check,
  AlertCircle
} from 'lucide-react';

export default function PalakEnterprisesAchievements() {
  const [activePaymentStep, setActivePaymentStep] = useState<number>(2);

  const paymentSteps = [
    {
      step: '01',
      title: 'Job & Specs Selection',
      desc: 'Customer selects document type, color/B&W, paper GSM, and copies.',
      status: 'complete',
    },
    {
      step: '02',
      title: 'Direct Cloud Upload',
      desc: 'High-speed PDF/document upload to secure Supabase storage buckets.',
      status: 'complete',
    },
    {
      step: '03',
      title: 'Razorpay Instant Checkout',
      desc: 'Seamless payment via UPI (PhonePe, GPay, Paytm), QR code, or Cards.',
      status: 'active',
    },
    {
      step: '04',
      title: 'Webhook & Order ID Generation',
      desc: 'Server-side transaction verification with instant digital receipt.',
      status: 'upcoming',
    },
    {
      step: '05',
      title: 'Express Counter Pickup',
      desc: 'Customer skips the in-shop queue and collects the packaged print job.',
      status: 'upcoming',
    },
  ];

  return (
    <section className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden p-6 sm:p-10 space-y-12">
      {/* Section Header */}
      <div className="space-y-3 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5 text-[#F97360]" />
          PROVEN PROJECT DELIVERABLES • PALAK ENTERPRISES
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#131B2E] tracking-tight">
          What We Achieved in Palak Enterprises
        </h2>
        <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
          From full Razorpay payment automation to queue-bypassing workflows and zero-malware cloud
          document handling, here is how Ekaagra Technologies modernized Chakia&apos;s commercial print hub.
        </p>
      </div>

      {/* Impact Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E2E8F0] text-center space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-[#4338CA] tracking-tight">
            -75%
          </span>
          <span className="block text-xs font-bold text-[#131B2E]">Counter Wait Time</span>
          <span className="block text-[11px] text-[#64748B]">Peak queue reduction</span>
        </div>

        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E2E8F0] text-center space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">
            100%
          </span>
          <span className="block text-xs font-bold text-[#131B2E]">Payment Reconciliation</span>
          <span className="block text-[11px] text-[#64748B]">Zero cash discrepancy</span>
        </div>

        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E2E8F0] text-center space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-[#131B2E] tracking-tight">
            500+
          </span>
          <span className="block text-xs font-bold text-[#131B2E]">Online Orders</span>
          <span className="block text-[11px] text-[#64748B]">Processed without queues</span>
        </div>

        <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E2E8F0] text-center space-y-1">
          <span className="text-3xl sm:text-4xl font-black text-[#F97360] tracking-tight">
            0
          </span>
          <span className="block text-xs font-bold text-[#131B2E]">Malware Incidents</span>
          <span className="block text-[11px] text-[#64748B]">Ended USB virus risks</span>
        </div>
      </div>

      {/* Feature 1 Spotlight: Successful Razorpay Payment Integration */}
      <div className="bg-gradient-to-br from-[#131B2E] to-[#1E293B] rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden space-y-8">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#4338CA]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6 relative z-10">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              VERIFIED SUCCESSFUL INTEGRATION
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Razorpay Online Payment Gateway Integration
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider">
              Live in Production
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold uppercase tracking-wider">
              UPI • Cards • NetBanking
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Left Description */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We engineered a seamless, zero-friction checkout pipeline for Palak Enterprises using{' '}
              <strong className="text-white">Razorpay Payment Gateway</strong>. Customers can instantly pay
              via any UPI app (Google Pay, PhonePe, Paytm, BHIM), scan dynamic UPI QR codes, or use Debit/Credit
              cards and NetBanking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Pre-Pay to Skip Queue</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Customers pay online prior to visiting the shop, allowing their jobs to be printed in advance and picked up instantly.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Automated Webhook Ledger</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every transaction is validated server-side with zero payment drops, automatic invoice generation, and ledger synchronization.
                </p>
              </div>
            </div>

            {/* Supported Payment Channels */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Supported Payment Methods:
              </span>
              <div className="flex flex-wrap gap-2">
                {['UPI Apps (GPay, PhonePe, Paytm)', 'Dynamic QR Code', 'Debit / Credit Cards', 'NetBanking (50+ Banks)', 'Pay-on-Pickup Option'].map((method, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium bg-white/10 text-slate-200 px-3 py-1 rounded-lg border border-white/10"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Interactive Payment Flow Stepper */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block">
              PRODUCTION CHECKOUT WORKFLOW
            </span>

            <div className="space-y-3">
              {paymentSteps.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => setActivePaymentStep(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    activePaymentStep === idx
                      ? 'bg-white/15 border-amber-400 shadow-md'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      STEP {s.step}
                    </span>
                    {idx <= 2 && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Live Tested
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{s.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2: Before & After Operational Transformation */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
            OPERATIONAL TRANSFORMATION
          </span>
          <h3 className="text-2xl font-extrabold text-[#131B2E]">
            Before vs. After Ekaagra Web Application
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-red-50/50 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm uppercase tracking-wider">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Before: Manual Bottlenecks &amp; USB Drives</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-red-950/80">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Customers stood in 25 to 45-minute queues just to get standard documents printed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>File sharing via infected USB pen drives frequently caused workstation malware and corrupted files.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Manual price calculations per order caused billing delays, disputes, and cash ledger discrepancies.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Zero order tracking — customers had to wait in front of the counter repeatedly asking for status.</span>
              </li>
            </ul>
          </div>

          {/* After */}
          <div className="bg-emerald-50/50 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>After: &ldquo;Send • Choose • Collect&rdquo; Digital Platform</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-emerald-950/90 font-medium">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Zero wait time: Customers upload files from home or college and collect ready prints.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Direct encrypted cloud upload to Supabase completely eliminated USB virus infections.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>100% automated Razorpay online payment gateway with instant QR codes, UPI, and digital receipts.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Transparent live order tracking via unique Order ID and customer phone numbers.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature 3: Core Technical Deliverables Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono font-bold text-[#4338CA] uppercase tracking-widest block">
            TECHNICAL CAPABILITIES
          </span>
          <h3 className="text-2xl font-extrabold text-[#131B2E]">
            Delivered Core Modules &amp; Systems
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#131B2E]">Dynamic Print Price Calculator</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Auto-calculates prices based on page count, color vs B&amp;W, paper GSM (75 up to 350 GSM), single vs double-sided duplexing, and lamination.
            </p>
          </div>

          <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#131B2E]">5-Stage Live Order Stepper</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Real-time customer status tracker: Order Placed → File Verified → In Printing → Ready for Pickup → Completed, searchable via mobile number.
            </p>
          </div>

          <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F97360]/10 text-[#F97360] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-[#131B2E]">CSC Citizen &amp; Digital Hub</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Centralized digital counter for Chakia residents to access Bihar government forms, student admit cards, PAN card updates, and citizen utilities.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
