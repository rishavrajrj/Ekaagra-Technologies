'use client';

import { useState } from 'react';
import { submitQuoteForm } from '@/app/actions';
import { serviceOptions, budgetOptions, timelineOptions } from '@/lib/data';
import { buildQuoteSubmissionWhatsAppUrl } from '@/lib/whatsapp';
import type { QuoteFormData } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle, MessageCircle, RefreshCw } from 'lucide-react';

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState<QuoteFormData | null>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    projectType: '',
    description: '',
    features: '',
    expectedUsers: '',
    budget: '',
    timeline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await submitQuoteForm(formData);
    
    if (res.success) {
      setSuccessMsg(res.message);
      setSubmittedData({ ...formData });
      setFormData({
        name: '',
        organization: '',
        phone: '',
        email: '',
        projectType: '',
        description: '',
        features: '',
        expectedUsers: '',
        budget: '',
        timeline: '',
      });
    } else {
      setErrorMsg(res.message);
    }
    
    setLoading(false);
  };

  const handleReset = () => {
    setSuccessMsg('');
    setErrorMsg('');
    setSubmittedData(null);
  };

  return (
    <div className="space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-2xl">
      {/* ─── Success Screen with WhatsApp Quick Action ──────────────── */}
      {successMsg && submittedData ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-emerald-950">
                  Quote Request Received!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  {successMsg} A confirmation email with your submitted scope has been sent to{' '}
                  <strong className="font-semibold">{submittedData.email}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Contextual WhatsApp Quick Action */}
          <div className="p-6 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl text-center space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                Direct Engineering Line
              </span>
              <h5 className="text-base font-extrabold text-[#131B2E] mt-1">
                Want to discuss your project now?
              </h5>
              <p className="text-xs text-[#64748B] mt-0.5">
                Connect directly with our lead architect on WhatsApp with your submitted requirements.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <a
                href={buildQuoteSubmissionWhatsAppUrl(submittedData)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-[#25D366]/25 transition-all text-xs uppercase tracking-wider cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Continue on WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#131B2E] font-bold py-3.5 px-5 rounded-xl border border-[#E2E8F0] transition-colors text-xs uppercase tracking-wider cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Submit Another Request</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Main Multi-Section Form ─────────────────────────────────── */
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 text-red-800 border border-red-500/30 rounded-2xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Contact Information */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center">1</span>
              <h3 className="text-sm font-bold text-[#131B2E] uppercase tracking-wider">
                Contact &amp; Business Information
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Your Name <span className="text-[#F97360]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="organization" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Company / School / Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                  placeholder="Organization or brand name"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Phone / WhatsApp <span className="text-[#F97360]">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                  placeholder="Mobile number for direct proposal"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Email Address <span className="text-[#F97360]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                  placeholder="you@company.com"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Project Specifications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="text-sm font-bold text-[#131B2E] uppercase tracking-wider">
                Project Scope &amp; Features
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label htmlFor="projectType" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Primary Solution Type <span className="text-[#F97360]">*</span>
                </label>
                <select
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                >
                  <option value="" className="text-[#94A3B8]">Select a project category...</option>
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="description" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Website / App Overview <span className="text-[#F97360]">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                  placeholder="What are the main pages, goals, or workflows you need implemented?"
                />
              </div>

              <div>
                <label htmlFor="features" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Specific Modules Needed (Optional)
                </label>
                <textarea
                  id="features"
                  name="features"
                  value={formData.features}
                  onChange={handleChange}
                  rows={3}
                  placeholder="e.g. Online admissions, Razorpay payments, notice board, photo gallery, admin dashboard..."
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="expectedUsers" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Expected Scale or User Count
                </label>
                <input
                  type="text"
                  id="expectedUsers"
                  name="expectedUsers"
                  value={formData.expectedUsers}
                  onChange={handleChange}
                  placeholder="e.g. 1,000 students / 50 daily orders"
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Budget & Timeline */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#4338CA] text-white text-xs font-bold flex items-center justify-center">3</span>
              <h3 className="text-sm font-bold text-[#131B2E] uppercase tracking-wider">
                Budget Target &amp; Timeline
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label htmlFor="budget" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Target Investment
                </label>
                <select
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                >
                  <option value="" className="text-[#94A3B8]">Select budget target...</option>
                  {budgetOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="timeline" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                  Desired Launch Timeline
                </label>
                <select
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                >
                  <option value="" className="text-[#94A3B8]">Select target timeline...</option>
                  {timelineOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA] disabled:opacity-60 transition-all duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#4338CA]/25 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Submitting...' : 'Get a Quote'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
