'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, RotateCcw, Check, Sparkles } from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { formatFeeCurrency } from '@/lib/feeCalculationEngine';

interface OverrideClassFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  feeName: string;
  feeCategory: string;
  inheritedAmount: number;
  frequency: string;
  existingCustomAmount?: number;
  isAlreadyOverridden?: boolean;
  onSaveOverride: (newAmount: number, notes?: string) => void;
  onResetToGlobal: () => void;
}

export default function OverrideClassFeeModal({
  isOpen,
  onClose,
  className,
  feeName,
  feeCategory,
  inheritedAmount,
  frequency,
  existingCustomAmount,
  isAlreadyOverridden = false,
  onSaveOverride,
  onResetToGlobal,
}: OverrideClassFeeModalProps) {
  const [customAmount, setCustomAmount] = useState<number | ''>('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setValidationError(null);
      return;
    }
    if (isAlreadyOverridden && typeof existingCustomAmount === 'number') {
      setCustomAmount(existingCustomAmount);
    } else {
      setCustomAmount(inheritedAmount);
    }
    setOverrideNotes('');
  }, [isOpen, isAlreadyOverridden, existingCustomAmount, inheritedAmount]);

  if (!isOpen) return null;

  const handleSave = () => {
    setValidationError(null);
    if (customAmount === '' || isNaN(Number(customAmount)) || Number(customAmount) < 0) {
      setValidationError('Please enter a valid, non-negative fee amount.');
      return;
    }

    onSaveOverride(Number(customAmount), overrideNotes.trim() || undefined);
    onClose();
  };

  const handleReset = () => {
    onResetToGlobal();
    onClose();
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isAlreadyOverridden ? 'Edit Class Override' : 'Override Fee for this Class'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set a specific exception for <strong>{className}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-xs text-slate-700">
            {/* Warning Banner (Rule 46) */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-amber-900 font-semibold">
                  You&apos;re overriding the common fee for {className}.
                </p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  All other classes will continue to inherit the default common fee amount (
                  <strong>{formatFeeCurrency(inheritedAmount)}</strong>). Only {className} will use this custom amount.
                </p>
              </div>
            </div>

            {/* Error Message */}
            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                {validationError}
              </div>
            )}

            {/* Context Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Class:</span>
                <span className="font-bold text-slate-900">{className}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Fee Component:</span>
                <span className="font-bold text-slate-900">{feeName} ({feeCategory})</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Default Common Fee:</span>
                <span className="font-mono text-slate-700 font-semibold">
                  {formatFeeCurrency(inheritedAmount)} / {frequency} <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-sans">Inherited</span>
                </span>
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Custom Amount for {className} (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-mono text-sm font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  placeholder="0"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Frequency: <span className="capitalize">{frequency}</span>
              </p>
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block font-bold text-slate-800 text-[11px] mb-1">
                Override Reason / Notes (Optional)
              </label>
              <input
                type="text"
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                placeholder="e.g. Higher lab fee component for senior secondary"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              {isAlreadyOverridden && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Common Fee</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs hover:shadow-md transition cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Override</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
