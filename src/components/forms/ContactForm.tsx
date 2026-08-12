'use client';

import { useState } from 'react';
import { submitContactForm } from '@/app/actions';
import { serviceOptions, budgetOptions, contactMethods } from '@/lib/data';
import type { ContactFormData } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0e1320] p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl">
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Name <span className="text-blue-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="organization" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Business / Organization
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            placeholder="Company or institution name"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Phone <span className="text-blue-400">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            placeholder="Phone number with area code"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Email <span className="text-blue-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            placeholder="you@domain.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="service" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Service Required <span className="text-blue-400">*</span>
          </label>
          <select
            id="service"
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
          >
            <option value="" className="bg-[#080b13] text-slate-400">Select a service...</option>
            {serviceOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="budget" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Budget Range
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
          >
            <option value="" className="bg-[#080b13] text-slate-400">Select a budget range...</option>
            {budgetOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Project Description <span className="text-blue-400">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
          placeholder="Briefly describe what you are trying to achieve..."
        />
      </div>

      <div>
        <label htmlFor="preferredContact" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Preferred Contact Method
        </label>
        <select
          id="preferredContact"
          name="preferredContact"
          value={formData.preferredContact}
          onChange={handleChange}
          className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
        >
          <option value="" className="bg-[#080b13] text-slate-400">Select contact method...</option>
          {contactMethods.map((opt) => (
            <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 transition-all duration-200 text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Submitting Requirement...' : 'Start a Project Inquiry'}
      </button>
    </form>
  );
}

