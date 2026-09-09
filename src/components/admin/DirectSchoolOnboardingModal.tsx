'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createDirectSchoolProjectAction } from '@/app/schoolProjectActions';
import {
  X,
  Plus,
  School,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from 'lucide-react';

interface DirectSchoolOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectNumber: string) => void;
}

const SCHOOL_PRODUCTS = [
  { id: 'school-website', label: 'School Website', desc: 'Modern responsive school public website' },
  { id: 'school-website-cms', label: 'Website + CMS', desc: 'Public portal with full dynamic content management' },
  { id: 'school-erp', label: 'Core ERP Platform', desc: 'Student, fee, staff, attendance & marks ERP' },
  { id: 'school-complete', label: 'Complete Digital Suite', desc: 'Website + CMS + Full ERP platform integration' },
] as const;

export default function DirectSchoolOnboardingModal({
  isOpen,
  onClose,
  onProjectCreated,
}: DirectSchoolOnboardingModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    schoolName: '',
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactDesignation: 'Principal / Director',
    productId: 'school-complete' as 'school-website' | 'school-website-cms' | 'school-erp' | 'school-complete',
    city: '',
    state: 'Bihar',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [createdResult, setCreatedResult] = useState<{
    projectId: string;
    projectNumber: string;
    invitationCode: string;
    onboardingUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.schoolName.trim()) errs.schoolName = 'School name is required';
    if (!formData.primaryContactName.trim()) errs.primaryContactName = 'Contact person name is required';
    if (!formData.primaryContactEmail.trim() || !formData.primaryContactEmail.includes('@')) {
      errs.primaryContactEmail = 'Valid email is required';
    }
    const cleanPhone = formData.primaryContactPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.primaryContactPhone = 'Valid 10-digit phone number is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;

    startTransition(async () => {
      const res = await createDirectSchoolProjectAction({
        schoolName: formData.schoolName.trim(),
        primaryContactName: formData.primaryContactName.trim(),
        primaryContactEmail: formData.primaryContactEmail.trim().toLowerCase(),
        primaryContactPhone: formData.primaryContactPhone.trim(),
        primaryContactDesignation: formData.primaryContactDesignation.trim() || undefined,
        productId: formData.productId,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
      });

      if (res.success && res.project) {
        setCreatedResult({
          projectId: res.project.id,
          projectNumber: res.project.project_number,
          invitationCode: res.invitationCode || '',
          onboardingUrl: res.onboardingUrl || `/school-onboarding/${res.invitationCode}`,
        });
        onProjectCreated(res.project.project_number);
      } else {
        alert(res.error || 'Failed to initiate school onboarding');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fadeIn">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Start School Onboarding
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct school enrollment in the Schools Platform database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {createdResult ? (
            <div className="py-4 space-y-6 text-center animate-fadeIn">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400 px-3 py-1 bg-violet-50 dark:bg-violet-950/60 rounded-full border border-violet-200 dark:border-violet-800">
                  {createdResult.projectNumber}
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white pt-2">
                  School Onboarding Initiated!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {formData.schoolName} has been established in the Schools Platform database. Provide the authenticated onboarding link to the school administrator.
                </p>
              </div>

              {/* Secure Link Box */}
              <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-violet-900 dark:text-violet-300">
                    School Onboarding Link
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    🔒 Token Protected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      typeof window !== 'undefined'
                        ? `${window.location.origin}${createdResult.onboardingUrl}`
                        : createdResult.onboardingUrl
                    }
                    className="flex-1 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 truncate focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const full = `${window.location.origin}${createdResult.onboardingUrl}`;
                      navigator.clipboard.writeText(full);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/admin/school-projects/${createdResult.projectId}`);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-violet-700 hover:bg-violet-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Open School Workspace
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.open(createdResult.onboardingUrl, '_blank');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open Onboarding Form</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  School Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      School / Institution Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. St. Xavier High School"
                      value={formData.schoolName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, schoolName: e.target.value }))}
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                        formErrors.schoolName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.schoolName && <p className="text-[10px] text-rose-500 mt-1">{formErrors.schoolName}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Fr. Augustine / Dr. R. Sharma"
                      value={formData.primaryContactName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryContactName: e.target.value }))}
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                        formErrors.primaryContactName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.primaryContactName && (
                      <p className="text-[10px] text-rose-500 mt-1">{formErrors.primaryContactName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Designation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Principal / Director"
                      value={formData.primaryContactDesignation}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryContactDesignation: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. principal@stxavier.edu.in"
                      value={formData.primaryContactEmail}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryContactEmail: e.target.value }))}
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                        formErrors.primaryContactEmail ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.primaryContactEmail && (
                      <p className="text-[10px] text-rose-500 mt-1">{formErrors.primaryContactEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 94724 64645"
                      value={formData.primaryContactPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryContactPhone: e.target.value }))}
                      className={`w-full bg-white dark:bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none ${
                        formErrors.primaryContactPhone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {formErrors.primaryContactPhone && (
                      <p className="text-[10px] text-rose-500 mt-1">{formErrors.primaryContactPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Motihari"
                      value={formData.city}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bihar"
                      value={formData.state}
                      onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Product Selection */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  School Solution Tier
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SCHOOL_PRODUCTS.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, productId: prod.id }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.productId === prod.id
                          ? 'border-violet-600 dark:border-violet-500 bg-violet-50/70 dark:bg-violet-950/50 ring-1 ring-violet-500'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{prod.label}</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{prod.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isPending}
                  className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isPending ? 'Initiating...' : 'Start School Onboarding'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
