'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, X, Check, AlertCircle, Info } from 'lucide-react';
import { maintenanceCoverage } from '@/lib/data';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaintenanceModal({ isOpen, onClose }: MaintenanceModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="maintenance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close maintenance guide"
          className="absolute top-5 right-5 p-2 rounded-full text-[#64748B] hover:text-[#131B2E] hover:bg-[#FAF7F2] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>✓ Maintenance Included On All Website Plans</span>
          </div>
          <h3 id="maintenance-modal-title" className="text-xl sm:text-2xl font-extrabold text-[#131B2E]">
            What Does Website Maintenance Include?
          </h3>
          <p className="text-xs sm:text-sm text-[#4338CA] font-medium leading-relaxed">
            &ldquo;{maintenanceCoverage.definition}&rdquo;
          </p>
        </div>

        {/* Included & Excluded Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Included Scope */}
          <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Included in Maintenance</span>
            </div>
            <ul className="space-y-2">
              {maintenanceCoverage.included.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#334155] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not Included Scope */}
          <div className="bg-[#FAF7F2] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] space-y-3">
            <div className="flex items-center gap-2 text-[#F97360] font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4 text-[#F97360] shrink-0" />
              <span>Not Included (Priced Separately)</span>
            </div>
            <ul className="space-y-2">
              {maintenanceCoverage.notIncluded.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#64748B] leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97360] mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Transparency Alert */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#4338CA]/5 border border-[#4338CA]/20 text-xs text-[#334155] leading-relaxed">
          <Info className="w-4 h-4 text-[#4338CA] shrink-0 mt-0.5" />
          <p>{maintenanceCoverage.disclaimer}</p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#4338CA]/20 cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceTriggerButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-1.5 text-[11px] text-[#4338CA] hover:text-[#3730A3] font-semibold underline underline-offset-2 hover:underline-offset-4 transition-all cursor-pointer"
    >
      <Info className="w-3.5 h-3.5 shrink-0" />
      <span>What does maintenance include?</span>
    </button>
  );
}
