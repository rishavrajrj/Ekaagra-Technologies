'use client';

import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { serviceOptions, budgetOptions, contactMethods } from '@/lib/data';
import { buildContactSubmissionWhatsAppUrl } from '@/lib/whatsapp';
import type { ContactFormData } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle, MessageCircle, RefreshCw } from 'lucide-react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState<ContactFormData | null>(null);

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    organization: '',
    phone: '',
    email: '',
    service: '',
    budget: '',
    description: '',
    preferredContact: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    const res = await submitContactForm(formData);
    
    if (res.success) {
      setSuccessMsg(res.message);
      setSubmittedData({ ...formData });
      setFormData({
        name: '',
        organization: '',
        phone: '',
        email: '',
        service: '',
        budget: '',
        description: '',
        preferredContact: '',
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
    <div className="space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#E2E8F0] shadow-2xl">
      {/* ─── Success Confirmation Screen with WhatsApp Quick Action ── */}
      {successMsg && submittedData ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-emerald-950">
                  Enquiry Submitted Successfully!
                </h4>
                <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                  {successMsg} A confirmation email has also been dispatched to{' '}
                  <strong className="font-semibold">{submittedData.email}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Contextual WhatsApp Quick Action */}
          <div className="p-6 bg-[#FAF7F2] border border-[#E2E8F0] rounded-2xl text-center space-y-4">
            <div>
              <span className="text-xs font-mono font-bold text-[#F97360] uppercase tracking-widest block">
                Instant Communication
              </span>
              <h5 className="text-base font-extrabold text-[#131B2E] mt-1">
                Want a faster response?
              </h5>
              <p className="text-xs text-[#64748B] mt-0.5">
                Connect directly with our engineering team on WhatsApp with your submitted requirements.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <a
                href={buildContactSubmissionWhatsAppUrl(submittedData)}
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
                <span>Submit Another Enquiry</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── Main Form Inputs ────────────────────────────────────────── */
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-4 bg-red-500/10 text-red-800 border border-red-500/30 rounded-2xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Business or School Name
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
                placeholder="e.g. Acme Ltd or Greenfield School"
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
                placeholder="Mobile number for quick contact"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="service" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                Service Needed <span className="text-[#F97360]">*</span>
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
              >
                <option value="" className="text-[#94A3B8]">Select a service type...</option>
                {serviceOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="budget" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
                Target Budget
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
              >
                <option value="" className="text-[#94A3B8]">Select your budget range...</option>
                {budgetOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
              Project Goals &amp; Requirements <span className="text-[#F97360]">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] placeholder-[#94A3B8] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
              placeholder="Describe what kind of website or application you would like to build..."
            />
          </div>

          <div>
            <label htmlFor="preferredContact" className="block text-xs font-bold text-[#131B2E] uppercase tracking-wider mb-2">
              Preferred Response Method
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
              className="w-full bg-[#FAF7F2] border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#131B2E] focus:outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 text-sm transition-all"
            >
              <option value="" className="text-[#94A3B8]">Select preferred contact method...</option>
              {contactMethods.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4338CA] disabled:opacity-60 transition-all duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#4338CA]/25 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Sending...' : 'Send Enquiry'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
