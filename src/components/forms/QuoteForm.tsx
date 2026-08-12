'use client';

import { useState } from 'react';
import { submitQuoteForm } from '@/app/actions';
import { serviceOptions, budgetOptions, timelineOptions } from '@/lib/data';
import type { QuoteFormData } from '@/lib/types';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-[#0e1320] p-8 sm:p-10 rounded-2xl border border-white/10 shadow-2xl">
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

      {/* Section 1: Contact Information */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          01. Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
              Company / School / Organization
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
              placeholder="Organization name"
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
              placeholder="Phone number"
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
      </section>

      {/* Section 2: Project Specifications */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          02. Project Specifications
        </h3>
        <div className="space-y-4 pt-2">
          <div>
            <label htmlFor="projectType" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Project Type <span className="text-blue-400">*</span>
            </label>
            <select
              id="projectType"
              name="projectType"
              value={formData.projectType}
              onChange={handleChange}
              required
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            >
              <option value="" className="bg-[#080b13] text-slate-400">Select a project type...</option>
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
              ))}
            </select>
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
              placeholder="Detailed description of what you want to build..."
            />
          </div>
          <div>
            <label htmlFor="features" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Key Required Modules / Features
            </label>
            <textarea
              id="features"
              name="features"
              value={formData.features}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Student Management, Attendance, Fee Receipts, Parent Portal, Reports..."
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            />
          </div>
          <div>
            <label htmlFor="expectedUsers" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Expected User Scale
            </label>
            <input
              type="text"
              id="expectedUsers"
              name="expectedUsers"
              value={formData.expectedUsers}
              onChange={handleChange}
              placeholder="e.g. 500 students, 30 teachers"
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Budget & Timeline */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          03. Timeline &amp; Budget
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div>
            <label htmlFor="budget" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Budget
            </label>
            <select
              id="budget"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            >
              <option value="" className="bg-[#080b13] text-slate-400">Select budget target...</option>
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="timeline" className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Desired Timeline
            </label>
            <select
              id="timeline"
              name="timeline"
              value={formData.timeline}
              onChange={handleChange}
              className="w-full bg-[#080b13] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
            >
              <option value="" className="bg-[#080b13] text-slate-400">Select timeline...</option>
              {timelineOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#080b13] text-white">{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 transition-all duration-200 text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Calculating Estimate...' : 'Submit Quote Request'}
      </button>
    </form>
  );
}

